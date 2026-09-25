import { useState, useCallback, useRef } from 'react';
import { Viewport, ScreenPoint, FloorConfig } from '../types/geometry';
import { calculateZoomAroundPoint } from '../geometry/coordinates';
import {
  clampZoom,
  wheelZoomFactor,
  ZOOM_BUTTON_FACTOR,
  ZOOM_MIN,
  ZOOM_MAX,
  FIT_PADDING,
} from '../geometry/zoom';
import { DEFAULT_FLOOR_CONFIG, getFloorWorldDimensions } from '../geometry/grid';

interface UseViewportOptions {
  initialViewport?: Viewport;
  minZoom?: number;
  maxZoom?: number;
  floorConfig?: FloorConfig;
}

export function useViewport(options: UseViewportOptions = {}) {
  const {
    initialViewport = { panX: 40, panY: 40, zoom: 1 },
    minZoom = ZOOM_MIN,
    maxZoom = ZOOM_MAX,
    floorConfig = DEFAULT_FLOOR_CONFIG,
  } = options;

  const [viewport, setViewport] = useState<Viewport>(initialViewport);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    screenX: number;
    screenY: number;
    initialPanX: number;
    initialPanY: number;
  } | null>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const handleWheelZoom = useCallback(
    (e: React.WheelEvent<SVGSVGElement>, svgElement: SVGSVGElement | null) => {
      e.preventDefault();
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const cursorScreen: ScreenPoint = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };

      const factor = wheelZoomFactor(e.deltaY);
      const current = viewportRef.current;
      const targetZoom = clampZoom(current.zoom * factor, minZoom, maxZoom);
      setViewport(calculateZoomAroundPoint(cursorScreen, current, targetZoom));
    },
    [minZoom, maxZoom],
  );

  const startPan = useCallback(
    (e: React.MouseEvent<SVGSVGElement>, svgElement: SVGSVGElement | null) => {
      if (!svgElement) return;
      const rect = svgElement.getBoundingClientRect();
      panStartRef.current = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
        initialPanX: viewport.panX,
        initialPanY: viewport.panY,
      };
      setIsPanning(true);
    },
    [viewport.panX, viewport.panY],
  );

  const updatePan = useCallback(
    (e: React.MouseEvent<SVGSVGElement>, svgElement: SVGSVGElement | null) => {
      if (!isPanning || !panStartRef.current || !svgElement) return;
      const rect = svgElement.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - panStartRef.current.screenX;
      const deltaY = currentY - panStartRef.current.screenY;

      setViewport((prev) => ({
        ...prev,
        panX: panStartRef.current!.initialPanX + deltaX,
        panY: panStartRef.current!.initialPanY + deltaY,
      }));
    },
    [isPanning],
  );

  const endPan = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  const fitToFloor = useCallback(
    (containerWidth: number, containerHeight: number) => {
      if (containerWidth < 10 || containerHeight < 10) return;
      const { width: worldW, height: worldH } = getFloorWorldDimensions(floorConfig);
      const pad = FIT_PADDING;
      const scaleX = (containerWidth - pad * 2) / worldW;
      const scaleY = (containerHeight - pad * 2) / worldH;
      // Clamp only by shared min/max — do not hard-cap fit at 1.2
      const fitZoom = clampZoom(Math.min(scaleX, scaleY), minZoom, maxZoom);

      setViewport({
        panX: Math.round((containerWidth - worldW * fitZoom) / 2),
        panY: Math.round((containerHeight + worldH * fitZoom) / 2),
        zoom: Number(fitZoom.toFixed(3)),
      });
    },
    [floorConfig, minZoom, maxZoom],
  );

  const resetView = useCallback(() => {
    setViewport(initialViewport);
  }, [initialViewport]);

  /** Zoom in/out around a screen-space anchor (defaults to container center). */
  const zoomAt = useCallback(
    (factor: number, anchor: ScreenPoint) => {
      setViewport((prev) => {
        const targetZoom = clampZoom(prev.zoom * factor, minZoom, maxZoom);
        return calculateZoomAroundPoint(anchor, prev, targetZoom);
      });
    },
    [minZoom, maxZoom],
  );

  const zoomIn = useCallback(
    (centerX: number, centerY: number) => {
      zoomAt(ZOOM_BUTTON_FACTOR, { screenX: centerX, screenY: centerY });
    },
    [zoomAt],
  );

  const zoomOut = useCallback(
    (centerX: number, centerY: number) => {
      zoomAt(1 / ZOOM_BUTTON_FACTOR, { screenX: centerX, screenY: centerY });
    },
    [zoomAt],
  );

  return {
    viewport,
    setViewport,
    isPanning,
    startPan,
    updatePan,
    endPan,
    handleWheelZoom,
    fitToFloor,
    resetView,
    zoomIn,
    zoomOut,
  };
}
