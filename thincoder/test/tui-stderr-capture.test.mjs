/** tui-stderr-capture.test.mjs — TUI-STDERR-CAPTURE（TUI-STDERR-CAPTURE.md）F-1~F-3：
 * mock 注入缝面 + slow 真 spawn 面（THINCODER_TEST_CRASH 门）；Windows 实测 process.kill(SIGINT)=硬杀≠Ctrl+C → 信号 mock；crash-reports 经 USERPROFILE/HOME 重定向隔离。 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { slow } from "./slow.mjs"
import { spawnTuiWrapped, ignoreSignal } from "../src/tui/wrapped-spawn.mjs"
const BIN = fileURLToPath(new URL("../bin/thincoder.mjs", import.meta.url))
const dirs = []
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })
const fakeChild = () => { const c = new EventEmitter(); c.stderr = new EventEmitter(); return c } // 假子进程（评审 #5 mock）
const tmpRoot = () => { const d = mkdtempSync(join(tmpdir(), "tui-stderr-")); dirs.push(d); return d }
const runMock = (dir) => { const child = fakeChild(); const exits = []; const writes = []; const wrapped = spawnTuiWrapped({ dir, spawnImpl: () => child, exitImpl: (c) => exits.push(c), writeImpl: (s) => writes.push(s) }); return { wrapped, exits, writes, child } }
const readLog = (dir) => readFileSync(join(dir, readdirSync(dir)[0]), "utf8")
const clearSig = () => { for (const s of ["SIGINT", "SIGTERM"]) while (process.listenerCount(s) > 0) process.removeListener(s, ignoreSignal) } // 复原 no-op 监听（单一引用精确摘除——不碰 runner 自带）
test("F-1/F-2 单元：tee 落盘（头行+内容）+ mkdir 前置（评审 #2）+ exit 3 → 同码 3", () => {
  const root = tmpRoot()
  const { wrapped, exits, child } = runMock(join(root, "x", "y")) // 深层目录不存在——评审 #2 自动建
  assert.equal(wrapped, true)
  child.stderr.emit("data", "native abort diag\n")
  child.emit("exit", 3, null)
  child.emit("close") // exit 后 close = stderr 尾数据全收 → 收尾退
  assert.deepEqual(exits, [3], "AC-3：子 exit 3 → 父同码 3")
  const dir = join(root, "x", "y")
  assert.match(readdirSync(dir)[0], /^tui-stderr-.+\.log$/, "AC-2：tui-stderr-<ts>-<pid>.log")
  const log = readLog(dir)
  assert.ok(log.startsWith("# tui-stderr"), "F-2：文件头元信息行（时间/pid/argv）")
  assert.ok(log.includes("native abort diag"), "AC-2：子 stderr 全量落盘")
})
test("F-3 单元：signal 死 code null → 父 exit 1（评审 #1）；spawn error → 日志注 + exit 1（评审 #5）", () => {
  const s1 = runMock(tmpRoot()); s1.child.emit("exit", null, "SIGTERM"); s1.child.emit("close")
  assert.deepEqual(s1.exits, [1], "code null + signal → 1")
  const root = tmpRoot()
  const s2 = runMock(root)
  s2.child.emit("error", { message: "ENOENT test" })
  s2.child.emit("close") // 迟到 close 不双退（settled 单次）
  assert.deepEqual(s2.exits, [1], "spawn error → exit 1 不挂死")
  assert.ok(readLog(root).includes("# spawn error"), "日志注失败")
})
test("尽力面单元：日志开失败 → false 不包装直接跑现逻辑（不阻断启动）", () => {
  const block = join(tmpRoot(), "file-block")
  writeFileSync(block, "x")
  let spawned = 0
  assert.equal(spawnTuiWrapped({ dir: block, spawnImpl: () => { spawned++; return fakeChild() }, exitImpl: () => {} }), false)
  assert.equal(spawned, 0, "mkdir 失败（dir 为文件）→ 不 spawn")
})
test("AC-4 单元：父注册 SIGINT/SIGTERM 忽略（tee 不被信号打断）", () => {
  const before = process.listenerCount("SIGINT") + process.listenerCount("SIGTERM")
  assert.ok(runMock(tmpRoot()).wrapped && process.listenerCount("SIGINT") + process.listenerCount("SIGTERM") > before, "包装启动 + 忽略处理器已注册")
  clearSig() // 复原——后续 npm test 进程 Ctrl+C 不被本文件 no-op 监听吞掉
})
test("T6 F3③：子 argv 首位 --diagnostic-dir=<dir>（快照落点定向）——既有 argv 序零破（AC3/AC6）", () => {
  const dir = tmpRoot()
  let seen = null
  const child = fakeChild()
  spawnTuiWrapped({ dir, spawnImpl: (cmd, args) => { seen = { cmd, args }; return child }, exitImpl: () => {} })
  assert.deepEqual(seen.args, [`--diagnostic-dir=${dir}`, BIN, ...process.argv.slice(2)], "首位 = 诊断目录（Node 选项须在脚本前）→ 次位 = bin 脚本 → 其余 argv 序不变")
  assert.equal(seen.cmd, process.execPath, "仍以自身 execPath 起子")
  // 设计 §3.2/§3.4「无条件注入」钉死：开关关值下包装器仍注入（gate 单点在 crash-reports.mjs——
  // 包装器不判 env——防两处判定漂移的回归锁）
  const prev = process.env.THINCODER_HEAP_SNAPSHOT
  process.env.THINCODER_HEAP_SNAPSHOT = "0"
  try {
    const dir2 = tmpRoot()
    let seen2 = null
    const child2 = fakeChild()
    spawnTuiWrapped({ dir: dir2, spawnImpl: (cmd, args) => { seen2 = args; return child2 }, exitImpl: () => {} })
    assert.equal(seen2[0], `--diagnostic-dir=${dir2}`, "env 关值下仍注入（无条件——gate 单点在 crash-reports.mjs）")
    child2.emit("exit", 0, null); child2.emit("close")
  } finally {
    if (prev === undefined) delete process.env.THINCODER_HEAP_SNAPSHOT; else process.env.THINCODER_HEAP_SNAPSHOT = prev
  }
  child.emit("exit", 0, null); child.emit("close")
  clearSig() // 复原 no-op 监听（本用例起过包装——同 AC-4 纪律）
})

slow("AC-1/2/3/6 实跑：无 env 门 TUI 崩溃 → 包装 spawn（stderr 日志 + R25 crash 记录 + 同码 1）", () => {
  const root = tmpRoot()
  // THINCODER_TUI_WRAPPED 显式中和：宿主环境可能已带该门（TUI 会话内跑套件——env 全量透传）——
  // 不中和则该慢例假红（子直行不包装——无 tui-stderr 日志）
  const r = spawnSync(process.execPath, [BIN], { env: { ...process.env, USERPROFILE: root, HOME: root, THINCODER_TEST_CRASH: "1", THINCODER_TUI_WRAPPED: "" }, encoding: "utf8", timeout: 60_000 })
  const crashDir = join(root, ".thincoder", "crash-reports")
  assert.equal(r.status, 1, "AC-3：子崩溃码 1 → 父 1")
  assert.ok(r.stderr.includes("[error] R25 test crash"), "tee 实时转发终端（stderr 可见）")
  const files = readdirSync(crashDir)
  const log = files.find((f) => f.startsWith("tui-stderr-"))
  assert.ok(log, "AC-1/2：包装发生 + tui-stderr 日志落盘")
  assert.ok(files.some((f) => f.startsWith("crash-")), "AC-6：子内 R25 crash-*.json 照常")
  assert.ok(readFileSync(join(crashDir, log), "utf8").includes("R25 test crash"), "AC-2：日志含崩溃诊断")
})
slow("红线：env 门直接路径零包装 + 非 TUI（chat）零包装——均无 tui-stderr 日志", () => {
  for (const [args, gate] of [[[], { THINCODER_TUI_WRAPPED: "1" }], [["chat"], {}]]) {
    const root = tmpRoot()
    const r = spawnSync(process.execPath, [BIN, ...args], { env: { ...process.env, USERPROFILE: root, HOME: root, THINCODER_TEST_CRASH: "1", ...gate }, encoding: "utf8", timeout: 60_000 })
    assert.equal(r.status, 1, `${args[0] ?? "tui"} 崩溃仍 1`)
    const files = readdirSync(join(root, ".thincoder", "crash-reports"))
    assert.ok(!files.some((f) => f.startsWith("tui-stderr-")), `${args[0] ?? "tui-gate"}：零包装（无 tui-stderr 日志）`)
    assert.ok(files.some((f) => f.startsWith("crash-")), "进程内崩溃记录照常（R25 面未动）")
  }
})

// ── T-RT1–T-RT4（TUI-OOM-ROOTCAUSE 组 4——CRASH-REPORTS.md §9.6）：异常退出补发恢复序列 ──
const MOUSE_OFF = "\x1b[?1000l\x1b[?1006l"
const MAIN_BUFFER = "\x1b[?1049l"

test("T-RT1 异常退出补发：child exit(1) → writeImpl 收到含 mouseOff + mainBuffer 的序列；且先于 exitImpl", () => {
  const s = runMock(tmpRoot())
  s.child.emit("exit", 1, null)
  assert.equal(s.writes.length, 1, "恰一次序列写")
  assert.ok(s.writes[0].includes(MOUSE_OFF), "含鼠标关闭（DECRST 1000/1006）")
  assert.ok(s.writes[0].includes(MAIN_BUFFER), "含主屏恢复（1049l）")
  assert.ok(s.writes[0].startsWith("\x1b[2J"), "清屏起始（与 writeCleanupSequence 同序）")
  assert.deepEqual(s.exits, [], "exit 事件本身不退出（30s 兜底/close 才退）——序列先于同码退")
  s.child.emit("close")
  assert.deepEqual(s.exits, [1], "同码退（既有语义保持）")
})

test("T-RT2 正常退出零干预：child exit(0) → writeImpl 零调用", () => {
  const s = runMock(tmpRoot())
  s.child.emit("exit", 0, null)
  s.child.emit("close")
  assert.deepEqual(s.exits, [0])
  assert.equal(s.writes.length, 0, "正常退出零序列动作")
})

test("T-RT3 恰一次：exit 与 30s 兜底双路触发 → 序列仍恰一次", () => {
  const s = runMock(tmpRoot())
  s.child.emit("exit", null, "SIGKILL")
  s.child.emit("close")
  assert.equal(s.writes.length, 1, "双路（exit/close）不重复写")
  assert.deepEqual(s.exits, [1])
})

test("T-RT4 spawn error 零动作：mock spawnImpl 触发 error（不发 exit/close）→ writeImpl 零调用；exitImpl(1) 照常", () => {
  const s = runMock(tmpRoot())
  s.child.emit("error", { message: "ENOENT recovery-test" })
  assert.equal(s.writes.length, 0, "负断言：spawn error 零序列（子未启动——F5③）")
  assert.deepEqual(s.exits, [1], "exitImpl(1) 照常（不挂死——既有语义）")
})

test("T-RT4b 零回归：writeCleanupSequence 字节锁（RECOVERY_SEQUENCE 提取零语义）", async () => {
  const { RECOVERY_SEQUENCE, writeCleanupSequence } = await import("../src/tui/tui-lifecycle.mjs")
  const seen = []
  writeCleanupSequence((s) => seen.push(s))
  assert.equal(seen.length, 1)
  assert.equal(seen[0], RECOVERY_SEQUENCE, "writeCleanupSequence 引用同常量（字节不变）")
  assert.ok(seen[0].includes(MOUSE_OFF) && seen[0].includes(MAIN_BUFFER))
  assert.ok(seen[0].endsWith("\x1b[?7h"), "wrapOn 收尾（既有序列序）")
})
