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
      <div className="crm-card">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email subject, customer, or recipient..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Team Members</option>
            {agents?.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TWO PANEL LIST-DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EMAIL LOG TABLE */}
        <div className="crm-card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Agent Communications</h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md">{filteredEmails.length} Outgoing</span>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="crm-table">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="p-3">Customer Lead</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 text-sm">No emails found matching your filters.</td>
                  </tr>
                ) : filteredEmails.map(email => (
                  <tr 
                    key={email.id} 
                    onClick={() => setActiveEmail(email)}
                    className={`text-sm hover:bg-slate-50 cursor-pointer transition-colors ${activeEmail?.id === email.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="p-3 font-medium text-slate-900">{email.lead?.customerName || email.to}</td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate">{email.subject}</td>
                    <td className="p-3 text-slate-600">{email.agent?.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        email.status === 'DELIVERED' || email.status === 'SENT' ? 'bg-green-100 text-green-700' 
                        : email.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* THREAD CONVERSATION DRAWER */}
        <div className="crm-card">
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
