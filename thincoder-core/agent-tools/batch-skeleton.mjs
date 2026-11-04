/**
 * agent-tools/batch-skeleton.mjs — 批次档骨架模板 + 状态行机械形态单源（KD-4 拆分档）。
 *
 * 本档是纯常量/纯函数单源（零副作用、零 fs）：`batch` 工具的 create 骨架、STATUS_WORDS
 * 分段词表、状态行形态与解析、轮次块标题形态与计数全部只住这里——其他档 import 消费，**不复制字面**
 * （BATCH-RECORD.md §4.10 / §4.12 / D-BR19；轮 2 #8——骨架占位状态行由 STATUS_WORDS §1 项
 * 引用生成，全仓无第二份独立词表字面）。
 *
 * 状态行解析（readBatchStatusLine）住本档：冻结门与 lifecycle（status/close 写入、在飞批扫描）消费
 * **同一个解析器**——解析单源即 gate 与三 action 的判定字面零漂移。
 *
 * 段标题定位（sectionHeaderRe）同住本档：append 段尾定位与 status/close 段头区状态行定位
 * 消费**同一个段头正则**——`## §N` 形态单源（`## §20` 不误命中 §2）。
 *
 * F11-C：**骨架死占位枚举**（TEMPLATE_PLACEHOLDERS）与残留扫描纯函数（findPlaceholderResidue——
 * 判定域 = 档头结构行，2026-10-05 判据收正）同住本档——与骨架模板共址即判据不会与模板脱节。
 */
/**
 * 段标题定位（`## §N` 独立标题——`## §20` 不误命中 §2）。
 */
export const sectionHeaderRe = (seg) => new RegExp(`^## §${seg}(?=\\s|$)`, "m")

/** §1 段头正则（单源——`readBatchStatusLine` 与 `isBatchRecord` 共用；`## §10` 不误命中 §1）。 */
const SECTION_1_HEADER_RE = /^## §1(?=\s|$)/m
/** 批档谓词（只读 · 零 fs）：档内有 §1 段头 ⇒ 批次档——判别式 = 上面那条同一正则（「是不是批档」与
 *  「§1 状态行是什么」两问不各持一份）；消费面 = 台账核销机检（`ledger-close-proof.mjs`）。 */
export function isBatchRecord(src) {
  return typeof src === "string" && SECTION_1_HEADER_RE.test(src)
}
/**
 * STATUS_WORDS——状态行合法关键字**分段词表常量单源**（D-BR19 / fix 轮 #1；轮 2 #3 裁定②）：
 *  - §1 项 = gate 词表 `{ open: 进行中, closed: 已收口 }`——**gate 只消费 §1 项**（单源仍成立）；
 *  - §2/§3/§5 各带段内生命周期词表（`done` 词 = 段属主的完成态关键字）；
 *  - §4/§6 无项——主 agent 的 status 写域**仅 §1**（§4/§6 状态面走普通文档写，与 D-BR18 分工一致）。
 * 词面纪律（最小词面）：一条状态行值只带**一个**关键字——校验面（batch 工具 status）拒绝内嵌另一冻结词的
 * 值（含「进行中…已收口」双词 ⇒ 已收口优先误冻结——2026-09-20 词面纪律）。emoji / 括注 / 日期后缀容忍
 * （**读侧** gate 判定 = 子串包含，同 gate——写入面 value 谓词自本批起收紧为「剥装饰白名单后余核 = 关键词」，
 * 见 batch-lifecycle.mjs）；全词表并集 = 各段项去重集合（note 字段零命中的判据——括注永不误触 gate）。
 */
export const STATUS_WORDS = Object.freeze({
  1: Object.freeze({ open: "进行中", closed: "已收口" }),
  2: Object.freeze({ open: "进行中", done: "设计完成" }),
  3: Object.freeze({ open: "进行中", done: "评审通过" }),
  5: Object.freeze({ open: "进行中", done: "实施完成" }),
})

/** 段状态行**旧字面兼容别名表**（只用于**读侧**：写侧词表零别名——旧字面写不进去，词表外拒）。
 *  §3 自 2026-10-27 起只留一个完成词 `评审通过`（只有 pass 叫完成；`changes-required` 不写状态词——
 *  「评审没通过」= 评审未完成）。存量批档里的旧字面 `评审完成` 读侧等义于 `评审通过`（存量档**不回填**
 *  ——已冻结档不改字节）。**退场条件**：盘上再无该字面（判据 = `grep -r '评审完成' docs/batches`）。 */
export const STATUS_WORD_ALIASES = Object.freeze({
  3: Object.freeze({ "评审完成": "评审通过" }),
})

/** 身份 → 可写段号（append 段白名单的**子代理面**——原 batch-segment.mjs 逐字迁移；主 agent
 *  的 depth-0 白名单（模式感知——工程 §1/§4/§6 · §1 ∥ 普通 §1/§2/§4/§5/§6 · §1/§2/§5，§4.16）
 *  由身份判据在 batch.mjs / batch-lifecycle.mjs 分支，不经本表。旧 batch-segment.mjs 导出面等价
 *  保持——本符号经 batch.mjs re-export（过渡 shim 面零触）。**表零字面改**——普通模式另立增表
 *  `SEGMENT_BY_ROLE_NORMAL`（合并查只在普通模式分支）；工程面「逐字不变」判据据此成立。 */
