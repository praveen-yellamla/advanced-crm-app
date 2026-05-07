import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Sparkles, 
  Phone, 
  MessageSquare, 
  X, 
  GripVertical, 
  Minus, 
  Maximize2,
  Bell,
  Zap,
  Mic,
  Activity
} from 'lucide-react';
import AIAssistant from '../AIAssistant';
import CallCenter from '../telephony/CallCenter';

const UnifiedFloatingAssistant = () => {
  const [activeWidget, setActiveWidget] = useState(null); // 'ai', 'call', null
  const [isMinimized, setIsMinimized] = useState(false);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const toggleWidget = (type) => {
    if (activeWidget === type) {
      setActiveWidget(null);
    } else {
      setActiveWidget(type);
      setIsMinimized(false);
    }
  };

  return (
    <div className="fixed inset-6 pointer-events-none z-[1000]" ref={constraintsRef}>
      <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end"
      >
        {/* ACTIVE WIDGET CONTAINER */}
        <AnimatePresence>
          {activeWidget && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
              className="mb-6 relative w-[400px] max-h-[70vh] flex flex-col"
            >
              {/* TOP ACTION BAR - INSIDE CONTAINER FOR VISIBILITY */}
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                 <button 
                   onClick={() => setIsMinimized(true)}
                   className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
                 >
                    <Minus size={16} />
                 </button>
                 <button 
                   onClick={() => setActiveWidget(null)}
                   className="w-8 h-8 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md text-white rounded-lg flex items-center justify-center shadow-lg transition-all border border-rose-400/20"
                 >
                    <X size={16} />
                 </button>
              </div>

              <div className="shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden border border-white/10 bg-[#0F172A]/95 backdrop-blur-3xl flex-1 flex flex-col">
                 {activeWidget === 'ai' && <AIAssistant embedded={true} />}
                 {activeWidget === 'call' && <CallCenter embedded={true} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROL DOCK */}
        <motion.div 
          layout
          className="flex items-center gap-2 bg-[#0F172A]/90 backdrop-blur-2xl p-2.5 rounded-[24px] shadow-2xl border border-white/10"
        >
          {/* CONTROL HUB / DRAG HANDLE */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: 'none' }}
            className="w-12 h-12 flex items-center justify-center text-blue-400 hover:text-white cursor-grab active:cursor-grabbing transition-all hover:bg-white/5 rounded-2xl group"
            title="Drag to reposition"
          >
             <div className="grid grid-cols-2 gap-1 group-hover:scale-110 transition-transform pointer-events-none">
                {[1,2,3,4].map(i => <div key={i} className="w-1 h-1 rounded-full bg-current" />)}
             </div>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* AI BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWidget('ai')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              activeWidget === 'ai' ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
             <Sparkles size={24} />
          </motion.button>

          {/* CALL BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWidget('call')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              activeWidget === 'call' ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
             <Phone size={24} />
          </motion.button>

          {/* MINIMIZED INDICATOR */}
          {activeWidget && isMinimized && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setIsMinimized(false)}
              className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl animate-pulse"
            >
               <Maximize2 size={24} />
            </motion.button>
          )}

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* QUICK STATUS */}
          <div className="flex items-center gap-4 pl-3 pr-5">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Grid Alpha</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black text-white uppercase tracking-tighter">Live Ops</span>
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UnifiedFloatingAssistant;
