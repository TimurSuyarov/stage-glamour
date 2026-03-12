import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type SignalRWaitingKey = "moveToRegion" | "salesOrders" | "returnDrafts";

type SignalRWaitingState = Record<SignalRWaitingKey, boolean>;

const initialState: SignalRWaitingState = {
  moveToRegion: false,
  salesOrders: false,
  returnDrafts: false,
};

type SignalRWaitingContextValue = {
  isWaiting: (key: SignalRWaitingKey) => boolean;
  setWaiting: (key: SignalRWaitingKey, value: boolean) => void;
};

const SignalRWaitingContext = createContext<SignalRWaitingContextValue | null>(null);

export function SignalRWaitingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SignalRWaitingState>(initialState);

  const setWaiting = useCallback((key: SignalRWaitingKey, value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isWaiting = useCallback(
    (key: SignalRWaitingKey) => state[key] === true,
    [state]
  );

  return (
    <SignalRWaitingContext.Provider value={{ isWaiting, setWaiting }}>
      {children}
    </SignalRWaitingContext.Provider>
  );
}

export function useSignalRWaiting(key: SignalRWaitingKey) {
  const ctx = useContext(SignalRWaitingContext);
  if (!ctx) {
    return [false, () => {}] as const;
  }
  return [ctx.isWaiting(key), (value: boolean) => ctx.setWaiting(key, value)] as const;
}

export function useSignalRWaitingControl() {
  const ctx = useContext(SignalRWaitingContext);
  if (!ctx) return { setWaiting: (_key: SignalRWaitingKey, _value: boolean) => {} };
  return { setWaiting: ctx.setWaiting };
}
