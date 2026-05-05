import React, { useState } from 'react';
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
  ExternalLink,
  X,
  Info,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

const SystemIntegrations = () => {
  const queryClient = useQueryClient();
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);

  // Fetch real integration accounts from the database
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['systemIntegrations'],
    queryFn: async () => {
      const res = await api.get('/admin/integrations');
      return res.data.data;
    }
  });

  // Persistent connection mutation
  const connectMetaMutation = useMutation({
    mutationFn: () => api.post('/admin/integrations/meta'),
    onSuccess: () => {
      queryClient.invalidateQueries(['systemIntegrations']);
      toast.success('Meta Marketing Synchronized with Database');
      setIsMetaModalOpen(false);
    },
    onError: () => toast.error('Persistent Connection Failed')
  });

  const handleMetaConfirm = () => {
    connectMetaMutation.mutate();
  };

  const isMetaConnected = integrations?.some(i => i.platform === 'META' && i.isActive);

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div>
         <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Ecosystem Orchestration</h1>
         <p className="text-[#64748B] font-medium text-sm mt-1">Configure high-authority digital bridges for automated lead Synchronization</p>
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
               desc="OAuth2 Synchronized campaign ingestion for real-time lead telemetry."
               status="AUTHENTICATED"
               connectedAccount="Enterprise Global (928-112-9842)"
            />

            <IntegrationCard 
               platform="Meta Marketing"
               icon={<MessageCircle className="text-blue-600" />}
               desc="Capture leads directly from Facebook Forms & Instagram Messenger threads."
               status={isMetaConnected ? 'AUTHENTICATED' : 'DISCONNECTED'}
               isWarning={!isMetaConnected}
               onAction={() => setIsMetaModalOpen(true)}
               connectedAccount={isMetaConnected ? 'Database Synchronization Active' : null}
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
                     <h4 className="text-2xl font-bold text-[#0F172A] tracking-tight">Website Webhooks</h4>
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
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('<script src="https://cdn.advancedcrm.io/sdk/v1.js"></script>\n<script>\nACRM.init({\n  account: "AC-9827-X", \n  captureUtm: true \n});\n</script>');
                      toast.success('Protocol Copied to Clipboard');
                    }}
                    className="absolute top-6 right-8 text-[10px] font-bold text-white bg-blue-600 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copy Protocol
                  </button>
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

      <MetaConnectModal 
        isOpen={isMetaModalOpen} 
        onClose={() => setIsMetaModalOpen(false)} 
        onConfirm={handleMetaConfirm}
      />
    </div>
  );
};

const MetaConnectModal = ({ isOpen, onClose, onConfirm }) => {
  const verifyToken = "meta_verify_token_123";
  // Use the backend API URL from environment variables for production accuracy
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const callbackUrl = `${backendUrl}/webhooks/meta`;

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(err => {
      console.error('Copy failed', err);
      toast.error('Failed to copy. Please select and copy manually.');
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[24px] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <MessageCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Meta Integration Protocol</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Leadgen API Synchronization</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                <Info className="text-blue-600 shrink-0" size={24} />
                <p className="text-sm font-medium text-blue-900 leading-relaxed">
                  To connect Meta Marketing, you need to configure your Facebook App Webhooks in the Meta for Developers portal.
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Step 1: Configure Webhook</h4>
                <div className="grid gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Callback URL</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-xs font-bold text-blue-600 truncate">{callbackUrl}</code>
                      <button onClick={() => copyToClipboard(callbackUrl, 'URL')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-400 hover:text-blue-600"><Copy size={16} /></button>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify Token</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-xs font-bold text-blue-600">{verifyToken}</code>
                      <button onClick={() => copyToClipboard(verifyToken, 'Verify Token')} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-400 hover:text-blue-600"><Copy size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Step 2: Subscription Fields</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Subscribe to the <span className="font-bold text-slate-900">leadgen</span> field under the <span className="font-bold text-slate-900">Page</span> object in your Facebook App Dashboard.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={onConfirm}
                  className="w-full h-16 bg-[#0F172A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20"
                >
                  Confirm Configuration
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const IntegrationCard = ({ platform, icon, desc, status, connectedAccount, isWarning, onAction }) => (
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
        <button 
          onClick={onAction}
          className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0F172A] group-hover:text-white transition-all"
        >
           {status === 'AUTHENTICATED' ? <ExternalLink size={20} /> : <Settings size={20} />}
        </button>
     </div>
     <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-all group-hover:bg-blue-500/10" />
  </div>
);

export default SystemIntegrations;
