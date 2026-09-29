/**
 * settings-sections-tools.mjs — 设置面「工具与服务」段体（R2 · 桌面功能对位批 · 批档 §2.4 R2 #7；先拆后改：
 * 段体随本批索引族行落 —— 自 `renderer/views/settings-sections.mjs` 拆出；R7 增 embedding ∕ websearch
 * 两键行，**零改名搬迁**）。
 * 面形（R7 终态 = 三族行：embedding ∕ websearch ∕ 索引状态）：
 *  ① **密钥键行**（源 = VSC `settings-tools.js`：`websearchRowHtml` ∕ `embedRowHtml` + `keyRowEdit` 行内编辑）：
 *     名 + 键面（配置 ⇒ `••••`〔键值恒不下发〕∕ 未配 ⇒ 「—」）—— 键行只在**键面读数在场**时落（`keys` 缺位
 *     〔读数未达 ∕ 失败〕⇒ **两行零节点**，段态词 + 段级失败面承载 —— 零假造）—— + 静止态两控件
 *     （`Add Key` ∕ `Change` + 删除；未配 ⇒ 零删除控件）+ 编辑态（密码输入 + `Save` ∕ `Cancel`）；
 *  ② **索引族行**（源 = VSC `settings-tools.js:330-350`（`renderIndexStatus`）· `:148-153`（构建钮绑定））：
 *     名（`settings.indexSection`）+ 状态词 + 构建钮（两标：构建 ∕ 重新构建）—— VSC 同形同判据序：
 *     `built` 真 ⇒ 计数行 + 「重新构建」；否则 ⇒ 「未构建」+ 「构建索引」；**无 embedding key ⇒ 不可构建**
 *     （S12 落：`settings.indexNoKey` 词 + 钮禁用 —— VSC `settings-tools.js:337-341` 同判）。
 * 态机（段级状态为异步回执）：① `building` ⇒ 「构建中…」+ 钮禁用（VSC 点按即禁同律）；② 无 embedding key
 *  ⇒ `no-key`（`settings.indexNoKey` 词 + 钮禁用 —— S12：VSC `settings-tools.js:337-341` 同判；键面读数缺位
 *  ⇒ 不可证假，沿下一判）；③ **索引状态缺位**（首开在途 ∕ 读数回执失败）⇒ **索引行零节点**（段态词 +
 *  段级失败面承载 —— 零假造）；④ 有状态 ⇒ built ∕ not-built 两词面。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ∥ 禁用态 ⇒ `wire` 落 `disabled: true`
 * （诚实非死控）；零 `node:` ∕ 零裸包（渲染面静态闭包判据）。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 态判据（VSC `renderIndexStatus` 同判据序；`null` = 状态缺位 —— 零节点，禁假造）。
 *  **S12 增 `no-key`**：embedding 键面读数在场且 `hasKey` 假 ⇒ 该态（对位 VSC `settings-tools.js:337-341`：
 *  无 key ⇒ `settings.indexNoKey` 词 + 构建钮禁用）——键面读数缺位（`keys` 非对象）⇒ 不可证假，沿旧判。 */
function indexState(section) {
  if (section?.building === true) return "building"
  const keys = section?.keys !== null && typeof section?.keys === "object" ? section.keys : null
  if (keys !== null && keys.embedding?.hasKey !== true) return "no-key"
  const status = section?.status ?? null
  if (status === null) return null
  return status.built === true ? "built" : "not-built"
}

