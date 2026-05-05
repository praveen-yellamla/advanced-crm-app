import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { useTelephony } from '../../context/TelephonyContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CallCenter = () => {
  const { callState, isMuted, duration, formatDuration, makeCall, endCall, toggleMute, activeCall } = useTelephony();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [disposition, setDisposition] = useState({ tags: 'Interested', notes: '' });

  const handleDial = (num) => setPhoneNumber(prev => prev + num);
  
  const handleCall = () => {
    if (phoneNumber) {
      makeCall(phoneNumber);
      setIsOpen(true);
    } else {
      toast.error('Enter a valid destination');
    }
  };

  const submitDisposition = async () => {
    try {
      await api.post('/call/tag', {
        callSid: activeCall?.parameters?.CallSid || '', // Fallback for simulation
        ...disposition
      });
      toast.success('Call log synchronized');
      setPhoneNumber('');
      setDisposition({ tags: 'Interested', notes: '' });
    } catch (error) {
      toast.error('Failed to save disposition');
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[200]">
      {/* FLOATING TRIGGER */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          callState !== 'idle' ? 'bg-red-500 animate-pulse' : 'bg-blue-600'
        } text-white`}
      >
        {callState !== 'idle' ? <PhoneOff size={28} /> : <Phone size={28} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  callState === 'in-progress' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                  callState === 'ringing' ? 'bg-amber-500 animate-ping' : 'bg-slate-500'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {callState.replace('-', ' ')}
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* CALL STATE CONTENT */}
            <div className="p-8 space-y-8">
              {callState === 'idle' ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter Destination"
                      className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-xl font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* DIAL PAD */}
                  <div className="grid grid-cols-3 gap-4">
                    {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((num) => (
                      <button 
                        key={num}
                        onClick={() => handleDial(num)}
                        className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg active:scale-95 transition-all"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleCall}
                    className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Initiate Call
                  </button>
                </div>
              ) : callState === 'completed' ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                     <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Post-Call Disposition</h4>
                     <p className="text-xs font-bold text-slate-900 italic">Call with {phoneNumber || 'Customer'}</p>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Tag size={12} /> Lead Disposition
                        </label>
                        <select 
                          value={disposition.tags}
                          onChange={(e) => setDisposition({...disposition, tags: e.target.value})}
                          className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-xs font-bold text-slate-900"
                        >
                           <option>Interested</option>
                           <option>Not Interested</option>
                           <option>Callback Request</option>
                           <option>Wrong Number</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <FileText size={12} /> Interaction Notes
                        </label>
                        <textarea 
                          value={disposition.notes}
                          onChange={(e) => setDisposition({...disposition, notes: e.target.value})}
                          placeholder="Summarize the outcome..."
                          className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-xs font-medium text-slate-600 resize-none"
                        />
                     </div>
                     <button 
                       onClick={submitDisposition}
                       className="w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                     >
                        Save & Close
                     </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 py-6 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{phoneNumber || 'Connected'}</h2>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                       <Clock size={14} />
                       <span className="text-sm font-mono font-bold">{formatDuration(duration)}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6">
                    <button 
                      onClick={toggleMute}
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                        isMuted ? 'bg-red-100 text-red-600 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button 
                      onClick={endCall}
                      className="w-20 h-20 bg-red-500 text-white rounded-[32px] shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <PhoneOff size={32} />
                    </button>
                    <button className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                      <Pause size={24} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallCenter;
