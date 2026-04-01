export type LabelSize = "40x60" | "60x80";

export interface LabelData {
  labelSize: LabelSize;
  title: string;
  mainCode: string;
  location: string;
  qrValue: string;
  copies: number;
}

/** Physical dimensions and safe-area insets in millimeters */
export interface LabelSpec {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export const LABEL_SPECS: Record<LabelSize, LabelSpec> = {
  "40x60": {
    width: 58,
    height: 42,
    padding: { top: 5, right: 0, bottom: 5, left: 0 },
  },
  "60x80": {
    width: 80,
    height: 60,
    padding: { top: 5, right: 0, bottom: 5, left: 0 },
  },
};

export const DEFAULT_LABEL_DATA: LabelData = {
  labelSize: "40x60",
  title: "",
  mainCode: "",
  location: "Тошкент",
  qrValue: "https://t.me/Fikrlar_banafa_bot",
  copies: 1,
};