export const SEGMENT_BY_ROLE = { "eng-designer": 2, "eng-coder": 5 }

/** 普通模式增表（§4.16——**合并查只在普通模式分支**，工程模式分支不消费本表）：coder 承办 ⇒ §5
 *  实施记录（可选绑定自写——未绑定由主 agent 代记、行内注明来源）。 */
export const SEGMENT_BY_ROLE_NORMAL = { "coder": 5 }

/** depth-0 段白名单（§4.16——**模式键两集**；工程面判定字面逐字保持、普通面新增）：
 *  append：工程 = §1/§4/§6 ∥ 普通 = §1/§2/§4/§5/§6（§2 = 设计师席并入主 agent；§5 = 直做实施记录）；
 *  status：工程 = §1 ∥ 普通 = §1/§2/§5（写域仍「调用者自己段」；`segment` 缺省 = §1）。 */
export const DEPTH0_SEGMENTS = Object.freeze({
  append: Object.freeze({ engineering: Object.freeze([1, 4, 6]), normal: Object.freeze([1, 2, 4, 5, 6]) }),
  status: Object.freeze({ engineering: Object.freeze([1]), normal: Object.freeze([1, 2, 5]) }),
})

/** §1 状态行前缀形态（`**状态行**：` 独立行——表格行 / 块引用行不命中；判定只认关键字）。 */
export const STATUS_LINE_RE = /^\s*\*\*状态行\*\*[：:]\s*(.*)$/

const ZONE_END_RE = /^#{2,}/ // 段头区界：任意 `##` / `###` 起的行（写面与触发读面同一条判据）

/**
 * 骨架死占位**枚举单源**（F11-C 判据——create 骨架产出过的全部死占位字面）：
 *  - `#<编号>` / `<板块>` = 现行骨架仍在产出的两处（台账行——填充人 = 主 agent，时点 =
 *    建档后、本档首个 append/status 之前）；
 *  - `<BATCH-ID>` / `<讨论来源>` = 改形**删除**的两处旧占位（create 不再产出；旧档残留同判）。
 * 判据 = 枚举而非泛形正则：`<[^>]{1,40}>` 一类泛形会误杀正文合法尖括号（`Error: <message>` /
 * 泛型 `Array<T>` / 讨论字面本身）与 `<§N 模板占位：…>` 合法暂存行（append 不删行——段内留存
 * 是常态）——设计档 `TOOLS.md` 6.15 裁定点④。
 */
export const TEMPLATE_PLACEHOLDERS = ["<BATCH-ID>", "<讨论来源>", "#<编号>", "<板块>"]

/** 档头结构行值形（骨架三类——标题行 `# …` / 编制行 `> 编制` / 台账行 `> 台账`）：判据可辨性收正
 *  （`TOOLS.md` §6.20）后只有这三类行参与死占位判定；骨架↔结构行不变量 = `batchSkeleton` 产出中
 *  枚举字面 ⊆ 本三类行（骨架改形与判据同拍——结构行外新增占位 = 静默漏检）。 */
