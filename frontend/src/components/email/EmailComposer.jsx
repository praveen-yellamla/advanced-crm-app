import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Paperclip, Sparkles, Image as ImageIcon, Link2, 
  File, ChevronDown, Clock, Bold, Italic, List, AlignLeft, LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const EmailComposer = ({ isOpen, onClose, replyTo }) => {
  const queryClient = useQueryClient();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [tone, setTone] = useState('Professional');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (replyTo) {
      const leadEmail = replyTo.lead?.email || replyTo.from || '';
      setTo(leadEmail);
      setSubject(replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject || ''}`);
    } else {
      setTo('');
      setCc('');
      setBcc('');
      setShowCc(false);
      setSubject('');
      setContent('');
      setAttachments([]);
    }
  }, [replyTo, isOpen]);

  const handleSend = async () => {
    if (!to || !subject || !content) return toast.error('Please fill all required fields');
    setIsSending(true);
    setSendError('');
    
    const formData = new FormData();
    formData.append('to', to);
    formData.append('cc', cc);
    formData.append('bcc', bcc);
    formData.append('subject', subject);
    formData.append('content', content);
    if (replyTo?.id) formData.append('threadId', replyTo.id);
    if (replyTo?.leadId) formData.append('leadId', replyTo.leadId);

    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await api.post('/email/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries(['emailThreads']);
      toast.success('Email delivered successfully');
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send email';
      setSendError(errorMsg);
      toast.error('Delivery failed.');
    } finally {
      setIsSending(false);
    }
  };

  const generateAIContent = async () => {
    if (!content && !replyTo) return toast.error('Add a prompt or reply context first');
    setIsAiGenerating(true);
    const toastId = toast.loading('Gemini AI is drafting...');
    
    try {
      const res = await api.post('/email/ai-assist', {
        promptText: content,
        replyToContent: replyTo?.snippet || '',
        tone,
        actionType: replyTo ? 'reply' : 'draft'
      });
      setContent(res.data.data);
      toast.success('AI draft applied', { id: toastId });
    } catch (error) {
      toast.error('AI generation failed', { id: toastId });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] sm:h-[85vh]"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Send size={16} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">New Message</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* RECIPIENTS SECTION */}
            <div className="flex flex-col shrink-0 bg-white">
              <div className="flex items-center px-6 py-3 border-b border-slate-100 group focus-within:bg-blue-50/30 transition-colors">
                 <span className="text-sm font-medium text-slate-500 w-16">To</span>
                 <input 
                   type="text" 
                   value={to} 
                   onChange={(e) => setTo(e.target.value)}
                   placeholder="Recipients"
                   className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                 />
                 {!showCc && (
                   <button 
                     onClick={() => setShowCc(true)} 
                     className="text-sm font-medium text-slate-400 hover:text-slate-700 ml-2"
                   >
                     Cc/Bcc
                   </button>
                 )}
              </div>
              
              <AnimatePresence>
                {showCc && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center px-6 py-3 border-b border-slate-100 focus-within:bg-blue-50/30 transition-colors">
                       <span className="text-sm font-medium text-slate-500 w-16">Cc</span>
                       <input 
                         type="text" 
                         value={cc} 
                         onChange={(e) => setCc(e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                       />
                    </div>
                    <div className="flex items-center px-6 py-3 border-b border-slate-100 focus-within:bg-blue-50/30 transition-colors">
                       <span className="text-sm font-medium text-slate-500 w-16">Bcc</span>
                       <input 
                         type="text" 
                         value={bcc} 
                         onChange={(e) => setBcc(e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                       />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUBJECT SECTION */}
              <div className="flex items-center px-6 py-3 border-b border-slate-200 focus-within:bg-blue-50/30 transition-colors">
                 <span className="text-sm font-medium text-slate-500 w-16">Subject</span>
                 <input 
                   type="text" 
                   value={subject} 
                   onChange={(e) => setSubject(e.target.value)}
                   placeholder="Email Subject"
                   className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                 />
              </div>
            </div>

            {/* RICH TEXT TOOLBAR */}
            <div className="px-6 py-2 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1 shrink-0">
              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"><Bold size={16} /></button>
              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"><Italic size={16} /></button>
              <div className="w-px h-4 bg-slate-300 mx-2" />
              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"><AlignLeft size={16} /></button>
              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"><List size={16} /></button>
            </div>

            {/* EDITOR AREA */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-white">
               <textarea 
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder={replyTo ? "Draft your reply here..." : "Draft your email here..."}
                 className="flex-1 w-full resize-none bg-transparent outline-none text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 font-sans"
               />
               
            {/* ATTACHMENTS DISPLAY */}
               {attachments.length > 0 && (
                 <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 shrink-0">
                   {attachments.map((file, i) => (
                     <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                       <File size={16} className="text-slate-400" />
                       <span className="text-sm text-slate-600 truncate max-w-[200px]">{file.name}</span>
                       <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 ml-1">
                         <X size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
               )}

               {/* ERROR DISPLAY */}
               {sendError && (
                 <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3 shrink-0">
                   <div className="flex-1">
                     <p className="text-sm font-semibold text-red-700">Delivery Failed</p>
                     <p className="text-xs text-red-600 mt-1">{sendError}</p>
                   </div>
                   <button 
                     onClick={handleSend}
                     disabled={isSending}
                     className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors shrink-0 disabled:opacity-50"
                   >
                     Retry
                   </button>
                 </div>
               )}
            </div>

            {/* FOOTER ACTION BAR */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
               
               {/* Left Controls */}
               <div className="flex items-center gap-2">
                  <button 
                    disabled={isSending}
                    onClick={handleSend}
                    className={`h-10 px-6 bg-blue-600 text-white rounded-md font-medium text-sm flex items-center gap-2 transition-all ${
                      isSending ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-[0.98]'
                    }`}
                  >
                     {isSending ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <Send size={16} />
                     )}
                     <span>Send Email</span>
                  </button>

                  <div className="w-px h-6 bg-slate-200 mx-2" />

                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    title="Attach Files"
                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors"
                  >
                     <Paperclip size={18} />
                  </button>
                  <button title="Insert Image" className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors">
                     <ImageIcon size={18} />
                  </button>
                  <button title="Insert Link" className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors">
                     <Link2 size={18} />
                  </button>
                  <button title="Use Template" className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors">
                     <LayoutTemplate size={18} />
                  </button>
               </div>

               {/* Right Controls */}
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-md p-1">
                     <button 
                       disabled={isAiGenerating}
                       onClick={generateAIContent}
                       className="flex items-center gap-2 px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 rounded text-sm font-medium transition-colors disabled:opacity-50"
                     >
                        {isAiGenerating ? <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Sparkles size={16} />}
                        AI Draft
                     </button>
                     <select 
                       value={tone} 
                       onChange={(e) => setTone(e.target.value)}
                       className="bg-transparent text-sm text-indigo-700 outline-none font-medium pr-1 cursor-pointer"
                     >
                       <option value="Professional">Professional</option>
                       <option value="Casual">Casual</option>
                       <option value="Persuasive">Persuasive</option>
                       <option value="Urgent">Urgent</option>
                     </select>
                  </div>
                  
                  <button 
                    title="Schedule Send"
                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors"
                  >
                    <Clock size={18} />
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
