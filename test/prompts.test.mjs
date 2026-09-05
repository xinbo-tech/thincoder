/**
 * prompts.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, advisor.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { MAX_RESULT_CHARS } from "../src/advisor/run.mjs"
import {
  buildAdvisorSystemPrompt,
  buildAdvisorUserMessage,
} from "../src/advisor.mjs"



test("T19: 内部协议口径断言（engineering.md step 6-8 + Work Loop 状态，§18）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  // async 交付：eng-coder 默认 async + 内部协议闭环（防双重审计/误用）
  assert.ok(text.includes("Eng-coder spawns are async by default (AGENT-LOOP.md §18)"), "默认 async 叙述（step 6）")
  assert.ok(text.includes("returns `{id, status:\"running\"}` immediately"), "spawn 立即返回 running")
  assert.ok(text.includes("runs INSIDE the child"), "交付协议在子代理内部闭环")
  assert.ok(text.includes("Pass `async:false`"), "显式 async:false 覆盖保留")
  // step 7：交付已内部审计——父侧不重复审计
  assert.ok(text.includes("Delivery arrives already audited — do not double-audit"), "父侧不双重审计（step 7 标题）")
  assert.ok(text.includes("terminal state `clean` | `stalled`"), "终态 clean/stalled")
  assert.ok(text.includes("same `designToken` and `designId` parameters"), "修正轮复用同 designId+token（内部收敛外的父侧处理）")
  assert.ok(text.includes("invent nothing\n   new"), "不发明新需求")
  // step 8：父侧复核保留可选（默认内部协议承担）
  assert.ok(text.includes("OPTIONAL second opinion"), "父侧 advisor = 可选第二意见")
  assert.ok(text.includes("no user\n   initiation needed (2026-08-24 decision)"), "自动节点语义保留")
  // Work Loop：旧 First delivery audit 父侧审计态已由内部协议态取代
  assert.ok(!text.includes("First delivery audit"), "父侧 First delivery audit 态已移除（§18 下沉）")
  assert.ok(text.includes("Delivery (async settle)"), "Work Loop 含 async settle 态")
  assert.ok(text.includes("internally audited + advisor-reviewed inside the child"), "内部审计+复评口径")
})



test("prompts/engineering.md: 多任务并行纪律注入（Parallelize aggressively + designId 并行形态，2026-09-01）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("## Multi-Task Parallelism"), "工程模式顶层含并行化纪律章节")
  assert.ok(text.includes("Parallelize aggressively: send multiple\nindependent tool calls in one response"), "§14 D1 条款在工程模式单独出现")
  assert.ok(text.includes("splitting changes across independent\nsub-projects"), "F7 子项目拆分触发条件")
  assert.ok(text.includes("Do NOT parallelize:\nwrites to the same file, dependent steps, bash/approval-gated commands"), "五类不并行边界")
  assert.ok(text.includes("approval storms"), "审批风暴点名")
  assert.ok(text.includes("skip micro-parallelism (<1s ops)"), "微操作不并行")
  // §20.7 T-PS1：调度器条款替换旧手动避让纪律（D-PS2 逐字锚——AGENT-LOOP.md §20.7.2）
  const flat = text.replace(/\n[ \t]+/g, " ") // 折叠续行缩进——锚跨行断言
  assert.ok(flat.includes("**Declare spawn scheduling metadata in task briefs**: spawn with `files` (write domain) and `dependsOn` (prior async ids) — the scheduler gates admission: async spawns overlapping running/queued files wait queued (clear when the blocker settles); sync spawns conflicting on files error out (not queued); dependency chains auto-order. Mirror tasks across independent trees spawn as parallel eng-coders, each declaring its own file domain — overlapping domains are queued by the scheduler, never hand-serialized."), "T-PS1: D-PS2 锚逐字在（files/dependsOn 声明 + 调度器准入闸 + 镜像并行排队语义）")
  assert.ok(text.includes("never hand-serialized"), "T-PS1: 调度器接管——不手动串行")
  assert.ok(text.includes("at most 4 concurrent eng-coders"), "≤4 并发上限")
  assert.ok(text.includes("past 4 the bookkeeping cost"), "并发上限 rationale 同步 3→4（§15 D-A4 T9）")
  // §19.5.5 T-CL2：cancel 核实纪律锚（D-CL2 逐字——post-D-PS2 文本——fail-when-unchanged——AGENT-LOOP §19.5.5 D-CL2）
  assert.ok(flat.includes("assertions stay green).** Cancelling a running eng-coder is a last resort — its in-flight delivery dies unmerged and unaudited; verify the alarm with reliable checks and prefer scoped recovery first."), "T-CL2: D-CL2 锚逐字在 D-PS2 文本后（cancel = last resort + 核实优先）")
  assert.ok(text.includes('designId=<id-A>,\n  designToken=<token-A>'), "并行 spawn 调用形态（各带 designId+token）")
  assert.ok(text.includes("each parallel\n   design keeps its own designId+token pair"), "token 隔离语义（不互相覆盖）")
  assert.ok(text.includes("the DESIGN review is still only fired when\n  the user asks"), "发起权不变：设计评审仍仅用户发起")
  assert.ok(text.includes("plus its designId parameter"), "Work Loop 批准行提 designId")
  // §20.7 T-PS2：engineering.md 旧手动纪律措辞零残留（替换前已在位——grep 确认过）
  assert.ok(!text.includes("share NO file"), "T-PS2: 旧「受影响文件集无交集」前置检查零残留")
  assert.ok(!text.includes("run the tasks serially (or merge them into one spawn)"), "T-PS2: 旧「串行/合并」手动处置零残留")
  assert.ok(!text.includes("Dependency chain → serial"), "T-PS2: 旧「依赖链串行」零残留")
  assert.ok(!text.includes("Pre-check before parallel spawns"), "T-PS2: 旧「spawn 前人工预检」零残留")
  assert.ok(!text.includes("Never assign two parallel eng-coders"), "T-PS2: 旧「并行 eng-coder 同文件编辑」手动避让句零残留")
})



test("prompts/main.md: Delegation 调度器条款（§20.7 D-PS1——T-PS1/T-PS2）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
  // T-PS1：D-PS1 逐字锚在（fail-when-unchanged——替换前旧句已 grep 确认在位）
  assert.ok(
    text.includes("**Declare spawn scheduling metadata**: pass `files` (the write domain) and `dependsOn` (prior async ids) when delegating — **for async spawns with `files` declared**, the scheduler auto-serializes overlapping-file tasks (queued until clear) and orders dependency chains. Same-file async spawns are safe to fire with files declared — the queue handles contention; **declare `files` or the scheduler can't serialize (undeclared = no detection); sync spawns conflicting on files error out (not queued)**; never hand-serialize what the scheduler queues."),
    "T-PS1: D-PS1 锚逐字在（files/dependsOn 声明引导 + sync 冲突报错 + 不手动串行）",
  )
  // T-PS2：旧手动避让句零残留
  assert.ok(!text.includes("Never give parallel subagents tasks that edit the same files"), "T-PS2: 旧「并行不编辑同一文件」句零残留")
})



test("§20.8 T-F1.5: main.md/engineering.md 携带 files 文件级锚句（fail-when-unchanged——目录声明不支持——不绕过冲突检测）", () => {
  const anchor = "files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error."
  for (const name of ["main.md", "engineering.md"]) {
    const text = readFileSync(join(PROMPTS_DIR, name), "utf8")
    assert.ok(text.includes(anchor), `T-F1.5: ${name} missing the §20.8 files file-level anchor sentence`)
  }
})


// ─── 2026-09-01 修复轮 #4：engineering.md 卫生（重复标题去重）───

test("prompts/engineering.md: no duplicated section headers (2026-09-01 fix #4 hygiene)", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  const dupes = [...text.matchAll(/^## .+$/gm)].map((m) => m[0])
  assert.equal(dupes.length, new Set(dupes).size,
    "every ## header appears exactly once: " + dupes.filter((h, i) => dupes.indexOf(h) !== i).join(" | "))
  assert.ok(text.includes("## Questioning Style (requirement clarification)"), "header kept (dedup only)")
})



test("prompts/system.md: 批量形态引导句（§16 D-B4，并入 §14 D1 并行条款）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  assert.ok(
    text.includes("use the `edits` array for independent multi-file changes and apply_patch for whole-file/new-file changes; prefer one batched call over N single edits"),
    "批量优先句在 D1 并行条款内（edits + apply_patch + batched call）",
  )
  // 与既有 §14 断言同处一句——批量句必须是 D1 条款的扩展而非独立句（评审 #8）
  const clause = text.split("\n").find((l) => l.includes("Parallelize aggressively"))
  assert.ok(clause.includes("prefer one batched call over N single edits"), "批量句位于 D1 并行条款句内")
})


// ---------------------------------------------------------------- 提示词借鉴增量（kimi-code 对照，2026-08-21）
// 各端内容断言（锚句存在）防漂移（§18.11 起——镜像锚在设计文档逐字定稿——两端各自照抄）；本组测试防内容缺失 + 防漂移回归。

const TEST_DIR = dirname(fileURLToPath(import.meta.url))                     // thincoder/test
const PROMPTS_DIR = join(TEST_DIR, "..", "src", "prompts")                   // thincoder/src/prompts
const DOCS_DESIGN_DIR = join(TEST_DIR, "..", "docs", "design")
const SRC_DIR = join(TEST_DIR, "..", "src")                                  // thincoder/src


// §14 T-TF1/T-TF2（2026-09-04——工具失败回降三改进——A 锚——D-TF1 逐字——fail-when-unchanged）

const TOOLS_A_DESC_ANCHOR = "use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed"


test("tools/edit|insert_after|hashline_edit 描述: A 锚句（§14 T-TF1——D-TF1 逐字）", () => {
  for (const f of ["edit.md", "insert_after.md", "hashline_edit.md"]) {
    const text = readFileSync(join(SRC_DIR, "tools", f), "utf8")
    assert.ok(text.includes(TOOLS_A_DESC_ANCHOR), `T-TF1: ${f} 含 A 描述锚句（D-TF1 逐字）`)
  }
})


// ---------------------------------------------------------------- §15 描述锚（T15.10a/T15.11/T15.12——TOOLS.md D15.1/D15.2/D15.3——2026-09-04）

const EDIT_D15_ANCHOR =
  "Edit a file as a patch. old_string is the current content of the region to change (must match exactly once); " +
  "new_string is the desired result of that region. Lines shared by both are kept; lines only in new_string take " +
  "their position relative to the shared lines (LCS order) — when no line overlaps, new_string is inserted after " +
  "old_string (old content stays) — except a unique single-line old_string paired with a single-line new_string: " +
  "that exact line is replaced in place (line count unchanged); for a multi-line replacement, include a shared " +
  "context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in " +
  "place; multi-line zero-overlap pairs still insert per the diff rules above. " +
  "replace_all keeps literal replacement of every occurrence — the insert rule does not apply."
const EDIT_ROUTE_D15_ANCHOR = "Add a line/entry after a known line → insert_after — includes checklist items and doc lines."
const INSERT_AFTER_D15_ANCHOR =
  "Use this instead of edit when you're adding a new line — a checklist item, a doc heading, a line of prose, a function, an import, or a block — no need to fabricate surrounding context for exact matching."
const HASHLINE_D15_ANCHOR =
  "Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit."
const WRITE_D15_ANCHOR =
  "write replaces the WHOLE file — read it first and confirm you intend to rewrite it entirely; for a small change use edit / insert_after."
const LSP_ROUTE_D15_ANCHOR = "Find files with glob / repo_outline — use lsp for definition / references / diagnostics"
const APPLY_PATCH_NF158C_ANCHOR =
  'Hunk header "@@" without coordinates is accepted. Coordinate-less hunks are located by their anchor lines: context lines plus the removed (-) lines, matched as a contiguous sequence — a unique match applies. The anchor-free forms require context: a hunk with no removed (-) lines (pure additions) needs at least 2 context lines for a unique match; a zero/one-context hunk with at least one removed (-) line is located by its anchor sequence (context + removed lines, in order) and applies on a unique match.'



test("T15.10a: §15 描述锚逐字（edit/insert_after/hashline_edit/write/lsp/apply_patch——fail-when-unchanged）", () => {
  const md = (f) => readFileSync(join(SRC_DIR, "tools", f), "utf8")
  assert.ok(md("edit.md").includes(EDIT_D15_ANCHOR), "edit.md: D15.1 首句逐字锚")
  assert.ok(md("edit.md").includes(EDIT_ROUTE_D15_ANCHOR), "edit.md: D15.1 路由句（insert_after 出口）")
  assert.ok(md("insert_after.md").includes(INSERT_AFTER_D15_ANCHOR), "insert_after.md: D15.2 用例句逐字锚")
  assert.ok(md("hashline_edit.md").includes(HASHLINE_D15_ANCHOR), "hashline_edit.md: D15.2 追加两句逐字锚")
  assert.ok(md("write.md").includes(WRITE_D15_ANCHOR), "write.md: D15.2 加句逐字锚")
  assert.ok(md("lsp.md").includes(LSP_ROUTE_D15_ANCHOR), "lsp.md: D15.3#6 路由句")
  assert.ok(md("apply_patch.md").includes(APPLY_PATCH_NF158C_ANCHOR), "apply_patch.md: NF15.8c 描述锚句（§15.3——零/单上下文含 - 锚唯一即应用）")
})



test("T15.11: timer 描述+schema——default 180、seconds 可选（D15.3#1）", async () => {
  const { timerTool } = await import("../src/agent-tools/timer.mjs")
  assert.match(timerTool.parameters.properties.seconds.description, /default 180/)
  assert.ok(!timerTool.parameters.required.includes("seconds"), "seconds 不在 required——可选")
  assert.match(timerTool.description, /N seconds to reason/)
})



test("T15.12: verify 描述+schema——testNamePattern、filter 拒绝明示（D15.3#2）", async () => {
  const { verifyTool } = await import("../src/agent-tools/verify.mjs")
  assert.ok(verifyTool.parameters.properties.testNamePattern, "参数已改名 testNamePattern")
  assert.ok(!verifyTool.parameters.properties.filter, "旧名 filter 不在 schema")
  assert.match(verifyTool.description, /renamed from filter/)
  await assert.rejects(
    () => verifyTool.execute({ filter: "x" }, { agent: { cwd: process.cwd() } }),
    /filter was renamed to testNamePattern/,
    "旧名 filter 调用被拒绝——明确错误"
  )
})



test("prompts/system.md: 行号敏感 A 锚句（§14 T-TF2——D-TF1 逐字）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  assert.ok(
    text.includes("Line-number-sensitive tools (insert_after, hashline_edit) and exact-match tools (edit) require the freshest read — re-read the file before calling if it may have changed."),
    "T-TF2: system.md 含行号敏感提示句（D-TF1 逐字——fail-when-unchanged）",
  )
})


test("prompts/explore.md: Thoroughness levels 三档 + 默认档", () => {
  const text = readFileSync(join(PROMPTS_DIR, "explore.md"), "utf8")
  assert.ok(text.includes("Thoroughness levels"), "段落标题存在")
  const lines = text.split("\n")
  assert.ok(lines.some((l) => l.trim().startsWith("- quick")), "quick 档存在")
  const medium = lines.find((l) => /^- medium/.test(l.trim()))
  assert.ok(medium, "medium 档存在")
  assert.ok(/default/i.test(medium), `medium 标注为默认档: ${medium}`)
  const thorough = lines.find((l) => /^- thorough/.test(l.trim()))
  assert.ok(thorough, "thorough 档存在")
  assert.ok(/NOT find/i.test(thorough), `thorough 要求报告没找到什么: ${thorough}`)
})


// §18.5 T-AG4（2026-09-04）：explore.md 零 git——无注入声明、无 git 命令承诺。
// 评审 #10 实现前补充：同时 grep 全部 src/prompts/*.md 确认无其他 git 注入/命令承诺
// 残留（advisor-design/round2/3 的 "Do NOT run git diff"/"NO git tool" 为负面禁令或
// advisor 历史注记——非注入声明亦非命令承诺——按"已确认"处置保留；system.md/
// discipline.md 的 git 提及为顶层工具纪律示例——非子代理注入面）。

test("prompts/explore.md: 零 git（T-AG4）——无 git log/git diff 命令承诺、无 Git context 注入声明", () => {
  const text = readFileSync(join(PROMPTS_DIR, "explore.md"), "utf8")
  assert.ok(!text.includes("git log"), "T-AG4: explore.md 无 git log 命令承诺")
  assert.ok(!text.includes("git diff"), "T-AG4: explore.md 无 git diff 命令承诺")
  assert.ok(!text.includes("Git context is injected"), "T-AG4: explore.md 无 Git context 注入声明")
  assert.ok(!text.includes("untrusted_git_context"), "T-AG4: explore.md 无 git 上下文注入标记")
  assert.ok(!text.includes("receive git"), "T-AG4: explore.md 无注入承诺残留（receive git）")
  // 评审 #10 补充：全 prompts 面排查——git 上下文注入标记必须全空
  const names = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".md"))
  for (const f of names) {
    const t = readFileSync(join(PROMPTS_DIR, f), "utf8")
    assert.ok(!t.includes("untrusted_git_context"), `T-AG4: ${f} 无 git 上下文注入标记`)
    assert.ok(!t.includes("Git context is injected"), `T-AG4: ${f} 无 Git context 注入声明`)
  }
})



test("prompts/main.md: Delegate well 含委派 explore 时指定彻底度的指引", () => {
  const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
  assert.ok(text.includes("quick / medium / thorough"), "三档文案在 main.md 中")
  assert.match(text, /Delegate well[\s\S]*thoroughness/, "指引位于 Delegate well 段")
})



test("prompts/system.md: 确认理解句含 most important acceptance criteria", () => {
  const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  const line = text.split("\n").find((l) => l.includes("Confirm understanding"))
  assert.ok(line, "确认理解句存在")
  assert.ok(line.includes("most important acceptance criteria"), line)
  assert.ok(line.includes("Wait for confirmation"), "其余语义保留")
})



test("prompts/system.md: 设计文档即契约——不许执行期静默降级（2026-08-30）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  assert.ok(text.includes("This binding is UNCONDITIONAL and does not wait for a formal confirmation round"), "绑定无条件——不等正式确认轮")
  assert.ok(text.includes("every requirement the user states — mid-conversation, in a design doc, or in a confirmed plan — binds the moment it is stated"), "会话直述要求即刻生效（堵会话内降级缝隙）")
  assert.ok(text.includes("A stated request IS the contract"), "陈述即契约")
  assert.ok(text.includes("implementation may not quietly shrink it"), "实现不得悄悄缩水")
  assert.ok(text.includes("implement it anyway and note the cost, or stop and surface the trade-off BEFORE building the reduced version"), "贵也要实现，或实现前呈报权衡")
  assert.ok(text.includes("Disclosing a downgrade after delivery is not compliance"), "交付后披露 ≠ 合规")
  assert.ok(text.includes("reported instead of avoided"), "披露义务是防患不是善后")
})


// ---------------------------------------------------------------- 开工前计划确认纪律（2026-08-21）

test("prompts/system.md: 确认纪律 — 写文件动作清单 + 门禁 + doc/code 一致性豁免", () => {
  const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  assert.ok(/write \/ edit \/ apply_patch \/ insert_after \/ delete \/ hashline_edit/.test(text), "写文件动作清单在")
  assert.ok(text.includes("For the changes you propose, there are no exemptions"), "确认门禁对主动提议改动无豁免")
  assert.ok(text.includes("obvious enough to skip"), "堵死 self-exemption 借口句在")
  assert.ok(text.includes("a new question from the user is not a confirmation"), "用户新问题 ≠ 确认")
  assert.ok(text.includes("Re-confirm when the requirement changes"), "需求变化后重新确认条款在")
  assert.ok(text.includes("outranks this gate"), "doc/code 一致性豁免条款在")
  assert.ok(text.includes("standing obligations you already owe"), "豁免只覆盖既有义务（非泛化）")
  assert.ok(text.includes("the user already confirmed"), "豁免限定于已确认的代码/逻辑")
})



test("prompts/engineering.md: 写文档前计划确认条款（无豁免）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(/Plan confirmation before writing any doc/i.test(text), "条款标题在")
  assert.ok(text.includes("before writing the requirements doc"), "写需求/设计文档前确认")
  assert.ok(text.includes("no exemptions"), "无豁免语义在")
  assert.ok(text.includes("obvious enough to skip"), "堵死 self-exemption 借口句在")
})



test("prompts/engineering.md: 任务大小零裁量声明（2026-09-03——工程模式不分大小全流程）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("Task sizing is NOT your call"), "零裁量声明句在（Mandatory Flow 标题下）")
  assert.ok(text.includes("every user request in this mode runs the full\nMandatory Flow regardless of size"), "不分大小全流程")
  assert.ok(text.includes('"The task is too small / it is just a tweak"'), "小任务借口句点名")
  assert.ok(text.includes("no change is exempt from\nbeing recorded in the design docs"), "无豁免落档语义在")
  assert.ok(text.includes("the user's decision to be\nin engineering mode was the sizing decision"), "进入工程模式即完成尺寸裁定")
})



test("prompts/engineering.md: 修正轮 docs FIRST 条款（2026-09-03——同设计修正轮先落档再 spawn）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("Fix rounds reuse the same designToken — but docs FIRST"), "docs FIRST 声明句在（token 复用 ≠ 免落档）")
  assert.ok(text.includes("has no exemption for fix rounds"), "修正轮无免落档豁免")
  assert.ok(text.includes("is a NEW task needing its own flow and a fresh token"), "token 复用边界：超清单 = 新任务新 token")
  assert.ok(text.includes("BEFORE the eng-coder spawn"), "落档先于 spawn 的命令句在")
  assert.ok(text.includes("Fix-round re-spawns are docs FIRST too"), "step 7 修正轮句 docs FIRST 指针在")
})



test("prompts/engineering.md: 范围扩展评审链——用户对设计形态的拍板 ≠ 设计批准（2026-09-03——扩展仍走完整评审链）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("A user ruling on design CONTENT"), "主句在：设计内容拍板 = 需求确认非设计批准")
  assert.ok(text.includes("NOT design approval"), "拍板 ≠ 批准语义在")
  assert.ok(text.includes("still runs the full review chain"), "扩展（含已批准设计的扩展）仍走完整评审链")
  assert.ok(text.includes("user-initiated advisor review"), "评审链含用户发起的 advisor 评审")
  assert.ok(text.includes('("B", "可以") never shortcuts past review'), "形态拍板示例句在（根因点名——永不越过评审）")
  assert.ok(text.includes("after the advisor review unlocks eng-coder"), "仅评审后的显式 sign-off 解锁 eng-coder")
  assert.ok(text.includes("A user ruling on design form/shape/option choice is NOT this sign-off"), "step 5 指针句在（形态拍板 ≠ sign-off 门）")
  assert.ok(text.indexOf("5. **User sign-off.**") < text.indexOf("NOT this sign-off"), "指针句锚在 step 5（User sign-off）内")
})



test("prompts/engineering.md: 需求池攒批三分句逐字锚（R1——2026-09-03——对照设计文档逐字——fail-when-unchanged）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  const design = readFileSync(join(DOCS_DESIGN_DIR, "METHODOLOGY.md"), "utf8")
  // 三分句 = 设计文档逐字定稿（评审 #1）——从设计锚抽取后逐一断言在 engineering.md 内
  const anchors = [
    design.match(/1\. \*\*Pool routing\*\*——"([^"]+)"/)[1],
    design.match(/2\. \*\*Threshold reminder\*\*——"([^"]+)"/)[1],
    design.match(/3\. \*\*Fast lane\*\*——"([^"]+)"/)[1],
  ]
  assert.equal(anchors.length, 3, "设计文档锚三分句可抽取")
  for (const a of anchors) {
    assert.ok(text.includes(a), `engineering.md 含逐字锚句: ${a.slice(0, 60)}…`)
  }
  // 语义断言目标 1:1（fail-when-unchanged——副本未改必须能失败）
  assert.ok(text.includes("「Requirement Pool」group"), "组短语在（登记去向点名）")
  assert.ok(text.includes("pool-wide ≥3"), "阈值短语在（pool-wide ≥3）")
  assert.ok(text.includes("single-point full flow"), "快车道短语在（single-point full flow）")
  // 幂等性：三分句只出现一次（防重复注入）
  for (const a of anchors) {
    assert.equal(text.split(a).length - 1, 1, `锚句唯一出现: ${a.slice(0, 40)}…`)
  }
})



test("prompts/methodology-template.md: 需求池攒批用户面向块 = 根模板逐字（R1——2026-09-03——fail-when-unchanged）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
  // 语义锚（fail-when-unchanged）
  assert.ok(text.includes("## Requirement-Pool Batched Workflow"), "段头在")
  assert.ok(text.includes("~40 min fixed process cost"), "动机句在（~40 min fixed process cost）")
  assert.ok(text.includes("same board ≥2 points or pool-wide ≥3 points"), "阈值句在（同板块 ≥2 / 池全局 ≥3）")
  assert.ok(text.includes("「Requirement Pool」group"), "组短语在")
  assert.ok(text.includes("single-point full existing flow"), "快车道措辞在（模板语域）")
  // 状态头已批准（根模板同步——非 pending/design）
  assert.ok(text.includes("design — user ruling — approved"), "状态头 = approved")
  // 6 步齐全
  for (const head of ["**Register", "**Accumulate", "**Suggested threshold", "**Batch design", "**Fast lane", "**Boundary"]) {
    assert.ok(text.includes(head), `机制第 ${head} 步在`)
  }
  // 排除书账子节（模板只承载用户面向块）
  assert.ok(!text.includes("### Prompt sync"), "模板无 Prompt sync 书账子节")
  assert.ok(!text.includes("### Acceptance"), "模板无 Acceptance 书账子节")
  assert.ok(!text.includes("### Affected files"), "模板无 Affected files 书账子节")
})



test("需求池三副本不变量断言（评审 #8——阈值 ≥2/≥3 + 边界「池只收用户需求点」跨根模板/项目版/template 对在——防单向漂移）",
  { skip: !existsSync(join(TEST_DIR, "..", "..", "METHODOLOGY.md")) },
  () => {
    // 三副本：根模板（D:/teamcode/METHODOLOGY.md，非 git 文件级）、项目版（docs/design/METHODOLOGY.md）、template 副本（src/prompts/methodology-template.md——设计锚照抄——不再 byte-identical 断言）
    // 根模板在仓外——单独 clone CLI 仓时缺失，动态 skip（与既有仓外依赖测试同惯例）
    const root = readFileSync(join(TEST_DIR, "..", "..", "METHODOLOGY.md"), "utf8")
    const project = readFileSync(join(DOCS_DESIGN_DIR, "METHODOLOGY.md"), "utf8")
    const tmpl = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
    const copies = { 根模板: root, 项目版: project, "template(CLI)": tmpl }
    // 阈值不变量（≥2/≥3）
    for (const [name, c] of Object.entries(copies)) {
      assert.ok(c.includes("≥2") && c.includes("≥3"), `${name} 阈值 ≥2/≥3 在`)
    }
    // 边界不变量（池只收用户需求点——项目版中文/根模板与 template 英文，语义同构；去 ** 加粗标记后匹配机制步原文）
    for (const [name, c] of Object.entries(copies)) {
      const flat = c.replace(/\*/g, "")
      const boundary = /user requirement points? only/i.test(flat) || flat.includes("池只收用户需求点")
      assert.ok(boundary, `${name} 边界「用户需求点 only」在（机制步）`)
    }
  })



