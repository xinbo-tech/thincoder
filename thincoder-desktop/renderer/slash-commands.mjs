/**
 * slash-commands.mjs — 桌面 composer 斜径命令表（端侧构造；机制单源 = `docs/render-core/design/RENDER-CORE.md`
 * §2 KD-RC-12 ∥ §5 条 6；端侧语义 = `docs/desktop/design/UI.md` §1「本批注（slash 命令面 · 2026-10-01）」）。
 *
 * 条目形（§5 条 6）= `{ name, aliases?, group?, descKey?, rejectKey?, run(ctx) → boolean }`：
 *  · `name` ∥ `aliases` = 斜径名（**含首 `/`**——与 CLI `SLASH_COMMANDS` ∥ `SLASH_ALIASES` 同名同形；
 *    **表纪律**（不得自创命令）= 批内件机检：name ⊆ CLI 名集 ∥ aliases ⊆ CLI 别名键集）；
 *  · `group` ∥ `descKey` = `/help` 面（增量 · 2026-10-01②）：组序归核 `formatHelp` 常量；`descKey` = 词表键
 *    （en 值 = CLI 同名命令 `desc` 逐字——批内件机检）；
 *  · `run(ctx)` = **只调 `ctx.actions`**（零第二实现——动作 = 钮 handler 提取出的同一函数，门随函数）；
 *    返 `true` = **已受理**（已执行 ∨ 二段交互在场 ⇒ 面板清框 + 入输入历史）· 返 `false` = 未受理（门拒 ⇒
 *    面板出 `rejectKey` toast + 文本保留）；`ctx = { args, raw, post, actions }`（面板提交面拦截段给）；
 *  · `rejectKey` = 门拒反馈键（复用端词表键：`toolbar.planDisabled` = ENG×PLAN 互斥——`/plan` 在 ENG 态拒；
 *    `/model`（2026-10-04 解锁批：钮面忙态门退场 ⇒ 恒受理）∥ `/auto` ∥ `/eng` ∥ 非 ENG 态 `/plan` 无门 ⇒ 无 `rejectKey`）。
 *
 * 零上行：命中 ⇒ 本地面执行、不进消息径（零 `msg:send` ∥ `queuedUserMessage` 上行、零用户块、零 loading）。
 * 边界（不做）：键位补全（Tab）∥ 其余 22 条 CLI 命令 ∥ 携参直切（逐条处置 = 批档 §2.4）。
 * 零 `node:` ∥ 零裸包 ∥ 零 import（渲染面静态闭包判据——纯命令表档）。
 */

/** 命令表构造（**端侧构造点** · `/help` 增量 = 打印口**闭包注入**）：`printHelp` = 端装配面
 *  （`mount-composer.mjs`）绑定之 /help 打印口（返 boolean——`true` = 已打印）；条目 `run` 仍只返布尔
 *  ⇒ 核件面板 ∥ `ctx` 零触（缺参形 = 不传 `deps.slash` ⇒ 现行为零变——VSC 零接缝）。
 *  消费面 = `mount-composer.mjs` `mount` 一处装配 `deps.slash = { commands }`；在册 5 条 + 别名 3。 */
export function createSlashCommands(printHelp) {
  return [
    {
      name: "/model",
      aliases: ["/m"],
      group: "Agent",
      descKey: "slash.desc.model",
      run: (ctx) => ctx.actions.openModelMenu(), // 同一菜单、同一函数（`model-menu.mjs` `open`；忙态恒受理）
    },
    {
      name: "/auto",
      group: "Agent",
      descKey: "slash.desc.auto",
      run: (ctx) => ctx.actions.toggleAuto(), // AUTO 钮径（含开启内联确认门——popover 在场 = 已受理）
    },
    {
      name: "/plan",
      aliases: ["/p"],
      group: "Agent",
      descKey: "slash.desc.plan",
      rejectKey: "toolbar.planDisabled", // ENG×PLAN 互斥（ENG 开 ⇒ 门拒；复用既有键——零新词）
      run: (ctx) => ctx.actions.togglePlan(),
    },
    {
      name: "/eng",
      group: "Agent",
      descKey: "slash.desc.eng",
      run: (ctx) => ctx.actions.toggleEng(), // ENG 钮径（宿主入口门 = `setEngineeringEnabled` 单源）
    },
    {
      // `/help`（本批增量 · KD-S7）：流内打印形——打印口构造时闭包注入（`run` 零参 ⇒ 面板 ∥ `ctx` 零触）；
      // 组 `System`（CLI 同组）∥ `descKey` en 值 = CLI `desc` 逐字（`this list`）
      name: "/help",
      aliases: ["/h"],
      group: "System",
      descKey: "slash.desc.help",
      run: () => printHelp?.() === true, // 打印口缺参 ⇒ 未受理（沿设计原形可选链 —— 零 throw 面）
    },
  ]
}
