import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, Search, Download, Clock, CheckCircle2, ShieldCheck, Mail, User, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ModalPortal from '../../components/common/ModalPortal';
import { exportToCSV } from '../../utils/exportUtils';

const AdminInvoices = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['adminInvoices'],
    queryFn: async () => {
      const res = await api.get('/admin/invoices');
      return res.data.data;
    }
  });

  const filteredInvoices = invoices?.filter(inv => {
    const matchesSearch = !search || 
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.raisedBy?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleExportAll = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast.error('No invoices available to export');
      return;
    }
    const headers = ['Invoice ID', 'Customer', 'Agent', 'Manager', 'Amount', 'Status', 'Due Date', 'Created Date', 'Last Updated'];
    const data = filteredInvoices.map(inv => [
      inv.invoiceNo,
      inv.client?.customerName || 'N/A',
      inv.raisedBy?.name || 'N/A',
      inv.approver?.name || 'N/A',
      inv.amount,
      inv.status,
      new Date(inv.dueDate).toLocaleDateString(),
      new Date(inv.createdAt).toLocaleDateString(),
      new Date(inv.updatedAt).toLocaleDateString()
    ]);
    exportToCSV(headers, data, 'admin_global_ledger');
    toast.success('Admin Ledger downloaded successfully');
  };

  const getStatusBadge = (status) => {
    const maps = {
      'DRAFT': 'bg-slate-100 text-slate-600 border-slate-200',
      'PENDING_APPROVAL': 'bg-amber-100 text-amber-600 border-amber-200',
      'APPROVED': 'bg-emerald-100 text-emerald-600 border-emerald-200',
      'SENT': 'bg-blue-100 text-blue-600 border-blue-200',
      'PAID': 'bg-emerald-500 text-white border-emerald-600',
      'OVERDUE': 'bg-rose-100 text-rose-600 border-rose-200',
      'CANCELLED': 'bg-slate-100 text-slate-400 border-slate-200'
    };
    return maps[status] || maps['DRAFT'];
  };

  const getTimelineEvents = (invoice) => {
    if (!invoice) return [];
    const events = [];
    if (Array.isArray(invoice.auditLogs)) {
       invoice.auditLogs.forEach(log => {
          events.push({
             type: 'AUDIT',
             title: log.action,
             subtitle: `By ${log.by || 'System'}`,
             messageId: log.messageId,
             error: log.error,
             timestamp: new Date(log.timestamp)
          });
       });
    }
    if (Array.isArray(invoice.deliveryLogs)) {
       invoice.deliveryLogs.forEach(log => {
          events.push({
             type: 'DELIVERY',
             title: `SMTP Delivery: ${log.status}`,
             subtitle: 'System Delivery Engine',
             messageId: log.messageId,
             error: log.error,
             to: log.to,
             cc: log.cc,
             bcc: log.bcc,
             timestamp: new Date(log.timestamp)
          });
       });
    }
    // Also include old activityLogs if present
    if (invoice.activityLogs) {
       let oldLogs = [];
       if (typeof invoice.activityLogs === 'string') {
         try { oldLogs = JSON.parse(invoice.activityLogs); } catch {}
       } else if (Array.isArray(invoice.activityLogs)) {
         oldLogs = invoice.activityLogs;
       }
       oldLogs.forEach(log => {
          events.push({
             type: 'LEGACY',
             title: log.action,
             subtitle: `By ${log.by || 'System'}`,
             messageId: log.messageId,
             error: log.error,
             timestamp: new Date(log.timestamp)
          });
       });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase">Global Ledger & Audit Center</h1>
           <p className="text-[#64748B] font-bold text-sm uppercase tracking-widest mt-2">Unrestricted access to all company billing, approvals, and SMTP logs</p>
        </div>
        <button 
          onClick={handleExportAll}
          className="h-14 px-10 bg-[#0F172A] text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-4"
        >
           <Download size={20} /> Export Master File
        </button>
      </div>

      {/* SEARCH/TABS */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Search invoice no, client, or agent..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full h-16 pl-16 pr-6 bg-white border border-[#E2E8F0] rounded-3xl focus:ring-[12px] focus:ring-emerald-500/5 focus:border-emerald-600 outline-none transition-all font-bold text-[#0F172A] shadow-sm"
            />
         </div>
         <div className="flex gap-4 p-2 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm overflow-x-auto shrink-0">
            {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PAID'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setStatusFilter(tab)}
                className={`px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === tab ? 'bg-[#0F172A] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
         </div>
      </div>

      {/* INVOICE TABLE */}
      <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                     <th className="px-6 py-6 whitespace-nowrap">Invoice ID</th>
                     <th className="px-6 py-6 whitespace-nowrap">Customer</th>
                     <th className="px-6 py-6 whitespace-nowrap">Agent</th>
                     <th className="px-6 py-6 whitespace-nowrap">Manager</th>
                     <th className="px-6 py-6 whitespace-nowrap text-right">Amount</th>
                     <th className="px-6 py-6 whitespace-nowrap text-center">Status</th>
                     <th className="px-6 py-6 whitespace-nowrap">Due Date</th>
                     <th className="px-6 py-6 whitespace-nowrap">Created</th>
                     <th className="px-6 py-6 whitespace-nowrap">Updated</th>
                     <th className="px-6 py-6 whitespace-nowrap text-right">Audit</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="10" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Hydrating Global Ledger...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <ShieldCheck size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tight mb-2">No Invoices Found</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">There are no records matching your security clearance in the master database.</p>
                      </td>
                    </tr>
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-300 group">
                       <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <FileText size={16} className="text-slate-500" />
                             </div>
                             <span className="font-black text-[#0F172A] uppercase italic">{inv.invoiceNo}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-700">{inv.client?.customerName || 'N/A'}</span>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-600">
                          {inv.raisedBy?.name || 'Unknown'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-400">
                          {inv.approver?.name || 'N/A'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-right">
                          <span className="font-black text-[#0F172A] tabular-nums">{inv.currency} {inv.amount?.toLocaleString()}</span>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-center">
                          <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-1.5 ${getStatusBadge(inv.status)}`}>
                             {inv.status}
                          </div>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-bold text-slate-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.updatedAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-right">
                          <button 
                             onClick={() => setSelectedInvoice(inv)} 
                             className="h-10 px-5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-[#0F172A] hover:text-[#0F172A] shadow-sm transition-all font-black uppercase tracking-widest"
                          >
                             Audit Trail
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* AUDIT TRAIL DRAWER */}
      <AnimatePresence>
         {selectedInvoice && (
           <ModalPortal>
             <div className="fixed inset-0 z-[100] flex justify-end">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
                   <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0 bg-slate-50/50">
                      <div>
                        <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Audit Trail</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedInvoice.invoiceNo}</p>
                      </div>
                      <button onClick={() => setSelectedInvoice(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-500 flex items-center justify-center transition-colors">
                         <X size={18} />
                      </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      {/* Lifecycle Timeline */}
                      <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100">
                         
                         {/* Creation Step */}
                         <div className="relative">
                            <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                               <FileText size={10} className="text-slate-400" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Draft Initialized</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Created by {selectedInvoice.raisedBy?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                         </div>

                         {/* Approvals & SMTP Logs from relational logs */}
                         {getTimelineEvents(selectedInvoice).map((log, idx) => (
                           <div key={idx} className="relative">
                              <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center">
                                 {log.type === 'DELIVERY' || log.title?.includes('Sent') ? <Mail size={10} className="text-indigo-600" /> : <User size={10} className="text-indigo-600" />}
                              </div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">{log.title}</h3>
                              <p className="text-sm font-medium text-slate-500 mt-1">{log.subtitle}</p>
                              {log.to && (
                                <p className="text-xs font-medium text-slate-400 mt-1">To: {log.to}</p>
                              )}
                              {log.error && (
                                <div className="mt-2 p-3 bg-rose-50 rounded-lg border border-rose-100">
                                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Delivery Failure</p>
                                  <p className="text-xs font-mono text-rose-600 break-all mt-1">{log.error}</p>
                                </div>
                              )}
                              {log.messageId && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMTP Target Message ID</p>
                                  <p className="text-xs font-mono text-slate-600 break-all">{log.messageId}</p>
                                </div>
                              )}
                              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{log.timestamp.toLocaleString()}</p>
                           </div>
                         ))}

                         {/* Current Status Step */}
                         <div className="relative">
                            <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                               <CheckCircle2 size={10} className="text-emerald-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Current Status: {selectedInvoice.status}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Last Updated {new Date(selectedInvoice.updatedAt).toLocaleString()}</p>
                         </div>

                      </div>
                   </div>
                </motion.div>
             </div>
           </ModalPortal>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInvoices;
