import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Private cabin / enclosed room footprint. */
export const CabinRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const sw = Math.max(strokeWidth * 0.45, Math.min(w, h) * 0.02);
  const inset = Math.min(w, h) * 0.04;

  return (
    <g>
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.min(w, h) * 0.04}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.1, 0.55)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Glass wall stripe */}
      <rect
        x={inset + sw}
        y={inset + sw}
        width={w - inset * 2 - sw * 2}
        height={h * 0.12}
        fill="#FFFFFF"
        fillOpacity={0.25}
      />
      {/* Door gap */}
      <rect
        x={w * 0.4}
        y={h - inset - sw * 0.5}
        width={w * 0.2}
        height={sw * 1.2}
        fill="#FFFFFF"
        fillOpacity={0.9}
      />
    </g>
  );
};
