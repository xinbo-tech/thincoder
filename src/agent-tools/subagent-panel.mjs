/**
 * subagent-panel.mjs — subagent action:"panel" 执行器（§19.6——2026-09-08 自
 * subagent-actions.mjs 拆分——Module Split Policy：601 > 500 硬限跨档，§19.6 面板段
 * verbatim 迁入 + ASYNC-RESULT-CONTAINER.md D1/D2 落地（池 accessor getAsyncPool +
 * pending 单容器 _pendingAsyncResults 四族统一——escalate/consult 独立族退役））。
 * 内容：executePanelAction（D-P2——readonly 视图面 + 门控 freeze）+ panelFreezeGate
 * （D-P3 冻结门控）+ blockKeyIn（块归属判定随行）。
 * subagent-actions.mjs 尾部 re-export executePanelAction 保 subagent.mjs 既有 import 面。
 */
import { getAsyncPool } from "./async-settle.mjs"

/** 面板块 key（role#N）在池（Map——条目值）/pending 单容器（数组）中的归属判定。 */
function blockKeyIn(container, key) {
  const entries = container instanceof Map ? [...container.values()] : (container ?? [])
  return entries.some((e) => `${e.role}#${e.id}` === key)
}

/**
 * §19.6 D-P3 冻结门控（安全）：仅允许冻结 awaitingDigest 且池（_asyncSubagents/
 * _asyncAdvisors——经 getAsyncPool accessor——D1）无对应运行条目 + pending 单容器
 * （_pendingAsyncResults——D2）无对应条目的块（= 已消化驻留块——报告已入模型上下文
 * ——pending 已消费——状态滞后——补发冻结不破坏任何顺序）。
 * - pending 仍有对应（报告未达模型）→ 拒绝（提前回收破坏消化顺序——T-P3）
 * - 不存在的 key / 仍 running / done 的块 → 拒绝（T-P4——running 块 settle 时自冻）
 * - 无镜像 → 拒绝（headless/VS Code——freeze 不可用——T-P5）
 * 错误信息明确（模型可解释 + 自助修正）。返回 { ok:true } 或 { err }。
 */
function panelFreezeGate(agent, key) {
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    return { err: "panel unavailable — no CLI TUI panel mirror in this session (headless / VS Code / subagent contexts — freeze unavailable; panel is CLI-TUI-only, AC-P4)" }
  }
  const block = snap.find((b) => b.key === key)
  if (!block) {
    const live = snap.map((b) => `${b.key}(${b.status})`).join(", ")
    return { err: `unknown panel block key: ${key} — the live panel holds: ${live || "(no blocks)"}` }
  }
  if (block.status !== "awaitingDigest") {
    if (block.status === "done") {
      return { err: `block ${key} is already done — nothing to freeze; it was (or is about to be) reclaimed into the conversation by the freeze sweep at the turn end / settle (only digested-stuck awaitingDigest blocks need a manual freeze)` }
    }
    if (block.status === "running") {
      return { err: `block ${key} is still running — freeze only reclaims awaitingDigest blocks whose report is already digested; a running block freezes on its own settle (or stop it with action:'cancel' if it is a background async child)` }
    }
    return { err: `block ${key} is in state ${block.status} — freeze only reclaims awaitingDigest blocks whose report is already digested` }
  }
  if (blockKeyIn(getAsyncPool(agent, "subagent"), key) || blockKeyIn(getAsyncPool(agent, "advisor"), key)) {
    return { err: `block ${key} still has a live pool entry — it is NOT a digested-stuck block (freeze refused; status action shows the pool)` }
  }
  // ASYNC-RESULT-CONTAINER.md D2：pending 单容器（四族统一——原 escalate/consult
  // 独立族退役）。
  if (blockKeyIn(agent._pendingAsyncResults, key)) {
    return { err: `block ${key} is still genuinely awaiting digestion — its report is still pending and has NOT reached the model yet; freezing now would break the digestion order (wait for the digest run, which reclaims it automatically — §17.5.5)` }
  }
  return { ok: true }
}

/**
 * §19.6 subagent action:"panel"（D-P2——readonly 视图面 + 门控干预面——单动作双参，
 * freeze 优先）：
 * - view（缺省——返回镜像区块列表）：agent._panelSnapshot = TUI 面板镜像（块级
 *   状态变更点由 subagent-blocks syncPanelSnapshot 同步刷新——与用户所见一致——
 *   index.mjs 装配 state._agent）。awaitingDigest 条目**读时交叉**
 *   _pendingAsyncResults/池 标注 digested（round1 #3——digested:true
 *   = 报告已消化但块仍驻留——异常块——freeze 候选；模型可定位解释 UI 怪相）。
 * - freeze:key（D-P3 门控通过 → 发 key + "/" + ⟦ev⟧done 哨兵字面 token——
 *   onToken——TUI routeSubToken 冻结回收——落位复用 sub._freezeAt settle 锚点
 *   splice，无锚点尾推兜底——§17.5.5 同口径——round1 #2）。
 * 无镜像（headless/VS Code——D-P2 round1 #1：webview 无 state.subTasks 对应物——
 * 7.2.3.2 #8 先例）→ view 恒降级池视图（双池经 getAsyncPool + pending 单容器
 * 合成）+ no panel 注；freeze 报不可用。CLI-only 完整能力（AC-P4）。
 */
