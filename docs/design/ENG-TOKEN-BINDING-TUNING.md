# Design Token 硬化 — 设计（CLI）

> 状态：待实施（2026-08-25，v2 范围收窄）
> **Superseded 考古**：本文件 v1 是"内容绑定"方案（token 有效性绑定设计文档 hash + 7 天 TTL + 映射化），经三轮会诊打磨后被用户实况否决——工程模式每轮开发都有文档缺口要补正，批次间文档必然变更，内容绑定会把"偶尔重评"变成"每批必重评"（收益反转）。v1 全文及三轮会诊记录见 git 历史。v2 只保留与文档变更无关的安全修复 + TTL 放宽。

## 1. 改动清单（两端同构，除标注外）

| # | 文件 | 改动 |
|---|---|---|
| 1 | src/agent-tools/advisor.mjs | ① TTL 常量 3600000 → 7 天默认，运行期读 agent.config.agent.engTokenTtlMs（校验同 timeoutMs 先例）；② 删 :30-33 段数!=3 放行与 :39-42 isNaN 放行两个后门，改四分支 fail-closed（过期文案含 "design token expired, re-run advisor(type='design')"）；③ token 生成挪进 pass 分支（不再预嵌 prompt——pass 后在返回文本追加 token 行，签发以代码判定为准，prompt echo 要求是评审者输出纪律）；④ 作废收窄：error 回包（以 "Advisor:" 开头，现有错误回包约定）不作废，仅完整评审未通过作废；result===null 守卫保留 |
| 2 | src/agent-tools/eng.mjs（两端） | enter 幂等：已是 engineering 时 return "Engineering mode already active."（不清 token）；off→on 清空保留 |
| 3 | vscode src/extension/panel-session.mjs:73 | engDesignToken 行改键存在性判断（"engDesignToken" in extra ? extra.engDesignToken : existing.engDesignToken ?? null）——显式 null 不再被 ?? 跳过 |
| 4 | test/advisor.test.mjs（两端） | ① TTL 内 mock 过 1h+ 验证有效；② 过 7 天拒（文案）；③ 段数/NaN/错签名拒；④ ttlMs 非法回退；⑤ error 回包不作废、完整失败作废 |
| 5 | test/subagent.test.mjs（两端） | 合法过 / 过期拒（文案区分） |
| 6 | vscode test/chat-panel.test.mjs | 复活回归：eng(exit) → saveSession → loadSession → token 仍 null（现码必红，修复后绿） |

## 2. 明确不做（v1 考古，勿重试）

内容绑定全套（normalizeForHash/头部簿记剥离/hashDocuments/docKey 映射/交集作废/路径归一化）——用户实况否决（批次间文档必然变更）。TOKEN_SECRET 随机化、eng(enter) 用户同意门仍留 TODO。

## 3. 验收标准

| AC | 标准 |
|---|---|
| AC1 | mock 时钟过 1h/3 天、未过 7 天 → token 有效（原始痛点） |
| AC2 | 过 7 天 → 拒，文案含 design token expired |
| AC3 | "abc:notanumber:x"（NaN 后门）/ 4 段 / 错签名 → 拒 |
| AC4 | engTokenTtlMs 0/-1/"abc" → 回退 7 天默认 |
| AC5 | error 回包 → token 存活；完整失败评审 → 作废 |
| AC6 | engineering 已 on 再 enter → token 不清 |
| AC7 | vscode exit→save→load → token 为 null（复活回归） |
| AC8 | 两端全套测试通过 |
