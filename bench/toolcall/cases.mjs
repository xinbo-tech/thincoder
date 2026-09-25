/**
 * toolcall/cases.mjs — 工具调用探针用例集（设计 §11.5 逐字正本 → 运行面副本；§11.2 两层同源）。
 *
 * 14 例 = 5 对偶 × 2 + 3 边界 + 1 常规（§11.5）；逐例 = `{id, kind, prompt（逐字）, expect{name, argsOk}}`；
 * `argsOk` = **声明式参数谓词**（数据——求值器单源 = `grade.mjs` `argsOkOf`；数据形态便于两层逐字机检）。
 * 题面逐字冻结：改题 / 改谓词 ⇒ `TOOL_PROBE_VERSION + 1`（`fixture.mjs`）；题面中的路径 = **夹具假想路径**
 * （`.txt` 扩展名 · 不指向本仓 · 无文件系统——判定只看参数成形，§11.10-④）。
 */

import { createHash } from "node:crypto"
import { SYSTEM_BASE, V1_ENUM_BLOCKS } from "./fixture.mjs"

/** 谓词原语（`args` = 首调用 `arguments` 解析后的对象）。 */
export const eq = (key, value) => ({ k: "eq", key, value })
export const absent = (key) => ({ k: "absent", key })
export const notTrue = (key) => ({ k: "notTrue", key })
export const isString = (key) => ({ k: "string", key })
export const matches = (key, src) => ({ k: "re", key, src })
export const includes = (key, value) => ({ k: "includes", key, value })
export const linesEq = (key, value) => ({ k: "linesEq", key, value })
export const emptyArgs = { k: "empty" }

/** 用例集（14 例 · 题面逐字 = 设计 §11.5 表「题面（逐字）」列；谓词行注 = 同表「参数谓词（机读）」列）。 */
export const CASES = [
  // ── 5 对偶 × 2（双向各 1）────────────────────────────────────────────
  {
    id: "tool.1", kind: "pair",
    prompt: "看一下 `docs/a.txt` 从第 10 行开始的 5 行。",
    // path === "docs/a.txt" ∧ offset === 10 ∧ limit === 5
    expect: { name: "read", argsOk: [eq("path", "docs/a.txt"), eq("offset", 10), eq("limit", 5)] },
  },
  {
    id: "tool.2", kind: "pair",
    prompt: "在 `src/` 下搜索字符串 `TODO(`——按**字面**匹配，不要当正则。",
    // pattern === "TODO(" ∧ literal === true ∧ path === "src"
    expect: { name: "grep", argsOk: [eq("pattern", "TODO("), eq("literal", true), eq("path", "src")] },
  },
  {
    id: "tool.3", kind: "pair",
    prompt: "把 `docs/notes.txt` 里**所有** `旧口径` 替换成 `已收正`。",
    // path === "docs/notes.txt" ∧ old_string === "旧口径" ∧ new_string === "已收正" ∧ replace_all === true
    expect: {
      name: "edit",
      argsOk: [eq("path", "docs/notes.txt"), eq("old_string", "旧口径"), eq("new_string", "已收正"), eq("replace_all", true)],
    },
  },
  {
    id: "tool.4", kind: "pair",
    prompt: "新建 `docs/plan.txt`，整篇内容就是三行：`A` / `B` / `C`（各占一行，没有别的）。",
    // path === "docs/plan.txt" ∧ content 去空行后 = [A, B, C]（顺序在场）
    expect: { name: "write", argsOk: [eq("path", "docs/plan.txt"), linesEq("content", ["A", "B", "C"])] },
  },
  {
    id: "tool.5", kind: "pair",
    prompt: "跑一下全量测试（`node --test`），把输出贴给我。",
    // typeof command === "string" ∧ /node\s+--test/ 命中
    expect: { name: "bash", argsOk: [isString("command"), matches("command", "node\\s+--test")] },
  },
  {
    id: "tool.6", kind: "pair",
    prompt: "看看当前工作树里有哪些**还没提交**的改动（只要文件清单）。",
    // action === "status"
    expect: { name: "git", argsOk: [eq("action", "status")] },
  },
  {
    id: "tool.7", kind: "pair",
    prompt: "在 `docs/CHANGELOG.txt` 第 12 行**之后**插入一行：`- 2026-09-25：工具面探针。`",
    // path === "docs/CHANGELOG.txt" ∧ after_line === 12 ∧ content 含「工具面探针」
    expect: {
      name: "insert_after",
      argsOk: [eq("path", "docs/CHANGELOG.txt"), eq("after_line", 12), includes("content", "工具面探针")],
    },
  },
  {
    id: "tool.8", kind: "pair",
    prompt: "把 `docs/notes.txt` 的第 40 行整行删掉（别的行不要动）。",
    // path === "docs/notes.txt" ∧ line === 40 ∧ new_string 键缺席（删除信号 = 省略）
    expect: { name: "edit", argsOk: [eq("path", "docs/notes.txt"), eq("line", 40), absent("new_string")] },
  },
  {
    id: "tool.9", kind: "pair",
    prompt: "把临时文件 `tmp/scratch.txt` 删掉。",
    // path === "tmp/scratch.txt" ∧ force 未给或 false
    expect: { name: "delete", argsOk: [eq("path", "tmp/scratch.txt"), notTrue("force")] },
  },
  {
    id: "tool.10", kind: "pair",
    prompt: "把 `tmp/build-out/` 这整个目录连同里面的东西一起删掉。",
    // command 含 tmp/build-out ∧ 含递归删除旗标（-[a-zA-Z]*[rRfF] 或 --recursive）
    expect: { name: "bash", argsOk: [includes("command", "tmp/build-out"), matches("command", "-[a-zA-Z]*[rRfF]|--recursive")] },
  },
  // ── 3 边界 + 1 常规 ─────────────────────────────────────────────────
  {
    id: "tool.11", kind: "boundary",
    prompt: "把 git 标签 `v1.2.0` 删掉。",
    // action === "tag" ∧ tagAction === "delete" ∧ name === "v1.2.0"
    expect: { name: "git", argsOk: [eq("action", "tag"), eq("tagAction", "delete"), eq("name", "v1.2.0")] },
  },
  {
    id: "tool.12", kind: "boundary",
    prompt: "在 `docs/` 下搜 `暂缓核销`，只看 `.md` 文件（排除 `tmp/` 子目录），每条命中前后各带 2 行上下文。",
    // pattern === "暂缓核销" ∧ glob 含 .md ∧ 含 !（排除语法）∧ before === 2 ∧ after === 2
    expect: {
      name: "grep",
      argsOk: [eq("pattern", "暂缓核销"), includes("glob", ".md"), includes("glob", "!"), eq("before", 2), eq("after", 2)],
    },
  },
  {
    id: "tool.13", kind: "boundary",
    prompt: "一年有几个月？直接回答，不用工具。",
    // 无任何工具调用（零调用 ⇒ 轴① true；轴② / 轴③ 判 null——§11.6）
    expect: { name: null, argsOk: null },
  },
  {
    id: "tool.14", kind: "normal",
    prompt: "现在几点了？用工具取当前时间。",
    // 无参数（解析后为空对象）
    expect: { name: "get_current_time", argsOk: [emptyArgs] },
  },
]