/** 态词表（词键单源 = 本表；值面住 `renderer/i18n-views.mjs`）。 */
const STATE_WORD = Object.freeze({
  building: "settings.indexBuilding",
  built: "settings.indexBuilt",
  "not-built": "settings.indexNotBuilt",
  "no-key": "settings.indexNoKey",
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

/** 键行词表（词键单源 = 本表；值面住 `renderer/i18n-views.mjs`——键名与值逐字同 VSC locales 同名键）。 */
const KEY_WORD = Object.freeze({
  embedding: { label: "settings.embeddingLabel", placeholder: "settings.embedKeyPlaceholder", aria: "settings.embeddingLabel" },
  websearch: { label: "settings.websearchLabel", placeholder: "settings.websearchKeyPlaceholder", aria: "settings.websearchLabel" },
})

/** 密钥键行（两态：静止 ∕ 编辑中——编辑态 = 该行 `kind` 命中段切片 `edit`）：键面恒显配置态，
 *  编辑态 = 密码输入 + 存 ∕ 消两键；静止态 = 添 ∕ 改一键（已配 ⇒ 兼出删键）。 */
function keyRowNode(kind, words, hasKey, editing, handlers) {
  const staticControls = [
    {
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:keyEdit",
        "data-kind": kind,
      }, typeof handlers?.onKeyEdit === "function" ? () => handlers.onKeyEdit(kind) : undefined),
      children: [t(hasKey ? "settings.changeKey" : "settings.addKey")],
    },
  ]
  if (hasKey) {
    staticControls.push({
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:keyDelete",
        "data-kind": kind,
        "aria-label": t("settings.deleteKey"),
      }, typeof handlers?.onKeyDelete === "function" ? () => handlers.onKeyDelete(kind) : undefined),
      children: [t("settings.keyDelete")],
    })
  }
  const editingControls = [
    { tag: "input", props: { class: "settings-field", type: "password", "data-key-input": kind, "aria-label": t(words.aria), placeholder: t(words.placeholder) } },
    {
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:keySave",
        "data-kind": kind,
      }, typeof handlers?.onKeySave === "function" ? () => handlers.onKeySave(kind) : undefined),
      children: [t("settings.save")],
    },
    {
      tag: "button",
      props: wire({
        class: "settings-row-action",
        type: "button",
        "data-action": "settings:keyCancel",
        "data-kind": kind,
      }, typeof handlers?.onKeyCancel === "function" ? () => handlers.onKeyCancel() : undefined),
      children: [t("settings.cancel")],
    },
  ]
  return {
    tag: "div",
    props: { class: "settings-row", "data-key-row": kind, "data-key-state": hasKey ? "set" : "none" },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [t(words.label)] },
      { tag: "span", props: { class: "settings-key", "data-key": hasKey ? "masked" : "none" }, children: [t(hasKey ? "settings.keySet" : "settings.noneMark")] },
      ...(editing === kind ? editingControls : staticControls),
    ],
  }
}

/** 索引族行（名 + 状态词 + 构建钮）；状态缺位 ⇒ **零节点**（段态词承载 —— 零假造）。
 *  禁用于两态：`building`（VSC 点按即禁同律）与 `no-key`（S12：无 embedding key 不供构建）；
 *  缺 `onBuildIndex` ⇒ `wire` 落 `disabled`（诚实非死控）。 */
function indexRowNode(section, handlers) {
  const state = indexState(section)
  if (state === null) return null
  const onClick = state !== "building" && state !== "no-key" && typeof handlers?.onBuildIndex === "function" ? handlers.onBuildIndex : undefined
  return {
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
  }
}

/** 工具与服务段体：两密钥键行（embedding ∕ websearch —— **键面读数缺位 ⇒ 两行零节点**，零假造）+ 索引族行
 *  （状态缺位 ⇒ 该行零节点）。`section.keys` 非对象〔未读达 ∕ 读失败〕⇒ 两键行皆不落。 */
export function toolsBody(section, handlers) {
  const keys = section?.keys !== null && typeof section?.keys === "object" ? section.keys : null
  return [
    keys === null ? null : keyRowNode("embedding", KEY_WORD.embedding, keys.embedding?.hasKey === true, section?.edit ?? null, handlers),
    keys === null ? null : keyRowNode("websearch", KEY_WORD.websearch, keys.websearch?.hasKey === true, section?.edit ?? null, handlers),
    indexRowNode(section, handlers),
  ]
}
