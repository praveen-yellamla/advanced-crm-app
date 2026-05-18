import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Search, Filter, Play, Calendar, Clock, Headphones,
  CheckCircle2, XCircle, AlertCircle, MoreVertical, Download,
  MessageSquare, Sparkles, FileText, ChevronRight, Activity,
  ArrowRight, X, PlayCircle, PauseCircle, Volume2, TrendingUp, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AgentActivity = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: activities, isLoading } = useQuery({
    queryKey: ['agentActivity', user?.id],
    queryFn: async () => {
      const res = await api.get('/agent/history'); 
      return res.data.data;
    },
    enabled: !!user?.id
  });

  const filteredActivities = useMemo(() => {
    return (activities || []).filter(c => 
      (c.lead?.customerName || 'Direct Call').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    );
  }, [activities, search]);

  const openCallDetails = (call) => {
    setSelectedCall(call);
    setIsSidebarOpen(true);
  };

  return (
    <div className="space-y-10 pb-20 relative min-h-[calc(100vh-200px)]">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Activity Log</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Interaction History & Call Records</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm">
              <Activity size={18} className="text-blue-600 mr-3" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{activities?.length || 0} Records Found</span>
           </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search logs by contact name or phone..." 
               className="w-full h-16 pl-16 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-4 px-2">
            <button className="h-16 px-8 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 flex items-center gap-3 hover:text-slate-900 transition-all">
               <Filter size={18} /> Filters
            </button>
            <button className="h-16 px-8 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 flex items-center gap-3 hover:text-slate-900 transition-all">
               <Download size={18} /> Export
            </button>
         </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Log ID</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Disposition</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sentiment</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center animate-pulse"><Activity className="mx-auto text-blue-600 mb-4" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Records...</p></td></tr>
                  ) : filteredActivities.length === 0 ? (
                    <tr><td colSpan="6" className="p-20 text-center italic text-slate-400 font-bold uppercase tracking-widest">No matching activities found</td></tr>
                  ) : filteredActivities.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openCallDetails(call)}>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${call.recordingUrl ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-300'}`}>
                                <Headphones size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 italic uppercase">CALL-{call.id}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{new Date(call.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight truncate">{call.lead?.customerName || 'Manual Call'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{call.phone || call.lead?.phone}</p>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                             ['WON', 'INTERESTED'].includes(call.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' :
                             ['NOT_INTERESTED', 'LOST'].includes(call.status) ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                             {call.status || 'UNTAGGED'}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${call.sentiment === 'POSITIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : call.sentiment === 'NEGATIVE' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-300'}`} />
                             <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{call.sentiment || 'NEUTRAL'}</span>
                             {call.sentiment === 'POSITIVE' ? <TrendingUp size={14} className="text-emerald-500" /> : call.sentiment === 'NEGATIVE' ? <TrendingDown size={14} className="text-rose-500" /> : null}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-black text-slate-500 tabular-nums italic">
                          {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                       </td>
                       <td className="px-10 py-8 text-right">
                          <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center">
                             <FileText size={18} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* DETAILS SIDEBAR */}
      <AnimatePresence>
         {isSidebarOpen && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[5000]"
               onClick={() => setIsSidebarOpen(false)}
             />
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[5001] flex flex-col overflow-hidden"
             >
                <div className="p-10 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Record ID: CALL-{selectedCall?.id}</p>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedCall?.lead?.customerName || 'Manual Call'}</h3>
                   </div>
                   <button 
                     onClick={() => setIsSidebarOpen(false)}
                     className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all relative z-10 border border-white/10"
                   >
                      <X size={24} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                   {/* PLAYER */}
                   <div className="bg-slate-50 p-10 rounded-[48px] border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-8">
                         <button className="w-20 h-20 rounded-[32px] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                            <Play size={32} fill="currentColor" />
                         </button>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Call Recording</p>
                            <div className="flex items-center gap-4">
                               <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 w-0" />
                                </div>
                               <span className="text-xs font-black text-slate-900 tabular-nums italic">0:00 / {Math.floor(selectedCall?.duration / 60)}:{(selectedCall?.duration % 60).toString().padStart(2, '0')}</span>
                            </div>
                         </div>
                      </div>
                      <Volume2 size={24} className="text-slate-300" />
                   </div>

                   {/* AI INSIGHTS */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <Sparkles className="text-blue-600" size={20} />
                         <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">AI Call Insights</h4>
                      </div>
                      <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[32px] relative overflow-hidden">
                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic relative z-10">
                            {selectedCall?.summary || "No AI summary available for this record."}
                         </p>
                      </div>
                   </div>

                   {/* TRANSCRIPT */}
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <MessageSquare className="text-slate-900" size={20} />
                            <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">Transcript</h4>
                         </div>
                      </div>
                      <div className="space-y-8">
                         {selectedCall?.transcript ? (
                            <p className="text-base font-bold text-slate-600 leading-loose italic">{selectedCall.transcript}</p>
                         ) : (
                            <div className="space-y-8">
                               <TranscriptLine role="AGENT" time="00:05" text="Hello, thank you for taking my call today." />
                               <TranscriptLine role="CONTACT" time="00:12" text="Hi, I was expecting your call." />
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex gap-4 shrink-0">
                   <button className="flex-1 h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
                      Review Record
                   </button>
                   <button className="flex-1 h-16 bg-white border border-slate-200 text-slate-900 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-50 transition-all">
                      Download Audio
                   </button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>
    </div>
  );
};

const TranscriptLine = ({ role, time, text }) => (
  <div className="flex gap-8">
     <span className="text-[10px] font-black text-slate-300 w-12 shrink-0 pt-1 tabular-nums italic">{time}</span>
     <div className="space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${role === 'AGENT' ? 'text-blue-600' : 'text-slate-900'}`}>{role}</p>
        <p className="text-lg font-bold text-slate-700 leading-relaxed italic">{text}</p>
     </div>
  </div>
);

export default AgentActivity;
