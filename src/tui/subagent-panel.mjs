/**
 * subagent-panel.mjs — 运行中子 agent 固定底部面板渲染（AGENT-LOOP.md §7.2.1 D1/D2）。
 *
 * 面板位于 conversation 与 todo 之间（布局顺序 header → conversation → 面板 →
 * todo → picker → permission → queue → input → status），高度完全自适应 = 全部
 * 运行中区块的渲染行数（F2，会话区被挤小）；无运行中区块 → 返回 []（F6 空态，
 * 无悬空分隔线）。子 agent 完成后立即冻结进会话流（subagent-blocks.mjs
 * freezeSubTaskLines，✓ 头 + 可展开，§7.2 D4 现状不变），面板下一帧自然移除
 * 该区块（F5）——本模块只渲染 `!done` 条目。§17 T-S14 中间态例外：挂起期已结算
 * 区块（sub.done && sub.awaitingDigest）冻结被延迟，驻留面板显示
 * "done · awaiting digestion"，池空补发冻结后才移除。
 *
 * §19.5 D-M7 ⏹：运行中（非 done）折叠头右缘停止标记（dim，仅折叠头）——点击 =
 * cancel（mouse.mjs 列级命中 _stopCol——不触发折叠翻转）。
 * §27 R23（supersede §19.5 D-M8 子标方案）：嵌套子代理渲染为子块段（renderSubChildSections
 * ——子块头 + 独立折叠键——面板与冻结渲染共用——styleSubLabelRow 已随子标机制退役）。
 *
 * 中立模块（D1 评审 #6）：layout.mjs 调 renderSubagentPanel 预计算面板高度
 * （subagentLines → subagentH），render-frame.mjs 直接 put 预计算行（不重复
 * 渲染）——若本函数放 render-frame 会引入 layout↔render-frame 循环依赖。
 *
 * 区块渲染逻辑自 render-conversation.mjs buildConvLines runningSubs 段迁移
 * （§7.2.1 D2）：折叠头 `[▶/⏸ key · model · elapsed · turn] state`（⏸ = 等待
 * 审批态图标，sub.approval 非空时显示）+ tail 3；展开态经 fold-block.mjs 公共
 * 组件（renderBlockTimeline + renderExpandedBlock，60% 封顶 + 块内滚动）。
 * 折叠状态 key = `sub-${key}` 跨 turn 保持（D5，与冻结区块同一 key——冻结边界
 * 无缝衔接）。
 */
import { ansi, C } from "./ansi.mjs"
import { sliceByWidth, stringWidth } from "./render.mjs"
import { isExpanded, renderBlockTimeline, renderExpandedBlock, foldTailLines } from "./fold-block.mjs"
import { SUBAGENT_ROLES } from "./subagent-blocks.mjs"

/**
 * §27 R23 子块（嵌套子代理）段渲染——面板与冻结渲染共用（中立纯函数模块）：
 * 每子块 = 工具式头行（`❯ explore#N · model · elapsed`——D-R23b，dim ❯ + role#N 亮 +
 * model/elapsed dim——与 C 工具头同排式；done/stopped 定格动词——D-R23c2）+ 折叠态
 * tail 2 / 展开态全量窗口（60% 封顶 + 块内滚动——fold-block 公共组件）；孙块递归
 * （任意 inner 深度——D-R23d——每层独立折叠键）。折叠键 = `sub-{outerKey}/{innerPath}`
 * （D-R23e——与既有 sub-{key} 同族——_foldToggle 命中映射复用 fold-block 通用通道——
 * mouse.mjs 零改动）。行数配额在数据层（子块计入外层 500 行环——NFR）。
 */

/** 子块折叠键（D-R23e）：sub-{outerKey}/{innerPath}。 */
export function subChildFoldKey(rootKey, innerPath) {
  return `sub-${rootKey}/${innerPath}`
}

/** 子块头行（D-R23b/c2）——返回带 _foldToggle 的行（可点击折叠/展开——fold-block 通道）。 */
function subChildHeadRow(rootKey, child, innerPath, cols) {
  const foldKey = subChildFoldKey(rootKey, innerPath)
  const end = child.done ? (child.doneAt ?? Date.now()) : Date.now()
  const secs = Math.max(0, Math.floor((end - (child.started ?? end)) / 1000))
  const verb = child.done ? (child.stopped ? `stopped ${secs}s` : `done ${secs}s`) : `${secs}s`
  const raw = `❯ ${child.key}${child.model ? ` · ${child.model}` : ""} · ${verb}`
  let text = sliceByWidth(raw, Math.max(1, cols - 2))
  // dim 注入（截断后——自闭合：行末由打印端 reset 兜底；灰色段间 restore 恢复行基色）。
  const restore = ansi.fg(6) // 行基色 C.tool（cyan）
  if (text.startsWith("❯")) text = `${ansi.gray}❯${restore}${text.slice(1)}`
  const sep = text.indexOf(" · ")
  if (sep > 0) text = `${text.slice(0, sep)}${ansi.gray}${text.slice(sep)}`
  return { text, color: C.tool, _foldToggle: foldKey }
}

