import React from 'react';
import type { FloorObjectVisualProps } from './types';

export const PlantRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38;
  const sw = Math.max(strokeWidth * 0.3, r * 0.08);

  return (
    <g>
      <ellipse
        cx={cx}
        cy={h * 0.88}
        rx={r * 0.55}
        ry={h * 0.06}
        fill={stroke}
        fillOpacity={0.12}
      />
      {/* Pot */}
      <path
        d={`M ${cx - r * 0.35} ${cy + r * 0.15}
            L ${cx - r * 0.28} ${cy + r * 0.75}
            L ${cx + r * 0.28} ${cy + r * 0.75}
            L ${cx + r * 0.35} ${cy + r * 0.15} Z`}
        fill={stroke}
        fillOpacity={0.45}
        stroke={stroke}
        strokeWidth={sw * 0.6}
      />
      {/* Foliage */}
      <circle
        cx={cx}
        cy={cy - r * 0.15}
        r={r * 0.55}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.35, 0.9)}
        stroke={stroke}
        strokeWidth={sw}
      />
      <circle
        cx={cx - r * 0.28}
        cy={cy}
        r={r * 0.32}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.2, 0.85)}
      />
      <circle
        cx={cx + r * 0.28}
        cy={cy}
        r={r * 0.32}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.2, 0.85)}
      />
    </g>
  );
};
