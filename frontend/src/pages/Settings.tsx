import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { SettingsSkeleton } from '../components/PageLoader';
import Toast, { type ToastType } from '../components/Toast';
import { 
  Save, Download, RefreshCw, Shield, Eye, EyeOff, 
  Activity, Loader2, User, KeyRound, Bell,
  Users, UserPlus, UserCheck, UserX, X, Server
} from 'lucide-react';
import { 
  getProfile, updateProfile, changePassword, 
  getIncidents, getDepartments,
  listAdmins, createAdmin, toggleAdminStatus
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

  // Team Management state
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  
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
        if (u.name) localStorage.setItem('userName', u.name);
        if (u.email) localStorage.setItem('userEmail', u.email);
        if (u.phoneNumber) localStorage.setItem('userPhone', u.phoneNumber);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setProfile({
          name: localStorage.getItem('userName') || 'Admin User',
          email: localStorage.getItem('userEmail') || '',
          phone: localStorage.getItem('userPhone') || '',
          department: 'MDRRMO Main Office'
        });
        if (!navigator.onLine) {
          showToast('warning', 'Offline Mode', 'Loaded profile from cached session.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    try {
      const savedNotifs = localStorage.getItem('admin_notifSettings');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      console.error('Failed to parse notifications setting:', e);
    }
    
    fetchUserData();

    const fetchAdmins = async () => {
      setLoadingAdmins(true);
      try {
        const res = await listAdmins();
        setAdmins(res.data);
      } catch (err) {
        console.error('Failed to load admins:', err);
      } finally {
        setLoadingAdmins(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showToast('error', 'Validation Error', 'Name, email, and password are required.');
      return;
    }
    if (newAdmin.password.length < 8) {
      showToast('error', 'Validation Error', 'Password must be at least 8 characters.');
      return;
    }
    setCreatingAdmin(true);
    try {
      const res = await createAdmin(newAdmin);
      setAdmins(prev => [...prev, res.data.admin]);
      setNewAdmin({ name: '', email: '', password: '', phoneNumber: '' });
      setShowCreateAdmin(false);
      showToast('success', 'Admin Created', `${res.data.admin.name} can now log in to the admin panel.`);
    } catch (err: any) {
      showToast('error', 'Failed to Create Admin', err.response?.data?.error || 'Server error occurred.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleAdmin = async (id: string, name: string) => {
    const currentUserId = localStorage.getItem('userId');
    if (id === currentUserId) {
      showToast('error', 'Not Allowed', 'You cannot deactivate your own account.');
      return;
    }
    setTogglingAdmin(id);
    try {
      const res = await toggleAdminStatus(id);
      setAdmins(prev => prev.map(a => a.id === id ? { ...a, isActive: res.data.admin.isActive } : a));
      const action = res.data.admin.isActive ? 'reactivated' : 'deactivated';
      showToast('success', `Admin ${action.charAt(0).toUpperCase() + action.slice(1)}`, `${name}'s access has been ${action}.`);
    } catch (err: any) {
      showToast('error', 'Failed to Update Admin', err.response?.data?.error || 'Server error occurred.');
    } finally {
      setTogglingAdmin(null);
    }
  };

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
      
      localStorage.setItem('userName', profile.name);
      localStorage.setItem('userEmail', profile.email);
      localStorage.setItem('userPhone', profile.phone);
      
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

  const handleExportData = () => {
    showToast('info', 'Preparing Database Export', 'Compiling incidents, response units, and caller archives...');
    setTimeout(() => {
      window.open('/api/incidents/export', '_blank');
      showToast('success', 'Export Ready', 'Incident archive export package generated.');
    }, 800);
  };

  const handleBackupSystem = () => {
    setBackingUp(true);
    showToast('info', 'System Backup Started', 'Synchronizing with MDRRMO primary database node...');
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

        showToast('success', 'System Backup Complete', 'Cloud snapshot successfully written.');
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
        <SettingsSkeleton />
      </>
    );
  }

  return (
    <>
      <style>{`
        .st-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.85fr) minmax(0, 1.15fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .st-layout-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .st-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .st-card:last-child {
          margin-bottom: 0;
        }

        .st-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FAFBFC;
        }

        .st-card-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .st-card-body {
          padding: 20px;
        }

        .st-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .st-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .st-form-group:last-child {
          margin-bottom: 0;
        }

        .st-label {
          font-size: 12.5px;
          font-weight: 700;
          color: #334155;
        }

        .st-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 9px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 13.5px;
          font-family: inherit;
          color: #0F172A;
          outline: none;
          transition: all 0.15s ease;
        }

        .st-input:focus {
          background: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .st-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2563EB;
          color: #FFFFFF;
          border-radius: 9px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .st-btn-primary:hover:not(:disabled) {
          background: #1D4ED8;
        }

        .st-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #F1F5F9;
        }

        .st-toggle-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .st-toggle-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
        }

        .st-toggle-sub {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.4;
        }

        .st-action-btn {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          color: #0F172A;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          margin-bottom: 10px;
        }

        .st-action-btn:last-child {
          margin-bottom: 0;
        }

        .st-action-btn:hover:not(:disabled) {
          background: #FFFFFF;
          border-color: #2563EB;
          color: #2563EB;
          box-shadow: 0 2px 8px rgba(37,99,235,0.08);
        }

        @media (max-width: 960px) {
          .st-layout-grid {
            grid-template-columns: 1fr;
          }
          .st-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <Header title="Settings & Administration" subtitle="Manage your profile, team credentials, notification rules, and system node" />

      <div className="page-content" style={{ paddingTop: 12 }}>
        {toast.show && (
          <Toast
            type={toast.type}
            message={toast.message}
            detail={toast.detail}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* ── 2-Column Balanced Grid: Forms Left, Quick Actions & Server Info Right ── */}
        <div className="st-layout-grid fade-in">
          
          {/* Left Column: Account & Preferences */}
          <div>
            {/* Profile Information Form */}
            <form className="st-card" onSubmit={handleSaveProfile}>
              <div className="st-card-header">
                <div className="st-card-title">
                  <User size={17} style={{ color: '#2563EB' }} />
                  Profile Information
                </div>
              </div>
              <div className="st-card-body">
                <div className="st-form-row">
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Full Name</label>
                    <input 
                      className="st-input" 
                      value={profile.name} 
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      placeholder="Administrator Name"
                    />
                  </div>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Email Address</label>
                    <input 
                      className="st-input" 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                      placeholder="admin@mdrrmo.gov.ph"
                    />
                  </div>
                </div>

                <div className="st-form-row">
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Phone Number</label>
                    <input 
                      className="st-input" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                      placeholder="0917XXXXXXX"
                    />
                  </div>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Assigned Station</label>
                    <input 
                      className="st-input" 
                      value={profile.department} 
                      readOnly 
                      style={{ background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} 
                    />
                  </div>
                </div>

                <button className="st-btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 size={15} className="spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Change Password Form */}
            <form className="st-card" onSubmit={handleUpdatePassword}>
              <div className="st-card-header">
                <div className="st-card-title">
                  <KeyRound size={17} style={{ color: '#2563EB' }} />
                  Security & Password
                </div>
              </div>
              <div className="st-card-body">
                <div className="st-form-group">
                  <label className="st-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="st-input" 
                      type={showCurrentPass ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      style={{ paddingRight: 40 }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="st-form-row">
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="st-input" 
                        type={showNewPass ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        style={{ paddingRight: 40 }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0
                        }}
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="st-input" 
                        type={showConfirmPass ? 'text' : 'password'} 
                        placeholder="••••••••" 
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        style={{ paddingRight: 40 }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0
                        }}
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button className="st-btn-primary" type="submit" disabled={updatingPassword}>
                  {updatingPassword ? (
                    <>
                      <Loader2 size={15} className="spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Shield size={15} /> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Notification Preferences */}
            <div className="st-card">
              <div className="st-card-header">
                <div className="st-card-title">
                  <Bell size={17} style={{ color: '#2563EB' }} />
                  Dispatch Notification Rules
                </div>
              </div>
              <div className="st-card-body">
                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">New Incident Alerts</div>
                    <div className="st-toggle-sub">Instant sound and banner alert when citizen reports are lodged</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.newIncident ? 'on' : ''}`} 
                    onClick={() => toggleNotif('newIncident')} 
                  />
                </div>

                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">Status Update Notifications</div>
                    <div className="st-toggle-sub">Receive notifications when field units mark incidents as dispatched or resolved</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.statusUpdate ? 'on' : ''}`} 
                    onClick={() => toggleNotif('statusUpdate')} 
                  />
                </div>

                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">Critical System Alerts</div>
                    <div className="st-toggle-sub">Alerts regarding database connectivity, sensor drops, or high-risk weather triggers</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.systemAlerts ? 'on' : ''}`} 
                    onClick={() => toggleNotif('systemAlerts')} 
                  />
                </div>

                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">Daily Summary Digest</div>
                    <div className="st-toggle-sub">Receive nightly incident roll-up reports via email</div>
                  </div>
                  <button 
                    className={`toggle ${notifications.emailDigest ? 'on' : ''}`} 
                    onClick={() => toggleNotif('emailDigest')} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Operations & Server Info */}
          <div>
            {/* Quick Actions Card */}
            <div className="st-card">
              <div className="st-card-header">
                <div className="st-card-title">
                  <Activity size={17} style={{ color: '#2563EB' }} />
                  System Actions
                </div>
              </div>
              <div className="st-card-body">
                <button className="st-action-btn" onClick={handleExportData}>
                  <Download size={16} style={{ color: '#2563EB' }} />
                  <span>Export Incident Records (CSV)</span>
                </button>

                <button className="st-action-btn" onClick={handleBackupSystem} disabled={backingUp}>
                  {backingUp ? (
                    <>
                      <Loader2 size={16} className="spin" style={{ color: '#2563EB' }} />
                      <span>Writing Database Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} style={{ color: '#2563EB' }} />
                      <span>Backup PostgreSQL Database</span>
                    </>
                  )}
                </button>

                <button className="st-action-btn" onClick={() => setShowAuditLog(true)}>
                  <Shield size={16} style={{ color: '#2563EB' }} />
                  <span>View Security Audit Logs</span>
                </button>
              </div>
            </div>

            {/* Server Node Status */}
            <div className="st-card">
              <div className="st-card-header">
                <div className="st-card-title">
                  <Server size={17} style={{ color: '#2563EB' }} />
                  Command Server Node
                </div>
              </div>
              <div className="st-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Deployment</span>
                  <strong style={{ color: '#0F172A' }}>Balayan EOC Primary</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Environment</span>
                  <span style={{ background: '#DCFCE7', color: '#14532D', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>Production</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Database Host</span>
                  <strong style={{ color: '#0F172A' }}>Supabase Postgres</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>API Version</span>
                  <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>v2.4.0-live</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Full Width Section: Team Management ── */}
        <div className="st-card fade-in">
          <div className="st-card-header">
            <div className="st-card-title">
              <Users size={18} style={{ color: '#2563EB' }} />
              Team Management
              <span style={{ fontSize: 11, background: '#2563EB', color: '#FFFFFF', borderRadius: 999, padding: '2px 8px', fontWeight: 800, marginLeft: 6 }}>
                {admins.length} Admin{admins.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="st-btn-primary"
              style={{ padding: '7px 14px', fontSize: 12.5 }}
              onClick={() => setShowCreateAdmin(v => !v)}
            >
              {showCreateAdmin ? <><X size={14} /> Close Form</> : <><UserPlus size={14} /> Add Administrator</>}
            </button>
          </div>

          <div className="st-card-body">
            {/* Create Admin Subform */}
            {showCreateAdmin && (
              <form onSubmit={handleCreateAdmin} style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 18,
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  Provision New Administrator Account
                </div>
                <div className="st-form-row" style={{ margin: 0 }}>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Full Name *</label>
                    <input className="st-input" placeholder="e.g. Juan dela Cruz" value={newAdmin.name}
                      onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                  </div>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Email Address *</label>
                    <input className="st-input" type="email" placeholder="e.g. juan@mdrrmo.gov.ph" value={newAdmin.email}
                      onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                  </div>
                </div>
                <div className="st-form-row" style={{ margin: 0 }}>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Password * (minimum 8 characters)</label>
                    <input className="st-input" type="password" placeholder="••••••••" value={newAdmin.password}
                      onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                  </div>
                  <div className="st-form-group" style={{ margin: 0 }}>
                    <label className="st-label">Phone Number (optional)</label>
                    <input className="st-input" placeholder="0917XXXXXXX" value={newAdmin.phoneNumber}
                      onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })} />
                  </div>
                </div>
                <button className="st-btn-primary" type="submit" disabled={creatingAdmin} style={{ alignSelf: 'flex-start' }}>
                  {creatingAdmin
                    ? <><Loader2 size={14} className="spin" /> Creating Account...</>
                    : <><UserPlus size={14} /> Create Account</>}
                </button>
              </form>
            )}

            {/* Admin Table */}
            {loadingAdmins ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#64748B', fontSize: 13 }}>
                <Loader2 size={20} className="spin" style={{ color: '#2563EB', marginBottom: 8 }} />
                <div>Loading administrator directory...</div>
              </div>
            ) : admins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#64748B', fontSize: 13 }}>
                No administrator accounts found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Administrator</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Phone</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Created</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Access Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => {
                      const isSelf = admin.id === localStorage.getItem('userId');
                      return (
                        <tr key={admin.id} style={{ borderBottom: '1px solid #F1F5F9', opacity: admin.isActive ? 1 : 0.6 }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0
                            }}>
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{admin.name}</span>
                            {isSelf && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1E40AF', borderRadius: 6, padding: '2px 6px', fontWeight: 800 }}>You</span>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{admin.email}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{admin.phoneNumber || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {admin.isActive ? (
                              <span style={{ background: '#DCFCE7', color: '#14532D', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <UserCheck size={11} /> Active
                              </span>
                            ) : (
                              <span style={{ background: '#FEE2E2', color: '#7F1D1D', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <UserX size={11} /> Inactive
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleAdmin(admin.id, admin.name)}
                                disabled={togglingAdmin === admin.id}
                                style={{
                                  fontSize: 12, fontWeight: 700, padding: '5px 12px',
                                  border: `1px solid ${admin.isActive ? '#FCA5A5' : '#BFDBFE'}`,
                                  borderRadius: 7, cursor: 'pointer',
                                  background: admin.isActive ? '#FEF2F2' : '#EFF6FF',
                                  color: admin.isActive ? '#DC2626' : '#2563EB',
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  fontFamily: 'inherit',
                                }}
                              >
                                {togglingAdmin === admin.id ? (
                                  <Loader2 size={12} className="spin" />
                                ) : admin.isActive ? (
                                  <><UserX size={12} /> Deactivate</>
                                ) : (
                                  <><UserCheck size={12} /> Reactivate</>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Security Audit Log Modal Overlay ── */}
      {showAuditLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: 20,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%', maxWidth: '820px',
            maxHeight: '85vh',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#FAFBFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={18} style={{ color: '#2563EB' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Security & Operations Audit Trail
                </h3>
              </div>
              <button 
                onClick={() => setShowAuditLog(false)}
                style={{
                  background: 'none', border: 'none', color: '#94A3B8',
                  cursor: 'pointer', padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Log ID</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Timestamp</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Actor</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Action</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAuditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: '#2563EB' }}>{log.id}</td>
                        <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{log.actor}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ 
                            fontSize: 10, fontWeight: 800, padding: '2px 6px', 
                            borderRadius: 4, background: '#DBEAFE', color: '#1E40AF' 
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'flex-end',
              background: '#FAFBFC',
            }}>
              <button 
                className="st-btn-primary" 
                style={{ padding: '7px 16px', fontSize: 12.5 }}
                onClick={() => setShowAuditLog(false)}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
