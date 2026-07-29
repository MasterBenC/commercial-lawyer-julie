import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
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
