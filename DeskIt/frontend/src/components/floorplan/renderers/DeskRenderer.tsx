import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Top-down architectural workstation: surface + monitor + keyboard zone. */
export const DeskRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
  detail = 'detailed',
}) => {
  const sw = Math.max(strokeWidth * 0.35, w * 0.012);
  const inset = Math.min(w, h) * 0.06;
  const rx = Math.min(w, h) * 0.06;

  if (detail === 'simple') {
    return (
      <g>
        <rect
          x={inset}
          y={inset}
          width={w - inset * 2}
          height={h - inset * 2}
          rx={rx}
          fill={fill}
          fillOpacity={Math.min(fillOpacity + 0.25, 0.92)}
          stroke={stroke}
          strokeWidth={sw}
        />
        <rect
          x={w * 0.22}
          y={h * 0.18}
          width={w * 0.56}
          height={h * 0.14}
          rx={sw}
          fill={stroke}
          fillOpacity={0.55}
        />
      </g>
    );
  }

  const deskY = h * 0.28;
  const deskH = h * 0.55;
  const monW = w * 0.42;
  const monH = h * 0.2;
  const monX = (w - monW) / 2;
  const monY = h * 0.1;

  return (
    <g>
      {/* Soft ground shadow */}
      <ellipse
        cx={w / 2}
        cy={h * 0.92}
        rx={w * 0.42}
        ry={h * 0.06}
        fill={stroke}
        fillOpacity={0.12}
      />
      {/* Tabletop */}
      <rect
        x={inset}
        y={deskY}
        width={w - inset * 2}
        height={deskH}
        rx={rx}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.3, 0.95)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Surface highlight */}
      <rect
        x={inset + sw}
        y={deskY + sw}
        width={w - inset * 2 - sw * 2}
        height={deskH * 0.22}
        rx={rx * 0.5}
        fill="#FFFFFF"
        fillOpacity={0.18}
      />
      {/* Monitor */}
      <rect
        x={monX}
        y={monY}
        width={monW}
        height={monH}
        rx={sw}
        fill={stroke}
        fillOpacity={0.85}
      />
      <rect
        x={monX + monW * 0.08}
        y={monY + monH * 0.12}
        width={monW * 0.84}
        height={monH * 0.62}
        rx={sw * 0.5}
        fill="#E2E8F0"
        fillOpacity={0.9}
      />
      {/* Monitor stand */}
      <rect
        x={w * 0.46}
        y={monY + monH}
        width={w * 0.08}
        height={h * 0.06}
        fill={stroke}
        fillOpacity={0.7}
      />
      {/* Keyboard zone */}
      <rect
        x={w * 0.28}
        y={deskY + deskH * 0.55}
        width={w * 0.44}
        height={deskH * 0.18}
        rx={sw * 0.5}
        fill={stroke}
        fillOpacity={0.2}
        stroke={stroke}
        strokeWidth={sw * 0.5}
        strokeOpacity={0.4}
      />
    </g>
  );
};
