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
  totalQty?: number | null;
  allocatedQty: number;
  pickedQty: number;
  requiredTransferQty: number;
  /** ID of the inventory transfer document that moved this item into the zone. Null if no transfer was required. */
  transferRequirementId: number | null;
  expirationDate: string | null;
  batchNumber?: string | null;
  status: number;
  barcode?: string | null;
}

export interface PicklistItem {
  id: number;
  deliveryNumber: string | null;
  salesOrderDocEntry: number;
  salesOrderDocNum: string;
  cardName: string;
  warehouseCode: string;
  toWarehouseCode: string | null;
  toWarehouseName: string | null;
  status: number;
  inventoryTransferRequired: boolean;
  requiredTransferQty: number;
  type: number;
  linesTotalCount: number;
  linesPickedCount: number;
  assignedUserId: number | null;
  assigneeName: string | null;
  completedAt: string | null;
}

export interface PicklistDetail extends PicklistItem {
  assigneeName: string | null;
  lines: PicklistLine[];
}

export interface PicklistsFilters {
  /** Array of statuses (e.g. [1, 2] for collect, [3] for validation) */
  Statuses?: number[];
  /** skip = pageIndex * pageSize (e.g. 0, 20, 40) */
  skip?: number;
}

const fetchPicklists = async (filters?: PicklistsFilters): Promise<PicklistItem[]> => {
  const params = new URLSearchParams();
  if (filters?.Statuses?.length) {
    filters.Statuses.forEach((s) => params.append("Statuses", String(s)));
  }
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

const postPicklistAssignEmployee = async (picklistId: number, employeeId: number): Promise<unknown> => {
  const { data } = await request.post(`/picklists/${picklistId}/assign/${employeeId}`);
  return data;
};

export const useAssignPicklistEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ picklistId, employeeId }: { picklistId: number; employeeId: number }) =>
      postPicklistAssignEmployee(picklistId, employeeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", vars.picklistId] });
    },
  });
};

const fetchValidationItems = async (docEntry: number): Promise<PicklistLine[]> => {
  const { data } = await request.get<PicklistLine[]>(`/validation/${docEntry}/items`);
  return Array.isArray(data) ? data : [];
};

export const useValidationItems = (docEntry: number | null) => {
  return useQuery({
    queryKey: ["validation", "items", docEntry],
    queryFn: () => fetchValidationItems(docEntry!),
    refetchOnWindowFocus: false,
    enabled: docEntry != null,
  });
};

const postValidationScanByBarcode = async (
  docEntry: number,
  barcode: string
): Promise<unknown> => {
  const { data } = await request.post(
    `/validation/${docEntry}/scan/barcode/${encodeURIComponent(barcode)}`
  );
  return data;
};

export const useValidationScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { docEntry: number; barcode: string }) =>
      postValidationScanByBarcode(vars.docEntry, vars.barcode),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", vars.docEntry] });
      queryClient.invalidateQueries({
        queryKey: ["validation", "items", vars.docEntry],
      });
    },
  });
};

export interface ValidationFinalizeBody {
  picklistId: number;
  deliveryPackageCount: number;
}

const postValidationFinalize = async (
  body: ValidationFinalizeBody
): Promise<unknown> => {
  const { data } = await request.post("/validation/finalize", body);
  return data;
};

export const useValidationFinalize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ValidationFinalizeBody) => postValidationFinalize(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
    },
  });
};

const postPicklistDetach = async (picklistId: number): Promise<unknown> => {
  const { data } = await request.post(`/picklists/${picklistId}/detach`);
  return data;
};

export const useDetachPicklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (picklistId: number) => postPicklistDetach(picklistId),
    onSuccess: (_, picklistId) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", picklistId] });
    },
  });
};

// Validation mutations
const postValidationAssignValidator = async (
  picklistId: number,
  validatorId: number
): Promise<unknown> => {
  const { data } = await request.post(`/validation/${picklistId}/assign/${validatorId}`);
  return data;
};

export const useAssignValidationValidator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ picklistId, validatorId }: { picklistId: number; validatorId: number }) =>
      postValidationAssignValidator(picklistId, validatorId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", vars.picklistId] });
    },
  });
};

const postValidationDetach = async (picklistId: number): Promise<unknown> => {
  const { data } = await request.post(`/validation/${picklistId}/detach`);
  return data;
};

export const useDetachValidation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (picklistId: number) => postValidationDetach(picklistId),
    onSuccess: (_, picklistId) => {
      queryClient.invalidateQueries({ queryKey: ["picklists"] });
      queryClient.invalidateQueries({ queryKey: ["picklists", picklistId] });
    },
  });
};
