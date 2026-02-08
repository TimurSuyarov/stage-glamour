import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockGoods } from '@/data/mockData';
import { Good } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Eye,
  MoreHorizontal,
  Edit,
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

export default function GoodsPage() {
  const { t } = useLanguage();
  const [selectedGood, setSelectedGood] = useState<Good | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const filteredGoods = showInactive 
    ? mockGoods 
    : mockGoods.filter(g => g.isActive);

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
      key: 'status',
      header: t('common.status'),
      cell: (good) => (
        <Badge variant={good.isActive ? "default" : "secondary"}>
          {good.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'sync',
      header: 'SAP',
      cell: (good) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            good.syncInfo.synced ? "bg-status-success" : "bg-status-warning"
          )} />
          <span className="text-xs text-muted-foreground font-mono">
            {good.syncInfo.sapId}
          </span>
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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <label htmlFor="show-inactive" className="text-sm text-muted-foreground">
            Show inactive items
          </label>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredGoods}
        showSearch
        showFilters
        showExport
        onRowClick={(good) => setSelectedGood(good)}
      />

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
