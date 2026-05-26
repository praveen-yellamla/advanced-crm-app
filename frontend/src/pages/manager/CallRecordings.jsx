import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Play, Pause, Headphones, Search, Filter, MessageSquare, ShieldCheck, Flag, Clock, User, Download, Plus, Eye, Zap, AlertTriangle, AlertCircle, FileText, CheckCircle2, XCircle, ChevronRight, BarChart3, SkipForward, FastForward, Activity, X, Sparkles, TrendingUp, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CallRecordings = () => {
  const [selectedCall, setSelectedCall] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [agentId, setAgentId] = useState('');
  const [smartFilter, setSmartFilter] = useState('ALL'); // ALL, NEEDS_COACHING, HIGH_RISK, ANGRY
  
  // Panel state
  const [annotationNote, setAnnotationNote] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  const audioRef = useRef(null);

  // 1. Fetch Calls
  const { data: callsData, isLoading: isCallsLoading, refetch } = useQuery({
    queryKey: ['managerCalls', agentId, search],
    queryFn: async () => {
      const res = await api.get(`/manager/calls?agentId=${agentId}&search=${search}`);
      return res.data.data;
    }
  });

  // 2. Fetch Agents (for dropdown)
  const { data: agentsData } = useQuery({
    queryKey: ['managerAgentsList'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 3. Mutation: Add Annotation
  const addAnnotationMutation = useMutation({
    mutationFn: async ({ callId, timestamp, note }) => {
      const res = await api.post(`/manager/calls/${callId}/annotate`, { timestamp, note });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Annotation saved');
      setAnnotationNote('');
      refetch();
    }
  });

  // 4. Mutation: Flag Call
  const flagCallMutation = useMutation({
    mutationFn: async ({ callId, reason }) => {
      const res = await api.post(`/manager/calls/${callId}/flag`, { reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Call escalated to review');
      setShowFlagModal(false);
      setFlagReason('');
      refetch();
    }
  });

  // Audio Handlers
  const handlePlayCall = (call, e) => {
    if (e) e.stopPropagation();
    if (selectedCall?.id !== call.id) {
      setSelectedCall(call);
      setIsPlaying(true);
      setPlaybackProgress(0);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = call.recordingUrl || '';
          audioRef.current.play().catch(console.error);
        }
      }, 100);
    } else {
      handleTogglePlay();
    }
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlaybackProgress(progress || 0);
    }
  };

  const handleSaveAnnotation = () => {
    if (!annotationNote) return;
    const currentTimestamp = audioRef.current ? audioRef.current.currentTime : 0;
    addAnnotationMutation.mutate({
      callId: selectedCall.id,
      timestamp: currentTimestamp,
      note: annotationNote
    });
  };

  const handleFlagCall = () => {
    if (!flagReason) return;
    flagCallMutation.mutate({
      callId: selectedCall.id,
      reason: flagReason
    });
  };

  // KPIs
  const kpis = useMemo(() => {
    if (!callsData) return { total: 0, avgQa: 0, risk: 0, compliance: 0 };
    const qaScores = callsData.map(c => c.qaScore?.total).filter(Boolean);
    const avgQa = qaScores.length ? Math.round(qaScores.reduce((a,b)=>a+b,0)/qaScores.length) : 0;
    const riskCalls = callsData.filter(c => c.sentiment === 'NEGATIVE' || c.tags?.includes('FLAGGED')).length;
    // Mock compliance based on QA > 70
    const compliant = callsData.filter(c => (c.qaScore?.total || 100) >= 70).length;
    const compliancePct = callsData.length ? Math.round((compliant / callsData.length) * 100) : 100;
    
    return {
      total: callsData.length,
      avgQa,
      risk: riskCalls,
      compliance: compliancePct
    };
  }, [callsData]);

  // Derived filtered data
  const filteredCalls = useMemo(() => {
    if (!callsData) return [];
    let data = callsData;
    if (smartFilter === 'NEEDS_COACHING') {
      data = data.filter(c => c.qaScore && c.qaScore.total < 75);
    } else if (smartFilter === 'HIGH_RISK') {
      data = data.filter(c => c.tags?.includes('FLAGGED') || c.sentiment === 'NEGATIVE');
    } else if (smartFilter === 'ANGRY') {
      data = data.filter(c => c.sentiment === 'NEGATIVE');
    }
    return data;
  }, [callsData, smartFilter]);

  // Helper formatting
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="-m-[28px] h-[calc(100vh-64px)] flex flex-col bg-neutral-page overflow-hidden">
      
      {/* ENTERPRISE HEADER */}
      <header className="shrink-0 px-7 py-5 bg-white border-b border-neutral-border-default flex flex-col xl:flex-row xl:items-center justify-between gap-5 z-10 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} className="text-brand-accent" />
            <h1 className="text-[20px] font-[800] text-neutral-primary tracking-tight">Call Intelligence & QC</h1>
          </div>
          <p className="text-[13px] text-neutral-secondary font-[500]">Monitor live conversations, audit recordings, detect risks, and generate compliance insights.</p>
        </div>
        
        {/* KPI METRICS */}
        <div className="flex items-center gap-4 overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-[160px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <Headphones size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider">Queue Total</p>
              <p className="text-[18px] font-[900] text-slate-900 leading-tight">{kpis.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-[160px]">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
              <TrendingUp size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider">Avg QA Score</p>
              <p className="text-[18px] font-[900] text-slate-900 leading-tight">{kpis.avgQa}/100</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-[160px]">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider">Compliance</p>
              <p className="text-[18px] font-[900] text-slate-900 leading-tight">{kpis.compliance}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-rose-200 shadow-sm min-w-[160px]">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-[800] text-rose-500 uppercase tracking-wider">Risk Alerts</p>
              <p className="text-[18px] font-[900] text-rose-600 leading-tight">{kpis.risk}</p>
            </div>
          </div>
        </div>
      </header>

      {/* SMART FILTERS */}
      <div className="shrink-0 px-7 py-3 bg-neutral-page border-b border-neutral-border-default flex items-center gap-4">
        <div className="flex items-center bg-white border border-neutral-border-default rounded-lg h-9 px-3 w-[280px] focus-within:border-brand-focus transition-colors">
          <Search size={14} className="text-neutral-placeholder shrink-0" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or phone..." 
            className="bg-transparent border-none outline-none text-[13px] ml-2 w-full text-neutral-primary placeholder:text-neutral-placeholder font-[500]" 
          />
        </div>

        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="h-9 px-3 bg-white border border-neutral-border-default rounded-lg text-[13px] font-[600] text-neutral-primary focus:outline-none focus:border-brand-focus transition-colors"
        >
          <option value="">All Agents</option>
          {agentsData?.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <div className="h-5 w-[1px] bg-neutral-border-default mx-1"></div>

        {/* AI Pills */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSmartFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wide transition-all ${smartFilter === 'ALL' ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white border border-neutral-border-default text-neutral-secondary hover:bg-neutral-hover'}`}
          >
            All Calls
          </button>
          <button 
            onClick={() => setSmartFilter('NEEDS_COACHING')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wide transition-all ${smartFilter === 'NEEDS_COACHING' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-neutral-border-default text-neutral-secondary hover:bg-neutral-hover'}`}
          >
            Needs Coaching
          </button>
          <button 
            onClick={() => setSmartFilter('HIGH_RISK')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wide transition-all flex items-center gap-1 ${smartFilter === 'HIGH_RISK' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white border border-neutral-border-default text-neutral-secondary hover:bg-neutral-hover'}`}
          >
            <AlertCircle size={12} /> High Risk
          </button>
          <button 
            onClick={() => setSmartFilter('ANGRY')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wide transition-all ${smartFilter === 'ANGRY' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-neutral-border-default text-neutral-secondary hover:bg-neutral-hover'}`}
          >
            Customer Angry
          </button>
        </div>
      </div>

      {/* ENTERPRISE DATA GRID */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-neutral-hover border-b border-neutral-border-default z-10 shadow-sm">
            <tr className="text-[11px] font-[700] text-neutral-muted uppercase tracking-wider">
              <th className="px-6 py-4">Call Details</th>
              <th className="px-6 py-4">Agent</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Sentiment</th>
              <th className="px-6 py-4">QA Score</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Recording</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border-default/50">
            {isCallsLoading ? (
               <tr><td colSpan="8" className="p-8 text-center text-neutral-muted font-[600] text-[13px]">Loading intelligence data...</td></tr>
            ) : filteredCalls.length === 0 ? (
               <tr><td colSpan="8" className="p-8 text-center text-neutral-muted font-[600] text-[13px]">No matching records found.</td></tr>
            ) : (
              filteredCalls.map(call => (
                <tr 
                  key={call.id} 
                  onClick={() => {
                    setSelectedCall(call);
                    setPlaybackProgress(0);
                    setIsPlaying(false);
                  }}
                  className={`group cursor-pointer transition-colors ${selectedCall?.id === call.id ? 'bg-brand-focus/5' : 'hover:bg-neutral-hover'}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-[700] text-neutral-primary">{call.lead?.customerName || 'Unknown Contact'}</span>
                      <span className="text-[12px] font-[500] text-neutral-muted">{call.phone} • {new Date(call.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      {call.agent?.profileImage ? (
                        <img src={call.agent.profileImage} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-[800] text-[12px] border border-indigo-100">
                          {call.agent?.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-[13px] font-[700] text-slate-700">{call.agent?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[13px] font-[600] text-neutral-primary">{formatDuration(call.duration)}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-[700] tracking-wide ${
                      call.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      call.sentiment === 'NEGATIVE' ? 'bg-status-danger-light/10 text-status-danger border border-status-danger-light' : 
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {call.sentiment || 'NEUTRAL'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {call.qaScore ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${call.qaScore.total >= 80 ? 'bg-emerald-500' : call.qaScore.total >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[13px] font-[700] text-neutral-primary">{call.qaScore.total}/100</span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-[600] text-neutral-muted italic">Pending QA</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {call.tags?.includes('FLAGGED') || call.sentiment === 'NEGATIVE' ? (
                      <div className="flex items-center gap-1.5 text-status-danger">
                        <AlertTriangle size={14} />
                        <span className="text-[12px] font-[700]">High Risk</span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-[600] text-neutral-muted">Low</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {call.recordingUrl ? (
                      <div className="flex items-center gap-1.5 text-brand-accent">
                        <Activity size={14} />
                        <span className="text-[12px] font-[700]">Available</span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-[500] text-neutral-muted">No Audio</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-end gap-2">
                      {call.recordingUrl && (
                        <button 
                          onClick={(e) => handlePlayCall(call, e)}
                          title="Play Recording"
                          className="w-8 h-8 rounded-lg bg-white hover:bg-indigo-600 text-slate-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-slate-200"
                        >
                          <Play size={14} className="ml-0.5" />
                        </button>
                      )}
                      <button 
                        title="QA Score Call"
                        onClick={(e) => { e.stopPropagation(); toast('QA Scoring module opening...'); }}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-sm border border-slate-200"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SPLIT PANEL INTELLIGENCE CENTER */}
      <AnimatePresence>
        {selectedCall && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: 50 }}
            animate={{ height: '48vh', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 border-t border-neutral-border-default bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col z-20 relative"
          >
            {/* Close Button */}
            <button 
              onClick={() => { setSelectedCall(null); if (audioRef.current) audioRef.current.pause(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-hover hover:bg-neutral-border-default/50 text-neutral-secondary flex items-center justify-center transition-colors z-50"
            >
              <X size={16} />
            </button>

            <div className="flex-1 flex overflow-hidden">
              
              {/* LEFT PANE: Audio & Transcript */}
              <div className="w-[60%] border-r border-neutral-border-default flex flex-col bg-neutral-page/50">
                
                {/* Audio Player Header */}
                <div className="p-6 border-b border-neutral-border-default bg-white">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={handleTogglePlay}
                      className="w-14 h-14 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:scale-105 transition-all shrink-0"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[16px] font-[800] text-neutral-primary truncate">{selectedCall.lead?.customerName}</h3>
                        <span className="text-[12px] text-neutral-muted font-[500]">• Agent: {selectedCall.agent?.name}</span>
                      </div>
                      
                      {/* Premium Waveform Mock */}
                      <div className="relative w-full h-8 flex items-end gap-[3px] overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 bg-neutral-hover rounded-sm"></div>
                        <div 
                          className="absolute inset-y-0 left-0 bg-brand-focus/20 rounded-l-sm transition-all duration-100 ease-linear"
                          style={{ width: `${playbackProgress}%` }}
                        ></div>
                        <div 
                          className="absolute inset-y-0 left-0 border-r-2 border-brand-accent transition-all duration-100 ease-linear z-10"
                          style={{ width: `${playbackProgress}%` }}
                        ></div>
                        {/* Fake bars */}
                        {Array.from({ length: 80 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-full rounded-full relative z-0 transition-all ${i < (playbackProgress/100 * 80) ? 'bg-brand-accent' : 'bg-neutral-border-default/80'}`}
                            style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 50 + 50)}%` }}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 text-[11px] font-[600] text-neutral-muted uppercase tracking-widest">
                        <span>{formatDuration(audioRef.current?.currentTime || 0)}</span>
                        <span>{formatDuration(selectedCall.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <audio 
                    ref={audioRef} 
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>

                {/* Transcript Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <h4 className="text-[11px] font-[800] text-neutral-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-accent" /> AI Transcript Insights
                  </h4>
                  <div className="space-y-4">
                    {/* Mock speaker separation using the raw transcript */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-[800] shrink-0">AG</div>
                      <div className="flex-1 bg-white p-3.5 rounded-xl border border-neutral-border-default shadow-sm relative">
                        <p className="text-[13px] font-[500] text-neutral-primary leading-relaxed">
                          {selectedCall.transcript || "Hello, thank you for calling. How can I assist you today?"}
                        </p>
                        <span className="absolute -left-2 top-4 border-[6px] border-transparent border-r-white z-10"></span>
                        <span className="absolute -left-[9px] top-[15px] border-[7px] border-transparent border-r-neutral-border-default z-0"></span>
                      </div>
                    </div>
                    {selectedCall.transcript && (
                      <div className="flex gap-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-[800] shrink-0">C</div>
                        <div className="flex-1 bg-brand-accent/5 p-3.5 rounded-xl border border-brand-accent/20 relative">
                          <p className="text-[13px] font-[500] text-neutral-primary leading-relaxed">
                            I'm calling because I have a question about my recent enterprise renewal and the pricing changes.
                          </p>
                          <span className="absolute -right-2 top-4 border-[6px] border-transparent border-l-brand-accent/5 z-10"></span>
                          <span className="absolute -right-[9px] top-[15px] border-[7px] border-transparent border-l-brand-accent/20 z-0"></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Annotate Box */}
                <div className="p-4 bg-white border-t border-neutral-border-default flex gap-3">
                   <input
                    type="text"
                    value={annotationNote}
                    onChange={(e) => setAnnotationNote(e.target.value)}
                    placeholder="Leave a coaching note at current timestamp..."
                    className="flex-1 bg-neutral-hover border border-neutral-border-default rounded-lg px-4 py-2 text-[13px] font-[500] focus:border-brand-focus focus:bg-white transition-colors outline-none"
                  />
                  <button
                    onClick={handleSaveAnnotation}
                    className="px-4 bg-neutral-900 hover:bg-black text-white rounded-lg text-[13px] font-[700] transition-colors shadow-sm"
                  >
                    Annotate
                  </button>
                </div>
              </div>

              {/* RIGHT PANE: QA Audit */}
              <div className="w-[40%] flex flex-col bg-white">
                <div className="p-6 border-b border-neutral-border-default">
                  <h3 className="text-[16px] font-[800] text-neutral-primary flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" /> QA Audit Report
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {selectedCall.qaScore ? (
                    <div className="space-y-6">
                      {/* Total Score Ring Mock */}
                      <div className="flex items-center justify-center py-2">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={selectedCall.qaScore.total >= 80 ? '#10b981' : '#f43f5e'} strokeWidth="3" strokeDasharray={`${selectedCall.qaScore.total}, 100`} />
                          </svg>
                          <div className="absolute text-center">
                            <span className="block text-[28px] font-[900] text-neutral-primary leading-none">{selectedCall.qaScore.total}</span>
                            <span className="block text-[10px] font-[700] text-neutral-muted uppercase tracking-wider mt-1">/ 100</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Bars */}
                      <div className="space-y-4">
                        {[
                          { label: 'Greeting & Opening', score: selectedCall.qaScore.greeting, max: 20 },
                          { label: 'Needs Discovery', score: selectedCall.qaScore.discovery, max: 20 },
                          { label: 'Product Pitch', score: selectedCall.qaScore.pitch, max: 20 },
                          { label: 'Objection Handling', score: selectedCall.qaScore.objection, max: 20 },
                          { label: 'Closing Effectiveness', score: selectedCall.qaScore.closing, max: 20 },
                        ].map((metric, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-[12px] font-[700] mb-1.5">
                              <span className="text-neutral-secondary">{metric.label}</span>
                              <span className="text-neutral-primary">{metric.score} / {metric.max}</span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-hover rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-focus rounded-full"
                                style={{ width: `${(metric.score / metric.max) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-neutral-border-default">
                        <h4 className="text-[11px] font-[800] text-neutral-muted uppercase tracking-wider mb-2">Manager Coaching Notes</h4>
                        <p className="text-[13px] font-[500] text-neutral-primary leading-relaxed bg-neutral-hover p-4 rounded-xl border border-neutral-border-default/50">
                          {selectedCall.qaScore.notes || 'No coaching notes provided.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-muted">
                      <FileText size={32} className="mb-3 opacity-50" />
                      <p className="text-[14px] font-[700] text-neutral-primary">Pending Evaluation</p>
                      <p className="text-[12px] font-[500] mt-1 max-w-[200px]">This call has not been scored by a QA manager yet.</p>
                      <button className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-[12px] font-[700]">Score this call</button>
                    </div>
                  )}
                </div>

                {/* Flag Actions */}
                <div className="p-4 border-t border-neutral-border-default bg-neutral-hover flex gap-3">
                  <button 
                    onClick={() => setShowFlagModal(true)}
                    className="flex-1 px-4 py-2.5 bg-white border border-neutral-border-default hover:bg-status-danger-light/10 hover:border-status-danger-light/50 hover:text-status-danger rounded-xl text-[13px] font-[700] text-neutral-secondary transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Flag size={14} /> Escalate Risk
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLAG CALL MODAL */}
      <AnimatePresence>
        {showFlagModal && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl border border-neutral-border-default"
            >
              <div className="w-10 h-10 rounded-full bg-status-danger-light/10 flex items-center justify-center mb-4">
                <AlertTriangle size={18} className="text-status-danger" />
              </div>
              <h3 className="text-[18px] font-[800] text-neutral-primary tracking-tight">Escalate Call Risk</h3>
              <p className="text-[13px] text-neutral-secondary font-[500] mt-1.5">Leave a critical reason why this call is flagged for quality coaching or compliance review.</p>
              
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g. Hostile language, compliance violation..."
                className="w-full mt-5 p-3.5 bg-neutral-hover border border-neutral-border-default rounded-xl text-[13px] font-[500] focus:outline-none focus:border-status-danger focus:bg-white transition-colors h-28 resize-none"
              />
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowFlagModal(false)}
                  className="px-5 py-2.5 text-neutral-secondary text-[13px] font-[700] hover:bg-neutral-hover rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFlagCall}
                  className="px-5 py-2.5 bg-status-danger hover:bg-red-600 text-white text-[13px] font-[700] rounded-xl shadow-sm transition-colors"
                >
                  Flag Call
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallRecordings;
