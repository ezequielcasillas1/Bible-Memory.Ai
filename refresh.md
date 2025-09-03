{ 
🐞 Bug Report – Syntax Lab (BibleMemory.ai)
Summary

The Syntax Lab practice mode has three user-visible bugs and one state-sync issue:

Word counter skips values, 2) Round counter advances at the wrong time (too early), 3) Fill-in-the-blank repeats the same word input multiple times, 4) Settings/progress UI can fall out of sync.

Tech stack: React 18 + TypeScript + Vite + Tailwind.

1) Word Count Skipping

Expected: Word count increments strictly by 1: 1/5 → 2/5 → 3/5 → 4/5 → 5/5.

Actual: Sometimes it jumps (e.g., 1/5 → 3/5), skipping 2/5.

Impact: Users don’t trust progress; breaks pacing.

Likely causes (for dev):

Double event firing (Enter key + implicit form submit).

Multiple state updates based on stale state (non-functional setState).

Counting the same word twice within one tick.

2) Round Counter Not Syncing (including early shift case)

Expected: Round only advances when word count reaches the max (e.g., at 5/5, go 1/3 → 2/3).

Actual:

Sometimes round does not advance at 5/5.

New note: Round sometimes advances early (e.g., at 3/5 it jumps from 1/3 → 2/3), before reaching 5/5.

Impact: Breaks the core loop; users are moved to the next round prematurely or not at all.

Likely causes (for dev):

Round update logic keyed to >= instead of === the max words.

Using updated state twice in the same render (race) or deriving round from a transient progress bar percentage.

3) Fill-in-the-Blank Repeats Same Word

Expected: Each blank is typed once, then the next blank appears.

Actual: The same blank can reappear or require multiple entries.

Impact: Frustrating; feels like a loop.

Likely causes (for dev):

Cursor/index into blanks not advanced atomically with a correct submission.

Re-render revalidates same token due to stale closure or duplicated validation calls.

4) Settings / State Depiction Out of Sync

Expected: Settings (e.g., total words per round, total rounds) and UI counters/percentages reflect the true session state at all times.

Actual: Visual counters or progress bar can show skipped increments or round mismatches.

Likely causes:

Multiple sources of truth for progress (local vs derived).

Progress bar using time-based animation rather than computed percentage from canonical state.

Reproduction Steps (Example)

Open Syntax Lab with a round configured for 5 blanks and 3 rounds (shows 0/5, 1/3 initially).

Correctly enter the first blank.

Expected: 1/5, still 1/3.

Actual: Sometimes jumps to 2/5 or 3/5.

Continue until 3/5.

Expected: 3/5, still 1/3.

Actual (bug): Round flips to 2/3 early (before 5/5).

Finish all 5.

Expected: On reaching 5/5, round becomes 2/3.

Actual: Sometimes doesn’t advance, or advanced already (early).

Also observe that after correctly entering a blank, the same blank may be prompted again.

Acceptance Criteria (Definition of Done)

Word counter increases exactly by 1 per correct submission. No skips, no double increments.

Round counter:

Advances only when wordCount === maxWordsInRound.

Never advances at 1/5, 2/5, 3/5, or 4/5.

Correctly resets word count and advances round (1/3 → 2/3 → 3/3).

Fill-in-the-blank:

Each blank is required once. After a correct input, move to the next blank automatically.

The same blank must not reappear unless the user was wrong and the product spec says to retry (not the current spec).

Settings depiction/state:

UI counters and progress bars derive from a single source of truth (e.g., wordsFixed, totalWords, roundIndex, totalRounds).

No visual desyncs: the numbers and the bar match computed state 100% of the time.

No UX regressions in styling, theme, animations, or accessibility.

No secret keys added/changed; keep environment variables intact.

Implementation Hints (for the developer)

Use functional state updates in React:

setProgress(prev => ({ ...prev, wordsFixed: prev.wordsFixed + 1 }));


Guard against double submissions:

Use onKeyDown for Enter, preventDefault().

Ensure action button is type="button" to avoid implicit form submit.

Use a submittingRef to ignore rapid repeat triggers during one tick.

Single source of truth: derive UI from canonical progress:

const percent = (progress.wordsFixed / progress.totalWords) * 100;


Advance round only on exact match:

if (progress.wordsFixed + 1 === progress.totalWords) {
  // advance round, reset wordsFixed to 0
}


Ensure the blank index increments atomically with a successful check. Never validate the same token twice in one cycle.

Deliverables

Fixed components/hooks (minimal, surgical diffs).

Short CHANGES.md explaining root cause & fixes.

Local verification: npm run dev, then npm run build && npm run preview passes.    
}

---

## **Mission Briefing: Root Cause Analysis & Remediation Protocol**

Previous, simpler attempts to resolve this issue have failed. Standard procedures are now suspended. You will initiate a **deep diagnostic protocol.**

