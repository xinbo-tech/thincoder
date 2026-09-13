import { C } from "./ansi.mjs"

/** /goal command: set/view/cancel long-term goal.
 *  Extracted from slash-commands.mjs.
 *  ctx: { agent, pushLine, pushLabel, showPicker, askQuestion } */
export async function handleGoalCommand(ctx, args = []) {
  const { agent, pushLine, pushLabel, showPicker, askQuestion } = ctx

  function setGoal(goalText) {
    const semiIdx = goalText.indexOf("；") >= 0 ? goalText.indexOf("；") : goalText.indexOf(";")
    const objective = semiIdx >= 0 ? goalText.slice(0, semiIdx).trim() : goalText.trim()
    const criteria = semiIdx >= 0 ? goalText.slice(semiIdx + 1).trim() : ""
    agent.goal = { objective, criteria, setAt: Date.now(), status: "active", turnsUsed: 0, _blockTally: null }
  }

  function viewGoal() {
    const statusText = { active: "active", complete: "completed", blocked: "blocked" }[agent.goal.status] ?? agent.goal.status
    pushLine(`Goal: ${agent.goal.objective}`, C.tool)
    if (agent.goal.criteria) pushLine(`  Criteria: ${agent.goal.criteria}`, C.dim)
    pushLine(`  Status: ${statusText} │ Turns used: ${agent.goal.turnsUsed ?? 0} │ Set at: ${new Date(agent.goal.setAt).toLocaleString()}`, C.dim)
  }

  // Direct args: /goal set <text> │ /goal cancel │ /goal view
  const sub = args[0]?.toLowerCase()
  if (sub === "set") {
    const goalText = args.slice(1).join(" ")
    if (!goalText) { pushLine("Usage: /goal set <objective>[; criteria]", C.error); return }
    setGoal(goalText)
    pushLine(`Goal set: ${agent.goal.objective}`, C.tool)
    return
  }
  if (sub === "cancel") {
    if (!agent.goal) { pushLine("No goal set", C.dim); return }
    agent.goal = null
    pushLine("Goal cancelled", C.tool)
    return
  }
  if (sub === "view") {
    if (!agent.goal) { pushLine("No goal set", C.dim); return }
    viewGoal()
    return
  }
  if (sub) { pushLine("Usage: /goal [set <text>|cancel|view]", C.error); return }

  const entries = [
    { type: "header", text: agent.goal ? `Current goal: ${agent.goal.objective.slice(0, 60)}` : "Actions" },
    { type: "item", text: "Set new goal", action: "set" },
  ]
  if (agent.goal) {
    entries.push({ type: "item", text: "Cancel goal", action: "cancel" })
    entries.push({ type: "item", text: "View details", action: "view" })
  }
  // 先 await picker 返回（选中即关闭），再 askQuestion —— 两者不共存
  const e = await showPicker("Goal", entries)
  if (!e) return
  if (e.action === "view") {
    viewGoal()
    return
  }
  if (e.action === "cancel") {
    agent.goal = null
    return
  }
  // set — requires entering goal text
  const goalText = await askQuestion("Enter goal description (; separates criteria)")
  if (!goalText) return
  setGoal(goalText)
  pushLine(`Goal set: ${agent.goal.objective}`, C.tool) // 与直参路径口径一致
}
