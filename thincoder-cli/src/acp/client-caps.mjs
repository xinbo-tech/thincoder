/**
 * client-caps.mjs — `initialize` / `authenticate` handlers + the server-level
 * client-capability snapshot (ACP-CLIENT.md §3.4 · §11.2 · §11.3).
 *
 * `initialize` is the protocol's ONLY capability-exchange point (schema:
 * `InitializeRequest.clientCapabilities`). The snapshot written here is read once
 * — by the auth-methods gate (this module) and the fs reverse-RPC gate
 * (`bridge.mjs`) — and never mutated again (protocol semantics). Omitted
 * capabilities are UNSUPPORTED (文档逐字「MUST treat all capabilities omitted in
 * the initialize request as UNSUPPORTED」) — never optimistic defaults.
 */
import { ACP_ERRORS } from "./transport.mjs"

/** Protocol versions this agent speaks (schema `ProtocolVersion`; v1 — §11.3 改法①). */
export const SUPPORTED_PROTOCOL_VERSIONS = [1]

/** Version negotiation (文档逐字): same version when supported, else the latest we support. */
export function negotiateProtocolVersion(requested, supported = SUPPORTED_PROTOCOL_VERSIONS) {
  const latest = Math.max(...supported)
  return Number.isInteger(requested) && supported.includes(requested) ? requested : latest
}

/** `initialize.authMethods` entries (schema `AuthMethod` objects — `AuthMethodTerminal`
 *  requires `id` + `name`). The `terminal` entry MUST be advertised **only when the client
 *  enabled its terminal auth capability** (`clientCaps.auth.terminal === true`); otherwise
 *  `[]`. `args` are APPENDED to the configured agent invocation (the descriptor cannot
 *  provide a command) ⇒ the client actually launches `thincoder acp --login`. */
export function authMethodsFor(clientCaps) {
  if (clientCaps?.auth?.terminal !== true) return []
  return [{
    id: "terminal",
    type: "terminal",
    name: "Terminal login",
    description: "Run `thincoder acp --login` in an interactive terminal to configure the provider API key.",
    args: ["--login"],
  }]
}

/**
 * Build the initialize / authenticate handlers.
 * @param {{ version: string, clientCaps: { current: object },
 *           requireConfigured: () => { error?: object }, log?: (s: string) => void }} deps
 *   `requireConfigured` = the shared credential gate (§11.5 — lives in handlers-session.mjs).
 * @returns {Record<string, (params: object) => object>}
 */
export function createCapsHandlers({ version, clientCaps, requireConfigured, log = () => {} }) {
  return {
    initialize: (params) => {
      const caps = params?.clientCapabilities && typeof params.clientCapabilities === "object" ? params.clientCapabilities : {}
      clientCaps.current = caps // §3.4 — written once (initialize is the only exchange point)
      log(`[acp] initialize — protocolVersion=${JSON.stringify(params?.protocolVersion)} auth.terminal=${caps.auth?.terminal === true}`)
      return {
        protocolVersion: negotiateProtocolVersion(params?.protocolVersion),
        // 能力面如实声明（§11.3 改法③）：已实现的 loadSession + 四键 sessionCapabilities；
        // promptCapabilities 全 false（本面不接 image/audio/embeddedContext——不虚报）；
        // mcpCapabilities / additionalDirectories 省略 = 不支持（G7 / G4 本批不做）。
        agentCapabilities: {
          loadSession: true,
          promptCapabilities: { image: false, audio: false, embeddedContext: false },
          sessionCapabilities: { list: {}, resume: {}, delete: {}, close: {} },
        },
        authMethods: authMethodsFor(caps),
        agentInfo: { name: "thincoder", version },
      }
    },

    authenticate: (params) => {
      // 契约形状（§11.2 改法③）：methodId 不属于**当前已宣告**的方法 → -32602；
      // 凭据不可解析 → -32000；通过 → 空结果 `{}`（AuthenticateResponse 只有 `_meta`）。
      // 注：契约禁止客户端以 `terminal` 调本方法——若客户端仍调且该法已宣告，本实现宽容放行。
      const advertised = authMethodsFor(clientCaps.current)
      const methodId = params?.methodId
      if (!advertised.some((m) => m.id === methodId)) {
        return {
          error: {
            ...ACP_ERRORS.INVALID_PARAMS,
            message: `unknown auth method: ${String(methodId)} (advertised: ${advertised.map((m) => m.id).join(", ") || "none"})`,
          },
        }
      }
      const gate = requireConfigured()
      if (gate.error) return gate
      return {}
    },
  }
}
