import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ScanLine, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScanner, type ScannerStatus } from "@/contexts/ScannerContext";
import { ScannerModal } from "./ScannerModal";

const DOT_COLORS: Record<ScannerStatus, string> = {
  connected: "bg-status-success",
  connecting: "bg-status-warning animate-pulse",
  disconnected: "bg-status-neutral",
  error: "bg-status-error",
  unsupported: "bg-status-neutral",
};

export function ScannerControls() {
  const { t } = useTranslation();
  const { supported, status, baudRate, connect, disconnect, reconnect } = useScanner();
  const [modalOpen, setModalOpen] = useState(false);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const statusLabel =
    status === "connected"
      ? t("scanner.connectedAt", { baud: baudRate })
      : status === "connecting"
        ? t("scanner.statusConnecting")
        : status === "error"
          ? t("scanner.statusError")
          : status === "unsupported"
            ? t("scanner.statusKeyboardMode")
            : t("scanner.statusDisconnected");

  return (
    <div className="flex items-center gap-1.5">
      {/* Status badge — clickable to reconnect when in an error state */}
      <button
        type="button"
        disabled={status !== "error"}
        onClick={status === "error" ? () => void reconnect() : undefined}
        title={status === "error" ? t("scanner.reconnect") : statusLabel}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 h-7 text-xs font-medium",
          status === "error" && "cursor-pointer hover:bg-muted/70"
        )}
      >
        <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[status])} />
        <span className="hidden md:inline text-muted-foreground">{statusLabel}</span>
      </button>

      {/* Connect / Disconnect — connects directly with the saved baud */}
      {isConnected ? (
        <Button variant="outline" size="sm" className="h-7" onClick={() => void disconnect()}>
          {t("scanner.disconnect")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7"
          disabled={!supported || isConnecting}
          title={!supported ? t("scanner.unsupportedBrowser") : undefined}
          onClick={() => void connect()}
        >
          {isConnecting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          {t("scanner.connect")}
        </Button>
      )}

      {/* Scanner config — the only opener of the modal */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5"
        onClick={() => setModalOpen(true)}
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        {t("scanner.config")}
      </Button>

      <ScannerModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
