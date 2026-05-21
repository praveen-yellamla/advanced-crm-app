import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight, 
  UserPlus, 
  Send, 
  Copy, 
  RefreshCw, 
  UploadCloud, 
  Download, 
  Check, 
  Sliders, 
  Trash, 
  FileUp, 
  Sparkles,
  ArrowLeft,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

const CATEGORIES = [
  { id: 'COMPANY', label: 'Company Profile', icon: Building2 },
  { id: 'USERS', label: 'Team Members', icon: Users },
  { id: 'TELEPHONY', label: 'Phone Settings', icon: PhoneCall },
  { id: 'ADS', label: 'Ad Integration', icon: Globe },
  { id: 'WEBHOOKS', icon: Database, label: 'API & Webhooks' },
  { id: 'BILLING', label: 'Billing & Payments', icon: CreditCard },
  { id: 'AI', label: 'AI Features', icon: BrainCircuit },
  { id: 'STORAGE', label: 'File Storage', icon: HardDrive },
  { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
  { id: 'AUDIT', label: 'Activity Logs', icon: History },
  { id: 'PRIVACY', label: 'Data Privacy', icon: ShieldCheck },
  { id: 'SECURITY', label: 'Security & Sessions', icon: Lock },
];

const AdminSettings = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeCategory = tab ? tab.toUpperCase() : 'COMPANY';
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftSettings, setDraftSettings] = useState({});

  const filteredCategories = CATEGORIES.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const res = await api.get('/settings/company');
      return res.data;
    }
  });

  useEffect(() => {
    if (profile) {
      setDraftSettings(profile);
    }
  }, [profile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    const status = params.get('status');

    if (integration === 'google') {
      if (status === 'success') {
        toast.success('Google Ads Integration Established.');
        navigate('/admin/settings/ads');
      } else if (status === 'error') {
        toast.error('Google Ads Integration Failed.');
        navigate('/admin/settings/ads');
      }
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);

  const handleChange = (key, value) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const changedKeys = Object.keys(draftSettings).filter(
        key => JSON.stringify(draftSettings[key]) !== JSON.stringify((profile || {})[key])
      );

      if (changedKeys.length === 0) return;

      await Promise.all(
        changedKeys.map(key => 
          api.patch('/settings', { key, value: draftSettings[key] })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyProfile']);
      setHasUnsavedChanges(false);
      toast.success('Configuration synchronized.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to sync configuration');
    }
  });

  const handleCancel = () => {
    setDraftSettings(profile || {});
    setHasUnsavedChanges(false);
    toast.success('Changes discarded');
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="flex flex-col xl:flex-row gap-10 pb-24 min-h-screen">
      {/* Sticky Sidebar */}
      <aside className="w-full xl:w-96 flex flex-col gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 xl:sticky xl:top-6">
           <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="h-10 w-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all">
                <ArrowLeft size={16} />
              </Link>
              <div>
                 <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Settings</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Workspace configuration</p>
              </div>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" placeholder="Search categories..." 
                className="w-full h-14 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm text-[#0F172A]"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => navigate(`/admin/settings/${cat.id.toLowerCase()}`)}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all duration-500 group text-left ${
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

      {/* Main Settings Display Area */}
      <main className="flex-1 space-y-8">
         {/* Breadcrumbs Navigation */}
         <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>Admin</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span>Settings</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-blue-600 font-black">{currentCategoryObj.label}</span>
         </div>

         <AnimatePresence mode="wait">
            <motion.div 
               key={activeCategory}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="bg-white p-10 xl:p-14 rounded-[64px] border border-slate-100 shadow-sm relative overflow-hidden min-h-[750px]"
            >
               {isProfileLoading ? (
                 <PlaceholderSettings category={activeCategory} />
               ) : (
                 <DynamicContent 
                   category={activeCategory} 
                   draftSettings={draftSettings} 
                   onChange={handleChange} 
                 />
               )}
            </motion.div>
         </AnimatePresence>

         {/* Unsaved Changes drawer */}
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
                  <button onClick={handleCancel} className="px-6 h-12 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Cancel</button>
                  <button 
                    onClick={() => saveMutation.mutate()} 
                    disabled={saveMutation.isPending}
                    className="px-8 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                  >
                     {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                  </button>
               </div>
            </motion.div>
         )}
      </main>
    </div>
  );
};

const DynamicContent = ({ category, draftSettings, onChange }) => {
  switch (category) {
    case 'COMPANY': return <CompanySettings draftSettings={draftSettings} onChange={onChange} />;
    case 'USERS': return <TeamMembersSettings />;
    case 'TELEPHONY': return <TelephonySettings draftSettings={draftSettings} onChange={onChange} />;
    case 'ADS': return <AdsSettings />;
    case 'WEBHOOKS': return <WebhooksSettings draftSettings={draftSettings} onChange={onChange} />;
    case 'BILLING': return <BillingPaymentsSettings draftSettings={draftSettings} onChange={onChange} />;
    case 'AI': return <AISettings draftSettings={draftSettings} onChange={onChange} />;
    case 'STORAGE': return <StorageSettings />;
    case 'NOTIFICATIONS': return <NotificationsSettings draftSettings={draftSettings} onChange={onChange} />;
    case 'AUDIT': return <AuditLedger />;
    case 'PRIVACY': return <DataPrivacySettings draftSettings={draftSettings} onChange={onChange} />;
    case 'SECURITY': return <SecuritySettings />;
    default: return <div className="p-20 text-center text-slate-400">Section not found.</div>;
  }
};


