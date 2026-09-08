import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type {
  EditorTool,
  ElementType,
  FloorObject,
  FloorPlanDocument,
  ViewportState,
} from '@/types/floorPlan';
import { createSampleFloorPlan } from '@/data/sampleFloorPlan';
import { createId, getElementDefinition } from '@/data/elementLibrary';
import { clampZoom, snapToGrid } from '@/utils/coordinates';

const STORAGE_KEY = 'spacemap-floor-plan-v1';

export interface EditorState {
  document: FloorPlanDocument;
  selectedIds: string[];
  tool: EditorTool;
  viewport: ViewportState;
  snapEnabled: boolean;
  gridVisible: boolean;
  pointerWorld: { x: number; y: number };
  optimizeBanner: string | null;
}

type HistorySnapshot = FloorPlanDocument;

interface StoreState {
  present: EditorState;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

type Action =
  | { type: 'SET_TOOL'; tool: EditorTool }
  | { type: 'SET_VIEWPORT'; viewport: Partial<ViewportState> }
  | { type: 'SET_POINTER'; x: number; y: number }
  | { type: 'SELECT'; ids: string[]; additive?: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'ADD_OBJECT'; object: FloorObject }
  | { type: 'UPDATE_OBJECTS'; updates: (Partial<FloorObject> & { id: string })[]; pushHistory?: boolean }
  | { type: 'DELETE_SELECTED' }
  | { type: 'DUPLICATE_SELECTED' }
  | { type: 'SET_PROPERTY'; id: string; key: string; value: unknown }
  | { type: 'LOAD_DOCUMENT'; document: FloorPlanDocument }
  | { type: 'RESET_SAMPLE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'COMMIT_HISTORY' }
  | { type: 'SET_OPTIMIZE_BANNER'; message: string | null };

function cloneDoc(doc: FloorPlanDocument): FloorPlanDocument {
  return structuredClone(doc);
}

function pushPast(state: StoreState, doc: FloorPlanDocument): StoreState {
  return {
    ...state,
    past: [...state.past.slice(-49), cloneDoc(doc)],
    future: [],
  };
}

function createInitialEditor(): EditorState {
  let doc = createSampleFloorPlan();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FloorPlanDocument;
      if (parsed?.version === 1 && parsed.objects && parsed.floor) {
        doc = parsed;
      }
    }
  } catch {
    /* use sample */
  }
  return {
    document: doc,
    selectedIds: [],
    tool: 'select',
    viewport: { zoom: 1, panX: 40, panY: 40 },
    snapEnabled: true,
    gridVisible: true,
    pointerWorld: { x: 0, y: 0 },
    optimizeBanner: null,
  };
}

function reducer(state: StoreState, action: Action): StoreState {
  const { present } = state;
  const doc = present.document;

  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, present: { ...present, tool: action.tool } };

    case 'SET_VIEWPORT':
      return {
        ...state,
        present: {
          ...present,
          viewport: {
            ...present.viewport,
            ...action.viewport,
            zoom: action.viewport.zoom !== undefined
              ? clampZoom(action.viewport.zoom)
              : present.viewport.zoom,
          },
        },
      };

    case 'SET_POINTER':
      return {
        ...state,
        present: { ...present, pointerWorld: { x: action.x, y: action.y } },
      };

    case 'SELECT': {
      let ids = action.ids;
      if (action.additive) {
        const set = new Set(present.selectedIds);
        for (const id of action.ids) {
          if (set.has(id)) set.delete(id);
          else set.add(id);
        }
        ids = [...set];
      }
      return { ...state, present: { ...present, selectedIds: ids } };
    }

    case 'CLEAR_SELECTION':
      return { ...state, present: { ...present, selectedIds: [] } };

    case 'TOGGLE_SNAP':
      return { ...state, present: { ...present, snapEnabled: !present.snapEnabled } };

    case 'TOGGLE_GRID':
      return { ...state, present: { ...present, gridVisible: !present.gridVisible } };

    case 'ADD_OBJECT': {
      const next = pushPast(state, doc);
      return {
        ...next,
        present: {
          ...present,
          document: { ...doc, objects: [...doc.objects, action.object] },
          selectedIds: [action.object.id],
        },
      };
    }

    case 'UPDATE_OBJECTS': {
      const shouldPush = action.pushHistory !== false;
      const base = shouldPush ? pushPast(state, doc) : state;
      const map = new Map(action.updates.map((u) => [u.id, u]));
      const objects = doc.objects.map((o) => {
        const u = map.get(o.id);
        return u ? { ...o, ...u, properties: u.properties ?? o.properties } : o;
      });
      return {
        ...base,
        present: {
          ...present,
          document: { ...doc, objects },
        },
      };
    }

    case 'DELETE_SELECTED': {
      if (!present.selectedIds.length) return state;
      const next = pushPast(state, doc);
      const remove = new Set(present.selectedIds);
      return {
        ...next,
        present: {
          ...present,
          document: {
            ...doc,
            objects: doc.objects.filter((o) => !remove.has(o.id)),
          },
          selectedIds: [],
        },
      };
    }

    case 'DUPLICATE_SELECTED': {
      if (!present.selectedIds.length) return state;
      const next = pushPast(state, doc);
      const selected = doc.objects.filter((o) => present.selectedIds.includes(o.id));
      const clones = selected.map((o) => ({
        ...structuredClone(o),
        id: createId(o.type),
        x: o.x + 1,
        y: o.y + 1,
      }));
      return {
        ...next,
        present: {
          ...present,
          document: { ...doc, objects: [...doc.objects, ...clones] },
          selectedIds: clones.map((c) => c.id),
        },
      };
    }

    case 'SET_PROPERTY': {
      const next = pushPast(state, doc);
      return {
        ...next,
        present: {
          ...present,
          document: {
            ...doc,
            objects: doc.objects.map((o) =>
              o.id === action.id
                ? {
                    ...o,
                    properties: { ...o.properties, [action.key]: action.value },
                  }
                : o,
            ),
          },
        },
      };
    }

    case 'LOAD_DOCUMENT':
      return {
        past: [],
        future: [],
        present: {
          ...present,
          document: action.document,
          selectedIds: [],
        },
      };

    case 'RESET_SAMPLE':
      return {
        past: [],
        future: [],
        present: {
          ...present,
          document: createSampleFloorPlan(),
          selectedIds: [],
          optimizeBanner: null,
        },
      };

    case 'COMMIT_HISTORY':
      return pushPast(state, doc);

    case 'UNDO': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [cloneDoc(doc), ...state.future],
        present: { ...present, document: previous, selectedIds: [] },
      };
    }

    case 'REDO': {
      if (!state.future.length) return state;
      const nextDoc = state.future[0];
      return {
        past: [...state.past, cloneDoc(doc)],
        future: state.future.slice(1),
        present: { ...present, document: nextDoc, selectedIds: [] },
      };
    }

    case 'SET_OPTIMIZE_BANNER':
      return {
        ...state,
        present: { ...present, optimizeBanner: action.message },
      };

    default:
      return state;
  }
}