test("prompts/engineering.md: UI/交互决策必须落设计文档且必须进 eng-coder 任务书（2026-08-29）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  // 设计文档要素扩项：UI 决策必须落档，未定标 open、绝不静默发明
  assert.ok(
    /MUST also\s+capture every UI\/interaction decision agreed with the user/.test(text),
    "设计步骤要求 UI/交互决策落档",
  )
  assert.ok(text.includes("marked open, never silently invented"), "未定部分标 open、不自行发明")
  // 任务书传递强制：eng-coder 无对话上下文
  assert.ok(
    text.includes("MUST restate the agreed\n   UI/interaction decisions"),
    "任务书必须复述 UI/交互决策",
  )
  assert.ok(
    text.includes("an eng-coder has NO conversation context"),
    "点破机理：子代理零上下文",
  )
  // Hard Rules 独立条目：点破"讨论过但没落文档"是实现无视的根因
  assert.ok(text.includes("UI/interaction decisions ride the full chain"), "Hard Rules 条目在")
  assert.ok(
    text.includes('"Discussed but not written down" is the most common reason'),
    "根因句在（讨论过但没落文档 = 实现无视的最常见原因）",
  )
})



test("prompts/eng-coder.md: UI 按任务书与设计文档执行；缺失则停下报告（2026-08-29）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
  assert.ok(text.includes("UI/interaction: implement exactly what the task brief and design doc state"), "照任务书执行条款")
  assert.ok(text.includes("stop and report the gap"), "缺失 → 停下报告")
  assert.ok(text.includes("do not invent your own interaction design"), "禁止自行发明交互设计")
})



