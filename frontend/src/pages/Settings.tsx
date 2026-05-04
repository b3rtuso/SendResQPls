import { useState } from 'react';
import Header from '../components/Header';
import { Save, Download, RefreshCw, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: 'Admin User', email: 'admin@mdrrmo.gov.ph', phone: '+63 912 345 6789', department: 'MDRRMO Main Office' });
  const [notifications, setNotifications] = useState({ newIncident: true, statusUpdate: true, systemAlerts: true, emailDigest: false });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and system preferences" />
      <div className="page-content">
        <div className="grid-3-1 fade-in">
          {/* Left: Profile Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3>Profile Information</h3></div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input className="form-control" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="form-control" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input className="form-control" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input className="form-control" value={profile.department} readOnly style={{ background: 'var(--bg-body)' }} />
                  </div>
                </div>
                <button className="btn btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Change Password</h3></div>
              <div className="card-body">
                <div className="form-group"><label>Current Password</label><input className="form-control" type="password" placeholder="Enter current password" /></div>
                <div className="form-row">
                  <div className="form-group"><label>New Password</label><input className="form-control" type="password" placeholder="Enter new password" /></div>
                  <div className="form-group"><label>Confirm Password</label><input className="form-control" type="password" placeholder="Confirm new password" /></div>
                </div>
                <button className="btn btn-primary"><Shield size={16} /> Update Password</button>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Notification Preferences</h3></div>
              <div className="card-body">
                <div className="toggle-wrapper">
                  <div><div className="toggle-label">New Incident Alerts</div><div className="toggle-sublabel">Get notified when new incidents are reported</div></div>
                  <button className={`toggle ${notifications.newIncident ? 'on' : ''}`} onClick={() => toggleNotif('newIncident')} />
                </div>
                <div className="toggle-wrapper">
                  <div><div className="toggle-label">Status Update Notifications</div><div className="toggle-sublabel">Receive updates on incident status changes</div></div>
                  <button className={`toggle ${notifications.statusUpdate ? 'on' : ''}`} onClick={() => toggleNotif('statusUpdate')} />
                </div>
                <div className="toggle-wrapper">
                  <div><div className="toggle-label">System Alerts</div><div className="toggle-sublabel">Critical system and maintenance alerts</div></div>
                  <button className={`toggle ${notifications.systemAlerts ? 'on' : ''}`} onClick={() => toggleNotif('systemAlerts')} />
                </div>
                <div className="toggle-wrapper">
                  <div><div className="toggle-label">Email Digest</div><div className="toggle-sublabel">Daily summary email of all incidents</div></div>
                  <button className={`toggle ${notifications.emailDigest ? 'on' : ''}`} onClick={() => toggleNotif('emailDigest')} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body">
              <div className="quick-actions">
                <button className="quick-action-btn"><Download size={18} /> Export All Data</button>
                <button className="quick-action-btn"><RefreshCw size={18} /> Backup System</button>
                <button className="quick-action-btn"><Shield size={18} /> Security Audit Log</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
