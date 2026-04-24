import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Globe, 
  ChevronRight,
  Monitor,
  Phone,
  BarChart,
  BrainCircuit,
  LockKeyhole
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('agent'); // For role preview animation

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter credentials');

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      
      // Role selection validation
      const selectedRoleUpper = activeTab.toUpperCase();
      if (user.role !== selectedRoleUpper) {
         toast.error(`Access Denied: Your account is assigned to the ${user.role} portal. Please select the correct portal to continue.`);
         logout(); // Clear the invalid session
         return;
      }

      toast.success(`Welcome to the ${user.role} Portal, ${user.name}`);
      
      const rolePath = {
        ADMIN: '/admin/dashboard',
        MANAGER: '/manager/dashboard',
        AGENT: '/agent/dashboard'
      };
      navigate(rolePath[user.role] || '/agent/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A1F] flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Static Premium Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-[10%] -right-[5%] w-[35%] h-[35%] bg-indigo-600/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[15%] left-[15%] w-[40%] h-[40%] bg-cyan-600/5 blur-[130px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[1400px] grid lg:grid-cols-2 gap-0 min-h-[850px] lg:h-[90vh] bg-[#0A1229]/80 backdrop-blur-xl lg:rounded-[40px] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden m-0 lg:m-4">
        
        {/* LEFT SIDE: BRAND SHOWCASE */}
        <div className="hidden lg:flex flex-col p-16 relative overflow-hidden bg-gradient-to-br from-[#0A1229] via-[#0D1938] to-[#0A1229]">
          
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">Advanced<span className="text-blue-500">CRM</span></span>
          </motion.div>

          {/* Hero Text */}
          <div className="relative z-10 space-y-8 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
            >
              <Zap size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Enterprise Ready</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight"
            >
              The Operating System <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">for Modern Sales.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-base xl:text-lg max-w-xl leading-relaxed"
            >
              Scale lead operations, global calling, and enterprise analytics in one unified intelligence layer.
            </motion.p>

            {/* Capability Strip */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="flex items-center gap-4 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase overflow-hidden whitespace-nowrap"
            >
               <span>Leads</span>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <span>Calling</span>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <span>Invoicing</span>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <span>Email Sync</span>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <span>AI Insights</span>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <span>QA/QC</span>
            </motion.div>

            {/* Premium Focal Visual: Analytics Snapshot */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-8 p-6 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-2xl relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                        <BarChart3 size={20} />
                     </div>
                     <div>
                        <h3 className="text-white font-bold text-sm tracking-tight">Sales Intelligence</h3>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Real-time Pipeline</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-xl font-black text-white">$1.4M</span>
                     <p className="text-[10px] text-emerald-400 font-bold">+24.5%</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center gap-4">
                     <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '74%' }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                        />
                     </div>
                     <span className="text-[10px] text-slate-400 font-bold">Leads Won</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '42%' }}
                          transition={{ delay: 1.2, duration: 1.5 }}
                          className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        />
                     </div>
                     <span className="text-[10px] text-slate-400 font-bold">Outbound ROI</span>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* Subtle Accent Glow behind metrics */}
          <div className="absolute left-[10%] top-[40%] w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

          {/* Trust Badges & Compliance */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 space-y-4"
          >
            <div className="flex items-center gap-4 text-slate-500">
               <div className="h-px w-8 bg-slate-800" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Industry Validation</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-md">GDPR</span>
              <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-md">ISO 27001</span>
              <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-md">SOC2 TYPE II</span>
            </div>
          </motion.div>

          {/* Footer Insignias */}
          <div className="mt-auto flex flex-col gap-6 pb-2">
             <div className="flex items-center gap-8 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-slate-400" />
                   <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">End-to-End Encryption</span>
                </div>
             </div>
             <div className="flex items-center gap-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest pt-4 border-t border-white/5">
                <span>Internal Use Only</span>
                <div className="w-1 h-1 bg-slate-800 rounded-full" />
                <span>Monitored Access</span>
                <div className="w-1 h-1 bg-slate-800 rounded-full" />
                <span>Secure Session</span>
             </div>
          </div>
        </div>


        {/* RIGHT SIDE: LOGIN PANEL */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-white relative">
          
          <div className="w-full max-w-md space-y-8 relative z-10">
            
            {/* Header */}
            <div className="text-center lg:text-left space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200"
              >
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Secure access for enterprise teams</span>
              </motion.div>
              <div className="space-y-1">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black text-slate-900 tracking-tight"
                >
                  Welcome back
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-500 font-medium"
                >
                  Sign in to manage your high-performance workflow.
                </motion.p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-[6px] focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all duration-300 font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
                    placeholder="name@enterprise.com"
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">Forgot password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-[6px] focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all duration-300 font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center"
              >
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-600 transition-all cursor-pointer" 
                />
                <label htmlFor="remember" className="ml-3 text-sm text-slate-600 font-medium cursor-pointer">Keep me signed in on this device</label>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_12px_24px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_16px_32px_-10px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center gap-3 text-lg group disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    Access {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Workspace
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Alternative Auth */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-white px-4 text-slate-400">Collaborative SSO Access</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
                   <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 shadow-sm" alt="Google" />
                   Google
                </button>
                <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-4 h-4" alt="Microsoft" />
                   Microsoft
                </button>
              </div>
            </motion.div>

            {/* Portal Selection with Descriptions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4 hidden sm:block"
            >
               <div className="flex items-center gap-4 text-slate-400">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Select Control Environment</span>
                  <div className="h-px flex-1 bg-slate-100" />
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                  <div className="flex gap-3">
                    <RoleBadge icon={<Monitor size={14} />} label="Admin" desc="Platform Control" color="blue" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
                    <RoleBadge icon={<Zap size={14} />} label="Manager" desc="Team Oversight" color="indigo" active={activeTab === 'manager'} onClick={() => setActiveTab('manager')} />
                    <RoleBadge icon={<Phone size={14} />} label="Agent" desc="Operations" color="cyan" active={activeTab === 'agent'} onClick={() => setActiveTab('agent')} />
                  </div>
               </div>
            </motion.div>

          </div>
        </div>

      </div>

    </div>
  );
};

// Sub-components
const RoleBadge = ({ icon, label, desc, color, active, onClick }) => {
  const colors = {
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    cyan: "bg-cyan-500"
  };
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500",
        active 
          ? `bg-white border-blue-600 shadow-xl shadow-blue-600/10 ring-1 ring-blue-600` 
          : "bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
      )}
    >
      <div className={cn("p-1.5 rounded-lg text-white mb-2 shadow-sm", colors[color], active ? "scale-110" : "scale-100")}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-tighter mb-0.5">{label}</span>
      <span className={cn("text-[8px] font-bold uppercase tracking-widest", active ? "text-blue-600" : "text-slate-400")}>{desc}</span>
    </button>
  );
};

// Custom Icon Wrappers
const TargetIcon = () => <Zap size={20} />;
const ZapIcon = () => <CheckCircle2 size={20} />;
const BarChartIcon = () => <BarChart size={20} />;
const GlobeIcon = () => <Globe size={20} />;

export default LoginPage;
