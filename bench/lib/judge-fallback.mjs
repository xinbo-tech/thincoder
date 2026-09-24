/**
 * lib/judge-fallback.mjs — 替代判级联与合成裁决（设计 §2.10.1 / §2.10.4 · KD-38）。
 *
 * 拆出于 `judge.mjs`（300 行上限）：本档 = **编排面**（级链推进 / 运行期占用跳过 / 逐位留证 / 合成分），
 * 调用原语（**单级单发** `callSlot` · 提示 / 解析 / 记录形状）仍住 `judge.mjs`（导出复用）。
 *
 * 级链（逐位 · 冻结）：`[原位槽, 池第 1 项, …, 池第 N 项]`（池 = `judge.json.fallbacks` · 级联序 = 池序 ·
 * 池长即级数上限）；**级内单发**——不可解析（含空输出 / `finishReason=length`）或传输面失败 ⇒ 该级失败 ⇒
 * **进下一级**（不设同模型第二发）。得有效判（`pass` / `fail`）即止；级链穷尽 ⇒ 该位 `error`（逐级留证）。
 * 运行期占用跳过：**替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此**（跳过项不入调用记录——级号仍按池项固有记档）。
 * 合成（按级联后的**实际有效判**计）：同向 ⇒ `unanimous`；相异 ⇒ C 触发 · 多数决 ⇒ `arbitrated`；
 * 恰 1 位有效 ⇒ `single`（**单判定判**）；零有效判 / 分歧未决 ⇒ `none` + `error`（物理边界——§2.10.4）。
 */

import { buildJudgeMessages, callSlot, isVerdict } from "./judge.mjs"
import { head } from "./output.mjs"

const REASON_MAX = 300

/** 级链下一级取用（§2.10.1 运行期占用规则）：按池序取首个**未占用**项——跳过本链已用项、原位 A / B / C 三槽身份、
 *  以及他链已认领的池项；跳过项**不入调用记录**（`substitutes` / `calls` 无该项）。`claims` = 逐池项认领位
 *  （index → 位 id；同步检查-置位，事件循环单线程 ⇒ 无撕裂状态）；无可用项 ⇒ `null`（级链穷尽）。 */
function pickLevel({ fallbacks, occupied, claims, used, slotId }) {
  for (const [i, f] of fallbacks.entries()) {
    if (used.has(i) || occupied.has(f.model) || (claims[i] != null && claims[i] !== slotId)) continue
    claims[i] = slotId
    return { item: f, index: i, level: i + 2 } // 级链基址：级 1 = 原位 · 替代级 k（池序第 k 项）⇒ 记档 level = k+1
  }
  return null
}

/** 一位的级链执行（§2.10.1 · 级内单发）：返回该位记录（§2.2-15）
 *  `{ id, verdict, reason, attempts, calls, substitutes? }`——`attempts` = `calls[]` 条数（= 实际发起级数）；
 *  `substitutes[]` 逐项 = 实际启用的替代级（`cause` = 上一级失败摘要 ≤160 字符）；原位全程成功 ⇒ 两键皆不写。 */
export async function callSlotChain({ slot, fallbacks = [], messages, transport, providers, signal, occupied, claims }) {
  const used = new Set()
  const substitutes = []
  const calls = []
  let level = 1
  let current = slot
  for (;;) {
    const r = await callSlot({ slot: current, messages, transport, providers, signal, level })
    calls.push(...r.calls)
    if (isVerdict(r.verdict)) {
      return { id: slot.id, verdict: r.verdict, reason: r.reason, attempts: calls.length, calls, ...(substitutes.length > 0 ? { substitutes } : {}) }
    }
    const next = pickLevel({ fallbacks, occupied, claims, used, slotId: slot.id })
    if (!next) {
      return { id: slot.id, verdict: "error", reason: `${r.reason}（级链穷尽）`, attempts: calls.length, calls, ...(substitutes.length > 0 ? { substitutes } : {}) }
    }
    used.add(next.index)
    substitutes.push({ level: next.level, provider: next.item.provider, model: next.item.model, cause: head(r.reason, 160) })
    current = { ...next.item, id: slot.id } // 级链根位次随行（传输面按链取用；替代级身份只入记录与计价键）
    level = next.level
  }
}

/** 判官对 + 分歧仲裁（§2.10.1 合成规则）：A / B **并行**发起（各自级链独立 · 失败隔离天然）⇒ 同向 `unanimous`；
 *  相异 ⇒ 第三判 C 触发（依赖步）· 多数派 `arbitrated`；恰 1 位有效 ⇒ `single`（单判定判）；零有效判 / 分歧未决
 *  ⇒ `none` + `error`（物理边界）。素材缺失 ⇒ 该位不进级联（换模型不产生素材——§2.10.4 防御分支）。 */
export async function judgeWithPair({ decl, question, material, slots, fallbacks = [], transport, providers, signal }) {
  const turn = decl?.turn ?? null
  if (material == null) {
    return { verdict: "error", resolution: "none", turn, reason: `判官不可用（素材缺失）：回合 ${turn} 不存在（用例声明与实际回合数不符）`, judges: [] }
  }
  const messages = buildJudgeMessages({ question: question ?? decl?.question ?? "", rubric: decl?.rubric ?? "", material })
  const occupied = new Set(slots.map((s) => s.model)) // 原位 A / B / C 三槽身份（运行期占用面）
  const claims = []
  const chain = (slot) => callSlotChain({ slot, fallbacks, messages, transport, providers, signal, occupied, claims })
  const [a, b] = await Promise.all([chain(slots[0]), chain(slots[1])])
  const judges = [a, b]
  if (isVerdict(a.verdict) && isVerdict(b.verdict)) {
    if (a.verdict === b.verdict) return { verdict: a.verdict, resolution: "unanimous", turn, reason: a.reason, judges }
    const c = await chain(slots[2])
    judges.push(c)
    if (!isVerdict(c.verdict)) {
      const why = `A 位裁决 ${a.verdict} · B 位裁决 ${b.verdict} · C 位失败（${c.reason}）`
      return { verdict: "error", resolution: "none", turn, reason: head(`判官不可用（分歧未决）：${why}`, REASON_MAX, true), judges }
    }
    const passVotes = [a, b, c].filter((j) => j.verdict === "pass").length
    return { verdict: passVotes >= 2 ? "pass" : "fail", resolution: "arbitrated", turn, reason: c.reason, judges }
  }
  const only = isVerdict(a.verdict) ? a : isVerdict(b.verdict) ? b : null
  if (only) return { verdict: only.verdict, resolution: "single", turn, reason: only.reason, judges }
  const why = judges.map((j) => `${j.id} 位失败（${j.reason}）`).join(" · ")
  return { verdict: "error", resolution: "none", turn, reason: head(`判官不可用（有效判不足）：${why}`, REASON_MAX, true), judges }
}
