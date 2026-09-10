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
import { routeUserTurn, setProjectFolder, clearProjectOverride } from "../src/extension/panel-messages.mjs"
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
