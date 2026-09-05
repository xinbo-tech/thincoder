/**
 * subagent-scheduler.mjs — §20 子 agent 任务调度器 + 文件域组（2026-09-05 自
 * subagent-async.mjs 拆分——Module Split Policy §20.9——纯迁移零行为变化——
 * AGENT-LOOP.md §20 D-SD1..SD5 + §21.1 D-SL1 环形死锁修正）。
 * 内容：normalizeFileList / filesOverlap / depInfo / describeBlockers / detectStall（§21.1
 * P-SL2 停滞机械检测）/ queueRunnable / assertNoDepCycle / dependentLabels /
 * refreshQueuedTokens / maybeRefillAsync。
 * ASYNC_SUBAGENT_LIMIT 常量回引自 subagent-async.mjs（主体保有——仅调用期使用——
 * 与主体对此处调度符号的回引构成惰性环——无求值期依赖）。
 */
import { isAbsolute, relative, resolve } from "node:path"
import { existsSync, statSync } from "node:fs"
import { ASYNC_SUBAGENT_LIMIT } from "./subagent-async.mjs"

// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20——D-SD1..SD5 + 20.4 处置注）
// 池条目域元数据（D-SD2：entry._files/_dependsOn——running ∪ queued 全带）、准入
// （D-SD3：域冲突/依赖未满足 → queued 等位）、补位扫描（D-SD4：最早可启动——
// 依赖全满足 + 域无冲突——waiting 越行不阻塞 slot 位）、释放规则（D-SD5——round2
// #3 锁定默认：依赖取消/失败 → 依赖者留 queued 标 dependency cancelled——仅父显式
// 处置或 AUTO 自动启动）、终态墓碑（round1 #8/T-SD14：check/注入消费与取消写墓碑——
// consumed 视为满足；非 consumed unknown id 才拒）。状态全部派生不存储（单点事实）。
// ═══════════════════════════════════════════════════════════════════════════

/** 文件域归一化（round1 #5——路径归一化再交集）：相对 cwd 解析为绝对路径 + 去重；
 *  非字符串/空项静默跳过（声明错误 = false-negative 明示风险——v1 边界）。
 *  §20.8 D-F1.1（2026-09-04）：目录声明检测——fail-closed——尾斜杠形态 / 指向既有目录
 *  → throw（含路径——错误字符串英文定稿）——目录声明静默绕过冲突检测的通道闭合；
 *  调用方（subagent.mjs spawn 入口）catch → 错误即工具结果（模型可见——无静默）。
 *  已知限制（§20.8 未编号段——评审 #4）：不存在的目录声明（无尾斜杠 + 目录未创建）仍通过——不处理。 */
export function normalizeFileList(files, cwd) {
  const out = []
  for (const f of Array.isArray(files) ? files : []) {
    if (typeof f !== "string" || !f.trim()) continue
    if (f.endsWith("/") || f.endsWith("\\")) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    const abs = resolve(cwd ?? process.cwd(), f)
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    if (!out.includes(abs)) out.push(abs)
  }
  return out
}

/** 文件域相等比较键：Windows 大小写不敏感（vs Uri.fsPath 小写盘符差异同族——
 *  normalizeCwd 先例）——src/x vs ./src/X 在 win32 是同一文件。 */
const fileKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 两文件域首个共同文件（比较键）——无交集 null。 */
export function filesOverlap(a, b) {
  if (!a?.length || !b?.length) return null
  const keys = new Set(b.map(fileKey))
  const hit = a.map(fileKey).find((k) => keys.has(k))
  return hit ?? null
}

/** 冲突文件的显示形态（优先相对 cwd——面板/返回文本可读）。 */
function showFile(parent, key) {
  const cwd = parent.cwd ?? process.cwd()
  const rel = relative(cwd, key)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : key
}

/**
 * §20 依赖终态查询（单点事实——池条目 / pending（挂起期 settle 移交——注入前）/
 * 终态墓碑（check/注入消费——consumed；取消/失败——D-SD5 分支））：
 * - ok      = settle 成功（报告已产出）/ consumed（check/注入消费——T-SD14 视为满足）
 * - pending = running/queued 未终态（等启动/等完成）
 * - failed / cancelled = 终态但非成功——依赖者走 dependency cancelled 分支（round2 #3）
 * - unknown = 从未存在（spawn 时明确错误——非 consumed 的 unknown 拒——T-SD10）
 */
