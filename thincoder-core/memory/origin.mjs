/**
 * memory/origin.mjs — origin 键归一（纯函数叶档 · MEMORY.md §6.11 · TUI 假死批 2026-09-18）。
 *
 * 病灶（源头）：origin 键 = **未归一的目录字符串**（`memory.codeOrigin = cwd`——Windows 盘符
 * 大小写随启动拼写、分隔符 / 尾斜杠同理）⇒ 同一棵树两份索引（实测 `D:\teamcode` 71,266 +
 * `d:\teamcode` 69,748），且检索按 origin **等值**过滤 ⇒ 某一拼写启动时只看得到自己那半行。
 *
 * 契约（三变换，逐条对应 §6.11 修法）：分隔符归一 `\`→`/` · Windows 盘符统一大写 ·
 * 去尾斜杠（根除外）；非字符串 / 空串 **原样透传**（类型护栏——调用点 `memory.codeOrigin`
 * 未设判据零变化）。幂等：`normalizeOrigin(normalizeOrigin(x)) === normalizeOrigin(x)`。
 *
 * 不做（§6.11「不做」）：`realpath` / 符号链接解析（改 origin 语义 + 破跨机可移植性，同
 * D-MEM10「不用 resolve」口径）；**非盘符段的大小写折叠**（POSIX 大小写敏感；origin 语义 =
 * 用户启动目录的原样拼写）；别名路径（subst / junction / 8.3 短名——§8.3 已知限制）。
 */

/** origin 键归一：非字符串 / 空串透传；`\`→`/`；盘符大写；去尾斜杠（`C:/` · `/` 根保留）。 */
export function normalizeOrigin(p) {
  if (typeof p !== "string" || p.length === 0) return p
  let s = p.replaceAll("\\", "/")
  if (s.length > 1 && /^[a-z]:/.test(s)) s = s[0].toUpperCase() + s.slice(1)
  while (s.length > 1 && s.endsWith("/") && !/^[A-Za-z]:\/$/.test(s)) s = s.slice(0, -1)
  return s
}
