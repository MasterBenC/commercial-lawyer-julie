import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeRunArtifact,
  validateNormalizedRunIndex
} from "../scripts/validate-run-artifacts.mjs";

const normalizedIndex = JSON.parse(
  await readFile(
    new URL("../evaluations/2026-08-02-risk-tiered-run-metadata.json", import.meta.url),
    "utf8"
  )
);
const schema = JSON.parse(
  await readFile(new URL("../evaluations/run-metadata.schema.json", import.meta.url), "utf8")
);

test("normalized metadata index mechanically validates all 18 raw run records", () => {
  const result = validateNormalizedRunIndex(normalizedIndex, schema);

  assert.equal(result.valid, true);
  assert.equal(Object.hasOwn(normalizedIndex, "artifactSetAsOfUtc"), true);
  assert.equal(Object.hasOwn(normalizedIndex, "generatedAtUtc"), false);
  assert.equal(result.runCount, 18);
  assert.equal(new Set(normalizedIndex.runs.map(({ runId }) => runId)).size, 18);
  assert.deepEqual(result.criticalPairs, {
    A02: { risk: "high", escalationDecision: "triggered" },
    S03: { risk: "high", escalationDecision: "triggered" },
    S06: { risk: "high", escalationDecision: "triggered" },
    S08: { risk: "high", escalationDecision: "triggered" }
  });
});

test("normalizer tolerates legacy field variants without changing the answer", () => {
  const raw = `# Blind evaluation run\n\n- runId: S08-run1\n- scenarioId: S08\n- startedAt (UTC): 2026-08-02T05:54:19Z\n- model: gpt-5.6-terra\n- skillCommit: aafa1ecbb4b71374cacaa447035e7208fd154c28\n- skillSha256: 28B8FFE2EAF8A02623487C9111FA38F2BDF27ACFAB1120EB9D513559B5BB87E8\n- actual working mode: lifecycle_guidance\n- actual routes: disputes_evidence; lawyer_handoff\n- risk: high\n- escalation: lawyer_handoff triggered — possible_criminal_exposure\n- source state: needs_verification\n- decisive question count: 1\n\n## Complete unedited answer\n\nORIGINAL ANSWER`;
  const normalized = normalizeRunArtifact(raw, "work/risk-tiered-evaluation/runs/S08-run1.md");

  assert.equal(normalized.startedAtUtc, "2026-08-02T05:54:19.000Z");
  assert.equal(normalized.actualMode, "lifecycle_guidance");
  assert.deepEqual(normalized.actualRoutes, ["disputes_evidence", "lawyer_handoff"]);
  assert.equal(normalized.escalationDecision, "triggered");
  assert.deepEqual(normalized.escalationReasons, ["possible_criminal_exposure"]);
  assert.equal(normalized.completeUneditedAnswer, "ORIGINAL ANSWER");
});

test("metadata validator rejects malformed risk and critical-pair inconsistency", () => {
  const unknownField = structuredClone(normalizedIndex);
  unknownField.runs[0].unreviewedMetadata = "must not pass";
  assert.throws(
    () => validateNormalizedRunIndex(unknownField, schema),
    /unreviewedMetadata.*not allowed/
  );

  const malformedRisk = structuredClone(normalizedIndex);
  malformedRisk.runs[0].actualRisk = "urgent";
  assert.throws(
    () => validateNormalizedRunIndex(malformedRisk, schema),
    /actualRisk/
  );

  const malformedRoute = structuredClone(normalizedIndex);
  malformedRoute.runs[0].actualRoutes = ["unknown_route"];
  assert.throws(
    () => validateNormalizedRunIndex(malformedRoute, schema),
    /actualRoutes\[0\]/
  );

  const inconsistentPair = structuredClone(normalizedIndex);
  inconsistentPair.runs.find(({ runId }) => runId === "A02-run2").escalationDecision =
    "not_triggered";
  assert.throws(
    () => validateNormalizedRunIndex(inconsistentPair, schema),
    /A02.*escalationDecision/
  );
});
