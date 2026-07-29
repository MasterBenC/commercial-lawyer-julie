import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

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
  "scripts/render-scenario-prompts.mjs",
  "tests/structure.test.mjs",
  "tests/policies.test.mjs",
  "tests/scenarios.test.mjs",
  "tests/fixtures/scenario-inputs.json",
  "tests/fixtures/scenario-rubrics.json",
  "docs/evaluation.md"
];

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
  return { missing };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateSkill(new URL("../", import.meta.url));
  if (result.missing.length > 0) {
    console.error(`Missing required files:\n${result.missing.join("\n")}`);
    process.exit(1);
  }
  console.log("商业律师 Julie package is structurally valid.");
}
