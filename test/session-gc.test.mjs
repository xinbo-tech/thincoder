/**
 * SESSION.md §12 — 会话目录残留 GC + 标题写显性化（CLI 端，2026-09-06）
 * T1-T4 残留按保留期清理（older-than 边界；utimesSync 回拨造老化文件——测试 seam）
 * T5 dry-run 只列不删；T6/T7/T7a/T7b renameSlot {ok, reason} 契约；T9-T12 冷 cwd 报告/删除
 * T-V1a..d（§12.7）裸 v1 {hash}.json 纳入冷 cwd 删除集：dry-run 含 v1 / confirm 删 v1 / --all 同型 / 活跃拒绝
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, utimesSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  gcResidue, listColdCwds, deleteColdCwd, runSessionGc,
  RESIDUE_RETENTION_MS, ORPHAN_TMP_RETENTION_MS,
} from "../src/session-gc.mjs"
import { renameSlot, slotPath, sessionPath, writeSessionFile } from "../src/session.mjs"

const DAY = 24 * 3600 * 1000
const aliveSelf = (pid) => pid === process.pid // 确定性存活判定（不真跑 tasklist）

function tmp() { return mkdtempSync(join(tmpdir(), "thincoder-gc-")) }
/** utimesSync 回拨 mtime 造老化文件（§12.4 测试 seam 明示） */
function age(p, days) { const t = new Date(Date.now() - days * DAY); utimesSync(p, t, t) }
function touch(dir, name, content = "x", daysOld = 0) {
  const p = join(dir, name)
  writeFileSync(p, content)
  if (daysOld) age(p, daysOld)
  return p
}

// ====================================================================
// T1/T2/T3/T4 — 残留 GC（F1/N1）
// ====================================================================

test("T1 过期 .corrupted/.unreadable/.manifest.corrupted（31 天）删、今天留", () => {
  const dir = tmp()
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
  rmSync(dir, { recursive: true, force: true })
})

test("T2 保留期内的 .bak（29 天 < 30 天）不清；过期 .bak（31 天）清", () => {
  const dir = tmp()
  const prefix = "bbb2.json"
  const recent = touch(dir, `${prefix}.1.bak-1000`, "x", 29)
  const old = touch(dir, `${prefix}.2.bak-2000`, "x", 31)
  const r = gcResidue({ dir, prefix, aliveFn: aliveSelf })
  assert.deepEqual(r.deleted, [`${prefix}.2.bak-2000`])
  assert.equal(existsSync(recent), true)
  assert.equal(existsSync(old), false)
  rmSync(dir, { recursive: true, force: true })
})

test("T3 活跃槽（主文件在 + 属主活）的现场后缀不清（N1 安全）", () => {
  const dir = tmp()
  const prefix = "ccc3.json"
  touch(dir, `${prefix}.1`, JSON.stringify({ version: 2, history: [] }))
  touch(dir, `${prefix}.manifest`, JSON.stringify({ slots: { 1: {} }, slotSessions: { 1: `${process.pid}-1-x` } }))
  const residue = touch(dir, `${prefix}.1.corrupted`, "x", 60) // 再老也不清——活跃槽
  const r = gcResidue({ dir, prefix, aliveFn: aliveSelf })
  assert.deepEqual(r.deleted, [])
  assert.equal(existsSync(residue), true)
  rmSync(dir, { recursive: true, force: true })
})

test("T4 孤儿 .tmp 超 7 天删；恰好 7 天（等于保留期）保留；主文件在的非孤儿 .tmp 保留", () => {
  const dir = tmp()
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
  rmSync(dir, { recursive: true, force: true })
})

test("T5 dry-run 只列不删（N2 可预览）", () => {
  const dir = tmp()
  const prefix = "eee5.json"
  const old = touch(dir, `${prefix}.1.corrupted`, "x", 31)
  const r = gcResidue({ dir, prefix, dryRun: true, aliveFn: aliveSelf })
  assert.deepEqual(r.candidates, [`${prefix}.1.corrupted`])
  assert.deepEqual(r.deleted, [])
  assert.equal(existsSync(old), true)
  rmSync(dir, { recursive: true, force: true })
})

// ====================================================================
// T6/T7/T7a/T7b — renameSlot { ok, reason } 契约（F3）
// ====================================================================

