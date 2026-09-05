/**
 * cross-repo-parity.test.mjs — 两端同构源码模块的语义锚点比对（CLI ↔ VS Code）。
 *
 * 背景（2026-08-25）：src/prompts/ 已有 byte-identical 比对（agent.test.mjs），但 src 代码的
 * 同构模块（advisor 系列、压缩等）两端各有实现——文件名/内部结构存在合理差异（CLI 的
 * advisor.mjs 在 vscode 拆为 main.mjs；repos.mjs CLI 多内部函数），**不能要求 byte-identical**。
 * 漂移要靠 lockstep 文档提醒 + review 记忆——本测试把关键语义锚点（常量值、收敛协议
 * 上限、提示词前缀、截断阈值）变成机械断言：两端各自读文件断言锚点一致。
 *
 * 语义：每个锚点在两端文件里都必须出现且字面一致——单边改动（如 CLI 把
 * MAX_ADVISOR_ROUNDS 改 6 而 vscode 停在 5）立即红。锚点选取原则：跨仓库契约
 * （行为必须一致的量），不锁两端各自的私有实现细节。
 *
 * thincoder-vscode 不存在时动态 skip（单独 clone CLI 仓库时）。
 *
 * 提示词层同精神（§18.11，2026-09-04）：src/prompts/ 的 15 文件 byte-identical 机械比对
 * 已随 §18.11 取消（设计锚为准——镜像锚在设计文档逐字定稿——两端各自照抄）——本测试的
 * 语义锚方式即提示词层继承的同一精神：语义锚代替字节锚（差异靠设计评审 + 交付审计发现）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST_DIR = dirname(fileURLToPath(import.meta.url)) // thincoder/test
const CLI_SRC = join(TEST_DIR, "..", "src")
const VS_SRC = join(TEST_DIR, "..", "..", "thincoder-vscode", "src")
const VS_PRESENT = existsSync(VS_SRC)

const read = (root, rel) => readFileSync(join(root, rel), "utf8")

/** 锚点表：[描述, CLI 相对路径, vscode 相对路径, 锚点字面量] */
const ANCHORS = [
  // ── advisor 收敛协议（ADVISOR-CONVERGENCE.md 跨端契约）──
  ["MAX_ADVISOR_ROUNDS = 5（收敛上限）", "advisor/run.mjs", "advisor/run.mjs", "export const MAX_ADVISOR_ROUNDS = 5"],
  ["REVIEW_TIMEOUT_MS 默认 600_000（AGENT-PARAMS，2026-08-24 lockstep）", "advisor/run.mjs", "advisor/run.mjs", "REVIEW_TIMEOUT_MS = 600_000"],
  ["timeoutMs 运行时校验（设计评审 #1，两端同构）", "advisor/run.mjs", "advisor/run.mjs", "(Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS"],
  ["advisor 工具结果截断 64K（TOOL-OUTPUT-LIMITS lockstep）", "advisor/run.mjs", "advisor/run.mjs", "MAX_RESULT_CHARS = 64 * 1024"],
  ["advisor 单工具超时 30s", "advisor/run.mjs", "advisor/run.mjs", "TOOL_TIMEOUT_MS = 30_000"],
  ["GIT_TIMEOUT = 5_000", "advisor/repos.mjs", "advisor/repos.mjs", "GIT_TIMEOUT = 5_000"],
  ["MAX_EMBEDDED_DIFF = 50_000", "advisor/repos.mjs", "advisor/repos.mjs", "MAX_EMBEDDED_DIFF = 50_000"],
  ["收敛轮次上限提示语（round 3+ 严格验证）", "advisor/convergence.mjs", "advisor/convergence.mjs", "Do NOT look for new issues"],

  // ── 探索蒸馏（SEND-STALL-DISTILL / CONTEXT-COMPACTION §5，两端语义一致；2026-09-05 模块
  // 拆分轮：context.mjs/compact.mjs 蒸馏段 verbatim 迁至两端同名 explore-distill.mjs——锚改指）──
  ["EXPLORE_TOOLS 集合（蒸馏判定基准）", "explore-distill.mjs", "explore-distill.mjs", "EXPLORE_TOOLS = new Set(["],
  ["EXPLORE_SUMMARY_PROMPT 前缀（蒸馏提示词）", "explore-distill.mjs", "explore-distill.mjs", "You are distilling exploration tool results"],
  ["蒸馏触发阈值 ≥3 条探索结果", "explore-distill.mjs", "explore-distill.mjs", "resultCount < 3"],
  ["探索结果序列化上限 8000（quality-first, N1）", "explore-distill.mjs", "explore-distill.mjs", "const cap = 8000"],

  // ── 工具输出落盘（TOOL-OUTPUT-LIMITS 全链路 64K，lockstep 标注）──
  ["落盘阈值 64 * 1024（CLI helpers / VS run-helpers）", "agent/helpers.mjs", "agent/run-helpers.mjs", "= 64 * 1024"],
  ["落盘保留期 3 天（TMP_RETENTION_MS）", "agent/helpers.mjs", "agent/run-helpers.mjs", "TMP_RETENTION_MS = 3 * 24 * 3600 * 1000"],

  // ── 端分离恢复 end marker（SESSION.md §10 D-1/D-2——两端同构镜像，2026-09-05）──
  ["marker 路径 = {manifest}.{END}（manifest 旁独立小文件——NF1）", "session-slots.mjs", "extension/session-slots.mjs", "export function endMarkerPath(cwd) { return `"],
  ["readEndMarker 读侧三态（缺失/损坏→null、置空 slot:null）", "session-slots.mjs", "extension/session-slots.mjs", "export function readEndMarker(cwd) {"],
  ["marker 写形态 {slot, updatedAt}（原子写 + 失败容忍 NF2）", "session-slots.mjs", "extension/session-slots.mjs", "{ slot, updatedAt: Date.now() }"],
  ["D-1 缺失 vs 置空必须区分（置空绝不继承）", "session-slots.mjs", "extension/session-slots.mjs", "slot: null` = 显式置空"],
  ["D-1 损坏读侧按缺失降级——不 rename 不 unlink", "session-slots.mjs", "extension/session-slots.mjs", "不 rename 不 unlink"],
  ["claimSlot（认领 + setActive + deadParam 过滤）", "session-slots.mjs", "extension/session-slots.mjs", "export function claimSlot(cwd, slot, m = loadManifest(cwd), deadParam = null) {"],
  ["allocateFresh（ensureActive 分支 2/3 抽取——全新分配复用）", "session-slots.mjs", "extension/session-slots.mjs", "export function allocateFresh(cwd, m, deadParam = null) {"],
  ["resumeSlot 恢复决策入口（D-2 ①②③）", "session-slots.mjs", "extension/session-slots.mjs", "export function resumeSlot(cwd) {"],
  ["resumeSlot 每次落点都写本端记录", "session-slots.mjs", "extension/session-slots.mjs", "每次落点都写本端记录"],
  ["② 一次性继承拒绝活属主（全新槽起步 T-M3）", "session-slots.mjs", "extension/session-slots.mjs", "②b 一次性继承"],
  ["删除记录槽 → 置空（CLI deleteSlot / VS deleteSlotAndUpdate）", "session-slots.mjs", "extension/session-io.mjs", "writeEndMarker(cwd, null)"],
]

