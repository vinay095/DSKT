import React, { useMemo } from 'react';
import { Group, Layer, Line, Rect, Text } from 'react-konva';
import type { FloorObject, Team } from '@/types/floorPlan';
import { PIXELS_PER_UNIT } from '@/utils/coordinates';
import { findCollisions, isOutsideFloor } from '@/utils/collision';
import { getObjectVisual, shortLabel } from './objectStyles';

interface ObjectsLayerProps {
  objects: FloorObject[];
  teams: Team[];
  selectedIds: string[];
  floorWidth: number;
  floorHeight: number;
  zoom: number;
  interactive: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: () => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

function FloorObjectNode({
  obj,
  team,
  selected,
  colliding,
  outside,
  zoom,
  interactive,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  obj: FloorObject;
  team?: Team;
  selected: boolean;
  colliding: boolean;
  outside: boolean;
  zoom: number;
  interactive: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: () => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const visual = getObjectVisual(obj, team);
  const w = obj.width * PIXELS_PER_UNIT;
  const h = obj.height * PIXELS_PER_UNIT;
  const label = shortLabel(obj);
  const fontSize = Math.max(8, Math.min(14, 11 / Math.sqrt(zoom)));

  const warn = colliding || outside;

  return (
    <Group
      id={obj.id}
      name={obj.id}
      x={obj.x * PIXELS_PER_UNIT}
      y={obj.y * PIXELS_PER_UNIT}
      width={w}
      height={h}
      rotation={obj.rotation}
      draggable={interactive}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(obj.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(obj.id, false);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStart();
      }}
      onDragMove={(e) => {
        const node = e.target;
        onDragMove(obj.id, node.x() / PIXELS_PER_UNIT, node.y() / PIXELS_PER_UNIT);
      }}
      onDragEnd={(e) => {
        const node = e.target;
        onDragEnd(obj.id, node.x() / PIXELS_PER_UNIT, node.y() / PIXELS_PER_UNIT);
      }}
    >
      <Rect
        width={w}
        height={h}
        fill={warn ? '#fecaca' : visual.fill}
        stroke={selected ? '#0f172a' : warn ? '#dc2626' : visual.stroke}
        strokeWidth={(selected ? 2 : visual.strokeWidth) / zoom}
        dash={visual.dash}
        opacity={visual.opacity}
        cornerRadius={visual.cornerRadius ?? 0}
        shadowEnabled={selected}
        shadowColor="rgba(15,23,42,0.25)"
        shadowBlur={selected ? 6 : 0}
        shadowOpacity={0.4}
      />
      {visual.hatch && (
        <Line
          points={[0, 0, w, h, 0, h, w, 0]}
          stroke={visual.stroke}
          strokeWidth={0.8 / zoom}
          opacity={0.35}
          listening={false}
        />
      )}
      {obj.type === 'desk' && team && (
        <Rect
          x={0}
          y={0}
          width={4 / zoom}
          height={h}
          fill={team.color}
          listening={false}
        />
      )}
      {label && w > 20 && h > 12 && (
        <Text
          text={label}
          width={w}
          height={h}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize}
          fontFamily="IBM Plex Sans, system-ui, sans-serif"
          fill={visual.labelColor}
          listening={false}
          padding={2}
          ellipsis
          wrap="none"
        />
      )}
      {obj.type === 'desk' && team && w > 40 && (
        <Text
          text={team.name.slice(0, 3).toUpperCase()}
          x={6 / zoom}
          y={2 / zoom}
          fontSize={Math.max(7, 8 / zoom)}
          fontFamily="IBM Plex Sans, system-ui, sans-serif"
          fill={team.color}
          fontStyle="bold"
          listening={false}
        />
      )}
    </Group>
  );
}

export const ObjectsLayer: React.FC<ObjectsLayerProps> = ({
  objects,
  teams,
  selectedIds,
  floorWidth,
  floorHeight,
  zoom,
  interactive,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const ordered = useMemo(() => {
    const layerOrder = { spaces: 0, infrastructure: 1, furniture: 2, seating: 3, annotation: 4 };
    return [...objects].sort(
      (a, b) => (layerOrder[a.layer] ?? 0) - (layerOrder[b.layer] ?? 0),
    );
  }, [objects]);

  const collisionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const obj of objects) {
      if (selectedSet.has(obj.id) || obj.mobility === 'movable') {
        const hits = findCollisions(obj, objects);
        if (hits.length) map.set(obj.id, hits);
      }
    }
    return map;
  }, [objects, selectedSet]);

  return (
    <Layer>
      {/* Floor boundary */}
      <Rect
        x={0}
        y={0}
        width={floorWidth * PIXELS_PER_UNIT}
        height={floorHeight * PIXELS_PER_UNIT}
        stroke="#0f172a"
        strokeWidth={2 / zoom}
        fillEnabled={false}
        listening={false}
      />
      <Text
        text="OFFICE FLOOR"
        x={8}
        y={-18 / zoom}
        fontSize={11 / zoom}
        fontFamily="IBM Plex Sans, system-ui, sans-serif"
        fill="#64748b"
        listening={false}
      />

      {ordered.map((obj) => {
        const teamId = obj.properties.teamId as string | null | undefined;
        const team = teamId ? teamMap.get(teamId) : undefined;
        return (
          <FloorObjectNode
            key={obj.id}
            obj={obj}
            team={team}
            selected={selectedSet.has(obj.id)}
            colliding={!!collisionMap.get(obj.id)?.length}
            outside={isOutsideFloor(obj, floorWidth, floorHeight)}
            zoom={zoom}
            interactive={interactive}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </Layer>
  );
};
