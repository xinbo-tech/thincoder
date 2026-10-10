/**
 * ask-steps.mjs — 团队问句步进小件（登录面补全批 · 2026-10-10 · 台账 #1229）。
 * 设计单源 = `docs/cli/design/TUI-COMMANDS.md` §1（模块地图）∥ §3.1 ∥ §5.5；
 * 机制单源 = `docs/core/design/TEAM.md` §2.2 ∥ §2.5（三字段 ∥ 掩码回显 ∥ 分类面）。
 *
 * 面：步定义 ∥ 推进 ∥ 问句行构造 ∥ 掩码位——**两消费方共用（单源）**：
 *   ① 首启向导团队路文本步（`wizard.mjs`——`state.wizard.step` 直接用步名 server ∥ username ∥ password）；
 *   ② 会话内 `/team login` 问句面（`cmd-team.mjs`——`state.teamAsk.step` 同三值）。
 * 掩码与提交语义只有这一处定义：`mask` 步 ⇒ 输入框回显走 `maskEcho`（显示层变换——提交值原样，
 * 由消费方从 `state.input` 原数组取值）且该步值零留存（密码恒不保留——§3.1 保真判据）。
 * 校验：本层不做表单校验（零自铸文案）——空值 ∥ 不可达 ∥ 401 ∥ 429 ∥ 写盘失败一律交核
 * `teamLogin` 分类（`reason` 四值闭集 ⇒ argv 面四句；与 argv ∥ 桌面同口径）。
 */
import { ansi, C } from "./ansi.mjs"

/** 三问步定义（序 = 提交序）。`trim` 与 argv 面同口径（地址 ∥ 账号 trim；密码原样——零裁剪）；
 *  `prompt` 与 argv 面问句同词（password 去 "(hidden)" 后缀——TUI 掩码回显已可见该语义）。 */
export const TEAM_ASK_STEPS = Object.freeze([
  Object.freeze({ step: "server", field: "server", prompt: "Team server URL:", mask: false, trim: true }),
  Object.freeze({ step: "username", field: "username", prompt: "Username:", mask: false, trim: true }),
  Object.freeze({ step: "password", field: "password", prompt: "Password:", mask: true, trim: false }),
])

/** 步名 ⇒ 定义；非团队步 ⇒ `null`（两消费方共同判据：向导步分派 ∥ 问句面分派单源）。 */
export function teamAskStepAt(step) {
  return TEAM_ASK_STEPS.find((s) => s.step === step) ?? null
}

/** 下一步名；末步 ⇒ `null`（= 提交登录）。 */
export function nextTeamAskStep(step) {
  const i = TEAM_ASK_STEPS.findIndex((s) => s.step === step)
  return i >= 0 && i < TEAM_ASK_STEPS.length - 1 ? TEAM_ASK_STEPS[i + 1].step : null
}

/** 掩码回显（显示层变换——每字符 `•`；提交值 = `state.input` 原值，本函数只喂渲染）。
 *  消费点唯一 = `layout.mjs` 输入框 buf 构造（`askMaskActive` 判据 + 本函数）。 */
export function maskEcho(chars) {
  return chars.map(() => "\u2022")
}

/** 当前在场模态面是否处于掩码步（向导团队 password 步 ∥ `/team login` password 步）——
 *  只认步名 + 掩码位，两个面共用一条判据。 */
export function askMaskActive(state) {
  const w = state?.wizard
  if (w != null && teamAskStepAt(w.step)?.mask === true) return true
  const face = state?.teamAsk
  return face != null && teamAskStepAt(face.step)?.mask === true
}

/** 问句屏行构造（两消费方共用）：已填两值（地址 ∥ 账号——密码恒不示）作 dim 上下文行 +
 *  加粗问句行 + 输入提示行。`fields` 缺省 = 零上下文行。 */
export function teamAskLines(step, fields = {}) {
  const def = teamAskStepAt(step)
  if (def === null) return []
  const lines = []
  if (fields.server) lines.push({ text: ` Server:   ${fields.server}`, color: C.dim })
  if (fields.username) lines.push({ text: ` Username: ${fields.username}`, color: C.dim })
  lines.push({ text: ` \u276f ${def.prompt}`, color: ansi.bold + C.text })
  lines.push({ text: " (type in input box below)", color: C.dim })
  return lines
}
