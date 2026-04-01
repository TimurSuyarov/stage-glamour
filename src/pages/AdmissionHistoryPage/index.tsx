import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  usePurchaseDeliveries,
  type PurchaseDeliveriesFilters,
  type PurchaseDeliveryItem,
  type PurchaseDeliveryDocumentLine,
} from "@/entities/PurchaseDeliveries/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Modal, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

export default function AdmissionHistoryPage() {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [filterDocEntry, setFilterDocEntry] = useState("");
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterCardCode, setFilterCardCode] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<PurchaseDeliveriesFilters>({});
  const [selectedDoc, setSelectedDoc] = useState<PurchaseDeliveryItem | null>(null);

  const filters: PurchaseDeliveriesFilters = useMemo(
    () => ({
      ...appliedFilters,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading } = usePurchaseDeliveries(filters);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + items.length;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocEntry: filterDocEntry.trim() ? Number(filterDocEntry) : undefined,
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      CardName: filterCardName.trim() || undefined,
      CardCode: filterCardCode.trim() || undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterDocEntry("");
    setFilterDocNum("");
    setFilterCardName("");
    setFilterCardCode("");
    setFilterStartDate("");
    setFilterEndDate("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const mainColumns: ColumnsType<PurchaseDeliveryItem> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: PurchaseDeliveryItem, idx: number) =>
        pageIndex * PAGE_SIZE + idx + 1,
    },
    {
      title: t("creditMemos.docEntry"),
      dataIndex: "docEntry",
      key: "docEntry",
      width: 100,
      render: (val: number) => <span className="font-mono">{val}</span>,
    },
    {
      title: t("creditMemos.docNum"),
      dataIndex: "docNum",
      key: "docNum",
      width: 110,
    },
    {
      title: t("purchaseDelivery.docStatus"),
      dataIndex: "docStatus",
      key: "docStatus",
      width: 90,
    },
    {
      title: t("purchaseDelivery.employeeFullName"),
      dataIndex: "employeeFullName",
      key: "employeeFullName",
      width: 160,
      render: (val: string | null) => val ?? "—",
    },
    {
      title: t("creditMemos.cardCode"),
      dataIndex: "cardCode",
      key: "cardCode",
      width: 120,
    },
    {
      title: t("creditMemos.cardName"),
      dataIndex: "cardName",
      key: "cardName",
      width: 220,
      ellipsis: true,
    },
    {
      title: t("admission.filterStartDate"),
      dataIndex: "docDate",
      key: "docDate",
      width: 120,
      render: (val: string) => (val ? new Date(val).toLocaleDateString() : "—"),
    },
    {
      title: t("admission.filterEndDate"),
      dataIndex: "docDueDate",
      key: "docDueDate",
      width: 120,
      render: (val: string | null) => (val ? new Date(val).toLocaleDateString() : "—"),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 100,
      align: "right",
      fixed: "right",
      render: (_: unknown, record: PurchaseDeliveryItem) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setSelectedDoc(record)}
        >
          <Eye className="w-4 h-4" />
          {t("common.see")}
        </Button>
      ),
    },
  ];

  const lineColumns: ColumnsType<PurchaseDeliveryDocumentLine> = [
    { title: "#", key: "index", width: 60, align: "center", render: (_: unknown, __: PurchaseDeliveryDocumentLine, idx: number) => idx + 1 },
    { title: t("purchaseDelivery.lineNum"), dataIndex: "lineNum", key: "lineNum", width: 60, align: "center" },
    { title: t("inventoryCountings.itemCode"), dataIndex: "itemCode", key: "itemCode", width: 110 },
    { title: t("inventoryCountings.itemDescription"), dataIndex: "itemDescription", key: "itemDescription", ellipsis: true },
    { title: t("purchaseDelivery.itemGroup"), dataIndex: "itemGroup", key: "itemGroup", width: 140 },
    { title: t("common.quantity"), dataIndex: "quantity", key: "quantity", width: 90, align: "right" },
    { title: t("purchaseDelivery.warehouseCode"), dataIndex: "warehouseCode", key: "warehouseCode", width: 100 },
    { title: t("purchaseDelivery.warehouseName"), dataIndex: "warehouseName", key: "warehouseName", width: 140 },
    { title: t("creditMemos.quantityPerPackage"), dataIndex: "quantityPerPackage", key: "quantityPerPackage", width: 110, align: "right", render: (v: number | null) => v ?? "—" },
    { title: t("purchaseDelivery.currency"), dataIndex: "currency", key: "currency", width: 80 },
    { title: t("purchaseDelivery.price"), dataIndex: "price", key: "price", width: 90, align: "right" },
    { title: t("purchaseDelivery.lineTotal"), dataIndex: "lineTotal", key: "lineTotal", width: 100, align: "right" },
    { title: t("purchaseDelivery.barCode"), dataIndex: "barCode", key: "barCode", width: 120, render: (v: string | null) => v ?? "—" },
    { title: t("purchaseDelivery.batchNumber"), dataIndex: "batchNumber", key: "batchNumber", width: 130, render: (v: string | null) => v ?? "—" },
    { title: t("purchaseDelivery.batchQuantity"), dataIndex: "batchQuantity", key: "batchQuantity", width: 110, align: "right" },
    { title: t("purchaseDelivery.batchExpiryDate"), dataIndex: "batchExpiryDate", key: "batchExpiryDate", width: 120, render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—") },
    { title: t("purchaseDelivery.batchManufactureDate"), dataIndex: "batchManufactureDate", key: "batchManufactureDate", width: 120, render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—") },
    { title: t("purchaseDelivery.binAbsEntry"), dataIndex: "binAbsEntry", key: "binAbsEntry", width: 100, align: "right" },
    { title: t("purchaseDelivery.binCode"), dataIndex: "binCode", key: "binCode", width: 120, render: (v: string | null) => v ?? "—" },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.admissionHistory")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.admission") },
          { label: t("nav.admissionHistory") },
        ]}
      />

      <ModuleCard>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
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
            <Label className="text-xs">{t("creditMemos.docNum")}</Label>
            <Input
              type="number"
              placeholder="—"
              value={filterDocNum}
              onChange={(e) => setFilterDocNum(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("creditMemos.cardCode")}</Label>
            <Input
              placeholder="—"
              value={filterCardCode}
              onChange={(e) => setFilterCardCode(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("creditMemos.cardName")}</Label>
            <Input
              placeholder="—"
              value={filterCardName}
              onChange={(e) => setFilterCardName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterStartDate")}</Label>
            <DatePicker
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={(date) => setFilterStartDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("admission.selectDate")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterEndDate")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(date) => setFilterEndDate(date ? date.format("YYYY-MM-DD") : "")}
              placeholder={t("admission.selectDate")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleApplyFilters} className="h-9">
              {t("common_apply")}
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="h-9">
              {t("common_clear_filters")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t("common_loading")}</span>
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
                    {pageIndex + 1}
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
        title={selectedDoc ? `${selectedDoc.cardName} — №${selectedDoc.docNum}` : t("nav.admissionHistory")}
        open={selectedDoc != null}
        onCancel={() => setSelectedDoc(null)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {selectedDoc && (
          <Table
            size="small"
            pagination={false}
            rowKey={(_, i) => String(i)}
            scroll={{ x: "max-content" }}
            columns={lineColumns}
            dataSource={selectedDoc.documentLines}
          />
        )}
      </Modal>
    </div>
  );
}
