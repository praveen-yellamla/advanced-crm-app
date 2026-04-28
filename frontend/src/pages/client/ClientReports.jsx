import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  Download,
  Filter,
  Search
} from 'lucide-react';

const ClientReports = () => {
  return (
    <div className="space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Growth Reports</h2>
          <p className="text-slate-500 font-medium mt-2">Analytical insights and historical lead performance data.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-[#0F172A] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95">
          <Download size={18} />
          Export All Data
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
         <div className="flex-1 flex gap-4 w-full">
            <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Search reports..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold" />
            </div>
            <select className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-500">
               <option>All Sources</option>
               <option>Google Ads</option>
               <option>Facebook</option>
            </select>
         </div>
         <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest">Applying Filters (3)</button>
            <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600"><Filter size={18} /></button>
         </div>
      </div>

      {/* REPORTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ReportCard 
           title="Monthly Lead Quality Audit" 
           date="April 2026" 
           size="2.4 MB" 
           type="PDF" 
           icon={<FileText />}
           status="GENERATED"
         />
         <ReportCard 
           title="Conversion Funnel Lifecycle" 
           date="Q1 2026" 
           size="8.1 MB" 
           type="CSV" 
           icon={<BarChart3 />}
           status="READY"
         />
         <ReportCard 
           title="Geo-Spatial Demand Report" 
           date="March 2026" 
           size="1.2 MB" 
           type="XLSX" 
           icon={<ShieldCheck />}
           status="SECURE"
         />
         <ReportCard 
           title="ROI Per Source (Live)" 
           date="Live Analytics" 
           size="Real-time" 
           type="DYNAMIC" 
           icon={<Clock />}
           status="ACTIVE"
         />
      </div>

      {/* EMPTY STATE / PENDING */}
      <div className="mt-12 p-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
         <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6 font-black text-3xl italic">A</div>
         <h4 className="text-xl font-black text-slate-900 mb-2">Automated Report P-12</h4>
         <p className="text-slate-400 max-w-sm">System is calculating custom attributes for your next scheduled growth intelligence report.</p>
      </div>

    </div>
  );
};

const ReportCard = ({ title, date, size, type, icon, status }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-700 flex items-center gap-8 group"
  >
    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
       {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="flex-1">
       <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase italic">Code: {status}</span>
       </div>
       <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{title}</h4>
       <div className="flex items-center gap-4 mt-2">
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {date}</p>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">{type} ({size})</p>
       </div>
    </div>
    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
       <Download size={20} />
    </button>
  </motion.div>
);

export default ClientReports;
