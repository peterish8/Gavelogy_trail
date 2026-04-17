'use client';

interface BezierConnectorProps {
  fromRect: DOMRect | null;
  toRect: DOMRect | null;
  visible: boolean;
}

export function BezierConnector({ fromRect, toRect, visible }: BezierConnectorProps) {
  if (!visible || !fromRect || !toRect) {
    return (
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
          opacity: 0,
          transition: 'opacity 0.3s',
        }}
      />
    );
  }

  const x1 = fromRect.right;
  const y1 = fromRect.top + fromRect.height / 2;
  const x2 = toRect.left;
  const y2 = toRect.top + toRect.height / 2;

  const cx1 = x1 + (x2 - x1) * 0.45;
  const cx2 = x2 - (x2 - x1) * 0.45;

  const d = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
        opacity: 0.7,
        transition: 'opacity 0.3s',
      }}
    >
      <path
        d={d}
        fill="none"
        stroke="#b94a2c"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
    </svg>
  );
}
