/**
 * i18n.mjs — 核内文案常量容器（§2.5 #185 / 丁组 D1 裁定「容器归一、投影端差」）。
 *
 * 形态（用户 2026-09-13 裁定 · 按建议）：
 *  - `CORE_MESSAGES` = 键 → `{ en, zh }`：核内文案**单一权威容器**（本批收编两端同语义文案）。
 *  - `t(key, vars, locale)` = 核侧解析（CLI 直接用常量；缺键回退返回 key——不抛）。
 *  - `projectDictionary(locale)` = **VSC 字典投影**：核常量 → VSC `locales/*.json` 的扁平
 *    字典形态（VSC 的 `i18n.mjs` `t()` 壳在 S2 接线时并入本投影，壳内零文案）。
 *
 * 契约（CORE-UNIFICATION §2.12.2 第 12 行 · 输出文案类）：**机器消费面冻结**——本表键值
 * 与现 VSC `locales/{en,zh}.json` 逐字一致（已锁定串不得改）；人读文案后续变更须登记 +
 * CHANGELOG（S2 落地物）。`${name}` = 插值占位（两端同约定）。
 *
 * 边界：本模块只收「核域」文案（压缩 / 消化 / 限流状态 / 异步池状态 / 会诊 / 任务 / goal /
 * 思考状态）；webview 面板专属文案（welcome / toolbar / settings / perm 卡等）留在 VSC 侧
 * 字典（④ 端特有面——宿主 UI）。
 */

/** 支持的语言（与 VSC locales 文件名一致）。 */
export const SUPPORTED_LOCALES = ["en", "zh"]

/**
 * 核内文案常量容器：键 → { en, zh }。
 * 值 = 现 VSC `locales/{en,zh}.json` 逐字（机器消费面冻结——改值须走 A11 登记 + CHANGELOG）。
 */