test("prompts/methodology-template.md: 需求文档三层结构落地（2026-08-29 悬空引用修复）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
  assert.ok(text.includes("three layers"), "三层结构点名")
  assert.ok(text.includes("Overall goal"), "第一层：总目标")
  assert.ok(text.includes("Functional user stories"), "第二层：功能用户故事")
  assert.ok(text.includes("Non-functional standards"), "第三层：非功能标准")
  assert.ok(text.includes("concrete enough to design against"), "完成判据在")
  assert.ok(text.includes("traces back to a user story"), "设计验收标准回指用户故事")
})



test("prompts/engineering.md: METHODOLOGY 测试文档是交付评审的一部分（2026-08-29 测试文档口径对齐）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("METHODOLOGY test document is part of the delivery"), "交付评审要求测试文档")
  assert.ok(text.includes("normal / edge / error"), "覆盖三态点名")
  assert.ok(text.includes("a delivery without\n   its test coverage fails the review"), "无测试覆盖 = 交付评审不通过")
})



test("prompts/engineering.md: 委托引导（explore/plan 下沉 + 精度例外 + 并行避让旧句零残留 + escalate 不可用）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(text.includes("goes to an `explore` subagent"), "广度探索 → explore 委托")
  assert.ok(text.includes("quick / medium / thorough"), "彻底度三档")
  assert.ok(text.includes("never enter your history"), "隔离收益点破")
  assert.ok(text.includes("about to edit it immediately"), "精度例外")
  assert.ok(!text.includes("Never assign two parallel eng-coders"), "并行互斥：旧手动避让句零残留（§20.7 调度器条款接管）")
  assert.ok(text.includes("Do NOT redo the exploration you already delegated"), "不重做已委托的探索")
  assert.ok(text.includes("`escalate` is unavailable in engineering mode"), "escalate 不可用（与 setup.mjs fail-closed 一致）")
  assert.ok(text.includes("`consult` stays available"), "consult 保留可用")
})



