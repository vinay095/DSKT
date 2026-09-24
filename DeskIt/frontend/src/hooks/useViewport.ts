import { useState, useCallback, useRef } from 'react';
import { Viewport, ScreenPoint, FloorConfig } from '../types/geometry';
import { calculateZoomAroundPoint } from '../geometry/coordinates';
import { DEFAULT_FLOOR_CONFIG, getFloorWorldDimensions } from '../geometry/grid';

interface UseViewportOptions {
  initialViewport?: Viewport;
  minZoom?: number;
  maxZoom?: number;
  floorConfig?: FloorConfig;
}

export function useViewport(options: UseViewportOptions = {}) {
  const {
    initialViewport = { panX: 40, panY: 600, zoom: 0.8 },
    minZoom = 0.3,
    maxZoom = 3.5,
    floorConfig = DEFAULT_FLOOR_CONFIG,
  } = options;

  const [viewport, setViewport] = useState<Viewport>(initialViewport);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ screenX: number; screenY: number; initialPanX: number; initialPanY: number } | null>(null);

  /**
   * CAD/Figma-style Wheel Zoom centered around the mouse cursor position.
   */
  const handleWheelZoom = useCallback(
    (e: React.WheelEvent<SVGSVGElement>, svgElement: SVGSVGElement | null) => {
      e.preventDefault();
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const cursorScreen: ScreenPoint = {
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      };

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const targetZoom = Math.min(maxZoom, Math.max(minZoom, viewport.zoom * zoomFactor));

      const newViewport = calculateZoomAroundPoint(cursorScreen, viewport, targetZoom);
      setViewport(newViewport);
    },
    [viewport, minZoom, maxZoom]
  );

  /**
   * Starts pan gesture (e.g., middle click, drag, or space+drag).
   */
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
    [viewport.panX, viewport.panY]
  );

  /**
   * Updates pan offset during mouse movement.
   */
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
    [isPanning]
  );

  /**
   * Ends pan gesture.
   */
  const endPan = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  /**
   * Recalculates viewport zoom and pan to fit the entire floor boundary neatly inside the SVG container.
   */
  const fitToFloor = useCallback(
    (containerWidth: number, containerHeight: number) => {
      const { width: worldW, height: worldH } = getFloorWorldDimensions(floorConfig);
      const padding = 60;

      const scaleX = (containerWidth - padding * 2) / worldW;
      const scaleY = (containerHeight - padding * 2) / worldH;
      const fitZoom = Math.min(scaleX, scaleY, 1.2);

      const targetPanX = (containerWidth - worldW * fitZoom) / 2;
      const targetPanY = (containerHeight + worldH * fitZoom) / 2;

      setViewport({
        panX: Math.round(targetPanX),
        panY: Math.round(targetPanY),
        zoom: Number(fitZoom.toFixed(3)),
      });
    },
    [floorConfig]
  );

  /**
   * Resets viewport to default zoom and pan.
   */
  const resetView = useCallback(() => {
    setViewport(initialViewport);
  }, [initialViewport]);

  const zoomIn = useCallback(() => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(maxZoom, Number((prev.zoom * 1.2).toFixed(2))) }));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(minZoom, Number((prev.zoom / 1.2).toFixed(2))) }));
  }, [minZoom]);

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
