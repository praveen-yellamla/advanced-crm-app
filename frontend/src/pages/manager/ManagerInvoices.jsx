import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  MoreVertical,
  XCircle,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerInvoices = () => {
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['managerInvoices'],
    queryFn: async () => {
      const res = await api.get('/manager/invoices');
      return res.data.data;
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/manager/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerInvoices']);
      toast.success('Fiscal Record Updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Team Invoices</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Audit, Verify & Authorize Team Financial Records</p>
        </div>
      </div>

      {/* INVOICE TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Invoice Identity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Merchant/Agent</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Amount</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Authorization</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Financial Ledger...</td></tr>
                  ) : invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
                                <FileText size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tight">{inv.invoiceNo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 font-semibold text-[#64748B] text-sm">
                          <span className="flex items-center gap-2 uppercase tracking-tight"><Briefcase size={14} className="text-slate-300"/> {inv.raisedBy.name}</span>
                       </td>
                       <td className="px-10 py-8 font-bold text-[#0F172A] text-2xl tracking-tighter italic">
                          ${inv.amount.toLocaleString()}
                       </td>
                       <td className="px-10 py-8">
                          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl w-fit border ${
                             inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                             inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                             {inv.status === 'PAID' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                             <span className="text-[10px] font-bold uppercase tracking-widest">{inv.status}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             {inv.status === 'PENDING' && (
                               <>
                                  <button 
                                    onClick={() => statusMutation.mutate({ id: inv.id, status: 'PAID' })}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                                  >
                                     Approve
                                  </button>
                                  <button 
                                    onClick={() => statusMutation.mutate({ id: inv.id, status: 'VOID' })}
                                    className="px-6 py-3 bg-white border border-rose-100 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all"
                                  >
                                     Reject
                                  </button>
                               </>
                             )}
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
                                <Download size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ManagerInvoices;
