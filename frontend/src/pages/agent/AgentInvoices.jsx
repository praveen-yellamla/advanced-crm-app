import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, Plus, Trash2, Download, Clock, CheckCircle2,
  PlusCircle, Eye, Send, Save, Copy, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ModalPortal from '../../components/common/ModalPortal';

const AgentInvoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['agentInvoices'],
    queryFn: async () => {
      const res = await api.get('/agent/invoices');
      return res.data.data;
    }
  });

  const { data: leads } = useQuery({
    queryKey: ['agentLeads'],
    queryFn: async () => {
      const res = await api.get('/agent/leads');
      return res.data.data;
    }
  });

  const [invoiceId, setInvoiceId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const getDefaultDueDate = () => {
     const date = new Date();
     date.setDate(date.getDate() + 7);
     return date.toISOString().split('T')[0];
  };

  const [newInvoice, setNewInvoice] = useState({
    leadId: '',
    dueDate: getDefaultDueDate(),
    currency: 'USD',
    notes: '',
    discount: 0,
    items: [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }],
    status: 'DRAFT',
    recipientEmail: '',
    ccEmail: '',
    bccEmail: ''
  });

  const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);
  const [sendSuccessInfo, setSendSuccessInfo] = useState(null);

  // Calculate Totals
  const calculateSubtotal = () => newInvoice.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const calculateTaxes = () => newInvoice.items.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
  const calculateTotal = () => Math.max(0, calculateSubtotal() + calculateTaxes() - Number(newInvoice.discount));
  const calculateCommission = () => calculateSubtotal() * 0.05;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/agent/invoices', data),
    onSuccess: (res) => {
      setInvoiceId(res.data.data.id);
      setNewInvoice(prev => ({ ...prev, status: res.data.data.status }));
      setSaveStatus('Saved just now');
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries(['agentInvoices']);
    },
    onError: () => setSaveStatus('Failed to save')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/agent/invoices/${invoiceId}`, data),
    onSuccess: (res) => {
      setNewInvoice(prev => ({ ...prev, status: res.data.data.status }));
      setSaveStatus('Saved just now');
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries(['agentInvoices']);
    },
    onError: () => setSaveStatus('Failed to save')
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, pdfBase64, to, cc, bcc }) => api.post(`/agent/invoices/${id}/send`, { pdfBase64, to, cc, bcc }),
    onSuccess: (res, variables) => {
      const data = res.data?.data;
      if (data?.status) {
        setNewInvoice(prev => ({ ...prev, status: data.status }));
      }
      
      const newDeliveryLog = data?.deliveryLogs?.[data.deliveryLogs.length - 1];
      
      setSendSuccessInfo({
        status: newDeliveryLog?.status || 'DELIVERED',
        recipientEmail: variables.to,
        timestamp: newDeliveryLog?.timestamp ? new Date(newDeliveryLog.timestamp) : new Date(),
        messageId: newDeliveryLog?.messageId || 'N/A'
      });
      
      queryClient.invalidateQueries(['agentInvoices']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invoice');
    }
  });

  // Auto-Save Engine
  useEffect(() => {
    if (!hasUnsavedChanges || !isModalOpen) return;
    
    const interval = setInterval(() => {
      handleSaveDraft(true);
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, newInvoice, invoiceId, isModalOpen]);

  const handleUpdateField = (field, value) => {
    setNewInvoice(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'leadId' && value) {
        const lead = leads?.find(l => String(l.id) === String(value));
        if (lead && lead.email) {
          updated.recipientEmail = lead.email;
        } else {
          updated.recipientEmail = '';
        }
      }
      return updated;
    });
    setHasUnsavedChanges(true);
    setSaveStatus('Unsaved changes');
  };

  const addItem = () => {
    setNewInvoice(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, tax: 0 }] }));
    setHasUnsavedChanges(true);
    setSaveStatus('Unsaved changes');
  };

  const removeItem = (index) => {
    setNewInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    setHasUnsavedChanges(true);
    setSaveStatus('Unsaved changes');
  };

  const updateItem = (index, field, value) => {
    const updated = [...newInvoice.items];
    updated[index][field] = value;
    setNewInvoice(prev => ({ ...prev, items: updated }));
    setHasUnsavedChanges(true);
    setSaveStatus('Unsaved changes');
  };

  const preparePayload = (overrideStatus = undefined) => {
    return {
      ...newInvoice,
      amount: calculateTotal(),
      subtotal: calculateSubtotal(),
      tax: calculateTaxes(),
      status: overrideStatus || newInvoice.status
    };
  };

  const handleSaveDraft = async (isAuto = false, overrideStatus = undefined) => {
    if (!newInvoice.leadId) {
      if (!isAuto) toast.error('Client Target is required to save');
      return;
    }
    
    if (isAuto) setIsAutoSaving(true);
    else setSaveStatus('Saving...');

    const payload = preparePayload(overrideStatus);

    if (invoiceId) {
      await updateMutation.mutateAsync(payload).catch(() => {});
    } else {
      await createMutation.mutateAsync(payload).catch(() => {});
    }
    
    if (isAuto) setIsAutoSaving(false);
    else toast.success('Draft Saved');
  };

  const handleClose = async () => {
    if (hasUnsavedChanges && newInvoice.leadId) {
       toast('Saving draft before closing...');
       await handleSaveDraft(true);
    } else if (hasUnsavedChanges) {
       if(!window.confirm("You have unsaved changes but no client selected. Close without saving?")) return;
    }
    setIsModalOpen(false);
  };

  const openInvoice = (inv) => {
    setInvoiceId(inv.id);
    const clientEmail = leads?.find(l => String(l.id) === String(inv.clientId))?.email || '';
    setNewInvoice({
      leadId: inv.clientId || '',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      currency: inv.currency || 'USD',
      notes: inv.notes || '',
      discount: inv.discount || 0,
      items: inv.items?.length > 0 ? inv.items : [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }],
      status: inv.status,
      recipientEmail: inv.deliveryLogs?.[inv.deliveryLogs.length - 1]?.to || clientEmail,
      ccEmail: inv.deliveryLogs?.[inv.deliveryLogs.length - 1]?.cc || '',
      bccEmail: inv.deliveryLogs?.[inv.deliveryLogs.length - 1]?.bcc || ''
    });
    setSaveStatus('All changes saved');
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const generatePDF = (action = 'download') => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 58, 138); // Indigo 900
    doc.text('INVOICE', 40, 60);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice ID: ${invoiceId ? `INV-${invoiceId}` : 'DRAFT'}`, 40, 80);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 95);
    doc.text(`Due Date: ${newInvoice.dueDate || 'N/A'}`, 40, 110);

    const client = leads?.find(l => String(l.id) === String(newInvoice.leadId));
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Billed To:', 350, 60);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(client ? client.customerName : 'Unknown Client', 350, 75);
    if(client?.email) doc.text(client.email, 350, 90);

    const tableData = newInvoice.items.map(i => [
      i.description || 'Item',
      i.quantity,
      `${newInvoice.currency} ${Number(i.unitPrice).toFixed(2)}`,
      `${newInvoice.currency} ${Number(i.tax).toFixed(2)}`,
      `${newInvoice.currency} ${((i.quantity * i.unitPrice) + Number(i.tax)).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Line Total']],
      body: tableData,
      startY: 140,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', 350, finalY);
    doc.text(`${newInvoice.currency} ${calculateSubtotal().toFixed(2)}`, 450, finalY);
    
    doc.text('Taxes:', 350, finalY + 15);
    doc.text(`${newInvoice.currency} ${calculateTaxes().toFixed(2)}`, 450, finalY + 15);
    
    doc.text('Discount:', 350, finalY + 30);
    doc.text(`-${newInvoice.currency} ${Number(newInvoice.discount).toFixed(2)}`, 450, finalY + 30);
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Total:', 350, finalY + 55);
    doc.text(`${newInvoice.currency} ${calculateTotal().toFixed(2)}`, 450, finalY + 55);

    if (newInvoice.notes) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Notes / Terms:', 40, finalY + 80);
      doc.text(newInvoice.notes, 40, finalY + 95, { maxWidth: 300 });
    }

    if (action === 'download') {
      doc.save(`Invoice_${invoiceId || 'Draft'}.pdf`);
    } else if (action === 'base64') {
      return doc.output('datauristring');
    }
  };

  const handleSendInvoiceClick = () => {
    if (!canSend) {
      toast.error(sendDisabledReason);
      return;
    }
    if (!newInvoice.recipientEmail) {
      toast.error('Recipient email is required to send.');
      return;
    }
    setIsConfirmSendOpen(true);
  };

  const executeSendInvoice = async () => {
    setIsConfirmSendOpen(false);
    toast.loading('Generating PDF and sending invoice...');
    const pdfBase64 = generatePDF('base64');
    await sendEmailMutation.mutateAsync({ 
      id: invoiceId, 
      pdfBase64,
      to: newInvoice.recipientEmail,
      cc: newInvoice.ccEmail,
      bcc: newInvoice.bccEmail
    });
    toast.dismiss();
  };

  const handleDuplicate = () => {
    setInvoiceId(null);
    setNewInvoice(prev => ({ ...prev, status: 'DRAFT', dueDate: '' }));
    setSaveStatus('Duplicated as new draft');
    setHasUnsavedChanges(true);
    toast.success('Invoice Duplicated');
  };

  const getStatusBadge = (status) => {
    const maps = {
      'DRAFT': 'bg-slate-100 text-slate-600 border-slate-200',
      'PENDING_APPROVAL': 'bg-amber-100 text-amber-600 border-amber-200',
      'APPROVED': 'bg-emerald-100 text-emerald-600 border-emerald-200',
      'SENT': 'bg-blue-100 text-blue-600 border-blue-200',
      'PAID': 'bg-emerald-500 text-white border-emerald-600',
      'OVERDUE': 'bg-rose-100 text-rose-600 border-rose-200'
    };
    return maps[status] || maps['DRAFT'];
  };

  let canSend = true;
  let sendDisabledReason = '';

  if (!newInvoice.leadId) {
     canSend = false;
     sendDisabledReason = 'Select a client first';
  } else if (!newInvoice.dueDate) {
     canSend = false;
     sendDisabledReason = 'Due date is required';
  } else if (!newInvoice.items || newInvoice.items.length === 0) {
     canSend = false;
     sendDisabledReason = 'Add at least one line item';
  } else if (calculateTotal() <= 0) {
     canSend = false;
     sendDisabledReason = 'Invoice total must be greater than zero';
  } else if (hasUnsavedChanges || !invoiceId) {
     canSend = false;
     sendDisabledReason = 'Save invoice before sending';
  }

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Financial Ledger</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Manage enterprise invoices and billing pipelines</p>
        </div>
        <button 
           onClick={() => {
             setInvoiceId(null);
             setNewInvoice({ leadId: '', dueDate: getDefaultDueDate(), currency: 'USD', notes: '', discount: 0, items: [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }], status: 'DRAFT', recipientEmail: '', ccEmail: '', bccEmail: '' });
             setHasUnsavedChanges(false);
             setSaveStatus('');
             setIsModalOpen(true);
           }}
           className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-3 border border-indigo-500"
        >
           <PlusCircle size={20} /> Create Invoice
        </button>
      </div>

      {/* TABLE */}
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
                  ) : invoices?.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <FileText size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tight mb-2">No Invoices Found</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Your financial ledger is currently empty. Create your first enterprise invoice to populate the history.</p>
                      </td>
                    </tr>
                  ) : invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-none border-slate-50 hover:bg-slate-50/50 transition-all duration-300 group">
                       <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${inv.status === 'DRAFT' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                <FileText size={16} />
                             </div>
                             <span className="font-bold text-[#0F172A]">{inv.invoiceNo}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-700">
                             {inv.client?.customerName || leads?.find(l => String(l.id) === String(inv.clientId))?.customerName || 'Draft Account'}
                          </span>
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-600">
                          {inv.raisedBy?.name || 'Self'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-slate-400">
                          {inv.approver?.name || 'Pending Allocation'}
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
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Not Set'}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-xs font-medium text-slate-400">
                          {new Date(inv.updatedAt).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-6 whitespace-nowrap text-right">
                          <button onClick={() => openInvoice(inv)} className="h-10 px-5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm transition-all font-black uppercase tracking-widest">
                             {inv.status === 'DRAFT' ? 'Edit' : 'View'}
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* COMPOSER MODAL */}
      <AnimatePresence>
         {isModalOpen && (
           <ModalPortal>
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md" onClick={handleClose} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-[95vw] h-[90vh] bg-[#F8FAFC] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                   
                   {/* HEADER */}
                   <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText size={20} />
                         </div>
                         <div>
                            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Enterprise Composer</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               {isAutoSaving && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>}
                               {saveStatus || 'Unsaved'}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${getStatusBadge(newInvoice.status)}`}>
                            {newInvoice.status}
                         </div>
                         <button onClick={handleClose} className="w-10 h-10 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-xl flex items-center justify-center text-slate-400 transition-colors">
                            <X size={18} />
                         </button>
                      </div>
                   </div>

                   {/* CONTENT */}
                   <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                      {/* LEFT PANEL */}
                      <div className="w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 p-8 space-y-8">
                         <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-6">Client & Terms</h3>
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Client Target</label>
                                  <select disabled={newInvoice.status !== 'DRAFT'} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-xs disabled:opacity-50" value={newInvoice.leadId} onChange={e => handleUpdateField('leadId', e.target.value)}>
                                     <option value="">Select Verified Client...</option>
                                     {leads?.map(l => <option key={l.id} value={l.id}>{l.customerName}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Due Date</label>
                                  <input disabled={newInvoice.status !== 'DRAFT'} type="date" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-xs disabled:opacity-50" value={newInvoice.dueDate} onChange={e => handleUpdateField('dueDate', e.target.value)} />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Currency</label>
                                  <select disabled={newInvoice.status !== 'DRAFT'} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-xs disabled:opacity-50" value={newInvoice.currency} onChange={e => handleUpdateField('currency', e.target.value)}>
                                     <option value="USD">USD - US Dollar</option>
                                     <option value="EUR">EUR - Euro</option>
                                     <option value="INR">INR - Indian Rupee</option>
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Notes</label>
                                  <textarea disabled={newInvoice.status !== 'DRAFT'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-xs resize-none h-32 disabled:opacity-50" value={newInvoice.notes} onChange={e => handleUpdateField('notes', e.target.value)} />
                               </div>
                            </div>
                            {newInvoice.leadId && (() => {
                               const selectedClient = leads?.find(l => String(l.id) === String(newInvoice.leadId));
                               return (
                                 <div className="mt-8 border-t border-slate-100 pt-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Client Information</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                       <p className="text-sm font-bold text-[#0F172A]">{selectedClient?.customerName}</p>
                                       {selectedClient?.email && <p className="text-xs font-medium text-slate-500">{selectedClient.email}</p>}
                                       {selectedClient?.phone && <p className="text-xs font-medium text-slate-500">{selectedClient.phone}</p>}
                                    </div>
                                 </div>
                               );
                             })()}

                             <div className="mt-8 border-t border-slate-100 pt-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Email Delivery</h3>
                                <div className="space-y-4">
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Send To</label>
                                      <input type="email" placeholder="client@example.com" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-xs" value={newInvoice.recipientEmail} onChange={e => handleUpdateField('recipientEmail', e.target.value)} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">CC (Optional)</label>
                                      <input type="email" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-xs" value={newInvoice.ccEmail} onChange={e => handleUpdateField('ccEmail', e.target.value)} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">BCC (Optional)</label>
                                      <input type="email" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-xs" value={newInvoice.bccEmail} onChange={e => handleUpdateField('bccEmail', e.target.value)} />
                                   </div>
                                </div>
                             </div>
                         </div>
                      </div>

                      {/* CENTER PANEL */}
                      <div className="flex-1 bg-[#F8FAFC] flex flex-col overflow-y-auto p-8 relative">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Products & Services</h3>
                            {newInvoice.status === 'DRAFT' && (
                              <button onClick={addItem} className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"><Plus size={14}/> Add Row</button>
                            )}
                         </div>
                         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="crm-table">
                               <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Qty</th>
                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Unit Price</th>
                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Tax</th>
                                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Total</th>
                                     <th className="p-4 w-12"></th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {newInvoice.items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50">
                                       <td className="p-2"><input disabled={newInvoice.status !== 'DRAFT'} className="w-full h-10 px-3 bg-transparent rounded text-xs font-bold text-[#0F172A] disabled:opacity-50" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></td>
                                       <td className="p-2"><input disabled={newInvoice.status !== 'DRAFT'} type="number" min="1" className="w-full h-10 px-3 bg-transparent rounded text-xs font-bold text-[#0F172A] disabled:opacity-50" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                                       <td className="p-2"><input disabled={newInvoice.status !== 'DRAFT'} type="number" min="0" className="w-full h-10 px-3 bg-transparent rounded text-xs font-bold text-[#0F172A] disabled:opacity-50" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} /></td>
                                       <td className="p-2"><input disabled={newInvoice.status !== 'DRAFT'} type="number" min="0" className="w-full h-10 px-3 bg-transparent rounded text-xs font-bold text-[#0F172A] disabled:opacity-50" value={item.tax} onChange={e => updateItem(idx, 'tax', e.target.value)} /></td>
                                       <td className="p-4 text-right font-black text-sm text-[#0F172A]">{((Number(item.quantity) * Number(item.unitPrice)) + (Number(item.tax) || 0)).toLocaleString()}</td>
                                       <td className="p-2 text-center">
                                          {newInvoice.status === 'DRAFT' && (
                                            <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 rounded"><Trash2 size={16}/></button>
                                          )}
                                       </td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      {/* RIGHT PANEL & ACTION BAR */}
                      <div className="w-full lg:w-[360px] bg-[#0F172A] text-white flex flex-col shrink-0 p-8 shadow-2xl relative">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-8">Financial Summary</h3>
                         
                         <div className="space-y-4 flex-1">
                            <div className="flex justify-between text-sm font-medium">
                               <span className="text-slate-400">Subtotal</span>
                               <span>{newInvoice.currency} {calculateSubtotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                               <span className="text-slate-400">Taxes</span>
                               <span>{newInvoice.currency} {calculateTaxes().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                               <span className="text-slate-400">Discount Amount</span>
                               <input disabled={newInvoice.status !== 'DRAFT'} type="number" className="w-24 h-8 px-2 bg-white/5 border border-white/10 rounded text-right text-xs outline-none disabled:opacity-50" value={newInvoice.discount} onChange={e => handleUpdateField('discount', Number(e.target.value))} />
                            </div>
                            
                            <div className="border-t border-white/10 my-6 pt-6 flex justify-between items-end">
                               <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Final Total</span>
                               <span className="text-4xl font-black tabular-nums">{newInvoice.currency} {calculateTotal().toLocaleString()}</span>
                            </div>
                         </div>

                         {/* ACTION BAR */}
                         <div className="space-y-3 mt-8">
                            <div className="grid grid-cols-2 gap-3">
                               <button disabled={newInvoice.status !== 'DRAFT'} onClick={() => handleSaveDraft(false)} className="h-12 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"><Save size={14}/> Save</button>
                               <button onClick={() => generatePDF('download')} className="h-12 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Download size={14}/> PDF</button>
                               <button onClick={handleDuplicate} className="h-12 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Copy size={14}/> Clone</button>
                               {newInvoice.status === 'DRAFT' && (
                                 <button onClick={() => handleSaveDraft(false, 'PENDING_APPROVAL').then(() => {
                                   toast.success('Submitted for Approval');
                                 })} className="h-12 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 text-center leading-tight">Submit</button>
                               )}
                            </div>
                            <div className="w-full">
                               <button 
                                  onClick={handleSendInvoiceClick}
                                  className={`w-full h-14 rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                                    !canSend ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                  }`}
                               >
                                  <Send size={16} className={!canSend ? 'opacity-50' : ''} /> SEND INVOICE
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
             </div>
           </ModalPortal>
         )}
      </AnimatePresence>
      {/* SEND CONFIRMATION MODAL */}
      <AnimatePresence>
        {isConfirmSendOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-sm" onClick={() => setIsConfirmSendOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Send size={24} />
                 </div>
                 <h3 className="text-xl font-black text-center text-[#0F172A] mb-2">Send Invoice {invoiceId ? `INV-${invoiceId}` : ''}?</h3>
                 <p className="text-center crm-body mt-1 mb-8">
                    This will dispatch the official PDF invoice directly to:<br/>
                    <strong className="text-indigo-600">{newInvoice.recipientEmail}</strong>
                 </p>
                 <div className="flex gap-3">
                    <button onClick={() => setIsConfirmSendOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={executeSendInvoice} className="flex-1 h-12 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">Send Invoice</button>
                 </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {sendSuccessInfo && (
          <ModalPortal>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-sm" onClick={() => setSendSuccessInfo(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl border border-emerald-100">
                 <div className="bg-emerald-500 p-8 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                       <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Sent Successfully</h3>
                 </div>
                 <div className="p-8 space-y-6 bg-[#F8FAFC]">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <p className="text-sm font-bold text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16}/> {sendSuccessInfo.status}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered To</p>
                          <p className="text-sm font-bold text-[#0F172A] truncate" title={sendSuccessInfo.recipientEmail}>{sendSuccessInfo.recipientEmail}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                          <p className="text-sm font-bold text-[#0F172A]">{sendSuccessInfo.timestamp.toLocaleString()}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-100 col-span-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SMTP Target Message ID</p>
                          <p className="text-xs font-mono text-slate-600 break-all">{sendSuccessInfo.messageId}</p>
                       </div>
                    </div>
                    <button onClick={() => setSendSuccessInfo(null)} className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-colors">Done</button>
                 </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentInvoices;
