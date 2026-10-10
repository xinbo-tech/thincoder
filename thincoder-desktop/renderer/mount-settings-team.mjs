/**
 * mount-settings-team.mjs — 设置面**团队段接线族**（B1 批 · 2026-10-10 · 台账 #1212）：状态读（`loadTeam`——
 * `team:status`）∥ 出口（登录 ∥ 退出两件）∥ 写成功径**复读两调用点**（`team:status` 复读 + `loadProviders`
 * 复读——派生条目随动）。
 * 接线沿段族工厂先例：`createTeam(deps)`（`deps = { ask, store, setSettings, report, loadProviders, invalidateDrafts }`）
 * ⇒ `{ loadTeam, handlers, resetNotice }`；`loadTeam` 经装配并入 `reads` 检索面（`MODAL_READS.team`），`handlers` 并入单一
 * handlers 表（装配即合并，对外零改——`mount-settings.mjs`）。
 * 语义锚（`docs/desktop/design/SETTINGS.md` §2.21 ∥ `docs/desktop/design/IPC.md` §2 团队族行 ∥ `docs/core/design/TEAM.md` §2）：
 *   回执形 = `team:login` `{ ok, reason?, notice? }` ∥ `team:logout` `{ ok, revokeDelivered? }`（缺席 = true）；
 *   两条提示 = 一次性事件（当刻就地显示——`team:status` 复读**不带**提示字段 ⇒ 读面零清）；写失败 ⇒ 就地错误行（四句逐字同）。
 * 纪律：零 `node:` ∕ 零裸包 · 端侧失败零静默（`console.error`）· 逐通道回执形单源 = IPC.md §2。
 */

/** 登录提示码（核 `NOTICE_MANUAL_NAME_CONFLICT` 同值——渲染面零核 import；字面单源 = `IPC.md` §2 团队族行）。 */
const MANUAL_NAME_CONFLICT = "manual-name-conflict"

/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)
/** 对象切片归一：缺 / 非对象 ⇒ `null`（禁假造——投影面同判）。 */
const objOf = (value) => (value !== null && typeof value === "object" ? value : null)
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（四值域 ∥ 表外原样——零吞）；缺 ⇒ 端侧形判码（零静默——调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/** 团队段接线族工厂（`deps.loadProviders` = 写成功径派生条目随动复读口；`deps.report` = 面级失败串落位）。 */
export function createTeam(deps = {}) {
  const { ask, store, setSettings, report, invalidateDrafts } = deps
  const loadProviders = typeof deps.loadProviders === "function" ? deps.loadProviders : null

  /** 段切片局部写（合并 —— 读面并持 `notice`：一次性提示不随复读清）。 */
  const setTeamSlice = (patch) => {
    const held = store.get().settings?.team ?? {}
    setSettings({ team: { ...held, ...patch } })
  }

  /** 团队表单现读面（宿主无关）：文档序末位 `[data-form="team"]`（页体 ∥ 组弹窗体——弹窗体挂 `body` 尾 ⇒ 交互面）；
   *  无 DOM 面 ⇒ `null`（退化式——沿 MCP 表单现读面同式）。 */
  function teamFormNode() {
    if (typeof document?.querySelectorAll !== "function") return null
    const forms = document.querySelectorAll('[data-form="team"]')
    const form = forms.length > 0 ? forms[forms.length - 1] : null
    return form !== null && typeof form.querySelectorAll === "function" ? form : null
  }

  /** 团队状态读（`team:status`——生产面：装配 `MODAL_READS.team` ∥ 开面随读 ∥ 写成功径复读）：成功 ⇒ 段转 `ready`
   *  并刷四键（读面不携提示字段 ⇒ `notice` 并持零清）；失败 ⇒ 段归 `none` + 面级失败串（零静默）。 */
  async function loadTeam() {
    setTeamSlice({ state: "loading" })
    const receipt = await ask("team:status")
    const held = store.get().settings?.team ?? {}
    if (receipt?.ok !== true) {
      setSettings({ team: { ...held, state: "none", loggedIn: false, server: null, member: null, label: null } })
      if (typeof report === "function") report("team", receipt, "team:status")
      return null
    }
    setSettings({
      notice: null,
      team: {
        ...held,
        state: "ready",
        loggedIn: receipt.loggedIn === true,
        server: str(receipt.server),
        member: objOf(receipt.member),
        label: str(receipt.label),
      },
    })
    return receipt
  }

  /** 登录出口（`team:login`）：表单自读（`server` ∥ `username` ∥ `password`）——不全 ⇒ **端侧表单门**（零发送；
   *  分类同核兜底面：无地址 ⇒ `network` ∥ 凭据不全 ⇒ `credentials`）；成 ⇒ 两提示当刻就地（§2.21、码不携文）
   *  + **回执后复读两调用点**（`team:status` 段转登录态 + `loadProviders` 派生条目随动）。 */
  async function login() {
    const form = teamFormNode()
    if (form === null) {
      console.error("[renderer] team:login skipped: no team form in DOM")
      return
    }
    const data = new FormData(form)
    const server = String(data.get("server") ?? "").trim()
    const username = String(data.get("username") ?? "").trim()
    const password = String(data.get("password") ?? "")
    if (server === "" || username === "" || password === "") {
      console.error("[renderer] team:login skipped: incomplete form")
      setTeamSlice({ notice: { kind: "failure", reason: server === "" ? "network" : "credentials" } })
      return
    }
    const receipt = await ask("team:login", { server, username, password })
    if (receipt?.ok !== true) {
      const reason = reasonOf(receipt)
      console.error(`[renderer] team:login failed: ${reason}`)
      setTeamSlice({ notice: { kind: "failure", reason } })
      return
    }
    // #652 写成功径：该表单草稿一次性作废（作用域 = 表单自携 `data-draft-scope` —— 单源在视图档）。
    invalidateDrafts?.(typeof form.getAttribute === "function" ? form.getAttribute("data-draft-scope") : null)
    setTeamSlice({ notice: receipt.notice === MANUAL_NAME_CONFLICT ? { kind: "manualConflict" } : null })
    await loadTeam()
    if (loadProviders !== null) await loadProviders()
  }

  /** 退出出口（`team:logout`）：成 ⇒ 两提示当刻就地（`revokeDelivered === false`——缺席 = true ⇒ 「服务端吊销未达」）
   *  + 复读两调用点（段转未登录态 ∥ 派生条目 `apiKey` 摘除 ⇒ 行面隐藏）。 */
  async function logout() {
    const receipt = await ask("team:logout")
    if (receipt?.ok !== true) {
      const reason = reasonOf(receipt)
      console.error(`[renderer] team:logout failed: ${reason}`)
      setTeamSlice({ notice: { kind: "failure", reason } })
      return
    }
    setTeamSlice({ notice: receipt.revokeDelivered === false ? { kind: "revokeFailed" } : null })
    await loadTeam()
    if (loadProviders !== null) await loadProviders()
  }

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域）。 */
  const handlers = {
    onTeamLogin: () => void login(),
    onTeamLogout: () => void logout(),
  }

  /** 段面态复位（**本组面态复位**——开面两径调用：当刻一次性提示随开面清（切片余键并持——值面非面态）；
   *  空 ∕ 无 ∕ 已清 ⇒ 零写（免空转重绘））。 */
  function resetNotice() {
    const held = store.get().settings?.team ?? {}
    if (held.notice === null || held.notice === undefined) return
    setSettings({ team: { ...held, notice: null } })
  }

  return { loadTeam, handlers, resetNotice }
}
