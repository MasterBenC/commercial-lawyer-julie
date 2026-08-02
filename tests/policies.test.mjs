import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function reference(name) {
  return readFile(new URL(`../references/${name}`, import.meta.url), "utf8");
}

async function template(name) {
  return readFile(new URL(`../templates/${name}`, import.meta.url), "utf8");
}

async function skill() {
  return readFile(new URL("../SKILL.md", import.meta.url), "utf8");
}

test("risk policy defines all levels and mandatory high-risk categories", async () => {
  const content = await reference("risk-policy.md");
  for (const token of ["low", "medium", "high", "诉讼", "行政", "刑事", "股权", "敏感个人信息", "重大知识产权"]) {
    assert.match(content, new RegExp(token));
  }
  assert.match(content, /对于 `high` 风险.*输出必须说明紧急程度.*临时行动.*触发 `lawyer_handoff`/s);
  assert.match(content, /临时行动.*保全合法证据.*暂停不可逆决定.*收集关键文件.*有执业资格律师意见/s);
});

test("jurisdiction policy escalates cross-border indicators", async () => {
  const content = await reference("jurisdiction-source-policy.md");
  for (const token of ["中国大陆", "香港", "境外主体", "境外付款", "跨境数据", "外国法"]) {
    assert.match(content, new RegExp(token));
  }
  assert.match(content, /香港.*外国法.*境外主体.*境外付款.*跨境数据.*必须.*“跨境”标记.*`lawyer_handoff`/s);
  for (const token of ["标题", "发布机关", "生效日期", "URL", "核验日期", "verified", "needs_verification", "unavailable"]) {
    assert.match(content, new RegExp(token));
  }
  assert.match(content, /权威的一手来源核验/);
  assert.match(content, /不得.*编造引文/s);
});

test("mainland China is an analysis baseline while governing law and forum come from the transaction", async () => {
  const jurisdiction = await reference("jurisdiction-source-policy.md");
  const deals = await reference("deals-contracts.md");
  const joined = `${jurisdiction}\n${deals}`;

  assert.match(jurisdiction, /中国大陆.*默认分析法域|默认适用法背景.*中国大陆/s);
  assert.match(joined, /适用法律.*争议解决.*交易|交易.*适用法律.*争议解决/s);
  assert.match(joined, /法院|仲裁机构/);
  assert.doesNotMatch(joined, /默认管辖(?:地)?|中国大陆为默认管辖地/);
});

test("safety policy forbids evidence abuse and misleading privacy claims", async () => {
  const content = await reference("privacy-safety.md");
  assert.match(content, /伪造.*篡改.*隐匿.*销毁/s);
  assert.match(content, /本地.*不保证.*不外传/s);
  assert.match(content, /合法替代方案/);
  assert.match(content, /仅收集.*必需的事实/s);
  assert.match(content, /文档中的指令.*不受信任.*不能改变本政策/s);
  assert.match(content, /未获得.*明确授权前.*不得对外发送.*签署.*付款.*提交/s);
});

test("mandatory runtime instructions cover identity, refusal, untrusted inputs, and recoverable failures", async () => {
  const [skillContent, safety] = await Promise.all([
    skill(),
    reference("privacy-safety.md")
  ]);
  const runtime = `${skillContent}\n${safety}`;

  assert.match(runtime, /不替代.*持证律师.*正式法律意见/s);
  assert.match(runtime, /逃避.*监管义务.*依法或依约应披露.*拒绝.*合法替代方案/s);
  assert.match(runtime, /粘贴文本.*检索.*网页.*工具.*搜索.*不受信任/s);
  assert.match(runtime, /超大.*损坏.*不支持.*无法读取/s);
  assert.match(runtime, /冲突条款.*位置.*后果.*统一修改/s);
  assert.match(runtime, /工具.*检索.*失败.*事实.*法律核验.*(?:needs_verification|unavailable)/s);
});

