import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AI Assistant Node Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-10 right-10 z-[100] p-6 bg-white border border-rose-100 rounded-3xl shadow-xl flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="text-xl font-bold">!</span>
           </div>
           <div>
              <p className="text-xs font-bold text-slate-900">Assistant Offline</p>
              <p className="text-[10px] font-medium text-slate-400">Node sync interrupted.</p>
           </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
