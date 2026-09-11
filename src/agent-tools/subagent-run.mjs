/**
 * subagent-run.mjs — runChild: 子代理 runAgent 闭环执行体（阻塞 spawn 的 await 路径 +
 * async 池条目的池挂载执行体——subagent-async.mjs spawnAsyncSubagent 以 entry 调用）。
 * 2026-09-08 结构债批 6 拆分（VSC subagent.mjs 508 > 500 硬限——切法 A——CLI 同名模块
 * 对齐，名对齐非内容镜像：CLI subagent-run.mjs = executeAsyncSpawn）：本体自 subagent.mjs
 * 巨型闭包迁出——原闭包自由变量收编参数对象（parent/ctx/cwd/runAgent/role/subId/
 * maxTurns/childInput/provider/designId/task/asyncFlag/childSignal——runAgent/agentMod
 * 保持动态 import 破环机制：agentMod 在体内，runAgent 经参数传入）——执行体 verbatim
 * 迁移零行为变化。runChild 原文件内私有（非导出）——零消费面影响（subagent.mjs 是唯一
 * 调用方——经 runChildFor 包装保持原调用形态）。mergeChildMutations/shouldAutoResume
 * 随迁导入（原自 subagent-async.mjs 导入于 subagent.mjs——引用面无环：subagent-async 不
 * import 本模块——runChild 由调用方以参数传入池条目）。
 */
import { shouldAutoResume, mergeChildMutations } from "./subagent-async.mjs"
import { applyTurnFrame } from "../agent/run-helpers.mjs"
import { makeChildPermission } from "./child-permission.mjs" // §18 C-2：child 权限通道（2026-09-12）

