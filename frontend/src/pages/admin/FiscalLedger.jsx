import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, 
  DollarSign, 
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
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const FiscalLedger = () => {
  const { data: invoiceResponse, isLoading } = useQuery({
    queryKey: ['globalInvoices'],
    queryFn: async () => {
      const res = await api.get('/core/invoices');
      return res.data;
    }
  });

  const invoices = invoiceResponse?.data || [];

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Global Fiscal Ledger</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Audit organizational revenue streams, receivables & fiscal compliance nodes</p>
        </div>
        <div className="flex gap-4">
           <button className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl font-bold text-xs shadow-xl hover:scale-105 transition-all flex items-center gap-3">
              <Plus size={20} /> Generate Fiscal Entry
           </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <MetricCard label="Outstanding Valuation" value="$142,900" sub="Across 42 Nodes" icon={<Clock className="text-amber-600" />} />
         <MetricCard label="Revenue MTD" value="$892,100" sub="+18.4% vs Prev" icon={<TrendingUp className="text-emerald-600" />} />
         <MetricCard label="Collection Rate" value="94.2%" sub="System Peak" icon={<CheckCircle2 className="text-blue-600" />} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden p-10">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                     <th className="px-10 py-10">Ledger Identifier</th>
                     <th className="px-10 py-10">Fiscal Valuation</th>
                     <th className="px-10 py-10">Authorization</th>
                     <th className="px-10 py-10">Deadline</th>
                     <th className="px-10 py-10">Verification</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-24 text-center font-bold text-slate-300 uppercase tracking-widest italic animate-pulse">Synchronizing Regional Ledgers...</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <FileText size={24} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tighter">{inv.invoiceNo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Authorized by {inv.raisedBy.name}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10 whitespace-nowrap">
                          <p className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">${inv.amount.toLocaleString()}</p>
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
                          {new Date(inv.dueDate).toLocaleDateString()}
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
