import { useState, useMemo, useEffect } from "react";
import { Table, Tooltip, Select, Modal, message, AutoComplete } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useBinLocationItemStatistics,
  useBinLocationUdfEnums,
  useBinLocationSublevelCodes,
  useCreateBinLocation,
  type BinLocationItemStatisticsItem,
  type BinLocationItemStatisticsFilters,
  type BinLocationItemStatisticsEntry,
} from "@/entities/BinLocations/api";
import { useWarehouses } from "@/entities/Warehouses/api";
import { Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
  const [filterBinCode, setFilterBinCode] = useState("");
  const [filterZone, setFilterZone] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<BinLocationItemStatisticsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  // ── Create-bin modal ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createWarehouse, setCreateWarehouse] = useState<string | undefined>(undefined);
  const [createSublevel1, setCreateSublevel1] = useState("");
  const [createZone, setCreateZone] = useState<string | undefined>(undefined);
  const [createVolume, setCreateVolume] = useState<string | undefined>(undefined);
  const [showCreateErrors, setShowCreateErrors] = useState(false);

  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: udfEnums = [], isLoading: enumsLoading } = useBinLocationUdfEnums();
  const createMutation = useCreateBinLocation();

  // Sub-level combobox: search existing codes (debounced) while allowing a new one.
  const [sublevelSearch, setSublevelSearch] = useState("");
  useEffect(() => {
    const term = createSublevel1.trim();
    const id = setTimeout(() => setSublevelSearch(term), 300);
    return () => clearTimeout(id);
  }, [createSublevel1]);
  const { data: sublevelCodes = [], isFetching: sublevelLoading } =
    useBinLocationSublevelCodes(sublevelSearch);
  const sublevelOptions = useMemo(
    () => sublevelCodes.map((c) => ({ value: c.code, label: c.code })),
    [sublevelCodes]
  );

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: w.warehouseCode, label: w.warehouseName || w.warehouseCode })),
    [warehouses]
  );
  // Look up enums by `field` (order is not guaranteed). Submit `value`, show `description`.
  const zoneOptions = useMemo(
    () =>
      (udfEnums.find((e) => e.field === "U_Zona")?.values ?? []).map((v) => ({
        value: v.value,
        label: v.description,
      })),
    [udfEnums]
  );
  const volumeOptions = useMemo(
    () =>
      (udfEnums.find((e) => e.field === "U_MaxQuantity")?.values ?? []).map((v) => ({
        value: v.value,
        label: v.description,
      })),
    [udfEnums]
  );

  const resetCreateForm = () => {
    setCreateWarehouse(undefined);
    setCreateSublevel1("");
    setCreateZone(undefined);
    setCreateVolume(undefined);
    setShowCreateErrors(false);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const handleCreateBin = () => {
    const warehouse = createWarehouse;
    const sublevel1 = createSublevel1.trim();
    const zone = createZone;
    if (!warehouse || !sublevel1 || !zone) {
      setShowCreateErrors(true);
      return;
    }
    createMutation.mutate(
      {
        warehouse,
        sublevel1,
        zone,
        ...(createVolume ? { maxQuantity: createVolume } : {}),
      },
      {
        onSuccess: (created) => {
          message.success(t("binCreate.success", { binCode: created.binCode }));
          handleCloseCreate();
        },
        onError: (err) => {
          const axiosErr = err as {
            response?: { status?: number; data?: { errors?: { code?: string; Code?: string } } };
          };
          const status = axiosErr.response?.status;
          const code =
            axiosErr.response?.data?.errors?.code ?? axiosErr.response?.data?.errors?.Code;
          const map: Record<string, string> = {
            "BinLocation.MissingRequiredFields": t("binCreate.errorMissingFields"),
            "BinLocation.InvalidZone": t("binCreate.errorInvalidZone"),
            "BinLocation.InvalidVolume": t("binCreate.errorInvalidVolume"),
          };
          if (status === 400 && code && map[code]) message.error(map[code]);
          else if (status === 400 && code) message.error(code);
          else if (status === 500) {
            // The global axios interceptor already toasts SAP messages that
            // contain a space; only fall back here when there's no code.
            if (!code) message.error(t("error.somethingWentWrong"));
          } else {
            message.error(t("error.somethingWentWrong"));
          }
        },
      }
    );
  };

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
      BinCode: filterBinCode.trim() || undefined,
      Zone: filterZone,
    });
  };

  const handleClearFilters = () => {
    setFilterItemCode("");
    setFilterItemDesc("");
    setFilterWarehouseCode("");
    setFilterBinCode("");
    setFilterZone(undefined);
    setAppliedFilters({});
    setPageIndex(0);
  };

  const binItemColumns: ColumnsType<BinLocationItemStatisticsEntry> = [
    { title: t("inventoryCountings.itemCode"), dataIndex: "itemCode", key: "itemCode", width: 120 },
    { title: t("common.smartupCode"), dataIndex: "smartupCode", key: "smartupCode", width: 120, render: (v: string | null) => v ?? "—" },
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

      <div className="flex items-end justify-end gap-3">
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9">
          <Plus className="w-4 h-4" />
          {t("common_create")}
        </Button>
      </div>

      <Modal
        title={t("binCreate.title")}
        open={isCreateOpen}
        onCancel={handleCloseCreate}
        footer={null}
        width={440}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("binCreate.warehouse")}</Label>
            <Select
              showSearch
              placeholder={t("binCreate.selectWarehouse")}
              value={createWarehouse}
              onChange={(val) => setCreateWarehouse(val)}
              loading={warehousesLoading}
              status={showCreateErrors && !createWarehouse ? "error" : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={warehouseOptions}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("binCreate.sublevel1")}</Label>
            <AutoComplete
              value={createSublevel1}
              onChange={(val) => setCreateSublevel1(val ?? "")}
              options={sublevelOptions}
              // Server already filters by `search`; don't re-filter client-side.
              filterOption={false}
              allowClear
              placeholder={t("binCreate.sublevel1Placeholder")}
              status={showCreateErrors && !createSublevel1.trim() ? "error" : undefined}
              notFoundContent={sublevelLoading ? t("common_loading") : null}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("binCreate.zone")}</Label>
            <Select
              placeholder={t("binCreate.selectZone")}
              value={createZone}
              onChange={(val) => setCreateZone(val)}
              loading={enumsLoading}
              status={showCreateErrors && !createZone ? "error" : undefined}
              options={zoneOptions}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("binCreate.volume")}</Label>
            <Select
              allowClear
              placeholder={t("binCreate.selectVolume")}
              value={createVolume}
              onChange={(val) => setCreateVolume(val)}
              loading={enumsLoading}
              options={volumeOptions}
              className="w-full [&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="h-9" onClick={handleCloseCreate}>
              {t("common_cancel")}
            </Button>
            <Button
              className="h-9 gap-2"
              disabled={createMutation.isLoading}
              onClick={handleCreateBin}
            >
              {createMutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("common_create")}
            </Button>
          </div>
        </div>
      </Modal>

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
            <Label className="text-xs">{t("cells_filter_bin_code")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterBinCode}
              onChange={(e) => setFilterBinCode(e.target.value)}
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
