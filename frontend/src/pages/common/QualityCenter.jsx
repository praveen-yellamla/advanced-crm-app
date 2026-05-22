import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  Play, 
  Download, 
  Flag, 
  Headphones, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  MoreHorizontal,
  FileBarChart,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const QualityCenter = ({ role = 'ADMIN' }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // 1. DATA ACQUISITION
  const { data: calls, isLoading } = useQuery({
    queryKey: ['qcCalls', role, activeTab],
    queryFn: async () => {
      const endpoint = role === 'ADMIN' ? '/admin/calls' : '/manager/calls';
      const res = await api.get(endpoint);
      return res.data.data;
    }
  });

  const filteredCalls = calls?.filter(call => {
    const matchesSearch = call.agent?.name?.toLowerCase().includes(search.toLowerCase()) || 
                         call.lead?.customerName?.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'FLAGGED') return matchesSearch && call.isFlagged;
    if (activeTab === 'PENDING') return matchesSearch && !call.qa;
    return matchesSearch;
  });

  // 2. ANALYTICS CALCULATIONS
  const stats = {
    totalReviewed: calls?.filter(c => c.qa).length || 0,
    avgScore: calls?.filter(c => c.qa).reduce((acc, c) => acc + (c.qa.totalScore || 0), 0) / (calls?.filter(c => c.qa).length || 1),
    complianceRate: 98.4,
    pendingReviews: calls?.filter(c => !c.qa).length || 0,
    flagged: calls?.filter(c => c.isFlagged).length || 0
  };

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 italic">Quality Assurance</span>
           </div>
            <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase underline decoration-indigo-600 decoration-8 underline-offset-8">Quality Center.</h1>
            <p className="text-sm font-bold text-slate-400 mt-5 max-w-xl leading-relaxed uppercase italic">Advanced Call Monitoring & Quality Assurance Dashboard</p>
        </div>
        <div className="flex gap-4">
           <button className="h-16 px-10 bg-[#0F172A] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">
              <Download size={18} /> Export Quality Logs
           </button>
        </div>
      </div>

      {/* KPI TOP GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         <KPICard label="Total Reviews" value={stats.totalReviewed} icon={ShieldCheck} color="indigo" />
         <KPICard label="Avg Performance Score" value={`${Math.round(stats.avgScore)}%`} icon={Star} color="amber" />
         <KPICard label="Compliance Rate" value={`${stats.complianceRate}%`} icon={CheckCircle2} color="emerald" />
         <KPICard label="Pending QA Audit" value={stats.pendingReviews} icon={Clock} color="slate" />
         <KPICard label="Priority Flags" value={stats.flagged} icon={Flag} color="rose" />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by agent name, customer, or call ID..." 
               className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-[32px] focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm italic"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm">
            {['ALL', 'PENDING', 'COMPLETED', 'FLAGGED'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 h-14 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:text-indigo-600'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
         <button className="h-18 px-10 bg-white border border-slate-100 rounded-[32px] text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Filter size={20} />
         </button>
      </div>

      {/* CORE REPOSITORY GRID */}
      <div className="bg-white rounded-[56px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto overflow-y-hidden">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Call ID</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Agent Name</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Duration</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Sentiment Score</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Compliance Status</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse italic">Accessing Call Records...</td></tr>
                  ) : filteredCalls?.length === 0 ? (
                    <tr><td colSpan="6" className="p-32 text-center text-slate-300 font-bold italic uppercase">No call history discovered.</td></tr>
                  ) : filteredCalls?.map((call) => (
                    <tr key={call.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-700 group">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all shadow-inner border border-slate-100">
                                <Headphones size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A] uppercase italic">CALL-{call.id}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{new Date(call.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div>
                             <p className="text-sm font-black text-[#0F172A] uppercase italic">{call.agent?.name}</p>
                             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Lead: {call.lead?.customerName}</p>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <span className="text-xl font-black text-[#0F172A] tracking-tighter italic">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</span>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-3">
                             <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden p-[1px]">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-500 rounded-full" />
                             </div>
                             <span className="text-[10px] font-black text-emerald-600 uppercase italic">Positive</span>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl w-fit border shadow-sm italic ${
                            call.qa ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                             <div className={`w-2 h-2 rounded-full ${call.qa ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{call.qa ? 'Verified' : 'Pending Audit'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <button 
                            onClick={() => { setSelectedCall(call); setIsReviewOpen(true); }}
                            className="h-14 px-8 bg-white border border-slate-200 text-[#0F172A] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-indigo-600 hover:text-indigo-600 hover:scale-105 transition-all flex items-center gap-4 italic"
                          >
                             Review Session <ChevronRight size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* PERFORMANCE AUDIT DRAWER */}
      <AnimatePresence>
         {isReviewOpen && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#0F172A]/80 backdrop-blur-3xl" onClick={() => setIsReviewOpen(false)} />
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="fixed right-0 top-0 h-screen w-full lg:w-[1000px] bg-white z-[201] shadow-2xl flex flex-col pt-24"
              >
                 {/* DRAWER HEADER */}
                 <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                             <ShieldCheck size={28} />
                          </div>
                          <div>
                             <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Review Session.</h2>
                             <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Call ID: CALL-{selectedCall?.id} &#x2022; Agent: <span className="text-indigo-600 font-black italic">{selectedCall?.agent.name}</span></p>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setIsReviewOpen(false)} className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm">
                       <MoreHorizontal size={24} />
                    </button>
                 </div>

                 {/* DRAWER CONTENT */}
                 <div className="flex-1 overflow-y-auto p-12 space-y-16 scrollbar-hide">
                    {/* PLAYER SECTION */}
                    <div className="bg-[#0F172A] p-12 rounded-[56px] shadow-2xl relative overflow-hidden">
                       <div className="relative z-10 space-y-10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Live Recording Feed</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter cursor-default">Call Recording</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="h-10 px-4 bg-white/10 rounded-xl flex items-center gap-3 text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 italic">
                                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Live Meta Trace
                                </div>
                             </div>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] flex flex-col md:flex-row items-center gap-10">
                             <button className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center hover:scale-105 transition-all shadow-2xl shadow-indigo-500/40">
                                <Play size={40} fill="currentColor" />
                             </button>
                             <div className="flex-1 space-y-6">
                                <div className="h-12 w-full bg-white/5 rounded-2xl flex items-center px-6 relative overflow-hidden">
                                   <div className="absolute left-0 top-0 h-full bg-indigo-500/20 w-[45%]" />
                                   <div className="flex-1 h-px bg-white/10 relative">
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full border-4 border-[#0F172A] shadow-xl" />
                                   </div>
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-all italic">
                                   <span>04:12</span>
                                   <span>14:50</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       <FileBarChart className="absolute -bottom-24 -right-24 text-white/5" size={400} />
                    </div>

                    {/* AI TRANSCRIPT & RUBRIC */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                       {/* RUBRIC */}
                       <div className="space-y-10">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6">Quality Rubric <div className="h-px flex-1 bg-slate-100" /></h4>
                          <div className="space-y-8">
                             {[
                               { label: 'Opening Script', max: 10 },
                               { label: 'Discovery Phase', max: 20 },
                               { label: 'Proposition Pitch', max: 20 },
                               { label: 'Objection Handling', max: 20 },
                               { label: 'Closing Phase', max: 20 },
                               { label: 'Compliance Check', max: 10 },
                             ].map((rubric, i) => (
                               <div key={i} className="space-y-4 group">
                                  <div className="flex justify-between text-sm font-black text-[#0F172A] uppercase italic transition-all group-hover:text-indigo-600">
                                     <span>{rubric.label}</span>
                                     <span>15 / {rubric.max}</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-50 rounded-full p-[1px] border border-slate-100">
                                     <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-indigo-600 rounded-full shadow-lg" />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       {/* INTELLIGENCE FEED */}
                       <div className="space-y-10">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-6">Cognitive Trace <div className="h-px flex-1 bg-slate-100" /></h4>
                          <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-slate-100 italic">
                             <div className="space-y-4">
                                <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase italic">AI Analysis</span>
                                <p className="text-sm font-bold text-[#0F172A] leading-relaxed">Agent maintained high thermal energy during the product pitch. A critical objection regarding "Enterprise Scalability" was detected but handled with 82% confidence. Recommendation: Further training on Objection Point 4: Pricing Friction.</p>
                             </div>
                             <div className="space-y-6 pt-6 border-t border-slate-200">
                                <div className="flex items-center gap-4 text-emerald-600">
                                   <CheckCircle2 size={18} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Opening Script Verified</span>
                                </div>
                                <div className="flex items-center gap-4 text-rose-500">
                                   <AlertCircle size={18} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Missed Tactical Re-Pitch</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* COACHING TERMINAL */}
                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Coaching Feedback</label>
                       <textarea 
                          placeholder="Provide institutional feedback to the operational agent..."
                          className="w-full h-48 p-10 bg-slate-50 border border-slate-200 rounded-[48px] outline-none focus:border-indigo-600 transition-all font-black text-sm text-[#0F172A] leading-relaxed italic placeholder:text-slate-300"
                       />
                    </div>
                 </div>

                 {/* DRAWER FOOTER */}
                 <div className="p-12 border-t border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Operational Performance Grade</p>
                        <p className="text-6xl font-black text-[#0F172A] tracking-tighter italic">84.2<span className="text-2xl text-slate-200 font-bold">/100</span></p>
                    </div>
                    <div className="flex gap-6">
                       <button className="h-20 px-10 bg-white border border-slate-200 text-rose-500 rounded-[32px] text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm">
                          Flag Escalation
                       </button>
                       <button className="h-20 px-12 bg-[#0F172A] text-white rounded-[32px] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all italic">
                          Save Evaluation
                       </button>
                    </div>
                 </div>
              </motion.div>
           </>
         )}
      </AnimatePresence>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-400 border-slate-100',
    rose: 'bg-rose-50 text-rose-500 border-rose-100',
  };
  
  return (
    <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 group hover:shadow-xl transition-all duration-700 bg-white`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{label}</p>
        <p className="text-3xl font-black text-[#0F172A] tracking-tighter mt-2 italic uppercase">{value}</p>
      </div>
    </div>
  );
};

export default QualityCenter;
