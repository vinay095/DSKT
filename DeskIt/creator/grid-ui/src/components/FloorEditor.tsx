import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CatalogCategory,
  CellRef,
  CustomLibraryEntry,
  Entity,
  FloorConfig,
  FloorZone,
  GridCell,
  LibraryItem,
  Point,
  Rect,
  UnusableRegion,
} from '../types/geometry';
import { floorWorldHeight, floorWorldWidth } from '../types/geometry';
import type { Viewport } from '../types/viewport';
import {
  clampViewportToFirstQuadrant,
  clampZoomAround,
  fitFloorViewport,
  getViewportTransform,
  initialCloseUpViewport,
  minZoomToFitFloor,
  screenToWorld,
  worldToScreen,
  zoomAround,
} from '../geometry/coordinates';
import {
  catalogToFinestSizeAtLevel,
  cellToWorldRect,
  cellsInWorldRect,
  FINEST_PER_A,
  finestPerLevelCell,
  floorFinestCols,
  floorFinestRows,
  getGridLevel,
  getVisibleWorldBounds,
  isCellOnFloor,
  levelCellSize,
  axisLabelMarks,
  worldRectFromPoints,
  worldToCell,
  worldToFinestCell,
  worldToLevelFinest,
  type NamedGridLevel,
} from '../geometry/grid';
import { snapPointToGrid, snapToGrid } from '../geometry/snapping';
import {
  cloneEntity,
  createId,
  entitiesInCells,
  entityWorldRect,
  hitTestEntity,
  isPolygonEntity,
  resizePolygonEntity,
  rotateEntity90CCW,
  translateEntity,
} from '../geometry/entities';
import {
  cellsToRelativeFinest,
} from '../geometry/footprint';
import {
  cellsToOutline,
  compactFromCells,
  expandRegionCells,
  finestCellInRegion,
  hydratePolygonEntity,
  outlineToSvgPath,
  pointInOutline,
  scalePolygonTemplate,
  splitIntoConnectedComponents,
} from '../geometry/shapeStorage';
import { useHistory } from '../hooks/useHistory';
import {
  downloadFloorJson,
  floorDocumentToJson,
  loadDraft,
  normalizeDocument,
  saveDraft,
  type FloorDocument,
} from '../lib/drafts';
import { exportPdf, exportPng, exportSvg } from '../lib/export';
import { catalogToLibraryItems, loadCatalog } from '../lib/catalog';
import {
  deleteCustomLibraryEntry,
} from '../lib/library';
import type { ResizeHandle } from './ResizeHandles';
import FloorBoundary from './FloorBoundary';
import Grid from './Grid';
import CellHighlight from './CellHighlight';
import EntitiesLayer from './EntitiesLayer';
import PlacePreview from './PlacePreview';
import ZonesLayer from './ZonesLayer';
import OutsideFloorOverlay from './OutsideFloorOverlay';
import UnusableLayer from './UnusableLayer';
import GridNavBars from './GridNavBars';
import SelectionMarquee from './SelectionMarquee';
import SelectionActionMenu from './SelectionActionMenu';
import EntityActionMenu from './EntityActionMenu';
import SavePolygonDialog from './SavePolygonDialog';
import ResizeHandles from './ResizeHandles';
import EntityLibrary from './EntityLibrary';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';
import HowToUseModal from './HowToUseModal';
import { MessageToast, PromptToast, type PromptRequest } from './PromptToast';
import { ZOOM_BUTTON_FACTOR, wheelZoomFactor } from '../geometry/zoom';
import {
  loadGlobalCustomLibrary,
  mergeCustomLibraries,
  removeGlobalCustomEntry,
  upsertGlobalCustomEntry,
} from '../lib/globalCustomLibrary';
import {
  generateCustomElementSvg,
  getCategoryStyle,
  svgMarkupToDataUrl,
} from '../lib/categoryStyles';

const MAX_ZOOM = 400;
const CLICK_PX = 4;

const DEFAULT_FLOOR: FloorConfig = {
  cols: 128,
  rows: 128,
  a: 1,
};

const ZONE_COLORS = [
  'rgba(59, 130, 246, 0.14)',
  'rgba(34, 197, 94, 0.14)',
  'rgba(168, 85, 247, 0.14)',
  'rgba(245, 158, 11, 0.14)',
  'rgba(239, 68, 68, 0.14)',
  'rgba(20, 184, 166, 0.14)',
];

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

function mergeCells(existing: CellRef[], extra: CellRef[], additive: boolean): CellRef[] {
  if (!additive) return extra;
  const map = new Map(existing.map((c) => [`${c.level}:${c.col}:${c.row}`, c]));
  for (const c of extra) {
    const key = `${c.level}:${c.col}:${c.row}`;
    if (map.has(key)) map.delete(key);
    else map.set(key, c);
  }
  return Array.from(map.values());
}

function selectedCellsToFinest(cells: CellRef[], a: number): GridCell[] {
  const built = cellsToRelativeFinest(cells, a);
  if (!built) return [];
  return built.cells.map((c) => ({
    col: built.origin.col + c.col,
    row: built.origin.row + c.row,
  }));
}


function askText(
  setPromptReq: React.Dispatch<React.SetStateAction<PromptRequest | null>>,
  resolveRef: React.MutableRefObject<((v: string | null) => void) | null>,
  req: PromptRequest,
): Promise<string | null> {
  return new Promise((resolve) => {
    resolveRef.current = resolve;
    setPromptReq(req);
  });
}

interface FloorEditorProps {
  onOpenPretty: (doc: FloorDocument) => void; // Preview
}

