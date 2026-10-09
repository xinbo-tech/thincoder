/**
 * views-system-config.mjs — 系统页「服务配置」卡（webui/WEBUI.md §2/§2.1——`#/admin/system` 五节之四）：只读三行
 * （`host` ∥ `port` ∥ `db`——部署拓扑项；定则「任何配置项必须有配置界面」之例外显式说明）∥ 可写四项（`autoUpdate`
 * ∥ `trustProxy` ∥ `usageRetentionDays` ∥ `proxy.uri`）∥ 指针行（`providers` ∥ `bootstrap`——各归其面）∥
 * 保存 = `PATCH /api/admin/config`（可写四项提交——所见即所存）⇒ flash「已保存——重启服务后生效」；
 * 非法 ⇒ 就地提示（前端先行（保留天数）= 自校 ∥ 服务端复核 400——`mapError` 落卡内）。
 *
 * 值渲染 = 文件面（`GET /api/admin/config`——**有效值**（在场值 ∥ 缺省回填）；读档失败 ⇒ 就地错态）；
 * 全部可写项统一标「重启生效」（配置文件不热载——`ops/OPS.md` §1 KD-SV-56）。渲染沿 `h`/`textContent`
 * （零拼串）；文案经 `t()` 取值（§2.2）；零 CJK（注释外）。批内件直测面 = `systemConfigSection`（取数注入 + 保存往返）。
 */
import { mapError, t } from "./i18n.mjs"

/** 档位 select 值形 ⇒ 配置值（`false` 无 DOM 值形——`"off"` 中转）。 */
const MODE_VALUES = { off: false, notify: "notify", auto: "auto" }
const modeOption = (mode) => (mode === false ? "off" : String(mode))

/** 「服务配置」卡（返回节点——取数在途 ⇒ 先落加载行；成功 ⇒ 卡体就位 ∥ 读档失败 ⇒ 就地错态）。 */
export function systemConfigSection(ctx) {
  const { h } = ctx
  const box = h("section", { class: "card" }, h("p", { class: "hint", text: t("common.loading") }))
  ctx.api("/api/admin/config").then((data) => {
    box.replaceChildren(...configCard(ctx, data?.config ?? {}))
  }).catch((error) => {
    ctx.fail(error)
    box.replaceChildren(
      h("h3", { text: t("system.configTitle") }),
      h("p", { class: "hint error", text: t("system.cfgLoadFailed") }))
  })
  return box
}

/** 卡体：只读表（+ 拓扑注）∥ 可写表单（四项——所见即所存）∥ 生效统一注 ∥ 指针行表。 */
function configCard(ctx, config) {
  const { h } = ctx
  const autoSelect = h("select", {},
    h("option", { value: "off", text: t("system.cfgAutoUpdateOff") }),
    h("option", { value: "notify", text: t("system.cfgAutoUpdateNotify") }),
    h("option", { value: "auto", text: t("system.cfgAutoUpdateAuto") }))
  autoSelect.value = modeOption(config.autoUpdate)
  const trustBox = h("input", { type: "checkbox", checked: config.trustProxy === true })
  const unlimitedBox = h("input", { type: "checkbox", checked: config.usageRetentionDays === null })
  const daysInput = h("input", { type: "number", min: "1", step: "1", value: config.usageRetentionDays === null ? "" : String(config.usageRetentionDays) })
  const proxyInput = h("input", { placeholder: t("system.cfgProxyUriPh"), value: config.proxyUri ?? "" })
  const invalidHint = h("span", { class: "hint error", hidden: true })
  const saveNote = h("p", { class: "hint error", hidden: true })

  daysInput.disabled = unlimitedBox.checked // 「不限」勾 ⇒ 天数输入退场
  unlimitedBox.addEventListener("change", () => { daysInput.disabled = unlimitedBox.checked })

  /** 保存（可写四项提交——所见即所存）：保留天数 = 前端先行自校（非法 ⇒ 就地提示不提交）；失败 ⇒ 卡内提示。 */
  const save = async (event) => {
    event.preventDefault()
    invalidHint.hidden = true
    saveNote.hidden = true
    let days = null
    if (!unlimitedBox.checked) {
      days = Number(daysInput.value.trim())
      if (!Number.isInteger(days) || days < 1) {
        invalidHint.textContent = t("system.cfgRetentionInvalid")
        invalidHint.hidden = false
        daysInput.focus()
        return
      }
    }
    const body = {
      autoUpdate: MODE_VALUES[autoSelect.value],
      trustProxy: trustBox.checked,
      usageRetentionDays: days,
      proxyUri: proxyInput.value.trim(),
    }
    try {
      await ctx.api("/api/admin/config", { method: "PATCH", body })
      ctx.flash(t("system.cfgSaved"))
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      saveNote.textContent = mapError(error)
      saveNote.hidden = false
    }
  }

  return [
    h("h3", { text: t("system.configTitle") }),
    h("p", { class: "hint", text: t("system.configHint") }),
    ctx.table([t("col.item"), t("col.value")], [
      [t("system.cfgHost"), ctx.fmtValue(config.host)],
      [t("system.cfgPort"), ctx.fmtValue(config.port)],
      [t("system.cfgDb"), ctx.fmtValue(config.db)],
    ]),
    h("p", { class: "hint", text: t("system.cfgTopologyNote") }),
    h("form", { class: "provider-form", novalidate: true, onsubmit: save },
      h("label", {}, h("span", { text: t("system.cfgAutoUpdate") }), autoSelect),
      h("label", { class: "key-clear" }, trustBox, t("system.cfgTrustProxy")),
      h("label", {}, h("span", { text: t("system.cfgRetention") }), daysInput, invalidHint),
      h("label", { class: "key-clear" }, unlimitedBox, t("system.cfgRetentionUnlimited")),
      h("label", {}, h("span", { text: t("system.cfgProxyUri") }), proxyInput),
      h("button", { type: "submit", text: t("common.save") })),
    h("p", { class: "hint", text: t("system.cfgRestartNote") }),
    saveNote,
    ctx.table([t("col.item"), t("col.value")], [
      [t("system.cfgProvidersRow"), t("system.cfgProvidersValue")],
      [t("system.cfgBootstrapRow"), t("system.cfgBootstrapValue")],
    ]),
  ]
}
