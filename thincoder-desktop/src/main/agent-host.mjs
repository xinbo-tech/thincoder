/**
 * agent-host.mjs — 宿主装配桥（`docs/desktop/design/SHELL.md` §4 装配第三份 · `docs/desktop/design/IPC.md` §1 桥面）。
 * 五职责：① 装配（懒 · 按需 · 同键复用）② 九回调桥（协议行解析 ⇒ `ev:*` 出站）③ 待决表（三门形：审批逐项 / 审批批次 / 提问）
 * ④ 回合驱动（`send` / `interrupt` + 结算三映射：done · stopped · error + 回合尾 `ev:usage` 读数〔`postUsage` · 三径同点〕）
 * ⑤ 会话级偏好写面（`setPrefs`：写盘 → 重施；在飞拒 —— 批次档 KD-19 单点）。
 * 装配端差（SHELL.md §4 显式登记两项 + 取值面一项）：`cwd` = 项目根（注入的 `projects.currentCwd()`）——**非**
 * `process.cwd()`；不附着 M1 装配钩子（本端读面未接）；不连外部工具服务器（本端无此面）。
 * 零宿主依赖：出站 `emit` 由主进程注入 ⇒ 平 node 直测。
 *
 * 出档（批 8 §1.14 ③：本档触行数拉线，按在册预案拆分 —— 档名实施舱定）：回调桥 ⇒ `agent-bridge.mjs`
 * （`createBridge` + 名面 `ACTIVITY_EVENTS` / `parseEvToken` / `summarizeArgs`）；待决门 ⇒ `suspensions.mjs`
 * （`createGates` + `ITEM_VERDICTS` / `BATCH_VERDICTS` / `QUESTION_CANCELLED`）；槽 I/O ⇒ `session-io.mjs`（`loadAgentSlot` /
 * `saveAgentSlot`）。上述名面在原路径**同名 re-export** ⇒ 调用方 import 路径与名面零改。
 * 会话取槽落盘（批 8 §1.14 ①②）：`ensure` 装配后装载本键槽（槽缺 ⇒ 新建形，代理不动）；`send` 三路结算
 * **先落盘再出终局事件** —— 渲染侧收尾重读即见本回合增量。
 */
import { execSync } from "node:child_process"
import { isAbsolute, join } from "node:path"
import { createAgent, runAgent } from "@thincoder/core/agent.mjs"
import { configDir, loadConfig } from "@thincoder/core/config.mjs"
import { createMemory, syncDir } from "@thincoder/core/memory.mjs"
import { discoverRules } from "@thincoder/core/rules.mjs"
import { assembleBuiltinTools } from "@thincoder/core/tools/index.mjs"
import { historyPercent } from "@thincoder/core/token-window.mjs"
// 会话键语义（`String(slot)` 单源）与端壳同档 —— 键面归一不造第二口径；偏好写面（`writeSlotPrefs`）同档。
import { slotOfKey, writeSlotPrefs } from "./session-slots.mjs"
// 三出档（见档头）：回调桥 / 待决门 / 槽 I/O —— 本档只装配与驱动，算法面各归其档。
import { createBridge } from "./agent-bridge.mjs"
import { createGates } from "./suspensions.mjs"
import { loadAgentSlot, saveAgentSlot } from "./session-io.mjs"
// 附件面（`docs/desktop/design/IPC.md` §2「附件注」）：起跑前装配（非视觉门 / 落盘 / 交核指引）+ 回合尾清理。
import { cleanupTurn, prepareTurnAttachments } from "./attachments.mjs"
// 同名 re-export（调用面零改 —— 既有 import 路径与名面保持）。
export { ACTIVITY_EVENTS, parseEvToken, summarizeArgs } from "./agent-bridge.mjs"
export { ITEM_VERDICTS, BATCH_VERDICTS } from "./suspensions.mjs"

/** 装配缺省面（逐项可注入 —— 断言装配调用序用假 deps；缺省 = 核单源）。 */
const DEFAULT_DEPS = Object.freeze({
  loadConfig, createMemory, createAgent, assembleBuiltinTools, discoverRules, syncDir,
  team: teamConfig, author: gitAuthor,
})

/** 团队层配置（核 `config.memory.team` 有 repo 才成层）——端本地最小实现（同形于 CLI 装配侧取值）；
 *  未配置 ⇒ null（装配跳过团队层，与 CLI 同）。 */
export function teamConfig(config) {
  const team = config?.memory?.team
  if (!team?.repo) return null
  const name = team.name ?? "default"
  return { name, repo: team.repo, dir: team.dir ?? join(configDir, "teams", name) }
}

