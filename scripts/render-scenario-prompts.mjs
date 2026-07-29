import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const defaultInputUrl = new URL(
  "../tests/fixtures/scenario-inputs.json",
  import.meta.url
);
const defaultOutputUrl = new URL("../work/evaluation-prompts.md", import.meta.url);

export function renderScenarioPrompts(scenarios) {
  const header = [
    "# 商业律师 Julie 盲测输入",
    "",
    "> 控制器说明：每个编号必须在启用同一 Skill 版本的全新 agent 会话中单独运行；被测 agent 只能访问 `npm run eval:prepare` 生成的隔离运行时，不得访问源仓库、评分表或其他场景的回答。每个场景至少运行三次，并固定模型、运行时、指令、工具、权限和采样设置。",
    ""
  ].join("\n");

  const body = scenarios.map((scenario) => [
    `## ${scenario.id} ${scenario.title}`,
    "",
    scenario.input
  ].join("\n")).join("\n\n");

  return `${header}${body}\n`;
}

export async function renderScenarioPromptsFile({
  inputUrl = defaultInputUrl,
  outputUrl = defaultOutputUrl
} = {}) {
  const scenarios = JSON.parse(await readFile(inputUrl, "utf8"));
  await mkdir(new URL("./", outputUrl), { recursive: true });
  await writeFile(outputUrl, renderScenarioPrompts(scenarios), "utf8");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await renderScenarioPromptsFile();
  console.log("Rendered work/evaluation-prompts.md (blind inputs only)");
}
