import React, { useState } from 'react';
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
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminLeadsImport = () => {
  const [activeTab, setActiveTab] = useState('CSV');
  const [isUploading, setIsUploading] = useState(false);

  const tabs = [
    { id: 'CSV', label: 'CSV Upload', icon: <FileUp size={20} /> },
    { id: 'GOOGLE', label: 'Google Ads', icon: <Globe size={20} /> },
    { id: 'META', label: 'Meta Ads', icon: <Target size={20} /> },
    { id: 'WEBHOOK', label: 'Webhooks', icon: <CloudUpload size={20} /> },
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Import Gateway Active</span>
           </div>
           <h1 className="text-5xl font-bold text-[#0F172A] tracking-tight leading-none">Lead Import</h1>
        </div>
      </div>

      {/* MULTI-CHANNEL TABS */}
      <div className="flex gap-4 p-2 bg-white border border-[#E2E8F0] rounded-[32px] w-fit shadow-sm">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`h-16 px-10 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-4 transition-all ${
               activeTab === tab.id ? 'bg-[#0F172A] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
             }`}
           >
              {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* INGESTION CANVAS */}
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-12 rounded-[48px] border border-[#E2E8F0] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 opacity-5 italic text-[#0F172A] text-9xl font-black tracking-tighter uppercase pointer-events-none">{activeTab}</div>
               
               <AnimatePresence mode="wait">
                  {activeTab === 'CSV' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight">CSV Data Import</h3>
                           <p className="text-sm font-medium text-[#64748B]">Upload structured lead datasets via CSV or Excel files.</p>
                        </div>

                       <div className="border-4 border-dashed border-slate-100 rounded-[40px] p-24 text-center space-y-8 bg-slate-50/50 hover:bg-white hover:border-blue-600/20 transition-all duration-700 group cursor-pointer">
                          <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shadow-sm relative">
                             <FileUp size={40} />
                             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                                <Zap size={18} fill="currentColor" />
                             </div>
                          </div>
                          <div>
                             <p className="text-xl font-black text-[#0F172A] uppercase italic">Drop dataset or browse node</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Supports .csv, .xlsx (Tier-IV Validation Engine)</p>
                          </div>
                       </div>

                       <div className="flex gap-6">
                          <div className="flex-1 space-y-4">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Distribution Logic</label>
                             <select className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-full font-black text-[11px] uppercase tracking-widest text-[#0F172A] outline-none appearance-none">
                                <option>Round Robin (Global Hub)</option>
                                <option>Weighted Deployment</option>
                                <option>Manual Lead Segment</option>
                             </select>
                          </div>
                          <button className="h-18 px-12 bg-blue-600 text-white rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all">
                             Initialize Refresh
                          </button>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'GOOGLE' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10 text-center py-20 pb-10">
                       <div className="w-24 h-24 bg-rose-50 border border-rose-100 rounded-[32px] mx-auto flex items-center justify-center text-rose-600 mb-10 shadow-sm">
                          <Globe size={40} />
                       </div>
                        <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-4">Google Ads Integration</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Connecting to Google Cloud Services to automate keyword and search lead ingestion.</p>
                       <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-[#E2E8F0] max-w-xs mx-auto">
                          <button className="w-full py-6 bg-white border border-[#E2E8F0] rounded-2xl text-[10px] font-black uppercase text-[#0F172A] tracking-widest shadow-sm hover:bg-slate-50 transition-all">Authorize Access</button>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'META' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10 text-center py-20 pb-10">
                       <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-[32px] mx-auto flex items-center justify-center text-blue-600 mb-10 shadow-sm">
                          <Target size={40} />
                       </div>
                        <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-4">Meta Ads Integration</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Initializing secure API connection between Meta Business Manager and your CRM.</p>
                       <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-[#E2E8F0] max-w-xs mx-auto">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 mb-4 tracking-widest">
                             <span>Refresh PROGRESS</span>
                             <span className="text-blue-600 italic">44%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-600 w-[44%]" />
                          </div>
                       </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'WEBHOOK' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 relative z-10">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-bold text-[#0F172A] tracking-tight">API Webhooks</h3>
                           <p className="text-sm font-medium text-[#64748B]">Manage secure endpoints for real-time external data Synchronization.</p>
                        </div>

                       <div className="p-10 bg-[#0F172A] rounded-[32px] border border-[#0F172A] space-y-8 flex items-center justify-between shadow-2xl">
                           <div className="space-y-2">
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Production Webhook URL</p>
                              <p className="text-lg font-mono text-white opacity-90 select-all tracking-tighter">https://api.adv-crm.ai/v1/ingest/8842-X10...</p>
                           </div>
                          <button className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Copy Key</button>
                       </div>

                       <div className="grid grid-cols-2 gap-10">
                          <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-6">
                             <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm"><CheckCircle2 size={24}/></div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Ingest</p>
                                <p className="text-2xl font-black text-[#0F172A] tracking-tighter">14,202</p>
                             </div>
                          </div>
                          <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-6">
                             <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><Clock size={24}/></div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Latency</p>
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
                  <h3 className="text-xl font-bold text-[#0F172A] tracking-tight leading-none">Recent Imports</h3>
                  <History size={22} className="text-slate-200" />
               </div>
               
               <div className="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-10 before:w-px before:bg-slate-100">
                  {[
                    { source: 'CSV Upload', count: '482', time: '12m ago', status: 'COMPLETE' },
                    { source: 'Google Ads API', count: '14', time: '1h ago', status: 'Loading...,
                    { source: 'Webhook Ingest', count: '102', time: '5h ago', status: 'COMPLETE' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-6 relative z-10 group cursor-default">
                       <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform ${log.status === 'Loading... 'text-blue-500 animate-pulse' : 'text-slate-300'}`}>
                          <Layers size={18} />
                       </div>
                       <div className="flex-1 bg-slate-50 border border-transparent hover:border-slate-100 hover:bg-white p-6 rounded-3xl transition-all duration-700">
                          <p className="text-[13px] font-black text-[#0F172A] uppercase italic">{log.source}</p>
                          <div className="flex justify-between items-center mt-3">
                             <span className="text-[10px] font-black text-blue-600">{log.count} Accounts</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">{log.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <button className="w-full mt-12 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                  Access Full Protocol History
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};

export default AdminLeadsImport;