const HEADER_STRUCTURAL_RE = [/^#\s/, /^>\s*编制/, /^>\s*台账/]

/**
 * 死占位残留扫描（F11-C——append/status 落笔前的机检；**纯函数 · 零 fs**）。
 * 判定域 = **档头结构行**（区域 = 档首至首个 `## §N` 段头前；值形 = 骨架三类结构行：标题行 `# …` / 编制行
 * `> 编制` / 台账行 `> 台账`）——行内出现枚举字面 ⇒ 残留；段体（首段头起）任意位置出现字面 = 正文引用 ⇒
 * **豁免**（引用非未填——2026-10-05 判据可辨性收正，`TOOLS.md` §6.20；原全域子串扫描分不清两者——本批 §1 首投实害）。
 * @param {string} src — 档全文
 * @returns {Array<{line: number, text: string}>} 残留列表（空 = 无残留）；
 *   `line` = 档头域内 1-based 行号（档头域自档首行起——便于定位），`text` = 命中行 trim 原文
 */
export function findPlaceholderResidue(src) {
  const firstSection = /^## §\d/m.exec(src)
  const out = []
  src.slice(0, firstSection ? firstSection.index : 0).split("\n").forEach((line, i) => {
    if (!HEADER_STRUCTURAL_RE.some((re) => re.test(line))) return
    if (TEMPLATE_PLACEHOLDERS.some((ph) => line.includes(ph))) out.push({ line: i + 1, text: line.trim() })
  })
  return out
}

/**
 * 占位残留拒绝句（F11-C——append / status 两个挂点共用单源文案；逐行列残留：行号 + 原文）。
 * 错误句前缀 = `batch:`（本批新增错误面——与 append 迁移面的 `batch_segment:` 旧面不混）。
 * 逐字 = `TOOLS.md` §6.20 拒句表（「or your target section」半句随判定域收正退场）。
 * @param {Array<{line:number,text:string}>} residues — findPlaceholderResidue 的返回值（非空）
 * @returns {string} 完整拒绝句（调用方 throw new Error(...)）
 */
export function placeholderResidueError(residues) {
  const list = residues.map((r) => `  档头 line ${r.line}: ${r.text}`).join("\n")
  return "batch: 骨架死占位残留 — the batch record's header still carries skeleton placeholders. " +
    "Fill them before writing: create with ledger / board fills the 台账 line at creation; otherwise the main agent fills the header by file edit ⇒ the record's first append/status opens. " +
    `Nothing was written. Residue:\n${list}`
}


/**
 * §1 状态行解析（冻结门与 lifecycle 共用的**单源解析器**——原 batch-segment.mjs 逐字迁移，
 * 字面「已收口/进行中」改为消费 STATUS_WORDS[1]，行为零变）：解析对象 = §1 **段头区**内
 * `**状态行**：` 前缀行（`## §1` 标题之后、下一 `^#{2,}` 之前——与写面同一条定位面；
 * 段体 / 轮次块里引述的状态行不参与判定）。判定只认关键字（emoji / 括号装饰 / 日期后缀容忍）：含「已收口」→ "closed"
 * （冻结优先）、含「进行中」→ "open"；无 §1 / 无该行 / 两关键字皆不命中 → "unknown"
 * （fail-closed 视为冻结）。
 */
export function readBatchStatusLine(src) {
  const lines = sectionHeaderZoneLines(src, 1) // 段头单源（段头缺失 ⇒ null；与 isBatchRecord 同一段头正则）
  if (lines === null) return "unknown"
  const m = lines.map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)
  if (!m) return "unknown"
  const value = m[1].trim()
  if (value.includes(STATUS_WORDS[1].closed)) return "closed"
  if (value.includes(STATUS_WORDS[1].open)) return "open"
  return "unknown"
}

/**
 * 段内状态行**单行改写**（status / close / 重开三处共用——改写面之一，域限状态行；另两处 = §2 段体区间改写
 * （`edit`，§4.19）∥ 重开追记行（§4.18-B），三处都不动其余字节）：定位 `## §N` 段
 * （sectionHeaderRe 单源），**段头区**（标题行之后、下一 `##` / `###` 起行之前）内首命中行原位替换（行尾随命中行
 * 自身）；区内无该行 ⇒ 沿用既有插入形（状态行 + 两空行，段头后原有空行不动；插入块行尾 = 标题行自身行尾）。
 * 区外正文（轮次块引述的 `**状态行**：…` 行）字节零变——住所只有段头区，§1–§5 同一规则，无按段分支。
 * 字节零变（行切分 = /\r?\n/：EOL 形态无关）；段标题缺失 ⇒ throw（create 是骨架唯一权威入口）；纯字符串变换（零 fs）。
 * @param {string} src — 档全文
 * @param {number|string} seg — 段号
 * @param {string} value — 状态行值（`**状态行**：<value>`）
 * @returns {string} 改写后全文
 */
export function updateSectionStatusLine(src, seg, value) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) {
    throw new Error(`batch: the batch record has no "## §${seg}" section header — cannot update its status line (create is the skeleton's only authoritative entry; append/status never add one). Nothing was written.`)
  }
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const endIdx = next ? next.index : src.length
  const line = `**状态行**：${value}`
  const parts = src.slice(hdr.index, endIdx).split(/(\r?\n)/) // 保留分隔符（奇数下标 = 行尾）——替换只动命中行
  const zoneEnd = parts.findIndex((p, i) => i >= 2 && ZONE_END_RE.test(p)) // 段头区界下标（0 = 段头行自身，不判）
  const limit = zoneEnd < 0 ? parts.length : zoneEnd
  const idx = parts.findIndex((p, i) => i < limit && STATUS_LINE_RE.test(p))
  if (idx >= 0) { parts[idx] = line } else {
    const eol = parts[1] === "\r\n" ? "\r\n" : "\n" // 缺行插入块行尾 = 标题行自身行尾
    if (parts.length === 1) parts.splice(1, 0, eol, line, eol, "", eol, "")
    else parts.splice(2, 0, line, eol, "", eol, "", eol)
  }
  return src.slice(0, hdr.index) + parts.join("") + src.slice(endIdx)
}

