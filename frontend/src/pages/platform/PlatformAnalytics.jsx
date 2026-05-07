import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  Users,
  Target,
  Zap,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const PlatformAnalytics = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const res = await api.get('/platform/stats');
      return res.data.data;
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Aggregating Revenue Data...</p>
    </div>
  );

  const { metrics, subscriptions } = statsData || {};

  const revenueTimeline = [
    { month: 'Jan', revenue: 450000 },
    { month: 'Feb', revenue: 520000 },
    { month: 'Mar', revenue: 480000 },
    { month: 'Apr', revenue: 610000 },
    { month: 'May', revenue: 750000 },
    { month: 'Jun', revenue: 890000 },
    { month: 'Jul', revenue: 950000 },
  ];

  const subMix = subscriptions?.map(s => ({
    name: s.subscriptionTier,
    value: s._count,
    color: s.subscriptionTier === 'ENTERPRISE' ? '#0F172A' : s.subscriptionTier === 'PROFESSIONAL' ? '#7C3AED' : '#2563EB'
  })) || [];

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Intelligence</span>
              <div className="h-px w-8 bg-slate-200" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Revenue Reporting</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Revenue</h1>
           <p className="text-sm font-medium text-slate-500 mt-4 max-w-2xl">Forecasting, churn analysis, and subscription growth metrics.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="h-16 px-8 bg-white border border-slate-200 rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-4 hover:border-emerald-600 transition-all">
              <Calendar size={20} /> Last 12 Months
           </button>
           <button className="h-16 px-10 bg-[#0F172A] text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4 shadow-2xl shadow-slate-900/40 hover:scale-105 transition-all">
              <Download size={20} /> Generate Report
           </button>
        </div>
      </div>

      {/* REVENUE KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <KPICard label="Annual Recurring (ARR)" value={`₹${(metrics?.arr || 0).toLocaleString()}`} trend="+15%" icon={DollarSign} color="emerald" />
         <KPICard label="Monthly Recurring (MRR)" value={`₹${(metrics?.mrr || 0).toLocaleString()}`} trend="+12%" icon={TrendingUp} color="blue" />
         <KPICard label="Net Expansion" value="₹1.2M" trend="+₹120k" icon={Zap} color="amber" />
         <KPICard label="Active Subscriptions" value={metrics?.totalOrganizations || 0} trend="+8" icon={Briefcase} color="violet" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         {/* GROWTH CHART */}
         <div className="xl:col-span-2 bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Growth Projection</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Recurring Revenue Velocity</p>
               </div>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-black uppercase">On Track</span>
               </div>
            </div>
            <div className="h-[450px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTimeline}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94A3B8'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94A3B8'}} tickFormatter={(v) => `₹${v/1000}k`} />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 800, padding: '20px'}}
                        formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                     />
                     <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* SUB MIX */}
         <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Revenue Mix</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Subscription Tier Contribution</p>
            </div>
            
            <div className="h-[350px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={subMix}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={130}
                        paddingAngle={10}
                        dataKey="value"
                     >
                        {subMix.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 800}}
                     />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-[#0F172A] italic">Revenue</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Distribution</span>
               </div>
            </div>

            <div className="space-y-4">
               {subMix.map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{s.name}</span>
                    </div>
                    <span className="text-sm font-black text-[#0F172A] italic">{s.value} Accounts</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* TOP PERFORMING COMPANIES */}
      <div className="bg-[#0F172A] rounded-[64px] p-12 text-white">
         <div className="flex items-center justify-between mb-12">
            <div>
               <h3 className="text-3xl font-black uppercase italic leading-none">Top Revenue Companies</h3>
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-3">Expansion and Loyalty Metrics</p>
            </div>
            <button className="text-[11px] font-black text-blue-400 uppercase tracking-widest hover:underline">Full Leaderboard</button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Realistically fetch from topOrgs */}
            <TopOrgCard name="Global Tech Inc" revenue="₹12.5M" growth="+24%" logo={<Briefcase />} />
            <TopOrgCard name="Stellar Labs" revenue="₹8.2M" growth="+18%" logo={<Zap />} />
            <TopOrgCard name="Core Dynamics" revenue="₹6.4M" growth="+32%" logo={<Target />} />
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, trend, icon: Icon, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600'
  };

  return (
    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-12 group hover:shadow-2xl transition-all duration-500">
       <div className="flex items-center justify-between">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${colors[color]}`}>
             <Icon size={28} />
          </div>
          <div className="text-right">
             <div className="flex items-center justify-end gap-1 text-emerald-500 font-bold text-xs italic">
                <ArrowUpRight size={14} /> {trend}
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last 30D</p>
          </div>
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-1">{label}</p>
          <p className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">{value}</p>
       </div>
    </div>
  );
};

const TopOrgCard = ({ name, revenue, growth, logo }) => (
  <div className="p-10 bg-white/5 border border-white/10 rounded-[48px] hover:bg-white/10 transition-all cursor-pointer group">
     <div className="flex items-center justify-between mb-8">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:rotate-12 transition-transform">
           {logo}
        </div>
        <div className="text-right">
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{growth} Growth</span>
        </div>
     </div>
     <div className="space-y-2">
        <h4 className="text-xl font-black uppercase italic tracking-tight">{name}</h4>
        <p className="text-3xl font-black text-blue-400 italic tracking-tighter">{revenue}</p>
     </div>
     <button className="mt-8 w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
        Detailed Ledger <ChevronRight size={14} />
     </button>
  </div>
);

export default PlatformAnalytics;
