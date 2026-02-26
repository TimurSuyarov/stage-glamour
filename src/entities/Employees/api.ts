import request from "@/services";
import { useQuery } from "react-query";

export interface EmployeeItem {
  /** Backend may send employeeId (camelCase) or EmployeeID (PascalCase) */
  employeeId?: number;
  EmployeeID?: number;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
  active: string;
  salesPersonCode?: number | null;
  jobTitle: string | null;
}

export interface EmployeesResponse {
  items: EmployeeItem[];
}

export interface EmployeesFilters {
  FirstName?: string;
  LastName?: string;
  /** Page size (e.g. 20). Sent as PageSize. */
  PageSize?: number;
  /** Skip (offset). Sent as Skip; typically pageIndex * PageSize. */
  Skip?: number;
}

const fetchEmployees = async (filters?: EmployeesFilters): Promise<EmployeeItem[]> => {
  const params = new URLSearchParams();
  if (filters?.FirstName) params.set("FirstName", filters.FirstName);
  if (filters?.LastName) params.set("LastName", filters.LastName);
  if (filters?.PageSize != null) params.set("PageSize", String(filters.PageSize));
  if (filters?.Skip != null) params.set("Skip", String(filters.Skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await request.get<EmployeesResponse>(`/employees${query}`);
  return data?.items ?? [];
};

export const useEmployees = (filters?: EmployeesFilters) => {
  return useQuery({
    queryKey: ["employees", filters ?? {}],
    queryFn: () => fetchEmployees(filters),
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
