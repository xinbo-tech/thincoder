/**
 * onboarding.mjs — 首启向导面（批 9 · 批档 §2.10 项 3 / §2.14）：`configured === false` 时占设置槽
 * （`docs/desktop/design/UI.md` §1 首启向导行）。
 * 三步（序固定）：① 渠道（预设 select + 密钥 input + 校验控件）② 模型（候选行）③ 项目目录（可跳过）。
 * 步 1 / 2 的表单与候选面**复用 `views/settings.mjs` 导出面**（同一构造 —— 本档零副本）；
 * 步 3 目录选择走 `project:open`（原生对话框，零路径输入）。
 * **零终端可完成**：每步的「下一步」不依赖输入 ⇒ 全流程零动作可走到尾（步 1 保存才写盘）。
 * 退场 = 容器清空（非 `hidden`）**+ 宿主属性应收**（`views/settings.mjs` `syncHostProps` —— 挂载期所加属性复位回路 · 判据 =
 * `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）；退场控件 = **锚名逐字** `settings:close`（锚集合是闭集；会话内
 * `dismissed` 旗归状态树 —— 下次冷启动重进，幂等可重入）。
 * 纪律：零 DOM（唯一构造点 = `dom.mjs` `build`）；文案一律经 `t()`；零 `node:` / 零裸包 /
 * 零 `store.mjs` import（挂载面纯读现态）；**零 Esc 绑定**。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"
import { channelFormTree, reasonWord, settingsModel, syncHostProps, verifyControl } from "./settings.mjs"
import { modelChoicesTree, modelHeadNode } from "./settings-sections.mjs"

/** 步闭集（序固定 = 渠道 → 模型 → 目录）：步号 + 词键单源。 */
export const STEPS = Object.freeze([
  { n: 1, word: "wizard.step.channel" },
  { n: 2, word: "wizard.step.model" },
  { n: 3, word: "wizard.step.dir" },
])

/** 导览模型（纯 · 零 DOM）：占槽判据 + 步 + 两复用面 + 失败串（核错误串直传）。 */
export function wizardModel(state) {
  const settings = state?.settings ?? {}
  const wizard = settings.wizard !== null && typeof settings.wizard === "object" ? settings.wizard : null
  const step = STEPS.some((s) => s.n === wizard?.step) ? wizard.step : 1
  const face = settingsModel(state)
  return {
    active: settings.configured === false && wizard?.dismissed !== true,
    step,
    presets: face.providers.presets,
    model: face.model,
    notice: reasonWord(wizard?.notice),
  }
}

/** 步标行：三步全在场（当前步 = `data-current`，非当前步零节点语义 = 纯词面标记）。 */
function stepsNode(step) {
  return {
    tag: "ol",
    props: { class: "wizard-steps", "data-steps": "" },
    children: STEPS.map((s) => ({
      tag: "li",
      props: { class: "wizard-step", "data-step-mark": s.n, "data-current": s.n === step ? "" : undefined },
      children: [t(s.word)],
    })),
  }
}

/** 步 1 体 = 渠道表单（预设形 · `active:true` 缺省勾选 —— 渠道开箱可用）+ 校验控件。 */
function channelBody(model, handlers) {
  const form = channelFormTree({
    shape: "preset",
    presets: model.presets,
    activeDefault: true,
    submitKey: "wizard.save",
  }, handlers)
  return [form, verifyControl(null, handlers)]
}

/** 步 2 体 = 当前模型读数 + 候选行（复用导出面 —— 与设置面容错形同判）。 */
function modelBody(model, handlers) {
  return [modelHeadNode(model.model), ...modelChoicesTree(model.model, handlers)]
}

/** 步 3 体 = 目录选择控件 + 提示（可跳过 —— 零输入也能走到尾）。 */
function dirBody(handlers) {
  const onPickDir = typeof handlers?.onPickDir === "function" ? handlers.onPickDir : undefined
  return [
    { tag: "div", props: { class: "wizard-hint" }, children: [t("wizard.dir.hint")] },
    {
      tag: "button",
      props: wire({ class: "wizard-submit", type: "button", "data-action": "wizard:pickDir" }, onPickDir),
      children: [t("wizard.dir.pick")],
    },
  ]
}

/** 步体分派（步号闭集；表外步零节点 —— 不猜）。 */
function stepBody(model, handlers) {
  if (model.step === 1) return channelBody(model, handlers)
  if (model.step === 2) return modelBody(model, handlers)
  return dirBody(handlers)
}

/** 尾控件（步 1 / 2 有「下一步」；「完成」恒在场 —— 提前收尾路）——缺 handler ⇒ `wire` 落 `disabled`。 */
function footNode(model, handlers) {
  const onNext = typeof handlers?.onNext === "function" ? handlers.onNext : undefined
  const onFinish = typeof handlers?.onFinish === "function" ? handlers.onFinish : undefined
  const next = model.step < 3
    ? {
      tag: "button",
      props: wire({ class: "wizard-next", type: "button", "data-action": "wizard:next" }, onNext),
      children: [t("wizard.next")],
    }
    : null
  const finish = {
    tag: "button",
    props: wire({ class: "wizard-finish", type: "button", "data-action": "wizard:finish" }, onFinish),
    children: [t("wizard.finish")],
  }
  return { tag: "footer", props: { class: "wizard-foot" }, children: [next, finish] }
}

/** 头：标题 + 退场控件（**锚名逐字** `settings:close`；字形住 `settings.css`）。 */
function headNode(handlers) {
  const onDismiss = typeof handlers?.onDismiss === "function" ? handlers.onDismiss : undefined
  return {
    tag: "header",
    props: { class: "wizard-head" },
    children: [
      { tag: "h2", props: { class: "wizard-title" }, children: [t("wizard.title")] },
      {
        tag: "button",
        props: wire({
          class: "wizard-dismiss",
          type: "button",
          "data-action": "settings:close",
          "aria-label": t("wizard.dismiss"),
        }, onDismiss),
        children: [],
      },
    ],
  }
}

/** 失败面（核错误串直传 —— 表内码出词）：无串 ⇒ 零节点。 */
function noticeNode(notice) {
  if (notice === null) return null
  return { tag: "div", props: { class: "wizard-notice", "data-notice": "" }, children: [notice] }
}

/** 向导树（纯构树 · 零 DOM）：未占槽 ⇒ 零子节点（退场 = 容器清空 —— 非 `hidden`）。 */
export function wizardTree(model, handlers = {}) {
  const active = model?.active === true
  const children = active
    ? [headNode(handlers), stepsNode(model.step), { tag: "div", props: { class: "wizard-body" }, children: stepBody(model, handlers) },
      noticeNode(model.notice), footNode(model, handlers)]
    : []
  return {
    tag: "div",
    props: { "data-onboarding": "", "data-state": active ? "active" : "closed", "data-step": String(model?.step ?? 1), class: "wizard" },
    children,
  }
}

/** 薄挂载：props 应收进宿主（`syncHostProps` —— `data-slot` 等骨架属性保留 + 前任所加属性摘除）+ `clear` + `append`；容器缺位 ⇒ 空转。 */
export function mountWizard(root, state, handlers = {}) {
  const model = wizardModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  const tree = build(wizardTree(model, handlers))
  syncHostProps(root, tree)
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  return model
}
