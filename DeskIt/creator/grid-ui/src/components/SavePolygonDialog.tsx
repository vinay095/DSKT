import React, { useEffect, useMemo, useState } from 'react';
import {
  CUSTOM_ELEMENT_CATEGORIES,
  getCategoryStyle,
} from '../lib/categoryStyles';

interface SavePolygonDialogProps {
  open: boolean;
  defaultLabel: string;
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

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal-card save-polygon-dialog"
        role="dialog"
        aria-label="Save custom element"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>Save custom element</h2>
        <p className="panel-hint" style={{ marginTop: -4, marginBottom: 8 }}>
          Geometry → generated SVG → reusable catalog (all drafts).
        </p>

        <label className="prop-field">
          <span>Name</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. L-shaped column"
          />
        </label>

        <fieldset className="prop-section">
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
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
              placeholder="e.g. game_relaxation"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          )}
        </fieldset>

        <fieldset className="prop-section">
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
              style={{ width: 48, height: 28, border: 'none', cursor: 'pointer' }}
            />
          )}
          <div
            style={{
              marginTop: 8,
              height: 28,
              borderRadius: 8,
              background: previewColor,
              border: `2px solid ${inherited.stroke}`,
              opacity: inherited.fillOpacity + 0.3,
            }}
            title="Preview"
          />
        </fieldset>

        <div className="prop-actions">
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
