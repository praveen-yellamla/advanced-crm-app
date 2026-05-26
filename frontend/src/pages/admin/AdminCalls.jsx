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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Call Logs</span>
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Call History</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Audit and playback of call logs history</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[120px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Minutes</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round((calls?.reduce((acc, c) => acc + (c.duration || 0), 0) || 0) / 60)}m</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[120px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stored Audios</p>
              <p className="text-2xl font-bold text-slate-900">{calls?.filter(c => c.recordingUrl).length || 0}</p>
           </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
               type="text" 
               placeholder="Search agents, customers, or call IDs..." 
               className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900 text-sm shadow-sm"
               value={search}
               onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button 
            onClick={() => toast.success('Call filters active')}
            className="h-10 px-6 bg-slate-900 text-white rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
         >
            <Filter size={16} /> Filter Calls
         </button>
      </div>

      {/* CALL LOGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
         <table className="crm-table min-w-[1000px]">
            <thead>
               <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Time & Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Agent</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">AI Review</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Playback</th>
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
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : 'N/A'}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                             <Clock size={12} /> {call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
                             {call.agent?.name?.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 uppercase">{call.agent?.name}</p>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{call.lead?.customerName || 'Direct'}</p>
                          <p className="text-xs font-medium text-slate-500">{call.phone}</p>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md w-fit border ${
                         call.status === 'completed' || call.status === 'answered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                         call.status === 'ringing' || call.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                         'bg-slate-50 text-slate-500 border-slate-200'
                       }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${call.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className="text-xs font-semibold uppercase tracking-wider">{call.status}</span>
                       </div>
                       <p className="text-xs font-semibold text-slate-400 mt-1.5">{formatSeconds(call.duration)}</p>
                    </td>
                    <td className="px-6 py-4">
                       {call.tags ? (
                         <div className="space-y-1.5">
                            <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">{call.tags}</span>
                            {call.notes && <p className="text-xs font-medium text-slate-500 line-clamp-1 max-w-[150px]">"{call.notes}"</p>}
                         </div>
                       ) : (
                         <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Intel</span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       {call.recordingUrl ? (
                         <div className="flex gap-2">
                            <button 
                              onClick={() => setPlayingSid(playingSid === call.sid ? null : call.sid)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                                playingSid === call.sid ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                               {playingSid === call.sid ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                            </button>
                            <a 
                              href={call.recordingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                            >
                               <Download size={16} />
                            </a>
                         </div>
                       ) : (
                         <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                            <Mic size={16} />
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
                className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[500px] bg-slate-900 text-white p-6 rounded-2xl shadow-2xl z-[300] border border-white/10 backdrop-blur-xl"
              >
                 <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <History size={20} className="animate-spin [animation-duration:3s]" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Active Playback</p>
                          <h4 className="text-sm font-semibold tracking-tight">Call Segment: {playingSid.slice(-8)}</h4>
                       </div>
                    </div>
                    <div className="flex-1 px-4">
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: '100%' }} 
                             transition={{ duration: 15 }} // Mock progress
                             className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" 
                          />
                       </div>
                    </div>
                    <button onClick={() => setPlayingSid(null)} className="text-white/40 hover:text-white transition-colors">
                       <X size={18} />
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
