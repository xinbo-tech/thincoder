/**
 * chat-compact.mjs — 与核取核运行面（`agent/ADMIN-AGENT.md` §17.3 ∥ KD-SV-137；server-core-unification 批——台账 #1239）：
 * A1 工具轮回灌形（核 `model-specs.mjs` `assistantToolCallMessage`——回声族携 `reasoning_content`〔缺值 ⇒ `""`〕∥
 * 非回声族零字段；`tool_calls[].extra_content` 在场才带；`chat.mjs` ∥ `run.mjs` 两 face 共用）∥ A2 历史修复（核
 * `agent/helpers.mjs` `repairHistory`——断链 pair 修复成对；**常态输入原样**）∥ A3 上下文压缩（核 `context.mjs`
 * `compressIfNeeded` ∥ `compressFallback` ∥ `COMPRESS_FAILURE_LIMIT`——阈值触发 ⇒ 标记行落库适配；3 连败 ⇒ 降级）。
 *
 * 接法（§17.1——沿既有先例：动载 + 缓存 ∥ 注入口 ∥ 缺核降级）：核件**动载**（`import()`——ESM 模块缓存即缓存，失败缓存零重试）；
 * 单元测试档经注入口（`coreSpecs` ∥ `coreHelpers` ∥ `coreCompact`——仓内直引真件）；缺核 ⇒ 该面**退中性**（回灌形回落自建
 * 〔零回声〕∥ 修复跳过 ∥ 压缩跳过）——**回合不阻断**（一面一条警告）。核件原文复用（不收窄 schema、不二次包装——KD-SV-113）。
 * 压缩垫片（§17.3 A3.2）＝ `{ history, provider, config: { traces: { enabled: false } }, cwd, tasks: [] }`——**专用垫片**，
 * 勿与 env 垫片混用；`tasks: []` = `applyCompression` 读 `agent.tasks.length` 的注入面（服务面零任务重注入）。
 * 阈值口径 = **本档自持** `DEFAULT_COMPACT_THRESHOLD`（= 100_000，服务端独立于核的 auto 现算面）。
 * 2026-10-18（父侧直接执行 · 可 revert）：核已删同名常量（`setup.mjs` 改每 run `resolveCompactThreshold` 现算），原「核缺省镜像」表述失效。
 * 落库单源 = 压缩标记行（`role="user"` ∥ `data.kind="compaction"` ∥ `data.covers=[seq首, seq尾]` ∥ 内容 = 压缩产物文本）——
 * 回放面解析 = `chat-store.mjs`（覆盖区间以标记行代；嵌套标记自然消解）；**原行不删**（审计面原文留存）。
 * 覆盖区间 = 压缩前后差分求（首变点 ⇒ 尾重合段前沿——`applyCompression` 实读口径：head ＋ 注记〔＋占位 ∥ 并入尾首相邻助手〕＋ tail；
 * 「重合」按对象同一性 ∨ 并入形（`尾首.content` ⊆ `原.content` 尾段 ∥ 原内容空 ⇒ 并入副本调用面逐值同）判）。
 * 失败链 = 垫片 `_compressFailures` 进程内计数（0 起）：成功 ⇒ 清 ∥ 失败 ⇒ ＋1 ∥ 达 `COMPRESS_FAILURE_LIMIT`（= 3）⇒
 * 降级 `compressFallback`（确定性截断——同出标记面）；中断（`AbortError` ∥ signal 已中止）⇒ 零计数跳过（回合环自收尾）。
 * 缩减路径（核 `shrinkOversized`——`_lastCompressInfo` 缺席）⇒ 机器线已缩（逐回合瞬态）但零摘要产物 ⇒ **零标记**（回放面零动）。
 */
/** 压缩阈值（**服务端自持**常量；核已改为每 run `resolveCompactThreshold` 现算——两者不同源，核变不自动同步）。 */
export const DEFAULT_COMPACT_THRESHOLD = 100_000

/** 压缩标记行判别值（`data.kind`——落库形单源；回放解析 = `chat-store.mjs` `compactionCoversOf`）。 */
export const COMPACTION_KIND = "compaction"

