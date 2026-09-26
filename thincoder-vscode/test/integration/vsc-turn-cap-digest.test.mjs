/**
 * vsc-turn-cap-digest.test.mjs — 系统轮撞帽收口（端壳半 · 批次档 §2.5 用例 11 VSC 半）。
 *
 * 设计权威 `docs/core/design/TURN-CAP-CONTINUE.md` §1 #7 / D-TC15：digest（系统轮 · 无人值守档）
 * 撞帽 ⇒ **收口停轮**——不再自续、不再问人；部分消化留在历史，已做工作不丢。对标 CLI 半
 * （`thincoder-cli/src/tui/agent-turn.mjs` autoTurn 支：`digest.capStop` + `result = "stopped"` + break）。
 *
 * 断言面（业务可观察）：
 *   ① 模型调用数 = 段预算（`agent.maxTurns = 2` ⇒ 恰 2 次——无第 3 次重入）；
 *   ② `tLog.result = "stopped"`（LOGGING 终止原因回传）；
 *   ③ digest cap 行在场（`postDigestCap` 载荷 `{type:"digest", status:"cap", mode:"stop", turns:2}`）；
 *   ④ 零 continue 卡 ∧ 零 askInPanel 询问（无人可答不问）∧ 零权限卡（AUTO 在档 ⇒ 工具直批）；
 *   ⑤ `_turnControllers.length === 1`（零重建 = 零自续）；
 *   ⑥ 已发工具副作用落盘（两笔 write 在盘）。
 * 档位 = 真 `runTurnLoop` + 真面板回调工厂（`buildPanelCallbacks`）+ 真 provider 链路
 * （mock-llm 本地 HTTP，零出网）+ 临时配置。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { runTurnLoop, newTurnController } from "../../src/extension/panel-turn-loop.mjs"
import { buildPanelCallbacks } from "../../src/extension/panel-callbacks.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

/** 桩面板：真 runTurnLoop 消费面 + 回调工厂消费面（AUTO 在档——无人值守档的最严档位）。 */
function stubPanel(over = {}) {
  const posted = []
  return {
    _autoApprove: true, _permissionQueue: [], _permissionSeq: 0, _turnControllers: [],
    _abortController: null, _abortRequested: false, _wvReady: true,
    _susp: null, _slot: "1",
    _setStatus() {}, _refreshStatus() {}, _pushSettingsLight() {}, _pushSessions() {},
    _saveLines() {}, _setPlanMode: async () => {},
    _panel: { webview: { postMessage: (m) => { posted.push(m) } } },
    posted,
    ...over,
  }
}

test("T-DG1 系统轮撞帽收口（AUTO 在档）：maxTurns=2 ⇒ 恰 2 次调用 + result=stopped + cap 行在场 + 零卡零问零重建 + 工具副作用在盘", async () => {
  const tmpd = mkdtempSync(join(tmpdir(), "tc-turn-cap-digest-"))
  try {
    const cfgPath = join(tmpd, "config.json")
    writeFileSync(cfgPath, JSON.stringify({ providers: [], agent: { maxTurns: 2 } }) + "\n", "utf8")
    _setConfigPathForTest(cfgPath)
    const work = join(tmpd, "work")
    mkdirSync(join(work, ".git"), { recursive: true })

    const panel = stubPanel()
    const asked = []
    const tLog = {}
    const history = []
    const fullHistory = []
    const askInPanel = (question, options) => { asked.push([question, options]); return Promise.resolve("Continue") }
    const llm = await mockLLM([
      { toolCall: { name: "write", arguments: { path: "digest-a.txt", content: "a\n" } } },
      { toolCall: { name: "write", arguments: { path: "digest-b.txt", content: "b\n" } } },
    ])
    try {
      const p = providerFor(llm)
      const slotStamp = { activeProvider: p.name, activeModel: p.model }
      const callbacks = buildPanelCallbacks(panel, {
        cwd: work, p, fullHistory, history, providerName: p.name,
        turnSlot: "1", distillSlot: "1", autoTurn: true, askInPanel, slotStamp,
      })
      newTurnController(panel) // 端壳同式：回合起点建 controller（runTurnLoop 只消费）
      await runTurnLoop(panel, {
        text: "digest the settled subagent results", cwd: work, p, callbacks,
        images: [], history, fullHistory, autoTurn: true, upstreamTurn: false,
        susp: { abort: new AbortController() }, turnSlot: "1", tLog, askInPanel, slotStamp,
      })
    } finally {
      await llm.close()
    }

    assert.equal(llm.calls, 2, "调用数 = 段预算（撞帽即止——零重入第 3 次）")
    assert.equal(tLog.result, "stopped", "终止原因 = stopped（LOGGING 回传）")
    const caps = panel.posted.filter((m) => m.type === "digest" && m.status === "cap")
    assert.deepEqual(caps.map((m) => [m.mode, m.turns]), [["stop", 2]], "digest cap 行在场（mode=stop——非 auto 自续）")
    assert.equal(panel.posted.filter((m) => m.type === "permissionRequest" && m.tool === "continue").length, 0, "零 continue 卡（无人可答不问）")
    assert.equal(panel.posted.filter((m) => m.type === "permissionRequest").length, 0, "零权限卡（AUTO 在档 ⇒ 工具直批）")
    assert.equal(asked.length, 0, "零 askInPanel 询问（无人值守档不吊人）")
    assert.equal(panel._turnControllers.length, 1, "零控制器重建（不自续）")
    assert.equal(readFileSync(join(work, "digest-a.txt"), "utf8"), "a\n", "第一笔 write 落盘")
    assert.equal(readFileSync(join(work, "digest-b.txt"), "utf8"), "b\n", "第二笔 write 落盘（部分消化不丢已做工作）")
  } finally {
    _setConfigPathForTest(null)
    try { rmSync(tmpd, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }) } catch { /* OS temp — best effort */ }
  }
})

test("T-DG2 形状锁（接线）：turn loop digest 支 = cap 行 + result=stopped + break——支内零 askInPanel / 零 newTurnController", async () => {
  const src = readFileSync(new URL("../../src/extension/panel-turn-loop.mjs", import.meta.url), "utf8")
  const start = src.indexOf("if (autoTurn) {")
  assert.ok(start > 0, "digest 支在位（ContinueError ∧ autoTurn）")
  const body = src.slice(start, src.indexOf("\n        }", start))
  assert.ok(body.includes('postDigestCap(panel, "stop"'), "cap 行 = stop 档（无人值守收口）")
  assert.ok(body.includes('tLog.result = "stopped"'), "终止原因回传 = stopped")
  assert.ok(!body.includes("askInPanel("), "支内零询问（不问人）")
  assert.ok(!body.includes("newTurnController("), "支内零控制器重建（不自续）")
})
