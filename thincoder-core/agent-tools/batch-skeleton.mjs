/**
 * agent-tools/batch-skeleton.mjs — 批次档骨架模板 + 状态行机械形态单源（KD-4 拆分档）。
 *
 * 本档是纯常量/纯函数单源（零副作用、零 fs）：`batch` 工具的 create 骨架、STATUS_WORDS
 * 分段词表、状态行形态与解析全部只住这里——其他档 import 消费，**不复制字面**
 * （BATCH-RECORD.md §4.10 / §4.12 / D-BR19；轮 2 #8——骨架占位状态行由 STATUS_WORDS §1 项
 * 引用生成，全仓无第二份独立词表字面）。
 *
 * 状态行解析（readBatchStatusLine）住本档的理由：冻结门（append/status 写前判定）与
 * lifecycle（status/close 写入、在飞批扫描）消费**同一个解析器**——解析单源即 gate 与
 * 生命周期三 action 的判定字面零漂移。
 *
 * 段标题定位（sectionHeaderRe）同住本档：append 段尾定位与 status/close 段内状态行定位
 * 消费**同一个段头正则**——`## §N` 形态单源（`## §20` 不误命中 §2）。
 */
/**
 * 段标题定位（`## §N` 独立标题——`## §20` 不误命中 §2）。
 */
export const sectionHeaderRe = (seg) => new RegExp(`^## §${seg}(?=\\s|$)`, "m")
/**
 * STATUS_WORDS——状态行合法关键字**分段词表常量单源**（D-BR19 / fix 轮 #1；轮 2 #3 裁定②）：
 *  - §1 项 = gate 词表 `{ open: 进行中, closed: 已收口 }`——**gate 只消费 §1 项**（单源仍成立）；
 *  - §2/§3/§5 各带段内生命周期词表（`done` 词 = 段属主的完成态关键字）；
 *  - §4/§6 无项——主 agent 的 status 写域**仅 §1**（§4/§6 状态面走普通文档写，与 D-BR18 分工一致）。
 * 词面纪律（最小词面）：一条状态行值只带**一个**关键字——校验面（batch 工具 status）拒绝
 * 内嵌另一冻结词的值（含「进行中…已收口」双词 ⇒ 已收口优先误冻结——2026-09-20 词面纪律）。
 * emoji / 括注 / 日期后缀容忍（判定 = 子串包含，同 gate）。
 */
export const STATUS_WORDS = Object.freeze({
  1: Object.freeze({ open: "进行中", closed: "已收口" }),
  2: Object.freeze({ open: "进行中", done: "设计完成" }),
  3: Object.freeze({ open: "进行中", done: "评审完成" }),
  5: Object.freeze({ open: "进行中", done: "实施完成" }),
})

/** 身份 → 可写段号（append 段白名单的**子代理面**——原 batch-segment.mjs 逐字迁移；主 agent
 *  的 depth-0 白名单（append = §1/§4/§6 · status = §1——轮 2 #3 裁定②）由身份判据在
 *  batch.mjs / batch-lifecycle.mjs 分支，不经本表。旧 batch-segment.mjs 导出面等价保持——
 *  本符号经 batch.mjs re-export（过渡 shim 面零触）。 */
export const SEGMENT_BY_ROLE = { "eng-designer": 2, "eng-coder": 5 }

/** §1 状态行前缀形态（`**状态行**：` 独立行——表格行 / 块引用行不命中；判定只认关键字）。 */
export const STATUS_LINE_RE = /^\s*\*\*状态行\*\*[：:]\s*(.*)$/

/**
 * §1 状态行解析（冻结门与 lifecycle 共用的**单源解析器**——原 batch-segment.mjs 逐字迁移，
 * 字面「已收口/进行中」改为消费 STATUS_WORDS[1]，行为零变）：解析对象 = §1 段内
 * `**状态行**：` 前缀行（§1 边界 = `## §1` 标题到下一 `## §` 标题；其他段内「状态行」字样
 * 不参与判定）。判定只认关键字（emoji / 括号装饰 / 日期后缀容忍）：含「已收口」→ "closed"
 * （冻结优先）、含「进行中」→ "open"；无 §1 / 无该行 / 两关键字皆不命中 → "unknown"
 * （fail-closed 视为冻结）。
 */
export function readBatchStatusLine(src) {
  const s1 = /^## §1(?=\s|$)/m.exec(src)
  if (!s1) return "unknown"
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = s1.index + s1[0].length
  const next = nextRe.exec(src)
  const body = src.slice(s1.index + s1[0].length, next ? next.index : src.length)
  const m = body.split("\n").map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)
  if (!m) return "unknown"
  const value = m[1].trim()
  if (value.includes(STATUS_WORDS[1].closed)) return "closed"
  if (value.includes(STATUS_WORDS[1].open)) return "open"
  return "unknown"
}

/**
 * create 骨架模板（BATCH-RECORD.md §4.10 行为规格的**代码单源**——红线：模板只覆盖骨架与
 * 占位，不模板化内容）：`## §1–§6` 段头（含职责署名）+ 档头 boilerplate（六段一段一作者句 +
 * 编制行 + 前情指针行）+ §1 段内**占位状态行**（含 gate 合法关键字「进行中」——建档即过
 * gate；整行不含「已收口」——gate 已收口优先，占位行不得携带冻结词）+ 各段模板子标题占位。
 * 已知实参替换：date / topic / prev（§4.11 参数面）；`<BATCH-ID>` / `<讨论来源>` / `#<编号>` /
 * `<板块>` 无参数 —— 保持占位字面（台账登记 / 来源 = 主 agent 既有义务，create 不代建）。
 */
export function batchSkeleton({ date, topic, prev }) {
  return [
    `# ${date} · ${topic}（<BATCH-ID>）`,
    "> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。",
    `> 编制：主 agent · ${date} · 来源 = <讨论来源>。`,
    `> 台账 = #<编号>（<板块> · 归批）。前情 = ${prev}。`,
    "## §1 讨论（主 agent）",
    `**状态行**：🔄 ${STATUS_WORDS[1].open}（…）`,
    "<§1 模板占位：本批条目 / 关键判据 / 授权口径>",
    "## §2 批次任务与设计（eng-designer）",
    "**状态行**：（eng-designer 写入时更新）",
    "<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>",
    "## §3 设计评审（评审子代理）",
    "## §4 用户批准（主 agent）",
    "## §5 实施记录（eng-coder）",
    "## §6 验证与收口（父代理）",
    "",
  ].join("\n")
}
