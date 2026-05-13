import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Bell,
  CheckCircle,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Trash2,
  Tag,
  Flag,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'PENDING', label: 'Pending Backlog', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', label: 'Active Engagement', color: 'bg-blue-600' },
  { id: 'COMPLETED', label: 'Mission Accomplished', color: 'bg-emerald-600' }
];

const AgentTasks = () => {
  const [view, setView] = useState('kanban'); // kanban, list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['agentTasks'],
    queryFn: async () => {
      const res = await api.get('/agent/tasks');
      return res.data.data;
    }
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Normal',
    type: 'FOLLOWUP'
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/agent/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      toast.success('Strategy Task Orchestrated');
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'Normal', type: 'FOLLOWUP' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/agent/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      toast.success('Alignment Synchronized');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => api.delete(`/agent/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      toast.success('Task Dissolved');
    }
  });

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'High': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {COLUMNS.map(col => (
        <div key={col.id} className="space-y-8">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${col.color} shadow-lg shadow-blue-200`} />
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">{col.label}</h3>
             </div>
             <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-500">
               {tasks?.filter(t => (t.status || 'PENDING') === col.id).length || 0}
             </span>
          </div>

          <div className="space-y-6 min-h-[600px] p-2 bg-slate-50/30 rounded-[40px] border border-dashed border-slate-200">
            {tasks?.filter(t => (t.status || 'PENDING') === col.id).map(task => (
              <motion.div
                layoutId={task.id.toString()}
                key={task.id}
                className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                   <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${getPriorityStyles(task.priority)}`}>
                     {task.priority}
                   </span>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                      <button className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                         <MoreVertical size={14} />
                      </button>
                   </div>
                </div>

                <h4 className="text-lg font-bold text-[#0F172A] mb-2 tracking-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                <p className="text-xs text-slate-400 font-medium mb-8 line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">{new Date(task.dueDate).toLocaleDateString()}</span>
                   </div>
                   
                   <div className="flex gap-2">
                     {col.id !== 'COMPLETED' && (
                       <button 
                         onClick={() => updateTaskMutation.mutate({ id: task.id, status: col.id === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED' })}
                         className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                       >
                          <ArrowRight size={16} />
                       </button>
                     )}
                     {col.id === 'COMPLETED' && (
                       <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                          <CheckCircle2 size={16} />
                       </div>
                     )}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 pb-16">
      {/* ELITE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter mb-2">Strategy Ledger</h1>
           <p className="text-[#64748B] font-bold text-sm flex items-center gap-2">
             <Bell size={14} className="text-blue-500 animate-pulse" /> 
             Operational command center for team coordination and lead engagement.
           </p>
        </div>

        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-2 rounded-[24px] border border-white/60 shadow-xl">
           <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setView('kanban')}
                className={`p-3 rounded-xl transition-all ${view === 'kanban' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-3 rounded-xl transition-all ${view === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
              >
                <List size={18} />
              </button>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="h-14 px-10 bg-[#0F172A] text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-300 hover:-translate-y-1 transition-all flex items-center gap-3"
           >
             <Plus size={20} /> Orchestrate Task
           </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-wrap items-center gap-6">
         <div className="flex-1 min-w-[300px] relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search strategy ledger..."
              className="w-full h-16 pl-16 pr-6 bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-[24px] outline-none focus:border-blue-500 transition-all font-bold text-sm shadow-sm"
            />
         </div>
         <button className="h-16 px-8 bg-white border border-slate-200/60 rounded-[24px] flex items-center gap-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={18} /> Filters
         </button>
      </div>

      {/* MAIN VIEW AREA */}
      {isLoading ? (
        <div className="h-[600px] flex flex-col items-center justify-center space-y-6">
           <div className="w-16 h-16 border-8 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Workforce Data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
           {view === 'kanban' ? renderKanban() : (
             <div className="p-20 text-center bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-[40px]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">List View Implementation in Progress</p>
             </div>
           )}
        </AnimatePresence>
      )}

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl p-16">
                 <div className="flex justify-between items-center mb-10">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter">New Strategy</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all">
                       <XCircle size={24} className="text-slate-300" />
                    </button>
                 </div>
                 
                 <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(newTask); }} className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Engagement Objective</label>
                       <input 
                          required
                          placeholder="What needs to be achieved?"
                          className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                          value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tactical Details</label>
                       <textarea 
                          placeholder="Context and supporting intelligence..."
                          className="w-full h-32 p-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-medium text-sm leading-relaxed"
                          value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline Sequence</label>
                          <input 
                             required type="date"
                             className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                             value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Logic</label>
                          <select 
                             className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-black text-[10px] uppercase tracking-widest"
                             value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                          >
                             <option>Normal</option>
                             <option>High</option>
                             <option>Urgent</option>
                          </select>
                       </div>
                    </div>
                    <div className="flex gap-6 pt-10">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Abort</button>
                       <button type="submit" className="flex-1 h-16 bg-[#0F172A] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-300 hover:scale-105 transition-all">
                          {createTaskMutation.isPending ? 'Deploying...' : 'Initiate Task'}
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

const XCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default AgentTasks;
