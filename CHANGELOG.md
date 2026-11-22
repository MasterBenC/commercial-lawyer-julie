# Changelog

本文件记录「商业律师 Julie」的版本变更。版本号与 `package.json` 保持一致；未经真实运行的行为评测不得写成通过结论。

## 0.2.0 — 2026-11-02

### 知识库联动重建

- 在可选私有 `personal-kb` 挂载上重建 Julie，新增 `references/kb-mount.md`。
- 主张中国大陆民商法 / 税法黑字规则前，先检索 `01-民商法` / `02-税务` / `03-交汇专题`，并按 `kb` / `verified` / `needs_verification` / `unavailable` 标注来源状态。
- 永不默认加载 `05-客户案例-脱敏`；仅当用户问及高新 / 专精特新 / 单项冠军 / 申报时，可选参考 `miit-qualification-kb`。
- 保留 v0.1 的人格、工作模式、风险分级、模板路由，以及已发布的行为评测报告（v0.2 未重跑该行为套件）。

### 收口整理（2026-11-19）

- 版本对齐：`package.json`（`0.2.0`）、`README.md`、`SKILL.md` 与本文件的版本号与表述统一为 v0.2.0，无遗留旧版本号作为当前版本。
- README 新增「v0.2.0 评测状态」：本地离线校验逐条记录真实运行结果（运行命令、退出码、实际输出要点）；18 次风险分层行为评测明确标注「未重跑 / 待外部 API」，不提供任何 v0.2 行为分数，也不把静态校验写成行为验收。
- README「LexFlow 边界与路线图」改为 v0.2 现状表述：LexFlow 仍非运行时依赖，边界与授权口径不变。
- `references/kb-mount.md` 新增「自建本地知识库最小目录与 `_index.md` 脱敏示例」，外部用户可不依赖任何私有仓库接入自有法务知识库；合规边界保持不变：私有库正文不随 Skill 分发，未挂载时黑字规则一律 `needs_verification`，示例内容脱敏虚构。
- `tests/structure.test.mjs`：修正查找 npm CLI 的兜底路径，使 `node --test tests/*.test.mjs` 在 node 与 npm 未安装于同一目录时也能跑完整套件；断言语义未变。
- `scripts/validate-run-artifacts.mjs`：新增降级路径——`work/`（原始 run artifact）不在发布包内时，不再以 `ENOENT` 崩溃，改为机械校验已提交的归一化索引（18 runs + `run-metadata.schema.json`）并以退出码 0 结束；原始记录齐全的控制器工作区仍走重建索引与 manifest 逐条比对。`tests/run-artifacts.test.mjs` 增加对应测试，套件 52 → 53。

## 0.2.0 — 审查修复（2026-11-22，同版本号内的语义修复）

修正 v0.2.0 审查结论中的知识库联动、安全边界与文档冲突问题；版本号仍为 `0.2.0`，行为评测结论不变（v0.2 仍未重跑）。

### P0 知识库联动

- `references/kb-mount.md`「宿主如何挂载」改为可执行探测：① 宿主 / 对话显式路径（含 `kb.local.md` 本地覆盖）→ ② `<Skill 根>/../personal-kb/_index.md` → ③ `<KB_ROOT>/_index.md`；任一步可读即视为已挂载，全部失败或宿主无读取能力时按未挂载处理，并在输出开头显式注明“本地知识库未挂载或不可读”。
- 删除带日期文件名的硬编码主题表，改为「目录 + 关键词」匹配并要求报告实际读取到的文件名；`deals-contracts.md`、`invoicing-collections.md`、`disputes-evidence.md` 的「知识库路径」统一指向 `kb-mount.md`，消除重复维护。
- 中高风险断网降级写入 `kb-mount.md` 与 `jurisdiction-source-policy.md`：`medium` / `high` 且无法一手核验时不得标 `verified`，只能标 `kb（未经官方核验）` 或 `needs_verification`，并在「是否需要真人律师」显式标注“条文未经官方核验”，不得给确定性法律结论。
- 统一引用格式：`kb` 用单行紧凑格式（`来源状态：kb｜路径#条号｜标题｜文号｜生效日｜核验日`，缺失写 `未载明`，多处引用用“同上（…）”），`verified` 必须 6 个字段齐全，缺一即降级。
- 输出冲突消解：触发律师交接时外层仍按 `output-contract.md` 的 7 个部分输出，`lawyer-handoff.md` 的 10 部分交接包完整嵌入「可以直接使用」小节，不再产生 7 段 vs 10 段的二选一。

