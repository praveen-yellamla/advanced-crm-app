import React, { useState, useMemo } from 'react';
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

  // 1. Fetch Invoices
  const { data: invoiceResponse, isLoading } = useQuery({
    queryKey: ['globalInvoices'],
    queryFn: async () => {
      const res = await api.get('/core/invoices');
      return res.data;
    }
  });

  // 2. Fetch Leads (for modal)
  const { data: leadsResponse } = useQuery({
    queryKey: ['adminLeadsForInvoices'],
    queryFn: async () => {
      const res = await api.get('/core/leads');
      return res.data;
    },
    enabled: isModalOpen
  });

  const leads = leadsResponse?.data || [];
  const invoices = invoiceResponse?.data || [];

  // 3. Calculate Dynamic Metrics
  const metrics = useMemo(() => {
    let outstanding = 0;
    let revenue = 0;
    let outstandingCount = 0;

    invoices.forEach(inv => {
      if (inv.status === 'PAID') {
        revenue += inv.amount;
      } else {
        outstanding += inv.amount;
        outstandingCount += 1;
      }
    });

    const totalInvoiced = revenue + outstanding;
    const collectionRate = totalInvoiced > 0 ? (revenue / totalInvoiced) * 100 : 0;

    return {
      outstandingAmount: outstanding,
      outstandingAccounts: outstandingCount,
      totalRevenue: revenue,
      collectionRate: collectionRate.toFixed(1)
    };
  }, [invoices]);

  // 4. Download & View Handlers
  const handleDownloadInvoice = async (invoice) => {
    try {
      toast.loading('Preparing invoice PDF...', { id: 'pdf' });
      const res = await api.get(`/core/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Invoice downloaded successfully!', { id: 'pdf' });
    } catch (e) {
      console.error('Download error:', e);
      toast.error('Failed to download invoice PDF', { id: 'pdf' });
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      toast.loading('Opening invoice...', { id: 'pdf' });
      const res = await api.get(`/core/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      
      toast.dismiss('pdf');
    } catch (e) {
      console.error('View error:', e);
      toast.error('Failed to open invoice PDF', { id: 'pdf' });
    }
  };

  // 5. Create Invoice Mutation
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

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing History</h1>
           <p className="text-slate-500 text-sm mt-1">Audit organization revenue, receivables, and client invoices.</p>
        </div>
        <div className="flex gap-4">
           <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-[#6366f1] text-white rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-all flex items-center gap-2 shadow-sm"
           >
              <Plus size={18} /> Create Manual Invoice
           </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <MetricCard 
            label="Outstanding Amount" 
            value={`₹${metrics.outstandingAmount.toLocaleString('en-IN')}`} 
            sub={`Across ${metrics.outstandingAccounts} Accounts`} 
            icon={<Clock className="text-amber-600" />} 
         />
         <MetricCard 
            label="Total Revenue" 
            value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`} 
            sub="Collected" 
            icon={<TrendingUp className="text-emerald-600" />} 
         />
         <MetricCard 
            label="Collection Rate" 
            value={`${metrics.collectionRate}%`} 
            sub="Of Invoiced Revenue" 
            icon={<CheckCircle2 className="text-[#6366f1]" />} 
         />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-900">All Client Invoices</h3>
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search invoices..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] w-64" />
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                     <th className="px-6 py-4 font-semibold text-slate-500">Invoice Number</th>
                     <th className="px-6 py-4 font-semibold text-slate-500">Amount</th>
                     <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                     <th className="px-6 py-4 font-semibold text-slate-500">Due Date</th>
                     <th className="px-6 py-4 text-right font-semibold text-slate-500">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading invoices...</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <FileText size={18} />
                             </div>
                             <div>
                                <p className="font-semibold text-slate-900">{inv.invoiceNo}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Created by {inv.raisedBy?.name || "System"}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Consolidated Total</p>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                             inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                             {inv.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-slate-600">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => handleDownloadInvoice(inv)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 hover:text-[#6366f1] hover:border-[#6366f1] hover:bg-[#6366f1]/5 transition-colors" title="Download PDF">
                                <Download size={16} />
                             </button>
                             <button onClick={() => handleViewInvoice(inv)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-colors" title="View PDF">
                                <Eye size={16} />
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
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                       <h2 className="text-lg font-bold text-slate-900">Create Manual Invoice</h2>
                       <p className="text-xs text-slate-500 mt-0.5">Bill a client for custom services or products.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6">
                    <form id="invoice-form" onSubmit={(e) => {
                       e.preventDefault();
                       createInvoiceMutation.mutate(formData);
                    }} className="space-y-5">
                       
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Select Client (Lead)</label>
                          <select 
                             required 
                             className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all bg-white"
                             value={formData.leadId} 
                             onChange={e => setFormData({...formData, leadId: e.target.value})}
                          >
                             <option value="">-- Choose Client --</option>
                             {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>
                                   {lead.customerName} ({lead.email})
                                </option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Line Item Description</label>
                          <input 
                             type="text" 
                             required 
                             placeholder="e.g. Premium Consulting Service" 
                             className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                             value={formData.description} 
                             onChange={e => setFormData({...formData, description: e.target.value})}
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-xs font-semibold text-slate-700">Quantity</label>
                             <input 
                                type="number" 
                                required 
                                min="1"
                                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                                value={formData.quantity} 
                                onChange={e => setFormData({...formData, quantity: e.target.value})}
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-xs font-semibold text-slate-700">Unit Price (₹)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                                <input 
                                   type="number" 
                                   required 
                                   placeholder="0"
                                   className="w-full h-10 pl-8 pr-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                                   value={formData.unitPrice} 
                                   onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-xs font-semibold text-slate-700">Tax Rate (%)</label>
                             <input 
                                type="number" 
                                required 
                                placeholder="18"
                                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                                value={formData.taxRate} 
                                onChange={e => setFormData({...formData, taxRate: e.target.value})}
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-xs font-semibold text-slate-700">Discount (₹)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                                <input 
                                   type="number" 
                                   placeholder="0"
                                   className="w-full h-10 pl-8 pr-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                                   value={formData.discount} 
                                   onChange={e => setFormData({...formData, discount: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>
                    </form>
                 </div>

                 <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                       type="button" 
                       onClick={() => setIsModalOpen(false)} 
                       className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit" 
                       form="invoice-form"
                       disabled={createInvoiceMutation.isLoading}
                       className="px-6 py-2 text-sm font-semibold text-white bg-[#6366f1] rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                       {createInvoiceMutation.isLoading ? 'Creating...' : 'Create Invoice'}
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
     <div>
        <p className="text-sm font-semibold text-slate-500 mb-2">{label}</p>
        <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
        <div className="flex items-center gap-1.5 mt-2">
           <ArrowUpRight size={14} className="text-emerald-500" />
           <p className="text-xs font-medium text-slate-500">{sub}</p>
        </div>
     </div>
     <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
        {React.cloneElement(icon, { size: 20 })}
     </div>
  </div>
);

export default FiscalLedger;
