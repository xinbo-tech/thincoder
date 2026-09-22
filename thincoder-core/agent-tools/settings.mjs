/**
 * settings tool — agent-side configuration adjustment (SETTINGS-TOOL.md, 2026-09-05).
 * 用户裁定：全量 config.json 任意键（点分路径）+ 单工具多动作 list/get/set + 双端同批。
 * 语义：set = 写盘（config.json——磁盘真相最小化：只写被设的键——默认值不固化）+
 * 热应用（ctx.agent.config 内存对象立即更新——回合边界键下回合生效）。
 * 护栏：敏感键（路径段命中词表 apiKey/key/token/secret/password/authorization/auth/cookie/credential，
 * 或段名 headers/env 整族）回显/错误文本永不出现明文
 * （••••（masked）——防密钥泄漏进会话历史/trace）；已知键类型校验——非 null 叶子类型表
 * 自动派生自 config.mjs DEFAULTS（不手写防漂移——F-S1.5/N-S1.5）；null 默认值键与同族键
 * 走显式形状表（_NULL_LEAF_SHAPES 相等面 / _SIBLING_SHAPES 存在性面——按各自真实消费形态
 * 校验，完备性机械锁 + 一次性警告；SETTINGS-TOOL.md §8）；set 侧效走审批门（dispatch 动作级分类）。
 */
import { DEFAULTS, configPath, writeConfigAtomic } from "../config.mjs"

/** 敏感键段判定（完整点分路径的段级匹配——两句取或：词表段 ∨ 开口键族段；SETTINGS-TOOL.md §2.4） */
const SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password|authorization|auth|cookie|credential)($|[._-])/i
/** 开口键族段判定（headers / env——段名命中 ⇒ 其下全部子键整族遮罩：头名 / 变量名不可枚举） */
const SENSITIVE_FAMILY = /(^|[._-])(headers|env)($|[._-])/i
const MASKED = "••••（masked）"

/** #58（hygiene-sweep 批）：谓词/标记导出——CLI `/mcp` 表单现值脱敏同源（`cmd-mcp-form.mjs`）。 */
export function isSensitiveKey(path) {
  return SENSITIVE_SEGMENT.test(path) || SENSITIVE_FAMILY.test(path)
}

/* ─── 形状层（第 8 批 2026-09-11——SETTINGS-TOOL.md §8.3；两表结构：相等面 / 存在性面） ─── */

/**
 * null 叶子形状表——唯一「逐键手写形状」面（完备性锁的**相等面**：键集 == _nullLeafPaths(DEFAULTS)）。
 * 表值 = 形状规格：接受集 = 该键真实消费形态 ∪ `null`（显式清除——消费面均有「未设置」态）；
 * 不可消费形态（应用侧读不出写入值）→ 拒绝（违例抛错，磁盘/内存零变化）。
 */
const _NULL_LEAF_SHAPES = {
  defaultModel: { kind: "nonEmptyString", providerModel: true, expects: 'non-empty string ("provider:model" composite)' },
  "agent.subagentModel": { kind: "nonEmptyString", expects: "non-empty string" },
  shell: { kind: "nonEmptyString", expects: "non-empty string" },
  "memory.team": { kind: "team", expects: "object { repo: string, name?, dir? }" },
}

/** 同族/跨端形状表（**存在性断言面**——不参与完备性锁的集合相等）。W3 同族：`agent.subagentModels`
 *  默认 `{}` ⇒ 派生表零条目 ⇒ 零约束（字符串被静默忽略——回落 subagentModel）。 */
const _SIBLING_SHAPES = {
  "agent.subagentModels": { kind: "roleMap", expects: "object of role→non-empty string" },
}

/** 派生：递归遍历默认值对象——叶子（非对象/数组值）记 `路径 → typeof 默认值`（旧语义逐字保留：
 *  null 叶子记 "object"，其约束由形状表接管）；数组不递归（下标元素无类型约束——全量域）。 */
function _deriveTypes(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) _deriveTypes(v, p, out)
    else out[p] = Array.isArray(v) ? "array" : typeof v
  }
  return out
}

/** 类型表 = 派生 + 可选 `patch` 覆盖（测试缝——非 null 叶子逐键与派生结果相等；T-S2.15）。 */
function _buildShapeTable(obj, patch = null) {
  const out = _deriveTypes(obj)
  return patch ? Object.assign(out, patch) : out
}
const TYPE_MAP = _buildShapeTable(DEFAULTS)

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
    warn(`[settings] null-default keys missing from _NULL_LEAF_SHAPES: ${missing.join(", ")} — declare their real consumption shape`)
  }
  return missing
}
_checkShapeCompleteness(DEFAULTS) // 装载自检——形状表必须覆盖全部 null 叶子（漂移即警告）

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
    if (!value || typeof value !== "object" || Array.isArray(value)) throw _expectsError(path, spec.expects, value)
    for (const v of Object.values(value)) {
      if (typeof v !== "string" || !v.trim()) throw _expectsError(path, spec.expects, value)
    }
    return
  }
  // nonEmptyString —— defaultModel 另加 provider:model 形态面（与 model-ref.mjs:25-36 同判据；
  // 存在性面不查——D-S2.5）
  if (typeof value !== "string" || !value.trim()) throw _expectsError(path, spec.expects, value)
  if (spec.providerModel) {
    const sep = value.indexOf(":")
    if (sep <= 0 || !value.slice(sep + 1)) throw _expectsError(path, spec.expects, value)
  }
}

