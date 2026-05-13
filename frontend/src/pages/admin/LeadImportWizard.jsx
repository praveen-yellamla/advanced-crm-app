import React, { useState } from 'react';
import { 
  FileUp, 
  CheckCircle2, 
  Database, 
  Map, 
  ShieldCheck, 
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  History,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const LeadImportWizard = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const firstLine = text.split('\n')[0];
        const cols = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setHeaders(cols);
        
        // Auto-mapping attempt
        const newMapping = { ...mapping };
        cols.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('name')) newMapping.name = h;
          if (lower.includes('email')) newMapping.email = h;
          if (lower.includes('phone')) newMapping.phone = h;
        });
        setMapping(newMapping);
        setStep(2);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!mapping.name || !mapping.phone) {
      return toast.error('Name and Phone mapping are mandatory');
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const res = await api.post('/core/imports/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Lead Import Wizard</h1>
            <p className="text-[#64748B] font-medium text-sm mt-1">Streamlined multi-source lead import with intelligent field mapping</p>
        </div>
        <button className="h-14 px-8 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-xs flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest">
           <History size={18} /> Audit History
        </button>
      </div>

      {/* WIZARD TRACKER */}
      <div className="flex items-center gap-6 px-10">
         <WizardStep num={1} label="Source Selection" active={step === 1} done={step > 1} />
         <div className="h-px flex-1 bg-slate-100" />
         <WizardStep num={2} label="Field Mapping" active={step === 2} done={step > 2} />
         <div className="h-px flex-1 bg-slate-100" />
         <WizardStep num={3} label="Data Validation" active={step === 3} done={step > 3} />
      </div>

      <AnimatePresence mode="wait">
         {step === 1 && (
           <motion.div 
             key="step1"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="bg-white p-20 rounded-[64px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-10 group hover:border-blue-600 transition-all duration-700"
           >
              <div className="w-32 h-32 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shadow-inner">
                 <FileUp size={48} />
              </div>
               <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">Lead Data Upload</h2>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">Supports CSV / XLSX up to 50,000 records. Duplicate detection will be executed automatically.</p>
               </div>
              <input type="file" id="bulk-upload" accept=".csv" className="hidden" onChange={handleFileChange} />
               <label htmlFor="bulk-upload" className="h-18 px-12 bg-[#0F172A] text-white rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all cursor-pointer flex items-center gap-4">
                  Start Upload <ArrowRight size={20} />
               </label>
           </motion.div>
         )}

         {step === 2 && (
           <motion.div 
             key="step2"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="bg-white p-16 rounded-[64px] border border-slate-100 shadow-sm space-y-12"
           >
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">Field Mapping Configuration</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Map source file columns to system lead attributes.</p>
                  </div>
                 <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} /> {headers.length} Headers Detected
                 </div>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 scrollbar-hide">
                 <MappingSelect label="Lead Name" value={mapping.name} onChange={v => setMapping({...mapping, name: v})} options={headers} required />
                 <MappingSelect label="Lead Email" value={mapping.email} onChange={v => setMapping({...mapping, email: v})} options={headers} />
                 <MappingSelect label="Lead Phone" value={mapping.phone} onChange={v => setMapping({...mapping, phone: v})} options={headers} required />
              </div>

              <div className="flex gap-4 pt-10">
                 <button onClick={() => setStep(1)} className="h-18 px-10 bg-slate-50 text-slate-400 rounded-[28px] font-bold uppercase text-[11px] tracking-widest hover:bg-slate-100 transition-all">Previous Step</button>
                  <button 
                     disabled={isUploading}
                     onClick={handleImport} 
                     className="flex-1 h-18 bg-blue-600 text-white rounded-[28px] font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center justify-center gap-4"
                  >
                     {isUploading ? <Loader2 className="animate-spin" /> : <>Complete Mapping & Import <ArrowRight size={20} /></>}
                  </button>
              </div>
           </motion.div>
         )}

         {step === 3 && importResult && (
           <motion.div 
             key="step3"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="bg-white p-20 rounded-[64px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-12"
           >
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group">
                 <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div className="text-center space-y-4">
                 <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Import Analysis Complete</h4>
                 <div className="grid grid-cols-3 gap-12 pt-8">
                    <Stat n={importResult.inserted} l="Successfully Synced" c="text-emerald-600" />
                    <Stat n={importResult.errors} l="Logic Errors" c="text-rose-600" />
                    <Stat n={importResult.duplicates} l="Deduplicated" c="text-amber-600" />
                 </div>
              </div>

              {importResult.duplicateRows?.length > 0 && (
                <div className="w-full max-w-2xl bg-amber-50 rounded-3xl p-8 space-y-4">
                   <h5 className="text-[11px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                      <Database size={16} /> Duplicate Leads (Skipped)
                   </h5>
                   <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-hide">
                      {importResult.duplicateRows.map((d, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl text-[10px] font-bold text-slate-500 flex justify-between border border-amber-100">
                           <span>Row {d.row}: {d.customerName} ({d.email || d.phone})</span>
                           <span className="text-amber-400 uppercase font-black italic">Duplicate</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {importResult.errorRows?.length > 0 && (
                <div className="w-full max-w-2xl bg-rose-50 rounded-3xl p-8 space-y-4">
                   <h5 className="text-[11px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                      <AlertCircle size={16} /> Validation Report
                   </h5>
                   <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-hide">
                      {importResult.errorRows.map((f, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl text-[10px] font-bold text-slate-500 flex justify-between border border-rose-100">
                           <span>Row {f.row}: {f.customerName || 'Unknown'} - {f.reason}</span>
                           <span className="text-rose-400 uppercase font-black">Failed</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <button 
                onClick={() => setStep(1)} 
                className="h-20 w-80 bg-[#0F172A] text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:brightness-125 transition-all"
              >
                 Done / New Import
              </button>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

const WizardStep = ({ num, label, active, done }) => (
  <div className="flex items-center gap-4">
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${
        done ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-50 text-slate-300'
     }`}>
        {done ? <CheckCircle2 size={24} /> : num}
     </div>
     <div className="space-y-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-300'}`}>Step {num}</p>
        <p className={`text-sm font-bold ${active ? 'text-[#0F172A]' : 'text-slate-300'}`}>{label}</p>
     </div>
  </div>
);

const MappingSelect = ({ label, value, onChange, options, required }) => (
  <div className="flex items-center gap-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-50 hover:border-blue-200 transition-all group">
     <div className="flex-1 flex items-center gap-4">
        <FileSpreadsheet size={18} className="text-slate-300" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</span>
     </div>
     <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-600 transition-all" />
     <div className="flex-1">
        <select 
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-14 bg-white border border-slate-100 rounded-xl px-6 outline-none focus:border-blue-600 transition-all text-xs font-bold text-[#0F172A] appearance-none"
        >
           <option value="">Select CSV Header</option>
           {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
     </div>
     <div className="w-20 flex justify-end">
        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md ${required ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
           {required ? 'Required' : 'Optional'}
        </span>
     </div>
  </div>
);

const Stat = ({ n, l, c }) => (
  <div className="space-y-2 text-center">
     <p className={`text-4xl font-black tracking-tighter ${c}`}>{n}</p>
     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</p>
  </div>
);

export default LeadImportWizard;
