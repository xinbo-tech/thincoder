/**
 * settings tool — VS Code mirror (SETTINGS-TOOL.md, 2026-09-05 — CLI parity).
 * VS Code shares the same ~/.thincoder/config.json (config-io.mjs) — write disk =
 * the shared file; hot-apply = ctx.agent.config (live agent config).
 * Known-key check: non-null leaves derive from AGENT_DEFAULTS/TRACES_DEFAULTS (no
 * hand-written mirror table), addressed by their canonical full dot paths (`agent.*` /
 * `traces.*` — the paths the tool is actually called with); null leaves and the
 * cross-end / same-family keys (defaultModel/shell/memory.team — consumed by the CLI;
 * agent.subagentModels — consumed by this end) go through explicit shape tables
 * (_NULL_LEAF_SHAPES / _SIBLING_SHAPES — same source as the CLI, §8.3).
 */
import { persistRaw, conflictError, CONFIG_CONFLICT_HINT, AGENT_DEFAULTS, TRACES_DEFAULTS } from "../config-io.mjs"

/** 敏感键段判定（CLI settings.mjs 同正则——段级 apiKey/key/token/secret/password） */
const SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password)($|[._-])/i
const MASKED = "••••（masked）"

function isSensitiveKey(path) {
  return SENSITIVE_SEGMENT.test(path)
}

/* ─── 形状层（第 8 批 2026-09-11——与 CLI 同源；详本见 CLI 档 SETTINGS-TOOL.md §8.3） ─── */

/** 本端 null 叶子形状表（完备性锁的**相等面**：键集 == _nullLeafPaths({ agent: AGENT_DEFAULTS })）。
 *  接受集 = 真实消费形态 ∪ `null`（显式清除——compactThreshold 的 null = auto）。 */
const _NULL_LEAF_SHAPES = {
  "agent.subagentModel": { kind: "nonEmptyString", expects: "non-empty string" },
  "agent.compactThreshold": { kind: "number", expects: "number" },
}

/** 同族/跨端形状表（**存在性断言面**——不参与集合相等）。跨端 3 + 同族 1 = 4 条：跨端三键
 *  住在共享 config.json，由 CLI 读侧消费；同族键 `agent.subagentModels`（第 12 批第 4 条）
 *  由本端读侧消费（`subagent.mjs` `effectiveSubagentModel`——默认 `{}` ⇒ 派生表零条目 ⇒
 *  零约束：字符串形态被接受并落盘、读侧静默 undefined）——两种消费者同一份形状判据。 */
const _SIBLING_SHAPES = {
  defaultModel: { kind: "nonEmptyString", providerModel: true, expects: 'non-empty string ("provider:model" composite)' },
  shell: { kind: "nonEmptyString", expects: "non-empty string" },
  "memory.team": { kind: "team", expects: "object { repo: string, name?, dir? }" },
  "agent.subagentModels": { kind: "roleMap", expects: "object of role→non-empty string" },
}

/** 派生根（config.json 顶层节形态——键空间 = 工具寻址的完整点分路径）。 */
const _DEFAULTS_ROOT = { agent: AGENT_DEFAULTS, traces: TRACES_DEFAULTS }

/** 派生：递归遍历默认值对象——叶子（非对象/数组值）记 `路径 → typeof 默认值`；数组不递归。
 *  null 叶子记 "object"（派生规则不变），其约束由形状表接管。 */
function _deriveTypes(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) _deriveTypes(v, p, out)
    else out[p] = Array.isArray(v) ? "array" : typeof v
  }
  return out
}

/** 类型表 = 派生 + 可选 `patch` 覆盖（测试缝——非 null 叶子逐键与派生结果相等；T-S2.34）。 */
function _buildShapeTable(obj, patch = null) {
  const out = _deriveTypes(obj)
  return patch ? Object.assign(out, patch) : out
}
const TYPE_MAP = _buildShapeTable(_DEFAULTS_ROOT)

/** null 叶子路径枚举（数组不递归——与派生表同域）。 */
function _nullLeafPaths(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v === null) out.push(p)
    else if (typeof v === "object" && !Array.isArray(v)) _nullLeafPaths(v, p, out)
  }
  return out
}

/** 完备性锁（N-S1.5）：未声明的 null 叶子 = 形状表漂移——返回键名 + 一次性警告列出键名。 */
let _shapeWarned = false
function _checkShapeCompleteness(defaults, warn = console.warn) {
  const declared = new Set(Object.keys(_NULL_LEAF_SHAPES))
  const missing = _nullLeafPaths(defaults).filter((p) => !declared.has(p))
  if (missing.length && !_shapeWarned) {
    _shapeWarned = true
    warn(`[settings] null-default keys missing from _NULL_LEAF_SHAPES: ${missing.join(", ")} — declare their real consumption shape (SETTINGS-TOOL.md §8.3; N-S1.5 completeness lock)`)
  }
  return missing
}
_checkShapeCompleteness(_DEFAULTS_ROOT) // 装载自检——形状表必须覆盖全部 null 叶子（漂移即警告）

