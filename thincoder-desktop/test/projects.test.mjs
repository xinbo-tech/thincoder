/**
 * projects.test.mjs — E-2 用例（批档 §2.5 U20–U27 + U36 · `docs/desktop/design/PROJECT.md` / `IPC.md` §2）：
 * 项目面（物化 + 幂等 + 往返读数 + 最近目录序/上限 + fail-soft + 坏文件容忍 + 接线机检 + 载入序生产链闭包）。
 * 纪律：本档 import 面**只经 `./projects.mjs`**（不 import 端壳 —— U20 载入序不变量读的是生产链）；
 * 沙箱缝与核读数一律自核直接取（`@thincoder/core/*`）。沙箱逐用例 `mkdtemp`，用例后复位。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { _resetSessionsDirForTest, _setSessionsDirForTest, sessionEnd, sessionPath } from "@thincoder/core/session-slots.mjs"
import { listSlots } from "@thincoder/core/session-slots.mjs"
import { newSlotData } from "@thincoder/core/session-slot-write.mjs"
import { RECENT_LIMIT, currentCwd, openProject, recentDirs } from "../src/main/projects.mjs"

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const hashOf = (p) => createHash("sha256").update(readFileSync(p)).digest("hex")
const hex40 = (n) => n.toString(16).padStart(2, "0").repeat(20)

/** 沙箱：sessions 根指向 tmp；返回 { dir, cwd }（cwd = 真目录，供物化面用）。 */
function sandbox(t, tag = "proj") {
  const dir = mkdtempSync(join(tmpdir(), "desktop-projects-"))
  const cwd = join(dir, tag)
  mkdirSync(cwd, { recursive: true })
  _setSessionsDirForTest(dir)
  t.after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
  return { dir, cwd }
}

/** 盘面快照（名 + 尺寸 + mtime —— 零改动判据的读数面）。 */
function snapshot(dir) {
  return readdirSync(dir).sort().map((name) => {
    const st = statSync(join(dir, name))
    return { name, size: st.size, mtimeMs: st.mtimeMs }
  })
}

/** 族夹具：`{hash}.json` 内容 = `{ cwd }`，mtime 定死（序判据不受写入时刻影响）。 */
function family(dir, n, cwd, seconds) {
  const name = `${hex40(n)}.json`
  writeFileSync(join(dir, name), JSON.stringify({ cwd }), "utf8")
  const at = new Date(1_700_000_000_000 + seconds * 1000)
  utimesSync(join(dir, name), at, at)
  return name
}

// ─── U20 物化（裸式数据文件 · 不认领 · 载入序不变量）───────────────

test("U20: 空目录 ⇒ 裸式数据文件 ∧ 内容同形 ∧ 零认领 ∧ 端名已声明", async (t) => {
  const { dir, cwd } = sandbox(t)
  assert.equal(currentCwd(), null, "初始 = 未打开任何项目")
  const res = await openProject({ path: cwd })
  assert.equal(res.cwd, cwd, "返回值 = 当前项目")

  const path = sessionPath(cwd)
  assert.equal(existsSync(path), true, "裸路径 `sessionPath(cwd)` 落盘（IPC.md:47）")
  const data = JSON.parse(readFileSync(path, "utf8"))
  assert.deepEqual(Object.keys(data).sort(), Object.keys(newSlotData(cwd)).sort(), "内容键集 = 核 `newSlotData` 同形")
  assert.equal(data.createdBy, "desktop", "createdBy = desktop（载入序不变量：本档 import 链先声明端名）")
  assert.equal(sessionEnd(), "desktop", "端名已声明（本档未 import 端壳 —— 生产链自足）")
  assert.deepEqual(readdirSync(dir).filter((n) => n.endsWith(".json")), [basename(path)], "sessions 根唯一 .json = 数据文件（零 manifest · 不认领 D-1）")
  assert.equal(existsSync(`${path}.manifest`), false, "零 manifest 落盘")
  assert.deepEqual(listSlots(cwd), [], "清单为空 = 未认领（认领属 newSlot / resumeSlot 职责）")
})

// ─── U21 幂等 ─────────────────────────────────────────────────

