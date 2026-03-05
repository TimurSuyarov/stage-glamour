import request from "@/services";
import { useMutation, useQuery, useQueryClient } from "react-query";

export interface BatchNumber {
  batchNumber: string;
  expiryDate: string | null;
  manufacturingDate: string | null;
  addmisionDate: string | null;
}

export interface BinAllocation {
  binAbsEntry: number;
  quantity: number;
  serialAndBatchNumbersBaseLine: number;
  baseLineNumber: number;
}

export interface CreditMemoLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  quantityPerPackage: number | null;
  warehouseCode: string;
  cancelItemType?: number | null;
  U_CancelItem: string | null;
  U_QuantityPerBoxLine: number | null;
  batchNumbers: BatchNumber[];
  documentLinesBinAllocations: BinAllocation[];
  batchNumber?: string | null;
  batchQuantity?: number | null;
  batchExpiryDate?: string | null;
  batchManufacturingDate?: string | null;
}

export interface CreditMemoItem {
  docEntry: number;
  docNum: number;
  docDate: string;
  docDueDate: string;
  documentStatus: string;
  cardCode: string;
  cardName: string;
  U_Status: string | null;
  documentLines: CreditMemoLine[];
  stockTransferLines?: CreditMemoLine[];
}

export interface CreditMemosResponse {
  items: CreditMemoItem[];
}

export interface CreditMemosFilters {
  DocEntry?: number;
  DocEntries?: string;
  DocNum?: number;
  CardName?: string;
  CardCode?: string;
  StartDate?: string;
  EndDate?: string;
  Status?: number;
  PageSize?: number;
  Skip?: number;
}

function buildParams(filters?: CreditMemosFilters): string {
  const params = new URLSearchParams();
  if (filters?.DocEntry != null) params.set("DocEntry", String(filters.DocEntry));
  if (filters?.DocEntries != null) params.set("DocEntries", String(filters.DocEntries));
  if (filters?.DocNum != null) params.set("DocNum", String(filters.DocNum));
  if (filters?.CardName != null) params.set("CardName", filters.CardName);
  if (filters?.CardCode != null) params.set("CardCode", filters.CardCode);
  if (filters?.StartDate != null) params.set("StartDate", filters.StartDate);
  if (filters?.EndDate != null) params.set("EndDate", filters.EndDate);
  if (filters?.Status != null) params.set("Status", String(filters.Status));
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const q = params.toString();
  return q ? `?${q}` : "";
}

const fetchCreditMemosDrafts = async (
  filters?: CreditMemosFilters
): Promise<CreditMemoItem[]> => {
  const query = buildParams(filters);
  const { data } = await request.get<CreditMemosResponse>(
    `/credit-memos/drafts${query}`
  );
  return data?.items ?? [];
};

const fetchCreditMemos = async (
  filters?: CreditMemosFilters
): Promise<CreditMemoItem[]> => {
  const query = buildParams(filters);
  const { data } = await request.get<CreditMemosResponse>(
    `/credit-memos${query}`
  );
  return data?.items ?? [];
};

const fetchCreditMemoDraftDetail = async (
  docEntry: number
): Promise<CreditMemoItem | null> => {
  const { data } = await request.get<CreditMemoItem>(
    `/credit-memos/drafts/${docEntry}`
  );
  return data ?? null;
};

export function useCreditMemosDrafts(filters?: CreditMemosFilters) {
  return useQuery({
    queryKey: ["credit-memos", "drafts", filters ?? {}],
    queryFn: () => fetchCreditMemosDrafts(filters),
    refetchOnWindowFocus: false,
  });
}

export function useCreditMemos(filters?: CreditMemosFilters) {
  return useQuery({
    queryKey: ["credit-memos", "list", filters ?? {}],
    queryFn: () => fetchCreditMemos(filters),
    refetchOnWindowFocus: false,
  });
}

export function useCreditMemoDraftDetail(docEntry: number | null) {
  return useQuery({
    queryKey: ["credit-memos", "drafts", docEntry],
    queryFn: () => fetchCreditMemoDraftDetail(docEntry!),
    enabled: docEntry != null,
    refetchOnWindowFocus: false,
  });
}

export interface ReturnLinePayload {
  lineNum: number;
  reasonId: number;
}

const postReturn = async (
  docEntry: number,
  lines: ReturnLinePayload[]
): Promise<unknown> => {
  const { data } = await request.post(`/returns/${docEntry}`, lines);
  return data;
};

export function useReturnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docEntry, lines }: { docEntry: number; lines: ReturnLinePayload[] }) =>
      postReturn(docEntry, lines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-memos"] });
    },
  });
}
