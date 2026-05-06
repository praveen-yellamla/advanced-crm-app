import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';
import { 
  Zap, 
  BrainCircuit, 
  Cpu, 
  Settings, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  Send,
  MessageSquare,
  Sparkles,
  RefreshCcw,
  Activity,
  Coins,
  History,
  Terminal,
  Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const AIControlPanel = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ops'); // ops, analytics, terminal

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  // FETCH SETTINGS
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const res = await api.get('/ai/settings');
      const config = {};
      res.data.data.forEach(s => config[s.key] = s.value);
      return config;
    }
  });

  // FETCH USAGE
  const { data: usageData } = useQuery({
    queryKey: ['aiUsage'],
    queryFn: async () => {
      const res = await api.get('/ai/usage');
      return res.data.data;
    },
    refetchInterval: 30000 // Refetch every 30s
  });

  // MUTATIONS
  const updateSetting = useMutation({
    mutationFn: (payload) => api.patch('/ai/settings', payload),
    onMutate: async (newSetting) => {
      await queryClient.cancelQueries(['aiSettings']);
      const previous = queryClient.getQueryData(['aiSettings']);
      queryClient.setQueryData(['aiSettings'], old => ({ ...old, [newSetting.key]: newSetting.value }));
      return { previous };
    },
    onError: (err, newSetting, context) => {
      queryClient.setQueryData(['aiSettings'], context.previous);
      toast.error("Orchestration failed.");
    },
    onSuccess: () => {
      toast.success("AI Logic Updated.");
    }
  });

  const chatMutation = useMutation({
    mutationFn: (data) => api.post('/ai/chat', data),
    onSuccess: (res) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.data }]);
    },
    onError: () => {
      toast.error("Intelligence core busy.");
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newUserMsg = { role: 'user', content: message };
    setChatHistory(prev => [...prev, newUserMsg]);
    chatMutation.mutate({ message, history: chatHistory });
    setMessage('');
  };

  const featureModules = [
    { id: 'AI_ENABLED', label: 'Global Intelligence', desc: 'Main power for CRM cognitive functions.', icon: <Zap /> },
    { id: 'ENABLE_SCORING', label: 'Lead Probability AI', desc: 'Predict conversion rates in real-time.', icon: <BrainCircuit /> },
    { id: 'ENABLE_ANALYSIS', label: 'Call Sentiment AI', desc: 'Auto-analyze agent performance.', icon: <Cpu /> },
    { id: 'ENABLE_FOLLOWUP', label: 'Smart Follow-Up', desc: 'Automated next-action generation.', icon: <ShieldCheck /> },
  ];

  if (settingsLoading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Synchronizing Neural Grid...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER ENGINE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Intelligence Operations Center</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none mb-2">AI Control <span className="text-slate-200">Suite</span></h1>
          <p className="text-[#64748B] font-bold text-sm tracking-tight">Deploying GPT-4 powered cognitive orchestration across CRM telemetry</p>
        </div>

        <div className="flex gap-4 relative z-10">
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex">
             {['ops', 'analytics'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                   activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {tab === 'ops' ? <Activity size={14} className="inline mr-2" /> : <BarChart3 size={14} className="inline mr-2" />}
                 {tab}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: MODULES & STATS */}
        <div className="lg:col-span-8 space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'ops' ? (
              <motion.div 
                key="ops"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {featureModules.map(module => (
                  <div key={module.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                      <div className="space-y-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${
                          settingsData?.[module.id] ? 'bg-blue-600 text-white shadow-blue-500/50' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                          {React.cloneElement(module.icon, { size: 24 })}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-[#0F172A] tracking-tight">{module.label}</h4>
                          <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[200px] mt-1">{module.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => updateSetting.mutate({ key: module.id, value: !settingsData?.[module.id] })}
                        className={`w-16 h-8 rounded-full relative transition-all duration-500 ${settingsData?.[module.id] ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <motion.div 
                          animate={{ x: settingsData?.[module.id] ? 32 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>
                ))}

                {/* REAL-TIME USAGE WIDGET */}
                <div className="md:col-span-2 bg-[#0F172A] p-10 rounded-[50px] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32" />
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                      <div>
                         <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Live Token Pool Usage</span>
                         <div className="flex items-baseline gap-4 mt-4">
                            <h3 className="text-6xl font-black text-white italic tracking-tighter">
                               {Math.round((usageData?.totalTokens || 0) / 1000)}k
                            </h3>
                            <span className="text-slate-400 font-bold uppercase text-xs">/ 1M Limit</span>
                         </div>
                      </div>
                      <div className="flex gap-10">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Hits</p>
                            <p className="text-2xl font-black text-white">{usageData?.requestCount || 0}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Cost</p>
                            <p className="text-2xl font-black text-emerald-400">${(usageData?.totalCost || 0).toFixed(2)}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl h-[500px]"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-[#0F172A] italic uppercase tracking-tight flex items-center gap-3">
                    <BarChart3 size={20} className="text-blue-600" /> Intelligence Trends
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 7 Days</span>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={usageData?.trend}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="createdAt" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTokens)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: ZIA ASSISTANT */}
        <div className="lg:col-span-4 h-[750px]">
          <div className="bg-white h-full rounded-[50px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            {/* CHAT HEADER */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                     <Sparkles size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-[#0F172A] tracking-tight">Zia</h3>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Core</span>
                     </div>
                  </div>
               </div>
               <button onClick={() => setChatHistory([])} className="text-slate-300 hover:text-rose-500 transition-colors">
                  <Eraser size={18} />
               </button>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
               {chatHistory.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <BrainCircuit size={64} className="text-slate-200 mb-6" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                       Start a conversation with the CRM Intelligence core
                    </p>
                 </div>
               )}
               {chatHistory.map((msg, i) => (
                 <motion.div 
                   initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={i} 
                   className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div className={`max-w-[85%] p-6 rounded-[32px] text-sm font-medium leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-[#0F172A] text-white rounded-tr-none' 
                       : 'bg-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                   }`}>
                     {msg.content}
                   </div>
                 </motion.div>
               ))}
               {chatMutation.isPending && (
                 <div className="flex justify-start">
                    <div className="bg-slate-50 p-6 rounded-[32px] rounded-tl-none flex gap-2">
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                 </div>
               )}
               <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT */}
            <div className="p-8 bg-slate-50 border-t border-slate-100">
               <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Analyze recent performance..."
                    className="w-full h-16 pl-6 pr-20 bg-white border border-slate-200 rounded-[28px] outline-none focus:border-blue-600 focus:shadow-xl transition-all font-bold text-slate-900"
                  />
                  <button 
                    disabled={chatMutation.isPending}
                    type="submit"
                    className="absolute right-2 top-2 w-12 h-12 bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
               </form>
               <p className="text-[9px] font-bold text-slate-400 text-center mt-4 uppercase tracking-[0.2em]">
                  Secure Intelligence Grid Integration
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIControlPanel;

