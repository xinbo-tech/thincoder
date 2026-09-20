/**
 * spawn-gates.mjs — M5 委派与 spawn 门新门禁统一落点（ENGINEERING-MODE-V2-MODULE-DELEGATION §2.3）：
 * 全部新增门禁逻辑集中于此——装配点（buildSpawnChild / normalizeFileList）只加 import 调用。
 * 已实现：F2（round 结构化参数 + 任务书五段文本字段校验）· F6（files 声明面拦截谓词）。
 * 裁撤（2026-09-17 主 agent 裁定——不落代码）：
 *   - F4 修复轮窄带：全量勘察散文 marker 不可机判（误拒风险不可接受）→ 由 F2 五段字段覆盖；
 *   - F5 advisor 角色：advisor 不入 spawn 通道（评审走 advisor 工具）——enum 收正为
 *     explore/eng-designer/eng-coder。
 * 零依赖：本模块零 import（叶子——纯谓词层，无环、无反向依赖）。
 */

/**
 * F2 任务书五段文本字段（六强制字段中 round 之外的五段——ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2）。
 * 判据 = 段标题在场（标题行或行内 marker——summaryEngTaskBook 同款手法：marker 正则命中
 * task ∪ context 文本即可）；内容够不够由执行者拒收兜底（需求 §1.14 #9 行为面——不做内容校验）。
 * 双语 marker：中文标题（主 agent 派单形）与英文标题（交付报告格式模板形）同收。
 */
const TASK_BOOK_FIELDS = [
  { label: "目标与理由 (goal & why)", markers: [/目标与理由/, /goal\s*&\s*why/i, /goal\s+and\s+why/i] },
  { label: "已知事实 (known facts)", markers: [/已知事实/, /known\s+facts/i] },
  { label: "设计要点与禁止范围 (design points & forbidden scope)", markers: [/设计要点/, /design\s+points/i] },
  { label: "验收标准 (acceptance criteria)", markers: [/验收标准/, /acceptance\s+criteria/i] },
  { label: "交付报告格式 (delivery-report format)", markers: [/交付报告格式/, /交付报告/, /delivery[- ]report\s+format/i] },
]

/** F2 round 合法值（初始轮 / 修正轮——「派单必带」= 无默认值）。
 * 单源：本档为唯一字面量处——schema 面（`agent-tools/subagent.mjs`）与谓词面（本档）同引用（D2）。
 */
export const ROUND_VALUES = ["initial", "fix"]

/**
 * 五段任务书最小合法样例（F2 契约的正面样例——跨仓测试夹具共用单源；段落名 = 父侧
 * 任务书五段模板）。文本字段判据 = 在场性（内容质量由执行者拒收兜底——需求 §1.14 #9）。
 */
export const ENG_TASK_BOOK_MIN = [
  "目标与理由：实现批准设计（夹具任务书——五段文本字段齐备）。",
  "已知事实：设计已评审通过、token 已签发、批次档在册。",
  "设计要点与禁止范围：仅落设计档受影响文件清单；禁夹带新语义。",
  "验收标准：设计档验收标准逐条可机验、项目验证链全绿。",
  "交付报告格式：交付表 + 文件路径 + 验证命令与结果。",
].join("\n")

/**
 * F2 任务书六强制字段校验（ENGINEERING-MODE-V2-MODULE-DELEGATION §2.2）：
 * round 枚举（initial|fix，必带集合 = eng-coder/eng-designer）+ 五段文本字段在场。
 * 缺任一 → 抛错（派单缺陷——spawn 机械拒）。scan 面 = args.task ∪ args.context
 * （context 是任务书背景段的携带参数——字段落在任一面均算在场）。
 */