test("T6/T7b renameSlot：文件缺失 → file-missing；槽号非法 → invalid-slot", () => {
  const cwd = join(tmpdir(), `thincoder-gc-nosuch-${Date.now()}`)
  assert.deepEqual(renameSlot(cwd, 99, "t"), { ok: false, reason: "file-missing" })
  assert.deepEqual(renameSlot(cwd, 0, "t"), { ok: false, reason: "invalid-slot" })
  assert.deepEqual(renameSlot(cwd, -1, "t"), { ok: false, reason: "invalid-slot" })
  assert.deepEqual(renameSlot(cwd, 1.5, "t"), { ok: false, reason: "invalid-slot" })
})

test("T7 renameSlot 成功 → { ok: true } + 标题落盘", () => {
  const cwd = join(tmpdir(), `thincoder-gc-rename-${Date.now()}`)
  writeSessionFile(slotPath(cwd, 1), { version: 2, cwd, title: "旧", history: [] })
  try {
    assert.deepEqual(renameSlot(cwd, 1, "新标题"), { ok: true })
    assert.equal(JSON.parse(readFileSync(slotPath(cwd, 1), "utf8")).title, "新标题")
  } finally {
    for (const suffix of [".1", ".manifest", ".manifest.cli", ""]) {
      try { rmSync(sessionPath(cwd) + suffix, { force: true }) } catch {}
    }
  }
})

test("T7a renameSlot 失败原因区分：parse-failure / mtime-conflict（_stat 注入缝）", () => {
  const cwd = join(tmpdir(), `thincoder-gc-reasons-${Date.now()}`)
  writeSessionFile(slotPath(cwd, 2), { version: 2, cwd, title: "a", history: [] }) // writeSessionFile 先建目录
  writeFileSync(slotPath(cwd, 1), "{not json") // 解析失败现场
  try {
    assert.deepEqual(renameSlot(cwd, 1, "t"), { ok: false, reason: "parse-failure" })
    // mtime-conflict：两次 stat 返回不同 mtime（读与写之间被并发方改过的注入模拟）
    let tick = 0
    const fakeStat = () => ({ mtimeMs: 1000 + ++tick })
    assert.deepEqual(renameSlot(cwd, 2, "t", fakeStat), { ok: false, reason: "mtime-conflict" })
    assert.equal(JSON.parse(readFileSync(slotPath(cwd, 2), "utf8")).title, "a", "冲突时未写盘")
  } finally {
    for (const suffix of [".1", ".2", ".manifest", ".manifest.cli", ""]) {
      try { rmSync(sessionPath(cwd) + suffix, { force: true }) } catch {}
    }
  }
})

// ====================================================================
// T9-T12 — 冷 cwd（F2）
// ====================================================================

/** 造一个 cwd 前缀：manifest（可老化）+ 可选死主数据文件/残留 */
function makeCwd(dir, hash, { manifestDays = 0, slotSessions = {}, dataFiles = [], residue = [] } = {}) {
  const prefix = `${hash}.json`
  const mpath = touch(dir, `${prefix}.manifest`, JSON.stringify({ slots: {}, slotSessions }))
  if (manifestDays) age(mpath, manifestDays)
  for (const n of dataFiles) touch(dir, `${prefix}.${n}`, "{}")
  for (const r of residue) touch(dir, `${prefix}.${r}`)
  return prefix
}

test("T9 dry-run 报告：冷 cwd A（91 天 + 无活跃数据文件）列入、活跃 cwd B 不列、零删除", () => {
  const dir = tmp()
  makeCwd(dir, "colda", { manifestDays: 91, dataFiles: [2], residue: ["manifest.cli", "2.corrupted"] }) // 死主数据文件仍算冷（无活属主）
  makeCwd(dir, "liveb", { manifestDays: 1, dataFiles: [1] })
  const cold = listColdCwds({ dir, aliveFn: aliveSelf })
  assert.deepEqual(cold.map((c) => c.hash), ["colda"])
  assert.equal(cold[0].dataFiles, 1)
  // 命令层 dry-run：零删除
  const out = []
  const code = runSessionGc(["gc", "--dry-run"], { dir, prefix: "colda.json", out: (s) => out.push(s), err: () => {}, aliveFn: aliveSelf })
  assert.equal(code, 0)
  assert.ok(out.some((l) => l.includes("colda")), "报告列冷 cwd")
  assert.ok(!out.some((l) => l.includes("liveb")), "活跃 cwd 不列")
  assert.equal(existsSync(join(dir, "colda.json.manifest")), true, "dry-run 不删")
  rmSync(dir, { recursive: true, force: true })
})

test("T10 近期 cwd（manifest 30 天 < 90 天阈值）不列入冷候选", () => {
  const dir = tmp()
  makeCwd(dir, "recent", { manifestDays: 30 })
  assert.deepEqual(listColdCwds({ dir, aliveFn: aliveSelf }), [])
  rmSync(dir, { recursive: true, force: true })
})

