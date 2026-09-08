import React, { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  ELEMENT_LIBRARY,
} from '@/data/elementLibrary';
import type { ElementCategory, ElementDefinition } from '@/types/floorPlan';

const CATEGORIES: ElementCategory[] = [
  'furniture',
  'spaces',
  'infrastructure',
  'special',
];

function ElementIcon({ type }: { type: string }) {
  return <span className={`sm-el-icon sm-el-icon--${type}`} aria-hidden />;
}

export const ElementLibrary: React.FC = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({
    furniture: true,
    spaces: true,
    infrastructure: false,
    special: false,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ELEMENT_LIBRARY;
    return ELEMENT_LIBRARY.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.type.includes(q) ||
        e.category.includes(q),
    );
  }, [query]);

  const byCategory = useMemo(() => {
    const map: Record<string, ElementDefinition[]> = {};
    for (const cat of CATEGORIES) map[cat] = [];
    for (const el of filtered) map[el.category]?.push(el);
    return map;
  }, [filtered]);

  const onDragStart = (e: React.DragEvent, el: ElementDefinition) => {
    e.dataTransfer.setData('application/spacemap-element', el.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="sm-library">
      <div className="sm-library__header">
        <h2>Elements</h2>
        <input
          className="sm-input"
          type="search"
          placeholder="Search elements…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="sm-library__body">
        {CATEGORIES.map((cat) => {
          const items = byCategory[cat] ?? [];
          if (!items.length && query) return null;
          const isOpen = open[cat] ?? true;
          return (
            <div key={cat} className="sm-library__section">
              <button
                type="button"
                className="sm-library__section-toggle"
                onClick={() => setOpen((s) => ({ ...s, [cat]: !isOpen }))}
              >
                <span className="sm-chevron">{isOpen ? '▾' : '▸'}</span>
                {CATEGORY_LABELS[cat]}
                <span className="sm-count">{items.length}</span>
              </button>
              {isOpen && (
                <ul className="sm-library__list">
                  {items.map((el) => (
                    <li key={el.type}>
                      <div
                        className="sm-library__item"
                        draggable
                        onDragStart={(e) => onDragStart(e, el)}
                        title={`Drag to place · ${el.mobility}`}
                      >
                        <ElementIcon type={el.icon} />
                        <div className="sm-library__item-text">
                          <span className="sm-library__item-label">{el.label}</span>
                          <span className="sm-library__item-meta">
                            {el.defaultWidth}×{el.defaultHeight} · {el.mobility}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
