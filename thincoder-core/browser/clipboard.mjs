/**
 * browser/clipboard.mjs — 剪贴板动作（read / write / copy / paste）∥ Browser 域授权 ∥ 页侧表达式
 * （BROWSER-TOOL.md §3.5 ∥ §2.2 clipboard ∥ N-BT9）。
 *
 * 路径（KD-13）：CDP 无剪贴板直控方法 ⇒ 页面 API（`navigator.clipboard`）+ Browser 域按 origin 惰性授予；
 * `write` 页面拒 / 非安全上下文 ⇒ 回落 `document.execCommand('copy')` 隐藏 textarea 面（再败才报错）。
 * copy / paste = 真加速键（平台分支：darwin ⇒ Meta+C/V；win32 / linux ⇒ Ctrl+C/V——受信按键直驱浏览器复制 / 粘贴）。
 * 隐私（N-BT9）：read 回执上限 8000 字符 + 截断标记；write 回执不回显文本；剪贴板内容不落盘、不写日志（本档零 fs 面）。
 */
import { pressSequence } from "./input.mjs"
import { truncateText } from "./snapshot.mjs"

export const CLIPBOARD_MAX_CHARS = 8_000
export const CLIPBOARD_OPS = ["read", "write", "copy", "paste"]
/** `Browser.setPermission` 取的描述符名（实测在册可用——PermissionDescriptor ≠ PermissionType）。 */
export const CLIPBOARD_PERMISSION_DESCRIPTORS = ["clipboard-read", "clipboard-write"]
/** `Browser.grantPermissions` 取的权限枚举（PermissionType——回落面，两法同名不同名面，实测在案）。 */
export const CLIPBOARD_PERMISSIONS = ["clipboardReadWrite", "clipboardSanitizedWrite"]

const mark = (kind) => `/*thincoder-browser:${kind}*/`

/** 授权缓存（§3.5：会话内按 origin 缓存——close / 换 origin 重授；键 = 连接身份）。 */
let grantCache = { client: null, origins: new Set() }
/** 无头焦点模拟缓存（§3.5：会话内一次性——仅剪贴板动作触发，不进其他动作路径）。 */
let focusCache = { client: null, done: false }

/** 无头焦点适配：`document.hasFocus()` 为假 ⇒ `Emulation.setFocusEmulationEnabled`（一次/会话）。 */
async function ensureFocusEmulation(h) {
  const client = h.connection()
  if (client && focusCache.client === client && focusCache.done) return
  let hasFocus = true
  try { hasFocus = (await h.evalRaw("document.hasFocus()")) === true } catch { hasFocus = true } // 页不可读 ⇒ 不模拟
  if (!hasFocus) await h.call("Emulation.setFocusEmulationEnabled", { enabled: true })
  focusCache = { client, done: true }
}

/**
 * 按当前页 origin 惰性授予（§3.5）：`setPermission` 两权（描述符名）→ 方法缺 / 拒 ⇒ `grantPermissions`
 * 回落（PermissionType 枚举）→ 再败明示错。实测（本机 Edge）：`setPermission` 只认描述符名
 * （`clipboard-read` / `clipboard-write`）；PermissionType 名在该方法上被拒（版本 / 名面漂移——回落层兜住）。
 */
async function ensureClipboardPermission(h, origin) {
  const client = h.connection()
  if (grantCache.client !== client) grantCache = { client, origins: new Set() }
  if (grantCache.origins.has(origin)) return
  try {
    for (const name of CLIPBOARD_PERMISSION_DESCRIPTORS) {
      await h.call("Browser.setPermission", { permission: { name }, setting: "granted", origin })
    }
  } catch (e) {
    try {
      await h.call("Browser.grantPermissions", { permissions: CLIPBOARD_PERMISSIONS, origin })
    } catch (e2) {
      throw h.pageError(`clipboard permission failed — setPermission: ${e?.message ?? e}; grantPermissions fallback: ${e2?.message ?? e2}`)
    }
  }
  grantCache.origins.add(origin)
}

