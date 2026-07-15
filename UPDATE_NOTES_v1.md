# IMPACT Portal: Update Notes (v1)

**Changes made in response to your first review (UAT round 1)**

Thank you for the detailed notes on the first build. Every point you raised has been
addressed and is live on the same review URL. This document maps each of your comments to
what changed, so you can check them off against your list. It also notes the few items that
remain in progress.

---

## Summary

| # | Area | What you raised | Status |
|---|---|---|---|
| 1 | Pillar 1 | Commercial workflow missing Final Payment milestone and hold | ✓ Resolved |
| 2 | Pillar 1 | Progress calculation showed 70%, not the approved milestones | ✓ Resolved |
| 3 | Pillar 1 | Diagnosis should include the client-facing Risk Identification Workshop | ✓ Resolved |
| 4 | Pillar 1 | Standardize terminology to "Risk Identification Workshop" | ✓ Resolved |
| 5 | Pillar 1 | Industry "Hospitality" loaded the Hospital sector questionnaire | ✓ Resolved |
| 6 | Pillar 1 | Could not verify the full Core and Sector questionnaires | ✓ Resolved |
| 7 | Pillar 1 | Advisor dashboard sent you back to Client view when opening stages | ✓ Resolved |
| 8 | Pillar 2 | Same commercial release logic (Final Payment hold) | ✓ Resolved |
| 9 | Pillar 2 | Advisor view navigation blocked review of advisor screens | ✓ Resolved |
| 10 | Pillar 2 | Could not verify the Governance Diagnostic questionnaire | ✓ Resolved |
| 11 | General | Branding, colours and feel should align with the IMPACT website | ✓ Resolved |
| 12 | General | Remove em dashes and double dashes | ✓ Resolved |

---

## Pillar 1

**1. Commercial workflow now complete.**
The approved sequence is now fully reflected:

**Initial Payment → Activation → Executive Brief → Walkthrough / Delivery Session → Final Payment Due → Final Deliverables Release**

A **Final Payment** milestone and a commercial hold have been added. The final deliverables
now stay locked after the walkthrough until final payment is confirmed. The advisor confirms
payment in the control panel, and the client sees a clear "Final payment due" notice while
the hold is in place.

**2. Progress calculation corrected.**
Progress now sits on the approved milestone values only (**0% / 20% / 40% / 60% / 80% / 100%**)
and no longer jumps ahead when a later stage is scheduled early. The sample Pillar 1
engagement now reads **40%**, matching its current stage.

**3. Risk Identification Workshop is now a client-facing step.**
Diagnosis is shown in two parts: **Diagnosis (Internal Analysis)**, which you see as progress
only, and the client-facing **Risk Identification Workshop**, which you attend and can open in
the portal.

**4. Terminology standardized.**
"Risk Identification Workshop" is now used consistently throughout the portal.

**5. Sector questionnaire corrected.**
The sample engagement (a hospitality group) now loads the **F&B** sector questionnaire, which
matches its industry. The Hospital / Healthcare set remains available for healthcare clients.

**6. Full questionnaires are now verifiable, and the real questions are loaded.**
Two changes address this:

- A new **Questionnaire Review** page (linked on the dashboard) lists every section and
  question in one read-only view, so you can confirm completeness at a glance.
- The **approved Pillar 1 questions are now loaded in full**: the Core intake (8 modules, 37
  questions) plus the **F&B** and **Hospital** sector modules, transcribed from the approved
  documents. Each question shows its reference code and guidance points. The two Core items
  marked "Advisor, not for client" are hidden from the client view and appear only to the
  advisor.

**7. Advisor navigation fixed.**
Opening a stage from the Advisor dashboard now keeps you in Advisor view, so the full
advisor-side workflow is reviewable end to end.

---

## Pillar 2

**8. Same commercial release logic applied.**
The Controlled Release now follows the same discipline: Executive Brief first, then the
walkthrough / delivery session, then **Final Payment Due**, then the final PDFs unlock.

**9. Advisor-side screens are now reachable.**
The navigation fix also resolves this for Pillar 2. The advisor-side Diagnostic, Architecture
Build and Validation stages can now be opened from the Advisor dashboard. These are internal
working stages; their detailed content will continue to be built out.

**10. Governance Diagnostic is now reachable and listed for review.**
The sample Pillar 2 engagement is now activated so its Governance questionnaire can be opened,
and all of its sections appear on the Questionnaire Review page. See the note below on the
Pillar 2 question wording.

---

## General

**11. Branding aligned with the IMPACT website.**
The portal now uses the El Hachem Law brand: the near-black and refined gold palette, and the
same typefaces the firm's website uses (Lora for headings, Inter for body text), so the portal
reads as one consistent product.

**12. Em dashes and double dashes removed.**
These have been removed from all portal copy and from the client documentation.

---

## Still in progress

To be transparent about what is not yet final:

- **Pillar 2 questionnaire wording.** The 12 governance sections and structure are in place,
  but the question wording is still placeholder, pending the final Pillar 2 question set.
- **Construction sector module.** It is transcribed and ready to switch on when needed; only
  Hospital and F&B are wired in today.
- **Live product foundations.** The build still runs on sample data with the demonstration
  Client / Advisor switch. Secure sign-in, saved responses, and real file upload and download
  are the next phase before go-live.

---

## How to re-review

The review URL is unchanged. A quick pass to confirm this round:

1. On the dashboard, note the corrected progress on the Pillar 1 engagement (40%).
2. Open the Intake stage and review the real Core and F&B questions; open **Questionnaire
   Review** from the dashboard to check completeness.
3. Open the **Risk Identification Workshop** stage.
4. Open Output to see the deliverables list and the Final Payment hold.
5. Switch to **Advisor view**, then open stages from the dashboard to confirm you stay in the
   advisor workflow.

As before, if anything is unclear or does not behave as expected, noting the page or stage and
what you expected is the most helpful feedback.

---

*Confidential, IMPACT Advisory. Controlled delivery portal.*
