/**
 * onboarding.mjs — 首启向导面（批 9 · 批档 §2.10 项 3 / §2.14）：`configured === false` 时占设置槽
 * （`docs/desktop/design/UI.md` §1 首启向导行）。
 * **登录面补全批（2026-10-10 · 台账 #1230）四屏**（步界单源 = `docs/desktop/design/SETTINGS.md` §2.6）：
 *   ① **路由屏**（`"route"` —— 第一屏）：两卡并排（团队卡 ∥ 本地卡——标题 + 说明 + 行动钮；**零预选**）
 *      + 「以后再说」钮（挂既有 `dismissWizard` 出口，单一实现）；
 *   ② **团队表单屏**（`"team"` —— 同屏换取，不叠弹层）：三字段（复用段体档 `fieldPair`）+ 登录钮 + 失败/提示行
 *      （复用 `noticeNode`）+ 「← 换一种方式」回路由屏（已填地址 ∥ 用户名保留——`data-draft` 域；密码恒清）；
 *   ③④ **本地三歩**（1 渠道 → 2 模型 → 3 目录 —— 原样，零重构）：点本地卡 = 第一步。
 * 步闭集 = `renderer/store.mjs` `WIZARD_STEPS`（`"route"` ∥ `"team"` ∥ 1–3；**表外值回落 `"route"`**——本档归一）；
 * 路由 / 团队两屏**零步标 ∥ 零尾控件**（步标与「下一步 / 完成」只在本地三歩在场）。
 * **同名冲突一次性提示并入步 2 头行**（`docs/desktop/design/SETTINGS.md` §2.22 项 2 补句——成功径同拍进步 ⇒ 提示不静默；
 * 消费即清 = 离步 2 ∥ 退场 —— 接线路 = `mount-onboarding.mjs`）：步 2 体首件 = 段体档 `teamNoticeNode`（零副本）。
 * 步 1 / 2 的表单与候选面**复用 `views/settings.mjs` 导出面**（同一构造 —— 本档零副本）；
 * 步 3 目录选择走 `project:open`（原生对话框，零路径输入）。
 * **零终端可完成**：每步的「下一步」不依赖输入 ⇒ 全流程零动作可走到尾（步 1 保存才写盘）。
 * 退场 = 容器清空（非 `hidden`）**+ 宿主属性应收**（`views/settings.mjs` `syncHostProps` —— 挂载期所加属性复位回路 · 判据 =
 * `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）；退场控件 = **锚名逐字** `settings:close`（锚集合是闭集；会话内
 * `dismissed` 旗归状态树 —— 下次冷启动重进，幂等可重入）。
 * 纪律：零 DOM（唯一构造点 = `dom.mjs` `build`）；文案一律经 `t()`；零 `node:` / 零裸包；
 * 零 `store.mjs` **状态读**（纯读现态 —— 仅取常量面 `WIZARD_STEPS`，沿 `views/statusline.mjs` 取 `deriveTabBadge` 先例）；
 * **零 Esc 绑定**。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { WIZARD_STEPS } from "../store.mjs"
import { wire } from "./chat-tool.mjs"
import { channelFormTree, reasonWord, settingsModel, syncHostProps, verifyControl } from "./settings.mjs"
import { modelChoicesTree, modelHeadNode } from "./settings-sections.mjs"
// 段体两导出面（单一 owner = `views/settings-sections-team.mjs`）：三字段 ∥ 结果行 —— 团队表单零副本。
import { fieldPair, noticeNode as teamNoticeNode } from "./settings-sections-team.mjs"

/** 路由屏步值（第一屏）；表外值回落本值（归一在 `wizardModel`）。 */
export const ROUTE_STEP = "route"
/** 团队表单屏步值（同屏换取 —— 路由屏团队卡选取后）。 */
export const TEAM_STEP = "team"

