/**
 * goal tool: lifecycle management for long-running autonomous goals (completion contract).
 * Three states: active / complete / blocked. Completion must pass a verify evidence threshold;
 * blocked is only accepted after the same condition persists 3 consecutive times.
 * The system injects status + budget progress + audit discipline every turn.
 */
export const goalTool = {
  name: "goal",
  description:
    "Manage a long-running autonomous goal. " +
    "action='set': create or replace the goal — must have a verifiable completion criterion (a machine-checkable proof, not vague effort). " +
    "action='complete': mark achieved — only after the criterion's check has actually passed. " +
    "action='blocked': report an impasse (requires 'reason') — only after 3 genuine attempts. " +
    "action='cancel': abandon the goal. " +
    "Returns a status line — the goal set/updated/completed/blocked/cancelled confirmation, or Error: ... with the reason.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["set", "complete", "blocked", "cancel"], description: "Goal lifecycle action" },
      objective: { type: "string", description: "What you are trying to accomplish (for 'set')" },
      criteria: { type: "string", description: "How completion is PROVEN: the exact check to run, e.g. 'npm test passes', 'grep finds no TODO marker' (required for 'set')" },
      reason: { type: "string", description: "The blocking condition (required for 'blocked')" },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    const agent = ctx.agent
    if (args.action === "cancel") {
      agent.goal = null
      return "Goal cancelled. If the goal was blocked or impossible, explain why in your next message — the user can clarify, adjust scope, or confirm cancellation."
    }
    if (args.action === "set") {
      if (!args.objective) return "Error: 'objective' required for 'set' action."
      if (!args.criteria) {
        return "Error: 'criteria' required for 'set' — a goal without a machine-checkable proof of completion is a wish, not a goal. Name the exact check (tests, command output, search result) that proves it's done."
      }
      agent.goal = {
        objective: String(args.objective).slice(0, 500),
        criteria: String(args.criteria).slice(0, 500),
        setAt: Date.now(),
        status: "active",
        turnsUsed: 0,
        _blockTally: null, // { reason, count } — consecutive count of the same blocking condition (for blocked audit)
      }
      return `Goal set: ${agent.goal.objective}\nDone when: ${agent.goal.criteria}\nThe system will inject goal status every turn. Completion and blocked claims are audited — see the reminders.`
    }
    if (!agent.goal || agent.goal.status !== "active") {
      return `Error: no active goal to '${args.action}' (current: ${agent.goal?.status ?? "none"}). Set one first.`
    }
    if (args.action === "complete") {
      // Evidence chain threshold: files were mutated this run without verify — refuse completion (aligns with completion guard)
      if (agent._mutatedThisRun && !agent._verifiedThisRun) {
        return "Error: files were modified but verify has not run. Run the check your criteria names AND the verify tool before marking the goal complete — false completion is the worst outcome of autonomous work."
      }

      // Independent judge: verify the goal was actually achieved
      // Only applies when the agent is at depth 0 (not a subagent) and has history to review
      if (ctx.depth === 0 && agent.history.length > 2) {
        try {
          // Extract recent activity: last 4 assistant messages (summarizing what was done)
          const recent = agent.history.filter(m => m.role === "assistant").slice(-4)
          const activity = recent.map(m => (m.content ?? "").slice(0, 500)).join("\n---\n")
          const { chat } = await import("../provider/index.mjs")
          const judgeRes = await chat(agent.provider, {
            messages: [{
              role: "user",
              content: `You are an independent goal judge. Evaluate whether this goal has been achieved based on the agent's activity.

Goal: ${agent.goal.objective}
Success criteria: ${agent.goal.criteria}

Recent agent activity:
${activity || "(no activity recorded)"}

Has this goal been achieved? Answer ONLY "YES" or "NO" followed by a one-sentence reason.`,
            }],
            tools: [],
            signal: AbortSignal.timeout(10_000),
            // §18.6 D-TR4/D-TR6（2026-09-04 fix round1）：goal 独立评审调用经 chat()
            // 唯一采集点——补轨迹元数据 + traces 开关透传（agent.config.traces.enabled
            // ——关=不落盘必须全覆盖——与 agent.mjs/context.mjs 同模式）
            logCtx: {
              stage: "goal", kind: "goal",
              role: agent._role ?? null, depth: ctx.depth,
              session: agent._sessionStart ?? null, cwd: agent.cwd,
              traces: agent.config?.traces?.enabled !== false,
            },
          })
          const verdict = (judgeRes.content ?? "").trim()
          if (verdict.toUpperCase().startsWith("NO")) {
            return `Goal NOT complete (judge says NO): ${verdict.slice(2).trim()}\n\nContinue working or report blocked if this is a true impasse.`
          }
          if (!verdict.toUpperCase().startsWith("YES")) {
            return `Goal completion unverified — judge response ambiguous: "${verdict.slice(0, 200)}". Re-check your criteria and try again with clear evidence.`
          }
        } catch {
          // Judge unavailable — allow completion but note it
        }
      }

      agent.goal.status = "complete"
      return `Goal verified complete ✓: ${agent.goal.objective}\nIn your next message, summarize the evidence (what check ran, what it showed) — the user should be able to audit this claim.`
    }
    if (args.action === "blocked") {
      if (!args.reason) return "Error: 'reason' required for 'blocked' action."
      // Blocked audit: same condition must appear 3 consecutive times (only counts as real blocking if different approaches still hit the same wall)
      const tally = agent.goal._blockTally
      const count = tally?.reason === args.reason ? tally.count + 1 : 1
      agent.goal._blockTally = { reason: args.reason, count }
      if (count < 3) {
        return `Blocked not accepted yet (${count}/3 for this condition). Try a genuinely different approach first; report blocked only if the same condition stops you ${3 - count} more time(s).`
      }
      agent.goal.status = "blocked"
      return `Goal marked blocked after 3 attempts: ${args.reason}\nExplain the blocker to the user in your next message — what you tried, and what you need (clarification, permission, a decision).`
    }
    return `Error: unknown action '${args.action}'.`
  },
}
