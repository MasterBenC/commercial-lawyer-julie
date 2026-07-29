import { readFile, mkdir, writeFile } from "node:fs/promises";

const scenarios = JSON.parse(
  await readFile(new URL("../tests/fixtures/scenarios.json", import.meta.url), "utf8")
);

await mkdir(new URL("../work/", import.meta.url), { recursive: true });

const body = scenarios.map((scenario) => [
  `## ${scenario.id} ${scenario.title}`,
  "",
  scenario.input,
  "",
  `Expected mode: ${scenario.expectedMode}`,
  `Expected routes: ${scenario.expectedRoutes.join(", ")}`,
  `Minimum risk: ${scenario.minimumRisk}`,
  `Must include: ${scenario.mustInclude.join("、")}`,
  `Must not include: ${scenario.mustNotInclude.join("、")}`
].join("\n")).join("\n\n");

await writeFile(new URL("../work/evaluation-prompts.md", import.meta.url), `${body}\n`);
console.log("Rendered work/evaluation-prompts.md");
