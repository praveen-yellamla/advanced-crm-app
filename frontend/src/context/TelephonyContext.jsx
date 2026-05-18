import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { formatPhoneNumber } from '../utils/phoneUtils';

const TelephonyContext = createContext();

export function TelephonyProvider({ children }) {
  const { user } = useAuth();
  
  // Singleton refs
  const deviceRef = useRef(null);
  const activeCallRef = useRef(null);
  
  // UI State Mapping
  const [deviceState, setDeviceState] = useState('UNREGISTERED'); // REGISTERING, REGISTERED, UNREGISTERED, ERROR, OFFLINE
  const [callState, setCallState] = useState('IDLE'); // IDLE, CONNECTING, RINGING, CONNECTED, ON_HOLD, RECORDING, TRANSFERRING, DISCONNECTED, FAILED
  const [lastCallSid, setLastCallSid] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState(5);
  
  const timerRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // STRICT CALL STATE MACHINE
  const transitionTo = useCallback((nextState) => {
    const allowedTransitions = {
      'IDLE': ['CONNECTING', 'RINGING'],
      'CONNECTING': ['RINGING', 'CONNECTED', 'FAILED', 'DISCONNECTED'],
      'RINGING': ['CONNECTED', 'FAILED', 'DISCONNECTED'],
      'CONNECTED': ['ON_HOLD', 'RECORDING', 'TRANSFERRING', 'DISCONNECTED', 'FAILED'],
      'ON_HOLD': ['CONNECTED', 'DISCONNECTED', 'FAILED'],
      'RECORDING': ['CONNECTED', 'DISCONNECTED', 'FAILED'],
      'TRANSFERRING': ['CONNECTED', 'DISCONNECTED', 'FAILED'],
      'DISCONNECTED': ['IDLE', 'CONNECTING'],
      'FAILED': ['IDLE', 'CONNECTING']
    };
    
    setCallState((current) => {
      if (current === nextState) return current;
      const allowed = allowedTransitions[current] || [];
      if (allowed.includes(nextState)) {
        console.log(`[TELEPHONY STATE] Transition: ${current} -> ${nextState}`);
        return nextState;
      } else {
        console.warn(`[TELEPHONY STATE] Blocked invalid transition: ${current} -> ${nextState}`);
        return current;
      }
    });
  }, []);

  // 1. INITIALIZE TWILIO DEVICE
  const initDevice = useCallback(async () => {
    if (!user) return;
    if (deviceRef.current && deviceRef.current.state === 'registered') return;

    try {
      console.log('[TELEPHONY] Device registering initiated...');
      setDeviceState('REGISTERING');
      const { data } = await api.get('/call/token');
      
      const newDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        enableIceRestart: true,
        maxCallSignalingTimeoutMs: 30000,
        logLevel: 1 
      });

      // TWILIO REQUIRED LIFE-CYCLE EVENTS (LOGGED CONCISELY)
      newDevice.on('registered', () => {
        console.log('[TELEPHONY DEVICE] Event: registered');
        setDeviceState('REGISTERED');
        reconnectAttempts.current = 0;
      });

      newDevice.on('registering', () => {
        console.log('[TELEPHONY DEVICE] Event: registering');
        setDeviceState('REGISTERING');
      });

      newDevice.on('unregistered', () => {
        console.log('[TELEPHONY DEVICE] Event: unregistered');
        setDeviceState('UNREGISTERED');
      });

      newDevice.on('offline', () => {
        console.log('[TELEPHONY DEVICE] Event: offline');
        setDeviceState('OFFLINE');
      });

      newDevice.on('tokenWillExpire', async () => {
        console.log('[TELEPHONY DEVICE] Event: tokenWillExpire - refreshing token.');
        try {
          const res = await api.get('/call/token');
          newDevice.updateToken(res.data.token);
        } catch (err) {
          console.error('[TELEPHONY DEVICE] Failed to auto-refresh token:', err);
        }
      });

      newDevice.on('error', (error) => {
        console.error('[TELEPHONY DEVICE] Event: error occurred:', error);
        setDeviceState('ERROR');
        toast.error(`Device registration error: ${error.message}`);
        
        if (error.code === 31005 && reconnectAttempts.current < 3) {
          reconnectAttempts.current++;
          setTimeout(initDevice, 3000);
        }
      });

      newDevice.on('incoming', (incomingCall) => {
        console.log('[TELEPHONY DEVICE] Event: incoming call leg detected.');
        if (activeCallRef.current) {
          console.log('[TELEPHONY DEVICE] Auto-rejecting incoming leg: Call currently active.');
          incomingCall.reject();
          return;
        }
        
        activeCallRef.current = incomingCall;
        transitionTo('RINGING');
        bindCallEvents(incomingCall);
      });

      newDevice.on('network', (level) => {
        setNetworkQuality(level);
      });

      await newDevice.register();
      deviceRef.current = newDevice;
    } catch (error) {
      console.error('[TELEPHONY DEVICE] Failed to initialize device:', error);
      setDeviceState('ERROR');
      toast.error(`Telephony initialize failed: ${error.message}`);
    }
  }, [user, transitionTo]);

  // Bind call events dynamically
  const bindCallEvents = (callObj) => {
    console.log('[TELEPHONY CALL] Binding event listeners...');

    callObj.on('accept', () => {
      console.log('[TELEPHONY CALL] Event: accept (Call Answered)');
      transitionTo('CONNECTED');
      if (callObj.parameters?.CallSid) {
        setLastCallSid(callObj.parameters.CallSid);
      }
      startTimer();
    });

    callObj.on('ringing', () => {
      console.log('[TELEPHONY CALL] Event: ringing');
      transitionTo('RINGING');
    });

    callObj.on('disconnect', () => {
      console.log('[TELEPHONY CALL] Event: disconnect (Call ended explicitly by Twilio)');
      handleCallEnd();
    });

    callObj.on('cancel', () => {
      console.log('[TELEPHONY CALL] Event: cancel');
      handleCallEnd();
    });
    
    callObj.on('reject', () => {
      console.log('[TELEPHONY CALL] Event: reject');
      transitionTo('FAILED');
      handleCallEnd();
    });

    callObj.on('reconnecting', () => {
      console.log('[TELEPHONY CALL] Event: reconnecting...');
    });

    callObj.on('reconnected', () => {
      console.log('[TELEPHONY CALL] Event: reconnected');
      transitionTo('CONNECTED');
    });

    callObj.on('error', (err) => {
      console.error('[TELEPHONY CALL] Event: error occurred:', err);
      // Capture and display real Twilio errors
      let errMsg = err.message || 'Unknown WebRTC Signaling Warning';
      if (err.code) {
        errMsg = `Twilio Call Error [${err.code}]: ${err.message}`;
      }
      toast.error(errMsg);
      transitionTo('FAILED');
      handleCallEnd();
    });
    
    callObj.on('warning', (warningName, warningData) => {
      console.warn('[TELEPHONY CALL] Event: warning:', warningName, warningData);
    });
  };

  useEffect(() => {
    initDevice();
    return () => {
      // Retain active singleton on re-renders
    };
  }, [initDevice]);

  // Call End Handler
  const handleCallEnd = useCallback(() => {
    console.log('[TELEPHONY] Finalizing and cleaning up call session.');
    activeCallRef.current = null;
    transitionTo('DISCONNECTED');
    stopTimer();
    setIsMuted(false);
    setOnHold(false);
    setIsRecording(false);
    setTimeout(() => transitionTo('IDLE'), 3000);
  }, [transitionTo]);

  // Place Outgoing call leg
  const makeCall = async (phoneNumber, leadId = null) => {
    if (!deviceRef.current || deviceRef.current.state !== 'registered') {
      transitionTo('CONNECTING');
      toast.loading('Booting Twilio telemetry lines...');
      await initDevice();
      if (!deviceRef.current || deviceRef.current.state !== 'registered') {
        toast.error('Voice Grid Registration Offline. Reconnecting...');
        transitionTo('FAILED');
        setTimeout(() => transitionTo('IDLE'), 3000);
        return;
      }
    }
    
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      console.log(`[TELEPHONY] Connecting outbound leg to target: ${formattedTo}`);
      transitionTo('CONNECTING');
      
      const outgoingCall = await deviceRef.current.connect({ 
        params: { 
          To: formattedTo, 
          leadId: leadId ? leadId.toString() : '', 
          agentId: user?.id?.toString() || '',
          organizationId: user?.organizationId?.toString() || ''
        } 
      });
      
      activeCallRef.current = outgoingCall;
      bindCallEvents(outgoingCall);

    } catch (error) {
      console.error('[TELEPHONY] Outbound Connection Failed:', error);
      let errMsg = error.message || 'Call placement failed';
      if (error.code) {
        errMsg = `Twilio Outbound Exception [${error.code}]: ${error.message}`;
      }
      toast.error(errMsg);
      transitionTo('FAILED');
      setTimeout(() => transitionTo('IDLE'), 3000);
    }
  };

  const endCall = () => {
    if (activeCallRef.current) {
      console.log('[TELEPHONY] Manual Disconnect triggered.');
      if (activeCallRef.current.parameters?.CallSid) {
        setLastCallSid(activeCallRef.current.parameters.CallSid);
      }
      activeCallRef.current.disconnect();
    } else {
      handleCallEnd();
    }
  };

  const toggleMute = () => {
    if (activeCallRef.current) {
      const newMuteStatus = !isMuted;
      activeCallRef.current.mute(newMuteStatus);
      setIsMuted(newMuteStatus);
      toast.success(newMuteStatus ? 'Muted microphone' : 'Microphone is active');
    }
  };

  const toggleHoldCall = async (phone, leadId) => {
    if (!activeCallRef.current) return;
    try {
      const newHoldState = !onHold;
      const res = await api.post('/call/hold', { phone, hold: newHoldState, leadId });
      if (res.data.success) {
        setOnHold(newHoldState);
        transitionTo(newHoldState ? 'ON_HOLD' : 'CONNECTED');
        toast.success(newHoldState ? 'Call placed on hold' : 'Call resumed');
      }
    } catch (error) {
      toast.error('Hold route error. Muting mic fallback.');
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
        transitionTo(newRecordState ? 'RECORDING' : 'CONNECTED');
        toast.success(newRecordState ? 'Call recording started' : 'Call recording stopped');
      }
    } catch (error) {
      toast.error('Failed to toggle recording.');
    }
  };

  const transferActiveCall = async (phone, targetAgentPhone, leadId) => {
    try {
      transitionTo('TRANSFERRING');
      const res = await api.post('/call/transfer', { phone, targetAgentPhone, leadId });
      if (res.data.success) {
        toast.success('Call transferred successfully');
        endCall();
      }
    } catch (error) {
      toast.error('Transfer failed');
      transitionTo('CONNECTED');
    }
  };

  const sendDigits = (digits) => {
    if (activeCallRef.current) {
      console.log(`[TELEPHONY] Transmitting DTMF key: ${digits}`);
      activeCallRef.current.sendDigits(digits);
    }
  };

  const monitorActiveCall = async (phoneNumber) => {
    if (!deviceRef.current) return toast.error('Telephony device offline');
    try {
      const formattedTo = formatPhoneNumber(phoneNumber);
      transitionTo('CONNECTING');
      const monitoringCall = await deviceRef.current.connect({ 
        params: { To: formattedTo, isMonitor: 'true' } 
      });
      
      activeCallRef.current = monitoringCall;
      bindCallEvents(monitoringCall);
    } catch (error) {
      toast.error('Silent monitoring failed');
      transitionTo('FAILED');
      setTimeout(() => transitionTo('IDLE'), 3000);
    }
  };

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
      deviceRef.current.audio.ringtoneDevices.set(deviceId);
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
  }), [deviceState, callState, isMuted, onHold, isRecording, duration, lastCallSid, networkQuality, makeCall, monitorActiveCall, setInputDevice, setOutputDevice, transitionTo, initDevice]);

  return (
    <TelephonyContext.Provider value={value}>
      {children}
    </TelephonyContext.Provider>
  );
}

export const useTelephony = () => {
  const context = useContext(TelephonyContext);
  console.log('[useTelephony Hook] useContext(TelephonyContext) value is:', context);
  return context;
};
