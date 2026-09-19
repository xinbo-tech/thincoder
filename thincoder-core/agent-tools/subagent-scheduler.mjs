/**
 * subagent-scheduler.mjs — §20 子 agent 任务调度器 + 文件域组（2026-09-05 自
 * subagent-async.mjs 拆分——Module Split Policy §20.9——纯迁移零行为变化——
 * AGENT-LOOP.md §20 D-SD1..SD5 + §21.1 D-SL1 环形死锁修正）。
 * 内容：normalizeFileList / filesOverlap / effectiveFiles（SCHEDULER-DYNAMIC-DOMAIN
 * 动态域——声明 ∪ running touched）/ depInfo / describeBlockers / detectStall（§21.1
 * P-SL2 停滞机械检测）/ queueRunnable / assertNoDepCycle / dependentLabels /
 * refreshQueuedTokens / maybeRefillAsync。
 * ASYNC_POOL_LIMITS/poolLimitsFor/runningPoolCount 回引自 subagent-async.mjs（主体保有——
 * 仅调用期使用——与主体对此处调度符号的回引构成惰性环——无求值期依赖）。
 */
import { isAbsolute, relative, resolve } from "node:path"
import { existsSync, statSync } from "node:fs"
// zero-block 批 P1（TUI.md §6.8.3.2②）：排队刷新 relay 异常留痕（禁静默——池状态仍不破坏）。
import { logEvent } from "../log.mjs"
// M5 F6（ENGINEERING-MODE-V2-MODULE-DELEGATION §2.3）：files 声明面拦截谓词本体落
// spawn-gates.mjs（纯谓词零依赖——本处只加 import 调用，无环）。
import { rejectEngineeringFilePaths } from "./spawn-gates.mjs"
import { poolLimitsFor, runningPoolCount, ASYNC_POOL_LIMITS } from "./subagent-async.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor——async-settle.mjs 反向 import 本模块
// （dependentLabels）构成同款惰性环（函数级绑定——无求值期依赖）。
// #94（VSC 侧并入）：池 / pending / 墓碑读取全走载体吸收（carrierField / getAsyncPool /
// tombstoneOf——CLI 形字段优先 / VSC 形回退 history）。
import { carrierField, getAsyncPool, tombstoneOf } from "./async-settle.mjs"

// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20——D-SD1..SD5 + 20.4 处置注）
// 池条目域元数据（D-SD2：entry._files/_dependsOn——running ∪ queued 全带）、准入
// （D-SD3：域冲突/依赖未满足 → queued 等位）、补位扫描（D-SD4：最早可启动——
// 依赖全满足 + 域无冲突——waiting 越行不阻塞 slot 位）、释放规则（D-SD5——round2
// #3 锁定默认：依赖取消/失败 → 依赖者留 queued 标 dependency cancelled——仅父显式
// 处置或 AUTO 自动启动）、终态墓碑（round1 #8/T-SD14：自动通道注入消费与取消写墓碑——
// consumed 视为满足；非 consumed unknown id 才拒）。状态全部派生不存储（单点事实）。
// ═══════════════════════════════════════════════════════════════════════════

/** 文件域归一化（round1 #5——路径归一化再交集）：相对 cwd 解析为绝对路径 + 去重；
 *  非字符串/空项静默跳过（声明错误 = false-negative 明示风险——v1 边界）。
 *  §20.8 D-F1.1（2026-09-04）：目录声明检测——fail-closed——尾斜杠形态 / 指向既有目录
 *  → throw（含路径——错误字符串英文定稿）——目录声明静默绕过冲突检测的通道闭合；
 *  调用方（subagent.mjs spawn 入口）catch → 错误即工具结果（模型可见——无静默）。
 *  已知限制（§20.8 未编号段——评审 #4）：不存在的目录声明（无尾斜杠 + 目录未创建）仍通过——不处理。
 *  §28 R26 F-R26b（2026-09-07）：父侧维护文件黑名单——归一化后 basename 全名匹配 +
 *  大小写不敏感（todo.md/changelog.md 精确——路径任意层含 docs/、根、.thincoder/）——
 *  命中 → throw（fail-closed——先于调度器准入——无排队残留——错误即工具结果）；
 *  提示列出全部违规条目——英文模板逐字定稿（AGENT-LOOP.md §28）。
 *  M5 F6（2026-09-17）：黑名单随同迁入 spawn-gates.mjs（rejectEngineeringFilePaths——族 = ledger.db / CHANGELOG + scripts/**；老台账 md 族随 M2 退役）——本函数只留调用（错误文案逐字保留）。 */
