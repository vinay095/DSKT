import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useFloorPlan } from '@/app/providers/FloorPlanProvider';
import {
  PIXELS_PER_UNIT,
  clampZoom,
  screenToWorld,
  snapToGrid,
  ZOOM_MAX,
  ZOOM_MIN,
} from '@/utils/coordinates';
import { GridLayer } from './GridLayer';
import { ObjectsLayer } from './ObjectsLayer';

interface FloorPlanCanvasProps {
  width: number;
  height: number;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ width, height }) => {
  const {
    state,
    dispatch,
    addElementAt,
    beginTransform,
    endTransform,
    updateLive,
  } = useFloorPlan();

  const {
    document: doc,
    selectedIds,
    tool,
    viewport,
    snapEnabled,
    gridVisible,
  } = state;

  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const spaceDown = useRef(false);
  const panning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const multiDragOrigin = useRef<Map<string, { x: number; y: number }> | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Attach transformer to selected nodes
  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;

    if (selectedIds.length === 1 && tool === 'select') {
      const node = stage.findOne(`#${selectedIds[0]}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, tool, doc.objects]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceDown.current = true;
        setIsPanning(true);
        e.preventDefault();
      }
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((meta && e.key === 'y') || (meta && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        dispatch({ type: 'DELETE_SELECTED' });
      }
      if (meta && e.key === 'd') {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_SELECTED' });
      }
      if (e.key === 'v' || e.key === 'V') dispatch({ type: 'SET_TOOL', tool: 'select' });
      if (e.key === 'h' || e.key === 'H') dispatch({ type: 'SET_TOOL', tool: 'pan' });
      if (e.key === 'Escape') dispatch({ type: 'CLEAR_SELECTION' });
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false;
        setIsPanning(false);
        panning.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dispatch]);

  const zoomAt = useCallback(
    (nextZoom: number, anchorX: number, anchorY: number) => {
      const z = clampZoom(nextZoom);
      const world = screenToWorld(anchorX, anchorY, viewport);
      const newPanX = anchorX - world.x * z * PIXELS_PER_UNIT;
      const newPanY = anchorY - world.y * z * PIXELS_PER_UNIT;
      dispatch({
        type: 'SET_VIEWPORT',
        viewport: { zoom: z, panX: newPanX, panY: newPanY },
      });
    },
    [dispatch, viewport],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1 + direction * 0.1;
      zoomAt(viewport.zoom * factor, pointer.x, pointer.y);
    },
    [viewport.zoom, zoomAt],
  );

  const shouldPan = tool === 'pan' || spaceDown.current;

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const isMiddle = e.evt.button === 1;
    if (shouldPan || isMiddle) {
      panning.current = true;
      setIsPanning(true);
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }
    if (e.target === e.target.getStage()) {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };

  const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (pos) {
      const world = screenToWorld(pos.x, pos.y, viewport);
      dispatch({ type: 'SET_POINTER', x: world.x, y: world.y });
    }
    if (panning.current) {
      const dx = e.evt.clientX - lastPointer.current.x;
      const dy = e.evt.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      dispatch({
        type: 'SET_VIEWPORT',
        viewport: {
          panX: viewport.panX + dx,
          panY: viewport.panY + dy,
        },
      });
    }
  };

  const onMouseUp = () => {
    panning.current = false;
    if (!spaceDown.current && tool !== 'pan') setIsPanning(false);
  };

  const snap = useCallback(
    (v: number) => snapToGrid(v, doc.floor.gridSize, snapEnabled),
    [doc.floor.gridSize, snapEnabled],
  );

  const onDragStart = useCallback(() => {
    beginTransform();
    if (selectedIds.length > 1) {
      const map = new Map<string, { x: number; y: number }>();
      for (const id of selectedIds) {
        const o = doc.objects.find((x) => x.id === id);
        if (o) map.set(id, { x: o.x, y: o.y });
      }
      multiDragOrigin.current = map;
    } else {
      multiDragOrigin.current = null;
    }
  }, [beginTransform, selectedIds, doc.objects]);

  const onDragMove = useCallback(
    (id: string, x: number, y: number) => {
      const sx = snap(x);
      const sy = snap(y);
      const origins = multiDragOrigin.current;
      if (origins && origins.size > 1 && origins.has(id)) {
        const origin = origins.get(id)!;
        const dx = sx - origin.x;
        const dy = sy - origin.y;
        const updates = [...origins.entries()].map(([oid, pos]) => ({
          id: oid,
          x: snap(pos.x + dx),
          y: snap(pos.y + dy),
        }));
        updateLive(updates);
      } else {
        updateLive([{ id, x: sx, y: sy }]);
      }
    },
    [snap, updateLive],
  );

  const onDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const sx = snap(x);
      const sy = snap(y);
      const origins = multiDragOrigin.current;
      if (origins && origins.size > 1 && origins.has(id)) {
        const origin = origins.get(id)!;
        const dx = sx - origin.x;
        const dy = sy - origin.y;
        const updates = [...origins.entries()].map(([oid, pos]) => ({
          id: oid,
          x: snap(pos.x + dx),
          y: snap(pos.y + dy),
        }));
        endTransform(updates);
      } else {
        endTransform([{ id, x: sx, y: sy }]);
      }
      multiDragOrigin.current = null;
    },
    [snap, endTransform],
  );

  const onSelect = useCallback(
    (id: string, additive: boolean) => {
      if (tool !== 'select') return;
      dispatch({ type: 'SELECT', ids: [id], additive });
    },
    [dispatch, tool],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/spacemap-element');
      if (!type) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = screenToWorld(screenX, screenY, viewport);
      addElementAt(type as Parameters<typeof addElementAt>[0], world.x, world.y);
    },
    [addElementAt, viewport],
  );

  const cursor = isPanning || tool === 'pan' ? 'grab' : 'default';

  const teamBoundaries = useMemo(() => {
    // Soft visual group boxes already drawn as open-workspace objects
    return null;
  }, []);

  return (
    <div
      className="sm-canvas-host"
      style={{ cursor }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.panX}
        y={viewport.panY}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMousemove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <GridLayer
          floorWidth={doc.floor.width}
          floorHeight={doc.floor.height}
          gridSize={doc.floor.gridSize}
          zoom={viewport.zoom}
          visible={gridVisible}
        />
        <ObjectsLayer
          objects={doc.objects}
          teams={doc.teams}
          selectedIds={selectedIds}
          floorWidth={doc.floor.width}
          floorHeight={doc.floor.height}
          zoom={viewport.zoom}
          interactive={tool === 'select' && !isPanning}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
        <Layer>
          <Transformer
            ref={trRef}
            rotateEnabled
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'middle-left',
              'middle-right',
              'top-center',
              'bottom-center',
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 8 || newBox.height < 8) return oldBox;
              return newBox;
            }}
            onTransformStart={() => beginTransform()}
            onTransformEnd={() => {
              const stage = stageRef.current;
              if (!stage || selectedIds.length !== 1) return;
              const id = selectedIds[0];
              const node = stage.findOne(`#${id}`);
              if (!node) return;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              const obj = doc.objects.find((o) => o.id === id);
              if (!obj) return;
              const pxW = (node.width() || obj.width * PIXELS_PER_UNIT) * scaleX;
              const pxH = (node.height() || obj.height * PIXELS_PER_UNIT) * scaleY;
              const newW = Math.max(0.3, snap(pxW / PIXELS_PER_UNIT));
              const newH = Math.max(0.3, snap(pxH / PIXELS_PER_UNIT));
              node.scaleX(1);
              node.scaleY(1);
              endTransform([
                {
                  id,
                  x: snap(node.x() / PIXELS_PER_UNIT),
                  y: snap(node.y() / PIXELS_PER_UNIT),
                  width: newW,
                  height: newH,
                  rotation: Math.round(node.rotation()),
                },
              ]);
            }}
          />
          {teamBoundaries}
          {/* Invisible hit area kept for future marquee */}
          <Rect x={0} y={0} width={0} height={0} listening={false} />
        </Layer>
      </Stage>
      <div className="sm-zoom-limits" aria-hidden>
        {Math.round(viewport.zoom * 100)}% · {ZOOM_MIN * 100}–{ZOOM_MAX * 100}%
      </div>
    </div>
  );
};
