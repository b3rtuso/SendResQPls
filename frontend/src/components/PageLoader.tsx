import React from 'react';

// ─── Base shimmer block ──────────────────────────────────────────────────────
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  className = '',
  style = {},
}: {
  width?: string | number;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// ─── Reusable Circle Skeleton ────────────────────────────────────────────────
export function SkeletonCircle({
  size = 40,
  style = {},
}: {
  size?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      style={style}
    />
  );
}

// ─── Reusable Text Skeleton ──────────────────────────────────────────────────
export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  gap = 8,
  lastLineWidth = '60%',
  style = {},
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%', ...style }}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        const width = isLast ? lastLineWidth : i % 2 === 1 ? '90%' : '100%';
        return <Skeleton key={i} width={width} height={lineHeight} borderRadius={4} />;
      })}
    </div>
  );
}

// ─── Stat card skeleton ──────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: '22px',
      border: '1px solid #E2E8F0',
      borderLeft: '4px solid #CBD5E1',
      boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={72} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
          <Skeleton width={52} height={32} borderRadius={6} />
        </div>
        <Skeleton width={42} height={42} borderRadius={12} />
      </div>
    </div>
  );
}

// ─── Table row skeleton ──────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['72px', '110px', '140px', '90px', '70px', '60px', '60px', '80px'];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 18px', borderBottom: '1px solid #F8FAFC' }}>
          <Skeleton width={widths[i % widths.length] || '100%'} height={12} borderRadius={4} />
        </td>
      ))}
    </tr>
  );
}

// ─── Card skeleton (header + body rows) ──────────────────────────────────────
export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <Skeleton width={130} height={14} borderRadius={5} />
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} width={i % 3 === 2 ? '60%' : i % 2 === 0 ? '100%' : '85%'} height={12} borderRadius={4} />
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard page skeleton ─────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat cards grid */}
      <div className="stats-grid">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>

      {/* Charts grid */}
      <div className="dashboard-charts-grid">
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Skeleton width={130} height={16} borderRadius={5} />
            <Skeleton width={80} height={32} borderRadius={8} />
          </div>
          <Skeleton width="100%" height={260} borderRadius={10} />
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <Skeleton width={150} height={16} borderRadius={5} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Skeleton width={170} height={170} borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Skeleton width={12} height={12} borderRadius={4} />
                  <Skeleton width="60%" height={12} borderRadius={4} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom split: Recent Incidents vs Departments */}
      <div className="dashboard-bottom-grid">
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={140} height={16} borderRadius={5} />
            <Skeleton width={70} height={14} borderRadius={4} />
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Incident ID', 'Type', 'Location', 'Severity', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left' }}>
                      <Skeleton width={h.length * 7 + 10} height={10} borderRadius={4} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} cols={6} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <Skeleton width={140} height={16} borderRadius={5} />
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <Skeleton width={36} height={36} borderRadius={10} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 5 }} />
                    <Skeleton width="40%" height={10} borderRadius={4} />
                  </div>
                </div>
                <Skeleton width="100%" height={28} borderRadius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Requests table skeleton ─────────────────────────────────────────────────
export function RequestsTableSkeleton() {
  return (
    <div className="table-responsive">
      <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
            {['Request ID', 'Type', 'Location', 'AI Suggested', 'Status', 'Time', 'Action'].map(h => (
              <th key={h} style={{ padding: '12px 18px', textAlign: 'left' }}>
                <Skeleton width={h.length * 6 + 20} height={10} borderRadius={4} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
        </tbody>
      </table>
    </div>
  );
}

// ─── CallLogs page skeleton ──────────────────────────────────────────────────
export function CallLogsSkeleton() {
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="cl-stats-grid">
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Skeleton width={60} height={10} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={40} height={26} borderRadius={6} />
            </div>
            <Skeleton width={44} height={44} borderRadius={12} />
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Log ID', 'Linked Request', 'Caller Identity', 'Target Department', 'Duration', 'Call Status', 'Timestamp'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left' }}>
                    <Skeleton width={h.length * 6 + 14} height={10} borderRadius={4} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Settings skeleton ───────────────────────────────────────────────────────
export function SettingsSkeleton() {
  return (
    <div className="page-content">
      <div className="st-layout-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[5, 3, 3].map((rows, i) => <CardSkeleton key={i} rows={rows} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[4, 5].map((rows, i) => <CardSkeleton key={i} rows={rows} />)}
        </div>
      </div>
    </div>
  );
}

// ─── RequestDetails skeleton ──────────────────────────────────────────────────
export function RequestDetailsSkeleton() {
  return (
    <div className="page-content">
      <div className="grid-3-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header card */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
              <Skeleton width={52} height={52} borderRadius={12} />
              <div style={{ flex: 1 }}>
                <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: 8 }} />
                <Skeleton width="45%" height={13} borderRadius={4} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i}>
                  <Skeleton width={60} height={10} borderRadius={3} style={{ marginBottom: 5 }} />
                  <Skeleton width="80%" height={14} borderRadius={4} />
                </div>
              ))}
            </div>
          </div>
          {/* Timeline */}
          <CardSkeleton rows={5} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CardSkeleton rows={4} />
          <CardSkeleton rows={6} />
        </div>
      </div>
    </div>
  );
}

