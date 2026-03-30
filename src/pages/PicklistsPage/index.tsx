import { useState, useMemo, useEffect, useRef } from "react";
import { Table, Modal, Button as AntButton, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  usePicklists,
  usePicklistByDocEntry,
  useAssignPicklist,
  useAssignPicklistEmployee,
  useValidationScan,
  useValidationFinalize,
  useDetachPicklist,
  useAssignValidationValidator,
  useDetachValidation,
  useValidationItems,
  type PicklistItem,
  type PicklistLine,
  type PicklistsFilters,
} from "@/entities/Picklists/api";
import { useEmployees } from "@/entities/Employees/api";
import { useRequiredTransfersByIds } from "@/entities/RequiredTransfers/api";
import { EPickListStatus, EPickListLineStatus } from "@/enums/picklist";
import { EWarehouseCheckingType } from "@/enums/warehouseChecking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, ChevronLeft, ChevronRight, X, Printer } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label60x80 } from "@/features/label-print/components/Label60x80";
import { printLabel } from "@/features/label-print/utils/printLabel";
import type { LabelData } from "@/features/label-print/types/label";
import { message } from "antd";
import { cn } from "@/lib/utils";

const WAREHOUSE_CHECKING_TYPE_KEYS: Record<number, string> = {
  [EWarehouseCheckingType.WarehouseToClient]: "requiredTransfers.typeWarehouseToClient",
  [EWarehouseCheckingType.WarehouseToWarehouse]: "requiredTransfers.typeWarehouseToWarehouse",
  [EWarehouseCheckingType.Return]: "requiredTransfers.typeReturn",
};

const TYPE_BADGE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  [EWarehouseCheckingType.WarehouseToClient]: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  [EWarehouseCheckingType.WarehouseToWarehouse]: {
    bg: "bg-purple-100",
    text: "text-purple-900",
    border: "border-purple-300",
  },
  [EWarehouseCheckingType.Return]: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
  },
};

const STATUS_BADGE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  [EPickListStatus.Draft]: {
    bg: "bg-slate-100",
    text: "text-slate-900",
    border: "border-slate-300",
  },
  [EPickListStatus.InProgress]: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  [EPickListStatus.Picked]: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  [EPickListStatus.Validated]: {
    bg: "bg-green-100",
    text: "text-green-900",
    border: "border-green-300",
  },
};

const PAGE_SIZE = 20;

interface PicklistsPageProps {
  /** Array of statuses to filter picklists (e.g. [1, 2] for collect, [3] for validation) */
  statuses: number[];
  titleKey: string;
  parentKey: string;
  /** "collect" = view only; "validation" = assign + validate actions */
  mode?: "collect" | "validation";
  /** Hide the page header (used when parent renders its own header, e.g. HistoryPage) */
  hideHeader?: boolean;
  /** When true, replaces the Javobgar section in the detail modal with a label print UI */
  printMode?: boolean;
}

