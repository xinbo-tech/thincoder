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
        // child's writes. The exemption granularity is ONLY the permission/approval
        // stage (autoApprove equivalent — the child never pops a per-write panel):
        // JSON parse / unknown tool / planMode / design-token gates run BEFORE the
        // permission stage in execute-tools and stay fully effective (T-E14).
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
      for (let resume = false; ; resume = true) {
        try {
          // §19.5 D-M6: async 条目持条目级 controller signal（cancel 定向 abort——只停该
          // 条目）；sync 路径（无 entry）保持共享 signal（childSignal）原样（既有语义）。
          const childSig = entry ? (entry.controller?.signal ?? childSignal) : childSignal
          const result = await runAgent(provider, cwd, childInput, {
            onToken: (t) => { output += t; panel({ kind: "text", text: t }) },
            onReasoning: (r) => panel({ kind: "think", text: r }),
            onToolCall: (name, args) => {
              // §19/§19.5 当前工具捕获（SUBAGENT-OBSERVE-SEND.md 评审 #2——2026-09-08）：
              // 在流式回调处顺手记最后工具名+args 单字段进池条目——observe 读它当"当前工具"
              //（判推进 vs 卡死——卡在哪个工具上一眼可见）。args 截断（N2——非全量）。
              if (entry) entry._currentTool = { name, args: (JSON.stringify(args) || "").slice(0, 200) }
              panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) })
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
            onAgentTurn: (t) => {
              if (entry) {
                entry.turn = t
                entry.childAgent = sink.agent ?? entry.childAgent
              }
            },
            onComplete: () => {},
            onQuestion: ctx.callbacks?.onQuestion ?? null,
          }, childSig, true, { ...baseOpts, resume, ...(resume ? { history: sink.history } : {}) })

          // §19.5 D-M6 (advisor round 2 #4): cancel 与完成竞态的统一终态——runAgent 返回后
          // 若条目已被 cancel（完成瞬间点击/模型 cancel 竞态），走 cancelled 分支：不 merge
          // （partial changes NOT merged/audited——与提醒文案/设计一致）、不发 done/settled、
          // 报告不入池——settle 的 cancelled 分支统一收尾（无「done 后 frozen stopped」双终态）。
          if (entry?.cancelled) return `Subagent (${role}) cancelled`

          mergeChildMutations(parent, sink)

          // R22 (D-R22b 降级口径 — 实测: 现有 onSubagent/状态事件不携 turn): 池条目
          // (entry) 的终态通知顺带 final turn/maxTurns 快照 — webview 冻结身份头
          // "[✓ key · … · done Ns · turn n/max]" 用它; 逐轮跳动需新通道 — 不建 (见
          // ARCHITECTURE.md R22 节实现记录)。同步 spawn (无 entry) 不带 → 无 turn 段。
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
