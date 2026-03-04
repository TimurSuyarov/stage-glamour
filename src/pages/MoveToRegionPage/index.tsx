import { useState, useMemo } from "react";
import { Table, Modal, Tooltip, message } from "antd";
import { useQueryClient } from "react-query";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { Eye, Loader2 } from "lucide-react";
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
import { useCollectNotification } from "@/contexts/CollectNotificationContext";
import { useRequiredTransfersNotification } from "@/contexts/RequiredTransfersNotificationContext";
import {
  createSalesOrdersHubConnection,
  type ProcessingCompletedPayload,
} from "@/lib/salesOrdersHub";

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
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDocEntry, setFilterDocEntry] = useState<string>("");
  const [appliedFilters, setAppliedFilters] =
    useState<InventoryTransferRequestsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const pageSize = 20;

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const postMutation = usePostInventoryTransferRequests();

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocEntry: filterDocEntry.trim() ? Number(filterDocEntry) : undefined,
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      Status: filterStatus.trim() ? Number(filterStatus) : undefined,
      CardName: filterCardName.trim() || undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
      FromWarehouseCode: filterFromWarehouse.trim() || undefined,
      ToWarehouseCode: filterToWarehouse.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterDocEntry("");
    setFilterDocNum("");
    setFilterStatus("");
    setFilterCardName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterFromWarehouse("");
    setFilterToWarehouse("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const handleSubmitSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t("common.select"));
      return;
    }
    postMutation.mutate(selectedRowKeys, {
      onSuccess: () => {
        const connection = createSalesOrdersHubConnection();

        const onDone = () => {
          connection.stop().catch(() => {});
          setSelectedRowKeys([]);
        };

        connection.on(
          "ProcessingCompleted",
          (payload: ProcessingCompletedPayload) => {
            if (payload?.hasRequiredTransferExist) {
              setRequiredTransfersNotification(true);
              setCollectNotification(false);
            } else {
              setCollectNotification(true);
              clearRequiredTransfersNotification();
            }

            queryClient.invalidateQueries({
              queryKey: ["inventory-transfer-requests"],
            });
            message.success(
              payload?.message ?? t("moveToRegion.submit")
            );
            onDone();
          }
        );

        connection.onclose(onDone);

        connection
          .start()
          .catch(() => {
            message.error(t("error.couldNotConnect"));
            onDone();
          });
      },
      onError: () => {
        message.error(t("error.somethingWentWrong"));
      },
    });
  };

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
      title: t("creditMemos.itemCode"),
      dataIndex: "itemCode",
      key: "itemCode",
      width: 120,
      render: (val: string) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      title: t("creditMemos.itemDescription"),
      dataIndex: "itemDescription",
      key: "itemDescription",
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
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.moveToRegion")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.moveToRegion") },
        ]}
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("creditMemos.docEntry")}</Label>
            <Input
              type="number"
              placeholder="—"
              value={filterDocEntry}
              onChange={(e) => setFilterDocEntry(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_doc_num")}</Label>
            <Input
              type="number"
              placeholder={t("sales_orders_filter_doc_num")}
              value={filterDocNum}
              onChange={(e) => setFilterDocNum(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("creditMemos.documentStatus")}</Label>
            <Input
              type="number"
              placeholder="—"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_card_name")}</Label>
            <Input
              placeholder={t("sales_orders_filter_card_name")}
              value={filterCardName}
              onChange={(e) => setFilterCardName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_start_date")}</Label>
            <DatePicker
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={(date) =>
                setFilterStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_end_date")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(date) =>
                setFilterEndDate(date ? date.format("YYYY-MM-DD") : "")
              }
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("moveToRegion.fromWarehouse")}</Label>
            <Input
              placeholder={t("moveToRegion.fromWarehouse")}
              value={filterFromWarehouse}
              onChange={(e) => setFilterFromWarehouse(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("moveToRegion.toWarehouse")}</Label>
            <Input
              placeholder={t("moveToRegion.toWarehouse")}
              value={filterToWarehouse}
              onChange={(e) => setFilterToWarehouse(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-sm text-muted-foreground">
                {selectedRowKeys.length > 0
                  ? t("sales_orders_selected_count", { count: selectedRowKeys.length })
                  : null}
              </span>
              <Button
                onClick={handleSubmitSelected}
                disabled={selectedRowKeys.length === 0 || postMutation.isLoading}
              >
                {postMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                ) : null}
                {t("moveToRegion.submit")}
              </Button>
            </div>
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

      <Modal
        title={t("sales_orders_document_lines")}
        open={isModalVisible}
        onCancel={handleCloseModal}
        width="100%"
        style={{ maxWidth: "min(1200px, calc(100vw - 40px))" }}
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

