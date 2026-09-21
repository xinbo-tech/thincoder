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
 *
 * F11-C（本批）：**骨架死占位枚举**（TEMPLATE_PLACEHOLDERS）与残留扫描纯函数
 * （findPlaceholderResidue）同住本档——与骨架模板共址即判据不会与模板脱节。
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
 * emoji / 括注 / 日期后缀容忍（**读侧** gate 判定 = 子串包含，同 gate——写入面 value 谓词
 * 自本批起收紧为「剥装饰白名单后余核 = 关键词」，见 batch-lifecycle.mjs）；
 * 全词表并集 = 各段项去重集合（note 字段零命中的判据面——括注永不误触 gate）。
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
 * 骨架死占位**枚举单源**（F11-C 判据面——create 骨架产出过的全部死占位字面）：
 *  - `#<编号>` / `<板块>` = 现行骨架仍在产出的两处（台账行——填充人 = 主 agent，时点 =
 *    建档后、本档首个 append/status 之前）；
 *  - `<BATCH-ID>` / `<讨论来源>` = 改形**删除**的两处旧占位（create 不再产出；旧档残留同判）。
 * 判据 = 枚举而非泛形正则：`<[^>]{1,40}>` 一类泛形会误杀正文合法尖括号（`Error: <message>` /
 * 泛型 `Array<T>` / 讨论字面本身）与 `<§N 模板占位：…>` 合法暂存行（append 不删行——段内留存
 * 是常态）——设计档 `TOOLS.md` 6.15 裁定点④。
 */
export const TEMPLATE_PLACEHOLDERS = ["<BATCH-ID>", "<讨论来源>", "#<编号>", "<板块>"]

/**
 * 死占位残留扫描（F11-C——append/status 落笔前的机检；**纯函数 · 零 fs**）。
 * 判定域 = **档头**（档首行起至首个 `## §N` 段头前）+ **本次目标段**段内——他段模板占位不归
 * 本段作者管（一段一作者：§2 作者扫 §5 的占位 = 越权）。
 * @param {string} src — 档全文
 * @param {number|string} seg — 本次目标段号（`2` / `"2"`——同 sectionHeaderRe 消费形）
 * @returns {Array<{line: number, text: string, where: "header"|"section"}>} 残留列表（空 = 无残留）；
 *   `line` = 所在判定域内 1-based 行号（档头域自档首行起 · 段域自 `## §N` 标题行起——便于定位），
 *   `text` = 命中行 trim 原文，`where` = 命中域（档头 / 目标段——错误句标注位置用）
 */
export function findPlaceholderResidue(src, seg) {
  const out = []
  const scan = (text, where) => {
    text.split("\n").forEach((line, i) => {
      if (TEMPLATE_PLACEHOLDERS.some((ph) => line.includes(ph))) out.push({ line: i + 1, text: line.trim(), where })
    })
  }
  const firstSection = /^## §\d/m.exec(src)
  scan(src.slice(0, firstSection ? firstSection.index : 0), "header")
  const hdr = sectionHeaderRe(seg).exec(src)
  if (hdr) {
    const nextRe = /^## §\d/gm
    nextRe.lastIndex = hdr.index + hdr[0].length
    const next = nextRe.exec(src)
    scan(src.slice(hdr.index, next ? next.index : src.length), "section")
  }
  return out
}

/**
 * 占位残留拒绝句（F11-C——append / status 两个挂点共用单源文案；逐行列残留：位置标注 + 行号 + 原文）。
 * 错误句前缀 = `batch:`（本批新增错误面——与 append 迁移面的 `batch_segment:` 旧面不混）。
 * @param {Array<{line:number,text:string,where:string}>} residues — findPlaceholderResidue 的返回值（非空）
 * @returns {string} 完整拒绝句（调用方 throw new Error(...)）
 */
export function placeholderResidueError(residues) {
  const where = (r) => (r.where === "header" ? "档头" : "目标段")
  const list = residues.map((r) => `  ${where(r)} line ${r.line}: ${r.text}`).join("\n")
  return "batch: 骨架死占位残留 — the batch record still carries skeleton placeholders (档头 or your target section). " +
    "Fill them before writing: create ⇒ the main agent fills the header's 台账编号 / 板块 placeholders ⇒ the record's first append/status opens. " +
    `Nothing was written. Residue:\n${list}`
}


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
 * 编制行 + 台账/前情指针行）+ §1 段内**占位状态行**（含 gate 合法关键字「进行中」——建档即过
 * gate；整行不含「已收口」——gate 已收口优先，占位行不得携带冻结词）+ 各段模板子标题占位。
 * 已知实参替换：date / topic / **source** / prev（§4.11 参数面 + F11-B——source 必填、prev 传
 * 入值过幂等剥前缀，归一化在 lifecycle 面）；档头 `#<编号>` / `<板块>` 仍保持占位字面（台账
 * 登记 = 主 agent 既有义务，create 不代建——填充时点 = 建档后、本档首个 append/status 之前）。
 * 本批改形删除（F11-B）：旧 `# …（<BATCH-ID>）` 后缀与 `来源 = <讨论来源>` 占位实参化。
 */
export function batchSkeleton({ date, topic, source, prev }) {
  return [
    `# ${date} · ${topic}`,
    "> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。",
    `> 编制：主 agent · ${date} · 来源 = ${source}。`,
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
