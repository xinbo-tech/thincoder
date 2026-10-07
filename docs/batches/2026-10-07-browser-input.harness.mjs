/**
 * 2026-10-07-browser-input.harness.mjs — 批内件测试台（假传输 + 假页 + 装缝，供本批两档单测共用）。
 * 缝纪律（设计档 §7 N-BT6）：`WebSocketImpl`（假传输——记录全部 CDP 调用的出帧）+ `_deps`（开启 ∥ 杀树 ∥
 * 落盘替身）——缺省回落真实现（`??`），用例 `finally` 还原；本档零真实浏览器、零真实 profile、零真实文件写。
 * 拆档由来 = 单测档破 500 硬限 ⇒ 按设计档 §5 拆位（输入面 ∥ 剪贴板 / 门面）——测试台抽公档（第三档，报备）。
 */
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { connectCdp } from "../../thincoder-core/browser/cdp.mjs"
import * as session from "../../thincoder-core/browser/session.mjs"
import { browserTool } from "../../thincoder-core/tools/browser.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = resolve(HERE, "../..")
export const CORE = join(REPO, "thincoder-core")
export const ctx0 = () => ({ agent: { config: {} } })
export const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]).toString("base64")

let PAGE = null
let sockets = []

export class FakeWebSocket {
  constructor(url) {
    this.url = url
    this.sent = []
    sockets.push(this)
    queueMicrotask(() => this.onopen?.())
  }
  send(raw) {
    const msg = JSON.parse(raw)
    this.sent.push(msg)
    let reply
    try { reply = PAGE.respond(msg, this) } catch (e) { reply = { error: { message: String(e?.message ?? e) } } }
    if (!reply) return
    queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ id: msg.id, ...reply }) }))
  }
  emitEvent(method, params) { queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ method, params }) })) }
  close() { this.closed = true }
}

export const evalOk = (value) => ({ result: { result: { type: value === null ? "object" : typeof value, value } } })
export const selectorIn = (expression) => {
  const m = /querySelector\(("(?:[^"\\]|\\.)*")\)/.exec(expression)
  return m ? JSON.parse(m[1]) : null
}