// ─── Departments skeleton ─────────────────────────────────────────────────────
export function DepartmentsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="dept-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderTop: '4px solid #CBD5E1',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width="65%" height={14} borderRadius={5} style={{ marginBottom: 7 }} />
              <Skeleton width="45%" height={10} borderRadius={4} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[0, 1, 2, 3].map(j => (
              <div key={j}>
                <Skeleton width={50} height={9} borderRadius={3} style={{ marginBottom: 5 }} />
                <Skeleton width="70%" height={13} borderRadius={4} />
              </div>
            ))}
          </div>
          <Skeleton width="100%" height={36} borderRadius={9} />
        </div>
      ))}
    </div>
  );
}

// ─── Mobile history skeleton ──────────────────────────────────────────────────
export function MobileHistorySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderLeft: '3px solid #CBD5E1',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <Skeleton width={38} height={38} borderRadius={10} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={14} borderRadius={5} style={{ marginBottom: 7 }} />
              <Skeleton width="50%" height={10} borderRadius={4} />
            </div>
          </div>
          {/* Bottom row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid #F1F5F9',
          }}>
            <div>
              <Skeleton width={70} height={9} borderRadius={3} style={{ marginBottom: 5 }} />
              <Skeleton width={110} height={12} borderRadius={4} />
            </div>
            <Skeleton width={72} height={22} borderRadius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile home skeleton ─────────────────────────────────────────────────────
export function MobileHomeSkeleton() {
  return (
    <div style={{ padding: '20px 20px 0' }}>
      {/* SOS card placeholder */}
      <Skeleton width="100%" height={140} borderRadius={20} style={{ marginBottom: 16 }} />
      {/* Section label */}
      <Skeleton width={90} height={10} borderRadius={4} style={{ marginBottom: 12 }} />
      {/* Hotline grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} width="100%" height={86} borderRadius={14} />
        ))}
      </div>
      {/* Safety tips */}
      <Skeleton width={90} height={10} borderRadius={4} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height={68} borderRadius={14} />)}
      </div>
    </div>
  );
}

// ─── Mobile notifications skeleton ────────────────────────────────────────────
export function MobileNotificationsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: 12 }}>
          <Skeleton width={38} height={38} borderRadius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width="75%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="90%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="30%" height={10} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile profile skeleton ──────────────────────────────────────────────────
export function MobileProfileSkeleton() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Profile avatar card */}
      <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Skeleton width={56} height={56} borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={16} borderRadius={5} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </div>
      </div>
      {/* Profile form card */}
      <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Skeleton width={120} height={14} borderRadius={4} />
        {[0, 1, 2].map(i => (
          <div key={i}>
            <Skeleton width={60} height={10} borderRadius={3} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={42} borderRadius={10} />
          </div>
        ))}
        <Skeleton width="100%" height={44} borderRadius={12} />
      </div>
    </div>
  );
}

// ─── Default page loader ─────────────────────────────────────────────────────
export default function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flex: 1,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14, minHeight: '60vh',
    }}>
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <Skeleton width="100%" height={14} borderRadius={7} />
        <Skeleton width="80%" height={14} borderRadius={7} />
        <Skeleton width="60%" height={14} borderRadius={7} />
      </div>
      <span style={{ color: 'var(--text-muted, #64748B)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {message}
      </span>
    </div>
  );
}