test("prompts/engineering-sub.md: 内部交付协议——审计/自修/复评/收敛 + 修正轮 N/5 + 永不编辑设计文档（2026-09-02 §18）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  assert.ok(text.includes("## Internal Delivery Protocol"), "内部协议附录段头在（eng-coder 系统提示词）")
  // ①-⑦ 协议步骤
  assert.ok(text.includes("① **Implement**"), "① 实现（零清单外触碰 + 验收自验）")
  assert.ok(text.includes("② **Self-check**"), "② 自查透明表")
  assert.ok(text.includes("③ **Audit**"), "③ explore 偏差审计")
  assert.ok(text.includes("④ Audit dirty"), "④ dirty → 自修 → 再审计")
  assert.ok(text.includes("⑤ Audit clean"), "⑤ clean → advisor code review")
  assert.ok(text.includes("⑥ Findings to fix"), "⑥ findings 自修 → 复评")
  assert.ok(text.includes("⑦ Clean → deliver"), "⑦ 收敛交付（轮次 + 终态）")
  assert.ok(text.includes("terminal state (`clean` | `stalled`)"), "终态 clean/stalled")
  // 审计四类偏差点名
  assert.ok(text.includes("partially implemented acceptance criteria / silent simplifications / doc drift / out-of-list changes"), "四类偏差点名")
  // round4 #4：审计任务书机械并集（非自述）
  assert.ok(text.includes("appended MECHANICALLY (your own spawn task + your actually-touched files)"), "审计任务书机械并集（防自述漏报逃逸）")
  assert.ok(text.includes("never hand the audit a self-written file list"), "禁止自写文件清单")
  // round5 #5：永不编辑设计文档
  assert.ok(text.includes("**Never edit design documents**"), "永不编辑设计文档（设计文档是输入非交付物）")
  // round5 #1：修正轮 N/5 提醒 + 5 轮上限 + stalled 不静默
  assert.ok(text.includes("Correction rounds — max 5"), "修正轮上限 5")
  assert.ok(text.includes("修正轮 N/5"), "每轮 `修正轮 N/5` 提醒")
  assert.ok(text.includes("STOP and deliver a **stalled** report listing the unconverged points"), "超限 → stalled 报告（不静默）")
  assert.ok(text.includes("fails twice in a row → same stalled report"), "节点失败重试 1 次仍败 → stalled")
  assert.ok(text.includes("7th audit spawn is refused mechanically"), "第 7 次审计 spawn 机械拒绝 = stalled 信号")
})



// ─── §18.13 审计范围引导：quick 档（AGENT-LOOP.md §18.13 D-A1.1——T-A1.1/4）───
/** §18.13 quick 档断言（正路径与模拟回归共用——防断言逻辑分叉——fail-when-unchanged）。 */
function assertAuditQuick(text, tag) {
  assert.ok(text.includes('thoroughness: "quick"'), `${tag}: 审计 spawn thoroughness: "quick"（D-A1.1——不再 medium/不随交付规模升 thorough）`)
  assert.ok(text.includes("审计是对照核对——非广度探索——读该读的即止"), `${tag}: 审计=对照核对非广度探索锁句（D-A1.1）`)
}


test("prompts/engineering-sub.md: 审计 spawn quick 档 + 审计对照核对锁句（§18.13 D-A1.1——T-A1.1——fail-when-unchanged）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  assertAuditQuick(text, "T-A1.1")
  // T-A1.4 防回潮：旧档位措辞零残留
  assert.ok(!text.includes("medium unless the delivery is large"), "旧 medium 档位措辞零残留（防回潮）")
})



test("prompts/engineering-sub.md: §18.13 quick 档缺失模拟回归（T-A1.4——删 quick/锁句 → 断言失败——防回潮）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  assertAuditQuick(text, "T-A1.4") // 正路径先证：全锚在
  const regressedQuick = text.replace('thoroughness: "quick"', 'thoroughness: "medium"')
  assert.throws(
    () => assertAuditQuick(regressedQuick, "regressed-quick"),
    /thoroughness: "quick"/,
    "删除 quick 档后断言必须失败（fail-when-unchanged——防回潮）"
  )
  const regressedPhrase = text.replace("审计是对照核对——非广度探索——读该读的即止", "审计要全面覆盖")
  assert.throws(
    () => assertAuditQuick(regressedPhrase, "regressed-phrase"),
    /非广度探索/,
    "删除对照核对锁句后断言必须失败（fail-when-unchanged——防回潮）"
  )
})



// ─── §18.7 测试分层收口 R2（AGENT-LOOP.md §18.7——T-TS1/2/3/7/10/11）───

test("prompts/engineering-sub.md: 三级测试粒度 L1/L0/L2 定义句（§18.7 D-TS1——T-TS1/T-TS11）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  // T-TS1：首次实现 = L1 快层 npm test
  assert.ok(text.includes("**L1 = the fast layer `npm test`**"), "L1 = 快层 npm test 定义句")
  assert.ok(text.includes("AFTER the FIRST implementation only"), "L1 时机 = 首次实现后（每链仅一次）")
  // T-TS1：修正轮 = L0 = 调用 verify 默认模式（不手写 node --test）
  assert.ok(text.includes("**L0 = call `verify` in its default mode**"), "L0 = 调用 verify 默认模式")
  assert.ok(text.includes("syntax check + module-related tests"), "L0 = 语法检查 + 模块相关测试")
  assert.ok(text.includes("Do NOT hand-write `node --test`"), "L0 不手写 node --test")
  // T-TS11：verify null 映射 ACTION REQUIRED 不采用 → 显式升 L1
  assert.ok(text.includes("null-mapping ACTION REQUIRED semantics is NOT adopted"), "verify null 映射 ACTION REQUIRED 语义不采用")
  assert.ok(text.includes("escalate explicitly to L1"), "null 映射/触主干 → 显式升 L1")
  // T-TS1 扩展（D-TS1 fix round1——L0 语义缺口处置）：git-diff 超集已知语义 + 定向路径
  assert.ok(text.includes("Known semantics (D-TS1 fix round1"), "L0 已知语义注（D-TS1 fix round1）在")
  assert.ok(text.includes("locates changed files via git diff"), "L0 已知语义注：verify 依赖 git-diff 定位改动文件")
  assert.ok(text.includes("a SUPERSET (safe direction, not a false positive"), "L0 已知语义注：超集 = 安全方向（非误报）")
  assert.ok(text.includes("cannot hurt acceptance"), "L0 已知语义注：相关测试超集不伤验收——接受")
  assert.ok(text.includes("target `node --test <file>` per `_touchedFiles`"), "L0 定向路径：按 _touchedFiles 定向 node --test <file>")
  assert.ok(text.includes("an explicit narrowing"), "L0 定向 = verify 粒度不足时的显式收缩")
  assert.ok(text.includes("never skip `verify`"), "L0 不手写 = 不得跳过 verify/自写全套——定向不违反")
  // T-TS1：全量 = 父侧 L2（每链终态 1 次——链内不跑）
  assert.ok(text.includes("**L2 = `test:full` full suite**"), "L2 = 全量 test:full 定义句")
  assert.ok(text.includes("runs ONCE at the parent's verification"), "L2 时机 = 父侧核销 1 次")
  assert.ok(text.includes("never run in this chain"), "链内不跑全量")
})



test("prompts/engineering-sub.md: 修正轮默认不重跑审计/复评 + LLM 3 次/链（§18.7 D-TS2——T-TS2/T-TS10）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  // T-TS2：④ 修正轮默认不重跑审计（例外：触碰未覆盖文件回③）
  assert.ok(text.includes("Correction rounds default to NOT re-running the explore audit"), "④ 修正轮默认不重跑 explore 审计")
  // T-TS10：例外路径生效——触碰上次审计/评审未覆盖文件 → 回③重审计
  assert.ok(text.includes("touched files the last audit did not cover"), "例外：触碰上次审计未覆盖文件")
  assert.ok(text.includes("back to ③ (re-audit, the exception path)"), "例外 → 回③重审计")
  // T-TS2：⑥ 修正轮默认 advisor 不重跑；终态前一次终审（复评）
  assert.ok(text.includes("default is NO advisor re-review"), "⑥ 修正轮默认不重跑 advisor 复评")
  assert.ok(text.includes("the final review = the advisor re-review"), "终态前一次终审 = advisor 复评")
  assert.ok(text.includes("NO second explore audit"), "终审不复跑审计")
  assert.ok(text.includes("LLM verification per chain = 3"), "LLM 验证 = 3 次/链（有界——不随修正轮增长）")
})



test("prompts/engineering.md: 父侧核销 = L2 全量 test:full 1 次——不复跑 L1（§18.7 D-TS3——T-TS3）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  // 三处父侧核销文字（step 8 / Work Loop Delivery review 行 / eng-coder delivery 行）
  const occurrences = text.split("parent-side verification = L2 full `test:full` once per chain terminal").length - 1
  assert.ok(occurrences >= 3, `父侧核销 L2 全量 1 次句三处全改（step8 + WorkLoop + delivery 行）——实见 ${occurrences} 处`)
  assert.ok(text.includes("parent-side verification = L2 full `test:full` once per chain terminal"), "父侧核销 = L2 全量 1 次（每链终态）")
  assert.ok(text.includes("no L1 re-run"), "不复跑 L1")
  assert.ok(!text.includes("run the tests it claims pass"), "旧措辞零残留（N-TS4 承诺-实现一致）")
})



