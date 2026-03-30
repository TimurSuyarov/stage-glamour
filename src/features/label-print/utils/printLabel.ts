import type { LabelData } from "../types/label";
import { LABEL_SPECS } from "../types/label";

/**
 * Opens a new window containing only the label content and triggers the browser print dialog.
 * Supports printing multiple copies by duplicating the label element.
 *
 * @param onDone  Optional callback fired after the print dialog is dismissed and the
 *                window is closed. Use this to reset loading/printing state in the caller.
 *
 * Architecture note: this function is the single print entry-point.
 * It can be replaced later with a local print agent (e.g. raw ESC/POS or ZPL)
 * without touching any component code.
 */
export function printLabel(
  labelElement: HTMLElement,
  data: LabelData,
  onDone?: () => void,
): void {
  const spec = LABEL_SPECS[data.labelSize];
  const copies = Math.max(1, Math.min(data.copies, 100));

  const printWindow = window.open("", "_blank", "width=400,height=400");
  if (!printWindow) {
    alert("Popupga ruxsat bering (brauzer sozlamalari).");
    onDone?.();
    return;
  }

  const labelHtml = labelElement.outerHTML;
  const repeatedLabels = Array(copies).fill(labelHtml).join("\n");

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Label Print</title>
<style>
  @page {
    size: ${spec.width}mm ${spec.height}mm;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    width: ${spec.width}mm;
    height: ${spec.height}mm;
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: Arial, sans-serif;
  }

  img {
    display: block;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .label-template {
    page-break-after: always;
    break-after: page;
  }

  .label-template:last-child {
    page-break-after: auto;
    break-after: auto;
  }
</style>
</head>
<body>
${repeatedLabels}
</body>
</html>`);

  printWindow.document.close();

  /*
   * 600ms — data-URL <img> elements (QR code PNG) need a moment to decode
   * inside the new window before the print pipeline reads the layout.
   *
   * window.print() is SYNCHRONOUS in Chrome/Brave: it blocks until the user
   * clicks "Print" or "Cancel" in the dialog. So close() runs only AFTER the
   * dialog is dismissed — no race condition, no premature cancellation.
   */
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();  // blocks until dialog dismissed
    printWindow.close();  // runs right after — window always cleaned up
    onDone?.();           // re-enable caller's print button
  }, 600);
}
