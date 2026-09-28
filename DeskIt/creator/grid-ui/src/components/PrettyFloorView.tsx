import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FloorDocument } from '../lib/drafts';
import { normalizeDocument } from '../lib/drafts';
import { floorWorldHeight, floorWorldWidth } from '../types/geometry';
import { isPolygonEntity } from '../geometry/entities';
import { FINEST_PER_A } from '../geometry/grid';
import { getCategoryStyle } from '../lib/categoryStyles';
import { publishFloorDocument } from '../lib/publish';
import StyledCatalogSvg from './StyledCatalogSvg';
import { clampZoom, wheelZoomFactor, ZOOM_BUTTON_FACTOR } from '../geometry/zoom';
import {
  adaptiveLabelFontSize,
  maxLabelChars,
  readableLabelTransform,
  truncateLabel,
} from '../geometry/labels';

interface PrettyFloorViewProps {
  document: FloorDocument;
  onBack: () => void;
}

type Cam = { zoom: number; panX: number; panY: number };

const PrettyFloorView: React.FC<PrettyFloorViewProps> = ({ document: rawDoc, onBack }) => {
  const doc = useMemo(() => normalizeDocument(rawDoc), [rawDoc]);
  const a = doc.a;
  const floor = doc.floor;
  const width = floorWorldWidth(floor);
  const height = floorWorldHeight(floor);
  const f = a / FINEST_PER_A;
  const unusable = doc.unusableRegions ?? [];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [cam, setCam] = useState<Cam>({ zoom: 1, panX: 0, panY: 0 });
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didInitialFit = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      setSize({ w, h });
    });
    ro.observe(el);
    const { width: w, height: h } = el.getBoundingClientRect();
    setSize({ w, h });
    return () => ro.disconnect();
  }, []);

  const applyFit = () => {
    if (size.w < 10 || size.h < 10) return;
    const pad = 32;
    const zoom = Math.min((size.w - pad * 2) / width, (size.h - pad * 2) / height);
    setCam({
      zoom: Math.max(zoom, 0.01),
      panX: (size.w - width * zoom) / 2,
      panY: (size.h - height * zoom) / 2,
    });
  };

  // Fit once when canvas is ready; re-fit only when floor dimensions change (not every resize)
  useEffect(() => {
    didInitialFit.current = false;
  }, [width, height]);

  useEffect(() => {
    if (size.w < 10 || size.h < 10) return;
    if (didInitialFit.current) return;
    didInitialFit.current = true;
    applyFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, width, height]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const factor = wheelZoomFactor(e.deltaY);
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setCam((c) => {
        const worldX = (mx - c.panX) / c.zoom;
        const worldY = (my - c.panY) / c.zoom;
        const zoom = clampZoom(c.zoom * factor, 0.02, 80);
        return {
          zoom,
          panX: mx - worldX * zoom,
          panY: my - worldY * zoom,
        };
      });
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  const zoomAtCenter = (factor: number) => {
    const mx = size.w / 2;
    const my = size.h / 2;
    setCam((c) => {
      const worldX = (mx - c.panX) / c.zoom;
      const worldY = (my - c.panY) / c.zoom;
      const zoom = clampZoom(c.zoom * factor, 0.02, 80);
      return { zoom, panX: mx - worldX * zoom, panY: my - worldY * zoom };
    });
  };

  const zoneShapes = useMemo(
    () =>
      doc.zones.map((z) => {
        if (!z.outline || z.outline.length < 3) {
          return {
            id: z.id,
            color: z.color,
            kind: 'rect' as const,
            x: z.origin.col * f,
            y: z.origin.row * f,
            width: z.widthCells * f,
            height: z.heightCells * f,
          };
        }
        return {
          id: z.id,
          color: z.color,
          kind: 'poly' as const,
          pts: z.outline
            .map((v) => `${(z.origin.col + v.col) * f},${(z.origin.row + v.row) * f}`)
            .join(' '),
        };
      }),
    [doc.zones, f],
  );

  const unusableShapes = useMemo(
    () =>
      unusable.map((r) => {
        if (!r.outline || r.outline.length < 3) {
          return {
            id: r.id,
            kind: 'rect' as const,
            x: r.origin.col * f,
            y: r.origin.row * f,
            width: r.widthCells * f,
            height: r.heightCells * f,
          };
        }
        return {
          id: r.id,
          kind: 'poly' as const,
          pts: r.outline
            .map((v) => `${(r.origin.col + v.col) * f},${(r.origin.row + v.row) * f}`)
            .join(' '),
        };
      }),
    [unusable, f],
  );

  const handlePublish = () => {
    const result = publishFloorDocument(doc);
    setPublishMsg(result.message);
    window.setTimeout(() => setPublishMsg(null), 3200);
  };

  return (
    <div className="pretty-layout">
      <header className="toolbar pretty-toolbar fixed-bar">
        <div className="toolbar-brand">
          <span className="brand-mark" aria-hidden />
          <span>Preview</span>
        </div>
        <span className="pretty-size mono">
          {floor.cols}×{floor.rows}
        </span>
        <span className="panel-hint" style={{ marginLeft: 12 }}>
          Scroll to zoom · drag to pan · matches published look
        </span>
        <div className="toolbar-spacer" />
        {publishMsg && (
          <span className="panel-hint" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {publishMsg}
          </span>
        )}
        <button type="button" className="toolbar-btn" onClick={() => zoomAtCenter(1 / ZOOM_BUTTON_FACTOR)}>
          −
        </button>
        <button type="button" className="toolbar-btn" onClick={() => zoomAtCenter(ZOOM_BUTTON_FACTOR)}>
          +
        </button>
        <button type="button" className="toolbar-btn" onClick={applyFit}>
          Fit
        </button>
        <button type="button" className="toolbar-btn toolbar-btn-primary" onClick={handlePublish}>
          Publish to DeskIt
        </button>
        <button type="button" className="toolbar-btn" onClick={onBack}>
          Back to planner
        </button>
      </header>
      <div
        className="pretty-canvas"
        ref={wrapRef}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          dragRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: cam.panX,
            panY: cam.panY,
          };
        }}
        onMouseMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setCam((c) => ({
            ...c,
            panX: d.panX + (e.clientX - d.x),
            panY: d.panY + (e.clientY - d.y),
          }));
        }}
        onMouseUp={() => {
          dragRef.current = null;
        }}
        onMouseLeave={() => {
          dragRef.current = null;
        }}
      >
        <svg
          className="pretty-svg-interactive"
          width={size.w}
          height={size.h}
          aria-label="Floor preview"
        >
          <rect x={0} y={0} width={size.w} height={size.h} className="pretty-canvas-bg" />
          <g transform={`translate(${cam.panX}, ${cam.panY}) scale(${cam.zoom})`}>
            <rect x={0} y={0} width={width} height={height} className="pretty-floor" />

            {/* Screen Y-down: flip world Y-up content */}
            <g transform={`translate(0, ${height}) scale(1, -1)`}>
              {unusableShapes.map((region) =>
                region.kind === 'rect' ? (
                  <rect
                    key={region.id}
                    x={region.x}
                    y={region.y}
                    width={region.width}
                    height={region.height}
                    fill="rgba(100,116,139,0.28)"
                  />
                ) : (
                  <polygon
                    key={region.id}
                    points={region.pts}
                    fill="rgba(100,116,139,0.28)"
                  />
                ),
              )}

              {zoneShapes.map((zone) =>
                zone.kind === 'rect' ? (
                  <rect
                    key={zone.id}
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    fill={zone.color}
                    fillOpacity={0.22}
                  />
                ) : (
                  <polygon key={zone.id} points={zone.pts} fill={zone.color} fillOpacity={0.22} />
                ),
              )}

              {doc.entities.map((e) => {
                const x = e.origin.col * f;
                const y = e.origin.row * f;
                const w = Math.max(e.widthCells * f, f);
                const h = Math.max(e.heightCells * f, f);
                const rot = e.rotation ?? 0;
                const cx = x + w / 2;
                const cy = y + h / 2;
                const catStyle = getCategoryStyle(e.category, e.elementType, e.color);

                if (e.category === 'text') {
                  const fontSize = Math.max((e.fontSize ?? 0.5) * a, f * 6);
                  const text = truncateLabel(
                    e.label || 'Text',
                    maxLabelChars(w, fontSize),
                  );
                  return (
                    <g key={e.objectId} transform={readableLabelTransform(cx, cy, rot)}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fill={e.color ?? catStyle.fill}
                      >
                        {text}
                      </text>
                    </g>
                  );
                }

                // Catalog OR generated custom SVG (data URL) — same styling pipeline
                if (e.svg) {
                  const fontSize = adaptiveLabelFontSize(w, h, { ratio: 0.16, min: f * 3, max: a * 0.28 });
                  const label = truncateLabel(
                    e.label || '',
                    maxLabelChars(w, fontSize),
                  );
                  return (
                    <g key={e.objectId}>
                      <g
                        transform={`translate(${cx}, ${cy}) scale(1, -1) rotate(${rot}) translate(${-w / 2}, ${-h / 2})`}
                      >
                        <StyledCatalogSvg
                          svgFile={e.svg}
                          category={e.category}
                          elementType={e.elementType}
                          entityColor={e.color}
                          width={w}
                          height={h}
                        />
                      </g>
                      {label && (
                        <g transform={readableLabelTransform(cx, cy + h * 0.55, rot)}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="hanging"
                            fontSize={fontSize}
                            fill="currentColor"
                            opacity={0.8}
                          >
                            {label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                }

                if (isPolygonEntity(e) && (e.svgPath || e.outline)) {
                  let pathD = e.svgPath ?? '';
                  if (!pathD && e.outline && e.outline.length >= 2) {
                    const [first, ...rest] = e.outline;
                    pathD = `M${first.col},${first.row}`;
                    for (const v of rest) pathD += ` L${v.col},${v.row}`;
                    pathD += ' Z';
                  }
                  if (!pathD) return null;
                  const fontSize = adaptiveLabelFontSize(w, h, { ratio: 0.18, min: f * 4, max: a * 0.35 });
                  const label = truncateLabel(
                    e.label || e.elementType.replace(/_/g, ' '),
                    maxLabelChars(w, fontSize),
                  );
                  return (
                    <g key={e.objectId}>
                      <g transform={`translate(${x}, ${y}) scale(${f})`}>
                        <path
                          d={pathD}
                          fill={catStyle.fill}
                          fillOpacity={catStyle.fillOpacity}
                          stroke={catStyle.stroke}
                          strokeWidth={0.12}
                        />
                      </g>
                      {label && (
                        <g transform={readableLabelTransform(cx, cy, rot)}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={fontSize}
                            fill="currentColor"
                            opacity={0.85}
                          >
                            {label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                }

                const fontSize = adaptiveLabelFontSize(w, h);
                const label = truncateLabel(
                  e.label || e.elementType.replace(/_/g, ' '),
                  maxLabelChars(w, fontSize),
                );
                return (
                  <g key={e.objectId}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={f * 0.5}
                      fill={catStyle.fill}
                      fillOpacity={catStyle.fillOpacity}
                      stroke={catStyle.stroke}
                      strokeWidth={f * 0.5}
                    />
                    {label && (
                      <g transform={readableLabelTransform(cx, cy, rot)}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={fontSize}
                          fill="currentColor"
                          opacity={0.85}
                        >
                          {label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default PrettyFloorView;
