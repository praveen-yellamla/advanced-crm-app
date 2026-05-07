import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  X, 
  RotateCcw,
  Zap,
  BrainCircuit,
  MessageSquare,
  BarChart3,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const GREETINGS = ['hi', 'hii', 'hello', 'hey', 'good morning', 'good evening', 'how are you'];
const GREETING_RESPONSES = [
  "Hello 👋 How can I assist you today?",
  "Hi there! Ask me about leads, reports, calls, teams, or CRM data.",
  "Welcome back. What would you like to know?",
  "I'm ready. How can I help you streamline your business today?"
];

const THINKING_MESSAGES = [
  "Thinking...",
  "Searching database...",
  "Getting details...",
  "Preparing answer...",
  "Analyzing records..."
];

const AIAssistant = ({ embedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // Store last 10 messages
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setThinkingIdx((prev) => (prev + 1) % THINKING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addMessage = (role, content) => {
    setChatHistory(prev => {
      const newHistory = [...prev, { role, content, timestamp: new Date() }];
      return newHistory.slice(-10); // Keep last 10
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;
    
    setQuery('');
    addMessage('user', query);

    // 1. GREETING DETECTION (INSTANT)
    if (GREETINGS.includes(cleanQuery)) {
      setTimeout(() => {
        const randomResponse = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        addMessage('assistant', randomResponse);
      }, 200);
      return;
    }

    // 2. BACKEND QUERY
    setIsLoading(true);
    
    const callApi = async (retry = true) => {
      try {
        const res = await api.post('/ai/query', { 
          query,
          history: chatHistory.map(m => ({ role: m.role, content: m.content }))
        }, { timeout: 20000 }); // 20s timeout
        
        if (res.data.success || res.status === 200) {
          addMessage('assistant', res.data.results || res.data.message);
        } else {
          throw new Error('Logic failure');
        }
      } catch (error) {
        if (retry) {
          console.log("Retrying AI Assistant...");
          return callApi(false);
        }
        addMessage('assistant', "AI is temporarily busy. Please try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    };

    await callApi();
  };

  const chatContent = (
    <div className={`flex flex-col ${embedded ? 'w-full h-full' : 'w-full h-full'} bg-[#0F172A] text-white overflow-hidden relative`}>
      {/* HEADER */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F172A]/90 backdrop-blur-md z-10">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
               <Bot size={20} />
            </div>
            <div>
               <h4 className="text-sm font-black tracking-tight uppercase">AI Assistant</h4>
               <p className="text-[8px] font-black uppercase tracking-widest text-blue-400 mt-1">How can I help you today?</p>
            </div>
         </div>
         {!embedded && <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"><X size={16} /></button>}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto min-height-0 p-6 space-y-6 bg-gradient-to-b from-[#0F172A] to-[#0a0a14] ai-scrollbar">
         {chatHistory.length === 0 ? (
           <div className="space-y-6 py-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center opacity-50">Suggested Questions</p>
              <div className="grid grid-cols-1 gap-2">
                 {["Show Meta leads this month", "Revenue last 30 days", "Top performing sales team"].map(q => (
                   <button key={q} onClick={() => setQuery(q)} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-bold text-slate-300 hover:bg-white/10 hover:text-white hover:border-blue-500/50 transition-all text-left flex items-center gap-3 group">
                      <Zap size={12} className="text-blue-500 group-hover:animate-pulse" /> {q}
                   </button>
                 ))}
              </div>
           </div>
         ) : (
           <div className="space-y-6 pb-4">
             {chatHistory.map((msg, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
               >
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                 </div>
                 <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-white/5 border border-white/10 text-white rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none shadow-xl shadow-blue-900/20'}`}>
                    {msg.content}
                 </div>
               </motion.div>
             ))}
             {isLoading && (
               <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                     <Bot size={14} />
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 text-blue-400 rounded-2xl rounded-tl-none text-[12px] font-bold flex items-center gap-3">
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                     {THINKING_MESSAGES[thinkingIdx]}
                  </div>
               </div>
             )}
           </div>
         )}
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 bg-[#0a0a14]/95 backdrop-blur-xl border-t border-white/10 p-6 z-10">
         <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="Ask a question..." 
                 className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-xl font-bold text-[13px] outline-none focus:border-blue-600 focus:bg-white/10 text-white placeholder:text-slate-500 transition-all box-border"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
               />
            </div>
            <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all shrink-0">
               <Send size={18} />
            </button>
         </form>
         <div className="flex justify-between mt-4 px-1">
            <button onClick={() => setChatHistory([])} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
               <RotateCcw size={10} /> Clear Chat
            </button>
            <div className="flex gap-4">
               <button className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 flex items-center gap-2 transition-colors">
                  <BarChart3 size={10} /> View Reports
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            className="absolute bottom-24 right-0 w-[calc(100vw-48px)] sm:w-[420px] h-[70vh] sm:h-[85vh] max-h-[750px] bg-[#0F172A] rounded-[32px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-[#0F172A] text-white rounded-[32px] flex items-center justify-center shadow-2xl relative group overflow-hidden"
      >
        <Sparkles size={32} className="relative z-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500 rounded-full border-4 border-[#0F172A] -mr-2 -mt-2 animate-bounce" />
      </motion.button>
    </div>
  );
};

export default AIAssistant;
