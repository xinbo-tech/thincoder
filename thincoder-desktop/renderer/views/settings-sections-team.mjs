/**
 * settings-sections-team.mjs — 设置面「团队」段体（B1 批 · 2026-10-10 · 台账 #1212；新段体自立一档——
 * `views/settings-sections.mjs` re-export ⇒ 分派面零改）。
 *
 * 面形（单源 = `docs/desktop/design/SETTINGS.md` §2.21 ∥ `docs/core/design/TEAM.md` §2.5）：
 *   未登录（`loggedIn` 假）= 表单（服务器地址 ∥ 用户名 ∥ 密码 三字段 + 登录钮）+ 提示行「未登录——登录后可用」；
 *   已登录 = 状态行三读（服务器地址 ∥ 成员 ∥ 端标签）+ 「退出登录」钮；
 *   段内结果行（**当刻一次性**——`team:status` 复读不携提示字段）：登录失败四句（网络不可达 ∥ 用户名或密码错误 ∥
 *   登录尝试过于频繁 ∥ 本机配置写入失败——逐字同句）∥ 同名冲突 ∥ 吊销未达（两句逐字同句）。
 * 草稿保真（#604 口径）：地址 ∥ 用户名携 `data-draft`（重建保真）；**密码恒不保真**（不申报 ⇒ 重建即清空——安全面有意）。
 * 纪律：零 DOM（描述符树）· 文案一律经 `t()`、零字形字面 · 零 `node:` ∕ 零裸包 ∕ 零 `store.mjs` import。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 非空串归一：非串 / 空串 ⇒ `null`（缺值零节点 —— 禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)

/** 成员读数（`member` 切片 `{ username, name }`）：显示名优先、回落用户名；两缺 ⇒ `null`（零假读数）。 */
function memberOf(member) {
  return str(member?.name) ?? str(member?.username)
}

/** 团队失败码 → 词键（**四值闭集**——单源 = `docs/core/design/TEAM.md` §2.5）；表外 ⇒ 原样直传（零吞 —— 沿失败面词表通则）。 */
const TEAM_REASON_WORD = Object.freeze({
  network: "settings.team.reason.network",
  credentials: "settings.team.reason.credentials",
  rate_limited: "settings.team.reason.rateLimited",
  write_failed: "settings.team.reason.writeFailed",
})

/** 段内结果行文字（`notice` 切片三形；缺 ∥ 形不合 ⇒ `null` ⇒ 零节点）：失败句 ∥ 同名冲突 ∥ 吊销未达。 */
function noticeWord(notice) {
  if (notice === null || typeof notice !== "object") return null
  if (notice.kind === "manualConflict") return t("settings.team.notice.manualNameConflict")
  if (notice.kind === "revokeFailed") return t("settings.team.notice.revokeNotDelivered")
  if (notice.kind === "failure") {
    const code = str(notice.reason)
    if (code === null) return null
    return Object.hasOwn(TEAM_REASON_WORD, code) ? t(TEAM_REASON_WORD[code]) : code
  }
  return null
}

/** 结果行（段内就地 —— 当刻一次性事件；`data-team-notice` = 机检锚）。 */
function noticeNode(notice) {
  const word = noticeWord(notice)
  if (word === null) return null
  return { tag: "div", props: { class: "settings-notice", "data-team-notice": notice.kind }, children: [word] }
}

/** 字段两片（标词 + 输入）：`id` ∥ `name` 同源；`draft` 真 ⇒ 携 `data-draft`（#604 捕获域——密码不申报）。 */
function fieldPair(id, name, type, labelWord, value, draft) {
  return [
    { tag: "label", props: { class: "settings-field-label", for: id }, children: [t(labelWord)] },
    { tag: "input", props: { class: "settings-field", id, name, type, ...(draft ? { "data-draft": "" } : {}), value } },
  ]
}

/** 未登录面：登录表单（地址 ∥ 用户名 ∥ 密码 + 登录钮）+ 提示行「未登录——登录后可用」（逐字同句——`TEAM.md` §2.5）。
 *  表单作用域 `data-draft-scope = team`（写成功径失效声明自表单携 —— 单源在视图）。 */
function loginFormNode(section, handlers) {
  const onLogin = typeof handlers?.onTeamLogin === "function" ? handlers.onTeamLogin : undefined
  return [
    {
      tag: "form",
      props: { class: "settings-form", "data-form": "team", "data-draft-scope": "team" },
      children: [
        ...fieldPair("team-server", "server", "text", "settings.team.serverLabel", str(section?.server) ?? "", true),
        ...fieldPair("team-username", "username", "text", "settings.team.usernameLabel", str(section?.member?.username) ?? "", true),
        // 密码恒不保真（#604 口径）：不携 `data-draft` ⇒ 重建即清空（安全面有意）。
        ...fieldPair("team-password", "password", "password", "settings.team.passwordLabel", "", false),
        {
          tag: "button",
          props: wire({ class: "settings-submit", type: "button", "data-action": "settings:teamLogin" }, onLogin),
          children: [t("settings.team.login")],
        },
      ],
    },
    { tag: "div", props: { class: "settings-empty", "data-team-hint": "" }, children: [t("settings.team.loggedOut")] },
  ]
}

/** 状态行读（只读行 —— 名 + 值；值缺 ⇒ 零节点——禁空行）。 */
function statusRowNode(anchor, labelWord, value) {
  if (value === null) return null
  return {
    tag: "div",
    props: { class: "settings-row", "data-read": anchor },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [t(labelWord)] },
      { tag: "span", props: { class: "settings-row-value" }, children: [value] },
    ],
  }
}

/** 已登录面：状态行三读（server ∥ 成员 ∥ 端标签）+ 「退出登录」钮。 */
function statusNode(section, handlers) {
  const onLogout = typeof handlers?.onTeamLogout === "function" ? handlers.onTeamLogout : undefined
  return [
    statusRowNode("team-server", "settings.team.serverLabel", str(section?.server)),
    statusRowNode("team-member", "settings.team.memberLabel", memberOf(section?.member)),
    statusRowNode("team-label", "settings.team.labelLabel", str(section?.label)),
    {
      tag: "button",
      props: wire({ class: "settings-submit", type: "button", "data-action": "settings:teamLogout" }, onLogout),
      children: [t("settings.team.logout")],
    },
  ]
}

/** 团队段体（段态门归分派面：`ready` 才落体——防未读达即落默认值〔假读数〕）：结果行 + 未登录 ∥ 已登录两面。 */
export function teamBody(section, handlers = {}) {
  return [
    noticeNode(section?.notice ?? null),
    ...(section?.loggedIn === true ? statusNode(section, handlers) : loginFormNode(section, handlers)),
  ]
}
