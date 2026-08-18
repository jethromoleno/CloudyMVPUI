import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  children: React.ReactNode;
  closeLabel?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  onClose: () => void;
  open: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  children,
  closeLabel = 'Close dialog',
  description,
  footer,
  initialFocusRef,
  onClose,
  open,
  size = 'md',
  title,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    lastActiveElement.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget =
      initialFocusRef?.current ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector) ?? dialogRef.current;
    window.setTimeout(() => focusTarget?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(focusableSelector)) as HTMLElement[];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      lastActiveElement.current?.focus?.();
    };
  }, [initialFocusRef, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy-950/65 p-4 backdrop-blur-sm dark:bg-black/80">
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={[
          'my-8 w-full overflow-hidden rounded-xl border border-navy-200 bg-white shadow-2xl outline-none dark:border-carbon-800 dark:bg-carbon-900',
          sizeClasses[size],
        ].join(' ')}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 bg-navy-50/80 p-5 dark:border-carbon-800 dark:bg-carbon-950">
          <div>
            <h2 id={titleId} className="text-base font-bold text-navy-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm text-navy-500 dark:text-carbon-400">
                {description}
              </div>
            )}
          </div>
          <Button
            aria-label={closeLabel}
            icon={<X aria-hidden="true" className="h-5 w-5" />}
            onClick={onClose}
            size="icon"
            variant="ghost"
          />
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="border-t border-navy-100 bg-navy-50/70 p-4 dark:border-carbon-800 dark:bg-carbon-950">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
