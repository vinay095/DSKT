import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CellRef,
  EditorTool,
  Entity,
  FloorConfig,
  LibraryItem,
  Point,
  Rect,
} from '../types/geometry';
import type { Viewport } from '../types/viewport';
import {
  clampZoomAround,
  fitFloorViewport,
  getViewportTransform,
  initialCloseUpViewport,
  minZoomToFitFloor,
  screenToWorld,
  zoomAround,
} from '../geometry/coordinates';
import {
  cellsInWorldRect,
  getFloorBaseUnit,
  getGridLevel,
  getLevelCellSize,
  getVisibleWorldBounds,
  worldRectFromPoints,
  worldToCell,
} from '../geometry/grid';
import { snapPointToGrid, snapSize, snapToGrid } from '../geometry/snapping';
import {
  createId,
  entitiesIntersectingRect,
  hitTestEntity,
  resizeEntity,
  translateEntity,
} from '../geometry/entities';
import { generateFloorMatrix, type FloorMatrix } from '../geometry/matrix';
import { useHistory } from '../hooks/useHistory';
import { loadDraft, saveDraft, type DraftDocument } from '../lib/drafts';
import { exportPdf, exportPng, exportSvg } from '../lib/export';
import type { ResizeHandle } from './ResizeHandles';
import FloorBoundary from './FloorBoundary';
import Grid from './Grid';
import CellHighlight from './CellHighlight';
import EntitiesLayer from './EntitiesLayer';
import SelectionMarquee from './SelectionMarquee';
import ResizeHandles from './ResizeHandles';
import EntityLibrary from './EntityLibrary';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';

const ZOOM_FACTOR = 1.12;
const MAX_ZOOM = 400;
const CLICK_PX = 4;

const DEFAULT_FLOOR: FloorConfig = {
  width: 64,
  height: 64,
  a: 0.25,
};

type DragMode =
  | {
      type: 'pan';
      startX: number;
      startY: number;
      panX: number;
      panY: number;
      worldAtStart: Point;
      shift: boolean;
    }
  | {
      type: 'marquee';
      startWorld: Point;
      currentWorld: Point;
      additive: boolean;
    }
  | {
      type: 'move';
      startWorld: Point;
      originEntities: Entity[];
      ids: string[];
    }
  | {
      type: 'resize';
      handle: ResizeHandle;
      startWorld: Point;
      originEntities: Entity[];
      entityId: string;
    }
  | null;