test("U21: 二次打开（已物化）⇒ 盘面零改动", async (t) => {
  const { dir, cwd } = sandbox(t)
  await openProject({ path: cwd })
  const before = snapshot(dir)
  const hash = hashOf(sessionPath(cwd))
  await openProject({ path: cwd })
  assert.deepEqual(snapshot(dir), before, "名/尺寸/mtime 全等（零写）")
  assert.equal(hashOf(sessionPath(cwd)), hash, "内容哈希不变")
})

// ─── U22 往返读数 ──────────────────────────────────────────────

test("U22: 往返读数（当前项目 + recent[0] 同源）", async (t) => {
  const { cwd } = sandbox(t)
  const res = await openProject({ path: cwd })
  assert.equal(currentCwd(), cwd, "内存态持当前项目")
  assert.equal(res.recent[0]?.cwd, cwd, "新族位次由打开写定")
  assert.equal(res.recent.length, 1, "沙箱内单族")
  assert.equal(recentDirs()[0]?.cwd, cwd, "两读面同值（同一读数函数）")
})

// ─── U23 序与上限（12 族 ⇒ 前 10 降序）───────────────────────────

test("U23: 12 族 ⇒ 前 10 ∧ 逐位按族最新 mtime 降序", (t) => {
  const { dir } = sandbox(t)
  for (let i = 0; i < 12; i++) family(dir, i + 1, `C:\\proj\\f${i}`, i)
  const recent = recentDirs()
  assert.equal(RECENT_LIMIT, 10, "上限 = 10（IPC.md:50）")
  assert.equal(recent.length, 10, "上限截断（12 ⇒ 10）")
  assert.deepEqual(
    recent.map((r) => r.cwd),
    Array.from({ length: 10 }, (_, k) => `C:\\proj\\f${11 - k}`),
    "逐位：mtime 降序（最旧两族出局）",
  )
  for (let i = 1; i < recent.length; i++) assert.ok(recent[i - 1].mtimeMs > recent[i].mtimeMs, `第 ${i} 位严格降序`)
})

// ─── U24 读面纯盘面（零内存依赖 · 序随 mtime 随动）─────────────────

test("U24: 两读等值 ∧ 序随 mtime 随动（纯盘面：本档从未 open）", (t) => {
  const { dir } = sandbox(t)
  const held = currentCwd() // 前序用例的内存态（本档零 open ⇒ 不得随读数变动）
  const old = family(dir, 1, "C:\\proj\\old", 0)
  family(dir, 2, "C:\\proj\\new", 60)
  const first = recentDirs()
  assert.deepEqual(recentDirs(), first, "连续两次读数等值（定序）")
  assert.deepEqual(first.map((r) => r.cwd), ["C:\\proj\\new", "C:\\proj\\old"], "序 = mtime 降序")

  const at = new Date(1_700_000_000_000 + 120_000)
  utimesSync(join(dir, old), at, at)
  assert.deepEqual(recentDirs().map((r) => r.cwd), ["C:\\proj\\old", "C:\\proj\\new"], "改 mtime ⇒ 序随动（纯盘面读数）")
  assert.equal(currentCwd(), held, "读数不改内存态（零副作用）")
})

// ─── U25 fail-soft（取消 / 路径无效）────────────────────────────

test("U25: pick 取消 ∧ 路径无效 ⇒ cwd 保持前值 + 盘面零改动", async (t) => {
  const { dir, cwd } = sandbox(t)
  await openProject({ path: cwd })
  const before = snapshot(dir)
  const cancelled = await openProject({ pick: async () => null })
  assert.equal(cancelled.cwd, cwd, "取消 ⇒ 当前项目不变")
  const invalid = await openProject({ path: join(dir, "no-such-dir") })
  assert.equal(invalid.cwd, cwd, "路径无效 ⇒ 当前项目不变")
  assert.equal(currentCwd(), cwd, "内存态不变")
  assert.deepEqual(snapshot(dir), before, "盘面零改动（名/尺寸/mtime 等值）")
})

// ─── U26 坏文件容忍（整族跳过 · 候选级终止）──────────────────────

