/**
 * audit-block.mjs — 审计块构造器（AGENT-LOOP-SUBAGENT.md §6.26 · 台账 #23）。
 *
 * 自 `subagent-spawn.mjs` **逐字搬移**（D23-3 外提：spawn 档越 300 软线 + 块构造成纯函数
 * ⇒ 判据面可直测；D23-4：块内文本零改——含块内自指词，整块搬移不改真值）。本档承载
 * spawn 级固定机制性指令的第二块（审计模板 + A2 任务书摘要 + touched 快照）：
 * 装配侧只收集（`thincoder-core/agent-tools/subagent-spawn.mjs`），下发面 = system 固块
 * （`child._spawnSystemBlock` → 核 `prepareRun` 拼接——`thincoder-core/agent/setup.mjs`）。
 */

/**
 * §18.7 D-TS5 (A2): mechanically summarize the parent spawn task book for the
 * audit spawn — the three audit-relevant elements VERBATIM (design doc paths /
 * affected-file list / acceptance criteria); verbose context/background is
 * dropped (the auditor can read the design docs themselves — they stay
 * available outside this input). Independence preserved: the input is
 * _engTaskInput (mechanically kept by the parent spawn) — never the
 * eng-coder's self-report. Sections are located by header marker, prioritizing
 * header lines (structured task books: "## 文件清单 …") and falling back to
 * inline markers (flat one-line task books); a section runs to the next header
 * of the SAME OR HIGHER level ("## 文件清单" survives a "### 修改" sub-header).
 * Marker not found → the section is reported as missing (never fabricate).
 */
