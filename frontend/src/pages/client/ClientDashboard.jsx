import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Briefcase, 
  Target, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  FileCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const ClientDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: async () => {
      const res = await api.get('/client/dashboard');
      return res.data.data;
    }
  });

  const chartData = [
    { name: 'Mon', leads: 12 }, { name: 'Tue', leads: 18 }, { name: 'Wed', leads: 15 },
    { name: 'Thu', leads: 22 }, { name: 'Fri', leads: 25 }, { name: 'Sat', leads: 10 }, { name: 'Sun', leads: 8 },
  ];

  const sourceData = [
    { name: 'Google Ads', value: 45 },
    { name: 'Meta Ads', value: 30 },
    { name: 'Website', value: 15 },
    { name: 'Direct', value: 10 },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 italic font-mono">External Portal Node</span>
           </div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase underline decoration-indigo-600 decoration-8 underline-offset-8">Corporate Overview.</h1>
           <p className="text-sm font-bold text-slate-400 mt-5 max-w-xl leading-relaxed uppercase italic">Consolidated lead generation & organizational performance telemetry</p>
        </div>
        <div className="flex gap-4">
           <button className="h-16 px-10 bg-[#0F172A] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">
              <Plus size={18} /> Add Strategic Entity
           </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard label="Total Entities" value={stats?.totalCompanies || 0} icon={Briefcase} color="indigo" />
         <KPICard label="Leads Generated" value={stats?.totalLeadsGenerated || 0} icon={Target} color="blue" />
         <KPICard label="Active Campaigns" value={stats?.activeCampaigns || 0} icon={Zap} color="amber" />
         <KPICard label="Revenue Influenced" value={`$${stats?.revenueInfluenced?.toLocaleString()}`} icon={DollarSign} color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* MAIN TREND */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-[#0F172A] italic uppercase tracking-tighter flex items-center gap-4">
                <TrendingUp className="text-indigo-600" size={24} /> Lead Generation Velocity
              </h3>
              <div className="flex gap-3">
                 <span className="px-5 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Last 7 Cycles</span>
              </div>
           </div>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: 12}} />
                    <Area type="monotone" dataKey="leads" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* RECENT ENTITIES */}
        <div className="bg-[#0F172A] p-10 rounded-[48px] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                <Plus className="text-indigo-400" size={24} /> Strategic Entities
             </h3>
             <div className="mt-10 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="group p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                           <Briefcase size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-white tracking-widest italic uppercase">Alpha Corp Node {i}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase">Operational Status: ACTIVE</p>
                        </div>
                     </div>
                     <ChevronRight className="text-slate-600 group-hover:text-indigo-400" size={18} />
                  </div>
                ))}
             </div>
             <button className="w-full mt-10 h-16 bg-white text-[#0F172A] rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                Access Corporate Grid
             </button>
           </div>
           <BarChart3 className="absolute -bottom-20 -right-20 text-white/5" size={300} />
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  
  return (
    <div className={`p-8 rounded-[40px] border shadow-sm space-y-8 group hover:shadow-xl transition-all duration-700 bg-white`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{label}</p>
        <p className="text-4xl font-black text-[#0F172A] tracking-tighter mt-2 italic uppercase">{value}</p>
      </div>
    </div>
  );
};

export default ClientDashboard;
