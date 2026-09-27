import React from 'react';
import { ShieldOff } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access restricted',
  description = 'Your current role does not have permission to view this area.',
}) => {
  return (
    <div className="ds-panel flex flex-col items-center justify-center text-center gap-3 p-10 min-h-[240px]">
      <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
        <ShieldOff className="w-6 h-6 text-content-secondary" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-content-primary">{title}</h2>
      <p className="text-xs text-content-secondary max-w-sm">{description}</p>
    </div>
  );
};
