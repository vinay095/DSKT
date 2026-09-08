import React, { useRef } from 'react';
import { useFloorPlan } from '@/app/providers/FloorPlanProvider';
import { clampZoom, PIXELS_PER_UNIT } from '@/utils/coordinates';
import type { EditorTool } from '@/types/floorPlan';

export const Toolbar: React.FC = () => {
  const {
    state,
    canUndo,
    canRedo,
    dispatch,
    saveToStorage,
    exportJson,
    loadFromFile,
  } = useFloorPlan();
  const fileRef = useRef<HTMLInputElement>(null);
  const { tool, viewport, snapEnabled, gridVisible, document: doc } = state;

  const setTool = (t: EditorTool) => dispatch({ type: 'SET_TOOL', tool: t });

  const setZoom = (z: number) =>
    dispatch({ type: 'SET_VIEWPORT', viewport: { zoom: clampZoom(z) } });

  const fitToScreen = () => {
    const host = document.querySelector('.sm-canvas-host') as HTMLElement | null;
    if (!host) return;
    const pad = 48;
    const availW = host.clientWidth - pad * 2;
    const availH = host.clientHeight - pad * 2;
    const floorW = doc.floor.width * PIXELS_PER_UNIT;
    const floorH = doc.floor.height * PIXELS_PER_UNIT;
    const z = clampZoom(Math.min(availW / floorW, availH / floorH));
    const panX = (host.clientWidth - floorW * z) / 2;
    const panY = (host.clientHeight - floorH * z) / 2;
    dispatch({ type: 'SET_VIEWPORT', viewport: { zoom: z, panX, panY } });
  };

  const resetView = () =>
    dispatch({ type: 'SET_VIEWPORT', viewport: { zoom: 1, panX: 40, panY: 40 } });

  const optimize = () => {
    dispatch({
      type: 'SET_OPTIMIZE_BANNER',
      message:
        'Optimize is a placeholder. Future flow: requirements → constraints → engine → updated coordinates.',
    });
    window.setTimeout(
      () => dispatch({ type: 'SET_OPTIMIZE_BANNER', message: null }),
      5000,
    );
  };

  return (
    <header className="sm-toolbar">
      <div className="sm-brand">
        <div className="sm-brand__mark" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.75" />
            <rect x="11" y="11" width="5" height="4" fill="currentColor" opacity="0.85" />
          </svg>
        </div>
        <div className="sm-brand__text">
          <strong>SpaceMap</strong>
          <span>Intelligent Workplace Floor Planning &amp; Seating Optimization</span>
        </div>
      </div>

      <div className="sm-toolbar__group" role="toolbar" aria-label="Tools">
        <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Select (V)">
          Select
        </ToolBtn>
        <ToolBtn active={tool === 'pan'} onClick={() => setTool('pan')} title="Pan (H / Space)">
          Pan
        </ToolBtn>
        <ToolBtn
          active={tool === 'draw'}
          onClick={() => {
            setTool('draw');
            dispatch({
              type: 'SET_OPTIMIZE_BANNER',
              message: 'Draw mode: drag an element from the library onto the canvas to place it. Freehand draw arrives in a later iteration.',
            });
          }}
          title="Draw / place"
        >
          Draw
        </ToolBtn>
        <span className="sm-sep" />
        <ToolBtn disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })} title="Undo">
          Undo
        </ToolBtn>
        <ToolBtn disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })} title="Redo">
          Redo
        </ToolBtn>
        <span className="sm-sep" />
        <ToolBtn onClick={() => setZoom(viewport.zoom - 0.1)} title="Zoom out">
          −
        </ToolBtn>
        <button
          type="button"
          className="sm-zoom-readout"
          onClick={resetView}
          title="Reset zoom"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <ToolBtn onClick={() => setZoom(viewport.zoom + 0.1)} title="Zoom in">
          +
        </ToolBtn>
        <ToolBtn onClick={fitToScreen} title="Fit floor to screen">
          Fit
        </ToolBtn>
        <span className="sm-sep" />
        <ToolBtn
          active={gridVisible}
          onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
          title="Toggle grid"
        >
          Grid
        </ToolBtn>
        <ToolBtn
          active={snapEnabled}
          onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
          title="Snap to grid"
        >
          Snap
        </ToolBtn>
        <ToolBtn
          onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
          title="Delete selected"
          danger
        >
          Delete
        </ToolBtn>
      </div>

      <div className="sm-toolbar__actions">
        <ToolBtn onClick={() => fileRef.current?.click()} title="Load JSON">
          Load
        </ToolBtn>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void loadFromFile(f).catch((err) => alert(String(err)));
            e.target.value = '';
          }}
        />
        <ToolBtn
          onClick={() => {
            if (confirm('Reset to the sample floor plan? Unsaved changes in memory will be lost.')) {
              dispatch({ type: 'RESET_SAMPLE' });
              localStorage.removeItem('spacemap-floor-plan-v1');
            }
          }}
          title="Reset sample plan"
        >
          Reset
        </ToolBtn>
        <ToolBtn onClick={saveToStorage} title="Save to browser">
          Save
        </ToolBtn>
        <ToolBtn onClick={exportJson} title="Export JSON">
          Export
        </ToolBtn>
        <button type="button" className="sm-btn sm-btn--accent" onClick={optimize}>
          Optimize
        </button>
      </div>
    </header>
  );
};

function ToolBtn({
  children,
  onClick,
  active,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`sm-btn ${active ? 'is-active' : ''} ${danger ? 'sm-btn--danger' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
