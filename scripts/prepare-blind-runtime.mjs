import {
  copyFile,
  mkdir,
  readdir
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRootUrl = new URL("../", import.meta.url);
const defaultOutputUrl = new URL(
  "../work/blind-evaluation/runtime-skill/",
  import.meta.url
);

export const runtimeSkillFiles = Object.freeze([
  "SKILL.md",
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
  "templates/lawyer-handoff-pack.md"
]);

async function listFiles(rootPath, currentPath = rootPath) {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(rootPath, absolutePath));
    } else {
      files.push(path.relative(rootPath, absolutePath).split(path.sep).join("/"));
    }
  }

  return files;
}

export async function prepareBlindRuntime({
  rootUrl = defaultRootUrl,
  outputUrl = defaultOutputUrl
} = {}) {
  const rootPath = fileURLToPath(rootUrl);
  const outputPath = fileURLToPath(outputUrl);
  await mkdir(outputPath, { recursive: true });

  const existingFiles = await listFiles(outputPath);
  const unexpectedFiles = existingFiles.filter(
    (relativePath) => !runtimeSkillFiles.includes(relativePath)
  );
  if (unexpectedFiles.length > 0) {
    throw new Error(
      `Blind runtime contains unexpected files:\n${unexpectedFiles.join("\n")}`
    );
  }

  for (const relativePath of runtimeSkillFiles) {
    const sourcePath = path.join(rootPath, relativePath);
    const destinationPath = path.join(outputPath, relativePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }

  return {
    outputPath,
    copied: [...runtimeSkillFiles]
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = await prepareBlindRuntime();
  console.log(
    `Prepared isolated blind runtime with ${result.copied.length} files at ${result.outputPath}`
  );
}
