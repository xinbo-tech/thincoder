/**
 * acp.mjs — `thincoder acp` entry: expose the thincoder agent over the
 * Agent Client Protocol (schema v1) on stdio, so ACP clients (Zed, JetBrains
 * AI Chat, Paseo) can drive sessions directly.
 *
 * Handler bodies live in four modules (division + criteria = docs/cli/design/ACP-CLIENT.md
 * §3.5 — the former 368-line single-function `buildAcpHandlers` split by method family):
 *   acp/client-caps.mjs       initialize / authenticate（版本协商 · 能力快照 · authMethods 构造）
 *   acp/handlers-session.mjs  session/{new,prompt,cancel,close,set_mode,set_config_option} + 门助手
 *   acp/handlers-slots.mjs    session/{list,load,resume,delete}（持久化槽族）
 *   acp/ext.mjs               checkpoint/* · memory/*
 *   acp/login.mjs             `--login` terminal auth flow (non-stdio)
 * This file keeps constants, the injectable defaults and the assembly — the seam
 * `buildAcpHandlers(deps)` (signature + `{ handlers, sessions, notifyRef, requestRef }`)
 * is the only external contract (both existing ACP test files drive it directly).
 *
 * #41（2026-09-18）：`session/load` / `session/resume` 两路工程模式会话改「先判后装载」
 * （判据 = 入口决策树单源；拒 ⇒ 既有错误通道、不建会话）+ 装载后一行重估（附着）——
 * docs/core/design/MANIFEST.md §2.8 F3/F4。
 *
 * Auth: reuse the terminal config (~/.thincoder/config.json) — a resolvable
 * provider API key means "configured". No account system; `logout` is absent.
 *
 * `isConfigured` / `providerStatus` / `createSession` are injectable for tests.
 */
import { readFileSync } from "node:fs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { assembleAgent } from "./cli/make-agent.mjs"
import { createAcpServer } from "./acp/transport.mjs"
import { createAcpSession } from "./acp/session.mjs"
import { createCapsHandlers } from "./acp/client-caps.mjs"
import { createRequireConfigured, createSessionHandlers } from "./acp/handlers-session.mjs"
import { createSlotsHandlers } from "./acp/handlers-slots.mjs"
import { createExtHandlers } from "./acp/ext.mjs"

const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version

/** Config is "configured" when the active provider has a resolvable API key (providers[].apiKey only). */
export function defaultIsConfigured() {
  try {
    return !!loadConfig().provider?.apiKey?.trim()
  } catch {
    return false
  }
}

/** 姐妹探针（§11.5「判据拆分」· 评审 #1）：与 `defaultIsConfigured` 同源同式，另区分
 *  「无 key」与「key 在位但 defaultModel 不可解析」——`keyPresent` **不经**
 *  `resolveRuntimeProvider`（defaultModel 不可解析时仍为真）；`reason` 复用 config 单源文案
 *  `providerInvalidReason`（defaultModel 未设时逐字含 "defaultModel"），不新增文案。 */
export function defaultProviderStatus() {
  try {
    const cfg = loadConfig()
    return {
      ok: !!cfg.provider?.apiKey?.trim(),
      keyPresent: Array.isArray(cfg.providers) && cfg.providers.some((p) => !!p?.apiKey?.trim()),
      reason: cfg.providerInvalidReason ?? null,
    }
  } catch {
    return { ok: false, keyPresent: false, reason: null }
  }
}

/** 第 27 批 §12.3⑤（R-A1.1）：ACP 会话装配期剔除的工具。ACP 是 headless 通道——
 *  question 工具需要交互 UI（`src/tools/question.mjs` 无 `ctx.onQuestion` 即 throw），
 *  模型可见即会调用、调用必错 → 装配期剔除（schema 直接少一条）。 */
export const ACP_EXCLUDED_TOOLS = ["question"]

/** M1/M2 session factory: one agent per session, built from the process cwd (single-cwd model).
 *  `id` is the ACP session id — it is baked into the callbacks at construction time
 *  (buildAcpCallbacks closure), so it must be known BEFORE createAcpSession runs.
 *  `request` is the transport's reverse-RPC channel (permissions + fs routing).
 *  `clientCaps` = the §3.4 snapshot taken at `session/new` time (fs gate, §11.4). */
export async function defaultCreateSession({ id, notify, request, log, clientCaps }) {
  const agent = await assembleAgent({ excludeTools: ACP_EXCLUDED_TOOLS })
  return createAcpSession({ id, agent, notify, request, log, clientCaps })
}

/**
 * Build the ACP method handlers. Returns { handlers, sessions, notifyRef, requestRef } —
 * notifyRef.current is set by runAcpServer once the transport exists; sessions
 * are created lazily (session/new), by which time the reference is live.
 * @param {{ version?: string, notify?: (method, params) => void, log?: (s: string) => void,
 *           isConfigured?: () => boolean, providerStatus?: () => { ok: boolean, keyPresent: boolean, reason: string|null },
 *           createSession?: (ctx) => Promise<object> }} deps
 */
export function buildAcpHandlers({
  version = VERSION,
  notify = () => {},
  log = () => {},
  isConfigured = defaultIsConfigured,
  providerStatus = defaultProviderStatus,
  createSession = defaultCreateSession,
  cwd = () => process.cwd(),
}) {
  const notifyRef = { current: notify }
  const requestRef = { current: async () => { throw new Error("no request channel") } }
  const sessions = new Map()
  let nextId = 1
  /** §3.4 客户端能力快照：`initialize` 单次写入，之后只读（快照丢失 ⇒ 全取 false ⇒ 本地兜底）。 */
  const clientCaps = { current: {} }
  /** 共享态经单一 `ctx` 传入（§3.5）——id 分配器与槽族共享，命名空间不因拆分而裂。 */
  const ctx = {
    getCwd: cwd,
    sessions,
    allocSessionId: () => String(nextId++),
    notifyRef,
    requestRef,
    // 能力位按「session/new 时刻取值」注入每个会话（§11.4——会话生命周期内不变）
    createSession: (opts) => createSession({ ...opts, clientCaps: clientCaps.current }),
    // 门助手由入口建一次、按引用传（§11.5——`session/new` 是门链首个触点）
    requireConfigured: createRequireConfigured({ isConfigured, providerStatus }),
    log,
  }

  return {
    handlers: {
      ...createCapsHandlers({ version, clientCaps, requireConfigured: ctx.requireConfigured, log }),
      ...createSessionHandlers(ctx),
      ...createSlotsHandlers(ctx),
      ...createExtHandlers(ctx),
    },
    sessions,
    notifyRef,
    requestRef,
  }
}

/** `thincoder acp --login` — terminal auth flow (§11.2 改法 4; body = acp/login.mjs). */
export { runAcpLogin } from "./acp/login.mjs"

/** `thincoder acp` — start the server and block until the client closes the pipe. */
export async function runAcpServer() {
  const log = (...a) => process.stderr.write(a.join(" ") + "\n")
  // Build handlers first, then wire the transport — no window where requests
  // hit an empty handler map. notifyRef/requestRef become live with the server.
  const built = buildAcpHandlers({ log })
  const server = createAcpServer(built.handlers, { log })
  built.notifyRef.current = server.notify
  built.requestRef.current = server.request
  log(`[acp] thincoder ${VERSION} — ACP v1 over stdio, waiting for initialize`)
  server.start()
}
