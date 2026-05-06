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
  "Analyzing CRM data...",
  "Preparing insights...",
  "Querying global clusters...",
  "Synchronizing intelligence..."
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
    <div className={`flex flex-col ${embedded ? 'w-[450px] h-[650px]' : ''}`}>
      {/* HEADER */}
      <div className="p-8 bg-[#0F172A] text-white flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
               <Sparkles size={24} />
            </div>
            <div>
               <h4 className="text-lg font-black tracking-tight leading-none italic uppercase">CRM Assistant.</h4>
               <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mt-1">Advanced Business Intelligence</p>
            </div>
         </div>
         {!embedded && <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 space-y-6 scrollbar-hide">
         {chatHistory.length === 0 ? (
           <div className="space-y-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-4 italic">Sample Queries</p>
              <div className="grid grid-cols-1 gap-3">
                 {["Show Meta leads this month", "Revenue last 30 days", "Top performing sales team"].map(q => (
                   <button key={q} onClick={() => setQuery(q)} className="p-5 bg-white border border-slate-100 rounded-3xl text-sm font-bold text-[#0F172A] hover:border-blue-300 hover:text-blue-600 transition-all text-left flex items-center gap-4">
                      <Zap size={14} className="text-blue-600" /> {q}
                   </button>
                 ))}
              </div>
           </div>
         ) : (
           chatHistory.map((msg, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
               animate={{ opacity: 1, x: 0 }}
               className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
             >
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#0F172A] text-white' : 'bg-blue-600 text-white'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
               </div>
               <div className={`p-5 rounded-3xl text-sm font-bold leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-white border border-slate-100 text-[#0F172A] rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none shadow-lg'}`}>
                  {msg.content}
               </div>
             </motion.div>
           ))
         )}

         {isLoading && (
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                 <Bot size={18} />
              </div>
              <div className="p-5 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl rounded-tl-none text-sm font-bold flex items-center gap-3">
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                 </div>
                 {THINKING_MESSAGES[thinkingIdx]}
              </div>
           </div>
         )}
      </div>

      {/* INPUT AREA */}
      <div className="p-8 bg-white border-t border-slate-100">
         <form onSubmit={handleSubmit} className="relative flex gap-4">
            <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="Ask Assistant..." 
                 className="w-full h-16 pl-6 pr-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-blue-600 transition-all"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
               />
            </div>
            <button type="submit" className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 hover:scale-105 transition-all shrink-0">
               <Send size={24} />
            </button>
         </form>
         <div className="flex justify-between mt-4 px-2">
            <button onClick={() => setChatHistory([])} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0F172A] flex items-center gap-2">
               <RotateCcw size={12} /> New Chat
            </button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center gap-2">
               <BarChart3 size={12} /> Expand Assistant
            </button>
         </div>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-24 right-0 bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden"
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
