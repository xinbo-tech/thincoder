/**
 * views-sandbox-containers.mjs — 沙盒页·容器区件（webui/SANDBOX.md §2.1①；sandbox-docker-admin 批——自 `views-sandbox.mjs` 外拆）：
 * 容器表（名/镜像/状态/操作：详情/启动/停止/重启/日志/删除/终端）∥ 详情窗（信息段 + 挂载表 + 端口表 + 环境块 + 用量块（懒取 + 刷新钮）
 * + 强杀危险钮（二次确认））∥ 日志窗（`pre` 码面 + tail 选择 + 刷新 + 截断标记）∥ 建/删窗（建窗卷字段 = 节点已有卷选单 + 「新建卷（手输）」保底——sandbox-volumes 批）。
 * **第七钮「终端」（sandbox-container-terminal 批——2026-10-13；台账 #1374）**：门 = 运行中（exec 需运行态）∥ 入行闩（窗类入口——在飞期不可开）∥ 点钮 ⇒
 * 终端窗（件 = `views-sandbox-terminal.mjs`；`webui/SANDBOX.md` §2.1① ∥ `webui/TERMINAL.md`）。
 * **动作钮状态门 + 忙态 + 反馈（sandbox-container-actions 批——2026-10-13；台账 #1358）**：启动/停止/重启随容器态门矩阵（`actionGate`——重启锚定运行中）∥ 点击 ⇒ 该行七钮即时禁用 + 行闩（在飞零第二请求）⇒ 完成回门矩阵态（成功面另走既有重取；失败面按当刻态列重算）∥ 成功 `flash` 成功句（含容器名——三枚）/失败红条。
 * 契约 = gateway/API.md §2.5；文案经 `t()`（`webui/I18N.md` §2.1）；渲染一律节点 + textContent（零拼串）。
 * 拆档缘由 = `views-sandbox.mjs` 增量将越 500 软线前外拆；窗体助手四件已迁 `modal.mjs`（避循环 import）。
 * 单元测试档直测面 = `createContainerSection`（桩 ctx + 假 fetch 路由表）。
 */
import { mapError, t } from "./i18n.mjs"
import { confirmModal, field, openModal, showNote, submitThen } from "./modal.mjs"
import { openTerminalModal } from "./views-sandbox-terminal.mjs"
import { sandboxKindLabel } from "./views-audit.mjs"

export { createVolumeSection } from "./views-sandbox-volumes.mjs" // 卷区件工厂转出口（页装配单点取件——`views-sandbox.mjs` 行预算 ≤500）

/** 容器态文案（枚举内 ⇒ 表键；枚举外 ⇒ 原值兜底——Docker 新态零遗漏）。 */
const CONTAINER_STATE_KEYS = { created: "admin.sandbox.stateCreated", running: "admin.sandbox.stateRunning", exited: "admin.sandbox.stateExited" }

/** 日志 tail 选项（服务端界 1–2000——§2.5；缺省 200）。 */
const LOG_TAIL_OPTIONS = [100, 200, 500, 1000, 2000]

/** 日志窗「操作记录」取数上限（服务端 `limit` 夹在 1..500——`accounts/audit.mjs`；取满 ⇒ cap 提示行）。 */
const OPS_LIMIT = 200

/** 容器态文案（纯函数——单元测试档直测）。 */
export function containerStateLabel(state) {
  const key = CONTAINER_STATE_KEYS[state]
  return key === undefined ? String(state ?? "—") : t(key)
}

/** 动作钮状态门（纯函数——单元测试档直测；值 = 该钮禁用——`actionGate("running")` = `{ start: true, stop: false, restart: false }`）：
 * 运行中 ⇒ 启动禁、停止/重启可用；非运行（已创建/已退出/枚举外原值兜底）⇒ 停止/重启禁、启动可用。
 * 重启锚定运行中 = 设计拍——重启语义 = 对运行中容器「停 ⇒ 启」；非运行态该钮与「启动」重复（`webui/SANDBOX.md` §2.1①）。 */
export function actionGate(state) {
  const running = state === "running"
  return { start: running, stop: !running, restart: !running }
}

