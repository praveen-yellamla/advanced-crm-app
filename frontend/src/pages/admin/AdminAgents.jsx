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
  UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminAgents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

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

  const { data: agents, isLoading } = useQuery({
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

  const { data: invites } = useQuery({
    queryKey: ['adminInvites'],
    queryFn: async () => {
      const res = await api.get('/admin/invites');
      return res.data.data;
    }
  });

  const { data: inviteStats } = useQuery({
    queryKey: ['inviteStats'],
    queryFn: async () => {
      const res = await api.get('/admin/invite-stats');
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
      toast.success('Agents Initialized');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Deployment failed')
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Agent Details Updated');
      setIsModalOpen(false);
      setEditAgentId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Agents Terminated');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => api.post('/admin/invites', data),
    onSuccess: () => {
      toast.success('Invitation Sent Successfully');
      setIsInviteModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', teamId: '', role: 'AGENT' });
      queryClient.invalidateQueries(['adminInvites']);
      queryClient.invalidateQueries(['inviteStats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send invite')
  });

  const combinedList = [
    ...(agents?.map(a => ({ ...a, type: 'USER', status: a.isActive ? 'Active' : 'Joined' })) || []),
    ...(invites?.filter(i => i.status !== 'ACCEPTED').map(i => ({ 
        id: `invite-${i.id}`, 
        name: 'Pending User', 
        email: i.email, 
        phone: i.phone,
        role: i.role,
        type: 'INVITE',
        status: 'Pending'
    })) || [])
  ];

  const filteredAgents = combinedList.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.email.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'ACCEPTED') return matchesSearch && a.type === 'USER';
    if (filterStatus === 'PENDING') return matchesSearch && a.type === 'INVITE';
    
    return matchesSearch;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Agents</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage Sales Force & Organizational Staff</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsInviteModalOpen(true)}
             className="h-14 px-8 bg-white border border-[#E2E8F0] rounded-3xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all"
           >
              <Mail size={18} /> Invite by Email
           </button>
           <button 
             onClick={() => {
               setEditAgentId(null);
               setFormData({ name: '', email: '', password: '', phone: '', teamId: '', role: 'AGENT' });
               setIsModalOpen(true);
             }}
             className="h-14 px-10 bg-[#0F172A] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
           >
              <Plus size={20} /> Add New Agent
           </button>
        </div>
      </div>

      {/* FILTERS & SUMMARY */}
      <div className="flex flex-col xl:flex-row gap-8">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search agents..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         <div className="flex gap-4">
            <button 
               onClick={() => setFilterStatus('ALL')}
               className={`px-8 bg-white border rounded-3xl flex flex-col justify-center min-w-[140px] shadow-sm transition-all text-left ${filterStatus === 'ALL' ? 'border-blue-600 ring-4 ring-blue-500/5' : 'border-[#E2E8F0] hover:border-blue-200'}`}
            >
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sent</p>
               <p className="text-xl font-black text-[#0F172A]">{inviteStats?.total || 0}</p>
            </button>
            <button 
               onClick={() => setFilterStatus('ACCEPTED')}
               className={`px-8 bg-white border rounded-3xl flex flex-col justify-center min-w-[140px] shadow-sm transition-all text-left ${filterStatus === 'ACCEPTED' ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-[#E2E8F0] hover:border-emerald-200'}`}
            >
               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Joined</p>
               <p className="text-xl font-black text-[#0F172A]">{inviteStats?.accepted || 0}</p>
            </button>
            <button 
               onClick={() => setFilterStatus('PENDING')}
               className={`px-8 bg-white border rounded-3xl flex flex-col justify-center min-w-[140px] shadow-sm transition-all text-left ${filterStatus === 'PENDING' ? 'border-amber-500 ring-4 ring-amber-500/5' : 'border-[#E2E8F0] hover:border-amber-200'}`}
            >
               <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
               <p className="text-xl font-black text-[#0F172A]">{inviteStats?.pending || 0}</p>
            </button>
         </div>
      </div>

      {/* AGENTS LIST */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Agent Name</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Team</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Role</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Metrics</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                     <th className="px-10 py-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">Controls</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Agent Identity Hub...</td></tr>
                  ) : filteredAgents?.map((agent) => (
                    <tr key={agent.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-500 group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-full border-4 border-slate-50 bg-white overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                <img src={agent.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                             </div>
                             <div>
                                <p className="text-xl font-bold text-[#0F172A] tracking-tight">{agent.name}</p>
                                <div className="flex gap-4 mt-1">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Mail size={10}/> {agent.email}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={10}/> {agent.phone || 'NO PHONE'}</p>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl w-fit">
                             <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">{agent.team?.teamName || 'Unassigned'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${agent.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {agent.role}
                          </span>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-10">
                             <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads</p>
                                <p className="text-xl font-black text-[#0F172A] italic">{agent?._count?.assignedLeads ?? 0}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Calls</p>
                                <p className="text-xl font-black text-blue-600 italic">{agent?._count?.calls ?? 0}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          {agent.type === 'INVITE' ? (
                            <div className="flex items-center gap-3 text-amber-600 font-bold italic">
                               <Mail size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                            </div>
                          ) : agent.isActive ? (
                            <div className="flex items-center gap-3 text-emerald-600 font-bold italic">
                               <CheckCircle2 size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-slate-300 font-bold italic">
                               <XCircle size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Deactivated</span>
                            </div>
                          )}
                       </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-3">
                              {/* Toggle Status */}
                              <div className="flex items-center gap-2" title="Toggle agent status">
                                 <button 
                                   disabled={agent.type === 'INVITE'}
                                   onClick={() => {
                                      if (!agent.isActive || confirm('Deactivate this agent?')) {
                                         updateAgentMutation.mutate({ id: agent.id, data: { isActive: !agent.isActive } });
                                      }
                                   }}
                                   className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${agent.type === 'INVITE' ? 'bg-slate-50 text-slate-200' : agent.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                 >
                                    {agent.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                 </button>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">
                                   {agent.type === 'INVITE' ? 'Invited' : agent.isActive ? 'Active' : 'Suspended'}
                                 </span>
                              </div>

                              {/* Edit Button */}
                              <button 
                                disabled={agent.type === 'INVITE'}
                                onClick={() => handleEdit(agent)}
                                title="Edit Agent Details"
                                className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all shadow-sm ${agent.type === 'INVITE' ? 'bg-slate-50 border-slate-100 text-slate-200' : 'bg-white border-[#E2E8F0] text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}
                              >
                                 <Edit3 size={18} />
                              </button>

                              {/* Terminate Button */}
                              <button 
                                disabled={agent.type === 'INVITE'}
                                onClick={() => { if(confirm('Are you sure you want to disable this agent? This action cannot be easily undone.')) deleteAgentMutation.mutate(agent.id); }}
                                title="Deactivate Agent"
                                className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all shadow-sm focus:outline-none ${agent.type === 'INVITE' ? 'bg-slate-50 border-slate-100 text-slate-200' : 'bg-white border-[#E2E8F0] text-slate-400 hover:border-red-600 hover:text-red-600 hover:bg-red-50'}`}
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

      {/* CREATE AGENT MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" onClick={() => { setIsModalOpen(false); setEditAgentId(null); }}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden p-16">
                 <div className="mb-12">
                    <h2 className="text-4xl font-bold text-[#0F172A] tracking-tight uppercase">{editAgentId ? 'Edit Agent' : 'Add Agent'}</h2>
                    <p className="text-sm font-medium text-slate-400 mt-2">{editAgentId ? 'Update agent configuration' : 'Initialize a new organizational Agent'}</p>
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
                 }} className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Full Identity</label>
                          <input 
                             type="text" required placeholder="Full Name"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Secure Endpoint</label>
                          <input 
                             type="email" required placeholder="Corporate Email"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Password</label>
                          <input 
                             type="password" required={!editAgentId} placeholder={editAgentId ? "Leave blank to keep unchanged" : "Password Phrase"}
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                             value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Team Assignment</label>
                          <select 
                             required 
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A] appearance-none"
                             value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}
                          >
                             <option value="">Choose Center</option>
                             {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                          </select>
                       </div>
                       <div className="space-y-4 col-span-2">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Voice Communication (Telephony)</label>
                          <input 
                             type="text" placeholder="+1 (555) 000-0000"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                       </div>
                       <div className="space-y-4 col-span-2">
                          <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Profile Image (Mandatory)</label>
                          <input 
                             type="file" required={!editAgentId} accept="image/*"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A] pt-4"
                             onChange={e => setFormData({...formData, image: e.target.files[0]})}
                          />
                       </div>
                    </div>

                    <div className="flex gap-6 pt-10">
                       <button type="button" onClick={() => { setIsModalOpen(false); setEditAgentId(null); }} className="flex-1 h-18 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Abort</button>
                       <button 
                          type="submit" disabled={editAgentId ? updateAgentMutation.isPending : createAgentMutation.isPending}
                          className="flex-3 h-18 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                       >
                          {editAgentId ? (updateAgentMutation.isPending ? 'UPDATING...' : <>Update Agent <ArrowRight size={20}/></>) 
                                       : (createAgentMutation.isPending ? 'DEPLOYING NODE...' : <>Initialize Agent <ArrowRight size={20}/></>)}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* INVITE AGENT MODAL */}
      <AnimatePresence>
         {isInviteModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" onClick={() => setIsInviteModalOpen(false)}/>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden p-16">
                 <div className="mb-12">
                    <h2 className="text-4xl font-bold text-[#0F172A] tracking-tight uppercase">Invite User</h2>
                    <p className="text-sm font-medium text-slate-400 mt-2">Send an onboarding invitation link</p>
                 </div>
 
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    inviteUserMutation.mutate({ 
                       email: formData.email.trim(), 
                       phone: formData.phone ? formData.phone.trim() : null, 
                       role: formData.role 
                    });
                 }} className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Email Address</label>
                       <input 
                          type="email" required placeholder="name@company.com"
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                       <input 
                          type="text" placeholder="+1 (555) 000-0000"
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Role Configuration</label>
                       <select 
                          required 
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A] appearance-none"
                          value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                       >
                          <option value="AGENT">Agent (Standard)</option>
                          <option value="MANAGER">Manager (Elevated)</option>
                       </select>
                    </div>
 
                    <div className="flex gap-6 pt-10">
                       <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-18 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Cancel</button>
                       <button 
                          type="submit" disabled={inviteUserMutation.isPending}
                          className="flex-3 h-18 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                       >
                          {inviteUserMutation.isPending ? 'SENDING...' : <>Dispatch Invite <Mail size={20}/></>}
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
