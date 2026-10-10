/**
 * mount-onboarding.mjs — 首启向导接线族（批 B · 自 `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，
 * 零语义变化）：步进 / 收尾 / 目录出口 + 出口族。共享项（渠道提交 / 渠道校验 / 模型候选复读 / 渠道复读）**由装配面注入**
 * （`deps` —— 单一 owner 住 `mount-settings.mjs`，本档零副本）。
 * **登录面补全批（2026-10-10 · 台账 #1230）**：+路由屏选取（`chooseRoute`——团队 ⇒ 团队表单屏 ∥ 本地 ⇒ 本地步 1）∥
 * 回退（`backToRoute`——回路由屏，已填随 `data-draft` 域保真）∥ 团队表单提交（`team:login`——成 / 败两径：
 * 成 ⇒ 派生条目复读 + 进步 2；败 ⇒ 四句逐字就地；同名冲突 ⇒ 当刻就地提示 + **并入步 2 头行**（消费即清 = 离步 2 ∥ 退场））。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注 ∥ `docs/desktop/design/SETTINGS.md` §2.22）：
 *   ① 步闭集 = `store.mjs` `WIZARD_STEPS`（`"route"` ∥ `"team"` ∥ 1–3；步进 = store 纯动作 `setWizardStep`；
 *      步入步 2 ⇒ 模型候选面随动）；路由 / 团队两屏无「下一步」——推进 = 卡选取 ∥ 登录成。
 *   ② 步 3 目录出口走装配面项目面链（`onProjectOpened` = `app.mjs` `openDir`，含刷新 + 「点开即可续」）
 *      —— 本档零算法副本。
 *   ③ 收尾复读配置闸（`config:read` ⇒ 三态归一）⇒ 落槽；仍未配 ⇒ 退场旗（会话内幂等，下次冷启动重新过闸）；
 *      成功判据 = 回执携布尔 `configured`（该通道无 `ok` 旗标——读失败 fail-loud 抛出；形源 = `thincoder-desktop/src/main/ipc.mjs:103-104`）。
 *   ④ 失败面零静默：目录钩缺 / 收尾读失败 ⇒ `deps.report` 落面串（表内码 / 核错误串直传，词面归视图 `reasonWord`）。
 * 纪律：零 `node:` / 零裸包 · 本档 import 面 = `store.mjs` 纯动作 ∥ 视图常量（`views/onboarding.mjs`）∥ 团队面档
 * （`mount-team.mjs`——同名冲突码字面单源；**零反向** —— 装配面单向往回，无环）。
 */
import { configuredFlag, dismissWizard, patchSettings, setWizardStep } from "./store.mjs"
// 两屏步值（显示面同源 —— `views/onboarding.mjs` 导出；纯常量，零反向）与同名冲突码（字面单源 = `IPC.md` §2 团队族行）。
import { MANUAL_NAME_CONFLICT } from "./mount-team.mjs"
import { ROUTE_STEP, TEAM_STEP } from "./views/onboarding.mjs"

/** 向导切片读数（缺 ⇒ 空表 —— 不猜）。 */
const wizardOf = (state) => state?.settings?.wizard ?? {}

/** 向导步 1 校验（`onVerify(null)`）：自读表单现选 —— 槽内预设选择器现值；缺 ⇒ `null`（零发送）。
 *  槽锚由调用面给（单一 owner = `SETTINGS_SLOT` 所在档）—— 本档零锚串副本。
 *  **选择器随三端对齐批随正**（KD-75 ③）：单表类型选择 `name="preset"`（原 `name="name"` —— 旧预设单选）。 */
export function presetValue(slot) {
  const select = document.querySelector(`${slot} select[name="preset"]`)
  const value = select === null ? "" : String(select.value ?? "")
  return value === "" ? null : value
}

/**
 * 向导接线族：`deps` = `{ store, ask, report, clearReport, loadModels, submitChannel, verifyChannel,
 * useModel?, loadProviders?, onProjectOpened }`（共享项注入 ⇒ 本档零副本；`useModel` = 模型步「采用」接线 —— 缺 ⇒ 不落键；
 * `loadProviders` = 团队路登录成径派生条目复读口（登录面补全批）—— 缺 ⇒ 跳过复读 + 记错）；
 * 返回 `{ handlers }`（九出口 + 可选 `onUseModel` —— 与视图同域）。
 */
