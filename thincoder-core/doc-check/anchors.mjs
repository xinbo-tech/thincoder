/**
 * doc-check/anchors.mjs — 文档纪律机检 · 起步判据 ①（锚）：指针抽取 + 解析序 + 节在盘判定。
 *
 * 判据句单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 判据 ①（本节只实现，不重述口径）：
 * · 文档指针 = 档 token（含 `.md`，可带目录段）± 节指示（紧随 `§` + 编号 N / N.M / N.M.K）；
 *   **行号坐标（`:N`）不作节指示**——行号不作引用；
 * · 档不在盘 ⇒ `档缺`；带节指示 ∧ 节不在盘 ⇒ `节缺`。
 *
 * 抽取面：逐行扫；fenced 块整块跳过；可执行行（`isExecutableLine`）整行跳过（命令保字面）；
 *   提示词面另剥 CANON 操作数（面判据 = `./paragraph.mjs` 的 `isPromptFace`——七名整串删除后再抽，见 `CANON_OPERANDS`）。
 * 解析序**两级**：① 仓根相对全路径 → ② 引用方档所在目录相对。零命中 ⇒ `档缺`。
 *   **裸名不跨目录解析**：跨目录解析须先建全域目录索引——为认出一个裸名而重建索引，等于把全仓扫描请回来；
 *   写全路径后解析零索引，逐档判就是全部（与 D4 实现坐标口径一致）。
 * 节在盘：**只读解析命中的那一档**（点查，不遍历）——目标档内存在标题行，其标题编号
 *   （标题文本去 `^#{1,6}\s` 后的首个 `\d+(?:\.\d+)*`）= 指针节号。
 * 残余登记（fail-open 方向——归评审核验面）：未闭合围栏 ⇒ 至档尾免；指针行的坐标尾不入判、同行的档 token 照判。
 */
import { readFileSync, statSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"
import { fenceMark, isExecutableLine, isPromptFace } from "./paragraph.mjs"

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

/** 文件存在性（目录 / 读错 ⇒ false）。 */
function isFile(p) { try { return statSync(p).isFile() } catch { return false } }

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

/** 档解析（判据 ① 的解析序两级）：命中 ⇒ `{ ok, path }`；零命中 ⇒ `{ ok:false }`。
 *  行号坐标尾（`:N`）不参与档解析——token 只取 `.md` 段（抽取面已剥离坐标尾与节指示）。
 *  `num` = 指针节号（`§` 后编号；无节指示 ⇒ null）——仅用于判定节在盘，不参与档解析。 */
function resolveDoc(token, refFile, base) {
  const p1 = resolve(base, token)
  if (isFile(p1)) return { ok: true, path: p1 } // ① 仓根相对全路径
  const p2 = resolve(dirname(refFile), token)
  if (isFile(p2)) return { ok: true, path: p2 } // ② 引用方档所在目录相对
  return { ok: false }
}

/**
 * 锚判据主行程：传入档逐档逐行抽取 + 解析 + 节在盘判定。
 * @param {string} root 项目根（解析序 ① 的基准）
 * @param {{files?:string[]}} o `files` = **判定集兼解析集**（调用方传入的档清单——判定范围 = 解析范围，
 *   无目录遍历、无全域索引：清单外的档既不判也不参与解析）
 * @returns {{hits:Array}} hits = 命中（`档缺` / `节缺`）
 */
export function checkAnchors(root, { files = [] } = {}) {
  const base = resolve(root)
  const hits = []
  for (const f of files) {
    let text = ""
    try { text = readFileSync(f, "utf8") } catch { continue }
    const re = new RegExp(ANCHOR_RE.source, "g") // 每档一份实例（零共享 lastIndex 状态）
    const stripOperands = isOperandFace(f) // 只有提示词面剥（面判据 = `isPromptFace`）
    let fence = null // 围栏标记（` ∥ ~）；null = 不在块内
    text.split("\n").forEach((l, i) => {
      const mark = fenceMark(l)
      if (mark !== null) { // 围栏块整块跳过：起于围栏行、止于同形围栏行（未闭合 ⇒ 至档尾免）
        if (fence === null) fence = mark
        else if (mark === fence) fence = null
        return
      }
      if (fence !== null) return
      if (isExecutableLine(l)) return // 可执行行整行跳过
      const scan = stripOperands ? stripCanonOperands(l) : l // 提示词面：操作数先剥再抽；文档面 = 原行
      let m
      while ((m = re.exec(scan)) !== null) {
        const token = m[1]
        const num = m[2] ?? null
        const bn = basename(token).toLowerCase()
        const stem = bn.replace(/\.md$/, "")
        // 类名 ∥ 占位符两免：抽取面不把它们当指针（判据 = DOC-DISCIPLINE §3.20 ① 的「档 token」定义面）
        if (FILENAME_CLASSES.has(bn) || stem.length <= 1 || PLACEHOLDER_STEMS.has(stem)) continue
        const r = resolveDoc(token, f, base)
        if (!r.ok) { hits.push({ file: f, line: i + 1, token, clazz: "档缺" }); continue }
        if (num !== null && !sectionOnDisk(r.path, num)) hits.push({ file: f, line: i + 1, token, clazz: "节缺", section: num, target: r.path })
      }
    })
  }
  return { hits }
}
