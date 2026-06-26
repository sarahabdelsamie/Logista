import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Main pages
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SupplyRequestsPage from './pages/SupplyRequestsPage';
import ReportsPage from './pages/ReportsPage';

// Admin
import UserManagementPage from './pages/admin/UserManagementPage';

// Meals
import MealsPage from './pages/meals/MealsPage';
import AddMealPage from './pages/meals/AddMealPage';

// Planning
import PlanningOverviewPage from './pages/planning/PlanningOverviewPage';
import CreateDailyPlanPage from './pages/planning/CreateDailyPlanPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22C55E', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute><InventoryPage /></ProtectedRoute>
          } />

          <Route path="/meals" element={
            <ProtectedRoute><MealsPage /></ProtectedRoute>
          } />
          <Route path="/meals/add" element={
            <ProtectedRoute allowedRoles={['Admin', 'Mezz Manager', 'Kitchen Supervisor']}>
              <AddMealPage />
            </ProtectedRoute>
          } />
          <Route path="/meals/:id/edit" element={
            <ProtectedRoute allowedRoles={['Admin', 'Mezz Manager', 'Kitchen Supervisor']}>
              <AddMealPage />
            </ProtectedRoute>
          } />

          <Route path="/planning" element={
            <ProtectedRoute><PlanningOverviewPage /></ProtectedRoute>
          } />
          <Route path="/planning/create" element={
            <ProtectedRoute allowedRoles={['Admin', 'Mezz Manager']}>
              <CreateDailyPlanPage />
            </ProtectedRoute>
          } />
          <Route path="/planning/:id/edit" element={
            <ProtectedRoute allowedRoles={['Admin', 'Mezz Manager']}>
              <CreateDailyPlanPage />
            </ProtectedRoute>
          } />

          <Route path="/supply-requests" element={
            <ProtectedRoute><SupplyRequestsPage /></ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['Admin', 'Mezz Manager']}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-[#1B2A4A] mb-4">404</p>
                <p className="text-xl font-semibold text-[#64748B] mb-2">Page Not Found</p>
                <p className="text-sm text-[#94A3B8] mb-6">The page you are looking for does not exist.</p>
                <a href="/dashboard" className="btn-primary inline-flex">Go to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
