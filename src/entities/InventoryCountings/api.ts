import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

export interface InventoryCountingItem {
  id: number;
  name: string;
  status: number;
  assignedUserId: number | null;
  assigneeName: string | null;
  createdAt: string;
}

export interface InventoryCountingLine {
  id: number;
  itemCode: string;
  productName: string;
  binCode: string;
  warehouseCode: string;
  currentQuantity: number;
  actualQuantity: number | null;
}

export interface InventoryCountingDetail extends InventoryCountingItem {
  lines: InventoryCountingLine[];
}

const fetchInventoryCountingById = async (
  id: number
): Promise<InventoryCountingDetail | null> => {
  const { data } = await request.get<InventoryCountingDetail>(
    `/inventory-countings/${id}`
  );
  return data ?? null;
};

export const useInventoryCountingById = (id: number | null) => {
  return useQuery({
    queryKey: ["inventory-countings", id],
    queryFn: () => fetchInventoryCountingById(id!),
    enabled: id != null,
    refetchOnWindowFocus: false,
  });
};

export interface InventoryCountingsResponse {
  items: InventoryCountingItem[];
}

export interface InventoryCountingsFilters {
  PageSize?: number;
  Skip?: number;
}

const fetchInventoryCountings = async (
  filters?: InventoryCountingsFilters
): Promise<InventoryCountingItem[]> => {
  const params = new URLSearchParams();
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<InventoryCountingsResponse>(
    `/inventory-countings${query}`
  );
  return data?.items ?? [];
};

export const useInventoryCountings = (filters?: InventoryCountingsFilters) => {
  return useQuery({
    queryKey: ["inventory-countings", filters ?? {}],
    queryFn: () => fetchInventoryCountings(filters),
    refetchOnWindowFocus: false,
  });
};

const postInventoryCounting = async (zone: string): Promise<unknown> => {
  const { data } = await request.post("/inventory-countings", JSON.stringify(zone), {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

export const useCreateInventoryCounting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zone: string) => postInventoryCounting(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-countings"] });
    },
  });
};

const assignInventoryCounting = async (
  itemId: number,
  userId: number
): Promise<unknown> => {
  const { data } = await request.post(
    `/inventory-countings/${itemId}/assign/${userId}`,
    undefined,
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

export const useAssignInventoryCounting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, userId }: { itemId: number; userId: number }) =>
      assignInventoryCounting(itemId, userId),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-countings"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-countings", itemId] });
    },
  });
};

export interface FinalizeRequest {
  id: number;
  quantityRequests: { lineId: number; quantity: number }[];
}

const postFinalize = async (body: FinalizeRequest): Promise<unknown> => {
  const { data } = await request.post("/finalize", body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

export const useFinalizeInventoryCounting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FinalizeRequest) => postFinalize(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-countings"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-countings", variables.id] });
    },
  });
};

export const exportInventoryCountingPdf = async (id: number): Promise<void> => {
  const { data, headers } = await request.get<Blob>(
    `/inventory-countings/${id}/export-pdf`,
    { responseType: "blob" }
  );
  const contentDisposition = headers?.["content-disposition"] as string | undefined;
  let filename = `inventory-counting-${id}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) ?? contentDisposition.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) filename = match[1].trim().replace(/^["']|["']$/g, "");
  }
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
