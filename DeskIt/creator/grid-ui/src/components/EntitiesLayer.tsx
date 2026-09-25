import React from 'react';
import type { Entity } from '../types/geometry';
import { entityWorldRect, isPolygonEntity } from '../geometry/entities';
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

        if (e.category === 'text') {
          const fontSize = (e.fontSize ?? 0.5) * a;
          const label = truncateLabel(rawLabel || 'Text', maxLabelChars(bounds.width, fontSize));
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
                  width={bounds.width}
                  height={bounds.height}
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

        if (isPolygonEntity(e)) {
          const outlinePts =
            e.outline && e.outline.length >= 3
              ? e.outline.map((v) => ({
                  x: (e.origin.col + v.col) * f,
                  y: (e.origin.row + v.row) * f,
                }))
              : [
                  { x: bounds.x, y: bounds.y },
                  { x: bounds.x + bounds.width, y: bounds.y },
                  { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
                  { x: bounds.x, y: bounds.y + bounds.height },
                ];
          const pts = outlinePts.map((p) => `${p.x},${p.y}`).join(' ');
          const fontSize = adaptiveLabelFontSize(bounds.width, bounds.height, {
            ratio: 0.2,
            min: f * 2,
            max: a * 0.4,
          });
          const label = truncateLabel(rawLabel, maxLabelChars(bounds.width, fontSize));
          return (
            <g
              key={e.objectId}
              id={`entity-${e.objectId}`}
              onMouseDown={(ev) => onEntityPointerDown?.(e.objectId, ev)}
              style={{ cursor: 'move' }}
            >
              <polygon
                points={pts}
                fill={color}
                fillOpacity={selected ? 0.4 : 0.25}
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
        }

        const fontSize = adaptiveLabelFontSize(bounds.width, bounds.height, {
          ratio: 0.28,
          min: f * 2,
          max: a * 0.45,
        });
        const label = truncateLabel(rawLabel, maxLabelChars(bounds.width, fontSize));

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
              width={bounds.width}
              height={bounds.height}
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