export function createWizard(deps = {}) {
  const { store, ask, report, clearReport, loadModels, submitChannel, verifyChannel } = deps
  const onProjectOpened = typeof deps.onProjectOpened === "function" ? deps.onProjectOpened : null
  /** 团队路复读口（登录面补全批 —— `loadProviders` 单一实现经装配面注入）。 */
  const loadProviders = typeof deps.loadProviders === "function" ? deps.loadProviders : null
  /** 模型步「采用」接线（B③ —— 单一实现 = 出口族 `onUseModel` 注入，本档零副本；**同一引用**直落视图
   *  handler 键）：缺注入 ⇒ 不落键 ⇒ 视图 `wire` 落 `disabled`（诚实非死控，零假控件）。 */
  const useModel = typeof deps.useModel === "function" ? deps.useModel : null

  /** 向导步 3 目录出口：走装配面项目面链（`openDir` —— 刷新 + 「点开即可续」，本档零副本）。 */
  async function pickDir() {
    if (onProjectOpened === null) {
      console.error("[renderer] project:open hook missing: wizard dir step inactive")
      report("panel", { reason: "invalid-shape" }, "project:open")
      return
    }
    clearReport()
    await onProjectOpened()
  }

  /** 步写（store 纯动作 —— 表外 / 等值 ⇒ 原引用 ⇒ 零通知）；返回是否落写。
   *  **团队一次性提示随步收束**（登录面补全批 —— 提示消费面 = 步 2 头行）：落步 2 ⇒ 持（该屏内容）；离步 2 ⇒ 同写清。 */
  function setStep(step) {
    const state = store.get()
    const stepped = setWizardStep(state, step)
    if (stepped === state) return false
    store.set(settleTeamNotice(stepped, step === 2))
    return true
  }

  /** 团队一次性提示消费即清（判据单源 = `docs/desktop/design/SETTINGS.md` §2.22 项 2 补句）：`stay` 真（步 2 在场）⇒
   *  原样持；否则清（一次性事件消费完毕）。幂等：无提示 ∥ 形不合 ⇒ 原引用零通知（禁假造）。 */
  function settleTeamNotice(state, stay) {
    const held = state.settings?.team
    if (stay || held === null || typeof held !== "object" || held.notice == null) return state
    return patchSettings(state, { team: { ...held, notice: null } })
  }

  /** 步入步 2（模型 —— 本地步 1 ⇒ 2 与团队登录成两路共用）：步写 + 候选面随动（同一 `loadModels` 注入）。 */
  function enterModelStep() {
    const provider = store.get().settings?.model?.provider ?? null
    if (!setStep(2)) return
    void loadModels(typeof provider === "string" && provider !== "" ? provider : null)
  }

  /** 向导步进（本地步 1 / 2；路由 ∥ 团队两屏无「下一步」——表外步零动作，零静默）。 */
  function nextStep() {
    const step = wizardOf(store.get()).step
    if (step === 1) {
      enterModelStep()
      return
    }
    if (step === 2) setStep(3)
  }

  /** 路由屏卡选取（两卡锚 `[data-route]`）：团队 ⇒ 团队表单屏（同屏换取）∥ 本地 ⇒ 本地步 1（既有路，零重构）；
   *  表外 ⇒ 记错零动作。 */
  function chooseRoute(route) {
    if (route === TEAM_STEP) {
      setStep(TEAM_STEP)
      return
    }
    if (route === "local") {
      setStep(1)
      return
    }
    console.error(`[renderer] wizard: unknown route ${String(route)}`)
  }

  /** 回路由屏（「← 换一种方式」）：已填（地址 ∥ 用户名）随 `data-draft` 域保真（#604 捕获域）；密码恒清（不申报）。 */
  function backToRoute() {
    setStep(ROUTE_STEP)
  }

  /** 团队切片局部写（登录面补全批 —— 与团队面板同切片同词键：`notice` 当刻一次性 ∥ 重登成清 `verify`）。 */
  function setTeamSlice(patch) {
    const held = store.get().settings?.team ?? {}
    store.set(patchSettings(store.get(), { team: { ...held, ...patch } }))
  }

  /** 团队表单提交（团队路 —— 成 / 败两径）：载荷三键自表单现读（事件件自携 —— `wire` 直传 click 事件）；
   *  不全 ⇒ **端侧表单门**（零发送；分类同核兜底面：无地址 ⇒ `network` ∥ 凭据不全 ⇒ `credentials`）；
   *  败 ⇒ 四句逐字就地（词键归 `noticeNode`）；成 ⇒ 同名冲突当刻就地 + `loadProviders` 复读 + 进步 2。 */
  async function submitTeam(event) {
    const control = event?.currentTarget ?? event?.target ?? null
    const form = control !== null && typeof control.closest === "function" ? control.closest("form") : null
    if (form === null) {
      console.error("[renderer] wizard team:login skipped: form unavailable")
      return
    }
    const data = new FormData(form)
    const server = String(data.get("server") ?? "").trim()
    const username = String(data.get("username") ?? "").trim()
    const password = String(data.get("password") ?? "")
    if (server === "" || username === "" || password === "") {
      console.error("[renderer] wizard team:login skipped: incomplete form")
      setTeamSlice({ notice: { kind: "failure", reason: server === "" ? "network" : "credentials" } })
      return
    }
    const receipt = await ask("team:login", { server, username, password })
    if (receipt?.ok !== true) {
      const reason = typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape"
      console.error(`[renderer] wizard team:login failed: ${reason}`)
      setTeamSlice({ notice: { kind: "failure", reason } })
      return
    }
    setTeamSlice({ notice: receipt.notice === MANUAL_NAME_CONFLICT ? { kind: "manualConflict" } : null, verify: null })
    if (loadProviders === null) console.error("[renderer] wizard team:login: loadProviders hook missing")
    else await loadProviders() // 派生条目入 providers 切片（登录成 ⇒ 候选含 team 条目 —— 与面板同路同实现）
    enterModelStep()
  }

  /** 向导收尾：复读配置闸（`config:read` ⇒ 三态归一）⇒ 落槽；仍未配 ⇒ 退场旗（会话内幂等，下次冷启动重新过闸）。 */
  async function finishWizard() {
    const receipt = await ask("config:read")
    const read = typeof receipt?.configured === "boolean" // 成功判据 = 回执携布尔 configured（该通道无 ok 旗标——单源 = IPC.md §2）
    const configured = read
      ? configuredFlag(receipt.configured)
      : (store.get().settings?.configured ?? null)
    if (read) clearReport()
    else report("panel", receipt, "config:read") // 两臂互斥：失败串留面（禁「先清后报」—— 向导占槽路会把刚落的串同 tick 抹除）
    const next = patchSettings(store.get(), { configured })
    store.set(settleTeamNotice(configured === true ? next : dismissWizard(next), false)) // 退场 = 离屏 ⇒ 提示同轮收束
  }

  /** 向导出口族（九出口 + 可选 `onUseModel` —— 与视图 `handlers?.on*` 同域；前七项 = 共享项注入直通；
   *  `onUseModel` = B③ 模型步采用接线（注入即落 —— 同一引用；缺 ⇒ 零键）。 */
  const handlers = {
    onSubmit: (event) => void submitChannel(event),
    onVerify: (name) => void verifyChannel(name),
    onPickDir: () => void pickDir(),
    onNext: () => nextStep(),
    onFinish: () => void finishWizard(),
    onDismiss: () => {
      const state = store.get()
      const next = dismissWizard(state)
      if (next !== state) store.set(settleTeamNotice(next, false)) // 退场 = 离屏 ⇒ 提示同轮收束
    },
    onChooseRoute: (route) => chooseRoute(route),
    onBackToRoute: () => backToRoute(),
    onTeamLogin: (event) => void submitTeam(event),
    ...(useModel === null ? {} : { onUseModel: useModel }),
  }

  return { handlers }
}
