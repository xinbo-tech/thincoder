/**
 * subagent-panel.mjs — subagent action:"panel" 执行器（AGENT-LOOP-SUBAGENT.md §6.7.2——2026-09-08 自
 * subagent-actions.mjs 拆分——Module Split Policy：601 > 500 硬限跨档，AGENT-LOOP-SUBAGENT.md §6.7.2 面板段
 * verbatim 迁入 + ASYNC-RESULT-CONTAINER.md D1/D2 落地（池 accessor getAsyncPool +
 * pending 单容器 _pendingAsyncResults 四族统一——escalate/consult 独立族退役））。
 * 内容：executePanelAction（D-P2——readonly 视图面 + 门控 freeze）+ panelFreezeGate
 * （D-P3 冻结门控）+ blockKeyIn（块归属判定随行）。
 * CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）：手工面板镜像退役——视图面与门控改读时现算
 * computePanelBlocks(ctx.state)（ctx.state = agent._tuiState——TUI 装配处接线——单账本）；
 * 未挂载（headless/VSC/子代理）→ 现算返 null → 降级/报不可用照旧
 * （T-P5 语义零变）。门控语义零动（F-4）——仅数据源从镜像换现算。
 * **子代理面板批（2026-10-04 · `docs/desktop/design/PANEL-READBACK.md`）——回读源链**：数据源不再单源现算——
 * `readPanelSource(ctx)` = `ctx.readout()`（桌面渲染面实况快照——上报缓存读面）优先 ⇒ `ctx.state` 现算 ⇒
 * 二者皆空报不可用；视图面快照非空 ⇒ `{ source:"renderer", asOf, ageMs, panel[] }`（awaitingDigest 条读时
 * 交叉核池/pending 标 `digested`——与 CLI 面同判据）；freeze 门控两源同判（桌面块 `awaitingDigest`/`region` 为
 * 独立字段），键统一规范化（`sub:` 前缀剥除——**有意放宽且两端同宽**；发射键 = 规范化键，relay 文法不吃 `:`）。
 * subagent-actions.mjs 尾部 re-export executePanelAction 保 subagent.mjs 既有 import 面。
 */
import { getAsyncPool } from "./async-settle.mjs"
import { computePanelBlocks } from "./panel-blocks.mjs" // F-3：面板视图读时现算（单账本——核内纯函数，state 由调用方注入）

/** 面板块 key（role#N）在池（Map——条目值）/pending 单容器（数组）中的归属判定。 */
function blockKeyIn(container, key) {
  const entries = container instanceof Map ? [...container.values()] : (container ?? [])
  return entries.some((e) => `${e.role}#${e.id}` === key)
}

/** consult 子块键形态（#748）：`consult#<N>`（N = 子块 relay 号——会话条目 `childIds` 表元素同形）。 */
function consultChildKey(key) {
  const k = String(key ?? "")
  return k.startsWith("consult#") && !k.includes("/") && k.length > "consult#".length
}

/** consult 子块消费判读（#748——与回收 ∥ 补发判据同源）：会话在跑（`_consultSessions` 内未 stopped
 *  会话携该 relay 号）∥ 会话条目在 pending（`childIds` 携该号）⇒ **未消化**（报告未达模型——
 *  冻结 ∥ 回收即破坏消化顺序）。非 consult 子块键 ⇒ 恒 false。 */
function consultChildUndigested(agent, key) {
  if (!consultChildKey(key)) return false
  const id = String(key).slice("consult#".length)
  for (const s of agent?._consultSessions?.values() ?? []) {
    if (s.stopped !== true && (s.childIds ?? []).includes(id)) return true
  }
  for (const e of agent?._pendingAsyncResults ?? []) {
    if (e?.role === "consult" && (e.childIds ?? []).includes(id)) return true
  }
  return false
}

/**
 * 回读源链（子代理面板批 · 2026-10-04 · `PANEL-READBACK.md` §2.1/§2.3）：渲染面快照
 * （`ctx.readout()`——桌面实况回读上报；`{ blocks, receivedAt }`，块形 = 判别六键 + `role`/`id` 随行）优先
 * ∥ CLI 现算（`computePanelBlocks(ctx.state)`——F-3 单账本）∥ 二者皆空 ⇒ `null`（拒因照旧）。
 * 返回 `{ blocks, readout }`：`readout` 非空 = 桌面快照源（`awaitingDigest` / `region` 为块独立字段）。
 */
