/**
 * views-sandbox-containers.mjs — 沙盒页·容器区件（webui/WEBUI.md §2.8①；sandbox-docker-admin 批——自 `views-sandbox.mjs` 外拆）：
 * 容器表（名/镜像/状态/操作：详情/启动/停止/重启/日志/删除）∥ 详情窗（信息段 + 挂载表 + 端口表 + 环境块 + 用量块（懒取 + 刷新钮）
 * + 强杀危险钮（二次确认））∥ 日志窗（`pre` 码面 + tail 选择 + 刷新 + 截断标记）∥ 建/删窗。
 * 契约 = gateway/API.md §2.5；文案经 `t()`（§2.2）；渲染一律节点 + textContent（零拼串）。
 * 拆档缘由 = `views-sandbox.mjs` 增量将越 500 硬线前外拆；窗体助手四件已迁 `modal.mjs`（避循环 import）。
 * 批内件直测面 = `createContainerSection`（桩 ctx + 假 fetch 路由表）。
 */
import { mapError, t } from "./i18n.mjs"
import { confirmModal, field, openModal, showNote, submitThen } from "./modal.mjs"

/** 容器态文案（枚举内 ⇒ 表键；枚举外 ⇒ 原值兜底——Docker 新态零遗漏）。 */
const CONTAINER_STATE_KEYS = { created: "admin.sandbox.stateCreated", running: "admin.sandbox.stateRunning", exited: "admin.sandbox.stateExited" }

/** 日志 tail 选项（服务端界 1–2000——§2.5；缺省 200）。 */
const LOG_TAIL_OPTIONS = [100, 200, 500, 1000, 2000]

/** 容器态文案（纯函数——批内件直测）。 */
export function containerStateLabel(state) {
  const key = CONTAINER_STATE_KEYS[state]
  return key === undefined ? String(state ?? "—") : t(key)
}

/** 字节 → 人话（B/KiB/MiB/GiB；一位小数——零依赖；非数 ⇒ 「—」）。 */
export function formatBytes(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  const units = ["B", "KiB", "MiB", "GiB", "TiB"]
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${unit === 0 ? size : Math.round(size * 10) / 10} ${units[unit]}`
}

/** 容器区段（缓存自持——展开懒加载；动作后 `reset` + 页重取）。 */
export function createContainerSection(ctx) {
  const { h } = ctx
  const cache = new Map() // 节点 id ⇒ { containers } ∥ { error }

  /** 区渲染（展开行内）。`reload` = 页数据重取 ∥ `refresh` = 立即重渲（页守卫展开态）。 */
  function area(runner, { reload, refresh }) {
    const box = h("div", { class: "stack-box" })
    const cached = cache.get(runner.id)
    if (cached === undefined || cached.loading === true) {
      if (cached === undefined) {
        cache.set(runner.id, { loading: true }) // 占位（两区并发重渲不重取）
        ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers`).then((data) => {
          cache.set(runner.id, { containers: data?.containers ?? [] })
          refresh()
        }).catch((error) => {
          cache.set(runner.id, { error: mapError(error) })
          refresh()
        })
      }
      box.append(h("p", { class: "hint", text: t("common.loading") }))
      return box
    }
    const invalidate = () => { cache.delete(runner.id); reload() } // 失缓存重取 = 界面上新
    box.append(h("div", { class: "info-actions" },
      h("button", { type: "button", class: "tiny", text: t("admin.sandbox.createContainer"), onclick: () => openCreateContainerModal(ctx, { runner, reload: invalidate }) })))
    if (cached.error !== undefined) {
      box.append(h("p", { class: "hint error", text: cached.error }))
      return box
    }
    if (cached.containers.length === 0) {
      box.append(h("p", { class: "hint", text: t("admin.sandbox.containerEmpty") }))
      return box
    }
    const headers = [t("admin.sandbox.containerName"), t("admin.sandbox.image"), t("admin.sandbox.colState"), t("admin.sandbox.colActions")]
    const rows = cached.containers.map((container) => h("tr", {},
      h("td", { text: container.name }),
      h("td", { text: container.image }),
      h("td", { text: containerStateLabel(container.state) }),
      h("td", {},
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.detail"), onclick: () => openContainerDetailModal(ctx, { runner, container, invalidate }) }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.start"), onclick: () => containerAction(ctx, { runner, container, action: "start", invalidate }) }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.stop"), onclick: () => containerAction(ctx, { runner, container, action: "stop", invalidate }) }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.restart"), onclick: () => containerAction(ctx, { runner, container, action: "restart", invalidate }) }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.logs"), onclick: () => openContainerLogsModal(ctx, { runner, container }) }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.remove"), onclick: () => openRemoveContainerModal(ctx, { runner, container, reload: invalidate }) }))))
    box.append(h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...rows))))
    return box
  }

  /** 失缓存（动作后重取）。 */
  function reset(runner) {
    cache.delete(runner.id)
  }

  return { area, reset }
}

