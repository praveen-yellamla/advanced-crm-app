import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  ShieldCheck, ArrowRight, XCircle, User, Phone, Lock, 
  CheckCircle2, AlertCircle, Loader2, Mail, Briefcase 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length > 6) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(formData.password);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/invite/${token}`);
        setInviteData(res.data.data);
        setFormData(prev => ({
          ...prev,
          name: res.data.data.name || ''
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    if (formData.password.length < 8) {
      return toast.error("Security policy requires at least 8 characters");
    }

    setSubmitting(true);
    try {
      await api.post('/invite/accept', {
        token,
        name: formData.name,
        phone: formData.phone,
        password: formData.password
      });
      
      toast.success('Protocol established. Account activated successfully.');
      
      // Animation delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message || 'Internal connection failure';
      toast.error(`Activation Failed: ${apiError}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <Loader2 className="text-blue-500 animate-spin mb-4" size={40} />
        <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Identity Verification...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-[#0F172A] border border-white/5 rounded-[48px] p-16 text-center shadow-2xl"
        >
           <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
             <XCircle className="text-rose-500" size={40} />
           </div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Verification Terminated</h2>
           <p className="text-slate-400 font-medium mb-10 leading-relaxed uppercase text-xs tracking-widest">{error}</p>
           <button 
             onClick={() => navigate('/login')}
             className="h-16 px-12 bg-white text-[#020617] rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
           >
             Back to Access Point
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 selection:bg-blue-500 selection:text-white">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-[64px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative"
       >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>
          
          <div className="p-12 sm:p-20">
            <div className="mb-16 text-center">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-24 h-24 bg-blue-600 border-8 border-[#0F172A] shadow-2xl shadow-blue-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-10"
              >
                <ShieldCheck className="text-white" size={40} />
              </motion.div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Activate Identity</h1>
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  Level: {inviteData?.role}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                  Status: Secure
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Preview Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white/5 border border-white/5 rounded-[40px] mb-12">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Mail size={10} /> Verified Email
                  </p>
                  <p className="text-sm font-bold text-white truncate">{inviteData?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase size={10} /> Assigned Role
                  </p>
                  <p className="text-sm font-bold text-blue-400">{inviteData?.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={12} className="text-blue-500" /> Full Identity Name
                  </label>
                  <input 
                    type="text" required placeholder="Legal Name"
                    className="w-full h-18 px-8 bg-[#1E293B] border border-white/5 rounded-3xl outline-none focus:border-blue-600 focus:bg-[#020617] transition-all font-bold text-white placeholder:text-slate-600"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone size={12} className="text-blue-500" /> Contact Number
                  </label>
                  <input 
                    type="tel" placeholder="+1 (555) 000-0000"
                    className="w-full h-18 px-8 bg-[#1E293B] border border-white/5 rounded-3xl outline-none focus:border-blue-600 focus:bg-[#020617] transition-all font-bold text-white placeholder:text-slate-600"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-8 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={12} className="text-blue-500" /> Secure Password
                    </label>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      strength >= 75 ? 'text-emerald-400 bg-emerald-500/10' : 
                      strength >= 50 ? 'text-blue-400 bg-blue-500/10' : 
                      'text-rose-400 bg-rose-500/10'
                    }`}>
                      Security: {strength >= 75 ? 'Optimal' : strength >= 50 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <input 
                    type="password" required placeholder="8+ chars, Uppercase, Numbers" minLength={8}
                    className="w-full h-18 px-8 bg-[#1E293B] border border-white/5 rounded-3xl outline-none focus:border-blue-600 focus:bg-[#020617] transition-all font-bold text-white placeholder:text-slate-600"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  {/* Strength Bar */}
                  <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      animate={{ width: `${strength}%` }}
                      className={`h-full ${
                        strength >= 75 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                        strength >= 50 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                        'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Lock size={12} className="text-blue-500" /> Repeat Credentials
                  </label>
                  <input 
                    type="password" required placeholder="Verify password"
                    className="w-full h-18 px-8 bg-[#1E293B] border border-white/5 rounded-3xl outline-none focus:border-blue-600 focus:bg-[#020617] transition-all font-bold text-white placeholder:text-slate-600"
                    value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-10">
                <button 
                  type="submit" disabled={submitting}
                  className="w-full h-20 rounded-[32px] bg-white text-[#020617] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100 group"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      Activate Protocol 
                      <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-center mt-6 text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle2 size={10} className="text-blue-500" /> 
                  End-to-End Encrypted Identity Provisioning
                </p>
              </div>
            </form>
          </div>
       </motion.div>
    </div>
  );
};

export default AcceptInvite;
