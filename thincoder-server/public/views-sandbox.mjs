/**
 * views-sandbox.mjs — 管理·沙盒页（webui/WEBUI.md §2/§2.8①——`#/admin/sandbox`；runner-admin-console 批）：运行面卡（可用性提示 ∥ 节点表 ∥
 * 添加/删除节点弹窗 ∥ 容器区（节点行展开——懒加载：容器表 + 创建/删除容器弹窗））+ 托管接入（弹窗（八字段 + S5 预告知句）∥
 * 装机任务区（三态 + 步骤读数展开 + keep 态「撤销凭据」钮；在途 3s 读时轮询、定终态停））——本批 = ① 运行面 + 容器区。契约 = gateway/API.md §2.5（节点/容器七路由 + 托管接入四路由；
 * 建容器镜像预填 = 设置读面；步骤读数在详情面）；判权全在后端（服务端 403 为准）；渲染一律节点 + textContent（零拼串）；文案经 `t()` 取值（§2.2）。
 * 批内件直测面 = `renderSandbox`（桩 ctx + 假 fetch 路由表）。
 */
import { mapError, t } from "./i18n.mjs"
import { openModal } from "./modal.mjs"
import { deriveModels } from "./views-models.mjs"

/** 在途装机任务的读时轮询间隔（§2.8①——定终态停；无后台常驻定时器）。 */
export const TASK_POLL_MS = 3000

/** 容器态文案（枚举内 ⇒ 表键；枚举外 ⇒ 原值兜底——Docker 新态零遗漏）。 */
const CONTAINER_STATE_KEYS = { created: "admin.sandbox.stateCreated", running: "admin.sandbox.stateRunning", exited: "admin.sandbox.stateExited" }

/** 装机终态集（轮询停点）：成功三形 ⇒「已就绪」∥ 余（`failed` ∥ `interrupted`）⇒「失败」；不在集内 ⇒ 在途「装机中」。 */
const RUN_READY = new Set(["ready", "done", "succeeded"])
const RUN_TERMINAL = new Set([...RUN_READY, "failed", "interrupted"])

/** 渲染代际（重渲/离页 ⇒ 旧轮询环自停——零全局清理钩子）。 */
let pollGeneration = 0

/** 容器态文案（纯函数——批内件直测）。 */
export function containerStateLabel(state) {
  const key = CONTAINER_STATE_KEYS[state]
  return key === undefined ? String(state ?? "—") : t(key)
}

/** 装机态文案（三态——§2.8①：装机中 ∥ 已就绪 ∥ 失败；枚举外视为在途）。 */
export function runStateLabel(status) {
  if (RUN_READY.has(status)) return t("admin.sandbox.stateReady")
  if (RUN_TERMINAL.has(status)) return t("admin.sandbox.stateFailed")
  return t("admin.sandbox.stateInstalling")
}

/** 装机态徽标类（三态同源：成功 ⇒ ok ∥ 终态失败 ⇒ off ∥ 在途 ⇒ 中性）。 */
function runStateClass(status) {
  if (RUN_READY.has(status)) return "badge ok"
  if (RUN_TERMINAL.has(status)) return "badge off"
  return "badge"
}

// ── 弹窗件共用（窗内一切反馈落窗内——2026-10-07 走查口径）────────────────────────

/** 窗内状态行（`note` 节点置文 + 类：错 ⇒ `hint error` ∥ 中性 ⇒ `hint`）。 */
function showNote(note, text, isError = true) {
  note.hidden = false
  note.className = isError ? "hint error" : "hint"
  note.textContent = text
}

/** 表单字段（标题行 + 控件——`.provider-form.stacked` 逐项竖排）。 */
function field(h, labelKey, ...controls) {
  return h("label", {}, h("span", { text: t(labelKey) }), ...controls)
}

/** 确认类提交收口：成功 ⇒ flash + 关窗 + 刷新；失败 ⇒ 窗内人话（钮复位——可重试）。 */
async function submitThen(ctx, { note, button, modal, call, flash, reload }) {
  note.hidden = true
  button.disabled = true
  try {
    await call()
    ctx.flash(flash)
    modal.close()
    await reload()
  } catch (error) {
    button.disabled = false
    showNote(note, mapError(error))
  }
}

