/**
 * ssh-transfer.mjs — 传输面单点（`put` / `get` 单文件：系统 `scp` ∥ 凭据链 ∥ 硬超时 ∥ 回执句 ∥ 半截档清理）。
 * 设计 = `docs/core/design/TOOLS.md` §6.22 ⑬（D-TO24–D-TO27 · 台账 #2026）；需求 = 需求档 §4.8 S10 ∥ S11 ∥ NS8。
 *
 * - 执行体 = 系统 `scp`（D-TO24）：缺省 `-O`（经典 SCP 协议——网络设备只实现它），`protocol:"sftp"` 去掉
 *   `-O`；不自动换协议重试（D-TO27：同笔重试把「协议不对」这个可诊断事实埋在两次尝试之后）。
 * - 凭据 = 与会话面**同一段判定**（`ssh-session.mjs` 的 `resolveSessionSecret`：探连 → 密文库 → 凭据窗），
 *   零新凭据通道（D-TO25）；askpass 包装档 / 环境 / 失败分类族全取 `ssh-transport.mjs` 既有导出。
 * - 内容零入上下文（NS8）：文件字节只经磁盘；回执 = 会话冠行 + 一行状态句，失败时附 stderr 尾段（≤ 600 字符）。
 * - 本地面（⑬ ②）：本地路径展开 `~`（单源 `expand-home.mjs`）后解析成绝对路径 ⇒ `spawn` 的 `cwd` = 该档
 *   所在目录、命令行只传**档名**——Windows 盘符的 `:` 与反斜杠都不进 scp 的参数位（scp 以首个 `:`
 *   切分本地 / 远端）；`get` 的父目录必须已在盘（**零建目录**：建目录即项目内一笔写，绕写门；落点也要
 *   让人看得见）。
 * - 回执首行 = 会话状态行冠行（⑬ ③；形单源 = `ssh-transport.mjs` 的 `statusLine`），其下才是状态句
 *   字面——多设备会话里只给路径，读的人无法确认推到了哪台。
 * - 不碰会话池：主机 / 用户 / 端口 / 身份面由 `ssh-session.mjs` 的 `sessionForTransfer` 供给。
 * 模块图：→ ssh-session.mjs（凭据判定 ∥ 会话记录）· ssh-transport.mjs（askpass 链 ∥ 失败分类族 ∥ 冠行）·
 * tools/process-tree.mjs（树杀）· expand-home.mjs（`~` 展开单源）——叶子向、无环
 * （`ssh-session.mjs` 不 import 本档）。
 */
