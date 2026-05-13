import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Building2, 
  Users, 
  Target, 
  Database, 
  ShieldCheck, 
  Activity, 
  Search,
  Plus,
  MoreVertical,
  Zap,
  Lock,
  Trash2,
  ChevronRight,
  ExternalLink,
  CreditCard,
  X,
  Filter,
  BarChart3,
  Globe,
  Settings,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TableActionMenu, { TableActionItem } from '../../components/common/TableActionMenu';

const PlatformCompanies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setImpersonationToken } = useAuth();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['platformOrganizations'],
    queryFn: async () => {
      const res = await api.get('/platform/organizations');
      return res.data.data;
    }
  });

  const { data: plansData } = useQuery({
    queryKey: ['platformPlans'],
    queryFn: async () => {
      const res = await api.get('/platform/plans');
      return res.data.data;
    }
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/platform/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['platformOrganizations']);
      toast.success('Company updated successfully');
      setIsSubscriptionModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id) => api.delete(`/platform/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['platformOrganizations']);
      toast.success('Company archived successfully');
    }
  });

  const handleAccessWorkspace = async (orgId) => {
    try {
      const loadingToast = toast.loading('Connecting to company workspace...');
      const res = await api.post(`/platform/organizations/${orgId}/access`);
      
      if (res.data.success) {
        const { token, redirectUrl } = res.data.data;
        setImpersonationToken(token);
        toast.dismiss(loadingToast);
        toast.success('Support Access Granted');
        window.location.href = redirectUrl;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access Denied');
    }
  };

  const filteredOrgs = organizations?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading Companies...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Admin</span>
              <div className="h-px w-8 bg-slate-200" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Company Management</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Companies</h1>
           <p className="text-sm font-medium text-slate-500 mt-4 max-w-2xl">Manage and monitor enterprise CRM companies and their workspaces.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search Company Name or Slug..." 
                className="h-16 w-full md:w-80 pl-16 pr-8 bg-white border border-slate-200 rounded-3xl outline-none focus:border-blue-600 focus:shadow-xl transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="h-16 px-10 bg-[#0F172A] text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4 shadow-2xl shadow-slate-900/40 hover:scale-105 transition-all active:scale-95"
           >
              <Plus size={20} /> Create Company
           </button>
        </div>
      </div>

      {/* COMPANY TABLE */}
      <div className="bg-white rounded-[64px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Metrics</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                     <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredOrgs?.map((org, index) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-all group">
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-[28px] bg-[#0F172A] flex items-center justify-center text-white shadow-xl group-hover:rotate-12 transition-transform">
                                <Building2 size={24} />
                             </div>
                             <div>
                                <p className="text-lg font-black text-[#0F172A] uppercase italic tracking-tight leading-none">{org.name}</p>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{org.slug}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex flex-col">
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                org.subscriptionTier === 'ENTERPRISE' ? 'bg-[#0F172A] text-white' : 
                                org.subscriptionTier === 'PROFESSIONAL' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                             }`}>
                                {org.subscriptionTier}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">{org.status}</span>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                             <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Agents</p>
                                <p className="text-xs font-black text-[#0F172A]">{org._count?.users || 0} / {org.agentLimit}</p>
                             </div>
                             <div className="w-px h-8 bg-slate-100" />
                             <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Leads</p>
                                <p className="text-xs font-black text-[#0F172A]">{(org._count?.leads || 0).toLocaleString()} / {(org.leadLimit / 1000).toFixed(0)}k</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-3">
                             <Calendar size={14} className="text-slate-300" />
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date(org.createdAt).toLocaleDateString()}</span>
                          </div>
                       </td>
                       <td className="px-10 py-10 text-right relative">
                          <div className="flex items-center justify-end gap-3">
                             <button 
                               onClick={() => navigate(`/platform/organizations/${org.id}`)}
                               className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-[#0F172A] text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                             >
                                Details
                             </button>
                             
                             <TableActionMenu 
                                id={org.id} 
                                activeId={activeMenuId} 
                                setActiveId={setActiveMenuId}
                             >
                                <TableActionItem 
                                   icon={<Zap size={16} />} 
                                   label="Support Access" 
                                   color="blue"
                                   onClick={() => handleAccessWorkspace(org.id)} 
                                />
                                <TableActionItem 
                                   icon={<CreditCard size={16} />} 
                                   label="Manage Billing" 
                                   color="indigo"
                                   onClick={() => {
                                     setSelectedOrg(org);
                                     setIsSubscriptionModalOpen(true);
                                     setActiveMenuId(null);
                                   }} 
                                />
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <TableActionItem 
                                   icon={org.status === 'SUSPENDED' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />} 
                                   label={org.status === 'SUSPENDED' ? "Restore Access" : "Suspend Access"} 
                                   color="amber"
                                   onClick={() => {
                                     updateOrgMutation.mutate({ id: org.id, data: { status: org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } });
                                     setActiveMenuId(null);
                                   }} 
                                />
                                <TableActionItem 
                                   icon={<Trash2 size={16} />} 
                                   label="Archive Company" 
                                   color="rose"
                                   onClick={() => {
                                     if (confirm('Are you sure you want to archive this company? All active sessions will be terminated.')) {
                                        deleteOrgMutation.mutate(org.id);
                                        setActiveMenuId(null);
                                     }
                                    }} 
                                />
                             </TableActionMenu>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* MODALS */}
      <CreateCompanyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        plans={plansData || []}
        onSuccess={() => {
          queryClient.invalidateQueries(['platformOrganizations']);
        }}
      />

      <ManageSubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        organization={selectedOrg}
        plans={plansData}
        onUpdate={(data) => updateOrgMutation.mutate({ id: selectedOrg.id, data })}
        isUpdating={updateOrgMutation.isPending}
      />
    </div>
  );
};

