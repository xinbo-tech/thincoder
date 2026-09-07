/**
 * subagent-scheduler.mjs — §20 子 agent 任务调度器 + 文件域组（AGENT-LOOP.md §20
 * D-SD1..SD5 + 20.4——CLI 同规格镜像；2026-09-05 模块拆分轮从 subagent-async.mjs verbatim
 * 迁出——纯模块迁移零行为变化——只允许 import 调整与头部注释更新）。内容：池 Map/终态墓碑
 * 载体访问（poolMap/tombMap/writeTombstoneTo/writeTombstone）、文件域归一化与冲突检测
 * （normalizeFileList/fileKey/filesOverlap/showFile——目录声明 fail-closed）、依赖/等待态
 * 查询与补位判据（idNum/depInfo/describeBlockers/queueRunnable/refillPool——D-SD4 释放点
 * 补位）、排队行刷新（refreshQueuedRows——D-SD3b 去重 sig）、依赖者标注（dependentLabels——
 * D-SD5 提醒）、环防御（assertNoDepCycle）、停滞机械检测（detectStall/stallErrorText——
 * §21.1 P-SL2 扩展注）、池并发上限 ASYNC_SUBAGENT_LIMIT 与队列位置
 * 查询（queuePosition——Map 插入序 = FIFO）。叶子模块——只 import node:fs/node:path——
 * 被 subagent-async.mjs（spawn/settle/注入侧）与 subagent-actions.mjs（status/cancel
 * 动作侧）单向依赖——模块图无环。
 */
import { existsSync, statSync } from "node:fs"
import { resolve, relative, isAbsolute, basename } from "node:path"

// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20 D-SD1..SD5 + 20.4——CLI 同规格镜像）
// ═══════════════════════════════════════════════════════════════════════════
// VS Code 结构差异：池 = history 载体（agent.mjs :115 重建绑定 + :497 回写）——墓碑与
// 域元数据沿 history 存活（parent.history?._asyncTombstones——agent.mjs 重建不丢）；
// 无独立 _asyncQueue——队列序 = 池 Map 插入序（queued 过滤——queuePosition 先例）；
// AUTO 档 = ctx.getAuto 活读（无 autoApprove 字段——execute-tools 注入 live getter——
// 条目 _auto 绑定 spawn 上下文，settle 无 ctx 路径照读）。等待态派生不存储（单点事实）。

/** 池 Map（history 载体优先——跨 runAgent 存活；直接 execute ctx 回落 agent 字段）。 */
export function poolMap(parent) {
  return parent.history?._asyncSubagents instanceof Map
    ? parent.history._asyncSubagents
    : (parent._asyncSubagents ?? new Map())
}

// ─── D1 池 accessor（ASYNC-RESULT-CONTAINER.md，2026-09-08——async 结果容器统一）───
// 消费端统一经 accessor 访问池——吸收 VSC 双查询（history?._X ?? agent._X）差异
// （VS Code agent 对象 per-run 重建——池挂共享 depth-0 history 数组 + per-run agent
// 字段 alias，两端可能并存同一 Map 引用）。叶子模块承载（本模块本就来池载体访问——
// async-settle.mjs 与各族模块单向 import，模块图无环）。

/** 族 → 池键：subagent/escalate 同池（_asyncSubagents——escalate 入 other 域 §24 D-24a）；
 *  advisor 独立池（_asyncAdvisors）；consult 会话池（_consultSessions）。 */
export const ASYNC_POOL_KEYS = {
  subagent: "_asyncSubagents",
  escalate: "_asyncSubagents",
  advisor: "_asyncAdvisors",
  consult: "_consultSessions",
}

/** D1 池 accessor：getAsyncPool(parent, role)——history 载体优先，回落 agent 字段；
 *  无池返回 null（调用方按空池处理）。create=true 时无池则在 history 优先载体上建池。 */
export function getAsyncPool(parent, role, create = false) {
  const key = ASYNC_POOL_KEYS[role] ?? "_asyncSubagents"
  if (parent?.history?.[key] instanceof Map) return parent.history[key]
  if (parent?.[key] instanceof Map) return parent[key]
  if (!create || !parent) return null
  const holder = parent.history ?? parent
  holder[key] = new Map()
  return holder[key]
}

