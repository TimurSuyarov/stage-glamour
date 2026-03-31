import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface LabelBarcodeProps {
  value: string;
  /** Displayed width in millimeters */
  widthMm: number;
  /** Displayed height in millimeters */
  heightMm: number;
}

/**
 * Renders a QR code as a self-contained PNG <img> element.
 *
 * Strategy: qrcode renders into an off-screen <canvas>, then we call
 * toDataURL("image/png") to get a base64 string.
 * The resulting <img> is fully self-contained — survives popup window context.
 */
export function LabelBarcode({ value, widthMm, heightMm }: LabelBarcodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }

    const sizePx = Math.round(Math.max(widthMm, heightMm) * 12); // 12px/mm ≈ 304 DPI

    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: sizePx,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [value, widthMm, heightMm]);

  if (!value || !dataUrl) {
    return (
      <div
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          border: "1px dashed #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "5px",
          color: "#aaa",
          flexShrink: 0,
        }}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt=""
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        display: "block",
        flexShrink: 0,
        objectFit: "fill",
      }}
    />
  );
}