export function executePanelAction(args, ctx) {
  const agent = ctx.agent
  const freezeKey = (args?.freeze !== undefined && args?.freeze !== null && String(args.freeze) !== "")
    ? String(args.freeze)
    : null
  // ── freeze 面（优先——D-P2 单动作双参互斥）──
  if (freezeKey) {
    if ((ctx.depth ?? 0) > 0) {
      return JSON.stringify({ status: "error", error: "panel freeze is only available at depth 0 — a child agent has no panel of its own (AGENT-LOOP.md §19.6 D-P2)" })
    }
    const gate = panelFreezeGate(agent, freezeKey)
    if (gate.err) return JSON.stringify({ status: "error", error: gate.err })
    if (!ctx.callbacks?.onToken) {
      return JSON.stringify({ status: "error", error: `panel mirror present but no token relay in this context — the freeze of ${freezeKey} cannot reach the TUI` })
    }
    // 门控通过 → 发 done 冻结事件（settle 同机制字面格式——TUI routeSubToken done
    // 分支冻结回收——落位 _freezeAt settle 锚点 splice；无锚点（旧会话残留）时
    // freezeSubTaskLines 尾推兜底——注明两种落位，模型不被误导（advisor 🟡1）。
    ctx.callbacks.onToken(`${freezeKey}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    return JSON.stringify({
      key: freezeKey,
      status: "frozen",
      note: "done freeze event issued — the TUI reclaimed the block into the conversation (spliced at its settle anchor when one is recorded, else appended at the current stream end — §17.5.5 same-rule position)",
    })
  }
  // ── view 面（缺省——readonly）──
  // 双参互斥（D-P2）：freeze 优先；显式 view:false 且无 freeze = 无请求可执行——报错。
  if (args?.view === false) {
    return JSON.stringify({ status: "error", error: "panel has nothing to do — view:false with no freeze key; pass freeze:'role#N' to reclaim a digested-stuck block, or omit view (defaults to true)" })
  }
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    // F-P3 降级：无镜像（headless/VS Code/子代理上下文——CLI TUI-only 完整能力）→
    // 池视图（双池经 getAsyncPool——运行/排队条目 + pending 单容器待消化条目）
    const blocks = []
    const queue = agent._asyncQueue ?? []
    for (const e of [...(getAsyncPool(agent, "subagent")?.values() ?? []), ...(getAsyncPool(agent, "advisor")?.values() ?? [])]) {
      const b = { key: `${e.role}#${e.id}`, role: e.role }
      if (e.status === "running") {
        b.status = "running"
        b.elapsedSec = e.startedAt ? Math.max(0, Math.floor((Date.now() - e.startedAt) / 1000)) : 0
      } else if (e.status === "queued") {
        b.status = "queued"
        const qi = queue.indexOf(e)
        b.position = qi >= 0 ? qi + 1 : (e.position ?? null)
      } else {
        b.status = "done" // 回合内 settle 未取——自动通道（回合尾 collect/挂起 digest）送达
      }
      blocks.push(b)
    }
    // ASYNC-RESULT-CONTAINER.md D2：pending 单容器（四族统一——原 escalate/consult
    // 独立族退役）——族注记按 role 保留。
    for (const e of agent._pendingAsyncResults ?? []) {
      const note = e.role === "consult"
        ? "consultation digest pending — injected at the next run start (§25 D-R17a)"
        : e.role === "escalate"
          ? "report pending — injected at the next run start (§25 D-R17b)"
          : "report pending — injected at the next run start (§17)"
      blocks.push({ key: `${e.role}#${e.id}`, role: e.role, status: "awaitingDigest", note })
    }
    return JSON.stringify({
      degraded: true,
      note: "no panel — this session has no CLI TUI panel mirror (headless / VS Code / subagent context — panel view is CLI-TUI-only, AC-P4); pool-derived view below; action:'status' shows the full pool",
      panel: blocks,
    })
  }
  const panel = snap.map((b) => {
    const out = { key: b.key, role: b.role, status: b.status }
    if (b.status === "running") {
      out.elapsedSec = b.startedAt ? Math.max(0, Math.floor((Date.now() - b.startedAt) / 1000)) : 0
    } else if (b.status === "awaitingDigest") {
      // 读时交叉（round1 #3）：pending/池均无对应 = 报告已消化（注入即从两者移除）——
      // 块驻留 = 状态滞后——digested:true（freeze 候选——模型可定位异常块）。
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器参与比对（四族统一）。
      out.digested = !blockKeyIn(agent._pendingAsyncResults, b.key)
        && !blockKeyIn(getAsyncPool(agent, "subagent"), b.key) && !blockKeyIn(getAsyncPool(agent, "advisor"), b.key)
    }
    return out
  })
  return JSON.stringify({ panel })
}
