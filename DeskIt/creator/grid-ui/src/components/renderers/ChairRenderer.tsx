import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Top-down office chair: seat + back + base silhouette. */
export const ChairRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
  detail = 'detailed',
}) => {
  const sw = Math.max(strokeWidth * 0.4, Math.min(w, h) * 0.04);
  const cx = w / 2;
  const cy = h / 2;
  const seatR = Math.min(w, h) * 0.32;

  if (detail === 'simple') {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={seatR}
          fill={fill}
          fillOpacity={Math.min(fillOpacity + 0.25, 0.9)}
          stroke={stroke}
          strokeWidth={sw}
        />
        <rect
          x={cx - seatR * 0.7}
          y={cy - seatR * 1.15}
          width={seatR * 1.4}
          height={seatR * 0.35}
          rx={sw}
          fill={stroke}
          fillOpacity={0.75}
        />
      </g>
    );
  }

  return (
    <g>
      <ellipse
        cx={cx}
        cy={h * 0.88}
        rx={seatR * 0.9}
        ry={h * 0.06}
        fill={stroke}
        fillOpacity={0.12}
      />
      {/* Base arms hint */}
      <line
        x1={cx - seatR * 1.1}
        y1={cy}
        x2={cx + seatR * 1.1}
        y2={cy}
        stroke={stroke}
        strokeWidth={sw * 0.8}
        strokeOpacity={0.35}
      />
      {/* Seat */}
      <ellipse
        cx={cx}
        cy={cy + seatR * 0.1}
        rx={seatR}
        ry={seatR * 0.85}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.25, 0.92)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Backrest */}
      <path
        d={`M ${cx - seatR * 0.75} ${cy - seatR * 0.35}
            Q ${cx} ${cy - seatR * 1.35} ${cx + seatR * 0.75} ${cy - seatR * 0.35}
            L ${cx + seatR * 0.55} ${cy - seatR * 0.05}
            Q ${cx} ${cy - seatR * 0.85} ${cx - seatR * 0.55} ${cy - seatR * 0.05}
            Z`}
        fill={stroke}
        fillOpacity={0.78}
        stroke={stroke}
        strokeWidth={sw * 0.6}
      />
    </g>
  );
};
