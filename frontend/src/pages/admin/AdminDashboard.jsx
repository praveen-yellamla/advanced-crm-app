import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Zap, 
  PhoneCall,
  BrainCircuit,
  Activity,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { name: 'Total Revenue', value: '$842,000', change: '+12.5%', icon: DollarSign, color: 'blue', data: [30, 45, 35, 60, 55, 80, 75] },
    { name: 'Active Leads', value: '18,402', change: '+18.4%', icon: Target, color: 'indigo', data: [20, 30, 50, 40, 60, 70, 90] },
    { name: 'Total Agents', value: '142', change: '+3.2%', icon: Users, color: 'emerald', data: [80, 85, 90, 88, 95, 100, 105] },
    { name: 'Win Rate', value: '24.8%', change: '-0.4%', icon: TrendingUp, color: 'rose', data: [25, 24, 26, 25, 23, 24, 24.8] },
  ];

  const activities = [
    { id: 1, user: 'Sarah Jenkins', action: 'converted a lead from', target: 'Facebook Ads', time: '12m ago', icon: Zap, color: 'amber' },
    { id: 2, user: 'David Chen', action: 'closed a deal worth', target: '$12,400', time: '45m ago', icon: DollarSign, color: 'emerald' },
    { id: 3, user: 'System', action: 'detected high-intent from', target: 'Quantum Corp', time: '1h ago', icon: BrainCircuit, color: 'blue' },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* SECTION: EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-1 px-2 rounded-md bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-600/20">Live System</span>
            <span className="text-slate-400 text-xs font-medium">Global Command Center</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <button className="h-12 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">Audit Reports</button>
          <button className="h-12 px-6 bg-[#0F172A] text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-blue-500/10">System Settings</button>
        </div>
      </div>

      {/* SECTION: ELITE KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <KPICard key={stat.name} {...stat} delay={idx * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* SECTION: PREMIUM REVENUE CHART */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Performance</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Growth projection vs actual realization</p>
              </div>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-xs font-black text-slate-700">MTD</button>
                <button className="px-4 py-1.5 text-xs font-black text-slate-400">YTD</button>
              </div>
            </div>
            <div className="h-[300px] w-full relative z-10">
               <RevenueChart />
            </div>
          </div>

          {/* SECTION: LEAD PIPELINE CANBAN PREVIEW */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Pipeline Velocity</h3>
                <Layers className="text-slate-200" size={24} />
             </div>
             <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'New', count: 124, color: 'blue' },
                  { label: 'Discovery', count: 86, color: 'indigo' },
                  { label: 'Proposal', count: 42, color: 'emerald' },
                  { label: 'Closing', count: 18, color: 'rose' },
                ].map((col) => (
                  <div key={col.label} className="p-4 bg-slate-50 rounded-[28px] border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{col.label}</p>
                     <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-slate-900">{col.count}</span>
                        <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center text-${col.color}-500 shadow-sm group-hover:scale-110 transition-transform`}>
                           <TrendingUp size={14} />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* SECTION: LIVE OPERATIONS PANEL */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900">Live Operations</h3>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live</span>
                 </div>
              </div>

              <div className="grid gap-4">
                 {[
                   { label: 'Calls Active', value: '18', icon: PhoneCall, color: 'blue', pulse: true },
                   { label: 'Agents Online', value: '42/142', icon: Users, color: 'emerald', pulse: false },
                   { label: 'System Health', value: '99.9%', icon: Activity, color: 'amber', pulse: false },
                 ].map((item) => (
                   <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-${item.color}-500 shadow-sm`}>
                            <item.icon size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900">{item.label}</p>
                            <p className="text-[10px] font-bold text-slate-400">Stable Node</p>
                         </div>
                      </div>
                      <span className="text-lg font-black text-slate-900">{item.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-8">Intelligence Feed</h3>
              <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-6 relative">
                       <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-${activity.color}-600 relative z-10 shadow-sm hover:scale-110 transition-transform`}>
                          <activity.icon size={20} />
                       </div>
                       <div className="flex-1 pt-1">
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">
                             <span className="text-slate-900">{activity.user}</span> {activity.action} <span className="text-blue-600">{activity.target}</span>
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{activity.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

// --- SUB-COMPONENTS ---

const KPICard = ({ name, value, change, icon: Icon, color, data, delay }) => {
  const isUp = change.startsWith('+');
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-500 group"
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={28} />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{name}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
      <div className="mt-4 h-8 w-full opacity-20 group-hover:opacity-100 transition-opacity">
         <svg className="h-full w-full" preserveAspectRatio="none">
            <polyline
               fill="none"
               stroke={isUp ? '#10b981' : '#f43f5e'}
               strokeWidth="2.5"
               points={data.map((val, i) => `${(i / (data.length - 1)) * 100},${40 - (val / 100) * 40}`).join(' ')}
               className="h-full w-full"
            />
         </svg>
      </div>
    </motion.div>
  );
};

const RevenueChart = () => {
   return (
      <div className="w-full h-full flex items-end justify-between px-4 gap-4">
         {[120, 180, 150, 240, 210, 280].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
               <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / 300) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`w-full max-w-[40px] rounded-t-xl transition-all ${i === 5 ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-100 group-hover:bg-blue-100'}`}
               />
               <span className="text-[10px] font-black text-slate-400 mt-4">P0{i+1}</span>
            </div>
         ))}
      </div>
   );
};

const DashboardSkeleton = () => (
   <div className="space-y-8 animate-pulse p-4">
      <div className="h-20 bg-slate-100 rounded-[32px] w-full" />
      <div className="grid grid-cols-4 gap-6">
         {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[32px]" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
         <div className="col-span-2 h-[500px] bg-slate-100 rounded-[40px]" />
         <div className="h-[500px] bg-slate-100 rounded-[40px]" />
      </div>
   </div>
);

export default AdminDashboard;
