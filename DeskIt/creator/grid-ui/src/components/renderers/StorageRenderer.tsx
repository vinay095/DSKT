import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Pedestal / drawer / cabinet / wardrobe — readable as storage from above. */
export const StorageRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
  detail = 'detailed',
  elementType,
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.02);
  const inset = Math.min(w, h) * 0.06;
  const rx = Math.min(w, h) * 0.06;
  const fo = Math.min(fillOpacity + 0.28, 0.94);
  const type = (elementType || '').toLowerCase();
  const isWardrobe = type.includes('wardrobe');
  const isWide = type.includes('drawerr') || w > h * 1.35;
  const isPedestal = type.includes('drawer') && !isWide;

  if (isWardrobe) {
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
        <line
          x1={w / 2}
          y1={inset}
          x2={w / 2}
          y2={h - inset}
          stroke={stroke}
          strokeWidth={sw}
          strokeOpacity={0.55}
        />
        {detail === 'detailed' && (
          <>
            <circle cx={w * 0.42} cy={h / 2} r={Math.min(w, h) * 0.04} fill={stroke} fillOpacity={0.5} />
            <circle cx={w * 0.58} cy={h / 2} r={Math.min(w, h) * 0.04} fill={stroke} fillOpacity={0.5} />
          </>
        )}
      </g>
    );
  }

  if (isWide) {
    const mid = w / 2;
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
        <line
          x1={mid}
          y1={inset + sw}
          x2={mid}
          y2={h - inset - sw}
          stroke={stroke}
          strokeWidth={sw * 0.8}
          strokeOpacity={0.45}
        />
        {detail === 'detailed' &&
          [0.28, 0.5, 0.72].map((t) => (
            <React.Fragment key={t}>
              <line
                x1={inset + sw * 2}
                y1={inset + (h - inset * 2) * t}
                x2={mid - sw}
                y2={inset + (h - inset * 2) * t}
                stroke={stroke}
                strokeWidth={sw * 0.5}
                strokeOpacity={0.3}
              />
              <line
                x1={mid + sw}
                y1={inset + (h - inset * 2) * t}
                x2={w - inset - sw * 2}
                y2={inset + (h - inset * 2) * t}
                stroke={stroke}
                strokeWidth={sw * 0.5}
                strokeOpacity={0.3}
              />
            </React.Fragment>
          ))}
        <rect
          x={w * 0.22}
          y={h * 0.45}
          width={w * 0.08}
          height={h * 0.1}
          rx={sw * 0.4}
          fill={stroke}
          fillOpacity={0.45}
        />
        <rect
          x={w * 0.7}
          y={h * 0.45}
          width={w * 0.08}
          height={h * 0.1}
          rx={sw * 0.4}
          fill={stroke}
          fillOpacity={0.45}
        />
      </g>
    );
  }

  const drawers = isPedestal ? 3 : 2;
  return (
    <g>
      <ellipse cx={w / 2} cy={h * 0.92} rx={w * 0.36} ry={h * 0.05} fill={stroke} fillOpacity={0.1} />
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
      {detail === 'detailed' &&
        Array.from({ length: drawers }).map((_, i) => {
          const gap = (h - inset * 2) / drawers;
          const y = inset + gap * i + gap * 0.12;
          return (
            <g key={i}>
              <rect
                x={inset + sw * 1.5}
                y={y}
                width={w - inset * 2 - sw * 3}
                height={gap * 0.7}
                rx={sw * 0.5}
                fill="none"
                stroke={stroke}
                strokeWidth={sw * 0.6}
                strokeOpacity={0.45}
              />
              <rect
                x={w * 0.42}
                y={y + gap * 0.28}
                width={w * 0.16}
                height={gap * 0.14}
                rx={sw * 0.3}
                fill={stroke}
                fillOpacity={0.45}
              />
            </g>
          );
        })}
    </g>
  );
};
