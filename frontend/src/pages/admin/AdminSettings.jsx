import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Settings, 
  Building2, 
  Users, 
  PhoneCall, 
  Mail, 
  Globe, 
  Database, 
  CreditCard, 
  BrainCircuit, 
  HardDrive, 
  Bell, 
  History, 
  ShieldCheck, 
  FileJson,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'COMPANY', label: 'Company Profile', icon: Building2 },
  { id: 'USERS', label: 'User & Role Mgmt', icon: Users },
  { id: 'TELEPHONY', label: 'Telephony', icon: PhoneCall },
  { id: 'ADS', label: 'Ad Intelligence', icon: Globe },
  { id: 'WEBHOOKS', label: 'Webhooks & APIs', icon: Database },
  { id: 'Billing', label: 'Fiscal Protocol', icon: CreditCard },
  { id: 'AI', label: 'Cognitive Engine', icon: BrainCircuit },
  { id: 'STORAGE', label: 'Storage Cluster', icon: HardDrive },
  { id: 'NOTIFICATIONS', label: 'System Alerts', icon: Bell },
  { id: 'AUDIT', label: 'Audit Ledger', icon: History },
  { id: 'PRIVACY', label: 'Data Compliance', icon: ShieldCheck },
];

const AdminSettings = () => {
  const [activeCategory, setActiveCategory] = useState('COMPANY');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  const filteredCategories = CATEGORIES.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    const status = params.get('status');

    if (integration === 'google') {
      if (status === 'success') {
        toast.success('Google Ads Integration Established Successfully.');
        setActiveCategory('ADS');
      } else if (status === 'error') {
        toast.error('Google Ads Integration Failed.');
        setActiveCategory('ADS');
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-10 pb-24 min-h-screen">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full xl:w-96 flex flex-col gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
           <div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter italic uppercase underline decoration-blue-600 decoration-8 underline-offset-8">Settings.</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Global Platform Orchestration</p>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" placeholder="Search parameters..." 
                className="w-full h-14 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm text-[#0F172A]"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex flex-col gap-2">
              {filteredCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all duration-500 group ${
                    activeCategory === cat.id ? 'bg-[#0F172A] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <cat.icon size={18} className={activeCategory === cat.id ? 'text-blue-400' : 'text-slate-300 group-hover:text-blue-600'} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
           </div>
        </div>
      </aside>

      {/* CONTENT ENGINE */}
      <main className="flex-1 space-y-8">
         <AnimatePresence mode="wait">
            <motion.div 
               key={activeCategory}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="bg-white p-12 xl:p-16 rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden min-h-[800px]"
            >
               {/* WATERMARK */}
               <div className="absolute top-0 right-0 p-16 opacity-[0.03] italic text-[#0F172A] text-9xl font-black tracking-tighter uppercase pointer-events-none select-none">
                  {activeCategory}
               </div>

               <DynamicContent category={activeCategory} />
            </motion.div>
         </AnimatePresence>

         {/* STICKY ACTION BAR */}
         {hasUnsavedChanges && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0F172A] p-6 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 z-[200]"
            >
               <div className="flex items-center gap-4 text-white">
                  <AlertTriangle className="text-amber-400" size={24} />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Unsaved Variations Detected</p>
                    <p className="text-[10px] text-slate-400 font-bold">Persistence ledger currently in mutation state.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setHasUnsavedChanges(false)} className="px-6 h-12 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Cancel</button>
                  <button className="px-8 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
                     <Save size={16} /> Persistent Save
                  </button>
               </div>
            </motion.div>
         )}
      </main>
    </div>
  );
};

const DynamicContent = ({ category }) => {
  switch (category) {
    case 'COMPANY': return <CompanySettings />;
    case 'TELEPHONY': return <TelephonySettings />;
    case 'AI': return <AISettings />;
    case 'Billing': return <BillingSettings />;
    case 'ADS': return <AdsSettings />;
    case 'AUDIT': return <AuditLedger />;
    default: return <PlaceholderSettings category={category} />;
  }
};

