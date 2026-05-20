import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Mail, Search, Users, Eye, Clock, BarChart2, CheckCircle, ArrowUpRight, RefreshCw, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmailManagement = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [search, setSearch] = useState('');
  const [activeEmail, setActiveEmail] = useState(null);

  // 1. Fetch team emails (Admin scoped)
  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['adminEmails', selectedAgentId],
    queryFn: async () => {
      const res = await api.get(`/admin/emails?agentId=${selectedAgentId}`);
      return res.data.data;
    }
  });

  // 2. Fetch Agents (Admin scoped for dropdown)
  const { data: agents } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const res = await api.get('/admin/agents');
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
        <div className="h-16 bg-slate-100 rounded-2xl w-full" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Filter Emails locally based on search
  const filteredEmails = emails?.filter(email => {
    if (!search) return true;
    return (
      email.subject?.toLowerCase().includes(search.toLowerCase()) ||
      email.lead?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      email.to?.toLowerCase().includes(search.toLowerCase())
    );
  }) || [];

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Email Audit Log</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Audit outgoing proposals, track message status, and inspect conversation threads across the organization.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="h-12 px-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh Log
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Open Rate" value="68.2%" subText="+2.1% versus last week" icon={<Eye />} color="blue" />
        <StatCard title="Click Rate" value="41.5%" subText="+3.4% versus last week" icon={<ArrowUpRight />} color="emerald" />
        <StatCard title="Reply Rate" value="24.8%" subText="+0.8% versus last week" icon={<CheckCircle />} color="violet" />
        <StatCard title="Templates Active" value="16 Templates" subText="Top performing: Enterprise Proposal" icon={<BarChart2 />} color="amber" />
      </div>

      {/* DYNAMIC FILTERS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email subject, customer, or recipient..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Team Members</option>
            {agents?.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* TWO PANEL LIST-DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* EMAIL LOG TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">Sent Communications</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{filteredEmails.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Customer Lead</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Advisor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400 font-semibold">No emails matching search criteria.</td>
                  </tr>
                ) : filteredEmails.map(email => (
                  <tr 
                    key={email.id} 
                    onClick={() => setActiveEmail(email)}
                    className={`text-xs hover:bg-slate-50/50 cursor-pointer transition-colors ${activeEmail?.id === email.id ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="p-4 font-extrabold text-slate-800">{email.lead?.customerName || 'N/A'}</td>
                    <td className="p-4 font-semibold text-slate-600 max-w-[200px] truncate">{email.subject}</td>
                    <td className="p-4 font-bold text-slate-500">{email.agent?.name || 'System'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        email.status === 'SENT' || email.status === 'DELIVERED' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveEmail(email)}
                        className="p-1.5 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg border border-slate-100 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* THREAD CONVERSATION DRAWER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[500px]">
          {activeEmail ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              <div className="overflow-y-auto space-y-6 flex-1 pr-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Email Details</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Linked customer conversation</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Subject Line</span>
                    <p className="text-xs font-extrabold text-slate-800 mt-1">{activeEmail.subject}</p>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Recipient (To)</span>
                    <p className="text-xs font-bold text-slate-600 mt-1">{activeEmail.to}</p>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sender Advisor</span>
                    <p className="text-xs font-bold text-slate-600 mt-1">{activeEmail.agent?.name || 'System'} ({activeEmail.from})</p>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">HTML Body Thread</span>
                    <div 
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 mt-2 leading-relaxed overflow-y-auto max-h-[180px] font-medium"
                      dangerouslySetInnerHTML={{ __html: activeEmail.content }}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Clock size={12} /> Dispatched on {new Date(activeEmail.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Mail size={36} className="text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider">Select an email log to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subText, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]} shadow-sm`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">{title}</p>
        <h4 className="text-lg font-black text-slate-900 mt-1 leading-none">{value}</h4>
        <p className="text-[9px] text-slate-400 font-bold mt-1.5 leading-none">{subText}</p>
      </div>
    </div>
  );
};

export default EmailManagement;
