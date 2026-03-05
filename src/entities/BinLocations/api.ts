import request from "@/services";
import { useQuery } from "react-query";

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
