import request from "@/services";
import { useQuery, useInfiniteQuery } from "react-query";

export const BIN_LOCATIONS_PAGE_SIZE = 20;

export interface BinLocationItem {
  id: number;
  absEntry: number;
  warehouse: string;
  sublevel1: string;
  binCode: string;
  barCode: string | null;
  minimumQty: number;
  maximumQty: number;
}

export interface BinLocationsResponse {
  items: BinLocationItem[];
}

export interface BinLocationsFilters {
  BinCode?: string;
  Zone?: number;
  /** Page index: 0 = first 20 items, 1 = items 21–40, etc. */
  skip?: number;
}

const fetchBinLocations = async (filters?: BinLocationsFilters): Promise<BinLocationItem[]> => {
  const params = new URLSearchParams();
  
  if (filters?.BinCode) params.set("BinCode", filters.BinCode);
  if (filters?.Zone != null) params.set("Zone", String(filters.Zone));
  if (filters?.skip != null) params.set("skip", String(filters.skip));
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<BinLocationsResponse>(`/bin-locations${query}`);
  return data?.items ?? [];
};

export const useBinLocations = (filters?: BinLocationsFilters) => {
  return useQuery({
    queryKey: ["bin-locations", filters ?? {}],
    queryFn: () => fetchBinLocations(filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

export const useBinLocationsInfinite = (search?: string) =>
  useInfiniteQuery(
    ["bin-locations-infinite", search ?? ""],
    ({ pageParam = 0 }) =>
      fetchBinLocations({ BinCode: search || undefined, skip: pageParam }),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length >= BIN_LOCATIONS_PAGE_SIZE
          ? allPages.length * BIN_LOCATIONS_PAGE_SIZE
          : undefined,
      refetchOnWindowFocus: false,
    }
  );

// Item count by bin (inventory page)
export interface BinLocationItemCount {
  itemCode: string;
  itemDesc: string;
  binCode: string;
  binAbsEntry: number;
  warehouseCode: string;
  batchNumber: string;
  batchExpiryDate?: string | null;
  onHand: number;
}

export interface BinLocationItemCountResponse {
  items: BinLocationItemCount[];
}

export interface BinLocationItemCountFilters {
  ItemCode?: string;
  ItemDesc?: string;
  Warrehouse?: string;
  Zone?: string;
  BinCode?: string;
  BatchNumber?: string;
  PageSize?: number;
  Skip?: number;
}

const fetchBinLocationItemCount = async (
  filters?: BinLocationItemCountFilters
): Promise<BinLocationItemCount[]> => {
  const params = new URLSearchParams();
  if (filters?.ItemCode) params.set("ItemCode", filters.ItemCode);
  if (filters?.ItemDesc) params.set("ItemDesc", filters.ItemDesc);
  if (filters?.Warrehouse) params.set("Warrehouse", filters.Warrehouse);
  if (filters?.Zone) params.set("Zone", filters.Zone);
  if (filters?.BinCode) params.set("BinCode", filters.BinCode);
  if (filters?.BatchNumber) params.set("BatchNumber", filters.BatchNumber);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<BinLocationItemCountResponse>(
    `/bin-locations/item-count${query}`
  );
  return data?.items ?? [];
};

export const useBinLocationItemCount = (filters?: BinLocationItemCountFilters) => {
  return useQuery({
    queryKey: ["bin-locations", "item-count", filters ?? {}],
    queryFn: () => fetchBinLocationItemCount(filters),
    refetchOnWindowFocus: false,
  });
};

// ─── Item statistics (cells page: /bin-locations/item-statistics) ───────────
export interface BinLocationItemStatisticsEntry {
  itemCode: string;
  itemName: string;
  barCode: string | null;
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  onHandQuantity: number;
}

export interface BinLocationItemStatisticsItem {
  binCode: string;
  binAbsEntry: number;
  warehouseCode: string;
  zone: string | null;
  warehouseName: string | null;
  binItems: BinLocationItemStatisticsEntry[];
}

export interface BinLocationItemStatisticsResponse {
  items: BinLocationItemStatisticsItem[];
}

export interface BinLocationItemStatisticsFilters {
  ItemCode?: string;
  ItemDesc?: string;
  WarehouseCode?: string;
  /** Zone letter: A, B, D, G, N, P, Other */
  Zone?: string;
  PageSize?: number;
  Skip?: number;
}

const fetchBinLocationItemStatistics = async (
  filters?: BinLocationItemStatisticsFilters
): Promise<BinLocationItemStatisticsItem[]> => {
  const params = new URLSearchParams();
  if (filters?.ItemCode != null) params.set("ItemCode", filters.ItemCode);
  if (filters?.ItemDesc != null) params.set("ItemDesc", filters.ItemDesc);
  if (filters?.WarehouseCode != null) params.set("WarehouseCode", filters.WarehouseCode);
  if (filters?.Zone != null) params.set("Zone", filters.Zone);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<BinLocationItemStatisticsResponse>(
    `/bin-locations/item-statistics${query}`
  );
  return data?.items ?? [];
};

export const useBinLocationItemStatistics = (filters?: BinLocationItemStatisticsFilters) => {
  return useQuery({
    queryKey: ["bin-locations", "item-statistics", filters ?? {}],
    queryFn: () => fetchBinLocationItemStatistics(filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
