import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Phone, 
  MessageSquare, 
  Clock, 
  Zap, 
  Headphones, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Calendar,
  History,
  CheckCircle2,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AgentDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { name: 'Active Leads', value: '18', icon: Target, shadow: 'shadow-blue-500/10', color: 'blue' },
    { name: 'Daily Dials', value: '24', icon: Phone, shadow: 'shadow-emerald-500/10', color: 'emerald' },
    { name: 'Follow-ups', value: '05', icon: Clock, shadow: 'shadow-amber-500/10', color: 'amber' },
    { name: 'Feedback', value: '02', icon: MessageSquare, shadow: 'shadow-indigo-500/10', color: 'indigo' },
  ];

  const recentLeads = [
    { name: 'John Peterson', company: 'Global Tech', status: 'Follow-up', source: 'Web', time: '10m ago' },
    { name: 'Sarah Miller', company: 'Nexus Inc', status: 'Interested', source: 'Ad', time: '2h ago' },
    { name: 'Robert Fox', company: 'Initech', status: 'Contacted', source: 'Manual', time: '4h ago' },
  ];

  const callHistory = [
    { type: 'Outgoing', duration: '5m 12s', status: 'Connected', time: '15m ago' },
    { type: 'Incoming', duration: '2m 45s', status: 'Missed', time: '1h ago' },
    { type: 'Outgoing', duration: '12m 30s', status: 'Connected', time: '3h ago' },
  ];

  if (isLoading) return <AgentSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Agent Workspace</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Agent Workbench</h2>
          <p className="text-slate-500 font-medium mt-2">Focused personal dashboard for high-frequency conversion.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all group">
           <Headphones size={20} className="group-hover:rotate-12 transition-transform" />
           Start Calling Session
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.name} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-${stat.color}-200 transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between mb-8">
               <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} />
               </div>
               <TrendingUp size={16} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.name}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECENT LEADS & WORKFLOW */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                 <Zap className="text-amber-500" size={24} />
                 Priority Leads
              </h3>
              <div className="grid gap-4">
                 {recentLeads.map((lead) => (
                    <div key={lead.name} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-black">
                             {lead.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 tracking-tight">{lead.name}</p>
                             <p className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                                <MapPin size={10} /> {lead.company}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="hidden md:block">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {lead.status}
                             </span>
                          </div>
                          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                             <Phone size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                 <History className="text-blue-500" size={24} />
                 Today's History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {callHistory.map((call, i) => (
                    <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[32px] group hover:bg-white hover:shadow-lg transition-all">
                       <div className="flex items-center justify-between mb-4">
                          <div className={`p-2 rounded-lg bg-white ${call.status === 'Connected' ? 'text-emerald-500' : 'text-rose-500'} shadow-sm`}>
                             {call.type === 'Outgoing' ? <PhoneOutgoing size={14} /> : <PhoneIncoming size={14} />}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{call.time}</span>
                       </div>
                       <p className="text-xs font-black text-slate-900 mb-1">{call.type} Call</p>
                       <p className="text-[10px] font-bold text-slate-500">{call.duration} • {call.status}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* TARGET TRACKER */}
        <div className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
           
           <div className="relative z-10">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8">
                 <Target size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Performance Goal</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">You are on track to exceed your weekly conversion bonus. Maintain current frequency.</p>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
                       <span>Dial Target</span>
                       <span className="text-blue-500">24 / 50</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '48%' }} transition={{ duration: 1.5 }} className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_#2563eb]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
                       <span>Evaluations</span>
                       <span className="text-emerald-500">88% Score</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} transition={{ duration: 1.5 }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="pt-10 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Next Reward</p>
                    <p className="text-xs font-bold text-slate-400">50 Dials = $25 Bonus</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

const AgentSkeleton = () => (
   <div className="space-y-8 animate-pulse p-4">
      <div className="h-20 bg-slate-100 rounded-[32px] w-full" />
      <div className="grid grid-cols-4 gap-6">
         {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[32px]" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
         <div className="col-span-2 h-[500px] bg-slate-100 rounded-[40px]" />
         <div className="h-[500px] bg-slate-100 rounded-[40px]" />
      </div>
   </div>
);

export default AgentDashboard;
