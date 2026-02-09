import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { mockAdmissions } from "@/data/mockData";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

// Status configuration for badges
const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "neutral";
    label: string;
  }
> = {
  pending: { variant: "warning", label: "В ожидании" },
  processing: { variant: "info", label: "Обрабатывается" },
  blocked: { variant: "error", label: "Заблокирован" },
  completed: { variant: "success", label: "Завершено" },
};

// Item status icons
const itemStatusIcon = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  received: <CheckCircle className="w-4 h-4 text-status-success" />,
  mismatch: <AlertCircle className="w-4 h-4 text-status-warning" />,
};

// Available cells for selection
const availableCells = [
  "A-01-001",
  "A-01-002",
  "A-02-001",
  "A-02-002",
  "B-01-001",
  "B-01-002",
  "B-02-001",
  "B-02-002",
  "B-02-003",
  "C-01-001",
  "C-01-002",
  "D-01-001",
  "D-01-002",
];

export default function AdmissionPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    null
  );
  const [editedItems, setEditedItems] = useState<AdmissionItem[]>([]);

  // Filter admissions based on search
  const filteredAdmissions = useMemo(() => {
    if (!searchQuery.trim()) return mockAdmissions;
    const query = searchQuery.toLowerCase();
    return mockAdmissions.filter(
      (a) =>
        a.documentNumber.toLowerCase().includes(query) ||
        a.supplierName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Open admission detail modal
  const handleOpenAdmission = (admission: Admission) => {
    setSelectedAdmission(admission);
    setEditedItems([...admission.items]);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedAdmission(null);
    setEditedItems([]);
  };

  // Update item quantity
  const handleQtyChange = (itemId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              actualQty: qty,
              status:
                qty === item.plannedQty
                  ? "received"
                  : qty > 0
                  ? "mismatch"
                  : "pending",
            }
          : item
      )
    );
  };

  // Update item expiry date
  const handleExpiryChange = (itemId: string, value: string) => {
    setEditedItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, expiryDate: value } : item
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

  // Calculate total positions
  const getTotalPositions = (items: AdmissionItem[]) => {
    return items.reduce((sum, item) => sum + item.plannedQty, 0);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("admission.title") || "Поступление в ожидании"}
        description={
          t("admission.description") || "Приёмка товаров от поставщиков"
        }
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.admission") },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Фильтр
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Экспорт
            </Button>
          </div>
        }
      />

      <ModuleCard>
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру документа или поставщику..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Data table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Номер документа
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Поставщик
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Дата ожидания
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Позиций
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  TSD
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.map((admission) => (
                <tr
                  key={admission.id}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-4 font-medium">
                    {admission.documentNumber}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {admission.supplierName}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {admission.expectedDate}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-muted text-xs font-medium">
                      {admission.items.length} шт
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={admission.status} />
                  </td>
                  <td className="px-4 py-4">
                    {admission.tsdId ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                        <FileText className="w-3 h-3" />
                        {admission.tsdId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleOpenAdmission(admission)}
                    >
                      <Eye className="w-4 h-4" />
                      Открыть
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredAdmissions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Документы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Admission Detail Modal */}
      <Dialog
        open={!!selectedAdmission}
        onOpenChange={() => handleCloseModal()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Документ: {selectedAdmission?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedAdmission && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Document info header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg mb-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Поставщик
                  </p>
                  <p className="font-medium text-sm">
                    {selectedAdmission.supplierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Дата ожидания
                  </p>
                  <p className="font-medium text-sm">
                    {selectedAdmission.expectedDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Всего позиций
                  </p>
                  <p className="font-medium text-sm">
                    {getTotalPositions(selectedAdmission.items)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Статус</p>
                  <StatusBadge status={selectedAdmission.status} />
                </div>
              </div>

              {/* Positions section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Позиции документа</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Товар
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-16">
                          План
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-20">
                          Факт
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-32">
                          Срок годности
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-28">
                          Ячейка
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-12">
                          <Barcode className="w-4 h-4 mx-auto" />
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium w-16">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedItems.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-t",
                            item.status === "mismatch" &&
                              "bg-status-warning-bg/30"
                          )}
                        >
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.sku}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-medium">
                            {item.plannedQty}
                          </td>
                          <td className="px-3 py-3">
                            <Input
                              type="number"
                              min={0}
                              value={item.actualQty}
                              onChange={(e) =>
                                handleQtyChange(item.id, e.target.value)
                              }
                              className="w-16 h-8 text-center mx-auto"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Input
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e) =>
                                handleExpiryChange(item.id, e.target.value)
                              }
                              className="w-full h-8 text-xs"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Select
                              value={item.cellLocation || ""}
                              onValueChange={(value) =>
                                handleCellChange(item.id, value)
                              }
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Выбрать" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCells.map((cell) => (
                                  <SelectItem key={cell} value={cell}>
                                    {cell}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Barcode className="w-4 h-4 mx-auto text-muted-foreground" />
                          </td>
                          <td className="px-3 py-3 text-center">
                            {itemStatusIcon[item.status]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Привязать к TSD
                </Button>
                <Button className="gap-2 bg-status-success hover:bg-status-success/90">
                  <CheckCircle className="w-4 h-4" />
                  Завершить приёмку
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
