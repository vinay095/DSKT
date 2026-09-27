import React from 'react';
import type { FloorObjectVisualProps } from './types';

export const RestroomRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.03);
  const inset = Math.min(w, h) * 0.1;

  return (
    <g>
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.min(w, h) * 0.08}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.2, 0.85)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Fixture silhouette */}
      <ellipse
        cx={w / 2}
        cy={h * 0.42}
        rx={w * 0.18}
        ry={h * 0.14}
        fill={stroke}
        fillOpacity={0.35}
      />
      <rect
        x={w * 0.38}
        y={h * 0.48}
        width={w * 0.24}
        height={h * 0.28}
        rx={sw}
        fill={stroke}
        fillOpacity={0.4}
      />
    </g>
  );
};
