import React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Grid,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Settings,
  Tags,
  Sun,
  Truck,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigationDestinations, type NavigationDestination, usePermissions } from '../permissions';
import { routePaths } from '../routes';
import type { Theme } from '../types';
import { Button } from './ui';

interface SidebarProps {
  collapsed?: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  onToggleCollapsed?: () => void;
  onToggleTheme: () => void;
  theme: Theme;
  username: string;
  userRole: string;
}

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  destination: NavigationDestination;
};

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: routePaths.dashboard,
    destination: navigationDestinations.dashboard,
  },
  {
    id: 'trip-operations',
    label: 'Trip Operations',
    icon: ClipboardList,
    to: routePaths.trips,
    destination: navigationDestinations.tripOperations,
  },
  {
    id: 'trip-schedule',
    label: 'Trip Schedule',
    icon: CalendarDays,
    to: `${routePaths.trips}?view=schedule`,
    destination: navigationDestinations.tripSchedule,
  },
  {
    id: 'trip-create',
    label: 'Create Trip',
    icon: Plus,
    to: routePaths.tripCreate,
    destination: navigationDestinations.tripCreate,
  },
  {
    id: 'trucks',
    label: 'Truck Management',
    icon: Truck,
    to: routePaths.trucks,
    destination: navigationDestinations.trucks,
  },
  {
    id: 'employees',
    label: 'Employee Directory',
    icon: Users,
    to: routePaths.employees,
    destination: navigationDestinations.employees,
  },
  {
    id: 'reference-data',
    label: 'Reference Data',
    icon: Tags,
    to: routePaths.referenceData,
    destination: navigationDestinations.referenceData,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    to: routePaths.settings,
    destination: navigationDestinations.settings,
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  drawer = false,
  onNavigate,
  onLogout,
  onToggleCollapsed,
  onToggleTheme,
  theme,
  username,
  userRole,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const compact = collapsed && !drawer;

  const isItemActive = (item: NavigationItem) => {
    if (item.id === 'trip-schedule') {
      return location.pathname === routePaths.trips && new URLSearchParams(location.search).get('view') === 'schedule';
    }
    if (item.id === 'trip-operations') {
      return location.pathname === routePaths.trips && new URLSearchParams(location.search).get('view') !== 'schedule';
    }
    if (item.id === 'trip-create') return location.pathname === routePaths.tripCreate;
    return location.pathname === item.to;
  };

  const visibleItems = navigationItems.filter((item) => permissions.canShowNavigation(item.destination));

  const navigateTo = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <aside
      aria-label="Trip Scheduling workspace navigation"
      className={`flex h-full flex-col border-r border-navy-100 bg-white text-navy-600 transition-[width] duration-200 dark:border-carbon-800 dark:bg-carbon-950 dark:text-carbon-300 ${compact ? 'w-20' : 'w-64'}`}
    >
      <div className="flex min-h-20 items-center gap-3 border-b border-navy-100 px-4 dark:border-carbon-800">
        <button
          aria-label="Return to application hub"
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left hover:bg-navy-50 dark:hover:bg-carbon-900 ${compact ? 'justify-center' : ''}`}
          onClick={() => navigateTo(routePaths.hub)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white dark:bg-white dark:text-carbon-950">
            <Grid aria-hidden="true" className="h-4 w-4" />
          </span>
          {!compact && (
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-navy-400 dark:text-carbon-500">
                Workspace
              </span>
              <span className="block truncate text-sm font-bold text-navy-900 dark:text-white">Cloudy Logistics</span>
            </span>
          )}
        </button>
        {!drawer && onToggleCollapsed && (
          <Button
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="hidden lg:inline-flex"
            icon={
              collapsed ? (
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              ) : (
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              )
            }
            onClick={onToggleCollapsed}
            size="icon"
            variant="ghost"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!compact && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-400 dark:text-carbon-500">
            Trip Scheduling
          </p>
        )}
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center rounded-lg px-3 text-sm transition-colors ${compact ? 'justify-center' : 'gap-3'} ${
                  active
                    ? 'bg-navy-900 font-semibold text-white dark:bg-carbon-800'
                    : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900 dark:text-carbon-400 dark:hover:bg-carbon-900 dark:hover:text-white'
                }`}
                key={item.id}
                onClick={() => navigateTo(item.to)}
                title={compact ? item.label : undefined}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                {compact ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-2 border-t border-navy-100 p-3 dark:border-carbon-800">
        <div className={`flex items-center rounded-lg px-2 py-2 ${compact ? 'justify-center' : 'gap-3'}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-200 bg-navy-100 text-xs font-bold text-navy-700 dark:border-carbon-700 dark:bg-carbon-800 dark:text-white">
            {username.charAt(0).toUpperCase()}
          </span>
          {!compact && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">{username}</span>
              <span className="block text-xs text-navy-500 dark:text-carbon-500">{userRole}</span>
            </span>
          )}
        </div>
        <Button
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className={`w-full ${compact ? 'justify-center' : 'justify-start'}`}
          icon={
            theme === 'dark' ? (
              <Sun aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Moon aria-hidden="true" className="h-5 w-5" />
            )
          }
          onClick={onToggleTheme}
          variant="ghost"
        >
          {compact ? <span className="sr-only">Toggle theme</span> : theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </Button>
        <Button
          aria-label="Sign out"
          className={`w-full text-navy-500 hover:bg-red-50 hover:text-red-600 dark:text-carbon-400 dark:hover:bg-red-900/10 dark:hover:text-red-400 ${compact ? 'justify-center' : 'justify-start'}`}
          icon={<LogOut aria-hidden="true" className="h-5 w-5" />}
          onClick={onLogout}
          variant="ghost"
        >
          {compact ? <span className="sr-only">Sign out</span> : 'Sign out'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
