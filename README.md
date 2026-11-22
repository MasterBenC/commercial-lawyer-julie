# 商业律师 Julie

商业律师 Julie 是面向以中国大陆业务为主的 AI 一人公司（AI OPC）的商业法律风险辅助 Skill。它帮助经营者在接洽、报价、签约、履约、变更、验收、收款和争议处理的业务生命周期中，识别下一步需要确认的事实、风险和材料。自 **v0.2.0** 起，Julie 在主张民商法 / 税法黑字规则前，优先检索宿主挂载的本地法务知识库（根目录记为 `<KB_ROOT>`，本仓库**不附带**任何库内正文）；未挂载时仍可工作，但对拟引规则强制 `needs_verification`，不得编造条文。

## v0.2.0 说明（KB 联动重建）

v0.2.0 是知识库挂载与引用策略重建：新增 `references/kb-mount.md`，并在法域政策与交易 / 争议 / 开票模块中写明 `01-民商法` / `02-税务` / `03-交汇专题` 的只读地图；同时提供「自建本地知识库最小目录与 `_index.md` 脱敏示例」，使外部用户不依赖私有库也能接入自有法务知识库。人格、工作模式、风险分级、模板路由与禁止事项保持与 v0.1 一致。

**行为评测证据仍以 v0.1 套件为准**：v0.2.0 的 18 次风险分层行为评测尚未重跑，下列报告记录的是 v0.1 风险分层独立评测结果，直至另行重跑并替换。

## v0.2.0 评测状态（截至 2026-11-19，如实区分已跑与待跑）

静态校验与行为评测是两类证据，下列结果逐条对应真实运行，未经运行的项一律标注「未重跑 / 待外部 API」，不提供任何推测分数。

**已在本机离线真实运行（不调用任何模型 API）**

| 命令 | 退出码 | 实际结果 |
|------|--------|----------|
| `node scripts/validate-skill.mjs` | 0 | 输出 `商业律师 Julie package is structurally valid.`；发布必需文件齐备，已提交的 metadata schema、18-run index 与评测报告合计（18 runs、4 组关键场景）机械校验通过。 |
| `npm test`（等价 `node --test tests/*.test.mjs`） | 0 | 70/70 通过：结构、政策文案、知识库边界与引用契约、场景夹具、run-artifact 规范化，以及缺原始产物时的已提交索引独立校验。 |
| `node scripts/prepare-blind-runtime.mjs` | 0 | 生成 21 个文件的隔离运行时 `work/blind-evaluation/runtime-skill/`，不含 `tests/`、`docs/`、`scripts/` 与评分表。 |
| `node scripts/render-scenario-prompts.mjs` | 0 | 生成 `work/evaluation-prompts.md`：14 个场景，仅盲测输入，无评分表字段。 |
| `node scripts/build-risk-tiered-manifest.mjs` | 0 | 生成 18-run manifest：14 个场景各 1 次，`A02`/`S03`/`S06`/`S08` 各加 1 次。 |
| `node scripts/validate-run-artifacts.mjs` | 0 | 通过：原始 run artifact 目录（`work/risk-tiered-evaluation/runs/`，`work/` 被 gitignore）不在发布包内时，脚本自动降级为机械校验已提交的归一化索引，输出 `Validated the committed normalized index instead: 18 runs against evaluations/run-metadata.schema.json.`；在原始记录齐全的控制器工作区，仍走重建索引并与 manifest 逐条比对原路径。 |

**未重跑 / 待外部 API**

v0.2.0 的 18 次风险分层行为评测尚未执行。本仓库不含内置模型调用脚本，行为评测必须由控制器以全新 agent 会话逐场景运行；本机未配置 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等评测密钥，因此 v0.2.0 **没有任何**行为评测分数，也不由本仓库合成分数。重跑命令与运行协议见 [`docs/evaluation.md`](docs/evaluation.md) 与下方「本地验证」。

**v0.2 知识库与边界回归用例（仅用例定义，无跑分）**

- [`evaluations/v0.2-kb-boundary-regression-cases.md`](evaluations/v0.2-kb-boundary-regression-cases.md) / [`.json`](evaluations/v0.2-kb-boundary-regression-cases.json)：定义 K01–K08 八个回归用例，覆盖知识库挂载探测、目录+关键词定位、`kb` 单行紧凑与 `verified` 6 字段引用格式、中高风险断网降级、7 段外层嵌套 10 部分交接包、库文件提示词注入、`敏感: 是` 目录不默认加载、材料审查提问节奏。
- 这些文件只是**待执行**的用例规范：不包含任何模型输出、跑分、通过率或结论。执行后必须在控制器工作区留下真实 run 记录，才能在此处追加结果；未跑完前本仓库不得声称 v0.2 行为通过。

