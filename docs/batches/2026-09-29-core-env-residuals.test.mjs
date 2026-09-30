/**
 * 2026-09-29-core-env-residuals.test.mjs — 批内件（#439 两腿 · 随批留存归档 · 不进仓套件）。
 * 名随批次档 · 住批次目录；复跑 = 仓根（thincoder/）执行
 * `node --test docs/batches/2026-09-29-core-env-residuals.test.mjs`
 * （#545 立即形：子代理写门相抵时暂存 `.thincoder/tmp/` 同名件——两处均两层深，
 * 一律以 `process.cwd()` 为仓根解析 ⇒ 暂存位与终位同一命令形态）。
 *
 * 腿一（#439①）：键面全链路 spawn 腿——`diagnostics.{heapWatch,heapSnapshot}` → bin 读键
 *   （`thincoder-cli/bin/thincoder.mjs:52-55`）→ 形参（`:60` / `:67`）→ 两消费者调用
 *   （`src/crash-reports.mjs:87-89` `armHeapSnapshot(1)` · `src/heap-watch.mjs:70-71` timer 注册）。
 *   探针 = `--import` 先载（**file:// URL**——Windows 裸盘符 ERR_UNSUPPORTED_ESM_URL_SCHEME）：
 *   `globalThis.setInterval` 包裹计数（heap-watch 定时器）+ `require("node:v8")
 *   .setHeapSnapshotNearHeapLimit` CJS 对象改写计数（ESM namespace 只读，但 `crash-reports.mjs:79`
 *   默认形参取 CJS 对象活值 ⇒ 改写生效——本件首跑逐态复核）。
 *   4 态矩阵（断言形：关态 `==0` ∕ 开态 `≥1`——「实测 1」为读数不作精确判据）+ 每 case 三附判
 *   （exit 1 ∧ stderr `R25 test crash` ∧ 计数 JSON 在）+ 探针装载负控（无 `--import` ⇒ 计数缺失
 *   ⇒ 存在性判据可判别）。
 * 腿二（#439②）：零参缺省路径真 spawn 腿——包装父触发（`bin:44-46`）→ 子 `--tui-wrapped` →
 *   子非 TTY TUI 门抛错（`src/tui/index.mjs:76-78`）→ 子 `exitSoon(1)`
 *   （`src/command-interactive.mjs:169-172`）→ 父同码退（`src/tui/wrapped-spawn.mjs:54-55`）。
 *   四判据：exit 1 ∕ stderr `TUI requires a TTY` ∕ 沙箱 crash-reports 恰一份 `tui-stderr-*.log`
 *   （头行 + 转发错误行）∕ stdout `thincoder loading`。
 *
 * 隔离：假 HOME（USERPROFILE ∕ HOME 双设 ⇒ `thincoder-core/config-io.mjs:32` `homedir()`
 * 派生 `configDir`）——真实 `~/.thincoder` 零触；沙箱 = mkdtemp + exit 钩子清理。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
const BIN = join(ROOT, "thincoder-cli", "bin", "thincoder.mjs")

// ─── 沙箱工具面 ─────────────────────────────────────────────────────────────

const dirs = []
function mkSandbox(prefix) {
  const d = mkdtempSync(join(tmpdir(), prefix))
  dirs.push(d)
  return d
}
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 沙箱 = 假 HOME（USERPROFILE ∕ HOME 双设——win32 ∕ POSIX 同源；装置与清理目标恒一致）。 */
function sandbox() {
  const home = mkSandbox("tc-envres-")
  return { home, env: { ...process.env, USERPROFILE: home, HOME: home } }
}

/** 状态注入：`<home>/.thincoder/config.json` 的 `diagnostics` 段（缺省态 = 不写文件）。 */
function seedDiagnostics(home, diagnostics) {
  const dir = join(home, ".thincoder")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "config.json"), JSON.stringify({ diagnostics }), "utf8")
}

/** 探针源（写于沙箱内、`--import` 先载）：双计数 + exit 钩子同步写回计数 JSON。
 *  - `globalThis.setInterval` 包裹——`heap-watch.mjs` 默认形参 `timer = setInterval` 调用期取值 ⇒ 计入；
 *  - CJS v8 对象改写——`crash-reports.mjs` `import * as v8` 读点取 CJS 活值 ⇒ 计入。 */
const PROBE_SRC = `import { createRequire } from "node:module"
import { writeFileSync } from "node:fs"
const require = createRequire(import.meta.url)
const v8 = require("node:v8")
let snapshot = 0
v8.setHeapSnapshotNearHeapLimit = () => { snapshot++ }
const origSetInterval = globalThis.setInterval
let interval = 0
globalThis.setInterval = (...a) => { interval++; return origSetInterval(...a) }
process.on("exit", () => {
  try { writeFileSync(process.env.TC_PROBE_OUT, JSON.stringify({ interval, snapshot })) } catch { /* 尽力面 */ }
})
`

/** 腿一 spawn：`--import <probeURL>` 先载探针 → bin `--test-crash`（两消费点之后 ⇒ 快出 exit 1）。
 *  `probe: false` = 探针装载负控（不载探针、无计数路径）。 */
function runLeg1(home, env, { probe = true } = {}) {
  const args = [BIN, "--test-crash"]
  let outPath = null
  if (probe) {
    const probePath = join(home, "probe.mjs")
    outPath = join(home, "probe-out.json")
    writeFileSync(probePath, PROBE_SRC, "utf8")
    env.TC_PROBE_OUT = outPath
    args.unshift("--import", pathToFileURL(probePath).href) // Windows 须 file:// URL（裸盘符 ERR_UNSUPPORTED_ESM_URL_SCHEME）
  }
  const t0 = Date.now()
  const r = spawnSync(process.execPath, args, { env, cwd: ROOT, encoding: "utf8", timeout: 60_000 })
  const ms = Date.now() - t0
  let counts = null
  if (outPath && existsSync(outPath)) {
    try { counts = JSON.parse(readFileSync(outPath, "utf8")) } catch { counts = null } // 截断 ∕ 损坏 ⇒ null（下方转显式断言）
  }
  return { r, counts, outPath, ms }
}

