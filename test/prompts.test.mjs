/**
 * prompts.test.mjs — prompt content assertions — the future home for NEW prompt assertions (§18.14 D-T1.2; T-AR1..4 / T-SP1..4 / T-10.1..5 anchors).
 *
 * Split from test/agent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { compactHistory, truncateFallback, shrinkOversized, summarizeRunExplorations, SUMMARIZE_PROMPT, EXPLORE_TOOLS } from "../src/compact.mjs"
import { MAX_ADVISOR_PUSHBACKS, loadEngineeringPrompt } from "../src/agent/run-helpers.mjs"
import { pushModeReminders } from "../src/agent/setup-reminders.mjs"

function setupTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  return dir
}

const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "prompts")

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src")

describe("prompt borrowing increments (kimi-code comparison)", () => {
  it("explore.md: Thoroughness levels — three levels with default", () => {
    const text = readFileSync(join(PROMPTS_DIR, "explore.md"), "utf8")
    assert.ok(text.includes("Thoroughness levels"), "section header present")
    const lines = text.split("\n")
    assert.ok(lines.some((l) => l.trim().startsWith("- quick")), "quick level present")
    const medium = lines.find((l) => /^- medium/.test(l.trim()))
    assert.ok(medium, "medium level present")
    assert.ok(/default/i.test(medium), `medium marked as default: ${medium}`)
    const thorough = lines.find((l) => /^- thorough/.test(l.trim()))
    assert.ok(thorough, "thorough level present")
    assert.ok(/NOT find/i.test(thorough), `thorough requires reporting what was not found: ${thorough}`)
  })

  it("explore.md/plan.md: zero git — no git-context injection claim, no git command promises (§18.5 T-AG4)", () => {
    for (const name of ["explore.md", "plan.md"]) {
      const text = readFileSync(join(PROMPTS_DIR, name), "utf8")
      assert.ok(!text.includes("Git context is injected"), `${name}: git-context injection statement must be gone (D-AG2)`)
      assert.ok(!text.includes("git log"), `${name}: no git log command promise (D-AG2)`)
      assert.ok(!text.includes("git diff"), `${name}: no git diff command promise (D-AG2)`)
    }
  })


  it("main.md: Delegate well includes thoroughness guidance for explore delegation", () => {
    const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
    assert.ok(text.includes("quick / medium / thorough"), "three levels named in main.md")
    assert.match(text, /Delegate well[\s\S]*thoroughness/, "guidance sits in the Delegate well section")
  })

  it("system.md: confirmation sentence names the most important acceptance criteria", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    const line = text.split("\n").find((l) => l.includes("Confirm understanding"))
    assert.ok(line, "Confirm understanding sentence exists")
    assert.ok(line.includes("most important acceptance criteria"), line)
    assert.ok(line.includes("Wait for confirmation"), "rest of the sentence preserved")
  })

  it("system.md: confirmed doc IS the contract — no silent mid-implementation downgrade (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(text.includes("This binding is UNCONDITIONAL and does not wait for a formal confirmation round"), "binding is unconditional, no formal round needed")
    assert.ok(text.includes("every requirement the user states — mid-conversation, in a design doc, or in a confirmed plan — binds the moment it is stated"), "in-conversation requests bind immediately")
    assert.ok(text.includes("A stated request IS the contract"), "stated request = contract")
    assert.ok(text.includes("implementation may not quietly shrink it"), "no quiet shrinking")
    assert.ok(text.includes("implement it anyway and note the cost, or stop and surface the trade-off BEFORE building the reduced version"), "costly elements still get implemented, or surface first")
    assert.ok(text.includes("Disclosing a downgrade after delivery is not compliance"), "disclose-after is not compliance")
    assert.ok(text.includes("reported instead of avoided"), "transparency duty prevents, not reports")
  })

  it("system.md: parallelize aggressively — parallel discipline with F7 trigger conditions, do-not-parallelize boundaries + scheduler carve-out (2026-09-01 / §20.7 T-PS3)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.match(text, /Parallelize aggressively/, "proactive parallel guidance present")
    assert.match(text, /splitting changes across independent sub-projects/, "F7: split changes across independent sub-projects")
    assert.match(text, /share no files, have no cross-dependencies, and each has its own tests/, "F7 trigger conditions (all required)")
    assert.match(text, /Do NOT parallelize/, "do-not-parallelize boundary guidance")
    assert.match(text, /approval storms/, "approval-storm boundary named")
    assert.match(text, /micro-parallelism/, "micro-parallelism skipped (value judgment)")
    // §20.7 T-PS3: D1 carve-out — async spawns declaring files are queued by the scheduler (ban scoped to undeclared/tool-level parallel writes)
    assert.match(text, /writes to the same file \(except async spawns with `files` declared/, "T-PS3: same-file ban carved out for declared-files async spawns")
    assert.match(text, /scheduler queues overlapping ones until clear/, "T-PS3: carve-out terms consistent with D-PS1/D-PS2 (scheduler/queued)")
  })
})

describe("pre-work plan confirmation discipline", () => {
  it("system.md: confirmation discipline — file-writing tool list + explicit gate + doc/code consistency carve-out", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(/write \/ edit \/ apply_patch \/ insert_after \/ delete \/ hashline_edit/.test(text), "file-writing tool list present")
    assert.ok(text.includes("For the changes you propose, there are no exemptions"), "gate is exemption-free for proposed changes")
    assert.ok(text.includes("obvious enough to skip"), "self-exemption excuse explicitly blocked")
    assert.ok(text.includes("a new question from the user is not a confirmation"), "a new user question is not a confirmation")
    assert.ok(text.includes("Re-confirm when the requirement changes"), "re-confirm on requirement change present")
    assert.ok(text.includes("outranks this gate"), "doc/code consistency carve-out present")
    assert.ok(text.includes("standing obligations you already owe"), "carve-out covers existing obligations only")
    assert.ok(text.includes("the user already confirmed"), "carve-out limited to already-confirmed work")
  })

  it("engineering.md: plan confirmation before writing docs (no exemptions)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(/Plan confirmation before writing any doc/i.test(text), "clause heading present")
    assert.ok(text.includes("before writing the requirements doc"), "confirmation before writing requirements/design docs")
    assert.ok(text.includes("no exemptions"), "no-exemption wording present")
    assert.ok(text.includes("obvious enough to skip"), "self-exemption excuse explicitly blocked")
  })

  it("engineering.md: task sizing is not the agent's call — every request runs the full Mandatory Flow (2026-09-03)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("Task sizing is NOT your call"), "zero-discretion statement under Mandatory Flow")
    assert.ok(text.includes("every user request in this mode runs the full\nMandatory Flow regardless of size"), "no size-based step skipping")
    assert.ok(text.includes('"The task is too small / it is just a tweak"'), "small-task excuse phrase named")
    assert.ok(text.includes("no change is exempt from\nbeing recorded in the design docs"), "no exemption from design-doc recording")
    assert.ok(text.includes("the user's decision to be\nin engineering mode was the sizing decision"), "entering engineering mode was the sizing decision")
  })

  it("engineering.md: fix rounds land in docs FIRST — no spawn before the deviation record (2026-09-03)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("Fix rounds reuse the same designToken — but docs FIRST"), "docs-FIRST statement for same-design fix rounds")
    assert.ok(text.includes("has no exemption for fix rounds"), "no doc exemption for fix rounds")
    assert.ok(text.includes("is a NEW task needing its own flow and a fresh token"), "beyond the file list = new task with fresh token")
    assert.ok(text.includes("BEFORE the eng-coder spawn"), "doc landing precedes the spawn")
    assert.ok(text.includes("Fix-round re-spawns are docs FIRST too"), "flow-step-7 fix-round docs-FIRST hook present")
  })

  it("engineering.md: scope extensions run the full review chain — a user ruling on form/shape is NOT design approval (2026-09-03)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("A user ruling on design CONTENT"), "main clause: content ruling = requirements confirmation, not design approval")
    assert.ok(text.includes("NOT design approval"), "ruling-never-approval semantics present")
    assert.ok(text.includes("still runs the full review chain"), "new scope (incl. extensions to an approved design) still runs the full review chain")
    assert.ok(text.includes("user-initiated advisor review"), "chain includes user-initiated advisor review")
    assert.ok(text.includes('("B", "可以") never shortcuts past review'), "form-ruling example present (root cause named — never shortcuts past review)")
    assert.ok(text.includes("after the advisor review unlocks eng-coder"), "only the explicit sign-off after the advisor review unlocks eng-coder")
    assert.ok(text.includes("A user ruling on design form/shape/option choice is NOT this sign-off"), "step-5 pointer: form ruling is not the sign-off gate")
    assert.ok(text.indexOf("5. **User sign-off.**") < text.indexOf("NOT this sign-off"), "pointer anchored inside step 5 (User sign-off)")
  })

  it("engineering.md: requirement-pool three verbatim anchor sentences (R1 — fail-when-unchanged)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // 三分句 = 设计文档逐字定稿（METHODOLOGY.md 评审 #1）——字面断言防回退
    const anchors = [
      "ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane).",
      "same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval.",
      "the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut).",
    ]
    for (const a of anchors) {
      assert.ok(text.includes(a), `verbatim anchor sentence present: ${a.slice(0, 60)}…`)
    }
    // 语义断言目标 1:1（fail-when-unchanged）
    assert.ok(text.includes("「Requirement Pool」group"), "group phrase present")
    assert.ok(text.includes("pool-wide ≥3"), "threshold phrase present (pool-wide ≥3)")
    assert.ok(text.includes("single-point full flow"), "fast-lane phrase present (single-point full flow)")
    // 幂等性：每句只出现一次
    for (const a of anchors) {
      assert.equal(text.split(a).length - 1, 1, `anchor appears exactly once: ${a.slice(0, 40)}…`)
    }
  })

  it("methodology-template.md: requirement-pool section is the root user-facing block — approved status + Mechanism 6 steps (R1 — fail-when-unchanged)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
    assert.ok(text.includes("## Requirement-Pool Batched Workflow"), "section header present")
    assert.ok(text.includes("design — user ruling — approved"), "status header approved (root-template sync)")
    assert.ok(text.includes("~40 min fixed process cost"), "motivation sentence present (~40 min fixed process cost)")
    assert.ok(text.includes("same board ≥2 points or pool-wide ≥3 points"), "threshold sentence present (≥2 / ≥3)")
    assert.ok(text.includes("「Requirement Pool」group"), "group phrase present")
    assert.ok(text.includes("single-point full existing flow"), "fast-lane phrasing present (template register)")
    for (const head of ["**Register", "**Accumulate", "**Suggested threshold", "**Batch design", "**Fast lane", "**Boundary"]) {
      assert.ok(text.includes(head), `Mechanism step ${head} present`)
    }
    // 排除书账子节（模板只承载用户面向块）
    assert.ok(!text.includes("### Prompt sync"), "no Prompt sync bookkeeping subsection")
    assert.ok(!text.includes("### Acceptance"), "no Acceptance bookkeeping subsection")
    assert.ok(!text.includes("### Affected files"), "no Affected files bookkeeping subsection")
  })

  it("requirement-pool three-copy invariant (评审 #8 — threshold ≥2/≥3 + boundary 'user requirement points only' across root template / project version / template pair — anti-drift)",
    { skip: !existsSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "METHODOLOGY.md")) || !existsSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "thincoder", "docs", "design", "METHODOLOGY.md")) },
    () => {
      // 三副本：根模板（D:/teamcode/METHODOLOGY.md，非 git 文件级）、项目版（thincoder/docs/design/METHODOLOGY.md）、template 对
      // 根模板与兄弟仓均在仓外——单独 clone 时缺失，动态 skip（内容断言——跨仓副本缺失时跳过）
      const vscDir = dirname(fileURLToPath(import.meta.url))
      const copies = {
        根模板: readFileSync(join(vscDir, "..", "..", "METHODOLOGY.md"), "utf8"),
        项目版: readFileSync(join(vscDir, "..", "..", "thincoder", "docs", "design", "METHODOLOGY.md"), "utf8"),
        "template(this end)": readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8"),
      }
      for (const [name, c] of Object.entries(copies)) {
        assert.ok(c.includes("≥2") && c.includes("≥3"), `${name} threshold ≥2/≥3 present`)
        const flat = c.replace(/\*/g, "")
        const boundary = /user requirement points? only/i.test(flat) || flat.includes("池只收用户需求点")
        assert.ok(boundary, `${name} boundary present (user requirement points only, mechanism step)`)
      }
    })

  it("engineering.md: UI/interaction decisions must land in the design doc AND the eng-coder task (2026-08-29)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // 设计文档要素扩项：UI 决策必须落档，未定标 open、绝不静默发明
    assert.ok(
      /MUST also\s+capture every UI\/interaction decision agreed with the user/.test(text),
      "design-doc step requires UI/interaction decisions",
    )
    assert.ok(text.includes("marked open, never silently invented"), "undecided parts marked open, not invented")
    // 任务书传递强制：eng-coder 无对话上下文
    assert.ok(
      text.includes("MUST restate the agreed\n   UI/interaction decisions"),
      "eng-coder task must restate UI/interaction decisions",
    )
    assert.ok(
      text.includes("an eng-coder has NO conversation context"),
      "mechanism named: zero-context subagent",
    )
    // Hard Rules 独立条目：点破"讨论过但没落文档"是实现无视的根因
    assert.ok(text.includes("UI/interaction decisions ride the full chain"), "hard-rule entry present")
    assert.ok(
      text.includes('"Discussed but not written down" is the most common reason'),
      "root cause named in the hard rule",
    )
  })

  it("eng-coder.md: implement UI exactly as briefed; missing decisions → stop and report (2026-08-29)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("UI/interaction: implement exactly what the task brief and design doc state"), "follow-the-brief clause")
    assert.ok(text.includes("stop and report the gap"), "missing-decision → stop and report")
    assert.ok(text.includes("do not invent your own interaction design"), "self-invention blocked")
  })

  it("methodology-template.md: requirements doc carries the three layers (2026-08-29 dangling-reference fix)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
    assert.ok(text.includes("three layers"), "three-layer structure named")
    assert.ok(text.includes("Overall goal"), "layer 1: overall goal")
    assert.ok(text.includes("Functional user stories"), "layer 2: functional user stories")
    assert.ok(text.includes("Non-functional standards"), "layer 3: non-functional standards")
    assert.ok(text.includes("concrete enough to design against"), "doneness criterion present")
    assert.ok(text.includes("traces back to a user story"), "design acceptance criteria trace to stories")
  })

  it("engineering.md: METHODOLOGY test document is part of the delivery review (2026-08-29 test-doc alignment)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("METHODOLOGY test document is part of the delivery"), "test-doc required at delivery")
    assert.ok(text.includes("normal / edge / error"), "coverage triple named")
    assert.ok(text.includes("a delivery without\n   its test coverage fails the review"), "missing coverage fails the review")
  })

  it("engineering.md: delegation guidance (explore/plan offload + precision exception + parallel exclusion + escalate unavailable)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("goes to an `explore` subagent"), "breadth-first exploration delegates to explore")
    assert.ok(text.includes("quick / medium / thorough"), "thoroughness levels stated")
    assert.ok(text.includes("never enter your history"), "isolated-context benefit stated")
    assert.ok(text.includes("about to edit it immediately"), "precision exception present")
    assert.ok(!text.includes("Never assign two parallel eng-coders"), "T-PS2: old manual-avoidance sentence zero residue (delegation section)")
    assert.ok(text.includes("Do NOT redo the exploration you already delegated"), "no redoing delegated exploration")
    assert.ok(text.includes("`escalate` is unavailable in engineering mode"), "escalate unavailable (matches setup.mjs fail-closed)")
    assert.ok(text.includes("`consult` stays available"), "consult remains available")
  })

  it("engineering.md: first-delivery divergence audit assertions superseded by §18 internal protocol (2026-09-02)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // step 7：交付已内部审计——父侧不双重审计（2026-08-30 父侧审计节点随 §18 下沉）
    assert.ok(text.includes("7. **Delivery arrives already audited"), "flow step 7 = 已内部审计（标题）")
    assert.ok(text.includes("do not double-audit"), "防双重审计/误用")
    assert.ok(text.includes("`explore` subagent audited the delivered code"), "内部审计走 explore 子 agent")
    assert.ok(text.includes("silent simplifications"), "审计点名静默简化")
    assert.ok(text.includes("changes outside the approved file list AND not reported in the delivery report"), "超清单改动点名（含未报告=偏差——A 裁定）")
    assert.match(text, /capped at 5\s+correction rounds/, "修正轮 ≤5（内部）")
    assert.match(text, /7th audit spawn is\s+refused mechanically/, "第 7 次审计 spawn 机械拒绝")
    assert.ok(text.includes("spawn the fix round with the report's"), "stalled → 修正轮任务 = 未收敛点清单")
    assert.ok(text.includes("unconverged points as the task brief"), "任务书 = 未收敛点清单（不发明新内容）")
    assert.ok(!text.includes("SECOND time with the\n     divergence list as the task brief"), "2026-08-30 父侧二次 spawn 句式已随 §18 移除")
    assert.ok(!text.includes("verify the\n     divergence list point by point"), "父侧逐点核销句式已随 §18 移除")
    assert.ok(text.includes("Delivery (async settle)"), "work-loop 状态表含 async settle 态（替代 First delivery audit）")
    assert.ok(!text.includes("First delivery audit"), "First delivery audit 父侧审计态已移除")
    assert.ok(text.includes("Automatic either way"), "自动节点语义保留（内部协议默认承担）")
  })

  it("engineering.md: multi-task parallelism discipline injected at top level (2026-09-01, CLI parity)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("## Multi-Task Parallelism"), "top-level parallelism section present")
    assert.ok(text.includes("Parallelize aggressively: send multiple\nindependent tool calls in one response"), "§14 D1 clause appears inside engineering.md (top-level mode never loads system.md)")
    assert.ok(text.includes("splitting changes across independent\nsub-projects"), "F7 sub-project split trigger")
    assert.ok(text.includes("Do NOT parallelize:\nwrites to the same file, dependent steps, bash/approval-gated commands"), "five no-parallel boundaries")
    assert.ok(text.includes("approval storms"), "approval storms named")
    assert.ok(text.includes("skip micro-parallelism (<1s ops)"), "no micro-parallelism")
    // §20.7 T-PS1: scheduler clause replaces the manual same-file/dependency discipline (D-PS2 anchor)
    const flat = text.replace(/\n[ \t]+/g, " ") // fold wraps so the multi-line anchor can be asserted
    assert.ok(flat.includes("**Declare spawn scheduling metadata in task briefs**: spawn with `files` (write domain) and `dependsOn` (prior async ids) — the scheduler gates admission: async spawns overlapping running/queued files wait queued (clear when the blocker settles); sync spawns conflicting on files error out (not queued); dependency chains auto-order. Mirror tasks across independent trees spawn as parallel eng-coders, each declaring its own file domain — overlapping domains are queued by the scheduler, never hand-serialized."), "T-PS1: D-PS2 anchor verbatim (files/dependsOn declaration + admission gate + mirror parallel queue semantics)")
    assert.ok(text.includes("never hand-serialized"), "T-PS1: scheduler owns serialization — no manual hand-serialization")
    assert.ok(text.includes("at most 4 concurrent eng-coders"), "≤4 concurrency cap")
    // §18 T-E16: 重断言 "Cap: at most 4 concurrent eng-coders"/"past 4"（保 §15 T9 不破——
    // CLI 侧 test/agent.test.mjs 同款双钉——两端内容断言各一）
    assert.ok(text.includes("past 4 the bookkeeping cost"), "T-E16: past 4 理由句钉（CLI parity）")
    // §19.5.5 T-CL2: cancel-discipline anchor present (D-CL2 verbatim — post-D-PS2 text — fail-when-unchanged)
    assert.ok(flat.includes("assertions stay green).** Cancelling a running eng-coder is a last resort — its in-flight delivery dies unmerged and unaudited; verify the alarm with reliable checks and prefer scoped recovery first."), "T-CL2: D-CL2 anchor verbatim after D-PS2 text (last resort + verify-first)")
    assert.ok(text.includes('designId=<id-A>,\n  designToken=<token-A>'), "parallel spawn call form (each with designId+token)")
    assert.ok(text.includes("each parallel\n   design keeps its own designId+token pair"), "token isolation semantics")
    assert.ok(text.includes("the DESIGN review is still only fired when\n  the user asks"), "initiation rights unchanged")
    assert.ok(text.includes("plus its designId parameter"), "work-loop approval line mentions designId")
    // §20.7 T-PS2: old manual-avoidance wording zero residue in engineering.md (pre-grep confirmed present before the swap)
    assert.ok(!text.includes("share NO file"), "T-PS2: old disjoint-fileset pre-check zero residue")
    assert.ok(!text.includes("run the tasks serially (or merge them into one spawn)"), "T-PS2: old serialize/merge fallback zero residue")
    assert.ok(!text.includes("Dependency chain → serial"), "T-PS2: old serial-dependency discipline zero residue")
    assert.ok(!text.includes("Pre-check before parallel spawns"), "T-PS2: old manual pre-check zero residue")
    assert.ok(!text.includes("Never assign two parallel eng-coders"), "T-PS2: old manual-avoidance sentence zero residue (§20.7 leftover fix)")
  })

  it("§20.8 T-F1.5: main.md/engineering.md carry the files file-level anchor sentence (fail-when-unchanged——目录声明不支持)", () => {
    const anchor = "files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error."
    for (const name of ["main.md", "engineering.md"]) {
      const text = readFileSync(join(PROMPTS_DIR, name), "utf8")
      assert.ok(text.includes(anchor), `T-F1.5: ${name} missing the §20.8 files file-level anchor sentence`)
    }
  })

  it("engineering.md: §18 async delivery + internal-protocol narrative; fix round reuses the same designId+token (2026-09-01 T19 / 2026-09-02 §18)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // async 交付：eng-coder 默认 async + 内部协议闭环（防双重审计/误用）
    assert.ok(text.includes("Eng-coder spawns are async by default (AGENT-LOOP.md §18)"), "默认 async 叙述（step 6）")
    assert.ok(text.includes('returns `{id, status:"running"}` immediately'), "spawn 立即返回 running")
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

  it("engineering-sub.md: internal delivery protocol — audit/self-fix/re-review/convergence + Fix round N/5 + never edit design docs (2026-09-02 §18)", () => {
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

  it("engineering-sub.md: test layers L0/L1/L2 + correction rounds skip LLM re-verification (§18.7 D-TS1/2 — T-TS1/T-TS2/T-TS10/T-TS11)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
    // T-TS1：L1/L0/L2 定义句（首次=快层 npm test / 修正轮=verify 相关测试 / 全量=父侧 1 次）
    assert.ok(text.includes('"run the tests" = three tiers'), "测试分层定义段在（D-TS1）")
    assert.ok(text.includes("**L1 = the fast layer `npm test`**"), "L1 = 快层 npm test（首次实现后）")
    assert.ok(text.includes("**L0 = call `verify` in its default mode**"), "L0 = 调用 verify 默认模式（修正轮）")
    assert.ok(text.includes("**L2 = `test:full` full suite**"), "L2 = test:full 全量")
    assert.ok(text.includes("runs ONCE at the parent's verification, per chain terminal"), "L2 = 父侧核销 1 次（每链终态）")
    // T-TS2：修正轮默认不重跑审计/复评（例外：触碰未覆盖文件回③）
    assert.ok(text.includes("Correction rounds default to NOT re-running the explore audit"), "④ 修正轮默认不重跑审计（D-TS2）")
    assert.ok(text.includes("default is NO advisor re-review"), "⑥ 修正轮默认不重跑复评（D-TS2）")
    assert.ok(text.includes("the fix touched files the last audit did not cover → back to ③"), "④ 例外路径：触碰未覆盖文件回③")
    assert.ok(text.includes("Only if a fix touched files the last review did not cover, run ③ again first"), "⑥ 例外路径：触碰未覆盖文件回③")
    // T-TS10：例外路径生效——协议句（例外 = 触碰上次审计/评审未覆盖文件 → 回③）
    assert.ok(text.includes("re-audit, the exception path"), "T-TS10：审计第 2 次仅例外（不计入常态）")
    assert.ok(text.includes("LLM verification is fixed at 3 per chain"), "T-TS10：LLM 验证 3 次/链")
    // T-TS11：L0 兜底——改动文件映射 null / 触主干 → 显式升 L1
    assert.ok(text.includes("a null mapping (mcp/prompts/context/session) or a change touching trunk/main files → escalate explicitly to L1 (`npm test`)"), "T-TS11：L0 兜底 → 显式升 L1")
    assert.ok(text.includes("Do NOT hand-write `node --test`"), "L0 非手写 node --test")
  })

  it("engineering-sub.md: audit spawn thoroughness = quick + 审计是对照核对（§18.13 D-A1.1 — T-A1.1/T-A1.4）", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
    // D-A1.1：审计档位 "medium unless the delivery is large" → quick（审计=对照核对——非广度探索）
    assert.ok(text.includes('thoroughness: "quick"'), "审计指令 = quick（不再 medium/不随交付规模升 thorough）")
    assert.ok(text.includes("审计是对照核对——非广度探索——读该读的即止"), "quick 锁定句在（审计=最小确认——读该读的即止）")
    // T-A1.4 防回潮：旧档位措辞零残留
    assert.ok(!text.includes("medium unless the delivery is large"), "旧 medium 档位措辞零残留（防回潮）")
  })

  it("engineering.md: parent-side closure = L2 full run once per chain — no L1 re-run (§18.7 D-TS3 — T-TS3)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // D-TS3：父侧核销——信任内部 L1/L0 结果；父侧核销 = L2 全量 1 次；不复跑 L1
    assert.ok(text.includes("eng-coder's internal L1/L0 results — the §18 internal protocol guarantees"), "step 8：信任 eng-coder 内部 L1/L0 结果")
    assert.ok(text.includes("parent-side verification = L2 full `test:full` once per chain terminal"), "step 8：父侧核销 = L2 全量 1 次（每链终态）")
    assert.ok(text.includes("— no L1 re-run"), "step 8：不复跑 L1")
    // N-TS4：不留旧措辞
    assert.ok(!text.includes("run the tests it claims pass"), "旧 'run the tests it claims pass' 措辞零残留")
  })

  it("advisor-round1.md: review-scope focus contraction + batch-read parallelism (§18.7 D-TS8 — T-TS7)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "advisor-round1.md"), "utf8")
    // B2 :7 —— 聚焦评审范围（优先读评审对象；设计文档只读相关节；不读无关模块）
    assert.ok(text.includes("focus on the review scope"), ":7 范围收缩句在")
    assert.ok(text.includes("read the review-target files (the delivery list) FIRST"), ":7 优先读评审对象文件")
    assert.ok(text.includes("design documents only in the sections relevant to this implementation (do NOT read whole documents in full)"), ":7 设计文档只读相关节（不全量读全文档）")
    assert.ok(text.includes("do not read unrelated modules just to understand the implementation"), ":7 不读无关模块")
    assert.ok(!text.includes("Read them in full."), ":7 旧 'Read them in full' 全文读句已移除")
    // B2 :13 —— 批量 read 并行执行（并发——不要串行等）
    assert.ok(text.includes("**multiple files read in one batch execute in PARALLEL (concurrent — do not wait serially)**"), ":13 并行执行明示句")
    assert.ok(text.includes("Batch independent `read` calls in a SINGLE reply"), ":13 批量提示保持")
    // :4 预算（20 轮）保持
    assert.ok(text.includes("You have a budget of 20 tool rounds"), ":4 预算 20 轮保持（B3——实测后再议）")
  })


  it("engineering.md: no duplicated section headers (2026-09-01 fix #4 hygiene)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    const dupes = [...text.matchAll(/^## .+$/gm)].map((m) => m[0])
    assert.equal(dupes.length, new Set(dupes).size,
      "every ## header appears exactly once: " + dupes.filter((h, i) => dupes.indexOf(h) !== i).join(" | "))
    assert.ok(text.includes("## Questioning Style (requirement clarification)"), "header kept (dedup only)")
  })

  it("eng-coder.md: full-design fidelity — no silent degradation (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("Implement to the full design — no silent degradation"), "positive prohibition present")
    assert.ok(text.includes("implement it anyway and note the cost"), "costly elements still get implemented")
    assert.ok(text.includes("A \"simpler\n  approximation\" of a specified behavior IS a deviation"), "approximation = deviation")
    assert.ok(text.includes("BEFORE coding —\n  never ship a reduced version and disclose it afterwards"), "surface first, never disclose-after")
    assert.ok(text.includes("the parent approved the design, not your\n  discount"), "approved the design, not the discount")
  })

  it("eng-coder.md: final-review item 6 — structural snapshot sync (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("6. Update the affected design-doc sections"), "final-review item 6 present")
    assert.ok(text.includes("module map / affected-files table"), "module map / affected-files table named")
  })
  it("engineering-sub.md: subagent confirmation exception — no user to wait for (2026-09-02)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
    assert.ok(text.includes("You are a SUBAGENT"), "subagent identity declared")
    assert.ok(text.includes("There is no user to wait for"), "no-user-to-wait-for exception present")
    assert.ok(text.includes("execute immediately, never ask for confirmation"), "execute immediately; re-confirmation banned")
    assert.ok(text.includes('"waiting for approval" message'), "waiting-for-approval ending banned")
    assert.ok(text.includes("note it in your final report and return"), "ambiguity → report and return")
  })

  it("setup-reminders: METHODOLOGY-missing warning names the consequence, not just absence (2026-08-29)", () => {
    const text = readFileSync(join(SRC_DIR, "agent", "setup-reminders.mjs"), "utf8")
    assert.ok(text.includes("every 'per METHODOLOGY' reference in the engineering prompt is dangling"), "dangling-reference consequence named")
    assert.ok(text.includes("three-document hard flow"), "hard-flow consequence named")
    assert.ok(text.includes("Ask the user whether to create METHODOLOGY.md"), "recovery path: ask the user")
    assert.ok(!text.includes("eng tool's write mode"), "stale VS Code-specific scaffold pointer removed")
  })

  it("setup-reminders: METHODOLOGY-missing warning carries absolute template path + body (2026-09-02 D-M1/D-M2)", () => {
    const dir = setupTempDir() // no METHODOLOGY.md → methodologyMissing branch
    const engResult = loadEngineeringPrompt(dir, "eng-coder")
    assert.equal(engResult.methodologyMissing, true)
    assert.ok(engResult.methodologyTemplatePath, "template absolute path resolved")
    assert.match(engResult.methodologyTemplatePath, /(?:thincoder|thincoder-vscode)[\\/].*methodology-template\.md/, "absolute path shape")
    assert.ok(existsSync(engResult.methodologyTemplatePath), "template path exists on disk (D-AC2)")
    assert.ok(engResult.methodologyTemplateBody?.startsWith("# METHODOLOGY — AI Agent Collaboration"), "template body loaded (first line)")
    const history = []
    pushModeReminders(history, { depth: 0, freshMachineLine: true, getAuto: () => false, role: "eng-coder", engPromptActive: true, engResult })
    const warning = history.map((m) => m.content).join("\n")
    assert.ok(warning.includes(engResult.methodologyTemplatePath), "warning contains absolute path")
    assert.ok(warning.includes("# METHODOLOGY — AI Agent Collaboration"), "warning contains template body")
    assert.ok(warning.includes("Ask the user whether to create METHODOLOGY.md"), "recovery path: ask the user")
    assert.ok(warning.includes("write cwd/METHODOLOGY.md before designing"), "confirm-then-write flow kept (D-M3, CLI parity)")
    assert.ok(warning.includes("built-in template（可 read"), "prefix literal intact (D-M2 design literal, audit-fix 2026-09-02)")
    rmSync(dir, { recursive: true, force: true })
  })
})

