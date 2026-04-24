import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Users, 
  PhoneCall, 
  Star, 
  TrendingUp, 
  Filter, 
  ShieldAlert, 
  Award,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Mic2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { name: 'Team Productivity', value: '92%', change: '+4.5%', icon: BarChart, color: 'indigo' },
    { name: 'Managed Agents', value: '12', change: '+1', icon: Users, color: 'emerald' },
    { name: 'Average CSAT', value: '4.8', change: '+0.2', icon: Star, color: 'amber' },
    { name: 'Evaluations', value: '450', change: '+124', icon: PhoneCall, color: 'blue' },
  ];

  const leaders = [
    { name: 'Emma Watson', score: 98, deals: 12, trend: 'up' },
    { name: 'James Rod', score: 94, deals: 10, trend: 'up' },
    { name: 'Sarah Connor', score: 91, deals: 8, trend: 'down' },
  ];

  const alerts = [
    { id: 1, agent: 'John Doe', reason: 'Abrupt closure', score: '65', time: '20m ago' },
    { id: 2, agent: 'Alice Key', reason: 'High background noise', score: '72', time: '1h ago' },
  ];

  if (isLoading) return <ManagerSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Manager Command</h2>
          <p className="text-slate-500 font-medium mt-2">Team performance and quality governance.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-sm">Daily</button>
            <button className="px-4 py-2 text-slate-500 text-xs font-bold">Weekly</button>
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={26} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.name}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <span className="text-[10px] font-bold text-emerald-500 mb-1">{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TEAM PERFORMANCE CHART */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Agent Efficiency</h3>
                    <p className="text-sm text-slate-400 font-medium">Conversion vs Target Completion</p>
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /> Success</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200" /> Target</div>
                 </div>
              </div>
              <div className="h-[300px] flex items-end justify-between px-4 gap-6">
                 {[85, 92, 78, 95, 88, 72].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                       <div className="w-full relative h-full flex flex-col justify-end">
                          <div className="absolute inset-0 bg-slate-50/50 rounded-t-xl" />
                          <motion.div 
                             initial={{ height: 0 }}
                             animate={{ height: `${v}%` }}
                             transition={{ duration: 1, delay: i * 0.1 }}
                             className="w-full bg-blue-600 rounded-t-xl z-10 shadow-lg shadow-blue-500/10 group-hover:bg-blue-500 transition-colors"
                          />
                       </div>
                       <span className="text-[10px] font-black text-slate-400">Agent {i+1}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* ACTIVE EVALUATIONS / QA LIST */}
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Quality Evaluator</h3>
                 <ShieldAlert className="text-rose-500" size={20} />
              </div>
              <div className="space-y-4">
                 {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-500">
                             <Mic2 size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900">{alert.agent}</p>
                             <p className="text-[10px] font-medium text-slate-400">{alert.reason}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-black ${parseInt(alert.score) < 70 ? 'text-rose-500' : 'text-amber-500'}`}>{alert.score}%</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase">{alert.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* TEAM LEADERBOARD */}
        <div className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full" />
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                 <div className="flex items-center gap-3 mb-8">
                    <Award className="text-amber-400" size={28} />
                    <h3 className="text-xl font-black text-white tracking-tight">Team Excellence</h3>
                 </div>
                 <div className="space-y-8">
                    {leaders.map((leader, i) => (
                       <div key={leader.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=leader-${i}`} alt="" className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{leader.name}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{leader.deals} Won Deals</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-white">{leader.score}</p>
                             <p className="text-[9px] font-black text-emerald-500 uppercase">Top 1%</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <button className="mt-12 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
                 View Full Team Rankings
              </button>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

const ManagerSkeleton = () => (
   <div className="space-y-8 animate-pulse p-4">
      <div className="h-20 bg-slate-100 rounded-[32px] w-full" />
      <div className="grid grid-cols-4 gap-6">
         {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[32px]" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
         <div className="col-span-2 h-[500px] bg-slate-100 rounded-[40px]" />
         <div className="h-[500px] bg-slate-100 rounded-[40px]" />
      </div>
   </div>
);

export default ManagerDashboard;
