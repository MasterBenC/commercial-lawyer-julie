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
  "evaluations/2026-07-30-targeted-regression-8e6db4.json"
];

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
  const invalid = await validateCommittedEvaluationArtifacts(root);
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
