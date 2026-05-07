import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Activity, 
  Cpu, 
  Monitor, 
  HardDrive, 
  Zap, 
  Server, 
  Database, 
  Cloud, 
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  History,
  ShieldCheck,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const PlatformUsage = () => {
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['platformHealth'],
    queryFn: async () => {
      const res = await api.get('/platform/health');
      return res.data.data;
    },
    refetchInterval: 10000 // Every 10s for real-time feel
  });

  const { data: statsData } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const res = await api.get('/platform/stats');
      return res.data.data;
    }
  });

  if (healthLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pinging System Nodes...</p>
    </div>
  );

  const mockTimeline = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.floor(Math.random() * 30) + 10,
    ram: Math.floor(Math.random() * 20) + 40,
    requests: Math.floor(Math.random() * 500) + 100
  }));

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Ops</span>
              <div className="h-px w-8 bg-slate-200" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Status</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">System Status</h1>
           <p className="text-sm font-medium text-slate-500 mt-4 max-w-2xl">Real-time telemetry and resource monitoring across the global platform cluster.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="h-16 px-8 bg-white border border-slate-200 rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-4 hover:border-blue-600 transition-all">
              <Download size={20} /> Export Logs
           </button>
           <div className="h-16 w-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
              <ShieldCheck size={24} />
           </div>
        </div>
      </div>

      {/* CORE RESOURCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <ResourceCard label="CPU Load" value={healthData?.infrastructure?.cpu} trend="Optimal" icon={Cpu} color="blue" />
         <ResourceCard label="Memory Usage" value={healthData?.infrastructure?.memory} trend="Healthy" icon={Monitor} color="emerald" />
         <ResourceCard label="Storage" value={healthData?.infrastructure?.storage} trend="Expanding" icon={HardDrive} color="violet" />
      </div>

      {/* TRAFFIC ANALYSIS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         <div className="xl:col-span-2 bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Traffic Analysis</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last 24 Hours Resource Consumption</p>
               </div>
               <div className="flex items-center gap-6">
                  <LegendItem color="#3B82F6" label="CPU" />
                  <LegendItem color="#10B981" label="RAM" />
               </div>
            </div>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTimeline}>
                     <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 800}}
                     />
                     <Area type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCpu)" />
                     <Area type="monotone" dataKey="ram" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRam)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#0F172A] p-12 rounded-[64px] shadow-2xl text-white flex flex-col justify-between">
            <div className="space-y-2">
               <h3 className="text-2xl font-black uppercase italic">Node Clusters</h3>
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Live Service Distribution</p>
            </div>
            
            <div className="space-y-8">
               {healthData?.services?.map((s, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-all">
                          {s.name.includes('DB') ? <Database size={20} /> : s.name.includes('AI') ? <Zap size={20} /> : <Server size={20} />}
                       </div>
                       <div>
                          <p className="text-[13px] font-black italic uppercase tracking-tight">{s.name}</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{s.provider || 'Core Engine'}</p>
                       </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'ONLINE' || s.status === 'ACTIVE' || s.status === 'READY' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                       {s.status}
                    </div>
                 </div>
               ))}
            </div>

            <button className="w-full h-18 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4">
               <Activity size={18} /> Global Service Map
            </button>
         </div>
      </div>

      {/* SYSTEM ACTIVITY LOG */}
      <div className="bg-white rounded-[64px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">System Audit</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Platform Forensics</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="text" placeholder="Filter Logs..." className="h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 transition-all text-xs font-bold" />
               </div>
            </div>
         </div>
         <div className="p-8 space-y-4">
            {/* Realistically fetch from auditLogs */}
            <AuditRow time="14:32:10" module="SECURITY" action="LOGIN_ATTEMPT" user="sys.admin" status="SUCCESS" />
            <AuditRow time="14:28:45" module="BILLING" action="PLAN_UPGRADE" user="user.882" status="COMPLETED" />
            <AuditRow time="14:15:22" module="TENANT" action="PROVISIONING" user="system" status="SUCCESS" />
            <AuditRow time="14:02:11" module="AI_ENGINE" action="TOKEN_RESET" user="system" status="SUCCESS" />
         </div>
      </div>
    </div>
  );
};

const ResourceCard = ({ label, value, trend, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50'
  };

  return (
    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10 group hover:shadow-2xl transition-all duration-500">
       <div className="flex items-center justify-between">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${colors[color]}`}>
             <Icon size={28} />
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{trend}</span>
             <div className="flex items-center justify-end gap-1 text-emerald-500 font-bold text-xs mt-1">
                <ArrowUpRight size={14} /> 1.2%
             </div>
          </div>
       </div>
       <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{label}</p>
          <p className="text-4xl font-black text-[#0F172A] tracking-tighter italic">{value}</p>
       </div>
       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]'}`} style={{ width: '40%' }} />
       </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const AuditRow = ({ time, module, action, user, status }) => (
  <div className="flex items-center justify-between p-5 bg-slate-50/30 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all group">
     <div className="flex items-center gap-8">
        <span className="text-[11px] font-black text-slate-400 tabular-nums">{time}</span>
        <span className="w-24 text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{module}</span>
        <span className="text-sm font-bold text-[#0F172A]">{action}</span>
     </div>
     <div className="flex items-center gap-10">
        <span className="text-[11px] font-medium text-slate-500">{user}</span>
        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">{status}</span>
     </div>
  </div>
);

export default PlatformUsage;
