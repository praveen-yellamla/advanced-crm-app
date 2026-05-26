import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  MessageSquare, User, CheckCircle, Clock, Link as LinkIcon, Send, ShieldAlert, Award, Star, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Target, Zap, Activity, Filter, Search, ChevronRight, FileText, CheckCircle2, Bot, Calendar, Download, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminManagerFeedback = () => {
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState('POSITIVE');
  const [category, setCategory] = useState('Leadership');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // 1. Fetch Managers (using the new endpoint)
  const { data: managers } = useQuery({
    queryKey: ['adminManagersPerformance'],
    queryFn: async () => {
      const res = await api.get('/admin/manager-performance');
      return res.data.data;
    }
  });

  // 2. Mutation: Submit feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/admin/manager-feedback', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Executive Feedback successfully dispatched to Manager.');
      setContent('');
      setCategory('Leadership');
      setSentiment('POSITIVE');
    }
  });

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!selectedManagerId) {
      toast.error('Please select a manager first');
      return;
    }
    if (!content) {
      toast.error('Feedback content cannot be empty');
      return;
    }
    submitFeedbackMutation.mutate({
      managerId: selectedManagerId,
      content,
      category,
      sentiment
    });
  };

  const handleGenerateAiCoaching = async () => {
    if (!selectedManagerId) {
      toast.error('Please select a manager first');
      return;
    }
    
    setIsGeneratingAi(true);
    try {
      const res = await api.post('/admin/manager-performance/generate-ai-feedback', {
        managerId: selectedManagerId,
        category
      });
      setContent(res.data.data);
      toast.success('AI Executive Suggestions applied');
    } catch (error) {
      toast.error('Failed to generate AI coaching');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="pt-4 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Performance System</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Evaluate and dispatch feedback to your management team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* MANAGERS LIST PANEL */}
        <div className="lg:col-span-3 space-y-4">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Management Roster</h3>
               <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{managers?.length || 0}</span>
            </div>
            <div className="relative mb-6">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
               <input type="text" placeholder="Search managers..." className="w-full bg-slate-100/50 border-none rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {managers?.map(manager => (
                <button
                  key={manager.id}
                  onClick={() => setSelectedManagerId(manager.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all relative flex items-center gap-3 ${
                    selectedManagerId === manager.id 
                      ? 'bg-indigo-600 shadow-md shadow-indigo-600/20 text-white' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="relative">
                     {manager.profileImage ? (
                       <img src={manager.profileImage} alt={manager.name} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                     ) : (
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${selectedManagerId === manager.id ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                         {manager.name.charAt(0)}
                       </div>
                     )}
                     <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${selectedManagerId === manager.id ? 'border-indigo-600' : 'border-white'} ${manager.status === 'ONLINE' || manager.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${selectedManagerId === manager.id ? 'text-white' : 'text-slate-900'}`}>{manager.name}</p>
                    <div className={`flex items-center gap-2 mt-0.5 ${selectedManagerId === manager.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                       <span className="text-[9px] font-black tracking-wider flex items-center gap-1"><Award size={9} className={selectedManagerId === manager.id ? 'text-amber-300' : 'text-amber-500'} /> Team Size {manager.teamSize}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FEEDBACK COMPOSER */}
        <div className="lg:col-span-9 space-y-6">
          {selectedManagerId ? (
            <>
              {/* SUBMIT FEEDBACK FORM */}
              <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">Executive Feedback Composer</h3>
                      <p className="text-xs font-medium text-slate-500 mt-1">Provide performance notes and strategic direction to managers.</p>
                   </div>
                   <button 
                      onClick={handleGenerateAiCoaching}
                      disabled={isGeneratingAi}
                      className="h-10 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-100 shadow-sm"
                   >
                     {isGeneratingAi ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                     AI Exec Assist
                   </button>
                </div>
                
                <form onSubmit={handleSubmitFeedback} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><Target size={12} /> Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      >
                        <option value="Leadership">Leadership & Strategy</option>
                        <option value="Team Performance">Team Performance</option>
                        <option value="Compliance">Compliance & QA</option>
                        <option value="Recruitment">Recruitment & Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><Heart size={12} /> Sentiment</label>
                      <select
                        value={sentiment}
                        onChange={(e) => setSentiment(e.target.value)}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      >
                        <option value="POSITIVE">Positive</option>
                        <option value="NEUTRAL">Neutral</option>
                        <option value="NEGATIVE">Needs Improvement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> Executive Notes</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your performance review, directives, or feedback..."
                      className="w-full h-40 p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending}
                      className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {submitFeedbackMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                      Dispatch Feedback
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-[600px] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10">
                <Target size={40} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">Executive Performance Hub</h3>
              <p className="text-slate-500 max-w-md font-medium text-sm leading-relaxed relative z-10">
                Select a manager from your roster to review their team's performance, dispatch strategic directives, and track leadership growth over time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagerFeedback;
