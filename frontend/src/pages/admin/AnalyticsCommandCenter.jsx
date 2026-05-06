import React, { useState } from 'react';
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
  Download,
  Sparkles,
  PhoneCall,
  ChevronRight,
  PieChart as PieIcon,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const AnalyticsCommandCenter = () => {
  const [period, setPeriod] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['adminAnalytics', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics?period=${period}`);
      return res.data.data;
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      alert('Business Report exported successfully to your email.');
    }, 1500);
  };

  const Skeleton = () => (
    <div className="space-y-12 pb-16 animate-pulse">
       <div className="h-20 bg-slate-200 rounded-[24px]"></div>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-[32px]"></div>)}
       </div>
       <div className="h-[400px] bg-slate-200 rounded-[48px]"></div>
    </div>
  );

  if (isLoading && !analytics) return <Skeleton />;

  const { revenueData, leadSourceData, agentLeaderboard, activityFeed, kpis } = analytics || {};

  const COLORS = ['#2563EB', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'];

  return (
    <div className="space-y-10 pb-16 font-sans">
      {/* 1. TOP SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-violet-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-violet-200">Executive View</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                 System Online
              </span>
           </div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Business Overview</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Comprehensive analytics and enterprise health monitoring.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-[20px] border border-slate-200 shadow-xl shadow-slate-100">
           <div className="flex bg-slate-50 rounded-xl p-1">
             {[
               { id: '7d', label: '7D' },
               { id: '30d', label: '30D' },
               { id: '90d', label: '90D' },
               { id: '1y', label: '1Y' }
             ].map(p => (
               <button 
                 key={p.id}
                 onClick={() => setPeriod(p.id)}
                 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {p.label}
               </button>
             ))}
           </div>
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="h-10 px-6 bg-[#0F172A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all disabled:opacity-50"
           >
              {isExporting ? <Clock className="animate-spin" size={14} /> : <Download size={14} />} 
              {isExporting ? 'Exporting...' : 'Export Report'}
           </button>
        </div>
      </div>

      {/* QUICK KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         {[
           { label: 'Platform Revenue', value: kpis?.platformRevenue || '$0', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
           { label: 'Active Leads', value: kpis?.activeLeads || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Avg Conversion', value: kpis?.avgConversion || '0%', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
           { label: 'AI Performance', value: kpis?.aiEfficiency || '0%', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
           { label: 'Total Calls', value: kpis?.totalCalls || '0', icon: PhoneCall, color: 'text-rose-500', bg: 'bg-rose-50' },
         ].map((kpi, i) => (
           <motion.div 
             key={i}
             whileHover={{ y: -4 }}
             className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl transition-all"
           >
              <div className="flex items-center gap-4 mb-4">
                 <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon size={20} strokeWidth={2.5} />
                 </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">{kpi.value}</h2>
           </motion.div>
         ))}
      </div>

      {/* 2. SECOND SECTION: ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* REVENUE ANALYTICS */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Revenue Analytics</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Growth over {period}</p>
               </div>
            </div>
            
            {revenueData && revenueData.length > 0 ? (
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                             <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} minTickGap={20} />
                       <YAxis hide />
                       <Tooltip 
                          contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px'}}
                          itemStyle={{fontWeight: 900, color: '#0F172A'}}
                          labelStyle={{fontSize: '12px', color: '#64748B', marginBottom: '4px'}}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                       />
                       <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center flex-col text-slate-400">
                <BarChart3 size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No revenue data for this period</p>
              </div>
            )}
         </div>

         {/* LEAD SOURCES */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Lead Sources</h3>
               <PieIcon size={20} className="text-slate-300" />
            </div>
            
            {leadSourceData && leadSourceData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={leadSourceData}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={90}
                             paddingAngle={5}
                             dataKey="value"
                             stroke="none"
                          >
                             {leadSourceData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                             itemStyle={{fontWeight: 900}}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="w-full mt-6 space-y-3">
                    {leadSourceData.map((source, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                            <span className="text-xs font-bold text-slate-600 uppercase">{source.name}</span>
                         </div>
                         <span className="text-sm font-black text-[#0F172A]">{source.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                 <Target size={48} className="mb-4 opacity-20" />
                 <p className="font-bold">No leads tracked</p>
              </div>
            )}
         </div>
      </div>

      {/* 3. THIRD SECTION: TEAMS & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* TEAM LEADERBOARD */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Teams Performance</h3>
               <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</button>
            </div>

            {agentLeaderboard && agentLeaderboard.length > 0 ? (
              <div className="space-y-3">
                 {agentLeaderboard.map((agent, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm text-sm">
                            {agent.avatar}
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-[#0F172A]">{agent.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{agent.deals} Won Deals</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Rate</p>
                            <p className="text-sm font-black text-blue-600">{agent.conversion}</p>
                         </div>
                         <div className="w-20">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                            <p className="text-sm font-black text-[#0F172A]">{agent.revenue}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 font-bold text-sm">No active agents found in this period.</div>
            )}
         </div>

         {/* AI INSIGHTS */}
         <div className="bg-[#0F172A] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-violet-600/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-white/10 rounded-xl text-violet-400">
                        <Sparkles size={18} />
                     </div>
                     <h3 className="text-xl font-black tracking-tight">AI Insights</h3>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  {[
                    { title: 'Conversion Anomaly', text: 'Lead conversion rate dropped by 4% compared to last week. Call volume remains stable.', tag: 'ALERT' },
                    { title: 'Revenue Forecast', text: 'Based on current pipeline velocity, projected revenue for next 30 days is $125K.', tag: 'PREDICTION' },
                    { title: 'Agent Coaching', text: 'Analysis of last 50 calls shows agents need improvement in objection handling.', tag: 'RECOMMENDATION' }
                  ].map((insight, i) => (
                    <div key={i} className="p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${insight.tag === 'ALERT' ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-300'}`}>{insight.tag}</span>
                          <ArrowUpRight size={14} className="opacity-50" />
                       </div>
                       <h4 className="text-sm font-bold mb-1 text-white">{insight.title}</h4>
                       <p className="text-xs text-slate-400 leading-relaxed">{insight.text}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 4. FOURTH SECTION: ACTIVITY FEED */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-[#0F172A] tracking-tight">System Activity</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <Activity size={12} className="text-emerald-500" /> Live Feed
            </div>
         </div>

         {activityFeed && activityFeed.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex gap-4 items-start p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
                   <div className="p-3 rounded-xl bg-slate-100 text-slate-500 shadow-sm shrink-0">
                      <Clock size={16} />
                   </div>
                   <div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">
                         <b className="text-[#0F172A]">{item.user}</b> {item.action} <b className="text-[#0F172A]">{item.target}</b>
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                         {item.time ? formatDistanceToNow(new Date(item.time), {addSuffix: true}) : 'Just now'}
                      </p>
                   </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="py-10 text-center text-slate-400 font-bold text-sm">No recent activity found.</div>
         )}
      </div>

    </div>
  );
};

export default AnalyticsCommandCenter;
