import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
import {
  useCreditMemos,
  type CreditMemosFilters,
  type CreditMemoItem,
  type CreditMemoLine,
} from "@/entities/CreditMemos/api";
import { EReturnReasonType } from "@/enums/returnReason";
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
} from "@/components/ui/dialog";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

const REASON_LABEL_KEYS: Record<number, string> = {
  [EReturnReasonType.Valid]: "returns.reasonValid",
  [EReturnReasonType.Damaged]: "returns.reasonDamaged",
  [EReturnReasonType.Expired]: "returns.reasonExpired",
};

export default function CreditMemosHistoryPage() {
  const { t } = useTranslation();
  const [selectedDoc, setSelectedDoc] = useState<CreditMemoItem | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterCardCode, setFilterCardCode] = useState("");
  const [filterCardName, setFilterCardName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<CreditMemosFilters>({});

  const filters: CreditMemosFilters = useMemo(
    () => ({
      ...appliedFilters,
      PageSize: PAGE_SIZE,
      Skip: pageIndex * PAGE_SIZE,
    }),
    [appliedFilters, pageIndex]
  );

  const { data: items = [], isLoading } = useCreditMemos(filters);
  const hasNextPage = items.length >= PAGE_SIZE;
  const hasPrevPage = pageIndex > 0;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      DocNum: filterDocNum.trim() ? Number(filterDocNum) : undefined,
      CardCode: filterCardCode.trim() || undefined,
      CardName: filterCardName.trim() || undefined,
      StartDate: filterStartDate || undefined,
      EndDate: filterEndDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterDocNum("");
    setFilterCardCode("");
    setFilterCardName("");
    setFilterStartDate("");
    setFilterEndDate("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const lines = selectedDoc?.stockTransferLines ?? [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.returnHistory")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.return") },
          { label: t("nav.returnHistory") },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-card">
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

      {/* Main table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.docNum")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.cardName")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.cardCode")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("common.date")}</TableHead>
              <TableHead className="text-xs font-semibold uppercase w-24">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((doc) => (
                <TableRow key={doc.docEntry} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{doc.docNum}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={doc.cardName}>
                    {doc.cardName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{doc.cardCode}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.docDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-8"
                      onClick={() => setSelectedDoc(doc)}
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

      {/* Lines modal */}
      <Dialog open={selectedDoc != null} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              {selectedDoc && (
                <>
                  <span className="font-mono text-muted-foreground">#{selectedDoc.docEntry}</span>
                  <span>{selectedDoc.cardName}</span>
                  <span className="text-muted-foreground font-normal text-sm">
                    ({selectedDoc.docNum}, {selectedDoc.docDate})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="border rounded-lg overflow-auto flex-1 min-h-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase w-12">#</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("creditMemos.itemDescription")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase w-20">{t("common.quantity")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("returns.condition")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("returns.batchNumber")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">{t("admission.expiryDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line: CreditMemoLine, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                        <TableCell className="max-w-[240px] truncate" title={line.itemDescription}>
                          {line.itemDescription}
                        </TableCell>
                        <TableCell className="text-center">{line.quantity}</TableCell>
                        <TableCell>
                          {line.cancelItemType != null
                            ? t(REASON_LABEL_KEYS[line.cancelItemType] ?? "common.noData")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{line.batchNumber ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {line.batchExpiryDate
                            ? new Date(line.batchExpiryDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
