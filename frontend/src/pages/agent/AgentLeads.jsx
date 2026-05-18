import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Plus, Search, Phone, Mail, Target, CheckCircle2, 
  ArrowRight, MoreVertical, ChevronRight, Filter, 
  Layout, MessageSquare, Kanban, List, Sparkles,
  TrendingUp, TrendingDown, Clock, UserCheck, Download,
  MoreHorizontal, Trash2, Edit3, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';

const AgentLeads = () => {
  const [viewMode, setViewMode] = useState('PIPELINE'); // PIPELINE or LIST
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC'); // NAME_ASC, SCORE_DESC, DATE_DESC
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data;
    }
  });

  const stages = ['NEW', 'CONTACTED', 'INTERESTED', 'QUALIFIED', 'WON', 'LOST'];

  const filteredLeads = useMemo(() => {
    let result = (leads || []).filter(l => 
      (activeStage === 'ALL' || l.status === activeStage) &&
      (l.customerName.toLowerCase().includes(search.toLowerCase()) || (l.email || '').toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy === 'NAME_ASC') result.sort((a, b) => a.customerName.localeCompare(b.customerName));
    if (sortBy === 'SCORE_DESC') result.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (sortBy === 'DATE_DESC') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [leads, search, activeStage, sortBy]);

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/agent/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agentLeads']);
      toast.success('Lead updated');
    },
    onError: () => toast.error('Failed to update lead')
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    const lead = leads.find(l => l.id.toString() === draggableId);
    if (lead && lead.status !== newStatus) {
      updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } });
    }
  };

  const handleExportCSV = () => {
    if (!filteredLeads.length) return toast.error('No data to export');
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Score', 'Source', 'Created At'];
    const rows = filteredLeads.map(l => [
      l.id,
      l.customerName,
      l.email || '',
      l.phone || '',
      l.status,
      l.score || 0,
      l.source || 'Manual',
      new Date(l.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export initiated');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Lead Pipeline</h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">Track and manage your sales pipeline</p>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
              <button 
                onClick={() => setViewMode('PIPELINE')}
                className={`flex items-center gap-2 px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'PIPELINE' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-900'}`}
              >
                 <Kanban size={16} /> Pipeline
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-2 px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-900'}`}
              >
                 <List size={16} /> List
              </button>
           </div>
           <button 
             onClick={handleExportCSV}
             className="h-14 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
           >
              <Download size={18} /> Export
           </button>
           <button className="h-14 px-8 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <Plus size={20} /> Add Lead
           </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
               type="text" placeholder="Search leads..." 
               className="w-full h-16 pl-16 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
               value={search} onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 px-2">
            <Filter size={20} className="text-slate-300" />
            <select 
              value={activeStage} 
              onChange={e => setActiveStage(e.target.value)}
              className="h-16 px-6 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-blue-600/10"
            >
               <option value="ALL">All Stages</option>
               {stages.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="h-16 px-6 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-blue-600/10"
            >
               <option value="DATE_DESC">Newest First</option>
               <option value="NAME_ASC">Name (A-Z)</option>
               <option value="SCORE_DESC">Highest Score</option>
            </select>
         </div>
      </div>

      <AnimatePresence mode="wait">
         {viewMode === 'PIPELINE' ? (
           <motion.div 
             key="kanban"
             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
             className="pb-10 overflow-x-auto scrollbar-hide"
           >
              <DragDropContext onDragEnd={handleDragEnd}>
                 <div className="flex gap-8 min-w-max px-2">
                    {stages.map(stage => (
                      <Droppable key={stage} droppableId={stage}>
                         {(provided, snapshot) => (
                           <div 
                             {...provided.droppableProps}
                             ref={provided.innerRef}
                             className={`w-80 flex flex-col gap-6 p-4 rounded-[40px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-transparent'}`}
                           >
                              <div className="flex items-center justify-between px-4 sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-sm py-2 rounded-2xl z-10">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      stage === 'WON' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                                      stage === 'LOST' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-blue-500'
                                    }`} />
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">{stage.replace('_', ' ')}</h3>
                                 </div>
                                 <span className="text-[10px] font-black text-slate-300">{(leads || []).filter(l => l.status === stage).length}</span>
                              </div>
                              
                              <div className="flex flex-col gap-4 min-h-[400px]">
                                 {(filteredLeads || []).filter(l => l.status === stage).map((lead, index) => (
                                   <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`${snapshot.isDragging ? 'rotate-3 scale-105' : ''} transition-transform duration-200`}
                                        >
                                           <LeadKanbanCard 
                                             lead={lead} 
                                             onStatusChange={(s) => updateLeadMutation.mutate({ id: lead.id, data: { status: s } })} 
                                           />
                                        </div>
                                      )}
                                   </Draggable>
                                 ))}
                                 {provided.placeholder}
                                 {(leads || []).filter(l => l.status === stage).length === 0 && !snapshot.isDraggingOver && (
                                   <div className="h-32 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Empty Stage</div>
                                 )}
                              </div>
                           </div>
                         )}
                      </Droppable>
                    ))}
                 </div>
              </DragDropContext>
           </motion.div>
         ) : (
           <motion.div 
             key="list"
             initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
             className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
           >
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Lead Name</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Score</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Activity</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredLeads.map((lead) => (
                         <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-6">
                                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                     <Target size={22} />
                                  </div>
                                  <div>
                                     <p className="text-base font-black text-slate-900 uppercase italic tracking-tight">{lead.customerName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: #{lead.id}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className={`px-4 py-2 rounded-xl w-fit border text-[10px] font-black uppercase tracking-widest ${
                                  lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' :
                                  lead.status === 'LOST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                               }`}>
                                 {lead.status}
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-3">
                                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${lead.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} font-black text-xs`}>
                                     <Sparkles size={14} /> {lead.score || 0}
                                  </div>
                                  {lead.score >= 70 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-amber-500" />}
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                     <Phone size={14} className="text-slate-300" />
                                     <span className="text-xs font-black text-slate-900">{lead.calls?.length || 0}</span>
                                  </div>
                                  <div className="w-px h-4 bg-slate-100" />
                                  <div className="flex items-center gap-2">
                                     <Mail size={14} className="text-slate-300" />
                                     <span className="text-xs font-black text-slate-900">{lead.emails?.length || 0}</span>
                                  </div>
                                </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  <button className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
                                     Call Lead
                                  </button>
                                  <button className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center justify-center">
                                     <MessageSquare size={18} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

const LeadKanbanCard = ({ lead, onStatusChange }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group relative overflow-hidden"
    >
       <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lead.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} group-hover:bg-blue-600 group-hover:text-white transition-all`}>
             <Target size={18} />
          </div>
          <div className="flex flex-col items-end">
             <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${lead.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                <Sparkles size={10} /> {lead.score || 0}
             </div>
             <span className="text-[8px] text-slate-300 font-bold uppercase mt-1 tracking-tighter">AI Score</span>
          </div>
       </div>

       <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{lead.customerName}</h4>
          <p className="text-[10px] text-slate-400 font-bold tracking-tight truncate">{lead.phone || lead.email}</p>
       </div>

       <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">
                <Phone size={12} />
                <span className="text-[10px] font-black text-slate-900">{lead.calls?.length || 0}</span>
             </div>
             <div className="flex items-center gap-1.5 text-slate-300 hover:text-violet-600 transition-colors cursor-pointer">
                <Mail size={12} />
                <span className="text-[10px] font-black text-slate-900">{lead.emails?.length || 0}</span>
             </div>
          </div>
          <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
             <ArrowRight size={14} />
          </button>
       </div>
       
       {/* QUICK ACTIONS OVERLAY */}
       <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-2 z-20"
            >
               <button 
                 onClick={(e) => { e.stopPropagation(); onStatusChange('WON'); }}
                 className="flex-1 h-9 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
               >
                  <CheckCircle2 size={12} /> Won
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); onStatusChange('LOST'); }}
                 className="flex-1 h-9 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
               >
                  <XCircle size={12} /> Lost
               </button>
               <button className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                  <MoreHorizontal size={14} />
               </button>
            </motion.div>
          )}
       </AnimatePresence>
    </motion.div>
  );
};

export default AgentLeads;
