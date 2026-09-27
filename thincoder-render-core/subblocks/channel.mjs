/**
 * channel.mjs — 子代理频道键判据族（核化 `webview/activity.js` 的**键文法 / 成员表 / 判据**
 * 纯函数面——判定表 §3 行 4「拆」的判据半）。**零 DOM 零宿主**（平 node 直测）。
 *
 * 成员：`parseChannel`（频道名 → {channel,label,role,id,model}）· `findBlockNames`（身份 → 键集）
 * · `terminalKindOf`（终态 status → 冻结 kind）· `terminalStubKind`（补桩精确成员表）·
 * `stubAllowed`（补桩前置）。迁移面（出生 / 接管 / 折叠 / 归档 + 内容出生闸）住 `state.mjs`。
 */

/** 频道名解析（逐字承 `activity.js:44-55`）：`sub:eng-coder#1` / `sub:consult glm-5.2 #4` →
 *  `{ channel, label, role, id, model }`（label = 去 `sub:` 前缀）。 */
export function parseChannel(name) {
  const channel = String(name ?? "")
  const label = channel.startsWith("sub:") ? channel.slice(4) : channel
  const m = /^sub:(explore|plan|coder|eng-coder|eng-designer|advisor)#(\d+)$/.exec(channel)
  if (m) return { channel, label, role: m[1], id: Number(m[2]), model: null }
  const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)
  if (c) return { channel, label, role: c[1], id: Number(c[3]), model: c[2] } // CLI 形态残留（不作判据）
  // 键文法单源（2026-09-19——核 `relay-prefix.mjs` `[\w-]+#\d+`；consult / escalate 端侧键不含模型段）
  const g = /^sub:([\w-]+)#(\d+)$/.exec(channel)
  if (g) return { channel, label, role: g[1], id: Number(g[2]), model: null }
  return { channel, label, role: null, id: null, model: null }
}

/** 命中一个子代理身份的块名集（逐字承 `activity.js:59-68` `blockNamesFor`；list 版）：
 *  消息字段 role/id 及——consult 键嵌模型——model/sessionId。查键用——绝不建块。 */
export function findBlockNames(list, role, id, model, sessionId) {
  if (role === "consult" && model != null && sessionId != null) {
    return [`sub:consult ${model} #${sessionId}`]
  }
  const out = []
  for (const b of list ?? []) {
    if (typeof b?.key !== "string") continue
    if (b.key.startsWith(`sub:${role}`) && b.key.endsWith(`#${id}`)) out.push(b.key)
  }
  return out
}

/** 终态 status → 冻结 kind（逐字承 `activity.js:343-349`）。null = 非终态。 */
export function terminalKindOf(status) {
  return status === "done" || status === "settled" ? "done"
    : status === "cancelled" ? "stopped"
    : status === "error" ? "error"
    : status === "answered" ? "done"
    : status === "terminated" ? "stopped"
    : status === "failed" ? "error"
    : null
}

/** 终态补桩判定（逐字承 `activity.js:233-243` §5.1.4 第 6 条——桩集**精确成员表**）：无 map
 *  条目时按表判定——返回折叠 kind（done/stopped/error）或 null（不补）。表内显式不补行：
 *  `answered`（有块折叠、无块 no-op）· `cancelled(was:"queued")`（从未启动不冻结）· 表外 status。 */
export function terminalStubKind(m) {
  switch (m.status) {
    case "done":
    case "settled": return "done"
    case "error": return "error"
    case "cancelled": return m.was === "queued" ? null : "stopped" // 运行中取消（含 was 缺省）→ 补桩
    case "terminated": return "stopped"
    case "failed": return "error"
    default: return null
  }
}

/** 终态补桩前置（逐字承 `activity.js:245-252` §5.3 终态必现收窄）：`id` 在 ∧ 角色段合法
 *  （`[\w-]+`）∧ 回读一致；不满足 → no-op + `drop-unknown-role`。 */
export function stubAllowed(m) {
  if (m.role == null || m.id == null) return false
  if (!/^[\w-]+$/.test(String(m.role))) return false
  const ch = parseChannel(`sub:${m.role}#${m.id}`)
  return ch.role === m.role && ch.id != null
}