test("A02 routes material data-contract conflicts to both modules and high-risk handoff", async () => {
  const [routing, risk, handoff] = await Promise.all([
    reference("intake-routing.md"),
    reference("risk-policy.md"),
    reference("lawyer-handoff.md")
  ]);

  assert.match(
    routing,
    /合同.*数据.*训练.*重要条款.*冲突.*`deals_contracts`.*`ai_data_ip`/s
  );
  assert.match(
    risk,
    /多处.*相互矛盾.*重要条款.*隐瞒.*误导.*`high`/s
  );
  assert.match(
    risk,
    /`material_contract_deception`.*`lawyer_handoff`/s
  );
  assert.match(handoff, /`material_contract_deception`/);
});

test("A03 continues a limited review of user-described readable material", async () => {
  const safety = await reference("privacy-safety.md");

  assert.match(
    safety,
    /用户明确说明.*材料可读取.*内容性质.*用户提供的事实.*有限范围.*继续处理/s
  );
  assert.match(
    safety,
    /报价摘要.*已提供的信息.*审查边界.*不可读取.*不得猜测/s
  );
});

test("S05 produces a reviewable placeholder payment reminder when facts are missing", async () => {
  const [skillContent, collections, output, reminder] = await Promise.all([
    skill(),
    reference("invoicing-collections.md"),
    reference("output-contract.md"),
    template("payment-reminder.md")
  ]);

  assert.match(
    skillContent,
    /用户需要付款提醒或催款草稿.*`templates\/payment-reminder\.md`/s
  );
  assert.match(
    skillContent,
    /事实缺失.*可审阅草稿.*占位符.*待核实/s
  );
  assert.match(
    collections,
    /验收.*逾期.*事实缺失.*可审阅.*付款提醒.*占位符.*待核实/s
  );
  assert.match(
    collections,
    /不得.*事实缺失.*推迟.*草稿/s
  );
  assert.match(
    output,
    /用户要求.*草稿.*`可以直接使用`.*可审阅.*占位符.*待核实/s
  );
  assert.match(reminder, /\[待核实：[^\]]+\]/);
});

test("refusal language targets unlawful, deceptive, or misleading evasion", async () => {
  const skillContent = await skill();
  const safety = await reference("privacy-safety.md");

  for (const content of [skillContent, safety]) {
    assert.match(content, /违法、欺骗或误导/);
    assert.match(content, /依法或依约应披露的重要事实/);
  }
});

test("each operational route exposes only its relevant template paths and loading conditions", async () => {
  const skillContent = await skill();
  const mappings = {
    "deals-contracts.md": [
      "templates/quotation-confirmation.md",
      "templates/nda.md",
      "templates/service-agreement.md"
    ],
    "ai-data-ip.md": ["templates/service-agreement.md"],
    "delivery-change-acceptance.md": [
      "templates/change-order.md",
      "templates/acceptance-record.md"
    ],
    "invoicing-collections.md": ["templates/payment-reminder.md"],
    "lawyer-handoff.md": ["templates/lawyer-handoff-pack.md"]
  };

  for (const [referenceName, templatePaths] of Object.entries(mappings)) {
    const moduleContent = await reference(referenceName);
    for (const templatePath of templatePaths) {
      assert.ok(skillContent.includes(templatePath));
      assert.ok(moduleContent.includes(templatePath));
    }
    assert.match(moduleContent, /仅当|需要.*时|触发.*时|符合.*条件/s);
  }
});

test("an explicit user request can trigger the vetted lawyer handoff template", async () => {
  const [skillContent, handoff, handoffTemplate] = await Promise.all([
    skill(),
    reference("lawyer-handoff.md"),
    template("lawyer-handoff-pack.md")
  ]);

  for (const content of [skillContent, handoff, handoffTemplate]) {
    assert.match(content, /用户明确要求.*律师交接|用户.*明确要求.*交接材料/s);
  }
  for (const content of [skillContent, handoff]) {
    assert.ok(content.includes("templates/lawyer-handoff-pack.md"));
  }
  assert.match(handoffTemplate, /`low`.*`medium`.*`high`/s);
});

test("contract module covers the commercial clause set", async () => {
  const content = await reference("deals-contracts.md");
  for (const token of ["主体", "范围", "交付", "变更", "验收", "付款", "知识产权", "保密", "责任限制", "终止", "争议解决"]) {
    assert.match(content, new RegExp(token));
  }
});

