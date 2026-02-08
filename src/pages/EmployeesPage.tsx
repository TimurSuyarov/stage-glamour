import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockEmployees } from '@/data/mockData';
import { Employee } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Eye,
  MoreHorizontal,
  Edit,
  Smartphone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function EmployeesPage() {
  const { t } = useLanguage();

  const roleLabels = {
    executor: t('role.executor'),
    validator: t('role.validator'),
    returner: t('role.returner'),
  };

  const roleColors = {
    executor: 'bg-primary text-primary-foreground',
    validator: 'bg-status-info text-white',
    returner: 'bg-status-warning text-foreground',
  };

  const columns: Column<Employee>[] = [
    {
      key: 'uniqueId',
      header: t('employee.uniqueId'),
      cell: (emp) => (
        <span className="font-mono text-sm">{emp.uniqueId}</span>
      ),
    },
    {
      key: 'name',
      header: t('employee.name'),
      cell: (emp) => (
        <div className={cn(!emp.isActive && "opacity-50")}>
          <p className="font-medium">{emp.name}</p>
          {emp.assignedTsdId && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              {emp.assignedTsdId}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: t('employee.role'),
      cell: (emp) => (
        <Badge className={roleColors[emp.role]}>
          {roleLabels[emp.role]}
        </Badge>
      ),
    },
    {
      key: 'performance',
      header: t('employee.performance'),
      cell: (emp) => (
        <div className="w-32 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              emp.performanceScore >= 90 ? 'text-status-success' :
              emp.performanceScore >= 70 ? 'text-status-warning' :
              'text-status-error'
            )}>
              {emp.performanceScore}%
            </span>
          </div>
          <Progress 
            value={emp.performanceScore} 
            className={cn(
              "h-1.5",
              emp.performanceScore >= 90 ? '[&>div]:bg-status-success' :
              emp.performanceScore >= 70 ? '[&>div]:bg-status-warning' :
              '[&>div]:bg-status-error'
            )}
          />
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (emp) => (
        <Badge variant={emp.isActive ? "default" : "secondary"}>
          {emp.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (emp) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('nav.employees')}
        breadcrumbs={[{ label: t('nav.masterData') }, { label: t('nav.employees') }]}
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('common.create')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockEmployees}
        showSearch
        showFilters
      />
    </div>
  );
}
