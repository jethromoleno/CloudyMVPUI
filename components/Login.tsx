import React, { useState } from 'react';
import { Moon, Sun, Truck } from 'lucide-react';
import { Theme } from '../types';
import type { DevelopmentIdentitySummary } from '../services';
import { uiClasses } from '../design/tokens';
import { Button, FormField } from './ui';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string | null;
  isAuthenticating?: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  developmentIdentities?: readonly DevelopmentIdentitySummary[];
}

const Login: React.FC<LoginProps> = ({
  onLogin,
  error,
  isAuthenticating = false,
  theme,
  onToggleTheme,
  developmentIdentities = [],
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-50 transition-colors duration-500 dark:bg-carbon-950">
      <Button
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="absolute right-6 top-6 z-20 rounded-full"
        icon={
          theme === 'dark' ? (
            <Sun aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Moon aria-hidden="true" className="h-5 w-5" />
          )
        }
        onClick={onToggleTheme}
        size="icon"
        variant="secondary"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 shadow-xl transition-all duration-300 dark:border-carbon-800 dark:bg-carbon-900">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-navy-900 shadow-xl shadow-navy-900/20 dark:bg-white dark:shadow-none">
            <Truck className="h-8 w-8 text-white dark:text-carbon-900" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white">Cloudy Logistics</h1>
          <p className="mt-2 text-navy-500 dark:text-carbon-100">Trip Scheduling Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <FormField label="Username" required>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={uiClasses.field}
              placeholder="e.g. SuperAdmin"
              required
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={uiClasses.field}
              placeholder="Password"
              required
            />
          </FormField>

          <Button type="submit" className="w-full" isLoading={isAuthenticating} size="lg">
            {isAuthenticating ? 'Signing in' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs font-medium text-navy-500 dark:text-carbon-100">
          Development auth adapter &bull; Session remains in memory only
        </p>
        {developmentIdentities.length > 0 && (
          <details className="mt-4 rounded-lg border border-navy-200 bg-navy-50 p-3 text-xs text-navy-600 dark:border-carbon-800 dark:bg-carbon-950 dark:text-carbon-300">
            <summary className="cursor-pointer font-semibold">Development review identities</summary>
            <ul className="mt-2 grid grid-cols-2 gap-1" aria-label="Development review identities by role">
              {developmentIdentities.map((identity) => (
                <li key={identity.username}>
                  <span className="font-mono">{identity.username}</span> - {identity.role}
                  {identity.active === false ? ' (inactive fixture)' : ''}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-navy-500 dark:text-carbon-400">
              These identities exercise presentation policy only. They are not production accounts or authorization.
            </p>
          </details>
        )}
      </div>
    </div>
  );
};

export default Login;
