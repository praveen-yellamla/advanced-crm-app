import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  ClipboardCheck, Search, Filter, Calendar, Users, RefreshCw, Layers, AlignJustify, User, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const TaskManager = () => {
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar
  const [selectedAgentId, setSelectedAgentId] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetAgentId, setTargetAgentId] = useState('');

  // 1. Fetch team tasks
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['managerTasks', selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/manager/tasks?agentId=${selectedAgentId}`);
      return res.data.data;
    }
  });

  // 2. Fetch Agents (for dropdown)
  const { data: agents } = useQuery({
    queryKey: ['managerTasksAgentsList'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 3. Mutation: Reassign Task
  const reassignTaskMutation = useMutation({
    mutationFn: async ({ taskId, assignedToId }) => {
      const res = await api.patch(`/manager/tasks/${taskId}/reassign`, { assignedToId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Task reassigned successfully');
      setShowReassignModal(false);
      setTargetAgentId('');
      refetch();
    }
  });

  const handleOpenReassign = (task) => {
    setSelectedTask(task);
    setShowReassignModal(true);
  };

  const handleExecuteReassign = () => {
    if (!targetAgentId) {
      toast.error('Please select an agent');
      return;
    }
    reassignTaskMutation.mutate({
      taskId: selectedTask.id,
      assignedToId: parseInt(targetAgentId)
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-16 bg-slate-100 rounded-2xl w-full" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-96 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Filter Tasks by status for Kanban Board
  const pendingTasks = tasks?.filter(t => t.status === 'PENDING') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACTIVE') || [];
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED' || t.status === 'DONE') || [];

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="crm-h1">Task & Activity board</h1>
          <p className="crm-body mt-1 mt-1">Audit active task cards, filter by assigned advisor, or perform hot reassignments.</p>
        </div>

        {/* VIEW SELECTOR */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={14} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlignJustify size={14} /> List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar size={14} /> Calendar
          </button>
        </div>
      </div>

      {/* FILTER CONTROL */}
      <div className="crm-card">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Users size={16} /> Filter by Assigned Agent:
        </div>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="w-48 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="">All Team Members</option>
          {agents?.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <KanbanColumn title="Pending Backlog" tasks={pendingTasks} onReassign={handleOpenReassign} badgeColor="bg-slate-100 text-slate-700" />
          <KanbanColumn title="In Progress" tasks={inProgressTasks} onReassign={handleOpenReassign} badgeColor="bg-indigo-50 text-indigo-700" />
          <KanbanColumn title="Completed Done" tasks={completedTasks} onReassign={handleOpenReassign} badgeColor="bg-emerald-50 text-emerald-700" />
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="crm-card">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Task Card</th>
                  <th className="p-4">Associated Lead</th>
                  <th className="p-4">Assigned Advisor</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks?.map(task => (
                  <tr key={task.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-extrabold text-slate-800">
                      <div>{task.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{task.description}</div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600">{task.lead?.customerName || 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-600">{task.assignedTo?.name}</td>
                    <td className="p-4 font-bold text-slate-500">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleOpenReassign(task)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg border border-slate-100 text-[10px] font-black uppercase transition-all"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="crm-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-800">Weekly Task Calendar</h3>
            <Calendar size={18} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-7 gap-4 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
            ))}
            {/* Seed mock days with mapped tasks */}
            {[18, 19, 20, 21, 22, 23, 24].map((date, idx) => {
              const activeCount = tasks?.filter(t => {
                const dueDay = new Date(t.dueDate).getDay();
                return dueDay === (idx + 1) % 7;
              }).length || 0;

              return (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[120px] flex flex-col justify-between">
                  <span className="text-xs font-black text-slate-400">{date}</span>
                  {activeCount > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 animate-pulse">
                      {activeCount} Tasks
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Reassign Task Owner</h3>
            <p className="text-xs text-slate-500 mt-1">Route this task card to a different outbound agent.</p>
            
            <select
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              className="w-full mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select advisor...</option>
              {agents?.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteReassign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Reassign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanColumn = ({ title, tasks, onReassign, badgeColor }) => {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 min-h-[500px] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold text-slate-800">{title}</h4>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeColor}`}>{tasks.length}</span>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1">
        {tasks.map(task => (
          <div key={task.id} className="crm-card">
            <div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
              }`}>
                {task.priority} Priority
              </span>
              <h5 className="font-extrabold text-slate-800 text-xs mt-2">{task.title}</h5>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-snug">{task.description}</p>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <User size={12} /> {task.assignedTo?.name}
              </span>
              <button
                onClick={() => onReassign(task)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
