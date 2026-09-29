import { useCallback, useEffect, useMemo, useState } from 'react';
import FloorEditor from './components/FloorEditor';
import PrettyFloorView from './components/PrettyFloorView';
import type { FloorDocument } from './lib/drafts';
import { normalizeDocument } from './lib/drafts';
import {
  DESKIT_CREATOR_READY_EVENT,
  DESKIT_LOAD_DOCUMENT_EVENT,
  DESKIT_REQUEST_DOCUMENT_EVENT,
  getCreatorContextFromUrl,
  loadPublishedFloorDocument,
  type CreatorFloorContext,
} from './lib/publish';

function App() {
  const urlCtx = useMemo(() => getCreatorContextFromUrl(), []);
  const [floorCtx, setFloorCtx] = useState<CreatorFloorContext>(urlCtx);
  const [prettyDoc, setPrettyDoc] = useState<FloorDocument | null>(null);
  const [externalDoc, setExternalDoc] = useState<FloorDocument | null>(() =>
    urlCtx.floorId ? loadPublishedFloorDocument(urlCtx.floorId) : null,
  );
  const [externalDocNonce, setExternalDocNonce] = useState(0);

  const applyIncomingDocument = useCallback(
    (raw: unknown, nextCtx?: CreatorFloorContext) => {
      if (!raw || typeof raw !== 'object') return;
      try {
        const doc = normalizeDocument(raw as FloorDocument);
        if (doc.version !== 2) return;
        setExternalDoc(doc);
        setExternalDocNonce((n) => n + 1);
        if (nextCtx?.floorId || nextCtx?.officeId) {
          setFloorCtx((prev) => ({
            floorId: nextCtx.floorId ?? prev.floorId,
            officeId: nextCtx.officeId ?? prev.officeId,
          }));
        }
      } catch {
        /* ignore malformed payload */
      }
    },
    [],
  );

  // Tell parent DeskIt shell (iframe) and/or opener (Open planner / Full window) that
  // this is the real floor planner and request the FloorDocument for this floor.
  useEffect(() => {
    const notifyHost = (target: Window | null | undefined) => {
      if (!target || target === window) return;
      try {
        target.postMessage(
          {
            type: DESKIT_CREATOR_READY_EVENT,
            app: 'creator-grid-ui',
            floorId: floorCtx.floorId,
            officeId: floorCtx.officeId,
          },
          '*',
        );
        if (floorCtx.floorId) {
          target.postMessage(
            {
              type: DESKIT_REQUEST_DOCUMENT_EVENT,
              floorId: floorCtx.floorId,
              officeId: floorCtx.officeId,
            },
            '*',
          );
        }
      } catch {
        /* ignore closed / inaccessible targets */
      }
    };

    const announce = () => {
      if (window.parent && window.parent !== window) notifyHost(window.parent);
      try {
        notifyHost(window.opener as Window | null);
      } catch {
        /* opener access can throw in rare cases */
      }
    };
    announce();
    const t = window.setTimeout(announce, 300);
    return () => window.clearTimeout(t);
  }, [floorCtx.floorId, floorCtx.officeId]);

  // Parent may push a FloorDocument after ready (or when switching floors via new iframe src)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== DESKIT_LOAD_DOCUMENT_EVENT) return;
      applyIncomingDocument(data.document, {
        floorId: typeof data.floorId === 'string' ? data.floorId : undefined,
        officeId: typeof data.officeId === 'string' ? data.officeId : undefined,
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [applyIncomingDocument]);

  return (
    <>
      <div
        className="app-planner-wrap"
        style={{
          display: prettyDoc ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '100vh',
        }}
        aria-hidden={Boolean(prettyDoc)}
      >
        <FloorEditor
          onOpenPretty={setPrettyDoc}
          externalDocument={externalDoc}
          externalDocumentNonce={externalDocNonce}
          floorContext={floorCtx}
        />
      </div>
      {prettyDoc && (
        <PrettyFloorView
          document={prettyDoc}
          floorContext={floorCtx}
          onBack={() => setPrettyDoc(null)}
        />
      )}
    </>
  );
}

export default App;
