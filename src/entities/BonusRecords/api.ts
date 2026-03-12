import request from "@/services";
import { useQuery, useInfiniteQuery } from "react-query";

export const BONUS_RECORD_TYPE_VALUES = {
  Receiving: 10,
  SalesOrderPicking: 20,
  SalesOrderValidation: 30,
  StockTransfer: 40,
  InventoryTransferRequestPicking: 50,
} as const;

export const BONUS_RECORD_TYPE_LABELS: Record<number, string> = {
  10: "bonuses.typeReceiving",
  20: "bonuses.typeSalesOrderPicking",
  30: "bonuses.typeSalesOrderValidation",
  40: "bonuses.typeStockTransfer",
  50: "bonuses.typeInventoryTransferRequestPicking",
};

export const PAGE_SIZE = 20;

// --- Grouped response ---
export interface BonusRecordGroupedItem {
  employeeId: number;
  employeeName: string | null;
  totalPrice: number;
}

// --- Detail response ---
export interface BonusRecordItem {
  id: number;
  type: number;
  docEntry: number;
  employeeId: number;
  employeeName: string | null;
  totalPrice: number;
  createdAt: string;
}

// --- Filters ---
export interface BonusRecordsGroupedFilters {
  From?: string;
  To?: string;
  Type?: number;
}

export interface BonusRecordsDetailFilters extends BonusRecordsGroupedFilters {
  EmployeeId: number;
  Skip?: number;
}

// --- Grouped API ---
const fetchBonusRecordsGrouped = async (
  filters: BonusRecordsGroupedFilters
): Promise<BonusRecordGroupedItem[]> => {
  const params = new URLSearchParams();
  if (filters.From) params.set("From", filters.From);
  if (filters.To) params.set("To", filters.To);
  if (filters.Type != null) params.set("Type", String(filters.Type));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<BonusRecordGroupedItem[]>(
    `/bonus-records/grouped${query}`
  );
  return Array.isArray(data) ? data : [];
};

export const useBonusRecordsGrouped = (
  filters: BonusRecordsGroupedFilters | null
) => {
  return useQuery({
    queryKey: ["bonus-records-grouped", filters],
    queryFn: () => fetchBonusRecordsGrouped(filters!),
    refetchOnWindowFocus: false,
    enabled: filters != null,
  });
};

// --- Detail API (used by infinite query) ---
export const fetchBonusRecordsDetail = async (
  filters: BonusRecordsDetailFilters
): Promise<BonusRecordItem[]> => {
  const params = new URLSearchParams();
  params.set("EmployeeId", String(filters.EmployeeId));
  if (filters.From) params.set("From", filters.From);
  if (filters.To) params.set("To", filters.To);
  if (filters.Type != null) params.set("Type", String(filters.Type));
  if (filters.Skip != null) params.set("Skip", String(filters.Skip));
  const { data } = await request.get<{ items: BonusRecordItem[] }>(
    `/bonus-records?${params.toString()}`
  );
  return data?.items ?? [];
};

export const useBonusRecordsInfinite = (
  employeeId: number,
  filters: BonusRecordsGroupedFilters | null
) => {
  return useInfiniteQuery(
    ["bonus-records-detail", employeeId, filters],
    ({ pageParam = 0 }) =>
      fetchBonusRecordsDetail({
        EmployeeId: employeeId,
        From: filters?.From,
        To: filters?.To,
        Type: filters?.Type,
        Skip: pageParam,
      }),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length >= PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
      enabled: employeeId > 0 && filters != null,
      refetchOnWindowFocus: false,
    }
  );
};

// --- Bonus record metadata by id (for modal) ---
export interface BonusRecordDocumentLine {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  bonus: number;
}

export interface BonusRecordByDocResponse {
  cardName: string;
  docNum: number;
  docEntry: number;
  documentLines: BonusRecordDocumentLine[];
}

export const fetchBonusRecordMetadata = async (
  id: number
): Promise<BonusRecordByDocResponse> => {
  const { data } = await request.get<BonusRecordByDocResponse>(
    `/bonus-records/${id}/metadata`
  );
  return data;
};

export const useBonusRecordMetadata = (id: number | null) => {
  return useQuery({
    queryKey: ["bonus-record-metadata", id],
    queryFn: () => fetchBonusRecordMetadata(id!),
    enabled: id != null,
    refetchOnWindowFocus: false,
  });
};
