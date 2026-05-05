import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Activity, 
  User, 
  Phone, 
  Headphones, 
  Eye, 
  Circle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelephony } from '../../context/TelephonyContext';
import toast from 'react-hot-toast';

const LiveCallMonitor = () => {
  const { monitorActiveCall, callState } = useTelephony();

  const { data: activeCalls, isLoading } = useQuery({
    queryKey: ['activeCalls'],
    queryFn: async () => {
      const res = await api.get('/call/active');
      return res.data.data;
    },
    refetchInterval: 3000 // Poll every 3 seconds for real-time oversight
  });

  const handleMonitor = (phoneNumber) => {
    monitorActiveCall(phoneNumber);
    toast.success('Entering Silent Listen Mode');
  };

  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
               <Activity size={32} className="animate-pulse" />
            </div>
            <div>
               <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Active Calls</h3>
               <p className-[#64748B] font-medium text-xs mt-1 italic uppercase tracking-widest">Monitor team calls in real-time</p>
            </div>
         </div>
         <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-slate-800">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            {activeCalls?.length || 0} Active Sessions
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
         <AnimatePresence mode="popLayout">
            {activeCalls?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="col-span-full p-20 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-300 gap-4"
              >
                <Headphones size={48} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No active calls right now</p>
              </motion.div>
            ) : activeCalls?.map((call) => (
              <motion.div 
                key={call.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                            <User size={16} />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent {call.agent.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-tighter">{call.status}</span>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <p className="text-xl font-bold text-[#0F172A] tracking-tight">{call.lead?.customerName || 'Direct Dial'}</p>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{call.phone}</p>
                   </div>

                   <button 
                     disabled={callState !== 'idle'}
                     onClick={() => handleMonitor(call.phone)}
                     className={`w-full h-14 rounded-2xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                       callState !== 'idle' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0F172A] text-white hover:bg-blue-600 shadow-lg shadow-slate-900/10'
                     }`}
                   >
                      <Headphones size={16} /> Silent Listen
                   </button>
                </div>
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
              </motion.div>
            ))}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveCallMonitor;
