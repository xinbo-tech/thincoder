/**
 * views-auth.mjs — 登录视图（webui/WEBUI.md §2：`#/login`——无侧栏，登录卡；自 views.mjs 拆档）。
 *
 * 判权全在后端（本档只做表单）；渲染一律节点 + textContent（无 HTML 串拼接）；凭据类 401 由 app.fail 收口
 * （住原视图展示服务端文案——不误报会话过期）。文案经 `t()` 取值（§2.2）；卡内一行 = 语言切换器（未登录可切）。
 */
import { t, langSwitch } from "./i18n.mjs"

/** 登录：提交成功 ⇒ 刷新会话态（额度/keys）⇒ 根路径（app 路由收口到角色默认页）。 */
export function renderLogin(ctx, mount) {
  const { h } = ctx
  const username = h("input", { required: true, autocomplete: "username" })
  const password = h("input", { type: "password", required: true, autocomplete: "current-password" })
  const form = h("form", { class: "card stack" },
    h("h2", { text: t("login.title") }),
    h("label", {}, t("login.username"), username),
    h("label", {}, t("login.password"), password),
    h("button", { type: "submit", text: t("login.submit") }),
    h("div", { class: "lang-switch-row" }, langSwitch(h, ctx.onChange)), // 登录卡切换行（无侧栏面——未登录可切）
  )
  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    try {
      const done = await ctx.api("/api/login", { method: "POST", body: { username: username.value.trim(), password: password.value } })
      ctx.state.member = done.member
      await ctx.refresh() // 取全量本人信息（额度 ∥ 已用 ∥ key 清单）
      ctx.navigate("/") // 根 ⇒ 角色默认页（resolveRoute 收口——admin 组页 ∥ 我的 keys）
    } catch (error) { ctx.fail(error) }
  })
  mount.append(form)
}
