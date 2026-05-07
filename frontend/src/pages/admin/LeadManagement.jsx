import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  Search, 
  Filter, 
  Target, 
  Plus, 
  MoreVertical, 
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Phone,
  Mail,
  Zap,
  Globe,
  Database,
  Pencil,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import LeadModal from '../../components/admin/LeadModal';
import LeadDetailModal from '../../components/admin/LeadDetailModal';
import AssignAgentModal from '../../components/admin/AssignAgentModal';

const LeadManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeSource, setActiveSource] = useState('ALL');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [currentAgentId, setCurrentAgentId] = useState(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/core/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalLeads']);
      toast.success('Lead deleted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAssignClick = (lead) => {
    setAssigningLeadId(lead.id);
    setCurrentAgentId(lead.assignedToId);
    setIsAssignOpen(true);
  };

  const handleViewDetails = (id) => {
    setSelectedLeadId(id);
    setIsDetailOpen(true);
  };

  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setIsModalOpen(true);
    }
  }, [location.search]);

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const { data: leadResponse, isLoading } = useQuery({
    queryKey: ['globalLeads', page, search, activeSource],
    queryFn: async () => {
      const res = await api.get('/core/leads', { params: { search, page, source: activeSource !== 'ALL' ? activeSource : undefined } });
      return res.data;
    }
  });

  const leads = leadResponse?.data || [];

  const handleExport = () => {
    if (leads.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Lead Name,Email,Phone,Source,Status,Assigned To,Created At\n";
    
    leads.forEach(l => {
      csvContent += `"${l.customerName}","${l.email || ''}","${l.phone}","${l.source}","${l.status}","${l.assignedTo?.name || 'Unassigned'}","${l.createdAt}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Lead list exported successfully');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Leads</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage and track all incoming customer leads across all channels.</p>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={handleExport}
              title="Download current lead list as CSV"
              className="h-14 px-8 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
            >
               <Download size={18} /> Export List
            </button>
            <button 
              onClick={handleCreate}
              title="Add a new manual lead"
              className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
            >
               <Plus size={20} /> Add Lead
            </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <MetricBox label="Today's Leads" value="142" sub="+12% from yesterday" icon={<Zap className="text-blue-600" />} />
         <MetricBox label="Unassigned" value="28" sub="Needs Attention" icon={<Target className="text-rose-600" />} />
         <MetricBox label="Conversion" value="84%" sub="Active deals" icon={<TrendingUp className="text-emerald-600" />} />
         <MetricBox label="Top Source" value="Meta" sub="High quality" icon={<Globe className="text-violet-600" />} />
      </div>

      {/* SEARCH/FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search by name, phone, or email..." 
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all font-semibold text-[#0F172A] shadow-sm"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            {['ALL', 'GOOGLE_ADS', 'META', 'WEBSITE', 'CSV'].map(s => (
               <button 
                 key={s}
                 onClick={() => setActiveSource(s)}
                 className={`px-6 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeSource === s ? 'bg-[#0F172A] text-white shadow-xl' : 'bg-white text-slate-400 border border-[#E2E8F0] hover:bg-slate-50'
                 }`}
               >
                  {s === 'ALL' ? 'All Sources' : s.replace('_', ' ')}
               </button>
            ))}
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                     <th className="px-10 py-6">Lead Name</th>
                     <th className="px-10 py-6">Source</th>
                     <th className="px-10 py-6">Marketing</th>
                     <th className="px-10 py-6">Assigned To</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Loading leads...</td></tr>
                  ) : leads.length === 0 ? (
                    <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No leads found</td></tr>
                  ) : leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-all shadow-sm overflow-hidden">
                                <img src={lead.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.customerName)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-lg font-bold text-[#0F172A] tracking-tight">{lead.customerName}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{lead.phone}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className={`px-4 py-1.5 rounded-lg w-fit border text-[10px] font-black uppercase tracking-widest ${
                             lead.source === 'GOOGLE_ADS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                             lead.source === 'META' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                             {lead.source.replace('_',' ')}
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="space-y-1">
                             <p className="text-xs font-bold text-[#0F172A]">{lead.utmCampaign || 'Organic Direct'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.utmSource || 'Direct'} / {lead.utmMedium || 'N/A'}</p>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                                {lead.assignedTo?.name?.charAt(0) || '?'}
                             </div>
                             <span className="text-sm font-bold text-slate-900">{lead.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                             <button 
                                onClick={() => handleViewDetails(lead.id)}
                                title="View Details"
                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center"
                             >
                                <Eye size={16} />
                             </button>
                             <button 
                                onClick={() => handleAssignClick(lead)}
                                title="Assign Agent"
                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center"
                             >
                                <UserPlus size={16} />
                             </button>
                             <button 
                                onClick={() => handleEdit(lead)}
                                title="Edit Lead"
                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center justify-center"
                             >
                                <Pencil size={16} />
                             </button>
                             <button 
                                onClick={() => handleDelete(lead.id)}
                                title="Delete Lead"
                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-rose-600 hover:text-rose-600 transition-all flex items-center justify-center"
                             >
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <LeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        lead={selectedLead} 
      />

      <LeadDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        leadId={selectedLeadId}
      />

      <AssignAgentModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        leadId={assigningLeadId}
        currentAgentId={currentAgentId}
      />
    </div>
  );
};

const MetricBox = ({ label, value, sub, icon }) => (
  <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-[180px] group transition-all hover:shadow-xl hover:-translate-y-1">
     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
        {React.cloneElement(icon, { size: 28 })}
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter mt-1">{value}</h4>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{sub}</p>
     </div>
  </div>
);

export default LeadManagement;
