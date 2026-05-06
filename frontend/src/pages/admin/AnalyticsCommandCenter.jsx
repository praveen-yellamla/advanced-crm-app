import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Zap, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Download,
  Filter,
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsCommandCenter = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics'); // Need to implement this endpoint
      return res.data.data;
    }
  });

  const revenueData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];

  const agentLeaderboard = [
    { name: 'Sarah Chen', conversion: '12.5%', deals: 42, revenue: '$42,500', avatar: 'SC' },
    { name: 'Michael Ross', conversion: '10.2%', deals: 38, revenue: '$38,200', avatar: 'MR' },
    { name: 'Emma Wilson', conversion: '9.8%', deals: 35, revenue: '$32,100', avatar: 'EW' },
    { name: 'David Miller', conversion: '8.4%', deals: 31, revenue: '$29,400', avatar: 'DM' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* ELITE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-200">Live Telemetry</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                 Synchronized 2m ago
              </span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter">Analytics Command</h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-[24px] border border-slate-200/60 shadow-xl shadow-slate-100">
           <button className="h-12 px-6 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-100 transition-all">
              <Calendar size={16} /> Last 30 Days
           </button>
           <button className="h-12 px-6 bg-[#0F172A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl shadow-slate-200 hover:-translate-y-1 transition-all">
              <Download size={16} /> Export Intelligence
           </button>
        </div>
      </div>

      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { label: 'Platform Revenue', value: '$284.5k', trend: '+14.2%', icon: DollarSign, color: 'text-emerald-500' },
           { label: 'Active Leads', value: '12,482', trend: '+8.4%', icon: Users, color: 'text-blue-500' },
           { label: 'Avg. Conversion', value: '9.2%', trend: '+1.2%', icon: TrendingUp, color: 'text-violet-500' },
           { label: 'AI Efficiency', value: '94%', trend: 'Elite', icon: Zap, color: 'text-amber-500' },
         ].map((kpi, i) => (
           <motion.div 
             key={i}
             whileHover={{ y: -5 }}
             className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group"
           >
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                    <div className={`p-4 bg-slate-50 rounded-2xl ${kpi.color} group-hover:bg-[#0F172A] group-hover:text-white transition-all`}>
                       <kpi.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{kpi.trend}</span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                 <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter">{kpi.value}</h2>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-50 transition-all duration-700" />
           </motion.div>
         ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* MAIN REVENUE CHART */}
         <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Revenue Trajectory</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Net platform revenue across all agents</p>
               </div>
               <div className="flex gap-2">
                  {['Revenue', 'Leads'].map(t => (
                    <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === 'Revenue' ? 'bg-[#0F172A] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {t}
                    </button>
                  ))}
               </div>
            </div>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                     <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px'}}
                        itemStyle={{fontWeight: 900, color: '#0F172A'}}
                     />
                     <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* AI INSIGHTS PANEL */}
         <div className="bg-[#0F172A] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-white/10 rounded-2xl text-blue-400">
                     <Sparkles size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black tracking-tighter uppercase">AI Strategy</h3>
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Neural Insights Pulse</p>
                  </div>
               </div>

               <div className="space-y-6 flex-1">
                  {[
                    { title: 'Conversion Surge', text: 'Agent Sarah Chen is seeing a 24% uplift in WON leads from Meta sources. Recommendation: Increase budget for Meta lead gen.', tag: 'STRATEGY' },
                    { title: 'Churn Risk Detected', text: '5 Leads in "Contacted" stage haven\'t been touched in 48h. Auto-tasking agents for immediate re-engagement.', tag: 'URGENT' },
                  ].map((insight, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/card">
                       <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{insight.tag}</span>
                          <ArrowUpRight size={14} className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
                       </div>
                       <h4 className="text-sm font-bold mb-2">{insight.title}</h4>
                       <p className="text-xs text-slate-400 leading-relaxed">{insight.text}</p>
                    </div>
                  ))}
               </div>

               <button className="mt-10 w-full py-5 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-125 transition-all shadow-xl shadow-blue-900/40">
                  Deep Neural Audit
               </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
         </div>
      </div>

      {/* LOWER GRID: LEADERBOARD & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* PERFORMANCE LEADERBOARD */}
         <div className="bg-white p-10 rounded-[48px] border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Elite Performance</h3>
               <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <TrendingUp size={18} />
               </div>
            </div>

            <div className="space-y-4">
               {agentLeaderboard.map((agent, i) => (
                 <div key={i} className="flex items-center justify-between p-6 rounded-3xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-6">
                       <span className="text-sm font-black text-slate-300 w-4">0{i+1}</span>
                       <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {agent.avatar}
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-[#0F172A]">{agent.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{agent.deals} Closures</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-12 text-right">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                          <p className="text-sm font-black text-blue-600">{agent.conversion}</p>
                       </div>
                       <div className="w-24">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                          <p className="text-sm font-black text-[#0F172A]">{agent.revenue}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* LIVE ACTIVITY FEED */}
         <div className="bg-white p-10 rounded-[48px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[550px]">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Intelligence Stream</h3>
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Activity size={14} className="text-emerald-500" /> Realtime
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
               {[
                 { user: 'Sarah Chen', action: 'converted lead', target: 'John Miller', time: '2m ago', icon: TrendingUp, color: 'text-emerald-500' },
                 { user: 'System', action: 'ingested lead', target: 'Meta Ads #248', time: '5m ago', icon: Zap, color: 'text-amber-500' },
                 { user: 'Michael Ross', action: 'initiated call with', target: 'Alice Cooper', time: '8m ago', icon: Activity, color: 'text-blue-500' },
                 { user: 'Emma Wilson', action: 'sent invoice to', target: 'Tech Corp', time: '12m ago', icon: DollarSign, color: 'text-violet-500' },
                 { user: 'Sarah Chen', action: 'updated stage of', target: 'Bob Vance', time: '15m ago', icon: ChevronRight, color: 'text-blue-500' },
               ].map((item, i) => (
                 <div key={i} className="flex gap-6 items-start relative">
                    <div className={`p-4 rounded-2xl bg-slate-50 ${item.color} shadow-sm`}>
                       <item.icon size={18} />
                    </div>
                    <div className="flex-1 border-b border-slate-50 pb-6">
                       <p className="text-xs font-bold text-slate-500">
                          <b className="text-[#0F172A]">{item.user}</b> {item.action} <b className="text-[#0F172A]">{item.target}</b>
                       </p>
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">{item.time}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsCommandCenter;
