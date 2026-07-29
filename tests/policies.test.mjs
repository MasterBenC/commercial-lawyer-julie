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