const AuditLedger = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit'); // Need to implement this route
      return res.data.data;
    }
  });

  return (
    <div className="space-y-12 relative z-10">
        <div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Audit Ledger.</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Comprehensive record of institutional activity and persistence mutations.</p>
        </div>

        <div className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-800/50">
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Actor</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action Protocol</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Target Entity</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                 </tr>
              </thead>
              <tbody className="text-white/80 font-mono text-xs">
                 {isLoading ? (
                   <tr><td colSpan="5" className="p-20 text-center animate-pulse">Synchronizing Ledger Data...</td></tr>
                 ) : logs?.map((log, i) => (
                   <tr key={i} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-8 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-8 font-black text-blue-400">{log.user?.name || 'SYSTEM'}</td>
                      <td className="p-8 uppercase tracking-widest">{log.action}</td>
                      <td className="p-8 text-emerald-400/80">{log.target}</td>
                      <td className="p-8">
                         <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-black uppercase text-[9px]">Verified</span>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
    </div>
  );
};

const CompanySettings = () => {
    return (
        <div className="space-y-12 relative z-10">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Corporate ID.</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Configure institutional branding and locale parameters.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormInput label="Institutional Name" placeholder="AdvancedCRM Inc." />
                <FormInput label="GST/VAT Registry ID" placeholder="27AAACH...1Z2" />
                <FormInput label="Headquarters Address" placeholder="101 Innovation Park, Silicon Valley" colSpan="md:col-span-2" />
                
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Locale Configuration</label>
                    <div className="grid grid-cols-2 gap-4">
                        <select className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A]">
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                            <option>INR (₹)</option>
                        </select>
                        <select className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A]">
                            <option>English (US)</option>
                            <option>Spanish (ES)</option>
                            <option>French (FR)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Signature Color</label>
                   <div className="flex gap-4">
                      {['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'].map(c => (
                        <button key={c} style={{ backgroundColor: c }} className="w-16 h-16 rounded-2xl shadow-lg hover:scale-110 transition-all border-4 border-white" />
                      ))}
                   </div>
                </div>
            </div>

            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-6 group hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    <Building2 size={32} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Logo Repository</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">PNG/SVG/WEBP (MAX 2MB)</p>
                </div>
            </div>
        </div>
    );
};

