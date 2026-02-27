import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "glamour_required_transfers_notification";

function getStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setStored(value: boolean) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

interface RequiredTransfersNotificationContextValue {
  hasRequiredTransfersNotification: boolean;
  setRequiredTransfersNotification: (value: boolean) => void;
  clearRequiredTransfersNotification: () => void;
}

const RequiredTransfersNotificationContext =
  createContext<RequiredTransfersNotificationContextValue | null>(null);

export function RequiredTransfersNotificationProvider({ children }: { children: ReactNode }) {
  const [hasRequiredTransfersNotification, setState] = useState<boolean>(getStored);

  const setRequiredTransfersNotification = useCallback((value: boolean) => {
    setStored(value);
    setState(value);
  }, []);

  const clearRequiredTransfersNotification = useCallback(() => {
    setStored(false);
    setState(false);
  }, []);

  const value = useMemo(
    () => ({
      hasRequiredTransfersNotification,
      setRequiredTransfersNotification,
      clearRequiredTransfersNotification,
    }),
    [hasRequiredTransfersNotification, setRequiredTransfersNotification, clearRequiredTransfersNotification]
  );

  return (
    <RequiredTransfersNotificationContext.Provider value={value}>
      {children}
    </RequiredTransfersNotificationContext.Provider>
  );
}

export function useRequiredTransfersNotification() {
  const ctx = useContext(RequiredTransfersNotificationContext);
  if (!ctx) {
    throw new Error(
      "useRequiredTransfersNotification must be used within RequiredTransfersNotificationProvider"
    );
  }
  return ctx;
}

