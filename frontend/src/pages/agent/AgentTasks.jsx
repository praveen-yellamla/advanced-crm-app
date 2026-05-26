import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, Calendar, Clock, CheckCircle2, AlertCircle, Search,
  Filter, MoreVertical, ChevronRight, Bell, LayoutGrid, 
  List as ListIcon, Trash2, Tag, Flag, User, ArrowRight, 
  Calendar as CalendarIcon, X, CheckCircle, Sparkles, Phone,
  ChevronLeft, ClipboardCheck, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'PENDING', label: 'To Do', color: 'blue' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'amber' },
  { id: 'COMPLETED', label: 'Completed', color: 'emerald' }
];

const AgentTasks = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('KANBAN'); // KANBAN, LIST, CALENDAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

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
    priority: 'NORMAL',
    type: 'FOLLOWUP'
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/agent/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      queryClient.invalidateQueries(['agentDashboard']);
      toast.success('Task created successfully');
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'NORMAL', type: 'FOLLOWUP' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/agent/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      queryClient.invalidateQueries(['agentDashboard']);
      toast.success('Task updated');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => api.delete(`/agent/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentTasks']);
      queryClient.invalidateQueries(['agentDashboard']);
      toast.success('Task deleted');
    }
  });

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Task Manager</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Manage your daily activities & follow-ups</p>
        </div>
        <div className="flex gap-4">
           <div className="flex p-1.5 bg-slate-100 rounded-2xl">
              <NavBtn active={viewMode === 'KANBAN'} icon={LayoutGrid} onClick={() => setViewMode('KANBAN')} />
              <NavBtn active={viewMode === 'LIST'} icon={ListIcon} onClick={() => setViewMode('LIST')} />
              <NavBtn active={viewMode === 'CALENDAR'} icon={CalendarIcon} onClick={() => setViewMode('CALENDAR')} />
           </div>
           {isManager && (
             <button 
               onClick={() => setIsModalOpen(true)}
               className="h-14 px-8 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
             >
                <Plus size={20} className="text-blue-400" /> Create Task
             </button>
           )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search tasks by title or description..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[32px] focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
      </div>

      <AnimatePresence mode="wait">
         {viewMode === 'KANBAN' && (
           <motion.div 
             key="kanban"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="grid grid-cols-1 md:grid-cols-3 gap-10"
           >
              {COLUMNS.map(col => (
                <div key={col.id} className="space-y-6">
                   <div className="flex items-center justify-between px-6">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full bg-${col.color}-500 shadow-[0_0_10px_currentColor]`} />
                         <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">{col.label}</h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-300">{(filteredTasks || []).filter(t => (t.status || 'PENDING') === col.id).length}</span>
                   </div>
                   <div className="space-y-6 min-h-[600px] p-4 bg-slate-50/30 rounded-[48px] border-2 border-dashed border-slate-100/50">
                      {(filteredTasks || []).filter(t => (t.status || 'PENDING') === col.id).map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onUpdate={(data) => updateTaskMutation.mutate({ id: task.id, data })}
                          onDelete={() => deleteTaskMutation.mutate(task.id)}
                          onClick={() => setSelectedTask(task)}
                          isManager={isManager}
                        />
                      ))}
                   </div>
                </div>
              ))}
           </motion.div>
         )}

         {viewMode === 'LIST' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
            >
               <div className="overflow-x-auto">
                  <table className="crm-table">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Task</th>
                           <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</th>
                           <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Due Date</th>
                           <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                           <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredTasks.length === 0 ? (
                           <tr>
                              <td colSpan="5" className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                 No tasks available.
                              </td>
                           </tr>
                        ) : (
                          filteredTasks.map(task => (
                           <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedTask(task)}>
                              <td className="px-10 py-8">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                       <ClipboardCheck size={18} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{task.title}</p>
                                       <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1">{task.description}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-8">
                                 <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                    task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-slate-50 text-slate-400 border-slate-100'
                                 }`}>
                                    {task.priority}
                                 </span>
                              </td>
                             <td className="px-10 py-8 text-xs font-black text-slate-900 italic uppercase">
                                {new Date(task.dueDate).toLocaleDateString()}
                             </td>
                             <td className="px-10 py-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.status || 'PENDING'}</span>
                             </td>
                             <td className="px-10 py-8 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                   <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center">
                                      <Info size={16} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))
                        )}
                     </tbody>
                  </table>
               </div>
            </motion.div>
         )}

         {viewMode === 'CALENDAR' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
              className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20"
            >
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                     <button className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><ChevronLeft size={20}/></button>
                     <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Current Month</h2>
                     <button className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><ChevronRight size={20}/></button>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                     <Clock size={14} className="mr-2" /> Current Date: {new Date().toLocaleDateString()}
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-6">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pb-6">{d}</div>
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-50/50 rounded-3xl border border-slate-50 p-4 hover:border-blue-200 hover:bg-white transition-all cursor-pointer relative group">
                       <span className="text-[11px] font-black text-slate-400 group-hover:text-blue-600 transition-colors">{i + 1}</span>
                       <div className="absolute bottom-4 left-4 right-4 flex gap-1">
                          {(filteredTasks || []).filter(t => {
                               const d = new Date(t.dueDate);
                               const now = new Date();
                               return d.getDate() === (i + 1) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                           }).map((t, idx) => (
                             idx < 3 && <div key={idx} className={`h-1.5 flex-1 rounded-full ${t.priority === 'HIGH' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                           ))}
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* TASK DETAIL MODAL */}
      <AnimatePresence>
         {selectedTask && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-[#0F172A]/40 backdrop-blur-xl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="relative w-full max-w-2xl bg-white rounded-[64px] shadow-2xl p-16 overflow-hidden"
               >
                  <div className="flex justify-between items-center mb-12">
                     <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600`}>
                           <ClipboardCheck size={28} />
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Task Details</h2>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reviewing Assigned Activity</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedTask(null)} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all">
                        <X size={24} />
                     </button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                        <p className="text-2xl font-black text-slate-900 italic uppercase">{selectedTask.title}</p>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                           <p className="text-lg font-bold text-slate-700 leading-relaxed italic">{selectedTask.description || 'No description provided.'}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                           <div className="flex items-center gap-3 text-slate-900 font-black italic">
                              <Calendar size={18} className="text-blue-600" />
                              <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                           <div className={`px-4 py-1.5 rounded-xl border inline-block text-[9px] font-black uppercase tracking-widest ${
                              selectedTask.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              selectedTask.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-slate-50 text-slate-400 border-slate-100'
                           }`}>
                              {selectedTask.priority}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-slate-100 flex gap-4">
                     {selectedTask.status !== 'COMPLETED' && (
                        <button 
                           onClick={() => {
                              updateTaskMutation.mutate({ id: selectedTask.id, data: { status: 'COMPLETED' } });
                              setSelectedTask(null);
                           }}
                           className="flex-1 h-18 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           <CheckCircle size={20} /> Mark as Complete
                        </button>
                     )}
                     {isManager && (
                        <button 
                           onClick={() => {
                              deleteTaskMutation.mutate(selectedTask.id);
                              setSelectedTask(null);
                           }}
                           className="h-18 px-10 bg-rose-50 text-rose-600 rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center justify-center gap-3"
                        >
                           <Trash2 size={20} /> Delete
                        </button>
                     )}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-[#0F172A]/40 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-[64px] shadow-2xl p-16 overflow-hidden"
              >
                 <div className="flex justify-between items-center mb-12">
                    <div>
                       <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">New Task</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Assigning task to agent</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all">
                       <X size={24} />
                    </button>
                 </div>
                 
                 <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(newTask); }} className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Title</label>
                       <input 
                          required placeholder="Enter task title..."
                          className="w-full h-18 px-8 bg-slate-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold text-lg text-slate-900"
                          value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                       <textarea 
                          placeholder="Enter task details..."
                          className="w-full h-40 p-8 bg-slate-50 border-none rounded-[32px] outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold text-slate-900 text-lg leading-relaxed italic"
                          value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Due Date</label>
                          <input 
                             required type="date"
                             className="w-full h-18 px-8 bg-slate-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-blue-600/10 font-bold text-sm text-slate-900"
                             value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Priority</label>
                          <select 
                             className="w-full h-18 px-8 bg-slate-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-blue-600/10 font-black text-[11px] uppercase tracking-widest text-slate-900"
                             value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                          >
                             <option value="NORMAL">Normal</option>
                             <option value="MEDIUM">Medium</option>
                             <option value="HIGH">High</option>
                          </select>
                       </div>
                    </div>
                    <div className="flex gap-6 pt-6">
                       <button type="submit" className="flex-1 h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:brightness-125 transition-all">
                          {createTaskMutation.isPending ? 'Saving...' : 'Create Task'}
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

const TaskCard = ({ task, onUpdate, onDelete, onClick, isManager }) => (
  <motion.div 
    whileHover={{ y: -6, scale: 1.02 }}
    onClick={onClick}
    className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group relative cursor-pointer"
  >
     <div className="flex justify-between items-start mb-6">
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
           task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
           task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
           'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
           {task.priority}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {isManager && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={14}/></button>}
           <button className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400"><Info size={14}/></button>
        </div>
     </div>

     <h4 className="text-lg font-black text-slate-900 italic uppercase tracking-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
     <p className="text-xs text-slate-400 font-bold mt-2 line-clamp-2 leading-relaxed italic">{task.description}</p>

     <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
              <CalendarIcon size={14} />
           </div>
           <span className="text-[10px] font-black text-slate-900 italic tabular-nums">{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
        
        <div className="flex gap-2">
           {task.status !== 'COMPLETED' ? (
              <button 
                 onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ status: task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED' });
                 }}
                 className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center"
              >
                 <ArrowRight size={18} />
              </button>
           ) : (
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                 <CheckCircle size={18} />
              </div>
           )}
        </div>
     </div>
  </motion.div>
);

const NavBtn = ({ active, icon: Icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}
  >
    <Icon size={18} />
  </button>
);

export default AgentTasks;
