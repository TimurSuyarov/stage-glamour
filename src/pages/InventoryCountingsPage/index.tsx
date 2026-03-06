import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useInventoryCountings,
  useInventoryCountingById,
  exportInventoryCountingPdf,
  useAssignInventoryCounting,
  useFinalizeInventoryCounting,
  type InventoryCountingsFilters,
  type InventoryCountingItem,
  type InventoryCountingLine,
} from "@/entities/InventoryCountings/api";
import { useEmployees } from "@/entities/Employees/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, Modal, message, Tooltip, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Loader2, ChevronLeft, ChevronRight, FileDown } from "lucide-react";

const PAGE_SIZE = 20;

const INVENTORY_COUNTING_STATUS: Record<number, string> = {
  1: "status.draft",
  2: "status.inProgress",
  3: "status.completed",
};

function getEmployeeId(emp: { employeeId?: number; EmployeeID?: number }): number {
  return emp.employeeId ?? emp.EmployeeID ?? 0;
}

function getEmployeeName(emp: { firstName?: string; lastName?: string }): string {
  return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "—";
}

export default function InventoryCountingsPage() {
  const { t } = useTranslation();

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<InventoryCountingItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [showSystemQty, setShowSystemQty] = useState(true);
  const [lineQuantities, setLineQuantities] = useState<Record<number, number>>({});

  const { data: detail, isLoading: detailLoading } = useInventoryCountingById(selectedDoc?.id ?? null);
  const finalizeMutation = useFinalizeInventoryCounting();

  useEffect(() => {
    if (detail?.lines) {
      const initial: Record<number, number> = {};
      detail.lines.forEach((line) => {
        initial[line.id] = line.actualQuantity ?? 0;
      });
      setLineQuantities(initial);
    } else {
      setLineQuantities({});
    }
  }, [detail?.lines]);
  const { data: employees = [] } = useEmployees({ PageSize: 500 });
  const assignMutation = useAssignInventoryCounting();

  const handleOpenModal = (doc: InventoryCountingItem | null) => {
    setSelectedDoc(doc);
    setSelectedEmployeeId(null);
    setShowSystemQty(true);
    setLineQuantities({});
  };

  const handleFinalize = () => {
    if (!detail?.id || !detail.lines?.length) return;
    const quantityRequests = detail.lines.map((line) => ({
      lineId: line.id,
      quantity: lineQuantities[line.id] ?? 0,
    }));
    finalizeMutation.mutate(
      { id: detail.id, quantityRequests },
      {
        onSuccess: () => {
          message.success(t("common.success"));
          handleOpenModal(null);
        },
        onError: () => {
          message.error(t("error.somethingWentWrong"));
        },
      }
    );
  };

  const handleAssign = () => {
    if (!detail?.id || selectedEmployeeId == null) {
      message.warning(t("inventoryCountings.selectUserFirst"));
      return;
    }
    assignMutation.mutate(
      { itemId: detail.id, userId: selectedEmployeeId },
      {
        onSuccess: () => {
          message.success(t("common.success"));
          setSelectedEmployeeId(null);
        },
        onError: () => {
          message.error(t("error.somethingWentWrong"));
        },
      }
    );
  };

  const handleDownloadPdf = async (id: number) => {
    setDownloadingId(id);
    try {
      await exportInventoryCountingPdf(id);
      message.success(t("common.success"));
    } catch {
      message.error(t("error.somethingWentWrong"));
    } finally {
      setDownloadingId(null);
    }
  };

  const filters: InventoryCountingsFilters = useMemo(
    () => ({
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [pageIndex]
  );

  const { data: items = [], isLoading, error } = useInventoryCountings(filters);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + items.length;

  const mainColumns: ColumnsType<InventoryCountingItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (val: number) => t(INVENTORY_COUNTING_STATUS[val] ?? String(val)),
    },
    {
      title: t("picklist_assignee"),
      dataIndex: "assigneeName",
      key: "assigneeName",
      width: 180,
      render: (val: string | null) => val ?? "—",
    },
    {
      title: t("common.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      title: t("inventoryCountings.document"),
      key: "document",
      width: 100,
      align: "center",
      render: (_: unknown, record: InventoryCountingItem) => (
        <Tooltip title={t("inventoryCountings.downloadPdf")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => handleDownloadPdf(record.id)}
            disabled={downloadingId === record.id}
          >
            {downloadingId === record.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {t("inventoryCountings.document")}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: t("common_actions"),
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_: unknown, record: InventoryCountingItem) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => handleOpenModal(record)}
        >
          <Eye className="w-4 h-4" />
          {t("common_view")}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.inventoryCountings")}
        breadcrumbs={[
          { label: t("nav.masterData") },
          { label: t("nav.inventoryCountings") },
        ]}
      />

      <ModuleCard>
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
              columns={mainColumns}
              dataSource={items}
              rowKey="id"
              pagination={false}
              scroll={{ x: "max-content" }}
            />

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

      <Modal
        title={`${t("inventoryCountings.detail")} — #${selectedDoc?.id ?? ""}`}
        open={selectedDoc != null}
        onCancel={() => handleOpenModal(null)}
        footer={null}
        width="100%"
        style={{ maxWidth: "min(900px, calc(100vw - 40px))" }}
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleDownloadPdf(detail.id)}
                disabled={downloadingId === detail.id}
              >
                {downloadingId === detail.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {t("inventoryCountings.downloadPdf")}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("common.name")}</p>
                <p className="font-medium">{detail.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("common.status")}</p>
                <p className="font-medium">{t(INVENTORY_COUNTING_STATUS[detail.status] ?? String(detail.status))}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">{t("picklist_assignee")}</p>
                {detail.assigneeName ? (
                  <p className="font-medium">{detail.assigneeName}</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      showSearch
                      placeholder={t("inventoryCountings.selectUser")}
                      value={selectedEmployeeId ?? undefined}
                      onChange={(val) => setSelectedEmployeeId(val ?? null)}
                      options={employees.map((emp) => ({
                        value: getEmployeeId(emp),
                        label: getEmployeeName(emp),
                      }))}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                      }
                      optionFilterProp="label"
                      className="w-[280px] [&_.ant-select-selector]:!h-9"
                      notFoundContent={t("common.noResults")}
                    />
                    <Button
                      size="sm"
                      onClick={handleAssign}
                      disabled={selectedEmployeeId == null || assignMutation.isLoading}
                    >
                      {assignMutation.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("inventoryCountings.assign")
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("common.createdAt")}</p>
                <p className="font-medium">{new Date(detail.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {detail.lines && detail.lines.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    id="show-system-qty"
                    checked={showSystemQty}
                    onCheckedChange={setShowSystemQty}
                  />
                  <Label htmlFor="show-system-qty" className="text-sm font-normal cursor-pointer">
                    {t("inventoryCountings.showSystemQty")}
                  </Label>
                </div>
                <Table
                  columns={[
                    { title: "#", key: "idx", width: 50, align: "center", render: (_: unknown, __: InventoryCountingLine, idx: number) => idx + 1 },
                    { title: t("inventoryCountings.itemCode"), dataIndex: "itemCode", key: "itemCode", width: 120 },
                    { title: t("inventoryCountings.itemDescription"), dataIndex: "productName", key: "productName" },
                    { title: t("inventoryCountings.warehouseCode"), dataIndex: "warehouseCode", key: "warehouseCode", width: 100 },
                    { title: t("inventoryCountings.binLocation"), dataIndex: "binCode", key: "binCode", width: 180 },
                    ...(showSystemQty ? [{ title: t("inventoryCountings.currentQty"), dataIndex: "currentQuantity", key: "currentQuantity", width: 110, align: "right" as const }] : []),
                    {
                      title: t("inventoryCountings.actualQty"),
                      key: "actualQuantity",
                      width: 120,
                      align: "right",
                      render: (_: unknown, record: InventoryCountingLine) => (
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-20 text-right"
                          value={lineQuantities[record.id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = val === "" ? 0 : parseFloat(val);
                            setLineQuantities((prev) => ({
                              ...prev,
                              [record.id]: isNaN(num) ? 0 : num,
                            }));
                          }}
                        />
                      ),
                    },
                  ]}
                dataSource={detail.lines}
                rowKey="id"
                pagination={false}
                scroll={{ x: "max-content" }}
                size="small"
              />
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleFinalize}
                    disabled={!detail.assigneeName || finalizeMutation.isLoading}
                    className="gap-2"
                  >
                    {finalizeMutation.isLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {t("inventoryCountings.finalize")}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
