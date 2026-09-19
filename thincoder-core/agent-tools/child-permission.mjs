/**
 * child-permission.mjs — child permission channel（CORE-UNIFICATION §2.5 #166
 * 「融合：子代理权限通道按核内结构归位（父卡归属 + 定向 signal）」；§18 C-2——2026-09-12）。
 *
 * 来源 = `thincoder-vscode/src/agent-tools/child-permission.mjs`（VSC 独有拆面——CLI 侧无独立
 * 档，该通道内联于父卡装配）——**逐字随迁**；档内零 `vscode` 依赖（`ctx.callbacks` 驱动）⇒
 * 按核内结构直接归位；两端装配层各自挂 `ctx.callbacks.onPermissionRequired`。
 *
 * 写权 child（coder/eng-designer）手动档的每写询问通道：把子代理的 onPermissionRequired
 * 桥到**父面板**的权限卡（owner 归属 + 定向 signal），并在询问前后以
 * onSubagentApproval 通知块头审批态（⏸ + 等待审批: <tool>）。eng-coder child 不配通道
 * （spawn 时授权——C-3/KD-2 保持零弹卡）；explore/plan 只读集不可达；无父通道
 * （headless / 无关角色调用侧未挂——AUTO 不再使通道缺席：父门恒在，判定 = 询问时
 * live 读，父级与子代同判据单源，ED-2 2026-09-16）→ 返回 null（调用侧省略该键——静默直通，零回归）。
 *
 * 顺序定死（C-2）：announce(tool) → await ask → finally announce(null 清态)。owner label
 * 与活动块 label 同源（KD-8——卡与块可目视配对）：escalate/consult 带模型
 * （`escalate <model> #<id>`），family 角色 `<role>#<id>`。
 */

/** owner label（KD-8——活动块 label 同源）：role ∈ {escalate, consult} 且有 model →
 *  `<role> <model> #<id>`；否则 `<role>#<id>`。 */
export function childOwnerLabel(role, id, model) {
  if ((role === "escalate" || role === "consult") && model) return `${role} <${model}> #${id}`
  return `${role}#${id}`
}

/**
 * 构建 child 权限通道。返回 null（无 `ctx.callbacks.onPermissionRequired`——headless /
 * 无关角色调用侧未挂；AUTO 判定走父门询问时 live 读——同判据单源，ED-2 2026-09-16）或
 * `async (toolName, args, diffInfo) => boolean`。
 * @param {{ ctx: object, id: number, role: string, model?: string|null, signal?: AbortSignal|null }} deps
 */
export function makeChildPermission({ ctx, id, role, model = null, signal = null }) {
  if (!ctx?.callbacks?.onPermissionRequired) return null
  const owner = { label: childOwnerLabel(role, id, model), role, id }
  return async (toolName, args, diffInfo) => {
    ctx.callbacks.onSubagentApproval?.({ id, role, model, tool: toolName })
    try {
      return await ctx.callbacks.onPermissionRequired(toolName, args, diffInfo, { owner, signal })
    } finally {
      ctx.callbacks.onSubagentApproval?.({ id, role, model, tool: null })
    }
  }
}
