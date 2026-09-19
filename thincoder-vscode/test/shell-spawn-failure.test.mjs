/**
 * shell-spawn-failure.test.mjs — 宿主 bash 产者形态用例（C-3…C-6）。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.3（状态位族三成员闭集 · **退出码槽只接受数字** ·
 * 产者两处）· §6 D-W19 · §8 U-W11；批次档
 * `docs/batches/2026-09-18-tool-failure-spawn-form.md` §2.4（C-3…C-6）。
 *
 * 断言面 = 宿主真产者（`src/tools/shell.mjs` `bashTool.execute` 真 exec 子进程）四态：
 * C-3 spawn 失败 ⇒ 诊断行 `Command failed: …`（含 errno）+ 尾状态位 `(spawn failed)`；
 * C-4 超时 ⇒ `(killed: timeout <N>ms)`（收正前破折号形 ⇒ 判据不认 ⇒ 卡读绿）；
 * C-6 输出超容 ⇒ `(killed: output limit exceeded)`（收正前 `(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)`）；
 * C-5 既有退出面锚（退出 0 / 退出 3）零回归——两形均不含新状态位。
 * 消费面（红 / 保持展开 / 摘要）= `webview-tool-failure-signal.test.mjs`（W16-7 / W16-8 / W16-11）。
 *
 * 输入全部取自真产者直跑（真 exec 子进程）——禁夹具手写形态串。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { bashTool } from "../src/tools/shell.mjs"

/** 不存在的 cwd ⇒ spawn ENOENT（真读数：`error.code = "ENOENT"` ∧ `child.pid = undefined`）。 */
const NO_SUCH_DIR = join(tmpdir(), "thincoder-shell-spawn-failure-no-such-dir")
/** 存在的 cwd（其余三态在真实目录下跑）。 */
const HERE = tmpdir()
/** 睡眠命令（超时态输入——真子进程尚未结束即被 timeout 杀）。 */
const SLEEP_5S = 'node -e "setTimeout(()=>{},5000)"'
/** 3MB stdout（> maxBuffer 2MB ⇒ 输出超容态）。 */
const BIG_OUT = "node -e \"console.log('x'.repeat(3*1024*1024))\""

/** 末条非空行（产者形态的判定行）。 */
const lastLine = (s) => s.split("\n").filter((l) => l.trim()).pop()

test("C-3 宿主 spawn 失败（真产者）：诊断行 Command failed: + errno ∧ 末条非空行 = (spawn failed)", async () => {
  const out = await bashTool.execute({ command: "echo hi" }, { cwd: NO_SUCH_DIR })
  assert.equal(lastLine(out), "(spawn failed)", `进程未启动 ⇒ 尾状态位（实: ${JSON.stringify(out)}）`)
  const diag = out.split("\n").find((l) => /^Command failed: /.test(l))
  assert.ok(diag != null, `诊断行 Command failed: 首现（实: ${JSON.stringify(out)}）`)
  assert.ok(diag.includes("ENOENT"), `诊断行携 errno（实: ${JSON.stringify(diag)}）`)
  assert.ok(!out.includes("(exit code"), "退出码槽只接受数字（errno 不得塞进退出码槽）")
})

test("C-4 宿主超时（真产者）：末条非空行 = (killed: timeout 400ms)（冒号形——判据既有成员）", async () => {
  const out = await bashTool.execute({ command: SLEEP_5S, timeout: 400 }, { cwd: HERE })
  assert.equal(lastLine(out), "(killed: timeout 400ms)", `实: ${JSON.stringify(out)}`)
})

test("C-6 宿主输出超容（边界·真产者）：末条非空行 = (killed: output limit exceeded)", async () => {
  const out = await bashTool.execute({ command: BIG_OUT }, { cwd: HERE })
  assert.equal(lastLine(out), "(killed: output limit exceeded)", `实尾: ${JSON.stringify(out.slice(-80))}`)
})

test("C-5 既有退出面锚（恒绿·真产者）：退出 0 / 退出 3 零回归——两形均不含 (spawn failed)", async () => {
  const ok = await bashTool.execute({ command: "echo hi" }, { cwd: HERE })
  assert.ok(ok.includes("(exit code 0)"), `实: ${JSON.stringify(ok)}`)
  assert.ok(!ok.includes("(spawn failed)"), "成功面零新状态位")
  const bad = await bashTool.execute({ command: "exit 3" }, { cwd: HERE })
  assert.ok(bad.includes("(exit code 3)"), `实: ${JSON.stringify(bad)}`)
  assert.ok(!bad.includes("(spawn failed)"), "非零退出面形态不变")
})