/** 容器动作（启动 ∥ 停止 ∥ 重启——幂等成功面由服务端收编；成功 ⇒ 失缓存重取 = 界面上新）。 */
async function containerAction(ctx, { runner, container, action, invalidate }) {
  try {
    await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/${action}`, { method: "POST", body: {} })
    invalidate()
  } catch (error) {
    ctx.fail(error)
  }
}

/** 详情窗（信息段 + 挂载表 + 端口表 + 环境块 + 用量块 + 强杀钮）。 */
function openContainerDetailModal(ctx, { runner, container, invalidate }) {
  const { h } = ctx
  const infoBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const usageBox = usageBlock(ctx, { runner, container })
  const note = h("p", { class: "hint error", hidden: true })
  const killBtn = h("button", {
    type: "button", class: "danger", text: t("admin.sandbox.kill"),
    onclick: () => openKillModal(ctx, { runner, container, invalidate }),
  })
  const modal = openModal({
    title: t("admin.sandbox.detailTitle", { name: container.name }),
    body: h("div", {}, infoBox, usageBox, note),
    footer: h("div", { class: "row-form" }, killBtn, h("button", { type: "button", class: "tiny", text: t("common.close"), onclick: () => modal.close() })),
  })

  ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}`).then((data) => {
    infoBox.replaceChildren(...detailNodes(ctx, data?.container ?? {}))
  }).catch((error) => {
    infoBox.replaceChildren(h("p", { class: "hint error", text: mapError(error) }))
  })
}

/** 详情段（信息栅格 + 挂载表 + 端口表 + 环境块——空则就地「无…」提示）。 */
function detailNodes(ctx, container) {
  const { h } = ctx
  const info = h("dl", { class: "detail-grid" },
    h("dt", { text: t("admin.sandbox.detailId") }), h("dd", { text: ctx.fmtValue(container.id) }),
    h("dt", { text: t("admin.sandbox.image") }), h("dd", { text: ctx.fmtValue(container.image) }),
    h("dt", { text: t("admin.sandbox.colState") }), h("dd", { text: containerStateLabel(container.state) }),
    h("dt", { text: t("admin.sandbox.detailCreated") }), h("dd", { text: container.created ? ctx.fmtTs(container.created) : "—" }),
    h("dt", { text: t("admin.sandbox.detailRestarts") }), h("dd", { text: ctx.fmtValue(container.restartCount) }),
    h("dt", { text: t("admin.sandbox.detailCommand") }), h("dd", { text: (container.command?.cmd ?? []).join(" ") || "—" }),
    h("dt", { text: t("admin.sandbox.detailEntrypoint") }), h("dd", { text: (container.command?.entrypoint ?? []).join(" ") || "—" }))
  const mounts = container.mounts ?? []
  const ports = container.ports ?? []
  const env = container.env ?? []
  return [
    info,
    h("h4", { text: t("admin.sandbox.mountsTitle") }),
    ...(mounts.length === 0 ? [h("p", { class: "hint", text: t("admin.sandbox.mountsEmpty") })] : [h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...[t("admin.sandbox.colType"), t("admin.sandbox.colSource"), t("admin.sandbox.colDestination"), t("admin.sandbox.colMode"), t("admin.sandbox.colRw")].map((label) => h("th", { text: label })))),
        h("tbody", {}, ...mounts.map((mount) => h("tr", {},
          h("td", { text: mount.type }),
          h("td", { text: mount.source }),
          h("td", { text: mount.destination }),
          h("td", { text: mount.mode }),
          h("td", { text: t(mount.rw === true ? "admin.sandbox.rwYes" : "admin.sandbox.rwNo") }))))))]),
    h("h4", { text: t("admin.sandbox.portsTitle") }),
    ...(ports.length === 0 ? [h("p", { class: "hint", text: t("admin.sandbox.portsEmpty") })] : [h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...[t("admin.sandbox.colPort"), t("admin.sandbox.colHostIp"), t("admin.sandbox.colHostPort")].map((label) => h("th", { text: label })))),
        h("tbody", {}, ...ports.map((port) => h("tr", {},
          h("td", { text: port.port }),
          h("td", { text: ctx.fmtValue(port.hostIp) }),
          h("td", { text: ctx.fmtValue(port.hostPort) }))))))]),
    h("h4", { text: t("admin.sandbox.envTitle") }),
    ...(env.length === 0 ? [h("p", { class: "hint", text: t("admin.sandbox.envEmpty") })] : [h("pre", { class: "snippet wrap", text: env.join("\n") })]),
  ]
}

