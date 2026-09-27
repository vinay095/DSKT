import React from 'react';
import type { FloorObjectVisualProps } from './types';

export const PillarRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const sw = Math.max(strokeWidth * 0.4, Math.min(w, h) * 0.04);
  const inset = Math.min(w, h) * 0.12;

  return (
    <g>
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.min(w, h) * 0.06}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.4, 0.95)}
        stroke={stroke}
        strokeWidth={sw}
      />
      <rect
        x={inset + sw}
        y={inset + sw}
        width={(w - inset * 2) * 0.35}
        height={h - inset * 2 - sw * 2}
        fill="#FFFFFF"
        fillOpacity={0.12}
      />
    </g>
  );
};
