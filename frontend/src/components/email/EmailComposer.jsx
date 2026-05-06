import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, Sparkles, Image, Link2, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmailComposer = ({ isOpen, onClose, replyTo }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.from);
      setSubject(`Re: ${replyTo.subject}`);
    }
  }, [replyTo]);

  const handleSend = async () => {
    if (!to || !subject || !content) return toast.error('Please fill all fields');
    setIsSending(true);
    try {
      await api.post('/email/send', { to, subject, content });
      toast.success('Email sent successfully');
      setTo('');
      setSubject('');
      setContent('');
      onClose();
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const generateAIContent = async () => {
    toast.loading('AI is drafting your response...', { id: 'ai-gen' });
    try {
      // Placeholder for AI writing logic (Day 17)
      setTimeout(() => {
        setContent((prev) => prev + "\n\nDrafted by ACRM Intelligence: \nThank you for reaching out. We have analyzed your request and would like to propose a meeting to discuss the next steps.");
        toast.success('AI draft generated', { id: 'ai-gen' });
      }, 1500);
    } catch (error) {
      toast.error('AI generation failed', { id: 'ai-gen' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col h-[80vh]"
          >
            {/* HEADER */}
            <div className="p-8 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Send size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Compose Intelligence</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* FIELDS */}
            <div className="px-10 py-6 space-y-4">
              <div className="flex items-center gap-6 border-b border-slate-100 py-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-12">To</span>
                 <input 
                   type="text" 
                   value={to}
                   onChange={(e) => setTo(e.target.value)}
                   placeholder="recipient@example.com"
                   className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#0F172A] placeholder:text-slate-300"
                 />
              </div>
              <div className="flex items-center gap-6 border-b border-slate-100 py-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-12">Subject</span>
                 <input 
                   type="text" 
                   value={subject}
                   onChange={(e) => setSubject(e.target.value)}
                   placeholder="Enter subject line..."
                   className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#0F172A] placeholder:text-slate-300"
                 />
              </div>
            </div>

            {/* EDITOR AREA */}
            <div className="flex-1 px-10 py-4 overflow-hidden">
               <textarea 
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder="Draft your enterprise communication here..."
                 className="w-full h-full resize-none bg-slate-50/30 rounded-3xl p-8 outline-none text-sm font-medium text-slate-600 leading-relaxed border border-slate-100 focus:border-blue-200 transition-all"
               />
            </div>

            {/* TOOLBAR & FOOTER */}
            <div className="p-8 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <button className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-500">
                     <Paperclip size={20} />
                  </button>
                  <button className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-500">
                     <Image size={20} />
                  </button>
                  <button className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-500">
                     <Link2 size={20} />
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-2" />
                  <button 
                    onClick={generateAIContent}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl font-bold text-xs hover:bg-violet-100 transition-all"
                  >
                     <Sparkles size={16} /> AI Assist
                  </button>
               </div>

               <div className="flex items-center gap-4">
                  <button 
                    onClick={onClose}
                    className="px-8 py-4 text-slate-500 font-bold text-sm hover:text-slate-800 transition-all"
                  >
                     Discard
                  </button>
                  <button 
                    disabled={isSending}
                    onClick={handleSend}
                    className={`px-10 py-4 bg-[#0F172A] text-white rounded-[20px] font-bold text-sm shadow-xl shadow-slate-200 flex items-center gap-3 transition-all ${
                      isSending ? 'opacity-50 cursor-wait' : 'hover:-translate-y-1'
                    }`}
                  >
                     {isSending ? (
                       <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : (
                       <Send size={18} />
                     )}
                     Deploy Email
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmailComposer;
