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
import { StorageRenderer } from './StorageRenderer';
import { DisplayRenderer } from './DisplayRenderer';
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

/**
 * True when we have a dedicated procedural silhouette for this type.
 * Catalog SVG is still preferred when available — procedural is the fallback.
 */
export function usesProceduralVisual(
  category?: string,
  elementType?: string,
): boolean {
  return resolveObjectKind(category, elementType) !== 'generic';
}

const KIND_COMPONENT: Record<FloorObjectKind, React.FC<FloorObjectVisualProps>> = {
  desk: DeskRenderer,
  corner_desk: DeskRenderer,
  monitor: DeskRenderer,
  chair: ChairRenderer,
  task_chair: ChairRenderer,
  guest_chair: ChairRenderer,
  meeting_chair: ChairRenderer,
  armchair: ChairRenderer,
  lounge_chair: ChairRenderer,
  bar_stool: ChairRenderer,
  couch: ChairRenderer,
  loveseat: ChairRenderer,
  sectional: ChairRenderer,
  meeting_table: MeetingTableRenderer,
  conference_table: MeetingTableRenderer,
  round_table: MeetingTableRenderer,
  square_table: MeetingTableRenderer,
  display: DisplayRenderer,
  plant: PlantRenderer,
  restroom: RestroomRenderer,
  phone_booth: PhoneBoothRenderer,
  pillar: PillarRenderer,
  cabin: CabinRenderer,
  storage: StorageRenderer,
  generic: GenericFurnitureRenderer,
};

/**
 * Visual layer only. Place/scale/rotate remain the caller's geometry responsibility.
 * Passes elementType so family renderers can pick the right subtype silhouette.
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
        elementType={elementType}
        category={category}
      />
    );
  },
);

FloorObjectRenderer.displayName = 'FloorObjectRenderer';
