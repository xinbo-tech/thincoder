/**
 * settings tool — agent-side configuration adjustment (SETTINGS-TOOL.md, 2026-09-05).
 * 用户裁定：全量 config.json 任意键（点分路径）+ 单工具多动作 list/get/set + 双端同批。
 * 语义：set = 写盘（config.json——磁盘真相最小化：只写被设的键——默认值不固化）+
 * 热应用（ctx.agent.config 内存对象立即更新——回合边界键下回合生效）。
 * 护栏：敏感键（路径段含 apiKey/key/token/secret/password）回显/错误文本永不出现明文
 * （••••（masked）——防密钥泄漏进会话历史/trace）；已知键类型校验（类型表自动派生自
 * config.mjs DEFAULTS——不手写防漂移）；set 侧效走审批门（dispatch 动作级分类）。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { DEFAULTS, configPath } from "../config.mjs"

/** 敏感键段判定（完整点分路径的段级匹配——apiKey/api_key/api-key/token/secret/password 形态） */
const SENSITIVE_SEGMENT = /(^|[._-])(api[_-]?key|key|token|secret|password)($|[._-])/i
const MASKED = "••••（masked）"

function isSensitiveKey(path) {
  return SENSITIVE_SEGMENT.test(path)
}

/**
 * 类型表：递归遍历 DEFAULTS——叶子（非对象/数组值）记 `路径 → typeof 默认值`。
 * 数组（providersList 等）不递归（下标元素无类型约束——全量域）；对象节递归到叶子。
 */
function buildTypeMap(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) buildTypeMap(v, p, out)
    else out[p] = Array.isArray(v) ? "array" : typeof v
  }
  return out
}
const TYPE_MAP = buildTypeMap(DEFAULTS)

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
  const shown = isSensitiveKey(path) ? MASKED : value
  return `${path} = ${shown} (${Array.isArray(value) ? "array" : typeof value})`
}

function parseValue(raw) {
  const s = String(raw)
  try {
    const v = JSON.parse(s)
    // JSON 顶层标量都接受；解析失败（裸字符串）→ 字符串字面
    if (typeof v === "number" || typeof v === "boolean" || v === null || Array.isArray(v) || typeof v === "object") return v
    return s // "abc"（带引号传的字符串）——JSON.parse 成功但返回字符串——保持解析结果
  } catch {
    return s // 裸 abc → 字符串字面
  }
}

export function settingsTool(opts = {}) {
  const cfgPath = opts.configPath ?? configPath // 测试注入 tmp 文件；默认全局 configPath

  async function readDisk() {
    let text
    try { text = readFileSync(cfgPath, "utf8") } catch { return {} } // 不存在 → 空对象（写盘最小化——默认不固化）
    try { return JSON.parse(text) } catch { throw new Error(`settings: config file not parseable — refusing to overwrite: ${cfgPath}`) }
  }
  async function writeDisk(disk) {
    mkdirSync(join(cfgPath, ".."), { recursive: true })
    writeFileSync(cfgPath, JSON.stringify(disk, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  }

  return {
    name: "settings",
    description:
      "Adjust ThinCoder runtime configuration — persisted to config.json AND hot-applied to the live agent config.\n" +
      "Actions: list (all keys + values, flattened) | get <key> | set <key> <value> — dot paths into config.json (agent.maxTurns, traces.enabled, providers.0.model, any nesting).\n" +
      "set persists to disk (only the set key is written — defaults are never baked in) and takes effect in the running session immediately (turn-boundary keys apply next turn); the value survives restarts.\n" +
      "Known keys are type-checked against the built-in defaults (agent.maxTurns must be a number, traces.enabled a boolean); unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings.\n" +
      "SENSITIVE keys (path segment contains apiKey/key/token/secret/password) are NEVER echoed in plaintext — list/get/set replies show ••••（masked）; setting a sensitive key is allowed and stored, but never echoed back.\n" +
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
      // 已知键类型校验（类型表派生自 DEFAULTS——未知键 JSON 原样）
      const want = TYPE_MAP[String(args.key)]
      if (want && want !== "array") {
        const got = value === null ? "null" : typeof value
        if (got !== want && !(value === null && want === "object")) {
          throw new Error(`settings set: "${args.key}" expects ${want} — got ${got} (${JSON.stringify(args.value)})`)
        }
      }
      // 写盘（磁盘真相最小化：只改被设键——默认不固化）+ 热应用（内存对象）
      const disk = await readDisk()
      setKeyPath(disk, args.key, value)
      await writeDisk(disk)
      setKeyPath(config, args.key, value)
      const shown = isSensitiveKey(String(args.key)) ? MASKED : value
      return `settings set: ${args.key} = ${shown} (${Array.isArray(value) ? "array" : typeof value})${isSensitiveKey(String(args.key)) ? " — stored（值不回显）" : " — persisted + hot-applied（运行中已生效）"}`
    },
  }
}
