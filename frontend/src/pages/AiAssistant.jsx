import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaCrown, FaMicrophone, FaRobot, FaStop, FaUser } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { HiSparkles, HiDotsVertical, HiTrash } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../slices/profileSlice";

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const PLAN_LIMITS = { free: 5, pro: 100, elite: -1 };
const getPlanLimit = (plan) => PLAN_LIMITS[plan] ?? 5;

const PLAN_STYLES = {
  free: { label: "Free", color: "#9ca3af", bg: "rgba(156,163,175,0.08)", ring: "rgba(156,163,175,0.25)" },
  pro: { label: "Pro", color: "#3affa3", bg: "rgba(58,255,163,0.08)", ring: "rgba(58,255,163,0.3)" },
  elite: { label: "Elite", color: "#facc15", bg: "rgba(250,204,21,0.08)", ring: "rgba(250,204,21,0.3)" },
};

const PlanBadge = ({ plan }) => {
  const s = PLAN_STYLES[plan] || PLAN_STYLES.free;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.ring}` }}
    >
      {plan === "elite" && <HiSparkles className="text-[11px]" />}
      {s.label}
    </span>
  );
};

const CircularProgress = ({ percent, color, size = 34, unlimited = false }) => {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {!unlimited && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {unlimited ? (
          <HiSparkles className="text-[11px]" style={{ color }} />
        ) : (
          <span className="text-[9px] font-bold" style={{ color }}>
            {Math.round(percent)}
          </span>
        )}
      </div>
    </div>
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
  const menuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize the textarea any time inputMessage changes, whether from
  // typing (onChange) or voice input (recognition.onresult setting state directly).
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [inputMessage]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.title = "Zelbi | AI Assistant";
    return () => {
      document.title = "Zelbi";
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
  if (!micError) return;

  const timer = setTimeout(() => {
    setMicError("");
  }, 4000); // disappears after 4 seconds

  return () => clearTimeout(timer);
}, [micError]);

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
        return (
          <div key={blockIndex} className="text-[#3affa3] font-semibold text-[14px] tracking-wide uppercase">
            {block.text}
          </div>
        );
      }
      if (block.type === "bullets") {
        return (
          <ul key={blockIndex} className="space-y-2.5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2.5 leading-relaxed text-[14px] text-white/90">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#3affa3] shadow-[0_0_6px_rgba(58,255,163,0.9)]" />
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={blockIndex} className="text-[14px] whitespace-pre-wrap leading-relaxed text-white/85">
          {block.text}
        </p>
      );
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setMicError("");
      setInputMessage("");

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputMessage(transcript);
        };

        recognition.onerror = (event) => {
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

        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
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
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const progressPercent = promptLimit === -1 ? 100 : Math.min((promptCount / promptLimit) * 100, 100);
  const progressColor = progressPercent >= 100 ? "#ef4444" : progressPercent >= 80 ? "#facc15" : "#3affa3";

  return (
    <div className="h-screen bg-gradient-to-b pt-16 from-black to-[#0a0a0a] flex justify-center items-center font-sans p-4 overflow-hidden">
      <div className="w-full max-w-2xl h-full max-h-[calc(100vh-6rem)] bg-[#08090a] flex flex-col rounded-2xl border border-[#3affa3]/15 shadow-[0_0_35px_rgba(58,255,163,0.12)] overflow-hidden">

        {/* Header */}
        <div>
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
          >
            <motion.polyline
              points="0,55 25,48 45,58 70,32 95,40 120,18 145,30 170,12 195,26 220,15 245,35 270,20 295,38 320,22 345,30 370,10 400,24"
              fill="none"
              stroke="#3affa3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          </svg>

          <div className="relative flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#3affa3]/20 blur-md" />
                <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-[#132018] to-[#0a0a0a] border border-[#3affa3]/30 flex items-center justify-center">
                  <FaRobot className="text-xl text-[#3affa3]" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#3affa3] border-2 border-[#0a0a0a] shadow-[0_0_6px_rgba(58,255,163,0.9)]" />
              </div>
              <div>
                <h2 className="text-[15px] text-white font-bold tracking-tight leading-none">Zelbi AI</h2>
                <p className="text-[11px] text-white/40 mt-1.5">Your AI trading assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => plan !== "elite" && navigate("/pricing")}
                title={promptLimit === -1 ? "Unlimited prompts" : `${promptCount} / ${promptLimit} prompts used`}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-[#3affa3]/40 hover:bg-white/[0.07] transition-colors"
              >
                <CircularProgress percent={progressPercent} color={progressColor} unlimited={promptLimit === -1} size={26} />
                <PlanBadge plan={plan} />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  aria-label="Chat options"
                  className="text-white/50 hover:text-[#3affa3] hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <HiDotsVertical className="text-lg" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 bg-[#111] border border-white/10 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-10 overflow-hidden"
                    >
                      <button
                        onClick={handleClearChat}
                        className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-[#ef4444] transition-colors"
                      >
                        <HiTrash className="text-base" /> Clear chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3affa3]/25 to-transparent" />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-5 bg-[radial-gradient(ellipse_at_top,rgba(58,255,163,0.04),transparent_60%)]">
          {messages.map((message, index) => {
            const isUser = message.type === "user";
            return (
              <motion.div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                initial="hidden"
                animate="visible"
                variants={messageVariants}
              >
                <div className={`flex items-end gap-2.5 max-w-[92%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${isUser
                        ? "bg-[#1a1a1a] border-white/10 text-white/70"
                        : "bg-[#3affa3]/10 border-[#3affa3]/30 text-[#3affa3]"
                      }`}
                  >
                    {isUser ? <FaUser className="text-xs" /> : <FaRobot className="text-sm" />}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl text-white ${isUser
                        ? "bg-[#1a1a1a] border border-white/10 rounded-br-sm"
                        : "bg-[#0f0f0f] border border-[#3affa3]/15 rounded-bl-sm"
                      }`}
                  >
                    {isUser ? (
                      <p className="text-[14px] whitespace-pre-wrap leading-relaxed text-white/90">{message.content}</p>
                    ) : (
                      <div className="space-y-2.5">{renderMessageContent(message.content)}</div>
                    )}
                    <span className={`text-[10px] mt-2 block ${isUser ? "text-white/30 text-right" : "text-[#3affa3]/50"}`}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center border bg-[#3affa3]/10 border-[#3affa3]/30 text-[#3affa3]">
                <FaRobot className="text-sm" />
              </div>
              <div className="bg-[#0f0f0f] border border-[#3affa3]/15 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5">
                {[0, 150, 300].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#3affa3] rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {isLimited ? (
          <div className="shrink-0 bg-[#0a0a0a] p-4 border-t border-white/5">
            <motion.div
              className="bg-[#111] border border-[#3affa3]/20 rounded-xl px-4 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3affa3]/10 p-2 rounded-lg">
                    <HiSparkles className="text-[#3affa3] text-lg" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Prompt limit reached</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      {promptLimit} / {promptLimit} used on <span className="capitalize text-[#3affa3]">{plan}</span> plan
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
          <form onSubmit={handleSendMessage} className="shrink-0 bg-[#0a0a0a] p-3.5">
          <AnimatePresence mode="wait">
  {micError && (
    <motion.div
      key="mic-error"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="mb-2 text-xs text-white bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2"
    >
      {micError}
    </motion.div>
  )}
</AnimatePresence>
            <div className="flex items-end gap-2 w-full bg-[#141414] rounded-2xl border border-white/10 focus-within:border-[#3affa3]/50 focus-within:shadow-[0_0_0_3px_rgba(58,255,163,0.1)] transition-all duration-200 px-2 py-2">
              <motion.button
                type="button"
                onClick={toggleRecording}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={`shrink-0 p-2.5 rounded-xl transition-all duration-300 ${isRecording
                    ? "bg-red-500/15 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                    : "text-white/50 hover:text-[#3affa3] hover:bg-white/5"
                  }`}
                whileTap={{ scale: 0.92 }}
              >
                {isRecording ? (
                  <FaStop className="text-sm" />
                ) : (
                  <FaMicrophone className="text-sm" />
                )}
              </motion.button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening… speak now" : "Message Zelbi AI…"}
                rows="1"
                className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-[14px] resize-none min-h-[38px] max-h-[200px] overflow-y-auto py-2 leading-relaxed"
              />
              <motion.button
                type="submit"
                disabled={!inputMessage.trim()}
                aria-label="Send message"
                className="shrink-0 bg-[#3affa3] text-black p-2.5 rounded-xl shadow-[0_0_10px_rgba(58,255,163,0.4)] hover:bg-[#2de88f] hover:shadow-[0_0_18px_rgba(58,255,163,0.7)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                whileHover={inputMessage.trim() ? { scale: 1.08 } : {}}
                whileTap={inputMessage.trim() ? { scale: 0.92 } : {}}
              >
                <IoMdSend className="text-base" />
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;