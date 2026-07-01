import request from "@/services";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "react-query";
import { toArray } from "@/lib/utils";

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
  smartupCode?: string | null;
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
  smartupCode?: string | null;
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
  /** Bin code */
  BinCode?: string;
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
  if (filters?.BinCode != null) params.set("BinCode", filters.BinCode);
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

// ─── UDF enums (create-bin dropdowns: /bin-locations/udf-enums) ──────────────
// Returns a bare array (no { items } envelope). One entry per enum UDF; look
// them up by `field` (order is not guaranteed). For dropdowns, submit `value`
// and show `description` as the label.
export interface BinLocationUdfEnumValue {
  value: string;
  description: string;
}

export interface BinLocationUdfEnum {
  field: string;
  name: string;
  description: string;
  values: BinLocationUdfEnumValue[];
}

const fetchBinLocationUdfEnums = async (): Promise<BinLocationUdfEnum[]> => {
  // May be a bare array or an { items }-style envelope — normalize.
  const { data } = await request.get<unknown>("/bin-locations/udf-enums");
  return toArray<BinLocationUdfEnum>(data);
};

export const useBinLocationUdfEnums = () => {
  return useQuery({
    queryKey: ["bin-locations", "udf-enums"],
    queryFn: fetchBinLocationUdfEnums,
    refetchOnWindowFocus: false,
    // Backend caches the UDF definition ~1h, so mirror that here.
    staleTime: 3600_000,
  });
};

// ─── Sub-level codes (create-bin combobox: /bin-locations/sublevel-codes) ────
// Existing SAP WarehouseSublevelCodes the user can pick from (or type a new one).
// ~1800 codes exist, so always drive this with `search`; page size is fixed at 50.
export interface BinLocationSublevelCode {
  warehouseSublevel: number;
  code: string;
  absEntry: number;
}

const fetchBinLocationSublevelCodes = async (
  search?: string
): Promise<BinLocationSublevelCode[]> => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<unknown>(`/bin-locations/sublevel-codes${query}`);
  return toArray<BinLocationSublevelCode>(data);
};

export const useBinLocationSublevelCodes = (search?: string) => {
  return useQuery({
    queryKey: ["bin-locations", "sublevel-codes", search ?? ""],
    queryFn: () => fetchBinLocationSublevelCodes(search),
    // Don't load the full list; only search once the user has typed something.
    enabled: (search ?? "").trim().length > 0,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

// ─── Create bin location (POST /bin-locations) ───────────────────────────────
export interface CreateBinLocationBody {
  warehouse: string;
  sublevel1: string;
  zone: string;
  /** U_MaxQuantity value ("1"/"2"/"3"); omit to leave empty. */
  maxQuantity?: string;
}

export interface CreatedBinLocation {
  id: number | null;
  absEntry: number;
  warehouse: string;
  sublevel1: string;
  binCode: string;
  barCode: string | null;
  minimumQty: number | null;
  maximumQty: number | null;
  U_Zona: string;
}

const postBinLocation = async (body: CreateBinLocationBody): Promise<CreatedBinLocation> => {
  const { data } = await request.post<CreatedBinLocation>("/bin-locations", body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

export const useCreateBinLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBinLocationBody) => postBinLocation(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bin-locations"] });
    },
  });
};
