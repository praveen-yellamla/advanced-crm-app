import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, X, RotateCcw, Zap, Bot, User, 
  AlertCircle, RefreshCw, BarChart3, Clock, Trash2, 
  MessageSquare, BrainCircuit, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';

const GREETINGS = ['hi', 'hii', 'hello', 'hey', 'good morning', 'good evening', 'how are you'];
const GREETING_RESPONSES = [
  "Hello 👋 I am AI Assistant, your CRM Intelligence Assistant. How can I assist you today?",
  "Hi there! I can help you analyze leads, calculate revenue trends, or summarize team performance.",
  "Welcome back. I have the latest CRM snapshot ready for your analysis.",
  "Systems online. What strategic insights are you looking for today?"
];

const THINKING_MESSAGES = [
  "Consulting Intelligence Core...",
  "Aggregating Tenant Data...",
  "Analyzing Pipeline Metrics...",
  "Synthesizing Response...",
  "Finalizing Insights..."
];

const AIAssistant = ({ embedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Fetch History on Load
  useEffect(() => {
    if (isOpen || embedded) {
      fetchHistory();
    }
  }, [isOpen, embedded]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Thinking Message Rotation
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setThinkingIdx((prev) => (prev + 1) % THINKING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      if (res.data.success) {
        setChatHistory(res.data.data.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt)
        })));
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const addMessage = (role, content) => {
    setChatHistory(prev => [
      ...prev, 
      { role, content, timestamp: new Date() }
    ]);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || isLoading) return;
    
    setError(null);
    setQuery('');
    addMessage('user', cleanQuery);

    // Instant Greeting Logic
    if (GREETINGS.includes(cleanQuery.toLowerCase())) {
      setTimeout(() => {
        const randomResponse = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        addMessage('assistant', randomResponse);
      }, 500);
      return;
    }

    await executeQuery(cleanQuery);
  };

  const executeQuery = async (userQuery) => {
    setIsLoading(true);
    try {
      const res = await api.post('/ai/query', { 
        query: userQuery,
        history: chatHistory.slice(-5).map(m => ({ role: m.role, content: m.content }))
      });
      
      if (res.data.success) {
        addMessage('assistant', res.data.results);
      } else {
        throw new Error(res.data.message || 'Intelligence Core Timeout');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Connection to Intelligence Core failed.";
      setError({ message: errMsg, lastQuery: userQuery });
      addMessage('assistant', `⚠️ ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (error?.lastQuery) {
      setQuery(error.lastQuery);
      setError(null);
      // Remove the last two messages (the failed user query and the error message)
      setChatHistory(prev => prev.slice(0, -2));
      executeQuery(error.lastQuery);
    }
  };

  const clearChat = async () => {
    if (window.confirm("Purge conversation history? This action is irreversible.")) {
      setChatHistory([]);
      // Optional: Add backend endpoint for clearing history
      toast.success("Conversation purged.");
    }
  };

  const chatContent = (
    <div className={`flex flex-col w-full h-full bg-[#0F172A] text-white overflow-hidden relative shadow-2xl`}>
      {/* HEADER */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F172A]/90 backdrop-blur-xl z-20">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] relative overflow-hidden group">
               <Bot size={20} className="relative z-10" />
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black tracking-tight uppercase">CRM Intelligence</h4>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">v4.0</span>
               </div>
               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {isLoading ? "Processing Strategy..." : "Connected & Secure"}
               </p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            {!embedded && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
              >
                <X size={20} />
              </button>
            )}
         </div>
      </div>

      {/* CHAT AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0F172A] to-[#05050a] ai-scrollbar scroll-smooth"
      >
         {chatHistory.length === 0 && !isLoading ? (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-10 py-10">
              <div className="relative">
                 <div className="w-24 h-24 rounded-[32px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 animate-pulse">
                    <BrainCircuit size={48} />
                 </div>
                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-4 border-[#0F172A] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                 </div>
              </div>
              <div className="space-y-3">
                 <h3 className="text-xl font-black uppercase italic tracking-tight">AI Protocol Active</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[240px] leading-relaxed">
                    Ask about lead performance, revenue trends, or strategic CRM operations.
                 </p>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                 {[
                   { q: "Summarize this month's leads", icon: Zap },
                   { q: "Who is the top performing agent?", icon: BarChart3 },
                   { q: "Calculate projected revenue", icon: MessageSquare }
                 ].map(item => (
                   <button 
                     key={item.q} 
                     onClick={() => { setQuery(item.q); }} 
                     className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[12px] font-black text-slate-400 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all text-left flex items-center gap-4 group uppercase tracking-tight"
                   >
                      <item.icon size={16} className="text-slate-600 group-hover:text-blue-500 group-hover:scale-110 transition-all" /> 
                      {item.q}
                   </button>
                 ))}
              </div>
           </div>
         ) : (
           <div className="space-y-8 pb-10">
             {chatHistory.map((msg, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, y: 10, scale: 0.98 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
               >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    msg.role === 'user' 
                    ? 'bg-slate-800 border-white/5 text-slate-400' 
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/20 text-white shadow-lg'
                  }`}>
                     {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-5 rounded-2xl text-[13px] font-bold leading-relaxed tracking-tight ${
                      msg.role === 'user' 
                      ? 'bg-slate-800/50 border border-white/5 text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none shadow-2xl backdrop-blur-sm'
                    }`}>
                       {msg.content}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 px-1">
                       <Clock size={8} /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
               </motion.div>
             ))}
             {isLoading && (
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-lg shadow-blue-500/20">
                     <Bot size={16} />
                  </div>
                  <div className="p-5 bg-white/5 border border-white/10 text-blue-400 rounded-2xl rounded-tl-none text-[11px] font-black uppercase tracking-widest flex items-center gap-4 shadow-xl">
                     <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                     {THINKING_MESSAGES[thinkingIdx]}
                  </div>
               </div>
             )}
             {error && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center p-4">
                  <button 
                    onClick={handleRetry}
                    className="flex items-center gap-3 px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all group"
                  >
                     <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                     Retry Intelligence Request
                  </button>
               </motion.div>
             )}
           </div>
         )}
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 bg-[#0a0a14]/95 backdrop-blur-3xl border-t border-white/10 p-6 z-20">
         <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <div className="relative flex-1 group">
               <input 
                 type="text" 
                 placeholder="Command AI Assistant..." 
                 autoFocus
                 className="w-full h-14 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl font-black text-[14px] outline-none focus:border-blue-600 focus:bg-white/10 text-white placeholder:text-slate-600 transition-all box-border"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 disabled={isLoading}
               />
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                isLoading || !query.trim() 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95'
              }`}
            >
               <Send size={22} className={isLoading ? 'animate-ping' : ''} />
            </button>
         </form>
         <div className="flex justify-between mt-5 px-1 items-center">
            <button 
              onClick={clearChat}
              className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 hover:text-rose-500 flex items-center gap-2 transition-colors group"
            >
               <Trash2 size={12} className="group-hover:scale-110 transition-transform" /> Clear Protocol
            </button>
            <div className="flex gap-6">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-700">
                  <ShieldCheck size={10} className="text-emerald-500" /> AES-256 SECURED
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(20px)' }}
            className="absolute bottom-28 right-0 w-[calc(100vw-48px)] sm:w-[480px] h-[75vh] sm:h-[85vh] max-h-[850px] bg-[#0F172A] rounded-[48px] border border-white/10 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-[1001]"
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-24 h-24 rounded-[40px] flex items-center justify-center shadow-2xl relative group overflow-hidden transition-all duration-500 ${isOpen ? 'bg-rose-600' : 'bg-[#0F172A] border border-white/10'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={40} className="relative z-10 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="relative z-10 flex flex-col items-center">
              <Sparkles size={44} className="text-blue-500 group-hover:text-white transition-colors" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 text-slate-500 group-hover:text-white/70">AI Assistant</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-blue-600 rounded-full border-4 border-[#0F172A] flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </motion.button>
    </div>
  );
};

const ShieldCheck = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default AIAssistant;
