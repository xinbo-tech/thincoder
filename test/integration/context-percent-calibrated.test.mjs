/**
 * context-percent-calibrated.test.mjs — 集成用例 16-1（`test/RTM.md` CLI 端故事 16「状态行百分比与压缩判据同尺」
 * 行 16-1）。用例设计 = 批档 `docs/batches/2026-10-27-context-percent-parity.md` §2.10；
 * 机制正文 = `docs/core/design/CONTEXT-COMPACTION.md` §6.16.4（「与状态行 ctx% 的单源关系」条）。
 *
 * 业务入口 = CLI 恢复一个**带校准样本**的会话（真链路：槽文件在盘 → `resumeSlot` → `applySession` 恢复样本），
 * 用户肉眼读状态行的 `context X%` 段，同一回合再调 `context` 工具的 `stats`。
 * 断言口径 = 用户看到什么：两处是**同一个数**，且这个数**不是**未校准读数（校准比真的进了显示面）。
 *
 * 交互组件（四件，全走真件）：槽 `estimateSample` → 核 `restoreTokenSample` / `sampleRatio` →
 * CLI 渲染缓存 `ctxCacheOf` → 状态行渲染（`renderStatus`）。
 * 零外网、零付费端点、零桩：本用例不发起模型请求。
 *
 * 夹具窗口 = L1 人工声明（`modelContext: { m: 128 }` ⇒ 131_072）——**不查静态表**：`model: "m"` 会前缀命中
 * `mimo-v2.6-pro`（1M 档），照字面当 128K 必红。三条消息各 ≈10_000 估算 token ⇒ 未校准 23%、比 1.473 ⇒ 34%。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, slotPath, writeEndMarker, writeSessionFile } from "../../thincoder-core/session-slots.mjs"
import { applySession, resumeSlot } from "../../thincoder-core/session-lifecycle.mjs"
import { historyPercent, tokenKey, tokenRatioOf } from "../../thincoder-core/token-window.mjs"
import { ESTIMATOR_VERSION } from "../../thincoder-core/provider/rate.mjs"
import { createAgent } from "../../thincoder-core/agent.mjs"
import { contextTool } from "../../thincoder-core/agent-tools/context.mjs"
import { ctxCacheOf } from "../../thincoder-cli/src/tui/render-loop.mjs"
import { renderStatus } from "../../thincoder-cli/src/tui/status-line.mjs"

const PROVIDER = { name: "t", model: "m", modelContext: { m: 128 } }
const HISTORY = [0, 1, 2].map((i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(30_000) }))
const SAMPLE = { key: tokenKey(PROVIDER), num: 1473, den: 1000, est: ESTIMATOR_VERSION } // 比 = 1.473

/** 状态行最小状态夹具（§2.14 #7 逐键：渲染只读这些位）。 */
const statusState = (ctxCache) => ({
  input: [],
  scroll: 0,
  processing: false,
  status: "Ready",
  permission: null,
  question: null,
  picker: null,
  wizard: null,
  teamAsk: null,
  secretPrompt: null,
  tasks: [],
  currentTool: null,
  pendingInput: [],
  attentionAwaiting: false,
  tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  ctxCache,
})

/** 状态行渲染串里的 `context N%` 段（`N < 80` 时不带 ansi 包裹，整段可取）；无该段 ⇒ undefined。 */
const ctxPercentOnStatusLine = (line) => {
  const m = line.match(/context (\d+)%/)
  return m ? Number(m[1]) : undefined
}

test("16-1 恢复带 estimateSample 的会话 ⇒ 状态行百分比 = 核读数（不是未校准值），stats 同值", async (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "ctx-percent-calibrated-"))
  _setSessionsDirForTest(join(cwd, "sessions"))
  t.after(() => {
    _resetSessionsDirForTest()
    rmSync(cwd, { recursive: true, force: true })
  })

  // ① 盘上会话：机读线（contextHistory 为空 ⇒ 回退 history）+ 校准样本
  writeSessionFile(slotPath(cwd, 1), {
    version: 2,
    cwd,
    history: HISTORY,
    contextHistory: [],
    activeProvider: PROVIDER.name,
    activeModel: PROVIDER.model,
    estimateSample: SAMPLE,
    updatedAt: Date.now(),
  })
  writeEndMarker(cwd, 1)

  // ② 真恢复链路：本端记录 ⇒ resumeSlot ⇒ applySession（样本在此被 restoreTokenSample 接回）
  const { slot, data } = await resumeSlot(cwd)
  assert.equal(slot, 1, "本端记录可用的槽应被复用")
  assert.ok(data, "槽数据应从盘上读回")
  const agent = createAgent({ cwd, provider: PROVIDER })
  applySession(agent, data)
  assert.ok(tokenRatioOf(agent) > 1, "恢复后校准比应 > 1（样本真的接回来了）")

  // ③ 用户看到的状态行：缓存 = 核读数，串里带 context X%
  const shown = ctxPercentOnStatusLine(renderStatus(statusState(ctxCacheOf(agent, null)), agent, 120, []))
  // ④ 同一回合的 stats 第 6 行
  const statsLine = (await contextTool.execute({ action: "stats" }, { agent }))
    .split("\n").find((line) => line.startsWith("Status line:"))
  const statsPct = Number((statsLine.match(/context (\d+)%/) ?? [])[1])

  // 两处一个数，且 = 核读数（合并后机读线 + provider + 恢复出的比）
  const calibrated = historyPercent(agent.history, agent.provider, tokenRatioOf(agent))
  assert.equal(shown, calibrated, `状态行 ${shown}% 应等于核读数 ${calibrated}%`)
  assert.equal(statsPct, calibrated, `stats ${statsPct}% 应等于核读数 ${calibrated}%`)
  // 校准比真的进了显示面：不是未校准读数
  assert.notEqual(calibrated, historyPercent(agent.history, agent.provider, 1))
})
