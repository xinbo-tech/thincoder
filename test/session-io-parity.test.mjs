/**
 * session-io-parity.test.mjs — 2026-09-01 CLI 会诊修复同步回归（VS Code session-io 对齐）：
 *  F2 覆盖防护（.bak 轮转）、F4 认领不劫持有文件旧槽、newSlot 三重选号跳过、
 *  saveManifest 条目级合并、loadSlot 保留现场（.unreadable/.corrupted）。
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import * as vscode from "vscode"
import { newSlot, loadSlot, saveSessionToSlot, activeSlot, slotPath, manifestPath, saveManifest, loadManifest, deleteSlotAndUpdate, switchToSlot, endMarkerPath, readEndMarker, writeEndMarker, resumeSlot, getSessionId, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { activeLines, saveLines, ensureSlot, pushSessions } from "../src/extension/panel-session.mjs"
import { peerInstances, peerInstancesTool, _setAliveProbeForTest, _setCmdlineProbeForTest, _resetPeerInstancesForTest } from "../src/extension/peer-instances.mjs"
import { peersDir, registerDomains, flushDomains, peerDomains, _resetPeerDomainsForTest } from "../src/extension/peer-domains.mjs"
import { pushPeerReminder } from "../src/agent/setup-reminders.mjs"
import { _setConfigPathForTest, loadRaw, saveRaw } from "../src/config-io.mjs"

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "tc-io-parity-"))
  // 2026-09-01 advisor 🔵：sessions 目录注入 tmp——测试不再向真实 ~/.thincoder/sessions 写文件
  _setSessionsDirForTest(join(tmp, "sessions"))
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: tmp } }]
})
afterEach(() => { _resetSessionsDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

describe("session-io parity (CLI 会诊同步)", () => {
  it("F4: activeSlot does NOT hijack a slot whose file exists (dead owner)", () => {
    // slot 1：active 被"活进程"占用（当前 PID 不同 sessionId）；slot 2：死主 + 有文件
    const s1 = newSlot(tmp)
    const s2 = newSlot(tmp)
    const m = loadManifest(tmp)
    m.slotSessions[s1] = `${process.pid}-foreign`
    m.slotSessions[s2] = "99999999-dead"
    m.active = s1
    saveManifest(tmp, m, null, { setActive: true })
    assert.ok(existsSync(slotPath(tmp, s2)), "slot 2 file exists")

    const claimed = activeSlot(tmp)
    assert.notEqual(claimed, s2, "must not reclaim a slot whose FILE exists (would resume into a stranger session)")
    const saved = JSON.parse(readFileSync(slotPath(tmp, s2), "utf8"))
    assert.equal(saved.history.length, 0, "slot 2 untouched (still the empty new session)")
  })

  it("F2: saveSessionToSlot rotates a foreign-session slot to .bak before overwriting", () => {
    const slot = newSlot(tmp)
    // 旧会话（sessionStart 属于另一会话）
    const foreign = { version: 2, cwd: tmp, title: "old", updatedAt: Date.now(), history: [{ role: "user", content: "old session" }], sessionStart: "2026-08-01T00:00:00.000Z" }
    writeFileSync(slotPath(tmp, slot), JSON.stringify(foreign))
    // 新会话（sessionStart 不同）保存 → 必须轮转 .bak（返回值透出，不枚举全局 sessions 目录）
    const fresh = { version: 2, cwd: tmp, title: "new", updatedAt: Date.now(), history: [{ role: "user", content: "brand new" }], sessionStart: "2026-08-02T00:00:00.000Z" }
    const bak = saveSessionToSlot(tmp, slot, fresh)
    assert.ok(bak && bak.includes(`.json.${slot}.bak-`), `rotation happened (got ${bak})`)
    const bakData = JSON.parse(readFileSync(bak, "utf8"))
    assert.equal(bakData.history[0].content, "old session", ".bak holds the foreign session intact")
    const saved = JSON.parse(readFileSync(slotPath(tmp, slot), "utf8"))
    assert.equal(saved.history[0].content, "brand new", "new session written")
    try { unlinkSync(bak) } catch {}
  })

  it("F2: same-session resume does NOT rotate (sessionStart matches)", () => {
    const slot = newSlot(tmp)
    const data = { version: 2, cwd: tmp, title: "x", updatedAt: Date.now(), history: [{ role: "user", content: "a" }], sessionStart: "2026-08-01T00:00:00.000Z" }
    writeFileSync(slotPath(tmp, slot), JSON.stringify(data))
    const rotated = saveSessionToSlot(tmp, slot, { ...data, history: [{ role: "user", content: "b" }] })
    assert.equal(rotated, null, "no rotation on consistent resume")
    const saved = JSON.parse(readFileSync(slotPath(tmp, slot), "utf8"))
    assert.equal(saved.history[0].content, "b", "resumed session appended normally")
  })

  it("newSlot: skips a number whose FILE exists but manifest entry is gone", () => {
    const slot = newSlot(tmp)
    // 删 manifest 条目但保留文件（模拟丢失更新）——显式 deletions 才能真正从磁盘删除
    // 条目（saveManifest 条目级合并会把已删条目从 fresh 复活回写）
    const m = loadManifest(tmp)
    delete m.slots[slot]
    saveManifest(tmp, m, { slots: [slot] })
    assert.ok(existsSync(slotPath(tmp, slot)), "file still on disk")
    const next = newSlot(tmp)
    assert.notEqual(next, slot, "must not reuse a number whose file still exists")
  })

  it("saveManifest: entry-level merge preserves concurrent changes", () => {
    const slot = newSlot(tmp)
    const m = loadManifest(tmp)
    m.slots[7] = { ts: 1, title: "foreign" }
    m.slotSessions[7] = "99999-foreign"
    saveManifest(tmp, m)
    // 我方再保存（只改自己槽的 digest）→ 对方条目保留
    const m2 = loadManifest(tmp)
    m2.slots[slot] = { ts: Date.now(), title: "mine" }
    saveManifest(tmp, m2)
    const after = loadManifest(tmp)
    assert.equal(after.slots[7].title, "foreign", "foreign slot entry survives merge")
    assert.equal(after.slotSessions[7], "99999-foreign", "foreign ownership survives merge")
  })

  it("loadSlot: invalid structure is preserved as .unreadable, not silently dropped", () => {
    const slot = newSlot(tmp)
    writeFileSync(slotPath(tmp, slot), JSON.stringify({ version: 2, cwd: tmp, title: "bad", history: "not-an-array" }))
    const data = loadSlot(tmp, slot)
    assert.equal(data, null, "invalid structure → null")
    assert.ok(existsSync(`${slotPath(tmp, slot)}.unreadable`), "invalid file preserved as .unreadable")
  })

  it("deleteSlotAndUpdate: deletions + setActive keep the pointer consistent", () => {
    const s1 = newSlot(tmp)
    const s2 = newSlot(tmp)
    const m = loadManifest(tmp)
    m.active = s1
    saveManifest(tmp, m, null, { setActive: true })
    const next = deleteSlotAndUpdate(tmp, s1)
    assert.ok(next === s2 || next === null, `active falls to the remaining slot (got ${next})`)
    const after = loadManifest(tmp)
    assert.equal(after.slots[s1], undefined, "deleted slot entry gone (no merge resurrection)")
  })

  it("F2: saveSessionToSlot rotates a v3 file regardless of sessionStart (CLI deepseek 🟡 parity)", () => {
    const slot = newSlot(tmp)
    writeFileSync(slotPath(tmp, slot), JSON.stringify({ version: 3, cwd: tmp, title: "v3", history: [{ role: "user", content: "future" }], sessionStart: null }))
    const rotated = saveSessionToSlot(tmp, slot, { version: 2, cwd: tmp, title: "old cli", history: [{ role: "user", content: "x" }], sessionStart: null })
    assert.ok(rotated && rotated.includes(`.json.${slot}.bak-`), `v3 file rotated (got ${rotated})`)
    const bakData = JSON.parse(readFileSync(rotated, "utf8"))
    assert.equal(bakData.version, 3, ".bak preserves the newer-version file")
    try { unlinkSync(rotated) } catch {}
  })

  it("switchToSlot: does NOT flip the active pointer when the slot file is missing (advisor 🟡)", () => {
    const s1 = newSlot(tmp)
    const s2 = newSlot(tmp)
    const m = loadManifest(tmp)
    m.active = s1
    saveManifest(tmp, m, null, { setActive: true })
    // 删掉 slot 2 文件（manifest 条目仍在——模拟 F2 轮转后主文件已变 .bak）
    unlinkSync(slotPath(tmp, s2))
    const data = switchToSlot(tmp, s2)
    assert.equal(data, null, "missing file → null")
    const after = loadManifest(tmp)
    assert.equal(after.active, s1, "active pointer NOT flipped to the phantom slot")
  })
})

describe("session-io cross-end parity (2026-09-01 会诊 4 模型共识)", () => {
  it("saveLines stamps sessionStart once (kimi/qwen 🔴 — F2 身份此前恒 null)", () => {
    const slot = newSlot(tmp)
    const panel = { _slot: slot }
    saveLines(panel, [{ role: "user", content: "hi", type: "user" }], [{ role: "user", content: "hi" }], {})
    const data = JSON.parse(readFileSync(slotPath(tmp, slot), "utf8"))
    assert.ok(data.sessionStart, `sessionStart stamped (got ${data.sessionStart})`)
    // 二次保存保持同一 start（不重打）
    saveLines(panel, [{ role: "user", content: "hi2", type: "user" }], [{ role: "user", content: "hi2" }], {})
    const data2 = JSON.parse(readFileSync(slotPath(tmp, slot), "utf8"))
    assert.equal(data2.sessionStart, data.sessionStart, "same-session start preserved")
  })

  it("activeLines: contextHistory:[] + non-empty history falls back to the human line (deepseek/glm/kimi 🟡)", () => {
    const slot = newSlot(tmp)
    const hist = [{ role: "user", content: "a" }, { role: "assistant", content: "b" }]
    writeFileSync(slotPath(tmp, slot), JSON.stringify({ version: 2, cwd: tmp, history: hist, contextHistory: [], sessionStart: "2026-08-01T00:00:00.000Z" }))
    const lines = activeLines({ _slot: slot })
    assert.deepEqual(lines.contextHistory, hist, "empty machine line → fallback to full history (CLI length>0 语义)")
  })

  it("activeLines: v1 fallback strips truncated tool args (F6 镜像, deepseek/kimi/qwen 🟡)", () => {
    const slot = newSlot(tmp)
    const hist = [
      { role: "user", content: "a" },
      { role: "assistant", content: "", tool_calls: [{ id: "t1", type: "function", function: { name: "f", arguments: "{\"x\":\"abc…" } }] },
    ]
    // v1 老文件：无 contextHistory，人类线被 slimForDisplay 截断过
    writeFileSync(slotPath(tmp, slot), JSON.stringify({ version: 1, cwd: tmp, history: hist, sessionStart: "2026-08-01T00:00:00.000Z" }))
    const lines = activeLines({ _slot: slot })
    assert.equal(lines.contextHistory[1].tool_calls[0].function.arguments, "{}", "truncated args neutralized (半截 \\uXXXX 毒化防护)")
  })

  it("loadSlot filters legacy transient injections (glm/kimi 🔴)", () => {
    const slot = newSlot(tmp)
    writeFileSync(slotPath(tmp, slot), JSON.stringify({
      version: 2, cwd: tmp,
      history: [
        { role: "user", content: "real message" },
        { role: "user", content: "[System reminder: working directory snapshot: D:\\x" },
      ],
      sessionStart: "2026-08-01T00:00:00.000Z",
    }))
    const data = loadSlot(tmp, slot)
    assert.equal(data.history.length, 1, "legacy injection filtered on read")
    assert.equal(data.history[0].content, "real message")
  })

  it("saveSessionToSlot: concurrent-append detection rotates instead of silent clobber (qwen 🔴)", () => {
    const slot = newSlot(tmp)
    const start = "2026-08-01T00:00:00.000Z"
    writeFileSync(slotPath(tmp, slot), JSON.stringify({
      version: 2, cwd: tmp, sessionStart: start,
      history: [{ role: "user", content: "cli-1" }, { role: "assistant", content: "cli-2" }, { role: "user", content: "cli-3" }],
    }))
    // 面板旧快照（1 条）回合末写回——磁盘已长到 3 条（CLI 并发追加）
    const rotated = saveSessionToSlot(tmp, slot, { version: 2, cwd: tmp, sessionStart: start, history: [{ role: "user", content: "stale" }] })
    assert.ok(rotated && rotated.includes(`.json.${slot}.bak-`), `concurrent append rotated (got ${rotated})`)
    const bakData = JSON.parse(readFileSync(rotated, "utf8"))
    assert.equal(bakData.history.length, 3, ".bak preserves the CLI's newer messages")
    try { unlinkSync(rotated) } catch {}
  })
})

// ─── SESSION.md §10（R4）端分离恢复——end marker + resumeSlot（CLI 镜像）───────────────
// 双端模拟约定：本进程 PID + 异 sessionId 后缀 = "另一活进程"（isProcessAlive=true）；
// 不存在的大 PID = 死主。marker 文件 = {manifest}.vscode（END="vscode"）。

describe("end marker / resumeSlot（SESSION.md §10 R4——T-M9 类 + 镜像降级用例）", () => {
  const DEAD = "99999999-dead"
  // 种子直写需 sessions 目录先存在（writeFile 系函数不 mkdir）
  beforeEach(() => mkdirSync(join(tmp, "sessions"), { recursive: true }))
  const slotData = (title, contents, cwd = tmp) => ({
    version: 2, cwd, title, updatedAt: Date.now(),
    history: contents.map((content) => ({ role: "user", content })),
    contextHistory: [], tasks: [], sessionStart: "2026-09-01T00:00:00.000Z",
  })

  it("T-M9a: 面板 resolve 恢复本端记录槽（双端同开——CLI 死主槽 + 另一活槽 active）", () => {
    // slot1 = VS Code 上次的会话（属主死）；slot2 = CLI 活外人（active=2）；.vscode marker=1
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("panel session", ["panel msg"])))
    writeFileSync(slotPath(tmp, 2), JSON.stringify(slotData("cli session", ["cli msg"])))
    saveManifest(tmp, {
      slots: { 1: { ts: 1 }, 2: { ts: 2 } },
      slotSessions: { 1: DEAD, 2: `${process.pid}-foreign` },
      active: 2,
    }, null, { setActive: true })
    writeEndMarker(tmp, 1)

    const panel = { _slot: null }
    assert.equal(ensureSlot(panel), 1, "面板回到自己的槽——不进 CLI 活槽/新槽")
    assert.equal(panel._slot, 1)
    const m = loadManifest(tmp)
    assert.equal(m.active, 1, "claimSlot 认领后置 active=1")
    assert.equal(m.slotSessions[2], `${process.pid}-foreign`, "CLI 活槽属主绝不抢")
    assert.equal(readEndMarker(tmp).slot, 1)
    assert.equal(ensureSlot(panel), 1, "粘性：二次调用不重决")
  })

  it("T-M9b: CLI 活于他槽 + 面板无记录 → 全新槽（不继承活槽、不抢）", () => {
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("cli live", ["their msg"])))
    saveManifest(tmp, {
      slots: { 1: { ts: 1 } },
      slotSessions: { 1: `${process.pid}-foreign` },
      active: 1,
    }, null, { setActive: true })
    assert.ok(!existsSync(endMarkerPath(tmp)), "面板无 .vscode 记录")

    const { slot, data } = resumeSlot(tmp)
    assert.equal(slot, 2, "活属主绝不继承 → 全新槽")
    assert.equal(data, null)
    assert.equal(readEndMarker(tmp).slot, 2, "marker = 新槽")
    assert.equal(loadManifest(tmp).slotSessions[1], `${process.pid}-foreign`, "CLI 槽未被动")
  })

  it("T-M9c: 一次性继承（无 marker + active 死主槽）→ 写记录；再次 resume 仍回该槽", () => {
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("old", ["migrate me"])))
    saveManifest(tmp, { slots: { 1: { ts: 1 } }, slotSessions: { 1: DEAD }, active: 1 }, null, { setActive: true })
    assert.ok(!existsSync(endMarkerPath(tmp)))

    const r1 = resumeSlot(tmp)
    assert.equal(r1.slot, 1)
    assert.equal(r1.data.history[0].content, "migrate me")
    assert.equal(readEndMarker(tmp).slot, 1, "继承后写记录")
    const r2 = resumeSlot(tmp) // 模拟重启
    assert.equal(r2.slot, 1)
    assert.equal(r2.data.history[0].content, "migrate me")
  })

  it("T-M9d: marker 维护逐点一致——newSlot / switchToSlot / deleteSlotAndUpdate", () => {
    // newSlot（面板新建）→ marker = 新槽
    const s1 = newSlot(tmp)
    assert.equal(readEndMarker(tmp).slot, s1, "newSlot 后 marker = 新槽")
    const s2 = newSlot(tmp)
    assert.equal(readEndMarker(tmp).slot, s2, "再 newSlot → marker 跟随")
    // switchToSlot（面板打开历史会话 pick）→ marker = 目标槽
    const data = switchToSlot(tmp, s1)
    assert.ok(data, "switch 成功")
    assert.equal(readEndMarker(tmp).slot, s1, "pick 后 marker = 目标槽")
    // 删非记录槽 → marker 不动
    deleteSlotAndUpdate(tmp, s2)
    assert.equal(readEndMarker(tmp).slot, s1, "删非记录槽不动 marker")
    assert.ok(existsSync(endMarkerPath(tmp)), "marker 文件在")
    // 删记录槽 → 置空（文件保留、slot:null——下次启动全新起步）
    deleteSlotAndUpdate(tmp, s1)
    assert.equal(readEndMarker(tmp).slot, null, "删本端记录槽 → 显式置空")
    assert.ok(existsSync(endMarkerPath(tmp)), "marker 文件不 unlink")
    // 置空后重启 → 全新起步（不复活被删会话——数据 null；槽号可复用为合法全新分配）
    const r = resumeSlot(tmp)
    assert.equal(r.data, null, "全新起步（被删会话内容不复活）")
    assert.equal(readEndMarker(tmp).slot, r.slot, "marker = 新落点")
  })

  it("T-M9e: 全新目录首用 → 槽 1 + marker=1（panel ensureSlot 绑定）", () => {
    const panel = { _slot: null }
    assert.equal(ensureSlot(panel), 1)
    assert.equal(readEndMarker(tmp).slot, 1)
    assert.equal(panel._slot, 1)
    // saveLines 首保存落在已 claim 槽 + marker 不变
    saveLines({ _slot: null }, [{ role: "user", content: "hi", type: "user" }], [{ role: "user", content: "hi" }], {})
    assert.equal(readEndMarker(tmp).slot, 1)
    assert.ok(existsSync(slotPath(tmp, 1)), "会话文件已落盘")
  })

  it("T-M13 镜像: marker JSON 损坏 → 读侧按缺失降级（不 rename/unlink），resume 不崩", () => {
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("recover", ["data ok"])))
    saveManifest(tmp, { slots: { 1: { ts: 1 } }, slotSessions: { 1: DEAD }, active: 1 }, null, { setActive: true })
    const p = endMarkerPath(tmp)
    writeFileSync(p, "{broken json!!")
    const before = readFileSync(p, "utf8")

    assert.equal(readEndMarker(tmp), null, "损坏 → 按缺失")
    assert.equal(readFileSync(p, "utf8"), before, "损坏文件未被 rename/unlink")
    const r = resumeSlot(tmp) // 可走继承路径——不崩
    assert.equal(r.slot, 1)
    assert.equal(r.data.history[0].content, "data ok", "数据不受影响")
  })

  it("T-M14 镜像: marker 写失败 → resumeSlot 不崩、会话数据不受影响", () => {
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("session", ["real data"])))
    saveManifest(tmp, { slots: { 1: { ts: 1 } }, slotSessions: { 1: DEAD }, active: 1 }, null, { setActive: true })
    const p = endMarkerPath(tmp)
    mkdirSync(p, { recursive: true }) // 占住 marker 路径——写入必然失败

    const r = resumeSlot(tmp)
    assert.equal(r.slot, 1, "恢复决策照常")
    assert.equal(r.data.history[0].content, "real data", "会话数据不受影响")
    assert.ok(existsSync(p), "写失败容忍（不抛、不删）")
  })

  it("T-M15 镜像: claim 后读槽失败 → 保持已 claim 槽 + data:null（.corrupted 保现场）", () => {
    writeFileSync(slotPath(tmp, 1), "{corrupt json!!")
    saveManifest(tmp, { slots: { 1: { ts: 1 } }, slotSessions: { 1: DEAD }, active: 1 }, null, { setActive: true })
    writeEndMarker(tmp, 1)

    const r = resumeSlot(tmp)
    assert.equal(r.slot, 1, "保持已 claim 槽")
    assert.equal(r.data, null)
    assert.ok(existsSync(`${slotPath(tmp, 1)}.corrupted`), "损坏现场保留")
    assert.equal(readEndMarker(tmp).slot, 1, "marker 不变")
    const m = loadManifest(tmp)
    assert.ok(m.slotSessions[1]?.startsWith(`${process.pid}-`), "认领保持")
  })

  it("pushSessions 列表高亮按本端记录（D-5——含对端删除记录槽的守卫）", () => {
    writeFileSync(slotPath(tmp, 1), JSON.stringify(slotData("mine", ["a"])))
    writeFileSync(slotPath(tmp, 2), JSON.stringify(slotData("cli", ["b"])))
    saveManifest(tmp, {
      slots: { 1: { ts: 1 }, 2: { ts: 2 } },
      slotSessions: { 1: DEAD, 2: `${process.pid}-foreign` },
      active: 2, // CLI 刚把共享 active 翻到它的槽
    }, null, { setActive: true })
    writeEndMarker(tmp, 1) // 本端记录 = 槽 1

    const posted = []
    const panel = { _slot: 1, _panel: { webview: { postMessage: async (m) => posted.push(m) } } }
    pushSessions(panel)
    const msg = posted.find((m) => m.type === "sessions")
    assert.ok(msg, "sessions 消息已推")
    assert.equal(msg.sessions.find((s) => s.slot === 1).active, true, "本端记录槽高亮")
    assert.equal(msg.sessions.find((s) => s.slot === 2).active, false, "CLI 槽不高亮（即使 manifest active=2）")

    // 守卫：记录槽被对端删除 → 回退 manifest active
    deleteSlotAndUpdate(tmp, 1)
    writeEndMarker(tmp, 3) // 记录指向已删除的幻影槽
    const posted2 = []
    const panel2 = { _slot: 2, _panel: { webview: { postMessage: async (m) => posted2.push(m) } } }
    pushSessions(panel2)
    const msg2 = posted2.find((m) => m.type === "sessions")
    const activeSlots = msg2.sessions.filter((s) => s.active).map((s) => s.slot)
    assert.deepEqual(activeSlots, [2], "记录槽不在列表 → 回退 manifest active（guard，D-5）")
  })
})

// ─── R10 多实例协作（MULTI-INSTANCE-COLLAB.md——VS Code 镜像，2026-09-06）─────────
// 伪属主范式：seedFile 直写模拟对端 + 探针注入（alive/cmdline）——无真 spawn。
// 顶层 beforeEach 已注入 tmp sessions 沙箱；peers 默认目录跟随（tmp/peers）——测试零污染。

/** seedFile：向当前沙箱 cwd 写 manifest（模拟对端/本端认领）。entries = { slot: sessionId } */
function seedManifest(entries) {
  mkdirSync(join(tmp, "sessions"), { recursive: true })
  writeFileSync(manifestPath(tmp), JSON.stringify({ slots: {}, active: null, sessionId: null, slotSessions: entries }))
}

