import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Target, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Layout, 
  BarChart, 
  FileUp,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerLeads = () => {
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['managerLeads'],
    queryFn: async () => {
      const res = await api.get('/manager/leads');
      return res.data.data;
    }
  });

  const { data: agents } = useQuery({
    queryKey: ['managerAgents'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  const assignMutation = useMutation({
    mutationFn: (data) => api.post('/manager/leads/assign', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerLeads']);
      toast.success('Lead Successfully Assigned');
      setIsAssignModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assignment failed')
  });

  const filteredLeads = leads?.filter(l => 
    l.customerName.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Team Leads</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage, Assign & Monitor Regional Lead Flow</p>
        </div>
        <div className="flex gap-4">
           <button className="h-14 px-8 bg-white border border-[#E2E8F0] rounded-2xl flex items-center gap-4 text-xs font-bold text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all">
              <FileUp size={18} /> Bulk Import
           </button>
           <button className="h-14 px-8 bg-violet-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-violet-500/20 hover:scale-105 transition-all flex items-center gap-4">
              <Plus size={20} /> Create Lead
           </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search customer name or email..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-violet-500/5 focus:border-violet-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* LEADS TABLE */}
      <div className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer Identity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Assigned Agent</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Last Activity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Lead Repository...</td></tr>
                  ) : filteredLeads?.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                                <Users size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tight">{lead.customerName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{lead.email || lead.phone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl w-fit border text-[10px] font-bold uppercase tracking-widest ${
                             lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             lead.status === 'LOST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                             {lead.status}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{lead.assignedTo.name.charAt(0)}</div>
                               <span className="text-sm font-semibold text-[#0F172A]">{lead.assignedTo.name}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setSelectedLead(lead); setIsAssignModalOpen(true); }}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                            >
                               <UserPlus size={12} /> Assign Now
                            </button>
                          )}
                       </td>
                       <td className="px-10 py-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest italic font-medium">
                          {lead.calls?.[0] ? new Date(lead.calls[0].createdAt).toLocaleDateString() : 'No Activity'}
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-violet-600 hover:text-violet-600 transition-all flex items-center justify-center">
                                <ArrowRight size={18} />
                             </button>
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
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

      {/* ASSIGN MODAL */}
      <AnimatePresence>
         {isAssignModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-3xl" onClick={() => setIsAssignModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden p-12">
                 <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-2">Assign Lead</h2>
                 <p className="text-[#64748B] font-medium text-sm mb-10">Direct lead allocation for <span className="text-violet-600 font-bold">{selectedLead?.customerName}</span></p>

                 <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {agents?.map(agent => (
                      <button 
                        key={agent.id}
                        onClick={() => assignMutation.mutate({ leadId: selectedLead.id, agentId: agent.id })}
                        className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 rounded-3xl transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all font-bold">
                               {agent.name.charAt(0)}
                            </div>
                            <div className="text-left">
                               <p className="font-bold text-[#0F172A]">{agent.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{agent._count.assignedLeads} leads held</p>
                            </div>
                         </div>
                         <ChevronRight size={18} className="text-slate-300 group-hover:text-violet-600 transition-colors" />
                      </button>
                    ))}
                 </div>

                 <button 
                   onClick={() => setIsAssignModalOpen(false)}
                   className="w-full mt-10 h-16 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                 >
                   Cancel Assignment
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default ManagerLeads;
