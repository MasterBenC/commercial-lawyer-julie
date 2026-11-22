import { access, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { validateNormalizedRunIndex } from "./validate-run-artifacts.mjs";

export const requiredFiles = [
  ".gitignore",
  "package.json",
  "SKILL.md",
  "README.md",
  "LICENSE",
  "references/intake-routing.md",
  "references/output-contract.md",
  "references/risk-policy.md",
  "references/jurisdiction-source-policy.md",
  "references/kb-mount.md",
  "references/privacy-safety.md",
  "references/deals-contracts.md",
  "references/ai-data-ip.md",
  "references/delivery-change-acceptance.md",
  "references/invoicing-collections.md",
  "references/disputes-evidence.md",
  "references/lawyer-handoff.md",
  "templates/quotation-confirmation.md",
  "templates/nda.md",
  "templates/service-agreement.md",
  "templates/change-order.md",
  "templates/acceptance-record.md",
  "templates/payment-reminder.md",
  "templates/lawyer-handoff-pack.md",
  "scripts/validate-skill.mjs",
  "scripts/prepare-blind-runtime.mjs",
  "scripts/build-risk-tiered-manifest.mjs",
  "scripts/render-scenario-prompts.mjs",
  "scripts/validate-run-artifacts.mjs",
  "tests/structure.test.mjs",
  "tests/policies.test.mjs",
  "tests/run-artifacts.test.mjs",
  "tests/scenarios.test.mjs",
  "tests/kb-boundary.test.mjs",
  "tests/fixtures/scenario-inputs.json",
  "tests/fixtures/scenario-rubrics.json",
  "docs/evaluation.md",
  "evaluations/run-metadata.schema.json",
  "evaluations/2026-08-02-risk-tiered-run-metadata.json",
  "evaluations/2026-08-02-risk-tiered-evaluation.md",
  "evaluations/2026-08-02-risk-tiered-evaluation.json",
  "evaluations/2026-07-30-commercial-lawyer-julie-blind-evaluation.md",
  "evaluations/2026-07-30-commercial-lawyer-julie-blind-evaluation.json",
  "evaluations/2026-07-30-targeted-regression-8e6db4.md",
  "evaluations/2026-07-30-targeted-regression-8e6db4.json",
  "evaluations/v0.2-kb-boundary-regression-cases.md",
  "evaluations/v0.2-kb-boundary-regression-cases.json",
  ".github/workflows/ci.yml"
];

const kbBoundaryCasesFile = "evaluations/v0.2-kb-boundary-regression-cases.json";
const expectedKbBoundaryCaseIds = ["K01", "K02", "K03", "K04", "K05", "K06", "K07", "K08"];
const forbiddenResultKeys = /^(scores?|passed|passrate|passcount|results?|verdict|accuracy|outcome)$/i;

function collectResultKeys(value, trail, hits) {
  if (Array.isArray(value)) {
    value.forEach((entry, i) => collectResultKeys(entry, `${trail}[${i}]`, hits));
    return hits;
  }
  if (value === null || typeof value !== "object") return hits;
  for (const [key, nested] of Object.entries(value)) {
    const at = trail ? `${trail}.${key}` : key;
    if (forbiddenResultKeys.test(key)) hits.push(at);
    collectResultKeys(nested, at, hits);
  }
  return hits;
}

async function validateKbBoundaryCases(root) {
  try {
    const suite = JSON.parse(await readFile(path.join(root, kbBoundaryCasesFile), "utf8"));
    const problems = [];
    if (suite.status !== "defined_not_run") {
      problems.push(`status must stay "defined_not_run" until real runs exist (found ${JSON.stringify(suite.status)})`);
    }
    const cases = Array.isArray(suite.cases) ? suite.cases : [];
    const ids = cases.map((entry) => entry?.id);
    if (ids.join(",") !== expectedKbBoundaryCaseIds.join(",")) {
      problems.push(`cases must define ${expectedKbBoundaryCaseIds.join("/")} in order (found ${ids.join(",") || "none"})`);
    }
    if (new Set(ids).size !== ids.length) problems.push("case ids must be unique");
    for (const entry of cases) {
      const id = entry?.id ?? "unknown";
      if (typeof entry?.input !== "string" || entry.input.trim() === "") {
        problems.push(`${id}: input must be a non-empty blind prompt`);
      }
      const expected = entry?.rubric?.expectedBehaviors;
      if (!Array.isArray(expected) || expected.length < 2) {
        problems.push(`${id}: rubric.expectedBehaviors must list at least 2 observable behaviors`);
      }
      const forbidden = entry?.rubric?.forbiddenClaims;
      if (!Array.isArray(forbidden) || forbidden.length < 1) {
        problems.push(`${id}: rubric.forbiddenClaims must list at least 1 claim`);
      }
      for (const claim of forbidden ?? []) {
        if (typeof claim?.claim !== "string" || claim.claim.trim() === "") {
          problems.push(`${id}: every forbiddenClaim needs a non-empty claim`);
        }
      }
    }
    const resultKeys = collectResultKeys(suite, "", []);
    if (resultKeys.length > 0) {
      problems.push(`case definitions must not carry run results or scores (found ${resultKeys.join(", ")})`);
    }
    return problems.map((message) => `${kbBoundaryCasesFile}: ${message}`);
  } catch (error) {
    return [`${kbBoundaryCasesFile}: ${error.message}`];
  }
}

const committedEvaluationFiles = {
  schema: "evaluations/run-metadata.schema.json",
  index: "evaluations/2026-08-02-risk-tiered-run-metadata.json",
  report: "evaluations/2026-08-02-risk-tiered-evaluation.json"
};

async function validateCommittedEvaluationArtifacts(root) {
  try {
    const [schema, index, report] = await Promise.all(
      Object.values(committedEvaluationFiles).map((relativePath) =>
        readFile(path.join(root, relativePath), "utf8").then(JSON.parse)
      )
    );
    const result = validateNormalizedRunIndex(index, schema);
    if (
      result.runCount !== 18 ||
      report.scope?.actualRuns !== 18 ||
      report.overall?.behavioralPassedRuns !== 18 ||
      report.overall?.criticalPairsPassed !== 4
    ) {
      throw new Error("committed index/report totals must remain 18 runs and 4 critical pairs");
    }
    return [];
  } catch (error) {
    return [`${committedEvaluationFiles.index}: ${error.message}`];
  }
}

export async function validateSkill(rootUrl) {
  const root = fileURLToPath(rootUrl);
  const missing = [];
  for (const relativePath of requiredFiles) {
    try {
      await access(path.join(root, relativePath));
    } catch {
      missing.push(relativePath);
    }
  }
  const invalid = [
    ...(await validateCommittedEvaluationArtifacts(root)),
    ...(await validateKbBoundaryCases(root))
  ];
  return { missing, invalid };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateSkill(new URL("../", import.meta.url));
  if (result.missing.length > 0 || result.invalid.length > 0) {
    if (result.missing.length > 0) {
      console.error(`Missing required files:\n${result.missing.join("\n")}`);
    }
    if (result.invalid.length > 0) {
      console.error(`Invalid committed evaluation artifacts:\n${result.invalid.join("\n")}`);
    }
    process.exit(1);
  }
  console.log("商业律师 Julie package is structurally valid.");
}
