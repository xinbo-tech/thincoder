/**
 * webview-tool-failure-signal.test.mjs — F-W16（工具失败可见性 · CLI 对位）机器验收。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.3（判据单源 `isToolFailure` · 活卡/恢复卡同判据 ·
 * 失败面三信号：状态词 + 红 / 保持展开 / 摘要含退出状态；状态位族三成员闭集
 * `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`；边界 = 独立成行才触发 · `(stopped)`
 * 不入判据）+ §6 D-W18 · D-W19 · §8 U-W10 · U-W11；批次档
 * `docs/batches/2026-09-18-vsc-session-wiring.md` §2.3（W16-1…W16-6）+
 * `docs/batches/2026-09-18-tool-failure-spawn-form.md` §2.4（W16-7…W16-11——spawn 失败 / 超时
 * 两形态的输入一律取自宿主真产者 `src/tools/shell.mjs` 直跑，禁夹具手写字符串）。
 *
 * 手法（happy-dom——`history-restore.test.mjs` 模式）：installChatFixture + 真 ui.js 活卡
 * 路径（`addTool` → `finishTool`）+ 真 `tool-card-restore.mjs` 恢复卡。判定对象 = 卡面三信号。
 *
 * 2026-09-20 显示面消差批（X7 · 批档 `2026-09-20-display-parity-batch.md` §2.2）：bash 摘要改取
 * CLI 前缀形（`bash: <末行>`——`tool-summary.js` 字面逐字承 CLI）⇒ 本档 **12 处**摘要字面随改
 * （**判据与语义零改**：末行输出 + 状态位、`(empty)` 不入内容、成功面不拼 `(exit code 0)` 不变）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadUi() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const restore = await import("../webview/tool-card-restore.mjs")
  const i18n = await import("../webview/i18n.js")
  return { ctx: state.ctx, t: i18n.t, ...ui, ...restore }
}

/** 红 / 绿 = 同一内联色的两种序列化（hex 原值 / 归一 rgb）——判定语义不因序列化分叉。 */
const RED = ["#f14c4c", "rgb(241, 76, 76)"]
const GREEN = ["#4ec9b0", "rgb(78, 201, 176)"]

/** 活卡（真 addTool → finishTool 路径）。 */
function liveCard(wv, text, name = "bash") {
  const { ctx, addTool, finishTool } = wv
  ctx.messagesEl.replaceChildren()
  ctx.currentBlock = null
  ctx.assistantLabeled = true
  addTool(ctx, name, '{"command":"x"}', "t1")
  finishTool(ctx, name, "t1", text, [])
  const card = ctx.messagesEl.querySelector(".tool-call")
  assert.ok(card != null, "工具卡已建（前置）") // 布尔断言：DOM 节点不入断言载荷
  const status = card.querySelector(".tool-call-status")
  const body = card.querySelector(".tool-call-body")
  return {
    statusText: status.textContent,
    statusColor: status.style.color,
    open: body.classList.contains("open"),
    ariaExpanded: card.querySelector(".tool-call-header").getAttribute("aria-expanded"),
    summary: card.querySelector(".tool-call-summary")?.textContent ?? null,
  }
}

const statusWord = (t, semantic) => t(`tool.${semantic}`)
const assertFailed = (c, t, label) => {
  assert.ok(c.statusText.startsWith(statusWord(t, "error")), `${label}：状态词 = tool.error（实 ${c.statusText}）`)
  assert.ok(RED.includes(c.statusColor), `${label}：红（实 ${c.statusColor}）`)
  assert.equal(c.open, true, `${label}：body 保持 open`)
  assert.equal(c.ariaExpanded, "true", `${label}：aria-expanded 同步`)
}
const assertSucceeded = (c, t, label) => {
  assert.ok(c.statusText.startsWith(statusWord(t, "done")), `${label}：状态词 = tool.done（实 ${c.statusText}）`)
  assert.ok(GREEN.includes(c.statusColor), `${label}：绿（实 ${c.statusColor}）`)
  assert.equal(c.open, false, `${label}：成功面折叠`)
}

