import { useState, useMemo, useEffect } from "react";
import { Table, Modal, Button as AntButton, Tooltip, message } from "antd";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "react-query";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { Eye, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import {
  useInventoryTransferRequests,
  usePostInventoryTransferRequests,
  type InventoryTransferRequestItem,
  type InventoryTransferRequestLine,
  type InventoryTransferRequestsFilters,
} from "@/entities/InventoryTransferRequests/api";
import { validateTransferLine, type EwsIssue } from "@/lib/ews";
import { EwsWarning } from "@/components/ui/ews-warning";
import { useCollectNotification } from "@/contexts/CollectNotificationContext";
import { useRequiredTransfersNotification } from "@/contexts/RequiredTransfersNotificationContext";
import { useSignalRWaiting } from "@/contexts/SignalRWaitingContext";
import { useSignalRHub } from "@/contexts/SignalRHubContext";

const MoveToRegionPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setCollectNotification } = useCollectNotification();
  const {
    setRequiredTransfersNotification,
    clearRequiredTransfersNotification,
  } = useRequiredTransfersNotification();

  // Filters state
  const [filterDocNum, setFilterDocNum] = useState<string>("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterFromWarehouse, setFilterFromWarehouse] = useState("");
  const [filterToWarehouse, setFilterToWarehouse] = useState("");
  const [appliedFilters, setAppliedFilters] =
    useState<InventoryTransferRequestsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageIndex(0);
      setAppliedFilters((prev) => ({
        ...prev,
        DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
        CardName: filterCardName.trim() || undefined,
        FromWarehouseCode: filterFromWarehouse.trim() || undefined,
        ToWarehouseCode: filterToWarehouse.trim() || undefined,
      }));
    }, 750);
    return () => clearTimeout(timer);
  }, [filterDocNum, filterCardName, filterFromWarehouse, filterToWarehouse]);

  const filters: InventoryTransferRequestsFilters = useMemo(() => {
    const f: InventoryTransferRequestsFilters = {
      PageSize: pageSize,
      Skip: pageIndex * pageSize,
    };

    if (appliedFilters.DocEntry != null) f.DocEntry = appliedFilters.DocEntry;
    if (appliedFilters.DocNum != null) f.DocNum = appliedFilters.DocNum;
    if (appliedFilters.Status != null) f.Status = appliedFilters.Status;
    if (appliedFilters.CardName) f.CardName = appliedFilters.CardName;
    if (appliedFilters.StartDate) f.StartDate = appliedFilters.StartDate;
    if (appliedFilters.EndDate) f.EndDate = appliedFilters.EndDate;
    if (appliedFilters.FromWarehouseCode) {
      f.FromWarehouseCode = appliedFilters.FromWarehouseCode;
    }
    if (appliedFilters.ToWarehouseCode) {
      f.ToWarehouseCode = appliedFilters.ToWarehouseCode;
    }

    return f;
  }, [appliedFilters, pageIndex, pageSize]);

  const {
    data: requests = [],
    isLoading,
    error,
  } = useInventoryTransferRequests(filters);

  const hasNextPage = requests.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = (pageIndex + 1) * pageSize;

  const [selectedRequest, setSelectedRequest] =
    useState<InventoryTransferRequestItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [waitingForSignalR, setWaitingForSignalR] = useSignalRWaiting("moveToRegion");
  const { startListening } = useSignalRHub();

  const postMutation = usePostInventoryTransferRequests();

  const handleClearFilters = () => {
    setFilterDocNum("");
    setFilterCardName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterFromWarehouse("");
    setFilterToWarehouse("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const handleOpenConfirmModal = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t("common.select"));
      return;
    }
    setIsConfirmModalVisible(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalVisible(false);
  };

  const handleSubmitSelected = () => {
    postMutation.mutate(selectedRowKeys, {
      onSuccess: () => {
        setWaitingForSignalR(true);
        setSelectedRowKeys([]);
        setIsConfirmModalVisible(false);
        startListening("moveToRegion", {
          onCompleted: (payload) => {
            if (!payload?.isSuccess) {
              toast.error(payload?.message ?? t("error.somethingWentWrong"));
              return;
            }
            if (payload.hasRequiredTransferExist) {
              setRequiredTransfersNotification(true);
              setCollectNotification(false);
            } else {
              setCollectNotification(true);
              clearRequiredTransfersNotification();
            }
            queryClient.invalidateQueries({
              queryKey: ["inventory-transfer-requests"],
            });
            toast.success(payload.message);
          },
        });
      },
      onError: () => {
        message.error(t("error.somethingWentWrong"));
      },
    });
  };

  const selectedRequests = useMemo(
    () => requests.filter((r) => selectedRowKeys.includes(r.docEntry)),
    [requests, selectedRowKeys]
  );

  // EWS: validate all lines of selected requests before API call
  const ewsIssues = useMemo<EwsIssue[]>(() => {
    const result: EwsIssue[] = [];
    for (const req of selectedRequests) {
      for (const line of req.stockTransferLines) {
        const msgs = validateTransferLine(line);
        if (msgs.length > 0) {
          result.push({
            label: `DocNum ${req.docNum} / ${line.itemCode || "—"}`,
            messages: msgs,
          });
        }
      }
    }
    return result;
  }, [selectedRequests]);

  const handleViewLines = (request: InventoryTransferRequestItem) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedRequest(null);
  };

  const rowSelection: {
    selectedRowKeys: number[];
    onChange: (keys: React.Key[]) => void;
  } = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as number[]),
  };

  const columns: ColumnsType<InventoryTransferRequestItem> = [
    {
      title: t("sales_orders_doc_num"),
      dataIndex: "docNum",
      key: "docNum",
      width: 120,
    },
    {
      title: t("sales_orders_card_name"),
      dataIndex: "cardName",
      key: "cardName",
      render: (_: unknown, record: InventoryTransferRequestItem) =>
        record.toWarehouseName || record.toWarehouse,
    },
    {
      title: t("sales_orders_doc_date"),
      dataIndex: "docDate",
      key: "docDate",
      width: 150,
    },
    {
      title: t("moveToRegion.fromWarehouse"),
      dataIndex: "fromWarehouseName",
      key: "fromWarehouseName",
      render: (_: unknown, record: InventoryTransferRequestItem) =>
        record.fromWarehouseName || record.fromWarehouse,
    },
    {
      title: t("moveToRegion.toWarehouse"),
      dataIndex: "toWarehouseName",
      key: "toWarehouseName",
      render: (_: unknown, record: InventoryTransferRequestItem) =>
        record.toWarehouseName || record.toWarehouse,
    },
    {
      title: t("common_actions"),
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: InventoryTransferRequestItem) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => handleViewLines(record)}
        >
          <Eye className="w-4 h-4" />
          {t("common_view")}
        </Button>
      ),
    },
  ];

  const documentLineColumns: ColumnsType<InventoryTransferRequestLine> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: InventoryTransferRequestLine, idx: number) => idx + 1,
    },
    {
      title: t("creditMemos.itemDescription"),
      dataIndex: "itemDescription",
      key: "itemDescription",
      render: (val: string, record: InventoryTransferRequestLine) => (
        <div>
          <span>{val || "—"}</span>
          {record.itemCode && (
            <p className="font-mono text-xs text-gray-400 mt-0.5">{record.itemCode}</p>
          )}
        </div>
      ),
    },
    {
      title: t("inventory.batchNumber"),
      dataIndex: "batchNumber",
      key: "batchNumber",
      width: 160,
      render: (val: string | null | undefined) => val ?? "—",
    },
    {
      title: t("sales_orders_quantity"),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right" as const,
    },
    {
      title: t("admission.manufacturingDate"),
      dataIndex: "batchManufactureDate",
      key: "batchManufactureDate",
      width: 130,
      render: (val: string | null | undefined) =>
        val ? new Date(val).toLocaleDateString() : "—",
    },
    {
      title: t("admission.expiryDate"),
      dataIndex: "batchExpiryDate",
      key: "batchExpiryDate",
      width: 130,
      render: (val: string | null | undefined) =>
        val ? new Date(val).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="relative min-h-full p-6 space-y-6">
      {waitingForSignalR && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("common_loading")}</p>
            <p className="text-xs text-muted-foreground">{t("signalR.waiting")}</p>
          </div>
        </div>
      )}
      <PageHeader
        title={t("nav.moveToRegion")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.moveToRegion") },
        ]}
        actions={
          <Button
            onClick={handleOpenConfirmModal}
            disabled={selectedRowKeys.length === 0 || postMutation.isLoading}
            className="gap-2"
          >
            {postMutation.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t("sales_orders_move_to_next_step")}
          </Button>
        }
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("sales_orders_filter_doc_num")}</Label>
              <Input
                type="number"
                placeholder={t("sales_orders_filter_doc_num")}
                value={filterDocNum}
                onChange={(e) => setFilterDocNum(e.target.value)}
                className="h-9 w-32"
              />
            </div>
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("sales_orders_filter_card_name")}</Label>
              <Input
                placeholder={t("sales_orders_filter_card_name")}
                value={filterCardName}
                onChange={(e) => setFilterCardName(e.target.value)}
                className="h-9 w-52"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Label className="text-xs">{t("sales_orders_filter_start_date")}</Label>
              <DatePicker
                value={filterStartDate ? dayjs(filterStartDate) : null}
                onChange={(date) => {
                  setPageIndex(0);
                  setFilterStartDate(date ? date.format("YYYY-MM-DD") : "");
                  setAppliedFilters((prev) => ({
                    ...prev,
                    StartDate: date ? date.format("YYYY-MM-DD") : undefined,
                  }));
                }}
                placeholder={t("sales_orders_select_date")}
                className="h-9 w-40"
                format="YYYY-MM-DD"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Label className="text-xs">{t("sales_orders_filter_end_date")}</Label>
              <DatePicker
                value={filterEndDate ? dayjs(filterEndDate) : null}
                onChange={(date) => {
                  setPageIndex(0);
                  setFilterEndDate(date ? date.format("YYYY-MM-DD") : "");
                  setAppliedFilters((prev) => ({
                    ...prev,
                    EndDate: date ? date.format("YYYY-MM-DD") : undefined,
                  }));
                }}
                placeholder={t("sales_orders_select_date")}
                className="h-9 w-40"
                format="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("moveToRegion.fromWarehouse")}</Label>
              <Input
                placeholder={t("moveToRegion.fromWarehouse")}
                value={filterFromWarehouse}
                onChange={(e) => setFilterFromWarehouse(e.target.value)}
                className="h-9 w-36"
              />
            </div>
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("moveToRegion.toWarehouse")}</Label>
              <Input
                placeholder={t("moveToRegion.toWarehouse")}
                value={filterToWarehouse}
                onChange={(e) => setFilterToWarehouse(e.target.value)}
                className="h-9 w-36"
              />
            </div>
          </div>
          <Tooltip title={t("common_clear_filters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground flex-shrink-0"
              aria-label={t("common_clear_filters")}
            >
              <ClearOutlined className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t("common_loading")}
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : (
          <>
            {selectedRowKeys.length > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                {t("sales_orders_selected_count", { count: selectedRowKeys.length })}
              </p>
            )}
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={requests}
              rowKey="docEntry"
              pagination={false}
              scroll={{ x: "max-content" }}
            />

            {/* Simple range indicator (no buttons for now) */}
            {(requests.length > 0 || pageIndex > 0) && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 mt-0">
                <div className="text-sm text-muted-foreground">
                  {t("sales_orders_showing_range", {
                    start: rangeStart,
                    end: rangeEnd,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
                    disabled={!hasPrevPage}
                  >
                    {"<"}
                  </Button>
                  <span className="px-3 text-sm font-medium">
                    {rangeStart} - {rangeEnd}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setPageIndex((p) => p + 1)}
                    disabled={!hasNextPage}
                  >
                    {">"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ModuleCard>

      {/* Confirm + EWS modal */}
      <Modal
        title={t("sales_orders_create_relocation")}
        open={isConfirmModalVisible}
        onCancel={handleCloseConfirmModal}
        width={900}
        footer={[
          <AntButton key="cancel" onClick={handleCloseConfirmModal}>
            {t("common_cancel")}
          </AntButton>,
          <AntButton
            key="submit"
            type="primary"
            loading={postMutation.isLoading}
            onClick={handleSubmitSelected}
          >
            {t("sales_orders_move_to_next_step")}
          </AntButton>,
        ]}
      >
        <div className="space-y-4">
          <EwsWarning issues={ewsIssues} />
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t("sales_orders_selected_orders_count", { count: selectedRequests.length })}
            </p>
          </div>
          <Table
            columns={columns.filter((col) => col.key !== "actions")}
            dataSource={selectedRequests}
            rowKey="docEntry"
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Modal>

      {/* Document lines view modal */}
      <Modal
        title={t("sales_orders_document_lines")}
        open={isModalVisible}
        onCancel={handleCloseModal}
        width={1200}
        footer={
          <Button variant="outline" onClick={handleCloseModal}>
            {t("common_close")}
          </Button>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("sales_orders_doc_num")}
                </p>
                <p className="font-medium">{selectedRequest.docNum}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("sales_orders_card_name")}
                </p>
                <p className="font-medium">
                  {selectedRequest.toWarehouseName || selectedRequest.toWarehouse}
                </p>
              </div>
            </div>
            <Table
              columns={documentLineColumns}
              dataSource={selectedRequest.stockTransferLines}
              rowKey="lineNum"
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MoveToRegionPage;

