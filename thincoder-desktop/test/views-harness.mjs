/**
 * views-harness.mjs — 视图面用例共享夹具（**非清单档** —— 沿 `test/fake-dom.mjs` / `test/slot-sandbox.mjs` 先例：
 * runner 只收集 `*.test.mjs`，本档是助手；见 `docs/desktop/design/PROJECT.md` §4.1 `test/` 行）。
 * 面清单：① 树遍历（`walk` / `nodes` / `texts`）；② 词面哨兵缝（`sentinel` / `useSentinels`）；③ 切片夹具
 * （`stateOf`）；④ 假 DOM 三片补缝（`installSeam` —— 槽面选择器 / `closest("form")` / `value` 读写）；⑤ 提交端
 * `FormData` 替身（`FormDataStub`）；⑥ 窄桥替身（`bridge` —— 回执可编程 + 调用录）；⑦ 设置面供给夹
 * （`supplyFace` —— 两写回执可翻）；⑧ 挂载夹具（`mountFace` —— 假面自检 + 两槽 + 初态补丁 + 独立 store
 * + 可选装配面 `deps` 注入 ⇒ 接线，回值含 `handle` = `attachSettings` 句柄面）；⑨ `clickOn`。
 * 消费面：`thincoder-desktop/test/views-settings.test.mjs`（T-DSK7 / T-DSK8 / T-DSK10 视图面）·
 * `thincoder-desktop/test/views-onboarding.test.mjs`（T-DSK13 视图面）。
 */
import assert from "node:assert/strict"
import { initDict } from "../renderer/i18n.mjs"
import { INFO_SLOT, SETTINGS_SLOT, attachSettings } from "../renderer/mount-settings.mjs"
import { createStore, initialState } from "../renderer/store.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 树遍历（深度优先**后序** —— 先子后父 · sibling 保序 · `null` 空位不入）：节点集 / 叶文本集共用（同 `views-tabbar` 判据面）。 */
export function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      if (!asText) out.push(child)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

export const nodes = (tree) => walk(tree, false)
export const texts = (tree) => walk(tree, true)

/** 词面哨兵缝（全键代理）：树内文案可判**键面**而非词面，增键即入判据（零硬清单）。
 * **盲区**：代理不知真表 ⇒ 缺键 / 错键同样出 ⟦…⟧；「键齐」（实表含键）归 `views-chrome.test.mjs` U51 扫描面，本档不判。 */
export const sentinel = (key) => `⟦${key}⟧`

export function useSentinels(ctx) {
  initDict({ locale: "en", host: new Proxy({}, { get: (_, key) => sentinel(String(key)) }) })
  ctx.after(() => initDict({}))
}

/** 切片夹具（初态 + 切片覆盖 + **根覆盖** —— 每用例独立引用，零跨例污染）。 */
export const stateOf = (over = {}, root = {}) => ({ ...initialState(), ...root, settings: { ...initialState().settings, ...over } })

export const slotOf = (selector) => /^\[data-slot="([^"]+)"\]$/.exec(selector)[1]

/** 槽面 / 元素面最小缝（假面只收属性形选择器 ⇒ 按真语义补三片；表外仍抛 —— 不静默给空）。 */
export function installSeam(fake) {
  const slots = new Map()
  fake.document.querySelector = (selector) => {
    const text = String(selector)
    const scoped = /^\[data-slot="([^"]+)"\]\s+select\[name="([^"]+)"\]$/.exec(text)
    const only = /^\[data-slot="([^"]+)"\]$/.exec(text)
    if (scoped === null && only === null) throw new Error(`seam: 表外选择器 ${text}（假面不静默给空）`)
    const root = slots.get((scoped ?? only)[1])
    if (root === undefined) return null
    return scoped === null ? root : root.querySelectorAll(`[name="${scoped[2]}"]`).find((node) => node.tag === "select") ?? null
  }
  const proto = Object.getPrototypeOf(fake.element())
  const def = (name, descriptor) => Object.defineProperty(proto, name, { configurable: true, ...descriptor })
  def("closest", {
    value: function closest(selector) {
      if (String(selector) !== "form") throw new Error(`seam: 表外 closest 选择器 ${selector}`)
      for (let node = this; node !== null && node !== undefined; node = node.parent) if (node.tag === "form") return node
      return null
    },
  })
  def("value", {
    get() {
      if (Object.hasOwn(this, "_value")) return String(this._value)
      if (this.tag !== "select") return String(this.attrs.get("value") ?? "")
      const picked = this.children.find((kid) => kid.tag === "option" && kid.attrs.has("selected"))
        ?? this.children.find((kid) => kid.tag === "option")
      return picked === undefined ? "" : String(picked.attrs.get("value") ?? "")
    },
    set(value) { Object.defineProperty(this, "_value", { value: String(value), writable: true, configurable: true }) },
  })
  /** 控件型面（真 DOM `input.type` 语汇 —— 属性面同源；「对齐第三批」P14 控型三值消费点）。 */
  def("type", {
    get() { return String(this.attrs.get("type") ?? "") },
  })
  /** 勾选态面（真 DOM `checked` 语汇：属性面 = 初值 · 写入 = 活态覆盖 —— 非独立存储）。 */
  def("checked", {
    get() { return Object.hasOwn(this, "_checked") ? this._checked === true : this.attrs.has("checked") },
    set(value) { Object.defineProperty(this, "_checked", { value: value === true, writable: true, configurable: true }) },
  })
  return {
    slot(name, tag = "section") {
      const node = fake.element(tag)
      node.setAttribute("data-slot", name)
      slots.set(name, node)
      return node
    },
  }
}

