import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Briefcase, 
  ArrowRight,
  Lock,
  Globe,
  Cpu,
  Database,
  Layers,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PortalSelection = () => {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);

  const portals = [
    {
      id: 'admin',
      label: 'GOVERNANCE NODE',
      title: 'CONTROL CENTER',
      desc: 'Manage users, security, analytics, and platform governance.',
      icon: <ShieldCheck size={32} />,
      accent: '#2563EB',
      gradient: 'from-blue-600 to-blue-800',
      path: '/login/admin',
      tags: ['Security', 'Users', 'Analytics'],
      status: 'ACCESS READY'
    },
    {
      id: 'manager',
      label: 'OPERATIONS NODE',
      title: 'MANAGER DESK',
      desc: 'Track teams, productivity, and lead allocation.',
      icon: <Zap size={32} />,
      accent: '#7C3AED',
      gradient: 'from-violet-600 to-violet-800',
      path: '/login/manager',
      tags: ['KPI Tracking', 'Lead Flow', 'Team Sync'],
      status: 'SYNC READY'
    },
    {
      id: 'agent',
      label: 'MISSION NODE',
      title: 'AGENT OPS',
      desc: 'Run calls, leads, routing, and conversions.',
      icon: <Headphones size={32} />,
      accent: '#06B6D4',
      gradient: 'from-cyan-500 to-cyan-700',
      path: '/login/agent',
      tags: ['Voice Suite', 'Smart Queue', 'Efficiency'],
      status: 'NODE READY'
    },
    {
      id: 'client',
      label: 'SUCCESS NODE',
      title: 'CLIENT HUB',
      desc: 'Monitor ROI, reports, and company growth.',
      icon: <Briefcase size={32} />,
      accent: '#4F46E5',
      gradient: 'from-indigo-600 to-indigo-800',
      path: '/login/client',
      tags: ['ROI Reports', 'Growth Grid', 'Insights'],
      status: 'ACCESS READY'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans bg-grid-light">
      
      {/* AMBIENT BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none">
         <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3], x: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -right-[5%] w-[800px] h-[800px] bg-blue-100/50 blur-[120px] rounded-full" 
         />
         <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2], x: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[5%] -left-[5%] w-[600px] h-[600px] bg-violet-100/50 blur-[100px] rounded-full" 
         />
      </div>

      <div className="w-full max-w-[1600px] relative z-10 py-12">
        
        {/* BRAND HEADER */}
        <div className="text-center mb-24 space-y-6">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white border border-slate-200 shadow-xl shadow-blue-500/5"
           >
              <div className="flex gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                 <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse delay-75" />
                 <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-150" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">AdvancedCRM Enterprise Hub</span>
           </motion.div>

           <div className="space-y-4">
              <h1 className="text-6xl md:text-[90px] font-black text-[#0F172A] tracking-tighter leading-[0.9] drop-shadow-sm">
                Unified Portal <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Sync Interface.</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">Select your high-performance environment to initialize session protocols.</p>
           </div>
        </div>

        {/* PORTAL SELECTOR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
           {portals.map((portal, i) => (
             <PortalCard 
               key={portal.id} 
               portal={portal} 
               index={i} 
               isHovered={hoveredNode === portal.id}
               onHover={setHoveredNode}
               onClick={() => navigate(portal.path)} 
             />
           ))}
        </div>

        {/* TRUST COMPLIANCE BAR */}
        <div className="mt-24 w-full pt-16 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                 <Lock size={24} />
              </div>
              <div className="text-left font-sans">
                 <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest leading-none">Military-Grade Security</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Readiness: 99.98% • SOC2 Certified
                 </p>
              </div>
           </div>
           
           <div className="flex items-center justify-center gap-x-12 gap-y-6 flex-wrap">
              {[
                { icon: <Database size={16} />, label: 'SOC2 Type II' }, 
                { icon: <Globe size={16} />, label: 'ISO 27001' }, 
                { icon: <Cpu size={16} />, label: 'SSO Federated' }
              ].map((item, id) => (
                <div key={id} className="flex items-center gap-3">
                   <div className="text-slate-300">{item.icon}</div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]">{item.label}</span>
                </div>
              ))}
           </div>
           
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Access Policy 40.2 • Intelligence Node Secured
           </div>
        </div>

      </div>
    </div>
  );
};