// ─── W16-1 / W16-2 非零退出（正常）─────────────────────────────────────────

test("W16-1 非零退出（空输出，正常）：错误 + 红 + 保持 open + 摘要含 exit code 1（不再读作 (empty)）", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, "[stdout]:\n(empty)\n\n(exit code 1)")
  assertFailed(c, wv.t, "W16-1")
  assert.equal(c.summary, "→ bash: (exit code 1)", "摘要含退出状态（无输出面）")

  // 裸状态行形态（无 `[stdout]:` 包裹——`execute` 无输出 + 非零退出的结果恰为单行）：状态词勿重复
  const bare = liveCard(wv, "(exit code 1)")
  assertFailed(bare, wv.t, "W16-1 裸状态行")
  assert.equal(bare.summary, "→ bash: (exit code 1)", "裸状态行 ⇒ 只出状态（不重复拼）")
})

test("W16-2 非零退出（有输出，正常）：摘要 = 末行输出 + 退出状态", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, "[stdout]:\nboom\n\n(exit code 2)")
  assertFailed(c, wv.t, "W16-2")
  assert.equal(c.summary, "→ bash: boom (exit code 2)", "末行输出 + 退出状态")
})

// ─── W16-3 被杀（含用户中断）────────────────────────────────────────────────

test("W16-3 被杀（错误）：killed 两值同判失败（含用户中断——中断的命令确未完成）", async () => {
  const wv = await loadUi()
  for (const status of ["(killed: timeout)", "(killed: user interrupted)"]) {
    const c = liveCard(wv, `[stdout]:\n(empty)\n\n${status}`)
    assertFailed(c, wv.t, `W16-3 ${status}`)
    assert.equal(c.summary, `→ bash: ${status}`, `摘要含 killed（${status}）`)
  }
})

// ─── W16-4 / W16-5 回归锚 + 反例 ────────────────────────────────────────────

test("W16-4 成功面零回归（正常·回归锚）：退出 0 ⇒ 绿 + 折叠 + 摘要不含 (exit code 0)", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, "[stdout]:\nok\n\n(exit code 0)")
  assertSucceeded(c, wv.t, "W16-4")
  assert.equal(c.summary, "→ bash: ok", "成功面摘要 = 末行输出（不拼 (exit code 0)）")
})

test("W16-5 反例面（边界·锁定判据精度）：正文提及 (exit code 1) 非独占行 ⇒ 不判失败", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, "see (exit code 1) in log")
  assertSucceeded(c, wv.t, "W16-5")
  assert.equal(c.summary, "→ bash: see (exit code 1) in log", "摘要照旧（零误报面）")
})

// ─── W16-6 恢复卡同判据（正常）─────────────────────────────────────────────

test("W16-6 恢复卡同判据（正常）：buildFinishedToolCard 非零退出 ⇒ 状态词错误 + 红 + 展开", async () => {
  const wv = await loadUi()
  for (const [result, label] of [
    ["[stdout]:\nboom\n\n(exit code 1)", "非零退出"],
    ["[stdout]:\nboom\n\n(killed: user interrupted)", "用户中断"],
  ]) {
    const card = wv.buildFinishedToolCard({ name: "bash", args: '{"command":"x"}', result })
    const status = card.querySelector(".tool-call-status")
    const body = card.querySelector(".tool-call-body")
    assert.equal(status.textContent, statusWord(wv.t, "error"), `${label}：状态词 = tool.error`)
    assert.ok(RED.includes(status.style.color), `${label}：红（实 ${status.style.color}）`)
    assert.equal(body.classList.contains("open"), true, `${label}：失败展开`)
    assert.equal(card.querySelector(".tool-call-header").getAttribute("aria-expanded"), "true")
  }
})

// ─── W16-7 / W16-8 spawn 失败形态（真产者输入——宿主 bash 直跑）───────────────

