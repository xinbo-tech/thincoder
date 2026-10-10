/**
 * mount-team.mjs — 团队面接线族（登录面补全批 · 2026-10-10 · 台账 #1231；`createTeam` 自 `mount-settings-team.mjs`
 * 迁入 —— 单实现，旧档净删）：状态读（`loadTeam`——`team:status`）∥ 活校验（`verify`——`team:verify`）∥
 * 出口（登录 ∥ 退出两件）∥ **状态段就地面板宿主**（`div.team-pop`——`position: fixed`·状态行上方·就地；
 * **零背板 ∥ 零遮罩**）∥ 面板开合桥（视图档 `renderer/views/statusline.mjs` `toggleTeamPanel` ⇄ 本档施用面
 * `setTeamPanelApplier`）。
 *
 * 语义锚（`docs/desktop/design/UI.md` §1 本批注（团队登录态段） ∥ `docs/desktop/design/SETTINGS.md` §2.22 ∥
 * `docs/desktop/design/IPC.md` §2 团队族行 ∥ `docs/core/design/TEAM.md` §2.5 ∥ §2.6）：
 *   ① 三态（判序写死）= 未登录 ∥ 已失效（`verify === "invalid"`）∥ 已登录（`valid` ∥ `null` ∥ `unreachable`
 *      同判 —— **离线容忍**，不判失效）；面板内容 = `teamBody`（单一 owner = `views/settings-sections-team.mjs`）。
 *   ② 活校验**触发点制**（零周期轮询）：启动一次 ∥ 面板开（本档 `refresh` 两处同一实现）；他端点 = CLI `/team status`。
 *   ③ 写成功径复读两调用点（`team:status` + `loadProviders`——派生条目随动）；`verify` 清位两处（退出落盘后状态复读
 *      见 token 缺席 ⇒ 清 ∥ 重登成 ⇒ 清——新 token 新判）。
 *   ④ 关三路 = 段再点（视图档翻转）∥ Esc ∥ 面板外点击；**Esc 优先序写死**：面板在场 ⇒ 仅关面板（文档级**捕获相**
 *      截获 —— 不连带既有 document 级 Esc 面：F-Esc 关页 ∥ 弹窗专指 ∥ 会话控制选择器）；开面复位 = 当刻一次性提示清。
 *   ⑤ 重绘 = 本档自持订阅（面板在场才响应；`settings` ∥ `locale` 两键）＋**面内差分门**（签名等价 ⇒ 零写 ——
 *      免无关设置子片写重挂吞未提交草稿）；重挂前捕快照 ∥ 后复填（#604 口径：地址 ∥ 用户名保真，密码不申报 ⇒ 恒清空）。
 * 纪律：零 `node:` ∥ 零裸包 · 端侧失败零静默（`console.error`）· 逐通道回执形单源 = IPC.md §2 ·
 * 面板树 = `teamBody` 单一实现（本档零第二构形 —— 仅宿主 ∥ 施用）。
 */
import { build } from "./dom.mjs"
import { captureView, mergeViewSnaps, restoreView } from "./view-state.mjs"
import { teamBody } from "./views/settings-sections-team.mjs"
import { closeTeamPanel, setTeamPanelApplier, teamPanelVisible } from "./views/statusline.mjs"

/** 登录提示码（核 `NOTICE_MANUAL_NAME_CONFLICT` 同值——渲染面零核 import；字面单源 = `IPC.md` §2 团队族行；
 *  **导出**：首启向导团队路同判（单一副本 —— `mount-onboarding.mjs` 取用）。 */
export const MANUAL_NAME_CONFLICT = "manual-name-conflict"

/** 活校验三值闭集（核 `teamVerify()` 返回域——表外 ⇒ 端侧落 `null`，禁假造）。 */
const VERIFY_STATES = Object.freeze(["valid", "invalid", "unreachable"])

/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)
/** 对象切片归一：缺 / 非对象 ⇒ `null`（禁假造——投影面同判）。 */
const objOf = (value) => (value !== null && typeof value === "object" ? value : null)
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（四值域 ∥ 表外原样——零吞）；缺 ⇒ 端侧形判码（零静默——调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/** 团队切片读（缺 ⇒ 空表 —— 不猜）。 */
const teamOf = (state) => state?.settings?.team ?? {}

