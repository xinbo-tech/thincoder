/**
 * ssh-file-transfer.test.mjs — 集成用例档：RTM 第 22 节行 22-4 ∥ 22-5（`test/RTM.md`）。
 * 机制权威 = `docs/core/design/TOOLS.md` §6.22 ⑬（D-TO24–D-TO27）；需求 = 需求档 §4.8 S10 ∥ S11 ∥ NS8。
 *
 * **业务可观察结果**（用户看到的那一格工具结果回执 + 盘上的字节）：
 * - 22-4：助手把固件推到只实现经典 SCP 协议的交换机上 —— 回执只有一行状态句（含 `bytes` 与
 *   `exit 0`），对话里不出现文件内容；远端副本与本地逐字节一致。
 * - 22-5：助手把 running-config 备份回仓 —— 工程模式无在途号 ⇒ 写门拒、本地档不存在；
 *   带在途号 ⇒ 落盘且与远端一致；目标已存在而不给 `overwrite` ⇒ 拒、原档字节零改。
 *
 * **交互三件** = `ssh` 工具面（`thincoder-core/tools/ssh.mjs`）⟷ 传输件
 * （`agent-tools/ssh-transfer.mjs`）⟷ 写门（`agent/write-gate.mjs` 的 `LEDGER_ENTRY_TOOLS` ＋
 * `ledgerGateApplies`）；**驱动 = `executeToolCalls` 的 Phase 1 真门**（不直调门函数——22-5 要的是
 * 「写这件事」的业务可观察结果：拒 ∥ 落盘）；**设备 = 本机脚本替身**（`fixtures/fake-ssh-device.mjs`
 * ＋ `fixtures/fake-scp.mjs`，经 `_setSshBinaryForTest` ∥ `_setScpBinaryForTest` 替掉两个二进制）
 * ⇒ 零外网、零真机、零付费端点。
 *
 * **本层不做的事**：`~` 展开、父目录策略、四类失败面逐形、候选凭据来源顺序 —— 归本批单测档；
 * 本层只问「用户在回执与盘上看到什么」。真机腿（真交换机 / SFTP-only 主机各一台）不在自动化集内，单列。
 * 复跑（cwd = 仓根）：`node --test test/integration/ssh-file-transfer.test.mjs`
 */
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { createAgent } from "../../thincoder-core/agent.mjs"
import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { sshTool } from "../../thincoder-core/tools/ssh.mjs"
import { _setSshBinaryForTest, _setSshConfigDirForTest } from "../../thincoder-core/agent-tools/ssh-transport.mjs"
import { _setScpBinaryForTest } from "../../thincoder-core/agent-tools/ssh-transfer.mjs"
import { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerAdd, ledgerUpdate } from "../../thincoder-core/ledger.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const SSH_FIXTURE = join(HERE, "fixtures", "fake-ssh-device.mjs")
const SCP_FIXTURE = join(HERE, "fixtures", "fake-scp.mjs")

let project = ""     // 工程模式会话的项目根（22-5 的落点在里面）
let cfgDir = ""      // sshConfigDir 测试缝
let remoteRoot = ""  // 假设备的 flash 树
let agent = null
let sessionId = ""

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex")
const receipt = (text) => String(text ?? "")
/** 工程模式 depth-0 父侧 agent（22-5 的写门判据就挂在这个形态上）。 */
const engAgent = () => agent

