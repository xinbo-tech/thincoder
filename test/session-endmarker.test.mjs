/**
 * session-endmarker.test.mjs — SESSION.md §10（R4）端分离恢复测试（CLI 面）：
 *  end marker（{manifest}.cli——本端"最后使用槽位"记录）+ resumeSlot 恢复决策
 *  + marker 维护点（saveSession 首认领 / newSession / switchToSlot / deleteSlot）。
 *  覆盖 §10.3 T-M1~T-M8 + T-M10 + T-M13~T-M15（T-M9/T-M12 在 VS Code 面与 parity 测试）。
 *
 * 双端模拟约定（与 session-safety.test.mjs 同型）：本进程 PID + 异 sessionId 后缀 =
 *  "另一活进程"（isProcessAlive(本进程 PID)=true）；不存在的大 PID（9999xxxx）= 死主。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import {
  saveSession, loadSession, resumeSlot, readEndMarker, writeEndMarker, endMarkerPath,
  activeSlot, newSession, switchToSlot, deleteSlot, listSlots, sessionPath,
} from "../src/session.mjs"

const DEAD = "99999999-dead"
const DEAD2 = "99999998-dead"

/** 种子文件（目录不存在时先建——sessions 目录可能不在，真实环境已存在则零成本） */
const ensureDir = (p) => mkdirSync(dirname(p), { recursive: true })
const seedFile = (p, content) => { ensureDir(p); writeFileSync(p, content) }
/** 直接改写 manifest（模拟并发方/对端翻 active——绕开 saveManifest 合并语义） */
const saveManifestWrite = (cwd, m) => seedFile(manifestOf(cwd), JSON.stringify(m))

/** Remove every file this cwd's session may have created (known paths only — no directory scan). */
function cleanup(cwd) {
  const base = sessionPath(cwd)
  for (const s of ["", ".manifest", ".manifest.cli", ".manifest.cli.tmp", ".tmp", ".corrupted", ".unreadable",
    ".1.corrupted", ".2.corrupted", ".1.unreadable", ".2.unreadable",
    ".1", ".2", ".3", ".4", ".5", ".6", ".7", ".8", ".9"]) {
    try { rmSync(base + s, { recursive: true, force: true }) } catch {}
  }
}

const manifestOf = (cwd) => sessionPath(cwd) + ".manifest"
const slotFile = (cwd, n) => sessionPath(cwd) + "." + n
const markerOf = (cwd) => endMarkerPath(cwd)
const readManifest = (cwd) => JSON.parse(readFileSync(manifestOf(cwd), "utf8"))

const cwdFor = (tag) => mkdtempSync(join(tmpdir(), `sess-em-${tag}-`))

/** 槽会话数据（可直接落盘——结构同 saveSession 产物） */
const slotData = (cwd, title, contents, sessionStart = "2026-09-01T00:00:00.000Z") => ({
  version: 2, cwd, title, updatedAt: Date.now(),
  history: contents.map((content) => ({ role: "user", content })),
  contextHistory: contents.map((content) => ({ role: "user", content })),
  tasks: [], planMode: false, autoApprove: false, sessionStart,
})

/** 手写"槽 1 有内容 + 死主 + manifest active 指向它"的现场（T-M2 场景基底） */
function seedDeadActiveSlot(cwd, title = "dead-active", contents = ["hello"]) {
  seedFile(slotFile(cwd, 1), JSON.stringify(slotData(cwd, title, contents)))
  seedFile(manifestOf(cwd), JSON.stringify({
    slots: { 1: { ts: Date.now() } },
    slotSessions: { 1: DEAD },
    active: 1,
  }))
}

// ─── T-M1：双端同开，CLI 重进回本端槽（不进对端活槽/新槽）────────────────────────────

