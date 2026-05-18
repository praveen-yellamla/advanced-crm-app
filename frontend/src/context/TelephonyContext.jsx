import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { formatPhoneNumber } from '../utils/phoneUtils';

const TelephonyContext = createContext();

export function TelephonyProvider({ children }) {
  const { user } = useAuth();
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [lastCallSid, setLastCallSid] = useState('');
  const [callState, setCallState] = useState('idle'); // idle, ringing, in-progress, completed
  const [isMuted, setIsMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
    setOnHold(false);
    setIsRecording(false);
    setTimeout(() => setCallState('idle'), 5000);
  }, []);

  const makeCall = async (phoneNumber, leadId = null) => {
    if (!device) {
      setCallState('connecting');
      toast.loading('Telephony core initializing...');
      return initDevice();
    }
    
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      console.log(`TELEPHONY: Dialing ${formattedTo}`);
      setCallState('connecting');
      
      const outgoingCall = await device.connect({ 
        params: { To: formattedTo, leadId, agentId: user?.id } 
      });
      
      setCall(outgoingCall);
      setCallState('ringing');

      outgoingCall.on('accept', () => {
        console.log('TELEPHONY: Call Answered');
        setCallState('connected');
        if (outgoingCall.parameters?.CallSid) {
          setLastCallSid(outgoingCall.parameters.CallSid);
        }
        startTimer();
      });

      outgoingCall.on('disconnect', () => {
        console.log('TELEPHONY: Call Disconnected');
        setCallState('disconnected');
        handleCallEnd();
      });

      outgoingCall.on('reject', () => {
        console.log('TELEPHONY: Call Rejected');
        setCallState('failed');
        handleCallEnd();
      });

      outgoingCall.on('error', (err) => {
        console.error('TELEPHONY: Call Error:', err);
        toast.error(`Call failed: ${err.message}`);
        setCallState('failed');
        handleCallEnd();
      });

    } catch (error) {
      console.error('TELEPHONY: Initiate Error:', error);
      toast.error('Could not connect to voice grid');
      setCallState('failed');
      setTimeout(() => setCallState('idle'), 3000);
    }
  };

  const endCall = () => {
    if (call) {
      console.log('TELEPHONY: Manual Terminate');
      if (call.parameters?.CallSid) setLastCallSid(call.parameters.CallSid);
      call.disconnect();
    }
    setCallState('disconnected');
    handleCallEnd();
  };

  const toggleMute = () => {
    if (call) {
      const newMuteStatus = !isMuted;
      call.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
      toast.success(newMuteStatus ? 'Microphone Muted' : 'Microphone Active');
    }
  };

  const toggleHoldCall = async (phone, leadId) => {
    if (!call) return;
    try {
      const newHoldState = !onHold;
      const res = await api.post('/call/hold', { phone, hold: newHoldState, leadId });
      if (res.data.success) {
        setOnHold(newHoldState);
        toast.success(newHoldState ? 'Call placed on hold' : 'Call resumed');
      }
    } catch (error) {
      toast.error('Failed to toggle hold. Using local mute fallback.');
      toggleMute(); // Fallback to muting the agent if the conference update fails
    }
  };

  const toggleRecordCall = async (leadId) => {
    if (!lastCallSid) return;
    try {
      const newRecordState = !isRecording;
      const res = await api.post('/call/record/toggle', { callSid: lastCallSid, record: newRecordState, leadId });
      if (res.data.success) {
        setIsRecording(newRecordState);
        toast.success(newRecordState ? 'Recording started' : 'Recording stopped');
      }
    } catch (error) {
      toast.error('Failed to toggle recording');
    }
  };

  const transferActiveCall = async (phone, targetAgentPhone, leadId) => {
    try {
      const res = await api.post('/call/transfer', { phone, targetAgentPhone, leadId });
      if (res.data.success) {
        toast.success('Call transferred successfully');
        endCall(); // End our leg since it's transferred
      }
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  const sendDigits = (digits) => {
    if (call) {
      console.log(`TELEPHONY: Sending DTMF: ${digits}`);
      call.sendDigits(digits);
    }
  };

  // 3. MONITORING & TOOLS
  const monitorActiveCall = async (phoneNumber) => {
    if (!device) return toast.error('Telephony offline');
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      setCallState('connecting');
      const monitoringCall = await device.connect({ 
        params: { To: formattedTo, isMonitor: 'true' } 
      });
      
      setCall(monitoringCall);
      monitoringCall.on('accept', () => setCallState('connected'));
      monitoringCall.on('disconnect', () => {
        setCallState('disconnected');
        handleCallEnd();
      });
    } catch (error) {
      toast.error('Monitoring link failed');
      setCallState('failed');
      setTimeout(() => setCallState('idle'), 3000);
    }
  };

  // 4. UTILS
  const startTimer = () => {
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Don't increment timer if on hold
      setOnHold((currentHold) => {
        if (!currentHold) {
          setDuration(prev => prev + 1);
        }
        return currentHold;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const value = React.useMemo(() => ({
    callState,
    isMuted,
    onHold,
    isRecording,
    duration,
    formatDuration,
    makeCall,
    endCall,
    toggleMute,
    toggleHoldCall,
    toggleRecordCall,
    transferActiveCall,
    sendDigits,
    activeCall: call,
    lastCallSid,
    networkQuality,
    monitorActiveCall
  }), [callState, isMuted, onHold, isRecording, duration, call, lastCallSid, networkQuality, makeCall, monitorActiveCall]);

  return (
    <TelephonyContext.Provider value={value}>
      {children}
    </TelephonyContext.Provider>
  );
}

export const useTelephony = () => useContext(TelephonyContext);
