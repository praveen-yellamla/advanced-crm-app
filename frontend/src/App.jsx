import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TelephonyProvider } from './context/TelephonyContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// Initialize Query Client for caching and real-time data Refresh
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <TelephonyProvider>
              <Router>
                <AppRoutes />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#0F172A',
                      color: '#fff',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    },
                  }}
                />
              </Router>
            </TelephonyProvider>
          </SocketProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