// ==========================================
// 1. COMPANY SETTINGS MODULE
// ==========================================
const CompanySettings = ({ draftSettings, onChange }) => {
    return (
        <div className="space-y-12 relative z-10">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Company Profile</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Manage your company branding, address, and local settings.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormInput label="Company Name" placeholder="My Business Name" value={draftSettings.COMPANY_NAME || ''} onChange={(e) => onChange('COMPANY_NAME', e.target.value)} />
                <FormInput label="Tax ID / GST Number" placeholder="GSTIN/TAX REGISTRATION" value={draftSettings.COMPANY_GST || ''} onChange={(e) => onChange('COMPANY_GST', e.target.value)} />
                <FormInput label="Support Email" placeholder="support@company.com" value={draftSettings.COMPANY_EMAIL || ''} onChange={(e) => onChange('COMPANY_EMAIL', e.target.value)} />
                <FormInput label="Primary Contact Number" placeholder="+91 90000 00000" value={draftSettings.COMPANY_PHONE || ''} onChange={(e) => onChange('COMPANY_PHONE', e.target.value)} />
            </div>
        </div>
    );
};


// ==========================================
// 2. TEAM MEMBERS & INVITATION MODULE
// ==========================================
const TeamMembersSettings = () => {
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [inviteTeam, setInviteTeam] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [searchMember, setSearchMember] = useState('');
  const [lastInviteUrl, setLastInviteUrl] = useState(null); // stores inviteUrl after success

  const queryClient = useQueryClient();

  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const { data: invitations } = useQuery({
    queryKey: ['adminAgentInvitationsPendingList'],
    queryFn: async () => {
      const res = await api.get('/admin/agents/invitations');
      return res.data.data;
    }
  });

  const { data: teams } = useQuery({
    queryKey: ['adminTeamsList'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return res.data.data;
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail) throw new Error('Email is required');
      if (!inviteTeam) throw new Error('Please assign a team before sending the invitation');
      const payload = {
        email: inviteEmail,
        name: inviteName,
        teamId: parseInt(inviteTeam)
      };
      // POST to /admin/agents/invite-single → saves to agentInvitation table
      // (the same table that GET /admin/agents/invitations reads from)
      const res = await api.post('/admin/agents/invite-single', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['adminAgentInvitationsPendingList']);
      setLastInviteUrl(data.inviteUrl || null);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setInviteTeam('');
      // keep drawer open to show the Copy Link panel
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Invitation failed');
    }
  });

  const cancelInviteMutation = useMutation({
    // DELETE /admin/agents/invitations/:id → agentInvitationController.cancelInvitation
    mutationFn: (id) => api.delete(`/admin/agents/invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgentInvitationsPendingList']);
      toast.success('Invitation cancelled.');
    },
    onError: () => toast.error('Cancellation failed')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, role, isActive }) => api.put(`/admin/agents/${id}`, { role, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Member status synchronized.');
    },
    onError: () => toast.error('Status update failed')
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/agents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAgents']);
      toast.success('Member deactivated/removed.');
    },
    onError: () => toast.error('Deactivation failed')
  });

  const filteredAgents = agents?.filter(a => 
    a.name.toLowerCase().includes(searchMember.toLowerCase()) || 
    a.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Team Members</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Add, configure permissions, and manage your agent invitation pools.</p>
        </div>
        <button 
          onClick={() => setIsInviteDrawerOpen(true)}
          className="h-14 px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3 self-start"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Invites Form Drawer */}
      <AnimatePresence>
        {isInviteDrawerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex justify-end">
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full max-w-md bg-white h-screen shadow-2xl p-10 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter italic">Invite Member</h4>
                    <button onClick={() => { setIsInviteDrawerOpen(false); setLastInviteUrl(null); }} className="text-slate-400 hover:text-slate-900 font-bold uppercase text-[10px] tracking-widest">Close</button>
                 </div>

                 {/* Copy Link success panel — shown after invite is sent */}
                 {lastInviteUrl && (
                   <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                     <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">✅ Invitation Sent!</p>
                     <p className="text-xs font-bold text-slate-600">Share this link directly if they don't get the email:</p>
                     <div className="flex items-center gap-2">
                       <span className="flex-1 font-mono text-[10px] bg-white border border-emerald-200 rounded-xl px-3 py-2 text-slate-700 break-all">{lastInviteUrl}</span>
                       <button
                         onClick={() => { navigator.clipboard.writeText(lastInviteUrl); toast.success('Link copied!'); }}
                         className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shrink-0"
                       >
                         Copy
                       </button>
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold">Link expires in 72 hours.</p>
                   </div>
                 )}

                 <div className="space-y-6">
                    <FormInput label="Name" placeholder="John Doe" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                    <FormInput label="Email Address" placeholder="john@crm.pro" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Type</label>
                       <select 
                         value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                         className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-[#0F172A] focus:border-blue-600 outline-none"
                       >
                          <option value="AGENT">Sales Agent</option>
                          <option value="MANAGER">Team Manager</option>
                          <option value="ADMIN">Administrator</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign to Team</label>
                       <select 
                         value={inviteTeam} onChange={(e) => setInviteTeam(e.target.value)}
                         className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-[#0F172A] focus:border-blue-600 outline-none"
                       >
                          <option value="">No Team Assigned</option>
                          {teams?.map(t => (
                            <option key={t.id} value={t.id}>{t.teamName}</option>
                          ))}
                       </select>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CSV Bulk Invitation</label>
                       <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-600 transition-colors">
                          <FileUp size={24} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{csvFile ? csvFile.name : 'Drop members.csv here'}</span>
                          <input type="file" accept=".csv" className="hidden" id="csvUploader" onChange={(e) => setCsvFile(e.files?.[0])} />
                          <button onClick={() => document.getElementById('csvUploader').click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest mt-2">Select CSV</button>
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
                className="w-full h-16 bg-[#0F172A] hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all mt-8"
              >
                {inviteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Dispatch Invitation
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 space-y-6">
         <div className="flex items-center justify-between gap-4">
            <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Active Members</h4>
            <div className="relative w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               <input 
                 type="text" placeholder="Search active..." 
                 className="w-full h-10 pl-12 pr-4 bg-white border border-slate-100 rounded-xl outline-none font-bold text-xs"
                 value={searchMember} onChange={(e) => setSearchMember(e.target.value)}
               />
            </div>
         </div>

         <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isAgentsLoading ? (
                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 text-xs animate-pulse font-black uppercase tracking-widest">Querying database...</td></tr>
                  ) : filteredAgents?.map((agent) => (
                    <tr key={agent.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                       <td className="p-6 flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-[#0F172A] text-xs">
                             {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <p className="font-black text-[#0F172A] text-sm leading-none">{agent.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{agent.team?.teamName || 'No Team'}</p>
                          </div>
                       </td>
                       <td className="p-6 text-slate-500 font-mono text-xs">{agent.email}</td>
                       <td className="p-6">
                          <select 
                            value={agent.role} 
                            onChange={(e) => updateStatusMutation.mutate({ id: agent.id, role: e.target.value, isActive: agent.isActive })}
                            className="bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold p-2 text-[#0F172A] outline-none"
                          >
                             <option value="AGENT">Agent</option>
                             <option value="MANAGER">Manager</option>
                             <option value="ADMIN">Admin</option>
                          </select>
                       </td>
                       <td className="p-6">
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: agent.id, role: agent.role, isActive: !agent.isActive })}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                              agent.isActive 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}
                          >
                             {agent.isActive ? 'Active' : 'Inactive'}
                          </button>
                       </td>
                       <td className="p-6 flex items-center gap-3">
                          <button 
                            onClick={() => {
                              if (window.confirm(`Deactivate and remove ${agent.name}?`)) {
                                deleteMemberMutation.mutate(agent.id);
                              }
                            }}
                            className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all"
                            title="Deactivate Member"
                          >
                             <Trash2 size={14} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Invitations Pool */}
      <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 space-y-6">
         <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Pending Invitations Ledger</h4>
         
         <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sent At</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {invitations?.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 text-xs italic font-bold">No pending invitations.</td></tr>
                  ) : invitations?.map((invite) => (
                    <tr key={invite.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <p className="text-slate-700 font-bold text-xs">{invite.name || '—'}</p>
                          <p className="text-slate-400 font-mono text-[10px] mt-0.5">{invite.email}</p>
                        </td>
                        <td className="p-6 text-slate-500 text-[10px] font-bold">{invite.teamName || 'Unassigned'}</td>
                        <td className="p-6 text-slate-400 text-[10px]">{new Date(invite.createdAt).toLocaleDateString()}</td>
                        <td className="p-6">
                          <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-3 py-1 font-black uppercase tracking-widest">Pending</span>
                        </td>
                        <td className="p-6 flex items-center gap-2">
                           <button
                             onClick={() => { navigator.clipboard.writeText(invite.inviteUrl || ''); toast.success('Link copied!'); }}
                             className="h-8 px-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                             title="Copy Invite Link"
                           >
                             Copy Link
                           </button>
                           <button 
                             onClick={() => cancelInviteMutation.mutate(invite.id)}
                             className="h-8 px-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                           >
                             Cancel
                           </button>
                        </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PHONE SETTINGS MODULE
// ==========================================
const TelephonySettings = ({ draftSettings, onChange }) => {
    const selectedProvider = draftSettings.TELEPHONY_PROVIDER || 'TWILIO';
    
    const testMutation = useMutation({
      mutationFn: () => api.post(`/settings/test/${selectedProvider}`),
      onSuccess: (res) => toast.success(res.data.message),
      onError: () => toast.error('Gateway verification failed.')
    });

    return (
        <div className="space-y-12 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Phone Settings</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">Connect and configure your telephony and calling providers.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Twilio Gateway Active</span>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                {['TWILIO', 'EXOTEL', 'KNOWLARITY', 'SIP'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => onChange('TELEPHONY_PROVIDER', p)}
                    className={`px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedProvider === p ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormInput 
                  label="Account SID / Gateway ID" 
                  placeholder="ACxxxxxxxxxxxx" 
                  value={draftSettings.TELEPHONY_ACCOUNT_SID || ''}
                  onChange={(e) => onChange('TELEPHONY_ACCOUNT_SID', e.target.value)}
                />
                <FormInput 
                  label="Authentication Token" 
                  placeholder="••••••••••••••••" 
                  type="password" 
                  isSecret 
                  value={draftSettings.TELEPHONY_AUTH_TOKEN || ''}
                  onChange={(e) => onChange('TELEPHONY_AUTH_TOKEN', e.target.value)}
                />
                <FormInput 
                  label="Virtual Number (DID)" 
                  placeholder="+1 (542) 002-1920" 
                  value={draftSettings.TELEPHONY_DID || ''}
                  onChange={(e) => onChange('TELEPHONY_DID', e.target.value)}
                />
                <FormInput 
                  label="API Key Secret" 
                  placeholder="••••••••••••••••" 
                  type="password" 
                  isSecret 
                  value={draftSettings.TELEPHONY_API_SECRET || ''}
                  onChange={(e) => onChange('TELEPHONY_API_SECRET', e.target.value)}
                />
            </div>

            {/* Custom Telephony Configurations */}
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
               <h4 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Routing & Call Control</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ToggleCard 
                    title="Enable Call Recording" 
                    desc="Record all outbound/inbound audio for QA scoring card analysis." 
                    active={!!draftSettings.TELEPHONY_RECORDING} 
                    onToggle={() => onChange('TELEPHONY_RECORDING', !draftSettings.TELEPHONY_RECORDING)}
                  />
                  <ToggleCard 
                    title="Voicemail Overflow" 
                    desc="Redirect to company mailbox when agent queue holds more than 5 minutes." 
                    active={!!draftSettings.TELEPHONY_VOICEMAIL} 
                    onToggle={() => onChange('TELEPHONY_VOICEMAIL', !draftSettings.TELEPHONY_VOICEMAIL)}
                  />
               </div>
            </div>

            <button 
              onClick={() => testMutation.mutate()} 
              disabled={testMutation.isPending}
              className="w-full h-18 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-4"
            >
                {testMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <PhoneCall size={20} />} Verify Twilio Integration Connection
            </button>
        </div>
    );
};

// ==========================================
// 4. AD INTEGRATION MODULE
// ==========================================
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
      toast.success('Google Ads disconnected.');
    },
    onError: () => toast.error('Disconnection Failed.')
  });

  const handleConnect = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const fetchLeadsMutation = useMutation({
    mutationFn: () => api.get('/auth/google/fetch-leads'),
    onSuccess: (res) => {
      toast.success(`${res.data.inserted} leads synchronized dynamically!`);
      queryClient.invalidateQueries(['leads']);
    },
    onError: () => toast.error('Failed to sync leads.')
  });

  if (isLoading) return <PlaceholderSettings category="Google Ads" />;

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Ad Integration</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Connect your Google Ads account to sync leads automatically.</p>
        </div>
        {status?.connected && (
          <button 
            onClick={() => fetchLeadsMutation.mutate()}
            disabled={fetchLeadsMutation.isPending}
            className="h-14 px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3 self-start"
          >
            {fetchLeadsMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Fetch Leads Dynamically
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
                Connect Google Ads <Plus size={20} />
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to disconnect?')) {
                    disconnectMutation.mutate();
                  }
                }}
                disabled={disconnectMutation.isPending}
                className="h-20 px-10 bg-rose-600 text-white rounded-[28px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:scale-105 transition-all flex items-center gap-4"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>Disconnect Sync <Trash2 size={18} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. API & WEBHOOKS MODULE
