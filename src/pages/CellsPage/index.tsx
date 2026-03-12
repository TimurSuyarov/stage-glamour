import { useState, useMemo } from "react";
import { Table, Tooltip, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useBinLocationItemStatistics,
  type BinLocationItemStatisticsItem,
  type BinLocationItemStatisticsFilters,
  type BinLocationItemStatisticsEntry,
} from "@/entities/BinLocations/api";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ZONE_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "D", label: "D" },
  { value: "G", label: "G" },
  { value: "N", label: "N" },
  { value: "P", label: "P" },
  { value: "Other", label: "Other" },
];

const pageSize = 20;

const CellsPage = () => {
  const { t } = useTranslation();

  const [filterItemCode, setFilterItemCode] = useState("");
  const [filterItemDesc, setFilterItemDesc] = useState("");
  const [filterWarehouseCode, setFilterWarehouseCode] = useState("");
  const [filterZone, setFilterZone] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<BinLocationItemStatisticsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const filters: BinLocationItemStatisticsFilters = useMemo(
    () => ({
      ...appliedFilters,
      Zone: appliedFilters.Zone,
      PageSize: pageSize,
      Skip: pageIndex * pageSize,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading, error } = useBinLocationItemStatistics(filters);
  const hasNextPage = items.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = pageIndex * pageSize + items.length;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      ItemCode: filterItemCode.trim() || undefined,
      ItemDesc: filterItemDesc.trim() || undefined,
      WarehouseCode: filterWarehouseCode.trim() || undefined,
      Zone: filterZone,
    });
  };

  const handleClearFilters = () => {
    setFilterItemCode("");
    setFilterItemDesc("");
    setFilterWarehouseCode("");
    setFilterZone(undefined);
    setAppliedFilters({});
    setPageIndex(0);
  };

  const binItemColumns: ColumnsType<BinLocationItemStatisticsEntry> = [
    { title: t("inventoryCountings.itemCode"), dataIndex: "itemCode", key: "itemCode", width: 120 },
    { title: t("inventoryCountings.itemDescription"), dataIndex: "itemName", key: "itemName", ellipsis: true },
    { title: t("returns.batchNumber"), dataIndex: "batchNumber", key: "batchNumber", width: 140 },
    {
      title: t("admission.expiryDate"),
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 120,
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      title: t("common.quantity"),
      dataIndex: "onHandQuantity",
      key: "onHandQuantity",
      width: 100,
      align: "right" as const,
    },
  ];

  const columns: ColumnsType<BinLocationItemStatisticsItem> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: unknown, __: BinLocationItemStatisticsItem, index: number) =>
        pageIndex * pageSize + index + 1,
    },
    { title: t("cells_bin_code"), dataIndex: "binCode", key: "binCode", width: 120 },
    { title: t("cells_abs_entry"), dataIndex: "binAbsEntry", key: "binAbsEntry", width: 100 },
    { title: t("cells_warehouse"), dataIndex: "warehouseCode", key: "warehouseCode", width: 100 },
    {
      title: t("cells_filter_zone"),
      dataIndex: "zone",
      key: "zone",
      width: 80,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: t("purchaseDelivery.warehouseName"),
      dataIndex: "warehouseName",
      key: "warehouseName",
      width: 180,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: t("common.quantity"),
      key: "binItemsCount",
      width: 100,
      align: "right" as const,
      render: (_: unknown, record: BinLocationItemStatisticsItem) =>
        record.binItems?.length ?? 0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.cells")}
        breadcrumbs={[{ label: t("nav.masterData") }, { label: t("nav.cells") }]}
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("common.itemCode")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemCode}
              onChange={(e) => setFilterItemCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.itemDescription")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemDesc}
              onChange={(e) => setFilterItemDesc(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("purchaseDelivery.warehouseCode")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterWarehouseCode}
              onChange={(e) => setFilterWarehouseCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("cells_filter_zone")}</Label>
            <Select
              allowClear
              placeholder={t("cells_filter_zone")}
              value={filterZone}
              onChange={(val) => setFilterZone(val)}
              options={ZONE_OPTIONS}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <Button onClick={handleApplyFilters} className="h-9">
            {t("common_apply")}
          </Button>
          <Tooltip title={t("common_clear_filters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-accent text-accent-foreground"
              aria-label={t("common_clear_filters")}
            >
              <ClearOutlined className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t("common_loading")}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={items}
              rowKey={(row) => `${row.binAbsEntry}-${row.binCode}`}
              pagination={false}
              scroll={{ x: "max-content" }}
              expandable={{
                expandedRowRender: (record) => (
                  <Table
                    size="small"
                    columns={binItemColumns}
                    dataSource={record.binItems ?? []}
                    rowKey={(_, i) => `${record.binAbsEntry}-${i}`}
                    pagination={false}
                  />
                ),
              }}
            />

            {/* Custom Pagination */}
            {(items.length > 0 || pageIndex > 0) && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 mt-0">
                <div className="text-sm text-muted-foreground">
                  {t("cells_showing_range", {
                    start: rangeStart,
                    end: rangeEnd,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => p - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium">
                    {hasPrevPage && "< "}
                    {rangeStart} - {rangeEnd}
                    {hasNextPage && " >"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => p + 1)}
                    disabled={!hasNextPage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ModuleCard>
    </div>
  );
};

export default CellsPage;
