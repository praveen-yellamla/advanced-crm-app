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
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LeadImportWizard = () => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="space-y-12 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Mass Migration Protocol</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Chunk-processed bulk lead ingestion with high-authority field mapping</p>
        </div>
        <button className="h-14 px-8 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-xs flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest">
           <History size={18} /> Audit History
        </button>
      </div>

      {/* WIZARD TRACKER */}
      <div className="flex items-center gap-6 px-10">
         <WizardStep num={1} label="Identity Selection" active={step === 1} done={step > 1} />
         <div className="h-px flex-1 bg-slate-100" />
         <WizardStep num={2} label="Field Mapping" active={step === 2} done={step > 2} />
         <div className="h-px flex-1 bg-slate-100" />
         <WizardStep num={3} label="Normalization" active={step === 3} done={step > 3} />
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
                 <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">Deployment Identity Upload</h2>
                 <p className="text-slate-400 font-medium max-w-sm mx-auto">Supports CSV / XLSX up to 50,000 nodes. Duplicate detection will be executed post-normalization.</p>
              </div>
              <input type="file" id="bulk-upload" className="hidden" onChange={() => setStep(2)} />
              <label htmlFor="bulk-upload" className="h-18 px-12 bg-[#0F172A] text-white rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all cursor-pointer flex items-center gap-4">
                 Initialize Stream <ArrowRight size={20} />
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
                    <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">Logic Mapping Protocol</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Map source columns to organizational lead entities.</p>
                 </div>
                 <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} /> 18 Headers Detected
                 </div>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 scrollbar-hide">
                 <MappingRow source="Customer_Full_Name" target="fullName" type="Required" />
                 <MappingRow source="Primary_Contact" target="phone" type="Required" />
                 <MappingRow source="Email_Identity" target="email" type="Optional" />
                 <MappingRow source="Region_Code" target="region" type="Optional" />
                 <MappingRow source="Campaign_ID" target="utmCampaign" type="Optional" />
              </div>

              <div className="flex gap-4 pt-10">
                 <button onClick={() => setStep(1)} className="h-18 px-10 bg-slate-50 text-slate-400 rounded-[28px] font-bold uppercase text-[11px] tracking-widest hover:bg-slate-100 transition-all">Previous Sequence</button>
                 <button onClick={() => setStep(3)} className="flex-1 h-18 bg-blue-600 text-white rounded-[28px] font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center justify-center gap-4">
                    Lock Protocol & Analyze <ArrowRight size={20} />
                 </button>
              </div>
           </motion.div>
         )}

         {step === 3 && (
           <motion.div 
             key="step3"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="bg-white p-20 rounded-[64px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-12"
           >
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group">
                 <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div className="text-center space-y-4">
                 <h4 className="text-3xl font-bold text-[#0F172A] tracking-tight">Identity Analysis Finalized</h4>
                 <div className="grid grid-cols-3 gap-8 pt-8">
                    <Stat n="48,290" l="Valid Nodes" c="text-emerald-600" />
                    <Stat n="1,710" l="Deduplicated" c="text-amber-600" />
                    <Stat n="0" l="Logic Errors" c="text-slate-400" />
                 </div>
              </div>
              <button 
                onClick={() => { setIsUploading(true); setTimeout(() => { toast.success('50,000 Leads Synchronized'); setStep(1); setIsUploading(false); }, 3000); }} 
                className="h-20 w-80 bg-[#0F172A] text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:brightness-125 transition-all"
              >
                 {isUploading ? 'Synchronizing Cluster...' : 'Initialize Global Dispatch'}
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
        <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-300'}`}>Protocol {num}</p>
        <p className={`text-sm font-bold ${active ? 'text-[#0F172A]' : 'text-slate-300'}`}>{label}</p>
     </div>
  </div>
);

const MappingRow = ({ source, target, type }) => (
  <div className="flex items-center gap-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-50 hover:border-blue-200 transition-all group">
     <div className="flex-1 flex items-center gap-4">
        <FileSpreadsheet size={18} className="text-slate-300" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{source}</span>
     </div>
     <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-600 transition-all" />
     <div className="flex-1">
        <div className="w-full h-14 bg-white border border-slate-100 rounded-xl px-6 flex items-center justify-between group-hover:border-blue-600 transition-all">
           <span className="text-xs font-bold text-slate-900">{target}</span>
           <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md ${type === 'Required' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>{type}</span>
        </div>
     </div>
  </div>
);

const Stat = ({ n, l, c }) => (
  <div className="space-y-2">
     <p className={`text-3xl font-black tracking-tighterTabularNums ${c}`}>{n}</p>
     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</p>
  </div>
);

export default LeadImportWizard;
