import React from 'react';
import type { Entity } from '../types/geometry';
import { KIND_COLORS } from '../lib/library';

interface EntitiesLayerProps {
  entities: Entity[];
  selectedIds: Set<string>;
  onEntityPointerDown?: (id: string, e: React.MouseEvent) => void;
}

const EntitiesLayer: React.FC<EntitiesLayerProps> = ({
  entities,
  selectedIds,
  onEntityPointerDown,
}) => {
  return (
    <g id="entities">
      {entities.map((e) => {
        const color = KIND_COLORS[e.kind] ?? '#94a3b8';
        const selected = selectedIds.has(e.id);
        const label = e.label ?? e.kind.replace('_', ' ');

        if (e.kind === 'polygon' && e.points && e.points.length >= 2) {
          const pts = e.points.map((p) => `${p.x},${p.y}`).join(' ');
          const cx =
            e.points.reduce((s, p) => s + p.x, 0) / Math.max(1, e.points.length);
          const cy =
            e.points.reduce((s, p) => s + p.y, 0) / Math.max(1, e.points.length);
          return (
            <g
              key={e.id}
              id={`entity-${e.id}`}
              onMouseDown={(ev) => onEntityPointerDown?.(e.id, ev)}
              style={{ cursor: 'move' }}
            >
              <polygon
                points={pts}
                fill={color}
                fillOpacity={selected ? 0.35 : 0.18}
                stroke={selected ? '#22c55e' : color}
                strokeWidth={selected ? 2 : 1.5}
                vectorEffect="non-scaling-stroke"
              />
              <g transform={`translate(${cx}, ${cy}) scale(1, -1)`} pointerEvents="none">
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={0.35}
                  fill="currentColor"
                  className="entity-label"
                >
                  {label}
                </text>
              </g>
            </g>
          );
        }

        const cx = e.x + e.width / 2;
        const cy = e.y + e.height / 2;
        const fontSize = Math.min(e.width, e.height) * 0.28;

        return (
          <g
            key={e.id}
            id={`entity-${e.id}`}
            onMouseDown={(ev) => onEntityPointerDown?.(e.id, ev)}
            style={{ cursor: 'move' }}
          >
            <rect
              x={e.x}
              y={e.y}
              width={e.width}
              height={e.height}
              fill={color}
              fillOpacity={selected ? 0.35 : 0.2}
              stroke={selected ? '#22c55e' : color}
              strokeWidth={selected ? 2 : 1.5}
              vectorEffect="non-scaling-stroke"
              rx={0.05}
            />
            <g transform={`translate(${cx}, ${cy}) scale(1, -1)`} pointerEvents="none">
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="currentColor"
                className="entity-label"
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
