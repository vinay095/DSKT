import React from 'react';
import type { FloorObjectVisualProps } from './types';
import { resolveObjectKind } from './types';

/** Top-down workstation / desk / monitor — silhouette follows elementType. */
export const DeskRenderer: React.FC<FloorObjectVisualProps> = (props) => {
  const {
    width: w,
    height: h,
    fill,
    stroke,
    fillOpacity,
    strokeWidth,
    detail = 'detailed',
    elementType,
    category,
  } = props;
  const kind = resolveObjectKind(category, elementType);
  const sw = Math.max(strokeWidth * 0.35, w * 0.012);
  const inset = Math.min(w, h) * 0.05;
  const rx = Math.min(w, h) * 0.05;
  const fo = Math.min(fillOpacity + 0.28, 0.95);

  if (kind === 'monitor') {
    const monH = h * 0.5;
    const monY = h * 0.1;
    const standW = w * 0.16;
    return (
      <g>
        <rect
          x={w * 0.06}
          y={monY}
          width={w * 0.88}
          height={monH}
          rx={sw}
          fill={stroke}
          fillOpacity={0.92}
        />
        <rect
          x={w * 0.12}
          y={monY + monH * 0.14}
          width={w * 0.76}
          height={monH * 0.66}
          rx={sw * 0.35}
          fill="#0F172A"
          fillOpacity={0.9}
        />
        {detail === 'detailed' && (
          <rect
            x={w * 0.18}
            y={monY + monH * 0.28}
            width={w * 0.22}
            height={monH * 0.14}
            rx={sw * 0.2}
            fill="#38BDF8"
            fillOpacity={0.3}
          />
        )}
        <rect
          x={(w - standW) / 2}
          y={monY + monH}
          width={standW}
          height={h * 0.14}
          fill={stroke}
          fillOpacity={0.65}
        />
        <rect
          x={w * 0.26}
          y={h * 0.8}
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
  }

  if (kind === 'corner_desk') {
    // L-shaped footprint: main wing + return
    const t = Math.min(w, h) * 0.38;
    const path = `M ${inset} ${inset} H ${w - inset} V ${t} H ${t} V ${h - inset} H ${inset} Z`;
    return (
      <g>
        <path d={path} fill={fill} fillOpacity={fo} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        {detail === 'detailed' && (
          <>
            <rect x={w * 0.35} y={inset + sw} width={w * 0.45} height={t * 0.35} rx={sw} fill={stroke} fillOpacity={0.75} />
            <rect
              x={inset + sw}
              y={h * 0.45}
              width={t * 0.35}
              height={h * 0.28}
              rx={sw}
              fill={stroke}
              fillOpacity={0.2}
              stroke={stroke}
              strokeWidth={sw * 0.5}
              strokeOpacity={0.35}
            />
          </>
        )}
      </g>
    );
  }

  // Standard / computer / standing desk: rectangular top + monitor + keyboard
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
          fillOpacity={fo}
          stroke={stroke}
          strokeWidth={sw}
        />
        <rect x={w * 0.22} y={h * 0.16} width={w * 0.56} height={h * 0.14} rx={sw} fill={stroke} fillOpacity={0.55} />
      </g>
    );
  }

  const deskY = h * 0.3;
  const deskH = h * 0.52;
  const monW = w * 0.4;
  const monH = h * 0.18;
  const monX = (w - monW) / 2;
  const monY = h * 0.08;
  const standing = (elementType || '').toLowerCase().includes('standing');

  return (
    <g>
      <ellipse cx={w / 2} cy={h * 0.92} rx={w * 0.4} ry={h * 0.05} fill={stroke} fillOpacity={0.1} />
      <rect
        x={inset}
        y={deskY}
        width={w - inset * 2}
        height={deskH}
        rx={rx}
        fill={fill}
        fillOpacity={fo}
        stroke={stroke}
        strokeWidth={sw}
      />
      <rect
        x={inset + sw}
        y={deskY + sw}
        width={w - inset * 2 - sw * 2}
        height={deskH * 0.2}
        rx={rx * 0.4}
        fill="#FFFFFF"
        fillOpacity={0.16}
      />
      {/* Dual monitor for standard workstations */}
      <rect x={monX} y={monY} width={monW} height={monH} rx={sw} fill={stroke} fillOpacity={0.85} />
      <rect
        x={monX + monW * 0.08}
        y={monY + monH * 0.14}
        width={monW * 0.84}
        height={monH * 0.6}
        rx={sw * 0.4}
        fill="#E2E8F0"
        fillOpacity={0.92}
      />
      <rect x={w * 0.47} y={monY + monH} width={w * 0.06} height={h * 0.05} fill={stroke} fillOpacity={0.65} />
      <rect
        x={w * 0.28}
        y={deskY + deskH * 0.52}
        width={w * 0.44}
        height={deskH * 0.2}
        rx={sw * 0.5}
        fill={stroke}
        fillOpacity={0.18}
        stroke={stroke}
        strokeWidth={sw * 0.45}
        strokeOpacity={0.35}
      />
      {standing && (
        <rect
          x={w * 0.08}
          y={deskY + deskH - sw * 2}
          width={w * 0.12}
          height={sw * 1.6}
          rx={sw * 0.3}
          fill={stroke}
          fillOpacity={0.45}
        />
      )}
    </g>
  );
};
