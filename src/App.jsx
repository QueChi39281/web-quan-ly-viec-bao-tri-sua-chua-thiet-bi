// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 1. Auth Page
import LoginPage from "./features/login/LoginPage";

// 2. Role User Page
import DeviceReportPage from "./features/mobile-user/pages/DeviceReportPage";

// 3. Role Technician Pages
import TechnicianDashboardPage from "./features/mobile-user/pages/TechnicianDashboardPage";
import DeviceDetailPage from "./features/mobile-user/pages/DeviceDetailPage";

// 4. Role Admin & Manager Pages
import AcceptancePage from "./features/acceptance/AcceptancePage";
import AssetListPage from "./features/assets/AssetListPage"; // Dùng cho /admin/devices
import MaintenancePlanPage from "./features/schedule/MaintenancePlanPage";
import SchedulePage from "./features/schedule/SchedulePage";
import TechnicianRequestsPage from "./features/tickets/TechnicianRequestsPage";
import TicketListPage from "./features/tickets/TicketListPage";
import UserRequestsPage from "./features/tickets/UserRequestsPage";
import DashboardPage from "./features/dashboard/DashboardPage";

// Import thêm các trang tương ứng với Menu Quản trị mới
import UserManagementPage from "./features/admin/UserManagementPage"; // Quản lý tài khoản
import SupplyManagementPage from "./features/admin/SupplyManagementPage"; // Quản lý vật tư
import DeviceLogsPage from "./features/admin/DeviceTrackingPage"; // Sổ theo dõi thiết bị
import ImportDataPage from "./features/admin/ImportDataPage"; // Import file dữ liệu

/**
 * Hàm chuẩn hóa Role & lấy Route mặc định
 */
export const getDefaultRouteByRole = (role) => {
  if (!role) return '/device-report';
  
  const normalizedRole = role.toString().toUpperCase().replace('ROLE_', '');

  switch (normalizedRole) {
    case 'ADMIN':
      return '/admin/tickets';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'MAINTENANCE_STAFF':
    case 'TECHNICIAN':
    case 'TECH':
      return '/technician-dashboard';
    case 'USER':
    default:
      return '/device-report';
  }
};

/**
 * Component bọc bảo vệ Route theo Token & Role
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedRole = role ? role.toString().toUpperCase().replace('ROLE_', '') : '';
    if (!allowedRoles.includes(normalizedRole)) {
      return <Navigate to={getDefaultRouteByRole(role)} replace />;
    }
  }

  return children;
};

export default function AppRoutes() {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');
  const isAuthenticated = Boolean(token);

  const defaultPath = getDefaultRouteByRole(role);

  return (
    <Routes>
      {/* ---------------- TRANG ĐĂNG NHẬP ---------------- */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={defaultPath} replace /> : <LoginPage />
        }
      />

      {/* ---------------- 1. ROLE USER ---------------- */}
      <Route
        path="/device-report"
        element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'MANAGER']}>
            <DeviceReportPage />
          </ProtectedRoute>
        }
      />

      {/* ---------------- 2. ROLE TECHNICIAN ---------------- */}
      <Route
        path="/technician-dashboard"
        element={
          <ProtectedRoute allowedRoles={['TECHNICIAN', 'MAINTENANCE_STAFF', 'ADMIN', 'MANAGER']}>
            <TechnicianDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/device-detail/:deviceId"
        element={
          <ProtectedRoute allowedRoles={['TECHNICIAN', 'MAINTENANCE_STAFF', 'ADMIN', 'MANAGER']}>
            <DeviceDetailPage />
          </ProtectedRoute>
        }
      />

      {/* ---------------- 3. ROLE MANAGER ---------------- */}
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/import"
        element={
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <ImportDataPage />
          </ProtectedRoute>
        }
      />

      {/* ---------------- 4. ROLE ADMIN & MANAGER (QUẢN TRỊ & NGHỆM THU) ---------------- */}
      <Route
        path="/admin/acceptance"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <AcceptancePage />
          </ProtectedRoute>
        }
      />

      {/* Quản lý danh mục trong Quản trị */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/supplies"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <SupplyManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/devices"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <AssetListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/device-logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <DeviceLogsPage />
          </ProtectedRoute>
        }
      />

      {/* Kế hoạch & Yêu cầu */}
      <Route
        path="/admin/assets"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <AssetListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/maintenance-plans"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <MaintenancePlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <SchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/technician-requests"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <TechnicianRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <TicketListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/user-requests"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <UserRequestsPage />
          </ProtectedRoute>
        }
      />

      {/* ---------------- ĐIỀU HƯỚNG MẶC ĐỊNH ---------------- */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? defaultPath : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? defaultPath : "/login"} replace />}
      />
    </Routes>
  );
}