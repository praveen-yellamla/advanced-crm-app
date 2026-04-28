import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, 
  Clock, 
  Target, 
  DollarSign, 
  CheckCircle2, 
  MessageSquare, 
  Mail, 
  Zap,
  TrendingUp,
  ArrowUpRight,
  Headphones,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AgentDashboard = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['agentDashboard'],
    queryFn: async () => {
      const res = await api.get('/agent/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) return <DashboardSkeleton />;

  const { cards } = statsData || {};

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Personal Workbench</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Daily Performance Refresh & Active Pipeline</p>
        </div>
        <div className="flex gap-4">
           <button className="h-12 px-6 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3">
              <Zap size={16} /> Start Dialer Session
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Calls Today" value={cards?.callsToday ?? 0} icon={<Phone />} color="blue" />
        <KPICard title="Talk Time (Min)" value={Math.floor((cards?.talkTimeToday || 0) / 60)} icon={<Clock />} color="cyan" />
        <KPICard title="Callbacks Pending" value={cards?.pendingCallbacks ?? 0} icon={<Calendar />} color="amber" />
        <KPICard title="Revenue (PAID)" value={`$${(cards?.revenueGenerated || 0).toLocaleString()}`} icon={<DollarSign />} color="emerald" />
        <KPICard title="Conversions (MTD)" value={cards?.conversionsThisMonth ?? 0} icon={<Target />} color="violet" />
        <KPICard title="Tasks Due" value={cards?.tasksDueToday ?? 0} icon={<CheckCircle2 />} color="rose" />
        <KPICard title="Emails Sent" value={cards?.emailsSent ?? 0} icon={<Mail />} color="indigo" />
        <KPICard title="Unread Feedback" value={0} icon={<MessageSquare />} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between overflow-hidden relative">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Lead Conversion Velocity</h3>
              <TrendingUp size={24} className="text-slate-200" />
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'Mon', calls: 12, conv: 2 },
                   { name: 'Tue', calls: 35, conv: 5 },
                   { name: 'Wed', calls: 28, conv: 3 },
                   { name: 'Thu', calls: 42, conv: 7 },
                   { name: 'Fri', calls: 58, conv: 8 },
                 ]}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={12} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px'}}
                    />
                    <Area type="monotone" dataKey="calls" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorCalls)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-6">
           <div className="bg-[#0F172A] p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-xl font-bold text-white tracking-tight">Active Dialing Session</h3>
                 <p className="text-blue-300 text-xs font-medium uppercase tracking-widest leading-relaxed">Initialized Twin-Channel WebRTC Gateway for high-fidelity communication.</p>
                 <button className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-all flex items-center justify-center gap-3">
                    <Headphones size={18} /> Resume Pipeline
                 </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
           </div>

           <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm">
              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight mb-8">Performance Tip</h3>
              <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <Zap size={20} />
                 </div>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed italic">"Leads contacted within <span className="font-bold text-amber-600">5 minutes</span> of capture see a <span className="font-bold text-amber-600">391% increase</span> in conversion rates."</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    cyan: "text-cyan-600 bg-cyan-50 border-cyan-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    slate: "text-slate-400 bg-slate-50 border-slate-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[28px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-between h-[160px]"
    >
       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]} shadow-sm transition-transform group-hover:scale-110`}>
          {React.cloneElement(icon, { size: 20 })}
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 truncate mt-1 tracking-tighter">{value}</h4>
       </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
   <div className="space-y-10 animate-pulse">
      <div className="h-20 bg-slate-200 rounded-3xl w-full" />
      <div className="grid grid-cols-4 gap-4">
         {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-slate-200 rounded-3xl" />)}
      </div>
      <div className="h-[400px] bg-slate-200 rounded-[40px]" />
   </div>
);

export default AgentDashboard;