export function depInfo(parent, id) {
  const key = String(id)
  const e = parent._asyncSubagents?.get(key)
  if (e) {
    if (e.cancelled) return { state: "cancelled", role: e.role }
    if (e.done) return e.error != null ? { state: "failed", role: e.role } : { state: "ok", role: e.role }
    return { state: "pending", role: e.role }
  }
  const pend = (parent._pendingAsyncResults ?? []).find((x) => String(x.id) === key)
  if (pend) return pend.error != null ? { state: "failed", role: pend.role } : { state: "ok", role: pend.role }
  const t = parent._asyncTombstones?.get(key)
  if (t) return { state: t.status === "cancelled" || t.status === "failed" ? t.status : "ok", role: t.role }
  return { state: "unknown", role: null }
}

/** §20 等待态派生（无存储——refill/status/面板/spawn 返回同一事实源）。kind：
 *  - slot = 无阻塞（依赖全满足 + 域无冲突）——纯槽满等位（可启动——等 slot）
 *  - wait = 依赖未完成 / 域冲突（running ∪ queued——D-SD3 同界——self 除外）
 *  - depc = 依赖取消/失败（round2 #3——非 AUTO 锁住——需父显式处置；AUTO 视为可启动）
 *  detail 为状态行共享文本（面板 waiting for 标注 / status reason / spawn reason）。 */
export function describeBlockers(parent, entry) {
  const wait = []
  const depc = []
  for (const depId of entry._dependsOn ?? []) {
    const info = depInfo(parent, String(depId))
    if (info.state === "pending" || info.state === "unknown") {
      wait.push(`${info.role ?? "sub"}#${depId}（依赖未完成）`)
    } else if (info.state === "cancelled" || info.state === "failed") {
      if (parent.autoApprove) continue // AUTO 档自动启动（D-SD5——父不在场由 digest 决策）
      depc.push(`${info.role ?? "sub"}#${depId}`)
    }
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of parent._asyncSubagents?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      const hit = filesOverlap(myFiles, e._files ?? [])
      if (!hit) continue
      // §21.1 D-SL1.2（环形死锁修正——与 queueRunnable 同界——展示一致）：后入
      // 者（spawn 序晚于我——数字 id 比较）不列——只列"会真正阻断我的"（running
      // 任意序 + 先入 queued）；列后入者 = 误导"等一个其实等不到的人"。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue
      wait.push(`${e.role}#${e.id}（域冲突 ${showFile(parent, hit)}）`)
    }
  }
  // 长列表裁剪（块头宽度预算——细节 status 可查全量）
  const cut = (arr) => (arr.length > 3 ? [...arr.slice(0, 3), `…（共 ${arr.length} 项）`] : arr)
  if (depc.length > 0) {
    const body = cut(depc).join("、")
    return { kind: "depc", detail: wait.length > 0 ? `dependency cancelled: ${body}；${cut(wait).join("、")}` : `dependency cancelled: ${body} — waiting for your decision (cancel this task to release, or AUTO starts it)` }
  }
  if (wait.length > 0) return { kind: "wait", detail: `waiting for: ${cut(wait).join("、")}` }
  return { kind: "slot", detail: "" }
}

/** §21.1 P-SL2（D-SL2——混合边环形等待停滞机械检测——AGENT-LOOP.md §21.1 扩展注）：
 * 判据（收窄——零误报优先——宁可漏报不可误打断）：池内 running = 0 && queued ≥ 2 &&
 * 无 dependency-cancelled 标记条目 && 每 queued 的 blocker（files 冲突者 + 未 settle
 * 依赖目标——与 describeBlockers/queueRunnable 同界——"真正会阻断我的"语义：files 只
 * 算 running 任意序 + 先入 queued（D-SL1.1 序判定）；依赖 pending = 池内未终态）⊆
 * queued 集且非空（闭包无外逃 + 无 runnable 漏网）→ 停滞。返回 { chains }（每 queued
 * 条目一条阻塞链——沿首个 blocker 走到首个重复节点（闭环）——每节点自带"等谁 + 为何等"
 * 理由注（`X（reason） → Y` 形态——X 等 Y 因 reason）；不满足 → null。
 * 不报（F-SL2.2 收窄判据）：running 锚点存在（依赖链/文件串行正常排队）；depc 滞留
 * （外部决策可解——§20 NF-SD 滞留有意——cancel 先入者即释放）；单 queued；blocker
 * 外逃（unknown 依赖目标/池外条目）；blocker 空（runnable——settle/cancel 驱动 refill
 * 会启动——非停滞）。自然流程中 wait 边恒指向先入者（依赖必须先前 spawn——unknown 拒 +
 * 文件冲突只阻断后入者——id 序）——混合环仅人工注入可构造（T-SD5 同族防御断言）——
 * 但状态既可能成环即机械可检——不依赖可达性论证。maybeRefillAsync 空转处不调用：refill
 * 嵌在 settle/cancel 链上无模型可见输出通道（抛错即破坏池操作）——check 守卫（async
 * 模块）+ status 视图（actions 模块）即 F-SL2 的报错落点。 */
