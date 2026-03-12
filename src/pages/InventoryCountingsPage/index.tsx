import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useInventoryCountings,
  usePatchInventoryCounting,
  exportInventoryCountingPdf,
  type InventoryCountingsFilters,
  type InventoryCountingItem,
  type InventoryCountingLine,
} from "@/entities/InventoryCountings/api";
import { useEmployees } from "@/entities/Employees/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Modal, message, Tooltip, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Loader2, ChevronLeft, ChevronRight, FileDown, Save, UserMinus } from "lucide-react";

const PAGE_SIZE = 20;

export default function InventoryCountingsPage() {
  const { t } = useTranslation();

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<InventoryCountingItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [lineQuantities, setLineQuantities] = useState<Record<number, number>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null | undefined>(undefined);

  const patchMutation = usePatchInventoryCounting();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees({ PageSize: 500 });

  useEffect(() => {
    setLineQuantities({});
    setSelectedEmployeeId(undefined);
  }, [selectedDoc]);

  const handleOpenModal = (doc: InventoryCountingItem | null) => {
    setSelectedDoc(doc);
    setLineQuantities({});
    setSelectedEmployeeId(undefined);
  };

  const handleSave = () => {
    if (!selectedDoc) return;
    // Only send lines where user actually typed a value
    const inventoryCountingLines = Object.entries(lineQuantities).map(([lineNum, countedQuantity]) => ({
      lineNumber: Number(lineNum),
      countedQuantity,
    }));

    // Always send U_EmployeeId: if changed use new value, otherwise use existing
    const U_EmployeeId = selectedEmployeeId !== undefined
      ? selectedEmployeeId
      : (selectedDoc.employeeId ?? null);

    patchMutation.mutate(
      { docEntry: selectedDoc.docEntry, body: { U_EmployeeId, inventoryCountingLines } },
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

  const handleDownloadPdf = async (docEntry: number) => {
    setDownloadingId(docEntry);
    try {
      await exportInventoryCountingPdf(docEntry);
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
      dataIndex: "docEntry",
      key: "docEntry",
      width: 80,
    },
    {
      title: t("inventoryCountings.docNum"),
      dataIndex: "docNum",
      key: "docNum",
      width: 120,
    },
    {
      title: t("inventoryCountings.countDate"),
      dataIndex: "countDate",
      key: "countDate",
      width: 160,
      render: (val: string) => val ?? "—",
    },
    {
      title: t("admission.assignEmployee"),
      dataIndex: "employeeFullName",
      key: "employeeFullName",
      width: 200,
      render: (val: string | null) => val ?? "—",
    },
    // {
    //   title: t("inventoryCountings.remarks"),
    //   dataIndex: "remarks",
    //   key: "remarks",
    //   render: (val: string | null) => val ?? "—",
    // },
    {
      title: t("common.status"),
      key: "documentStatusName",
      width: 100,
      render: (_: unknown, record: InventoryCountingItem) => {
        const isOpen = record.documentStatusName?.toLowerCase() === "open";
        return (
          <span className={isOpen ? "text-green-600 font-medium" : "text-muted-foreground"}>
            {record.documentStatusName ?? "—"}
          </span>
        );
      },
    },
    {
      title: t("inventoryCountings.linesCount"),
      key: "linesCount",
      width: 100,
      align: "center",
      render: (_: unknown, record: InventoryCountingItem) =>
        record.inventoryCountingLines?.length ?? 0,
    },
    {
      title: t("inventoryCountings.document"),
      key: "document",
      width: 110,
      align: "center",
      render: (_: unknown, record: InventoryCountingItem) => (
        <Tooltip title={t("inventoryCountings.downloadPdf")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => handleDownloadPdf(record.docEntry)}
            disabled={downloadingId === record.docEntry}
          >
            {downloadingId === record.docEntry ? (
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

  const lineColumns: ColumnsType<InventoryCountingLine> = [
    {
      title: "#",
      key: "idx",
      width: 50,
      align: "center",
      render: (_: unknown, __: InventoryCountingLine, idx: number) => idx + 1,
    },
    {
      title: t("inventoryCountings.itemCode"),
      dataIndex: "itemCode",
      key: "itemCode",
      width: 120,
    },
    {
      title: t("inventoryCountings.itemDescription"),
      dataIndex: "itemDescription",
      key: "itemDescription",
      ellipsis: true,
    },
    {
      title: t("inventoryCountings.warehouseCode"),
      dataIndex: "warehouseCode",
      key: "warehouseCode",
      width: 100,
    },
    {
      title: t("inventoryCountings.binLocation"),
      dataIndex: "binLocation",
      key: "binLocation",
      width: 180,
    },
    {
      title: t("inventoryCountings.currentQty"),
      dataIndex: "systemQuantity",
      key: "systemQuantity",
      width: 110,
      align: "right",
    },
    {
      title: t("inventoryCountings.actualQty"),
      key: "countedQuantity",
      width: 130,
      align: "right",
      render: (_: unknown, record: InventoryCountingLine) => (
        <Input
          type="number"
          min={0}
          className="h-8 w-24 text-right"
          placeholder={String(record.countedQuantity ?? 0)}
          value={lineQuantities[record.lineNum] ?? ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              setLineQuantities((prev) => {
                const next = { ...prev };
                delete next[record.lineNum];
                return next;
              });
            } else {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                setLineQuantities((prev) => ({ ...prev, [record.lineNum]: num }));
              }
            }
          }}
        />
      ),
    },
    {
      title: t("inventoryCountings.difference"),
      key: "difference",
      width: 100,
      align: "right",
      render: (_: unknown, record: InventoryCountingLine) => {
        const counted = lineQuantities[record.lineNum] ?? record.countedQuantity ?? 0;
        const diff = counted - record.systemQuantity;
        return (
          <span className={diff < 0 ? "text-red-500" : diff > 0 ? "text-green-600" : undefined}>
            {diff}
          </span>
        );
      },
    },
  ];

  // Effective employee: if changed in modal use new value, else use doc's current value
  const currentEmployee = selectedDoc?.employeeFullName ?? null;
  const currentEmployeeId = selectedDoc?.employeeId ?? null;
  const effectiveEmployeeId = selectedEmployeeId !== undefined ? selectedEmployeeId : currentEmployeeId;
  const isOpen = selectedDoc?.documentStatusName?.toLowerCase() === "open";

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
              rowKey="docEntry"
              pagination={false}
              scroll={{ x: "max-content" }}
              rowClassName={(record) =>
                record.documentStatusName?.toLowerCase() !== "open"
                  ? "opacity-50 bg-muted/40"
                  : ""
              }
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
        title={`${t("inventoryCountings.detail")} — #${selectedDoc?.docNum ?? ""}`}
        open={selectedDoc != null}
        onCancel={() => handleOpenModal(null)}
        footer={null}
        width={1100}
      >
        {selectedDoc && (
          <div className="space-y-4">
            {/* Header info + PDF */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>
                  <strong>{t("inventoryCountings.docNum")}:</strong> {selectedDoc.docNum}
                </span>
                <span>
                  <strong>{t("inventoryCountings.countDate")}:</strong> {selectedDoc.countDate ?? "—"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {selectedDoc.documentStatusName ?? "—"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleDownloadPdf(selectedDoc.docEntry)}
                disabled={downloadingId === selectedDoc.docEntry}
              >
                {downloadingId === selectedDoc.docEntry ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {t("inventoryCountings.downloadPdf")}
              </Button>
            </div>

            {/* Employee assign / remove */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs shrink-0">{t("admission.assignEmployee")}:</Label>
              {effectiveEmployeeId ? (
                <>
                  <span className="text-sm font-medium">
                    {selectedEmployeeId !== undefined
                      ? (() => {
                          const emp = employees.find((e) => (e.employeeId ?? e.EmployeeID) === selectedEmployeeId);
                          return emp ? `${emp.firstName} ${emp.lastName}` : currentEmployee;
                        })()
                      : currentEmployee}
                  </span>
                  {isOpen && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => setSelectedEmployeeId(null)}
                    >
                      <UserMinus className="w-4 h-4" />
                      {t("common.delete")}
                    </Button>
                  )}
                </>
              ) : isOpen ? (
                <Select
                  showSearch
                  placeholder={t("admission.selectEmployee")}
                  value={selectedEmployeeId ?? undefined}
                  onChange={(val) => setSelectedEmployeeId(val)}
                  loading={employeesLoading}
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={employees.map((e) => ({
                    value: e.employeeId ?? e.EmployeeID,
                    label: `${e.firstName} ${e.lastName}`,
                  }))}
                  className="w-64 [&_.ant-select-selector]:!h-9"
                  allowClear
                  onClear={() => setSelectedEmployeeId(undefined)}
                />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>

            {/* Lines table */}
            {selectedDoc.inventoryCountingLines?.length > 0 ? (
              <>
                <Table
                  columns={lineColumns}
                  dataSource={selectedDoc.inventoryCountingLines}
                  rowKey="lineNum"
                  pagination={false}
                  scroll={{ x: "max-content", y: 380 }}
                  size="small"
                />
                <div className="flex justify-end pt-3 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={patchMutation.isLoading || !effectiveEmployeeId}
                    className="gap-2"
                  >
                    {patchMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t("common.save")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">{t("common.noData")}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
