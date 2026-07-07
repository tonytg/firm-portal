"use client";

import { useState } from "react";
import { CalendarClock, MapPin, Users, FileSignature } from "lucide-react";
import type { MeetingSession, Role } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { StatusBar } from "./screen-shell";
import { formatDate } from "@/lib/utils";

/**
 * Reusable in-person meeting panel - Workshop, Calibration, Validation, Walkthrough.
 *
 * Behaviour rules (LOCKED across specs):
 *  - Meetings are conducted in person, outside the portal.
 *  - The client may confirm attendance, but this NEVER completes the stage.
 *  - The advisor marks completion and uploads sign-off after the session.
 *
 * Interactions here are demo-local; they will call server actions once the
 * backend is wired in.
 */
export function MeetingPanel({
  meeting,
  role,
  stageStatus,
  preRead,
}: {
  meeting: MeetingSession;
  role: Role;
  stageStatus: "not_started" | "in_progress" | "scheduled" | "completed";
  /** Optional read-only pre-read block (Validation / pre-read stages). */
  preRead?: { title: string; items: string[] };
}) {
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(
    meeting.attendanceConfirmed,
  );
  const [signOffUploaded, setSignOffUploaded] = useState(
    meeting.signOffUploaded,
  );

  return (
    <div className="space-y-6">
      <StatusBar
        items={[
          { label: "Stage", value: meeting.title },
          {
            label: "Status",
            value: <StatusBadge status={stageStatus} />,
          },
          { label: "Session Type", value: meeting.sessionType },
          { label: "Date & Time", value: formatDate(meeting.scheduledAt) },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session details */}
        <section className="rounded-lg border bg-surface p-5">
          <h3 className="font-display text-base font-semibold">
            Session Details
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {formatDate(meeting.scheduledAt)}
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
            onClick={() => setAttendanceConfirmed((v) => !v)}
            disabled={stageStatus === "completed"}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {attendanceConfirmed ? "✓ Attendance Confirmed" : "Confirm Attendance"}
          </button>
        ) : (
          <>
            <button
              onClick={() => setSignOffUploaded(true)}
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
            ? "Confirming attendance does not advance the engagement. The session is conducted in person."
            : "Marking complete is advisor-controlled and triggers the next stage / unlocks the relevant release gate."}
        </p>
      </section>
    </div>
  );
}
