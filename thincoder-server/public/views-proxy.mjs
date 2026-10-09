/**
 * views-proxy.mjs — 代理页（webui/WEBUI.md §2.7——`#/admin/proxy` 仅 admin；KD-SV-60 · 台账 #1158）：
 * 卡一「代理设置」（`proxy.uri` 单输入 + 保存 ⇒ `PATCH /api/admin/config { proxyUri }`——所见即所存；`""` ⇒ 删段）∥
 * 卡二「连通测试」（目标可填 + 预填首个 provider `baseURL`；测试 ⇒ `POST /api/admin/proxy/test`——**真打**：
 * uri = 表单当前值（所见即所测——未保存亦可先验）；读数 = 状态 + 耗时 ∥ 失败就地错态）。
 *
 * 值渲染 = 文件面（`GET /api/admin/config` 的 `proxyUri`——有效值；空 = 不启用）；读档失败 ⇒ 就地错态；
 * 目标预填 = `GET /api/admin/providers` 库序首条（零 provider ∥ 取数失败 ⇒ 空输入，用户自填——不报错）；
 * 排版 = `provider-form stacked`（竖排——沿 2026-10-09 走查收正口径）；渲染沿 `h`/`textContent`（零拼串）；
 * 文案经 `t()` 取值（§2.2）；零 CJK（注释外）。
 */
import { mapError, t } from "./i18n.mjs"

/** 诊断 kind ⇒ 文案键（二分类——gateway/API.md §2.4；枚举外 ⇒ 原值兜底）。 */
const KIND_KEYS = { timeout: "proxy.kind.timeout", unreachable: "proxy.kind.unreachable" }
const kindLabel = (kind) => (KIND_KEYS[kind] ? t(KIND_KEYS[kind]) : String(kind ?? ""))

/** 页装配（两卡：代理设置 ∥ 连通测试；`uriInput` = 两卡共用草稿——测试按表单当前值真打）。 */
export function renderProxy(ctx, mount) {
  const { h } = ctx
  const uriInput = h("input", { placeholder: t("proxy.uriPh") }) // 卡一控件；卡二「所见即所测」读取面
  mount.append(h("h2", { text: t("proxy.title") }))
  mount.append(settingsCard(ctx, uriInput))
  mount.append(testCard(ctx, uriInput))
}

/** 卡一「代理设置」：取数在途 ⇒ 加载行；成功 ⇒ 卡体（值 = 文件面 `proxyUri`）；读档失败 ⇒ 就地错态。 */
function settingsCard(ctx, uriInput) {
  const { h } = ctx
  const box = h("section", { class: "card" }, h("p", { class: "hint", text: t("common.loading") }))
  ctx.api("/api/admin/config").then((data) => {
    uriInput.value = data?.config?.proxyUri ?? ""
    box.replaceChildren(...settingsBody(ctx, uriInput))
  }).catch((error) => {
    ctx.fail(error)
    box.replaceChildren(
      h("h3", { text: t("proxy.settingsTitle") }),
      h("p", { class: "hint error", text: t("system.cfgLoadFailed") }))
  })
  return box
}

/** 卡一体：单输入 + 保存（`PATCH /api/admin/config { proxyUri }`——所见即所存）∥ 范围句 ∥ 重启注 ∥ 卡内错态。 */
function settingsBody(ctx, uriInput) {
  const { h } = ctx
  const saveNote = h("p", { class: "hint error", hidden: true })
  const save = async (event) => {
    event.preventDefault()
    saveNote.hidden = true
    try {
      await ctx.api("/api/admin/config", { method: "PATCH", body: { proxyUri: uriInput.value.trim() } })
      ctx.flash(t("system.cfgSaved"))
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      saveNote.textContent = mapError(error)
      saveNote.hidden = false
    }
  }
  return [
    h("h3", { text: t("proxy.settingsTitle") }),
    h("p", { class: "hint", text: t("proxy.hint") }),
    h("form", { class: "provider-form stacked", novalidate: true, onsubmit: save },
      h("label", {}, h("span", { text: t("proxy.uriLabel") }), uriInput),
      h("button", { type: "submit", text: t("common.save") })),
    h("p", { class: "hint", text: t("system.cfgRestartNote") }),
    saveNote,
  ]
}

/** 卡二「连通测试」：目标可填（预填首个 provider `baseURL`）+ 测试钮 + 读数行。
 *  真打 = `POST /api/admin/proxy/test`（体 `{ uri, target }` 双必传——uri = 卡一表单当前值）；空 uri ∥ 空目标 ⇒
 *  前端先行提示（不提交）；在飞 = 「测试中……」静态 hint + 钮禁用（KD-SV-46 口径）。 */
function testCard(ctx, uriInput) {
  const { h } = ctx
  const targetInput = h("input", { placeholder: t("proxy.targetPh") })
  const result = h("p", { class: "hint" })
  const submit = h("button", { type: "submit", text: t("proxy.testBtn") })

  const run = async (event) => {
    event.preventDefault()
    const uri = uriInput.value.trim()
    const target = targetInput.value.trim()
    if (uri === "") { result.className = "hint error"; result.textContent = t("proxy.uriRequired"); return } // 空 = 就地拒（不回落已存配置）
    if (target === "") { result.className = "hint error"; result.textContent = t("proxy.targetRequired"); return } // 前端先行（不提交）
    submit.disabled = true
    result.className = "hint"
    result.textContent = t("proxy.testing")
    try {
      const data = await ctx.api("/api/admin/proxy/test", { method: "POST", body: { uri, target } })
      if (data?.ok) {
        result.className = "hint"
        result.textContent = t("proxy.testOk", { status: data.status, ms: data.ms })
      } else {
        result.className = "hint error" // ⑨ 就地错态（WEBUI §2.5）
        result.textContent = t("proxy.testFail", { kind: kindLabel(data?.error?.kind), message: data?.error?.message ?? "" })
      }
    } catch (error) {
      ctx.fail(error)
      result.className = "hint"
      result.textContent = ""
    } finally {
      submit.disabled = false
    }
  }

  // 目标缺省预填（首个 provider `baseURL`——库序；零 provider ∥ 取数失败 ⇒ 空输入，用户自填——不报错）
  ctx.api("/api/admin/providers").then((data) => {
    const first = data?.providers?.[0]?.baseURL
    if (typeof first === "string" && first !== "") targetInput.value = first
  }).catch(() => { /* 预填取数失败 ⇒ 空输入（用户自填——不反噬页面） */ })

  return h("section", { class: "card" },
    h("h3", { text: t("proxy.testTitle") }),
    h("p", { class: "hint", text: t("proxy.testHint") }),
    h("form", { class: "provider-form stacked", novalidate: true, onsubmit: run },
      h("label", {}, h("span", { text: t("proxy.targetLabel") }), targetInput),
      submit),
    result)
}
