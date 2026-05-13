import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  XCircle,
  FileUp,
  Key,
  Briefcase,
  ArrowRight,
  Filter,
  Edit3,
  UserX,
  Trash2,
  Calendar,
  History,
  UserPlus,
  Send,
  Zap,
  Loader2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TableActionMenu, { TableActionItem } from '../../components/common/TableActionMenu';

const AdminAgents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, MANUAL, INVITED
  const [search, setSearch] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const queryClient = useQueryClient();

  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const { data: teams } = useQuery({
    queryKey: ['adminTeamsList'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return res.data.data;
    }
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    teamId: '',
    role: 'AGENT'
  });

  const createAgentMutation = useMutation({
    mutationFn: (newAgent) => api.post('/admin/agents', newAgent),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      toast.success('Account created successfully');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Creation failed')
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Account updated');
      setIsModalOpen(false);
      setEditAgentId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      toast.success('Account removed');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => api.post('/admin/invites', data),
    onSuccess: (res) => {
      setGeneratedInviteLink(res.data.inviteLink);
      toast.success('Invitation sent');
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send invite')
  });

  const handleEdit = (agent) => {
    setEditAgentId(agent.id);
    setFormData({
      name: agent.name || '',
      email: agent.email || '',
      password: '',
      phone: agent.phone || '',
      teamId: agent.teamId || '',
      role: agent.role || 'AGENT'
    });
    setIsModalOpen(true);
  };

  const filteredAgents = (agents || []).filter(a => {
    const matchesSearch = (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
                         (a.email || '').toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'MANUAL') return matchesSearch && a.agentType === 'MANUAL';
    if (filterType === 'INVITED') return matchesSearch && a.agentType === 'INVITED';
    
    return matchesSearch;
  });

  const cards = stats?.cards || {};

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Members</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Manage user accounts, roles, and departmental assignments.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => {
               setGeneratedInviteLink('');
               setIsInviteModalOpen(true);
             }}
             className="h-12 px-5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
           >
              <Mail size={18} className="text-slate-400" /> Invite Member
           </button>
           <button 
             onClick={() => {
               setEditAgentId(null);
               setFormData({ name: '', email: '', password: '', phone: '', teamId: '', role: 'AGENT' });
               setIsModalOpen(true);
             }}
             className="h-12 px-6 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
           >
              <Plus size={18} /> Add Manually
           </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
               <Users size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
               <p className="text-2xl font-bold text-slate-900">{cards.manualAgents + cards.invitedJoined || 0}</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
               <Send size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invites Sent</p>
               <p className="text-2xl font-bold text-slate-900">{cards.invitedTotal || 0}</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
               <UserCheck size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Now</p>
               <p className="text-2xl font-bold text-slate-900">{agents?.filter(a => a.isActive).length || 0}</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
               <History size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Join</p>
               <p className="text-2xl font-bold text-slate-900">{cards.invitedPending || 0}</p>
            </div>
         </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
               type="text" placeholder="Search by name or email..." 
               className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
            {['ALL', 'MANUAL', 'INVITED'].map(t => (
               <button 
                 key={t}
                 onClick={() => setFilterType(t)}
                 className={`px-6 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-1 lg:flex-none ${
                   filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                  {t === 'ALL' ? 'Show All' : t}
               </button>
            ))}
         </div>
      </div>

      {/* MEMBERS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Member Identity</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Method</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Team / Department</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Activity</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Account Status</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isAgentsLoading ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium italic">Syncing Member Directory...</td></tr>
                  ) : filteredAgents.length === 0 ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium italic">No matching members found.</td></tr>
                  ) : filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="relative">
                                <div className="w-12 h-12 rounded-xl border-2 border-slate-100 bg-white overflow-hidden shadow-sm">
                                   <img src={agent.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${agent.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-900">{agent.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{agent.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider w-fit flex items-center gap-1.5 ${agent.agentType === 'MANUAL' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100'}`}>
                             {agent.agentType === 'MANUAL' ? <Plus size={12} /> : <Mail size={12} />}
                             {agent.agentType === 'MANUAL' ? 'Manual' : 'Invited'}
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <Briefcase size={16} className="text-slate-400" />
                             <span className="text-sm font-semibold text-slate-700">{agent.team?.teamName || 'General Staff'}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-6">
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Leads</p>
                                <p className="text-base font-bold text-slate-900">{agent._count?.assignedLeads || 0}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Calls</p>
                                <p className="text-base font-bold text-blue-600">{agent._count?.calls || 0}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          {agent.agentType === 'INVITED' && agent.inviteStatus === 'PENDING' ? (
                            <div className="flex items-center gap-2 text-amber-600 font-bold">
                               <History size={16} />
                               <span className="text-[10px] uppercase tracking-wider">Awaiting Join</span>
                            </div>
                          ) : agent.isActive ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold">
                               <ShieldCheck size={16} />
                               <span className="text-[10px] uppercase tracking-wider">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 font-bold">
                               <XCircle size={16} />
                               <span className="text-[10px] uppercase tracking-wider">Inactive</span>
                            </div>
                          )}
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center justify-end">
                             <TableActionMenu
                               id={agent.id}
                               activeId={activeMenuId}
                               setActiveId={setActiveMenuId}
                             >
                                <TableActionItem 
                                   icon={<Edit3 size={16} />} 
                                   label="Edit Profile" 
                                   color="blue"
                                   onClick={() => handleEdit(agent)} 
                                />
                                <TableActionItem 
                                   icon={agent.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />} 
                                   label={agent.isActive ? "Deactivate" : "Activate"} 
                                   color="amber"
                                   onClick={() => {
                                      updateAgentMutation.mutate({ id: agent.id, data: { isActive: !agent.isActive } });
                                      setActiveMenuId(null);
                                   }} 
                                />
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <TableActionItem 
                                   icon={<Trash2 size={16} />} 
                                   label="Remove Account" 
                                   color="rose"
                                   onClick={() => {
                                      if (confirm('Remove this account?')) {
                                         deleteAgentMutation.mutate(agent.id);
                                         setActiveMenuId(null);
                                      }
                                   }} 
                                />
                             </TableActionMenu>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900">{editAgentId ? 'Update Member Profile' : 'Add New Member'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Configure account access and departmental assignment.</p>
                 </div>

                 <form onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData();
                    data.append('name', formData.name);
                    data.append('email', formData.email);
                    data.append('phone', formData.phone);
                    data.append('role', formData.role);
                    data.append('teamId', formData.teamId);
                    if (formData.password) data.append('password', formData.password);
                    if (formData.image) data.append('image', formData.image);

                    if (editAgentId) {
                      updateAgentMutation.mutate({ id: editAgentId, data });
                    } else {
                      createAgentMutation.mutate(data);
                    }
                 }} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-2 col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                          <input 
                             type="text" required placeholder="e.g. John Smith"
                             className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2 col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-700 ml-1">Business Email</label>
                          <input 
                             type="email" required placeholder="name@company.com"
                             className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                       </div>
                       {!editAgentId && (
                         <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-slate-700 ml-1">Set Password</label>
                            <input 
                               type="password" required placeholder="Minimum 8 characters"
                               className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                               value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                         </div>
                       )}
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 ml-1">Team Assignment</label>
                          <select 
                             required 
                             className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                             value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}
                          >
                             <option value="">Select Team...</option>
                             {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 ml-1">Phone Number</label>
                          <input 
                             type="text" placeholder="+1 (555) 000-0000"
                             className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                       </div>
                       <div className="col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-700 ml-1">Profile Photo (Optional)</label>
                          <input 
                             type="file" accept="image/*"
                             className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                             onChange={e => setFormData({...formData, image: e.target.files[0]})}
                          />
                       </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                       <button type="submit" className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                          {editAgentId ? 'Save Changes' : 'Create Account'}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* INVITE MODAL */}
      <AnimatePresence>
         {isInviteModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                 {generatedInviteLink ? (
                    <div className="p-10 text-center space-y-6">
                       <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
                          <CheckCircle2 size={32} />
                       </div>
                       <div>
                          <h2 className="text-xl font-bold text-slate-900">Invitation Ready</h2>
                          <p className="text-sm text-slate-500 mt-1">The member can now join your workspace using the link below.</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-blue-600 break-all select-all">
                          {generatedInviteLink}
                       </div>
                       <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generatedInviteLink); toast.success('Link copied'); }}
                            className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
                          >
                             Copy Link
                          </button>
                          <button onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }} className="h-11 px-6 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Close</button>
                       </div>
                    </div>
                 ) : (
                    <>
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                           <h2 className="text-xl font-bold text-slate-900">Invite Team Member</h2>
                           <p className="text-sm text-slate-500 mt-1">Send a secure invitation link to join the platform.</p>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           inviteUserMutation.mutate({ 
                             email: formData.email.trim(), 
                             role: formData.role,
                             name: formData.name.trim()
                           });
                        }} className="p-8 space-y-5">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                              <input 
                                 type="text" required placeholder="Member's Name"
                                 className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                                 value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                              <input 
                                 type="email" required placeholder="email@company.com"
                                 className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium"
                                 value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 ml-1">System Role</label>
                              <select 
                                 required className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                 value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                              >
                                 <option value="AGENT">Standard User (Agent)</option>
                                 <option value="MANAGER">Elevated User (Manager)</option>
                              </select>
                           </div>
                           <div className="flex gap-3 pt-6 border-t border-slate-100">
                              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                              <button 
                                type="submit" 
                                disabled={inviteUserMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
                              >
                                 {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                              </button>
                           </div>
                        </form>
                     </>
                 )}
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAgents;
