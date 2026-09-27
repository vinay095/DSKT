import React, { memo } from 'react';
import type { ElementRenderState } from '../../../lib/categoryStyles';
import { getCategoryStyle } from '../../../lib/categoryStyles';
import { DeskRenderer } from './DeskRenderer';
import { ChairRenderer } from './ChairRenderer';
import { MeetingTableRenderer } from './MeetingTableRenderer';
import { PlantRenderer } from './PlantRenderer';
import { RestroomRenderer } from './RestroomRenderer';
import { PhoneBoothRenderer } from './PhoneBoothRenderer';
import { PillarRenderer } from './PillarRenderer';
import { CabinRenderer } from './CabinRenderer';
import { GenericFurnitureRenderer } from './GenericFurnitureRenderer';
import {
  pickDetailLevel,
  resolveObjectKind,
  type FloorObjectKind,
  type FloorObjectVisualProps,
} from './types';

export interface FloorObjectRendererProps {
  width: number;
  height: number;
  category?: string;
  elementType?: string;
  color?: string;
  renderState?: ElementRenderState;
  /** Force detail level; otherwise derived from on-screen size */
  detail?: 'simple' | 'detailed';
}

/** Known kinds use procedural architectural vectors (geometry-independent). */
export function usesProceduralVisual(
  category?: string,
  elementType?: string,
): boolean {
  return resolveObjectKind(category, elementType) !== 'generic';
}

const KIND_COMPONENT: Record<
  FloorObjectKind,
  React.FC<FloorObjectVisualProps>
> = {
  desk: DeskRenderer,
  chair: ChairRenderer,
  meeting_table: MeetingTableRenderer,
  plant: PlantRenderer,
  restroom: RestroomRenderer,
  phone_booth: PhoneBoothRenderer,
  pillar: PillarRenderer,
  cabin: CabinRenderer,
  storage: GenericFurnitureRenderer,
  generic: GenericFurnitureRenderer,
};

/**
 * Visual layer only. Place/scale/rotate remain the caller's geometry responsibility.
 */
export const FloorObjectRenderer: React.FC<FloorObjectRendererProps> = memo(
  ({
    width,
    height,
    category,
    elementType,
    color,
    renderState = 'default',
    detail,
  }) => {
    const kind = resolveObjectKind(category, elementType);
    const style = getCategoryStyle(category, elementType, color, renderState);
    const Comp = KIND_COMPONENT[kind];
    const resolvedDetail = detail ?? pickDetailLevel(width, height);

    return (
      <Comp
        width={width}
        height={height}
        fill={style.fill}
        stroke={style.stroke}
        fillOpacity={style.fillOpacity}
        strokeWidth={style.strokeWidth}
        renderState={renderState}
        detail={resolvedDetail}
      />
    );
  },
);

FloorObjectRenderer.displayName = 'FloorObjectRenderer';
