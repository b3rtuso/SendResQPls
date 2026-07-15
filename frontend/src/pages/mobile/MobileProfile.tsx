import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, Phone, Bell, HelpCircle, LogOut, ChevronRight,
  ChevronLeft, Save, Mail, X, Plus, Trash2, Info, MessageCircle, Lock, Eye, EyeOff,
} from 'lucide-react';
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

/* ── shared sub-components ─────────────────────────────── */

function Field({
  label, icon: Icon, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700,
        color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#F8FAFC', border: '1.5px solid #E2E8F0',
        borderRadius: 12, padding: '13px 14px',
      }}>
        <Icon size={17} color="#94A3B8" style={{ flexShrink: 0 }} />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'none', outline: 'none',
            fontSize: 15, fontFamily: 'var(--font)', color: '#0F172A', minWidth: 0,
          }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '18px 16px 14px',
      borderBottom: '1px solid #F1F5F9',
      position: 'sticky', top: 0, background: 'white', zIndex: 10,
    }}>
      <button onClick={onBack} style={{
        background: '#F1F5F9', border: 'none', cursor: 'pointer',
        width: 36, height: 36, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#475569', flexShrink: 0,
      }}>
        <ChevronLeft size={20} />
      </button>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</h2>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 48, height: 28, borderRadius: 14, padding: 3,
      background: on ? '#2563EB' : '#CBD5E1', border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: on ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

/* ── main component ─────────────────────────────────────── */

