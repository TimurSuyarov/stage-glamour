import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
import {
  useCreditMemosDrafts,
  useCreditMemoDraftDetail,
  useReturnMutation,
  type CreditMemosFilters,
  type CreditMemoItem,
  type ReturnLinePayload,
} from "@/entities/CreditMemos/api";
import { EReturnReasonType } from "@/enums/returnReason";
import { createReturnsHubConnection } from "@/lib/returnsHub";
import { useRequiredTransfersNotification } from "@/contexts/RequiredTransfersNotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { DatePicker, message } from "antd";
import { cn } from "@/lib/utils";
import { useQueryClient } from "react-query";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

const REASON_BUTTONS = [
  {
    reason: EReturnReasonType.Valid,
    labelKey: "returns.reasonValid",
    icon: CheckCircle2,
    activeClass: "bg-green-600 text-white border-green-600 hover:bg-green-700",
  },
  {
    reason: EReturnReasonType.Damaged,
    labelKey: "returns.reasonDamaged",
    icon: XCircle,
    activeClass: "bg-red-600 text-white border-red-600 hover:bg-red-700",
  },
  {
    reason: EReturnReasonType.Expired,
    labelKey: "returns.reasonExpired",
    icon: AlertTriangle,
    activeClass: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
  },
];

export default function CreditMemosDraftsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setRequiredTransfersNotification } = useRequiredTransfersNotification();

  const [selectedDocEntry, setSelectedDocEntry] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [filterDocEntry, setFilterDocEntry] = useState("");
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterCardCode, setFilterCardCode] = useState("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<CreditMemosFilters>({});

  const [lineReasons, setLineReasons] = useState<Record<number, number>>({});
  const [returnLoading, setReturnLoading] = useState(false);

  const returnMutation = useReturnMutation();

  const filters: CreditMemosFilters = useMemo(
    () => ({
      ...appliedFilters,
      Status: 2,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading } = useCreditMemosDrafts(filters);
  const { data: detail, isLoading: detailLoading } = useCreditMemoDraftDetail(selectedDocEntry);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocEntry: filterDocEntry.trim() ? Number(filterDocEntry) : undefined,
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      CardCode: filterCardCode.trim() || undefined,
      CardName: filterCardName.trim() || undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterDocEntry("");
    setFilterDocNum("");
    setFilterCardCode("");
    setFilterCardName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const handleOpenModal = (doc: CreditMemoItem) => {
    setSelectedDocEntry(doc.docEntry);
    setLineReasons({});
  };

  const handleCloseModal = () => {
    setSelectedDocEntry(null);
    setLineReasons({});
  };

  const setReason = (lineNum: number, reason: number) => {
    setLineReasons((prev) => ({ ...prev, [lineNum]: reason }));
  };

  const detailLines = detail?.documentLines ?? [];
  const allLinesHaveReason =
    detailLines.length > 0 &&
    detailLines.every((line) => lineReasons[line.lineNum] != null);

  const handleReturn = async () => {
    if (!selectedDocEntry || !allLinesHaveReason) return;

    const payload: ReturnLinePayload[] = detailLines.map((line) => ({
      lineNum: line.lineNum,
      reasonId: lineReasons[line.lineNum],
    }));

    setReturnLoading(true);
    try {
      await returnMutation.mutateAsync({ docEntry: selectedDocEntry, lines: payload });
    } catch {
      message.error(t("error.somethingWentWrong"));
      setReturnLoading(false);
      return;
    }

    handleCloseModal();

    const connection = createReturnsHubConnection();
    const onDone = () => {
      connection.stop().catch(() => {});
      setReturnLoading(false);
    };

    connection.on("ProcessingCompleted", () => {
      setRequiredTransfersNotification(true);
      queryClient.invalidateQueries({ queryKey: ["credit-memos"] });
      message.success(t("common.success"));
      onDone();
    });
    connection.onclose(onDone);

    try {
      await connection.start();
    } catch {
      message.error(t("error.couldNotConnect"));
      setRequiredTransfersNotification(true);
      onDone();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.returnDrafts")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.return") },
          { label: t("nav.returnDrafts") },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-card">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.docEntry")}</Label>
          <Input
            placeholder="—"
            value={filterDocEntry}
            onChange={(e) => setFilterDocEntry(e.target.value)}
            className="h-9 w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.docNum")}</Label>
          <Input
            placeholder="—"
            value={filterDocNum}
            onChange={(e) => setFilterDocNum(e.target.value)}
            className="h-9 w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.cardCode")}</Label>
          <Input
            placeholder={t("common.search")}
            value={filterCardCode}
            onChange={(e) => setFilterCardCode(e.target.value)}
            className="h-9 w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.cardName")}</Label>
          <Input
            placeholder={t("common.search")}
            value={filterCardName}
            onChange={(e) => setFilterCardName(e.target.value)}
            className="h-9 w-48"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.startDate")}</Label>
          <DatePicker
            value={filterStartDate ? dayjs(filterStartDate) : null}
            onChange={(date) =>
              setFilterStartDate(date ? date.format("YYYY-MM-DD") : "")
            }
            className="h-9 w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t("creditMemos.endDate")}</Label>
          <DatePicker
            value={filterEndDate ? dayjs(filterEndDate) : null}
            onChange={(date) =>
              setFilterEndDate(date ? date.format("YYYY-MM-DD") : "")
            }
            className="h-9 w-36"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={handleApplyFilters}>
          {t("common.apply")}
        </Button>
        <Button variant="ghost" size="sm" className="h-9" onClick={handleClearFilters}>
          {t("common.clearFilters")}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase">DocEntry</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.docNum")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("common.date")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.cardCode")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.cardName")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.documentStatus")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase w-24">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((doc) => (
                <TableRow key={doc.docEntry} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{doc.docEntry}</TableCell>
                  <TableCell className="font-mono text-sm">{doc.docNum}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(doc.docDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{doc.cardCode}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={doc.cardName}>
                    {doc.cardName}
                  </TableCell>
                  <TableCell className="text-sm">{doc.documentStatus}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-8"
                      onClick={() => handleOpenModal(doc)}
                    >
                      <Eye className="w-4 h-4" />
                      {t("common.see")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between px-4 py-2 border rounded-md bg-card">
          <p className="text-sm text-muted-foreground">
            {pageIndex * PAGE_SIZE + 1}–{pageIndex * PAGE_SIZE + items.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPageIndex((p) => p - 1)}
              disabled={!hasPrevPage || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={!hasNextPage || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail + Return modal */}
      <Dialog open={selectedDocEntry != null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              {detail && (
                <>
                  <span className="font-mono text-muted-foreground">#{detail.docEntry}</span>
                  <span>{detail.cardName}</span>
                  <span className="text-muted-foreground font-normal text-sm">
                    ({detail.docNum}, {new Date(detail.docDate).toLocaleDateString()})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="border rounded-lg overflow-auto flex-1 min-h-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase w-12">#</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.itemDescription")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase w-16">{t("common.quantity")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("returns.batchNumber")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("admission.expiryDate")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("returns.condition")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailLines.map((line, idx) => {
                    const batch = line.batchNumbers?.[0];
                    const selectedReason = lineReasons[line.lineNum];
                    return (
                      <TableRow key={line.lineNum}>
                        <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="font-medium truncate" title={line.itemDescription}>
                            {line.itemDescription}
                          </div>
                          <div className="text-xs text-muted-foreground">{line.itemCode}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-center">{line.quantity}</TableCell>
                        <TableCell className="text-sm">
                          {batch?.batchNumber ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {batch?.expiryDate
                            ? new Date(batch.expiryDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {REASON_BUTTONS.map(({ reason, labelKey, icon: Icon, activeClass }) => {
                              const isActive = selectedReason === reason;
                              return (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => setReason(line.lineNum, reason)}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                                    isActive
                                      ? activeClass
                                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  {t(labelKey)}
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              {t("common.close")}
            </Button>
            <Button
              onClick={handleReturn}
              disabled={!allLinesHaveReason || returnLoading}
            >
              {returnLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t("returns.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
