// Framework-agnostic Web Serial helpers. Mirrors the reference tester
// (serial-scanner-tester.html): open a port, read the stream, split scanned
// lines on CR/LF, and emit each trimmed non-empty line.

export function isSerialSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serial" in navigator &&
    typeof window !== "undefined" &&
    window.isSecureContext
  );
}

/** Previously-granted port, if any — does NOT prompt the user. */
export async function getFirstGrantedPort(): Promise<SerialPort | null> {
  if (!isSerialSupported()) return null;
  const ports = await navigator.serial.getPorts();
  return ports[0] ?? null;
}

/** Opens the native port chooser. MUST be called from a user gesture. */
export async function requestPort(): Promise<SerialPort> {
  return navigator.serial.requestPort();
}

export interface ReadLoopHandlers {
  onLine: (code: string) => void;
  onError: (err: unknown) => void;
  /** Return false to stop the loop (the provider keeps this in a ref). */
  shouldContinue: () => boolean;
}

export interface ReadLoopHandle {
  stop: () => Promise<void>;
}

/**
 * Reads from `port` until stopped. Buffers decoded text and splits on CR/LF,
 * keeping any trailing partial line in the buffer across chunks.
 */
export function runReadLoop(port: SerialPort, handlers: ReadLoopHandlers): ReadLoopHandle {
  const { onLine, onError, shouldContinue } = handlers;
  const decoder = new TextDecoder();
  let buffer = "";
  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const loop = async () => {
    while (shouldContinue() && port.readable) {
      const reader = port.readable.getReader();
      activeReader = reader;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/[\r\n]/);
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const code = part.trim();
            if (code) onLine(code);
          }
        }
      } catch (err) {
        onError(err);
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // reader may already be released
        }
        activeReader = null;
      }
    }
  };

  // Fire and forget; the loop self-terminates when shouldContinue() is false
  // or the port is unplugged (read() rejects / readable becomes null).
  void loop();

  return {
    stop: async () => {
      try {
        await activeReader?.cancel();
      } catch {
        // ignore — cancelling unblocks a pending read()
      }
    },
  };
}
