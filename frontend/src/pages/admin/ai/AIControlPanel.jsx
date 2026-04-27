import React, { useState } from 'react';
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
  ToggleLeft, 
  ToggleRight,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AIControlPanel = () => {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const res = await api.get('/ai/settings');
      const config = {};
      res.data.forEach(s => config[s.key] = s.value);
      setLocalSettings(config);
      return config;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      return await api.patch('/ai/settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['aiSettings']);
      toast.success('Intelligence node synchronized.');
    }
  });

  const featureCards = [
    { id: 'AI_ENABLED', label: 'Global Intelligence Core', desc: 'Main power switch for all AI-driven modules.', icon: <Zap /> },
    { id: 'ENABLE_SCORING', label: 'Lead Scoring Logic', desc: 'Automated 0-100 scoring based on multi-channel telemetry.', icon: <BrainCircuit /> },
    { id: 'ENABLE_TRANSCRIPTION', label: 'Voice Recog. Node', desc: 'Convert speech-to-text with multi-speaker separation.', icon: <Cpu /> },
    { id: 'ENABLE_COACHING', label: 'Conversation Coach', desc: 'Generate performance scorecards for sales agents.', icon: <ShieldCheck /> },
    { id: 'ENABLE_NL_QUERY', label: 'Auth Dashboard Query', desc: 'Allow natural language data retrieval via dashboard.', icon: <Database /> },
  ];

  if (isLoading) return <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest italic">Interrogating AI Grid...</div>;

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Cognitive Infrastructure Hub</span>
           </div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-none italic uppercase">Intelligence Admin.</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* CONFIG GRID */}
         <div className="lg:col-span-2 space-y-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
               Active Intelligence Nodes <div className="h-px flex-1 bg-slate-100" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {featureCards.map(card => (
                 <div key={card.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                       <div className="space-y-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                             {React.cloneElement(card.icon, { size: 24 })}
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-[#0F172A] tracking-tight">{card.label}</h4>
                             <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[200px] mt-2">{card.desc}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => updateMutation.mutate({ key: card.id, value: !localSettings[card.id] })}
                         className={`w-16 h-8 rounded-full relative transition-all duration-500 ${localSettings[card.id] ? 'bg-blue-600' : 'bg-slate-200'}`}
                       >
                          <motion.div 
                            animate={{ x: localSettings[card.id] ? 32 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                          />
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />
                 </div>
               ))}
            </div>
         </div>

         {/* STATS & USAGE */}
         <div className="space-y-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
               Consumption Metrics <div className="h-px flex-1 bg-slate-100" />
            </h3>

            <div className="bg-[#0F172A] p-12 rounded-[56px] shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-12">
                  <div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Monthly Token Pool</p>
                     <div className="flex items-baseline gap-4 mt-6">
                        <span className="text-6xl font-black text-white italic tracking-tighter">84.2</span>
                        <span className="text-xl font-bold text-slate-400">/ 100M</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Quota Consumed</span>
                        <span className="text-blue-400">84.2%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-[1px]">
                        <motion.div initial={{ width: 0 }} animate={{ width: '84.2%' }} className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estimated Cost</p>
                        <p className="text-xl font-black text-white mt-2">$412.18</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total API Hits</p>
                        <p className="text-xl font-black text-white mt-2">1.2M</p>
                     </div>
                  </div>
               </div>
               <BrainCircuit className="absolute -bottom-20 -right-20 text-white/5" size={300} />
            </div>
         </div>

      </div>
    </div>
  );
};

export default AIControlPanel;
