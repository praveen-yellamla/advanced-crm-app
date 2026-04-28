import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Clock, 
  User, 
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const AgentFeedback = () => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['agentFeedback'],
    queryFn: async () => {
      const res = await api.get('/agent/feedback');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Coaching</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Review manager feedback, QA audits & performance insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         {/* FEEDBACK FEED */}
         <div className="xl:col-span-2 space-y-8">
            {isLoading ? (
               <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Feedback Stream...</div>
            ) : feedback?.map((f) => (
              <motion.div 
                key={f.id}
                whileHover={{ x: 5 }}
                className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative group overflow-hidden"
              >
                 <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-8">
                       <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100 flex-shrink-0">
                          <MessageSquare size={28} />
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest px-3 py-1 bg-violet-50 rounded-lg">Manager Feedback</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{new Date(f.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight leading-relaxed">{f.content}</h3>
                          {f.suggestions && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                               <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2 flex items-center gap-2 italic"><Star size={12} className="text-amber-500" /> Improvement Protocol</p>
                               <p className="text-sm font-medium text-slate-600 leading-relaxed">{f.suggestions}</p>
                            </div>
                          )}
                       </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase border h-fit ${
                      f.priority === 'URGENT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                       {f.priority}
                    </div>
                 </div>
                 
                 <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                          {f.manager.name.charAt(0)}
                       </div>
                       <span className="text-sm font-bold text-slate-900">{f.manager.name}</span>
                       <span className="text-xs text-slate-400 font-medium">&#x2022; Regional Manager</span>
                    </div>
                    <button className="h-12 px-8 bg-slate-50 text-slate-900 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center gap-3 shadow-sm">
                       <AcknowledgeIcon /> Acknowledge Refresh
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>

         {/* SIDEBAR: RATINGS */}
         <div className="space-y-8">
            <div className="bg-[#0F172A] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-bold tracking-tight">Personal Quality Index</h3>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-5xl font-black tracking-tighter tabular-nums">4.8<span className="text-xl text-blue-400">/5.0</span></p>
                        <p className="text-[10px] font-bold uppercase mt-2 opacity-60">Manager Confidence Score</p>
                     </div>
                     <Star size={64} className="text-amber-400 opacity-20 group-hover:scale-125 transition-transform duration-700" fill="currentColor" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24" />
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-widest">Active Certification</h3>
                  <ShieldCheck size={20} className="text-violet-600" />
               </div>
               <div className="space-y-6">
                  <CerCard label="Strategic Selling" status="EXPERT" val={92} />
                  <CerCard label="Compliance Protocol" status="VERIFIED" val={100} />
                  <CerCard label="Objection Handling" status="MASTER" val={88} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const CerCard = ({ label, status, val }) => (
  <div className="space-y-3">
     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className="text-violet-600">{status}</span>
     </div>
     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
        <div className="h-full bg-violet-600 rounded-full" style={{ width: `${val}%` }} />
     </div>
  </div>
);

const AcknowledgeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);

export default AgentFeedback;
