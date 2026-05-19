import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Users, Plus, Search, MoreHorizontal, Mail, Phone, 
  ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, 
  CheckCircle2, XCircle, FileUp, Key, Briefcase, 
  ArrowRight, Filter, Edit3, UserX, Trash2, 
  Calendar, History, UserPlus, Send, Zap, 
  Loader2, UserCheck, Copy, RotateCcw, Ban,
  ExternalLink, Fingerprint, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TableActionMenu, { TableActionItem } from '../../components/common/TableActionMenu';

const AdminAgents = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, MANUAL, INVITED, PENDING
  const [search, setSearch] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgentForTeam, setSelectedAgentForTeam] = useState(null);
  const [assignTeamId, setAssignTeamId] = useState('');

  const queryClient = useQueryClient();

  const assignTeamMutation = useMutation({
    mutationFn: ({ id, team_id }) => api.patch(`/admin/agents/${id}/assign-team`, { team_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      toast.success('Agent team assignment updated');
      setAssignModalOpen(false);
      setSelectedAgentForTeam(null);
      setAssignTeamId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assignment failed')
  });

  // Queries
  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const { data: invites } = useQuery({
    queryKey: ['adminInvites'],
    queryFn: async () => {
      const res = await api.get('/admin/invites');
      return res.data.data;
    }
  });

  const { data: newPendingInvites, refetch: refetchNewPending } = useQuery({
    queryKey: ['adminAgentInvitationsPendingList'],
    queryFn: async () => {
      const res = await api.get('/admin/agents/invitations', { params: { status: 'pending', limit: 100 } });
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

  const { data: stats } = useQuery({
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

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: (data) => api.post('/admin/invites', data),
    onSuccess: (res) => {
      setGeneratedInviteLink(res.data.inviteLink);
      toast.success('Invitation dispatched successfully');
      queryClient.invalidateQueries(['adminInvites']);
      queryClient.invalidateQueries(['adminDashboardStats']);
    },
    onError: (err) => toast.error(err.response?.data?.error || err.response?.data?.message || 'Dispatch failure')
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/agents/invitations/${id}/resend`),
    onSuccess: (res) => {
      toast.success('Invitation link resent');
      if (res.data.inviteUrl) {
        navigator.clipboard.writeText(res.data.inviteUrl);
        toast.success('Link copied to clipboard');
      }
      queryClient.invalidateQueries(['adminAgentInvitationsPendingList']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Resend failed')
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/agents/invitations/${id}`),
    onSuccess: () => {
      toast.success('Invitation cancelled');
      queryClient.invalidateQueries(['adminAgentInvitationsPendingList']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cancellation failed')
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Profile updated');
      setIsModalOpen(false);
    }
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

  // Filter Logic
  const filteredItems = useMemo(() => {
    const s = search.toLowerCase();
    
    // Combine agents and pending invites if needed, or just handle agents
    let list = agents || [];
    
    if (filterType === 'PENDING') {
      return (newPendingInvites || []).filter(i => 
        i.email.toLowerCase().includes(s) || 
        (i.name || '').toLowerCase().includes(s)
      );
    }

    return list.filter(a => {
      const matchesSearch = (a.name || '').toLowerCase().includes(s) || (a.email || '').toLowerCase().includes(s);
      if (!matchesSearch) return false;
      
      if (filterType === 'ALL') return true;
      if (filterType === 'MANUAL') return a.agentType === 'MANUAL';
      if (filterType === 'INVITED') return a.agentType === 'INVITED';
      return true;
    });
  }, [agents, newPendingInvites, filterType, search]);

  const cards = stats?.cards || {};

  return (
    <div className="space-y-8 pb-20 selection:bg-blue-500 selection:text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <Users size={20} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Member HQ</h1>
           </div>
           <p className="text-slate-500 font-bold text-xs uppercase tracking-widest ml-1">Identity Management & Access Control</p>
        </div>

        <div className="flex flex-wrap gap-4">
           <button onClick={() => navigate('/admin/agents/invite')} className='h-14 px-8 bg-blue-600 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 group'><UserPlus size={18} className='text-white group-hover:rotate-12 transition-transform' /> Invite Agents Center</button>
           <button 
             onClick={() => {
               setEditAgentId(null);
               setFormData({ name: '', email: '', password: '', phone: '', teamId: '', role: 'AGENT' });
               setIsModalOpen(true);
             }}
             className="h-14 px-8 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-3"
           >
              <Plus size={18} /> Provision Manually
           </button>
        </div>
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Verified Identities', val: cards.manualAgents + cards.invitedJoined || 0, icon: UserCheck, color: 'blue' },
           { label: 'Outbound Invites', val: cards.invitedTotal || 0, icon: Send, color: 'violet' },
           { label: 'Live Sessions', val: agents?.filter(a => a.isActive).length || 0, icon: Zap, color: 'emerald' },
           { label: 'Awaiting Uplink', val: cards.invitedPending || 0, icon: Clock, color: 'amber' }
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
           >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-${stat.color}-500/5 transition-transform group-hover:scale-150 duration-700`} />
              <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-6 shadow-sm border border-${stat.color}-100`}>
                 <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stat.val}</p>
           </motion.div>
         ))}
      </div>

      {/* CONTROL BAR */}
      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by name, email, or identity hash..." 
               className="w-full h-16 pl-16 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         <div className="flex gap-2 p-2 bg-slate-100 rounded-2xl w-full lg:w-auto">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'MANUAL', label: 'Manual' },
              { id: 'INVITED', label: 'Invited' },
              { id: 'PENDING', label: `Pending Invites (${newPendingInvites?.length || 0})` }
            ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setFilterType(t.id)}
                 className={`px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 lg:flex-none ${
                   filterType === t.id ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-900'
                 }`}
               >
                  {t.label}
               </button>
            ))}
         </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
         <div className="overflow-x-auto text-sans">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Identity</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Provision Method</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Status</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isAgentsLoading ? (
                    <tr><td colSpan="5" className="p-24 text-center">
                       <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Directory...</span>
                    </td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr><td colSpan="5" className="p-24 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">Zero matches in primary database.</td></tr>
                  ) : filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-8 py-7">
                          <div className="flex items-center gap-5">
                             <div className="relative">
                                <div className="w-14 h-14 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-lg group-hover:rotate-3 transition-transform">
                                   <img src={item.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.email)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                             </div>
                             <div>
                                <p className="font-black text-slate-900 text-base">{item.name || 'Anonymous Entity'}</p>
                                <p className="text-xs text-slate-400 font-bold tracking-tight">{item.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-7">
                          <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest w-fit flex items-center gap-2 ${
                            (item.agentType === 'MANUAL' || !item.token) ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100'
                          }`}>
                             {(item.agentType === 'MANUAL' || !item.token) ? <Fingerprint size={14} /> : <ExternalLink size={14} />}
                             {(item.agentType === 'MANUAL' || !item.token) ? 'Native Provision' : 'Invite Payload'}
                          </div>
                       </td>
                       <td className="px-8 py-7">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.team ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                 <Briefcase size={16} />
                              </div>
                              <div>
                                 <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.role || 'AGENT'}</span>
                                 {(item.teamName || item.team) ? (
                                    <div>
                                       <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">{item.teamName || item.team?.teamName}</p>
                                       {item.team.manager?.name && (
                                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">Mgr: {item.team.manager.name}</p>
                                       )}
                                    </div>
                                 ) : (
                                    <p className="text-[10px] text-slate-400 font-bold">Global Pool</p>
                                 )}
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-7">
                           {filterType === 'PENDING' ? (
                              <div className="flex flex-col gap-1 text-amber-500 font-black">
                                 <div className="flex items-center gap-2">
                                    <History size={16} className="animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-[0.1em]">Awaiting Onboarding</span>
                                 </div>
                                 <span className="text-[9px] text-slate-400 font-bold ml-6">
                                    Invited {Math.max(0, Math.round((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60)))}h ago
                                 </span>
                              </div>
                           ) : item.agentType === 'INVITED' && item.inviteStatus === 'PENDING' ? (
                             <div className="flex items-center gap-2 text-amber-500 font-black">
                                <History size={16} />
                                <span className="text-[10px] uppercase tracking-[0.1em]">Payload Pending</span>
                             </div>
                           ) : item.isActive ? (
                             <div className="flex items-center gap-2 text-emerald-500 font-black">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] uppercase tracking-[0.1em]">Verified Active</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-slate-300 font-black">
                                <Ban size={16} />
                                <span className="text-[10px] uppercase tracking-[0.1em]">Access Denied</span>
                             </div>
                           )}
                        </td>
                        <td className="px-8 py-7">
                           <div className="flex items-center justify-end">
                              <TableActionMenu
                                 id={item.id}
                                 activeId={activeMenuId}
                                 setActiveId={setActiveMenuId}
                              >
                                 {filterType === 'PENDING' ? (
                                     <>
                                        <TableActionItem 
                                           icon={<Copy size={16} />} 
                                           label="Copy Link" 
                                           color="blue"
                                           onClick={() => {
                                              navigator.clipboard.writeText(item.inviteUrl);
                                              toast.success('Invitation link copied');
                                           }} 
                                        />
                                        <TableActionItem 
                                           icon={<RotateCcw size={16} />} 
                                           label="Resend Invite" 
                                           color="blue"
                                           onClick={() => resendInviteMutation.mutate(item.id)} 
                                        />
                                        <TableActionItem 
                                           icon={<Ban size={16} />} 
                                           label="Revoke Invite" 
                                           color="rose"
                                           onClick={() => {
                                              if (confirm('Revoke this invitation protocol?')) {
                                                 revokeInviteMutation.mutate(item.id);
                                              }
                                           }} 
                                        />
                                     </>
                                  ) : (
                                    <>
                                       <TableActionItem 
                                          icon={<Edit3 size={16} />} 
                                          label="Edit Profile" 
                                          color="blue"
                                          onClick={() => handleEdit(item)} 
                                       />
                                       <TableActionItem 
                                          icon={<Users size={16} />} 
                                          label="Assign to Team" 
                                          color="blue"
                                          onClick={() => {
                                             setSelectedAgentForTeam(item);
                                             setAssignTeamId(item.teamId || '');
                                             setAssignModalOpen(true);
                                          }} 
                                       />
                                       {item.teamId && (
                                          <TableActionItem 
                                             icon={<UserX size={16} />} 
                                             label="Remove from Team" 
                                             color="rose"
                                             onClick={() => {
                                                if (confirm(`Remove ${item.name} from their team?`)) {
                                                   assignTeamMutation.mutate({ id: item.id, team_id: null });
                                                }
                                             }} 
                                          />
                                       )}
                                       <TableActionItem 
                                          icon={item.isActive ? <Ban size={16} /> : <UserCheck size={16} />} 
                                          label={item.isActive ? "Deactivate" : "Activate"} 
                                          color="amber"
                                          onClick={() => {
                                             updateAgentMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
                                          }} 
                                       />
                                    </>
                                 )}
                             </TableActionMenu>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* INVITE MODAL OVERHAUL */}
      <AnimatePresence>
         {isInviteModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" onClick={() => setIsInviteModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                 {generatedInviteLink ? (
                    <div className="p-20 text-center space-y-8">
                       <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-emerald-500/10 rotate-3">
                          <Zap size={40} />
                       </div>
                       <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Protocol Established</h2>
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-4">Secure invitation payload is ready for transmission.</p>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 font-mono text-[10px] text-blue-600 break-all select-all leading-relaxed">
                          {generatedInviteLink}
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generatedInviteLink); toast.success('Payload copied to clipboard'); }}
                            className="h-18 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                             <Copy size={20} /> Copy Link
                          </button>
                          <button onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }} className="h-18 rounded-3xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Close Uplink</button>
                       </div>
                    </div>
                 ) : (
                    <>
                        <div className="p-12 pb-6 border-b border-slate-100">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                 <UserPlus size={24} />
                              </div>
                              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Dispatch Invitation</h2>
                           </div>
                           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Establish a new identity access point within the CRM infrastructure.</p>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           inviteUserMutation.mutate({ 
                             email: formData.email.trim(), 
                             role: formData.role,
                             name: formData.name.trim()
                           });
                        }} className="p-12 pt-8 space-y-8">
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Identity Name</label>
                                 <input 
                                    type="text" required placeholder="Legal Entity Name"
                                    className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none font-bold text-slate-900"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication Endpoint</label>
                                 <input 
                                    type="email" required placeholder="name@network.com"
                                    className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none font-bold text-slate-900"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                 />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Access Level</label>
                              <div className="grid grid-cols-2 gap-4">
                                 {[
                                   { val: 'AGENT', label: 'Standard Agent', desc: 'Core operational access to leads and tasks.' },
                                   { val: 'TEAM_LEAD', label: 'Team Lead', desc: 'Coordinate agent performance and assignments.' },
                                   { val: 'MANAGER', label: 'Dept Manager', desc: 'Full department oversight and reporting.' },
                                   { val: 'VIEWER', label: 'Viewer (Read-only)', desc: 'Observation access without data modification.' }
                                 ].map(r => (
                                   <div 
                                     key={r.val}
                                     onClick={() => setFormData({...formData, role: r.val})}
                                     className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                                       formData.role === r.val ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                                     }`}
                                   >
                                      <div className="flex items-center justify-between mb-2">
                                         <span className="text-xs font-black uppercase tracking-tight text-slate-900">{r.label}</span>
                                         {formData.role === r.val && <CheckCircle2 size={16} className="text-blue-600" />}
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{r.desc}</p>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <div className="flex gap-4 pt-8">
                              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-18 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">Abort</button>
                              <button 
                                type="submit" 
                                disabled={inviteUserMutation.isPending}
                                className="flex-[2] h-18 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                              >
                                 {inviteUserMutation.isPending ? (
                                   <Loader2 className="animate-spin" size={20} />
                                 ) : (
                                   <>Initialize Dispatch <ArrowRight size={20}/></>
                                 )}
                              </button>
                           </div>
                        </form>
                    </>
                 )}
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* CREATE/EDIT MODAL OVERHAUL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden">
                 <div className="p-12 pb-6 border-b border-slate-100">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editAgentId ? 'Modify Identity' : 'Native Provisioning'}</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Configure permanent system access for this entity.</p>
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
                      // Add manual agent creation logic here if needed
                    }
                 }} className="p-12 pt-8 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Name</label>
                          <input 
                             type="text" required placeholder="e.g. John Doe"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Network Email</label>
                          <input 
                             type="email" required placeholder="name@domain.com"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Team</label>
                          <select 
                             required 
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat"
                             value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}
                          >
                             <option value="">Select Protocol Unit...</option>
                             {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Protocol</label>
                          <input 
                             type="text" placeholder="+1 (555) 000-0000"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 pt-12 border-t border-slate-100">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-18 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">Cancel</button>
                       <button type="submit" className="flex-[2] h-18 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                          {editAgentId ? 'Commit Changes' : 'Execute Provisioning'}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* ASSIGN TO TEAM MODAL */}
      <AnimatePresence>
         {assignModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" onClick={() => setAssignModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-md bg-white rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden p-12">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Assign Team</h2>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Route <span className="text-blue-600">{selectedAgentForTeam?.name}</span> to an operational team.</p>

                 <form onSubmit={(e) => {
                    e.preventDefault();
                    assignTeamMutation.mutate({
                       id: selectedAgentForTeam.id,
                       team_id: assignTeamId ? parseInt(assignTeamId) : null
                    });
                 }} className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Target Team</label>
                       <select 
                          required
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat"
                          value={assignTeamId} onChange={e => setAssignTeamId(e.target.value)}
                       >
                          <option value="">Select Team...</option>
                          {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                       </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 h-16 rounded-3xl bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all">Cancel</button>
                       <button 
                         type="submit" 
                         disabled={assignTeamMutation.isPending}
                         className="flex-[2] h-16 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                          {assignTeamMutation.isPending ? 'Assigning...' : 'Assign Team'}
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

export default AdminAgents;
