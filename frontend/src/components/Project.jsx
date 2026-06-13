import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaMicrophone, FaRobot, FaStop, FaUser } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";

const Project = () => {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hello! I'm your AI trading assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const normalizeAIResponse = (text) => text?.replace(/\*\*/g, "") ?? "No response generated";

  const isLikelyHeading = (line) => {
    if (!line) return false;

    if (/^[A-Z][A-Za-z0-9 .&-]{1,40}\s*\([A-Z]{1,6}\)$/.test(line)) {
      return true;
    }

    return /^[A-Z][A-Za-z0-9 .&-]{1,32}$/.test(line) && !/[.:]/.test(line);
  };

  const parseAIResponse = (text) => {
    const lines = normalizeAIResponse(text).split(/\r?\n/);
    const blocks = [];
    let paragraphLines = [];
    let bulletItems = [];
    let activeBullet = "";

    const flushParagraph = () => {
      if (paragraphLines.length) {
        blocks.push({ type: "paragraph", text: paragraphLines.join(" ").trim() });
        paragraphLines = [];
      }
    };

    const flushBullet = () => {
      if (activeBullet) {
        bulletItems.push(activeBullet.trim());
        activeBullet = "";
      }
    };

    const flushBullets = () => {
      flushBullet();
      if (bulletItems.length) {
        blocks.push({ type: "bullets", items: bulletItems });
        bulletItems = [];
      }
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line || /^[-*]{3,}$/.test(line)) {
        flushParagraph();
        flushBullets();
        return;
      }

      if (isLikelyHeading(line) && !activeBullet) {
        flushParagraph();
        flushBullets();
        blocks.push({ type: "heading", text: line });
        return;
      }

      const bulletMatch = line.match(/^[*-]\s+(.*)$/);

      if (bulletMatch) {
        flushParagraph();
        flushBullet();
        activeBullet = bulletMatch[1];
        return;
      }

      if (activeBullet) {
        activeBullet += ` ${line}`;
        return;
      }

      paragraphLines.push(line);
    });

    flushParagraph();
    flushBullets();

    return blocks;
  };

  const renderMessageContent = (content) => {
    const blocks = parseAIResponse(content);

    return blocks.map((block, blockIndex) => {
      if (block.type === "heading") {
        return (
          <div key={blockIndex} className="text-[#3affa3] font-semibold text-[15px] tracking-wide">
            {block.text}
          </div>
        );
      }

      if (block.type === "bullets") {
        return (
          <ul key={blockIndex} className="space-y-3">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3 leading-relaxed text-[15px] text-white/95">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#3affa3] shadow-[0_0_8px_rgba(58,255,163,0.8)]" />
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={blockIndex} className="text-[15px] whitespace-pre-wrap leading-relaxed text-white/90">
          {block.text}
        </p>
      );
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const prompt = inputMessage;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: prompt,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate bot response
    setTimeout(async () => {
      try {
        const response = await axios.post("http://localhost:3000/ai/get-result", { prompt });
        console.log(response);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: normalizeAIResponse(response.data.result),
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 2000);

    setInputMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Add voice recording logic here
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="h-screen bg-gradient-to-b pt-16 from-black to-[#0a0a0a] flex justify-center items-center font-sans p-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-black to-[#0a0a0a] flex flex-col rounded-xl shadow-[0_0_20px_rgba(58,255,163,0.3)]">
        {/* Header */}
        <div className="bg-[#0a0a0a] p-4 border-b border-[#1a1a1a] shadow-[0_0_15px_rgba(58,255,163,0.3)] rounded-t-xl">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="bg-[#1a1a1a] p-3 rounded-xl">
                <FaRobot className="text-3xl text-[#3affa3]" />
              </div>
              <div>
                <h2 className="text-2xl text-[#3affa3] font-bold tracking-tight ">
                  ZELBI AI
                </h2>
                <p className="text-sm text-[#3affa3]/70">Online</p>
              </div>
            </div>
            <button className="text-[#3affa3] hover:text-[#32e092] transition-colors">
              <BsThreeDotsVertical className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-scroll max-h-[470px] p-6 space-y-4 bg-gradient-to-b from-black to-[#0a0a0a]">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
            >
              <div
                className={`flex items-start space-x-3 max-w-[85%] ${
                  message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    message.type === "user" ? "bg-[#1a1a1a]" : "bg-[#0a0a0a]"
                  }`}
                >
                  {message.type === "user" ? (
                    <FaUser className="text-xl text-[#3affa3]" />
                  ) : (
                    <FaRobot className="text-xl text-[#3affa3]" />
                  )}
                </div>
                <div
                  className={`p-4 rounded-xl ${
                    message.type === "user" ? "bg-[#1a1a1a]" : "bg-[#0a0a0a]/50"
                  } text-white shadow-[0_0_10px_rgba(58,255,163,0.2)] backdrop-blur-md border border-[#3affa3]/20 hover:border-[#3affa3]/40 transition-all duration-300`}
                >
                  {message.type === "bot" ? (
                    <div className="space-y-3 text-base">{renderMessageContent(message.content)}</div>
                  ) : (
                    <p className="text-base whitespace-pre-wrap">{message.content}</p>
                  )}
                  <span className="text-xs mt-2 block text-[#3affa3]/70">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-2 text-[#3affa3]">
              <div
                className="w-2 h-2 bg-[#3affa3] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-[#3affa3] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-[#3affa3] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="bg-[#0a0a0a] p-4 border-t border-[#1a1a1a] shadow-[0_0_15px_rgba(58,255,163,0.3)] rounded-b-xl">
          <div className="flex items-center space-x-4 w-full">
            <motion.button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isRecording
                  ? "bg-red-900 text-white shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                  : "bg-[#1a1a1a] text-[#3affa3] hover:bg-[#2a2a2a] hover:shadow-[0_0_15px_rgba(58,255,163,0.5)]"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isRecording ? (
                <FaStop className="text-xl" />
              ) : (
                <FaMicrophone className="text-xl" />
              )}
            </motion.button>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows="1"
              className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-6 py-3 border border-[#3affa3]/20 focus:outline-none focus:ring-2 focus:ring-[#3affa3] focus:shadow-[0_0_15px_rgba(58,255,163,0.5)] transition-all duration-300 text-base resize-none min-h-[48px] max-h-32 overflow-y-auto"
            />
            <motion.button
              type="submit"
              className="bg-[#3affa3] text-black p-3 rounded-xl shadow-[0_0_15px_rgba(58,255,163,0.5)] hover:bg-[#32e092] hover:shadow-[0_0_25px_rgba(58,255,163,0.8)] transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IoMdSend className="text-2xl" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Project;