const PortalCard = ({ portal, index, onClick, onHover, isHovered }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.1), duration: 0.6 }}
      onMouseEnter={() => onHover(portal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`
        relative group cursor-pointer 
        bg-white/80 backdrop-blur-xl border border-white/60 
        p-12 rounded-[32px] overflow-hidden
        transition-all duration-[0.4s] ease-out flex flex-col 
        h-[760px] md:h-[780px]
        ${isHovered ? '-translate-y-6 shadow-[0_60px_100px_-20px_rgba(15,23,42,0.1)] border-white' : 'shadow-[0_20px_40px_rgba(0,0,0,0.03)]'}
      `}
    >
      {/* ROLE TOP LINE */}
      <div 
        className={`absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r ${portal.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* 1. ICON SECTION (90px) */}
      <div className="h-[90px] flex items-start">
         <div 
           className={`
             w-20 h-20 rounded-[20px] flex items-center justify-center 
             transition-all duration-500 relative
             ${isHovered ? `scale-110 shadow-2xl` : 'bg-slate-50 text-slate-400'}
           `}
           style={isHovered ? { backgroundColor: portal.accent, color: '#fff', boxShadow: `0 20px 40px ${portal.accent}33` } : {}}
         >
            {portal.icon}
         </div>
      </div>

      {/* 2. LABEL SECTION (28px) */}
      <div className="h-[28px] mt-8 flex items-center">
         <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 group-hover:text-[#0F172A] transition-colors">
            {portal.label}
         </span>
      </div>

      {/* 3. TITLE SECTION (min-height: 130px) */}
      <div className="min-h-[130px] mt-4 flex items-start">
         <h3 
           className="font-black text-[#0F172A] uppercase leading-[0.95] tracking-[-0.03em] w-full"
           style={{ fontSize: 'clamp(38px, 3vw, 52px)' }}
         >
            {portal.title}
         </h3>
      </div>

      {/* 4. DESCRIPTION SECTION (min-height: 120px) */}
      <div className="min-h-[120px] mt-6 flex items-start">
         <p className="text-[#64748B] font-medium leading-[1.75] text-base lg:text-[16px]">
            {portal.desc}
         </p>
      </div>

      {/* 5. FEATURE TAGS SECTION (min-height: 110px) */}
      <div className="min-h-[110px] mt-4 flex items-start content-start flex-wrap gap-2">
         {portal.tags.map((tag, idx) => (
           <span key={idx} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#0F172A] group-hover:text-white transition-all border border-slate-100">
              {tag}
           </span>
         ))}
      </div>

      {/* 6. FOOTER CTA SECTION (Pinned) */}
      <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between w-full h-[100px]">
         <div className="flex flex-col gap-1.5 justify-center">
            <AnimatePresence mode='wait'>
               {isHovered ? (
                 <motion.div key="st-active" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{portal.status}</span>
                 </motion.div>
               ) : (
                 <motion.div key="st-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 opacity-30">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#0F172A]">INIT INITIALIZE</span>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         <motion.div 
            whileHover={{ scale: 1.08 }}
            className={`
               w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0
               ${isHovered ? `text-white shadow-2xl` : 'bg-slate-50 border border-slate-100 text-slate-300'}
            `}
            style={isHovered ? { backgroundColor: portal.accent, boxShadow: `0 15px 30px ${portal.accent}4d` } : {}}
         >
            <ArrowRight size={26} className={isHovered ? "translate-x-0.5" : ""} />
         </motion.div>
      </div>
    </motion.div>
  );
};

export default PortalSelection;