let coreSpecsCache = null // A1 懒载缓存（`assistantToolCallMessage` ∥ `specForModel`）
let coreSpecsError = null // A1 装载失败缓存（零重试）
let coreHelpersCache = null // A2 懒载缓存（`repairHistory`）
let coreHelpersError = null
let coreCompactCache = null // A3 懒载缓存（`compressIfNeeded` ∥ `compressFallback` ∥ `COMPRESS_FAILURE_LIMIT`）
let coreCompactError = null
const warnedFaces = new Set() // 缺核警告旗（一面一条——沿 `noteEnvToolsDegraded` 先例）

/** 缺核退化警告（一面一条——模块级旗）；出 = 本条是否发出。`error` = 失败因（携进日志——免「真核 API 漂移」与「未装载」不可辨）。 */
export function noteCoreFaceDegraded(log = null, face = "compact", error = null) {
  if (warnedFaces.has(face)) return false
  warnedFaces.add(face)
  log?.warn?.("chat_core_face_missing", {
    face,
    cause: error === null ? null : String(error?.message ?? error),
    message: `取核面不可用（${face}）：@thincoder/core 未装载——该面退中性（回合不阻断；生产镜像内核为声明依赖）`,
  })
  return true
}

/** 成员级形校验（缺函数 ⇒ 按缺核处置——防「可加载但导出漂移」把回合炸出降级链；沿 `chat-env-tools.mjs` `missing` 先例）。 */
function assertCoreFace(mod, names, face) {
  const missing = names.filter((name) => typeof mod?.[name] !== "function")
  if (missing.length > 0) throw new Error(`取核面形不符（${face}）：缺 ${missing.join(" ∥ ")}——按缺核处置`)
}

/** A1 核件装载（动载 + 缓存，失败缓存零重试；沿 `run.mjs` `loadCoreChat` 先例）：`assistantToolCallMessage` ∥ `specForModel`。 */
export async function loadCoreSpecs({ coreSpecs = null } = {}) {
  if (coreSpecs !== null) return coreSpecs
  if (coreSpecsCache !== null) return coreSpecsCache
  if (coreSpecsError !== null) throw coreSpecsError
  try {
    const mod = await import("@thincoder/core/model-specs.mjs")
    assertCoreFace(mod, ["assistantToolCallMessage", "specForModel"], "model-specs")
    coreSpecsCache = Object.freeze({ assistantToolCallMessage: mod.assistantToolCallMessage, specForModel: mod.specForModel })
    return coreSpecsCache
  } catch (e) {
    coreSpecsError = e
    throw e
  }
}

/** A2 核件装载（`agent/helpers.mjs`——`repairHistory`；同上一档先例）。 */
export async function loadCoreHelpers({ coreHelpers = null } = {}) {
  if (coreHelpers !== null) return coreHelpers
  if (coreHelpersCache !== null) return coreHelpersCache
  if (coreHelpersError !== null) throw coreHelpersError
  try {
    const mod = await import("@thincoder/core/agent/helpers.mjs")
    assertCoreFace(mod, ["repairHistory"], "agent/helpers")
    coreHelpersCache = mod
    return coreHelpersCache
  } catch (e) {
    coreHelpersError = e
    throw e
  }
}

/** A3 核件装载（`context.mjs`——压缩三件；同上一档先例）。 */
export async function loadCoreCompact({ coreCompact = null } = {}) {
  if (coreCompact !== null) return coreCompact
  if (coreCompactCache !== null) return coreCompactCache
  if (coreCompactError !== null) throw coreCompactError
  try {
    const mod = await import("@thincoder/core/context.mjs")
    assertCoreFace(mod, ["compressIfNeeded", "compressFallback"], "context")
    if (!Number.isInteger(mod.COMPRESS_FAILURE_LIMIT) || mod.COMPRESS_FAILURE_LIMIT < 1) {
      throw new Error("取核面形不符（context）：COMPRESS_FAILURE_LIMIT 非正整数——按缺核处置")
    }
    coreCompactCache = Object.freeze({
      compressIfNeeded: mod.compressIfNeeded,
      compressFallback: mod.compressFallback,
      COMPRESS_FAILURE_LIMIT: mod.COMPRESS_FAILURE_LIMIT,
    })
    return coreCompactCache
  } catch (e) {
    coreCompactError = e
    throw e
  }
}