/** 每 case 三附判 + 两计数判据（关态 ==0 ∕ 开态 ≥1）。 */
function assertCase(res, { state, interval, snapshot }) {
  const { r, counts, outPath, ms } = res
  assert.equal(r.status, 1, `${state}：exit 1（实测 ${r.status} · signal ${r.signal} · ${ms}ms）`)
  assert.match(r.stderr, /R25 test crash/, `${state}：崩溃门在（两消费点已过——防早期失败假绿）`)
  assert.ok(counts, `${state}：探针计数 JSON 在且可解析（装载负控——缺失 ∕ 损坏 ⇒ 红；实测 ${ms}ms）`)
  if (interval === 0) assert.equal(counts.interval, 0, `${state}：interval 计数 == 0（实测 ${counts.interval}）`)
  else assert.ok(counts.interval >= 1, `${state}：interval 计数 ≥ 1（实测 ${counts.interval}）`)
  if (snapshot === 0) assert.equal(counts.snapshot, 0, `${state}：snapshot 计数 == 0（实测 ${counts.snapshot}）`)
  else assert.ok(counts.snapshot >= 1, `${state}：snapshot 计数 ≥ 1（实测 ${counts.snapshot}）`)
  console.log(`[读数] ${state}：interval=${counts.interval} · snapshot=${counts.snapshot} · exit=${r.status} · ${ms}ms`) // 读数行（报告引用面——复跑可得）
}

// ─── 腿一（#439①）：4 态矩阵 ────────────────────────────────────────────────

const MATRIX = [
  // 取代注（用例退场登记）：缺省快照面 2026-09-30 采集收网批翻转默认关——旧契约期望废止，见 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2
  { state: "缺省（无 config 文件）", diagnostics: null, interval: 1, snapshot: 0 },
  { state: "全关", diagnostics: { heapWatch: false, heapSnapshot: false }, interval: 0, snapshot: 0 },
  { state: "独关 watch", diagnostics: { heapWatch: false, heapSnapshot: true }, interval: 0, snapshot: 1 },
  { state: "独关 snapshot", diagnostics: { heapWatch: true, heapSnapshot: false }, interval: 1, snapshot: 0 },
]

for (const c of MATRIX) {
  const iv = c.interval === 0 ? "==0" : "≥1"
  const sn = c.snapshot === 0 ? "==0" : "≥1"
  test(`腿一 #439① 键面矩阵 · ${c.state} ⇒ interval ${iv} ∕ snapshot ${sn}（真 spawn + --import 探针计数）`, () => {
    const { home, env } = sandbox()
    if (c.diagnostics) seedDiagnostics(home, c.diagnostics)
    assertCase(runLeg1(home, env), { state: c.state, interval: c.interval, snapshot: c.snapshot })
  })
}

test("腿一负控：探针未载（无 --import）⇒ 计数缺失——存在性判据非恒真（缺失即红）", () => {
  const { home, env } = sandbox()
  const res = runLeg1(home, env, { probe: false })
  assert.equal(res.r.status, 1, "同一崩溃路径照常 exit 1")
  assert.match(res.r.stderr, /R25 test crash/, "崩溃门同达")
  assert.equal(existsSync(join(home, "probe-out.json")), false, "无探针 ⇒ 计数 JSON 缺失（正例的「JSON 在」断言可判别）")
})

// ─── 腿二（#439②）：零参缺省路径真 spawn ────────────────────────────────────

test("腿二 #439② 零参缺省路径 ⇒ 包装触发 + 子非 TTY 同码退（exit 1 ∕ tee ∕ 恰一份包装日志 ∕ 加载行）", () => {
  const { home, env } = sandbox()
  const t0 = Date.now()
  const r = spawnSync(process.execPath, [BIN], { env, cwd: ROOT, encoding: "utf8", timeout: 120_000 })
  const ms = Date.now() - t0
  assert.equal(r.status, 1, `同码退链（exit 1；实测 ${r.status} · signal ${r.signal} · ${ms}ms）`)
  assert.match(r.stderr, /TUI requires a TTY/, "stderr tee 转发（子进程真起 + 走默认路径的判别面）")
  const crashDir = join(home, ".thincoder", "crash-reports")
  assert.ok(existsSync(crashDir), "沙箱 crash-reports 目录在（包装父 mkdir 前置——wrapped-spawn.mjs:20）")
  const logs = readdirSync(crashDir).filter((n) => /^tui-stderr-.+\.log$/.test(n))
  assert.equal(logs.length, 1, `包装父签名恰一份（恰一次包装；实测 ${logs.length} 份）`)
  const log = readFileSync(join(crashDir, logs[0]), "utf8")
  assert.match(log, /^# tui-stderr .*pid=\d+/m, "头行（时间 ∕ pid ∕ argv）")
  assert.match(log, /TUI requires a TTY/, "转发错误行落档")
  assert.match(r.stdout, /thincoder loading/, "包装父加载行（spawn 前——写面在）")
  assert.ok(ms < 10_000, `快出——须走 close 快径（实测 ${ms}ms；设计轮读数 ≈1.2s；30s 兜底路径 = wrapped-spawn.mjs:54）`)
  console.log(`[读数] 腿二：exit=${r.status} · ${ms}ms · tui-stderr 恰 ${logs.length} 份 · stdout 载入行在`) // 读数行（报告引用面——复跑可得）
})
