import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const scenarios = JSON.parse(
  await readFile(new URL("./fixtures/scenarios.json", import.meta.url), "utf8")
);

const fixtureKeys = [
  "id",
  "title",
  "input",
  "expectedMode",
  "expectedRoutes",
  "minimumRisk",
  "mustInclude",
  "mustNotInclude"
];

const expectedScenarios = {
  S01: { expectedMode: "lifecycle_guidance", expectedRoutes: ["deals_contracts"], minimumRisk: "medium" },
  S02: { expectedMode: "document_review", expectedRoutes: ["deals_contracts", "ai_data_ip"], minimumRisk: "high" },
  S03: { expectedMode: "lifecycle_guidance", expectedRoutes: ["ai_data_ip"], minimumRisk: "high" },
  S04: { expectedMode: "lifecycle_guidance", expectedRoutes: ["delivery_change_acceptance"], minimumRisk: "medium" },
  S05: { expectedMode: "lifecycle_guidance", expectedRoutes: ["invoicing_collections"], minimumRisk: "medium" },
  S06: { expectedMode: "lifecycle_guidance", expectedRoutes: ["disputes_evidence", "lawyer_handoff"], minimumRisk: "high" },
  S07: { expectedMode: "lifecycle_guidance", expectedRoutes: ["deals_contracts", "lawyer_handoff"], minimumRisk: "high" },
  S08: { expectedMode: "quick_qa", expectedRoutes: ["disputes_evidence", "lawyer_handoff"], minimumRisk: "high" }
};

const prohibitedInclusions = ["虚构法律依据", "保证胜诉", "自动发送"];

test("the eight approved scenarios match the exact fixture schema and matrix", () => {
  assert.deepEqual(scenarios.map((scenario) => scenario.id), Object.keys(expectedScenarios));

  for (const scenario of scenarios) {
    assert.deepEqual(Object.keys(scenario).sort(), [...fixtureKeys].sort());
    assert.equal(typeof scenario.title, "string");
    assert.ok(scenario.title.trim().length > 0);
    assert.equal(typeof scenario.input, "string");
    assert.ok(scenario.input.trim().length > 0);
    assert.deepEqual(
      {
        expectedMode: scenario.expectedMode,
        expectedRoutes: scenario.expectedRoutes,
        minimumRisk: scenario.minimumRisk
      },
      expectedScenarios[scenario.id]
    );
    assert.ok(Array.isArray(scenario.mustInclude));
    assert.ok(scenario.mustInclude.length >= 2);
    for (const inclusion of scenario.mustInclude) {
      assert.equal(typeof inclusion, "string");
      assert.ok(inclusion.trim().length > 0);
    }
    assert.ok(Array.isArray(scenario.mustNotInclude));
    for (const prohibited of prohibitedInclusions) {
      assert.ok(scenario.mustNotInclude.includes(prohibited));
    }
  }
});
