import React, { useState } from 'react';
import type { CatalogCategory, CustomLibraryEntry, LibraryItem } from '../types/geometry';
import { assetUrl } from '../lib/catalog';
import { groupCustomByCategory } from '../lib/library';
import { CUSTOM_ELEMENT_CATEGORIES, isSvgDataUrl } from '../lib/categoryStyles';
import { FloorObjectRenderer } from './renderers';

interface EntityLibraryProps {
  categories: CatalogCategory[];
  customItems: CustomLibraryEntry[];
  activeId: string | null;
  onSelect: (item: LibraryItem) => void;
  onDeleteCustom: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
}

type TopSection = 'available' | 'custom' | null;

const EntityLibrary: React.FC<EntityLibraryProps> = ({
  categories,
  customItems,
  activeId,
  onSelect,
  onDeleteCustom,
  onColorChange,
}) => {
  const [openTop, setOpenTop] = useState<TopSection>('available');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const customGrouped = groupCustomByCategory(customItems);
  const customCategoryNames = Array.from(customGrouped.keys()).sort();
  const customTotal = customItems.length;

  const toggleTop = (key: 'available' | 'custom') => {
    setOpenTop((prev) => (prev === key ? null : key));
    setOpenCategory(null);
  };

  const toggleCategory = (key: string) => {
    setOpenCategory((prev) => (prev === key ? null : key));
  };

  const categoryLabel = (id: string) =>
    CUSTOM_ELEMENT_CATEGORIES.find((c) => c.id === id)?.label ??
    categories.find((c) => c.category === id)?.label ??
    id.replace(/_/g, ' ');

  const renderType = (item: LibraryItem) => {
    const dataPreview = isSvgDataUrl(item.svg) ? item.svg : undefined;
    const filePreview = !dataPreview ? assetUrl(item.svg) : undefined;
    const preview = dataPreview || filePreview;
    const outline = item.outline;
    let outlinePreview: React.ReactNode = null;
    if (!preview && outline && outline.length >= 3) {
      const cols = outline.map((v) => v.col);
      const rows = outline.map((v) => v.row);
      const minC = Math.min(...cols);
      const maxC = Math.max(...cols);
      const minR = Math.min(...rows);
      const maxR = Math.max(...rows);
      const vbW = Math.max(maxC - minC, 1);
      const vbH = Math.max(maxR - minR, 1);
      const pts = outline.map((v) => `${v.col - minC},${v.row - minR}`).join(' ');
      const sw = Math.max(vbW, vbH) * 0.04;
      outlinePreview = (
        <svg
          className="library-preview"
          viewBox={`0 0 ${vbW} ${vbH}`}
          width={40}
          height={32}
          aria-hidden
        >
          <polygon
            points={pts}
            fill={item.color}
            fillOpacity={0.55}
            stroke={item.color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    return (
      <div
        key={item.id}
        className={`library-item ${activeId === item.id ? 'active' : ''}`}
      >
        <button
          type="button"
          className="library-item-main"
          onClick={() => onSelect(item)}
        >
          {preview ? (
            <img src={preview} alt="" className="library-preview" />
          ) : outlinePreview ? (
            outlinePreview
          ) : (
            <svg
              className="library-preview"
              viewBox="0 0 40 32"
              width={40}
              height={32}
              aria-hidden
            >
              <FloorObjectRenderer
                width={40}
                height={32}
                category={item.category}
                elementType={item.elementType}
                color={item.color}
                detail="simple"
              />
            </svg>
          )}
          <span className="library-meta">
            <strong>{item.label}</strong>
            <small>
              {item.widthCells}×{item.heightCells} cells
            </small>
          </span>
        </button>
        {onColorChange && (
          <label className="library-color" title="Change colour" onClick={(e) => e.stopPropagation()}>
            <input
              type="color"
              value={item.color}
              onChange={(e) => onColorChange(item.id, e.target.value)}
              aria-label={`Colour for ${item.label}`}
            />
          </label>
        )}
        {item.fromSelection && (
          <button
            type="button"
            className="library-delete"
            title="Remove from library"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCustom(item.id);
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="side-panel left-panel" aria-label="Entity library">
      <div className="panel-header">Library</div>

      <div className="library-accordion">
        <button
          type="button"
          className={`library-accordion-head ${openTop === 'available' ? 'open' : ''}`}
          onClick={() => toggleTop('available')}
          aria-expanded={openTop === 'available'}
        >
          <span>Available</span>
          <span className="library-accordion-count">
            {categories.reduce((n, c) => n + c.types.length, 0)}
          </span>
        </button>
        {openTop === 'available' && (
          <div className="library-nested">
            {categories.map((cat) => {
              const open = openCategory === `avail:${cat.category}`;
              return (
                <div key={cat.category} className="library-accordion">
                  <button
                    type="button"
                    className={`library-accordion-head nested ${open ? 'open' : ''}`}
                    onClick={() => toggleCategory(`avail:${cat.category}`)}
                    aria-expanded={open}
                  >
                    <span>{cat.label}</span>
                    <span className="library-accordion-count">{cat.types.length}</span>
                  </button>
                  {open && (
                    <div className="library-list">
                      {cat.types.map((t) =>
                        renderType({
                          id: `${cat.category}:${t.elementType}`,
                          category: cat.category,
                          elementType: t.elementType,
                          label: t.label,
                          widthCells: t.widthCells,
                          heightCells: t.heightCells,
                          color: t.color,
                          svg: t.svg,
                          defaultFontSize: cat.category === 'text' ? 0.6 : undefined,
                        }),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="library-accordion">
        <button
          type="button"
          className={`library-accordion-head ${openTop === 'custom' ? 'open' : ''}`}
          onClick={() => toggleTop('custom')}
          aria-expanded={openTop === 'custom'}
        >
          <span>Custom</span>
          <span className="library-accordion-count">{customTotal}</span>
        </button>
        {openTop === 'custom' && (
          <div className="library-nested">
            {customTotal === 0 && (
              <p className="panel-hint">
                No custom elements yet. Mark cells as a polygon to create one.
              </p>
            )}
            {customCategoryNames.map((name) => {
              const open = openCategory === `custom:${name}`;
              const items = customGrouped.get(name) ?? [];
              return (
                <div key={name} className="library-accordion">
                  <button
                    type="button"
                    className={`library-accordion-head nested ${open ? 'open' : ''}`}
                    onClick={() => toggleCategory(`custom:${name}`)}
                    aria-expanded={open}
                  >
                    <span>{categoryLabel(name)}</span>
                    <span className="library-accordion-count">{items.length}</span>
                  </button>
                  {open && <div className="library-list">{items.map(renderType)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default EntityLibrary;
