/**
 * ssh.mjs — SSH 传输（sandbox/SANDBOX.md §3「托管接入」∥ §14 KD-SV-85；runner-admin-console 批——台账 #1236）：
 * spawn 系统 openssh（密钥 `-i <0600 文件>` ∥ 密码 `sshpass -e`——环境变量口径，不入 argv/ps）∥ keyfile/known_hosts 落数据目录
 * ∥ 主机指纹 TOFU（`accept-new` + 首见记录；变更 ⇒ 停 + 「重新信任」重试）∥ 超时/输出截断；`execImpl` 注入 = 测试面。
 *
 * 无人值守口径：密钥径 = `BatchMode=yes`（不弹交互）∥ 口令径 = 不带 `BatchMode`（带了直接弃用口令面——真机 A/B 核 2026-10-11），
 * 改 `NumberOfPasswordPrompts=1` + `PreferredAuthentications=password` ∥ `PubkeyAuthentication=no`（单提示、仅口令面——KD-SV-85）∥ `ConnectTimeout=10`；逐条命令、非交互；sudo 口令经 stdin（`sudo -S`——§3）。
 * 零第三方运行期依赖（系统 openssh——KD-SV-85）；本档只做传输，决定/重试/步骤 = 上层（agent 环 ∥ 任务面）。
 */
import { spawn } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/** 单命令缺省超时（秒——可逐调用覆盖）。 */
export const SSH_COMMAND_TIMEOUT_S = 60
/** 输出截断（字符——逐流；防病态回显撑爆上下文）。 */
export const SSH_OUTPUT_MAX = 20000

/** 传输级失败（`kind`：auth ∥ unreachable ∥ fingerprint_changed ∥ host_missing_binary ∥ timeout ∥ spawn）。 */
export class SshError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = "SshError"
    this.kind = kind
  }
}

/** 数据目录下的 `.ssh/`（keyfile ∥ known_hosts——容器重建不丢；§3）。 */
export function sshDir(baseDir) {
  return join(baseDir, ".ssh")
}

