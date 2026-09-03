# METHODOLOGY — AI Agent Collaboration

> This document defines how to work with an AI coding agent on this project. Customize it for your team.

---

## Development Workflow

Every task follows four steps, no skipping:

1. **Requirements** — Discuss and document what's needed, then write the requirements doc organized in **three layers**:
   - **Overall goal** — one sentence: what problem does this task solve, for whom;
   - **Functional user stories** — individually acceptable, format: **As a [role], I want [feature], so that [goal]**. Describe who / what / why — never how;
   - **Non-functional standards** — performance, security, compatibility, usability constraints, each with how it will be measured.

   Requirements are DONE when all three layers are concrete enough to design against (the user confirms, or the answers stop changing the requirement). After confirming, create a checklist entry for each story. No checklist entry means the requirement hasn't landed yet.
2. **Design** — Write a design document: problem statement, approach and rationale, full affected-file list, and verifiable acceptance criteria (each criterion traces back to a user story). Design is approved before coding starts.
3. **Implementation** — Write the code.
4. **Testing** — Verify with a test document: each user story maps to at least one test case covering normal path, edge cases, and error conditions. Describe what to test, what input to give, and what output to expect.

These four steps are not "best practice" — they are hard process. Three documents required: **requirements doc**, **design doc**, **test doc**. Skipping to step 3 and writing code first is wrong nine times out of ten.

## Requirement-Pool Batched Workflow（2026-09-03 · design — user ruling — approved）

> 状态：approved。动机：per-request pipelines（one requirement → clarify → design → review → implement）carry ~40 min fixed process cost per single point; batching amortizes it across multiple requirements without cutting quality — per-point engineering rigor (review/audit/test discipline) is untouched; only the *trigger timing* changes (accumulate, then start design).

### Mechanism

1. **Register（when you state a requirement）**: ordinary requirement → agent clarifies on the spot → updates the owning board's requirements section（the clarified requirement sentence — the clarification product）→ registers one line in the project `docs/TODO.md`「Requirement Pool」group（date / requirement sentence / owning board / status=awaiting design）— **no design work yet**.
2. **Accumulate**: requirements accumulate — the design-start initiative stays with the user（say "start this batch"）.
3. **Suggested threshold**: same board ≥2 points or pool-wide ≥3 points → agent reminds once（"pool is big enough — design can start"）— reminder never replaces initiative.
4. **Batch design**: land multiple points in one pass（same board = multiple sections of its design doc; cross-board = multiple docs reviewed in one batch）→ batch review → user approval → batch implementation（single eng-coder for merged work or mirrored parallel spawns — the multi-surface rule applies unchanged）.
5. **Fast lane**: you say "this is urgent / do it now" → skip the pool — single-point full existing flow（design → review → implementation — no step cut）.
6. **Boundary**: the pool takes **user requirement points only** — technical backlog（design leftovers / review findings / debt）stays in the TODO technical groups — never mixed; urgent bugs are covered by the fast lane.


## Checklist

Always maintain a checklist tracking what's planned, in progress, and done. This is project-level — checklist entries are created after requirements are confirmed, marked in_progress when work starts, and marked done after verification passes.

## Problem-Solving

1. **Read logs** — full error output, root cause is usually at the end.
2. **Check docs** — verify APIs, protocols, framework behavior against official docs.
3. **Binary search** — cut the problem space in half, test which half contains the fault, repeat.

## Don't Stare at Code

If reading code isn't helping, run it. Write a test, add a log, bisect. Action beats staring.

---

## This Document's Checklist

- [ ] Development workflow: 4 steps, no skipping
- [ ] Checklist: tasks tracked at project level
- [ ] Problem-solving: logs → docs → binary search
- [ ] Action over staring: run code, don't just read
