/**
 * views-system.mjs — 系统页（webui/WEBUI.md §2/§2.1：`#/admin/system`——仅 admin）：版本与更新 ∥ 成员接入 ∥
 * 向量服务 ∥ 服务健康四节。
 *
 * 数据 = `ctx.state.system`（`GET /api/system`——app.mjs 装配取一次；失败 ⇒ 留空静默）+ `GET /api/admin/embedding`
 * （配置真值——零密钥）+ `POST /api/admin/embedding/test`（探活/试跑单端点——诊断自含形，不落库不计量）+
 * 前端健康共享态（§2.3⑤——`ctx.onHealth` 订阅，30s 自动刷新）。接入卡 = admin 面（供分发给成员）；成员面成文
 * = README「成员接入」节。渲染沿 `h`/`textContent`（零拼串）；baseURL = 运行时 origin（`location.origin` + `/v1`
 * ——零硬编码，反代/改端口自动随动）；文案经 `t()` 取值（§2.2）。
 */
import { t } from "./i18n.mjs"

/** 代码样例行（`pre > code`——textContent 直落）。 */
const snippet = (h, text) => h("pre", { class: "snippet" }, h("code", { text }))

/** 诊断 kind ⇒ 文案键（四分类——gateway/API.md §2.4；枚举外 ⇒ 原值兜底）。 */
const KIND_KEYS = { timeout: "vector.kind.timeout", unreachable: "vector.kind.unreachable", http_error: "vector.kind.http_error", bad_response: "vector.kind.bad_response" }
const kindLabel = (kind) => (KIND_KEYS[kind] ? t(KIND_KEYS[kind]) : String(kind ?? ""))

/** `/v1/embeddings` 调用 snippet（地址 = 网关自身 origin——引擎地址不下发浏览器，§2.3①）。 */
const embeddingSnippet = (model) => `curl -H "Authorization: Bearer sk-tc-…" ${location.origin}/v1/embeddings -d '{"model": "${model ?? "<model>"}", "input": "hello"}'`

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

/** 节「向量服务」（admin——§2.3①）：配置真值（地址/模型）∥ 可达性（渲染自动探活 + 重新检测）∥ snippet ∥
 *  用法一句 ∥ 试跑（短文本 ⇒ 维度 ∥ 耗时——不落库不计量）。 */
function vectorSection(ctx) {
  const { h } = ctx
  const addressValue = h("span", { text: "…" })
  const modelValue = h("span", { text: "…" })
  const statusValue = h("span", { text: t("vector.checking") })
  const usageValue = h("p", { class: "hint" })
  const snippetCode = h("code", { text: embeddingSnippet(null) })
  const testResult = h("p", { class: "hint" })

  const applyConfig = (config) => {
    addressValue.textContent = config?.baseURL ?? "—"
    modelValue.textContent = config?.model ?? "—"
    usageValue.textContent = t("vector.usage", { model: config?.model ?? "—" })
    snippetCode.textContent = embeddingSnippet(config?.model ?? null)
  }

  /** 探活/试跑共用（单端点——`text` 缺省 ⇒ 内置探针）；ok ⇒ 可达（维度/耗时）∥ fail ⇒ kind 四分类文案。 */
  const probe = async (text) => {
    statusValue.className = ""
    statusValue.textContent = t("vector.checking")
    try {
      const result = await ctx.api("/api/admin/embedding/test", { method: "POST", body: text === undefined ? {} : { text } })
      statusValue.className = result.ok ? "" : "error" // ⑨ 错态（`.error` 独立生效——WEBUI §2.5）
      statusValue.textContent = result.ok
        ? t("vector.reachable", { dimensions: result.dimensions, ms: result.ms })
        : t("vector.fail", { kind: kindLabel(result.error?.kind), message: result.error?.message ?? "" })
      return result
    } catch (error) {
      ctx.fail(error)
      statusValue.className = ""
      statusValue.textContent = "—"
      return null
    }
  }

  const recheck = h("button", { type: "button", class: "tiny", text: t("vector.recheck") })
  recheck.addEventListener("click", () => { probe() })

  const testInput = h("input", { placeholder: t("vector.testPh") })
  const testForm = h("form", { class: "row-form" },
    testInput, h("button", { type: "submit", text: t("vector.testBtn") }))
  testForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    const result = await probe(testInput.value.trim() || undefined)
    if (result === null) { testResult.className = "hint"; testResult.textContent = ""; return }
    testResult.className = result.ok ? "hint" : "hint error" // ⑨ 错态 = `.hint error`（试跑失败——WEBUI §2.5）
    testResult.textContent = result.ok
      ? t("vector.testDone", { dimensions: result.dimensions, ms: result.ms })
      : t("vector.fail", { kind: kindLabel(result.error?.kind), message: result.error?.message ?? "" })
  })

  ctx.api("/api/admin/embedding").then(applyConfig).catch((error) => { ctx.fail(error); applyConfig(null) })
  probe() // 渲染自动探活（一次）

  return h("section", { class: "card" },
    h("h3", { text: t("vector.title") }),
    ctx.table([t("col.item"), t("col.value")], [
      [t("vector.baseURL"), addressValue],
      [t("vector.model"), modelValue],
      [t("vector.status"), statusValue],
    ]),
    h("p", { class: "hint", text: t("vector.autoNote") }),
    h("p", {}, recheck),
    h("h4", { text: t("vector.snippetTitle") }),
    h("pre", { class: "snippet" }, snippetCode),
    usageValue,
    h("h4", { text: t("vector.testTitle") }),
    testForm,
    testResult,
  )
}

/** 节「服务健康」：状态 ∥ DB ∥ 运行时长 ∥ 最近检查（本地化）——前端健康共享态（§2.3⑤；30s 自动刷新）。 */
function healthSection(ctx) {
  const { h } = ctx
  const statusValue = h("span")
  const dbValue = h("span")
  const uptimeValue = h("span")
  const checkValue = h("span")
  const render = () => {
    const health = ctx.health()
    statusValue.textContent = health.label
    dbValue.textContent = health.body?.db ?? "—"
    uptimeValue.textContent = health.body ? t("health.uptimeSeconds", { seconds: health.body.uptime }) : "—"
    checkValue.textContent = health.checkedAt ? ctx.fmtTs(health.checkedAt) : "—"
  }
  render()
  ctx.onHealth(render)
  return h("section", { class: "card" },
    h("h3", { text: t("health.title") }),
    ctx.table([t("col.item"), t("col.value")], [
      [t("health.status"), statusValue],
      [t("health.db"), dbValue],
      [t("health.uptime"), uptimeValue],
      [t("health.lastCheck"), checkValue],
    ]),
    h("p", { class: "hint", text: t("health.autoNote") }))
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
  mount.append(vectorSection(ctx))
  mount.append(healthSection(ctx))
}
