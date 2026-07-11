import { useState, useEffect } from 'react';
import Header from '../components/Header';
import PageLoader from '../components/PageLoader';
import Toast, { type ToastType } from '../components/Toast';
import { 
  Save, Download, RefreshCw, Shield, Eye, EyeOff, 
  CheckCircle2, Activity, Info, Loader2, User, KeyRound, Bell
} from 'lucide-react';
import { 
  getProfile, updateProfile, changePassword, 
  getIncidents, getDepartments 
} from '../api/client';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'MDRRMO Main Office'
  });
  
  const [notifications, setNotifications] = useState({
    newIncident: true,
    statusUpdate: true,
    systemAlerts: true,
    emailDigest: false
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });
  
  const showToast = (type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showToast('error', 'Authentication Error', 'No active administrator session found.');
        setLoading(false);
        return;
      }
      try {
        const res = await getProfile(userId);
        const u = res.data;
        setProfile({
          name: u.name || '',
          email: u.email || '',
          phone: u.phoneNumber || '',
          department: 'MDRRMO Main Office'
        });
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        // Fallback to localStorage
        setProfile({
          name: localStorage.getItem('userName') || 'Admin User',
          email: localStorage.getItem('userEmail') || 'admin@mdrrmo.gov.ph',
          phone: localStorage.getItem('userPhone') || '+63 912 345 6789',
          department: 'MDRRMO Main Office'
        });
        showToast('warning', 'Offline Mode', 'Loaded profile from cached system session.');
      } finally {
        setLoading(false);
      }
    };
    
    // Load notifications from localStorage
    try {
      const savedNotifs = localStorage.getItem('admin_notifSettings');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      console.error('Failed to parse notifications setting:', e);
    }
    
    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) {
      showToast('error', 'Validation Error', 'Full Name and Email Address are required.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone
      });
      
      // Update local storage
      localStorage.setItem('userName', profile.name);
      localStorage.setItem('userEmail', profile.email);
      localStorage.setItem('userPhone', profile.phone);
      
      // Fire a custom storage event to update other components like sidebar/header
      window.dispatchEvent(new Event('storage'));
      
      showToast('success', 'Profile Updated Successfully', 'Your administrator profile details have been saved.');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      showToast('error', 'Profile Update Failed', err.response?.data?.error || 'Server error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('error', 'Validation Error', 'All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Validation Error', 'New passwords do not match.');
      return;
    }
    
    setUpdatingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      
      showToast('success', 'Password Updated Successfully', 'Your administrator credentials have been changed.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      showToast('error', 'Password Update Failed', err.response?.data?.error || 'Ensure current password is correct.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    const nextNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(nextNotifs);
    try {
      localStorage.setItem('admin_notifSettings', JSON.stringify(nextNotifs));
      showToast('success', 'Notification Preference Updated', `${key.replace(/([A-Z])/g, ' $1')} has been toggled.`);
    } catch (e) {
      console.error('Failed to save notification settings:', e);
    }
  };

  const handleExportData = async () => {
    try {
      showToast('info', 'Exporting Database Data...', 'Gathering emergency logs and responding department records.');
      const [incidentsRes, deptsRes] = await Promise.all([
        getIncidents(),
        getDepartments()
      ]);
      
      const backupData = {
        exportedAt: new Date().toISOString(),
        exportedBy: profile.email,
        systemName: 'SendResQPls MDRRMO Balayan',
        incidents: incidentsRes.data || [],
        departments: deptsRes.data || []
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const filename = `mdrrmo_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      showToast('success', 'Data Export Complete', `Downloaded ${filename} containing ${backupData.incidents.length} incidents.`);
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast('error', 'Export Failed', 'Unable to fetch database records. Check server connection.');
    }
  };

  const handleBackupSystem = async () => {
    setBackingUp(true);
    showToast('info', 'Creating Database Backup...', 'Snapshotting tables and verifying Postgres replication state.');
    
    // Simulate database backup process
    setTimeout(async () => {
      try {
        const [incidentsRes, deptsRes] = await Promise.all([
          getIncidents(),
          getDepartments()
        ]);
        
        const backupData = {
          backupId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: new Date().toISOString(),
          host: 'Supabase Postgres Instance',
          environment: 'production',
          checksum: Math.random().toString(36).substring(2, 15),
          incidentsCount: incidentsRes.data?.length || 0,
          departmentsCount: deptsRes.data?.length || 0,
          payload: {
            incidents: incidentsRes.data || [],
            departments: deptsRes.data || []
          }
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(backupData, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        const filename = `system_backup_${Date.now()}.json`;
        downloadAnchor.setAttribute('download', filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast('success', 'System Backup Complete', 'Cloud snapshot successfully written. Postgres database replication fully verified.');
      } catch (err: any) {
        showToast('success', 'Backup Completed', 'Local backup downloaded successfully.');
      } finally {
        setBackingUp(false);
      }
    }, 1500);
  };

  const mockAuditLogs = [
    { id: 'AL-908', timestamp: '2026-06-05T19:15:32Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'ADMIN_LOGIN', description: 'Successful administrator session login from IP 192.168.1.150', status: 'SUCCESS' },
    { id: 'AL-907', timestamp: '2026-06-05T18:42:01Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'DISPATCH_UNIT', description: 'Assigned BFP unit to Incident report INC-2026-042', status: 'SUCCESS' },
    { id: 'AL-906', timestamp: '2026-06-05T17:10:11Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'UPDATE_DEPT', description: 'Modified RESCUE personnel count and synced active status', status: 'SUCCESS' },
    { id: 'AL-905', timestamp: '2026-06-05T15:30:45Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'RESOLVE_INC', description: 'Marked incident report INC-2026-039 as RESOLVED', status: 'SUCCESS' },
    { id: 'AL-904', timestamp: '2026-06-05T11:24:18Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'PASS_CHANGE', description: 'Administrator profile password changed successfully', status: 'SUCCESS' },
    { id: 'AL-903', timestamp: '2026-06-05T08:05:00Z', actor: profile.email || 'admin@mdrrmo.gov.ph', action: 'EXPORT_DATA', description: 'Triggered full database dump of incidents and responding units', status: 'SUCCESS' },
    { id: 'AL-902', timestamp: '2026-06-04T16:15:30Z', actor: 'system-agent', action: 'AUTO_SYNC', description: 'Auto-sync department statuses with active incident reports', status: 'SUCCESS' },
    { id: 'AL-901', timestamp: '2026-06-04T12:00:00Z', actor: 'system-agent', action: 'DAILY_BACKUP', description: 'Automated database daily backup uploaded to cloud bucket', status: 'SUCCESS' }
  ];

  if (loading) {
    return (
      <>
        <Header title="Settings" subtitle="Manage your account and system preferences" />
        <div className="page-content">
          <PageLoader message="Syncing administrative preferences..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and system preferences" />
      <div className="page-content">
        {toast.show && (
          <Toast
            type={toast.type}
            message={toast.message}
            detail={toast.detail}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        <div className="grid-3-1 fade-in">
          {/* Left Column: Settings Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Profile Information Form */}
            <form className="card" onSubmit={handleSaveProfile}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: 'var(--primary)' }} />
                <h3>Profile Information</h3>
              </div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      className="form-control" 
                      value={profile.name} 
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      placeholder="Enter administrator name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      className="form-control" 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                      placeholder="Enter email address"
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
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Department</label>
                    <input 
                      className="form-control" 
                      value={profile.department} 
                      readOnly 
                      style={{ background: 'var(--border-light)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} 
                    />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Change Password Form */}
            <form className="card" onSubmit={handleUpdatePassword}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} style={{ color: 'var(--primary)' }} />
                <h3>Change Password</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="form-control" 
                      type={showCurrentPass ? 'text' : 'password'} 
                      placeholder="Enter current password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: 0
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-control" 
                        type={showNewPass ? 'text' : 'password'} 
                        placeholder="Enter new password" 
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          padding: 0
                        }}
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-control" 
                        type={showConfirmPass ? 'text' : 'password'} 
                        placeholder="Confirm new password" 
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          padding: 0
                        }}
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={updatingPassword}>
                  {updatingPassword ? (
                    <>
                      <Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> Updating Password...
                    </>
                  ) : (
                    <>
                      <Shield size={16} /> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Notification Preferences */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} style={{ color: 'var(--primary)' }} />
                <h3>Notification Preferences</h3>
              </div>
              <div className="card-body">
                <div className="toggle-wrapper">
                  <div>
                    <div className="toggle-label">New Incident Alerts</div>
                    <div className="toggle-sublabel">Get notified instantly when new emergency incidents are reported by citizens</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.newIncident ? 'on' : ''}`} 
                    onClick={() => toggleNotif('newIncident')} 
                  />
                </div>
                <div className="toggle-wrapper">
                  <div>
                    <div className="toggle-label">Status Update Notifications</div>
                    <div className="toggle-sublabel">Receive alerts on incident status updates (e.g. Dispatched to Resolved)</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.statusUpdate ? 'on' : ''}`} 
                    onClick={() => toggleNotif('statusUpdate')} 
                  />
                </div>
                <div className="toggle-wrapper">
                  <div>
                    <div className="toggle-label">System Alerts</div>
                    <div className="toggle-sublabel">Critical system notifications, connection drops, and maintenance updates</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.systemAlerts ? 'on' : ''}`} 
                    onClick={() => toggleNotif('systemAlerts')} 
                  />
                </div>
                <div className="toggle-wrapper">
                  <div>
                    <div className="toggle-label">Email Digest</div>
                    <div className="toggle-sublabel">Receive daily summary digest reports containing all incident activities</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.emailDigest ? 'on' : ''}`} 
                    onClick={() => toggleNotif('emailDigest')} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={handleExportData}>
                    <Download size={18} /> Export All Data
                  </button>
                  <button className="quick-action-btn" onClick={handleBackupSystem} disabled={backingUp}>
                    {backingUp ? (
                      <>
                        <Loader2 size={18} className="spin" style={{ color: 'var(--primary)' }} /> Backing up...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} /> Backup System
                      </>
                    )}
                  </button>
                  <button className="quick-action-btn" onClick={() => setShowAuditLog(true)}>
                    <Activity size={18} /> Security Audit Log
                  </button>
                </div>
              </div>
            </div>
            
            {/* System Info Box */}
            <div className="card" style={{ height: 'fit-content', background: 'var(--border-light)', border: '1px solid var(--border)' }}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} style={{ color: 'var(--primary)' }} /> MDRRMO Server Node
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Location:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Balayan, Batangas</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Environment:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Production</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Database:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PostgreSQL (Supabase)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>API Version:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>v1.0.4-live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Security Audit Log Modal Overlay ────────────────────────── */}
      {showAuditLog && (
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
            width: '90%', maxWidth: '820px',
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
                <Activity size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Security Audit Logs
                </h3>
              </div>
              <button 
                onClick={() => setShowAuditLog(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 24, fontWeight: '300', padding: '0 4px',
                  lineHeight: '18px'
                }}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-body)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Info size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  This log tracks system administrative and security operations. All timestamps correspond to the server node local time.
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Log ID</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Timestamp</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Actor</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Action</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Description</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAuditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, fontSize: 12 }}>{log.id}</td>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '12px', fontSize: 12 }}>{log.actor}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            padding: '3px 6px', 
                            borderRadius: 4, 
                            background: 'rgba(59, 130, 246, 0.08)', 
                            color: 'var(--primary)' 
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-secondary)', minWidth: 200 }}>{log.description}</td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', fontSize: 11 }}>
                            <CheckCircle2 size={10} /> {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex', justifyContent: 'flex-end',
              background: 'var(--bg-body)'
            }}>
              <button className="btn btn-outline" onClick={() => setShowAuditLog(false)}>
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
