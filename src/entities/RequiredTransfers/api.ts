import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

export interface RequiredTransferItem {
  id: number;
  assignedUser: string | null;
  name: string;
  requiredTransferQuantity: number;
  completedPercentage: number;
  createdAt: string;
}

export interface RequiredTransfersResponse {
  items: RequiredTransferItem[];
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
  expirationDate: string | null;
  createdAt: string;
}

const fetchRequiredTransfers = async (): Promise<RequiredTransferItem[]> => {
  const { data } = await request.get<RequiredTransfersResponse>("/required-transfers");
  return data?.items ?? [];
};

export const useRequiredTransfers = () => {
  return useQuery({
    queryKey: ["required-transfers"],
    queryFn: fetchRequiredTransfers,
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
