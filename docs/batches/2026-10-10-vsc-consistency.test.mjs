/**
 * 2026-10-10-vsc-consistency.test.mjs — 批内件（VSC 舱：#1051 请求 id 归属 ∥ #1101㈠ 锚记忆与未选定面）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-10-vsc-consistency.test.mjs`
 * 不入仓套件 · 随批留存归档（判据语义 = 批档 §2 KD-3 / KD-4 ∥ §2.4 用例面）。
 *
 * 腿：
 *   T-1051-1 上行携 id（同框双发单调递增）
 *   T-1051-2 宿主回显 id（原样 ∥ 缺 id ⇒ 不携）
 *   T-1051-3a 落框判据·旧框在飞果（关→开）⇒ 弃
 *   T-1051-3b 落框判据·当前 id ⇒ 落 + 重放同 id ⇒ 弃
 *   T-1051-3c 落框判据·关框后到达（框不在场）⇒ 弃
 *   T-1051-3d 落框判据·同框双发先旧后新 ⇒ 旧弃新落
 *   T-1101-1 锚记录读写助手（宽容读 ∥ 空值零写）
 *   T-1101-2 恢复点诸态（命中 ∥ 失配 ∥ 单根零读 ∥ 有 override ⇒ 零动作 ∥ 无记录）
 *   T-1101-3 写点两态（成功 ⇒ 记新锚 ∥ 拒径（非成员 ∥ 忙）⇒ 零写）
 *   T-1101-4 首开弹拍诸态（门四全过 ⇒ 弹一次 + 弹即写 ∥ 已弹过 ∥ 单根 ∥ 有 override ∥ 忙）
 *   T-1101-5 webview 标记两态（未选定附标记 ∥ 已选现形 ∥ 单根隐藏）
 *   T-1051-4 接线源锁（chat-messages 原样透传 ∥ resolve 弹拍调用点 ∥ 跟随写点）
 *   T-1101-6 构造内恢复时序（首个订阅 push 之时恢复已生效）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  EN, vsc, vscSrc, byId, clearAll, postSink, setFolders, mkMemento, mkHostPanel,
  dialog, sessionBar, sessionIo, panelMessages, panelProject, settingsHandlers,
} from "./2026-10-10-vsc-consistency.harness.mjs"

const A = "/ws/a"
const B = "/ws/b"

// ─── #1051：请求 id 归属（上行 ∥ 宿主回显 ∥ 落框判据）──────────────────────────

/** 开框 + custom 形 + 填 URL（拉取前置就绪）；返回 `#pa-conn-status` 状态行件。 */
const openAndFill = (url = "https://p.example.com/v1") => {
  dialog.openAddProviderDialog()
  byId("pa-type").value = "custom"
  byId("pa-type").fire("change")
  byId("pa-url").value = url
  return byId("pa-conn-status")
}
const fetchOnce = () => { postSink.length = 0; byId("pa-fetch-btn").fire("click"); return postSink[0] }

test("T-1051-1 上行携 id：拉取发点载荷携 `id`（number）∥ 同框双发单调递增", () => {
  clearAll()
  openAndFill()
  const p1 = fetchOnce()
  assert.equal(p1.type, "testProvider", "载荷族零改")
  assert.equal(p1.baseURL, "https://p.example.com/v1", "baseURL 逐字")
  assert.equal(typeof p1.id, "number", "载荷携 `id`（number）")
  const p2 = fetchOnce()
  assert.ok(p2.id > p1.id, `同框双发 id 单调递增（${p1.id} < ${p2.id}）`)
  dialog.closeAddProviderDialog()
})

test("T-1051-2 宿主回显：结果携 `id` 原样 ∥ 载荷缺 id ⇒ 结果不携 id 键", async () => {
  const sink = []
  const panel = { _panel: { webview: { postMessage: (m) => sink.push(m) } } }
  await settingsHandlers.handleTestProvider(panel, { baseURL: "http://127.0.0.1:9/v1", apiKey: "k", format: "openai", id: 7 })
  const hit = sink.find((m) => m.type === "testProviderResult")
  assert.ok(hit, "结果在场（探败亦回投）")
  assert.equal(hit.id, 7, "id 原样回显（旧框拦截判据源）")
  assert.equal(hit.ok, false, "127.0.0.1:9 探败（本腿只判 id 通道）")
  sink.length = 0
  await settingsHandlers.handleTestProvider(panel, { baseURL: "http://127.0.0.1:9/v1", apiKey: "k", format: "openai" })
  const hit2 = sink.find((m) => m.type === "testProviderResult")
  assert.ok(hit2, "无 id 发送方：结果仍在")
  assert.equal("id" in hit2, false, "缺 id ⇒ 结果不携 id 键（新判据下 webview 早退——零假渲染）")
})