/** 确认弹窗骨（说明段 + 脚区：危险确认 + 取消）；调用方传入提交动作。 */
function confirmModal(ctx, { title, bodyText, confirmText, submit }) {
  const { h } = ctx
  const note = h("p", { class: "hint error", hidden: true })
  const confirmBtn = h("button", { type: "button", class: "danger", text: confirmText, onclick: submit })
  const modal = openModal({
    title: t(title), body: h("div", {}, h("p", { class: "hint", text: t(bodyText) }), note),
    footer: h("div", { class: "row-form" }, confirmBtn, h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })),
  })
  return { modal, note, confirmBtn }
}

/** 集内切换（展开/收起）。 */
function toggleIn(set, key) {
  if (set.has(key)) set.delete(key)
  else set.add(key)
}

/** 步骤读数行（对象 ⇒ `键：值` 逐键 ∥ 数组 ⇒ 逐项 ∥ 字符串 ⇒ 原样；空值略过——服务端读数形：`{ host, sshUser, result, summary, reason, … }`）。 */
function readingLines(readings) {
  if (typeof readings === "string") return readings === "" ? [] : [readings]
  if (Array.isArray(readings)) return readings.filter((item) => item !== null && item !== undefined && item !== "").map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
  if (readings === null || readings === undefined || typeof readings !== "object") return []
  return Object.entries(readings).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
}

/** 步骤项（步骤名取读：`id` ⇒ `name`/`step` ⇒ 字符串原样；`note` 附着；读数 = 子清单）。 */
function stepItem(h, entry) {
  const name = typeof entry === "string" ? entry : String(entry?.id ?? entry?.name ?? entry?.step ?? "—")
  const lines = readingLines(entry?.readings)
  return h("li", {}, typeof entry?.note === "string" && entry.note !== "" ? `${name} — ${entry.note}` : name, ...(lines.length === 0 ? [] : [h("ul", {}, ...lines.map((line) => h("li", { class: "hint", text: line })))]))
}

