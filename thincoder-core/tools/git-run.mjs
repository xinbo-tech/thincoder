/**
 * tools/git-run.mjs — git spawn 单点（TOOLS.md §6.14 · 批 GIT-NONINTERACTIVE · 台账 #207）。
 *
 * 为什么单点：git 的四交互族（编辑器 / 凭据 / GUI / pager）在**无 TTY** 下永久等待——
 * `rebase --continue` 起编辑器即冻死整个会话（已发布 `0.12.64` 实报）。加固只许一处
 * （逐调用点补 = 必漏）：三个形适配器（`shared.mjs` `runGit` · `git.mjs` `runGitRaw` ·
 * `git-ext.mjs` `runGitStrict`）体转**异步薄壳**委托本档，签名与返回形零变。
 *
 * 三件套：① `GIT_ENV` 加固集（**env 形**——实测 `GIT_EDITOR` env 优先于 `core.editor`，
 * `-c` 形单独不足）② 两档超时（本地 120s / 网络 300s · 全量适用）③ 超时动作序
 * （SIGTERM → 1.5s 树杀 → 1.5s kick——孙进程持管道时 `close` 永不触发）。
 */
import { spawn } from "node:child_process"
import { killProcessTree } from "./process-tree.mjs"

/** 加固集（逐字 = §6.14「加固集」）：继承面在前，加固键一律置后覆盖——继承面不得反超。
 *  编辑器族 4 键 · pager 族 2 键 · 凭据族 2 键（本批新增，bash 面亦无）· 终端族 1 键。 */
export const GIT_ENV = {
  ...process.env,               // 继承面（PATH / HOME / 用户 proxy 等）
  GIT_EDITOR: "true",           // 编辑器族：提交信息编辑器（解析链最高优先键）
  GIT_SEQUENCE_EDITOR: "true",  // 编辑器族：rebase todo 列表编辑器
  EDITOR: "true",               // 编辑器族：兜底链 VISUAL / EDITOR
  VISUAL: "true",
  GIT_PAGER: "cat",             // pager 族（bash 工具先例同值）
  PAGER: "cat",
  GIT_TERMINAL_PROMPT: "0",     // 凭据族：禁终端提示
  GIT_ASKPASS: "",              // 凭据族：空串 ⇒ 不调 askpass 程序（同时封 core.askpass 升级路）
  TERM: "dumb",                 // 终端族（bash 工具先例同值）
}

export const GIT_TIMEOUT_MS = 120_000
export const GIT_NET_TIMEOUT_MS = 300_000
/** 网路面五动作（300s 档——合法耗时可远超本地；依据 = 需求档 §4.7 TTY-DRIVE N3 候选参照值）。 */
const GIT_NET_ACTIONS = new Set(["push", "fetch", "pull", "clone", "ls-remote"])

/** 测试态缝（模块级 · 缺省 null = 生产零行为变——先例 `manifest.mjs:40-41` · `session-gc.mjs:136`）。
 *  用例 `finally` 复位；不经用户参数面（边界：不新增参数 / 用户选项）。 */
let gitTimeoutOverride = null
export function _setGitTimeoutForTest(ms) { gitTimeoutOverride = ms }
export function _resetGitTimeoutForTest() { gitTimeoutOverride = null }

/** 子命令取形：跳 `-c <k=v>` 对（适配器把 config 前置在 args 头）——首个其余 arg 即子命令。 */
function gitSubcommand(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-c") { i++; continue }
    return args[i]
  }
  return ""
}

/** 超时文案单源（逐字 = §6.14「超时错误文案」）：两帧嵌同一条——`runGit` / `runGitRaw` 抛错经
 *  `gitFailureMessage`；`runGitStrict` 的 `err` = 本条（调用方另加 `git <action> failed: ` 前缀）。 */
export function gitTimeoutNote(ms) {
  return `timed out after ${ms / 1000}s (killed) — no interactive input is possible here (editor / credential / network); `
    + "process killed, tree best-effort — retry or use the bash tool; an interrupted write keeps git state (`git status`) "
    + "— git abort / continue, or checkpoint action=checkpoint checkpointAction=list"
}

/** git spawn 单点。返回 Promise<string>（stdout 原文——trim / `\r` 归一 / 溢出分支等形由适配器保留）。
 *  失败 / 超时 / 溢出 ⇒ reject；错误形 = `execFileSync` 同构（`.stdout` / `.stderr` / `.status` / `.message` /
 *  `.code`），超时另带 `.timedOut = true` / `.timeoutMs`（可辨性不靠 stderr 文本猜）。
 *  缺省：timeout 按面取常量（网络五动作 300s / 其余 120s）· maxBuffer = Node `execFileSync` 缺省 1MB
 *  （`runGit` / `runGitRaw` 显式传 10MB——形保真清单 ②）。 */
