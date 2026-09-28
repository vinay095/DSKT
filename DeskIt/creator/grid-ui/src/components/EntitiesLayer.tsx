import React from 'react';
import type { Entity } from '../types/geometry';
import { entityWorldRect } from '../geometry/entities';
import { FINEST_PER_A } from '../geometry/grid';
import {
  adaptiveLabelFontSize,
  maxLabelChars,
  readableLabelTransform,
  truncateLabel,
} from '../geometry/labels';

interface EntitiesLayerProps {
  entities: Entity[];
  selectedIds: Set<string>;
  a: number;
  colorFor: (entity: Entity) => string;
  onEntityPointerDown?: (id: string, e: React.MouseEvent) => void;
}

/**
 * Creator editor canvas: schematic AABB rectangles only.
 * Catalog SVGs / freeform silhouettes / procedural furniture art belong in
 * PrettyFloorView (Preview) and frontend PublishedFloorMap — not on the edit grid.
 */
const EntitiesLayer: React.FC<EntitiesLayerProps> = ({
  entities,
  selectedIds,
  a,
  colorFor,
  onEntityPointerDown,
}) => {
  const f = a / FINEST_PER_A;

  return (
    <g id="entities">
      {entities.map((e) => {
        const color = colorFor(e);
        const selected = selectedIds.has(e.objectId);
        const rawLabel = e.label ?? e.elementType.replace(/_/g, ' ');
        const bounds = entityWorldRect(e, a);
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const rot = e.rotation ?? 0;
        const w = bounds.width;
        const h = bounds.height;

        if (e.category === 'text') {
          const fontSize = (e.fontSize ?? 0.5) * a;
          const label = truncateLabel(rawLabel || 'Text', maxLabelChars(w, fontSize));
          return (
            <g
              key={e.objectId}
              id={`entity-${e.objectId}`}
              onMouseDown={(ev) => onEntityPointerDown?.(e.objectId, ev)}
              style={{ cursor: 'move' }}
            >
              {selected && (
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              )}
              <g
                transform={readableLabelTransform(cx, cy, rot)}
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fill={color}
                  className="entity-label text-block-label"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {label}
                </text>
              </g>
            </g>
          );
        }

        const fontSize = adaptiveLabelFontSize(w, h, {
          ratio: 0.28,
          min: f * 2,
          max: a * 0.45,
        });
        const label = truncateLabel(rawLabel, maxLabelChars(w, fontSize));

        return (
          <g
            key={e.objectId}
            id={`entity-${e.objectId}`}
            onMouseDown={(ev) => onEntityPointerDown?.(e.objectId, ev)}
            style={{ cursor: 'move' }}
          >
            <rect
              x={bounds.x}
              y={bounds.y}
              width={w}
              height={h}
              fill={color}
              fillOpacity={selected ? 0.35 : 0.2}
              stroke={selected ? '#22c55e' : color}
              strokeWidth={selected ? 2 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
            <g
              transform={readableLabelTransform(cx, cy, rot)}
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="currentColor"
                className="entity-label"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

export default EntitiesLayer;
