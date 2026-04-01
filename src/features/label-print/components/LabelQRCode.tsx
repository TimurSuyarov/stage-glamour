import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface LabelQRCodeProps {
  value: string;
  /** Size in millimeters */
  sizeMm: number;
}

/**
 * Renders a QR code as a self-contained PNG <img> element using the `qrcode`
 * library (pure JS — no React dependency, no canvas DOM manipulation).
 *
 * QRCode.toDataURL() generates the PNG entirely in memory and returns a
 * base64 data URL. The resulting <img> is fully self-contained, survives
 * outerHTML serialisation, and renders reliably inside a document.write()
 * print window across all Chromium-based browsers.
 */
export function LabelQRCode({ value, sizeMm }: LabelQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }

    // width in px at 304 DPI (12px/mm) — above thermal native 203 DPI
    // so the QR modules are sharp and scannable after thermal transfer.
    const sizePx = Math.round(sizeMm * 12);

    QRCode.toDataURL(value, {
      width: sizePx,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [value, sizeMm]);

  if (!value) {
    return (
      <div
        style={{
          width: `${sizeMm}mm`,
          height: `${sizeMm}mm`,
          border: "1px dashed #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "6px",
          color: "#aaa",
        }}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl || undefined}
      alt=""
      style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm`, display: "block", flexShrink: 0 }}
    />
  );
}