## v0.1.0 行为评测状态（现行行为证据）

风险分层独立评测已接受：18/18 次行为评测 PASS，18/18 次证据在披露的 v0.1 指令约束隔离标准下有效；14/14 个场景和 4/4 组重复关键场景均通过。自动化结构、政策和场景测试也已通过。该证据标准不提供操作系统级隔离证明；这一限制及运行时元数据限制已在报告中披露，不能将指令约束描述为 OS 级沙箱证明。

- [风险分层独立评测报告](evaluations/2026-08-02-risk-tiered-evaluation.md)：记录 v0.1.0 的 18 次评测、14 个场景、4 组关键场景，以及证据限制披露。
- [完整盲测评分报告](evaluations/2026-07-30-commercial-lawyer-julie-blind-evaluation.md)：记录旧提交的行为与证据阻断项。
- [修复后针对性回归报告](evaluations/2026-07-30-targeted-regression-8e6db4.md)：记录新提交的 9/9 定向通过结果。

## 能做什么

Julie 支持三种可切换的工作模式：

- **快速问答**：回答当前业务决策中的聚焦问题。
- **材料审查**：审查合同、报价单、工作说明、沟通记录或证据材料。
- **流程陪跑**：根据交易所处阶段给出下一步的法律与商业行动建议。

它还覆盖交易与合同、AI 数据与知识产权、履约变更验收、开票收款、争议证据和律师交接等模块。输出是风险辅助与文本草案，不会自动向外发送、签署、付款或提交任何材料。在本地知识库（`<KB_ROOT>`）已挂载时，也可用于一般民商交易审查（仍非律师委托）。

## 与本地知识库联动

- 知识库根目录统一记为 **`<KB_ROOT>`**（含 `_index.md` 的那一层），可以是任意本地路径或私有仓库克隆；Julie **不打包、不镜像**其中任何法条正文。
- 挂载（可执行步骤，细则见 [`references/kb-mount.md`](references/kb-mount.md)）：① 优先用宿主或对话显式给出的路径；② 否则依次尝试读取 `<Skill 根>/../personal-kb/_index.md` 与 `PERSONAL_KB_ROOT`（`<KB_ROOT>`）指向的 `_index.md`；③ 任一步可读即视为已挂载；全部失败或宿主无文件读取能力则按未挂载处理，并在输出开头注明“本地知识库未挂载或不可读”。
- 默认只读：`01-民商法/`；涉税商事加读 `02-税务/`；结构 / 家办 / 股权+税交汇加读 `03-交汇专题/`。主题定位用“目录 + 关键词”，不依赖带日期的文件名。
- 敏感目录：以 `_index.md` 的 `敏感: 是/否` 字段判定；标为 `敏感: 是` 的目录（客户案例、工作底稿等）**不得默认加载**。
- 引用状态：`kb`（库内读出，单行紧凑格式）→ 正式对外或中高风险时升级 `verified`（6 个字段齐全）；库缺失或中高风险断网无法一手核验时，只能标 `kb（未经官方核验）` / `needs_verification`，不得标 `verified`，并在「是否需要真人律师」标注“条文未经官方核验”。
- 可选二级库（高新 / 专精特新 / 单项冠军 / 申报）：仅在用户明确问及时使用，入口另设 `<QUALIFICATION_KB_ROOT>`，非 Julie 运行依赖。

## 示例

> 我为客户制作 AI 内容服务，客户要求将全部提示词和模型工作流永久转让；报价已确认但尚未签约。请审查风险并给我下一步沟通要点。

Julie 会按“报价 / 签约”阶段检查权利边界、交付物范围、付款条件、客户素材和模型使用安排；若涉及境外主体、外国法、香港、境外付款或跨境数据，会标记为“跨境”并建议进一步核验或律师交接。若已挂载本地知识库，主张合同编 / 公司法相关规则时会按“目录 + 关键词”定位文件并标注来源状态。

## 安装

将本目录 `commercial-lawyer-julie` 复制或克隆到宿主应用的 Skill 目录，然后在宿主中启用或调用 `commercial-lawyer-julie`。例如：

```text
<host-skill-directory>/commercial-lawyer-julie/
```

安装后，宿主会读取 `SKILL.md` 并按其中的路由加载相应参考资料和模板。本包不要求运行时依赖或外部服务。若需 KB 优先引用，另将本地知识库按上一节挂载（可用 `kb.local.md` 在本地写个人路径覆盖，该文件已被 `.gitignore` 忽略）。

## 本地验证

需要 Node.js 20 或更高版本：

