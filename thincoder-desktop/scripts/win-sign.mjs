#!/usr/bin/env node
/**
 * win-sign.mjs — electron-builder Windows 签名 hook（两态同管线 · 单源 = `docs/desktop/design/PROJECT.md` §5.3）。
 *
 * 挂载面：`electron-builder.yml` `win.signtoolOptions.sign: scripts/win-sign.mjs`——electron-builder 经
 * `resolveFunction`（`app-builder-lib/out/util/resolve.js`）载入本档并取**具名导出 `sign`**，以
 * `sign(config, packager)` 调用（`out/codeSign/windowsSignToolManager.js:132 ∥ :159-166`；
 * `config.path` = 待签文件；两态皆经此径——证书缺席时 electron-builder 不跳过 hook）。
 *
 * 两态：证书库**在位**（指纹探测）⇒ 经载体实签 + 明示行；**缺席** ⇒ 跳过 + `⚠ 未签名 …`（构建零失败——
 * 未签版可测）；证书在位而签名真错 ⇒ **抛出**（不吞——发布版不带无声未签）。
 * 载体 = 二择序：① PowerShell `Set-AuthenticodeSignature`（主——零依赖 ∥ 本机已证）② `signtool`（备——
 * 仅当可得：PATH ∥ Windows Kits）；主失败 ∥ 主不可得 ⇒ 备（§5.6「`signtool` 缺席 ⇒ 回退主载体」）。
 * 构建期要求 = UKey 在位 + SafeNet SAC 驱动 + PIN 弹窗（构建者在场）。
 * 探测 ∥ 命令构造 = 纯函数（批内件 L4 直测）；**本档不真跑签名路径**（证书事务 = 构建窗）。
 */
import { execFileSync } from "node:child_process"
import { globSync } from "node:fs"

/** 证书指纹（GlobalSign EV · eToken 5300——单源 = 设计档 §5.3）。 */
export const CERT_THUMBPRINT = "1B89F84D20EF2BE361D178EE2EA41228879CBE02"

/** 证书库探测面（当前用户 + 本机）。 */
export const CERT_STORES = ["Cert:\\CurrentUser\\My", "Cert:\\LocalMachine\\My"]

/** RFC3161 取时端点（GlobalSign 官方文档值，2026-10-01 实读；构建窗实测后回填本行——设计档 §5.3）。 */
export const RFC3161_URL = "http://timestamp.globalsign.com/tsa/r45standard"

/** Windows Kits 候选根（备载体的次查面——设计档 §5.3「载体预检实得」）。 */
export const KITS_ROOT = "C:\\Program Files (x86)\\Windows Kits"

/** PowerShell 单引号串转义（文件路径 —— `'` ⇒ `''`）。 */
function psQuote(value) {
  return String(value).replaceAll("'", "''")
}

/** 证书库探测命令（纯函数）：命中 ⇒ 打印指纹 ∥ 未命中 ⇒ `MISSING`。 */
export function probeCommand(thumbprint = CERT_THUMBPRINT) {
  const script = [
    `$thumb = '${psQuote(thumbprint)}'`,
    `$cert = Get-ChildItem -Path ${CERT_STORES.join(", ")} -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -eq $thumb } | Select-Object -First 1`,
    `if ($cert) { $cert.Thumbprint } else { 'MISSING' }`,
  ].join("; ")
  return { command: "powershell.exe", args: ["-NoProfile", "-NonInteractive", "-Command", script], script }
}

/** 探测输出解析（纯函数）：含指纹（大小写折叠）⇒ 在位 ∥ 其余（`MISSING` ∕ 空 ∕ 异常文本）⇒ 缺席。 */
export function parseProbeOutput(stdout, thumbprint = CERT_THUMBPRINT) {
  return String(stdout ?? "").toUpperCase().includes(String(thumbprint).toUpperCase())
}

/** 载体二择序（纯函数）：主 = PowerShell ∥ 备 = signtool（可得时）∥ 皆不可得 ⇒ null（跳过 + 明示）。 */
export function chooseCarrier({ powershellAvailable, signtoolAvailable }) {
  if (powershellAvailable) return "powershell"
  return signtoolAvailable ? "signtool" : null
}

/** 签名命令构造 · 载体 ①（纯函数）：`Set-AuthenticodeSignature` + RFC3161 取时端点。 */
export function buildPowerShellSign({ file, thumbprint = CERT_THUMBPRINT, timestampUrl = RFC3161_URL, hashAlgorithm = "SHA256" }) {
  const script = [
    `$thumb = '${psQuote(thumbprint)}'`,
    `$cert = Get-ChildItem -Path ${CERT_STORES.join(", ")} -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -eq $thumb } | Select-Object -First 1`,
    `if (-not $cert) { Write-Error 'certificate not found'; exit 2 }`,
    `$r = Set-AuthenticodeSignature -FilePath '${psQuote(file)}' -Certificate $cert -HashAlgorithm ${hashAlgorithm} -TimestampServer '${psQuote(timestampUrl)}'`,
    `if ($r.Status -ne 'Valid') { Write-Error ('sign failed: ' + $r.Status + ' — ' + $r.StatusMessage); exit 3 }`,
    `Write-Output ('SIGNED ' + $r.SignerCertificate.Thumbprint)`,
  ].join("; ")
  return { command: "powershell.exe", args: ["-NoProfile", "-NonInteractive", "-Command", script], script }
}

