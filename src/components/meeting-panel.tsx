"use client";

import { useState, useTransition } from "react";
import { CalendarClock, MapPin, Users, FileSignature } from "lucide-react";
import type { MeetingSession, Role } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { StatusBar } from "./screen-shell";
import { formatDate } from "@/lib/utils";
import {
  setMeetingSchedule,
  confirmAttendance,
  setSignOff,
} from "@/app/engagement/actions";

/**
 * In-person meeting panel. The advisor schedules the session (date/time picker)
 * and uploads sign-off; the client confirms attendance (never completes the
 * stage). All three persist via server actions (RLS: schedule/sign-off are
 * admin-only; attendance goes through the confirm_attendance RPC).
 */
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
  engagementId,
  stage,
  preRead,
}: {
  meeting: MeetingSession;
  role: Role;
  stageStatus: "not_started" | "in_progress" | "scheduled" | "completed";
  engagementId: string;
  stage: string;
  preRead?: { title: string; items: string[] };
}) {
  const [scheduledAt, setScheduledAt] = useState<string | null>(
    meeting.scheduledAt ?? null,
  );
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(
    meeting.attendanceConfirmed,
  );
  const [signOffUploaded, setSignOffUploaded] = useState(meeting.signOffUploaded);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meetingId = meeting.id ?? "";
  const isScheduled = Boolean(scheduledAt);

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

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
                defaultValue={toInputValue(scheduledAt)}
                disabled={pending}
                onChange={(e) => {
                  const iso = e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null;
                  setScheduledAt(iso);
                  run(() =>
                    setMeetingSchedule(meetingId, iso, engagementId, stage),
                  );
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
            </label>
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

        <section className="rounded-lg border bg-surface p-5">
          <h3 className="font-display text-base font-semibold">Agenda</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {meeting.agenda.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </section>
      </div>

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

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-surface p-5">
        {role === "client" ? (
          <button
            onClick={() => {
              const next = !attendanceConfirmed;
              setAttendanceConfirmed(next);
              run(() =>
                confirmAttendance(meetingId, next, engagementId, stage),
              );
            }}
            disabled={stageStatus === "completed" || !isScheduled || pending}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {attendanceConfirmed
              ? "✓ Attendance Confirmed"
              : "Confirm Attendance"}
          </button>
        ) : (
          <button
            onClick={() => {
              setSignOffUploaded(true);
              run(() => setSignOff(meetingId, true, engagementId, stage));
            }}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy hover:text-white disabled:opacity-50"
          >
            <FileSignature className="h-4 w-4" />
            {signOffUploaded ? "Sign-Off Recorded ✓" : "Record Sign-Off"}
          </button>
        )}
        {error && (
          <p className="w-full text-xs text-status-locked">{error}</p>
        )}
        <p className="w-full text-xs text-muted-foreground">
          {role === "client"
            ? isScheduled
              ? "Confirming attendance does not advance the engagement. The session is conducted in person."
              : "Attendance can be confirmed once the advisor schedules the session."
            : "Stage completion is set from the Advisor Control Panel."}
        </p>
      </section>
    </div>
  );
}
