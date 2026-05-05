import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const TelephonyContext = createContext();

export const TelephonyProvider = ({ children }) => {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, ringing, in-progress, completed
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // 1. INITIALIZE TWILIO DEVICE
  const initDevice = async () => {
    if (!user) return; // SAFETY: Do not init if not logged in
    try {
      const { data } = await api.get('/call/token');
      const newDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalAudio: false,
        enableIceRestart: true,
      });

      newDevice.on('registered', () => console.log('Twilio Device Registered'));
      newDevice.on('error', (error) => console.error('Twilio Device Error:', error));
      
      newDevice.on('incoming', (incomingCall) => {
        setCall(incomingCall);
        setCallState('ringing');
        incomingCall.on('accept', () => setCallState('in-progress'));
        incomingCall.on('disconnect', () => endCall());
      });

      await newDevice.register();
      setDevice(newDevice);
    } catch (error) {
      console.error('Failed to init telephony:', error);
    }
  };

  useEffect(() => {
    if (user) {
      initDevice();
    }
    return () => {
      if (device) {
        device.destroy();
        setDevice(null);
      }
    };
  }, [user]);

  // 2. CALL ACTIONS
  const makeCall = async (phoneNumber, leadId = null) => {
    if (!device) return toast.error('Telephony not initialized');
    
    try {
      setCallState('ringing');
      const params = { To: phoneNumber, leadId };
      const outgoingCall = await device.connect({ params });
      
      setCall(outgoingCall);

      outgoingCall.on('accept', () => {
        setCallState('in-progress');
        startTimer();
      });

      outgoingCall.on('disconnect', () => endCall());
      outgoingCall.on('reject', () => endCall());
    } catch (error) {
      toast.error('Call failed to initiate');
      setCallState('idle');
    }
  };

  const endCall = () => {
    if (call) call.disconnect();
    setCall(null);
    setCallState('completed');
    stopTimer();
    setTimeout(() => setCallState('idle'), 3000);
  };

  const toggleMute = () => {
    if (call) {
      const newMuteStatus = !isMuted;
      call.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
    }
  };

  // 3. TIMER LOGIC
  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TelephonyContext.Provider value={{
      callState,
      isMuted,
      duration,
      formatDuration,
      makeCall,
      endCall,
      toggleMute,
      activeCall: call
    }}>
      {children}
    </TelephonyContext.Provider>
  );
};

export const useTelephony = () => useContext(TelephonyContext);
