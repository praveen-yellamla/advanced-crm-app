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
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAuditLogs = () => {
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

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
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tight uppercase italic">Audit Trail</h1>
           <p className="text-[#64748B] font-bold text-[10px] uppercase tracking-widest mt-1">Complete Activity History & System Events</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Live Trace Active</span>
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
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">User</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Action</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Module</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Source</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Activity Logs...</td></tr>
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
                             <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0F172A] group-hover:text-white transition-all">
                                <UserIcon size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A] italic uppercase">{log.user?.name || 'SYSTEM'}</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{log.user?.email || 'AUTOMATED'}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${
                            log.action?.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            log.action?.includes('DELETE') || log.action?.includes('ARCHIVE') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
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
                             <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400">
                                   <Globe size={14} />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">{log.ipAddress || '127.0.0.1'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                   <Monitor size={14} />
                                   <span className="text-[9px] font-medium truncate w-32">{log.userAgent || 'Unified Agent'}</span>
                                </div>
                             </div>
                             <button 
                               onClick={() => setSelectedLog(log)}
                               className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                             >
                                Details <ArrowRight size={14} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl" 
               onClick={() => setSelectedLog(null)} 
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }}
               className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden"
             >
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic">Event Details</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Log ID: {selectedLog.id}</p>
                   </div>
                   <button onClick={() => setSelectedLog(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh]">
                   <div className="grid grid-cols-2 gap-8">
                      <DetailItem label="Action" value={selectedLog.action} />
                      <DetailItem label="Module" value={selectedLog.module} />
                      <DetailItem label="IP Address" value={selectedLog.ipAddress || '127.0.0.1'} />
                      <DetailItem label="Timestamp" value={new Date(selectedLog.createdAt).toLocaleString()} />
                   </div>
                   
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Browser Info</label>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-mono text-slate-600 break-all">
                         {selectedLog.userAgent || 'Unified Platform Agent'}
                      </div>
                   </div>

                   {selectedLog.details && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Details</label>
                        <pre className="p-6 bg-[#0F172A] rounded-3xl text-blue-400 text-xs font-mono overflow-x-auto">
                           {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <p className="text-sm font-black text-[#0F172A] uppercase italic">{value}</p>
  </div>
);

export default AdminAuditLogs;
