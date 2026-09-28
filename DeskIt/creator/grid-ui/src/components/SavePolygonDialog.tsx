import React, { useEffect, useMemo, useState } from 'react';
import {
  CUSTOM_ELEMENT_CATEGORIES,
  getCategoryStyle,
} from '../lib/categoryStyles';
import type { OutlineVertex } from '../types/geometry';

interface SavePolygonDialogProps {
  open: boolean;
  defaultLabel: string;
  /** Relative finest outline of the pending custom polygon (for silhouette preview). */
  outline?: OutlineVertex[];
  widthCells?: number;
  heightCells?: number;
  onSave: (opts: {
    label: string;
    category: string;
    color: string;
    createCategory?: string;
  }) => void;
  onCancel: () => void;
}

/**
 * PART 8 flow: Name → Category → Color (inherit or pick) → Save → catalog.
 */
const SavePolygonDialog: React.FC<SavePolygonDialogProps> = ({
  open,
  defaultLabel,
  outline,
  widthCells,
  heightCells,
  onSave,
  onCancel,
}) => {
  const [label, setLabel] = useState(defaultLabel);
  const [category, setCategory] = useState('custom');
  const [mode, setMode] = useState<'preset' | 'new'>('preset');
  const [newCategory, setNewCategory] = useState('');
  const [colorMode, setColorMode] = useState<'inherit' | 'custom'>('inherit');
  const [customColor, setCustomColor] = useState('#A78BFA');

  useEffect(() => {
    if (open) {
      setLabel(defaultLabel);
      setCategory('custom');
      setMode('preset');
      setNewCategory('');
      setColorMode('inherit');
    }
  }, [open, defaultLabel]);

  const resolvedCategory = mode === 'new' ? newCategory.trim() || 'custom' : category;
  const inherited = useMemo(
    () => getCategoryStyle(resolvedCategory, undefined, undefined),
    [resolvedCategory],
  );
  const previewColor = colorMode === 'inherit' ? inherited.fill : customColor;

  const silhouette = useMemo(() => {
    if (!outline || outline.length < 3) return null;
    const cols = outline.map((v) => v.col);
    const rows = outline.map((v) => v.row);
    const minC = Math.min(...cols);
    const maxC = Math.max(...cols);
    const minR = Math.min(...rows);
    const maxR = Math.max(...rows);
    const vbW = Math.max(maxC - minC, widthCells ?? 1, 1);
    const vbH = Math.max(maxR - minR, heightCells ?? 1, 1);
    const [first, ...rest] = outline;
    let d = `M${first.col - minC},${first.row - minR}`;
    for (const v of rest) d += ` L${v.col - minC},${v.row - minR}`;
    d += ' Z';
    return { vbW, vbH, d };
  }, [outline, widthCells, heightCells]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal-card save-polygon-dialog"
        role="dialog"
        aria-label="Save custom element"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="save-polygon-dialog__header">
          <h2>Save custom element</h2>
          <p className="panel-hint">
            Geometry → generated SVG → reusable catalog (all drafts).
          </p>
        </header>

        <div className="save-polygon-dialog__body">
          <label className="prop-field">
            <span>Name</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. L-shaped column"
            />
          </label>

          <fieldset className="prop-section save-polygon-dialog__section">
            <legend>Category</legend>
            <label className="radio-row">
              <input
                type="radio"
                checked={mode === 'preset'}
                onChange={() => setMode('preset')}
              />
              Existing category
            </label>
            {mode === 'preset' && (
              <select
                className="save-polygon-dialog__select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CUSTOM_ELEMENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            <label className="radio-row">
              <input
                type="radio"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
              />
              Create new category
            </label>
            {mode === 'new' && (
              <input
                type="text"
                className="save-polygon-dialog__input"
                placeholder="e.g. game_relaxation"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            )}
          </fieldset>

          <fieldset className="prop-section save-polygon-dialog__section">
            <legend>Color</legend>
            <label className="radio-row">
              <input
                type="radio"
                checked={colorMode === 'inherit'}
                onChange={() => setColorMode('inherit')}
              />
              Inherit from category ({inherited.fill})
            </label>
            <label className="radio-row">
              <input
                type="radio"
                checked={colorMode === 'custom'}
                onChange={() => setColorMode('custom')}
              />
              Custom color
            </label>
            {colorMode === 'custom' && (
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="save-polygon-dialog__color"
              />
            )}
            <div
              className="save-polygon-dialog__preview"
              style={{ borderColor: inherited.stroke }}
              title="Shape preview"
            >
              {silhouette ? (
                <svg
                  viewBox={`0 0 ${silhouette.vbW} ${silhouette.vbH}`}
                  width="100%"
                  height="100%"
                  aria-hidden
                >
                  <path
                    d={silhouette.d}
                    fill={previewColor}
                    fillOpacity={Math.min(inherited.fillOpacity + 0.35, 0.9)}
                    stroke={inherited.stroke}
                    strokeWidth={Math.max(silhouette.vbW, silhouette.vbH) * 0.03}
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div
                  className="save-polygon-dialog__preview-fallback"
                  style={{
                    background: previewColor,
                    opacity: inherited.fillOpacity + 0.3,
                  }}
                />
              )}
            </div>
          </fieldset>
        </div>

        <div className="save-polygon-dialog__actions prop-actions">
          <button type="button" className="toolbar-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => {
              onSave({
                label: label.trim() || defaultLabel,
                category: resolvedCategory,
                color: previewColor,
                createCategory: mode === 'new' ? resolvedCategory : undefined,
              });
            }}
          >
            Save to catalog
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePolygonDialog;