describe("judgment rules + review-object declaration (§18.10 / §18.8 — T-10.1..5)", () => {
  const JUDGMENT_FILES = ["advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"]
  const JUDGMENT_RULES = ["R1 ", "R2 ", "R3 ", "R4 ", "R5 ", "R6 ", "R7a ", "R7b ", "R7c ", "R7d ", "R7e "]

  it("T-10.1: 4 模板各含 R1-R7 判定铁律块（含按评审类型取适用指引句 + 对象声明一致性句）", () => {
    for (const f of JUDGMENT_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(text.includes("## Judgment Rules (apply directly — do not re-derive)"), `${f}: 铁律块头（直接套用——不自行推导）`)
      assert.ok(text.includes("Apply each rule to the extent it matches the review type: design review — doc-state rules (R1, R7a-e) apply; code review — all rules apply."), `${f}: 按评审类型取适用指引句`)
      for (const r of JUDGMENT_RULES) assert.ok(text.includes(r), `${f}: ${r.trim()} 规则在`)
      // 语义抽样（fail-when-unchanged——各端内容断言独立防漂移）
      assert.ok(text.includes("R2 Implementation deviates from design (acceptance unmet / silent simplification) → 🔴 (must fix)"), `${f}: R2 实现偏离设计=🔴`)
      assert.ok(text.includes("R6 Test seam"), `${f}: R6 测试缝规则在`)
      assert.ok(text.includes("R7e Never block \"pass\" due to doc-state contradiction"), `${f}: R7e 不卡通过（报出即过）`)
      assert.ok(text.includes("You have received the review-object declaration above — no need to infer the review target from the documents."), `${f}: §18.8 对象声明一致性句（4 模板全加）`)
    }
  })

  it("T-10.2: engineering-sub.md 含两句（测试缝 / 授权边界 A 裁定——mirror 句已删）", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering-sub.md"), "utf8")
    assert.ok(text.includes("Test-seam rule: when tests need to mock an internal tool set / slow tools"), "测试缝句头")
    assert.ok(text.includes("add a test seam (setter or parameter override with `??` default fallback — default null keeps production behavior unchanged — restore in finally)"), "测试缝句 seam 语义")
    assert.ok(text.includes("do not waste rounds on non-deterministic workarounds (real slow tools, FIFO, large files, observing onTool, mock-LLM-returning-real-tools)"), "测试缝句禁项")
    assert.ok(text.includes("Out-of-file-list changes: ALLOWED when required by the delivery"), "授权边界句（A 裁定——允许但报告）")
    assert.ok(text.includes("the audit \"out-of-list\" criterion = changed AND not reported (silent overreach)"), "审计判据 = 改了且未报告=偏差")
  })

  it("T-10.2b: engineering-sub.md / eng-coder.md 无旧硬句 + 无 mirror 并行句（A 裁定同步——防回归）", () => {
    for (const f of ["engineering-sub.md", "eng-coder.md"]) {
      const t = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(!t.includes("Do NOT modify any file not listed in the approved design."), `${f}: 无旧硬句-engineering-sub 授权边界`)
      assert.ok(!t.includes("Do not modify any file not listed in the design."), `${f}: 无旧硬句-eng-coder 清单外禁止`)
      assert.ok(!t.includes("zero touches outside the approved file list"), `${f}: 无旧硬句-implement 零触碰`)
      assert.ok(!t.includes("no file outside the approved list was touched"), `${f}: 无旧硬句-终检序号 2`)
      assert.ok(!t.includes("Mirror-parallel semantics"), `${f}: 无 mirror 并行句（§18.11 已删——防回归）`)
    }
  })

  it("T-10.3: 铁律块通用性——无 thincoder/vscode 项目名、无具体符号名、无 CLI|VS Code 形态（不锁项目）", () => {
    for (const f of JUDGMENT_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(!/thincoder/i.test(text), `${f}: 无 thincoder 项目名`)
      assert.ok(!text.includes("_runAdvisorToolLoop"), `${f}: 无 _runAdvisorToolLoop 符号名（设计注脚——非通用提示词）`)
      assert.ok(!text.includes("_setAdvisorToolSetForTest"), `${f}: 无 _setAdvisorToolSetForTest 符号名（设计注脚——非通用提示词）`)
      assert.ok(!text.includes("CLI "), `${f}: 无 'CLI ' 形态`)
      assert.ok(!text.includes("VS Code"), `${f}: 无 'VS Code' 形态`)
    }
  })

  it("T-10.5: 来源诚实标注——'样本 7 轮——持续复核'（不假装权威）", () => {
    const sourceLine = "Source: 7-round sample — verified judgments — continuously re-reviewed."
    for (const f of JUDGMENT_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(text.includes("7-round sample"), `${f}: 样本 7 轮标注在`)
      assert.ok(text.includes("continuously re-reviewed"), `${f}: 持续复核标注在`)
      assert.ok(text.includes(sourceLine), `${f}: 来源句完整`)
    }
  })
})

