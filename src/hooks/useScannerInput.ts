import { useCallback, useEffect, useRef } from "react";
import { useScanner } from "@/contexts/ScannerContext";

export type ScannerInputMode = "global" | "input";

export interface UseScannerInputOptions {
  /** Page-specific dispatch for a scanned code (already trimmed, non-empty). */
  onScan: (code: string) => void;
  /** Gate the listeners (e.g. only while a modal is open). Default true. */
  enabled?: boolean;
  /** 'input' = wire onKeyDown to a hidden input; 'global' = document listener. */
  mode?: ScannerInputMode;
  /** Global mode: ignore keystrokes typed into editable elements. Default true. */
  ignoreEditableTargets?: boolean;
  /** Global mode: reset the char buffer if keys pause longer than this. Default 100ms. */
  bufferTimeoutMs?: number;
}

export interface UseScannerInputResult {
  inputRef: React.RefObject<HTMLInputElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Focuses the hidden input — no-op while serial is connected. */
  focusInput: () => void;
  /** True when serial is the active source (keyboard suspended). */
  serialActive: boolean;
}

/**
 * Single page-facing scanner input. When a USB serial scanner is connected it
 * delivers scans from the device and SUSPENDS the keyboard-wedge path; when it
 * is not connected, the page keeps working via the keyboard wedge as before.
 */
export function useScannerInput({
  onScan,
  enabled = true,
  mode = "input",
  ignoreEditableTargets = true,
  bufferTimeoutMs = 100,
}: UseScannerInputOptions): UseScannerInputResult {
  const { status, subscribe } = useScanner();
  const serialActive = status === "connected";

  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the latest dispatch without re-binding listeners/subscriptions.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  const emit = useCallback((raw: string) => {
    const code = raw.trim();
    if (code) onScanRef.current(code);
  }, []);

  // Serial source — active only while enabled AND connected.
  useEffect(() => {
    if (!enabled || status !== "connected") return;
    return subscribe(emit);
  }, [enabled, status, subscribe, emit]);

  // Keyboard wedge (global document listener) — active only when NOT connected.
  useEffect(() => {
    if (!enabled || mode !== "global" || status === "connected") return;

    let buffer = "";
    let lastKeyTime = 0;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (ignoreEditableTargets && target?.closest("input, textarea, [contenteditable]")) {
        return;
      }
      const now = Date.now();
      if (now - lastKeyTime > bufferTimeoutMs) buffer = "";
      lastKeyTime = now;

      if (e.key === "Enter") {
        const value = buffer;
        buffer = "";
        if (value) {
          e.preventDefault();
          emit(value);
        }
        return;
      }
      if (e.key.length === 1) buffer += e.key;
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [enabled, mode, status, ignoreEditableTargets, bufferTimeoutMs, emit]);

  // Keyboard wedge (hidden input) — inert while serial is connected.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!enabled || serialActive) return;
      if (e.key !== "Enter") return;
      e.preventDefault();
      const value = e.currentTarget.value;
      e.currentTarget.value = "";
      emit(value);
    },
    [enabled, serialActive, emit]
  );

  const focusInput = useCallback(() => {
    if (!serialActive) inputRef.current?.focus();
  }, [serialActive]);

  return { inputRef, onKeyDown, focusInput, serialActive };
}
