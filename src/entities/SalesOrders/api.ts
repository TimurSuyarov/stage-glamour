import request from "@/services";
import { useQuery } from "react-query";
import { ESalesOrderStatus } from "@/enums/salesOrder";

// API response types
export interface SalesOrderDocumentLine {
  lineNum: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  baseLine: number | null;
  price: number;
  lineTotal: number;
  openAmount: number;
  warehouseCode: string;
  unitsOfMeasurment: number;
  remainingOpenQuantity: number;
}

export interface SalesOrder {
  docEntry: number;
  docNum: number;
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

const fetchSalesOrders = async (
  status: ESalesOrderStatus
): Promise<SalesOrder[]> => {
  const params = new URLSearchParams();
  params.set("Status", String(status));
  
  const { data } = await request.get<SalesOrdersResponse>(
    `/sales-orders?${params.toString()}`
  );
  return data?.items ?? [];
};

export const useSalesOrders = (status: ESalesOrderStatus) => {
  return useQuery({
    queryKey: ["sales-orders", status],
    queryFn: () => fetchSalesOrders(status),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