test("prompts/advisor-round1.md: B2 范围收缩句 + 批并行句（§18.7 D-TS8——T-TS7）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "advisor-round1.md"), "utf8")
  // :7 范围收缩——聚焦评审对象（交付清单）；设计文档只读相关节（不读全文档）；不读无关模块
  assert.ok(text.includes("**focus on the review scope**"), ":7 聚焦评审范围")
  assert.ok(text.includes("read the review-target files (the delivery list) FIRST"), ":7 优先读评审对象文件")
  assert.ok(text.includes("do NOT read whole documents in full"), ":7 设计文档不读全文档")
  assert.ok(text.includes("do not read unrelated modules just to understand the implementation"), ":7 不读无关模块")
  // :13 批量并行——同一批 read 的多个文件并发执行
  assert.ok(text.includes("multiple files read in one batch execute in PARALLEL (concurrent — do not wait serially)"), ":13 批量 read 并行执行句")
  // 预算 20 轮保持（B3——实测后再议）
  assert.ok(text.includes("budget of 20 tool rounds"), ":4 预算 20 轮保持")
})


// ─── §18.10 判定铁律 + §18.8 对象锚（AGENT-LOOP.md §18.10/§18.8——T-10.1..5）───
const FOUR_ADVISOR_PROMPTS = ["advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"]


test("prompts 4 模板: Judgment Rules 铁律块（§18.10 D-10.1——T-10.1）——R1-R7e + 类型指引句 + 对象声明一致性句", () => {
  for (const f of FOUR_ADVISOR_PROMPTS) {
    const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
    assert.ok(text.includes("## Judgment Rules (apply directly — do not re-derive)"), `${f} 铁律块头在`)
    assert.ok(text.includes("Apply each rule to the extent it matches the review type"), `${f} 按评审类型取适用指引句在`)
    for (const tag of ["R1", "R2", "R3", "R4", "R5", "R6", "R7a", "R7b", "R7c", "R7d", "R7e"]) {
      assert.ok(text.includes(tag), `${f} 含 ${tag}（R1-R7e 铁律）`)
    }
    // §18.8 对象声明一致性句（round2 定稿：全 4 模板加——与铁律同批一次落）
    assert.ok(text.includes("You have received the review-object declaration above"), `${f} 对象声明一致性句在`)
    assert.ok(text.includes("no need to infer the review target from the documents"), `${f} 一致性句语义在`)
  }
})



test("prompts/engineering-sub.md: 机制两句（§18.10 D-10.2——T-10.2——§18.11：mirror 句已取消）——测试缝/授权边界 A 裁定", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  // ① 测试缝句（同 R6——实现遇不可注入直接加 seam）
  assert.ok(text.includes("Test-seam rule: when tests need to mock an internal tool set"), "测试缝句头在")
  assert.ok(text.includes("add a test seam (setter or parameter override with `??` default fallback"), "测试缝 = setter/override + ?? 兜底")
  assert.ok(text.includes("default null keeps production behavior unchanged"), "默认 null 生产零变化")
  assert.ok(text.includes("restore in finally"), "finally 恢复")
  // ② 授权边界句（A 裁定：允许但逐项报告）
  assert.ok(text.includes("Out-of-file-list changes: ALLOWED when required by the delivery"), "清单外改动允许句在")
  assert.ok(text.includes("changed AND not reported (silent overreach)"), "审计判据 = 改了未报告＝偏差")
  assert.ok(text.includes("reported = transparent/acceptable"), "已报告 = 透明可接受")
  // ③ mirror 句零残留（§18.11——byte-identical 测试已不存在——防复活回归）
  assert.ok(!text.includes("Mirror-parallel semantics"), "mirror 并行句零残留（§18.11）")
})



test("prompts/engineering-sub.md: 无旧硬句（F1 收敛——2026-09-04 §18.10 D-10.2 A 裁定同向——防回归）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  assert.ok(!text.includes("Do NOT modify any file not listed"), "旧硬句 1 零残留（'Do NOT modify any file not listed'）")
  assert.ok(!text.includes("zero touches outside the approved file list"), "旧硬句 2 零残留（'zero touches outside the approved file list'）")
})



test("prompts 4 模板铁律块: 通用性（§18.10 D-10.1/T-10.3 扩）——无项目名/符号/CLI|VS Code 形态", () => {
  for (const f of FOUR_ADVISOR_PROMPTS) {
    const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
    const start = text.indexOf("## Judgment Rules")
    assert.ok(start !== -1, `${f} 铁律块头在`)
    const block = text.slice(start).toLowerCase()
    for (const bad of ["thincoder", "vscode", "vs code", "cli ", "_runadvisortoolloop", "_setadvisortoolsetfortest"]) {
      assert.ok(!block.includes(bad), `${f} 铁律块无“${bad}”（通用性——不锁项目）`)
    }
  }
})



test("prompts 4 模板铁律块: 来源标注诚实（§18.10 D-10.4——T-10.5）", () => {
  for (const f of FOUR_ADVISOR_PROMPTS) {
    const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
    assert.ok(text.includes("Source: 7-round sample"), `${f} 来源标注句在（样本 7 轮）`)
    assert.ok(text.includes("continuously re-reviewed"), `${f} 持续复核句在`)
  }
})

// ─── §12.1 advisor 角色定位/职责边界（AGENT-LOOP.md §12.1——T-AR1..4——与 T-10.1 同 file）───
const ADVISOR_ROLE_ANCHOR_PHRASES = [
  ["Your role (identity", "锚段标题（Your role (identity）"],
  ["You are an INDEPENDENT REVIEWER — authority in judgment, not in decisions.", "身份权威句（INDEPENDENT REVIEWER）"],
  ["**Stance**", "Stance 立场句"],
  ["**Evidence discipline**", "Evidence discipline 证据纪律句"],
  ["**Boundary**", "Boundary 边界句"],
  ["**Neutrality**", "Neutrality 中立句"],
  ["Do NOT write replacement text", "F-AR4 不代笔句（replacement text）"],
]

function assertAdvisorRoleAnchor(text, f) {
  for (const [phrase, label] of ADVISOR_ROLE_ANCHOR_PHRASES) {
    assert.ok(text.includes(phrase), `${f} §12.1 角色锚缺「${label}」：${JSON.stringify(phrase)}`)
  }
  // 落位：角色段先于规则层（Judgment Rules 铁律块）+ 先于评审标准/工作流段（D-AR1）——角色段最先、规则层随后
  const anchorPos = text.indexOf("## Your role (identity")
  const rulesPos = text.indexOf("## Judgment Rules (apply directly — do not re-derive)")
  const criteriaPos = Math.min(
    ...[text.indexOf("## Review Criteria"), text.indexOf("Review workflow:")].map((i) => (i === -1 ? Infinity : i))
  )
  assert.ok(anchorPos !== -1, `${f} 角色锚段在`)
  assert.ok(rulesPos !== -1, `${f} 铁律块头在`)
  assert.ok(anchorPos < rulesPos, `${f} 角色段先于铁律块（角色段最先、规则层随后）`)
  assert.ok(criteriaPos !== Infinity, `${f} 评审标准/工作流段头在`)
  assert.ok(anchorPos < criteriaPos, `${f} 角色段先于评审标准/工作流段（D-AR1 落位）`)
}


test("prompts 4 模板: §12.1 角色锚（T-AR1——六锚句 + F-AR4 replacement text 句——fail-when-unchanged）", () => {
  for (const f of FOUR_ADVISOR_PROMPTS) {
    assertAdvisorRoleAnchor(readFileSync(join(PROMPTS_DIR, f), "utf8"), f)
  }
})



test("prompts 4 模板: §12.1 证据纪律禁止句（T-AR2——NEVER assert Known behavior…）", () => {
  for (const f of FOUR_ADVISOR_PROMPTS) {
    const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
    assert.ok(text.includes('NEVER assert "Known behavior…"'), `${f} 禁止句在（证据纪律落地）`)
    assert.ok(text.includes("\"I'm confident…\""), `${f} confident 禁句在（同句语义）`)
  }
})



test("prompts/advisor-design.md: §12.1 锚缺失模拟回归（T-AR4——删除一锚句 → 断言失败）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "advisor-design.md"), "utf8")
  assertAdvisorRoleAnchor(text, "advisor-design.md") // 正路径先证：全锚在
  const regressed = text.replace(
    "You are an INDEPENDENT REVIEWER — authority in judgment, not in decisions.",
    "You serve as a reviewer."
  )
  assert.throws(
    () => assertAdvisorRoleAnchor(regressed, "regressed"),
    /INDEPENDENT REVIEWER/,
    "删除身份权威句后角色锚断言必须失败（fail-when-unchanged——防回归）"
  )
})



// ─── §7.3 coder/consult-base 子代理人格锚（AGENT-LOOP.md §7.3——T-SP1/2/4——与 T-AR 同 file；T-SP3 零破坏回归由既有模板断言套件承担——全量套件验证）───
const CODER_ROLE_ANCHOR_PHRASES = [
  ["## Your role (identity — read before you code)", "锚段标题（Your role (identity）"],
  ["You are an IMPLEMENTER with independent judgment — not a typewriter.", "身份句（IMPLEMENTER with independent judgment）"],
  ["**Evidence discipline**", "Evidence discipline 证据纪律句"],
  ["**Neutrality**", "Neutrality 中立句"],
  ["**Boundary**", "Boundary 边界句"],
  ["STOP and report the conflict", "F-SP2 停报句（STOP and report）"],
  ['NEVER assert "Known behavior…"', "禁记忆断言句（Known behavior…）"],
]

const CONSULT_ROLE_ANCHOR_PHRASES = [
  ["## Your role (identity — read before you answer)", "锚段标题（Your role (identity）"],
  ["**Evidence discipline**", "Evidence discipline 证据纪律句"],
  [/"I don't know" is a valid\s+consultant answer/, "F-SP3 不知就说句（I don't know is a valid consultant answer）"],
  [/Recommend and reason;\s+the main agent integrates/, "F-SP3 建议推理句（recommend and reason）"],
  [/Do not write\s+fixes or replacement text/, "F-SP3 不代笔句（replacement text）"],
]

function phraseIn(text, phrase) {
  return typeof phrase === "string" ? text.includes(phrase) : phrase.test(text)
}

function phraseLabel(phrase) {
  return typeof phrase === "string" ? JSON.stringify(phrase) : String(phrase)
}