/**
 * 已知键值校验（set 写盘前；违例抛错——磁盘/内存零变化）：
 * ① 形状表命中键（`_NULL_LEAF_SHAPES` / `_SIBLING_SHAPES` **两表都查**——表值 = 形状规格）→ 形状校验
 *    （`null` = 显式清除，放行）；② 非 null 叶子（派生表值 = `typeof` 串）→ 既有语义逐字保留
 *    （`want === "array"` 跳过 / `null` + `want === "object"` 放行）；③ 未知键 → 原样通过（全量域）。
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

/** 点分路径解析（含数组数字段）——逐段下钻；返回 { ok, value } 或缺失段信息 */
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

/** 点分路径写入（自动建中间对象——cmd-config 数值项同款）；返回旧值 */
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

/** 递归展平 config 对象（数组下标段形态）→ 排序的 { path, value } 列表 */
function flatten(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object") flatten(v, p, out)
    else out.push({ path: p, value: v })
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : 1))
}

/** 行格式化：`key = value (type)`——敏感键值遮罩 */
function formatLine({ path, value }) {
  // #58（hygiene-sweep 批）：对象值渲染收正（原 `[object Object]`——JSON 化；敏感键仍恒遮）
  const shown = isSensitiveKey(path) ? MASKED : value !== null && typeof value === "object" ? JSON.stringify(value) : value
  return `${path} = ${shown} (${Array.isArray(value) ? "array" : typeof value})`
}

function parseValue(raw) {
  const s = String(raw)
  try {
    const v = JSON.parse(s)
    // JSON 顶层标量都接受；解析失败（裸字符串）→ 字符串字面
    if (typeof v === "number" || typeof v === "boolean" || v === null || Array.isArray(v) || typeof v === "object") return v
    // "abc"（带引号传的字符串）——JSON.parse 成功但返回字符串：返回**解析值**（去引号）
    // ——两端统一 ①（2026-09-11 用户裁定；SETTINGS-TOOL.md §9.3）。
    return v
  } catch {
    return s // 裸 abc → 字符串字面
  }
}

export function settingsTool(opts = {}) {
  const cfgPath = opts.configPath ?? configPath // 测试注入 tmp 文件；默认全局 configPath

  return {
    name: "settings",
    description:
      "Adjust ThinCoder runtime configuration — persisted to config.json AND hot-applied to the live agent config.\n" +
      "Actions: list (all keys + values, flattened) | get <key> | set <key> <value> — dot paths into config.json (agent.maxTurns, traces.enabled, providers.0.model, any nesting).\n" +
      "set persists to disk (only the set key is written — defaults are never baked in) and takes effect in the running session immediately (turn-boundary keys apply next turn); the value survives restarts.\n" +
      "Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null against their real consumption shape — defaultModel \"provider:model\", agent.subagentModel / shell non-empty string, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key). Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.\n" +
      "SENSITIVE keys (path segment matching apiKey/key/token/secret/password/authorization/auth/cookie/credential, or any key under a headers/env segment) are NEVER echoed in plaintext — list/get/set replies show ••••（masked）; setting a sensitive key is allowed and stored, but never echoed back.\n" +
      "list/get are read-only (planMode ok, no approval); set is a side effect (approval gate). The /config TUI command is the human equivalent.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "get", "set"], description: "list — full key/value inventory; get <key> — one value; set <key> <value> — persist + hot-apply" },
        key: { type: "string", description: "Dot path into config.json, e.g. agent.maxTurns / traces.enabled / providers.0.model" },
        value: { type: "string", description: "New value for set — parsed as JSON first (true/5/{...}/[...]), otherwise kept as string" },
      },
      required: ["action"],
    },
    readonly: false, // set 是侧效——dispatch 动作级分类放行 list/get
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
      // 写盘（D-F5b：磁盘真相最小化——writeConfigAtomic 磁盘新鲜读 + 只改被设键 + mtime
      // 门控——默认不固化；冲突/畸形抛错，内存不热应用（零虚假成功））+ 热应用（内存对象）
      const r = await writeConfigAtomic(cfgPath, (disk) => {
        setKeyPath(disk, args.key, value)
      })
      if (!r.ok) throw new Error("config changed on disk concurrently — retry (settings set not applied)")
      setKeyPath(config, args.key, value)
      const shown = isSensitiveKey(String(args.key)) ? MASKED : value
      return `settings set: ${args.key} = ${shown} (${Array.isArray(value) ? "array" : typeof value})${isSensitiveKey(String(args.key)) ? " — stored（值不回显）" : " — persisted + hot-applied（运行中已生效）"}`
    },
  }
}

/**
 * 测试缝导出（`_` 前缀——config.mjs `_setConfigPathForTest` 先例；SETTINGS-TOOL.md §8.3 第 6 条）：
 * `_checkShapeCompleteness` = 完备性锁的运行时面（T-S2.14「一次性警告列出键名」的机械断言缝）。
 */
export { _buildShapeTable, _nullLeafPaths, _NULL_LEAF_SHAPES, _SIBLING_SHAPES, _checkKnownKeyValue, _checkShapeCompleteness }