test("U26: 坏 JSON / 无 cwd / 候选坏 ⇒ 整族跳过，其余族正常", (t) => {
  const { dir } = sandbox(t)
  family(dir, 1, "C:\\proj\\ok", 0)
  writeFileSync(join(dir, `${hex40(2)}.json`), "{ not json", "utf8") // 坏 JSON
  writeFileSync(join(dir, `${hex40(3)}.json`), JSON.stringify({ sessionId: "x" }), "utf8") // 无 cwd 字段
  writeFileSync(join(dir, `${hex40(4)}.json`), "{ broken", "utf8") // 混合族 ①：裸文件坏
  writeFileSync(join(dir, `${hex40(4)}.json.2`), JSON.stringify({ cwd: "C:\\proj\\slot2" }), "utf8") // 家族内更大槽号有效
  writeFileSync(join(dir, `${hex40(5)}.json.1`), "{ broken", "utf8") // 混合族 ②：无裸文件 · 最小槽号坏
  writeFileSync(join(dir, `${hex40(5)}.json.2`), JSON.stringify({ cwd: "C:\\proj\\slot2b" }), "utf8") // 家族内更大槽号有效
  const recent = recentDirs()
  assert.deepEqual(recent.map((r) => r.cwd), ["C:\\proj\\ok"], "坏族全跳过（不抛、不猜测、不跨族降级）")
  assert.equal(recent.some((r) => r.cwd === "C:\\proj\\slot2"), false, "候选坏 ⇒ 候选级终止（不换更大槽号）")
  assert.equal(recent.some((r) => r.cwd === "C:\\proj\\slot2b"), false, "无裸文件族同判：最小槽号坏 ⇒ 整族跳过（不降级到槽 2）")
})

// ─── U27 接线机检（picker + 白名单）────────────────────────────

test("U27: 接线机检（ipc.mjs picker / 语言面归一 ∧ preload 白名单二十七项顺序）", () => {
  const ipc = readFileSync(here("../src/main/ipc.mjs"), "utf8")
  for (const needle of ["showOpenDialog", "openDirectory", "payload?.path", "\"project:open\"", "normalizeLocale("]) {
    assert.ok(ipc.includes(needle), `ipc.mjs 含 ${needle}`)
  }
  const preload = createRequire(import.meta.url)(here("../src/preload/preload.cjs"))
  assert.deepEqual(
    [...preload.CHANNELS],
    [
      "config:read", "project:open", "project:recent", "sessions:list",
      "session:create", "session:switch", "session:rename", "session:delete", "session:resume",
      "approval:respond", "history:page", "msg:send", "msg:interrupt",
      "provider:list", "provider:save", "provider:remove", "provider:verify",
      "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
      "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs",
    ],
    "白名单二十七项 + 顺序（U27）",
  )
})

// ─── U36 载入序生产链静态闭包（2.4（a））────────────────────────

test("U36: 自 main.mjs 的静态 import 闭包含端壳 ∧ ipc.mjs 顶层静态 import projects.mjs", () => {
  const entry = here("../src/main/main.mjs")
  const shell = here("../src/main/session-slots.mjs")
  /** 静态说明符（`import … from "…"` / `export … from "…"`；含多行形）——bare 说明符由调用面止步。 */
  const staticSpecifiers = (src) => {
    const specs = []
    for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)\b[\s\S]*?\bfrom\s*["']([^"']+)["']/g)) specs.push(m[1])
    for (const m of src.matchAll(/(?:^|\n)\s*import\s*["']([^"']+)["']/g)) specs.push(m[1])
    return specs
  }
  const seen = new Set()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const spec of staticSpecifiers(readFileSync(file, "utf8"))) {
      if (!spec.startsWith(".")) continue // bare ⇒ 止步（U36 注：主进程链含 electron / @thincoder/core/*）
      queue.push(resolve(dirname(file), spec))
    }
  }
  assert.ok(seen.has(shell), `闭包含端壳（实见 ${[...seen].map((p) => basename(p)).join(", ")}）`)
  assert.ok(staticSpecifiers(readFileSync(here("../src/main/ipc.mjs"), "utf8")).includes("./projects.mjs"), "ipc.mjs 顶层静态 import ./projects.mjs")
})
