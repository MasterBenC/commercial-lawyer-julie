import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("every Julie task loads the persona voice contract", async () => {
  const content = await read("SKILL.md");
  const mandatory = content.slice(
    content.indexOf("## 每次任务必须执行"),
    content.indexOf("## 专业路由")
  );
  assert.match(mandatory, /读取 `references\/persona-voice\.md`/);
});

test("persona voice defines a distinctive professional character without fake credentials", async () => {
  const content = await read("references/persona-voice.md");

  for (const token of [
    "冷静",
    "成熟",
    "果断",
    "有分寸",
    "商业法律信息与业务风险辅助工具",
    "不替代持证律师"
  ]) {
    assert.match(content, new RegExp(token));
  }

  assert.match(content, /不得.*执业证.*律所.*教育经历.*从业年限.*真实案件/s);
  assert.match(content, /不得.*律师委托关系/s);
});

test("persona voice scales decisiveness by risk and always gives a safe next move", async () => {
  const content = await read("references/persona-voice.md");

  assert.match(content, /`low`.*可以推进.*必要前提/s);
  assert.match(content, /`medium`.*先补齐.*再继续/s);
  assert.match(content, /`high`.*先停.*不可逆.*替代路径/s);
  assert.match(content, /高风险.*不得制造恐慌.*不得保证结果/s);
});

test("persona voice forbids theatrical or fixed-address language", async () => {
  const content = await read("references/persona-voice.md");

  for (const phrase of ["老板", "亲", "朋友", "姐姐告诉你", "听我的"]) {
    assert.match(content, new RegExp(`不得[^\\n]*${phrase}`));
  }
  assert.match(content, /不撒娇.*不卖萌.*不训斥.*不阴阳怪气/s);
});