Your approach must be systematic, evidence-based, and relentlessly focused on identifying and fixing the **absolute root cause.** Patching symptoms is a critical failure.

---

## **Phase 0: Reconnaissance & State Baseline (Read-Only)**

-   **Directive:** Adhering to the **Operational Doctrine**, perform a non-destructive scan of the repository, runtime environment, configurations, and recent logs. Your objective is to establish a high-fidelity, evidence-based baseline of the system's current state as it relates to the anomaly.
-   **Output:** Produce a concise digest (≤ 200 lines) of your findings.
-   **Constraint:** **No mutations are permitted during this phase.**

---

## **Phase 1: Isolate the Anomaly**

-   **Directive:** Your first and most critical goal is to create a **minimal, reproducible test case** that reliably and predictably triggers the bug.
-   **Actions:**
    1.  **Define Correctness:** Clearly state the expected, non-buggy behavior.
    2.  **Create a Failing Test:** If possible, write a new, specific automated test that fails precisely because of this bug. This test will become your signal for success.
    3.  **Pinpoint the Trigger:** Identify the exact conditions, inputs, or sequence of events that causes the failure.
-   **Constraint:** You will not attempt any fixes until you can reliably reproduce the failure on command.

---

## **Phase 2: Root Cause Analysis (RCA)**

-   **Directive:** With a reproducible failure, you will now methodically investigate the failing pathway to find the definitive root cause.
-   **Evidence-Gathering Protocol:**
    1.  **Formulate a Testable Hypothesis:** State a clear, simple theory about the cause (e.g., "Hypothesis: The user authentication token is expiring prematurely.").
    2.  **Devise an Experiment:** Design a safe, non-destructive test or observation to gather evidence that will either prove or disprove your hypothesis.
    3.  **Execute and Conclude:** Run the experiment, present the evidence, and state your conclusion. If the hypothesis is wrong, formulate a new one based on the new evidence and repeat this loop.
-   **Anti-Patterns (Forbidden Actions):**
    -   **FORBIDDEN:** Applying a fix without a confirmed root cause supported by evidence.
    -   **FORBIDDEN:** Re-trying a previously failed fix without new data.
    -   **FORBIDDEN:** Patching a symptom (e.g., adding a `null` check) without understanding *why* the value is becoming `null`.

---

## **Phase 3: Remediation**

-   **Directive:** Design and implement a minimal, precise fix that durably hardens the system against the confirmed root cause.
-   **Core Protocols in Effect:**
    -   **Read-Write-Reread:** For every file you modify, you must read it immediately before and after the change.
    -   **Command Execution Canon:** All shell commands must use the mandated safety wrapper.
    -   **System-Wide Ownership:** If the root cause is in a shared component, you are **MANDATED** to analyze and, if necessary, fix all other consumers affected by the same flaw.

---

## **Phase 4: Verification & Regression Guard**

-   **Directive:** Prove that your fix has resolved the issue without creating new ones.
-   **Verification Steps:**
    1.  **Confirm the Fix:** Re-run the specific failing test case from Phase 1. It **MUST** now pass.
    2.  **Run Full Quality Gates:** Execute the entire suite of relevant tests (unit, integration, etc.) and linters to ensure no regressions have been introduced elsewhere.
    3.  **Autonomous Correction:** If your fix introduces any new failures, you will autonomously diagnose and resolve them.

---

## **Phase 5: Mandatory Zero-Trust Self-Audit**

-   **Directive:** Your remediation is complete, but your work is **NOT DONE.** You will now conduct a skeptical, zero-trust audit of your own fix.
-   **Audit Protocol:**
    1.  **Re-verify Final State:** With fresh commands, confirm that all modified files are correct and that all relevant services are in a healthy state.
    2.  **Hunt for Regressions:** Explicitly test the primary workflow of the component you fixed to ensure its overall functionality remains intact.

---

## **Phase 6: Final Report & Verdict**

-   **Directive:** Conclude your mission with a structured "After-Action Report."
-   **Report Structure:**
    -   **Root Cause:** A definitive statement of the underlying issue, supported by the key piece of evidence from your RCA.
    -   **Remediation:** A list of all changes applied to fix the issue.
    -   **Verification Evidence:** Proof that the original bug is fixed (e.g., the passing test output) and that no new regressions were introduced (e.g., the output of the full test suite).
    -   **Final Verdict:** Conclude with one of the two following statements, exactly as written:
        -   `"Self-Audit Complete. Root cause has been addressed, and system state is verified. No regressions identified. Mission accomplished."`
        -   `"Self-Audit Complete. CRITICAL ISSUE FOUND during audit. Halting work. [Describe issue and recommend immediate diagnostic steps]."`
-   **Constraint:** Maintain an inline TODO ledger using ✅ / ⚠️ / 🚧 markers throughout the process.