import React from 'react';
import { FloorPlanProvider } from '@/app/providers/FloorPlanProvider';
import { FloorPlanEditor } from '@/features/editor/FloorPlanEditor';

export const App: React.FC = () => {
  return (
    <FloorPlanProvider>
      <FloorPlanEditor />
    </FloorPlanProvider>
  );
};

export default App;
