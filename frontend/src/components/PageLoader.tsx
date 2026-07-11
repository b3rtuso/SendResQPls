import React from 'react';

// ─── Base shimmer block ──────────────────────────────────────────────────────
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style = {},
}: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EEF5 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ─── Stat card skeleton ──────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: '22px',
      borderLeft: '4px solid #E2E8F0',
      border: '1px solid #F1F5F9',
      borderLeftWidth: 4,
      borderLeftColor: '#E2E8F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={72} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
          <Skeleton width={52} height={34} borderRadius={6} />
        </div>
        <Skeleton width={42} height={42} borderRadius={10} />
      </div>
    </div>
  );
}

// ─── Table row skeleton ──────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['72px', '110px', '140px', '90px', '70px', '60px', '60px'];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 18px', borderBottom: '1px solid #F8FAFC' }}>
          <Skeleton width={widths[i] || '100%'} height={12} borderRadius={4} />
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
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <Skeleton width={130} height={14} borderRadius={5} />
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} width={i % 3 === 2 ? '60%' : i % 2 === 0 ? '100%' : '80%'} height={12} borderRadius={4} />
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard page skeleton ─────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: 24 }}>
          <Skeleton width={120} height={15} borderRadius={5} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={240} borderRadius={10} />
        </div>
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: 24 }}>
          <Skeleton width={140} height={15} borderRadius={5} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={240} borderRadius={10} />
        </div>
      </div>
      {/* Table + dept panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <Skeleton width={130} height={15} borderRadius={5} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[0,1,2,3,4,5,6].map(i => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
        </div>
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <Skeleton width={130} height={15} borderRadius={5} />
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <Skeleton width={38} height={38} borderRadius={10} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={10} borderRadius={4} />
                  </div>
                </div>
                <Skeleton width="100%" height={32} borderRadius={8} />
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
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
          {['Request ID','Type','Location','AI Suggested','Status','Time','Action'].map(h => (
            <th key={h} style={{ padding: '11px 18px', textAlign: 'left' }}>
              <Skeleton width={h.length * 6 + 20} height={10} borderRadius={4} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
      </tbody>
    </table>
  );
}

// ─── Settings skeleton ───────────────────────────────────────────────────────
export function SettingsSkeleton() {
  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[5, 3, 3].map((rows, i) => <CardSkeleton key={i} rows={rows} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[4, 5].map((rows, i) => <CardSkeleton key={i} rows={rows} />)}
      </div>
    </div>
  );
}

// ─── RequestDetails skeleton ──────────────────────────────────────────────────
export function RequestDetailsSkeleton() {
  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header card */}
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            <Skeleton width={52} height={52} borderRadius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="45%" height={13} borderRadius={4} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[0,1,2,3].map(i => (
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
  );
}

// ─── Departments skeleton ─────────────────────────────────────────────────────
export function DepartmentsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="dept-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderTop: '4px solid #E2E8F0',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width="65%" height={14} borderRadius={5} style={{ marginBottom: 7 }} />
              <Skeleton width="45%" height={10} borderRadius={4} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[0,1,2,3].map(j => (
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
          borderLeft: '3px solid #E2E8F0',
          borderRadius: 14,
          padding: 18,
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

// ─── Mobile home skeleton (notifications + content) ───────────────────────────
export function MobileHomeSkeleton() {
  return (
    <div style={{ padding: '20px 20px 0' }}>
      {/* SOS card placeholder */}
      <Skeleton width="100%" height={140} borderRadius={20} style={{ marginBottom: 16 }} />
      {/* Section label */}
      <Skeleton width={90} height={10} borderRadius={4} style={{ marginBottom: 12 }} />
      {/* Hotline grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[0,1,2,3].map(i => (
          <Skeleton key={i} width="100%" height={86} borderRadius={14} />
        ))}
      </div>
      {/* Safety tips */}
      <Skeleton width={90} height={10} borderRadius={4} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0,1,2].map(i => <Skeleton key={i} width="100%" height={68} borderRadius={14} />)}
      </div>
    </div>
  );
}

// ─── Default page loader (kept for non-layout-aware contexts) ─────────────────
export default function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flex: 1,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14, minHeight: '60vh',
    }}>
      {/* Skeleton pulsing bars as the "loader" */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <Skeleton width="100%" height={14} borderRadius={7} />
        <Skeleton width="80%" height={14} borderRadius={7} />
        <Skeleton width="60%" height={14} borderRadius={7} />
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {message}
      </span>
    </div>
  );
}
