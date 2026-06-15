import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ChevronRight,
  ArrowUpRight,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Globe,
  HardDrive,
  Phone,
  BarChart3,
  Search,
  Server,
  Cloud,
  Cpu,
  Monitor,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const res = await api.get('/platform/stats');
      return res.data.data;
    }
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['platformHealth'],
    queryFn: async () => {
      const res = await api.get('/platform/health');
      return res.data.data;
    },
    refetchInterval: 30000 // Refresh every 30s for health
  });

  if (statsLoading || healthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  const { metrics, health, recentSignups, subscriptions } = statsData || {};

  const subData = subscriptions?.map(s => ({
    name: s.subscriptionTier,
    value: s._count,
    color: s.subscriptionTier === 'ENTERPRISE' ? '#0F172A' : s.subscriptionTier === 'PROFESSIONAL' ? '#7C3AED' : '#2563EB'
  })) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24 relative"
    >
      {/* AMBIENT BACKGROUND */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Platform Online</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uptime: 99.99%</span>
           </div>
           <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] to-blue-800 tracking-tighter italic uppercase leading-none drop-shadow-sm">Dashboard</h1>
           <p className="text-sm font-medium text-slate-500 mt-4 max-w-2xl leading-relaxed">Global platform management and performance monitoring.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={() => navigate('/platform/organizations')}
             className="h-16 px-8 bg-white/80 backdrop-blur-md border border-white/50 text-[#0F172A] rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-4 hover:border-blue-600 hover:scale-105 transition-all active:scale-95"
           >
              <Building2 size={20} className="text-blue-600" /> View Companies
           </button>
           <button 
             onClick={() => navigate('/platform/analytics')}
             className="h-16 px-8 bg-white/80 backdrop-blur-md border border-white/50 text-[#0F172A] rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-4 hover:border-emerald-600 hover:scale-105 transition-all active:scale-95"
           >
              <DollarSign size={20} className="text-emerald-600" /> Open Revenue
           </button>
           <button 
             onClick={() => {
                const healthSection = document.getElementById('system-status-section');
                healthSection?.scrollIntoView({ behavior: 'smooth' });
             }}
             className="h-16 px-8 bg-white/80 backdrop-blur-md border border-white/50 text-[#0F172A] rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-4 hover:border-amber-600 hover:scale-105 transition-all active:scale-95"
           >
              <Activity size={20} className="text-amber-600" /> System Status
           </button>
           <button 
             className="h-16 w-16 bg-gradient-to-br from-[#0F172A] to-slate-800 text-white rounded-3xl flex items-center justify-center shadow-[0_8px_20px_rgb(15,23,42,0.3)] hover:shadow-[0_12px_25px_rgb(15,23,42,0.5)] hover:scale-105 active:scale-95 transition-all border border-slate-700/50"
             onClick={() => queryClient.invalidateQueries()}
           >
              <Activity size={24} />
           </button>
        </div>
      </div>

      {/* PRIMARY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <SaaSKPICard label="Active Companies" value={metrics?.totalOrganizations || 0} trend="+12%" icon={Building2} color="blue" />
         <SaaSKPICard label="Monthly Revenue" value={`$${(metrics?.mrr || 0).toLocaleString()}`} trend="+$4.5k" icon={DollarSign} color="emerald" />
         <SaaSKPICard label="Annual Revenue" value={`$${(metrics?.arr || 0).toLocaleString()}`} trend="Stable" icon={TrendingUp} color="violet" />
         <SaaSKPICard label="AI Usage" value={`${(metrics?.usage?.aiTokens / 1000).toFixed(1)}k`} trend="High" icon={Zap} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* SYSTEM STATUS */}
        <div id="system-status-section" className="xl:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                <Server className="text-blue-600" size={28} /> System Status
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Status</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {healthData?.services?.map((service, idx) => (
                <div key={idx} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                   <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${service.status === 'ONLINE' || service.status === 'OPTIMAL' || service.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                         {service.name.includes('AI') ? <Zap size={20} /> : service.name.includes('DB') ? <Database size={20} /> : <Cloud size={20} />}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${service.status === 'ONLINE' || service.status === 'OPTIMAL' || service.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {service.status}
                      </div>
                   </div>
                   <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">{service.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{service.latency || service.load || service.provider}</p>
                </div>
              ))}
           </div>

           {/* SYSTEM RESOURCES */}
           <div className="bg-[#0F172A] rounded-[48px] p-12 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-1000">
                 <Cpu size={200} />
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                 <HardwareStat label="CPU Load" value={healthData?.infrastructure?.cpu} icon={Cpu} />
                 <HardwareStat label="Memory Usage" value={healthData?.infrastructure?.memory} icon={Monitor} />
                 <HardwareStat label="Storage" value={healthData?.infrastructure?.storage} icon={HardDrive} />
              </div>
           </div>
        </div>

        {/* REVENUE MIX */}
        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[56px] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all duration-700 flex flex-col justify-between">
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Revenue Mix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">By Subscription Tier</p>
           </div>
           
           <div className="h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={subData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {subData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 800, fontSize: 13, padding: '24px'}} 
                    />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl font-black text-[#0F172A] italic">{metrics?.totalOrganizations || 0}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Active Companies</span>
              </div>
           </div>

           <div className="space-y-4">
              {subData.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{s.name}</span>
                   </div>
                   <span className="text-sm font-black text-[#0F172A] italic">{s.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* RECENT SIGNUPS */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[64px] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
         <div className="px-12 py-10 border-b border-white/50 flex items-center justify-between bg-slate-50/50 backdrop-blur-md">
            <div>
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Recent Signups</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">System Activity Feed</p>
            </div>
            <button 
              onClick={() => navigate('/platform/organizations')}
              className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              View All Companies
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</th>
                     <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                     <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                     <th className="px-12 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {recentSignups?.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-all group">
                       <td className="px-12 py-10">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-3xl bg-[#0F172A] flex items-center justify-center text-white shadow-xl transform group-hover:rotate-12 transition-transform">
                                <Building2 size={24} />
                             </div>
                             <div>
                                <p className="text-lg font-black text-[#0F172A] italic uppercase tracking-tight">{org.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Joined {new Date(org.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-12 py-10">
                          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            org.subscriptionTier === 'ENTERPRISE' ? 'bg-[#0F172A] text-white' : 
                            org.subscriptionTier === 'PROFESSIONAL' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                             {org.subscriptionTier}
                          </span>
                       </td>
                       <td className="px-12 py-10">
                          <div className="flex items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{org.status}</span>
                          </div>
                       </td>
                       <td className="px-12 py-10">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads</span>
                                <span className="text-sm font-black text-[#0F172A] italic">{org.leadLimit / 1000}k</span>
                             </div>
                             <div className="w-px h-8 bg-slate-100" />
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agents</span>
                                <span className="text-sm font-black text-[#0F172A] italic">{org.agentLimit}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-12 py-10 text-right">
                          <button 
                            onClick={() => navigate(`/platform/organizations/${org.id}`)}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                          >
                             <ChevronRight size={20} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </motion.div>
  );
};

const SaaSKPICard = ({ label, value, trend, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[48px] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-12 group hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-700 relative overflow-hidden z-0">
       <div className="flex items-center justify-between relative z-10">
          <div className={`w-18 h-18 rounded-[28px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg ${colors[color]}`}>
             <Icon size={32} />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Stats</span>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase italic mt-2 border border-emerald-100 shadow-sm">
                <TrendingUp size={12} />
                <span>{trend}</span>
             </div>
          </div>
       </div>
       <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{label}</p>
          <p className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase italic">{value}</p>
       </div>
       <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-150" />
    </div>
  );
};

const HardwareStat = ({ label, value, icon: Icon }) => (
  <div className="space-y-6">
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400">
           <Icon size={20} />
        </div>
        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{label}</span>
     </div>
     <div className="space-y-3">
        <div className="flex items-center justify-between font-black italic">
           <span className="text-2xl text-white">{value}</span>
           <span className="text-[10px] text-emerald-500 uppercase">Optimal</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
           <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] w-[40%]" />
        </div>
     </div>
  </div>
);

export default PlatformDashboard;
