import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Clock, Target, DollarSign, CheckCircle2, 
  MessageSquare, Mail, Zap, TrendingUp, ArrowUpRight, 
  Headphones, Calendar, Activity, Award, Bell,
  ArrowRight, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['agentDashboard'],
    queryFn: async () => {
      const res = await api.get('/agent/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) return <DashboardSkeleton />;

  const { cards, recentActivity, callbacks } = statsData || {};

  return (
    <div className="space-y-10 pb-20">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Command Center</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Real-time Performance Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
              <span className="text-sm font-black text-blue-600 italic">#14 Total Performance</span>
           </div>
           <button 
             onClick={() => navigate('/agent/calling')}
             className="h-16 px-10 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
           >
              <Headphones size={20} className="text-blue-400 group-hover:rotate-12 transition-transform" /> 
              Enter Workspace
           </button>
        </div>
      </div>

      {/* CORE KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Direct Dialing" value={cards?.callsToday ?? 0} subtitle="Calls Dispatched Today" icon={<Phone />} color="blue" trend="+12%" />
        <KPICard title="Talk Velocity" value={`${Math.floor((cards?.talkTimeToday || 0) / 60)}m`} subtitle="Total Communication Time" icon={<Clock />} color="cyan" trend="+8%" />
        <KPICard title="Protocol Uplink" value={cards?.conversionsThisMonth ?? 0} subtitle="Successful Conversions" icon={<Target />} color="violet" trend="+4%" />
        <KPICard title="Fiscal Impact" value={`₹${(cards?.revenueGenerated || 0).toLocaleString()}`} subtitle="Revenue Contribution" icon={<DollarSign />} color="emerald" trend="+15%" />
      </div>

      {/* MAIN INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PERFORMANCE CHART */}
        <div className="xl:col-span-8 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Conversion Velocity</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weekly Achievement Trajectory</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-all">7 Days</button>
                 <button className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black uppercase text-blue-600">30 Days</button>
              </div>
           </div>
           <div className="h-[360px] -ml-6">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'Mon', calls: 12, conv: 2 },
                   { name: 'Tue', calls: 35, conv: 5 },
                   { name: 'Wed', calls: 28, conv: 4 },
                   { name: 'Thu', calls: 42, conv: 8 },
                   { name: 'Fri', calls: 58, conv: 12 },
                   { name: 'Sat', calls: 20, conv: 3 },
                   { name: 'Sun', calls: 15, conv: 2 },
                 ]}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dx={-10} />
                    <Tooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', padding: '20px'}}
                    />
                    <Area type="monotone" dataKey="calls" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorCalls)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* AI PRODUCTIVITY INSIGHTS */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                    <Sparkles className="text-blue-400 animate-pulse" size={20} />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">AI Pulse</h3>
                 </div>
                 <p className="text-slate-400 text-xs font-bold leading-relaxed italic">
                   "You are most efficient between <span className="text-white font-black">10:00 AM — 1:00 PM</span>. Your objection handling is 15% more successful during these hours."
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sentiment</p>
                       <p className="text-lg font-black text-emerald-400">Positive</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                       <p className="text-lg font-black text-blue-400">92%</p>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all duration-1000" />
           </div>

           <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Pending Callbacks</h3>
              <div className="space-y-4">
                 {callbacks?.length > 0 ? callbacks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                             <Calendar size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold">{c.time}</p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
                    </div>
                 )) : (
                    <div className="py-6 text-center text-slate-300 italic text-xs font-bold">No urgent callbacks scheduled.</div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES & TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Activity Log</h3>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">Full History <ArrowRight size={12}/></button>
            </div>
            <div className="space-y-6">
               {(recentActivity || []).length > 0 ? recentActivity.map((activity, i) => (
                 <div key={i} className="flex gap-6 group">
                    <div className="relative flex flex-col items-center">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {activity.type === 'CALL' ? <Phone size={18} /> : activity.type === 'EMAIL' ? <Mail size={18} /> : <Zap size={18} />}
                       </div>
                       {i !== (recentActivity.length - 1) && <div className="w-0.5 h-full bg-slate-50 my-2" />}
                    </div>
                    <div className="pb-8">
                       <p className="text-sm font-black text-slate-900 italic uppercase">{activity.title}</p>
                       <p className="text-xs text-slate-400 font-bold mt-1">{activity.description}</p>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 block">{activity.time}</span>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">No recent operations logged.</div>
               )}
            </div>
         </div>

         <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Today's Agenda</h3>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">Planner <ArrowRight size={12}/></button>
            </div>
            <div className="space-y-4">
               {[
                 { title: 'Contract Review: Global Logistics', time: '14:30', priority: 'High', color: 'rose' },
                 { title: 'Follow-up with Praveen Yadav', time: '16:00', priority: 'Medium', color: 'blue' },
                 { title: 'Weekly Pipeline Sync', time: '17:30', priority: 'Low', color: 'emerald' },
               ].map((task, i) => (
                 <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-slate-200/40">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-2xl bg-${task.color}-50 text-${task.color}-600 flex items-center justify-center border border-${task.color}-100`}>
                          <CheckCircle2 size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{task.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{task.time} • {task.priority} Priority</p>
                       </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                       <ChevronRight size={18} />
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, color, trend }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    cyan: "text-cyan-600 bg-cyan-50 border-cyan-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col justify-between h-[220px]"
    >
       <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color]} shadow-sm transition-transform duration-700 group-hover:rotate-6`}>
             {React.cloneElement(icon, { size: 24 })}
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg">
             {trend}
          </div>
       </div>
       <div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums mb-1">{value}</h4>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{subtitle}</p>
       </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
   <div className="space-y-10 animate-pulse pb-20">
      <div className="h-24 bg-slate-100 rounded-[32px] w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[1,2,3,4].map(i => <div key={i} className="h-[220px] bg-slate-100 rounded-[40px]" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         <div className="xl:col-span-8 h-[500px] bg-slate-100 rounded-[48px]" />
         <div className="xl:col-span-4 h-[500px] bg-slate-100 rounded-[48px]" />
      </div>
   </div>
);

export default AgentDashboard;
