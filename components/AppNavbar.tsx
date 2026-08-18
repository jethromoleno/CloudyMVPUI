import React from 'react';
import { Grid, Menu, Moon, RefreshCw, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routePaths } from '../routes';
import type { Theme } from '../types';
import { Button } from './ui';

interface AppNavbarProps {
  onOpenNavigation: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: string | null;
  theme: Theme;
}

const pageLabels: Array<[RegExp, string]> = [
  [/\/trips\/new$/, 'Create Trip'],
  [/\/trips\/[^/]+\/edit$/, 'Edit Trip'],
  [/\/trips\/[^/]+$/, 'Trip Details'],
  [/\/trips$/, 'Trip Operations'],
  [/\/trucks$/, 'Truck Management'],
  [/\/employees$/, 'Employee Directory'],
  [/\/settings$/, 'Settings'],
  [/\/dashboard$/, 'Dashboard'],
];

const AppNavbar: React.FC<AppNavbarProps> = ({
  isRefreshing = false,
  lastRefreshedAt,
  onOpenNavigation,
  onRefresh,
  onToggleTheme,
  theme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = pageLabels.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? 'Cloudy Logistics';

  return (
    <header className="z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-navy-100 bg-white/95 px-3 backdrop-blur-md dark:border-carbon-800 dark:bg-carbon-950/95 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          aria-label="Open workspace navigation"
          className="lg:hidden"
          icon={<Menu aria-hidden="true" className="h-5 w-5" />}
          onClick={onOpenNavigation}
          size="icon"
          variant="secondary"
        />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-navy-400 dark:text-carbon-500">
            Trip Scheduling
          </p>
          <h1 className="truncate text-sm font-bold text-navy-900 dark:text-white sm:text-base">{pageLabel}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          aria-label={isRefreshing ? 'Refreshing workspace snapshot' : 'Refresh workspace snapshot'}
          disabled={isRefreshing}
          icon={
            <RefreshCw
              aria-hidden="true"
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
            />
          }
          onClick={onRefresh}
          size="icon"
          title={
            lastRefreshedAt
              ? `Last refreshed ${new Date(lastRefreshedAt).toLocaleTimeString()}`
              : 'Refresh workspace data'
          }
          variant="ghost"
        />
        <Button
          aria-label="Return to application hub"
          icon={<Grid aria-hidden="true" className="h-4 w-4" />}
          onClick={() => navigate(routePaths.hub)}
          variant="ghost"
        >
          <span className="hidden sm:inline">Apps</span>
        </Button>
        <Button
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="lg:hidden"
          icon={
            theme === 'dark' ? (
              <Sun aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Moon aria-hidden="true" className="h-4 w-4" />
            )
          }
          onClick={onToggleTheme}
          size="icon"
          variant="ghost"
        />
      </div>
    </header>
  );
};

export default AppNavbar;
