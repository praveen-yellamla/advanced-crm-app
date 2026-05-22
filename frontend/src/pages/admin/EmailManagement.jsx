import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Mail, Search, Shield, Eye, Clock, BarChart2, CheckCircle, AlertTriangle, RefreshCw, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmailManagement = () => {
  const [search, setSearch] = useState('');
  const [activeLog, setActiveLog] = useState(null);

  // Fetch full email audit logs (Admin scoped)
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['adminEmailAudit'],
    queryFn: async () => {
      const res = await api.get('/admin/email-audit');
      return res.data.data;
    }
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Audit logs refreshed');
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

  const filteredLogs = auditLogs?.filter(log => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.email?.subject?.toLowerCase().includes(term) ||
      log.email?.to?.toLowerCase().includes(term) ||
      log.agent?.name?.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-6 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            Email Audit & Delivery Log
          </h1>
          <p className="crm-body mt-1 mt-1">Global oversight of all SMTP communications and delivery events across the organization.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} /> Refresh Audit
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Dispatched" value={auditLogs?.length || 0} subText="All recorded emails" icon={<Mail />} color="blue" />
        <StatCard title="Delivered" value={auditLogs?.filter(l => l.email?.deliveredAt).length || 0} subText="Confirmed by SMTP" icon={<CheckCircle />} color="emerald" />
        <StatCard title="Failed / Bounced" value={auditLogs?.filter(l => l.email?.failedAt).length || 0} subText="Delivery errors" icon={<XCircle />} color="red" />
        <StatCard title="Flagged Communications" value={0} subText="Manager interventions" icon={<AlertTriangle />} color="amber" />
      </div>

      {/* DYNAMIC FILTERS */}
      <div className="crm-card">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by subject, recipient, or sender..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* TWO PANEL LIST-DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EMAIL LOG TABLE */}
        <div className="crm-card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">System Audit Trail</h3>
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-md">{filteredLogs.length} Events</span>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="crm-table">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Sender</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">No audit logs matching search criteria.</td>
                  </tr>
                ) : filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    onClick={() => setActiveLog(log)}
                    className={`text-sm hover:bg-slate-50 cursor-pointer transition-colors ${activeLog?.id === log.id ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="p-3 text-slate-500 text-xs">{new Date(log.eventTimestamp).toLocaleString()}</td>
                    <td className="p-3 font-medium text-slate-900">{log.agent?.name || 'System'}</td>
                    <td className="p-3 text-slate-600">{log.email?.to || 'N/A'}</td>
                    <td className="p-3 text-slate-600 font-medium">{log.eventType}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.email?.status === 'SENT' || log.email?.status === 'DELIVERED' 
                          ? 'bg-green-100 text-green-700' 
                          : log.email?.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.email?.status || 'UNKNOWN'}
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
            <h3 className="text-sm font-semibold text-slate-800">Audit Inspector</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {activeLog ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery Metadata</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Event Type:</span>
                      <span className="font-medium text-slate-900">{activeLog.eventType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SMTP Msg ID:</span>
                      <span className="font-mono text-xs text-slate-700 max-w-[150px] truncate" title={activeLog.email?.smtpMessageId}>{activeLog.email?.smtpMessageId || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivered At:</span>
                      <span className="text-slate-900">{activeLog.email?.deliveredAt ? new Date(activeLog.email.deliveredAt).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Opened At:</span>
                      <span className="text-slate-900">{activeLog.email?.openedAt ? new Date(activeLog.email.openedAt).toLocaleString() : 'Unopened'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Communication Details</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-slate-500 mb-0.5">Subject:</span>
                      <span className="font-medium text-slate-900 block bg-slate-50 p-2 rounded border border-slate-100">{activeLog.email?.subject || 'No Subject'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Sender:</span>
                      <span className="font-medium text-slate-900 block bg-slate-50 p-2 rounded border border-slate-100">{activeLog.agent?.name} &lt;{activeLog.agent?.email}&gt;</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Recipient:</span>
                      <span className="font-medium text-slate-900 block bg-slate-50 p-2 rounded border border-slate-100">{activeLog.email?.to}</span>
                    </div>
                  </div>
                </div>

                {activeLog.manager && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Manager Oversight</h4>
                    <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                      Reviewed by {activeLog.manager.name}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Shield size={40} className="text-slate-200 mb-3" />
                <p className="text-sm font-medium">Select an audit log to inspect delivery metadata</p>
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
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-red-600 bg-red-50 border-red-100",
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

export default EmailManagement;
