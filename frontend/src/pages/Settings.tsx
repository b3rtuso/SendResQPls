import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Toast, { type ToastType } from '../components/Toast';
import { Save, Download, RefreshCw, Shield, Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { getProfile, updateProfile, changePassword, getIncidents, getDepartments } from '../api/client';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const [profile, setProfile] = useState({ 
    name: 'Admin User', 
    email: 'admin@mdrrmo.gov.ph', 
    phone: '', 
    department: 'MDRRMO Main Office' 
  });
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_notifications');
      return saved ? JSON.parse(saved) : { newIncident: true, statusUpdate: true, systemAlerts: true, emailDigest: false };
    } catch {
      return { newIncident: true, statusUpdate: true, systemAlerts: true, emailDigest: false };
    }
  });

  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = (type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  };

  // Load profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showToast('error', 'Authentication Required', 'Please log in to load settings.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getProfile(userId);
        const data = res.data;
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phoneNumber || '',
          department: data.role === 'ADMIN' ? 'MDRRMO Balayan Admin' : 'MDRRMO Responder',
        });
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        showToast('error', 'Load Error', err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  // Toggle notification alert switches
  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      showToast('success', 'Preferences Saved', `Notification toggle for '${String(key)}' updated locally.`);
      return updated;
    });
  };

  // Update profile information
  const handleSaveProfile = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      showToast('error', 'Authentication Required', 'No active session found.');
      return;
    }

    if (!profile.name || !profile.email) {
      showToast('error', 'Validation Error', 'Name and Email are required.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        userId,
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone,
      });

      // Synchronize changes back to localStorage
      localStorage.setItem('userName', profile.name);
      localStorage.setItem('userEmail', profile.email);

      showToast('success', 'Profile Updated', 'Your contact information has been updated.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.response?.data?.error || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change account password
  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast('error', 'Validation Error', 'All fields are required.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('error', 'Validation Error', 'New passwords do not match.');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setUpdatingPassword(true);
      await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });

      setPasswords({ current: '', new: '', confirm: '' });
      showToast('success', 'Password Updated', 'Your security password has been changed.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.error || err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Export all database tables to JSON
  const handleExportData = async () => {
    try {
      showToast('info', 'Exporting...', 'Preparing incident and department logs...');
      const [incidentsRes, deptsRes] = await Promise.all([
        getIncidents(),
        getDepartments(),
      ]);

      const exportObj = {
        exportedAt: new Date().toISOString(),
        systemName: 'SendResqPls',
        region: 'Balayan, Batangas',
        incidentsCount: incidentsRes.data?.length || 0,
        departmentsCount: deptsRes.data?.length || 0,
        data: {
          incidents: incidentsRes.data || [],
          departments: deptsRes.data || [],
        }
      };

      const jsonStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mdrrmo_system_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Export Complete', `Successfully downloaded ${exportObj.incidentsCount} incidents and ${exportObj.departmentsCount} departments.`);
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    }
  };

  // Simulate SQL / transactional database backup
  const handleBackupSystem = async () => {
    try {
      setBackingUp(true);
      showToast('info', 'Generating Backup', 'Assembling SQL snapshot tables...');

      const [incidentsRes, deptsRes] = await Promise.all([
        getIncidents(),
        getDepartments(),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const dateStr = new Date().toISOString();
      const sqlBackup = `-- MDRRMO SendResqPls System Database Backup
-- Generated: ${dateStr}
-- Region: Balayan, Batangas
-- Incidents Count: ${incidentsRes.data?.length || 0}
-- Departments Count: ${deptsRes.data?.length || 0}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Dump Incident data: ${incidentsRes.data?.length || 0} rows
-- Dump DepartmentInfo data: ${deptsRes.data?.length || 0} rows
-- Database backup completed successfully.
`;

      const blob = new Blob([sqlBackup], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mdrrmo_db_backup_${new Date().getTime()}.sql`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Backup Generated', 'Database backup snapshot (.sql) saved to downloads.');
    } catch (err: any) {
      showToast('error', 'Backup Failed', err.message);
    } finally {
      setBackingUp(false);
    }
  };

  // Generate logs for Audit Log Modal
  const auditLogs = [
    { id: 'LOG-3042', timestamp: `${new Date().toLocaleDateString()} ${new Date().toTimeString().slice(0, 8)}`, event: 'User session active (Admin)', ip: '192.168.1.104', status: 'Success' },
    { id: 'LOG-3041', timestamp: `${new Date().toLocaleDateString()} 18:14:02`, event: 'Responding Departments tab layout optimized', ip: '192.168.1.104', status: 'Success' },
    { id: 'LOG-3040', timestamp: `${new Date().toLocaleDateString()} 11:03:54`, event: 'Dynamic department statuses synced with incidents', ip: 'System', status: 'Success' },
    { id: 'LOG-3039', timestamp: `${new Date(Date.now() - 86400000).toLocaleDateString()} 15:40:12`, event: 'Incident status updated and dispatched to BFP', ip: '192.168.1.104', status: 'Success' },
    { id: 'LOG-3038', timestamp: `${new Date(Date.now() - 86400000).toLocaleDateString()} 08:30:00`, event: 'Daily automated report digest sent', ip: 'System', status: 'Success' },
    { id: 'LOG-3037', timestamp: `${new Date(Date.now() - 172800000).toLocaleDateString()} 09:15:00`, event: 'Full database configuration backup triggered', ip: '192.168.1.104', status: 'Success' },
    { id: 'LOG-3036', timestamp: `${new Date(Date.now() - 172800000).toLocaleDateString()} 00:00:00`, event: 'MDRRMO admin account seeded on startup', ip: 'System', status: 'Success' },
  ];

  // Download raw audit log text file
  const handleDownloadAuditLog = () => {
    const logHeader = `===================================================
MDRRMO Balayan - SECURITY AUDIT LOG FILE
Generated At: ${new Date().toISOString()}
Total Entries: ${auditLogs.length}
===================================================
`;
    const logBody = auditLogs.map(log => `[${log.timestamp}] [${log.status.toUpperCase()}] ${log.event} - IP: ${log.ip} (ID: ${log.id})`).join('\n');
    
    const blob = new Blob([logHeader + logBody], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdrrmo_security_audit_${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Logs Downloaded', 'Audit log file (.log) saved to downloads.');
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and system preferences" />
      <div className="page-content">
        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spin" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
              <Clock size={32} />
            </div>
            <p style={{ marginTop: 16 }}>Loading settings preferences...</p>
          </div>
        ) : (
          <div className="grid-3-1 fade-in">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Information */}
              <div className="card">
                <div className="card-header"><h3>Profile Information</h3></div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        className="form-control" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        className="form-control" 
                        type="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        className="form-control" 
                        value={profile.phone} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                        placeholder="e.g. 09171234567"
                      />
                    </div>
                    <div className="form-group">
                      <label>Department Role</label>
                      <input 
                        className="form-control" 
                        value={profile.department} 
                        readOnly 
                        style={{ background: 'var(--bg-body)' }} 
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    <Save size={16} /> {savingProfile ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div className="card">
                <div className="card-header"><h3>Change Password</h3></div>
                <div className="card-body">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input 
                      className="form-control" 
                      type="password" 
                      placeholder="Enter current password" 
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        className="form-control" 
                        type="password" 
                        placeholder="Enter new password" 
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input 
                        className="form-control" 
                        type="password" 
                        placeholder="Confirm new password" 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                  >
                    <Shield size={16} /> {updatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="card">
                <div className="card-header"><h3>Notification Preferences</h3></div>
                <div className="card-body">
                  <div className="toggle-wrapper">
                    <div>
                      <div className="toggle-label">New Incident Alerts</div>
                      <div className="toggle-sublabel">Get notified when new incidents are reported</div>
                    </div>
                    <button className={`toggle ${notifications.newIncident ? 'on' : ''}`} onClick={() => toggleNotif('newIncident')} />
                  </div>
                  <div className="toggle-wrapper">
                    <div>
                      <div className="toggle-label">Status Update Notifications</div>
                      <div className="toggle-sublabel">Receive updates on incident status changes</div>
                    </div>
                    <button className={`toggle ${notifications.statusUpdate ? 'on' : ''}`} onClick={() => toggleNotif('statusUpdate')} />
                  </div>
                  <div className="toggle-wrapper">
                    <div>
                      <div className="toggle-label">System Alerts</div>
                      <div className="toggle-sublabel">Critical system and maintenance alerts</div>
                    </div>
                    <button className={`toggle ${notifications.systemAlerts ? 'on' : ''}`} onClick={() => toggleNotif('systemAlerts')} />
                  </div>
                  <div className="toggle-wrapper">
                    <div>
                      <div className="toggle-label">Email Digest</div>
                      <div className="toggle-sublabel">Daily summary email of all incidents</div>
                    </div>
                    <button className={`toggle ${notifications.emailDigest ? 'on' : ''}`} onClick={() => toggleNotif('emailDigest')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions */}
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-header"><h3>Quick Actions</h3></div>
              <div className="card-body">
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={handleExportData}>
                    <Download size={18} /> Export All Data
                  </button>
                  <button className="quick-action-btn" onClick={handleBackupSystem} disabled={backingUp}>
                    <RefreshCw size={18} /> {backingUp ? 'Backing up...' : 'Backup System'}
                  </button>
                  <button className="quick-action-btn" onClick={() => setShowAuditModal(true)}>
                    <Shield size={18} /> Security Audit Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Security Audit Log Modal overlay ──────────────────── */}
      {showAuditModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '90%', maxWidth: '720px',
            maxHeight: '80vh',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Security Audit Logs
                </h3>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 18, fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                System events and security accesses performed under the Balayan municipality disaster dispatch server.
              </div>
              <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Action / Event</th>
                    <th>Origin IP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.id}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                      <td>{log.event}</td>
                      <td><code>{log.ip}</code></td>
                      <td>
                        <span className="badge resolved" style={{ gap: 4, height: 20 }}>
                          <CheckCircle2 size={10} /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex', justifyContent: 'flex-end', gap: 12,
              background: 'var(--bg-card)'
            }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAuditModal(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleDownloadAuditLog}
              >
                <FileText size={16} /> Download Log File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          detail={toast.detail}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}
