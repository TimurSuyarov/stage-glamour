import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockAuditLogs } from '@/data/mockData';
import { AuditLogEntry } from '@/types/wms';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { t } = useLanguage();
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = mockAuditLogs.filter(log => {
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
    return true;
  });

  const actionTypeColors: Record<string, string> = {
    create: 'bg-status-success-bg text-status-success',
    edit: 'bg-status-info-bg text-status-info',
    status_change: 'bg-status-warning-bg text-status-warning',
    delete: 'bg-status-error-bg text-status-error',
    approve: 'bg-status-success-bg text-status-success',
    reject: 'bg-status-error-bg text-status-error',
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (log) => (
        <div className="text-sm">
          <p>{new Date(log.timestamp).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(log.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit'
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (log) => (
        <div>
          <p className="font-medium">{log.actorName}</p>
          <p className="text-xs text-muted-foreground">{log.actorId}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (log) => (
        <Badge className={cn('capitalize', actionTypeColors[log.actionType])}>
          {log.actionType.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      cell: (log) => (
        <span className="capitalize">{log.module}</span>
      ),
    },
    {
      key: 'sapId',
      header: 'SAP ID',
      cell: (log) => (
        <span className="font-mono text-sm">{log.sapId || '—'}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (log) => (
        <div className="max-w-xs">
          <p className="text-sm">{log.description}</p>
          {(log.previousValue || log.newValue) && (
            <p className="text-xs text-muted-foreground mt-1">
              {log.previousValue} → {log.newValue}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('nav.history')}
        breadcrumbs={[{ label: t('nav.operational') }, { label: t('nav.history') }]}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All History</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="admission">Admission</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="status_change">Status Change</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredLogs}
            showSearch
            showExport
            pageSize={20}
          />
        </TabsContent>

        <TabsContent value="orders">
          <DataTable
            columns={columns}
            data={mockAuditLogs.filter(l => l.module === 'order')}
            showSearch
            showExport
          />
        </TabsContent>

        <TabsContent value="returns">
          <DataTable
            columns={columns}
            data={mockAuditLogs.filter(l => l.module === 'return')}
            showSearch
            emptyMessage="No return history"
          />
        </TabsContent>

        <TabsContent value="transfers">
          <DataTable
            columns={columns}
            data={mockAuditLogs.filter(l => l.module === 'transfer')}
            showSearch
            emptyMessage="No transfer history"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