export function summarizeEngTaskBook(taskInput) {
  if (!taskInput) return "(unavailable)"
  const SECTIONS = [
    { name: "Design docs involved", markers: [/Docs? involved/i, /涉及文档/] },
    { name: "Affected-file list", markers: [/Files? (?:list|to (?:modify|change)|modified)/i, /受影响文件/, /文件清单/, /涉及文件/] },
    { name: "Acceptance criteria", markers: [/Acceptance(?: criteria)?/i, /验收标准/] },
  ]
  const lines = taskInput.split("\n")
  const headerLevel = (l) => {
    const m = l.match(/^\s*(#{1,6})\s/)
    return m ? m[1].length : 0
  }
  const headerIdx = lines.map((l, i) => (headerLevel(l) > 0 ? i : -1)).filter((i) => i >= 0)
  const boundsFor = (from, level) => {
    for (const j of headerIdx) {
      if (j > from && (level === 0 || headerLevel(lines[j]) <= level)) return j
    }
    return lines.length
  }
  const out = []
  for (const { name, markers } of SECTIONS) {
    let from = -1
    let level = 0
    for (const i of headerIdx) {
      if (markers.some((m) => m.test(lines[i]))) { from = i; level = headerLevel(lines[i]); break }
    }
    if (from === -1) {
      for (let i = 0; i < lines.length; i++) {
        if (markers.some((m) => m.test(lines[i]))) { from = i; level = 0; break }
      }
    }
    if (from === -1) { out.push(`${name}: (not found in the parent task book)`); continue }
    const body = lines.slice(from, boundsFor(from, level)).join("\n").trim()
    out.push(body || `${name}: (empty section)`)
  }
  return out.join("\n\n")
}

/**
 * 审计块（spawn 级固定 ⇒ system 固块——§6.26 分类裁定表第 2 行）：纯函数——touched 快照
 * （`ctx.agent._touchedFiles`——机制面证据，非 eng-coder 自述）+ A2 任务书摘要
 * （`summarizeEngTaskBook(ctx.agent._engTaskInput)`）+ 指令 / 范围 / 零 git 权威 / 预算 /
 * 报告格式五段模板**逐字**。零副作用（只读 ctx）；块内文本与搬移前逐字节一致。
 * @param {{ agent?: { _touchedFiles?: string[], _engTaskInput?: string } }} ctx
 * @returns {string} 块文本（不含与其它块之间的分隔符——分隔由装配侧 `join("\n\n")` 施加）
 */
export function buildAuditBlock(ctx) {
  const touched = (ctx.agent._touchedFiles ?? []).map((f) => `- ${f}`).join("\n") || "- (none yet)"
  return `[Audit scope — mechanical context, independent of the eng-coder's self-report:]\n` +
    // §18.7 D-TS4 A1：审计指令模板（四类偏差 + 范围限制 + 校验清单格式）——审计语义
    // 不再靠模型自悟；范围限制是 §18.5 D-AG3 声明（下方 Zero-git scope authority）
    // 的同源一句指注，不重复声明。
    `[Audit instructions — mechanical template:]\n` +
    `You are auditing an eng-coder delivery against its approved design — audit for EXACTLY these four deviation categories:\n` +
    `- PARTIAL: an acceptance criterion implemented partially or not at all;\n` +
    `- SILENT-SIMPLIFICATION: a "simpler approximation" of a specified behavior substituted for the spec;\n` +
    `- DOC-DRIFT: code changed without the owning design-doc section (module map / affected-files table) updated in the same delivery;\n` +
    `- OUT-OF-LIST: changes outside the approved file list.\n` +
    `Audit scope = _touchedFiles above UNION the files confirmed by the parent task book (single source — the Zero-git scope authority note below; NOT a second copy): ` +
    `workspace changes not listed there are unrelated to this delivery and are NOT grounds for an out-of-list finding.\n` +
    `Scope discipline (F-TS6 A1): read ONLY the audited files and the design-doc sections relevant to this delivery — do NOT re-read whole documents.\n` +
    `Every deviation item MUST be fieldized: file:line + design reference (doc path + section/AC id) + severity + evidence (quoted code or doc text).\n` +
    // §18.7 D-TS5 A2：任务书从全量 verbatim 改机械摘要块（三要素逐字——排除冗长上下文）。
    `[Parent spawn task book — mechanical summary: design docs + affected-file list + acceptance criteria verbatim; verbose context/background dropped — the design docs are still available for reading outside this input:]\n` +
    `${summarizeEngTaskBook(ctx.agent._engTaskInput)}\n` +
    `Files actually touched by the eng-coder (mechanical union — audit these against the file list):\n${touched}\n` +
    // §18.5 D-AG3（2026-09-04）：审计零 git 范围权威声明——本审计任务零 git（不注入
    // git 上下文——§18.5 全角色零 git）；_touchedFiles 为审计范围；工作区未列于
    // _touchedFiles 的改动与本任务无关，不作超清单依据（VS Code auditTaskBook 同款措辞）。
    "Zero-git scope authority: this audit task receives NO git context — nothing is injected. " +
    "The evidence base is the design documents, the current disk state (read/glob/grep), and the _touchedFiles list above. " +
    "Workspace changes NOT listed in _touchedFiles are unrelated to this delivery — they are NOT grounds for an out-of-file-list finding." +
    // §18.13 D-A1.2：审计预算句——A1 指令模板 + A2 摘要块之后、A3 报告模板之前（定序——评审 #7）。
    // 逐字设计锚（D-A1.2 代码块）：只读该读的——10 轮机械预算——超时报 PROBLEM 下结论。
    // 前导 \n 与 A3 同款块分隔约定（上一句 Zero-git 句末无换行——不触碰既有句）。
    `\n[Audit budget — mechanical]: read ONLY the touched files listed above and the design-doc sections the parent task book names (affected-files table, acceptance criteria, status line). Do NOT read whole documents. Budget = 10 tool rounds max — if you cannot conclude within it, report PROBLEM (inconclusive) rather than continuing to explore.\n` +
    // §18.7 D-TS6 A3：审计输出报告格式模板（三态——字段化行——不让模型自由发挥）。
    `\n[Audit report format — mechanical template:]\n` +
    `Report EXACTLY one of three states:\n` +
    `- CLEAN — no deviation across the four categories: reply the line "Four deviation categories: none found." (四类偏差均未发现);\n` +
    `- DEVIATIONS — one row per deviation, every row fieldized: | category | file:line | design reference | severity | evidence |;\n` +
    `- PROBLEM — the audit itself could not run / inconclusive: state what blocked it.\n`
}