export const STALL_NOTE = "cancel one task in the loop (action:'cancel') to break the cycle, then re-spawn it (AGENT-LOOP.md §21.1 P-SL2)"

export function detectStall(parent) {
  const map = parent._asyncSubagents
  if (!(map instanceof Map) || map.size === 0) return null
  const all = [...map.values()]
  if (all.some((e) => e.status === "running")) return null // ① running 锚点——正常排队不报
  const queued = all.filter((e) => e.status === "queued" && !e.cancelled)
  if (queued.length < 2) return null // ② 单 queued——非停滞不报
  // ③ 每 queued 的结构化 blocker 表（阻塞边 + 理由——镜像 describeBlockers 同界：
  // 依赖 pending/unknown 阻断（cancelled/failed 非 AUTO = depc 标记——整池不报）；
  // files 冲突 running 任意序 + 先入 queued——后入者不阻断（D-SL1.1 同判）。
  const edgesOf = new Map()
  for (const q of queued) {
    const list = []
    for (const depId of q._dependsOn ?? []) {
      const st = depInfo(parent, String(depId)).state
      if (st === "pending") {
        list.push({ to: map.get(String(depId)), reason: `dependsOn ${String(depId)}` })
      } else if (st === "unknown") {
        return null // 依赖目标池外（unknown）——外逃 blocker——不报（保守）
      } else if (!parent.autoApprove) {
        return null // dep-cancelled/failed 标记条目——外部决策可解——不报（F-SL2.2）
      }
    }
    const myFiles = q._files ?? []
    if (myFiles.length > 0) {
      for (const e of all) {
        if (e === q) continue
        if (e.status !== "running" && e.status !== "queued") continue
        const hit = filesOverlap(myFiles, e._files ?? [])
        if (!hit) continue
        if (e.status === "queued" && Number(e.id) > Number(q.id)) continue // 后入不阻断
        list.push({ to: e, reason: `files ${showFile(parent, hit)}——先入者` })
      }
    }
    if (list.length === 0) return null // ④ 无 blocker = runnable——refill 会启动——非停滞
    edgesOf.set(q, list)
  }
  // ⑤ 闭包无外逃：任一 blocker 落 queued 集外（含 cancelled/池外异常形态）→ 不报
  for (const list of edgesOf.values()) {
    for (const b of list) {
      if (b.to == null || !queued.includes(b.to)) return null
    }
  }
  // 链组装：每 queued 条目一条——沿首个 blocker 走到首个重复节点（闭环）——每节点
  // 自带"我等谁 + 为何等"段（`X（reason） → Y`——本节点 blocker 理由注于本节点旁——
  // 读取无歧义：X 等 Y 因为 reason——dependsOn 边不误读为目标属性——§21.1 扩展注
  // 示例同信息形态——闭环以起始节点重复闭合（末节点不再注——闭合自明）。
  const chains = []
  for (const start of queued) {
    const seen = []
    let cur = start
    for (;;) {
      seen.push(cur)
      const next = edgesOf.get(cur)?.[0]?.to
      if (!next) break // 防御：预检保证不达（每节点 blocker 非空闭包内）
      if (seen.includes(next)) { seen.push(next); break } // 闭环：重复节点入链闭合
      cur = next
    }
    const frags = []
    for (let i = 0; i < seen.length; i++) {
      const edge = i < seen.length - 1 ? edgesOf.get(seen[i])?.[0] : null // 末节点=闭环重复——不再注
      frags.push(`${seen[i].role}#${seen[i].id}${edge ? `（${edge.reason}）` : ""}`)
    }
    chains.push({ task: start, text: frags.join(" → ") })
  }
  return { chains }
}


/** §20 D-SD4 补位判据：依赖全满足（AUTO 下 depc 放行）+ 域无冲突（running 任意序 +
 *  queued 先入者——§21.1 D-SL1.1 序判定：同文件串行 = 先入者先启动、后入者等先入者
 *  ——不自锁；先入者启动后以 running 身份继续挡住后入者——self 除外）。
 *  已知限制（§21.1 评审 #4——与 §20 NF-SD 同语义——滞留有意义不静默）：先入者被
 *  depc 锁定时（依赖取消/失败且非 AUTO——永不自动启动），后入者滞留等它——cancel
 *  先入者即释放（父显式可清；AUTO 档 depc 视为可启动——不滞留）。 */
