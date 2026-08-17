import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetails from './pages/RequestDetails';
import CallLogs from './pages/CallLogs';
import Analytics from './pages/Analytics';
import Departments from './pages/Departments';
import SettingsPage from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
// Mobile screens
import MobileLogin from './pages/mobile/MobileLogin';
import MobileSignup from './pages/mobile/MobileSignup';
import MobileHome from './pages/mobile/MobileHome';
import MobileReport from './pages/mobile/MobileReport';
import MobileHistory from './pages/mobile/MobileHistory';
import MobileProfile from './pages/mobile/MobileProfile';
import MobileNotifications from './pages/mobile/MobileNotifications';
import MobileOnboarding, { shouldShowOnboarding } from './pages/mobile/MobileOnboarding';
import MobileForgotPassword from './pages/mobile/MobileForgotPassword';
import MobileResetPassword from './pages/mobile/MobileResetPassword';
import { MobileToastProvider } from './components/MobileToastProvider';
import LandingPage from './pages/LandingPage';
import { useState } from 'react';
import './App.css';

// ── Mobile auth guard: redirects to /mobile/login if no token ───────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/mobile/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}



// ── Admin auth guard: must have token AND ADMIN role ────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const location = useLocation();

  if (!token || role !== 'ADMIN') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// ── Onboarding wrapper: shows intro slides once, then requires auth ──────────
function MobileHomeWithOnboarding() {
  const [done, setDone] = useState(!shouldShowOnboarding());
  if (!done) return <MobileOnboarding onDone={() => setDone(true)} />;
  return (
    <PrivateRoute>
      <MobileHome />
    </PrivateRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === PUBLIC LANDING PAGE === */}
        <Route path="/" element={<LandingPage />} />

        {/* === ADMIN LOGIN (public) === */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* === PUBLIC MOBILE ROUTES === */}
        {/* MobileToastProvider wraps ALL mobile routes so toast context is available everywhere */}
        <Route path="/mobile/login" element={<MobileToastProvider><MobileLogin /></MobileToastProvider>} />
        <Route path="/mobile/signup" element={<MobileToastProvider><MobileSignup /></MobileToastProvider>} />
        <Route path="/mobile/forgot-password" element={<MobileForgotPassword />} />
        <Route path="/mobile/reset-password" element={<MobileResetPassword />} />

        {/* === PROTECTED MOBILE ROUTES (require login) === */}
        <Route path="/mobile" element={<MobileToastProvider><MobileHomeWithOnboarding /></MobileToastProvider>} />
        <Route path="/mobile/report" element={<MobileToastProvider><PrivateRoute><MobileReport /></PrivateRoute></MobileToastProvider>} />
        <Route path="/mobile/history" element={<MobileToastProvider><PrivateRoute><MobileHistory /></PrivateRoute></MobileToastProvider>} />
        <Route path="/mobile/profile" element={<MobileToastProvider><PrivateRoute><MobileProfile /></PrivateRoute></MobileToastProvider>} />
        <Route path="/mobile/notifications" element={<MobileToastProvider><PrivateRoute><MobileNotifications /></PrivateRoute></MobileToastProvider>} />

        {/* === PROTECTED ADMIN ROUTES (require ADMIN role) === */}
        <Route
          path="*"
          element={
            <AdminRoute>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/requests/:id" element={<RequestDetails />} />
                    <Route path="/call-logs" element={<CallLogs />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Fallback inside admin: go to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
