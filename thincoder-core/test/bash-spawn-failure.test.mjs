/**
 * bash-spawn-failure.test.mjs — 核 bash 产者 spawn 失败形态用例（C-1 / C-2）。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.3（状态位族三成员闭集 · 产者两处）· §6 D-W19；
 * 批次档 `docs/batches/2026-09-18-tool-failure-spawn-form.md` §2.4（C-1 / C-2）。
 *
 * C-1：spawn 失败（进程未启动 ⇒ 无退出码，不伪造）⇒ 首行诊断 `Command failed: …`（诊断面，不入判据）
 *   + 尾状态位 `(spawn failed)`（判据族第三成员——`thincoder-vscode/webview/lib.js toolFailureStatus`）；
 *   `!startsWith("Error:")` 锁定核侧控制信号面零触碰（`agent/dispatch.mjs` 的 `Error:` 前缀判读）。
 * C-2：既有产出面锚（退出 0 / 退出 3）零回归——两形均不含新状态位。
 *
 * 输入全部取自真产者直跑（真子进程）——禁夹具手写形态串。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { bashTool } from "../tools/bash.mjs"

/** 不存在的 cwd ⇒ spawn ENOENT。 */
const NO_SUCH_DIR = join(tmpdir(), "thincoder-core-bash-spawn-failure-no-such-dir")
/** 存在的 cwd（既有形态锚）。 */
const HERE = tmpdir()

/** 末条非空行。 */
const lastLine = (s) => s.split("\n").filter((l) => l.trim()).pop()

test("C-1 核 spawn 失败（先红）：首行 Command failed: + 尾状态位 (spawn failed) ∧ 非 Error: 前缀", async () => {
  const out = await bashTool.execute({ command: "echo hi" }, { cwd: NO_SUCH_DIR })
  assert.equal(lastLine(out), "(spawn failed)", `实: ${JSON.stringify(out)}`)
  assert.match(out.split("\n")[0], /^Command failed: /, `首行诊断（实: ${JSON.stringify(out)}）`)
  assert.ok(!out.startsWith("Error:"), "核侧控制信号面零触碰（Error: 前缀不新出）")
})

test("C-2 核既有退出面锚（恒绿）：退出 0 / 退出 3 零回归——两形均不含 (spawn failed)", async () => {
  const ok = await bashTool.execute({ command: "echo hi" }, { cwd: HERE })
  assert.ok(ok.includes("(exit code 0)"), `实: ${JSON.stringify(ok)}`)
  assert.ok(!ok.includes("(spawn failed)"), "成功面零新状态位")
  const bad = await bashTool.execute({ command: "exit 3" }, { cwd: HERE })
  assert.ok(bad.includes("(exit code 3)"), `实: ${JSON.stringify(bad)}`)
  assert.ok(!bad.includes("(spawn failed)"), "非零退出面形态不变")
})