export function queueRunnable(parent, entry) {
  for (const depId of entry._dependsOn ?? []) {
    const state = depInfo(parent, String(depId)).state
    if (state === "pending" || state === "unknown") return false
    if ((state === "cancelled" || state === "failed") && !parent.autoApprove) return false
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of parent._asyncSubagents?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      if (!filesOverlap(myFiles, e._files ?? [])) continue
      // §21.1 D-SL1.1 序判定：queued 仅"先入者"（spawn 序早于我——数字 id 比较）阻断；
      // 后入者不阻断——先入者先启动——两个 queued 同文件不再互等（环形死锁修正）。
      // 防御（评审 #3——id 形态）：池条目 id 为数字递增（_subAgentCounter——已核实）；
      // 异常形态 Number() 得 NaN → 比较 false → 不跳过 → 保守阻断（宁可多等——
      // 不冒险并发——防 NaN 误放行）。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue // 后入者不阻断——先入者先启动
      return false
    }
  }
  return true
}

/** §20 D-SD5 环防御（round2 #5——自然流程不可达：unknown id 拒 + spawn 序天然无环——
 *  仅人工向池注入可构造——防御断言定位）：从新 spawn 的依赖集出发沿池内条目
 *  _dependsOn 边做路径 DFS——路径上重复访问（可达环）→ 拒绝（A→B→A 永不自启——
 *  错误明确——T-SD5）。运行/排队条目皆可成环节点；池小（≤4 槽 + 有限队列）深度有限。 */
export function assertNoDepCycle(parent, dependsOn) {
  const edges = new Map()
  for (const e of parent._asyncSubagents?.values() ?? []) {
    if (e.status === "running" || e.status === "queued") {
      edges.set(String(e.id), (e._dependsOn ?? []).map(String))
    }
  }
  const onPath = new Set()
  const visit = (id) => {
    if (onPath.has(id)) {
      throw new Error(`subagent dependsOn cycle detected: ${[...onPath, id].join(" → ")} — entries in a dependency loop can never start; cancel the dependents and restructure the chain (AGENT-LOOP.md §20 D-SD5)`)
    }
    onPath.add(id)
    for (const dep of edges.get(id) ?? []) visit(dep)
    onPath.delete(id)
  }
  for (const d of dependsOn) visit(String(d))
}

/** 依赖某 id 的 queued 条目显示标签（D-SD5 提醒/标注——依赖者列表）。 */
export function dependentLabels(parent, depId) {
  const key = String(depId)
  const out = []
  for (const e of parent._asyncQueue ?? []) {
    if ((e._dependsOn ?? []).some((d) => String(d) === key)) out.push(`${e.role}#${e.id}`)
  }
  return out
}

/** §20 D-SD3b 排队态面板刷新（⟦ev⟧queued 事件族——TUI routeSubToken 消费）：对全部
 *  queued 条目重算等待态并发射变化（去重 sig——kind/position/detail 全变才发）——
 *  调用点 = 一切队列突变与等待态变迁（spawn 入队 / settle 后补位与依赖转移 / cancel
 *  出队 / check 消费）。position = 队列序（D-A1 既有——cancel 前移同源）。 */
export function refreshQueuedTokens(parent, onToken) {
  if (typeof onToken !== "function") return
  const queue = parent._asyncQueue ?? []
  for (let i = 0; i < queue.length; i++) {
    const e = queue[i]
    const blk = describeBlockers(parent, e)
    const sig = `${blk.kind}\x1e${i + 1}\x1e${blk.detail}`
    if (e._lastQueuedSig === sig) continue
    e._lastQueuedSig = sig
    try {
      onToken(`${e.relayPrefix}⟦ev⟧queued\x1e${blk.kind}\x1e${i + 1}\x1equeued\x1e${blk.detail}`)
    } catch { /* relay 失败不影响池状态 */ }
  }
}

/**
 * Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6 + §20 D-SD4): start queue heads
 * while a running slot is free — called from every settle (completion frees a slot)
 * and from the turn-end collection's refill loop. §20：队列现可混合 waiting-deps 与
 * slot-queued——扫描选"依赖全满足 + 域无冲突"的最早条目启动（waiting 越行不阻塞
 * 槽位；多任务同时解除按 queued 序逐个启动到槽满——上限 4 不变）。纯 slot 队列的
 * 行为与旧 shift 完全一致（全部条目可启动 → 最早 == 队首）。
 */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  for (;;) {
    const running = [...(parent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    let pick = -1
    for (let i = 0; i < queue.length; i++) {
      if (queueRunnable(parent, queue[i])) { pick = i; break }
    }
    if (pick < 0) return
    queue.splice(pick, 1)[0].start()
  }
}