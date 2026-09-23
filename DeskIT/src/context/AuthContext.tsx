import React, { createContext, useContext, useState } from 'react';
import { User, UserRole, SsoProvider } from '../types/auth';
import { MOCK_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  ssoProvider: SsoProvider | null;
  isSsoModalOpen: boolean;
  loginWithSSO: (provider: SsoProvider, role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  openSsoModal: () => void;
  closeSsoModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Employee user logged in via SSO Google
  const [user, setUser] = useState<User | null>(MOCK_USERS.employee);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [ssoProvider, setSsoProvider] = useState<SsoProvider | null>('google');
  const [isSsoModalOpen, setIsSsoModalOpen] = useState<boolean>(false);

  const loginWithSSO = (provider: SsoProvider, role: UserRole = 'employee') => {
    setSsoProvider(provider);
    setUser(MOCK_USERS[role] || MOCK_USERS.employee);
    setIsAuthenticated(true);
    setIsSsoModalOpen(false);
  };

  const switchRole = (role: UserRole) => {
    if (MOCK_USERS[role]) {
      setUser(MOCK_USERS[role]);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setSsoProvider(null);
  };

  const openSsoModal = () => setIsSsoModalOpen(true);
  const closeSsoModal = () => setIsSsoModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        ssoProvider,
        isSsoModalOpen,
        loginWithSSO,
        switchRole,
        logout,
        openSsoModal,
        closeSsoModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
