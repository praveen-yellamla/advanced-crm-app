import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Layers, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState(null);
  const [isShake, setIsShake] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // FIX 1: Ensure fields are empty on load/return
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await login(email, password, rememberMe);
      toast.success(`Welcome back, ${user.name}`);
      
      const rolePath = { 
        SUPER_ADMIN: '/platform/dashboard', 
        ADMIN: '/admin/dashboard', 
        MANAGER: '/manager/dashboard', 
        AGENT: '/agent/dashboard' 
      };
      
      navigate(rolePath[user.role] || '/unauthorized');
    } catch (err) {
      triggerShake();
      const code = err.response?.data?.code;
      if (code === 'ACCOUNT_NOT_ACTIVATED') {
        setErrorMsg("Your account isn't active yet. Check your email for your invitation link.");
      } else if (code === 'TOO_MANY_ATTEMPTS' || err.response?.status === 429) {
        setErrorMsg("Too many failed attempts. Try again in 15 minutes or reset your password.");
      } else {
        setErrorMsg("Incorrect email or password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 400);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .crm-input {
          height: 48px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 15px;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          outline: none;
        }
        .crm-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }
        .crm-input.error {
          border-color: #ef4444;
        }
        
        .crm-btn {
          background-color: #6366f1 !important;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.3px;
          border: none;
          border-radius: 10px;
          height: 52px;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .crm-btn:hover:not(:disabled) {
          background-color: #4f46e5 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
        }
        .crm-btn:active:not(:disabled) {
          transform: scale(0.98);
          background-color: #4338ca !important;
        }
        .crm-btn:disabled {
          background-color: #6366f1 !important;
          opacity: 0.8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none !important;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          width: 20px;
          height: 20px;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
      
      {/* MOBILE TOP BAR (<768px) */}
      <div 
        className="md:hidden flex items-center justify-center w-full h-[80px] shrink-0"
        style={{ backgroundColor: '#0f1629' }}
      >
        <div className="flex items-center gap-2">
          <Layers size={24} color="#ffffff" />
          <span className="text-[24px] font-[800] text-white tracking-tight">
            CRM<span style={{ color: '#6366f1' }}>.PRO</span>
          </span>
        </div>
      </div>

      {/* LEFT PANEL (Desktop >1024px: 55%, Tablet 768-1024px: 45%) */}
      <div 
        className="hidden md:flex flex-col md:w-[45%] lg:w-[55%] relative overflow-hidden p-8 lg:p-[80px]"
        style={{
          background: 'linear-gradient(135deg, #0f1629 0%, #1a2744 100%)'
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col h-full"
        >
          {/* TOP: Logo */}
          <div className="flex items-center gap-2">
            <Layers size={28} color="#ffffff" />
            <span className="text-[28px] font-[800] text-white tracking-tight">
              CRM<span style={{ color: '#6366f1' }}>.PRO</span>
            </span>
          </div>

          {/* MIDDLE: Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-1px'
              }}
            >
              The CRM built for<br/>
              <span style={{ color: '#6366f1' }}>high-performance</span><br/>
              sales teams.
            </h1>
            
            <p 
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.6,
                maxWidth: '360px',
                marginTop: '20px'
              }}
            >
              Manage leads, track calls, coach your team,
              and close more deals — all in one place.
            </p>

            {/* FEATURES (Hidden on tablet, visible on desktop) */}
            <div className="hidden lg:flex flex-col mt-[48px]" style={{ gap: '14px' }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="shrink-0" style={{ width: '6px', height: '6px', backgroundColor: '#6366f1', borderRadius: '50%' }} />
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Real-time call monitoring</span>
              </div>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="shrink-0" style={{ width: '6px', height: '6px', backgroundColor: '#6366f1', borderRadius: '50%' }} />
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>AI-powered lead scoring</span>
              </div>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="shrink-0" style={{ width: '6px', height: '6px', backgroundColor: '#6366f1', borderRadius: '50%' }} />
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Full team performance analytics</span>
              </div>
            </div>
          </div>

          {/* BOTTOM: Status */}
          <div className="flex items-center gap-2 mt-8">
            <motion.div 
              animate={{ opacity: [1, 0.5, 1] }} 
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span className="text-[12px] font-[600] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
              LIVE &nbsp;Platform Operational
            </span>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="w-full md:w-[55%] lg:w-[45%] flex flex-col items-center justify-center relative p-8 md:p-12 lg:p-0 bg-white min-h-[calc(100vh-80px)] md:min-h-screen">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[380px] flex flex-col"
        >
          {/* TOP LABELS */}
          <div style={{ fontSize: '11px', letterSpacing: '2.5px', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>
            WELCOME BACK
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginTop: '8px' }}>
            Sign in to your workspace
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px', marginBottom: '32px' }}>
            Enter your credentials to continue
          </p>

          {/* FORM */}
          <motion.form 
            onSubmit={handleLogin}
            animate={isShake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col"
          >
            {/* EMAIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <input 
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`crm-input ${errorMsg ? 'error' : ''}`}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }} className="hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`crm-input ${errorMsg ? 'error' : ''}`}
                  style={{ paddingRight: '48px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#374151]"
                  style={{ color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* ERROR TEXT */}
            {errorMsg && (
              <div className="flex items-start gap-2 mb-[16px] mt-[-8px]">
                <AlertTriangle size={14} color="#ef4444" className="mt-[2px] shrink-0" />
                <span className="text-[13px]" style={{ color: '#ef4444' }}>
                  {errorMsg}
                </span>
              </div>
            )}

            {/* REMEMBER ME */}
            <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 20px 0' }}>
              <div 
                onClick={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  borderColor: rememberMe ? '#6366f1' : '#e5e7eb',
                  backgroundColor: rememberMe ? '#6366f1' : 'transparent'
                }}
              >
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span 
                onClick={() => setRememberMe(!rememberMe)}
                className="cursor-pointer select-none" 
              >
                Keep me signed in
              </span>
            </div>

            {/* SIGN IN BTN */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="crm-btn"
            >
              {isSubmitting ? (
                <div className="spinner" />
              ) : (
                "Sign In"
              )}
            </button>
          </motion.form>



        </motion.div>

        {/* BOTTOM RIGHT SECURITY TEXT */}
        <div style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#cbd5e1', letterSpacing: '0.5px' }}>
            🔒  256-bit encrypted  ·  ISO 27001 certified
          </span>
        </div>

      </div>

    </div>
  );
};

export default Login;
