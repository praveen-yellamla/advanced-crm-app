import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LeadModal = ({ isOpen, onClose, lead = null }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    assignedToId: '',
    notes: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        customerName: lead.customerName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'WEBSITE',
        assignedToId: lead.assignedToId || '',
        notes: lead.notes || ''
      });
    } else {
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        source: 'WEBSITE',
        assignedToId: '',
        notes: ''
      });
    }
  }, [lead, isOpen]);

  const { data: agents } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (lead) return api.put(`/core/leads/${lead.id}`, data);
      return api.post('/core/leads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalLeads']);
      queryClient.invalidateQueries(['leads-pipeline']);
      toast.success(lead ? 'Lead Updated' : 'Lead Created');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : undefined
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden"
          >
            <div className="p-12 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight uppercase">
                    {lead ? 'Edit Lead' : 'Create New Lead'}
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                    {lead ? 'Update lead information and status' : 'Add a new potential customer to the system'}
                  </p>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Customer Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" required placeholder="Full Name"
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                        value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="email" placeholder="Email Address"
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" required placeholder="Phone Number"
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A]"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Lead Source</label>
                    <div className="relative">
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A] appearance-none"
                        value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}
                      >
                        <option value="WEBSITE">Website</option>
                        <option value="GOOGLE_ADS">Google Ads</option>
                        <option value="META">Meta Ads</option>
                        <option value="CSV">CSV Import</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="CALL">Manual Call</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1">Assigned Agent</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[#0F172A] appearance-none"
                        value={formData.assignedToId} onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                      >
                        <option value="">Unassigned (System Default)</option>
                        {agents?.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name} ({agent.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={onClose} className="flex-1 h-18 rounded-[24px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Cancel</button>
                  <button 
                    type="submit" disabled={mutation.isPending}
                    className="flex-[2] h-18 rounded-[24px] bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                  >
                    {mutation.isPending ? 'SAVING...' : <>{lead ? 'Save Changes' : 'Create Lead'} <ArrowRight size={20}/></>}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeadModal;
