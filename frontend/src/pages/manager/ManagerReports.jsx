import React from 'react';
import api from '../../utils/api';
import { 
  FileText, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  Target, 
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ManagerReports = () => {
  const handleExport = async (format) => {
    try {
      const res = await api.get(`/manager/reports/${format}`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Export service currently unavailable');
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Intelligence Reports</h1>
           <p className="text-[#64748B] font-medium text-sm mt-1">Export high-authority performance datasets & team audits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ReportCard 
            title="Team Performance PDF" 
            desc="Comprehensive breakdown of agent conversion, call duration, and revenue contribution."
            icon={<FileText className="text-blue-600" />}
            onExport={() => handleExport('pdf')}
         />
         <ReportCard 
            title="QA Summary Excel" 
            desc="Granular dataset of all audited calls including rubric scores and manager feedback."
            icon={<FileSpreadsheet className="text-emerald-600" />}
            onExport={() => handleExport('excel')}
         />
         <ReportCard 
            title="Lead Assignment Log" 
            desc="Audit trail of regional lead flow and agent allocation protocols."
            icon={<Target className="text-violet-600" />}
            onExport={() => handleExport('excel')}
         />
         <ReportCard 
            title="Revenue Reconciliation" 
            desc="Summarized fiscal report of all approved invoices and pending collections."
            icon={<TrendingUp className="text-amber-600" />}
            onExport={() => handleExport('pdf')}
         />
      </div>

      <div className="p-10 bg-blue-50 border border-blue-100 rounded-[32px] flex items-start gap-6">
         <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <AlertCircle size={24} />
         </div>
         <div className="space-y-2">
            <h4 className="text-lg font-bold text-blue-900">Automatic Weekly Reporting</h4>
            <p className="text-sm text-blue-700 leading-relaxed max-w-2xl font-medium">As a Manager, you are automatically subscribed to the <span className="font-bold underline italic">Weekly Intelligence Dispatch</span>. Every Monday at 08:00 UTC, a consolidated PDF report of your team's performance will be delivered to your verified corporate email.</p>
         </div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, desc, icon, onExport }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-between"
  >
     <div className="space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
           {React.cloneElement(icon, { size: 28 })}
        </div>
        <div className="space-y-2">
           <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">{title}</h3>
           <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
        </div>
     </div>
     <button 
       onClick={onExport}
       className="mt-10 h-14 w-full bg-slate-50 border border-slate-100 text-[#0F172A] rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all flex items-center justify-center gap-3"
     >
        <Download size={16} /> Download Intelligence Node
     </button>
  </motion.div>
);

export default ManagerReports;
