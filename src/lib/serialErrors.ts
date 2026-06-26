// Classify Web Serial API errors by DOMException.name (the STABLE identifier).
// Never branch on error.message — it's English and version-dependent. The
// returned code maps to an i18n key ("scanner.err.<CODE>") localized in the
// uz/ru common.json files.

export type SerialErrorCode =
  | "NOT_SUPPORTED"
  | "NO_PORT_SELECTED"
  | "PERMISSION_DENIED"
  | "ALREADY_OPEN"
  | "OPEN_FAILED"
  | "BREAK"
  | "FRAMING"
  | "PARITY"
  | "OVERRUN"
  | "INVALID_OPTIONS"
  | "OS_ERROR"
  | "UNKNOWN";

export function classifySerialError(err: unknown): SerialErrorCode {
  // open() option validation throws a real TypeError, not a DOMException.
  if (err instanceof TypeError) return "INVALID_OPTIONS";

  const name = (err as { name?: string } | null)?.name;
  switch (name) {
    // --- requestPort() ---
    case "NotFoundError":
      return "NO_PORT_SELECTED"; // picker dismissed
    case "AbortError":
      return "NO_PORT_SELECTED"; // some Chromium versions use this
    case "SecurityError":
      return "PERMISSION_DENIED"; // no user gesture / blocked by policy / not HTTPS

    // --- open() ---
    case "InvalidStateError":
      return "ALREADY_OPEN";
    case "NetworkError":
      return "OPEN_FAILED"; // "Failed to open serial port" — usually port in use

    // --- read stream (port.readable errors) ---
    case "BreakError":
      return "BREAK"; // line held low: wrong baud or wrong/empty port (e.g. COM1)
    case "FramingError":
      return "FRAMING"; // wrong baud or data/stop bits
    case "ParityError":
      return "PARITY";
    case "BufferOverrunError":
      return "OVERRUN";
    case "UnknownError":
      return "OS_ERROR";

    default:
      return "UNKNOWN";
  }
}

/** i18n key for a code, e.g. "scanner.err.NO_PORT_SELECTED". */
export function serialErrorKey(code: SerialErrorCode): string {
  return `scanner.err.${code}`;
}

/** True when the error is just the user dismissing the port chooser. */
export function isPortDismissal(code: SerialErrorCode): boolean {
  return code === "NO_PORT_SELECTED";
}
