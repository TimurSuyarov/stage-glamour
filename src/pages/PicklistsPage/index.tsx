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
  type PicklistItem,
  type PicklistLine,
  type PicklistsFilters,
} from "@/entities/Picklists/api";
import { EPickListStatus } from "@/enums/picklist";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { message } from "antd";

const PAGE_SIZE = 20;

interface PicklistsPageProps {
  status: number;
  titleKey: string;
  parentKey: string;
  /** "collect" = view only; "validation" = assign + validate actions */
  mode?: "collect" | "validation";
}

export default function PicklistsPage({
  status,
  titleKey,
  parentKey,
  mode = "collect",
}: PicklistsPageProps) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDocEntry, setSelectedDocEntry] = useState<number | null>(null);

  const assignPicklist = useAssignPicklist();
  const validationScan = useValidationScan();
  const isValidationMode = mode === "validation";

  const filters: PicklistsFilters = useMemo(
    () => ({ Status: status, skip: pageIndex * PAGE_SIZE }),
    [status, pageIndex]
  );
  const { data: picklists = [], isLoading, error } = usePicklists(filters);
  const { data: picklistDetail, isLoading: detailLoading } = usePicklistByDocEntry(selectedDocEntry);

  const hasNextPage = picklists.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + picklists.length;

  const handleViewDetail = (docEntry: number) => {
    setSelectedDocEntry(docEntry);
  };

  const handleCloseModal = () => {
    setSelectedDocEntry(null);
  };

  const columns: ColumnsType<PicklistItem> = [
    { title: t("picklist_id"), dataIndex: "id", key: "id", width: 80 },
    { title: t("picklist_sales_order_doc_entry"), dataIndex: "salesOrderDocEntry", key: "salesOrderDocEntry", width: 140 },
    { title: t("picklist_card_name"), dataIndex: "cardName", key: "cardName", width: 200 },
    { title: t("picklist_warehouse_code"), dataIndex: "warehouseCode", key: "warehouseCode", width: 120 },
    { title: t("picklist_status"), dataIndex: "status", key: "status", width: 100 },
    { title: t("picklist_lines_total"), dataIndex: "linesTotalCount", key: "linesTotalCount", width: 100 },
    { title: t("picklist_lines_picked"), dataIndex: "linesPickedCount", key: "linesPickedCount", width: 100 },
    {
      title: t("picklist_completed_at"),
      dataIndex: "completedAt",
      key: "completedAt",
      width: 180,
      render: (val: string | null) => (val ? new Date(val).toLocaleString() : "—"),
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
          onClick={() => handleViewDetail(record.salesOrderDocEntry)}
        >
          <Eye className="w-4 h-4" />
          {t("common_view")}
        </Button>
      ),
    },
  ];

  const baseLineColumns: ColumnsType<PicklistLine> = [
    { title: t("picklist_line_item_code"), dataIndex: "itemCode", key: "itemCode", width: 100 },
    { title: t("picklist_line_product_name"), dataIndex: "productName", key: "productName", width: 220 },
    { title: t("picklist_line_bin_code"), dataIndex: "binCode", key: "binCode", width: 120 },
    { title: t("picklist_line_requested_qty"), dataIndex: "requestedQty", key: "requestedQty", width: 100 },
    { title: t("picklist_line_allocated_qty"), dataIndex: "allocatedQty", key: "allocatedQty", width: 100 },
    { title: t("picklist_line_picked_qty"), dataIndex: "pickedQty", key: "pickedQty", width: 100 },
    { title: t("picklist_line_status"), dataIndex: "status", key: "status", width: 80 },
  ];

  const validationColumn: ColumnsType<PicklistLine> = [
    ...baseLineColumns,
    {
      title: t("validation.validate"),
      key: "validate",
      width: 120,
      fixed: "right",
      render: (_: unknown, line: PicklistLine) => {
        const isValidated = line.status === EPickListStatus.Validated;
        if (isValidated) {
          return (
            <span className="text-xs font-medium text-status-success">
              {t("validation.validated")}
            </span>
          );
        }
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
                  docEntry: picklistDetail.salesOrderDocEntry,
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
            disabled={validationScan.isLoading}
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
    <div className="p-6 space-y-6">
      <PageHeader
        title={t(titleKey)}
        breadcrumbs={[{ label: t(parentKey) }, { label: t(titleKey) }]}
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
        footer={[
          <AntButton key="close" onClick={handleCloseModal}>
            {t("common_close")}
          </AntButton>,
        ]}
        width={900}
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
                const aValidated = a.status === EPickListStatus.Validated;
                const bValidated = b.status === EPickListStatus.Validated;
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
