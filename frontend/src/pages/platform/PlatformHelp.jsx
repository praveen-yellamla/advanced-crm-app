import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Zap, 
  Shield, 
  Globe, 
  Settings, 
  ExternalLink,
  ChevronRight,
  LifeBuoy,
  BookOpen,
  Bug,
  Cpu
} from 'lucide-react';

const PlatformHelp = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'start', title: 'Getting Started', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Deploying your first tenant and configuring basic settings.' },
    { id: 'billing', title: 'Billing & Tiers', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Managing subscription plans and resource limits.' },
    { id: 'ai', title: 'AI Infrastructure', icon: Cpu, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Configuring AI tokens and AI assistant modules.' },
    { id: 'comm', title: 'Telephony & VOIP', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Twilio integration, call routing, and SIP gateway setup.' },
    { id: 'security', title: 'Security Ops', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', desc: '2FA, audit logs, and infrastructure encryption standards.' },
    { id: 'api', title: 'Developer Hub', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'API keys, webhooks, and custom integration settings.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 pb-24"
    >
      {/* HEADER SECTION */}
      <div className="bg-[#0F172A] rounded-[64px] p-16 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5">
            <LifeBuoy size={300} />
         </div>
         <div className="relative z-10 max-w-3xl">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-tight">Help Center</h1>
            <p className="text-xl text-slate-400 font-medium mt-6 leading-relaxed">System-wide documentation, troubleshooting, and direct operator support modules.</p>
            
            <div className="mt-12 relative">
               <div className="absolute inset-y-0 left-8 flex items-center text-slate-400">
                  <Search size={24} />
               </div>
               <input 
                 type="text"
                 placeholder="Search documentation, FAQs, or troubleshooting guides..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-20 pl-20 pr-8 bg-white/10 border border-white/20 rounded-[32px] outline-none focus:bg-white focus:text-[#0F172A] transition-all font-bold text-lg placeholder:text-slate-500"
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         {/* CATEGORIES GRID */}
         <div className="xl:col-span-2 space-y-10">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Knowledge Base</h3>
               <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">View Full Docs <ExternalLink size={14} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {categories.map((cat) => (
                 <div key={cat.id} className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 ${cat.bg} ${cat.color} group-hover:scale-110 transition-all`}>
                       <cat.icon size={28} />
                    </div>
                    <h4 className="text-xl font-black text-[#0F172A] uppercase italic mb-3">{cat.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{cat.desc}</p>
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                       Explore Module <ChevronRight size={14} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* SUPPORT SIDEBAR */}
         <div className="space-y-10">
            <h3 className="text-2xl font-black text-[#0F172A] uppercase italic px-4">Direct Support</h3>
            
            <div className="space-y-6">
               <SupportCard 
                 title="Operator Support" 
                 desc="Connect with platform engineers for critical infrastructure issues." 
                 icon={MessageSquare} 
                 action="Create Support Ticket" 
                 color="blue"
               />
               <SupportCard 
                 title="Documentation" 
                 desc="Comprehensive API reference and system configuration guides." 
                 icon={BookOpen} 
                 action="Open Developer Docs" 
                 color="violet"
               />
               <SupportCard 
                 title="Troubleshooting" 
                 desc="Automated diagnostics for common tenant and AI system errors." 
                 icon={Bug} 
                 action="Run Diagnostics" 
                 color="rose"
               />
            </div>

            <div className="bg-slate-50 rounded-[48px] p-10 space-y-6 border border-slate-100">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">System Health</h4>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-600 uppercase">Global Status</span>
                     <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase">All Systems Optimal</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-600 uppercase">Support Load</span>
                     <span className="text-[11px] font-black text-slate-400 uppercase">Normal</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* FAQ SECTION */}
      <div className="bg-white rounded-[64px] border border-slate-100 p-16 space-y-12">
         <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-[#0F172A] uppercase italic">Common Procedures & Troubleshooting</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Quick Resolution Infrastructure</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <FAQItem 
              q="How do I reset an AI instance for a specific tenant?" 
              a="Navigate to Company Hub > [Tenant] > Infrastructure and click 'Recalibrate AI Engine'. This will re-provision the Gemini keys and flush the context cache." 
            />
            <FAQItem 
              q="Twilio VOIP gateway shows 'Unauthorized' in logs." 
              a="Verify your System Keys in the Platform Settings. Ensure the Account SID and Auth Token match your Twilio dashboard and that the IP whitelist includes our primary system." 
            />
            <FAQItem 
              q="What is the lead limit policy for STARTER plans?" 
              a="STARTER plans are hard-capped at 1,000 leads. Exceeding this will pause import until the tenant is upgraded or old records are archived." 
            />
            <FAQItem 
              q="How do I manually trigger a billing reconciliation?" 
              a="Reconciliation is automated every 24 hours. To force a sync, go to Revenue Ops and select 'Force Global Sync' in the overflow menu." 
            />
         </div>
      </div>
    </motion.div>
  );
};

const SupportCard = ({ title, desc, icon: Icon, action, color }) => {
  const colors = {
    blue: 'bg-blue-600 shadow-blue-600/20',
    violet: 'bg-violet-600 shadow-violet-600/20',
    rose: 'bg-rose-600 shadow-rose-600/20'
  };

  return (
    <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm space-y-6">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#0F172A]">
             <Icon size={24} />
          </div>
          <h4 className="text-lg font-black text-[#0F172A] uppercase italic leading-none">{title}</h4>
       </div>
       <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
       <button className={`w-full h-14 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${colors[color]}`}>
          {action}
       </button>
    </div>
  );
};

const FAQItem = ({ q, a }) => (
  <div className="space-y-4 p-8 rounded-[40px] hover:bg-slate-50 transition-all cursor-default group">
     <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all font-black text-xs">Q</div>
        <h5 className="text-lg font-black text-[#0F172A] uppercase italic leading-tight">{q}</h5>
     </div>
     <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 font-black text-xs">A</div>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{a}</p>
     </div>
  </div>
);

export default PlatformHelp;