describe("advisor role identity anchor (§12.1 — T-AR1..4)", () => {
  const ROLE_FILES = ["advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"]
  const ROLE_ANCHOR = `## Your role (identity — read before the criteria)

You are an INDEPENDENT REVIEWER — authority in judgment, not in decisions.

1. **Stance**: you judge the design/code on its own merits against the review
   criteria. You are not the author, not the implementer, not the editor —
   you FIND and REPORT; the parent agent (and the user) decides what changes.
    Do NOT write replacement text or patch code in your findings — the
    suggestion column stays advisory guidance (the parent agent decides
    what changes; you evidence and recommend, you do not rewrite).
2. **Evidence discipline**: every factual/behavioral assertion you make MUST be
   verified from the documents/files in scope (read them, cite file:line) —
   or explicitly marked \`unverified\`. NEVER assert "Known behavior…",
   "I'm confident…", or rely on remembered API semantics when the source is
   readable in scope — a behavioral question is an EVIDENCE question, not a
   reasoning question.
 3. **Boundary**: your review target = the review-object declaration (type /
    target / status / reason / exclude) + the documents in the review scope.
    Do NOT expand it. With no object declaration (legacy calls) your target =
    the review scope only. Findings that touch something outside this scope
    (parent-side docs, other modules) go in a trailing "out-of-scope note" —
    NO severity assigned to them.
4. **Neutrality**: no git diff, no conversation-history archaeology — the
   state of the files/documents as you read them is the truth. Do not guess
   author intent.`

  it("T-AR1: 4 模板各含六锚句（Your role / INDEPENDENT REVIEWER / Stance / Evidence discipline / Boundary / Neutrality）+ F-AR4 非作者句——fail-when-unchanged", () => {
    for (const f of ROLE_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      for (const p of ["Your role (identity", "INDEPENDENT REVIEWER", "Stance", "Evidence discipline", "Boundary", "Neutrality"]) {
        assert.ok(text.includes(p), `${f}: 锚句 "${p}" 在（fail-when-unchanged）`)
      }
      assert.ok(text.includes("Do NOT write replacement text or patch code in your findings"), `${f}: F-AR4 非作者句在（发现即报告——不替作者修复）`)
    }
  })

  it("T-AR2: 角色段含证据纪律禁止句——NEVER assert \"Known behavior…\"（记忆断言禁止落地）", () => {
    for (const f of ROLE_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(text.includes('NEVER assert "Known behavior…"'), `${f}: 禁止句在（取证或标 unverified）`)
      assert.ok(text.includes('"I\'m confident…"'), `${f}: 自信断言同步禁止`)
    }
  })

  it("T-AR3: 角色段位置——身份句（模板首行）之后、既有小节（Review Criteria / Review workflow: / Judgment Rules）之前——既有内容零位移", () => {
    for (const f of ROLE_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      const roleIdx = text.indexOf("## Your role (identity")
      assert.ok(roleIdx > 0, `${f}: 角色段头在且非首行`)
      const identityEnd = text.indexOf("\n")
      assert.ok(roleIdx > identityEnd, `${f}: 角色段位于身份句之后`)
      for (const later of ["## Review Criteria", "Review workflow:", "## Judgment Rules", "## Citation Discipline", "## Approval Signal"]) {
        const idx = text.indexOf(later)
        if (idx >= 0) assert.ok(roleIdx < idx, `${f}: 角色段位于 "${later}" 之前（既有小节未动）`)
      }
    }
  })

  it("T-AR4: 锚整块逐字存在（四模板同段同文）——删/改任一锚句即失败（防回归）", () => {
    for (const f of ROLE_FILES) {
      const text = readFileSync(join(PROMPTS_DIR, f), "utf8")
      assert.ok(text.includes(ROLE_ANCHOR), `${f}: 锚整块逐字在（任一锚句删除/改词即失败）`)
    }
  })
})