/** 子块段行（head + 折叠 tail2 / 展开窗口）——递归孙块。root = 外层块（key 为折叠前缀源）。 */
export function renderSubChildSections(state, root, cols, maxRows) {
  const out = []
  const walk = (carrier, path) => {
    for (const child of carrier.children ?? []) {
      const innerPath = path ? `${path}/${child.key}` : child.key
      out.push(subChildHeadRow(root.key, child, innerPath, cols))
      const foldKey = subChildFoldKey(root.key, innerPath)
      if (isExpanded(state, foldKey)) {
        // 展开：全量时间线窗口化（per-kind 着色，60% 封顶 + 块内滚动——公共组件）
        const body = renderBlockTimeline(child.blocks, cols)
        out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: `${child.key} activity` }))
      } else {
        // 折叠：tail 2 非空行（最近活动）——dim（与既有外层折叠 tail 同型）
        for (const line of foldTailLines(child.blocks, 2)) {
          out.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim, _skipDimFold: true })
        }
      }
      walk(child, innerPath)
    }
  }
  walk(root, "")
  return out
}
/**
 * 面板行构建（纯函数）：顶部分隔线 `─` + 各运行中区块（折叠头 + tail 3 /
 * 展开全量）。maxRows = 终端行数（展开态 60% 封顶窗口化）；省略 = 不封顶
 * （单测/无终端环境）。
 * @returns {Array<{text: string, color: string, ...}>}
 */
