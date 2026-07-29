import test from "node:test";
import assert from "node:assert/strict";
import { validateSkill } from "../scripts/validate-skill.mjs";

test("the complete Julie package has no missing required files", async () => {
  const result = await validateSkill(new URL("../", import.meta.url));
  assert.deepEqual(result.missing, []);
});
