import React from 'react';
import { FloorConfig } from '../../types/geometry';
import { DEFAULT_FLOOR_CONFIG, getFloorWorldDimensions } from '../../geometry/grid';

interface FloorBoundaryProps {
  floorConfig?: FloorConfig;
  outerMargin?: number;
}

export const FloorBoundary: React.FC<FloorBoundaryProps> = ({
  floorConfig = DEFAULT_FLOOR_CONFIG,
  outerMargin = 2000,
}) => {
  const { width: worldW, height: worldH } = getFloorWorldDimensions(floorConfig);

  // Outer workspace bounds
  const outerX = -outerMargin;
  const outerY = -outerMargin;
  const outerW = worldW + outerMargin * 2;
  const outerH = worldH + outerMargin * 2;

  // Mask path for outside floor area (outer rect with floor rect cut out)
  const maskPath = `M ${outerX} ${outerY} h ${outerW} v ${outerH} h ${-outerW} Z M 0 0 v ${worldH} h ${worldW} v ${-worldH} Z`;

  return (
    <g className="pointer-events-none select-none">
      {/* Floor Main Background (First Quadrant) */}
      <rect
        x={0}
        y={0}
        width={worldW}
        height={worldH}
        className="fill-white dark:fill-[#0d0918] transition-colors"
      />

      {/* Muted Region Outside Floor Boundary */}
      <path
        d={maskPath}
        fillRule="evenodd"
        className="fill-slate-200/80 dark:fill-[#05030a]/90 backdrop-blur-sm"
      />

      {/* Floor Boundary Outline */}
      <rect
        x={0}
        y={0}
        width={worldW}
        height={worldH}
        className="fill-none stroke-brandBlue-600 dark:stroke-brandPurple-500 stroke-[3] stroke-round"
      />

      {/* Floor Origin (0,0) Marker */}
      <circle cx={0} cy={0} r={4} className="fill-brandBlue-600 dark:fill-brandPurple-400" />
      <text
        x={8}
        y={-8}
        transform="scale(1, -1)"
        className="text-[10px] font-mono font-bold fill-brandBlue-600 dark:fill-brandPurple-400"
      >
        Origin (0,0)
      </text>

      {/* Top-Right Corner Tag */}
      <text
        x={worldW - 75}
        y={-(worldH + 8)}
        transform="scale(1, -1)"
        className="text-[10px] font-mono font-bold fill-light-muted dark:fill-dark-muted"
      >
        {worldW}x{worldH}
      </text>
    </g>
  );
};
