/** tui-stderr-capture.test.mjs — TUI-STDERR-CAPTURE（docs/design/TUI-STDERR-CAPTURE.md）F-1~F-3：
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
const runMock = (dir) => { const child = fakeChild(); const exits = []; const wrapped = spawnTuiWrapped({ dir, spawnImpl: () => child, exitImpl: (c) => exits.push(c) }); return { wrapped, exits, child } }
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
slow("AC-1/2/3/6 实跑：无 env 门 TUI 崩溃 → 包装 spawn（stderr 日志 + R25 crash 记录 + 同码 1）", () => {
  const root = tmpRoot()
  const r = spawnSync(process.execPath, [BIN], { env: { ...process.env, USERPROFILE: root, HOME: root, THINCODER_TEST_CRASH: "1" }, encoding: "utf8", timeout: 60_000 })
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
