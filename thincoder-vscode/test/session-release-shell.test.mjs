/**
 * session-release-shell.test.mjs — 会话认领释放端壳面（2026-09-22 pending-triage 批 ·
 * `docs/batches/2026-09-22-pending-triage.md` §2 · 台账 #168②③；判据 = `docs/core/design/SESSION.md`
 * §6.15 / §6.16）：
 *   T1 `newSlot` 落点 release 传参在效——保留集 = {新槽}，本进程残留认领被释放；
 *   T2 `switchToSlot` 未占落点同——保留集 = {落点槽}；
 *   T3 被占分支**零释放零写** + 可区分信号（`SLOT_OCCUPIED`）——台账 #171 形态面；
 *   T4 项目切换 ⇒ **旧 cwd** 认领释放（跨 cwd——#168②）。
 * 由 = 端壳 release 传参原仅经核 `saveManifest` 单源间接验证 ⇒ 本档补端壳级用例（#168③）。
 * 手法：tmp 会话沙箱（`_setSessionsDirForTest`，目录 = 核存储根）+ 真核落盘 + 探测注入缝
 * （`process-probe`——他端活属主伪造，同 session-boot ⑮先例）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"

import {
  SLOT_OCCUPIED, newSlot, switchToSlot, cachedSlot, claimSlot, getSessionId, loadManifest, saveManifest,
  saveSessionToSlot, readEndMarker, _setSessionsDirForTest, _resetSessionsDirForTest,
} from "../src/extension/session-io.mjs"
import { applyProjectSwitch, releaseOldCwdClaims } from "../src/extension/panel-project.mjs"
import { _releaseStats } from "@thincoder/core/session-slots-manifest.mjs"
import { _cwd, clearProjectOverride, setProjectFolder } from "../src/extension/panel-messages.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { _setProcessProbeTestImpl, _resetProcessProbeTestImpl } from "@thincoder/core/process-probe.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"

const OTHER_PID = 43434
const stubLiveOther = () => _setProcessProbeTestImpl({
  aliveFn: (pids) => new Set([...pids].filter((p) => p === OTHER_PID)),
  cmdlineFn: (pids) => new Map([...pids].map((p) => [p, "node bin/thincoder.cjs"])),
})

let sessionsDir
beforeEach(() => { sessionsDir = mkdtempSync(join(tmpdir(), "tc-release-shell-")) ; _setSessionsDirForTest(sessionsDir) })
afterEach(() => { _resetProcessProbeTestImpl(); clearProjectOverride(); _resetSessionsDirForTest(); try { rmSync(sessionsDir, { recursive: true, force: true }) } catch { /* ignore */ } })

/** 槽 fixture：文件 + manifest 条目（`switchToSlot` 需 m.slots 条目 + 可读槽文件）。 */
function seedSlot(cwd, slot, owner = null) {
  saveSessionToSlot(cwd, slot, { version: 2, cwd, title: "", updatedAt: 1, history: [{ role: "user", content: `s${slot}`, ts: 1 }], contextHistory: [], sessionStart: null })
  const m = loadManifest(cwd)
  m.slots[slot] = { updatedAt: 1 }
  if (owner) m.slotSessions = { ...(m.slotSessions ?? {}), [slot]: owner }
  saveManifest(cwd, m)
}

// ─── T1 / T2：未占落点携带 release 语义 ─────────────────────────────────────

test("T1 newSlot 落点：release 传参在效——本进程残留认领被释放（保留集 = {新槽}）", async () => {
  const cwd = "C:\\proj\\tc-release-new"
  seedSlot(cwd, 1) // 占住 1 号（文件在盘）⇒ 新槽必为 2
  claimSlot(cwd, 3) // 本进程残留认领（另一槽——释放面判据的观察对象）
  assert.equal(loadManifest(cwd).slotSessions[3], getSessionId(), "夹具：3 号属本进程")

  assert.equal(await newSlot(cwd), 2, "新槽 = 2（1 号被占）")
  const m = loadManifest(cwd)
  assert.equal(m.slotSessions[2], getSessionId(), "新槽认领落盘")
  assert.equal(m.slotSessions[3], undefined, "残留认领被释放（release 传参在效——值条件删除）")
  assert.equal(cachedSlot(cwd), 2, "绑定事实写穿解析缓存")
})

