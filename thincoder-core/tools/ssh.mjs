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
import { DESC, LEDGER_PARAM_DESC } from "./shared.mjs"
// `~` 展开单源（`touchedPaths` 钩子与传输件同一件叶子——`config.mjs` 已 import 同一处）。
import { expandHome } from "../expand-home.mjs"

export const SSH_ACTIONS = ["connect", "send", "read", "secret_input", "close", "list", "credentials", "forget", "put", "get"]

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
  if (action === "put" || action === "get") {
    // 两个传输动作 = 单文件（目录参数不收——递归归边界句）；主机 / 凭据全取会话记录值（S10）。
    if (typeof args.localPath !== "string" || args.localPath.trim() === "") return `Error: ${action} requires localPath`
    if (typeof args.remotePath !== "string" || args.remotePath.trim() === "") return `Error: ${action} requires remotePath`
    if (args.protocol !== undefined && args.protocol !== null && args.protocol !== "" && args.protocol !== "scp" && args.protocol !== "sftp") {
      return `Error: ${action} protocol must be "scp" (classic, the default) or "sftp"`
    }
    // S10「`put` 参数面没有 `host` / `user` / `port`」：传了就拒——静默忽略会让模型以为换了目标主机。
    const stray = ["host", "user", "port"].filter((k) => args[k] !== undefined && args[k] !== null && args[k] !== "")
    if (stray.length) {
      return `Error: ${action} takes the host / user / port from the session — remove ${stray.join(" / ")} (the session already names the target host)`
    }
  }
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
      action: { type: "string", enum: SSH_ACTIONS, description: "Action to run (one per call): connect | send | read | secret_input | close | list | credentials | forget | put | get." },
      host: { type: "string", description: "connect / forget: target host (IP or name)." },
      user: { type: "string", description: "connect: login user (optional: your local ssh config decides, else the user recorded for this host locally)." },
      port: { type: "number", description: "connect / forget: TCP port (optional, default 22)." },
      label: { type: "string", description: "connect: short human label for this session (optional); secret_input: label for the value being sent." },
      promptPattern: { type: "string", description: "connect: regex that marks the shell prompt as ready (optional; the default recognises lines ending in # > $ %): without a hit, send/read on a slow device wait out the full timeout instead of returning early." },
      id: { type: "string", description: "send / read / secret_input / close / put / get: session id from connect (`ssh#N`)." },
      data: { type: "string", description: "send: text to type into the session (a trailing newline is passed as-is; otherwise Enter is sent as `\\r`)." },
      settle: { type: "boolean", description: "send: wait for the ready verdict before returning (default true); false returns right after the bytes are written." },
      timeoutMs: { type: "number", description: "send / read: wait budget override (default 60000) — a return happens the moment the device is waiting for input (prompt, `--More--`, a y/n or password prompt); on expiry the call returns partial output plus a line naming what was not seen. put / get: transfer budget override (default 600000) — on expiry the process tree is killed." },
      maxChars: { type: "number", description: "read: return-window override (default 8000) — head 60% + a note + tail 40%; the omitted middle is kept in the session, so the next read collects it." },
      identityFile: { type: "string", description: "connect: private-key path to offer (`-i`, `~` expands); remembered for this host and reused when omitted (optional)." },
      localPath: { type: "string", description: "put / get: local file path (`~` expands; a file, never a directory)." },
      remotePath: { type: "string", description: "put / get: path of the file on the session host (`/flash/img.bin`)." },
      overwrite: { type: "boolean", description: "get only: replace an existing local file (default false — an existing target is refused, never overwritten silently). put follows scp's own semantics: a same-named remote file is replaced." },
      protocol: { type: "string", enum: ["scp", "sftp"], description: "put / get: `scp` = classic SCP protocol, the default and what network devices speak; `sftp` = the SFTP subsystem, for hosts that only offer that. No automatic fallback between them." },
      // 写门接面（⑬ ④）：`get` 往项目内落盘 ⇒ 与 `write` 同一道门——那一道门读的就是本参数。
      ledger: { type: "string", description: LEDGER_PARAM_DESC + "；仅 `get` 要号，`put` 写的是远端主机，不要" },
    },
    required: ["action"],
  },
  // 非工具级只读：动作级分类钩子接管（§6.22 NS3——`list` / `read` / `credentials` 免审）；也因此不进只读角色的子代工具表。
  readonly: false,
  isReadonlyAction(args) {
    return args?.action === "list" || args?.action === "read" || args?.action === "credentials"
  },
  // 写门接面（§6.22 ⑬ ④ · D-TO26）：只有 `get` 往本地落盘；其余动作不写项目内档。
  // 钩子契约 = `agent/helpers.mjs` 的 `toolTouchPaths`（`const hook = tool?.touchedPaths`）——
  // 光有这个钩子不够：门还要把 `ssh` 收进入口集并按 action 判要号，三处缺一不可。
  // `~` 在这里就展开成绝对形：钩子拿不到 `ctx`（契约形 = `touchedPaths(args)`，`toolTouchPaths` 以 `hook(a)` 调用），
  // 而各消费面都在其后按会话 cwd 归一（`resolve(agent.cwd, p)`；`agent.cwd` 即工具 ctx 的 `cwd`，见
  // `agent/dispatch-run.mjs` 的 `toolCtx`）⇒ 原样回 `~/x` 会被拼成 `<项目>/~/x` 这个虚构路径，工程模式下
  // `get` 到 `~`（本工具最常见的备份落点）因此被无故要号、判据点也不是真实落点。回 `expandHome` 的绝对形后，
  // 消费面的 `resolve(agent.cwd, …)` 对它恒等 ⇒ 判据点 = 真实落点，与传输件起跑点同一件叶子（D2）。
  // 空 ∥ 非字符串 ⇒ `[]`（不虚报——缺参由 execute 的 `validateArgs` 出可读句）。
  touchedPaths(args) {
    const localPath = String(args?.action ?? "") === "get" ? args?.localPath : null
    return typeof localPath === "string" && localPath.trim() !== "" ? [expandHome(localPath)] : []
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
    } else if (action === "put" || action === "get") {
      // 传输面自成一件（非交互原语：无剥离 / 无就绪判据 / 无遮蔽——塞进会话件会把两套语义混在一档）。
      const xfer = await import("../agent-tools/ssh-transfer.mjs")
      res = await xfer.transferSsh(parent, ctx, {
        action, id: args.id, localPath: args.localPath, remotePath: args.remotePath,
        overwrite: args.overwrite === true, protocol: args.protocol ?? null, timeoutMs: args.timeoutMs,
      })
    } else {
      res = mod.listSsh(parent)
    }
    if (res?.error) return res.error.startsWith("Error:") ? res.error : `Error: ${res.error}`
    return res?.text ?? "(no output)"
  },
}
