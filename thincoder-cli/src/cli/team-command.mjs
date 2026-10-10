/**
 * team-command.mjs — `thincoder team` 命令族（login ∥ logout ∥ status；CLI-ENTRY.md §2 `team` 行 ·
 * 2026-10-10 B1 批 · 台账 #1212）。
 *
 * 机制单源 = 核 `@thincoder/core/team.mjs`（登录 ∥ 退出 ∥ 状态 ∥ 地址归一 ∥ 端标签 ∥ 派生条目写面）——
 * 本档 = 命令面壳（旗标解析 ∥ 问句收集 ∥ 出词）；**端侧零自写盘**（一切写经核单源）。
 * 输入形（D-TM6）：地址/用户名可旗标注入（`--server <url>` ∥ `--user <name>`——空格形，缺 ⇒ 问句）；
 * 密码恒问句（零旗标——零命令历史）——TTY = 隐藏回显（原始模式逐键，零回显）∥ 非 TTY = stdin 行读。
 * 文案（TEAM.md §2.5——三端逐字同句）：未登录「未登录——登录后可用」；失败四句（理由域四值单源 =
 * 核 `reason` 闭集）；两条一次性提示（同名冲突（登录当刻）∥ 吊销未达（退出当刻））——读面零提示字段。
 * 输出流：结果行 = stdout；问句 ∥ 失败句 ∥ 一次性提示 = stderr（问句先例 = setup-wizard.mjs `ask`）。
 * 返回 = 退出码（0 成 ∥ 1 败）；未知参 ∥ 缺子命令 ⇒ usage + 1（fail-closed，先例 ledger-read.mjs）。
 */
import { createInterface } from "node:readline"

import { teamLogin, teamLogout, teamStatus, NOTICE_MANUAL_NAME_CONFLICT } from "@thincoder/core/team.mjs"

/** 命令面 usage（未知参 / 缺子命令 ⇒ stderr + 退出 1）。 */
const TEAM_USAGE = "Usage: thincoder team login [--server <url>] [--user <name>] | thincoder team logout | thincoder team status"

/** 失败出词四句（TEAM.md §2.5 失败理由域；核 `reason` 四值闭集 ⇔ 四句——三端逐字同句）。 */
const FAILURE_TEXT = {
  network: "网络不可达",
  credentials: "用户名或密码错误",
  rate_limited: "登录尝试过于频繁",
  write_failed: "本机配置写入失败",
}

/** 未登录提示（§2.5 未登录行——三端逐字同句）+ 指引进登录。 */
const NOT_LOGGED_IN = "未登录——登录后可用"
const LOGIN_GUIDE = 'Run "thincoder team login" to log in.'

/** 一次性提示两句（登录/退出当刻就地显示——读面不复显）：同名手工 provider ⇒ 派生条目未写（D-TM4）∥ 服务端吊销未达（§2.3）。 */
const TEXT_MANUAL_CONFLICT = "已存在同名 provider「team」——未自动添加；请改名或删除后重登"
const TEXT_REVOKE_UNDELIVERED = "服务端吊销未达"

/** 命令入口（`bin/thincoder.mjs` → command-table 分发）：返回退出码（0 成 ∥ 1 败）。 */
export async function teamCommand(args) {
  const argv = Array.isArray(args) ? args : []
  const sub = argv[0]
  if (sub === "login") return runLogin(argv.slice(1))
  if (sub === "logout") return runLogout(argv.slice(1))
  if (sub === "status") return runStatus(argv.slice(1))
  console.error(TEAM_USAGE)
  return 1
}

/** `team login`：收集（旗标 ∥ 问句）⇒ 核 `teamLogin`（写盘单源）⇒ 出词。 */
async function runLogin(rest) {
  const flags = parseLoginArgs(rest)
  if (flags === null) {
    console.error(TEAM_USAGE)
    return 1
  }
  const input = createInput()
  try {
    const server = flags.server ?? (await input.ask("Team server URL: ")).trim()
    const username = flags.user ?? (await input.ask("Username: ")).trim()
    const password = await input.askHidden("Password (hidden): ")
    const result = await teamLogin({ server, username, password })
    if (result.ok !== true) {
      console.error(FAILURE_TEXT[result.reason] ?? FAILURE_TEXT.network)
      return 1
    }
    console.log("Logged in.")
    for (const line of renderState(teamStatus())) console.log(line)
    if (result.notice === NOTICE_MANUAL_NAME_CONFLICT) console.error(TEXT_MANUAL_CONFLICT) // 登录当刻一次性提示（码 ⇒ 文）
    return 0
  } finally {
    input.close()
  }
}

/** `team logout`：未登录 ⇒ 未登录提示（幂等——退出码 0）；已登录 ⇒ 核 `teamLogout`（吊销 best-effort + 本地清）。 */
async function runLogout(rest) {
  if (rest.length > 0) {
    console.error(TEAM_USAGE)
    return 1
  }
  if (teamStatus().loggedIn !== true) {
    printNotLoggedIn()
    return 0
  }
  const result = await teamLogout()
  if (result.ok !== true) {
    console.error(FAILURE_TEXT[result.reason] ?? FAILURE_TEXT.network)
    return 1
  }
  console.log("Logged out.")
  if (result.revokeDelivered === false) console.error(TEXT_REVOKE_UNDELIVERED) // 退出当刻一次性提示
  return 0
}

