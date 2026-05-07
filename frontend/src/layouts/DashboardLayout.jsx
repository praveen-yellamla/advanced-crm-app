import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import UnifiedFloatingAssistant from '../components/common/UnifiedFloatingAssistant';
import ErrorBoundary from '../components/common/ErrorBoundary';
import api from '../utils/api';
import { 
  LayoutDashboard, 
  Layers,
  Search,
  Users, 
  SquareUser, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
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
  FileBarChart,
  Mail,
  BrainCircuit,
  Phone,
  Server,
  Shield,
  Download,
  Lock,
  HelpCircle,
  User,
  Key,
  Briefcase,
  Zap,
  Activity,
  Globe,
  ShieldCheck
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, stopImpersonation } = useAuth();
  const isImpersonated = sessionStorage.getItem('original_token') !== null;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [healthData, setHealthData] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = React.useRef(null);

  // Close profile on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
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
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch Health Data when modal opens
  const fetchHealth = async () => {
    try {
      const res = await api.get('/platform/health');
      setHealthData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch health data');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portalStyles = {
    SUPER_ADMIN: {
      accent: '#2563EB',
      gradient: 'from-blue-600 to-blue-700',
      glow: 'shadow-blue-500/25',
      label: 'Platform Dashboard'
    },
    ADMIN: {
      accent: '#2563EB',
      gradient: 'from-blue-600 to-blue-700',
      glow: 'shadow-blue-500/25',
      label: 'Admin Dashboard'
    },
    MANAGER: {
      accent: '#7C3AED',
      gradient: 'from-violet-600 to-violet-700',
      glow: 'shadow-violet-500/25',
      label: 'Manager Dashboard'
    },
    AGENT: {
      accent: '#06B6D4',
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/25',
      label: 'Agent Dashboard'
    }
  };

  const currentStyle = portalStyles[user?.role] || portalStyles.ADMIN;

  const menuItems = {
    SUPER_ADMIN: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/platform/dashboard' },
      { name: 'Companies', icon: Briefcase, path: '/platform/organizations' },
      { name: 'Billing', icon: Zap, path: '/platform/subscriptions' },
      { name: 'Revenue', icon: BarChart3, path: '/platform/analytics' },
      { name: 'Usage', icon: Activity, path: '/platform/usage' },
    ],
    ADMIN: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Billing', icon: FileText, path: '/admin/billing' },
      { name: 'Leads', icon: Target, path: '/admin/leads' },
      { name: 'Pipeline', icon: TrendingUp, path: '/admin/pipeline' },
      { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { name: 'Agents', icon: Users, path: '/admin/agents' },
      { name: 'Teams', icon: Layers, path: '/admin/teams' },
      { name: 'Tasks', icon: ClipboardCheck, path: '/admin/tasks' },
      { name: 'Calls', icon: PhoneCall, path: '/admin/calls' },
      { name: 'AI Tools', icon: BrainCircuit, path: '/admin/ai' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    MANAGER: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
      { name: 'Leads', icon: Target, path: '/manager/team-leads' },
      { name: 'Agents', icon: Users, path: '/manager/agents' },
      { name: 'Quality Control', icon: ShieldCheck, path: '/manager/qcqa' },
      { name: 'Reports', icon: BarChart3, path: '/manager/reports' },
    ],
    AGENT: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/agent/dashboard' },
      { name: 'Leads', icon: Target, path: '/agent/leads' },
      { name: 'Dialer', icon: Phone, path: '/agent/dialer' },
      { name: 'Inbox', icon: Mail, path: '/agent/inbox' },
      { name: 'Tasks', icon: ClipboardCheck, path: '/agent/tasks' },
      { name: 'Performance', icon: TrendingUp, path: '/agent/performance' },
    ]
  };

  const currentMenu = (menuItems[user?.role] || []).filter(item => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (item.name === 'AI Tools' && !user?.features?.aiAssistant) return false;
    if (item.name === 'Calls' && !user?.features?.calling) return false;
    if (item.name === 'Dialer' && !user?.features?.calling) return false;
    if (item.name === 'Analytics' && !user?.features?.analytics) return false;
    if (item.name === 'Pipeline' && !user?.features?.automation) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden">
      
      {/* SUPPORT ACCESS BANNER */}
      <AnimatePresence>
        {isImpersonated && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white flex items-center justify-between px-10 shrink-0 z-[100] shadow-lg overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <ShieldAlert size={18} className="animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
                Support Session Active — All actions are logged — Managing: {user?.organization?.name}
              </span>
            </div>
            <button 
              onClick={stopImpersonation}
              className="px-6 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30 transition-all flex items-center gap-2"
            >
              <LogOut size={14} /> Exit Support
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`
        ${sidebarOpen ? 'w-[280px]' : 'w-24'} 
        bg-[#0F172A] transition-all duration-500 ease-in-out flex flex-col relative z-20 shadow-2xl
      `}>
        <div className="h-24 flex items-center justify-between px-6 shrink-0">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                   <Layers className="text-white" size={22} />
                </div>
                <h1 className="text-white font-black text-xl tracking-tighter uppercase italic">CRM<span className="text-blue-500">.PRO</span></h1>
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

        <div className="p-4 border-t border-white/5 shrink-0">
          <button 
            onClick={handleLogout}
            className={`flex items-center w-full h-[52px] px-4 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-[14px] transition-all duration-200 group font-medium text-[14px] ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="ml-4 truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 relative z-[2000] shadow-sm">
          
          <div className="flex items-center bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-2xl w-[440px] focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search Command Center..." className="bg-transparent border-none focus:ring-0 text-[14px] ml-4 w-full font-medium text-[#0F172A] placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               {/* Notification Icon */}
               <div className="relative">
                  <NavIconBtn 
                    icon={Bell} 
                    badge={unreadCount > 0} 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)} 
                  />
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-[calc(100vw-40px)] md:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[2001]"
                      >
                         <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h4 className="text-sm font-black text-[#0F172A] uppercase italic">Notifications</h4>
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Mark all as read</button>
                         </div>
                         <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n) => (
                              <div key={n.id} className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group">
                                 <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                       {n.type === 'SUCCESS' ? <CircleCheck size={18} /> : <Bell size={18} />}
                                    </div>
                                    <div>
                                       <p className="text-[13px] font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors">{n.title}</p>
                                       <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                 </div>
                              </div>
                            )) : (
                              <div className="p-12 text-center text-slate-400">
                                 <Bell className="mx-auto opacity-20 mb-4" size={48} />
                                 <p className="text-[10px] font-black uppercase tracking-widest">No new alerts</p>
                              </div>
                            )}
                         </div>
                         <button className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-slate-50 transition-all">View All Notifications</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`
                  flex items-center gap-4 pl-2 group cursor-pointer py-1.5 pr-4 rounded-[22px] transition-all duration-300
                  ${isProfileOpen ? 'bg-slate-900 shadow-2xl' : 'hover:bg-slate-50'}
                `}
              >
                <div className={`h-11 w-11 rounded-xl overflow-hidden shadow-lg border-2 ${isProfileOpen ? 'border-blue-500' : 'border-white'}`}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${currentStyle.accent.replace('#', '')}&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className={`text-[14px] font-bold transition-colors ${isProfileOpen ? 'text-white' : 'text-[#0F172A]'}`}>{user?.name}</span>
                     <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-400' : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isProfileOpen ? 'text-blue-400' : 'text-slate-400'}`}>{currentStyle.label}</span>
                </div>
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-[280px] bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[2001]"
                  >
                     {/* DROPDOWN HEADER */}
                     <div className="p-6 bg-slate-900 text-white flex flex-col gap-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                           <ShieldCheck size={60} />
                        </div>
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] relative z-10">Operator Node</span>
                        <p className="text-sm font-black italic uppercase tracking-tight relative z-10">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold relative z-10">{user?.email}</p>
                     </div>

                     <div className="p-2 space-y-1">
                        {/* ACCOUNT SECTION */}
                        <div className="px-3 py-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</p>
                        </div>
                        <ProfileMenuItem icon={User} label="Profile" onClick={() => { navigate('/platform/profile'); setIsProfileOpen(false); }} />
                        <ProfileMenuItem icon={Lock} label="Security" onClick={() => { navigate('/platform/security'); setIsProfileOpen(false); }} />
                        
                        <div className="h-px bg-slate-100 my-2 mx-2"></div>
                        
                        {/* PLATFORM SECTION */}
                        <div className="px-3 py-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</p>
                        </div>
                        <ProfileMenuItem icon={Key} label="API Keys" onClick={() => { navigate('/platform/api-keys'); setIsProfileOpen(false); }} />
                        <ProfileMenuItem icon={Settings} label="Settings" onClick={() => { navigate('/platform/settings'); setIsProfileOpen(false); }} />
                        
                        <div className="h-px bg-slate-100 my-2 mx-2"></div>

                        {/* SUPPORT SECTION */}
                        <div className="px-3 py-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support</p>
                        </div>
                        <ProfileMenuItem icon={HelpCircle} label="Help Center" onClick={() => { navigate('/platform/help'); setIsProfileOpen(false); }} />
                        
                        <div className="h-px bg-slate-100 my-2 mx-2"></div>
                        
                        <ProfileMenuItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* HEALTH STATUS MODAL */}
      <AnimatePresence>
        {isHealthOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl"
               onClick={() => setIsHealthOpen(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden"
             >
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase italic">System Health</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Node Telemetry</p>
                   </div>
                   <button onClick={() => setIsHealthOpen(false)} className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-10 space-y-6">
                   {healthData ? (
                      <>
                        <div className="grid grid-cols-1 gap-4">
                           {healthData.services.map((s, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'ONLINE' || s.status === 'ACTIVE' || s.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                      <Server size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[13px] font-bold text-[#0F172A]">{s.name}</p>
                                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{s.provider || s.regional || s.latency || 'Operating'}</p>
                                   </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'ONLINE' || s.status === 'ACTIVE' || s.status === 'READY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                                   {s.status}
                                </span>
                             </div>
                           ))}
                        </div>
                        <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-8">
                           <HealthMetric label="CPU Cluster" value={healthData.infrastructure.cpu} />
                           <HealthMetric label="RAM Usage" value={healthData.infrastructure.memory} />
                           <HealthMetric label="Total Storage" value={healthData.infrastructure.storage} />
                           <HealthMetric label="Net Bandwidth" value={healthData.infrastructure.network} />
                        </div>
                      </>
                   ) : (
                      <div className="py-20 text-center animate-pulse">
                         <Activity className="mx-auto text-blue-600 mb-4" size={48} />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pinging System Nodes...</p>
                      </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ErrorBoundary>
        <UnifiedFloatingAssistant />
      </ErrorBoundary>
      </div>
    </div>
  );
};

const SidebarNavItem = ({ item, isOpen, isActive, currentStyle }) => (
  <Link
    to={item.path}
    className={`flex items-center h-[52px] px-4 rounded-[14px] transition-all duration-200 group relative ${isActive ? `text-white shadow-lg ${currentStyle.glow}` : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${!isOpen ? 'justify-center' : ''}`}
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
    {!isOpen && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-[#0F172A] text-white text-[12px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[50] shadow-2xl border border-white/10 whitespace-nowrap">
         {item.name}
      </div>
    )}
  </Link>
);

const NavIconBtn = ({ icon: Icon, badge, onClick }) => (
  <button onClick={onClick} className="relative w-11 h-11 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent">
    <Icon size={20} />
    {badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>}
  </button>
);

const ProfileMenuItem = ({ icon: Icon, label, onClick, danger }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-[13px] ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const HealthMetric = ({ label, value }) => (
  <div className="space-y-2">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{label}</p>
     <p className="text-xl font-black text-[#0F172A] italic">{value}</p>
     <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 w-[40%]" />
     </div>
  </div>
);

export default DashboardLayout;
