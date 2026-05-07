import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity,
  ShieldCheck,
  PieChart as PieIcon,
  BarChart2,
  Clock,
  ArrowUpRight,
  Headphones,
  FileText,
  RefreshCcw,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: async () => {
      const res = await api.get('/manager/dashboard');
      return res.data.data;
    }
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Data updated');
  };

  if (isLoading) return <DashboardSkeleton />;

  const { cards, funnel, sources } = statsData || {};

  const funnelData = [
    { name: 'New', value: funnel?.find(l => l.status === 'NEW')?._count || 0 },
    { name: 'Contacted', value: funnel?.find(l => l.status === 'CONTACTED')?._count || 0 },
    { name: 'Interested', value: funnel?.find(l => l.status === 'INTERESTED')?._count || 0 },
    { name: 'Won', value: funnel?.find(l => l.status === 'WON')?._count || 0 },
  ];

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Performance</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Oversee departmental operations and sales conversions.</p>
        </div>
        <div className="flex gap-3">
           <button className="h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <FileText size={18} /> Export
           </button>
           <button 
             onClick={handleRefresh}
             className="h-12 px-5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
           >
              <RefreshCcw size={18} /> Refresh
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Leads" value={cards?.totalLeads ?? 0} icon={<Target />} color="blue" />
        <KPICard title="New Today" value={cards?.todayLeads ?? 0} icon={<Zap />} color="amber" />
        <KPICard title="Active Staff" value={cards?.activeAgents ?? 0} icon={<Users />} color="indigo" />
        <KPICard title="Revenue" value={`₹${((cards?.revenueMTD || 0) / 1000).toFixed(1)}k`} icon={<DollarSign />} color="emerald" />
        <KPICard title="Success Rate" value={`${(cards?.conversionRate || 0).toFixed(1)}%`} icon={<TrendingUp />} color="violet" />
        <KPICard title="Calls" value={cards?.callsToday ?? 0} icon={<Headphones />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PIPELINE CHART */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales Pipeline</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead progression by status</p>
            </div>
            <BarChart3 size={20} className="text-slate-300" />
          </div>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barSize={50}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={12} />
                   <YAxis hide />
                   <Tooltip 
                     cursor={{fill: '#F8FAFC'}}
                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px'}}
                   />
                   <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                     {funnelData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === (funnelData.length - 1) ? '#2563EB' : '#F1F5F9'} />
                     ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* SOURCES */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Lead Sources</h3>
              <PieIcon size={20} className="text-slate-300" />
           </div>
           
           <div className="space-y-6 flex-1">
              {sources?.map((source, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{source.source}</span>
                     <span className="text-xs font-bold text-slate-900">{source._count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(source?._count / (cards?.totalLeads || 1)) * 100}%` }}
                        className="h-full bg-blue-600 rounded-full"
                     />
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase text-slate-900">Quality Assurance</p>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">Monitoring active customer interactions</p>
                 </div>
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
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-[150px]"
    >
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]} shadow-sm transition-all duration-300 group-hover:scale-110`}>
          {React.cloneElement(icon, { size: 18 })}
       </div>
       <div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
         <h4 className="text-xl font-extrabold text-slate-900 truncate mt-1 tracking-tight">{value}</h4>
       </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4 md:p-0">
    <div className="h-20 bg-slate-100 rounded-2xl w-full" />
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
       {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-3 gap-8">
       <div className="col-span-2 h-[450px] bg-slate-100 rounded-2xl" />
       <div className="h-[450px] bg-slate-100 rounded-2xl" />
    </div>
  </div>
);

export default ManagerDashboard;
