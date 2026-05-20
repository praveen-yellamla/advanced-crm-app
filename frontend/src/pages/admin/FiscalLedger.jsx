import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Download, 
  Eye, 
  ArrowUpRight,
  TrendingUp,
  Target,
  Users,
  Search,
  Filter,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FiscalLedger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoiceResponse, isLoading } = useQuery({
    queryKey: ['globalInvoices'],
    queryFn: async () => {
      const res = await api.get('/core/invoices');
      return res.data;
    }
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['adminLeadsForInvoices'],
    queryFn: async () => {
      const res = await api.get('/core/leads');
      return res.data;
    },
    enabled: isModalOpen
  });

  const leads = leadsResponse?.data || [];

  const [formData, setFormData] = useState({
    leadId: '',
    description: '',
    quantity: '1',
    unitPrice: '',
    taxRate: '18',
    discount: '0'
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (newInv) => {
      const payload = {
        leadId: newInv.leadId ? parseInt(newInv.leadId) : undefined,
        items: [
          {
            description: newInv.description,
            quantity: parseInt(newInv.quantity) || 1,
            unitPrice: parseFloat(newInv.unitPrice) || 0
          }
        ],
        taxRate: parseFloat(newInv.taxRate) || 0,
        discount: parseFloat(newInv.discount) || 0
      };
      const res = await api.post('/core/invoices', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalInvoices']);
      toast.success('Invoice created successfully');
      setIsModalOpen(false);
      setFormData({
        leadId: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        taxRate: '18',
        discount: '0'
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  });

  const invoices = invoiceResponse?.data || [];

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Billing History</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Audit organization revenue, receivables, and invoices</p>
        </div>
        <div className="flex gap-4">
           <button 
              onClick={() => setIsModalOpen(true)}
              className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl font-bold text-xs shadow-xl hover:scale-105 transition-all flex items-center gap-3"
           >
              <Plus size={20} /> Create Manual Invoice
           </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <MetricCard label="Outstanding Amount" value="₹1,42,900" sub="Across 42 Accounts" icon={<Clock className="text-amber-600" />} />
         <MetricCard label="Monthly Revenue" value="₹8,92,100" sub="+18.4% vs Prev" icon={<TrendingUp className="text-emerald-600" />} />
         <MetricCard label="Collection Rate" value="94.2%" sub="System Peak" icon={<CheckCircle2 className="text-blue-600" />} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden p-10">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                     <th className="px-10 py-10">Invoice Number</th>
                     <th className="px-10 py-10">Amount</th>
                     <th className="px-10 py-10">Status</th>
                     <th className="px-10 py-10">Due Date</th>
                     <th className="px-10 py-10">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-24 text-center font-bold text-slate-300 uppercase tracking-widest italic animate-pulse">Loading invoices...</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <FileText size={24} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tighter">{inv.invoiceNo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Created by {inv.raisedBy?.name || "System"}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10 whitespace-nowrap">
                          <p className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">₹{inv.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic underline decoration-transparent group-hover:decoration-emerald-500 transition-all">Consolidated Total</p>
                       </td>
                       <td className="px-10 py-10">
                          <div className={`px-5 py-2.5 rounded-2xl w-fit border text-[10px] font-bold uppercase tracking-widest font-mono ${
                             inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                             {inv.status}
                          </div>
                       </td>
                       <td className="px-10 py-10 text-sm font-bold text-slate-500 tabular-nums lowercase italic">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex gap-4">
                             <button className="h-14 w-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 hover:scale-105 transition-all flex items-center justify-center">
                                <Download size={22} />
                             </button>
                             <button className="h-14 w-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 hover:scale-105 transition-all flex items-center justify-center">
                                <Eye size={22} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* CREATE MANUAL INVOICE MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden p-12 z-10 max-h-[90vh] overflow-y-auto">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Create Manual Invoice</h2>
                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                       <X size={18} />
                    </button>
                 </div>
                 
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    createInvoiceMutation.mutate(formData);
                 }} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Lead / Client</label>
                       <select 
                          required 
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                          value={formData.leadId} 
                          onChange={e => setFormData({...formData, leadId: e.target.value})}
                       >
                          <option value="">-- Choose Lead --</option>
                          {leads.map(lead => (
                             <option key={lead.id} value={lead.id}>
                                {lead.customerName} ({lead.email})
                             </option>
                          ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</label>
                       <input 
                          type="text" 
                          required 
                          placeholder="e.g. Premium Consulting Service" 
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                          value={formData.description} 
                          onChange={e => setFormData({...formData, description: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                          <input 
                             type="number" 
                             required 
                             min="1"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                             value={formData.quantity} 
                             onChange={e => setFormData({...formData, quantity: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price (₹)</label>
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none">₹</span>
                             <input 
                                type="number" 
                                required 
                                placeholder="0"
                                className="w-full h-16 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                                value={formData.unitPrice} 
                                onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Rate (%)</label>
                          <input 
                             type="number" 
                             required 
                             placeholder="18"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                             value={formData.taxRate} 
                             onChange={e => setFormData({...formData, taxRate: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount (₹)</label>
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none">₹</span>
                             <input 
                                type="number" 
                                placeholder="0"
                                className="w-full h-16 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#0F172A] outline-none focus:border-blue-600 transition-all"
                                value={formData.discount} 
                                onChange={e => setFormData({...formData, discount: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                       <button 
                          type="button" 
                          onClick={() => setIsModalOpen(false)} 
                          className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[11px] hover:bg-slate-200 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" 
                          disabled={createInvoiceMutation.isLoading}
                          className="flex-1 h-16 bg-blue-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                       >
                          {createInvoiceMutation.isLoading ? 'Creating...' : 'Create Invoice'}
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

const MetricCard = ({ label, value, sub, icon }) => (
  <div className="bg-[#0F172A] p-12 rounded-[56px] text-white shadow-2xl relative group overflow-hidden">
     <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
           <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{label}</p>
           <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              {React.cloneElement(icon, { size: 24, className: 'text-white' })}
           </div>
        </div>
        <div>
           <h4 className="text-5xl font-black tracking-tighter tabular-nums">{value}</h4>
           <div className="flex items-center gap-2 mt-4">
              <ArrowUpRight size={14} className="text-emerald-400" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
           </div>
        </div>
     </div>
     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-600/20 transition-all duration-700" />
  </div>
);

export default FiscalLedger;