/**
 * §N 段状态词解析（读面单源，设计档 §2.5 的单源表）：段头（sectionHeaderRe）/ 状态行正则（STATUS_LINE_RE）/
 * 词表（STATUS_WORDS）全消费既有单源常量——与冻结门字面零漂移。**取值区只有一个 = 段头区**（`## §N` 标题行
 * 之后、下一 `^#{2,}` 之前，与写面 `updateSectionStatusLine` 同一条定位面）；区外正文引述的 `**状态行**：…`
 * 既不被改写，也不构成结论。区内命中按**终态词优先**（closed / done 先于 open——镜像冻结门取值序）⇒ 返回该关键词；
 * 段头缺失 / 无该行 / 无命中 ⇒ null。`§4` / `§6` 无词条 ⇒ 字面 `无状态词`（不造词）。
 * @param {string} src — 档全文
 * @param {number|string} seg — 段号（`2` / `"2"`——同 sectionHeaderRe 消费形）
 * @returns {string|null} 已识别关键词 / null / 字面「无状态词」（§4 / §6）
 */
export function readSectionStatusWord(src, seg) {
  const words = STATUS_WORDS[seg]
  if (!words) return "无状态词"
  const lines = sectionHeaderZoneLines(src, seg)
  if (lines === null) return null
  const m = lines.map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)
  if (!m) return null
  const value = m[1].trim()
  // 旧字面先映到规范词（读侧等义——写侧词表零别名）
  for (const [alias, canonical] of Object.entries(STATUS_WORD_ALIASES[seg] ?? {})) {
    if (value.includes(alias)) return canonical
  }
  for (const w of [words.closed, words.done, words.open]) {
    if (w !== undefined && value.includes(w)) return w
  }
  return null
}

/**
 * 轮次块标题形态（**写面与读面的单源正则**）：§3 的轮次块只由工具戳
 * `### 轮次 N（评审子代理）` 标题——写入面 `batch.mjs` 丢弃调用方自带的同名行、按本形态计数
 * 生成 N；读面（结算点 §3 落地门的轮次块计数）读同一形态。两份正则必漂，故只留这一处
 * （`docs/core/design/ADVISOR-GUARDS.md` §1.1 判据 1）。`### 轮次与发现（…）` 骨架行不匹配。
 */
export const ROUND_HEADING_RE = /^### 轮次 \d+（评审子代理）/

/**
 * §N 段内轮次块计数（纯函数 · 零 fs）：段体逐行测 `ROUND_HEADING_RE`。段头缺失 ⇒ 0
 * （无 §3 段 = 评审写不进 §3 ⇒ 结算面判 `no-section3-block`，不是「跳过」）。
 * 消费点两处、同一形态：`batch.mjs`（写入面生成下一轮 N）∥ `design-token.mjs`
 * （结算点判「§3 已被本轮写过」——块数 > 点火基线）。
 * @param {string} src — 批档全文
 * @param {number|string} [seg] — 段号（缺省 3——轮次块只落 §3）
 * @returns {number} 段内轮次块数
 */
export function countRoundBlocks(src, seg = 3) {
  if (typeof src !== "string") return 0
  const lines = sectionBodyLines(src, seg)
  if (lines === null) return 0
  return lines.filter((l) => ROUND_HEADING_RE.test(l)).length
}

/**
 * §N 段内**最后一个轮次块的文本**（纯函数 · 零 fs）：块首行 = 该 `### 轮次 N（评审子代理）` 标题行，
 * 块尾 = 段体末尾——本函数只取最后一块，故不需要「到下一块止」的切分（后随行都属该块）。
 * 消费面 = `§5` 写入门判据 2：「门所依赖的那个块，自己有没有说结论」（设计档
 * `BATCH-LEDGER-REVIEW-UNIFY.md` §2.6）。
 * **只切块、不判裁定**：裁定一律由两条既有锚判——`VERDICT_CHANGES_LINE`（本档）∥ `VERDICT_PASS_LINE`
 * （本档锚块），判定面不在这里。切块形态消费 `ROUND_HEADING_RE`
 * （与 `countRoundBlocks` / `nextRoundNumber` 同一份正则，不另写一套）。
 * @param {string} src — 批档全文
 * @param {number|string} [seg] — 段号（缺省 3——轮次块只落 §3）
 * @returns {string|null} 末块文本（含块首行）∥ `null`（段头缺失 ∥ 段内无块）
 */
export function lastRoundBlock(src, seg = 3) {
  if (typeof src !== "string") return null
  const lines = sectionBodyLines(src, seg)
  if (lines === null) return null
  let start = -1
  for (let i = 0; i < lines.length; i++) if (ROUND_HEADING_RE.test(lines[i])) start = i
  return start < 0 ? null : lines.slice(start).join("\n")
}

/**
 * 段内**下一轮**轮次号（`countRoundBlocks + 1` 的组合名——**不二次实现计数**）：写入面
 * （`batch.mjs` 的 `insertIntoSection` 盖戳 `### 轮次 N`）与打回重置（`statusResetPlan` 的留痕行
 * 「第 N 轮打回」）必须取同一个 N——各算一遍，将来改了 `ROUND_HEADING_RE` 就会一处变一处不变。
 * @param {string} src — 批档全文（写盘前）
 * @param {number|string} [seg] — 段号（缺省 3——轮次块只落 §3）
 * @returns {number} 本轮 N（1 起）
 */