export function validateTaskBookFields(args) {
  const a = args ?? {}
  const missing = []
  if (!ROUND_VALUES.includes(a.round)) {
    missing.push(a.round === undefined || a.round === null
      ? `round (${ROUND_VALUES.join("|")}) — the structured round parameter`
      : `round ∈ {${ROUND_VALUES.join(", ")}} (got ${JSON.stringify(a.round)})`)
  }
  const text = [a.context, a.task].filter((s) => typeof s === "string").join("\n")
  for (const f of TASK_BOOK_FIELDS) {
    if (!f.markers.some((m) => m.test(text))) missing.push(f.label)
  }
  if (missing.length === 0) return
  throw new Error(
    `Engineering spawn task book is missing mandatory field(s): ${missing.join(" · ")}. ` +
    `The six-field task book — 目标与理由 (goal & why), round (initial|fix), 已知事实 (known facts), ` +
    `设计要点与禁止范围 (design points & forbidden scope), 验收标准 (acceptance criteria), ` +
    `交付报告格式 (delivery-report format) — is the spawn contract; a missing field is a dispatch ` +
    `defect and the spawn is refused.`)
}

/**
 * F6 过程档 basename 族（父侧维护文件——AGENT-LOOP.md §28 R26 F-R26b 同族扩展）：
 * CHANGELOG.md。（台账 = 用户数据目录键控库——项目内无文件，不再入族；老台账族 todo.md /
 * todo-archive.md / checklist 族随 M2 SQLite 化 + M7 checklist 废除退役。）
 * 大小写不敏感全名匹配（路径任意层——归一化在调用点 normalizeFileList 已做）。
 */
const PROCESS_BASENAMES = new Set(["changelog.md"])

/**
 * 工程模式写入面 basename（#33 二道防线——设计 docs/core/design/MANIFEST.md §2.5 / KD-M1-14）：
 * PROJECT-MANIFEST.json = M1 项目状态档——写门唯主 agent（`manifest.mjs` `writeManifest` 的
 * `writer` 闸，fail-closed）；本常量 = `files` 声明面**第二道防线**（子代理无法把该路径声明为
 * 写域）。字面量（匹配前已大小写归一；**不** import `MANIFEST_REL`——保本模块「叶子·零 import」
 * 性质；单源指针 = `thincoder-core/manifest.mjs`）。**不入** `PROCESS_BASENAMES`：两族理由不同
 * ——过程档 = 父侧对账职责；本档 = 写门唯主 agent。
 */
const MANIFEST_BASENAME = "project-manifest.json"

/**
 * F6 files 声明面拦截谓词（ENGINEERING-MODE-V2-MODULE-DELEGATION §2.2）：
 * scripts/**（工程工具面不入域——内容产物 only）与过程档（父侧职责）→ 收集全部违规
 * 后抛合并错误（fail-closed——错误即工具结果 JSON——无排队残留）。目录声明不在本
 * 谓词（normalizeFileList 循环内先行拒——错误序不变）。调用点 = normalizeFileList
 * （subagent-scheduler.mjs——本谓词在循环后跑——目录错误先于过程档错误）。
 */
export function rejectEngineeringFilePaths(files) {
  const violations = []
  for (const f of Array.isArray(files) ? files : []) {
    const segs = String(f).replace(/\\/g, "/").split("/").filter((s) => s)
    const base = (segs[segs.length - 1] ?? "").toLowerCase()
    if (segs.some((s) => s.toLowerCase() === "scripts")) {
      violations.push(`engineering tool path ${f} must not be listed in files — scripts/** is the engineering-tool face, not a content product (files carries source/test/design-doc paths only)`)
    } else if (PROCESS_BASENAMES.has(base)) {
      violations.push(`Parent-side maintained file ${f} must not be listed in files — reconciliation is the parent's duty; use the design-doc path if you need to edit a design doc`)
    } else if (base === MANIFEST_BASENAME) {
      violations.push(`Manifest file ${f} must not be listed in files — PROJECT-MANIFEST.json is the project state manifest and the main agent is its only writer (M1 write gate); this files-domain check is the second line of defense`)
    }
  }
  if (violations.length > 0) throw new Error(violations.join("\n"))
}
