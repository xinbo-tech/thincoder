/**
 * wait-status-callsites.test.mjs — B3 三消费点收敛结构机检（CORE-DEFECT-FIXES 批 1 · 批档 §五 V6）。
 *
 * 断言对象 = **源码调用结构**（非文档散文；三档锁定，不做全仓文字扫）：
 * - 三消费点（CLI TUI 状态行 / headless stderr / ACP 日志）均直连核单源
 *   `@thincoder/core/provider/wait-status.mjs` 并调用 `waitStatusText`；
 * - 三档零 `phase ===` 相位枚举残留（缺陷根因形态：各自枚举 + `else` 兜底 ⇒ 渲染 `undefined`）；
 * - TUI 状态行**行为面**直驱：四可显示相落状态行（文案 = 核 i18n 单源）；`warn` / 未知相位不
 *   显示——状态行不动、零 `render`、零 `undefined` 子串。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import { buildToolCallbacks } from "../src/tui/tool-events.mjs"
import { createAgent } from "@thincoder/core/agent.mjs"
import { t } from "@thincoder/core/i18n.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
/** B3 的三消费点（PROVIDER.md §6.20 消费点收敛行——档面锁定，随设计行改）。 */
const CALLSITES = [
  ["CLI TUI 状态行", "src/tui/tool-events.mjs"],
  ["headless stderr", "bin/thincoder.mjs"],
  ["ACP 日志", "src/acp/bridge.mjs"],
]

test("V6 三消费点直连核单源 + 零相位枚举残留（缺陷根因形态不复现）", () => {
  for (const [label, rel] of CALLSITES) {
    const src = readFileSync(join(ROOT, rel), "utf8")
    assert.match(
      src,
      /import \{[^}]*\bwaitStatusText\b[^}]*\} from "@thincoder\/core\/provider\/wait-status\.mjs"/,
      `${label}（${rel}）须从核单源导入 waitStatusText`,
    )
    assert.match(src, /waitStatusText\(/, `${label}（${rel}）须调用核单源`)
    const enums = src.match(/phase\s*===\s*"/g) ?? []
    assert.equal(enums.length, 0, `${label}（${rel}）零相位枚举残留，实测 ${enums.length} 处`)
  }
})

test("V6 TUI 状态行行为面：可显示相落状态行 · warn/未知相不显示（零兜底误标）", () => {
  const state = {
    lines: [], subTasks: {}, expandedBlocks: new Set(), _foldScroll: new Map(),
    streaming: "", reasoning: "", _advisorBlocks: [], search: null, _linesChars: 0,
    _lineIdCounter: 0, dims: { get: () => ({ cols: 80, rows: 24 }) }, scroll: 0,
    status: "", tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
  const rendered = []
  const agent = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" },
    tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null,
  })
  const { callbacks } = buildToolCallbacks({
    agent, state, pushLine: () => {}, render: () => rendered.push(state.status),
    scheduleRender: () => {}, ensureAssistantLabel: () => {},
    askPermission: null, askBatchPermission: null, askQuestion: null, saveSessionImpl: () => {},
  })

  callbacks.onWait({ phase: "gate", seconds: 7 })
  assert.equal(state.status, t("status.rateWait", { s: 7 }))
  callbacks.onWait({ phase: "retry", seconds: 3 })
  assert.equal(state.status, t("status.rateLimited", { s: 3 }))
  callbacks.onWait({ phase: "overloaded", seconds: 3 })
  assert.equal(state.status, t("status.overloaded", { s: 3 }))
  callbacks.onWait({ phase: "quota", message: "quota exhausted: insufficient_quota" })
  assert.equal(state.status, t("status.quota", { msg: "insufficient_quota" }))
  assert.equal(rendered.length, 4, "每个可显示相 render 一次")
  assert.ok(!String(state.status).includes("undefined"))

  // warn（前置告警）/ 未知相位 / 秒缺失 ⇒ 不显示：状态行不动、零 render、零 undefined。
  const frozen = state.status
  for (const ev of [{ phase: "warn", message: "estimated 5000 tokens > tpm 1000" }, { phase: "nope" }, { phase: "retry" }]) {
    callbacks.onWait(ev)
  }
  assert.equal(state.status, frozen, "不显示相不得改写状态行")
  assert.equal(rendered.length, 4, "不显示相零 render")
})