/** 三动作成功句键（`t()` 取件——句含容器名 `{name}`；`webui/SANDBOX.md` §2.1①）。 */
const ACTION_FLASH_KEYS = { start: "admin.sandbox.containerStarted", stop: "admin.sandbox.containerStopped", restart: "admin.sandbox.containerRestarted" }

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
      actionCell(ctx, { runner, container, invalidate })))
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

/** 动作列（七钮——详情/启动/停止/重启/日志/删除/终端）：三动作初值 = 门矩阵（终端钮 = 运行中门）；点击 ⇒ 该行七钮即时禁用（发请求前）+ 行闩
 *  （在飞再触零第二请求）⇒ 完成回门矩阵态（成功面另走既有 `invalidate()` 重取——态列随新数据重渲；失败面按当刻态列重算——非七钮无条件全启）。 */
function actionCell(ctx, { runner, container, invalidate }) {
  const { h } = ctx
  const gate = actionGate(container.state)
  const terminalGate = container.state !== "running" // 第七钮门：非运行禁用（exec 需运行态——`webui/SANDBOX.md` §2.1①）
  const buttons = {
    detail: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.detail"), onclick: () => openContainerDetailModal(ctx, { runner, container, invalidate }) }),
    start: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.start"), disabled: gate.start, onclick: () => run("start") }),
    stop: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.stop"), disabled: gate.stop, onclick: () => run("stop") }),
    restart: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.restart"), disabled: gate.restart, onclick: () => run("restart") }),
    logs: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.logs"), onclick: () => openContainerLogsModal(ctx, { runner, container }) }),
    remove: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.remove"), onclick: () => openRemoveContainerModal(ctx, { runner, container, reload: invalidate }) }),
    terminal: h("button", { type: "button", class: "tiny", text: t("admin.sandbox.terminal"), disabled: terminalGate, onclick: () => openTerminalModal(ctx, { runner, container }) }),
  }
  const seven = Object.values(buttons)
  let busy = false // 行闩（在飞期——该行七钮零第二请求）
  /** 门矩阵重算（当刻态列——完成恢复的落点；详情/日志/删除 = 读面不随门，忙态外恒可用；终端 = 运行中门）。 */
  const applyGate = () => {
    const matrix = actionGate(container.state)
    buttons.start.disabled = matrix.start
    buttons.stop.disabled = matrix.stop
    buttons.restart.disabled = matrix.restart
    buttons.detail.disabled = false
    buttons.logs.disabled = false
    buttons.remove.disabled = false
    buttons.terminal.disabled = container.state !== "running"
  }
  /** 三动作一路（启动 ∥ 停止 ∥ 重启——幂等成功面由服务端收编）：即时禁七钮 ⇒ 请求 ⇒ 成功 = flash 成功句 + 失缓存重取
   *  ∥ 失败 = 红条照旧；完成（两路）⇒ 闩清 + 回门矩阵态。 */
  async function run(action) {
    if (busy) return
    busy = true
    for (const button of seven) button.disabled = true
    try {
      await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/${action}`, { method: "POST", body: {} })
      ctx.flash(t(ACTION_FLASH_KEYS[action], { name: container.name }))
      invalidate()
    } catch (error) {
      ctx.fail(error)
    } finally {
      busy = false
      applyGate()
    }
  }
  return h("td", {}, ...seven)
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

/** 日志窗（**单条时间线**：容器操作（`sandbox_event` 审计行——容器身上发生过什么）与输出行按引擎时标并流，时间升序；走查轮 2026-10-11 用户指令「日志和操作记录不该分开」）。 */
export function openContainerLogsModal(ctx, { runner, container }) {
  const { h } = ctx
  const pre = h("pre", { class: "snippet pre-scroll" })
  const marker = h("p", { class: "hint", hidden: true, text: t("admin.sandbox.logsTruncated") })
  const opsMarker = h("p", { class: "hint", hidden: true, text: t("admin.sandbox.logsOpsTruncated", { limit: OPS_LIMIT }) }) // cap 诚实提示（取满上限 ⇒ 更早的行未取）
  const note = h("p", { class: "hint error", hidden: true })
  const tailSelect = h("select", {}, ...LOG_TAIL_OPTIONS.map((count) => h("option", { value: String(count), text: String(count) })))
  tailSelect.value = "200"
  const refresh = h("button", { type: "button", class: "tiny", text: t("admin.sandbox.logsRefresh"), onclick: () => { load(); loadOps() } })
  openModal({
    title: t("admin.sandbox.logsTitle", { name: container.name }),
    body: h("div", {}, h("div", { class: "row-form" }, field(h, "admin.sandbox.logsTail", tailSelect), refresh), pre, marker, opsMarker, note),
  })
  tailSelect.addEventListener("change", () => load())

  /** 输出行（`timestamps=1` 行首时标剥出；无可解析时标 ⇒ 原位呈，不带时间列）。 */
  function parseLogLines(text) {
    return String(text).split("\n").filter((raw) => raw !== "").map((raw) => {
      const match = /^(\S+)\s(.*)$/.exec(raw)
      const stamp = match !== null && /^\d{4}-\d{2}-\d{2}T/.test(match[1]) ? match[1].replace(/(\.\d{3})\d+/, "$1") : null
      const ts = stamp === null ? Number.NaN : Date.parse(stamp)
      return Number.isNaN(ts) ? { ts: null, text: raw } : { ts, text: match[2] }
    })
  }

  let outputLines = []
  let opRows = []
  /** 并流渲染（时间升序；操作行带 `[操作]` 标；全空 ⇒ 空态文案）。
   *  无时标输出行（首 token 非时标）⇒ 次序未知 ⇒ **不作时间参照物**——比较仅在操作行与**可解析时标行**间进行（`sandbox/SANDBOX.md` §3 日志行）。 */
  function renderStream() {
    const rows = []
    let i = 0
    let j = 0
    while (i < opRows.length || j < outputLines.length) {
      const op = opRows[i]
      const line = outputLines[j]
      const takeOp = op !== undefined && (line === undefined || (line.ts !== null && op.ts <= line.ts))
      if (takeOp) {
        rows.push(`${ctx.fmtTs(op.ts)}  [${t("admin.sandbox.logsOps")}] ${op.text}`)
        i += 1
      } else {
        rows.push(line.ts === null ? line.text : `${ctx.fmtTs(line.ts)}  ${line.text}`)
        j += 1
      }
    }
    pre.textContent = rows.length === 0 ? t("admin.sandbox.logsEmpty") : rows.join("\n")
  }

  /** 读一次操作记录（**该容器审计行——服务端 `containerId` 过滤，查询/截取前施加**；接口倒序 ⇒ 本地升序）。
   *  取满上限（`events.length >= limit`）⇒ cap 诚实提示行在场（过滤后集合已不再被他会话行挤掉——台账 #1306）。 */
  async function loadOps() {
    try {
      const data = await ctx.api(`/api/audit?type=sandbox_event&containerId=${encodeURIComponent(container.id)}&limit=${OPS_LIMIT}`)
      const events = data?.events ?? []
      opRows = events.map((event) => ({ ts: Number(event.ts), text: sandboxKindLabel(event.detail?.kind) })).sort((a, b) => a.ts - b.ts)
      opsMarker.hidden = events.length < OPS_LIMIT
    } catch (error) {
      opRows = []
      opsMarker.hidden = true
      if (note.hidden) showNote(note, mapError(error)) // 不覆主读错（日志失败优先呈）
    }
    renderStream()
  }

  /** 读一次日志（tail = 选择值——服务端界 1–2000）。 */
  async function load() {
    note.hidden = true
    marker.hidden = true
    pre.textContent = t("common.loading")
    try {
      const data = await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/logs?tail=${tailSelect.value}`)
      outputLines = parseLogLines(typeof data?.logs === "string" ? data.logs : "")
      renderStream()
      marker.hidden = data?.truncated !== true
    } catch (error) {
      outputLines = []
      pre.textContent = ""
      showNote(note, mapError(error))
    }
  }
  load()
  loadOps()
}