/** 5 对偶分组（§11.5 类别列 · 双向各 1——机检腿：组内 2 例 ∧ 全为 `pair` ∧ 不重不漏）。 */
export const PAIR_GROUPS = [
  { label: "read↔grep", ids: ["tool.1", "tool.2"] },
  { label: "edit↔write", ids: ["tool.3", "tool.4"] },
  { label: "git↔bash", ids: ["tool.5", "tool.6"] },
  { label: "edit↔insert_after", ids: ["tool.7", "tool.8"] },
  { label: "delete↔bash", ids: ["tool.9", "tool.10"] },
]

/** 逐例 V1 影响面（§11.4 覆盖矩阵 · 冻结）：`home` = 期望工具被枚举 · `steer` = 最近邻被点名 · `—` = V1 = V0 面。 */
export const V1_IMPACT = [
  { caseId: "tool.1", impact: "home", why: "read 被枚举" },
  { caseId: "tool.2", impact: "home", why: "grep 被枚举" },
  { caseId: "tool.3", impact: "home", why: "edit 被枚举" },
  { caseId: "tool.4", impact: "steer", why: "edit 块「整篇重写 ⇒ write」" },
  { caseId: "tool.5", impact: "home", why: "bash 被枚举" },
  { caseId: "tool.6", impact: "home", why: "git 被枚举" },
  { caseId: "tool.7", impact: "steer", why: "edit 块「在某行之后新增 ⇒ insert_after」" },
  { caseId: "tool.8", impact: "home", why: "edit 被枚举" },
  { caseId: "tool.9", impact: "steer", why: "bash 块「删单文件 ⇒ delete」" },
  { caseId: "tool.10", impact: "home", why: "bash 被枚举" },
  { caseId: "tool.11", impact: "home", why: "git 被枚举" },
  { caseId: "tool.12", impact: "home", why: "grep 被枚举" },
  { caseId: "tool.13", impact: "—", why: "期望无调用" },
  { caseId: "tool.14", impact: "—", why: "期望工具未被枚举且其最近邻未被点名" },
]