/** 本地三歩（序固定 = 渠道 → 模型 → 目录）：步号 + 词键单源。 */
export const STEPS = Object.freeze([
  { n: 1, word: "wizard.step.channel" },
  { n: 2, word: "wizard.step.model" },
  { n: 3, word: "wizard.step.dir" },
])

/** 导览模型（纯 · 零 DOM）：占槽判据 + 步（闭集归一——表外 ⇒ 路由屏）+ 两复用面 + 团队表单读数 + 失败串。
 *  `team` = 段体投影（`settingsModel` 同源 —— server ∥ member ∥ notice 供团队表单预填与就地提示）。 */
export function wizardModel(state) {
  const settings = state?.settings ?? {}
  const wizard = settings.wizard !== null && typeof settings.wizard === "object" ? settings.wizard : null
  const step = WIZARD_STEPS.includes(wizard?.step) ? wizard.step : ROUTE_STEP
  const face = settingsModel(state)
  return {
    active: settings.configured === false && wizard?.dismissed !== true,
    step,
    presets: face.providers.presets,
    model: face.model,
    team: face.team,
    notice: reasonWord(wizard?.notice),
  }
}

/** 步标行（本地三歩全在场；当前步 = `data-current`，非当前步零节点语义 = 纯词面标记）——路由 / 团队两屏零步标。 */
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

/** 路由屏两卡（**零预选**；用户 2026-10-10 14:49 裁定 —— 图形端两卡并排）：卡 = 标题 + 说明 + 行动钮；
 *  卡锚 = `[data-route-card]` ∥ 行动钮锚 = `[data-route]`（团队 ∥ 本地——`wire` 缺 handler ⇒ `disabled`）。
 *  团队卡钮词复用 `settings.team.login`（词面零再造）。 */
function routeCards(handlers) {
  const onChoose = typeof handlers?.onChooseRoute === "function" ? handlers.onChooseRoute : undefined
  const card = (route, titleWord, descWord, actionWord) => ({
    tag: "div",
    props: { class: "wizard-route", "data-route-card": route },
    children: [
      { tag: "h3", props: { class: "wizard-route-title" }, children: [t(titleWord)] },
      { tag: "p", props: { class: "wizard-route-desc" }, children: [t(descWord)] },
      {
        tag: "button",
        props: wire({
          class: "settings-submit",
          type: "button",
          "data-route": route,
        }, onChoose === undefined ? undefined : () => onChoose(route)),
        children: [t(actionWord)],
      },
    ],
  })
  return [
    card(TEAM_STEP, "wizard.route.teamTitle", "wizard.route.teamDesc", "settings.team.login"),
    card("local", "wizard.route.localTitle", "wizard.route.localDesc", "wizard.route.localAction"),
  ]
}

/** 路由屏体 = 两卡（`div.wizard-routes`）+ 「以后再说」钮（锚 `[data-wizard-later]` —— 既有退场旗出口，单一实现）。 */
function routeBody(handlers) {
  const onLater = typeof handlers?.onDismiss === "function" ? handlers.onDismiss : undefined
  return [
    { tag: "div", props: { class: "wizard-routes" }, children: routeCards(handlers) },
    {
      tag: "button",
      props: wire({ class: "settings-submit", type: "button", "data-wizard-later": "" }, onLater),
      children: [t("wizard.later")],
    },
  ]
}

/** 团队表单屏体（同屏换取）：三字段（复用 `fieldPair` —— 地址 ∥ 用户名携 `data-draft`（回退保真）· 密码恒不保真）
 *  + 登录钮；结果行（复用 `noticeNode` —— 四失败句 ∥ 同名冲突逐字同）+ 「← 换一种方式」（`wizard:backToRoute`）。 */
