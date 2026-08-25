# Design Token 硬化 — 需求（CLI）

> 状态：待实施（2026-08-25，v2 范围收窄）
> **Superseded 考古**：本文件 v1 是"内容绑定"方案（token 有效性绑定设计文档 hash + 7 天 TTL + 映射化），经三轮会诊打磨后被用户实况否决——工程模式每轮开发都有文档缺口要补正，批次间文档必然变更，内容绑定会把"偶尔重评"变成"每批必重评"（收益反转）。v1 全文及三轮会诊记录见 git 历史。v2 只保留与文档变更无关的安全修复 + TTL 放宽。

## 1. 总体目标

修复 design token 现存的真 bug/安全漏洞，并把 TTL 从 1h 放宽到 7 天（可配置）——分批落地不再被时间窗打断。不做内容绑定（见头部考古）。

## 2. 功能用户故事

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 分批落地不被 1h TTL 打断 | TTL 默认 7 天；agent.engTokenTtlMs 可配（Number.isFinite 且 >0，非法回退默认——照抄 advisor timeoutMs 先例） |
| FR2 | 畸形/伪造 token 一律拒绝 | 删两个 fail-open 后门（parts.length!==3 放行、isNaN(expiresAt) 放行）——四分支 fail-closed：段数不等于 3 / NaN expiry / 签名不符 / 过期 |
| FR3 | eng(exit) 清空后持久化不复活旧 token（vscode） | panel-session.mjs:73 的 extra.x ?? existing.x 改键存在性判断 |
| FR4 | token 在评审通过后才生成 | 生成调用从评审前（advisor.mjs:133）挪进 pass 分支 |
| FR5 | 工程 mode 重进不误杀有效 token | eng(enter) 幂等化：仅 off→on 迁移清 token |
| FR6 | 评审错误/中断不连坐作废 | 作废仅在"完整评审结束且未通过"触发（error 回包/abort/轮次耗尽豁免；result===null 守卫保留） |

## 3. 非功能

| # | 标准 |
|---|---|
| N1 | 签名是一致性保障非密码学边界（TOKEN_SECRET 硬编码默认值）——服务端相等性比对是防伪造层 |
| N2 | 两端 lockstep，逻辑同构（vscode eng.mjs 持久化走 persistRaw，不照抄 CLI persistState） |
| N3 | 存量兼容：现有合法格式 token（uuid:expiresAt:sig）行为不变，仅 TTL 语义变化 |
