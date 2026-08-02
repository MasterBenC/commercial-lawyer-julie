# Julie v0.1 Risk-Tiered Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate and release `commercial-lawyer-julie` v0.1 with 18 isolated, risk-tiered behavioral runs instead of the former 42-run gate.

**Architecture:** Keep the existing runtime Skill and evaluator rubric isolated. Add a deterministic manifest that selects one run for every existing scenario and a second run for four critical scenarios, execute each run in a fresh context, then score only after the tested agent has finished. Treat any behavioral failure as a new RED test before changing the Skill.

**Tech Stack:** Markdown Agent Skill, JSON fixtures, dependency-free Node.js 20 test runner, isolated fresh-agent sessions, Git.

## Global Constraints

- Run all 14 existing scenarios once.
- Run `A02`, `S03`, `S06`, and `S08` twice; the baseline total is exactly 18.
- Do not expose `tests/fixtures/scenario-rubrics.json`, old answers, or evaluation reports to tested agents.
- Critical duplicate runs must agree on risk level and escalation decision.
- Keep all 35 existing automated tests passing.
- Fix behavioral failures test-first and modify only the smallest relevant Skill instruction or reference.
- Do not expand LexFlow, add new legal domains, or perform external legal or commercial actions.
- A passing release must say “18 次风险分层行为评测,” never “42 次完整评测.”

---

### Task 1: Encode the 18-Run Evaluation Contract

**Files:**
- Modify: `tests/scenarios.test.mjs`
- Create: `scripts/build-risk-tiered-manifest.mjs`
- Modify: `package.json`
- Modify: `scripts/validate-skill.mjs`

**Interfaces:**
- Consumes: scenario IDs from `tests/fixtures/scenario-inputs.json`.
- Produces: `buildRiskTieredManifest(inputs): Array<{runId: string, scenarioId: string, repetition: number, critical: boolean}>`.
- Produces: `npm run eval:manifest`, which writes `work/risk-tiered-evaluation/manifest.json`.

- [ ] **Step 1: Add a failing manifest test**

Add a test that imports `buildRiskTieredManifest`, asserts exactly 18 unique run IDs, asserts all 14 scenario IDs occur, and asserts only `A02`, `S03`, `S06`, and `S08` occur twice.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/scenarios.test.mjs`

Expected: FAIL because `scripts/build-risk-tiered-manifest.mjs` does not exist.

- [ ] **Step 3: Implement the minimal manifest builder**

Read the input array in its existing order. Emit repetition 1 for every scenario and repetition 2 only when the scenario ID is in `new Set(["A02", "S03", "S06", "S08"])`. Use run IDs `${scenarioId}-run${repetition}` and reject duplicate or missing scenario IDs.

- [ ] **Step 4: Add the command and release boundary**

Add `"eval:manifest": "node scripts/build-risk-tiered-manifest.mjs"` to `package.json` and add the new script to `requiredFiles` in `scripts/validate-skill.mjs`. The CLI must create `work/risk-tiered-evaluation/manifest.json` without copying rubrics into `work/blind-evaluation/runtime-skill/`.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tests/scenarios.test.mjs
npm run eval:manifest
npm test
npm run validate
```

Expected: 18 manifest entries, all tests PASS, validation PASS.

- [ ] **Step 6: Commit**

```powershell
git add package.json scripts/build-risk-tiered-manifest.mjs scripts/validate-skill.mjs tests/scenarios.test.mjs
git commit -m "test: define risk-tiered Julie evaluation manifest"
```

---

### Task 2: Align the Written Evaluation Policy

**Files:**
- Modify: `tests/policies.test.mjs`
- Modify: `docs/evaluation.md`

**Interfaces:**
- Consumes: the exact manifest contract from Task 1.
- Produces: release instructions that require 18 runs and targeted reruns after failure.

- [ ] **Step 1: Add a failing policy test**

Assert that `docs/evaluation.md` contains `18 次风险分层行为评测`, names the four duplicated scenario IDs, requires fresh contexts and rubric isolation, and does not require every scenario to run three times.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/policies.test.mjs`

Expected: FAIL because the document still requires three runs for every scenario.

- [ ] **Step 3: Replace the obsolete run protocol**

Document one fresh run for all 14 scenarios; a second independent run for `A02`, `S03`, `S06`, and `S08`; one post-fix rerun for a failed ordinary scenario; and two post-fix reruns for a failed critical scenario. Preserve the existing sandbox, metadata, source-state, hard-gate, and forbidden-claim rules.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/policies.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add docs/evaluation.md tests/policies.test.mjs
git commit -m "docs: adopt risk-tiered behavioral evaluation"
```

---

### Task 3: Execute 18 Isolated Behavioral Runs

**Files:**
- Read: `work/risk-tiered-evaluation/manifest.json`
- Read-only runtime: `work/blind-evaluation/runtime-skill/`
- Create: `work/risk-tiered-evaluation/runs/<runId>.md`

