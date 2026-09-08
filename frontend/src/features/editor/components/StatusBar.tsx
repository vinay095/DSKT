import React, { useMemo } from 'react';
import { useFloorPlan } from '@/app/providers/FloorPlanProvider';
import { formatCoord, PIXELS_PER_UNIT } from '@/utils/coordinates';

interface StatusBarProps {
  canvasWidth: number;
  canvasHeight: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ canvasWidth, canvasHeight }) => {
  const { state, dispatch } = useFloorPlan();
  const { pointerWorld, viewport, document: doc, selectedIds, snapEnabled } = state;

  const deskCount = useMemo(
    () => doc.objects.filter((o) => o.type === 'desk' || o.type === 'workstation').length,
    [doc.objects],
  );

  return (
    <footer className="sm-statusbar">
      <div className="sm-statusbar__left">
        <span className="sm-status-pill">{doc.floor.name}</span>
        <span>
          X {formatCoord(pointerWorld.x)} · Y {formatCoord(pointerWorld.y)}
        </span>
        <span className="sm-muted">
          Floor {doc.floor.width} × {doc.floor.height} · Grid {doc.floor.gridSize}
          {snapEnabled ? ' · Snap on' : ' · Snap off'}
        </span>
        <span className="sm-muted">
          {doc.objects.length} objects · {deskCount} seats
          {selectedIds.length ? ` · ${selectedIds.length} selected` : ''}
        </span>
      </div>
      <div className="sm-statusbar__right">
        <button
          type="button"
          className="sm-btn sm-btn--ghost"
          onClick={() =>
            dispatch({
              type: 'SET_VIEWPORT',
              viewport: { zoom: Math.max(0.25, viewport.zoom - 0.1) },
            })
          }
        >
          −
        </button>
        <span className="sm-zoom-readout">{Math.round(viewport.zoom * 100)}%</span>
        <button
          type="button"
          className="sm-btn sm-btn--ghost"
          onClick={() =>
            dispatch({
              type: 'SET_VIEWPORT',
              viewport: { zoom: Math.min(4, viewport.zoom + 0.1) },
            })
          }
        >
          +
        </button>
        <Minimap canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      </div>
    </footer>
  );
};

const Minimap: React.FC<{ canvasWidth: number; canvasHeight: number }> = ({
  canvasWidth,
  canvasHeight,
}) => {
  const { state, dispatch } = useFloorPlan();
  const { document: doc, viewport } = state;
  const mw = 140;
  const mh = 78;
  const scale = Math.min(mw / doc.floor.width, mh / doc.floor.height);
  const fw = doc.floor.width * scale;
  const fh = doc.floor.height * scale;
  const ox = (mw - fw) / 2;
  const oy = (mh - fh) / 2;

  const viewWorldW = canvasWidth / (viewport.zoom * PIXELS_PER_UNIT);
  const viewWorldH = canvasHeight / (viewport.zoom * PIXELS_PER_UNIT);
  const viewWorldX = -viewport.panX / (viewport.zoom * PIXELS_PER_UNIT);
  const viewWorldY = -viewport.panY / (viewport.zoom * PIXELS_PER_UNIT);

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - ox) / scale;
    const wy = (my - oy) / scale;
    const panX = canvasWidth / 2 - wx * viewport.zoom * PIXELS_PER_UNIT;
    const panY = canvasHeight / 2 - wy * viewport.zoom * PIXELS_PER_UNIT;
    dispatch({ type: 'SET_VIEWPORT', viewport: { panX, panY } });
  };

  return (
    <svg
      className="sm-minimap"
      width={mw}
      height={mh}
      onClick={onClick}
      role="img"
      aria-label="Minimap"
    >
      <rect width={mw} height={mh} fill="#0f172a" rx={3} />
      <rect x={ox} y={oy} width={fw} height={fh} fill="#1e293b" stroke="#64748b" strokeWidth={1} />
      {doc.objects
        .filter((o) => o.layer === 'spaces' || o.type === 'desk')
        .slice(0, 200)
        .map((o) => (
          <rect
            key={o.id}
            x={ox + o.x * scale}
            y={oy + o.y * scale}
            width={Math.max(1, o.width * scale)}
            height={Math.max(1, o.height * scale)}
            fill={o.type === 'desk' ? '#38bdf8' : '#334155'}
            opacity={0.85}
          />
        ))}
      <rect
        x={ox + viewWorldX * scale}
        y={oy + viewWorldY * scale}
        width={Math.max(4, viewWorldW * scale)}
        height={Math.max(4, viewWorldH * scale)}
        fill="none"
        stroke="#f8fafc"
        strokeWidth={1.25}
      />
    </svg>
  );
};