function teamRouteBody(model, handlers) {
  const onLogin = typeof handlers?.onTeamLogin === "function" ? handlers.onTeamLogin : undefined
  const onBack = typeof handlers?.onBackToRoute === "function" ? handlers.onBackToRoute : undefined
  const team = model.team ?? {}
  return [
    {
      tag: "form",
      props: { class: "settings-form", "data-form": "wizard-team", "data-draft-scope": "wizard-team" },
      children: [
        ...fieldPair("wizard-team-server", "server", "text", "settings.team.serverLabel", team.server ?? "", true),
        ...fieldPair("wizard-team-username", "username", "text", "settings.team.usernameLabel", team.member?.username ?? "", true),
        ...fieldPair("wizard-team-password", "password", "password", "settings.team.passwordLabel", "", false),
        {
          tag: "button",
          props: wire({ class: "settings-submit", type: "button", "data-action": "wizard:teamLogin" }, onLogin),
          children: [t("settings.team.login")],
        },
      ],
    },
    teamNoticeNode(team.notice ?? null),
    {
      tag: "button",
      props: wire({ class: "settings-submit", type: "button", "data-action": "wizard:backToRoute" }, onBack),
      children: [t("wizard.backToRoute")],
    },
  ]
}

/** 步 1 体 = 渠道表单（预设形——**2026-10-09 清除批 fix 轮**：激活渠 `active` 复选 ∥ 其条件参随同退场
 *  〔无 active 写路 ⇒ 死控——件 ∥ 参双净删；等价路径 = 模型段「采用」〕）+ 校验控件。 */
function channelBody(model, handlers) {
  const form = channelFormTree({
    shape: "preset",
    presets: model.presets,
    submitKey: "wizard.save",
  }, handlers)
  return [form, verifyControl(null, handlers)]
}

/** 步 2 体 = **团队一次性提示头行**（登录面补全批——同名冲突：成功径同拍进步 ⇒ 并入本屏头行，判据单源 =
 *  `docs/desktop/design/SETTINGS.md` §2.22 项 2 补句；复用段体档 `teamNoticeNode` ⇒ 逐字同句零副本）+ 当前模型读数 + 候选行
 *  （复用导出面 —— 与设置面容错形同判）。 */
function modelBody(model, handlers) {
  return [teamNoticeNode(model.team?.notice ?? null), modelHeadNode(model.model), ...modelChoicesTree(model.model, handlers)]
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

/** 步体分派（步闭集 = `WIZARD_STEPS`；表外步零节点 —— 不猜）。 */
function stepBody(model, handlers) {
  if (model.step === ROUTE_STEP) return routeBody(handlers)
  if (model.step === TEAM_STEP) return teamRouteBody(model, handlers)
  if (model.step === 1) return channelBody(model, handlers)
  if (model.step === 2) return modelBody(model, handlers)
  return dirBody(handlers)
}

/** 尾控件（步 1 / 2 有「下一步」；「完成」恒在场 —— 提前收尾路）——缺 handler ⇒ `wire` 落 `disabled`。
 *  **只在本地三歩渲染**（路由 / 团队两屏零尾控件：推进 = 卡选取 ∥ 登录成）。 */
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

/** 向导树（纯构树 · 零 DOM）：未占槽 ⇒ 零子节点（退场 = 容器清空 —— 非 `hidden`）。
 *  路由 / 团队两屏（`step` 非数）零步标 ∥ 零尾控件；本地三歩照旧（步标 + 尾控件在场）。 */
export function wizardTree(model, handlers = {}) {
  const active = model?.active === true
  const stepped = typeof model?.step === "number"
  const children = active
    ? [
      headNode(handlers),
      ...(stepped ? [stepsNode(model.step)] : []),
      { tag: "div", props: { class: "wizard-body" }, children: stepBody(model, handlers) },
      noticeNode(model.notice),
      ...(stepped ? [footNode(model, handlers)] : []),
    ]
    : []
  return {
    tag: "div",
    props: { "data-onboarding": "", "data-state": active ? "active" : "closed", "data-step": String(model?.step ?? ROUTE_STEP), class: "wizard" },
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
