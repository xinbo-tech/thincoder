/**
 * toolcall/fixture.mjs — 工具调用探针夹具（设计 §11.2 版本轴 + §11.3 `SYSTEM_BASE` + §11.4 V1 枚举块逐字 + V2 取句规则）。
 *
 * 两层同源（§11.2）：设计档逐字正本（`docs/core/design/MODEL-BENCH.md` §11——写定时纪律，不入机检）
 * → 运行面副本（本档 + `cases.mjs`）→ 冻结副本（`bench/test/toolcall-fixtures.frozen.mjs`）；
 * 机检 = 两层逐字等值。`TOOL_PROBE_VERSION` = 单源整数（本档唯一定义处）：
 * V1 枚举块字面 / V2 取句规则 / 用例集 / 判据与分母口径 / `SYSTEM_BASE` / 参数口径任一变化 ⇒ +1；
 * 呈现面（md 段位 / 列集 / 文案）变化**不 bump**。V0 载荷（产品面实面）不入本轴——由报告 `payloadDigest` 锚记（§11.2）。
 *
 * 本档**不改写产品描述文本**（KD-54）：V0 载荷逐字来自 `builtinTools` × `toOpenAISchema`，
 * V1 / V2 只在探针载荷上做声明式变换（`variants.mjs`）。
 */

/** 版本轴（§11.2）：见头注枚举——单源整数。 */
export const TOOL_PROBE_VERSION = 1

/** `SYSTEM_BASE` 逐字正本（§11.3-3 · 冻结 · 全变体全例一致）：一行中性 system——改字 ⇒ `TOOL_PROBE_VERSION + 1`。 */
export const SYSTEM_BASE = "你是通用助手。请按用户请求作答：需要工具时调用工具；不需要时直接回答。"

/** V1 枚举块（§11.4 逐字冻结 · 5 档近邻枢纽档）：V1 描述面 = 块 + `\n\n` + V0 文本逐字。 */
export const V1_ENUM_BLOCKS = {
  read: `read：
**选择面（枚举）**
- 单文件整读 / 分页读（已知文件）⇒ read
- 找行 / 找符号位置（尚不知在哪）⇒ grep（不选 read）
- 只按名找文件 ⇒ glob；列目录 ⇒ ls；目录树 ⇒ tree（不选 read）
- 看图 ⇒ read_image（不选 read）`,
  grep: `grep：
**选择面（枚举）**
- 按内容模式（正则 / 字面）在文件或目录里找行 ⇒ grep
- 按文件名 / 路径模式找文件 ⇒ glob（不选 grep）
- 已知文件、要读内容或某段 ⇒ read（不选 grep）`,
  bash: `bash：
**选择面（枚举）**
- 构建 / 测试 / 包管理 / 一次性管道（无专用工具可表达）⇒ bash
- 读文件（cat / type / head / tail）⇒ read；列目录（ls / dir）⇒ ls；按名找文件（find）⇒ glob；按内容找行（grep / rg / findstr）⇒ grep
- 写文件（echo > / sed -i / printf >）⇒ write / edit / hashline_edit / apply_patch
- 仓内 git 操作（status / diff / log / add / commit / push…）⇒ git
- 删单文件 ⇒ delete；删目录（含递归）⇒ bash（rm -rf）
- 要解析 / 计算 / 循环的复杂逻辑 ⇒ execute（node 进程内）`,
  git: `git：
**选择面（枚举）**
- 仓内 git 操作（状态 / 差异 / 提交 / 分支 / 标签 / 快照 / 远端）⇒ git
- 非 git 的 shell 命令（构建 / 测试 / 包管理）⇒ bash（不选 git）
- 改文件内容 ⇒ edit / write（git 只管版本面，不改内容）`,
  edit: `edit：
**选择面（枚举）**
- 已知目标区（内容或行号）做替换 / 删除 ⇒ edit
- 整篇重写 ⇒ write（不选 edit）
- 在某行之后新增一行 ⇒ insert_after（不选 edit）
- 多文件同改 / 一次建多档 ⇒ apply_patch
- 行号可能漂移 / 空白噪声大 ⇒ hashline_edit`,
}

/** 逐块**点名工具名**（§11.11 机检腿：点名名 ⊆ 载荷面——载荷外工具名零命中）。 */
export const V1_BLOCK_NAMES = {
  read: ["read", "grep", "glob", "ls", "tree", "read_image"],
  grep: ["grep", "glob", "read"],
  bash: ["bash", "read", "ls", "glob", "grep", "write", "edit", "hashline_edit", "apply_patch", "git", "delete", "execute"],
  git: ["git", "bash", "edit", "write"],
  edit: ["edit", "write", "insert_after", "apply_patch", "hashline_edit"],
}

/** 载荷外工具名候选表（§11.10-②：实例绑定族 + depth 绑定族）——枚举块文本内**零命中**（§11.11 机检腿）。 */
export const OFF_PAYLOAD_TOOL_NAMES = [
  "memory", "memory_search", "memory_put", "code_search", "doc_search", "repo_outline",
  "settings", "peer_instances", "ledger_query", "ledger_count", "ledger_add", "ledger_update", "ledger_close",
  "subagent", "advisor", "consult",
]

