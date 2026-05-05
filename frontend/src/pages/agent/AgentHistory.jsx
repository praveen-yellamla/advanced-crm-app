import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, 
  Search, 
  Filter, 
  Play, 
  Calendar, 
  Clock, 
  Headphones,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AgentHistory = () => {
  const { user } = useAuth();
  
  const { data: calls, isLoading } = useQuery({
    queryKey: ['agentCalls', user?.id],
    queryFn: async () => {
      const res = await api.get(`/call/history/${user.id}`);
      return res.data.data;
    },
    enabled: !!user?.id
  });

  const playRecording = (url) => {
    if (!url) return toast.error('Recording still processing or unavailable');
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Call History</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Review your recent calls and recordings</p>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Call ID</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Disposition</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Duration</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Accessing Digital Archives...</td></tr>
                  ) : calls?.length === 0 ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No call logs found</td></tr>
                  ) : calls?.map((call) => (
                    <tr key={call.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <button 
                               onClick={() => playRecording(call.recordingUrl)}
                               className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                                 call.recordingUrl ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                               }`}
                             >
                                <Play size={18} fill="currentColor" />
                             </button>
                             <div>
                                <p className="text-sm font-bold text-[#0F172A]">REC-{call.sid.slice(-6)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic tracking-tight">{new Date(call.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <p className="text-lg font-bold text-[#0F172A] tracking-tight">{call.lead?.customerName || 'Direct Dial'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{call.phone}</p>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[9px] font-bold uppercase tracking-widest ${
                             ['WON', 'INTERESTED'].includes(call.tags) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             ['NOT_INTERESTED', 'LOST'].includes(call.tags) ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {call.tags || 'UNTAGGED'}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-bold text-slate-500 tabular-nums">
                          {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <a 
                               href={call.recordingUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className={`w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center ${!call.recordingUrl && 'opacity-20 pointer-events-none'}`}
                             >
                                <Download size={18} />
                             </a>
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-violet-600 hover:text-violet-600 transition-all flex items-center justify-center">
                                <MoreVertical size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AgentHistory;
