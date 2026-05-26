import React from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const TaskFilters = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-10">
      {/* SEARCH */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Search by objective, description, lead or agent..." 
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:shadow-sm transition-all text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4">
        <div className="relative group">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium text-slate-700 appearance-none cursor-pointer hover:bg-slate-50 transition-all min-w-[140px]"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative group">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
          <select 
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium text-slate-700 appearance-none cursor-pointer hover:bg-slate-50 transition-all min-w-[140px]"
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
