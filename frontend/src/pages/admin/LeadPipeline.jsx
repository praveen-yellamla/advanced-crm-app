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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Track and manage your leads through different stages of the sales process.</p>
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
    <div className="min-w-[340px] w-[340px] flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
       {/* COLUMN HEADER */}
       <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${column.color}`} />
             <h3 className="text-sm font-bold text-slate-700">{column.label}</h3>
             <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-500">{totalCount}</span>
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
                 className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
               >
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shadow-inner shrink-0">
                           <img src={lead.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.customerName)}&background=random&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.customerName}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-medium text-slate-500">{lead.source.replace('_', ' ')}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="text-xs font-medium text-slate-400">#{lead.id}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2 mb-3">
                     <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Phone size={14} className="text-slate-400" /> {lead.phone}
                     </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                           {lead.assignedTo?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{lead.assignedTo?.name || 'Unassigned'}</span>
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
                       className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
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
              className="w-full h-10 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
            >
               {isFetching ? <Loader2 size={14} className="animate-spin" /> : 'Load Next 10 Leads'}
            </button>
          )}

          {!isLoading && leads.length === 0 && (
            <div className="py-10 text-center space-y-2">
               <TrendingUp size={24} className="mx-auto text-slate-300" />
               <p className="text-xs font-medium text-slate-400 italic">No Leads in Pipeline Stage</p>
            </div>
          )}
       </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options, agents }) => (
  <div className="relative group">
     <div className="absolute -top-5 left-1 text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
        Filter By {label}
     </div>
     <select 
       value={value}
       onChange={e => onChange(e.target.value)}
       className="h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-medium text-slate-700 appearance-none cursor-pointer shadow-sm"
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
