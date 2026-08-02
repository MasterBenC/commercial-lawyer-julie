import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRootUrl = new URL("../", import.meta.url);
const unavailableFields = [
  "hostRuntimeVersion",
  "systemDeveloperInstructionsDigest",
  "enabledToolsAndVersions",
  "permissionProfile",
  "samplingParameters",
  "seedOrUnavailable"
];
const knownRoutes = [
  "deals_contracts",
  "ai_data_ip",
  "delivery_change_acceptance",
  "invoicing_collections",
  "disputes_evidence",
  "lawyer_handoff"
];

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

function cleanScalar(value) {
  return value
    .trim()
    .replace(/^`|`$/g, "")
    .replace(/^\[|\]$/g, "")
    .trim();
}

function canonicalKey(label) {
  return label
    .replaceAll("`", "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^A-Za-z0-9]+/g, "")
    .toLowerCase();
}

function extractHeaderAndAnswer(rawArtifact) {
  const heading = /^#{1,2}\s+(?:Complete unedited(?: final)? answer|Final answer \(unedited\)|完整未编辑答复)\s*$/im;
  const match = heading.exec(rawArtifact);
  if (!match) {
    throw new Error("complete unedited answer heading is missing");
  }
  const answer = rawArtifact.slice(match.index + match[0].length).trim();
  if (answer.length === 0) {
    throw new Error("complete unedited answer is empty");
  }
  return {
    header: rawArtifact.slice(0, match.index),
    answer
  };
}

function parseTopLevelFields(header) {
  const lines = header.replaceAll("\r\n", "\n").split("\n");
  const entries = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(?:-\s*)?([^\s:#][^:]*):\s*(.*)$/.exec(lines[index]);
    if (match) {
      entries.push({
        key: canonicalKey(match[1]),
        value: cleanScalar(match[2]),
        index
      });
    }
  }

  const fields = new Map();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const nextIndex = entries[index + 1]?.index ?? lines.length;
    fields.set(entry.key, {
      value: entry.value,
      section: lines.slice(entry.index + 1, nextIndex).join("\n").trim()
    });
  }
  return fields;
}

function selectField(fields, aliases) {
  for (const alias of aliases) {
    const field = fields.get(canonicalKey(alias));
    if (field) return field;
  }
  return undefined;
}

function requiredScalar(fields, aliases, name) {
  const field = selectField(fields, aliases);
  const value = cleanScalar(field?.value ?? "");
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

function parseStartedAt(value) {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`startedAtUtc is invalid: ${value}`);
  }
  return new Date(milliseconds).toISOString();
}

function parseRoutes(field) {
  const text = `${field?.value ?? ""}\n${field?.section ?? ""}`;
  const routes = knownRoutes.filter((route) => new RegExp(`\\b${route}\\b`).test(text));
  if (routes.length === 0) throw new Error("actualRoutes is missing");
  return routes;
}

function parseRisk(value) {
  const match = /\b(low|medium|high)\b/i.exec(value);
  if (!match) throw new Error(`actualRisk is invalid: ${value}`);
  return match[1].toLowerCase();
}

function parseEscalation(fields) {
  const decisionField = selectField(fields, ["actualEscalationDecision"]);
  const reasonsField = selectField(fields, ["actualEscalationReasons"]);
  const escalationField = selectField(fields, ["actualEscalation", "escalation"]);
  const text = [
    decisionField?.value,
    decisionField?.section,
    reasonsField?.value,
    reasonsField?.section,
    escalationField?.value,
    escalationField?.section
  ]
    .filter(Boolean)
    .join("\n");

  if (!text) throw new Error("escalation metadata is missing");
  let escalationDecision;
  if (/\b(?:not[_ ]triggered|none|false)\b/i.test(text)) {
    escalationDecision = "not_triggered";
  } else if (/\b(?:triggered|true)\b/i.test(text)) {
    escalationDecision = "triggered";
  } else {
    escalationDecision = "triggered";
  }

  const escalationReasons = [
    ...new Set(
      (text.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/gi) ?? [])
        .map((reason) => reason.toLowerCase())
        .filter(
          (reason) =>
            !["not_triggered", "lawyer_handoff"].includes(reason)
        )
    )
  ];
  if (escalationDecision === "not_triggered") escalationReasons.length = 0;
  return { escalationDecision, escalationReasons };
}

function parseSourceState(field) {
  const value = [field?.value, field?.section].filter(Boolean).join("\n").trim();
  if (!value) throw new Error("sourceState is missing");
  return value;
}

