/**
 * env-ref.mjs — 值位 `${env:NAME}` 引用的消费侧解析（单源叶档；机制 = `docs/core/design/CONFIG.md` §6.3）。
 *
 * 语义（零 import 纯函数）：
 *  - 整值与内嵌同解（`sk-${env:K}` 式）；同一值可含多引用；非字符串值原样通过。
 *  - 变量未设 ∕ 空串 ⇒ 抛错（点名变量；无「未设即缺省」回退——不静默字面透传）。
 *  - 畸形引用（`${env:` 起头不构成合法引用）同抛错（点名畸形片段）。
 *  - 解析单遍：替换产物不再二次扫描；解析产物永不回显、永不回写（调用方纪律——写盘链按磁盘原文）。
 */
const REF_PREFIX = "${env:"
const REF_RE = /\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g

/** 读一个变量（未设 ∕ 空串 ⇒ 抛错，点名变量；错误句零含解析产物 ∕ 前置字面）。 */
function readVar(name) {
  const v = process.env[name]
  if (v === undefined || v === "") {
    throw new Error(`env reference \${env:${name}}: variable "${name}" ${v === undefined ? "is not set" : "is empty"} — set the variable or replace the reference with a literal value`)
  }
  return v
}

/** 畸形引用抛错（快照自 `${env:` 起截——引用串之前的字面不进错误句）。 */
function badRef(value, idx) {
  return new Error(`malformed env reference ${JSON.stringify(value.slice(idx, idx + 24))} — expected \${env:NAME} with NAME matching [A-Za-z_][A-Za-z0-9_]*`)
}

/** 字符串值解析：无引用 ⇒ 原串返回；逐引用替换（每次 `${env:` 出现必须构成合法引用）。 */
export function resolveEnvRefs(value) {
  if (typeof value !== "string" || !value.includes(REF_PREFIX)) return value
  const out = []
  let pos = 0
  while (pos < value.length) {
    const idx = value.indexOf(REF_PREFIX, pos)
    if (idx === -1) { out.push(value.slice(pos)); break }
    REF_RE.lastIndex = idx
    const m = REF_RE.exec(value)
    if (!m || m.index !== idx) throw badRef(value, idx)
    out.push(value.slice(pos, idx), readVar(m[1]))
    pos = idx + m[0].length
  }
  return out.join("")
}

/** 键值对象解析（headers ∕ env 族）：无引用 ⇒ 原对象返回（零拷贝）；值非字符串原样。 */
export function resolveEnvRefMap(map) {
  if (map === null || typeof map !== "object" || Array.isArray(map)) return map
  let changed = false
  const out = {}
  for (const [k, v] of Object.entries(map)) {
    const rv = resolveEnvRefs(v)
    if (rv !== v) changed = true
    out[k] = rv
  }
  return changed ? out : map
}

/** providers[] 条目适配：`apiKey` ∥ `headers.*`（无引用 ⇒ 原对象返回——零拷贝零写回）。 */
export function resolveProviderSecrets(provider) {
  if (provider === null || typeof provider !== "object") return provider
  const apiKey = resolveEnvRefs(provider.apiKey)
  const headers = resolveEnvRefMap(provider.headers)
  if (apiKey === provider.apiKey && headers === provider.headers) return provider
  const out = { ...provider }
  if (apiKey !== provider.apiKey) out.apiKey = apiKey
  if (headers !== provider.headers) out.headers = headers
  return out
}

/** mcp.servers[] 条目适配：`token` ∥ `headers.*` ∥ `env.*`（无引用 ⇒ 原对象返回）。 */
export function resolveMcpServerSecrets(config) {
  if (config === null || typeof config !== "object") return config
  const token = resolveEnvRefs(config.token)
  const headers = resolveEnvRefMap(config.headers)
  const env = resolveEnvRefMap(config.env)
  if (token === config.token && headers === config.headers && env === config.env) return config
  const out = { ...config }
  if (token !== config.token) out.token = token
  if (headers !== config.headers) out.headers = headers
  if (env !== config.env) out.env = env
  return out
}
