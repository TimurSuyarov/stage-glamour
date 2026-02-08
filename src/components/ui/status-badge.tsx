import { cn } from '@/lib/utils';
import { LucideIcon, Check, AlertCircle, Clock, X, Package, FileCheck, Truck, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderStatus } from '@/types/wms';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<string, { variant: StatusBadgeProps['variant']; icon: LucideIcon; labelKey: string }> = {
  created: { variant: 'neutral', icon: FileText, labelKey: 'status.created' },
  validated: { variant: 'info', icon: FileCheck, labelKey: 'status.validated' },
  collected: { variant: 'warning', icon: Package, labelKey: 'status.collected' },
  shipped: { variant: 'success', icon: Truck, labelKey: 'status.shipped' },
  approved: { variant: 'success', icon: Check, labelKey: 'status.approved' },
  rejected: { variant: 'error', icon: X, labelKey: 'status.rejected' },
  inProgress: { variant: 'warning', icon: Clock, labelKey: 'status.inProgress' },
  in_progress: { variant: 'warning', icon: Clock, labelKey: 'status.inProgress' },
  draft: { variant: 'neutral', icon: FileText, labelKey: 'status.draft' },
  pending: { variant: 'warning', icon: Clock, labelKey: 'status.pending' },
  processing: { variant: 'info', icon: Clock, labelKey: 'status.processing' },
  blocked: { variant: 'error', icon: AlertCircle, labelKey: 'status.blocked' },
  active: { variant: 'success', icon: Check, labelKey: 'status.approved' },
  completed: { variant: 'success', icon: Check, labelKey: 'status.shipped' },
  cancelled: { variant: 'error', icon: X, labelKey: 'status.rejected' },
};

export function StatusBadge({ status, variant, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const { t } = useLanguage();

  const config = statusConfig[status] || { variant: 'neutral', icon: AlertCircle, labelKey: status };
  const finalVariant = variant || config.variant;
  const Icon = config.icon;

  const variantClasses = {
    success: 'status-badge-success',
    warning: 'status-badge-warning',
    error: 'status-badge-error',
    info: 'status-badge-info',
    neutral: 'status-badge-neutral',
  };

  return (
    <span
      className={cn(
        'status-badge',
        variantClasses[finalVariant || 'neutral'],
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        className
      )}
    >
      {showIcon && <Icon className={cn('w-3 h-3', size === 'sm' && 'w-2.5 h-2.5')} />}
      <span>{t(config.labelKey)}</span>
    </span>
  );
}

interface SAPSyncIndicatorProps {
  synced: boolean;
  lastSyncAt?: string;
  className?: string;
}

export function SAPSyncIndicator({ synced, lastSyncAt, className }: SAPSyncIndicatorProps) {
  const { t } = useLanguage();

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        synced ? 'bg-status-success' : 'bg-status-warning animate-pulse-subtle'
      )} />
      <span className="text-muted-foreground">
        {synced ? t('common.syncedWithSAP') : 'Syncing...'}
      </span>
      {lastSyncAt && (
        <span className="text-muted-foreground/70">
          {new Date(lastSyncAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