/** 不存在的 cwd ⇒ 宿主产者 spawn ENOENT（真产形来源）。 */
const NO_SUCH_DIR = join(tmpdir(), "thincoder-w16-no-such-dir")

/** 宿主 bash spawn 失败真产形（`src/tools/shell.mjs` 直跑——禁夹具手写字符串）。 */
async function hostSpawnFailure() {
  const { bashTool } = await import("../src/tools/shell.mjs")
  return bashTool.execute({ command: "echo hi" }, { cwd: NO_SUCH_DIR })
}

test("W16-7 活卡 spawn 失败（正常·先红——真产者）：宿主真产形 ⇒ tool.error + 红 + 保持开放 + 摘要 → (spawn failed)", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, await hostSpawnFailure())
  assertFailed(c, wv.t, "W16-7")
  assert.equal(c.summary, "→ bash: (spawn failed)", "摘要 = 状态位本体（spawn 形态天然无输出体）")
})

test("W16-8 恢复卡同判据（正常·先红——真产者）：同真产形 ⇒ tool.error + 红 + 展开", async () => {
  const wv = await loadUi()
  const card = wv.buildFinishedToolCard({ name: "bash", args: '{"command":"echo hi"}', result: await hostSpawnFailure() })
  const status = card.querySelector(".tool-call-status")
  const body = card.querySelector(".tool-call-body")
  assert.equal(status.textContent, statusWord(wv.t, "error"), "W16-8：状态词 = tool.error")
  assert.ok(RED.includes(status.style.color), `W16-8：红（实 ${status.style.color}）`)
  assert.equal(body.classList.contains("open"), true, "W16-8：失败展开")
  assert.equal(card.querySelector(".tool-call-header").getAttribute("aria-expanded"), "true", "W16-8：aria-expanded 同步")
})

// ─── W16-9 / W16-10 边界（恒绿·判据精度否决面）──────────────────────────────

test("W16-9 反例面（边界·恒绿）：正文提及 (spawn failed) 非独占行 ⇒ 不判失败", async () => {
  const wv = await loadUi()
  const c = liveCard(wv, "see (spawn failed) in log")
  assertSucceeded(c, wv.t, "W16-9")
  assert.equal(c.summary, "→ bash: see (spawn failed) in log", "摘要照旧（零误报面）")
})

test("W16-10 锁否决面（边界·恒绿·三形）：无状态位措辞形 / 非数字退出码槽 / 破折号超时形 ⇒ 均不判失败", async () => {
  const wv = await loadUi()
  for (const [result, summary, label] of [
    ["Command failed: spawn C:\\Windows\\system32\\cmd.exe ENOENT\n[stdout]:\n(empty)", "→ bash: (empty)", "（乙）所认措辞面（无状态位）"],
    ["(exit code ENOENT)", "→ bash: (exit code ENOENT)", "收正前宿主 spawn 历史形"],
    ["(killed — timeout 400ms)", "→ bash: (killed — timeout 400ms)", "收正前宿主超时历史形"],
  ]) {
    const c = liveCard(wv, result)
    assertSucceeded(c, wv.t, `W16-10 ${label}`)
    assert.equal(c.summary, summary, `W16-10 ${label}：摘要照旧（不判失败）`)
  }
})

// ─── W16-11 超时真产形（正常·先红）──────────────────────────────────────────

test("W16-11 活卡超时（正常·先红——真产者）：宿主超时真产形 ⇒ tool.error + 红 + 保持开放 + 摘要 → (killed: timeout 400ms)", async () => {
  const wv = await loadUi()
  const { bashTool } = await import("../src/tools/shell.mjs")
  const result = await bashTool.execute({ command: 'node -e "setTimeout(()=>{},5000)"', timeout: 400 }, { cwd: tmpdir() })
  const c = liveCard(wv, result)
  assertFailed(c, wv.t, "W16-11")
  assert.equal(c.summary, "→ bash: (killed: timeout 400ms)", "摘要含超时状态位（冒号形）")
})
