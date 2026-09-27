import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        isDark ? 'bg-surface-muted border-border' : 'bg-surface-muted border-border',
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={cn(
          'pointer-events-none absolute top-0.5 left-0.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition duration-200',
          'bg-surface text-accent',
          isDark && 'translate-x-6',
        )}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}
      </span>
    </button>
  );
};
