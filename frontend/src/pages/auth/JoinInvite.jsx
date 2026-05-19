import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Key, Eye, EyeOff, Loader2, 
  CheckCircle2, User, Phone, Mail, Calendar, Compass, Lock, MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const JoinInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // Verification & Loading States
  const [isValidating, setIsValidating] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null); // { email, name, phone, teamName, organizationName, invitedBy, expiresAt }
  const [validationError, setValidationError] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Time remaining countdown state
  const [timeLeft, setTimeLeft] = useState('');

  // Validate Token on Mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError('Token parameter is missing from the invitation link.');
        setIsValidating(false);
        return;
      }
      try {
        const res = await api.get(`/auth/invite/validate?token=${token}`);
        if (res.data.valid) {
          setTokenInfo(res.data);
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setPhone(res.data.phone || '');
        } else {
          setValidationError(res.data.message || 'Invitation is invalid or has expired.');
        }
      } catch (err) {
        setValidationError(err.response?.data?.message || 'Server validation failed.');
      } finally {
        setIsValidating(false);
      }
    };
    validateToken();
  }, [token]);

  // Countdown timer calculation
  useEffect(() => {
    if (!tokenInfo?.expiresAt) return;

    const interval = setInterval(() => {
      const difference = new Date(tokenInfo.expiresAt) - new Date();
      if (difference <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenInfo]);

  // Password Checklist Helper
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  // Password Strength Meter
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    switch (score) {
      case 0: return { label: 'Weak', color: 'bg-red-500 w-1/4' };
      case 1: return { label: 'Weak', color: 'bg-red-500 w-1/4' };
      case 2: return { label: 'Fair', color: 'bg-amber-500 w-2/4' };
      case 3: return { label: 'Strong', color: 'bg-blue-500 w-3/4' };
      case 4: return { label: 'Very Strong', color: 'bg-green-500 w-full' };
      default: return { label: 'Weak', color: 'bg-red-500 w-1/4' };
    }
  };

  const strength = getPasswordStrength();

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error('You must agree to the Terms of Service & Privacy Policy');
      return;
    }
    if (!hasMinLen || !hasUpper || !hasNumber) {
      toast.error('Please meet all password security requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/invite/register', {
        token,
        name,
        email,
        phone,
        password,
        confirmPassword,
        dateOfBirth,
        gender,
        city
      });
      toast.success('Workspace activated successfully!');
      setIsRegistered(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#090d1f] flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
          <h2 className="text-xl font-extrabold uppercase tracking-widest text-slate-300">Validating Invite Signature...</h2>
          <p className="text-slate-500 text-xs">Connecting securely to CRM.PRO verification engine</p>
        </div>
      </div>
    );
  }

  // Error / Expired Link Screen
  if (validationError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0b0f19] border border-slate-900 rounded-[32px] p-10 text-center space-y-8 shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-pulse">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Access Denied</h2>
            <p className="text-slate-400 font-medium text-xs leading-relaxed">
              This secure invitation link is either expired, invalid, or has already been used to register an account.
            </p>
            <div className="bg-red-500/5 text-red-400 text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl border border-red-500/10 max-w-sm mx-auto">
              Reason: {validationError}
            </div>
          </div>

          <p className="text-slate-500 text-xs font-semibold">
            Please contact your CRM administrator or manager to request a new invitation link.
          </p>

          <Link
            to="/login"
            className="w-full h-14 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center"
          >
            Return to Login Portal
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success Registered Screen
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0b0f19] border border-slate-900 rounded-[32px] p-10 text-center space-y-8 shadow-2xl"
        >
          <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
            <ShieldCheck size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Workspace Activated! 🎉</h2>
            <p className="text-slate-400 font-medium text-xs leading-relaxed">
              Welcome to the team, <strong>{name}</strong>! Your sales cockpit is fully active and assigned.
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 text-left text-xs">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Onboarding Checklist:</div>
            <div className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircle2 size={13} /> Account provisioned</div>
            <div className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircle2 size={13} /> Assigned to {tokenInfo.teamName}</div>
            <div className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircle2 size={13} /> Welcome pack delivered to email</div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
          >
            Access Login Portal
          </button>
        </motion.div>
      </div>
    );
  }

  // Registration Form UI
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3">
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
          CRM<span className="text-blue-500">.PRO</span>
        </h1>
        <h2 className="text-xl font-extrabold text-slate-300">Complete Team Registration</h2>
        
        {tokenInfo && (
          <div className="inline-block px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] font-bold text-slate-400">
            🏢 {tokenInfo.organizationName} &middot; Invited by {tokenInfo.invitedBy}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0b0f19] border border-slate-900 py-10 px-10 rounded-[32px] shadow-2xl space-y-8"
        >
          {/* Header Banner for assigned team */}
          <div className="p-5 bg-blue-950/30 border border-blue-900/30 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Assigned Protocol Team:</span>
              <h4 className="text-sm font-black text-slate-200 uppercase tracking-wide">{tokenInfo?.teamName}</h4>
            </div>
            {timeLeft && (
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Link Expires In:</span>
                <span className="font-mono text-xs font-bold text-amber-500">{timeLeft}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest pl-1">Personal Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type="text" required
                      className="w-full h-12 pl-12 pr-6 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all"
                      placeholder="e.g. John Smith"
                      value={name} onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type="text" required
                      className="w-full h-12 pl-12 pr-6 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all"
                      placeholder="e.g. +91 98765 43210"
                      value={phone} onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Network Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-600" size={16} />
                  <input 
                    readOnly
                    type="email" 
                    className="w-full h-12 pl-12 pr-6 bg-slate-950 border border-slate-900 text-slate-500 rounded-xl outline-none text-xs font-bold font-mono cursor-not-allowed"
                    value={email}
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type="date"
                      className="w-full h-12 pl-11 pr-4 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-[11px] font-bold text-white transition-all"
                      value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Gender</label>
                  <div className="relative">
                    <Compass className="absolute left-4 top-4 text-slate-500" size={16} />
                    <select
                      className="w-full h-12 pl-12 pr-4 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all appearance-none"
                      value={gender} onChange={e => setGender(e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not...</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type="text"
                      className="w-full h-12 pl-12 pr-4 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all"
                      placeholder="e.g. Mumbai"
                      value={city} onChange={e => setCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Creation */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest pl-1">Security Credentials</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Create Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type={showPassword ? "text" : "password"} required
                      className="w-full h-12 pl-12 pr-12 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all"
                      placeholder="Min 8 characters"
                      value={password} onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm Password *</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-4 text-slate-500" size={16} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} required
                      className="w-full h-12 pl-12 pr-12 bg-slate-900/60 border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-xs font-bold text-white transition-all"
                      placeholder="Repeat password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength visual indicator */}
              {password && (
                <div className="space-y-1.5 pl-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Strength:</span>
                    <span className="font-extrabold uppercase text-slate-300">{strength.label}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} />
                  </div>
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pl-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className={hasMinLen ? 'text-green-500' : 'text-slate-700'} />
                  <span>Min 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className={hasUpper ? 'text-green-500' : 'text-slate-700'} />
                  <span>One uppercase letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className={hasNumber ? 'text-green-500' : 'text-slate-700'} />
                  <span>One number</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className={passwordsMatch ? 'text-green-500' : 'text-slate-700'} />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <label className="flex items-start gap-3 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-500 cursor-pointer h-4 w-4 rounded border-slate-800"
                  checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                />
                <span className="text-[10px] font-bold leading-normal text-slate-400 select-none">
                  I agree to the <span className="text-blue-500 underline">Terms of Service</span> and <span className="text-blue-500 underline">Privacy Policy</span> of CRM.PRO
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms || !hasMinLen || !hasUpper || !hasNumber || !passwordsMatch}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>Create My Account & Join Workspace</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinInvite;
