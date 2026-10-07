/**
 * mount-settings-segments.mjs — 设置面段出口族（env ∕ 工具与服务）（R7 · 桌面功能对位批；
 * 「先拆后改」：自 `renderer/mount-settings-exits.mjs` 拆出 —— 300 行层拆分 + 新段出口落点）：env（proxy ∕
 * shell ∕ TestProxy）· 工具与服务（embedding ∕ websearch 两 key · 索引构建），共**九**出口；**MCP 族十一出口另档** =
 * `mount-settings-segments-mcp.mjs`（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036——先拆后改：越 300 在册
 * 预案「MCP 族再出一档」兑现）；**models 族八出口另档** = `mount-settings-segments-models.mjs`
 * （三档同经本装配面合并）。
 *
 * 接线沿 `createExits` 注入先例：`createSegmentExits(deps)` ——
 * `deps = { ask, store, setSettings, report, clearReport, reads, slot }`；返回 `{ handlers }`
 * （并回 `mount-settings-exits.mjs` 单一 handlers 表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；
 * 写成功 ⇒ 清失败串 + 复读本段（单源 = 读数供给族 `mount-settings-reads.mjs`）；端侧形判不齐 ⇒ **零发送**
 * （`console.error` 零静默）。基线判据（VSC 同律）：屏值 = 现值 ⇒ **零发送**（幂等门）。
 * **#679 草稿失效声明（两径）**：tools 钥存（+ 删钥）· env shell 两成功径在**复位写前**声明（`invalidateDrafts(scope)` 注入 —— 作用域取值面 = 视图档 `[data-draft-scope]`；失败径零声明；MCP 增 ∕ 改两径随族出档）。
 * **B10 W2 · S6**：两密钥键行删除 ⇒ **不可复得类删除前置确认**（`settings-confirm.mjs`；
 * 驳回 ⇒ 零写；确认 ⇒ 既有删除径 —— 本档两出口换形为「确认门 + 执行径」两层；MCP 行移除另一门随族出档）。
 * 纪律：零 `node:` ∕ 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { confirmSecretDelete } from "./settings-confirm.mjs"

/** 自定义哨兵（与 `views/settings-sections-env.mjs` 同值 —— 切换输入意图，非写意图）。 */
const CUSTOM_SENTINEL = "__custom__"

/** 段出口族工厂。`deps.reads = { loadEnv, loadTools }`（读数供给族注入 —— 写后复读；MCP 复读口随族出档）；
 * `deps.slot` = 设置槽锚（key 输入现读作用域）。
 */