/** 提交端 `FormData(form)` 替身（真载体在假 DOM 外；只补读面 —— 表单惯例：勾选才携、select 取现选）。 */
export class FormDataStub {
  constructor(form) {
    this.entries = new Map()
    for (const node of form.querySelectorAll("[name]")) {
      if (node.attrs.get("type") === "checkbox" && !node.attrs.has("checked")) continue
      this.entries.set(node.attrs.get("name"), String(node.value))
    }
  }
  get(name) { return this.entries.has(String(name)) ? this.entries.get(String(name)) : null }
}

/** 窄桥替身：回执可编程（`answer(channel, payload)`）+ 调用录（**调用形** = 载荷面机检 —— 一参 = 零载荷）。 */
export function bridge(answer) {
  const calls = []
  return {
    calls,
    call: (channel) => calls.filter(([name]) => name === channel),
    invoke: (channel, payload) => {
      calls.push(payload === undefined ? [channel] : [channel, payload])
      return Promise.resolve(answer(channel, payload))
    },
  }
}

/** 设置面供给夹（`held` 可变片 = 写通道后重读面随动 —— 写 / 移除两回执可各自翻面）。 */
export function supplyFace() {
  const held = {
    rows: [{ name: "p1", model: "m1", effort: "high", hasKey: true, maskedKey: "sk-x", active: true }],
    verify: { ok: true, models: ["a", "b"] },
    save: { ok: true },
    remove: { ok: true },
    servers: [{ name: "fs", kind: "command", summary: "npx fs" }],
    removeMcp: { ok: true },
  }
  const answer = (channel) => {
    if (channel === "provider:list") return { ok: true, presets: [{ name: "openai" }], providers: held.rows, active: held.rows[0]?.name ?? null }
    if (channel === "model:list") return { ok: true, models: [{ id: "m1", effortEnum: ["low", "high"], thinkOff: true }, { id: "m2", effortEnum: ["low"], thinkOff: false }] }
    if (channel === "settings:agent") return { ok: true, fields: [{ path: "agent.maxTurns", kind: "number", value: 12 }, { path: "agent.key", kind: "string", value: "••", sensitive: true }] }
    if (channel === "mcp:list") return { ok: true, servers: held.servers }
    if (channel === "provider:verify") return held.verify
    if (channel === "provider:save" || channel === "mcp:save") return held.save
    if (channel === "provider:remove") return held.remove
    if (channel === "mcp:remove") return held.removeMcp
    return { ok: true }
  }
  return { held, answer }
}

/** 挂载夹具：假面自检 + 两槽 + 桩替身 + 独立 store ⇒ 接线（`over` = 初态补丁 —— 闸 / 占槽面消费；
 *  `deps` = 装配面注入 —— 例 `onProjectOpened`（步 3 目录出口正路）；每例自装环境（`ctx.after` 逐次复原 · 例内不复用面）。
 *  `handle` = `attachSettings` 回值（消费面拿到的接线句柄面 —— 例 `refreshInfo` 复读口）。 */
export async function mountFace(ctx, answer = supplyFace().answer, over = { open: true }, deps = {}) {
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const prior = globalThis.FormData
  globalThis.FormData = FormDataStub
  ctx.after(() => { if (prior === undefined) delete globalThis.FormData; else globalThis.FormData = prior })
  const seam = installSeam(fake)
  useSentinels(ctx)
  const host = bridge(answer)
  const store = createStore(stateOf(over))
  const root = seam.slot(slotOf(SETTINGS_SLOT), "section")
  const info = seam.slot(slotOf(INFO_SLOT), "aside")
  const handle = attachSettings(host, { store, ...deps })
  await new Promise((resolve) => setImmediate(resolve))
  return { fake, host, store, root, info, handle }
}

export const clickOn = (fake, node) => assert.equal(fake.fire(node, "click", { currentTarget: node }), 1, "出口控件真注册")
