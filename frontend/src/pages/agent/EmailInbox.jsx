import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Inbox, Send, FileText, Trash2, Search, Filter, 
  RefreshCw, Plus, MoreVertical, Star, Clock, 
  User, ExternalLink, Archive, AlertCircle,
  Paperclip, Reply, Forward, X, Sparkles, ArrowRight,
  ShieldCheck, Eye, MousePointer2, Download, ReplyAll
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmailComposer from '../../components/email/EmailComposer';

const EmailInbox = () => {
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerReplyThread, setComposerReplyThread] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Fetch Thread List
  const { data: threadData, isLoading, refetch } = useQuery({
    queryKey: ['emailThreads', activeFolder, search],
    queryFn: async () => {
      const res = await api.get(`/email-threads?folder=${activeFolder}&search=${search}`);
      return res.data;
    }
  });

  // Fetch Selected Thread Detail
  const { data: selectedThreadDetail, isLoading: isThreadLoading } = useQuery({
    queryKey: ['emailThreadDetail', selectedThreadId],
    queryFn: async () => {
      const res = await api.get(`/email-threads/${selectedThreadId}`);
      return res.data.data;
    },
    enabled: !!selectedThreadId
  });

  const threads = threadData?.data || [];
  const counts = threadData?.counts || {};

  const handleSync = async () => {
    try {
      await api.post('/email/sync');
      toast.success('Communication Stream Synchronizing...');
      setTimeout(() => refetch(), 3000);
    } catch (error) {
      toast.error('Uplink Failed');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'URGENT': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* COLUMN 1: FOLDER SYSTEM */}
      <div className="w-[260px] flex flex-col gap-6 shrink-0">
         <button 
            onClick={() => { setComposerReplyThread(null); setIsComposerOpen(true); }}
            className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
         >
            <Plus size={16} className="text-blue-400 group-hover:rotate-90 transition-transform" /> 
            Compose
         </button>

         <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/60 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Directory</h3>
               <RefreshCw size={14} className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={handleSync} />
            </div>
            <nav className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-hide">
               {[
                 { id: 'INBOX', label: 'Inbox', icon: Inbox, color: 'blue' },
                 { id: 'UNREAD', label: 'Unread', icon: Eye, color: 'indigo' },
                 { id: 'STARRED', label: 'Starred', icon: Star, color: 'amber' },
                 { id: 'SENT', label: 'Sent', icon: Send, color: 'emerald' },
                 { id: 'DRAFTS', label: 'Drafts', icon: FileText, color: 'slate' },
                 { id: 'ARCHIVED', label: 'Archive', icon: Archive, color: 'slate' },
                 { id: 'TRASH', label: 'Trash', icon: Trash2, color: 'rose' },
               ].map((folder) => (
                 <button
                   key={folder.id}
                   onClick={() => { setActiveFolder(folder.id); setSelectedThreadId(null); }}
                   className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 group ${
                     activeFolder === folder.id 
                     ? 'bg-slate-900 text-white shadow-lg' 
                     : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                   }`}
                 >
                   <div className="flex items-center gap-4">
                     <folder.icon size={16} className={activeFolder === folder.id ? `text-${folder.color}-400` : 'text-slate-400 group-hover:text-blue-600'} />
                     <span className="font-black text-[11px] uppercase tracking-widest">{folder.label}</span>
                   </div>
                   {counts[folder.id] > 0 && (
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeFolder === folder.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                       {counts[folder.id]}
                     </span>
                   )}
                 </button>
               ))}
            </nav>
         </div>
      </div>

      {/* COLUMN 2: THREAD LIST */}
      <div className="w-[380px] bg-white/80 backdrop-blur-xl rounded-[32px] border border-slate-200/60 shadow-xl flex flex-col overflow-hidden shrink-0">
         <div className="p-6 border-b border-slate-100 shrink-0 bg-white/50">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{activeFolder}</h2>
               <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"><Filter size={14}/></div>
               </div>
            </div>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
               <input 
                  type="text" placeholder="Search threads..." 
                  className="w-full h-12 pl-12 pr-4 bg-slate-100 border-none rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                  value={search} onChange={e => setSearch(e.target.value)}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-100/50">
            {isLoading ? (
               <div className="p-20 text-center animate-pulse">
                  <ActivityIndicator />
               </div>
            ) : threads.length === 0 ? (
               <div className="p-20 text-center italic text-slate-400 font-bold uppercase tracking-widest text-[10px]">Empty</div>
            ) : threads.map((thread) => (
               <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-6 cursor-pointer transition-all duration-300 relative group ${
                     selectedThreadId === thread.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
               >
                  {selectedThreadId === thread.id && (
                     <motion.div layoutId="thread-highlight" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}
                  {!thread.isRead && activeFolder !== 'SENT' && (
                     <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_#3b82f6]" />
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm transition-all ${selectedThreadId === thread.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                           {(thread.lead?.customerName || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                           <p className={`text-xs uppercase tracking-tight truncate w-40 ${!thread.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                              {thread.lead?.customerName || 'Unknown'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                              {new Date(thread.lastMessageAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                  </div>

                  <h3 className={`text-[13px] mb-2 line-clamp-1 tracking-tight ${!thread.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {thread.subject}
                  </h3>
                  
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium mb-3">
                    {thread.snippet || 'No snippet available...'}
                  </p>

                  <div className="flex items-center gap-2">
                    {thread.urgency !== 'LOW' && (
                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest border ${getUrgencyColor(thread.urgency)}`}>
                         {thread.urgency}
                       </span>
                    )}
                    <span className="text-[12px] opacity-80" title="Sentiment Analysis">{getSentimentIcon(thread.sentiment)}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* COLUMN 3: WORKSPACE & LEAD PROFILE */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[32px] border border-slate-200/60 shadow-xl overflow-hidden flex relative">
         <AnimatePresence mode="wait">
            {selectedThreadId ? (
               <motion.div 
                 key={selectedThreadId}
                 initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                 className="flex w-full h-full"
               >
                  {/* THREAD CONTENT */}
                  <div className="flex-1 flex flex-col border-r border-slate-100">
                     {isThreadLoading ? (
                        <div className="flex-1 flex items-center justify-center"><ActivityIndicator /></div>
                     ) : (
                        <>
                           {/* HEADER */}
                           <div className="p-8 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
                              <div>
                                 <h1 className="text-2xl font-black text-slate-900 mb-2">{selectedThreadDetail?.subject}</h1>
                                 <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest border ${getUrgencyColor(selectedThreadDetail?.urgency)}`}>
                                      {selectedThreadDetail?.urgency} PRIORITY
                                    </span>
                                    {selectedThreadDetail?.labels?.map(l => (
                                       <span key={l.id} className="px-2 py-1 rounded-md text-[9px] font-black tracking-widest border border-slate-200 bg-slate-50 text-slate-600">
                                         {l.name}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <ActionBtn icon={Reply} onClick={() => { setComposerReplyThread(selectedThreadDetail); setIsComposerOpen(true); }} />
                                 <ActionBtn icon={Archive} />
                                 <ActionBtn icon={Trash2} color="rose" />
                              </div>
                           </div>

                           {/* AI SUMMARY BOX */}
                           {selectedThreadDetail?.summary && (
                              <div className="mx-8 mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-blue-600" />
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">AI Executive Summary</span>
                                 </div>
                                 <p className="text-xs font-bold text-blue-900/80 leading-relaxed">
                                    {selectedThreadDetail.summary}
                                 </p>
                              </div>
                           )}

                           {/* MESSAGES */}
                           <div className="flex-1 overflow-y-auto p-8 space-y-6">
                              {selectedThreadDetail?.messages?.map((msg, i) => (
                                 <div key={msg.id} className={`p-6 rounded-[24px] ${msg.agentId ? 'bg-slate-50 border border-slate-100 ml-12' : 'bg-white border border-slate-200 shadow-sm mr-12'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                             {(msg.from || '?').charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                             <p className="text-xs font-bold text-slate-900">{msg.from}</p>
                                             <p className="text-[10px] text-slate-500">to {msg.to}</p>
                                          </div>
                                       </div>
                                       <span className="text-[10px] font-bold text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    
                                    {/* DELIVERY STATUS */}
                                    {msg.events && msg.events.length > 0 && (
                                       <div className="mb-3 flex items-center gap-2">
                                          {msg.events.map((evt, idx) => (
                                             <span key={idx} className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border ${
                                                evt.eventType === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                evt.eventType === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                evt.eventType === 'OPENED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                             }`}>
                                                {evt.eventType}
                                             </span>
                                          ))}
                                       </div>
                                    )}

                                    <div 
                                       className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-a:text-blue-600"
                                       dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />
                                    {msg.attachments?.length > 0 && (
                                       <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3 flex-wrap">
                                          {msg.attachments.map(att => (
                                             <a href={api.defaults.baseURL.replace('/api', '') + att.filePath} target="_blank" rel="noreferrer" key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-600 hover:text-blue-700 text-[10px] font-bold">
                                                <Paperclip size={12} /> {att.filename}
                                             </a>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>

                           {/* REPLY SUGGESTIONS / ACTION BAR */}
                           <div className="p-6 border-t border-slate-100 bg-white">
                              {selectedThreadDetail?.replySuggestions?.length > 0 && (
                                 <div className="mb-4 flex flex-wrap gap-2">
                                    {selectedThreadDetail.replySuggestions.map((sug, i) => (
                                       <button 
                                          key={i}
                                          onClick={() => { setComposerReplyThread(selectedThreadDetail); setIsComposerOpen(true); }}
                                          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2"
                                       >
                                          <Sparkles size={12}/> {sug}
                                       </button>
                                    ))}
                                 </div>
                              )}
                              <button 
                                 onClick={() => { setComposerReplyThread(selectedThreadDetail); setIsComposerOpen(true); }}
                                 className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-3"
                              >
                                 <Reply size={16} /> Reply to Thread
                              </button>
                           </div>
                        </>
                     )}
                  </div>

                  {/* LEAD PROFILE SIDEBAR */}
                  <div className="w-[300px] bg-slate-50 border-l border-slate-100 flex flex-col shrink-0">
                     {selectedThreadDetail?.lead ? (
                        <>
                           <div className="p-6 text-center border-b border-slate-200/60">
                              <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl mb-4 border-4 border-white shadow-sm">
                                 {selectedThreadDetail.lead.customerName.charAt(0).toUpperCase()}
                              </div>
                              <h3 className="text-lg font-black text-slate-900">{selectedThreadDetail.lead.customerName}</h3>
                              <p className="text-xs font-bold text-slate-500 mb-4">{selectedThreadDetail.lead.email}</p>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black tracking-widest text-slate-600">
                                 Score: <span className="text-blue-600">{selectedThreadDetail.lead.score}</span>
                              </div>
                           </div>
                           <div className="p-6 flex-1 overflow-y-auto">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h4>
                              <div className="space-y-4">
                                 {selectedThreadDetail.lead.activities?.map(act => (
                                    <div key={act.id} className="flex gap-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                       <div>
                                          <p className="text-xs font-bold text-slate-700 leading-tight">{act.action}</p>
                                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(act.createdAt).toLocaleString()}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                           No CRM Lead linked to this thread.
                        </div>
                     )}
                  </div>
               </motion.div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative bg-slate-50/50">
                  <div className="w-32 h-32 bg-white rounded-[32px] flex items-center justify-center shadow-xl border border-slate-100 mb-8">
                     <Inbox size={48} className="text-slate-200" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">No Thread Selected</h2>
                  <p className="text-slate-500 font-medium text-sm">Select a thread from the feed to view its intelligence.</p>
               </div>
            )}
         </AnimatePresence>
      </div>

      <EmailComposer 
        isOpen={isComposerOpen} 
        onClose={() => setIsComposerOpen(false)} 
        replyTo={composerReplyThread}
      />
    </div>
  );
};

const ActionBtn = ({ icon: Icon, onClick, color = 'slate' }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${color === 'rose' ? 'text-rose-500 hover:border-rose-200 hover:bg-rose-50' : 'text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'}`}
  >
    <Icon size={16} />
  </button>
);

const ActivityIndicator = () => (
  <div className="flex gap-2 justify-center">
     {[1,2,3].map(i => (
       <motion.div 
         key={i}
         animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
         transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
         className="w-2 h-2 bg-blue-600 rounded-full"
       />
     ))}
  </div>
);

export default EmailInbox;