/** 签名命令构造 · 载体 ②（纯函数）：`signtool sign /sha1 … /fd sha256 /tr … /td sha256`。 */
export function buildSigntoolSign({ file, thumbprint = CERT_THUMBPRINT, timestampUrl = RFC3161_URL, hashAlgorithm = "sha256" }) {
  return {
    command: "signtool.exe",
    args: ["sign", "/sha1", thumbprint, "/fd", hashAlgorithm, "/tr", timestampUrl, "/td", hashAlgorithm, file],
    script: null,
  }
}

/** 载体 ② 定位（纯函数）：PATH 命中优先，其次 Windows Kits。 */
export function pickSigntool({ whereOutput = "", kitsMatches = [] } = {}) {
  const fromPath = String(whereOutput).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0]
  return fromPath ?? kitsMatches[0] ?? null
}

/** 载体 ② 探测（fs 面）：`where signtool`（PATH）⇒ Windows Kits 两形态；缺席 ⇒ null（正常态）。 */
export function detectSigntool() {
  let whereOutput = ""
  try {
    whereOutput = execFileSync("where.exe", ["signtool"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
  } catch {
    whereOutput = ""
  }
  let kitsMatches = []
  try {
    kitsMatches = [
      ...globSync("10/bin/*/x64/signtool.exe", { cwd: KITS_ROOT }),
      ...globSync("10/bin/*/x86/signtool.exe", { cwd: KITS_ROOT }),
    ].sort()
  } catch {
    kitsMatches = []
  }
  return pickSigntool({ whereOutput, kitsMatches })
}

/** 命令执行（捕获输出；非零退出 ⇒ `ran:false` + stdout 透传）。 */
function runCapture({ command, args }) {
  try {
    return { ran: true, stdout: execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }
  } catch (error) {
    return { ran: false, stdout: typeof error.stdout === "string" ? error.stdout : "", error }
  }
}

/** 实签（按载体走命令；失败抛出——由 `sign` 决定回退 ∕ 上报）。 */
function runCarrier(carrier, { file, signtoolPath }) {
  if (carrier === "signtool") {
    const { args } = buildSigntoolSign({ file })
    execFileSync(signtoolPath, args, { stdio: ["ignore", "inherit", "inherit"] })
    return
  }
  const { command, args } = buildPowerShellSign({ file })
  execFileSync(command, args, { stdio: ["ignore", "inherit", "inherit"] })
}

/**
 * 签名 hook 入口（electron-builder 契约：具名导出 `sign`，入参 = `CustomWindowsSignTaskConfiguration`）。
 * @param {{path?: string}} config 待签任务（`path` = 文件绝对路径）
 * @returns {Promise<boolean>} true = 已签 ∥ false = 跳过（证书缺席——零失败）；真错 = 抛出
 */
export async function sign(config, _packager) {
  const file = config?.path
  if (typeof file !== "string" || file.length === 0) {
    console.warn("[win-sign] ⚠ 未签名：hook 未收到文件路径（config.path 缺位）——跳过")
    return false
  }

  const probe = runCapture(probeCommand())
  const certInPlace = probe.ran && parseProbeOutput(probe.stdout)
  if (!certInPlace) {
    const because = probe.ran
      ? `证书库缺指纹 ${CERT_THUMBPRINT}（token 未插 ∕ SAC 缺 ∕ 证书未装）`
      : "证书库探测不可得（PowerShell 不可用）"
    console.warn(`[win-sign] ⚠ 未签名 ${file}——${because}；跳过（构建零失败）；发布版须复跑至「已签」`)
    return false
  }

  const signtoolPath = detectSigntool()
  const candidates = ["powershell", ...(signtoolPath ? ["signtool"] : [])]
  let lastError = null
  for (const carrier of candidates) {
    try {
      runCarrier(carrier, { file, signtoolPath })
      console.log(`[win-sign] ✔ 已签 ${file}（载体 = ${carrier} · 指纹 ${CERT_THUMBPRINT} · 取时 = ${RFC3161_URL}）`)
      return true
    } catch (error) {
      lastError = error
      const next = carrier === "powershell" && signtoolPath ? "——回退备载体 signtool" : ""
      console.warn(`[win-sign] ⚠ 载体 ${carrier} 签名失败${next}：${error.message}`)
    }
  }
  throw new Error(`[win-sign] 签名失败（证书在位，两载体均未成）：${lastError?.message ?? "unknown"}`)
}
