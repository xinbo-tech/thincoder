/**
 * slash.mjs — 斜径机制件（纯函数三件：`parseSlash` ∥ `routeSlash` ∥ `formatHelp`；核化落点 = 输入面板族 `composer/`）。
 *
 * 机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-12 ∥ §5 条 6（本档只述解析 ∥ 路由 ∥ `/help` 行集三件；
 * 拦截段序 ∥ `run` 返值语义 ∥ 反馈键发射点单表 = §5 条 6，消费面 = `composer/panel.mjs` ∥ 端装配面 `printHelp` 口）：
 *  · 触发判据 = 提交文本 `trim()` 后首字符 `/`（`"foo /model"` 形 = 非斜径 ⇒ `null`——照普通消息径）；
 *  · 首 token（**含首 `/`**）小写归一（大小写不敏感）；余串 = `args`（无余 ⇒ `""`）；
 *  · 条目形（**端侧构造、本档零持表**）= `{ name, aliases?, group?, descKey?, rejectKey?, run(ctx) → boolean }`——
 *    `name` / `aliases` 含首 `/`（与 CLI `SLASH_COMMANDS` ∥ `SLASH_ALIASES` 同名同形——表纪律机检面）；
 *    `group` ∥ `descKey` = `/help` 面（`formatHelp` 消费——组序归本档常量 ∥ 描述经词键取）；
 *  · 返值域 = `{ kind:"command", cmd, args }` ∥ `{ kind:"unknown", name }` ∥ `null`（非斜径）。
 *
 * 零依赖（零 `node:` ∥ 零裸包）· 零 DOM · 零端句柄（平 node 直测）：本档不触 `post`、不取词（`formatHelp` 词函数
 * **参数注入** —— 保纯度）、不产反馈（反馈键 `slash.unknown` ∥ `slash.args` = 面板层发射，见 §5 条 6）。
 */

/** 斜径解析（纯函数）。非斜径（非串 ∥ trim 后非 `/` 起头）⇒ `null`；否则 `{ name, args }`——
 *  `name` = 小写首 token（含首 `/`；`"/"` ⇒ `"/"`——命中与否归 `routeSlash`）；`args` = 余串 trim（空 ⇒ `""`）。 */
export function parseSlash(text) {
  if (typeof text !== "string") return null
  const trimmed = text.trim()
  if (!trimmed.startsWith("/")) return null
  const gap = trimmed.search(/\s/)
  if (gap === -1) return { name: trimmed.toLowerCase(), args: "" }
  return { name: trimmed.slice(0, gap).toLowerCase(), args: trimmed.slice(gap).trim() }
}

/** 命令查找（条目形见件头注）：名录逐字命中优先（端表零重名 = 表纪律面），别名次之（CLI `SLASH_ALIASES` 同形）。 */
function findCommand(commands, name) {
  for (const cmd of commands) if (cmd?.name === name) return cmd
  for (const cmd of commands) if (Array.isArray(cmd?.aliases) && cmd.aliases.includes(name)) return cmd
  return null
}

/** 路由（纯函数）：`null` = 非斜径（照普通消息径）；`{ kind:"unknown", name }` = 斜径但未在册
 *  （**回落——不发送**，面板层 toast `slash.unknown` + 文本保留）；`{ kind:"command", cmd, args }` = 命中
 *  （面板层执行；`args` 非空 ⇒ run 前门拒——`slash.args`，见 §5 条 6）。 */
export function routeSlash(text, commands) {
  const parsed = parseSlash(text)
  if (parsed === null) return null
  const cmd = findCommand(Array.isArray(commands) ? commands : [], parsed.name)
  if (cmd === null) return { kind: "unknown", name: parsed.name }
  return { kind: "command", cmd, args: parsed.args }
}

/** `/help` 组序常量（**CLI 同序** —— `thincoder-cli/src/tui/cmd-help.mjs:10`；组缺者跳过 ∥ 无组条目跳过）。 */
const HELP_GROUPS = Object.freeze(["Agent", "Session", "Project", "System"])

/** `/help` 行集（纯函数 —— 对位 CLI `cmd-help.mjs` 实盘三段形：标签 → 组行 → 命令行逐行）：
 *  `commands` = 端表本体（**唯一内容源** —— 零第二清单）；`t` = 词函数（参数注入 ⇒ 保纯度 ∥ 平 node 直测）。
 *  出 `{ kind, text }[]`：`label` = 标签行（词键 `slash.help.label`）→ `group` = 组行（`${group}:`——`HELP_GROUPS`
 *  序；**组缺者跳过**）→ `cmd` = 命令行（`名字 (别名)  描述` —— 别名括注（多别名逗号分隔）、**双空格分隔**
 *  （**零 padEnd**：比例字体下列对齐为终端渲染机制，非形本体）；`descKey` 缺 ⇒ 尾空）。
 *  条目无 `group` ⇒ 跳过（CLI `cmd-help.mjs:13` 同判 —— 零假面：不在册不进清单）。 */
export function formatHelp(commands, t) {
  const list = Array.isArray(commands) ? commands : []
  const rows = [{ kind: "label", text: t("slash.help.label") }]
  for (const group of HELP_GROUPS) {
    const members = list.filter((cmd) => cmd?.group === group)
    if (members.length === 0) continue
    rows.push({ kind: "group", text: `${group}:` })
    for (const cmd of members) {
      const alias = Array.isArray(cmd.aliases) && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : ""
      const desc = typeof cmd.descKey === "string" && cmd.descKey !== "" ? t(cmd.descKey) : ""
      rows.push({ kind: "cmd", text: `${cmd.name}${alias}  ${desc}` })
    }
  }
  return rows
}
