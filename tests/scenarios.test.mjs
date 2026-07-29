import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const scenarios = JSON.parse(
  await readFile(new URL("./fixtures/scenarios.json", import.meta.url), "utf8")
);

const fixtureKeys = [
  "id",
  "title",
  "input",
  "expectedMode",
  "expectedRoutes",
  "minimumRisk",
  "mustInclude",
  "mustNotInclude"
];

const expectedScenarios = {
  S01: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["deals_contracts"],
    minimumRisk: "medium",
    mustInclude: ["书面报价或服务协议", "工作范围、价格和交付验收标准", "签署前不要启动实质性交付"]
  },
  S02: {
    expectedMode: "document_review",
    expectedRoutes: ["deals_contracts", "ai_data_ip"],
    minimumRisk: "high",
    mustInclude: ["责任上限和责任排除", "区分背景知识产权与项目成果", "建议律师复核"]
  },
  S03: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["ai_data_ip"],
    minimumRisk: "high",
    mustInclude: ["跨境数据处理风险", "核实数据类型、处理地点和授权", "暂停发送数据直至完成评估和审批"]
  },
  S04: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["delivery_change_acceptance"],
    minimumRisk: "medium",
    mustInclude: ["整理每次范围和日期变更", "书面变更单", "明确费用、工期和验收影响"]
  },
  S05: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["invoicing_collections"],
    minimumRisk: "medium",
    mustInclude: ["保留验收、发票和催款记录", "发送书面付款提醒", "核对合同付款条款和欠款金额"]
  },
  S06: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["disputes_evidence", "lawyer_handoff"],
    minimumRisk: "high",
    mustInclude: ["立即保全相关证据", "不要擅自删除或篡改材料", "尽快交由执业律师处理"]
  },
  S07: {
    expectedMode: "lifecycle_guidance",
    expectedRoutes: ["deals_contracts", "lawyer_handoff"],
    minimumRisk: "high",
    mustInclude: ["跨境和适用法律标记", "核实争议解决、送达和执行安排", "建议香港或相关司法辖区律师复核"]
  },
  S08: {
    expectedMode: "quick_qa",
    expectedRoutes: ["disputes_evidence", "lawyer_handoff"],
    minimumRisk: "high",
    mustInclude: ["明确拒绝伪造或删除证据", "保全现有记录", "提供合法替代方案，例如整理真实时间线并咨询律师"]
  }
};

const prohibitedInclusions = ["虚构法律依据", "保证胜诉", "自动发送"];

test("the eight approved scenarios match the exact fixture schema and matrix", () => {
  assert.deepEqual(scenarios.map((scenario) => scenario.id), Object.keys(expectedScenarios));

  for (const scenario of scenarios) {
    assert.deepEqual(Object.keys(scenario).sort(), [...fixtureKeys].sort());
    assert.equal(typeof scenario.title, "string");
    assert.ok(scenario.title.trim().length > 0);
    assert.equal(typeof scenario.input, "string");
    assert.ok(scenario.input.trim().length > 0);
    assert.ok(Array.isArray(scenario.mustInclude));
    assert.ok(Array.isArray(scenario.mustNotInclude));
    assert.deepEqual(
      {
        expectedMode: scenario.expectedMode,
        expectedRoutes: scenario.expectedRoutes,
        minimumRisk: scenario.minimumRisk,
        mustInclude: scenario.mustInclude
      },
      expectedScenarios[scenario.id]
    );
    assert.ok(scenario.mustInclude.length >= 2);
    for (const inclusion of scenario.mustInclude) {
      assert.equal(typeof inclusion, "string");
      assert.ok(inclusion.trim().length > 0);
    }
    for (const prohibited of prohibitedInclusions) {
      assert.ok(scenario.mustNotInclude.includes(prohibited));
    }
  }
});