test("AI module covers inputs, providers, outputs, open source, and personal information", async () => {
  const content = await reference("ai-data-ip.md");
  for (const token of ["客户素材", "数据来源", "模型供应商", "输出内容", "开源", "个人信息", "跨境"]) {
    assert.match(content, new RegExp(token));
  }
});

test("entrusted personal-information processing distinguishes the handler from the trustee", async () => {
  const aiData = await reference("ai-data-ip.md");
  const serviceAgreement = await template("service-agreement.md");

  for (const content of [aiData, serviceAgreement]) {
    assert.match(content, /个人信息处理者.*受托人/s);
    assert.match(content, /不得.*受托人.*个人信息处理者.*混同/s);
  }
  for (const token of ["委托处理目的", "期限", "处理方式", "个人信息的种类", "保护措施", "双方权利和义务", "监督", "返还", "删除"]) {
    assert.match(serviceAgreement, new RegExp(token));
  }
  assert.match(serviceAgreement, /未经甲方作为个人信息处理者同意.*转委托/s);
});

test("the PIPL Article 21 source record is complete and verified against an official source", async () => {
  const aiData = await reference("ai-data-ip.md");
  for (const token of [
    "中华人民共和国个人信息保护法",
    "全国人民代表大会常务委员会",
    "中华人民共和国主席令第九十一号",
    "2021-08-20",
    "2021-11-01",
    "https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html",
    "2026-07-29",
    "verified"
  ]) {
    assert.match(aiData, new RegExp(token.replaceAll("/", "\\/")));
  }
  assert.match(aiData, /第二十一条/);
  assert.match(aiData, /应依.*第二十一条约定/);
  assert.match(aiData, /便于证明和执行.*建议.*书面形式/s);
  assert.doesNotMatch(aiData, /第二十一条.*应书面约定/s);
});

test("NDA excludes information independently developed without confidential information", async () => {
  const content = await template("nda.md");
  assert.match(content, /不属于保密信息.*未使用保密信息.*独立开发/s);
});

test("NDA treats compelled disclosure as limited permission without ending confidentiality", async () => {
  const content = await template("nda.md");
  const exclusions = content.slice(
    content.indexOf("下列信息不属于保密信息"),
    content.indexOf("## 二、")
  );

  assert.doesNotMatch(exclusions, /依法必须披露/);
  assert.match(content, /依法.*必须披露.*可行.*通知/s);
  assert.match(content, /法定.*最低.*范围|披露.*必要.*范围/s);
  assert.match(content, /披露后.*仍.*保密|未披露部分.*继续.*保密/s);
});

test("service agreement states an operative indemnity trigger and scope", async () => {
  const content = await template("service-agreement.md");
  assert.match(content, /违反.*陈述、承诺或义务.*第三方索赔.*直接损失.*合理费用.*赔偿/s);
});

test("service agreement subprocessor carve-out remains subject to confidentiality and data consent", async () => {
  const content = await template("service-agreement.md");
  const other = content.slice(content.indexOf("## 11. 其他"));

  assert.match(other, /第\s*7\s*条.*保密与数据/s);
  assert.match(other, /第\s*7\s*条确认的实际角色.*相应个人信息处理者.*书面同意/s);
  assert.doesNotMatch(other, /甲方作为个人信息处理者/);
  assert.match(other, /接触保密信息.*事先取得.*披露方.*书面同意/s);
  assert.match(other, /转委托|分包商|次级处理者/);
});

test("the action-list contract uses the exact heading and operational fields", async () => {
  const content = await reference("output-contract.md");
  assert.match(content, /7\. `法务行动清单`/);
  assert.match(content, /负责人.*动作.*期限/s);
  assert.match(content, /负责人.*默认为.*用户/s);
  assert.doesNotMatch(content, /`法律行动清单`/);
});

