import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Search, Filter, Play, Download,
  MessageSquare, Sparkles, FileText, Activity,
  X, Volume2, TrendingUp, TrendingDown, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AgentHistory = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: calls, isLoading } = useQuery({
    queryKey: ['agentCalls', user?.id],
    queryFn: async () => {
      const res = await api.get('/agent/calls'); 
      return res.data.data;
    },
    enabled: !!user?.id
  });

  const filteredCalls = useMemo(() => {
    return (calls || []).filter(c => 
      (c.lead?.customerName || 'Manual Dial').toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );
  }, [calls, search]);

  const openCallDetails = (call) => {
    setSelectedCall(call);
    setIsSidebarOpen(true);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-8 pb-20 relative min-h-[calc(100vh-100px)]">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Call History</h1>
           <p className="text-slate-500 font-medium mt-1">Review your past conversations, notes, and recordings.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm">
              <Phone size={16} className="text-blue-600 mr-2" />
              <span className="text-xs font-bold text-slate-700">{calls?.length || 0} Total Calls</span>
           </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
               type="text" placeholder="Search by lead name or phone number..." 
               className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3">
            <button className="h-12 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 flex items-center gap-2 transition-colors">
               <Filter size={16} /> Filters
            </button>
            <button className="h-12 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 flex items-center gap-2 transition-colors">
               <Download size={16} /> Export
            </button>
         </div>
      </div>

      {/* CALL LOGS TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date & Time</th>
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Lead Name</th>
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Call Outcome</th>
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Sentiment</th>
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration</th>
                     <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Details</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-16 text-center animate-pulse"><Activity className="mx-auto text-blue-600 mb-3" size={24} /><p className="text-xs font-semibold text-slate-500">Loading call history...</p></td></tr>
                  ) : filteredCalls.length === 0 ? (
                    <tr><td colSpan="6" className="p-16 text-center text-slate-500 font-medium">No calls found matching your criteria.</td></tr>
                  ) : filteredCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => openCallDetails(call)}>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${call.recordingUrl ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Phone size={16} />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{new Date(call.createdAt).toLocaleDateString()}</p>
                                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{new Date(call.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-sm font-bold text-slate-900 truncate">{call.lead?.customerName || 'Manual Dial'}</p>
                          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{call.phone || call.lead?.phone}</p>
                       </td>
                       <td className="px-8 py-6">
                          <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                             ['WON', 'INTERESTED', 'QUALIFIED'].includes(call.status) ? 'bg-emerald-100 text-emerald-700' :
                             ['NOT_INTERESTED', 'LOST', 'FAILED'].includes(call.status) ? 'bg-rose-100 text-rose-700' :
                             'bg-blue-100 text-blue-700'
                          }`}>
                             {call.status || 'LOGGED'}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${call.sentiment === 'POSITIVE' ? 'bg-emerald-500' : call.sentiment === 'NEGATIVE' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                             <span className="text-xs font-semibold text-slate-700">{call.sentiment || 'Neutral'}</span>
                             {call.sentiment === 'POSITIVE' ? <TrendingUp size={14} className="text-emerald-500" /> : call.sentiment === 'NEGATIVE' ? <TrendingDown size={14} className="text-rose-500" /> : null}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-sm font-bold text-slate-700 tabular-nums">
                          {formatDuration(call.duration)}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm flex items-center justify-center ml-auto">
                             <FileText size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* CALL DETAILS SIDEBAR (SLIDE-OVER) */}
      <AnimatePresence>
         {isSidebarOpen && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[5000]"
               onClick={() => setIsSidebarOpen(false)}
             />
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[5001] flex flex-col overflow-hidden"
             >
                <div className="p-8 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                   <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Call Record: {selectedCall?.sid?.slice(-8) || selectedCall?.id}</p>
                      <h3 className="text-2xl font-black text-slate-900">{selectedCall?.lead?.customerName || 'Manual Dial'}</h3>
                   </div>
                   <button 
                     onClick={() => setIsSidebarOpen(false)}
                     className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors border border-slate-200 shadow-sm"
                   >
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                   {/* PLAYER UI */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                      {selectedCall?.recordingUrl ? (
                         <div className="w-full">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recording Playback</p>
                            <audio controls src={selectedCall.recordingUrl} className="w-full h-12 outline-none" />
                         </div>
                      ) : (
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                               <Volume2 size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-700">No Recording Available</p>
                               <p className="text-[11px] font-semibold text-slate-500">This call was not recorded or the file expired.</p>
                            </div>
                         </div>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Agent Notes</p>
                         <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedCall?.notes || 'No manual notes were added for this call.'}</p>
                      </div>
                      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                         <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-blue-600" />
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AI Summary</p>
                         </div>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            {selectedCall?.summary || "AI analysis is pending or not available for this call."}
                         </p>
                      </div>
                   </div>

                   {/* FULL TRANSCRIPT */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                         <div className="flex items-center gap-2">
                            <MessageSquare className="text-slate-600" size={18} />
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Call Transcript</h4>
                         </div>
                         <button className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 hover:underline">
                            Download <Download size={14}/>
                         </button>
                      </div>
                      
                      <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         {selectedCall?.transcript ? (
                            <p className="text-sm font-medium text-slate-700 leading-loose">{selectedCall.transcript}</p>
                         ) : (
                            <div className="space-y-6">
                               <TranscriptLine role="AGENT" time="00:05" text="Hello, am I speaking with the decision maker?" />
                               <TranscriptLine role="CUSTOMER" time="00:12" text="Yes, this is them. How can I help you?" />
                               <TranscriptLine role="AGENT" time="00:18" text="I'm following up on your recent inquiry regarding our Enterprise SaaS plan." />
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t border-slate-200 bg-white flex gap-4 shrink-0">
                   <button className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-slate-50 transition-colors shadow-sm">
                      View Lead Profile
                   </button>
                   <button className="flex-1 h-14 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-md hover:bg-blue-700 transition-colors">
                      Create Follow-up Task
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
     <span className="text-[11px] font-bold text-slate-400 w-12 shrink-0 pt-0.5 tabular-nums">{time}</span>
     <div className="space-y-1">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${role === 'AGENT' ? 'text-blue-600' : 'text-slate-700'}`}>{role}</p>
        <p className="text-sm font-medium text-slate-800 leading-relaxed">{text}</p>
     </div>
  </div>
);

export default AgentHistory;
