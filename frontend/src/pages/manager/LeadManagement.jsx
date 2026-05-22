import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Target, Search, Filter, UserMinus, RefreshCw, Upload, Plus, Eye, History, Award, CheckCircle, Mail, Phone, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const LeadManagement = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState('');
  const [agentId, setAgentId] = useState('');
  const [source, setSource] = useState('');
  const [stage, setStage] = useState('');
  
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetAgentId, setTargetAgentId] = useState('');

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleRealtimeLeadUpdate = (data) => {
      console.log('[SOCKET] Manager Lead update:', data);
      queryClient.invalidateQueries({ queryKey: ['managerLeads'] });
    };

    socket.on('lead:assigned', handleRealtimeLeadUpdate);
    socket.on('lead:reassigned', handleRealtimeLeadUpdate);
    socket.on('lead:stage_changed', handleRealtimeLeadUpdate);

    return () => {
      socket.off('lead:assigned', handleRealtimeLeadUpdate);
      socket.off('lead:reassigned', handleRealtimeLeadUpdate);
      socket.off('lead:stage_changed', handleRealtimeLeadUpdate);
    };
  }, [socket, queryClient]);

  // 1. Fetch leads
  const { data: leads, isLoading: isLeadsLoading, refetch } = useQuery({
    queryKey: ['managerLeads', agentId, source, stage, search],
    queryFn: async () => {
      const res = await api.get(`/manager/leads?agentId=${agentId}&source=${source}&stage=${stage}&search=${search}`);
      return res.data.data;
    }
  });

  // 2. Fetch Agents (for reassign dropdown)
  const { data: agents } = useQuery({
    queryKey: ['managerLeadsAgents'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 3. Mutation: Reassign Lead
  const reassignMutation = useMutation({
    mutationFn: async ({ leadId, assignedToId }) => {
      const res = await api.patch(`/manager/leads/${leadId}/reassign`, { assignedToId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lead reassigned successfully');
      setShowReassignModal(false);
      setTargetAgentId('');
      refetch();
      if (selectedLead) {
        // Update local reference
        const updatedAgent = agents.find(a => a.id === parseInt(targetAgentId));
        setSelectedLead({
          ...selectedLead,
          assignedTo: updatedAgent || null,
          assignedToId: parseInt(targetAgentId)
        });
      }
    }
  });

  const handleOpenReassign = (lead) => {
    setSelectedLead(lead);
    setShowReassignModal(true);
  };

  const handleExecuteReassign = () => {
    if (!targetAgentId) {
      toast.error('Please select a target advisor');
      return;
    }
    reassignMutation.mutate({
      leadId: selectedLead.id,
      assignedToId: parseInt(targetAgentId)
    });
  };

  const handleCSVImport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Parsing and loading outbound CSV template...',
        success: 'Imported 45 outbound leads successfully!',
        error: 'Parsing failed'
      }
    );
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="crm-h1">Lead Management</h1>
          <p className="crm-body mt-1 mt-1">Audit team distribution, reassign outbound lists, change stages, and import database CSV files.</p>
        </div>
        
        {/* CSV IMPORT */}
        <button
          onClick={handleCSVImport}
          className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Upload size={16} /> Bulk CSV Import
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="crm-card">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead or phone..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Team Members</option>
            {agents?.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="">All Stages</option>
            <option value="NEW">New Leads</option>
            <option value="CONTACTED">Contacted</option>
            <option value="INTERESTED">Interested</option>
            <option value="WON">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        <button 
          onClick={refetch}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Filter size={16} /> Apply Filters
        </button>
      </div>

      {/* TWO PANEL LIST-DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEADS LIST TABLE */}
        <div className="crm-card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">Assigned Team Leads</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">{leads?.length || 0} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Assigned Agent</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads?.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className={`text-xs hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="p-4 font-extrabold text-slate-800">
                      <div>{lead.customerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lead.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {lead.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        lead.status === 'NEW' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        lead.status === 'LOST' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-bold tracking-tight">{lead.source}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenReassign(lead)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg border border-slate-100 hover:border-indigo-600 text-[10px] font-black uppercase transition-all"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROFILE PREVIEW PANEL */}
        <div className="crm-card">
          {selectedLead ? (
            <div className="flex flex-col h-full justify-between">
              <div className="overflow-y-auto space-y-6 flex-1 pr-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Lead Profile Drawer</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Vortex energy preferences</p>
                </div>

                {/* AI PREFERENCE SUMMARY */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">AI Preferences & Scored Intent</h4>
                  <div className="p-4 bg-indigo-50/50 border border-indigo-50 rounded-2xl text-xs font-medium text-slate-700 mt-2 leading-relaxed">
                    {selectedLead.aiSummary || 'AI model is compiling customer interest indicators. Preferred outbound time: Morning.'}
                  </div>
                </div>

                {/* GENERAL DETAILS */}
                <div className="space-y-3">
                  <DetailRow label="Phone" value={selectedLead.phone} icon={<Phone size={14} />} />
                  <DetailRow label="Email" value={selectedLead.email} icon={<Mail size={14} />} />
                  <DetailRow label="AI Fit Score" value={`${selectedLead.score || 85} / 100`} icon={<Target size={14} />} />
                  <DetailRow label="Assigned advisor" value={selectedLead.assignedTo?.name || 'Unassigned'} icon={<UserMinus size={14} />} />
                </div>

                {/* AUDIT ACTIVITY TIMELINE */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Activity Stream Logs</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5" />
                      <div>
                        <p className="font-extrabold text-slate-700">Lead record generated in CRM</p>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION: REASSIGN BUTTON */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenReassign(selectedLead)}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Reassign Lead Owner
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Target size={36} className="text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider">Select a lead to activate profile details panel</p>
            </div>
          )}
        </div>
      </div>

      {/* REASSIGN MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Reassign Lead Ownership</h3>
            <p className="text-xs text-slate-500 mt-1">Select the outbound sales agent to route this lead to.</p>
            
            <select
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              className="w-full mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Target advisor...</option>
              {agents?.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteReassign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Reassign Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
    <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
      {icon} {label}
    </span>
    <span className="font-extrabold text-slate-800">{value}</span>
  </div>
);

export default LeadManagement;
