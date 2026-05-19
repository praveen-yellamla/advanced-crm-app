import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Shield, Award, Clock, Star, Play, CheckCircle, ClipboardCheck, History, User, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const QAScoring = () => {
  const [activeTab, setActiveTab] = useState('score');
  const [selectedCallId, setSelectedCallId] = useState('');
  
  // Category values (1 to 20 each)
  const [greeting, setGreeting] = useState(15);
  const [discovery, setDiscovery] = useState(15);
  const [pitch, setPitch] = useState(15);
  const [objection, setObjection] = useState(15);
  const [closing, setClosing] = useState(15);
  
  const [notes, setNotes] = useState('');

  // 1. Fetch calls pending QA
  const { data: pendingCalls, refetch: refetchPending } = useQuery({
    queryKey: ['qaPendingCalls'],
    queryFn: async () => {
      const res = await api.get('/manager/qa/pending');
      return res.data.data;
    }
  });

  // 2. Fetch QA History
  const { data: qaHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['qaHistoryReports'],
    queryFn: async () => {
      const res = await api.get('/manager/qa/reports');
      return res.data.data;
    }
  });

  // 3. Mutation: Submit Score Card
  const submitQAMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/manager/qa/${data.callId}/score`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('QA Report submitted successfully');
      setSelectedCallId('');
      setGreeting(15);
      setDiscovery(15);
      setPitch(15);
      setObjection(15);
      setClosing(15);
      setNotes('');
      refetchPending();
      refetchHistory();
    }
  });

  const total = greeting + discovery + pitch + objection + closing;
  const complianceStatus = total >= 70 ? 'PASS' : 'NEEDS_COACHING';

  const handleSumScore = (category, value) => {
    const val = Math.min(20, Math.max(0, parseInt(value) || 0));
    if (category === 'greeting') setGreeting(val);
    if (category === 'discovery') setDiscovery(val);
    if (category === 'pitch') setPitch(val);
    if (category === 'objection') setObjection(val);
    if (category === 'closing') setClosing(val);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!selectedCallId) {
      toast.error('Please select a call from the queue first');
      return;
    }
    submitQAMutation.mutate({
      callId: selectedCallId,
      greeting,
      discovery,
      pitch,
      objection,
      closing,
      notes
    });
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">QA Scoring Rubric</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Audit customer conversations using our structured multi-point quality scoring standard.</p>
        </div>
        
        {/* TAB TOGGLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab('score')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'score' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardCheck size={14} /> Score Rubric
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History size={14} /> Audit History
          </button>
        </div>
      </div>

      {activeTab === 'score' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SCORING FORM PANEL */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Quality Scoring Sheet</h3>
            
            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Call for Scoring</label>
                <select
                  value={selectedCallId}
                  onChange={(e) => setSelectedCallId(e.target.value)}
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose a call from pending queue...</option>
                  {pendingCalls?.map(call => (
                    <option key={call.id} value={call.id}>
                      {call.lead?.customerName} - {call.agent?.name} ({Math.round(call.duration / 60)}m {call.duration % 60}s)
                    </option>
                  ))}
                </select>
              </div>

              {/* RUBRIC SLIDERS */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <RubricSlider 
                  label="Greeting & Introduction" 
                  description="Warm introduction, company branding, and friendly connection."
                  value={greeting} 
                  onChange={(val) => handleSumScore('greeting', val)} 
                />
                <RubricSlider 
                  label="Needs Discovery" 
                  description="Active listening, ask discovery questions to identify customer pain points."
                  value={discovery} 
                  onChange={(val) => handleSumScore('discovery', val)} 
                />
                <RubricSlider 
                  label="Pitch & Value" 
                  description="Tailored product packages matching pain points, structured clean value pitch."
                  value={pitch} 
                  onChange={(val) => handleSumScore('pitch', val)} 
                />
                <RubricSlider 
                  label="Objection Handling" 
                  description="Acknowledge questions, handle hesitation professionally, handle competitor claims."
                  value={objection} 
                  onChange={(val) => handleSumScore('objection', val)} 
                />
                <RubricSlider 
                  label="Closing & Action items" 
                  description="Establish clear follow-up timelines, capture confirmation signature."
                  value={closing} 
                  onChange={(val) => handleSumScore('closing', val)} 
                />
              </div>

              {/* NOTES */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Manager Coaching Summary Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share detail coaching points for the agent..."
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 h-24"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitQAMutation.isPending}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Shield size={16} /> Submit QA Report Card
              </button>
            </form>
          </div>

          {/* REALTIME SCORE PREVIEW */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[450px]">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Live Grade Score</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Aggregated compliance status</p>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                  <circle cx="80" cy="80" r="70" stroke={complianceStatus === 'PASS' ? '#10B981' : '#F59E0B'} strokeWidth="12" fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * total) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900">{total}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
                </div>
              </div>

              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mt-6 ${
                complianceStatus === 'PASS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
              }`}>
                {complianceStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <Award size={20} className={complianceStatus === 'PASS' ? 'text-emerald-500' : 'text-amber-500'} />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-900">Structured Quality Standard</p>
                <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">Passing benchmark score: 70 points</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORICAL REPORT CARDS HISTORY */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Historical Quality Scorecards</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Logged sales evaluations under scope</p>
            </div>
            <Shield size={18} className="text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Customer Lead</th>
                  <th className="p-4">Agent Assessed</th>
                  <th className="p-4">Composite Score</th>
                  <th className="p-4">Rubric Spread (G / D / P / O / C)</th>
                  <th className="p-4">Audit Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {qaHistory?.map(rep => (
                  <tr key={rep.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-extrabold text-slate-800">{rep.call?.lead?.customerName}</td>
                    <td className="p-4 font-bold text-slate-600">{rep.call?.agent?.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        rep.total >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {rep.total} / 100
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-500">
                      {rep.greeting} / {rep.discovery} / {rep.pitch} / {rep.objection} / {rep.closing}
                    </td>
                    <td className="p-4 text-slate-400 font-bold">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!qaHistory || qaHistory.length === 0) && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400 font-bold uppercase">No audited reports yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const RubricSlider = ({ label, description, value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{label}</span>
        <span className="text-indigo-600 font-black">{value} / 20</span>
      </div>
      <p className="text-[10px] text-slate-400 font-medium leading-none">{description}</p>
      <input
        type="range"
        min="0"
        max="20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
};

export default QAScoring;
