import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  History, 
  Search, 
  Filter, 
  Terminal, 
  User as UserIcon, 
  Globe, 
  Clock, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Monitor,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAuditLogs = () => {
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data.data;
    }
  });

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Activity Logs</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Complete System Audit Trail & Event Monitoring</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Live Monitoring Active</span>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search activity logs..." 
               className="w-full h-16 pl-16 pr-6 bg-[#0F172A] border border-[#0F172A] rounded-2xl focus:ring-[12px] focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-mono text-blue-400 placeholder:text-slate-600"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Timestamp</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">User</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Module</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Metadata</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Sequencing Trace Logs...</td></tr>
                  ) : filteredLogs?.map((log) => (
                    <tr key={log.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <Clock size={16} className="text-slate-300" />
                             <span className="text-sm font-bold text-[#64748B] italic">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <UserIcon size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A] italic uppercase">{log.user?.name}</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{log.user?.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${
                            log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                             {log.action}
                          </span>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <Database size={16} className="text-slate-300" />
                             <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest italic">{log.module}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 text-slate-400">
                                <Globe size={14} />
                                <span className="text-[10px] font-medium uppercase tracking-widest">{log.ipAddress || '127.0.0.1'}</span>
                             </div>
                             <button className="flex items-center gap-3 text-[10px] font-bold text-blue-600 uppercase hover:underline">
                                View Details <ArrowRight size={14} />
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

export default AdminAuditLogs;
