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
    <div className="fixed inset-0 pointer-events-none z-[1000]" ref={constraintsRef}>
      <motion.div
        drag
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ x: window.innerWidth - 320, y: window.innerHeight - 120 }}
        className="absolute pointer-events-auto flex flex-col items-end gap-6"
      >
        {/* ACTIVE WIDGET CONTAINER */}
        <AnimatePresence>
          {activeWidget && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
              className="mb-4 relative"
            >
              <div className="absolute -top-4 -right-4 z-50 flex gap-2">
                 <button 
                   onClick={() => setIsMinimized(true)}
                   className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-xl transition-all"
                 >
                    <Minus size={18} />
                 </button>
                 <button 
                   onClick={() => setActiveWidget(null)}
                   className="w-10 h-10 bg-[#0F172A] text-white rounded-full flex items-center justify-center hover:bg-rose-500 shadow-xl transition-all"
                 >
                    <X size={18} />
                 </button>
              </div>

              <div className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-[48px] overflow-hidden border border-slate-200/50 bg-white/95 backdrop-blur-2xl">
                 {activeWidget === 'ai' && <AIAssistant embedded={true} />}
                 {activeWidget === 'call' && <CallCenter embedded={true} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROL DOCK */}
        <motion.div 
          layout
          className="flex items-center gap-3 bg-[#0F172A]/90 backdrop-blur-xl p-3 rounded-[32px] shadow-2xl border border-white/10"
        >
          {/* DRAG HANDLE */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          >
             <GripVertical size={20} />
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* AI BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWidget('ai')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              activeWidget === 'ai' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
              activeWidget === 'call' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
          <div className="flex items-center gap-4 px-4 pr-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sys Ready</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black text-white uppercase tracking-tighter">Production Grid</span>
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UnifiedFloatingAssistant;