const TelephonySettings = () => {
    const [selectedProvider, setSelectedProvider] = useState('TWILIO');
    return (
        <div className="space-y-12 relative z-10">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Voice Grid.</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Configure primary and secondary telephony gateways.</p>
            </div>

            <div className="flex gap-4">
                {['TWILIO', 'EXOTEL', 'KNOWLARITY', 'SIP'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setSelectedProvider(p)}
                    className={`px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedProvider === p ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormInput label="Account SID / Gateway ID" placeholder="ACxxxxxxxxxxxx" />
                <FormInput label="Authentication Token" placeholder="••••••••••••••••" type="password" isSecret />
                <FormInput label="Virtual Number (DID)" placeholder="+1 (542) 002-1920" />
                <FormInput label="API Key Secret" placeholder="••••••••••••••••" type="password" isSecret />
            </div>

            <button className="w-full h-18 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-4">
                <Globe size={20} /> Initialize Gateway Validation
            </button>
        </div>
    );
};

const AISettings = () => {
  return (
    <div className="space-y-12 relative z-10">
        <div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Intelligence.</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Manage AI Assistants and atmospheric model parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ToggleCard title="Lead Scoring" desc="Autonomous 0-100 evaluation of lead conversion potential." active />
            <ToggleCard title="Conversational Transcription" desc="High-authority speech-to-text with speaker separation." active />
            <ToggleCard title="Sentiment Velocity" desc="Real-time emotional tracking during live organizational calls." />
            <ToggleCard title="Cognitive Coaching" desc="Automated sales performance scorecards and tactical feedback." />
        </div>

        <div className="p-10 bg-[#0F172A] rounded-[40px] shadow-2xl space-y-8">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Model Deployment Registry</span>
              <span className="px-4 py-2 bg-blue-500 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest">GPT-4 Omni</span>
           </div>
           <div className="grid grid-cols-2 gap-8">
              <FormInput label="Neural API Key" placeholder="sk-proj-••••••" type="password" dark isSecret />
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Thermal Entropy (Temp)</label>
                 <div className="flex items-center gap-6">
                    <input type="range" className="flex-1 accent-blue-500" min="0" max="1" step="0.1" defaultValue="0.7" />
                    <span className="text-2xl font-black text-white italic">0.7</span>
                 </div>
              </div>
           </div>
        </div>
    </div>
  );
};

const BillingSettings = () => (
    <div className="space-y-12 relative z-10">
        <div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Fiscal Hub.</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Configure invoice generation and payment gateway protocols.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FormInput label="Invoice Identifier Prefix" placeholder="ADV-" />
            <FormInput label="Strategic Seq. Start" placeholder="10001" />
            <FormInput label="Standard Fiscal Tax (%)" placeholder="18" />
        </div>

        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Terms & Conditions</label>
            <textarea 
                className="w-full h-48 p-8 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A] leading-relaxed"
                placeholder="Payment is due within 30 days of issuance..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FormInput label="Bank Beneficiary Name" placeholder="AdvancedCRM Technologies LLP" />
            <FormInput label="SWIFT/IFSC Account Code" placeholder="HDFC0001234" />
        </div>
    </div>
);

const AdsSettings = () => {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: async () => {
      const res = await api.get('/auth/google/status');
      return res.data;
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.delete('/auth/google/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries(['googleStatus']);
      toast.success('Google Ads Protocol Disconnected.');
    },
    onError: () => toast.error('Termination Failed.')
  });

  const handleConnect = () => {
    // Redirect to backend auth route
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const fetchLeadsMutation = useMutation({
    mutationFn: () => api.get('/auth/google/fetch-leads'),
    onSuccess: (res) => {
      toast.success(`${res.data.inserted} leads imported from Google Ads!`);
      queryClient.invalidateQueries(['leads']);
    },
    onError: () => toast.error('Failed to synchronize leads.')
  });

  if (isLoading) return <PlaceholderSettings category="Google Ads" />;

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Ad Intelligence.</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Connect external marketing engines to the CRM core.</p>
        </div>
        {status?.connected && (
          <button 
            onClick={() => fetchLeadsMutation.mutate()}
            disabled={fetchLeadsMutation.isPending}
            className="h-14 px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3"
          >
            {fetchLeadsMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
            Fetch Google Leads
          </button>
        )}
      </div>

      <div className="p-12 bg-white border border-slate-100 rounded-[48px] shadow-sm space-y-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
          <Globe size={120} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Globe size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic">Google Ads Integration</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${status?.connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${status?.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {status?.connected ? 'Protocol Active' : 'Offline / Not Connected'}
                  </span>
                </div>
              </div>
            </div>
            
            {status?.connected && (
              <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <Mail size={16} className="text-slate-400" />
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{status.email}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest ml-auto">Verified Admin</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!status?.connected ? (
              <button 
                onClick={handleConnect}
                className="h-18 px-12 bg-[#0F172A] text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
              >
                Establish Connection <Plus size={20} />
              </button>
            ) : (
              <button 
                onClick={() => {
                  console.log('Attempting to disconnect Google...');
                  if (window.confirm('Are you sure you want to terminate the Google Ads protocol? This will stop all real-time ingestion.')) {
                    disconnectMutation.mutate();
                  }
                }}
                disabled={disconnectMutation.isPending}
                className="h-20 px-10 bg-rose-600 text-white rounded-[28px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:scale-105 transition-all flex items-center gap-4 relative z-50 cursor-pointer"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="whitespace-nowrap">Terminate Protocol</span>
                    <Trash2 size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-50">
              <CheckCircle2 className="text-emerald-500 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Real-time Lead Ingestion</p>
                 <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase italic">Sync GCLID and UTM data directly into the CRM core.</p>
              </div>
           </div>
           <div className="flex gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-50">
              <CheckCircle2 className="text-emerald-500 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Conversion Tracking</p>
                 <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase italic">Push offline conversions back to Google Ads for optimization.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-blue-600 p-10 rounded-[48px] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-20"><BrainCircuit size={100} /></div>
         <div className="relative z-10 space-y-4 max-w-lg">
            <h4 className="text-3xl font-black tracking-tighter uppercase italic italic">Neural Ad Optimization</h4>
            <p className="text-sm font-medium opacity-80 leading-relaxed uppercase tracking-widest">Leverage Cognitive Engine to analyze Google Ads keywords and automate lead score adjustments based on search intent.</p>
            <button className="h-14 px-8 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Launch AI Audit</button>
         </div>
      </div>
    </div>
  );
};

const PlaceholderSettings = ({ category }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 animate-pulse">
            <Database size={48} />
        </div>
        <div>
            <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter italic">Settings Loading...</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">{category} module Synchronization in progress.</p>
        </div>
    </div>
);

const FormInput = ({ label, placeholder, type = 'text', colSpan = '', dark = false, isSecret = false }) => {
    const [isVisible, setIsVisible] = useState(!isSecret);
    return (
        <div className={`space-y-4 ${colSpan}`}>
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
            <div className="relative group">
                <input 
                    type={isSecret ? (isVisible ? 'text' : 'password') : type} 
                    placeholder={placeholder} 
                    className={`w-full h-16 px-8 rounded-2xl outline-none focus:ring-[12px] transition-all font-bold text-sm ${
                        dark 
                        ? 'bg-white/5 border border-white/10 text-white focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-slate-50 border border-slate-100 text-[#0F172A] focus:ring-blue-500/5 focus:border-blue-600'
                    }`}
                />
                {isSecret && (
                    <button 
                        type="button" 
                        onClick={() => setIsVisible(!isVisible)}
                        className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-slate-500 hover:text-white' : 'text-slate-300 hover:text-blue-600'}`}
                    >
                        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const ToggleCard = ({ title, desc, active = false }) => (
    <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex items-start justify-between group hover:shadow-xl hover:border-blue-100 transition-all duration-700">
        <div className="space-y-2">
            <h4 className="text-lg font-black text-[#0F172A] tracking-tight">{title}</h4>
            <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[250px]">{desc}</p>
        </div>
        <button className={`w-14 h-7 rounded-full relative transition-all duration-500 ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <motion.div 
                animate={{ x: active ? 28 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
            />
        </button>
    </div>
);

export default AdminSettings;