export function normalizeFileList(files, cwd) {
  const out = []
  for (const f of Array.isArray(files) ? files : []) {
    if (typeof f !== "string" || !f.trim()) continue
    if (f.trimEnd().endsWith("/") || f.trimEnd().endsWith("\\")) { // 2.7 批：尾随空格目录声明（"test/ "）同拒
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    const abs = resolve(cwd ?? process.cwd(), f)
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    if (!out.includes(abs)) out.push(abs)
  }
  // M5 F6（ENGINEERING-MODE-V2-MODULE-DELEGATION §2.2）：scripts/** + 过程档拦截——
  // 谓词本体落 spawn-gates.mjs（rejectEngineeringFilePaths 收集全部违规 + 抛合并错误）；
  // 循环内目录声明先行（错误序不变——目录错误先于过程档错误）。父侧维护文件
  // basename 族（ledger.db / CHANGELOG）随同迁入谓词——错误文案逐字保留。
  if (files !== undefined && files !== null) rejectEngineeringFilePaths(files)
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

/** 有效文件域（SCHEDULER-DYNAMIC-DOMAIN 2026-09-09——动态域 = 声明 ∪ 运行中实际写入）：
 *  running 且已绑 childAgent → 声明域 ∪ childAgent._touchedFiles（写工具批提交实时记录
 *  ——绝对路径与 normalizeFileList 同源——fileKey/filesOverlap 键空间零改动）；去重按
 *  fileKey。queued 无 childAgent（start 才绑——VSC 首 onAgentTurn 才绑）——天然只声明域
 *  （`?.` null 安全——既有无 childAgent 用例零行为变化）。 */
export function effectiveFiles(e) {
  const declared = e._files ?? []
  if (e.status !== "running" || !e.childAgent) return declared
  const out = [...declared]
  const seen = new Set(declared.map(fileKey))
  for (const f of e.childAgent._touchedFiles ?? []) {
    const k = fileKey(f)
    if (!seen.has(k)) { seen.add(k); out.push(f) }
  }
  return out
}

/**
 * §20 依赖终态查询（单点事实——池条目 / pending（挂起期 settle 移交——注入前）/
 * 终态墓碑（自动通道注入消费——consumed；取消/失败——D-SD5 分支））：
 * - ok      = settle 成功（报告已产出）/ consumed（自动通道注入消费——T-SD14 视为满足）
 * - pending = running/queued 未终态（等启动/等完成）
 * - failed / cancelled = 终态但非成功——依赖者走 dependency cancelled 分支（round2 #3）
 * - discarded = 中止丢弃（批 4 CLI-ASYNC-DISCARD——报告不可达）⇒ 归 cancelled 口径（F4）
 * - unknown = 从未存在（spawn 时明确错误——非 consumed 的 unknown 拒——T-SD10）
 */
export function depInfo(parent, id) {
  const key = String(id)
  const e = getAsyncPool(parent, "subagent")?.get(key)
  if (e) {
    if (e.cancelled) return { state: "cancelled", role: e.role }
    if (e.done) return e.error != null ? { state: "failed", role: e.role } : { state: "ok", role: e.role }
    return { state: "pending", role: e.role }
  }
  // ASYNC-RESULT-CONTAINER.md D2：pending 单容器（四族统一停靠——依赖目标挂起期 settle
  // 移交也在此——注入前视为已消费）。载体吸收（#94——VSC 形 pending 挂 history）。
  const pend = (carrierField(parent, "_pendingAsyncResults") ?? []).find((x) => String(x.id) === key)
  if (pend) return pend.error != null ? { state: "failed", role: pend.role } : { state: "ok", role: pend.role }
  const t = tombstoneOf(parent, key)
  if (t) {
    // F4（批 4 CLI-ASYNC-DISCARD）：丢弃墓碑 = 报告不可达 ⇒ 归 cancelled 口径（D-SD5 分支）。
    const st0 = t.status === "discarded" ? "cancelled" : t.status
    return { state: st0 === "cancelled" || st0 === "failed" ? st0 : "ok", role: t.role }
  }
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
    for (const e of getAsyncPool(parent, "subagent")?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      // SCHEDULER-DYNAMIC-DOMAIN（2026-09-09）：他条目域 = effectiveFiles(e)（声明 ∪
      // running 实际 touched）；命中仅来自 touched（∉ 声明域）→ 加注"运行中实际写入"
      // ——纯声明命中文案不回归（评审 #7 重叠优先级：声明∩touched 同文件不加注）。
      const hitDeclared = filesOverlap(myFiles, e._files ?? [])
      const hit = hitDeclared ?? filesOverlap(myFiles, effectiveFiles(e))
      if (!hit) continue
      // §21.1 D-SL1.2（环形死锁修正——与 queueRunnable 同界——展示一致）：后入
      // 者（spawn 序晚于我——数字 id 比较）不列——只列"会真正阻断我的"（running
      // 任意序 + 先入 queued）；列后入者 = 误导"等一个其实等不到的人"。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue
      wait.push(`${e.role}#${e.id}（域冲突 ${showFile(parent, hit)}${hitDeclared ? "" : "（运行中实际写入）"}）`)
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
 * 嵌在 settle/cancel 链上无模型可见输出通道（抛错即破坏池操作）——status 视图（actions
 * 模块）即 F-SL2 的报错/标记落点（§19.8：check 守卫随 check 删除）。 */
export const STALL_NOTE = "cancel one task in the loop (action:'cancel') to break the cycle, then re-spawn it (AGENT-LOOP.md §21.1 P-SL2)"

export function detectStall(parent) {
  const map = getAsyncPool(parent, "subagent")
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
        const hit = filesOverlap(myFiles, effectiveFiles(e)) // 动态域（running 锚点守卫下零增量——读法同界防御一致）
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


/** §6.9 终态守卫谓词单点（c1——2026-09-17 af 批 · 族无关）：**取消 / 已完成条目永不启动**
 *  （守卫只跳过、不剔除、不重编号——队列内容零副作用）。两消费点 = 本档 `queueRunnable`
 *  （`maybeRefillAsync` 经它判 · 子代理族）· `refillAdvisorQueue`（评审族）——动机 = 台账
 *  #31：「取消后仍留队列 → 补位 `start()` 重启 ⇒ 幻影冻结块」的唯一燃料（族无关封死）。 */
export function entryTerminal(entry) {
  return entry?.cancelled === true || entry?.done === true
}

/** §20 D-SD4 补位判据：依赖全满足（AUTO 下 depc 放行）+ 域无冲突（running 任意序 +
 *  queued 先入者——§21.1 D-SL1.1 序判定：同文件串行 = 先入者先启动、后入者等先入者
 *  ——不自锁；先入者启动后以 running 身份继续挡住后入者——self 除外）。
 *  已知限制（§21.1 评审 #4——与 §20 NF-SD 同语义——滞留有意义不静默）：先入者被
 *  depc 锁定时（依赖取消/失败且非 AUTO——永不自动启动），后入者滞留等它——cancel
 *  先入者即释放（父显式可清；AUTO 档 depc 视为可启动——不滞留）。 */
export function queueRunnable(parent, entry) {
  // §6.9 终态守卫（c1——族无关单点谓词）：终态条目（cancelled / done）不启动——
  // 与依赖 / 域判据并列的头判（队列内容零副作用——只跳过）。
  if (entryTerminal(entry)) return false
  for (const depId of entry._dependsOn ?? []) {
    const state = depInfo(parent, String(depId)).state
    if (state === "pending" || state === "unknown") return false
    if ((state === "cancelled" || state === "failed") && !parent.autoApprove) return false
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of getAsyncPool(parent, "subagent")?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      if (!filesOverlap(myFiles, effectiveFiles(e))) continue // 动态域：声明 ∪ running touched
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
  for (const e of getAsyncPool(parent, "subagent")?.values() ?? []) {
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
 *  出队 / 自动通道消费）。position = 队列序（D-A1 既有——cancel 前移同源）。
 *  P1 禁静默（zero-block 批 §6.8.3.2②）：relay 异常不再静默——留痕一条
 *  `ev:queued-paint-failed`（**池状态不被破坏**语义不变——catch 不重抛）。 */
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
    } catch {
      // relay 失败不影响池状态（现状）；P1 禁静默：留痕一条（§6.8.3.2②）。
      logEvent("ev:queued-paint-failed", { id: `${e.role}#${e.id}` })
    }
  }
}

/**
 * Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6 + §20 D-SD4 + §11.1 D-24a/R14 分域):
 * start queue heads while a running slot is free — called from every settle
 * (completion frees a slot) and from the turn-end collection's refill loop. §20：
 * 队列现可混合 waiting-deps 与 slot-queued——扫描选"依赖全满足 + 域无冲突"的最早
 * 条目启动（waiting 越行不阻塞槽位；多任务同时解除按 queued 序逐个启动）。
 * §11.1 D-24a（R14）：槽位判定按域——条目 _pool 域内 running 数 < 该域上限才启动
 * （同域仍 4——纯单域队列行为与旧 shift 完全一致；跨域总量 8——各域独立腾槽，
 * 互不阻塞）。配置每次补位时读（poolLimitsFor——变更即生效下个补位）。
 */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  for (;;) {
    let pick = -1
    for (let i = 0; i < queue.length; i++) {
      const e = queue[i]
      if (!queueRunnable(parent, e)) continue
      const pool = e._pool ?? "other" // 缺域字段（手工/旧条目）按 other——既有测试语义不变
      if (runningPoolCount(parent, pool) >= (poolLimitsFor(parent)[pool] ?? ASYNC_POOL_LIMITS[pool])) continue
      pick = i
      break
    }
    if (pick < 0) return
    queue.splice(pick, 1)[0].start()
  }
}

/**
 * 分配下一子代理 id——池活续号兜底（SUBAGENT-ID-COUNTER-AGENT，2026-09-09——双端同构
 * 机制：VSC 端载体自 history expando 移本体并接本函数；CLI 端计数器一直挂 agent 本体
 * （`_subAgentCounter`——per-run reset 清单不含——跨 run/跨压缩存活），本函数补齐
 * poolMax 兜底：计数器丢失面（AUTO 撞上限续跑/挂起驱动的重建形态）不再复用仍在
 * 跑/排队的条目 id——map.set 覆盖旧条目 = 静默丢报告 + status/cancel 错址）。优先级
 * next = max(counter ?? 0, poolMax) + 1——取号后 counter 同步（首取号初始化）。id 作用
 * 域 = 进程内（不做槽持久化——reload 后池清块消失，新进程从 1 无冲突——设计范围边界）。
 * spawn（subagent-spawn.mjs async 分支）、escalate（escalate-async.mjs）、async-advisor
 * 池（advisor-async.mjs——§11.2 跨池共号）共用；executeAsyncSpawn 直读 counter（分配与
 * 消费同步——无 await 间隙）。CLI 两池键均为字符串（set(String(id))——解析分支防御保留）。
 * @returns {number} 全池唯一的下一 id（单调——进程内）
 */
export function nextSubagentId(parent) {
  let poolMax = 0
  for (const pool of [carrierField(parent, "_asyncSubagents"), carrierField(parent, "_asyncAdvisors")]) {
    if (!pool || pool.size === 0) continue
    for (const k of pool.keys()) {
      const n = typeof k === "number" ? k : Number.parseInt(k, 10)
      if (Number.isFinite(n) && n > poolMax) poolMax = n
    }
  }
  const next = Math.max(parent?._subAgentCounter ?? 0, poolMax) + 1
  parent._subAgentCounter = next
  // ED-5（AGENT-LOOP-SUBAGENT.md §6.21）：一次性取号令牌——与 counter 同段原子写
  // （取号 → 消费同步、无 await 间隙）；消费点断言同号后置 undefined（漏调分配器 ⇒ 抛错，
  // 非静默覆写）。入池键守卫 = assertPoolKeyFree（下方）。
  parent._lastSubagentId = next
  return next
}

/**
 * ED-5（AGENT-LOOP-SUBAGENT.md §6.21）一次性取号令牌消费——三消费点同族断言：
 * `parent._lastSubagentId === id`（取号 → 消费同步配对，无 await 间隙；漏调
 * nextSubagentId ⇒ 令牌缺位/错号 ⇒ 抛错——防直读陈旧 counter 的静默覆写），断言
 * 通过即置 `undefined`（一次性——同一令牌跨站点复用第二消费必抛）。
 * 调用点：executeAsyncSpawn（subagent-run.mjs）· launchEscalateAsync（escalate-async.mjs）·
 * launchAsyncAdvisor（advisor-async.mjs）——site = 站点名（错误文案定位面）。
 */
export function consumeSubagentToken(parent, id, site, role) {
  if (parent?._lastSubagentId !== id) {
    throw new Error(`subagent id allocator not called (nextSubagentId) before ${site}: ${role}#${id}`)
  }
  parent._lastSubagentId = undefined
}

/**
 * ED-5（§6.21）入池键守卫——三入池点同族：`set(String(id))` 前断言键不存在；命中 =
 * 覆写（静默丢报告 + status/cancel 错址）⇒ 抛错。调用点：子代理池（subagent-run.mjs）·
 * escalate（escalate-async.mjs）· advisor 池（advisor-async.mjs）。
 */
export function assertPoolKeyFree(pool, id, role) {
  if (pool.has(String(id))) {
    throw new Error(`subagent id collision: ${role}#${id} already in pool`)
  }
}
