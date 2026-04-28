import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Briefcase, 
  Plus, 
  MoreHorizontal, 
  Globe, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CompanyManagement = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', location: '', industry: '' });
  
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['clientCompanies'],
    queryFn: async () => {
      const res = await api.get('/client/companies');
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/client/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientCompanies']);
      toast.success('Strategic Entity Registered');
      setIsModalOpen(false);
      setFormData({ name: '', website: '', location: '', industry: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed')
  });

  const filteredCompanies = companies?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase">Corporate Grid.</h1>
           <p className="text-sm font-bold text-slate-400 mt-2 uppercase italic tracking-widest">Managing Organizational Subsidiary Prototypes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-16 px-10 bg-[#0F172A] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Deploy New Entity
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group max-w-2xl">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
         <input 
            type="text" placeholder="Search operational subsidiaries by name or industry..." 
            className="w-full h-18 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-[32px] focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm italic"
            value={search} onChange={e => setSearch(e.target.value)}
         />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {isLoading ? (
            <p className="text-slate-400 font-black italic uppercase animate-pulse">Loading Data Archive...</p>
         ) : filteredCompanies?.map((company) => (
            <motion.div 
               key={company.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group hover:shadow-2xl hover:border-indigo-100 transition-all duration-700"
            >
               <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                     <Briefcase size={28} />
                  </div>
                  <div className="flex gap-2">
                     <button className="w-12 h-12 rounded-2xl bg-white border border-slate-50 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center shadow-sm">
                        <Edit3 size={18} />
                     </button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-[#0F172A] italic uppercase tracking-tighter leading-none">{company.name}</h3>
                  <div className="flex items-center gap-3">
                     <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase italic border border-indigo-100">{company.industry || 'General Industry'}</span>
                     <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase italic"><MapPin size={12}/> {company.location || 'Global Remote'}</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Leads Generated</p>
                     <p className="text-2xl font-black text-[#0F172A] tracking-tighter italic">{company._count?.leads || 0}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${company.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                     <CheckCircle2 size={20} />
                  </div>
               </div>

               {company.website && (
                 <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-2 transition-transform italic">
                    <ExternalLink size={14} /> Visit Website
                 </a>
               )}
            </motion.div>
         ))}
      </div>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-xl bg-white rounded-[64px] shadow-2xl overflow-hidden p-16 space-y-12">
                  <div>
                     <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-none">Entity Protocol.</h2>
                     <p className="text-sm font-bold text-slate-400 mt-4 uppercase italic">Configuring subsidiary organizational entry</p>
                  </div>

                  <div className="space-y-8">
                     <InputField label="Entity Name" placeholder="e.g. Nexus Multi-National" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                     <InputField label="Operational Industry" placeholder="e.g. Quantum Computing" value={formData.industry} onChange={v => setFormData({...formData, industry: v})} />
                     <div className="grid grid-cols-2 gap-8">
                        <InputField label="Web Address" placeholder="nexus.io" value={formData.website} onChange={v => setFormData({...formData, website: v})} />
                        <InputField label="G-HQ Location" placeholder="Zurich, CH" value={formData.location} onChange={v => setFormData({...formData, location: v})} />
                     </div>
                  </div>

                  <button 
                     onClick={() => mutation.mutate(formData)}
                     disabled={mutation.isPending}
                     className="w-full h-20 bg-[#0F172A] text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:brightness-125 transition-all"
                  >
                     {mutation.isPending ? 'Saving...' : 'Create Subsidiary Account'}
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-1 italic">{label}</label>
     <input 
        type="text" placeholder={placeholder}
        className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-indigo-600 focus:bg-white transition-all font-black text-sm italic shadow-inner"
        value={value} onChange={e => onChange(e.target.value)}
     />
  </div>
);

export default CompanyManagement;
