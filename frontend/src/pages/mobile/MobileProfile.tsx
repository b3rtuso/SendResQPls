import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Phone, Bell, HelpCircle, LogOut, ChevronRight, ChevronLeft, Save, Mail, X, Plus, Trash2, Info, MessageCircle } from 'lucide-react';
import { updateProfile, changePassword } from '../../api/client';
import Toast, { type ToastType } from '../../components/Toast';
import BottomNav from '../../components/BottomNav';

type Section = 'main' | 'account' | 'contacts' | 'notifications' | 'help';

const EMERGENCY_CONTACTS_KEY = 'emergencyContacts';
const NOTIF_SETTINGS_KEY = 'notifSettings';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function MobileProfile() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('main');
  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({ show: false, message: '', type: 'info' });
  const [saving, setSaving] = useState(false);

  // User data from localStorage
  const userId = localStorage.getItem('userId') || '';
  const [name, setName] = useState(localStorage.getItem('userName') || 'User');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [phone, setPhone] = useState(localStorage.getItem('userPhone') || '');
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Password change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem(EMERGENCY_CONTACTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [showAddContact, setShowAddContact] = useState(false);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Notification settings
  const [notifSettings, setNotifSettings] = useState(() => {
    const saved = localStorage.getItem(NOTIF_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
      statusUpdates: true,
      emergencyAlerts: true,
      systemNotices: false,
      sound: true,
    };
  });

  useEffect(() => {
    localStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(notifSettings));
  }, [notifSettings]);

  const showToast = (type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/mobile/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ userId, name, email, phoneNumber: phone });
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userPhone', phone);
      showToast('success', 'Profile updated', 'Your account details have been saved.');
    } catch {
      showToast('error', 'Update failed', 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass) { showToast('error', 'Fill in both fields'); return; }
    if (newPass.length < 6) { showToast('error', 'Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass });
      showToast('success', 'Password changed', 'Your password has been updated successfully.');
      setCurrentPass(''); setNewPass('');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) { showToast('error', 'Name and phone are required'); return; }
    setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    setNewContact({ name: '', phone: '', relation: '' });
    setShowAddContact(false);
    showToast('success', 'Contact added');
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    showToast('info', 'Contact removed');
  };

  const toggleNotif = (key: string) => {
    setNotifSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---- Section Header ----
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
      <button onClick={() => setSection('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
        <ChevronLeft size={24} />
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</h2>
    </div>
  );

  // ---- MAIN PROFILE VIEW ----
  if (section === 'main') {
    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}

          {/* Profile Header — full width */}
          <div style={{
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
            padding: '44px 24px 32px', textAlign: 'center', color: 'white',
            width: '100vw', marginLeft: 'calc(-50vw + 50%)', boxSizing: 'border-box',
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', margin: '0 auto 14px',
              background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 800,
            }}>{initials}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>{name}</h2>
            <p style={{ fontSize: 14, opacity: 0.75, margin: '0 0 4px' }}>{email || 'No email set'}</p>
            <p style={{ fontSize: 14, opacity: 0.75, margin: '0 0 14px' }}>{phone || 'No phone set'}</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', padding: '6px 18px',
              borderRadius: 20, fontSize: 12, fontWeight: 700,
            }}>
              <Shield size={13} /> VERIFIED CITIZEN
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '16px 20px' }}>
            {[
              { icon: User, label: 'Account Details', key: 'account' as Section, desc: 'Name, email, password' },
              { icon: Phone, label: 'Emergency Contacts', key: 'contacts' as Section, desc: `${contacts.length} contacts saved` },
              { icon: Bell, label: 'Notification Settings', key: 'notifications' as Section, desc: 'Alerts & sounds' },
              { icon: HelpCircle, label: 'Help & Support', key: 'help' as Section, desc: 'FAQs & contact us' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => setSection(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 0', borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: '#EFF6FF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0,
                }}><item.icon size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
                </div>
                <ChevronRight size={18} color="#CBD5E1" />
              </div>
            ))}
          </div>

          {/* Logout */}
          <div style={{ padding: '8px 20px 24px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'var(--font)',
              }}
            ><LogOut size={18} /> Log Out</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ---- ACCOUNT DETAILS ----
  if (section === 'account') {
    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
          <SectionHeader title="Account Details" />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Full Name</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <User size={18} color="#94A3B8" />
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15, fontFamily: 'var(--font)', color: '#0F172A' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <Mail size={18} color="#94A3B8" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15, fontFamily: 'var(--font)', color: '#0F172A' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <Phone size={18} color="#94A3B8" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 900 000 0000" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15, fontFamily: 'var(--font)', color: '#0F172A' }} />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} style={{
              width: '100%', padding: 14, borderRadius: 14, background: '#2563EB', color: 'white',
              border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'var(--font)', opacity: saving ? 0.6 : 1,
            }}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>

            {/* Change Password */}
            <div style={{ marginTop: 12, padding: 18, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Change Password</h3>
              <div style={{ marginBottom: 12 }}>
                <input type="password" placeholder="Current password" value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <input type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e => setNewPass(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleChangePassword} disabled={saving} style={{
                width: '100%', padding: 12, borderRadius: 12, background: '#0F172A', color: 'white',
                border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>{saving ? 'Updating...' : 'Update Password'}</button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ---- EMERGENCY CONTACTS ----
  if (section === 'contacts') {
    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
          <SectionHeader title="Emergency Contacts" />
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>These contacts will be notified when you send an emergency report.</p>

            {contacts.length === 0 && !showAddContact && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                <Phone size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>No emergency contacts yet</p>
                <p style={{ fontSize: 13 }}>Add contacts who should be notified during emergencies.</p>
              </div>
            )}

            {contacts.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: '#F8FAFC', borderRadius: 14, marginBottom: 10, border: '1px solid #E2E8F0',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{c.phone} {c.relation && `• ${c.relation}`}</div>
                </div>
                <button onClick={() => removeContact(c.id)} style={{
                  background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4,
                }}><Trash2 size={16} /></button>
              </div>
            ))}

            {showAddContact ? (
              <div style={{ padding: 16, background: '#F0F9FF', borderRadius: 16, border: '1.5px solid #BAE6FD', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>New Contact</h4>
                  <button onClick={() => setShowAddContact(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
                </div>
                {['name', 'phone', 'relation'].map(field => (
                  <input key={field} placeholder={field === 'relation' ? 'Relation (e.g. Parent)' : field === 'name' ? 'Full Name' : 'Phone Number'}
                    value={(newContact as any)[field]} onChange={e => setNewContact({ ...newContact, [field]: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                ))}
                <button onClick={addContact} style={{
                  width: '100%', padding: 12, borderRadius: 12, background: '#2563EB', color: 'white',
                  border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', marginTop: 4,
                }}>Save Contact</button>
              </div>
            ) : (
              <button onClick={() => setShowAddContact(true)} style={{
                width: '100%', padding: 14, borderRadius: 14, background: 'white',
                border: '1.5px dashed #CBD5E1', color: '#2563EB', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'var(--font)', marginTop: 12,
              }}><Plus size={16} /> Add Emergency Contact</button>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ---- NOTIFICATION SETTINGS ----
  if (section === 'notifications') {
    const toggleStyle = (on: boolean) => ({
      width: 48, height: 28, borderRadius: 14, padding: 3,
      background: on ? '#2563EB' : '#CBD5E1', border: 'none', cursor: 'pointer',
      position: 'relative' as const, transition: 'background 0.2s',
    });
    const dotStyle = (on: boolean) => ({
      width: 22, height: 22, borderRadius: '50%', background: 'white',
      position: 'absolute' as const, top: 3, left: on ? 23 : 3,
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    });

    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
          <SectionHeader title="Notification Settings" />
          <div style={{ padding: 20 }}>
            {[
              { key: 'statusUpdates', label: 'Status Updates', desc: 'Get notified when your report status changes' },
              { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Receive area-wide emergency broadcasts' },
              { key: 'systemNotices', label: 'System Notices', desc: 'App updates and maintenance alerts' },
              { key: 'sound', label: 'Notification Sound', desc: 'Play sound for incoming alerts' },
            ].map(item => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 0', borderBottom: '1px solid #F1F5F9',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
                </div>
                <button onClick={() => toggleNotif(item.key)} style={toggleStyle(notifSettings[item.key])}>
                  <div style={dotStyle(notifSettings[item.key])} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ---- HELP & SUPPORT ----
  if (section === 'help') {
    const faqs = [
      { q: 'How do I report an incident?', a: 'Tap the "SEND EMERGENCY ALERT" button on the home screen. Take a photo, allow GPS access, and submit.' },
      { q: 'How long does it take for a response?', a: 'Reports are reviewed immediately by MDRRMO dispatchers. Response teams are typically dispatched within 5-15 minutes.' },
      { q: 'Can I track my report status?', a: 'Yes! Go to History tab to see all your past reports and their current status.' },
      { q: 'What if I accidentally submit a false report?', a: 'Contact MDRRMO immediately. False reports may result in your account being flagged.' },
      { q: 'Is my location data safe?', a: 'Your GPS coordinates are only used to dispatch the nearest response team. Data is encrypted and stored securely.' },
    ];


    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          <SectionHeader title="Help & Support" />
          <div style={{ padding: 20 }}>
            {/* Contact Info */}
            <div style={{ background: '#EFF6FF', borderRadius: 16, padding: 18, marginBottom: 20, border: '1px solid #BFDBFE' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E40AF', marginBottom: 12 }}>Contact MDRRMO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="tel:09171234567" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <Phone size={16} /> 0917-123-4567
                </a>
                <a href="mailto:mdrrmo@balayan.gov.ph" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <Mail size={16} /> mdrrmo@balayan.gov.ph
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', fontSize: 14, fontWeight: 600 }}>
                  <MessageCircle size={16} /> Live chat (8AM - 5PM)
                </div>
              </div>
            </div>

            {/* FAQs */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Frequently Asked Questions</h3>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 14, marginBottom: 8,
                border: '1px solid #E2E8F0', overflow: 'hidden',
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#0F172A',
                  fontFamily: 'var(--font)', textAlign: 'left',
                }}>
                  {faq.q}
                  <ChevronRight size={16} style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 8 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}

            {/* App Info */}
            <div style={{ textAlign: 'center', marginTop: 24, color: '#94A3B8', fontSize: 12 }}>
              <Info size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              SendResqPls v1.0.0 • MDRRMO Balayan
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
