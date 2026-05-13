import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  UserPlus, 
  ShieldAlert, 
  Cpu, 
  Globe, 
  Save, 
  Plus, 
  Image as ImageIcon,
  Zap,
  Lock,
  ChevronRight,
  Monitor,
  Layout,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PlatformSettings = () => {
  const [activeTab, setActiveTab] = useState('branding');

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette, desc: 'Global visual identity and logos.' },
    { id: 'registration', label: 'Onboarding', icon: UserPlus, desc: 'Signup flow and tenant provisioning.' },
    { id: 'maintenance', label: 'Maintenance', icon: ShieldAlert, desc: 'System status and access control.' },
    { id: 'ai', label: 'AI Configuration', icon: Cpu, desc: 'AI engine and token policies.' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ops</span>
              <div className="h-px w-8 bg-slate-200" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Portal Config</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Settings</h1>
           <p className="text-sm font-medium text-slate-500 mt-4 max-w-2xl">Configure platform-wide branding, tenant registration, and global system settings.</p>
        </div>
        
        <button className="h-16 px-10 bg-[#0F172A] text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4 shadow-2xl shadow-slate-900/40 hover:scale-105 transition-all">
           <Save size={20} /> Commit Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
         {/* SIDEBAR TABS */}
         <div className="w-full lg:w-[320px] space-y-4">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 p-6 rounded-[32px] transition-all duration-300 group relative overflow-hidden ${
                  activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-xl' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
              >
                 {activeTab === tab.id && (
                   <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white" />
                 )}
                 <tab.icon size={22} className={`relative z-10 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
                 <div className="relative z-10 text-left">
                    <span className="block text-[13px] font-black uppercase tracking-widest">{tab.label}</span>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tab.desc}</span>
                 </div>
              </button>
            ))}
         </div>

         {/* CONTENT AREA */}
         <div className="flex-1">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={activeTab}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-sm min-h-[600px]"
               >
                  {activeTab === 'branding' && <BrandingSettings />}
                  {activeTab === 'registration' && <RegistrationSettings />}
                  {activeTab === 'maintenance' && <MaintenanceSettings />}
                  {activeTab === 'ai' && <AISettings />}
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

const BrandingSettings = () => (
  <div className="space-y-12">
     <div className="space-y-3">
        <h3 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">Global Branding</h3>
        <p className="text-sm text-slate-500 font-medium">Customize the visual identity of the SaaS platform.</p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Platform Logo (SVG)</label>
           <div className="h-48 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-200 transition-all group">
              <ImageIcon size={40} className="group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase">Click to Upload</p>
           </div>
        </div>
        <div className="space-y-10">
           <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Brand Accent</label>
              <div className="flex gap-4">
                 {['#2563EB', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'].map(c => (
                   <div key={c} className="w-12 h-12 rounded-2xl cursor-pointer shadow-lg hover:scale-110 transition-all border-4 border-white" style={{ backgroundColor: c }} />
                 ))}
              </div>
           </div>
           <Input label="Platform Display Name" value="ADV.CRM PLATFORM" />
        </div>
     </div>
  </div>
);

const RegistrationSettings = () => (
  <div className="space-y-12">
     <div className="space-y-3">
        <h3 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">Onboarding Flow</h3>
        <p className="text-sm text-slate-500 font-medium">Configure how new tenants access the infrastructure.</p>
     </div>

     <div className="space-y-8">
        <ToggleRow 
          label="Open Registration" 
          description="Allow any user to create a new organization without approval." 
          enabled 
        />
        <ToggleRow 
          label="Domain Whitelisting" 
          description="Restrict signups to specific enterprise email domains." 
        />
        <ToggleRow 
          label="Welcome Tutorial" 
          description="Show an interactive walkthrough to new organization admins." 
          enabled 
        />
        <div className="pt-6">
           <Input label="Default Trial Duration (Days)" type="number" value="14" />
        </div>
     </div>
  </div>
);

const MaintenanceSettings = () => (
  <div className="space-y-12">
     <div className="space-y-3">
        <h3 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">Maintenance & Access</h3>
        <p className="text-sm text-slate-500 font-medium">Global overrides for platform availability.</p>
     </div>

     <div className="p-10 bg-rose-50 rounded-[48px] border border-rose-100 space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-xl">
                 <ShieldAlert size={32} />
              </div>
              <div>
                 <h4 className="text-xl font-black text-[#0F172A] uppercase italic">Maintenance Mode</h4>
                 <p className="text-sm text-slate-500 font-medium mt-1">Block all non-operator access to the platform.</p>
              </div>
           </div>
           <button className="h-12 w-20 rounded-full bg-slate-200 relative"><div className="absolute top-1 left-1 w-10 h-10 bg-white rounded-full" /></button>
        </div>
        <Input label="Maintenance Message" placeholder="The system is undergoing scheduled infrastructure upgrades. Please check back soon." />
     </div>
  </div>
);

const AISettings = () => (
  <div className="space-y-12">
     <div className="space-y-3">
        <h3 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">AI Infrastructure</h3>
        <p className="text-sm text-slate-500 font-medium">Global policies for AI assistance and token usage.</p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Master AI Engine</h4>
           <select className="w-full h-16 px-8 bg-white border border-slate-200 rounded-3xl outline-none focus:border-blue-600 font-black italic uppercase">
              <option>GPT-4o (Standard)</option>
              <option>Claude 3.5 Sonnet</option>
              <option>Llama 3 (Self-hosted)</option>
           </select>
        </div>
        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6">
           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Token Hard Cap (Global)</h4>
           <Input value="1,000,000" />
        </div>
     </div>
     
     <div className="h-px bg-slate-100" />
     
     <ToggleRow 
       label="AI Data Caching" 
       description="Enable global response caching to reduce infrastructure latency and costs." 
       enabled 
     />
  </div>
);

const Input = ({ label, value, disabled, placeholder, type = "text" }) => (
  <div className="space-y-4">
     {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
     <input 
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-16 px-8 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-blue-600 transition-all font-bold text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        defaultValue={value}
     />
  </div>
);

const ToggleRow = ({ label, description, enabled }) => (
  <div className="flex items-center justify-between p-8 bg-slate-50/50 border border-slate-100 rounded-[40px] hover:bg-slate-50 transition-all">
     <div>
        <h4 className="text-[13px] font-black text-[#0F172A] uppercase tracking-tight">{label}</h4>
        <p className="text-xs text-slate-500 font-medium mt-1">{description}</p>
     </div>
     <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`} />
     </div>
  </div>
);

export default PlatformSettings;
