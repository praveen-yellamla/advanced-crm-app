import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Globe, 
  Settings, 
  Zap, 
  ShieldCheck,
  Smartphone,
  Clock,
  Fingerprint,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PlatformProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    timezone: 'IST',
    highVisibility: false,
    neuralAssistance: true,
    realtimeLogs: false,
    autoReconcile: true
  });

  const handleUpdateProfile = () => {
    toast.success('Identity protocols synchronized');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-12 pb-24"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
         <div>
            <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase">Identity</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl leading-relaxed">Manage your operator identification and platform-wide interaction preferences.</p>
         </div>
         <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <ShieldCheck size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Level 4 Operator</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT COLUMN: IDENTITY FORM */}
        <div className="lg:col-span-2 space-y-12">
           <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm space-y-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={24} />
                 </div>
                 <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Identity Protocols</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator Full Name</label>
                   <input 
                     type="text" 
                     value={profileData.name} 
                     onChange={e => setProfileData({...profileData, name: e.target.value})}
                     className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email Address</label>
                   <input 
                     type="email" 
                     value={profileData.email} 
                     disabled
                     className="w-full h-18 px-8 bg-slate-100 border border-slate-100 rounded-3xl outline-none font-bold text-slate-400 cursor-not-allowed"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator Phone</label>
                   <input 
                     type="text" 
                     value={profileData.phone} 
                     onChange={e => setProfileData({...profileData, phone: e.target.value})}
                     className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Timezone</label>
                   <select 
                     value={profileData.timezone}
                     onChange={e => setProfileData({...profileData, timezone: e.target.value})}
                     className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 transition-all font-bold text-[#0F172A] italic uppercase"
                   >
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="IST">IST (India Standard Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                   </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                 <button 
                   onClick={handleUpdateProfile}
                   className="h-16 px-12 bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                 >
                    Commit Identity Changes
                 </button>
              </div>
           </div>

           {/* SYSTEM PREFERENCES */}
           <div className="bg-[#0F172A] rounded-[64px] p-12 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-1000">
                 <Settings size={200} />
              </div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                       <Globe size={24} />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">System Preferences</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PreferenceToggle 
                      title="High-Visibility Mode" 
                      desc="Enhance UI contrast for better visibility during emergency monitoring." 
                      active={profileData.highVisibility}
                      onToggle={() => setProfileData({...profileData, highVisibility: !profileData.highVisibility})}
                    />
                    <PreferenceToggle 
                      title="Neural Assistance" 
                      desc="Allow AI-driven suggestions in the Platform Control Center." 
                      active={profileData.neuralAssistance}
                      onToggle={() => setProfileData({...profileData, neuralAssistance: !profileData.neuralAssistance})}
                    />
                    <PreferenceToggle 
                      title="Real-time Infrastructure Logs" 
                      desc="Stream live system logs directly into the dashboard footer." 
                      active={profileData.realtimeLogs}
                      onToggle={() => setProfileData({...profileData, realtimeLogs: !profileData.realtimeLogs})}
                    />
                    <PreferenceToggle 
                      title="Auto-Reconcile Invoices" 
                      desc="Enable background reconciliation of failed subscription payments." 
                      active={profileData.autoReconcile}
                      onToggle={() => setProfileData({...profileData, autoReconcile: !profileData.autoReconcile})}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: STATS & ACCESS */}
        <div className="space-y-12">
           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-10">
              <h3 className="text-xl font-black text-[#0F172A] uppercase italic">Access Status</h3>
              <div className="space-y-6">
                 <SidebarInfo label="Current Role" value={user?.role} icon={ShieldCheck} color="blue" />
                 <SidebarInfo label="System Level" value="Level 4 Operator" icon={Zap} color="violet" />
                 <SidebarInfo label="Connection" value="Secure / Encrypted" icon={CheckCircle2} color="emerald" />
              </div>
           </div>

           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-10">
              <h3 className="text-xl font-black text-[#0F172A] uppercase italic">Identity Metrics</h3>
              <div className="space-y-8">
                 <Metric label="Operator ID" value={`OP-${user?.id?.toString().padStart(6, '0')}`} icon={Fingerprint} />
                 <Metric label="Joined Platform" value={new Date(user?.createdAt).toLocaleDateString()} icon={Calendar} />
                 <Metric label="Default Node" value="US-EAST-1 (Primary)" icon={Globe} />
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const PreferenceToggle = ({ title, desc, active, onToggle }) => (
  <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
     <div className="flex-1 mr-6">
        <h4 className="text-[13px] font-black uppercase tracking-tight">{title}</h4>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 leading-relaxed">{desc}</p>
     </div>
     <button 
       onClick={onToggle}
       className={`w-12 h-6 rounded-full relative transition-all ${active ? 'bg-blue-500' : 'bg-white/10'}`}
     >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`} />
     </button>
  </div>
);

const SidebarInfo = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
             <Icon size={18} />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-[11px] font-black text-[#0F172A] uppercase italic">{value}</span>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-4">
     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon size={18} />
     </div>
     <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-[#0F172A] italic">{value}</p>
     </div>
  </div>
);

export default PlatformProfile;
