/**
 * turn-domains.mjs — 端侧回合域文本组合单点（批 2026-09-19-upstream-channel-availability ·
 * 设计权威 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.5 L / §6.27.12.12 ④）。
 *
 * 端侧域文本 = **核基座（转口逐字——端侧零自持基座副本）+ 端 overlay（端特有呈递纪律，
 * 端侧自持）**：digest 轮与 ask 唤醒轮共用本组合点——选择仅换基座（轮型 → 模式两级），
 * 端 overlay 恒在场（入参 = 轮型 / 模式旗标，不出基座串 ⇒ 调用方无从绕过 overlay——fail-closed）。
 *
 * 组合形态 = **收尾括号内拼接**：overlay 落于基座正文之后、闭合 `]` 之前（基座以 `]` 收尾
 * ⇒ 去尾插入；为假 ⇒ 尾接退化——端述句恒在场，不静默丢弃）。否决备选：① 括号外尾部追加
 * （overlay 落在 `]` 之外，破 system reminder 括号形态）；② 句内锚点插值（端侧须持基座句串
 * 锚点，而基座文本内容权在核侧——核侧改字面即静默失效）。
 *
 * 核单源守护：本档零核基座文本字面（基座只经 `./setup-reminders.mjs` 的 W15 转口表取）；
 * 端 overlay 住端侧 ⇒ 端特有述句不进核。W8 契约②：核 `agent/helpers.mjs` 已在端壳静态闭包内
 * （经 setup-reminders 转口）⇒ 本档不引新核侧静态边，`node:sqlite` 仍不入端壳静态链。
 */
import { AUTO_TURN_DIGEST_DOMAIN, AUTO_TURN_DIGEST_DOMAIN_ENG, UPSTREAM_TURN_DOMAIN } from "./setup-reminders.mjs"

/** 端 overlay（端特有呈递纪律——逐字搬迁自端侧既有变体的端特有部分：advisor / consult /
 *  escalate 三族呈递规则；零新撰 / 零改写；源 as-of = 原 `thincoder-vscode/src/agent.mjs:29-30`
 *  变体的端特有段，逐字见 §6.27.12.12 ④ 块）。 */
export const VSC_TURN_OVERLAY =
  "(async advisor review reports: present the findings and suggested fixes verbatim — do not apply them; consultation reports: present each reply verbatim with your per-reply adoption judgment as text — do not apply anything; escalate reports: summarize the merged post-op work — further changes need a user message)"

/** 端侧域文本组合（唯一组合点）：两级选择——轮型（`upstreamTurn` 真 ⇒ 唤醒轮基座，否则 digest
 *  轮基座）→ 模式（`engineering` 真 ⇒ digest 轮取工程变体 `AUTO_TURN_DIGEST_DOMAIN_ENG`；变体只挂
 *  digest 基座——唤醒轮与模式无关）；端 overlay 两轮两模式恒在场（差异项 = 0——§6.15.3 单源）。
 *  默认 `engineering = false` ⇒ 既有调用与断言逐字零回归。 */
export function composeTurnDomain(upstreamTurn, engineering = false) {
  const base = upstreamTurn
    ? UPSTREAM_TURN_DOMAIN
    : (engineering ? AUTO_TURN_DIGEST_DOMAIN_ENG : AUTO_TURN_DIGEST_DOMAIN)
  return base.endsWith("]") ? `${base.slice(0, -1)} ${VSC_TURN_OVERLAY}]` : `${base} ${VSC_TURN_OVERLAY}`
}