/** seedFile：向 peers 目录写对端实例登记文件 */
function seedPeerFile(sid, { pid, end = "cli", domains = [], updatedAt = Date.now() }) {
  mkdirSync(peersDir(), { recursive: true })
  writeFileSync(join(peersDir(), `${sid}.json`), JSON.stringify({ sessionId: sid, pid, end, cwd: tmp, domains, updatedAt }))
}

const ALL_ALIVE = (pids) => new Set(pids)
const NO_CMDLINE = () => new Map()

// ─── F5b config 门控镜像 ───────────────────────────────────

describe("R10 — F5b saveRaw mtime 门控镜像（D-F5c/d）", () => {
  let cfg
  beforeEach(() => {
    cfg = join(tmp, "config.json")
    _setConfigPathForTest(cfg)
  })
  afterEach(() => {
    _setConfigPathForTest(null)
    _resetPeerInstancesForTest()
    _resetPeerDomainsForTest()
  })

  it("T-F5c: A 读基线 → seedFile 写 V2（模拟 B 改）→ A 保存 → mtime-conflict + .bak 落盘 + V2 未被抹", () => {
    writeFileSync(cfg, JSON.stringify({ providers: [{ name: "a", apiKey: "k1" }], activeProvider: "a" }, null, 2) + "\n")
    loadRaw() // A 读链基线 V1
    const v2 = { providers: [{ name: "a", apiKey: "k1" }, { name: "b", apiKey: "k2" }], activeProvider: "b", fromB: true }
    writeFileSync(cfg, JSON.stringify(v2, null, 2) + "\n") // seedFile——B 的并发写
    const r = saveRaw({ providers: [{ name: "a", apiKey: "k1" }], activeProvider: "a", staleA: true })
    assert.deepEqual(r, { ok: false, reason: "mtime-conflict" }, "放弃 + 冲突枚举返回（决策① A）")
    const text = readFileSync(cfg, "utf8")
    assert.ok(text.includes("fromB"), "V2（B 的改动）未被抹——文件内容 = V2")
    assert.ok(!text.includes("staleA"), "A 的旧内容未写入")
    const baks = readdirSync(tmp).filter((f) => f.startsWith("config.json.bak-"))
    assert.equal(baks.length, 1, ".bak-{ts} 轮转保现场（仅冲突时）")
    assert.ok(readFileSync(join(tmp, baks[0]), "utf8").includes("fromB"), ".bak 持有并发方现场")
  })

  it("T-F5d: 无并发 → saveRaw 照常（零回归）", () => {
    writeFileSync(cfg, JSON.stringify({ providers: [{ name: "a", apiKey: "k1" }] }, null, 2) + "\n")
    loadRaw()
    const r = saveRaw({ providers: [{ name: "a", apiKey: "k1" }], activeProvider: "a" })
    assert.equal(r, undefined, "无冲突 → 无冲突标记（既有调用方零变化）")
    const parsed = JSON.parse(readFileSync(cfg, "utf8"))
    assert.equal(parsed.activeProvider, "a", "保存生效")
    assert.equal(parsed.$schema, "https://thincoder.dev/schemas/config.json", "$schema 注入照常")
    assert.equal(readdirSync(tmp).filter((f) => f.startsWith("config.json.bak-")).length, 0, "无并发 → 不轮转")
  })
})

