/**
 * doc-check/anchors.mjs — 文档纪律机检 · 起步判据 ①（锚）：指针抽取 + 解析序 + 节在盘判定。
 *
 * 判据句单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 判据 ①（本节只实现，不重述口径）：
 * · 文档指针 = 档 token（含 `.md`，可带目录段）± 节指示（紧随 `§` + 编号 N / N.M / N.M.K）；
 *   **行号坐标（`:N`）不作节指示**——行号不作引用；
 * · 档不在盘 ⇒ `档缺`；带节指示 ∧ 节不在盘 ⇒ `节缺`。
 * · 依据行（`依据 <档路径>「<逐字引文>」`——口径单源 = 同档 §3.25 条目 Y）：路径面走**同一解析序**，
 *   引文面要求「目标档全文里的一段连续子串」——不是 ⇒ `引缺`。不构成标记的行不判；不新增判据条数、
 *   不新增 verdict 词（三个命中类同计「锚 N 条」）。
 *
 * 抽取面：逐行扫；fenced 块整块跳过；可执行行（`isExecutableLine`）整行跳过（命令保字面）；
 *   提示词面另剥 CANON 操作数（面判据 = `./paragraph.mjs` 的 `isPromptFace`——七名整串删除后再抽，见 `CANON_OPERANDS`）。
 * 解析序**两级**（算法单源 = `../path-resolve.mjs` 的统一解析层，本档只声明本面参数）：
 *   ① 仓根相对全路径 → ② 引用方档所在目录相对。零命中 ⇒ `档缺`，并**列同名候选**（「你是不是指这个」——
 *   候选只作提示，**不产命中档**：裸名仍不跨目录解析，全域索引不建）。
 *   跨仓形（`仓名/相对路径`）⇒ **零命中**，回执记一行（声明源引用 / 须先声明——只判引用写对没有，不查存在性）。
 * 节在盘：**只读解析命中的那一档**（点查，不遍历）——目标档内存在标题行，其标题编号
 *   （标题文本去 `^#{1,6}\s` 后的首个 `\d+(?:\.\d+)*`）= 指针节号。
 * 残余登记（fail-open 方向——归评审核验面）：未闭合围栏 ⇒ 至档尾免；指针行的坐标尾不入判、同行的档 token 照判；
 *  **引文含 `」` 时只抽到第一个 `」`**（抽取段是 `[^」]`）——逐字引用一段内含「…」的句子时被验的只是前缀，
 *  错的后半段静默放行（方向是不误拦，不是不误放；这一半的最终裁定归评审核验面，同设计 §3.25「评审面」）。
 * 档名豁免（类名 ∥ 占位词干）的**判定只此一处** = 本档导出的 `docNameExemption`（判据单源 = §3.24 条目 X）：
 *   两张表保持私有、不上导出面；另两处消费面（兄弟脚本 ∥ 行号坐标清单）只拿判定、拿不到名单。
 */
import { readFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { docRootPaths, readManifest } from "../manifest.mjs"
import { resolvePathTarget } from "../path-resolve.mjs"
import { fenceMark, isFenceClose, isExecutableLine, isPromptFace } from "./paragraph.mjs"

/** `docRoot` 各键 → 绝对根集（**只作同名候选的扫描根**，不作受理边界——受理面仍是「档在盘 / 节在盘」）。
 *  读声明面单源 = `docRootPaths`（本档零自持根判定）；无 manifest / 非法 ⇒ 空集。 */
function docRootBaseKeys(root) {
  let man = { ok: false }
  try { man = readManifest(root) } catch { return [] }
  if (!man.ok) return []
  const docRoot = man.manifest?.docRoot
  if (!docRoot || typeof docRoot !== "object") return []
  const out = []
  for (const key of Object.keys(docRoot)) for (const abs of docRootPaths(docRoot[key], root)) if (!out.includes(abs)) out.push(abs)
  return out
}

/** 文档指针 token：`(目录段/)*名.md` + 可选行号坐标尾 + 可选节指示（`§` + 编号）。
 *  左界守卫排除更长 token 的尾段；右界排除后续字母数字（`.md` 之后紧邻 `[\w]` ⇒ 非完整 token）。 */
const ANCHOR_RE = /(?<![A-Za-z0-9_.\-\\/@<>])((?:[A-Za-z0-9_.\-]+\/)*[A-Za-z0-9_.\-]+\.md)(?::\d+(?:-\d+)?)?(?:\s*§\s*(\d+(?:\.\d+)*))?(?![\w])/g

/** 约定文件名（**类名**——文档在描述「会读哪些文件」、黑名单名字、`files` 字段值、测试数据）：不抽。
 *  依据 = 这些名字在仓根 / 兄弟目录不一定存在，它们指的不是「某个仓内档」。 */
const FILENAME_CLASSES = new Set([
  "agents.md", "claude.md", "skill.md", "project_rules.md",
  "changelog.md", "agent.md", "advisor.md", "todo.md", "todo-archive.md",
])

/** 占位符词干（示例写法 / 反例样本——`X.md` / `file.md` / `docs/batches/x.md` 类）：不抽。 */
const PLACEHOLDER_STEMS = new Set([
  "x", "a", "b", "file", "out", "foo", "bar", "example", "sample", "name", "path",
])

/** 扩展名闭集（档名后缀族——与 `thincoder-core/doc-check/line-refs.mjs` 的抽取式同一组枚举）：
 *  谓词按这一组剥后缀取词干。**两处必须同改**——两档互 import 会成环（`line-refs.mjs` 已 import 本档谓词），
 *  所以这里留一份，改扩展名族时两处一起改。 */
const DOC_EXTS = ["md", "mjs", "cjs", "js", "json", "css", "html", "svg", "yml", "yaml", "sh", "ps1"]

/** 依据行标记（口径单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.25 条目 Y「写法」表）：
 *  `依据` + 可选分隔符（`:` ∥ `：` ∥ `=`）+ 档路径（可带反引号）+ `「引文」`。
 *  「相邻」行 = 路径 token 与 `「` 之间**只允许分隔符与反引号**——夹进别的字符（散文词 ∥ 标点 ∥ 空白）
 *  就**不构成标记**，不判：讲写法的档里本就有「`依据` = 判据契约（…）＋用户裁定「…」」这类散文句，
 *  松判会把它们读成标记形，而批档恒在收口判域，一次假命中就拦一次合法收口。
 *  （`依据` 与路径之间、以及那个分隔符是否带空白不限——那一段不是判据要防的那一处。）
 *  扩展名族 = `DOC_EXTS`（与行号坐标族同组，单源）。
 *  **导出面说明**：源串导出只作**量法扫串的单一源**（改面单测档的「存量读数」用它，不再自建第二份字面）——
 *  生产行为不变，别处不去拼它。 */
export const CITE_RE_SRC = `依据\\s*[:：=]?\\s*\`?((?:[A-Za-z0-9_.\\-]+/)*[A-Za-z0-9_.\\-]+\\.(?:${DOC_EXTS.join("|")}))\`?[:：=]?「([^」]*)」`

/** 引文面的目标档读法（**同档一次读、同轮缓存**；CRLF→LF 归一——比较基准的形态单源）。 */
function citedTextReader() {
  const cache = new Map()
  return (abs) => {
    if (!cache.has(abs)) {
      let text = ""
      try { text = readFileSync(abs, "utf8") } catch { text = "" }
      cache.set(abs, text.replace(/\r\n/g, "\n"))
    }
    return cache.get(abs)
  }
}

/**
 * 档名豁免判定（**唯一一处** · 判据单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.24 条目 X）：
 * 三处消费同一个谓词——锚判（本档）∥ `scripts/prompt-refs-check.mjs`（J1 ∥ J3 命中过滤）∥ 行号坐标清单（`./line-refs.mjs`）。
 * @param {string} name 档名 = **末段名、不带目录段**，大小写不敏感
 * @returns {null|"filename-class"|"placeholder"} `"filename-class"` = 约定的类名（整名判，不剥后缀）；
 *   `"placeholder"` = 占位词干（按闭集剥后缀后取词干，词干 ≤ 1 字符或命中占位表）；`null` = 不是豁免名
 */
export function docNameExemption(name) {
  const bn = String(name ?? "").toLowerCase()
  if (FILENAME_CLASSES.has(bn)) return "filename-class"
  const dot = bn.lastIndexOf(".")
  const ext = dot > 0 ? bn.slice(dot + 1) : ""
  const stem = DOC_EXTS.includes(ext) ? bn.slice(0, dot) : bn
  if (stem.length <= 1 || PLACEHOLDER_STEMS.has(stem)) return "placeholder"
  return null
}

/** CANON 操作数族（**规范豁免串** · 判据单源 = `docs/core/design/PROMPT-SYSTEM.md` §6.6「判保留面」）：
 *  七个名字在模型面是**模型要写出来 / 读写的文件名**（行为操作数 · 路径操作数），不是「去读这个档」的指针——
 *  换个目录解析必然 `档缺`。**只对提示词面剥**（面判据 = `isPromptFace`，单源住 `./paragraph.mjs`）：`docs/` 面不会因本条多放行一个名——
 *  `README.md` / `MANIFEST.md` 在那里仍按指针判（其余四名早已走 `FILENAME_CLASSES` 类名免，非本条引入）。
 *  **一处定义、两处消费**：`scripts/prompt-refs-check.mjs` 的 J3 豁免从本档 import 本表与剥除函数（不复制）；
 *  反方向零 import——判据链自持 = `docs/core/design/DOC-DISCIPLINE.md` A-DD29 ⑤（`thincoder-core/**` 对
 *  `scripts/**` 的 import 点 = 0）。闭集外的同形 token（非操作数）照报。 */
export const CANON_OPERANDS = [
  "AGENTS.md", "SKILL.md", "README.md", "MANIFEST.md",
  ".thincoder/advisor.md", "project_rules.md",
  "RTM.md",
]

/** 操作数剥除：逐行先整串删除七名 CANON 操作数再抽（与 `scripts/prompt-refs-check.mjs` 的 J3 豁免同式）。 */
export function stripCanonOperands(line) {
  let out = line
  for (const s of CANON_OPERANDS) out = out.split(s).join("")
  return out
}

/** 操作数豁免的**作用面** = 提示词面（`thincoder-core/prompts/**`）——**只此一面**：`docs/` 面同名 token 仍按指针判
 *  （`README.md` / `MANIFEST.md` 在那里照报 `档缺`；其余四名走既有的 `FILENAME_CLASSES` 类名免，非本条引入）。
 *  这是锚判自己的面判据——与段判据零共享开关：段判据按传入档全量判（提示词面照判——逐行裸判，无面级豁免）。 */
// 提示词面判据单源 = `./paragraph.mjs` 的 `isPromptFace`（§3.18 ②——形态与旧 `OPERAND_FACE` 逐字同）。
const isOperandFace = isPromptFace

/** 标题编号（标题文本去 `^#{1,6}\s` 后的首个 `\d+(?:\.\d+)*`）；非标题行 ⇒ null。 */
function headingNumber(line) {
  const m = /^#{1,6}\s+/.exec(line)
  if (!m) return null
  const n = /\d+(?:\.\d+)*/.exec(line.slice(m[0].length))
  return n ? n[0] : null
}

/** 节在盘：目标档内任一标题行的编号 = 指针节号（字符串逐字等值——两处同归一形）。 */
function sectionOnDisk(path, num) {
  let text = ""
  try { text = readFileSync(path, "utf8") } catch { return false }
  for (const l of text.split("\n")) if (headingNumber(l) === num) return true
  return false
}

/** 档解析（判据 ① 的解析序两级——**算法单源 = 统一解析层** `../path-resolve.mjs`：本面只声明
 *  `kind:"file"` / `order:"root-first"`（与既有两级序逐字同序）/ `crossRepo:"visible"`（文档锚面是
 *  唯一开跨仓读数的面），`bases` = 无、`scanBases` = `docRoot` 各键（只喂同名候选提示）。
 *  行号坐标尾（`:N`）不参与档解析——token 只取 `.md` 段（抽取面已剥离坐标尾与节指示）。
 *  `num` = 指针节号（`§` 后编号；无节指示 ⇒ null）——仅用于判定节在盘，不参与档解析。
 *  @returns {{state:string, ...}} 层的四态结果 */
function resolveDoc(token, refFile, base, scanBases) {
  return resolvePathTarget(base, token, { kind: "file", order: "root-first", referrer: refFile, crossRepo: "visible", scanBases })
}

/**
 * 锚判据主行程：传入档逐档逐行抽取 + 解析 + 节在盘判定。
 * @param {string} root 项目根（解析序 ① 的基准）
 * @param {{files?:string[]}} o `files` = **判定集兼解析集**（调用方传入的档清单——判定范围 = 解析范围，
 *   无目录遍历、无全域索引：清单外的档既不判也不参与解析）
 * @returns {{hits:Array, crossRepo:Array}} hits = 命中（`档缺` / `节缺` / `引缺`——`档缺` 携 `sameName` 同名候选，
 *   `引缺` 携 `quote` 引文原文与 `target` 命中的档）；
 *   `crossRepo` = 跨仓引用读数（零命中、只入回执——§2.6 一行）
 */
export function checkAnchors(root, { files = [] } = {}) {
  const base = resolve(root)
  const scanBases = docRootBaseKeys(base)
  const hits = []
  const crossRepo = []
  const citedTextOf = citedTextReader() // 引文面：目标档全文（同档一次读、同轮缓存）
  for (const f of files) {
    let text = ""
    try { text = readFileSync(f, "utf8") } catch { continue }
    const re = new RegExp(ANCHOR_RE.source, "g") // 每档一份实例（零共享 lastIndex 状态）
    const citeRe = new RegExp(CITE_RE_SRC, "g") // 同上（引文标记面）
    const stripOperands = isOperandFace(f) // 只有提示词面剥（面判据 = `isPromptFace`）
    let fence = null // 围栏标记（` ∥ ~）；null = 不在块内
    text.split("\n").forEach((l, i) => {
      const mark = fenceMark(l)
      if (mark !== null) { // 围栏块整块跳过：起于围栏行、止于同形围栏行（未闭合 ⇒ 至档尾免）
        if (fence === null) fence = mark
        else if (isFenceClose(mark, fence)) fence = null
        return
      }
      if (fence !== null) return
      if (isExecutableLine(l)) return // 可执行行整行跳过
      const scan = stripOperands ? stripCanonOperands(l) : l // 提示词面：操作数先剥再抽；文档面 = 原行
      // ── 依据行（§3.25 条目 Y）：一行多处各自判；路径 token 的区间要记下来——锚抽取得跳过它，
      //    否则一个解析不到的 `.md` 路径会被两条判法各报一次（同一处缺陷两条命中）。
      //    **标记先成立才占区间**：空引文 ∥ 豁免名两条不构成「引文判的标记」——它们的 token
      //    仍归锚面照常判（既有类零改）：空引文那行里的悬空 `.md` 照旧 `档缺`，不会凭空消失。
      const cited = []
      if (scan.includes("依据")) {
        let c
        while ((c = citeRe.exec(scan)) !== null) {
          const token = c[1]
          const quote = c[2].trim()
          if (quote === "") continue // `「」` 空引文不构成标记（§3.25 边界：没有第二分支）
          // 豁免名（类名 ∥ 占位）在锚面不抽 ⇒ 引文面同判：同一 token 不得两套口径（§3.24 条目 X / F12 单源）
          if (docNameExemption(basename(token)) !== null) continue
          const start = c.index + c[0].indexOf(token)
          cited.push({ start, end: start + token.length })
          const r = resolveDoc(token, f, base, scanBases)
          if (r.state === "crossRepo") { crossRepo.push({ file: f, line: i + 1, token, ...r }); continue } // 跨仓：零命中，回执一行（同锚面）
          if (r.state !== "resolved") { // 路径先判存在性——两因不混（路径错 ⇒ `档缺`，引文错 ⇒ `引缺`）
            hits.push({ file: f, line: i + 1, token, clazz: "档缺", missing: r.state === "dangling" ? r.missing : "", sameName: r.state === "dangling" ? r.sameName : [] })
            continue
          }
          // 引文面：只判「是不是该档里的一段连续子串」——不折叠空白、不换全半角、不换算大小写（§3.25 边界）
          if (!citedTextOf(r.abs).includes(quote)) hits.push({ file: f, line: i + 1, token, clazz: "引缺", quote, target: r.abs })
        }
      }
      let m
      while ((m = re.exec(scan)) !== null) {
        const token = m[1]
        if (cited.some((c) => m.index >= c.start && m.index < c.end)) continue // 该 token 归引文判（上面已判，不重报）
        const num = m[2] ?? null
        // 类名 ∥ 占位符两免：抽取面不把它们当指针（判据 = DOC-DISCIPLINE §3.24 条目 X——
        // 判定只此一处，兄弟脚本与行号坐标清单消费同一谓词）
        if (docNameExemption(basename(token)) !== null) continue
        const r = resolveDoc(token, f, base, scanBases)
        if (r.state === "crossRepo") { crossRepo.push({ file: f, line: i + 1, token, ...r }); continue } // 跨仓：零命中，回执一行
        if (r.state !== "resolved") {
          hits.push({ file: f, line: i + 1, token, clazz: "档缺", missing: r.state === "dangling" ? r.missing : "", sameName: r.state === "dangling" ? r.sameName : [] })
          continue
        }
        if (num !== null && !sectionOnDisk(r.abs, num)) hits.push({ file: f, line: i + 1, token, clazz: "节缺", section: num, target: r.abs })
      }
    })
  }
  return { hits, crossRepo }
}
