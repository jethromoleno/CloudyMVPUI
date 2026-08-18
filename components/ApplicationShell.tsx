import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SystemUser, Theme } from '../types';
import AppNavbar from './AppNavbar';
import DevelopmentDataNotice from './DevelopmentDataNotice';
import Sidebar from './Sidebar';

interface ApplicationShellProps {
  children: React.ReactNode;
  isRefreshing?: boolean;
  lastRefreshedAt?: string | null;
  onLogout: () => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  theme: Theme;
  user: SystemUser;
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ApplicationShell: React.FC<ApplicationShellProps> = ({
  children,
  isRefreshing,
  lastRefreshedAt,
  onLogout,
  onRefresh,
  onToggleTheme,
  theme,
  user,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!drawerOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const first = drawer?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawer) return;
      const focusable = Array.from(drawer.querySelectorAll(focusableSelector)) as HTMLElement[];
      if (focusable.length === 0) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden bg-navy-50 transition-colors duration-300 dark:bg-carbon-950">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar
          collapsed={collapsed}
          onLogout={onLogout}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onToggleTheme={onToggleTheme}
          theme={theme}
          username={user.username}
          userRole={user.role}
        />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close workspace navigation"
            className="absolute inset-0 bg-navy-950/55 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            aria-label="Workspace navigation drawer"
            aria-modal="true"
            className="relative h-full w-[min(19rem,88vw)] shadow-2xl"
            ref={drawerRef}
            role="dialog"
          >
            <Sidebar
              drawer
              onLogout={onLogout}
              onNavigate={() => setDrawerOpen(false)}
              onToggleTheme={onToggleTheme}
              theme={theme}
              username={user.username}
              userRole={user.role}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppNavbar
          isRefreshing={isRefreshing}
          lastRefreshedAt={lastRefreshedAt}
          onOpenNavigation={() => setDrawerOpen(true)}
          onRefresh={onRefresh}
          onToggleTheme={onToggleTheme}
          theme={theme}
        />
        <DevelopmentDataNotice />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ApplicationShell;
