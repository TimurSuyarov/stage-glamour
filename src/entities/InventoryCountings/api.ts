import request from "@/services";
import { useQuery } from "react-query";

export interface InventoryCountingLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  warehouseCode: string;
  binLocation: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
}

export interface InventoryCountingItem {
  docEntry: number;
  docNum: number;
  countDate: string;
  remarks: string | null;
  inventoryCountingLines: InventoryCountingLine[];
}

export interface InventoryCountingsResponse {
  items: InventoryCountingItem[];
}

export interface InventoryCountingsFilters {
  DocEntry?: number;
  DocNum?: number;
  StartDate?: string;
  EndDate?: string;
  ItemCode?: string;
  ItemDesc?: string;
  WarehouseCode?: string;
  binLocation?: string;
  PageSize?: number;
  Skip?: number;
}

const fetchInventoryCountings = async (
  filters?: InventoryCountingsFilters
): Promise<InventoryCountingItem[]> => {
  const params = new URLSearchParams();
  if (filters?.DocEntry != null) params.set("DocEntry", String(filters.DocEntry));
  if (filters?.DocNum != null) params.set("DocNum", String(filters.DocNum));
  if (filters?.StartDate) params.set("StartDate", filters.StartDate);
  if (filters?.EndDate) params.set("EndDate", filters.EndDate);
  if (filters?.ItemCode) params.set("ItemCode", filters.ItemCode);
  if (filters?.ItemDesc) params.set("ItemDesc", filters.ItemDesc);
  if (filters?.WarehouseCode) params.set("WarehouseCode", filters.WarehouseCode);
  if (filters?.binLocation) params.set("binLocation", filters.binLocation);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<InventoryCountingsResponse>(
    `/inventory-countings${query}`
  );
  return data?.items ?? [];
};

export const useInventoryCountings = (filters?: InventoryCountingsFilters) => {
  return useQuery({
    queryKey: ["inventory-countings", filters ?? {}],
    queryFn: () => fetchInventoryCountings(filters),
    refetchOnWindowFocus: false,
  });
};