/** 用量块（懒取 + 刷新钮——§2.8①；一次采样基线不足 ⇒ 「—（基线不足）」如实）。 */
function usageBlock(ctx, { runner, container }) {
  const { h } = ctx
  const grid = h("dl", { class: "detail-grid" })
  const note = h("p", { class: "hint error", hidden: true })
  const refresh = h("button", { type: "button", class: "tiny", text: t("admin.sandbox.usageRefresh"), onclick: () => load() })
  const box = h("div", { class: "stack-box" },
    h("div", { class: "row-form" }, h("h4", { text: t("admin.sandbox.usageTitle") }), refresh), grid, note)

  /** 一次采样两读（CPU/内存 + 磁盘）——重取 = 重采样。 */
  async function load() {
    note.hidden = true
    grid.replaceChildren(h("dt", { text: t("common.loading") }), h("dd", { text: "" }))
    try {
      const data = await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/stats`)
      const usage = data?.usage ?? {}
      const cpu = typeof usage.cpuPercent === "number" ? `${usage.cpuPercent}%` : t("admin.sandbox.usageCpuNa")
      const pair = (used, limit) => (used === null || used === undefined ? "—" : `${formatBytes(used)} / ${formatBytes(limit)}`)
      grid.replaceChildren(
        h("dt", { text: t("admin.sandbox.usageCpu") }), h("dd", { text: cpu }),
        h("dt", { text: t("admin.sandbox.usageMem") }), h("dd", { text: pair(usage.memUsed, usage.memLimit) }),
        h("dt", { text: t("admin.sandbox.usageDisk") }), h("dd", { text: pair(usage.diskRw, usage.diskRoot) }))
    } catch (error) {
      grid.replaceChildren()
      showNote(note, mapError(error))
    }
  }
  load()
  return box
}

/** 强杀确认窗（危险钮二次确认——停不动的兜底；未运行 ⇒ 服务端如实报错，非幂等成功）。 */
function openKillModal(ctx, { runner, container, invalidate }) {
  const { modal, note, confirmBtn } = confirmModal(ctx, {
    title: "admin.sandbox.killTitle",
    bodyText: "admin.sandbox.killConfirm",
    bodyParams: { name: container.name },
    confirmText: t("admin.sandbox.kill"),
    submit: () => submitThen(ctx, {
      note, button: confirmBtn, modal, reload: invalidate,
      call: () => ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/kill`, { method: "POST", body: {} }),
      flash: t("admin.sandbox.killed", { name: container.name }),
    }),
  })
}

