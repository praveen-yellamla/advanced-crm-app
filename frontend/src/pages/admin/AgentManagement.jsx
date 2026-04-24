import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  UserSquare2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Briefcase,
  Globe,
  Languages,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // Only for creation
    phone: '',
    teamId: '',
    managerId: '',
    region: '',
    language: '',
    isActive: true
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'AGENT'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [agentsRes, teamsRes] = await Promise.all([
        api.get('/admin/agents'),
        api.get('/admin/teams')
      ]);
      setAgents(agentsRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await api.put(`/admin/agents/${editingAgent.id}`, formData);
        toast.success('Agent updated successfully');
      } else {
        await api.post('/admin/agents', formData);
        toast.success('Agent created successfully');
      }
      setShowModal(false);
      setEditingAgent(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/invite', inviteData);
      toast.success('Secure invite sent successfully');
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'AGENT' });
    } catch (error) {
      toast.error('Failed to send invite');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await api.delete(`/admin/agents/${id}`);
        toast.success('Agent removed');
        fetchData();
      } catch (error) {
        toast.error('Failed to remove agent');
      }
    }
  };

  const openEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      password: '', // Don't show password
      phone: agent.phone || '',
      teamId: agent.teamId || '',
      managerId: agent.managerId || '',
      region: agent.region || '',
      language: agent.language || '',
      isActive: agent.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      teamId: '',
      managerId: '',
      region: '',
      language: '',
      isActive: true
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Agent Personnel</h2>
          <p className="text-slate-500 font-medium mt-2">Oversee global agent assignments and performance parameters.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Send size={18} className="text-blue-600" />
            Invite Member
          </button>
          <button 
            onClick={() => { setEditingAgent(null); resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Manual Agent
          </button>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search agents by name, email or region..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/10 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2">
           <select className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 pr-10">
              <option>All Regions</option>
              <option>EMEA</option>
              <option>APAC</option>
              <option>AMER</option>
           </select>
           <button className="flex items-center justify-center p-3 bg-slate-100 text-slate-600 rounded-2xl">
              <Filter size={18} />
           </button>
        </div>
      </div>

      {/* AGENTS LIST */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
           <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Details</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Location/Lang</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
           </thead>
           <tbody>
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                     <td colSpan="5" className="px-8 py-6 h-20 bg-slate-50/30"></td>
                  </tr>
                ))
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="border-b last:border-none border-slate-100 hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                              {agent.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{agent.name}</p>
                              <p className="text-xs font-medium text-slate-400">{agent.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Briefcase size={12} className="text-indigo-400" />
                              {agent.team?.teamName || 'Unassigned'}
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manager: {agent.manager?.name || 'None'}</p>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5"><Globe size={10} /> {agent.region || 'Global'}</p>
                           <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5"><Languages size={10} /> {agent.language || 'English'}</p>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${agent.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                           {agent.isActive ? 'Active' : 'Offline'}
                        </span>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                           <button onClick={() => openEdit(agent)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                              <Edit2 size={16} />
                           </button>
                           <button onClick={() => handleDelete(agent.id)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </td>
                  </tr>
                ))
              )}
           </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowInviteModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-[#0F172A] w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
             >
                <div className="p-10 relative overflow-hidden">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full" />
                   <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-6 border border-blue-600/20">
                         <Send size={28} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">Invite New Member</h3>
                      <p className="text-slate-500 text-sm font-medium mb-10">Send a secure registration link to their inbox.</p>

                      <form onSubmit={handleInvite} className="space-y-6 text-left">
                         <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={inviteData.email}
                              onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                              placeholder="agent@example.com"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Assigned Role</label>
                            <select 
                              value={inviteData.role}
                              onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-bold text-white"
                            >
                               <option value="AGENT" className="bg-slate-900">Agent</option>
                               <option value="MANAGER" className="bg-slate-900">Manager</option>
                               <option value="ADMIN" className="bg-slate-900">Admin</option>
                            </select>
                         </div>
                         <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all pt-10">
                            Send Secure Invitation
                         </button>
                      </form>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CRUD MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
             >
                <div className="p-10">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 mb-1">{editingAgent ? 'Edit Agent Profile' : 'Add New Agent'}</h3>
                         <p className="text-slate-500 text-sm font-medium">Configure authentication and regional assignments.</p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                         <X size={24} />
                      </button>
                   </div>

                   <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                            <input 
                              type="text" required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                            />
                         </div>
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <input 
                              type="email" required
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                            />
                         </div>
                         {!editingAgent && (
                            <div className="space-y-2 col-span-2 md:col-span-1">
                               <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Initial Password</label>
                               <input 
                                 type="password" required
                                 value={formData.password}
                                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                                 className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                               />
                            </div>
                         )}
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                            <input 
                              type="text"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                            />
                         </div>
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Assign Team</label>
                            <select 
                              value={formData.teamId}
                              onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                            >
                               <option value="">Unassigned</option>
                               {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                            </select>
                         </div>
                         <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Region</label>
                            <input 
                              type="text"
                              value={formData.region}
                              onChange={(e) => setFormData({...formData, region: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                            />
                         </div>
                         <div className="space-y-2 col-span-2 md:col-span-1 flex items-center pt-6">
                             <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={formData.isActive}
                                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                  className="w-6 h-6 rounded-lg text-blue-600 focus:ring-0"
                                />
                                <span className="text-sm font-black text-slate-900">Account Active</span>
                             </label>
                         </div>
                      </div>

                      <div className="flex gap-4 pt-8">
                         <button 
                           type="button" 
                           onClick={() => setShowModal(false)}
                           className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs"
                         >
                            Cancel
                         </button>
                         <button 
                           type="submit"
                           className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20"
                         >
                            {editingAgent ? 'Update Profile' : 'Create Agent'}
                         </button>
                      </div>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
