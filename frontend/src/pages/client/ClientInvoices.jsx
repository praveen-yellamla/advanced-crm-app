import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Search, 
  DollarSign,
  AlertTriangle,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';

const ClientInvoices = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['clientInvoices'],
    queryFn: async () => {
      // Re-using manager endpoint for scope-safe retrieval if needed, 
      // but ideally this would be a dedicated client endpoint.
      // For now, hitting a simulated endpoint or the general one filtered by clientId.
      const res = await api.get('/manager/invoices'); // Placeholder: adjustment needed in production
      return res.data.data;
    }
  });

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Invoices.</h1>
           <p className="text-sm font-bold text-slate-400 mt-2 uppercase italic tracking-widest">Financial Records & Transaction Archive</p>
        </div>
      </div>

      {/* KPI TOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Outstanding</p>
            <p className="text-3xl font-black text-[#0F172A] italic tracking-tighter">$12,450.00</p>
         </div>
          <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 shadow-sm space-y-4">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Total Settled</p>
            <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">$84,000.00</p>
         </div>
      </div>

      {/* INVOICE REPOSITORY */}
      <div className="bg-white rounded-[56px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Invoice Identity</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Total Amount</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Temporal Cycle</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Flow status</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Action link</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-32 text-center text-slate-400 font-black uppercase tracking-widest italic animate-pulse">Synchronizing Fiscal Record...</td></tr>
                  ) : invoices?.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-700 group">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                                <FileText size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A] italic uppercase">{invoice.invoiceNo}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Ledger</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <span className="text-xl font-black text-[#0F172A] tracking-tighter italic">${invoice.amount.toLocaleString()}</span>
                       </td>
                       <td className="px-10 py-10">
                          <p className="text-sm font-bold text-slate-400 italic">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase mt-1">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                       </td>
                       <td className="px-10 py-10">
                          <div className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest italic w-fit ${
                            invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                             {invoice.status}
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <button className="h-14 px-8 bg-white border border-slate-200 text-[#0F172A] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-600 hover:text-indigo-600 hover:scale-105 transition-all flex items-center gap-4 italic">
                             <Download size={16} /> Get PDF
                          </button>
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

export default ClientInvoices;
