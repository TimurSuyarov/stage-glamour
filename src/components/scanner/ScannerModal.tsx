import { useEffect, useState } from "react";
import { Modal, Button as AntButton, Select } from "antd";
import { useTranslation } from "react-i18next";
import { ScanLine } from "lucide-react";
import { useScanner } from "@/contexts/ScannerContext";
import { BAUD_RATES } from "@/lib/scannerStorage";
import { serialErrorKey } from "@/lib/serialErrors";
import { cn } from "@/lib/utils";

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
}

interface ScanRow {
  code: string;
  at: number;
}

const MAX_ROWS = 20;

export function ScannerModal({ open, onClose }: ScannerModalProps) {
  const { t } = useTranslation();
  const { supported, status, baudRate, errorCode, connect, disconnect, setBaudRate, subscribe } =
    useScanner();

  const [recent, setRecent] = useState<ScanRow[]>([]);

  // Live scan feed — subscribe only while the modal is open so high-frequency
  // re-renders stay scoped to this component.
  useEffect(() => {
    if (!open) return;
    return subscribe((code) => {
      setRecent((prev) => [{ code, at: Date.now() }, ...prev].slice(0, MAX_ROWS));
    });
  }, [open, subscribe]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const lastScan = recent[0]?.code ?? null;

  return (
    <Modal title={t("scanner.title")} open={open} onCancel={onClose} footer={null} width={520}>
      <div className="space-y-4 py-2">
        {!supported ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">{t("scanner.unsupportedBrowser")}</p>
            <p className="mt-1 text-xs text-amber-800">{t("scanner.secureContextRequired")}</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("scanner.baudRate")}</label>
                <Select
                  value={baudRate}
                  onChange={(v) => setBaudRate(Number(v))}
                  className="w-[140px] [&_.ant-select-selector]:!h-9 [&_.ant-select-selector]:!items-center"
                  options={BAUD_RATES.map((rate) => ({ value: rate, label: String(rate) }))}
                />
              </div>

              {isConnected ? (
                <AntButton danger onClick={() => void disconnect()}>
                  {t("scanner.disconnect")}
                </AntButton>
              ) : (
                <AntButton type="primary" loading={isConnecting} onClick={() => void connect()}>
                  {t("scanner.connect")}
                </AntButton>
              )}
            </div>

            {errorCode && status === "error" && (
              <p className="text-xs text-destructive">{t(serialErrorKey(errorCode))}</p>
            )}

            {/* Live test area */}
            <div
              className={cn(
                "rounded-xl border p-5 text-center transition-colors",
                isConnected ? "border-border bg-muted/30" : "border-dashed border-border bg-muted/10"
              )}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("scanner.lastScan")}
              </p>
              <p className="my-2 break-all font-mono text-2xl font-semibold min-h-[2rem]">
                {lastScan ?? "—"}
              </p>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ScanLine className="h-3.5 w-3.5" />
                {isConnected ? t("scanner.testHint") : t("scanner.statusDisconnected")}
              </p>
            </div>

            {/* Recent scans */}
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                {t("scanner.recentScans")}
              </div>
              {recent.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("scanner.noScansYet")}
                </p>
              ) : (
                <ul className="max-h-48 divide-y divide-border overflow-y-auto">
                  {recent.map((row, i) => (
                    <li
                      key={`${row.at}-${i}`}
                      className="flex items-center justify-between px-3 py-2 font-mono text-xs"
                    >
                      <span className="break-all text-status-success">{row.code}</span>
                      <span className="ml-3 shrink-0 text-muted-foreground">{row.code.length}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