/** 假页：应答 CDP 方法；页面侧脚本（`thincoder-browser:*` 标记）由本对象代替执行（默认元素面 = T17–T22 常用三件）。 */
export function fakePage(opts = {}) {
  return {
    url: opts.url ?? "http://a.test/",
    title: opts.title ?? "Fixture",
    elements: opts.elements ?? [
      { tag: "a", role: "link", name: "Next", selector: "#next", disabled: false },
      { tag: "input", role: "textbox", name: "Name", selector: "#name", disabled: false },
      { tag: "button", role: "button", name: "Go", selector: "#go", disabled: false },
    ],
    total: opts.total,
    readyState: "complete",
    point: opts.point ?? { found: true, x: 120.5, y: 340.25 },
    points: opts.points ?? null,
    focus: opts.focus ?? { found: true, focused: true },
    hasFocus: opts.hasFocus ?? true,
    scroll: opts.scroll ?? [0, 300],
    clipboardText: opts.clipboardText ?? "hello world",
    clipboardRead: opts.clipboardRead ?? null,
    setPermission: opts.setPermission ?? "ok",
    grantPermissions: opts.grantPermissions ?? "ok",
    interceptArmed: false,
    dragEmitted: false,
    dragData: opts.dragData ?? { items: [], dragOperationsMask: 1 },
    respond(msg, ws) {
      const { method, params = {} } = msg
      if (method === "Page.enable" || method === "Runtime.enable" || method === "Network.enable") return { result: {} }
      if (method === "Page.navigate") { this.url = params.url; return { result: { frameId: "F1" } } }
      if (method === "Page.captureScreenshot") return { result: { data: PNG_B64 } }
      if (method === "Browser.close") return { result: {} }
      if (method === "Browser.setPermission") {
        return this.setPermission === "fail" ? { error: { message: "'Browser.setPermission' wasn't found" } } : { result: {} }
      }
      if (method === "Browser.grantPermissions") {
        return this.grantPermissions === "fail" ? { error: { message: "grantPermissions failed" } } : { result: {} }
      }
      if (method === "Emulation.setFocusEmulationEnabled") return { result: {} }
      if (method === "Input.setInterceptDrags") { this.interceptArmed = params.enabled === true; return { result: {} } }
      if (method === "Input.dispatchMouseEvent") {
        if (params.type === "mouseMoved" && params.buttons === 1 && this.interceptArmed && !this.dragEmitted) {
          this.dragEmitted = true
          ws.emitEvent("Input.dragIntercepted", { data: this.dragData })
        }
        return { result: {} }
      }
      if (method.startsWith("Input.")) return { result: {} }
      if (method !== "Runtime.evaluate") return { result: {} }
      const e = String(params.expression ?? "")
      if (e.includes("thincoder-browser:snapshot")) {
        const at = e.lastIndexOf("})(")
        const asked = at >= 0 ? JSON.parse(e.slice(at + 3).replace(/\)\s*$/, "")) : {}
        return evalOk({ url: this.url, title: this.title, elements: this.elements.slice(0, Math.max(1, asked.max ?? 100)), total: this.total ?? this.elements.length })
      }
      if (e.includes("thincoder-browser:pageinfo")) return evalOk({ url: this.url, title: this.title, readyState: this.readyState })
      if (e.includes("thincoder-browser:point")) {
        const sel = selectorIn(e)
        return evalOk((this.points && this.points[sel]) || this.point)
      }
      if (e.includes("thincoder-browser:focus")) return evalOk(this.focus)
      if (e.includes("thincoder-browser:clipboard-write")) return evalOk({ ok: true, via: "navigator.clipboard" })
      if (e.includes("thincoder-browser:clipboard-read")) return evalOk(this.clipboardRead ?? { ok: true, text: this.clipboardText })
      if (e.includes("document.hasFocus()")) return evalOk(this.hasFocus)
      if (e.includes("window.scrollX")) return evalOk({ x: this.scroll[0], y: this.scroll[1] })
      if (e.includes("innerWidth")) return evalOk({ x: 720, y: 450 })
      return evalOk(undefined)
    },
  }
}

/** 装缝：开浏览器替身（真 `connectCdp` + 假 `WebSocketImpl`）∥ 杀树替身 ∥ 落盘替身。 */
export function installFake(page) {
  PAGE = page
  sockets = []
  const opened = [], killed = []
  const prev = { ...session._deps }
  session._deps.openBrowser = async (o) => {
    opened.push(o)
    const cdp = await connectCdp("ws://fake-tab", { WebSocketImpl: FakeWebSocket })
    const child = { pid: 4242, exitCode: null }
    setTimeout(() => { if (child.exitCode === null) child.exitCode = 0 }, 20)
    return { cdp, child, headless: o.headless }
  }
  session._deps.killBrowser = (child) => { killed.push(child) }
  session._deps.saveShot = async (buf) => ({ path: "/fake/shots/shot-1.png", bytes: buf.length })
  const last = () => sockets[sockets.length - 1]
  return {
    opened, killed, page,
    get calls() { return last()?.sent ?? [] },
    async restore() { await session.closeSession(); Object.assign(session._deps, prev); PAGE = null; sockets = [] },
  }
}

/** 装缝 → 跑体 → 还原（缝纪律的单点落面：用例 `finally` 还原）。 */
export async function withPage(page, body) {
  const fix = installFake(page)
  try { return await body(fix) } finally { await fix.restore() }
}

export const run = (action, args = {}, ctx = ctx0()) => browserTool.execute({ action, ...args }, ctx)
export const callsOf = (fix, method) => fix.calls.filter((c) => c.method === method)
export const keyEvents = (fix) => callsOf(fix, "Input.dispatchKeyEvent").map((c) => c.params)
export const mouseEvents = (fix) => callsOf(fix, "Input.dispatchMouseEvent").map((c) => c.params)
export const downKey = (p) => p.type === "keyDown" || p.type === "rawKeyDown"
