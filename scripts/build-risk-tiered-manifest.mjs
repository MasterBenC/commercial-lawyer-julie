import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const criticalScenarioIds = new Set(["A02", "S03", "S06", "S08"]);
const defaultInputUrl = new URL(
  "../tests/fixtures/scenario-inputs.json",
  import.meta.url
);
const defaultOutputUrl = new URL(
  "../work/risk-tiered-evaluation/manifest.json",
  import.meta.url
);

export function buildRiskTieredManifest(inputs) {
  const scenarioIds = new Set();

  for (const { id } of inputs) {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error("Scenario IDs must be present.");
    }
    if (scenarioIds.has(id)) {
      throw new Error(`Duplicate scenario ID: ${id}`);
    }
    scenarioIds.add(id);
  }

  return inputs.flatMap(({ id: scenarioId }) => {
    const critical = criticalScenarioIds.has(scenarioId);
    const repetitions = critical ? [1, 2] : [1];
    return repetitions.map((repetition) => ({
      runId: `${scenarioId}-run${repetition}`,
      scenarioId,
      repetition,
      critical
    }));
  });
}

export async function writeRiskTieredManifest({
  inputUrl = defaultInputUrl,
  outputUrl = defaultOutputUrl
} = {}) {
  const inputs = JSON.parse(await readFile(inputUrl, "utf8"));
  const manifest = buildRiskTieredManifest(inputs);
  await mkdir(new URL("./", outputUrl), { recursive: true });
  await writeFile(outputUrl, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const manifest = await writeRiskTieredManifest();
  console.log(`Wrote ${manifest.length} risk-tiered evaluation runs.`);
}
