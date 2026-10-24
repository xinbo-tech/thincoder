/**
 * doc-check/version.mjs — 收口判定行的解析（判据单源：gate 收口链与 batch 结构门共用）。
 *
 * 2026-10-24：原「引擎版本一致性」整族删除（用户裁定）。它比的是「引擎档 mtime 是否晚于进程启动」，
 * 这个数值推不出「判据错了」——晚于启动只说明读数来自本会话加载的那版引擎；用它阻断收口，等于
 * 改一次检查器就再也收不了口。留着当注记也没能给出可行动的信息，一并去掉。
 */
export function firstVerdictLine(report) {
  return String(report ?? "").split("\n")[0] ?? ""
}
