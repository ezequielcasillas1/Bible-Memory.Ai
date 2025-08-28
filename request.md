{Mission Briefing: Type-Along Mode Complete Overhaul
You will now execute this request in full compliance with your AUTONOMOUS PRINCIPAL ENGINEER - OPERATIONAL DOCTRINE. Each phase is mandatory. Deviations are not permitted.
Phase 0: Reconnaissance & Mental Modeling (Read-Only)
Directive: Perform a non-destructive scan of the Type-Along practice mode in SyntaxLabPage.tsx to understand the current broken implementation where users are forced to type single words instead of complete verses.
Output: Produce a concise analysis of the current Type-Along mode flow and identify all components that need modification.
Constraint: No mutations are permitted during this phase.
Phase 1: Planning & Strategy
Directive: Based on your reconnaissance, formulate a clear plan to completely overhaul Type-Along mode.
Core Requirements:
Complete Verse Input: Type-Along mode must allow users to type the ENTIRE verse in one input field, not individual words
Real-Time Synthesis Checking: As the user types the complete verse, provide real-time feedback showing accuracy/progress
Remove "Check Word" Button: Replace with "🎉 Next Verse" button that appears after verse completion
Add Results Summary: Add "📊 View Results" button that shows cumulative performance across all verses practiced in the session
Multi-Verse Session: Allow users to practice multiple verses consecutively in one Type-Along session
Phase 2: Execution & Implementation
Directive: Execute the complete Type-Along mode overhaul with these specific changes:
A. Verse Input System:
Change from single-word input to full verse textarea/input
Implement real-time verse comparison as user types (character-by-character or word-by-word highlighting)
Show typing accuracy percentage in real-time
Display the target verse with visual indicators for correct/incorrect sections
B. Button System Overhaul:
REMOVE: "Check Word" button entirely
ADD: "🎉 Next Verse" button (only appears when verse is completed with >80% accuracy)
ADD: "📊 View Results" button (greyed out/disabled until user completes at least one verse, then becomes active)
ADD: "⏭️ Skip Verse" button (in case user wants to move on)
C. Session Management:
Track multiple verses in a single Type-Along session
Store accuracy, time, and performance data for each verse
Implement verse progression system (auto-generate or select from curated list)
Track completion state to enable/disable "View Results" button
D. Results Dashboard:
Create comprehensive results view showing:
Total verses attempted
Average accuracy across all verses
Time spent per verse
Improvement trends
Weak word identification across all verses
Phase 3: Verification & Testing
Directive: Test the complete Type-Along workflow:
Start Type-Along mode → "View Results" button should be greyed out/disabled
Type complete verse → should show real-time feedback
Complete verse → "Next Verse" button should appear AND "View Results" button should become enabled
Click "Next Verse" → should load new verse
Click "View Results" → should show comprehensive session data
Phase 4: UI/UX Consistency
Directive: Ensure the new Type-Along mode follows the existing design patterns:
Use gradient backgrounds and modern styling consistent with current buttons
Implement smooth animations and transitions
Maintain the purple/indigo color scheme for Type-Along mode
Add floating emoji feedback for correct/incorrect verse completion
Button States: Ensure disabled "View Results" button has proper grey/disabled styling that matches the app's design system
Phase 5: Final Report & Verdict
Report Structure:
Changes Applied: Complete list of modified components and new features
Verification Evidence: Screenshots or descriptions of the new Type-Along workflow
Performance Metrics: Confirmation that multi-verse sessions work correctly
Final Verdict: System state verification
Success Criteria:
✅ Type-Along mode accepts complete verse input (not single words)
✅ Real-time synthesis checking shows typing accuracy
✅ "Next Verse" button replaces "Check Word" button
✅ "View Results" button is disabled until first verse completion, then becomes active
✅ Multi-verse sessions work seamlessly
✅ UI maintains design consistency with existing components
✅ No regressions in Fill-in-blank mode functionality}

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