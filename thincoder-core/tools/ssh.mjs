/**
 * tools/ssh.mjs — SSH 会话工具面（薄接线）：schema ∥ 参数校验 ∥ `isReadonlyAction` ∥ 回执/错误形
 * （设计 = `docs/core/design/TOOLS.md` §6.22 —— D-TO17/D-TO18 · 台账 #1436；保存面 D-TO19/D-TO20 · 台账 #1602；
 * 机制单点 = `agent-tools/ssh-session.mjs`（保存件 = `agent-tools/ssh-vault.mjs`）；描述档 = `tool-docs/ssh.md`）。
 *
 * 分类钩子（KD-2 ∥ KD-11 同式——动作级，工具级只读位恒 false）：免审 = `list` ∥ `read` ∥ `credentials`
 * （只读豁免，NS3 判据）；过门 = `connect` ∥ `send` ∥ `secret_input` ∥ `close` ∥ `forget`——**携密动作仍属
 * 写动作**，门不放松；携密径审批文案 = 掩码占位（`permission.mjs`，值不回显 ⇒ 不入上下文 / 审批记录）。
 *
 * 失败回执**返回**（不 throw）——首行 `Error: …` = 模型面失败形（`bash` / `browser` 既例）；
 * 无 UI 考（缺 `ctx.onSecretInput` 回调）⇒ 机制档抛可读错（`question.mjs` 无 UI 抛例同旨）。
 * 会话跨调用存活于池（非本档持有）；depth>0 排除（`agent/helpers.mjs` `SUBAGENT_TOOL_EXCLUSIONS`）。
 * 动态 import（W8 契约②：agent-tools 静态链达 node:sqlite——端壳静态闭包须保持零命中）。
 */
import { DESC } from "./shared.mjs"

export const SSH_ACTIONS = ["connect", "send", "read", "secret_input", "close", "list", "credentials", "forget"]

/** 参数校验（缺必填 / 形错 ⇒ `Error: …`——不执行；§6.22 动作表逐动作必填面）。 */
export function validateArgs(args) {
  const action = args?.action
  if (!SSH_ACTIONS.includes(action)) {
    return `Error: unknown ssh action "${action ?? ""}" — actions: ${SSH_ACTIONS.join(", ")}`
  }
  if (action === "connect") {
    if (typeof args.host !== "string" || args.host.trim() === "") return "Error: connect requires host"
    if (args.port !== undefined && args.port !== null && args.port !== "" && !Number.isFinite(Number(args.port))) {
      return "Error: connect port must be a number"
    }
    return null
  }
  if (action === "list" || action === "credentials") return null
  if (action === "forget") {
    if (typeof args.host !== "string" || args.host.trim() === "") return "Error: forget requires host"
    if (args.port !== undefined && args.port !== null && args.port !== "" && !Number.isFinite(Number(args.port))) {
      return "Error: forget port must be a number"
    }
    return null
  }
  if (typeof args.id !== "string" || args.id.trim() === "") {
    return `Error: ${action} requires id (the session id from connect, form "ssh#N")`
  }
  if (action === "send" && typeof args.data !== "string") return "Error: send requires data"
  return null
}

export const sshTool = {
  name: "ssh",
  description: DESC("ssh"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: SSH_ACTIONS, description: "Action to run (one per call): connect | send | read | secret_input | close | list | credentials | forget." },
      host: { type: "string", description: "connect / forget: target host (IP or name)." },
      user: { type: "string", description: "connect: login user (optional: your local ssh config decides, else the user recorded for this host locally)." },
      port: { type: "number", description: "connect / forget: TCP port (optional, default 22)." },
      label: { type: "string", description: "connect: short human label for this session (optional); secret_input: label for the value being sent." },
      promptPattern: { type: "string", description: "connect: regex that marks the shell prompt as ready (optional; the default recognises lines ending in # > $ %): without a hit, send/read on a slow device wait out the full timeout instead of returning early." },
      id: { type: "string", description: "send / read / secret_input / close: session id from connect (`ssh#N`)." },
      data: { type: "string", description: "send: text to type into the session (a trailing newline is passed as-is; otherwise Enter is sent as `\\r`)." },
      settle: { type: "boolean", description: "send: wait for the ready verdict before returning (default true); false returns right after the bytes are written." },
      timeoutMs: { type: "number", description: "send / read: wait budget override (default 60000) — a return happens the moment the device is waiting for input (prompt, `--More--`, a y/n or password prompt); on expiry the call returns partial output plus a line naming what was not seen." },
      maxChars: { type: "number", description: "read: return-window override (default 8000) — head 60% + a note + tail 40%; the omitted middle is kept in the session, so the next read collects it." },
      identityFile: { type: "string", description: "connect: private-key path to offer (`-i`, `~` expands); remembered for this host and reused when omitted (optional)." },
    },
    required: ["action"],
  },
  // 非工具级只读：动作级分类钩子接管（§6.22 NS3——`list` / `read` / `credentials` 免审）；也因此不进只读角色的子代工具表。
  readonly: false,
  isReadonlyAction(args) {
    return args?.action === "list" || args?.action === "read" || args?.action === "credentials"
  },
  async execute(args, ctx) {
    const invalid = validateArgs(args)
    if (invalid) return invalid
    // 动态 import（W8 契约②——与 bash / browser 异步面同式）。
    const mod = await import("../agent-tools/ssh-session.mjs")
    const parent = ctx?.agent ?? null
    const action = args.action
    let res
    if (action === "connect") {
      res = await mod.connectSsh(parent, ctx, {
        host: args.host, user: args.user ?? null, port: args.port ?? null,
        label: args.label ?? null, promptPattern: args.promptPattern ?? null,
        identityFile: args.identityFile ?? null,
      })
    } else if (action === "send") {
      res = await mod.sendSsh(parent, ctx, { id: args.id, data: args.data, settle: args.settle !== false, timeoutMs: args.timeoutMs })
    } else if (action === "read") {
      res = await mod.readSsh(parent, ctx, { id: args.id, timeoutMs: args.timeoutMs, maxChars: args.maxChars })
    } else if (action === "secret_input") {
      res = await mod.secretInputSsh(parent, ctx, { id: args.id, label: args.label ?? null })
    } else if (action === "close") {
      res = await mod.closeSsh(parent, ctx, { id: args.id })
    } else if (action === "credentials") {
      res = mod.credentialsSsh()
    } else if (action === "forget") {
      res = mod.forgetSsh({ host: args.host, port: args.port ?? null })
    } else {
      res = mod.listSsh(parent)
    }
    if (res?.error) return res.error.startsWith("Error:") ? res.error : `Error: ${res.error}`
    return res?.text ?? "(no output)"
  },
}
