import React from 'react';
import { useFloorPlan } from '@/app/providers/FloorPlanProvider';
import { getElementDefinition } from '@/data/elementLibrary';
import { formatCoord, snapToGrid } from '@/utils/coordinates';
import type { FloorObject } from '@/types/floorPlan';

export const PropertiesPanel: React.FC = () => {
  const { state, dispatch, beginTransform, endTransform } = useFloorPlan();
  const { selectedIds, document: doc, snapEnabled } = state;

  const selected = doc.objects.filter((o) => selectedIds.includes(o.id));
  const single = selected.length === 1 ? selected[0] : null;

  const updateField = (id: string, patch: Partial<FloorObject>) => {
    beginTransform();
    const grid = doc.floor.gridSize;
    const next = { ...patch };
    if (typeof next.x === 'number') next.x = snapToGrid(next.x, grid, snapEnabled);
    if (typeof next.y === 'number') next.y = snapToGrid(next.y, grid, snapEnabled);
    if (typeof next.width === 'number')
      next.width = Math.max(0.3, snapToGrid(next.width, grid, snapEnabled));
    if (typeof next.height === 'number')
      next.height = Math.max(0.3, snapToGrid(next.height, grid, snapEnabled));
    endTransform([{ id, ...next }]);
  };

  if (!selected.length) {
    return (
      <aside className="sm-props">
        <div className="sm-props__header">
          <h2>Properties</h2>
        </div>
        <div className="sm-props__empty">
          <p>Select an object on the floor plan to inspect and edit its properties.</p>
          <ul>
            <li>Drag elements from the library</li>
            <li>Shift-click for multi-select</li>
            <li>Space + drag to pan</li>
          </ul>
        </div>
        <div className="sm-props__teams">
          <h3>Teams</h3>
          <ul className="sm-team-list">
            {doc.teams.map((t) => (
              <li key={t.id}>
                <span className="sm-team-swatch" style={{ background: t.color }} />
                <span>{t.name}</span>
                <span className="sm-muted">{t.pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

  if (!single) {
    return (
      <aside className="sm-props">
        <div className="sm-props__header">
          <h2>Multi-selection</h2>
          <span className="sm-muted">{selected.length} objects</span>
        </div>
        <div className="sm-props__body">
          <p className="sm-hint">
            Move the group by dragging any selected movable object. Duplicate or delete applies to all.
          </p>
          <div className="sm-props__actions">
            <button
              type="button"
              className="sm-btn"
              onClick={() => dispatch({ type: 'DUPLICATE_SELECTED' })}
            >
              Duplicate
            </button>
            <button
              type="button"
              className="sm-btn sm-btn--danger"
              onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
            >
              Delete
            </button>
          </div>
          <ul className="sm-sel-list">
            {selected.slice(0, 20).map((o) => (
              <li key={o.id}>
                {getElementDefinition(o.type).label}
                <span className="sm-muted">
                  {formatCoord(o.x)}, {formatCoord(o.y)}
                </span>
              </li>
            ))}
            {selected.length > 20 && (
              <li className="sm-muted">+{selected.length - 20} more</li>
            )}
          </ul>
        </div>
      </aside>
    );
  }

  const def = getElementDefinition(single.type);

  return (
    <aside className="sm-props">
      <div className="sm-props__header">
        <h2>Selected object</h2>
        <span className="sm-badge">{def.label}</span>
      </div>
      <div className="sm-props__body">
        <dl className="sm-fields">
          <div>
            <dt>Type</dt>
            <dd>{def.label}</dd>
          </div>
          <div>
            <dt>Mobility</dt>
            <dd>{single.mobility}</dd>
          </div>
          <NumField
            label="X"
            value={single.x}
            onChange={(v) => updateField(single.id, { x: v })}
          />
          <NumField
            label="Y"
            value={single.y}
            onChange={(v) => updateField(single.id, { y: v })}
          />
          <NumField
            label="Width"
            value={single.width}
            onChange={(v) => updateField(single.id, { width: v })}
          />
          <NumField
            label="Height"
            value={single.height}
            onChange={(v) => updateField(single.id, { height: v })}
          />
          <NumField
            label="Rotation"
            value={single.rotation}
            step={15}
            onChange={(v) => updateField(single.id, { rotation: v })}
            suffix="°"
          />
        </dl>

        {(single.type === 'desk' || single.type === 'workstation') && (
          <div className="sm-props__block">
            <label className="sm-label">
              Team
              <select
                className="sm-input"
                value={(single.properties.teamId as string) ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_PROPERTY',
                    id: single.id,
                    key: 'teamId',
                    value: e.target.value || null,
                  })
                }
              >
                <option value="">Unassigned</option>
                {doc.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm-label">
              Employee
              <input
                className="sm-input"
                value={(single.properties.employee as string) ?? ''}
                placeholder="Unassigned"
                onChange={(e) =>
                  dispatch({
                    type: 'SET_PROPERTY',
                    id: single.id,
                    key: 'employee',
                    value: e.target.value || null,
                  })
                }
              />
            </label>
          </div>
        )}

        {(single.type === 'meeting-room' ||
          single.type === 'conference-room' ||
          single.type === 'cafeteria' ||
          single.type === 'cabin') && (
          <label className="sm-label">
            Capacity
            <input
              className="sm-input"
              type="number"
              value={(single.properties.capacity as number) ?? 0}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROPERTY',
                  id: single.id,
                  key: 'capacity',
                  value: Number(e.target.value),
                })
              }
            />
          </label>
        )}

        {(single.type === 'unusable-space' || single.type === 'restricted-area') && (
          <label className="sm-label">
            Reason
            <input
              className="sm-input"
              value={(single.properties.reason as string) ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROPERTY',
                  id: single.id,
                  key: 'reason',
                  value: e.target.value,
                })
              }
            />
          </label>
        )}

        <label className="sm-label">
          Label
          <input
            className="sm-input"
            value={(single.properties.label as string) ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_PROPERTY',
                id: single.id,
                key: 'label',
                value: e.target.value,
              })
            }
          />
        </label>

        <div className="sm-props__actions">
          <button
            type="button"
            className="sm-btn"
            onClick={() => dispatch({ type: 'DUPLICATE_SELECTED' })}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="sm-btn sm-btn--danger"
            onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
};

function NumField({
  label,
  value,
  onChange,
  step = 0.1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="sm-num-field">
      <dt>{label}</dt>
      <dd>
        <input
          className="sm-input sm-input--num"
          type="number"
          step={step}
          value={Number(value.toFixed(2))}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="sm-suffix">{suffix}</span>}
      </dd>
    </div>
  );
}
