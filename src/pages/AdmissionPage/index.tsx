import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "react-i18next";
import {
  usePurchaseInvoices,
  useFromInvoiceMutation,
  type PurchaseInvoicesFilters,
  type FromInvoiceRequestBody,
} from "@/entities/PurchaseInvoices/api";
import { useBinLocations } from "@/entities/BinLocations/api";
import { Admission, AdmissionItem } from "@/types/wms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Barcode,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { message, Tooltip, DatePicker, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";


// Item status icons
const itemStatusIcon = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  received: <CheckCircle className="w-4 h-4 text-status-success" />,
  mismatch: <AlertCircle className="w-4 h-4 text-status-warning" />,
};

const AdmissionPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    null
  );
  const [editedItems, setEditedItems] = useState<AdmissionItem[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [openCellPopoverId, setOpenCellPopoverId] = useState<string | null>(null);

  // API filter form state
  const [filterDocNum, setFilterDocNum] = useState<string>("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<PurchaseInvoicesFilters>({});
  const [pageIndex, setPageIndex] = useState(0);

  const pageSize = 20;
  
  const filters: PurchaseInvoicesFilters = useMemo(() => {
    const f: PurchaseInvoicesFilters = { skip: pageIndex * pageSize };
    if (appliedFilters.DocNum != null) f.DocNum = appliedFilters.DocNum;
    if (appliedFilters.CardName) f.CardName = appliedFilters.CardName;
    if (appliedFilters.StartDate) f.StartDate = appliedFilters.StartDate;
    if (appliedFilters.EndDate) f.EndDate = appliedFilters.EndDate;
    return f;
  }, [appliedFilters, pageIndex, pageSize]);

  const { data: admissionsFromApi = [], isLoading, error } = usePurchaseInvoices(filters);
  const { data: binLocations = [] } = useBinLocations();
  const fromInvoiceMutation = useFromInvoiceMutation();
  const hasNextPage = admissionsFromApi.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = (pageIndex + 1) * pageSize;

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

  // Client-side search on top of API results
  const filteredAdmissions = useMemo(() => {
    if (!searchQuery.trim()) return admissionsFromApi;
    const query = searchQuery.toLowerCase();
    return admissionsFromApi.filter(
      (a) =>
        a.documentNumber.toLowerCase().includes(query) ||
        a.supplierName.toLowerCase().includes(query)
    );
  }, [admissionsFromApi, searchQuery]);

  // Open admission detail modal
  const handleOpenAdmission = (admission: Admission) => {
    setSelectedAdmission(admission);
    setEditedItems([...admission.items]);
    setShowValidationErrors(false);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedAdmission(null);
    setEditedItems([]);
    setShowValidationErrors(false);
  };

  // Display items (edited or original)
  const displayItems = selectedAdmission
    ? editedItems.length
      ? editedItems
      : selectedAdmission.items
    : [];

  // Required fields per item: actualQty > 0 and <= quantity (from GET), expiry, manufacturing, admission dates, cell
  const isItemValid = (item: AdmissionItem) =>
    (item.actualQty ?? 0) > 0 &&
    (item.actualQty ?? 0) <= (item.quantity ?? 0) &&
    !!item.expiryDate?.trim() &&
    !!item.manufacturingDate?.trim() &&
    !!item.addmisionDate?.trim() &&
    !!item.cellLocation?.trim();    

  const isFormValid =
    selectedAdmission != null &&
    displayItems.length > 0 &&
    displayItems.every(isItemValid);

  const columns: ColumnsType<Admission> = [
    {
      title: t("admission.docNumber"),
      dataIndex: "documentNumber",
      key: "documentNumber",
      width: 120,
    },
    {
      title: t("admission.supplier"),
      dataIndex: "supplierName",
      key: "supplierName",
    },
    {
      title: t("admission.expectedDate"),
      dataIndex: "expectedDate",
      key: "expectedDate",
      width: 150,
    },
    {
      title: t("admission.positions"),
      key: "positions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Admission) => (
        <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-muted text-xs font-medium">
          {record.items.length} {t("admission.positionsShort")}
        </span>
      ),
    },
    {
      title: t("common.status"),
      key: "status",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Admission) => (
        <StatusBadge status={record.status} />
      ),
    },
    {
      title: "TSD",
      dataIndex: "tsdId",
      key: "tsdId",
      width: 120,
      render: (tsdId: string | undefined) => {
        if (tsdId) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <FileText className="w-3 h-3" />
              {tsdId}
            </span>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Admission) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => handleOpenAdmission(record)}
        >
          <Eye className="w-4 h-4" />
          {t("admission.open")}
        </Button>
      ),
    },
  ];

  // Build from-invoice payload and submit (complete admission)
  const handleCompleteAdmission = async () => {
    if (!selectedAdmission) return;
    if (!isFormValid) {
      setShowValidationErrors(true);
      message.warning(t("admission.fillRequiredFields"));
      return;
    }
    const items = displayItems;
    console.log(items, "items");
    
    const docEntry = Number(selectedAdmission.id);
    const now = new Date().toISOString();
    const body: FromInvoiceRequestBody = {
      cardCode: selectedAdmission.supplierId,
      container: selectedAdmission.container ?? null,
      documentLines: items.map((item) => {
        const quantity = item.actualQty;
        return {
          itemCode: item.itemCode,
          quantity,
          warehouseCode: item.warehouseCode ?? "",
          baseType: 18,
          baseEntry: docEntry,
          batchNumbers: [
            {
              expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : now,
              manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate).toISOString() : now,
              addmisionDate: item.addmisionDate ? new Date(item.addmisionDate).toISOString() : now,
              quantity,
            },
          ],
          documentLinesBinAllocations: item.cellLocation
            ? [
                {
                  binAbsEntry: Number(item.cellLocation),
                  quantity,
                  serialAndBatchNumbersBaseLine: 0,
                },
              ]
            : [],
        };
      }),
    };
    try {
      console.log(body);
      await fromInvoiceMutation.mutateAsync(body);
      handleCloseModal();
      message.success(t("admission.completeAdmissionSuccess"));
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t("common.error")
      );
    }
  };

  // Update item quantity
  const handleQtyChange = (itemId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setEditedItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const maxQty = item.quantity;
          const actualQty = Math.min(qty, maxQty); // Ensure it doesn't exceed quantity from GET
          return {
            ...item,
            actualQty,
            status:
              actualQty === maxQty
                ? "received"
                : actualQty > 0
                ? "mismatch"
                : "pending",
          };
        }
        return item;
      })
    );
  };

  // Update item expiry date
  const handleExpiryChange = (itemId: string, date: Dayjs | null) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, expiryDate: date ? date.format("YYYY-MM-DD") : "" }
          : item
      )
    );
  };

  // Update item manufacturing date
  const handleManufacturingChange = (itemId: string, date: Dayjs | null) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, manufacturingDate: date ? date.format("YYYY-MM-DD") : "" }
          : item
      )
    );
  };

  // Update item admission date
  const handleAdmissionDateChange = (itemId: string, date: Dayjs | null) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, addmisionDate: date ? date.format("YYYY-MM-DD") : "" }
          : item
      )
    );
  };

  // Update item cell location
  const handleCellChange = (itemId: string, value: string) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, cellLocation: value } : item
      )
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("admission.title")}
        description={
          t("admission.description") 
        }
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.admission") },
        ]}
        actions={
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              {t("common.export")}
            </Button>
        }
      />

      <ModuleCard>
        {/* Filters (API query params) */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterDocNum")}</Label>
            <Input
              type="number"
              placeholder={t("admission.filterDocNum")}
              value={filterDocNum}
              onChange={(e) => setFilterDocNum(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterCardName")}</Label>
            <Input
              placeholder={t("admission.filterCardName")}
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
          <Button onClick={handleApplyFilters} className="h-9">
            {t("common.apply")}
          </Button>
          <Tooltip title={t("common.clearFilters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-accent text-accent-foreground"
              aria-label={t("common.clearFilters")}
            >
              <ClearOutlined className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>


        {/* Data table */}
        <Table
          columns={columns}
          dataSource={filteredAdmissions}
          rowKey="id"
          loading={isLoading}
          locale={{
            emptyText: error ? (
              <div className="py-12 text-center text-destructive">
                {error instanceof Error ? error.message : String(error)}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {t("admission.noDocuments")}
              </div>
            ),
          }}
          pagination={{
            current: pageIndex + 1,
            pageSize: pageSize,
            total: undefined, // We don't know total from API
            showSizeChanger: false,
            showTotal: (total, range) =>
              t("admission.showingRange", {
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
      </ModuleCard>

      {/* Admission Detail Modal */}
      <Dialog
        open={!!selectedAdmission}
        onOpenChange={() => handleCloseModal()}
      >
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>
              {t("admission.documentTitle", { number: selectedAdmission?.documentNumber ?? "" })}
            </DialogTitle>
          </DialogHeader>

          {selectedAdmission && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Document info header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg mb-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("admission.supplier")}
                  </p>
                  <p className="font-medium text-sm">
                    {selectedAdmission.supplierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("admission.expectedDate")}
                  </p>
                  <p className="font-medium text-sm">
                    {selectedAdmission.expectedDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("admission.totalPositions")}
                  </p>
                  <p className="font-medium text-sm">
                    {selectedAdmission.items.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("common.status")}</p>
                  <StatusBadge status={selectedAdmission.status} />
                </div>
              </div>

              {/* Document lines (positions) section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">{t("admission.documentPositions")}</h3>
                <div className="border rounded-lg overflow-x-auto overflow-y-hidden">
                  <table className="w-full text-sm border-collapse min-w-[900px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium border-r border-border">
                          {t("admission.product")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-16 border-r border-border">
                          {t("admission.plan")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-20 border-r border-border">
                          {t("admission.actual")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-32 border-r border-border">
                          {t("admission.expiryDate")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-32 border-r border-border">
                          {t("admission.manufacturingDate")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-32 border-r border-border">
                          {t("admission.admissionDate")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-28 border-r border-border">
                          {t("admission.cell")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-16 border-r border-border last:border-r-0">
                          {t("common.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item) => {
                        const showErr = showValidationErrors;
                        const qtyInvalid = showErr && (item.actualQty ?? 0) <= 0;
                        const expiryInvalid = showErr && !item.expiryDate?.trim();
                        const manufacturingInvalid = showErr && !item.manufacturingDate?.trim();
                        const admissionDateInvalid = showErr && !item.addmisionDate?.trim();
                        const cellInvalid = showErr && !item.cellLocation?.trim();
                        return (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-t border-border",
                            item.status === "mismatch" &&
                              "bg-status-warning-bg/30"
                          )}
                        >
                          <td className="px-3 py-3 border-r border-border">
                              <p className="font-medium">{item.name || "—"}</p>
                          </td>
                          <td className="px-3 py-3 text-center font-medium border-r border-border">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={item.actualQty}
                              onChange={(e) =>
                                handleQtyChange(item.id, e.target.value)
                              }
                              className={cn(
                                "w-16 h-8 text-center mx-auto",
                                qtyInvalid && "border-destructive ring-1 ring-destructive"
                              )}
                            />
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <DatePicker
                              value={item.expiryDate ? dayjs(item.expiryDate) : null}
                              onChange={(date) => handleExpiryChange(item.id, date)}
                              placeholder={t("admission.selectDate")}
                              className={cn(
                                "w-full h-8 text-xs",
                                expiryInvalid && "!border-destructive"
                              )}
                              format="YYYY-MM-DD"
                              size="small"
                            />
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <DatePicker
                              value={item.manufacturingDate ? dayjs(item.manufacturingDate) : null}
                              onChange={(date) => handleManufacturingChange(item.id, date)}
                              placeholder={t("admission.selectDate")}
                              className={cn(
                                "w-full h-8 text-xs",
                                manufacturingInvalid && "!border-destructive"
                              )}
                              format="YYYY-MM-DD"
                              size="small"
                            />
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <DatePicker
                              value={item.addmisionDate ? dayjs(item.addmisionDate) : null}
                              onChange={(date) => handleAdmissionDateChange(item.id, date)}
                              placeholder={t("admission.selectDate")}
                              className={cn(
                                "w-full h-8 text-xs",
                                admissionDateInvalid && "!border-destructive"
                              )}
                              format="YYYY-MM-DD"
                              size="small"
                            />
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <Popover
                              open={openCellPopoverId === item.id}
                              onOpenChange={(open) =>
                                setOpenCellPopoverId(open ? item.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full h-8 text-xs justify-between font-normal",
                                    cellInvalid &&
                                      "border-destructive ring-1 ring-destructive"
                                  )}
                                >
                                  <span className="truncate">
                                    {item.cellLocation
                                      ? binLocations.find(
                                          (b) =>
                                            String(b.absEntry) ===
                                            item.cellLocation
                                        )?.binCode ?? item.cellLocation
                                      : t("common.select")}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput
                                    placeholder={t("common.search")}
                                    className="h-9"
                                  />
                                  <CommandList className="max-h-[280px]">
                                    <CommandEmpty>
                                      {t("common.noResults")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {binLocations.map((bin) => (
                                        <CommandItem
                                          key={bin.id}
                                          value={bin.binCode}
                                          onSelect={() => {
                                            handleCellChange(
                                              item.id,
                                              String(bin.absEntry)
                                            );
                                            setOpenCellPopoverId(null);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4 shrink-0",
                                              item.cellLocation ===
                                                String(bin.absEntry)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {bin.binCode}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="px-3 py-3 text-center border-r border-border last:border-r-0">
                            {itemStatusIcon[item.status]}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation message */}
              {showValidationErrors && !isFormValid && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t("admission.fillRequiredFields")}</span>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  {t("order.bindToTsd")}
                </Button>
                <Button
                  className="gap-2 bg-status-success hover:bg-status-success/90"
                  onClick={handleCompleteAdmission}
                  disabled={!isFormValid || fromInvoiceMutation.isLoading}
                >
                  {fromInvoiceMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {t("admission.completeAdmission")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionPage;
