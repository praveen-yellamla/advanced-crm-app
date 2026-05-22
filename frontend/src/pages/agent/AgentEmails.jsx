import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Mail, 
  Send, 
  Search, 
  Filter, 
  Eye, 
  MousePointer2, 
  Clock, 
  Plus, 
  Target, 
  MoreVertical,
  Paperclip,
  Maximize2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentEmails = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: emails, isLoading } = useQuery({
    queryKey: ['agentEmails'],
    queryFn: async () => {
      const res = await api.get('/agent/emails');
      return res.data.data;
    }
  });

  const { data: leads } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data;
    }
  });

  const [emailData, setEmailData] = useState({
    leadId: '',
    subject: '',
    content: ''
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data) => api.post('/agent/emails/send', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentEmails']);
      toast.success('Digital intelligence dispatched successfully');
      setIsModalOpen(false);
      setEmailData({ leadId: '', subject: '', content: '' });
    }
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Direct Intelligence</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage lead-linked communication Accounts & tracking telemetry</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3"
        >
           <Plus size={20} /> Compose Email
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Rate</p>
               <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">42.8%</h4>
            </div>
            <Eye size={32} className="text-blue-200 group-hover:text-blue-600 transition-colors" />
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Click Accuracy</p>
               <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">12.4%</h4>
            </div>
            <MousePointer2 size={32} className="text-emerald-200 group-hover:text-emerald-600 transition-colors" />
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Velocity</p>
               <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">4h 12m</h4>
            </div>
            <Clock size={32} className="text-violet-200 group-hover:text-violet-600 transition-colors" />
         </div>
      </div>

      {/* EMAIL FEED / TABLE */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                     <th className="px-10 py-8">Communication Subject</th>
                     <th className="px-10 py-8">Recipient</th>
                     <th className="px-10 py-8">Tracking</th>
                     <th className="px-10 py-8">Timestamp</th>
                     <th className="px-10 py-8">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Digital Communication Stream...</td></tr>
                  ) : emails?.map((email) => (
                    <tr key={email.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Mail size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-[#0F172A] tracking-tight">{email.subject}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate max-w-[200px] mt-1 italic">{email.content.substring(0, 40)}...</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <p className="text-xs font-bold text-[#0F172A] tracking-tight">{email.lead.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-tight">{email.lead.email}</p>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex gap-2">
                             <div className={`p-2 rounded-lg ${email.isOpened ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-200'}`} title={email.isOpened ? 'Opened' : 'Not Opened'}>
                                <Eye size={14} />
                             </div>
                             <div className={`p-2 rounded-lg ${email.clickCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-200'}`} title={`${email.clickCount} Clicks`}>
                                <MousePointer2 size={14} />
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                          {new Date(email.sentAt).toLocaleString()}
                       </td>
                       <td className="px-10 py-8">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-bold uppercase tracking-widest">{email.status}</span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* COMPOSE MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl p-12">
                 <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-8">Compose Data</h2>
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!emailData.leadId) return toast.error('Recipient verification required');
                    sendEmailMutation.mutate(emailData);
                 }} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Communication Recipient (Lead)</label>
                       <select 
                         required
                         className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm"
                         value={emailData.leadId} onChange={e => setEmailData({...emailData, leadId: e.target.value})}
                       >
                          <option value="">Select Verified Lead Identity...</option>
                          {leads?.map(l => <option key={l.id} value={l.id}>{l.customerName} ({l.email})</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Digital Subject Header</label>
                       <input 
                         required
                         placeholder="Value proposition header..."
                         className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold"
                         value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Intelligence Content (Markdown Optimized)</label>
                       <textarea 
                         required
                         placeholder="Personalized intelligence dispatch..."
                         className="w-full h-48 p-8 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:bg-white focus:border-blue-600 transition-all font-medium text-sm leading-relaxed"
                         value={emailData.content} onChange={e => setEmailData({...emailData, content: e.target.value})}
                       />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-18 bg-slate-100 text-slate-400 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Discard Draft</button>
                       <button type="submit" disabled={sendEmailMutation.isPending} className="flex-1 h-18 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl hover:brightness-125 transition-all flex items-center justify-center gap-3">
                          {sendEmailMutation.isPending ? 'Loading...' : <><Send size={18}/> Dispatch Email</>}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AgentEmails;
