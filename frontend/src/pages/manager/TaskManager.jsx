import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  ClipboardCheck, Search, Filter, Calendar, Users, RefreshCw, Layers, AlignJustify, User, Clock, AlertTriangle, ArrowRight, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const TaskManager = () => {
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar
  const [selectedAgentId, setSelectedAgentId] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetAgentId, setTargetAgentId] = useState('');

  // Create Task Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    priority: 'Normal',
    dueDate: ''
  });

  const [agentSearch, setAgentSearch] = useState('');

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

  // 4. Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const res = await api.post('/manager/tasks', taskData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      setShowCreateModal(false);
      setNewTaskForm({ title: '', description: '', assignedToId: '', priority: 'Normal', dueDate: '' });
      refetch();
    }
  });

  const handleCreateTask = () => {
    if (!newTaskForm.title || !newTaskForm.assignedToId) {
      toast.error('Title and Assignee are required');
      return;
    }
    createTaskMutation.mutate(newTaskForm);
  };

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
  // Display Agents Logic (Scalability for 1000+ agents)
  const selectedAgent = agents?.find(a => a.id.toString() === selectedAgentId);
  const searchResults = agents?.filter(a => {
    if (a.id.toString() === selectedAgentId) return false;
    return a.name.toLowerCase().includes(agentSearch.toLowerCase());
  }) || [];
  
  const displayAgents = selectedAgent ? [selectedAgent, ...searchResults] : searchResults;
  const slicedAgents = displayAgents.slice(0, 10);
  const remainingCount = Math.max(0, searchResults.length - (slicedAgents.length - (selectedAgent ? 1 : 0)));

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

        {/* CREATE TASK BUTTON */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* FILTER CONTROL (UPGRADED AVATAR CHIPS) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedAgentId('')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
            selectedAgentId === '' 
              ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Users size={12} className={selectedAgentId === '' ? 'text-white' : 'text-slate-500'} />
          </div>
          <span className="text-xs font-bold">All Team</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

        {/* SEARCH INPUT CHIP */}
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search advisors..." 
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            className="pl-8 pr-4 py-2 w-48 rounded-full border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white shadow-sm transition-all focus:w-64"
          />
        </div>

        {slicedAgents.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAgentId(selectedAgentId === a.id.toString() ? '' : a.id.toString())}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
              selectedAgentId === a.id.toString()
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {a.avatar_url ? (
              <img src={a.avatar_url} alt={a.name} className="w-6 h-6 rounded-full object-cover border border-white/20" />
            ) : (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                selectedAgentId === a.id.toString() ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {a.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-bold">{a.name}</span>
          </button>
        ))}

        {remainingCount > 0 && (
          <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-2 uppercase tracking-wider">
            + {remainingCount} MORE
          </span>
        )}
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

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Create New Task</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Assign a new action item to an advisor.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Follow up with Enterprise Lead"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea 
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Additional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign To <span className="text-rose-500">*</span></label>
                  <select
                    value={newTaskForm.assignedToId}
                    onChange={(e) => setNewTaskForm({...newTaskForm, assignedToId: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select advisor...</option>
                    {agents?.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                <input 
                  type="date"
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({...newTaskForm, dueDate: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTask}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md disabled:opacity-50"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
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
          <div key={task.id} className="crm-card group relative">
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
