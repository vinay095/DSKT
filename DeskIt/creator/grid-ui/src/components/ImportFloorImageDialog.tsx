import React, { useCallback, useEffect, useState } from 'react';
import type { FloorConfig, FloorZone, UnusableRegion } from '../types/geometry';
import {
  importFloorImageFile,
  loadImageFile,
  previewFloorImageMask,
  type FloorImageImportResult,
} from '../lib/importFloorImage';

export type ImportFloorImageApply = {
  floor: FloorConfig;
  unusableRegions: UnusableRegion[];
  zones: FloorZone[];
  replaceExisting: boolean;
};

interface ImportFloorImageDialogProps {
  open: boolean;
  currentFloor: FloorConfig;
  onCancel: () => void;
  onApply: (payload: ImportFloorImageApply) => void;
}

/**
 * v1 geometric floor-map import — walls + room footprints from a PNG/JPG.
 * Classical threshold / flood-fill only (no ML).
 */
const ImportFloorImageDialog: React.FC<ImportFloorImageDialogProps> = ({
  open,
  currentFloor,
  onCancel,
  onApply,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(140);
  const [invert, setInvert] = useState(false);
  const [dilate, setDilate] = useState(1);
  const [maxCols, setMaxCols] = useState(Math.max(32, currentFloor.cols));
  const [detectRooms, setDetectRooms] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<FloorImageImportResult['stats'] | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setImage(null);
      setPreviewUrl('');
      setError(null);
      setLastStats(null);
      setBusy(false);
      setThreshold(140);
      setInvert(false);
      setDilate(1);
      setMaxCols(Math.max(32, currentFloor.cols));
      setDetectRooms(true);
      setReplaceExisting(true);
    }
  }, [open, currentFloor.cols]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const url = await previewFloorImageMask(image, {
          threshold,
          invert,
          dilate,
          maxCols,
          a: currentFloor.a,
          detectRooms,
        });
        if (!cancelled) setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewUrl('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [image, threshold, invert, dilate, maxCols, currentFloor.a, detectRooms]);

  const onPickFile = useCallback(async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
    try {
      const img = await loadImageFile(f);
      setImage(img);
    } catch {
      setFile(null);
      setImage(null);
      setError('Could not read that image. Use PNG, JPG, WebP, or GIF.');
    }
  }, []);

  const handleApply = useCallback(async () => {
    if (!file) {
      setError('Choose a floor-map image first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importFloorImageFile(file, {
        threshold,
        invert,
        dilate,
        maxCols,
        a: currentFloor.a,
        detectRooms,
      });
      setLastStats(result.stats);
      if (result.unusableRegions.length === 0) {
        setError(
          'No walls detected. Try lowering the threshold, toggling Invert, or using a sharper line drawing.',
        );
        setBusy(false);
        return;
      }
      onApply({
        floor: result.floor,
        unusableRegions: result.unusableRegions,
        zones: result.zones,
        replaceExisting,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }, [
    file,
    threshold,
    invert,
    dilate,
    maxCols,
    currentFloor.a,
    detectRooms,
    replaceExisting,
    onApply,
  ]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal-card import-floor-dialog"
        role="dialog"
        aria-label="Import floor image"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: '92vw' }}
      >
        <div className="modal-header">
          <h2>Import floor image</h2>
        </div>
        <div className="modal-body">
          <p className="panel-hint" style={{ marginTop: 0 }}>
            Upload a geometric floor-plan image (PNG, JPG, WebP, or GIF). Dark lines
            become walls (unusable regions); enclosed light areas become rooms (zones).
            Furniture detection is not included in this version. Preview matches Apply
            (threshold, dilate, floor width, room detection).
          </p>

          <label className="prop-field">
            <span>Floor plan image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => void onPickFile(e.target.files)}
            />
          </label>

          {image && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <div className="panel-hint">Original</div>
                <img
                  src={image.src}
                  alt="Original floor plan"
                  style={{
                    width: '100%',
                    maxHeight: 180,
                    objectFit: 'contain',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid var(--border, #cbd5e1)',
                  }}
                />
              </div>
              <div>
                <div className="panel-hint">Apply preview (walls{detectRooms ? ' + rooms' : ''})</div>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Threshold preview"
                    style={{
                      width: '100%',
                      maxHeight: 180,
                      objectFit: 'contain',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid var(--border, #cbd5e1)',
                    }}
                  />
                ) : (
                  <div className="panel-hint">Computing…</div>
                )}
              </div>
            </div>
          )}

          <label className="prop-field">
            <span>Threshold ({threshold}) — higher = more walls (pixels darker than this count as walls)</span>
            <input
              type="range"
              min={40}
              max={220}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </label>

          <label className="prop-field">
            <span>Floor width (cols of a)</span>
            <input
              type="number"
              min={8}
              max={256}
              value={maxCols}
              onChange={(e) => setMaxCols(Math.max(8, Number(e.target.value) || 64))}
            />
          </label>

          <label className="prop-field">
            <span>Wall thickness (dilate)</span>
            <input
              type="range"
              min={0}
              max={3}
              value={dilate}
              onChange={(e) => setDilate(Number(e.target.value))}
            />
          </label>

          <label className="radio-row" style={{ marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
            />
            Invert (light lines on dark background)
          </label>
          <label className="radio-row" style={{ marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={detectRooms}
              onChange={(e) => setDetectRooms(e.target.checked)}
            />
            Detect enclosed rooms as zones
          </label>
          <label className="radio-row" style={{ marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Replace existing walls / zones (keeps in-bounds furniture; removes items outside the new floor)
          </label>

          {lastStats && (
            <p className="panel-hint">
              Last run: {lastStats.wallRegions} wall regions, {lastStats.roomCount}{' '}
              rooms (grid {lastStats.detectionCols}×{lastStats.detectionRows})
            </p>
          )}
          {error && (
            <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</p>
          )}
        </div>

        <div
          className="modal-footer"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px' }}
        >
          <button type="button" className="toolbar-btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => void handleApply()}
            disabled={busy || !file}
            style={{ background: 'var(--accent, #2563eb)', color: '#fff' }}
          >
            {busy ? 'Importing…' : 'Import walls & rooms'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportFloorImageDialog;
