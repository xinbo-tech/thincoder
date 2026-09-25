/**
 * subagent-children.mjs — 嵌套子代理子块载体数据层（显示契约：docs/design/TUI.md §6
 * 「内层活动并入外层流（SUBAGENT-TAIL）」节——2026-09-11 批）。
 *
 * 子块 = 外层 state.subTasks 块内的嵌套载体（外层 .children[]——每层一子块——D-R23d）：
 *   carrier = { key（父内段标 role#N）, role, model, started, done, doneAt, stopped,
 *               blocks, currentTool, toolArgs, approval, lastError, dropped,
 *               blockEpoch, children: [], _lineCount }
 * SUBAGENT-TAIL（D-ST1）后内层 relay 行**不再存子块**——append 目标上移外层块 blocks
 * （单存储单账本；子块 blocks 恒空）。子块载体降为**守护元数据**，职责 = ① done 后
 * 迟到 chunk 丢弃（F2 语义不回退）② 外层冻结时未收尾子块不悬空（closeOpenSubChildren
 * ——写路径保留，无正读者）③ 内层工具 fresh 判别（leaf.currentTool）。
 *
 * N2 单环配额（D-ST4）：全部内容行（含内层并入行）就地计入外层 500 **显示行**环——
 * trim = 单载体最旧先行（原树级 trim「子块先丢 / done 豁免」随子块内容层退役）。
 * 省略计数真值（N6——D-ST5）：`…（已省略 N 行）` 的 N 只随内容移除增长；标记自身
 * 不占额度、不被丢弃、不计入 N。
 *
 * TUI-OOM-ROOTCAUSE（TUI-SESSION-VIEW.md §5 动机注 / §5.3）：原环按 `\n` 计数——无换行巨 chunk
 * 净增 0 行 → 环永不触发、文本无界。本模块加**字符维**（第二维——行数维逐字不动，D-TB5）：
 * `carrier._charCount` 与 `SUB_BLOCK_CHAR_LIMIT` 双维同时满足（先到先裁）；字符维裁剪
 * 按被裁文本行数折算 N（无幽灵计数——N6）。
 */
import { SUB_BLOCK_CHAR_LIMIT, MIDDLE_TRUNC_MARKER, capText } from "./display-budget.mjs"

export const SUB_BLOCK_LINE_LIMIT = 500

/** 单块自身额度（TUI-OOM-ROOTCAUSE·TUI-SESSION-VIEW.md §5 动机注 / §5.1：无换行巨 chunk —— 行数维净增 0、
 *  环永不触发；入块文本先过本条（头 3/4 + 尾 1/4 + 中段标记）——单行内容不因字符维
 *  裁剪被整行丢光（环总量裁剪仍按最旧先行）。 */
const SUB_BLOCK_CAP_OPTS = {
  max: SUB_BLOCK_CHAR_LIMIT,
  keepHead: 90_000,
  keepTail: 30_000,
  marker: MIDDLE_TRUNC_MARKER,
}