export default function PicklistsPage({
  statuses,
  titleKey,
  parentKey,
  mode = "collect",
  hideHeader = false,
  printMode = false,
}: PicklistsPageProps) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDocEntry, setSelectedDocEntry] = useState<number | null>(null);
  const [deliveryPackageCount, setDeliveryPackageCount] = useState<number>(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [labelCopies, setLabelCopies] = useState<number>(1);
  // ID of the transferRequirementId the user clicked — drives the transfer-detail popup
  const [selectedTransferReqId, setSelectedTransferReqId] = useState<number | null>(null);
  // Pending scanner scan — line + raw barcode waiting for user confirmation
  const [pendingScan, setPendingScan] = useState<{ line: PicklistLine; barcode: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const hiddenLabelRef = useRef<HTMLDivElement>(null);

  const assignPicklist = useAssignPicklist();
  const assignPicklistEmployee = useAssignPicklistEmployee();
  const validationScan = useValidationScan();
  const finalizeValidation = useValidationFinalize();
  const detachPicklist = useDetachPicklist();
  const assignValidationValidator = useAssignValidationValidator();
  const detachValidation = useDetachValidation();
  const isValidationMode = mode === "validation";
  const isCollectMode = mode === "collect";

  const { data: employees = [] } = useEmployees({ PageSize: 500 });

  const filters: PicklistsFilters = useMemo(
    () => ({ Statuses: statuses, skip: pageIndex * PAGE_SIZE }),
    [statuses, pageIndex]
  );
  const { data: picklists = [], isLoading, error } = usePicklists(filters);
  const { data: picklistDetail, isLoading: detailLoading } = usePicklistByDocEntry(selectedDocEntry);
  const { data: validationItems = [] } = useValidationItems(
    isValidationMode ? selectedDocEntry : null
  );
  const { data: transferLines = [], isLoading: transferDetailLoading } =
    useRequiredTransfersByIds(selectedTransferReqId != null ? [selectedTransferReqId] : []);

  const currentLines: PicklistLine[] =
    (isValidationMode ? validationItems : picklistDetail?.lines) ?? [];

  const allLinesValidated =
    currentLines.length > 0 &&
    currentLines.every((line) => line.status === EPickListLineStatus.Validated);

  const hasNextPage = picklists.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + picklists.length;

  useEffect(() => {
    if (!(isValidationMode && selectedDocEntry != null)) return;

    const focusHiddenInput = () => {
      barcodeInputRef.current?.focus();
    };

    const t1 = setTimeout(focusHiddenInput, 150);
    const t2 = setTimeout(focusHiddenInput, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isValidationMode, selectedDocEntry]);

  const handleViewDetail = (docEntry: number) => {
    setSelectedDocEntry(docEntry);
  };

  const handleCloseModal = () => {
    setSelectedDocEntry(null);
    setDeliveryPackageCount(0);
    setSelectedEmployeeId(null);
    setLabelCopies(1);
  };

  const handlePrintLabel = () => {
    if (!picklistDetail || !hiddenLabelRef.current) return;
    const labelEl = hiddenLabelRef.current.querySelector(".label-template") as HTMLElement | null;
    if (!labelEl) return;
    const data: LabelData = {
      labelSize: "60x80",
      title: picklistDetail.cardName ?? "",
      mainCode: picklistDetail.salesOrderDocNum ?? String(picklistDetail.id),
      location: picklistDetail.warehouseCode ?? "Toshkent",
      qrValue: String(picklistDetail.id),
      copies: labelCopies,
    };
    printLabel(labelEl, data);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = e.currentTarget.value.trim();
    e.currentTarget.value = "";
    if (!value || !isValidationMode || !picklistDetail) return;

    const line = currentLines.find((l) => (l.barcode ?? "").trim() === value);

    if (!line) {
      message.warning(t("validation.barcodeNotFound"));
      return;
    }

    if (line.status === EPickListLineStatus.Validated) {
      message.warning(t("validation.alreadyValidated"));
      return;
    }

    if (!picklistDetail.assigneeName || validationScan.isLoading) {
      return;
    }

    // Show confirmation dialog instead of mutating immediately
    setPendingScan({ line, barcode: value });
  };

  const handleConfirmScan = () => {
    if (!pendingScan || !picklistDetail) return;
    validationScan.mutate(
      { docEntry: picklistDetail.id, barcode: pendingScan.barcode },
      {
        onSuccess: () => { message.success(t("common.success")); },
        onError: () => { message.error(t("error.somethingWentWrong")); },
      }
    );
    setPendingScan(null);
  };

  const handleCancelScan = () => {
    setPendingScan(null);
    // Re-focus scanner input so worker can scan the next item immediately
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable], .ant-select")) {
      return;
    }
    if (isValidationMode && selectedDocEntry != null) {
      barcodeInputRef.current?.focus();
    }
  };

  const columns: ColumnsType<PicklistItem> = [
    {
      title: t("picklist_id"),
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number, record: PicklistItem) => (
        <div className="space-y-0.5">
          <p className="font-medium leading-none">{id}</p>
          {record.deliveryNumber && (
            <p className="text-xs text-muted-foreground font-mono leading-none">
              #{record.deliveryNumber}
            </p>
          )}
        </div>
      ),
    },
    { title: t("picklist_sales_order_doc_num"), dataIndex: "salesOrderDocNum", key: "salesOrderDocNum", width: 140 },
    { title: t("picklist_card_name"), dataIndex: "cardName", key: "cardName", width: 200 },
    { title: t("picklist_warehouse_code"), dataIndex: "warehouseCode", key: "warehouseCode", width: 120 },
    {
      title: t("picklist_to_warehouse"),
      key: "toWarehouse",
      width: 160,
      render: (_: unknown, record: PicklistItem) =>
        record.toWarehouseName || record.toWarehouseCode ? (
          <div className="space-y-0.5">
            <p className="leading-none">{record.toWarehouseName ?? "—"}</p>
            {record.toWarehouseCode && (
              <p className="text-xs text-muted-foreground font-mono leading-none">
                #{record.toWarehouseCode}
              </p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      title: t("picklist_status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: number) => {
        const key = EPickListStatus[status];
        const colors = STATUS_BADGE_COLORS[status];
        const statusText = key ? t(`picklistStatus.${key.toLowerCase()}`) : status;

        if (!colors) {
          return statusText;
        }

        return (
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", colors.bg, colors.text, colors.border)}>
            {statusText}
          </span>
        );
      },
    },
    {
      title: t("requiredTransfers.type"),
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: number) => {
        const colors = TYPE_BADGE_COLORS[type];
        if (!colors) {
          return t(WAREHOUSE_CHECKING_TYPE_KEYS[type] ?? "common.noData");
        }
        return (
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border", colors.bg, colors.text, colors.border)}>
            {t(WAREHOUSE_CHECKING_TYPE_KEYS[type] ?? "common.noData")}
          </span>
        );
      },
    },
    {
      title: t("picklist_assignee"),
      dataIndex: "assigneeName",
      key: "assigneeName",
      width: 180,
      render: (val: string | null) => val ?? "—",
    },
    {
      title: t("common_actions"),
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_: unknown, record: PicklistItem) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => handleViewDetail(record.id)}
        >
          <Eye className="w-4 h-4" />
          {t("common_view")}
        </Button>
      ),
    },
  ];

  const baseLineColumns: ColumnsType<PicklistLine> = [
    { title: "#", key: "index", width: 60, align: "center", render: (_: unknown, __: PicklistLine, idx: number) => idx + 1 },
    {
      title: t("picklist_line_product_name"),
      dataIndex: "productName",
      key: "productName",
      width: 260,
      render: (_: string, record: PicklistLine) => (
        <div className="space-y-0.5">
          <p className="font-medium">{record.productName}</p>
          <p className="text-xs text-muted-foreground font-mono">{record.itemCode}</p>
        </div>
      ),
    },
    {
      title: t("picklist_line_bin_code"),
      dataIndex: "binCode",
      key: "binCode",
      width: 120,
      render: (val: string | null) =>
        val ? (
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{val}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      title: t("picklist_line_transfer_doc"),
      dataIndex: "transferRequirementId",
      key: "transferRequirementId",
      width: 130,
      render: (val: number | null) =>
        val != null ? (
          <button
            type="button"
            className="font-mono text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 cursor-pointer"
            onClick={() => setSelectedTransferReqId(val)}
          >
            #{val}
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      title: t("picklist_line_requested_qty"),
      dataIndex: "requestedQty",
      key: "requestedQty",
      width: 100,
      render: (val: number, record: PicklistLine) => {
        const qty = record.totalQty ?? val;
        if (record.isWholePack && record.quantityInPack) {
          const boxes = qty / record.quantityInPack;
          return `${qty} (📦 ${boxes})`;
        }
        return qty;
      },
    },
    {
      title: t("picklist_line_status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: number) => {
        const key = EPickListLineStatus[status];
        return key ? t(`picklistLineStatus.${key.toLowerCase()}`) : String(status);
      },
    },
  ];

  const validationColumn: ColumnsType<PicklistLine> = [
    ...baseLineColumns.filter((col) => !("key" in col && (col.key === "binCode" || col.key === "transferRequirementId"))),
    {
      title: t("validation.validate"),
      key: "validate",
      width: 120,
      fixed: "right",
      render: (_: unknown, line: PicklistLine) => {
        const isValidated = line.status === EPickListLineStatus.Validated;
        if (isValidated) {
          return (
            <span className="text-xs font-medium text-status-success">
              {t("validation.validated")}
            </span>
          );
        }
        const noAssignee = !picklistDetail?.assigneeName;
        const noBarcode = !line.barcode;
        const disabled = validationScan.isLoading || noAssignee || noBarcode;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              if (!picklistDetail) return;
              validationScan.mutate(
                {
                  docEntry: picklistDetail.id,
                  barcode: (line.barcode ?? "").trim(),
                },
                {
                  onSuccess: () => {
                    message.success(t("common.success"));
                  },
                  onError: () => {
                    message.error(t("error.somethingWentWrong"));
                  },
                }
              );
            }}
            disabled={disabled}
          >
            {validationScan.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("validation.validate")
            )}
          </Button>
        );
      },
    },
  ];

  const lineColumns = isValidationMode ? validationColumn : baseLineColumns;

  return (
    <div className={hideHeader ? "space-y-6" : "p-6 space-y-6"}>
      {!hideHeader && (
        <PageHeader
          title={t(titleKey)}
          breadcrumbs={[{ label: t(parentKey) }, { label: t(titleKey) }]}
        />
      )}

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
              columns={columns}
              dataSource={picklists}
              rowKey="id"
              pagination={false}
              scroll={{ x: "max-content" }}
            />
            {(picklists.length > 0 || pageIndex > 0) && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 mt-0">
                <div className="text-sm text-muted-foreground">
                  {t("picklist_showing_range", { start: rangeStart, end: rangeEnd })}
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
                    {rangeStart} – {rangeEnd}
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

      <Modal
        title={t("picklist_detail_title", { docEntry: selectedDocEntry ?? "" })}
        open={selectedDocEntry != null}
        onCancel={handleCloseModal}
        width={1200}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isValidationMode && picklistDetail && allLinesValidated && (
                <>
                  <Label className="text-sm whitespace-nowrap mb-0">
                    {t("picklist.deliveryPackageCount")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={deliveryPackageCount === 0 ? "" : deliveryPackageCount}
                    placeholder={t("picklist.deliveryPackageCountPlaceholder")}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDeliveryPackageCount(
                        v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0)
                      );
                    }}
                    className="w-28 h-9"
                  />
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isValidationMode &&
                picklistDetail &&
                allLinesValidated && (
                  <AntButton
                    key="finalize"
                    type="primary"
                    loading={finalizeValidation.isLoading}
                    disabled={deliveryPackageCount <= 0}
                    onClick={() => {
                      if (!picklistDetail) return;
                      finalizeValidation.mutate(
                        {
                          picklistId: picklistDetail.id,
                          deliveryPackageCount,
                        },
                        {
                          onSuccess: () => {
                            message.success(t("common.success"));
                            handleCloseModal();
                          },
                          onError: () => {
                            message.error(t("error.somethingWentWrong"));
                          },
                        }
                      );
                    }}
                  >
                    {t("validation.finalize")}
                  </AntButton>
                )}
              <AntButton key="close" onClick={handleCloseModal}>
                {t("common_close")}
              </AntButton>
            </div>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : picklistDetail ? (
          <div
            className="space-y-4"
            onClick={handleModalContentClick}
            role="presentation"
          >
            {isValidationMode && (
              <input
                ref={barcodeInputRef}
                type="text"
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] w-px h-px opacity-0 overflow-hidden"
                onKeyDown={handleBarcodeKeyDown}
              />
            )}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              {printMode ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nusxalar soni</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={labelCopies}
                        onChange={(e) =>
                          setLabelCopies(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                        }
                        className="w-24 h-9"
                      />
                      <Button size="sm" className="gap-1" onClick={handlePrintLabel}>
                        <Printer className="w-4 h-4" />
                        Chop etish
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("picklist_assignee")}</p>
                    {picklistDetail.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{picklistDetail.assigneeName}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const detachMutation = isValidationMode ? detachValidation : detachPicklist;
                            detachMutation.mutate(picklistDetail.id, {
                              onSuccess: () => {
                                message.success(t("common.success"));
                              },
                              onError: () => {
                                message.error(t("error.somethingWentWrong"));
                              },
                            });
                          }}
                          disabled={
                            isValidationMode ? detachValidation.isLoading : detachPicklist.isLoading
                          }
                          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                          title={t("picklist.detach")}
                        >
                          {(isValidationMode ? detachValidation.isLoading : detachPicklist.isLoading) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ) : isCollectMode || isValidationMode ? (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Select
                          showSearch
                          placeholder={t("inventoryCountings.selectUser")}
                          value={selectedEmployeeId ?? undefined}
                          onChange={(val) => setSelectedEmployeeId(val ?? null)}
                          options={employees.map((emp) => ({
                            value: emp.employeeId ?? (emp as any).EmployeeID ?? 0,
                            label: [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "—",
                          }))}
                          filterOption={(input, option) =>
                            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                          }
                          optionFilterProp="label"
                          className="w-[220px] [&_.ant-select-selector]:!h-9"
                          notFoundContent={t("common.noResults")}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedEmployeeId == null) {
                              message.warning(t("inventoryCountings.selectUserFirst"));
                              return;
                            }
                            if (isValidationMode) {
                              assignValidationValidator.mutate(
                                { picklistId: picklistDetail.id, validatorId: selectedEmployeeId },
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
                            } else {
                              assignPicklistEmployee.mutate(
                                { picklistId: picklistDetail.id, employeeId: selectedEmployeeId },
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
                            }
                          }}
                          disabled={
                            selectedEmployeeId == null ||
                            (isValidationMode
                              ? assignValidationValidator.isLoading
                              : assignPicklistEmployee.isLoading)
                          }
                        >
                          {(isValidationMode
                            ? assignValidationValidator.isLoading
                            : assignPicklistEmployee.isLoading) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("inventoryCountings.assign")
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("picklist_warehouse_code")}</p>
                <p className="font-medium">{picklistDetail.warehouseCode}</p>
              </div>
            </div>
            {(() => {
              const lines = currentLines;
              const sortedLines = [...lines].sort((a, b) => {
                const aValidated = a.status === EPickListLineStatus.Validated;
                const bValidated = b.status === EPickListLineStatus.Validated;
                if (aValidated === bValidated) return 0;
                return aValidated ? 1 : -1;
              });
              return (
                <Table
                  columns={lineColumns}
                  dataSource={sortedLines}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  size="small"
                />
              );
            })()}

            {/* Hidden label element used as DOM source for printLabel — only rendered in printMode */}
            {printMode && (
              <div
                ref={hiddenLabelRef}
                style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}
                aria-hidden
              >
                <Label60x80
                  data={{
                    labelSize: "60x80",
                    title: picklistDetail.cardName ?? "",
                    mainCode: picklistDetail.salesOrderDocNum ?? String(picklistDetail.id),
                    location: picklistDetail.warehouseCode ?? "Toshkent",
                    qrValue: String(picklistDetail.id),
                    copies: labelCopies,
                  }}
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Transfer requirement detail popup — opens when user clicks a #id badge in the Ko'chirish hujjati column */}
      <Modal
        title={
          selectedTransferReqId != null
            ? `Ko'chirish hujjati — #${selectedTransferReqId}`
            : ""
        }
        open={selectedTransferReqId != null}
        onCancel={() => setSelectedTransferReqId(null)}
        footer={
          <AntButton onClick={() => setSelectedTransferReqId(null)}>
            {t("common_close")}
          </AntButton>
        }
        width={520}
      >
        {transferDetailLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : transferLines.length > 0 ? (
          <div className="space-y-3 py-2">
            {transferLines.map((line) => (
              <div key={line.id} className="border rounded-lg p-3 space-y-3">
                {/* Product */}
                <div className="space-y-0.5">
                  <p className="font-medium leading-snug text-sm">{line.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{line.itemCode}</p>
                </div>

                {/* Bin route */}
                <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-md">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Qayerdan</p>
                    <span className="font-mono text-xs font-semibold bg-white border rounded px-2 py-0.5 inline-block">
                      {line.sourceBinLocation}
                    </span>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Qayerga</p>
                    <span className="font-mono text-xs font-semibold bg-white border rounded px-2 py-0.5 inline-block">
                      {line.targetBinLocation}
                    </span>
                  </div>
                </div>

                {/* Quantity breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-muted/30 rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Miqdor</p>
                    <p className="text-lg font-bold">{line.quantity}</p>
                    <p className="text-xs text-muted-foreground">dona</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Qutida</p>
                    <p className="text-lg font-bold">{line.quantityPerBox}</p>
                    <p className="text-xs text-muted-foreground">dona/quti</p>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-center">
                    <p className="text-xs text-blue-600 mb-0.5">Qutilari</p>
                    <p className="text-lg font-bold text-blue-700">
                      {line.quantityPerBox > 0
                        ? (line.quantity / line.quantityPerBox).toFixed(2).replace(/\.?0+$/, "")
                        : "—"}
                    </p>
                    <p className="text-xs text-blue-600">quti</p>
                  </div>
                </div>

                {/* Status + batch */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                    line.isTransferred
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", line.isTransferred ? "bg-green-500" : "bg-amber-500")} />
                    {line.isTransferred ? "Ko'chirilgan" : "Ko'chirilmagan"}
                  </span>
                  {line.batchNumber && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {line.batchNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">Ma'lumot topilmadi</p>
        )}
      </Modal>
      {/* Scanner barcode confirmation — fires when scanner sends Enter after a match */}
      <ConfirmDialog
        open={pendingScan !== null}
        onOpenChange={(open) => { if (!open) handleCancelScan(); }}
        variant="success"
        title={t("validation.confirmTitle")}
        description={t("validation.confirmDescription", {
          productName: pendingScan?.line.productName ?? "",
          qty: pendingScan?.line.totalQty ?? pendingScan?.line.requestedQty ?? 0,
        })}
        confirmLabel={t("validation.validate")}
        loading={validationScan.isLoading}
        onConfirm={handleConfirmScan}
        onCancel={handleCancelScan}
      />
    </div>
  );
}
