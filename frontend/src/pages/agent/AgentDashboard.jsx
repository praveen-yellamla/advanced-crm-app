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
  Calendar,
  Activity,
  Award
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
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agent Dashboard</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Track your daily performance and manage your sales pipeline.</p>
        </div>
        <div className="flex gap-3">
           <button className="h-12 px-6 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
              <Phone size={18} /> Start Dialing
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Calls Today" value={cards?.callsToday ?? 0} icon={<Phone />} color="blue" />
        <KPICard title="Talk Time" value={`${Math.floor((cards?.talkTimeToday || 0) / 60)} min`} icon={<Clock />} color="indigo" />
        <KPICard title="Follow-ups" value={cards?.pendingCallbacks ?? 0} icon={<Calendar />} color="amber" />
        <KPICard title="Revenue" value={`₹${(cards?.revenueGenerated || 0).toLocaleString()}`} icon={<DollarSign />} color="emerald" />
        <KPICard title="Conversions" value={cards?.conversionsThisMonth ?? 0} icon={<Target />} color="violet" />
        <KPICard title="Tasks Due" value={cards?.tasksDueToday ?? 0} icon={<CheckCircle2 />} color="rose" />
        <KPICard title="Emails Sent" value={cards?.emailsSent ?? 0} icon={<Mail />} color="sky" />
        <KPICard title="Success Rate" value={`${(cards?.conversionRate || 0).toFixed(1)}%`} icon={<Award />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CONVERSION VELOCITY */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Call Performance Velocity</h3>
              <Activity size={20} className="text-slate-300" />
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'Mon', calls: 12 },
                   { name: 'Tue', calls: 35 },
                   { name: 'Wed', calls: 28 },
                   { name: 'Thu', calls: 42 },
                   { name: 'Fri', calls: 58 },
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
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px'}}
                    />
                    <Area type="monotone" dataKey="calls" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-2xl shadow-xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-lg font-bold text-white tracking-tight">Ready for Calls?</h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">Our dialer system is optimized for high-fidelity audio and reliable customer connections.</p>
                 <button className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Headphones size={18} /> Open Dialer
                 </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
           </div>

           <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Productivity Tip</h3>
              <div className="p-5 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <Zap size={20} />
                 </div>
                 <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"Contacting leads within <span className="font-bold text-amber-600">5 minutes</span> increases conversion rates by up to <span className="font-bold text-amber-600">391%</span>."</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-500/5",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-500/5",
    amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/5",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/5",
    violet: "text-violet-600 bg-violet-50 border-violet-100 shadow-violet-500/5",
    rose: "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-500/5",
    sky: "text-sky-600 bg-sky-50 border-sky-100 shadow-sky-500/5",
    orange: "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-500/5"
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-[160px]"
    >
       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]} shadow-sm transition-transform group-hover:scale-110`}>
          {React.cloneElement(icon, { size: 20 })}
       </div>
       <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 truncate mt-1 tracking-tight">{value}</h4>
       </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
   <div className="space-y-8 animate-pulse p-4 md:p-0">
      <div className="h-20 bg-slate-100 rounded-2xl w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="h-[400px] bg-slate-100 rounded-2xl" />
   </div>
);

export default AgentDashboard;
