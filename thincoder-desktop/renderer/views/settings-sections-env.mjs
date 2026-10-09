/**
 * settings-sections-env.mjs — 设置面「Environment」段体（R7 · 桌面功能对位批 · 批档 §2 R7 #2/#1；**先拆后改**：
 * 段体自立 —— 自 `renderer/views/settings-sections.mjs` 命名面出档）。
 *
 * 面形（源 = VSC `webview/settings-env.js`（195）：proxy 卡 + shell 卡；桌面成语 = 描述符树 + 原生控件）：
 *  ① proxy 子节 —— uri 输入（change-to-save：屏值 ≠ 切片现值才发；发值 = 单字段 `{ proxy: { <field> } }`）·
 *     web 复选（同律）+ Test Connection 钮 + 结果行（三态：未测 ∕ ✓ ∕ ✗）；
 *  ② shell 子节 —— 候选 `select`（「System default」= 空值项；回显表达式逐字沿 VSC `shellEchoState`：
 *     现值命中候选 ⇒ 选中该项 + 自定义框空 ∕ 不命中 ⇒ 选中哨兵 `__custom__` + 自定义框 = 现值）+
 *     自定义路径输入（空值 = 未完成输入 ⇒ **零发送**，沿 VSC 路径册 #3）。
 * 三态：`none` / `loading` ⇒ 段态词承载（本档零节点）；`ready` ⇒ 上述面。
 * **#604 增**：shell 自定义路径输入携 `data-draft`（总闸捕获域 —— 「未完成输入」先例；proxy 族与
 * shell `select` ＝即改即存控件 ⇒ 不入域（负向锁面 —— 批档 §2.2 判据 M-604b ∕ M-604c））。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ 控件 `disabled`（诚实非死控）；
 * 零 `node:` ∕ 零裸包。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 自定义哨兵（VSC `settings-env.js:33` 同值 —— 切换输入意图，非写意图）。 */
const CUSTOM_SENTINEL = "__custom__"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 控件两态：handler 给 ⇒ `onChange` 闭包；缺 ⇒ `disabled`（诚实非死控 —— 沿段内先例）。 */
function changeProps(base, handler) {
  return typeof handler === "function" ? { ...base, onChange: handler } : { ...base, disabled: true }
}

/** 选项节点：值 = `option.value`（`null` 值候选 ⇒ 空串 —— DOM 值域），选中判据由调用面给。 */
function optionNode(candidate, selected) {
  const value = candidate?.value ?? ""
  return {
    tag: "option",
    props: selected ? { value, selected: true } : { value },
    children: [typeof candidate?.name === "string" ? candidate.name : String(value)],
  }
}

/** Test 结果行词面（四态闭集：未测 ⇒ `—` · 探期 ⇒ 「测试中…」· ✓ 携 status · ✗ 携 status ∥ error 串直传）。 */
function testWord(test) {
  const state = typeof test?.state === "string" ? test.state : null
  if (state === "running") return t("settings.proxyTestRunning")
  if (state === "ok") return t("settings.proxyTestOk", { status: Number.isFinite(test.status) ? test.status : "" })
  if (state === "fail") return Number.isFinite(test.status)
    ? t("settings.proxyTestFailStatus", { status: test.status })
    : t("settings.proxyTestFail", { reason: typeof test.error === "string" && test.error !== "" ? test.error : "" })
  return t("settings.noneMark")
}

