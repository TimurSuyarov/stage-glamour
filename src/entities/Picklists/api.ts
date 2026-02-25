import request from "@/services";
import { useQuery } from "react-query";

export interface PicklistLine {
  id: number;
  itemCode: string;
  productName: string;
  binCode: string;
  zoneType: number;
  isWholePack: boolean;
  quantityInPack: number | null;
  requestedQty: number;
  allocatedQty: number;
  pickedQty: number;
  requiredTransferQty: number;
  expirationDate: string | null;
  status: number;
}

export interface PicklistItem {
  id: number;
  salesOrderDocEntry: number;
  cardName: string;
  warehouseCode: string;
  status: number;
  inventoryTransferRequired: boolean;
  requiredTransferQty: number;
  linesTotalCount: number;
  linesPickedCount: number;
  assignedUserId: number | null;
  completedAt: string | null;
}

export interface PicklistDetail extends PicklistItem {
  assigneeName: string | null;
  lines: PicklistLine[];
}

export interface PicklistsFilters {
  Status?: number;
  /** skip = pageIndex * pageSize (e.g. 0, 20, 40) */
  skip?: number;
}

const fetchPicklists = async (filters?: PicklistsFilters): Promise<PicklistItem[]> => {
  const params = new URLSearchParams();
  if (filters?.Status != null) params.set("Status", String(filters.Status));
  if (filters?.skip != null) params.set("skip", String(filters.skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<PicklistItem[]>(`/picklists${query}`);
  return Array.isArray(data) ? data : [];
};

const fetchPicklistByDocEntry = async (docEntry: number): Promise<PicklistDetail | null> => {
  const { data } = await request.get<PicklistDetail>(`/picklists/${docEntry}`);
  return data ?? null;
};

export const usePicklists = (filters?: PicklistsFilters) => {
  return useQuery({
    queryKey: ["picklists", filters ?? {}],
    queryFn: () => fetchPicklists(filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

export const usePicklistByDocEntry = (docEntry: number | null) => {
  return useQuery({
    queryKey: ["picklists", docEntry],
    queryFn: () => fetchPicklistByDocEntry(docEntry!),
    refetchOnWindowFocus: false,
    enabled: docEntry != null,
  });
};
