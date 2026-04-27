import React from 'react';
import { 
  Globe, 
  Settings, 
  ShieldCheck, 
  Database, 
  Zap, 
  MessageCircle, 
  Mail, 
  Key,
  Layout,
  Code,
  Link,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const SystemIntegrations = () => {
  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div>
         <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Ecosystem Orchestration</h1>
         <p className="text-[#64748B] font-medium text-sm mt-1">Configure high-authority digital bridges for automated lead synchronization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* MARKETING BRIDGES */}
         <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-4">
               Marketing Identity Bridges <div className="h-px flex-1 bg-slate-100" />
            </h3>
            
            <IntegrationCard 
               platform="Google Ads"
               icon={<Layout className="text-amber-600" />}
               desc="OAuth2 synchronized campaign ingestion for real-time lead telemetry."
               status="AUTHENTICATED"
               connectedAccount="Enterprise Global (928-112-9842)"
            />

            <IntegrationCard 
               platform="Meta Marketing"
               icon={<MessageCircle className="text-blue-600" />}
               desc="Capture leads directly from Facebook Forms & Instagram Messenger threads."
               status="DISCONNECTED"
               isWarning
            />
         </div>

         {/* INFRASTRUCTURE BRIDGES */}
         <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-4">
               Operational Infrastructure <div className="h-px flex-1 bg-slate-100" />
            </h3>

            <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm space-y-10">
               <div className="flex items-start justify-between">
                  <div>
                     <h4 className="text-2xl font-bold text-[#0F172A] tracking-tight">Website Webhook Node</h4>
                     <p className="text-sm font-medium text-slate-400 mt-2">JS snippet for automated website lead capture.</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                     <Code size={28} />
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[32px] p-10 font-mono text-xs text-blue-300 leading-relaxed relative group overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 opacity-50" />
                  <p className="mb-4 text-slate-500 font-bold block">// AdvancedCRM Autonomous Snippet</p>
                  <p>{'<script src="https://cdn.advancedcrm.io/sdk/v1.js"></script>'}</p>
                  <p>{'<script>'}</p>
                  <p className="pl-4">{'ACRM.init({'}</p>
                  <p className="pl-8">{'account: "AC-9827-X", '}</p>
                  <p className="pl-8">{'captureUtm: true '}</p>
                  <p className="pl-4">{'});'}</p>
                  <p>{'</script>'}</p>
                  <button className="absolute top-6 right-8 text-[10px] font-bold text-white bg-blue-600 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Copy Protocol</button>
               </div>

               <div className="flex gap-4">
                  <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Ingestion Endpoint</p>
                     <p className="text-xs font-bold text-[#0F172A] truncate">https://api.acrm.io/webhook/lead/AC-9827-X</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const IntegrationCard = ({ platform, icon, desc, status, connectedAccount, isWarning }) => (
  <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm relative group hover:shadow-2xl transition-all duration-500 overflow-hidden">
     <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-8">
           <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner ${isWarning ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
              {React.cloneElement(icon, { size: 36 })}
           </div>
           <div className="space-y-4">
              <h4 className="text-2xl font-bold text-[#0F172A] tracking-tight">{platform}</h4>
              <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">{desc}</p>
              
              <div className="flex items-center gap-6 pt-4">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'AUTHENTICATED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status}</span>
                 </div>
                 {connectedAccount && (
                   <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <Link size={12} /> {connectedAccount}
                   </div>
                 )}
              </div>
           </div>
        </div>
        <button className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0F172A] group-hover:text-white transition-all">
           {status === 'AUTHENTICATED' ? <ExternalLink size={20} /> : <Settings size={20} />}
        </button>
     </div>
     <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-all group-hover:bg-blue-500/10" />
  </div>
);

export default SystemIntegrations;
