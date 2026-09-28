import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Wall / freestanding display TV — thin screen + stand from above. */
export const DisplayRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
  detail = 'detailed',
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.02);
  const screenH = Math.min(h * 0.42, w * 0.22);
  const screenY = h * 0.16;
  const fo = Math.min(fillOpacity + 0.2, 0.9);
  const bezel = stroke || '#0F172A';

  return (
    <g>
      {/* Outer bezel */}
      <rect
        x={w * 0.04}
        y={screenY}
        width={w * 0.92}
        height={screenH}
        rx={sw}
        fill={bezel}
        fillOpacity={0.95}
        stroke={bezel}
        strokeWidth={sw}
      />
      {/* Screen glass */}
      <rect
        x={w * 0.08}
        y={screenY + screenH * 0.14}
        width={w * 0.84}
        height={screenH * 0.68}
        rx={sw * 0.35}
        fill="#0F172A"
        fillOpacity={0.92}
      />
      {detail === 'detailed' && (
        <>
          <rect
            x={w * 0.14}
            y={screenY + screenH * 0.28}
            width={w * 0.22}
            height={screenH * 0.14}
            rx={sw * 0.2}
            fill="#38BDF8"
            fillOpacity={0.32}
          />
          <rect
            x={w * 0.4}
            y={screenY + screenH * 0.32}
            width={w * 0.28}
            height={screenH * 0.08}
            rx={sw * 0.15}
            fill="#94A3B8"
            fillOpacity={0.25}
          />
        </>
      )}
      {/* Neck */}
      <rect
        x={w * 0.45}
        y={screenY + screenH}
        width={w * 0.1}
        height={h * 0.18}
        fill={bezel}
        fillOpacity={0.6}
      />
      {/* Base */}
      <rect
        x={w * 0.26}
        y={h * 0.78}
        width={w * 0.48}
        height={h * 0.12}
        rx={sw}
        fill={fill}
        fillOpacity={fo}
        stroke={stroke}
        strokeWidth={sw * 0.7}
      />
    </g>
  );
};
