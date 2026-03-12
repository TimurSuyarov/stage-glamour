import { createContext, useContext, useRef, type ReactNode } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { createSalesOrdersHubConnection, type ProcessingCompletedPayload } from "@/lib/salesOrdersHub";
import { createReturnsHubConnection } from "@/lib/returnsHub";
import { useSignalRWaitingControl, type SignalRWaitingKey } from "./SignalRWaitingContext";

type OperationHandlers = {
  onCompleted: (payload: ProcessingCompletedPayload) => void;
};

type SignalRHubContextValue = {
  startListening: (key: SignalRWaitingKey, handlers: OperationHandlers) => void;
};

const SignalRHubContext = createContext<SignalRHubContextValue | null>(null);

export function SignalRHubProvider({ children }: { children: ReactNode }) {
  const connectionsRef = useRef<Map<SignalRWaitingKey, HubConnection>>(new Map());
  const { setWaiting } = useSignalRWaitingControl();

  const startListening = (key: SignalRWaitingKey, handlers: OperationHandlers) => {
    connectionsRef.current.get(key)?.stop().catch(() => {});

    const connection =
      key === "returnDrafts"
        ? createReturnsHubConnection()
        : createSalesOrdersHubConnection();

    const cleanup = () => {
      connection.stop().catch(() => {});
      connectionsRef.current.delete(key);
      setWaiting(key, false);
    };

    connection.on("ProcessingCompleted", (result: ProcessingCompletedPayload) => {
      try {
        handlers.onCompleted(result);
      } finally {
        cleanup();
      }
    });

    connection.onclose(cleanup);
    connectionsRef.current.set(key, connection);
    connection.start().catch(cleanup);
  };

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
