import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useInventoryCountings,
  type InventoryCountingsFilters,
  type InventoryCountingItem,
  type InventoryCountingLine,
} from "@/entities/InventoryCountings/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Modal, Tooltip, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

export default function InventoryCountingsPage() {
  const { t } = useTranslation();

  const [filterDocEntry, setFilterDocEntry] = useState("");
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterItemCode, setFilterItemCode] = useState("");
  const [filterItemDesc, setFilterItemDesc] = useState("");
  const [filterWarehouseCode, setFilterWarehouseCode] = useState("");
  const [filterBinLocation, setFilterBinLocation] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<InventoryCountingsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<InventoryCountingItem | null>(null);

  const filters: InventoryCountingsFilters = useMemo(
    () => ({
      ...appliedFilters,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading, error } = useInventoryCountings(filters);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + items.length;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocEntry: filterDocEntry.trim() ? Number(filterDocEntry) : undefined,
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
      ItemCode: filterItemCode.trim() || undefined,
      ItemDesc: filterItemDesc.trim() || undefined,
      WarehouseCode: filterWarehouseCode.trim() || undefined,
      binLocation: filterBinLocation.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterDocEntry("");
    setFilterDocNum("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterItemCode("");
    setFilterItemDesc("");
    setFilterWarehouseCode("");
    setFilterBinLocation("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const mainColumns: ColumnsType<InventoryCountingItem> = [
    {
      title: "DocEntry",
      dataIndex: "docEntry",
      key: "docEntry",
      width: 100,
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
      width: 140,
    },
    {
      title: t("inventoryCountings.remarks"),
      dataIndex: "remarks",
      key: "remarks",
      render: (val: string | null) => val ?? "—",
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
          onClick={() => setSelectedDoc(record)}
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
      dataIndex: "lineNum",
      key: "lineNum",
      width: 60,
      align: "center",
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
    },
    {
      title: t("inventoryCountings.warehouseCode"),
      dataIndex: "warehouseCode",
      key: "warehouseCode",
      width: 100,
      align: "center",
    },
    {
      title: t("inventoryCountings.binLocation"),
      dataIndex: "binLocation",
      key: "binLocation",
      width: 180,
    },
    {
      title: t("inventoryCountings.systemQty"),
      dataIndex: "systemQuantity",
      key: "systemQuantity",
      width: 110,
      align: "right",
    },
    {
      title: t("inventoryCountings.countedQty"),
      dataIndex: "countedQuantity",
      key: "countedQuantity",
      width: 110,
      align: "right",
    },
    {
      title: t("inventoryCountings.difference"),
      dataIndex: "difference",
      key: "difference",
      width: 100,
      align: "right",
      render: (val: number) => (
        <span
          className={
            val > 0
              ? "text-green-600 font-medium"
              : val < 0
              ? "text-red-600 font-medium"
              : ""
          }
        >
          {val > 0 ? `+${val}` : val}
        </span>
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
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">DocEntry</Label>
            <Input
              placeholder="—"
              value={filterDocEntry}
              onChange={(e) => setFilterDocEntry(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.docNum")}</Label>
            <Input
              placeholder="—"
              value={filterDocNum}
              onChange={(e) => setFilterDocNum(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.startDate")}</Label>
            <DatePicker
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={(date) => setFilterStartDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.endDate")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(date) => setFilterEndDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("sales_orders_select_date")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.itemCode")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemCode}
              onChange={(e) => setFilterItemCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.itemDescription")}</Label>
            <Input
              placeholder={t("common.search")}
              value={filterItemDesc}
              onChange={(e) => setFilterItemDesc(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.warehouseCode")}</Label>
            <Input
              placeholder="—"
              value={filterWarehouseCode}
              onChange={(e) => setFilterWarehouseCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("inventoryCountings.binLocation")}</Label>
            <Input
              placeholder="—"
              value={filterBinLocation}
              onChange={(e) => setFilterBinLocation(e.target.value)}
              className="h-9"
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
          <>
            <Table
              columns={mainColumns}
              dataSource={items}
              rowKey="docEntry"
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

      {/* Lines modal */}
      <Modal
        title={`${t("inventoryCountings.detail")} — #${selectedDoc?.docEntry ?? ""}`}
        open={selectedDoc != null}
        onCancel={() => setSelectedDoc(null)}
        width="100%"
        style={{ maxWidth: "min(1200px, calc(100vw - 40px))" }}
        footer={null}
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("inventoryCountings.docNum")}</p>
                <p className="font-medium">{selectedDoc.docNum}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("inventoryCountings.countDate")}</p>
                <p className="font-medium">{selectedDoc.countDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("inventoryCountings.remarks")}</p>
                <p className="font-medium">{selectedDoc.remarks ?? "—"}</p>
              </div>
            </div>
            <Table
              columns={lineColumns}
              dataSource={selectedDoc.inventoryCountingLines}
              rowKey="lineNum"
              pagination={false}
              scroll={{ x: "max-content" }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