describe("subagent persona anchor (§7.3 — T-SP1..4)", () => {
  const CODER_ANCHOR = `## Your role (identity — read before you code)

You are an IMPLEMENTER with independent judgment — not a typewriter.

1. **Evidence discipline**: every factual/behavioral assertion you make MUST be
   verified from the code/docs in front of you (read them, cite file:line) —
   or explicitly marked \`unverified\`. NEVER assert "Known behavior…",
   "I'm confident…", or rely on remembered API semantics when the source is
   readable — a behavioral question is an EVIDENCE question, not a reasoning
   question.
2. **Neutrality**: you implement the design; you are not the designer. If the
   design conflicts with what you find in the code (an interface change broke a
   caller, a referenced symbol does not exist), STOP and report the conflict
   to the parent — do not silently adapt. The parent decides; you surface.
3. **Boundary**: your task = the parent's task brief (files, acceptance
   criteria). Do not expand it. Findings that touch things outside the brief
   (other modules, parent-side docs) go in a trailing "out-of-scope note" in
   your report — no action without the parent's word.`

  const CONSULT_ANCHOR = `## Your role (identity — read before you answer)

1. **Evidence discipline**: you are the perspective the main agent lacks —
   that value comes from verified facts, not confidence. Any factual or
   behavioral assertion you make MUST be backed by what you read (or known
   from the problem brief) — or explicitly marked \`unverified\`. NEVER assert
   "Known behavior…", "I'm confident…", or rely on remembered API semantics
   when the source is readable. Unknown → say so: "I don't know" is a valid
   consultant answer; a confident guess is noise.
2. **Neutrality**: you are one of several consultants — no authority to
   decide. Recommend and reason; the main agent integrates. Do not write
   fixes or replacement text in your reply.`

  /** Whitespace-normalized view: file line wraps must not break phrase matching. */
  const norm = (t) => t.replace(/\s+/g, " ")

  // Positive checks shared with the T-SP4 regression drill — a removed anchor
  // phrase throws, same assertion logic both ways.
  const checkCoderAnchor = (text) => {
    assert.ok(text.includes("IMPLEMENTER with independent judgment"), "D-SP1: implementer identity headline")
    assert.ok(text.includes("Evidence discipline"), "D-SP1: Evidence discipline phrase")
    assert.ok(text.includes("Neutrality"), "D-SP1: Neutrality phrase")
    assert.ok(text.includes("Boundary"), "D-SP1: Boundary phrase")
    assert.ok(norm(text).includes("STOP and report the conflict"), "D-SP1: STOP and report phrase")
    assert.ok(text.includes(CODER_ANCHOR), "D-SP1: anchor block verbatim (删/改任一锚句即失败)")
  }

  const checkConsultAnchor = (text) => {
    assert.ok(text.includes("Evidence discipline"), "D-SP2: Evidence discipline phrase")
    assert.ok(text.includes("Neutrality"), "D-SP2: Neutrality phrase")
    assert.ok(norm(text).includes('"I don\'t know" is a valid consultant answer'), "D-SP2: \"I don't know\" is a valid consultant answer phrase")
    assert.ok(norm(text).includes("Recommend and reason"), "D-SP2: Recommend and reason phrase")
    assert.ok(text.includes(CONSULT_ANCHOR), "D-SP2: anchor block verbatim (删/改任一锚句即失败)")
  }

  it("T-SP1: coder.md 含 D-SP1 锚（IMPLEMENTER / Evidence discipline / Neutrality / Boundary / STOP and report + 整块逐字）——fail-when-unchanged", () => {
    const text = readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8")
    checkCoderAnchor(text)
  })

  it("T-SP2: consult-base.md 含 D-SP2 锚（Evidence discipline / I don't know 合法答案 / Recommend and reason + 整块逐字）——fail-when-unchanged", () => {
    const text = readFileSync(join(PROMPTS_DIR, "consult-base.md"), "utf8")
    checkConsultAnchor(text)
  })

  it("T-SP4: 锚缺失模拟——删任一锚句即断言失败（防回潮）", () => {
    const coderText = readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8")
    assert.throws(() => checkCoderAnchor(coderText.replace(/IMPLEMENTER with independent judgment/, "implementer")), "删除 coder 身份句 → 检查失败")
    assert.throws(() => checkCoderAnchor(coderText.replace(/STOP and report/, "report")), "删除 STOP and report → 检查失败")
    const consultText = readFileSync(join(PROMPTS_DIR, "consult-base.md"), "utf8")
    assert.throws(() => checkConsultAnchor(consultText.replace(/"I don't know" is a valid\s+consultant answer/, "consultant answer")), "删除 I don't know 合法答案句 → 检查失败")
    assert.throws(() => checkConsultAnchor(consultText.replace(/Recommend and reason/, "recommend")), "删除 Recommend and reason → 检查失败")
  })
})

