import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
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
import { useSignalRWaiting } from "@/contexts/SignalRWaitingContext";
import { createReturnsHubConnection, type ReturnCompletedPayload } from "@/lib/returnsHub";
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
import { Table as AntTable, DatePicker, message, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { toast } from "@/components/ui/sonner";
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
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterCardCode, setFilterCardCode] = useState("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<CreditMemosFilters>({});

  const [lineReasons, setLineReasons] = useState<Record<number, number>>({});
  const [returnLoading, setReturnLoading] = useSignalRWaiting("returnDrafts");

  const returnMutation = useReturnMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageIndex(0);
      setAppliedFilters((prev) => ({
        ...prev,
        DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
        CardCode: filterCardCode.trim() || undefined,
        CardName: filterCardName.trim() || undefined,
      }));
    }, 750);
    return () => clearTimeout(timer);
  }, [filterDocNum, filterCardCode, filterCardName]);

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

  const handleClearFilters = () => {
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

  // When detail is loaded, default all lines to Valid (Yaroqli)
  useEffect(() => {
    const lines = detail?.documentLines ?? [];
    if (!selectedDocEntry || lines.length === 0) return;
    setLineReasons((prev) => {
      const hasAny = lines.some((line) => prev[line.lineNum] != null);
      if (hasAny) return prev;
      return Object.fromEntries(lines.map((line) => [line.lineNum, EReturnReasonType.Valid]));
    });
  }, [selectedDocEntry, detail?.documentLines]);

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

    connection.on("ProcessingCompleted", (payload: ReturnCompletedPayload) => {
      try {
        if (!payload?.isSuccess) {
          toast.error(payload?.message ?? t("error.somethingWentWrong"));
          return;
        }

        setRequiredTransfersNotification(true);
        queryClient.invalidateQueries({ queryKey: ["credit-memos"] });
        toast.success(payload.message);
      } finally {
        onDone();
      }
    });
    connection.onclose(onDone);

    try {
      await connection.start();
    } catch {
      toast.error(t("error.couldNotConnect"));
      onDone();
    }
  };

  const columns: ColumnsType<CreditMemoItem> = [
    {
      title: "DocEntry",
      dataIndex: "docEntry",
      key: "docEntry",
      width: 100,
      render: (val: number) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      title: t("creditMemos.docNum"),
      dataIndex: "docNum",
      key: "docNum",
      width: 120,
      render: (val: number) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      title: t("common.date"),
      dataIndex: "docDate",
      key: "docDate",
      width: 130,
      render: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      title: t("creditMemos.cardCode"),
      dataIndex: "cardCode",
      key: "cardCode",
      width: 130,
      render: (val: string) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      title: t("creditMemos.cardName"),
      dataIndex: "cardName",
      key: "cardName",
    },
    {
      title: t("creditMemos.documentStatus"),
      dataIndex: "documentStatus",
      key: "documentStatus",
      width: 140,
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: CreditMemoItem) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => handleOpenModal(record)}
        >
          <Eye className="w-4 h-4" />
          {t("common.see")}
        </Button>
      ),
    },
  ];

  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = pageIndex * PAGE_SIZE + items.length;

  return (
    <div className="relative min-h-full p-6 space-y-6">
      {returnLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("common_loading")}</p>
            <p className="text-xs text-muted-foreground">{t("signalR.waiting")}</p>
          </div>
        </div>
      )}
      <PageHeader
        title={t("nav.returnDrafts")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.return") },
          { label: t("nav.returnDrafts") },
        ]}
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("creditMemos.docNum")}</Label>
              <Input
                placeholder="—"
                value={filterDocNum}
                onChange={(e) => setFilterDocNum(e.target.value)}
                className="h-9 w-32"
              />
            </div>
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("creditMemos.cardCode")}</Label>
              <Input
                placeholder={t("common.search")}
                value={filterCardCode}
                onChange={(e) => setFilterCardCode(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-xs">{t("creditMemos.cardName")}</Label>
              <Input
                placeholder={t("common.search")}
                value={filterCardName}
                onChange={(e) => setFilterCardName(e.target.value)}
                className="h-9 w-52"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Label className="text-xs">{t("creditMemos.startDate")}</Label>
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
              <Label className="text-xs">{t("creditMemos.endDate")}</Label>
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
          </div>
          <Tooltip title={t("common.clearFilters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground flex-shrink-0"
              aria-label={t("common.clearFilters")}
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
        ) : (
          <>
            <AntTable
              columns={columns}
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
                    size="sm"
                    className="h-8"
                    onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
                    disabled={!hasPrevPage || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium">
                    {rangeStart} – {rangeEnd}
                  </span>
                  <Button
                    type="button"
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
          </>
        )}
      </ModuleCard>

      {/* Detail + Return modal */}
      <Dialog open={selectedDocEntry != null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] flex flex-col">
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