export function spawnGit(cwd, args, { timeout, maxBuffer } = {}) {
  const timeoutMs = timeout ?? gitTimeoutOverride ?? (GIT_NET_ACTIONS.has(gitSubcommand(args)) ? GIT_NET_TIMEOUT_MS : GIT_TIMEOUT_MS)
  const cap = maxBuffer ?? 1024 * 1024
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      env: GIT_ENV,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform !== "win32", // POSIX：组首 ⇒ 树杀（-pid 组杀）可达孙进程（execute / bash 先例）
    })
    let stdout = "", stderr = "", mode = null, settled = false
    let outBytes = 0, errBytes = 0   // maxBuffer 口径 = **byte**（`execFileSync` 同源）
    let timer = null, killTimer = null, kickTimer = null
    const finish = (fn) => {
      if (settled) return
      settled = true
      clearTimeout(timer); clearTimeout(killTimer); clearTimeout(kickTimer)
      fn()
    }
    const timeoutErr = () => Object.assign(new Error(gitTimeoutNote(timeoutMs)), {
      code: "ETIMEDOUT", timedOut: true, timeoutMs, stdout, stderr, status: null,
    })
    const overflowErr = () => Object.assign(new Error(`git output exceeded maxBuffer (${cap} bytes)`), {
      code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER", stdout, stderr, status: null,
    })
    const exitErr = (code, signal) => Object.assign(new Error(`Command failed: git ${args.join(" ")}${stderr ? `\n${stderr}` : ""}`), {
      cmd: `git ${args.join(" ")}`, status: code, signal, killed: Boolean(signal), stdout, stderr,
    })
    const settleWith = (code, signal) => {
      // 超时收尾：树杀必达（`close` 早退 ⇒ 1.5s 定时器已被 finish 清掉——**不持管道**的孙进程
      // 会因此漏杀；树杀在头进程死后于 POSIX 仍可达全组）
      if (mode === "timeout") { treeKill(); return reject(timeoutErr()) }
      if (mode === "overflow") return reject(overflowErr())
      if (code === 0 && !signal) return resolve(stdout)
      return reject(exitErr(code, signal))
    }
    const treeKill = () => { try { killProcessTree(child) } catch { /* 尽力而为 */ } }
    // 超时动作序（§6.14）：① 直接子 → ② 逾 1.5s 树杀（`killProcessTree`，尽力而为）→ ③ 逾 1.5s 未 `close`
    // 亦 settle（kick——孙进程持管道时 `close` 永不触发，`bash.mjs:200-217` 同款）。上界 = timeout + 3s。
    // 平台分岔（§6.14 平台注的后果）：win32 上 SIGTERM 实为硬终止且**不连带子进程**——父一死，
    // `taskkill /PID <父> /T` 就够不到孙进程（实测：helper 孤儿存活、管道不放 ⇒ 只能等 kick）⇒
    // win32 直接走树杀（须在树仍可寻址时执行）；POSIX 保留宽限序（组杀在头进程死后仍可达全组）。
    const armKill = () => {
      if (process.platform === "win32") treeKill()
      else { try { child.kill("SIGTERM") } catch { /* 已退 */ } }
      killTimer = setTimeout(treeKill, 1500)
      kickTimer = setTimeout(() => finish(() => settleWith(null, "SIGTERM")), 3000)
    }
    timer = setTimeout(() => { if (!mode) { mode = "timeout"; armKill() } }, timeoutMs)
    // 解码 = **流级 UTF-8**（`StringDecoder` 正确拼接跨 chunk 的多字节序列——逐 chunk `toString()`
    // 会把半截序列解成 U+FFFD；批前三档经 `execFileSync({encoding:"utf8"})` 整体解码）
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (d) => {
      if (mode === "overflow") return
      stdout += d
      outBytes += Buffer.byteLength(d)
      // 截断按**字符**（判据只认 code + 部分输出——多字节前缀可略超 cap 字节，语义不损）
      if (outBytes > cap) { mode = "overflow"; stdout = stdout.slice(0, cap); armKill() }
    })
    child.stderr.on("data", (d) => {
      if (errBytes > cap) return   // 两管各自独立计（`spawnSync` 的 maxBuffer 同口径：per-stream）
      stderr += d
      errBytes += Buffer.byteLength(d)
    })
    child.on("error", (e) => {
      // 杀失败等信号面错误不得遮蔽已定模式（timeout / overflow 由 kick 收尾）
      if (mode) return
      finish(() => reject(Object.assign(e, { stdout, stderr, status: null })))
    })
    child.on("exit", (code, signal) => {
      // 直接子已退但孙进程持管道 ⇒ `close` 不到：逾 1.5s 亦按已收集输出 settle（kick）
      if (!settled && !kickTimer) kickTimer = setTimeout(() => finish(() => settleWith(code, signal)), 1500)
    })
    child.on("close", (code, signal) => finish(() => settleWith(code, signal)))
  })
}
