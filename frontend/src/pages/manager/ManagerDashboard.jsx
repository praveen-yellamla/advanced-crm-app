import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ShieldAlert,
  Clock,
  Headphones,
  BarChart3,
  Layers,
  PhoneCall
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#5b5fcf', '#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];

const formatDuration = (mins) => {
  const totalSeconds = Math.round((mins || 0) * 60);
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
};

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "₹0";
  if (amount < 1000) return `₹${amount}`;
  if (amount < 100000) return `₹${amount.toLocaleString()}`;
  if (amount < 1000000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${(amount / 100000).toFixed(0)}L`;
};

const ManagerDashboard = () => {
  const [sortField, setSortField] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [period, setPeriod] = useState('month');

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['managerDashboardStats', period],
    queryFn: async () => {
      const res = await api.get(`/manager/dashboard/stats?period=${period}`);
      return res.data.data;
    }
  });

  const { data: callVolumeData, isLoading: isCallVolumeLoading, refetch: refetchCallVolume } = useQuery({
    queryKey: ['managerDashboardCallVolume', period],
    queryFn: async () => {
      const res = await api.get(`/manager/dashboard/call-volume?period=${period}`);
      return res.data.data;
    }
  });

  const { data: leadSourcesData, isLoading: isLeadSourcesLoading, refetch: refetchLeadSources } = useQuery({
    queryKey: ['managerDashboardLeadSources', period],
    queryFn: async () => {
      const res = await api.get(`/manager/dashboard/lead-sources?period=${period}`);
      return res.data.data;
    }
  });

  const { data: funnelData, isLoading: isFunnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ['managerDashboardFunnel', period],
    queryFn: async () => {
      const res = await api.get(`/manager/dashboard/conversion-funnel?period=${period}`);
      return res.data.data;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchCallVolume();
      refetchLeadSources();
      refetchFunnel();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchCallVolume, refetchLeadSources, refetchFunnel]);

  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = (data) => {
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

  const sortedLeaderboard = [...(leaderboard || [])].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  const agentKeys = new Set();
  let totalCallsVolume = 0;
  if (callVolumeData) {
    callVolumeData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') {
          agentKeys.add(key);
          totalCallsVolume += day[key];
        }
      });
    });
  }
  const agentsArray = Array.from(agentKeys);

  const isCardsEmpty = !cards || (
    cards.callsToday === 0 && 
    cards.leadsAssignedThisWeek === 0 && 
    cards.revenueGenerated === 0 && 
    cards.openTasks === 0
  );

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="crm-h1">Team Dashboard</h1>
           <p className="crm-body mt-1">Your team's performance at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="crm-input py-2 pl-4 pr-10 rounded-xl bg-white text-sm font-[600] border-neutral-border-default shadow-sm hover:border-brand-primary/50 transition-colors cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title={`Calls (${period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time'})`} value={cards?.callsToday ?? 0} icon={<Headphones />} type="calls" />
        <KPICard title={`Leads (${period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time'})`} value={cards?.leadsAssignedThisWeek ?? 0} icon={<Target />} type="leads" />
        <KPICard title="Conversion Rate" value={`${cards?.conversionRate ?? 0}%`} icon={<TrendingUp />} type="conversion" />
        <KPICard title={`Revenue (${period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time'})`} value={formatCurrency(cards?.revenueGenerated || 0)} icon={<DollarSign />} type="revenue" />
        <KPICard title="Avg Call Duration" value={formatDuration(cards?.avgHandleTime ?? 0)} icon={<Clock />} type="duration" />
        <KPICard 
          title="Open Tasks" 
          value={cards?.openTasks ?? 0} 
          subValue={cards?.overdueTasks > 0 ? `${cards.overdueTasks} Overdue` : null}
          icon={<ShieldAlert />} 
          type="tasks" 
        />
      </div>

      {/* (Global empty state banner removed, as individual components handle empty states) */}

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALL VOLUME STACKED BAR CHART */}
        <div className="crm-card lg:col-span-2 relative flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="crm-h3">Call Volume</h3>
              <p className="crm-caption mt-1">Last 14 days (Stacked by agent)</p>
            </div>
            <BarChart3 size={20} className="text-neutral-muted" />
          </div>
          <div className="h-[350px] w-full flex-1 min-h-[300px]">
            {callVolumeData && callVolumeData.length > 0 && totalCallsVolume > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={100}>
                <BarChart data={callVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '16px', fontSize: '13px'}}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  {agentsArray.map((agent, i) => (
                    <Bar key={agent} dataKey={agent} stackId="a" fill={COLORS[i % COLORS.length]} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<PhoneCall size={40} />} title="No calls recorded yet" subtitle="Calls will appear here as your team makes and receives calls." />
            )}
          </div>
        </div>

        {/* LEAD SOURCE PIE CHART */}
        <div className="crm-card flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="crm-h3">Lead Distribution</h3>
              <p className="crm-caption mt-1">By Source</p>
            </div>
            <Layers size={20} className="text-neutral-muted" />
          </div>
          <div className="h-[250px] relative flex items-center justify-center flex-1 min-h-[200px]">
            {leadSourcesData && leadSourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={100}>
                <PieChart>
                  <Pie
                    data={leadSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {leadSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Target size={40} />} title="No source data" subtitle="Lead distribution will appear here once leads are assigned." />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 shrink-0">
            {leadSourcesData?.map((source, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-neutral-hover rounded-xl border border-neutral-border-default">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div className="min-w-0">
                  <p className="crm-caption truncate" style={{fontSize: '9px'}}>{source.name.replace('_', ' ')}</p>
                  <p className="text-[13px] font-[700] text-neutral-primary mt-0.5 leading-none">{source.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL & AGENT LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PIPELINE FUNNEL CHART */}
        <div className="crm-card relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="crm-h3">Conversion Funnel</h3>
            <Activity size={20} className="text-neutral-muted" />
          </div>
          {(!funnelData || funnelData.length === 0 || !funnelData.some(stage => stage.value > 0)) ? (
             <EmptyState icon={<Activity size={40} />} title="No lead data available yet" subtitle="Funnel will populate once leads move through pipeline stages." />
          ) : (
            <div className="space-y-6">
              {funnelData?.map((stage, i) => {
                const maxVal = funnelData.find(s => s.value > 0)?.value || 1;
                const percentage = stage.value > 0 ? Math.round((stage.value / maxVal) * 100) : 0;
                return (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between crm-label mb-2">
                      <span className="uppercase tracking-wider text-[11px] font-[700] text-neutral-secondary">{stage.name}</span>
                      <span className="font-[600] text-neutral-secondary">{stage.value} leads ({percentage}%)</span>
                    </div>
                    <div className="h-4 w-full bg-neutral-border-default rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-brand-accent rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LEADERBOARD TABLE */}
        <div className="crm-card lg:col-span-2 flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b border-neutral-border-default">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="crm-h3">Agent Leaderboard</h3>
                <p className="crm-caption mt-1">Top performing advisors</p>
              </div>
              <TrendingUp size={20} className="text-neutral-muted" />
            </div>
          </div>

          {sortedLeaderboard.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
               <EmptyState icon={<Users size={40} />} title="No agents in this team" subtitle="Ask your Admin to assign agents to see leaderboard." />
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Agent Name</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('callsMade')}>
                      Calls {sortField === 'callsMade' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('conversionRate')}>
                      Conv % {sortField === 'conversionRate' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('revenue')}>
                      Amount {sortField === 'revenue' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('avgQAScore')}>
                      QA Score {sortField === 'avgQAScore' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((agent, i) => (
                    <tr key={agent.id}>
                      <td className="flex items-center gap-3">
                        {agent.avatar ? (
                          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-lg" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-neutral-selected flex items-center justify-center text-xs font-[700] text-brand-accent">
                            {agent.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-[600] text-neutral-primary">{agent.name}</span>
                      </td>
                      <td className="font-[500]">{agent.callsMade}</td>
                      <td className="font-[600] text-brand-accent">{agent.conversionRate}%</td>
                      <td className="font-[600]">₹{agent.revenue.toLocaleString()}</td>
                      <td>
                        <span className={`crm-badge ${
                          agent.avgQAScore >= 80 ? 'crm-badge-success' :
                          agent.avgQAScore >= 65 ? 'crm-badge-warning' : 'crm-badge-error'
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

      {/* RECENT ACTIVITY FEED */}
      <div className="crm-card">
        <h3 className="crm-h3 mb-6">Recent Team Activity</h3>
        <div className="divide-y divide-neutral-border-default">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-neutral-selected text-brand-accent flex items-center justify-center shrink-0">
                    <Activity size={16} />
                  </div>
                  <div className="text-[14px]">
                    <span className="font-[600] text-neutral-primary">{activity.action}</span>
                    <span className="text-neutral-secondary"> on lead </span>
                    <span className="font-[500] text-brand-accent">{activity.leadName}</span>
                  </div>
                </div>
                <div className="crm-body-small font-[500]">
                  {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={<Activity size={40} />} title="No recent activities" subtitle="Team activities will be logged here." />
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subValue, icon, type }) => {
  const styles = {
    calls: "bg-[#eff6ff] text-[#3b82f6]",
    leads: "bg-[#f0fdf4] text-[#10b981]",
    conversion: "bg-[#fefce8] text-[#eab308]",
    revenue: "bg-[#fdf4ff] text-[#8b5cf6]",
    duration: "bg-[#fff7ed] text-[#f97316]",
    tasks: "bg-[#fef2f2] text-[#ef4444]",
    agents: "bg-[#eef2ff] text-[#5b5fcf]",
    teams: "bg-[#f0fdf4] text-[#10b981]"
  };

  const isOverdue = type === "tasks" && subValue;

  return (
    <div className="crm-card flex flex-col justify-between h-[160px] p-[22px]">
       <div className="flex items-center justify-between">
         <div className={`w-[46px] h-[46px] rounded-[12px] flex items-center justify-center ${styles[type] || styles.calls}`}>
            {React.cloneElement(icon, { size: 22 })}
         </div>
         {isOverdue && (
           <span className="crm-badge crm-badge-error text-[10px] uppercase tracking-wider animate-pulse">
             Overdue
           </span>
         )}
       </div>
       <div className="mt-4">
         <h4 className="text-[30px] font-[800] tracking-[-1px] text-[#0f172a] leading-none flex items-baseline gap-2">
           {value}
           {subValue && (
             <span className="text-[12px] font-[600] text-status-danger leading-none tracking-normal">{subValue}</span>
           )}
         </h4>
         <p className="crm-caption mt-[6px]">{title}</p>
       </div>
    </div>
  );
};

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
    <div className="text-[#818cf8] mb-4 opacity-80">
      {icon}
    </div>
    <h4 className="text-[18px] font-[600] text-neutral-primary">{title}</h4>
    <p className="text-[14px] text-neutral-muted mt-2 max-w-sm">{subtitle}</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8 p-4 md:p-0">
    <div className="h-[72px] crm-skeleton rounded-2xl w-full" />
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
       {[1,2,3,4,5,6].map(i => <div key={i} className="h-[160px] crm-skeleton rounded-[16px]" />)}
    </div>
    <div className="grid grid-cols-3 gap-8">
       <div className="col-span-2 h-[450px] crm-skeleton rounded-[16px]" />
       <div className="h-[450px] crm-skeleton rounded-[16px]" />
    </div>
  </div>
);

export default ManagerDashboard;
