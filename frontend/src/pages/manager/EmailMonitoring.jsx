import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Mail, Search, Users, Eye, Clock, BarChart2, CheckCircle, TrendingUp, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmailMonitoring = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [search, setSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [activeEmail, setActiveEmail] = useState(null);

  // Fetch team emails
  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['managerEmails', selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/manager/emails?agentId=${selectedAgentId}`);
      return res.data.data;
    }
  });

  // Fetch Agents (for dropdown)
  const { data: agents } = useQuery({
    queryKey: ['managerEmailsAgentsList'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Email logs updated');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-16 bg-slate-100 rounded-xl w-full" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Filter Emails
  const filteredEmails = emails?.filter(email => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(term) ||
      email.lead?.customerName?.toLowerCase().includes(term) ||
      email.to?.toLowerCase().includes(term)
    );
  }) || [];

  // Display Agents Logic (Scalability for 1000+ agents)
  const selectedAgent = agents?.find(a => a.id.toString() === selectedAgentId);
  const searchResults = agents?.filter(a => {
    if (a.id.toString() === selectedAgentId) return false;
    return a.name.toLowerCase().includes(agentSearch.toLowerCase());
  }) || [];
  
  const displayAgents = selectedAgent ? [selectedAgent, ...searchResults] : searchResults;
  const slicedAgents = displayAgents.slice(0, 10);
  const remainingCount = Math.max(0, searchResults.length - (slicedAgents.length - (selectedAgent ? 1 : 0)));

  return (
    <div className="space-y-6 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-indigo-600" size={28} />
            Team Email Performance
          </h1>
          <p className="crm-body mt-1 mt-1">Monitor agent communication, track open rates, and inspect conversation timelines.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Open Rate" value="64.5%" subText="+4.2% versus last week" icon={<Eye />} color="indigo" />
        <StatCard title="Total Dispatched" value={emails?.length || 0} subText="Emails sent by team" icon={<Mail />} color="blue" />
        <StatCard title="Response Rate" value="22.1%" subText="Leads replying" icon={<TrendingUp />} color="emerald" />
        <StatCard title="Flagged Emails" value={emails?.filter(e => e.status === 'FAILED').length || 0} subText="Requires attention" icon={<AlertTriangle />} color="amber" />
      </div>

      {/* DYNAMIC FILTERS */}
      <div className="space-y-4">
        {/* EMAIL SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email subject, customer, or recipient..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
          />
        </div>

        {/* AGENT AVATAR CHIPS FILTER */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedAgentId('')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
              selectedAgentId === '' 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Users size={12} className={selectedAgentId === '' ? 'text-white' : 'text-slate-500'} />
            </div>
            <span className="text-xs font-bold">All Team</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {/* SEARCH INPUT CHIP */}
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search advisors..." 
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="pl-8 pr-4 py-2 w-48 rounded-full border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white shadow-sm transition-all focus:w-64"
            />
          </div>

          {slicedAgents.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAgentId(selectedAgentId === a.id.toString() ? '' : a.id.toString())}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                selectedAgentId === a.id.toString()
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {a.avatar_url ? (
                <img src={a.avatar_url} alt={a.name} className="w-6 h-6 rounded-full object-cover border border-white/20" />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  selectedAgentId === a.id.toString() ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {a.name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-bold">{a.name}</span>
            </button>
          ))}

          {remainingCount > 0 && (
            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-2 uppercase tracking-wider">
              + {remainingCount} MORE
            </span>
          )}
        </div>
      </div>

      {/* TWO PANEL LIST-DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EMAIL LOG INBOX LIST */}
        <div className="crm-card lg:col-span-1 flex flex-col h-[600px] border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Agent Communications</h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md">{filteredEmails.length} Outgoing</span>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-slate-50/50">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No emails found matching your filters.</div>
            ) : filteredEmails.map(email => (
              <div 
                key={email.id} 
                onClick={() => setActiveEmail(email)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  activeEmail?.id === email.id 
                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' 
                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-sm text-slate-900 truncate pr-2">
                    {email.lead?.customerName || email.to}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                    email.status === 'DELIVERED' || email.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' 
                    : email.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {email.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium truncate mb-2">
                  {email.subject || '(No Subject)'}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> {email.agent?.name}</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {new Date(email.sentAt || email.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THREAD CONVERSATION DRAWER */}
        <div className="crm-card lg:col-span-2 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Email Insight</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {activeEmail ? (
              <div className="space-y-6">
                
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message Content</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-slate-500 mb-0.5">Subject:</span>
                      <span className="font-medium text-slate-900 block">{activeEmail.subject}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Sent By:</span>
                      <span className="font-medium text-slate-900 block">{activeEmail.agent?.name}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-2">HTML Body:</span>
                      <div 
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 max-h-[250px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: activeEmail.content }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery Metrics</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-medium text-slate-900">{activeEmail.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sent At:</span>
                      <span className="text-slate-900">{activeEmail.sentAt ? new Date(activeEmail.sentAt).toLocaleString() : new Date(activeEmail.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivered:</span>
                      <span className="text-slate-900">{activeEmail.deliveredAt ? new Date(activeEmail.deliveredAt).toLocaleString() : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Opened:</span>
                      <span className="text-slate-900">{activeEmail.openedAt ? new Date(activeEmail.openedAt).toLocaleString() : 'No'}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Users size={40} className="text-slate-200 mb-3" />
                <p className="text-sm font-medium">Select an email to view timeline and delivery metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subText, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  };

  return (
    <div className="crm-card">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${colors[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <h4 className="text-xl font-bold text-slate-900 mt-0.5">{value}</h4>
        <p className="text-[11px] text-slate-400 font-medium mt-1">{subText}</p>
      </div>
    </div>
  );
};

export default EmailMonitoring;
