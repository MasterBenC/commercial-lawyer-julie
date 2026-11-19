import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateSkill } from "../scripts/validate-skill.mjs";

const execFileAsync = promisify(execFile);

// Run npm inside the throwaway release copy. `npm_execpath` is only set when the
// suite itself was started through npm; otherwise fall back to a bundled npm CLI
// next to the node binary, and finally to the npm executable on PATH, so the
// suite also runs under a bare `node --test tests/*.test.mjs`.
async function execNpm(npmArguments, options) {
  const candidateCliPath = process.env.npm_execpath ?? path.join(
    path.dirname(process.execPath),
    "node_modules/npm/bin/npm-cli.js"
  );
  if (existsSync(candidateCliPath)) {
    return execFileAsync(process.execPath, [candidateCliPath, ...npmArguments], options);
  }
  return execFileAsync("npm", npmArguments, {
    ...options,
    shell: process.platform === "win32"
  });
}

test("the complete Julie package has no missing required files", async () => {
  const result = await validateSkill(new URL("../", import.meta.url));
  assert.deepEqual(result.missing, []);
});

test("the validator protects every executable test and blind-evaluation asset", async () => {
  const { requiredFiles } = await import("../scripts/validate-skill.mjs");
  const releaseIntegrityFiles = [
    "scripts/prepare-blind-runtime.mjs",
    "scripts/render-scenario-prompts.mjs",
    "scripts/validate-run-artifacts.mjs",
    "scripts/validate-skill.mjs",
    "tests/policies.test.mjs",
    "tests/run-artifacts.test.mjs",
    "tests/scenarios.test.mjs",
    "tests/structure.test.mjs",
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

  for (const relativePath of releaseIntegrityFiles) {
    assert.ok(
      requiredFiles.includes(relativePath),
      `${relativePath} must remain release-required`
    );
  }
});

test("the validator mechanically checks committed evaluation metadata", async () => {
  const rootUrl = new URL("../", import.meta.url);
  const valid = await validateSkill(rootUrl);
  assert.deepEqual(valid.invalid, []);

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "julie-invalid-evaluation-"));
  try {
    const evaluationDirectory = path.join(temporaryRoot, "evaluations");
    await mkdir(evaluationDirectory, { recursive: true });
    for (const relativePath of [
      "evaluations/run-metadata.schema.json",
      "evaluations/2026-08-02-risk-tiered-evaluation.json"
    ]) {
      await copyFile(
        fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
        path.join(temporaryRoot, relativePath)
      );
    }
    const index = JSON.parse(
      await readFile(
        new URL("../evaluations/2026-08-02-risk-tiered-run-metadata.json", import.meta.url),
        "utf8"
      )
    );
    index.runs[0].actualRisk = "urgent";
    await writeFile(
      path.join(evaluationDirectory, "2026-08-02-risk-tiered-run-metadata.json"),
      `${JSON.stringify(index, null, 2)}\n`,
      "utf8"
    );

    const invalidRootUrl = pathToFileURL(`${temporaryRoot}${path.sep}`);
    const invalid = await validateSkill(invalidRootUrl);
    assert.match(
      invalid.invalid.join("\n"),
      /2026-08-02-risk-tiered-run-metadata\.json.*actualRisk/
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test(
  "documented clean release archive validation succeeds from tracked files only",
  {
    skip:
      process.env.JULIE_CLEAN_ARCHIVE_CHILD === "1" ||
      !existsSync(fileURLToPath(new URL("../.git", import.meta.url)))
  },
  async () => {
    const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
    const temporaryRoot = await mkdtemp(path.join(tmpdir(), "julie-clean-release-"));
    try {
      const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
        cwd: repositoryRoot,
        encoding: "buffer",
        maxBuffer: 10 * 1024 * 1024
      });
      const trackedFiles = stdout.toString("utf8").split("\0").filter(Boolean);
      for (const relativePath of trackedFiles) {
        const destination = path.join(temporaryRoot, relativePath);
        await mkdir(path.dirname(destination), { recursive: true });
        await copyFile(path.join(repositoryRoot, relativePath), destination);
      }

      await assert.rejects(
        readFile(path.join(temporaryRoot, "work/risk-tiered-evaluation/runs/S01-run1.md")),
        /ENOENT/
      );

      for (const npmArguments of [
        ["test"],
        ["run", "validate"],
        ["run", "eval:prepare"],
        ["run", "eval:render"],
        ["run", "eval:manifest"]
      ]) {
        await execNpm(npmArguments, {
          cwd: temporaryRoot,
          env: process.env,
          maxBuffer: 20 * 1024 * 1024
        });
      }
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }
);

test("the blind runtime allowlist excludes controller and evaluator assets", async () => {
  const { runtimeSkillFiles } = await import(
    "../scripts/prepare-blind-runtime.mjs"
  );

  assert.ok(runtimeSkillFiles.includes("SKILL.md"));
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
  assert.match(content, /^---\r?\nname: commercial-lawyer-julie\r?\n/m);
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
  assert.match(content, /npm test.*结构.*政策.*场景/s);
});

test("README separates clean-package validation from controller-only raw-run validation", async () => {
  const content = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const localValidation = content.slice(
    content.indexOf("## 本地验证"),
    content.indexOf("## 法域、安全与隐私边界")
  );
  const commandFenceStart = localValidation.indexOf("```bash");
  const standardCommands = localValidation.slice(
    commandFenceStart,
    localValidation.indexOf("```", commandFenceStart + 3)
  );

  assert.doesNotMatch(standardCommands, /eval:validate-runs/);
  assert.match(localValidation, /评测控制器专用/);
  assert.match(localValidation, /eval:validate-runs/);
  assert.match(localValidation, /raw run[^\n]*存在|原始 run[^\n]*存在/i);
  assert.match(localValidation, /clean|干净发布包/i);
});

test("release metadata documents the accepted risk-tiered evaluation without overstating it", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(packageJson.version, "0.2.0");
  assert.match(readme, /18\/18/);
  assert.match(readme, /14\/14/);
  assert.match(readme, /4\/4/);
  assert.match(
    readme,
    /\[.*\]\(evaluations\/2026-08-02-risk-tiered-evaluation\.md\)/
  );
  assert.doesNotMatch(readme, /42\s*[^\n]*\s*(?:已完成|通过|完成)/);
  assert.match(readme, /v0\.1[^\n]*指令约束隔离/);
  assert.match(readme, /不提供操作系统级隔离证明/);
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
