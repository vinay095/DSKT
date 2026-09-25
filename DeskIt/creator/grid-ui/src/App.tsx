import { useEffect, useState } from 'react';
import FloorEditor from './components/FloorEditor';
import PrettyFloorView from './components/PrettyFloorView';
import type { FloorDocument } from './lib/drafts';

const CREATOR_READY = 'deskit:creator-ready';

function App() {
  const [prettyDoc, setPrettyDoc] = useState<FloorDocument | null>(null);

  // Tell parent DeskIt shell that this iframe is the real floor planner (not DeskIt itself)
  useEffect(() => {
    const announce = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: CREATOR_READY, app: 'creator-grid-ui' }, '*');
      }
    };
    announce();
    const t = window.setTimeout(announce, 300);
    return () => window.clearTimeout(t);
  }, []);

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
        <FloorEditor onOpenPretty={setPrettyDoc} />
      </div>
      {prettyDoc && (
        <PrettyFloorView document={prettyDoc} onBack={() => setPrettyDoc(null)} />
      )}
    </>
  );
}

export default App;
