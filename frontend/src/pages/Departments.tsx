import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
  Phone, Mail, Users, Search, ShieldCheck, Flame,
  Stethoscope, HardHat, Anchor, Copy, Check, Info, ShieldAlert,
  Plus, Edit2, Trash2, Clock,
} from 'lucide-react';
import type { DepartmentInfo } from '../types';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api/client';

const statusClass: Record<string, string> = {
  Available: 'available',
  'On Standby': 'standby',
  Deployed: 'deployed',
};

const statusColors: Record<string, string> = {
  Available: '#22C55E',
  'On Standby': '#F59E0B',
  Deployed: '#EF4444',
};

const DEPT_THEME: Record<string, { icon: any; color: string; bg: string }> = {
  BFP: { icon: Flame, color: '#EF4444', bg: '#FEF2F2' },
  PNP: { icon: ShieldCheck, color: '#3B82F6', bg: '#EFF6FF' },
  MEDICAL: { icon: Stethoscope, color: '#22C55E', bg: '#ECFDF5' },
  ENGINEERING: { icon: HardHat, color: '#F59E0B', bg: '#FEFCE8' },
  RESCUE: { icon: Anchor, color: '#8B5CF6', bg: '#F5F3FF' },
};

const getDeptTheme = (name: string) => {
  const code = name.toUpperCase();
  if (DEPT_THEME[code]) return DEPT_THEME[code];
  return { icon: ShieldCheck, color: '#64748B', bg: '#F1F5F9' }; // default fallback theme
};

type FilterStatus = 'ALL' | 'Available' | 'On Standby' | 'Deployed';

