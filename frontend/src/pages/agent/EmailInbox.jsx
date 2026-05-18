import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Inbox, Send, FileText, Trash2, Search, Filter, 
  RefreshCw, Plus, MoreVertical, Star, Clock, 
  User, ExternalLink, Archive, AlertCircle,
  Paperclip, Reply, Forward, X, Sparkles, ArrowRight,
  ShieldCheck, Eye, MousePointer2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmailComposer from '../../components/email/EmailComposer';

const EmailInbox = () => {
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['emails', activeFolder],
    queryFn: async () => {
      const res = await api.get(`/email/inbox?folder=${activeFolder}`);
      return res.data.data;
    }
  });

  const filteredEmails = useMemo(() => {
    return (emails || []).filter(e => 
      e.subject.toLowerCase().includes(search.toLowerCase()) || 
      (e.from || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [emails, search]);

  const handleSync = async () => {
    try {
      await api.post('/email/sync');
      toast.success('Communication Stream Synchronizing...');
      setTimeout(() => refetch(), 3000);
    } catch (error) {
      toast.error('Uplink Failed');
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8">
      {/* SIDEBAR: FOLDER SYSTEM */}
      <div className="w-[300px] flex flex-col gap-6 shrink-0">
         <button 
            onClick={() => setIsComposerOpen(true)}
            className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
         >
            <Plus size={18} className="text-blue-400 group-hover:rotate-90 transition-transform" /> 
            Compose Hub
         </button>

         <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Directory</h3>
               <RefreshCw size={14} className="text-slate-300 cursor-pointer hover:text-blue-600 transition-colors" onClick={handleSync} />
            </div>
            <nav className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
               {[
                 { id: 'INBOX', label: 'Inbound Feed', icon: Inbox, color: 'blue' },
                 { id: 'SENT', label: 'Outbound Trace', icon: Send, color: 'emerald' },
                 { id: 'DRAFTS', label: 'Draft Archives', icon: FileText, color: 'amber' },
                 { id: 'TRASH', label: 'Decommissioned', icon: Trash2, color: 'rose' },
                 { id: 'ARCHIVE', label: 'Cold Storage', icon: Archive, color: 'slate' },
               ].map((folder) => (
                 <button
                   key={folder.id}
                   onClick={() => setActiveFolder(folder.id)}
                   className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${
                     activeFolder === folder.id 
                     ? 'bg-slate-900 text-white shadow-xl' 
                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                   }`}
                 >
                   <div className="flex items-center gap-4">
                     <folder.icon size={18} className={activeFolder === folder.id ? `text-${folder.color}-400` : 'group-hover:text-blue-600'} />
                     <span className="font-black text-[10px] uppercase tracking-widest">{folder.label}</span>
                   </div>
                 </button>
               ))}
            </nav>
            <div className="pt-8 border-t border-slate-50 mt-auto">
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                     <ShieldCheck size={16} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Secure Link</p>
                     <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Encrypted Protocol Active</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* FEED: EMAIL LISTING */}
      <div className="w-[480px] bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col overflow-hidden shrink-0">
         <div className="p-10 border-b border-slate-50 shrink-0">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{activeFolder} Feed</h2>
               <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer"><Filter size={14}/></div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer"><MoreVertical size={14}/></div>
               </div>
            </div>
            <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
               <input 
                  type="text" placeholder="Search communication protocol..." 
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10"
                  value={search} onChange={e => setSearch(e.target.value)}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide divide-y divide-slate-50">
            {isLoading ? (
               <div className="p-20 text-center animate-pulse">
                  <ActivityIndicator />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6">Decoding Archives...</p>
               </div>
            ) : filteredEmails.length === 0 ? (
               <div className="p-20 text-center italic text-slate-400 font-bold uppercase tracking-widest text-[10px]">No intelligence in this stream</div>
            ) : filteredEmails.map((email) => (
               <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-8 cursor-pointer transition-all duration-500 group relative ${
                     selectedEmail?.id === email.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                  }`}
               >
                  {selectedEmail?.id === email.id && (
                     <motion.div layoutId="active-email" className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                  )}
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm transition-all ${selectedEmail?.id === email.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-400 group-hover:border-blue-200'}`}>
                           {(email.from || email.to || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight truncate w-48">{email.from || email.to}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                     </div>
                     <div className="flex gap-1.5">
                        <Eye size={12} className="text-slate-200" />
                        <MousePointer2 size={12} className="text-slate-200" />
                     </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-1 italic tracking-tight uppercase uppercase">{email.subject}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-bold italic">{email.snippet || email.content.replace(/<[^>]*>/g, '').slice(0, 100)}...</p>
               </div>
            ))}
         </div>
      </div>

      {/* WORKSPACE: EMAIL CONTENT */}
      <div className="flex-1 bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden flex flex-col relative">
         <AnimatePresence mode="wait">
            {selectedEmail ? (
               <motion.div 
                 key={selectedEmail.id}
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                 className="flex flex-col h-full"
               >
                  {/* CONTENT HUD */}
                  <div className="p-12 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/20">
                     <div className="space-y-4">
                        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{selectedEmail.subject}</h1>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                                {(selectedEmail.from || '?').slice(0, 1).toUpperCase()}
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight italic">{selectedEmail.from}</span>
                           </div>
                           <div className="w-px h-4 bg-slate-200" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <ActionBtn icon={Star} />
                        <ActionBtn icon={Reply} onClick={() => setIsComposerOpen(true)} />
                        <ActionBtn icon={Forward} />
                        <ActionBtn icon={Trash2} color="rose" />
                     </div>
                  </div>

                  {/* CONTENT INTERFACE */}
                  <div className="flex-1 p-12 overflow-y-auto scrollbar-hide">
                     <div className="max-w-[800px] mx-auto space-y-12">
                        <div className="flex items-center gap-3 px-6 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl w-fit">
                           <Sparkles className="text-blue-600" size={16} />
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Content Verified</p>
                        </div>
                        <div 
                           className="prose prose-slate max-w-none text-slate-600 text-lg font-bold leading-loose italic"
                           dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                        />
                        {selectedEmail.attachments?.length > 0 && (
                           <div className="pt-10 border-t border-slate-100 space-y-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Supporting Intelligence</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 {selectedEmail.attachments.map((at, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all">
                                       <div className="flex items-center gap-3">
                                          <Paperclip size={14} className="text-slate-300 group-hover:text-blue-600" />
                                          <span className="text-[10px] font-black text-slate-900 uppercase truncate w-24">{at.name}</span>
                                       </div>
                                       <Download size={14} className="text-slate-200" />
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* ACTION BAR */}
                  <div className="p-10 border-t border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/20">
                     <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Delivery Confirmed</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Open Tracked</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsComposerOpen(true)}
                        className="h-16 px-12 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                     >
                        Initialize Response Hub <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-2 transition-transform" />
                     </button>
                  </div>
               </motion.div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative">
                  <div className="relative mb-12">
                     <div className="w-48 h-48 bg-slate-50 rounded-[64px] flex items-center justify-center border border-slate-100 shadow-inner relative z-10">
                        <Inbox size={64} className="text-slate-200" />
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600 rounded-3xl shadow-2xl flex items-center justify-center text-white rotate-12 z-20 animate-bounce">
                        <Sparkles size={24} />
                     </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Intelligence Feed Active</h2>
                  <p className="text-slate-400 max-w-sm font-bold text-xs uppercase tracking-[0.2em] leading-relaxed">Select a communication protocol to analyze, track, and synchronize response intelligence.</p>
                  
                  <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[200px]" />
                  </div>
               </div>
            )}
         </AnimatePresence>
      </div>

      <EmailComposer 
        isOpen={isComposerOpen} 
        onClose={() => setIsComposerOpen(false)} 
        replyTo={selectedEmail}
      />
    </div>
  );
};

const ActionBtn = ({ icon: Icon, onClick, color = 'slate' }) => (
  <button 
    onClick={onClick}
    className={`w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95 ${color === 'rose' ? 'text-rose-500 hover:border-rose-200 hover:bg-rose-50' : 'text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
  >
    <Icon size={20} />
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
