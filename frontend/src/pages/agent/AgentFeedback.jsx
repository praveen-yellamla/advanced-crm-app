import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  MessageSquare, ShieldCheck, Star, Clock, ArrowRight, TrendingUp, Award, CheckCircle2,
  Calendar, Check, Zap, Target, Activity, Cpu, Sparkles, BookOpen, AlertTriangle, Bot, Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AgentFeedback = () => {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState({});
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agentQAFeedback'],
    queryFn: async () => {
      const res = await api.get('/agent/feedback');
      return res.data.data; // { feedback, insights }
    }
  });

  const ackMutation = useMutation({
    mutationFn: async (feedbackId) => {
      const res = await api.post(`/agent/feedback/${feedbackId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feedback acknowledged');
      refetch();
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ feedbackId, message }) => {
      const res = await api.post(`/agent/feedback/${feedbackId}/reply`, { content: message });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Reply posted to thread.');
      setReplyContent({});
      refetch();
    }
  });

  const handleReplySubmit = (feedbackId) => {
    if (!replyContent[feedbackId]) return;
    replyMutation.mutate({ feedbackId, message: replyContent[feedbackId] });
  };

  if (isLoading) {
     return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Performance Dashboard...</div>;
  }

  const feedback = data?.feedback || [];
  const insights = data?.insights || {};
  
  const pendingTasks = feedback.filter(f => !f.acknowledgedAt);
  const history = feedback.filter(f => f.acknowledgedAt);

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HERO SECTION */}
      <div className="bg-[#0F172A] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl text-white">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full -ml-24 -mb-24 pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="relative">
                 {user?.profileImage ? (
                   <img src={user.profileImage} alt={user.name} className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover shadow-xl" />
                 ) : (
                   <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-3xl border-4 border-slate-800 shadow-xl">
                     {user?.name?.charAt(0) || 'A'}
                   </div>
                 )}
                 <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border-2 border-slate-900">
                    Elite
                 </div>
               </div>
               <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{user?.name}</h1>
                  <p className="text-slate-400 font-medium text-sm mt-1 flex items-center gap-2">
                     <ShieldCheck size={16} className="text-indigo-400" /> Senior Account Executive
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                     <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                        <Zap size={14} className="text-amber-400" /> 14 Day Streak
                     </span>
                     <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                        <Award size={14} className="text-blue-400" /> Top 5% QA Rank
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex gap-8 bg-black/20 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
               <HeroStat label="Overall QA" value={`${insights.overallQaScore || 85}%`} trend="+2.4%" />
               <div className="w-px h-12 bg-white/10 self-center" />
               <HeroStat label="Compliance" value={`${insights.complianceScore || 98}%`} trend="+0.5%" />
               <div className="w-px h-12 bg-white/10 self-center" />
               <HeroStat label="Confidence" value={`${insights.managerConfidence || 4.5}`} max="/5.0" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* LEFT COLUMN: ACTIVE TASKS & TIMELINE */}
         <div className="xl:col-span-8 space-y-8">
            
            {/* ACTIVE FEEDBACK TASKS */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                     <Target className="text-indigo-600" size={20} /> Active QA Feedback
                  </h3>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                     {pendingTasks.length} Pending
                  </span>
               </div>

               {pendingTasks.length > 0 ? (
                 <div className="grid gap-4">
                   {pendingTasks.map((task) => (
                     <div key={task.id} className="bg-white p-6 rounded-[24px] border border-indigo-100 shadow-sm shadow-indigo-100/50 relative overflow-hidden group">
                        {task.priority === 'URGENT' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />}
                        {task.priority === 'HIGH' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />}
                        
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                 <MessageSquare size={18} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1">
                                    {task.category || 'General QA'}
                                 </p>
                                 <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <Clock size={12} /> {new Date(task.createdAt).toLocaleDateString()} by {task.manager?.name}
                                 </p>
                              </div>
                           </div>
                           {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                 <Calendar size={14} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                           )}
                        </div>

                        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-6">
                           {task.content}
                        </p>

                        {task.metadata?.aiSummary && (
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 flex items-start gap-3">
                              <Bot className="text-slate-400 flex-shrink-0" size={16} />
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">AI Action Plan</p>
                                 <p className="text-xs font-medium text-slate-700">{task.metadata.aiSummary}</p>
                              </div>
                           </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                           <div className="flex gap-2">
                              {task.callId && (
                                <button onClick={() => toast('Call review functionality coming soon.', { icon: '📞' })} className="h-9 px-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                                   <Activity size={14} /> Review Linked Call #{task.callId}
                                </button>
                              )}
                           </div>
                           <button 
                             onClick={() => ackMutation.mutate(task.id)}
                             disabled={ackMutation.isPending}
                             className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                           >
                              <CheckCircle2 size={16} /> Acknowledge
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-200 border-dashed text-center">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700 mb-1">All Caught Up!</p>
                    <p className="text-xs font-medium text-slate-500">You have no pending QA tasks.</p>
                 </div>
               )}
            </div>

            {/* TIMELINE HISTORY */}
            <div className="space-y-6 pt-8 border-t border-slate-100">
               <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="text-blue-500" size={20} /> QA Performance Timeline
               </h3>
               
               <div className="space-y-4">
                  {history.map((item) => {
                     const threadReplies = item.metadata?.threadReplies || [];

                     return (
                      <div key={item.id} className="bg-white p-5 rounded-[20px] border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0 mt-1">
                            {item.type === 'PRAISE' ? <Award className="text-emerald-500" size={18} /> : 
                             item.type === 'CORRECTION' ? <AlertTriangle className="text-amber-500" size={18} /> :
                             <Clock className="text-slate-400" size={18} />}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <p className="text-sm font-bold text-slate-900">{item.category || 'QA Evaluation'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                     {new Date(item.createdAt).toLocaleDateString()} &#x2022; {item.manager?.name}
                                  </p>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${item.improvementStatus === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                     {item.improvementStatus || 'PENDING'}
                                  </span>
                                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                     <Check size={10} /> Ack
                                  </span>
                               </div>
                            </div>
                            <p className="text-xs font-medium text-slate-600">{item.content}</p>

                            {/* THREAD REPLIES */}
                            {threadReplies.length > 0 && (
                                <div className="mt-4 space-y-3 relative pl-6 border-l-2 border-slate-100">
                                  {threadReplies.map((reply, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border ${reply.role === 'MANAGER' ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                           <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${reply.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>{reply.senderName?.charAt(0)}</div>
                                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{reply.senderName} ({reply.role})</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400">{new Date(reply.timestamp).toLocaleString()}</p>
                                      </div>
                                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                        {reply.message}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                            )}

                            <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder="Add a reply to this thread..." 
                                 value={replyContent[item.id] || ''}
                                 onChange={(e) => setReplyContent({ ...replyContent, [item.id]: e.target.value })}
                                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                               />
                               <button 
                                 onClick={() => handleReplySubmit(item.id)}
                                 disabled={replyMutation.isPending}
                                 className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                               >
                                  <Send size={14} /> Reply
                               </button>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  {history.length === 0 && (
                     <p className="text-xs font-medium text-slate-400 italic">No historical feedback logs found.</p>
                  )}
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: AI INSIGHTS & CERTS */}
         <div className="xl:col-span-4 space-y-6">
            
            {/* AI PREDICTIVE GROWTH */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[24px] border border-indigo-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                     <Sparkles size={14} className="text-indigo-600" /> AI Insights
                  </h3>
               </div>

               <div className="space-y-4 relative z-10">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Predicted QA Growth</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{insights.predictedGrowth || '+4.5%'}</span>
                        <TrendingUp size={16} className="text-emerald-500" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Strongest Skill</p>
                        <p className="text-xs font-bold text-slate-800">{insights.strengths?.[0] || 'Empathy'}</p>
                     </div>
                     <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Focus Area</p>
                        <p className="text-xs font-bold text-slate-800">{insights.weaknesses?.[0] || 'Pacing'}</p>
                     </div>
                  </div>

                  <div className="p-4 bg-indigo-600 rounded-xl text-white mt-4 shadow-md shadow-indigo-200">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1 flex items-center gap-1.5"><BookOpen size={12} /> Recommended Path</p>
                     <p className="text-xs font-medium leading-relaxed">Enroll in "Advanced Objection Handling" module to boost conversion rate by predicted 12%.</p>
                     <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1 hover:text-indigo-200 transition-colors">
                        View Course <ArrowRight size={10} />
                     </button>
                  </div>
               </div>
            </div>

            {/* CERTIFICATIONS */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-6">
                  <Award size={16} className="text-amber-500" /> Active Certifications
               </h3>
               
               <div className="space-y-5">
                  {insights.certifications?.map((cert, idx) => (
                     <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-slate-700">{cert.name}</span>
                           <span className={cert.score === 100 ? 'text-emerald-500' : 'text-indigo-600'}>{cert.status}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${cert.score}%` }}
                              transition={{ duration: 1, delay: idx * 0.2 }}
                              className={`h-full rounded-full ${cert.score === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

const HeroStat = ({ label, value, trend, max }) => (
   <div>
      <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
         <span className="text-3xl font-black tracking-tight">{value}</span>
         {max && <span className="text-sm font-bold text-white/50">{max}</span>}
         {trend && (
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-400/20">
               <TrendingUp size={10} /> {trend}
            </span>
         )}
      </div>
   </div>
);

export default AgentFeedback;