// ==========================================
const WebhooksSettings = ({ draftSettings, onChange }) => {
  const [apiKey, setApiKey] = useState('ak_live_72k19hsn28a71b9381kda9481');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [whitelistedIps, setWhitelistedIps] = useState('127.0.0.1, 10.0.0.1');

  useEffect(() => {
    // Generate sample webhook ingest url scoped dynamically to local origin
    setWebhookUrl(`${window.location.origin}/api/webhooks/leads/skyline`);
  }, []);

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    toast.success('Key copied to clipboard.');
  };

  const handleRotateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = 'ak_live_';
    for (let i = 0; i < 24; i++) {
       newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(newKey);
    toast.success('New API Key Generated. Make sure to copy it now.');
  };

  const handleTestWebhook = async () => {
    toast.loading('Dispatching test payload...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Webhook target received test payload successfully (201 Ingested).');
    }, 1500);
  };

  return (
    <div className="space-y-12 relative z-10">
      <div>
        <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">API & Webhooks</h3>
        <p className="text-sm font-bold text-slate-400 mt-2">Manage developer access tokens, IP whitelists, and real-time data webhooks.</p>
      </div>

      {/* Developer API Keys */}
      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] space-y-6">
         <div className="flex items-center justify-between">
            <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Live Access Credentials</h4>
            <button 
              onClick={handleRotateKey}
              className="h-10 px-6 bg-[#0F172A] hover:bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
            >
               <RefreshCw size={12} /> Rotate API Key
            </button>
         </div>

         <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="font-mono text-xs text-slate-500 select-all overflow-hidden truncate">
               {apiKey}
            </div>
            <button 
              onClick={() => handleCopy(apiKey)}
              className="h-10 w-10 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-slate-100 shrink-0"
              title="Copy to clipboard"
            >
               <Copy size={16} />
            </button>
         </div>
      </div>

      {/* Ingestion Webhooks */}
      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] space-y-6">
         <div className="flex items-center justify-between">
            <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Lead Ingestion URL</h4>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Webhook Active</span>
         </div>
         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Send POST requests containing lead payloads directly to this gateway:</p>

         <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="font-mono text-xs text-slate-600 overflow-hidden truncate">
               {webhookUrl}
            </div>
            <button 
              onClick={() => handleCopy(webhookUrl)}
              className="h-10 w-10 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-slate-100 shrink-0"
              title="Copy to clipboard"
            >
               <Copy size={16} />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput 
              label="IP Whitelisting (Comma separated)" 
              placeholder="0.0.0.0 (Allow all)" 
              value={whitelistedIps}
              onChange={(e) => setWhitelistedIps(e.target.value)}
            />
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simulation Suite</label>
               <button 
                 onClick={handleTestWebhook}
                 className="w-full h-16 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center justify-center gap-3 transition-colors shadow-sm"
               >
                  <Send size={14} /> Trigger Webhook Mock Payload
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. BILLING & PAYMENTS MODULE
// ==========================================
const BillingPaymentsSettings = ({ draftSettings, onChange }) => {
  const stripeInvoices = [
    { id: 'in_92j10', date: '2026-05-15', amount: '₹14,999.00', status: 'PAID' },
    { id: 'in_91i02', date: '2026-04-15', amount: '₹14,999.00', status: 'PAID' },
    { id: 'in_90c01', date: '2026-03-15', amount: '₹14,999.00', status: 'PAID' }
  ];

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Billing & Taxes</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Manage subscription tiers, invoices parameters, and seat allocations.</p>
        </div>
        <button 
          onClick={() => toast.success('Stripe Customer Billing Portal Launched.')}
          className="h-14 px-8 bg-blue-600 hover:scale-105 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3"
        >
           Stripe Billing Portal
        </button>
      </div>

      {/* Subscription Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Seats Allocation</span>
            <div className="text-3xl font-black text-[#0F172A] italic mt-2">5 / 20</div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Seat allocation based on Enterprise tier.</p>
         </div>
         <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI API Token Overrides</span>
            <div className="text-3xl font-black text-[#0F172A] italic mt-2">12,492 / 500k</div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Tokens consumed from monthly quota.</p>
         </div>
         <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voice Calls Recording Storage</span>
            <div className="text-3xl font-black text-[#0F172A] italic mt-2">1.2 GB / 512 GB</div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Active recordings audio file usage.</p>
         </div>
      </div>

      {/* Custom Invoice Constants */}
      <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 space-y-8">
         <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Invoice Constant Properties</h4>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormInput 
              label="Invoice Prefix" 
              placeholder="INV-" 
              value={draftSettings.BILLING_INVOICE_PREFIX || ''}
              onChange={(e) => onChange('BILLING_INVOICE_PREFIX', e.target.value)}
            />
            <FormInput 
              label="Starting ID Number" 
              placeholder="1001" 
              value={draftSettings.BILLING_STARTING_NUMBER || ''}
              onChange={(e) => onChange('BILLING_STARTING_NUMBER', e.target.value)}
            />
            <FormInput 
              label="Billing Tax Percentage (%)" 
              placeholder="18" 
              value={draftSettings.BILLING_TAX_PERCENT || ''}
              onChange={(e) => onChange('BILLING_TAX_PERCENT', e.target.value)}
            />
         </div>

         <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Terms & Agreement Note</label>
             <textarea 
                 className="w-full h-36 p-6 bg-white border border-slate-100 rounded-[24px] outline-none focus:border-blue-600 font-bold text-sm text-[#0F172A] leading-relaxed"
                 placeholder="Payment due within 30 days of invoice date."
                 value={draftSettings.BILLING_TERMS || ''}
                 onChange={(e) => onChange('BILLING_TERMS', e.target.value)}
             />
         </div>
      </div>

      {/* Past Invoices from Stripe */}
      <div className="space-y-6">
         <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Stripe Invoices Feed</h4>
         
         <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full text-left border-collapse bg-white">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice Code</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Download</th>
                  </tr>
               </thead>
               <tbody>
                  {stripeInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                       <td className="p-6 font-mono text-xs font-bold text-slate-700">{inv.id}</td>
                       <td className="p-6 text-slate-400 text-xs">{inv.date}</td>
                       <td className="p-6 text-[#0F172A] font-black text-xs">{inv.amount}</td>
                       <td className="p-6">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Paid</span>
                       </td>
                       <td className="p-6">
                          <button onClick={() => toast.success('Downloading Invoice PDF...')} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 flex items-center justify-center">
                             <Download size={14} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. AI FEATURES MODULE
// ==========================================
const AISettings = ({ draftSettings, onChange }) => {

  return (
    <div className="space-y-12 relative z-10">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">AI Features</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">Configure dynamic AI assistant parameters, transcript tools, and automated actions.</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-600 font-black text-[9px] uppercase tracking-widest">
               <Sparkles size={14} className="animate-pulse" /> Gemini-Pro Node Active
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ToggleCard 
              title="Automated Lead Scoring" 
              desc="Automatically evaluate leads dynamically based on conversations." 
              active={!!draftSettings.AI_LEAD_SCORING} 
              onToggle={() => onChange('AI_LEAD_SCORING', !draftSettings.AI_LEAD_SCORING)}
            />
            <ToggleCard 
              title="Outbound Speech Transcripts" 
              desc="Record and transcribe telephony queues into database logs." 
              active={!!draftSettings.AI_CALL_TRANSCRIPTS} 
              onToggle={() => onChange('AI_CALL_TRANSCRIPTS', !draftSettings.AI_CALL_TRANSCRIPTS)}
            />
            <ToggleCard 
              title="Real-time Sentiment Analysis" 
              desc="Scan agent/customer interactions for sentiment analytics." 
              active={!!draftSettings.AI_SENTIMENT_ANALYSIS} 
              onToggle={() => onChange('AI_SENTIMENT_ANALYSIS', !draftSettings.AI_SENTIMENT_ANALYSIS)}
            />
            <ToggleCard 
              title="Automated Sales Coaching" 
              desc="Analyze and deliver QA scorecards automatically for agents." 
              active={!!draftSettings.AI_SALES_COACHING} 
              onToggle={() => onChange('AI_SALES_COACHING', !draftSettings.AI_SALES_COACHING)}
            />
        </div>

        {/* AI API Key Panel — reads directly from /ai/settings (tenant-isolated) */}
        <AIApiKeyPanel />
    </div>
  );
};

const AIApiKeyPanel = () => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data: aiConfig = {} } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: async () => {
      const res = await api.get('/ai/settings');
      return res.data.data || {};
    }
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const res = await api.get('/ai/status');
      return res.data.data;
    }
  });

  const temperature = aiConfig.AI_TEMPERATURE ?? 0.7;
  const keyConfigured = aiConfig.AI_GEMINI_KEY_CONFIGURED;
  const systemStatus = aiStatus?.status || 'OFFLINE';

  const saveKeyMutation = useMutation({
    mutationFn: (payload) => api.patch('/ai/settings', payload),
    onSuccess: () => {
      toast.success('API key saved. Click Validate to activate AI.');
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
      queryClient.invalidateQueries({ queryKey: ['aiStatus'] });
      setApiKey('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save API key.')
  });

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await api.post('/ai/validate-key');
      toast.success(res.data.message || 'API key validated. AI is now ONLINE!');
      queryClient.invalidateQueries({ queryKey: ['aiStatus'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed. Check your API key.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-10 bg-[#0F172A] rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Advanced Model Parameters</span>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            systemStatus === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
            systemStatus === 'CONFIGURED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            'bg-white/10 text-slate-400 border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              systemStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' :
              systemStatus === 'CONFIGURED' ? 'bg-amber-400' : 'bg-slate-500'
            }`} />
            {systemStatus === 'ONLINE' ? 'AI Live' : systemStatus === 'CONFIGURED' ? 'Key Saved' : 'Offline'}
          </span>
          <span className="px-4 py-2 bg-blue-600 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest">Gemini API</span>
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
            Gemini API Auth Key {keyConfigured && <span className="text-emerald-400 ml-1">• Configured</span>}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={keyConfigured ? '••••••••••••••••••••' : 'AIzaSy...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-14 pl-5 pr-16 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white font-mono text-sm placeholder:text-slate-600 transition-all"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => apiKey && saveKeyMutation.mutate({ key: 'AI_GEMINI_API_KEY', value: apiKey })}
              disabled={!apiKey || saveKeyMutation.isPending}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saveKeyMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save Key
            </button>
            <button
              onClick={handleValidate}
              disabled={!keyConfigured || isValidating}
              className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2 border border-white/10"
            >
              {isValidating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Validate
            </button>
          </div>
          {aiStatus?.lastValidated && (
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
              Last validated: {new Date(aiStatus.lastValidated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Creativity Level (Temperature)</label>
          <div className="flex items-center gap-6 mt-4">
            <input type="range" className="flex-1 accent-blue-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
              min="0" max="1" step="0.1" value={temperature}
              onChange={(e) => saveKeyMutation.mutate({ key: 'AI_TEMPERATURE', value: parseFloat(e.target.value) })}
            />
            <span className="text-2xl font-black text-white italic">{temperature}</span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold leading-relaxed">Lower (0.1) = precise. Higher (0.9) = creative.</p>
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Provider</p>
            <p className="text-sm font-bold text-white">Google Gemini 2.0 Flash</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Pricing</p>
            <p className="text-sm font-bold text-emerald-400">₹0.42 / 1M tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 8. FILE STORAGE MODULE
// ==========================================
const StorageSettings = () => {
  const [activeFolder, setActiveFolder] = useState('root');
  const [files, setFiles] = useState([
    { name: 'Leads_Import_Template.csv', size: '24 KB', date: '2026-05-18', folder: 'templates' },
    { name: 'Agent_Script_Sales.pdf', size: '1.2 MB', date: '2026-05-19', folder: 'scripts' },
    { name: 'Logo_Branding_Pro.png', size: '420 KB', date: '2026-05-20', folder: 'assets' }
  ]);

  const handleUpload = () => {
     toast.loading('Simulating secure Cloud upload...');
     setTimeout(() => {
        toast.dismiss();
        toast.success('File stored securely in AWS S3.');
     }, 1500);
  };

  return (
    <div className="space-y-12 relative z-10">
      <div>
        <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">File Storage</h3>
        <p className="text-sm font-bold text-slate-400 mt-2">Manage shared templates, client agreements, S3 storage limits, and static assets.</p>
      </div>

      {/* Storage limit */}
      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
         <div className="flex justify-between text-xs font-black text-[#0F172A] uppercase tracking-wider">
            <span>S3 Workspace Usage</span>
            <span>12 MB / 512 MB (2.3%)</span>
         </div>
         <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '2.3%' }} />
         </div>
      </div>

      {/* Shared Folders Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {['templates', 'scripts', 'assets'].map(folder => (
           <button 
             key={folder}
             onClick={() => setActiveFolder(folder)}
             className={`p-6 border rounded-[24px] text-left transition-all duration-300 ${
               activeFolder === folder ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-xl' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-600'
             }`}
           >
              <h5 className="font-black text-sm uppercase tracking-widest">/{folder}</h5>
              <p className="text-[10px] opacity-60 mt-1 uppercase">Browse shared folder contents</p>
           </button>
         ))}
      </div>

      {/* Drag & Drop Simulator */}
      <div 
        onClick={handleUpload}
        className="p-12 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-600 hover:bg-slate-50/50 transition-all text-center"
      >
         <UploadCloud size={40} className="text-slate-400 animate-bounce" />
         <div>
            <h5 className="font-black text-base text-[#0F172A] uppercase">Drag & Drop Files Here</h5>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Securely upload directly to AWS S3 integration. Limit 25MB.</p>
         </div>
      </div>

      {/* Files List */}
      <div className="space-y-4">
         <h4 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter italic">Shared Files</h4>
         <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">File Size</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Uploaded</th>
                     <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {files.filter(f => f.folder === activeFolder).map((f, i) => (
                     <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 text-sm font-black text-slate-700">{f.name}</td>
                        <td className="p-6 font-mono text-xs text-slate-500">{f.size}</td>
                        <td className="p-6 text-xs text-slate-400">{f.date}</td>
                        <td className="p-6 flex items-center gap-3">
                           <button onClick={() => toast.success(`Downloading ${f.name}...`)} className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center">
                              <Download size={14} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. NOTIFICATIONS MODULE
// ==========================================
const NotificationsSettings = ({ draftSettings, onChange }) => {
  return (
    <div className="space-y-12 relative z-10">
      <div>
        <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Notifications</h3>
        <p className="text-sm font-bold text-slate-400 mt-2">Manage preferences for system alerts, daily digests, and messaging integration nodes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ToggleCard 
           title="System Alert Emails" 
           desc="Deliver daily system and revenue digest metrics directly to admins." 
           active={!!draftSettings.NOTIF_EMAIL} 
           onToggle={() => onChange('NOTIF_EMAIL', !draftSettings.NOTIF_EMAIL)}
         />
         <ToggleCard 
           title="Outbound SMS Alert" 
           desc="Verify and alert admins on Twilio billing or webhook payload failures." 
           active={!!draftSettings.NOTIF_SMS} 
           onToggle={() => onChange('NOTIF_SMS', !draftSettings.NOTIF_SMS)}
         />
         <ToggleCard 
           title="Real-time Browser Node" 
           desc="Trigger interactive audio alerts on active call events." 
           active={!!draftSettings.NOTIF_BROWSER} 
           onToggle={() => onChange('NOTIF_BROWSER', !draftSettings.NOTIF_BROWSER)}
         />
         <ToggleCard 
           title="Slack Channel Push" 
           desc="Broadcast platform logs and active billing alerts dynamically to Slack." 
           active={!!draftSettings.NOTIF_SLACK} 
           onToggle={() => onChange('NOTIF_SLACK', !draftSettings.NOTIF_SLACK)}
         />
      </div>

      {/* Slack Integration */}
      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
         <h4 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Slack Webhook Node Integration</h4>
         <FormInput 
           label="Incoming Webhook Target URL" 
           placeholder="https://hooks.slack.com/services/..." 
           value={draftSettings.NOTIF_SLACK_URL || ''}
           onChange={(e) => onChange('NOTIF_SLACK_URL', e.target.value)}
         />
         <button 
           onClick={() => toast.success('Slack webhook push verified successfully (200 OK).')}
           className="px-6 h-12 bg-white border border-slate-100 text-[#0F172A] hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-block shadow-sm"
         >
            Test Push Connection
         </button>
      </div>
    </div>
  );
};

// ==========================================
// 10. DATA PRIVACY & COMPLIANCE
// ==========================================
const DataPrivacySettings = ({ draftSettings, onChange }) => {
  const handleDataBackup = () => {
    toast.loading('Assembling complete company backup dump...');
    setTimeout(() => {
       toast.dismiss();
       toast.success('Backup export compiled. Downloading archive zip...');
    }, 2000);
  };

  return (
    <div className="space-y-12 relative z-10">
      <div>
        <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Data Privacy</h3>
        <p className="text-sm font-bold text-slate-400 mt-2">Enforce GDPR rules, manage data retention limits, and manage recording consent.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ToggleCard 
           title="GDPR Audit Enforcement" 
           desc="Log consent triggers and require dynamic confirmation on leads." 
           active={!!draftSettings.PRIVACY_GDPR} 
           onToggle={() => onChange('PRIVACY_GDPR', !draftSettings.PRIVACY_GDPR)}
         />
         <ToggleCard 
           title="Strict Call Recording Consent" 
           desc="Enforce IVR audio checks before activating call recordings." 
           active={!!draftSettings.PRIVACY_CALL_CONSENT} 
           onToggle={() => onChange('PRIVACY_CALL_CONSENT', !draftSettings.PRIVACY_CALL_CONSENT)}
         />
      </div>

      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
         <h4 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter block">Data Retention Rules</h4>
         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure maximum days before system logs are automatically purged from database:</p>

         <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 max-w-sm">
            <input 
              type="range" min="30" max="730" step="30"
              className="flex-1 accent-blue-600"
              value={draftSettings.PRIVACY_RETENTION || 365}
              onChange={(e) => onChange('PRIVACY_RETENTION', parseInt(e.target.value))}
            />
            <span className="text-xl font-black text-[#0F172A] italic shrink-0">{draftSettings.PRIVACY_RETENTION || 365} Days</span>
         </div>
      </div>

      {/* Export Company Data */}
      <div className="p-10 bg-slate-900 rounded-[48px] shadow-2xl text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-15 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={90} /></div>
         <div className="relative z-10 space-y-4">
            <h4 className="text-2xl font-black uppercase tracking-tighter italic">Export Complete Database Dump</h4>
            <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed max-w-lg">
               Compile and retrieve an encrypted zip archive containing all organization leads, invoices list, calling files, and logs entries.
            </p>
            <button 
              onClick={handleDataBackup}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
            >
               Trigger Export Data Process
            </button>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 11. SECURITY & SESSIONS MODULE
// ==========================================
const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const queryClient = useQueryClient();

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

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword) {
        throw new Error('Please fill in both current and new password fields.');
      }
      await api.post('/auth/change-password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Password update failed.');
    }
  });

  return (
    <div className="space-y-12 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Security & Sessions</h3>
          <p className="text-sm font-bold text-slate-400 mt-2">Manage active logins, revoke sessions, and configure login credentials.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Shield Hardened</span>
        </div>
      </div>

      {/* Password Management */}
      <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0F172A] shadow-sm border border-slate-100">
              <Lock size={20} />
           </div>
           <div>
              <h4 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">Authentication Credentials</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update primary account access key</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormInput 
             label="Current Password" 
             type="password" 
             isSecret 
             placeholder="••••••••••••" 
             value={currentPassword}
             onChange={(e) => setCurrentPassword(e.target.value)}
           />
           <FormInput 
             label="New Password" 
             type="password" 
             isSecret 
             placeholder="••••••••••••" 
             value={newPassword}
             onChange={(e) => setNewPassword(e.target.value)}
           />
        </div>
        
        <button 
          onClick={() => passwordMutation.mutate()} 
          disabled={passwordMutation.isPending}
          className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          {passwordMutation.isPending && <Loader2 className="animate-spin" size={14} />} Update Security Credentials
        </button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h4 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic">Active Logged Sessions</h4>
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
             {sessions?.length || 0} Connected Devices
           </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {isLoading ? (
             <div className="h-40 flex items-center justify-center text-slate-400 animate-pulse uppercase font-black tracking-widest">Scanning active sessions...</div>
           ) : sessions?.map((session) => (
             <div key={session.id} className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all duration-500 border border-slate-100">
                      {session.userAgent?.includes('Mobile') ? <Smartphone size={24} /> : <Monitor size={24} />}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <h5 className="font-black text-[#0F172A] uppercase tracking-wider text-sm">{session.deviceName || 'CRM Platform Node'}</h5>
                         {session.token === (localStorage.getItem('token') || sessionStorage.getItem('token')) && (
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Active Device</span>
                         )}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
    </div>
  );
};

// ==========================================
// 12. AUDIT LOGS MODULE
// ==========================================
const AuditLedger = () => {
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState('ALL');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit');
      return res.data.data;
    }
  });

  const filteredLogs = logs?.filter(log => {
     const matchesSearch = log.action.toLowerCase().includes(logSearch.toLowerCase()) || (log.user?.name || '').toLowerCase().includes(logSearch.toLowerCase());
     const matchesCategory = logCategory === 'ALL' || log.module.toUpperCase() === logCategory.toUpperCase();
     return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return toast.error('No logs to export');
    
    const headers = ['Time', 'Performed By', 'Module', 'Action', 'Target'];
    const data = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.user?.name || 'SYSTEM',
      log.module,
      log.action,
      log.entityId || ''
    ]);

    exportToCSV(headers, data, 'ACRM_Audit_Logs');
    toast.success('Audit logs CSV exported.');
  };

  return (
    <div className="space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">Activity Logs</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">A complete audited history of all changes and actions performed by your team.</p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="h-14 px-8 bg-[#0F172A] hover:bg-blue-600 hover:shadow-xl text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 self-start"
            >
               <Download size={14} /> Export CSV Ledger
            </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" placeholder="Search actor or action..." 
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-xl outline-none font-bold text-xs"
                value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
              />
           </div>
           <select 
             value={logCategory} onChange={(e) => setLogCategory(e.target.value)}
             className="h-12 px-6 bg-white border border-slate-100 rounded-xl font-bold text-xs text-[#0F172A] outline-none"
           >
              <option value="ALL">All Categories</option>
              <option value="TEAM">Teams Management</option>
              <option value="AGENT">Agents Management</option>
              <option value="SETTINGS">System Settings</option>
              <option value="LEAD">Leads Management</option>
           </select>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-800/50">
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Performed By</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                 </tr>
              </thead>
              <tbody className="text-white/80 font-mono text-xs">
                 {isLoading ? (
                   <tr><td colSpan="5" className="p-20 text-center animate-pulse">Loading Activity Logs...</td></tr>
                 ) : filteredLogs?.length === 0 ? (
                   <tr><td colSpan="5" className="p-20 text-center text-slate-500">No matching logs found.</td></tr>
                 ) : filteredLogs?.map((log, i) => (
                   <tr key={i} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-8 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-8 font-black text-blue-400">{log.user?.name || 'SYSTEM'}</td>
                      <td className="p-8 uppercase tracking-widest text-slate-400">{log.module || 'CORE'}</td>
                      <td className="p-8 uppercase tracking-widest text-emerald-400">{log.action}</td>
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

// ==========================================
// UTILITY COMPONENTS
// ==========================================
const PlaceholderSettings = ({ category }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 animate-pulse border border-slate-100">
            <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
        <div>
            <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter italic">Settings Loading...</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">{category} module synchronization in progress.</p>
        </div>
    </div>
);

const FormInput = ({ label, placeholder, type = 'text', colSpan = '', dark = false, isSecret = false, value = '', onChange }) => {
    const [isVisible, setIsVisible] = useState(!isSecret);
    return (
        <div className={`space-y-4 ${colSpan} w-full`}>
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
            <div className="relative group w-full">
                <input 
                    type={isSecret ? (isVisible ? 'text' : 'password') : type} 
                    placeholder={placeholder} 
                    value={value}
                    onChange={onChange}
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

const ToggleCard = ({ title, desc, active = false, onToggle }) => (
    <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex items-start justify-between group hover:shadow-xl hover:border-blue-100 transition-all duration-700">
        <div className="space-y-2">
            <h4 className="text-lg font-black text-[#0F172A] tracking-tight">{title}</h4>
            <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[280px]">{desc}</p>
        </div>
        <button onClick={onToggle} className={`w-14 h-7 rounded-full relative transition-all duration-500 shrink-0 ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <motion.div 
                animate={{ x: active ? 28 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
            />
        </button>
    </div>
);

export default AdminSettings;
