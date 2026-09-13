/**
 * i18n.test.mjs — §2.5 #185 / 丁组 D1（容器归一 · 投影端差）核面用例。
 *
 * 冻结面断言（契约 §2.12.2 第 12 行）：机器消费串在核内以 golden 锁定——改值必红
 * （人读文案变更须登记 + CHANGELOG——S2 落地物）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CORE_MESSAGES, SUPPORTED_LOCALES, normalizeLocale, t, projectDictionary,
} from "../i18n.mjs"

test("CORE_MESSAGES：每键 en/zh 双语齐备且非空", () => {
  const keys = Object.keys(CORE_MESSAGES)
  assert.ok(keys.length >= 20, "核域文案集非空")
  for (const k of keys) {
    const e = CORE_MESSAGES[k]
    assert.equal(typeof e.en, "string", `${k}.en 为串`)
    assert.equal(typeof e.zh, "string", `${k}.zh 为串`)
    assert.ok(e.en.length > 0 && e.zh.length > 0, `${k} 双语非空`)
  }
})

test("CORE_MESSAGES：深度冻结（值对象亦不可改——机器消费面冻结）", () => {
  assert.equal(Object.isFrozen(CORE_MESSAGES), true)
  for (const entry of Object.values(CORE_MESSAGES)) {
    assert.equal(Object.isFrozen(entry), true, "嵌套 {en,zh} 亦冻结")
  }
  assert.throws(() => { "use strict"; CORE_MESSAGES["tool.done"] = { en: "x", zh: "x" } }, TypeError)
})

test("机器消费面冻结（golden）：键值逐字锁定", () => {
  const golden = {
    "compress.starting": { en: "Compressing context…", zh: "正在压缩上下文…" },
    "compress.done": { en: "Compressed: ${tokens} tokens freed (${seconds}s)", zh: "已压缩：释放 ${tokens} tokens（${seconds} 秒）" },
    "digest.done": { en: "Digested ${n} background report(s) (${seconds}s)", zh: "已消化 ${n} 份后台报告（${seconds}s）" },
    "status.rateLimited": { en: "Rate-limited 429, retry in ${s}s", zh: "限流 429，${s}s 后重试" },
    "status.stopped": { en: "[stopped]", zh: "[已停止]" },
    "sub.queueSlot": { en: "queued · position ${n} (slot full)", zh: "排队中 · 位置 ${n}（槽满等位）" },
    "status.turn": { en: "turn ${n}/${m}", zh: "轮次 ${n}/${m}" },
    "digest.start": { en: "Digesting ${n} background report(s)…", zh: "正在消化 ${n} 份后台报告…" },
  }
  for (const [k, v] of Object.entries(golden)) {
    assert.deepEqual(CORE_MESSAGES[k], v, `golden 值锁定：${k}`)
  }
})

test("t()：插值 / 语言归一 / 缺键回退 key（不抛）", () => {
  assert.equal(t("compress.starting"), "Compressing context…")
  assert.equal(t("compress.starting", {}, "zh"), "正在压缩上下文…")
  assert.equal(t("compress.done", { tokens: 1234, seconds: "1.2" }), "Compressed: 1234 tokens freed (1.2s)")
  assert.equal(t("digest.done", { n: 2, seconds: "3" }, "zh"), "已消化 2 份后台报告（3s）")
  assert.equal(t("no.such.key"), "no.such.key")
  assert.equal(normalizeLocale("zh-CN"), "zh")
  assert.equal(normalizeLocale("en-US"), "en")
  assert.equal(normalizeLocale("fr"), "en")
  assert.equal(normalizeLocale(""), "en")
})

test("projectDictionary：VSC 字典投影（扁平形态 + 语言回退）", () => {
  for (const lang of SUPPORTED_LOCALES) {
    const dict = projectDictionary(lang)
    assert.equal(Object.keys(dict).length, Object.keys(CORE_MESSAGES).length)
    for (const v of Object.values(dict)) assert.equal(typeof v, "string")
  }
  assert.equal(projectDictionary("zh")["tool.done"], "完成")
  assert.equal(projectDictionary("en")["tool.done"], "done")
  // 未知语言 → en 回退（与 VSC _load 候选回退同口径）
  assert.deepEqual(projectDictionary("fr"), projectDictionary("en"))
})
