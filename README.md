# 商业律师 Julie

商业律师 Julie 是面向以中国大陆业务为主的 AI 一人公司（AI OPC）的商业法律风险辅助 Skill。它帮助经营者在接洽、报价、签约、履约、变更、验收、收款和争议处理的业务生命周期中，识别下一步需要确认的事实、风险和材料。自 **v0.2.0** 起，Julie 在主张民商法 / 税法黑字规则前，优先检索宿主挂载的私有知识库 [personal-kb](https://github.com/MasterBenC/personal-kb)（本仓库**不附带**该私库正文）；未挂载时仍可工作，但对拟引规则强制 `needs_verification`，不得编造条文。

## v0.2.0 说明（KB 联动重建）

v0.2.0 是知识库挂载与引用策略重建：新增 `references/kb-mount.md`，并在法域政策与交易 / 争议 / 开票模块中写明 `01-民商法` / `02-税务` / `03-交汇专题` 的只读地图。人格、工作模式、风险分级、模板路由与禁止事项保持与 v0.1 一致。

**行为评测证据仍以 v0.1 套件为准**，尚未按 v0.2 提示词重跑；下列报告记录的是 v0.1 风险分层独立评测结果，直至另行重跑并替换。

## v0.1.0 评估状态

风险分层独立评测已接受：18/18 次行为评测 PASS，18/18 次证据在披露的 v0.1 指令约束隔离标准下有效；14/14 个场景和 4/4 组重复关键场景均通过。自动化结构、政策和场景测试也已通过。该证据标准不提供操作系统级隔离证明；这一限制及运行时元数据限制已在报告中披露，不能将指令约束描述为 OS 级沙箱证明。

- [风险分层独立评测报告](evaluations/2026-08-02-risk-tiered-evaluation.md)：记录 v0.1.0 的 18 次评测、14 个场景、4 组关键场景，以及证据限制披露。
- [完整盲测评分报告](evaluations/2026-07-30-commercial-lawyer-julie-blind-evaluation.md)：记录旧提交的行为与证据阻断项。
- [修复后针对性回归报告](evaluations/2026-07-30-targeted-regression-8e6db4.md)：记录新提交的 9/9 定向通过结果。

## 能做什么

Julie 支持三种可切换的工作模式：

- **快速问答**：回答当前业务决策中的聚焦问题。
- **材料审查**：审查合同、报价单、工作说明、沟通记录或证据材料。
- **流程陪跑**：根据交易所处阶段给出下一步的法律与商业行动建议。

它还覆盖交易与合同、AI 数据与知识产权、履约变更验收、开票收款、争议证据和律师交接等模块。输出是风险辅助与文本草案，不会自动向外发送、签署、付款或提交任何材料。在 personal-kb 已挂载时，也可用于一般民商交易审查（仍非律师委托）。

## 与 personal-kb 联动

- 私库：[MasterBenC/personal-kb](https://github.com/MasterBenC/personal-kb)（private）。Julie **不打包、不镜像**其中的法条正文。
- 挂载：设置 `PERSONAL_KB_ROOT`，或将仓库克隆为与本 Skill 同级的 `../personal-kb`，或在宿主中配置绝对路径。细则见 [`references/kb-mount.md`](references/kb-mount.md)。
- 默认只读：`01-民商法/`；涉税商事加读 `02-税务/`；结构 / 家办 / 股权+税交汇加读 `03-交汇专题/`；**永不默认加载** `05-客户案例-脱敏/`。
- 引用状态：`kb`（库内读出）→ 正式对外或中高风险时升级 `verified`（国家法律法规数据库等）；库缺失则 `needs_verification` / `unavailable`。
- 可选二级库：[miit-qualification-kb](https://github.com/MasterBenC/miit-qualification-kb) — 仅当用户询问高新 / 专精特新 / 单项冠军 / 申报时使用，非 Julie 运行依赖。

## 示例

> 我为客户制作 AI 内容服务，客户要求将全部提示词和模型工作流永久转让；报价已确认但尚未签约。请审查风险并给我下一步沟通要点。

Julie 会按“报价 / 签约”阶段检查权利边界、交付物范围、付款条件、客户素材和模型使用安排；若涉及境外主体、外国法、香港、境外付款或跨境数据，会标记为“跨境”并建议进一步核验或律师交接。若已挂载 personal-kb，主张合同编 / 公司法相关规则时会先打开映射路径并标注来源状态。

## 安装

将本目录 `commercial-lawyer-julie` 复制或克隆到宿主应用的 Skill 目录，然后在宿主中启用或调用 `commercial-lawyer-julie`。例如：

```text
<host-skill-directory>/commercial-lawyer-julie/
```

安装后，宿主会读取 `SKILL.md` 并按其中的路由加载相应参考资料和模板。本包不要求运行时依赖或外部服务。若需 KB 优先引用，另将 `personal-kb` 按上一节挂载。

## 本地验证

需要 Node.js 20 或更高版本：

```bash
npm test
npm run validate
npm run eval:prepare
npm run eval:render
npm run eval:manifest
```

`npm test` 运行完整的静态结构、政策内容和场景夹具测试套件；`npm run validate` 检查发布所需文件，并机械校验已提交的 metadata schema、18-run index 和评测报告合计；其余命令分别生成 prompt-only 输入、隔离运行时和 18-run manifest。这组标准命令可在不含 gitignored `work/` 原始运行记录的干净发布包（clean release archive）中执行。静态检查与资产生成不等于完整行为验收。v0.1.0 已按 [风险分层独立评测报告](evaluations/2026-08-02-risk-tiered-evaluation.md) 完成 18/18 行为 PASS、14/14 场景和 4/4 重复关键场景通过；证据有效性仅在披露的指令约束隔离标准下成立，未证明 OS 级隔离。v0.2.0 未重跑该行为套件。

### 评测控制器专用

仅当控制器工作区中的 `work/risk-tiered-evaluation/runs/` 原始 run artifact 全部存在时，才运行：

```bash
npm run eval:validate-runs
```

该命令在评分前重新解析 raw run metadata、核对 manifest 并生成规范化 index；它不是干净发布包的标准本地验证命令。原始回答仍留在 gitignored controller work 目录，不会被复制进发布包。

## 法域、安全与隐私边界

- 中国大陆是默认分析法域和适用法背景，不是对合同适用法律、法院或仲裁地的预设。涉及香港、外国法、境外主体、境外付款或跨境数据时，必须标记“跨境”，从交易事实核验实际安排，并在需要时交接持证律师。
- 不构成律师委托，不替代持证律师正式法律意见、出庭服务或特定结果保证。
- 仅提供完成当前分析所需的事实；上传前请遮盖无关的身份证号码、银行卡号、访问令牌、密钥及其他敏感信息。
- 提交给宿主或模型服务的内容可能依宿主、模型、插件、日志和工具配置而传输或保留。请先核对所用服务的数据处理与保留设置；本地运行也不等于绝不发生外部传输。
- Julie 不协助伪造、篡改、隐匿或销毁证据。

## LexFlow 边界与路线图

v0.1 不需要 LexFlow；Julie 可作为独立 Skill 使用。LexFlow 仅是未来可选的只读项目 / 文档适配器方向，不是运行时依赖，也不会因此自动获得任何用户资料的额外授权。

路线图包括：

- 权威来源更新器；
- LexFlow 只读适配器；
- 更丰富的合同文件包；
- 带日期的情景评估报告；
- personal-kb 同步与正式核验工作流。

## 许可证

本项目采用 [MIT License](LICENSE)。