test("T11 confirm 清空指定冷 cwd 整前缀（manifest+marker+死主数据+残留）；活跃 cwd 不动", () => {
  const dir = tmp()
  makeCwd(dir, "colda", { manifestDays: 91, dataFiles: [2], residue: ["manifest.cli", "manifest.vscode", "2.corrupted", "3.tmp"] })
  makeCwd(dir, "liveb", { manifestDays: 1, dataFiles: [1] })
  const r = deleteColdCwd("colda", { dir, aliveFn: aliveSelf })
  assert.equal(r.ok, true)
  assert.equal(r.deleted.length, 6, "manifest+2 marker+数据文件+corrupted+tmp 全删")
  assert.equal(existsSync(join(dir, "colda.json.manifest")), false)
  assert.equal(existsSync(join(dir, "colda.json.2")), false)
  assert.equal(existsSync(join(dir, "colda.json.manifest.cli")), false)
  assert.equal(existsSync(join(dir, "liveb.json.manifest")), true, "活跃 cwd 不动")
  assert.equal(existsSync(join(dir, "liveb.json.1")), true)
  rmSync(dir, { recursive: true, force: true })
})

test("T12 删活跃 cwd 被拒（属主活 → 非冷；TOCTOU 重校验）", () => {
  const dir = tmp()
  makeCwd(dir, "active", { manifestDays: 120, dataFiles: [1], slotSessions: { 1: `${process.pid}-1-x` } })
  const r = deleteColdCwd("active", { dir, aliveFn: aliveSelf })
  assert.deepEqual(r, { ok: false, reason: "not-cold", deleted: [] })
  assert.equal(existsSync(join(dir, "active.json.manifest")), true)
  // 命令层 confirm 活跃 hash：拒绝 + 退出码 1
  const errs = []
  const code = runSessionGc(["gc", "--confirm", "active"], { dir, out: () => {}, err: (s) => errs.push(s), aliveFn: aliveSelf })
  assert.equal(code, 1)
  assert.ok(errs.some((l) => /Refused/.test(l)))
  assert.equal(existsSync(join(dir, "active.json.1")), true, "拒绝后零删除")
  rmSync(dir, { recursive: true, force: true })
})

test("命令层用法错误：无参数 / --dry-run 与 --confirm 同给（互斥）→ 退出码 1", () => {
  const errs = []
  assert.equal(runSessionGc(["gc"], { err: (s) => errs.push(s) }), 1)
  assert.equal(runSessionGc(["gc", "--dry-run", "--confirm", "x"], { err: (s) => errs.push(s) }), 1)
  assert.equal(runSessionGc(["gc", "--dry-run", "--confirm"], { err: (s) => errs.push(s) }), 1, "无值 --confirm 同互斥")
  assert.equal(errs.filter((l) => /Usage/.test(l)).length, 3)
})

test("T11b 命令层 --confirm <hash>：警告 + 文件清单 + 删除", () => {
  const dir = tmp()
  makeCwd(dir, "coldc", { manifestDays: 91, dataFiles: [1] })
  const out = []
  const code = runSessionGc(["gc", "--confirm", "coldc"], { dir, out: (s) => out.push(s), err: () => {}, aliveFn: aliveSelf })
  assert.equal(code, 0)
  assert.ok(out.some((l) => l.includes("此操作永久删除该 cwd 的全部会话历史")), "删除前警告（N2）")
  assert.ok(out.some((l) => l.includes("coldc.json.manifest")), "文件清单")
  assert.equal(existsSync(join(dir, "coldc.json.manifest")), false)
  assert.equal(existsSync(join(dir, "coldc.json.1")), false)
  rmSync(dir, { recursive: true, force: true })
})

// ====================================================================
// T-V1（§12.7 D-V2）— legacy 裸 v1 {hash}.json 纳入冷 cwd 删除集
//   F-V1/NF-V1：删除集 = 既有全集 + 裸 v1；dry-run 报告同含；冷态判定不受 v1 影响
// ====================================================================