export function renderSubagentPanel(state, cols, maxRows) {
  const runningSubs = Object.values(state.subTasks ?? {}).filter((s) => !s.done || s.awaitingDigest)
  if (runningSubs.length === 0) return []
  const out = []
  // 面板顶部边界线（现状分隔线语义迁移，§7.2.1 D2/NF2）——面板存在即画线，
  // 无运行区块时面板整体不渲染（F6：无悬空线）。
  out.push({ text: "─".repeat(Math.max(1, cols - 1)), color: C.dim, _skipDimFold: true })
  for (const sub of runningSubs) {
    const foldKey = `sub-${sub.key}`
    // 头部摘要：`[▶ coder#1 · glm-5.3 · 45s · turn 12/100] bash — npm test`
    // ⏸ = 等待审批态（sub.approval 非空，评审 #5 定义）；图标在括号内，
    // 与冻结头 `[✓ …]` 格式统一（任务简报 UI 决策）。
    const icon = sub.approval ? "⏸" : sub.done ? "✓" : "▶"
    const elapsed = Math.floor(((sub.done ? (sub.doneAt ?? Date.now()) : Date.now()) - sub.started) / 1000)
    // §19.5 D-M7b ②: sync/async 显式头标（B 形态——不靠"没标推断"）——async 由
    // ⟦ev⟧async 标记置位；sync 区块（无标记）显式标 sync。真实 subagent 角色
    // （escalate/consult/compress 等复用面板槽的条目无语义——非 spawn 角色豁免）；
    // §24 D-24b：role "advisor" 伪角色同面板（块/⏹/冻结复用——ruling ②-4 A）。
    // 冻结后保留（与 model 标识同生命周期——render-conversation frozenSubTaskLines
    // 同款 modePart）。**颜色后置注入**（code review 🔵#4）：bracket 宽度预算用纯文
    // 本（dim ANSI 内嵌会被 sliceByWidth 截断在 restore 之前 → 行尾残留 dim）——
    // 截断后对完整存活的 mode word 单独套 dim + 恢复行色（自闭合——截断落在词内
    // 则 replace 不命中 → 无 ANSI 泄漏，词以行色显示）。
    const isSubRole = SUBAGENT_ROLES.includes(sub.role) || sub.role === "advisor"
    // §20 D-SD3b waiting 块（sub.queued——排队 spawn 返回即建——未启动无 relay 流）：
    // 括号状态词 = waiting（依赖/域冲突等位——detail 即原因）或 queued（槽满等位——
    // 状态区显示 position）；不显示 sync/async 词（尚未启动——无 async 标记可言——
    // sync 词会误导：async spawn 排队的块不是 sync）；⏹ 门控不变（async 启动后才置）。
    const queued = sub.queued ?? null
    const statusWord = queued ? (queued.kind === "slot" ? "queued" : "waiting") : null
    const modeWord = isSubRole && !queued ? (sub.async === true ? "async" : "sync") : null
    const modePart = modeWord ? ` · ${modeWord}` : (statusWord ? ` · ${statusWord}` : "")
    // 评审 #1 宽度预算：模型名先单独按显示宽度截断（[model] token 原样记录可长
    // 20-30+ 字符，不截断则括号前缀宽度不可预算、状态区被挤出终端右边距）；
    // 再量括号前缀实际显示宽度，状态区按 cols - bracketWidth - 2 截断——整行
    // ≤ cols 铁律（TUI 布局纪律：任何写入帧的行 ≤ cols）。极端窄终端下括号
    // 前缀自身也按 cols-2 截断兜底（状态区宁可让位也不撑破帧）。
    const modelPart = sub.model
      ? ` · ${sliceByWidth(sub.model, Math.max(8, Math.floor(cols / 3)))}`
      : ""
    const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
    const bracketRaw = `[${icon} ${sub.key}${modePart}${modelPart} · ${elapsed}s${turnPart}]`
    let bracket = sliceByWidth(bracketRaw, Math.max(1, cols - 2))
    if (modeWord) {
      const painted = bracket.replace(` · ${modeWord}`, ` · ${ansi.dim}${modeWord}${C.tool}`)
      if (painted !== bracket) bracket = painted // 词被截断则保持纯文本（不泄漏 dim）
    }
    if (statusWord) {
      const painted = bracket.replace(` · ${statusWord}`, ` · ${ansi.dim}${statusWord}${C.tool}`)
      if (painted !== bracket) bracket = painted
    }
    const bracketWidth = stringWidth(bracket)
    let statePart
    if (queued) {
      // waiting 块状态区：detail 即原因文本（waiting for: …/dependency cancelled: …）；
      // slot 等位 → queued · position N（槽满）。
      statePart = queued.kind === "slot"
        ? `queued · position ${queued.position ?? "?"}（槽满等位）`
        : (queued.detail || "queued")
    } else if (sub.approval) statePart = `等待审批: ${sub.approval}`
    else if (sub.awaitingDigest) statePart = "done · awaiting digestion"
    else if (sub.currentTool) statePart = sub.currentTool
    else statePart = "thinking..."
    const argSummary = sub.currentTool && sub.toolArgs?.command
      ? ` — ${String(sub.toolArgs.command).replace(/\s+/g, " ").trim().slice(0, 60)}`
      : ""
    let headText = `${bracket} ${sliceByWidth(statePart + argSummary, Math.max(0, cols - 2 - bracketWidth))}`
    const line = { color: C.tool, _foldToggle: foldKey }
    // §19.5 D-M7 ⏹ + D-M7b ③ 门控：⏹ 只对 async 区块（running && SUBAGENT_ROLES &&
    // sub.async——sync 区块无 ⏹——杜绝"可见但不可中止"误导——用户裁定 B 形态）。
    // done/awaitingDigest/压缩面板（role compress）/consult 无标记（点击只对池内
    // async 子代理有意义）：dim 停止标记钉在折叠头右缘**内收一列**（code review
    // 🟡#1——glyph 在 cols−1、最右列留 margin——避免终端最末列点击不可靠/全角字形
    // 顶格被裁；命中区 = col ≥ _stopCol = cols−1——含 glyph 与其右 margin，左邻
    // padding 空格仍走折叠）。整行 ≤ cols：内容先按 cols−3 截断。
    if (!sub.done && sub.async === true && (SUBAGENT_ROLES.includes(sub.role) || sub.role === "advisor")) {
      const cut = sliceByWidth(headText, Math.max(0, cols - 3))
      headText = cut + " ".repeat(Math.max(0, cols - 3 - stringWidth(cut)))
      line.text = `${headText} ${ansi.dim}⏹${ansi.reset} `
      line._stopSub = sub.key
      line._stopCol = Math.max(1, cols - 1)
    } else {
      line.text = headText
    }
    out.push(line)
    if (isExpanded(state, foldKey)) {
      // 展开态：全量活动时间线（per-kind 着色，60% 屏封顶 + 块内滚动——公共组件）。
      const body = renderBlockTimeline(sub.blocks, cols)
      out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: "subagent activity" }))
    } else {
      // 折叠态：tail 3 非空 block 行（最近活动），dim。
      for (const line of foldTailLines(sub.blocks)) {
        out.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim })
      }
    }
    // §27 R23：子块段（嵌套子代理——头 + tail2/展开窗口）随外层块渲染（面板与冻结共用）。
    out.push(...renderSubChildSections(state, sub, cols, maxRows))
  }
  return out
}
