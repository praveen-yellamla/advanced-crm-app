import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Target, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Search,
  CheckCircle2,
  Mic2,
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
  Briefcase
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

  const menuItems = {
    ADMIN: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Users', icon: Users, path: '/admin/users' },
      { name: 'Leads', icon: Target, path: '/admin/leads' },
      { name: 'Managers', icon: Briefcase, path: '/admin/managers' },
      { name: 'Agents', icon: UserSquare2, path: '/admin/agents' },
      { name: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
      { name: 'Calling Center', icon: PhoneCall, path: '/admin/calling' },
      { name: 'Invoices', icon: FileText, path: '/admin/invoices' },
      { name: 'QA / QC', icon: ClipboardCheck, path: '/admin/qc' },
      { name: 'Audit Logs', icon: ShieldAlert, path: '/admin/audit' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    MANAGER: [
      { name: 'Overview', icon: LayoutDashboard, path: '/manager/dashboard' },
      { name: 'Analytics', icon: BarChart3, path: '/manager/analytics' },
      { name: 'Quality Control', icon: CheckCircle2, path: '/manager/qc' },
      { name: 'Voice Logs', icon: Mic2, path: '/manager/recordings' },
      { name: 'Allocations', icon: Target, path: '/manager/team-leads' },
    ],
    AGENT: [
      { name: 'Workbench', icon: LayoutDashboard, path: '/agent/dashboard' },
      { name: 'Active Leads', icon: Target, path: '/agent/leads' },
      { name: 'IP Calling', icon: Headphones, path: '/agent/calling' },
      { name: 'Call Logs', icon: History, path: '/agent/history' },
      { name: 'Insights', icon: MessageSquare, path: '/agent/feedback' },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Sidebar - Executive Focus */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] transition-all duration-500 ease-in-out flex flex-col relative z-20 shadow-2xl`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <Target className="text-white" size={18} />
              </div>
              <h1 className="text-white font-bold text-lg tracking-tight">Advanced<span className="text-blue-500">CRM</span></h1>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center p-3 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
                {sidebarOpen && <span className="ml-3 text-sm font-semibold tracking-wide">{item.name}</span>}
                {isActive && !sidebarOpen && (
                  <div className="absolute right-0 w-1 h-6 bg-blue-500 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all duration-300 group"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3 text-sm font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navigation */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 relative z-10">
          <div className="flex items-center bg-slate-100/50 border border-slate-200 px-4 py-2.5 rounded-2xl w-[400px] group focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input type="text" placeholder="Global system search..." className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-full font-medium text-slate-600" />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800">{user?.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">{user?.role}</span>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-[#0F172A] border-2 border-blue-600/20 p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0)}
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700 slide-in-from-bottom-4">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
