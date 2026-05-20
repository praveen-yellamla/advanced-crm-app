import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, 
  Search, 
  MoreHorizontal, 
  Play, 
  Pause,
  Download, 
  Clock, 
  User as UserIcon, 
  Globe, 
  Flag,
  Headphones,
  Mic,
  Calendar,
  Filter,
  ArrowRight,
  Music,
  ExternalLink,
  MessageSquare,
  Activity,
  History,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminCalls = () => {
  const [search, setSearch] = useState('');
  const [playingSid, setPlayingSid] = useState(null);

  const { data: calls, isLoading } = useQuery({
    queryKey: ['adminCalls'],
    queryFn: async () => {
      const res = await api.get('/call/history/all');
      return res.data.data;
    }
  });

  const filteredCalls = calls?.filter(call => 
    call.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
    call.lead?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    call.phone?.includes(search)
  );

  const formatSeconds = (s) => {
    if (!s) return '0s';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />
        <div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Call Logs</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Call <span className="text-slate-200">History</span></h1>
           <p className="text-[#64748B] font-bold text-sm tracking-tight mt-2">Audit and playback of call logs history</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Minutes</p>
              <p className="text-2xl font-black text-[#0F172A] italic">{Math.round((calls?.reduce((acc, c) => acc + (c.duration || 0), 0) || 0) / 60)}m</p>
           </div>
           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stored Audios</p>
              <p className="text-2xl font-black text-[#0F172A] italic">{calls?.filter(c => c.recordingUrl).length || 0}</p>
           </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Search agents, customers, or call IDs..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[28px] focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm"
               value={search}
               onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button 
            onClick={() => toast.success('Call filters active')}
            className="h-16 px-10 bg-[#0F172A] text-white rounded-[28px] flex items-center gap-4 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
         >
            <Filter size={18} /> Filter Calls
         </button>
      </div>

      {/* CALL LOGS TABLE */}
      <div className="bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
               <tr className="bg-slate-50/50">
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Time & Date</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Agent</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Customer</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Status</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">AI Review</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Playback</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {isLoading ? (
                 <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading call logs...</td></tr>
               ) : filteredCalls?.map((call) => (
                 <motion.tr 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }}
                   key={call.id} 
                   className="hover:bg-slate-50/50 transition-all group"
                 >
                    <td className="px-10 py-8">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-[#0F172A] italic">{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : 'N/A'}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <Clock size={10} /> {call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black italic shadow-inner">
                             {call.agent?.name?.charAt(0)}
                          </div>
                          <p className="text-sm font-black text-[#0F172A] uppercase italic">{call.agent?.name}</p>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-[#0F172A] tracking-tight">{call.lead?.customerName || 'Direct'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{call.phone}</p>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className={`flex items-center gap-3 px-4 py-2 rounded-xl w-fit border italic ${
                         call.status === 'completed' || call.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                         call.status === 'ringing' || call.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         'bg-slate-50 text-slate-400 border-slate-100'
                       }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${call.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{call.status}</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2 ml-1">{formatSeconds(call.duration)}</p>
                    </td>
                    <td className="px-10 py-8">
                       {call.tags ? (
                         <div className="space-y-2">
                            <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">{call.tags}</span>
                            {call.notes && <p className="text-[10px] font-medium text-slate-500 line-clamp-1 italic max-w-[150px]">"{call.notes}"</p>}
                         </div>
                       ) : (
                         <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic">No Intel Logged</span>
                       )}
                    </td>
                    <td className="px-10 py-8">
                       {call.recordingUrl ? (
                         <div className="flex gap-3">
                            <button 
                              onClick={() => setPlayingSid(playingSid === call.sid ? null : call.sid)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                                playingSid === call.sid ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse' : 'bg-blue-600 text-white shadow-blue-500/20 hover:scale-110'
                              }`}
                            >
                               {playingSid === call.sid ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                            </button>
                            <a 
                              href={call.recordingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-blue-600 hover:border-blue-200 transition-all"
                            >
                               <Download size={18} />
                            </a>
                         </div>
                       ) : (
                         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <Mic size={18} />
                         </div>
                       )}
                    </td>
                 </motion.tr>
               ))}
            </tbody>
         </table>

         <AnimatePresence>
            {playingSid && (
              <motion.div 
                initial={{ y: 100 }} 
                animate={{ y: 0 }} 
                exit={{ y: 100 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[500px] bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl z-[300] border border-white/10 backdrop-blur-xl"
              >
                 <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                          <History size={24} className="animate-spin [animation-duration:3s]" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Playback</p>
                          <h4 className="text-sm font-black italic tracking-tight">Call Segment: {playingSid.slice(-8)}</h4>
                       </div>
                    </div>
                    <div className="flex-1 px-4">
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: '100%' }} 
                             transition={{ duration: 15 }} // Mock progress
                             className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" 
                          />
                       </div>
                    </div>
                    <button onClick={() => setPlayingSid(null)} className="text-white/40 hover:text-white transition-colors">
                       <X size={20} />
                    </button>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminCalls;
