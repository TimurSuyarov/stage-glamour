/** Keys used in sessionStorage for auth */
export const AUTH_TOKEN_KEY = "token";
export const AUTH_EMPLOYEE_KEY = "employee";

/** Employee shape returned by login API */
export interface LoginEmployee {
  employeeId: number;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
  active: string;
  jobTitle: string;
}

/** Full login API response */
export interface LoginResponse {
  token: string;
  employee: LoginEmployee;
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuth(token: string, employee: LoginEmployee): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_EMPLOYEE_KEY, JSON.stringify(employee));
}

export function getStoredEmployee(): LoginEmployee | null {
  const raw = sessionStorage.getItem(AUTH_EMPLOYEE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginEmployee;
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_EMPLOYEE_KEY);
}
