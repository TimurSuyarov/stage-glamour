import type { LabelData } from "../types/label";

/**
 * Opens /p/label?{params} as a small portrait popup window.
 * The popup renders the landscape label rotated 90° and auto-prints.
 */
export function useLabelPrint() {
  const print = (data: LabelData) => {
    const copies = Math.max(1, Math.min(100, data.copies));

    const params = new URLSearchParams({
      size:     data.labelSize,
      title:    data.title,
      mainCode: data.mainCode,
      location: data.location,
      qrValue:  data.qrValue,
      copies:   String(copies),
    });

    const { pw, ph } = data.labelSize === "40x60"
      ? { pw: 480, ph: 640 }
      : { pw: 560, ph: 720 };

    const left = Math.round((window.screen.availWidth  - pw) / 2);
    const top  = Math.round((window.screen.availHeight - ph) / 2);

    const popup = window.open(
      `/p/label?${params.toString()}`,
      "_blank",
      `width=${pw},height=${ph},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=no,resizable=no`,
    );

    if (!popup) {
      alert("Popup bloklangan! Brauzerda popup ruxsat bering.");
    }
  };

  return { print };
}