function assertCoderRoleAnchor(text, f) {
  const rolePos = text.indexOf("You are a coding subagent")
  assert.ok(rolePos !== -1, `${f} 角色句在`)
  for (const [phrase, label] of CODER_ROLE_ANCHOR_PHRASES) {
    assert.ok(phraseIn(text, phrase), `${f} §7.3 coder 锚缺「${label}」：${phraseLabel(phrase)}`)
  }
  const anchorPos = text.indexOf("## Your role (identity — read before you code)")
  assert.ok(anchorPos !== -1, `${f} 锚段标题在`)
  assert.ok(anchorPos > rolePos, `${f} 锚在角色句之后插入（D-SP1 落位）`)
  // D-SP1：锚紧跟角色句（仅空白间隔）——防编辑把锚挪走（如移文末）后断言仍绿的弱化
  const roleLineEnd = text.indexOf("\n", rolePos)
  assert.ok(roleLineEnd !== -1, `${f} 角色句行尾在`)
  assert.ok(text.slice(roleLineEnd, anchorPos).trim() === "", `${f} 锚紧跟角色句（D-SP1 落位——锚在角色句后且其间无其他内容）`)
}

function assertConsultRoleAnchor(text, f) {
  const rolePos = text.indexOf("You are one of several independent expert consultants")
  assert.ok(rolePos !== -1, `${f} 角色句在`)
  for (const [phrase, label] of CONSULT_ROLE_ANCHOR_PHRASES) {
    assert.ok(phraseIn(text, phrase), `${f} §7.3 consult 锚缺「${label}」：${phraseLabel(phrase)}`)
  }
  const anchorPos = text.indexOf("## Your role (identity — read before you answer)")
  assert.ok(anchorPos !== -1, `${f} 锚段标题在`)
  assert.ok(anchorPos > rolePos, `${f} 锚在角色句之后插入（D-SP2 落位）`)
  const roleLineEnd = text.indexOf("\n", rolePos)
  assert.ok(roleLineEnd !== -1, `${f} 角色句行尾在`)
  assert.ok(text.slice(roleLineEnd, anchorPos).trim() === "", `${f} 锚紧跟角色句（D-SP2 落位——锚在角色句后且其间无其他内容）`)
}


test("prompts/coder.md: §7.3 人格锚（T-SP1——IMPLEMENTER/证据纪律/中立/边界/STOP and report——fail-when-unchanged）", () => {
  assertCoderRoleAnchor(readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8"), "coder.md")
})



test("prompts/consult-base.md: §7.3 人格锚（T-SP2——证据纪律/I don't know 合法/recommend and reason——fail-when-unchanged）", () => {
  assertConsultRoleAnchor(readFileSync(join(PROMPTS_DIR, "consult-base.md"), "utf8"), "consult-base.md")
})



test("prompts/coder.md + consult-base.md: §7.3 锚缺失模拟回归（T-SP4——删除一锚句 → 断言失败——防回潮）", () => {
  // coder 侧
  const coderText = readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8")
  assertCoderRoleAnchor(coderText, "coder.md") // 正路径先证：全锚在
  const regressedCoder = coderText.replace(
    "You are an IMPLEMENTER with independent judgment — not a typewriter.",
    "You are a coding assistant."
  )
  assert.throws(
    () => assertCoderRoleAnchor(regressedCoder, "regressed-coder"),
    /身份句（IMPLEMENTER with independent judgment）/,
    "删除身份句后 coder 锚断言必须失败（fail-when-unchanged——防回潮）"
  )
  // consult 侧
  const consultText = readFileSync(join(PROMPTS_DIR, "consult-base.md"), "utf8")
  assertConsultRoleAnchor(consultText, "consult-base.md")
  const regressedConsult = consultText.replace(
    /"I don't know" is a valid\s+consultant answer/,
    "\"I don't know\" may be acceptable"
  )
  assert.throws(
    () => assertConsultRoleAnchor(regressedConsult, "regressed-consult"),
    /F-SP3 不知就说句（I don't know is a valid consultant answer）/,
    "删除不知就说句后 consult 锚断言必须失败（fail-when-unchanged——防回潮）"
  )
})




test("prompts/engineering.md: 首次交付偏差审计既有断言随 §18 下沉更新（2026-09-02）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  // step 7：交付已内部审计——父侧不双重审计（2026-08-30 父侧审计节点随 §18 下沉）
  assert.ok(text.includes("7. **Delivery arrives already audited"), "流程 step 7 = 已内部审计（标题）")
  assert.ok(text.includes("do not double-audit"), "防双重审计/误用")
  assert.ok(text.includes("`explore` subagent audited the delivered code"), "内部审计走 explore 子 agent")
  assert.ok(text.includes("silent simplifications"), "审计点名静默简化")
  assert.ok(text.includes("changes outside the approved file list AND not reported in the delivery report"), "超清单改动点名（含 AND not reported——A 裁定口径）")
  assert.ok(text.includes("capped at 5\n   correction rounds"), "修正轮 ≤5（内部）")
  assert.ok(text.includes("7th audit spawn is\n   refused mechanically"), "第 7 次审计 spawn 机械拒绝")
  assert.ok(text.includes("spawn the fix round with the report's"), "stalled → 修正轮任务 = 未收敛点清单")
  assert.ok(text.includes("unconverged points as the task brief"), "任务书 = 未收敛点清单（不发明新内容）")
  assert.ok(!text.includes("SECOND time with the\n     divergence list as the task brief"), "2026-08-30 父侧二次 spawn 句式已随 §18 移除")
  assert.ok(!text.includes("verify the\n     divergence list point by point"), "父侧逐点核销句式已随 §18 移除")
  assert.ok(text.includes("Delivery (async settle)"), "工作循环状态表含 async settle 态（替代 First delivery audit）")
  assert.ok(!text.includes("First delivery audit"), "First delivery audit 父侧审计态已移除")
  assert.ok(text.includes("Automatic either way"), "自动节点语义保留（内部协议默认承担）")
})



test("prompts/eng-coder.md: 实现保真——不许静默降级（2026-08-30）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
  assert.ok(text.includes("Implement to the full design — no silent degradation"), "正面禁止句在")
  assert.ok(text.includes("implement it anyway and note the cost"), "贵也要实现+报告成本")
  assert.ok(text.includes("A \"simpler\n  approximation\" of a specified behavior IS a deviation"), "近似实现 = 偏离")
  assert.ok(text.includes("BEFORE coding —\n  never ship a reduced version and disclose it afterwards"), "先停下呈报，不许事后披露降级交付")
  assert.ok(text.includes("the parent approved the design, not your\n  discount"), "点破：批准的是设计不是折扣")
})



test("prompts/eng-coder.md: 交付自查第 6 项——设计文档结构快照回写（2026-08-30）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
  assert.ok(text.includes("6. Update the affected design-doc sections"), "自查第 6 项在")
  assert.ok(text.includes("module map / affected-files table"), "模块地图/受影响文件表点名")
})

test("prompts/engineering-sub.md: 子代理确认例外——无用户可等、执行不空转（2026-09-02）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
  assert.ok(text.includes("You are a SUBAGENT"), "子代理身份声明在")
  assert.ok(text.includes("There is no user to wait for"), "无用户可等声明在（确认例外）")
  assert.ok(text.includes("execute immediately, never ask for confirmation"), "立即执行 + 禁止再确认")
  assert.ok(text.includes('"waiting for approval" message'), "禁止等待批准式收尾")
  assert.ok(text.includes("note it in your final report and return"), "歧义 → 写最终报告返回")
})



