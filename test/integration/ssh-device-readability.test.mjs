/**
 * ssh-device-readability.test.mjs — 集成用例档：RTM 故事 22「把一台设备变好看」
 * （`test/RTM.md:259`–`:265` 行 22-1 ∥ 22-2 ∥ 22-3；机制权威 = `docs/core/design/TOOLS.md` §6.22）。
 *
 * **业务可观察结果**（用户看到的那一格工具结果回执）：
 * - 22-1：长配置读得完 —— 回执上零转义残留、首行与末行俱在、注记点名「中段可取回」，再 `read`
 *   一次就把中段补齐，三段拼合与设备原文逐字一致；`--More--` 不被洗掉（用户知道设备在等输入）。
 * - 22-2：设备回显后静默 3 s 再出 `[OK]` —— 工具的结论是「提示符命中」，而不是在静默窗里提前
 *   交出半截（用户不会看到一条没有 `[OK]` 的成功回执）。
 * - 22-3：设备半路不再吐字 —— 硬超时内返回可读句并**点名是哪道门没过**，会话仍在 `list` 里
 *   （不静默挂起、不崩）。
 *
 * **交互三件** = `ssh` 工具面（`thincoder-core/tools/ssh.mjs`）⟷ 会话池（`agent-tools/ssh-session.mjs`）
 * ⟷ 传输面（`agent-tools/ssh-transport.mjs` 的剥离 ∥ 帽窗 ∥ 四门）；**驱动 = 工具面本身**
 * （`sshTool.execute` + 真 `createAgent` 上下文，池与取号走生产同一路径），**设备 = 本机脚本替身**
 * （`fixtures/fake-ssh-device.mjs`，经 `_setSshBinaryForTest` 替掉 `ssh`）⇒ 零外网、零真机、零付费端点。
 *
 * **本层不做的事**：剥离/遮蔽的逐序列断言、帽窗口径的边界取值 —— 归批内单测；本层只问「用户在回执
 * 上看到什么」。**RTM 的「怎么做」写的是「CLI 会话里让助手 `ssh connect`」（`test/RTM.md:263`），
 * 本层直驱工具面**（`sshTool.execute` + `createAgent`，无 provider ⟹ 模型→工具派发未被走过）；
 * 回执内容不受影响（用户看到的就是工具返回值），派发面归故事 1-1 ∥ 1-2。真机腿（真交换机
 * `--More--` / `write memory`）不在自动化集内，单列。
 */
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { createAgent } from "../../thincoder-core/agent.mjs"
import { sshTool } from "../../thincoder-core/tools/ssh.mjs"
import { _setSshBinaryForTest, _setSshConfigDirForTest } from "../../thincoder-core/agent-tools/ssh-transport.mjs"
import { buildShowRun } from "./fixtures/fake-ssh-device.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, "fixtures", "fake-ssh-device.mjs")

/** 帽窗注记形（`agent-tools/ssh-transport.mjs` `WINDOW_MARKER` 的填充后形态）。 */
/** 注记行自带行尾换行（`WINDOW_MARKER` 以 `\n` 收）——正则必须一并吃掉，否则尾段会多一个前导换行。
 *  换行**必选**（不是 `\n?`）：那个 `\n` 正是首跑差 1 字节的根因，写成可选会让同一形态回退后仍然绿。 */
const MARKER_RE = /\[… ([\d,]+) chars omitted \(head (\d+) \/ tail (\d+)\) — the omitted middle is kept; call read again to collect it …\]\n/

let cfgDir = ""
let cwd = ""
let agent = null

const ssh = (args) => sshTool.execute(args, { agent })

/** 每条用例**自建会话、自己收尾** —— 共用一个模块级会话会让「单条跑 / 乱序跑」不可复现：
 *  22-1 把设备留在 `--More--`，22-2 再往同一个 pty 里写，命令会先落进翻页器。那是用例间的隐性耦合，
 *  不是被验的行为。RTM 的「同一会话」指**本行里不重连**，不是跳行共用。 */
