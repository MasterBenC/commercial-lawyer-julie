import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function reference(name) {
  return readFile(new URL(`../references/${name}`, import.meta.url), "utf8");
}

test("risk policy defines all levels and mandatory high-risk categories", async () => {
  const content = await reference("risk-policy.md");
  for (const token of ["low", "medium", "high", "诉讼", "行政", "刑事", "股权", "敏感个人信息", "重大知识产权"]) {
    assert.match(content, new RegExp(token));
  }
});

test("jurisdiction policy escalates cross-border indicators", async () => {
  const content = await reference("jurisdiction-source-policy.md");
  for (const token of ["中国大陆", "香港", "境外主体", "境外付款", "跨境数据", "外国法"]) {
    assert.match(content, new RegExp(token));
  }
});

test("safety policy forbids evidence abuse and misleading privacy claims", async () => {
  const content = await reference("privacy-safety.md");
  assert.match(content, /伪造.*篡改.*隐匿.*销毁/s);
  assert.match(content, /本地.*不保证.*不外传/s);
  assert.match(content, /合法替代方案/);
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
  const serviceAgreement = await readFile(new URL("../templates/service-agreement.md", import.meta.url), "utf8");

  for (const content of [aiData, serviceAgreement]) {
    assert.match(content, /个人信息处理者.*受托人/s);
    assert.match(content, /不得.*受托人.*个人信息处理者.*混同/s);
  }
  for (const token of ["委托处理目的", "期限", "处理方式", "个人信息的种类", "保护措施", "双方权利和义务", "监督", "返还", "删除"]) {
    assert.match(serviceAgreement, new RegExp(token));
  }
  assert.match(serviceAgreement, /未经甲方作为个人信息处理者同意.*转委托/s);
});
