import React from 'react';
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
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const stats = [
    { name: 'Total Leads', value: '18,402', change: '+12.5%', icon: Target, color: 'blue' },
    { name: 'Active Agents', value: '142', change: '+3.2%', icon: Users, color: 'indigo' },
    { name: 'Revenue (MTD)', value: '$842k', change: '+18.4%', icon: DollarSign, color: 'emerald' },
    { name: 'Conversion Rate', value: '24.8%', change: '-0.4%', icon: TrendingUp, color: 'amber' },
  ];

  const kanbanStages = [
    { name: 'New', count: 42, color: 'bg-blue-500' },
    { name: 'Contacted', count: 28, color: 'bg-indigo-500' },
    { name: 'Qualified', count: 18, color: 'bg-cyan-500' },
    { name: 'Negotiation', count: 12, color: 'bg-amber-500' },
    { name: 'Won', count: 34, color: 'bg-emerald-500' },
    { name: 'Lost', count: 10, color: 'bg-rose-500' },
  ];

  const recentActivity = [
    { id: 1, type: 'lead', user: 'Sarah Jenkins', action: 'converted a lead from', target: 'Facebook Ads', time: '12m ago', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 2, type: 'call', user: 'David Chen', action: 'completed a 15m call with', target: 'Quantum Corp', time: '45m ago', icon: PhoneCall, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, type: 'deal', user: 'System', action: 'automatically qualified', target: 'Stellar Solutions', time: '1h ago', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 4, type: 'alert', user: 'Manager AI', action: 'flagged high risk on', target: 'Omni Tech', time: '2h ago', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Command Center</h2>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <Calendar size={14} />
            Data updated as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
             <Filter size={16} />
             Advanced Filters
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/10">
             Generate Quarterly Report
           </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group"
          >
            <div className="flex items-center justify-between mb-6">
               <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon size={24} />
               </div>
               <div className={`flex items-center gap-1 text-xs font-black p-1.5 px-3 rounded-full ${stat.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {stat.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
               </div>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.name}</p>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Team Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Charts Container (Simulated) */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900">Revenue Growth Trend</h3>
                    <p className="text-slate-500 text-sm font-medium">Monthly recurring revenue projection</p>
                 </div>
                 <select className="bg-slate-50 border border-slate-200 text-xs font-bold p-2 px-3 rounded-xl outline-none focus:border-blue-500">
                    <option>Last 6 Months</option>
                    <option>Last 12 Months</option>
                 </select>
              </div>
              
              {/* Simulated Pure CSS Chart */}
              <div className="h-64 flex items-end gap-4 w-full px-4">
                 {[45, 62, 55, 84, 78, 100].map((height, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                      <div className="w-full relative">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${height}%` }}
                           transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                           className={`w-full rounded-t-2xl relative ${i === 5 ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 group-hover:bg-blue-100 transition-colors'}`}
                         >
                            {i === 5 && (
                               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] font-bold p-1 px-2 rounded-lg whitespace-nowrap">
                                  $842,000.00
                               </div>
                            )}
                         </motion.div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                         {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                      </span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Lead Source Breakdown */}
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8">Lead Source Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { name: 'Social Ads', percentage: 42, color: 'bg-blue-600' },
                   { name: 'Organic', percentage: 28, color: 'bg-indigo-500' },
                   { name: 'Referral', percentage: 18, color: 'bg-cyan-400' },
                   { name: 'Direct', percentage: 12, color: 'bg-slate-200' },
                 ].map((source, idx) => (
                   <div key={source.name} className="space-y-3">
                      <div className="flex items-center justify-between font-bold text-xs">
                         <span className="text-slate-500">{source.name}</span>
                         <span className="text-slate-900">{source.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${source.percentage}%` }}
                           transition={{ delay: 0.8 + (idx * 0.1), duration: 1 }}
                           className={`h-full ${source.color} rounded-full`}
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Team Operations & Activity */}
        <div className="space-y-8">
           <div className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                 <Zap size={20} className="text-amber-400" />
                 Live Operations
              </h3>
              
              <div className="space-y-6">
                 {[
                   { label: 'Agents Online', value: '42/142', icon: Users, color: 'emerald' },
                   { label: 'Calls Active', value: '18', icon: PhoneCall, color: 'blue' },
                   { label: 'Pending Followups', value: '124', icon: Clock, color: 'indigo' },
                   { label: 'Missed Leads', value: '14', icon: AlertCircle, color: 'rose' },
                 ].map((op) => (
                   <div key={op.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className={`p-2 rounded-xl bg-${op.color}-500/20 text-${op.color}-400`}>
                            <op.icon size={18} />
                         </div>
                         <span className="text-sm font-bold text-slate-300">{op.label}</span>
                      </div>
                      <span className="text-white font-black">{op.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* AI Insights Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
                 <BrainCircuit size={120} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                 <BrainCircuit size={20} className="text-cyan-300" />
                 AI Command Center
              </h3>
              
              <div className="space-y-5 relative z-10">
                 <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-1">Weekly Recommendation</p>
                    <p className="text-xs text-white leading-relaxed font-medium">Reallocate 15% of Social budget to Referral channels based on Q2 ROI data.</p>
                 </div>
                 <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-1">Performance Insight</p>
                    <p className="text-xs text-white leading-relaxed font-medium">Agent "David Chen" maintains 14% higher conversion on Automotive leads.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Kanban Pipeline Overview */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
         <div className="flex items-center justify-between mb-12">
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lead Pipeline Overview</h3>
               <p className="text-slate-500 font-medium">Current lead distribution across the global sales funnel</p>
            </div>
            <button className="p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all">
               <MoreVertical size={20} className="text-slate-500" />
            </button>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {kanbanStages.map((stage, idx) => (
               <div key={stage.name} className="space-y-6 relative group">
                  <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${stage.color} rounded-full`} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{stage.name}</span>
                     </div>
                     <span className="text-xs font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{stage.count}</span>
                  </div>
                  
                  <div className="space-y-3">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100 p-3 opacity-40 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
                           <div className="h-2 w-12 bg-slate-200 rounded-full" />
                           <div className="space-y-1.5">
                              <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                              <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                           </div>
                           <div className="flex justify-end gap-1">
                              <div className="w-4 h-4 rounded-full bg-slate-200" />
                              <div className="w-4 h-4 rounded-full bg-slate-300" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="max-w-[800px]">
         <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Recent Activity Feed</h3>
         <div className="space-y-6 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
            {recentActivity.map((activity, idx) => (
               <motion.div 
                 key={activity.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 1.2 + (idx * 0.1) }}
                 className="flex gap-6 relative"
               >
                  <div className={`relative z-10 w-12 h-12 rounded-2xl ${activity.bg} ${activity.color} flex items-center justify-center p-0.5 shadow-sm`}>
                     <activity.icon size={20} />
                  </div>
                  <div className="flex-1 pt-1">
                     <p className="text-sm text-slate-600 font-medium">
                        <span className="font-extrabold text-slate-900">{activity.user}</span> {activity.action} <span className="font-extrabold text-blue-600">{activity.target}</span>
                     </p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{activity.time}</p>
                  </div>
               </motion.div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
