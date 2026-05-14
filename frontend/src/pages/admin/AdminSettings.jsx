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
  Loader2,
  Monitor,
  MapPin,
  Smartphone,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'COMPANY', label: 'Company Profile', icon: Building2 },
  { id: 'USERS', label: 'Team Members', icon: Users },
  { id: 'TELEPHONY', label: 'Phone Settings', icon: PhoneCall },
  { id: 'ADS', label: 'Ad Integration', icon: Globe },
  { id: 'WEBHOOKS', label: 'API & Webhooks', icon: Database },
  { id: 'Billing', label: 'Billing & Payments', icon: CreditCard },
  { id: 'AI', label: 'AI Features', icon: BrainCircuit },
  { id: 'STORAGE', label: 'File Storage', icon: HardDrive },
  { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
  { id: 'AUDIT', label: 'Activity Logs', icon: History },
  { id: 'PRIVACY', label: 'Data Privacy', icon: ShieldCheck },
  { id: 'SECURITY', label: 'Security & Sessions', icon: Lock },
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
      <aside className="w-full xl:w-96 flex flex-col gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
           <div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Settings</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Manage your company and platform configuration</p>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" placeholder="Search settings..." 
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

      <main className="flex-1 space-y-8">
         <AnimatePresence mode="wait">
            <motion.div 
               key={activeCategory}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="bg-white p-12 xl:p-16 rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden min-h-[800px]"
            >
               <DynamicContent category={activeCategory} />
            </motion.div>
         </AnimatePresence>

         {hasUnsavedChanges && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0F172A] p-6 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 z-[200]"
            >
               <div className="flex items-center gap-4 text-white">
                  <AlertTriangle className="text-amber-400" size={24} />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Unsaved Changes</p>
                    <p className="text-[10px] text-slate-400 font-bold">You have unsaved changes in this section.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setHasUnsavedChanges(false)} className="px-6 h-12 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Cancel</button>
                  <button className="px-8 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
                     <Save size={16} /> Save Changes
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
    case 'SECURITY': return <SecuritySettings />;
    default: return <div className="p-20 text-center text-slate-400">Section in development.</div>;
  }
};

const AuditLedger = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-12 relative z-10">
        <div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Activity Logs</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">A complete history of all changes and actions performed by your team.</p>
        </div>

        <div className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-800/50">
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Performed By</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                 </tr>
              </thead>
              <tbody className="text-white/80 font-mono text-xs">
                 {isLoading ? (
                   <tr><td colSpan="5" className="p-20 text-center animate-pulse">Loading Activity Logs...</td></tr>
                 ) : logs?.map((log, i) => (
                   <tr key={i} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-8 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-8 font-black text-blue-400">{log.user?.name || 'SYSTEM'}</td>
                      <td className="p-8 uppercase tracking-widest">{log.action}</td>
                      <td className="p-8 text-emerald-400/80">{log.target}</td>
                      <td className="p-8">
                         <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-black uppercase text-[9px]">Success</span>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
    </div>
  );
};

const SecuritySettings = () => {
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/auth/sessions');
      return res.data.data;
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => {
      refetch();
      toast.success('Security: Session Terminated.');
    },
    onError: () => toast.error('Termination Failed.')
  });

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Security & Sessions</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Manage your active sessions and security settings.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">E2E Encryption Active</span>
        </div>
      </div>

      {/* Password Management */}
      <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0F172A] shadow-sm">
              <Lock size={20} />
           </div>
           <div>
              <h4 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">Authentication Credentials</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last changed 3 months ago</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormInput label="Current Password" type="password" isSecret placeholder="••••••••••••" />
           <FormInput label="New Password" type="password" isSecret placeholder="••••••••••••" />
        </div>
        
        <button className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
          Update Security Settings
        </button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h4 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic">Active Sessions</h4>
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
             {sessions?.length || 0} Active Sessions
           </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {isLoading ? (
             <div className="h-40 flex items-center justify-center text-slate-400 animate-pulse uppercase font-black tracking-widest">Scanning Sessions...</div>
           ) : sessions?.map((session) => (
             <div key={session.id} className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all duration-500">
                      {session.userAgent?.includes('Mobile') ? <Smartphone size={24} /> : <Monitor size={24} />}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <h5 className="font-black text-[#0F172A] uppercase tracking-wider">{session.deviceName || 'Unknown Device'}</h5>
                         {session.token === (localStorage.getItem('token') || sessionStorage.getItem('token')) && (
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Current Session</span>
                         )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <div className="flex items-center gap-1"><MapPin size={12} /> {session.location || session.ipAddress}</div>
                         <div className="flex items-center gap-1"><History size={12} /> Last active: {new Date(session.lastUsedAt).toLocaleString()}</div>
                      </div>
                   </div>
                </div>
                
                {session.token !== (localStorage.getItem('token') || sessionStorage.getItem('token')) && (
                  <button 
                    onClick={() => revokeMutation.mutate(session.id)}
                    disabled={revokeMutation.isPending}
                    className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    title="Terminate Session"
                  >
                    {revokeMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                  </button>
                )}
             </div>
           ))}
        </div>
      </div>
      
      <div className="p-10 bg-blue-600 rounded-[48px] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={100} /></div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-3xl font-black tracking-tighter uppercase italic">Enterprise Security Shield</h4>
            <p className="text-sm font-medium opacity-80 leading-relaxed uppercase tracking-widest max-w-xl">
              Enable Two-Factor Authentication (2FA) and biometric verification to harden your account against unauthorized access.
            </p>
            <div className="flex gap-4">
               <button className="h-14 px-8 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Enable 2FA</button>
               <button className="h-14 px-8 bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all">IP Whitelisting</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const CompanySettings = () => {
    return (
        <div className="space-y-12 relative z-10">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Company Profile</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Manage your company branding, address, and local settings.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                    <input className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A]" placeholder="My Business Name" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax ID / GST Number</label>
                    <input className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A]" placeholder="Tax Registration Number" />
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
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Phone Settings</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Connect and configure your telephony and calling providers.</p>
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

            <button className="w-full h-18 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-4">
                <Globe size={20} /> Test Connection
            </button>
        </div>
    );
};