export function normalizeRunArtifact(rawArtifact, rawArtifactPath) {
  const { header, answer } = extractHeaderAndAnswer(rawArtifact);
  const fields = parseTopLevelFields(header);
  const runId = requiredScalar(fields, ["runId"], "runId");
  const scenarioId = requiredScalar(fields, ["scenarioId"], "scenarioId");
  const startedAtUtc = parseStartedAt(
    requiredScalar(fields, ["startedAtUtc", "startedAt (UTC)", "startedAt"], "startedAtUtc")
  );
  const mode = requiredScalar(
    fields,
    ["actualMode", "actual working mode", "mode"],
    "actualMode"
  );
  const risk = requiredScalar(
    fields,
    ["actualRisk", "overallRisk", "risk"],
    "actualRisk"
  );
  const sourceState = parseSourceState(
    selectField(fields, ["actualSourceState", "source state", "sourceState"])
  );
  const decisiveQuestionCount = Number.parseInt(
    requiredScalar(
      fields,
      ["decisiveQuestionCount", "decisive question count"],
      "decisiveQuestionCount"
    ),
    10
  );
  if (!Number.isInteger(decisiveQuestionCount) || decisiveQuestionCount < 0) {
    throw new Error("decisiveQuestionCount is invalid");
  }

  return {
    runId,
    scenarioId,
    startedAtUtc,
    modelIdentifierAndVersion: requiredScalar(fields, ["model"], "modelIdentifierAndVersion"),
    skillCommitSha: requiredScalar(fields, ["skillCommit"], "skillCommitSha").toLowerCase(),
    skillSha256: requiredScalar(fields, ["skillSha256"], "skillSha256").toUpperCase(),
    actualMode: mode,
    actualRoutes: parseRoutes(selectField(fields, ["actual routes", "actualRoutes", "routes"])),
    actualRisk: parseRisk(risk),
    ...parseEscalation(fields),
    sourceState,
    decisiveQuestionCount,
    ...Object.fromEntries(unavailableFields.map((field) => [field, "unavailable"])),
    rawArtifactPath: rawArtifactPath.replaceAll("\\", "/"),
    rawArtifactSha256: sha256(rawArtifact),
    completeUneditedAnswerSha256: sha256(answer),
    completeUneditedAnswerByteLength: Buffer.byteLength(answer, "utf8"),
    completeUneditedAnswer: answer
  };
}

function fail(message) {
  throw new Error(`Normalized run metadata validation failed: ${message}`);
}

function validateSchemaProperty(value, propertySchema, fieldPath) {
  if (propertySchema.type === "string" && typeof value !== "string") fail(`${fieldPath} must be a string`);
  if (propertySchema.type === "integer" && !Number.isInteger(value)) fail(`${fieldPath} must be an integer`);
  if (propertySchema.type === "array" && !Array.isArray(value)) fail(`${fieldPath} must be an array`);
  if (propertySchema.minLength && value.length < propertySchema.minLength) fail(`${fieldPath} is empty`);
  if (propertySchema.minimum !== undefined && value < propertySchema.minimum) fail(`${fieldPath} is below minimum`);
  if (propertySchema.pattern && !new RegExp(propertySchema.pattern).test(value)) fail(`${fieldPath} does not match schema pattern`);
  if (propertySchema.enum && !propertySchema.enum.includes(value)) fail(`${fieldPath} is not an allowed value`);
  if (propertySchema.format === "date-time" && !Number.isFinite(Date.parse(value))) fail(`${fieldPath} is not a date-time`);
  if (propertySchema.type === "array") {
    if (propertySchema.minItems && value.length < propertySchema.minItems) fail(`${fieldPath} has too few items`);
    for (const [index, item] of value.entries()) {
      validateSchemaProperty(item, propertySchema.items, `${fieldPath}[${index}]`);
    }
  }
}