test("T-V1a 冷 cwd 含裸 v1：文件集合/dry-run 报告含 v1、dataFiles 不含（判定不变）、零删除", () => {
  const dir = tmp()
  makeCwd(dir, "coldv1", { manifestDays: 91, dataFiles: [1], residue: ["manifest.cli"] })
  const v1 = touch(dir, "coldv1.json", "{version:1 legacy}") // 裸 v1 = 文件名恰为 prefix
  const cold = listColdCwds({ dir, aliveFn: aliveSelf })
  assert.equal(cold.length, 1)
  assert.ok(cold[0].files.includes("coldv1.json"), "整前缀文件集合含裸 v1")
  assert.equal(cold[0].dataFiles, 1, "v1 不计数据文件——冷态判定不变（NF-V1）")
  const out = []
  const code = runSessionGc(["gc", "--dry-run"], { dir, out: (s) => out.push(s), err: () => {}, aliveFn: aliveSelf })
  assert.equal(code, 0)
  const line = out.find((l) => l.includes("coldv1"))
  assert.ok(line, "报告列冷 cwd")
  assert.ok(line.includes("total files 4"), "total files 含 v1（manifest+v1+数据文件+marker）")
  assert.ok(line.includes("data files 1"), "v1 不在 data files 计数")
  assert.equal(existsSync(v1), true, "dry-run 不删")
  rmSync(dir, { recursive: true, force: true })
})

test("T-V1b confirm 删除含裸 v1 的冷 cwd：警告清单含 v1、删除后 v1 消失 + 整前缀清空", () => {
  const dir = tmp()
  makeCwd(dir, "coldv1", { manifestDays: 91, dataFiles: [1], residue: ["manifest.cli", "2.corrupted"] })
  const v1 = touch(dir, "coldv1.json", "{version:1 legacy}")
  const out = []
  const code = runSessionGc(["gc", "--confirm", "coldv1"], { dir, out: (s) => out.push(s), err: () => {}, aliveFn: aliveSelf })
  assert.equal(code, 0)
  assert.ok(out.some((l) => l.trim() === "coldv1.json"), "删除前警告清单含裸 v1 文件名")
  assert.ok(out.some((l) => l.includes("coldv1.json.manifest")), "警告清单含 manifest")
  assert.equal(existsSync(v1), false, "confirm 后裸 v1 消失")
  assert.equal(existsSync(join(dir, "coldv1.json.manifest")), false)
  assert.equal(existsSync(join(dir, "coldv1.json.1")), false)
  assert.equal(existsSync(join(dir, "coldv1.json.manifest.cli")), false)
  assert.equal(existsSync(join(dir, "coldv1.json.2.corrupted")), false)
  rmSync(dir, { recursive: true, force: true })
})

test("T-V1c --confirm --all 同型：每个冷 cwd 的裸 v1 一并删除", () => {
  const dir = tmp()
  makeCwd(dir, "coldva", { manifestDays: 91, dataFiles: [1] })
  const v1a = touch(dir, "coldva.json", "{version:1 legacy}")
  makeCwd(dir, "coldvb", { manifestDays: 120, dataFiles: [1] })
  const v1b = touch(dir, "coldvb.json", "{version:1 legacy}")
  const out = []
  const code = runSessionGc(["gc", "--confirm", "--all"], { dir, out: (s) => out.push(s), err: () => {}, aliveFn: aliveSelf })
  assert.equal(code, 0)
  assert.ok(out.some((l) => l.trim() === "coldva.json"), "--all 警告含 v1")
  assert.ok(out.some((l) => l.trim() === "coldvb.json"))
  assert.equal(existsSync(v1a), false, "v1 随整前缀删除")
  assert.equal(existsSync(v1b), false)
  assert.equal(existsSync(join(dir, "coldva.json.manifest")), false)
  assert.equal(existsSync(join(dir, "coldvb.json.manifest")), false)
  rmSync(dir, { recursive: true, force: true })
})

test("T-V1d 活跃 cwd 含裸 v1 → confirm 拒绝、v1 保留（v1 不改变冷态判定——TOCTOU 不回归）", () => {
  const dir = tmp()
  makeCwd(dir, "active", { manifestDays: 120, dataFiles: [1], slotSessions: { 1: `${process.pid}-1-x` } })
  const v1 = touch(dir, "active.json", "{version:1 legacy}")
  const r = deleteColdCwd("active", { dir, aliveFn: aliveSelf })
  assert.deepEqual(r, { ok: false, reason: "not-cold", deleted: [] }, "有活跃属主 → 非冷")
  const errs = []
  const code = runSessionGc(["gc", "--confirm", "active"], { dir, out: () => {}, err: (s) => errs.push(s), aliveFn: aliveSelf })
  assert.equal(code, 1)
  assert.ok(errs.some((l) => /Refused/.test(l)))
  assert.equal(existsSync(v1), true, "拒绝后裸 v1 保留")
  assert.equal(existsSync(join(dir, "active.json.1")), true)
  assert.equal(existsSync(join(dir, "active.json.manifest")), true)
  rmSync(dir, { recursive: true, force: true })
})

