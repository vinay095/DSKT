import React from 'react';
import type { FloorObjectVisualProps } from './types';

export const PhoneBoothRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.03);
  const inset = Math.min(w, h) * 0.08;

  return (
    <g>
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.min(w, h) * 0.1}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.15, 0.75)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Glass panel */}
      <rect
        x={w * 0.22}
        y={h * 0.18}
        width={w * 0.56}
        height={h * 0.55}
        rx={sw}
        fill="#FFFFFF"
        fillOpacity={0.35}
        stroke={stroke}
        strokeWidth={sw * 0.5}
        strokeOpacity={0.5}
      />
      <rect
        x={w * 0.3}
        y={h * 0.78}
        width={w * 0.4}
        height={h * 0.08}
        rx={sw * 0.5}
        fill={stroke}
        fillOpacity={0.4}
      />
    </g>
  );
};
