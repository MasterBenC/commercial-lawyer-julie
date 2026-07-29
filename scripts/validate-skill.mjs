import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const requiredFiles = [
  "package.json",
  "scripts/validate-skill.mjs",
  "tests/structure.test.mjs"
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
  console.log("Commercial Lawyer Julie package is structurally valid.");
}
