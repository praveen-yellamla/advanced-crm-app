import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Mic, MicOff, Pause, Play, PhoneOff, Search, UserPlus, 
  Clock, ShieldCheck, Zap, Target, MoreHorizontal, ChevronRight, 
  Headphones, CheckCircle2, Calendar, Delete, RotateCcw,
  Volume2, VolumeX, User, History, MessageSquare, Sparkles,
  ArrowRight, Settings, Maximize2, Activity, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTelephony } from '../../context/TelephonyContext';
import { formatPhoneNumber } from '../../utils/phoneUtils';

const AgentCallingWorkspace = () => {
  const { 
    callState, 
    isMuted, 
    duration, 
    formatDuration, 
    toggleMute, 
    activeCall,
    lastCallSid,
    makeCall,
    endCall
  } = useTelephony();

  const [activeLead, setActiveLead] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [onHold, setOnHold] = useState(false);
  const [activeTab, setActiveTab] = useState('TRANSCRIPT'); // TRANSCRIPT, NOTES, HISTORY
  const queryClient = useQueryClient();

  const [taggingData, setTaggingData] = useState({
    status: 'INTERESTED',
    notes: '',
    callbackDate: ''
  });

  const { data: leads } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data;
    }
  });

  const logCallMutation = useMutation({
    mutationFn: (data) => api.post('/call/tag', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentDashboard', 'agentLeads', 'agentHistory']);
      toast.success('Communication protocol synchronized');
      setPhoneNumber('');
      setActiveLead(null);
      setTaggingData({ status: 'INTERESTED', notes: '', callbackDate: '' });
    }
  });

  const startCall = () => {
    const target = phoneNumber || activeLead?.phone;
    if (!target) return toast.error('Selection Protocol Failure: No target identity');
    makeCall(target, activeLead?.id);
  };

  const submitTagging = () => {
    logCallMutation.mutate({
      callSid: lastCallSid,
      tags: taggingData.status,
      notes: taggingData.notes
    });
  };

  useEffect(() => {
    if (activeLead && callState === 'idle') {
      setPhoneNumber(activeLead.phone);
    }
  }, [activeLead]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-8">
      {/* COCKPIT HEADER */}
      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-400 shadow-2xl">
               <Globe className="animate-spin-slow" size={24} />
            </div>
            <div>
               <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Telephony Cockpit</h1>
               <div className="flex items-center gap-3 mt-1">
                  <div className={`w-2 h-2 rounded-full ${callState === 'in-progress' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{callState === 'idle' ? 'System Ready' : `Active Session: ${callState}`}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <AudioSettingBtn icon={Mic} label="Audio Input: Studio Mic" />
            <AudioSettingBtn icon={Volume2} label="Output: HD Speakers" />
            <div className="w-px h-8 bg-slate-200 mx-2" />
            <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
               <Settings size={20} />
            </button>
         </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
         
         {/* LEFT PANEL: LEAD HUB & DIALER */}
         <div className="w-[400px] flex flex-col gap-6 shrink-0">
            {/* DIALER UNIT */}
            <div className="bg-[#0F172A] p-8 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Communication Core</span>
                     <Maximize2 size={16} className="text-white/20" />
                  </div>
                  
                  <div className="space-y-2">
                     <input 
                        type="text" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="+91 000 000 0000"
                        className="w-full bg-transparent border-none text-3xl font-black text-white tracking-tighter focus:ring-0 placeholder:text-white/5 tabular-nums"
                     />
                     {activeLead && <p className="text-blue-400 font-black uppercase text-[10px] tracking-[0.2em] italic">{activeLead.customerName}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                     {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => (
                       <button 
                         key={n} 
                         onClick={() => setPhoneNumber(prev => formatPhoneNumber(prev + n))}
                         className="h-14 rounded-2xl bg-white/5 border border-white/5 text-lg font-black text-white hover:bg-white/10 active:scale-95 transition-all"
                       >
                         {n}
                       </button>
                     ))}
                  </div>

                  <button 
                    disabled={callState !== 'idle'}
                    onClick={startCall}
                    className={`w-full h-20 rounded-[32px] flex items-center justify-center gap-4 font-black uppercase text-[11px] tracking-[0.2em] transition-all ${
                      callState !== 'idle' ? 'bg-slate-800 text-slate-600 grayscale' : 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 hover:scale-105 brightness-110'
                    }`}
                  >
                     <Phone size={20} fill="currentColor" /> Initialize Link
                  </button>
               </div>
               <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mb-20" />
            </div>

            {/* LEAD SELECTOR */}
            <div className="flex-1 bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col overflow-hidden">
               <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">Personal Pipeline</h3>
                  <Target size={18} className="text-slate-200" />
               </div>
               <div className="relative mb-6 shrink-0">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="text" placeholder="Filter identities..." className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10" />
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {leads?.map(lead => (
                    <div 
                      key={lead.id}
                      onClick={() => callState === 'idle' && setActiveLead(lead)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                        activeLead?.id === lead.id ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-slate-50 hover:border-slate-200'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeLead?.id === lead.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                             <User size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{lead.customerName}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-0.5">{lead.phone}</p>
                          </div>
                       </div>
                       <ChevronRight size={14} className={activeLead?.id === lead.id ? 'text-blue-600' : 'text-slate-200'} />
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* CENTER: ACTIVE WORKSPACE / CALL CONTEXT */}
         <div className="flex-1 flex flex-col gap-6 min-w-0">
            <AnimatePresence mode="wait">
               {callState === 'idle' ? (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                    className="flex-1 bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col items-center justify-center text-center p-20 relative overflow-hidden"
                  >
                     <div className="relative z-10 space-y-8 max-w-md">
                        <div className="w-32 h-32 rounded-[48px] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/5 border border-blue-100">
                           <Headphones size={48} />
                        </div>
                        <div className="space-y-3">
                           <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Ready for Uplink</h2>
                           <p className="text-slate-400 font-bold text-sm leading-relaxed uppercase tracking-widest">Select a lead from your pipeline or dial a manual identity to begin communication.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Health</p>
                              <p className="text-2xl font-black text-slate-900 italic uppercase">Optimal</p>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                              <p className="text-2xl font-black text-slate-900 italic uppercase">12ms</p>
                           </div>
                        </div>
                     </div>
                     <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600 rounded-full blur-[160px]" />
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600 rounded-full blur-[160px]" />
                     </div>
                  </motion.div>
               ) : (
                  <motion.div 
                    key="active"
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                    className="flex-1 flex flex-col gap-6"
                  >
                     {/* ACTIVE CALL HEAD-UP DISPLAY */}
                     <div className="bg-[#0F172A] p-10 rounded-[64px] shadow-2xl flex items-center justify-between relative overflow-hidden shrink-0">
                        <div className="flex items-center gap-8 relative z-10">
                           <div className="w-24 h-24 rounded-[40px] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 relative">
                              <User size={40} />
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-[#0F172A] flex items-center justify-center shadow-lg">
                                 <Activity size={16} className="text-white animate-pulse" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{activeLead?.customerName || phoneNumber}</h2>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <Clock size={12} className="text-blue-400" />
                                    <span className="text-xs font-black text-white tabular-nums tracking-widest">{formatDuration(duration)}</span>
                                 </div>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Encrypted Session Secure</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                           <ControlButton icon={isMuted ? MicOff : Mic} active={isMuted} onClick={toggleMute} color="amber" />
                           <ControlButton icon={onHold ? Play : Pause} active={onHold} onClick={() => setOnHold(!onHold)} color="blue" />
                           <button 
                             onClick={endCall}
                             className="w-28 h-28 rounded-[48px] bg-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-500/30 hover:scale-110 active:scale-95 transition-all"
                           >
                              <PhoneOff size={32} />
                           </button>
                        </div>
                        <div className="absolute right-0 top-0 w-[500px] h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
                     </div>

                     {/* CALL INTELLIGENCE & CONTEXT TABS */}
                     <div className="flex-1 bg-white rounded-[64px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center px-12 pt-10 pb-6 border-b border-slate-50 shrink-0">
                           <div className="flex gap-10">
                              <TabBtn active={activeTab === 'TRANSCRIPT'} label="Live Transcript" onClick={() => setActiveTab('TRANSCRIPT')} />
                              <TabBtn active={activeTab === 'NOTES'} label="Active Notes" onClick={() => setActiveTab('NOTES')} />
                              <TabBtn active={activeTab === 'HISTORY'} label="Interaction Timeline" onClick={() => setActiveTab('HISTORY')} />
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                           {activeTab === 'TRANSCRIPT' && (
                              <div className="space-y-8">
                                 <TranscriptRow role="assistant" text="Connecting to established protocol... Uplink secure." time="00:01" />
                                 <TranscriptRow role="agent" text={`Hello, this is CRM Intelligence calling for ${activeLead?.customerName || 'customer'}. How are you today?`} time="00:05" />
                                 <div className="flex justify-center py-10 opacity-20">
                                    <div className="flex gap-1">
                                       {[1,2,3,4].map(i => <div key={i} className="w-1 h-8 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}} />)}
                                    </div>
                                 </div>
                              </div>
                           )}
                           {activeTab === 'NOTES' && (
                              <div className="h-full flex flex-col gap-6">
                                 <textarea 
                                    placeholder="Begin documenting session outcomes..."
                                    className="flex-1 w-full bg-slate-50 border-none rounded-[32px] p-10 outline-none focus:ring-2 focus:ring-blue-600/10 font-bold text-slate-900 placeholder:text-slate-400 resize-none text-xl leading-relaxed italic"
                                    value={taggingData.notes}
                                    onChange={e => setTaggingData({...taggingData, notes: e.target.value})}
                                 />
                                 <div className="flex flex-wrap gap-3">
                                    {['INTERESTED', 'CALLBACK', 'NEGOTIATION', 'WON', 'LOST'].map(s => (
                                       <button 
                                          key={s} 
                                          onClick={() => setTaggingData({...taggingData, status: s})}
                                          className={`px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${taggingData.status === s ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                       >
                                          {s.replace('_', ' ')}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                           {activeTab === 'HISTORY' && (
                              <div className="space-y-6">
                                 {[1,2,3].map(i => (
                                    <div key={i} className="flex gap-6 items-start">
                                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                          <History size={18} />
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-900 uppercase italic">Previous Outbound Session</p>
                                          <p className="text-xs text-slate-400 font-bold mt-1">Duration: 04:12 • Status: Contacted</p>
                                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 block">May 12, 2026</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* RIGHT PANEL: CONTEXTUAL AI & TASKS */}
         <div className="w-[360px] flex flex-col gap-6 shrink-0 overflow-hidden">
            <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8 flex flex-col overflow-hidden">
               <div className="flex items-center gap-3 shrink-0">
                  <Sparkles className="text-blue-600" size={20} />
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">Co-Pilot Insights</h3>
               </div>
               <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-3">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Optimal Close Path</p>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                        "Mention the <span className="font-black text-blue-600">Fiscal Q3 Discount</span>. Lead previously expressed budget concerns in call #402."
                     </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sentiment Analysis</p>
                     <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[75%]" />
                     </div>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">75% Positive</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-[#0F172A] p-8 rounded-[48px] shadow-2xl space-y-8 flex flex-col overflow-hidden">
               <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Related Tasks</h3>
                  <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                     <UserPlus size={16} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                  {[1,2,3].map(i => (
                     <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                        <p className="text-[11px] font-black text-white uppercase italic truncate">Send Implementation Proposal</p>
                        <div className="flex items-center justify-between mt-3">
                           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Due Today</span>
                           <ArrowRight size={12} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
      
      {/* POST-CALL SAVE OVERLAY */}
      <AnimatePresence>
         {callState === 'completed' && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[5000] flex items-center justify-center p-10 bg-[#0F172A]/90 backdrop-blur-2xl"
            >
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-4xl bg-white rounded-[64px] shadow-2xl overflow-hidden"
               >
                  <div className="p-16 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Session Archive</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Documenting outcome for {activeLead?.customerName || phoneNumber}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Duration</p>
                        <p className="text-5xl font-black text-blue-600 tabular-nums italic tracking-tighter">{formatDuration(duration)}</p>
                     </div>
                  </div>
                  <div className="p-16 space-y-12">
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Select Disposition Protocol</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                           {['INTERESTED', 'CALLBACK', 'NEGOTIATION', 'WON', 'LOST'].map(s => (
                              <button 
                                 key={s}
                                 onClick={() => setTaggingData({...taggingData, status: s})}
                                 className={`h-16 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    taggingData.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                                 }`}
                              >
                                 {s.replace('_', ' ')}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Executive Summary</label>
                        <textarea 
                           placeholder="Summarize the core conversation highlights..."
                           className="w-full h-40 p-10 bg-slate-50 border-none rounded-[40px] outline-none focus:ring-2 focus:ring-blue-600/10 font-bold text-slate-900 text-xl leading-relaxed italic"
                           value={taggingData.notes}
                           onChange={e => setTaggingData({...taggingData, notes: e.target.value})}
                        />
                     </div>
                     <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                        <button className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                           <History size={16} /> View Full Interaction History
                        </button>
                        <button 
                           onClick={submitTagging}
                           className="h-20 px-16 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:brightness-125 hover:scale-105 transition-all"
                        >
                           Synchronize Record
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

const AudioSettingBtn = ({ icon: Icon, label }) => (
  <button className="px-6 h-12 bg-white border border-slate-100 rounded-xl flex items-center gap-4 group hover:border-blue-200 transition-all shadow-sm">
     <Icon size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

const ControlButton = ({ icon: Icon, active, onClick, color }) => {
  const colors = {
    amber: active ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20',
    blue: active ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
  };
  return (
    <button 
      onClick={onClick}
      className={`w-20 h-20 rounded-[32px] flex items-center justify-center transition-all ${colors[color]} shadow-xl border border-white/5`}
    >
       <Icon size={24} />
    </button>
  );
};

const TabBtn = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}
  >
     {label}
     {active && <motion.div layoutId="call-tab-line" className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
  </button>
);

const TranscriptRow = ({ role, text, time }) => (
  <div className="flex gap-6 group">
     <span className="text-[10px] font-black text-slate-300 w-10 shrink-0 mt-1">{time}</span>
     <div className="space-y-1 flex-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${role === 'assistant' ? 'text-blue-600' : 'text-slate-900'}`}>{role}</p>
        <p className="text-lg font-bold text-slate-700 leading-relaxed italic">{text}</p>
     </div>
  </div>
);

export default AgentCallingWorkspace;
