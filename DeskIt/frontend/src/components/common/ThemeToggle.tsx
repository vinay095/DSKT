import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDark 
          ? 'bg-dark-card border-brandPurple-600/50 focus:ring-brandPurple-500' 
          : 'bg-slate-200 border-brandBlue-300 focus:ring-brandBlue-500'
      }`}
      title={isDark ? "Switch to Light Mode (White & Blue)" : "Switch to Dark Mode (Black & Purple)"}
      aria-label="Toggle Dark/Light Mode"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`pointer-events-none relative inline-block h-8 w-8 transform rounded-full shadow-md transition duration-300 ease-in-out flex items-center justify-center ${
          isDark 
            ? 'translate-x-7 bg-brandPurple-600 text-white' 
            : 'translate-x-0 bg-white text-brandBlue-600'
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 animate-pulse text-brandPurple-200" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
};
