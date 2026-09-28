/**
 * agent-host-harness.mjs — 宿主装配桥用例**共享假面**（「回合中插入」批拆分产出：`test/agent-host.test.mjs`
 * 触 500 硬限 ⇒ 按在册预案「门面用例拆出 + 装配假面 harness 共享」落形 —— 拆档 = `test/agent-host-queued.test.mjs`）。
 * 本档零用例（纯夹具 / 驱动小件）：`fakeDeps`（替身装配面）· `makeHost`（真 `assembleFor` + 假 `emit` 收序）·
 * `until`（异步拍）· `boot`（起一在飞回合 + 桥面）· `at`（末条通道载荷）· 三常量（KEY / CWD / PROVIDER）。
 * 纪律（沿原档）：替身 `deps` + 替身 `run` + 假 `emit` ⇒ **零网 / 零 electron / 零用户目录**（真盘面落于
 * `test/slot-sandbox.mjs` 沙箱 —— 各用例档模块级自持）。
 */
import { readFileSync } from "node:fs"
import { createAgentHost } from "../src/main/agent-host.mjs"

export const KEY = "3"
export const CWD = "/fake-project-root" // 注入项目根 —— 非 process.cwd() ⇒ 装配取值可辨
export const PROVIDER = { name: "p1", model: "m1", baseURL: "http://127.0.0.1:1/v1" }
/** 宿主源面读数（源面机检用例共读）。 */
export const SRC = readFileSync(new URL("../src/main/agent-host.mjs", import.meta.url), "utf8")

/** 剥注释（块 / 行）：源面机检须看**代码** —— 档头注释里明写 `process.cwd()` 反例（实测踩中）。 */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

/** 假装配面：记录调用序 + 产出核同形对象（`config.agent` 恒在场 —— 核 `loadConfig` 缺省面）。 */
export function fakeDeps({ provider = PROVIDER, invalid = false } = {}) {
  const order = []
  const seen = {}
  const config = {
    provider: invalid ? { name: "", model: "", baseURL: "" } : { ...provider },
    providersList: invalid ? [] : [{ name: provider.name, model: provider.model }],
    agent: { streamRules: [] },
    memory: { dbPath: ":memory:", projectDir: "proj-mem" },
    providerInvalidReason: invalid ? "no provider configured" : undefined,
  }
  const memory = { codeOrigin: null, projectOrigin: null }
  const agent = { provider: { ...config.provider }, tools: [], cwd: CWD, history: [], _fullHistory: [] } // 保存面所需（核 `saveSession` 直读 `cwd` / 人读线）
  const deps = {
    loadConfig: () => { order.push("loadConfig"); return config },
    injectProxy: () => { order.push("injectProxy") },
    createMemory: () => { order.push("createMemory"); return memory },
    discoverRules: (cwd) => { order.push("discoverRules"); seen.rulesCwd = cwd; return [{ pattern: "AGENTS.md" }] },
    syncDir: async (_m, o) => { order.push(`syncDir:${o.layer}`) },
    team: () => { order.push("team"); return null },
    author: () => "tester",
    assembleBuiltinTools: (o) => { order.push("assembleBuiltinTools"); seen.tools = o; return [{ name: "read" }] },
    createAgent: (o) => {
      order.push("createAgent")
      seen.agent = o
      // 镜像核单点（核 `agent.mjs:70` `provider` 取自装配入参，且逐次新建对象 ⇒ 无跨装配残留）——否则前序槽装载
      // （`applySession`）在共享假 agent 上留下的 provider 会被下次装配的 `validateProvider` 误判 incomplete（实测踩中）。
      // 两旗标同回位（核新建对象天然无旗标；`validateProvider` 只在违例时置位、从不清除 ⇒ 不复位则有假 provider-invalid）。
      agent.provider = o.provider
      delete agent._providerInvalid
      delete agent._providerInvalidReason
      return agent
    },
  }
  return { deps, order, seen, config, memory, agent }
}

/** 假宿主：**真** `assembleFor` + 假 deps（装配路径真跑）+ 假 `emit` 收序；`assemble` 注入 ⇒ 替装配面（U226 逐次新建对象面）。
 *  提示面三件透传（桌面空闲唤醒批 —— 缺省 = 不注入 ⇒ 零动作）。 */
export function makeHost({ provider, invalid, run, notify, focused, reveal, assemble = null } = {}) {
  const out = []
  const fd = fakeDeps({ provider, invalid })
  const host = createAgentHost({
    emit: (channel, payload) => out.push([channel, payload]),
    run: run ?? (() => Promise.resolve()),
    deps: fd.deps,
    ...(assemble === null ? {} : { assemble }), // 缺省 = 真 `assembleFor`（假 deps 装配）
    projects: { currentCwd: () => CWD },
    notify, focused, reveal,
  })
  return { host, out, ...fd }
}

/** 逐次新建代理（核同形 —— 跨装配零残留；陈旧 ∕ 新代两代理可辨的用例面 —— U226）。 */
export const freshAgent = (slot) => ({
  cwd: CWD, _slot: slot, provider: { ...PROVIDER }, config: { agent: {} },
  history: [], _fullHistory: [], tools: [],
})

/** 等到谓词成立（驱动循环异步 —— 最多 50 拍）。 */
export async function until(fn, label = "condition") {
  for (let i = 0; i < 50; i += 1) {
    if (fn()) return
    await new Promise((done) => setTimeout(done, 0))
  }
  throw new Error(`timeout waiting: ${label}`)
}

/** 起一回合并取回桥面（假 `run` 捕获 `cb`；返回常驻 Promise ⇒ 在飞不结算，桥面直调不受影响）。 */
export async function boot(opts = {}) {
  let cb = null
  const h = makeHost({ ...opts, run: (_agent, _text, callbacks) => { cb = callbacks; return new Promise(() => {}) } })
  await h.host.ensure(KEY, 3)
  const receipt = await h.host.send(KEY, "hello")
  return { ...h, cb, receipt }
}

/** 末条某通道载荷。 */
export const at = (out, channel) => out.filter(([c]) => c === channel).at(-1)[1]
