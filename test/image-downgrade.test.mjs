/**
 * image-downgrade.test.mjs — IMAGE-DOWNGRADE-VISION（docs/design/IMAGE-DOWNGRADE-VISION.md——
 * 2026-09-09 评审采纳版）：F-1 VSC 非视觉贴图自动降级视觉子代理（routeUserTurn 触发——评审 #6
 * runner seam 参数注入 mock）+ F-2 fallback 可读（无渠道/失败/超时/空返 → 原样下发——主回合
 * setup 现报错文案——不静默丢）+ AC-2 视觉模型路径零回归 + seam 缺省回落生产（默认跑者直调——
 * keyless 渠道短路——零网络）。全部快层直跑（<800ms 不标 slow——mock 跑者或渠道短路无 LLM）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { routeUserTurn, setProjectFolder, clearProjectOverride, handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { runVisionReader, VISION_READ_TIMEOUT_MS } from "../src/extension/image-handler.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

const DATAURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
let _tmp, _conf1, _conf2, _savedWs

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-imgd-"))
  _conf1 = join(_tmp, "c1.json") // 仅非视觉渠道（无视觉渠道形态）
  writeFileSync(_conf1, JSON.stringify({ providers: [{ name: "ds", apiKey: "k1", baseURL: "http://127.0.0.1/v1", model: "deepseek-v4-pro" }], defaultModel: "ds:deepseek-v4-pro" }))
  _conf2 = join(_tmp, "c2.json") // 非视觉主渠道 + keyless 视觉渠道（渠道命中但 spawn 前置失败）
  writeFileSync(_conf2, JSON.stringify({ providers: [
    { name: "ds", apiKey: "k1", baseURL: "http://127.0.0.1/v1", model: "deepseek-v4-pro" },
    { name: "kimi", baseURL: "http://127.0.0.1/v2", model: "kimi-k3" },
  ] }))
  _savedWs = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: _tmp } }]
  assert.ok(setProjectFolder(_tmp).ok, "cwd override 指向 tmp（savePastedImages 落盘隔离）")
  _setConfigPathForTest(_conf1)
})

after(() => {
  clearProjectOverride()
  vscode.workspace.workspaceFolders = _savedWs
  _setConfigPathForTest(null)
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

function stubPanel() {
  const states = []
  return {
    _turnState: "idle", _susp: null,
    _chatCalls: [],
    _publishTurnState(s) { states.push(s); this._turnState = s },
    _chat(...args) { this._chatCalls.push(args); return Promise.resolve() },
    _refreshStatus() {}, _setStatus() {}, _activeHistory() { return [] },
    states,
  }
}

test("F-1 正常降级：非视觉+贴图 → 视觉子代理读图（mock 跑者）→ 描述注入 text + images 清空", async () => {
  const panel = stubPanel()
  const seen = []
  await routeUserTurn(panel, {
    text: "看看这图", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [DATAURL],
    visionReader: async (arg) => { seen.push(arg); return { ok: true, description: "一只戴帽子的猫" } },
  })
  assert.equal(panel._chatCalls.length, 1)
  const [text, mo, , pn, imgs] = panel._chatCalls[0]
  assert.equal(mo, "deepseek-v4-pro")
  assert.equal(pn, "ds")
  assert.equal(imgs, undefined, "images 清空——主回合按纯文本跑（appendImagePointer throw 路径不达）")
  assert.equal(seen.length, 1)
  assert.equal(seen[0].providerName, "ds")
  assert.equal(seen[0].paths.length, 1)
  const savedPath = seen[0].paths[0]
  assert.ok(savedPath.startsWith(_tmp) && savedPath.includes("paste-") && savedPath.endsWith(".png"), "路径 = savePastedImages 落盘文件")
  assert.equal(text, `看看这图\n\n[图片 ${savedPath} 描述: 一只戴帽子的猫]`, "描述注入 marker 逐字形态（文本保留——marker 追加）")
  assert.ok(panel.states.includes("running"), "C' 忙锁——await 窗口先置 running（拒并发回合）")
})

test("AC-2 视觉模型零动：kimi-k3 + 贴图 → 跑者不调用——现路径（images 原样下发——read_image 注入不变）", async () => {
  const panel = stubPanel()
  let called = false
  await routeUserTurn(panel, {
    text: "看图", modelOverride: "kimi-k3", providerName: "kimi", images: [DATAURL],
    visionReader: async () => { called = true; return { ok: true, description: "x" } },
  })
  assert.equal(called, false, "视觉模型不触发降级")
  const [text, , , , imgs] = panel._chatCalls[0]
  assert.equal(text, "看图")
  assert.ok(Array.isArray(imgs) && imgs.length === 1, "images 保持——视觉模型路径零动")
  assert.deepEqual(panel.states, [], "不置 running——同步路径状态零动")
})

test("F-2 无视觉渠道 → fallback（默认跑者回落生产——原样下发——现报错路径保留）", async () => {
  const panel = stubPanel()
  // 不传 visionReader——seam ?? 默认 = 生产 runVisionReader（c1 无视觉渠道 → null——零网络）
  await routeUserTurn(panel, { text: "看图", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [DATAURL] })
  const [text, , , , imgs] = panel._chatCalls[0]
  assert.equal(text, "看图", "无渠道——文本零改动")
  assert.ok(Array.isArray(imgs) && imgs.length === 1, "images 保留下发——主回合 setup 报现错（可读不静默丢）")
})

test("F-2 runner 直调：无渠道 / keyless 视觉渠道 → null（不碰网络）+ 60s 超时常量", async () => {
  assert.equal(VISION_READ_TIMEOUT_MS, 60_000, "60s 超时（设计 §1.3）")
  assert.equal(await runVisionReader({ paths: ["x.png"], providerName: "ds", cwd: _tmp }), null, "无视觉渠道 → null")
  _setConfigPathForTest(_conf2)
  assert.equal(await runVisionReader({ paths: ["x.png"], providerName: "ds", cwd: _tmp }), null, "有视觉渠道但无 key → providerFromConfig null（spawn 前置失败）")
  _setConfigPathForTest(_conf1)
})

test("视觉判据（MODEL-SELECTION）：判据 = 渠道默认单值模型的 spec——非视觉默认模型不被选中；旧候选字段不再被读", async () => {
  const { findVisionChannel } = await import("../src/extension/vision-channel.mjs")
  assert.equal(findVisionChannel([{ name: "ds", model: "deepseek-v4-pro" }]), null, "默认模型非视觉 → 不选中（能力收窄已入档）")
  assert.deepEqual(findVisionChannel([{ name: "kimi", model: "kimi-k3" }], "kimi"), { provider: "kimi", model: "kimi-k3" }, "默认模型视觉 → 选中")
  assert.equal(findVisionChannel([{ name: "x", models: ["kimi-k3"] }]), null, "旧 models 候选字段不再被读（判据单一来源）")
})

test("T36 第 6 批：DeepSeek V4.1-Flash 三行 = 契约（R11–R13）+ 新名/退役名渠道入视觉判据", async () => {
  const { specForModel } = await import("../src/config.mjs")
  const { findVisionChannel } = await import("../src/extension/vision-channel.mjs")
  // §19.2（a）契约（VSC 侧——每行多 reasoningEffortDefault: "high"）
  const CONTRACT = {
    context: 1_000_000, maxOutput: 384_000, thinking: true, prefixMode: true, multimodal: true,
    cacheMode: "auto", thinkApi: "type", reasoningEcho: "required",
    reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "high", tempRange: [0, 2],
  }
  for (const name of ["deepseek-flash", "deepseek-v4-flash", "deepseek-v4-flash-vision-exp"]) {
    const spec = specForModel(name)
    for (const [k, v] of Object.entries(CONTRACT)) assert.deepEqual(spec[k], v, `${name}.${k} = 契约值`)
    assert.deepEqual(Object.keys(spec).sort(), Object.keys(CONTRACT).sort(), `${name} 字段集 = 契约`)
  }
  assert.deepEqual(findVisionChannel([{ name: "ds", model: "deepseek-flash" }]),
    { provider: "ds", model: "deepseek-flash" }, "新名渠道被选中（不再 null——R11）")
  assert.deepEqual(findVisionChannel([{ name: "ds", model: "deepseek-v4-flash" }]),
    { provider: "ds", model: "deepseek-v4-flash" }, "退役名渠道进入视觉判据（R12——行为变化）")
})

test("T38 第 6 批：pro 只读字段锚（R14——字段零改 + 非视觉保守——防误改）", async () => {
  const { specForModel } = await import("../src/config.mjs")
  const pro = specForModel("deepseek-v4-pro")
  assert.ok(!pro.multimodal, "不加 multimodal（视觉能力未核实——保守）")
  assert.equal(pro.context, 1_000_000, "context 零改")
  assert.equal(pro.maxOutput, 384_000, "maxOutput 零改")
  assert.equal(pro.prefixMode, true, "prefixMode 零改")
  assert.deepEqual(pro.reasoningEffortEnum, ["low", "high", "max"], "effort enum 零改")
})


test("F-2 spawn 失败/超时/空返 → fallback（images 原样——文本零改动）", async () => {
  for (const mock of [
    async () => { throw new Error("vision channel down") }, // spawn 失败 / 超时（runAgent throw → runner null 同路）
    async () => null, // 无返回
    async () => ({ ok: true, description: "   " }), // 空描述——不入注入
  ]) {
    const panel = stubPanel()
    await routeUserTurn(panel, { text: "看图", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [DATAURL], visionReader: mock })
    const [text, , , , imgs] = panel._chatCalls[0]
    assert.equal(text, "看图", "fallback：文本零改动")
    assert.ok(Array.isArray(imgs) && imgs.length === 1, "fallback：images 保留下发")
  }
})

// ─── A12（群 A 批）：降级窗内 Stop（⏹）定向 abort ─────────────────────────────
// 设计权威：`docs/design/IMAGE-DOWNGRADE-VISION.md`「跟进修复」节（C-MA12-1..6 / T-MA12-1..3）。

test("T-MA12-1 正常：窗内 abort → 定向命中 _visionAbort + await 提前返回 + _chat 照常 + 闩落位", async () => {
  const panel = stubPanel()
  const runner = (arg) => new Promise((_, reject) => {
    arg.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
  })
  const p = routeUserTurn(panel, { text: "看图", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [DATAURL], visionReader: runner })
  await new Promise((r) => setTimeout(r, 20)) // 窗打开（runner 已进入挂起态）
  const vad = panel._visionAbort
  assert.ok(vad && !vad.signal.aborted, "窗前挂位：_visionAbort 活")
  await handlePanelMessage(panel, { type: "abort" })
  assert.equal(vad.signal.aborted, true, "窗内 Stop 定向命中降级窗 controller")
  await p
  assert.equal(panel._chatCalls.length, 1, "await 提前返回后回合照常建立（消息在——不丢）")
  const [text, , , , imgs] = panel._chatCalls[0]
  assert.equal(text, "看图", "停后文本零改动（fallback 语义复用）")
  assert.ok(Array.isArray(imgs) && imgs.length === 1, "images 保留下发")
  assert.equal(panel._abortRequested, true, "启动即中止闩落位（newTurnController 消费）")
  assert.equal(panel._visionAbort, null, "窗控制器幂等清理")
})

test("T-MA12-2 边界（零回归）：无降级窗 abort → 既有分支零变（活 controller 交付 / 僵尸置闩）", async () => {
  const live = stubPanel()
  live._turnState = "running"
  live._abortController = new AbortController()
  await handlePanelMessage(live, { type: "abort" })
  assert.equal(live._abortController.signal.aborted, true, "活 controller 照常交付（既有路径）")
  assert.equal(live._abortRequested, undefined, "活 controller 不置闩（既有语义零变）")

  const zombie = stubPanel()
  zombie._turnState = "running"
  zombie._abortController = new AbortController()
  zombie._abortController.abort() // 上回合遗留僵尸
  await handlePanelMessage(zombie, { type: "abort" })
  assert.equal(zombie._abortRequested, true, "僵尸 controller 照常置闩（既有语义零变）")
})

test("T-MA12-3 边界（缝兼容）：runVisionReader ① 预 aborted signal → 快速 null ② 不传 signal → 现状", async () => {
  const ac = new AbortController()
  ac.abort()
  const t0 = Date.now()
  assert.equal(await runVisionReader({ paths: ["x.png"], providerName: "ds", cwd: _tmp, signal: ac.signal }), null, "预 aborted → null")
  assert.ok(Date.now() - t0 < 5000, "快速失败——不复用 60s 超时窗")
  assert.equal(await runVisionReader({ paths: ["x.png"], providerName: "ds", cwd: _tmp }), null, "不传 signal → 现状（无视觉渠道 null）")
})
