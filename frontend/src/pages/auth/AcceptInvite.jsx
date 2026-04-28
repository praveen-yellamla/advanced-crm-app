import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ShieldCheck, ArrowRight, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}`);
        setInviteData(res.data.data);
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
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSubmitting(true);
    try {
      await api.post('/auth/accept-invite', {
        token,
        name: formData.name,
        password: formData.password
      });
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="text-white text-sm font-bold uppercase tracking-widest animate-pulse">Verifying Security Token...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[40px] p-16 text-center shadow-2xl">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
             <XCircle className="text-red-500" size={32} />
           </div>
           <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-widest mb-4">Verification Failed</h2>
           <p className="text-slate-500 font-medium mb-10">{error}</p>
           <button 
             onClick={() => navigate('/login')}
             className="h-14 px-8 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
           >
             Return to Login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
       <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden p-16 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="mb-12 text-center">
             <div className="w-20 h-20 bg-blue-50 border-4 border-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-3">
               <ShieldCheck className="text-blue-600" size={32} />
             </div>
             <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight uppercase">Setup Account</h1>
             <p className="text-slate-500 font-medium mt-3">You have been invited to join as <strong className="text-blue-600">{inviteData?.role}</strong></p>
             <div className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{inviteData?.email}</span>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-3">
                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Full Name</label>
                <input 
                   type="text" required placeholder="John Doe"
                   className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Secure Password</label>
                <input 
                   type="password" required placeholder="Minimum 6 characters" minLength={6}
                   className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                   value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Confirm Password</label>
                <input 
                   type="password" required placeholder="Re-enter password" minLength={6}
                   className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                   value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
             </div>

             <button 
                type="submit" disabled={submitting}
                className="w-full h-16 mt-8 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100"
             >
                {submitting ? 'Initializing Account...' : <>Complete Setup <ArrowRight size={20}/></>}
             </button>
          </form>
       </div>
    </div>
  );
};

export default AcceptInvite;