/** `team status`：未登录 ⇒ 未登录提示；已登录 ⇒ server + member + label（§2.5 当前态行）。 */
async function runStatus(rest) {
  if (rest.length > 0) {
    console.error(TEAM_USAGE)
    return 1
  }
  const st = teamStatus()
  if (st.loggedIn !== true) {
    printNotLoggedIn()
    return 0
  }
  for (const line of renderState(st)) console.log(line)
  return 0
}

/** 未登录提示块（§2.5 未登录行 = 逐字句 + 指引进登录）。 */
function printNotLoggedIn() {
  console.log(NOT_LOGGED_IN)
  console.log(LOGIN_GUIDE)
}

/** 当前态三行（server ∥ member ∥ label——§2.5 当前态行；值 = 核 `teamStatus()` 投影）。 */
function renderState(st) {
  const member = st.member !== null && st.member !== undefined && typeof st.member === "object"
    ? `${st.member.name ?? st.member.username ?? "(unknown)"} (${st.member.username ?? "?"})`
    : "(unknown)"
  return [
    `Server: ${st.server ?? "(unknown)"}`,
    `Member: ${member}`,
    `Label:  ${st.label ?? "(unknown)"}`,
  ]
}

/** 登录旗标解析（§2 行：`--server <url>` ∥ `--user <name>`——空格形；值缺 ∥ 未知参 ⇒ null（usage））。
 *  密码零旗标（D-TM6——shell 历史泄漏面关闭）。 */
function parseLoginArgs(rest) {
  const flags = { server: null, user: null }
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (arg === "--server" || arg === "--user") {
      const value = rest[i + 1]
      if (value === undefined || value.startsWith("--")) return null
      const trimmed = value.trim()
      if (arg === "--server") flags.server = trimmed === "" ? null : trimmed // 空值视同缺省（回落问句——失败理由与实际对位）
      else flags.user = trimmed === "" ? null : trimmed
      i++
    } else {
      return null
    }
  }
  return flags
}

/** 输入面（D-TM6）：TTY = 交互问句（可见 ∥ 隐藏回显）；非 TTY = stdin 行读（单接口 + 行缓冲——
 *  防丢行，先例 setup-wizard.mjs）；EOF 无行 ⇒ 空串（上层分类兜底）。`close()` 释放 stdin。 */
function createInput() {
  if (process.stdin.isTTY) {
    return {
      ask: (question) => askVisible(question),
      askHidden: (question) => askHidden(question),
      close: () => {},
    }
  }
  const rl = createInterface({ input: process.stdin, terminal: false })
  const buffered = []
  let waiter = null
  let ended = false // EOF 粘性标志：流结束后**所有**后续读取立即取空串（防悬挂——上层凭据门兜底）
  rl.on("line", (line) => {
    if (waiter !== null) {
      const resolve = waiter
      waiter = null
      resolve(line)
    } else {
      buffered.push(line)
    }
  })
  rl.on("close", () => {
    ended = true
    if (waiter !== null) {
      const resolve = waiter
      waiter = null
      resolve(null)
    }
  })
  const nextLine = () => {
    if (buffered.length > 0) return Promise.resolve(buffered.shift())
    if (ended) return Promise.resolve(null)
    return new Promise((resolve) => { waiter = resolve })
  }
  const askLine = async (question) => {
    process.stderr.write(question)
    const value = await nextLine()
    process.stderr.write("\n") // 管道无回显 ⇒ 补行尾（与 TTY 面同形——后续提示/出词不占问句行）
    return value ?? ""
  }
  return {
    ask: (question) => askLine(question),
    askHidden: (question) => askLine(question),
    close: () => rl.close(),
  }
}

/** TTY 可见问句（readline——行编辑 ∥ 回显；输出流 = stderr，沿 setup-wizard.mjs 问句先例）。 */
function askVisible(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true })
    let answered = false
    rl.question(question, (answer) => {
      answered = true
      rl.close()
      resolve(answer)
    })
    rl.on("close", () => { if (!answered) resolve("") }) // EOF（Ctrl-D）⇒ 空串兜底（防悬挂——与非 TTY 路同判）
  })
}

/** TTY 隐藏回显问句（D-TM6）：原始模式逐键读——零回显（密码零落屏 ∥ 零命令历史）；
 *  Enter 提交 ∥ Ctrl-C 还原终端后退出 130 ∥ Ctrl-D 提交当前输入 ∥ Backspace 删字符。 */
function askHidden(question) {
  return new Promise((resolve) => {
    process.stderr.write(question)
    const stdin = process.stdin
    const wasRaw = stdin.isRaw === true
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    let buf = ""
    function finish() {
      stdin.removeListener("data", onData)
      if (!wasRaw) stdin.setRawMode(false)
      stdin.pause()
      process.stderr.write("\n")
      resolve(buf)
    }
    function onData(chunk) {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish()
        if (ch === "\u0003") { finish(); process.exit(130) } // Ctrl-C（raw 模式不自动发 SIGINT）
        if (ch === "\u0004") return finish() // Ctrl-D = 提交
        if (ch === "\u007f" || ch === "\b") { buf = buf.slice(0, -1); continue }
        buf += ch
      }
    }
    stdin.on("data", onData)
  })
}