function readPanelSource(ctx) {
  const snapshot = typeof ctx.readout === "function" ? ctx.readout() : null
  if (snapshot && Array.isArray(snapshot.blocks)) return { blocks: snapshot.blocks, readout: snapshot }
  const snap = computePanelBlocks(ctx.state)
  return Array.isArray(snap) ? { blocks: snap, readout: null } : null
}

/** 键归一（**有意放宽且两端同宽**——§2.3）：`sub:` 前缀剥除后比对（桌面块键 `sub:role#id` ∥ CLI 块键
 *  `role#id` 两写法皆接受）；命中后比对与发射全用规范化键（relay 前缀文法 `^\w-+#\d+/` 不吃 `:`）。 */
function normalizePanelKey(key) {
  const k = String(key ?? "")
  return k.startsWith("sub:") ? k.slice("sub:".length) : k
}

/** 两源同判——等待消化：CLI 块 = 现算 status 位；桌面块 = 判别键 `awaitingDigest`。 */
function awaitingOf(src, block) {
  return src.readout ? block.awaitingDigest === true : block.status === "awaitingDigest"
}

/** 活态标签（live 列表 ∥ 拒因文案共用）：桌面块把 awaiting 态折进 status 位（与 CLI 现算同形）。 */
function liveStatusOf(src, block) {
  return awaitingOf(src, block) ? "awaitingDigest" : String(block.status ?? "unknown")
}

/** 桌面回读条目（视图面——判别六键 + `role`/`id` 随行；awaitingDigest 条读时交叉核池/pending 标 `digested`
 *  —— 判据与 CLI 面同源；consult 子块按消费判据——键经归一后入判）。 */
function readoutPanelEntry(agent, block) {
  const key = normalizePanelKey(block.key)
  const out = {
    key: block.key,
    role: block.role ?? null,
    id: block.id ?? null,
    status: block.status ?? null,
    frozen: block.frozen === true,
    awaitingDigest: block.awaitingDigest === true,
    region: block.region === "flow" ? "flow" : "activity",
    dom: block.dom === true,
  }
  if (out.awaitingDigest) {
    out.digested = consultChildKey(key)
      ? !consultChildUndigested(agent, key)
      : !blockKeyIn(agent._pendingAsyncResults, key)
        && !blockKeyIn(getAsyncPool(agent, "subagent"), key) && !blockKeyIn(getAsyncPool(agent, "advisor"), key)
  }
  return out
}

/**
 * AGENT-LOOP-SUBAGENT.md §6.7.2 D-P3 冻结门控（安全）：仅允许冻结 awaitingDigest 且池（_asyncSubagents/
 * _asyncAdvisors——经 getAsyncPool accessor——D1）无对应运行条目 + pending 单容器
 * （_pendingAsyncResults——D2）无对应条目的块（= 已消化驻留块——报告已入模型上下文
 * ——pending 已消费——状态滞后——补发冻结不破坏任何顺序）。
 * - 数据源 = **回读源链**（子代理面板批 · 2026-10-04）：`ctx.readout`（桌面渲染面快照——块判别键
 *   `awaitingDigest`/`region` 独立字段）优先 ∥ `ctx.state` 现算；命中后比对与发射全用**规范化键**
 *   （`sub:` 前缀剥除——有意放宽且两端同宽，§2.3）。
 * - pending 仍有对应（报告未达模型）→ 拒绝（提前回收破坏消化顺序——T-P3）
 * - 不存在的 key / 仍 running / done 的块 → 拒绝（T-P4——running 块 settle 时自冻）
 * - 无面板（两源皆空）→ 拒绝（headless/VS Code——freeze 不可用——T-P5）
 * - 已入流（桌面快照 `region:"flow"`——已归档）→ 追加拒因（无卡可收；CLI 源无该字段 ⇒ 零改）
 * - consult 子块（#748）：会话在跑 ∥ 会话条目在 pending（`childIds` 携该号）→ 拒绝（同判据——与回收 ∥ 补发同源）
 * 错误信息明确（模型可解释 + 自助修正）。返回 `{ ok:true, renderer }` 或 `{ err }`。
 */
