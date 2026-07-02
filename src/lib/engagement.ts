/**
 * Engagement business logic — the "rules" half of the state machine.
 *
 * These functions enforce the LOCKED rules from the specs. They are written
 * to run on the server so the client UI can never bypass a gate by guessing
 * a URL: visibility filtering and release gating both flow through here.
 */

import type {
  Engagement,
  StageDefinition,
  StageState,
  StageStatus,
  Deliverable,
} from "./types";
import { isActivated } from "./types";
import { getStageDefinitions } from "./pillars";

export function getStageState(e: Engagement, key: string): StageState {
  return (
    e.stages.find((s) => s.key === key) ?? { key, status: "not_started" }
  );
}

/**
 * Progress bar percentage (Pillar 1 uses explicit weights; Pillar 2 derives
 * an even split across non-internal stages so the client sees meaningful motion).
 */
export function getProgressPercent(e: Engagement): number {
  if (!isActivated(e)) return 0;
  const defs = getStageDefinitions(e.pillar);

  const weighted = defs.filter((d) => d.progressWeight !== undefined);
  if (weighted.length > 0) {
    // Pillar 1: highest weight of any completed/active stage.
    let pct = 0;
    for (const d of weighted) {
      const st = getStageState(e, d.key).status;
      if (st === "completed") pct = Math.max(pct, d.progressWeight!);
      else if (st === "in_progress" || st === "scheduled")
        pct = Math.max(pct, Math.max(0, d.progressWeight! - 10));
    }
    return pct;
  }

  // Pillar 2: completed share of all stages.
  const completed = defs.filter(
    (d) => getStageState(e, d.key).status === "completed",
  ).length;
  return Math.round((completed / defs.length) * 100);
}

/**
 * What status should the CLIENT see for a stage? Internal stages collapse to
 * "under_analysis" so the client perceives progress without accessing content.
 */
export function clientFacingStatus(
  def: StageDefinition,
  state: StageState,
): StageStatus {
  if (def.visibility === "status_only" && state.status === "in_progress") {
    return "under_analysis";
  }
  return state.status;
}

/** Internal stages (Pillar 2 stage 0/3/4) are hidden from the client list entirely. */
export function isStageVisibleToClient(def: StageDefinition): boolean {
  return def.visibility !== "internal";
}

/** Can the client OPEN (interact with) this stage right now? */
export function canClientAccessStage(
  e: Engagement,
  def: StageDefinition,
): boolean {
  if (!isActivated(e)) return false; // nothing accessible before activation
  if (def.visibility === "internal" || def.visibility === "status_only") {
    return false; // visible as progress only
  }
  return true;
}

/**
 * Release gating — the core "controlled release" discipline.
 *
 * LOCKED rules:
 *  - Executive Brief / Summary releases first.
 *  - The walkthrough/validation meeting must complete before final PDFs unlock.
 *  - Final deliverables are PDF only.
 *  - The advisor still controls the `released` flag; this function determines
 *    whether the advisor is even *permitted* to release yet.
 */
export function canReleaseDeliverable(
  e: Engagement,
  d: Deliverable,
): boolean {
  switch (d.releaseGate) {
    case "executive_first":
      return true; // released first, once advisor chooses
    case "after_validation": {
      const v = getStageState(e, "validation").status;
      return v === "completed";
    }
    case "after_walkthrough": {
      const wt =
        e.pillar === "pillar_1"
          ? getStageState(e, "walkthrough").status
          : getStageState(e, "controlled_release").status;
      return wt === "completed";
    }
    default:
      return false;
  }
}

/** Whether a client may actually download a deliverable (released AND gate satisfied). */
export function isDeliverableDownloadable(
  e: Engagement,
  d: Deliverable,
): boolean {
  return d.released && canReleaseDeliverable(e, d);
}