/** 上游真名 ⇒ 核规格（§17.3 A1；缺核 ∥ 缺名 ⇒ `null`——回灌形回落自建，回合不阻断）。 */
export async function specOfUpstream(model, { coreSpecs = null, log = null } = {}) {
  if (typeof model !== "string" || model === "") return null
  try {
    const specs = await loadCoreSpecs({ coreSpecs })
    return specs.specForModel(model)
  } catch (e) {
    noteCoreFaceDegraded(log, "specs", e)
    return null
  }
}

/** 对外标识 ⇒ 上游真名（§11.4 解析单源——别名反查 `providers.mjs`/KD-SV-59）⇒ 核规格；不可解 ⇒ `null`。 */
export async function specOfRef({ db, ref, coreSpecs = null, log = null } = {}) {
  let upstream = null
  try {
    const { providerAliasIndex } = await import("../gateway/providers.mjs")
    upstream = providerAliasIndex(db).lookup(String(ref ?? ""))?.model ?? null
  } catch (e) {
    noteCoreFaceDegraded(log, "specs", e)
    return null
  }
  return specOfUpstream(upstream, { coreSpecs, log })
}

/**
 * A1 工具轮回灌形（§17.3——核件构造）：回声族（`reasoningEcho:"required"`——deepseek/kimi/mimo）携 `reasoning_content`
 * 〔缺值 ⇒ `""`〕∥ 非回声族零字段；`extra_content` 在场才带。`toolCalls` = `[{ id, name, arguments, extraContent? }]`
 * （`arguments` = 上文串——面侧截断/掩蔽口径自持；chat 面 2026-10-14 起传**掩蔽原文**〔`argsFullOf`——评审 #122 随正〕、run 面传原文）。
 * 出 = `{ message, data }`：`message` = 回灌消息（核件构造；缺核 ⇒ **自建形回落**——零回声零签名字段不添，
 * `content` 空文本归 `null` 与核件同式）；`data` = 落库附加形（`{ toolCalls: [{ id, name, args, extraContent? }], reasoning? }`——
 * 回放逐值重建面：`reasoning` 键在场 ⇔ 消息携 `reasoning_content`——`""` 亦在场）。
 */
export async function assistantTurnOf({ text = "", toolCalls = [], reasoning = null, spec = null, coreSpecs = null, log = null } = {}) {
  const calls = (Array.isArray(toolCalls) ? toolCalls : []).map((call) => ({
    id: call.id,
    name: call.name,
    args: typeof call.arguments === "string" ? call.arguments : call.arguments === undefined || call.arguments === null ? "{}" : String(call.arguments),
    ...(call.extraContent ? { extraContent: call.extraContent } : {}), // 假值按「不在场」归一（与核件真值判同式——三面一致：现场 ∥ 落库 ∥ 回放）
  }))
  const selfBuilt = () => ({
    role: "assistant",
    content: text || null,
    tool_calls: calls.map((call) => ({
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: call.args },
      ...(call.extraContent ? { extra_content: call.extraContent } : {}),
    })),
  })
  let specs = null
  try {
    specs = await loadCoreSpecs({ coreSpecs })
  } catch (e) {
    noteCoreFaceDegraded(log, "specs", e)
  }
  if (specs === null) return { message: selfBuilt(), data: { toolCalls: calls } } // 缺核 ⇒ 自建形（回合不阻断）
  let message
  try {
    message = specs.assistantToolCallMessage(
      {
        content: text,
        reasoning,
        toolCalls: calls.map((call) => ({
          id: call.id,
          name: call.name,
          arguments: call.args,
          ...(call.extraContent ? { extra_content: call.extraContent } : {}),
        })),
      },
      spec,
    )
  } catch (e) {
    noteCoreFaceDegraded(log, "specs", e) // 核件运行期抛 ⇒ 自建形回落（缺核降级同轨——回合不阻断）
    return { message: selfBuilt(), data: { toolCalls: calls } }
  }
  return {
    message,
    data: { toolCalls: calls, ...("reasoning_content" in message ? { reasoning: message.reasoning_content } : {}) },
  }
}

