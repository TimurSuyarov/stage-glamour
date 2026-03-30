import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

export interface RequiredTransferItem {
  id: number;
  assignedUser: string | null;
  assignedUserId: number | null;
  type: number;
  name: string;
  requiredTransferQuantity: number;
  completedPercentage: number;
  createdAt: string;
  isCompleted: boolean;
}

export interface RequiredTransfersResponse {
  items: RequiredTransferItem[];
}

export interface RequiredTransfersFilters {
  skip?: number;
}

export interface RequiredTransferLine {
  id: number;
  ordersCheckingRequestId: number;
  sourceBinLocation: string;
  targetBinLocation: string;
  isTransferred: boolean;
  quantity: number;
  quantityPerBox: number;
  itemCode: string;
  productName: string;
  barcode?: string | null;
  expirationDate: string | null;
  batchNumber: string | null;
  createdAt: string;
}

const fetchRequiredTransfers = async (
  filters?: RequiredTransfersFilters
): Promise<RequiredTransferItem[]> => {
  const params = new URLSearchParams();
  if (filters?.skip != null) params.set("skip", String(filters.skip));
  const query = params.toString();
  const { data } = await request.get<RequiredTransfersResponse>(
    `/required-transfers${query ? `?${query}` : ""}`
  );
  return data?.items ?? [];
};

export const useRequiredTransfers = (filters?: RequiredTransfersFilters) => {
  return useQuery({
    queryKey: ["required-transfers", filters ?? {}],
    queryFn: () => fetchRequiredTransfers(filters),
    refetchOnWindowFocus: false,
  });
};

const fetchRequiredTransferById = async (id: number): Promise<RequiredTransferLine[]> => {
  const { data } = await request.get<RequiredTransferLine[]>(`/required-transfers/${id}`);
  return Array.isArray(data) ? data : [];
};

export const useRequiredTransferById = (id: number | null) => {
  return useQuery({
    queryKey: ["required-transfers", id],
    queryFn: () => fetchRequiredTransferById(id!),
    enabled: id != null,
    refetchOnWindowFocus: false,
  });
};

const postTransfer = async (requestId: number, lineId: number): Promise<unknown> => {
  const { data } = await request.post(
    `/required-transfers/${requestId}/transfer/${lineId}`
  );
  return data;
};

export const useTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, lineId }: { requestId: number; lineId: number }) =>
      postTransfer(requestId, lineId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["required-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["required-transfers", requestId] });
    },
  });
};

const postAssign = async (requestId: number, userId: number): Promise<unknown> => {
  const { data } = await request.post(
    `/required-transfers/${requestId}/assign/${userId}`
  );
  return data;
};

export const useAssignMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, userId }: { requestId: number; userId: number }) =>
      postAssign(requestId, userId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["required-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["required-transfers", requestId] });
    },
  });
};

const postFinalize = async (requestId: number): Promise<unknown> => {
  const { data } = await request.post(`/required-transfers/${requestId}/finalize`);
  return data;
};

export const useFinalizeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId }: { requestId: number }) => postFinalize(requestId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["required-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["required-transfers", requestId] });
    },
  });
};

/**
 * Fetches required-transfer lines by a list of ordersCheckingRequestIds
 * (the `transferRequirementId` field on each picklist line).
 *
 * POST /required-transfers/by-ids
 * Body: { ids: number[] }
 * Response: RequiredTransferLine[]  — all lines whose ordersCheckingRequestId is in the list
 */
const fetchRequiredTransfersByIds = async (ids: number[]): Promise<RequiredTransferLine[]> => {
  const { data } = await request.post<RequiredTransferLine[]>(
    `/required-transfers/by-ids`,
    { ids }
  );
  return Array.isArray(data) ? data : [];
};

export const useRequiredTransfersByIds = (ids: number[]) => {
  return useQuery({
    queryKey: ["required-transfers-by-ids", ids],
    queryFn: () => fetchRequiredTransfersByIds(ids),
    enabled: ids.length > 0,
    refetchOnWindowFocus: false,
  });
};

const postDetach = async (requestId: number): Promise<unknown> => {
  const { data } = await request.post(`/required-transfers/${requestId}/detach`);
  return data;
};

export const useDetachMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId }: { requestId: number }) => postDetach(requestId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["required-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["required-transfers", requestId] });
    },
  });
};