test("agent/setup.mjs: METHODOLOGY 缺失警告——模板绝对路径 + 正文注入 + 询问引导保留（2026-09-02 D-M1..D-M3/D-AC1..D-AC2）", async () => {
  const text = readFileSync(join(SRC_DIR, "agent", "setup.mjs"), "utf8")
  // 2026-08-29 既有断言保留：点名后果而非仅缺席
  assert.ok(text.includes("every 'per METHODOLOGY' reference in the engineering prompt is dangling"), "悬空引用后果点名")
  assert.ok(text.includes("three-document hard flow"), "硬流程后果点名")
  // D-M3：恢复路径仍先问用户（确认后写 cwd/METHODOLOGY.md，不自动脚手架）
  assert.ok(text.includes("Ask the user whether to create METHODOLOGY.md"), "恢复路径：先问用户")
  assert.ok(text.includes("write cwd/METHODOLOGY.md before designing"), "确认后写 cwd/METHODOLOGY.md")
  // D-M1：模板路径为运行时解析的绝对路径（import.meta.url 同源拼接），静态相对路径已移除
  assert.match(text, /resolve\(dirname\(fileURLToPath\(import\.meta\.url\)\)[^;]*methodology-template\.md/, "模板绝对路径解析表达式在")
  assert.ok(!text.includes("scaffold available as src/prompts/methodology-template.md"), "静态相对路径已移除")
  // D-M2：正文前缀为设计文档字面标注（与 VS Code setup-reminders.mjs 同文，两端一致）
  assert.ok(text.includes("built-in template（可 read ${engResult.methodologyTemplatePath} 或直接参考以下内容）:"), "D-M2 标注句（设计文档字面）")
  // D-AC2：该路径真实存在——模型可沿绝对路径 read 到模板
  const tmplPath = join(PROMPTS_DIR, "methodology-template.md")
  assert.ok(existsSync(tmplPath), "模板文件存在（模型可 read）")
  // D-M2/D-AC1：缺失 METHODOLOGY.md 时返回模板绝对路径 + 模板正文（首行内容断言）
  const { buildEngineeringPrompt } = await import("../src/agent/setup.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-methodology-missing-"))
  try {
    const result = await buildEngineeringPrompt(cwd, "eng-coder")
    assert.equal(result.methodologyMissing, true, "无 METHODOLOGY.md → methodologyMissing")
    assert.ok(result.methodologyTemplatePath, "返回模板绝对路径")
    assert.ok(result.methodologyTemplatePath.endsWith(join("prompts", "methodology-template.md")), "路径指向 methodology-template.md")
    assert.ok(result.methodologyTemplateBody, "返回模板正文")
    assert.ok(result.methodologyTemplateBody.startsWith("# METHODOLOGY — AI Agent Collaboration"), "模板首行内容注入")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- workflow/debugging 必须用 task（2026-08-23）
// discipline.md 内容级断言：副本内容未改时必须能失败（§18.11——各端内容断言防漂移）。


test("prompts/discipline.md: Workflow/Debugging 要求用 task（内容级断言）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
  const lines = text.split("\n")

  // 关键短语全文断言（内容一旦回退即失败）
  assert.ok(/every tier/i.test(text), "全英文短语 every tier 在（文件为 EVERY tier，大小写不敏感）")
  assert.ok(text.includes("one in_progress"), "短语 one in_progress 在")

  // Workflow 总规句：use `task` … every tier … one (item) in_progress
  const rule = lines.find((l) => /every tier/i.test(l))
  assert.ok(rule, "Workflow 总规行存在")
  assert.ok(/use `task`/i.test(rule), "总规含 use `task`")
  assert.ok(/one .*in_progress/i.test(rule), "总规含 one … in_progress（原文为 one item in_progress）")

  // 分层追踪工具断言
  const complex = lines.find((l) => /Complex \(3\+ steps/.test(l.trim()))
  assert.ok(complex, "Complex 层存在")
  assert.ok(complex.includes("`checklist`"), "Complex 层仍含 checklist 双轨")
  const medium = lines.find((l) => /Medium \(2-3 steps/.test(l.trim()))
  assert.ok(medium, "Medium 层存在")
  assert.ok(medium.includes("`task`"), "Medium 层含 task")
  const small = lines.find((l) => /Small \(typo, one-line fix\)/.test(l.trim()))
  assert.ok(small, "Small 层存在")
  assert.ok(small.includes("`task`"), "Small 层含 task（单行小改也要 task）")

  // Debugging 段：四步 + task + one in_progress
  assert.ok(text.includes("reproduce → locate root cause → fix → verify"), "Debugging 段含调试四步")
  const debugLine = lines.find((l) => l.includes("reproduce → locate root cause → fix → verify"))
  assert.ok(debugLine, "Debugging 调试句存在")
  assert.ok(debugLine.includes("`task`"), "调试句含 task")
  assert.ok(debugLine.includes("one in_progress"), "调试句含 one in_progress")
})

// ---------------------------------------------------------------- 读/更新文档嵌入 Workflow 箭头序列（2026-08-23）
// discipline.md 内容级断言：副本内容未改时必须能失败（§18.11——各端内容断言防漂移）。


test("prompts/discipline.md: 读/更新文档已嵌入 Workflow 箭头序列（无独立 Documentation 段）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
  const lines = text.split("\n")

  // 无独立 Documentation 段头（上版「Documentation — read before you write」已删除）
  assert.ok(
    !lines.some((l) => l.trim().startsWith("Documentation —")),
    "不存在 Documentation — 段头（读/更新文档已嵌入 Workflow）",
  )

  // 读文档总规句（Workflow 段首）：read the relevant docs + document map + ANY tier
  const readLine = lines.find((l) => /read the relevant docs before changing code/i.test(l))
  assert.ok(readLine, "读文档总规句存在")
  assert.ok(readLine.includes("at ANY tier"), "范围标记 ANY tier 在")
  assert.ok(readLine.includes("the document map"), "the document map（文档地图）在")
  assert.ok(readLine.includes("docs/design/README.md"), "文档地图路径 docs/design/README.md 在")
  assert.ok(readLine.includes("AGENTS.md if present"), "AGENTS.md if present 在")

  // Complex 层箭头：Read the docs → Requirements → Design → Development → Testing（不加 update the owning doc——已写设计文档）
  const complex = lines.find((l) => /Complex \(3\+ steps/.test(l.trim()))
  assert.ok(complex, "Complex 层存在")
  assert.ok(complex.includes("Read the docs → Requirements → Design → Development → Testing"), "Complex 箭头完整")
  assert.ok(!complex.includes("update the owning doc"), "Complex 层不含 update the owning doc")

  // Medium 层箭头：Read the docs → Plan → Change → update the owning doc 强触发（D-N1.5——无 gap-spotting 触发）
  const medium = lines.find((l) => /Medium \(2-3 steps/.test(l.trim()))
  assert.ok(medium, "Medium 层存在")
  assert.ok(medium.includes("Read the docs → Plan → Change"), "Medium 箭头含 Read the docs → Plan → Change")
  assert.ok(medium.includes("update the owning doc — a decision or completed change is recorded there"), "Medium 箭头含 update the owning doc 强触发（D-N1.5——无 gap-spotting 触发）")

  // Small 层箭头：Read the docs → Change → Verify → update the owning doc 强触发（D-N1.5——无豁免）
  const small = lines.find((l) => /Small \(typo, one-line fix\)/.test(l.trim()))
  assert.ok(small, "Small 层存在")
  assert.ok(small.includes("Read the docs → Change → Verify"), "Small 箭头含 Read the docs → Change → Verify")
  assert.ok(small.includes("decisions and completed changes are backfilled"), "Small 箭头含 backfilled 强触发（D-N1.5——无豁免）")

  // 归属句（Workflow 段末）：Never create a new doc + find the owner and amend
  const ownLine = lines.find((l) => l.includes("Never create a new doc"))
  assert.ok(ownLine, "归属句存在")
  assert.ok(ownLine.includes("find the owner and amend"), "归属句含 find the owner and amend")
})



test("prompts/discipline.md: 用户约定执行纪律条款在（2026-08-31 两次违约教训——滚动翻窗/懒加载 PgUp，防回退）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
  assert.ok(text.includes("用户约定执行纪律"), "纪律条款标题在")
  assert.ok(text.includes("不得用"), "不得用（等效实现替换约定）在")
  assert.ok(text.includes("以用户原话为准"), "以用户原话为准在")
  assert.ok(text.includes("升级路径"), "不得包装成升级路径交付在")
})


// ---------------------------------------------------------------- 搜索工具优先级条款（2026-09-02 用户问题 Q5；PROMPT-DECOUPLING.md 变更段 D-P1）
// 措辞由测试锁定：MCP 优先 / websearch 仅备用 / 连续 2 次垃圾即切 / 镜像路径优先 / 动手前扫工具表。
// T1 = discipline.md（普通模式顶层组件）；T4 = 工程模式顶层（system.md + engineering.md 组装，setup.mjs:254 纯拼接）。


test("prompts/discipline.md: 搜索工具优先级条款 — MCP 优先、websearch 仅备用（T1/D-P1）", () => {
  const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
  assert.ok(text.includes("Search tool priority"), "条款段标题在")
  assert.ok(text.includes("MCP search tools"), "MCP 搜索工具点名")
  assert.ok(text.includes("PRIMARY for technical"), "技术查证/通用搜索 MCP 优先")
  assert.ok(text.includes("is ONLY the fallback"), "websearch 仅备用")
  assert.ok(text.includes("twice in a row"), "连续 2 次垃圾结果即切换")
  assert.ok(text.includes("repeat the same query"), "不重复同 query")
  assert.ok(text.includes("mirror path"), "被墙站点走镜像路径")
  assert.ok(text.includes("scan the tool table"), "抓页面前先扫工具表")
})



test("prompts/engineering.md: 搜索工具优先级条款同规则 — 工程模式顶层 prompt 含同语义句（T4/D-P1）", () => {
  const sys = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
  const eng = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  const topLevel = `${sys}\n\n${eng}` // 工程模式顶层组装 = corePrompt + engineering prompt（setup.mjs:254 纯拼接）
  assert.match(topLevel, /Search tool priority/i, "条款段在工程模式顶层 prompt 中")
  assert.ok(topLevel.includes("MCP search tools"), "MCP 搜索工具点名")
  assert.ok(topLevel.includes("PRIMARY for technical"), "技术查证/通用搜索 MCP 优先")
  assert.ok(topLevel.includes("is ONLY the fallback"), "websearch 仅备用")
  assert.ok(topLevel.includes("twice in a row"), "连续 2 次垃圾结果即切换")
  assert.ok(topLevel.includes("repeat the same query"), "不重复同 query")
  assert.ok(topLevel.includes("mirror path"), "被墙站点走镜像路径")
  assert.ok(topLevel.includes("scan the tool table"), "抓页面前先扫工具表")
})


// ---------------------------------------------------------------- 探索蒸馏异步化（SEND-STALL-DISTILL 2026-08-25）
// 轮末蒸馏不阻塞回合返回（AC1）；下一轮开头 await 落定后再 push 输入（AC2/N1）；
// onDistilled 仅在替换历史时触发（AC3）；蒸馏失败静默、历史原样（AC4）。
// 注意：蒸馏触发门槛是单轮 ≥3 条纯探索工具结果（distillExplorations resultCount < 3 → null），
// 因此每个用例的探索段都用 3 次 read 工具调用凑够门槛。

/** 3 次 read 探索工具调用（凑足蒸馏门槛）的 LLM 脚本前缀。 */
const READ_TRIPLE = [
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "a.txt" }) } },
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "b.txt" }) } },
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "c.txt" }) } },
]




// ────────────────────────────────────────
// 文档归属纪律 + advisor 设计评审增强（2026-08-21，AGENT-LOOP.md §12）
// ────────────────────────────────────────

const TEST_DIR_ABS = dirname(fileURLToPath(import.meta.url)) // thincoder/test
const SRC_DIR_ABS = join(TEST_DIR_ABS, "..", "src")
const PROMPTS_DIR_ABS = join(SRC_DIR_ABS, "prompts")


test("prompts/advisor-design.md: Document ownership 维度 + 🔴/🟡 分级 + 引用纪律 + Approval Signal 保留", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "advisor-design.md"), "utf8")
  assert.ok(text.includes("Document ownership"), "第 7 维 Document ownership 存在")
  assert.match(text, /CONTRADICTS[^\n]*🔴/, "与现有文档矛盾 → 🔴 分级句")
  assert.match(text, /duplicating[^\n]*🟡/, "该并入却新建/重复描述 → 🟡 分级句")
  assert.ok(text.includes("file:line"), "引用纪律：精确 file:line 格式")
  assert.ok(text.includes("unverified"), "引用纪律：未核实内容标注 unverified")
  assert.ok(text.includes("## Approval Signal"), "Approval Signal 段保留")
  assert.ok(text.includes("[DESIGN-TOKEN:...]"), "DESIGN-TOKEN 回显规则保留（防 fallback 删除后丢失）")
})



test("prompts/system.md: 文档归属纪律条款（doc map / update instead of creating）", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "system.md"), "utf8")
  assert.ok(text.includes("Document ownership"), "条款存在")
  assert.ok(text.includes("docs/design/README.md"), "doc map 定位句")
  assert.match(text, /update it; never create a new file/, "找到就改、不得新建（update instead of creating）")
  assert.match(text, /exactly ONE place/, "单一权威源语义")
})