const ManageSubscriptionModal = ({ isOpen, onClose, organization, plans, onUpdate, isUpdating }) => {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'overrides'
  const [overrides, setOverrides] = useState({
    agentLimit: 0,
    leadLimit: 0,
    aiTokenLimit: 0,
    storageLimitMb: 0
  });

  React.useEffect(() => {
    if (organization) {
      setOverrides({
        agentLimit: organization.agentLimit,
        leadLimit: organization.leadLimit,
        aiTokenLimit: organization.aiTokenLimit,
        storageLimitMb: organization.storageLimitMb
      });
    }
  }, [organization, isOpen]);

  if (!organization) return null;

  const handleApplyOverrides = () => {
    onUpdate(overrides);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-6xl bg-white rounded-[64px] shadow-2xl overflow-hidden flex flex-col md:h-[800px]"
          >
            <div className="flex flex-col lg:flex-row h-full">
              {/* LEFT: CURRENT CONTEXT */}
              <div className="w-full lg:w-[400px] bg-slate-900 p-12 flex flex-col justify-between shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                   <CreditCard size={300} />
                </div>
                
                <div className="space-y-12 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                          <Zap size={22} className="text-white" />
                       </div>
                       <span className="text-white font-black text-xl tracking-tighter italic uppercase">BILLING SETTINGS</span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Subscription</h3>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-4 italic">Managing: {organization.name}</p>
                  </div>

                  <div className="space-y-8">
                     <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan</span>
                           <span className="px-3 py-1 bg-blue-600 rounded-lg text-[9px] font-black text-white uppercase">L3 Secured</span>
                        </div>
                        <p className="text-4xl font-black italic uppercase tracking-tighter text-white">{organization.plan?.name || organization.subscriptionTier}</p>
                        <div className="h-px bg-white/10" />
                        <div className="space-y-4">
                           <PlanLimit label="Agents" value={organization._count?.users} limit={organization.agentLimit} />
                           <PlanLimit label="Leads Cap" value={organization._count?.leads} limit={organization.leadLimit} />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                   <button 
                     onClick={() => setActiveTab(activeTab === 'plans' ? 'overrides' : 'plans')}
                     className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                   >
                     {activeTab === 'plans' ? <Settings size={16} /> : <Zap size={16} />}
                     {activeTab === 'plans' ? 'Manual Limit Overrides' : 'Standard Plan Tiers'}
                   </button>
                   <button 
                     onClick={onClose}
                     className="w-full h-16 bg-white text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all shadow-xl"
                   >
                     Exit Management
                   </button>
                </div>
              </div>

              {/* RIGHT: CONFIGURATION SPACE */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                   <div>
                      <h4 className="text-2xl font-black text-[#0F172A] uppercase italic leading-none">{activeTab === 'plans' ? 'Plan Tiers' : 'Advanced Limit Overrides'}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{activeTab === 'plans' ? 'Select standardized resource allocation model' : 'Precision control for enterprise resource limits'}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12">
                  {activeTab === 'plans' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {plans?.map(plan => (
                        <div 
                          key={plan.id}
                          className={`p-10 rounded-[56px] border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                            organization.planId === plan.id 
                            ? 'border-blue-600 bg-blue-50/30' 
                            : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                          onClick={() => !isUpdating && organization.planId !== plan.id && onUpdate({ planId: plan.id })}
                        >
                          <div className="space-y-8">
                             <div className="flex items-center justify-between">
                                <h4 className="text-2xl font-black text-[#0F172A] uppercase italic leading-none">{plan.name}</h4>
                                {organization.planId === plan.id && (
                                  <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 rounded-full text-[9px] font-black text-white uppercase">Active</div>
                                )}
                             </div>
                             <p className="text-4xl font-black text-[#0F172A] tracking-tighter italic leading-none">₹{plan.priceMonthly.toLocaleString()}<span className="text-xs font-bold text-slate-400 uppercase ml-2 not-italic">/ Mo</span></p>
                             
                             <div className="space-y-4 py-6 border-y border-slate-100">
                                <PlanFeature label="Agent Capacity" value={plan.userLimit >= 9999 ? 'Unlimited' : plan.userLimit} />
                                <PlanFeature label="Lead Cap" value={plan.leadLimit >= 1000000 ? 'Unlimited' : `${(plan.leadLimit / 1000).toFixed(0)}k`} />
                                <PlanFeature label="AI Assistant" checked={plan.aiAssistant} />
                                <PlanFeature label="VoIP Calls" checked={plan.callingEnabled} />
                             </div>
                          </div>

                          <button 
                            disabled={isUpdating || organization.planId === plan.id}
                            className={`w-full h-14 mt-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                              organization.planId === plan.id 
                              ? 'bg-emerald-500 text-white cursor-default'
                              : 'bg-slate-900 text-white hover:scale-105 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0'
                            }`}
                          >
                             {isUpdating ? 'Saving...' : organization.planId === plan.id ? 'Active' : 'Select Plan'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-w-3xl space-y-12">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <OverrideField 
                             label="Max Agent Capacity" 
                             description="Total licensed seat count for this workspace."
                             value={overrides.agentLimit} 
                             onChange={v => setOverrides({...overrides, agentLimit: v})}
                             icon={Users}
                          />
                          <OverrideField 
                             label="Lead Generation Cap" 
                             description="Maximum leads recordable in the CRM engine."
                             value={overrides.leadLimit} 
                             onChange={v => setOverrides({...overrides, leadLimit: v})}
                             icon={Target}
                          />
                          <OverrideField 
                             label="AI Token Quota" 
                             description="Platform-wide AI processing credits."
                             value={overrides.aiTokenLimit} 
                             onChange={v => setOverrides({...overrides, aiTokenLimit: v})}
                             icon={BrainCircuit}
                          />
                          <OverrideField 
                             label="Storage Expansion (MB)" 
                             description="Secure data residency storage limit."
                             value={overrides.storageLimitMb} 
                             onChange={v => setOverrides({...overrides, storageLimitMb: v})}
                             icon={Database}
                          />
                       </div>
                       
                       <div className="p-10 bg-blue-50 rounded-[40px] border border-blue-100 flex items-center gap-8">
                          <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                             <ShieldCheck size={28} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-[#0F172A] uppercase italic">Manual Limit Override</p>
                             <p className="text-[11px] text-blue-600 font-bold leading-relaxed mt-1">Manual overrides bypass standard plan constraints. These changes are recorded in the platform audit logs and will affect billing cycles if not properly documented.</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                {activeTab === 'overrides' && (
                  <div className="px-12 py-10 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                     <button onClick={() => setActiveTab('plans')} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Cancel</button>
                     <button 
                        onClick={handleApplyOverrides}
                        disabled={isUpdating}
                        className="h-18 px-16 bg-[#0F172A] text-white rounded-3xl text-[11px] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isUpdating ? 'Applying changes...' : 'Save Limit Overrides'}
                     </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const OverrideField = ({ label, description, value, onChange, icon: Icon }) => (
  <div className="space-y-4">
     <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
           <Icon size={16} />
        </div>
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
     </div>
     <div className="relative group">
        <input 
           type="number" 
           value={value} 
           onChange={e => onChange(parseInt(e.target.value) || 0)}
           className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-lg italic text-[#0F172A]"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
           <Settings size={18} className="text-slate-300" />
        </div>
     </div>
     <p className="text-[10px] text-slate-400 font-bold ml-1 italic">{description}</p>
  </div>
);

const PlanLimit = ({ label, value, limit }) => (
  <div className="space-y-3">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      <span>{label}</span>
      <span className="text-white italic">{value} / {limit >= 9999 ? '∞' : limit}</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" style={{ width: `${Math.min((value/limit)*100, 100)}%` }} />
    </div>
  </div>
);

const PlanFeature = ({ label, value, checked }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    {checked ? (
      <div className="flex items-center gap-2 text-emerald-500">
         <ShieldCheck size={16} />
      </div>
    ) : (
      <span className="text-sm font-black text-[#0F172A] italic uppercase">{value}</span>
    )}
  </div>
);

const CreateCompanyModal = ({ isOpen, onClose, plans, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', slug: '', planId: '', adminName: '', adminEmail: '', adminPassword: '',
    industry: 'Technology', companySize: '1-10', region: 'India', timezone: 'IST (UTC+5:30)',
    agentLimit: 5, leadLimit: 1000, aiTokenLimit: 10000, storageLimitMb: 512,
    status: 'ACTIVE', aiEnabled: false, callingEnabled: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState([]);

  const handlePlanSelect = (plan) => {
    setFormData(prev => ({
      ...prev,
      planId: plan.id,
      agentLimit: plan.userLimit,
      leadLimit: plan.leadLimit,
      storageLimitMb: plan.storageLimitMb,
      aiEnabled: plan.aiAssistant,
      callingEnabled: plan.callingEnabled,
      aiTokenLimit: plan.aiTokenLimit
    }));
    setStep(3);
  };

  const startProvisioning = async () => {
    setIsSubmitting(true);
    const steps = [
      'Setting up company workspace...',
      'Creating database...',
      'Configuring security...',
      'Configuring AI features...',
      'Setting up phone system...',
      'Creating admin account...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setProvisioningStatus(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const res = await api.post('/platform/organizations', formData);
      if (res.data.success) {
        setProvisioningStatus(prev => [...prev, '✓ Company Setup Complete!']);
        await new Promise(r => setTimeout(r, 1000));
        toast.success('Company Created Successfully');
        onSuccess?.();
        onClose();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deployment Failed');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProvisioningStatus([]);
    setFormData({
      name: '', slug: '', planId: '', adminName: '', adminEmail: '', adminPassword: '',
      industry: 'Technology', companySize: '1-10', region: 'India', timezone: 'IST (UTC+5:30)',
      agentLimit: 5, leadLimit: 1000, aiTokenLimit: 10000, storageLimitMb: 512,
      status: 'ACTIVE', aiEnabled: false, callingEnabled: false
    });
  };

  const selectedPlan = plans?.find(p => p.id === formData.planId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl" 
            onClick={!isSubmitting ? onClose : undefined} 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }}
            className="bg-white w-full max-w-7xl rounded-[64px] shadow-2xl relative overflow-hidden flex flex-col h-[850px]"
          >
             {/* LEFT BRAND PANEL (Fixed) */}
             <div className="flex h-full">
                <div className="hidden lg:flex w-[380px] bg-[#0F172A] p-16 flex-col justify-between relative overflow-hidden shrink-0">
                   <div className="absolute top-0 right-0 p-12 opacity-5">
                      <Layers size={300} />
                   </div>
                   
                   <div className="relative z-10 space-y-12">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Layers size={22} className="text-white" />
                         </div>
                         <span className="text-white font-black text-xl tracking-tighter italic uppercase">ADV.CRM</span>
                      </div>

                      <div className="space-y-10">
                         <StepIndicator current={step} target={1} label="Company Details" />
                         <StepIndicator current={step} target={2} label="Plan Selection" />
                         <StepIndicator current={step} target={3} label="Feature Preview" />
                         <StepIndicator current={step} target={4} label="Admin Setup" />
                         <StepIndicator current={step} target={5} label="Provisioning" />
                      </div>
                   </div>

                   <div className="relative z-10 p-8 bg-white/5 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Platform Security</p>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">All workspaces are isolated at the system level with dedicated security policies.</p>
                   </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-white">
                   {/* MODAL HEADER */}
                   <div className="px-16 py-12 flex items-center justify-between">
                      <div>
                         <h3 className="text-4xl font-black text-[#0F172A] uppercase italic leading-none">
                            {step === 1 && "Company Details"}
                            {step === 2 && "Select Plan"}
                            {step === 3 && "Feature Preview"}
                            {step === 4 && "Account Setup"}
                            {step === 5 && "Provisioning"}
                         </h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                            {step === 1 && "Identify the new enterprise organization"}
                            {step === 2 && "Choose the optimized infrastructure tier"}
                            {step === 3 && "Review active modules and capabilities"}
                            {step === 4 && "Configure the primary workspace administrator"}
                            {step === 5 && "Establishing secure multi-tenant environment"}
                         </p>
                      </div>
                      {!isSubmitting && (
                        <button onClick={onClose} className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
                           <X size={24} />
                        </button>
                      )}
                   </div>

                   {/* STEP CONTENT */}
                   <div className="flex-1 overflow-y-auto px-16 pb-12">
                      <AnimatePresence mode="wait">
                         {step === 1 && (
                           <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                              <div className="grid grid-cols-2 gap-8">
                                 <FormInput label="Company Name" placeholder="e.g. Skyline Logistics" value={formData.name} onChange={v => {
                                    const slug = v.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                                    setFormData({...formData, name: v, slug});
                                 }} />
                                 <FormInput label="Workspace Slug" value={formData.slug} onChange={v => setFormData({...formData, slug: v})} color="blue" />
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                 <FormSelect label="Industry" options={['Technology', 'Logistics', 'Healthcare', 'Finance', 'Real Estate', 'Retail']} value={formData.industry} onChange={v => setFormData({...formData, industry: v})} />
                                 <FormSelect label="Region" options={['India', 'United States', 'Europe', 'Middle East', 'South East Asia']} value={formData.region} onChange={v => setFormData({...formData, region: v})} />
                              </div>
                              <div className="flex justify-end pt-12">
                                 <button onClick={() => setStep(2)} className="h-18 px-12 bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-105 transition-all">
                                    Next <ChevronRight size={18} />
                                 </button>
                              </div>
                           </motion.div>
                         )}

                         {step === 2 && (
                           <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {plans?.map(plan => (
                                <div 
                                  key={plan.id}
                                  onClick={() => handlePlanSelect(plan)}
                                  className="p-10 rounded-[56px] border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/20 cursor-pointer transition-all group flex flex-col justify-between"
                                >
                                   <div className="space-y-6">
                                      <h4 className="text-2xl font-black uppercase italic">{plan.name}</h4>
                                      <p className="text-4xl font-black italic tracking-tighter">₹{plan.priceMonthly.toLocaleString()}<span className="text-[10px] not-italic text-slate-400 ml-2">/ MO</span></p>
                                      <div className="space-y-4 py-8 border-y border-slate-100">
                                         <PlanFeatureItem label="Agents" val={plan.userLimit >= 9999 ? 'Unlimited' : plan.userLimit} />
                                         <PlanFeatureItem label="Storage" val={`${plan.storageLimitMb} MB`} />
                                         <PlanFeatureItem label="AI Tokens" val={`${(plan.aiTokenLimit / 1000).toFixed(0)}k`} />
                                      </div>
                                   </div>
                                   <button className="w-full h-14 mt-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">Select {plan.name}</button>
                                </div>
                              ))}
                           </motion.div>
                         )}

                         {step === 3 && (
                           <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                              <div className="bg-slate-50 rounded-[48px] p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                                 <FeatureToggle label="Advanced CRM" checked />
                                 <FeatureToggle label="Lead Management" checked />
                                 <FeatureToggle label="Email Automation" checked />
                                 <FeatureToggle label="Task Workflow" checked />
                                 <FeatureToggle label="AI Assistant" checked={selectedPlan?.aiAssistant} />
                                 <FeatureToggle label="Call Telephony" checked={selectedPlan?.callingEnabled} />
                                 <FeatureToggle label="Advanced Analytics" checked={selectedPlan?.analyticsEnabled} />
                                 <FeatureToggle label="API Access" checked={selectedPlan?.apiAccess} />
                              </div>
                              <div className="flex justify-between items-center pt-8">
                                 <button onClick={() => setStep(2)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Back to Plans</button>
                                 <button onClick={() => setStep(4)} className="h-18 px-12 bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                                    Final Account Setup <ChevronRight size={18} />
                                 </button>
                              </div>
                           </motion.div>
                         )}

                         {step === 4 && (
                           <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                              <div className="grid grid-cols-2 gap-8">
                                 <FormInput label="Primary Admin Name" placeholder="e.g. John Doe" value={formData.adminName} onChange={v => setFormData({...formData, adminName: v})} />
                                 <FormInput label="Admin Email" placeholder="admin@company.com" value={formData.adminEmail} onChange={v => setFormData({...formData, adminEmail: v})} />
                              </div>
                              <div className="grid grid-cols-1">
                                 <FormInput label="System Password" type="password" placeholder="••••••••" value={formData.adminPassword} onChange={v => setFormData({...formData, adminPassword: v})} />
                              </div>
                              <div className="flex justify-between items-center pt-12">
                                 <button onClick={() => setStep(3)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Review Features</button>
                                 <button onClick={() => {
                                    if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) return toast.error('Required fields missing');
                                    setStep(5);
                                    startProvisioning();
                                 }} className="h-18 px-12 bg-blue-600 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-105 transition-all shadow-xl shadow-blue-600/20">
                                    Start Company Setup <Zap size={18} />
                                 </button>
                              </div>
                           </motion.div>
                         )}

                         {step === 5 && (
                           <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-12">
                              <div className="relative">
                                 <div className="w-40 h-40 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <ActivitySquare size={48} className="text-blue-600 animate-pulse" />
                                 </div>
                              </div>
                              
                              <div className="space-y-4 max-w-md">
                                 {provisioningStatus.map((status, i) => (
                                   <motion.div 
                                     key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                     className={`text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${status.startsWith('✓') ? 'text-emerald-500' : 'text-slate-400'}`}
                                   >
                                      {status.startsWith('✓') ? <CheckCircle2 size={14} /> : <div className="w-1 h-1 bg-blue-600 rounded-full animate-ping" />}
                                      {status}
                                   </motion.div>
                                 ))}
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StepIndicator = ({ current, target, label }) => (
  <div className="flex items-center gap-4 group">
     <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${current >= target ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-white/20'}`}>
        <span className="text-[10px] font-black">{current > target ? <CheckCircle2 size={14} /> : target}</span>
     </div>
     <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${current >= target ? 'text-white' : 'text-white/20'}`}>{label}</span>
  </div>
);

const FormInput = ({ label, value, onChange, placeholder, type = 'text', color = 'slate' }) => (
  <div className="space-y-4">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <input 
       type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
       className={`w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm ${color === 'blue' ? 'text-blue-600 italic' : 'text-[#0F172A]'}`}
     />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-4">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <select 
       value={value} onChange={e => onChange(e.target.value)}
       className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#0F172A]"
     >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
     </select>
  </div>
);

const PlanFeatureItem = ({ label, val }) => (
  <div className="flex items-center justify-between">
     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-900 italic uppercase">{val}</span>
  </div>
);

const FeatureToggle = ({ label, checked }) => (
  <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${checked ? 'bg-white border-blue-100' : 'bg-slate-100/50 border-slate-100 opacity-40 grayscale'}`}>
     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${checked ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
        {checked ? <CheckCircle2 size={16} /> : <X size={16} />}
     </div>
     <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </div>
);

export default PlatformCompanies;