/** 池条目移除（双载体同删——settle 出池清理保留既有 history+agent 双 delete 语义）。 */
export function removeFromAsyncPools(parent, role, id) {
  const key = ASYNC_POOL_KEYS[role] ?? "_asyncSubagents"
  parent?.history?.[key]?.delete?.(id)
  parent?.[key]?.delete?.(id)
}

/** 终态墓碑 Map（round1 #8/T-SD14——consumed 视为满足；cancelled/failed 走 D-SD5 分支）。 */
function tombMap(parent, create = false) {
  const holder = parent.history ?? parent
  if (!(holder._asyncTombstones instanceof Map)) {
    if (!create) return new Map()
    holder._asyncTombstones = new Map()
  }
  return holder._asyncTombstones
}

/** 写终态墓碑（holder = 拥有载体的对象——history 数组或 agent——跨 runAgent 存活）。 */
export function writeTombstoneTo(holder, id, status, role) {
  if (!holder) return
  if (!(holder._asyncTombstones instanceof Map)) holder._asyncTombstones = new Map()
  holder._asyncTombstones.set(idNum(id), { status, role })
}

/** 写终态墓碑（parent 形态——history 载体优先）。 */
export function writeTombstone(parent, id, status, role) {
  writeTombstoneTo(parent.history ?? parent, id, status, role)
}

/** 文件域归一化（round1 #5——相对 cwd 解析绝对 + 去重——冲突比较键 win32 小写）。
 *  §20.8 D-F1.1（2026-09-04）：目录声明检测——fail-closed——尾斜杠形态 / 指向既有目录
 *  → throw（含路径——错误字符串英文定稿）——目录声明静默绕过冲突检测的通道闭合；
 *  调用方（subagent.mjs spawn 入口）catch → 错误即工具结果（模型可见——无静默）。
 *  已知限制（D-F1.4 附注）：不存在的目录声明（无尾斜杠 + 目录未创建）仍通过——不处理。
 *  §28 R26 F-R26b（2026-09-07）：父侧维护文件黑名单——归一化后 basename 全名匹配 +
 *  大小写不敏感（todo.md/changelog.md/checklist.md 精确 + checklist* 前缀家族——路径任意
 *  层含 docs/、根、.thincoder/）——命中 → throw（fail-closed——先于调度器准入——无排队
 *  残留——错误即工具结果）；提示列出全部违规条目——英文模板逐字定稿（AGENT-LOOP.md §28）。 */
export function normalizeFileList(files, cwd) {
  const out = []
  const violations = [] // §28 R26 F-R26b：父侧维护文件命中（保留声明原样——提示可读）
  for (const f of Array.isArray(files) ? files : []) {
    if (typeof f !== "string" || !f.trim()) continue
    if (f.endsWith("/") || f.endsWith("\\")) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    const abs = resolve(cwd ?? process.cwd(), f)
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    // 黑名单 basename 推导前做分隔符归一（\ → /——反斜杠变体跨平台同拒——
    // win32 resolve 本就兼容双分隔符——POSIX 需显式归一——advisor 🔵2 处置）
    const base = basename(resolve(cwd ?? process.cwd(), f.replace(/\\/g, "/"))).toLowerCase()
    if (base === "todo.md" || base === "changelog.md" || base.startsWith("checklist")) violations.push(f)
    if (!out.includes(abs)) out.push(abs)
  }
  if (violations.length > 0) {
    throw new Error(violations
      .map((f) => `Parent-side maintained file ${f} must not be listed in files — reconciliation is the parent's duty; use the design-doc path if you need to edit a design doc`)
      .join("\n"))
  }
  return out
}

const fileKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 两文件域首个共同文件（比较键）——无交集 null。 */
export function filesOverlap(a, b) {
  if (!a?.length || !b?.length) return null
  const keys = new Set(b.map(fileKey))
  return a.map(fileKey).find((k) => keys.has(k)) ?? null
}

function showFile(parent, key) {
  const cwd = parent.cwd ?? process.cwd()
  const rel = relative(cwd, key)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : key
}

/** 数字 id 归一（池 map keys 数字——spawn 返回/模型回传可能字符串——advisor fix #3 先例）。 */
const idNum = (id) => (typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id)

