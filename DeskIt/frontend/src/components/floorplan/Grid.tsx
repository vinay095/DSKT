import React from 'react';
import { FloorConfig } from '../../types/geometry';
import { DEFAULT_FLOOR_CONFIG, getFloorWorldDimensions, getGridStep } from '../../geometry/grid';

interface GridProps {
  floorConfig?: FloorConfig;
  zoom: number;
  showGrid?: boolean;
}

export const Grid: React.FC<GridProps> = ({
  floorConfig = DEFAULT_FLOOR_CONFIG,
  zoom,
  showGrid = true,
}) => {
  if (!showGrid) return null;

  const { width: worldW, height: worldH } = getFloorWorldDimensions(floorConfig);

  const step2A = getGridStep('2a', floorConfig);
  const stepA = getGridStep('a', floorConfig);
  const stepA4 = getGridStep('a/4', floorConfig);
  const stepA16 = getGridStep('a/16', floorConfig);

  const showFinest = zoom >= 1.2;
  const showPlacement = zoom >= 0.5;

  const linesFinest: React.ReactNode[] = [];
  const linesPlacement: React.ReactNode[] = [];
  const linesBase: React.ReactNode[] = [];
  const linesCoarse: React.ReactNode[] = [];

  // Finest a/16 lines
  if (showFinest) {
    for (let x = 0; x <= worldW; x += stepA16) {
      if (x % stepA4 !== 0) {
        linesFinest.push(
          <line key={`f-v-${x}`} x1={x} y1={0} x2={x} y2={worldH} className="stroke-slate-200/40 dark:stroke-purple-900/20 stroke-[0.5]" />
        );
      }
    }
    for (let y = 0; y <= worldH; y += stepA16) {
      if (y % stepA4 !== 0) {
        linesFinest.push(
          <line key={`f-h-${y}`} x1={0} y1={y} x2={worldW} y2={y} className="stroke-slate-200/40 dark:stroke-purple-900/20 stroke-[0.5]" />
        );
      }
    }
  }

  // Placement a/4 lines
  if (showPlacement) {
    for (let x = 0; x <= worldW; x += stepA4) {
      if (x % stepA !== 0) {
        linesPlacement.push(
          <line key={`p-v-${x}`} x1={x} y1={0} x2={x} y2={worldH} className="stroke-slate-300/60 dark:stroke-purple-900/40 stroke-[1]" />
        );
      }
    }
    for (let y = 0; y <= worldH; y += stepA4) {
      if (y % stepA !== 0) {
        linesPlacement.push(
          <line key={`p-h-${y}`} x1={0} y1={y} x2={worldW} y2={y} className="stroke-slate-300/60 dark:stroke-purple-900/40 stroke-[1]" />
        );
      }
    }
  }

  // Base unit 'a' lines
  for (let x = 0; x <= worldW; x += stepA) {
    if (x % step2A !== 0) {
      linesBase.push(
        <line key={`a-v-${x}`} x1={x} y1={0} x2={x} y2={worldH} className="stroke-brandBlue-300/70 dark:stroke-brandPurple-700/50 stroke-[1.5]" />
      );
    }
  }
  for (let y = 0; y <= worldH; y += stepA) {
    if (y % step2A !== 0) {
      linesBase.push(
        <line key={`a-h-${y}`} x1={0} y1={y} x2={worldW} y2={y} className="stroke-brandBlue-300/70 dark:stroke-brandPurple-700/50 stroke-[1.5]" />
      );
    }
  }

  // Coarse 2a lines
  for (let x = 0; x <= worldW; x += step2A) {
    linesCoarse.push(
      <line key={`2a-v-${x}`} x1={x} y1={0} x2={x} y2={worldH} className="stroke-brandBlue-500/80 dark:stroke-brandPurple-500/70 stroke-[2]" />
    );
  }
  for (let y = 0; y <= worldH; y += step2A) {
    linesCoarse.push(
      <line key={`2a-h-${y}`} x1={0} y1={y} x2={worldW} y2={y} className="stroke-brandBlue-500/80 dark:stroke-brandPurple-500/70 stroke-[2]" />
    );
  }

  return (
    <g className="pointer-events-none select-none">
      {linesFinest}
      {linesPlacement}
      {linesBase}
      {linesCoarse}
    </g>
  );
};