function panelFreezeGate(ctx, key) {
  const src = readPanelSource(ctx)
  if (src === null) {
    return { err: "panel unavailable — no CLI TUI panel in this session (headless / VS Code / subagent contexts — freeze unavailable; panel is CLI-TUI-only, AC-P4)" }
  }
  const want = normalizePanelKey(key)
  const block = src.blocks.find((b) => normalizePanelKey(b.key) === want)
  if (!block) {
    const live = src.blocks.map((b) => `${b.key}(${liveStatusOf(src, b)})`).join(", ")
    return { err: `unknown panel block key: ${key} — the live panel holds: ${live || "(no blocks)"}` }
  }
  // 已入流 = 已归档（桌面快照判别键）——无卡可收（CLI 源无 region 字段 ⇒ 零改）。
  if (src.readout && block.region === "flow") {
    return { err: `block ${want} is already in the conversation flow (region "flow") — it has been archived; there is nothing left to freeze` }
  }
  if (!awaitingOf(src, block)) {
    const status = String(block.status ?? "unknown")
    if (status === "done") {
      return { err: `block ${want} is already done — nothing to freeze; it was (or is about to be) reclaimed into the conversation by the freeze sweep at the turn end / settle (only digested-stuck awaitingDigest blocks need a manual freeze)` }
    }
    if (status === "running") {
      return { err: `block ${want} is still running — freeze only reclaims awaitingDigest blocks whose report is already digested; a running block freezes on its own settle (or stop it with action:'cancel' if it is a background async child)` }
    }
    return { err: `block ${want} is in state ${status} — freeze only reclaims awaitingDigest blocks whose report is already digested` }
  }
  if (blockKeyIn(getAsyncPool(ctx.agent, "subagent"), want) || blockKeyIn(getAsyncPool(ctx.agent, "advisor"), want)) {
    return { err: `block ${want} still has a live pool entry — it is NOT a digested-stuck block (freeze refused; status action shows the pool)` }
  }
  // ASYNC-RESULT-CONTAINER.md D2：pending 单容器（四族统一——原 escalate/consult
  // 独立族退役）。#748：consult 子块键不经裸键比对（会话条目键 `consult#<sessionId>` 与
  // 子块键可数字撞键）——改判消费判据（会话在跑 ∥ 会话条目在 pending——与回收 ∥ 补发同源）。
  if (!consultChildKey(want) && blockKeyIn(ctx.agent._pendingAsyncResults, want)) {
    return { err: `block ${want} is still genuinely awaiting digestion — its report is still pending and has NOT reached the model yet; freezing now would break the digestion order (wait for the digest run, which reclaims it automatically)` }
  }
  if (consultChildUndigested(ctx.agent, want)) {
    return { err: `block ${want} belongs to a consultation whose digest has not been consumed — the session is still running, or its session entry is still pending (freeze refused; the block is reclaimed at the consumption window)` }
  }
  return { ok: true, renderer: src.readout !== null }
}

/**
 * AGENT-LOOP-SUBAGENT.md §6.7.2 subagent action:"panel"（D-P2——readonly 视图面 + 门控干预面——单动作双参，
 * freeze 优先）：
 * - view（缺省——返回面板块列表）：**回读源链**（子代理面板批 · 2026-10-04）：渲染面快照非空 ⇒
 *   `{ source:"renderer", asOf, ageMs, panel[] }`（判别六键 + role/id 随行；awaitingDigest 条读时交叉
 *   核池/pending 标 `digested`）∥ 快照空 ⇒ 现链回落——ctx.state（= agent._tuiState——CLI TUI 装配）经
 *   computePanelBlocks **读时现算**（F-3 单账本——与用户所见一致），awaitingDigest 条目**读时交叉**
 *   _pendingAsyncResults/池 标注 digested（round1 #3——digested:true = 报告已消化但块仍驻留——异常块——
 *   freeze 候选；模型可定位解释 UI 怪相）。
 * - freeze:key（D-P3 门控通过 → 发 key + "/" + ⟦ev⟧done 哨兵字面 token——onToken——TUI routeSubToken
 *   冻结回收 ∥ 桌面经桥 relay ⇒ 渲染面归档机入流 + record——同字面、零新消费者；发射 = 规范化键。
 *   落位复用 sub._freezeAt settle 锚点 splice，无锚点尾推兜底——AGENT-LOOP-ASYNC-POOL.md §6.8 同口径——round1 #2）。
 * 两源皆空（headless/VS Code——D-P2 round1 #1：webview 无 state.subTasks 对应物——7.2.3.2 #8 先例）
 * → view 恒降级池视图（双池经 getAsyncPool + pending 单容器合成）+ no panel 注；freeze 报不可用。
 * CLI-only 完整能力（AC-P4）。
 */