/** 管理·沙盒页（非壳页——卡多，沿看板页先例）。 */
export async function renderSandbox(ctx, mount) {
  const { h } = ctx
  const generation = ++pollGeneration
  const expandedNodes = new Set() // 展开的节点 id（容器区懒加载）
  const containerCache = new Map() // 节点 id ⇒ { containers } ∥ { error }
  const expandedTasks = new Set() // 展开的装机任务 id
  const detailCache = new Map() // 任务 id ⇒ { step, steps }（步骤读数在详情面——列表携步骤无读数，§2.5）
  let runners = []
  let runs = []
  let pollTimer = null

  mount.append(h("h2", { text: t("admin.sandbox.title") }))
  const alert = h("p", { class: "hint error", hidden: true })
  const listBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  const taskBox = h("div", { class: "table-slot" }, h("p", { class: "hint", text: t("common.loading") }))
  mount.append(h("section", { class: "card" }, h("h3", { text: t("admin.sandbox.runnersTitle") }),
    h("div", { class: "info-actions" },
      h("button", { type: "button", text: t("admin.sandbox.addRunner"), onclick: () => openAddRunnerModal(ctx, { reload: loadRunners }) }),
      h("button", { type: "button", class: "tiny", text: t("admin.sandbox.onboardingBtn"), onclick: () => openOnboardingModal(ctx, { reload: loadTasks }) })),
    alert,
    listBox,
    h("h4", { text: t("admin.sandbox.tasksTitle") }),
    taskBox))

  /** 离页/重渲即停的存活判据（挂载点被换 ⇒ 停机；桩环境（无 isConnected）⇒ 视为存活）。 */
  const alive = () => generation === pollGeneration && mount.isConnected !== false
  const invalidate = (runner, reload = loadRunners) => { containerCache.delete(runner.id); reload() }

  // ── 运行面（节点表 ∥ 可用性提示——读时探活，§2.5）────────────────────────────

  async function loadRunners() {
    try {
      const data = await ctx.api("/api/admin/sandbox/overview")
      runners = data?.runners ?? []
      // 不整页禁用：无节点 ∥ 全离线 ⇒ 提示条 + 原因（互延读：后端总态 ∪ 行态自推——行态即真相）
      const unavailable = data?.status === "unavailable" || runners.every((runner) => runner.online !== true)
      alert.hidden = !unavailable
      alert.textContent = unavailable ? t(runners.length === 0 ? "admin.sandbox.noNodes" : "admin.sandbox.allOffline") : ""
      renderNodes()
    } catch (error) {
      ctx.fail(error)
      listBox.replaceChildren(h("p", { class: "hint error", text: t("admin.sandbox.loadFailed") }))
    }
  }

  function renderNodes() {
    listBox.replaceChildren(runners.length === 0 ? h("p", { class: "hint", text: t("admin.sandbox.empty") }) : nodesTable())
  }

  /** 节点表（离线行 = 红标 —— `error` 态类；容器计数 `{running}/{total}`，离线读数不外推 ⇒ 「—」）。 */
  function nodesTable() {
    const headers = [t("admin.sandbox.name"), t("admin.sandbox.address"), t("admin.sandbox.colOnline"), t("admin.sandbox.colVersion"), t("admin.sandbox.colContainers"), t("admin.sandbox.colActions")]
    const body = []
    for (const runner of runners) {
      const online = runner.online === true
      const counts = runner.containers === null || runner.containers === undefined ? "—" : `${runner.containers.running}/${runner.containers.total}`
      const toggle = () => { toggleIn(expandedNodes, runner.id); renderNodes() }
      body.push(h("tr", { class: online ? "" : "error" }, h("td", { text: runner.name }),
        h("td", { text: runner.address }),
        h("td", {}, h("span", { class: online ? "badge ok" : "badge off", text: t(online ? "admin.sandbox.online" : "admin.sandbox.offline") })),
        h("td", { text: ctx.fmtValue(runner.version) }),
        h("td", { text: counts }),
        h("td", {},
          h("button", { type: "button", class: "tiny", text: t(expandedNodes.has(runner.id) ? "admin.sandbox.collapse" : "admin.sandbox.expand"), onclick: toggle }),
          h("button", { type: "button", class: "tiny", text: t("admin.sandbox.remove"), onclick: () => openRemoveRunnerModal(ctx, { runner, reload: loadRunners }) }))))
      if (expandedNodes.has(runner.id)) body.push(h("tr", { class: "detail-row" }, h("td", { colspan: String(headers.length) }, containerArea(runner))))
    }
    return h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...body)))
  }

  /** 容器区（懒加载——首次展开取一次；动作后失缓存重取）。 */
  function containerArea(runner) {
    const box = h("div", { class: "stack-box" })
    const cached = containerCache.get(runner.id)
    if (cached === undefined) {
      box.append(h("p", { class: "hint", text: t("common.loading") }))
      ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers`).then((data) => {
        containerCache.set(runner.id, { containers: data?.containers ?? [] })
        if (expandedNodes.has(runner.id)) renderNodes()
      }).catch((error) => { containerCache.set(runner.id, { error: mapError(error) }); if (expandedNodes.has(runner.id)) renderNodes() })
      return box
    }
    box.append(h("div", { class: "info-actions" },
      h("button", { type: "button", class: "tiny", text: t("admin.sandbox.createContainer"), onclick: () => openCreateContainerModal(ctx, { runner, reload: () => invalidate(runner) }) })))
    if (cached.error !== undefined) return box.append(h("p", { class: "hint error", text: cached.error })), box
    if (cached.containers.length === 0) return box.append(h("p", { class: "hint", text: t("admin.sandbox.containerEmpty") })), box
    const headers = [t("admin.sandbox.containerName"), t("admin.sandbox.image"), t("admin.sandbox.colState"), t("admin.sandbox.colActions")]
    const rows = cached.containers.map((container) => h("tr", {},
      h("td", { text: container.name }),
      h("td", { text: container.image }),
      h("td", { text: containerStateLabel(container.state) }),
      h("td", {},
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.start"), onclick: () => containerAction(runner, container, "start") }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.stop"), onclick: () => containerAction(runner, container, "stop") }),
        h("button", { type: "button", class: "tiny", text: t("admin.sandbox.remove"), onclick: () => openRemoveContainerModal(ctx, { runner, container, reload: () => invalidate(runner) }) }))))
    box.append(h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...rows))))
    return box
  }

  /** 容器动作（启动 ∥ 停止——幂等成功面由服务端收编；成功 ⇒ 失缓存重取 = 界面上新）。 */
  async function containerAction(runner, container, action) {
    try {
      await ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers/${container.id}/${action}`, { method: "POST" })
      invalidate(runner)
    } catch (error) {
      ctx.fail(error)
    }
  }

  // ── 装机任务区（三态 + 步骤读数展开；在途 3s 读时轮询、定终态停）──────────────

  async function loadTasks() {
    if (!alive()) return
    try {
      const data = await ctx.api("/api/admin/sandbox/onboarding")
      runs = data?.runs ?? []
      renderTasks()
    } catch (error) {
      ctx.fail(error)
      taskBox.replaceChildren(h("p", { class: "hint error", text: t("admin.sandbox.loadFailed") }))
    }
    if (runs.some((run) => !RUN_TERMINAL.has(run.status))) schedule() // 定终态停
  }

  /** 排下一轮（单链——在途才排；离页/重渲即停）。 */
  function schedule() {
    if (!alive() || pollTimer !== null) return
    pollTimer = setTimeout(() => { pollTimer = null; loadTasks() }, TASK_POLL_MS)
  }

  function renderTasks() {
    if (runs.length === 0) {
      taskBox.replaceChildren(h("p", { class: "hint", text: t("admin.sandbox.tasksEmpty") }))
      return
    }
    const headers = [t("admin.sandbox.onboardingHost"), t("admin.sandbox.colState"), t("admin.sandbox.colStep"), t("admin.sandbox.colTime")]
    const body = []
    for (const run of runs) {
      const toggle = () => { toggleIn(expandedTasks, run.id); renderTasks() }
      const tr = h("tr", { class: "row-clickable", tabindex: "0" },
        h("td", { text: run.host }),
        h("td", {}, h("span", { class: runStateClass(run.status), text: runStateLabel(run.status) })),
        h("td", { text: run.step ?? "—" }),
        h("td", { text: run.startedAt ? ctx.fmtTs(run.startedAt) : "—" }))
      tr.addEventListener("click", toggle)
      tr.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle() } })
      body.push(tr)
      if (expandedTasks.has(run.id)) body.push(h("tr", { class: "detail-row" }, h("td", { colspan: String(headers.length) }, taskDetail(run))))
    }
    taskBox.replaceChildren(h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...body))))
  }

  /** 展开体：失败 ⇒ 停在哪步；步骤清单 + 读数（详情面懒取）；keep 态 ⇒ 撤销凭据钮（二次确认）。 */
  function taskDetail(run) {
    const nodes = []
    if (RUN_TERMINAL.has(run.status) && !RUN_READY.has(run.status)) {
      nodes.push(h("p", { class: "hint error", text: t("admin.sandbox.stopAt", { step: run.step ?? "—" }) }))
    }
    const cached = detailCache.get(run.id)
    if (cached === undefined || cached.step !== run.step) { // 列表不外携读数 ⇒ 展开取详情一次（步变重取）
      detailCache.set(run.id, { step: run.step, steps: null })
      ctx.api(`/api/admin/sandbox/onboarding/${run.id}`).then((data) => {
        detailCache.set(run.id, { step: run.step, steps: data?.run?.steps ?? [] })
        if (expandedTasks.has(run.id)) renderTasks()
      }).catch((error) => { detailCache.set(run.id, { step: run.step, steps: [] }); if (expandedTasks.has(run.id)) { ctx.fail(error); renderTasks() } })
    }
    const steps = detailCache.get(run.id)?.steps ?? null
    if (steps === null) nodes.push(h("p", { class: "hint", text: t("common.loading") }))
    else if (steps.length > 0) nodes.push(h("ul", { class: "step-list" }, ...steps.map((entry) => stepItem(h, entry))))
    if (run.credential?.mode === "keep" && run.credential?.state !== "revoked") nodes.push(h("div", { class: "info-actions" }, h("button", { type: "button", class: "tiny", text: t("admin.sandbox.revoke"), onclick: () => openRevokeModal(ctx, { run, reload: loadTasks }) })))
    return h("div", { class: "stack-box" }, ...nodes)
  }

  await loadRunners()
  await loadTasks()
}

