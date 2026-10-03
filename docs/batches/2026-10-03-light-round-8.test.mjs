/**
 * 2026-10-03-light-round-8.test.mjs — 轻通道轮八（fallback 明示行文案澄清）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-03-light-round-8.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿：
 *   T1 行面：fallback 态 ⇒ 行在场 ∧ 词 = 澄清句（新键）；ok ⇒ 零行（负向锁）；invalid 类 ⇒ 零行（两腿）
 *   T2 词面：新键两语成对（与 VSC `banner.defaultModelFallback` 同构——去 ⚠ 前缀）；失败词保持逐字（分家）
 *   T3 源扫：`providerNotice` 用新键 ∥ `failedNotice` 保持旧键（词路由不串）
 * 纪律：行为断言走**真工厂**（`createComposerSync`）+ 假 DOM（`dom.mjs` 唯一构造点 = `document.createElement`）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（composer-sync 取件链所需）

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

/** 假 DOM 节点（`dom.mjs` 唯一构造点 = `document.createElement` + `instanceof Node`）。 */
class FakeNode {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.attrs = new Map(); this.kids = []; this.parentNode = null }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  append(...nodes) { for (const node of nodes) { if (node !== null && typeof node === "object") node.parentNode = this; this.kids.push(node) } }
  replaceChildren(...nodes) { this.kids = []; this.append(...nodes) }
}

test("T1 fallback 明示行：行在场 ∧ 词 = 澄清句；ok ∥ invalid 类 ⇒ 零行（负向锁）", async () => {
  const { createComposerSync } = await mod("thincoder-desktop/renderer/composer-sync.mjs")
  const { initDict } = await mod("thincoder-desktop/renderer/i18n.mjs")
  initDict({ locale: "zh" })
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = { createElement: (tag) => new FakeNode(tag) }
  globalThis.Node = FakeNode
  try {
    const anchor = new FakeNode("div")
    const state = { activeSession: "1", pending: {}, attachDegraded: {}, providerState: null }
    const sync = createComposerSync({
      store: { get: () => state }, activeKey: () => state.activeSession,
      call: () => new Promise(() => {}), push: () => {}, pushSubs: [],
      wire: { failure: () => null }, panelOf: () => null, noticesOf: () => anchor,
    })
    const rowWord = () => { sync.paintNotices(state); return anchor.kids.length === 0 ? null : anchor.kids[0].kids[0] }
    state.providerState = { state: "fallback", reason: "", invalidReason: "" }
    assert.equal(rowWord(), "默认模型未设置或无效 — 正在使用可用渠道", "fallback 态 ⇒ 澄清句（可运行被明示 —— 轻通道轮八）")
    state.providerState = { state: "ok", reason: "", invalidReason: "" }
    assert.equal(rowWord(), null, "ok ⇒ 零行（负向锁）")
    state.providerState = { state: "invalid", reason: "", invalidReason: "无渠道" }
    assert.equal(rowWord(), null, "invalid 类 ⇒ 零行（归发送失败行）")
    state.providerState = { state: "fallback", reason: "", invalidReason: "结构不全" }
    assert.equal(rowWord(), null, "fallback ∧ invalidReason 非空 ⇒ 零行（合成式第二腿）")
  } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
})

test("T2 词面：新键两语成对（与 VSC 同构）∥ 失败词保持逐字（分家）", async () => {
  const { initDict, t } = await mod("thincoder-desktop/renderer/i18n.mjs")
  initDict({ locale: "en" })
  assert.equal(t("composer.send.noDefaultModelFallback"), "Default model missing or invalid — using an available channel", "en 澄清句")
  assert.equal(t("composer.send.noDefaultModel"), "Default model missing or invalid", "en 失败词零动")
  initDict({ locale: "zh" })
  assert.equal(t("composer.send.noDefaultModelFallback"), "默认模型未设置或无效 — 正在使用可用渠道", "zh 澄清句")
  assert.equal(t("composer.send.noDefaultModel"), "默认模型未设置或无效", "zh 失败词零动")
})

test("T3 源扫：providerNotice 用新键 ∥ failedNotice 保持旧键（词路由不串）", async () => {
  const src = text("thincoder-desktop/renderer/composer-sync.mjs")
  const noticeBlock = src.slice(src.indexOf("function providerNotice"), src.indexOf("function modelRowOf"))
  assert.ok(noticeBlock.includes("composer.send.noDefaultModelFallback"), "providerNotice ⇒ 新键（澄清句）")
  assert.ok(!noticeBlock.includes('t("composer.send.noDefaultModel")'), "providerNotice 不再用失败词")
  const failBlock = src.slice(src.indexOf("function failedNotice"), src.indexOf("function providerNotice"))
  assert.ok(failBlock.includes('"composer.send.noDefaultModel"'), "failedNotice ⇒ 旧键保持（失败词 ∥ 态词分家）")
})
