import request from "@/services";
import { useQuery } from "react-query";
import type { Good, SAPSyncInfo } from "@/types/wms";

/** Price entry in API response */
export interface ItemPriceDto {
  priceList: number;
  price: number;
  currency: string | null;
}

/** Backend item (API response shape – camelCase) */
export interface ItemDto {
  itemCode: string;
  itemName: string;
  foreignName: string | null;
  itemsGroupCode: number;
  itemGroup: string;
  barCode: string | null;
  itemType: string;
  quantityPerPackage: number | null;
  prices: ItemPriceDto[];
}

export interface ItemsResponse {
  items: ItemDto[];
  total?: number;
}

export interface ItemsFilters {
  ItemCode?: string;
  ItemCodes?: string;
  ItemName?: string;
  ItemsGroupCode?: string | number;
  /** Page size (default from backend or 20) */
  PageSize?: number;
  /** Skip for pagination (offset) */
  Skip?: number;
}

function mapItemToGood(dto: ItemDto): Good {
  const itemCode = dto.itemCode ?? "";
  const now = new Date().toISOString();
  const syncInfo: SAPSyncInfo = {
    synced: true,
    sapId: itemCode,
    lastSyncAt: now,
  };
  return {
    id: itemCode,
    sku: itemCode,
    barcode: dto.barCode ?? "",
    name: dto.itemName ?? "",
    category: dto.itemGroup ?? "",
    isActive: true,
    syncInfo,
  };
}

const fetchItems = async (
  filters?: ItemsFilters
): Promise<{ items: Good[]; total?: number }> => {
  const params = new URLSearchParams();
  if (filters?.ItemCode) params.set("ItemCode", filters.ItemCode);
  if (filters?.ItemCodes) params.set("ItemCodes", filters.ItemCodes);
  if (filters?.ItemName) params.set("ItemName", filters.ItemName);
  if (filters?.ItemsGroupCode != null)
    params.set("ItemsGroupCode", String(filters.ItemsGroupCode));
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));

  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<ItemsResponse>(`/items${query}`);
  const items = (data?.items ?? []).map(mapItemToGood);
  return { items, total: data?.total };
};

export const useItems = (filters?: ItemsFilters) => {
  return useQuery({
    queryKey: ["items", filters ?? {}],
    queryFn: () => fetchItems(filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
