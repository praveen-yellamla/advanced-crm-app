import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  BarChart2,
  Download,
  RefreshCw,
  History,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

import LiveCallMonitor from '../../components/admin/LiveCallMonitor';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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

  const handleRefresh = () => {
    queryClient.invalidateQueries(['adminDashboard']);
    queryClient.invalidateQueries(['inviteStats']);
    toast.success('Dashboard updated');
  };

  const handleExport = () => {
    if (!statsData) return;
    
    const { cards, sources, funnel } = statsData;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "BUSINESS PERFORMANCE REPORT\n";
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += "SUMMARY\n";
    csvContent += `Metric,Value\n`;
    csvContent += `Total Leads,${cards.totalLeads}\n`;
    csvContent += `Active Agents,${cards.activeAgents}\n`;
    csvContent += `Conversion Rate,${cards.conversionRate}%\n\n`;
    
    csvContent += "LEAD SOURCES\n";
    csvContent += `Source,Count\n`;
    sources.forEach(s => {
      csvContent += `${s.source},${s._count}\n`;
    });
    
    csvContent += "\nPIPELINE STAGES\n";
    csvContent += `Status,Count\n`;
    funnel.forEach(f => {
      csvContent += `${f.status},${f._count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Business_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report downloaded successfully');
  };

  if (isLoading) return <DashboardSkeleton />;

  const { cards, funnel, sources } = statsData || {};

  const funnelData = [
    { name: 'New', value: funnel?.find(l => l.status === 'NEW')?._count || 0 },
    { name: 'Contacted', value: funnel?.find(l => l.status === 'CONTACTED')?._count || 0 },
    { name: 'Interested', value: funnel?.find(l => l.status === 'INTERESTED')?._count || 0 },
    { name: 'Won', value: funnel?.find(l => l.status === 'WON')?._count || 0 },
    { name: 'Lost', value: funnel?.find(l => l.status === 'LOST')?._count || 0 },
  ];

  const webhookUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/webhooks/leads/${user?.organizationSlug || 'your-slug'}`;

  return (
    <div className="space-y-10 pb-16">
      {/* SUPPORT SESSION BANNER */}
      {user?.isImpersonated && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-600 text-white px-8 py-4 rounded-[32px] flex items-center justify-between shadow-2xl shadow-amber-600/30 border border-white/20"
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShieldAlert size={20} />
             </div>
             <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Active Support Session</p>
                <p className="text-xs font-bold opacity-80 mt-0.5">Operator: <span className="text-white underline">{user.operatorName}</span> is currently managing this workspace.</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Audited & Monitored</span>
          </div>
        </motion.div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Overview</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Real-time performance and sales metrics for your company.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleExport}
             className="h-12 px-6 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
           >
              <Download size={16} /> Export Report
           </button>
           <button 
             onClick={handleRefresh}
             className="h-12 px-6 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
           >
              <RefreshCw size={16} /> Update Data
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <KPICard title="Total Leads" value={cards?.totalLeads ?? 0} trend="+12%" icon={<Target />} color="blue" />
        <KPICard title="Active Staff" value={cards?.activeAgents ?? 0} trend="Live" icon={<Users />} color="indigo" />
        <KPICard title="Success Rate" value={`${(cards?.conversionRate || 0).toFixed(1)}%`} trend="+1.2%" icon={<TrendingUp />} color="emerald" />
        <KPICard title="Pending Invites" value={`${inviteStats?.pending || 0}`} trend={`of ${inviteStats?.total || 0}`} icon={<ShieldCheck />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FUNNEL CHART */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Sales Pipeline</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Progression by Stage</p>
            </div>
            <BarChart2 size={20} className="text-slate-300" />
          </div>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#2563EB' : '#F1F5F9'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* SOURCE DISTRIBUTION */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Lead Sources</h3>
              <PieIcon size={20} className="text-slate-300" />
           </div>
           
           <div className="space-y-6 flex-1">
              {sources?.map((source, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{source.source}</span>
                     <span className="text-xs font-bold text-[#0F172A]">{source._count} Leads</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                 <ShieldCheck className="text-blue-600" size={20} />
                 <div>
                    <p className="text-[10px] font-bold uppercase text-slate-900">System Status</p>
                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">All systems operational & synced</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <LiveCallMonitor />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* PLATFORM SECURITY AUDIT */}
         <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                     <ShieldAlert size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase italic">Platform Security Audit</h3>
                     <p className="text-slate-500 font-medium text-[11px] uppercase tracking-widest mt-1">Oversight of external support interactions</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Accessed By Platform</p>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {statsData?.security?.lastPlatformAccessBy?.[0] || 'S'}
                     </div>
                     <div>
                        <p className="text-sm font-black text-[#0F172A] uppercase italic">{statsData?.security?.lastPlatformAccessBy || 'No access recorded'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                           {statsData?.security?.lastPlatformAccessAt ? new Date(statsData.security.lastPlatformAccessAt).toLocaleString() : 'Never'}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Access Logic</p>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-[#0F172A] uppercase italic">
                        {statsData?.security?.accessApprovalRequired ? 'Manual Approval Required' : 'Open Access Policy'}
                     </span>
                     <div className={`w-3 h-3 rounded-full ${statsData?.security?.accessApprovalRequired ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                  </div>
               </div>
            </div>
         </div>

         {/* EMPTY STATE PLACEHOLDER OR OTHER METRIC */}
         <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
               <History size={40} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Activity Stream</h3>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-widest max-w-[280px]">Real-time operational events will populate this secure ledger.</p>
            </div>
            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
               Open Audit Ledger
            </button>
         </div>
      </div>

      {/* API INTEGRATION SECTION */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                  <Zap size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">API Integration</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">Connect your website or external tools to automatically capture leads.</p>
               </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl text-emerald-600 text-[11px] font-black uppercase tracking-widest border border-emerald-100">
               <Globe size={16} /> API Active
            </div>
         </div>

         <div className="p-8 bg-slate-900 rounded-[32px] space-y-6">
            <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Lead Capture URL</label>
               <div className="flex gap-4">
                  <div className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 overflow-hidden">
                     <code className="text-blue-400 font-mono text-sm truncate">
                        {webhookUrl}
                     </code>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast.success('URL Copied');
                    }}
                    className="h-16 px-8 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3"
                  >
                     Copy URL
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/10">
               <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">How to use</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Send lead data from your <b className="text-white">Website, Facebook Ads, or Zapier</b> to this URL. 
                     New leads will be automatically assigned to your team.
                  </p>
               </div>
               <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Data Format (JSON)</p>
                  <pre className="text-xs text-blue-400/80 font-mono bg-white/5 p-4 rounded-2xl border border-white/5">
                     {`{
  "name": "Customer Name",
  "phone": "9988776655",
  "email": "customer@email.com",
  "source": "WEBSITE"
}`}
                  </pre>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, trend, icon, color }) => {
  const iconColors = {
    blue: 'group-hover:bg-blue-600',
    indigo: 'group-hover:bg-indigo-600',
    emerald: 'group-hover:bg-emerald-600',
    amber: 'group-hover:bg-amber-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 group flex flex-col justify-between h-44"
    >
      <div className="flex items-center justify-between">
         <div className={`w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all duration-300 group-hover:text-white ${iconColors[color]}`}>
            {React.cloneElement(icon, { size: 18 })}
         </div>
         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{trend}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{title}</p>
        <h4 className="text-2xl font-extrabold text-[#0F172A] mt-1">{value}</h4>
      </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-16 bg-slate-100 rounded-2xl w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       {[1,2,3,4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-3 gap-8">
       <div className="col-span-2 h-[450px] bg-slate-100 rounded-3xl" />
       <div className="h-[450px] bg-slate-100 rounded-3xl" />
    </div>
  </div>
);

export default AdminDashboard;
