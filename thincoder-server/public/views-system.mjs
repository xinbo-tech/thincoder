/**
 * views-system.mjs — 系统页（webui/WEBUI.md §2/§2.1：`#/admin/system`——仅 admin）：版本与更新 ∥ 成员接入 ∥
 * 向量服务 ∥ 服务配置（卡体 = `views-system-config.mjs`）∥ 服务健康五节。
 *
 * 数据 = `ctx.state.system`（`GET /api/system`——app.mjs 装配取一次；失败 ⇒ 留空静默）+ `GET /api/admin/config`
 * （配置面文件面——向量卡三输入 ∥ 密钥掩码回显）+ `POST /api/admin/embedding/test`（探活/试跑单端点——诊断自含形，
 * 不落库不计量）+ 前端健康共享态（§2.3⑤——`ctx.onHealth` 订阅，30s 自动刷新）。接入卡 = `accessCard(ctx, variant)` 同源构件
 * （admin 面供分发给成员 ∥ 成员面 `#/me/keys`——me-keys 批）；成员面成文 = README「成员接入」节。渲染沿 `h`/`textContent`
 * （零拼串）；baseURL = 运行时 origin（`location.origin` + `/v1`——零硬编码，反代/改端口自动随动）；文案经 `t()` 取值（§2.2）。
 */
import { mapError, t } from "./i18n.mjs"
import { systemConfigSection } from "./views-system-config.mjs"

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

/** 节「向量服务」（admin——§2.3①）：配置面（引擎地址 ∥ 模型 ∥ API Key 三输入 + 保存——`GET`/`PATCH /api/admin/config`；
 *  值 = 文件面；API Key 掩码回显（`env:` 保形 ∥ 明文 ⇒ `…`+末 4））∥ 可达性（渲染自动探活 + 「重新检测」——`POST
 *  /api/admin/embedding/test`——单端点 ∥ 诊断自含形 ∥ 不落库不计量）∥ snippet ∥ 用法一句 ∥ 试跑。
 *  探活/试跑 = 表单草稿口径（标量三项明传优先——KD-SV-54 口径镜像；未保存亦可先验；API Key 未编辑 ⇒ 不携
 *  ⇒ 运行配置回落）；保存 = `PATCH /api/admin/config`（`embedding` 子键级——重启生效）。 */
