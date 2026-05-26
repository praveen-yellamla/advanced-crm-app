import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  User, 
  Tag, 
  AlertCircle,
  FileText,
  Clock,
  Repeat,
  Paperclip,
  CheckCircle2,
  Trash2,
  Copy,
  Archive,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

const TaskModal = ({ task, isOpen, onClose, onSave, onDelete, onDuplicate, onArchive }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'Normal',
    dueDate: '',
    assignedToId: '',
    leadId: '',
    tags: [],
    notes: '',
    reminderTime: '',
    isRecurring: false,
    recurringType: 'DAILY'
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await api.get('/core/leads');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        reminderTime: task.reminderTime ? new Date(task.reminderTime).toISOString().split('T')[0] : '',
        assignedToId: task.assignedToId || '',
        leadId: task.leadId || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'Normal',
        dueDate: '',
        assignedToId: '',
        leadId: '',
        tags: [],
        notes: '',
        reminderTime: '',
        isRecurring: false,
        recurringType: 'DAILY'
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required');
    onSave(formData);
  };

  const agentOptions = agents?.map(a => ({ value: a.id, label: a.name })) || [];
  const leadOptions = leads?.map(l => ({ value: l.id, label: l.customerName })) || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">
                {task ? 'Edit Task Details' : 'Create New Task'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Enterprise Task Management System
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-10 py-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* TITLE & DESCRIPTION */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FileText size={12} /> Task Title
                  </label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter task title..."
                    className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MessageSquare size={12} /> Task Description
                  </label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide detailed instructions for this task..."
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all font-medium text-slate-900 text-sm resize-none"
                  />
                </div>
              </div>

              {/* PRIORITY & STATUS */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <AlertCircle size={12} /> Priority Level
                </label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-700 appearance-none cursor-pointer"
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Pipeline Status
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="WAITING">Waiting</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* DUE DATE & REMINDER */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CalendarIcon size={12} /> Due Date
                </label>
                <input 
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-medium text-slate-900 text-sm cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={12} /> Reminder Schedule
                </label>
                <input 
                  type="date"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-medium text-slate-900 text-sm cursor-pointer"
                />
              </div>

              {/* ASSIGNMENT */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12} /> Assign Agent
                </label>
                <Select 
                  options={agentOptions}
                  value={agentOptions.find(o => o.value === formData.assignedToId)}
                  onChange={(opt) => setFormData({...formData, assignedToId: opt.value})}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Tag size={12} /> Link to Lead
                </label>
                <Select 
                  options={leadOptions}
                  value={leadOptions.find(o => o.value === formData.leadId)}
                  onChange={(opt) => setFormData({...formData, leadId: opt.value})}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* RECURRING */}
              <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                    <Repeat size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Recurring Task</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auto-generate this task periodically</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.isRecurring ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.isRecurring ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          </form>

          {/* FOOTER */}
          <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              {task && (
                <>
                  <button type="button" onClick={() => onDelete(task.id)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm flex items-center justify-center" title="Delete Task">
                    <Trash2 size={16} />
                  </button>
                  <button type="button" onClick={() => onDuplicate(task)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center" title="Duplicate Task">
                    <Copy size={16} />
                  </button>
                  <button type="button" onClick={() => onArchive(task.id)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm flex items-center justify-center" title="Archive Task">
                    <Archive size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onClose} className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={handleSubmit} className="h-10 px-6 bg-slate-900 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-slate-800 transition-colors">
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