/** 团队面工厂（`deps.loadProviders` = 写成功径派生条目随动复读口；`deps.report` = 面级失败串落位）。
 *  返回 `{ loadTeam, verify, refresh, handlers, resetNotice }`。 */
export function createTeam(deps = {}) {
  const { ask, store, setSettings, report, invalidateDrafts } = deps
  const loadProviders = typeof deps.loadProviders === "function" ? deps.loadProviders : null

  /** 段切片局部写（合并 —— 读面并持 `notice`：一次性提示不随复读清）。 */
  const setTeamSlice = (patch) => {
    const held = teamOf(store.get())
    setSettings({ team: { ...held, ...patch } })
  }

  /** 团队表单现读面（宿主无关）：文档序末位 `[data-form="team"]`（面板体 ∥ 组弹窗体——挂 `body` 尾 ⇒ 交互面）；
   *  无 DOM 面 ⇒ `null`（退化式——沿 MCP 表单现读面同式）。 */
  function teamFormNode() {
    if (typeof document?.querySelectorAll !== "function") return null
    const forms = document.querySelectorAll('[data-form="team"]')
    const form = forms.length > 0 ? forms[forms.length - 1] : null
    return form !== null && typeof form.querySelectorAll === "function" ? form : null
  }

  /** 团队状态读（`team:status`——生产面：装配 `MODAL_READS.team` ∥ 开面随读 ∥ 面板开合读 ∥ 写成功径复读）：成功 ⇒
   *  段转 `ready` 并刷四键（读面不携提示字段 ⇒ `notice` 并持零清）；`verify` **清位**（`TEAM.md` §2.6 不变式——
   *  状态复读见 token 缺席 ⇒ 清；在场 ⇒ 并持现判）；失败 ⇒ 段归 `none` + 面级失败串（零静默）。 */
  async function loadTeam() {
    setTeamSlice({ state: "loading" })
    const receipt = await ask("team:status")
    const held = teamOf(store.get())
    if (receipt?.ok !== true) {
      setSettings({ team: { ...held, state: "none", loggedIn: false, server: null, member: null, label: null } })
      if (typeof report === "function") report("team", receipt, "team:status")
      return null
    }
    const loggedIn = receipt.loggedIn === true
    setSettings({
      notice: null,
      team: {
        ...held,
        state: "ready",
        loggedIn,
        server: str(receipt.server),
        member: objOf(receipt.member),
        label: str(receipt.label),
        verify: loggedIn ? (held.verify ?? null) : null,
      },
    })
    return receipt
  }

  /** 登录态活校验（`team:verify`——触发点制②；核面只读三值）：`ok` 真 ∧ 三值内 ⇒ 直落切片；未登录回执
   *  （`ok:false`——端侧零调核）∥ 形不合 ⇒ 落 `null`（未登录 ∥ 未知面按未登录渲染；**不假报失效**）+ 记错。 */
  async function verify() {
    const receipt = await ask("team:verify")
    if (receipt?.ok !== true) {
      setTeamSlice({ verify: null })
      return null
    }
    if (!VERIFY_STATES.includes(receipt.state)) {
      console.error(`[renderer] team:verify: unknown state ${String(receipt.state)}`)
      setTeamSlice({ verify: null })
      return null
    }
    setTeamSlice({ verify: receipt.state })
    return receipt.state
  }

  /** 启动读 ∥ 面板开合读（**同一实现**——触发点①②）：`team:status` 复读 + token 在场 ⇒ 活校验。 */
  async function refresh() {
    const receipt = await loadTeam()
    if (receipt?.loggedIn === true) await verify()
    return receipt
  }

  /** 登录出口（`team:login`）：表单自读（`server` ∥ `username` ∥ `password`）——不全 ⇒ **端侧表单门**（零发送；
   *  分类同核兜底面：无地址 ⇒ `network` ∥ 凭据不全 ⇒ `credentials`）；成 ⇒ 两提示当刻就地（`IPC.md` §2、码不携文）
   *  + `verify` 清（重登成 ⇒ 新 token 新判）+ **回执后复读两调用点**（`team:status` 段转登录态 + `loadProviders` 派生条目随动）。 */
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
    setTeamSlice({ notice: receipt.notice === MANUAL_NAME_CONFLICT ? { kind: "manualConflict" } : null, verify: null })
    await loadTeam()
    if (loadProviders !== null) await loadProviders()
  }

  /** 退出出口（`team:logout`）：成 ⇒ 两提示当刻就地（`revokeDelivered === false`——缺席 = true ⇒ 「服务端吊销未达」）
   *  + 复读两调用点（段转未登录态 ∥ 派生条目 `apiKey` 摘除 ⇒ 行面隐藏）；复读见 token 缺席 ⇒ `verify` 同清（`loadTeam`）。 */
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

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域；面板体消费）。 */
  const handlers = {
    onTeamLogin: () => void login(),
    onTeamLogout: () => void logout(),
  }

  /** 段面态复位（**本组面态复位**——开面三径调用：当刻一次性提示随开面清（切片余键并持——值面非面态）；
   *  空 ∕ 无 ∕ 已清 ⇒ 零写（免空转重绘））。 */
  function resetNotice() {
    const held = teamOf(store.get())
    if (held.notice === null || held.notice === undefined) return
    setSettings({ team: { ...held, notice: null } })
  }

  return { loadTeam, verify, refresh, handlers, resetNotice }
}