/** 值位渲染（错误文本——敏感键命中时遮罩：N-S1.2 / D-S2.4——明文零进错误句）。 */
function _shownValue(path, value) {
  return isSensitiveKey(path) ? MASKED : JSON.stringify(value)
}

function _kindOf(value) {
  return value === null ? "null" : Array.isArray(value) ? "array" : typeof value
}

function _expectsError(path, expects, value) {
  return new Error(`settings set: "${path}" expects ${expects} — got ${_kindOf(value)} (${_shownValue(path, value)})`)
}

/** 形状校验（形状表命中键——`null` 在 _checkKnownKeyValue 已放行）。 */
function _checkShape(path, spec, value) {
  if (spec.kind === "number") {
    if (typeof value !== "number") throw _expectsError(path, spec.expects, value)
    return
  }
  if (spec.kind === "team") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw _expectsError(path, spec.expects, value)
    if (typeof value.repo !== "string" || !value.repo.trim()) {
      throw new Error(`settings set: "${path}" requires a non-empty "repo" (team layer stays off without it) — got ${_shownValue(path, value)}`)
    }
    for (const k of ["name", "dir"]) {
      if (value[k] !== undefined && (typeof value[k] !== "string" || !value[k].trim())) throw _expectsError(path, spec.expects, value)
    }
    return
  }
  if (spec.kind === "roleMap") {
    // 角色映射（`agent.subagentModels`）：非对象/数组 ⇒ 拒；逐值非空串（角色名不校验）；
    // `{}` 空对象 = 有效清除态（消费面 `cfg.subagentModels?.[role] ?? cfg.subagentModel`）。
    if (!value || typeof value !== "object" || Array.isArray(value)) throw _expectsError(path, spec.expects, value)
    for (const v of Object.values(value)) {
      if (typeof v !== "string" || !v.trim()) throw _expectsError(path, spec.expects, value)
    }
    return
  }
  // nonEmptyString —— defaultModel 另加 provider:model 形态面（与 CLI/model-ref 同判据；存在性不查）
  if (typeof value !== "string" || !value.trim()) throw _expectsError(path, spec.expects, value)
  if (spec.providerModel) {
    const sep = value.indexOf(":")
    if (sep <= 0 || !value.slice(sep + 1)) throw _expectsError(path, spec.expects, value)
  }
}

/**
 * 已知键值校验（set 写盘前；违例抛错——磁盘/内存零变化）：
 * ① 形状表命中键（两表都查）→ 形状校验（`null` = 显式清除，放行）；② 非 null 叶子
 * （派生表值 = `typeof` 串）→ 既有语义；③ 未知键 → 原样通过（全量域）。
 */
function _checkKnownKeyValue(path, value) {
  const spec = _NULL_LEAF_SHAPES[path] ?? _SIBLING_SHAPES[path]
  if (spec) {
    if (value === null) return // 显式清除 = 有效动作（消费面均有「未设置」态——D-S2.3）
    return _checkShape(path, spec, value)
  }
  const want = TYPE_MAP[path]
  if (want && want !== "array") {
    const got = value === null ? "null" : typeof value
    if (got !== want && !(value === null && want === "object")) throw _expectsError(path, want, value)
  }
}

/* ─── 既有工具面 helpers（第 8 批零改动） ─── */

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
    // JSON 可解析 → 落盘**解析值**（对象/数组/数值/布尔/null 同径；去引号——F-S1.3 ①）
    return JSON.parse(s)
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
    "Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null (or that live only in the shared config.json) against their real consumption shape — defaultModel \"provider:model\", agent.subagentModel / shell non-empty string, agent.compactThreshold a number, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key). Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.\n" +
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
    // 已知键校验（形状表两表都查 + 派生类型表——SETTINGS-TOOL.md §8.3；未知键 JSON 原样）
    _checkKnownKeyValue(String(args.key), value)
    // 写盘（共享 config.json——磁盘真相最小化——R10 F5b：走 persistRaw 收口——
    // loadRaw 新鲜读 + saveRaw 写前 mtime 门控）→ 冲突时放弃并提示重试（决策① A）
    const r = persistRaw((raw) => { setKeyPath(raw, args.key, value) })
    if (conflictError(r)) throw new Error(CONFIG_CONFLICT_HINT)
    setKeyPath(config, args.key, value)
    const shown = isSensitiveKey(String(args.key)) ? MASKED : value
    return `settings set: ${args.key} = ${shown} (${Array.isArray(value) ? "array" : typeof value})${isSensitiveKey(String(args.key)) ? " — stored（值不回显）" : " — persisted + hot-applied（运行中已生效）"}`
  },
}

/** 测试缝导出（`_` 前缀——`config-io.mjs _setConfigPathForTest` 先例；CLI 端同款集合）。 */
export { _buildShapeTable, _nullLeafPaths, _NULL_LEAF_SHAPES, _SIBLING_SHAPES, _checkKnownKeyValue, _checkShapeCompleteness }
