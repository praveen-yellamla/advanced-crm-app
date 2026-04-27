import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, 
  Search, 
  MoreHorizontal, 
  Play, 
  Download, 
  Clock, 
  User as UserIcon, 
  Globe, 
  Flag,
  Headphones,
  Mic,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminCalls = () => {
  const [search, setSearch] = useState('');

  const { data: calls, isLoading } = useQuery({
    queryKey: ['adminCalls'],
    queryFn: async () => {
      const res = await api.get('/admin/calls');
      return res.data.data;
    }
  });

  const filteredCalls = calls?.filter(call => 
    call.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
    call.lead?.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Voice Repository.</h1>
           <p className="text-[#64748B] font-bold text-sm uppercase tracking-widest mt-2">Historical Communication Protocol Trace</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
              <Headphones className="text-blue-600" size={18} />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Playback Sync</span>
           </div>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Mic className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search agent, lead identity, or node..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-3xl focus:ring-[12px] focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button className="h-16 px-8 bg-[#0F172A] text-white rounded-3xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-xl">
            <Calendar size={18} /> Temporal Window
         </button>
      </div>

      {/* CALLS TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Temporal Node</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Strategic Agent</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Entity Target</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Duration</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Protocol State</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Playback</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Streaming Metadata Flow...</td></tr>
                  ) : filteredCalls?.map((call) => (
                    <tr key={call.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <Clock size={16} className="text-slate-300" />
                             <span className="text-sm font-bold text-slate-500 italic">{new Date(call.createdAt).toLocaleString()}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <UserIcon size={18} />
                             </div>
                             <p className="text-sm font-black text-[#0F172A] uppercase italic">{call.agent?.name}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-black text-[#64748B] uppercase italic">{call.lead?.customerName}</td>
                       <td className="px-10 py-8 text-xl font-black text-[#0F172A] tracking-tighter italic">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</td>
                       <td className="px-10 py-8">
                          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl w-fit border italic ${
                            call.callStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                             <div className={`w-2 h-2 rounded-full ${call.callStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{call.callStatus}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex gap-3">
                             <button className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:brightness-110 shadow-lg shadow-blue-500/20">
                                <Play size={18} fill="currentColor" />
                             </button>
                             <button className="w-12 h-12 bg-white border border-[#E2E8F0] text-slate-400 rounded-xl flex items-center justify-center hover:text-rose-500 hover:border-rose-100 transition-all">
                                <Flag size={18} />
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

export default AdminCalls;
