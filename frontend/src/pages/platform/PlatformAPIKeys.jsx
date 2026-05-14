import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Zap, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const PlatformAPIKeys = () => {
  const [showKeys, setShowKeys] = useState({});

  const toggleKey = (id) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Key copied to clipboard');
  };

  const infrastructureKeys = [
    { id: 'gemini', name: 'AI Engine (Gemini)', icon: Cpu, key: 'AIzaSy...Keps', type: 'Production', lastUsed: '3m ago' },
    { id: 'twilio', name: 'VOIP Gateway (Twilio)', icon: Phone, key: 'AC89b2...99f0', type: 'Production', lastUsed: '12m ago' },
    { id: 'smtp', name: 'Mail Infrastructure (SendGrid)', icon: Mail, key: 'SG.k9j...p02q', type: 'Development', lastUsed: '2h ago' }
  ];

  const apiTokens = [
    { id: 'master', name: 'Master Infrastructure Key', key: 'crm_platform_live_92kd...8k2l', status: 'ACTIVE', created: '2026-05-01' },
    { id: 'analytics', name: 'Analytics System Connector', key: 'crm_analytics_ext_29kf...90j1', status: 'ACTIVE', created: '2026-05-04' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-12 pb-24"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
         <div>
            <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase">API Keys</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl leading-relaxed">Centralized infrastructure credentials and platform integration tokens.</p>
         </div>
         <button className="h-16 px-8 bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-xl">
            <Plus size={20} /> Generate Platform Token
         </button>
      </div>

      <div className="grid grid-cols-1 gap-12">
         {/* INFRASTRUCTURE KEYS (SYSTEM-LEVEL) */}
         <div className="bg-white rounded-[64px] border border-slate-100 p-12 space-y-12">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                     <Zap size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Infrastructure Credentials</h3>
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core System Keys</span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
               {infrastructureKeys.map((item) => (
                 <div key={item.id} className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:bg-white hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-[28px] bg-white border border-slate-100 flex items-center justify-center text-[#0F172A] shadow-sm group-hover:scale-110 transition-all">
                          <item.icon size={28} />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-[#0F172A] uppercase italic">{item.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type} • Last used {item.lastUsed}</p>
                       </div>
                    </div>
                    
                    <div className="flex-1 max-w-2xl flex items-center gap-4">
                       <div className="flex-1 h-16 px-8 bg-white border border-slate-200 rounded-3xl flex items-center justify-between font-mono text-sm group-hover:border-blue-200 transition-all">
                          <span className="truncate mr-4">{showKeys[item.id] ? item.key : '••••••••••••••••••••••••••••'}</span>
                          <button onClick={() => toggleKey(item.id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                             {showKeys[item.id] ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(item.key)} className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"><Copy size={20} /></button>
                          <button className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm"><RefreshCw size={20} /></button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* DEVELOPER TOKENS (PLATFORM-LEVEL) */}
         <div className="bg-[#0F172A] rounded-[64px] p-12 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-1000">
               <Globe size={200} />
            </div>
            <div className="relative z-10 space-y-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Key size={24} />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Active Platform Tokens</h3>
               </div>
               
               <div className="space-y-6">
                  {apiTokens.map((token) => (
                    <div key={token.id} className="p-8 bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-between group/row">
                       <div>
                          <div className="flex items-center gap-3">
                             <h4 className="text-lg font-black uppercase italic">{token.name}</h4>
                             <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase">Active</span>
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">{token.key}</p>
                       </div>
                       <div className="flex items-center gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                          <span className="text-[10px] font-bold text-white/40 uppercase mr-4">Created {token.created}</span>
                          <button onClick={() => copyToClipboard(token.key)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><Copy size={18} /></button>
                          <button className="w-12 h-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all"><Trash2 size={18} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* WEBHOOKS PREVIEW */}
         <div className="bg-white rounded-[64px] border border-slate-100 p-12 space-y-12 shadow-sm">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                     <Globe size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">System Webhooks</h3>
               </div>
               <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">Configure Webhooks <ExternalLink size={14} /></button>
            </div>
            
            <div className="p-10 bg-indigo-50/30 rounded-[40px] border border-indigo-100 flex items-center justify-between border-dashed">
               <div className="space-y-2">
                  <p className="text-lg font-black text-[#0F172A] uppercase italic">Primary Webhook Endpoint</p>
                  <p className="text-sm font-mono text-indigo-600/60">https://api.advancedcrm.com/v1/webhooks/platform</p>
               </div>
               <button onClick={() => copyToClipboard('https://api.advancedcrm.com/v1/webhooks/platform')} className="h-14 px-8 bg-white border border-indigo-200 rounded-2xl text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Copy Endpoint</button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default PlatformAPIKeys;
