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
import LeadPipeline from '../pages/admin/LeadPipeline';
import SystemIntegrations from '../pages/admin/SystemIntegrations';
import LeadImportWizard from '../pages/admin/LeadImportWizard';
import UnifiedTasks from '../pages/admin/UnifiedTasks';
import FiscalLedger from '../pages/admin/FiscalLedger';
import AdminCalls from '../pages/admin/AdminCalls';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import AdminSettings from '../pages/admin/AdminSettings';
import AIControlPanel from '../pages/admin/ai/AIControlPanel';
import AnalyticsCommandCenter from '../pages/admin/AnalyticsCommandCenter';
// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerLeads from '../pages/manager/ManagerLeads';
import ManagerCalls from '../pages/manager/ManagerCalls';
import ManagerAgents from '../pages/manager/ManagerAgents';
import ManagerInvoices from '../pages/manager/ManagerInvoices';
import ManagerReports from '../pages/manager/ManagerReports';
import QualityControlCenter from '../pages/manager/QualityControlCenter';
// Agent Pages
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentLeads from '../pages/agent/AgentLeads';
import AgentDialer from '../pages/agent/AgentDialer';
import AgentHistory from '../pages/agent/AgentHistory';
import AgentTasks from '../pages/agent/AgentTasks';
import AgentFeedback from '../pages/agent/AgentFeedback';
import EmailInbox from '../pages/agent/EmailInbox';
import AgentInvoices from '../pages/agent/AgentInvoices';
import AgentPerformance from '../pages/agent/AgentPerformance';
import InvoiceBuilder from '../pages/agent/InvoiceBuilder';

// Platform Pages
import PlatformDashboard from '../pages/platform/PlatformDashboard';
import PlatformCompanies from '../pages/platform/PlatformCompanies';
import CompanyDetails from '../pages/platform/CompanyDetails';
import PlatformSubscriptions from '../pages/platform/PlatformSubscriptions';
import PlatformProfile from '../pages/platform/PlatformProfile';
import PlatformSettings from '../pages/platform/PlatformSettings';
import PlatformSecurity from '../pages/platform/PlatformSecurity';
import PlatformAPIKeys from '../pages/platform/PlatformAPIKeys';
import PlatformHelp from '../pages/platform/PlatformHelp';

// Admin Billing
import AdminBilling from '../pages/admin/AdminBilling';

// Client Pages (Legacy)
import ClientReports from '../pages/client/ClientReports';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* 1. PLATFORM LAYER (SUPER_ADMIN ONLY) */}
        <Route element={<RoleBasedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/platform" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/platform/dashboard" replace />} />
            <Route path="dashboard" element={<PlatformDashboard />} />
            <Route path="organizations" element={<PlatformCompanies />} />
            <Route path="organizations/:id" element={<CompanyDetails />} />
            <Route path="subscriptions" element={<PlatformSubscriptions />} />
            <Route path="analytics" element={<ClientReports />} />
            <Route path="usage" element={<div className="font-bold text-2xl">Platform Usage Analytics</div>} />
            <Route path="api-keys" element={<PlatformAPIKeys />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>
        </Route>

        {/* 2. CRM WORKSPACE LAYER - ADMIN */}
        <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="analytics" element={<AnalyticsCommandCenter />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="pipeline" element={<LeadPipeline />} />
            <Route path="integrations" element={<SystemIntegrations />} />
            <Route path="tasks" element={<UnifiedTasks />} />
            <Route path="calls" element={<AdminCalls />} />
            <Route path="ai" element={<AIControlPanel />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* 3. CRM WORKSPACE LAYER - MANAGER */}
        <Route element={<RoleBasedRoute allowedRoles={['MANAGER']} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="team-leads" element={<ManagerLeads />} />
            <Route path="qcqa" element={<QualityControlCenter />} />
            <Route path="agents" element={<ManagerAgents />} />
            <Route path="invoices" element={<ManagerInvoices />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>
        </Route>

        {/* 4. CRM WORKSPACE LAYER - AGENT */}
        <Route element={<RoleBasedRoute allowedRoles={['AGENT']} />}>
          <Route path="/agent" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="leads" element={<AgentLeads />} />
            <Route path="dialer" element={<AgentDialer />} />
            <Route path="tasks" element={<AgentTasks />} />
            <Route path="feedback" element={<AgentFeedback />} />
            <Route path="inbox" element={<EmailInbox />} />
            <Route path="performance" element={<AgentPerformance />} />
          </Route>
        </Route>
        
        {/* 5. SHARED ACCOUNT LAYER (ALL ROLES) */}
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<PlatformProfile />} />
          <Route path="/security" element={<PlatformSecurity />} />
          <Route path="/help" element={<PlatformHelp />} />
        </Route>
      </Route>

      {/* Utilities */}
      <Route path="/unauthorized" element={<div className="h-screen flex items-center justify-center text-red-500 font-bold text-3xl">403 - Unauthorized Access</div>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
