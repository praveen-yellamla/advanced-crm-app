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
import { useNavigate } from 'react-router-dom';
import { exportToPDF } from '../../utils/exportUtils';

import LiveCallMonitor from '../../components/admin/LiveCallMonitor';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
    
    const headers = ['Metric/Status/Source', 'Value/Count'];
    const data = [
      ['--- SUMMARY ---', ''],
      ['Total Leads', cards.totalLeads],
      ['Active Agents', cards.activeAgents],
      ['Conversion Rate (%)', cards.conversionRate],
      ['--- LEAD SOURCES ---', '']
    ];
    
    sources.forEach(s => {
      data.push([s.source, s._count]);
    });
    
    data.push(['--- PIPELINE STAGES ---', '']);
    funnel.forEach(f => {
      data.push([f.status, f._count]);
    });
    
    exportToPDF('Business Performance Report', headers, data, 'business_report');
    toast.success('Report downloaded successfully');
  };

  if (isLoading) return <DashboardSkeleton />;

  const { cards, funnel, sources, leaderboard, recentActivity, revenueTrend, callVolume } = statsData || {};

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
           <p className="crm-body mt-1 mt-1">Real-time performance and sales metrics for your company.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="Total Staff" value={cards?.activeAgents ?? 0} trend="Active" icon={<Users />} color="blue" />
        <KPICard title="Total Teams" value={cards?.totalTeams ?? 0} trend="Live" icon={<Users />} color="indigo" />
        <KPICard title="Leads Today" value={cards?.todayLeads ?? 0} trend="New" icon={<Target />} color="emerald" />
        <KPICard title="Calls Today" value={cards?.callsToday ?? 0} trend="Volume" icon={<Activity />} color="amber" />
        <KPICard title="Conversion Rate" value={`${(cards?.conversionRate || 0).toFixed(1)}%`} trend="Success" icon={<TrendingUp />} color="emerald" />
        <KPICard title="Revenue (Month)" value={`₹${(cards?.revenueMTD || 0).toLocaleString('en-IN')}`} trend="Earned" icon={<DollarSign />} color="blue" />
        <KPICard title="Pending Invites" value={cards?.invitedPending ?? 0} trend="Waiting" icon={<ShieldCheck />} color="amber" />
        <KPICard title="Open Tasks" value={cards?.openTasks ?? 0} trend="To-do" icon={<Activity />} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FUNNEL CHART */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Sales Pipeline</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Progression by Stage</p>
            </div>
            <BarChart2 size={20} className="text-slate-300" />
          </div>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#2563EB' : '#F1F5F9'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* REVENUE TREND CHART */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Revenue Trend</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Income Tracking</p>
            </div>
            <DollarSign size={20} className="text-slate-300" />
          </div>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}} formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* CALL VOLUME CHART */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Call Volume</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Calls Made</p>
            </div>
            <Activity size={20} className="text-slate-300" />
          </div>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolume || []} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
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
                     <motion.div initial={{ width: 0 }} animate={{ width: `${(source?._count / (cards?.totalLeads || 1)) * 100}%` }} className="h-full bg-blue-600 rounded-full" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <LiveCallMonitor />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* AGENT LEADERBOARD */}
         <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                     <Users size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase italic">Top Agents</h3>
                     <p className="text-slate-500 font-medium text-[11px] uppercase tracking-widest mt-1">Highest Call Volumes</p>
                  </div>
               </div>
            </div>
            <div className="space-y-4">
              {leaderboard?.map((agent, i) => (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {agent.profileImage ? <img src={agent.profileImage} alt="" className="w-full h-full rounded-full object-cover" /> : agent.name.charAt(0)}
                     </div>
                     <span className="text-sm font-bold text-[#0F172A] uppercase">{agent.name}</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{agent._count?.calls || 0} Calls</span>
                </div>
              ))}
            </div>
         </div>

         {/* RECENT ACTIVITY FEED */}
         <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl flex flex-col space-y-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <History size={24} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Recent Activity</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Latest Actions Across Platform</p>
               </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] custom-scrollbar pr-4">
               {recentActivity?.map((log) => (
                 <div key={log.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-1">
                       <Activity size={14} />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-white leading-relaxed">
                          <span className="text-blue-400 uppercase mr-1">{log.user?.name}</span>
                          {log.action}
                       </p>
                       <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                 </div>
               ))}
               {(!recentActivity || recentActivity.length === 0) && (
                 <p className="text-center text-slate-500 text-xs py-8">No recent activity.</p>
               )}
            </div>
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
                  <p className="crm-body mt-1 mt-1">Connect your website or external tools to automatically capture leads.</p>
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
