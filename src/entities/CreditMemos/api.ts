import request from "@/services";
import { useQuery } from "react-query";

/** Line item in credit memo (drafts and history) */
export interface CreditMemoLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  quantityPerPackage: number | null;
  warehouseCode: string;
  /** Only in history (credit-memos) response */
  cancelItemType?: number;
}

/** Single credit memo document (drafts or history) */
export interface CreditMemoItem {
  docEntry: number;
  docNum: number;
  docDate: string;
  docDueDate: string;
  documentStatus: string;
  cardCode: string;
  cardName: string;
  stockTransferLines: CreditMemoLine[];
}

export interface CreditMemosResponse {
  items: CreditMemoItem[];
}

/** Query params for both /credit-memos/drafts and /credit-memos */
export interface CreditMemosFilters {
  DocEntry?: number;
  DocEntries?: string;
  DocNum?: number;
  CardName?: string;
  CardCode?: string;
  StartDate?: string;
  EndDate?: string;
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
