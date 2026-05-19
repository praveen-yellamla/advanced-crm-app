import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Headphones,
  RefreshCcw,
  BarChart3,
  Layers,
  ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

const ManagerDashboard = () => {
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = (data) => {
      console.log('[SOCKET] Manager dashboard update event:', data);
      queryClient.invalidateQueries({ queryKey: ['managerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['managerDashboardCallVolume'] });
      queryClient.invalidateQueries({ queryKey: ['managerDashboardLeadSources'] });
      queryClient.invalidateQueries({ queryKey: ['managerDashboardFunnel'] });
      if (data?.agent?.name) {
        toast.success(`Agent ${data.agent.name} team assignment synchronized!`);
      }
    };

    socket.on('agent:joined_team', handleRealtimeUpdate);
    socket.on('agent:added', handleRealtimeUpdate);
    socket.on('agent:left_team', handleRealtimeUpdate);
    socket.on('agent:deactivated', handleRealtimeUpdate);

    return () => {
      socket.off('agent:joined_team', handleRealtimeUpdate);
      socket.off('agent:added', handleRealtimeUpdate);
      socket.off('agent:left_team', handleRealtimeUpdate);
      socket.off('agent:deactivated', handleRealtimeUpdate);
    };
  }, [socket, queryClient]);

  // 1. Fetch KPI Cards and Leaderboard
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['managerDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/manager/dashboard/stats');
      return res.data.data;
    }
  });

  // 2. Fetch Call Volume (stacked bars last 14 days)
  const { data: callVolumeData, isLoading: isCallVolumeLoading, refetch: refetchCallVolume } = useQuery({
    queryKey: ['managerDashboardCallVolume'],
    queryFn: async () => {
      const res = await api.get('/manager/dashboard/call-volume');
      return res.data.data;
    }
  });

  // 3. Fetch Lead Sources (Pie Chart)
  const { data: leadSourcesData, isLoading: isLeadSourcesLoading, refetch: refetchLeadSources } = useQuery({
    queryKey: ['managerDashboardLeadSources'],
    queryFn: async () => {
      const res = await api.get('/manager/dashboard/lead-sources');
      return res.data.data;
    }
  });

  // 4. Fetch Conversion Funnel
  const { data: funnelData, isLoading: isFunnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ['managerDashboardFunnel'],
    queryFn: async () => {
      const res = await api.get('/manager/dashboard/conversion-funnel');
      return res.data.data;
    }
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchCallVolume();
    refetchLeadSources();
    refetchFunnel();
    toast.success('Dashboard metrics refreshed');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isStatsLoading || isCallVolumeLoading || isLeadSourcesLoading || isFunnelLoading) {
    return <DashboardSkeleton />;
  }

  const { cards, leaderboard, recentActivity } = statsData || {};

  // Sort Leaderboard
  const sortedLeaderboard = [...(leaderboard || [])].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  // Dynamically discover all unique agent names in stacked bar chart keys
  const agentKeys = new Set();
  if (callVolumeData) {
    callVolumeData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') agentKeys.add(key);
      });
    });
  }
  const agentsArray = Array.from(agentKeys);

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0 bg-slate-50/50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manager Command Center</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Real-time team analytics, calling queues, and active sales pipelines.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleRefreshAll}
             className="h-12 px-5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/35 transition-all flex items-center gap-2"
           >
              <RefreshCcw size={18} className="animate-spin-slow" /> Refresh Data
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <KPICard title="Total Calls Today" value={cards?.callsToday ?? 0} icon={<Headphones />} color="indigo" />
        <KPICard title="Leads Assigned (W)" value={cards?.leadsAssignedThisWeek ?? 0} icon={<Target />} color="blue" />
        <KPICard title="Conversion MTD" value={`${cards?.conversionRate ?? 0}%`} icon={<TrendingUp />} color="emerald" />
        <KPICard title="Revenue MTD" value={`₹${((cards?.revenueGenerated || 0) / 1000).toFixed(1)}k`} icon={<DollarSign />} color="violet" />
        <KPICard title="Avg Handle Time" value={`${cards?.avgHandleTime ?? 0}m`} icon={<Clock />} color="amber" />
        <KPICard 
          title="Open Tasks" 
          value={cards?.openTasks ?? 0} 
          subValue={cards?.overdueTasks > 0 ? `${cards.overdueTasks} Overdue` : null}
          icon={<ShieldAlert />} 
          color="rose" 
        />
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALL VOLUME STACKED BAR CHART */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Call Volume (Last 14 Days)</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total calls placed per agent (stacked)</p>
            </div>
            <BarChart3 size={20} className="text-slate-300" />
          </div>
          <div className="h-[350px]">
            {callVolumeData && callVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px'}}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  {agentsArray.map((agent, i) => (
                    <Bar key={agent} dataKey={agent} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === agentsArray.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No calls logged in the last 14 days" />
            )}
          </div>
        </div>

        {/* LEAD SOURCE PIE CHART */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Lead Distribution</h3>
            <Layers size={20} className="text-slate-300" />
          </div>
          <div className="h-[250px] relative flex items-center justify-center">
            {leadSourcesData && leadSourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No source distribution data" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {leadSourcesData?.map((source, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{source.name.replace('_', ' ')}</p>
                  <p className="text-xs font-black text-slate-900 mt-1 leading-none">{source.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL & AGENT LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PIPELINE FUNNEL CHART */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Conversion Funnel</h3>
            <Activity size={20} className="text-slate-300" />
          </div>
          {(!funnelData || funnelData.length === 0 || !funnelData.some(stage => stage.value > 0)) ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[280px]">
              <Activity size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-500">No lead data available yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {funnelData?.map((stage, i) => {
                const maxVal = funnelData.find(s => s.value > 0)?.value || 1;
                const percentage = stage.value > 0 ? Math.round((stage.value / maxVal) * 100) : 0;
                return (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span className="uppercase tracking-wider">{stage.name}</span>
                      <span>{stage.value} leads ({percentage}%)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LEADERBOARD TABLE */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Agent Leaderboard</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top performing advisors in Vortex Outbound Sales</p>
              </div>
              <TrendingUp size={20} className="text-slate-300" />
            </div>

            {sortedLeaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[280px]">
                <Users size={40} className="text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">No agents assigned to your team yet.</p>
                <p className="text-xs text-slate-400 mt-1">Ask your Admin to assign agents.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-3">Agent Name</th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => handleSort('callsMade')}>
                        Calls {sortField === 'callsMade' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => handleSort('conversionRate')}>
                        Conv % {sortField === 'conversionRate' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => handleSort('revenue')}>
                        Revenue MTD {sortField === 'revenue' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => handleSort('avgQAScore')}>
                        QA Score {sortField === 'avgQAScore' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedLeaderboard.map((agent, i) => (
                      <tr key={agent.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="font-extrabold text-slate-800 flex items-center gap-2.5">
                            {agent.avatar ? (
                              <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full border border-slate-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {agent.name.charAt(0)}
                              </div>
                            )}
                            {agent.name}
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-slate-600">{agent.callsMade}</td>
                        <td className="py-3.5 font-black text-indigo-600">{agent.conversionRate}%</td>
                        <td className="py-3.5 font-extrabold text-slate-900">₹{agent.revenue.toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            agent.avgQAScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                            agent.avgQAScore >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {agent.avgQAScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-6">Recent Team Activity</h3>
        <div className="divide-y divide-slate-100">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="py-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Activity size={16} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800">{activity.action}</span>
                    <span className="text-slate-400 font-medium"> on lead </span>
                    <span className="font-bold text-indigo-600">{activity.leadName}</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="No recent team activities logged yet" />
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subValue, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };

  const isOverdue = title === "Open Tasks" && subValue;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-[155px]"
    >
       <div className="flex items-center justify-between">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]} shadow-sm transition-all duration-300 group-hover:scale-110`}>
            {React.cloneElement(icon, { size: 18 })}
         </div>
         {isOverdue && (
           <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 animate-pulse">
             Overdue
           </span>
         )}
       </div>
       <div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
         <h4 className="text-xl font-extrabold text-slate-900 truncate mt-1 tracking-tight flex items-baseline gap-2">
           {value}
           {subValue && (
             <span className="text-xs font-bold text-rose-500 leading-none">{subValue}</span>
           )}
         </h4>
       </div>
    </motion.div>
  );
};

const EmptyState = ({ message }) => (
  <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-slate-400 font-medium">
    <Layers size={36} className="text-slate-200 mb-3 animate-pulse" />
    <p className="text-xs font-bold uppercase tracking-wider">{message}</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4 md:p-0">
    <div className="h-20 bg-slate-100 rounded-2xl w-full" />
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
       {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-3 gap-8">
       <div className="col-span-2 h-[450px] bg-slate-100 rounded-2xl" />
       <div className="h-[450px] bg-slate-100 rounded-2xl" />
    </div>
  </div>
);

export default ManagerDashboard;