test("T2 switchToSlot 未占落点：残留认领释放（保留集 = {落点槽}）", () => {
  const cwd = "C:\\proj\\tc-release-switch"
  seedSlot(cwd, 5)
  claimSlot(cwd, 3) // 残留认领
  const data = switchToSlot(cwd, 5)
  assert.ok(data && data.occupied === undefined, "未占 ⇒ 返回槽数据（非信号、非 null）")
  const m = loadManifest(cwd)
  assert.equal(m.slotSessions[5], getSessionId(), "落点槽认领")
  assert.equal(m.active, 5, "共享指针翻到落点槽")
  assert.equal(m.slotSessions[3], undefined, "残留认领释放（保留集 = {落点槽}）")
})

test("T3 被占分支：零释放零写 + 可区分信号（台账 #171 形态面）", () => {
  const cwd = "C:\\proj\\tc-release-occupied"
  seedSlot(cwd, 7, `${OTHER_PID}-other-end`) // 他端活属主（伪造）
  claimSlot(cwd, 3) // 本进程残留认领——被占分支不得释放
  stubLiveOther()
  const before = loadManifest(cwd)
  const markerBefore = readEndMarker(cwd)?.slot ?? null

  const target = switchToSlot(cwd, 7)
  assert.equal(target, SLOT_OCCUPIED, "受占分支返回可区分信号（与成功 data / null 三态可判别）")
  assert.equal(target.occupied, true, "信号形态 = { occupied: true }")

  const after = loadManifest(cwd)
  assert.deepEqual(after.slotSessions, before.slotSessions, "零释放：认领集逐字段零动（含本进程残留认领 3）")
  assert.equal(after.active, before.active, "零写：共享 active 指针零动（判定前置于赋值）")
  assert.equal(readEndMarker(cwd)?.slot ?? null, markerBefore, "零写：本端记录零动")
  assert.notEqual(cachedSlot(cwd), 7, "零写：解析缓存不写他端占槽")

  // 对照（反证信号非恒返）：同槽空闲（seam 判死——零真实探测）⇒ 成功返回槽数据
  _setProcessProbeTestImpl({ aliveFn: () => new Set(), cmdlineFn: () => new Map() })
  const ok = switchToSlot(cwd, 7)
  assert.ok(ok && ok.occupied === undefined, "空闲 ⇒ 返回槽数据（非信号）")
  assert.equal(loadManifest(cwd).slotSessions[7], getSessionId(), "对照：认领确实发生（前段零释放非空转）")
})

// ─── T4：项目切换 ⇒ 旧 cwd 认领释放（#168②）───────────────────────────────

const stubPanel = (extra = {}) => Object.assign(Object.create(ChatPanel.prototype), {
  _slot: null, _agent: null, _liveLines: null, _distillController: null,
  _susp: null, _context: {
    subscriptions: [],
    secrets: { get: async () => undefined, delete: async () => {} },
    globalState: { get: async () => undefined, update: async () => {} },
    workspaceState: { get: () => undefined, update: async () => {} },
  },
  _panel: { webview: { postMessage: async () => true } },
  turnBusy: () => false,
}, extra)

/** 微任务/短定时冲刷（`_onProjectChanged` 为未 await 的异步链——同 session-boot 手法）。 */
const settle = () => new Promise((r) => setTimeout(r, 10))

