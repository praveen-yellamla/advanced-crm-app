import React from 'react';
import { BarChart, Users, PhoneCall, Star, TrendingUp, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const ManagerDashboard = () => {
  const stats = [
    { name: 'Team Productivity', value: '92%', icon: BarChart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Managed Agents', value: '12', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Calls QA Evaluated', value: '450', icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'CSAT Rating', value: '4.8', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid lg:grid-cols-2 gap-8 items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-slate-500 font-medium mt-2">Team-centric metrics for quality assurance and performance scaling.</p>
        </div>
        <div className="flex lg:justify-end gap-3">
           <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-sm">Daily</button>
              <button className="px-4 py-2 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors">Monthly</button>
           </div>
           <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
              <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[64px] transition-transform duration-500 group-hover:scale-110" />
            
            <div className="relative z-10">
              <div className={`${stat.bg} w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color} mb-6 shadow-sm`}>
                <stat.icon size={26} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
              <p className="text-4xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] border-dashed">
            <TrendingUp size={48} className="text-slate-200 mb-4" />
            <span className="text-slate-400 font-black uppercase tracking-widest text-sm text-center">Team Efficiency Analytics <br/> Coming in Next Phase</span>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] border-dashed">
            <PhoneCall size={48} className="text-slate-200 mb-4" />
            <span className="text-slate-400 font-black uppercase tracking-widest text-sm text-center">QA Monitoring Logs <br/> Integration Pending</span>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
