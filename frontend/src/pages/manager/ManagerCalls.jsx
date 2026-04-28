import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Headphones, 
  Search, 
  Filter, 
  MoreVertical, 
  Mic, 
  Clock, 
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageSquare,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerCalls = () => {
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: calls, isLoading } = useQuery({
    queryKey: ['managerCalls'],
    queryFn: async () => {
      const res = await api.get('/manager/calls');
      return res.data.data;
    }
  });

  const [qaScores, setQAScores] = useState({
    greeting: 0,
    discovery: 0,
    pitch: 0,
    objectionHandling: 0,
    closing: 0,
    compliance: 0,
    managerNotes: ''
  });

  const qaMutation = useMutation({
    mutationFn: (data) => api.post('/manager/qa/score', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerCalls']);
      toast.success('QA Evaluation Submitted');
      setIsQAModalOpen(false);
      setQAScores({ greeting: 0, discovery: 0, pitch: 0, objectionHandling: 0, closing: 0, compliance: 0, managerNotes: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed')
  });

  const totalScore = Object.values(qaScores).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Quality Control</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Audit team recordings, score performance & provide coaching</p>
        </div>
      </div>

      {/* CALLS LIST */}
      <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Recording</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Agent</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Duration</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">QA Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Review</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Accessing Recording Archive...</td></tr>
                  ) : calls?.map((call) => (
                    <tr key={call.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <button className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 hover:scale-110 transition-transform">
                                <Play size={18} fill="currentColor" />
                             </button>
                             <div>
                                <p className="text-sm font-bold text-[#0F172A]">REC-{call.id}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(call.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 font-semibold text-[#0F172A]">{call.agent.name}</td>
                       <td className="px-10 py-8 font-semibold text-[#64748B]">{call.lead.customerName}</td>
                       <td className="px-10 py-8 text-sm font-bold text-slate-500">{Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}</td>
                       <td className="px-10 py-8">
                          {call.qa ? (
                            <div className="flex items-center gap-3">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                                 call.qa.status === 'PASS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                               }`}>
                                 {call.qa.status} ({Math.round(call.qa.totalScore)}%)
                               </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pending Audit</span>
                          )}
                       </td>
                       <td className="px-10 py-8">
                           <button 
                             onClick={() => { setSelectedCall(call); setIsQAModalOpen(true); }}
                             className="h-12 px-6 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:border-violet-600 hover:text-violet-600 transition-all flex items-center gap-3"
                           >
                              <ShieldCheck size={16} /> Audit Performance
                           </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* QA AUDIT MODAL */}
      <AnimatePresence>
         {isQAModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-3xl" onClick={() => setIsQAModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden">
                 <div className="p-12 border-b border-slate-50 bg-[#F8FAFC]">
                    <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">QA Performance Scorecard</h2>
                    <p className="text-sm font-medium text-[#64748B] mt-2">Evaluating: <span className="text-violet-600 font-bold">{selectedCall?.agent.name}</span> &#x2022; Session REC-{selectedCall?.id}</p>
                 </div>

                 <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    <RubricRow label="Greeting & Introduction" weight="10" value={qaScores.greeting} max={10} onChange={v => setQAScores({...qaScores, greeting: v})} />
                    <RubricRow label="Discovery & Needs Analysis" weight="20" value={qaScores.discovery} max={20} onChange={v => setQAScores({...qaScores, discovery: v})} />
                    <RubricRow label="Product Pitch & Presentation" weight="20" value={qaScores.pitch} max={20} onChange={v => setQAScores({...qaScores, pitch: v})} />
                    <RubricRow label="Objection Handling" weight="20" value={qaScores.objectionHandling} max={20} onChange={v => setQAScores({...qaScores, objectionHandling: v})} />
                    <RubricRow label="Closing & Next Steps" weight="20" value={qaScores.closing} max={20} onChange={v => setQAScores({...qaScores, closing: v})} />
                    <RubricRow label="Compliance & Protocol" weight="10" value={qaScores.compliance} max={10} onChange={v => setQAScores({...qaScores, compliance: v})} />

                    <div className="space-y-4">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Manager Feedback & Coaching Notes</label>
                       <textarea 
                          placeholder="Provide specific coaching feedback here..."
                          className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-violet-600 transition-all font-medium text-sm"
                          value={qaScores.managerNotes} onChange={e => setQAScores({...qaScores, managerNotes: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="p-10 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cumulative Excellence</p>
                        <p className="text-4xl font-extrabold text-[#0F172A] tracking-tighter">{Math.round(totalScore)}<span className="text-xl text-slate-300">/100</span></p>
                    </div>
                    <button 
                      onClick={() => qaMutation.mutate({ ...qaScores, callId: selectedCall.id })}
                      disabled={qaMutation.isPending}
                      className="h-16 px-12 bg-[#0F172A] text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-2xl hover:brightness-125 transition-all"
                    >
                      {qaMutation.isPending ? 'Loading...ore card...' : 'Submit Evaluation'}
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

    </div>
  );
};

const RubricRow = ({ label, weight, value, max, onChange }) => (
  <div className="space-y-4">
     <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <span className="text-sm font-bold text-[#0F172A]">{label}</span>
           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Weight: {weight}%</span>
        </div>
        <span className="text-sm font-bold text-violet-600">{value} / {max}</span>
     </div>
     <input 
        type="range" min="0" max={max} step="1" 
        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
        value={value} onChange={e => onChange(parseInt(e.target.value))}
     />
  </div>
);

export default ManagerCalls;
