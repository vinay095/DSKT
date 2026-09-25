import React from 'react';

interface SelectionActionMenuProps {
  x: number;
  y: number;
  cellCount: number;
  canPaste: boolean;
  hasUnusableInSelection: boolean;
  entityCountInSelection: number;
  onMarkPolygon: () => void;
  onPaste: () => void;
  onCopyZone: () => void;
  onMarkZone: () => void;
  onMarkUnusable: () => void;
  onLabelUnusable: () => void;
  onMarkUsable: () => void;
  onClearAllUnusable: () => void;
  onDeleteEntities: () => void;
  onClear: () => void;
}

const SelectionActionMenu: React.FC<SelectionActionMenuProps> = ({
  x,
  y,
  cellCount,
  canPaste,
  hasUnusableInSelection,
  entityCountInSelection,
  onMarkPolygon,
  onPaste,
  onCopyZone,
  onMarkZone,
  onMarkUnusable,
  onLabelUnusable,
  onMarkUsable,
  onClearAllUnusable,
  onDeleteEntities,
  onClear,
}) => {
  return (
    <div
      className="selection-action-menu"
      style={{ left: x, top: y }}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="selection-action-count">{cellCount} cells</span>
      <button type="button" className="selection-action-btn" onClick={onMarkPolygon}>
        Mark as polygon
      </button>
      <button type="button" className="selection-action-btn" onClick={onMarkUnusable}>
        Mark unusable
      </button>
      {hasUnusableInSelection && (
        <>
          <button type="button" className="selection-action-btn" onClick={onMarkUsable}>
            Mark usable
          </button>
          <button type="button" className="selection-action-btn" onClick={onLabelUnusable}>
            Label unusable
          </button>
        </>
      )}
      <button type="button" className="selection-action-btn ghost" onClick={onClearAllUnusable}>
        Clear all unusable
      </button>
      <button
        type="button"
        className="selection-action-btn"
        onClick={onPaste}
        disabled={!canPaste}
      >
        Paste
      </button>
      <button type="button" className="selection-action-btn" onClick={onCopyZone}>
        Copy zone
      </button>
      <button type="button" className="selection-action-btn" onClick={onMarkZone}>
        Mark zone
      </button>
      <button
        type="button"
        className="selection-action-btn"
        onClick={onDeleteEntities}
        disabled={entityCountInSelection === 0}
      >
        Delete entities{entityCountInSelection > 0 ? ` (${entityCountInSelection})` : ''}
      </button>
      <button type="button" className="selection-action-btn ghost" onClick={onClear}>
        Clear
      </button>
    </div>
  );
};

export default SelectionActionMenu;
