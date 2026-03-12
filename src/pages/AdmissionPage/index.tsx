import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "react-i18next";
import {
  usePurchaseInvoices,
  useFromInvoiceMutation,
  useAssignEmployeeToPurchaseInvoice,
  useDetachAdmissionEmployee,
  type PurchaseInvoicesFilters,
  type FromInvoiceRequestBody,
} from "@/entities/PurchaseInvoices/api";
import { useEmployees } from "@/entities/Employees/api";
import { useBinLocationsInfinite } from "@/entities/BinLocations/api";
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
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { message, Tooltip, DatePicker, Table, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);


// Item status icons
const itemStatusIcon = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  received: <CheckCircle className="w-4 h-4 text-status-success" />,
  mismatch: <AlertCircle className="w-4 h-4 text-status-warning" />,
};

// ─── BinLocation dropdown with infinite scroll + debounced search ────────────
function BinLocationSelect({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce: wait 400 ms after last keystroke before firing API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBinLocationsInfinite(debouncedSearch || undefined);

  const items = useMemo(() => data?.pages.flat() ?? [], [data]);
  const selectedBin = items.find((b) => String(b.absEntry) === value);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full h-8 text-xs justify-between font-normal",
            hasError && "border-destructive ring-1 ring-destructive"
          )}
        >
          <span className="truncate">
            {value ? (selectedBin?.binCode ?? value) : t("common.select")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("common.search")}
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            className="max-h-[280px] overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (isFetchingNextPage || !hasNextPage) return;
              if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
                fetchNextPage();
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((bin) => (
                  <CommandItem
                    key={bin.id}
                    value={String(bin.absEntry)}
                    onSelect={() => {
                      onChange(String(bin.absEntry));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === String(bin.absEntry)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {bin.binCode}
                  </CommandItem>
                ))}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const AdmissionPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    null
  );
  const [editedItems, setEditedItems] = useState<AdmissionItem[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<number | null>(null);
  const [pendingEmployeeId, setPendingEmployeeId] = useState<number | null>(null);

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
  const { data: employees = [] } = useEmployees({ PageSize: 500 });
  const fromInvoiceMutation = useFromInvoiceMutation();
  const assignMutation = useAssignEmployeeToPurchaseInvoice();
  const detachMutation = useDetachAdmissionEmployee();
  const hasNextPage = admissionsFromApi.length >= pageSize;

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
    const empId = admission.assignedEmployeeId ?? null;
    setAssignedEmployeeId(empId);
    setPendingEmployeeId(empId);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedAdmission(null);
    setEditedItems([]);
    setShowValidationErrors(false);
    setAssignedEmployeeId(null);
    setPendingEmployeeId(null);
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
    (item.actualQty ?? 0) <= (item.remainingOpenQuantity ?? item.quantity ?? 0) &&
    !!item.expiryDate?.trim() &&
    !!item.cellLocation?.trim();

  const isFormValid =
    selectedAdmission != null &&
    assignedEmployeeId != null &&
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
      title: t("admission.assignEmployee"),
      key: "assignedEmployee",
      width: 160,
      render: (_: any, record: Admission) => {
        if (record.assignedEmployeeId) {
          const emp = employees.find(
            (e) => (e.employeeId ?? e.EmployeeID) === record.assignedEmployeeId
          );
          if (emp) {
            return (
              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                <FileText className="w-3 h-3" />
                {emp.firstName} {emp.lastName}
              </span>
            );
          }
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
        const expiryIso =
          item.expiryDate?.trim() ?
            (item.expiryDate.includes("T") ? item.expiryDate : `${item.expiryDate}T00:00:00.000Z`)
            : now;
        return {
          itemCode: item.itemCode,
          quantity,
          warehouseCode: item.warehouseCode ?? "",
          baseType: 18,
          baseEntry: docEntry,
          batchNumbers: [
            {
              expiryDate: expiryIso,
              manufacturingDate: now,
              addmisionDate: now,
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

  // Assign employee
  const handleAssignEmployee = async () => {
    if (!pendingEmployeeId || !selectedAdmission) return;
    try {
      await assignMutation.mutateAsync({
        docEntry: Number(selectedAdmission.id),
        employeeId: pendingEmployeeId,
      });
      setAssignedEmployeeId(pendingEmployeeId);
      message.success(t("common.success"));
    } catch {
      message.error(t("common.error"));
    }
  };

  // Detach employee
  const handleDetachEmployee = async () => {
    if (!selectedAdmission) return;
    try {
      await detachMutation.mutateAsync(Number(selectedAdmission.id));
      setAssignedEmployeeId(null);
      setPendingEmployeeId(null);
      message.success(t("common.success"));
    } catch {
      message.error(t("common.error"));
    }
  };

  // Update item quantity
  const handleQtyChange = (itemId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setEditedItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const maxQty = item.remainingOpenQuantity ?? item.quantity;
          const actualQty = Math.min(qty, maxQty);
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

  // Update item expiry date (store as YYYY-MM-DD so selected calendar date is preserved, no timezone shift)
  const handleExpiryChange = (itemId: string, date: Dayjs | null) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, expiryDate: date ? date.format("YYYY-MM-DD") : "" }
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
            <Label className="text-xs">{t("admission.filterSupplier")}</Label>
            <Input
              placeholder={t("admission.filterSupplier")}
              value={filterCardName}
              onChange={(e) => setFilterCardName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterStartDate")}</Label>
            <DatePicker
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={handleStartDateChange}
              placeholder={t("admission.selectDate")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("admission.filterEndDate")}</Label>
            <DatePicker
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={handleEndDateChange}
              placeholder={t("admission.selectDate")}
              className="h-9 w-full"
              format="YYYY-MM-DD"
            />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <Tooltip title={t("common.clearFilters")}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                className="h-9 w-9"
                aria-label={t("common.clearFilters")}
              >
                <ClearOutlined className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
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
        <DialogContent className="w-[1200px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("admission.documentTitle", { number: selectedAdmission?.documentNumber ?? "" })}
            </DialogTitle>
          </DialogHeader>

          {selectedAdmission && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Document info + employee assignment */}
              <div className="p-4 bg-muted/30 rounded-lg mb-6 space-y-3">
                {/* Row 1: document meta + status */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("admission.supplier")}</p>
                    <p className="font-medium text-sm">{selectedAdmission.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("admission.expectedDate")}</p>
                    <p className="font-medium text-sm">{selectedAdmission.expectedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("admission.totalPositions")}</p>
                    <p className="font-medium text-sm">{selectedAdmission.items.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("common.status")}</p>
                    <StatusBadge status={selectedAdmission.status} />
                  </div>
                </div>

                {/* Row 2: employee assignment */}
                <div className="flex flex-wrap items-end gap-6 pt-3 border-t border-border">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-xs text-muted-foreground mb-1">{t("admission.assignEmployee")}</p>
                    {assignedEmployeeId ? (
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {(() => {
                            const emp = employees.find(
                              (e) => (e.employeeId ?? e.EmployeeID) === assignedEmployeeId
                            );
                            return emp ? `${emp.firstName} ${emp.lastName}` : "—";
                          })()}
                        </p>
                        <button
                          type="button"
                          onClick={handleDetachEmployee}
                          disabled={detachMutation.isLoading}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={t("common.remove")}
                        >
                          {detachMutation.isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select
                          className="min-w-[200px]"
                          size="middle"
                          placeholder={t("admission.selectEmployee")}
                          value={pendingEmployeeId}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          status={showValidationErrors && !assignedEmployeeId ? "error" : undefined}
                          onChange={setPendingEmployeeId}
                          getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
                          options={employees.map((e) => ({
                            value: e.employeeId ?? e.EmployeeID ?? 0,
                            label: `${e.firstName} ${e.lastName}`,
                          }))}
                        />
                        <Button
                          size="sm"
                          onClick={handleAssignEmployee}
                          disabled={!pendingEmployeeId || assignMutation.isLoading}
                        >
                          {assignMutation.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("inventoryCountings.assign")
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document lines (positions) section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">{t("admission.documentPositions")}</h3>
                <div className="border rounded-lg overflow-x-auto overflow-y-hidden">
                  <table className="w-full text-sm border-collapse min-w-[900px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium border-r border-border w-28">
                          {t("common.itemCode")}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium border-r border-border w-44">
                          {t("admission.product")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-16 border-r border-border">
                          {t("admission.plan")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-24 border-r border-border">
                          {t("admission.boxCount")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-28 border-r border-border">
                          {t("admission.actual")}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-32 border-r border-border">
                          {t("admission.expiryDate")}
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
                          <td className="px-3 py-3 border-r border-border w-28">
                            <span className="font-mono text-xs text-muted-foreground">
                              {item.itemCode ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-border w-44">
                            <p className="font-medium text-xs truncate max-w-[160px]" title={item.name || "—"}>
                              {item.name || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-center font-medium border-r border-border">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-center border-r border-border tabular-nums">
                            {item.quantityPerPackage != null && item.quantityPerPackage > 0
                              ? Number((item.quantity / item.quantityPerPackage).toFixed(1))
                              : "—"}
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <Input
                              type="number"
                              min={0}
                              max={item.remainingOpenQuantity ?? item.quantity}
                              value={item.actualQty}
                              onChange={(e) =>
                                handleQtyChange(item.id, e.target.value)
                              }
                              className={cn(
                                "min-w-[5.5rem] w-24 h-8 text-center mx-auto tabular-nums",
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
                              getPopupContainer={() => document.body}
                            />
                          </td>
                          <td className="px-3 py-3 border-r border-border">
                            <BinLocationSelect
                              value={item.cellLocation ?? ""}
                              onChange={(val) => handleCellChange(item.id, val)}
                              hasError={cellInvalid}
                            />
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
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
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
