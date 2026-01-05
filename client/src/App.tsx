
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { getMe } from './store/slices/authSlice';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import { UserRole } from './types';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import Analytics from './pages/Analytics';
import Services from './pages/Services';
import Users from './pages/Users';
import QueueManagement from './pages/QueueManagement';
import AppointmentManagement from './pages/AppointmentManagement';

function AppContent() {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Verify token on app mount - only if we have token but no user
  useEffect(() => {
    if (token && isAuthenticated && !user) {
      dispatch(getMe()).catch(() => {
        // Token is invalid, user will be redirected by API interceptor
      });
    }
  }, [dispatch, token, isAuthenticated, user]);

  return (
    <>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - All authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <ProtectedRoute>
                <Queue />
              </ProtectedRoute>
            }
          />

          {/* Admin & Staff Routes */}
          <Route
            path="/queue/manage"
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.STAFF]}>
                <QueueManagement />
              </RoleGuard>
            }
          />
          <Route
            path="/appointments/manage"
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.STAFF]}>
                <AppointmentManagement />
              </RoleGuard>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/analytics"
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <Analytics />
              </RoleGuard>
            }
          />
          <Route
            path="/services"
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <Services />
              </RoleGuard>
            }
          />
          <Route
            path="/users"
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <Users />
              </RoleGuard>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