/** 显示行计数（N6 口径）：块尾 `\n` 的空元素不计（行结束符非空行）。 */
const countBlockLines = (text) => {
  const lines = String(text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** 省略标记块判定（trim 产物——不占额度/不可被丢；N6）。 */
const isTrimMarker = (b) => b?.kind === "meta" && b._trimMarker === true

/** 省略标记幂等更新（不占额度/不计入字符账——N6）。 */
function updateTrimMarker(carrier) {
  const marker = `…（已省略 ${carrier.dropped} 行）`
  const head = carrier.blocks[0]
  if (head && isTrimMarker(head)) head.text = marker // 既有标记原位更新（不重复 unshift）
  else carrier.blocks.unshift({ kind: "meta", text: marker, _trimMarker: true })
}

/** 单行丢弃（最旧内容块首行——字符维/行维共用）：返回释放字符数（行级元数据同步）。 */
function dropFirstContentLine(carrier) {
  for (;;) {
    const idx = carrier.blocks.findIndex((b) => !isTrimMarker(b))
    if (idx === -1) return 0 // 仅余省略标记（内容耗尽）——不再产生幽灵行
    const first = carrier.blocks[idx]
    const before = countBlockLines(first.text)
    if (before <= 0) { carrier.blocks.splice(idx, 1); continue }
    const parts = String(first.text).split("\n")
    const droppedLine = parts.shift() ?? ""
    const kept = parts.join("\n")
    if (kept === "") carrier.blocks.splice(idx, 1)
    else first.text = kept
    const lineDelta = before - (kept === "" ? 0 : countBlockLines(kept))
    carrier._lineCount = Math.max(0, (carrier._lineCount ?? 0) - lineDelta)
    carrier.dropped = (carrier.dropped ?? 0) + lineDelta
    // 释放字符数 = 本行正文 + 行分隔符（parts.join("\n") 同步移除——代码评审 #6：少记 1
    // 字符会使 _charCount 偏高、触发早裁）
    return droppedLine.length + (kept === "" ? 0 : 1)
  }
}

/** 载体级丢行（D-ST4 单环最旧先行）：从头部内容块 FIFO 丢行；省略标记跳过（不占额度/
 *  不被丢弃/不计入 N——N6）。返回实际丢弃行数（= N 增量——无幽灵行）。字符账同步扣减。 */
function dropCarrierLines(carrier, want) {
  if (want <= 0) return 0
  let dropped = 0
  let freedChars = 0
  while (want > dropped) {
    const idx = carrier.blocks.findIndex((b) => !isTrimMarker(b))
    if (idx === -1) break // 仅余省略标记（内容耗尽）——不再产生幽灵行
    const first = carrier.blocks[idx]
    const lines = countBlockLines(first.text)
    if (lines <= 0) { carrier.blocks.splice(idx, 1); continue } // 空块无显示行：移除不计数
    const take = Math.min(lines, want - dropped)
    if (take >= lines) {
      carrier.blocks.splice(idx, 1)
      dropped += lines
      freedChars += String(first.text).length
    } else {
      const kept = String(first.text).split("\n").slice(take).join("\n")
      freedChars += String(first.text).length - kept.length
      first.text = kept
      dropped += take
    }
  }
  carrier._lineCount = Math.max(0, (carrier._lineCount ?? 0) - dropped)
  carrier.dropped = (carrier.dropped ?? 0) + dropped
  carrier._charCount = Math.max(0, (carrier._charCount ?? 0) - freedChars)
  if (dropped > 0) updateTrimMarker(carrier)
  return dropped
}

/** 字符维裁剪（§5.3——无换行巨 chunk 的堵口）：逐行丢最旧直至释放 ≥ want 字符；
 *  行数按实际被丢行折算 N（无幽灵计数——N6）；标记不占额度。返回释放字符数。 */
function dropCarrierChars(carrier, want) {
  if (!(want > 0)) return 0
  let freed = 0
  while (freed < want) {
    const got = dropFirstContentLine(carrier)
    if (got <= 0) break // 内容耗尽（不再产生幽灵行）
    freed += got
  }
  if (freed > 0) {
    carrier._charCount = Math.max(0, (carrier._charCount ?? 0) - freed)
    updateTrimMarker(carrier)
  }
  return freed
}

/** 单载体 trim（原树级 trimSubTree 收窄——D-ST4）：超 500 显示行 → 最旧先行丢行；
 *  超 SUB_BLOCK_CHAR_LIMIT 字符 → 同款最旧先行（双维先到先裁——TUI-SESSION-VIEW.md §5.4）。 */
function trimSubCarrier(carrier) {
  const over = (carrier._lineCount ?? 0) - SUB_BLOCK_LINE_LIMIT
  if (over > 0) dropCarrierLines(carrier, over)
  const overChars = (carrier._charCount ?? 0) - SUB_BLOCK_CHAR_LIMIT
  if (overChars > 0) dropCarrierChars(carrier, overChars)
}

/** kind 合并追加（载体级）——净增行记账（显示行口径；省略标记不参与合并——N6）；
 *  字符账同步累加（第二维——§5.4）。 */
function pushBlock(carrier, kind, text, fresh) {
  if (!text) return
  const capped = capText(text, SUB_BLOCK_CAP_OPTS) // 单块自身额度（无换行巨 chunk 堵口）
  const last = carrier.blocks.at(-1)
  if (!fresh && last && last.kind === kind && !isTrimMarker(last)) {
    const before = countBlockLines(last.text)
    const beforeChars = last.text.length
    last.text = capText(last.text + capped, SUB_BLOCK_CAP_OPTS)
    carrier._lineCount = (carrier._lineCount ?? 0) + countBlockLines(last.text) - before
    carrier._charCount = (carrier._charCount ?? 0) + (last.text.length - beforeChars)
  } else {
    carrier.blocks.push({ kind, text: capped })
    carrier._lineCount = (carrier._lineCount ?? 0) + countBlockLines(capped)
    carrier._charCount = (carrier._charCount ?? 0) + capped.length
  }
  carrier.blockEpoch = (carrier.blockEpoch ?? 0) + 1
}

/** 追加到块载体（外层块/压缩面板——自身即配额环）：单载体 trim——无子块时与既有
 *  trimSubBlocks 同效（N2 既有测试口径不变）。SUBAGENT-TAIL：内层行经 routeSub* 也
 *  走本函数（append 目标上移——单一配额环）。 */
export function appendSubBlock(sub, kind, text, { fresh = false } = {}) {
  if (!text) return
  pushBlock(sub, kind, text, fresh)
  trimSubCarrier(sub)
}

/** R23 D-R23a：子块载体创建/定位——按段（role#N）在父载体 children 查找，缺失即建
 *  （每层一子块——任意 inner 深度同路径——D-R23d）。SUBAGENT-TAIL 后子块只承载守护
 *  元数据（done/currentTool/children——内容行归外层 blocks）。@returns 子块载体 */
export function ensureSubChild(carrier, seg) {
  carrier.children ??= []
  let c = carrier.children.find((x) => x.key === seg)
  if (!c) {
    c = {
      key: seg,
      role: seg.slice(0, seg.lastIndexOf("#")),
      model: undefined,
      started: Date.now(), done: false, doneAt: null, stopped: false,
      blocks: [], currentTool: null, toolArgs: null,
      approval: null, lastError: null, dropped: 0,
      blockEpoch: 0, children: [], _lineCount: 0, _charCount: 0,
    }
    carrier.children.push(c)
  }
  return c
}

/** 沿 inner 段逐层下降。create=false 时缺层返回 null（事件关闭路径——不建幻影空块）。 */
export function descendSubChild(root, inner, { create = true } = {}) {
  let carrier = root
  for (const seg of inner) {
    if (create) carrier = ensureSubChild(carrier, seg)
    else {
      const next = (carrier.children ?? []).find((x) => x.key === seg)
      if (!next) return null
      carrier = next
    }
  }
  return carrier === root ? null : carrier
}

/** R23 D-R23c2 子块完成定格（内层 ⟦ev⟧done/stopped → 子块尾定格——不落 preview、不冻结
 *  外层）；stopped = interrupted（外层 abort 传播/内层错误收尾——T-R23a.3 不悬空）。
 *  SUBAGENT-TAIL 后 done 为 F2 正读者（迟到 chunk 丢弃守卫）；currentTool 为 fresh 判别源。
 *  外层块头 currentTool 若指向该子块（innerPath 前缀——评审 #8 全路径现状保持）→ 清空
 *  （子块已定格——工具不再是 current）。 */
export function closeSubChild(root, child, stopped, innerPath) {
  child.done = true
  child.doneAt = Date.now()
  if (stopped) child.stopped = true
  child.currentTool = null
  child.approval = null
  child.blockEpoch = (child.blockEpoch ?? 0) + 1
  if (root.currentTool && innerPath && String(root.currentTool).startsWith(`${innerPath}/`)) {
    root.currentTool = null
    root.toolArgs = null
  }
}

/** R23 D-R23c2 收尾语义（T-R23c.2a）：外层先冻结而内层未收尾（外层 abort/中断）→
 *  内层子块随外层冻结时定格 stopped——不悬空。SUBAGENT-TAIL：② 语义照旧保留（防御性
 *  写路径——定格后无正读者、不设断言；见 docs/design/TUI.md §6 守护字段类目 A）。
 *  freezeSubTaskLines 冻结前调用。 */
export function closeOpenSubChildren(sub) {
  const walk = (carrier) => {
    for (const c of carrier.children ?? []) {
      if (!c.done) {
        c.done = true
        c.doneAt = Date.now()
        c.stopped = true
        c.currentTool = null
        c.approval = null
      }
      walk(c)
    }
  }
  walk(sub)
}
