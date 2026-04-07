import request from "@/services";
import { useQuery } from "react-query";

export interface PurchaseDeliveryDocumentLine {
  lineNum: number;
  itemCode: string;
  smartupCode?: string | null;
  itemDescription: string;
  itemGroup: string | null;
  quantity: number;
  warehouseCode: string;
  warehouseName: string | null;
  quantityPerPackage: number | null;
  currency: string | null;
  price: number;
  lineTotal: number;
  barCode: string | null;
  batchNumber: string | null;
  batchQuantity: number;
  batchExpiryDate: string | null;
  batchManufactureDate: string | null;
  binAbsEntry: number;
  binCode: string | null;
  binOnHandQuantity?: number;
}

export interface PurchaseDeliveryItem {
  docEntry: number;
  docNum: number;
  docStatus: string;
  cardCode: string;
  cardName: string;
  docCurrency: string | null;
  docDate: string;
  docDueDate: string | null;
  taxDate: string | null;
  employeeId?: number;
  employeeFullName?: string | null;
  documentLines: PurchaseDeliveryDocumentLine[];
}

export interface PurchaseDeliveriesFilters {
  DocEntry?: number;
  DocEntries?: number;
  DocNum?: number;
  CardName?: string;
  CardCode?: string;
  StartDate?: string;
  EndDate?: string;
  PageSize?: number;
  Skip?: number;
}

function buildParams(filters?: PurchaseDeliveriesFilters): string {
  const params = new URLSearchParams();
  if (filters?.DocEntry != null) params.set("DocEntry", String(filters.DocEntry));
  if (filters?.DocEntries != null) params.set("DocEntries", String(filters.DocEntries));
  if (filters?.DocNum != null) params.set("DocNum", String(filters.DocNum));
  if (filters?.CardName != null) params.set("CardName", filters.CardName);
  if (filters?.CardCode != null) params.set("CardCode", filters.CardCode);
  if (filters?.StartDate != null) params.set("StartDate", filters.StartDate);
  if (filters?.EndDate != null) params.set("EndDate", filters.EndDate);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const q = params.toString();
  return q ? `?${q}` : "";
}

const fetchPurchaseDeliveries = async (
  filters: PurchaseDeliveriesFilters
): Promise<PurchaseDeliveryItem[]> => {
  const { data } = await request.get<{ items: PurchaseDeliveryItem[] }>(
    `/purchase-deliveries${buildParams(filters)}`
  );
  return data?.items ?? [];
};

export const usePurchaseDeliveries = (filters: PurchaseDeliveriesFilters | null) => {
  return useQuery({
    queryKey: ["purchase-deliveries", filters],
    queryFn: () => fetchPurchaseDeliveries(filters!),
    enabled: filters != null,
  });
};
