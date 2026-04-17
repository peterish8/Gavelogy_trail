'use client';

import { useEffect, useRef } from 'react';

interface HighlightOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onExpire?: () => void;
}

export function HighlightOverlay({ x, y, width, height, onExpire }: HighlightOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onExpire?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onExpire]);

  return (
    <>
      <style>{`
        @keyframes pulse-border {
          0%   { box-shadow: 0 0 0 0 rgba(201, 146, 42, 0.6); }
          50%  { box-shadow: 0 0 0 6px rgba(201, 146, 42, 0); }
          100% { box-shadow: 0 0 0 0 rgba(201, 146, 42, 0); }
        }
        .highlight-overlay-box {
          animation: pulse-border 1.2s ease-out 2;
        }
      `}</style>
      <div
        ref={ref}
        className="highlight-overlay-box"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          background: 'rgba(201, 146, 42, 0.35)',
          border: '1.5px solid rgba(201, 146, 42, 0.8)',
          borderRadius: 3,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </>
  );
}
