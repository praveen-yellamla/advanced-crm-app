import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

/**
 * Enterprise Grade Table Action Menu
 * Solves the "clipping" issue by rendering via React Portal.
 */
const TableActionMenu = ({ id, activeId, setActiveId, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (activeId === id) {
      setIsOpen(true);
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUp(spaceBelow < 300);
        setCoords({
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
          width: rect.width
        });
      }
    } else {
      setIsOpen(false);
    }
  }, [activeId, id]);

  // Close on scroll to prevent detached floating menu
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setActiveId(null);
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, setActiveId]);

  const toggle = (e) => {
    e.stopPropagation();
    if (activeId === id) {
      setActiveId(null);
    } else {
      setActiveId(id);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setActiveId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setActiveId]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        onClick={toggle}
        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
          isOpen ? 'bg-[#0F172A] text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
        }`}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: openUp ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: openUp ? 10 : -10 }}
            style={{
              position: 'absolute',
              top: openUp ? 'auto' : coords.bottom + 8,
              bottom: openUp ? window.innerHeight - coords.top + 8 : 'auto',
              left: align === 'left' ? coords.left : 'auto',
              right: align === 'right' ? window.innerWidth - coords.right : 'auto',
            }}
            className="z-[9999] w-64 bg-white rounded-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export const TableActionItem = ({ icon, label, onClick, color = 'slate' }) => {
  const colors = {
    blue: 'text-blue-600 hover:bg-blue-50',
    indigo: 'text-indigo-600 hover:bg-indigo-50',
    emerald: 'text-emerald-600 hover:bg-emerald-50',
    amber: 'text-amber-600 hover:bg-amber-50',
    rose: 'text-rose-600 hover:bg-rose-50',
    slate: 'text-slate-600 hover:bg-slate-50'
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${colors[color]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

export default TableActionMenu;