export default function Departments() {
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterStatus>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal and Form States
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentInfo | null>(null);
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [headOfficer, setHeadOfficer] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [personnelCount, setPersonnelCount] = useState(0);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [status, setStatus] = useState('Available');
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setName('');
    setFullName('');
    setHeadOfficer('');
    setContact('');
    setEmail('');
    setPersonnelCount(0);
    setEquipmentInput('');
    setStatus('Available');
    setShowModal(true);
  };

  const handleOpenEditModal = (dept: DepartmentInfo) => {
    setEditingDept(dept);
    setName(dept.name);
    setFullName(dept.fullName);
    setHeadOfficer(dept.headOfficer);
    setContact(dept.contact);
    setEmail(dept.email);
    setPersonnelCount(dept.personnelCount);
    setEquipmentInput(dept.equipment.join(', '));
    setStatus(dept.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: name.toUpperCase(),
      fullName,
      headOfficer,
      contact,
      email,
      personnelCount: parseInt(personnelCount.toString()) || 0,
      equipment: equipmentInput.split(',').map((eq) => eq.trim()).filter(Boolean),
      status,
    };
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, payload);
      } else {
        await createDepartment(payload);
      }
      setShowModal(false);
      loadDepartments();
    } catch (err) {
      console.error('Failed to save department:', err);
      alert('Failed to save department. Ensure department code is unique.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete department '${code}'? This cannot be undone.`)) {
      try {
        await deleteDepartment(id);
        loadDepartments();
      } catch (err) {
        console.error('Failed to delete department:', err);
        alert('Failed to delete department.');
      }
    }
  };

  const handleCopy = (dept: DepartmentInfo) => {
    const textToCopy = `${dept.fullName}\nHead: ${dept.headOfficer}\nContact: ${dept.contact}\nEmail: ${dept.email}\nStatus: ${dept.status}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(dept.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Compute resource summary statistics
  const stats = useMemo(() => {
    const totalUnits = departments.length;
    const totalPersonnel = departments.reduce((acc, curr) => acc + curr.personnelCount, 0);
    const availablePersonnel = departments
      .filter((d) => d.status === 'Available')
      .reduce((acc, curr) => acc + curr.personnelCount, 0);
    const deployedUnits = departments.filter((d) => d.status === 'Deployed').length;

    return { totalUnits, totalPersonnel, availablePersonnel, deployedUnits };
  }, [departments]);

  // Filter department list based on tab selection & search term
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesTab = activeTab === 'ALL' || dept.status === activeTab;
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.headOfficer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.equipment.some((eq) => eq.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [departments, searchTerm, activeTab]);

  return (
    <>
      <Header title="Responding Departments" subtitle="Manage and monitor Balayan emergency response units" />
      <div className="page-content" style={{ paddingTop: 8 }}>
        
        {/* ── Resource Stats Banner ────────────────────────── */}
        <div className="dept-stats-banner fade-in">
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#2563EB' }}>
              <ShieldAlert size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{loading ? '—' : stats.totalUnits}</span>
              <span className="dept-stat-label">Total Units</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22C55E' }}>
              <Users size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{loading ? '—' : stats.totalPersonnel}</span>
              <span className="dept-stat-label">Total Personnel</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6' }}>
              <Users size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{loading ? '—' : stats.availablePersonnel}</span>
              <span className="dept-stat-label">Available Personnel</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444' }}>
              <Flame size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{loading ? '—' : stats.deployedUnits}</span>
              <span className="dept-stat-label">Deployed Units</span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────── */}
        <div className="dept-search-wrapper fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 16 }}>
          <div className="dept-filter-tabs" style={{ marginBottom: 0 }}>
            {(['ALL', 'Available', 'On Standby', 'Deployed'] as FilterStatus[]).map((tab) => (
              <button
                key={tab}
                className={`dept-filter-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
            <div className="dept-search-box" style={{ flex: 1 }}>
              <Search size={18} className="dept-search-icon" />
              <input
                type="text"
                placeholder="Search units by name, head, or equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dept-search-input"
              />
            </div>
            
            <button 
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <Plus size={16} /> Add Department
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spin" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
              <Clock size={32} />
            </div>
            <p style={{ marginTop: 16 }}>Loading responding units...</p>
          </div>
        ) : (
          /* ── Department Grid ──────────────────────────────── */
          <div className="dept-grid fade-in">
            {filteredDepartments.map((dept) => {
              const theme = getDeptTheme(dept.name);
              const IconComponent = theme.icon;
              const statusColor = statusColors[dept.status] || '#94A3B8';
              
              return (
                <div 
                  className="dept-card" 
                  key={dept.id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    borderTop: `4px solid ${theme.color}`,
                  }}
                >
                  {/* Header info */}
                  <div className="dept-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: theme.bg, color: theme.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{dept.name}</h4>
                        <div className="dept-sub" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dept.fullName}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${statusClass[dept.status]}`} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', height: '22px' }}>
                        <span 
                          className="status-pulse-dot" 
                          style={{ '--pulse-color': statusColor, background: statusColor, width: 6, height: 6, marginRight: 6 } as any} 
                        />
                        {dept.status}
                      </span>
                      
                      {/* Edit Menu */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button 
                          onClick={() => handleOpenEditModal(dept)}
                          title="Edit Unit"
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dept.id, dept.name)}
                          title="Delete Unit"
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 18 }}>
                    <div className="dept-detail" style={{ margin: 0 }}><Users size={14} style={{ color: 'var(--text-muted)' }} /> <strong>Head:</strong> {dept.headOfficer}</div>
                    <div className="dept-detail" style={{ margin: 0 }}><Phone size={14} style={{ color: 'var(--text-muted)' }} /> <strong>Contact:</strong> {dept.contact}</div>
                    <div className="dept-detail" style={{ margin: 0 }}><Mail size={14} style={{ color: 'var(--text-muted)' }} /> <strong>Email:</strong> {dept.email}</div>
                    <div className="dept-detail" style={{ margin: 0 }}><Info size={14} style={{ color: 'var(--text-muted)' }} /> <strong>Personnel:</strong> {dept.personnelCount} Active Responders</div>
                    
                    {/* Equipment tags */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      <strong style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Assets</strong>
                      <div className="equipment-tags" style={{ marginTop: 0 }}>
                        {dept.equipment.map((eq) => (
                          <span className="equipment-tag" key={eq} style={{ background: theme.bg, color: theme.color }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions panel */}
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 14, marginTop: 'auto' }}>
                    <a href={`tel:${dept.contact.replace(/[^0-9]/g, '')}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{
                        width: '100%', padding: '9px 0', borderRadius: 8,
                        background: 'var(--bg-body)', border: '1px solid var(--border)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.color; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <Phone size={13} /> Call Unit
                      </button>
                    </a>
                    
                    <button 
                      onClick={() => handleCopy(dept)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8,
                        background: copiedId === dept.id ? 'var(--success-bg)' : 'var(--bg-body)', 
                        border: '1px solid var(--border)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 12, fontWeight: 700, 
                        color: copiedId === dept.id ? 'var(--success)' : 'var(--text-secondary)',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { 
                        if (copiedId !== dept.id) {
                          e.currentTarget.style.borderColor = theme.color;
                          e.currentTarget.style.color = theme.color;
                        }
                      }}
                      onMouseLeave={e => {
                        if (copiedId !== dept.id) {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      {copiedId === dept.id ? (
                        <>
                          <Check size={13} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy Specs
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredDepartments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔍</span>
            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>No responding units match your query</h4>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Try broadening your search term or checking other filter tabs.</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal Overlay ────────────────────────── */}
      {showModal && (
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
            width: '90%', maxWidth: '520px',
            maxHeight: '90vh',
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingDept ? 'Edit Responding Department' : 'Add Responding Department'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 18, fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Code & Full Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Dept Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. PCG"
                      required
                      disabled={!!editingDept} // Code name cannot be edited if updating
                      value={name}
                      onChange={e => setName(e.target.value.toUpperCase())}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                        background: editingDept ? 'var(--border-light)' : 'white'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Agency Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Philippine Coast Guard"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Head Officer */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Officer-In-Charge (Head)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CG Capt. Juan dela Cruz"
                    required
                    value={headOfficer}
                    onChange={e => setHeadOfficer(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>

                {/* Contact & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Contact Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. (043) 211-1234"
                      required
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. unit@gmail.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Personnel & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Active Personnel Count</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={personnelCount}
                      onChange={e => setPersonnelCount(parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Deployment Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                        background: 'white'
                      }}
                    >
                      <option value="Available">Available (Online)</option>
                      <option value="On Standby">On Standby</option>
                      <option value="Deployed">Deployed (Busy)</option>
                    </select>
                  </div>
                </div>

                {/* Equipment Tags */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assigned Equipment (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Patrol Boat, Life Vests, Rescue Rope"
                    value={equipmentInput}
                    onChange={e => setEquipmentInput(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>

              </div>

              {/* Modal Footer / Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--bg-body)', color: 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: 'var(--primary-dark)', color: 'white',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Department'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
