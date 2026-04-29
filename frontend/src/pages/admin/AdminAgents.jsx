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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminAgents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, MANUAL, INVITED
  const [search, setSearch] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
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

  const deleteInviteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/invites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      toast.success('Invite deleted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const bulkDeleteInviteMutation = useMutation({
    mutationFn: (type) => api.post('/admin/invites/bulk-delete', { type }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      toast.success(res.data.message);
      setIsCleanupOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Bulk delete failed')
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
      toast.success('Agent account created (Manual)');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Creation failed')
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Agent configuration updated');
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
      toast.success('Agent node terminated');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => api.post('/admin/invites', data),
    onSuccess: (res) => {
      setGeneratedInviteLink(res.data.inviteLink);
      toast.success('Invite link generated (Tracking Active)');
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate invite')
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
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.email.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'MANUAL') return matchesSearch && a.agentType === 'MANUAL';
    if (filterType === 'INVITED') return matchesSearch && a.agentType === 'INVITED';
    
    return matchesSearch;
  });

  const cards = stats?.cards || {};

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase">Agent Lifecycle Manager</h1>
           <p className="text-[#64748B] font-medium text-xs mt-1 italic uppercase tracking-widest">Architectural control for manual & invited organizational nodes</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <button 
                onClick={() => setIsCleanupOpen(!isCleanupOpen)}
                className="h-14 px-8 bg-white border border-[#E2E8F0] rounded-3xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all"
              >
                 <Trash2 size={18} className="text-rose-500" /> Manage Invites
              </button>
              
              <AnimatePresence>
                 {isCleanupOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                     className="absolute top-full mt-4 right-0 w-64 bg-white border border-slate-100 rounded-[32px] shadow-2xl p-6 z-50 space-y-2"
                   >
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Cleanup Protocol</p>
                      {[
                        { id: 'today', label: 'Delete Today', icon: Calendar },
                        { id: 'month', label: 'Delete This Month', icon: History },
                        { id: 'year', label: 'Delete This Year', icon: Users },
                        { id: 'all', label: 'Delete All Pending', icon: UserX },
                      ].map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => { if(confirm(`Confirm bulk deletion of invites (${opt.label})?`)) bulkDeleteInviteMutation.mutate(opt.id); }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all group text-left"
                        >
                           <opt.icon size={16} className="text-slate-300 group-hover:text-rose-500" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                        </button>
                      ))}
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>

           <button 
             onClick={() => {
               setGeneratedInviteLink('');
               setIsInviteModalOpen(true);
             }}
             className="h-14 px-8 bg-white border border-[#E2E8F0] rounded-3xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all"
           >
              <Key size={18} /> Invite Node
           </button>
           <button 
             onClick={() => {
               setEditAgentId(null);
               setFormData({ name: '', email: '', password: '', phone: '', teamId: '', role: 'AGENT' });
               setIsModalOpen(true);
             }}
             className="h-14 px-10 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-4"
           >
              <Plus size={20} /> Create Manual
           </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
               <Users size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manual Agents</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{cards.manualAgents || 0}</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
               <Send size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Sent</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{cards.invitedTotal || 0}</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
               <Zap size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invited Joined</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{cards.invitedJoined || 0}</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
               <Key size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invited Pending</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{cards.invitedPending || 0}</p>
            </div>
         </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row gap-8 items-center">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search agents by name, email, or phone..." 
               className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-3xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         <div className="flex gap-2 p-2 bg-slate-100 rounded-3xl">
            {['ALL', 'MANUAL', 'INVITED'].map(t => (
               <button 
                 key={t}
                 onClick={() => setFilterType(t)}
                 className={`px-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   filterType === t ? 'bg-white text-[#0F172A] shadow-xl' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                  {t === 'ALL' ? 'All Lifecycle' : t}
               </button>
            ))}
         </div>
      </div>

      {/* AGENTS LIST */}
      <div className="bg-white rounded-[48px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Agent Identity</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Architecture</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Team</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Metrics</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Controls</th>
                  </tr>
               </thead>
               <tbody>
                  {isAgentsLoading ? (
                    <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold uppercase tracking-widest italic">Synchronizing Global Agent Registry...</td></tr>
                  ) : filteredAgents.length === 0 ? (
                    <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold uppercase tracking-widest italic">No agents detected for the selected filter</td></tr>
                  ) : filteredAgents.map((agent) => (
                    <tr key={agent.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/30 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="relative">
                                <div className="w-16 h-16 rounded-[24px] border-4 border-slate-50 bg-white overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                   <img src={agent.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center text-white ${agent.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                   {agent.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                </div>
                             </div>
                             <div>
                                <p className="text-xl font-black text-[#0F172A] tracking-tight">{agent.name}</p>
                                <div className="flex gap-4 mt-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> {agent.email}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12}/> {agent.phone || 'N/A'}</p>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest w-fit flex items-center gap-2 ${agent.agentType === 'MANUAL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>
                             {agent.agentType === 'MANUAL' ? <Zap size={12} /> : <Send size={12} />}
                             {agent.agentType}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                <Briefcase size={14} />
                             </div>
                             <span className="text-sm font-bold text-slate-700">{agent.team?.teamName || 'Unassigned'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-8">
                             <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads</p>
                                <p className="text-xl font-black text-[#0F172A]">{agent._count?.assignedLeads || 0}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Calls</p>
                                <p className="text-xl font-black text-blue-600">{agent._count?.calls || 0}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          {agent.agentType === 'INVITED' ? (
                            <div className={`flex items-center gap-3 font-bold italic ${agent.inviteStatus === 'PENDING' ? 'text-amber-500' : 'text-emerald-500'}`}>
                               <Key size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">
                                 {agent.inviteStatus === 'PENDING' ? 'Invite Pending' : 'Invite Accepted'}
                               </span>
                            </div>
                          ) : agent.isActive ? (
                            <div className="flex items-center gap-3 text-emerald-500 font-bold italic">
                               <ShieldCheck size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-rose-500 font-bold italic">
                               <ShieldAlert size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Suspended</span>
                            </div>
                          )}
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleEdit(agent)}
                               title="Modify identity parameters"
                               className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                             >
                                <Edit3 size={18} />
                             </button>
                             <button 
                               onClick={() => {
                                 if (agent.agentType === 'INVITED' && agent.inviteStatus === 'PENDING') {
                                   if (confirm('Decommission pending invite?')) {
                                      // Find corresponding invite record to delete
                                      // For now delete agent record directly since it's a shadow
                                      deleteAgentMutation.mutate(agent.id);
                                   }
                                 } else {
                                   if (confirm('Initiate agent node termination sequence?')) deleteAgentMutation.mutate(agent.id);
                                 }
                               }}
                               title="Terminate node"
                               className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                             >
                                <UserX size={18} />
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
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-16">
                 <div className="mb-12">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase">{editAgentId ? 'Update Identity' : 'Create Agent'}</h2>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Node deployment & configuration module</p>
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
                 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Identity Name</label>
                          <input 
                             type="text" required placeholder="Full Name"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Secure Email</label>
                          <input 
                             type="email" required placeholder="name@company.com"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Access Phrase</label>
                          <input 
                             type="password" required={!editAgentId} placeholder={editAgentId ? "••••••••" : "Password"}
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                             value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Team Hub</label>
                          <select 
                             required 
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold appearance-none"
                             value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}
                          >
                             <option value="">Select Center</option>
                             {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                          </select>
                       </div>
                       <div className="col-span-2 space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Phone Protocol</label>
                          <input 
                             type="text" placeholder="+1 (555) 000-0000"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                       </div>
                       <div className="col-span-2 space-y-3">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Avatar Uplink</label>
                          <input 
                             type="file" required={!editAgentId} accept="image/*"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl pt-4 font-bold"
                             onChange={e => setFormData({...formData, image: e.target.files[0]})}
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-18 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px]">Abort</button>
                       <button type="submit" className="flex-2 h-18 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20">
                          {editAgentId ? 'Update Node' : 'Initialize Node'}
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
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" onClick={() => setIsInviteModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl p-16">
                 {generatedInviteLink ? (
                    <div className="text-center space-y-8">
                       <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto border-4 border-white shadow-xl rotate-6">
                          <CheckCircle2 size={40} />
                       </div>
                       <div>
                          <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tight">Node Invite Ready</h2>
                          <p className="text-xs font-bold text-slate-400 mt-2 italic">Tracking system synchronized for candidate ingestion</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200 font-mono text-[10px] text-blue-600 break-all">
                          {generatedInviteLink}
                       </div>
                       <div className="flex gap-4">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generatedInviteLink); toast.success('Link copied'); }}
                            className="flex-1 h-18 rounded-full bg-[#0F172A] text-white font-black uppercase tracking-widest text-[11px]"
                          >
                             Copy Link
                          </button>
                          <button onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }} className="h-18 px-10 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px]">Close</button>
                       </div>
                    </div>
                 ) : (
                    <>
                        <div className="mb-12">
                           <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase">Invite New Node</h2>
                           <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Asynchronous onboarding pipeline via SMTP</p>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           inviteUserMutation.mutate({ 
                             email: formData.email.trim(), 
                             role: formData.role,
                             name: formData.name.trim()
                           });
                        }} className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Candidate Name</label>
                              <input 
                                 type="text" required placeholder="Full Name"
                                 className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                                 value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Candidate Email</label>
                              <input 
                                 type="email" required placeholder="candidate@company.com"
                                 className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold"
                                 value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Designated Role</label>
                              <select 
                                 required className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all outline-none font-bold appearance-none"
                                 value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                              >
                                 <option value="AGENT">Agent (Standard)</option>
                                 <option value="MANAGER">Manager (Elevated)</option>
                              </select>
                           </div>
                           <div className="flex gap-4 pt-8">
                              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-18 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px]">Abort</button>
                              <button 
                                type="submit" 
                                disabled={inviteUserMutation.isPending}
                                className="flex-2 h-18 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 disabled:opacity-50"
                              >
                                 {inviteUserMutation.isPending ? 'DISPATCHING...' : 'Dispatch Invite'}
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