/** A2 历史修复（§17.3——核 `repairHistory`：断链 `tool_calls` 修复成对 ∥ 孤儿 `tool` 行剔除；常态输入原样返回同一数组）。
 *  缺核 ⇒ 原样（回合不阻断）。 */
export async function repairTurnHistory(messages, { coreHelpers = null, log = null } = {}) {
  try {
    const helpers = await loadCoreHelpers({ coreHelpers })
    return helpers.repairHistory(messages)
  } catch (e) {
    noteCoreFaceDegraded(log, "helpers", e)
    return messages
  }
}

/** 前向对齐（§17.3 A3 覆盖映射）：`entries`（回放条目——`{ message, seq, covers }`）↔ `messages`（修复后数组；
 *  对象同一性保持）⇒ 逐消息 `{ seq, covers }` ∥ `null`（修复注入的合成行无库行——覆盖映射跳过）。 */
function alignProvenance(entries, messages) {
  const out = []
  let e = 0
  for (const message of messages) {
    let k = e
    while (k < entries.length && entries[k].message !== message) k++
    if (k < entries.length) {
      out.push({ seq: entries[k].seq ?? null, covers: entries[k].covers ?? null })
      e = k + 1
    } else {
      out.push(null)
    }
  }
  return out
}

/** 覆盖区间差分（首变点 ⇒ 尾重合段前沿）；「重合」= 对象同一性 ∨ 并入形（尾首助手被压缩占位前缀并入——`原.content` 为其尾段 ∥ 原内容空 ⇒ 并入副本调用面逐值同）。 */
function diffRangeOf(before, after) {
  const suffixMatch = (oldMessage, newMessage) => {
    if (oldMessage === newMessage) return true
    if (oldMessage?.role !== "assistant" || newMessage?.role !== "assistant") return false
    if (typeof newMessage.content !== "string") return false
    const oldContent = typeof oldMessage.content === "string" ? oldMessage.content : ""
    if (oldContent !== "") return newMessage.content.endsWith(oldContent)
    // 空/缺内容并入形（核 `withPlaceholderPrefix`——空内容 ⇒ 占位符单独成形，内容无从比对）：结构判（调用面逐值同）
    return Array.isArray(oldMessage.tool_calls) && oldMessage.tool_calls.length > 0 &&
      JSON.stringify(oldMessage.tool_calls) === JSON.stringify(newMessage.tool_calls ?? null)
  }
  let i0 = 0
  while (i0 < before.length && i0 < after.length && before[i0] === after[i0]) i0++
  if (i0 === before.length && i0 === after.length) return null // 零差分（正常不可达——压缩必有变）
  let j = 0
  while (j < before.length - i0 && j < after.length - i0 && suffixMatch(before[before.length - 1 - j], after[after.length - 1 - j])) j++
  return { i0, i1: before.length - j }
}

/**
 * A3 压缩（§17.3——回合起跑段：本轮消息与投递落库后、模型调用前）：阈值触发 ⇒ 压缩（摘要调用经垫片 provider——同一出口，
 * `usage` 行可归因）⇒ 覆盖区间差分求 ⇒ 出标记面（`covers` + `note`）。`entries`/`history` 同序（修复注入的合成行经前向对齐补 `null`）；
 * `provider` = loopback 描述子（缺位 ⇒ 跳过——回合不阻断）；`pad` = 会话垫片（`_compressFailures` 计数挂面）。
 * 出 = `{ history, mode, note, covers, shrunk, skipped }`：`covers`/`note` 非空 ⇒ 调用侧落标记行（落库单源——`appendMessage`）。
 */
