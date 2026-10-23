/**
 * provider-context.mjs — VSC 面 `modelContext` 读写（宿主侧，**纯 Node**：零 `vscode` 依赖 ⇒ 可单测）。
 *
 * 机制单源 = `docs/core/design/PROVIDER.md` §6.15「写面：`modelContext` 编辑（三端同形 · 同批齐）」：
 *  - 读面载荷两键：`modelContext`（已声明映射，**K 原值**，供编辑面回显）+ `context`
 *    （`providerSpec(entry).context`，token，留给用量百分比面）。
 *  - 写面：值单位 **K**，端侧零乘 1024（乘点唯一在核 `model-specs.mjs` 的 L1 ∥ L2 合流点）。
 *    值校验 = 先 parse 再判（`Number(String(v).trim())` → 核 `positiveInt`）；空 ⇒ 清除语义。
 *  - 键处理 = 核同一把尺子（末段 + 小写相等，`PROVIDER.md` §6.9）：命中既有键则**改写**该键
 *    （不新增第二种拼写）；未命中用模型 id 原样作键。**歧义不猜**：两条键归一后相撞 ⇒ 拒写并报错
 *    （读链对该模型同样判未提供——写面择一是替用户做决定，且会回一笔不生效的「已保存」）。
 *
 * 为什么本档独立：`settings.mjs` 经 `provider-flows.mjs` 拉进 `vscode`（扩展宿主模块不可在 Node 里
 * import）⇒ 读写面留在本档才可被单元档直接驱动；`settings.mjs` 按设计坐标 re-export 同名函数，
 * 对外导入面不变。
 */
import { providerSpec } from "../specs.mjs"
import { normalizeModelKey, positiveInt } from "@thincoder/core/model-context.mjs"
import { vscPersistRaw } from "./settings-panel-write.mjs"
import { conflictError, loadRaw } from "@thincoder/core/config-io.mjs"

/** 渠道条目的读面两键：`{ modelContext, context }`。
 *  `modelContext` = 盘上已声明映射的浅拷贝（空 ∥ 非法形 ⇒ `{}`——编辑面只读它）；
 *  `context` = 核解析值（token；渠道条目无 `model`，故通常是 L2 旧键 ∥ L4/L5——展示面不拿它当
 *  「已声明值」，那是 `modelContext`）。 */
export function providerContextFields(entry) {
  const table = entry?.modelContext
  const declared = table && typeof table === "object" && !Array.isArray(table) ? { ...table } : {}
  return { modelContext: declared, context: providerSpec(entry).context }
}

/** 写 `providers[].modelContext[<模型>]`（值单位 **K**）。
 *  - `k` 数字 ∥ 数字串 ⇒ 校验后写入；`null` ∥ `undefined` ∥ 空串/空白 ⇒ 清除该模型键
 *    （清除后对象无键 ⇒ 连 `modelContext` 整键删除——不留空对象）。
 *  - 返回 `null` = 写成功；错误串 = 失败原因（形沿 `handleSetProviderProxy`）。
 *  - 非法值（`"128K"` / `"1.5"` / `"-1"` / `"abc"` / `0`）⇒ 报错串、盘上零变（设计 §6.15「共同语义」）。
 *  - 拒绝类（值非法 ∥ 渠道不存在 ∥ 键歧义）一律在**写之前**判：拒径不落盘（`vscPersistRaw` 会注 `$schema`，
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
  const matchesOf = (table) => (table ? Object.keys(table).filter((candidate) => normalizeModelKey(candidate) === target) : [])
  const ambiguityError = (matches) => `Ambiguous modelContext on provider ${JSON.stringify(name)}: ${matches.join(" | ")} — two keys normalize to the same model; resolve it by hand first (the declaration is ignored while they collide)`

  // 预检（零写盘径）：渠道在不在 ∥ 键歧不歧义。歧义不猜（读链同判——`manualContextK` 相撞即判未提供）：择一改写
  // = 替用户做决定，且回一笔「已保存」而解析仍不生效。
  const current = loadRaw()
  const entry = Array.isArray(current.providers) ? current.providers.find((p) => p?.name === name) : null
  if (!entry) return `Provider not found: ${JSON.stringify(name)}`
  const preview = matchesOf(tableOf(entry))
  if (preview.length > 1) return ambiguityError(preview)

  let missing = false
  let blocked = null
  const err = conflictError(vscPersistRaw((raw) => {
    const live = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === name) : null
    if (!live) { missing = true; return }
    const table = tableOf(live)
    // 写到一半盘面变了（并发写）⇒ 再判一次；命中多条仍拒（不择一）
    const matches = matchesOf(table)
    if (matches.length > 1) { blocked = ambiguityError(matches); return }
    const key = matches[0]
    if (value === null) {
      if (!table || key === undefined) return
      delete table[key]
      if (Object.keys(table).length === 0) delete live.modelContext
      return
    }
    const next = table ?? {}
    next[key ?? modelId] = value
    live.modelContext = next
  }))
  if (err) return err
  if (blocked) return blocked
  return missing ? `Provider not found: ${JSON.stringify(name)}` : null
}
