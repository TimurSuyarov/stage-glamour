import request from "@/services";
import { useQuery } from "react-query";

export interface BinLocationItem {
  id: number;
  absEntry: number;
  warehouse: string;
  sublevel1: string;
  binCode: string;
  barCode: string | null;
  minimumQty: number;
  maximumQty: number;
}

export interface BinLocationsResponse {
  items: BinLocationItem[];
}

const fetchBinLocations = async (): Promise<BinLocationItem[]> => {
  const { data } = await request.get<BinLocationsResponse>("/bin-locations");
  return data?.items ?? [];
};

export const useBinLocations = () => {
  return useQuery({
    queryKey: ["bin-locations"],
    queryFn: fetchBinLocations,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
