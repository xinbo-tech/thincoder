/**
 * agent-host.mjs — 宿主装配桥（`docs/desktop/design/SHELL.md` §4 装配第三份 · `docs/desktop/design/IPC.md` §1 桥面）。
 * 四职责：① 装配（懒 · 按需 · 同键复用）② 九回调桥（协议行解析 ⇒ `ev:*` 出站）③ 待决表（审批两形：逐项 / 批次）
 * ④ 回合驱动（`send` / `interrupt` + 结算三映射：done · stopped · error）。
 * 装配端差（SHELL.md §4 显式登记两项 + 取值面一项）：`cwd` = 项目根（注入的 `projects.currentCwd()`）——**非**
 * `process.cwd()`；不附着 M1 装配钩子（本端读面未接）；不连外部工具服务器（本端无此面）。
 * 零宿主依赖：出站 `emit` 由主进程注入 ⇒ 平 node 直测。
 *
 * 出档（批 8 §1.14 ③：本档触行数拉线，按在册预案拆分 —— 档名实施舱定）：回调桥 ⇒ `agent-bridge.mjs`
 * （`createBridge` + 名面 `ACTIVITY_EVENTS` / `parseEvToken` / `summarizeArgs`）；待决门 ⇒ `suspensions.mjs`
 * （`createGates` + `ITEM_VERDICTS` / `BATCH_VERDICTS`）；槽 I/O ⇒ `session-io.mjs`（`loadAgentSlot` /
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
// 会话键语义（`String(slot)` 单源）与端壳同档 —— 键面归一不造第二口径。
import { slotOfKey } from "./session-slots.mjs"
// 三出档（见档头）：回调桥 / 待决门 / 槽 I/O —— 本档只装配与驱动，算法面各归其档。
import { createBridge } from "./agent-bridge.mjs"
import { createGates } from "./suspensions.mjs"
import { loadAgentSlot, saveAgentSlot } from "./session-io.mjs"
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
 *  `projects` = 项目面（`currentCwd()` 供装配取值）；返回 `{ ensure, send, interrupt, respond, dispose, table, agents }`。 */
export function createAgentHost({ emit, run = runAgent, assemble = assembleFor, deps = {}, projects } = {}) {
  if (typeof emit !== "function") throw new Error("[agent-host] emit required (out-bound channel)")
  const post = (channel, payload) => emit(channel, payload)
  /** 装配表：key → agent（同键复用；`dispose` 清）。 */
  const agents = new Map()
  /** 在途装配（并发同键去重 —— 两次 `ensure` 只装配一次）。 */
  const ensuring = new Map()
  /** 待决门（表 + 四操作 —— 出档 `suspensions.mjs`；`table` 随宿主面继续暴露）。 */
  const { table, askSingle, askBatch, denyGates, respond } = createGates({ post, agents })
  /** 九回调桥（出档 `agent-bridge.mjs` —— `post` 与两门转口注入）。 */
  const bridge = createBridge({ post, askSingle, askBatch })
  /** 在飞回合：key → AbortController（单驱动器 ⇒ 禁双 run 竞态）。 */
  const flights = new Map()

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
   *  否则建 controller、起跑、**立即回 `{ok:true}`**；结算三映射（done / stopped / error）收尾清在飞。
   *  三路结算**先落盘再出终局事件**（§1.14 ② —— 渲染侧收尾重读即可见本回合增量；CLI 先例 = 回合
   *  finally 尾部保存 ⇒ 中断 / 错误同样留现场）。 */
  async function send(key, text) {
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
    run(agent, text, bridge(key), { signal: controller.signal })
      .then(() => {
        saveAgentSlot(agent) // 落盘先于终局事件（§1.14 ②）
        post("ev:activity", { key, event: "done" })
      })
      .catch((err) => {
        saveAgentSlot(agent) // 三路同序（CLI 先例 = 回合 finally 尾部保存）
        if (controller.signal.aborted) post("ev:activity", { key, event: "stopped" })
        else post("ev:error", { key, message: String(err?.message ?? err) })
      })
      .finally(release)
    return { ok: true }
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

  /** 装配实例清除（会话关闭面 —— 防泄漏）：装配表 / 在途装配 / 本键待决门（按拒结算 —— 不留悬 Promise）。 */
  function dispose(key) {
    agents.delete(key)
    ensuring.delete(key)
    denyGates(key)
  }

  // `respond` 取自待决门出档（契约：未知 id ⇒ `unknown-prompt` · 跨形 / 表外 verdict ⇒ `bad-verdict`）。
  return { ensure, send, interrupt, respond, dispose, table, agents }
}
