import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  Share2,
  ListFilter,
  CheckCircle2,
  XCircle,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QualityControlCenter = () => {
  const [selectedCall, setSelectedCall] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: calls, isLoading } = useQuery({
    queryKey: ['qcCalls'],
    queryFn: async () => {
      const res = await api.get('/admin/calls');
      return res.data.data;
    }
  });

  const scores = [
    { label: 'Opening Protocol', score: 9 },
    { label: 'Value Prop Clarity', score: 8 },
    { label: 'Objection Mitigation', score: 10 },
    { label: 'Closure Precision', score: 7 },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-50/50 rounded-[40px] border border-slate-200/60 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* CALLS LIST */}
      <div className="w-[450px] border-r border-slate-200/60 flex flex-col bg-white/20">
        <div className="p-10 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
           <div>
              <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Call Archive</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Stream Analysis</p>
           </div>
           <button className="p-3 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <ListFilter size={18} className="text-slate-600" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
           {isLoading ? (
             <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Accessing Voice Vault...</div>
           ) : calls?.map((call) => (
             <motion.div
               key={call.id}
               onClick={() => setSelectedCall(call)}
               whileHover={{ x: 5 }}
               className={`p-6 rounded-[32px] cursor-pointer transition-all duration-500 border ${
                 selectedCall?.id === call.id 
                 ? 'bg-white border-blue-200 shadow-xl shadow-blue-100/50' 
                 : 'bg-white/60 border-transparent hover:bg-white'
               }`}
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${call.durationSeconds > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest truncate w-40">{call.lead?.customerName || 'Unknown Lead'}</span>
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(call.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                         <Play size={12} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}</span>
                   </div>
                   {call.recordingUrl && (
                     <ShieldCheck size={14} className="text-blue-500" />
                   )}
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* AUDIT WORKSPACE */}
      <div className="flex-1 flex flex-col bg-white/60 relative">
        <AnimatePresence mode="wait">
          {selectedCall ? (
            <motion.div 
              key={selectedCall.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
               {/* PLAYER HEADER */}
               <div className="p-12 border-b border-slate-200/60 bg-white/40">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-6">
                        <div className="p-6 bg-blue-600 text-white rounded-[32px] shadow-2xl shadow-blue-200">
                           <Play size={32} />
                        </div>
                        <div>
                           <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-1">{selectedCall.lead?.customerName || 'Strategic Session'}</h1>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SID: {selectedCall.sid?.slice(0, 12)}...</span>
                              <span className="text-slate-200">|</span>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Agent: {selectedCall.agent?.name || 'Assigned Professional'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                           <Flag size={20} className="text-rose-500" />
                        </button>
                        <button className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                           <Share2 size={20} className="text-slate-400" />
                        </button>
                     </div>
                  </div>

                  {/* WAVEFORM PLACEHOLDER */}
                  <div className="h-24 bg-slate-900 rounded-[32px] relative overflow-hidden flex items-center justify-center group cursor-pointer">
                     <div className="flex items-end gap-1 px-10 h-full w-full">
                        {[...Array(60)].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ height: isPlaying ? [10, 40, 20, 60, 15] : 10 }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
                            className="flex-1 bg-blue-500/40 rounded-full min-h-[4px]"
                            style={{ height: `${Math.random() * 80 + 10}%` }}
                          />
                        ))}
                     </div>
                     <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl"
                        >
                           {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                     </div>
                  </div>
               </div>

               {/* SCORING WORKSPACE */}
               <div className="flex-1 p-12 overflow-y-auto grid grid-cols-2 gap-12">
                  <div className="space-y-10">
                     <div>
                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Audit Scoring Rubric</h3>
                        <div className="space-y-8">
                           {scores.map((s, i) => (
                             <div key={i} className="space-y-4">
                                <div className="flex justify-between items-center">
                                   <span className="text-xs font-bold text-slate-600">{s.label}</span>
                                   <span className="text-xs font-black text-blue-600">{s.score}/10</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${s.score * 10}%` }}
                                      className="h-full bg-blue-600 rounded-full"
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="p-8 bg-blue-600 rounded-[40px] text-white shadow-2xl shadow-blue-200 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Human QA Score</p>
                           <h4 className="text-5xl font-black tracking-tighter">84%</h4>
                        </div>
                        <ShieldCheck size={64} className="opacity-20" />
                     </div>

                     <div className="p-8 bg-violet-600 rounded-[40px] text-white shadow-2xl shadow-violet-200 flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                           <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">AI Sentiment Score</p>
                           <h4 className="text-5xl font-black tracking-tighter">92%</h4>
                        </div>
                        <Sparkles size={64} className="opacity-20 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="h-full bg-slate-50 border border-slate-100 rounded-[40px] p-10 flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                           <MessageSquare size={18} className="text-slate-400" />
                           <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Audit Annotations</h3>
                        </div>
                        <div className="flex-1 space-y-6">
                           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">00:42 — Neutral Sentiment</p>
                              <p className="text-xs font-medium text-slate-600 leading-relaxed">Agent successfully handled the pricing objection by shifting focus to the long-term ROI metrics.</p>
                           </div>
                        </div>
                        <div className="mt-8 relative">
                           <input 
                             placeholder="Add time-stamped note..."
                             className="w-full h-16 px-8 bg-white border border-slate-200/60 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-xs"
                           />
                           <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-600">
                              <CheckCircle2 size={20} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               {/* FOOTER ACTIONS */}
               <div className="p-10 border-t border-slate-200/60 bg-white/40 flex items-center justify-between">
                  <div className="flex gap-4">
                     <button className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Reject Session</button>
                  </div>
                  <div className="flex gap-4">
                     <button className="px-8 py-5 bg-violet-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-violet-200 hover:-translate-y-1 transition-all flex items-center gap-3">
                        <Sparkles size={16} /> Trigger AI Audit
                     </button>
                     <button className="px-12 py-5 bg-[#0F172A] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-300 hover:-translate-y-1 transition-all">Submit Professional Audit</button>
                  </div>
               </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
               <div className="w-32 h-32 bg-slate-100 rounded-[40px] flex items-center justify-center mb-10 border border-slate-200/40 shadow-inner">
                  <ShieldCheck size={48} className="text-slate-300" />
               </div>
               <h2 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tighter uppercase">Audit Protocol Initialized</h2>
               <p className="text-slate-400 max-w-md font-bold text-sm leading-relaxed">Select a high-fidelity voice stream from the archive to begin your quality assurance audit. Your evaluation ensures institutional excellence.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QualityControlCenter;
