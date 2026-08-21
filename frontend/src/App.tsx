import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import FcmBannerOverlay from './components/FcmBannerOverlay';
import { AdminNavProvider } from './context/AdminNavContext';
import LandingPage from './pages/LandingPage';
import GetTheApp from './pages/GetTheApp';
import ErrorBoundary from './components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { registerPushNavigate, unregisterPushNavigate, consumePendingRoute } from './utils/pushNotificationHelper';
import './App.css';

/**
 * RouterAwareNotificationSetup — mounts inside BrowserRouter so it has access
 * to useNavigate(). Registers the navigate function with the push helper so
 * that notification taps use in-app routing (no page reload). Also consumes any
 * pending route stored during a cold-start tap before React Router was ready.
 */
function RouterAwareNotificationSetup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Register navigate so pushRoute() can call it
    registerPushNavigate(navigate);

    // Consume any pending route from a cold-start notification tap
    const pending = consumePendingRoute();
    if (pending) {
      navigate(pending, { replace: true });
    }

    return () => {
      unregisterPushNavigate();
    };
  }, [navigate]);

  return null;
}


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

// ── Automatically scroll to top on route change ──────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  // Silently wake up the backend on initial app load if sleeping
  useEffect(() => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/health';
      fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
    } catch {
      // Ignore background warmup errors
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* === PUBLIC LANDING PAGE & GET APP === */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/get-the-app" element={<GetTheApp />} />

          {/* === ADMIN LOGIN (public) === */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* === ALL MOBILE ROUTES — single shared MobileToastProvider ===
               One provider wraps every mobile page so the floating banner
               stays alive across route changes. FcmBannerOverlay bridges
               FCM foreground events → toast queue. RouterAwareNotificationSetup
               registers the React Router navigate fn so push taps don't
               cause a full page reload. */}
          <Route
            path="/mobile/*"
            element={
              <MobileToastProvider>
                {/* Event bridge: FCM → toast queue. Renders nothing. */}
                <FcmBannerOverlay />
                {/* Push tap navigation bridge. Renders nothing. */}
                <RouterAwareNotificationSetup />
                <Routes>
                  {/* Public mobile */}
                  <Route path="login" element={<MobileLogin />} />
                  <Route path="signup" element={<MobileSignup />} />
                  <Route path="forgot-password" element={<MobileForgotPassword />} />
                  <Route path="reset-password" element={<MobileResetPassword />} />
                  {/* Protected mobile */}
                  <Route path="" element={<MobileHomeWithOnboarding />} />
                  <Route path="report" element={<PrivateRoute><MobileReport /></PrivateRoute>} />
                  <Route path="history" element={<PrivateRoute><MobileHistory /></PrivateRoute>} />
                  <Route path="profile" element={<PrivateRoute><MobileProfile /></PrivateRoute>} />
                  <Route path="notifications" element={<PrivateRoute><MobileNotifications /></PrivateRoute>} />
                </Routes>
              </MobileToastProvider>
            }
          />

          {/* === PROTECTED ADMIN ROUTES (require ADMIN role) === */}
          <Route
            path="*"
            element={
              <AdminRoute>
                <AdminNavProvider>
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
                </AdminNavProvider>
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