export function nextRoundNumber(src, seg = 3) {
  return countRoundBlocks(src, seg) + 1
}

/**
 * 裁定行锚（**写入面与签发面共读一条正则**，2026-10-28 自 `design-token.mjs` 迁入）：打回重置
 * （`statusResetPlan`）判「本笔带不带打回裁定」，设计凭证裁定闸（`design-token.mjs` 的
 * `verdictGateFailure`）判「回执给没给打回」，两处读同一份锚形——锚只此一份，不复制到第二档、
 * 也不由两档各写一遍。四条锚（`_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` / `VERDICT_PASS_LINE`）全住本档锚块——
 * 签发面、`§5` 写入门与通过置位经 import 同读，零复制（pass 锚迁入：置位判据住本档，留在签发面就要回 import 而成环）。
 * 本地化等价形（GitHub #32 / #14）：评审席用中文回执很常见，只认英文会让 pass 落成 `no-pass-line`、
 * 凭证永不签发；判据仍只认**整行逐字面**，不做「句中含『通过』」这类模糊匹配——那样会把「未通过」
 * 也放过（散文行内提及不触发）。
 * **两个中文分支的尾句号可省可带**（`结论：通过。` ∥ `VERDICT: 通过。` 同判 pass，打回侧同）：同一个锚、
 * 两条分支，对同一语义必须给同一结论——`VERDICT: 通过。` 判是而 `结论：通过。` 判否是锚内的不对称；
 * 打回侧缺它则 `结论：不通过。` 读成「无裁定行」⇒ `append §3` 误拒一笔真打回，且打回重置不触发。
 * 英文形不带句号（`VERDICT: pass。` 不认，与改前一致）；混合形（`**结论** = VERDICT: pass`）不是句号问题，
 * 是把两种写法混成第三种，仍不认。
 */
export const _V_PRE = "^[ \\t]*[*_`]*[ \\t]*"
export const _V_SUF = "[ \\t]*[*_`]*[ \\t]*$"
export const VERDICT_CHANGES_LINE = new RegExp(
  _V_PRE + "(?:VERDICT:[ \\t]*(?:changes-required|不通过。?|需修改。?)|结论[:：][ \\t]*(?:不通过。?|需修改。?|changes-required))" + _V_SUF, "mi")
/** pass 裁定行锚（与打回锚同处同形）：签发面 ∥ `§5` 写入门判据 2 ∥ 通过置位三处同读；`design-token.mjs` 原样再导出。
 *  两锚的组合序只住下面一个函数 `verdictGapOf`——三个消费面经它取值，谁也不自写一遍顺序。 */
export const VERDICT_PASS_LINE = new RegExp(
  _V_PRE + "(?:VERDICT:[ \\t]*(?:pass|通过。?)|结论[:：][ \\t]*(?:通过。?|pass))" + _V_SUF, "mi")

/**
 * 裁定读数（**判据单源**——设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1）：值域四格 =
 * `null`（说了 pass）∥ `「无裁定行」` ∥ `「VERDICT: changes-required」` ∥ `「两者同携」`；判定序
 * **先打回、后 pass**（两行同携 ⇒ 判打回——同一份回执在两个面上不能结论相反）。
 * 三个消费面同读这一个函数，各自只做自己那一层的映射，不再各写一遍组合序：
 *  - `§5` 写入门判据 2（`batch-closeout.mjs` 的 `lastRoundVerdictGap`）——原样取四格；
 *  - `append §3` 写入闸（`batch.mjs`）——只拒 `「无裁定行」` ∥ `「两者同携」`，判打回的一笔照写；
 *  - 签发面（`design-token.mjs` 的 `verdictGateFailure`）——四格映回它原有的两个词
 *    （`changes-required` ∥ `no-pass-line`），对外说法零改。
 * 入参是**文本**而不是块：写面手上是「本笔净化后正文」，落档的就是它（每笔 `§3` 自成一块）——为复用切块
 * 函数把未落盘文本伪装成块，会把「段内无块」的 `null` 语义带进写面。
 * @param {string|null|undefined} text — 一段文本（本笔净化后正文 ∥ 末块正文 ∥ 评审回执）
 * @returns {string|null} 上方四格之一；非串 ⇒ `「无裁定行」`（无文本即无裁定，fail-closed）
 */
export function verdictGapOf(text) {
  if (typeof text !== "string") return "无裁定行"
  const changes = VERDICT_CHANGES_LINE.test(text)
  const pass = VERDICT_PASS_LINE.test(text)
  if (changes) return pass ? "两者同携" : "VERDICT: changes-required"
  return pass ? null : "无裁定行"
}

