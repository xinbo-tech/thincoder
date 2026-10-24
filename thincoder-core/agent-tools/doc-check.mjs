/**
 * agent-tools/doc-check.mjs — `doc_check` 工具：文档纪律机检（产品内建 · 两种问法）。
 *
 * 设计 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 条目 S（判据 = 锚 ∥ 行宽 · 参数内置常量）。
 * 工具形：**无动作枚举**——`mode` = 同一条判据的两种问法（`report` = 报告态 ∥ `gate` = 交付时点的裁定）；
 * **只读**（零副作用 · 免审批 · 可并行）；参数 `target` / `mode` / `docs`
 * （`target` 指向多项目工作区 ⇒ 报明候选并要求指名，同 `manifest` 工具面）。
 * 判据参数 = 引擎内置常量 `DOC_CHECK_BUILTINS`——不读 manifest、不硬编码本仓路径、不扫目录。
 * 判定范围 = 调用方传入的档：`report` 面 `docs` 必填（不给 ⇒ 明确报错，零遍历）；
 * `gate` 面缺省 = 本会话触达记账里的 `.md`（交付面按轮次收窄的唯一来源）。
 * `report` 非门禁（硬）：输出不得被读作拒执行的理由（用户令 > 机检——§2 总则族）；
 * `gate` 的强制面住交付协议 + 批次档 §6 前置，工具本体同样不阻断任何动作。
 * 描述外置：模型可见文本单点 = `tool-docs/doc_check.md`（`DESC` 单一解析面）。
 * 装配段 = `agent/family-tools.mjs` 三处（depth-0 / eng-coder / eng-designer）——写文档 / 设计档的角色面。
 */
import { resolve } from "node:path"
import { projectRootView } from "../manifest.mjs"
import { runDocCheck } from "../doc-check/index.mjs"
import { DESC } from "../tools/shared.mjs"

export const docCheckTool = {
  name: "doc_check",
  description: DESC("doc_check"),
  parameters: {
    type: "object",
    properties: {
      target: { type: "string", description: "Explicit project root to check — defaults to the session anchor; relative paths resolve against it. A workspace target (several projects below it) is reported with the full candidate list — pass the project root you mean." },
      mode: { type: "string", enum: ["report", "gate"], description: "How to ask the same two-criteria check. \"report\" (default): a non-gating report over the documents you list in docs. \"gate\": the delivery gate — the documents this round touched (docs, or this session's written documents when docs is omitted), whole-file judged, first line a machine-readable verdict (DOC-CHECK GATE: PASS / REFUSED / ERROR)." },
      docs: { type: "array", items: { type: "string" }, description: "The documents to judge, as paths relative to the project root or absolute — each is judged whole; nothing else is read except the targets those documents point at. Required in \"report\" mode (there is no default range: omitting it is refused, not widened). Omitted in \"gate\" mode ⇒ the Markdown documents this session wrote. A path that is not on disk or is not a Markdown document is an error (no document judged) in report mode and a visible skipped line in gate mode." },
    },
  },
  readonly: true,
  execute(args, ctx) {
    const anchor = ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
    const target = args?.target ? resolve(anchor, String(args.target)) : resolve(anchor)
    const mode = args?.mode === undefined ? "report" : String(args.mode)
    if (mode !== "report" && mode !== "gate") return `doc_check: unknown mode "${mode}" — use "report" (a report over the documents you list) or "gate" (this round's documents).`
    const explicit = Array.isArray(args?.docs) ? args.docs : null
    if (args?.docs !== undefined && !Array.isArray(args.docs)) {
      return `doc_check: \`docs\` must be an array of paths (got ${typeof args.docs}) — a bare string is refused rather than read as a whole-domain request; pass ["<path>"].`
    }
    if (explicit && explicit.some((d) => typeof d !== "string")) {
      return "doc_check: every `docs` entry must be a path string — a non-string entry is refused rather than coerced (no document was judged)."
    }
    const view = projectRootView(target)
    if (view.state === "workspace") {
      if (mode === "gate") {
        return [
          "DOC-CHECK GATE: ERROR（多项目工作区：请指名 target）",
          `候选：${view.candidates.join(" ∥ ")}`,
          "处置：指名项目根（`target`）后复跑",
        ].join("\n")
      }
      return `doc_check: ${target} is a workspace holding ${view.candidates.length} projects — pass the project root explicitly via target:\n` +
        view.candidates.map((c) => `- ${c}`).join("\n")
    }
    const root = view.state === "ok" ? view.root : target
    if (mode === "gate") {
      const docs = explicit ?? (Array.isArray(ctx?.agent?._touchedFiles) ? ctx.agent._touchedFiles : [])
        .filter((p) => typeof p === "string" && p.toLowerCase().endsWith(".md"))
      return runDocCheck(root, { mode: "gate", docs, docsSource: explicit ? "explicit" : "session" }).report
    }
    // 报告态：清单是唯一范围来源——不给就是拒绝（不是「全域」）。
    if (explicit === null) {
      return "doc_check: `docs` is required in report mode — pass the explicit list of documents to judge (e.g. docs: [\"docs/design/X.md\"]). There is no default range: nothing is scanned unless you name it."
    }
    return runDocCheck(root, { docs: explicit, docsSource: "explicit" }).report
  },
}
