/**
 * 2026-09-30-vsc-paste-cleanup.test.mjs — 批次本地单元件（VSC 贴图件清理批 · 台账 #735 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs
 *
 * 用例 = 批档 §2.5 机检腿 L1–L4（写时 mtime 扫除 · 3 天窗 · 闸 · 面域 ∥ 零回归）——生产入口直驱：
 * 薄壳 `thincoder-vscode/src/extension/image-handler.mjs` `savePastedImages`（三调用点唯一咽喉）；
 * 扫除 = 核 `@thincoder/core/agent/helpers.mjs` `cleanupOldToolResults` 单源复用（跨包联结同实例断言）。
 * fire-and-forget ⇒ 「超龄件已清」以有界轮询锁读数（≤2s）；零扫除腿以短静置锁否定读数。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const [shell, helpers] = await Promise.all([
  mod("thincoder-vscode/src/extension/image-handler.mjs"),
  mod("thincoder-core/agent/helpers.mjs"),
])
assert.equal((await mod("thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs")).cleanupOldToolResults,
  helpers.cleanupOldToolResults, "跨包联结同模块实例——薄壳扫除 = 核件单源（非第二实现在场）")

const WINDOW = helpers.TMP_RETENTION_MS
const HOUR = 3600_000
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const freshCwd = () => mkdtempSync(join(tmpdir(), "vsc-paste-"))
const tmpOf = (cwd) => join(cwd, ".thincoder", "tmp")
const list = (dir) => (existsSync(dir) ? readdirSync(dir).sort() : [])
const age = (p, ms) => { const t = (Date.now() - ms) / 1000; utimesSync(p, t, t) }
const seed = (dir, name, ms) => { const p = join(dir, name); writeFileSync(p, "x"); age(p, ms); return p }
const until = async (fn, ms = 2000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) return false; await new Promise((r) => setTimeout(r, 10)) } return true }
const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms))

test("L1 写时扫除：首贴落盘 ∥ 超龄回收（生产入口直驱 · 轮询锁）", async () => {
  // ① 首贴：tmp 目录不存在 ⇒ 扫除 readdir 失败静默吞 ∥ 落盘建目录成
  const cwdA = freshCwd()
  const rA = shell.savePastedImages([PNG], cwdA)
  assert.equal(rA.paths.length, 1, "首贴落盘成")
  assert.ok(existsSync(rA.paths[0]), "新件在场")
  await settle(100)
  assert.deepEqual(list(tmpOf(cwdA)), [basename(rA.paths[0])], "首贴：目录仅新件（扫除静默——零残件零抛）")

  // ② 超龄件消 ∥ 未超龄件在 ∥ 子目录件在 ∥ 本次新件在
  const cwdB = freshCwd()
  const tmpB = tmpOf(cwdB)
  mkdirSync(join(tmpB, "sub"), { recursive: true })
  seed(tmpB, "stale.png", WINDOW + HOUR)
  seed(tmpB, "fresh.png", HOUR)
  seed(join(tmpB, "sub"), "stale-in-sub.png", WINDOW + HOUR)
  const rB = shell.savePastedImages([PNG], cwdB)
  assert.equal(rB.paths.length, 1, "落盘出口零变（调用点消费 `.paths`）")
  assert.ok(await until(() => !existsSync(join(tmpB, "stale.png"))), "超龄件 ≤2s 内回收（fire-and-forget ⇒ 轮询锁读数）")
  assert.ok(existsSync(join(tmpB, "fresh.png")), "未超龄件保留")
  assert.ok(existsSync(join(tmpB, "sub", "stale-in-sub.png")), "子目录不触")
  assert.ok(existsSync(rB.paths[0]), "本次新件在场（扫除只删超龄 ⇒ 与本次落盘零干扰）")
})

test("L2 边界窗：严格 older-than——now−3d+1h 留 ∥ now−3d−1h 删", async () => {
  const cwd = freshCwd()
  const tmp = tmpOf(cwd)
  mkdirSync(tmp, { recursive: true })
  seed(tmp, "inside.png", WINDOW - HOUR)
  seed(tmp, "outside.png", WINDOW + HOUR)
  shell.savePastedImages([PNG], cwd)
  assert.ok(await until(() => !existsSync(join(tmp, "outside.png"))), "窗外（now−3d−1h）删")
  assert.ok(existsSync(join(tmp, "inside.png")), "窗内（now−3d+1h）留")
})

test("L3 闸：空表 ∥ 空串 cwd ∥ 非字符串 cwd ⇒ 零扫除 ∥ 弃项如实 ∥ 零抛", async () => {
  const cwd = freshCwd()
  const tmp = tmpOf(cwd)
  mkdirSync(tmp, { recursive: true })
  seed(tmp, "old-sentinel.png", WINDOW + HOUR)

  assert.deepEqual(shell.savePastedImages([], cwd), { paths: [], dropped: 0 }, "空表：核早退（零 fs 触）")
  await settle()
  assert.deepEqual(list(tmp), ["old-sentinel.png"], "空表：零扫除（超龄哨兵仍在）∧ 零新件")

  assert.deepEqual(shell.savePastedImages([PNG], ""), { paths: [], dropped: 1 }, "空串 cwd：核弃项径")
  await settle()
  assert.deepEqual(list(tmp), ["old-sentinel.png"], "空串 cwd：扫除零发起（哨兵不受影响）")

  assert.deepEqual(shell.savePastedImages([PNG], undefined), { paths: [], dropped: 1 }, "非字符串 cwd：核弃项径 ∧ 零抛（闸 = typeof 判据 ∥ 核件同形）")
  await settle()
  assert.deepEqual(list(tmp), ["old-sentinel.png"], "非字符串 cwd：扫除零发起（不达 join，同步段零抛）")
})

test("L4 面域 ∥ 零回归：非贴图超龄同回收 · 返形 ∥ 命名 ∥ 超阈弃零变", async () => {
  const cwd = freshCwd()
  const tmp = tmpOf(cwd)
  mkdirSync(tmp, { recursive: true })
  seed(tmp, "tool-x.txt", WINDOW + HOUR)
  seed(tmp, "tool-y.txt", HOUR)
  const r = shell.savePastedImages([PNG], cwd)
  assert.ok(await until(() => !existsSync(join(tmp, "tool-x.txt"))), "非贴图超龄件同被回收（族形 = 目录内文件）")
  assert.ok(existsSync(join(tmp, "tool-y.txt")), "未超龄非贴图件保留")
  assert.deepEqual(Object.keys(r).sort(), ["dropped", "paths"], "核返形零变 `{paths, dropped}`")
  assert.match(basename(r.paths[0]), /^paste-[a-z0-9]+-0\.png$/, "命名零变 `paste-<id>-<i>.<ext>`")
  const huge = `data:image/png;base64,${Buffer.alloc(15_000_001, 7).toString("base64")}`
  assert.deepEqual(shell.savePastedImages([huge], cwd), { paths: [], dropped: 1 }, "超阈弃（>15MB）语义零变（核基线）")
})
