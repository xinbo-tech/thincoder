/** session-gc-cli.test.mjs — STARTUP-LATENCY 批 CLI 面用例：
 *  T-SL3.5（触发闸·负例：`--version` 零 traces 扫）· T-SL3.6（触发闸·正例：白名单含无参默认
 *  路径 `command === undefined` / `tui` / `chat` / `acp`——观测面收正见下方注）· `session gc`
 *  命令面（dry-run 只列 / confirm --all 回收）。
 *  沙箱 = 假 HOME（`USERPROFILE` / `HOME` 指向 temp ⇒ config / crash-reports / sessions / traces
 *  全落 temp）+ `THINCODER_TUI_WRAPPED=1`（直行现逻辑，不起包装父）——**禁触真实 `~/.thincoder`**。 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { TRACE_CLEANUP_DELAY_MS } from "@thincoder/core/traces/trace-cleanup.mjs"

const BIN = fileURLToPath(new URL("../bin/thincoder.mjs", import.meta.url))
const DAY = "2026-01-01" // 早已过期的日目录名（目录级判据 ① 整删可观测）
const PAST = new Date("2026-01-01T00:00:00.000Z")

const dirs = []
const tmpRoot = (p) => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d }
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 沙箱 env：假 HOME（`homedir()` 读到 ⇒ `configDir` = `<home>/.thincoder`）+ `THINCODER_TRACES_DIR`
 *  同址钉死（该 env 优先于 `configDir`——`trace-store.mjs` `tracesRoot()`）——装置与清理目标恒一致，
 *  不受外层环境变量影响。 */
function sandbox() {
  const home = tmpRoot("tc-gc-cli-")
  return { home, env: { ...process.env, USERPROFILE: home, HOME: home, THINCODER_TUI_WRAPPED: "1", THINCODER_TRACES_DIR: join(home, ".thincoder", "traces") } }
}

/** 过期轨迹夹具（纯 `.jsonl` 日目录——启动清理 ① 整删 ⇒ 目录消失可观测）。 */
function tracesFixture(home) {
  const day = join(home, ".thincoder", "traces", DAY)
  mkdirSync(day, { recursive: true })
  const f = join(day, "x.jsonl")
  writeFileSync(f, "{}", "utf8")
  utimesSync(f, PAST, PAST)
  return { day }
}

/** sessions 组夹具（manifest + 数据文件；mtime 回拨 ageMs）。 */
function seedGroup(dir, hash, dataCwd, ageMs = 8 * 86_400_000) {
  const prefix = `${hash}.json`
  const write = (name, text) => {
    const p = join(dir, name)
    writeFileSync(p, text, "utf8")
    const t = new Date(Date.now() - ageMs)
    utimesSync(p, t, t)
  }
  write(`${prefix}.manifest`, JSON.stringify({ slots: { 1: { ts: Date.now(), title: "cli" } }, active: 1, slotSessions: {} }))
  write(`${prefix}.1`, JSON.stringify({ version: 2, cwd: dataCwd, history: [] }))
}

const waitGone = (p, ms = 30000) => new Promise((res) => {
  const t0 = Date.now()
  const tick = () => {
    if (!existsSync(p)) return res(true)
    if (Date.now() - t0 > ms) return res(false)
    setTimeout(tick, 50)
  }
  tick()
})

test("T-SL3.5 触发闸·负例：`--version` 零 traces 扫（白名单外命令零启动清理）", () => {
  const { home, env } = sandbox()
  const { day } = tracesFixture(home)
  const t0 = Date.now()
  const r = spawnSync(process.execPath, [BIN, "--version"], { env, encoding: "utf8", timeout: 60_000 })
  const ms = Date.now() - t0
  assert.equal(r.status, 0, "退出码 0")
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/, "版本行照常打印")
  assert.ok(existsSync(day), "过期日目录零动作（旧实现在此已扫并整删）")
  assert.ok(ms < 10_000, `--version 时长 ${ms}ms（基线 12.9s——真机读数归收口面）`)
})

/** T-SL3.6 观测面收正（TRACES.md §6.4 未决② · 收口前机制微修 2）：`[]` / `tui` / `chat` 在非 TTY /
 *  无键路径经 `exitSoon`（显式 `process.exit`）早退（< 3s）⇒ 延迟拍未及点火、本次不执行
 *  （幂等——下次会话型命令照常清理）⇒ 原「启动清理已执行」行为断言不可观测。收正 = 结构机检
 *  （下方——白名单含 `undefined` / `tui` / `chat` / `acp`）+ 长驻路径行为见证（`acp`）+ 核侧缝用例
 *  （`thincoder-vscode/test/trace-cleanup.test.mjs` T-SL3.7）。子进程面缝不可注入、**不新增环境缝**。 */
