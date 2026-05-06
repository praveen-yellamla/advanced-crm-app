import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { formatPhoneNumber } from '../utils/phoneUtils';

const TelephonyContext = createContext();

export const TelephonyProvider = ({ children }) => {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [lastCallSid, setLastCallSid] = useState('');
  const [callState, setCallState] = useState('idle'); // idle, ringing, in-progress, completed
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(5); // 1-5
  const timerRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // 1. INITIALIZE TWILIO DEVICE
  const initDevice = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/call/token');
      const newDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        enableIceRestart: true,
        maxCallSignalingTimeoutMs: 30000
      });

      newDevice.on('registered', () => {
        console.log('TELEPHONY: Device Registered');
        reconnectAttempts.current = 0;
      });

      newDevice.on('error', (error) => {
        console.error('TELEPHONY: Device Error:', error);
        if (error.code === 31005 && reconnectAttempts.current < 3) {
          reconnectAttempts.current++;
          setTimeout(initDevice, 2000);
        }
      });

      newDevice.on('network', (level) => setNetworkQuality(level));

      newDevice.on('incoming', (incomingCall) => {
        setCall(incomingCall);
        setCallState('ringing');
        
        incomingCall.on('accept', () => {
          setCallState('in-progress');
          startTimer();
        });

        incomingCall.on('disconnect', () => handleCallEnd());
        incomingCall.on('reject', () => handleCallEnd());
      });

      await newDevice.register();
      setDevice(newDevice);
    } catch (error) {
      console.error('TELEPHONY: Init Failed:', error);
    }
  }, [user]);

  useEffect(() => {
    initDevice();
    return () => {
      if (device) {
        device.destroy();
        setDevice(null);
      }
    };
  }, [initDevice]);

  // 2. CALL LIFECYCLE HANDLERS
  const handleCallEnd = useCallback(() => {
    setCall(null);
    setCallState('completed');
    stopTimer();
    setIsMuted(false);
    setTimeout(() => setCallState('idle'), 5000);
  }, []);

  const makeCall = async (phoneNumber, leadId = null) => {
    if (!device) {
      toast.error('Telephony core offline. Reconnecting...');
      return initDevice();
    }
    
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      setCallState('ringing');
      
      const outgoingCall = await device.connect({ 
        params: { To: formattedTo, leadId, agentId: user?.id } 
      });
      
      setCall(outgoingCall);

      outgoingCall.on('accept', () => {
        setCallState('in-progress');
        if (outgoingCall.parameters?.CallSid) {
          setLastCallSid(outgoingCall.parameters.CallSid);
        }
        startTimer();
      });

      outgoingCall.on('disconnect', () => handleCallEnd());
      outgoingCall.on('reject', () => handleCallEnd());
      outgoingCall.on('error', (err) => {
        console.error('Call Error:', err);
        toast.error('Call failed');
        handleCallEnd();
      });

    } catch (error) {
      toast.error('Could not initiate call');
      setCallState('idle');
    }
  };

  const endCall = () => {
    if (call) {
      if (call.parameters?.CallSid) setLastCallSid(call.parameters.CallSid);
      call.disconnect();
    }
    handleCallEnd();
  };

  const toggleMute = () => {
    if (call) {
      const newMuteStatus = !isMuted;
      call.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
    }
  };

  const sendDigits = (digits) => {
    if (call) call.sendDigits(digits);
  };

  // 3. MONITORING & TOOLS
  const monitorActiveCall = async (phoneNumber) => {
    if (!device) return toast.error('Telephony offline');
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      setCallState('ringing');
      const monitoringCall = await device.connect({ 
        params: { To: formattedTo, isMonitor: 'true' } 
      });
      
      setCall(monitoringCall);
      monitoringCall.on('accept', () => setCallState('in-progress'));
      monitoringCall.on('disconnect', () => handleCallEnd());
    } catch (error) {
      toast.error('Monitoring failed');
      setCallState('idle');
    }
  };

  // 4. UTILS
  const startTimer = () => {
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
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
      sendDigits,
      activeCall: call,
      lastCallSid,
      networkQuality,
      monitorActiveCall
    }}>
      {children}
    </TelephonyContext.Provider>
  );
};

export const useTelephony = () => useContext(TelephonyContext);
