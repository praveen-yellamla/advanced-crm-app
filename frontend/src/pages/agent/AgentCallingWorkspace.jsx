import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Phone, Mic, MicOff, Pause, Play, PhoneOff, Search, UserPlus, 
  Clock, Activity, Target, ChevronRight, Headphones, 
  Volume2, Settings, Sparkles, ArrowRight, Disc, PhoneForwarded, History, User, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTelephony } from '../../context/TelephonyContext';
import { formatPhoneNumber } from '../../utils/phoneUtils';
import TelephonySettingsModal from '../../components/telephony/TelephonySettingsModal';

const AgentCallingWorkspace = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { 
    callState, 
    isMuted, 
    onHold,
    isRecording,
    duration, 
    formatDuration, 
    toggleMute,
    toggleHoldCall,
    toggleRecordCall,
    transferActiveCall,
    activeCall,
    lastCallSid,
    makeCall,
    endCall,
    sendDigits
  } = useTelephony();

  const [activeLead, setActiveLead] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState('TRANSCRIPT');
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

  const { data: tasks } = useQuery({
    queryKey: ['agentTasksDashboard'],
    queryFn: async () => {
      const res = await api.get('/agent/tasks');
      return res.data.data || [];
    }
  });

  const logCallMutation = useMutation({
    mutationFn: (data) => api.post('/call/tag', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentDashboard', 'agentLeads', 'agentHistory']);
      toast.success('Call logged successfully');
      setPhoneNumber('');
      setActiveLead(null);
      setTaggingData({ status: 'INTERESTED', notes: '', callbackDate: '' });
    }
  });

  const startCall = () => {
    const target = phoneNumber || activeLead?.phone;
    if (!target) return toast.error('Please enter a phone number or select a lead');
    makeCall(target, activeLead?.id);
  };

  const submitTagging = () => {
    logCallMutation.mutate({
      callSid: lastCallSid,
      tags: taggingData.status,
      notes: taggingData.notes,
      duration: duration,
      phone: activeLead?.phone || phoneNumber,
      leadId: activeLead?.id
    });
  };

  useEffect(() => {
    if (activeLead && callState === 'idle') {
      setPhoneNumber(activeLead.phone);
    }
  }, [activeLead]);

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <Phone size={24} />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Calling Workspace</h1>
               <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${callState === 'in-progress' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {callState === 'idle' ? 'System Ready' : `Call Status: ${callState}`}
                  </span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="px-5 h-12 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-blue-300 hover:bg-slate-50 transition-all shadow-sm">
               <Mic size={16} className="text-slate-500" />
               <span className="text-[11px] font-bold text-slate-600 tracking-wide hidden sm:inline-block">Mic</span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="px-5 h-12 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-blue-300 hover:bg-slate-50 transition-all shadow-sm">
               <Volume2 size={16} className="text-slate-500" />
               <span className="text-[11px] font-bold text-slate-600 tracking-wide hidden sm:inline-block">Speaker</span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
               <Settings size={20} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         
         {/* LEFT COLUMN: DIALPAD & PIPELINE */}
         <div className="xl:col-span-3 flex flex-col gap-8">
            
            {/* DIALPAD */}
            <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl text-white flex flex-col">
               <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 text-center">Dialpad</div>
               <div className="space-y-1 mb-8 text-center">
                 <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    placeholder="+91 0000 000 000"
                    className="w-full bg-transparent border-none text-3xl font-black text-center tracking-wider focus:ring-0 placeholder:text-white/20 outline-none p-0"
                 />
                 {activeLead && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2 truncate">{activeLead.customerName}</p>}
               </div>
               
               <div className="grid grid-cols-3 gap-3 mb-8 px-4">
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => (
                    <button 
                      key={n} 
                      onClick={() => {
                        if (callState === 'connected' || callState === 'ringing' || callState === 'in-progress') {
                          sendDigits(n.toString());
                        } else {
                          setPhoneNumber(prev => formatPhoneNumber(prev + n));
                        }
                      }}
                      className="aspect-square rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 text-2xl font-medium transition-all flex items-center justify-center"
                    >
                      {n}
                    </button>
                  ))}
               </div>

               <button 
                  disabled={callState !== 'idle'}
                  onClick={startCall}
                  className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all ${
                    callState !== 'idle' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                  }`}
               >
                  <Phone size={20} fill="currentColor" /> Start Call
               </button>
            </div>

            {/* PIPELINE SELECTOR */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col max-h-[500px]">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Leads Pipeline</h3>
                  <Target size={16} className="text-slate-400" />
               </div>
               <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search leads..." className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
               </div>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {leads?.map(lead => (
                    <div 
                      key={lead.id}
                      onClick={() => callState === 'idle' && setActiveLead(lead)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        activeLead?.id === lead.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50'
                      }`}
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeLead?.id === lead.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                             <User size={14} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-bold text-slate-900 truncate">{lead.customerName}</p>
                             <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">{lead.phone}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* CENTER COLUMN: ACTIVE CALL CONTEXT */}
         <div className="xl:col-span-6 flex flex-col gap-8 h-full min-h-[600px]">
            <AnimatePresence mode="wait">
               {callState === 'idle' ? (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center p-12 relative overflow-hidden min-h-[500px]"
                  >
                     <div className="relative z-10 space-y-6 max-w-sm">
                        <div className="w-24 h-24 rounded-full bg-slate-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner border border-slate-100">
                           <Headphones size={40} />
                        </div>
                        <div className="space-y-2">
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ready to Connect</h2>
                           <p className="text-slate-500 font-medium text-sm leading-relaxed">Select a lead from your pipeline or use the dialpad to start a new conversation.</p>
                        </div>
                     </div>
                  </motion.div>
               ) : (
                  <motion.div 
                    key="active"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col gap-8"
                  >
                     {/* ACTIVE CALL HUD */}
                     <div className="bg-slate-900 p-10 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white mb-4 relative shadow-lg shadow-blue-600/30">
                           <User size={32} />
                           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                              <Activity size={12} className="animate-pulse text-white" />
                           </div>
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-2">{activeLead?.customerName || phoneNumber || 'Unknown Caller'}</h2>
                        
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full mb-10 border border-white/5">
                           <Clock size={14} className="text-blue-400" />
                           <span className="text-sm font-bold text-white tracking-widest tabular-nums">{formatDuration(duration)}</span>
                        </div>

                        {/* CALL CONTROLS */}
                        <div className="flex items-center justify-center gap-6 md:gap-10 w-full mb-10">
                           <div className="flex flex-col items-center gap-3">
                              <ControlButton icon={isMuted ? MicOff : Mic} active={isMuted} onClick={toggleMute} color="amber" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mute</span>
                           </div>
                           <div className="flex flex-col items-center gap-3">
                              <ControlButton icon={onHold ? Play : Pause} active={onHold} onClick={() => toggleHoldCall(activeLead?.phone || phoneNumber, activeLead?.id)} color="blue" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hold</span>
                           </div>
                           <div className="flex flex-col items-center gap-3">
                              <ControlButton icon={Disc} active={isRecording} onClick={() => toggleRecordCall(activeLead?.id)} color="rose" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Record</span>
                           </div>
                           <div className="flex flex-col items-center gap-3">
                              <ControlButton icon={PhoneForwarded} active={false} onClick={() => {
                                const target = prompt('Enter agent phone number to transfer to:');
                                if (target) transferActiveCall(activeLead?.phone || phoneNumber, target, activeLead?.id);
                              }} color="slate" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transfer</span>
                           </div>
                        </div>

                        <button 
                           onClick={endCall}
                           className="h-16 px-16 rounded-full bg-rose-600 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-rose-600/30 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all w-full max-w-sm"
                        >
                           <PhoneOff size={24} /> End Call
                        </button>
                     </div>

                     {/* CALL CONTEXT TABS */}
                     <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="flex items-center gap-8 px-8 pt-6 border-b border-slate-100 shrink-0">
                           <TabBtn active={activeTab === 'TRANSCRIPT'} label="Live Transcript" onClick={() => setActiveTab('TRANSCRIPT')} />
                           <TabBtn active={activeTab === 'NOTES'} label="Call Notes" onClick={() => setActiveTab('NOTES')} />
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                           {activeTab === 'TRANSCRIPT' && (
                              <div className="space-y-6">
                                 <TranscriptRow role="system" text="Connection established. Call is being recorded." time="00:01" />
                                 <TranscriptRow role="agent" text={`Hello, am I speaking with ${activeLead?.customerName || 'the customer'}?`} time="00:05" />
                                 <div className="flex justify-start py-4 opacity-40">
                                    <div className="flex gap-1.5">
                                       {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}} />)}
                                    </div>
                                 </div>
                              </div>
                           )}
                           {activeTab === 'NOTES' && (
                              <div className="h-full flex flex-col gap-4">
                                 <textarea 
                                    placeholder="Type your notes here during the conversation..."
                                    className="flex-1 w-full bg-white border border-slate-200 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium text-slate-700 leading-relaxed shadow-sm"
                                    value={taggingData.notes}
                                    onChange={e => setTaggingData({...taggingData, notes: e.target.value})}
                                 />
                              </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* RIGHT COLUMN: TASKS */}
         <div className="xl:col-span-3 flex flex-col gap-8">
            <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl flex flex-col flex-1 h-full min-h-[500px]">
               <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Pending Tasks</h3>
                  <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                     <UserPlus size={14} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                  {!tasks || tasks.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 text-sm font-bold italic">No pending tasks found.</div>
                  ) : tasks.map(task => (
                     <div key={task.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{task.title}</p>
                          <CheckCircle size={16} className="text-slate-600 hover:text-emerald-400 shrink-0 ml-2" />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                              task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 
                              task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                           }`}>{task.priority}</span>
                           <span className="text-[10px] font-semibold text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
      
      {/* POST-CALL SAVE OVERLAY */}
      <AnimatePresence>
         {callState === 'disconnected' && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
            >
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Log Call Details</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Review and save for {activeLead?.customerName || phoneNumber}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                        <p className="text-2xl font-black text-blue-600 tabular-nums">{formatDuration(duration)}</p>
                     </div>
                  </div>
                  
                  <div className="p-8 overflow-y-auto flex-1 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Call Outcome</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {['INTERESTED', 'FOLLOW_UP', 'CALLBACK', 'NEGOTIATION', 'WON', 'LOST'].map(s => (
                              <button 
                                 key={s}
                                 onClick={() => setTaggingData({...taggingData, status: s})}
                                 className={`h-12 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    taggingData.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                                 }`}
                              >
                                 {s.replace('_', ' ')}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Summary Notes</label>
                        <textarea 
                           placeholder="What was discussed?"
                           className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 resize-none"
                           value={taggingData.notes}
                           onChange={e => setTaggingData({...taggingData, notes: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                     <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        Cancel
                     </button>
                     <button 
                        onClick={submitTagging}
                        className="h-12 px-8 bg-blue-600 text-white rounded-xl font-bold tracking-wide shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                     >
                        Save Call Log <ArrowRight size={16} />
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* HARDWARE SETTINGS */}
      <TelephonySettingsModal 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

const AudioSettingBtn = ({ icon: Icon, label }) => (
  <button className="px-5 h-12 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-blue-300 hover:bg-slate-50 transition-all shadow-sm">
     <Icon size={16} className="text-slate-500" />
     <span className="text-[11px] font-bold text-slate-600 tracking-wide hidden sm:inline-block">{label}</span>
  </button>
);

const ControlButton = ({ icon: Icon, active, onClick, color }) => {
  const colors = {
    amber: active ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/5',
    blue: active ? 'bg-blue-500 text-white border-blue-400 shadow-blue-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/5',
    rose: active ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/5',
    slate: 'bg-white/10 text-white hover:bg-white/20 border-white/5'
  };
  return (
    <button 
      onClick={onClick}
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all border ${colors[color]} shadow-lg`}
    >
       <Icon size={22} className={active ? 'animate-pulse' : ''} />
    </button>
  );
};

const TabBtn = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`pb-4 text-xs font-black uppercase tracking-wider relative transition-colors ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
  >
     {label}
     {active && <motion.div layoutId="call-tab-line" className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
  </button>
);

const TranscriptRow = ({ role, text, time }) => (
  <div className="flex gap-4 group">
     <span className="text-[10px] font-black text-slate-400 w-10 shrink-0 mt-1 tabular-nums">{time}</span>
     <div className="space-y-1 flex-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${role === 'system' ? 'text-slate-400' : role === 'agent' ? 'text-blue-600' : 'text-slate-900'}`}>{role}</p>
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">{text}</p>
     </div>
  </div>
);

export default AgentCallingWorkspace;
