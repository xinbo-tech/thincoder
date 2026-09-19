/**
 * wait-status.test.mjs — `onWait` 相位 → 文案单源判据全枚举（CORE-DEFECT-FIXES 批 1 ·
 * F-PV1 · 批档 §五 V5）。
 *
 * 断言对象 = 核单源的**可观察输出**（`waitStatusOf` 映射结果 / `waitStatusText` 文案）——
 * 五相全覆盖 + 不显示三边界（`warn` / 未知相位 / 秒缺失）+ 单源不变量（文案 = 核 i18n
 * `status.*` 逐字同）+ quota 不双前缀 + 全输出零 `undefined` 子串。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { t } from "../i18n.mjs"
import { waitStatusOf, waitStatusText } from "../provider/wait-status.mjs"

// 五相发射面实况（payload 形状逐字取自发射点）：
// gate/retry/overloaded = { phase, seconds }（rate.mjs:144 · retry.mjs:68 · core.mjs:235）
// warn/quota = { phase, message }（rate.mjs:96,110 · retry.mjs:60）
const GATE = { phase: "gate", seconds: 7 }
const RETRY = { phase: "retry", seconds: 3 }
const OVERLOADED = { phase: "overloaded", seconds: 3 }
const WARN = { phase: "warn", message: "estimated 5000 tokens > tpm 1000 — request proceeds and may hit a server 429" }
const QUOTA_PREFIXED = { phase: "quota", message: "quota exhausted: insufficient_quota" }
const QUOTA_BARE = { phase: "quota", message: "insufficient_quota" }

test("V5① 五相映射：kind 词表与载荷字段（VSC 面 statusTextPayload 同名）", () => {
  assert.deepEqual(waitStatusOf(GATE), { kind: "rateWait", seconds: 7 })
  assert.deepEqual(waitStatusOf(RETRY), { kind: "rateLimited", seconds: 3 })
  assert.deepEqual(waitStatusOf(OVERLOADED), { kind: "overloaded", seconds: 3 })
  assert.deepEqual(waitStatusOf(QUOTA_PREFIXED), { kind: "quota", message: "insufficient_quota" })
  assert.deepEqual(waitStatusOf(QUOTA_BARE), { kind: "quota", message: "insufficient_quota" })
})

test("V5② warn / 未知相位 / 秒缺失 / 无可渲染载荷 ⇒ null（不显示·不落兜底误标）", () => {
  assert.equal(waitStatusOf(WARN), null)
  assert.equal(waitStatusText(WARN), null)
  assert.equal(waitStatusText({ phase: "zzz" }), null)
  assert.equal(waitStatusText({ phase: "retry" }), null, "秒缺失不得虚构数值")
  assert.equal(waitStatusText({ phase: "gate", seconds: null }), null)
  assert.equal(waitStatusText({ phase: "overloaded", seconds: Number.NaN }), null)
  assert.equal(waitStatusText({ phase: "quota" }), null, "message 缺失 ⇒ 无可渲染载荷")
  assert.equal(waitStatusText({ phase: "quota", message: "   " }), null)
  assert.equal(waitStatusText(undefined), null)
})

test("V5③ 四可显示相文案：与核 i18n status.* en 值逐字一致（单源不变量）", () => {
  for (const [ev, kind] of [[GATE, "rateWait"], [RETRY, "rateLimited"], [OVERLOADED, "overloaded"]]) {
    const m = waitStatusOf(ev)
    assert.equal(waitStatusText(ev), t("status." + kind, { s: m.seconds }), `${kind} 文案 = 核 i18n 单源`)
  }
  assert.equal(waitStatusText(QUOTA_BARE), t("status.quota", { msg: "insufficient_quota" }))
  assert.equal(waitStatusText(GATE), "TPM throttle wait ~7s")
  assert.equal(waitStatusText(RETRY), "Rate-limited 429, retry in 3s")
  assert.equal(waitStatusText(OVERLOADED), "Server overloaded, retrying in 3s")
})

test("V5④ quota 相：剥发射回显前缀一次——前缀形态与裸 message 同结果（不双前缀）", () => {
  assert.equal(waitStatusText(QUOTA_PREFIXED), "quota exhausted: insufficient_quota")
  assert.equal(waitStatusText(QUOTA_BARE), "quota exhausted: insufficient_quota")
  assert.equal(waitStatusText(QUOTA_PREFIXED), waitStatusText(QUOTA_BARE))
  // 双重回显（异常载荷）也只剥一次——不吞正文：结果仍含一段前缀。
  assert.equal(waitStatusText({ phase: "quota", message: "quota exhausted: quota exhausted: x" }), "quota exhausted: quota exhausted: x")
})

test("V5⑤ overloaded 不得落 429 文案 · 全相输出零 undefined 子串 · locale 透传", () => {
  const outs = [GATE, RETRY, OVERLOADED, QUOTA_PREFIXED, QUOTA_BARE, WARN, { phase: "zzz" }, { phase: "retry" }]
    .map((ev) => waitStatusText(ev))
  for (const s of outs) if (s !== null) assert.ok(!s.includes("undefined"), `文案不得含 undefined：${s}`)
  assert.ok(!String(waitStatusText(OVERLOADED)).includes("429"), "overloaded = 服务过载，不得误标 429")
  assert.equal(waitStatusText(GATE, "zh"), t("status.rateWait", { s: 7 }, "zh"), "locale 透传（BCP-47 归一由核 i18n 负责）")
  assert.equal(waitStatusText(QUOTA_BARE, "zh-CN"), "配额耗尽：insufficient_quota")
})
