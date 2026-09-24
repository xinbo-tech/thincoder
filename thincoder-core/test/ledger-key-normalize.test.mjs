/**
 * ledger-key-normalize.test.mjs — 台账库键归一用例（`LEDGER.md` §2.1 / §7.1 · 批档 §2.4 T21–T23）。
 *
 * T21 键归一（同项目两盘符拼写 / 分隔符与尾斜杠混写 ⇒ 同库路径；盘符本大写 ⇒ 键 = 原样 `sha1[:16]` 回归）
 * T22 级联守卫（§2.1 比较边界登记：`findProject` / `notifyKey` 两拼写同键同库——同契约下游）
 * T23 边界（null / undefined / 空串 cwd 不炸——`resolve(cwd ?? ".")` 只兜此三态）
 * + AC-M2-11 单源判据（射程 = 台账键生成面：`createHash` 恰一处）。
 * 手法：临时项目（manifest 真判据）+ `_setLedgerDirForTest` 缝（零真实用户目录读写）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { findProject, ledgerDbPath, ledgerKey, notifyKey, _resetLedgerDirForTest, _setLedgerDirForTest } from "../ledger.mjs"
import { normalizeCwd } from "../session-slots.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
let tmp, proj, flipped
const sha16 = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16)

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-key-"))
  proj = join(tmp, "proj")
  mkdirSync(proj, { recursive: true })
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
  // 盘符翻转拼写（VSC `uri.fsPath` 形态——非盘符平台 = 原串，断言相应退化为恒真）
  flipped = proj.replace(/^([A-Za-z]):/, (_, d) => d.toLowerCase() + ":")
})
afterEach(() => { _resetLedgerDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

// ── T21 键归一 ──────────────────────────────────────────────────────────────
test("T21 正常：两盘符拼写 + 分隔符 / 尾斜杠混写 ⇒ 同库路径；盘符本大写 ⇒ 键 = 原样 sha1[:16]（回归）", () => {
  const db = ledgerDbPath(proj)
  if (/^[A-Za-z]:/.test(proj)) assert.notEqual(flipped, proj, "反证：两拼写确不同（非空转）")
  for (const [label, cwd] of [
    ["盘符翻转拼写", flipped],
    ["正斜杠形态", proj.replace(/\\/g, "/")],
    ["尾斜杠", proj + sep],
    ["点段（resolve 既有规范化）", join(proj, ".")],
  ]) {
    assert.equal(ledgerDbPath(cwd), db, `${label} ⇒ 同库路径`)
  }
  assert.equal(ledgerKey(flipped), ledgerKey(proj), "两拼写同键")
  // 回归：盘符本大写（CLI 侧 process.cwd()）⇒ 归一恒等 ⇒ 键 = 未归一哈希原值（本批前键零变）
  assert.equal(ledgerKey(proj), sha16(proj), "CLI 现状键不变（归一恒等）")
  assert.equal(basename(db), `${sha16(proj)}.db`, "库文件名 = 键 + .db")
})

// ── T22 级联守卫（§2.1 比较边界登记面——同契约下游）────────────────────────────
test("T22 边界：findProject / notifyKey 两拼写同键同库（级联面随键收敛）", () => {
  const db = ledgerDbPath(proj)
  mkdirSync(dirname(db), { recursive: true })
  writeFileSync(db, "")
  const sameDir = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b)
  /** 项目根或其内路径（键按项目根派生 ⇒ 子目录命中同库——级联面随键收敛）。 */
  const withinRoot = (p) => { const n = (x) => (process.platform === "win32" ? x.toLowerCase() : x); const a = n(p); const b = n(proj); return a === b || a.startsWith(b + sep) }
  for (const [label, cwd] of [["规范形", proj], ["盘符翻转形", flipped], ["项目内子目录", join(proj, "docs")]]) {
    const hit = findProject(cwd)
    assert.ok(hit, `${label}：命中已注册台账`)
    assert.ok(sameDir(hit.root, proj) || withinRoot(hit.root), `${label}：根 = 项目根或其内路径——拼写可随锚（§2.1 比较边界登记面）`)
    assert.equal(hit.ledger, db, `${label}：同一库文件（键面收敛——不靠裸路径串比较）`)
  }
  assert.equal(notifyKey(db), notifyKey(db.replace(/^([A-Za-z]):/, (_, d) => d.toLowerCase() + ":")), "去重档键两拼写同键")
  assert.equal(notifyKey(db), db.replace(/\\/g, "/").replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`), "键形态 = 绝对路径·正斜杠 + 盘符大写（跨端同规则）")
})

// ── T23 边界：null / undefined / 空串 ────────────────────────────────────────
test("T23 边界：null / undefined / 空串 cwd 不炸（数值 / 对象不在本用例射程）", () => {
  for (const [label, cwd] of [["null", null], ["undefined", undefined], ["空串", ""]]) {
    let out
    assert.doesNotThrow(() => { out = ledgerDbPath(cwd) }, `${label}：不炸`)
    assert.ok(out.endsWith(".db"), `${label}：返回库路径`)
  }
})

// ── AC-M2-11 单源判据（射程 = 台账键生成面）────────────────────────────────────
test("AC-M2-11 单源：键只在 ledgerKey 一处生成；归一步直引 normalizeCwd；目录读数导出在场", () => {
  const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
  const db = read("ledger-db.mjs")
  assert.equal((db.match(/createHash\("sha1"\)/g) ?? []).length, 1, "ledger-db.mjs：sha1 键式恰一处")
  assert.match(db, /export function ledgerKey\(root\)/, "键式单源 = ledgerKey")
  assert.match(db, /export function ledgerDirPath\(\)/, "目录读数导出（§7.1）")
  assert.equal(ledgerKey(proj), sha16(normalizeCwd(proj)), "键式 = sha1(normalizeCwd(root))[:16]（直引同契约）")
  for (const rel of ["ledger.mjs", "ledger-cmd.mjs", "ledger-surface.mjs"]) {
    assert.equal((read(rel).match(/createHash/g) ?? []).length, 0, `${rel}：零自有键式（经单源）`)
  }
})
