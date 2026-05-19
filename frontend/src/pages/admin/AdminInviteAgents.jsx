import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, Users, FileUp, Send, Loader2, Copy, Trash2, CheckCircle2, 
  XCircle, AlertCircle, ChevronRight, UserPlus, Clipboard, Clock,
  ArrowLeft, Download, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminInviteAgents = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('single'); // single, bulk, pending
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Tab 1 state
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleSentLink, setSingleSentLink] = useState('');

  // Tab 2 state
  const [bulkOption, setBulkOption] = useState('manual'); // manual, csv
  const [bulkText, setBulkText] = useState('');
  const [bulkReport, setBulkReport] = useState(null);

  // Tab 2 CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null); // { total, valid, invalid, rows }
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const [csvReport, setCsvReport] = useState(null);

  // Tab 3 state
  const [pendingStatusFilter, setPendingStatusFilter] = useState('pending'); // pending, accepted, expired, cancelled
  const [pendingPage, setPendingPage] = useState(1);

  // Fetch Teams
  const { data: teams } = useQuery({
    queryKey: ['adminTeamsList'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return res.data.data;
    }
  });

  // Fetch Pending Invitations
  const { data: invitationsData, refetch: refetchInvitations } = useQuery({
    queryKey: ['adminInvitations', pendingStatusFilter, pendingPage],
    queryFn: async () => {
      const res = await api.get('/admin/agents/invitations', {
        params: { status: pendingStatusFilter, page: pendingPage, limit: 10 }
      });
      return res.data;
    }
  });

  // Auto-refresh pending list every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refetchInvitations();
    }, 30000);
    return () => clearInterval(timer);
  }, [refetchInvitations]);

  // Mutations
  const inviteSingleMutation = useMutation({
    mutationFn: (data) => api.post('/admin/agents/invite-single', data),
    onSuccess: (res) => {
      toast.success('Agent invitation dispatched successfully');
      setSingleSentLink(res.data.inviteUrl);
      queryClient.invalidateQueries(['adminInvitations']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    }
  });

  const inviteBulkMutation = useMutation({
    mutationFn: (data) => api.post('/admin/agents/invite-bulk', data),
    onSuccess: (res) => {
      toast.success(`Successfully sent ${res.data.sent} of ${res.data.total} invitations`);
      setBulkReport(res.data);
      setBulkText('');
      queryClient.invalidateQueries(['adminInvitations']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send bulk invitations');
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/agents/invitations/${id}/resend`),
    onSuccess: (res) => {
      toast.success('Invitation resent successfully!');
      // Copy to clipboard
      navigator.clipboard.writeText(res.data.inviteUrl);
      toast.success('New invitation URL copied to clipboard');
      refetchInvitations();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Resend failed')
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/agents/invitations/${id}`),
    onSuccess: () => {
      toast.success('Invitation cancelled successfully');
      refetchInvitations();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cancellation failed')
  });

  // Handle CSV file selection and preview
  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are accepted');
      return;
    }
    setCsvFile(file);
    
    // Create pre-validation preview locally using FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        toast.error('CSV file has no data rows');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIdx = headers.indexOf('email');
      const nameIdx = headers.indexOf('name');
      const phoneIdx = headers.indexOf('phone');

      if (emailIdx === -1) {
        toast.error('CSV file must have at least an "email" column header');
        return;
      }

      const rows = [];
      let validCount = 0;
      let invalidCount = 0;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(c => c.trim());
        const email = columns[emailIdx] || '';
        const name = nameIdx !== -1 ? columns[nameIdx] || '' : '';
        const phone = phoneIdx !== -1 ? columns[phoneIdx] || '' : '';

        const isValid = email && emailRegex.test(email);
        if (isValid) validCount++;
        else invalidCount++;

        rows.push({
          rowNum: i,
          email: email || '(Missing)',
          name: name || '(Blank)',
          phone: phone || '(Blank)',
          isValid
        });
      }

      setCsvPreview({
        total: lines.length - 1,
        valid: validCount,
        invalid: invalidCount,
        rows
      });
    };
    reader.readAsText(file);
  };

  // Submit CSV file
  const handleCsvSubmit = async () => {
    if (!csvFile || !selectedTeamId) {
      toast.error('CSV file and Team are required');
      return;
    }

    setIsCsvUploading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('teamId', selectedTeamId);

    try {
      const res = await api.post('/admin/agents/invite-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Dispatched ${res.data.sentCount} invitations successfully!`);
      setCsvReport(res.data);
      setCsvFile(null);
      setCsvPreview(null);
      queryClient.invalidateQueries(['adminInvitations']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setIsCsvUploading(false);
    }
  };

  // Manual Bulk Send
  const handleBulkManualSend = () => {
    if (!bulkText || !selectedTeamId) {
      toast.error('Please enter email addresses and select a team');
      return;
    }

    const lines = bulkText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    const invites = lines.map(line => {
      // Check if format is "Name <email>" or just "email"
      const match = line.match(/^([^<]+)<([^>]+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: line };
    });

    inviteBulkMutation.mutate({
      invites,
      teamId: selectedTeamId
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Invitation link copied to clipboard!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link to="/admin/agents" className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Agent Invitation Center</h1>
          </div>
          <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest pl-12">Provision enterprise-level sales workspaces for new team assets.</p>
        </div>

        <Link 
          to="/admin/agents"
          className="h-12 px-6 rounded-2xl border border-slate-200 hover:border-slate-300 text-slate-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Users size={16} /> View Team Members
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 p-2 bg-slate-50 rounded-[28px] max-w-md shadow-inner">
        {[
          { id: 'single', label: 'Single Invite', icon: UserPlus },
          { id: 'bulk', label: 'Bulk Import', icon: FileUp },
          { id: 'pending', label: 'Pending Queue', icon: Clock }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setBulkReport(null);
                setCsvReport(null);
                setSingleSentLink('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-black uppercase tracking-wider text-[11px] transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'single' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Deploy Individual Workspaces</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                inviteSingleMutation.mutate({
                  email: singleEmail,
                  name: singleName,
                  phone: singlePhone,
                  teamId: selectedTeamId
                });
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Network Email Address *</label>
                    <input 
                      type="email" required placeholder="e.g. agent@company.com"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                      value={singleEmail} onChange={e => setSingleEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Sales Team *</label>
                    <select 
                      required
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1.2rem_center] bg-no-repeat"
                      value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}
                    >
                      <option value="">Choose team...</option>
                      {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name (Optional)</label>
                    <input 
                      type="text" placeholder="e.g. John Doe"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                      value={singleName} onChange={e => setSingleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                    <input 
                      type="text" placeholder="e.g. +91 98765 43210"
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                      value={singlePhone} onChange={e => setSinglePhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={inviteSingleMutation.isPending}
                  className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {inviteSingleMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>Send Invitation <Send size={14} /></>
                  )}
                </button>
              </form>

              {/* Success Result Link display */}
              {singleSentLink && (
                <div className="mt-8 p-6 bg-green-50/50 border border-green-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={20} />
                    <span className="font-extrabold text-[13px] uppercase tracking-wide">Invitation link generated successfully!</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Not everyone checks email. Share this link directly via WhatsApp or SMS for instant onboarding:</p>
                  
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      type="text" 
                      className="flex-1 bg-white border border-slate-200 px-4 h-11 text-xs rounded-xl font-mono text-slate-600 select-all outline-none"
                      value={singleSentLink}
                    />
                    <button 
                      onClick={() => copyToClipboard(singleSentLink)}
                      className="h-11 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">
                    <Clock size={12} /> Link expires in 72 hours
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Context */}
            <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
              <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">Single Dispatch Flow</h4>
              <div className="space-y-4">
                {[
                  { num: '01', title: 'Enter parameters', desc: 'Specify email, optionally name/phone, and assign target sales team.' },
                  { num: '02', title: 'SMTP delivery', desc: 'We deliver a beautiful, branded email containing a 72-hour invite URL.' },
                  { num: '03', title: 'Multi-channel share', desc: 'Copy the live secure URL to dispatch directly via Slack, Teams or WhatsApp.' }
                ].map(s => (
                  <div key={s.num} className="flex gap-4">
                    <span className="text-blue-600 font-black text-lg">{s.num}</span>
                    <div className="space-y-0.5">
                      <h5 className="font-black text-slate-800 text-xs uppercase tracking-wide">{s.title}</h5>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bulk' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl max-w-xs">
              <button 
                onClick={() => { setBulkOption('manual'); setBulkReport(null); setCsvReport(null); }}
                className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bulkOption === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Manual Entry
              </button>
              <button 
                onClick={() => { setBulkOption('csv'); setBulkReport(null); setCsvReport(null); }}
                className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bulkOption === 'csv' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                CSV Upload
              </button>
            </div>

            {bulkOption === 'manual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manual Bulk Entry</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">Enter recipient emails, one per line or separated by commas. Format: <code>email@domain.com</code> or <code>Name &lt;email@domain.com&gt;</code>.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Sales Team *</label>
                      <select 
                        required
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1.2rem_center] bg-no-repeat"
                        value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}
                      >
                        <option value="">Choose team...</option>
                        {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Addresses List</label>
                      <textarea
                        rows={6}
                        placeholder="John Smith <john@example.com>&#10;priya@example.com&#10;arjun@example.com"
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 font-mono text-xs"
                        value={bulkText} onChange={e => setBulkText(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleBulkManualSend}
                      disabled={inviteBulkMutation.isPending}
                      className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      {inviteBulkMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>Dispatch Bulk invitations <Send size={14} /></>
                      )}
                    </button>
                  </div>

                  {/* Bulk manual sending report */}
                  {bulkReport && (
                    <div className="mt-8 border border-slate-100 rounded-3xl p-6 space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Total', count: bulkReport.total, color: 'text-slate-600 bg-slate-50' },
                          { label: 'Sent', count: bulkReport.sent, color: 'text-green-700 bg-green-50' },
                          { label: 'Skipped/Failed', count: bulkReport.skipped.length + bulkReport.failed.length, color: 'text-red-700 bg-red-50' }
                        ].map(c => (
                          <div key={c.label} className={`p-4 rounded-2xl text-center ${c.color}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest block opacity-70 mb-1">{c.label}</span>
                            <span className="text-2xl font-black">{c.count}</span>
                          </div>
                        ))}
                      </div>

                      {bulkReport.skipped.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Skipped entries:</span>
                          <div className="max-h-36 overflow-y-auto border border-amber-100 bg-amber-50/20 rounded-2xl p-4 space-y-1.5">
                            {bulkReport.skipped.map((s, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-semibold text-amber-800">
                                <span>{s.email}</span>
                                <span className="opacity-80">({s.reason})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                  <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">Bulk Processing Specifications</h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">System schedules dispatches sequentially in batches of 10 with a 1-second delay between batches to respect SMTP servers rate limit bounds.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">CSV Bulk Import Wizard</h3>
                      <p className="text-xs text-slate-400 font-semibold">Upload spreadsheet file with agents emails, names, and phone numbers.</p>
                    </div>

                    <a 
                      href="/agents_import_template.csv" 
                      download
                      className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5 text-slate-600 transition-all"
                    >
                      <Download size={13} /> Sample CSV Template
                    </a>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Sales Team *</label>
                        <select 
                          required
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_1.2rem_center] bg-no-repeat"
                          value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}
                        >
                          <option value="">Choose team...</option>
                          {teams?.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select CSV File</label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvChange}
                          className="w-full h-14 file:h-14 file:px-4 file:bg-slate-900 file:text-white file:border-none file:font-black file:uppercase file:tracking-widest file:text-[9px] file:mr-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 font-bold text-xs text-slate-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Pre-validation local preview */}
                    {csvPreview && (
                      <div className="border border-slate-100 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800 uppercase tracking-wide">File Pre-Validation:</span>
                          <span className="font-bold text-slate-500">{csvPreview.valid} Valid, <span className={csvPreview.invalid > 0 ? 'text-red-500' : 'text-slate-500'}>{csvPreview.invalid} Invalid</span> rows</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <th className="p-3 pl-4">Row</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3 pr-4 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.rows.map((row) => (
                                <tr key={row.rowNum} className="border-b border-slate-50 font-semibold text-slate-600">
                                  <td className="p-3 pl-4 text-slate-400">#{row.rowNum}</td>
                                  <td className="p-3">{row.email}</td>
                                  <td className="p-3">{row.name}</td>
                                  <td className="p-3">{row.phone}</td>
                                  <td className="p-3 pr-4 text-right">
                                    {row.isValid ? (
                                      <span className="inline-block bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Valid</span>
                                    ) : (
                                      <span className="inline-block bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Invalid</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={handleCsvSubmit}
                          disabled={isCsvUploading || csvPreview.valid === 0}
                          className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isCsvUploading ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <>Confirm & Send {csvPreview.valid} Invitations <Send size={14} /></>
                          )}
                        </button>
                      </div>
                    )}

                    {/* CSV Upload Report */}
                    {csvReport && (
                      <div className="border border-slate-100 rounded-3xl p-6 space-y-6">
                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Final CSV Dispatch Report</h4>
                        
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { label: 'Total Rows', count: csvReport.totalRows, color: 'text-slate-600 bg-slate-50' },
                            { label: 'Valid Rows', count: csvReport.validRows, color: 'text-blue-700 bg-blue-50' },
                            { label: 'Sent', count: csvReport.sentCount, color: 'text-green-700 bg-green-50' },
                            { label: 'Skipped/Duplicates', count: csvReport.duplicateEmails.length + csvReport.alreadyInvited.length, color: 'text-amber-700 bg-amber-50' }
                          ].map(c => (
                            <div key={c.label} className={`p-4 rounded-2xl text-center ${c.color}`}>
                              <span className="text-[10px] font-black uppercase tracking-widest block opacity-70 mb-1">{c.label}</span>
                              <span className="text-2xl font-black">{c.count}</span>
                            </div>
                          ))}
                        </div>

                        {csvReport.duplicateEmails.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Already in System (Skipped):</span>
                            <div className="max-h-32 overflow-y-auto border border-red-100 bg-red-50/20 rounded-2xl p-4 space-y-1 font-mono text-xs">
                              {csvReport.duplicateEmails.map((email, idx) => (
                                <div key={idx} className="text-red-800 font-semibold">{email}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                  <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase">CSV Headers Template</h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Spreadsheet file column headers must exactly contain:</p>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-700 border-b border-slate-50 pb-1.5">
                      <span>Header</span>
                      <span>Requirement</span>
                    </div>
                    {[
                      { key: 'email', req: 'Required' },
                      { key: 'name', req: 'Optional' },
                      { key: 'phone', req: 'Optional' }
                    ].map(h => (
                      <div key={h.key} className="flex justify-between text-xs font-mono">
                        <span className="text-slate-900 font-black">{h.key}</span>
                        <span className="text-slate-400">{h.req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm"
          >
            {/* Status and Action bar */}
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="flex gap-2">
                {[
                  { id: 'pending', label: '🟡 Active Pending' },
                  { id: 'accepted', label: '🟢 Accepted' },
                  { id: 'expired', label: '🔴 Expired' },
                  { id: 'cancelled', label: '⚫ Cancelled' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setPendingStatusFilter(f.id); setPendingPage(1); }}
                    className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      pendingStatusFilter === f.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => refetchInvitations()}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px] text-slate-500 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={13} /> Refresh List
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="p-4 pl-6">Invitee</th>
                    <th className="p-4">Operational Team</th>
                    <th className="p-4">Invited By</th>
                    <th className="p-4">Sent At</th>
                    <th className="p-4">Expires At</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitationsData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-slate-400 font-bold text-xs uppercase tracking-wide">
                        No invitations found in this status queue.
                      </td>
                    </tr>
                  ) : (
                    invitationsData?.data?.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-50 font-semibold text-slate-600 hover:bg-slate-50/50 transition-all">
                        <td className="p-4 pl-6 space-y-1">
                          <div className="font-extrabold text-slate-900">{inv.name || 'there'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{inv.email}</div>
                          {inv.phone && <div className="text-[10px] text-slate-400">{inv.phone}</div>}
                        </td>
                        <td className="p-4">
                          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                            {inv.teamName}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">{inv.invitedBy}</td>
                        <td className="p-4 text-xs text-slate-400">{new Date(inv.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-xs text-slate-400">{new Date(inv.expiresAt).toLocaleString()}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            {inv.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => copyToClipboard(inv.inviteUrl)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 rounded-xl transition-all"
                                  title="Copy Invitation URL"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => resendInviteMutation.mutate(inv.id)}
                                  disabled={resendInviteMutation.isPending}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-900 rounded-xl transition-all"
                                  title="Resend & Reset Expiry"
                                >
                                  <RefreshCw size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if(confirm('Cancel this agent invitation? Link will immediately become invalid.')) {
                                      cancelInviteMutation.mutate(inv.id);
                                    }
                                  }}
                                  disabled={cancelInviteMutation.isPending}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-900 rounded-xl transition-all"
                                  title="Cancel Invitation"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {inv.status === 'expired' && (
                              <button
                                onClick={() => resendInviteMutation.mutate(inv.id)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 flex items-center gap-1"
                              >
                                <RefreshCw size={12} /> Reactivate & Resend
                              </button>
                            )}
                            {inv.status === 'accepted' && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Accepted at {new Date(inv.acceptedAt).toLocaleDateString()}</span>
                            )}
                            {inv.status === 'cancelled' && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Cancelled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {invitationsData?.pagination && invitationsData.pagination.totalPages > 1 && (
              <div className="flex justify-end gap-2 pt-4">
                <button
                  disabled={pendingPage <= 1}
                  onClick={() => setPendingPage(prev => prev - 1)}
                  className="px-4 h-10 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pendingPage >= invitationsData.pagination.totalPages}
                  onClick={() => setPendingPage(prev => prev + 1)}
                  className="px-4 h-10 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInviteAgents;
