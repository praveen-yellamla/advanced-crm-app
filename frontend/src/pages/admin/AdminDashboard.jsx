import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  AlertCircle, 
  Zap, 
  MoreVertical,
  PhoneCall,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Filter,
  Search,
  Bell,
  Activity,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
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

  return (
    <div className="space-y-8 pb-12">
      
      {/* SECTION: EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="p-1 px-2 rounded-md bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-600/20">Live System</span>
            <span className="text-slate-400 text-xs font-medium">Platform version 4.2.0-stable</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">+12</div>
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
        
        {/* SECTION: PREMIUM REVENUE CHART */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full group-hover:bg-blue-500/10 transition-all duration-1000" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Performance</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Growth projection vs actual realization</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button className="px-4 py-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-xs font-black text-slate-700">MTD</button>
                <button className="px-4 py-1.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors">YTD</button>
              </div>
            </div>

            <div className="h-[320px] w-full relative z-10 flex items-end">
               <RevenueChart />
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-3 gap-8 relative z-10">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Average Deal Size</p>
                  <p className="text-lg font-black text-slate-900">$14,240</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer LTV</p>
                  <p className="text-lg font-black text-slate-900">$2,450</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Churn Rate</p>
                  <p className="text-lg font-black text-emerald-500">1.2% <span className="text-[10px] text-slate-400 font-bold ml-1">↓ 0.4%</span></p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
                <div className="relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mb-6">
                      <BrainCircuit size={24} />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Automated Insights</h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-8">AI-driven prioritization has increased conversion probability by 22% in the last 48 hours for Enterprise leads.</p>
                </div>
                <button className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest relative z-10 group/btn">
                   Explore Insights 
                   <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                   <h3 className="text-lg font-black text-slate-900 mb-4">Pipeline Distribution</h3>
                   <div className="space-y-4">
                      {[
                        { label: 'Direct Sales', value: 65, color: 'bg-blue-600' },
                        { label: 'Channel Partners', value: 25, color: 'bg-indigo-500' },
                        { label: 'Referrals', value: 10, color: 'bg-slate-200' },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1.5">
                           <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="text-slate-900">{item.value}%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.5 }} className={`h-full ${item.color} rounded-full`} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-6">* Updates every 15 minutes</p>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                 </div>
              </div>

              <div className="grid gap-4">
                 {[
                   { label: 'Calls Active', value: '18', icon: PhoneCall, color: 'blue', pulse: true },
                   { label: 'Agents Online', value: '42/142', icon: Users, color: 'emerald', pulse: false },
                   { label: 'Pending Task', value: '124', icon: ClipboardCheck, color: 'indigo', pulse: false },
                   { label: 'System Load', value: '3.4%', icon: Activity, color: 'amber', pulse: false },
                 ].map((item) => (
                   <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 group-hover:border-blue-100 flex items-center justify-center text-${item.color}-500 shadow-sm transition-all`}>
                            <item.icon size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900">{item.label}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               {item.pulse && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                               <p className="text-[10px] font-bold text-slate-400 capitalize">{item.pulse ? 'Real-time telemetry' : 'Steady operation'}</p>
                            </div>
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
                 {activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-6 relative">
                       <div className={`w-12 h-12 rounded-2xl bg-${activity.color}-50 border border-${activity.color}-100 flex items-center justify-center text-${activity.color}-600 relative z-10`}>
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
    </div>
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
      className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group"
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
      
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{name}</p>
          <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
        
        {/* Elite Sparkline (SVG) */}
        <div className="h-10 w-full opacity-30 hover:opacity-100 transition-opacity">
           <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                 <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: `var(--${color}-500)`, stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: `var(--${color}-500)`, stopOpacity: 0 }} />
                 </linearGradient>
              </defs>
              <motion.polyline
                 fill="none"
                 stroke={isUp ? '#10b981' : '#f43f5e'}
                 strokeWidth="2.5"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 points={data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - val}`).join(' ')}
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 2, delay: 0.5 }}
                 className="w-full h-full"
                 vectorEffect="non-scaling-stroke"
              />
           </svg>
        </div>
      </div>
    </motion.div>
  );
};

const RevenueChart = () => {
   const dataPoints = [
      { month: 'Jan', val: 120, target: 100 },
      { month: 'Feb', val: 180, target: 140 },
      { month: 'Mar', val: 150, target: 180 },
      { month: 'Apr', val: 240, target: 210 },
      { month: 'May', val: 210, target: 240 },
      { month: 'Jun', val: 280, target: 270 },
   ];

   return (
      <div className="w-full h-full flex flex-col justify-between">
         <div className="flex-1 flex items-end gap-1 px-4 relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
               {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-slate-900" />)}
            </div>
            
            {/* SVG Path for smooth area chart */}
            <svg className="absolute top-0 left-0 w-full h-full px-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
               <motion.path
                  d="M 0 80 Q 20 40, 40 60 T 60 20 T 80 40 T 100 10 L 100 100 L 0 100 Z"
                  fill="url(#revGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
               />
               <defs>
                  <linearGradient id="revGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
                     <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
               </defs>
            </svg>

            {dataPoints.map((p, i) => (
               <div key={p.month} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Actual Value Bar */}
                  <div className="w-8 relative flex flex-col justify-end h-full">
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(p.val / 300) * 100}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                        className={`w-full ${i === 5 ? 'bg-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.4)]' : 'bg-slate-100'} rounded-t-xl group-hover:bg-blue-200 transition-all relative cursor-pointer`}
                     >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black p-2 rounded-xl whitespace-nowrap shadow-xl z-20">
                           Actual: ${p.val}k
                        </div>
                     </motion.div>
                  </div>
                  {/* Indicator Dot for target (simulated) */}
                  <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 1 + (i * 0.1) }}
                     className="absolute w-2 h-2 rounded-full bg-indigo-200 border-2 border-white z-10"
                     style={{ bottom: `${(p.target / 300) * 100}%` }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-6">{p.month}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

// Standard Lucide Icons that might not have been defined above
const ClipboardCheck = (props) => <CheckCircle2 {...props} />;

export default AdminDashboard;