/** V1 参数面唯一缺口补齐（§11.4：`edit.edits[].*` 逐项 `description`——恰 7 项，多一处即红）。 */
export const V1_PARAM_DESCRIPTIONS = {
  path: "File path for this edit entry (falls back to the top-level path when omitted).",
  old_string: "Exact text to replace in this entry (content form; mutually exclusive with line/startLine/endLine).",
  new_string: "Replacement text for this entry; omit it to DELETE the targeted line/range (line form).",
  line: "1-based line number to replace or delete in this entry.",
  startLine: "1-based first line of the range to replace or delete in this entry (requires endLine).",
  endLine: "1-based last line of the range to replace or delete in this entry (requires startLine).",
  replace_all: "Replace all occurrences in this entry (default false).",
}

/** V2 取句规则（§11.4 · 确定性 · 不涉判断）：首行 → >120 字符取首个 `. ` / `。` 前片段 → 仍 >120 硬截 120 + `…`。 */
export function routeHead(description) {
  const first = String(description ?? "").split("\n")[0]
  if (first.length <= 120) return first
  const cuts = [first.indexOf(". "), first.indexOf("。")].filter((i) => i >= 0)
  const head = cuts.length > 0 ? first.slice(0, Math.min(...cuts)) : first
  return head.length <= 120 ? head : `${head.slice(0, 120)}…`
}

/** dry-run 夹具响应（§11.11 行为级六形态：命中 / 误选近邻 / 无调用 / 多调用 / `arguments` 非 JSON / schema 违规）。
 *  形态分配 = 逐（用例 × 重复序号）确定性取表：特例表命中 ⇒ 该形态，否则 = 该用例的命中响应。
 *  `tokens.prompt` = **合成值**（逐变体给值，便于自检「实测腿 / Δ vs V0」链路——非测量、不得读作 token 估算）。 */
const PROMPT_TOKENS = { V0: 9012, V1: 10034, V2: 6180 }

const call = (name, args) => ({ name, arguments: JSON.stringify(args) })
const one = (name, args) => ({ toolCalls: [call(name, args)] })
const many = (...items) => ({ toolCalls: items.map(([name, args]) => call(name, args)) })

/** 命中响应（逐用例 = 该例期望工具的合法调用——参数满足 §11.5 逐例谓词）。 */
const HIT_RESPONSES = {
  "tool.1": one("read", { path: "docs/a.txt", offset: 10, limit: 5 }),
  "tool.2": one("grep", { pattern: "TODO(", literal: true, path: "src" }),
  "tool.3": one("edit", { path: "docs/notes.txt", old_string: "旧口径", new_string: "已收正", replace_all: true }),
  "tool.4": one("write", { path: "docs/plan.txt", content: "A\nB\nC" }),
  "tool.5": one("bash", { command: "node --test" }),
  "tool.6": one("git", { action: "status" }),
  "tool.7": one("insert_after", { path: "docs/CHANGELOG.txt", after_line: 12, content: "- 2026-09-25：工具面探针。" }),
  "tool.8": one("edit", { path: "docs/notes.txt", line: 40 }),
  "tool.9": one("delete", { path: "tmp/scratch.txt" }),
  "tool.10": one("bash", { command: "rm -rf tmp/build-out" }),
  "tool.11": one("git", { action: "tag", tagAction: "delete", name: "v1.2.0" }),
  "tool.12": one("grep", { pattern: "暂缓核销", glob: "**/*.md !tmp/**", before: 2, after: 2 }),
  "tool.13": { text: "一年有 12 个月。", toolCalls: [] },
  "tool.14": one("get_current_time", {}),
}

/** 特例形态（键 = 1 起重复序号；未列出的序号 ⇒ 命中响应）。 */
const SPECIAL_RESPONSES = {
  // ① schema 违规 · 缺 required（read 缺 `path`）；② 误选近邻（read↔grep）
  "tool.1": { 1: one("read", { offset: 10, limit: 5 }), 2: one("grep", { pattern: "docs/a.txt" }) },
  // arguments 非 JSON（parseFail 腿）
  "tool.5": { 1: { toolCalls: [{ name: "bash", arguments: "{command: node --test" }] } },
  // 多调用（两条调用面均合法——`multiCall` 单列计数腿）
  "tool.6": { 1: many(["git", { action: "status" }], ["read", { path: "docs/a.txt" }]) },
  // 误选近邻（delete↔bash：单文件删除走了 bash）
  "tool.9": { 1: one("bash", { command: "del tmp/scratch.txt" }) },
  // schema 违规 · enum 越界（git.tagAction ∉ enum）
  "tool.11": { 1: one("git", { action: "tag", tagAction: "remove", name: "v1.2.0" }) },
  // 缺 usage（`tokens` 缺记 ⇒ 成本记 `null` + warning——KD-6 腿）
  "tool.12": { 1: { ...HIT_RESPONSES["tool.12"], noUsage: true } },
}

/**
 * 取该（用例 × 重复序号 × 变体）的夹具响应（`fixtureTransport` 脚本条目同形；每次调用经单条脚本投递——
 * `maxRounds = 1` ⇒ 每 run 恰一次调用，与成本闸 `skipped`（不发起）自然对齐）。
 */
export function dryRunResponse({ caseId, i, variant }) {
  const base = SPECIAL_RESPONSES[caseId]?.[i] ?? HIT_RESPONSES[caseId] ?? { text: "（夹具：该用例无脚本响应）", toolCalls: [] }
  const toolCalls = base.toolCalls ?? []
  return {
    text: base.text ?? "",
    toolCalls,
    finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
    tokens: base.noUsage ? null : { prompt: PROMPT_TOKENS[variant] ?? null, cached: 0, completion: 40 },
    ttftMs: 300,
    totalMs: 1200,
  }
}
