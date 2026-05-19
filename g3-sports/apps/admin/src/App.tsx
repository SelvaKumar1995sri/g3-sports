import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardPage from '@/pages/DashboardPage';
import TournamentsPage from '@/pages/TournamentsPage';
import UsersPage from '@/pages/UsersPage';
import LiveMatchPage from '@/pages/LiveMatchPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="live" element={<LiveMatchPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
