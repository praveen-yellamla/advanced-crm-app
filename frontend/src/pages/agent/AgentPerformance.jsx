import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  TrendingUp, 
  Target, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Award,
  Zap,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const AgentPerformance = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['agentDashboard'],
    queryFn: async () => {
      const res = await api.get('/agent/dashboard');
      return res.data.data;
    }
  });

  const conversionData = [
    { name: 'Cold Leads', value: 400 },
    { name: 'Interests', value: 300 },
    { name: 'Negotiation', value: 150 },
    { name: 'Closed', value: 80 },
  ];

  const callTrend = [
    { day: 'Mon', count: 45 },
    { day: 'Tue', count: 52 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 65 },
    { day: 'Fri', count: 48 },
  ];

  const COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Performance Analytics</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Behavioral intelligence & multi-channel conversion metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* CALL VOLUME TREND */}
         <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Call Volume Analytics</h3>
               <Phone size={24} className="text-blue-600/20" />
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callTrend}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}}
                     />
                     <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* PIPELINE DISTRIBUTION */}
         <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-10 text-white">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">Pipeline Conversion Weight</h3>
                  <Target size={24} className="text-blue-400" />
               </div>
               <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={conversionData}
                           innerRadius={80}
                           outerRadius={110}
                           paddingAngle={8}
                           dataKey="value"
                        >
                           {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-4xl font-black tracking-tighter">84%</p>
                     <p className="text-[10px] font-bold uppercase opacity-40">Efficiency</p>
                  </div>
               </div>
            </div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -ml-32 -mb-32" />
         </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <MetricBox label="Avg Handle Time" value="4m 12s" sub="Improved by 12%" icon={<Clock className="text-blue-600" />} />
         <MetricBox label="Conversion Rate" value="18.4%" sub="Top 5% of Team" icon={<TrendingUp className="text-emerald-600" />} />
         <MetricBox label="Contact Accuracy" value="94.2%" sub="High Tier Data" icon={<CheckCircle2 className="text-violet-600" />} />
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-12 rounded-[56px] text-white shadow-2xl shadow-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="space-y-4">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl w-fit flex items-center gap-2">
               <Award size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Elite Achievement</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight max-w-lg">Strategic Lead Conversion Master</h2>
            <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-md">You've exceeded your monthly revenue quota by <span className="font-bold underline decoration-2 underline-offset-4 decoration-white/30 italic">22%</span>. Performance bonuses have been synchronized with your next fiscal cycle.</p>
         </div>
         <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <Zap size={64} className="text-white fill-white animate-pulse" />
         </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, sub, icon }) => (
  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-4 group">
     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 28 })}
     </div>
     <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter mt-1">{value}</h4>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">{sub}</p>
     </div>
  </div>
);

export default AgentPerformance;
