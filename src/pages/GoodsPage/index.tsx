import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { useTranslation } from 'react-i18next';
import { useItems, type ItemsFilters } from '@/entities/Items/api';
import { Good } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Eye,
  MoreHorizontal,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function GoodsPage() {
  const { t } = useTranslation();
  const [selectedGood, setSelectedGood] = useState<Good | null>(null);
  const [filterItemCode, setFilterItemCode] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterItemsGroupCode, setFilterItemsGroupCode] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ItemsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const filters: ItemsFilters = useMemo(
    () => ({
      ...appliedFilters,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data, isLoading } = useItems(filters);
  const goods = data?.items ?? [];
  const total = data?.total;
  const hasNextPage = total != null ? (pageIndex + 1) * PAGE_SIZE < total : goods.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const totalPages = total != null ? Math.ceil(total / PAGE_SIZE) : null;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      ItemCode: filterItemCode.trim() || undefined,
      ItemName: filterItemName.trim() || undefined,
      ItemsGroupCode: filterItemsGroupCode.trim() ? Number(filterItemsGroupCode) || filterItemsGroupCode : undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterItemCode('');
    setFilterItemName('');
    setFilterItemsGroupCode('');
    setAppliedFilters({});
    setPageIndex(0);
  };

  const columns: Column<Good>[] = [
    {
      key: 'sku',
      header: 'SKU',
      cell: (good) => (
        <span className={cn(
          "font-mono text-sm",
          !good.isActive && "text-muted-foreground"
        )}>
          {good.sku}
        </span>
      ),
    },
    {
      key: 'barcode',
      header: 'Barcode',
      cell: (good) => (
        <span className={cn(
          "font-mono text-sm",
          !good.isActive && "text-muted-foreground"
        )}>
          {good.barcode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      cell: (good) => (
        <div className={cn(!good.isActive && "opacity-50")}>
          <p className="font-medium">{good.name}</p>
          <p className="text-xs text-muted-foreground">{good.category}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (good) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedGood(good)}>
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
        title={t('nav.goods')}
        breadcrumbs={[{ label: t('nav.masterData') }, { label: t('nav.goods') }]}
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('common.create')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('common.itemCode')}</Label>
          <Input
            placeholder={t('common.search')}
            value={filterItemCode}
            onChange={(e) => setFilterItemCode(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('common.itemName')}</Label>
          <Input
            placeholder={t('common.search')}
            value={filterItemName}
            onChange={(e) => setFilterItemName(e.target.value)}
            className="h-9 w-48"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('common.itemsGroupCode')}</Label>
          <Input
            placeholder="—"
            value={filterItemsGroupCode}
            onChange={(e) => setFilterItemsGroupCode(e.target.value)}
            className="h-9 w-32"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={handleApplyFilters}>
          {t('common.apply')}
        </Button>
        <Button variant="ghost" size="sm" className="h-9" onClick={handleClearFilters}>
          {t('common.clearFilters')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={goods}
        loading={isLoading}
        showSearch
        showFilters
        showExport
        pageSize={PAGE_SIZE}
        onRowClick={(good) => setSelectedGood(good)}
      />

      {/* Server-side pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between px-4 py-2 border rounded-md bg-card">
          <p className="text-sm text-muted-foreground">
            {total != null
              ? t('common.rangeOfTotal', {
                  start: pageIndex * PAGE_SIZE + 1,
                  end: Math.min((pageIndex + 1) * PAGE_SIZE, total),
                  total,
                })
              : `${pageIndex * PAGE_SIZE + 1}–${pageIndex * PAGE_SIZE + goods.length}`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPageIndex((p) => p - 1)}
              disabled={!hasPrevPage || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {totalPages != null
                ? t('common.pageOf', { current: pageIndex + 1, total: totalPages })
                : pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={!hasNextPage || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Good Detail Dialog */}
      <Dialog open={!!selectedGood} onOpenChange={() => setSelectedGood(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGood?.name}
              {selectedGood && (
                <Badge variant={selectedGood.isActive ? "default" : "secondary"}>
                  {selectedGood.isActive ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGood && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono">{selectedGood.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-mono">{selectedGood.barcode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{selectedGood.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SAP ID</p>
                  <p className="font-mono">{selectedGood.syncInfo.sapId}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Last Synced</p>
                <p>{new Date(selectedGood.syncInfo.lastSyncAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
