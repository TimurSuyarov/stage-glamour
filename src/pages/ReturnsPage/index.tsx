import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders } from '@/data/mockData';
import { Order, ReturnCondition } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  RotateCcw,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReturnDraft {
  orderId: string;
  items: { 
    sku: string; 
    name: string; 
    quantity: number; 
    maxQuantity: number;
    condition: ReturnCondition | null;
  }[];
}

export default function ReturnsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [returnDraft, setReturnDraft] = useState<ReturnDraft | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [scannerBuffer, setScannerBuffer] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const canManage = hasPermission('return', 'manage');

  // Only shipped orders can have returns
  const shippedOrders = mockOrders.filter(o => o.status === 'shipped');

  const handleOrderSelect = (orderId: string) => {
    const order = shippedOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderId(orderId);
      setReturnDraft({
        orderId,
        items: order.items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: 0,
          maxQuantity: item.sapQty,
          condition: null,
        })),
      });
      setBarcodeFilter('');
      setScannerBuffer('');
    }
  };

  const updateItemQuantity = (sku: string, quantity: number) => {
    if (!returnDraft) return;
    const item = returnDraft.items.find(i => i.sku === sku);
    if (item && quantity > item.maxQuantity) {
      // Enforce max quantity rule
      return;
    }
    setReturnDraft({
      ...returnDraft,
      items: returnDraft.items.map(item =>
        item.sku === sku ? { ...item, quantity: Math.min(quantity, item.maxQuantity) } : item
      ),
    });
  };

  const updateItemCondition = (sku: string, condition: ReturnCondition) => {
    if (!returnDraft) return;
    setReturnDraft({
      ...returnDraft,
      items: returnDraft.items.map(item =>
        item.sku === sku ? { ...item, condition } : item
      ),
    });
  };

  const isValidReturn = returnDraft && returnDraft.items.some(i => i.quantity > 0 && i.condition);

  useEffect(() => {
    if (showCreateDialog && returnDraft && barcodeInputRef.current) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showCreateDialog, returnDraft]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = scannerBuffer.trim();
      setScannerBuffer('');
      setBarcodeFilter(value);
      return;
    }
    if (e.key.length === 1) {
      setScannerBuffer(prev => {
        const next = prev + e.key;
        if (prev === '') {
          // New scan started – clear visible filter immediately
          setBarcodeFilter('');
        }
        return next;
      });
    }
    if (e.key === 'Backspace') {
      setScannerBuffer(prev => prev.slice(0, -1));
    }
  };

  const handleClearBarcode = () => {
    setBarcodeFilter('');
    setScannerBuffer('');
    barcodeInputRef.current?.focus();
  };

  const handleItemsContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable], .ant-select')) {
      return;
    }
    if (showCreateDialog && returnDraft) {
      barcodeInputRef.current?.focus();
    }
  };

  const handleCreateReturn = () => {
    console.log('Creating return:', returnDraft);
    setShowCreateDialog(false);
    setReturnDraft(null);
    setSelectedOrderId('');
  };

  // Mock returns data
  const mockReturns = [
    {
      id: 'RET-001',
      originalOrderId: 'SAP-2025-001237',
      customerName: 'Fashion Cosmetics Fergana',
      status: 'pending',
      itemCount: 2,
      createdAt: '2025-02-08T10:00:00Z',
    },
  ];

  const columns: Column<typeof mockReturns[0]>[] = [
    {
      key: 'id',
      header: 'Return ID',
      cell: (row) => <span className="font-medium">{row.id}</span>,
    },
    {
      key: 'order',
      header: t('return.originalOrder'),
      cell: (row) => (
        <div>
          <p className="font-medium">{row.originalOrderId}</p>
          <p className="text-xs text-muted-foreground">{row.customerName}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: t('order.items'),
      cell: (row) => <span>{row.itemCount} items</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: t('common.date'),
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('return.title')}
        breadcrumbs={[{ label: t('nav.operational') }, { label: t('return.title') }]}
        actions={
          canManage && (
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" />
              {t('common.create')}
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={mockReturns}
        showSearch
        emptyMessage="No returns found"
      />

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[70%]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Create Return
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {showCreateDialog && returnDraft && (
              <input
                ref={barcodeInputRef}
                type="text"
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] w-px h-px opacity-0 overflow-hidden"
                onKeyDown={handleBarcodeKeyDown}
              />
            )}
            {/* Order Selection */}
            <div className="space-y-2">
              <Label>{t('return.originalOrder')}</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t('return.selectOrderPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {shippedOrders.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {t('return.noShippedOrders')}
                    </div>
                  ) : (
                    shippedOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.sapOrderId} - {order.customerName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            {returnDraft && (
              <div className="space-y-3">
                <Label>{t('return.returnItems')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={barcodeFilter}
                    readOnly
                    disabled
                    placeholder="Scan barcode to filter"
                    className="h-9 max-w-xs text-sm"
                  />
                  {barcodeFilter && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 whitespace-nowrap"
                      onClick={handleClearBarcode}
                    >
                      {t('common.clearFilters')}
                    </Button>
                  )}
                </div>
                <div
                  className="border rounded-lg divide-y"
                  onClick={handleItemsContainerClick}
                  role="presentation"
                >
                  {(barcodeFilter
                    ? returnDraft.items.filter((item) => {
                        const order = shippedOrders.find(o => o.id === returnDraft.orderId);
                        const orderItem = order?.items.find(oi => oi.sku === item.sku);
                        return orderItem?.barcode === barcodeFilter;
                      })
                    : returnDraft.items
                  ).map((item) => (
                    <div key={item.sku} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('return.maxLabel')}: {item.maxQuantity}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t('order.quantity')}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.sku, parseInt(e.target.value) || 0)}
                          />
                          {item.quantity > item.maxQuantity && (
                            <p className="text-xs text-status-error flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {t('return.maxQtyError')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t('return.condition')}</Label>
                          <Select
                            value={item.condition || ''}
                            onValueChange={(v) => updateItemCondition(item.sku, v as ReturnCondition)}
                            disabled={item.quantity === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('common.select')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="good">{t('return.conditionGood')}</SelectItem>
                              <SelectItem value="damaged">{t('return.conditionDamaged')}</SelectItem>
                              <SelectItem value="quarantine">{t('return.conditionQuarantine')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!isValidReturn && returnDraft.items.some(i => i.quantity > 0) && (
                  <p className="text-sm text-status-warning flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('return.selectConditionAllItems')}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              disabled={!isValidReturn}
              onClick={() => setShowConfirmDialog(true)}
            >
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={t('dialog.confirmReturnTitle')}
        description={t('dialog.confirmReturnDescription')}
        variant="warning"
        onConfirm={handleCreateReturn}
      />
    </div>
  );
}
