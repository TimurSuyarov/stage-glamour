import { useState, useMemo, useEffect } from "react";
import { Table, Modal, Button as AntButton, Tooltip, DatePicker, message } from "antd";
import { toast } from "@/components/ui/sonner";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { useSalesOrders, postSalesOrdersMoveNext, type SalesOrder, type SalesOrderDocumentLine, type SalesOrdersFilters } from "@/entities/SalesOrders/api";
import { ESalesOrderStatus } from "@/enums/salesOrder";
import { useCollectNotification } from "@/contexts/CollectNotificationContext";
import { useRequiredTransfersNotification } from "@/contexts/RequiredTransfersNotificationContext";
import { useSignalRWaiting } from "@/contexts/SignalRWaitingContext";
import { useSignalRHub } from "@/contexts/SignalRHubContext";
import { Eye, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs, { type Dayjs } from "dayjs";
import { validateOrderLine, type EwsIssue } from "@/lib/ews";
import { EwsWarning } from "@/components/ui/ews-warning";

interface SalesOrdersPageProps {
  status: ESalesOrderStatus;
  titleKey: string;
  parentKey: string;
}

const SalesOrdersPage = ({ status, titleKey, parentKey }: SalesOrdersPageProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setCollectNotification } = useCollectNotification();
  const {
    setRequiredTransfersNotification,
    clearRequiredTransfersNotification,
  } = useRequiredTransfersNotification();

  // Filter state
  const [filterDocNum, setFilterDocNum] = useState<string>("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<SalesOrdersFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const pageSize = 20;

  const filters: SalesOrdersFilters = useMemo(() => {
    const f: SalesOrdersFilters = { skip: pageIndex * pageSize };
    if (appliedFilters.DocNum != null) f.DocNum = appliedFilters.DocNum;
    if (appliedFilters.CardName) f.CardName = appliedFilters.CardName;
    if (appliedFilters.StartDate) f.StartDate = appliedFilters.StartDate;
    if (appliedFilters.EndDate) f.EndDate = appliedFilters.EndDate;
    return f;
  }, [appliedFilters, pageIndex, pageSize]);

  const { data: salesOrders = [], isLoading, error } = useSalesOrders(status, filters);
  const hasNextPage = salesOrders.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = (pageIndex + 1) * pageSize;

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [moveNextLoading, setMoveNextLoading] = useSignalRWaiting("salesOrders");
  const { startListening } = useSignalRHub();

  // Debounce text inputs (DocNum, CardName)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageIndex(0);
      setAppliedFilters((prev) => ({
        ...prev,
        DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
        CardName: filterCardName.trim() || undefined,
      }));
    }, 750);
    return () => clearTimeout(timer);
  }, [filterDocNum, filterCardName]);

  // Apply date filters immediately on change
  const handleStartDateChange = (date: Dayjs | null) => {
    const dateStr = date ? date.format("YYYY-MM-DD") : "";
    setFilterStartDate(dateStr);
    setPageIndex(0);
    setAppliedFilters((prev) => ({
      ...prev,
      StartDate: dateStr || undefined,
    }));
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    const dateStr = date ? date.format("YYYY-MM-DD") : "";
    setFilterEndDate(dateStr);
    setPageIndex(0);
    setAppliedFilters((prev) => ({
      ...prev,
      EndDate: dateStr || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilterDocNum("");
    setFilterCardName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const handleViewItems = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const handleMoveToNextStep = async () => {
    const docEntries = selectedOrders.map((o) => o.docEntry);
    if (docEntries.length === 0) {
      message.warning(t("sales_orders_selected_orders_count", { count: 0 }));
      return;
    }
    setMoveNextLoading(true);
    try {
      await postSalesOrdersMoveNext(docEntries);
    } catch {
      message.error(t("error.somethingWentWrong"));
      setMoveNextLoading(false);
      return;
    }
    // Close modal and clear selection as soon as the POST succeeds.
    handleCloseCreateModal();
    setSelectedRowKeys([]);
    startListening("salesOrders", {
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
        queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
        toast.success(payload.message);
      },
    });
  };

  const selectedOrders = useMemo(() => {
    return salesOrders.filter((order) => selectedRowKeys.includes(order.docEntry));
  }, [salesOrders, selectedRowKeys]);

  // EWS: validate all lines of selected orders before API call
  const ewsIssues = useMemo<EwsIssue[]>(() => {
    const result: EwsIssue[] = [];
    for (const order of selectedOrders) {
      for (const line of order.documentLines) {
        const msgs = validateOrderLine(line);
        if (msgs.length > 0) {
          result.push({
            label: `DocNum ${order.docNum} / ${line.itemCode || "—"}`,
            messages: msgs,
          });
        }
      }
    }
    return result;
  }, [selectedOrders]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns: ColumnsType<SalesOrder> = [
    {
      title: t("sales_orders_doc_num"),
      key: "docNum",
      width: 140,
      render: (_: unknown, record: SalesOrder) => (
        <div>
          <p>{record.docNum}</p>
          {record.deliveryNumber && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5">#{record.deliveryNumber}</p>
          )}
        </div>
      ),
    },
    {
      title: t("sales_orders_card_name"),
      dataIndex: "cardName",
      key: "cardName",
    },
    {
      title: t("sales_orders_doc_date"),
      dataIndex: "docDate",
      key: "docDate",
      width: 150,
    },
    {
      title: t("sales_orders_doc_total"),
      dataIndex: "docTotal",
      key: "docTotal",
      width: 150,
      align: "right" as const,
      render: (total: number) => {
        return total?.toFixed(2) || "0.00";
      },
    },
    {
      title: t("common_actions"),
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: SalesOrder) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => handleViewItems(record)}
        >
          <Eye className="w-4 h-4" />
          {t("common_view")}
        </Button>
      ),
    },
  ];

  const documentLineColumns: ColumnsType<SalesOrderDocumentLine> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: unknown, __: SalesOrderDocumentLine, idx: number) => idx + 1,
    },
    {
      title: t("sales_orders_warehouse_code"),
      dataIndex: "warehouseCode",
      key: "warehouseCode",
      width: 120,
      align: "center" as const,
    },
    {
      title: t("sales_orders_item_description"),
      dataIndex: "itemDescription",
      key: "itemDescription",
      render: (val: string, record: SalesOrderDocumentLine) => (
        <div>
          <span>{val || "—"}</span>
          {record.itemCode && (
            <p className="font-mono text-xs text-gray-400 mt-0.5">{record.itemCode}</p>
          )}
          {record.smartupCode && (
            <p className="font-mono text-xs text-gray-400 mt-0.5">{record.smartupCode}</p>
          )}
        </div>
      ),
    },
    {
      title: t("sales_orders_quantity"),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right" as const,
    },
    {
      title: t("sales_orders_batch_number"),
      dataIndex: "batchNumber",
      key: "batchNumber",
      width: 160,
      render: (val: string | null) => val ?? "—",
    },
    {
      title: t("admission.expiryDate"),
      dataIndex: "batchExpiryDate",
      key: "batchExpiryDate",
      width: 140,
      render: (val: string | null) =>
        val ? new Date(val).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="relative min-h-full p-6 space-y-6">
      {moveNextLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("common_loading")}</p>
            <p className="text-xs text-muted-foreground">{t("signalR.waiting")}</p>
          </div>
        </div>
      )}
      <PageHeader
        title={t(titleKey)}
        breadcrumbs={[{ label: t(parentKey) }, { label: t(titleKey) }]}
        actions={
          <Button
            onClick={handleOpenCreateModal}
            disabled={selectedRowKeys.length === 0}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("sales_orders_move_to_next_step")}
          </Button>
        }
      />

      <ModuleCard>
        {/* Filters (API query params) */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
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
              onChange={handleStartDateChange}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_end_date")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={handleEndDateChange}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <Tooltip title={t("common_clear_filters")}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                className="h-9 w-9"
                aria-label={t("common_clear_filters")}
              >
                <ClearOutlined className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
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
              rowSelection={rowSelection}
              columns={columns}
              dataSource={salesOrders}
              rowKey="docEntry"
              pagination={false}
              scroll={{ x: "max-content" }}
            />

            {/* Custom Pagination */}
            {(salesOrders.length > 0 || pageIndex > 0) && (
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

        {selectedRowKeys.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t("sales_orders_selected_count", { count: selectedRowKeys.length })}
            </p>
          </div>
        )}
      </ModuleCard>

      <Modal
        title={t("sales_orders_document_lines")}
        open={isModalVisible}
        onCancel={handleCloseModal}
        width={1200}
        footer={[
          <AntButton key="close" onClick={handleCloseModal}>
            {t("common_close")}
          </AntButton>,
        ]}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("sales_orders_doc_num")}
                </p>
                <p className="font-medium">{selectedOrder.docNum}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("sales_orders_card_name")}
                </p>
                <p className="font-medium">{selectedOrder.cardName}</p>
              </div>
            </div>
            <Table
              columns={documentLineColumns}
              dataSource={selectedOrder.documentLines}
              rowKey="lineNum"
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        title={t("sales_orders_create_relocation")}
        open={isCreateModalVisible}
        onCancel={handleCloseCreateModal}
        width={1200}
        footer={[
          <AntButton key="cancel" onClick={handleCloseCreateModal}>
            {t("common_cancel")}
          </AntButton>,
          <AntButton
            key="fill"
            type="primary"
            loading={moveNextLoading}
            onClick={handleMoveToNextStep}
          >
            {t("sales_orders_move_to_next_step")}
          </AntButton>,
        ]}
      >
        <div className="space-y-4">
          <EwsWarning issues={ewsIssues} />

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              {t("sales_orders_selected_orders_count", { count: selectedOrders.length })}
            </p>
          </div>

          <Table
            columns={columns.filter((col) => col.key !== "actions")}
            dataSource={selectedOrders}
            rowKey="docEntry"
            pagination={false}
            scroll={{ x: "max-content" }}
          />

          {/* Summary */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold mb-2">{t("sales_orders_summary")}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("sales_orders_total_orders")}</p>
                <p className="font-medium">{selectedOrders.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("sales_orders_total_amount")}</p>
                <p className="font-medium">
                  {selectedOrders
                    .reduce((sum, order) => sum + (order.docTotal || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesOrdersPage;