/** 当前页 origin（授权键）；无真实页 origin（about:blank 等）⇒ 明示拒（不静默降级）。 */
async function pageOrigin(h) {
  const info = await h.pageInfo()
  let origin = null
  try { origin = new URL(info.url).origin } catch { origin = null }
  if (!origin || origin === "null") throw h.pageError(`clipboard requires an http/https page origin — current page is "${info.url}"`)
  return origin
}

/** 页侧写表达式：`navigator.clipboard.writeText` → 失败回落 `document.execCommand('copy')` 隐藏 textarea。 */
function clipboardWriteExpression(text) {
  return `${mark("clipboard-write")}(async function () {
  var text = ${JSON.stringify(text)}
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return { ok: true, via: 'navigator.clipboard' }
    }
  } catch (e) { /* 页面拒 / 非安全上下文 ⇒ 走 execCommand 回落 */ }
  try {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    var ok = false
    try { ok = document.execCommand('copy') } finally { document.body.removeChild(ta) }
    return ok ? { ok: true, via: 'execCommand' } : { ok: false, message: 'document.execCommand("copy") returned false' }
  } catch (e2) { return { ok: false, message: String((e2 && e2.message) || e2) } }
})()`
}

/** 页侧读表达式：`navigator.clipboard.readText()`（安全上下文限定——非安全上下文给引导句）。 */
function clipboardReadExpression() {
  return `${mark("clipboard-read")}(async function () {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return { ok: false, message: 'navigator.clipboard.readText is unavailable — a secure context (https or localhost) is required' }
    }
    var text = await navigator.clipboard.readText()
    return { ok: true, text: String(text == null ? '' : text) }
  } catch (e) { return { ok: false, message: String((e && e.message) || e) } }
})()`
}

/** 加速键序列（§3.5 平台分支）：darwin ⇒ Meta+C/V；win32 / linux ⇒ Ctrl+C/V。 */
export function acceleratorSequence(op, platform = process.platform) {
  const modifier = platform === "darwin" ? "Meta" : "Control"
  const key = op === "copy" ? "c" : "v"
  return pressSequence({ key, modifiers: [modifier] }).commands
}

/** clipboard（§2.2）：op ∈ read / write / copy / paste；write 必填 text；copy / paste 可携 ref 聚焦。 */
async function actClipboard(args, ctx, h) {
  const op = String(args.op ?? "")
  if (!CLIPBOARD_OPS.includes(op)) throw new Error(`unknown clipboard op "${op}" — ops: ${CLIPBOARD_OPS.join(", ")}`)
  await h.ensureSession(args)
  await ensureFocusEmulation(h)
  const origin = await pageOrigin(h)
  await ensureClipboardPermission(h, origin)
  if (op === "write") {
    const text = String(args.text)
    const res = await h.evalRaw(clipboardWriteExpression(text))
    if (!res?.ok) throw h.pageError(`clipboard write failed: ${res?.message ?? "the page rejected the write"}`)
    return `[clipboard] write ← ${text.length} chars` // 不回显文本（N-BT9）
  }
  if (op === "read") {
    const res = await h.evalRaw(clipboardReadExpression())
    if (!res?.ok) throw h.pageError(`clipboard read failed: ${res?.message ?? "the page rejected the read"}`)
    const text = String(res.text ?? "")
    const body = text ? `\n${truncateText(text, CLIPBOARD_MAX_CHARS, `clipboard reads are capped at ${CLIPBOARD_MAX_CHARS} chars`)}` : ""
    return `[clipboard] read (${text.length} chars)${body}`
  }
  let target = null
  if (typeof args.ref === "string" && args.ref !== "") target = await h.focusRef(args.ref)
  for (const cmd of acceleratorSequence(op)) await h.call(cmd.method, cmd.params)
  return `[clipboard] ${op}${target ? ` → ${target.label}` : ""}`
}

/** 剪贴板分发表（会话档并入总表——§5）。 */
export const CLIPBOARD_ACTIONS = { clipboard: actClipboard }