test("T4 项目切换：旧 cwd 认领释放（跨 cwd——#168②）", async () => {
  const oldCwd = "C:\\proj\\tc-release-old"
  const newCwd = "C:\\proj\\tc-release-new-root"
  const cfgDir = mkdtempSync(join(tmpdir(), "tc-release-cfg-"))
  _setConfigPathForTest(join(cfgDir, "config.json"))
  claimSlot(oldCwd, 4) // 旧 cwd 残留认领（切换后本进程已无活绑定 ⇒ 应释放）
  assert.equal(loadManifest(oldCwd).slotSessions[4], getSessionId(), "夹具：旧 cwd 4 号属本进程")
  // 他端活属主条目（值条件删除的观察对象——§4 行 5 判据后半「他端活认领不动」）
  const seedM = loadManifest(oldCwd)
  seedM.slotSessions = { ...(seedM.slotSessions ?? {}), 9: `${OTHER_PID}-other-end` }
  saveManifest(oldCwd, seedM)

  const savedFolders = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: oldCwd } }, { uri: { fsPath: newCwd } }]
  clearProjectOverride() // _cwd() = folders[0] = 旧 cwd
  try {
    await applyProjectSwitch(stubPanel(), newCwd)

    assert.equal(loadManifest(oldCwd).slotSessions?.[4], undefined, "旧 cwd 认领已释放（跨 cwd 释放——落点在切换成功之后）")
    assert.equal(loadManifest(oldCwd).slotSessions?.[9], `${OTHER_PID}-other-end`, "他端活认领零动（值条件删除不误删——§4 行 5 后半）")
    const newM = loadManifest(newCwd)
    assert.equal(newM.slotSessions?.[newM.active], getSessionId(), "新 cwd 重绑：本进程认领新槽（onProjectChanged 认领链）")
  } finally {
    vscode.workspace.workspaceFolders = savedFolders
    clearProjectOverride()
    _setConfigPathForTest(null)
    try { rmSync(cfgDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("T5 跟随活动编辑器自动切换：旧 cwd 认领释放（与显式切换器同面——#168② 覆盖面）", async () => {
  const oldCwd = "C:\\proj\\tc-release-follow-old"
  const newCwd = "C:\\proj\\tc-release-follow-new"
  const cfgDir = mkdtempSync(join(tmpdir(), "tc-release-follow-cfg-"))
  _setConfigPathForTest(join(cfgDir, "config.json"))
  claimSlot(oldCwd, 6) // 旧 cwd 残留认领（follow 自动切换后本进程已无活绑定 ⇒ 应释放）
  assert.equal(loadManifest(oldCwd).slotSessions[6], getSessionId(), "夹具：旧 cwd 6 号属本进程")

  const saved = {
    folders: vscode.workspace.workspaceFolders,
    getCfg: vscode.workspace.getConfiguration,
    getFolder: vscode.workspace.getWorkspaceFolder,
    onEd: vscode.window.onDidChangeActiveTextEditor,
    onCfg: vscode.workspace.onDidChangeConfiguration,
  }
  const editors = []
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: oldCwd } }, { uri: { fsPath: newCwd } }]
  clearProjectOverride() // _cwd() = folders[0] = 旧 cwd
  vscode.workspace.getConfiguration = (section) => (section === "thincoder.project"
    ? { get: (k, d) => (k === "followActiveEditor" ? true : d) }
    : { get: (_k, d) => d })
  vscode.workspace.getWorkspaceFolder = () => ({ uri: { fsPath: newCwd } }) // mock 无此 API——本用例自备
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  vscode.window.onDidChangeActiveTextEditor = (cb) => { editors.push(cb); return { dispose: () => {} } }
  const savedLang = vscode.env.language
  vscode.env.language = "en" // 面板装载链需 i18n locale（mock 缺省——同 session-boot 手法）
  try {
    const ctx = {
      subscriptions: [],
      secrets: { get: async () => undefined, delete: async () => {} },
      globalState: { get: async () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
    }
    const p = new ChatPanel(ctx) // 真构造（follow 监听器注册在构造器内）
    assert.equal(editors.length, 1, "follow 监听器已注册（激活路径）")

    editors[0]({ document: { uri: { fsPath: `${newCwd}\\README.md` } } })
    for (let i = 0; i < 50 && p._slot == null; i++) await settle() // 未 await 的 `_onProjectChanged` 链

    assert.equal(_cwd(), newCwd, "follow 自动切换生效（cwd 已翻）")
    assert.equal(loadManifest(oldCwd).slotSessions?.[6], undefined, "旧 cwd 认领已释放（follow 支）")
    const newM = loadManifest(newCwd)
    assert.equal(newM.slotSessions?.[newM.active], getSessionId(), "新 cwd 重绑认领（follow 支）")
  } finally {
    vscode.workspace.workspaceFolders = saved.folders
    vscode.workspace.getConfiguration = saved.getCfg
    vscode.workspace.getWorkspaceFolder = saved.getFolder
    vscode.window.onDidChangeActiveTextEditor = saved.onEd
    vscode.workspace.onDidChangeConfiguration = saved.onCfg
    vscode.env.language = savedLang
    clearProjectOverride()
    _setConfigPathForTest(null)
    try { rmSync(cfgDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("T6 释放单点（三落点共用）：同 cwd ⇒ no-op；异 cwd ⇒ 释放（不误放当前 cwd）", () => {
  const cur = "C:\\proj\\tc-release-helper-cur"
  const old = "C:\\proj\\tc-release-helper-old"
  const savedFolders = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cur } }]
  clearProjectOverride() // _cwd() = cur
  try {
    claimSlot(cur, 3)
    assert.equal(releaseOldCwdClaims(cur), false, "入参 = 当前 cwd ⇒ no-op（返回 false）")
    assert.equal(loadManifest(cur).slotSessions[3], getSessionId(), "同 cwd no-op：认领零动")
    claimSlot(old, 5)
    assert.equal(releaseOldCwdClaims(old), true, "异 cwd ⇒ 释放（返回 true）")
    assert.equal(loadManifest(old).slotSessions?.[5], undefined, "旧 cwd 认领已释放")
    assert.equal(loadManifest(cur).slotSessions[3], getSessionId(), "当前 cwd 认领零动（跨 cwd 不误放）")
  } finally {
    vscode.workspace.workspaceFolders = savedFolders
    clearProjectOverride()
  }
})


// ─── RL：工作区转空支路（#231——F-CR4 同族第三落点接线）─────────────────────

test("RL-1 正常：工作区转空 ⇒ 旧 cwd 释放恰一次（桩计数 = 1）+ 守卫态 / 槽解绑 / agent 销毁零变", () => {
  const oldCwd = "C:\\proj\\tc-release-empty-old"
  const otherCwd = "C:\\proj\\tc-release-empty-other"
  const cfgDir = mkdtempSync(join(tmpdir(), "tc-release-empty-cfg-"))
  _setConfigPathForTest(join(cfgDir, "config.json"))
  claimSlot(oldCwd, 4) // 旧 cwd 认领（转空后本进程已无活绑定 ⇒ 应释放）
  claimSlot(otherCwd, 5) // 异 cwd 对照（不得被误放）
  assert.equal(loadManifest(oldCwd).slotSessions[4], getSessionId(), "夹具：旧 cwd 4 号属本进程")

  const saved = {
    folders: vscode.workspace.workspaceFolders,
    onFolders: vscode.workspace.onDidChangeWorkspaceFolders,
    getCfg: vscode.workspace.getConfiguration,
    onCfg: vscode.workspace.onDidChangeConfiguration,
    getFolder: vscode.workspace.getWorkspaceFolder,
    lang: vscode.env.language,
    warning: vscode.window.showWarningMessage,
  }
  const handlers = []
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: oldCwd } }, { uri: { fsPath: otherCwd } }]
  clearProjectOverride()
  assert.equal(setProjectFolder(oldCwd).ok, true, "夹具：override = 旧 cwd（多根显式切换后）")
  assert.equal(_cwd(), oldCwd, "夹具：_cwd() = override = 旧 cwd")
  vscode.workspace.onDidChangeWorkspaceFolders = (cb) => { handlers.push(cb); return { dispose: () => {} } }
  vscode.workspace.getConfiguration = () => ({ get: (_k, d) => d })
  vscode.workspace.onDidChangeConfiguration = () => ({ dispose: () => {} })
  vscode.workspace.getWorkspaceFolder = () => undefined
  vscode.env.language = "en" // 面板装载链需 i18n locale（mock 缺省——同 T5 手法）
  vscode.window.showWarningMessage = async () => undefined // 守卫提示面（不真弹）
  try {
    const before = _releaseStats.calls
    const p = new ChatPanel({
      subscriptions: [],
      secrets: { get: async () => undefined, delete: async () => {} },
      globalState: { get: async () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
    }) // 真构造（workspaceFolders 监听器注册在构造器内）
    assert.equal(handlers.length, 1, "workspaceFolders 监听器已注册（激活路径）")
    p._slot = 4
    p._agent = { fake: true }

    vscode.workspace.workspaceFolders = [] // 工作区转空
    handlers[0]()

    assert.equal(_releaseStats.calls - before, 1, "旧 cwd 释放恰一次（releaseClaimsAll 桩计数 = 1）")
    assert.equal(loadManifest(oldCwd).slotSessions?.[4], undefined, "旧 cwd 认领已释放")
    assert.equal(loadManifest(otherCwd).slotSessions?.[5], getSessionId(), "异 cwd 认领零动（不误放）")
    assert.equal(p._slot, null, "槽解绑零变")
    assert.equal(p._agent, null, "agent 销毁零变")
    assert.equal(p._wsGuardNotified, true, "守卫态推送（once 去重标志置位）")
    assert.equal(releaseOldCwdClaims(oldCwd), false, "重复释放 = no-op（恰一次的效果面）")
  } finally {
    vscode.workspace.onDidChangeWorkspaceFolders = saved.onFolders
    vscode.workspace.getConfiguration = saved.getCfg
    vscode.workspace.onDidChangeConfiguration = saved.onCfg
    vscode.workspace.getWorkspaceFolder = saved.getFolder
    vscode.env.language = saved.lang
    vscode.window.showWarningMessage = saved.warning
    clearProjectOverride()
    _setConfigPathForTest(null)
    try { rmSync(cfgDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("RL-2 边界：转空后 `_cwd()` 与旧 cwd 同 ⇒ `releaseOldCwdClaims` 返回 false（no-op——既有语义保回归）", () => {
  const savedFolders = vscode.workspace.workspaceFolders
  const savedOnFolders = vscode.workspace.onDidChangeWorkspaceFolders
  const savedGetCfg = vscode.workspace.getConfiguration
  const savedLang = vscode.env.language
  const savedWarning = vscode.window.showWarningMessage
  const handlers = []
  vscode.workspace.workspaceFolders = [] // 无根 + 无 override ⇒ _cwd() = process.cwd()
  clearProjectOverride()
  vscode.workspace.onDidChangeWorkspaceFolders = (cb) => { handlers.push(cb); return { dispose: () => {} } }
  vscode.workspace.getConfiguration = () => ({ get: (_k, d) => d })
  vscode.env.language = "en"
  vscode.window.showWarningMessage = async () => undefined
  try {
    const p = new ChatPanel({ subscriptions: [], secrets: { get: async () => undefined, delete: async () => {} }, globalState: { get: async () => undefined, update: async () => {} }, workspaceState: { get: () => undefined, update: async () => {} } })
    assert.equal(handlers.length, 1, "workspaceFolders 监听器已注册")
    p._slot = 7 // 假活绑定（同 cwd 面：解绑照走，释放不调）
    const same = _cwd() // 旧 cwd = process.cwd()（转空前后同值——桩）
    const before = _releaseStats.calls
    handlers[0]()
    assert.equal(_releaseStats.calls - before, 0, "同 cwd ⇒ 零释放（单点内 no-op 分支）")
    assert.equal(p._slot, null, "槽解绑零变（支路其余动作不受影响）")
    assert.equal(releaseOldCwdClaims(same), false, "返回 false（no-op——既有语义保回归）")
  } finally {
    vscode.workspace.workspaceFolders = savedFolders
    vscode.workspace.onDidChangeWorkspaceFolders = savedOnFolders
    vscode.workspace.getConfiguration = savedGetCfg
    vscode.env.language = savedLang
    vscode.window.showWarningMessage = savedWarning
    clearProjectOverride()
  }
})