test("T-SL3.6 触发闸·正例：acp 长驻路径经延迟拍执行启动清理（≥3s 点火——长驻行为见证）", async () => {
  const { home, env } = sandbox()
  const { day } = tracesFixture(home)
  const t0 = Date.now()
  const child = spawn(process.execPath, [BIN, "acp"], { env, stdio: ["pipe", "ignore", "ignore"] })
  try {
    const gone = await waitGone(day)
    const ms = Date.now() - t0
    assert.ok(gone, "acp：延迟拍点火 ⇒ 启动清理已执行")
    assert.ok(ms >= TRACE_CLEANUP_DELAY_MS, `清理起点 ≥ 调度点 + ${TRACE_CLEANUP_DELAY_MS}ms（实测 ${ms}ms——旧实现即扫为百 ms 级）`)
  } finally { child.kill() }
})

test("触发闸结构机检：白名单判定在档（含无参默认路径）+ 门内 `scheduleTraceCleanup` 恰一处 + 零直呼 `cleanupTraces`", () => {
  const src = readFileSync(BIN, "utf8")
  const gate = src.match(/if \(command === undefined \|\| command === "tui" \|\| command === "chat" \|\| command === "acp"\) \{[\s\S]*?\n\}/)
  assert.ok(gate, "白名单判定在档（`tui` 含无参默认路径 `command === undefined`）")
  assert.match(gate[0], /scheduleTraceCleanup\(\{ dir: tracesRoot\(\), retentionHours: startupCfg\.traces\?\.retentionHours \?\? 24 \}\)/, "门内 = 核侧调度器（延迟拍形态——`dir` / `retentionHours` 调度点捕获）")
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1") // 注释剥除（计数面——同 VSC 结构机检口径）
  assert.equal((code.match(/scheduleTraceCleanup\(/g) ?? []).length, 1, "全档启动清理调度恰一处（白名单外零启动清理）")
  assert.equal((code.match(/cleanupTraces\(/g) ?? []).length, 0, "不再直呼 `cleanupTraces`（统一经调度器延迟点火——D-TR13）")
})

test("命令面：`session gc --dry-run` 只列不删 → `--confirm --all` 回收（假 HOME 沙箱）", () => {
  const { home, env } = sandbox()
  const sessions = join(home, ".thincoder", "sessions")
  mkdirSync(sessions, { recursive: true })
  const liveCwd = tmpRoot("tc-gc-live-")
  const hashA = "a".repeat(40)
  const hashB = "b".repeat(40)
  seedGroup(sessions, hashA, join(home, "gone-a")) // 三合取面：cwd 不可达
  seedGroup(sessions, hashB, join(home, "gone-b"))
  seedGroup(sessions, "c".repeat(40), liveCwd, 100 * 86_400_000) // 冷 cwd 面：manifest 陈旧（cwd 存活）
  const before = readdirSync(sessions).length
  const dry = spawnSync(process.execPath, [BIN, "session", "gc", "--dry-run"], { env, encoding: "utf8", timeout: 120_000 })
  assert.equal(dry.status, 0)
  assert.equal(readdirSync(sessions).length, before, "dry-run 零删")
  assert.match(dry.stdout, /reason cold-90d/, "冷 cwd 面在列（90 天判据）")
  assert.match(dry.stdout, /reason cwd-gone/, "三合取面在列")
  const one = spawnSync(process.execPath, [BIN, "session", "gc", "--confirm", "a".repeat(40)], { env, encoding: "utf8", timeout: 120_000 })
  assert.equal(one.status, 0)
  assert.ok(!existsSync(join(sessions, `${hashA}.json.manifest`)), "单组面（--confirm <hash>）：目标组已回收")
  assert.ok(existsSync(join(sessions, `${hashB}.json.manifest`)), "单组面不碰其余组")
  assert.match(one.stdout, /Moved \d+ files for/, "单组面：回收行")
  const conf = spawnSync(process.execPath, [BIN, "session", "gc", "--confirm", "--all"], { env, encoding: "utf8", timeout: 120_000 })
  assert.equal(conf.status, 0)
  assert.equal(readdirSync(sessions).length, 0, "余量全回收（原目录零残留）")
  const again = spawnSync(process.execPath, [BIN, "session", "gc", "--confirm", "a".repeat(40)], { env, encoding: "utf8", timeout: 120_000 })
  assert.equal(again.status, 1, "已回收组重判 ⇒ 拒（退出码 1）")
  assert.match(again.stderr, /nothing deleted/, "拒行明示零删除")
  const trash = join(home, ".thincoder", "sessions-trash")
  const batches = readdirSync(trash)
  assert.equal(batches.length, 2, "两次回收调用 ⇒ 两个批次（单组面 + 全量面各一）")
  const moved = batches.reduce((n, b) => n + readdirSync(join(trash, b)).length, 0)
  assert.equal(moved, before, "回收批全量在（可回退）")
})
