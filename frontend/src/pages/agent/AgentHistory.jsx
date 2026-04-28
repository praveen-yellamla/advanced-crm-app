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

const AgentHistory = () => {
  const { data: calls, isLoading } = useQuery({
    queryKey: ['agentCalls'],
    queryFn: async () => {
      const res = await api.get('/agent/calls');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Call Logs</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Audit personal recording logs & session dispositions</p>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by customer name or disposition..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
            />
         </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Recording Seq.</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer Identity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Session Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Duration</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Accessing Digital Archives...</td></tr>
                  ) : calls?.map((call) => (
                    <tr key={call.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <button className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform">
                                <Play size={18} fill="currentColor" />
                             </button>
                             <div>
                                <p className="text-sm font-bold text-[#0F172A]">REC-{call.id}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic tracking-tight">{new Date(call.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <p className="text-lg font-bold text-[#0F172A] tracking-tight">{call.lead.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{call.lead.phone}</p>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[9px] font-bold uppercase tracking-widest ${
                             ['WON', 'INTERESTED'].includes(call.callStatus) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             ['NOT_INTERESTED', 'LOST'].includes(call.callStatus) ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {call.callStatus.replace('_', ' ')}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-bold text-slate-500 tabular-nums">
                          {Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
                                <Download size={18} />
                             </button>
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
