import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  History, 
  Monitor, 
  Globe, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PlatformSecurity = () => {
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const sessions = [
    { id: 1, device: 'MacBook Pro 16"', browser: 'Chrome', location: 'San Francisco, US', ip: '192.168.1.1', status: 'Current Session', lastActive: 'Now' },
    { id: 2, device: 'iPhone 15 Pro', browser: 'Safari', location: 'London, UK', ip: '82.45.12.9', status: 'Active', lastActive: '2h ago' },
    { id: 3, device: 'Windows Desktop', browser: 'Edge', location: 'Mumbai, IN', ip: '103.24.11.4', status: 'Active', lastActive: 'Yesterday' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-12 pb-24"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
         <div>
            <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase">Security</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl leading-relaxed">Manage your system security settings and secure access sessions.</p>
         </div>
         <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <ShieldCheck size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">System Secured</span>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
         {/* AUTHENTICATION MODULE */}
         <div className="bg-white rounded-[64px] border border-slate-100 p-12 space-y-12">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Lock size={24} />
               </div>
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Security Settings</h3>
            </div>
            
            <div className="space-y-8">
               <SecurityAction 
                 icon={Key} 
                 title="Update Password" 
                 desc="Change your operator password to maintain high-level security standards." 
                 action="Change Password" 
               />
               <div className="h-px bg-slate-50" />
               <div className="flex items-center justify-between group">
                  <div className="flex gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-all">
                        <Smartphone size={24} />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-[#0F172A] uppercase italic">Two-Factor Authentication</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">Add an extra layer of security to your operator account using TOTP verification.</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                    className={`h-10 w-20 rounded-full relative transition-all ${is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                     <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-sm ${is2FAEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
               </div>
               <div className="h-px bg-slate-50" />
               <SecurityAction 
                 icon={Fingerprint} 
                 title="Biometric Access" 
                 desc="Enable FaceID or TouchID for rapid platform authentication (Device specific)." 
                 action="Configure" 
                 disabled
               />
            </div>
         </div>

         {/* SESSION MANAGEMENT */}
         <div className="bg-white rounded-[64px] border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-12 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                     <Monitor size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Active Sessions</h3>
               </div>
               <button className="text-[11px] font-black text-rose-500 uppercase tracking-widest hover:underline">Revoke All Sessions</button>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Device / Browser</th>
                        <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                        <th className="px-12 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                        <th className="px-12 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {sessions.map((session) => (
                       <tr key={session.id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-12 py-8">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.status === 'Current Session' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                   {session.device.includes('iPhone') ? <Smartphone size={18} /> : <Monitor size={18} />}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-[#0F172A] uppercase italic">{session.device}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{session.browser} • {session.status}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-12 py-8">
                             <div className="flex items-center gap-2">
                                <Globe size={14} className="text-slate-300" />
                                <span className="text-sm font-medium text-slate-600">{session.location}</span>
                             </div>
                          </td>
                          <td className="px-12 py-8 text-sm font-mono text-slate-400">{session.ip}</td>
                          <td className="px-12 py-8 text-right">
                             {session.status !== 'Current Session' && (
                               <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Revoke</button>
                             )}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* AUDIT LOGS PREVIEW */}
         <div className="bg-[#0F172A] rounded-[64px] p-12 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-1000">
               <History size={200} />
            </div>
            <div className="relative z-10 space-y-12">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <History size={24} />
                     </div>
                     <h3 className="text-2xl font-black uppercase italic tracking-tight">Security Audit History</h3>
                  </div>
                  <button className="h-12 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View All Logs</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AuditItem event="Failed Login Attempt" meta="Chrome / Linux (Unknown)" time="2h ago" type="danger" />
                  <AuditItem event="Password Changed" meta="Operator System" time="3 days ago" type="success" />
                  <AuditItem event="New Session Authorized" meta="London, UK" time="5 days ago" type="info" />
                  <AuditItem event="IP Whitelist Updated" meta="System Admin" time="1 week ago" type="info" />
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

const SecurityAction = ({ icon: Icon, title, desc, action, disabled }) => (
  <div className="flex items-center justify-between group">
     <div className="flex gap-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
           <Icon size={24} />
        </div>
        <div>
           <h4 className="text-lg font-black text-[#0F172A] uppercase italic">{title}</h4>
           <p className="text-sm text-slate-500 font-medium mt-1">{desc}</p>
        </div>
     </div>
     <button 
       disabled={disabled}
       className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-[#0F172A] text-white hover:scale-105 active:scale-95'}`}
     >
        {action}
     </button>
  </div>
);

const AuditItem = ({ event, meta, time, type }) => {
  const dots = {
    danger: 'bg-rose-500',
    success: 'bg-emerald-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-[32px] border border-white/10">
       <div className={`w-2.5 h-2.5 rounded-full ${dots[type]}`} />
       <div className="flex-1">
          <p className="text-sm font-black uppercase italic leading-none">{event}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">{meta} • {time}</p>
       </div>
    </div>
  );
};

export default PlatformSecurity;
