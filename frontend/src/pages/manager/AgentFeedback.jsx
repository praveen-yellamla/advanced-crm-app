import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  MessageSquare, User, CheckCircle, Clock, Link as LinkIcon, Send, ShieldAlert, Award, Star, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AgentFeedback = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [content, setContent] = useState('');
  const [feedbackType, setFeedbackType] = useState('COACHING');
  const [selectedCallId, setSelectedCallId] = useState('');

  // 1. Fetch Agents
  const { data: agents } = useQuery({
    queryKey: ['managerFeedbackAgents'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 2. Fetch Feedback History for selected agent
  const { data: feedbackFeed, isLoading: isFeedLoading, refetch } = useQuery({
    queryKey: ['agentFeedbackFeed', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return [];
      const res = await api.get(`/manager/feedback/${selectedAgentId}`);
      return res.data.data;
    },
    enabled: !!selectedAgentId
  });

  // 3. Fetch Calls for link dropdown
  const { data: calls } = useQuery({
    queryKey: ['managerFeedbackCalls', selectedAgentId],
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
      toast.success('Feedback successfully posted');
      setContent('');
      setSelectedCallId('');
      setFeedbackType('COACHING');
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
      callId: selectedCallId || null
    });
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Agent Feedback & Coaching</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Submit micro-coaching notes, commend performance, track acknowledgements, and build training logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AGENTS LIST PANEL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-extrabold text-slate-800">Select Advisor</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agents?.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedAgentId === agent.id 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {agent.profileImage ? (
                    <img src={agent.profileImage} alt={agent.name} className="w-9 h-9 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-extrabold text-slate-800 leading-none">{agent.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">{agent.email}</p>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* FEEDBACK FEED & DISPATCH PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAgentId ? (
            <>
              {/* SUBMIT FEEDBACK FORM */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-800 mb-4">Post Coaching Note</h3>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Feedback Type</label>
                      <select
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="COACHING">Coaching & Training</option>
                        <option value="PRAISE">Praise & Recognition</option>
                        <option value="CORRECTION">Correction & Adjustment</option>
                        <option value="ESCALATION">Escalation Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Link Call (Optional)</label>
                      <select
                        value={selectedCallId}
                        onChange={(e) => setSelectedCallId(e.target.value)}
                        className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">No linked call</option>
                        {calls?.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.lead?.customerName} ({Math.round(c.duration/60)}m)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Coaching Advice / Guidelines</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write actionable, constructive advice for the advisor..."
                      className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 h-24"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending}
                      className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Send size={14} /> Send Note
                    </button>
                  </div>
                </form>
              </div>

              {/* FEEDBACK FEED CARDS */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-800">Coaching Thread Logs</h3>
                
                {isFeedLoading ? (
                  <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ) : feedbackFeed && feedbackFeed.length > 0 ? (
                  feedbackFeed.map(feed => {
                    const icons = {
                      COACHING: <Clock className="text-indigo-600" size={16} />,
                      PRAISE: <Award className="text-emerald-600" size={16} />,
                      CORRECTION: <ShieldAlert className="text-amber-600" size={16} />,
                      ESCALATION: <ShieldAlert className="text-rose-600" size={16} />
                    };
                    const badgeColors = {
                      COACHING: 'bg-indigo-50 border border-indigo-100 text-indigo-700',
                      PRAISE: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
                      CORRECTION: 'bg-amber-50 border border-amber-100 text-amber-700',
                      ESCALATION: 'bg-rose-50 border border-rose-100 text-rose-700'
                    };

                    return (
                      <div key={feed.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                              {icons[feed.type] || <MessageSquare size={16} />}
                            </div>
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badgeColors[feed.type]}`}>
                                {feed.type}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold ml-2">
                                {new Date(feed.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* ACKNOWLEDGEMENT STATUS */}
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            {feed.acknowledgedAt ? (
                              <>
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span className="text-emerald-600">Acknowledged</span>
                              </>
                            ) : (
                              <>
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-slate-400">Pending Review</span>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                          {feed.content}
                        </p>

                        {feed.callId && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-500 flex items-center gap-1.5">
                              <LinkIcon size={12} /> Linked Call Reference ID: #{feed.callId}
                            </span>
                          </div>
                        )}

                        {feed.response && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent Response Thread</p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                              "{feed.response}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <MessageSquare size={36} className="text-slate-200 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider">No logged coaching comments yet.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare size={36} className="text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider">Select an advisor to view conversation logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentFeedback;
