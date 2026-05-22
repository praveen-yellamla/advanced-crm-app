import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Layers,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    teamName: '',
    managerId: '',
    monthlyLeadsTarget: '',
    monthlySalesTarget: '',
    conversionTarget: '',
    revenueGoal: ''
  });

  const handleEdit = (team) => {
    setEditTeamId(team.id);
    setFormData({
      teamName: team.teamName || '',
      managerId: team.managerId || '',
      monthlyLeadsTarget: team.monthlyLeadsTarget || '',
      monthlySalesTarget: team.monthlySalesTarget || '',
      conversionTarget: team.conversionTarget || '',
      revenueGoal: team.revenueGoal || ''
    });
    setIsModalOpen(true);
  };

  const { data: teams, isLoading } = useQuery({
    queryKey: ['adminTeams'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return res.data.data;
    }
  });

  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setManagersLoading(true);
        const res = await api.get('/admin/managers');
        setManagers(res.data.data);
        setManagersError(false);
      } catch (err) {
        setManagersError(true);
        toast.error('Unable to load managers');
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, []);

  const createTeamMutation = useMutation({
    mutationFn: (newTeam) => api.post('/admin/teams', newTeam),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTeams']);
      toast.success('Team successfully created');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create team')
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/teams/${editTeamId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTeams']);
      toast.success('Team updated successfully');
      setIsModalOpen(false);
      setEditTeamId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update team')
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTeams']);
      toast.success('Team archived');
    }
  });

  const filteredTeams = teams?.filter(t => 
    t.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teams & Departments</h1>
           <p className="crm-body mt-1 mt-1">Manage your organization's team structure and performance targets.</p>
        </div>
        <button 
          onClick={() => {
            setEditTeamId(null);
            setFormData({
              teamName: '', managerId: '', monthlyLeadsTarget: '',
              monthlySalesTarget: '', conversionTarget: '', revenueGoal: ''
            });
            setIsModalOpen(true);
          }}
          className="h-12 px-6 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 group"
        >
           <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Create New Team
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
               type="text" placeholder="Search teams by name..." 
               className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button 
            onClick={() => toast.success('Advanced filters opened')}
            className="h-12 px-5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
         >
            <Filter size={16} /> Advanced Filters
         </button>
      </div>

      {/* TEAMS LIST */}
      <div className="crm-card">
         <div className="overflow-x-auto">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Team Details</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Team Manager</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Team Size</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Targets</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">Loading teams...</td></tr>
                  ) : filteredTeams?.length === 0 ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No teams found matching your search.</td></tr>
                  ) : filteredTeams?.map((team) => (
                    <tr key={team.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Briefcase size={20} />
                             </div>
                             <div>
                                <p className="font-semibold text-slate-900">{team.teamName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">ID: {team.id}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          {team.manager ? (
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200">
                                   {team.manager?.name?.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-600">{team.manager?.name}</span>
                             </div>
                          ) : (
                             <button
                                onClick={() => navigate(`/admin/agents/invite?role=manager&teamId=${team.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                             >
                                <Plus size={13} /> Invite Manager
                             </button>
                          )}
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">{team._count.agents} Members</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="w-48">
                             <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1.5">
                                <span>Revenue Target</span>
                                <span className="text-blue-600 font-bold">₹{(team.revenueGoal ?? 0).toLocaleString('en-IN')}</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full w-[0%]" />
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full w-fit border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             Active
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleEdit(team)}
                               className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                               title="Edit Team"
                             >
                                <Edit3 size={18} />
                             </button>
                             <button 
                               onClick={() => { if(confirm('Are you sure you want to archive this team?')) deleteTeamMutation.mutate(team.id); }}
                               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                               title="Archive Team"
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

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => { setIsModalOpen(false); setEditTeamId(null); }}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                 <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900">{editTeamId ? 'Edit Team Details' : 'Create New Team'}</h2>
                    <p className="crm-body mt-1">Define team objectives and assign a manager.</p>
                 </div>
                 
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    
                    const payload = { ...formData };
                    
                    if (payload.managerId === '') delete payload.managerId;
                    else payload.managerId = Number(payload.managerId);
                    
                    if (payload.monthlyLeadsTarget === '') delete payload.monthlyLeadsTarget;
                    else payload.monthlyLeadsTarget = Number(payload.monthlyLeadsTarget);

                    if (payload.monthlySalesTarget === '') delete payload.monthlySalesTarget;
                    else payload.monthlySalesTarget = Number(payload.monthlySalesTarget);

                    if (payload.conversionTarget === '') delete payload.conversionTarget;
                    else payload.conversionTarget = Number(payload.conversionTarget);

                    if (payload.revenueGoal === '') delete payload.revenueGoal;
                    else payload.revenueGoal = Number(payload.revenueGoal);

                    if (editTeamId) {
                      updateTeamMutation.mutate(payload);
                    } else {
                      createTeamMutation.mutate(payload);
                    }
                 }} className="p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                           <label className="text-xs font-bold text-slate-700 ml-1">Team Name</label>
                           <input 
                              type="text" required placeholder="e.g. Sales North"
                              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                              value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                           <label className="text-xs font-bold text-slate-700 ml-1">Team Manager</label>
                           {managersLoading ? (
                             <div className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-400 text-sm italic">
                               <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                               Fetching managers...
                             </div>
                           ) : managersError ? (
                             <div className="w-full h-11 px-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-600 text-xs font-semibold">
                               Failed to load managers
                             </div>
                           ) : (
                             <select 
                                required 
                                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}
                             >
                                <option value="">Assign a manager...</option>
                                {managers?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                             </select>
                           )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-700 ml-1">Monthly Revenue Goal (₹)</label>
                           <input 
                              type="number" required placeholder="0.00" min="0" step="0.01"
                              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                              value={formData.revenueGoal} onChange={e => setFormData({...formData, revenueGoal: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-700 ml-1">Monthly Lead Capacity</label>
                           <input 
                              type="number" required placeholder="e.g. 1000" min="0"
                              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                              value={formData.monthlyLeadsTarget} onChange={e => setFormData({...formData, monthlyLeadsTarget: e.target.value})}
                           />
                        </div>
                     </div>
                     
                     <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button 
                           type="button" onClick={() => { setIsModalOpen(false); setEditTeamId(null); }}
                           className="flex-1 h-11 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                        >
                           Cancel
                        </button>
                        <button 
                           type="submit" disabled={(editTeamId ? updateTeamMutation.isPending : createTeamMutation.isPending)}
                           className="flex-1 h-11 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {editTeamId ? (updateTeamMutation.isPending ? 'Saving...' : 'Update Team') 
                                       : (createTeamMutation.isPending ? 'Creating...' : 'Create Team')}
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
