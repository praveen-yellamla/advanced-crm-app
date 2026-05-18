import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { formatPhoneNumber } from '../utils/phoneUtils';

const TelephonyContext = createContext();

export function TelephonyProvider({ children }) {
  const { user } = useAuth();
  
  // Use Refs for true Singleton persistence
  const deviceRef = useRef(null);
  const activeCallRef = useRef(null);
  
  // UI State mapping
  const [deviceState, setDeviceState] = useState('unregistered'); // registering, registered, unregistered, error
  const [callState, setCallState] = useState('idle'); // idle, connecting, ringing, connected, reconnecting, disconnected, failed
  const [lastCallSid, setLastCallSid] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(5);
  
  const timerRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // 1. INITIALIZE TWILIO DEVICE (Singleton)
  const initDevice = useCallback(async () => {
    if (!user) return;
    if (deviceRef.current && deviceRef.current.state === 'registered') return; // Already registered

    try {
      setDeviceState('registering');
      const { data } = await api.get('/call/token');
      
      const newDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        enableIceRestart: true,
        maxCallSignalingTimeoutMs: 30000,
        logLevel: 1 // warnings and errors only
      });

      // Device Lifecycle Events
      newDevice.on('registered', () => {
        console.log('TELEPHONY: Device Registered');
        setDeviceState('registered');
        reconnectAttempts.current = 0;
      });

      newDevice.on('registering', () => setDeviceState('registering'));
      newDevice.on('unregistered', () => setDeviceState('unregistered'));
      
      newDevice.on('tokenWillExpire', async () => {
        console.log('TELEPHONY: Token expiring soon. Refreshing...');
        try {
          const res = await api.get('/call/token');
          newDevice.updateToken(res.data.token);
        } catch (err) {
          console.error('TELEPHONY: Failed to refresh token', err);
        }
      });

      newDevice.on('error', (error) => {
        console.error('TELEPHONY: Device Error:', error);
        // Do NOT automatically destroy the call on device error unless it's a fatal signaling error
        if (error.code === 31005 && reconnectAttempts.current < 3) {
          reconnectAttempts.current++;
          setTimeout(initDevice, 2000);
        }
      });

      newDevice.on('network', (level) => setNetworkQuality(level));

      newDevice.on('incoming', (incomingCall) => {
        if (activeCallRef.current) {
          incomingCall.reject(); // Reject if we are already on a call
          return;
        }
        
        activeCallRef.current = incomingCall;
        setCallState('ringing');
        
        bindCallEvents(incomingCall);
      });

      await newDevice.register();
      deviceRef.current = newDevice;
    } catch (error) {
      console.error('TELEPHONY: Init Failed:', error);
      setDeviceState('error');
    }
  }, [user]);

  // Bind all call lifecycle events securely
  const bindCallEvents = (callObj) => {
    callObj.on('accept', () => {
      console.log('TELEPHONY: Call Answered/Accepted');
      setCallState('connected');
      if (callObj.parameters?.CallSid) {
        setLastCallSid(callObj.parameters.CallSid);
      }
      startTimer();
    });

    callObj.on('ringing', () => {
      setCallState('ringing');
    });

    callObj.on('disconnect', () => {
      console.log('TELEPHONY: Call Disconnected explicitly by Twilio');
      handleCallEnd();
    });

    callObj.on('cancel', () => handleCallEnd());
    
    callObj.on('reject', () => {
      setCallState('failed');
      handleCallEnd();
    });

    callObj.on('reconnecting', () => {
      console.warn('TELEPHONY: Call reconnecting...');
      setCallState('reconnecting');
    });

    callObj.on('reconnected', () => {
      console.log('TELEPHONY: Call reconnected');
      setCallState('connected');
    });

    callObj.on('error', (err) => {
      console.error('TELEPHONY: Call Error:', err);
      // We do NOT disconnect here immediately. Let the 'disconnect' event handle the actual drop.
      // Many WebRTC or media errors are transient. We show a toast but keep UI alive.
      toast.error(`Connection warning: ${err.message}`);
    });
    
    callObj.on('warning', (warningName, warningData) => {
      console.warn('TELEPHONY: Call Warning:', warningName, warningData);
    });
  };

  useEffect(() => {
    initDevice();
    
    // Prevent premature cleanup on re-renders. 
    // Only destroy when the provider completely unmounts (e.g., user logs out).
    return () => {
      // Intentionally NOT destroying the device here to prevent HMR/rerender drops
    };
  }, [initDevice]);

  // 2. CALL LIFECYCLE HANDLERS
  const handleCallEnd = useCallback(() => {
    console.log('TELEPHONY: Triggering cleanup post-disconnect');
    activeCallRef.current = null;
    setCallState('disconnected');
    stopTimer();
    setIsMuted(false);
    setOnHold(false);
    setIsRecording(false);
    setTimeout(() => setCallState('idle'), 3000);
  }, []);

  const makeCall = async (phoneNumber, leadId = null) => {
    if (!deviceRef.current || deviceRef.current.state !== 'registered') {
      setCallState('connecting');
      toast.loading('Telephony core initializing...');
      await initDevice();
      if (!deviceRef.current || deviceRef.current.state !== 'registered') {
        toast.error('Telephony subsystem offline. Cannot place call.');
        setCallState('failed');
        setTimeout(() => setCallState('idle'), 3000);
        return;
      }
    }
    
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      console.log(`TELEPHONY: Dialing ${formattedTo}`);
      setCallState('connecting');
      
      const outgoingCall = await deviceRef.current.connect({ 
        params: { To: formattedTo, leadId: leadId ? leadId.toString() : '', agentId: user?.id?.toString() || '' } 
      });
      
      activeCallRef.current = outgoingCall;
      bindCallEvents(outgoingCall);

    } catch (error) {
      console.error('TELEPHONY: Initiate Error:', error);
      toast.error('Could not connect to voice grid');
      setCallState('failed');
      setTimeout(() => setCallState('idle'), 3000);
    }
  };

  const endCall = () => {
    if (activeCallRef.current) {
      console.log('TELEPHONY: Manual Terminate initiated by agent');
      if (activeCallRef.current.parameters?.CallSid) {
        setLastCallSid(activeCallRef.current.parameters.CallSid);
      }
      activeCallRef.current.disconnect();
    } else {
      // Failsafe if state is stuck
      handleCallEnd();
    }
  };

  const toggleMute = () => {
    if (activeCallRef.current) {
      const newMuteStatus = !isMuted;
      activeCallRef.current.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
      toast.success(newMuteStatus ? 'Microphone Muted' : 'Microphone Active');
    }
  };

  const toggleHoldCall = async (phone, leadId) => {
    if (!activeCallRef.current) return;
    try {
      const newHoldState = !onHold;
      const res = await api.post('/call/hold', { phone, hold: newHoldState, leadId });
      if (res.data.success) {
        setOnHold(newHoldState);
        toast.success(newHoldState ? 'Call placed on hold' : 'Call resumed');
      }
    } catch (error) {
      toast.error('Failed to toggle hold. Using local mute fallback.');
      toggleMute();
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
    if (activeCallRef.current) {
      console.log(`TELEPHONY: Sending DTMF: ${digits}`);
      activeCallRef.current.sendDigits(digits);
    }
  };

  // 3. MONITORING & TOOLS
  const monitorActiveCall = async (phoneNumber) => {
    if (!deviceRef.current) return toast.error('Telephony offline');
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      setCallState('connecting');
      const monitoringCall = await deviceRef.current.connect({ 
        params: { To: formattedTo, isMonitor: 'true' } 
      });
      
      activeCallRef.current = monitoringCall;
      bindCallEvents(monitoringCall);
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

  const setInputDevice = async (deviceId) => {
    if (deviceRef.current && deviceRef.current.audio) {
      await deviceRef.current.audio.setInputDevice(deviceId);
    }
  };

  const setOutputDevice = async (deviceId) => {
    if (deviceRef.current && deviceRef.current.audio) {
      // For ringer
      deviceRef.current.audio.ringtoneDevices.set(deviceId);
      // For speaker
      deviceRef.current.audio.speakerDevices.set(deviceId);
    }
  };

  const formatDurationStr = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const value = React.useMemo(() => ({
    deviceState,
    callState,
    isMuted,
    onHold,
    isRecording,
    duration,
    formatDuration: formatDurationStr,
    setInputDevice,
    setOutputDevice,
    makeCall,
    endCall,
    toggleMute,
    toggleHoldCall,
    toggleRecordCall,
    transferActiveCall,
    sendDigits,
    activeCall: activeCallRef.current,
    lastCallSid,
    networkQuality,
    monitorActiveCall
  }), [deviceState, callState, isMuted, onHold, isRecording, duration, lastCallSid, networkQuality, makeCall, monitorActiveCall, setInputDevice, setOutputDevice]);

  return (
    <TelephonyContext.Provider value={value}>
      {children}
    </TelephonyContext.Provider>
  );
}

export const useTelephony = () => useContext(TelephonyContext);
