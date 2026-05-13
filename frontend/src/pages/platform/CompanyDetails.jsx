import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Building2, 
  Users, 
  Target, 
  Database, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  ArrowLeft,
  ChevronRight,
  Zap,
  Globe,
  Lock,
  Mail,
  Phone,
  BarChart3,
  Settings,
  MoreVertical,
  Clock,
  HardDrive,
  Cpu,
  TrendingUp,
  CreditCard,
  History,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setImpersonationToken } = useAuth();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organizationDetails', id],
    queryFn: async () => {
      const res = await api.get(`/platform/organizations/${id}`);
      return res.data.data;
    }
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data) => api.patch(`/platform/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizationDetails', id]);
      toast.success('Company configuration updated');
    }
  });

  const handleAccessWorkspace = async () => {
    try {
      const loadingToast = toast.loading('Establishing Secure Support Access...');
      const res = await api.post(`/platform/organizations/${id}/access`);
      
      if (res.data.success) {
        const { token, redirectUrl } = res.data.data;
        setImpersonationToken(token);
        toast.dismiss(loadingToast);
        toast.success('Support Session Started');
        window.location.href = redirectUrl;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access Denied');
    }
  };

  const handleToggleStatus = () => {
    const newStatus = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    updateOrgMutation.mutate({ status: newStatus });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
       <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
       <p className="font-black uppercase tracking-[0.3em] text-slate-400 italic">Syncing Company Data...</p>
    </div>
  );

  if (!org) return (
    <div className="p-20 text-center space-y-6">
       <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto shadow-xl">
          <ShieldAlert size={48} />
       </div>
       <h3 className="text-3xl font-black uppercase italic text-rose-600">Company Not Found</h3>
       <button onClick={() => navigate('/platform/organizations')} className="h-14 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Return to Fleet</button>
    </div>
  );

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
           <button 
             onClick={() => navigate('/platform/organizations')}
             className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0F172A] hover:border-slate-400 hover:shadow-xl transition-all duration-500"
           >
              <ArrowLeft size={28} />
           </button>
           <div>
              <div className="flex items-center gap-4 mb-2">
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                   org.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {org.status}
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company ID: {String(org.id).slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">{org.name}</h1>
              <p className="text-blue-600 font-bold text-sm mt-2 flex items-center gap-2 uppercase tracking-widest">
                 <Globe size={14} /> workspace/{org.slug}
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={handleToggleStatus}
             className={`h-18 px-8 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
               org.status === 'SUSPENDED' 
               ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-xl' 
               : 'bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm'
             }`}
           >
              {org.status === 'SUSPENDED' ? <ShieldCheck size={20} /> : <Lock size={20} />}
              {org.status === 'SUSPENDED' ? 'Activate Company' : 'Suspend Company'}
           </button>
           <button 
             onClick={handleAccessWorkspace}
             className="h-18 px-12 bg-[#0F172A] text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] italic shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
           >
              <Zap size={20} className="text-blue-400" /> Support Access
           </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
         <MetricCard 
           label="Total Agents" 
           value={org._count?.users || 0} 
           limit={org.agentLimit} 
           icon={Users} 
           color="blue" 
           trend="+2 Active"
         />
         <MetricCard 
           label="Managed Leads" 
           value={org._count?.leads || 0} 
           limit={org.leadLimit} 
           icon={Target} 
           color="emerald" 
           trend="Sync Online"
         />
         <MetricCard 
           label="Billing Cycle" 
           value="ACTIVE" 
           limit="MONTHLY" 
           icon={CreditCard} 
           color="indigo" 
           trend="Last Paid: 12d"
         />
         <MetricCard 
           label="AI Usage" 
           value={`${((org.aiTokensUsed || 0) / 1000).toFixed(1)}k`} 
           limit={`${(org.aiTokenLimit / 1000).toFixed(0)}k`} 
           icon={Cpu} 
           color="amber" 
           trend="82% Capacity"
         />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         <div className="xl:col-span-2 space-y-10">
            {/* AUDIT LOG */}
            <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm space-y-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                  <Activity size={120} />
               </div>
               <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                       <History className="text-blue-600" size={28} /> Audit Log
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time Operations Activity</p>
                  </div>
                  <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All Activity</button>
               </div>
               
               <div className="space-y-4 relative z-10">
                  {org.recentLogs?.length > 0 ? org.recentLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-x-2 transition-all duration-300">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                             <Clock size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight">{log.action}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {new Date(log.createdAt).toLocaleString()} • {log.user?.name || 'SYSTEM'}
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300" size={20} />
                    </div>
                  )) : (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No audit history found for this company.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* BILLING HISTORY */}
            <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm space-y-12">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                     <FileText className="text-emerald-600" size={28} /> Billing History
                  </h3>
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">Status: Active</span>
               </div>

               <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-800/50">
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Invoice ID</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Billing Date</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Amount</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="text-white/80 font-mono text-xs">
                        {org.billingHistory?.length > 0 ? org.billingHistory.map((inv, i) => (
                          <tr key={i} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                             <td className="p-8 font-black text-blue-400 uppercase tracking-widest">#{inv.invoiceNo}</td>
                             <td className="p-8 opacity-60 uppercase">{new Date(inv.billingDate).toLocaleDateString()}</td>
                             <td className="p-8 text-emerald-400 font-bold italic">₹{inv.amount.toLocaleString()}</td>
                             <td className="p-8 text-right">
                                <span className={`px-3 py-1 rounded-lg font-black uppercase text-[9px] ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                   {inv.status}
                                </span>
                             </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="p-20 text-center text-slate-600 uppercase font-black tracking-widest italic opacity-40">No billing records found</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="space-y-10">
            {/* PLAN CARD */}
            <div className="bg-[#0F172A] p-12 rounded-[56px] shadow-2xl space-y-12 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all duration-1000" />
               
               <div className="relative z-10 space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Subscription Plan</span>
                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mt-1">{org.plan?.name || org.subscriptionTier}</h3>
                  </div>

                  <div className="space-y-6">
                     <StatusRow label="Account Status" value="Active - Verified" active />
                     <StatusRow label="Billing Cycle" value="Monthly - Auto" />
                     <StatusRow label="Renewal Date" value="24 May 2026" />
                     <StatusRow label="Data Residency" value="India (Central)" />
                     <StatusRow label="Security Tier" value="Enterprise (L3)" active />
                  </div>

                  <div className="pt-8 border-t border-white/10 space-y-4">
                     <button onClick={() => navigate('/platform/subscriptions')} className="w-full h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:scale-105 transition-all">
                        Upgrade Plan
                     </button>
                     <button className="w-full h-16 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                        Financial Statement
                     </button>
                  </div>
               </div>
            </div>

            {/* USAGE ANALYTICS */}
            <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm space-y-10">
               <h4 className="text-xl font-black text-[#0F172A] uppercase italic flex items-center gap-4">
                  <BarChart3 className="text-blue-600" size={24} /> Usage Analytics
               </h4>
               
               <div className="space-y-10">
                  <UsageBar label="Seat Usage" value={Math.min((org._count?.users / org.agentLimit) * 100, 100)} color="blue" />
                  <UsageBar label="Lead Capacity" value={Math.min((org._count?.leads / org.leadLimit) * 100, 100)} color="emerald" />
                  <UsageBar label="AI Token Usage" value={Math.min((org.aiTokensUsed / org.aiTokenLimit) * 100, 100) || 0} color="amber" />
                  <UsageBar label="Data Storage" value={32} color="violet" />
               </div>

               <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm">
                     <TrendingUp size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Forecast</p>
                     <p className="text-sm font-black text-[#0F172A] uppercase italic">Positive Scaling Detected</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, limit, icon: Icon, color, trend }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-700">
       <div className="flex items-center justify-between">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-sm ${colors[color]}`}>
             <Icon size={28} />
          </div>
          <div className="text-right">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cap Limit</span>
             <p className="text-lg font-black text-[#0F172A] italic">{limit}</p>
          </div>
       </div>
       <div>
          <div className="flex items-center justify-between mb-2">
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{label}</p>
             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
          </div>
          <p className="text-5xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">{value}</p>
       </div>
    </div>
  );
};

const StatusRow = ({ label, value, active }) => (
  <div className="flex items-center justify-between group">
     <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</span>
     <div className="flex items-center gap-3 text-right">
        <span className="text-[11px] font-black text-white italic uppercase tracking-wider">{value}</span>
        {active && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />}
     </div>
  </div>
);

const UsageBar = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-600 shadow-blue-500/30',
    emerald: 'bg-emerald-600 shadow-emerald-500/30',
    amber: 'bg-amber-600 shadow-amber-500/30',
    violet: 'bg-violet-600 shadow-violet-500/30'
  };

  return (
    <div className="space-y-3">
       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-slate-400 italic">{label}</span>
          <span className="text-[#0F172A]">{Math.round(value)}%</span>
       </div>
       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: "circOut" }}
            className={`h-full rounded-full shadow-lg ${colors[color]}`}
          />
       </div>
    </div>
  );
};

export default CompanyDetails;
