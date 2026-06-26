import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { message } from "antd";
import i18n from "i18next";
import {
  isSerialSupported,
  getFirstGrantedPort,
  requestPort as requestSerialPort,
  runReadLoop,
  type ReadLoopHandle,
} from "@/lib/serialClient";
import { getStoredBaud, setStoredBaud } from "@/lib/scannerStorage";
import {
  classifySerialError,
  isPortDismissal,
  serialErrorKey,
  type SerialErrorCode,
} from "@/lib/serialErrors";

export type ScannerStatus =
  | "unsupported"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface ScannerContextValue {
  supported: boolean;
  status: ScannerStatus;
  baudRate: number;
  /** Stable code for the last error, or null. Render via t(serialErrorKey(code)). */
  errorCode: SerialErrorCode | null;
  /** User gesture: silently reopen a granted port, else show the native chooser. */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Silent (getPorts-only) reopen — never prompts. */
  reconnect: () => Promise<void>;
  setBaudRate: (baud: number) => void;
  /** Receive every scanned code. Returns an unsubscribe fn. Stable identity. */
  subscribe: (handler: (code: string) => void) => () => void;
}

const ScannerContext = createContext<ScannerContextValue | undefined>(undefined);

export function ScannerProvider({ children }: { children: ReactNode }) {
  const supported = isSerialSupported();

  const [status, setStatus] = useState<ScannerStatus>(
    supported ? "disconnected" : "unsupported"
  );
  const [baudRate, setBaudRateState] = useState<number>(getStoredBaud);
  const [errorCode, setErrorCode] = useState<SerialErrorCode | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const keepReadingRef = useRef(false);
  const readLoopRef = useRef<ReadLoopHandle | null>(null);
  const baudRef = useRef(baudRate);
  const subscribersRef = useRef<Set<(code: string) => void>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    baudRef.current = baudRate;
  }, [baudRate]);

  // Scan distribution is ref-based so scans never trigger React re-renders here.
  const emitLine = useCallback((code: string) => {
    subscribersRef.current.forEach((handler) => {
      try {
        handler(code);
      } catch {
        // a misbehaving subscriber must not break the read loop
      }
    });
  }, []);

  const subscribe = useCallback((handler: (code: string) => void) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  // Classify by DOMException.name (stable), log the raw English for diagnostics,
  // store the code, and toast a localized message — except for a chooser dismissal.
  const reportError = useCallback((err: unknown): SerialErrorCode => {
    const code = classifySerialError(err);
    console.error("[serial]", code, (err as { message?: string })?.message ?? err);
    setErrorCode(code);
    if (!isPortDismissal(code)) {
      message.error(i18n.t(serialErrorKey(code)));
    }
    return code;
  }, []);

  const teardown = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      await readLoopRef.current?.stop();
    } catch {
      // ignore
    }
    readLoopRef.current = null;
    const port = portRef.current;
    portRef.current = null;
    if (port) {
      try {
        await port.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const openPort = useCallback(
    async (port: SerialPort) => {
      if (portRef.current) return; // already open — StrictMode / double-click guard
      setStatus("connecting");
      try {
        await port.open({ baudRate: baudRef.current });
      } catch (err) {
        reportError(err);
        setStatus("error");
        return;
      }
      portRef.current = port;
      keepReadingRef.current = true;
      setErrorCode(null);
      setStatus("connected");
      readLoopRef.current = runReadLoop(port, {
        onLine: emitLine,
        onError: (err) => {
          // read error (unplug, or garbage from a wrong baud rate) — surface & stop
          reportError(err);
          void teardown().then(() => setStatus("error"));
        },
        shouldContinue: () => keepReadingRef.current,
      });
    },
    [emitLine, teardown, reportError]
  );

  const connect = useCallback(async () => {
    if (!supported) return;
    setStatus("connecting");
    try {
      const granted = await getFirstGrantedPort();
      const port = granted ?? (await requestSerialPort());
      await openPort(port);
    } catch (err) {
      const code = reportError(err);
      // Dismissing the chooser is benign — just stay disconnected.
      setStatus(isPortDismissal(code) ? "disconnected" : "error");
    }
  }, [supported, openPort, reportError]);

  const reconnect = useCallback(async () => {
    if (!supported) return;
    try {
      const port = await getFirstGrantedPort();
      if (port) await openPort(port);
    } catch (err) {
      reportError(err);
      setStatus("error");
    }
  }, [supported, openPort, reportError]);

  const disconnect = useCallback(async () => {
    await teardown();
    setErrorCode(null);
    setStatus("disconnected");
  }, [teardown]);

  const setBaudRate = useCallback(
    (baud: number) => {
      setStoredBaud(baud);
      baudRef.current = baud;
      setBaudRateState(baud);
      // Reopen at the new rate if currently connected.
      if (portRef.current) {
        void teardown().then(() => reconnect());
      }
    },
    [teardown, reconnect]
  );

  // Mount: auto-reopen a previously-granted port (once) + listen for unplug.
  useEffect(() => {
    if (!supported) return;

    const handleDisconnect = (event: Event) => {
      if (event.target && event.target === portRef.current) {
        void teardown().then(() => setStatus("error"));
      }
    };
    navigator.serial.addEventListener("disconnect", handleDisconnect);

    // Guard the silent reconnect against StrictMode's double-invoke.
    if (!initializedRef.current) {
      initializedRef.current = true;
      void reconnect();
    }

    return () => {
      navigator.serial.removeEventListener("disconnect", handleDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const value = useMemo<ScannerContextValue>(
    () => ({
      supported,
      status,
      baudRate,
      errorCode,
      connect,
      disconnect,
      reconnect,
      setBaudRate,
      subscribe,
    }),
    [supported, status, baudRate, errorCode, connect, disconnect, reconnect, setBaudRate, subscribe]
  );

  return <ScannerContext.Provider value={value}>{children}</ScannerContext.Provider>;
}

export function useScanner(): ScannerContextValue {
  const ctx = useContext(ScannerContext);
  if (!ctx) {
    throw new Error("useScanner must be used within a ScannerProvider");
  }
  return ctx;
}