test("prompts/system.md: 操作并行化纪律条款（Parallelize aggressively + F7 触发条件 + 不并行边界 + 调度器 carve-out）", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "system.md"), "utf8")
  assert.match(text, /Parallelize aggressively/, "主动并行引导句存在")
  assert.match(text, /splitting changes across independent sub-projects/, "F7 多项目拆分语义")
  assert.match(text, /share no files, have no cross-dependencies, and each has its own tests/, "F7 触发条件（全部满足才拆）")
  assert.match(text, /Do NOT parallelize/, "不并行边界引导")
  assert.match(text, /approval storms/, "审批风暴边界（bash/审批敏感命令）")
  assert.match(text, /micro-parallelism/, "微操作不并行（收益判断）")
  // §20.7 T-PS3：D1 条款 carve-out——声明 files 的 async spawn → 调度器排队（旧禁令限定未声明/工具级并行写）
  assert.match(text, /writes to the same file \(except async spawns with `files` declared/, "carve-out：声明 files 的 async spawn 例外在（T-PS3）")
  assert.match(text, /scheduler queues overlapping ones until clear/, "carve-out 术语与 D-PS1/D-PS2 一致（scheduler/queued）")
})



test("docs/design/README.md: 文档地图存在且含板块映射表 + 待合并标注", () => {
  const text = readFileSync(join(SRC_DIR_ABS, "..", "docs", "design", "README.md"), "utf8")
  assert.ok(text.includes("板块 → 文档映射"), "映射表存在")
  assert.match(text, /\| 架构 \|/, "架构板块行")
  assert.match(text, /\| 工具系统 \|/, "工具板块行")
  assert.ok(text.includes("待合并（TODO）"), "存量碎片待合并标注")
})



test("advisor.mjs: design 提示词硬加载——无 ADVISOR_DESIGN_FALLBACK 残留，内容与文件逐字节一致", () => {
  const src = readFileSync(join(SRC_DIR_ABS, "advisor.mjs"), "utf8")
  assert.ok(!src.includes("ADVISOR_DESIGN_FALLBACK"), "ADVISOR_DESIGN_FALLBACK 常量已删除")
  assert.ok(src.includes('loadPrompt("advisor-design.md"'), "design 提示词走 loadPrompt 硬加载（缺失即抛错，与 round1/2/3 同待遇）")
  const prompt = buildAdvisorSystemPrompt({ history: [], _advisorRound: 0, cwd: tmpdir() }, null, "design")
  const file = readFileSync(join(PROMPTS_DIR_ABS, "advisor-design.md"), "utf8")
  assert.equal(prompt, file, "设计审查系统提示词与 advisor-design.md 逐字节一致（无静默降级）")
})



test("advisor: MAX_RESULT_CHARS = 64 * 1024（65536，与主链路落盘阈值一致）", () => {
  assert.equal(MAX_RESULT_CHARS, 64 * 1024, "advisor 工具结果截断上限 = 64K（旧 12K，line-aware 截断逻辑不变）")
})




test("buildAdvisorUserMessage: design 分支 Instructions 补 Methodology compliance 维度", () => {
  const agent = { history: [], _advisorRound: 0, cwd: tmpdir(), config: {} }
  const msg = buildAdvisorUserMessage(agent, null, "design")
  assert.ok(msg.includes("methodology compliance (does it follow the project's METHODOLOGY.md?)"), "Instructions 第 2 条含 Methodology 维度")
})



test("buildAdvisorUserMessage: 存在 docs/design/README.md 时 design 分支注入 Document Map 段", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    mkdirSync(join(tmp, "docs", "design"), { recursive: true })
    writeFileSync(join(tmp, "docs", "design", "README.md"), "# 文档地图\n\n| 板块 | 文档 |\n| 架构 | ARCHITECTURE.md |\n")
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design")
    assert.ok(msg.includes("## Document Map"), "Document Map 段注入")
    assert.ok(msg.includes("| 架构 | ARCHITECTURE.md |"), "地图文件内容注入")
    const mapIdx = msg.indexOf("## Document Map")
    const instrIdx = msg.indexOf("## Instructions")
    assert.ok(mapIdx !== -1 && instrIdx !== -1 && mapIdx < instrIdx, "Document Map 位于 Instructions 之前")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})



test("buildAdvisorUserMessage: 无 docs/design/README.md 时 design 分支正常跳过 Document Map 段", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design")
    assert.ok(!msg.includes("## Document Map"), "无地图时不注入")
    assert.ok(msg.includes("## Design Review"), "设计审查消息本体正常")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})



test("buildAdvisorUserMessage: 子项目有 AGENTS.md + 文档地图 → 注入子项目地图（guideRoot 发现逻辑）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "advisor-docmap-"))
  try {
    mkdirSync(join(tmp, "sub", "docs", "design"), { recursive: true })
    writeFileSync(join(tmp, "sub", "AGENTS.md"), "# 子项目指南\n")
    writeFileSync(join(tmp, "sub", "docs", "design", "README.md"), "# 子地图\n\n| 板块 | 文档 |\n| x | y.md |\n")
    const agent = { history: [], _advisorRound: 0, cwd: tmp, config: {} }
    const msg = buildAdvisorUserMessage(agent, null, "design", null, ["sub/docs/design/d.md"])
    assert.ok(msg.includes("## Document Map"), "Document Map 段注入")
    assert.ok(msg.includes("# 子地图"), "子项目文档地图内容注入")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})



// ---------------------------------------------------------------- §20.9 Module Split Policy（2026-09-04——D-P1.1 锚——fail-when-unchanged）

test("prompts/system.md: Module Split Policy 段含 write-first / assertion count 短语（T-P1.1 — D-P1.1 锚——fail-when-unchanged）", () => {
  const text = readFileSync(join(PROMPTS_DIR_ABS, "system.md"), "utf8")
  assert.ok(text.includes("Module Split Policy"), "T-P1.1: system.md 含「Module Split Policy」——fail-when-unchanged（段被删即失败）")
  assert.ok(text.includes("write-first"), "T-P1.1: system.md 含「write-first」——fail-when-unchanged")
  assert.ok(text.includes("assertion count"), "T-P1.1: system.md 含「assertion count」——fail-when-unchanged（评审 #6 独特断言词）")
})

test("prompts: §21 普通模式偏差审计锚（T-N1——main/coder/discipline——fail-when-unchanged）", () => {
  const mainText = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
  const coderText = readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8")
  const discText = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
  // T-N1.1：main.md D-N1.1 验证锚（自动补写 + 四类偏差——fail-when-unchanged）
  assert.ok(mainText.includes("landed in the board design doc"), "T-N1.1: main.md 含 D-N1.1 锚 landed in the board design doc")
  assert.ok(mainText.includes("add a short change record"), "T-N1.1: main.md 含自动补写锚 add a short change record")
  assert.ok(mainText.includes("deviations (partial implementation / silent simplification / doc drift / out-of-scope)"), "T-N1.1: main.md 含四类偏差锚")
  // T-N1.2：coder.md D-N1.2 一致性自查行
  assert.ok(coderText.includes("consistency self-check"), "T-N1.2: coder.md 含一致性自查行 consistency self-check")
  // T-N1.4：discipline.md D-N1.5 强触发（M/S 无 gap-spotting 触发）
  assert.ok(discText.includes("update the owning doc — a decision or completed change is recorded there"), "T-N1.4: discipline.md 含 Medium 强触发锚")
  assert.ok(discText.includes("small changes are documented too"), "T-N1.4: discipline.md 含 small changes are documented too")
  // T-N1.5：旧弱触发零残留
  // T-N1.7（2026-09-05 扩展注 F-N1.4）：完成前核对→修正闭环锚（main How-you-finish + D-N1.1 尾 + coder 自查尾——fail-when-unchanged）
  assert.ok(mainText.includes("reconcile the delivery against the owning design doc"), "T-N1.7: main.md How-you-finish 含完成前核对锚")
  assert.ok(mainText.includes("implementation deviations are fixed (by you, or sent back to the coder)"), "T-N1.7: main.md D-N1.1 尾含修正分句锚")
  assert.ok(coderText.includes("Fix implementation deviations (partial implementation / silent simplification) so the delivery matches the doc before reporting"), "T-N1.7: coder.md 自查行尾含修正分句锚")
  // T-N1.8（2026-09-05 记忆清空实验——纪律固化）：discipline.md 三条编辑纪律锚（新鲜读来源/hash 来源/重试上限——fail-when-unchanged）
  assert.ok(discText.includes("copy them from that read, never reconstruct from memory"), "T-N1.8: discipline.md 含新鲜读来源纪律（never reconstruct from memory）")
  assert.ok(discText.includes("never invent one"), "T-N1.8: discipline.md 含 hash 来源纪律（never invent one）")
  assert.ok(discText.includes("never retry the identical input a third time"), "T-N1.8: discipline.md 含重试上限纪律（never retry the identical input a third time）")
  // T-N1.9（2026-09-05 F-N1.5 两段式）：main.md 规模批次默认委托 coder 锚（执行/检查分离——fail-when-unchanged）
  assert.ok(mainText.includes("implemented by a coder subagent BY DEFAULT"), "T-N1.9: main.md 含规模批次默认委托锚")
  assert.ok(mainText.includes("spawn async with the design as the task book"), "T-N1.9: main.md 含 async 委托锚（设计书为 task book）")
  // T-N1.10（2026-09-05 F-N1.6 委托操作标准）：main.md 任务书字段锚（缺字段=委托缺陷——fail-when-unchanged）
  assert.ok(mainText.includes("Sized delegation without these fields is a defect"), "T-N1.10: main.md 含任务书字段锚")
  assert.ok(mainText.includes("machine-verifiable: commands, thresholds, assertion counts"), "T-N1.10: main.md 含机器可核验验收锚")

  assert.ok(!discText.includes("if you spotted a gap"), "T-N1.5: discipline.md 无旧弱触发 if you spotted a gap（零残留）")
  // T-N1.6：main/coder 双端开发前落档锚（D-N1.5——F-N1.3）
  for (const [name, text] of [["main.md", mainText], ["coder.md", coderText]]) {
    assert.ok(text.includes("before you start coding, locate the owning design doc"), `T-N1.6: ${name} 含开发前落档锚`)
    assert.ok(text.includes("register it in the map"), `T-N1.6: ${name} 含 register it in the map`)
  }
})