import { spawn } from "node:child_process"
import { existsSync, statSync, unlinkSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"
import { killProcessTree } from "../tools/process-tree.mjs"
import { expandHome } from "../expand-home.mjs"
import {
  SSH_KEEPALIVE_MS, buildSshEnv, classifyFailure, failureText, statusLine, unlinkAskpass, writeAskpassWrapper,
} from "./ssh-transport.mjs"
import { resolveSessionSecret, sessionForTransfer } from "./ssh-session.mjs"

/** 传输硬超时缺省（⑬ ②）：600 000 ms = 选定策略值，非实测（真机读数不符 ⇒ 改这一个数）。 */
export const SSH_TRANSFER_TIMEOUT_MS = 600_000

/** 夹具缝（⑬「夹具缝」）：`scp` 自有缝——会话侧 `_setSshBinaryForTest` 换不到 `scp`。
 *  形同 `_setSshBinaryForTest`：setter + `??` 缺省回落 + 用例 `finally` 复位，生产行为零变。 */
let _scpBinary = null
let _scpArgPrefix = []
export function _setScpBinaryForTest(cmd, prefixArgs = []) {
  _scpBinary = cmd
  _scpArgPrefix = Array.isArray(prefixArgs) ? prefixArgs : []
}
export const scpBinary = () => _scpBinary ?? "scp"

// `~` 展开 = 单源 `thincoder-core/expand-home.mjs`（⑬ ② `localPath` 行；`config.mjs` 已 import 同一件）。
// 本档不持第二份：两份并存必漂移（D2）。

/** scp 命令形（⑬ ①/②）：`port` / `identityFile` 未给 ⇒ 不下发该选项（让本机配置兜底）。
 *  **端口开关 = `-P`**（本机 scp 用法行 `[-P port]`）；小写 `-p` 在 scp 是 preserve-times 且**不收值**
 *  ——与会话面 ssh 的 `-p` 不同，照抄会把这个数字丢成操作数。 */
function scpArgs({ action, protocol, host, user, port, identityFile, remotePath, localName, keepAliveMs = SSH_KEEPALIVE_MS }) {
  const keepAliveS = Math.max(1, Math.round((Number(keepAliveMs) || SSH_KEEPALIVE_MS) / 1000))
  const remote = `${user ? `${user}@` : ""}${host}:${remotePath}`
  return [
    ...(protocol === "sftp" ? [] : ["-O"]),
    "-o", "ConnectTimeout=10",
    "-o", `ServerAliveInterval=${keepAliveS}`,
    "-o", "ServerAliveCountMax=4",
    "-o", "NumberOfPasswordPrompts=1",
    // 端口开关 = `-P`（scp 原文用法行 `[-P port]`；小写 `-p` 在 scp 是 preserve-times 且**不收值**）——
    // 与会话面 ssh 的 `-p` 不同，照抄会把这个数字丢成操作数。
    ...(port ? ["-P", String(port)] : []),
    ...(identityFile ? ["-i", expandHome(identityFile)] : []),
    ...(action === "put" ? [localName, remote] : [remote, localName]),
  ]
}

/** 起跑一次 scp：stdin 关掉（口令只经 askpass 环境，scp 永不读终端）；到点杀树并留兜底收场。 */
function runScp({ args, cwd, wrapper, secret, timeoutMs }) {
  return new Promise((done) => {
    let child
    try {
      child = spawn(scpBinary(), [..._scpArgPrefix, ...args], {
        cwd, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
        detached: process.platform !== "win32",
        env: buildSshEnv({ wrapper, secret }),
      })
    } catch (e) {
      done({ spawnError: e?.message ?? String(e) })
      return
    }
    let out = ""
    let err = ""
    let settled = false
    let timedOut = false
    const finish = (r) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      done({ ...r, out, err, timedOut })
    }
    // 到点杀树；子进程不理会 kill 时兜底收场（判据已是 timedOut，不等内层 exit 事件）。
    const timer = setTimeout(() => {
      timedOut = true
      try { killProcessTree(child) } catch { /* 尽力面 */ }
      setTimeout(() => finish({ code: null, signal: "TIMEOUT" }), 1500).unref?.()
    }, Math.max(1, timeoutMs))
    timer.unref?.()
    child.stdout.on("data", (d) => { out += d })
    child.stderr.on("data", (d) => { err += d })
    child.on("error", (e) => finish({ spawnError: e?.message ?? String(e) }))
    child.on("exit", (code, signal) => finish({ code, signal }))
  })
}

const fileSize = (file) => {
  try { return statSync(file).size } catch { return 0 }
}
const fileMtime = (file) => {
  try { return statSync(file).mtimeMs } catch { return null }
}

/** 硬超时句（⑬ ⑤）：杀树 + 可读句；**`get` 侧**未删则如实写「落点原样」（不谎称删了），
 *  **`put` 侧**只如实交底（清远端半截档要第二条通道——本批不做，边界句）。 */
function timeoutText({ action, label, host, ms, removed = false }) {
  const secs = Math.round(ms / 100) / 10
  const base = `Error: ssh transfer timed out after ${secs}s (${label} @ ${host}) — the process tree was killed`
  if (action !== "get") {
    return `${base}; the local source file is untouched, and the remote host may keep a partial file (this batch does not clean it)`
  }
  return removed
    ? `${base}; the partial local file was removed (partial local file removed)`
    : `${base}; the local target was left as it stands (it was not modified since the transfer started)`
}

/**
 * `put` / `get` 单文件（§6.22 ⑬）：在会话那台主机上跑一次 `scp`，字节只经磁盘。
 * @returns {Promise<{ text?: string, error?: string }>}
 */
