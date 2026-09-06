/**
 * SESSION.md §12 — 会话目录残留 GC + 标题写显性化（VS Code 端镜像，2026-09-06）
 * T1-T4 残留按保留期清理（older-than 边界；utimesSync 回拨造老化文件——测试 seam）
 * T5 dry-run 只列不删；T6/T7/T7a/T7b setSlotTitle {ok, reason} 契约（CLI renameSlot 同枚举）
 * T9-T12 冷 cwd 判定/删除原语（执行面仅 CLI `thincoder session gc`——review #7）
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, utimesSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  gcResidue, listColdCwds, deleteColdCwd, ORPHAN_TMP_RETENTION_MS,
} from "../src/extension/session-gc.mjs"
import {
  setSlotTitle, newSlot, loadSlot, slotPath, saveSlot,
  _setSessionsDirForTest, _resetSessionsDirForTest, sessionsDir,
} from "../src/extension/session-io.mjs"

const DAY = 24 * 3600 * 1000
const aliveSelf = (pid) => pid === process.pid // 确定性存活判定（不真跑 tasklist）

let tmp, cwd

function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-gc-"))
  cwd = tmp
  _setSessionsDirForTest(join(tmp, "sessions"))
  mkdirSync(sessionsDir(), { recursive: true }) // GC 用例直接写目录（不经 writeFile 的 mkdir）
}

function cleanup() {
  _resetSessionsDirForTest()
  rmSync(tmp, { recursive: true, force: true })
}

function age(p, days) { const t = new Date(Date.now() - days * DAY); utimesSync(p, t, t) }
function touch(dir, name, content = "x", daysOld = 0) {
  const p = join(dir, name)
  writeFileSync(p, content)
  if (daysOld) age(p, daysOld)
  return p
}

// ====================================================================
// T1-T5 — 残留 GC（F1/N1/N2）
// ====================================================================

describe("session-gc — 残留 GC（SESSION.md §12 F1）", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("T1 过期 .corrupted/.unreadable/.manifest.corrupted（31 天）删、今天留", () => {
    const dir = sessionsDir()
    const prefix = "aaa1.json"
    const oldCorrupted = touch(dir, `${prefix}.1.corrupted`, "x", 31)
    const newCorrupted = touch(dir, `${prefix}.2.corrupted`)
    const oldUnreadable = touch(dir, `${prefix}.3.unreadable`, "x", 31)
    const oldManifestCorrupted = touch(dir, `${prefix}.manifest.corrupted`, "x", 31)
    const r = gcResidue({ dir, prefix, aliveFn: aliveSelf })
    assert.deepEqual(r.deleted.sort(), [`${prefix}.1.corrupted`, `${prefix}.3.unreadable`, `${prefix}.manifest.corrupted`].sort())
    assert.equal(existsSync(oldCorrupted), false)
    assert.equal(existsSync(oldUnreadable), false)
    assert.equal(existsSync(oldManifestCorrupted), false)
    assert.equal(existsSync(newCorrupted), true, "近期的保留")
  })

  it("T2 保留期内的 .bak（29 天 < 30 天）不清；过期 .bak（31 天）清", () => {
    const dir = sessionsDir()
    const prefix = "bbb2.json"
    const recent = touch(dir, `${prefix}.1.bak-1000`, "x", 29)
    const old = touch(dir, `${prefix}.2.bak-2000`, "x", 31)
    const r = gcResidue({ dir, prefix, aliveFn: aliveSelf })
    assert.deepEqual(r.deleted, [`${prefix}.2.bak-2000`])
    assert.equal(existsSync(recent), true)
    assert.equal(existsSync(old), false)
  })

  it("T3 活跃槽（主文件在 + 属主活）的现场后缀不清（N1 安全）", () => {
    const dir = sessionsDir()
    const prefix = "ccc3.json"
    touch(dir, `${prefix}.1`, JSON.stringify({ version: 2, history: [] }))
    touch(dir, `${prefix}.manifest`, JSON.stringify({ slots: { 1: {} }, slotSessions: { 1: `${process.pid}-1-x` } }))
    const residue = touch(dir, `${prefix}.1.corrupted`, "x", 60) // 再老也不清——活跃槽
    const r = gcResidue({ dir, prefix, aliveFn: aliveSelf })
    assert.deepEqual(r.deleted, [])
    assert.equal(existsSync(residue), true)
  })

  it("T4 孤儿 .tmp 超 7 天删；恰好 7 天（等于保留期）保留；主文件在的非孤儿 .tmp 保留", () => {
    const dir = sessionsDir()
    const prefix = "ddd4.json"
    const now = Date.now()
    const orphan = touch(dir, `${prefix}.9.tmp`, "x", 8) // mtime < now−7d → 删
    const edge = touch(dir, `${prefix}.8.tmp`, "x", 0)
    const edgeT = new Date(now - ORPHAN_TMP_RETENTION_MS) // 恰好等于保留期 → older-than 不成立 → 保留
    utimesSync(edge, edgeT, edgeT)
    touch(dir, `${prefix}.7`, "{}") // 主文件在
    const liveTmp = touch(dir, `${prefix}.7.tmp`, "x", 8) // 非孤儿 → 保留
    const r = gcResidue({ dir, prefix, now, aliveFn: aliveSelf })
    assert.deepEqual(r.deleted, [`${prefix}.9.tmp`])
    assert.equal(existsSync(orphan), false)
    assert.equal(existsSync(edge), true, "等于保留期保留（older-than 边界）")
    assert.equal(existsSync(liveTmp), true)
  })

  it("T5 dry-run 只列不删（N2 可预览）", () => {
    const dir = sessionsDir()
    const prefix = "eee5.json"
    const old = touch(dir, `${prefix}.1.corrupted`, "x", 31)
    const r = gcResidue({ dir, prefix, dryRun: true, aliveFn: aliveSelf })
    assert.deepEqual(r.candidates, [`${prefix}.1.corrupted`])
    assert.deepEqual(r.deleted, [])
    assert.equal(existsSync(old), true)
  })
})

// ====================================================================
// T6/T7/T7a/T7b — setSlotTitle { ok, reason } 契约（F3）
// ====================================================================

describe("setSlotTitle — { ok, reason } 契约（SESSION.md §12.2.5 F3）", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("T6/T7b 文件缺失 → file-missing；槽号非法 → invalid-slot", () => {
    assert.deepEqual(setSlotTitle(cwd, 99, "t"), { ok: false, reason: "file-missing" })
    assert.deepEqual(setSlotTitle(cwd, 0, "t"), { ok: false, reason: "invalid-slot" })
    assert.deepEqual(setSlotTitle(cwd, -1, "t"), { ok: false, reason: "invalid-slot" })
    assert.deepEqual(setSlotTitle(cwd, 1.5, "t"), { ok: false, reason: "invalid-slot" })
  })

  it("T7 成功 → { ok: true } + 标题落盘（槽文件 + manifest）", () => {
    newSlot(cwd)
    assert.deepEqual(setSlotTitle(cwd, 1, "My Title"), { ok: true })
    assert.equal(loadSlot(cwd, 1).title, "My Title")
  })

  it("T7a 失败原因区分：parse-failure / mtime-conflict（_stat 注入缝）", () => {
    newSlot(cwd)
    writeFileSync(slotPath(cwd, 1), "{not json") // 解析失败现场
    assert.deepEqual(setSlotTitle(cwd, 1, "t"), { ok: false, reason: "parse-failure" })
    saveSlot(cwd, 2, { version: 2, cwd, title: "a", history: [] })
    let tick = 0
    const fakeStat = () => ({ mtimeMs: 1000 + ++tick })
    assert.deepEqual(setSlotTitle(cwd, 2, "t", fakeStat), { ok: false, reason: "mtime-conflict" })
    assert.equal(JSON.parse(readFileSync(slotPath(cwd, 2), "utf8")).title, "a", "冲突时未写盘")
  })
})

// ====================================================================
// T9-T12 — 冷 cwd 判定/删除原语（F2——执行面仅 CLI）
// ====================================================================

function makeCwd(dir, hash, { manifestDays = 0, slotSessions = {}, dataFiles = [], residue = [] } = {}) {
  const prefix = `${hash}.json`
  const mpath = touch(dir, `${prefix}.manifest`, JSON.stringify({ slots: {}, slotSessions }))
  if (manifestDays) age(mpath, manifestDays)
  for (const n of dataFiles) touch(dir, `${prefix}.${n}`, "{}")
  for (const r of residue) touch(dir, `${prefix}.${r}`)
  return prefix
}

describe("session-gc — 冷 cwd 原语（SESSION.md §12.2.4 F2）", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("T9 冷 cwd A（91 天 + 无活跃数据文件）列入、活跃 cwd B 不列", () => {
    const dir = sessionsDir()
    makeCwd(dir, "colda", { manifestDays: 91, dataFiles: [2], residue: ["manifest.cli", "2.corrupted"] })
    makeCwd(dir, "liveb", { manifestDays: 1, dataFiles: [1] })
    const cold = listColdCwds({ dir, aliveFn: aliveSelf })
    assert.deepEqual(cold.map((c) => c.hash), ["colda"])
    assert.equal(cold[0].dataFiles, 1)
  })

  it("T10 近期 cwd（manifest 30 天 < 90 天阈值）不列入冷候选", () => {
    const dir = sessionsDir()
    makeCwd(dir, "recent", { manifestDays: 30 })
    assert.deepEqual(listColdCwds({ dir, aliveFn: aliveSelf }), [])
  })

  it("T11 删除清空指定冷 cwd 整前缀（manifest+marker+死主数据+残留）；活跃 cwd 不动", () => {
    const dir = sessionsDir()
    makeCwd(dir, "colda", { manifestDays: 91, dataFiles: [2], residue: ["manifest.cli", "manifest.vscode", "2.corrupted", "3.tmp"] })
    makeCwd(dir, "liveb", { manifestDays: 1, dataFiles: [1] })
    const r = deleteColdCwd("colda", { dir, aliveFn: aliveSelf })
    assert.equal(r.ok, true)
    assert.equal(r.deleted.length, 6, "manifest+2 marker+数据文件+corrupted+tmp 全删")
    assert.equal(existsSync(join(dir, "colda.json.manifest")), false)
    assert.equal(existsSync(join(dir, "colda.json.2")), false)
    assert.equal(existsSync(join(dir, "colda.json.manifest.vscode")), false)
    assert.equal(existsSync(join(dir, "liveb.json.manifest")), true, "活跃 cwd 不动")
    assert.equal(existsSync(join(dir, "liveb.json.1")), true)
  })

  it("T12 删活跃 cwd 被拒（属主活 → 非冷；TOCTOU 重校验）", () => {
    const dir = sessionsDir()
    makeCwd(dir, "active", { manifestDays: 120, dataFiles: [1], slotSessions: { 1: `${process.pid}-1-x` } })
    const r = deleteColdCwd("active", { dir, aliveFn: aliveSelf })
    assert.deepEqual(r, { ok: false, reason: "not-cold", deleted: [] })
    assert.equal(existsSync(join(dir, "active.json.manifest")), true)
    assert.equal(existsSync(join(dir, "active.json.1")), true, "拒绝后零删除")
  })
})
