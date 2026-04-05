import request from "@/services";
import { useQuery } from "react-query";

export interface StockTransferLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  quantityPerPackage: number | null;
  fromWarehouseCode: string;
  fromWarehouseName: string | null;
  warehouseCode: string;
  warehouseName: string | null;
  barCode: string | null;
  batchNumber: string | null;
  batchExpiryDate: string | null;
  batchManufactureDate: string | null;
  binCode: string | null;
  binAbsEntry: number | null;
}

export interface StockTransferItem {
  docEntry: number;
  docNum: number;
  deliveryNumber: string | null;
  docDate: string;
  docDueDate: string | null;
  documentStatus: string;
  comments: string | null;
  fromWarehouse: string;
  fromWarehouseName: string | null;
  toWarehouse: string;
  toWarehouseName: string | null;
  stockTransferLines: StockTransferLine[];
}

export interface StockTransfersFilters {
  DocEntry?: number;
  DocEntries?: number;
  DocNum?: number;
  StartDate?: string;
  EndDate?: string;
  FromWarehouseCode?: string;
  ToWarehouseCode?: string;
  PageSize?: number;
  Skip?: number;
}

function buildParams(filters?: StockTransfersFilters): string {
  const params = new URLSearchParams();
  if (filters?.DocEntry != null) params.set("DocEntry", String(filters.DocEntry));
  if (filters?.DocEntries != null) params.set("DocEntries", String(filters.DocEntries));
  if (filters?.DocNum != null) params.set("DocNum", String(filters.DocNum));
  if (filters?.StartDate != null) params.set("StartDate", filters.StartDate);
  if (filters?.EndDate != null) params.set("EndDate", filters.EndDate);
  if (filters?.FromWarehouseCode != null) params.set("FromWarehouseCode", filters.FromWarehouseCode);
  if (filters?.ToWarehouseCode != null) params.set("ToWarehouseCode", filters.ToWarehouseCode);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const q = params.toString();
  return q ? `?${q}` : "";
}

const fetchStockTransfers = async (
  filters: StockTransfersFilters
): Promise<StockTransferItem[]> => {
  const { data } = await request.get<{ items: StockTransferItem[] }>(
    `/stock-transfers${buildParams(filters)}`
  );
  return data?.items ?? [];
};

export const useStockTransfers = (filters: StockTransfersFilters | null) => {
  return useQuery({
    queryKey: ["stock-transfers", filters],
    queryFn: () => fetchStockTransfers(filters!),
    enabled: filters != null,
  });
};