/** ── 状态段就地面板宿主（单例 —— 挂 `document.body`；零背板 ∥ 零遮罩） ─────────────────────────────── */

/** 现态面板根（关态 ⇒ `null`；机检面 ∥ 施用面读数）。 */
let panelRoot = null
/** 面板残件（跨在途重挂携带 —— `mergeViewSnaps`；关态弃）。 */
let panelResidue = null
/** 面板签名（面内差分门——等价 ⇒ 零写）。 */
let panelSig = null
/** 文档级两路绑定（模块级一次性 —— 同一文档不重复挂）。 */
let dismissBound = false

/** 面板树（纯构树——内容 = `teamBody`（单一 owner = `views/settings-sections-team.mjs`）：结果行 ∥ 失效行 ∥
 *  未登录表单 / 已登录详情 + 退出钮；本档零第二构形）。 */
export function teamPanelTree(team, handlers) {
  return { tag: "div", props: { class: "team-pop", "data-team-pop": "" }, children: teamBody(team, handlers) }
}

/** 面板模型签名（面内差分门 —— 等价 ⇒ 零写：免无关 `settings` 子片写重挂吞未提交草稿）；段态切片（`state`）
 *  **不入门**（面板不渲染段态 —— 在途 / 就绪两拍不扰表单）。 */
function panelSignature(state) {
  const team = teamOf(state)
  return JSON.stringify([
    state?.locale ?? null,
    [team.loggedIn === true, team.verify ?? null, team.server ?? null, team.member ?? null, team.label ?? null, team.notice ?? null],
  ])
}

/** 就地锚（状态行上方 —— 段矩形为准）：无布局面（测试 ∥ 段缺）⇒ 零写（`settings.css` 定位兜底 = 右下固定）。 */
function anchorPanel(root) {
  if (root?.style == null || typeof document?.querySelector !== "function") return
  const segment = document.querySelector('[data-seg="team"]')
  const rect = typeof segment?.getBoundingClientRect === "function" ? segment.getBoundingClientRect() : null
  if (rect === null || typeof window === "undefined") return
  const gap = 8
  const width = Number.isFinite(root.offsetWidth) && root.offsetWidth > 0 ? root.offsetWidth : 0
  const left = Math.max(gap, Math.min(rect.left, (window.innerWidth ?? 0) - width - gap))
  root.style.left = `${left}px`
  root.style.bottom = `${Math.max(gap, (window.innerHeight ?? 0) - rect.top + 4)}px`
}

/** 面板退场（撤件 + 残件弃；已关 ⇒ 零动作）。 */
function removePanel() {
  if (panelRoot === null) return
  panelRoot.remove()
  panelRoot = null
  panelResidue = null
  panelSig = null
}

/**
 * 团队面装配（挂载面调用一次）：注册面板开合施用面（视图档 `toggleTeamPanel` ⇄ 本档）+ 文档级关两路
 * （Esc ∥ 面板外点击）+ 自持重绘订阅。返回 `{ refresh, paintPanel, detach }`（`refresh` = 启动读 ∥ 面板开合读
 * —— 装配面 `renderer/app.mjs` 触发启动读；`paintPanel` = 施用面读数口）。
 */
