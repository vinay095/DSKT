import React from 'react';
import type { FloorObjectVisualProps } from './types';

/** Conference / meeting table with subtle seating marks. */
export const MeetingTableRenderer: React.FC<FloorObjectVisualProps> = ({
  width: w,
  height: h,
  fill,
  stroke,
  fillOpacity,
  strokeWidth,
  detail = 'detailed',
}) => {
  const sw = Math.max(strokeWidth * 0.35, Math.min(w, h) * 0.015);
  const inset = Math.min(w, h) * 0.12;
  const isRound = Math.abs(w - h) / Math.max(w, h) < 0.25;

  if (isRound) {
    const r = Math.min(w, h) / 2 - inset * 0.3;
    return (
      <g>
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={r}
          ry={r * 0.95}
          fill={fill}
          fillOpacity={Math.min(fillOpacity + 0.25, 0.9)}
          stroke={stroke}
          strokeWidth={sw}
        />
        {detail === 'detailed' && (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={r * 0.55}
            ry={r * 0.5}
            fill="none"
            stroke={stroke}
            strokeWidth={sw * 0.5}
            strokeOpacity={0.25}
          />
        )}
      </g>
    );
  }

  return (
    <g>
      <rect
        x={inset}
        y={inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.min(w, h) * 0.12}
        fill={fill}
        fillOpacity={Math.min(fillOpacity + 0.25, 0.9)}
        stroke={stroke}
        strokeWidth={sw}
      />
      {detail === 'detailed' && (
        <>
          <rect
            x={inset + sw}
            y={inset + sw}
            width={w - inset * 2 - sw * 2}
            height={(h - inset * 2) * 0.18}
            rx={sw}
            fill="#FFFFFF"
            fillOpacity={0.15}
          />
          {/* Seat ticks along long edges */}
          {[0.2, 0.4, 0.6, 0.8].map((t) => (
            <React.Fragment key={t}>
              <circle
                cx={inset + (w - inset * 2) * t}
                cy={inset * 0.45}
                r={Math.min(w, h) * 0.04}
                fill={stroke}
                fillOpacity={0.35}
              />
              <circle
                cx={inset + (w - inset * 2) * t}
                cy={h - inset * 0.45}
                r={Math.min(w, h) * 0.04}
                fill={stroke}
                fillOpacity={0.35}
              />
            </React.Fragment>
          ))}
        </>
      )}
    </g>
  );
};
