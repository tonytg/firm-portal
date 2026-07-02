import { cn } from "@/lib/utils";
import type { StageStatus } from "@/lib/types";

/**
 * Status vocabulary + colour mapping, mirroring the wireframe icon system:
 *   🟢 Completed · 🟡 In Progress · 👁️ Under Analysis · 🔵 Scheduled · ⚪ Not Started · 🔒 Locked
 */
const STATUS_META: Record<
  StageStatus,
  { label: string; icon: string; className: string }
> = {
  completed: {
    label: "Completed",
    icon: "🟢",
    className: "bg-status-completed/10 text-status-completed",
  },
  in_progress: {
    label: "In Progress",
    icon: "🟡",
    className: "bg-status-progress/15 text-status-progress",
  },
  under_analysis: {
    label: "Under Analysis",
    icon: "👁️",
    className: "bg-status-analysis/10 text-status-analysis",
  },
  scheduled: {
    label: "Scheduled",
    icon: "🔵",
    className: "bg-status-scheduled/10 text-status-scheduled",
  },
  not_started: {
    label: "Not Started",
    icon: "⚪",
    className: "bg-status-notstarted/10 text-status-notstarted",
  },
  locked: {
    label: "Locked",
    icon: "🔒",
    className: "bg-status-locked/10 text-status-locked",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StageStatus;
  label?: string;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.icon}</span>
      {label ?? meta.label}
    </span>
  );
}
