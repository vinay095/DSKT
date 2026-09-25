import React from 'react';
import type {
  Entity,
  FloorConfig,
  FloorZone,
  ScaleLevel,
  UnusableRegion,
} from '../types/geometry';
import { SCALE_LEVELS, scaleLevelLabel, stepScaleLevel } from '../geometry/grid';

interface PropertiesPanelProps {
  floor: FloorConfig;
  onFloorChange: (next: FloorConfig) => void;
  selected: Entity[];
  onUpdateSelected: (patch: Partial<Entity>) => void;
  layoutPlaceLevel: ScaleLevel;
  onScaleLayout: (direction: 'up' | 'down') => void;
  zones: FloorZone[];
  onDeleteZone: (id: string) => void;
  onUpdateZone: (id: string, patch: Partial<FloorZone>) => void;
  unusableRegions: UnusableRegion[];
  onLabelUnusableRegion: (id: string) => void;
  onDeleteUnusableRegion: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

function rgbaToHex(color: string): string {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return '#3b82f6';
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(Number(m[1]))}${toHex(Number(m[2]))}${toHex(Number(m[3]))}`;
}

function hexToZoneRgba(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 'rgba(59, 130, 246, 0.14)';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  floor,
  onFloorChange,
  selected,
  onUpdateSelected,
  layoutPlaceLevel,
  onScaleLayout,
  zones,
  onDeleteZone,
  onUpdateZone,
  unusableRegions,
  onLabelUnusableRegion,
  onDeleteUnusableRegion,
  onExportJson,
  onImportJson,
}) => {
  const single = selected.length === 1 ? selected[0] : null;
  const canScaleDown = stepScaleLevel(layoutPlaceLevel, 'down') !== null;
  const canScaleUp = stepScaleLevel(layoutPlaceLevel, 'up') !== null;

  return (
    <aside className="side-panel right-panel" aria-label="Properties">
      <div className="panel-header">Properties</div>

      <section className="prop-section">
        <h3>Grid</h3>
        <label className="prop-field">
          <span>Precision</span>
          <input
            type="number"
            min={0.05}
            step={0.05}
            value={floor.a}
            onChange={(e) =>
              onFloorChange({ ...floor, a: Math.max(0.05, Number(e.target.value) || 0.25) })
            }
          />
        </label>
        <label className="prop-field">
          <span>Floor cols (×a)</span>
          <input
            type="number"
            min={4}
            step={1}
            value={floor.cols}
            onChange={(e) =>
              onFloorChange({ ...floor, cols: Math.max(4, Number(e.target.value) || 64) })
            }
          />
        </label>
        <label className="prop-field">
          <span>Floor rows (×a)</span>
          <input
            type="number"
            min={4}
            step={1}
            value={floor.rows}
            onChange={(e) =>
              onFloorChange({ ...floor, rows: Math.max(4, Number(e.target.value) || 64) })
            }
          />
        </label>
        <p className="panel-hint">
          Zoom grid: 2a → a → a/4 → a/16. Layout scale: {SCALE_LEVELS.join(' · ')}.
        </p>
        <div className="prop-field">
          <span>Scale layout</span>
          <div className="prop-actions">
            <button
              type="button"
              className="toolbar-btn"
              disabled={!canScaleDown}
              onClick={() => onScaleLayout('down')}
            >
              Scale down
            </button>
            <span className="panel-hint mono">{scaleLevelLabel(layoutPlaceLevel)}</span>
            <button
              type="button"
              className="toolbar-btn"
              disabled={!canScaleUp}
              onClick={() => onScaleLayout('up')}
            >
              Scale up
            </button>
          </div>
        </div>
      </section>

      <section className="prop-section">
        <h3>Selection {selected.length > 0 ? `(${selected.length})` : ''}</h3>
        {selected.length === 0 && <p className="panel-hint">Select an entity on the canvas.</p>}
        {single && (
          <>
            <p className="panel-hint mono">
              {single.category} / {single.elementType}
              <br />
              id: {single.objectId}
            </p>
            <label className="prop-field">
              <span>Label</span>
              <input
                type="text"
                value={single.label ?? ''}
                onChange={(e) => onUpdateSelected({ label: e.target.value })}
              />
            </label>
            <label className="prop-field">
              <span>Colour</span>
              <input
                type="color"
                value={single.color ?? '#94a3b8'}
                onChange={(e) => onUpdateSelected({ color: e.target.value })}
              />
            </label>
            {single.category === 'text' ? (
              <label className="prop-field">
                <span>Font size</span>
                <input
                  type="number"
                  min={0.1}
                  step={0.05}
                  value={single.fontSize ?? 0.5}
                  onChange={(e) =>
                    onUpdateSelected({ fontSize: Math.max(0.1, Number(e.target.value) || 0.5) })
                  }
                />
              </label>
            ) : (
              <label className="prop-field">
                <span>Label font size</span>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={single.fontSize ?? 1}
                  onChange={(e) => onUpdateSelected({ fontSize: Number(e.target.value) })}
                />
                <span className="panel-hint mono">{(single.fontSize ?? 1).toFixed(1)}×</span>
              </label>
            )}
            <p className="panel-hint mono">
              origin ({single.origin.col}, {single.origin.row}) · {single.widthCells}×
              {single.heightCells} finest · rot {single.rotation ?? 0}°
            </p>
          </>
        )}
        {selected.length > 1 && (
          <p className="panel-hint">{selected.length} entities selected. Drag to move together.</p>
        )}
      </section>

      <section className="prop-section">
        <details>
          <summary>
            <h3 style={{ display: 'inline' }}>Zones</h3>
            <span className="panel-hint"> ({zones.length})</span>
          </summary>
          {zones.length === 0 && <p className="panel-hint">No marked zones.</p>}
          <ul className="zone-list">
            {zones.map((z) => (
              <li key={z.id} className="zone-list-item">
                <label
                  className="zone-swatch-wrap"
                  title={z.locked ? 'Unlock to change color' : 'Change color'}
                >
                  <span className="zone-swatch" style={{ background: z.color }} />
                  <input
                    type="color"
                    value={rgbaToHex(z.color)}
                    disabled={Boolean(z.locked)}
                    onChange={(e) =>
                      onUpdateZone(z.id, { color: hexToZoneRgba(e.target.value) })
                    }
                    aria-label={`Color for ${z.label}`}
                  />
                </label>
                <span>
                  {z.label}
                  {z.locked ? ' (locked)' : ''}
                </span>
                <button
                  type="button"
                  className="toolbar-btn ghost"
                  onClick={() => onUpdateZone(z.id, { locked: !z.locked })}
                >
                  {z.locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  className="toolbar-btn ghost"
                  disabled={Boolean(z.locked)}
                  onClick={() => onDeleteZone(z.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="prop-section">
        <details>
          <summary>
            <h3 style={{ display: 'inline' }}>Unusable</h3>
            <span className="panel-hint"> ({unusableRegions.length})</span>
          </summary>
          {unusableRegions.length === 0 && (
            <p className="panel-hint">No unusable regions.</p>
          )}
          <ul className="zone-list">
            {unusableRegions.map((r) => (
              <li key={r.id} className="zone-list-item">
                <span>{r.label || '(unlabeled)'}</span>
                <button
                  type="button"
                  className="toolbar-btn ghost"
                  onClick={() => onLabelUnusableRegion(r.id)}
                >
                  Label
                </button>
                <button
                  type="button"
                  className="toolbar-btn ghost"
                  onClick={() => onDeleteUnusableRegion(r.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="prop-section">
        <h3>Floor file</h3>
        <p className="panel-hint">Download or load a floor layout.</p>
        <div className="prop-actions">
          <button type="button" className="toolbar-btn" onClick={onExportJson}>
            Download
          </button>
          <label className="toolbar-btn" style={{ cursor: 'pointer' }}>
            Load
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportJson(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>
    </aside>
  );
};

export default PropertiesPanel;