/**
 * 打回即重置的计划形（**纯函数 · 零 fs**；`batch.mjs` 与 `insertIntoSection` 在同一笔写盘里消费）。三合取全中
 * ⇒ `{ roundN, statusValue, traceLine }`，否则 `null`（零写 = 零回归）：① 本笔写 §3；② 本笔**净化后**正文命中
 * 打回裁定行（`VERDICT_CHANGES_LINE` 单源）；③ 写这一笔之前 §3 **段头区**状态行 = `STATUS_WORDS[3].done`
 * （**取词表，不写死字面**——写死则词表一改这条判据静默失效；读区与写面同一条定位面）。
 * 为什么必须机械：状态行是下游 `§5` 写入门 ∥ 收口门 ∥ 核销门③ 的唯一判据面；「评审记得把状态行改回去」
 * 是一条纪律，而纪律在打回那一轮最易漏。为什么第 ③ 条要「上一轮 = done」而非无条件：§3 已是 `进行中`
 * （本来写着「评审未完成」）⇒ 重置无事可做，零写零留痕；顺序交接的批（首轮 pass）因此不误伤。
 * 状态行值 = 关键词 + 括注（**不新增第三态词**：词表零扩即读侧零改）；留痕行把「上一轮 pass 被这一轮推翻」
 * 留在 §3 段体——重置不等于清空，否则读档的人会以为从没评过。权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5。
 * @param {string} src — 写盘前的档全文
 * @param {number|string} seg — 本笔的目标段号
 * @param {string} body — 本笔净化后正文（凭证已剥、伪造戳已丢）
 * @param {string} date — 留痕行的日期戳 `YYYY-MM-DD`（调用方取 `todayLocal`——日期口径只一处）
 * @returns {{roundN:number, statusValue:string, traceLine:string}|null}
 */
export function statusResetPlan(src, seg, body, date) {
  if (Number(seg) !== 3) return null
  if (typeof body !== "string" || !VERDICT_CHANGES_LINE.test(body)) return null
  if (readSectionStatusWord(src, 3) !== STATUS_WORDS[3].done) return null
  const roundN = nextRoundNumber(src, 3)
  const { open, done } = STATUS_WORDS[3]
  return {
    roundN,
    statusValue: `${open}（第 ${roundN} 轮打回）`,
    traceLine: `> 状态行重置：第 ${roundN} 轮打回（changes-required）· 上一轮状态行 = ${done} → ${open} · ${date}`,
  }
}

/**
 * 通过即置位（**纯函数 · 零 fs**；与 `statusResetPlan` 同签名同位置、同写面）= 「打回即重置」的对称另一半。三合取
 * ① 本笔写 §3 ② 净化后正文命中 `VERDICT_PASS_LINE` **且不命中** `VERDICT_CHANGES_LINE` ③ 写前 §3 **段头区**状态行
 * ≠ `STATUS_WORDS[3].done`（读区与写面同一条定位面——区外引述行不构成结论）⇒ `{ roundN, statusValue }`，否则 `null`。
 * 为什么必须机械：结算面（`design-token.mjs` 判据 2）读这一行，≠ 评审通过 就拒签——「评审记得补一次 `status`」是
 * 纪律，漏一次白跑一轮评审。为什么 ③ 与打回反向：打回要「上一轮 = done」（推翻已落的字），通过要「当前 ≠ done」
 * （补上没落的字）⇒ 两条计划天然互斥，不另立「同现即拒」判据面；② 排除打回行则因同携两行是自相矛盾的回执，签发面
 * 先打回后 pass ⇒ 同判打回（状态行与门同结论）。不写留痕行：块自己说了 pass，落进 §3 的块即记录（打回留痕是因为
 * 重置**抹掉**了一条已落的 pass）；`roundN` / `date` 无消费方，保留 = 同签名同形。权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5。
 * @param {string} src — 写盘前的档全文
 * @param {number|string} seg — 本笔的目标段号
 * @param {string} body — 本笔净化后正文（凭证已剥、伪造戳已丢）
 * @param {string} date — 与 `statusResetPlan` 同签名（本方向无留痕行，不消费）
 * @returns {{roundN:number, statusValue:string}|null}
 */
export function statusPassPlan(src, seg, body, date) {
  if (Number(seg) !== 3) return null
  if (typeof body !== "string" || !VERDICT_PASS_LINE.test(body)) return null
  if (VERDICT_CHANGES_LINE.test(body)) return null
  if (readSectionStatusWord(src, 3) === STATUS_WORDS[3].done) return null
  return { roundN: nextRoundNumber(src, 3), statusValue: STATUS_WORDS[3].done }
}

/**
 * 「不适用」声明行形态（**声明机制已退役**——2026-11-02 用户裁定封掉这条口子）：形 = `> 不适用：§N —— <理由>`，
 * 理由非空（`\S.*` = 至少一个非空白字符起头）；识别域 = §1 段体。退役后本正则只服务**痕迹检测**
 * （`malformedInapplicableLine`）：`§1` 里还写着声明行的人当场被拒并读到「这条路没有了」，而不是静默当作没写。
 * 删掉它，残留的声明行就成了一句无人过问的散文——写它的人不会知道自己抄的是一条已停用的路。
 */