/** 日志窗（`pre` 码面块 + tail 选择 + 刷新；截断 ⇒ 标记行）。 */
export function openContainerLogsModal(ctx, { runner, container }) {
  const { h } = ctx
  const pre = h("pre", { class: "snippet pre-scroll" })
  const marker = h("p", { class: "hint", hidden: true, text: t("admin.sandbox.logsTruncated") })
  const note = h("p", { class: "hint error", hidden: true })
  const tailSelect = h("select", {}, ...LOG_TAIL_OPTIONS.map((count) => h("option", { value: String(count), text: String(count) })))
  tailSelect.value = "200"
  const refresh = h("button", { type: "button", class: "tiny", text: t("admin.sandbox.logsRefresh"), onclick: () => load() })
  openModal({
    title: t("admin.sandbox.logsTitle", { name: container.name }),
    body: h("div", {}, h("div", { class: "row-form" }, field(h, "admin.sandbox.logsTail", tailSelect), refresh), pre, marker, note),
  })
  tailSelect.addEventListener("change", () => load())

  /** 读一次日志（tail = 选择值——服务端界 1–2000）。 */
  async function load() {
    note.hidden = true
    marker.hidden = true
    pre.textContent = t("common.loading")
    try {
      const data = await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/logs?tail=${tailSelect.value}`)
      const text = typeof data?.logs === "string" ? data.logs : ""
      pre.textContent = text === "" ? t("admin.sandbox.logsEmpty") : text
      marker.hidden = data?.truncated !== true
    } catch (error) {
      pre.textContent = ""
      showNote(note, mapError(error))
    }
  }
  load()
}

/** 创建容器弹窗（名 + 镜像（预填设置 `image` 值）+ 卷（可空 = 不挂）⇒ POST 三件；卷空 ⇒ 省略键）。 */
function openCreateContainerModal(ctx, { runner, reload }) {
  const { h } = ctx
  const nameInput = h("input")
  const imageInput = h("input", { placeholder: t("admin.sandbox.imagePh") })
  const volumeInput = h("input", { placeholder: t("admin.sandbox.volumePh") })
  const note = h("p", { class: "hint error", hidden: true })
  const submitBtn = h("button", { type: "submit", text: t("admin.sandbox.createContainer") })
  const modal = openModal({
    title: t("admin.sandbox.createContainer"),
    body: h("form", { class: "provider-form stacked", novalidate: true, onsubmit: submit },
      field(h, "admin.sandbox.containerName", nameInput), field(h, "admin.sandbox.image", imageInput), field(h, "admin.sandbox.volume", volumeInput), note, submitBtn),
  })

  // 镜像预填（设置读面——§2.8①）；取数失败/空值 ⇒ 空输入（用户自填——不反噬窗）
  ctx.api("/api/admin/sandbox/settings").then((data) => {
    const image = data?.settings?.image
    if (typeof image === "string" && image !== "") imageInput.value = image
  }).catch(() => {})

  async function submit(event) {
    event.preventDefault()
    note.hidden = true
    const name = nameInput.value.trim()
    const image = imageInput.value.trim()
    if (name === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.containerName") }))
    if (image === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.image") }))
    const body = { name, image }
    const volume = volumeInput.value.trim()
    if (volume !== "") body.volume = volume // 卷缺 ⇒ 省略键（不挂）
    submitBtn.disabled = true
    try {
      await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers`, { method: "POST", body })
      ctx.flash(t("admin.sandbox.containerCreated", { name }))
      modal.close()
      await reload()
    } catch (error) {
      submitBtn.disabled = false
      showNote(note, mapError(error))
    }
  }
}

/** 删除容器确认弹窗（运行中将强停强删提示——卷不随删）。 */
function openRemoveContainerModal(ctx, { runner, container, reload }) {
  const { modal, note, confirmBtn } = confirmModal(ctx, { title: "admin.sandbox.removeContainerTitle", bodyText: "admin.sandbox.removeContainerNote", confirmText: t("admin.sandbox.remove"), submit: () => submit() })
  const submit = () => submitThen(ctx, {
    note, button: confirmBtn, modal, reload,
    call: () => ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}`, { method: "DELETE" }),
    flash: t("admin.sandbox.containerDeleted", { name: container.name }),
  })
}
