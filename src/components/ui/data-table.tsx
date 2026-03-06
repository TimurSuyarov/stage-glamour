import { ReactNode, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  onRefresh?: () => void;
  pageSize?: number;
  className?: string;
  headerContent?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row: any) => row.id,
  onRowClick,
  emptyMessage,
  showSearch = true,
  showFilters = false,
  showExport = false,
  onRefresh,
  pageSize = 10,
  className,
  headerContent,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? data.map(getRowId) : []);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(
        checked
          ? [...selectedRows, rowId]
          : selectedRows.filter((id) => id !== rowId)
      );
    }
  };

  return (
    <div className={cn('module-card', className)}>
      {/* Toolbar */}
      {(showSearch || showFilters || showExport || onRefresh || headerContent) && (
        <div className="filter-bar">
          {headerContent ? (
            headerContent
          ) : (
            <>
              {showSearch && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {showFilters && (
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.filter')}
                  </Button>
                )}

                {showExport && (
                  <Button variant="outline" size="sm" className="h-9">
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.export')}
                  </Button>
                )}

                {onRefresh && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        (el as any).indeterminate = isSomeSelected;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn('text-xs font-semibold uppercase tracking-wider', column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('common.loading')}
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage || t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.includes(rowId);

                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected && 'bg-table-row-selected',
                      onRowClick && 'hover:bg-table-row-hover'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectRow(rowId, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {t('common.rangeOfTotal', {
              start: startIndex + 1,
              end: Math.min(endIndex, data.length),
              total: data.length,
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm">
              {t('common.pageOf', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
