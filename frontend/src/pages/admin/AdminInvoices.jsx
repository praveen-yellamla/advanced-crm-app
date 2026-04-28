import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal, 
  DollarSign, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Clock, 
  XSquare,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminInvoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['adminInvoices'],
    queryFn: async () => {
      const res = await api.get('/admin/invoices');
      return res.data.data;
    }
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (newInv) => api.post('/admin/invoices', newInv),
    onSuccess: () => {
       queryClient.invalidateQueries(['adminInvoices']);
       toast.success('Fiscal Record Created');
       setIsModalOpen(false);
    }
  });

  const [formData, setFormData] = useState({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    clientId: '1',
    amount: '',
    dueDate: ''
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Fiscal Archive.</h1>
           <p className="text-[#64748B] font-bold text-sm uppercase tracking-widest mt-2">Manage Institutional Billing Logs</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-10 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-4"
        >
           <Plus size={20} /> Raise Invoice
        </button>
      </div>

      {/* SEARCH/TABS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search invoice no, client, or status..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-3xl focus:ring-[12px] focus:ring-emerald-500/5 focus:border-emerald-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm"
            />
         </div>
         <div className="flex gap-4 p-2 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm">
            {['ALL', 'PENDING', 'PAID'].map(tab => (
              <button key={tab} className={`px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'ALL' ? 'bg-[#0F172A] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                {tab}
              </button>
            ))}
         </div>
      </div>

      {/* INVOICE TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Invoice Ref</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Originator</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Fiscal Amount</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Temporal State</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Status</th>
                     <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Controls</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Fiscal Records...</td></tr>
                  ) : invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-black text-[#0F172A] tracking-tighter uppercase italic">{inv.invoiceNo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Client ID: {inv.clientId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-black text-[#64748B] uppercase italic">{inv.raisedBy?.name}</td>
                       <td className="px-10 py-8 text-2xl font-black text-[#0F172A] tracking-tighter italic">${inv.amount.toLocaleString()}</td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <Clock size={16} className="text-slate-300" />
                             <span className="text-sm font-bold text-slate-400 uppercase italic">Due {new Date(inv.dueDate).toLocaleDateString()}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl w-fit border italic ${
                            inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                             {inv.status === 'PAID' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{inv.status}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center justify-center">
                             <Download size={18} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden p-12">
                 <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic mb-10">Raise Invoice.</h2>
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    createInvoiceMutation.mutate(formData);
                 }} className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</label>
                       <input readOnly value={formData.invoiceNo} className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-400"/>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Value ($)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                          <input type="number" required placeholder="0.00" className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-black text-2xl text-[#0F172A]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}/>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maturity Date</label>
                       <input type="date" required className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A]" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}/>
                    </div>
                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[11px]">Abort</button>
                       <button type="submit" className="flex-2 h-16 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-xl shadow-emerald-500/20">Raise Record</button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInvoices;