/** 添加节点弹窗（名 + 地址）；提交 ⇒ 自检中态；成：关窗 + flash + 刷新；败：窗内就地人话 + 草稿不丢。 */
function openAddRunnerModal(ctx, { reload }) {
  const { h } = ctx
  const nameInput = h("input", { placeholder: t("admin.sandbox.namePh") })
  const addressInput = h("input", { placeholder: t("admin.sandbox.addressPh") })
  const note = h("p", { class: "hint error", hidden: true })
  const submitBtn = h("button", { type: "submit", text: t("admin.sandbox.addRunner") })
  const modal = openModal({
    title: t("admin.sandbox.addRunner"),
    body: h("form", { class: "provider-form stacked", novalidate: true, onsubmit: submit }, field(h, "admin.sandbox.name", nameInput), field(h, "admin.sandbox.address", addressInput), note, submitBtn),
  })

  async function submit(event) {
    event.preventDefault()
    note.hidden = true
    const name = nameInput.value.trim()
    const address = addressInput.value.trim()
    if (name === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.name") }))
    if (address === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.address") }))
    submitBtn.disabled = true
    showNote(note, t("admin.sandbox.checking"), false) // 自检中态（服务端连通自检——§2.5 添加节点行）
    try {
      await ctx.api("/api/admin/sandbox/runners", { method: "POST", body: { name, address } })
      ctx.flash(t("admin.sandbox.added", { name }))
      modal.close()
      await reload()
    } catch (error) {
      submitBtn.disabled = false
      showNote(note, mapError(error)) // 窗内就地人话（502 携引擎原文）；草稿不丢（输入不清）
    }
  }
}

/** 删除节点弹窗：读容器清单 ⇒ 有容器 ⇒ 列数 + 二选一「保留 ∥ 连删」；无容器/不可达 ⇒ 单确认（不可达明示保留语义）。 */
function openRemoveRunnerModal(ctx, { runner, reload }) {
  const { h } = ctx
  const bodyBox = h("div", {}, h("p", { class: "hint", text: t("common.loading") }))
  const note = h("p", { class: "hint error", hidden: true })
  const footBox = h("div", { class: "row-form" })
  let choice = "keep"
  const cancelButton = () => h("button", { type: "button", class: "tiny", text: t("common.cancel"), onclick: () => modal.close() })
  const confirmBtn = h("button", { type: "button", class: "danger", text: t("admin.sandbox.remove") })
  confirmBtn.addEventListener("click", () => submit())
  const modal = openModal({ title: t("admin.sandbox.removeRunnerTitle"), body: bodyBox, footer: footBox })
  const radio = (value, labelKey) => {
    const input = h("input", { type: "radio", name: "runner-dispose", value, checked: value === choice })
    input.addEventListener("change", () => { choice = value })
    return h("label", { class: "key-clear" }, input, t(labelKey))
  }

  const submit = () => submitThen(ctx, {
    note, button: confirmBtn, modal, reload,
    call: () => ctx.api(`/api/admin/sandbox/runners/${runner.id}`, { method: "DELETE", body: { containers: choice } }),
    flash: t("admin.sandbox.runnerDeleted", { name: runner.name }),
  })

  ctx.api(`/api/admin/sandbox/runners/${runner.id}/containers`).then((data) => {
    const containers = data?.containers ?? []
    bodyBox.replaceChildren(...(containers.length === 0
      ? [h("p", { class: "hint", text: t("admin.sandbox.removeRunnerConfirm", { name: runner.name }) }), note]
      : [h("p", { class: "hint", text: t("admin.sandbox.runnerContainers", { count: containers.length }) }), radio("keep", "admin.sandbox.keepContainers"), radio("remove", "admin.sandbox.removeContainers"), note]))
    footBox.replaceChildren(confirmBtn, cancelButton())
  }).catch(() => {
    choice = "keep" // 不可达 ⇒ 仅 keep 可过（§2.5 删除节点行）
    bodyBox.replaceChildren(h("p", { class: "hint", text: t("admin.sandbox.runnerUnreachable") }), note)
    footBox.replaceChildren(confirmBtn, cancelButton())
  })
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

/** 托管接入弹窗（八字段——地址/端口/用户/认证 + 秘密/sudo 口令/名称/模型/凭据处置 + S5 窗内预告知句）；
 *  模型下拉源 = provider 注册表现有模型（`/api/admin/providers` 展平）；提交 ⇒ 闭窗 + 装机任务在列；败 ⇒ 窗内人话。 */
function openOnboardingModal(ctx, { reload }) {
  const { h } = ctx
  const hostInput = h("input", { placeholder: t("admin.sandbox.onboardingHostPh") })
  const portInput = h("input", { type: "number", min: "1", step: "1", value: "22" })
  const userInput = h("input")
  const kindSelect = h("select", {}, h("option", { value: "key", text: t("admin.sandbox.authKey") }), h("option", { value: "password", text: t("admin.sandbox.authPassword") }))
  const secretTitle = h("span", { text: t("admin.sandbox.secretKey") })
  const secretInput = h("textarea", { rows: "3", autocomplete: "off", placeholder: t("admin.sandbox.secretPh") })
  const secretField = h("label", {}, secretTitle, secretInput)
  const sudoInput = h("input", { type: "password", autocomplete: "off" })
  const nameInput = h("input")
  const modelSelect = h("select", {}, h("option", { value: "", text: t("admin.sandbox.modelPick") }))
  const modeSelect = h("select", {}, h("option", { value: "burn", text: t("admin.sandbox.credBurn") }), h("option", { value: "keep", text: t("admin.sandbox.credKeep") }))
  const note = h("p", { class: "hint error", hidden: true })
  const submitBtn = h("button", { type: "submit", text: t("admin.sandbox.onboardingStart") })
  kindSelect.addEventListener("change", () => {
    secretTitle.textContent = t(kindSelect.value === "key" ? "admin.sandbox.secretKey" : "admin.sandbox.secretPassword")
  })

  const modal = openModal({
    title: t("admin.sandbox.onboardingBtn"),
    body: h("form", { class: "provider-form stacked", novalidate: true, onsubmit: submit },
      field(h, "admin.sandbox.onboardingHost", hostInput),
      field(h, "admin.sandbox.onboardingPort", portInput),
      field(h, "admin.sandbox.onboardingUser", userInput),
      field(h, "admin.sandbox.authKind", kindSelect),
      secretField,
      field(h, "admin.sandbox.sudoSecret", sudoInput),
      field(h, "admin.sandbox.onboardingName", nameInput),
      field(h, "admin.sandbox.model", modelSelect),
      field(h, "admin.sandbox.credentialMode", modeSelect),
      h("p", { class: "hint", text: t("admin.sandbox.s5Notice") }),
      note,
      submitBtn),
  })

  // 模型下拉源（provider 注册表现有模型——零新端点）；空/失败 ⇒ 提示项 + 提交门（前端先行）
  ctx.api("/api/admin/providers").then((data) => {
    const models = deriveModels(data?.providers ?? [])
    modelSelect.replaceChildren(...(models.length === 0 ? [h("option", { value: "", text: t("admin.sandbox.noModels") })] : [h("option", { value: "", text: t("admin.sandbox.modelPick") }), ...models.map((row) => h("option", { value: row.id, text: row.id }))]))
  }).catch(() => modelSelect.replaceChildren(h("option", { value: "", text: t("admin.sandbox.noModels") })))

  async function submit(event) {
    event.preventDefault()
    note.hidden = true
    const host = hostInput.value.trim()
    const sshUser = userInput.value.trim()
    const secret = secretInput.value
    const model = modelSelect.value
    if (host === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.onboardingHost") }))
    if (sshUser === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.onboardingUser") }))
    if (secret === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.secretKey") }))
    if (model === "") return showNote(note, t("admin.sandbox.fieldRequired", { field: t("admin.sandbox.model") }))
    const body = { host, sshUser, auth: { kind: kindSelect.value, secret }, model, credentialMode: modeSelect.value }
    const port = portInput.value.trim()
    if (port !== "") body.sshPort = Number(port) // 缺省 22 由服务端兜（空 ⇒ 省略键）
    if (sudoInput.value !== "") body.sudoSecret = sudoInput.value // 可选——缺省先试免密
    const name = nameInput.value.trim()
    if (name !== "") body.name = name // 可选——缺省取探测主机名
    submitBtn.disabled = true
    showNote(note, t("admin.sandbox.submitting"), false)
    try {
      await ctx.api("/api/admin/sandbox/onboarding", { method: "POST", body })
      ctx.flash(t("admin.sandbox.onboardingStarted"))
      modal.close()
      await reload()
    } catch (error) {
      submitBtn.disabled = false
      showNote(note, mapError(error)) // 400 逐字段人话（零落库）
    }
  }
}

/** 撤销凭据弹窗（keep 态——二次确认；只清服务器侧存留）。 */
function openRevokeModal(ctx, { run, reload }) {
  const { modal, note, confirmBtn } = confirmModal(ctx, { title: "admin.sandbox.revoke", bodyText: "admin.sandbox.revokeConfirm", confirmText: t("admin.sandbox.revoke"), submit: () => submit() })
  const submit = () => submitThen(ctx, {
    note, button: confirmBtn, modal, reload,
    call: () => ctx.api(`/api/admin/sandbox/onboarding/${run.id}/credential`, { method: "DELETE" }),
    flash: t("admin.sandbox.revoked"),
  })
}