export const CORE_MESSAGES = Object.freeze({
  // ── 压缩（context compaction）──
  "compress.start": { en: "Compressing context… (summarizing ${n} messages)", zh: "正在压缩上下文…（摘要 ${n} 条消息）" },
  "compress.starting": { en: "Compressing context…", zh: "正在压缩上下文…" },
  "compress.done": { en: "Compressed: ${tokens} tokens freed (${seconds}s)", zh: "已压缩：释放 ${tokens} tokens（${seconds} 秒）" },
  "compress.failed": { en: "Compression failed: ${error}", zh: "压缩失败：${error}" },
  "compress.fallback": { en: "Compression failed — fallback: truncated to ${n} messages", zh: "压缩失败 — 降级：截断为 ${n} 条消息" },
  // ── 消化（auto-turn digest）──
  "digest.start": { en: "Digesting ${n} background report(s)…", zh: "正在消化 ${n} 份后台报告…" },
  "digest.done": { en: "Digested ${n} background report(s) (${seconds}s)", zh: "已消化 ${n} 份后台报告（${seconds}s）" },
  "digest.aborted": { en: "Digestion interrupted (${seconds}s)", zh: "消化中断（${seconds}s）" },
  "digest.turnLabel": { en: "[auto-turn: digesting finished subagent reports…]", zh: "自动回合：消化已完成的子代理报告…" },
  // M4（2026-09-20 端差·显示面消差批）：起跑标签三档（en = CLI `suspension-drive.mjs:175-176`
  // 逐字；zh = 与上方既有档同式译法）——VSC 本地档不重复定义（单一权威容器）。
  "digest.turnLabelAsk": { en: "[auto-turn: answering a subagent's in-flight message…]", zh: "自动回合：答复子代理的在飞提问…" },
  "digest.turnLabelAuto": { en: "[auto-turn: continuing background work…]", zh: "自动回合：继续后台推进…" },
  "digest.capAuto": { en: "[auto-turn: continuing past turn cap…]", zh: "自动回合：越过轮次上限，继续推进…" },
  "digest.capStop": { en: "[auto-turn stopped at ${turns} turns — partial digest; finished reports stay in history]", zh: "自动回合在 ${turns} 轮处停止——部分消化；已完成的报告保留在历史中" },
  // ── 限流 / 供应商状态行 ──
  "status.rateWait": { en: "TPM throttle wait ~${s}s", zh: "TPM 限流等待 ~${s}s" },
  "status.rateLimited": { en: "Rate-limited 429, retry in ${s}s", zh: "限流 429，${s}s 后重试" },
  "status.overloaded": { en: "Server overloaded, retrying in ${s}s", zh: "服务过载，${s}s 后重试" },
  "status.quota": { en: "quota exhausted: ${msg}", zh: "配额耗尽：${msg}" },
  // ── 异步池状态词 ──
  "sub.running": { en: "running", zh: "运行中" },
  "sub.queued": { en: "queued", zh: "排队中" },
  "sub.stopped": { en: "stopped", zh: "已停止" },
  "sub.done": { en: "done", zh: "完成" },
  "sub.error": { en: "error", zh: "错误" },
  "sub.cancelled": { en: "cancelled", zh: "已取消" },
  "sub.awaitingDigest": { en: "done · awaiting digestion", zh: "已完成 · 等待消化" },
  "sub.queueSlot": { en: "queued · position ${n} (slot full)", zh: "排队中 · 位置 ${n}（槽满等位）" },
  // ── 会诊状态词 ──
  "consult.answered": { en: "answered", zh: "已回复" },
  "consult.terminated": { en: "terminated", zh: "已终止" },
  // ── 任务 / goal ──
  "task.in_progress": { en: "in progress", zh: "进行中" },
  "goal.criteria": { en: "Criteria", zh: "验收标准" },
  // ── 思考 / 工具状态词 ──
  "status.stopped": { en: "[stopped]", zh: "[已停止]" },
  "status.thinking": { en: "Thinking", zh: "思考中" },
  "status.turn": { en: "turn ${n}/${m}", zh: "轮次 ${n}/${m}" },
  "tool.running": { en: "running…", zh: "执行中…" },
  "tool.done": { en: "done", zh: "完成" },
})
// 深度冻结（机器消费面冻结——嵌套 { en, zh } 也冻结；浅冻结下值可被静默改写）。
for (const entry of Object.values(CORE_MESSAGES)) Object.freeze(entry)

/** 语言归一（BCP-47：`zh-CN` → `zh`；未知 → `en`——镜像 VSC `_load` 的候选回退）。 */
export function normalizeLocale(locale) {
  const raw = String(locale ?? "").trim()
  if (!raw) return "en"
  if (SUPPORTED_LOCALES.includes(raw)) return raw
  const base = raw.split("-")[0]
  return SUPPORTED_LOCALES.includes(base) ? base : "en"
}

/**
 * 核侧解析：`t("compress.starting")` / `t("digest.done", { n: 2, seconds: "1.2" })`。
 * 缺键回退返回 key 本身（两端同口径——不抛）。
 */
export function t(key, vars = {}, locale = "en") {
  const entry = CORE_MESSAGES[key]
  if (entry === undefined) return key
  let val = entry[normalizeLocale(locale)] ?? entry.en
  for (const [k, v] of Object.entries(vars)) {
    val = val.replace("${" + k + "}", String(v))
  }
  return val
}

/**
 * VSC 字典投影：核常量 → 扁平 `{ key: value }`（VSC `locales/*.json` 形态）。
 * S2 接线：VSC `i18n.mjs` 的 `_load` 以本投影为核域底座 + 端特有键（webview 面）叠加。
 */
export function projectDictionary(locale = "en") {
  const lang = normalizeLocale(locale)
  const out = {}
  for (const [key, entry] of Object.entries(CORE_MESSAGES)) out[key] = entry[lang] ?? entry.en
  return out
}
