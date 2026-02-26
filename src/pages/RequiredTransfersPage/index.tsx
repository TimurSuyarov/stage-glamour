import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
import {
  useRequiredTransfers,
  useRequiredTransferById,
  useTransferMutation,
  useAssignMutation,
  type RequiredTransferItem,
  type RequiredTransferLine,
} from "@/entities/RequiredTransfers/api";
import { useEmployees } from "@/entities/Employees/api";
import { Button } from "@/components/ui/button";
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
import { Eye, Loader2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { message } from "antd";

function getEmployeeId(emp: { employeeId?: number; EmployeeID?: number }): number {
  return emp.employeeId ?? emp.EmployeeID ?? 0;
}

function getEmployeeName(emp: { firstName?: string; lastName?: string }): string {
  return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "—";
}

export default function RequiredTransfersPage() {
  const { t } = useTranslation();
  const [modalRequestId, setModalRequestId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);
  // Computed percentages by request id (from lines: transferred / total)
  const [computedPercentages, setComputedPercentages] = useState<Record<number, number>>({});

  const { data: items = [], isLoading } = useRequiredTransfers();
  const { data: lines = [], isLoading: linesLoading } = useRequiredTransferById(modalRequestId);
  const { data: employees = [] } = useEmployees({ PageSize: 500 });
  const transferMutation = useTransferMutation();
  const assignMutation = useAssignMutation();

  const selectedRequest = items.find((r) => r.id === modalRequestId);

  // Computed percentage: (transferred count / total lines) * 100
  const completedPercentage =
    lines.length > 0
      ? Math.round((lines.filter((l) => l.isTransferred).length / lines.length) * 100)
      : 0;

  // Store computed % for the open request so table can show it
  useEffect(() => {
    if (modalRequestId != null && lines.length > 0) {
      setComputedPercentages((prev) => ({
        ...prev,
        [modalRequestId]: completedPercentage,
      }));
    }
  }, [modalRequestId, lines.length, completedPercentage]);

  const handleOpenModal = (request: RequiredTransferItem) => {
    setModalRequestId(request.id);
    setSelectedEmployeeId(null);
    setAssignPopoverOpen(false);
  };

  const handleCloseModal = () => {
    setModalRequestId(null);
    setSelectedEmployeeId(null);
  };

  const handleTransfer = (line: RequiredTransferLine) => {
    if (!modalRequestId || line.isTransferred) return;
    transferMutation.mutate(
      { requestId: modalRequestId, lineId: line.id },
      {
        onSuccess: () => {
          message.success(t("common.success") ?? "Done");
        },
        onError: () => {
          message.error(t("error.somethingWentWrong") ?? "Error");
        },
      }
    );
  };

  const handleAssign = () => {
    if (!modalRequestId || selectedEmployeeId == null) {
      message.warning(t("common.select") ?? "Select an employee");
      return;
    }
    assignMutation.mutate(
      { requestId: modalRequestId, userId: selectedEmployeeId },
      {
        onSuccess: () => {
          message.success(t("common.success") ?? "Assigned");
          setAssignPopoverOpen(false);
          setSelectedEmployeeId(null);
        },
        onError: () => {
          message.error(t("error.somethingWentWrong") ?? "Error");
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.requiredStockTransfer")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.requiredStockTransfer") },
        ]}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase">#</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("common.name") ?? "Name"}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("requiredTransfers.requiredQty") ?? "Required qty"}</TableHead>
              <TableHead className="text-xs font-semibold uppercase">{t("common.createdAt") ?? "Created"}</TableHead>
              <TableHead className="text-xs font-semibold uppercase w-24">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{request.id}</TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.requiredTransferQuantity}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(request.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-8"
                      onClick={() => handleOpenModal(request)}
                    >
                      <Eye className="w-4 h-4" />
                      {t("common.see") ?? "See"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail modal */}
      <Dialog open={modalRequestId != null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-muted-foreground">#{selectedRequest?.id}</span>
              <span>{selectedRequest?.name}</span>
              {lines.length > 0 && (
                <span className="text-muted-foreground font-normal text-sm">
                  ({lines.filter((l) => l.isTransferred).length}/{lines.length} — {completedPercentage}%)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Assign section */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <span className="text-sm font-medium">{t("requiredTransfers.assignedUser") ?? "Assigned user"}:</span>
                {selectedRequest.assignedUser ? (
                  <span className="text-sm text-muted-foreground">{selectedRequest.assignedUser}</span>
                ) : (
                  <>
                    <Popover open={assignPopoverOpen} onOpenChange={setAssignPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[280px] justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedEmployeeId != null
                              ? getEmployeeName(employees.find((e) => getEmployeeId(e) === selectedEmployeeId) ?? {})
                              : t("common.select")}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("common.search")} className="h-9" />
                          <CommandList className="max-h-[240px]">
                            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                            <CommandGroup>
                              {employees.map((emp) => {
                                const id = getEmployeeId(emp);
                                return (
                                  <CommandItem
                                    key={id}
                                    value={getEmployeeName(emp)}
                                    onSelect={() => {
                                      setSelectedEmployeeId(id);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        selectedEmployeeId === id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {getEmployeeName(emp)}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      size="sm"
                      onClick={handleAssign}
                      disabled={selectedEmployeeId == null || assignMutation.isLoading}
                    >
                      {assignMutation.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("requiredTransfers.assign") ?? "Assign"
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Lines table */}
              <div className="border rounded-lg overflow-auto flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase">{t("requiredTransfers.productName") ?? "Product"}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t("common.quantity") ?? "Qty"}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t("requiredTransfers.sourceBin") ?? "Source"}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t("requiredTransfers.targetBin") ?? "Target"}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase w-28"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {t("common.noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="max-w-[200px] truncate" title={line.productName}>
                            {line.productName}
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell className="font-mono text-sm">{line.sourceBinLocation}</TableCell>
                          <TableCell className="font-mono text-sm">{line.targetBinLocation}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleTransfer(line)}
                              disabled={line.isTransferred || transferMutation.isLoading}
                            >
                              {line.isTransferred
                                ? (t("requiredTransfers.transferred") ?? "Transferred")
                                : (t("requiredTransfers.transfer") ?? "Transfer")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