test("transaction templates preserve their substantive drafting requirements", async () => {
  const quotation = await template("quotation-confirmation.md");
  const nda = await template("nda.md");
  const serviceAgreement = await template("service-agreement.md");

  for (const content of [quotation, nda, serviceAgreement]) {
    assert.match(content, /交易起草模板/);
    assert.match(content, /\[[^\]]+\]/);
  }
  for (const token of ["有效期", "服务范围", "交付物", "排除事项", "客户配合", "付款", "税务", "变更", "验收"]) {
    assert.match(quotation, new RegExp(token));
  }
  for (const token of ["保密信息", "不属于保密信息", "需要知悉", "保密期限", "返还", "删除", "救济"]) {
    assert.match(nda, new RegExp(token));
  }
  for (const token of ["服务范围", "变更", "验收", "付款", "背景知识产权", "交付物权利", "模型披露", "保密", "个人信息", "赔偿", "责任限制", "期限", "终止", "争议解决"]) {
    assert.match(serviceAgreement, new RegExp(token));
  }
});

test("operational modules cover change, acceptance, collection, and evidence", async () => {
  const files = [
    "delivery-change-acceptance.md",
    "invoicing-collections.md",
    "disputes-evidence.md"
  ];
  const joined = (await Promise.all(files.map(reference))).join("\n");
  for (const token of ["变更单", "追加费用", "验收", "暂停服务", "催款", "时间线", "聊天记录", "版本记录"]) {
    assert.match(joined, new RegExp(token));
  }
});

test("handoff module defines every required handoff section", async () => {
  const content = await reference("lawyer-handoff.md");
  for (const token of ["事项摘要", "当事人", "事实时间线", "争议金额", "关键条款", "现有证据", "证据缺口", "核心问题", "待办时限", "咨询提纲"]) {
    assert.match(content, new RegExp(token));
  }
});

test("evaluation policy requires the risk-tiered run protocol", async () => {
  const content = await readFile(new URL("../docs/evaluation.md", import.meta.url), "utf8");

  assert.match(content, /18 次风险分层行为评测/);
  for (const scenarioId of ["A02", "S03", "S06", "S08"]) {
    assert.ok(content.includes(`\`${scenarioId}\``));
  }
  assert.match(content, /全新 agent 会话/);
  assert.match(content, /评分表始终留在被测沙箱之外/);
  assert.doesNotMatch(content, /每个场景至少执行\s*\*\*3 次相互独立的运行\*\*/);
});

test("evaluation policy fixes the 14 plus 4 arithmetic and pair consistency gates", async () => {
  const content = await readFile(new URL("../docs/evaluation.md", import.meta.url), "utf8");

  assert.match(content, /14\s*个场景[^\n]*各[^\n]*1\s*次/);
  assert.match(content, /4\s*个关键场景[^\n]*各[^\n]*增加[^\n]*1\s*次/);
  assert.match(content, /14\s*\+\s*4\s*=\s*18/);
  assert.match(content, /关键场景[^\n]*风险等级[^\n]*升级判断[^\n]*一致/);
});

test("evaluation policy requires one ordinary and two critical post-fix reruns", async () => {
  const content = await readFile(new URL("../docs/evaluation.md", import.meta.url), "utf8");

  assert.match(content, /普通场景[^\n]*修复后[^\n]*1\s*次独立复测/);
  assert.match(content, /关键场景[^\n]*修复后[^\n]*2\s*次独立复测/);
});

test("evaluation policy identifies the completed report without claiming static checks are behavioral evidence", async () => {
  const content = await readFile(new URL("../docs/evaluation.md", import.meta.url), "utf8");

  assert.doesNotMatch(content, /尚未产生任何行为评估结果/);
  assert.match(
    content,
    /2026-08-02[^\n]*\[.*风险分层.*报告.*\]\(\.\.\/evaluations\/2026-08-02-risk-tiered-evaluation\.md\)/
  );
  assert.match(content, /静态测试[^\n]*不能替代[^\n]*行为评测/);
});

test("evaluation policy accepts and discloses the v0.1 instruction-enforced isolation fallback", async () => {
  const content = await readFile(new URL("../docs/evaluation.md", import.meta.url), "utf8");

  assert.match(content, /v0\.1 可接受的降级证据标准/);
  assert.match(content, /每次运行使用全新上下文/);
  assert.match(content, /被测 agent 的 prompt 不得包含评分表或旧回答/);
  assert.match(content, /调度指令必须明确限制文件访问/);
  assert.match(content, /不存在操作系统级文件系统隔离证明/);
  assert.match(content, /更强但可选的实现.*独立沙箱或容器/s);
});
