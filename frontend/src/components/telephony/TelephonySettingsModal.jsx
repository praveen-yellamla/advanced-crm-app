import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Settings } from 'lucide-react';
import { useTelephony } from '../../context/TelephonyContext';

const TelephonySettingsModal = ({ isOpen, onClose }) => {
  const { setInputDevice, setOutputDevice } = useTelephony();
  const [mics, setMics] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        setMics(audioInputs);
        setSpeakers(audioOutputs);
        
        if (audioInputs.length > 0 && !selectedMic) setSelectedMic(audioInputs[0].deviceId);
        if (audioOutputs.length > 0 && !selectedSpeaker) setSelectedSpeaker(audioOutputs[0].deviceId);
      }).catch(err => console.error('Failed to enumerate media devices:', err));
    }
  }, [isOpen]);

  const handleMicChange = (e) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    setInputDevice(deviceId);
  };

  const handleSpeakerChange = (e) => {
    const deviceId = e.target.value;
    setSelectedSpeaker(deviceId);
    setOutputDevice(deviceId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <Settings className="text-blue-600" size={20} />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Audio Settings</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Mic size={14} /> Microphone
                </label>
                <select 
                  value={selectedMic} 
                  onChange={handleMicChange}
                  className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
                >
                  {mics.map(m => (
                    <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone (${m.deviceId.slice(0, 5)})`}</option>
                  ))}
                  {mics.length === 0 && <option value="">No microphones found</option>}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Volume2 size={14} /> Output Speaker
                </label>
                <select 
                  value={selectedSpeaker} 
                  onChange={handleSpeakerChange}
                  className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
                >
                  {speakers.map(s => (
                    <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker (${s.deviceId.slice(0, 5)})`}</option>
                  ))}
                  {speakers.length === 0 && <option value="">No speakers found</option>}
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={onClose} className="px-6 h-12 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors">
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TelephonySettingsModal;