export function createSegmentExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, reads, slot, invalidateDrafts } = deps
  const { loadEnv, loadTools } = reads ?? {}

  /** 段切片局部写（引用不变 ⇒ 零通知 —— 同值写零重绘）。 */
  const setEnvSlice = (patch) => {
    const held = store.get().settings?.env ?? {}
    setSettings({ env: { ...held, ...patch } })
  }
  const setToolsSlice = (patch) => {
    const held = store.get().settings?.tools ?? {}
    setSettings({ tools: { ...held, ...patch } })
  }

  /* ── env 族（`settings:env`：proxy ∕ shell ∕ TestProxy）────────────────────────────────── */

  /** env 写出口（单次 patch；成功 ⇒ 清失败串 + 复读）：失败 ⇒ 段级失败面（**零乐观写**）。
   *  **#679**：shell 写成功 ⇒ 该表单草稿一次性作废（作用域 = 视图档 `[data-draft-scope]` 值 `env:shell`；
   *  proxy 写无草稿面 ⇒ 零声明 —— 取 patch 键判，失败径零声明）。 */
  async function saveEnv(patch) {
    const receipt = await ask("settings:env", { patch })
    if (receipt.ok !== true) {
      report("env", receipt, "settings:env")
      return
    }
    if (patch?.shell !== undefined) invalidateDrafts?.("env:shell")
    clearReport()
    await loadEnv()
  }

  /** proxy 单字段出口（VSC 同律基线门：屏值 = 现值 ⇒ 零发送；payload 只含本次被编辑字段）。 */
  function proxyField(field, value) {
    const held = store.get().settings?.env?.proxy ?? {}
    const current = field === "uri" ? (typeof held.uri === "string" ? held.uri : "") : held[field] === true
    if (value === current) return
    void saveEnv({ proxy: { [field]: value } })
  }

  /** shell `select` 出口（VSC 同门）：哨兵 ⇒ 零动作（切换输入意图）；值 = 系统默认（空）∥ 候选值。 */
  function shellSelect(value) {
    if (value === CUSTOM_SENTINEL) return
    const held = store.get().settings?.env?.shell?.current ?? null
    const target = value === "" ? null : value
    if (target === held) return
    void saveEnv({ shell: value })
  }

  /** shell 自定义路径出口（VSC 路径册 #3）：空值 = 未完成输入 ⇒ **零发送**；同现值 ⇒ 零发送。 */
  function shellCustom(value) {
    const trimmed = typeof value === "string" ? value.trim() : ""
    if (trimmed === "") return
    if (trimmed === (store.get().settings?.env?.shell?.current ?? null)) return
    void saveEnv({ shell: trimmed })
  }

  /** TestProxy 出口（`{ testProxy: { uri } }` —— 主侧转口 `providers.mjs` `testProxy`）：探期 `running`
   *  词面 + 回执两态落段切片（读数面恒显 —— 零静默）。 */
  async function testProxy() {
    const uri = store.get().settings?.env?.proxy?.uri ?? ""
    setEnvSlice({ test: { state: "running", status: null, error: null } })
    const receipt = await ask("settings:env", { testProxy: { uri } })
    setEnvSlice({
      test: {
        state: receipt.ok === true ? "ok" : "fail",
        status: Number.isFinite(receipt.status) ? receipt.status : null,
        error: typeof receipt.error === "string" && receipt.error !== "" ? receipt.error : null,
      },
    })
  }

  /* ── 工具与服务族（`settings:tools` 两 key + `index:build`）────────────────────────────── */

  /** 密钥行存出口（编辑态输入现值 ⇒ 写）：空值 ⇒ **零发送**（清键归删除出口）。 */
  async function keySave(kind) {
    const input = typeof document?.querySelector === "function" ? document.querySelector(`${slot} [data-key-input="${kind}"]`) : null
    const value = typeof input?.value === "string" ? input.value.trim() : ""
    if (value === "") {
      console.error(`[renderer] settings:tools skipped: empty key for ${kind}`)
      return
    }
    const receipt = await ask("settings:tools", { patch: { [kind]: { apiKey: value } } })
    if (receipt.ok !== true) {
      report("tools", receipt, "settings:tools")
      return
    }
    invalidateDrafts?.(`tools:${kind}`) // #679 成功径：该行草稿一次性作废（值形与视图档 `[data-draft-scope]` 同模板 `tools:<kind>`）
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 密钥行删除**执行径**（清键语义 = 空串 patch —— 主侧摘键；确认面「是」⇒ 本径）。 */
  async function runKeyDelete(kind) {
    const receipt = await ask("settings:tools", { patch: { [kind]: { apiKey: "" } } })
    if (receipt.ok !== true) {
      report("tools", receipt, "settings:tools")
      return
    }
    invalidateDrafts?.(`tools:${kind}`) // #679 同族随修（删钥成功）—— 静止态输入件离场，值形同 `keySave`
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 密钥行删除出口（S6：密钥原文不可复得 ⇒ 前置确认；驳回 ⇒ 零写）。 */
  function keyDelete(kind) {
    confirmSecretDelete(() => { void runKeyDelete(kind) })
  }

  /** 索引构建出口（`index:build` —— R2 落，R7 随族迁本档）：构建期段面置 `building`（钮禁用 + 「构建中…」
   *  —— VSC 钮同拍禁用同律）；**成败皆复读状态**（VSC `buildIndex` 尾 `pushIndexStatus` 同律 —— 部分成功径
   *  也随真值刷新计数）；失败径 ⇒ **复读后**落段级失败面（失败串不被复读清位）；**零乐观写**。 */
  async function buildIndex() {
    setToolsSlice({ state: "ready", building: true })
    const receipt = await ask("index:build")
    await loadTools()
    if (receipt.ok !== true) {
      report("tools", receipt, "index:build")
      return
    }
    clearReport()
  }
  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域；MCP 族十一项经 `mount-settings-segments-mcp.mjs` ∕ models 族八项经 `-models.mjs` 另表）。 */
  const handlers = {
    onProxyField: (field, value) => proxyField(field, value),
    onShellSelect: (value) => shellSelect(value),
    onShellCustom: (value) => shellCustom(value),
    onTestProxy: () => void testProxy(),
    onKeyEdit: (kind) => setToolsSlice({ edit: kind }),
    onKeyCancel: () => setToolsSlice({ edit: null }),
    onKeySave: (kind) => void keySave(kind),
    onKeyDelete: (kind) => void keyDelete(kind),
    onBuildIndex: () => void buildIndex(),
  }

  return { handlers }
}
