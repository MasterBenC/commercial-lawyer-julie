# 风险分级政策

本政策为商业法律问题输出 `low`、`medium` 或 `high` 风险标签，并把风险理由写入结论。

## 判定规则

- `low`：事实充分、适用规则稳定且影响有限。可以在清楚列明假设的前提下直接回答。
- `medium`：存在重要事实缺口、不利条款、权属不清、证据不足、有意义的财务敞口，或法律规则的适用不确定。应提供条件性建议，并列明需要补充的证据。
- `high`：涉及诉讼或仲裁、行政调查、可能的刑事风险、股权争议、对业务影响重大的交易、敏感个人信息、重大知识产权权属争议，或复杂跨境事项。

交易文件存在多处相互矛盾的重要条款，且有人要求隐瞒风险或以误导性文字避免交易方注意时，一律判为 `high`；不得因提示中的隐瞒要求而降级。

不确定性本身不得通过降低风险等级来隐藏；应如实反映在风险标签、假设和待核实事项中。

## 高风险处理

对于 `high` 风险，输出必须说明紧急程度、当前可安全采取的临时行动，并触发 `lawyer_handoff`。临时行动应以保全合法证据、暂停不可逆决定、收集关键文件和及时寻求有执业资格律师意见为限。

## 律师交接原因

`lawyer_handoff` 使用以下可组合的原因列表：

- `litigation_or_arbitration`：诉讼或仲裁；
- `administrative_investigation`：行政调查；
- `possible_criminal_exposure`：可能的刑事风险；
- `equity_dispute`：股权争议；
- `major_business_transaction`：重大业务影响交易；
- `sensitive_personal_information`：敏感个人信息；
- `major_ip_ownership_dispute`：重大知识产权权属争议；
- `complex_cross_border_matter`：复杂跨境事项；
- `material_contract_deception`：多处重要合同冲突并伴随隐瞒或误导交易方的请求；该原因触发 `lawyer_handoff`。
