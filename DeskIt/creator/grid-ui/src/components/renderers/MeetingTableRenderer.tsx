import React from 'react';
import type { FloorObjectVisualProps } from './types';
import { resolveObjectKind } from './types';

/** Meeting / conference / round / square tables — shape matches type. */
export const MeetingTableRenderer: React.FC<FloorObjectVisualProps> = (props) => {
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
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.015);
  const inset = Math.min(w, h) * 0.1;
  const fo = Math.min(fillOpacity + 0.25, 0.92);

  if (kind === 'round_table') {
    const r = Math.min(w, h) / 2 - inset * 0.25;
    return (
      <g>
        <circle cx={w / 2} cy={h / 2} r={r} fill={fill} fillOpacity={fo} stroke={stroke} strokeWidth={sw} />
        {detail === 'detailed' && (
          <>
            <circle
              cx={w / 2}
              cy={h / 2}
              r={r * 0.82}
              fill="none"
              stroke={stroke}
              strokeWidth={sw * 0.55}
              strokeOpacity={0.28}
            />
            <circle
              cx={w / 2}
              cy={h / 2}
              r={r * 0.22}
              fill="none"
              stroke={stroke}
              strokeWidth={sw * 0.5}
              strokeOpacity={0.22}
            />
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const rr = r * 0.9;
              return (
                <circle
                  key={deg}
                  cx={w / 2 + Math.cos(rad) * rr}
                  cy={h / 2 + Math.sin(rad) * rr}
                  r={Math.min(w, h) * 0.04}
                  fill={stroke}
                  fillOpacity={0.28}
                />
              );
            })}
          </>
        )}
      </g>
    );
  }

  if (kind === 'square_table') {
    const side = Math.min(w, h) - inset * 2;
    const x = (w - side) / 2;
    const y = (h - side) / 2;
    return (
      <g>
        <rect x={x} y={y} width={side} height={side} rx={sw} fill={fill} fillOpacity={fo} stroke={stroke} strokeWidth={sw} />
        {detail === 'detailed' && (
          <>
            <rect
              x={x + side * 0.12}
              y={y + side * 0.12}
              width={side * 0.76}
              height={side * 0.76}
              rx={sw}
              fill="none"
              stroke={stroke}
              strokeWidth={sw * 0.55}
              strokeOpacity={0.28}
            />
            <rect
              x={x + side * 0.28}
              y={y + side * 0.28}
              width={side * 0.44}
              height={side * 0.44}
              rx={sw * 0.6}
              fill="none"
              stroke={stroke}
              strokeWidth={sw * 0.4}
              strokeOpacity={0.18}
            />
          </>
        )}
      </g>
    );
  }

  // Conference: elongated racetrack; meeting: rounded rectangle with seat ticks
  const isConference = kind === 'conference_table';
  const rx = isConference ? Math.min(w, h) * 0.28 : Math.min(w, h) * 0.1;

  return (
    <g>
      <rect
        x={inset * 0.6}
        y={inset}
        width={w - inset * 1.2}
        height={h - inset * 2}
        rx={rx}
        fill={fill}
        fillOpacity={fo}
        stroke={stroke}
        strokeWidth={sw}
      />
      {detail === 'detailed' && (
        <>
          {/* Edge band / wood grain hint */}
          <rect
            x={inset * 0.6 + (w - inset * 1.2) * 0.08}
            y={inset + (h - inset * 2) * 0.18}
            width={(w - inset * 1.2) * 0.84}
            height={(h - inset * 2) * 0.64}
            rx={isConference ? rx * 0.7 : sw}
            fill="none"
            stroke={stroke}
            strokeWidth={sw * 0.5}
            strokeOpacity={0.22}
          />
          <line
            x1={w * 0.22}
            y1={h * 0.42}
            x2={w * 0.78}
            y2={h * 0.42}
            stroke={stroke}
            strokeWidth={sw * 0.35}
            strokeOpacity={0.12}
          />
          <line
            x1={w * 0.22}
            y1={h * 0.58}
            x2={w * 0.78}
            y2={h * 0.58}
            stroke={stroke}
            strokeWidth={sw * 0.35}
            strokeOpacity={0.12}
          />
          {/* Seat ticks along long edges */}
          {Array.from({ length: isConference ? 5 : 4 }).map((_, i) => {
            const n = isConference ? 5 : 4;
            const t = (i + 1) / (n + 1);
            const cx = inset * 0.6 + (w - inset * 1.2) * t;
            const tick = Math.min(w, h) * 0.035;
            return (
              <g key={i}>
                <circle cx={cx} cy={inset * 0.55} r={tick} fill={stroke} fillOpacity={0.28} />
                <circle cx={cx} cy={h - inset * 0.55} r={tick} fill={stroke} fillOpacity={0.28} />
              </g>
            );
          })}
        </>
      )}
    </g>
  );
};
