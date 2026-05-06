import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  MoreVertical,
  Star,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmailComposer from '../../components/email/EmailComposer';

const EmailInbox = () => {
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['emails', activeFolder],
    queryFn: async () => {
      const res = await api.get(`/email/inbox?folder=${activeFolder}`);
      return res.data.data;
    }
  });

  const handleSync = async () => {
    try {
      await api.post('/email/sync');
      toast.success('Sync started. Please wait a few seconds...');
      setTimeout(() => refetch(), 5000);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-50/50 rounded-[40px] border border-slate-200/60 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* SIDEBAR */}
      <div className="w-80 border-r border-slate-200/60 flex flex-col bg-white/40">
        <div className="p-8">
          <button 
            onClick={() => setIsComposerOpen(true)}
            className="w-full py-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 font-bold text-sm tracking-tight"
          >
            <Plus size={18} /> Compose New
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'INBOX', label: 'Inbox', icon: Inbox, color: 'text-blue-500' },
            { id: 'SENT', label: 'Sent', icon: Send, color: 'text-emerald-500' },
            { id: 'DRAFTS', label: 'Drafts', icon: FileText, color: 'text-amber-500' },
            { id: 'TRASH', label: 'Trash', icon: Trash2, color: 'text-rose-500' },
          ].map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeFolder === folder.id 
                ? 'bg-white shadow-lg shadow-slate-100 text-[#0F172A]' 
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <folder.icon size={18} className={activeFolder === folder.id ? folder.color : ''} />
                <span className="font-bold text-sm tracking-tight">{folder.label}</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-lg">0</span>
            </button>
          ))}
        </nav>
      </div>

      {/* EMAIL LIST */}
      <div className="w-[450px] border-r border-slate-200/60 flex flex-col bg-white/20">
        <div className="p-8 border-b border-slate-200/60 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{activeFolder}</h2>
          <button 
            onClick={handleSync}
            className="p-3 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-20 text-center space-y-4">
               <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Digital Archives...</p>
            </div>
          ) : !emails || emails.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No intelligence found in this stream</p>
            </div>
          ) : emails?.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-8 border-b border-slate-200/40 cursor-pointer transition-all duration-500 group ${
                selectedEmail?.id === email.id ? 'bg-white shadow-inner' : 'hover:bg-white/80'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {(email.from || email.to || '?').slice(0, 1).toUpperCase()}
                   </div>
                   <span className="font-bold text-sm text-[#0F172A] truncate w-40">{email.from}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">{email.subject}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{email.snippet || email.content.replace(/<[^>]*>/g, '').slice(0, 100)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* EMAIL CONTENT */}
      <div className="flex-1 flex flex-col bg-white/60 relative">
        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div 
              key={selectedEmail.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
              {/* CONTENT HEADER */}
              <div className="p-10 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                   <h1 className="text-3xl font-bold text-[#0F172A] mb-3 tracking-tight">{selectedEmail.subject}</h1>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                           {(selectedEmail.from || '?').slice(0, 1).toUpperCase()}
                         </div>
                         <span className="text-sm font-bold text-slate-600">{selectedEmail.from}</span>
                      </div>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                      <Star size={18} className="text-slate-400" />
                   </button>
                   <button className="p-4 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                      <MoreVertical size={18} className="text-slate-400" />
                   </button>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="flex-1 p-12 overflow-y-auto">
                <div 
                  className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                />
              </div>

              {/* ACTION BAR */}
              <div className="p-10 border-t border-slate-200/60 bg-slate-50/50">
                 <button 
                   onClick={() => setIsComposerOpen(true)}
                   className="px-10 py-5 bg-[#0F172A] text-white rounded-[20px] font-bold text-sm shadow-2xl shadow-slate-300 flex items-center gap-3 hover:-translate-y-1 transition-all"
                 >
                    <Send size={18} /> Reply To Intelligence
                 </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
               <div className="w-32 h-32 bg-slate-100 rounded-[40px] flex items-center justify-center mb-10 border border-slate-200/40 shadow-inner">
                  <Inbox size={48} className="text-slate-300" />
               </div>
               <h2 className="text-3xl font-bold text-[#0F172A] mb-4 tracking-tight">Intelligence Feed Active</h2>
               <p className="text-slate-400 max-w-md font-medium leading-relaxed">Select a communication stream to analyze and respond. Your command center is ready for high-impact engagement.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* COMPOSER MODAL */}
      <EmailComposer 
        isOpen={isComposerOpen} 
        onClose={() => setIsComposerOpen(false)} 
        replyTo={selectedEmail}
      />
    </div>
  );
};

export default EmailInbox;
