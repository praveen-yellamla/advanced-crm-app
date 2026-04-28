import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Search, 
  Filter, 
  Target, 
  Plus, 
  MoreVertical, 
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Phone,
  Mail,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LeadManagement = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeSource, setActiveSource] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: leadResponse, isLoading } = useQuery({
    queryKey: ['globalLeads', page, search, activeSource],
    queryFn: async () => {
      const res = await api.get('/core/leads', { params: { search, page, source: activeSource !== 'ALL' ? activeSource : undefined } });
      return res.data;
    }
  });

  const leads = leadResponse?.data || [];

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Lead Intelligence Engine</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Universal cross-channel lead ingestion & lifecycle management</p>
        </div>
        <div className="flex gap-4">
           <button className="h-14 px-8 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
              <Download size={18} /> Export Results
           </button>
           <button className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3">
              <Plus size={20} /> Create Manual Lead
           </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <MetricBox label="Inbound Today" value="142" sub="+12% vs Yesterday" icon={<Zap className="text-blue-600" />} />
         <MetricBox label="Unassigned" value="28" sub="High Priority" icon={<Target className="text-rose-600" />} />
         <MetricBox label="Active Conversions" value="84%" sub="System Capacity" icon={<TrendingUp className="text-emerald-600" />} />
         <MetricBox label="Source Efficiency" value="92.4" sub="Meta Ads Peak" icon={<Globe className="text-violet-600" />} />
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by customer name, phone, email, or UTM parameters..." 
               className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            {['ALL', 'GOOGLE_ADS', 'META', 'WEBSITE', 'CSV'].map(s => (
               <button 
                 key={s}
                 onClick={() => setActiveSource(s)}
                 className={`px-6 h-18 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                   activeSource === s ? 'bg-[#0F172A] text-white shadow-xl' : 'bg-white text-slate-400 border border-[#E2E8F0] hover:bg-slate-50'
                 }`}
               >
                  {s.replace('_', ' ')}
               </button>
            ))}
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[48px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                     <th className="px-10 py-8">Lead Identity</th>
                     <th className="px-10 py-8">Ingestion Source</th>
                     <th className="px-10 py-8">Marketing Attribution</th>
                     <th className="px-10 py-8">Ownership</th>
                     <th className="px-10 py-8">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest italic">Synchronizing Global Lead Stream...</td></tr>
                  ) : leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Database size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tight">{lead.customerName}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{lead.phone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[10px] font-bold uppercase tracking-widest ${
                             lead.source === 'GOOGLE_ADS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                             lead.source === 'META' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                             {lead.source.replace('_',' ')}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="space-y-1">
                             <p className="text-xs font-bold text-[#0F172A]">{lead.utmCampaign || 'Organic Direct'}</p>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{lead.utmSource || 'Direct'} / {lead.utmMedium || 'N/A'}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                {lead.assignedTo?.name?.charAt(0) || '?'}
                             </div>
                             <span className="text-sm font-bold text-slate-900">{lead.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
                                <Search size={18} />
                             </button>
                             <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-violet-600 hover:text-violet-600 transition-all flex items-center justify-center">
                                <Share2 size={18} />
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

const MetricBox = ({ label, value, sub, icon }) => (
  <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-[180px] group transition-all hover:shadow-xl">
     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 28 })}
     </div>
     <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-4xl font-black text-[#0F172A] tracking-tighter mt-2">{value}</h4>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">{sub}</p>
     </div>
  </div>
);

export default LeadManagement;
