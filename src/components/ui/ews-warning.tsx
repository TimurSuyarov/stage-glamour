import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EwsIssue } from "@/lib/ews";

interface EwsWarningProps {
  issues: EwsIssue[];
  className?: string;
}

/**
 * Early Warning System panel.
 * Shows an amber collapsible warning list when `issues` is non-empty.
 * Non-blocking: does NOT prevent the user from submitting.
 */
export function EwsWarning({ issues, className }: EwsWarningProps) {
  const [expanded, setExpanded] = useState(true);

  if (issues.length === 0) return null;

  const totalMessages = issues.reduce((sum, i) => sum + i.messages.length, 0);

  return (
    <div
      className={cn(
        "rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {totalMessages} ta muammo topildi
            <span className="ml-1.5 font-normal text-amber-600 dark:text-amber-400">
              (ogohlantirish — yuborish mumkin)
            </span>
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
      </button>

      {/* Issue list */}
      {expanded && (
        <div className="border-t border-amber-200 dark:border-amber-800 px-4 py-2.5 space-y-1.5 max-h-52 overflow-y-auto">
          {issues.map((issue) =>
            issue.messages.map((msg, i) => (
              <div
                key={`${issue.label}-${i}`}
                className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300"
              >
                <span className="font-mono font-semibold shrink-0 text-amber-700 dark:text-amber-400 mt-px">
                  {issue.label}:
                </span>
                <span>{msg}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
