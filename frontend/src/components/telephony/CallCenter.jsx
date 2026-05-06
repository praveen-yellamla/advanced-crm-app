import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  ChevronDown, 
  X,
  Clock,
  User,
  Tag,
  FileText,
  Delete,
  Signal,
  SignalHigh,
  SignalLow,
  Grid3X3,
  ListRestart
} from 'lucide-react';
import { useTelephony } from '../../context/TelephonyContext';
import { formatPhoneNumber } from '../../utils/phoneUtils';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CallCenter = () => {
  const { 
    callState, 
    isMuted, 
    duration, 
    formatDuration, 
    makeCall, 
    endCall, 
    toggleMute, 
    sendDigits,
    activeCall,
    lastCallSid,
    networkQuality
  } = useTelephony();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [disposition, setDisposition] = useState({ tags: 'Interested', notes: '' });

  const handleDial = (num) => {
    if (callState === 'in-progress') {
      sendDigits(num.toString());
    } else {
      setPhoneNumber(prev => formatPhoneNumber(prev + num));
    }
  };

  const handleBackspace = () => setPhoneNumber(prev => prev.slice(0, -1));
  
  const handleCall = () => {
    if (phoneNumber) {
      makeCall(phoneNumber);
      setIsOpen(true);
    } else {
      toast.error('Enter destination number');
    }
  };

  const submitDisposition = async () => {
    try {
      await api.post('/call/tag', {
        callSid: lastCallSid,
        ...disposition
      });
      toast.success('Communication synchronized');
      setPhoneNumber('');
      setDisposition({ tags: 'Interested', notes: '' });
      setIsOpen(false);
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const getNetworkIcon = () => {
    if (networkQuality >= 4) return <SignalHigh size={14} className="text-emerald-500" />;
    if (networkQuality >= 2) return <Signal size={14} className="text-amber-500" />;
    return <SignalLow size={14} className="text-red-500 animate-pulse" />;
  };

  return (
    <div className="fixed bottom-10 right-32 z-[200]">
      {/* FLOATING ACTION BUTTON */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-[32px] shadow-2xl flex items-center justify-center transition-all relative ${
          callState !== 'idle' ? 'bg-red-500' : 'bg-[#0F172A]'
        } text-white`}
      >
        <AnimatePresence mode="wait">
           {callState !== 'idle' ? (
             <motion.div key="off" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <PhoneOff size={32} />
             </motion.div>
           ) : (
             <motion.div key="on" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                <Phone size={32} />
             </motion.div>
           )}
        </AnimatePresence>
        {callState === 'in-progress' && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            className="absolute bottom-24 right-0 w-[380px] bg-white/95 backdrop-blur-2xl rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-200/50 overflow-hidden flex flex-col"
          >
            {/* PREMIUM HEADER */}
            <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
               <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${
                       callState === 'in-progress' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 
                       callState === 'ringing' ? 'bg-amber-500 animate-ping' : 'bg-slate-700'
                     }`} />
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Telephony System</p>
                        <h4 className="text-xs font-black uppercase tracking-widest mt-0.5">
                           {callState.replace('-', ' ')}
                        </h4>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     {getNetworkIcon()}
                     <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={16} />
                     </button>
                  </div>
               </div>
            </div>

            {/* MAIN INTERFACE */}
            <div className="p-10">
               <AnimatePresence mode="wait">
                  {callState === 'idle' ? (
                    <motion.div key="dialer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                       <div className="relative group">
                          <input 
                            type="text" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                            placeholder="+91 000 000 0000"
                            className="w-full h-24 bg-slate-50 border-none rounded-[32px] px-8 text-3xl font-black text-slate-900 text-center placeholder:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                          {phoneNumber && (
                            <button onClick={handleBackspace} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                               <Delete size={24} />
                            </button>
                          )}
                       </div>

                       <div className="grid grid-cols-3 gap-6">
                          {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((num) => (
                            <button 
                              key={num}
                              onClick={() => handleDial(num)}
                              className="aspect-square rounded-[28px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-black text-2xl active:scale-90 transition-all flex flex-col items-center justify-center group"
                            >
                               {num}
                               <span className="text-[8px] text-slate-300 group-hover:text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  {num === 2 ? 'abc' : num === 3 ? 'def' : ''}
                               </span>
                            </button>
                          ))}
                       </div>

                       <button 
                         onClick={handleCall}
                         className="w-full h-20 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                       >
                         <Phone size={24} /> Initiate Call
                       </button>
                    </motion.div>
                  ) : callState === 'completed' ? (
                    <motion.div key="postcall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                       <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto">
                             <Signal size={32} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-900 tracking-tight">Call Finalized</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Duration: {formatDuration(duration)}</p>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={12} className="text-blue-500" /> Interaction Outcome
                             </label>
                             <select 
                               value={disposition.tags}
                               onChange={(e) => setDisposition({...disposition, tags: e.target.value})}
                               className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                             >
                                <option>Interested</option>
                                <option>Not Interested</option>
                                <option>Callback Requested</option>
                                <option>Demo Scheduled</option>
                                <option>Gatekeeper Rejection</option>
                                <option>Wrong Number</option>
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={12} className="text-blue-500" /> Strategic Notes
                             </label>
                             <textarea 
                               value={disposition.notes}
                               onChange={(e) => setDisposition({...disposition, notes: e.target.value})}
                               placeholder="What was discussed?"
                               className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-600 resize-none outline-none focus:border-blue-500 transition-all"
                             />
                          </div>
                          <button 
                            onClick={submitDisposition}
                            className="w-full h-16 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                          >
                             Sync to Lead Record
                          </button>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12 py-4">
                       <div className="text-center space-y-6">
                          <div className="relative inline-block">
                             <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600 mx-auto">
                                <User size={48} />
                             </div>
                             <motion.div 
                               animate={{ scale: [1, 1.2, 1] }} 
                               transition={{ repeat: Infinity, duration: 2 }}
                               className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center"
                             >
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                             </motion.div>
                          </div>
                          <div className="space-y-2">
                             <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">
                                {phoneNumber || 'Unknown'}
                             </h2>
                             <div className="flex items-center justify-center gap-3">
                                <Clock size={14} className="text-blue-500" />
                                <span className="text-lg font-mono font-black text-slate-400 italic">
                                   {formatDuration(duration)}
                                </span>
                             </div>
                          </div>
                       </div>

                       {/* ACTIVE CONTROLS */}
                       <div className="grid grid-cols-1 gap-8">
                          <div className="flex justify-center gap-8">
                             <button 
                               onClick={toggleMute}
                               className={`w-20 h-20 rounded-[32px] flex items-center justify-center transition-all ${
                                 isMuted ? 'bg-red-500 text-white shadow-xl shadow-red-500/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                               }`}
                             >
                                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                             </button>
                             <button 
                               onClick={endCall}
                               className="w-24 h-24 bg-red-500 text-white rounded-[40px] shadow-2xl shadow-red-500/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                             >
                                <PhoneOff size={36} />
                             </button>
                             <button 
                               onClick={() => setShowKeypad(!showKeypad)}
                               className={`w-20 h-20 rounded-[32px] flex items-center justify-center transition-all ${
                                 showKeypad ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                               }`}
                             >
                                <Grid3X3 size={28} />
                             </button>
                          </div>

                          {showKeypad && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                               {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((num) => (
                                 <button 
                                   key={num}
                                   onClick={() => handleDial(num)}
                                   className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-xl active:scale-90 transition-all"
                                 >
                                    {num}
                                 </button>
                               ))}
                            </motion.div>
                          )}
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* FOOTER DIAGNOSTICS */}
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encrypted Voice Grid</span>
               </div>
               <div className="flex items-center gap-4">
                  <button className="text-slate-300 hover:text-blue-600 transition-colors">
                     <ListRestart size={16} />
                  </button>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">v2.4 Production</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallCenter;
