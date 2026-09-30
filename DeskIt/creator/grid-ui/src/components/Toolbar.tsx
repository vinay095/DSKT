import React, { useEffect, useRef, useState } from 'react';
import type { Viewport } from '../types/viewport';
import { listDrafts } from '../lib/drafts';
import { PromptToast } from './PromptToast';

interface ToolbarProps {
  viewport: Viewport;
  selectEnabled: boolean;
  panEnabled: boolean;
  showGrid: boolean;
  snapEnabled: boolean;
  includeGridOnExport: boolean;
  theme: 'dark' | 'light';
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  canDelete: boolean;
  onToggleSelect: () => void;
  onTogglePan: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitFloor: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleExportGrid: () => void;
  onToggleTheme: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onHowToUse: () => void;
  onSaveDraft: (name: string) => void;
  onLoadDraft: (name: string) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onOpenPreview: () => void;
  onImportFloorImage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  viewport,
  selectEnabled,
  panEnabled,
  showGrid,
  snapEnabled,
  includeGridOnExport,
  theme,
  canUndo,
  canRedo,
  canPaste,
  canDelete,
  onToggleSelect,
  onTogglePan,
  onZoomIn,
  onZoomOut,
  onFitFloor,
  onToggleGrid,
  onToggleSnap,
  onToggleExportGrid,
  onToggleTheme,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onHowToUse,
  onSaveDraft,
  onLoadDraft,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onOpenPreview,
//  onImportFloorImage,
}) => {
  const [draftOpen, setDraftOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [draftsVersion, setDraftsVersion] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const draftMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const drafts = draftOpen ? listDrafts() : [];
  void draftsVersion;
  // Absolute scale (px per world unit) — avoid fake % that jumped with ÷40.
  const zoomLabel = viewport.zoom >= 10 ? `${Math.round(viewport.zoom)}×` : `${viewport.zoom.toFixed(1)}×`;

  useEffect(() => {
    if (!draftOpen && !exportOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (draftOpen && draftMenuRef.current && !draftMenuRef.current.contains(target)) {
        setDraftOpen(false);
      }
      if (exportOpen && exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [draftOpen, exportOpen]);

  return (
    <header className="toolbar" role="toolbar" aria-label="Floor editor controls">
      <div className="toolbar-brand">
        <span className="brand-mark" aria-hidden />
        <span>Floor Planner</span>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn toggle-btn ${selectEnabled ? 'active' : ''}`}
          onClick={onToggleSelect}
          title="Toggle select (can combine with Pan)"
        >
          Select
        </button>
        <button
          type="button"
          className={`toolbar-btn toggle-btn ${panEnabled ? 'active' : ''}`}
          onClick={onTogglePan}
          title="Toggle pan (can combine with Select)"
        >
          Pan
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn icon-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className="toolbar-btn icon-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
        <button type="button" className="toolbar-btn" onClick={onCopy} title="Copy (Ctrl+C)">
          Copy
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onPaste}
          disabled={!canPaste}
          title="Paste into selected cell (Ctrl+V)"
        >
          Paste
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onDelete}
          disabled={!canDelete}
          title="Delete selected (Del)"
        >
          Delete
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button type="button" className="toolbar-btn icon-btn" onClick={onZoomOut} title="Zoom out">
          −
        </button>
        <span className="zoom-display" title={`Zoom scale: ${viewport.zoom.toFixed(2)} px/world-unit`}>
          {zoomLabel}
        </span>
        <button type="button" className="toolbar-btn icon-btn" onClick={onZoomIn} title="Zoom in">
          +
        </button>
        <button type="button" className="toolbar-btn" onClick={onFitFloor} title="Fit floor">
          Fit
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn toggle-btn ${showGrid ? 'active' : ''}`}
          onClick={onToggleGrid}
        >
          Grid
        </button>
        <button
          type="button"
          className={`toolbar-btn toggle-btn ${snapEnabled ? 'active' : ''}`}
          onClick={onToggleSnap}
        >
          Snap
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group toolbar-menus">
        {/* Import floor image — enable later
        <button
          type="button"
          className="toolbar-btn"
          onClick={onImportFloorImage}
          title="Import walls and rooms from a geometric floor-plan image"
        >
          Import floor image
        </button>
        */}
        <button type="button" className="toolbar-btn" onClick={onOpenPreview}>
          Preview
        </button>
        <button type="button" className="toolbar-btn" onClick={onHowToUse}>
          How to use
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            setSaveDialogOpen(true);
            setDraftOpen(false);
            setExportOpen(false);
          }}
          title="Save floor plan to drafts"
        >
          Save
        </button>

        <div className="menu-wrap" ref={draftMenuRef}>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => {
              setDraftOpen((o) => !o);
              setExportOpen(false);
              setDraftsVersion((v) => v + 1);
            }}
          >
            Drafts
          </button>
          {draftOpen && (
            <div className="menu-dropdown draft-menu">
              {drafts.length === 0 && <div className="menu-empty">No saved drafts yet</div>}
              {drafts.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    onLoadDraft(d.name!);
                    setDraftOpen(false);
                    setDraftsVersion((v) => v + 1);
                  }}
                >
                  {d.name}
                  <small>{d.savedAt ? new Date(d.savedAt).toLocaleString() : ''}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="menu-wrap" ref={exportMenuRef}>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => {
              setExportOpen((o) => !o);
              setDraftOpen(false);
            }}
          >
            Export
          </button>
          {exportOpen && (
            <div className="menu-dropdown">
              <p className="menu-empty" style={{ paddingBottom: 4 }}>
                Exports the full floor area
              </p>
              <label className="menu-check">
                <input
                  type="checkbox"
                  checked={includeGridOnExport}
                  onChange={onToggleExportGrid}
                />
                Include grid lines
              </label>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onExportPng();
                  setExportOpen(false);
                }}
              >
                Download PNG
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onExportSvg();
                  setExportOpen(false);
                }}
              >
                Download SVG
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onExportPdf();
                  setExportOpen(false);
                }}
              >
                Download PDF
              </button>
            </div>
          )}
        </div>

        <button type="button" className="toolbar-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      <PromptToast
        request={
          saveDialogOpen
            ? {
                title: 'Save floor plan',
                message: 'Enter a name for this draft.',
                placeholder: 'e.g. Floor A — draft',
                confirmLabel: 'Save',
              }
            : null
        }
        onSubmit={(value) => {
          const name = value.trim();
          setSaveDialogOpen(false);
          if (!name) return;
          onSaveDraft(name);
          setDraftsVersion((v) => v + 1);
        }}
        onCancel={() => setSaveDialogOpen(false)}
      />
    </header>
  );
};

export default Toolbar;
