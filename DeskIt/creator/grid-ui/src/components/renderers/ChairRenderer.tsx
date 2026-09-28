import React from 'react';
import type { FloorObjectVisualProps } from './types';
import { resolveObjectKind } from './types';

/** Top-down seating — distinct silhouettes per chair / lounge type. */
export const ChairRenderer: React.FC<FloorObjectVisualProps> = (props) => {
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
  const sw = Math.max(strokeWidth * 0.4, Math.min(w, h) * 0.035);
  const cx = w / 2;
  const cy = h / 2;
  const fo = Math.min(fillOpacity + 0.25, 0.92);

  if (kind === 'bar_stool') {
    const r = Math.min(w, h) * 0.28;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r * 1.15} fill="none" stroke={stroke} strokeWidth={sw * 0.7} strokeOpacity={0.35} />
        <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={fo} stroke={stroke} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r * 0.35} fill={stroke} fillOpacity={0.35} />
      </g>
    );
  }

  if (kind === 'couch' || kind === 'loveseat' || kind === 'sectional') {
    const inset = Math.min(w, h) * 0.06;
    const backH = h * (kind === 'sectional' ? 0.28 : 0.32);
    const armW = w * (kind === 'loveseat' ? 0.12 : 0.1);
    return (
      <g>
        <rect
          x={inset}
          y={inset + backH * 0.35}
          width={w - inset * 2}
          height={h - inset * 2 - backH * 0.35}
          rx={Math.min(w, h) * 0.08}
          fill={fill}
          fillOpacity={fo}
          stroke={stroke}
          strokeWidth={sw}
        />
        {/* Back cushion */}
        <rect
          x={inset + armW}
          y={inset}
          width={w - inset * 2 - armW * 2}
          height={backH}
          rx={sw}
          fill={stroke}
          fillOpacity={0.72}
        />
        {/* Arms */}
        <rect x={inset} y={inset + backH * 0.2} width={armW} height={h * 0.55} rx={sw} fill={stroke} fillOpacity={0.55} />
        <rect
          x={w - inset - armW}
          y={inset + backH * 0.2}
          width={armW}
          height={h * 0.55}
          rx={sw}
          fill={stroke}
          fillOpacity={0.55}
        />
        {kind === 'couch' && detail === 'detailed' && (
          <line
            x1={cx}
            y1={inset + backH + sw}
            x2={cx}
            y2={h - inset - sw}
            stroke={stroke}
            strokeWidth={sw * 0.6}
            strokeOpacity={0.25}
          />
        )}
        {kind === 'sectional' && (
          <rect
            x={w * 0.55}
            y={h * 0.45}
            width={w * 0.38 - inset}
            height={h * 0.45 - inset}
            rx={sw}
            fill={stroke}
            fillOpacity={0.2}
          />
        )}
      </g>
    );
  }

  if (kind === 'armchair' || kind === 'lounge_chair') {
    const seatR = Math.min(w, h) * (kind === 'lounge_chair' ? 0.36 : 0.3);
    const deep = kind === 'lounge_chair';
    return (
      <g>
        <ellipse cx={cx} cy={h * 0.88} rx={seatR * 1.05} ry={h * 0.06} fill={stroke} fillOpacity={0.1} />
        <ellipse
          cx={cx}
          cy={cy + (deep ? seatR * 0.05 : 0)}
          rx={seatR * (deep ? 1.15 : 1)}
          ry={seatR * (deep ? 0.95 : 0.82)}
          fill={fill}
          fillOpacity={fo}
          stroke={stroke}
          strokeWidth={sw}
        />
        {/* Wide back */}
        <path
          d={`M ${cx - seatR * 0.95} ${cy - seatR * 0.15}
              Q ${cx} ${cy - seatR * (deep ? 1.45 : 1.25)} ${cx + seatR * 0.95} ${cy - seatR * 0.15}
              L ${cx + seatR * 0.7} ${cy + seatR * 0.1}
              Q ${cx} ${cy - seatR * 0.7} ${cx - seatR * 0.7} ${cy + seatR * 0.1} Z`}
          fill={stroke}
          fillOpacity={0.75}
        />
        {/* Arms */}
        <ellipse cx={cx - seatR * 0.95} cy={cy + seatR * 0.15} rx={seatR * 0.22} ry={seatR * 0.45} fill={stroke} fillOpacity={0.45} />
        <ellipse cx={cx + seatR * 0.95} cy={cy + seatR * 0.15} rx={seatR * 0.22} ry={seatR * 0.45} fill={stroke} fillOpacity={0.45} />
      </g>
    );
  }

  // Task / guest / meeting / default office chair
  const seatR = Math.min(w, h) * (kind === 'guest_chair' ? 0.28 : 0.32);
  const hasArms = kind === 'task_chair' || kind === 'meeting_chair' || kind === 'chair';
  const slimBack = kind === 'guest_chair';

  if (detail === 'simple') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={seatR} fill={fill} fillOpacity={fo} stroke={stroke} strokeWidth={sw} />
        <rect
          x={cx - seatR * (slimBack ? 0.55 : 0.7)}
          y={cy - seatR * 1.15}
          width={seatR * (slimBack ? 1.1 : 1.4)}
          height={seatR * 0.32}
          rx={sw}
          fill={stroke}
          fillOpacity={0.75}
        />
      </g>
    );
  }

  return (
    <g>
      <ellipse cx={cx} cy={h * 0.88} rx={seatR * 0.9} ry={h * 0.055} fill={stroke} fillOpacity={0.12} />
      {/* 5-star base for task chairs */}
      {kind === 'task_chair' && (
        <>
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x2 = cx + Math.cos(rad) * seatR * 1.15;
            const y2 = cy + Math.sin(rad) * seatR * 0.55 + seatR * 0.25;
            return (
              <line
                key={deg}
                x1={cx}
                y1={cy + seatR * 0.25}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={sw * 0.7}
                strokeOpacity={0.4}
              />
            );
          })}
        </>
      )}
      {hasArms && (
        <>
          <rect x={cx - seatR * 1.15} y={cy - seatR * 0.05} width={seatR * 0.28} height={seatR * 0.55} rx={sw} fill={stroke} fillOpacity={0.4} />
          <rect x={cx + seatR * 0.87} y={cy - seatR * 0.05} width={seatR * 0.28} height={seatR * 0.55} rx={sw} fill={stroke} fillOpacity={0.4} />
        </>
      )}
      <ellipse
        cx={cx}
        cy={cy + seatR * 0.12}
        rx={seatR}
        ry={seatR * 0.82}
        fill={fill}
        fillOpacity={fo}
        stroke={stroke}
        strokeWidth={sw}
      />
      <path
        d={`M ${cx - seatR * (slimBack ? 0.55 : 0.75)} ${cy - seatR * 0.3}
            Q ${cx} ${cy - seatR * (slimBack ? 1.15 : 1.35)} ${cx + seatR * (slimBack ? 0.55 : 0.75)} ${cy - seatR * 0.3}
            L ${cx + seatR * 0.5} ${cy - seatR * 0.02}
            Q ${cx} ${cy - seatR * 0.8} ${cx - seatR * 0.5} ${cy - seatR * 0.02} Z`}
        fill={stroke}
        fillOpacity={0.78}
        stroke={stroke}
        strokeWidth={sw * 0.5}
      />
    </g>
  );
};
