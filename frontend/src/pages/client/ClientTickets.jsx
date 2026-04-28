import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldQuestion, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ClientTickets = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: '', type: 'TECHNICAL', priority: 'NORMAL', description: '' });
  
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['clientTickets'],
    queryFn: async () => {
      const res = await api.get('/client/tickets');
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/client/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientTickets']);
      toast.success('Support Ticket Initialized');
      setIsModalOpen(false);
      setFormData({ subject: '', type: 'TECHNICAL', priority: 'NORMAL', description: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed')
  });

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Support Terminal.</h1>
           <p className="text-sm font-bold text-slate-400 mt-2 uppercase italic tracking-widest">Protocol Resolution & Issue Tracking</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-16 px-10 bg-[#0F172A] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Initialize Ticket
        </button>
      </div>

      {/* TICKETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {isLoading ? (
            <p className="text-slate-400 font-black italic uppercase animate-pulse">Synchronizing Support System...</p>
         ) : tickets?.map((ticket) => (
            <motion.div 
               key={ticket.id}
               className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-700"
            >
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                       ticket.status === 'OPEN' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-300'
                     }`}>
                        <ShieldQuestion size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ticket {ticket.id}</p>
                        <h3 className="text-xl font-black text-[#0F172A] italic uppercase tracking-tighter mt-1">{ticket.subject}</h3>
                     </div>
                  </div>
                  <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase italic border ${
                    ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                     {ticket.status}
                  </div>
               </div>

               <p className="text-sm font-medium text-slate-500 leading-relaxed italic line-clamp-2">
                  {ticket.description}
               </p>

               <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Priority</p>
                        <p className="text-xs font-black text-[#0F172A] uppercase italic mt-1">{ticket.priority}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Category</p>
                        <p className="text-xs font-black text-[#0F172A] uppercase italic mt-1">{ticket.type}</p>
                     </div>
                  </div>
                  <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-all flex items-center justify-center">
                     <ChevronRight size={20} />
                  </button>
               </div>
            </motion.div>
         ))}
      </div>

      {/* TICKET MODAL */}
      <AnimatePresence>
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-xl bg-white rounded-[64px] shadow-2xl overflow-hidden p-16 space-y-12">
                  <div>
                     <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Log Issue.</h2>
                     <p className="text-sm font-bold text-slate-400 mt-4 uppercase italic">Initializing high-authority Support request</p>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest italic ml-1">Issue Subject</label>
                        <input 
                           type="text" placeholder="e.g. Lead Export Protocol Failure"
                           className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-indigo-600 transition-all font-black text-sm italic"
                           value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <SelectField label="Category" options={['TECHNICAL', 'Billing', 'FEATURE', 'SALES']} value={formData.type} onChange={v => setFormData({...formData, type: v})} />
                        <SelectField label="Priority" options={['LOW', 'NORMAL', 'HIGH', 'URGENT']} value={formData.priority} onChange={v => setFormData({...formData, priority: v})} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest italic ml-1">Operational Description</label>
                        <textarea 
                           placeholder="Provide institutional details of the friction point..."
                           className="w-full h-32 p-8 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:border-indigo-600 transition-all font-black text-sm italic"
                           value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                     </div>
                  </div>

                  <button 
                     onClick={() => mutation.mutate(formData)}
                     disabled={mutation.isPending}
                     className="w-full h-20 bg-[#0F172A] text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:brightness-125 transition-all"
                  >
                     {mutation.isPending ? 'Saving...' : 'Push Signal to Support'}
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const SelectField = ({ label, options, value, onChange }) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest italic ml-1">{label}</label>
     <select 
        className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-indigo-600 transition-all font-black text-sm italic appearance-none"
        value={value} onChange={e => onChange(e.target.value)}
     >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
     </select>
  </div>
);

export default ClientTickets;