function vectorSection(ctx) {
  const { h } = ctx
  const baseURLInput = h("input", { autocomplete: "off" })
  const modelInput = h("input", { autocomplete: "off" })
  const apiKeyInput = h("input", { autocomplete: "off", placeholder: t("vector.apiKeyPh", { mask: "—" }) })
  const clearBox = h("input", { type: "checkbox" })
  const statusValue = h("span", { text: t("vector.checking") })
  const usageValue = h("p", { class: "hint" })
  const snippetCode = h("code", { text: embeddingSnippet(null) })
  const testResult = h("p", { class: "hint" })
  const saveNote = h("p", { class: "hint error", hidden: true })

  /** 草稿 key 判定（保存 ∥ 探活同源——三态）：清除勾 ⇒ 显式空 `""` ∥ 明填 ⇒ 明传 ∥ 未编辑 ⇒ 不携。 */
  const draftKey = () => {
    if (clearBox.checked) return { apiKey: "" }
    const typed = apiKeyInput.value.trim()
    return typed ? { apiKey: typed } : {}
  }
  /** 掩码回显式（同 `maskApiKey` 三态：空 ⇒ `—`（占位约定）∥ `env:` 引用 ⇒ 原文（引用非秘密）∥ 明文 ⇒ `…`+末 4）。 */
  const maskForm = (key) => (key === "" ? "—" : key.startsWith("env:") ? key : `…${key.slice(-4)}`)
  /** 探活体（标量三项明传优先——缺位（空值）⇒ 不携 ⇒ 服务端落运行配置回落）。 */
  const probeBody = (text) => {
    const body = text === undefined ? {} : { text }
    if (baseURLInput.value.trim()) body.baseURL = baseURLInput.value.trim()
    if (modelInput.value.trim()) body.model = modelInput.value.trim()
    return { ...body, ...draftKey() }
  }

  const applyConfig = (embedding) => {
    baseURLInput.value = embedding?.baseURL ?? ""
    modelInput.value = embedding?.model ?? ""
    apiKeyInput.placeholder = t("vector.apiKeyPh", { mask: embedding?.apiKey || "—" })
    usageValue.textContent = t("vector.usage", { model: embedding?.model ?? "—" })
    snippetCode.textContent = embeddingSnippet(embedding?.model ?? null)
  }

  /** 探活/试跑共用（单端点——`text` 缺省 ⇒ 内置探针；体 = 表单草稿）：ok ⇒ 可达（维度/耗时）∥ fail ⇒ kind 四分类文案。 */
  const probe = async (text) => {
    statusValue.className = ""
    statusValue.textContent = t("vector.checking")
    try {
      const result = await ctx.api("/api/admin/embedding/test", { method: "POST", body: probeBody(text) })
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

  /** 保存（`embedding` 子键级——所见即所存；key 三态同探活）：成功 ⇒ flash「已保存——重启服务后生效」∥ 失败 ⇒ 卡内提示。 */
  const save = async (event) => {
    event.preventDefault()
    saveNote.hidden = true
    const embedding = { baseURL: baseURLInput.value.trim(), model: modelInput.value.trim(), ...draftKey() }
    try {
      await ctx.api("/api/admin/config", { method: "PATCH", body: { embedding } })
      ctx.flash(t("system.cfgSaved"))
      if ("apiKey" in embedding) apiKeyInput.placeholder = t("vector.apiKeyPh", { mask: maskForm(embedding.apiKey) }) // 保存后掩码随新值（同服务端口径）
    } catch (error) {
      if (error?.status === 401 && error?.code !== "invalid_credentials") { ctx.fail(error); return } // 会话失效 ⇒ 照常踢登录
      saveNote.textContent = mapError(error)
      saveNote.hidden = false
    }
  }

  ctx.api("/api/admin/config").then((data) => applyConfig(data?.config?.embedding ?? null)).catch((error) => { ctx.fail(error); applyConfig(null) })
  probe() // 渲染自动探活（一次——字段未编辑 ⇒ 不携 ⇒ 运行配置回落）

  return h("section", { class: "card" },
    h("h3", { text: t("vector.title") }),
    h("form", { class: "provider-form", onsubmit: save },
      h("label", {}, h("span", { text: t("vector.baseURL") }), baseURLInput),
      h("label", {}, h("span", { text: t("vector.model") }), modelInput),
      h("label", {}, h("span", { text: t("vector.apiKey") }), apiKeyInput),
      h("label", { class: "key-clear" }, clearBox, t("vector.clearApiKey")),
      h("button", { type: "submit", text: t("common.save") })),
    h("p", { class: "hint", text: t("vector.draftNote") }),
    h("p", { class: "hint", text: t("system.cfgRestartNote") }),
    saveNote,
    h("h4", { text: t("vector.status") }),
    h("p", {}, statusValue, " ", recheck),
    h("p", { class: "hint", text: t("vector.autoNote") }),
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

/** 节「成员接入」（同源构件——me-keys 批 §2.3⑥）：baseURL（运行时 origin）∥ key 提示 ∥ 四端示例（四字段）∥ curl 冒烟一行。
 *  `variant`：`"admin"` = admin 面措辞（现行——零改）∥ `"member"` = 成员面措辞四键（`me.keys.access*`；素材同源）。 */
export function accessCard(ctx, variant = "admin") {
  const { h } = ctx
  const member = variant === "member"
  const baseURL = `${location.origin}/v1`
  const fields = `{ "name": "team", "baseURL": "${baseURL}", "model": "<provider>/<model>", "apiKey": "sk-tc-…" }`
  const ends = [
    ["system.endCli", "system.endCliPath"],
    ["system.endVsc", "system.endVscPath"],
    ["system.endDesktop", "system.endDesktopPath"],
    ["system.endOther", "system.endOtherPath"],
  ]
  const keyRow = member ? [t("me.keys.accessKeyRow"), t("me.keys.accessKeyValue")] : [t("system.teamKey"), t("system.teamKeyValue")]
  return h("section", { class: "card" },
    h("h3", { text: t(member ? "me.keys.accessTitle" : "system.accessTitle") }),
    h("p", { class: "hint", text: t(member ? "me.keys.accessHint" : "system.accessHint") }),
    ctx.table([t("col.item"), t("col.value")], [[t("system.baseURLRow"), baseURL], keyRow]),
    h("h4", { text: t("system.fieldsTitle") }),
    snippet(h, fields),
    h("ul", { class: "end-list" },
      ...ends.map(([nameKey, pathKey]) => h("li", {}, h("span", { class: "end-name", text: t(nameKey) }), t("system.endSuffix", { path: t(pathKey) })))),
    h("h4", { text: t("system.curlTitle") }),
    snippet(h, `curl -H "Authorization: Bearer sk-tc-…" ${baseURL}/models`))
}

/** 系统页装配（五节——§2.1：版本/更新 ∥ 接入卡 ∥ 向量服务 ∥ 服务配置 ∥ 服务健康）。 */
export function renderSystem(ctx, mount) {
  const { h } = ctx
  mount.append(h("h2", { text: t("system.title") }))
  mount.append(versionSection(ctx, ctx.state.system ?? null))
  mount.append(accessCard(ctx, "admin"))
  mount.append(vectorSection(ctx))
  mount.append(systemConfigSection(ctx)) // 服务配置卡（新档——同拍取数，卡体异步就位）
  mount.append(healthSection(ctx))
}