const INAPPLICABLE_RE = /^>\s*不适用[：:]\s*§(\d+)\s*——\s*(\S.*)$/
/** 可声明的段号集 = **空集**（声明机制退役）：任何段都不得声明不适用——§2 设计 / §3 评审 / §4 批准 /
 *  §6 验证各段一律要有内容，§5 段号豁免不参与链门。清空这一个常量即达成判据：窄网（`INAPPLICABLE_RE`）
 *  与宽网（`INAPPLICABLE_PREFIX_RE`）之下，凡 `§1` 出现声明行都是非法行；段内容判据只剩「有内容 / 没内容」
 *  两态。旧的可读面函数与 `not-applicable` 分支已随本批删除——不另立「恒 false 的插座」，插座留着就会被
 *  重新接上。 */
export const INAPPLICABLE_SEGMENTS = []
/** §1 声明行的识别前缀（痕迹扫描的宽网——行首命中它即违规，不再区分形合规与否）。 */
const INAPPLICABLE_PREFIX_RE = /^>\s*不适用/

/** §N 段体行集（段头缺失 ⇒ null——create 是骨架唯一权威入口；行切分 = /\r?\n/——EOL 形态无关）。 */
function sectionBodyLines(src, seg) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) return null
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const body = src.slice(hdr.index + hdr[0].length, next ? next.index : src.length)
  const nl = body.indexOf("\n") // 跳过段头行余文（`## §N …` 的标题部分）
  return (nl >= 0 ? body.slice(nl + 1) : "").split(/\r?\n/)
}

/** §N **段头区**行集（段级状态行的唯一住所：`## §N` 标题行之后、下一个 `##` / `###` 起行之前；段头缺失 ⇒ null）。 */
function sectionHeaderZoneLines(src, seg) {
  const lines = sectionBodyLines(src, seg)
  if (lines === null) return null
  const end = lines.findIndex((l) => ZONE_END_RE.test(l))
  return end < 0 ? lines : lines.slice(0, end)
}

/**
 * 段内容判据**单源**（§4.18-A closeout chain gate 的判空口径；D-BR30 判据单源——**不许两套**；
 * §4.13 的 §6 旧判据 `sectionSixHasContent` 改由本谓词承担——§6 为唯一缺段时拒串仍取旧函数）。
 * 返回**两态**：`content`（段体至少一行非排除类）∥ `empty`。旧第三态 `not-applicable` 随声明机制退役
 * （2026-11-02：任何段都不得声明不适用 ⇒ 这条事实没有第二个满足面，判据只剩「有内容 / 没内容」）。
 * 排除类（判空依据——「标题在、正文零行」判空）：空行 ∥ 标题行（`^#{1,6}\s`）∥ `**状态行**：` 行 ∥
 * `<§N 模板占位：…>` 行 ∥ 「不适用」声明行（判空口径零改——那类行是停用机制的痕迹，本来就不算内容）。
 * 口径收正注：旧 `sectionSixHasContent` 对「只有子标题（`### …`）」判非空；本谓词按 §4.18-A 判空
 * （子标题属排除类标题行）——设计档 §4.18-A 明文收窄。
 * @param {string} src — 档全文
 * @param {number|string} seg — 段号（§1–§6；§1 恒 `content`——主 agent 自述段不设前置）
 * @returns {"content"|"empty"} 段内容两态
 */
export function sectionContentState(src, seg) {
  const n = Number(seg)
  if (n === 1) return "content"
  const lines = sectionBodyLines(src, n)
  if (lines === null) return "empty" // 段头缺失 = 空（骨架由 create 一次预写；缺失即无内容）
  return lines.some((l) => NONEMPTY_RE.test(l) && !EXCLUDED_LINE_RE.test(l)) ? "content" : "empty"
}

/** 非空白行谓词（空行排除）。 */
const NONEMPTY_RE = /\S/
/** 排除类行判据：标题行（`^#{1,6}\s`）∥ `**状态行**：` 行 ∥ `<§N 模板占位：…>` 行 ∥ 「不适用」声明行
 *  （空行由 NONEMPTY_RE 单独排除——四类合一次判定）。 */
const EXCLUDED_LINE_RE = /^#{1,6}\s|^\s*\*\*状态行\*\*[：:]|^<§\d+ 模板占位[：:]|^>\s*不适用/

/**
 * 声明行拒绝句（§4.18-A J3——**声明机制已退役**：`§1` 段体出现任何 `> 不适用` 行 ⇒ 拒）：
 * 拒文说清三件——声明这条路没有了 ∥ 每段各自要有内容（§5 豁免）∥ 点名违规行。
 * 措辞不再给「合法声明形」——给形 = 给一条可照抄的路，而本批封的正是这条路。
 * @param {string} line — 违规行原文
 * @returns {string} 完整拒绝句（调用方 throw new Error(...)）
 */
export function inapplicableDeclarationError(line) {
  return "batch: `不适用` 声明已停用（inapplicability declaration retired）— no declaration is accepted: " +
    "§2 / §3 / §4 / §6 must each carry content (§5 exempt). " +
    `Offending line: ${line}. Nothing was written.`
}

