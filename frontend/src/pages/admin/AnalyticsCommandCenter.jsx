import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Zap, 
  Calendar, 
  ArrowUpRight, 
  Download,
  Sparkles,
  PhoneCall,
  ChevronRight,
  PieChart as PieIcon,
  Clock,
  ShieldCheck,
  Target,
  ChevronDown,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format, subDays, startOfMonth, subMonths, endOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { exportToPDF } from '../../utils/exportUtils';

// Presets
const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'thisYear', label: 'This Year' }
];

const AnalyticsCommandCenter = () => {
  const [period, setPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState(0); // 0=idle, 1=generating, 2=sending, 3=done
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const datePickerRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getQueryObj = () => {
    if (period === 'custom' && dateRange.start && dateRange.end) {
      return { startDate: dateRange.start, endDate: dateRange.end };
    }
    return { period };
  };

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['adminAnalytics', period, dateRange],
    queryFn: async () => {
      const q = getQueryObj();
      let url = '/admin/analytics';
      if (q.startDate) url += `?startDate=${q.startDate}&endDate=${q.endDate}`;
      else url += `?period=${q.period}`;
      const res = await api.get(url);
      return res.data.data;
    }
  });

  const handleExport = async () => {
    if (!analytics) {
      toast.error('No analytics data available to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportStep(1); // Generating report...

      const { kpis, agentLeaderboard } = analytics;

      const headers = ['Metric', 'Value'];
      const data = [
        ['Platform Revenue', kpis?.platformRevenue || '₹0'],
        ['Pipeline Value', kpis?.pipelineValue || '₹0'],
        ['Avg Conversion', kpis?.avgConversion || '0%'],
        ['AI Efficiency', kpis?.aiEfficiency || '0%'],
        ['Total Calls', kpis?.totalCalls || '0']
      ];

      // Add leaderboard to the same export or separate
      if (agentLeaderboard && agentLeaderboard.length > 0) {
        data.push(['---', '---']);
        data.push(['Top Agents', 'Win Rate']);
        agentLeaderboard.forEach(agent => {
          data.push([agent.name, agent.conversion]);
        });
      }
      
      exportToPDF('Business Overview Analytics', headers, data, 'analytics_command_center_report');
      
      setExportStep(3); // Done
      toast.success("Report exported successfully as PDF!");
      setTimeout(() => {
        setIsExporting(false);
        setExportStep(0);
      }, 2000);

    } catch (error) {
      setIsExporting(false);
      setExportStep(0);
      toast.error('Failed to export report');
    }
  };

  const handlePresetSelect = (presetId) => {
    const today = new Date();
    let start, end;
    
    end = format(today, 'yyyy-MM-dd');
    
    switch(presetId) {
      case 'today':
        start = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        start = format(yesterday, 'yyyy-MM-dd');
        end = format(yesterday, 'yyyy-MM-dd');
        break;
      case '7d':
        setPeriod('7d');
        setShowDatePicker(false);
        return;
      case '30d':
        setPeriod('30d');
        setShowDatePicker(false);
        return;
      case 'thisMonth':
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastM = subMonths(today, 1);
        start = format(startOfMonth(lastM), 'yyyy-MM-dd');
        end = format(endOfMonth(lastM), 'yyyy-MM-dd');
        break;
      case 'thisQuarter':
        start = format(startOfQuarter(today), 'yyyy-MM-dd');
        break;
      case 'thisYear':
        start = format(startOfYear(today), 'yyyy-MM-dd');
        break;
    }
    
    setPeriod('custom');
    setDateRange({ start, end });
    setShowDatePicker(false);
  };

  const Skeleton = () => (
    <div className="space-y-12 pb-16 animate-pulse">
       <div className="h-20 bg-slate-200 rounded-[24px]"></div>
       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-slate-200 rounded-[32px]"></div>)}
       </div>
       <div className="h-[400px] bg-slate-200 rounded-[48px]"></div>
    </div>
  );

  if (isLoading && !analytics) return <Skeleton />;

  const { revenueData, leadSourceData, agentLeaderboard, activityFeed, kpis } = analytics || {};

  const COLORS = ['#2563EB', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'];

  // Export Modal Overlay
  const ExportOverlay = () => (
    <AnimatePresence>
      {isExporting && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-sm flex flex-col items-center text-center"
          >
            {exportStep === 1 && <FileText className="text-blue-500 mb-4 animate-bounce" size={48} />}
            {exportStep === 2 && <Zap className="text-amber-500 mb-4 animate-pulse" size={48} />}
            {exportStep === 3 && <CheckCircle2 className="text-emerald-500 mb-4" size={48} />}
            
            <h3 className="text-xl font-black text-[#0F172A] tracking-tight mb-2">
              {exportStep === 1 ? 'Generating Report...' : exportStep === 2 ? 'Sending Securely...' : 'Report Sent!'}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {exportStep === 1 ? 'Compiling latest analytics and charts.' : exportStep === 2 ? 'Encrypting and delivering via email.' : 'Please check your inbox.'}
            </p>
            
            {exportStep < 3 && (
              <div className="w-full bg-slate-100 h-2 rounded-full mt-8 overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 bottom-0 bg-blue-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: exportStep === 1 ? '50%' : '95%' }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-10 pb-16 font-sans relative">
      <ExportOverlay />

      {/* 1. TOP SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-violet-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-violet-200">Executive View</div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                 System Online
              </span>
           </div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Business Overview</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Comprehensive analytics and enterprise health monitoring.</p>
        </div>

        <div className="flex items-center gap-4">
           {/* Date Range Picker */}
           <div className="relative" ref={datePickerRef}>
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-12 px-5 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-700 flex items-center gap-3 hover:bg-slate-50 transition-all"
              >
                 <Calendar size={18} className="text-blue-600" />
                 {period === 'custom' ? `${dateRange.start} to ${dateRange.end}` : DATE_PRESETS.find(p => p.id === period)?.label || 'Select Date'}
                 <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showDatePicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 p-4"
                  >
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {DATE_PRESETS.map(p => (
                        <button 
                          key={p.id} onClick={() => handlePresetSelect(p.id)}
                          className="px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Custom Range</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={dateRange.start || ''}
                          onChange={e => setDateRange({...dateRange, start: e.target.value})}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-slate-400 text-xs">to</span>
                        <input 
                          type="date" 
                          value={dateRange.end || ''}
                          onChange={e => setDateRange({...dateRange, end: e.target.value})}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => { setPeriod('custom'); setShowDatePicker(false); }}
                        disabled={!dateRange.start || !dateRange.end}
                        className="w-full mt-3 h-9 bg-[#0F172A] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Quick Fast Filters (Desktop Only) */}
           <div className="hidden lg:flex bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm h-12 items-center">
             {[
               { id: '7d', label: '7D' },
               { id: '30d', label: '30D' },
               { id: '90d', label: '90D' },
               { id: '1y', label: '1Y' }
             ].map(p => (
               <button 
                 key={p.id}
                 onClick={() => setPeriod(p.id)}
                 className={`h-full px-4 rounded-lg text-xs font-bold transition-all ${period === p.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
               >
                 {p.label}
               </button>
             ))}
           </div>

           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="h-12 px-6 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-blue-600/30 transition-all disabled:opacity-50"
           >
              {isExporting ? <Clock className="animate-spin" size={16} /> : <Download size={16} />} 
              Export Report
           </button>
        </div>
      </div>

      {/* QUICK KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         {[
           { label: 'Platform Revenue', value: kpis?.platformRevenue || '₹0', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
           { label: 'Pipeline Value', value: kpis?.pipelineValue || '₹0', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
           { label: 'Avg Conversion', value: kpis?.avgConversion || '0%', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
           { label: 'AI Performance', value: kpis?.aiEfficiency || '0%', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
           { label: 'Total Calls', value: kpis?.totalCalls || '0', icon: PhoneCall, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
         ].map((kpi, i) => (
           <motion.div 
             key={i}
             whileHover={{ y: -4 }}
             className={`bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:${kpi.border} transition-all group cursor-default`}
           >
              <div className="flex items-center gap-4 mb-4">
                 <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                    <kpi.icon size={20} strokeWidth={2.5} />
                 </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">{kpi.value}</h2>
           </motion.div>
         ))}
      </div>

      {/* 2. SECOND SECTION: ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* REVENUE ANALYTICS */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-100/50 transition-colors duration-1000" />
            <div className="relative z-10 flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Revenue Analytics</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Growth projection over selected period</p>
               </div>
               <BarChart3 size={24} className="text-slate-200" />
            </div>
            
            {revenueData && revenueData.length > 0 ? (
              <div className="relative z-10 h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} minTickGap={20} />
                       <YAxis hide />
                       <Tooltip 
                          cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                          contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px'}}
                          itemStyle={{fontWeight: 900, color: '#0F172A', fontSize: '16px'}}
                          labelStyle={{fontSize: '11px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}
                          formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                       />
                       <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center flex-col text-slate-400">
                <BarChart3 size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No revenue data for this period</p>
              </div>
            )}
         </div>

         {/* LEAD SOURCES */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Lead Sources</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acquisition channels</p>
               </div>
               <PieIcon size={24} className="text-slate-200" />
            </div>
            
            {leadSourceData && leadSourceData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={leadSourceData}
                             cx="50%"
                             cy="50%"
                             innerRadius={65}
                             outerRadius={95}
                             paddingAngle={6}
                             dataKey="value"
                             stroke="none"
                             cornerRadius={8}
                          >
                             {leadSourceData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                             itemStyle={{fontWeight: 900}}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="w-full mt-6 space-y-3">
                    {leadSourceData.map((source, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{source.name.replace('_', ' ')}</span>
                         </div>
                         <span className="text-sm font-black text-[#0F172A]">{source.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                 <Target size={48} className="mb-4 opacity-20" />
                 <p className="font-bold">No leads tracked</p>
              </div>
            )}
         </div>
      </div>

      {/* 3. THIRD SECTION: TEAMS & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* TEAM LEADERBOARD */}
         <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Teams Performance</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Top converting agents</p>
               </div>
               <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
            </div>

            {agentLeaderboard && agentLeaderboard.length > 0 ? (
              <div className="space-y-2 flex-1">
                 {agentLeaderboard.map((agent, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-[20px] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 group-hover:bg-[#0F172A] group-hover:text-white transition-all shadow-sm text-sm">
                            {agent.avatar}
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-[#0F172A]">{agent.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{agent.deals} Won Deals</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Rate</p>
                            <p className="text-sm font-black text-emerald-600">{agent.conversion}</p>
                         </div>
                         <div className="w-20">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                            <p className="text-sm font-black text-[#0F172A]">{agent.revenue}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm">No active agents found in this period.</p>
              </div>
            )}
         </div>

         {/* AI INSIGHTS */}
         <div className="bg-[#0F172A] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group flex flex-col">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-violet-600/30 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-2xl text-violet-400 backdrop-blur-md">
                        <Sparkles size={20} />
                     </div>
                     <div>
                       <h3 className="text-xl font-black tracking-tight">AI Insights</h3>
                       <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mt-0.5">Automated AI Analysis</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  {[
                    { title: 'Conversion Anomaly', text: 'Lead conversion rate dropped by 4% compared to last week. Call volume remains stable.', tag: 'ALERT' },
                    { title: 'Revenue Forecast', text: 'Based on current pipeline velocity, projected revenue for next 30 days is ₹125K.', tag: 'PREDICTION' },
                    { title: 'Agent Coaching', text: 'Analysis of last 50 calls shows agents need improvement in objection handling.', tag: 'RECOMMENDATION' }
                  ].map((insight, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm group/card">
                       <div className="flex justify-between items-center mb-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${insight.tag === 'ALERT' ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-300'}`}>{insight.tag}</span>
                          <ArrowUpRight size={14} className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
                       </div>
                       <h4 className="text-sm font-bold mb-2 text-white">{insight.title}</h4>
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight.text}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 4. FOURTH SECTION: ACTIVITY FEED */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-[#0F172A] tracking-tight">System Activity</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live CRM Audit Trail</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <Activity size={12} className="text-emerald-500" /> Live Feed
            </div>
         </div>

         {activityFeed && activityFeed.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex gap-4 items-start p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 hover:border-slate-200 transition-all">
                   <div className="p-3 rounded-2xl bg-white border border-slate-100 text-blue-500 shadow-sm shrink-0">
                      <Activity size={16} />
                   </div>
                   <div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">
                         <b className="text-[#0F172A]">{item.user}</b> {item.action} <b className="text-[#0F172A]">{item.target}</b>
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                         {item.time ? formatDistanceToNow(new Date(item.time), {addSuffix: true}) : 'Just now'}
                      </p>
                   </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="py-12 flex flex-col items-center justify-center text-slate-400">
             <Activity size={48} className="mb-4 opacity-20" />
             <p className="font-bold text-sm">No recent activity found.</p>
           </div>
         )}
      </div>

    </div>
  );
};

export default AnalyticsCommandCenter;
