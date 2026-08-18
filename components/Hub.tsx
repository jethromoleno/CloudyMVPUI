import React from 'react';
import { Package, Map, DollarSign, Lock, Sun, Moon, LogOut } from 'lucide-react';
import { SystemUser, AppModule, Theme } from '../types';
import { navigationDestinations, usePermissions } from '../permissions';
import { Button, StatusBadge } from './ui';

interface HubProps {
  user: SystemUser;
  onSelectModule: (module: AppModule) => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const Hub: React.FC<HubProps> = ({ user, onSelectModule, onLogout, theme, onToggleTheme }) => {
  const permissions = usePermissions();
  const hasPermission = (module: AppModule) =>
    module === 'trip_scheduling' && permissions.canShowNavigation(navigationDestinations.dashboard);

  const modules = [
    {
      id: 'trip_scheduling' as AppModule,
      title: 'Trip Scheduling',
      description: 'Logistics operations, trip scheduling, fleet records, and personnel directories.',
      icon: Map,
      lightBg: 'bg-white',
      lightBorder: 'border-navy-200',
      lightIconBg: 'bg-navy-50 text-navy-700',
      lightText: 'text-navy-900',
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-700',
      darkIconBg: 'dark:bg-blue-500/10 dark:text-blue-400',
      darkText: 'dark:text-white',
      isPlaceholder: false,
    },
    {
      id: 'inventory' as AppModule,
      title: 'Inventory Management',
      description: 'Warehouse tracking, stock levels, and asset management.',
      icon: Package,
      lightBg: 'bg-white',
      lightBorder: 'border-navy-100',
      lightIconBg: 'bg-emerald-50 text-emerald-600',
      lightText: 'text-navy-900',
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-800',
      darkIconBg: 'dark:bg-emerald-500/10 dark:text-emerald-500',
      darkText: 'dark:text-white',
      isPlaceholder: true,
    },
    {
      id: 'billing' as AppModule,
      title: 'Billing System',
      description: 'Invoicing, expense tracking, and financial reporting.',
      icon: DollarSign,
      lightBg: 'bg-white',
      lightBorder: 'border-navy-100',
      lightIconBg: 'bg-amber-50 text-amber-700',
      lightText: 'text-navy-900',
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-800',
      darkIconBg: 'dark:bg-amber-500/10 dark:text-amber-400',
      darkText: 'dark:text-white',
      isPlaceholder: true,
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-navy-50 via-navy-50 to-navy-100/80 transition-colors duration-500 dark:from-carbon-950 dark:via-carbon-950 dark:to-carbon-900">
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-navy-100/80 bg-white/70 px-4 py-4 backdrop-blur-md dark:border-carbon-800 dark:bg-carbon-950/50 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 dark:bg-white">
            <div className="h-3 w-3 rounded-full bg-white dark:bg-carbon-900" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-navy-900 dark:text-white sm:text-xl">
              Cloudy Logistics
            </h1>
            <p className="truncate text-xs text-navy-500 dark:text-carbon-400">Choose a workspace module</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Button
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            icon={
              theme === 'dark' ? (
                <Sun aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Moon aria-hidden="true" className="h-4 w-4" />
              )
            }
            onClick={onToggleTheme}
            size="icon"
            variant="secondary"
          />
          <div className="mx-0.5 hidden h-6 w-px bg-navy-200 sm:block dark:bg-carbon-800" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{user.username}</p>
            <p className="text-xs text-navy-500 dark:text-carbon-300">{user.role}</p>
          </div>
          <Button
            aria-label="Sign out"
            icon={<LogOut aria-hidden="true" className="h-4 w-4" />}
            onClick={onLogout}
            size="icon"
            variant="ghost"
          />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10 sm:px-8">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-500 dark:text-carbon-400">
            Workspace hub
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-950 dark:text-white sm:text-4xl">
            Run the next dispatch decision
          </p>
          <p className="mt-3 text-sm text-navy-600 dark:text-carbon-300 sm:text-base">
            Launch Trip Scheduling to run dispatch, or review upcoming modules when they become available.
          </p>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const allowed = hasPermission(mod.id);

            return (
              <button
                key={mod.id}
                onClick={() => allowed && onSelectModule(mod.id)}
                disabled={!allowed}
                aria-describedby={mod.isPlaceholder ? `${mod.id}-coming-soon` : undefined}
                className={`
                  relative group overflow-hidden rounded-xl border text-left transition-all duration-300
                  flex h-72 flex-col justify-between p-7
                  ${
                    allowed
                      ? `${mod.lightBg} ${mod.darkBg} ${mod.lightBorder} ${mod.darkBorder} shadow-md hover:-translate-y-0.5 hover:shadow-xl`
                      : 'cursor-not-allowed border-navy-100 bg-navy-50/80 opacity-70 dark:border-carbon-800 dark:bg-carbon-950'
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${
                        allowed
                          ? `${mod.lightIconBg} ${mod.darkIconBg}`
                          : 'bg-navy-100 text-navy-400 dark:bg-carbon-800 dark:text-carbon-600'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {mod.isPlaceholder && (
                      <>
                        <StatusBadge className="shrink-0" hideCue status="COMING_SOON" />
                        <span id={`${mod.id}-coming-soon`} className="sr-only">
                          Coming Soon. This module is visible but not launchable in the MVP.
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold ${mod.lightText} ${mod.darkText}`}>{mod.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500 dark:text-carbon-400">
                    {mod.isPlaceholder ? 'Available in a future release.' : mod.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-navy-100 pt-5 dark:border-carbon-800/50">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      allowed ? 'text-navy-900 dark:text-white' : 'text-navy-500 dark:text-carbon-600'
                    }`}
                  >
                    {allowed ? 'Launch workspace' : 'Unavailable'}
                  </span>
                  {!allowed ? (
                    <Lock className="h-4 w-4 text-navy-400 dark:text-carbon-600" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 dark:bg-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-carbon-900" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Hub;