/**
 * §1 声明行机械扫描（链门前置判据——**出现即拒**，不静默）：识别域 = §1 段体。
 * 段号集 `INAPPLICABLE_SEGMENTS` 已清空 ⇒ `includes` 恒 false ⇒ 行首命中 `^>\s*不适用` 的每一行
 * （形合规与否一律）都是违规行，返回首个。本函数现在是**停用机制的痕迹检测器**，不是合法形校验器。
 * @param {string} src — 档全文
 * @returns {string|null} 首个声明行原文 / null
 */
export function malformedInapplicableLine(src) {
  for (const l of sectionBodyLines(src, 1) ?? []) {
    if (!INAPPLICABLE_PREFIX_RE.test(l)) continue
    const m = INAPPLICABLE_RE.exec(l)
    if (!m || !INAPPLICABLE_SEGMENTS.includes(Number(m[1]))) return l
  }
  return null
}

/**
 * §N 段内「`**状态行**：` 行存在性」判据（#422③——close 对无状态行档自建机读位的**采集面**：
 * 与 readBatchStatusLine 的「值可解析」正交——无行 ⇒ 可自建；有行而值不可解析 ⇒ 仍 fail-closed）。
 * 段界定消费 sectionHeaderRe（同单源——`## §20` 不误命中 `§2`）。
 * @param {string} src — 档全文
 * @param {number|string} seg — 段号
 * @returns {boolean} 段内是否存在形态匹配行（段头缺失同判 false）
 */
export function sectionHasStatusLine(src, seg) {
  const hdr = sectionHeaderRe(seg).exec(src)
  if (!hdr) return false
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const body = src.slice(hdr.index + hdr[0].length, next ? next.index : src.length)
  return body.split(/\r?\n/).some((line) => STATUS_LINE_RE.test(line))
}

/**
 * create 骨架模板（BATCH-RECORD.md §4.10 行为规格的**代码单源**——红线：模板只覆盖骨架与占位，不模板化内容）：
 * `## §1–§6` 段头（含职责署名）+ 档头 boilerplate（**两句形**：六段一段一作者句 + 每段只有一个作者句（作者对本段可 `append` 加内容 ∥ 可 `edit` 就地改，§4.10「档头两句」/ §4.19），加编制行 + 台账/前情指针行）+ §1 段内
 * **占位状态行**（含 gate 合法关键字「进行中」——建档即过 gate；整行不含「已收口」——gate 已收口优先，占位
 * 行不得携带冻结词）+ 各段模板子标题占位。已知实参替换：date / topic / **source** / prev（§4.11 参数面 +
 * F11-B——source 必填、prev 入值过幂等剥前缀，归一化在 lifecycle 面）；`ledger` = **必填**（2026-10-27 起建档
 * 同拍建台账行——真实行号由绑定事务回填，永不落回 `#<编号>` 占位）；`board` 可选（未给 ⇒ 括注写 `—`——`board`
 * 是分类不是身份，不拒）。本批改形删除（F11-B）：旧 `# …（<BATCH-ID>）` 后缀与 `来源 = <讨论来源>` 占位实参化。
 * 模式取形（§4.16——普通模式变体**四处替换**、余行逐字同；`mode` 缺省 = "engineering" ⇒ 工程产出逐字不变）：
 * ① 汇总行 §2/§5 标签；② `## §2` 段头；③ §2 状态占位句；④ `## §5` 段头。
 */
export function batchSkeleton({ date, topic, source, prev, ledger = null, board = null, mode = "engineering" }) {
  const normal = mode === "normal"
  const designerSeat = normal ? "主 agent" : "eng-designer" // ① 汇总行 §2 标签 ∥ ② §2 段头
  const implementerSeat = normal ? "实施者：主 agent ∥ coder" : "eng-coder" // ① 汇总行 §5 标签 ∥ ④ §5 段头
  return [
    `# ${date} · ${topic}`,
    `> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（${designerSeat}）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（${implementerSeat}）· §6 验证与收口（父代理）。`,
    `> 每段只有一个作者：作者的段可 \`append\` 加内容、可就地改（\`edit\`，§4.19）；非作者一概拒。`,
    `> 编制：主 agent · ${date} · 来源 = ${source}。`,
    `> 台账 = ${ledger ?? "#<编号>"}（${board ?? (ledger ? "—" : "<板块>")} · 归批）。前情 = ${prev}。`,
    "## §1 讨论（主 agent）",
    `**状态行**：🔄 ${STATUS_WORDS[1].open}（…）`,
    "<§1 模板占位：本批条目 / 关键判据 / 授权口径>",
    `## §2 批次任务与设计（${designerSeat}）`,
    `**状态行**：（${normal ? "主 agent" : "eng-designer"} 写入时更新）`, // ③ §2 状态占位句
    "<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>",
    "## §3 设计评审（评审子代理）",
    "## §4 用户批准（主 agent）",
    `## §5 实施记录（${implementerSeat}）`,
    "## §6 验证与收口（父代理）",
    "",
  ].join("\n")
}
