import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateSkill } from "../scripts/validate-skill.mjs";

const execFileAsync = promisify(execFile);

test("the complete Julie package has no missing required files", async () => {
  const result = await validateSkill(new URL("../", import.meta.url));
  assert.deepEqual(result.missing, []);
});

test("the validator reports the Chinese Julie display name on success", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    fileURLToPath(new URL("../scripts/validate-skill.mjs", import.meta.url))
  ]);
  assert.equal(stdout, "商业律师 Julie package is structurally valid.\n");
});

test("SKILL.md declares the stable skill name and description", async () => {
  const content = await readFile(new URL("../SKILL.md", import.meta.url), "utf8");
  assert.match(content, /^---\nname: commercial-lawyer-julie\n/m);
  assert.match(content, /商业律师 Julie/);
  assert.match(content, /AI 一人公司/);
  assert.match(content, /AI OPC/);
});

test("SKILL.md routes all six operational modules", async () => {
  const content = await readFile(new URL("../SKILL.md", import.meta.url), "utf8");
  for (const route of [
    "deals_contracts",
    "ai_data_ip",
    "delivery_change_acceptance",
    "invoicing_collections",
    "disputes_evidence",
    "lawyer_handoff"
  ]) {
    assert.match(content, new RegExp(`\\b${route}\\b`));
  }
});
