import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Suspense, lazy } from 'react';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminEmployees = lazy(() => import('./pages/AdminEmployees'));
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Layout components
const Layout = lazy(() => import('./components/Layout'));

// Route Protectors
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<div className="loading-screen animate-pulse-glow">Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace /> : <Login />} />
        <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace /> : <ForgotPassword />} />
        <Route path="/reset-password/:token" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace /> : <ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* More Admin Routes */}
        <Route path="/admin/employees" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminEmployees />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/projects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminProjects />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employee" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employee/projects" element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Redirect root based on auth */}
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login'} replace />} />
        
        {/* 404 & Unauthorized */}
        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
