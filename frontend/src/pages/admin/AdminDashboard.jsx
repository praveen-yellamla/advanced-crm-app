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
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
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
    toast.success('System telemetry synchronized');
  };

  const handleExport = () => {
    if (!statsData) return;
    
    const { cards, sources, funnel } = statsData;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ACRM EXECUTIVE REPORT\n";
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += "KPI SUMMARY\n";
    csvContent += `Metric,Value\n`;
    csvContent += `Total Leads,${cards.totalLeads}\n`;
    csvContent += `Active Agents,${cards.activeAgents}\n`;
    csvContent += `Conversion Rate,${cards.conversionRate}%\n\n`;
    
    csvContent += "LEAD SOURCES\n";
    csvContent += `Source,Count\n`;
    sources.forEach(s => {
      csvContent += `${s.source},${s._count}\n`;
    });
    
    csvContent += "\nSALES FUNNEL\n";
    csvContent += `Status,Count\n`;
    funnel.forEach(f => {
      csvContent += `${f.status},${f._count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ACRM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Executive report generated successfully');
  };

  if (isLoading) return <DashboardSkeleton />;

  const { cards, funnel, sources } = statsData || {};

  const funnelData = [
    { name: 'Initial', value: funnel?.find(l => l.status === 'NEW')?._count || 0 },
    { name: 'Contacted', value: funnel?.find(l => l.status === 'CONTACTED')?._count || 0 },
    { name: 'Interested', value: funnel?.find(l => l.status === 'INTERESTED')?._count || 0 },
    { name: 'Won', value: funnel?.find(l => l.status === 'WON')?._count || 0 },
    { name: 'Lost', value: funnel?.find(l => l.status === 'LOST')?._count || 0 },
  ];

  const webhookUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/webhooks/leads`;

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Business Overview & Performance Metrics</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={handleExport}
            className="h-12 px-6 bg-white border border-[#E2E8F0] rounded-2xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
           >
             <Download size={14} /> Export Report
           </button>
           <button 
            onClick={handleRefresh}
            className="h-12 px-6 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
           >
             <RefreshCw size={14} /> Refresh Data
           </button>
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

      {/* WEBHOOK SECTION */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Zap size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Lead Ingestion Webhook</h3>
                  <p className="text-[#64748B] font-medium text-xs mt-1 italic uppercase tracking-widest">Universal strategic ingestion architecture</p>
               </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-widest">
               <Globe size={14} /> Global Entry Active
            </div>
         </div>

         <div className="p-8 bg-slate-900 rounded-[32px] space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Webhook Endpoint URL</label>
               <div className="flex gap-4">
                  <div className="flex-1 h-14 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center px-6 overflow-hidden">
                     <code className="text-emerald-400 font-mono text-sm truncate">
                        {webhookUrl}
                     </code>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast.success('Webhook URL Copied!');
                    }}
                    className="h-14 px-8 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/40 hover:scale-[1.02] transition-all"
                  >
                     Copy URL
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integration Guide</p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                     Use this endpoint to push leads from external systems like <b className="text-white">Meta Ads, Zapier, or custom landing pages</b>. 
                     Every lead sent to this URL will be automatically assigned to an available agent using the Round-Robin engine.
                  </p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Payload (JSON)</p>
                  <pre className="text-[10px] text-emerald-500/80 font-mono bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
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
