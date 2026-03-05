import { useState, useMemo } from "react";
import { Table, Modal, Button as AntButton } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  usePicklists,
  usePicklistByDocEntry,
  useAssignPicklist,
  useValidationScan,
  useValidationFinalize,
  type PicklistItem,
  type PicklistLine,
  type PicklistsFilters,
} from "@/entities/Picklists/api";
import { EPickListStatus, EPickListLineStatus } from "@/enums/picklist";
import { EWarehouseCheckingType } from "@/enums/warehouseChecking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { message } from "antd";

const WAREHOUSE_CHECKING_TYPE_KEYS: Record<number, string> = {
  [EWarehouseCheckingType.WarehouseToClient]: "requiredTransfers.typeWarehouseToClient",
  [EWarehouseCheckingType.WarehouseToWarehouse]: "requiredTransfers.typeWarehouseToWarehouse",
  [EWarehouseCheckingType.Return]: "requiredTransfers.typeReturn",
};

const PAGE_SIZE = 20;

interface PicklistsPageProps {
  status: number;
  titleKey: string;
  parentKey: string;
  /** "collect" = view only; "validation" = assign + validate actions */
  mode?: "collect" | "validation";
  /** Hide the page header (used when parent renders its own header, e.g. HistoryPage) */
  hideHeader?: boolean;
}

export default function PicklistsPage({
  status,
  titleKey,
  parentKey,
  mode = "collect",
  hideHeader = false,
}: PicklistsPageProps) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDocEntry, setSelectedDocEntry] = useState<number | null>(null);
  const [deliveryPackageCount, setDeliveryPackageCount] = useState<number>(0);

  const assignPicklist = useAssignPicklist();
  const validationScan = useValidationScan();
  const finalizeValidation = useValidationFinalize();
  const isValidationMode = mode === "validation";

  const filters: PicklistsFilters = useMemo(
    () => ({ Status: status, skip: pageIndex * PAGE_SIZE }),
    [status, pageIndex]
  );
  const { data: picklists = [], isLoading, error } = usePicklists(filters);
  const { data: picklistDetail, isLoading: detailLoading } = usePicklistByDocEntry(selectedDocEntry);

  const allLinesValidated =
    !!picklistDetail &&
    (picklistDetail.lines ?? []).length > 0 &&
    (picklistDetail.lines ?? []).every(
      (line) => line.status === EPickListLineStatus.Validated
    );

  const hasNextPage = picklists.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + picklists.length;

  const handleViewDetail = (docEntry: number) => {
    setSelectedDocEntry(docEntry);
  };

  const handleCloseModal = () => {
    setSelectedDocEntry(null);
    setDeliveryPackageCount(0);
  };

  const columns: ColumnsType<PicklistItem> = [
    { title: t("picklist_id"), dataIndex: "id", key: "id", width: 80 },
    { title: t("picklist_sales_order_doc_num"), dataIndex: "salesOrderDocNum", key: "salesOrderDocNum", width: 140 },
    { title: t("picklist_card_name"), dataIndex: "cardName", key: "cardName", width: 200 },
    { title: t("picklist_warehouse_code"), dataIndex: "warehouseCode", key: "warehouseCode", width: 120 },
    {
      title: t("picklist_status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: number) => {
        const key = EPickListStatus[status];
        return key ? t(`picklistStatus.${key.toLowerCase()}`) : status;
      },
    },
    {
      title: t("requiredTransfers.type"),
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: number) => t(WAREHOUSE_CHECKING_TYPE_KEYS[type] ?? "common.noData"),
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
    { title: t("picklist_line_product_name"), dataIndex: "productName", key: "productName", width: 220 },
    { title: t("picklist_line_bin_code"), dataIndex: "binCode", key: "binCode", width: 120 },
    { title: t("picklist_line_requested_qty"), dataIndex: "requestedQty", key: "requestedQty", width: 100 },
    {
      title: t("picklist_line_batch_number"),
      dataIndex: "batchNumber",
      key: "batchNumber",
      width: 140,
      render: (val: string | null | undefined) => val ?? "—",
    },
    {
      title: t("admission.expiryDate"),
      dataIndex: "expirationDate",
      key: "expirationDate",
      width: 130,
      render: (val: string | null | undefined) =>
        val ? new Date(val).toLocaleDateString() : "—",
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
    ...baseLineColumns,
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
        const disabled = validationScan.isLoading || noAssignee;
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
                  lineId: line.id,
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
        width="100%"
        style={{ maxWidth: "min(1200px, calc(100vw - 40px))" }}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("picklist_assignee")}</p>
                  <p className="font-medium">{picklistDetail.assigneeName ?? "—"}</p>
                </div>
                {isValidationMode && !picklistDetail.assigneeName && (
                  <Button
                    size="sm"
                    onClick={() => {
                      assignPicklist.mutate(picklistDetail.id, {
                        onSuccess: () => {
                          message.success(t("common.success"));
                        },
                        onError: () => {
                          message.error(t("error.somethingWentWrong"));
                        },
                      });
                    }}
                    disabled={assignPicklist.isLoading}
                  >
                    {assignPicklist.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("validation.assignMe")
                    )}
                  </Button>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("picklist_warehouse_code")}</p>
                <p className="font-medium">{picklistDetail.warehouseCode}</p>
              </div>
            </div>
            {(() => {
              const lines = picklistDetail.lines ?? [];
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
