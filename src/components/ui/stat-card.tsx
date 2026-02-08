import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({ title, value, change, icon: Icon, iconColor, className }: StatCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive && <TrendingUp className="w-4 h-4 text-status-success" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-status-error" />}
          <span
            className={cn(
              'text-xs font-medium',
              isPositive && 'text-status-success',
              isNegative && 'text-status-error',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive && '+'}
            {change.value}%
          </span>
          <span className="text-xs text-muted-foreground">{change.label}</span>
        </div>
      )}
    </div>
  );
}

interface ModuleCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ModuleCard({ title, description, actions, children, className, noPadding }: ModuleCardProps) {
  return (
    <div className={cn('module-card', className)}>
      {(title || actions) && (
        <div className="module-card-header flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-foreground">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'module-card-body')}>{children}</div>
    </div>
  );
}