export async function compactTurnHistory({
  entries = [],
  history = [],
  provider = null,
  systemPrompt = null,
  tools = null,
  signal,
  cwd,
  coreCompact = null,
  log = null,
  pad = null,
  chatId = null,
  threshold = DEFAULT_COMPACT_THRESHOLD,
} = {}) {
  const skip = (reason) => ({ history, mode: null, note: null, covers: null, shrunk: false, skipped: reason })
  if (provider === null || provider === undefined) return skip("no_provider")
  let core
  try {
    core = await loadCoreCompact({ coreCompact })
  } catch (e) {
    noteCoreFaceDegraded(log, "compact", e)
    return skip("core_missing")
  }
  const provenance = alignProvenance(entries, history) // 压缩前算定（压缩后数组重建）
  const before = [...history]
  const compactPad = {
    history,
    provider,
    config: { traces: { enabled: false } }, // 轨迹面关（§17.3 A3.2——压缩调用不落 trace）
    cwd,
    tasks: [], // `applyCompression` 读 `agent.tasks.length`（空注入面——零任务重注入）
    _compressFailures: pad?._compressFailures ?? 0, // 失败链（进程内计数——随会话垫片）
    _lastCompressInfo: null, // 复位（区分摘要/降级产物与缩减路径）
  }
  let compressed = false
  try {
    compressed = await core.compressIfNeeded(
      compactPad,
      threshold,
      { onCompressStart: ({ messages }) => log?.info?.("chat_compact_start", { chatId: Number(chatId), messages }) }, // 压缩链可视面（§17.3 A3.3——观察链，不产帧）
      { systemPrompt, tools },
      signal,
    )
    if (compressed) compactPad._compressFailures = 0
  } catch (e) {
    if (e?.name === "AbortError" || signal?.aborted) {
      if (pad) pad._compressFailures = compactPad._compressFailures
      return skip("aborted") // 中止 ⇒ 零计数（回合环检查点收尾——五终态零新形）
    }
    compactPad._compressFailures = (compactPad._compressFailures ?? 0) + 1
    log?.warn?.("chat_compact_failed", {
      chatId: Number(chatId),
      attempt: compactPad._compressFailures,
      limit: core.COMPRESS_FAILURE_LIMIT,
      message: e?.message ?? String(e),
    })
    if (compactPad._compressFailures >= core.COMPRESS_FAILURE_LIMIT) {
      compactPad._compressFailures = 0 // 达限 ⇒ 降级（确定性截断——同出标记面；计数复位重起）
      try {
        compressed = core.compressFallback(compactPad)
      } catch (e2) {
        log?.warn?.("chat_compact_fallback_failed", { chatId: Number(chatId), message: e2?.message ?? String(e2) })
        compressed = false
      }
    }
  }
  if (pad) pad._compressFailures = compactPad._compressFailures
  if (!compressed) return skip("below_threshold")
  if (compactPad._lastCompressInfo === null) {
    // 缩减路径（核 `shrinkOversized`——重写消息体、无摘要产物）：机器线已缩（逐回合瞬态），零标记（回放面零动）
    return { history: compactPad.history, mode: null, note: null, covers: null, shrunk: true, skipped: "shrunk" }
  }
  const after = compactPad.history
  const range = diffRangeOf(before, after)
  if (range === null) return skip("no_diff")
  const note = after[range.i0]
  if (note?.role !== "user" || typeof note.content !== "string") return skip("no_note")
  const covered = new Set()
  for (let i = range.i0; i < range.i1; i++) {
    const prov = provenance[i]
    if (!prov) continue
    if (Number.isInteger(prov.seq)) covered.add(prov.seq)
    if (Array.isArray(prov.covers)) for (let s = prov.covers[0]; s <= prov.covers[1]; s++) covered.add(s) // 嵌套标记（§17.3 A3.4——自然消解）
  }
  const covers = covered.size === 0 ? null : [Math.min(...covered), Math.max(...covered)]
  return { history: after, mode: typeof compactPad._lastCompressInfo.mode === "string" ? compactPad._lastCompressInfo.mode : null, note: note.content, covers, shrunk: false, skipped: covers === null ? "no_rows" : null }
}
