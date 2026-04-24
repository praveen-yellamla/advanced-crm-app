import React from 'react';
import { Target, Phone, MessageSquare, Clock, Zap, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

const AgentDashboard = () => {
  const stats = [
    { name: 'Active Leads', value: '18', icon: Target, shadow: 'shadow-blue-500/10' },
    { name: 'Daily Dials', value: '24', icon: Phone, shadow: 'shadow-emerald-500/10' },
    { name: 'Follow-ups', value: '05', icon: Clock, shadow: 'shadow-amber-500/10' },
    { name: 'New Feedback', value: '02', icon: MessageSquare, shadow: 'shadow-indigo-500/10' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Calling Session</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Agent Workspace</h2>
          <p className="text-slate-500 font-medium mt-2">Personal workflow and daily performance targets.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[20px] font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 group">
           <Headphones size={20} className="group-hover:rotate-12 transition-transform" />
           Start Calling Suite
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl ${stat.shadow} transition-all duration-300 cursor-default group`}
          >
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-500">
                  <stat.icon size={22} />
               </div>
               <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">{stat.name}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-center items-center h-[400px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Zap size={48} className="text-slate-100 mb-4 group-hover:text-blue-500 transition-colors duration-500" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Real-time Activity Stream Coming Soon</p>
        </div>
        <div className="bg-[#0F172A] p-10 rounded-[40px] shadow-2xl flex flex-col justify-center items-center h-[400px] text-center">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 border border-blue-600/20">
               <Target className="text-blue-500" size={32} />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Goal: 50 Dials</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Complete your daily dial target to unlock performance bonuses.</p>
            <div className="mt-8 w-full">
               <div className="h-2 w-full bg-white/5 rounded-full mb-3">
                  <div className="h-full w-[48%] bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">24 / 50 Completed</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