const FloorEditor: React.FC<FloorEditorProps> = ({ onOpenPretty }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<Viewport>({ zoom: 40, panX: 0, panY: 0 });
  const [floor, setFloor] = useState<FloorConfig>(DEFAULT_FLOOR);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [includeGridOnExport, setIncludeGridOnExport] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [selectEnabled, setSelectEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(false);
  const [placeItem, setPlaceItem] = useState<LibraryItem | null>(null);
  const [cursorWorld, setCursorWorld] = useState<Point>({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellRef[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<Rect | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [customLibrary, setCustomLibrary] = useState<CustomLibraryEntry[]>([]);
  const [globalCustomLibrary, setGlobalCustomLibrary] = useState<CustomLibraryEntry[]>(() =>
    loadGlobalCustomLibrary(),
  );
  const [zones, setZones] = useState<FloorZone[]>([]);
  const [unusableRegions, setUnusableRegions] = useState<UnusableRegion[]>([]);
  const [promptReq, setPromptReq] = useState<PromptRequest | null>(null);
  const promptResolveRef = useRef<((v: string | null) => void) | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [clipboard, setClipboard] = useState<Entity[]>([]);
  const [showEntityMenu, setShowEntityMenu] = useState(false);
  const [polygonPending, setPolygonPending] = useState<ReturnType<
    typeof cellsToRelativeFinest
  > | null>(null);

  const {
    present: entities,
    set: setEntities,
    replace: replaceEntities,
    commitDrag,
    undo,
    redo,
    reset: resetEntities,
    canUndo,
    canRedo,
  } = useHistory<Entity[]>([], 5);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  const viewportRef = useRef(viewport);
  const entitiesRef = useRef(entities);
  const floorRef = useRef(floor);
  const dragRef = useRef<DragMode>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);
  useEffect(() => {
    floorRef.current = floor;
  }, [floor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    void loadCatalog().then((cat) => setCategories(cat.categories));
  }, []);

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
    setViewport(
      clampViewportToFirstQuadrant(
        initialCloseUpViewport(DEFAULT_FLOOR, width, height),
        width,
        height,
      ),
    );
    return () => ro.disconnect();
  }, []);

  const a = floor.a;
  const gridLevel = getGridLevel(viewport.zoom, a);
  const gridCellSize = levelCellSize(gridLevel, a);
  const placementSize = gridCellSize;
  const finestSize = a / FINEST_PER_A;
  const snapSizeWorld = snapEnabled ? placementSize : 0;
  const minZoom = minZoomToFitFloor(floor, svgSize.width, svgSize.height);

  const mergedCustomLibrary = useMemo(
    () => mergeCustomLibraries(globalCustomLibrary, customLibrary),
    [globalCustomLibrary, customLibrary],
  );

  const allLibrary = useMemo(
    () => [...catalogToLibraryItems({ categories }), ...mergedCustomLibrary],
    [categories, mergedCustomLibrary],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedEntities = useMemo(
    () => entities.filter((e) => selectedSet.has(e.objectId)),
    [entities, selectedSet],
  );

  const hoveredCell: CellRef | null = useMemo(() => {
    const cell = worldToCell(cursorWorld, gridLevel, a);
    if (!isCellOnFloor(cell, floor)) return null;
    return cell;
  }, [cursorWorld, gridLevel, a, floor]);

  const selectionMenuPos = useMemo(() => {
    if (selectedCells.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const cell of selectedCells) {
      const r = cellToWorldRect(cell, a);
      minX = Math.min(minX, r.x);
      maxX = Math.max(maxX, r.x + r.width);
      minY = Math.min(minY, r.y);
      maxY = Math.max(maxY, r.y + r.height);
    }
    const screen = worldToScreen({ x: (minX + maxX) / 2, y: maxY }, viewport);
    // Keep a ~340px wrapped menu on-canvas (menu is transform-centered on x)
    const half = 170;
    const x = Math.min(svgSize.width - half - 8, Math.max(half + 8, screen.x));
    const y = Math.max(96, Math.min(svgSize.height - 8, screen.y));
    return { x, y };
  }, [selectedCells, a, viewport, svgSize.width, svgSize.height]);

  const entityMenuPos = useMemo(() => {
    if (!showEntityMenu || selectedEntities.length !== 1) return null;
    const e = selectedEntities[0];
    const b = entityWorldRect(e, a);
    const screen = worldToScreen({ x: b.x + b.width / 2, y: b.y + b.height }, viewport);
    return { x: screen.x, y: screen.y };
  }, [showEntityMenu, selectedEntities, a, viewport]);

  const buildDocument = useCallback((): FloorDocument => {
    return {
      version: 2,
      a: floor.a,
      floor,
      entities,
      zones,
      customLibrary,
      unusableRegions,
      viewport,
      theme,
    };
  }, [floor, entities, zones, customLibrary, unusableRegions, viewport, theme]);

  const showToast = useCallback((msg: string) => setToastMsg(msg), []);

  const requestPrompt = useCallback((req: PromptRequest) => {
    return askText(setPromptReq, promptResolveRef, req);
  }, []);

  const setClampedViewport = useCallback(
    (updater: Viewport | ((v: Viewport) => Viewport)) => {
      setViewport((v) => {
        const next = typeof updater === 'function' ? updater(v) : updater;
        return clampViewportToFirstQuadrant(next, svgSize.width, svgSize.height);
      });
    },
    [svgSize.width, svgSize.height],
  );

  const cellBlocked = useCallback(
    (col: number, row: number) => {
      if (
        col < 0 ||
        row < 0 ||
        col >= floorFinestCols(floor) ||
        row >= floorFinestRows(floor)
      ) {
        return true;
      }
      return unusableRegions.some((r) => finestCellInRegion(col, row, r));
    },
    [floor, unusableRegions],
  );

  const entityFitsFloor = useCallback(
    (ent: Entity) => {
      if (isPolygonEntity(ent) && ent.outline && ent.outline.length >= 3) {
        for (let r = 0; r < ent.heightCells; r++) {
          for (let c = 0; c < ent.widthCells; c++) {
            if (!pointInOutline({ x: c + 0.5, y: r + 0.5 }, ent.outline)) continue;
            if (cellBlocked(ent.origin.col + c, ent.origin.row + r)) return false;
          }
        }
        return true;
      }
      if (isPolygonEntity(ent) && ent.cells && ent.cells.length > 0) {
        return ent.cells.every(
          (c) => !cellBlocked(ent.origin.col + c.col, ent.origin.row + c.row),
        );
      }
      for (let r = 0; r < ent.heightCells; r++) {
        for (let c = 0; c < ent.widthCells; c++) {
          if (cellBlocked(ent.origin.col + c, ent.origin.row + r)) return false;
        }
      }
      return true;
    },
    [cellBlocked],
  );

  const applyZoom = useCallback(
    (factor: number, anchor: Point) => {
      setClampedViewport((v) => {
        const next = zoomAround(v, factor, anchor);
        return clampZoomAround(next, next.zoom, anchor, minZoom, MAX_ZOOM);
      });
    },
    [minZoom, setClampedViewport],
  );

  const handleZoomIn = useCallback(() => {
    applyZoom(ZOOM_BUTTON_FACTOR, { x: svgSize.width / 2, y: svgSize.height / 2 });
  }, [applyZoom, svgSize]);

  const handleZoomOut = useCallback(() => {
    applyZoom(1 / ZOOM_BUTTON_FACTOR, { x: svgSize.width / 2, y: svgSize.height / 2 });
  }, [applyZoom, svgSize]);

  const handleFitFloor = useCallback(() => {
    setClampedViewport(fitFloorViewport(floor, svgSize.width, svgSize.height));
  }, [floor, svgSize, setClampedViewport]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      applyZoom(wheelZoomFactor(e.deltaY), cursor);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const touchDist = (touches: TouchList) => {
      const aT = touches[0];
      const b = touches[1];
      return Math.hypot(aT.clientX - b.clientX, aT.clientY - b.clientY);
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
      const desired = pinchRef.current.zoom * (touchDist(e.touches) / pinchRef.current.dist);
      setClampedViewport((v) => clampZoomAround(v, desired, mid, minZoom, MAX_ZOOM));
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
  }, [minZoom, setClampedViewport]);

  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return screenToWorld(
      { x: clientX - rect.left, y: clientY - rect.top },
      viewportRef.current,
    );
  }, []);

  const placeEntityAt = useCallback(
    async (item: LibraryItem, world: Point) => {
      let cell = worldToLevelFinest(world, gridLevel, a);
      if (snapSizeWorld > 0) {
        const snapped = snapPointToGrid(world.x, world.y, snapSizeWorld);
        cell = worldToLevelFinest(snapped, gridLevel, a);
      }
      cell = { col: Math.max(0, cell.col), row: Math.max(0, cell.row) };

      const finishPlace = (entity: Entity) => {
        if (!entityFitsFloor(entity)) {
          showToast('Cannot place outside the floor or on unusable cells.');
          return;
        }
        setEntities([...entitiesRef.current, entity]);
        setSelectedIds([entity.objectId]);
        setSelectedCells([]);
        setPlaceItem(null);
        setShowEntityMenu(true);
      };

      if (item.category === 'text') {
        const textVal = await requestPrompt({
          title: 'Label text',
          defaultValue: item.label === 'Text block' ? 'Label' : item.label,
          confirmLabel: 'Place',
        });
        if (!textVal?.trim()) {
          setPlaceItem(null);
          return;
        }
        const fontSize = item.defaultFontSize ?? 0.6;
        const dims = catalogToFinestSizeAtLevel(
          Math.max(item.widthCells, Math.ceil(textVal.length * 0.4)),
          item.heightCells,
          gridLevel,
        );
        finishPlace({
          objectId: createId('text'),
          category: 'text',
          elementType: 'text',
          origin: cell,
          widthCells: dims.widthCells,
          heightCells: dims.heightCells,
          rotation: 0,
          label: textVal.trim(),
          color: item.color,
          fontSize,
          placeLevel: gridLevel,
        });
        return;
      }

      if (item.cells?.length || item.outline?.length) {
        const authoredLevel = (item.placeLevel ?? 1) as NamedGridLevel;
        const scaled = scalePolygonTemplate(
          {
            widthCells: item.widthCells,
            heightCells: item.heightCells,
            cells: item.cells,
            outline: item.outline,
            svgPath: item.svgPath,
          },
          authoredLevel,
          gridLevel,
          (lvl) => finestPerLevelCell(lvl as NamedGridLevel),
        );
        const hydrated = hydratePolygonEntity({
          objectId: createId('polygon'),
          category: item.category,
          elementType: item.elementType,
          origin: cell,
          widthCells: scaled.widthCells,
          heightCells: scaled.heightCells,
          rotation: 0,
          outline: scaled.outline?.map((v) => ({ ...v })),
          svgPath: scaled.svgPath,
          label: item.label,
          color: item.color,
          placeLevel: gridLevel,
        });
        finishPlace(hydrated);
        return;
      }

      const dims = catalogToFinestSizeAtLevel(item.widthCells, item.heightCells, gridLevel);
      finishPlace({
        objectId: createId(item.elementType),
        category: item.category,
        elementType: item.elementType,
        origin: cell,
        widthCells: dims.widthCells,
        heightCells: dims.heightCells,
        rotation: 0,
        svg: item.svg,
        label: item.label,
        color: item.color,
        placeLevel: gridLevel,
      });
    },
    [setEntities, snapSizeWorld, a, gridLevel, entityFitsFloor, showToast, requestPrompt],
  );

  const handleMarkAsPolygon = useCallback(() => {
    if (selectedCells.length === 0) return;
    const built = cellsToRelativeFinest(selectedCells, a);
    if (!built) return;
    setPolygonPending(built);
  }, [selectedCells, a]);

  const confirmPolygonSave = useCallback(
    (opts: { label: string; category: string; color: string }) => {
      if (!polygonPending) return;
      const objectId = createId('poly');
      const elementType = `custom_${Date.now().toString(36)}`;
      const outline = cellsToOutline(polygonPending.cells);
      const svgPath = outlineToSvgPath(outline);
      const style = getCategoryStyle(opts.category, elementType, opts.color);
      const svgMarkup = generateCustomElementSvg(
        svgPath,
        polygonPending.widthCells,
        polygonPending.heightCells,
        style,
      );
      const svgDataUrl = svgMarkupToDataUrl(svgMarkup);

      const entity: Entity = {
        objectId,
        category: opts.category,
        elementType,
        origin: polygonPending.origin,
        widthCells: polygonPending.widthCells,
        heightCells: polygonPending.heightCells,
        outline,
        svgPath,
        svg: svgDataUrl,
        label: opts.label,
        color: opts.color,
        placeLevel: gridLevel,
      };

      const libItem: CustomLibraryEntry = {
        id: `lib-${objectId}`,
        category: opts.category,
        elementType,
        label: opts.label,
        widthCells: polygonPending.widthCells,
        heightCells: polygonPending.heightCells,
        color: opts.color,
        outline: outline.map((v) => ({ ...v })),
        svgPath,
        svg: svgDataUrl,
        fromSelection: true,
        placeLevel: gridLevel,
      };

      setEntities([...entitiesRef.current, entity]);
      setCustomLibrary((prev) => [...prev, libItem]);
      setGlobalCustomLibrary(upsertGlobalCustomEntry(libItem));
      setSelectedCells([]);
      setSelectedIds([objectId]);
      setPolygonPending(null);
      setShowEntityMenu(true);
      showToast(`“${opts.label}” saved to catalog · reusable on other floors`);
    },
    [polygonPending, setEntities, gridLevel, showToast],
  );

  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const copies = entitiesRef.current
      .filter((e) => idSet.has(e.objectId))
      .map((e) => cloneEntity(e, e.objectId));
    setClipboard(copies);
  }, [selectedIds]);

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;

    let anchorCol = 0;
    let anchorRow = 0;
    if (selectedCells.length > 0) {
      const finest = selectedCellsToFinest(selectedCells, a);
      if (finest.length > 0) {
        anchorCol = Math.min(...finest.map((c) => c.col));
        anchorRow = Math.min(...finest.map((c) => c.row));
      }
    } else {
      const c = worldToFinestCell(cursorWorld, a);
      anchorCol = Math.max(0, c.col);
      anchorRow = Math.max(0, c.row);
    }

    let minCol = Infinity;
    let minRow = Infinity;
    for (const e of clipboard) {
      minCol = Math.min(minCol, e.origin.col);
      minRow = Math.min(minRow, e.origin.row);
    }
    const dCol = anchorCol - minCol;
    const dRow = anchorRow - minRow;
    const pasted = clipboard.map((e) => {
      const id = createId(e.elementType);
      return translateEntity(cloneEntity(e, id), dCol, dRow);
    });
    setEntities([...entitiesRef.current, ...pasted]);
    setSelectedIds(pasted.map((p) => p.objectId));
    setSelectedCells([]);
    setShowEntityMenu(false);
  }, [clipboard, selectedCells, a, cursorWorld, setEntities]);

  const handleCopyZone = useCallback(() => {
    if (selectedCells.length === 0) return;
    const finest = selectedCellsToFinest(selectedCells, a);
    const hit = entitiesInCells(entitiesRef.current, finest, a);
    if (hit.length === 0) {
      showToast('No entities in the selected zone.');
      return;
    }
    setClipboard(hit.map((e) => cloneEntity(e, e.objectId)));
  }, [selectedCells, a, showToast]);

  const handleDeleteEntitiesInSelection = useCallback(() => {
    if (selectedCells.length === 0) return;
    const finest = selectedCellsToFinest(selectedCells, a);
    const hit = entitiesInCells(entitiesRef.current, finest, a);
    if (hit.length === 0) {
      showToast('No entities in the selection.');
      return;
    }
    const locked = hit.filter((e) => e.locked);
    const unlocked = hit.filter((e) => !e.locked);
    if (unlocked.length === 0) {
      showToast('All entities in the selection are locked.');
      return;
    }
    const drop = new Set(unlocked.map((e) => e.objectId));
    setEntities(entitiesRef.current.filter((ent) => !drop.has(ent.objectId)));
    if (locked.length > 0) {
      showToast(`Deleted ${unlocked.length}; skipped ${locked.length} locked.`);
    }
    setSelectedCells([]);
    setShowEntityMenu(false);
  }, [selectedCells, a, setEntities, showToast]);

  const handleMarkZone = useCallback(async () => {
    if (selectedCells.length === 0) return;
    const label = await requestPrompt({
      title: 'Zone label',
      placeholder: 'team-1',
      confirmLabel: 'Mark zone',
    });
    if (!label?.trim()) return;
    const finest = selectedCellsToFinest(selectedCells, a);
    const compact = compactFromCells(finest);
    if (!compact) return;
    const zone: FloorZone = {
      id: createId('zone'),
      label: label.trim(),
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      ...compact,
    };
    setZones((prev) => [...prev, zone]);
    setSelectedCells([]);
  }, [selectedCells, a, zones.length, requestPrompt]);

  const handleMarkUnusable = useCallback(async () => {
    if (selectedCells.length === 0) return;
    const finest = selectedCellsToFinest(selectedCells, a).filter(
      (c) =>
        c.col >= 0 &&
        c.row >= 0 &&
        c.col < floorFinestCols(floor) &&
        c.row < floorFinestRows(floor),
    );
    if (finest.length === 0) return;
    const label = await requestPrompt({
      title: 'Unusable label',
      placeholder: 'pillar',
      confirmLabel: 'Mark',
    });
    const compact = compactFromCells(finest);
    if (!compact) return;
    const region: UnusableRegion = {
      id: createId('unusable'),
      label: (label ?? '').trim(),
      ...compact,
    };
    setUnusableRegions((prev) => [...prev, region]);
    setSelectedCells([]);
  }, [selectedCells, a, floor, requestPrompt]);

  const handleLabelUnusable = useCallback(async () => {
    if (selectedCells.length === 0) return;
    const finest = selectedCellsToFinest(selectedCells, a);
    const keys = new Set(finest.map((c) => `${c.col},${c.row}`));
    const hit = unusableRegions.filter((r) =>
      expandRegionCells(r).some((c) => keys.has(`${c.col},${c.row}`)),
    );
    if (hit.length === 0) {
      showToast('No unusable cells in the selection.');
      return;
    }
    const label = await requestPrompt({
      title: 'Unusable label',
      placeholder: 'pillar',
      defaultValue: hit[0].label,
      confirmLabel: 'Save',
    });
    if (label === null) return;
    const ids = new Set(hit.map((r) => r.id));
    setUnusableRegions((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, label: label.trim() } : r)),
    );
  }, [selectedCells, a, unusableRegions, requestPrompt, showToast]);

  const handleMarkUsable = useCallback(() => {
    if (selectedCells.length === 0) return;
    const finest = selectedCellsToFinest(selectedCells, a);
    const drop = new Set(finest.map((c) => `${c.col},${c.row}`));
    setUnusableRegions((prev) =>
      prev.flatMap((r) => {
        const remaining = expandRegionCells(r).filter(
          (c) => !drop.has(`${c.col},${c.row}`),
        );
        if (remaining.length === 0) return [];
        const components = splitIntoConnectedComponents(remaining);
        const next: UnusableRegion[] = [];
        for (let idx = 0; idx < components.length; idx++) {
          const compact = compactFromCells(components[idx]);
          if (!compact) continue;
          next.push({
            id: idx === 0 ? r.id : createId('unusable'),
            label: r.label,
            ...(r.color !== undefined ? { color: r.color } : {}),
            ...compact,
          });
        }
        return next;
      }),
    );
    setSelectedCells([]);
  }, [selectedCells, a]);

  const handleClearAllUnusable = useCallback(() => {
    if (
      unusableRegions.length > 0 &&
      !window.confirm('Clear all unusable regions on this floor?')
    ) {
      return;
    }
    setUnusableRegions([]);
    setSelectedCells([]);
  }, [unusableRegions.length]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIdsRef.current.length === 0) return;
    const drop = new Set(selectedIdsRef.current);
    const locked = entitiesRef.current.filter(
      (ent) => drop.has(ent.objectId) && ent.locked,
    );
    if (locked.length > 0) {
      showToast('Unlock entities before deleting.');
      return;
    }
    setEntities(entitiesRef.current.filter((ent) => !drop.has(ent.objectId)));
    setSelectedIds([]);
    setShowEntityMenu(false);
  }, [setEntities, showToast]);

  const handleRotate = useCallback(() => {
    if (selectedEntities.length !== 1) return;
    const e = selectedEntities[0];
    if (e.locked) {
      showToast('Unlock the entity before rotating.');
      return;
    }
    if (e.category === 'text') return;
    const next = rotateEntity90CCW(e);
    if (!entityFitsFloor(next)) {
      showToast('Rotated entity would leave the floor or hit unusable cells.');
      return;
    }
    setEntities(
      entitiesRef.current.map((ent) => (ent.objectId === e.objectId ? next : ent)),
    );
  }, [selectedEntities, setEntities, entityFitsFloor, showToast]);

  const handleLockSelected = useCallback(() => {
    if (selectedEntities.length !== 1) return;
    const id = selectedEntities[0].objectId;
    setEntities(
      entitiesRef.current.map((ent) =>
        ent.objectId === id ? { ...ent, locked: true } : ent,
      ),
    );
  }, [selectedEntities, setEntities]);

  const handleUnlockSelected = useCallback(() => {
    if (selectedEntities.length !== 1) return;
    const id = selectedEntities[0].objectId;
    setEntities(
      entitiesRef.current.map((ent) =>
        ent.objectId === id ? { ...ent, locked: false } : ent,
      ),
    );
  }, [selectedEntities, setEntities]);

  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.code === 'Space' && !e.repeat) {
        if (!typing) {
          e.preventDefault();
          setSpaceHeld(true);
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setSelectedCells([]);
        setPlaceItem(null);
        setMarqueeRect(null);
        setShowEntityMenu(false);
        dragRef.current = null;
      }
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoRef.current();
        else undoRef.current();
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoRef.current();
      }
      if (meta && e.key.toLowerCase() === 'c') {
        if (typing) return;
        e.preventDefault();
        handleCopy();
      }
      if (meta && e.key.toLowerCase() === 'v') {
        if (typing) return;
        e.preventDefault();
        handlePaste();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.length > 0) {
        if (typing) return;
        e.preventDefault();
        handleDeleteSelected();
      }

      if (
        !typing &&
        !meta &&
        selectedIdsRef.current.length > 0 &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        const stepCells =
          snapSizeWorld > 0
            ? Math.max(1, Math.round(snapSizeWorld / finestSize))
            : Math.max(1, Math.round(placementSize / finestSize));
        const large = e.shiftKey ? 4 : 1;
        const delta = stepCells * large;
        let dCol = 0;
        let dRow = 0;
        if (e.key === 'ArrowLeft') dCol = -delta;
        if (e.key === 'ArrowRight') dCol = delta;
        if (e.key === 'ArrowDown') dRow = -delta;
        if (e.key === 'ArrowUp') dRow = delta;

        const idSet = new Set(selectedIdsRef.current);
        const movable = entitiesRef.current.filter(
          (ent) => idSet.has(ent.objectId) && !ent.locked,
        );
        if (movable.length === 0) return;
        const moveIds = new Set(movable.map((e) => e.objectId));
        setEntities(
          entitiesRef.current.map((ent) =>
            moveIds.has(ent.objectId) ? translateEntity(ent, dCol, dRow) : ent,
          ),
        );
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
  }, [setEntities, handleCopy, handlePaste, handleDeleteSelected, snapSizeWorld, finestSize, placementSize]);

  const applyPolygonResize = (
    origin: Entity,
    handle: ResizeHandle,
    world: Point,
    snap: number,
  ): Entity => {
    const b = entityWorldRect(origin, a);
    let { x, y, width, height } = b;
    const right = x + width;
    const top = y + height;
    let nx = world.x;
    let ny = world.y;
    if (snap > 0) {
      nx = snapToGrid(nx, snap);
      ny = snapToGrid(ny, snap);
    }
    if (handle.includes('e')) width = Math.max(finestSize, nx - x);
    if (handle.includes('w')) {
      const newX = Math.min(nx, right - finestSize);
      width = right - newX;
      x = newX;
    }
    if (handle.includes('n')) height = Math.max(finestSize, ny - y);
    if (handle.includes('s')) {
      const newY = Math.min(ny, top - finestSize);
      height = top - newY;
      y = newY;
    }
    const widthCells = Math.max(1, Math.round(width / finestSize));
    const heightCells = Math.max(1, Math.round(height / finestSize));
    const originCell = {
      col: Math.max(0, Math.round(x / finestSize)),
      row: Math.max(0, Math.round(y / finestSize)),
    };
    return resizePolygonEntity(origin, { origin: originCell, widthCells, heightCells });
  };

  const handleEntityPointerDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (placeItem) return;
    if (!selectEnabled) return;

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
    setShowEntityMenu(true);

    const target = entitiesRef.current.find((ent) => ent.objectId === id);
    if (target?.locked) {
      movedRef.current = false;
      dragRef.current = null;
      return;
    }

    const moveIds = ids.filter((oid) => {
      const ent = entitiesRef.current.find((x) => x.objectId === oid);
      return ent && !ent.locked;
    });
    if (moveIds.length === 0) return;

    movedRef.current = false;
    dragRef.current = {
      type: 'move',
      startWorld: world,
      originEntities: entitiesRef.current.map((ent) => cloneEntity(ent, ent.objectId)),
      ids: moveIds,
    };
  };

  const handleHandleDown = (handle: ResizeHandle, e: React.MouseEvent) => {
    if (selectedEntities.length !== 1) return;
    const ent = selectedEntities[0];
    if (!isPolygonEntity(ent) || ent.locked) return;
    movedRef.current = false;
    dragRef.current = {
      type: 'resize',
      handle,
      startWorld: clientToWorld(e.clientX, e.clientY),
      originEntities: entitiesRef.current.map((x) => cloneEntity(x, x.objectId)),
      entityId: ent.objectId,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    const world = clientToWorld(e.clientX, e.clientY);
    movedRef.current = false;

    if (placeItem && e.button === 0 && !e.ctrlKey && !e.metaKey) {
      void placeEntityAt(placeItem, world);
      return;
    }

    const hit = selectEnabled ? hitTestEntity(entitiesRef.current, world, a) : null;

    // Ctrl/Cmd+drag cell marquee only when Select is on
    if (selectEnabled && (e.ctrlKey || e.metaKey)) {
      dragRef.current = {
        type: 'marquee',
        startWorld: world,
        currentWorld: world,
        additive: e.shiftKey,
      };
      setMarqueeRect({ x: world.x, y: world.y, width: 0, height: 0 });
      return;
    }

    const panAllowed =
      panEnabled || spaceHeld || e.button === 1;
    // Empty-canvas left drag pans only when Pan is enabled (or Space / middle)
    const wantPan =
      panAllowed &&
      (e.button === 1 ||
        spaceHeld ||
        (e.button === 0 && panEnabled && !e.ctrlKey && !e.metaKey && !hit));

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

    // Select-only: empty drag starts cell marquee (no Ctrl required)
    if (selectEnabled && e.button === 0 && !hit) {
      dragRef.current = {
        type: 'marquee',
        startWorld: world,
        currentWorld: world,
        additive: e.shiftKey,
      };
      setMarqueeRect({ x: world.x, y: world.y, width: 0, height: 0 });
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
      setClampedViewport({
        zoom: viewportRef.current.zoom,
        panX: drag.panX + dx,
        panY: drag.panY + dy,
      });
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
      const dCol = Math.round(dx / finestSize);
      const dRow = Math.round(dy / finestSize);
      const idSet = new Set(drag.ids);
      const moved = drag.originEntities.map((ent) =>
        idSet.has(ent.objectId) ? translateEntity(ent, dCol, dRow) : ent,
      );
      // Preview move; validity checked on mouse-up
      replaceEntities(moved);
      return;
    }

    if (drag.type === 'resize') {
      const origin = drag.originEntities.find((ent) => ent.objectId === drag.entityId);
      if (!origin) return;
      const next = applyPolygonResize(origin, drag.handle, world, snapSizeWorld);
      replaceEntities(
        drag.originEntities.map((ent) => (ent.objectId === next.objectId ? next : ent)),
      );
    }
  };

  const handleMouseUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag?.type === 'pan') {
      if (!movedRef.current && selectEnabled) {
        const cell = worldToCell(drag.worldAtStart, gridLevel, a);
        if (isCellOnFloor(cell, floor)) {
          if (!drag.shift) setSelectedIds([]);
          setSelectedCells((prev) => mergeCells(prev, [cell], drag.shift));
          setShowEntityMenu(false);
        }
      }
      return;
    }

    if (drag?.type === 'marquee') {
      if (!selectEnabled) {
        setMarqueeRect(null);
        return;
      }
      const rect = worldRectFromPoints(drag.startWorld, drag.currentWorld);
      setMarqueeRect(null);
      if (rect.width * viewport.zoom < CLICK_PX && rect.height * viewport.zoom < CLICK_PX) {
        // Click without drag: select single cell under cursor
        const cell = worldToCell(drag.startWorld, gridLevel, a);
        if (isCellOnFloor(cell, floor)) {
          setSelectedCells((prev) => mergeCells(prev, [cell], drag.additive));
          if (!drag.additive) setSelectedIds([]);
          setShowEntityMenu(false);
        }
        return;
      }
      const cells = cellsInWorldRect(rect, gridLevel, a, floor);
      setSelectedCells((prev) => mergeCells(prev, cells, drag.additive));
      if (!drag.additive) setSelectedIds([]);
      setShowEntityMenu(false);
      return;
    }

    if (drag?.type === 'move' && movedRef.current) {
      const nextEntities = entitiesRef.current;
      const idSet = new Set(drag.ids);
      const ok = nextEntities
        .filter((e) => idSet.has(e.objectId))
        .every((e) => entityFitsFloor(e));
      if (!ok) {
        replaceEntities(drag.originEntities);
        showToast('Cannot move onto unusable cells or outside the floor.');
      } else {
        commitDrag(drag.originEntities);
      }
      return;
    }

    if (drag?.type === 'resize' && movedRef.current) {
      commitDrag(drag.originEntities);
    }
  };

  const handleUpdateSelected = (patch: Partial<Entity>) => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    setEntities(entities.map((e) => (e.objectId === id ? { ...e, ...patch } : e)));
  };

  const handleSaveDraft = (name: string) => {
    saveDraft({ ...buildDocument(), name });
  };

  const applyDocument = (doc: FloorDocument) => {
    const normalized = normalizeDocument(doc);
    setFloor(normalized.floor);
    if (normalized.viewport) setClampedViewport(normalized.viewport);
    resetEntities(normalized.entities);
    setZones(normalized.zones ?? []);
    setCustomLibrary(normalized.customLibrary ?? []);
    // Promote draft customs into the workspace library so they stay reusable
    let global = loadGlobalCustomLibrary();
    for (const entry of normalized.customLibrary ?? []) {
      global = upsertGlobalCustomEntry(entry, global);
    }
    setGlobalCustomLibrary(global);
    setUnusableRegions(normalized.unusableRegions ?? []);
    setSelectedIds([]);
    setSelectedCells([]);
    if (normalized.theme) setTheme(normalized.theme);
  };

  const handleLoadDraft = (name: string) => {
    const doc = loadDraft(name);
    if (!doc) return;
    applyDocument(doc);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result)) as FloorDocument;
        if (doc.version !== 2) {
          showToast('Unsupported floor JSON version.');
          return;
        }
        applyDocument(doc);
      } catch {
        showToast('Failed to parse floor JSON.');
      }
    };
    reader.readAsText(file);
  };

  const runExport = async (kind: 'png' | 'svg' | 'pdf') => {
    const svg = svgRef.current;
    if (!svg) return;
    const stamp = Date.now();
    if (kind === 'svg') exportSvg(svg, floor, `floor-${stamp}.svg`, includeGridOnExport);
    if (kind === 'png') await exportPng(svg, floor, `floor-${stamp}.png`, includeGridOnExport);
    if (kind === 'pdf') await exportPdf(svg, floor, `floor-${stamp}.pdf`, includeGridOnExport);
  };

  const axisLabels = useMemo(() => {
    const bounds = getVisibleWorldBounds(viewport, svgSize.width, svgSize.height);
    const fw = floorWorldWidth(floor);
    const fh = floorWorldHeight(floor);
    // Label current-level cell indices; thin by skipping cells (not by changing units).
    const minLabelPx = 36;
    const labelEvery = Math.max(
      1,
      Math.ceil(minLabelPx / Math.max(1e-9, gridCellSize * viewport.zoom)),
    );
    const xs = axisLabelMarks(bounds.minX, Math.min(bounds.maxX, fw), gridCellSize, labelEvery, fw);
    const ys = axisLabelMarks(bounds.minY, Math.min(bounds.maxY, fh), gridCellSize, labelEvery, fh);
    return {
      labelEvery,
      xs: xs.slice(0, 80),
      ys: ys.slice(0, 80),
    };
  }, [viewport, svgSize, gridCellSize, floor]);

  const cursorStyle =
    panEnabled || spaceHeld ? 'grab' : placeItem ? 'crosshair' : 'default';

  const singleSelected = selectedEntities.length === 1 ? selectedEntities[0] : null;

  const colorFor = (entity: Entity) =>
    getCategoryStyle(entity.category, entity.elementType, entity.color).fill;

  const cursorCell = worldToFinestCell(cursorWorld, a);
  const cursorPos = worldToCell(cursorWorld, gridLevel, a);

  const selectionHasUnusable = useMemo(() => {
    if (selectedCells.length === 0) return false;
    const finest = selectedCellsToFinest(selectedCells, a);
    return finest.some((c) =>
      unusableRegions.some((r) => finestCellInRegion(c.col, c.row, r)),
    );
  }, [selectedCells, a, unusableRegions]);

  const entitiesInSelectionCount = useMemo(() => {
    if (selectedCells.length === 0) return 0;
    const finest = selectedCellsToFinest(selectedCells, a);
    return entitiesInCells(entities, finest, a).length;
  }, [selectedCells, a, entities]);

  const placePreview = useMemo(() => {
    if (!placeItem) return null;
    let world = cursorWorld;
    if (snapSizeWorld > 0) {
      world = snapPointToGrid(cursorWorld.x, cursorWorld.y, snapSizeWorld);
    }
    let origin = worldToLevelFinest(world, gridLevel, a);
    origin = { col: Math.max(0, origin.col), row: Math.max(0, origin.row) };

    if (placeItem.cells?.length || placeItem.outline?.length) {
      const authoredLevel = (placeItem.placeLevel ?? 1) as NamedGridLevel;
      const scaled = scalePolygonTemplate(
        {
          widthCells: placeItem.widthCells,
          heightCells: placeItem.heightCells,
          cells: placeItem.cells,
          outline: placeItem.outline,
          svgPath: placeItem.svgPath,
        },
        authoredLevel,
        gridLevel,
        (lvl) => finestPerLevelCell(lvl as NamedGridLevel),
      );
      const draft: Entity = {
        objectId: 'preview',
        category: placeItem.category,
        elementType: placeItem.elementType,
        origin,
        widthCells: scaled.widthCells,
        heightCells: scaled.heightCells,
        outline: scaled.outline,
        placeLevel: gridLevel,
      };
      return {
        origin,
        widthCells: scaled.widthCells,
        heightCells: scaled.heightCells,
        outline: scaled.outline,
        fits: entityFitsFloor(draft),
        color: placeItem.color,
      };
    }

    const dims =
      placeItem.category === 'text'
        ? catalogToFinestSizeAtLevel(
            Math.max(placeItem.widthCells, 4),
            placeItem.heightCells,
            gridLevel,
          )
        : catalogToFinestSizeAtLevel(
            placeItem.widthCells,
            placeItem.heightCells,
            gridLevel,
          );
    const draft: Entity = {
      objectId: 'preview',
      category: placeItem.category,
      elementType: placeItem.elementType,
      origin,
      widthCells: dims.widthCells,
      heightCells: dims.heightCells,
      placeLevel: gridLevel,
    };
    return {
      origin,
      widthCells: dims.widthCells,
      heightCells: dims.heightCells,
      fits: entityFitsFloor(draft),
      color: placeItem.color,
    };
  }, [
    placeItem,
    cursorWorld,
    snapSizeWorld,
    gridLevel,
    a,
    entityFitsFloor,
  ]);

  return (
    <div className="editor-layout">
      <Toolbar
        viewport={viewport}
        selectEnabled={selectEnabled}
        panEnabled={panEnabled}
        showGrid={showGrid}
        snapEnabled={snapEnabled}
        includeGridOnExport={includeGridOnExport}
        theme={theme}
        canUndo={canUndo}
        canRedo={canRedo}
        canPaste={clipboard.length > 0}
        canDelete={selectedIds.length > 0}
        onToggleSelect={() => {
          setSelectEnabled((v) => !v);
          setPlaceItem(null);
        }}
        onTogglePan={() => {
          setPanEnabled((v) => !v);
          setPlaceItem(null);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitFloor={handleFitFloor}
        onToggleGrid={() => setShowGrid((g) => !g)}
        onToggleSnap={() => setSnapEnabled((s) => !s)}
        onToggleExportGrid={() => setIncludeGridOnExport((g) => !g)}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onUndo={undo}
        onRedo={redo}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDeleteSelected}
        onHowToUse={() => setHowToOpen(true)}
        onSaveDraft={handleSaveDraft}
        onLoadDraft={handleLoadDraft}
        onExportPng={() => void runExport('png')}
        onExportSvg={() => void runExport('svg')}
        onExportPdf={() => void runExport('pdf')}
        onOpenPreview={() => onOpenPretty(buildDocument())}
      />

      <div className="editor-body">
        <EntityLibrary
          categories={categories}
          customItems={mergedCustomLibrary}
          activeId={placeItem?.id ?? null}
          onSelect={(item) => {
            setPlaceItem(item);
          }}
          onDeleteCustom={(id) => {
            setCustomLibrary((prev) => deleteCustomLibraryEntry(prev, id));
            setGlobalCustomLibrary(removeGlobalCustomEntry(id));
          }}
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
                <rect
                  x={0}
                  y={0}
                  width={floorWorldWidth(floor)}
                  height={floorWorldHeight(floor)}
                />
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
              />
              <OutsideFloorOverlay
                floor={floor}
                viewport={viewport}
                svgWidth={svgSize.width}
                svgHeight={svgSize.height}
              />
              <UnusableLayer regions={unusableRegions} a={a} />
              <ZonesLayer zones={zones} a={a} />
              <CellHighlight
                hoveredCell={hoveredCell}
                selectedCells={selectedCells}
                floor={floor}
                a={a}
              />
              {placePreview && (
                <PlacePreview
                  origin={placePreview.origin}
                  widthCells={placePreview.widthCells}
                  heightCells={placePreview.heightCells}
                  outline={placePreview.outline}
                  fits={placePreview.fits}
                  a={a}
                  color={placePreview.color}
                />
              )}
              <EntitiesLayer
                entities={entities}
                selectedIds={selectedSet}
                a={a}
                colorFor={colorFor}
                onEntityPointerDown={handleEntityPointerDown}
              />
              {singleSelected && isPolygonEntity(singleSelected) && !singleSelected.locked && (
                <ResizeHandles
                  entity={singleSelected}
                  a={a}
                  zoom={viewport.zoom}
                  onHandleDown={handleHandleDown}
                />
              )}
            </g>

            <SelectionMarquee rect={marqueeRect} viewport={viewport} />

            <g
              id="axis-labels"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
              className="axis-labels"
            >
              {axisLabels.xs.map((mark) => {
                const sx = mark.world * viewport.zoom + viewport.panX;
                const sy = svgSize.height - 10;
                if (sx < 2 || sx > svgSize.width - 8) return null;
                return (
                  <text key={`lx-${mark.index}`} x={sx} y={sy} textAnchor="middle">
                    {mark.index}
                  </text>
                );
              })}
              {axisLabels.ys.map((mark) => {
                const sx = 10;
                const sy = -mark.world * viewport.zoom + viewport.panY;
                if (sy < 10 || sy > svgSize.height - 14) return null;
                return (
                  <text
                    key={`ly-${mark.index}`}
                    x={sx}
                    y={sy}
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {mark.index}
                  </text>
                );
              })}
            </g>
          </svg>

          {selectionMenuPos && (
            <SelectionActionMenu
              x={selectionMenuPos.x}
              y={selectionMenuPos.y}
              cellCount={selectedCells.length}
              canPaste={clipboard.length > 0}
              hasUnusableInSelection={selectionHasUnusable}
              entityCountInSelection={entitiesInSelectionCount}
              onMarkPolygon={handleMarkAsPolygon}
              onPaste={handlePaste}
              onCopyZone={handleCopyZone}
              onMarkZone={() => void handleMarkZone()}
              onMarkUnusable={() => void handleMarkUnusable()}
              onLabelUnusable={() => void handleLabelUnusable()}
              onMarkUsable={handleMarkUsable}
              onClearAllUnusable={handleClearAllUnusable}
              onDeleteEntities={handleDeleteEntitiesInSelection}
              onClear={() => setSelectedCells([])}
            />
          )}

          {entityMenuPos && singleSelected && (
            <EntityActionMenu
              x={entityMenuPos.x}
              y={entityMenuPos.y}
              locked={Boolean(singleSelected.locked)}
              onCopy={handleCopy}
              onRotate={handleRotate}
              onDelete={handleDeleteSelected}
              onLock={handleLockSelected}
              onUnlock={handleUnlockSelected}
              onClose={() => setShowEntityMenu(false)}
            />
          )}

          <GridNavBars
            floor={floor}
            viewport={viewport}
            svgWidth={svgSize.width}
            svgHeight={svgSize.height}
            onViewport={setClampedViewport}
          />

          <div className="status-bar">
            <span>
              cell ({Math.max(0, cursorCell.col)}, {Math.max(0, cursorCell.row)})
            </span>
            <span>
              pos ({Math.max(0, cursorPos.col)}, {Math.max(0, cursorPos.row)})
            </span>
            <span>
              a={floor.a} · cell {gridCellSize.toFixed(2)} · L{gridLevel} · place L{gridLevel}
            </span>
            <span>{snapEnabled ? 'Snap ON' : 'Snap OFF'}</span>
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} entity(s)`
                : selectedCells.length > 0
                  ? `${selectedCells.length} cell(s)`
                  : 'Nothing selected'}
            </span>
          </div>
        </div>

        <PropertiesPanel
          floor={floor}
          onFloorChange={setFloor}
          selected={selectedEntities}
          onUpdateSelected={handleUpdateSelected}
          zones={zones}
          onDeleteZone={(id) =>
            setZones((prev) => prev.filter((z) => z.id !== id || Boolean(z.locked)))
          }
          onUpdateZone={(id, patch) =>
            setZones((prev) =>
              prev.map((z) => (z.id === id ? { ...z, ...patch } : z)),
            )
          }
          unusableRegions={unusableRegions}
          onLabelUnusableRegion={(id) => {
            void (async () => {
              const r = unusableRegions.find((x) => x.id === id);
              const label = await requestPrompt({
                title: 'Unusable label',
                placeholder: 'pillar',
                defaultValue: r?.label ?? '',
                confirmLabel: 'Save',
              });
              if (label === null) return;
              setUnusableRegions((prev) =>
                prev.map((x) => (x.id === id ? { ...x, label: label.trim() } : x)),
              );
            })();
          }}
          onDeleteUnusableRegion={(id) =>
            setUnusableRegions((prev) => prev.filter((r) => r.id !== id))
          }
          onExportJson={() => downloadFloorJson(buildDocument())}
          onCopyJson={() => {
            void navigator.clipboard.writeText(floorDocumentToJson(buildDocument()));
          }}
          onImportJson={handleImportJson}
        />
      </div>

      <HowToUseModal open={howToOpen} onClose={() => setHowToOpen(false)} />
      <SavePolygonDialog
        open={Boolean(polygonPending)}
        defaultLabel={`Polygon ${customLibrary.length + 1}`}
        onCancel={() => setPolygonPending(null)}
        onSave={confirmPolygonSave}
      />
      <PromptToast
        request={promptReq}
        onCancel={() => {
          const resolve = promptResolveRef.current;
          promptResolveRef.current = null;
          setPromptReq(null);
          resolve?.(null);
        }}
        onSubmit={(value) => {
          const resolve = promptResolveRef.current;
          promptResolveRef.current = null;
          setPromptReq(null);
          resolve?.(value);
        }}
      />
      <MessageToast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
};

export default FloorEditor;
