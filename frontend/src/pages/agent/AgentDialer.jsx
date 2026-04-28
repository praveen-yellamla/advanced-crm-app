import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  PhoneOff, 
  Search, 
  UserPlus, 
  Clock, 
  ShieldCheck,
  Zap,
  Target,
  MoreHorizontal,
  ChevronRight,
  Headphones,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AgentDialer = () => {
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, DIALING, CONNECTED, TAGGING
  const [activeLead, setActiveLead] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const queryClient = useQueryClient();

  const [taggingData, setTaggingData] = useState({
    status: '',
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
    mutationFn: (data) => api.post('/agent/call/log', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentDashboard', 'agentLeads']);
      toast.success('Call Properly Logged & Tagged');
      setCallStatus('IDLE');
      setActiveLead(null);
      setTimer(0);
      setTaggingData({ status: '', notes: '', callbackDate: '' });
    }
  });

  useEffect(() => {
    let interval;
    if (callStatus === 'CONNECTED') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const startCall = (lead) => {
    setActiveLead(lead);
    setCallStatus('DIALING');
    setTimeout(() => setCallStatus('CONNECTED'), 2000); // Simulate connection
  };

  const endCall = () => {
    setCallStatus('TAGGING');
  };

  const submitTagging = () => {
    if (!taggingData.status) return toast.error('Selection of call outcome is mandatory');
    logCallMutation.mutate({
      leadId: activeLead.id,
      durationSeconds: timer,
      callStatus: taggingData.status,
      notes: taggingData.notes,
      callbackDate: taggingData.callbackDate
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 pb-16 h-full">
      {/* LEFT: DIALER CONTROLS */}
      <div className="xl:col-span-1 space-y-10">
         <div className="bg-[#0F172A] p-12 rounded-[48px] shadow-2xl relative overflow-hidden h-full flex flex-col justify-between group">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                     <Headphones size={24} />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                     <div className={`w-2 h-2 rounded-full ${callStatus === 'IDLE' ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`} />
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest">{callStatus}</span>
                  </div>
               </div>

               {activeLead ? (
                 <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{activeLead.customerName}</h2>
                    <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">{activeLead.phone}</p>
                 </div>
               ) : (
                 <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white opacity-40 italic tracking-tight">System Ready</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Select target lead data</p>
                 </div>
               )}

               <div className="pt-8 grid grid-cols-3 gap-4">
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => (
                    <button key={n} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all">{n}</button>
                  ))}
               </div>
            </div>

            <div className="relative z-10 pt-12">
               {callStatus === 'CONNECTED' ? (
                  <div className="flex flex-col gap-6">
                     <div className="flex items-center justify-center gap-10">
                        <p className="text-6xl font-black text-white tracking-tighter tabular-nums font-mono">
                           {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}
                        </p>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setIsMuted(!isMuted)} className={`flex-1 h-20 rounded-[32px] flex items-center justify-center transition-all ${isMuted ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-white/10 text-white'}`}>
                           {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button onClick={() => setOnHold(!onHold)} className={`flex-1 h-20 rounded-[32px] flex items-center justify-center transition-all ${onHold ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white/10 text-white'}`}>
                           {onHold ? <Play size={24} /> : <Pause size={24} />}
                        </button>
                        <button onClick={endCall} className="w-32 h-20 bg-rose-600 text-white rounded-[32px] shadow-xl shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group-hover:rotate-12">
                           <PhoneOff size={24} />
                        </button>
                     </div>
                  </div>
               ) : (
                  <button 
                    disabled={!activeLead || callStatus !== 'IDLE'}
                    onClick={() => startCall(activeLead)}
                    className={`w-full h-24 rounded-[40px] flex items-center justify-center gap-6 font-bold uppercase text-xs tracking-[0.2em] transition-all ${
                      !activeLead || callStatus !== 'IDLE' ? 'bg-slate-800 text-slate-600 grayscale cursor-not-allowed' : 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 brightness-110'
                    }`}
                  >
                     <Phone size={24} fill="currentColor" /> Initiate Synchronized Session
                  </button>
               )}
            </div>
            
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mb-32" />
         </div>
      </div>

      {/* MIDDLE: LEAD SELECT / SEARCH */}
      <div className="xl:col-span-2 space-y-10">
         <AnimatePresence mode="wait">
            {callStatus === 'TAGGING' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-12 rounded-[48px] border border-blue-100 shadow-2xl h-full flex flex-col justify-between">
                 <div className="space-y-12">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight">Call Disposition Mandatory</h3>
                       <p className="text-sm font-medium text-slate-400">Classify the outcome for <span className="text-blue-600 font-bold">{activeLead?.customerName}</span> before Refresh.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {['INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'NO_ANSWER', 'WRONG_NUMBER', 'WON'].map(s => (
                         <button 
                           key={s}
                           onClick={() => setTaggingData({...taggingData, status: s})}
                           className={`h-20 px-4 rounded-[24px] border text-[10px] font-bold uppercase tracking-widest transition-all ${
                             taggingData.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'
                           }`}
                         >
                            {s.replace('_', ' ')}
                         </button>
                       ))}
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Session Notes & Intelligence</label>
                       <textarea 
                          placeholder="Provide behavioral cues and strategic summary..."
                          className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-medium text-sm"
                          value={taggingData.notes} onChange={e => setTaggingData({...taggingData, notes: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="pt-12 flex items-center justify-between border-t border-slate-50">
                    <div className="flex items-center gap-6">
                       <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                          <Clock size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration Recorded</p>
                          <p className="text-2xl font-bold text-[#0F172A] tracking-tighter tabular-nums">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</p>
                       </div>
                    </div>
                    <button 
                      onClick={submitTagging}
                      className="h-18 px-12 bg-[#0F172A] text-white rounded-[24px] font-bold uppercase text-xs tracking-widest shadow-2xl hover:brightness-125 transition-all"
                    >
                       Commit & Refresh Sequence
                    </button>
                 </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Target Lead Repository</h3>
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] italic">Personal Assignment Hub</p>
                    </div>
                    <div className="relative group">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                       <input 
                          type="text" placeholder="Direct query by customer identity..." 
                          className="w-full h-16 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                       />
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                       {leads?.map(lead => (
                         <div 
                           key={lead.id}
                           onClick={() => callStatus === 'IDLE' && setActiveLead(lead)}
                           className={`p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${
                             activeLead?.id === lead.id ? 'bg-blue-50 border-blue-200 shadow-lg' : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50/50'
                           }`}
                         >
                            <div className="flex items-center gap-6">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                 activeLead?.id === lead.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                               }`}>
                                  <Target size={22} />
                               </div>
                               <div>
                                  <p className="text-lg font-bold text-[#0F172A] tracking-tight">{lead.customerName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-tight">{lead.phone}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-bold uppercase">{lead.status}</span>
                               <ChevronRight size={18} className={`transition-all ${activeLead?.id === lead.id ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group border border-emerald-500">
                       <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-6">Today's Performance</h4>
                       <div className="flex items-end justify-between relative z-10">
                          <div>
                             <p className="text-4xl font-extrabold tracking-tighter tabular-nums">12/40</p>
                             <p className="text-[10px] font-bold uppercase mt-2 opacity-60">Call Quota Velocity</p>
                          </div>
                          <CheckCircle2 size={48} className="opacity-10 group-hover:scale-125 transition-transform duration-700" />
                       </div>
                    </div>
                    <div className="bg-violet-600 p-8 rounded-[40px] text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group border border-violet-500">
                       <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-6">Active Converison</h4>
                       <div className="flex items-end justify-between relative z-10">
                          <div>
                             <p className="text-4xl font-extrabold tracking-tighter tabular-nums">84%</p>
                             <p className="text-[10px] font-bold uppercase mt-2 opacity-60">Personal Score card</p>
                          </div>
                          <ShieldCheck size={48} className="opacity-10 group-hover:scale-125 transition-transform duration-700" />
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentDialer;