// ─── L1/L2 感知镜像 ───────────────────────────────────────

describe("R10 — L1/L2 peer 感知镜像（D-L1a/D-L2a/b）", () => {
  afterEach(() => {
    _resetPeerInstancesForTest()
    _resetPeerDomainsForTest()
    _setConfigPathForTest(null)
  })

  it("T-L1a: 两活同伴（cli + vscode 各一——vscode 同伴 cmdline 含 thincoder 路径仍判 vscode）→ 注入含 N 个同伴（transient）", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    _setCmdlineProbeForTest((pids) => new Map([
      [1111, { name: "node.exe", cmdline: "node C:\\bin\\thincoder.cjs" }],
      // 回归锚（advisor 修正）：dev/F5 扩展宿主 cmdline 的 --extensionDevelopmentPath 含
      // "thincoder" 子串——必须仍判 vscode（端判别先查扩展宿主标记，不先命中 cli）
      [2222, { name: "Code.exe", cmdline: "\"C:\\VS Code\\Code.exe\" --type=extensionHost --extensionDevelopmentPath=D:\\dev\\thincoder-vscode" }],
    ]))
    seedManifest({ 1: "1111-peer-cli", 2: "2222-peer-vsc", 3: getSessionId() })
    const history = []
    const injected = pushPeerReminder(history, tmp)
    assert.equal(injected, true, "有同伴 → 注入")
    assert.equal(history.length, 1)
    assert.equal(history[0].transient, true, "transient 标记（注入纪律同 env-state）")
    assert.match(history[0].content, /2 个活跃 thincoder/, "N 个同伴")
    assert.ok(history[0].content.includes("(cli pid=1111)") && history[0].content.includes("(vscode pid=2222)"), "端字段（决策③ cmdline 探测）")
    assert.ok(history[0].content.includes("文件操作注意避让"), "文案（设计 D-L1a）")
  })

  it("T-L1a 接线面: setupAgentRun——注入位置在 env-state 之后、time reminder 之前", async () => {
    _setConfigPathForTest(join(tmp, "config.json"))
    _setAliveProbeForTest(ALL_ALIVE)
    _setCmdlineProbeForTest((pids) => new Map([[1111, { name: "node.exe", cmdline: "node thincoder.cjs" }]]))
    seedManifest({ 1: "1111-peer-cli", 2: getSessionId() })
    const { setupAgentRun } = await import("../src/agent/setup.mjs")
    const provider = { name: "t", baseURL: "http://127.0.0.1:1", apiKey: "k", model: "m" }
    const opts = { mcpServers: [], skills: [], engState: {}, history: [], fullHistory: [] }
    await setupAgentRun({ provider, cwd: tmp, input: "hi", opts, depth: 0, role: undefined, getAuto: () => false })
    const h = opts.history
    const idxEnv = h.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: env:"))
    const idxPeer = h.findIndex((m) => typeof m.content === "string" && m.content.includes("活跃 thincoder"))
    const idxTime = h.findIndex((m) => typeof m.content === "string" && m.content.includes("current time is"))
    assert.ok(idxEnv >= 0 && idxPeer > idxEnv && idxTime > idxPeer, `位置：env(${idxEnv}) < peer(${idxPeer}) < time(${idxTime})`)
    assert.equal(h[idxPeer].transient, true)
  })

  it("T-L1b: 无同伴（仅 self）→ 不注入（零开销——无 push）", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    seedManifest({ 1: getSessionId() })
    const history = []
    assert.equal(pushPeerReminder(history, tmp), false, "无同伴 → 不注入")
    assert.equal(history.length, 0)
  })

  it("T-L1c: 惰性缓存——manifest mtime 未变 → 二次调用不重查；变了才重查", () => {
    let aliveCalls = 0
    _setAliveProbeForTest((pids) => { aliveCalls++; return new Set(pids) })
    _setCmdlineProbeForTest(NO_CMDLINE)
    seedManifest({ 1: `${process.pid}-a`, 2: `${process.pid}-b` })
    assert.equal(peerInstances(tmp).length, 2)
    assert.equal(aliveCalls, 1, "首次查询 = 一次批量判活")
    assert.equal(peerInstances(tmp).length, 2, "缓存命中——数据一致")
    assert.equal(aliveCalls, 1, "mtime 未变 → 不重查（惰性）")
    writeFileSync(manifestPath(tmp), JSON.stringify({ slotSessions: { 1: `${process.pid}-a` } }))
    assert.equal(peerInstances(tmp).length, 1)
    assert.equal(aliveCalls, 2, "manifest 变了 → 重查")
  })

  it("T-L2a: peer_instances 字段白名单 {pid,end,sessionId,slots} 精确 + 去 self（vscode 同伴 cmdline 含 thincoder 仍判 vscode）", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    _setCmdlineProbeForTest((pids) => new Map([
      [1111, { name: "node.exe", cmdline: "node thincoder.cjs" }],
      [2222, { name: "Code.exe", cmdline: "--extensionDevelopmentPath=D:\\dev\\thincoder-vscode" }],
    ]))
    seedManifest({ 1: "1111-peer-cli", 2: "2222-peer-vsc", 3: getSessionId() })
    const out = peerInstancesTool.execute({}, { cwd: tmp })
    assert.ok(!out.includes(getSessionId()), "never includes self（schema 锚语义）")
    const lines = out.split("\n")
    assert.equal(lines.length, 2, "两个同伴")
    for (const line of lines) {
      const e = JSON.parse(line)
      assert.deepEqual(Object.keys(e).sort(), ["end", "pid", "sessionId", "slots"], "字段白名单精确——无 self/无任何其他键（N4）")
    }
    const vsc = lines.map((l) => JSON.parse(l)).find((e) => e.pid === 2222)
    assert.equal(vsc.end, "vscode", "扩展宿主标记先于 thincoder 子串判定（回归锚——cmdline 含 thincoder 路径不误标 cli）")
    assert.equal(JSON.parse(lines[0]).pid === 1111 ? JSON.parse(lines[0]).end : JSON.parse(lines[1]).end, "cli", "真实 CLI 仍判 cli")
  })

  it("T-L2b: 死主条目（DEAD pid）不出现", () => {
    _setAliveProbeForTest((pids) => new Set(pids.filter((p) => p === process.pid)))
    _setCmdlineProbeForTest(NO_CMDLINE)
    seedManifest({ 1: "99999999-dead", 2: `${process.pid}-live` })
    const peers = peerInstances(tmp)
    assert.equal(peers.length, 1, "死条目过滤")
    assert.equal(peers[0].pid, process.pid)
    assert.ok(!JSON.stringify(peers).includes("99999999"))
  })

  it("T-N3/N4: peer_instances 查询 + L1 注入路径只读——fs 写点零（不写 manifest/peers）", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    _setCmdlineProbeForTest(NO_CMDLINE)
    seedManifest({ 1: `${process.pid}-x`, 2: getSessionId() })
    const sessDir = join(tmp, "sessions")
    const before = readdirSync(sessDir).sort()
    const history = []
    pushPeerReminder(history, tmp)
    peerInstancesTool.execute({}, { cwd: tmp })
    assert.deepEqual(readdirSync(sessDir).sort(), before, "sessions 目录无写")
    assert.equal(existsSync(peersDir()), false, "peers 目录未创建（零 fs 写）")
    assert.equal(readdirSync(tmp).filter((f) => f.endsWith(".json")).length, 0, "无任何登记文件")
  })
})

