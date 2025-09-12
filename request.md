{Make a unit test for this: Prompt for Cursor AI Agent — Fix Fill-in-the-Blank + Word/Round Count

Goal: Replace the broken Fill-in-the-Blank flow with a working API + UI that correctly advances blanks and ties into word/round counting.

Replace & Integrate

Remove the current Fill-in-the-Blank logic.

Implement a new Fill-in-the-Blank API that:

Uses prior “syntax memoized verses” data (manually captured).

Generates blanks from missed words (or a fallback selection).

Exposes events/state needed by the word count and round count displays.

Word Count Logic (most important)

Display word count as current / total.

total = the number of blanks in the current set (e.g., 7).

On each correct word, increment current by 1 (e.g., 1/7 → 2/7 → … → 7/7).

When the user reaches 7/7, the set is complete. Emit a wordSetComplete signal and only then trigger round progression.

Round Count Logic

Display round count as currentRound / totalRounds (e.g., 1/3).

On wordSetComplete, advance the round: 1/3 → 2/3.

Never advance the round early; never skip word count steps.

Progression Bug Fix (critical)

After a correct entry, immediately advance to the next blank.

Do not stay stuck on the same blank; no extra clicks or refocus needed.

If the plan/randomization selects multiple target blanks, move to the next planned blank in order.

If the same word appears multiple times, filling one only completes that specific blank, not all duplicates.

UI ←→ API Sync (must update in real time)

Underline: show for all active blanks (driven by API state).

Purple gradient: apply to the currently active blank while the user is typing.

Green highlight: apply immediately when the API confirms a correct capture.

All visual states must update synchronously from API state changes (no lag, flicker, or double-submit).

Deliverable

A working Fill-in-the-Blank module replacing the old one, with:

Correct word count (x/y) behavior and completion at y/y.

Correct round count progression only after y/y.

Guaranteed advance to next blank after a correct word.

UI effects (underline, purple active, green success) in sync with API state.}

---

## **Mission Briefing: Standard Operating Protocol**

You will now execute this request in full compliance with your **AUTONOMOUS PRINCIPAL ENGINEER - OPERATIONAL DOCTRINE.** Each phase is mandatory. Deviations are not permitted.

---

## **Phase 0: Reconnaissance & Mental Modeling (Read-Only)**

-   **Directive:** Perform a non-destructive scan of the entire repository to build a complete, evidence-based mental model of the current system architecture, dependencies, and established patterns.
-   **Output:** Produce a concise digest (≤ 200 lines) of your findings. This digest will anchor all subsequent actions.
-   **Constraint:** **No mutations are permitted during this phase.**

---

## **Phase 1: Planning & Strategy**

-   **Directive:** Based on your reconnaissance, formulate a clear, incremental execution plan.
-   **Plan Requirements:**
    1.  **Restate Objectives:** Clearly define the success criteria for this request.
    2.  **Identify Full Impact Surface:** Enumerate **all** files, components, services, and user workflows that will be directly or indirectly affected. This is a test of your system-wide thinking.
    3.  **Justify Strategy:** Propose a technical approach. Explain *why* it is the best choice, considering its alignment with existing patterns, maintainability, and simplicity.
-   **Constraint:** Invoke the **Clarification Threshold** from your Doctrine only if you encounter a critical ambiguity that cannot be resolved through further research.

---

## **Phase 2: Execution & Implementation**

-   **Directive:** Execute your plan incrementally. Adhere strictly to all protocols defined in your **Operational Doctrine.**
-   **Core Protocols in Effect:**
    -   **Read-Write-Reread:** For every file you modify, you must read it immediately before and immediately after the change.
    -   **Command Execution Canon:** All shell commands must be executed using the mandated safety wrapper.
    -   **Workspace Purity:** All transient analysis and logs remain in-chat. No unsolicited files.
    -   **System-Wide Ownership:** If you modify a shared component, you are **MANDATED** to identify and update **ALL** its consumers in this same session.

---

## **Phase 3: Verification & Autonomous Correction**

-   **Directive:** Rigorously validate your changes with fresh, empirical evidence.
-   **Verification Steps:**
    1.  Execute all relevant quality gates (unit tests, integration tests, linters, etc.).
    2.  If any gate fails, you will **autonomously diagnose and fix the failure,** reporting the cause and the fix.
    3.  Perform end-to-end testing of the primary user workflow(s) affected by your changes.

---

## **Phase 4: Mandatory Zero-Trust Self-Audit**

-   **Directive:** Your primary implementation is complete, but your work is **NOT DONE.** You will now reset your thinking and conduct a skeptical, zero-trust audit of your own work. Your memory is untrustworthy; only fresh evidence is valid.
-   **Audit Protocol:**
    1.  **Re-verify Final State:** With fresh commands, confirm the Git status is clean, all modified files are in their intended final state, and all relevant services are running correctly.
    2.  **Hunt for Regressions:** Explicitly test at least one critical, related feature that you did *not* directly modify to ensure no unintended side effects were introduced.
    3.  **Confirm System-Wide Consistency:** Double-check that all consumers of any changed component are working as expected.

---

## **Phase 5: Final Report & Verdict**

-   **Directive:** Conclude your mission with a single, structured report.
-   **Report Structure:**
    -   **Changes Applied:** A list of all created or modified artifacts.
    -   **Verification Evidence:** The commands and outputs from your autonomous testing and self-audit, proving the system is healthy.
    -   **System-Wide Impact Statement:** A confirmation that all identified dependencies have been checked and are consistent.
    -   **Final Verdict:** Conclude with one of the two following statements, exactly as written:
        -   `"Self-Audit Complete. System state is verified and consistent. No regressions identified. Mission accomplished."`
        -   `"Self-Audit Complete. CRITICAL ISSUE FOUND. Halting work. [Describe issue and recommend immediate diagnostic steps]."`
-   **Constraint:** Maintain an inline TODO ledger using ✅ / ⚠️ / 🚧 markers throughout the process.