import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ClipboardCheck, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Zap
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TaskAnalytics = ({ analytics }) => {
  const chartData = [
    { name: 'Pending', value: analytics?.pending || 0 },
    { name: 'In Progress', value: analytics?.inProgress || 0 },
    { name: 'Completed', value: analytics?.completed || 0 },
    { name: 'Overdue', value: analytics?.overdue || 0 },
  ];

  const stats = [
    { label: 'Total Volume', value: analytics?.total || 0, icon: <TrendingUp size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Efficiency Rate', value: `${analytics?.completionRate || 0}%`, icon: <Zap size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overdue Alerts', value: analytics?.overdue || 0, icon: <AlertCircle size={24} />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Units', value: analytics?.pending || 0, icon: <Clock size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-10 mb-16">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-bl-[80px] opacity-20 -mr-10 -mt-10 group-hover:scale-110 transition-transform`} />
            <div className="relative z-10 flex flex-col gap-6">
              <div className={`w-16 h-16 rounded-3xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-[#0F172A] tabular-nums tracking-tighter">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl">
          <h3 className="text-xl font-bold text-[#0F172A] mb-10 flex items-center gap-4">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
             Task Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl flex flex-col items-center">
          <h3 className="text-xl font-bold text-[#0F172A] mb-10 self-start flex items-center gap-4">
             <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
             Operational Efficiency
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;
