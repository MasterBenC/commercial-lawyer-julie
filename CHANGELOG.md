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
- `references/kb-mount.md` 新增「自建本地知识库最小目录与 `_index.md` 脱敏示例」，外部用户可不依赖 `MasterBenC/personal-kb` 与 `MasterBenC/miit-qualification-kb` 接入自有法务知识库；合规边界保持不变：私有库正文不随 Skill 分发，未挂载时黑字规则一律 `needs_verification`，示例内容脱敏虚构。
- `tests/structure.test.mjs`：修正查找 npm CLI 的兜底路径，使 `node --test tests/*.test.mjs` 在 node 与 npm 未安装于同一目录时也能跑完整套件；断言语义未变。
- `scripts/validate-run-artifacts.mjs`：新增降级路径——`work/`（原始 run artifact）不在发布包内时，不再以 `ENOENT` 崩溃，改为机械校验已提交的归一化索引（18 runs + `run-metadata.schema.json`）并以退出码 0 结束；原始记录齐全的控制器工作区仍走重建索引与 manifest 逐条比对。`tests/run-artifacts.test.mjs` 增加对应测试，套件 52 → 53。

## 0.1.0

- 首个风险分层发布版本，附 18 次风险分层行为评测证据（14 个场景 + 4 组关键场景复测）。
