import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, SsoProvider } from '../../types/auth';
import { Shield, Check, Lock, Building } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

export const SsoLoginModal: React.FC = () => {
  const { isSsoModalOpen, closeSsoModal, loginWithSSO, user, switchRole, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'employee');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isSsoModalOpen && isAuthenticated) return null;

  const handleSsoClick = (provider: SsoProvider) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      loginWithSSO(provider, selectedRole);
      setIsAuthenticating(false);
    }, 600);
  };

  const roles: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'employee',
      title: 'Employee Access',
      desc: 'View floor plans, find teammates & seats across floors'
    },
    {
      role: 'hr',
      title: 'HR Manager',
      desc: 'Assign seats, manage team zones & desk allocations'
    },
    {
      role: 'admin',
      title: 'Workspace Admin',
      desc: 'Build floor plans from scratch, save drafts & manage facility maps'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brandBlue-600 to-brandBlue-700 dark:from-brandPurple-900 dark:to-brandPurple-950 text-white relative">
          {isAuthenticated && (
            <button
              onClick={closeSsoModal}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-xs font-semibold px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition"
            >
              ✕ Close
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">DeskIT SSO Portal</h2>
              <p className="text-xs text-blue-100 dark:text-purple-200 mt-0.5">
                Enterprise Single Sign-On & Access Control
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select Access Level / Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2.5">
              1. Choose Access Level for Demo
            </label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(item.role);
                    if (isAuthenticated) {
                      switchRole(item.role);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedRole === item.role
                      ? 'border-brandBlue-600 dark:border-brandPurple-500 bg-brandBlue-50/50 dark:bg-brandPurple-900/20 ring-1 ring-brandBlue-600 dark:ring-brandPurple-500'
                      : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar'
                  }`}
                >
                  <div className="mt-0.5">
                    {selectedRole === item.role ? (
                      <div className="w-5 h-5 rounded-full bg-brandBlue-600 dark:bg-brandPurple-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-light-text dark:text-dark-text">
                        {item.title}
                      </span>
                      <RoleBadge role={item.role} showIcon={false} />
                    </div>
                    <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: SSO Authentication Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2.5">
              2. Authenticate via Identity Provider
            </label>

            {isAuthenticating ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-brandBlue-600 dark:border-brandPurple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-light-text dark:text-dark-text">
                  Verifying SAML / OIDC Credentials...
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSsoClick('google')}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar hover:bg-slate-50 dark:hover:bg-dark-card font-medium text-sm text-slate-800 dark:text-slate-100 shadow-sm transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google Workspace
                </button>

                <button
                  type="button"
                  onClick={() => handleSsoClick('microsoft')}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar hover:bg-slate-50 dark:hover:bg-dark-card font-medium text-sm text-slate-800 dark:text-slate-100 shadow-sm transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Sign in with Microsoft Entra ID
                </button>

                <button
                  type="button"
                  onClick={() => handleSsoClick('okta')}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar hover:bg-slate-50 dark:hover:bg-dark-card font-medium text-sm text-slate-800 dark:text-slate-100 shadow-sm transition"
                >
                  <Shield className="w-5 h-5 text-brandBlue-600 dark:text-brandPurple-400" />
                  Sign in with Okta SSO
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> 256-bit TLS Encrypted
            </span>
            <span>v1.0.0 Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};
