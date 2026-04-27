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
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentTasks = () => {
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
    priority: 'Normal'
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/agent/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      toast.success('Strategy Task Orchestrated');
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'Normal' });
    }
  });

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Daily Orchestrations</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage personal tasks, follow-ups & operational reminders</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl font-bold text-xs shadow-xl hover:brightness-125 transition-all flex items-center gap-3"
        >
           <Plus size={20} /> Create Task Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* TASK LIST */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-8">
               <div className="flex items-center justify-between underline bg-slate-50/50 p-4 -m-4 rounded-t-[40px] border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-widest px-4">Active Task Stack</h3>
               </div>

               <div className="space-y-4">
                  {isLoading ? (
                    <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Accessing Workbench Memory...</div>
                  ) : tasks?.map(task => (
                    <div key={task.id} className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-600 transition-all group flex items-start justify-between shadow-sm hover:shadow-lg">
                       <div className="flex gap-6">
                          <button className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 hover:bg-emerald-600 hover:text-white transition-all">
                             <CheckCircle size={20} />
                          </button>
                          <div>
                             <h4 className="text-lg font-bold text-[#0F172A] tracking-tight">{task.title}</h4>
                             <p className="text-xs font-medium text-slate-400 mt-1">{task.description}</p>
                             <div className="flex items-center gap-4 mt-4">
                                <span className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest"><Clock size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase ${task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>{task.priority}</span>
                             </div>
                          </div>
                       </div>
                       <button className="text-slate-300 hover:text-blue-600 transition-colors">
                          <MoreVertical size={20} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* SIDEBAR: STATS */}
         <div className="space-y-8">
            <div className="bg-blue-600 p-10 rounded-[40px] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-bold tracking-tight">Productivity Pulse</h3>
                  <div className="flex items-end justify-between">
                     <div>
                        <p className="text-5xl font-black tracking-tighter tabular-nums">78%</p>
                        <p className="text-[10px] font-bold uppercase mt-2 opacity-60">Completion Velocity</p>
                     </div>
                     <CheckCircle2 size={64} className="opacity-10 group-hover:scale-125 transition-transform duration-700" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm">
               <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-widest mb-8 border-b pb-4">Urgent Alerts</h3>
               <div className="space-y-6">
                  <div className="flex items-start gap-4">
                     <div className="w-2 h-12 bg-rose-500 rounded-full" />
                     <div>
                        <p className="text-xs font-bold text-[#0F172A]">Callback: John Miller</p>
                        <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">Overdue 2h</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-12">
                 <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-8">Create Strategy Node</h2>
                 <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(newTask); }} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                       <input 
                          required
                          className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-semibold"
                          value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Implementation Details</label>
                       <textarea 
                          className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-medium"
                          value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Deadline Sequence</label>
                          <input 
                             required type="date"
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-semibold"
                             value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Classification</label>
                          <select 
                             className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-xs uppercase"
                             value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                          >
                             <option>Normal</option>
                             <option>High</option>
                             <option>Urgent</option>
                          </select>
                       </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all">Cancel Node</button>
                       <button type="submit" className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
                          {createTaskMutation.isPending ? 'Syncing...' : 'Deploy Task'}
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

export default AgentTasks;