slow("T-M1: 双端同开 CLI 重进 → resumeSlot 认领本端记录槽，不碰对端活槽", () => {
  const cwd = cwdFor("t1")
  try {
    // slot1 = CLI 上次的会话（属主已死）；slot2 = VS Code 活外人（active=2）；CLI marker=1
    seedFile(slotFile(cwd, 1), JSON.stringify(slotData(cwd, "cli session", ["cli msg"])))
    seedFile(slotFile(cwd, 2), JSON.stringify(slotData(cwd, "vscode session", ["vscode msg"])))
    seedFile(manifestOf(cwd), JSON.stringify({
      slots: { 1: { ts: 1 }, 2: { ts: 2 } },
      slotSessions: { 1: DEAD, 2: `${process.pid}-foreign` },
      active: 2,
    }))
    writeEndMarker(cwd, 1)

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "恢复本端记录槽（CLI 自己的会话），不进 slot2/新槽")
    assert.equal(r.data.history[0].content, "cli msg")

    const m = readManifest(cwd)
    assert.equal(m.active, 1, "claimSlot 认领后置 active=1（manifest active 保留共享指针语义）")
    assert.ok(m.slotSessions[1]?.startsWith(`${process.pid}-`), "slot 1 归本进程")
    assert.equal(m.slotSessions[2], `${process.pid}-foreign`, "活外人属主绝不抢")
    assert.equal(readEndMarker(cwd).slot, 1, "marker 不变")
    // 模拟重启前把共享 active 翻回对端活槽（判别：若实现仍读 active 就会落 2——marker 驱动必须仍回 1）
    const m2 = readManifest(cwd)
    m2.active = 2
    saveManifestWrite(cwd, m2)
    assert.equal(resumeSlot(cwd).slot, 1, "重启仍回本端槽（不看共享 active）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M2：迁移一次性继承（无记录 + active 死主槽）────────────────────────────────────

test("T-M2: 无 marker + active 死主槽 → 继承一次并写记录；再次 resumeSlot 仍回该槽", () => {
  const cwd = cwdFor("t2")
  try {
    seedDeadActiveSlot(cwd, "old session", ["migrate me"])
    assert.ok(!existsSync(markerOf(cwd)), "无 marker（升级迁移窗口）")

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "继承 manifest active 死主槽")
    assert.equal(r.data.history[0].content, "migrate me")
    assert.equal(readEndMarker(cwd).slot, 1, "继承后写下本端记录")

    // 模拟重启前制造判别现场：另一活外人槽 2 有文件 + active=2——若实现仍读共享 active 会
    // 落 2/新槽；marker 驱动必须仍回记录槽 1（重启不再读共享指针）
    seedFile(slotFile(cwd, 2), JSON.stringify(slotData(cwd, "foreign live", ["theirs"])))
    const m2 = readManifest(cwd)
    m2.slots[2] = { ts: Date.now() }
    m2.slotSessions[2] = `${process.pid}-foreign`
    m2.active = 2
    seedFile(manifestOf(cwd), JSON.stringify(m2))

    const r2 = resumeSlot(cwd) // 模拟重启——记录恒在，不再读共享指针
    assert.equal(r2.slot, 1, "重启回本端记录槽（不看 active=活外人槽）")
    assert.equal(r2.data.history[0].content, "migrate me")
    const m = readManifest(cwd)
    assert.ok(m.slotSessions[1]?.startsWith(`${process.pid}-`), "slot 1 归本进程")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M3：继承拒绝活槽（NF4——活槽绝不双写）──────────────────────────────────────────

test("T-M3: 无 marker + active 活外属主 → 全新槽起步，绝不写活槽", () => {
  const cwd = cwdFor("t3")
  try {
    seedFile(slotFile(cwd, 1), JSON.stringify(slotData(cwd, "live foreign", ["their msg"])))
    seedFile(manifestOf(cwd), JSON.stringify({
      slots: { 1: { ts: 1 } },
      slotSessions: { 1: `${process.pid}-foreign` },
      active: 1,
    }))

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 2, "活属主 → 全新槽（max+1），不继承")
    assert.equal(r.data, null, "全新槽无内容")
    assert.equal(readEndMarker(cwd).slot, 2, "marker = 新槽")
    const m = readManifest(cwd)
    assert.equal(m.slotSessions[1], `${process.pid}-foreign`, "活槽属主未被触碰")
    assert.ok(m.slotSessions[2]?.startsWith(`${process.pid}-`), "新槽归本进程")
    const foreign = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.equal(foreign.history[0].content, "their msg", "活槽文件原样保留")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M4：删过本端槽（marker slot:null）→ 全新起步，不继承────────────────────────────

test("T-M4: marker 置空（删过本端槽）+ active 死主槽 → 全新槽（不继承）", () => {
  const cwd = cwdFor("t4")
  try {
    seedDeadActiveSlot(cwd, "dead session", ["their leftover"])
    writeEndMarker(cwd, null) // 显式置空（文件保留）

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 2, "全新槽（不继承 active 死主槽——被删会话不复活）")
    assert.equal(r.data, null)
    assert.equal(readEndMarker(cwd).slot, 2, "marker 更新为新槽")
    const disk = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.equal(disk.history[0].content, "their leftover", "死主槽文件原样保留（列表可手动找回）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M5：记录指向的槽被对端删除 → 全新槽（不复活）──────────────────────────────────

test("T-M5: marker 指向的槽已被删（无文件无条目）→ 全新分配，不复活", () => {
  const cwd = cwdFor("t5")
  try {
    seedFile(slotFile(cwd, 1), JSON.stringify(slotData(cwd, "a", ["a"])))
    seedFile(slotFile(cwd, 3), JSON.stringify(slotData(cwd, "b", ["b"])))
    seedFile(manifestOf(cwd), JSON.stringify({
      slots: { 1: { ts: 1 }, 3: { ts: 3 } }, // slot 2 已被对端删除（文件 + 条目都不在）
      slotSessions: { 1: DEAD, 3: DEAD2 },
      active: 1,
    }))
    writeEndMarker(cwd, 2) // 记录指向已删除的 slot 2

    const r = resumeSlot(cwd)
    assert.notEqual(r.slot, 2, "被删槽不复活")
    assert.equal(readEndMarker(cwd).slot, r.slot, "marker = 新落点")
    assert.equal(r.data, null, "全新起步")
    assert.ok(r.slot === 4, `分配 max+1 新号（有文件/有条目的 1/3 不被回收——got ${r.slot}）`)
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M6：全新目录首用 → 槽 1 起步 + marker=1 ─────────────────────────────────────────

test("T-M6: 全新目录首用 → 认领槽 1 + 写记录（claim 先行，文件首保存时落盘）", () => {
  const cwd = cwdFor("t6")
  try {
    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "无 manifest → 槽 1 起步")
    assert.equal(r.data, null)
    assert.equal(readEndMarker(cwd).slot, 1, "marker=1")
    const m = readManifest(cwd)
    assert.equal(m.active, 1)
    assert.ok(m.slotSessions[1]?.startsWith(`${process.pid}-`), "认领记录在案（防并发方复用）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M7（D-3）：启动钉 _slot 后并发方翻 active → 首保存仍在恢复槽 ───────────────────

test("T-M7: resumeSlot + 钉 _slot 后并发方翻 active → 首保存仍落恢复槽（不迁移）", () => {
  const cwd = cwdFor("t7")
  try {
    seedDeadActiveSlot(cwd, "resume me", ["first"])
    const { slot } = resumeSlot(cwd)
    // bin/thincoder.mjs 启动路径：applySession 后 agent._slot = slot（D-3 钉槽）
    const agent = {
      cwd,
      provider: { name: "t", model: "m" },
      history: [{ role: "user", content: "first" }],
      _fullHistory: [{ role: "user", content: "first" }],
      _sessionStart: "2026-09-01T00:00:00.000Z",
      tasks: [],
      _slot: slot,
    }
    // 并发方（VS Code/另一 CLI）翻 active 到 slot 2 + 活认领 slot 2
    const m = readManifest(cwd)
    m.active = 2
    m.slotSessions[2] = `${process.pid}-foreign`
    seedFile(manifestOf(cwd), JSON.stringify(m))

    agent.history.push({ role: "user", content: "more" })
    agent._fullHistory = [...agent.history]
    const rotated = saveSession(agent) // 首保存——_slot 已钉 → 不重跑决策
    assert.equal(rotated, null, "同会话保存不轮转")
    assert.equal(agent._slot, slot, "粘性槽保持")
    const disk = JSON.parse(readFileSync(slotFile(cwd, slot), "utf8"))
    assert.ok(disk.history.some((x) => x.content === "more"), "首保存落在恢复槽")
    assert.ok(!existsSync(slotFile(cwd, 2)), "并发方的槽未被动过")
    assert.equal(readEndMarker(cwd).slot, slot, "marker 仍是恢复槽（并发方翻 active 不影响）")
    const after = readManifest(cwd)
    assert.equal(after.active, 2, "并发方的 active 指针保留（我们不回滚它——F1 反漂移）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M8（F4）：显式切换跟随 /new、/session N、删 marker 槽 ───────────────────────────

test("T-M8: /new 与 /session N 更新 marker；删除本端记录槽 → 置空（文件在）", () => {
  const cwd = cwdFor("t8")
  try {
    // 初始：槽 1 有会话（marker=1）
    const agent = {
      cwd, provider: { name: "t", model: "m" },
      history: [{ role: "user", content: "hi" }], _fullHistory: [{ role: "user", content: "hi" }],
      tasks: [], _sessionStart: "2026-09-01T00:00:00.000Z",
    }
    saveSession(agent)
    assert.equal(readEndMarker(cwd).slot, 1, "首保存认领后 marker=1")

    const s2 = newSession(cwd) // /new
    assert.equal(s2, 2)
    assert.equal(readEndMarker(cwd).slot, 2, "/new → marker=新槽")

    switchToSlot(cwd, 1) // /session 1
    assert.equal(readEndMarker(cwd).slot, 1, "/session N → marker=N")

    deleteSlot(cwd, 1) // 删除本端记录槽
    assert.ok(existsSync(markerOf(cwd)), "marker 文件保留（不 unlink）")
    assert.equal(readEndMarker(cwd).slot, null, "记录显式置空——下次启动全新起步")
    // 再删非记录槽 2（/new 创建过）——marker 保持置空不复活
    assert.equal(deleteSlot(cwd, 2), true, "非记录槽可删")
    assert.equal(readEndMarker(cwd).slot, null, "删非记录槽不动 marker（仍为置空）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M10：legacy 单文件兜底回归（无槽 + v1 单文件）──────────────────────────────────

test("T-M10: 无槽 + legacy v1 单文件 → 恢复不变（claim 落点照旧 + legacy data 兜底）", () => {
  const cwd = cwdFor("t10")
  try {
    const legacy = sessionPath(cwd)
    seedFile(legacy, JSON.stringify({ version: 1, cwd, history: [{ role: "user", content: "legacy msg" }] }))
    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "claim 落点 = 槽 1（与旧 loadSession 一致）")
    assert.equal(r.data.history[0].content, "legacy msg", "legacy data 兜底")
    assert.equal(readEndMarker(cwd).slot, 1, "marker=1")
    // loadSession 包装等价
    assert.equal(loadSession(cwd).history[0].content, "legacy msg")
    assert.ok(existsSync(legacy), "legacy 文件保留（首次保存后落槽）")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M13：marker 损坏 → 按缺失降级（可走继承）；损坏文件不被 rename/unlink ──────────

test("T-M13: marker JSON 损坏 → 读侧按缺失降级不崩；决策后按落点重写（不 rename/unlink 原文件）", () => {
  const cwd = cwdFor("t13")
  try {
    seedDeadActiveSlot(cwd, "recover", ["data ok"])
    const p = markerOf(cwd)
    seedFile(p, "{broken json!!") // marker 损坏（读侧不 rename/unlink）
    const before = readFileSync(p, "utf8")

    // 读侧：readEndMarker 按缺失处理，文件原样保留（不 rename 不 unlink）
    assert.equal(readEndMarker(cwd), null, "损坏 → null（按缺失）")
    assert.equal(readFileSync(p, "utf8"), before, "损坏文件未被 rename/unlink")

    // 决策侧：损坏 = 缺失 → 走一次性继承（active 死主槽）→ 落点写记录覆盖损坏内容
    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "可走继承路径（active 死主槽）")
    assert.equal(r.data.history[0].content, "data ok", "数据不受影响")
    const rec = readEndMarker(cwd)
    assert.equal(rec.slot, 1, "marker 被合法记录替换（决策写——原子 .tmp+rename）")
    assert.ok(Number.isFinite(rec.updatedAt))
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── T-M14：marker 写失败 → 按无记录路径降级启动，会话数据不受影响（NF2）──────────────

test("T-M14: marker 写失败（路径被目录占住）→ resumeSlot 不崩、会话数据不受影响", () => {
  const cwd = cwdFor("t14")
  try {
    seedDeadActiveSlot(cwd, "session", ["real data"])
    // 占住 marker 路径（mkdir 使其不可写为文件）——写入必然失败
    const p = markerOf(cwd)
    mkdirSync(p, { recursive: true })

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "恢复决策照常（marker 缺失 → 继承 active 死主槽）")
    assert.equal(r.data.history[0].content, "real data", "会话数据不受影响")
    assert.ok(existsSync(p) && readdirSync(p).length >= 0, "目录仍在（写失败容忍——不抛、不删）")

    // 首保存照常落盘（writeEndMarker 失败静默）
    const agent = { cwd, provider: { name: "t", model: "m" }, history: [], _fullHistory: [], tasks: [], _slot: r.slot, _sessionStart: "2026-09-01T00:00:00.000Z" }
    saveSession(agent)
    const disk = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.ok(Array.isArray(disk.history), "会话文件正常写入")
  } finally {
    const p = markerOf(cwd)
    try { rmSync(p + ".tmp", { force: true }) } catch {}
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── T-M15：claim 后读槽失败 → 保持已 claim 槽 + data:null（.corrupted 保现场）─────────

test("T-M15: marker 槽文件损坏 → 保持已 claim 槽 + data:null；.corrupted 保现场；下次保存原地重建", () => {
  const cwd = cwdFor("t15")
  try {
    // 现场：marker=1 + m.slots[1] 条目 + 槽文件在盘但损坏（属主死）
    seedFile(slotFile(cwd, 1), "{corrupt json!!")
    seedFile(manifestOf(cwd), JSON.stringify({
      slots: { 1: { ts: 1 } },
      slotSessions: { 1: DEAD },
      active: 1,
    }))
    writeEndMarker(cwd, 1)

    const r = resumeSlot(cwd)
    assert.equal(r.slot, 1, "保持已 claim 槽（不回滚认领）")
    assert.equal(r.data, null, "data:null（读失败降级）")
    assert.ok(existsSync(slotFile(cwd, 1) + ".corrupted"), "损坏现场以 .corrupted 保留")
    assert.equal(readEndMarker(cwd).slot, 1, "marker 不变")
    const m = readManifest(cwd)
    assert.ok(m.slotSessions[1]?.startsWith(`${process.pid}-`), "认领保持（slotSessions[1] = 本进程）")
    assert.equal(m.active, 1, "active 指向已 claim 槽")

    // 下次保存原地重建（bin 启动路径已钉 _slot = r.slot）
    const agent = { cwd, provider: { name: "t", model: "m" }, history: [], _fullHistory: [], tasks: [], _slot: r.slot, _sessionStart: null }
    saveSession(agent)
    const rebuilt = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.ok(Array.isArray(rebuilt.history), "槽文件原地重建")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── 回归：activeSlot/listSlots/deleteSlot 在 marker 存在时的旧语义不变（AC5/T-M11）────

test("回归: marker 存在时 activeSlot/listSlots/deleteSlot 既有语义不变（ACP 路径零变化）", () => {
  const cwd = cwdFor("reg")
  try {
    seedDeadActiveSlot(cwd, "s1", ["a"])
    // activeSlot（ensureActive 路径——不读 marker）认领 active 死主槽
    const s = activeSlot(cwd)
    assert.equal(s, 1)
    assert.equal(readEndMarker(cwd), null, "activeSlot 不写 marker（无记录进程路径——D-8）")
    const list = listSlots(cwd)
    assert.equal(list[0].isActive, true, "listSlots isActive 仍按 manifest active（D-5——列表高亮在调用侧改）")
    assert.equal(list[0].slot, 1)
    // 手动删 active 槽（ACP session/delete 路径）——marker 缺失时删除不产生置空文件
    assert.equal(deleteSlot(cwd, 1), true)
    assert.ok(!existsSync(markerOf(cwd)), "无 marker 时不凭空创建")
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

// ─── 回归：loadSession 包装与旧 loadSession 对既有测试场景等价（T-M11）────────────────

test("回归: loadSession 包装（无 marker 时继承/全新语义与旧实现一致）", () => {
  const cwd = cwdFor("wrap")
  try {
    // 1. 无 manifest → null（claim 槽 1，无文件无 legacy）
    assert.equal(loadSession(cwd), null)
    const m1 = readManifest(cwd)
    assert.equal(m1.active, 1, "claim 落点照旧（槽 1）")
    assert.ok(m1.slotSessions[1]?.startsWith(`${process.pid}-`))
    // 2. 有会话（saveSession）→ loadSession 恢复同一槽内容
    const agent = { cwd, provider: { name: "t", model: "m" }, history: [{ role: "user", content: "hi" }], _fullHistory: [{ role: "user", content: "hi" }], tasks: [], _sessionStart: "2026-09-01T00:00:00.000Z" }
    saveSession(agent)
    assert.equal(readEndMarker(cwd).slot, 1, "首认领写 marker")
    const data = loadSession(cwd)
    assert.equal(data.history[0].content, "hi")
    // 3. legacy transient 过滤（marker 存在时读槽路径不变）
    const restored = loadSession(cwd)
    assert.equal(restored.history.length, 1, "无 transient 注入——常规读")
    void data; void restored
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})

test("回归: marker 文件与 manifest 互不干扰（NF1——独立文件非内嵌字段）", () => {
  const cwd = cwdFor("nf1")
  try {
    seedDeadActiveSlot(cwd, "x", ["x"])
    writeEndMarker(cwd, 1)
    // manifest 结构与旧版完全一致（无 marker 相关字段——旧版端整对象写不会丢/不认识）
    const m = readManifest(cwd)
    assert.deepEqual(Object.keys(m).sort(), ["active", "slotSessions", "slots"].sort())
    assert.equal(m.cliLast ?? m.endSlot ?? m.cliSlot, undefined, "无任何内嵌端记录字段（NF1——独立文件）")
    assert.equal(readEndMarker(cwd).slot, 1)
  } finally { cleanup(cwd); rmSync(cwd, { recursive: true, force: true }) }
})
