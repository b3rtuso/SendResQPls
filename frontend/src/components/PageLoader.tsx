import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

/**
 * Shared full-page loader — matches the Settings page loading style.
 * Used on all admin pages while initial data is being fetched.
 */
export default function PageLoader({ message = 'Loading data...' }: PageLoaderProps) {
  return (
    <div style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 14,
      minHeight: '60vh',
    }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid var(--border)',
        }} />
        {/* Spinning arc */}
        <Loader2
          size={48}
          style={{
            color: 'var(--primary)',
            animation: 'spin 0.8s linear infinite',
            position: 'absolute', inset: 0,
          }}
        />
      </div>
      <span style={{
        color: 'var(--text-muted)',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}>
        {message}
      </span>
    </div>
  );
}

/**
 * Skeleton shimmer block — matches a text line or card block.
 */
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
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * A skeleton that matches a stat card (number + label + icon area).
 */
export function StatCardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: '22px',
      borderLeft: '4px solid #E2E8F0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={80} height={11} borderRadius={4} style={{ marginBottom: 10 }} />
          <Skeleton width={60} height={36} borderRadius={6} />
        </div>
        <Skeleton width={44} height={44} borderRadius={10} />
      </div>
    </div>
  );
}

/**
 * A skeleton that matches a table row.
 */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const widths = ['80px', '120px', '150px', '100px', '80px', '70px'];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 18px' }}>
          <Skeleton width={widths[i] || '100%'} height={13} borderRadius={4} />
        </td>
      ))}
    </tr>
  );
}

/**
 * A skeleton that matches a card with a header + body.
 */
export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)' }}>
        <Skeleton width={140} height={15} borderRadius={5} />
      </div>
      {/* Body */}
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} width={i % 2 === 0 ? '100%' : '75%'} height={13} borderRadius={4} />
        ))}
      </div>
    </div>
  );
}
