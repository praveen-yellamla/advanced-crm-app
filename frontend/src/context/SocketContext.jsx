import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false });

export const SocketProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Keep track of the current socket instance in a ref to prevent unnecessary re-connections
  const socketRef = useRef(null);

  const userId = user?.id;
  const teamId = user?.teamId;
  const userRole = user?.role;

  useEffect(() => {
    // If user logs out or is null, disconnect
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api$/, '');

    console.log(`[SOCKET] Connecting to ${socketUrl} for user: ${userId} (${userRole})`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      auth: {
        token: sessionStorage.getItem('token') || localStorage.getItem('token')
      }
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('[SOCKET] Connected to realtime gateway');
      setConnected(true);
      
      // Join user and team rooms
      socketInstance.emit('join_room', { 
        userId: userId, 
        teamId: teamId 
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('[SOCKET] Disconnected from realtime gateway');
      setConnected(false);
    });

    // Universal kickout handler if user gets deactivated by admin
    socketInstance.on('user:deactivated', (data) => {
      console.warn('[SOCKET] User account deactivated by admin. Initiating kickout.', data);
      logout();
      window.location.href = '/login';
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [userId, teamId, userRole]); // Only reconnect if the actual user ID or Team ID changes!

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
