import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PLATFORM_CRITICAL_FAULT:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-10 font-sans">
          <div className="max-w-xl w-full bg-white rounded-[48px] shadow-2xl p-16 text-center space-y-8 border-4 border-rose-500/20">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <AlertTriangle size={48} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">System Fault Detected</h1>
              <p className="text-slate-500 mt-4 font-medium">The platform encountered a critical rendering exception. Our engineers have been notified.</p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl text-left overflow-hidden">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Diagnostic</p>
               <p className="text-xs font-mono text-rose-600 break-words">{this.state.error?.message || "Unknown Exception"}</p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
              <RefreshCcw size={18} />
              Reload System
            </button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">System ID: ANTIGRAVITY-CORE-01</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
