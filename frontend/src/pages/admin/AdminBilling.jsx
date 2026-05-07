import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  CreditCard, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  FileText,
  Download,
  AlertCircle,
  Activity,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Database,
  Users,
  Cpu,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminBilling = () => {
  const queryClient = useQueryClient();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: billingData, isLoading } = useQuery({
    queryKey: ['billingOverview'],
    queryFn: async () => {
      const res = await api.get('/billing/overview');
      return res.data.data;
    }
  });

  const { data: plans } = useQuery({
    queryKey: ['availablePlans'],
    queryFn: async () => {
      const res = await api.get('/billing/plans');
      return res.data.data;
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId) => api.post('/billing/upgrade', { planId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['billingOverview']);
      setIsUpgradeModalOpen(false);
      // Refresh the page to reload features in AuthContext if necessary
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upgrade failed')
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Billing Ledger...</p>
    </div>
  );

  const { plan, subscription, usage, invoices } = billingData || {};

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tight uppercase italic">Billing & Subscription</h1>
           <p className="text-[#64748B] font-bold text-sm uppercase tracking-widest mt-2">Manage your instance protocols and financial limits.</p>
        </div>
        <button 
          onClick={() => setIsUpgradeModalOpen(true)}
          className="h-16 px-10 bg-[#0F172A] text-white rounded-[22px] font-black uppercase tracking-[0.2em] italic shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
        >
           <Zap size={20} className="text-blue-400" /> Upgrade Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* CURRENT PLAN OVERVIEW */}
        <div className="xl:col-span-1 space-y-10">
           <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <CreditCard size={120} />
              </div>
              
              <div className="space-y-2 relative z-10">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Subscription</span>
                 <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">{plan?.name || subscription?.tier} Protocol</h2>
              </div>

              <div className="py-8 border-y border-slate-100 space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Protocol Status</span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${subscription?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                       {subscription?.status}
                    </span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Renewal Date</span>
                    <span className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase">
                       <Calendar size={14} className="text-blue-500" />
                       {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'Continuous'}
                    </span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rate</span>
                    <span className="text-lg font-black text-[#0F172A] italic">₹{plan?.priceMonthly?.toLocaleString() || 0}</span>
                 </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Features</p>
                 <div className="grid grid-cols-1 gap-3">
                    {plan?.features && Object.entries(plan.features).filter(([_, enabled]) => enabled).slice(0, 5).map(([key, _]) => (
                      <div key={key} className="flex items-center gap-3 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                         <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                         {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* GROWTH CARD */}
           <div className="bg-[#0F172A] p-10 rounded-[56px] shadow-2xl text-white space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <TrendingUp size={24} />
                 </div>
                 <h3 className="text-xl font-black uppercase italic tracking-tight">Growth Insight</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                 Your instance usage has increased by <span className="text-emerald-400 font-bold">24%</span> this month. Consider upgrading to the <span className="text-white font-bold">Enterprise Protocol</span> to unlock higher AI throughput and live monitoring.
              </p>
              <button className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                 View Detailed Analytics
              </button>
           </div>
        </div>

        {/* RESOURCE UTILIZATION */}
        <div className="xl:col-span-2 space-y-10">
           <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                    <Activity className="text-blue-600" size={28} /> Resource Utilization
                 </h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 italic">Instance Real-time</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <UsageBlock 
                    label="Agent Slots" 
                    current={usage?.users?.current} 
                    limit={usage?.users?.limit} 
                    color="blue" 
                    icon={Users}
                 />
                 <UsageBlock 
                    label="Lead Protocol" 
                    current={usage?.leads?.current} 
                    limit={usage?.leads?.limit} 
                    color="indigo" 
                    icon={Target}
                 />
                 <UsageBlock 
                    label="Neural Tokens" 
                    current={usage?.aiTokens?.current} 
                    limit={usage?.aiTokens?.limit} 
                    color="violet" 
                    icon={Cpu}
                    isToken
                 />
              </div>
           </div>

           {/* PAYMENT HISTORY */}
           <div className="bg-white rounded-[56px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                    <FileText className="text-blue-600" size={28} /> Financial Ledger
                 </h3>
                 <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">Download Statements</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white">
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Invoice</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Billing Point</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gross Amount</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Vault</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {invoices?.length > 0 ? invoices.map((inv, i) => (
                         <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                     <FileText size={18} />
                                  </div>
                                  <span className="font-black text-sm text-[#0F172A] uppercase tracking-tight">#{inv.invoiceNo}</span>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase">{new Date(inv.billingDate).toLocaleDateString()}</td>
                            <td className="px-10 py-6 text-sm font-black text-[#0F172A] italic uppercase tracking-tighter">₹{inv.amount.toLocaleString()}</td>
                            <td className="px-10 py-6">
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                  {inv.status}
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                               <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-[#0F172A] hover:text-white transition-all">
                                  <Download size={16} />
                               </button>
                            </td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan={5} className="px-10 py-20 text-center">
                               <div className="flex flex-col items-center gap-4 opacity-20">
                                  <AlertCircle size={48} />
                                  <p className="text-xs font-black uppercase tracking-[0.3em] italic">Vault is currently empty</p>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* UPGRADE MODAL */}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plans={plans}
        currentPlanId={plan?.id}
        onUpgrade={(id) => upgradeMutation.mutate(id)}
        isPending={upgradeMutation.isPending}
      />
    </div>
  );
};

const UsageBlock = ({ label, current, limit, color, icon: Icon, isToken }) => {
  const percentage = Math.min((current / limit) * 100, 100);
  const colors = {
    blue: 'bg-blue-600 shadow-blue-500/20',
    indigo: 'bg-indigo-600 shadow-indigo-500/20',
    violet: 'bg-violet-600 shadow-violet-500/20'
  };

  const formatValue = (val) => {
    if (!val) return '0';
    if (isToken && val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
       <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
             <Icon size={20} />
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-[#0F172A] italic">{formatValue(current)} <span className="text-slate-400">/ {limit >= 9999 ? '∞' : formatValue(limit)}</span></p>
          </div>
       </div>
       <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <span>{label}</span>
             <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-[2px]">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${percentage}%` }}
               transition={{ duration: 1.5, ease: "circOut" }}
               className={`h-full ${colors[color]} rounded-full shadow-lg`}
             />
          </div>
       </div>
    </div>
  );
};

const UpgradeModal = ({ isOpen, onClose, plans, currentPlanId, onUpgrade, isPending }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-2xl"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-6xl bg-white rounded-[64px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
             <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                   <h3 className="text-3xl font-black text-[#0F172A] tracking-tight italic uppercase">Select Upgrade Protocol</h3>
                   <p className="text-sm font-medium text-slate-500 mt-2">Scale your instance resources instantly with automated provisioning.</p>
                </div>
                <button onClick={onClose} className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                   <X size={24} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {plans?.map(plan => (
                     <div 
                       key={plan.id}
                       className={`p-10 rounded-[48px] border-2 transition-all duration-500 flex flex-col h-full relative group ${
                         currentPlanId === plan.id 
                         ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-2xl scale-105' 
                         : 'bg-white border-slate-100 hover:border-blue-600 text-slate-900 hover:bg-slate-50'
                       }`}
                     >
                        {currentPlanId === plan.id && (
                          <div className="absolute top-8 right-10 flex items-center gap-2 px-4 py-1.5 bg-blue-600 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                            <ShieldCheck size={12} /> Active
                          </div>
                        )}
                        <div className="mb-10">
                           <h5 className="text-2xl font-black uppercase italic tracking-tight">{plan.name}</h5>
                           <p className={`text-4xl font-black italic mt-4 ${currentPlanId === plan.id ? 'text-blue-400' : 'text-[#0F172A]'}`}>₹{plan.priceMonthly.toLocaleString()}<span className="text-xs opacity-50 not-italic tracking-widest ml-2">/mo</span></p>
                        </div>
                        <div className="space-y-4 mb-12 flex-1">
                           <PlanFeature label="Agent Capacity" value={plan.userLimit >= 9999 ? 'Unlimited' : plan.userLimit} dark={currentPlanId === plan.id} />
                           <PlanFeature label="Global Lead Cap" value={plan.leadLimit >= 1000000 ? 'Unlimited' : `${(plan.leadLimit / 1000).toFixed(0)}k`} dark={currentPlanId === plan.id} />
                           <PlanFeature label="Neural Tokens" value={`${(plan.aiTokenLimit / 1000).toFixed(0)}k`} dark={currentPlanId === plan.id} />
                        </div>
                        <button 
                          disabled={isPending || currentPlanId === plan.id}
                          onClick={() => onUpgrade(plan.id)}
                          className={`w-full h-16 rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] italic shadow-xl transition-all ${
                            currentPlanId === plan.id 
                            ? 'bg-emerald-500 text-white cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                           {isPending ? 'Syncing...' : currentPlanId === plan.id ? 'Current Protocol' : `Activate ${plan.name}`}
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PlanFeature = ({ label, value, dark }) => (
  <div className="flex items-center justify-between border-b border-slate-100/10 pb-4">
     <span className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{label}</span>
     <span className={`text-sm font-black italic uppercase ${dark ? 'text-white' : 'text-[#0F172A]'}`}>{value}</span>
  </div>
);

export default AdminBilling;
