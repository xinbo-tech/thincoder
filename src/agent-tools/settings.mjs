/**
 * settings tool — VS Code mirror (SETTINGS-TOOL.md, 2026-09-05 — CLI parity).
 * VS Code shares the same ~/.thincoder/config.json (config-io.mjs) — write disk =
 * the shared file; hot-apply = ctx.agent.config (live agent config).
 * Known-key type check uses a mini table (VS Code has no DEFAULTS export) mirroring
 * the CLI's auto-derived table for the stable agent/traces key set — add new known
 * keys on both ends together (dual-end parity discipline).
 */
import { persistRaw, conflictError, CONFIG_CONFLICT_HINT, AGENT_DEFAULTS, TRACES_DEFAULTS } from "../config-io.mjs"

/** 敏感键段判定（CLI settings.mjs 同正则——段级 apiKey/key/token/secret/password） */
const SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password)($|[._-])/i
const MASKED = "••••（masked）"

function isSensitiveKey(path) {
  return SENSITIVE_SEGMENT.test(path)
}

/**
 * 类型表：自动派生自 AGENT_DEFAULTS/TRACES_DEFAULTS（2026-09-05 方案 A——删手写 mini 表——
 * 与 CLI 的 DEFAULTS 自动派生同构）。null/对象/数组默认值键无标量约束（compactThreshold 的
 * null=auto、advisor 对象、consultModels 数组——消费方/面板层再校验——与 CLI 表语义对齐：
 * CLI DEFAULTS 同形状键才约束）。
 */
function buildTypeMap(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) buildTypeMap(v, p, out)
    else if (v !== null) out[p] = Array.isArray(v) ? "array" : typeof v
  }
  return out
}
const TYPE_MAP = { ...buildTypeMap(AGENT_DEFAULTS), ...buildTypeMap(TRACES_DEFAULTS, "traces") }

function resolvePath(obj, path) {
  const segs = String(path).split(".")
  let cur = obj
  for (let i = 0; i < segs.length; i++) {
    if (cur === null || typeof cur !== "object" || !(segs[i] in cur)) {
      return { ok: false, reached: segs.slice(0, i).join("."), missing: segs[i], depth: i }
    }
    cur = cur[segs[i]]
  }
  return { ok: true, value: cur }
}

function setKeyPath(obj, path, value) {
  const segs = String(path).split(".")
  let cur = obj
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur[segs[i]] === null || typeof cur[segs[i]] !== "object") cur[segs[i]] = {}
    cur = cur[segs[i]]
  }
  const last = segs[segs.length - 1]
  const old = cur[last]
  cur[last] = value
  return old
}

function flatten(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object") flatten(v, p, out)
    else out.push({ path: p, value: v })
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : 1))
}

function formatLine({ path, value }) {
  const shown = isSensitiveKey(path) ? MASKED : value
  return `${path} = ${shown} (${Array.isArray(value) ? "array" : typeof value})`
}

function parseValue(raw) {
  const s = String(raw)
  try {
    const v = JSON.parse(s)
    if (typeof v === "number" || typeof v === "boolean" || v === null || Array.isArray(v) || typeof v === "object") return v
    return v
  } catch {
    return s
  }
}

export const settingsTool = {
  name: "settings",
  description:
    "Adjust ThinCoder runtime configuration — persisted to the shared ~/.thincoder/config.json AND hot-applied to the live agent config (CLI parity — SETTINGS-TOOL.md).\n" +
    "Actions: list (all keys + values, flattened) | get <key> | set <key> <value> — dot paths (agent.maxTurns, traces.enabled, providers.0.model, any nesting).\n" +
    "set persists to disk (only the set key is written) and takes effect in the running session immediately (turn-boundary keys apply next turn); the value survives restarts.\n" +
    "Known keys are type-checked (agent.maxTurns must be a number, traces.enabled a boolean); unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.\n" +
    "SENSITIVE keys (path segment contains apiKey/key/token/secret/password) are NEVER echoed in plaintext — list/get/set replies show ••••（masked）; setting a sensitive key is allowed and stored, but never echoed back.\n" +
    "list/get are read-only (planMode ok, no approval); set is a side effect (approval gate).",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "get", "set"], description: "list — full key/value inventory; get <key> — one value; set <key> <value> — persist + hot-apply" },
      key: { type: "string", description: "Dot path into config.json, e.g. agent.maxTurns / traces.enabled / providers.0.model" },
      value: { type: "string", description: "New value for set — parsed as JSON first (true/5/{...}/[...]), otherwise kept as string" },
    },
    required: ["action"],
  },
  readonly: false, // set 是侧效——isReadonlyAction 放行 list/get
  // execute-tools.mjs 动作级分类（subagent/memory 同款——planMode 放行/免审批）
  isReadonlyAction(args) {
    const action = args?.action
    return action === "list" || action === "get"
  },
  async execute(args, ctx) {
    const action = args?.action
    if (!["list", "get", "set"].includes(action)) throw new Error(`settings: action must be one of list/get/set — got ${JSON.stringify(action)}`)
    const config = ctx?.agent?.config ?? null
    if (!config) throw new Error("settings: no live agent config (ctx.agent.config missing)")
    if (action === "list") {
      const rows = flatten(config)
      if (rows.length === 0) return "（空配置——无已设置键）"
      return rows.map(formatLine).join("\n")
    }
    if (action === "get") {
      if (!args.key) throw new Error("settings get: key is required (dot path, e.g. agent.maxTurns)")
      const r = resolvePath(config, args.key)
      if (!r.ok) {
        const hint = r.depth === 0 ? "（config 顶层无此键——顶层可用键见 settings list）" : `（父键 ${r.reached || "顶层"} 存在——无 ${r.missing} 子键）`
        throw new Error(`settings get: no such key "${args.key}" ${hint}`)
      }
      return formatLine({ path: args.key, value: r.value })
    }
    // set
    if (!args.key || args.value === undefined) throw new Error("settings set: key and value are required")
    const value = parseValue(args.value)
    const want = TYPE_MAP[String(args.key)]
    if (want) {
      const got = value === null ? "null" : typeof value
      if (got !== want && !(value === null && want === "object")) {
        throw new Error(`settings set: "${args.key}" expects ${want} — got ${got} (${JSON.stringify(args.value)})`)
      }
    }
    // 写盘（共享 config.json——磁盘真相最小化——R10 F5b：走 persistRaw 收口——
    // loadRaw 新鲜读 + saveRaw 写前 mtime 门控）→ 冲突时放弃并提示重试（决策① A）
    const r = persistRaw((raw) => { setKeyPath(raw, args.key, value) })
    if (conflictError(r)) throw new Error(CONFIG_CONFLICT_HINT)
    setKeyPath(config, args.key, value)
    const shown = isSensitiveKey(String(args.key)) ? MASKED : value
    return `settings set: ${args.key} = ${shown} (${Array.isArray(value) ? "array" : typeof value})${isSensitiveKey(String(args.key)) ? " — stored（值不回显）" : " — persisted + hot-applied（运行中已生效）"}`
  },
}
