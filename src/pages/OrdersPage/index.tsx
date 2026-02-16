import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge, SAPSyncIndicator } from '@/components/ui/status-badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders } from '@/data/mockData';
import { Order } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Smartphone, 
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canManage = hasPermission('order', 'manage');

  const filteredOrders = statusFilter === 'all' 
    ? mockOrders 
    : mockOrders.filter(o => o.status === statusFilter);

  const columns: Column<Order>[] = [
    {
      key: 'sapOrderId',
      header: t('order.sapId'),
      cell: (order) => (
        <div className="flex flex-col">
          <span className="font-medium">{order.sapOrderId}</span>
          <SAPSyncIndicator synced={order.syncInfo.synced} className="mt-1" />
        </div>
      ),
    },
    {
      key: 'customer',
      header: t('order.customer'),
      cell: (order) => (
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.customerId}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: t('order.items'),
      cell: (order) => (
        <span className="text-sm">{order.items.length} items</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'date',
      header: t('common.date'),
      cell: (order) => (
        <div className="text-sm">
          <p>{new Date(order.createdAt).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {canManage && order.status === 'created' && (
              <DropdownMenuItem>
                <Smartphone className="w-4 h-4 mr-2" />
                {t('order.bindToTsd')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('order.title')}
        breadcrumbs={[{ label: t('nav.operational') }, { label: t('order.title') }]}
        actions={
          canManage && (
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('common.create')}
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('order.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="created">{t('status.created')}</SelectItem>
            <SelectItem value="validated">{t('status.validated')}</SelectItem>
            <SelectItem value="collected">{t('status.collected')}</SelectItem>
            <SelectItem value="shipped">{t('status.shipped')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        showSearch
        showFilters
        showExport
        onRowClick={(order) => setSelectedOrder(order)}
      />

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedOrder?.sapOrderId}
              {selectedOrder && <StatusBadge status={selectedOrder.status} />}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('order.customer')}</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.date')}</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">{t('order.items')}</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">SKU</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-right">{t('validation.sapQty')}</th>
                        <th className="px-4 py-2 text-right">{t('validation.tsdQty')}</th>
                        <th className="px-4 py-2 text-left">Cell</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-right font-medium">{item.sapQty}</td>
                          <td className="px-4 py-2 text-right">
                            {item.tsdQty !== undefined ? (
                              <span className={item.tsdQty !== item.sapQty ? 'text-status-error font-medium' : ''}>
                                {item.tsdQty}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{item.cellLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              {canManage && selectedOrder.status === 'created' && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline">{t('common.cancel')}</Button>
                  <Button className="gap-2">
                    <Smartphone className="w-4 h-4" />
                    {t('order.bindToTsd')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
