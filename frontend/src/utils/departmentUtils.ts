import {
  Flame,
  ShieldCheck,
  Stethoscope,
  HardHat,
  Ambulance,
  ShieldAlert,
  Building2,
  Anchor,
  HeartHandshake,
  Users,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import type { DepartmentInfo } from '../types';

export interface DeptTheme {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

// Predefined themes for known municipal response units
export const KNOWN_DEPT_THEMES: Record<string, DeptTheme> = {
  BFP: {
    icon: Flame,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  PNP: {
    icon: ShieldCheck,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  MEDICAL: {
    icon: Stethoscope,
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  ENGINEERING: {
    icon: HardHat,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  RESCUE: {
    icon: Ambulance,
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
};

// Curated high-contrast palette for dynamically added departments
const DYNAMIC_PALETTE: { color: string; bg: string; border: string; icon: LucideIcon }[] = [
  { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.25)', icon: Anchor },
  { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', icon: HeartHandshake },
  { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.08)', border: 'rgba(20, 184, 166, 0.25)', icon: ShieldAlert },
  { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)', icon: Radio },
  { color: '#F97316', bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.25)', icon: Users },
  { color: '#64748B', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.25)', icon: Building2 },
];

/**
 * Deterministically pick an icon and color palette for any department code
 */
export function getDeptTheme(deptCode?: string | null, _departments?: DepartmentInfo[]): DeptTheme {
  if (!deptCode) {
    return {
      icon: Building2,
      color: '#64748B',
      bg: 'rgba(100, 116, 139, 0.08)',
      border: 'rgba(100, 116, 139, 0.2)',
    };
  }

  const code = deptCode.toUpperCase().trim();
  if (KNOWN_DEPT_THEMES[code]) {
    return KNOWN_DEPT_THEMES[code];
  }

  // Keyword-based icon matching for newly added departments
  let matchedIcon: LucideIcon = Building2;
  if (code.includes('COAST') || code.includes('PCG') || code.includes('MARITIME') || code.includes('PORT')) {
    matchedIcon = Anchor;
  } else if (code.includes('DSWD') || code.includes('RELIEF') || code.includes('RED CROSS') || code.includes('CHARITY')) {
    matchedIcon = HeartHandshake;
  } else if (code.includes('RADIO') || code.includes('COMMS') || code.includes('DISPATCH')) {
    matchedIcon = Radio;
  } else if (code.includes('BARANGAY') || code.includes('BRGY') || code.includes('VOLUNTEER')) {
    matchedIcon = Users;
  }

  // Deterministic color assignment from string hash
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
  const picked = DYNAMIC_PALETTE[index];

  return {
    icon: matchedIcon !== Building2 ? matchedIcon : picked.icon,
    color: picked.color,
    bg: picked.bg,
    border: picked.border,
  };
}

/**
 * Resolve display full name for a department code
 */
export function getDeptDisplayName(deptCode?: string | null, departments?: DepartmentInfo[]): string {
  if (!deptCode) return 'Not yet assigned';
  const code = deptCode.toUpperCase().trim();

  // Try database list first
  if (departments && departments.length > 0) {
    const found = departments.find(d => d.name.toUpperCase() === code);
    if (found) {
      return found.fullName ? `${found.name} (${found.fullName})` : found.name;
    }
  }

  // Known fallback names
  const staticNames: Record<string, string> = {
    BFP: 'BFP (Bureau of Fire Protection)',
    PNP: 'PNP (Philippine National Police)',
    MEDICAL: 'Medical / MHO / Ambulance',
    ENGINEERING: 'Engineering / DPWH',
    RESCUE: 'MDRRMO Rescue Team',
  };

  return staticNames[code] || code;
}

/**
 * Resolve direct phone contact for a department code
 */
export function getDeptContact(deptCode?: string | null, departments?: DepartmentInfo[]): string {
  if (!deptCode) return '';
  const code = deptCode.toUpperCase().trim();

  if (departments && departments.length > 0) {
    const found = departments.find(d => d.name.toUpperCase() === code);
    if (found?.contact) return found.contact;
  }

  const staticContacts: Record<string, string> = {
    BFP: '(043) 211-6387',
    PNP: '(043) 211-4325',
    MEDICAL: '(043) 911-0012',
    ENGINEERING: '(043) 211-5678',
    RESCUE: '(043) 211-1234',
  };

  return staticContacts[code] || '(043) 211-1234';
}

/**
 * Resolve short abbreviation / badge label for a department
 */
export function getDeptAbbr(deptCode?: string | null): string {
  if (!deptCode) return 'DEPT';
  const code = deptCode.toUpperCase().trim();
  if (code.length <= 4) return code;
  if (code === 'ENGINEERING') return 'ENG';
  if (code === 'MEDICAL') return 'MED';
  return code.slice(0, 4);
}
