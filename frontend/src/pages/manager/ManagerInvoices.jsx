import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  FileText, Search, Download, DollarSign, TrendingUp, AlertTriangle, ShieldCheck, Clock, CheckCircle2, XCircle, Eye, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

const ManagerInvoices = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['managerInvoices', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/manager/invoices?status=${statusFilter}`);
      return res.data.data;
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/manager/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['managerInvoices']);
      toast.success('Invoice workflow status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification update failed')
  });

  const filteredInvoices = invoices?.filter(inv => {
    if (!search) return true;
    return (
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.raisedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.customerName?.toLowerCase().includes(search.toLowerCase())
    );
  }) || [];

  const handleExportAll = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast.error('No invoices available to export');
      return;
    }
    const headers = ['Invoice ID', 'Customer', 'Agent', 'Manager', 'Amount', 'Status', 'Due Date', 'Created', 'Updated'];
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
    exportToCSV(headers, data, 'manager_invoice_ledger');
    toast.success('Ledger downloaded successfully');
  };

  const pendingApprovalsCount = invoices?.filter(i => i.status === 'PENDING_APPROVAL').length || 0;
  const totalRevenue = invoices?.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0) || 0;
  const overdueCount = invoices?.filter(i => i.status === 'OVERDUE').length || 0;

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

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
           <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Invoice Ledger & Approvals</h1>
           <p className="crm-body mt-1 mt-1">Audit team commissions, verify item charges, approve payout states, or flag anomalies.</p>
        </div>
        <button
          onClick={handleExportAll}
          className="h-12 px-6 bg-[#0F172A] text-white hover:bg-slate-800 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-all"
        >
          <Download size={16} /> Export Fiscal Ledger
        </button>
      </div>

      {/* FINANCE DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 cursor-pointer hover:border-amber-500 transition-colors" onClick={() => setStatusFilter('PENDING_APPROVAL')}>
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
               <ShieldCheck size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">{pendingApprovalsCount} Queue</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setStatusFilter('PAID')}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <DollarSign size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reconciled Revenue</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">${totalRevenue.toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 cursor-pointer hover:border-rose-500 transition-colors" onClick={() => setStatusFilter('OVERDUE')}>
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
               <AlertTriangle size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overdue Invoices</p>
               <p className="text-3xl font-black text-[#0F172A] tracking-tighter tabular-nums">{overdueCount} Critical</p>
            </div>
         </div>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer, or advisor..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
        
        {/* STATUS PILL TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'All Statuses', value: '' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Sent', value: 'SENT' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Overdue', value: 'OVERDUE' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ].map(status => (
            <button
              key={status.label}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                statusFilter === status.value 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* INVOICES LIST TABLE - 10 COLUMNS */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="crm-table">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                     <th className="px-6 py-6 whitespace-nowrap">Invoice ID</th>
                     <th className="px-6 py-6 whitespace-nowrap">Customer</th>
                     <th className="px-6 py-6 whitespace-nowrap">Agent</th>
                     <th className="px-6 py-6 whitespace-nowrap">Manager</th>
                     <th className="px-6 py-6 whitespace-nowrap text-right">Amount</th>
                     <th className="px-6 py-6 whitespace-nowrap text-center">Status</th>
                     <th className="px-6 py-6 whitespace-nowrap">Due Date</th>
                     <th className="px-6 py-6 whitespace-nowrap">Created</th>
                     <th className="px-6 py-6 whitespace-nowrap">Updated</th>
                     <th className="px-6 py-6 whitespace-nowrap text-right">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                    <tr><td colSpan="10" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">Authenticating Financial Archive...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FileText size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tight mb-2">No Invoices Found</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">There are no invoices matching your criteria in the ledger.</p>
                      </td>
                    </tr>
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-300 group">
                       <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${inv.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-400'}`}>
                                <FileText size={16} />
                             </div>
                             <span className="font-bold text-[#0F172A]">{inv.invoiceNo}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-700">{inv.client?.customerName || 'N/A'}</span>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-600">
                          {inv.raisedBy?.name || 'Self'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-400">
                          {inv.approver?.name || '—'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-right">
                          <span className="font-black text-[#0F172A] tabular-nums">{inv.currency} {inv.amount?.toLocaleString()}</span>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-center">
                          <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-1.5 ${getStatusBadge(inv.status)}`}>
                             <Clock size={10} />
                             {inv.status}
                          </div>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-bold text-slate-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'TBD'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.updatedAt).toLocaleDateString()}
                       </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setSelectedInvoice(inv)} className="h-8 w-8 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg flex items-center justify-center transition-colors" title="View Details">
                                <Eye size={16} />
                             </button>
                             {inv.status === 'PENDING_APPROVAL' && (
                               <>
                                  <button onClick={() => statusMutation.mutate({ id: inv.id, status: 'APPROVED' })} className="h-8 w-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg flex items-center justify-center transition-colors" title="Approve">
                                     <CheckCircle2 size={16} />
                                  </button>
                                  <button onClick={() => statusMutation.mutate({ id: inv.id, status: 'DRAFT' })} className="h-8 w-8 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-colors" title="Reject to Draft">
                                     <XCircle size={16} />
                                  </button>
                               </>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedInvoice.invoiceNo}</h3>
                  <p className="text-sm font-medium text-slate-500">{selectedInvoice.client?.customerName || 'No Client Linked'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-6 grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Agent</p>
                  <p className="text-sm font-bold text-slate-800">{selectedInvoice.raisedBy?.name || 'System'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                  <div className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                  <p className="text-sm font-medium text-slate-600">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                  <p className="text-sm font-medium text-slate-600">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mb-3">Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="text-sm">
                          <td className="p-3 font-medium text-slate-700">{item.description}</td>
                          <td className="p-3 text-center text-slate-500">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-500">{selectedInvoice.currency} {item.unitPrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{selectedInvoice.currency} {(item.quantity * item.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-sm text-slate-400 italic">No line items recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-500">
                    <span>Subtotal:</span>
                    <span>{selectedInvoice.currency} {(selectedInvoice.amount * 0.9).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-slate-500">
                    <span>Tax (10%):</span>
                    <span>{selectedInvoice.currency} {(selectedInvoice.amount * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between text-lg font-black text-slate-900">
                    <span>Total Amount:</span>
                    <span>{selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {selectedInvoice.status === 'PENDING_APPROVAL' && (
                <>
                  <button 
                    onClick={() => {
                      statusMutation.mutate({ id: selectedInvoice.id, status: 'DRAFT' });
                      setSelectedInvoice(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => {
                      statusMutation.mutate({ id: selectedInvoice.id, status: 'APPROVED' });
                      setSelectedInvoice(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm transition-colors shadow-md"
                  >
                    Approve Invoice
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInvoices;
