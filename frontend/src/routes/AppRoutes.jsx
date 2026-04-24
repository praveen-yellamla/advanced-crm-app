import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleBasedRoute from '../components/common/RoleBasedRoute';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import TeamManagement from '../pages/admin/TeamManagement';
import AgentManagement from '../pages/admin/AgentManagement';
// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
// Agent Pages
import AgentDashboard from '../pages/agent/AgentDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* Admin Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<TeamManagement />} />
            <Route path="leads" element={<div className="font-bold text-2xl">Organization Leads (Kanban View)</div>} />
            <Route path="managers" element={<div className="font-bold text-2xl">Manager Oversight Portal</div>} />
            <Route path="agents" element={<AgentManagement />} />
            <Route path="analytics" element={<div className="font-bold text-2xl">Global Enterprise Analytics</div>} />
            <Route path="calling" element={<div className="font-bold text-2xl">Global Calling Center</div>} />
            <Route path="invoices" element={<div className="font-bold text-2xl">Financial Invoicing System</div>} />
            <Route path="qc" element={<div className="font-bold text-2xl">Quality Assurance (QA / QC)</div>} />
            <Route path="audit" element={<div className="font-bold text-2xl">System Audit & Security Logs</div>} />
            <Route path="settings" element={<div className="font-bold text-2xl">Global System Settings</div>} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['MANAGER']} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="analytics" element={<div className="font-bold text-2xl">Team Analytics (Coming Soon)</div>} />
            <Route path="qc" element={<div className="font-bold text-2xl">QC / QA Portal (Coming Soon)</div>} />
            <Route path="recordings" element={<div className="font-bold text-2xl">Call Recordings (Coming Soon)</div>} />
            <Route path="team-leads" element={<div className="font-bold text-2xl">Team Leads (Coming Soon)</div>} />
          </Route>
        </Route>

        {/* Agent Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['AGENT']} />}>
          <Route path="/agent" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="leads" element={<div className="font-bold text-2xl">My Leads Portal (Coming Soon)</div>} />
            <Route path="calling" element={<div className="font-bold text-2xl">IP Calling Interface (Coming Soon)</div>} />
            <Route path="history" element={<div className="font-bold text-2xl">Call History (Coming Soon)</div>} />
            <Route path="feedback" element={<div className="font-bold text-2xl">Manager Feedback (Coming Soon)</div>} />
          </Route>
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
