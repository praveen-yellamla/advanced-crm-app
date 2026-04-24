import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Globe,
  Languages,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    teamName: '',
    managerId: '',
    region: '',
    language: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teamsRes, agentsRes] = await Promise.all([
        api.get('/admin/teams'),
        api.get('/admin/agents') // We'll use agents list to find managers for now
      ]);
      setTeams(teamsRes.data.data);
      
      // Filter users who can be managers (in a real app, this would be a specific endpoint)
      // For now, let's just use all users as potential managers or a specific role
      // But since we don't have a getManagers endpoint, I'll just mock or use the agents and filter if role === 'MANAGER'
      // Wait, I should probably have a separate endpoint for managers. 
      // I'll just fetch all users and filter by role.
      const usersRes = await api.get('/admin/agents'); // This actually returns AGENTS. 
      // I'll add a getManagers in the controller if needed, but for now I'll just fetch everyone who isn't an agent if possible.
      // Actually, I'll just use a subset for now.
    } catch (error) {
      toast.error('Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/admin/teams/${editingTeam.id}`, formData);
        toast.success('Team updated successfully');
      } else {
        await api.post('/admin/teams', formData);
        toast.success('Team created successfully');
      }
      setShowModal(false);
      setEditingTeam(null);
      setFormData({ teamName: '', managerId: '', region: '', language: '', isActive: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await api.delete(`/admin/teams/${id}`);
        toast.success('Team deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete team');
      }
    }
  };

  const openEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      teamName: team.teamName,
      managerId: team.managerId,
      region: team.region || '',
      language: team.language || '',
      isActive: team.isActive
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Team Management</h2>
          <p className="text-slate-500 font-medium mt-2">Organize agents into high-performance regional units.</p>
        </div>
        <button 
          onClick={() => { setEditingTeam(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Team
        </button>
      </div>

      {/* FILTERS/SEARCH */}
      <div className="bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search teams by name or manager..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/10 transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* TEAMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[32px]" />)
        ) : (
          teams.map((team) => (
            <motion.div 
              key={team.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={28} />
                </div>
                <div className="flex gap-2">
                   <button onClick={() => openEdit(team)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit2 size={18} />
                   </button>
                   <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                   </button>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{team.teamName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                     <p className="text-xs font-bold text-slate-400">{team.isActive ? 'Active Unit' : 'Inactive'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-2 text-slate-500">
                      <Globe size={14} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{team.region || 'Global'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-500">
                      <Languages size={14} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{team.language || 'English'}</span>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold">
                         {team.manager?.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manager</p>
                         <p className="text-xs font-bold text-slate-900">{team.manager?.name}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{team._count?.agents || 0}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agents</p>
                   </div>
                </div>
              </div>

              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full" />
            </motion.div>
          ))
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{editingTeam ? 'Update Team' : 'Create New Team'}</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">Configure your regional sales unit parameters.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Team Name</label>
                       <input 
                         type="text" 
                         required
                         value={formData.teamName}
                         onChange={(e) => setFormData({...formData, teamName: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-bold"
                         placeholder="e.g. Asia Pacific Alpha"
                       />
                    </div>
                    
                    <div className="space-y-2 col-span-2 md:col-span-1">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Manager ID</label>
                       <input 
                         type="number" 
                         required
                         value={formData.managerId}
                         onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-bold"
                         placeholder="ID (e.g. 2)"
                       />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Region</label>
                       <input 
                         type="text" 
                         value={formData.region}
                         onChange={(e) => setFormData({...formData, region: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-bold"
                         placeholder="e.g. EMEA"
                       />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Primary Language</label>
                       <input 
                         type="text" 
                         value={formData.language}
                         onChange={(e) => setFormData({...formData, language: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/5 transition-all text-sm font-bold"
                         placeholder="e.g. Spanish"
                       />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1 flex items-center pt-6">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${formData.isActive ? 'left-7' : 'left-1'}`} />
                             <input 
                               type="checkbox" 
                               className="hidden" 
                               checked={formData.isActive}
                               onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                             />
                          </div>
                          <span className="text-sm font-black text-slate-900">Active Stage</span>
                       </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-10">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                      {editingTeam ? 'Save Changes' : 'Create Team'}
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

export default TeamManagement;