describe("discipline.md: workflow/debugging require `task` (content-level)", () => {
  it("Workflow 总规 + 各层追踪工具断言", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    const lines = text.split("\n")

    // 关键短语全文断言（不受两端比对影响——内容一旦回退即失败）
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
  })

  it("Debugging 段含四步 + task + one in_progress", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    const lines = text.split("\n")
    assert.ok(text.includes("reproduce → locate root cause → fix → verify"), "Debugging 段含调试四步")
    const debugLine = lines.find((l) => l.includes("reproduce → locate root cause → fix → verify"))
    assert.ok(debugLine, "Debugging 调试句存在")
    assert.ok(debugLine.includes("`task`"), "调试句含 task")
    assert.ok(debugLine.includes("one in_progress"), "调试句含 one in_progress")
  })
})

describe("discipline.md: read/update docs embedded in Workflow arrows (no standalone Documentation section)", () => {
  it("无独立 Documentation 段 + 读文档总规句 + 各层箭头 + 归属句", () => {
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

    // Medium 层箭头：Read the docs → Plan → Change → update the owning doc（D-N1.5 强触发——无 gap-spotting 触发词）
    const medium = lines.find((l) => /Medium \(2-3 steps/.test(l.trim()))
    assert.ok(medium, "Medium 层存在")
    assert.ok(medium.includes("Read the docs → Plan → Change"), "Medium 箭头含 Read the docs → Plan → Change")
    assert.ok(medium.includes("update the owning doc — a decision or completed change is recorded there"), "Medium 箭头含 D-N1.5 锚（update the owning doc — a decision or completed change is recorded there）")

    // Small 层箭头：Read the docs → Change → Verify → update the owning doc（D-N1.5 强触发——backfilled 无豁免）
    const small = lines.find((l) => /Small \(typo, one-line fix\)/.test(l.trim()))
    assert.ok(small, "Small 层存在")
    assert.ok(small.includes("Read the docs → Change → Verify"), "Small 箭头含 Read the docs → Change → Verify")
    assert.ok(small.includes("decisions and completed changes are backfilled"), "Small 箭头含 D-N1.5 锚（decisions and completed changes are backfilled）")

    // 归属句（Workflow 段末）：Never create a new doc + find the owner and amend
    const ownLine = lines.find((l) => l.includes("Never create a new doc"))
    assert.ok(ownLine, "归属句存在")
    assert.ok(ownLine.includes("find the owner and amend"), "归属句含 find the owner and amend")
  })
})

// ---------------------------------------------------------------- §21 普通模式偏差审计（2026-09-05——D-N1.1..1.5 锚——fail-when-unchanged）

describe("§21 normal-mode deviation audit anchors (T-N1 — fail-when-unchanged)", () => {
  it("T-N1.1: main.md 含 D-N1.1 自动补写锚三短语（board design doc / add a short change record / 四类偏差）——fail-when-unchanged", () => {
    const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
    assert.ok(text.includes("landed in the board design doc"), "T-N1.1: main.md 含 landed in the board design doc（D-N1.1 逐字）")
    assert.ok(text.includes("add a short change record"), "T-N1.1: main.md 含 add a short change record（自动补写）")
    assert.ok(text.includes("deviations (partial implementation / silent simplification / doc drift / out-of-scope)"), "T-N1.1: main.md 含 deviations (partial implementation / silent simplification / doc drift / out-of-scope)（四类偏差）")
  })

  it("T-N1.2: coder.md 含 D-N1.2 一致性自查行——fail-when-unchanged", () => {
    const text = readFileSync(join(PROMPTS_DIR, "coder.md"), "utf8")
    assert.ok(text.includes("consistency self-check"), "T-N1.2: coder.md 含 consistency self-check（D-N1.2 逐字）")
  })

  it("T-N1.4: discipline.md 含 D-N1.5 强触发锚（Medium 决策/完工记录 + 小改动也记录）——fail-when-unchanged", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    assert.ok(text.includes("update the owning doc — a decision or completed change is recorded there"), "T-N1.4: discipline.md 含 update the owning doc — a decision or completed change is recorded there（D-N1.5）")
    assert.ok(text.includes("small changes are documented too"), "T-N1.4: discipline.md 含 small changes are documented too（D-N1.5 无豁免）")
  })

  it("T-N1.5: discipline.md 不含旧弱触发 if you spotted a gap——零残留", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    assert.ok(!text.includes("if you spotted a gap"), "T-N1.5: discipline.md 零残留——if you spotted a gap 已删除")
  })

  it("T-N1.6: main.md + coder.md 都含 D-N1.5 开发前落档锚（locate the owning design doc / register it in the map）——fail-when-unchanged", () => {
    for (const name of ["main.md", "coder.md"]) {
      const text = readFileSync(join(PROMPTS_DIR, name), "utf8")
      assert.ok(text.includes("before you start coding, locate the owning design doc"), `T-N1.6: ${name} 含 before you start coding, locate the owning design doc（D-N1.5）`)
      assert.ok(text.includes("register it in the map"), `T-N1.6: ${name} 含 register it in the map（D-N1.5）`)
    }
  })
})


