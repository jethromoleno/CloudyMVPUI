import React, { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, ButtonVariant } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  cancelLabel?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  description: React.ReactNode;
  detail?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  description,
  detail,
  onCancel,
  onConfirm,
  open,
  title,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      description={description}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
      initialFocusRef={cancelRef}
      onClose={onCancel}
      open={open}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-red-500" />
          {title}
        </span>
      }
    >
      {children}
      {detail ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {detail}
        </div>
      ) : null}
    </Modal>
  );
};
