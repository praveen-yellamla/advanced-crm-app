import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Clock, Phone, 
  Mail, Award, Zap, Activity, PieChart, Calendar, ChevronRight,
  Sparkles, Globe, ShieldCheck, ArrowUpRight, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Sector
} from 'recharts';

const AgentAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['agentAnalytics'],
    queryFn: async () => {
      const res = await api.get('/agent/analytics'); 
      return res.data.data;
    }
  });

  if (isLoading) return <AnalyticsSkeleton />;

  const { cards } = stats || {};

  return (
    <div className="space-y-12 pb-20">
      {/* ANALYTICS HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Performance Analytics</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Real-time Performance Metrics & Funnel Analysis</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <ShieldCheck className="text-emerald-500" size={20} />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Accuracy Rate: {stats?.accuracyRate || '0%'}</span>
           </div>
           <button className="h-16 px-8 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-3">
              <Globe size={18} className="text-blue-400" /> Leaderboard
           </button>
        </div>
      </div>

      {/* ACHIEVEMENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard title="Call Volume" value={cards?.callsToday || 0} unit="Calls/Day" icon={Phone} color="blue" trend="+12.4%" />
        <MetricCard title="Engagement Time" value={`${Math.floor((cards?.talkTimeToday || 0) / 60)}m`} unit="Talk Time" icon={Clock} color="cyan" trend="+5.1%" />
        <MetricCard title="Total Conversions" value={cards?.conversionsThisMonth || 0} unit="Won Leads" icon={Target} color="violet" trend="+8.9%" />
        <MetricCard title="Revenue Generated" value={`₹${(cards?.revenueGenerated || 0).toLocaleString()}`} unit="Total Value" icon={Award} color="emerald" trend="+14.2%" />
      </div>

      {/* PERFORMANCE DEEP DIVE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         
         {/* MAIN CHART UNIT */}
         <div className="xl:col-span-8 bg-white p-12 rounded-[64px] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Conversion Trends</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Dimensional Performance Index</p>
               </div>
               <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  <button className="px-6 h-10 rounded-xl bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest shadow-sm">Daily</button>
                  <button className="px-6 h-10 rounded-xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900">Weekly</button>
               </div>
            </div>

            <div className="h-[400px] -ml-6 relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.conversionTrends || []}>
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
                       contentStyle={{borderRadius: '32px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.1)', padding: '24px'}}
                     />
                     <Area type="monotone" dataKey="calls" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorCalls)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
               <TrendingUp size={240} />
            </div>
         </div>

         {/* SIDEBAR INTELLIGENCE */}
         <div className="xl:col-span-4 space-y-8">
            <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <Sparkles className="text-blue-400" size={20} />
                     <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">AI Prediction</h3>
                  </div>
                  <div className="space-y-4">
                     <p className="text-2xl font-black text-white italic leading-tight">{stats?.aiPrediction?.probability || 0}% Conversion Probability</p>
                     <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Projected performance based on current session sentiment and talk-ratio.</p>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">View Strategy Detail</span>
                     <ArrowUpRight size={16} className="text-white/20" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all duration-1000" />
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">Call Disposition Mix</h3>
               <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <RePieChart>
                        <Pie
                           data={stats?.callDispositionMix || []}
                           cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value"
                        >
                           {stats?.callDispositionMix?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#F43F5E'][index % 4]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </RePieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <MixLabel label="Won" color="emerald" value={`${stats?.callDispositionMix?.[0]?.value || 0}%`} />
                  <MixLabel label="Interested" color="blue" value={`${stats?.callDispositionMix?.[1]?.value || 0}%`} />
                  <MixLabel label="Callback" color="amber" value={`${stats?.callDispositionMix?.[2]?.value || 0}%`} />
                  <MixLabel label="Loss" color="rose" value={`${stats?.callDispositionMix?.[3]?.value || 0}%`} />
               </div>
            </div>
         </div>
      </div>

      {/* EFFICIENCY METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <EfficiencyCard title="Response Latency" value={stats?.efficiencyMetrics?.responseLatency || '0m'} icon={Activity} color="rose" desc="Avg. time between lead entry and first outbound attempt." />
         <EfficiencyCard title="Interaction Depth" value={stats?.efficiencyMetrics?.interactionDepth || '0'} icon={MessageSquare} color="violet" desc="Avg. number of cross-channel touchpoints per conversion." />
         <EfficiencyCard title="Workload Index" value={stats?.efficiencyMetrics?.workloadIndex || '0%'} icon={Zap} color="amber" desc="Current utilization based on active leads and pending tasks." />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon: Icon, color, trend }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    cyan: "text-cyan-600 bg-cyan-50 border-cyan-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 group h-[280px] flex flex-col justify-between"
    >
       <div className="flex items-start justify-between">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border ${colors[color]} shadow-sm transition-transform duration-700 group-hover:rotate-12`}>
             <Icon size={28} />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
             <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Vs Last Term</span>
          </div>
       </div>
       <div>
          <h4 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums italic">{value}</h4>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mt-1">{title}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{unit}</p>
       </div>
    </motion.div>
  );
};

const MixLabel = ({ label, color, value }) => {
  const bgColors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };
  return (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
     <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${bgColors[color]} shadow-sm`} />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-[10px] font-black text-slate-900">{value}</span>
  </div>
)};

const EfficiencyCard = ({ title, value, icon: Icon, color, desc }) => {
  const colors = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
  <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all duration-500">
     <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center border transition-transform group-hover:scale-110`}>
           <Icon size={22} />
        </div>
        <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">{title}</h4>
     </div>
     <div className="space-y-3">
        <p className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums italic">{value}</p>
        <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest italic">{desc}</p>
     </div>
  </div>
)};

const AnalyticsSkeleton = () => (
   <div className="space-y-12 animate-pulse pb-20">
      <div className="h-24 bg-slate-100 rounded-[32px] w-full" />
      <div className="grid grid-cols-4 gap-8">
         {[1,2,3,4].map(i => <div key={i} className="h-[280px] bg-slate-100 rounded-[48px]" />)}
      </div>
      <div className="grid grid-cols-12 gap-10">
         <div className="col-span-8 h-[550px] bg-slate-100 rounded-[64px]" />
         <div className="col-span-4 h-[550px] bg-slate-100 rounded-[48px]" />
      </div>
   </div>
);

export default AgentAnalytics;