describe("Delegate well rewrite + exploration distillation", () => {

  it("main.md: 收益句 + 委托规则句 + 精度例外 + 验证句；其余条保留", () => {
    const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
    assert.match(text, /isolated context/, "收益句点破子 agent 隔离上下文")
    assert.match(text, /only their final report comes back/, "收益句：只有最终报告回到主历史")
    assert.match(text, /floods? your own window/, "收益句：内联探索会淹没自己的窗口")
    assert.match(text, /Breadth-first exploration[\s\S]*?`explore` subagent/, "广度探索下沉 explore 的规则句")
    assert.match(text, /Read a file yourself only when you are about to edit it immediately/, "即时编辑例外触发句")
    assert.match(text, /precision exception, not a token-saving trick/, "精度例外不是省 token 技巧")
    assert.match(text, /When a coder subagent finishes, verify its work/, "coder 完成后的验证句")
    assert.match(text, /do NOT redo the whole exploration/, "不重做已委托的整段探索")
    assert.match(text, /Declare spawn scheduling metadata/, "T-PS1: scheduler clause present (D-PS1 anchor)")
    assert.match(text, /Same-file async spawns are safe to fire with files declared/, "T-PS1: same-file async spawns safe — the queue handles contention")
    assert.ok(!text.includes("Never give parallel subagents tasks that edit the same files"), "T-PS2: old manual-avoidance sentence zero residue")
    assert.match(text, /When multiple subagent reports conflict, read the relevant code yourself/, "冲突仲裁条款保留")
  })

  it("SUMMARIZE_PROMPT 区分已完成/进行中 + 两清单：已改动文件 + 未决点/待办", () => {
    assert.ok(
      SUMMARIZE_PROMPT.includes("Distinguish COMPLETED vs IN-PROGRESS work"),
      "区分 COMPLETED vs IN-PROGRESS 指令句在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("completed tasks get a ONE-LINE recap each"),
      "已完成任务一行回述在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("spend the detail budget on unresolved issues, next steps, and the CURRENT task"),
      "细节预算留给未决项/下一步/当前任务在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("The user's most recent request defines the current task"),
      "以用户最近请求为当前任务锚点在"
    )
    assert.match(SUMMARIZE_PROMPT, /Explicitly list FILES CHANGED/, "已改动文件清单在")
    assert.match(SUMMARIZE_PROMPT, /Explicitly list UNRESOLVED ISSUES \/ TODOs/, "未决点/待办清单在")
  })

  it("SUMMARIZE_PROMPT §8 D13：≤1K 硬目标句 + 砍价优先级 ①②③④（旧无界指引删除）", () => {
    assert.ok(SUMMARIZE_PROMPT.includes("~1K tokens"), "≤1K 硬目标句在（D13-1）")
    assert.ok(SUMMARIZE_PROMPT.includes("1000 Chinese chars / 4000 ASCII chars"), "中/英文直觉换算在（D13-1）")
    assert.ok(!SUMMARIZE_PROMPT.includes("err on the long side"), "旧无界长度指引已删除（D13-1）")
    assert.ok(SUMMARIZE_PROMPT.includes("When over budget, trim in this order"), "砍价优先级句在（D13-2）")
    assert.ok(SUMMARIZE_PROMPT.includes("completed recaps to one line"), "① 已完成 recap → 一行")
    assert.ok(SUMMARIZE_PROMPT.includes("FILES CHANGED why-notes to bare paths"), "② FILES CHANGED why 注释 → 裸路径")
    assert.ok(SUMMARIZE_PROMPT.includes("in-progress prose tightened"), "③ 进行中叙述 → 收紧")
    assert.ok(SUMMARIZE_PROMPT.includes("NEVER cut design anchors or UNRESOLVED ISSUES/TODOs"), "④ 永不砍设计锚点/未决清单")
  })

  it("EXPLORE_TOOLS 只含只读知识型（execute 不计入）", () => {
    for (const name of ["read", "grep", "glob", "ls", "code_search", "doc_search", "repo_outline"]) {
      assert.ok(EXPLORE_TOOLS.has(name), `${name} 属于探索类`)
    }
    assert.ok(!EXPLORE_TOOLS.has("execute"), "execute 写文件，不属于探索类")
  })

})


