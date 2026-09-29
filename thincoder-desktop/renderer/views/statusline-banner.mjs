/**
 * statusline-banner.mjs — 状态行 banner 段组（模式四位 · D22 —— `docs/desktop/design/UI.md` §1「本批注（状态栏对齐 · 屏面为准）」项 2 ·
 * `docs/desktop/design/IPC.md` §2「模式位投影注」）：自 `renderer/views/statusline.mjs` 拆出
 * （300 行拆分层预案落形 —— `docs/desktop/design/PROJECT.md` §4.2 状态行族档）。
 * 四段序 = CLI banner 序（PLAN → AUTO → ADVISOR → ENG —— `thincoder-cli/src/tui/render-frame.mjs:233-236` 实读〔2026-09-29 停滞批增行后重锚——父侧随动〕）；
 * 判定 = **活值口径**（`sessionFlags[key]` 四布尔切片 —— 真 ⇒ 该段在场 · 假 / 缺 ⇒ 零节点，负向锁；
 * 值面 = 宿主 `flagsOf(key)` 投影，端零算法副本）；词面 = 代号字面（两语同形 —— 词键 `status.banner.*`）。
 * 段锚 `data-seg`（值域 = 码集 —— 构树归 `renderer/views/statusline.mjs` `segNode`）；零 DOM / 零 `node:` / 零裸包
 * （渲染面静态闭包判据）。
 */
import { t } from "../i18n.mjs"

/** 四段码（序 = CLI banner 序 —— `docs/desktop/design/UI.md` §1 本批注项 2；应用面 = 段闭集序 / 段锚 / 词键后缀）。 */
export const BANNER_CODES = Object.freeze(["plan", "auto", "advisor", "eng"])

/** 码 → 活值键（`flags` 载荷键 —— `docs/desktop/design/IPC.md` §2「模式位投影注」项 2 四键）。 */
const FLAG_KEY = Object.freeze({ plan: "planMode", auto: "autoApprove", advisor: "advisorGuard", eng: "engineering" })

/** banner 段组（`flags` = `sessionFlags[key]` 切片）：严格真 ⇒ 该段在场；假 / 缺 / 非载体 ⇒ 零节点（负向锁 —— 禁假造）。 */
export function bannerSegments(flags) {
  const slice = flags !== null && typeof flags === "object" ? flags : {}
  return BANNER_CODES
    .filter((code) => slice[FLAG_KEY[code]] === true)
    .map((code) => ({ code, parts: [{ text: t(`status.banner.${code}`) }] }))
}
