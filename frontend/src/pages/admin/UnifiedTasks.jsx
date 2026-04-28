import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  ClipboardCheck, 
  Map, 
  Filter, 
  Search, 
  Plus, 
  Clock, 
  User, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

const UnifiedTasks = () => {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['globalTasks'],
    queryFn: async () => {
      const res = await api.get('/core/tasks');
      return res.data.data;
    }
  });

  const columns = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Strategic Tasks</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage cross-relational conversion activities with Kanban orchestration</p>
        </div>
        <div className="flex gap-4">
           <button className="h-14 px-8 bg-white border border-[#E2E8F0] text-slate-400 rounded-2xl font-bold text-xs flex items-center gap-3">
              <Calendar size={18} /> Calendar View
           </button>
           <button className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl font-bold text-xs shadow-xl hover:brightness-125 transition-all flex items-center gap-3">
              <Plus size={20} /> Create Global Task
           </button>
        </div>
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" placeholder="Search tasks, descriptions, or linked lead identities..." 
              className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl outline-none focus:border-blue-600 transition-all font-semibold"
            />
         </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {columns.map(col => (
           <div key={col} className="space-y-8 min-h-[600px]">
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${col === 'Pending' ? 'bg-amber-400' : col === 'In Progress' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-[0.2em]">{col}</h3>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                    {tasks?.filter(t => t.status === col).length || 0}
                 </span>
              </div>

              <div className="space-y-6">
                 {isLoading ? (
                    <div className="p-10 text-center animate-pulse text-slate-300 font-bold uppercase text-[10px]">Loading...lumn...</div>
                 ) : tasks?.filter(t => t.status === col).map(task => (
                   <motion.div 
                     layoutId={task.id}
                     key={task.id}
                     className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <MoreVertical size={16} className="text-slate-300 pointer" />
                      </div>
                      
                      <div className="space-y-6">
                         <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                              task.priority === 'Urgent' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                            }`}>{task.priority}</span>
                         </div>
                         
                         <h4 className="text-lg font-bold text-[#0F172A] leading-snug tracking-tight">{task.title}</h4>
                         
                         {task.lead && (
                           <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                              <User size={14} className="text-blue-600" />
                              <span className="text-xs font-bold text-slate-900">{task.lead.customerName}</span>
                           </div>
                         )}

                         <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm overflow-hidden">
                               {task.user.name.charAt(0)}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))}
                 <button className="w-full h-18 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:border-blue-600 hover:text-blue-600 transition-all">
                    <Plus size={16} /> New Task
                 </button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default UnifiedTasks;
