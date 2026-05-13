import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Search, 
  Filter, 
  MessageSquare, 
  TrendingUp, 
  Star, 
  Award,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  BarChart,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerAgents = () => {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['managerAgents'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  const [feedbackData, setFeedbackData] = useState({
    content: '',
    priority: 'NORMAL',
    suggestions: ''
  });

  const feedbackMutation = useMutation({
    mutationFn: (data) => api.post('/manager/feedback', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerAgents']);
      toast.success('Performance Feedback Sent');
      setIsFeedbackModalOpen(false);
      setFeedbackData({ content: '', priority: 'NORMAL', suggestions: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed')
  });

  const filteredAgents = agents?.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Team Performance</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Operational Status & Agent Development</p>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search team agents by name or role..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-[12px] focus:ring-violet-500/5 focus:border-violet-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* AGENTS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {isLoading ? (
            <div className="col-span-full py-20 text-center text-slate-400 uppercase font-bold tracking-[0.3em]">Loading Team Members...</div>
         ) : filteredAgents?.map((agent) => (
           <motion.div 
             key={agent.id}
             whileHover={{ y: -5 }}
             className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-violet-100 transition-all duration-500 group relative overflow-hidden"
           >
              <div className="flex flex-col sm:flex-row items-center gap-10">
                 <div className="w-32 h-32 rounded-[32px] border-4 border-slate-50 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                 </div>
                 <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div>
                       <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight">{agent.name}</h3>
                       <div className="flex flex-wrap items-center gap-4 mt-2 justify-center sm:justify-start">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Award size={12} className="text-amber-500"/> Senior Account Agent</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} className="text-violet-600"/> Verified Account</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-2">
                       <div className="text-center sm:text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Leads</p>
                          <p className="text-2xl font-bold text-[#0F172A] tracking-tighter">{agent._count.assignedLeads}</p>
                       </div>
                       <div className="text-center sm:text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Calls Logged</p>
                          <p className="text-2xl font-bold text-[#0F172A] tracking-tighter">{agent._count.calls}</p>
                       </div>
                       <div className="text-center sm:text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">QA Average</p>
                          <p className="text-2xl font-bold text-violet-600 tracking-tighter">84.2%</p>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button 
                         onClick={() => { setSelectedAgent(agent); setIsFeedbackModalOpen(true); }}
                         className="flex-1 h-12 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-violet-600 hover:text-violet-600 transition-all flex items-center justify-center gap-3"
                       >
                          <MessageSquare size={16} /> Performance Feedback
                       </button>
                       <button className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                          <Target size={20} />
                       </button>
                    </div>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
         {isFeedbackModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-3xl" onClick={() => setIsFeedbackModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden p-12">
                 <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-2">Issue Coaching Feedback</h2>
                 <p className="text-[#64748B] font-medium text-sm mb-10">Direct communication to <span className="text-violet-600 font-bold">{selectedAgent?.name}</span>'s dashboard.</p>

                 <form onSubmit={(e) => {
                    e.preventDefault();
                    feedbackMutation.mutate({ ...feedbackData, agentId: selectedAgent.id });
                 }} className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Classification</label>
                       <div className="flex gap-4">
                          {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => (
                            <button 
                              key={p} type="button"
                              onClick={() => setFeedbackData({...feedbackData, priority: p})}
                              className={`flex-1 py-3 rounded-xl border text-[9px] font-bold transition-all ${
                                feedbackData.priority === p ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-violet-200'
                              }`}
                            >
                               {p}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observations & Comments</label>
                       <textarea 
                          required
                          placeholder="What did you observe regarding their performance?"
                          className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-violet-600 transition-all font-medium text-sm"
                          value={feedbackData.content} onChange={e => setFeedbackData({...feedbackData, content: e.target.value})}
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Actionable Suggestions</label>
                       <input 
                          placeholder="Immediate steps for improvement..."
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-medium text-sm"
                          value={feedbackData.suggestions} onChange={e => setFeedbackData({...feedbackData, suggestions: e.target.value})}
                       />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button type="button" onClick={() => setIsFeedbackModalOpen(false)} className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                       <button type="submit" disabled={feedbackMutation.isPending} className="flex-1 h-16 bg-[#0F172A] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl hover:brightness-125 transition-all">
                          {feedbackMutation.isPending ? 'Loading...' : 'Send Feedback'}
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

export default ManagerAgents;
