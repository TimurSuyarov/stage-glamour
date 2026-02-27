import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

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

const postPicklistAssign = async (picklistId: number): Promise<unknown> => {
  // Validation assign endpoint assigns current user to a validation task by picklist id
  const { data } = await request.post(`/validation/${picklistId}/assign`);
  return data;
};

export const useAssignPicklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (picklistId: number) => postPicklistAssign(picklistId),
    onSuccess: (_, picklistId) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", picklistId] });
    },
  });
};

const postValidationScan = async (
  docEntry: number,
  lineId: number
): Promise<unknown> => {
  const { data } = await request.post(`/validation/${docEntry}/scan/${lineId}`);
  return data;
};

export const useValidationScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { docEntry: number; lineId: number }) =>
      postValidationScan(vars.docEntry, vars.lineId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", vars.docEntry] });
    },
  });
};

const postValidationFinalize = async (picklistId: number): Promise<unknown> => {
  const { data } = await request.post(`/validation/${picklistId}/finalize`);
  return data;
};

export const useValidationFinalize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (picklistId: number) => postValidationFinalize(picklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
    },
  });
};