### P1 安全与隐私

- `references/privacy-safety.md`：已挂载的知识库文件（含自建库与库内外部抓取文本）纳入不受信任材料，明确防间接提示词注入，命中时输出“库内文本含疑似指令内容，未采纳”。
- `README.md`、`SKILL.md`、`references/` 中的私有仓库名与私有目录名全部替换为 `<KB_ROOT>` 规范，仅保留 `01-民商法` / `02-税务` / `03-交汇专题` 通用示例；`.gitignore` 增加 `kb.local.md` 供个人本地路径覆盖。
- `kb-mount.md` 的 `_index.md` 模板增加 `敏感: 是/否` 字段，敏感目录判定改为依据该元数据（缺失或不可识别时按 `敏感: 是` 保守处理），不再依赖写死的目录名。
- `references/ai-data-ip.md` 的 `verified`（2026-07-29）标注为包内历史核验快照，并新增时效规则：超 6 个月、正式对外使用或疑似修订任一情形自动降级为 `needs_verification`。

### P2 可操作性

- `SKILL.md` frontmatter `description` 删除“在知识库已挂载时，亦可用于一般民商交易审查”，移入正文「能力范围」。
- 材料审查提问节奏：`SKILL.md` 与 `deals-contracts.md` 明确先完成全部可审项，最后再提 1 个最关键问题，不因等待追问中断整份审查。
- `output-contract.md` 明确固定槽位：风险标签与“跨境”标记在 `Julie 的判断` 首行，来源状态紧跟对应引用，合同五字段 JSON 放在 `你现在的风险` 内。
- `risk-policy.md` 为「对业务影响重大的交易」与「复杂跨境事项」各补 4 条可操作判断例子（如交易额 ≥ 年营收 30%、单一客户集中度 > 50%、境外仲裁地、个人信息 / 提示词 / 日志出境）。

### CI 与评测准备

- 新增 `.github/workflows/ci.yml`：`push` 到 `main` 与 `pull_request` 时在 Node 20 / 22 矩阵运行 `node scripts/validate-skill.mjs` 与 `node --test tests/*.test.mjs`，并阻断私有知识库结构回流到公开文档。
- 新增 `tests/kb-boundary.test.mjs`（17 项断言）锁定上述挂载探测、引用格式、断网降级、嵌套输出、注入防护、敏感标记、时效降级、提问节奏与 CI 配置；`scripts/validate-skill.mjs` 增加 `evaluations/v0.2-kb-boundary-regression-cases.json` 的机械校验（8 个用例、`status` 保持 `defined_not_run`、禁止出现分数或通过字段）。套件 53 → 70。
- 新增 `evaluations/v0.2-kb-boundary-regression-cases.md` / `.json`：定义 K01–K08 知识库与边界回归用例，**不含任何模型输出、跑分或结论**；README 同步说明“待执行”，v0.2 行为通过率仍为零证据。
- 保留 `references/privacy-safety.md` 为必读安全基线；`intake-routing.md` 与 `output-contract.md` 暂不整篇中文化，避免破坏既有测试与 v0.1 基线可比性。

## 0.1.0

- 首个风险分层发布版本，附 18 次风险分层行为评测证据（14 个场景 + 4 组关键场景复测）。
