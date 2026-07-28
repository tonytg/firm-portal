"use client";

import { CalendarClock, MapPin, Users, FileSignature } from "lucide-react";
import type { MeetingSession, Role } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { StatusBar } from "./screen-shell";
import { usePersistentState } from "@/lib/use-demo-store";
import { formatDate } from "@/lib/utils";

/**
 * Reusable in-person meeting panel - Workshop, Calibration, Validation, Walkthrough.
 *
 * Behaviour rules (LOCKED across specs):
 *  - Meetings are conducted in person, outside the portal.
 *  - The advisor schedules the session (date and time picker below).
 *  - The client may confirm attendance, but this NEVER completes the stage.
 *  - The advisor marks completion and uploads sign-off after the session.
 *
 * Scheduling / attendance / sign-off persist to this browser during the preview;
 * server scheduling and calendar invites arrive with the backend.
 */
interface MeetingState {
  scheduledAt: string | null;
  attendanceConfirmed: boolean;
  signOffUploaded: boolean;
}

/** ISO (or datetime-local) string -> value for <input type="datetime-local">. */
function toInputValue(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingPanel({
  meeting,
  role,
  stageStatus,
  storageKey,
  preRead,
}: {
  meeting: MeetingSession;
  role: Role;
  stageStatus: "not_started" | "in_progress" | "scheduled" | "completed";
  /** Stable key for demo persistence, e.g. "eng-p1-acme:risk_workshop". */
  storageKey: string;
  /** Optional read-only pre-read block (Validation / pre-read stages). */
  preRead?: { title: string; items: string[] };
}) {
  const [state, setState] = usePersistentState<MeetingState>(
    `meeting:${storageKey}`,
    {
      scheduledAt: meeting.scheduledAt ?? null,
      attendanceConfirmed: meeting.attendanceConfirmed,
      signOffUploaded: meeting.signOffUploaded,
    },
  );
  const { scheduledAt, attendanceConfirmed, signOffUploaded } = state;
  const isScheduled = Boolean(scheduledAt);

  return (
    <div className="space-y-6">
      <StatusBar
        items={[
          { label: "Stage", value: meeting.title },
          { label: "Status", value: <StatusBadge status={stageStatus} /> },
          { label: "Session Type", value: meeting.sessionType },
          {
            label: "Date & Time",
            value: isScheduled ? formatDate(scheduledAt!) : "Not scheduled",
          },
        ]}
      />

      {/* Scheduling - advisor picks a date and time; client sees it read-only */}
      <section className="rounded-lg border bg-surface p-5">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <CalendarClock className="h-4 w-4" /> Schedule Session
        </h3>
        {role === "advisor" ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                Session date and time
              </span>
              <input
                type="datetime-local"
                value={toInputValue(scheduledAt)}
                onChange={(e) =>
                  setState((p) => ({
                    ...p,
                    scheduledAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  }))
                }
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            {isScheduled && (
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, scheduledAt: null }))}
                className="rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-surface-muted"
              >
                Clear
              </button>
            )}
            <p className="w-full text-xs text-muted-foreground">
              {isScheduled
                ? `Scheduled for ${formatDate(scheduledAt!)}. The client sees this time and can confirm attendance.`
                : "Pick a date and time to schedule the session."}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {isScheduled
              ? `This session is scheduled for ${formatDate(scheduledAt!)}.`
              : "The advisor will schedule this session. You will see the date and time here once set."}
          </p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session details */}
        <section className="rounded-lg border bg-surface p-5">
          <h3 className="font-display text-base font-semibold">
            Session Details
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {isScheduled ? formatDate(scheduledAt!) : "Not scheduled"}
              {meeting.durationMinutes && ` · ${meeting.durationMinutes} min`}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {meeting.location ?? "To be confirmed"}
            </div>
          </dl>

          <h4 className="mt-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Participants
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {meeting.participants.map((p) => (
              <li key={p.name}>
                {p.name} - <span className="text-foreground">{p.role}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Agenda */}
        <section className="rounded-lg border bg-surface p-5">
          <h3 className="font-display text-base font-semibold">Agenda</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {meeting.agenda.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </section>
      </div>

      {/* Optional read-only pre-read */}
      {preRead && (
        <section className="rounded-lg border bg-surface-muted p-5">
          <h3 className="font-display text-base font-semibold">
            {preRead.title}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (read-only)
            </span>
          </h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {preRead.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Action area - differs by role */}
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-surface p-5">
        {role === "client" ? (
          <button
            onClick={() =>
              setState((p) => ({
                ...p,
                attendanceConfirmed: !p.attendanceConfirmed,
              }))
            }
            disabled={stageStatus === "completed" || !isScheduled}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {attendanceConfirmed
              ? "✓ Attendance Confirmed"
              : "Confirm Attendance"}
          </button>
        ) : (
          <>
            <button
              onClick={() => setState((p) => ({ ...p, signOffUploaded: true }))}
              className="inline-flex items-center gap-2 rounded-md border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy hover:text-white"
            >
              <FileSignature className="h-4 w-4" />
              {signOffUploaded ? "Sign-Off Uploaded ✓" : "Upload Sign-Off"}
            </button>
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy transition hover:bg-accent-soft">
              Mark Stage Complete
            </button>
          </>
        )}
        <p className="w-full text-xs text-muted-foreground">
          {role === "client"
            ? isScheduled
              ? "Confirming attendance does not advance the engagement. The session is conducted in person."
              : "Attendance can be confirmed once the advisor schedules the session."
            : "Marking complete is advisor-controlled and triggers the next stage / unlocks the relevant release gate."}
        </p>
      </section>
    </div>
  );
}
