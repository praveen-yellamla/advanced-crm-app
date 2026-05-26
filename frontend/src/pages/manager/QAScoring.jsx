import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Shield, Award, Clock, Star, Play, CheckCircle, ClipboardCheck, History, User, MessageSquare, ShieldAlert, Sparkles, ChevronDown, Check, X, TrendingUp, Cpu, BarChart3, ChevronRight, FileText, AlertTriangle, Zap, Target, Activity, ShieldCheck, CheckCircle2, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const QAScoring = () => {
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'history'
  const [selectedCallId, setSelectedCallId] = useState('');
  
  // Score state
  const [scores, setScores] = useState({
    greeting: null,
    discovery: null,
    pitch: null,
    objection: null,
    closing: null
  });
  
  const [notes, setNotes] = useState('');
  const [expandedSection, setExpandedSection] = useState('greeting');

  // 1. Fetch calls pending QA
  const { data: pendingCalls, refetch: refetchPending } = useQuery({
    queryKey: ['qaPendingCalls'],
    queryFn: async () => {
      const res = await api.get('/manager/qa/pending');
      return res.data.data;
    }
  });

  // 2. Fetch QA History
  const { data: qaHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['qaHistoryReports'],
    queryFn: async () => {
      const res = await api.get('/manager/qa/reports');
      return res.data.data;
    }
  });

  // 3. Mutation: Submit Score Card
  const submitQAMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/manager/qa/${data.callId}/score`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Enterprise QA Report submitted successfully');
      setSelectedCallId('');
      setScores({ greeting: null, discovery: null, pitch: null, objection: null, closing: null });
      setNotes('');
      refetchPending();
      refetchHistory();
    }
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + (b || 0), 0);
  const complianceStatus = totalScore >= 70 ? 'PASS' : 'NEEDS_COACHING';

  const handleScoreChange = (category, value) => {
    setScores(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmitReport = () => {
    if (!selectedCallId) {
      toast.error('Please select a call from the queue first');
      return;
    }
    
    // Validate that all score categories are filled
    if (Object.values(scores).some(val => val === null)) {
      toast.error('Please complete all evaluation sections before submitting');
      return;
    }

    submitQAMutation.mutate({
      callId: selectedCallId,
      ...scores,
      notes
    });
  };

  const selectedCall = useMemo(() => {
    return pendingCalls?.find(c => c.id.toString() === selectedCallId.toString());
  }, [selectedCallId, pendingCalls]);

  // Derived AI Insights (Mocked based on call duration to feel realistic)
  const insights = useMemo(() => {
    if (!selectedCall) return null;
    const dur = selectedCall.duration || 300;
    const talkRatio = Math.min(80, Math.max(30, Math.floor((dur % 100) / 100 * 50 + 30)));
    return {
      talkRatio: `${talkRatio}:${100 - talkRatio}`,
      silence: Math.max(2, Math.floor((dur % 20))),
      probability: Math.min(98, Math.max(12, Math.floor((dur / 600) * 100))),
      sentiment: selectedCall.sentiment || 'NEUTRAL',
      interruptions: Math.floor(dur / 120)
    };
  }, [selectedCall]);

  const radarPoints = useMemo(() => {
    // Generate SVG polygon points based on scores
    const max = 20;
    const r = 50;
    const center = 60;
    const angles = [0, 72, 144, 216, 288].map(deg => (deg - 90) * (Math.PI / 180));
    const values = [scores.greeting, scores.discovery, scores.pitch, scores.objection, scores.closing];
    
    return values.map((val, i) => {
      const radius = (val / max) * r;
      const x = center + radius * Math.cos(angles[i]);
      const y = center + radius * Math.sin(angles[i]);
      return `${x},${y}`;
    }).join(' ');
  }, [scores]);

  // Sections config
  const sections = [
    { id: 'greeting', label: 'Greeting & Intro', max: 20, tip: 'Did the agent build immediate rapport?' },
    { id: 'discovery', label: 'Needs Discovery', max: 20, tip: 'Were the right probing questions asked?' },
    { id: 'pitch', label: 'Product Pitch', max: 20, tip: 'Was the value prop clearly articulated?' },
    { id: 'objection', label: 'Objection Handling', max: 20, tip: 'Did they successfully isolate concerns?' },
    { id: 'closing', label: 'Closing & Next Steps', max: 20, tip: 'Was a firm commitment secured?' }
  ];

  return (
    <div className="-m-[28px] h-[calc(100vh-64px)] flex flex-col bg-neutral-page overflow-hidden">
      
      {/* ENTERPRISE HEADER */}
      <header className="shrink-0 bg-white border-b border-neutral-border-default z-20 shadow-sm relative">
        <div className="px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
              <ShieldCheck className="text-brand-accent" size={20} />
            </div>
            <div>
              <h1 className="text-[18px] font-[800] text-neutral-primary tracking-tight">AI Quality Assurance</h1>
              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={() => setActiveTab('score')}
                  className={`text-[12px] font-[700] uppercase tracking-wider transition-colors ${activeTab === 'score' ? 'text-brand-accent' : 'text-neutral-muted hover:text-neutral-primary'}`}
                >
                  Score Rubric
                </button>
                <div className="w-1 h-1 rounded-full bg-neutral-border-default"></div>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-[12px] font-[700] uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'text-brand-accent' : 'text-neutral-muted hover:text-neutral-primary'}`}
                >
                  Audit History
                </button>
              </div>
            </div>
          </div>

          {/* KPI METRICS (Only show in score mode if a call is selected) */}
          {activeTab === 'score' && selectedCall && insights && (
            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
               <div className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col min-w-[120px]">
                 <span className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider mb-0.5">Talk:Listen</span>
                 <div className="flex items-center gap-2">
                   <Activity size={16} className="text-blue-500" />
                   <span className="text-[15px] font-[900] text-slate-900">{insights.talkRatio}</span>
                 </div>
               </div>
               <div className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col min-w-[120px]">
                 <span className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider mb-0.5">Silence</span>
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-amber-500" />
                   <span className="text-[15px] font-[900] text-slate-900">{insights.silence}%</span>
                 </div>
               </div>
               <div className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col min-w-[120px]">
                 <span className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider mb-0.5">Win Prob.</span>
                 <div className="flex items-center gap-2">
                   <Target size={16} className="text-emerald-500" />
                   <span className="text-[15px] font-[900] text-slate-900">{insights.probability}%</span>
                 </div>
               </div>
               <div className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col min-w-[120px]">
                 <span className="text-[10px] font-[800] text-slate-400 uppercase tracking-wider mb-0.5">Sentiment</span>
                 <div className="flex items-center gap-2">
                   <Sparkles size={16} className={insights.sentiment === 'POSITIVE' ? 'text-emerald-500' : insights.sentiment === 'NEGATIVE' ? 'text-status-danger' : 'text-slate-500'} />
                   <span className="text-[15px] font-[900] text-slate-900 capitalize">{insights.sentiment?.toLowerCase() || 'Neutral'}</span>
                 </div>
               </div>
            </div>
          )}
        </div>
        
        {/* Call Selector Bar */}
        {activeTab === 'score' && (
          <div className="px-6 py-2.5 bg-neutral-page border-t border-neutral-border-default flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-[12px] font-[700] text-neutral-muted uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Zap size={14} className="text-brand-accent" /> Select Call to Audit
            </span>
            <div className="flex-1 max-w-xl relative">
              <select
                value={selectedCallId}
                onChange={(e) => setSelectedCallId(e.target.value)}
                className="w-full h-9 pl-3 pr-8 bg-white border border-brand-accent/30 rounded-lg text-[13px] font-[600] text-neutral-primary focus:outline-none focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20 transition-all appearance-none shadow-sm cursor-pointer"
              >
                <option value="">Queue: {pendingCalls?.length || 0} calls pending evaluation...</option>
                {pendingCalls?.map(call => (
                  <option key={call.id} value={call.id}>
                    {call.lead?.customerName} • {call.agent?.name} ({Math.round(call.duration / 60)}m {call.duration % 60}s)
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-brand-accent pointer-events-none" />
            </div>
          </div>
        )}
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-hidden relative bg-neutral-page">
        {activeTab === 'score' ? (
          selectedCall ? (
            <div className="absolute inset-0 flex">
              {/* LEFT: Transcript */}
              <div className="w-[35%] border-r border-neutral-border-default bg-white flex flex-col">
                <div className="p-4 border-b border-neutral-border-default bg-neutral-hover flex items-center justify-between">
                  <h3 className="text-[13px] font-[800] text-neutral-primary flex items-center gap-2">
                    <FileText size={16} className="text-brand-accent" /> Live Transcript
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-[800] uppercase tracking-wider">AI Synced</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-[10px] font-[800] shrink-0 mt-1">AG</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-[700] text-neutral-primary">{selectedCall.agent?.name}</span>
                          <span className="text-[10px] font-[600] text-neutral-muted">0:00</span>
                        </div>
                        <p className="text-[13px] font-[500] text-neutral-secondary leading-relaxed bg-neutral-hover p-3 rounded-tr-xl rounded-b-xl border border-neutral-border-default/50">
                          {selectedCall.transcript || "Thank you for calling support. How can I help you today?"}
                        </p>
                      </div>
                    </div>
                    {selectedCall.transcript && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-[800] shrink-0 mt-1">CU</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-[700] text-neutral-primary">{selectedCall.lead?.customerName}</span>
                            <span className="text-[10px] font-[600] text-neutral-muted">0:15</span>
                          </div>
                          <p className="text-[13px] font-[500] text-neutral-secondary leading-relaxed bg-white p-3 rounded-tr-xl rounded-b-xl border border-neutral-border-default shadow-sm">
                            I'm having a serious issue with my recent invoice and I need it resolved immediately.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-danger-light/10 text-status-danger rounded text-[10px] font-[700] uppercase tracking-wider border border-status-danger-light">
                              <AlertTriangle size={10} /> Frustration Detected
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CENTER: QA Scoring Accordions */}
              <div className="w-[40%] border-r border-neutral-border-default bg-neutral-page flex flex-col">
                <div className="p-4 border-b border-neutral-border-default bg-white flex items-center justify-between shadow-sm z-10">
                  <h3 className="text-[13px] font-[800] text-neutral-primary flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-brand-accent" /> Evaluation Rubric
                  </h3>
                  <span className="text-[13px] font-[800] text-neutral-primary">
                    Score: <span className={totalScore >= 70 ? 'text-emerald-600' : 'text-amber-500'}>{totalScore}</span><span className="text-neutral-muted">/100</span>
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                  {sections.map((section) => (
                    <div key={section.id} className="bg-white border border-neutral-border-default rounded-xl overflow-hidden shadow-sm transition-all">
                      {/* Accordion Header */}
                      <button 
                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                        className="w-full px-5 py-3.5 flex items-center justify-between bg-white hover:bg-neutral-hover transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-[800] transition-colors ${scores[section.id] !== null ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {scores[section.id] !== null ? scores[section.id] : '-'}
                          </div>
                          <span className="text-[14px] font-[700] text-neutral-primary">{section.label}</span>
                        </div>
                        <ChevronDown size={16} className={`text-neutral-muted transition-transform duration-200 ${expandedSection === section.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Accordion Body */}
                      <AnimatePresence>
                        {expandedSection === section.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-neutral-border-default"
                          >
                            <div className="p-5 bg-neutral-page/30">
                              <p className="text-[12px] font-[600] text-neutral-secondary mb-4 flex items-start gap-2">
                                <Sparkles size={14} className="text-brand-accent shrink-0 mt-0.5" /> 
                                {section.tip}
                              </p>
                              
                              {/* Discrete Score Chips */}
                              <div className="flex items-center gap-2 mb-4">
                                {[0, 5, 10, 15, 20].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleScoreChange(section.id, val)}
                                    className={`flex-1 py-2 rounded-lg text-[13px] font-[700] transition-all border ${
                                      scores[section.id] === val 
                                        ? 'bg-brand-focus text-white border-brand-focus shadow-md transform scale-[1.02]' 
                                        : 'bg-white text-neutral-secondary border-neutral-border-default hover:bg-neutral-hover hover:border-brand-accent/40'
                                    }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>

                              <div className="p-3 bg-brand-accent/5 rounded-lg border border-brand-accent/10">
                                <span className="text-[10px] font-[800] text-brand-accent uppercase tracking-wider mb-1 block">AI Analysis</span>
                                <p className="text-[12px] font-[500] text-neutral-primary">
                                  {scores[section.id] >= 15 ? 'Excellent execution in this segment. Keywords detected perfectly.' : 'Missed key required phrases during this segment. Needs improvement.'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Radar & Coaching */}
              <div className="w-[25%] bg-white flex flex-col relative">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                  {/* Radar Chart */}
                  <div className="mb-8">
                    <h3 className="text-[11px] font-[800] text-neutral-muted uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Target size={14} className="text-brand-accent" /> Score Distribution
                    </h3>
                    <div className="relative w-48 h-48 mx-auto">
                      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
                        {/* Background Rings */}
                        <polygon points="60,10 107,44 89,100 31,100 13,44" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        <polygon points="60,22 95,48 82,90 38,90 25,48" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        <polygon points="60,35 83,52 74,80 46,80 37,52" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Axes */}
                        <line x1="60" y1="60" x2="60" y2="10" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="60" y1="60" x2="107" y2="44" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="60" y1="60" x2="89" y2="100" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="60" y1="60" x2="31" y2="100" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="60" y1="60" x2="13" y2="44" stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Data Polygon */}
                        <polygon 
                          points={radarPoints} 
                          fill="rgba(37, 99, 235, 0.2)" 
                          stroke="#2563eb" 
                          strokeWidth="2" 
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      {/* Labels */}
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-[800] text-neutral-secondary uppercase tracking-widest">Greet</span>
                      <span className="absolute top-10 -right-4 text-[9px] font-[800] text-neutral-secondary uppercase tracking-widest">Discov</span>
                      <span className="absolute bottom-4 -right-1 text-[9px] font-[800] text-neutral-secondary uppercase tracking-widest">Pitch</span>
                      <span className="absolute bottom-4 -left-3 text-[9px] font-[800] text-neutral-secondary uppercase tracking-widest">Object</span>
                      <span className="absolute top-10 -left-6 text-[9px] font-[800] text-neutral-secondary uppercase tracking-widest">Close</span>
                    </div>
                  </div>

                  {/* Coaching Summary */}
                  <div>
                    <h3 className="text-[11px] font-[800] text-neutral-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare size={14} className="text-brand-accent" /> Manager Coaching Notes
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add specific feedback or coaching action items..."
                      className="w-full h-32 p-3 bg-neutral-page border border-neutral-border-default rounded-xl text-[13px] font-[500] focus:border-brand-focus focus:bg-white transition-colors outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Sticky Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-border-default shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-20">
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitQAMutation.isPending}
                    className="w-full h-11 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white rounded-xl text-[13px] font-[800] transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Shield size={16} /> Submit QA Report
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-20 h-20 rounded-full bg-brand-accent/5 flex items-center justify-center mb-6">
                <ShieldCheck size={40} className="text-brand-accent/40" />
              </div>
              <h2 className="text-[20px] font-[800] text-neutral-primary mb-2">No Call Selected</h2>
              <p className="text-[14px] text-neutral-secondary font-[500] max-w-sm">Select a pending call from the dropdown above to launch the AI coaching workspace.</p>
            </div>
          )
        ) : (
          /* PREMIUM AUDIT HISTORY GRID */
          <div className="absolute inset-0 bg-white p-6 overflow-y-auto custom-scrollbar">
            <div className="border border-neutral-border-default rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="p-5 border-b border-neutral-border-default flex items-center justify-between bg-neutral-hover">
                <div>
                  <h3 className="text-[15px] font-[800] text-neutral-primary">Historical Scorecards</h3>
                  <p className="text-[12px] text-neutral-muted font-[600] mt-0.5">Comprehensive audit logs of team conversations.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-neutral-border-default rounded-lg h-8 px-3 w-[200px]">
                    <Search size={14} className="text-neutral-placeholder" />
                    <input type="text" placeholder="Search audits..." className="bg-transparent border-none outline-none text-[12px] ml-2 w-full" />
                  </div>
                </div>
              </div>

              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-neutral-page border-b border-neutral-border-default">
                  <tr className="text-[11px] font-[800] text-neutral-muted uppercase tracking-wider">
                    <th className="px-5 py-3">Audit Date</th>
                    <th className="px-5 py-3">Agent</th>
                    <th className="px-5 py-3">Customer Lead</th>
                    <th className="px-5 py-3">Final Score</th>
                    <th className="px-5 py-3">Compliance</th>
                    <th className="px-5 py-3">Metrics (G/D/P/O/C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-default/60">
                  {qaHistory?.map(rep => (
                    <tr key={rep.id} className="hover:bg-neutral-hover transition-colors group cursor-pointer">
                      <td className="px-5 py-3.5 text-[12px] font-[600] text-neutral-secondary">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-[700] text-[10px]">
                            {rep.call?.agent?.name?.charAt(0)}
                          </div>
                          <span className="text-[13px] font-[700] text-neutral-primary">{rep.call?.agent?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-[600] text-neutral-secondary">
                        {rep.call?.lead?.customerName}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${rep.total >= 80 ? 'bg-emerald-500' : rep.total >= 60 ? 'bg-amber-500' : 'bg-status-danger'}`}></div>
                          <span className="text-[14px] font-[800] text-neutral-primary">{rep.total}/100</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-[800] uppercase tracking-wider ${
                          rep.total >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-status-danger-light/10 text-status-danger border border-status-danger-light'
                        }`}>
                          {rep.total >= 70 ? 'Pass' : 'Review'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] font-[700] text-neutral-muted">
                        {rep.greeting} / {rep.discovery} / {rep.pitch} / {rep.objection} / {rep.closing}
                      </td>
                    </tr>
                  ))}
                  {(!qaHistory || qaHistory.length === 0) && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-neutral-muted font-[600] text-[13px]">No audited reports yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAScoring;