export async function runChild(entry, { parent, ctx, cwd, runAgent, role, subId, maxTurns, childInput, provider, designId, task, asyncFlag, childSignal, batchDoc = null }) {
      let output = ""
      const sink = {}
      const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:${role}#${subId}`, chunk)
      // §19.5 D-M8 nested sub-attribution（webview 子标同构）：本箭头 = 子代理 ctx 的
      // onToolPanel 转发点——内层频道名若又是嵌套 spawn 频道（"sub:explore#N"——eng-coder
      // 内审计 explore 的 runChild panel 绑定）则附加到 chunk（chunk.sub = 去 "sub:" 的
      // 段标，如 "explore#1"）→ webview 渲染块内行首 dim 子标 span；事件类内层名（advisor
      // 等）不附加——按既有语义折叠进本子代理块（§18 T-E18 不变）。字符串 chunk（legacy
      // 形态）归一化为对象。
      const forward = (name, chunk) => {
        if (typeof name === "string" && name.startsWith("sub:")) {
          const c = typeof chunk === "string" ? { kind: "text", text: chunk } : { ...chunk }
          // 单跳归属（审计 F3 注）：当前嵌套深度上限 = 2（main → eng-coder → explore——
          // explore 无 subagent 工具）——chunk.sub 只承载一跳。若未来开放更深嵌套，
          // 此处在既有 c.sub 上叠加段路径（"explore#1/…"）而非覆盖。
          c.sub = name.slice(4)
          panel(c)
        } else {
          panel(chunk)
        }
      }
      const agentMod = await import("../agent.mjs")
      // §17 D-S8 冻结门控: an ASYNC child that settles while the suspension session is
      // active reports "settled" (block stays live as "done · awaiting digestion");
      // the pool-drain freeze at session exit later reports the terminal collapse.
      // SYNC children settle inline inside their turn — the caller consumes the result
      // directly, so their terminal notification stays "done" regardless of suspension.
      const terminalStatus = () => (asyncFlag && parent.history?._suspended === true ? "settled" : "done")
      const baseOpts = {
        depth: 1, role, maxTurns,
        streamOutput: true, // exempt from the agent.mjs onToken depth gate (escalate parity)
        // D5 (2026-09-08): 单值镜像 _engDesignToken 已退役——child 只带 engineering 模式标志
        //（eng-coder child 已由 engDesignReviewed 预授权；其自身不签发/spawn eng-coder——无需 token）。
        engState: { enabled: parent.config?.agent?.engineering ?? false },
        // §18 D-E3 task-domain authorization (spawn-time): the design token was
        // verified above — approved design + spawn task = authorization for the
        // child's writes. The stage exemption belongs to the eng-coder only (C-3: its
        // autoApprove stays true — that child never pops a per-write panel); every other
        // role now inherits the live AUTO flag instead (C-3 below). The exemption is
        // stage-limited by construction: JSON parse / unknown tool / planMode /
        // design-token gates run BEFORE the permission stage in execute-tools and stay
        // fully effective (T-E14).
        engDesignReviewed: role === "eng-coder", // token verified above → child may write files
        // §2.22.3（第 5 批）：批次档绑定随 run opts 进 setup（→ `agent._batchDoc`，batch_segment 取用）。
        batchDoc,
        // §18 D-E2 ③: the eng-coder's own spawn task rides the child as the verbatim
        // source for its audit task book (mechanical — never self-written).
        ...(role === "eng-coder" ? { engTaskInput: task } : {}),
        stateSink: sink,
        // SUBAGENT-OBSERVE-SEND.md D2（2026-09-08）：注入队列消费回调——子 runAgent 主循环
        // 每回合头调它，把父 send 入队的 _injected 清空取回 → 作普通 user 回合入子历史。仿
        // stateSink 作为新回调传给子 runAgent（延迟语义：mid-LLM-await 入队——下回合头才消费
        //——非即时——评审 #3）。entry 为 null（sync 路径）无池条目 → 无可注入。
        turnInput: entry ? () => ((entry._injected?.length ?? 0) > 0 ? entry._injected.splice(0) : []) : null,
      }
      // Turn-cap continue loop (escalate parity): hitting the cap asks the user through
      // the panel's question card — unlimited continues, each with a fresh budget and the
      // child's own history (resume:true, opts.history=sink.history). Declined / headless
      // (no onQuestion) → partial-work return. ASYNC children never pop a continue panel
      // (§15 D-A3): auto-decline, except engineering && AUTO, which auto-resumes — see the
      // ContinueError branch below (§18 D-E2 cap fallback for the default-async eng-coder).
      // 段间累计（TURN-CAP-CONTINUE §19.3 消费侧义务）：循环局部「段前累计」——循环外
      // 声明、跨续跑迭代存活；onAgentTurn 每轮更新为最新帧第一参（entry 路径与 entry.turn
      // 同点同值；sync 路径 entry 空、由同一局部量覆盖）——续跑段以此回传段间种子（本端子
      // 代理面每段 = 新 agent 对象，累计经 opts 而非对象字段）。
      let turnBase = 0
      for (let resume = false; ; resume = true) {
        try {
          // §19.5 D-M6: async 条目持条目级 controller signal（cancel 定向 abort——只停该
          // 条目）；sync 路径（无 entry）保持共享 signal（childSignal）原样（既有语义）。
          const childSig = entry ? (entry.controller?.signal ?? childSignal) : childSignal
          // §18 C-2（child permission gate）：写权 child（coder/eng-designer）手动档挂父面板
          // 权限通道——owner 归属 + 定向 signal（⏹/cancel 释放）；eng-coder 保持零弹卡（C-3
          // 恒真 autoApprove 不达权限阶段）、explore/plan 只读不配通道；无父通道（headless/
          // AUTO 构建期）→ helper 返 null → 省略该键（静默直通——T-CP15）。
          const childPermission = (role === "coder" || role === "eng-designer")
            ? makeChildPermission({ ctx, id: subId, role, model: provider?.model ?? null, signal: childSig })
            : null
          const result = await runAgent(provider, cwd, childInput, {
            onToken: (t) => { output += t; panel({ kind: "text", text: t }) },
            onReasoning: (r) => panel({ kind: "think", text: r }),
            onToolCall: (name, args) => {
              // §19/§19.5 当前工具捕获（SUBAGENT-OBSERVE-SEND.md 评审 #2——2026-09-08）：
              // 在流式回调处顺手记最后工具名+args 单字段进池条目——observe 读它当"当前工具"
              //（判推进 vs 卡死——卡在哪个工具上一眼可见）。args 截断（N2——非全量）。
              if (entry) entry._currentTool = { name, args: (JSON.stringify(args) || "").slice(0, 200) }
              // §14 C-11①：结构化 tool/cmd（webview 块头 `${tool} — ${cmd ≤60}`；无 cmd 仅 tool）
              panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120), tool: name, cmd: typeof args?.command === "string" ? args.command : undefined })
            },
            onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
            // §18 visibility (2026-09-03 可见性补齐, CLI parity — 两边都修): the child's
            // ctx.callbacks.onToolPanel (advisor long-form stream, advisor.mjs:142-144;
            // nested-spawn activity) was empty here — runChild forwarded only
            // onToken/onReasoning/onToolCall/onToolResult, so the §18 in-child advisor
            // review was silently dropped (user saw just the advisor tool line + the
            // 80-char result line). Forward VERBATIM into the child's OWN sub-block
            // channel: chunk kinds (think/tool/text/start) and the same-kind merge
            // semantics pass through untouched (webview appendAdvisorChunk) — never the
            // CLI TUI's per-chunk line breaks.
            // §19.5 D-M8: nested spawn channels (sub:*) additionally ride a sub-label
            // (see forward above) — inner-child activity rows become distinguishable
            // inside the outer block.
            onToolPanel: forward,
            // §19.5 D-M5 turn sync: per-child per-turn hook — the pool entry's turn count
            // (status decision field) tracks the child's progress live (CLI ⟦ev⟧turn
            // 解析的 VS Code 等价——agent.mjs 每轮迭代调 callbacks.onAgentTurn)。
            // §19.5.6 D-SF1: bind the child AGENT object reference (setup.mjs puts it on
            // stateSink once runAgent's setup finishes — earliest live moment). Status
            // re-reads childAgent._touchedFiles real-time; a resume re-runs setup and the
            // sink.agent re-assignment re-binds the CURRENT run's object here (per-run
            // arrays reset — the object reference never goes stale).
            onAgentTurn: (t, mt) => {
              turnBase = t // 段前累计 → 下一续跑段的种子
              applyTurnFrame(entry, t, mt) // 帧 → 池条目（entry 空 = sync 路径 → no-op）
              if (entry) entry.childAgent = sink.agent ?? entry.childAgent
              // §14 C-11③：逐轮进展帧上屏（webview 区头 turn N/M 实时——新通道）
              ctx.callbacks?.onSubagent?.({ id: subId, role, status: "turn", turn: t, maxTurns: mt })
            },
            onComplete: () => {},
            onQuestion: ctx.callbacks?.onQuestion ?? null,
            // §18 C-2：写权 child 的权限通道（helper 返 null → 键省略——既有语义零回归）
            ...(childPermission ? { onPermissionRequired: childPermission } : {}),
          }, childSig, role === "eng-coder" ? true : (() => ctx.getAuto?.() ?? false), { ...baseOpts, resume, ...(resume ? { history: sink.history, _turnSeqBase: turnBase } : {}) })

          // §19.5 D-M6 (advisor round 2 #4): cancel 与完成竞态的统一终态——runAgent 返回后
          // 若条目已被 cancel（完成瞬间点击/模型 cancel 竞态），走 cancelled 分支：不 merge
          // （partial changes NOT merged/audited——与提醒文案/设计一致）、不发 done/settled、
          // 报告不入池——settle 的 cancelled 分支统一收尾（无「done 后 frozen stopped」双终态）。
          if (entry?.cancelled) return `Subagent (${role}) cancelled`

          mergeChildMutations(parent, sink)

          // R22 (D-R22b 降级口径 — 实测: 现有 onSubagent/状态事件不携 turn): 池条目
          // (entry) 的终态通知顺带 final turn/maxTurns 快照 — webview 冻结身份头
          // "[✓ key · … · done Ns · turn n/max]" 用它; **逐轮跳动新通道已建**（§14 C-11③：
          // onAgentTurn → status:"turn" 帧上屏——本批收口）。同步 spawn (无 entry) 不带终值
          // 快照 → 无 turn 段（逐轮帧仍随 onAgentTurn 发）。
          ctx.callbacks?.onSubagent?.({
            id: subId, role, status: terminalStatus(),
            ...(entry ? { turn: entry.turn ?? 0, maxTurns: entry.maxTurns ?? 0 } : {}),
          })
          // designId rides the delivery report (2026-09-01, CLI parity): the audit fix
          // round re-spawns with the SAME designId+token — the parent copies it from here.
          const designIdNote = role === "eng-coder"
            ? `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
            : ""
          return `Subagent (${role}) completed:\n${result || output.slice(0, 4000)}${designIdNote}`
        } catch (e) {
          // §19.5 D-M6 (advisor round 2 #4): cancel 定向中止的 AbortError 不是错误——
          // **先于 merge 判定**：取消路径不 mergeChildMutations（partial changes NOT
          // merged/audited——与提醒文案/设计一致——磁盘半成品不入父 guard 记账，不触发
          // verify/advisor 推回）；settle 的 cancelled 分支负责出池清理 + 停止冻结通知
          // （cancelled settle 无错误报告——T-M19 断言）。
          if (entry?.cancelled) return `Subagent (${role}) cancelled`
          // Max-turns exhaustion may still have written files — merge whatever the child touched
          if (role === "eng-coder") mergeChildMutations(parent, sink)
          if (e instanceof agentMod.ContinueError) {
            // Blocking children ask the user through the panel question card below.
            // §15 D-A3 (2026-09-02 unified rule, CLI parity — CLI async askContinue:
            // () => Promise.resolve(Boolean(config.agent.engineering && autoApprove));
            // the VS Code live-AUTO equivalent is ctx.getAuto — execute-tools wires
            // runAgent's live autoApprove getter into every tool ctx, the per-run
            // VS Code agent has no autoApprove field): a background (async) child
            // NEVER pops a continue panel.
            if (!asyncFlag && ctx.callbacks?.onQuestion) {
              const go = await ctx.callbacks.onQuestion(
                `Subagent (${role}) reached ${e.turns} turns (limit). Continue from here?`,
                ["Continue", "Stop"],
              )
              if (go === "Continue") continue
            }
            // §15 D-A3 exception / §18 D-E2 cap fallback: engineering && AUTO → the async
            // child auto-resumes (mechanical check lives in subagent-async.mjs shouldAutoResume).
            if (shouldAutoResume(asyncFlag, parent, ctx)) {
              continue // AUTO 自动续跑：resume:true + 子代理自身 history、fresh budget（与用户 Continue 同路径）
            }
            ctx.callbacks?.onSubagent?.({ id: subId, role, status: "error", error: `turn cap reached (${e.turns} turns) — work may be partial` })
            // declined eng-coder delivery still carries its designId — the fix round
            // re-spawns with the same slot (2026-09-01, CLI parity).
            const capNote = role === "eng-coder" ? `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.` : ""
            return `Subagent (${role}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}${capNote}`
          }
          ctx.callbacks?.onSubagent?.({ id: subId, role, status: "error", error: e.message })
          return `Subagent (${role}) error: ${e.message}\nPartial output: ${output.slice(0, 2000)}`
        }
      }
}
