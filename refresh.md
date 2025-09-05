{ 
AutoTranslationContext.tsx:38 
 Warning: React has detected a change in the order of Hooks called by SyntaxLabPage. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useContext                 useContext
3. useMemo                    useMemo
4. useState                   useState
5. useState                   useState
6. useState                   useState
7. useState                   useState
8. useState                   useState
9. useState                   useState
10. useState                  useState
11. useState                  useState
12. useState                  useState
13. useState                  useState
14. useState                  useState
15. useState                  useState
16. useState                  useState
17. useState                  useState
18. useState                  useState
19. useState                  useState
20. useState                  useState
21. useState                  useState
22. useState                  useState
23. useState                  useState
24. useState                  useState
25. useState                  useState
26. useState                  useState
27. useState                  useState
28. useState                  useState
29. useState                  useState
30. useState                  useState
31. useRef                    useRef
32. useEffect                 useEffect
33. useEffect                 useEffect
34. useEffect                 useEffect
35. undefined                 useContext
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    at SyntaxLabPage (http://localhost:5173/src/pages/SyntaxLabPage.tsx?t=1757101913556:26:26)
    at main
    at div
    at AutoTranslationProvider (http://localhost:5173/src/contexts/AutoTranslationContext.tsx?t=1757101422997:31:3)
    at AppContent (http://localhost:5173/src/App.tsx?t=1757101913556:37:29)
    at LanguageProvider (http://localhost:5173/src/contexts/LanguageContext.tsx?t=1757101913556:249:36)
    at AuthProvider (http://localhost:5173/src/contexts/AuthContext.tsx:30:32)
    at App
react-dom.development.js:15688 
 Uncaught Error: Rendered more hooks than during the previous render.
    at useAutoTranslatedVerse (useAutoTranslatedVerse.ts:12:27)
    at SyntaxLabPage.tsx:1458:49
    at SyntaxLabPage (SyntaxLabPage.tsx:1458:71)
react-dom.development.js:15688 
 Uncaught Error: Rendered more hooks than during the previous render.
    at useAutoTranslatedVerse (useAutoTranslatedVerse.ts:12:27)
    at SyntaxLabPage.tsx:1458:49
    at SyntaxLabPage (SyntaxLabPage.tsx:1458:71)
react-dom.development.js:18704 
 The above error occurred in the <SyntaxLabPage> component:

    at SyntaxLabPage (http://localhost:5173/src/pages/SyntaxLabPage.tsx?t=1757101913556:26:26)
    at main
    at div
    at AutoTranslationProvider (http://localhost:5173/src/contexts/AutoTranslationContext.tsx?t=1757101422997:31:3)
    at AppContent (http://localhost:5173/src/App.tsx?t=1757101913556:37:29)
    at LanguageProvider (http://localhost:5173/src/contexts/LanguageContext.tsx?t=1757101913556:249:36)
    at AuthProvider (http://localhost:5173/src/contexts/AuthContext.tsx:30:32)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
react-dom.development.js:15688 
 Uncaught Error: Rendered more hooks than during the previous render.
    at useAutoTranslatedVerse (useAutoTranslatedVerse.ts:12:27)
    at SyntaxLabPage.tsx:1458:49
    at SyntaxLabPage (SyntaxLabPage.tsx:1458:71)

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