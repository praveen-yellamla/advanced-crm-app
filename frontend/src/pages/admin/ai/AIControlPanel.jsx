import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';
import { 
  Zap, 
  BrainCircuit, 
  Cpu, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  Send,
  Sparkles,
  RefreshCcw,
  Activity,
  Coins,
  Terminal,
  Eraser,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Settings2,
  Loader2,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock,
  Zap as ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// ================================================
// STATUS BADGE COMPONENT
// ================================================
const StatusBadge = ({ status }) => {
  const configs = {
    ONLINE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Online', icon: Wifi },
    CONFIGURED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Key Set — Not Validated', icon: Clock },
    OFFLINE: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Offline — No Key', icon: WifiOff },
  };
  const cfg = configs[status] || configs.OFFLINE;
  const Icon = cfg.icon;
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot} ${status === 'ONLINE' ? 'animate-pulse' : ''}`} />
      <Icon size={13} className={cfg.text} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
};

// ================================================
// FEATURE TOGGLE CARD
// ================================================
const FeatureCard = ({ module, value, onToggle, isPending }) => {
  const active = value === true || value === 'true';
  const Icon = module.icon;
  
  return (
    <motion.div
      layout
      className={`relative p-7 rounded-[36px] border transition-all duration-500 overflow-hidden group ${
        active 
          ? 'bg-[#0F172A] border-[#0F172A] shadow-2xl shadow-slate-900/30' 
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg'
      }`}
    >
      {active && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />
      )}
      
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-100 text-slate-400'
          }`}>
            <Icon size={22} />
          </div>
          <div>
            <h4 className={`text-base font-black tracking-tight ${active ? 'text-white' : 'text-[#0F172A]'}`}>
              {module.label}
            </h4>
            <p className={`text-[11px] font-bold mt-1 leading-relaxed max-w-[200px] ${active ? 'text-slate-400' : 'text-slate-400'}`}>
              {module.desc}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onToggle(!active)}
          disabled={isPending}
          className={`relative w-14 h-7 rounded-full transition-all duration-500 flex-shrink-0 mt-1 ${
            active ? 'bg-blue-500' : 'bg-slate-200'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <motion.div
            animate={{ x: active ? 28 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
          />
        </button>
      </div>
      
      {active && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Module Active</span>
        </div>
      )}
    </motion.div>
  );
};

// ================================================
// MAIN COMPONENT
// ================================================
const AIControlPanel = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ops');
  const [isValidating, setIsValidating] = useState(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory]);

  // ============================================
  // DATA FETCHING
  // ============================================
  const { data: settings = {}, isLoading: settingsLoading } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const res = await api.get('/ai/settings');
      return res.data.data || {};
    },
    retry: 2
  });

  const { data: aiStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const res = await api.get('/ai/status');
      return res.data.data;
    },
    refetchInterval: 60000
  });

  const { data: usageData } = useQuery({
    queryKey: ['aiUsage'],
    queryFn: async () => {
      const res = await api.get('/ai/usage');
      return res.data.data;
    },
    refetchInterval: 30000
  });

  // ============================================
  // MUTATIONS
  // ============================================
  const updateSetting = useMutation({
    mutationFn: (payload) => api.patch('/ai/settings', payload),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['aiSettings'] });
      const prev = queryClient.getQueryData(['aiSettings']);
      queryClient.setQueryData(['aiSettings'], old => ({ ...old, [key]: value }));
      return { prev };
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData(['aiSettings'], ctx.prev);
      toast.error(err.response?.data?.message || 'Failed to update AI setting.');
    },
    onSuccess: () => {
      toast.success('AI configuration saved.');
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
    }
  });

  const chatMutation = useMutation({
    mutationFn: (data) => api.post('/ai/chat', data),
    onSuccess: (res) => {
      const content = res.data.data || res.data.results;
      setChatHistory(prev => [...prev, { role: 'assistant', content }]);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Intelligence core error.';
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${msg}`,
        isError: true
      }]);
    }
  });

  // ============================================
  // HANDLERS
  // ============================================
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMsg = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMsg]);
    chatMutation.mutate({ message, history: chatHistory });
    setMessage('');
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    try {
      const res = await api.post('/ai/validate-key');
      toast.success(res.data.message || 'API key validated successfully!');
      await refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'API key validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleToggleFeature = (key, value) => {
    updateSetting.mutate({ key, value });
  };

  // ============================================
  // FEATURE MODULES
  // ============================================
  const featureModules = [
    {
      id: 'AI_ENABLED',
      label: 'AI Core Engine',
      desc: 'Master toggle for all cognitive CRM functions.',
      icon: Zap
    },
    {
      id: 'AI_LEAD_SCORING',
      label: 'Lead Score Predictor',
      desc: 'Predict conversion rates using ML pipeline.',
      icon: BrainCircuit
    },
    {
      id: 'AI_CALL_TRANSCRIPTS',
      label: 'Call Transcription',
      desc: 'Auto-transcribe call recordings to structured logs.',
      icon: Cpu
    },
    {
      id: 'AI_SENTIMENT_ANALYSIS',
      label: 'Sentiment Detector',
      desc: 'Real-time agent-customer mood analysis.',
      icon: Activity
    },
    {
      id: 'AI_SALES_COACHING',
      label: 'Sales Coaching AI',
      desc: 'Automated QA scorecards for agent performance.',
      icon: ShieldCheck
    },
    {
      id: 'AI_FOLLOWUP_SUGGESTIONS',
      label: 'Follow-Up Generator',
      desc: 'AI-powered next-best-action suggestions.',
      icon: Sparkles
    },
  ];

  const systemStatus = aiStatus?.status || 'OFFLINE';

  if (settingsLoading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">
        Initializing AI Orchestration...
      </span>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      
      {/* ========== HEADER ========== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Intelligence Operations Center</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none mb-2">
            AI Control <span className="text-slate-200">Suite</span>
          </h1>
          <p className="text-[#64748B] font-bold text-sm tracking-tight">
            Gemini-powered cognitive orchestration across CRM telemetry
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 flex-wrap">
          <StatusBadge status={systemStatus} />

          {/* Tab Switcher */}
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex">
            {['ops', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'ops' ? <Activity size={14} /> : <BarChart3 size={14} />}
                {tab === 'ops' ? 'Operations' : 'Analytics'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== STATUS BANNER ========== */}
      <AnimatePresence mode="wait">
        {systemStatus !== 'ONLINE' && (
          <motion.div
            key="status-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border ${
              systemStatus === 'CONFIGURED'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                systemStatus === 'CONFIGURED' ? 'bg-amber-500' : 'bg-slate-400'
              }`}>
                {systemStatus === 'CONFIGURED' ? <Key size={22} /> : <WifiOff size={22} />}
              </div>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${
                  systemStatus === 'CONFIGURED' ? 'text-amber-950' : 'text-slate-700'
                }`}>
                  {systemStatus === 'CONFIGURED'
                    ? 'API Key Configured — Validation Pending'
                    : 'AI Engine Offline — No API Key Configured'}
                </h4>
                <p className={`text-[11px] font-bold leading-normal mt-0.5 ${
                  systemStatus === 'CONFIGURED' ? 'text-amber-800' : 'text-slate-500'
                }`}>
                  {systemStatus === 'CONFIGURED'
                    ? 'Your Gemini API key is set but has not been validated yet. Click "Validate Key" to activate real AI.'
                    : 'Add your Gemini API key in AI Settings below or in Admin Settings → AI Features to enable real-time orchestration.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              {systemStatus === 'CONFIGURED' && (
                <button
                  onClick={handleValidateKey}
                  disabled={isValidating}
                  className="px-6 py-2.5 bg-amber-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-900 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {isValidating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Validate Key
                </button>
              )}
              <button
                onClick={() => window.location.href = '/admin/settings/ai'}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shrink-0 shadow-sm ${
                  systemStatus === 'CONFIGURED'
                    ? 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                    : 'bg-[#0F172A] text-white hover:bg-slate-800'
                }`}
              >
                <Settings2 size={13} className="inline mr-1.5" />
                Configure Keys
              </button>
            </div>
          </motion.div>
        )}

        {systemStatus === 'ONLINE' && (
          <motion.div
            key="status-online"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[28px] bg-emerald-50 border border-emerald-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">
                  Gemini AI Orchestration Active
                </p>
                <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                  Last validated: {aiStatus?.lastValidated
                    ? new Date(aiStatus.lastValidated).toLocaleString()
                    : 'Just now'} · Model: {aiStatus?.model || 'gemini-2.0-flash'}
                </p>
              </div>
            </div>
            <button
              onClick={handleValidateKey}
              disabled={isValidating}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isValidating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
              Re-validate
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MAIN GRID ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: MODULES & STATS */}
        <div className="lg:col-span-8 space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'ops' ? (
              <motion.div
                key="ops"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Feature Toggles */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight italic">
                      Feature Modules
                    </h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {featureModules.filter(m => settings[m.id] === true || settings[m.id] === 'true').length}/{featureModules.length} Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {featureModules.map(module => (
                      <FeatureCard
                        key={module.id}
                        module={module}
                        value={settings[module.id]}
                        onToggle={(val) => handleToggleFeature(module.id, val)}
                        isPending={updateSetting.isPending}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Usage Widget */}
                <div className="bg-[#0F172A] p-10 rounded-[50px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10 -ml-24 -mb-24" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">
                        Live Token Pool Usage
                      </span>
                      <span className="px-3 py-1.5 bg-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Resets Monthly
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div>
                        <div className="flex items-baseline gap-4">
                          <h3 className="text-6xl font-black text-white italic tracking-tighter">
                            {Math.round((usageData?.totalTokens || 0) / 1000)}k
                          </h3>
                          <span className="text-slate-400 font-bold uppercase text-xs">/ 1M Limit</span>
                        </div>
                        <div className="mt-4 w-full md:w-64 bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min((usageData?.totalTokens || 0) / 10000, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-10">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Hits</p>
                          <p className="text-2xl font-black text-white">{usageData?.requestCount || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Cost</p>
                          <p className="text-2xl font-black text-emerald-400">
                            ₹{((usageData?.totalCost || 0) * 84).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Today</p>
                          <p className="text-2xl font-black text-blue-400">
                            {aiStatus?.todayRequests || 0} req
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Usage Trend Chart */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-[#0F172A] italic uppercase tracking-tight flex items-center gap-3">
                      <TrendingUp size={20} className="text-blue-600" /> Intelligence Trends
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 7 Days</span>
                  </div>
                  {usageData?.trend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={usageData.trend}>
                        <defs>
                          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="createdAt" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                        />
                        <Area type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex flex-col items-center justify-center text-center opacity-40">
                      <BarChart3 size={48} className="text-slate-200 mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        No usage data yet — start using AI features
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-5">
                  {[
                    { label: 'Total Tokens', value: `${Math.round((usageData?.totalTokens || 0) / 1000)}k`, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Requests', value: usageData?.requestCount || 0, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Cost', value: `₹${((usageData?.totalCost || 0) * 84).toFixed(2)}`, icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm">
                      <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                        <stat.icon size={18} />
                      </div>
                      <p className="text-2xl font-black text-[#0F172A] italic">{stat.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: ZIA ASSISTANT */}
        <div className="lg:col-span-4 h-[780px]">
          <div className="bg-white h-full rounded-[50px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            {/* Chat Header */}
            <div className="p-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F172A] tracking-tight">Zia Intelligence</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      systemStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {systemStatus === 'ONLINE' ? 'Gemini Live' : 'Simulation Mode'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatHistory([])}
                className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50"
              >
                <Eraser size={16} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-7 space-y-5 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-4">
                  <BrainCircuit size={56} className="text-slate-200" />
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest max-w-[200px]">
                      Ask Zia anything about your CRM data
                    </p>
                    {systemStatus !== 'ONLINE' && (
                      <p className="text-[10px] text-slate-300 mt-2 font-bold">
                        Running in simulation mode
                      </p>
                    )}
                  </div>
                  {/* Quick prompts */}
                  <div className="flex flex-col gap-2 w-full max-w-[220px] mt-2">
                    {['Summarize today\'s leads', 'Top agents this week', 'Analyze pipeline health'].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setMessage(prompt);
                        }}
                        className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {chatHistory.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] p-5 rounded-[28px] text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#0F172A] text-white rounded-tr-none'
                      : msg.isError
                        ? 'bg-rose-50 text-rose-600 border border-rose-100 rounded-tl-none'
                        : 'bg-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 p-5 rounded-[28px] rounded-tl-none flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-7 bg-slate-50 border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about pipeline, leads, performance..."
                  className="w-full h-14 pl-5 pr-16 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-600 focus:shadow-lg transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                />
                <button
                  disabled={chatMutation.isPending || !message.trim()}
                  type="submit"
                  className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {chatMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="text-[9px] font-bold text-slate-400 text-center mt-3 uppercase tracking-[0.2em]">
                {systemStatus === 'ONLINE' ? '🟢 Gemini Live Intelligence' : '🟡 Simulation Mode Active'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIControlPanel;
