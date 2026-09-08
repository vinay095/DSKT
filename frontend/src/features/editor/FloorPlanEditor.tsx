import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { ElementLibrary } from './components/ElementLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StatusBar } from './components/StatusBar';
import { FloorPlanCanvas } from './canvas/FloorPlanCanvas';
import { useFloorPlan } from '@/app/providers/FloorPlanProvider';

export const FloorPlanEditor: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const { state, dispatch } = useFloorPlan();

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(100, Math.floor(width)),
        height: Math.max(100, Math.floor(height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="sm-app">
      <Toolbar />
      {state.optimizeBanner && (
        <div className="sm-banner" role="status">
          <span>{state.optimizeBanner}</span>
          <button
            type="button"
            className="sm-btn sm-btn--ghost"
            onClick={() => dispatch({ type: 'SET_OPTIMIZE_BANNER', message: null })}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="sm-main">
        <ElementLibrary />
        <div className="sm-canvas-wrap" ref={hostRef}>
          <FloorPlanCanvas width={size.width} height={size.height} />
        </div>
        <PropertiesPanel />
      </div>
      <StatusBar canvasWidth={size.width} canvasHeight={size.height} />
    </div>
  );
};