export default function MobileProfile() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('main');
  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({ show: false, message: '', type: 'info' });
  const [saving, setSaving] = useState(false);

  const userId = localStorage.getItem('userId') || '';
  const [name, setName] = useState(localStorage.getItem('userName') || 'User');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [phone, setPhone] = useState(localStorage.getItem('userPhone') || '');
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    try { return JSON.parse(localStorage.getItem(EMERGENCY_CONTACTS_KEY) || '[]'); } catch { return []; }
  });
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [notifSettings, setNotifSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_SETTINGS_KEY) || '{}'); } catch { return {}; }
  });

  const DEFAULT_NOTIFS = { statusUpdates: true, emergencyAlerts: true, systemNotices: false, sound: true };
  const notifs = { ...DEFAULT_NOTIFS, ...notifSettings };

  useEffect(() => {
    localStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(notifSettings));
  }, [notifSettings]);

  const showToast = (type: ToastType, message: string, detail?: string) =>
    setToast({ show: true, message, detail, type });

  const handleLogout = () => {
    const onboardingDone = localStorage.getItem('srq_onboarding_done');
    localStorage.clear();
    if (onboardingDone) localStorage.setItem('srq_onboarding_done', onboardingDone);
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
    } finally { setSaving(false); }
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
    } finally { setSaving(false); }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) { showToast('error', 'Name and phone are required'); return; }
    setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    setNewContact({ name: '', phone: '', relation: '' });
    setShowAddContact(false);
    showToast('success', 'Contact added');
  };

  /* ── MAIN VIEW ─────────────────────────────────────────── */
  if (section === 'main') return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}

        {/* Hero Header — uses percentage width, no 100vw hack */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          padding: 'clamp(32px, 8vw, 48px) clamp(16px, 5vw, 28px) 28px',
          textAlign: 'center', color: 'white', width: '100%', boxSizing: 'border-box',
        }}>
          {/* Avatar */}
          <div style={{
            width: 'clamp(72px, 20vw, 96px)', height: 'clamp(72px, 20vw, 96px)',
            borderRadius: '50%', margin: '0 auto 12px',
            background: 'rgba(255,255,255,0.18)', border: '3px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 800, letterSpacing: '-1px',
          }}>{initials}</div>

          <h2 style={{ fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2 }}>{name}</h2>
          <p style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', opacity: 0.75, margin: '0 0 2px', wordBreak: 'break-all' }}>{email || 'No email address'}</p>
          <p style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', opacity: 0.75, margin: '0 0 14px' }}>{phone || 'No phone number'}</p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', padding: '6px 16px',
            borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
          }}>
            <Shield size={12} /> VERIFIED CITIZEN
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '12px clamp(14px, 4vw, 20px)' }}>
          {[
            { icon: User, label: 'Account Details', key: 'account' as Section, desc: 'Name, email, and password' },
            { icon: Phone, label: 'Emergency Contacts', key: 'contacts' as Section, desc: `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} saved` },
            { icon: Bell, label: 'Notification Settings', key: 'notifications' as Section, desc: 'Alerts and sound preferences' },
            { icon: HelpCircle, label: 'Help & Support', key: 'help' as Section, desc: 'FAQs and contact details' },
          ].map(item => (
            <div
              key={item.label}
              onClick={() => setSection(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 'clamp(12px, 3.5vw, 16px) 4px',
                borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 'clamp(38px, 10vw, 44px)', height: 'clamp(38px, 10vw, 44px)',
                borderRadius: 12, background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2563EB', flexShrink: 0,
              }}>
                <item.icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
              </div>
              <ChevronRight size={18} color="#CBD5E1" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '16px clamp(14px, 4vw, 20px) 8px' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: 'clamp(12px, 3.5vw, 15px)',
            borderRadius: 14, background: '#FEF2F2', color: '#DC2626',
            border: '1.5px solid #FECACA', fontSize: 'clamp(13px, 3.8vw, 15px)',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <LogOut size={17} /> Log Out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── ACCOUNT DETAILS ───────────────────────────────────── */
  if (section === 'account') return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
        <SectionHeader title="Account Details" onBack={() => setSection('main')} />

        <div style={{ padding: 'clamp(14px, 4vw, 20px)' }}>
          <Field label="Full Name" icon={User} value={name} onChange={setName} placeholder="Juan Dela Cruz" />
          <Field label="Email Address" icon={Mail} value={email} onChange={setEmail} placeholder="juan@example.com" type="email" />
          <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} placeholder="+63 900 000 0000" type="tel" />

          <button onClick={handleSaveProfile} disabled={saving} style={{
            width: '100%', padding: 'clamp(12px, 3.5vw, 15px)',
            borderRadius: 14, background: '#2563EB', color: 'white',
            border: 'none', fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.6 : 1, marginBottom: 20,
          }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Change Password card */}
          <div style={{
            background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0', padding: 'clamp(14px, 4vw, 18px)',
          }}>
            <h3 style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>Change Password</h3>

            {/* Current password */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'white', border: '1.5px solid #E2E8F0',
              borderRadius: 12, padding: '12px 14px', marginBottom: 10,
            }}>
              <Lock size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                type={showCurrentPass ? 'text' : 'password'}
                placeholder="Current password"
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font)', minWidth: 0 }}
              />
              <button onClick={() => setShowCurrentPass(!showCurrentPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, flexShrink: 0 }}>
                {showCurrentPass ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {/* New password */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'white', border: '1.5px solid #E2E8F0',
              borderRadius: 12, padding: '12px 14px', marginBottom: 14,
            }}>
              <Lock size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="New password (min 6 chars)"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font)', minWidth: 0 }}
              />
              <button onClick={() => setShowNewPass(!showNewPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, flexShrink: 0 }}>
                {showNewPass ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <button onClick={handleChangePassword} disabled={saving} style={{
              width: '100%', padding: 12, borderRadius: 12, background: '#0F172A', color: 'white',
              border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font)', opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── EMERGENCY CONTACTS ────────────────────────────────── */
  if (section === 'contacts') return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
        <SectionHeader title="Emergency Contacts" onBack={() => setSection('main')} />

        <div style={{ padding: 'clamp(14px, 4vw, 20px)' }}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 1.5 }}>
            These contacts will be notified when you submit an emergency report.
          </p>

          {contacts.length === 0 && !showAddContact && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
              <Phone size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No emergency contacts yet</p>
              <p style={{ fontSize: 13 }}>Add contacts who should be notified during emergencies.</p>
            </div>
          )}

          {contacts.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: '#F8FAFC',
              borderRadius: 14, marginBottom: 10, border: '1px solid #E2E8F0',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2563EB', fontWeight: 800, fontSize: 13, flexShrink: 0,
              }}>
                {c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{c.phone}{c.relation && ` · ${c.relation}`}</div>
              </div>
              <button onClick={() => { setContacts(contacts.filter(x => x.id !== c.id)); showToast('info', 'Contact removed'); }}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <Trash2 size={17} />
              </button>
            </div>
          ))}

          {showAddContact ? (
            <div style={{ padding: 16, background: '#F0F9FF', borderRadius: 16, border: '1.5px solid #BAE6FD', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>New Contact</h4>
                <button onClick={() => setShowAddContact(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
              </div>
              {([['name', 'Full Name'], ['phone', 'Phone Number'], ['relation', 'Relation (e.g. Parent, Sibling)']] as const).map(([field, ph]) => (
                <input key={field} placeholder={ph}
                  value={newContact[field]}
                  onChange={e => setNewContact({ ...newContact, [field]: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', background: 'white', fontSize: 14,
                    fontFamily: 'var(--font)', outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                  }}
                />
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
            }}>
              <Plus size={16} /> Add Emergency Contact
            </button>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── NOTIFICATION SETTINGS ─────────────────────────────── */
  if (section === 'notifications') return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {toast.show && <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />}
        <SectionHeader title="Notification Settings" onBack={() => setSection('main')} />
        <div style={{ padding: 'clamp(14px, 4vw, 20px)' }}>
          {([
            { key: 'statusUpdates', label: 'Status Updates', desc: 'Get notified when your report status changes' },
            { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Receive area-wide emergency broadcasts' },
            { key: 'systemNotices', label: 'System Notices', desc: 'App updates and maintenance alerts' },
            { key: 'sound', label: 'Notification Sound', desc: 'Play sound for incoming alerts' },
          ] as const).map(item => (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 'clamp(12px, 3.5vw, 16px) 0', borderBottom: '1px solid #F1F5F9',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
              </div>
              <Toggle on={notifs[item.key]} onToggle={() => setNotifSettings((p: any) => ({ ...p, [item.key]: !notifs[item.key] }))} />
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── HELP & SUPPORT ────────────────────────────────────── */
  if (section === 'help') {
    const faqs = [
      { q: 'How do I report an incident?', a: 'Tap the "SEND EMERGENCY ALERT" button on the home screen. Take a photo, allow GPS access, and submit. AI will classify your report automatically.' },
      { q: 'How long does it take for a response?', a: 'Reports are reviewed immediately by MDRRMO dispatchers. Response teams are typically dispatched within 5–15 minutes.' },
      { q: 'Can I track my report status?', a: 'Yes! Go to the History tab to see all your past reports and their current status (Pending, Reviewing, Dispatched, Resolved).' },
      { q: 'What if I accidentally submit a false report?', a: 'Contact MDRRMO immediately via phone or email. Repeated false reports may result in account suspension.' },
      { q: 'Is my location data safe?', a: 'Your GPS coordinates are only used to dispatch the nearest response team and verify you are within Balayan. Data is encrypted.' },
      { q: 'Why can I only report from Balayan?', a: 'SendResqPls is specifically designed for the MDRRMO of Balayan, Batangas. Reports are only accepted from within the municipality boundaries.' },
    ];

    return (
      <div className="mobile-shell">
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          <SectionHeader title="Help & Support" onBack={() => setSection('main')} />
          <div style={{ padding: 'clamp(14px, 4vw, 20px)' }}>
            {/* Contact card */}
            <div style={{
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              borderRadius: 16, padding: 'clamp(14px, 4vw, 18px)', marginBottom: 20,
              border: '1px solid #BFDBFE',
            }}>
              <h3 style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 800, color: '#1E40AF', marginBottom: 12 }}>Contact MDRRMO Balayan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="tel:09171234567" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <Phone size={15} /> 0917-123-4567
                </a>
                <a href="mailto:mdrrmo@balayan.gov.ph" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', textDecoration: 'none', fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>
                  <Mail size={15} /> mdrrmo@balayan.gov.ph
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', fontSize: 14, fontWeight: 600 }}>
                  <MessageCircle size={15} /> Live chat (8AM – 5PM)
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Frequently Asked Questions</h3>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, marginBottom: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '14px 16px', background: openFaq === i ? '#F0F9FF' : 'none',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: 700, color: '#0F172A',
                    fontFamily: 'var(--font)', textAlign: 'left', gap: 8,
                  }}
                >
                  <span style={{ flex: 1 }}>{faq.q}</span>
                  <ChevronRight size={16} style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 24, color: '#94A3B8', fontSize: 12 }}>
              <Info size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
              SendResqPls v1.0.0 · MDRRMO Balayan, Batangas
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return null;
}
