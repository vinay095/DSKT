import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