/**
 * §20 依赖终态查询（单点事实——池条目 / pending（挂起期 settle 移交——注入前）/
 * 终态墓碑（自动送达消费——consumed；取消/失败——D-SD5 分支））：
 * ok（settle 成功/consumed——T-SD14 视为满足）/ pending（等启动/完成）/
 * failed|cancelled（依赖取消失败——depc 分支）/ unknown（从未存在——spawn 明确错误）。
 */
export function depInfo(parent, id) {
  const key = idNum(id)
  const e = poolMap(parent).get(key)
  if (e) {
    if (e.cancelled) return { state: "cancelled", role: e.role }
    if (e.done) return e.error != null ? { state: "failed", role: e.role } : { state: "ok", role: e.role }
    return { state: "pending", role: e.role }
  }
  const pend = (parent.history?._pendingAsyncResults ?? parent._pendingAsyncResults ?? []).find((x) => String(x.id) === String(key))
  if (pend) return pend.error != null ? { state: "failed", role: pend.role } : { state: "ok", role: pend.role }
  const t = tombMap(parent).get(key)
  if (t) return { state: t.status === "cancelled" || t.status === "failed" ? t.status : "ok", role: t.role }
  return { state: "unknown", role: null }
}

/** §20 等待态派生（kind slot/wait/depc——detail 共享文本——行/status/spawn 返回同源）。
 *  AUTO（auto=true）depc 视为可启动（D-SD5——round2 #3——仅 AUTO/父显式处置才启动）。 */
export function describeBlockers(parent, entry, auto = false) {
  const wait = []
  const depc = []
  for (const depId of entry._dependsOn ?? []) {
    const info = depInfo(parent, depId)
    if (info.state === "pending" || info.state === "unknown") {
      wait.push(`${info.role ?? "sub"}#${depId}（依赖未完成）`)
    } else if (info.state === "cancelled" || info.state === "failed") {
      if (auto) continue
      depc.push(`${info.role ?? "sub"}#${depId}`)
    }
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of poolMap(parent).values()) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      // §21.1 D-SL1.2（展示一致——与 queueRunnable 同序判定）：只列会**真正阻断我**的
      // 条目——后入者（queued 且 id 晚于当前任务）不列——避免 status/waiting 误导"等
      // 一个其实等不到的人"（旧代码两个 queued 同文件互列——环形死锁的展示面）。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue
      const hit = filesOverlap(myFiles, e._files ?? [])
      if (!hit) continue
      wait.push(`${e.role}#${e.id}（域冲突 ${showFile(parent, hit)}）`)
    }
  }
  const cut = (arr) => (arr.length > 3 ? [...arr.slice(0, 3), `…（共 ${arr.length} 项）`] : arr)
  if (depc.length > 0) {
    const body = cut(depc).join("、")
    return { kind: "depc", detail: wait.length > 0 ? `dependency cancelled: ${body}；${cut(wait).join("、")}` : `dependency cancelled: ${body} — waiting for your decision (cancel this task to release, or AUTO starts it)` }
  }
  if (wait.length > 0) return { kind: "wait", detail: `waiting for: ${cut(wait).join("、")}` }
  return { kind: "slot", detail: "" }
}

/** §20 D-SD4 补位判据：依赖全满足（AUTO depc 放行）+ 域无冲突（running ∪ queued
 *  self-excl——队列序保同文件串行：先入者启动后以 running 身份继续挡后入者）。
 *  §21.1 D-SL1.1（2026-09-04——环形死锁修正）：queued 域冲突阻断只适用于**先入者**
 *  （spawn 序早——池条目 id 数字递增）——后入者不阻断——否则两个 queued 同文件互相
 *  阻断 → 环形死锁（两次实证 id:26/27、id:32/33）；running 照旧阻断（任意序——先入
 *  者启动后以 running 身份继续挡后入者——F-SL1.2 自然串行）。 */
export function queueRunnable(parent, entry, auto = false) {
  for (const depId of entry._dependsOn ?? []) {
    const state = depInfo(parent, depId).state
    if (state === "pending" || state === "unknown") return false
    if ((state === "cancelled" || state === "failed") && !auto) return false
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of poolMap(parent).values()) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      // §21.1 D-SL1.1：后入者（queued 且 id 晚于当前任务）不阻断——先入者先启动。
      // id 形态防御：Number() 归一数字/数字字符串（advisor fix #3 先例——模型回传可能
      // 字符串化）；非数字 → NaN → 比较 false → 不跳过（fail-closed——保守按"先入者"
      // 阻断语义——与旧行为一致，不放开任何阻断）。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue
      if (filesOverlap(myFiles, e._files ?? [])) return false
    }
  }
  return true
}

