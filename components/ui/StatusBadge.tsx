import React from 'react';
import { AlertTriangle, CheckCircle2, Circle, Info, ShieldAlert, XCircle } from 'lucide-react';
import { getStatusToken, statusToneClasses, StatusTone } from '../../design/statusTokens';

export interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  className?: string;
  hideCue?: boolean;
}

const toneIcons: Record<StatusTone, typeof Circle> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  neutral: Circle,
  permission: ShieldAlert,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ className = '', hideCue = false, label, status }) => {
  const token = getStatusToken(status ?? label);
  const Icon = toneIcons[token.tone];

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        statusToneClasses[token.tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={token.description}
      aria-label={`${label ?? token.label}: ${token.cue}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label ?? token.label}</span>
      {!hideCue && <span className="text-[10px] opacity-75">({token.cue})</span>}
    </span>
  );
};