/** 创建容器弹窗（名 + 镜像（**节点本地镜像选单回填** + 手输保底；预填设置 `image` 值）+ 卷（可空 = 不挂）+ **命令（预填待命命令 `sleep infinity`，可覆写——轻通道笔 10）** ⇒ POST 四件；卷空 ⇒ 省略键）。 */
function openCreateContainerModal(ctx, { runner, reload }) {
  const { h } = ctx
  const nameInput = h("input")
  const imageInput = h("input", { placeholder: t("admin.sandbox.imagePh") })
  const imageSelect = h("select", {}, h("option", { value: "", text: t("admin.sandbox.imageCustom") }))
  const volumeSelect = h("select", {}, h("option", { value: "", text: t("admin.sandbox.volumeNew") }))
  const volumeInput = h("input", { placeholder: t("admin.sandbox.volumePh") })
  const commandInput = h("input", { value: "sleep infinity" }) // 默认 = 待命命令（可覆写——轻通道笔 10）
  const note = h("p", { class: "hint error", hidden: true })
  const submitBtn = h("button", { type: "submit", text: t("admin.sandbox.createContainer") })
  const modal = openModal({
    title: t("admin.sandbox.createContainer"),
    body: h("form", { class: "provider-form stacked", novalidate: true, onsubmit: submit },
      field(h, "admin.sandbox.containerName", nameInput),
      field(h, "admin.sandbox.imageFromNode", imageSelect), field(h, "admin.sandbox.image", imageInput),
      field(h, "admin.sandbox.volumeFromNode", volumeSelect), field(h, "admin.sandbox.volume", volumeInput),
      h("p", { class: "hint", text: t("admin.sandbox.volumeHint") }),
      field(h, "admin.sandbox.command", commandInput), h("p", { class: "hint", text: t("admin.sandbox.commandHint") }), note, submitBtn),
  })

  // 节点本地镜像 ⇒ 选单（轻通道笔 2——手输改选：选定回填下方镜像（可再改））；读败/空表 ⇒ 仅「自定义（手输）」——手输照常，不反噬窗
  const preselect = () => { if ([...imageSelect.children].some((option) => option.value === imageInput.value)) imageSelect.value = imageInput.value }
  ctx.api(`/api/admin/sandbox/runners/${runner.id}/images`).then((data) => {
    const tags = []
    for (const image of Array.isArray(data?.images) ? data.images : []) {
      for (const tag of Array.isArray(image?.tags) ? image.tags : []) {
        if (typeof tag === "string" && tag !== "" && !tag.includes("<none>")) tags.push(tag)
      }
    }
    if (tags.length === 0) return
    imageSelect.append(...tags.map((tag) => h("option", { value: tag, text: tag })))
    preselect()
  }).catch(() => {})
  imageSelect.addEventListener("change", () => { if (imageSelect.value !== "") imageInput.value = imageSelect.value })

  // 节点已有卷 ⇒ 选单（sandbox-volumes 批——选定回填下方卷名（可再改）；读败/空表 ⇒ 仅「新建卷（手输）」——手输照常，不反噬窗）
  ctx.api(`/api/admin/sandbox/runners/${runner.id}/volumes`).then((data) => {
    const names = (Array.isArray(data?.volumes) ? data.volumes : []).map((volume) => volume?.name).filter((name) => typeof name === "string" && name !== "")
    if (names.length === 0) return
    volumeSelect.append(...names.map((name) => h("option", { value: name, text: name })))
  }).catch(() => {})
  volumeSelect.addEventListener("change", () => { if (volumeSelect.value !== "") volumeInput.value = volumeSelect.value })

  // 镜像预填（设置读面——§2.8①）；取数失败/空值 ⇒ 空输入（用户自填——不反噬窗）
  ctx.api("/api/admin/sandbox/settings").then((data) => {
    const image = data?.settings?.image
    if (typeof image === "string" && image !== "") { imageInput.value = image; preselect() }
  }).catch(() => {})

  async function submit(event) {
    event.preventDefault()
    note.hidden = true
    const name = nameInput.value.trim()
    const image = imageInput.value.trim()
    if (name === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.containerName") }))
    if (image === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.image") }))
    const command = commandInput.value.trim()
    if (command === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.command") }))
    const body = { name, image, command }
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