**Interfaces:**
- Consumes: prompt-only scenario input selected by `scenarioId` and the isolated runtime Skill.
- Produces: one raw run artifact per manifest entry with model identifier, UTC start time, Skill content hash or commit SHA, scenario ID, run ID, answer, risk, routes, escalation decision, and source state.

- [ ] **Step 1: Rebuild clean inputs**

Run:

```powershell
npm run eval:prepare
npm run eval:render
npm run eval:manifest
```

Expected: runtime allowlist contains no `tests`, `docs`, `scripts`, rubrics, or old reports; manifest contains 18 entries.

- [ ] **Step 2: Run each manifest entry in a fresh agent context**

Give each tested agent only the isolated runtime Skill and the selected prompt. Do not give it rubric fields, expected route/risk, previous answers, or repository access. Save its unedited answer and execution metadata under the matching run ID.

- [ ] **Step 3: Check run completeness without scoring**

Confirm all 18 files exist, run IDs are unique, every manifest entry has a file, and each file records the required metadata and full answer. Do not inspect rubrics during this check.

- [ ] **Step 4: Commit only reusable harness changes**

Keep raw `work/` runs uncommitted. Evaluation summaries are created and committed in Task 4.

---

### Task 4: Score, Report, and Repair Failures

**Files:**
- Read: `tests/fixtures/scenario-rubrics.json`
- Read: `work/risk-tiered-evaluation/runs/*.md`
- Create: `evaluations/2026-08-02-risk-tiered-evaluation.md`
- Create: `evaluations/2026-08-02-risk-tiered-evaluation.json`
- Conditionally modify: `tests/policies.test.mjs` or `tests/scenarios.test.mjs`
- Conditionally modify: the smallest relevant `SKILL.md` or `references/*.md` file

**Interfaces:**
- Consumes: 18 raw runs only after execution is complete.
- Produces: per-run verdicts, per-scenario summary, duplicate consistency checks, hard-gate findings, and overall `PASS` or `FAIL`.

- [ ] **Step 1: Score each run against its scenario rubric**

Record actual mode, routes, risk, escalation, decisive-question count, required-behavior evidence, forbidden-claim findings, and verdict. Judge forbidden claims by affirmative meaning, not substring matching.

- [ ] **Step 2: Check critical-pair consistency**

For `A02`, `S03`, `S06`, and `S08`, compare both runs. A risk or escalation mismatch fails that scenario even when each answer otherwise satisfies its rubric.

- [ ] **Step 3: Follow RED-GREEN-REFACTOR for every failure**

First add or identify an automated test that fails for the observed instruction gap. Run it and verify the expected failure. Then make the smallest Skill/reference change, rerun the automated suite, rebuild the isolated runtime, and execute only the required post-fix reruns from the design.

- [ ] **Step 4: Write auditable JSON and Markdown summaries**

Include the Skill SHA or content hash, model/runtime metadata limitations, run inventory, totals, every failure reason, consistency result, and the exact statement `18 次风险分层行为评测` when the baseline passes.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm test
npm run validate
npm run eval:prepare
npm run eval:render
npm run eval:manifest
git diff --check
```

Then commit the evaluation report and any test-first fixes with a message that reflects the actual outcome.

---

### Task 5: Prepare v0.1.0 Release State

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `tests/structure.test.mjs`

**Interfaces:**
- Consumes: overall PASS from Task 4.
- Produces: version `0.1.0` and accurate release documentation.

- [ ] **Step 1: Add failing release-copy assertions**

Require `package.json` version `0.1.0`; require README to state the 18-run risk-tiered result and link the new report; forbid claims that 42 post-fix runs were completed.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/structure.test.mjs`

Expected: FAIL because the package remains `0.1.0-beta.1` and README says full evaluation is unfinished.

- [ ] **Step 3: Update release metadata only after Task 4 passes**

Set the package version to `0.1.0`. Replace the beta paragraph with the exact measured 18-run result, the four duplicated critical scenarios, the automated-test result, and a link to the new report. Preserve all legal, privacy, installation, and LexFlow boundaries.

- [ ] **Step 4: Run the complete release gate**

Run:

```powershell
npm test
npm run validate
npm run eval:prepare
npm run eval:render
npm run eval:manifest
git diff --check
```

Expected: all commands PASS with no warnings indicating missing release files.

- [ ] **Step 5: Commit release preparation**

```powershell
git add package.json README.md tests/structure.test.mjs evaluations/2026-08-02-risk-tiered-evaluation.md evaluations/2026-08-02-risk-tiered-evaluation.json
git commit -m "release: prepare Julie v0.1.0"
```

- [ ] **Step 6: Stop before external publication**

Do not tag or push until the local history is reconciled with `origin/main`, the worktree is clean, and the user separately authorizes publication.
