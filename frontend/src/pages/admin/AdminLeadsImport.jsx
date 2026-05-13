import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Globe, 
  Target, 
  Layers, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  History,
  Database,
  CloudUpload,
  Users,
  Layout,
  AlertCircle,
  Download,
  Loader2,
  XCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminLeadsImport = () => {
  const [activeTab, setActiveTab] = useState('CSV');
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  const tabs = [
    { id: 'CSV', label: 'CSV Upload', icon: <FileUp size={20} /> },
    { id: 'GOOGLE', label: 'Google Ads', icon: <Globe size={20} /> },
    { id: 'META', label: 'Meta Ads', icon: <Target size={20} /> },
    { id: 'WEBHOOK', label: 'Webhooks', icon: <CloudUpload size={20} /> },
  ];

  const uploadMutation = useMutation({
    mutationFn: (formData) => api.post('/core/imports/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: (res) => {
      setImportResults(res.data);
      toast.success(res.data.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Sync failed');
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const downloadFailedCSV = () => {
    if (!importResults?.failedRows?.length) return;
    
    // Attempt to extract headers dynamically from first failed row's data
    const firstRowData = importResults.failedRows[0].data;
    const dataHeaders = Object.keys(firstRowData);
    
    const headers = ['Row Number', ...dataHeaders, 'Validation Errors'];
    const rows = importResults.failedRows.map(f => [
      f.rowNumber,
      ...dataHeaders.map(h => f.data[h] || ''),
      f.errors.join('; ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `failed_leads_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 italic">Import System Active</span>
           </div>
           <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">Lead Import</h1>
        </div>
      </div>

      {/* MULTI-CHANNEL TABS */}
      <div className="flex gap-4 p-2 bg-white border border-[#E2E8F0] rounded-[32px] w-fit shadow-sm">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => {
               setActiveTab(tab.id);
               setImportResults(null);
             }}
             className={`h-16 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 transition-all ${
               activeTab === tab.id ? 'bg-[#0F172A] text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'
             }`}
           >
              {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* IMPORT AREA */}
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-12 rounded-[48px] border border-[#E2E8F0] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 opacity-5 italic text-[#0F172A] text-9xl font-black tracking-tighter uppercase pointer-events-none">{activeTab}</div>
               
               <AnimatePresence mode="wait">
                  {activeTab === 'CSV' && !importResults && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">CSV Import Settings</h3>
                           <p className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Supports Structured Datasets (Advanced Validation Enabled)</p>
                        </div>

                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept=".csv" 
                         onChange={handleFileUpload} 
                       />

                       <div 
                         onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
                         className={`border-4 border-dashed rounded-[40px] p-24 text-center space-y-8 transition-all duration-700 group cursor-pointer ${
                           uploadMutation.isPending 
                           ? 'bg-slate-50 border-blue-200 cursor-wait' 
                           : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-600/20'
                         }`}
                       >
                          <div className={`w-24 h-24 bg-white border border-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-300 transition-all duration-700 shadow-sm relative ${!uploadMutation.isPending && 'group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white'}`}>
                             {uploadMutation.isPending ? <Loader2 size={40} className="animate-spin text-blue-600" /> : <FileUp size={40} />}
                             {!uploadMutation.isPending && (
                               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                                  <Zap size={18} fill="currentColor" />
                               </div>
                             )}
                          </div>
                          <div>
                             <p className="text-xl font-black text-[#0F172A] uppercase italic">
                               {uploadMutation.isPending ? 'Importing Leads...' : 'Drop dataset or browse files'}
                             </p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Capacity: 10,000 leads per import cycle</p>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'CSV' && importResults && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 relative z-10">
                       <div className="flex items-center justify-between">
                          <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Import Report</h3>
                          <button 
                            onClick={() => setImportResults(null)}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#0F172A] transition-colors"
                          >
                             Start New Import
                          </button>
                       </div>

                       {/* SUMMARY CARDS */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Scanned</p>
                             <p className="text-3xl font-black text-[#0F172A] tracking-tighter">{importResults.total}</p>
                          </div>
                          <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100">
                             <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Successfully Imported</p>
                             <p className="text-3xl font-black text-emerald-700 tracking-tighter">{importResults.inserted}</p>
                          </div>
                          <div className={`p-6 rounded-[32px] border ${importResults.duplicates > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                             <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${importResults.duplicates > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Deduplicated</p>
                             <p className={`text-3xl font-black tracking-tighter ${importResults.duplicates > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{importResults.duplicates}</p>
                          </div>
                          <div className={`p-6 rounded-[32px] border ${importResults.errors > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                             <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${importResults.errors > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Validation Errors</p>
                             <p className={`text-3xl font-black tracking-tighter ${importResults.errors > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{importResults.errors}</p>
                          </div>
                       </div>

                       {/* DUPLICATE ROWS SECTION */}
                       {importResults.duplicateRows?.length > 0 && (
                          <div className="space-y-6 mt-12">
                             <div className="flex items-center gap-3 text-amber-600">
                                <Users size={20} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Duplicate Lead Records (Skipped)</span>
                             </div>
                             <div className="bg-white border border-amber-100 rounded-[32px] overflow-hidden shadow-sm opacity-80">
                                <div className="max-h-[300px] overflow-y-auto">
                                   <table className="w-full text-left">
                                      <thead className="bg-amber-50 sticky top-0 z-10">
                                         <tr>
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-amber-600">Lead Name</th>
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-amber-600">Duplicate Reason</th>
                                         </tr>
                                      </thead>
                                      <tbody className="divide-y divide-amber-50 text-[11px]">
                                         {importResults.duplicateRows.map((d, i) => (
                                           <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                              <td className="px-8 py-4">
                                                 <span className="font-bold text-[#0F172A]">{d.customerName}</span>
                                                 <span className="ml-4 text-slate-400 font-mono italic">{d.email || d.phone}</span>
                                              </td>
                                              <td className="px-8 py-4 text-amber-700 font-bold italic uppercase tracking-tighter">
                                                 {d.reason}
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                             </div>
                          </div>
                       )}

                       {/* LOGIC ERRORS TABLE */}
                       {importResults.errorRows?.length > 0 && (
                          <div className="space-y-6 mt-12">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-rose-600">
                                   <AlertCircle size={20} />
                                   <span className="text-[11px] font-black uppercase tracking-widest">Validation Errors</span>
                                </div>
                                <button 
                                  onClick={downloadFailedCSV}
                                  className="flex items-center gap-3 px-6 h-12 bg-[#0F172A] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
                                >
                                   <Download size={14} /> Download Failed CSV
                                </button>
                             </div>
 
                             <div className="bg-white border border-rose-100 rounded-[32px] overflow-hidden shadow-sm">
                                <div className="max-h-[400px] overflow-y-auto">
                                   <table className="w-full text-left">
                                      <thead className="bg-rose-50 sticky top-0 z-10">
                                         <tr>
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-rose-600">Row</th>
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-rose-600">Lead Data</th>
                                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-rose-600">Validation Errors</th>
                                         </tr>
                                      </thead>
                                      <tbody className="divide-y divide-rose-50">
                                         {importResults.errorRows.map((f, i) => (
                                           <tr key={i} className="hover:bg-rose-50/30 transition-colors group">
                                              <td className="px-8 py-6 font-mono text-xs text-rose-400">#{f.row}</td>
                                              <td className="px-8 py-6">
                                                 <div className="space-y-1">
                                                    <p className="text-xs font-bold text-[#0F172A]">{f.data?.Name || f.data?.name || 'N/A'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{f.data?.Email || f.data?.email || 'NO_EMAIL'}</p>
                                                 </div>
                                              </td>
                                              <td className="px-8 py-6">
                                                 <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                                                    {f.reason}
                                                 </span>
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                             </div>
                          </div>
                       )}

                       {importResults.inserted > 0 && importResults.errors === 0 && (
                          <div className="p-12 bg-emerald-50 border border-emerald-100 rounded-[40px] text-center space-y-6 mt-12">
                             <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                <CheckCircle2 size={32} />
                             </div>
                             <div>
                                <h4 className="text-2xl font-black text-emerald-800 tracking-tighter uppercase italic">Import Successful</h4>
                                <p className="text-sm font-medium text-emerald-600 mt-2">All leads successfully imported and synchronized with the CRM.</p>
                             </div>
                          </div>
                       )}
                    </motion.div>
                  )}

                  {activeTab === 'GOOGLE' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10 text-center py-20 pb-10">
                       <div className="w-24 h-24 bg-rose-50 border border-rose-100 rounded-[32px] mx-auto flex items-center justify-center text-rose-600 mb-10 shadow-sm">
                          <Globe size={40} />
                       </div>
                        <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic mb-4">Google Ads Integration</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto italic">Direct Lead Import System</p>
                       <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-[#E2E8F0] max-w-xs mx-auto">
                          <button className="w-full py-6 bg-white border border-[#E2E8F0] rounded-2xl text-[10px] font-black uppercase text-[#0F172A] tracking-widest shadow-sm hover:bg-slate-50 transition-all">Connect Account</button>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'META' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10 text-center py-20 pb-10">
                       <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-[32px] mx-auto flex items-center justify-center text-blue-600 mb-10 shadow-sm">
                          <Target size={40} />
                       </div>
                        <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic mb-4">Meta Ads Import</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto italic">Social Integration Setup</p>
                       <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-[#E2E8F0] max-w-xs mx-auto">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 mb-4 tracking-widest">
                             <span>CONNECTING...</span>
                             <span className="text-blue-600 italic">44%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                             <div className="h-full bg-blue-600 w-[44%] shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                          </div>
                       </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'WEBHOOK' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">API Webhooks</h3>
                           <p className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Live Integration Settings</p>
                        </div>

                       <div className="p-10 bg-[#0F172A] rounded-[32px] border border-[#0F172A] space-y-8 flex items-center justify-between shadow-2xl">
                           <div className="space-y-2">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Production Webhook URL</p>
                              <p className="text-lg font-mono text-white opacity-90 select-all tracking-tighter">https://api.adv-crm.ai/v1/ingest/8842-X10...</p>
                           </div>
                          <button className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Copy Secure Key</button>
                       </div>

                       <div className="grid grid-cols-2 gap-10">
                          <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-6 group hover:shadow-xl transition-all">
                             <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform"><CheckCircle2 size={24}/></div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Scanned</p>
                                <p className="text-2xl font-black text-[#0F172A] tracking-tighter">14,202</p>
                             </div>
                          </div>
                          <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-6 group hover:shadow-xl transition-all">
                             <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform"><Clock size={24}/></div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processing Speed</p>
                                <p className="text-2xl font-black text-[#0F172A] tracking-tighter">14ms</p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* RECENT ACTIVITY (Refresh HISTORY) */}
         <div className="space-y-10">
            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Import History</h3>
                  <History size={22} className="text-slate-200" />
               </div>
               
               <div className="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-10 before:w-px before:bg-slate-100">
                  {[
                    { source: 'CSV Upload', count: '482', time: '12m ago', status: 'COMPLETE' },
                    { source: 'Google Ads API', count: '14', time: '1h ago', status: 'Loading' },
                    { source: 'Webhook Import', count: '102', time: '5h ago', status: 'COMPLETE' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-6 relative z-10 group cursor-default">
                       <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform ${log.status === 'Loading' ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`}>
                          <Layers size={18} />
                       </div>
                       <div className="flex-1 bg-slate-50 border border-transparent hover:border-slate-100 hover:bg-white p-6 rounded-3xl transition-all duration-700">
                          <p className="text-[11px] font-black text-[#0F172A] uppercase italic tracking-wider">{log.source}</p>
                          <div className="flex justify-between items-center mt-3">
                             <span className="text-[10px] font-black text-blue-600 italic">{log.count} Records</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase italic">{log.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <button className="w-full mt-12 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">
                  Full Gateway History
               </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[40px] shadow-2xl shadow-blue-500/30 text-white space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-20"><Database size={80} /></div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Registry Integrity</p>
                  <h4 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">99.9% Clean Data</h4>
                  <p className="text-[11px] font-medium opacity-80 leading-relaxed uppercase tracking-wider">Advanced Validation prevents duplicate leads from entering the CRM core.</p>
               </div>
               <button className="w-full py-5 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">View Data Quality</button>
            </div>
         </div>

      </div>
    </div>
  );
};

export default AdminLeadsImport;
