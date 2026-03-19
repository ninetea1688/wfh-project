import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LoginPage from "@/pages/login/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CheckinPage from "@/pages/checkin/CheckinPage";
import HistoryPage from "@/pages/history/HistoryPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminDepartmentsPage from "@/pages/admin/AdminDepartmentsPage";
import AdminPlanCalendarPage from "@/pages/admin/AdminPlanCalendarPage";
import AdminResultsCalendarPage from "@/pages/admin/AdminResultsCalendarPage";
import WeeklyPlanPage from "@/pages/plan/WeeklyPlanPage";
export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Staff routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <CheckinPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <WeeklyPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/plan-calendar"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminPlanCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/results-calendar"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminResultsCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Admin root redirect */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