const FloorEditor: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<Viewport>({ zoom: 40, panX: 0, panY: 0 });
  const [floor, setFloor] = useState<FloorConfig>(DEFAULT_FLOOR);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [includeGridOnExport, setIncludeGridOnExport] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tool, setTool] = useState<EditorTool>('select');
  const [placeItem, setPlaceItem] = useState<LibraryItem | null>(null);
  const [cursorWorld, setCursorWorld] = useState<Point>({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellRef[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<Rect | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<Point[]>([]);
  const [matrix, setMatrix] = useState<FloorMatrix | null>(null);

  const history = useHistory<Entity[]>([]);
  const entities = history.present;

  const viewportRef = useRef(viewport);
  const floorRef = useRef(floor);
  const entitiesRef = useRef(entities);
  const dragRef = useRef<DragMode>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);
  useEffect(() => {
    floorRef.current = floor;
  }, [floor]);
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Measure + initial close-up camera
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSvgSize({ width, height });
    });
    ro.observe(el);
    const { width, height } = el.getBoundingClientRect();
    setSvgSize({ width, height });
    setViewport(initialCloseUpViewport(DEFAULT_FLOOR, width, height));
    return () => ro.disconnect();
  }, []);

  const baseUnit = getFloorBaseUnit(floor);
  const gridLevel = getGridLevel(viewport.zoom, baseUnit);
  const gridCellSize = getLevelCellSize(gridLevel, baseUnit);
  const snapSizeWorld = snapEnabled ? gridCellSize : 0;
  const minZoom = minZoomToFitFloor(floor, svgSize.width, svgSize.height);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedEntities = useMemo(
    () => entities.filter((e) => selectedSet.has(e.id)),
    [entities, selectedSet],
  );

  const hoveredCell: CellRef | null = useMemo(() => {
    return worldToCell(cursorWorld, gridLevel, baseUnit);
  }, [cursorWorld, gridLevel, baseUnit]);

  const applyZoom = useCallback(
    (factor: number, anchor: Point) => {
      setViewport((v) => {
        const next = zoomAround(v, factor, anchor);
        return clampZoomAround(next, next.zoom, anchor, minZoom, MAX_ZOOM);
      });
    },
    [minZoom],
  );

  const handleZoomIn = useCallback(() => {
    applyZoom(ZOOM_FACTOR, { x: svgSize.width / 2, y: svgSize.height / 2 });
  }, [applyZoom, svgSize]);

  const handleZoomOut = useCallback(() => {
    applyZoom(1 / ZOOM_FACTOR, { x: svgSize.width / 2, y: svgSize.height / 2 });
  }, [applyZoom, svgSize]);

  const handleFitFloor = useCallback(() => {
    setViewport(fitFloorViewport(floor, svgSize.width, svgSize.height));
  }, [floor, svgSize]);

  // Wheel zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      applyZoom(factor, cursor);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  // Pinch zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const touchDist = (touches: TouchList) => {
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: touchDist(e.touches), zoom: viewportRef.current.zoom };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
      };
      const dist = touchDist(e.touches);
      const factor = dist / pinchRef.current.dist;
      const desired = pinchRef.current.zoom * factor;
      setViewport((v) => clampZoomAround(v, desired, mid, minZoom, MAX_ZOOM));
    };
    const onTouchEnd = () => {
      pinchRef.current = null;
    };

    svg.addEventListener('touchstart', onTouchStart, { passive: true });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });
    svg.addEventListener('touchend', onTouchEnd);
    return () => {
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
    };
  }, [minZoom]);

  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return screenToWorld(
      { x: clientX - rect.left, y: clientY - rect.top },
      viewportRef.current,
    );
  }, []);

  const commitEntities = useCallback(
    (next: Entity[]) => {
      history.set(next);
    },
    [history],
  );

  const placeEntityAt = useCallback(
    (item: LibraryItem, world: Point) => {
      let x = world.x - item.defaultWidth / 2;
      let y = world.y - item.defaultHeight / 2;
      if (snapSizeWorld > 0) {
        const snapped = snapPointToGrid(x, y, snapSizeWorld);
        x = snapped.x;
        y = snapped.y;
      }
      const entity: Entity = {
        id: createId(item.kind),
        kind: item.kind,
        code: item.code,
        x,
        y,
        width: item.defaultWidth,
        height: item.defaultHeight,
        label: item.label,
      };
      commitEntities([...entitiesRef.current, entity]);
      setSelectedIds([entity.id]);
      setSelectedCells([]);
      setPlaceItem(null);
      setTool('select');
    },
    [commitEntities, snapSizeWorld],
  );

  const closePolygon = useCallback(() => {
    if (polygonDraft.length < 3) {
      setPolygonDraft([]);
      return;
    }
    const xs = polygonDraft.map((p) => p.x);
    const ys = polygonDraft.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const entity: Entity = {
      id: createId('polygon'),
      kind: 'polygon',
      code: 8,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points: polygonDraft,
      label: 'Polygon',
    };
    commitEntities([...entitiesRef.current, entity]);
    setSelectedIds([entity.id]);
    setPolygonDraft([]);
    setTool('select');
  }, [polygonDraft, commitEntities]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setSelectedCells([]);
        setPolygonDraft([]);
        setPlaceItem(null);
        setTool('select');
        setMarqueeRect(null);
        dragRef.current = null;
      }
      if (e.key === 'Enter' && tool === 'polygon') {
        e.preventDefault();
        closePolygon();
      }
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        history.redo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        const drop = new Set(selectedIds);
        commitEntities(entitiesRef.current.filter((ent) => !drop.has(ent.id)));
        setSelectedIds([]);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tool, closePolygon, history, selectedIds, commitEntities]);

  const applyResize = (
    origin: Entity,
    handle: ResizeHandle,
    world: Point,
    snap: number,
  ): Entity => {
    let { x, y, width, height } = origin;
    const right = x + width;
    const top = y + height;
    let nx = world.x;
    let ny = world.y;
    if (snap > 0) {
      nx = snapToGrid(nx, snap);
      ny = snapToGrid(ny, snap);
    }

    if (handle.includes('e')) width = Math.max(snap || 0.05, nx - x);
    if (handle.includes('w')) {
      const newX = Math.min(nx, right - (snap || 0.05));
      width = right - newX;
      x = newX;
    }
    if (handle.includes('n')) height = Math.max(snap || 0.05, ny - y);
    if (handle.includes('s')) {
      const newY = Math.min(ny, top - (snap || 0.05));
      height = top - newY;
      y = newY;
    }
    if (snap > 0) {
      width = snapSize(width, snap);
      height = snapSize(height, snap);
    }
    return resizeEntity(origin, { x, y, width, height });
  };

  const handleEntityPointerDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (tool === 'polygon' || placeItem) return;

    const world = clientToWorld(e.clientX, e.clientY);
    let ids = selectedIds;
    if (e.shiftKey) {
      ids = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      setSelectedIds(ids);
    } else if (!selectedIds.includes(id)) {
      ids = [id];
      setSelectedIds(ids);
      setSelectedCells([]);
    }

    movedRef.current = false;
    dragRef.current = {
      type: 'move',
      startWorld: world,
      originEntities: entitiesRef.current.map((ent) => ({ ...ent, points: ent.points?.map((p) => ({ ...p })) })),
      ids,
    };
  };

  const handleHandleDown = (handle: ResizeHandle, e: React.MouseEvent) => {
    if (selectedEntities.length !== 1) return;
    movedRef.current = false;
    dragRef.current = {
      type: 'resize',
      handle,
      startWorld: clientToWorld(e.clientX, e.clientY),
      originEntities: entitiesRef.current.map((ent) => ({
        ...ent,
        points: ent.points?.map((p) => ({ ...p })),
      })),
      entityId: selectedEntities[0].id,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    const world = clientToWorld(e.clientX, e.clientY);
    movedRef.current = false;

    // Place mode
    if (placeItem && e.button === 0 && !e.ctrlKey && !e.metaKey) {
      placeEntityAt(placeItem, world);
      return;
    }

    // Polygon tool
    if (tool === 'polygon' && e.button === 0) {
      let p = world;
      if (snapSizeWorld > 0) p = snapPointToGrid(p.x, p.y, snapSizeWorld);
      if (e.detail === 2) {
        closePolygon();
        return;
      }
      setPolygonDraft((pts) => [...pts, p]);
      return;
    }

    const wantPan =
      e.button === 1 ||
      tool === 'pan' ||
      spaceHeld ||
      (e.button === 0 && !e.ctrlKey && !e.metaKey && !hitTestEntity(entitiesRef.current, world));

    if (e.ctrlKey || e.metaKey) {
      dragRef.current = {
        type: 'marquee',
        startWorld: world,
        currentWorld: world,
        additive: e.shiftKey,
      };
      setMarqueeRect({ x: world.x, y: world.y, width: 0, height: 0 });
      return;
    }

    if (wantPan) {
      e.preventDefault();
      dragRef.current = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        panX: viewportRef.current.panX,
        panY: viewportRef.current.panY,
        worldAtStart: world,
        shift: e.shiftKey,
      };
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const world = clientToWorld(e.clientX, e.clientY);
    setCursorWorld(world);

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.type === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) >= CLICK_PX) movedRef.current = true;
      setViewport((v) => ({
        ...v,
        panX: drag.panX + dx,
        panY: drag.panY + dy,
      }));
      return;
    }

    movedRef.current = true;

    if (drag.type === 'marquee') {
      drag.currentWorld = world;
      setMarqueeRect(worldRectFromPoints(drag.startWorld, world));
      return;
    }

    if (drag.type === 'move') {
      let dx = world.x - drag.startWorld.x;
      let dy = world.y - drag.startWorld.y;
      if (snapSizeWorld > 0) {
        dx = snapToGrid(dx, snapSizeWorld);
        dy = snapToGrid(dy, snapSizeWorld);
      }
      const idSet = new Set(drag.ids);
      history.replace(
        drag.originEntities.map((ent) =>
          idSet.has(ent.id) ? translateEntity(ent, dx, dy) : ent,
        ),
      );
      return;
    }

    if (drag.type === 'resize') {
      const origin = drag.originEntities.find((ent) => ent.id === drag.entityId);
      if (!origin) return;
      const next = applyResize(origin, drag.handle, world, snapSizeWorld);
      history.replace(
        drag.originEntities.map((ent) => (ent.id === next.id ? next : ent)),
      );
    }
  };

  const handleMouseUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag?.type === 'pan') {
      if (!movedRef.current) {
        // Treat as click: select cell under cursor
        if (!drag.shift) setSelectedIds([]);
        const cell = worldToCell(drag.worldAtStart, gridLevel, baseUnit);
        setSelectedCells(drag.shift ? [...selectedCells, cell] : [cell]);
      }
      return;
    }

    if (drag?.type === 'marquee') {
      const rect = worldRectFromPoints(drag.startWorld, drag.currentWorld);
      setMarqueeRect(null);
      if (rect.width * viewport.zoom < CLICK_PX && rect.height * viewport.zoom < CLICK_PX) {
        return;
      }
      const hit = entitiesIntersectingRect(entitiesRef.current, rect);
      if (hit.length > 0) {
        const ids = hit.map((h) => h.id);
        setSelectedIds((prev) =>
          drag.additive ? Array.from(new Set([...prev, ...ids])) : ids,
        );
        setSelectedCells([]);
      } else {
        const cells = cellsInWorldRect(rect, gridLevel, baseUnit);
        setSelectedCells((prev) =>
          drag.additive
            ? Array.from(
                new Map(
                  [...prev, ...cells].map((c) => [`${c.level}:${c.col}:${c.row}`, c]),
                ).values(),
              )
            : cells,
        );
        if (!drag.additive) setSelectedIds([]);
      }
      return;
    }

    if ((drag?.type === 'move' || drag?.type === 'resize') && movedRef.current) {
      history.commit(drag.originEntities, entitiesRef.current.map((ent) => ({ ...ent })));
    }
  };

  const handleUpdateSelected = (patch: Partial<Entity>) => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    commitEntities(
      entities.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const handleSaveDraft = () => {
    const name = window.prompt('Draft name', `Draft ${new Date().toLocaleString()}`);
    if (!name) return;
    const doc: DraftDocument = {
      version: 1,
      name,
      savedAt: new Date().toISOString(),
      a: floor.a,
      floor,
      viewport,
      entities,
      theme,
    };
    saveDraft(doc);
  };

  const handleLoadDraft = (name: string) => {
    const doc = loadDraft(name);
    if (!doc) return;
    setFloor(doc.floor);
    setViewport(doc.viewport);
    history.reset(doc.entities);
    setSelectedIds([]);
    setSelectedCells([]);
    if (doc.theme) setTheme(doc.theme);
  };

  const runExport = async (kind: 'png' | 'svg' | 'pdf') => {
    const svg = svgRef.current;
    if (!svg) return;
    const stamp = Date.now();
    if (kind === 'svg') exportSvg(svg, `floor-${stamp}.svg`, includeGridOnExport);
    if (kind === 'png') await exportPng(svg, `floor-${stamp}.png`, includeGridOnExport);
    if (kind === 'pdf') await exportPdf(svg, `floor-${stamp}.pdf`, includeGridOnExport);
  };

  const axisLabels = useMemo(() => {
    const bounds = getVisibleWorldBounds(viewport, svgSize.width, svgSize.height);
    const step = baseUnit;
    const xs: number[] = [];
    const ys: number[] = [];
    const startX = Math.ceil(bounds.minX / step) * step;
    for (let x = startX; x <= bounds.maxX; x += step) xs.push(x);
    const startY = Math.ceil(bounds.minY / step) * step;
    for (let y = startY; y <= bounds.maxY; y += step) ys.push(y);
    return { xs: xs.slice(0, 40), ys: ys.slice(0, 40) };
  }, [viewport, svgSize, baseUnit]);

  const cursorStyle =
    tool === 'pan' || spaceHeld
      ? 'grab'
      : placeItem || tool === 'polygon'
        ? 'crosshair'
        : 'default';

  const singleSelected = selectedEntities.length === 1 ? selectedEntities[0] : null;

  return (
    <div className="editor-layout">
      <Toolbar
        viewport={viewport}
        tool={tool === 'place' ? 'select' : tool}
        showGrid={showGrid}
        snapEnabled={snapEnabled}
        includeGridOnExport={includeGridOnExport}
        theme={theme}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onTool={(t) => {
          setTool(t);
          setPlaceItem(null);
          if (t !== 'polygon') setPolygonDraft([]);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitFloor={handleFitFloor}
        onToggleGrid={() => setShowGrid((g) => !g)}
        onToggleSnap={() => setSnapEnabled((s) => !s)}
        onToggleExportGrid={() => setIncludeGridOnExport((g) => !g)}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onUndo={history.undo}
        onRedo={history.redo}
        onSaveDraft={handleSaveDraft}
        onLoadDraft={handleLoadDraft}
        onExportPng={() => void runExport('png')}
        onExportSvg={() => void runExport('svg')}
        onExportPdf={() => void runExport('pdf')}
      />

      <div className="editor-body">
        <EntityLibrary
          activeKind={placeItem?.kind ?? null}
          onSelect={(item) => {
            setPlaceItem(item);
            setTool('place');
            setPolygonDraft([]);
          }}
          onPolygonTool={() => {
            setTool('polygon');
            setPlaceItem(null);
            setPolygonDraft([]);
          }}
          polygonActive={tool === 'polygon'}
        />

        <div className="editor-canvas-container" ref={containerRef}>
          <svg
            ref={svgRef}
            id="floor-editor-svg"
            className="editor-svg"
            width={svgSize.width}
            height={svgSize.height}
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Floor plan editor canvas"
          >
            <defs>
              <clipPath id="floor-clip">
                <rect x={0} y={0} width={floor.width} height={floor.height} />
              </clipPath>
            </defs>

            <rect
              x={0}
              y={0}
              width={svgSize.width}
              height={svgSize.height}
              className="canvas-bg"
            />

            <g id="viewport" transform={getViewportTransform(viewport)}>
              <FloorBoundary floor={floor} />
              <Grid
                floor={floor}
                viewport={viewport}
                showGrid={showGrid}
                svgWidth={svgSize.width}
                svgHeight={svgSize.height}
                clipToFloor={false}
              />
              <CellHighlight
                hoveredCell={hoveredCell}
                selectedCells={selectedCells}
                baseUnit={baseUnit}
              />
              <EntitiesLayer
                entities={entities}
                selectedIds={selectedSet}
                onEntityPointerDown={handleEntityPointerDown}
              />
              {singleSelected && (
                <ResizeHandles
                  entity={singleSelected}
                  zoom={viewport.zoom}
                  onHandleDown={handleHandleDown}
                />
              )}
              {polygonDraft.length > 0 && (
                <g id="polygon-draft" pointerEvents="none">
                  <polyline
                    points={polygonDraft.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  {polygonDraft.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={4 / viewport.zoom} fill="#ef4444" />
                  ))}
                </g>
              )}
            </g>

            <SelectionMarquee rect={marqueeRect} viewport={viewport} />

            <g
              id="axis-labels"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
              className="axis-labels"
            >
              {axisLabels.xs.map((wx) => {
                const sx = wx * viewport.zoom + viewport.panX;
                const sy = Math.min(svgSize.height - 6, Math.max(12, viewport.panY + 14));
                if (sx < 20 || sx > svgSize.width - 10) return null;
                return (
                  <text key={`lx-${wx}`} x={sx} y={sy} textAnchor="middle">
                    {Number(wx.toFixed(2))}
                  </text>
                );
              })}
              {axisLabels.ys.map((wy) => {
                const sx = Math.max(4, Math.min(svgSize.width - 8, viewport.panX - 8));
                const sy = -wy * viewport.zoom + viewport.panY;
                if (sy < 10 || sy > svgSize.height - 4) return null;
                return (
                  <text key={`ly-${wy}`} x={sx} y={sy} textAnchor="end" dominantBaseline="middle">
                    {Number(wy.toFixed(2))}
                  </text>
                );
              })}
            </g>
          </svg>

          <div className="status-bar">
            <span>
              ({cursorWorld.x.toFixed(2)}, {cursorWorld.y.toFixed(2)}) m
            </span>
            <span>
              a={floor.a} m · cell {gridCellSize.toFixed(2)} m · L{gridLevel}
            </span>
            <span>{snapEnabled ? 'Snap ON' : 'Snap OFF'}</span>
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} entity(s)`
                : selectedCells.length > 0
                  ? `${selectedCells.length} cell(s)`
                  : 'Nothing selected'}
            </span>
            <span className="status-hint">
              Drag empty area to pan · Ctrl+drag select · Scroll/pinch zoom · Del delete
            </span>
          </div>
        </div>

        <PropertiesPanel
          floor={floor}
          onFloorChange={setFloor}
          selected={selectedEntities}
          onUpdateSelected={handleUpdateSelected}
          matrix={matrix}
          onGenerateMatrix={() => setMatrix(generateFloorMatrix(entities, floor.a))}
          onCopyMatrix={() => {
            if (!matrix) return;
            void navigator.clipboard.writeText(JSON.stringify(matrix, null, 2));
          }}
        />
      </div>
    </div>
  );
};

export default FloorEditor;
