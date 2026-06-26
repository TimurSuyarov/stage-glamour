// Persisted scanner config. Mirrors the getStored/setStored try/catch shape
// used by src/contexts/CollectNotificationContext.tsx.

export const SCANNER_BAUD_KEY = "glamour_scanner_baud";
export const DEFAULT_BAUD = 57600;
export const BAUD_RATES = [4800, 9600, 19200, 38400, 57600, 115200] as const;

export function getStoredBaud(): number {
  try {
    const raw = localStorage.getItem(SCANNER_BAUD_KEY);
    if (!raw) return DEFAULT_BAUD;
    const parsed = Number(raw);
    return (BAUD_RATES as readonly number[]).includes(parsed) ? parsed : DEFAULT_BAUD;
  } catch {
    return DEFAULT_BAUD;
  }
}

export function setStoredBaud(baud: number): void {
  try {
    localStorage.setItem(SCANNER_BAUD_KEY, String(baud));
  } catch {
    // ignore storage failures
  }
}