export function executePanelAction(args, ctx) {
  const agent = ctx.agent
  const freezeKey = (args?.freeze !== undefined && args?.freeze !== null && String(args.freeze) !== "")
    ? String(args.freeze)
    : null
  // ── freeze 面（优先——D-P2 单动作双参互斥）──
  if (freezeKey) {
    if ((ctx.depth ?? 0) > 0) {
      return JSON.stringify({ status: "error", error: "panel freeze is only available at depth 0 — a child agent has no panel of its own" })
    }
    const gate = panelFreezeGate(ctx, freezeKey)
    if (gate.err) return JSON.stringify({ status: "error", error: gate.err })
    const panelKey = normalizePanelKey(freezeKey)
    if (!ctx.callbacks?.onToken) {
      return JSON.stringify({ status: "error", error: `panel present but no token relay in this context — the freeze of ${panelKey} cannot reach the TUI` })
    }
    // 门控通过 → 发 done 冻结事件（settle 同机制字面格式——TUI routeSubToken done
    // 分支冻结回收——落位 _freezeAt settle 锚点 splice；无锚点（旧会话残留）时
    // freezeSubTaskLines 尾推兜底——注明两种落位，模型不被误导（advisor 🟡1）。
    // 桌面（回读源）：同字面经桥 relay 分流 ⇒ 渲染面归档机（归档入流 + record）——零新消费者；
    // 发射键 = 规范化键（`sub:` 前缀不入 relay 文法——§2.3）。
    ctx.callbacks.onToken(`${panelKey}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    return JSON.stringify({
      key: panelKey,
      status: "frozen",
      note: gate.renderer
        ? "done freeze event issued — the desktop renderer reclaimed the block into the conversation flow (archived there, record appended)"
        : "done freeze event issued — the TUI reclaimed the block into the conversation (spliced at its settle anchor when one is recorded, else appended at the current stream end — same-rule position)",
    })
  }
  // ── view 面（缺省——readonly）──
  // 双参互斥（D-P2）：freeze 优先；显式 view:false 且无 freeze = 无请求可执行——报错。
  if (args?.view === false) {
    return JSON.stringify({ status: "error", error: "panel has nothing to do — view:false with no freeze key; pass freeze:'role#N' to reclaim a digested-stuck block, or omit view (defaults to true)" })
  }
  // 回读源链（子代理面板批 · 2026-10-04 · `PANEL-READBACK.md` §2.1）：渲染面快照非空 ⇒ 实况回读面
  // （判别六键 + role/id 随行 + awaitingDigest 读时交叉；asOf/ageMs 携龄——不设截断，卡留块状态恒定）。
  const readout = typeof ctx.readout === "function" ? ctx.readout() : null
  if (readout && Array.isArray(readout.blocks)) {
    return JSON.stringify({
      source: "renderer",
      asOf: readout.receivedAt ?? null,
      ageMs: typeof readout.receivedAt === "number" ? Math.max(0, Date.now() - readout.receivedAt) : null,
      panel: readout.blocks.map((b) => readoutPanelEntry(agent, b)),
    })
  }
  const snap = computePanelBlocks(ctx.state)
  if (!Array.isArray(snap)) {
    // F-P3 降级：无 TUI state（headless/VS Code/子代理上下文——CLI TUI-only 完整能力）→
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
        ? "consultation digest pending — injected at the next run start"
        : e.role === "escalate"
          ? "report pending — injected at the next run start"
          : "report pending — injected at the next run start"
      blocks.push({ key: `${e.role}#${e.id}`, role: e.role, status: "awaitingDigest", note })
    }
    return JSON.stringify({
      degraded: true,
      note: "no panel — this session has no CLI TUI panel (headless / VS Code / subagent context — panel view is CLI-TUI-only, AC-P4); pool-derived view below; action:'status' shows the full pool",
      panel: blocks,
    })
  }
  const panel = snap.map((b) => {
    const out = { key: b.key, role: b.role, status: b.status }
    if (b.status === "running") {
      out.elapsedSec = b.startedAt ? Math.max(0, Math.floor((Date.now() - b.startedAt) / 1000)) : 0
    } else if (b.status === "awaitingDigest") {
      // 读时交叉（round1 #3）：pending/池均无对应 = 报告已消化（fallback 面注入即从两者移除；
      // 会话面注入后不随即移除——留容器至销账 / 升级，移除 = `accountDigestRound` 的 splice；§6.31）——
      // 块驻留 = 状态滞后——digested:true（freeze 候选——模型可定位异常块）。
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器参与比对（四族统一）。
      // #748：consult 子块按消费判据（会话在跑 ∥ 会话条目在 pending ⇒ 未消化）——与门控同源。
      out.digested = consultChildKey(b.key)
        ? !consultChildUndigested(agent, b.key)
        : !blockKeyIn(agent._pendingAsyncResults, b.key)
          && !blockKeyIn(getAsyncPool(agent, "subagent"), b.key) && !blockKeyIn(getAsyncPool(agent, "advisor"), b.key)
    }
    return out
  })
  return JSON.stringify({ panel })
}
