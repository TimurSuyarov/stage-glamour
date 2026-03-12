import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

export interface InventoryCountingLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  warehouseCode: string;
  binLocation: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
}

export interface InventoryCountingItem {
  docEntry: number;
  docNum: number;
  countDate: string;
  remarks: string | null;
  employeeId: number | null;
  employeeFullName: string | null;
  documentStatus: string;
  documentStatusName: string;
  inventoryCountingLines: InventoryCountingLine[];
}

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

export interface CreateInventoryCountingBody {
  zone: string;
  employeeId: number | null;
  countDate: string;
}

const postInventoryCounting = async (body: CreateInventoryCountingBody): Promise<unknown> => {
  const { data } = await request.post("/inventory-countings", body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

export const useCreateInventoryCounting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryCountingBody) => postInventoryCounting(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-countings"] });
    },
  });
};

export interface PatchInventoryCountingBody {
  U_EmployeeId: number | null;
  inventoryCountingLines: { lineNumber: number; countedQuantity: number }[];
}

const patchInventoryCounting = async (
  docEntry: number,
  body: PatchInventoryCountingBody
): Promise<unknown> => {
  const { data } = await request.patch(`/inventory-countings/${docEntry}`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

export const usePatchInventoryCounting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docEntry, body }: { docEntry: number; body: PatchInventoryCountingBody }) =>
      patchInventoryCounting(docEntry, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-countings"] });
    },
  });
};

export const exportInventoryCountingPdf = async (docEntry: number): Promise<void> => {
  const { data, headers } = await request.get<Blob>(
    `/inventory-countings/${docEntry}/export-pdf`,
    { responseType: "blob" }
  );
  const contentDisposition = headers?.["content-disposition"] as string | undefined;
  let filename = `inventory-counting-${docEntry}.pdf`;
  if (contentDisposition) {
    const match =
      contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) ??
      contentDisposition.match(/filename="?([^";]+)"?/i);
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