const withSession = async (fn) => {
  const connected = await ssh({ action: "connect", host: "fake-device", label: "rtm-22" })
  assert.match(connected, /connected/i, `connect 必须成功（设备替身已出提示符），实读：${connected}`)
  const sessionId = (connected.match(/ssh#(\d+)/) ?? [])[1] ?? ""
  assert.ok(sessionId, `回执首行应带 ssh#N，实读：${connected}`)
  try {
    return await fn(sessionId)
  } finally {
    try { await ssh({ action: "close", id: `ssh#${sessionId}` }) } catch { /* 收尾尽力面 */ }
  }
}

/** 回执拆三段：首行状态行 ∥ 体 ∥ 末行结论注记（`… \n— <settleNote>`）。 */
const splitReceipt = (text) => {
  const lines = String(text ?? "").split("\n")
  const status = lines.shift() ?? ""
  let settleIdx = -1
  lines.forEach((line, i) => { if (line.startsWith("— ")) settleIdx = i })
  return {
    status,
    body: settleIdx >= 0 ? lines.slice(0, settleIdx).join("\n") : lines.join("\n"),
    settle: settleIdx >= 0 ? lines[settleIdx] : "",
  }
}

/** 行尾空白归一：`bodyText` 按设计裁掉整段尾部空白，比对时两侧同归一。 */
const trimEnd = (s) => String(s ?? "").replace(/\s+$/u, "")

before(async () => {
  cfgDir = mkdtempSync(join(tmpdir(), "ssh-dev-readability-cfg-"))
  cwd = mkdtempSync(join(tmpdir(), "ssh-dev-readability-"))
  // 配置目录改到临时区：替身会话的 `ssh-hosts.json` 记录不得落进用户配置
  _setSshConfigDirForTest(cfgDir)
  _setSshBinaryForTest(process.execPath, [FIXTURE])
  agent = createAgent({
    provider: null,
    tools: [],
    config: { agent: { maxTurns: 2 }, traces: { enabled: false } },
    cwd,
    history: [],
  })
})

after(async () => {
  _setSshBinaryForTest(null)
  _setSshConfigDirForTest(null)
  for (const dir of [cwd, cfgDir]) {
    if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  }
})

// ---------- 行 22-1 ----------

test("22-1 正常：20 000 字符长配置夹不可见序列 ⇒ 零残留 ∥ 头尾俱在 ∥ 中段可取回", { timeout: 120_000 }, async () => withSession(async (id) => {
  const { plain } = buildShowRun()

  const receipt = await ssh({ action: "send", id: `ssh#${id}`, data: "show run", timeoutMs: 30_000 })
  assert.equal(receipt.startsWith("Error:"), false, `send 必须成功，实读：${receipt}`)
  const { body, settle } = splitReceipt(receipt)

  // ① 不可见序列零残留（CSI ∥ OSC ∥ 退格 —— 用户不该在回执上看到转义字节）
  assert.equal(body.includes("\x1b"), false, "回执体零 ESC 残留")
  assert.equal(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body), false, "回执体零控制字节残留")

  // ② 结论 = 门①（待答标记）命中：设备在等输入
  assert.match(settle, /settled \(the device is waiting for input/, `22-1 结论应为待答标记命中，实读：${settle}`)

  // ③ `--More--` 不被洗掉，且只出现一次（用户知道设备在等输入）
  assert.equal((body.match(/--More--/g) ?? []).length, 1, "`--More--` 字面出现 1 次")

  // ④ 注记点名「中段可取回」，且 H ∥ T 与实保头尾等长
  const m = body.match(MARKER_RE)
  assert.ok(m, `帽窗注记必须在场，实读体首 200 字符：${body.slice(0, 200)}`)
  const omitted = Number(String(m[1]).replaceAll(",", ""))
  const head = body.slice(0, m.index)
  const tail = body.slice(m.index + m[0].length)
  assert.equal(Number(m[2]), head.length, "注记的 head 值 = 实保头长")
  assert.equal(Number(m[3]), tail.length, "注记的 tail 值 = 实保尾长")
  // 省略数必须与实文对账：只对形的话，「窗口整体平移一格且自报同值」这种偏差三处断言都放过（窗口自证）
  assert.equal(head.length + tail.length + omitted, plain.length, "三段 + 省略数 = 设备原文全量（窗口不再自证）")

  // ⑤ 首行与末行俱在（长配置读得完：头段装接口、尾段装结束证据）
  assert.ok(plain.startsWith(head), "头段是设备原文的前缀（首行在）")
  assert.ok(plain.endsWith(trimEnd(tail)), "尾段是设备原文的后缀（`--More--` 在）")

  // ⑥ 再 read 一次把中段补齐，三段拼合与设备原文逐字一致
  const back = await ssh({ action: "read", id: `ssh#${id}`, maxChars: 40_000, timeoutMs: 10_000 })
  assert.equal(back.startsWith("Error:"), false, `read 必须成功，实读：${back}`)
  const middle = splitReceipt(back).body
  const expectedMiddle = plain.slice(head.length, plain.length - tail.length)
  assert.equal(trimEnd(middle), trimEnd(expectedMiddle), "中段与被省略的那一段逐字一致")
  assert.equal(trimEnd(head + middle + tail), trimEnd(plain), "三段拼合与设备原文一致（仅行尾空白归一）")
}))

// ---------- 行 22-2 ----------

test("22-2 正常：回显后静默 3 s 再出 [OK] ⇒ 结论 = 提示符命中，未在静默窗交出", { timeout: 120_000 }, async () => withSession(async (id) => {
  const receipt = await ssh({ action: "send", id: `ssh#${id}`, data: "write memory", timeoutMs: 30_000 })
  assert.equal(receipt.startsWith("Error:"), false, `send 必须成功，实读：${receipt}`)
  const { body, settle } = splitReceipt(receipt)

  assert.match(settle, /settled \(prompt matched\)/, `结论必须是提示符命中，实读：${settle}`)
  // 若在 800 ms 静默处就交出，`[OK]` 尚不存在 —— 它出现在回执里即为「等过了静默窗」的证据。
  // 用时只作旁证，不作断言（RTM 22-2 的判据形）。
  assert.ok(body.includes("[OK]"), `必须等到 [OK]，实读回执体尾部：${body.slice(-160)}`)
  assert.ok(body.includes("device#"), "提示符在返回文本里")
}))

// ---------- 行 22-3 ----------

test("22-3 边界：设备半路停吐 ⇒ 硬超时内返回可读句并点名未过的门，会话仍存活", { timeout: 120_000 }, async () => withSession(async (id) => {
  const receipt = await ssh({ action: "send", id: `ssh#${id}`, data: "stall", timeoutMs: 1_500 })
  assert.equal(receipt.startsWith("Error:"), false, `硬超时是正常返回（不是错误），实读：${receipt}`)
  const { body, settle } = splitReceipt(receipt)

  assert.match(settle, /not settled after [\d.]+s/, `硬超时结论形，实读：${settle}`)
  // 「硬超时**内**」必须被钉住：只看结论形的话，把 `timeoutMs: 1_500` 丢成缺省仍然绿
  //（传输面缺省 = `SSH_TIMEOUT_MS` = 60_000），而这条故事要防的正是「慢操作把用户挂住」。
  const waited = Number((settle.match(/not settled after ([\d.]+)s/u) ?? [])[1])
  assert.ok(Number.isFinite(waited) && waited <= 4, `必须在调用方给的 1.5 s 预算附近收场，实读：${settle}`)
  // 替身只吐一行后彻底静默 ⇒ 门④ 稳定落在「没有提示符」这一支（另两枚标签在此形态下不会被产生）
  assert.match(settle, /no prompt detected/, `必须点名未过的门 = 无提示符，实读：${settle}`)
  assert.ok(body.length > 0, "已到的部分输出照常交出（不吞半截）")

  const listed = await ssh({ action: "list" })
  assert.ok(String(listed).includes(`ssh#${id}`), `会话仍在 list 里（不静默挂起、不崩），实读：${listed}`)
}))
