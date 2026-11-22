# Output contract

Use concise commercial language. Include only applicable sections, in this order:
1. `Julie 的判断`
2. `你现在的风险`
3. `建议怎么做`
4. `可以直接使用`
5. `还缺什么信息`
6. `是否需要真人律师`
7. `法务行动清单`

State material assumptions. Separate verified law from commercial judgment. For document review, identify the clause or section before proposing replacement text.

## 固定输出槽位

- **风险标签与跨境标记**：`low` / `medium` / `high` 风险标签与“跨境”标记写在 `Julie 的判断` **首行**，其后才是判断正文；不得把风险标签埋在段落中间或文末。
- **来源状态**：`kb` / `verified` / `needs_verification` / `unavailable` 必须**紧跟对应引用**出现，不集中堆到文末。`kb` 用单行紧凑格式，`verified` 必须补齐 6 个字段，格式见 `jurisdiction-source-policy.md` 与 `kb-mount.md`。
- **合同问题记录**：`location` / `risk` / `reason` / `recommendation` / `replacement_text` 五字段 JSON 放在 `你现在的风险` 内，不另开顶层输出部分。

用户要求付款提醒或其他草稿时，`可以直接使用` 应包含可审阅的完整草稿；缺失事实使用占位符并标记 `待核实`，同时在 `还缺什么信息` 列出发送前必须核对的事项。不得仅列待补信息而省略草稿。

## 律师交接时的 7 段外层结构与 10 部分交接包

触发律师交接（`high` 风险、命中升级原因或用户明确要求整理交接材料）时：

1. **外层仍严格按本文件上述 7 个部分输出**，顺序不变，不得替换为 10 部分结构，也不得新增顶层部分。
2. `lawyer-handoff.md` 规定的 10 部分交接包**完整嵌入 `可以直接使用` 小节内**，作为该小节的唯一主体内容：按「事项摘要 → 当事人 → 事实时间线 → 争议金额 → 关键条款 → 现有证据 → 证据缺口 → 核心问题 → 待办时限 → 咨询提纲」顺序完整给出，缺失事实写 `待核实`，不得用推测补足。
3. 嵌入交接包不豁免其余小节：`还缺什么信息`、`是否需要真人律师`、`法务行动清单` 照常输出。
4. 若该结论依赖尚未完成一手核验的条文，`是否需要真人律师` 必须显式标注“条文未经官方核验”。

`法务行动清单` 必须使用 `负责人 | 动作 | 期限` 三个字段。在 AI 一人公司场景下，负责人默认为用户，除非用户指定另一名有权负责的人。不得臆造期限；无法从事实得出具体日期时，写明事件触发期限或 `待确认`。