test("T-1051-3a 落框判据·旧框在飞果弃：关→开后旧 id 到达 ⇒ 状态行零变", () => {
  clearAll()
  openAndFill()
  const stale = fetchOnce()
  dialog.closeAddProviderDialog()
  const status = openAndFill()
  status.textContent = "sentinel"
  dialog.updateTestProviderResult({ ok: true, models: ["a"], id: stale.id })
  assert.equal(status.textContent, "sentinel", "跨框旧果 ⇒ 弃（零渲染）")
  assert.notEqual(status.style.color, "var(--green)", "零染色")
  dialog.closeAddProviderDialog()
})

test("T-1051-3b 落框判据·当前 id 落 + 重放弃：命中 ⇒ 渲染（✓/✗）∥ 同 id 重放 ⇒ 弃", () => {
  clearAll()
  const status = openAndFill()
  const live = fetchOnce()
  dialog.updateTestProviderResult({ ok: true, models: ["a", "b"], id: live.id })
  assert.equal(status.textContent, EN["settings.connOk"].replace("${count}", "2"), "命中 ⇒ 状态行 ✓（计数随探果）")
  assert.equal(status.style.color, "var(--green)", "探通染色")
  status.textContent = "sentinel"
  dialog.updateTestProviderResult({ ok: true, models: ["a", "b"], id: live.id })
  assert.equal(status.textContent, "sentinel", "同 id 重放 ⇒ 弃（命中即清在飞 id）")
  // 探败支同判：新发 id ⇒ ✗ 文面
  const live2 = fetchOnce()
  dialog.updateTestProviderResult({ ok: false, error: "boom", id: live2.id })
  assert.equal(status.textContent, "✗ boom", "命中 ⇒ 状态行 ✗（探败文面）")
  assert.equal(status.style.color, "var(--red)", "探败染色")
  dialog.closeAddProviderDialog()
})

test("T-1051-3c 落框判据·关框后到达：框不在场 ⇒ 弃（零抛零动作）", () => {
  clearAll()
  openAndFill()
  const live = fetchOnce()
  dialog.closeAddProviderDialog()
  assert.doesNotThrow(() => dialog.updateTestProviderResult({ ok: true, models: [], id: live.id }), "关框后到达零抛")
  assert.equal(byId("pa-conn-status"), null, "框不在场（实件面弃置——无幻影桩）")
})

test("T-1051-3d 落框判据·同框双发先旧后新：先发果弃 ∥ 后发果落", () => {
  clearAll()
  const status = openAndFill()
  const first = fetchOnce()
  const second = fetchOnce()
  status.textContent = "sentinel"
  dialog.updateTestProviderResult({ ok: true, models: ["old"], id: first.id })
  assert.equal(status.textContent, "sentinel", "先发果（已被后发覆盖在飞 id）⇒ 弃")
  dialog.updateTestProviderResult({ ok: true, models: ["new"], id: second.id })
  assert.equal(status.textContent, EN["settings.connOk"].replace("${count}", "1"), "后发果 ⇒ 落（旧弃新落）")
  dialog.closeAddProviderDialog()
})

// ─── #1101㈠ (b)：锚记忆（读写 ∥ 恢复 ∥ 写点）──────────────────────────────────

const resetWs = () => { panelMessages.clearProjectOverride(); setFolders(A, B) }

test("T-1101-1 锚记录读写助手：缺 ⇒ 空串 ∥ 写后读回 ∥ 空值零写 ∥ 抛不反扑", () => {
  const ws = mkMemento()
  assert.equal(sessionIo.loadProjectFolder(ws), "", "缺记录 ⇒ 空串")
  sessionIo.saveProjectFolder(ws, B)
  assert.equal(sessionIo.loadProjectFolder(ws), B, "写后读回（fsPath 串）")
  sessionIo.saveProjectFolder(ws, "")
  assert.equal(sessionIo.loadProjectFolder(ws), B, "空值不落盘（不允许把「无锚」写成记录）")
  const boom = { get() { throw new Error("boom") }, update() { throw new Error("boom") } }
  assert.equal(sessionIo.loadProjectFolder(boom), "", "读抛 ⇒ 空串（宽容）")
  assert.doesNotThrow(() => sessionIo.saveProjectFolder(boom, A), "写抛 ⇒ 不反扑")
})

