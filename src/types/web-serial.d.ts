// Ambient Web Serial API types — not part of TypeScript's default DOM lib.
// Minimal surface needed to talk to a USB virtual-COM barcode scanner.
// tsconfig has `moduleDetection: "force"`, so we need `export {}` + `declare global`
// for these to merge with the global scope (e.g. `interface Navigator`).
export {};

declare global {
  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    bufferSize?: number;
    flowControl?: "none" | "hardware";
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
    addEventListener(
      type: "connect" | "disconnect",
      listener: (this: SerialPort, ev: Event) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
      type: "connect" | "disconnect",
      listener: (this: SerialPort, ev: Event) => void,
      options?: boolean | EventListenerOptions
    ): void;
  }

  interface Serial extends EventTarget {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    addEventListener(
      type: "connect" | "disconnect",
      listener: (this: Serial, ev: Event) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
      type: "connect" | "disconnect",
      listener: (this: Serial, ev: Event) => void,
      options?: boolean | EventListenerOptions
    ): void;
  }

  interface Navigator {
    readonly serial: Serial;
  }
}
