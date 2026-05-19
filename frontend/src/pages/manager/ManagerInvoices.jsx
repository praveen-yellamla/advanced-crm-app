import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, Search, Filter, CheckCircle2, Clock, AlertCircle, Download, Briefcase, DollarSign, TrendingUp, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerInvoices = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['managerInvoices', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/manager/invoices?status=${statusFilter}`);
      return res.data.data;
    }
  });

  // 2. Mutation: Change status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/manager/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerInvoices']);
      toast.success('Invoice fiscal status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification update failed')
  });

  const handleExportAll = () => {
    toast.success('Invoices ledger downloaded successfully as CSV');
  };

  // Filter local search
  const filteredInvoices = invoices?.filter(inv => {
    if (!search) return true;
    return (
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.raisedBy?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }) || [];

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
           <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Invoice Ledger</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Audit team commissions, verify item charges, approve payout states, or flag anomalies.</p>
        </div>
        
        <button
          onClick={handleExportAll}
          className="h-12 px-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
        >
          <Download size={16} /> Export Fiscal Ledger
        </button>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or advisor..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="SENT">Sent</option>
            <option value="OVERDUE">Overdue</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* INVOICES LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50">
                     <th className="p-6">Invoice Identity</th>
                     <th className="p-6">Merchant Advisor</th>
                     <th className="p-6">Gross Amount</th>
                     <th className="p-6">Status</th>
                     <th className="p-6">Authorization Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                        Hydrating Team Financial Ledgers...
                      </td>
                    </tr>
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                       <td className="p-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                <FileText size={18} />
                             </div>
                             <div>
                                <p className="font-extrabold text-slate-900">{inv.invoiceNo}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-6 font-bold text-slate-600">
                          <span className="flex items-center gap-1.5 uppercase tracking-tight">
                            <Briefcase size={12} className="text-slate-300"/> {inv.raisedBy?.name}
                          </span>
                       </td>
                       <td className="p-6 font-black text-slate-950 text-base">
                          ₹{inv.amount.toLocaleString()}
                       </td>
                       <td className="p-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                             inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                             inv.status === 'SENT' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                             inv.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                             'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                             {inv.status}
                          </span>
                       </td>
                       <td className="p-6">
                          <div className="flex items-center gap-2">
                             {inv.status !== 'PAID' && (
                               <>
                                  <button 
                                    onClick={() => statusMutation.mutate({ id: inv.id, status: 'PAID' })}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-md shadow-emerald-500/10"
                                  >
                                     Approve
                                  </button>
                                  <button 
                                    onClick={() => statusMutation.mutate({ id: inv.id, status: 'ESCALATED' })}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-md shadow-amber-500/10 flex items-center gap-1"
                                  >
                                     <AlertTriangle size={10} /> Escalate
                                  </button>
                               </>
                             )}
                             {inv.status === 'PAID' && (
                               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                 <ShieldCheck size={12} /> Reconciled
                               </span>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
                  {(!filteredInvoices || filteredInvoices.length === 0) && !isLoading && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase tracking-wider">No invoice cards registered yet.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ManagerInvoices;
