import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  DESKIT_CREATOR_READY_EVENT,
  DESKIT_PUBLISH_EVENT,
  getFloorCreatorUrl,
  HOSTED_FLOOR_CREATOR_URL,
  isCreatorUrlSameOriginAsDeskIt,
  LOCAL_CREATOR_URL,
} from '../../lib/floorCreator';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { cn } from '../../lib/cn';

interface FloorCreatorEmbedProps {
  className?: string;
  onPublished?: (doc: FloorDocumentV2) => void;
}

/**
 * Embeds the Creator floor planner (creator/grid-ui on :5174) inside DeskIt Admin.
 * Never uses a same-origin relative URL — that recursively loads DeskIt itself.
 */
export const FloorCreatorEmbed: React.FC<FloorCreatorEmbedProps> = ({ className, onPublished }) => {
  const creatorUrl = getFloorCreatorUrl();
  const sameOriginTrap = isCreatorUrlSameOriginAsDeskIt(creatorUrl);
  const [isLoading, setIsLoading] = useState(!sameOriginTrap);
  const [hasError, setHasError] = useState(sameOriginTrap);
  const [errorHint, setErrorHint] = useState(
    sameOriginTrap
      ? 'Creator URL points at DeskIt itself. Use http://localhost:5174/ (run creator/grid-ui separately).'
      : null as string | null,
  );
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [creatorReady, setCreatorReady] = useState(false);
  const readyTimerRef = useRef<number | null>(null);

  const openInNewTab = (url = creatorUrl) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === DESKIT_CREATOR_READY_EVENT) {
        setCreatorReady(true);
        setIsLoading(false);
        setHasError(false);
        setErrorHint(null);
        if (readyTimerRef.current) {
          window.clearTimeout(readyTimerRef.current);
          readyTimerRef.current = null;
        }
        return;
      }

      if (data.type === DESKIT_PUBLISH_EVENT && data.document) {
        const doc = data.document as FloorDocumentV2;
        setPublishNotice('Floor map published — available for HR');
        onPublished?.(doc);
        window.setTimeout(() => setPublishNotice(null), 4000);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'deskit_published_floor_document_v2' || !e.newValue) return;
      try {
        const doc = JSON.parse(e.newValue) as FloorDocumentV2;
        setPublishNotice('Floor map published — available for HR');
        onPublished?.(doc);
        window.setTimeout(() => setPublishNotice(null), 4000);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [onPublished]);

  useEffect(() => {
    if (sameOriginTrap || hasError) return;

    setIsLoading(true);
    setCreatorReady(false);
    let settled = false;

    readyTimerRef.current = window.setTimeout(() => {
      if (!settled) {
        setIsLoading(false);
        setHasError(true);
        setErrorHint(
          `Floor planner did not start at ${creatorUrl}. In a second terminal run: cd creator/grid-ui && npm run dev`,
        );
      }
    }, 8000);

    const onReady = (event: MessageEvent) => {
      if (event.data?.type !== DESKIT_CREATOR_READY_EVENT) return;
      settled = true;
      setCreatorReady(true);
      setIsLoading(false);
      setHasError(false);
      setErrorHint(null);
      if (readyTimerRef.current) {
        window.clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
    window.addEventListener('message', onReady);

    return () => {
      if (readyTimerRef.current) window.clearTimeout(readyTimerRef.current);
      window.removeEventListener('message', onReady);
    };
  }, [creatorUrl, sameOriginTrap, hasError]);

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 rounded-2xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card overflow-hidden shadow-sm',
        className,
      )}
    >
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar">
        <div>
          <h2 className="text-sm font-extrabold text-light-text dark:text-dark-text">
            Floor Planner
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {publishNotice && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {publishNotice}
            </span>
          )}
          <button
            type="button"
            onClick={() => openInNewTab(LOCAL_CREATOR_URL)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-light-border dark:border-dark-border bg-white dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-border/40 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open planner
          </button>
          <button
            type="button"
            onClick={() => openInNewTab(LOCAL_CREATOR_URL)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Full window
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 bg-slate-100 dark:bg-dark-bg">
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-sm">
            <Loader2 className="w-7 h-7 animate-spin text-brandBlue-600 dark:text-brandPurple-400" />
            <p className="text-xs font-semibold text-light-muted dark:text-dark-muted">
              Loading Floor Planner…
            </p>
            <p className="text-[10px] text-light-muted dark:text-dark-muted max-w-sm text-center">
              DeskIt: <code className="font-mono">localhost:5173</code> · Creator:{' '}
              <code className="font-mono">localhost:5174</code>
            </p>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-bold text-light-text dark:text-dark-text">
              Floor planner is not available
            </p>
            <p className="text-xs text-light-muted dark:text-dark-muted max-w-md">
              {errorHint ||
                'Start the Creator app, then reopen Floor Plan Editor.'}
            </p>
            <pre className="text-left text-[11px] font-mono bg-slate-100 dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text">
{`cd creator/grid-ui
npm run dev
# → http://localhost:5174`}
            </pre>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  if (sameOriginTrap) {
                    setHasError(true);
                    setErrorHint(
                      'DeskIt and Creator cannot share the same port. Start DeskIt on :5173 and Creator on :5174.',
                    );
                    return;
                  }
                  setHasError(false);
                  setIsLoading(true);
                  setCreatorReady(false);
                  setErrorHint(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-light-border dark:border-dark-border"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => openInNewTab(LOCAL_CREATOR_URL)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open {LOCAL_CREATOR_URL}
              </button>
              <button
                type="button"
                onClick={() => openInNewTab(HOSTED_FLOOR_CREATOR_URL)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-light-border dark:border-dark-border"
              >
                Hosted fallback
              </button>
            </div>
          </div>
        ) : (
          <iframe
            title="DeskIt Floor Planner"
            src={creatorUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              // Prefer creator-ready handshake; don't clear loading until then
              // (avoids briefly showing a wrong page if URL is misconfigured)
            }}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
              setErrorHint('Failed to load the floor planner iframe.');
            }}
          />
        )}
      </div>
    </div>
  );
};
