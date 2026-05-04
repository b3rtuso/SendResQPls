import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetails from './pages/RequestDetails';
import CallLogs from './pages/CallLogs';
import Analytics from './pages/Analytics';
import Departments from './pages/Departments';
import SettingsPage from './pages/Settings';
// Mobile screens
import MobileLogin from './pages/mobile/MobileLogin';
import MobileSignup from './pages/mobile/MobileSignup';
import MobileHome from './pages/mobile/MobileHome';
import MobileReport from './pages/mobile/MobileReport';
import MobileHistory from './pages/mobile/MobileHistory';
import MobileProfile from './pages/mobile/MobileProfile';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === MOBILE ROUTES (no sidebar) === */}
        <Route path="/mobile/login" element={<MobileLogin />} />
        <Route path="/mobile/signup" element={<MobileSignup />} />
        <Route path="/mobile" element={<MobileHome />} />
        <Route path="/mobile/report" element={<MobileReport />} />
        <Route path="/mobile/history" element={<MobileHistory />} />
        <Route path="/mobile/profile" element={<MobileProfile />} />

        {/* === DESKTOP ADMIN ROUTES (with sidebar) === */}
        <Route
          path="*"
          element={
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/requests/:id" element={<RequestDetails />} />
                  <Route path="/call-logs" element={<CallLogs />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