interface FloorPlanContextValue {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: React.Dispatch<Action>;
  addElementAt: (type: ElementType, worldX: number, worldY: number) => void;
  saveToStorage: () => void;
  exportJson: () => void;
  loadFromFile: (file: File) => Promise<void>;
  beginTransform: () => void;
  endTransform: (updates: (Partial<FloorObject> & { id: string })[]) => void;
  updateLive: (updates: (Partial<FloorObject> & { id: string })[]) => void;
}

const FloorPlanContext = createContext<FloorPlanContextValue | null>(null);

export function FloorPlanProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = useReducer(reducer, undefined, () => ({
    present: createInitialEditor(),
    past: [] as HistorySnapshot[],
    future: [] as HistorySnapshot[],
  }));

  const transforming = useRef(false);

  const addElementAt = useCallback(
    (type: ElementType, worldX: number, worldY: number) => {
      const def = getElementDefinition(type);
      const grid = store.present.document.floor.gridSize;
      const snap = store.present.snapEnabled;
      const object: FloorObject = {
        id: createId(type),
        type,
        x: snapToGrid(worldX - def.defaultWidth / 2, grid, snap),
        y: snapToGrid(worldY - def.defaultHeight / 2, grid, snap),
        width: def.defaultWidth,
        height: def.defaultHeight,
        rotation: 0,
        layer: def.layer,
        mobility: def.mobility,
        properties: { ...(def.defaultProperties ?? {}) },
      };
      dispatch({ type: 'ADD_OBJECT', object });
    },
    [store.present.document.floor.gridSize, store.present.snapEnabled],
  );

  const saveToStorage = useCallback(() => {
    const doc = {
      ...store.present.document,
      meta: {
        ...store.present.document.meta,
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    dispatch({ type: 'LOAD_DOCUMENT', document: doc });
  }, [store.present.document]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(store.present.document, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.present.document.meta?.name ?? 'spacemap'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store.present.document]);

  const loadFromFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as FloorPlanDocument;
    if (!parsed.floor || !parsed.objects) throw new Error('Invalid floor plan file');
    dispatch({ type: 'LOAD_DOCUMENT', document: parsed });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }, []);

  const beginTransform = useCallback(() => {
    if (!transforming.current) {
      transforming.current = true;
      dispatch({ type: 'COMMIT_HISTORY' });
    }
  }, []);

  const endTransform = useCallback(
    (updates: (Partial<FloorObject> & { id: string })[]) => {
      transforming.current = false;
      if (updates.length) {
        dispatch({ type: 'UPDATE_OBJECTS', updates, pushHistory: false });
      }
    },
    [],
  );

  const updateLive = useCallback(
    (updates: (Partial<FloorObject> & { id: string })[]) => {
      dispatch({ type: 'UPDATE_OBJECTS', updates, pushHistory: false });
    },
    [],
  );

  const value = useMemo<FloorPlanContextValue>(
    () => ({
      state: store.present,
      canUndo: store.past.length > 0,
      canRedo: store.future.length > 0,
      dispatch,
      addElementAt,
      saveToStorage,
      exportJson,
      loadFromFile,
      beginTransform,
      endTransform,
      updateLive,
    }),
    [
      store,
      addElementAt,
      saveToStorage,
      exportJson,
      loadFromFile,
      beginTransform,
      endTransform,
      updateLive,
    ],
  );

  return (
    <FloorPlanContext.Provider value={value}>{children}</FloorPlanContext.Provider>
  );
}

export function useFloorPlan() {
  const ctx = useContext(FloorPlanContext);
  if (!ctx) throw new Error('useFloorPlan must be used within FloorPlanProvider');
  return ctx;
}
