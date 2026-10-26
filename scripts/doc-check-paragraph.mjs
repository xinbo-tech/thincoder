/**
 * doc-check-paragraph.mjs — 再出口缝（**零逻辑**）。
 * 判据实现单源 = `thincoder-core/doc-check/paragraph.mjs`（权威 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 条目 S）。
 * 参数源单源 = `thincoder-core/doc-check/index.mjs` 的 `DOC_CHECK_BUILTINS`——脚本侧不从别处取参。
 * 本档只逐名再出口：盘上不留第二份谓词实现；判据口径 / 豁免族一律随产品档位。
 */
export { DOC_CHECK_BUILTINS } from "../thincoder-core/doc-check/index.mjs";
export { isTableRow, fenceMark, isFenceLine, isQuoteLine, isZoneHead, isExecutableLine, inCodeSpan, isListItem, isPromptFace, checkParagraphs, DOC_CLASS } from "../thincoder-core/doc-check/paragraph.mjs";
