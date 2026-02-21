import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "glamour_collect_notification";

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

interface CollectNotificationContextValue {
  hasCollectNotification: boolean;
  setCollectNotification: (value: boolean) => void;
  clearCollectNotification: () => void;
}

const CollectNotificationContext = createContext<CollectNotificationContextValue | null>(null);

export function CollectNotificationProvider({ children }: { children: ReactNode }) {
  const [hasCollectNotification, setState] = useState<boolean>(getStored);

  const setCollectNotification = useCallback((value: boolean) => {
    setStored(value);
    setState(value);
  }, []);

  const clearCollectNotification = useCallback(() => {
    setStored(false);
    setState(false);
  }, []);

  const value = useMemo(
    () => ({
      hasCollectNotification,
      setCollectNotification,
      clearCollectNotification,
    }),
    [hasCollectNotification, setCollectNotification, clearCollectNotification]
  );

  return (
    <CollectNotificationContext.Provider value={value}>
      {children}
    </CollectNotificationContext.Provider>
  );
}

export function useCollectNotification() {
  const ctx = useContext(CollectNotificationContext);
  if (!ctx) throw new Error("useCollectNotification must be used within CollectNotificationProvider");
  return ctx;
}
