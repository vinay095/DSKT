import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Fallback architectural block with depth — not a flat toy rectangle. */
export const GenericFurnitureRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.02);
  const inset = Math.min(w, h) * 0.08;
  const rx = Math.min(w, h) * 0.08;

  return (
    <g>
      <ellipse
        cx={w / 2}
        cy={h * 0.9}
        rx={w * 0.38}
        ry={h * 0.05}
        fill={stroke}
        fillOpacity={0.1}
      />
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={rx}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.25, 0.9)}
        stroke={stroke}
        strokeWidth={sw}
      />
      <rect
        x={inset + sw}
        y={inset + sw}
        width={w - inset * 2 - sw * 2}
        height={(h - inset * 2) * 0.2}
        rx={rx * 0.4}
        fill="#FFFFFF"
        fillOpacity={0.16}
      />
    </g>
  );
};
