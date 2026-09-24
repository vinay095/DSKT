import React, { useState } from 'react';
import { CATALOG_ITEMS, CatalogItem } from '../../lib/catalog';
import {
  Monitor,
  Sparkles,
  Building,
  Square,
  Building2,
  PhoneCall,
  Coffee,
  Bath,
  Box,
  Trees,
  Plus
} from 'lucide-react';

interface EntityLibraryProps {
  activeCatalogItem: CatalogItem | null;
  onSelectCatalogItem: (item: CatalogItem | null) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Monitor,
  Sparkles,
  Building,
  Square,
  Building2,
  PhoneCall,
  Coffee,
  Bath,
  Box,
  Trees,
};

export const EntityLibrary: React.FC<EntityLibraryProps> = ({
  activeCatalogItem,
  onSelectCatalogItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'desk', label: 'Desks' },
    { id: 'room', label: 'Rooms' },
    { id: 'amenity', label: 'Amenities' },
    { id: 'infrastructure', label: 'Structure' },
  ];

  const filteredItems = CATALOG_ITEMS.filter((item) => {
    return activeCategory === 'all' || item.subcategory === activeCategory || item.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-brandPurple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-sidebar text-light-muted dark:text-dark-muted hover:bg-slate-200 dark:hover:bg-dark-card'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Catalog Items Grid */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isSelected = activeCatalogItem?.id === item.id;
          const IconComponent = ICON_MAP[item.iconName] || Plus;

          return (
            <button
              key={item.id}
              onClick={() => onSelectCatalogItem(isSelected ? null : item)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition text-left ${
                isSelected
                  ? 'border-brandPurple-600 bg-brandPurple-50 dark:bg-brandPurple-900/30 text-brandPurple-700 dark:text-brandPurple-300 ring-1 ring-brandPurple-600'
                  : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar text-light-text dark:text-dark-text'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight">{item.name}</h4>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted mt-0.5 line-clamp-1">
                    {item.widthFinestCells / 4}x{item.heightFinestCells / 4} Placement Cells
                  </p>
                </div>
              </div>

              <div className="shrink-0 pl-2">
                {isSelected ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brandPurple-600 text-white">
                    Placing
                  </span>
                ) : (
                  <Plus className="w-4 h-4 text-light-muted dark:text-dark-muted" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