test("end marker 端常量分离——CLI 写 .cli、VS Code 写 .vscode（单写者互不触碰）",
  { skip: !VS_PRESENT },
  () => {
    const cli = read(CLI_SRC, "session-slots.mjs")
    const vs = read(VS_SRC, "extension/session-slots.mjs")
    assert.ok(cli.includes('END = "cli"'), "CLI 端常量 .cli")
    assert.ok(vs.includes('END = "vscode"'), "VS Code 端常量 .vscode")
    assert.ok(!cli.includes('END = "vscode"'), "CLI 不写 .vscode 记录")
    assert.ok(!vs.includes('END = "cli"'), "VS Code 不写 .cli 记录")
  },
)

test(
  "两端同构模块语义锚点一致（CLI ↔ VS Code，src 不能 byte-identical 但契约必须锁）",
  { skip: !VS_PRESENT },
  () => {
    let checked = 0
    for (const [desc, cliRel, vsRel, anchor] of ANCHORS) {
      const cliText = read(CLI_SRC, cliRel)
      const vsText = read(VS_SRC, vsRel)
      const inCli = cliText.includes(anchor)
      const inVs = vsText.includes(anchor)
      assert.ok(
        inCli && inVs,
        `${desc} — 锚点两端必须同时在位:\n` +
        `  CLI  ${cliRel}: ${inCli ? "✓" : "✗ 缺失（可能已漂移）"}\n` +
        `  VS   ${vsRel}: ${inVs ? "✓" : "✗ 缺失（可能已漂移）"}\n` +
        `  锚点: ${JSON.stringify(anchor)}`,
      )
      checked++
    }
    assert.ok(checked >= 10, `锚点覆盖数异常: ${checked}（表被误删时兜底）`)
  },
)
