import React from 'react';

interface EntityActionMenuProps {
  x: number;
  y: number;
  locked: boolean;
  onCopy: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onClose: () => void;
}

const EntityActionMenu: React.FC<EntityActionMenuProps> = ({
  x,
  y,
  locked,
  onCopy,
  onRotate,
  onDelete,
  onLock,
  onUnlock,
  onClose,
}) => {
  return (
    <div
      className="selection-action-menu entity-action-menu"
      style={{ left: x, top: y }}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {locked ? (
        <>
          <button type="button" className="selection-action-btn" onClick={onUnlock}>
            Unlock
          </button>
          <button type="button" className="selection-action-btn ghost" onClick={onClose}>
            Close
          </button>
        </>
      ) : (
        <>
          <button type="button" className="selection-action-btn" onClick={onCopy}>
            Copy
          </button>
          <button
            type="button"
            className="selection-action-btn"
            onClick={onRotate}
            title="Rotate 90° anticlockwise"
          >
            Rotate
          </button>
          <button type="button" className="selection-action-btn" onClick={onLock}>
            Lock
          </button>
          <button type="button" className="selection-action-btn" onClick={onDelete}>
            Delete
          </button>
          <button type="button" className="selection-action-btn ghost" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </div>
  );
};

export default EntityActionMenu;
