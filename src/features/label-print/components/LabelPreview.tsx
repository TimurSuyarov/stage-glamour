import { useRef } from "react";
import type { LabelData } from "../types/label";
import { LABEL_SPECS } from "../types/label";
import { Label40x60 } from "./Label40x60";
import { Label60x80 } from "./Label60x80";
import { printLabel } from "../utils/printLabel";
import { Button } from "@/components/ui/button";
import { Printer, FlaskConical } from "lucide-react";

/** Diagnostic: opens a minimal print window with plain text only — no templates, no QR.
 *  Use this to confirm the browser→printer pipeline works before testing label output. */
function plainTextTestPrint() {
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) {
    alert("Popup bloklangan! Brauzerni popup ruxsat bering.");
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Test Print</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; }
  h1 { font-size: 24px; }
  p  { font-size: 14px; color: #555; }
</style>
</head>
<body>
  <h1>✓ Print ishlayapti!</h1>
  <p>Bu oddiy matn testi. Agar shu chiqsa — browser→printer pipeline to'g'ri.</p>
  <p style="margin-top:12px; font-size:12px; color:#999;">Vaqt: ${new Date().toLocaleString()}</p>
</body>
</html>`);
  w.document.close();
  w.onload = () => setTimeout(() => { w.focus(); w.print(); w.close(); }, 200);
}

const SCALE = 2;

interface LabelPreviewProps {
  data: LabelData;
}

export function LabelPreview({ data }: LabelPreviewProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const spec = LABEL_SPECS[data.labelSize];

  const handlePrint = () => {
    if (!labelRef.current) return;
    const labelEl = labelRef.current.querySelector(".label-template") as HTMLElement | null;
    if (!labelEl) return;
    printLabel(labelEl, data);
  };

  const LabelComponent = data.labelSize === "40x60" ? Label40x60 : Label60x80;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer container reserves the correct space for the scaled label */}
      <div
        className="border border-dashed border-gray-300 rounded-md bg-gray-50 p-4"
        style={{
          width: `calc(${spec.width}mm * ${SCALE} + 32px)`,
          height: `calc(${spec.height}mm * ${SCALE} + 32px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={labelRef}
          style={{
            width: `calc(${spec.width}mm * ${SCALE})`,
            height: `calc(${spec.height}mm * ${SCALE})`,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <div className="shadow-md">
              <LabelComponent data={data} />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handlePrint} className="gap-2" size="lg">
        <Printer className="h-4 w-4" />
        Chop etish{data.copies > 1 ? ` (${data.copies} nusxa)` : ""}
      </Button>

      <Button
        onClick={plainTextTestPrint}
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Oddiy matn testi
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        O'lcham: {spec.width}×{spec.height} mm · Printer sozlamalarida shu o'lchamni tanlang
      </p>
    </div>
  );
}