test("T-1101-2 恢复点诸态：命中 ⇒ 恢复锚；失配 ∥ 单根（零读）∥ 有 override ∥ 无记录 ⇒ 零动作", () => {
  // ① 命中：多根 ∧ 无 override ∧ 记录 ∈ folders ⇒ `_cwd` = 记录（零写）
  resetWs()
  const wsHit = mkMemento({ "thincoder.projectFolder": B })
  assert.equal(panelProject.restoreProjectFolder({ _context: { workspaceState: wsHit } }), true, "命中 ⇒ 恢复生效")
  assert.equal(panelMessages._cwd(), B, "_cwd 恢复锚（全链随动）")
  assert.equal(wsHit.calls.update, 0, "恢复 = 只读零写")
  // ② 失配（记录 ∉ folders）：零动作 + `_cwd` 仍首根
  panelMessages.clearProjectOverride()
  const wsGone = mkMemento({ "thincoder.projectFolder": "/ws/gone" })
  assert.equal(panelProject.restoreProjectFolder({ _context: { workspaceState: wsGone } }), false, "失效记录 ⇒ 零动作（不抛）")
  assert.equal(panelMessages._cwd(), A, "失效记录不回改 _cwd（首根兜底）")
  // ③ 单根：不读不写（`get` 计数 = 0——先于读早退）
  panelMessages.clearProjectOverride()
  setFolders(A)
  const wsSingle = mkMemento({ "thincoder.projectFolder": B })
  assert.equal(panelProject.restoreProjectFolder({ _context: { workspaceState: wsSingle } }), false, "单根 ⇒ 零动作")
  assert.equal(wsSingle.calls.get, 0, "单根 ⇒ 不读（零读零写）")
  // ④ 有活 override：零动作（记录不回改活锚——「记录 = 最后成功切换 · 非活锚」）
  resetWs()
  panelMessages.setProjectFolder(B)
  assert.equal(panelProject.restoreProjectFolder({ _context: { workspaceState: mkMemento({ "thincoder.projectFolder": A }) } }), false, "有 override ⇒ 零动作")
  assert.equal(panelMessages._cwd(), B, "活锚保持（记录不越权）")
  // ⑤ 无记录 ⇒ 零动作
  panelMessages.clearProjectOverride()
  assert.equal(panelProject.restoreProjectFolder({ _context: { workspaceState: mkMemento() } }), false, "无记录 ⇒ 零动作")
  assert.equal(panelMessages._cwd(), A, "_cwd 不动")
})

test("T-1101-3 写点两态：成功切换 ⇒ 记录 = 新 fsPath；拒径（非成员 ∥ 忙）⇒ 零写", async () => {
  // ① 拒径甲：非成员（setProjectFolder 成员校验拒）
  resetWs()
  const wsOutside = mkMemento()
  await panelProject.applyProjectSwitch(mkHostPanel([], wsOutside), "/outside")
  assert.equal(wsOutside.calls.update, 0, "非成员拒 ⇒ 零写")
  assert.equal(panelMessages._cwd(), A, "_cwd 不动")
  // ② 拒径乙：忙（turnBusy 硬拒——先于一切写）
  const wsBusy = mkMemento()
  const busyPanel = { ...mkHostPanel([], wsBusy), turnBusy: () => true }
  await panelProject.applyProjectSwitch(busyPanel, B)
  assert.equal(wsBusy.calls.update, 0, "忙拒 ⇒ 零写")
  // ③ 成功径：记录 = 新 fsPath（真切换链跑通）
  const wsOk = mkMemento()
  sessionIo._setSessionsDirForTest(mkdtempSync(join(tmpdir(), "vsc-consistency-sess-")))
  try {
    await panelProject.applyProjectSwitch(mkHostPanel([], wsOk), B)
  } finally {
    sessionIo._resetSessionsDirForTest()
  }
  assert.equal(sessionIo.loadProjectFolder(wsOk), B, "成功 ⇒ 记录 = 新 fsPath")
  assert.equal(panelMessages._cwd(), B, "成功 ⇒ 活动锚翻")
  panelMessages.clearProjectOverride()
})

// ─── #1101㈠ (a)：首开弹拍 ∥ 未选定标记 ────────────────────────────────────────

