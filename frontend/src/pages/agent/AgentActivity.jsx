import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Search, Filter, Play, Calendar, Clock, Headphones,
  CheckCircle2, XCircle, AlertCircle, Download,
  MessageSquare, Sparkles, FileText, ChevronRight, Activity,
  ArrowRight, X, Volume2, TrendingUp, TrendingDown, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AgentActivity = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'RECORDINGS'
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL'); // ALL, POSITIVE, NEGATIVE, NEUTRAL
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Completed, Busy, Failed, No Answer
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedCall, setSelectedCall] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: activities, isLoading } = useQuery({
    queryKey: ['agentActivity', user?.id],
    queryFn: async () => {
      const res = await api.get('/agent/calls'); 
      return res.data.data || [];
    },
    enabled: !!user?.id
  });

  // Filter logs dynamically
  const filteredActivities = useMemo(() => {
    let logs = activities || [];

    if (activeTab === 'RECORDINGS') {
      logs = logs.filter(c => !!c.recordingUrl);
    }

    return logs.filter(c => {
      const matchSearch = 
        (c.lead?.customerName || 'Manual Call').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.status || '').toLowerCase().includes(search.toLowerCase());
      
      const matchSentiment = 
        sentimentFilter === 'ALL' || 
        (c.sentiment || 'NEUTRAL').toUpperCase() === sentimentFilter;

      const matchStatus = 
        statusFilter === 'ALL' || 
        (c.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchSentiment && matchStatus;
    });
  }, [activities, activeTab, search, sentimentFilter, statusFilter]);

  // Client-side Pagination
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // CSV Export Engine
  const exportToCSV = () => {
    if (filteredActivities.length === 0) {
      return toast.error('No records available to export');
    }

    const headers = ['Call ID', 'Contact Name', 'Phone', 'Timestamp', 'Duration (s)', 'Status', 'Sentiment', 'Summary'];
    const rows = filteredActivities.map(c => [
      `CALL-${c.id}`,
      c.lead?.customerName || 'Manual Call',
      c.phone || '',
      new Date(c.createdAt).toLocaleString(),
      c.duration,
      c.status || 'UNTAGGED',
      c.sentiment || 'NEUTRAL',
      (c.summary || '').replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telephony_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const openCallDetails = (call) => {
    setSelectedCall(call);
    setIsSidebarOpen(true);
  };

  return (
    <div className="space-y-8 pb-20 relative min-h-[calc(100vh-200px)]">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Call Analytics Hub</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Interaction Records & Recordings</p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-sm">
              <Activity size={16} className="text-blue-600 mr-2.5" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{filteredActivities.length} Records</span>
           </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shrink-0">
        <button 
          onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          All Call Logs
        </button>
        <button 
          onClick={() => { setActiveTab('RECORDINGS'); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'RECORDINGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Voice Recordings
        </button>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
               type="text" placeholder="Search by name, status or phone..." 
               className="w-full h-14 pl-14 pr-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
         </div>
         <div className="flex flex-wrap items-center gap-3">
            {/* STATUS FILTER */}
            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-14 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Connected">Connected</option>
              <option value="Busy">Busy</option>
              <option value="Failed">Failed</option>
              <option value="No Answer">No Answer</option>
              <option value="Canceled">Canceled</option>
            </select>

            {/* SENTIMENT FILTER */}
            <select 
              value={sentimentFilter}
              onChange={e => { setSentimentFilter(e.target.value); setCurrentPage(1); }}
              className="h-14 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 focus:outline-none"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>

            <button onClick={exportToCSV} className="h-14 px-6 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
               <Download size={14} /> Export CSV
            </button>
         </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Sentiment</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Preview</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="p-16 text-center animate-pulse">
                        <Activity className="mx-auto text-blue-600 mb-3" size={24} />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Syncing CRM Logs...</p>
                      </td>
                    </tr>
                  ) : paginatedActivities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-16 text-center italic text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No telephony records match active filters
                      </td>
                    </tr>
                  ) : paginatedActivities.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openCallDetails(call)}>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${call.recordingUrl ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                <Headphones size={16} />
                             </div>
                             <div>
                                <p className="text-xs font-black text-slate-800 uppercase italic">CALL-{call.id}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{new Date(call.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{call.lead?.customerName || 'Direct Manual Dial'}</p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{call.phone || 'Unknown'}</p>
                       </td>
                       <td className="px-8 py-6">
                          {(() => {
                             const st = (call.status || '').toLowerCase();
                             let colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
                             if (st === 'completed' || st === 'connected') colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                             else if (st === 'failed' || st === 'canceled') colorClass = 'bg-rose-50 text-rose-600 border-rose-100';
                             else if (st === 'busy' || st === 'no answer') colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
                             
                             return (
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${colorClass}`}>
                                  {call.status || 'UNTAGGED'}
                               </span>
                             );
                          })()}
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${call.sentiment === 'POSITIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : call.sentiment === 'NEGATIVE' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-300'}`} />
                             <span className="text-[9px] font-black text-slate-900 uppercase tracking-wider">{call.sentiment || 'NEUTRAL'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-xs font-black text-slate-500 tabular-nums">
                          {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 group-hover:text-slate-800 flex items-center justify-center transition-all ml-auto border border-slate-100">
                             <ChevronRight size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* PAGINATION SWITCHER */}
         {totalPages > 1 && (
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {currentPage} of {totalPages}</span>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                     <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         )}
      </div>

      {/* DETAILS SIDEBAR */}
      <AnimatePresence>
         {isSidebarOpen && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[5000]"
               onClick={() => setIsSidebarOpen(false)}
             />
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[5001] flex flex-col overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
                   <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Record ID: CALL-{selectedCall?.id}</p>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight">{selectedCall?.lead?.customerName || 'Direct Manual Dial'}</h3>
                   </div>
                   <button 
                     onClick={() => setIsSidebarOpen(false)}
                     className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10"
                   >
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                   {/* PLAYER */}
                   <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between">
                      {selectedCall?.recordingUrl ? (
                         <div className="w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Call Recording Playback</p>
                            <audio controls src={selectedCall.recordingUrl} className="w-full outline-none" />
                            <a href={selectedCall.recordingUrl} download className="mt-4 w-full h-12 bg-white border border-slate-200 text-slate-800 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                              Download Audio Leg
                            </a>
                         </div>
                      ) : (
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center">
                               <Volume2 size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900">No Audio Available</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">This session did not trigger a recording callback.</p>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* AI CALL SUMMARY */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                         <Sparkles className="text-blue-600" size={18} />
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">AI Conversation Summary</h4>
                      </div>
                      <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                            {selectedCall?.summary || "Summary generation pending Twilio transcription webhook."}
                          </p>
                      </div>
                   </div>

                   {/* TRANSCRIPT */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2.5">
                         <MessageSquare className="text-slate-800" size={18} />
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Session Transcript</h4>
                      </div>
                      <div className="space-y-6 bg-slate-50 p-6 rounded-2xl max-h-[300px] overflow-y-auto">
                         {selectedCall?.transcript ? (
                            <p className="text-sm font-bold text-slate-600 leading-loose italic">{selectedCall.transcript}</p>
                         ) : (
                            <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                               Transcript unavailable or pending generation.
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t border-slate-100 flex gap-3 shrink-0">
                   <button onClick={() => setIsSidebarOpen(false)} className="flex-1 h-14 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md hover:bg-slate-800 transition-colors">
                      Acknowledge Review
                   </button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>
    </div>
  );
};

const TranscriptLine = ({ role, time, text }) => (
  <div className="flex gap-4">
     <span className="text-[9px] font-black text-slate-300 w-8 shrink-0 pt-0.5 tabular-nums italic">{time}</span>
     <div className="space-y-0.5">
        <p className={`text-[9px] font-black uppercase tracking-wider ${role === 'AGENT' ? 'text-blue-600' : 'text-slate-800'}`}>{role}</p>
        <p className="text-sm font-bold text-slate-600 leading-relaxed">{text}</p>
     </div>
  </div>
);

export default AgentActivity;
