import request from "@/services";
import { useQuery } from "react-query";
import { toArray } from "@/lib/utils";

export interface Warehouse {
  warehouseCode: string;
  warehouseName: string;
}

export interface WarehousesFilters {
  warehouseCode?: string;
  warehouseName?: string;
  skip?: number;
}

// GET /warehouses — returns a bare array (no { items } envelope). The endpoint
// hard-filters to bin-enabled warehouses, so every result is safe to submit as
// the `warehouse` of a new bin location.
const fetchWarehouses = async (filters?: WarehousesFilters): Promise<Warehouse[]> => {
  const params = new URLSearchParams();
  if (filters?.warehouseCode) params.set("warehouseCode", filters.warehouseCode);
  if (filters?.warehouseName) params.set("warehouseName", filters.warehouseName);
  if (filters?.skip != null) params.set("skip", String(filters.skip));

  const query = params.toString() ? `?${params.toString()}` : "";
  // The API may return a bare array or an { items }-style envelope — normalize.
  const { data } = await request.get<unknown>(`/warehouses${query}`);
  return toArray<Warehouse>(data);
};

export const useWarehouses = (filters?: WarehousesFilters) => {
  return useQuery({
    queryKey: ["warehouses", filters ?? {}],
    queryFn: () => fetchWarehouses(filters),
    refetchOnWindowFocus: false,
  });
};
