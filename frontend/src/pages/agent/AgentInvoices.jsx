import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Clock, 
  CheckCircle2, 
  Search,
  DollarSign,
  User,
  MoreVertical,
  PlusCircle,
  Eye,
  Send,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentInvoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['agentInvoices'],
    queryFn: async () => {
      const res = await api.get('/agent/invoices');
      return res.data.data;
    }
  });

  const { data: leads } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data; // Only WON leads can be invoiced? Actually request says for Converted leads.
    }
  });

  const [newInvoice, setNewInvoice] = useState({
    leadId: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }]
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => api.post('/agent/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentInvoices']);
      toast.success('Fiscal Record Synchronized & Dispatched');
      setIsModalOpen(false);
      setNewInvoice({ leadId: '', dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }] });
    }
  });

  const addItem = () => setNewInvoice({...newInvoice, items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, tax: 0 }]});
  const removeItem = (index) => setNewInvoice({...newInvoice, items: newInvoice.items.filter((_, i) => i !== index)});
  const updateItem = (index, field, value) => {
    const updated = [...newInvoice.items];
    updated[index][field] = value;
    setNewInvoice({...newInvoice, items: updated});
  };

  const calculateTotal = () => newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) + (Number(item.tax) || 0), 0);

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Financial Ledger</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Generate line-item invoices for converted lead conversion Accounts</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="h-14 px-8 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-3 border border-emerald-500"
        >
           <PlusCircle size={20} /> Generate Invoice
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                     <th className="px-10 py-8">Record Identifier</th>
                     <th className="px-10 py-8">Fiscal Amount</th>
                     <th className="px-10 py-8">Authorization State</th>
                     <th className="px-10 py-8">Deadline</th>
                     <th className="px-10 py-8">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">Authenticating Financial Archive...</td></tr>
                  ) : invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 shadow-sm transition-transform">
                                <FileText size={22} />
                             </div>
                             <div>
                                <p className="text-lg font-bold text-[#0F172A] tracking-tight">{inv.invoiceNo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Verification</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 font-bold text-[#0F172A] text-2xl tracking-tighter tabular-nums italic">
                          ${inv.amount.toLocaleString()}
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                            inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                             {inv.status === 'PAID' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                             {inv.status}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-sm font-bold text-slate-500 italic uppercase">
                          {new Date(inv.dueDate).toLocaleDateString()}
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <button className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all">
                                <Download size={18} />
                             </button>
                             <button className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 shadow-sm transition-all text-[10px] font-bold uppercase">
                                <Eye size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Create Invoice MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8 overflow-y-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-4xl bg-white rounded-[56px] shadow-2xl p-16">
                 <div className="flex justify-between items-start mb-16">
                    <div className="space-y-4">
                       <h2 className="text-4xl font-bold text-[#0F172A] tracking-tighter">Generate Invoice</h2>
                       <p className="text-sm font-medium text-slate-400 max-w-sm">Initialization of multi-channel fiscal dispatch for verified conversion data.</p>
                    </div>
                    <div className="bg-emerald-50 px-8 py-6 rounded-[32px] border border-emerald-100 text-right">
                       <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Valuation</p>
                       <p className="text-4xl font-black text-emerald-700 tracking-tighterTabularNums tabular-nums">${calculateTotal().toLocaleString()}</p>
                    </div>
                 </div>

                 <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newInvoice.leadId) return toast.error('Selection of Conversion Target is mandatory');
                    createInvoiceMutation.mutate({ ...newInvoice, amount: calculateTotal() });
                 }} className="space-y-12">
                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Conversion Target (Lead)</label>
                          <select 
                            required
                            className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm"
                            value={newInvoice.leadId} onChange={e => setNewInvoice({...newInvoice, leadId: e.target.value})}
                          >
                             <option value="">Select Verified Lead...</option>
                             {leads?.map(l => <option key={l.id} value={l.id}>{l.customerName} (#{l.id})</option>)}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Due Deadline Sequence</label>
                          <input 
                             required type="date"
                             className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm"
                             value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Service / Product Line Items</h3>
                          <button type="button" onClick={addItem} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline"><Plus size={14}/> Add Field</button>
                       </div>
                       
                       <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                          {newInvoice.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-end group">
                               <div className="flex-[3] space-y-2">
                                  <input 
                                    placeholder="Description of Consulting Service..."
                                    className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all text-sm font-medium"
                                    value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                  />
                               </div>
                               <div className="flex-1 space-y-2">
                                  <input 
                                    type="number" placeholder="Qty"
                                    className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all text-sm font-medium text-center"
                                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                  />
                               </div>
                               <div className="flex-1 space-y-2">
                                  <input 
                                    type="number" placeholder="Price"
                                    className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all text-sm font-medium text-center"
                                    value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                  />
                               </div>
                               <button type="button" onClick={() => removeItem(idx)} className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"><Trash2 size={18}/></button>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="flex gap-6 pt-10 border-t border-slate-50">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-20 bg-slate-50 text-slate-400 rounded-3xl font-bold uppercase text-[11px] tracking-widest hover:bg-slate-100 transition-all">Cancel Dispatch</button>
                       <button 
                         type="submit" 
                         disabled={createInvoiceMutation.isPending}
                         className="flex-[2] h-20 bg-[#0F172A] text-white rounded-3xl font-bold uppercase text-[11px] tracking-widest shadow-2xl hover:brightness-125 transition-all flex items-center justify-center gap-4"
                       >
                          {createInvoiceMutation.isPending ? 'Loading...voice...' : <><Send size={18} /> Finalize & Dispatch Intelligence Invoice</>}
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

export default AgentInvoices;
