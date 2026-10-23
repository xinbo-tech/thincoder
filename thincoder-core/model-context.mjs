/**
 * model-context.mjs — 模型上下文解析的运行时事实面（`PROVIDER.md` §6.15 · 五级链 L1/L3 两层来源）。
 *
 * 组成三件：模块级 `baseURL → (归一 id → 条目表)` 只读缓存 · 键归一（末段 + 小写）· 值域校验
 * （`positiveInt`）。零本地 import（只碰运行时内建）⇒ 零 import 环。
 *
 *  - L1 `providers[].modelContext[模型]`（人工声明，**K** 单位）→ `manualContextK`（返 K）
 *  - L3 `/models` 自报窗口（**token**）→ `listedContextTokens`（返 token）
 * 单位进函数名：乘点唯一在 `model-specs.mjs`（L1 ∥ L2 ×1024，L3 不乘）——读函数名即知单位。
 *
 * 缓存触发 = 既有列表拉取（写面只在 `provider/list-models.mjs` 成功返回时调 `recordListedContext`）：
 * 六个消费面本来就要拉列表，顺带把窗口留在核里，**零新增请求**（D2）。读面是同步纯查表：未命中返
 * `null`、调用侧落下一层，永不抛、永不等待（R28）。
 *
 * 键归一 = 末段 + 小写（规则单源 = `PROVIDER.md` §6.9）：`qwen/ZHIPU/GLM-5.3` ⇒ `glm-5.3`。
 * **本面算子 = 末段相等**（不是前缀）：用户键 `glm-5.3` 不命中模型 `glm-5.3-flashx`（R29③）。
 * 同侧两条键归一后相撞 = 同一模型的两种写法 ⇒ **命中即取**（对象键序 ∥ 列表序第一条，不排序、
 * 不比较；R29④）——不拒、不告警、不落下一层。
 */

/** 值域校验单点（L1 K ∥ L3 token 共用谓词）：正整数才收，其余一律 `null`（= 未提供）。
 *  只认 `number`——写面交互输入是字符串，须先 `Number(String(v).trim())` 再判（调用侧责任）。 */
export function positiveInt(v) {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null
}

/** 模型名归一（末段 + 小写——§6.9 三面同一把尺子）。非串归一等价空串（脏载不抛）。 */
export function normalizeModelKey(name) {
  const m = (typeof name === "string" ? name : "").toLowerCase()
  const slash = m.lastIndexOf("/")
  return slash >= 0 ? m.slice(slash + 1) : m
}

function normalizeBaseURL(baseURL) {
  return (typeof baseURL === "string" ? baseURL : "").replace(/\/+$/, "")
}

/** 告警一次（模块级去重键）——本模块唯一告警出口；去重键决定「一次」的射程。 */
const warned = new Set()
export function warnContextOnce(key, message) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

// ─── L3 缓存：归一 baseURL → (归一 id → 条目表) ───────────────────────────────────
// 键 = 归一后的 baseURL（列表是端点的事实，不是本地别名的事实——探针目标常缺 name）。
// 写 = 每次成功拉取**整条替换**（不合并）：列表不再报某模型 ⇒ 该模型回到 L4；拉取失败不写、
// 不清空上次成功值（上次自报比静态表更接近事实）。归一索引在写时建好 ⇒ 读面是一次 `Map` 查表
// （同键多条目 = 末段相撞，读面取列表序第一条——R29④）。
const listedByEndpoint = new Map()

/** L3 写面（唯一入口）：记录一个端点的列表自报窗口表。`entries` = `[id, tokens]` 可迭代
 *  （Map ∥ 数组）；非法值当场丢弃（= 该模型列表未报）。空表也写入——「这次一条都没报」是事实。 */
export function recordListedContext(baseURL, entries) {
  const base = normalizeBaseURL(baseURL)
  if (!base) return
  const index = new Map()
  for (const [id, tokens] of entries ?? []) {
    if (typeof id !== "string" || !id) continue
    const value = positiveInt(tokens)
    if (value === null) continue
    const key = normalizeModelKey(id)
    if (!key) continue
    const bucket = index.get(key)
    if (bucket) bucket.push({ id, tokens: value })
    else index.set(key, [{ id, tokens: value }])
  }
  listedByEndpoint.set(base, index)
}

/** L3 读面：列表自报窗口（token，不乘）。未报 ⇒ `null`（落下一层）；同端点两 id 末段相撞
 *  ⇒ 取列表序第一条即用（同一模型，R29④——不排序、不比较、不告警）。 */
export function listedContextTokens(provider) {
  const base = normalizeBaseURL(provider?.baseURL)
  const target = normalizeModelKey(provider?.model)
  if (!base || !target) return null
  const bucket = listedByEndpoint.get(base)?.get(target)
  return bucket ? positiveInt(bucket[0].tokens) : null
}

/** L1 读面：`providers[].modelContext[模型]` 人工声明（K 单位）。未声明 ∥ 值非法 ⇒ `null`
 *  （落下一层）；两条键归一后相同 = 同一模型的两种写法 ⇒ 取对象键序第一条即用（R29④——
 *  不排序、不比较、不告警）。值非法在装载期已告警一次（`config.mjs`），此处只判不告（热路径）。 */
export function manualContextK(provider) {
  const table = provider?.modelContext
  if (!table || typeof table !== "object" || Array.isArray(table)) return null
  const target = normalizeModelKey(provider?.model)
  if (!target) return null
  for (const [key, value] of Object.entries(table)) if (normalizeModelKey(key) === target) return positiveInt(value)
  return null
}

/** 测试缝：清空 L3 缓存 + 告警去重（单元档用；生产零调用）。 */
export function _resetModelContextForTest() {
  listedByEndpoint.clear()
  warned.clear()
}
