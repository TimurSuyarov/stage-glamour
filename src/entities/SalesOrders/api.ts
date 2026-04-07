import request from "@/services";
import { useQuery } from "react-query";
import { ESalesOrderStatus } from "@/enums/salesOrder";

// API response types
export interface SalesOrderDocumentLine {
  lineNum: number;
  itemCode: string;
  smartupCode?: string | null;
  itemDescription: string;
  quantity: number;
  baseLine: number | null;
  price: number;
  lineTotal: number;
  openAmount: number;
  warehouseCode: string;
  unitsOfMeasurment: number;
  remainingOpenQuantity: number;
  barCode?: string | null;
  batchNumber: string | null;
  batchQuantity: number | null;
  batchExpiryDate: string | null;
  batchManufactureDate: string | null;
  quantityPerPackage: number | null;
  shelf: string | null;
}

export interface SalesOrder {
  docEntry: number;
  docNum: number;
  deliveryNumber: string | null;
  cardName: string;
  cardCode: string;
  docTotal: number;
  docDate: string;
  docDueDate: string;
  paidToDate: number;
  docCurrency: string;
  docTotalFC: number;
  languageCode: number;
  totalDownpaymentDocTotal: number;
  remainedDebt: number;
  warehouseCode: string | null;
  documentLines: SalesOrderDocumentLine[];
}

export interface SalesOrdersResponse {
  items: SalesOrder[];
}

export interface SalesOrdersFilters {
  DocNum?: number;
  CardName?: string;
  StartDate?: string;
  EndDate?: string;
  /** Page index: 0 = first N items, 1 = items N+1–2N, etc. */
  skip?: number;
  /** Number of items per page (default 20) */
  pageSize?: number;
}

const fetchSalesOrders = async (
  status: ESalesOrderStatus,
  filters?: SalesOrdersFilters
): Promise<SalesOrder[]> => {
  const params = new URLSearchParams();
  params.set("Status", String(status));
  
  if (filters?.DocNum != null) params.set("DocNum", String(filters.DocNum));
  if (filters?.CardName) params.set("CardName", filters.CardName);
  if (filters?.StartDate) params.set("StartDate", filters.StartDate);
  if (filters?.EndDate) params.set("EndDate", filters.EndDate);
  if (filters?.skip != null) params.set("skip", String(filters.skip));
  if (filters?.pageSize != null) params.set("pageSize", String(filters.pageSize));
  
  const { data } = await request.get<SalesOrdersResponse>(
    `/sales-orders?${params.toString()}`
  );
  return data?.items ?? [];
};

export const useSalesOrders = (status: ESalesOrderStatus, filters?: SalesOrdersFilters) => {
  return useQuery({
    queryKey: ["sales-orders", status, filters ?? {}],
    queryFn: () => fetchSalesOrders(status, filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

/** POST selected sales orders (by docEntry) to move to next step; backend processes and notifies via SignalR */
export const postSalesOrdersMoveNext = async (docEntries: number[]): Promise<void> => {
  await request.post("/sales-orders", docEntries);
};
