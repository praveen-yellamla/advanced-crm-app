import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Clock, 
  Activity,
  UserCheck,
  Zap,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const LeadDetailModal = ({ isOpen, onClose, leadId }) => {
  const { data: lead, isLoading } = useQuery({
    queryKey: ['leadDetails', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await api.get(`/core/leads/${leadId}`);
      return res.data.data;
    },
    enabled: !!leadId
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {isLoading ? (
            <div className="p-20 text-center font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Identity...</div>
          ) : lead && (
            <>
              {/* HEADER */}
              <div className="p-10 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                    <img src={lead.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.customerName)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">{lead.customerName}</h2>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">ID: {lead.id}</span>
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">{lead.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10 scrollbar-hide">
                 {/* LEFT: CORE DATA */}
                 <div className="lg:col-span-1 space-y-8">
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <User size={14} /> Contact Information
                       </h3>
                       <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <DataField icon={Phone} label="Telephony" value={lead.phone} />
                          <DataField icon={Mail} label="Digital" value={lead.email || 'N/A'} />
                          <DataField icon={Globe} label="Source" value={lead.source} />
                          <DataField icon={UserCheck} label="Owner" value={lead.assignedTo?.name || 'Unassigned'} />
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Tag size={14} /> Attribution Data
                       </h3>
                       <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <DataField label="Campaign" value={lead.utmCampaign || 'Organic'} />
                          <DataField label="Medium" value={lead.utmMedium || 'Direct'} />
                          <DataField label="Source" value={lead.utmSource || 'N/A'} />
                       </div>
                    </section>
                 </div>

                 {/* RIGHT: ACTIVITY TIMELINE */}
                 <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Activity size={14} /> Intelligence Timeline
                    </h3>
                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                       {lead.activities?.map((activity, idx) => (
                         <div key={idx} className="relative">
                            <div className={`absolute -left-8 top-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm z-10 ${
                               activity.action === 'CREATE' ? 'bg-emerald-500 text-white' :
                               activity.action === 'STAGE_CHANGE' ? 'bg-amber-500 text-white' :
                               activity.action === 'ASSIGNMENT' ? 'bg-blue-500 text-white' :
                               'bg-slate-400 text-white'
                            }`}>
                               {activity.action === 'CREATE' ? <Zap size={12} /> : <Clock size={12} />}
                            </div>
                            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                               <div className="flex justify-between items-start mb-1">
                                  <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">{activity.action.replace('_', ' ')}</p>
                                  <span className="text-[10px] font-bold text-slate-400">{format(new Date(activity.createdAt), 'MMM dd, HH:mm')}</span>
                               </div>
                               <p className="text-xs font-medium text-slate-500">
                                  {activity.action === 'STAGE_CHANGE' ? (
                                    <>Transitioned from <span className="font-bold text-amber-600">{activity.oldValue}</span> to <span className="font-bold text-emerald-600">{activity.newValue}</span></>
                                  ) : activity.action === 'CREATE' ? (
                                    <>Lead identity initialized in the CRM core</>
                                  ) : (
                                    <span className="italic">{activity.newValue}</span>
                                  )}
                               </p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const DataField = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
        {Icon && <Icon size={14} className="text-slate-300" />}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-xs font-bold text-[#0F172A]">{value}</span>
  </div>
);

export default LeadDetailModal;
