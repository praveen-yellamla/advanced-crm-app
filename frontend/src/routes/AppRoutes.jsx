import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleBasedRoute from '../components/common/RoleBasedRoute';

// Auth Pages
import PortalSelection from '../pages/auth/PortalSelection';
import AcceptInvite from '../pages/auth/AcceptInvite';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTeams from '../pages/admin/AdminTeams';
import AdminAgents from '../pages/admin/AdminAgents';
import LeadManagement from '../pages/admin/LeadManagement';
import SystemIntegrations from '../pages/admin/SystemIntegrations';
import LeadImportWizard from '../pages/admin/LeadImportWizard';
import UnifiedTasks from '../pages/admin/UnifiedTasks';
import FiscalLedger from '../pages/admin/FiscalLedger';
import AdminCalls from '../pages/admin/AdminCalls';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import AdminSettings from '../pages/admin/AdminSettings';
import AIControlPanel from '../pages/admin/ai/AIControlPanel';
// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerLeads from '../pages/manager/ManagerLeads';
import ManagerCalls from '../pages/manager/ManagerCalls';
import ManagerAgents from '../pages/manager/ManagerAgents';
import ManagerInvoices from '../pages/manager/ManagerInvoices';
import ManagerReports from '../pages/manager/ManagerReports';
import QualityCenter from '../pages/common/QualityCenter';
// Agent Pages
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentLeads from '../pages/agent/AgentLeads';
import AgentDialer from '../pages/agent/AgentDialer';
import AgentHistory from '../pages/agent/AgentHistory';
import AgentTasks from '../pages/agent/AgentTasks';
import AgentFeedback from '../pages/agent/AgentFeedback';
import AgentEmails from '../pages/agent/AgentEmails';
import AgentInvoices from '../pages/agent/AgentInvoices';
import AgentPerformance from '../pages/agent/AgentPerformance';

// Client Pages
import ClientDashboard from '../pages/client/ClientDashboard';
import CompanyManagement from '../pages/client/CompanyManagement';
import ClientReports from '../pages/client/ClientReports';
import ClientLeads from '../pages/client/ClientLeads';
import ClientTickets from '../pages/client/ClientTickets';
import ClientInvoices from '../pages/client/ClientInvoices';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/select-portal" element={<PortalSelection />} />
      <Route path="/login/:portal" element={<Login />} />
      <Route path="/login" element={<Navigate to="/select-portal" replace />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* Admin Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="integrations" element={<SystemIntegrations />} />
            <Route path="import" element={<LeadImportWizard />} />
            <Route path="tasks" element={<UnifiedTasks />} />
            <Route path="ledger" element={<FiscalLedger />} />
            <Route path="calls" element={<AdminCalls />} />
            <Route path="qcqa" element={<QualityCenter role="ADMIN" />} />
            <Route path="audit" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="ai" element={<AIControlPanel />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['MANAGER']} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="team-leads" element={<ManagerLeads />} />
            <Route path="qcqa" element={<QualityCenter role="MANAGER" />} />
            <Route path="agents" element={<ManagerAgents />} />
            <Route path="invoices" element={<ManagerInvoices />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="analytics" element={<div className="font-bold text-2xl">Growth Analytics (Coming Soon)</div>} />
          </Route>
        </Route>

        {/* Agent Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['AGENT']} />}>
          <Route path="/agent" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="leads" element={<AgentLeads />} />
            <Route path="dialer" element={<AgentDialer />} />
            <Route path="history" element={<AgentHistory />} />
            <Route path="tasks" element={<AgentTasks />} />
            <Route path="feedback" element={<AgentFeedback />} />
            <Route path="emails" element={<AgentEmails />} />
            <Route path="invoices" element={<AgentInvoices />} />
            <Route path="performance" element={<AgentPerformance />} />
            <Route path="profile" element={<div className="font-bold text-2xl p-10 text-slate-400 font-mono tracking-tighter italic uppercase border-2 border-dashed border-slate-100 rounded-[40px] flex items-center justify-center h-64">Agent Identity Profile (COMING SOON)</div>} />
          </Route>
        </Route>

        {/* Client Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['CLIENT']} />}>
          <Route path="/client" element={<DashboardLayout />}>
             <Route index element={<Navigate to="/client/dashboard" replace />} />
             <Route path="dashboard" element={<ClientDashboard />} />
             <Route path="companies" element={<CompanyManagement />} />
             <Route path="leads" element={<ClientLeads />} />
             <Route path="reports" element={<ClientReports />} />
             <Route path="tickets" element={<ClientTickets />} />
             <Route path="invoices" element={<ClientInvoices />} />
             <Route path="sources" element={<div className="font-bold text-2xl">Lead Source Distribution</div>} />
             <Route path="analytics" element={<div className="font-bold text-2xl">Growth Analytics</div>} />
             <Route path="Billing" element={<div className="font-bold text-2xl">Finance & Billing</div>} />
             <Route path="Support" element={<div className="font-bold text-2xl">System Support</div>} />
             <Route path="profile" element={<div className="font-bold text-2xl">Corporate Profile</div>} />
          </Route>
        </Route>

      </Route>

      {/* Utilities */}
      <Route path="/unauthorized" element={<div className="h-screen flex items-center justify-center text-red-500 font-bold text-3xl">403 - Unauthorized Access</div>} />
      <Route path="/" element={<Navigate to="/select-portal" replace />} />
      <Route path="*" element={<Navigate to="/select-portal" replace />} />
    </Routes>
  );
};

export default AppRoutes;