/** §21.1 P-SL2 停滞机械检测（AGENT-LOOP.md §21.1 扩展注——2026-09-05——CLI 镜像同语义）：
 *  §21.1 修复覆盖纯文件边互等环（id 序判定破环）后残留 = 依赖边 + 文件域边**跨类型成环**
 *  ——A(files X, dep C) + B(files X) + C(dep B)：B 等 A（文件——A 先入占 X——序判定合法）、
 *  A 等 C（依赖）、C 等 B（依赖）——单边检查各无违例——组合即停滞（无 running、全 queued、
 *  阻塞闭包无外逃——每 queued 的 blocker 均落 queued 集内）。判定：running = 0 && queued ≥2
 *  && 每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标——与 describeBlockers/
 *  queueRunnable 同语义同序判定）⊆ queued 集 && 无 dep-cancelled 标记（外部决策可解——
 *  §20 NF-SD 滞留有意）&& 每 queued 至少 1 blocker（无 blocker 的 queued = refill 必启的
 *  不可达态——∅ ⊆ 空真判定防误报——收窄）。返回 { chains: 逐条阻塞边 } 或 null——保守不误报
 *  （running 锚点/单 queued/depc/不可达态均 null——宁漏报不误打断——部分形态停滞漏报接受）。
 *  调用点 = status 观察守卫（VS Code 无 CLI maybeRefillAsync 等价空转环——refillPool
 *  同步 settle/cancel 驱动——停滞态无未来事件——检测只挂观察面——结构差异——见 actions 侧）。
 */
export function detectStall(parent) {
  const map = poolMap(parent)
  const queued = [...map.values()].filter((e) => e.status === "queued")
  if (queued.length < 2) return null
  for (const e of map.values()) {
    if (e.status === "running") return null // running 锚点——settle 驱动未来事件——合法等待（含正常依赖链）
  }
  const lines = []
  for (const e of queued) {
    const auto = e._auto?.() ?? false
    const wait = [] // blocker 逐条（同 describeBlockers 序：依赖先、域冲突后）
    for (const depId of e._dependsOn ?? []) {
      const info = depInfo(parent, depId)
      if (info.state === "pending" || info.state === "unknown") {
        wait.push({ key: idNum(depId), label: `${info.role ?? "sub"}#${depId}`, reason: "依赖未完成" })
      } else if ((info.state === "cancelled" || info.state === "failed") && !auto) {
        return null // dep-cancelled——外部决策可解（cancel/AUTO）——不判停滞
      }
    }
    const myFiles = e._files ?? []
    if (myFiles.length > 0) {
      for (const o of map.values()) {
        if (o === e) continue
        if (o.status !== "running" && o.status !== "queued") continue
        // §21.1 D-SL1 序判定（与 queueRunnable/describeBlockers 同款）：后入者（queued 且 id
        // 晚于当前任务）不阻断；running 已被锚点守卫排除——停滞闭包内的域 blocker 必为先入者。
        if (o.status === "queued" && Number(o.id) > Number(e.id)) continue
        const hit = filesOverlap(myFiles, o._files ?? [])
        if (!hit) continue
        wait.push({ key: idNum(o.id), label: `${o.role ?? "sub"}#${o.id}`, reason: `域冲突 ${showFile(parent, hit)}——先入者` })
      }
    }
    if (wait.length === 0) return null // 无 blocker 的 queued——refill 必启动（不可达态——∅ ⊆ 防误报）
    for (const b of wait) {
      if (!queued.some((q) => idNum(q.id) === b.key)) return null // blocker 外逃 queued 集——合法等待
    }
    for (const b of wait) lines.push(`${e.role ?? "sub"}#${e.id} → ${b.label}（${b.reason}）`)
  }
  return { chains: lines }
}

/** §21.1 P-SL2 停滞错误文案（status stall 字段用——单点事实——含链 + cancel
 *  破环重派引导——英文定稿——§21.1 D-SL1 报错风格对齐）。 */
