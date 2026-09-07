import React from 'react';
import type { LibraryItem } from '../types/geometry';
import { ENTITY_LIBRARY } from '../lib/library';

interface EntityLibraryProps {
  activeKind: LibraryItem['kind'] | null;
  onSelect: (item: LibraryItem) => void;
  onPolygonTool: () => void;
  polygonActive: boolean;
}

const EntityLibrary: React.FC<EntityLibraryProps> = ({
  activeKind,
  onSelect,
  onPolygonTool,
  polygonActive,
}) => {
  return (
    <aside className="side-panel left-panel" aria-label="Entity library">
      <div className="panel-header">Library</div>
      <p className="panel-hint">Click an item, then click the canvas to place.</p>
      <div className="library-list">
        {ENTITY_LIBRARY.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={`library-item ${activeKind === item.kind ? 'active' : ''}`}
            onClick={() => onSelect(item)}
          >
            <span className="library-swatch" style={{ background: item.color }} />
            <span className="library-meta">
              <strong>{item.label}</strong>
              <small>
                {item.defaultWidth}×{item.defaultHeight} m · code {item.code}
              </small>
            </span>
          </button>
        ))}
        <button
          type="button"
          className={`library-item ${polygonActive ? 'active' : ''}`}
          onClick={onPolygonTool}
        >
          <span className="library-swatch" style={{ background: '#ef4444' }} />
          <span className="library-meta">
            <strong>Polygon</strong>
            <small>Click vertices · Enter / double-click to close</small>
          </span>
        </button>
      </div>
    </aside>
  );
};

export default EntityLibrary;
