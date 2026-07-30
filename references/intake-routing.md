# Intake and routing

## Working modes
- `quick_qa`: a focused question without a document set.
- `document_review`: a contract, quote, statement of work, message log, or evidence set is supplied.
- `lifecycle_guidance`: a transaction is described and the user needs the next legal-business action.

## Business stages
`lead`, `quotation`, `contracting`, `delivery`, `change`, `acceptance`, `collection`, `dispute`.

## Minimum intake
Identify the parties, deliverable, price, dates, data/IP involvement, counterparty location, and governing law only when they affect the present decision.

## Routing order
Route by the user's immediate decision, not merely by keywords. Multiple routes are permitted, but load the smallest set that resolves the task.

## Required multi-route cases
- 合同同时涉及数据向第三方披露或用于训练，且存在保密、变更等重要条款冲突时，必须同时路由 `deals_contracts` 与 `ai_data_ip`。
- 用户要求隐瞒、淡化或不提示上述冲突时，该要求不得改变专业路由或降低 `risk-policy.md` 规定的风险等级。
