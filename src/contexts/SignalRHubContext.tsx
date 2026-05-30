import { createContext, useContext, useRef, useEffect, useCallback, type ReactNode } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { createSalesOrdersHubConnection, type ProcessingCompletedPayload } from "@/lib/salesOrdersHub";
import { useSignalRWaitingControl, type SignalRWaitingKey } from "./SignalRWaitingContext";
import { useAuth } from "./AuthContext";

type OperationHandlers = {
  onCompleted: (payload: ProcessingCompletedPayload) => void;
};

type SignalRHubContextValue = {
  startListening: (key: SignalRWaitingKey, handlers: OperationHandlers) => void;
};

const SignalRHubContext = createContext<SignalRHubContextValue | null>(null);

export function SignalRHubProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<HubConnection | null>(null);
  const handlersRef = useRef<Map<SignalRWaitingKey, OperationHandlers>>(new Map());
  const { setWaiting } = useSignalRWaitingControl();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const connection = createSalesOrdersHubConnection();
    connectionRef.current = connection;

    connection.on("ProcessingCompleted", (result: ProcessingCompletedPayload) => {
      handlersRef.current.forEach((handlers, key) => {
        try {
          handlers.onCompleted(result);
        } finally {
          handlersRef.current.delete(key);
          setWaiting(key, false);
        }
      });
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop().catch(() => {});
    };
  }, [user, setWaiting]);

  const startListening = useCallback((key: SignalRWaitingKey, handlers: OperationHandlers) => {
    handlersRef.current.set(key, handlers);
  }, []);

  return (
    <SignalRHubContext.Provider value={{ startListening }}>
      {children}
    </SignalRHubContext.Provider>
  );
}

export function useSignalRHub() {
  const ctx = useContext(SignalRHubContext);
  if (!ctx) throw new Error("useSignalRHub must be used within SignalRHubProvider");
  return ctx;
}
