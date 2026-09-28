/**
 * settings-sections-tools.mjs — 设置面「工具与服务」段体（R2 · 桌面功能对位批 · 批档 §2.4 R2 #7；先拆后改：
 * 段体随本批索引族行落 —— 自 `renderer/views/settings-sections.mjs` 拆出；R7 再增 embedding ∕ websearch
 * 两族行，**零改名搬迁**）。
 * 面形（源 = VSC `thincoder-vscode/webview/settings-tools.js:330-350`（`renderIndexStatus`）· `:148-153`
 * （构建钮绑定））：索引族一行 = 名（`settings.indexSection`）+ 状态词 + 构建钮（两标：构建 ∕ 重新构建）
 * —— VSC 同形同判据序：`built` 真 ⇒ 计数行 + 「重新构建」；否则 ⇒ 「未构建」+ 「构建索引」。**钮恒可用**
 * （VSC 同：无 embedding key 不禁构建 —— key 只驱动 embedding 键行显示〔R7 面〕，向量层由检索面懒回填）。
 * 三态（本端状态为异步回执，状态缺位另立一态）：① `building` ⇒ 「构建中…」+ 钮禁用（VSC 点按即禁同律）；
 * ② **状态缺位**（首开在途 ∕ 读数回执失败）⇒ **零节点**（段态词 + 段级失败面承载；VSC 的「无状态」支 =
 * 宿主记忆面不可得态，桌面无同态 ⇒ 不落「未配置 key」假词 —— 零假造）；③ 有状态 ⇒ 上述两词面。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ∥ 禁用态 ⇒ `wire` 落 `disabled: true`
 * （诚实非死控）；零 `node:` ∕ 零裸包（渲染面静态闭包判据）。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 态判据（VSC `renderIndexStatus` 同判据序；`null` = 状态缺位 —— 零节点，禁假造）。 */
function indexState(section) {
  if (section?.building === true) return "building"
  const status = section?.status ?? null
  if (status === null) return null
  return status.built === true ? "built" : "not-built"
}

/** 态词表（词键单源 = 本表；值面住 `renderer/i18n-views.mjs`）。 */
const STATE_WORD = Object.freeze({
  building: "settings.indexBuilding",
  built: "settings.indexBuilt",
  "not-built": "settings.indexNotBuilt",
})

/** 计数归一：非有限数 ⇒ 0（禁假造 —— 回执原样投影，缺键落 0 计数）。 */
const countOf = (value) => (Number.isFinite(value) ? value : 0)

/** 态词：`built` 携两计数（`files` / `chunks`）；余态零参。 */
function statusWord(section, state) {
  if (state !== "built") return t(STATE_WORD[state])
  const status = section?.status ?? {}
  return t(STATE_WORD.built, { files: countOf(status.files), chunks: countOf(status.chunks) })
}

/** 钮标：`built` ⟺ 重新构建（VSC 同判据）。 */
const buildWord = (state) => t(state === "built" ? "settings.indexRebuild" : "settings.indexBuild")

/** 索引族行（名 + 状态词 + 构建钮）；状态缺位 ⇒ **零节点**（段态词承载 —— 零假造）。
 *  禁用判据仅 `building`（VSC 点按即禁同律）；缺 `onBuildIndex` ⇒ `wire` 落 `disabled`（诚实非死控）。 */
export function toolsBody(section, handlers) {
  const state = indexState(section)
  if (state === null) return []
  const onClick = state !== "building" && typeof handlers?.onBuildIndex === "function" ? handlers.onBuildIndex : undefined
  return [{
    tag: "div",
    props: { class: "settings-row", "data-index": "row", "data-index-state": state },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [t("settings.indexSection")] },
      { tag: "span", props: { class: "settings-row-value" }, children: [statusWord(section, state)] },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:buildIndex",
          "aria-label": buildWord(state),
        }, onClick),
        children: [buildWord(state)],
      },
    ],
  }]
}
