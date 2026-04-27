import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Target, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  Briefcase,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';

const ClientLeads = () => {
  const [search, setSearch] = useState('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['clientLeads'],
    queryFn: async () => {
      const res = await api.get('/client/leads');
      return res.data.data;
    }
  });

  const filteredLeads = leads?.filter(lead => 
    lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
    lead.mappedCompany?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Lead Intelligence.</h1>
           <p className="text-sm font-bold text-slate-400 mt-2 uppercase italic tracking-widest">Cross-Subsidiary Acquisition Telemetry</p>
        </div>
        <button className="h-16 px-10 bg-[#0F172A] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">
           <Download size={18} /> Export Lead Grid
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search target identities or corporate nodes..." 
               className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-[32px] focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm italic"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* REPOSITORY TABLE */}
      <div className="bg-white rounded-[56px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Target Identity</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Corporate Node</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Acquisition Cycle</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Status Level</th>
                     <th className="px-10 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Agent Assigned</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-32 text-center text-slate-400 font-black uppercase tracking-widest italic animate-pulse">Accessing Lead Reservoir...</td></tr>
                  ) : filteredLeads?.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-700 group cursor-pointer">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                                <UserIcon size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A] italic uppercase">{lead.customerName}</p>
                                <div className="flex items-center gap-4 mt-2">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Phone size={10} strokeWidth={3}/> {lead.phone}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Mail size={10} strokeWidth={3}/> {lead.email}</p>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-3">
                             <Briefcase className="text-indigo-400" size={16} />
                             <span className="text-sm font-black text-[#0F172A] uppercase italic">{lead.mappedCompany?.name || 'Unmapped Node'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-10 text-sm font-bold text-slate-400 italic">
                          {new Date(lead.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-10 py-10">
                          <div className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest italic w-fit ${
                            lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                             {lead.status}
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                {lead.assignedTo?.name?.charAt(0)}
                             </div>
                             <span className="text-[11px] font-black text-[#0F172A] uppercase italic">{lead.assignedTo?.name}</span>
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

export default ClientLeads;
