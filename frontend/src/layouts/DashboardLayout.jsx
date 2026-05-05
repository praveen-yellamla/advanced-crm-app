import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import CallCenter from '../components/telephony/CallCenter';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { 
  LayoutDashboard, 
  Users, 
  SquareUser, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Search,
  CircleCheck,
  Mic,
  Headphones,
  History,
  MessageSquare,
  Bell,
  ChevronDown,
  Monitor,
  PhoneCall,
  FileText,
  ShieldAlert,
  ClipboardCheck,
  TrendingUp,
  Briefcase,
  Layers,
  Activity,
  Globe,
  Zap,
  ShieldCheck,
  FileBarChart,
  Mail,
  BrainCircuit
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portalStyles = {
    ADMIN: {
      accent: '#2563EB',
      gradient: 'from-blue-600 to-blue-700',
      glow: 'shadow-blue-500/25',
      label: 'Admin'
    },
    MANAGER: {
      accent: '#7C3AED',
      gradient: 'from-violet-600 to-violet-700',
      glow: 'shadow-violet-500/25',
      label: 'Manager'
    },
    AGENT: {
      accent: '#06B6D4',
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/25',
      label: 'Agent'
    },
    CLIENT: {
      accent: '#4F46E5',
      gradient: 'from-indigo-600 to-indigo-700',
      glow: 'shadow-indigo-500/25',
      label: 'Client'
    }
  };

  const currentStyle = portalStyles[user?.role] || portalStyles.ADMIN;

  const menuItems = {
    ADMIN: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Teams', icon: Layers, path: '/admin/teams' },
      { name: 'Agents', icon: Users, path: '/admin/agents' },
      { name: 'Leads', icon: Target, path: '/admin/leads' },
      { name: 'Pipeline', icon: TrendingUp, path: '/admin/pipeline' },
      { name: 'Integrations', icon: Globe, path: '/admin/integrations' },
      { name: 'Bulk Import', icon: Zap, path: '/admin/import' },
      { name: 'Tasks', icon: ClipboardCheck, path: '/admin/tasks' },
      { name: 'Invoices', icon: FileText, path: '/admin/ledger' },
      { name: 'Call History', icon: PhoneCall, path: '/admin/calls' },
      { name: 'Quality Center', icon: ShieldCheck, path: '/admin/qcqa' },
      { name: 'AI Assistant', icon: BrainCircuit, path: '/admin/ai' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    MANAGER: [
      { name: 'Manager Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
      { name: 'Team Leads', icon: Target, path: '/manager/team-leads' },
      { name: 'Quality Review', icon: Headphones, path: '/manager/qcqa' },
      { name: 'Agents', icon: Users, path: '/manager/agents' },
      { name: 'Invoices', icon: FileText, path: '/manager/invoices' },
      { name: 'Team Performance', icon: BarChart3, path: '/manager/reports' },
    ],
    AGENT: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/agent/dashboard' },
      { name: 'My Leads', icon: Target, path: '/agent/leads' },
      { name: 'Dialer', icon: Headphones, path: '/agent/dialer' },
      { name: 'Call History', icon: History, path: '/agent/history' },
      { name: 'Tasks', icon: ClipboardCheck, path: '/agent/tasks' },
      { name: 'Feedback', icon: MessageSquare, path: '/agent/feedback' },
      { name: 'Emails', icon: Mail, path: '/agent/emails' },
      { name: 'Invoices', icon: FileText, path: '/agent/invoices' },
      { name: 'Performance', icon: TrendingUp, path: '/agent/performance' },
      { name: 'Profile', icon: SquareUser, path: '/agent/profile' },
    ],
    CLIENT: [
       { name: 'Client Portal', icon: LayoutDashboard, path: '/client/dashboard' },
       { name: 'My Companies', icon: Briefcase, path: '/client/companies' },
       { name: 'Leads Generated', icon: Target, path: '/client/leads' },
       { name: 'Monthly Reports', icon: FileText, path: '/client/reports' },
       { name: 'Billing', icon: ClipboardCheck, path: '/client/invoices' },
       { name: 'Support', icon: Headphones, path: '/client/tickets' },
       { name: 'Profile', icon: Settings, path: '/client/profile' },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden">
      
      {/* PREMIUM SIDEBAR */}
      <aside className={`
        ${sidebarOpen ? 'w-[280px]' : 'w-24'} 
        bg-[#0F172A] transition-all duration-500 ease-in-out flex flex-col relative z-20 shadow-2xl
      `}>
        {/* TOP: LOGO SECTION */}
        <div className="h-24 flex items-center justify-between px-6 shrink-0">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                   <Layers className="text-white" size={22} />
                </div>
                <h1 className="text-white font-black text-xl tracking-tighter">ADV<span className="text-blue-500">.CRM</span></h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* MIDDLE: SCROLLABLE MENU */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide space-y-[10px]">
          {currentMenu.map((item) => (
            <SidebarNavItem 
              key={item.name}
              item={item}
              isOpen={sidebarOpen}
              isActive={location.pathname === item.path}
              currentStyle={currentStyle}
            />
          ))}
        </nav>

        {/* BOTTOM: FIXED LOGOUT */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button 
            onClick={handleLogout}
            className={`
              flex items-center w-full h-[52px] px-4 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-[14px] transition-all duration-200 group font-medium text-[14px]
              ${!sidebarOpen ? 'justify-center' : ''}
            `}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="ml-4 truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 relative z-10 shadow-sm">
          
          <div className="flex items-center bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-2xl w-[440px] focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" placeholder="Search..." 
              className="bg-transparent border-none focus:ring-0 text-[14px] ml-4 w-full font-medium text-[#0F172A] placeholder:text-slate-400" 
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <NavIconBtn icon={Activity} />
               <NavIconBtn icon={Bell} badge />
            </div>

            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            
            <div className="flex items-center gap-4 pl-2 group cursor-pointer py-1.5 pr-3 rounded-2xl hover:bg-slate-50 transition-all">
              <div className={`h-11 w-11 rounded-xl overflow-hidden shadow-lg`}>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${currentStyle.accent.replace('#', '')}&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <span className="text-[14px] font-bold text-[#0F172A]">{user?.name}</span>
                   <ChevronDown size={14} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600" style={{ color: currentStyle.accent }}>{currentStyle.label}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <ErrorBoundary>
        <AIAssistant />
      </ErrorBoundary>
      {location.pathname !== '/agent/dialer' && <CallCenter />}
    </div>
  );
};

// REUSABLE SUB-COMPONENTS
const SidebarNavItem = ({ item, isOpen, isActive, currentStyle }) => {
  return (
    <Link
      to={item.path}
      className={`
        flex items-center h-[52px] px-4 rounded-[14px] transition-all duration-200 group relative
        ${isActive 
          ? `text-white shadow-lg ${currentStyle.glow}` 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }
        ${!isOpen ? 'justify-center' : ''}
      `}
    >
      {isActive && (
        <motion.div 
          layoutId="sidebar-active-bg"
          className={`absolute inset-0 bg-gradient-to-r ${currentStyle.gradient} rounded-[14px] -z-10`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
      {isOpen && (
        <span className={`ml-4 text-[14px] font-medium tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {item.name}
        </span>
      )}
      
      {/* HOVER TOOLTIP FOR CLOSED SIDEBAR */}
      {!isOpen && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-[#0F172A] text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[50] shadow-2xl border border-white/10 whitespace-nowrap">
           {item.name}
        </div>
      )}
    </Link>
  );
};

const NavIconBtn = ({ icon: Icon, badge }) => (
  <button className="relative w-11 h-11 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent">
    <Icon size={20} />
    {badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>}
  </button>
);

export default DashboardLayout;
