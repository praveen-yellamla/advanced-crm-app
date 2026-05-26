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

  const handleDownloadInvoice = async (invoice) => {
    try {
      toast.loading('Preparing invoice...', { id: 'download' });
      const res = await api.get(`/billing/invoice/${invoice.id}/download`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Invoice downloaded!', { id: 'download' });
    } catch (e) {
      console.error('Download error:', e);
      toast.error('Failed to download invoice', { id: 'download' });
    }
  };

  // Handle Plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutStep('SUMMARY');
  };

  const closeCheckout = () => {
    setCheckoutStep(null);
    setSelectedPlan(null);
  };

  if (isDetailsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
       <div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
       <p className="text-xs font-semibold text-slate-500">Loading Billing Details...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Subscriptions</h1>
           <p className="text-slate-500 text-sm mt-1">Manage your plan, limits, and payment history.</p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-lg">
           {['overview', 'invoices'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                 activeTab === tab ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* CURRENT STATUS */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">Current Plan</span>
                        <h2 className="text-2xl font-bold text-slate-900 mt-1">{currentPlan?.name || 'Starter'}</h2>
                     </div>
                     <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        subscription?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                     }`}>
                        {subscription?.status || 'Active'}
                     </span>
                  </div>

                  <div className="space-y-4 py-4 border-y border-slate-100">
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Billing Cycle</span>
                        <span className="text-sm font-medium text-slate-900 capitalize">{subscription?.billingCycle?.toLowerCase() || 'Monthly'}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Next Renewal</span>
                        <span className="text-sm font-medium text-slate-900">
                           {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Amount</span>
                        <span className="text-sm font-medium text-slate-900">
                           ₹{currentPlan ? (subscription?.billingCycle === 'YEARLY' ? currentPlan.priceYearly : currentPlan.priceMonthly).toLocaleString() : '0'}
                        </span>
                     </div>
                  </div>

                  <button 
                    onClick={() => setCheckoutStep('PLAN')}
                    className="w-full mt-6 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Change Plan
                  </button>
               </div>

               {/* QUICK STATS */}
               <div className="bg-slate-900 p-6 rounded-xl shadow-sm text-white">
                  <div className="flex items-center gap-3 mb-6">
                     <TrendingUp size={18} className="text-[#6366f1]" />
                     <h3 className="text-sm font-semibold">Plan Limits</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs text-slate-400 mb-1">Total Agents</p>
                        <p className="text-xl font-bold">{subscription?.agentLimit || 0}</p>
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 mb-1">Leads Database</p>
                        <p className="text-xl font-bold">{(subscription?.leadLimit / 1000).toFixed(0) || 0}k</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* RESOURCE USAGE & TRANSACTIONS */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-6">Resource Usage</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <UsageBlock label="Active Agents" current={subscription?.users?.current} limit={subscription?.agentLimit} color="bg-[#6366f1]" icon={Users} />
                     <UsageBlock label="Leads Database" current={subscription?.leads?.current} limit={subscription?.leadLimit} color="bg-emerald-500" icon={Target} />
                     <UsageBlock label="AI Tokens (Monthly)" current={subscription?.aiTokens?.current} limit={subscription?.aiTokenLimit} color="bg-violet-500" icon={Cpu} isToken />
                  </div>
               </div>

               {/* RECENT TRANSACTIONS */}
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
                     <FileText size={18} className="text-slate-400" />
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-200">
                              <th className="px-6 py-3 font-semibold text-slate-500">Description</th>
                              <th className="px-6 py-3 font-semibold text-slate-500">Date</th>
                              <th className="px-6 py-3 font-semibold text-slate-500">Amount</th>
                              <th className="px-6 py-3 font-semibold text-slate-500">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {transactions?.length > 0 ? transactions.map((tx, i) => (
                             <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                   <p className="font-medium text-slate-900">{tx.description || 'Plan Upgrade'}</p>
                                   <p className="text-xs text-slate-500 mt-0.5 font-mono">{tx.transactionId}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">₹{tx.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                                     tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                   }`}>
                                      {tx.status}
                                   </span>
                                </td>
                             </tr>
                           )) : (
                             <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No transaction history found</td></tr>
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-base font-bold text-slate-900">Invoices</h3>
               <button onClick={() => toast.success('Downloading...')} className="text-sm font-medium text-[#6366f1] hover:text-[#4f46e5]">Download All</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-6 py-3 font-semibold text-slate-500">Invoice ID</th>
                        <th className="px-6 py-3 font-semibold text-slate-500">Billing Period</th>
                        <th className="px-6 py-3 font-semibold text-slate-500">Amount</th>
                        <th className="px-6 py-3 font-semibold text-slate-500">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {invoices?.length > 0 ? invoices.map(inv => (
                       <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-slate-900">{inv.invoiceNo}</td>
                          <td className="px-6 py-4 text-slate-600">
                             {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">₹{inv.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">Paid</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button onClick={() => handleDownloadInvoice(inv)} className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <Download size={16} />
                             </button>
                          </td>
                       </tr>
                     )) : (
                       <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No invoices generated yet</td></tr>
                     )}
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

  const formatValue = (val) => {
    if (isToken && val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val?.toLocaleString() || '0';
  };

  return (
    <div className="space-y-4 group">
       <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
             <Icon size={16} />
          </div>
          <div>
             <p className="text-sm font-semibold text-slate-900">{formatValue(current)} <span className="text-slate-400 font-normal">/ {limit >= 9999 ? 'Unlimited' : formatValue(limit)}</span></p>
             <p className="text-xs text-slate-500">{label}</p>
          </div>
       </div>
       <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-500">
             <span>Used</span>
             <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }} className={`h-full ${color} rounded-full`} />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center gap-4 sm:gap-8">
              <StepIndicator num="1" label="Select Plan" active={step === 'PLAN'} completed={['SUMMARY', 'PAYMENT', 'SUCCESS'].includes(step)} />
              <ChevronRight size={14} className="text-slate-300 hidden sm:block" />
              <StepIndicator num="2" label="Review Order" active={step === 'SUMMARY'} completed={['PAYMENT', 'SUCCESS'].includes(step)} />
              <ChevronRight size={14} className="text-slate-300 hidden sm:block" />
              <StepIndicator num="3" label="Payment" active={step === 'PAYMENT'} completed={step === 'SUCCESS'} />
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50/50">
           <AnimatePresence mode="wait">
             {step === 'PLAN' && (
               <motion.div key="step-plan" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="text-center mb-10 space-y-3">
                     <h2 className="text-2xl font-bold text-slate-900">Upgrade your workspace</h2>
                     <p className="text-slate-500 text-sm">Get more limits and advanced AI features for your entire team.</p>
                     
                     <div className="inline-flex items-center gap-3 mt-6 bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => setBillingCycle('MONTHLY')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${billingCycle === 'MONTHLY' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           Monthly
                        </button>
                        <button 
                          onClick={() => setBillingCycle('YEARLY')}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           Annually <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">Save 20%</span>
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {plans?.map(plan => (
                       <div 
                         key={plan.id}
                         className={`p-6 rounded-2xl border transition-all flex flex-col bg-white relative ${
                           currentPlan?.id === plan.id 
                           ? 'border-[#6366f1] ring-1 ring-[#6366f1] shadow-md' 
                           : 'border-slate-200 hover:border-slate-300 shadow-sm'
                         }`}
                       >
                          {currentPlan?.id === plan.id && (
                             <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-[#6366f1] rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                <ShieldCheck size={12} /> Current
                             </div>
                          )}
                          <div className="mb-6">
                             <h5 className="text-lg font-bold text-slate-900">{plan.name}</h5>
                             <div className="flex items-end gap-1 mt-3">
                                <span className="text-3xl font-bold text-slate-900">
                                   ₹{billingCycle === 'YEARLY' ? plan.priceYearly.toLocaleString() : plan.priceMonthly.toLocaleString()}
                                </span>
                                <span className="text-sm text-slate-500 mb-1">{billingCycle === 'YEARLY' ? '/yr' : '/mo'}</span>
                             </div>
                             {billingCycle === 'YEARLY' && (
                               <p className="text-xs text-slate-500 mt-1">Billed ₹{plan.priceYearly.toLocaleString()} annually</p>
                             )}
                          </div>
                          
                          <div className="space-y-4 mb-8 flex-1">
                             <FeatureItem label={`${plan.userLimit >= 9999 ? 'Unlimited' : plan.userLimit} Team Agents`} />
                             <FeatureItem label={`${plan.leadLimit >= 1000000 ? 'Unlimited' : `${(plan.leadLimit / 1000).toFixed(0)}k`} Leads Database`} />
                             <FeatureItem label={`${(plan.aiTokenLimit / 1000).toFixed(0)}k AI Request Tokens`} />
                             <FeatureItem label="Standard CRM Features" />
                             {plan.priceMonthly > 0 && <FeatureItem label="Advanced Call Analytics" />}
                          </div>

                          <button 
                            disabled={currentPlan?.id === plan.id}
                            onClick={() => onSelectPlan(plan)}
                            className={`w-full h-10 rounded-lg text-sm font-semibold transition-colors ${
                              currentPlan?.id === plan.id 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-[#6366f1] text-white hover:bg-[#4f46e5]'
                            }`}
                          >
                             {currentPlan?.id === plan.id ? 'Active Plan' : 'Select Plan'}
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

const StepIndicator = ({ num, label, active, completed }) => (
  <div className="flex items-center gap-2.5">
     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
       active ? 'bg-[#6366f1] text-white ring-4 ring-[#6366f1]/20' 
       : completed ? 'bg-emerald-500 text-white' 
       : 'bg-slate-100 text-slate-400'
     }`}>
        {completed ? <Check size={12} /> : num}
     </div>
     <span className={`text-sm font-medium hidden sm:block ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const FeatureItem = ({ label }) => (
  <div className="flex items-start gap-3">
    <CheckCircle2 size={16} className="text-[#6366f1] shrink-0 mt-0.5" />
    <span className="text-sm text-slate-600">{label}</span>
  </div>
);

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
        toast.error('Failed to calculate invoice data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [plan, cycle]);

  if (isLoading) return <div className="p-20 flex justify-center"><RefreshCw className="animate-spin text-[#6366f1]" size={24} /></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
             <p className="text-sm text-slate-500 mt-1">Review your plan upgrade details before payment.</p>
          </div>

          <div className="p-6 space-y-6">
             {/* Plan Details */}
             <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                   <p className="font-semibold text-slate-900">{plan.name} Plan <span className="text-slate-500 font-normal">({cycle.toLowerCase()})</span></p>
                   {summaryData?.prorationCredit > 0 && (
                     <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                       <Info size={12} /> Prorated credit applied for remaining days on {currentPlan?.name}.
                     </p>
                   )}
                </div>
                <p className="font-medium text-slate-900">₹{summaryData?.subtotal.toLocaleString()}</p>
             </div>

             {/* Line Items */}
             <div className="space-y-3 pb-6 border-b border-slate-100">
                {summaryData?.prorationCredit > 0 && (
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Unused Time Credit</span>
                     <span className="text-emerald-600">-₹{summaryData?.prorationCredit.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Taxes (GST 18%)</span>
                   <span className="text-slate-900">₹{summaryData?.tax.toLocaleString()}</span>
                </div>
             </div>

             {/* Total */}
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-sm font-semibold text-slate-900">Total Due Today</p>
                   <p className="text-xs text-slate-500 mt-1">Next charge on {new Date(summaryData?.nextBillingDate).toLocaleDateString()}</p>
                </div>
                <span className="text-3xl font-bold text-slate-900">₹{summaryData?.total.toLocaleString()}</span>
             </div>
          </div>
       </div>

       <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
             Back
          </button>
          <button onClick={onProceed} className="flex-1 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors flex items-center justify-center gap-2">
             Continue to Payment <ArrowRight size={16} />
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
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Check your connection.');
        setIsProcessing(false);
        return;
      }

      const res = await api.post('/billing/initiate-upgrade', { planId: plan.id, billingCycle: cycle });
      const { order, key } = res.data.data;
      const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        toast.error('Payment Configuration Error: Missing API Key.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Advanced CRM',
        description: `${plan.name} Plan Activation`,
        order_id: order.id,
        handler: async function (response) {
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
            toast.dismiss();
            toast.error(err.response?.data?.message || 'Verification failed. Contact support.');
            setIsProcessing(false);
          }
        },
        prefill: { name: 'CRM Admin', email: 'admin@advancedcrm.app' },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

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
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock size={18} />
             </div>
             <div>
                <h3 className="text-base font-bold text-slate-900">Secure Payment</h3>
                <p className="text-xs text-slate-500">Encrypted via Razorpay checkout</p>
             </div>
          </div>

          <div className="p-6 space-y-4">
             <PaymentMethod icon={Wallet} label="UPI & Net Banking" desc="Google Pay, PhonePe, and major banks supported." active />
             <PaymentMethod icon={CardIcon} label="Credit / Debit Card" desc="Visa, Mastercard, RuPay, Amex supported." />
          </div>
       </div>

       <div className="flex gap-4">
          <button disabled={isProcessing} onClick={onBack} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
             Back
          </button>
          <button disabled={isProcessing} onClick={handlePayment} className="flex-1 bg-[#0F172A] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
             {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Proceed to Pay</>}
          </button>
       </div>
    </motion.div>
  );
};

const PaymentMethod = ({ icon: Icon, label, desc, active }) => (
  <div className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 cursor-pointer ${active ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-slate-100 hover:border-slate-200'}`}>
     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[#6366f1] text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={20} />
     </div>
     <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
     </div>
     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#6366f1]' : 'border-slate-200'}`}>
        {active && <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />}
     </div>
  </div>
);

/**
 * STEP 4: SUCCESS SCREEN
 */
const SuccessScreen = ({ plan, cycle, onClose }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 max-w-md mx-auto">
     <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={40} />
     </div>
     
     <h2 className="text-2xl font-bold text-slate-900 mb-2">Upgrade Successful!</h2>
     <p className="text-slate-500 text-sm mb-8">You are now on the <span className="font-semibold text-slate-900">{plan.name}</span> plan.</p>

     <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-left space-y-4 mb-8">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
           <span className="text-sm text-slate-500">Transaction Ref</span>
           <span className="text-sm font-mono text-slate-900">{Date.now().toString().slice(-10)}</span>
        </div>
        <div className="flex justify-between items-center">
           <span className="text-sm text-slate-500">Next Billing</span>
           <span className="text-sm font-medium text-slate-900">{cycle === 'YEARLY' ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString() : new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</span>
        </div>
     </div>

     <button onClick={() => { onClose(); window.location.reload(); }} className="w-full h-11 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors">
        Return to Dashboard
     </button>
  </motion.div>
);

export default AdminBilling;
