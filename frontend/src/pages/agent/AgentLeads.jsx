import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  MoreVertical,
  ChevronRight,
  Filter,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentLeads = () => {
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data;
    }
  });

  const stages = ['NEW', 'CONTACTED', 'INTERESTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  const filteredLeads = leads?.filter(l => 
    (activeStage === 'ALL' || l.status === activeStage) &&
    (l.customerName.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Lead Pipeline</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage and convert your personal lead assignments</p>
        </div>
        <button className="h-14 px-8 bg-violet-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-violet-500/20 hover:scale-105 transition-all flex items-center gap-3">
           <Plus size={20} /> Create Reference Lead
        </button>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by name, identity, or metadata..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* PIPELINE TABS */}
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
         <button 
           onClick={() => setActiveStage('ALL')}
           className={`px-8 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
             activeStage === 'ALL' ? 'bg-[#0F172A] text-white shadow-xl' : 'bg-white text-slate-400 border border-[#E2E8F0] hover:bg-slate-50'
           }`}
         >
            Global List
         </button>
         {stages.map(stage => (
           <button 
             key={stage}
             onClick={() => setActiveStage(stage)}
             className={`px-8 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
               activeStage === stage ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-[#E2E8F0] hover:bg-slate-50'
             }`}
           >
              {stage.replace('_', ' ')}
           </button>
         ))}
      </div>

      {/* LEADS LIST */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer Identity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status Stage</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Contact Details</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Communications</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Conversion Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Personal Pipeline...</td></tr>
                  ) : filteredLeads?.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                <Target size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tight truncate">{lead.customerName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead ID #{lead.id}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[10px] font-bold uppercase tracking-widest ${
                             lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             lead.status === 'LOST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {lead.status}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="space-y-2">
                             <p className="text-sm font-bold text-[#0F172A] flex items-center gap-2 italic">{lead.phone}</p>
                             <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{lead.email}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600">{lead.calls?.length || 0}</span>
                             </div>
                             <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                                <Mail size={12} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600">{lead.emails?.length || 0}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <button className="h-12 w-12 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center hover:scale-110 transition-transform">
                                <Phone size={18} />
                             </button>
                             <button className="h-12 px-6 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-3">
                                <MessageSquare size={16} /> Timeline
                             </button>
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-violet-600 hover:text-violet-600 transition-all flex items-center justify-center">
                                <MoreVertical size={18} />
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

export default AgentLeads;