function ensureSshDir(baseDir) {
  const dir = sshDir(baseDir)
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

/** 私钥落盘（0600——用完即弃面：任务收尾清理；§3）。 */
export function writeKeyFile(baseDir, name, content) {
  const dir = ensureSshDir(baseDir)
  const file = join(dir, `${name}.key`)
  writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`, { mode: 0o600 })
  chmodSync(file, 0o600)
  return file
}

/** 私钥清理（任务收尾——尽力而为）。 */
export function removeKeyFile(file) {
  try {
    if (file && existsSync(file)) rmSync(file, { force: true })
  } catch {
    /* 清理尽力而为——任务终态已定 */
  }
}

/** 指纹变更后清 stale 条目（「重新信任并重试」的机器面——重交任务即重信任；免人工翻文件——提议⑬）。
 *  known_hosts 行形：`<名> <算法> <指纹>`——非 22 端口 = `[host]:port` 前缀。 */
export function forgetHost(baseDir, host, port = 22) {
  const file = join(sshDir(baseDir), "known_hosts")
  if (!existsSync(file)) return false
  const tokens = new Set([host, `[${host}]:${port}`, port === 22 ? `${host}:22` : null].filter(Boolean))
  let changed = false
  const kept = readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => {
      const token = line.trim().split(/\s+/)[0] ?? ""
      if (tokens.has(token)) {
        changed = true
        return false
      }
      return true
    })
  if (changed) writeFileSync(file, kept.join("\n"), { mode: 0o600 })
  return changed
}

/** 默认 spawn 实现（可注入替身——批内件假件；`execImpl(cmd, args, opts) => { code, stdout, stderr }`）。 */
export function spawnSsh(cmd, args, { env = process.env, input = null, timeoutMs = SSH_COMMAND_TIMEOUT_S * 1000 } = {}) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(cmd, args, { env, stdio: ["pipe", "pipe", "pipe"] })
    } catch (e) {
      resolve({ code: -1, stdout: "", stderr: String(e?.message ?? e), spawnError: true })
      return
    }
    let stdout = ""
    let stderr = ""
    let done = false
    const finish = (result) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL")
      } catch {
        /* 进程可能已退出 */
      }
      finish({ code: -1, stdout, stderr: `${stderr}\n[超时 ${timeoutMs}ms——已杀]`, timedOut: true })
    }, timeoutMs)
    child.stdout?.on("data", (chunk) => {
      if (stdout.length < SSH_OUTPUT_MAX * 2) stdout += chunk.toString("utf8")
    })
    child.stderr?.on("data", (chunk) => {
      if (stderr.length < SSH_OUTPUT_MAX * 2) stderr += chunk.toString("utf8")
    })
    child.on("error", (e) => finish({ code: -1, stdout, stderr: `${stderr}${e.message}`, spawnError: e?.code === "ENOENT" }))
    child.on("close", (code) => finish({ code: code ?? -1, stdout, stderr }))
    try {
      if (input !== null && input !== undefined) child.stdin.end(input)
      else child.stdin.end()
    } catch {
      /* stdin 已关（进程早退）——close 面收口 */
    }
  })
}

/** 本机 `sshpass` 在场检查（密码认证前置——§3 宿主前提；缺 ⇒ S2 停 + 报因）。 */
export async function hasSshpass({ execImpl = spawnSsh } = {}) {
  const res = await execImpl("sshpass", ["-V"], { timeoutMs: 5000 })
  return !res.spawnError && res.code === 0
}

/** 截断（尾保留——错误尾最有诊断价值）。 */
function truncate(text) {
  const value = String(text ?? "")
  return value.length > SSH_OUTPUT_MAX ? `…（前段略——实长 ${value.length}）\n${value.slice(-SSH_OUTPUT_MAX)}` : value
}

/** 传输级 stderr 分类（无人值守——逐句人话）。 */
function classifyFailure(stderr, host) {
  const text = String(stderr ?? "")
  if (/REMOTE HOST IDENTIFICATION HAS CHANGED|Host key verification failed/i.test(text)) {
    return new SshError("fingerprint_changed", "主机指纹已变更——确认后重试（重交任务即重新信任）")
  }
  if (/Permission denied|Too many authentication failures|Authentication failed/i.test(text)) {
    return new SshError("auth", `无法登录：认证被拒（检查用户名/密钥/口令——${host}）`)
  }
  if (/Connection timed out|Connection refused|No route to host|Could not resolve hostname|Connection closed by|Network is unreachable/i.test(text)) {
    return new SshError("unreachable", `无法登录：主机不可达或超时（${host}）`)
  }
  return null
}

/**
 * SSH 执行器（§3）：`exec({ host, port, user, authKind, secret, sudoSecret, command, timeoutS })` ⇒ `{ exitCode, stdout, stderr }`。
 * 传输级失败 ⇒ 抛 `SshError`（auth ∥ unreachable ∥ fingerprint_changed ∥ host_missing_binary ∥ timeout）；命令非零退出 = 正常返回（读数面）。
 * 注入口径：`execImpl`（spawn 替身——测试面）∥ `baseDir`（数据目录——keyfile/known_hosts 落点）。
 */
export function createSshExecutor({ baseDir, execImpl = spawnSsh, defaultTimeoutS = SSH_COMMAND_TIMEOUT_S, keyName = null } = {}) {
  if (typeof baseDir !== "string" || baseDir === "") throw new Error("createSshExecutor：缺 baseDir（数据目录）")
  const keyFile = keyName ? join(sshDir(baseDir), `${keyName}.key`) : null
  let keyWritten = false

  async function exec({ host, port = 22, user, authKind = "key", secret = "", sudoSecret = null, command, timeoutS = defaultTimeoutS } = {}) {
    if (typeof command !== "string" || command.trim() === "") throw new SshError("spawn", "命令不可为空")
    if (typeof host !== "string" || host.trim() === "" || typeof user !== "string" || user.trim() === "") throw new SshError("spawn", "缺目标主机或用户名")
    const dir = ensureSshDir(baseDir)
    const knownHosts = join(dir, "known_hosts")
    const commonArgs = [
      "-o", "ConnectTimeout=10",
      "-o", "StrictHostKeyChecking=accept-new", // TOFU：首见记录；变更 ⇒ 传输级失败（下方分类）
      "-o", `UserKnownHostsFile=${knownHosts}`,
      "-p", String(port),
    ]
    let cmd = "ssh"
    let args
    let env = process.env
    if (authKind === "key") {
      const file = keyFile ?? writeKeyFile(baseDir, `onboarding-${process.pid}-${Math.random().toString(16).slice(2, 8)}`, String(secret ?? ""))
      if (keyFile && !keyWritten) {
        writeKeyFile(baseDir, keyName, String(secret ?? ""))
        keyWritten = true
      }
      args = ["-i", file, "-o", "BatchMode=yes", ...commonArgs, `${user}@${host}`, "--", command]
    } else if (authKind === "password") {
      // `sshpass -e`：口令经环境变量（不入 argv/ps——KD-SV-85）；口令径不带 `BatchMode`（带了 openssh 直接弃用口令面——真机 A/B 核 2026-10-11）
      // 无人值守改由「单提示 + 仅口令面」承接（KD-SV-85）：`NumberOfPasswordPrompts=1` ∥ `PreferredAuthentications=password` ∥ `PubkeyAuthentication=no`
      cmd = "sshpass"
      args = [
        "-e", "ssh", ...commonArgs,
        "-o", "NumberOfPasswordPrompts=1",
        "-o", "PreferredAuthentications=password",
        "-o", "PubkeyAuthentication=no",
        `${user}@${host}`, "--", command,
      ]
      env = { ...process.env, SSHPASS: String(secret ?? "") }
    } else {
      throw new SshError("spawn", `认证方式仅收 key ∥ password：${String(authKind)}`)
    }
    // sudo 口令经 stdin（`sudo -S` 读取——§3；命令不含 sudo -S 则不喂）
    const input = sudoSecret && /sudo\s+-S/.test(command) ? `${sudoSecret}\n` : null
    const result = await execImpl(cmd, args, { env, input, timeoutMs: Math.max(1000, Number(timeoutS) * 1000) })
    if (result.spawnError) {
      const message = authKind === "password"
        ? "宿主缺 sshpass——密码认证不可用（装 sshpass 或改用密钥——检查并报）"
        : `本机缺 ssh（系统 openssh 不在——KD-SV-85）：${String(result.stderr ?? "").trim()}`
      throw new SshError("host_missing_binary", message)
    }
    if (result.timedOut) throw new SshError("timeout", `命令超时（${timeoutS}s——${host}）：${truncate(result.stderr)}`)
    const failure = classifyFailure(result.stderr, host)
    if (failure) {
      if (failure.kind === "fingerprint_changed") forgetHost(baseDir, host, port) // 重交任务 = 重新信任（提议⑬）
      throw failure
    }
    if (result.code === 255) throw new SshError("unreachable", `无法登录：连接失败（${host}）——${truncate(result.stderr).slice(0, 300)}`)
    return { exitCode: result.code, stdout: truncate(result.stdout), stderr: truncate(result.stderr) }
  }

  return {
    exec,
    keyFilePath: () => keyFile,
    forgetHost: (host, port = 22) => forgetHost(baseDir, host, port),
    knownHostsPath: () => join(ensureSshDir(baseDir), "known_hosts"),
    baseDir,
  }
}
