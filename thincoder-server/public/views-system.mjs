/**
 * views-system.mjs — 系统页（webui/WEBUI.md §2/§2.1：`#/admin/system`——仅 admin）：版本与更新 ∥ 成员接入两节。
 *
 * 数据 = `ctx.state.system`（`GET /api/system`——app.mjs 装配取一次；失败 ⇒ 留空静默，本节以「—」形呈现）；
 * 更新提示口径 = 见下（`latest` 在场 ⇒ 提示；不在场 ⇒ 「未发现新版本」——自检失败同面，`gateway/API.md` §2.3）。
 * 接入卡 = admin 面（供分发给成员）；成员面成文 = README「成员接入」节。渲染沿 `h`/`textContent`（零拼串）；
 * baseURL = 运行时 origin（`location.origin` + `/v1`——零硬编码，反代/改端口自动随动）；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"

/** 代码样例行（`pre > code`——textContent 直落）。 */
const snippet = (h, text) => h("pre", { class: "snippet" }, h("code", { text }))

/** 节「版本与更新」：当前版本 ∥ `mode` ∥ `lastCheckAt`（本地化；`null` = 未检）∥ 更新提示。 */
function versionSection(ctx, system) {
  const { h } = ctx
  const update = system?.update ?? null
  const lastCheck = update?.lastCheckAt === null || update?.lastCheckAt === undefined
    ? t("system.notChecked")
    : ctx.fmtTs(update.lastCheckAt)
  const latest = update?.latest ?? null
  return h("section", { class: "card" },
    h("h3", { text: t("system.versionTitle") }),
    ctx.table([t("col.item"), t("col.value")], [
      [t("system.curVersion"), ctx.fmtValue(system?.version)],
      [t("system.mode"), ctx.fmtValue(update?.mode)],
      [t("system.lastCheck"), lastCheck],
    ]),
    h("p", { class: "update-tip", text: latest ? t("system.latestTip", { version: latest }) : t("system.latestNone") }))
}

/** 节「成员接入」：baseURL（运行时 origin）∥ key 提示 ∥ 四端示例（四字段）∥ curl 冒烟一行。 */
function accessSection(ctx) {
  const { h } = ctx
  const baseURL = `${location.origin}/v1`
  const fields = `{ "name": "team", "baseURL": "${baseURL}", "model": "<provider>/<model>", "apiKey": "sk-tc-…" }`
  const ends = [
    ["system.endCli", "system.endCliPath"],
    ["system.endVsc", "system.endVscPath"],
    ["system.endDesktop", "system.endDesktopPath"],
    ["system.endOther", "system.endOtherPath"],
  ]
  return h("section", { class: "card" },
    h("h3", { text: t("system.accessTitle") }),
    h("p", { class: "hint", text: t("system.accessHint") }),
    ctx.table([t("col.item"), t("col.value")], [[t("system.baseURLRow"), baseURL], [t("system.teamKey"), t("system.teamKeyValue")]]),
    h("h4", { text: t("system.fieldsTitle") }),
    snippet(h, fields),
    h("ul", { class: "end-list" },
      ...ends.map(([nameKey, pathKey]) => h("li", {}, h("span", { class: "end-name", text: t(nameKey) }), t("system.endSuffix", { path: t(pathKey) })))),
    h("h4", { text: t("system.curlTitle") }),
    snippet(h, `curl -H "Authorization: Bearer sk-tc-…" ${baseURL}/models`))
}

export function renderSystem(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("system.title") }))
  mount.append(versionSection(ctx, ctx.state.system ?? null))
  mount.append(accessSection(ctx))
}
