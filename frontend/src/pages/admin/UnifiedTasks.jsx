import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, 
  Calendar,
  Layout,
  BarChart3,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Sub-components
import TaskKanban from '../../components/admin/tasks/TaskKanban';
import TaskCalendar from '../../components/admin/tasks/TaskCalendar';
import TaskModal from '../../components/admin/tasks/TaskModal';
import TaskFilters from '../../components/admin/tasks/TaskFilters';
import TaskAnalytics from '../../components/admin/tasks/TaskAnalytics';

const UnifiedTasks = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban'); // kanban, calendar, analytics
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    sort: 'newest'
  });

  // Queries
  const { data: tasksData, isLoading, isFetching } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      params.append('sort', filters.sort);
      
      const res = await api.get(`/core/tasks?${params.toString()}`);
      return res.data;
    }
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['tasksAnalytics'],
    queryFn: async () => {
      const res = await api.get('/core/tasks/analytics');
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/core/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasksAnalytics']);
      toast.success('Strategy task deployed successfully');
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/core/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasksAnalytics']);
      toast.success('Task orchestration updated');
      setIsModalOpen(false);
    }
  });

  const patchStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/core/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasksAnalytics']);
      toast.success('Pipeline status synced');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/core/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasksAnalytics']);
      toast.success('Task decommissioned');
      setIsModalOpen(false);
    }
  });

  // Handlers
  const handleSave = (data) => {
    if (selectedTask) {
      updateMutation.mutate({ id: selectedTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTaskUpdate = (id, data) => {
    if (data.status) {
      patchStatusMutation.mutate({ id, status: data.status });
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = (task) => {
    const { id, createdAt, updatedAt, activityLogs, ...rest } = task;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
  };

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-pulse">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Task Management</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter leading-none mb-3">
             Operational <span className="text-slate-300">Hub</span>
          </h1>
          <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2">
             Orchestrating <span className="text-blue-600">{tasksData?.pagination?.total || 0}</span> global activities with AI-driven prioritization
          </p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <div className="bg-slate-50 p-2 rounded-3xl border border-slate-200 flex gap-1">
             <button 
               onClick={() => setView('kanban')}
               className={`h-14 px-8 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                 view === 'kanban' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <Layout size={18} /> Kanban
             </button>
             <button 
               onClick={() => setView('calendar')}
               className={`h-14 px-8 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                 view === 'calendar' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <Calendar size={18} /> Timeline
             </button>
             <button 
               onClick={() => setView('analytics')}
               className={`h-14 px-8 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                 view === 'analytics' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <BarChart3 size={18} /> Analytics
             </button>
          </div>
          
          <button 
            onClick={handleCreateClick}
            className="h-18 px-10 bg-[#0F172A] text-white rounded-3xl font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus size={20} />
            </div>
            CREATE TASK
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <TaskFilters filters={filters} setFilters={setFilters} />

      {/* MAIN CONTENT AREA */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-40 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-8" />
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Syncing with Task Engine...</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">Retrieving real-time operational data</p>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === 'kanban' && (
                <TaskKanban 
                  tasks={tasksData?.data} 
                  onTaskUpdate={handleTaskUpdate}
                  onTaskClick={handleTaskClick}
                />
              )}
              {view === 'calendar' && (
                <TaskCalendar 
                  tasks={tasksData?.data}
                  onTaskClick={handleTaskClick}
                />
              )}
              {view === 'analytics' && (
                <TaskAnalytics 
                  analytics={analyticsData}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* REFRESH INDICATOR */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-10 right-10 z-[60]">
            <div className="bg-[#0F172A] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
              <RefreshCcw size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Auto-Syncing</span>
            </div>
          </div>
        )}
      </div>

      {/* TASK MODAL */}
      <TaskModal 
        isOpen={isModalOpen}
        task={selectedTask}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={deleteMutation.mutate}
        onDuplicate={handleDuplicate}
        onArchive={(id) => handleTaskUpdate(id, { status: 'ARCHIVED' })}
      />
    </div>
  );
};

export default UnifiedTasks;

