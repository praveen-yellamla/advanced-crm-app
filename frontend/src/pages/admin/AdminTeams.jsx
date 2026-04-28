import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Target, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Archive, 
  Edit3, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['adminTeams'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return res.data.data;
    }
  });

  const { data: managers } = useQuery({
    queryKey: ['managersList'],
    queryFn: async () => {
      const res = await api.get('/admin/agents'); // Simplified for this request
      return res.data.data.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (newTeam) => api.post('/admin/teams', newTeam),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTeams']);
      toast.success('Team Created');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Initialization failed')
  });

  const [formData, setFormData] = useState({
    teamName: '',
    managerId: '',
    monthlyLeadsTarget: '',
    monthlySalesTarget: '',
    conversionTarget: '',
    revenueGoal: ''
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTeams']);
      toast.success('Team Decommissioned');
    }
  });

  const filteredTeams = teams?.filter(t => 
    t.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Teams</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage Organization & Departmental Structures</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-4"
        >
           <Plus size={20} /> Create New Team
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search teams..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button className="h-16 px-8 bg-white border border-[#E2E8F0] rounded-3xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all">
            <Filter size={18} /> Detailed Filter
         </button>
      </div>

      {/* TEAMS TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Team Name</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Team Manager</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Agent Count</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Revenue Goal</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Controls</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Registry...</td></tr>
                  ) : filteredTeams?.map((team) => (
                    <tr key={team.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Layers size={22} />
                             </div>
                             <div>
                                <p className="text-xl font-black text-[#0F172A] tracking-tighter uppercase italic">{team.teamName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: CORE-{team.id}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#0F172A] font-black text-xs border border-slate-200">
                                {team.manager?.name?.charAt(0)}
                             </div>
                             <span className="text-sm font-black text-[#64748B] uppercase italic">{team.manager?.name || 'Unassigned'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-lg font-black text-[#0F172A] italic">{team._count.agents} Accounts</td>
                       <td className="px-10 py-8">
                          <div className="space-y-3">
                             <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <span>Revenue Growth</span>
                                <span className="text-blue-600">$0 / ${(team.revenueGoal ?? 0).toLocaleString()}</span>
                             </div>
                             <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                                <div className="h-full bg-blue-600 rounded-full w-[15%]" />
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit border border-emerald-100 font-medium">
                             <CheckCircle2 size={14} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex gap-3">
                             <button className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center">
                                <Edit3 size={18} />
                             </button>
                             <button 
                               onClick={() => { if(confirm('Refresh deletion?')) deleteTeamMutation.mutate(team.id); }}
                               className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center"
                             >
                                <Archive size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
              >
                 <div className="p-12 border-b border-slate-50 bg-[#F8FAFC]">
                    <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight uppercase">Create Team</h2>
                    <p className="text-sm font-medium text-[#64748B] mt-2">Deploy a new organizational structure</p>
                 </div>
                 
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    createTeamMutation.mutate(formData);
                 }} className="p-12 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Name</label>
                          <input 
                             type="text" required placeholder="Cluster Delta..."
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-12 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A]"
                             value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commanding Officer</label>
                          <select 
                             required 
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-12 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A] appearance-none"
                             value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}
                          >
                             <option value="">Select Manager</option>
                             {managers?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Rev Goal ($)</label>
                          <input 
                             type="number" required placeholder="e.g. 50000"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-12 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A]"
                             value={formData.revenueGoal} onChange={e => setFormData({...formData, revenueGoal: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leads Target</label>
                          <input 
                             type="number" required placeholder="e.g. 500"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-12 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-bold text-[#0F172A]"
                             value={formData.monthlyLeadsTarget} onChange={e => setFormData({...formData, monthlyLeadsTarget: e.target.value})}
                          />
                       </div>
                    </div>
                    
                    <div className="flex gap-4 pt-6">
                       <button 
                          type="button" onClick={() => setIsModalOpen(false)}
                          className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit" disabled={createTeamMutation.isPending}
                          className="flex-1 h-16 bg-[#0F172A] text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:brightness-125 transition-all flex items-center justify-center gap-3"
                       >
                          {createTeamMutation.isPending ? 'Loading...' : <>Create <ArrowRight size={18} /></>}
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

export default AdminTeams;
