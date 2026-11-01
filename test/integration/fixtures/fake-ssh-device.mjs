/**
 * fake-ssh-device.mjs — 脚本化假设备（集成夹具 · ssh 面）。
 *
 * 由 `test/integration/ssh-device-readability.test.mjs` 经 `_setSshBinaryForTest` 替掉真 `ssh`
 * 拉起（`<node> <本档> <ssh 参数…>`），用 stdin/stdout 扮演一台交换机 ⇒ 零外网、零真机、
 * 零付费端点。**不解析 ssh 参数**（替身只认 stdin 上的命令字）。
 *
 * 三条脚本（一一对应 `test/RTM.md` 故事 22 的三行）：
 *
 * | 命令 | 设备行为 |
 * |---|---|
 * | `show run` | 吐 20 000+ 可见字符的长配置，夹 CSI ∥ OSC ∥ 退格；**末行 `--More--`**（不再出提示符） |
 * | `write memory` | 回显命令 → **静默 3 s** → 吐 `[OK]` 与提示符 |
 * | `stall` | 吐一小段后**彻底静默**（无提示符，供硬超时面用） |
 *
 * 可见面与线上字节**同源构造**：`buildShowRun()` 同时产出 `wire`（带不可见序列）与 `plain`
 * （剥离后应得的可见文本）。用例直接 import 它取 `plain` 作期望值 —— 期望值不靠用例侧另算
 * 一份，两侧同一份构造。
 *
 * 副作用只在「被 `node` 直接执行」时发生（`process.argv[1]` 判）；被用例 import 时只拿到纯函数。
 *
 * **配置行不得含 XML 特字符（`&` `<` `>` `"` `'`）与行尾空白**：回执面会 `escapeXmlLite` 并裁掉整段尾
 * 空白（`bodyText`），而用例的期望值取的是**剥离前**构造的 `plain` —— 给配置行加一个 `>` 或一个尾空格，
 * 用例会因转义/裁尾而红，不是因行为而红。
 */

import { fileURLToPath } from "node:url"

const CRLF = "\r\n"
const PROMPT = "device# "
/** 22-2 的静默时长：必须 > `SSH_SETTLE_MS`（800 ms），否则用例证明不了「没在静默窗交出」。 */
export const SILENCE_MS = 3000
/** 22-1 的可见字符量：RTM 写「20 000 字符」——每行 99 字符 × 205 行 = 20 295。 */
const LINE_COUNT = 205
const LINE_WIDTH = 99

const visibleLine = (i) => {
  const head = `interface GigabitEthernet0/${String(i).padStart(3, "0")} `
  return (head + "x".repeat(Math.max(1, LINE_WIDTH - head.length))).slice(0, LINE_WIDTH)
}

/** 长配置：`wire`（线上，含不可见序列）与 `plain`（剥离后可见文本）成对产出。 */
export const buildShowRun = () => {
  const wire = []
  const plain = []
  for (let i = 0; i < LINE_COUNT; i++) {
    const line = visibleLine(i)
    // CSI（绿色）∥ 退格（C0，剥离即丢）∥ OSC 标题（BEL 收尾）——三类都必须在回执面上消失
    wire.push(`\x1b[32m${line.slice(0, 20)}\x1b[0m\x08${line.slice(20)}\x1b]0;fake-device\x07${CRLF}`)
    plain.push(`${line}\n`)
  }
  wire.push("--More--")
  plain.push("--More--")
  return { wire: wire.join(""), plain: plain.join("") }
}

// ---------- 以下只在被 node 直接执行时生效 ----------

const isEntry = () => {
  const self = fileURLToPath(import.meta.url)
  const arg = process.argv[1] ? fileURLToPath(`file://${process.argv[1].replace(/\\/g, "/")}`) : ""
  return self === arg || process.argv[1] === self
}

if (isEntry()) {
  const out = (s) => process.stdout.write(s)

  const run = (raw) => {
    const cmd = String(raw ?? "").trim()
    if (!cmd) return
    if (cmd === "show run") {
      out(buildShowRun().wire)
      return // `--More--` = 设备在等输入，不再出提示符（门① 命中）
    }
    if (cmd === "write memory") {
      out(`write memory${CRLF}`)
      setTimeout(() => out(`${CRLF}[OK]${CRLF}${PROMPT}`), SILENCE_MS)
      return
    }
    if (cmd === "stall") {
      out(`still working${CRLF}`)
      return // 之后一个字节都不吐（门④ 硬超时面）
    }
    out(`% Unknown command: ${cmd}${CRLF}${PROMPT}`)
  }

  let buf = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk) => {
    buf += chunk
    let nl
    while ((nl = buf.search(/[\r\n]/)) >= 0) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      run(line)
    }
  })

  // 首屏：banner + 提示符（`connect` 的首屏沉降靠它；不出提示符会被判 connect 超时）
  out(`FakeDevice 1.0 (integration fixture)${CRLF}${PROMPT}`)
}