// ─── L3 域登记/冲突镜像 ───────────────────────────────────

describe("R10 — L3 文件域登记 + 冲突检测镜像（D-L3a/b/c）", () => {
  afterEach(() => {
    _resetPeerInstancesForTest()
    _resetPeerDomainsForTest()
  })

  it("T-L3a: A 写 x → flush 登记含 x；seedFile B 同域 → conflicts 命中（软提示数据——不阻止）", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    const x = join(tmp, "src", "x.mjs")
    registerDomains([x])
    flushDomains(tmp)
    const myFile = join(peersDir(), `${getSessionId()}.json`)
    assert.ok(existsSync(myFile), "flush 落盘本实例登记")
    assert.ok(JSON.parse(readFileSync(myFile, "utf8")).domains.includes(x), "登记含 x（写后登记——决策⑤）")
    // B（活 pid、不同 sessionId）也登记了 x
    seedPeerFile(`${process.pid}-B`, { pid: process.pid, end: "cli", domains: [x] })
    const hits = peerDomains(tmp).conflicts([x])
    assert.equal(hits.length, 1, "命中他实例 hot 域")
    assert.equal(hits[0].file, x)
    assert.equal(hits[0].pid, process.pid)
    assert.equal(hits[0].end, "cli")
    // 软提示语义：conflicts 只返回数据不抛错不写（写工具主流程永不阻塞——决策⑥）
    assert.deepEqual(readdirSync(peersDir()).filter((f) => !f.includes(getSessionId())).sort(), [`${process.pid}-B.json`], "查询不产生任何 fs 写")
  })

  it("T-L3b: B 登记死 pid → 聚合时惰性清理（文件消失 + 不命中）", () => {
    _setAliveProbeForTest((pids) => new Set(pids.filter((p) => p === process.pid)))
    seedPeerFile("99999999-dead", { pid: 99999999, domains: [join(tmp, "y.mjs")] })
    const hits = peerDomains(tmp).conflicts([join(tmp, "y.mjs")])
    assert.deepEqual(hits, [], "死登记不命中")
    assert.ok(!existsSync(join(peersDir(), "99999999-dead.json")), "死登记文件被惰性清理（D-L3a）")
  })

  it("T-L3c: 无冲突 → 零提示；冷登记（hot 窗口外）不提示", () => {
    _setAliveProbeForTest(ALL_ALIVE)
    const x = join(tmp, "x.mjs")
    const y = join(tmp, "y.mjs")
    seedPeerFile(`${process.pid}-hot`, { pid: process.pid, domains: [y] })
    seedPeerFile(`${process.pid}-cold`, { pid: process.pid, domains: [x], updatedAt: Date.now() - 10 * 60 * 1000 })
    const hits = peerDomains(tmp).conflicts([x])
    assert.deepEqual(hits, [], "同文件但冷登记（5 分钟外）→ 不提示（hot 窗口——决策⑤）")
    assert.deepEqual(peerDomains(tmp).conflicts([y]).map((h) => h.file), [y], "他端 hot 域命中")
  })

  it("T-L3d: peers 文件损坏 → 按缺失降级（不崩、文件保留）", () => {
    seedPeerFile("broken", { pid: 99999999, domains: ["x"] })
    writeFileSync(join(peersDir(), "broken.json"), "{ corrupt json!!")
    const hits = peerDomains(tmp).conflicts([join(tmp, "x.mjs")])
    assert.deepEqual(hits, [], "损坏按缺失降级——不命中不抛（NF2/end marker 同型）")
    assert.ok(existsSync(join(peersDir(), "broken.json")), "损坏文件保留（不删——幂等降级）")
  })
})




