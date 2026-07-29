import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const scenarios = JSON.parse(
  await readFile(new URL("./fixtures/scenarios.json", import.meta.url), "utf8")
);

test("the eight approved scenarios are present and well formed", () => {
  assert.equal(scenarios.length, 8);
  for (const scenario of scenarios) {
    assert.match(scenario.id, /^S0[1-8]$/);
    assert.ok(["quick_qa", "document_review", "lifecycle_guidance"].includes(scenario.expectedMode));
    assert.ok(scenario.expectedRoutes.length >= 1);
    assert.ok(["low", "medium", "high"].includes(scenario.minimumRisk));
    assert.ok(scenario.mustInclude.length >= 2);
    assert.ok(scenario.mustNotInclude.includes("铏氭瀯娉曞緥渚濇嵁"));
  }
});

test("cross-border and evidence-abuse scenarios require high risk", () => {
  for (const id of ["S07", "S08"]) {
    assert.equal(scenarios.find((item) => item.id === id).minimumRisk, "high");
  }
});
