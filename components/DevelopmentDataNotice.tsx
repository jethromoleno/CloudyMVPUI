import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from './ui';

const STORAGE_KEY = 'cloudy.dev-data-notice.dismissed';

/**
 * Single workspace-level reminder that MVP data is development-only.
 * Page-level amber strips should defer to this notice.
 */
const DevelopmentDataNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage failures; still dismiss for this session in memory.
    }
    setDismissed(true);
  };

  return (
    <div
      className="flex shrink-0 items-start gap-2 border-b border-navy-200 bg-navy-50/90 px-3 py-2 text-xs text-navy-700 dark:border-carbon-800 dark:bg-carbon-900/80 dark:text-carbon-300 sm:items-center sm:px-5"
      role="status"
    >
      <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-500 dark:text-carbon-400 sm:mt-0" />
      <p className="min-w-0 flex-1 leading-5">
        Development data only — resets on refresh and is not durable, real-time production data.
      </p>
      <Button
        aria-label="Dismiss development data notice"
        className="h-8 w-8 shrink-0"
        icon={<X aria-hidden="true" className="h-3.5 w-3.5" />}
        onClick={dismiss}
        size="icon"
        variant="ghost"
      />
    </div>
  );
};

export default DevelopmentDataNotice;
