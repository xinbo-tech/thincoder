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
 * thincoder-vscode 不存在时动态 skip（同 prompts 比对的先例——单独 clone CLI 仓库时）。
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

  // ── 探索蒸馏（SEND-STALL-DISTILL / CONTEXT-COMPACTION §5，两端语义一致）──
  ["EXPLORE_TOOLS 集合（蒸馏判定基准）", "context.mjs", "compact.mjs", "EXPLORE_TOOLS = new Set(["],
  ["EXPLORE_SUMMARY_PROMPT 前缀（蒸馏提示词）", "context.mjs", "compact.mjs", "You are distilling exploration tool results"],
  ["蒸馏触发阈值 ≥3 条探索结果", "context.mjs", "compact.mjs", "resultCount < 3"],
  ["探索结果序列化上限 8000（quality-first, N1）", "context.mjs", "compact.mjs", "const cap = 8000"],

  // ── 工具输出落盘（TOOL-OUTPUT-LIMITS 全链路 64K，lockstep 标注）──
  ["落盘阈值 64 * 1024（CLI helpers / VS run-helpers）", "agent/helpers.mjs", "agent/run-helpers.mjs", "= 64 * 1024"],
  ["落盘保留期 3 天（TMP_RETENTION_MS）", "agent/helpers.mjs", "agent/run-helpers.mjs", "TMP_RETENTION_MS = 3 * 24 * 3600 * 1000"],
]

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
