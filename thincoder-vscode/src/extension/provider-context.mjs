/**
 * provider-context.mjs — VSC 面 `modelContext` 读写（宿主侧，**纯 Node**：零 `vscode` 依赖 ⇒ 可单测）。
 *
 * 机制单源 = `docs/core/design/PROVIDER.md` §6.15「写面：`modelContext` 编辑（三端同形 · 同批齐）」：
 *  - 读面载荷三键：`modelContext`（已声明映射，**K 原值**，供编辑面回显）+ `modelContextText`
 *    （同键的展示串，宿主经核 `formatDeclaredContextK` 出词）+ `context`
 *    （`providerSpec(entry).context`，token，留给用量百分比面）。
 *  - 写面：值单位 **K**，端侧零乘 1024（乘点唯一在核 `model-specs.mjs` 的 L1 ∥ L2 合流点）。
 *    值校验 = 先 parse 再判（`Number(String(v).trim())` → 核 `positiveInt`）；空 ⇒ 清除语义。
 *  - 键处理 = 核同一把尺子（末段 + 小写相等，`PROVIDER.md` §6.9）：命中既有键则**改写**该键
 *    （不新增第二种拼写）；未命中用模型 id 原样作键。两条键归一后相撞 = 同一模型的两种写法 ⇒
 *    一并改写为同一新值（R29⑤）；清除 ⇒ 一并删除全部归一相等的键。
 *
 * 为什么本档独立：`settings.mjs` 经 `provider-flows.mjs` 拉进 `vscode`（扩展宿主模块不可在 Node 里
 * import）⇒ 读写面留在本档才可被单元档直接驱动；`settings.mjs` 按设计坐标 re-export 同名函数，
 * 对外导入面不变。
 */
import { providerSpec } from "../specs.mjs"
import { formatDeclaredContextK } from "@thincoder/core/model-specs.mjs"
import { normalizeModelKey, positiveInt } from "@thincoder/core/model-context.mjs"
import { vscPersistRaw } from "./settings-panel-write.mjs"
import { conflictError, loadRaw } from "@thincoder/core/config-io.mjs"

/** 渠道条目的读面三键：`{ modelContext, modelContextText, context }`。
 *  `modelContext` = 盘上已声明映射的浅拷贝（空 ∥ 非法形 ⇒ `{}`——编辑面只读它）；
 *  `modelContextText` = 同键的展示串（经核 `formatDeclaredContextK` 出词；**只投影合法正整数**，
 *  非法值条目不投影——同桌面 `modelContextTextOf`）；
 *  `context` = 核解析值（token；渠道条目无 `model`，故通常是 L2 旧键 ∥ L4/L5——展示面不拿它当
 *  「已声明值」，那是 `modelContextText`）。 */
export function providerContextFields(entry) {
  const table = entry?.modelContext
  const declared = table && typeof table === "object" && !Array.isArray(table) ? { ...table } : {}
  const text = {}
  for (const [key, value] of Object.entries(declared)) {
    const k = positiveInt(value)
    if (k !== null) text[key] = formatDeclaredContextK(k)
  }
  return { modelContext: declared, modelContextText: text, context: providerSpec(entry).context }
}

/** 写 `providers[].modelContext[<模型>]`（值单位 **K**）。
 *  - `k` 数字 ∥ 数字串 ⇒ 校验后写入；`null` ∥ `undefined` ∥ 空串/空白 ⇒ 清除该模型键
 *    （清除后对象无键 ⇒ 连 `modelContext` 整键删除——不留空对象）。
 *  - 返回 `null` = 写成功；错误串 = 失败原因（形沿 `handleSetProviderProxy`）。
 *  - 非法值（`"128K"` / `"1.5"` / `"-1"` / `"abc"` / `0`）⇒ 报错串、盘上零变（设计 §6.15「共同语义」）。
 *  - 拒绝类（值非法 ∥ 渠道不存在）一律在**写之前**判：拒径不落盘（`vscPersistRaw` 会注 `$schema`，
 *    先写再拒就成了「拒了也改一次盘」）。 */
export function saveProviderModelContext(name, model, k) {
  const modelId = typeof model === "string" ? model.trim() : ""
  if (!modelId) return `Invalid model id: ${JSON.stringify(model)} — expected the model ID as listed or typed`
  const rawK = k === null || k === undefined
    ? ""
    : (typeof k === "number" ? String(k) : String(k).trim())
  let value = null
  if (rawK !== "") {
    value = positiveInt(Number(rawK))
    if (value === null) return `Invalid context: ${JSON.stringify(k)} — must be a positive integer in K (e.g. 128 = 128K)`
  }
  const target = normalizeModelKey(modelId)
  const tableOf = (entry) => (entry?.modelContext && typeof entry.modelContext === "object" && !Array.isArray(entry.modelContext)
    ? entry.modelContext
    : null)

  // 预检（零写盘径）：渠道在不在——拒径不落盘（`vscPersistRaw` 会注 `$schema`，先写再拒就成了「拒了也改一次盘」）。
  const current = loadRaw()
  const entry = Array.isArray(current.providers) ? current.providers.find((p) => p?.name === name) : null
  if (!entry) return `Provider not found: ${JSON.stringify(name)}`

  let missing = false
  const err = conflictError(vscPersistRaw((raw) => {
    const live = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === name) : null
    if (!live) { missing = true; return }
    const table = tableOf(live)
    const keys = table ? Object.keys(table).filter((candidate) => normalizeModelKey(candidate) === target) : []
    if (value === null) {
      if (table === null || keys.length === 0) return
      for (const key of keys) delete table[key]
      if (Object.keys(table).length === 0) delete live.modelContext
      return
    }
    const next = table ?? {}
    for (const key of (keys.length ? keys : [modelId])) next[key] = value
    live.modelContext = next
  }))
  if (err) return err
  return missing ? `Provider not found: ${JSON.stringify(name)}` : null
}
