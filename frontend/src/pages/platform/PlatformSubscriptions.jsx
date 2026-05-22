import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Zap, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2,
  DollarSign,
  Users,
  Target,
  BrainCircuit,
  X,
  ShieldCheck,
  Phone,
  BarChart3,
  Globe,
  Lock,
  ChevronDown,
  Info,
  Server,
  Activity,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PlatformSubscriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['platformPlans'],
    queryFn: async () => {
      const res = await api.get('/platform/plans');
      return res.data.data;
    }
  });

  const upsertPlanMutation = useMutation({
    mutationFn: async (planData) => {
      const res = await api.post('/platform/plans', planData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformPlans']);
      toast.success(editingPlan ? 'Plan Configuration Updated' : 'New Plan Architecture Deployed');
      setIsModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-8">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic animate-pulse">Syncing Subscription Plans...</p>
    </div>
  );

  return (
    <div className="space-y-16 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Revenue Hub</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Standard Billing Systems</span>
           </div>
           <h1 className="text-6xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Subscription Plans</h1>
           <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed italic">Architect global subscription tiers with precision-engineered resource limits and modular feature gating.</p>
        </div>
        <button 
          onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
          className="h-18 px-12 bg-[#0F172A] text-white rounded-[32px] text-[11px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4 shadow-2xl shadow-slate-900/20 hover:scale-105 transition-all active:scale-95 group"
        >
           <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" /> 
           Create New Plan
        </button>
      </div>

      {/* PLAN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
         {plans?.map((plan) => (
           <PlanCard 
              key={plan.id} 
              plan={plan} 
              onEdit={() => { setEditingPlan(plan); setIsModalOpen(true); }}
           />
         ))}
         
         <button 
           onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
           className="h-full min-h-[550px] bg-slate-50 border-4 border-dashed border-slate-200 rounded-[64px] flex flex-col items-center justify-center p-12 text-slate-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all group"
         >
            <div className="w-24 h-24 rounded-[32px] border-4 border-dashed border-current flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-90 transition-all duration-700">
               <Plus size={40} />
            </div>
            <div className="text-center">
               <p className="text-[12px] font-black uppercase tracking-[0.3em] italic">Add New Plan</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize Plan Configuration</p>
            </div>
         </button>
      </div>

      <PlanBuilderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => upsertPlanMutation.mutate(data)}
        initialData={editingPlan}
        isSubmitting={upsertPlanMutation.isPending}
      />
    </div>
  );
};

const PlanCard = ({ plan, onEdit }) => (
  <div className="bg-white rounded-[64px] border border-slate-100 shadow-sm p-12 space-y-12 relative overflow-hidden group hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:-translate-y-4 transition-all duration-700">
     <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-1000" />
     
     <div className="flex items-center justify-between relative z-10">
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic ${
           plan.tier === 'ENTERPRISE' ? 'bg-[#0F172A] text-white' : 
           plan.tier === 'PROFESSIONAL' ? 'bg-violet-100 text-violet-600 border border-violet-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
        }`}>
           {plan.tier} PLAN
        </div>
        <button onClick={onEdit} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:bg-[#0F172A] hover:text-white hover:rotate-12 transition-all flex items-center justify-center shadow-sm">
           <Edit3 size={18} />
        </button>
     </div>

     <div className="space-y-6 relative z-10">
        <div>
           <h3 className="text-3xl font-black text-[#0F172A] uppercase italic tracking-tighter leading-none">{plan.name}</h3>
           <div className="flex items-baseline gap-2 mt-4">
              <span className="text-5xl font-black text-[#0F172A] italic tracking-tighter">₹{plan.priceMonthly.toLocaleString()}</span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">/ MONTHLY</span>
           </div>
        </div>
        <p className="crm-body font-medium leading-relaxed italic">{plan.description || 'Optimized enterprise plan for scalable operations and resource management.'}</p>
     </div>

     <div className="grid grid-cols-2 gap-8 py-10 border-y border-slate-100 relative z-10">
        <MetricSmall label="Agent Capacity" value={plan.userLimit >= 9999 ? '∞' : plan.userLimit} icon={Users} color="blue" />
        <MetricSmall label="Lead Engine" value={plan.leadLimit >= 1000000 ? '∞' : `${(plan.leadLimit / 1000).toFixed(0)}k`} icon={Target} color="emerald" />
        <MetricSmall label="AI Tokens" value={`${(plan.aiTokenLimit / 1000).toFixed(0)}k`} icon={BrainCircuit} color="violet" />
        <MetricSmall label="Storage Limit" value={`${plan.storageLimitMb}MB`} icon={HardDrive} color="amber" />
     </div>

     <div className="space-y-6 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Plan Features</p>
        <div className="grid grid-cols-1 gap-4">
           <FeatureItem label="AI Assistant Engine" active={plan.aiAssistant} />
           <FeatureItem label="VoIP Telephony Gateway" active={plan.callingEnabled} />
           <FeatureItem label="Analytics Dashboard" active={plan.analyticsEnabled} />
           <FeatureItem label="Workflow Automations" active={plan.automationEnabled} />
           <FeatureItem label="Infrastructure API" active={plan.apiAccess} />
           {Array.isArray(plan.features) && plan.features.map(f => (
             <FeatureItem key={f} label={f} active />
           ))}
        </div>
     </div>
  </div>
);

const MetricSmall = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
    amber: 'text-amber-600 bg-amber-50'
  };
  return (
    <div className="flex items-center gap-4 group">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={18} />
       </div>
       <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-[#0F172A] italic uppercase leading-tight">{value}</p>
       </div>
    </div>
  );
};

const FeatureItem = ({ label, active }) => (
  <div className={`flex items-center gap-4 text-[11px] font-black uppercase italic transition-all ${active ? 'text-slate-900' : 'text-slate-300 line-through opacity-50'}`}>
     <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
     {label}
  </div>
);

const PlanBuilderModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: '', tier: 'STARTER', description: '', priceMonthly: 0, priceYearly: 0,
    userLimit: 5, managerLimit: 1, leadLimit: 1000, storageLimitMb: 512, aiTokenLimit: 10000,
    callMinutesLimit: 100, campaignLimit: 5, pipelineLimit: 3,
    aiAssistant: false, aiLeadScoring: false, aiVoiceCalls: false, callingEnabled: false,
    callRecording: false, smsEnabled: false, whatsappEnabled: false, monitoringEnabled: false,
    automationEnabled: false, analyticsEnabled: false, advancedReports: false,
    customBranding: false, prioritySupport: false, apiAccess: false, webhooksEnabled: false,
    auditLogsEnabled: false, freeTrialDays: 0, setupFee: 0, isActive: true, isPublic: true,
    features: []
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (initialData) setFormData({ ...initialData, features: Array.isArray(initialData.features) ? initialData.features : [] });
    else setFormData({
      name: '', tier: 'STARTER', description: '', priceMonthly: 0, priceYearly: 0,
      userLimit: 5, managerLimit: 1, leadLimit: 1000, storageLimitMb: 512, aiTokenLimit: 10000,
      callMinutesLimit: 100, campaignLimit: 5, pipelineLimit: 3,
      aiAssistant: false, aiLeadScoring: false, aiVoiceCalls: false, callingEnabled: false,
      callRecording: false, smsEnabled: false, whatsappEnabled: false, monitoringEnabled: false,
      automationEnabled: false, analyticsEnabled: false, advancedReports: false,
      customBranding: false, prioritySupport: false, apiAccess: false, webhooksEnabled: false,
      auditLogsEnabled: false, freeTrialDays: 0, setupFee: 0, isActive: true, isPublic: true,
      features: []
    });
  }, [initialData, isOpen]);

  const addCustomFeature = () => {
    if (!newFeature.trim()) return;
    if (formData.features.includes(newFeature.trim())) return;
    setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (f) => {
    setFormData({ ...formData, features: formData.features.filter(feat => feat !== f) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const Toggle = ({ label, field }) => (
    <div 
      onClick={() => setFormData({ ...formData, [field]: !formData[field] })}
      className={`p-5 rounded-[28px] border-2 transition-all cursor-pointer flex items-center justify-between ${formData[field] ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
    >
       <span className={`text-[11px] font-black uppercase tracking-widest ${formData[field] ? 'text-blue-600 italic' : 'text-slate-400'}`}>{label}</span>
       <div className={`w-10 h-5 rounded-full relative transition-all ${formData[field] ? 'bg-blue-600' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData[field] ? 'right-0.5' : 'left-0.5'}`} />
       </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl" onClick={onClose} />
           <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }}
             className="relative bg-white w-full max-w-7xl rounded-[48px] md:rounded-[64px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:h-[850px]"
           >
              <div className="flex h-full flex-col lg:flex-row">
                 {/* BRAND PANEL */}
                 <div className="hidden lg:flex w-[340px] xl:w-[400px] bg-[#0F172A] p-10 xl:p-16 flex-col justify-between relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                       <Zap size={300} />
                    </div>
                    <div className="relative z-10 space-y-12">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                             <Zap size={24} className="text-white" />
                          </div>
                          <span className="text-white font-black text-2xl tracking-tighter italic uppercase">BILLING</span>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Plan Configuration</p>
                          <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">Plan Management Engine</h4>
                       </div>
                    </div>
                    <div className="relative z-10 p-8 xl:p-10 bg-white/5 rounded-[40px] border border-white/10 space-y-4">
                       <ShieldCheck size={32} className="text-blue-500" />
                       <p className="text-xs text-slate-400 font-medium leading-relaxed italic">Changes to subscription plans will take effect immediately for all new organizations.</p>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="px-8 md:px-16 py-8 md:py-12 flex items-center justify-between border-b border-slate-100 shrink-0">
                       <div>
                          <h3 className="text-3xl md:text-4xl font-black text-[#0F172A] uppercase italic leading-none">{initialData ? 'Edit Plan Configuration' : 'Create New Plan'}</h3>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">Defining multi-tenant subscription constraints</p>
                       </div>
                       <button onClick={onClose} className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"><X size={28} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-16 space-y-16">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                          <Input label="Plan Identifier" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Enterprise Plus" />
                          <div className="space-y-4">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Tier</label>
                             <select className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-blue-600 transition-all font-black text-sm italic uppercase" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
                                <option value="STARTER">STARTER PLAN</option>
                                <option value="PROFESSIONAL">PROFESSIONAL PLAN</option>
                                <option value="ENTERPRISE">ENTERPRISE PLAN</option>
                             </select>
                          </div>
                          <div className="md:col-span-2">
                             <Input label="Plan Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed description of the plan capabilities..." />
                          </div>
                          <Input label="Monthly MRR (₹)" type="number" value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: parseFloat(e.target.value)})} />
                          <Input label="Yearly ARR (₹)" type="number" value={formData.priceYearly} onChange={e => setFormData({...formData, priceYearly: parseFloat(e.target.value)})} />
                       </div>

                       <div className="space-y-10">
                          <h4 className="text-lg font-black uppercase tracking-widest italic text-blue-600">Resource Limits</h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                             <LimitField label="Agent Capacity" value={formData.userLimit} onChange={v => setFormData({...formData, userLimit: v})} />
                             <LimitField label="Lead Cap" value={formData.leadLimit} onChange={v => setFormData({...formData, leadLimit: v})} />
                             <LimitField label="AI Tokens" value={formData.aiTokenLimit} onChange={v => setFormData({...formData, aiTokenLimit: v})} />
                             <LimitField label="Storage (MB)" value={formData.storageLimitMb} onChange={v => setFormData({...formData, storageLimitMb: v})} />
                          </div>
                       </div>

                       <div className="space-y-10">
                          <h4 className="text-lg font-black uppercase tracking-widest italic text-blue-600">Feature Gating Switches</h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                             <Toggle label="AI Engine" field="aiAssistant" />
                             <Toggle label="VoIP Gateway" field="callingEnabled" />
                             <Toggle label="Analytics" field="analyticsEnabled" />
                             <Toggle label="Automation" field="automationEnabled" />
                             <Toggle label="API Access" field="apiAccess" />
                             <Toggle label="Webhooks" field="webhooksEnabled" />
                             <Toggle label="Audit Logs" field="auditLogsEnabled" />
                             <Toggle label="Priority Support" field="prioritySupport" />
                          </div>
                       </div>

                       {/* DYNAMIC FEATURE DEPLOYMENT */}
                       <div className="space-y-10 pb-12">
                          <h4 className="text-lg font-black uppercase tracking-widest italic text-blue-600">Custom Feature Modules</h4>
                          <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-8">
                             <div className="flex gap-4">
                                <input 
                                  value={newFeature} onChange={e => setNewFeature(e.target.value)}
                                  placeholder="Enter new feature name (e.g. Video Calls)"
                                  className="flex-1 h-16 px-8 bg-white border border-slate-200 rounded-3xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                                />
                                <button type="button" onClick={addCustomFeature} className="h-16 px-8 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Add Feature</button>
                             </div>
                             <div className="flex flex-wrap gap-3">
                                {formData.features.map(f => (
                                  <div key={f} className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl group shadow-sm">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">{f}</span>
                                     <button type="button" onClick={() => removeFeature(f)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                  </div>
                                ))}
                                {formData.features.length === 0 && <p className="text-[10px] font-bold text-slate-400 uppercase italic">No custom modules deployed to this tier.</p>}
                             </div>
                          </div>
                       </div>
                    </form>

                    <div className="px-8 md:px-16 py-8 md:py-12 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                       <button onClick={onClose} className="px-8 h-16 rounded-[28px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all">Discard</button>
                       <button 
                         onClick={handleSubmit} 
                         disabled={isSubmitting}
                         className="px-12 md:px-16 h-18 md:h-20 bg-[#0F172A] text-white rounded-[28px] md:rounded-[32px] text-[11px] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:scale-105 transition-all disabled:opacity-50"
                       >
                          {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Plan'}
                       </button>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-4">
     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <input 
       type={type} placeholder={placeholder} value={value} onChange={onChange}
       className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#0F172A]"
     />
  </div>
);

const LimitField = ({ label, value, onChange }) => (
  <div className="space-y-4">
     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <div className="flex items-center gap-4">
        <input 
          type="number" 
          className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-black text-sm italic"
          value={value}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
        />
        <button 
          type="button"
          onClick={() => onChange(9999)}
          className="h-16 px-4 bg-white border border-slate-100 text-slate-400 hover:bg-[#0F172A] hover:text-white rounded-2xl transition-all shadow-sm"
        >
           <Zap size={18} />
        </button>
     </div>
  </div>
);

export default PlatformSubscriptions;
