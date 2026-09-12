# Design Token 硬化 — 需求（VS Code 扩展）

> 归位注记：本档自 `docs/design/ENG-TOKEN-BINDING-REQUIREMENTS.md` 归位入 `docs/requirements/`（文档体系各仓自持批 LEDGER-SELF-CONTAINED——纯需求档去 `-REQUIREMENTS` 后缀；对应 `-TUNING.md` 留 `docs/design/` 作设计档）。
> 状态：**已实现**（v2 收窄 + R16 TTL 生命周期修订——2026-08-25 / 2026-09-06 分阶段落地）。
> 关联：`docs/design/ENG-TOKEN-BINDING-TUNING.md`（设计）、`docs/design/README.md`（文档地图）。
> 设计语义（2026-09-06 用户裁定，权威见 TUNING.md）：designToken 是**流程凭证**（防 agent
> 跳过评审步骤），**非密码学安全边界**——HMAC/加密因子已删，**token 无签名**（格式 =
> `uuid:expiresAt`，只有格式校验 + TTL）；token **跨模式存活**（ON→OFF 不清 / OFF→ON 不重评），
> **仅 TTL 过期清**（三时机：恢复过滤 / 开模式清过期 / spawn 门禁拒删槽）；slot 持久化 =
> **跨重启/跨模式恢复的有意载体**（不得造成内存/文件双源不一致）。

## 1. 总体目标

修复 design token 现存的真 bug/安全漏洞，并把 TTL 从 1h 放宽到 7 天（可配置）——分批落地
不再被时间窗打断。**不做内容绑定**（token 有效性绑定设计文档 hash + 映射化方案——用户实况
否决：批次间文档必然变更，内容绑定会把"偶尔重评"变成"每批必重评"）。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 分批落地不被 1h TTL 打断 | TTL 默认 7 天；`agent.engTokenTtlMs` 可配（`Number.isFinite` 且 `>0`，非法回退默认——照抄 advisor timeoutMs 口径） |
| FR2 | 畸形/伪造 token 一律拒绝 | fail-closed：格式校验（`uuid:expiresAt`，段数≠2 / uuid 非法 / expiresAt 非数值）或过期 → 拒 |
| FR3 | 有效 token 跨模式存活，评审贵产物不因开关/重启重复烧（R16） | ON→OFF 不清；OFF→ON 不重评（TTL 内）；仅过期清 |
| FR4 | 过期 token 有明确清理时机（R16） | 三时机：恢复过滤 / eng enter 清过期 / spawn 门禁拒时删该 designId 槽 |
| FR5 | slot 持久化不造成双源不一致 | 会话 slot = 权威持久源；内存 = 运行态；重启/恢复按 TTL 过滤读回（单一数据源语义） |
| FR6 | token 在评审通过后才签发（入槽） | token 于评审前生成并注入评审 prompt（供 advisor 回显）；advisor 仅通过时回显（echo）——回显匹配才入槽签发，以代码判定为准；非 echo → 剥离返回 findings，不占槽 |
| FR7 | 评审错误/中断不连坐作废 | 作废仅在"完整评审结束且未通过"触发（error 回包/abort/轮次耗尽豁免；`result===null` 守卫保留） |

## 3. 非功能标准（Non-functional）

| # | 标准 |
|---|---|
| N1 | 签名是一致性保障非密码学边界——**无签名**（token 格式 = `uuid:expiresAt`，只有格式校验 + TTL）——格式校验是防伪造层（HMAC 防伪层已删） |
| N2 | 两端 lockstep，逻辑同构（VSC 端 slot 持久化经 session-io / `setSlotEngDesignTokens` 多槽写，不照抄 CLI persistState 单源面） |
| N3 | 存量兼容：现有合法格式 token（`uuid:expiresAt`）行为不变，仅 TTL 语义变化 |
| N4 | 防误用纪律：不加 HMAC / 内容绑定（明确不做，勿重试） |

## 变更记录

- 2026-08-25：v2 立项（安全修复 + TTL 放宽收窄）。v1「内容绑定」方案经三轮会诊后被用户实况
  否决——v1 全文及会诊记录见 git 历史。
- 2026-09-06：R16 修订——token 生命周期从"工程模式内凭证（开关即死/不得持久化）"改为
  "评审通过凭证（跨模式存活 + slot 持久化载体 + 仅 TTL 过期清）"。HMAC 防伪层删除
  （design-token 无签名）。
- 2026-09-08：本文档重写为人类可读当前态（折叠逐轮评审流水；漂移修正——旧 v2 HMAC 语义
  更新为现行 R16 无签名语义，活约束照抄，语义未变）。
