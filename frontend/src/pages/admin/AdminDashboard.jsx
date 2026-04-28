import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Activity,
  ShieldCheck,
  Globe,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const AdminDashboard = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    }
  });

  const { data: inviteStats } = useQuery({
    queryKey: ['inviteStats'],
    queryFn: async () => {
      const res = await api.get('/admin/invite-stats');
      return res.data.data;
    }
  });

  if (isLoading) return <DashboardSkeleton />;

  const { cards, funnel, sources } = statsData || {};

  const funnelData = [
    { name: 'Initial', value: funnel?.find(l => l.status === 'NEW')?._count || 0 },
    { name: 'Contacted', value: funnel?.find(l => l.status === 'CONTACTED')?._count || 0 },
    { name: 'Interested', value: funnel?.find(l => l.status === 'INTERESTED')?._count || 0 },
    { name: 'Won', value: funnel?.find(l => l.status === 'WON')?._count || 0 },
    { name: 'Lost', value: funnel?.find(l => l.status === 'LOST')?._count || 0 },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Business Overview & Performance Metrics</p>
        </div>
        <div className="flex gap-4">
           <button className="h-12 px-6 bg-white border border-[#E2E8F0] rounded-2xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">Export Report</button>
           <button className="h-12 px-6 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">Refresh Data</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="Total Leads" value={cards?.totalLeads ?? 0} trend="+12.4%" icon={<Target />} />
        <KPICard title="Active Agents" value={cards?.activeAgents ?? 0} trend="Secure" icon={<Users />} />
        <KPICard title="Conv. Rate" value={`${(cards?.conversionRate || 0).toFixed(1)}%`} trend="+1.2%" icon={<Activity />} />
        <KPICard title="Invite Success" value={`${inviteStats?.conversionRate || 0}%`} trend={`${inviteStats?.accepted || 0}/${inviteStats?.total || 0}`} icon={<ShieldCheck />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* FUNNEL CHART */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Sales Funnel</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Lead Progression Analysis</p>
            </div>
            <BarChart2 size={24} className="text-slate-200" />
          </div>
          <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase'}} 
                    dy={12}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px'}}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#2563EB' : '#F1F5F9'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* SOURCE DISTRIBUTION */}
        <div className="bg-white p-10 rounded-[32px] border border-[#E2E8F0] shadow-sm relative flex flex-col justify-between">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Lead Sources</h3>
              <PieIcon size={24} className="text-slate-200" />
           </div>
           
           <div className="space-y-8 flex-1">
              {sources?.map((source, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{source.source}</span>
                     <span className="text-sm font-black text-[#0F172A] italic">{source._count} Entities</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(source?._count / (cards?.totalLeads || 1)) * 100}%` }}
                        className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                     />
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-12 pt-10 border-t border-slate-50">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                 <ShieldCheck className="text-blue-600" />
                 <div>
                    <p className="text-[10px] font-black uppercase text-[#0F172A]">Infrastructure Hub</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Tier-IV Data Refresh Verified</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, trend, icon }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white px-6 py-5 rounded-[24px] border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 group overflow-hidden min-w-[180px] h-[180px] flex flex-col justify-between"
  >
    <div className="flex items-center justify-between">
       <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:scale-110">
          {React.cloneElement(icon, { size: 18 })}
       </div>
       <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-lg">{trend}</span>
    </div>
    <div>
      <p className="text-xs font-semibold tracking-normal text-slate-500 truncate">{title}</p>
      <h4 className="text-3xl font-bold text-slate-900 truncate mt-1">{value}</h4>
    </div>
  </motion.div>
);

const DashboardSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    <div className="h-20 bg-slate-200 rounded-3xl w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
       {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-slate-200 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-3 gap-10">
       <div className="col-span-2 h-[500px] bg-slate-200 rounded-3xl" />
       <div className="h-[500px] bg-slate-200 rounded-3xl" />
    </div>
  </div>
);

export default AdminDashboard;
