import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize an API response to an array. Some endpoints return a bare array,
 * others wrap it in an envelope (`{ items }`, `{ value }`, etc.). Returns the
 * data if it's already an array, otherwise the first array-valued property of
 * the object, otherwise an empty array.
 */
export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const value of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}
