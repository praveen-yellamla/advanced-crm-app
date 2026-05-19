import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Play, Pause, Headphones, Search, Filter, MessageSquare, ShieldCheck, Flag, Clock, User, Download, Plus, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const CallRecordings = () => {
  const [selectedCall, setSelectedCall] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMin, setDurationMin] = useState('');
  const [durationMax, setDurationMax] = useState('');
  const [agentId, setAgentId] = useState('');
  const [search, setSearch] = useState('');
  const [annotationNote, setAnnotationNote] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  const audioRef = useRef(null);

  // 1. Fetch Calls
  const { data: callsData, isLoading: isCallsLoading, refetch } = useQuery({
    queryKey: ['managerCalls', agentId, search, durationMin, durationMax],
    queryFn: async () => {
      const res = await api.get(`/manager/calls?agentId=${agentId}&search=${search}&durationMin=${durationMin}&durationMax=${durationMax}`);
      return res.data.data;
    }
  });

  // 2. Fetch Agents (for dropdown)
  const { data: agentsData } = useQuery({
    queryKey: ['managerAgentsList'],
    queryFn: async () => {
      const res = await api.get('/manager/agents');
      return res.data.data;
    }
  });

  // 3. Mutation: Add Annotation
  const addAnnotationMutation = useMutation({
    mutationFn: async ({ callId, timestamp, note }) => {
      const res = await api.post(`/manager/calls/${callId}/annotate`, { timestamp, note });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Annotation saved');
      setAnnotationNote('');
      refetch();
    }
  });

  // 4. Mutation: Flag Call
  const flagCallMutation = useMutation({
    mutationFn: async ({ callId, reason }) => {
      const res = await api.post(`/manager/calls/${callId}/flag`, { reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Call flagged successfully');
      setShowFlagModal(false);
      setFlagReason('');
      refetch();
    }
  });

  const handlePlayCall = (call) => {
    setSelectedCall(call);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = call.recordingUrl || '';
      audioRef.current.play().catch(e => {
        console.error('Audio play blocked:', e);
      });
    }
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveAnnotation = () => {
    if (!annotationNote) return;
    const currentTimestamp = audioRef.current ? audioRef.current.currentTime : 0;
    addAnnotationMutation.mutate({
      callId: selectedCall.id,
      timestamp: currentTimestamp,
      note: annotationNote
    });
  };

  const handleFlagCall = () => {
    if (!flagReason) return;
    flagCallMutation.mutate({
      callId: selectedCall.id,
      reason: flagReason
    });
  };

  return (
    <div className="space-y-8 pb-16 px-4 md:px-0">
      {/* HEADER */}
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Call Recordings & QC</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Review active recordings, audit call logs, flag violations, and leave annotations.</p>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or phone..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Team Members</option>
            {agentsData?.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="Min Secs"
            className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
          />
          <input
            type="number"
            value={durationMax}
            onChange={(e) => setDurationMax(e.target.value)}
            placeholder="Max Secs"
            className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
          />
        </div>

        <button 
          onClick={refetch}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Filter size={16} /> Apply Filters
        </button>
      </div>

      {/* AUDIO PLAYER (IF SELECTED) */}
      {selectedCall && (
        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleTogglePlay}
              className="w-12 h-12 bg-white text-indigo-900 rounded-full flex items-center justify-center font-bold hover:scale-105 transition-all shadow-md"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
            </button>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Now Playing</p>
              <h3 className="text-base font-extrabold truncate max-w-[250px]">{selectedCall.lead?.customerName}</h3>
              <p className="text-xs text-indigo-200 font-medium">Placed by {selectedCall.agent?.name}</p>
            </div>
          </div>
          <div className="flex-1 max-w-md mx-6">
            <audio 
              ref={audioRef} 
              onEnded={() => setIsPlaying(false)}
              controls 
              className="w-full filter invert brightness-200"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFlagModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Flag size={14} /> Flag Call
            </button>
          </div>
        </div>
      )}

      {/* TWO PANEL CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALLS LIST TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">Recording Queue</h3>
            <Headphones size={18} className="text-slate-400" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Tags / Sentiment</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {callsData?.map(call => (
                  <tr key={call.id} className={`text-xs hover:bg-slate-50/50 transition-colors ${selectedCall?.id === call.id ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-4 font-extrabold text-slate-800">
                      <div>{call.lead?.customerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{call.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{call.agent?.name}</td>
                    <td className="p-4 font-bold text-slate-600">{Math.round(call.duration / 60)}m {call.duration % 60}s</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {call.tags && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            call.tags.includes('Flag') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {call.tags}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          call.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600' :
                          call.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {call.sentiment}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {call.recordingUrl ? (
                        <button
                          onClick={() => handlePlayCall(call)}
                          className="h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100"
                        >
                          <Play size={14} className="ml-0.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">No audio</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRANSCRIPT & NOTES PANEL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[600px]">
          {selectedCall ? (
            <div className="flex flex-col h-full justify-between">
              <div className="overflow-y-auto space-y-6 flex-1 pr-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Audit Panel</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Call transcript and custom manager timeline annotations.</p>
                </div>

                {/* TRANSCRIPT & NOTES */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Agent Summary Notes</h4>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-700 mt-1.5 leading-relaxed">
                      {selectedCall.notes || 'No agent summary notes recorded.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Call Transcript Snippet</h4>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 mt-1.5 leading-relaxed italic max-h-40 overflow-y-auto">
                      {selectedCall.transcript || 'Transcript generation complete.'}
                    </p>
                  </div>
                </div>

                {/* TIMELINE ANNOTATIONS */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Timeline Annotations</h4>
                  <div className="space-y-3">
                    {selectedCall.annotations?.map((ann, i) => (
                      <div key={i} className="flex gap-2 p-2 bg-indigo-50/50 border border-indigo-50 rounded-lg text-xs">
                        <span className="font-black text-indigo-600">{Math.floor(ann.timestamp / 60)}:{(ann.timestamp % 60).toFixed(0).padStart(2, '0')}</span>
                        <span className="text-slate-600 font-medium">{ann.note}</span>
                      </div>
                    ))}
                    {(!selectedCall.annotations || selectedCall.annotations.length === 0) && (
                      <p className="text-[11px] text-slate-400 font-bold uppercase italic">No annotations added yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ANNOTATION INPUT */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={annotationNote}
                  onChange={(e) => setAnnotationNote(e.target.value)}
                  placeholder="Annotate at current playback timestamp..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveAnnotation}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Headphones size={36} className="text-slate-200 mb-2 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider">Select a call recording to activate the audit panel</p>
            </div>
          )}
        </div>
      </div>

      {/* FLAG CALL MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Flag Call for Escalation</h3>
            <p className="text-xs text-slate-500 mt-1">Leave a critical reason why this call is flagged for quality coaching.</p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g. Hostile language, competitor comparison violation..."
              className="w-full mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 h-24"
            />
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleFlagCall}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md shadow-rose-500/20"
              >
                Escalate Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallRecordings;