export function stallErrorText(chains) {
  return `async subagent pool stalled — no running task and every queued task's blockers sit inside the queued set (mixed dependsOn × files-domain wait cycle — nothing will settle on its own). Blocking chains: ${chains.join("; ")}. Cancel one task in a chain (action:'cancel') to break the deadlock, then re-dispatch the rest (AGENT-LOOP.md §21.1 P-SL2)`
}


/** 补位扫描（settle/cancel 释放点共用）：最早可启动（依赖全满足 + 域无冲突 + **该条目的
 *  角色域有槽**）→ 启动到该域槽满（§24 D-24a——分池语义：扫描跳过域已满的 queued——
 *  他域腾槽不得启动本域条目——跨域不互等不互占）。纯 slot 队列与旧队首语义等价（单域
 *  视图下全部可启动 → 最早 == 队首）。条目留池（status → running——queued 过滤自然出列）；
 *  autoFor：条目级 AUTO 活读器。 */
export function refillPool(parent, autoFor = null) {
  const map = poolMap(parent)
  const { limits } = effectivePoolLimits(parent)
  for (;;) {
    const runningBy = runningByDomain(map)
    let pick = null
    for (const e of map.values()) {
      if (e.status !== "queued") continue
      const dom = entryDomain(e)
      if (runningBy[dom] >= limits[dom]) continue // 本域槽满——跳（他域释放不启动本域条目）
      if (queueRunnable(parent, e, autoFor?.(e) ?? false)) { pick = e; break }
    }
    if (!pick) return
    pick.start()
  }
}

/**
 * §24 D-24a（AGENT-LOOP.md §24——R14 角色分池——2026-09-06）：角色域映射单一事实源。
 * role ∈ {eng-coder} → "engCoder" 池；其余（explore/plan/coder + 本端无 "sub" 角色——
 * 未知角色防御）→ "other" 池。池容量默认 ASYNC_POOL_LIMITS（engCoder 4 + other 4——
 * 用户裁定"eng-coder 四路，其他 4 路"）。VS Code 角色枚举 = explore/plan/coder/eng-coder
 * （modeRoleField——subagent.mjs）；consult/escalate 非池角色不经过此面。
 */
export function entryDomain(entry) {
  return entry?._poolDomain ?? (entry?.role === "eng-coder" ? "engCoder" : "other")
}

/** 运行中计数按域分别记（running 判定按域过滤——§24 D-24a）。 */
export function runningByDomain(map) {
  const out = { engCoder: 0, other: 0 }
  for (const e of map?.values() ?? []) {
    if (e.status !== "running") continue
    out[entryDomain(e)]++
  }
  return out
}

/** 池容量默认（§24 D-24a——单常量 ASYNC_SUBAGENT_LIMIT 改为按角色域配置；常量保留
 *  re-export 兼容（tests/prompts import 面——值 4 = 单域默认）。 */
export const ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }

/**
 * §24 D-24a 配置读取（运行期读——每次入池判定时调用——变更即生效下个 spawn）：
 * config.agent.poolLimits = { engCoder, other }——单对象配置键（②-1 A）。校验：每键
 * 正整数 ≥1（timeoutMs 先例）；非法/缺失/形状错 → 该键回退默认 4（全非法 → 4/4）。
 * 返回 { limits, warnings }——warnings 携带非法键文案（spawn 结果注记——T-24a4 文案面；
 * 引擎内部消费只取 limits）。
 */
export function effectivePoolLimits(parent) {
  const raw = parent?.config?.agent?.poolLimits
  const warn = []
  const out = { engCoder: ASYNC_POOL_LIMITS.engCoder, other: ASYNC_POOL_LIMITS.other }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const key of ["engCoder", "other"]) {
      const v = raw[key]
      if (v !== undefined && v !== null) {
        if (Number.isInteger(v) && v >= 1) out[key] = v
        else warn.push(`agent.poolLimits.${key}=${JSON.stringify(v)} invalid (positive integer ≥1 required) — falling back to ${ASYNC_POOL_LIMITS[key]}`)
      }
    }
  } else if (raw !== undefined && raw !== null) {
    warn.push(`agent.poolLimits=${JSON.stringify(raw)} invalid (object { engCoder, other } required) — falling back to defaults 4/4`)
  }
  return { limits: out, warnings: warn }
}

/** 机械并发上限（§24 D-24a 前语义——单域全局上限 4——历史断言/导入面兼容：
 *  subagent-async.mjs/spawn 判定已改按域；本常量保留为单域默认值语义）。 */
