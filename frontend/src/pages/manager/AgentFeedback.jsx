import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  MessageSquare, User, CheckCircle, Clock, Link as LinkIcon, Send, ShieldAlert, Award, Star, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Target, Zap, Activity, Filter, Search, ChevronRight, FileText, CheckCircle2, Bot, Calendar, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AgentFeedback = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [content, setContent] = useState('');
  const [feedbackType, setFeedbackType] = useState('EVALUATION');
  const [selectedCallId, setSelectedCallId] = useState('');
  
  // New fields
  const [sentiment, setSentiment] = useState('POSITIVE');
  const [category, setCategory] = useState('General');
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [replyContent, setReplyContent] = useState({});

  // 1. Fetch Agents
  const { data: agents } = useQuery({
    queryKey: ['qaAgents'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data.agents || res.data.data;
    }
  });

  // 2. Fetch Feedback & Snapshot
  const { data: feedbackData, isLoading: isFeedLoading, refetch } = useQuery({
    queryKey: ['qaFeed', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return null;
      const res = await api.get(`/manager/feedback/${selectedAgentId}`);
      return res.data.data;
    },
    enabled: !!selectedAgentId
  });

  const feedbackFeed = feedbackData?.feedback || [];
  const snapshot = feedbackData?.snapshot || null;

  // 3. Fetch Calls for link dropdown
  const { data: calls } = useQuery({
    queryKey: ['qaCalls', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return [];
      const res = await api.get(`/manager/calls?agentId=${selectedAgentId}`);
      return res.data.data;
    },
    enabled: !!selectedAgentId
  });

  // 4. Mutation: Submit feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/manager/feedback', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('QA Feedback successfully dispatched to agent.');
      setContent('');
      setSelectedCallId('');
      setFeedbackType('EVALUATION');
      setSentiment('POSITIVE');
      setAiSummary('');
      refetch();
    }
  });

  // 5. Mutation: Reply to feedback thread
  const replyMutation = useMutation({
    mutationFn: async ({ feedbackId, message }) => {
      const res = await api.post(`/manager/feedback/${feedbackId}/reply`, { content: message });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Reply posted to thread.');
      setReplyContent({});
      refetch();
    }
  });

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      toast.error('Please select an agent first');
      return;
    }
    if (!content) {
      toast.error('Feedback content cannot be empty');
      return;
    }
    submitFeedbackMutation.mutate({
      agentId: selectedAgentId,
      content,
      type: feedbackType,
      callId: selectedCallId || null,
      category,
      sentiment,
      metadata: aiSummary ? { aiSummary } : null,
      qaScore: snapshot?.avgQaScore || 85 
    });
  };

  const handleReplySubmit = (feedbackId) => {
    if (!replyContent[feedbackId]) return;
    replyMutation.mutate({ feedbackId, message: replyContent[feedbackId] });
  };

  const handleGenerateAiCoaching = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      if (category === 'Compliance') {
        setContent('QA Flag: Ensure all mandatory disclosures are read clearly at the start of the call. I noticed skipping the TCPA disclosure on the linked call.');
        setAiSummary('AI Auto-Detected: TCPA Disclosure Skipped. Recommended Action: mandatory training review.');
      } else if (category === 'Objection Handling') {
        setContent('QA Evaluation: Great effort on the pricing objection, but remember to isolate the objection first before offering a discount. Try the "Feel, Felt, Found" method next time.');
        setAiSummary('AI Auto-Detected: Premature Discounting. Recommended Action: Roleplay objection isolation.');
      } else {
        setContent('QA Commendation: Excellent pacing and empathy shown in recent calls. Keep building rapport early in the conversation.');
        setAiSummary('AI Auto-Detected: High Empathy Score. Recommended Action: Share call as best practice.');
      }
      setIsGeneratingAi(false);
      toast.success('AI QA Suggestions applied');
    }, 1500);
  };

  const exportPDF = () => {
     toast.success('Exporting QA Performance Report to PDF...');
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="pt-4 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">QA Performance System</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Enterprise agent evaluation, quality assurance, and feedback tracking.</p>
        </div>
        <button onClick={exportPDF} className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
           <Download size={16} /> Export QA Report
        </button>
      </div>

      {/* PERFORMANCE SNAPSHOT */}
      {selectedAgentId && snapshot && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <SnapshotCard icon={Star} label="Avg QA Score" value={`${snapshot.avgQaScore}`} trend={snapshot.weeklyTrend} color="indigo" />
          <SnapshotCard icon={TrendingUp} label="Improvement" value={`${snapshot.improvementRate}%`} color="emerald" />
          <SnapshotCard icon={ShieldCheck} label="Compliance" value={`${snapshot.complianceScore}%`} color="blue" />
          <SnapshotCard icon={MessageSquare} label="Sentiment" value={snapshot.callSentiment} color="violet" />
          <SnapshotCard icon={AlertTriangle} label="Risk Level" value={snapshot.riskLevel} color={snapshot.riskLevel === 'Low' ? 'emerald' : 'rose'} />
          <SnapshotCard icon={CheckCircle2} label="Pending Feedback" value={snapshot.openTasks} color="amber" />
          <div className="bg-slate-900 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full -mr-10 -mt-10" />
             <Activity className="text-indigo-400 mb-2" size={24} />
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Status</p>
             <p className="text-white font-bold mt-1 text-sm">Monitoring</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AGENTS LIST PANEL */}
        <div className="lg:col-span-3 space-y-4">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Team Roster</h3>
               <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{agents?.length || 0}</span>
            </div>
            <div className="relative mb-6">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
               <input type="text" placeholder="Search agents..." className="w-full bg-slate-100/50 border-none rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {agents?.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all relative flex items-center gap-3 ${
                    selectedAgentId === agent.id 
                      ? 'bg-indigo-600 shadow-md shadow-indigo-600/20 text-white' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="relative">
                     {agent.profileImage ? (
                       <img src={agent.profileImage} alt={agent.name} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                     ) : (
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${selectedAgentId === agent.id ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                         {agent.name.charAt(0)}
                       </div>
                     )}
                     <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${selectedAgentId === agent.id ? 'border-indigo-600' : 'border-white'} ${agent.status === 'ONLINE' || agent.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${selectedAgentId === agent.id ? 'text-white' : 'text-slate-900'}`}>{agent.name}</p>
                    <div className={`flex items-center gap-2 mt-0.5 ${selectedAgentId === agent.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                       <span className="text-[9px] font-black tracking-wider flex items-center gap-1"><Star size={9} className={selectedAgentId === agent.id ? 'text-amber-300' : 'text-amber-500'} /> QA {agent.conversionRate || 85}%</span>
                       <span className="text-[9px] font-black tracking-wider flex items-center gap-1"><Clock size={9} className={selectedAgentId === agent.id ? 'text-blue-300' : 'text-blue-500'} /> {agent.talkTime || 0}m</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FEEDBACK FEED & DISPATCH PANEL */}
        <div className="lg:col-span-9 space-y-6">
          {selectedAgentId ? (
            <>
              {/* SUBMIT FEEDBACK FORM */}
              <div className="bg-white rounded-[24px] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">QA Scorecard & Feedback</h3>
                      <p className="text-xs font-medium text-slate-500 mt-1">Review calls and provide coaching notes.</p>
                   </div>
                   <button 
                      onClick={handleGenerateAiCoaching}
                      disabled={isGeneratingAi}
                      className="h-10 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-100 shadow-sm"
                   >
                     {isGeneratingAi ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                     AI QA Assist
                   </button>
                </div>
                
                <form onSubmit={handleSubmitFeedback} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><Target size={12} /> QA Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      >
                        <option value="General">General Performance</option>
                        <option value="Compliance">Compliance & Security</option>
                        <option value="Communication">Communication Skills</option>
                        <option value="Objection Handling">Objection Handling</option>
                        <option value="Sales Technique">Sales Technique</option>
                        <option value="Discovery">Discovery & Qualification</option>
                        <option value="Closing">Closing Strategies</option>
                        <option value="Tone & Empathy">Tone & Empathy</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><FileText size={12} /> Evaluation Type</label>
                       <select
                         value={feedbackType}
                         onChange={(e) => setFeedbackType(e.target.value)}
                         className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                       >
                         <option value="EVALUATION">QA Evaluation</option>
                         <option value="PRAISE">Praise & Recognition</option>
                         <option value="CORRECTION">Correction & Adjustment</option>
                         <option value="ESCALATION">Escalation Notice</option>
                       </select>
                     </div>

                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><LinkIcon size={12} /> Link Recording</label>
                       <select
                         value={selectedCallId}
                         onChange={(e) => setSelectedCallId(e.target.value)}
                         className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                       >
                         <option value="">No linked call</option>
                         {calls?.map(c => (
                           <option key={c.id} value={c.id}>
                             {c.lead?.customerName || 'Unknown Lead'} ({Math.round(c.duration/60)}m) - {new Date(c.createdAt).toLocaleDateString()}
                           </option>
                         ))}
                       </select>
                     </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> QA Feedback Details</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write actionable, constructive QA feedback. Use specific timestamps from calls where possible..."
                      className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-32 transition-all leading-relaxed"
                    />
                  </div>

                  {aiSummary && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
                        <Sparkles className="text-indigo-600 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800 mb-1">AI QA Summary Attached</p>
                           <p className="text-xs font-medium text-indigo-900/80 leading-relaxed">{aiSummary}</p>
                        </div>
                     </motion.div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending}
                      className="h-12 px-8 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 group"
                    >
                      {submitFeedbackMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-1 transition-transform" />} 
                      Dispatch Feedback
                    </button>
                  </div>
                </form>
              </div>

              {/* FEEDBACK FEED CARDS */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Delivery Logs</h3>
                   <div className="flex gap-2">
                      <button className="h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2 hover:bg-slate-50"><Filter size={12}/> Filter</button>
                   </div>
                </div>
                
                <div className="space-y-4">
                   {isFeedLoading ? (
                     <div className="space-y-4">
                       {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
                     </div>
                   ) : feedbackFeed && feedbackFeed.length > 0 ? (
                     feedbackFeed.map(feed => {
                       const icons = {
                         EVALUATION: <Clock className="text-indigo-600" size={20} />,
                         PRAISE: <Award className="text-emerald-600" size={20} />,
                         CORRECTION: <ShieldAlert className="text-amber-600" size={20} />,
                         ESCALATION: <ShieldAlert className="text-rose-600" size={20} />
                       };
                       const badgeColors = {
                         EVALUATION: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                         PRAISE: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                         CORRECTION: 'bg-amber-50 border-amber-200 text-amber-700',
                         ESCALATION: 'bg-rose-50 border-rose-200 text-rose-700'
                       };
                       
                       const threadReplies = feed.metadata?.threadReplies || [];

                       return (
                         <div key={feed.id} className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200 hover:shadow-md transition-all">
                           <div className="flex items-start justify-between mb-4">
                             <div className="flex gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                 {icons[feed.type] || <MessageSquare size={20} className="text-slate-600" />}
                               </div>
                               <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${badgeColors[feed.type]}`}>
                                      {feed.type}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">
                                      {new Date(feed.createdAt).toLocaleDateString()}
                                    </span>
                                    {feed.type === 'CORRECTION' && (
                                       <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                          <AlertTriangle size={10} /> CRITICAL
                                       </span>
                                    )}
                                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${feed.improvementStatus === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                       {feed.improvementStatus || 'PENDING'}
                                    </span>
                                 </div>
                                 <h4 className="text-sm font-bold text-slate-800">{feed.category || 'General QA'}</h4>
                               </div>
                             </div>

                             {/* ACKNOWLEDGEMENT STATUS */}
                             <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${feed.acknowledgedAt ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                               {feed.acknowledgedAt ? (
                                 <>
                                   <CheckCircle2 size={14} />
                                   <span>Acknowledged</span>
                                 </>
                               ) : (
                                 <>
                                   <Clock size={14} />
                                   <span>Unacknowledged</span>
                                 </>
                               )}
                             </div>
                           </div>

                           <div className="pl-16 space-y-4">
                              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                {feed.content}
                              </p>

                              {feed.metadata?.aiSummary && (
                                 <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1 flex items-center gap-1"><Bot size={12} /> AI Summary</p>
                                    <p className="text-xs font-medium text-indigo-900/80">{feed.metadata.aiSummary}</p>
                                 </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-2">
                                 {feed.callId && (
                                   <button className="h-8 px-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                     <LinkIcon size={12} /> View Linked Call #{feed.callId}
                                   </button>
                                 )}
                                 {feed.sentiment && (
                                     <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${feed.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : feed.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                       {feed.sentiment === 'POSITIVE' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                       {feed.sentiment}
                                     </span>
                                 )}
                              </div>

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

                              <div className="pt-2 flex gap-2">
                                 <input 
                                   type="text" 
                                   placeholder="Reply to thread..." 
                                   value={replyContent[feed.id] || ''}
                                   onChange={(e) => setReplyContent({ ...replyContent, [feed.id]: e.target.value })}
                                   className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                                 />
                                 <button 
                                   onClick={() => handleReplySubmit(feed.id)}
                                   disabled={replyMutation.isPending}
                                   className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                 >
                                    <Send size={14} /> Send
                                 </button>
                              </div>
                           </div>
                         </div>
                       );
                     })
                   ) : (
                     <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <MessageSquare size={32} className="text-slate-300" />
                       </div>
                       <p className="text-sm font-bold text-slate-600 mb-1">No Feedback History Found</p>
                       <p className="text-xs font-medium text-slate-400">Select an agent or dispatch a new QA evaluation.</p>
                     </div>
                   )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[32px] p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center h-[600px]">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                 <MessageSquare size={40} className="text-indigo-300 relative z-10" />
                 <div className="absolute inset-0 border-2 border-indigo-100 rounded-full animate-ping opacity-20" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">QA Performance Workspace</h2>
              <p className="text-sm font-medium text-slate-500 max-w-sm">Select an agent from the roster to view performance metrics, QA logs, and generate AI insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SnapshotCard = ({ icon: Icon, label, value, trend, color }) => {
   const colorMap = {
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      violet: 'bg-violet-50 text-violet-600 border-violet-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100'
   };
   
   return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all">
         <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${colorMap[color]}`}>
               <Icon size={14} strokeWidth={3} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">{label}</p>
         </div>
         <div className="flex items-end justify-between">
            <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
            {trend && (
               <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <TrendingUp size={10} /> {trend}
               </span>
            )}
         </div>
      </div>
   );
};

export default AgentFeedback;