/** env 段体（proxy 子节 + shell 子节）：`section = { proxy, shell, test }`（面模型投影 —— 渲染面零推导）。 */
export function envBody(section, handlers = {}) {
  const proxy = section?.proxy ?? { uri: "", web: true }
  const candidates = listOf(section?.shell?.candidates).filter((c) => c && typeof c.name === "string")
  const current = typeof section?.shell?.current === "string" && section.shell.current !== "" ? section.shell.current : null
  const matched = candidates.find((c) => (c.value ?? null) === current) ?? null
  const isCustom = current !== null && matched === null
  const onProxy = (field, valueOf) => (typeof handlers?.onProxyField === "function"
    ? (event) => handlers.onProxyField(field, valueOf(event))
    : undefined)
  const onTest = typeof handlers?.onTestProxy === "function" ? () => handlers.onTestProxy() : undefined
  const onShellSelect = typeof handlers?.onShellSelect === "function"
    ? (event) => handlers.onShellSelect(String(event?.target?.value ?? ""))
    : undefined
  const onShellCustom = typeof handlers?.onShellCustom === "function"
    ? (event) => handlers.onShellCustom(String(event?.target?.value ?? ""))
    : undefined
  return [
    { tag: "div", props: { class: "settings-field-label", "data-subtitle": "proxy" }, children: [t("settings.proxySection")] },
    {
      tag: "div",
      props: { class: "settings-field-row", "data-field": "proxy.uri" },
      children: [
        { tag: "label", props: { class: "settings-field-label", for: "proxy-uri" }, children: [t("settings.proxyUri")] },
        { tag: "input", props: changeProps({ class: "settings-field", id: "proxy-uri", name: "proxy.uri", type: "text", value: proxy.uri }, onProxy("uri", (e) => String(e?.target?.value ?? "").trim())) },
      ],
    },
    {
      tag: "div",
      props: { class: "settings-field-row", "data-field": "proxy.web" },
      children: [
        { tag: "input", props: changeProps({ class: "settings-field", id: "proxy-web", name: "proxy.web", type: "checkbox", checked: proxy.web === true ? true : undefined }, onProxy("web", (e) => e?.target?.checked === true)) },
        { tag: "label", props: { class: "settings-field-label", for: "proxy-web" }, children: [t("settings.proxyWeb")] },
      ],
    },
    {
      tag: "div",
      props: { class: "settings-row", "data-proxy-test": "" },
      children: [
        {
          tag: "button",
          props: wire({ class: "settings-row-action", type: "button", "data-action": "settings:testProxy" }, onTest),
          children: [t("settings.proxyTest")],
        },
        { tag: "span", props: { class: "settings-row-value", "data-proxy-test-result": "" }, children: [testWord(section?.test ?? null)] },
      ],
    },
    { tag: "div", props: { class: "settings-field-label", "data-subtitle": "shell" }, children: [t("settings.shellSection")] },
    {
      tag: "div",
      props: { class: "settings-field-row", "data-field": "shell.select" },
      children: [
        { tag: "label", props: { class: "settings-field-label", for: "shell-select" }, children: [t("settings.shellSelect")] },
        {
          tag: "select",
          props: changeProps({ class: "settings-field", id: "shell-select", name: "shell.select" }, onShellSelect),
          children: [
            ...candidates.map((c) => optionNode(
              c,
              // `current` 命中请求：VSC 回显表达式同式 —— 非自定义态下 `(value ?? null) === current`（含 null 对 null）。
              isCustom ? false : (c.value ?? null) === current,
            )),
            { tag: "option", props: isCustom ? { value: CUSTOM_SENTINEL, selected: true } : { value: CUSTOM_SENTINEL }, children: [t("settings.shellCustom")] },
          ],
        },
      ],
    },
    {
      tag: "div",
      props: { class: "settings-field-row", "data-field": "shell.path" },
      children: [
        { tag: "label", props: { class: "settings-field-label", for: "shell-path" }, children: [t("settings.shellPath")] },
        // `data-draft` = 草稿申报标记（#604 总闸捕获域 —— 自定义路径＝未完成输入先例；`id` 键 = `shell-path`）。
        { tag: "input", props: changeProps({ class: "settings-field", id: "shell-path", name: "shell.path", type: "text", "data-draft": "", "data-draft-scope": "env:shell", value: isCustom ? current : "" }, onShellCustom) },
      ],
    },
  ]
}
