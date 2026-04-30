import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  X, 
  UserPlus, 
  Search,
  Check,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AssignAgentModal = ({ isOpen, onClose, leadId, currentAgentId }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    },
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: (agentId) => api.put(`/core/leads/${leadId}/assign`, { agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalLeads']);
      queryClient.invalidateQueries(['leads-pipeline']);
      queryClient.invalidateQueries(['leadDetails', leadId]);
      toast.success('Agent Assigned Successfully');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assignment failed')
  });

  const filteredAgents = agents?.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                   <UserPlus size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase">Assign Agent</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select strategic owner</p>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="p-6 space-y-6">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text" placeholder="Search agents..." 
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-xs"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {isLoading ? (
                  <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" /></div>
                ) : filteredAgents.map(agent => (
                  <button 
                    key={agent.id}
                    onClick={() => mutation.mutate(agent.id)}
                    disabled={mutation.isPending}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      currentAgentId === agent.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-slate-100 hover:border-blue-600 hover:shadow-lg'
                    }`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                           <img src={agent.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-black text-[#0F172A] uppercase tracking-tight">{agent.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{agent.role} • {agent.team?.name || 'No Team'}</p>
                        </div>
                     </div>
                     {currentAgentId === agent.id ? (
                        <Check size={18} className="text-blue-600" />
                     ) : (
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                           <ShieldCheck size={14} className="text-blue-600" />
                        </div>
                     )}
                  </button>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignAgentModal;
