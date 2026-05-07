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
  Zap, 
  Monitor,
  Phone,
  BarChart,
  Headphones,
  Briefcase,
  Globe,
  ChevronLeft,
  Activity,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Fingerprint,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const current = {
    label: 'ENTERPRISE SAAS PLATFORM',
    title: 'Advanced',
    titleHighlight: 'CRM',
    sub: 'Secure access to your professional workspace and organization data.',
    color: '#0F172A',
    gradient: 'from-[#0F172A] to-[#1E293B]',
    icon: <ShieldCheck size={32} />,
    metric: { label: 'Platform Status', val: 'Operational', trend: 'Live' }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Required fields missing');

    setIsSubmitting(true);
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
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex font-sans overflow-hidden bg-grid-light">
      
      {/* LEFT: SOFT GRADIENT BRAND PANEL (60% LIGHT) */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col p-20 justify-between overflow-hidden border-r border-[#E2E8F0]">
         
         {/* SOFT GRADIENT BG */}
         <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EEF4FF] via-white to-[#EEF4FF]" />
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0] }}
               transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-[20%] right-[10%] w-[600px] h-[600px] blur-[120px] rounded-full" 
               style={{ backgroundColor: `${current.color}11` }} 
            />
         </div>

         {/* TOP BRANDING */}
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Layers size={22} className="text-blue-600" />
               <span className="text-[14px] font-black text-[#0F172A] tracking-tighter">ADV<span className="text-blue-600">.CRM</span></span>
            </div>
            <div className="flex items-center gap-3 opacity-40">
               <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.5em]">Enterprise Edition</span>
            </div>
         </div>

         {/* MAIN CONTENT */}
         <div className="relative z-10 max-w-xl space-y-12">
            <div className="space-y-6">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white border border-[#E2E8F0] w-fit shadow-xl shadow-blue-500/5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{current.label} READY</span>
               </motion.div>
               
               <motion.h1 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
                  className="text-8xl font-black text-[#0F172A] leading-[0.95] tracking-tighter"
               >
                  {current.title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 drop-shadow-sm">
                    {current.titleHighlight}.
                  </span>
               </motion.h1>
               
               <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[#64748B] text-xl font-medium leading-relaxed max-w-md">
                  {current.sub}
               </motion.p>
            </div>

            {/* WHITE GLASS METRIC */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
               className="p-10 bg-white/80 backdrop-blur-xl rounded-[40px] border border-white flex items-center justify-between shadow-2xl shadow-blue-500/5 group overflow-hidden"
            >
               <div className="space-y-4 flex-1 relative z-10">
                  <div className="flex items-center justify-between pr-8">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{current.metric.label}</span>
                     <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{current.metric.trend}</span>
                  </div>
                  <div className="text-6xl font-black text-[#0F172A] tracking-tighter group-hover:scale-105 transition-transform duration-700 origin-left">
                    {current.metric.val}
                  </div>
               </div>
               <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative z-10">
                  <Activity size={32} className="text-slate-200 group-hover:text-blue-600 transition-all duration-700" />
               </div>
            </motion.div>
         </div>

         {/* FOOTER */}
         <div className="relative z-10 flex items-center justify-between opacity-30 cursor-default">
            <div className="flex gap-10">
               <div className="flex items-center gap-3">
                  <ShieldCheck size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">ISO 27001</span>
               </div>
               <div className="flex items-center gap-3">
                  <Cpu size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">E2E ENCRYPTED</span>
               </div>
            </div>
            <Globe size={20} className="text-slate-900" />
         </div>
      </div>

      {/* RIGHT: WHITE AUTH CANVAS (40% CLEAN) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 lg:p-24 bg-white relative">
         <div className="w-full max-w-sm space-y-12 relative z-10">
            
            <div className="space-y-4">
               <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl relative mb-10 overflow-hidden" style={{ backgroundColor: current.color, boxShadow: `0 30px 60px ${current.color}33` }}>
                  <div className="absolute inset-0 bg-white/10 opacity-20" />
                  <div className="relative z-10">{current.icon}</div>
               </div>
               <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Login</h2>
               <p className="text-[#64748B] font-medium leading-relaxed">
                  Sign in to your professional workspace. <br />
                  <span className="text-[9px] uppercase font-black tracking-[0.2em] opacity-40">Enterprise Security Active</span>
               </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8" autoComplete="off">
               {/* Email Field */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] ml-1">Email Address</label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                        <Mail size={18} />
                     </div>
                     <input 
                       type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       autoComplete="off"
                       className="w-full pl-16 pr-6 h-[72px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] focus:ring-[12px] focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-[#0F172A] placeholder:text-slate-300"
                       placeholder="name@company.com"
                     />
                  </div>
               </div>

               {/* Password Field */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Password</label>
                     <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">Forgot Password?</button>
                  </div>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={18} />
                     </div>
                     <input 
                       type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                       autoComplete="new-password"
                       className="w-full pl-16 pr-14 h-[72px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] focus:ring-[12px] focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-[#0F172A] placeholder:text-slate-300"
                       placeholder="••••••••••••"
                     />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-[#0F172A] transition-colors">
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                     </button>
                  </div>
               </div>

               {/* Remember Me */}
               <div className="flex items-center gap-3 ml-1">
                  <div 
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-6 h-6 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}`}
                  >
                     {rememberMe && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                    Keep me signed in
                  </span>
               </div>

               {/* Authorization Button */}
               <div className="space-y-8 pt-4">
                  <button 
                    type="submit" disabled={isSubmitting}
                    className={`
                      w-full h-[72px] text-white font-bold rounded-[24px] shadow-2xl transition-all 
                      flex items-center justify-center gap-5 relative overflow-hidden group 
                      disabled:opacity-70 hover:-translate-y-2 hover:brightness-110 active:scale-[0.98]
                    `}
                    style={{ 
                       background: `linear-gradient(135deg, ${current.color}, ${current.color}CC)`,
                       boxShadow: `0 30px 60px ${current.color}4d`
                    }}
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={28} /> : (
                       <>
                         <span className="relative z-10 text-[11px] uppercase tracking-[0.4em] font-black">Sign In</span>
                         <ArrowRight size={22} className="relative z-10 group-hover:translate-x-3 transition-transform duration-700" />
                       </>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </button>

                  {/* TRUST ROW */}
                  <div className="flex items-center justify-between px-2 pt-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                     {[
                        { icon: <ShieldAlert size={14} />, label: 'SOC2' },
                        { icon: <Fingerprint size={14} />, label: 'SSO' },
                        { icon: <Cpu size={14} />, label: 'E2EE' },
                        { icon: <Globe size={14} />, label: 'GRID' }
                     ].map((trust, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                           <div className="text-slate-400">{trust.icon}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{trust.label}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </form>

            <div className="pt-12 text-center space-y-8">
               <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-slate-100" />
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={16} className="text-emerald-500" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Secure Verification</span>
                  </div>
                  <div className="h-px flex-1 bg-slate-100" />
               </div>
               <p className="text-[10px] text-[#64748B] leading-[2] uppercase tracking-[0.3em] font-bold max-w-[280px] mx-auto opacity-60">
                  Authorized Users Only
               </p>
            </div>

         </div>
      </div>

    </div>
  );
};

export default Login;