/** 装配作者：git user.name，缺 ⇒ `"unknown"`（端本地最小实现——不引他端模块）。 */
export function gitAuthor() {
  try { return execSync("git config user.name", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown" } catch { return "unknown" }
}

/** 装配后唯一校验点（判据 = `name && model && baseURL`）：**不抛** —— 记 `_providerInvalid` 由回合驱动消费
 *  （`{ok:false,reason:"provider-invalid"}`，零假回合）；原因文案可由 config 覆盖。 */
function validateProvider(agent, config) {
  const p = agent?.provider
  if (p?.name && p?.model && p?.baseURL) return
  agent._providerInvalid = true
  agent._providerInvalidReason = config?.providerInvalidReason ?? "provider incomplete (name/model/baseURL)"
}

/** 会话级偏好键闭集（单源 = `docs/core/design/SESSION.md` §6.21 —— 与核 `SLOT_PREF_KEYS` 同集〔该符号
 *  核内私有、非引用面：值域两处各持〕；本档只判载荷形，值归一在核）。 */
const PREF_KEYS = Object.freeze(["provider", "model", "effort"])

/** 偏好载荷形判据（纯函数、不抛）：非对象 / 数组 / 零键 / 表外键 / 值形违例 ⇒ `invalid-patch`；
 *  `provider` 在场而 `model` 缺 ⇒ `model-required`（T-DSK28 ⑦「只送 provider」——档位表外字面串不在本层判，
 *  交核 `resolveEffortPatch` 归一 `null`）。通过 ⇒ `null`。值串判据 = trim 后非空、**原串透传**
 *  （不裁空白 —— 值面规整不在本层）。 */
function prefsPatchFailure(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return "invalid-patch"
  const keys = Object.keys(patch)
  if (keys.length === 0 || keys.some((k) => !PREF_KEYS.includes(k))) return "invalid-patch"
  const text = (v) => typeof v === "string" && v.trim() !== ""
  if ("provider" in patch && !text(patch.provider)) return "invalid-patch"
  if ("model" in patch && !text(patch.model)) return "invalid-patch"
  if ("effort" in patch && patch.effort !== null && typeof patch.effort !== "string") return "invalid-patch"
  if ("provider" in patch && !("model" in patch)) return "model-required"
  return null
}

/** 装配一份会话代理（端差已扣 —— 见档头；序同 CLI 装配序，取值面：`cwd` = 项目根）。
 *  `deps` 逐项可注入（缺省 = 核函数）：装配序可机验（U79）。 */
async function assembleFor({ cwd, slot, deps = {} }) {
  const D = { ...DEFAULT_DEPS, ...deps }
  const config = D.loadConfig()
  const provider = config.provider
  const providers = config.providersList
  const injectProxy = D.injectProxy ?? (await import("@thincoder/core/proxy.mjs")).injectProxy
  injectProxy(providers, config)
  if (provider?.name) provider.proxyUri = providers.find((p) => p.name === provider.name)?.proxyUri

  const memory = D.createMemory({ dbPath: config.memory.dbPath })
  if (config.embedding?.apiKey) {
    const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
    memory.embedder = createEmbedder(config.embedding)
  }
  const fileRules = D.discoverRules(cwd)
  if (fileRules.length) {
    const filePatterns = new Set(fileRules.map((r) => r.pattern))
    const configRules = (config.agent?.streamRules || []).filter((r) => !filePatterns.has(r.pattern))
    config.agent.streamRules = [...fileRules, ...configRules]
  }
  memory.codeOrigin = cwd
  if (config.memory.projectDir) {
    memory.projectOrigin = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(cwd, config.memory.projectDir)
    await D.syncDir(memory, { layer: "project", dir: memory.projectOrigin })
  }
  const team = D.team(config)
  if (team) {
    const { ensureClone } = await import("@thincoder/core/git/gitmem.mjs")
    await ensureClone(team)
    await D.syncDir(memory, { layer: "team", dir: team.dir })
  }
  const tools = await D.assembleBuiltinTools({
    memory, cwd, projectDir: config.memory.projectDir, author: D.author(), team,
    model: provider?.model ?? null,
  })
  const agent = D.createAgent({ provider, tools, config, cwd, memory })
  agent.providers = providers
  agent.activeProvider = provider?.name ?? ""
  agent.activeModel = provider?.model ?? null
  agent._slot = slot
  validateProvider(agent, config)
  return agent
}

/** 宿主装配桥：`emit(channel, payload)` = 出站面（主进程注入）· `run` = 回合运行器 · `assemble` = 装配函数（皆可注入）。
 *  `projects` = 项目面（`currentCwd()` 供装配取值）；返回 `{ ensure, send, interrupt, setPrefs, respond, dispose, table, agents }`。 */
export function createAgentHost({ emit, run = runAgent, assemble = assembleFor, deps = {}, projects } = {}) {
  if (typeof emit !== "function") throw new Error("[agent-host] emit required (out-bound channel)")
  const post = (channel, payload) => emit(channel, payload)
  /** 装配表：key → agent（同键复用；`dispose` 清）。 */
  const agents = new Map()
  /** 在途装配（并发同键去重 —— 两次 `ensure` 只装配一次）。 */
  const ensuring = new Map()
  /** 待决门（表 + 五操作 —— 出档 `suspensions.mjs`；`table` 随宿主面继续暴露）。 */
  const { table, askSingle, askBatch, askQuestion, denyGates, respond } = createGates({ post, agents })
  /** 九回调桥（出档 `agent-bridge.mjs` —— `post` 与三门转口注入）。 */
  const bridge = createBridge({ post, askSingle, askBatch, askQuestion })
  /** 在飞回合：key → AbortController（单驱动器 ⇒ 禁双 run 竞态）。 */
  const flights = new Map()

  /** 回合尾用量读数（`docs/desktop/design/IPC.md`:21 = 产出方「宿主回合尾结算」· 载荷 `{key,percent}` 见 :41）：
   *  值 = 核 `historyPercent` 投影（**端侧零重算** —— 读数域 0–100 整数直传）；门 = 有效读数〔数字 ∧ `> 0`〕
   *  才发 —— 判据与渲染侧占用切片同式（非数 / 零 / 负 ⇒ 不发，不假造读数）。**三径同点调用**：落盘之后、终局事件之前 · **不抛前提** = `agent.history` 恒数组（核装配缺省 `thincoder-core/agent.mjs:64` · 接续恒置 `thincoder-core/session-lifecycle.mjs:108`）⇒ 本读数不改结算链（终局帧不受读数影响）。 */
  function postUsage(key, agent) {
    const percent = historyPercent(agent?.history ?? [], agent?.provider)
    if (typeof percent !== "number" || !(percent > 0)) return
    post("ev:usage", { key, percent })
  }

  /** 装配 + 装载本键槽：`loadAgentSlot` 在**宿主内**（假 `assemble` 注入同走装载 —— §1.14 ① 的语义面
   *  是「装配出的代理必须持槽值」，不在装配函数里）；槽缺 ⇒ 新建形（代理原样）。 */
  async function assembleAndLoad(key, slot) {
    const cwd = projects.currentCwd()
    const agent = await assemble({ cwd, slot, key, deps })
    loadAgentSlot(agent, cwd, slot)
    return agent
  }

  async function ensure(key, slot) {
    if (agents.has(key)) return agents.get(key)
    if (!ensuring.has(key)) ensuring.set(key, assembleAndLoad(key, slot))
    try {
      const agent = await ensuring.get(key)
      agents.set(key, agent)
      return agent
    } finally {
      ensuring.delete(key)
    }
  }

  /** `msg:send`：坏键 ⇒ bad-key · 在飞 ⇒ busy · provider 无效 ⇒ provider-invalid（零假回合）；
   *  否则建 controller、起跑、**立即回 `{ok:true}`**；结算三映射（done / stopped / error）收尾清在飞 ——
   *  三径各出一次回合尾 `ev:usage`（读数同点、终局事件之前）。
   *  三路结算**先落盘再出终局事件**（§1.14 ② —— 渲染侧收尾重读即可见本回合增量；CLI 先例 = 回合
   *  finally 尾部保存 ⇒ 中断 / 错误同样留现场）。
   *  附件面（`IPC.md` §2「附件注」）：`images` 逐项 `{name,mime,dataURL}`；判决与落盘全在
   *  `prepareTurnAttachments`（出口零抛 ⇒ 回合驱动零承担），弃项经回执 `degraded` 浮出（零静默）；
   *  落盘件随三径结算在 `finally` 清理（**先释放锁**再清理 —— 清理由本档自吞错，锁必释放）。 */
  async function send(key, text, images) {
    const slot = slotOfKey(key)
    if (slot === null) return { ok: false, reason: "bad-key" }
    if (flights.has(key)) return { ok: false, reason: "busy" }
    // 占位先于装配 await：首跑仍在懒装配时的同键再发亦落 `busy`——单驱动器不许双 `runAgent`。
    const controller = new AbortController()
    flights.set(key, controller)
    const release = () => {
      if (flights.get(key) === controller) flights.delete(key)
    }
    let agent = null
    try {
      agent = await ensure(key, slot)
    } catch (err) {
      release() // 装配抛不吞（直传 invoke 拒绝），但先摘本键在飞——否则本键永锁 `busy`
      throw err
    }
    if (agent._providerInvalid) {
      release()
      return { ok: false, reason: "provider-invalid" }
    }
    // 附件装配（项 1–4）：文本 / 路径 / 降级码三件——`cwd` = 项目根、`model` = 本回合实跑模型、
    // `locale` = 装配实例配置（`createAgent` 存本 —— 零二次 `loadConfig`），非视觉说明词面随之就地定局。
    const attached = prepareTurnAttachments(text, images, {
      cwd: projects?.currentCwd(), model: agent.provider?.model, locale: agent.config?.locale,
    })
    run(agent, attached.text, bridge(key), { signal: controller.signal })
      .then(() => {
        saveAgentSlot(agent) // 落盘先于终局事件（§1.14 ②）
        postUsage(key, agent) // 回合尾读数（同点：落盘后 · 终局事件前）
        post("ev:activity", { key, event: "done" })
      })
      .catch((err) => {
        saveAgentSlot(agent) // 三路同序（CLI 先例 = 回合 finally 尾部保存）
        postUsage(key, agent) // 三径同点（中断 / 错误同样出本回合读数）
        if (controller.signal.aborted) post("ev:activity", { key, event: "stopped" })
        else post("ev:error", { key, message: String(err?.message ?? err) })
      })
      .finally(() => {
        release() // 先释放锁：清理由本档自吞错（项 6），回合驱动零承担
        cleanupTurn(attached.paths)
      })
    return attached.degraded ? { ok: true, degraded: attached.degraded } : { ok: true }
  }

  /** `msg:interrupt`：无在飞 ⇒ `idle`；在飞 ⇒ abort + 本键待决门按拒结算。 */
  function interrupt(key) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const controller = flights.get(key)
    if (!controller) return { ok: false, reason: "idle" }
    controller.abort()
    denyGates(key)
    return { ok: true }
  }

  /** `session:prefs` 写面（`docs/desktop/design/IPC.md` §2「会话级偏好注」项 2/4/7 · KD-19 单点）：判序 = `bad-key`
   *  → `busy`（在飞**零写**）→ 载荷两档（`invalid-patch` / `model-required`）→ 写盘 → 施加。
   *  写盘 = 端壳 `writeSlotPrefs`（核写口 + 回读投影）；写未发生（槽不可读 / `cwd` 无源）⇒ `slot-missing`。
   *  **施加** = 本键已装配者重施 `loadAgentSlot`（活动会话内存即生效）；未装配者只写盘（不隐式装配）。
   *  成功 ⇒ 族信封 + `meta`（与 `history:page` 同源投影）；失败 ⇒ 信封**无 `meta` 键** + 零写。 */
  function setPrefs(key, patch) {
    const cwd = projects?.currentCwd()
    const slot = slotOfKey(key)
    const fail = (reason) => ({ ok: false, reason, cwd: typeof cwd === "string" ? cwd : null, slot: null })
    if (slot === null) return fail("bad-key")
    if (flights.has(key)) return fail("busy")
    const bad = prefsPatchFailure(patch)
    if (bad) return fail(bad)
    if (typeof cwd !== "string" || !cwd) return fail("slot-missing")
    const written = writeSlotPrefs(cwd, slot, patch)
    if (!written.ok) return fail("slot-missing")
    if (agents.has(key)) loadAgentSlot(agents.get(key), cwd, slot)
    return { ok: true, reason: null, cwd, slot, meta: written.meta }
  }

  /** 装配实例清除（会话关闭面 —— 防泄漏）：装配表 / 在途装配 / 本键待决门（按拒结算 —— 不留悬 Promise）。 */
  function dispose(key) {
    agents.delete(key)
    ensuring.delete(key)
    denyGates(key)
  }

  // `respond` 取自待决门出档（契约：表外 id ⇒ `unknown-prompt` · 跨 kind 载荷 ⇒ `bad-kind` · 跨形 / 表外
  // verdict ⇒ `bad-verdict` · 非串且非 `null` 作答 ⇒ `bad-answer`；四档皆不 resolve —— 挂起保留）。
  return { ensure, send, interrupt, setPrefs, respond, dispose, table, agents }
}