export const ASYNC_SUBAGENT_LIMIT = ASYNC_POOL_LIMITS.engCoder

/** §20 D-SD3b 排队行刷新（webview 行通道——CLI ⟦ev⟧queued 等价）：全 queued 条目重算
 *  等待态 + 位置（Map 序——cancel 出列自然前移）——sig 变化才发（去重）。调用点 = 一切
 *  队列突变与等待态变迁（入队/settle 后补位与依赖转移/cancel 出队/自动送达消费）。 */
export function refreshQueuedRows(parent) {
  const map = poolMap(parent)
  let pos = 0
  for (const e of map.values()) {
    if (e.status !== "queued") continue
    pos++
    const blk = describeBlockers(parent, e, e._auto?.() ?? false)
    const sig = `${blk.kind}\x1e${pos}\x1e${blk.detail}`
    if (e._lastQueuedSig === sig) continue
    e._lastQueuedSig = sig
    const payload = { id: e.id, role: e.role, status: "queued", position: pos }
    if (blk.kind !== "slot") {
      payload.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      payload.reason = blk.detail
    }
    e._queueNotify?.(payload)
  }
}

/**
 * 分配下一子代理 id——跨 runAgent 单调（advisor fix #1，2026-09-03）：agent 对象
 * （_subIdCounter）per-run 重建，async 池沿 history._asyncSubagents 存活——无池内
 * 最大 id 续号则后续 run 会复用仍在跑的条目 id（map.set 覆盖旧条目：静默丢报告 +
 * status/cancel 错址）。spawn 路径（subagent.mjs）、escalate action、async-advisor 池
 * （advisor-async.mjs——§24 D-24b）共用——LIVES HERE（2026-09-06）：自 subagent-async
 * 迁入叶子模块——advisor-async 无环单向取号。
 * §24 D-24b：续号同时跨 subagent 池与 advisor 池（两池条目共用 webview 行 map 的 id
 * 命名空间——全局唯一防行覆盖）。
 * §27.1 F4（2026-09-07 三缺陷修复批——缺陷②）：计数器载体改 `parent.history ?? parent`
 * （_engAuditSpawns 同款先例——expando 不进会话文件）——撞 turn 上限 AUTO 续跑
 * agent 对象重建（_subIdCounter 归零）后 id 继续递增——不再复用已冻结频道标签
 * （explore#1 复用洞）；挂起期用户回合冻结频道 id 复用同时消除。 */
export function nextSubagentId(parent) {
  const holder = parent.history ?? parent // §27.1 F4: 计数器跨 resume 持久化载体
  let poolMax = 0
  for (const pool of [parent._asyncSubagents, parent._asyncAdvisors]) {
    if (!pool || pool.size === 0) continue
    for (const k of pool.keys()) {
      const n = typeof k === "number" ? k : Number.parseInt(k, 10)
      if (Number.isFinite(n) && n > poolMax) poolMax = n
    }
  }
  const next = Math.max(holder._subIdCounter ?? 0, poolMax) + 1
  holder._subIdCounter = next
  return next
}

/** 依赖某 id 的 queued 条目标签（D-SD5 提醒/工具结果注记——依赖者列表）。 */
export function dependentLabels(parent, depId) {
  const key = String(depId)
  const out = []
  for (const e of poolMap(parent).values()) {
    if (e.status !== "queued") continue
    if ((e._dependsOn ?? []).some((d) => String(d) === key)) out.push(`${e.role}#${e.id}`)
  }
  return out
}

/** §20 D-SD5 环防御（round2 #5——自然流程不可达（unknown id 拒 + spawn 序天然无环）——
 *  人工注入可达环拒——防御断言——T-SD5）：从新 spawn 依赖集沿池内条目 _dependsOn 边
 *  做路径 DFS——路径重复访问（可达环）→ 明确错误。 */
export function assertNoDepCycle(parent, dependsOn) {
  const edges = new Map()
  for (const e of poolMap(parent).values()) {
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
  for (const d of dependsOn) visit(String(idNum(d)))
}

/** Current 1-based queue position of a queued entry (map insertion order == FIFO queue order). */
export function queuePosition(map, target) {
  let pos = 0
  for (const entry of map.values()) {
    if (entry.status !== "queued") continue
    pos++
    if (entry === target) return pos
  }
  return pos
}