test("T-1101-4 首开弹拍：门四全过 ⇒ 弹一次 + 弹即写；已弹过 ∥ 单根 ∥ 有 override ∥ 忙 ⇒ 零动作", async () => {
  const picks = []
  globalThis.__vscQuickPick = async (items) => { picks.push(items); return undefined } // ESC = 取消（结果无关）
  try {
    // ① 全过 ⇒ 弹（写标记先于选择结果）
    resetWs()
    const ws = mkMemento()
    const panel = { _context: { workspaceState: ws }, turnBusy: () => false }
    assert.equal(await panelProject.maybeOfferProjectPick(panel), true, "门四全过 ⇒ 弹拍发生")
    assert.equal(picks.length, 1, "恰弹一次（复用 pickProject——零新选择器）")
    assert.equal(ws.get("thincoder.projectPickOffered"), true, "弹即写标记（ESC 后不再主动弹）")
    // ② 已弹过 ⇒ 零动作
    assert.equal(await panelProject.maybeOfferProjectPick(panel), false, "已弹过 ⇒ 零动作")
    assert.equal(picks.length, 1, "频度 = 每工作区恰一次")
    // ③ 单根 ⇒ 零动作
    setFolders(A)
    assert.equal(await panelProject.maybeOfferProjectPick({ _context: { workspaceState: mkMemento() }, turnBusy: () => false }), false, "单根 ⇒ 零动作")
    // ④ 有活 override ⇒ 零动作
    resetWs()
    panelMessages.setProjectFolder(B)
    assert.equal(await panelProject.maybeOfferProjectPick({ _context: { workspaceState: mkMemento() }, turnBusy: () => false }), false, "已选定 ⇒ 零动作")
    // ⑤ 忙 ⇒ 零动作
    panelMessages.clearProjectOverride()
    assert.equal(await panelProject.maybeOfferProjectPick({ _context: { workspaceState: mkMemento() }, turnBusy: () => true }), false, "忙 ⇒ 零动作")
    assert.equal(picks.length, 1, "后三态零弹（picks 零增）")
  } finally {
    globalThis.__vscQuickPick = undefined
  }
})

test("T-1101-5 webview 未选定标记两态：未选定 ⇒ 名后附标记（文本 ∥ title）；已选 ⇒ 现形；单根 ⇒ 隐藏", () => {
  clearAll()
  const btn = byId("project-btn")
  const base = { folders: [{ name: "a", path: A }, { name: "b", path: B }], current: B, followActive: false }
  sessionBar.handleProjectMessage({ ...base, multi: true, chosen: false })
  assert.equal(btn.textContent, "📁 b · " + EN["project.notChosen"], "未选定 ⇒ 文本附标记")
  assert.equal(btn.title, B + " · " + EN["project.notChosen"], "title 同携标记")
  sessionBar.handleProjectMessage({ ...base, multi: true, chosen: true })
  assert.equal(btn.textContent, "📁 b", "已选定 ⇒ 现形（零标记）")
  assert.equal(btn.title, B, "title 现形")
  sessionBar.handleProjectMessage({ ...base, multi: false, chosen: false })
  assert.equal(btn.style.display, "none", "单根 ⇒ 隐藏（零变）")
  // 跟随开：标记与跟随附句同携（title 组合式）
  sessionBar.handleProjectMessage({ ...base, multi: true, chosen: false, followActive: true })
  assert.equal(btn.title, `${B} · ${EN["project.followActiveOn"]} · ${EN["project.notChosen"]}`, "跟随附句 + 未选定标记同携")
})

// ─── 接线（源锁）+ 构造内时序 ─────────────────────────────────────────────────

test("T-1051-4 接线源锁：webview 全量透传 `m` ∥ 跟随写点 ∥ resolve 弹拍调用点", () => {
  assert.match(vscSrc("webview/chat-messages.js"), /case "testProviderResult":\s*updateTestProviderResult\(m\)/, "chat-messages 原样透传（`m` 携 id——webview 零改）")
  assert.match(vscSrc("webview/settings-provider-dialog.js"), /r\.id !== _pendingFetchId/, "落框判据 = id 归属（代际变量已退场）")
  assert.equal((vscSrc("webview/settings-provider-dialog.js").match(/_addDialogEpoch|_fetchEpoch/g) ?? []).length, 0, "代际变量零残留")
  const chat = vscSrc("src/extension/chat-panel.mjs")
  const rw = chat.indexOf("resolveWebviewView(webviewView")
  const offer = chat.indexOf("maybeOfferProjectPick(this)")
  assert.ok(rw >= 0 && offer > rw, "弹拍调用点在 resolveWebviewView 内（面板首开拍）")
  assert.ok(chat.includes("rememberProjectFolder(this, folder.uri.fsPath)"), "跟随自动切换写点在场（与显式切换器同点同义）")
})

test("T-1101-6 构造内恢复时序：首个订阅 push 之时恢复已生效（构造内 · 订阅块之前）", async () => {
  const { ChatPanel } = await import(vsc("src/extension/chat-panel.mjs"))
  resetWs()
  const ws = mkMemento({ "thincoder.projectFolder": B })
  const observed = []
  const ctx = {
    workspaceState: ws,
    subscriptions: { push: (...items) => { observed.push(panelMessages._cwd()); return items.length } },
  }
  new ChatPanel(ctx)
  assert.equal(observed.length, 2, "订阅块仍注册两件（接线零改）")
  assert.equal(observed[0], B, "首个订阅 push 时恢复已生效（先于订阅块——先于一切 _cwd() 消费）")
  assert.equal(sessionIo.loadProjectFolder(ws), B, "恢复只读（记录零改）")
  panelMessages.clearProjectOverride()
})
