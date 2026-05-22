import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import UnifiedFloatingAssistant from '../components/common/UnifiedFloatingAssistant';
import ErrorBoundary from '../components/common/ErrorBoundary';
import api from '../utils/api';
import { getRoleColor } from '../utils/colorUtils';
import { 
  LayoutDashboard, 
  Layers,
  Search,
  Users, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell,
  ChevronDown,
  PhoneCall,
  FileText,
  ClipboardCheck,
  TrendingUp,
  FileBarChart,
  Mail,
  BrainCircuit,
  Shield,
  HelpCircle,
  User,
  Key,
  Briefcase,
  Zap,
  Activity,
  ShieldAlert,
  Headphones,
  History,
  MessageSquare
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, stopImpersonation } = useAuth();
  const isImpersonated = sessionStorage.getItem('original_token') !== null;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      } catch (err) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    SUPER_ADMIN: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/platform/dashboard' },
      { name: 'Companies', icon: Briefcase, path: '/platform/organizations' },
      { name: 'Billing', icon: Zap, path: '/platform/subscriptions' },
      { name: 'Revenue', icon: BarChart3, path: '/platform/analytics' },
      { name: 'Usage', icon: Activity, path: '/platform/usage' },
    ],
    ADMIN: [
      { name: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Billing', icon: FileText, path: '/admin/billing' },
      { name: 'Invoices', icon: FileBarChart, path: '/admin/invoices' },
      { name: 'Leads', icon: Target, path: '/admin/leads' },
      { name: 'Pipeline', icon: TrendingUp, path: '/admin/pipeline' },
      { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { name: 'Agents', icon: Users, path: '/admin/agents' },
      { name: 'Teams', icon: Layers, path: '/admin/teams' },
      { name: 'Manager Feedback', icon: MessageSquare, path: '/admin/manager-feedback' },
      { name: 'Tasks', icon: ClipboardCheck, path: '/admin/tasks' },
      { name: 'Calls', icon: PhoneCall, path: '/admin/calls' },
      { name: 'Emails', icon: Mail, path: '/admin/emails' },
      { name: 'AI Tools', icon: BrainCircuit, path: '/admin/ai' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    MANAGER: [
      { name: 'Team Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
      { name: 'Team Analytics', icon: BarChart3, path: '/manager/analytics' },
      { name: 'Call Recordings & QC', icon: Headphones, path: '/manager/recordings' },
      { name: 'QA Scoring', icon: Shield, path: '/manager/qa-scoring' },
      { name: 'Agent Feedback', icon: MessageSquare, path: '/manager/feedback' },
      { name: 'My Performance', icon: Target, path: '/manager/my-performance' },
      { name: 'Lead Management', icon: Target, path: '/manager/leads' },
      { name: 'Task & Activity', icon: ClipboardCheck, path: '/manager/tasks' },
      { name: 'Email Monitoring', icon: Mail, path: '/manager/emails' },
      { name: 'Invoices', icon: FileText, path: '/manager/invoices' },
    ],
    AGENT: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/agent/dashboard' },
      { name: 'Leads', icon: Target, path: '/agent/leads' },
      { name: 'Calling Workspace', icon: Headphones, path: '/agent/calling' },
      { name: 'Activity Log', icon: History, path: '/agent/activity' },
      { name: 'Task Manager', icon: ClipboardCheck, path: '/agent/tasks' },
      { name: 'Email Inbox', icon: Mail, path: '/agent/inbox' },
      { name: 'Analytics', icon: BarChart3, path: '/agent/analytics' },
      { name: 'Invoices', icon: FileText, path: '/agent/invoices' },
      { name: 'Feedback', icon: MessageSquare, path: '/agent/feedback' },
    ]
  };

  const currentMenu = (menuItems[user?.role] || []).filter(item => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (item.name === 'AI Tools' && !user?.features?.aiAssistant) return false;
    if (item.name === 'Calls' && !user?.features?.calling) return false;
    if (item.name === 'Analytics' && !user?.features?.analytics) return false;
    if (item.name === 'Pipeline' && !user?.features?.automation) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-brand-midnight text-neutral-primary font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[248px] bg-brand-navy flex flex-col shrink-0 z-20">
        
        {/* TOP LOGO AREA */}
        <div className="h-[64px] px-5 flex items-center border-b border-white/5 shrink-0">
          <Layers className="text-white mr-2.5" size={22} />
          <h1 className="font-[800] text-[20px] text-white tracking-tight">
            CRM<span className="text-brand-accent-bright">.PRO</span>
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar flex flex-col gap-[2px]">
          <div className="text-[10px] font-[600] text-white/25 tracking-[1.2px] uppercase px-2 pt-4 pb-1.5 mt-2">
            Main Menu
          </div>
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-[10px] px-3 py-2.5 rounded-[10px] transition-all duration-150 ease-in-out cursor-pointer
                  ${isActive 
                    ? 'bg-brand-accent-glow border-l-[3px] border-brand-accent-bright pl-[9px]' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                <item.icon 
                  size={18} 
                  className={isActive ? 'text-brand-accent-bright' : 'text-white/45'} 
                  style={!isActive ? { transition: 'color 0.15s' } : {}}
                />
                <span className={`text-[14px] ${isActive ? 'font-[600] text-white' : 'font-[500] text-white/55'} transition-colors duration-150`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* WORKSPACE IDENTITY (STATIC) */}
        <div className="mt-auto border-t border-white/10 p-5 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
            </span>
            <span className="text-[10px] text-white/60 tracking-[0.1em] uppercase font-[700]">Live Session</span>
          </div>
          
          <div className="flex flex-col min-w-0 gap-1">
            <span className="text-[13px] font-[600] text-white/95 truncate">{user?.name || 'Operator'}</span>
            <span className="text-[11px] text-brand-accent-bright uppercase tracking-[0.05em] font-[600] truncate">{user?.role?.replace('_', ' ') || 'AGENT'}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-[0.05em] truncate mt-0.5">Region: US-EAST-1</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-page relative">
        
        {/* SUPPORT ACCESS BANNER */}
        <AnimatePresence>
          {isImpersonated && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-status-warning text-status-warning-text flex items-center justify-between px-7 shrink-0 z-[100] shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={16} />
                <span className="text-[12px] font-[600] tracking-wide">
                  Support Session Active — Managing: {user?.organization?.name}
                </span>
              </div>
              <button 
                onClick={stopImpersonation}
                className="px-4 py-1 bg-white/40 hover:bg-white/60 rounded-lg text-[12px] font-[600] transition-all flex items-center gap-1.5"
              >
                <LogOut size={14} /> Exit Support
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP NAVBAR */}
        <header className="h-[64px] bg-white/95 backdrop-blur-[12px] border-b border-neutral-border-default shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-[28px] shrink-0 sticky top-0 z-30 flex items-center justify-between">
          
          {/* LEFT: Search */}
          <div className="flex items-center bg-neutral-border-default/30 border-[1.5px] border-neutral-border-default rounded-[10px] h-[38px] px-[14px] w-[380px] focus-within:border-brand-focus focus-within:bg-white transition-all duration-200">
            <Search size={16} className="text-neutral-placeholder shrink-0" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-[14px] ml-2 w-full text-neutral-primary placeholder:text-neutral-placeholder" 
            />
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">
            
            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-muted hover:text-brand-accent hover:bg-neutral-border-default/40 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger border-2 border-white rounded-full"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="crm-dropdown absolute right-0 mt-2 w-[320px] p-0 overflow-hidden z-[100]"
                  >
                    <div className="p-4 border-b border-neutral-border-default bg-neutral-hover flex items-center justify-between">
                      <span className="text-[13px] font-[600] text-neutral-primary">Notifications</span>
                      <button className="text-[11px] font-[500] text-brand-accent">Mark all read</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} className="p-4 border-b border-neutral-border-default/50 hover:bg-neutral-hover cursor-pointer transition-colors">
                           <p className="text-[13px] font-[500] text-neutral-primary">{n.title}</p>
                           <p className="text-[12px] text-neutral-secondary mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-neutral-muted text-[13px]">No new alerts</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-[1px] bg-neutral-border-default mx-1"></div>

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 cursor-pointer hover:bg-neutral-hover transition-colors"
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Avatar" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-neutral-border-default/50" />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg text-white text-[12px] font-[700] flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${getRoleColor(user?.role).from}, ${getRoleColor(user?.role).to})` }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0 mr-1">
                  <span className="text-[14px] font-[600] text-neutral-primary leading-tight">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-neutral-muted uppercase tracking-[0.5px] leading-tight">{user?.role?.replace('_', ' ') || 'AGENT'}</span>
                </div>
                <ChevronDown size={16} className="text-neutral-muted" />
              </div>

              {/* Profile Menu Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.96 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-[220px] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-neutral-border-default overflow-hidden z-[100]"
                  >
                    <div className="p-1.5 flex flex-col">
                      {/* User Info Header (Compact) */}
                      <div className="px-3 py-2 border-b border-neutral-border-default/60 mb-1">
                        <span className="block text-[13px] font-[600] text-neutral-primary truncate">{user?.name || 'User'}</span>
                        <span className="block text-[12px] text-neutral-muted truncate">{user?.email || 'user@company.com'}</span>
                      </div>

                      {/* ACCOUNT SECTION */}
                      <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-hover text-[13px] font-[500] text-neutral-secondary transition-colors">
                        <User size={15} className="text-neutral-muted" /> Profile
                      </button>
                      <button onClick={() => { navigate('/security'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-hover text-[13px] font-[500] text-neutral-secondary transition-colors">
                        <ShieldAlert size={15} className="text-neutral-muted" /> Security
                      </button>
                      
                      {/* PLATFORM SECTION */}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                        <>
                          <div className="h-[1px] bg-neutral-border-default/60 my-1 mx-2"></div>
                          <button onClick={() => { navigate('/platform/settings'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-hover text-[13px] font-[500] text-neutral-secondary transition-colors">
                            <Settings size={15} className="text-neutral-muted" /> Settings
                          </button>
                        </>
                      )}
                      
                      {/* SUPPORT SECTION */}
                      <div className="h-[1px] bg-neutral-border-default/60 my-1 mx-2"></div>
                      <button onClick={() => { navigate('/help'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-hover text-[13px] font-[500] text-neutral-secondary transition-colors">
                        <HelpCircle size={15} className="text-neutral-muted" /> Help Center
                      </button>
                      
                      {/* LOGOUT */}
                      <div className="h-[1px] bg-neutral-border-default/60 my-1 mx-2"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-status-danger-light/50 text-[13px] font-[600] text-status-danger transition-colors">
                        <LogOut size={15} /> Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-[28px] custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto min-h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <ErrorBoundary>
        <UnifiedFloatingAssistant />
      </ErrorBoundary>
    </div>
  );
};

export default DashboardLayout;
