import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useBinLocationItemCount,
  type BinLocationItemCountFilters,
  type BinLocationItemCount,
} from "@/entities/BinLocations/api";
import { useCreateInventoryCounting } from "@/entities/InventoryCountings/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Tooltip, Select, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const PAGE_SIZE = 20;

const ZONE_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "G", label: "G" },
  { value: "D", label: "D" },
  { value: "P", label: "P" },
  { value: "N", label: "N" },
];

export default function InventoryPage() {
  const { t } = useTranslation();

  const [filterItemCode, setFilterItemCode] = useState("");
  const [filterItemDesc, setFilterItemDesc] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterZone, setFilterZone] = useState<string | undefined>(undefined);
  const [filterBinCode, setFilterBinCode] = useState("");
  const [filterBatchNumber, setFilterBatchNumber] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<BinLocationItemCountFilters>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedZoneForCreate, setSelectedZoneForCreate] = useState<string | undefined>(undefined);

  const createMutation = useCreateInventoryCounting();

  const filters: BinLocationItemCountFilters = useMemo(
    () => ({
      ...appliedFilters,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading, error } = useBinLocationItemCount(filters);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + items.length;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      ItemCode: filterItemCode.trim() || undefined,
      ItemDesc: filterItemDesc.trim() || undefined,
      Warrehouse: filterWarehouse.trim() || undefined,
      Zone: filterZone,
      BinCode: filterBinCode.trim() || undefined,
      BatchNumber: filterBatchNumber.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterItemCode("");
    setFilterItemDesc("");
    setFilterWarehouse("");
    setFilterZone(undefined);
    setFilterBinCode("");
    setFilterBatchNumber("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const columns: ColumnsType<BinLocationItemCount> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: BinLocationItemCount, index: number) =>
        pageIndex * PAGE_SIZE + index + 1,
    },
    {
      title: t("inventory.itemCode"),
      dataIndex: "itemCode",
      key: "itemCode",
      width: 120,
    },
    {
      title: t("inventory.itemDesc"),
      dataIndex: "itemDesc",
      key: "itemDesc",
      width: 230,
      ellipsis: true,
    },
    {
      title: t("admission.expiryDate"),
      dataIndex: "batchExpiryDate",
      key: "batchExpiryDate",
      width: 120,
      render: (v: string | null | undefined) =>
        v ? new Date(v).toLocaleDateString() : "—",
    },
    {
      title: t("inventory.binCode"),
      dataIndex: "binCode",
      key: "binCode",
      width: 180,
    },
    {
      title: t("inventory.batchNumber"),
      dataIndex: "batchNumber",
      key: "batchNumber",
      width: 160,
    },
    {
      title: t("inventory.onHand"),
      dataIndex: "onHand",
      key: "onHand",
      width: 140,
      align: "right",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.inventory")}
        breadcrumbs={[
          { label: t("nav.masterData") },
          { label: t("nav.inventory") },
        ]}
      />

        <div className="flex items-end justify-end gap-3 mb-6 pl-2.5">
          <div className="space-x-3">
            <Label className="">{t("inventory.selectZoneForCreate")}</Label>
            <Select
              placeholder={t("inventory.selectZoneForCreate")}
              value={selectedZoneForCreate}
              onChange={(val) => setSelectedZoneForCreate(val)}
              options={ZONE_OPTIONS}
              className="w-48 [&_.ant-select-selector]:!h-9 [&_.ant-select-selection-placeholder]:!text-xs"
            />
          </div>
          <Button
            onClick={() => {
              if (!selectedZoneForCreate) {
                message.warning(t("inventory.selectZoneFirst"));
                return;
              }
              createMutation.mutate(selectedZoneForCreate, {
                onSuccess: () => {
                  message.success(t("common.success"));
                  setSelectedZoneForCreate(undefined);
                },
                onError: () => {
                  message.error(t("error.somethingWentWrong"));
                },
              });
            }}
            disabled={!selectedZoneForCreate || createMutation.isLoading}
            className="gap-2 h-9"
          >
            {createMutation.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t("common_create")}
          </Button>
        </div>
      <ModuleCard>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.itemCode")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemCode}
              onChange={(e) => setFilterItemCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.itemDesc")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemDesc}
              onChange={(e) => setFilterItemDesc(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.warehouseCode")}</Label>
            <Input
              placeholder="—"
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.zone")}</Label>
            <Select
              allowClear
              placeholder={t("inventory.zone")}
              value={filterZone}
              onChange={(val) => setFilterZone(val)}
              options={ZONE_OPTIONS}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.binCode")}</Label>
            <Input
              placeholder="—"
              value={filterBinCode}
              onChange={(e) => setFilterBinCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventory.batchNumber")}</Label>
            <Input
              placeholder="—"
              value={filterBatchNumber}
              onChange={(e) => setFilterBatchNumber(e.target.value)}
              className="h-9"
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
            <style>{`.inventory-table-fixed-layout .ant-table { table-layout: fixed; }`}</style>
            <div className="inventory-table-fixed-layout">
              <Table
                columns={columns}
                dataSource={items}
                rowKey={(_, idx) => `${_.itemCode}-${_.binCode}-${_.batchNumber}-${idx}`}
                pagination={false}
                scroll={{ x: 1030 }}
              />
            </div>

            {(items.length > 0 || pageIndex > 0) && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 mt-0">
                <div className="text-sm text-muted-foreground">
                  {rangeStart}–{rangeEnd}
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
                    {rangeStart} – {rangeEnd}
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
}
