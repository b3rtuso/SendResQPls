import { useState, useMemo } from 'react';
import Header from '../components/Header';
import {
  Phone, Mail, Users, Search, ShieldCheck, Flame,
  Stethoscope, HardHat, Anchor, Copy, Check, Info, ShieldAlert,
} from 'lucide-react';
import type { DepartmentInfo } from '../types';

// Updated data centered on Balayan, Batangas
const departmentsData: DepartmentInfo[] = [
  {
    id: '1',
    name: 'BFP',
    fullName: 'Bureau of Fire Protection - Balayan',
    headOfficer: 'FInsp. Noel L. Alcantara',
    contact: '(043) 211-6387',
    email: 'bfp.balayan@gmail.com',
    personnelCount: 42,
    equipment: ['Fire Engines', 'Ladder Truck', 'Hazmat Suits', 'Water Tanker'],
    status: 'Available',
  },
  {
    id: '2',
    name: 'PNP',
    fullName: 'Municipal Police Station - Balayan',
    headOfficer: 'PMAJ. Gerry L. Laylo',
    contact: '(043) 211-4325',
    email: 'pnp.balayan@gmail.com',
    personnelCount: 88,
    equipment: ['Patrol Units', 'Tactical Gear', 'K9 Unit', 'Traffic Patrols'],
    status: 'Available',
  },
  {
    id: '3',
    name: 'MEDICAL',
    fullName: 'Municipal Health Office / EMS',
    headOfficer: 'Dr. Maria Victoria B. Ozaeta',
    contact: '(043) 911-0012',
    email: 'mho.balayan@gmail.com',
    personnelCount: 35,
    equipment: ['Ambulances', 'First Aid Squads', 'Mobile Clinic', 'Defibrillators'],
    status: 'Deployed',
  },
  {
    id: '4',
    name: 'ENGINEERING',
    fullName: 'Municipal Engineering Office',
    headOfficer: 'Engr. Ricardo D. Pamintuan',
    contact: '(043) 211-5678',
    email: 'engineering.balayan@gov.ph',
    personnelCount: 28,
    equipment: ['Dump Trucks', 'Bulldozer', 'Backhoe Loader', 'Chainsaws'],
    status: 'On Standby',
  },
  {
    id: '5',
    name: 'RESCUE',
    fullName: 'MDRRMO Rescue Team',
    headOfficer: 'Dir. Alejandro G. Perez',
    contact: '(043) 211-1234',
    email: 'mdrrmo.balayan@gmail.com',
    personnelCount: 52,
    equipment: ['Rescue Boats', 'Amphibious Vehicle', 'Search Drones', 'Life Vests'],
    status: 'Available',
  },
];

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

type FilterStatus = 'ALL' | 'Available' | 'On Standby' | 'Deployed';

export default function Departments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterStatus>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (dept: DepartmentInfo) => {
    const textToCopy = `${dept.fullName}\nHead: ${dept.headOfficer}\nContact: ${dept.contact}\nEmail: ${dept.email}\nStatus: ${dept.status}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(dept.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Compute resource summary statistics
  const stats = useMemo(() => {
    const totalUnits = departmentsData.length;
    const totalPersonnel = departmentsData.reduce((acc, curr) => acc + curr.personnelCount, 0);
    const availablePersonnel = departmentsData
      .filter((d) => d.status === 'Available')
      .reduce((acc, curr) => acc + curr.personnelCount, 0);
    const deployedUnits = departmentsData.filter((d) => d.status === 'Deployed').length;

    return { totalUnits, totalPersonnel, availablePersonnel, deployedUnits };
  }, []);

  // Filter department list based on tab selection & search term
  const filteredDepartments = useMemo(() => {
    return departmentsData.filter((dept) => {
      const matchesTab = activeTab === 'ALL' || dept.status === activeTab;
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.headOfficer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.equipment.some((eq) => eq.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [searchTerm, activeTab]);

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
              <span className="dept-stat-value">{stats.totalUnits}</span>
              <span className="dept-stat-label">Total Units</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22C55E' }}>
              <Users size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{stats.totalPersonnel}</span>
              <span className="dept-stat-label">Total Personnel</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6' }}>
              <Users size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{stats.availablePersonnel}</span>
              <span className="dept-stat-label">Available Personnel</span>
            </div>
          </div>
          <div className="dept-stat-item">
            <div className="dept-stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444' }}>
              <Flame size={20} />
            </div>
            <div className="dept-stat-info">
              <span className="dept-stat-value">{stats.deployedUnits}</span>
              <span className="dept-stat-label">Deployed Units</span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────── */}
        <div className="dept-search-wrapper fade-in">
          <div className="dept-filter-tabs">
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
          
          <div className="dept-search-box">
            <Search size={18} className="dept-search-icon" />
            <input
              type="text"
              placeholder="Search units by name, head, or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dept-search-input"
            />
          </div>
        </div>

        {/* ── Department Grid ──────────────────────────────── */}
        <div className="dept-grid fade-in">
          {filteredDepartments.map((dept) => {
            const theme = DEPT_THEME[dept.name] || { icon: ShieldCheck, color: '#64748B', bg: '#F1F5F9' };
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
                  <span className={`badge ${statusClass[dept.status]}`} style={{ flexShrink: 0 }}>
                    <span 
                      className="status-pulse-dot" 
                      style={{ '--pulse-color': statusColor, background: statusColor, width: 6, height: 6, marginRight: 6 } as any} 
                    />
                    {dept.status}
                  </span>
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

        {filteredDepartments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔍</span>
            <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>No responding units match your query</h4>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Try broadening your search term or checking other filter tabs.</p>
          </div>
        )}
      </div>
    </>
  );
}
