import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, BarChart3, Clock, TrendingUp, DollarSign, Calendar, ChevronDown, ChevronUp, Download, Eye, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { exportToPDF } from '../../utils/exportUtils';

const TeamAnalytics = () => {
  const [period, setPeriod] = useState('month');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [expandedAgent, setExpandedAgent] = useState(null);

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // 1. Fetch full team agents list (always full for dropdown)
  const { data: agents = [] } = useQuery({
    queryKey: ['managerAgentsList'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 2. Fetch team analytics data (Performance Cards)
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['teamAnalytics', period, selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/manager/analytics?period=${period}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`);
      return res.data.data;
    }
  });

  // 3. Fetch Talk Time Heatmap
  const { data: talkTimeHeatmap = [] } = useQuery({
    queryKey: ['talkTimeHeatmap', period, selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/manager/analytics/talk-time?period=${period}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`);
      return res.data.data;
    }
  });

  // 4. Fetch Conversion Comparison
  const { data: conversionComparison } = useQuery({
    queryKey: ['conversionComparison', period, selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/manager/analytics/conversion-comparison?period=${period}${selectedAgentId ? `&agentId=${selectedAgentId}` : ''}`);
      return res.data.data;
    }
  });

  useEffect(() => {
    if (!socket) return;

    const handleAgentAdded = (data) => {
      console.log('[SOCKET] agent:added received:', data);
      toast.success(`Agent ${data.agent.name} added to your team!`);
      queryClient.setQueryData(['managerAgentsList'], (old) => {
        if (!old) return [data.agent];
        if (old.some(a => a.id === data.agent.id)) return old;
        return [...old, data.agent];
      });
      queryClient.invalidateQueries({ queryKey: ['teamAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['talkTimeHeatmap'] });
      queryClient.invalidateQueries({ queryKey: ['conversionComparison'] });
    };

    const handleAgentDeactivated = (data) => {
      console.log('[SOCKET] agent:deactivated received:', data);
      toast.error(`Agent deactivated.`);
      queryClient.setQueryData(['managerAgentsList'], (old) => {
        if (!old) return [];
        return old.filter(a => a.id !== data.agent_id);
      });
      queryClient.invalidateQueries({ queryKey: ['teamAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['talkTimeHeatmap'] });
      queryClient.invalidateQueries({ queryKey: ['conversionComparison'] });
    };

    socket.on('agent:added', handleAgentAdded);
    socket.on('agent:joined_team', handleAgentAdded);
    socket.on('agent:deactivated', handleAgentDeactivated);
    socket.on('agent:left_team', handleAgentDeactivated);

    return () => {
      socket.off('agent:added', handleAgentAdded);
      socket.off('agent:joined_team', handleAgentAdded);
      socket.off('agent:deactivated', handleAgentDeactivated);
      socket.off('agent:left_team', handleAgentDeactivated);
    };
  }, [socket, queryClient]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    toast.success(`Period changed to ${newPeriod}`);
  };

  const { agents: analyticsAgents } = analyticsData || {};

  const handleExport = () => {
    if (!analyticsAgents || analyticsAgents.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      const headers = ['Agent Name', 'Status', 'Calls Made', 'Conversion Rate', 'Talk Time (min)', 'Avg Handle Time (min)', 'Revenue MTD (₹)'];
      const data = analyticsAgents.map(agent => [
        agent.name,
        agent.status,
        agent.callsMade,
        `${agent.conversionRate}%`,
        agent.talkTime,
        agent.avgHandleTime,
        agent.revenue
      ]);

      exportToPDF('Team Analytics Report', headers, data, 'team_analytics_report');
      toast.success('Analytics report exported as PDF successfully!');
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-16 bg-slate-100 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // Mock Expanded Agent Daily Data
  const mockDailyData = [
    { date: 'Mon', calls: 12, revenue: 15000 },
    { date: 'Tue', calls: 19, revenue: 24000 },
    { date: 'Wed', calls: 15, revenue: 12000 },
    { date: 'Thu', calls: 22, revenue: 48000 },
    { date: 'Fri', calls: 25, revenue: 75000 },
    { date: 'Sat', calls: 8, revenue: 95000 },
    { date: 'Sun', calls: 3, revenue: 0 }
  ];

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Analytics</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Deep-dive performance evaluations, heatmaps, and talk time diagnostics.</p>
        </div>
        
        {/* DATE SELECTOR & EXPORT */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
            {['today', 'week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                  period === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* FILTER DROPDOWN */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Users size={16} /> Filter by Advisor:
        </div>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="w-48 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Team Members</option>
          {agents?.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* PER-AGENT PERFORMANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {analyticsAgents?.map(agent => {
          const isExpanded = expandedAgent === agent.id;
          return (
            <motion.div
              layout
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {agent.avatar ? (
                      <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-900 leading-snug">{agent.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-400 leading-none">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <Award size={20} className="text-slate-300" />
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Calls Made</span>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{agent.callsMade}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Conversion %</span>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{agent.conversionRate}%</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Talk Time (Min)</span>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{agent.talkTime}m</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Avg Handle Time</span>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{agent.avgHandleTime}m</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Revenue MTD</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">₹{agent.revenue.toLocaleString()}</p>
                </div>

                <button
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  {isExpanded ? (
                    <>Collapse daily chart <ChevronUp size={14} /></>
                  ) : (
                    <>Expand daily chart <ChevronDown size={14} /></>
                  )}
                </button>
              </div>

              {/* COLLAPSIBLE CHART FOR THAT AGENT */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-slate-100 bg-slate-50/50 overflow-hidden"
                  >
                    <div className="p-6 h-[200px]">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Daily Revenue (Weekly Spread)</h4>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={mockDailyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 9}} />
                          <YAxis hide />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                          <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="#EEF2FF" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* HEATMAP & ATTRIBUTION STACKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TALK TIME HEATMAP */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Talk Time Heatmap</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accumulated talk time (minutes) per day of week</p>
            </div>
            <Clock size={20} className="text-slate-300" />
          </div>
          <div className="h-[250px]">
            {talkTimeHeatmap && talkTimeHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={talkTimeHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)'}} />
                  <Bar dataKey="talkTime" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No heatmap metrics logged yet.</div>
            )}
          </div>
        </div>

        {/* COMPARATIVE ATTRIBUTION */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Conversion Comparison</h3>
              <TrendingUp size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-xs mb-8">Comparison of current active conversions versus the previous performance period.</p>
            
            <div className="flex flex-col items-center justify-center my-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Team Conversion Rate</span>
              <span className="text-4xl font-black text-slate-950 mt-1">{conversionComparison?.current?.rate ?? 0}%</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-xs font-bold ${conversionComparison?.change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {conversionComparison?.change_percent >= 0 ? '+' : ''}{conversionComparison?.change_percent ?? 0}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">vs last period ({conversionComparison?.previous?.rate ?? 0}%)</span>
              </div>
            </div>

            <div className="space-y-6">
              {analyticsAgents?.slice(0, 3).map((agent, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>{agent.name}</span>
                    <span>{agent.conversionRate}% vs 55% target</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                    <div className="bg-indigo-600 h-full rounded-l-full" style={{ width: `${agent.conversionRate}%` }} />
                    <div className="bg-emerald-400 h-full rounded-r-full" style={{ width: `55%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
            <DollarSign size={20} className="text-indigo-600" />
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-900">Revenue Attribution</p>
              <p className="text-[9px] text-indigo-700 font-bold uppercase mt-0.5">Top conversion source: google_ads (44%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalytics;