const AISettings = () => {
  return (
    <div className="space-y-12 relative z-10">
        <div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">AI Features</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Configure AI assistants and automation tools for your team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ToggleCard title="Lead Scoring" desc="Automatically grade leads based on their conversion potential." active />
            <ToggleCard title="Call Transcripts" desc="Record and transcribe calls into text automatically." active />
            <ToggleCard title="Sentiment Analysis" desc="Track customer emotions during sales calls in real-time." />
            <ToggleCard title="Sales Coaching" desc="Get automated feedback and tips for improving sales performance." />
        </div>

        <div className="p-10 bg-[#0F172A] rounded-[40px] shadow-2xl space-y-8">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Model Settings</span>
              <span className="px-4 py-2 bg-blue-500 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest">Gemini Pro</span>
           </div>
           <div className="grid grid-cols-2 gap-8">
              <FormInput label="Gemini API Key" placeholder="AIzaSy..." type="password" dark isSecret />
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AI Creativity (Temperature)</label>
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
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Billing & Tax</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Manage your invoice settings and tax information.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FormInput label="Invoice Prefix" placeholder="INV-" />
            <FormInput label="Starting Number" placeholder="1001" />
            <FormInput label="Tax Percentage (%)" placeholder="18" />
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
      toast.success('Google Ads Integration Disconnected.');
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
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Ad Integration</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Connect your Google Ads account to sync leads automatically.</p>
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
                    {status?.connected ? 'Integration Active' : 'Offline / Not Connected'}
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
                Connect Account <Plus size={20} />
              </button>
            ) : (
              <button 
                onClick={() => {
                  console.log('Attempting to disconnect Google...');
                  if (window.confirm('Are you sure you want to disconnect the Google Ads integration? This will stop all real-time import.')) {
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
                    <span className="whitespace-nowrap">Disconnect Integration</span>
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
                 <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Real-time Lead Import</p>
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
            <h4 className="text-3xl font-black tracking-tighter uppercase italic italic">AI Ad Optimization</h4>
            <p className="text-sm font-medium opacity-80 leading-relaxed uppercase tracking-widest">Leverage our AI Engine to analyze Google Ads keywords and automate lead score adjustments based on search intent.</p>
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