export function attachTeamPanel({ store, team } = {}) {
  const currentState = () => (typeof store?.get === "function" ? store.get() : {})
  const handlersFor = () => team?.handlers ?? {}

  /** 面板挂 / 刷 / 撤（单例）：关态 ⇒ 撤件（零残留）；开态 ⇒ 首建 ∥ 换内容（面内差分门：签名等价 ⇒ 零写；
   *  重挂前捕快照 ∥ 后复填 —— #604 口径：`data-draft` 申报件（地址 ∥ 用户名）保真，密码不申报 ⇒ 恒清空）。 */
  function paintPanel(state = currentState()) {
    if (!teamPanelVisible()) {
      removePanel()
      return null
    }
    const body = typeof document !== "undefined" ? document.body ?? document.documentElement : null
    if (body === null || body === undefined || typeof body.append !== "function") {
      console.error("[renderer] team panel: overlay host unavailable")
      return null
    }
    const sig = panelSignature(state)
    if (panelRoot !== null && sig === panelSig) return panelRoot
    const next = build(teamPanelTree(teamOf(state), handlersFor()))
    if (panelRoot === null) {
      body.append(next)
      panelRoot = next
    } else {
      const snap = mergeViewSnaps(panelResidue, captureView(panelRoot), { trust: true })
      panelRoot.replaceWith(next)
      panelRoot = next
      panelResidue = restoreView(next, snap)
    }
    anchorPanel(next) // **两径同锚**（面宽可变：登录表单 ↔ 三读数 —— 免旧 clamp 值越窗右缘）
    panelSig = sig
    return panelRoot
  }

  /** 开合施用面（视图档 `toggleTeamPanel` 注入）：开 ⇒ 开面复位（当刻一次性提示清）+ 先绘（现切片）+ 就地在途读
   *  （`refresh`——触发点②）；合 ⇒ 撤件（零残留）。宿主缺（无 `document`）⇒ 记错零动作（零静默）。 */
  function applyPanel(open) {
    if (!open) {
      paintPanel()
      return
    }
    if (typeof document === "undefined") {
      console.error("[renderer] team panel: document unavailable")
      return
    }
    team?.resetNotice?.()
    paintPanel()
    void team?.refresh?.()
  }

  /** 文档级两路 + 窗口改宽重锚（**一次性**——模块级旗；两路零 store 捕获 ⇒ 跨装配安全）：
   *  ① Esc（**捕获相** —— 优先序写死：面板在场 ⇒ 仅关面板，`stopPropagation` 截获不触既有冒泡相 Esc 面）；
   *  ② 面板外点击（冒泡相）：面板内 ∥ 段自身（段自持翻转 ⇒ 零双判）⇒ 零动作；
   *  ③ `resize`：面板在场 ⇒ 就地重锚（面宽 ∥ 段矩形双变——免越窗）。 */
  function bindDismiss() {
    if (dismissBound || typeof document?.addEventListener !== "function") return
    dismissBound = true
    document.addEventListener("keydown", (event) => {
      if (event?.key !== "Escape" || !teamPanelVisible()) return
      event.stopPropagation?.()
      closeTeamPanel()
    }, true)
    document.addEventListener("click", (event) => {
      if (!teamPanelVisible()) return
      const target = event?.target ?? null
      if (panelRoot !== null && typeof panelRoot.contains === "function" && target !== null && panelRoot.contains(target)) return
      const segment = typeof document.querySelector === "function" ? document.querySelector('[data-seg="team"]') : null
      if (segment !== null && typeof segment.contains === "function" && target !== null && segment.contains(target)) return
      closeTeamPanel()
    })
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", () => {
        if (teamPanelVisible() && panelRoot !== null) anchorPanel(panelRoot)
      })
    }
  }

  /** 自持重绘订阅（面板在场才响应；触发切片 `settings` ∥ `locale`——段 16 同源两键）。 */
  const detach = typeof store?.subscribe === "function"
    ? store.subscribe((state, changedKeys) => {
      if (!teamPanelVisible()) return
      const keys = Array.isArray(changedKeys) ? changedKeys : []
      if (!keys.includes("settings") && !keys.includes("locale")) return
      paintPanel(state)
    })
    : () => {}

  setTeamPanelApplier(applyPanel)
  bindDismiss()
  return { refresh: () => team?.refresh?.(), paintPanel, detach }
}
