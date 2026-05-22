import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, 
  MoreVertical, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  GripVertical,
  Loader2,
  TrendingUp,
  Download,
  FilterX,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LeadDetailModal from '../../components/admin/LeadDetailModal';
import AssignAgentModal from '../../components/admin/AssignAgentModal';

const STATUS_COLUMNS = [
  { id: 'NEW', label: 'New Leads', color: 'bg-blue-500' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-500' },
  { id: 'WON', label: 'Won', color: 'bg-emerald-500' },
  { id: 'LOST', label: 'Lost', color: 'bg-rose-500' }
];

const LeadPipeline = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // GLOBAL FILTERS STATE
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('ALL');
  const [owner, setOwner] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL'); 
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Assignment State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [currentAgentId, setCurrentAgentId] = useState(null);

  const handleAssignClick = (lead) => {
    setAssigningLeadId(lead.id);
    setCurrentAgentId(lead.assignedToId);
    setIsAssignOpen(true);
  };

  // Fetch agents for owner filter
  const { data: agents } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
      return res.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/core/leads/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads-pipeline']);
      toast.success('Lead stage updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const resetFilters = () => {
    setSearch('');
    setSource('ALL');
    setOwner('ALL');
    setDateRange('ALL');
  };

  return (
    <div className="space-y-8 pb-16 h-[calc(100vh-120px)] flex flex-col">
      {/* GLOBAL HEADER & FILTERS */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Sales Pipeline</h1>
              <p className="crm-body mt-1 mt-1">Track and manage your leads through different stages of the sales process.</p>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={resetFilters} 
                title="Clear all filters"
                className="crm-card"
              >
                 <FilterX size={18} />
              </button>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex-1 min-w-[300px] relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                 type="text" placeholder="Search leads by name, email, or phone..." 
                 className="w-full h-14 pl-14 pr-4 bg-slate-50 border border-slate-100 rounded-[18px] focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-sm"
                 value={search} onChange={e => setSearch(e.target.value)}
              />
           </div>
           
           <FilterSelect label="Source" value={source} onChange={setSource} options={['ALL', 'GOOGLE_ADS', 'META', 'WEBSITE', 'CSV']} />
           <FilterSelect label="Owner" value={owner} onChange={setOwner} options={['ALL', ...(agents?.map(a => a.id.toString()) || [])]} agents={agents} />
           <FilterSelect label="Timeframe" value={dateRange} onChange={setDateRange} options={['ALL', 'TODAY', 'WEEK', 'MONTH']} />
        </div>
      </div>

      {/* PIPELINE BOARD */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
         {STATUS_COLUMNS.map(col => (
           <PipelineColumn 
             key={col.id} 
             column={col} 
             filters={{ search, source, owner, dateRange }}
             onLeadClick={(id) => { setSelectedLeadId(id); setIsDetailOpen(true); }}
             updateStatus={updateStatusMutation.mutate}
           />
         ))}
      </div>

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

const PipelineColumn = ({ column, filters, onLeadClick, updateStatus }) => {
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leads-pipeline', column.id, filters, page],
    queryFn: async () => {
      const params = {
        status: column.id,
        page,
        limit: 10,
        search: filters.search || undefined,
        source: filters.source !== 'ALL' ? filters.source : undefined,
        assignedTo: filters.owner !== 'ALL' ? filters.owner : undefined
      };

      // Handle date filters
      if (filters.dateRange === 'TODAY') {
        params.startDate = new Date().setHours(0,0,0,0);
      } else if (filters.dateRange === 'WEEK') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString();
      } else if (filters.dateRange === 'MONTH') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        params.startDate = d.toISOString();
      }

      const res = await api.get('/core/leads', { params });
      return res.data;
    }
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setLeads(data.data);
      } else {
        setLeads(prev => [...prev, ...data.data]);
      }
      setHasMore(data.pagination.page < data.pagination.pages);
      setTotalCount(data.pagination.total);
    }
  }, [data, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="min-w-[340px] w-[340px] flex flex-col bg-slate-50/50 rounded-[40px] border border-slate-100 overflow-hidden">
       {/* COLUMN HEADER */}
       <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${column.color}`} />
             <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0F172A]">{column.label}</h3>
             <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-400">{totalCount}</span>
          </div>
          {isFetching && <Loader2 size={14} className="animate-spin text-blue-600" />}
       </div>

       {/* COLUMN LEADS */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <AnimatePresence mode="popLayout">
             {leads.map(lead => (
               <motion.div 
                 key={lead.id}
                 layout
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 onClick={() => onLeadClick(lead.id)}
                 className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                           <img src={lead.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.customerName)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h4 className="text-[13px] font-black text-[#0F172A] tracking-tight group-hover:text-blue-600 transition-colors uppercase">{lead.customerName}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-[9px] font-bold text-slate-400">#{lead.id}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2 mb-4">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Phone size={12} className="text-slate-300" /> {lead.phone}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">
                           {lead.assignedTo?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{lead.assignedTo?.name || 'Unassigned'}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAssignClick(lead); }}
                          title="Reassign Agent"
                          className="ml-2 w-6 h-6 rounded-lg bg-slate-50 text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                        >
                           <UserPlus size={12} />
                        </button>
                     </div>
                     <select 
                       onClick={(e) => e.stopPropagation()}
                       value={lead.status}
                       onChange={(e) => { e.stopPropagation(); updateStatus({ id: lead.id, status: e.target.value }); }}
                       className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border-none rounded-lg px-2 py-1.5 outline-none text-slate-400 hover:text-blue-600 transition-colors cursor-pointer appearance-none"
                     >
                        {STATUS_COLUMNS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                  </div>
               </motion.div>
             ))}
          </AnimatePresence>

          {hasMore && (
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={isFetching}
              title="Fetch the next page of leads for this stage"
              className="w-full h-12 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
               {isFetching ? <Loader2 size={14} className="animate-spin" /> : 'Load Next 10 Leads'}
            </button>
          )}

          {!isLoading && leads.length === 0 && (
            <div className="py-10 text-center space-y-2">
               <TrendingUp size={24} className="mx-auto text-slate-200" />
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Leads in Pipeline Stage</p>
            </div>
          )}
       </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options, agents }) => (
  <div className="relative group">
     <div className="absolute -top-5 left-1 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Filter By {label}
     </div>
     <select 
       value={value}
       onChange={e => onChange(e.target.value)}
       className="h-12 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-[10px] font-black uppercase tracking-widest text-[#0F172A] appearance-none cursor-pointer"
     >
        {options.map(o => {
          let name = o === 'ALL' ? `All ${label}s` : o;
          if (agents && o !== 'ALL') {
            const agent = agents.find(a => a.id.toString() === o);
            name = agent ? agent.name : o;
          }
          return <option key={o} value={o}>{name.replace('_', ' ')}</option>;
        })}
     </select>
     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronRight size={14} className="text-slate-300 rotate-90" />
     </div>
  </div>
);

export default LeadPipeline;
