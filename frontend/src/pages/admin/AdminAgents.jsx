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
  const [filterType, setFilterType] = useState('AGENTS'); // ALL, AGENTS, MANAGERS, PENDING
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
    role: 'agent'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      teamId: '',
      role: 'agent'
    });
  };

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

  const createAgentMutation = useMutation({
    mutationFn: (data) => {
      const endpoint = data.role?.toLowerCase() === 'manager' ? '/admin/managers/create' : '/admin/agents/create';
      return api.post(endpoint, data);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success(variables.role?.toLowerCase() === 'manager' ? 'Manager provisioned successfully' : 'Agent provisioned successfully');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to provision member');
    }
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
      if (filterType === 'AGENTS') return a.role === 'AGENT';
      if (filterType === 'MANAGERS') return a.role === 'MANAGER' || a.role === 'TEAM_LEAD';
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
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                 <Users size={20} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Members</h1>
           </div>
           <p className="text-sm font-medium text-slate-500 ml-1">Manage your agents and managers</p>
        </div>

        <div className="flex flex-wrap gap-4">
           <button onClick={() => navigate('/admin/agents/invite')} className='h-10 px-4 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm'><UserPlus size={16} /> Invite by Email</button>
           <button 
             onClick={() => {
               setEditAgentId(null);
               resetForm();
               setIsModalOpen(true);
             }}
             className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
           >
              <Plus size={16} /> Add Manually
           </button>
        </div>
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Active Members', val: agents?.filter(a => a.isActive).length || 0, icon: UserCheck, color: 'blue' },
           { label: 'Invitations Sent', val: newPendingInvites?.length || 0, icon: Send, color: 'violet' },
           { label: 'Members Online Now', val: agents?.filter(a => a.isActive).length || 0, icon: Zap, color: 'emerald' },
           { label: 'Pending Invites', val: newPendingInvites?.length || 0, icon: Clock, color: 'amber' }
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all cursor-default"
           >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-${stat.color}-500/5 transition-transform group-hover:scale-150 duration-700`} />
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4 shadow-sm border border-${stat.color}-100`}>
                 <stat.icon size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.val}</p>
           </motion.div>
         ))}
      </div>

      {/* CONTROL BAR */}
      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
               type="text" placeholder="Search by name, email, or identity hash..." 
               className="w-full h-10 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full lg:w-auto">
            {[
              { id: 'ALL', label: 'All Members' },
              { id: 'AGENTS', label: 'Agents' },
              { id: 'MANAGERS', label: 'Managers' },
              { id: 'PENDING', label: `Pending Invites (${newPendingInvites?.length || 0})` }
            ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setFilterType(t.id)}
                 className={`px-4 h-8 rounded-md text-sm font-semibold transition-all flex-1 lg:flex-none ${
                   filterType === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                  {t.label}
               </button>
            ))}
         </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">How They Joined</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Status</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                     <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <div className="relative">
                                 <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                    <img src={item.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.email)}&background=random&color=fff`} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              </div>
                              <div>
                                 <p className="font-semibold text-slate-900 text-sm">{item.name || 'Anonymous Entity'}</p>
                                 <p className="text-xs text-slate-500">{item.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className={`px-2.5 py-1 rounded-md text-xs font-semibold w-fit flex items-center gap-1.5 ${
                             (item.agentType === 'MANUAL' || !item.token) ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                           }`}>
                              {(item.agentType === 'MANUAL' || !item.token) ? <Fingerprint size={14} /> : <ExternalLink size={14} />}
                              {(item.agentType === 'MANUAL' || !item.token) ? 'Added Directly' : 'Email Invite'}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-md flex items-center justify-center ${item.team ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                  <Briefcase size={16} />
                               </div>
                               <div>
                                  <span className="text-sm font-semibold text-slate-900">{item.role || 'AGENT'}</span>
                                  {(item.teamName || item.team) ? (
                                     <div>
                                        <p className="text-xs text-slate-600 font-medium">{item.teamName || item.team?.teamName || item.team?.name || "Not Assigned to Team"}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Mgr: {item.team?.manager?.name || "No Manager"}</p>
                                     </div>
                                  ) : (
                                     <p className="text-xs text-slate-500 italic">Not Assigned to Team</p>
                                  )}
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            {filterType === 'PENDING' ? (
                               <div className="flex flex-col gap-1 text-amber-600">
                                  <div className="flex items-center gap-2">
                                     <History size={16} className="animate-pulse" />
                                     <span className="text-xs font-medium">Awaiting Onboarding</span>
                                  </div>
                                  <span className="text-[11px] text-amber-600/70 ml-6">
                                     Invited {Math.max(0, Math.round((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60)))}h ago
                                  </span>
                               </div>
                            ) : item.agentType === 'INVITED' && item.inviteStatus === 'PENDING' ? (
                              <div className="flex items-center gap-2 text-amber-600">
                                 <History size={16} />
                                 <span className="text-xs font-medium">Setup Pending</span>
                              </div>
                            ) : item.isActive ? (
                              <div className="flex items-center gap-2 text-emerald-600">
                                 <ShieldCheck size={16} />
                                 <span className="text-xs font-medium">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                 <Ban size={16} />
                                 <span className="text-xs font-medium">Access Denied</span>
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
                                 {(item.inviteStatus === 'PENDING' || (item.agentType === 'INVITED' && item.inviteStatus !== 'ACCEPTED')) ? (
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
                 {generatedInviteLink ? (
                    <div className="p-12 text-center space-y-6">
                       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                          <Zap size={32} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Protocol Established</h2>
                          <p className="text-slate-500 font-medium text-sm mt-2">Secure invitation payload is ready for transmission.</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-sm text-blue-600 break-all select-all">
                          {generatedInviteLink}
                       </div>
                       <div className="grid grid-cols-2 gap-4 mt-6">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generatedInviteLink); toast.success('Payload copied to clipboard'); }}
                            className="h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                          >
                             <Copy size={18} /> Copy Link
                          </button>
                          <button onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }} className="h-12 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all">Close Uplink</button>
                       </div>
                    </div>
                 ) : (
                    <>
                        <div className="p-8 pb-4 border-b border-slate-100">
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                 <UserPlus size={20} />
                              </div>
                              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dispatch Invitation</h2>
                           </div>
                           <p className="text-slate-500 font-medium text-sm">Establish a new identity access point within the CRM infrastructure.</p>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           inviteUserMutation.mutate({ 
                             email: formData.email.trim(), 
                             role: formData.role,
                             name: formData.name.trim()
                           });
                        }} className="p-8 space-y-6">
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-700">Target Identity Name</label>
                                 <input 
                                    type="text" required placeholder="Legal Full Name"
                                    className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-sm text-slate-900"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-700">Communication Endpoint</label>
                                 <input 
                                    type="email" required placeholder="name@network.com"
                                    className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-sm text-slate-900"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                 />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-sm font-medium text-slate-700">System Access Level</label>
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
                                     className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                       formData.role === r.val ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                                     }`}
                                   >
                                      <div className="flex items-center justify-between mb-1">
                                         <span className="text-sm font-semibold text-slate-900">{r.label}</span>
                                         {formData.role === r.val && <CheckCircle2 size={16} className="text-blue-600" />}
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-10 rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all">Abort</button>
                              <button 
                                type="submit" 
                                disabled={inviteUserMutation.isPending}
                                className="flex-[2] h-10 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                 {inviteUserMutation.isPending ? (
                                   <Loader2 className="animate-spin" size={18} />
                                 ) : (
                                   <>Initialize Dispatch <ArrowRight size={16}/></>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" onClick={() => { setIsModalOpen(false); resetForm(); }}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
                 <div className="p-8 pb-4 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{editAgentId ? 'Modify Identity' : (formData.role === 'manager' ? 'Add Manager Manually' : 'Add Agent Manually')}</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Configure permanent system access for this entity.</p>
                 </div>

                 <form onSubmit={(e) => {
                     e.preventDefault();
                     if (editAgentId) {
                       const data = new FormData();
                       data.append('name', formData.name);
                       data.append('email', formData.email);
                       data.append('phone', formData.phone);
                       data.append('role', formData.role);
                       data.append('teamId', formData.teamId);
                       if (formData.password) data.append('password', formData.password);
                       updateAgentMutation.mutate({ id: editAgentId, data });
                     } else {
                       createAgentMutation.mutate({
                         name: formData.name,
                         email: formData.email,
                         password: formData.password,
                         phone: formData.phone,
                         teamId: formData.teamId ? parseInt(formData.teamId) : null,
                         role: formData.role?.toLowerCase()
                       });
                     }
                  }} className="p-8 space-y-6">
                     {!editAgentId && (
                        <div className="space-y-2 pb-4 border-b border-slate-100">
                           <label className="text-sm font-medium text-slate-700">Adding a:</label>
                           <div className="grid grid-cols-2 gap-4">
                              <button
                                 type="button"
                                 onClick={() => setFormData({ ...formData, role: 'agent' })}
                                 className={`h-10 px-4 rounded-lg border font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                                    formData.role === 'agent'
                                       ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                       : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                 }`}
                              >
                                 <span>👤 Agent</span>
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setFormData({ ...formData, role: 'manager' })}
                                 className={`h-10 px-4 rounded-lg border font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                                    formData.role === 'manager'
                                       ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                       : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                 }`}
                              >
                                 <span>👔 Manager</span>
                              </button>
                           </div>
                        </div>
                     )}

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Full Name</label>
                          <input 
                             type="text" required placeholder="e.g. John Doe"
                             className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900"
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Email Address</label>
                          <input 
                             type="email" required placeholder="e.g. agent@company.com" autoComplete="new-email"
                             className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900"
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                             {formData.role === 'manager' ? 'Team to Manage (optional)' : 'Assign to Team'}
                          </label>
                          <select 
                             required={formData.role !== 'manager'}
                             className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                             value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}
                          >
                             <option value="">{formData.role === 'manager' ? 'Select a team to manage...' : 'Select a team...'}</option>
                             {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                          </select>
                          {formData.role === 'manager' && (
                              <p className="text-xs text-slate-500 font-medium mt-1">
                                 You can assign a team later from the Teams page
                              </p>
                           )}
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Phone Number</label>
                          <input 
                             type="text" placeholder="+1 (555) 000-0000"
                             className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                       </div>
                    </div>

                     {!editAgentId && (
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2 col-span-2">
                              <label className="text-sm font-medium text-slate-700">Set Password</label>
                              <input 
                                 type="password" required placeholder="Choose a secure password"
                                 className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900"
                                 value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                              />
                           </div>
                        </div>
                     )}

                    <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                       <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 h-10 rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                       <button type="submit" className="flex-[2] h-10 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all">
                          {editAgentId ? 'Commit Changes' : (formData.role === 'manager' ? 'Add Manager' : 'Add Agent')}
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8">
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Assign Team</h2>
                 <p className="text-slate-500 font-medium text-sm mb-6">Route <span className="text-blue-600 font-semibold">{selectedAgentForTeam?.name}</span> to an operational team.</p>

                 <form onSubmit={(e) => {
                    e.preventDefault();
                    assignTeamMutation.mutate({
                       id: selectedAgentForTeam.id,
                       team_id: assignTeamId ? parseInt(assignTeamId) : null
                    });
                 }} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Select Target Team</label>
                       <select 
                          required
                          className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all text-sm text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                          value={assignTeamId} onChange={e => setAssignTeamId(e.target.value)}
                       >
                          <option value="">Select Team...</option>
                          {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                       </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                       <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 h-10 rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                       <button 
                         type="submit" 
                         disabled={assignTeamMutation.isPending}
                         className="flex-[2] h-10 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
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
