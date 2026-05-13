import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  CreditCard, Zap, Calendar, CheckCircle2, ArrowUpRight, Clock, FileText,
  Download, AlertCircle, Activity, ShieldCheck, ChevronRight, TrendingUp,
  Database, Users, Cpu, Target, X, Check, Lock, Info, ArrowRight,
  RefreshCw, IndianRupee, Wallet, CreditCard as CardIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * PRODUCTION SUBSCRIPTION SYSTEM
 * Redesigned for Top SaaS Grade Experience
 */
const AdminBilling = () => {
  const queryClient = useQueryClient();
  const [checkoutStep, setCheckoutStep] = useState(null); // 'PLAN', 'SUMMARY', 'PAYMENT', 'SUCCESS'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [checkoutData, setCheckoutData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: billingDetails, isLoading: isDetailsLoading } = useQuery({
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

  const { subscription, invoices, transactions } = billingDetails || {};
  const currentPlan = subscription?.plan;

  // Handle Plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutStep('SUMMARY');
  };

  const closeCheckout = () => {
    setCheckoutStep(null);
    setSelectedPlan(null);
    setCheckoutData(null);
  };

  if (isDetailsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Billing Infrastructure...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tight uppercase italic">Account Billing</h1>
           <p className="text-[#64748B] font-bold text-sm uppercase tracking-widest mt-2">Manage subscription lifecycle and enterprise resource limits.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
           {['overview', 'invoices', 'security'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-10"
          >
            {/* CURRENT STATUS */}
            <div className="xl:col-span-1 space-y-10">
               <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                     <Zap size={120} />
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Current Subscription</span>
                     <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">{currentPlan?.name || 'Starter'} Plan</h2>
                  </div>

                  <div className="py-8 border-y border-slate-100 space-y-6 relative z-10">
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                        <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                           {subscription?.status || 'ACTIVE'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Billing Cycle</span>
                        <span className="text-xs font-black text-[#0F172A] uppercase">{subscription?.billingCycle || 'MONTHLY'}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Next Renewal</span>
                        <span className="text-xs font-black text-[#0F172A] flex items-center gap-2 uppercase italic">
                           <Clock size={14} className="text-blue-500" />
                           {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                        </span>
                     </div>
                  </div>

                  <button 
                    onClick={() => setCheckoutStep('PLAN')}
                    className="w-full h-16 bg-[#0F172A] text-white rounded-[24px] font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Change Subscription
                  </button>
               </div>

               {/* QUICK STATS */}
               <div className="bg-blue-600 p-10 rounded-[56px] shadow-2xl text-white space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="flex items-center gap-4">
                     <TrendingUp size={24} className="text-blue-200" />
                     <h3 className="text-xl font-black uppercase italic">Growth Snapshot</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Agents</p>
                        <p className="text-2xl font-black">{subscription?.agentLimit || 0}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Leads</p>
                        <p className="text-2xl font-black">{((subscription?.leadLimit || 0) / 1000).toFixed(0)}k</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                     View Feature Breakdown
                  </button>
               </div>
            </div>

            {/* RESOURCE USAGE */}
            <div className="xl:col-span-2 space-y-10">
               <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm space-y-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                        <Activity className="text-blue-600" size={28} /> Resource Utilization
                     </h3>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 italic">Global Cluster v2</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                     <UsageBlock label="Agent Slots" current={subscription?.users?.current} limit={subscription?.agentLimit} color="blue" icon={Users} />
                     <UsageBlock label="Database Rows" current={subscription?.leads?.current} limit={subscription?.leadLimit} color="indigo" icon={Target} />
                     <UsageBlock label="Neural Tokens" current={subscription?.aiTokens?.current} limit={subscription?.aiTokenLimit} color="violet" icon={Cpu} isToken />
                  </div>
               </div>

               {/* RECENT TRANSACTIONS */}
               <div className="bg-white rounded-[56px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Recent Ledger</h3>
                     <FileText size={24} className="text-slate-300" />
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50">
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {transactions?.length > 0 ? transactions.map((tx, i) => (
                             <tr key={tx.id} className="hover:bg-slate-50 transition-all group">
                                <td className="px-10 py-6">
                                   <p className="text-xs font-black text-[#0F172A] uppercase">{tx.description || 'Plan Upgrade'}</p>
                                   <p className="text-[9px] text-slate-400 font-bold tracking-tight">{tx.transactionId}</p>
                                </td>
                                <td className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase italic">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                <td className="px-10 py-6 font-black text-[#0F172A] italic italic">₹{tx.amount.toLocaleString()}</td>
                                <td className="px-10 py-6">
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                     tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                   }`}>
                                      {tx.status}
                                   </span>
                                </td>
                             </tr>
                           )) : (
                             <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No transaction history detected</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[56px] border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Invoice List */}
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="text-2xl font-black text-[#0F172A] uppercase italic">Invoicing History</h3>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Bulk Download</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-10 py-6 text-right"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {invoices?.map(inv => (
                       <tr key={inv.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-10 py-6">
                             <span className="font-black text-xs text-[#0F172A]">{inv.invoiceNo}</span>
                          </td>
                          <td className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase">
                             {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                          </td>
                          <td className="px-10 py-6 font-black text-[#0F172A]">₹{inv.amount.toLocaleString()}</td>
                          <td className="px-10 py-6">
                             <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">{inv.status}</span>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center ml-auto">
                                <Download size={16} />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT WIZARD */}
      <CheckoutWizard 
        step={checkoutStep}
        onClose={closeCheckout}
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={handleSelectPlan}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        currentPlan={currentPlan}
        setStep={setCheckoutStep}
        onSuccess={() => {
           queryClient.invalidateQueries(['billingOverview']);
           setCheckoutStep('SUCCESS');
        }}
      />
    </div>
  );
};

const UsageBlock = ({ label, current = 0, limit = 1, color, icon: Icon, isToken }) => {
  const percentage = Math.min((current / limit) * 100, 100);
  const colors = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    violet: 'bg-violet-600'
  };

  const formatValue = (val) => {
    if (isToken && val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val?.toLocaleString() || '0';
  };

  return (
    <div className="space-y-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
       <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform shadow-sm">
             <Icon size={20} />
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-[#0F172A] italic">{formatValue(current)} <span className="text-slate-400">/ {limit >= 9999 ? '∞' : formatValue(limit)}</span></p>
          </div>
       </div>
       <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
             <span>{label}</span>
             <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-[2px]">
             <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5 }} className={`h-full ${colors[color]} rounded-full`} />
          </div>
       </div>
    </div>
  );
};

/**
 * MULTI-STEP CHECKOUT WIZARD
 */
const CheckoutWizard = ({ step, onClose, plans, selectedPlan, onSelectPlan, billingCycle, setBillingCycle, currentPlan, setStep, onSuccess }) => {
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-7xl bg-[#F8FAFC] rounded-[64px] shadow-2xl overflow-hidden flex flex-col max-h-full"
      >
        {/* WIZARD HEADER */}
        <div className="px-12 py-10 flex items-center justify-between border-b border-slate-200 bg-white">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'PLAN' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {['SUMMARY', 'PAYMENT', 'SUCCESS'].includes(step) ? <Check size={14} /> : '1'}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'PLAN' ? 'text-blue-600' : 'text-slate-400'}`}>Plan</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
              <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'SUMMARY' ? 'bg-blue-600 text-white' : ['PAYMENT', 'SUCCESS'].includes(step) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {['PAYMENT', 'SUCCESS'].includes(step) ? <Check size={14} /> : '2'}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'SUMMARY' ? 'text-blue-600' : 'text-slate-400'}`}>Review</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
              <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'PAYMENT' ? 'bg-blue-600 text-white' : step === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {step === 'SUCCESS' ? <Check size={14} /> : '3'}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'PAYMENT' ? 'text-blue-600' : 'text-slate-400'}`}>Payment</span>
              </div>
           </div>
           <button onClick={onClose} className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all">
              <X size={24} />
           </button>
        </div>

        {/* WIZARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-12">
           <AnimatePresence mode="wait">
             {step === 'PLAN' && (
               <motion.div key="step-plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-16 space-y-4">
                     <h2 className="text-5xl font-black text-[#0F172A] uppercase italic tracking-tight leading-none">Choose Your Trajectory</h2>
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Unlock enterprise-grade throughput and AI intelligence.</p>
                     
                     <div className="flex items-center justify-center gap-4 mt-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${billingCycle === 'MONTHLY' ? 'text-blue-600' : 'text-slate-400'}`}>Monthly</span>
                        <button 
                          onClick={() => setBillingCycle(prev => prev === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                          className="w-16 h-8 bg-slate-200 rounded-full p-1 relative flex items-center"
                        >
                           <motion.div 
                             animate={{ x: billingCycle === 'YEARLY' ? 32 : 0 }}
                             className="w-6 h-6 bg-white rounded-full shadow-md" 
                           />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${billingCycle === 'YEARLY' ? 'text-blue-600' : 'text-slate-400'}`}>Yearly <span className="text-emerald-500 text-[8px] bg-emerald-50 px-2 py-0.5 rounded-full ml-1">-20% SAVINGS</span></span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                     {plans?.map(plan => (
                       <div 
                         key={plan.id}
                         className={`p-10 rounded-[48px] border-2 transition-all duration-500 flex flex-col h-full relative group ${
                           currentPlan?.id === plan.id 
                           ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-2xl scale-105' 
                           : 'bg-white border-slate-200 hover:border-blue-600 text-slate-900 hover:bg-slate-50'
                         }`}
                       >
                          {currentPlan?.id === plan.id && (
                             <div className="absolute top-8 right-10 flex items-center gap-2 px-4 py-1.5 bg-blue-600 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                                <ShieldCheck size={12} /> Active Plan
                             </div>
                          )}
                          <div className="mb-10">
                             <h5 className="text-2xl font-black uppercase italic tracking-tight">{plan.name}</h5>
                             <div className="flex items-baseline gap-2 mt-4">
                                <span className={`text-5xl font-black italic ${currentPlan?.id === plan.id ? 'text-blue-400' : 'text-[#0F172A]'}`}>
                                   ₹{billingCycle === 'YEARLY' ? plan.priceYearly.toLocaleString() : plan.priceMonthly.toLocaleString()}
                                </span>
                                <span className="text-xs opacity-50 font-black uppercase tracking-widest">/{billingCycle === 'YEARLY' ? 'yr' : 'mo'}</span>
                             </div>
                          </div>
                          
                          <div className="space-y-4 mb-12 flex-1">
                             <div className="flex items-center justify-between pb-4 border-b border-slate-100/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Slots</span>
                                <span className="text-sm font-black italic uppercase">{plan.userLimit >= 9999 ? 'Unlimited' : plan.userLimit}</span>
                             </div>
                             <div className="flex items-center justify-between pb-4 border-b border-slate-100/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Database</span>
                                <span className="text-sm font-black italic uppercase">{plan.leadLimit >= 1000000 ? 'Unlimited' : `${(plan.leadLimit / 1000).toFixed(0)}k`}</span>
                             </div>
                             <div className="flex items-center justify-between pb-4 border-b border-slate-100/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Tokens</span>
                                <span className="text-sm font-black italic uppercase">{`${(plan.aiTokenLimit / 1000).toFixed(0)}k`}</span>
                             </div>
                          </div>

                          <button 
                            disabled={currentPlan?.id === plan.id}
                            onClick={() => onSelectPlan(plan)}
                            className={`w-full h-16 rounded-[28px] text-[11px] font-black uppercase tracking-widest italic shadow-xl transition-all ${
                              currentPlan?.id === plan.id 
                              ? 'bg-emerald-500 text-white cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                            }`}
                          >
                             {currentPlan?.id === plan.id ? 'Current Plan' : `Activate ${plan.name}`}
                          </button>
                       </div>
                     ))}
                  </div>
               </motion.div>
             )}

             {step === 'SUMMARY' && (
               <CheckoutSummary key="step-summary" plan={selectedPlan} cycle={billingCycle} currentPlan={currentPlan} onBack={() => setStep('PLAN')} onProceed={() => setStep('PAYMENT')} />
             )}

             {step === 'PAYMENT' && (
               <PaymentGateway key="step-payment" plan={selectedPlan} cycle={billingCycle} onBack={() => setStep('SUMMARY')} onSuccess={onSuccess} />
             )}

             {step === 'SUCCESS' && (
               <SuccessScreen key="step-success" plan={selectedPlan} cycle={billingCycle} onClose={onClose} />
             )}
           </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * STEP 2: SUMMARY SCREEN
 */
const CheckoutSummary = ({ plan, cycle, currentPlan, onBack, onProceed }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/billing/checkout-summary?planId=${plan.id}&billingCycle=${cycle}`);
        setSummaryData(res.data.data);
      } catch (e) {
        toast.error('Failed to calculate proration data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [plan, cycle]);

  if (isLoading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto text-blue-600 mb-4" size={48} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculating Proration Ledger...</p></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto space-y-10">
       <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm space-y-10">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck size={32} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-[#0F172A] uppercase italic">Order Summary</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Migrating to {plan.name} Infrastructure</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Plan</p>
                   <p className="text-lg font-black text-[#0F172A] uppercase italic">{currentPlan?.name || 'Starter'}</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl space-y-2 border border-blue-100">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Upgrading To</p>
                   <p className="text-lg font-black text-blue-900 uppercase italic">{plan.name} ({cycle})</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase italic">
                   <Info size={16} className="text-blue-500" />
                   {summaryData?.remainingDays > 0 ? `${summaryData.remainingDays} days remaining in current cycle applied as credit.` : 'Immediate effective activation.'}
                </div>
             </div>

             <div className="bg-slate-900 rounded-3xl p-10 text-white space-y-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-8 opacity-5">
                   <IndianRupee size={120} />
                </div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Financial Breakdown</h4>
                <div className="space-y-4">
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Subtotal</span>
                      <span className="text-white">₹{summaryData?.subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Proration Credit</span>
                      <span className="text-emerald-400">-₹{summaryData?.prorationCredit.toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Tax (GST 18%)</span>
                      <span className="text-white">₹{summaryData?.tax.toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-white/10 my-6" />
                   <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Payable</span>
                      <span className="text-4xl font-black italic text-white">₹{summaryData?.total.toLocaleString()}</span>
                   </div>
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                   Next billing date: <span className="text-white">{new Date(summaryData?.nextBillingDate).toLocaleDateString()}</span>. Auto-renewal enabled by default.
                </p>
             </div>
          </div>
       </div>

       <div className="flex gap-6">
          <button onClick={onBack} className="h-20 px-12 bg-white border border-slate-200 rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
             <ChevronRight size={18} className="rotate-180" /> Change Plan
          </button>
          <button onClick={onProceed} className="flex-1 h-20 bg-blue-600 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest italic shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:translate-x-2 transition-all flex items-center justify-center gap-4">
             Secure Payment <ArrowRight size={20} />
          </button>
       </div>
    </motion.div>
  );
};

/**
 * STEP 3: PAYMENT GATEWAY
 */
const PaymentGateway = ({ plan, cycle, onBack, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay Script Dynamically
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Load SDK
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Check your connection.');
        setIsProcessing(false);
        return;
      }

      // 2. Initiate Upgrade Order on Backend
      console.log('[RAZORPAY] Contacting backend to initiate upgrade order...');
      const res = await api.post('/billing/initiate-upgrade', { 
        planId: plan.id, 
        billingCycle: cycle
      });
      const { order, proration, key } = res.data.data;
      console.log('[RAZORPAY] Order initiated:', order);

      const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        console.error('[RAZORPAY] CRITICAL ERROR: Razorpay Key ID is missing from both API response and environment variables.');
        toast.error('Payment Configuration Error: Missing API Key. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // 3. Open Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Advanced CRM',
        description: `Activation: ${plan.name} (${cycle})`,
        image: 'https://cdn-icons-png.flaticon.com/512/5968/5968322.png',
        order_id: order.id,
        handler: async function (response) {
          console.log('[RAZORPAY] Payment success, verifying signature...', response);
          // 4. Verify Payment on Backend
          try {
            toast.loading('Verifying secure transaction...');
            await api.post('/billing/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.dismiss();
            toast.success('Payment Verified & Plan Activated!');
            onSuccess();
          } catch (err) {
            console.error('[RAZORPAY] Verification Error:', err);
            toast.dismiss();
            toast.error(err.response?.data?.message || 'Verification failed. Contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: 'CRM Administrator',
          email: 'admin@advancedcrm.app'
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function() {
            console.log('[RAZORPAY] Payment modal dismissed by user');
            setIsProcessing(false);
            toast('Payment cancelled by user', { icon: 'ℹ️' });
          }
        }
      };

      console.log('[RAZORPAY] Launching Razorpay UI...');
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (e) {
      toast.error('Order Initialization Failed. Try again later.');
      setIsProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-10">
       <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm space-y-12">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={40} />
             </div>
             <h3 className="text-3xl font-black text-[#0F172A] uppercase italic">Secure Checkout</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Encrypted by Advanced CRM Shield</p>
          </div>

          <div className="space-y-6">
             <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest border-b border-slate-100 pb-2">Select Payment Protocol</p>
             <div className="grid grid-cols-1 gap-4">
                <PaymentMethod icon={Wallet} label="UPI / Net Banking" description="Fastest processing via Indian Banks" active />
                <PaymentMethod icon={CardIcon} label="Credit / Debit Cards" description="Visa, Mastercard, Amex supported" />
             </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-3xl flex items-start gap-4">
             <Info size={20} className="text-blue-500 shrink-0 mt-1" />
             <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                By clicking "Authorize Transaction", you agree to the Enterprise Terms of Service. Your card will be billed ₹{plan.priceMonthly.toLocaleString()} {cycle === 'YEARLY' ? 'annually' : 'monthly'} until cancelled.
             </p>
          </div>
       </div>

       <div className="flex gap-6">
          <button disabled={isProcessing} onClick={onBack} className="h-20 px-12 bg-white border border-slate-200 rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50">
             Cancel
          </button>
          <button 
            disabled={isProcessing}
            onClick={handlePayment}
            className="flex-1 h-20 bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
          >
             {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Authorize Transaction</>}
          </button>
       </div>
    </motion.div>
  );
};

const PaymentMethod = ({ icon: Icon, label, description, active }) => (
  <div className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
     <div className="flex items-center gap-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
           <Icon size={20} />
        </div>
        <div>
           <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-tight">{label}</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
        </div>
     </div>
     {active && <CheckCircle2 size={24} className="text-blue-600" />}
  </div>
);

/**
 * STEP 4: SUCCESS SCREEN
 */
const SuccessScreen = ({ plan, cycle, onClose }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-12 py-10 max-w-2xl mx-auto">
     <div className="relative">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
           <Check size={64} />
        </motion.div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
     </div>
     
     <div className="space-y-6">
        <h2 className="text-5xl font-black text-[#0F172A] uppercase italic italic tracking-tighter leading-none">System Activated</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Infrastructure successfully migrated to <span className="text-blue-600">{plan.name}</span> Protocol.</p>
     </div>

     <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
           <span className="text-xs font-black text-[#0F172A] uppercase italic tracking-tight">{Date.now().toString().slice(-12)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renewal Date</span>
           <span className="text-xs font-black text-[#0F172A]">{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</span>
        </div>
        <button className="w-full h-14 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3">
           <Download size={16} /> Download Activation Invoice
        </button>
     </div>

     <button onClick={() => { onClose(); window.location.reload(); }} className="h-20 w-full bg-[#0F172A] text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest italic shadow-xl hover:scale-105 transition-all">
        Enter Dashboard Workspace
     </button>
  </motion.div>
);

export default AdminBilling;
