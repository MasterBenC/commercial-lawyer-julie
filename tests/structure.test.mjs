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

test("the validator protects every executable test and blind-evaluation asset", async () => {
  const { requiredFiles } = await import("../scripts/validate-skill.mjs");
  assert.ok(requiredFiles.includes("references/persona-voice.md"));
  const releaseIntegrityFiles = [
    "scripts/prepare-blind-runtime.mjs",
    "scripts/render-scenario-prompts.mjs",
    "scripts/validate-skill.mjs",
    "tests/policies.test.mjs",
    "tests/persona.test.mjs",
    "tests/scenarios.test.mjs",
    "tests/structure.test.mjs",
    "tests/fixtures/scenario-inputs.json",
    "tests/fixtures/scenario-rubrics.json",
    "docs/evaluation.md"
  ];

  for (const relativePath of releaseIntegrityFiles) {
    assert.ok(
      requiredFiles.includes(relativePath),
      `${relativePath} must remain release-required`
    );
  }
});

test("the blind runtime allowlist excludes controller and evaluator assets", async () => {
  const { runtimeSkillFiles } = await import(
    "../scripts/prepare-blind-runtime.mjs"
  );

  assert.ok(runtimeSkillFiles.includes("SKILL.md"));
  assert.ok(runtimeSkillFiles.includes("references/persona-voice.md"));
  assert.ok(runtimeSkillFiles.includes("references/privacy-safety.md"));
  assert.ok(runtimeSkillFiles.includes("templates/lawyer-handoff-pack.md"));
  for (const relativePath of runtimeSkillFiles) {
    assert.doesNotMatch(
      relativePath,
      /^(?:tests|docs|scripts|work)\//,
      `${relativePath} must not expose evaluation assets to the tested agent`
    );
  }
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

test("README documents installation, safety boundary, tests, and LexFlow status", async () => {
  const content = await readFile(new URL("../README.md", import.meta.url), "utf8");
  for (const token of ["商业律师 Julie", "安装", "npm test", "中国大陆", "不构成律师委托", "LexFlow", "路线图"]) {
    assert.match(content, new RegExp(token));
  }
  for (const token of [
    "冷静",
    "成熟",
    "Julie 的结论",
    "现在先做",
    "可选方案 A",
    "可选方案 B"
  ]) {
    assert.match(content, new RegExp(token));
  }
  assert.match(content, /先别签|先停/);
  assert.match(content, /不代表.*持证律师|不构成律师委托/s);
  assert.match(content, /npm test.*结构.*政策.*场景/s);
  assert.match(content, /行为评估.*尚未完成|行为评估.*待完成/s);
});

test("publication instructions pin every external action to the verified release worktree and tag", async () => {
  const content = await readFile(
    new URL("../docs/superpowers/plans/2026-07-29-commercial-lawyer-julie-implementation.md", import.meta.url),
    "utf8"
  );
  const task9 = content.slice(content.indexOf("### Task 9:"));

  assert.match(task9, /RELEASE_WORKTREE/);
  assert.match(task9, /git -C "\$RELEASE_WORKTREE" rev-parse HEAD/);
  assert.match(task9, /git -C "\$RELEASE_WORKTREE" rev-parse 'v0\.1\.0\^\{\}'/);
  assert.match(task9, /HEAD.*v0\.1\.0\^\{\}.*不一致|HEAD.*v0\.1\.0\^\{\}.*match/s);

  const guardPosition = task9.indexOf("v0.1.0^{}");
  const createPosition = task9.indexOf("gh repo create");
  const pushPosition = task9.indexOf('push origin v0.1.0');
  assert.ok(guardPosition >= 0 && guardPosition < createPosition);
  assert.ok(guardPosition < pushPosition);
});
