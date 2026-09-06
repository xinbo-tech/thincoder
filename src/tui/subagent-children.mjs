/**
 * subagent-children.mjs — 嵌套子代理子块载体数据层（AGENT-LOOP.md §27 R23 D-R23a/c2/NFR）。
 *
 * 子块 = 外层 state.subTasks 块内的嵌套载体（外层 .children[]——每层一子块——D-R23d）：
 *   carrier = { key（父内段标 role#N）, role, model, started, done, doneAt, stopped,
 *               blocks, currentTool, toolArgs, approval, lastError, dropped,
 *               blockEpoch, children: [], _lineCount }——与外层块同形（渲染复用
 *               renderBlockTimeline/renderExpandedBlock 公共组件）。
 * 内容/工具/模型全部归属子块（D-R23b——不再混外层 blocks——T-R23a.2 输出全在子块）。
 *
 * N2 共享配额（R23 NFR——评审 #6）：子块行数计入**外层** 500 行环形上限——树级 trim
 * （子块批量输出先丢、外层叙述保留优先——见 trimSubTree）——子块不独立扩容——面板
 * 不无限增长。
 */
export const SUB_BLOCK_LINE_LIMIT = 500

const countBlockLines = (text) => text.split("\n").length

/** 载体树总行数（根自身 + 全部子孙块）——共享配额记账。 */
export function carrierTreeLines(carrier) {
  let n = carrier._lineCount ?? 0
  for (const c of carrier.children ?? []) n += carrierTreeLines(c)
  return n
}

/** 载体级丢行（原 trimSubBlocks 逐块丢弃数学——整块 shift、末块按行裁切）；返回实际
 *  丢弃行数。每载体独立 dropped 计数 + meta 省略标记（同既有 trimSubBlocks 语义）。 */
function dropCarrierLines(carrier, want) {
  if (want <= 0 || carrier.blocks.length === 0) return 0
  let dropped = 0
  while (want > dropped && carrier.blocks.length > 0) {
    const first = carrier.blocks[0]
    const lines = countBlockLines(first.text)
    const take = Math.min(lines, want - dropped)
    if (take >= lines) {
      carrier.blocks.shift()
      dropped += lines
    } else {
      first.text = first.text.split("\n").slice(take).join("\n")
      dropped += take
    }
  }
  carrier._lineCount = (carrier._lineCount ?? 0) - dropped
  carrier.dropped = (carrier.dropped ?? 0) + dropped
  const marker = `…（已省略 ${carrier.dropped} 行）`
  const first = carrier.blocks[0]
  if (first && first.kind === "meta") first.text = marker
  else { carrier.blocks.unshift({ kind: "meta", text: marker }); carrier._lineCount = (carrier._lineCount ?? 0) + 1 }
  return dropped
}

/** R23 NFR：树级配额 trim——总行（根 + 子块树）超限 → 丢行。丢序 = **子树递归先于
 *  根载体**（后序：叶子/子块先、根最后）——子块承载批量输出（explore 工具流），外层
 *  叙述行（折叠头 tail/状态区的展示源）保留优先；每载体内部仍最旧行先行（dropCarrierLines
 *  逐块 FIFO）。单载体（无子块）情形与既有 trimSubBlocks 行为逐字同效。 */
export function trimSubTree(root) {
  let over = carrierTreeLines(root) - SUB_BLOCK_LINE_LIMIT
  if (over <= 0) return
  const walk = (carrier) => {
    for (const c of carrier.children ?? []) {
      if (over <= 0) return
      walk(c)
    }
    if (over <= 0) return
    over -= dropCarrierLines(carrier, over)
  }
  walk(root)
}

/** kind 合并追加（载体级）——既有 appendSubBlock 数学（净增行记账——P1）。 */
function pushBlock(carrier, kind, text, fresh) {
  if (!text) return
  const last = carrier.blocks.at(-1)
  if (!fresh && last && last.kind === kind) {
    const before = countBlockLines(last.text)
    last.text += text
    carrier._lineCount = (carrier._lineCount ?? 0) + countBlockLines(last.text) - before
  } else {
    carrier.blocks.push({ kind, text })
    carrier._lineCount = (carrier._lineCount ?? 0) + countBlockLines(text)
  }
  carrier.blockEpoch = (carrier.blockEpoch ?? 0) + 1
}

/** 追加到根载体（外层块/压缩面板——无父载体者自身即配额树根）。树级 trim——
 *  无子块时与既有 trimSubBlocks 同效（N2 既有测试口径不变）。 */
export function appendSubBlock(sub, kind, text, { fresh = false } = {}) {
  if (!text) return
  pushBlock(sub, kind, text, fresh)
  trimSubTree(sub)
}

/** R23：追加到子块载体——行数计入根（外层）树配额（NFR——同配额不独立扩容）。 */
export function appendSubChild(root, child, kind, text, { fresh = false } = {}) {
  if (!text) return
  pushBlock(child, kind, text, fresh)
  root.blockEpoch = (root.blockEpoch ?? 0) + 1
  trimSubTree(root)
}

/** R23 D-R23a：子块载体创建/定位——按段（role#N）在父载体 children 查找，缺失即建
 *  （每层一子块——任意 inner 深度同路径——D-R23d）。@returns 子块载体 */
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
      blockEpoch: 0, children: [], _lineCount: 0,
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
 *  内层子块随外层冻结时定格 stopped——不悬空。freezeSubTaskLines 冻结前调用。 */
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
