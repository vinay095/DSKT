import React, { useState } from 'react';
import { ExternalLink, Maximize2, Loader2 } from 'lucide-react';
import { getFloorCreatorUrl } from '../../lib/floorCreator';
import { cn } from '../../lib/cn';

interface FloorCreatorEmbedProps {
  className?: string;
}

/**
 * Embeds the hosted Floor Creator (dskt.vercel.app) inside DeskIt Admin.
 * The external app is unchanged; this is a thin integration shell only.
 */
export const FloorCreatorEmbed: React.FC<FloorCreatorEmbedProps> = ({ className }) => {
  const creatorUrl = getFloorCreatorUrl();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const openInNewTab = () => {
    window.open(creatorUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 rounded-2xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card overflow-hidden shadow-sm',
        className
      )}
    >
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar">
        <div>
          <h2 className="text-sm font-extrabold text-light-text dark:text-dark-text">
            Floor Plan Creator
          </h2>
          <p className="text-[10px] text-light-muted dark:text-dark-muted">
            Hosted editor pipeline · {creatorUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openInNewTab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-light-border dark:border-dark-border bg-white dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-border/40 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in new tab
          </button>
          <button
            type="button"
            onClick={openInNewTab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white transition"
            title="Launch full-screen creator"
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
              Loading Floor Creator…
            </p>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-bold text-light-text dark:text-dark-text">
              Could not embed the Floor Creator
            </p>
            <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm">
              The hosted app may block embedding in this browser. Open it in a new tab to continue.
            </p>
            <button
              type="button"
              onClick={openInNewTab}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Floor Creator
            </button>
          </div>
        ) : (
          <iframe
            title="DeskIt Floor Creator"
            src={creatorUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
