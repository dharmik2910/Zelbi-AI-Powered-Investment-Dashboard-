import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCrown, FaMicrophone, FaRobot, FaStop, FaUser } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { HiSparkles } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../slices/profileSlice";

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const PLAN_LIMITS = { free: 5, pro: 100, elite: -1 };

const getPlanLimit = (plan) => PLAN_LIMITS[plan] ?? 5;

const PlanBadge = ({ plan }) => {
  const styles = {
    free: { label: "Free", color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
    pro: { label: "Pro", color: "#3affa3", bg: "rgba(58,255,163,0.1)" },
    elite: { label: "Elite ✨", color: "#facc15", bg: "rgba(250,204,21,0.1)" },
  };
  const s = styles[plan] || styles.free;
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}30` }}
    >
      {s.label}
    </span>
  );
};

const AiAssistant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);

  const plan = user?.subscriptionPlan || "free";
  const promptCount = user?.aiPromptCount || 0;
  const promptLimit = getPlanLimit(plan);
  const isLimited = promptLimit !== -1 && promptCount >= promptLimit;

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (error) {
        console.error("Error parsing saved messages:", error);
      }
    }
    return [
      {
        type: "bot",
        content: "Hello! I'm your AI trading assistant. How can I help you today?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.title = "Zelbi | AI Assistant";
    return () => {
      document.title = "Zelbi";
    };
  }, []);

  const normalizeAIResponse = (text) => text?.replace(/\*\*/g, "") ?? "No response generated";

  const isLikelyHeading = (line) => {
    if (!line) return false;
    if (/^[A-Z][A-Za-z0-9 .&-]{1,40}\s*\([A-Z]{1,6}\)$/.test(line)) return true;
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
      if (activeBullet) { bulletItems.push(activeBullet.trim()); activeBullet = ""; }
    };
    const flushBullets = () => {
      flushBullet();
      if (bulletItems.length) { blocks.push({ type: "bullets", items: bulletItems }); bulletItems = []; }
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || /^[-*]{3,}$/.test(line)) { flushParagraph(); flushBullets(); return; }
      if (isLikelyHeading(line) && !activeBullet) { flushParagraph(); flushBullets(); blocks.push({ type: "heading", text: line }); return; }
      const bulletMatch = line.match(/^[*-]\s+(.*)$/);
      if (bulletMatch) { flushParagraph(); flushBullet(); activeBullet = bulletMatch[1]; return; }
      if (activeBullet) { activeBullet += ` ${line}`; return; }
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
        return <div key={blockIndex} className="text-[#3affa3] font-semibold text-[15px] tracking-wide">{block.text}</div>;
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
      return <p key={blockIndex} className="text-[15px] whitespace-pre-wrap leading-relaxed text-white/90">{block.text}</p>;
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLimited) return;

    const prompt = inputMessage;
    setMessages((prev) => [
      ...prev,
      { type: "user", content: prompt, timestamp: new Date().toLocaleTimeString() },
    ]);
    setIsTyping(true);

    setTimeout(async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/ai/get-result`,
          { prompt },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newCount = response.data.aiPromptCount;
        const newPlan = response.data.plan || plan;
        if (typeof newCount === "number" && user) {
          const updatedUser = { ...user, aiPromptCount: newCount, subscriptionPlan: newPlan };
          dispatch(setUser(updatedUser));
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: normalizeAIResponse(response.data.result),
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } catch (error) {
        console.error("AI chatbot error:", error);
        const errorMsg = error.response?.data?.error || "Sorry, something went wrong. Please try again.";
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: errorMsg, timestamp: new Date().toLocaleTimeString() },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);

    setInputMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  const toggleRecording = () => {
    console.log("Toggle recording called, isRecording:", isRecording);
    console.log("SpeechRecognition available:", !!SpeechRecognition);
    
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      console.log("Stopping recognition");
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      console.log("Starting new recognition");
      setMicError("");
      setInputMessage("");
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        
        recognition.onresult = (event) => {
          console.log("✓ Speech result received:", event.results.length, "results");
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            console.log(`  Result ${i}: "${result[0].transcript}" isFinal: ${result.isFinal}`);
            transcript += result[0].transcript;
          }
          console.log("✓ Setting transcript:", transcript);
          setInputMessage(transcript);
        };

        recognition.onerror = (event) => {
          console.error("✗ Speech recognition error:", event.error);
          let errorMessage = "Speech recognition error. Please try again.";
          if (event.error === "not-allowed") {
            errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
          } else if (event.error === "no-speech") {
            errorMessage = "No speech detected. Please try again.";
          } else if (event.error === "network") {
            errorMessage = "Network error occurred. Please check your connection.";
          }
          setMicError(errorMessage);
          setIsRecording(false);
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        
        console.log("Starting recognition...");
        recognition.start();
        setIsRecording(true);
        console.log("✓ Recognition started successfully");
      } catch (error) {
        console.error("✗ Error starting speech recognition:", error);
        setMicError("Failed to start speech recognition. Please try again.");
        setIsRecording(false);
      }
    }
  };

  const toggleMenu = () => setShowMenu((prev) => !prev);

  const handleClearChat = () => {
    const defaultMessage = {
      type: "bot",
      content: "Hello! I'm your AI trading assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([defaultMessage]);
    localStorage.setItem("chatMessages", JSON.stringify([defaultMessage]));
    setShowMenu(false);
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Prompt progress bar percentage
  const progressPercent = promptLimit === -1 ? 100 : Math.min((promptCount / promptLimit) * 100, 100);
  const progressColor = progressPercent >= 100 ? "#ef4444" : progressPercent >= 80 ? "#facc15" : "#3affa3";

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
                <h2 className="text-2xl text-[#3affa3] font-bold tracking-tight">ZELBI AI</h2>
                <p className="text-sm text-[#3affa3]/70">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PlanBadge plan={plan} />
              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="text-[#3affa3] hover:text-[#32e092] transition-colors"
                >
                  <BsThreeDotsVertical className="text-2xl" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#111] border border-[#3affa3]/20 rounded-md shadow-[0_0_15px_rgba(58,255,163,0.3)] z-10">
                    <button
                      onClick={handleClearChat}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1a1a1a] hover:text-[#3affa3] rounded-md transition-colors"
                    >
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt usage bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                {promptLimit === -1
                  ? `${promptCount} prompts used (Unlimited)`
                  : `${promptCount} / ${promptLimit} prompts used`}
              </span>
              <div className="flex items-center gap-3">
                {promptLimit !== -1 && (
                  <span className="text-xs font-semibold" style={{ color: progressColor }}>
                    {progressPercent.toFixed(1)}% used
                  </span>
                )}
                {plan !== "elite" && (
                  <button
                    onClick={() => navigate("/pricing")}
                    className="text-xs text-[#3affa3] font-semibold hover:underline flex items-center gap-1"
                  >
                    <FaCrown className="text-[10px]" /> Upgrade
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: progressColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-scroll max-h-[420px] p-2 md:p-6 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
            >
              <div className={`flex items-start space-x-3 max-w-[95%] md:max-w-[85%] ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                <div className={`p-3 rounded-xl ${message.type === "user" ? "bg-[#1a1a1a]" : "bg-[#0a0a0a]"}`}>
                  {message.type === "user" ? <FaUser className="text-xl text-[#3affa3]" /> : <FaRobot className="text-xl text-[#3affa3]" />}
                </div>
                <div className={`p-4 rounded-xl ${message.type === "user" ? "bg-[#1a1a1a]" : "bg-[#0a0a0a]/50"} text-white shadow-[0_0_10px_rgba(58,255,163,0.2)] backdrop-blur-md border border-[#3affa3]/20 hover:border-[#3affa3]/40 transition-all duration-300`}>
                  {message.type === "bot"
                    ? <div className="space-y-3 text-base">{renderMessageContent(message.content)}</div>
                    : <p className="text-base whitespace-pre-wrap">{message.content}</p>}
                  <span className="text-xs mt-2 block text-[#3affa3]/70">{message.timestamp}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-[#3affa3]">
              {[0, 150, 300].map((delay, i) => (
                <div key={i} className="w-2 h-2 bg-[#3affa3] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {isLimited ? (
          <div className="bg-[#0a0a0a] p-4 border-t border-[#1a1a1a] rounded-b-xl">
            <motion.div
              className="bg-[#111] border border-[#3affa3]/20 rounded-xl px-4 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3affa3]/10 p-2 rounded-lg">
                    <HiSparkles className="text-[#3affa3] text-lg" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Prompt limit reached</p>
                    <p className="text-white text-xs">
                      {promptLimit} / {promptLimit} prompts used on <span className="capitalize text-[#3affa3]">{plan}</span> plan
                    </p>
                  </div>
                </div>
                <button
                  id="upgrade-cta-btn"
                  onClick={() => navigate("/pricing")}
                  className="bg-[#3affa3] text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#2de88f] transition-all duration-300 shadow-[0_0_15px_rgba(58,255,163,0.4)] flex items-center gap-2 shrink-0"
                >
                  <FaCrown className="text-xs" /> Upgrade
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="bg-[#0a0a0a] p-4 border-t border-[#1a1a1a] shadow-[0_0_15px_rgba(58,255,163,0.3)] rounded-b-xl">
            <div className="flex items-center space-x-4 w-full">
              <motion.button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  isRecording
                    ? "bg-red-900 text-white shadow-[0_0_15px_rgba(255,0,0,0.5)] animate-pulse"
                    : "bg-[#1a1a1a] text-[#3affa3] hover:bg-[#2a2a2a] hover:shadow-[0_0_15px_rgba(58,255,163,0.5)]"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isRecording ? <FaStop className="text-xl" /> : <FaMicrophone className="text-xl" />}
              </motion.button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening... Speak now" : "Type your message..."}
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
            {micError && (
              <div className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                {micError}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;