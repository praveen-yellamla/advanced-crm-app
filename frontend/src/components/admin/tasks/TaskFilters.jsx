import React from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const TaskFilters = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-10">
      {/* SEARCH */}
      <div className="flex-1 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by objective, description, lead or agent..." 
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="w-full h-18 pl-16 pr-6 bg-white border border-slate-200 rounded-[28px] outline-none focus:border-blue-600 focus:shadow-2xl focus:shadow-blue-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4">
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="h-18 pl-14 pr-8 bg-white border border-slate-200 rounded-[28px] outline-none focus:border-blue-600 font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-50 transition-all text-xs uppercase tracking-widest min-w-[180px]"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative group">
          <SlidersHorizontal className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <select 
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="h-18 pl-14 pr-8 bg-white border border-slate-200 rounded-[28px] outline-none focus:border-blue-600 font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-50 transition-all text-xs uppercase tracking-widest min-w-[180px]"
          >
            <option value="newest">Newest First</option>
            <option value="due_soon">Due Soon</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;