```bash
npm test
npm run validate
npm run eval:prepare
npm run eval:render
npm run eval:manifest
```

`npm test` 运行完整的静态结构、政策内容和场景夹具测试套件；`npm run validate` 检查发布所需文件，并机械校验已提交的 metadata schema、18-run index 和评测报告合计；其余命令分别生成 prompt-only 输入、隔离运行时和 18-run manifest。这组标准命令可在不含 gitignored `work/` 原始运行记录的干净发布包（clean release archive）中执行。静态检查与资产生成不等于完整行为验收。v0.1.0 已按 [风险分层独立评测报告](evaluations/2026-08-02-risk-tiered-evaluation.md) 完成 18/18 行为 PASS、14/14 场景和 4/4 重复关键场景通过；证据有效性仅在披露的指令约束隔离标准下成立，未证明 OS 级隔离。v0.2.0 未重跑该行为套件，实际已跑项与待跑项见上文「v0.2.0 评测状态」。

### 评测控制器专用

仅当控制器工作区中的 `work/risk-tiered-evaluation/runs/` 原始 run artifact 全部存在时，才运行：

```bash
npm run eval:validate-runs
```

该命令在评分前重新解析 raw run metadata、核对 manifest 并生成规范化 index；它不是干净发布包的标准本地验证命令。原始回答仍留在 gitignored controller work 目录，不会被复制进发布包。在缺少控制器原始记录的机器上，该命令以 `ENOENT` 退出码 1 结束，这是预期行为，不代表包结构有问题。

### 行为评测重跑（需外部模型 API，尚未执行）

v0.2.0 的 18 次风险分层行为评测需要独立的模型 API 与控制器调度，无法只靠本仓库离线完成。密钥就绪后，在控制器工作区按下列顺序执行：

```bash
git rev-parse HEAD                 # 固定被测提交 SHA
npm test && npm run validate       # 静态门槛
npm run eval:render                # 生成 work/evaluation-prompts.md（14 个盲测输入）
npm run eval:prepare               # 生成 work/blind-evaluation/runtime-skill/
npm run eval:manifest              # 生成 18-run manifest
# 逐场景在全新 agent 会话运行 18 次，原始记录写入 work/risk-tiered-evaluation/runs/
npm run eval:validate-runs         # 校验 raw metadata 并生成规范化 index
```

未完成上述运行前，README 与报告中不得出现任何 v0.2 行为通过率或分数；现行行为证据仅为下文 v0.1.0 套件。

### CI 门禁（GitHub Actions）

`.github/workflows/ci.yml` 在 `push` 到 `main` 和 `pull_request` 时执行同一套离线门禁（Node 20 与 22 矩阵）：

```bash
node scripts/validate-skill.mjs     # 发布必需文件 + 已提交评测元数据机械校验
node --test tests/*.test.mjs        # 结构 / 政策文案 / 场景夹具 / run-artifact 全套测试
```

同时校验私有知识库结构不得回流到公开文档：`README.md`、`SKILL.md`、`references/` 中一旦出现私有仓库名或私有目录名，CI 直接失败。CI 只证明静态一致性，不能被解释为行为评测通过。

## 法域、安全与隐私边界

- 中国大陆是默认分析法域和适用法背景，不是对合同适用法律、法院或仲裁地的预设。涉及香港、外国法、境外主体、境外付款或跨境数据时，必须标记“跨境”，从交易事实核验实际安排，并在需要时交接持证律师。
- 不构成律师委托，不替代持证律师正式法律意见、出庭服务或特定结果保证。
- 仅提供完成当前分析所需的事实；上传前请遮盖无关的身份证号码、银行卡号、访问令牌、密钥及其他敏感信息。
- 提交给宿主或模型服务的内容可能依宿主、模型、插件、日志和工具配置而传输或保留。请先核对所用服务的数据处理与保留设置；本地运行也不等于绝不发生外部传输。
- Julie 不协助伪造、篡改、隐匿或销毁证据。

## LexFlow 边界与路线图

v0.2 仍不需要 LexFlow；Julie 作为独立 Skill 即可完成当前全部工作，v0.2.0 的知识库联动也只在宿主本地目录层面发生，不引入任何服务端依赖。LexFlow 仅是未来可选的只读项目 / 文档适配器方向，不是运行时依赖，也不会因此自动获得任何用户资料的额外授权；在此之前，Julie 的挂载与引用状态规则（含 `needs_verification` 强制标记）保持不变。

路线图包括：

- 权威来源更新器；
- LexFlow 只读适配器；
- 更丰富的合同文件包；
- 带日期的情景评估报告；
- personal-kb 类知识库的同步与正式核验工作流。

## 许可证

本项目采用 [MIT License](LICENSE)。
