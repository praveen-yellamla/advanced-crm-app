import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Award, TrendingUp, TrendingDown, Target, CheckCircle2, RefreshCw, MessageSquare, AlertTriangle, Clock, Link as LinkIcon, Download, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerMyPerformance = () => {
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);

  // 1. Fetch Performance Data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['managerMyPerformance'],
    queryFn: async () => {
      const res = await api.get('/manager/my-performance');
      return res.data.data;
    }
  });

  const feedbackFeed = data?.feedback || [];
  const snapshot = data?.snapshot || null;

  // 2. Mutation: Acknowledge Feedback
  const acknowledgeMutation = useMutation({
    mutationFn: async (feedbackId) => {
      const res = await api.post(`/manager/my-performance/${feedbackId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Executive feedback acknowledged.');
      refetch();
    }
  });

  const handleAcknowledge = (feedbackId) => {
    acknowledgeMutation.mutate(feedbackId);
  };

  const exportPDF = () => {
     toast.success('Exporting Performance Report to PDF...');
     setTimeout(() => window.print(), 500);
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="pt-4 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Feedback Hub</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Review your performance feedback and directives from Administration.</p>
        </div>
        <button onClick={exportPDF} className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
           <Download size={16} /> Export Report
        </button>
      </div>

      {/* SNAPSHOT WIDGETS */}
      {snapshot && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                 <ShieldCheck className="text-indigo-600" size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Leadership Score</p>
                 <p className="text-2xl font-black text-slate-900">{snapshot.leadershipScore}</p>
              </div>
           </div>
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                 <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Conversion</p>
                 <p className="text-2xl font-black text-slate-900">{snapshot.teamConversion}%</p>
              </div>
           </div>
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                 <Target className="text-amber-600" size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg QA Score</p>
                 <p className="text-2xl font-black text-slate-900">{snapshot.avgQaScore}</p>
              </div>
           </div>
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                 <AlertTriangle className="text-rose-600" size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Actions</p>
                 <p className="text-2xl font-black text-slate-900">{snapshot.openTasks}</p>
              </div>
           </div>
        </div>
      )}

      {/* FEEDBACK FEED */}
      <div className="bg-white rounded-[24px] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          Executive Review Feed
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
             <RefreshCw className="animate-spin text-slate-400" size={24} />
          </div>
        ) : feedbackFeed.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Executive Feedback</h3>
            <p className="text-xs text-slate-500 mt-1">You have no performance reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
             {feedbackFeed.map((feed) => (
               <div key={feed.id} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-white transition-all group shadow-sm hover:shadow-md relative overflow-hidden">
                  {/* Left accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${feed.sentiment === 'POSITIVE' ? 'bg-emerald-500' : feed.sentiment === 'NEGATIVE' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
                     {/* MANAGER / ADMIN INFO */}
                     <div className="flex items-center gap-4 md:w-64 shrink-0">
                        {feed.manager?.profileImage ? (
                          <img src={feed.manager.profileImage} alt={feed.manager.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {feed.manager?.name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div>
                           <p className="text-sm font-extrabold text-slate-900 leading-tight">{feed.manager?.name || 'Administrator'}</p>
                           <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase mt-0.5">{feed.category}</p>
                           
                           <div className="flex items-center gap-2 mt-2">
                             <span className="text-xs text-slate-400 font-bold">
                               {new Date(feed.createdAt).toLocaleDateString()}
                             </span>
                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${feed.acknowledgedAt ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                               {feed.acknowledgedAt ? 'ACKNOWLEDGED' : 'NEEDS REVIEW'}
                             </span>
                           </div>
                        </div>
                     </div>

                     {/* CONTENT */}
                     <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                          {feed.content}
                        </p>
                        
                        {/* SENTIMENT */}
                        {feed.sentiment && (
                           <div className="mt-4 flex items-center gap-2">
                              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${feed.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : feed.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {feed.sentiment === 'POSITIVE' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {feed.sentiment}
                              </span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                     {!feed.acknowledgedAt && (
                        <button 
                          onClick={() => handleAcknowledge(feed.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} />
                          Acknowledge
                        </button>
                     )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerMyPerformance;