export async function transferSsh(parent, ctx, { action, id, localPath, remotePath, overwrite, protocol, timeoutMs } = {}) {
  const session = sessionForTransfer(parent, id)
  if (session.error) return { error: session.error }
  const sid = String(id ?? "").trim().replace(/^ssh#/i, "")
  const label = `ssh#${sid}`
  // 本地面（⑬ ②）：先展开 `~` 再解析成绝对路径——scp 只收档名（盘符 / 反斜杠不进参数位）。
  const local = resolve(ctx?.cwd ?? process.cwd(), expandHome(localPath))
  const dir = dirname(local)
  if (action === "get") {
    if (!existsSync(dir)) {
      return { error: `Error: ssh transfer: local directory not found: ${dir} — create it first (this tool never creates one: a mistyped get would land where you cannot see it)` }
    }
    if (overwrite !== true && existsSync(local)) {
      return { error: `Error: ssh transfer: target exists: ${local} — pass overwrite:true to replace it` }
    }
  } else if (!existsSync(local)) {
    return { error: `Error: ssh transfer: local source not found: ${local}` }
  }
  const ms = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Math.floor(Number(timeoutMs)) : SSH_TRANSFER_TIMEOUT_MS
  // 落点原状（超时清理的判据面）：`null` = 本来没有；否则记字节数与 mtime——**任一变了即视为「本次真被写过」**
  // （只看尺寸会漏掉「半截档恰好与原档同尺寸」那一支：mtime 一变就补上了）。
  const pristine = action === "get" && existsSync(local) ? { size: fileSize(local), mtime: fileMtime(local) } : null
  const wrapper = writeAskpassWrapper(`xfer-${Date.now()}`)
  /** 一次尝试（凭据判定顺序归 `resolveSessionSecret`；本档只管起跑与判读）。 */
  const attempt = async (secret, asUser = session.user) => {
    const argv = scpArgs({
      action, protocol, host: session.host, user: asUser, port: session.port,
      identityFile: session.identityFile, remotePath, localName: basename(local),
    })
    const r = await runScp({ args: argv, cwd: dir, wrapper, secret, timeoutMs: ms })
    if (r.spawnError) {
      return { ok: false, auth: false, reason: "spawn", failure: `Error: scp not available (${r.spawnError}) — install system OpenSSH or check PATH` }
    }
    if (r.timedOut) return { ok: false, auth: false, reason: "timeout" }
    if (r.code === 0) return { ok: true, reason: "ok" }
    // 认证类失败 ⇒ 判定面继续往下一条凭据来源（密文库 → 凭据窗）；其余失败一律就地交出。
    const classified = classifyFailure(r.err)
    const auth = classified?.kind === "auth"
    const cls = classified ?? { message: `transfer failed (${r.code == null ? `signal ${r.signal ?? "unknown"}` : `exit ${r.code}`})` }
    // 提示按现场分叉（⑬ ①「不做」行）：已传 `sftp` ⇒ 不再点该参数（用户已用过，点它等于让人重试同一笔）。
    const hint = protocol === "sftp"
      ? " — check the remote path; this host may not support file transfer either way"
      : ' — if that host only speaks SFTP, retry once with protocol:"sftp"'
    return { ok: false, auth, reason: "exited", failure: failureText({ id: sid, host: session.host, buf: r.err }, cls, hint) }
  }
  try {
    // 凭据窗传 `offerSave: false`：保存面（⑪ 窗内勾选 + `auth` 回写）只在 `connect` 面——传输是既有会话的
    // 补连接，不是建链入口 ⇒ 传输窗只问 user / password（要存凭据先 `connect` 一次）。设计 ⑬「凭据」段已记此面，
    // 用户可见后果由描述档写明；判定段仍是同一条（`resolveSessionSecret`）。
    const out = await resolveSessionSecret({
      ctx, host: session.host, port: session.port, user: session.user, sessionId: sid, offerSave: false, attempt,
    })
    if (out.state !== "ok") {
      if (out.state === "cancel") return { error: `Error: ssh transfer cancelled — no credential was provided (${label} @ ${session.host})` }
      if (out.state === "empty") return { error: `Error: ssh transfer cancelled — an empty password is never submitted (${label} @ ${session.host})` }
      const r = out.r ?? {}
      if (r.reason === "timeout") {
        // 半截档清理只限 `get`（`put` 侧本地源档不动——⑬ ⑤ 硬超时行）。只删**半截档**：落点字节数与 mtime
        // 都没变 ⇒ scp 连文件都没打开就超时，删它等于拿用户的旧档偿命（设计说的是删「半截档」，不是删落点上那个档）。
        let removed = false
        if (action === "get" && existsSync(local)) {
          const touched = pristine === null || fileSize(local) !== pristine.size || fileMtime(local) !== pristine.mtime
          if (touched) {
            try { unlinkSync(local); removed = true } catch { /* 尽力面 */ }
          }
        }
        return { error: timeoutText({ action, label, host: session.host, ms, removed }) }
      }
      return { error: r.failure ?? `Error: ssh transfer failed (${label} @ ${session.host})` }
    }
    const bytes = fileSize(local)
    const [from, to] = action === "put" ? [localPath, remotePath] : [remotePath, localPath]
    // 首行 = 会话状态行冠行（⑬ ③）；状态句字面 = 冠行之下那一行（字面单源也定在 ③）。
    return { text: `${session.header}\n${action} ${from} → ${to} · ${bytes} bytes · exit 0` }
  } catch (e) {
    // 工具面契约（`tools/ssh.mjs` 档头）：失败**返回**可读句，不 throw——`askCredential` 在无 UI 端抛
    // `noUi`（headless / ACP），那条路必须落回回执面（与 `connectSsh` 的 catch 同形）。
    return { error: e?.noUi ? `Error: ${e.message}` : `Error: ssh transfer failed: ${e?.message ?? String(e)}` }
  } finally {
    unlinkAskpass({ askpassFile: wrapper }) // 包装档内容零秘密——收尾尽力面
  }
}