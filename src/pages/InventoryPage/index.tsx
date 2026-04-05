import { useState, useMemo, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useBinLocationItemCount,
  type BinLocationItemCountFilters,
  type BinLocationItemCount,
} from "@/entities/BinLocations/api";
import { useCreateInventoryCounting } from "@/entities/InventoryCountings/api";
import { useEmployees } from "@/entities/Employees/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Tooltip, Select, message, Modal } from "antd";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createZone, setCreateZone] = useState<string | undefined>(undefined);
  const [createEmployeeId, setCreateEmployeeId] = useState<number | undefined>(undefined);

  const createMutation = useCreateInventoryCounting();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees({ PageSize: 200 });

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPageIndex(0);
      setAppliedFilters((prev) => ({
        ...prev,
        ItemCode: filterItemCode.trim() || undefined,
        ItemDesc: filterItemDesc.trim() || undefined,
        Warrehouse: filterWarehouse.trim() || undefined,
        BinCode: filterBinCode.trim() || undefined,
        BatchNumber: filterBatchNumber.trim() || undefined,
      }));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filterItemCode, filterItemDesc, filterWarehouse, filterBinCode, filterBatchNumber]);

  const handleZoneChange = (val: string | undefined) => {
    setFilterZone(val);
    setPageIndex(0);
    setAppliedFilters((prev) => {
      const next = { ...prev };
      if (val) next.Zone = val;
      else delete next.Zone;
      return next;
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
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            {t("common_create")}
          </Button>
        </div>

        <Modal
          title={t("common_create")}
          open={isCreateModalOpen}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateZone(undefined);
            setCreateEmployeeId(undefined);
          }}
          footer={null}
          width={420}
        >
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("inventory.zone")}</Label>
              <Select
                placeholder={t("inventory.zone")}
                value={createZone}
                onChange={(val) => setCreateZone(val)}
                options={ZONE_OPTIONS}
                className="w-full [&_.ant-select-selector]:!h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("admission.assignEmployee")}</Label>
              <Select
                showSearch
                placeholder={t("admission.selectEmployee")}
                value={createEmployeeId}
                onChange={(val) => setCreateEmployeeId(val)}
                loading={employeesLoading}
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={employees.map((e) => ({
                  value: e.employeeId ?? e.EmployeeID,
                  label: `${e.firstName} ${e.lastName}`,
                }))}
                className="w-full [&_.ant-select-selector]:!h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateZone(undefined);
                  setCreateEmployeeId(undefined);
                }}
              >
                {t("common_cancel")}
              </Button>
              <Button
                className="h-9 gap-2"
                disabled={!createZone || createMutation.isLoading}
                onClick={() => {
                  if (!createZone) return;
                  createMutation.mutate(
                    {
                      zone: createZone,
                      employeeId: createEmployeeId ?? null,
                      countDate: new Date().toISOString(),
                    },
                    {
                      onSuccess: () => {
                        message.success(t("common.success"));
                        setIsCreateModalOpen(false);
                        setCreateZone(undefined);
                        setCreateEmployeeId(undefined);
                      },
                      onError: () => {
                        message.error(t("error.somethingWentWrong"));
                      },
                    }
                  );
                }}
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
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("inventory.itemCode")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemCode}
              onChange={(e) => setFilterItemCode(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("inventory.itemDesc")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemDesc}
              onChange={(e) => setFilterItemDesc(e.target.value)}
              className="h-9 w-56"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("inventory.warehouseCode")}</Label>
            <Input
              placeholder="—"
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t("inventory.zone")}</Label>
            <Select
              allowClear
              placeholder={t("inventory.zone")}
              value={filterZone}
              onChange={handleZoneChange}
              options={ZONE_OPTIONS}
              style={{ width: 112 }}
              className="[&_.ant-select-selector]:!h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("inventory.binCode")}</Label>
            <Input
              placeholder="—"
              value={filterBinCode}
              onChange={(e) => setFilterBinCode(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("inventory.batchNumber")}</Label>
            <Input
              placeholder="—"
              value={filterBatchNumber}
              onChange={(e) => setFilterBatchNumber(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          <Tooltip title={t("common_clear_filters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-accent text-accent-foreground ml-auto"
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