before(async () => {
  const scratch = mkdtempSync(join(tmpdir(), "ssh-xfer-int-"))
  project = join(scratch, "project")
  cfgDir = join(scratch, "cfg")
  remoteRoot = join(scratch, "remote")
  for (const d of [project, cfgDir, remoteRoot, join(project, "docs/batches"), join(project, "backup"), join(remoteRoot, "flash")]) {
    mkdirSync(d, { recursive: true })
  }
  writeFileSync(join(project, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  _setSshConfigDirForTest(cfgDir)
  _setSshBinaryForTest(process.execPath, [SSH_FIXTURE])
  _setScpBinaryForTest(process.execPath, [SCP_FIXTURE])
  _setLedgerDirForTest(join(scratch, "ledger"))
  process.env.FAKE_SCP_REMOTE = remoteRoot
  process.env.FAKE_SCP_MODE = "classic-only" // 只实现经典 SCP 协议的网络设备（22-4 的对象）
  agent = createAgent({
    provider: null, tools: [], autoApprove: true,
    config: { agent: { maxTurns: 2, engineering: true }, traces: { enabled: false } },
    cwd: project, history: [],
  })
  const connected = receipt(await sshTool.execute({ action: "connect", host: "fake-device", user: "admin" }, { agent, cwd: project }))
  assert.match(connected, /connected/i, `夹具会话必须建立，实读：${connected}`)
  sessionId = `ssh#${(connected.match(/ssh#(\d+)/) ?? [])[1]}`
})

after(async () => {
  try { await sshTool.execute({ action: "close", id: sessionId }, { agent, cwd: project }) } catch { /* 收尾尽力面 */ }
  _setSshBinaryForTest(null)
  _setScpBinaryForTest(null)
  _setSshConfigDirForTest(null)
  _resetLedgerDirForTest()
  delete process.env.FAKE_SCP_MODE
  delete process.env.FAKE_SCP_REMOTE
  try { rmSync(join(project, ".."), { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }) } catch { /* 尽力面 */ }
})

/** 挂一条在途台账行（写门拒文点名的两步路线：先挂行、再在行上开批档 = 已由夹具备好指针档）。 */
function inFlightRow() {
  const task_book = "docs/batches/gate-closed.md"
  writeFileSync(join(project, task_book), [
    "# gate-closed", "", "## §1 讨论（主 agent）", "**状态行**：已收口 2026-11-04", "",
    "## §3 设计评审（评审子代理）", "**状态行**：评审通过", "",
  ].join("\n"))
  const id = ledgerAdd({ cwd: project, row: { kind: "tech_todo", title: "22-5 夹具行", task_book }, boundary: project })
  ledgerUpdate({ cwd: project, id, patch: { status: "在途" }, boundary: project })
  return id
}

// ---------- 行 22-4 ----------

test("22-4 正常：经典 SCP 替身上 `put` 1 MiB 二进制 ⇒ 远端 sha256 相等、回执 = 冠行 + 一行状态句、对话零文件内容", { timeout: 180_000 }, async () => {
  const local = join(project, "firmware.img")
  const bytes = Buffer.alloc(1024 * 1024)
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31 + 7) % 256
  writeFileSync(local, bytes)

  const out = receipt(await sshTool.execute({ action: "put", id: sessionId, localPath: local, remotePath: "/flash/firmware.img" }, { agent, cwd: project }))

  assert.equal(out.startsWith("Error:"), false, `put 必须成功，实读：${out}`)
  const [head, line, ...rest] = out.split("\n")
  assert.match(head, /^\[ssh \(ssh#\d+\) fake-device — \w+ · idle \d+s\]$/u, `首行 = 会话冠行（多设备下要能看出推到了哪台主机），实读：${JSON.stringify(out)}`)
  assert.match(line, /bytes · exit 0$/u, `状态句在冠行之下、含 bytes 与 exit 0，实读：${out}`)
  assert.deepEqual(rest, [], `回执 = 冠行 + 一行状态句（不许旁挂内容），实读：${JSON.stringify(out)}`)
  assert.equal(sha(join(remoteRoot, "flash/firmware.img")), sha(local), "远端副本 sha256 = 本地（逐字节）")
  assert.equal(out.includes(bytes.subarray(0, 64).toString("latin1")), false, "对话里不出现文件内容（前 64 字节零命中）")
})

// ---------- 行 22-5 ----------

test("22-5 边界：`get` 回仓 —— 无在途号 ⇒ 写门拒且本地档不存在；带号落盘；目标已存在 ⇒ 拒、原档零改", { timeout: 180_000 }, async () => {
  const config = Buffer.from("hostname sw-core-1\ninterface Gi0/1\n ip address 10.0.0.1 255.255.255.0\n")
  writeFileSync(join(remoteRoot, "flash/running-config.txt"), config)
  const target = join(project, "backup/running-config.txt")
  const tools = new Map([["ssh", sshTool]])
  const call = async (args) => {
    const [res] = await executeToolCalls(engAgent(), tools, [{ name: "ssh", id: "1", arguments: JSON.stringify(args) }], {}, 0)
    return res
  }

  // ① 无在途号 ⇒ 门拒（拒文出自门本体）、本地档不存在
  const denied = await call({ action: "get", id: sessionId, remotePath: "/flash/running-config.txt", localPath: target })
  assert.equal(denied.ok, false, "无在途号 ⇒ 拒")
  assert.match(receipt(denied.result), /write refused — ledger row not bound: no ledger number on this call/u, "拒文 = 门本体原文")
  assert.equal(existsSync(target), false, "本地档不存在（`scp` 零执行）")

  // ② 带在途号 ⇒ 放行、落盘、sha256 与远端相等
  const live = inFlightRow()
  const landed = await call({ action: "get", id: sessionId, remotePath: "/flash/running-config.txt", localPath: target, ledger: `#${live}` })
  assert.equal(landed.ok, true, `带号同笔必须放行，实读：${landed.result}`)
  assert.equal(sha(target), createHash("sha256").update(config).digest("hex"), "本地档 sha256 = 远端")
  const landedLines = receipt(landed.result).split("\n")
  assert.match(landedLines[0], /^\[ssh \(ssh#\d+\) fake-device — \w+ · idle \d+s\]$/u, `首行 = 会话冠行（⑬ ③），实读：${landed.result}`)
  assert.equal(landedLines[1], `get /flash/running-config.txt → ${target} · ${config.length} bytes · exit 0`, "状态句 = 冠行之下那一行（字面单源 = ⑬ ③）")
  assert.equal(landedLines.length, 2, "回执 = 冠行 + 一行状态句，不多行")

  // ③ 目标已存在且不给 overwrite ⇒ 拒、原档字节零改（工具面「返回 Error 句」不 throw ⇒ 读回执文本，不读 ok 位）
  writeFileSync(join(remoteRoot, "flash/running-config.txt"), "hostname changed-on-device\n")
  const refused = await call({ action: "get", id: sessionId, remotePath: "/flash/running-config.txt", localPath: target, ledger: `#${live}` })
  assert.match(receipt(refused.result), /^Error: ssh transfer: target exists/u, "可读句点名落点")
  assert.equal(sha(target), createHash("sha256").update(config).digest("hex"), "原档字节零改（还是上一次的配置）")
})