export function validateNormalizedRunIndex(index, schema) {
  for (const field of schema.required) {
    if (!Object.hasOwn(index, field)) fail(`${field} is missing`);
  }
  if (index.schemaVersion !== schema.properties.schemaVersion.const) fail("schemaVersion does not match schema");
  validateSchemaProperty(index.artifactSetAsOfUtc, schema.properties.artifactSetAsOfUtc, "artifactSetAsOfUtc");
  validateSchemaProperty(index.sourceManifest, schema.properties.sourceManifest, "sourceManifest");
  validateSchemaProperty(index.normalizationPolicy, schema.properties.normalizationPolicy, "normalizationPolicy");
  if (!Array.isArray(index.runs)) fail("runs must be an array");

  const runSchema = schema.$defs.run;
  const allowedRunFields = new Set(Object.keys(runSchema.properties));
  const seenRunIds = new Set();
  for (const run of index.runs) {
    for (const field of runSchema.required) {
      if (!Object.hasOwn(run, field)) fail(`${run.runId ?? "unknown"}.${field} is missing`);
    }
    for (const field of Object.keys(run)) {
      if (!allowedRunFields.has(field)) fail(`${run.runId}.${field} is not allowed by schema`);
    }
    for (const [field, propertySchema] of Object.entries(runSchema.properties)) {
      validateSchemaProperty(run[field], propertySchema, `${run.runId}.${field}`);
    }
    if (run.runId !== `${run.scenarioId}-run${run.runId.endsWith("run2") ? 2 : 1}`) {
      fail(`${run.runId}.scenarioId does not match runId`);
    }
    if (seenRunIds.has(run.runId)) fail(`${run.runId} is duplicated`);
    seenRunIds.add(run.runId);
  }

  const contract = schema["x-runContract"];
  if (index.runs.length !== contract.expectedTotalRuns) {
    fail(`expected ${contract.expectedTotalRuns} runs, found ${index.runs.length}`);
  }
  const counts = new Map();
  for (const run of index.runs) counts.set(run.scenarioId, (counts.get(run.scenarioId) ?? 0) + 1);
  if (counts.size !== contract.scenarioCount) fail(`expected ${contract.scenarioCount} scenarios, found ${counts.size}`);

  const criticalPairs = {};
  for (const [scenarioId, expectedRuns] of Object.entries(contract.criticalScenarioRuns)) {
    const pair = index.runs.filter((run) => run.scenarioId === scenarioId);
    if (pair.length !== expectedRuns) fail(`${scenarioId} must have ${expectedRuns} runs`);
    const [first, ...rest] = pair;
    for (const field of contract.criticalPairConsistencyFields) {
      if (rest.some((run) => run[field] !== first[field])) fail(`${scenarioId} has inconsistent ${field}`);
    }
    criticalPairs[scenarioId] = {
      risk: first.actualRisk,
      escalationDecision: first.escalationDecision
    };
  }
  for (const [scenarioId, count] of counts) {
    if (!Object.hasOwn(contract.criticalScenarioRuns, scenarioId) && count !== contract.defaultRunsPerScenario) {
      fail(`${scenarioId} must have ${contract.defaultRunsPerScenario} run`);
    }
  }
  return { valid: true, runCount: index.runs.length, criticalPairs };
}

export async function buildAndValidateRunIndex({ rootUrl = defaultRootUrl } = {}) {
  const root = fileURLToPath(rootUrl);
  const manifestPath = path.join(root, "work/risk-tiered-evaluation/manifest.json");
  const runsDirectory = path.join(root, "work/risk-tiered-evaluation/runs");
  const schemaPath = path.join(root, "evaluations/run-metadata.schema.json");
  const outputPath = path.join(root, "evaluations/2026-08-02-risk-tiered-run-metadata.json");
  const [manifest, schema, artifactNames] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    readFile(schemaPath, "utf8").then(JSON.parse),
    readdir(runsDirectory)
  ]);

  const expectedNames = manifest.map(({ runId }) => `${runId}.md`).sort();
  const actualNames = artifactNames.filter((name) => name.endsWith(".md")).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`Raw artifact inventory differs from manifest. Expected ${expectedNames.join(", ")}; found ${actualNames.join(", ")}`);
  }

  const normalizedRuns = [];
  for (const { runId, scenarioId } of manifest) {
    const artifactName = `${runId}.md`;
    const rawArtifact = await readFile(path.join(runsDirectory, artifactName), "utf8");
    const normalized = normalizeRunArtifact(
      rawArtifact,
      `work/risk-tiered-evaluation/runs/${artifactName}`
    );
    if (normalized.runId !== runId || normalized.scenarioId !== scenarioId) {
      throw new Error(`${artifactName} metadata does not match manifest`);
    }
    const { completeUneditedAnswer: _answer, ...metadata } = normalized;
    normalizedRuns.push(metadata);
  }

  const index = {
    schemaVersion: "1.0.0",
    artifactSetAsOfUtc: normalizedRuns
      .map(({ startedAtUtc }) => startedAtUtc)
      .sort()
      .at(-1),
    sourceManifest: "work/risk-tiered-evaluation/manifest.json",
    normalizationPolicy: "Controller-produced tolerant mapping of raw metadata field variants. Missing host, instruction, tool, permission, sampling, and seed values are recorded as unavailable. Complete unedited answers remain only in raw artifacts; the index stores their SHA-256 and byte length.",
    runs: normalizedRuns
  };
  const result = validateNormalizedRunIndex(index, schema);
  await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return { ...result, outputPath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await buildAndValidateRunIndex();
  console.log(`Validated ${result.runCount} raw run artifacts and wrote normalized metadata index.`);
}
