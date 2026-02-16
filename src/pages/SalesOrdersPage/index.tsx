import { useState, useMemo } from "react";
import { Table, Modal, Button as AntButton, Tooltip, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { useSalesOrders, type SalesOrder, type SalesOrderDocumentLine, type SalesOrdersFilters } from "@/entities/SalesOrders/api";
import { ESalesOrderStatus } from "@/enums/salesOrder";
import { Eye, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";

interface SalesOrdersPageProps {
  status: ESalesOrderStatus;
  titleKey: string;
  parentKey: string;
}

const SalesOrdersPage = ({ status, titleKey, parentKey }: SalesOrdersPageProps) => {
  const { t } = useTranslation();
  
  // Filter state
  const [filterDocNum, setFilterDocNum] = useState<string>("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<SalesOrdersFilters>({});
  const [pageIndex, setPageIndex] = useState(0);
  
  const filters: SalesOrdersFilters = useMemo(() => {
    const f: SalesOrdersFilters = { skip: pageIndex };
    if (appliedFilters.DocNum != null) f.DocNum = appliedFilters.DocNum;
    if (appliedFilters.CardName) f.CardName = appliedFilters.CardName;
    if (appliedFilters.StartDate) f.StartDate = appliedFilters.StartDate;
    if (appliedFilters.EndDate) f.EndDate = appliedFilters.EndDate;
    return f;
  }, [appliedFilters, pageIndex]);
  
  const { data: salesOrders = [], isLoading, error } = useSalesOrders(status, filters);
  const pageSize = 20;
  const hasNextPage = salesOrders.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  
  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      CardName: filterCardName.trim() || undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
    });
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

  const handleFillAbgdZone = () => {
    // TODO: Implement API call to fill ABGD zone
    console.log("Filling ABGD zone with selected orders:", selectedOrders);
    handleCloseCreateModal();
    setSelectedRowKeys([]);
  };

  const selectedOrders = useMemo(() => {
    return salesOrders.filter((order) => selectedRowKeys.includes(order.docEntry));
  }, [salesOrders, selectedRowKeys]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns: ColumnsType<SalesOrder> = [
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
    },
    {
      title: t("sales_orders_doc_date"),
      dataIndex: "docDate",
      key: "docDate",
      width: 150,
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString() : "-";
      },
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
      title: t("sales_orders_line_num"),
      dataIndex: "lineNum",
      key: "lineNum",
      width: 80,
      align: "center" as const,
    },
    {
      title: t("sales_orders_item_description"),
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
      title: t("sales_orders_price"),
      dataIndex: "price",
      key: "price",
      width: 150,
      align: "right" as const,
      render: (price: number) => {
        return new Intl.NumberFormat("uz-UZ", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price);
      },
    },
    {
      title: t("sales_orders_line_total"),
      dataIndex: "lineTotal",
      key: "lineTotal",
      width: 150,
      align: "right" as const,
      render: (total: number) => {
        return total?.toFixed(2) || "0.00";
      },
    },
    {
      title: t("sales_orders_warehouse_code"),
      dataIndex: "warehouseCode",
      key: "warehouseCode",
      width: 120,
      align: "center" as const,
    },
    {
      title: t("sales_orders_total_price"),
      key: "totalPrice",
      width: 150,
      align: "right" as const,
      render: (_: any, record: SalesOrderDocumentLine) => {
        const total = record.quantity * record.price;
        return new Intl.NumberFormat("uz-UZ", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(total);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
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
            {t("common_create")}
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
              onChange={(date) => setFilterStartDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("sales_orders_filter_end_date")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(date) => setFilterEndDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
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
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={salesOrders}
            rowKey="docEntry"
            pagination={{
              current: pageIndex + 1,
              pageSize: pageSize,
              total: undefined,
              showSizeChanger: false,
              showTotal: (total, range) =>
                t("sales_orders_showing_range", {
                  start: range[0],
                  end: range[1],
                }),
              onChange: (page) => {
                setPageIndex(page - 1);
              },
              showPrevNextJumpers: false,
              hideOnSinglePage: false,
            }}
            scroll={{ x: "max-content" }}
          />
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
        footer={[
          <AntButton key="close" onClick={handleCloseModal}>
            {t("common_close")}
          </AntButton>,
        ]}
        width={1000}
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
        footer={[
          <AntButton key="cancel" onClick={handleCloseCreateModal}>
            {t("common_cancel")}
          </AntButton>,
          <AntButton
            key="fill"
            type="primary"
            onClick={handleFillAbgdZone}
          >
            {t("sales_orders_fill_abgd_zone")}
          </AntButton>,
        ]}
        width={1000}
      >
        <div className="space-y-4">
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