// ---------------------------------------------------------------- §14 工具调用失败回降（2026-09-04——A 锚——D-TF1 逐字——fail-when-unchanged）
// VS Code 无独立 *_md 描述文件——工具描述嵌在 src/tools/*.mjs 字符串里；按实际工具逐一定位断言（CLI 按 md 文件断言——同语义）。

const TOOLS_A_DESC_ANCHOR = "use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed"

describe("§14 tool-failure fallback — A 锚（D-TF1 逐字）", () => {
  it("tools 描述（file.mjs edit/hashline + more-file.mjs insert_after）: A 锚句（T-TF1）", () => {
    const fileSrc = readFileSync(join(SRC_DIR, "tools", "file.mjs"), "utf8")
    const moreSrc = readFileSync(join(SRC_DIR, "tools", "more-file.mjs"), "utf8")
    assert.equal(fileSrc.split(TOOLS_A_DESC_ANCHOR).length - 1, 2, "T-TF1: file.mjs 的 edit + hashline 两个描述各含一次 A 锚句（D-TF1 逐字）")
    assert.equal(moreSrc.split(TOOLS_A_DESC_ANCHOR).length - 1, 1, "T-TF1: more-file.mjs 的 insert_after 描述含 A 锚句（D-TF1 逐字）")
  })

  it("prompts/system.md: 行号敏感 A 锚句（T-TF2）", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(
      text.includes("Line-number-sensitive tools (insert_after, hashline_edit) and exact-match tools (edit) require the freshest read — re-read the file before calling if it may have changed."),
      "T-TF2: system.md 含行号敏感提示句（D-TF1 逐字——fail-when-unchanged）",
    )
  })
})

// ---------------------------------------------------------------- §20.9 Module Split Policy（2026-09-04——D-P1.1 锚——fail-when-unchanged）

describe("§20.9 module split policy", () => {
  it("system.md: Module Split Policy 段含 write-first / assertion count 短语（T-P1.1 — D-P1.1 锚——fail-when-unchanged）", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(text.includes("Module Split Policy"), "T-P1.1: system.md 含「Module Split Policy」——fail-when-unchanged（段被删即失败）")
    assert.ok(text.includes("write-first"), "T-P1.1: system.md 含「write-first」——fail-when-unchanged")
    assert.ok(text.includes("assertion count"), "T-P1.1: system.md 含「assertion count」——fail-when-unchanged（评审 #6 独特断言词）")
  })
})