/** 用例集 schema 校验（fail-closed——装载期即拒；**射程 = 结构面**，期望名 ∈ 载荷面住测试面 §11.11）。 */
export function validateCases() {
  if (CASES.length !== 14) throw new Error(`用例集必须恰 14 例（得 ${CASES.length}）`)
  const ids = new Set()
  for (const c of CASES) {
    if (typeof c.id !== "string" || !c.id) throw new Error("用例 id 缺失")
    if (ids.has(c.id)) throw new Error(`用例 id 重复「${c.id}」`)
    ids.add(c.id)
    if (!["pair", "boundary", "normal"].includes(c.kind)) throw new Error(`用例 ${c.id} 的 kind 非法「${c.kind}」`)
    if (typeof c.prompt !== "string" || c.prompt.length === 0) throw new Error(`用例 ${c.id} 缺题面`)
    if (!c.expect || typeof c.expect !== "object") throw new Error(`用例 ${c.id} 缺 expect`)
    const { name, argsOk } = c.expect
    if (name !== null && (typeof name !== "string" || !name)) throw new Error(`用例 ${c.id} 的 expect.name 非法`)
    if (name === null ? argsOk !== null : !Array.isArray(argsOk) || argsOk.length === 0) {
      throw new Error(`用例 ${c.id} 的 expect.argsOk 与 expect.name 不匹配`)
    }
  }
  const kinds = (k) => CASES.filter((c) => c.kind === k).length
  if (kinds("pair") !== 10 || kinds("boundary") !== 3 || kinds("normal") !== 1) {
    throw new Error(`用例类别计数须为 10 对偶 / 3 边界 / 1 常规（得 ${kinds("pair")} / ${kinds("boundary")} / ${kinds("normal")}）`)
  }
  const paired = new Set(PAIR_GROUPS.flatMap((g) => g.ids))
  if (PAIR_GROUPS.length !== 5) throw new Error(`对偶组必须恰 5 组（得 ${PAIR_GROUPS.length}）`)
  if (paired.size !== 10) throw new Error(`对偶组 id 须两两不重、合计 10（得 ${paired.size}）`)
  for (const g of PAIR_GROUPS) {
    if (g.ids.length !== 2) throw new Error(`对偶组「${g.label}」须恰 2 例（双向各 1）`)
    for (const id of g.ids) {
      const c = CASES.find((x) => x.id === id)
      if (!c || c.kind !== "pair") throw new Error(`对偶组「${g.label}」的 ${id} 不是 pair 用例`)
    }
  }
  // V1 影响面机检（§11.4 定义面）：`home` ⇔ 期望工具被枚举；`steer` ⇔ 期望工具未被枚举但在某块文本内被点名；`—` ⇔ 两皆无。
  const blockText = Object.values(V1_ENUM_BLOCKS).join("\n")
  const enumTools = new Set(Object.keys(V1_ENUM_BLOCKS))
  if (V1_IMPACT.length !== CASES.length) throw new Error(`V1 影响面须逐例在档（${V1_IMPACT.length} ≠ ${CASES.length}）`)
  for (const row of V1_IMPACT) {
    const c = CASES.find((x) => x.id === row.caseId)
    if (!c) throw new Error(`V1 影响面含未知用例「${row.caseId}」`)
    if (!["home", "steer", "—"].includes(row.impact)) throw new Error(`用例 ${row.caseId} 的 V1 影响面取值非法「${row.impact}」`)
    const name = c.expect.name
    const enforced = name === null ? "—" : enumTools.has(name) ? "home" : blockText.includes(name) ? "steer" : "—"
    if (row.impact !== enforced) throw new Error(`用例 ${row.caseId} 的 V1 影响面「${row.impact}」与 §11.4 定义不符（应为「${enforced}」）`)
  }
  return { cases: CASES.length }
}

/** 夹具面复跑锚（§11.8）：用例集 + V1 块 + `SYSTEM_BASE` 的摘要哈希（体例同 KD-45 `promptsDigest`）。 */
export function casesDigest() {
  const h = createHash("sha256")
  h.update(JSON.stringify(CASES.map((c) => [c.id, c.kind, c.prompt, c.expect.name, c.expect.argsOk])))
  h.update("\0")
  for (const [name, block] of Object.entries(V1_ENUM_BLOCKS)) {
    h.update(name); h.update("\0"); h.update(block); h.update("\0")
  }
  h.update(SYSTEM_BASE)
  return `sha256:${h.digest("hex").slice(0, 16)}`
}
