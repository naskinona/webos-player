import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'medium', color = '#e50914' }: LoadingSpinnerProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const diameter = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '200px',
      }}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox="0 0 50 50"
        style={{
          animation: 'rotate 1s linear infinite',
          transformOrigin: 'center',
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80 40"
          style={{
            animation: 'dash 1.5s ease-in-out infinite',
          }}
        />
      </svg>
      <style jsx>{`
        @keyframes rotate {
          100% { transform: rotate(360deg); }
        }
        @keyframes dash {
          0% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 120; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard({ width = 200, height = 300 }: { width?: number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '4px',
        background: 'linear-gradient(90deg, #1f1f1f 25%, #333 50%, #1f1f1f 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonRow({ count = 8, itemWidth = 200, itemHeight = 300, gap = 16 }: { count?: number; itemWidth?: number; itemHeight?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', gap, overflowX: 'auto', paddingBottom: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} width={itemWidth} height={itemHeight} />
      ))}
    </div>
  );
}