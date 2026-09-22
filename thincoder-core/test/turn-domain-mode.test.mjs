/**
 * turn-domain-mode.test.mjs — auto-turn digest 域**模式变体**（F10 提醒面第三实例 · tool-discipline 批）。
 *
 * 设计权威 = `docs/core/design/TOOLS.md` §6.15.3（变体文本与选串机制单源）；机制面 =
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8（digest 动作域两档）。
 * 病征：工程模式下 `task` 既不在工具表又机械拒（F10）⇒ 普通档 digest 域文本第 2 条的
 * 「update the task list … (allowed)」= 死胡同 + 错误陈述 ⇒ 平行导出 + 按模式选串。
 *
 * 用例：DOM-C1（两常量形态：普通档逐字零变 / 变体单行且零旧指引）·
 *       DOM-C2（核选串结构机检：变体名消费点唯一 ∧ 注入点三元内 ∧ 两级选择同式）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { AUTO_TURN_DIGEST_DOMAIN, AUTO_TURN_DIGEST_DOMAIN_ENG } from "../agent/helpers.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const count = (s, sub) => s.split(sub).length - 1

test("DOM-C1 常量行为：普通档逐字零变（全串覆盖）+ 变体单行形态", () => {
  // 普通档 = 既有文本零变（内审轮加固：全串分段落逐字——clause 1/2/3 + FORBIDDEN 句 + 头尾）
  assert.ok(AUTO_TURN_DIGEST_DOMAIN.startsWith("[System reminder: auto-turn — background async subagents finished while there was no user message"),
    "普通档头部逐字")
  for (const seg of [
    "1) summarize each finished report's key points into this conversation for the user to read later;",
    "2) update the task list with the task tool (allowed) to mark finished work done;",
    "3) write decision points with a suggested next step as text — do not execute it.",
    "FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message.",
  ]) assert.ok(AUTO_TURN_DIGEST_DOMAIN.includes(seg), `普通档段逐字在场：${seg.slice(0, 34)}…`)
  assert.ok(AUTO_TURN_DIGEST_DOMAIN.endsWith("End the turn once the summaries are written.]"), "普通档尾部逐字")
  // 变体 = 单行 / `]` 收尾 / 含 disabled 陈述与「batch record + ledger」追踪权威面指引 / 零旧指引
  assert.ok(!AUTO_TURN_DIGEST_DOMAIN_ENG.includes("\n"), "变体 = 单行（无换行——同 `UPSTREAM_TURN_DOMAIN` 形态）")
  assert.ok(AUTO_TURN_DIGEST_DOMAIN_ENG.endsWith("]"), "变体以 `]` 收尾（括号形态）")
  assert.ok(AUTO_TURN_DIGEST_DOMAIN_ENG.includes("the task tool is disabled"), "含 disabled 陈述（工程模式）")
  assert.ok(AUTO_TURN_DIGEST_DOMAIN_ENG.includes("the batch record + ledger are the tracking authority"),
    "含追踪权威面指引（批次档 + 台账）")
  assert.ok(!AUTO_TURN_DIGEST_DOMAIN_ENG.includes("update the task list with the task tool (allowed)"),
    "变体零普通档 clause 2 字面")
  assert.notEqual(AUTO_TURN_DIGEST_DOMAIN_ENG, AUTO_TURN_DIGEST_DOMAIN, "平行导出真平行（两常量非同一串）")
})

test("DOM-C2 核选串结构机检：变体名与 `(autoTurn || upstreamTurn)` 同段（注入点三元内）", () => {
  const src = readFileSync(join(ROOT, "agent.mjs"), "utf8")
  const lines = src.split("\n")
  const at = lines.findIndex((l) => l.includes("(autoTurn || upstreamTurn)"))
  assert.ok(at >= 0, "注入点条件锚 `(autoTurn || upstreamTurn)` 在场")
  const block = lines.slice(at, at + 3).join("\n")
  assert.equal(count(block, "AUTO_TURN_DIGEST_DOMAIN_ENG"), 1, "注入点三元内变体名恰 1 处")
  assert.match(block, /upstreamTurn \? UPSTREAM_TURN_DOMAIN : \(agent\.config\?\.agent\?\.engineering === true \? AUTO_TURN_DIGEST_DOMAIN_ENG : AUTO_TURN_DIGEST_DOMAIN\)/,
    "两级选择同式（轮型 → 模式；条件 / transient / 位置零改）")
  // 消费点唯一：import 绑定不计（ES 模块必须具名引入——设计括注「注入点三元内」= 计数域）
  const uses = lines.filter((l) => l.includes("AUTO_TURN_DIGEST_DOMAIN_ENG") && !/^\s*AUTO_TURN_DIGEST_DOMAIN_ENG,/.test(l))
  assert.equal(uses.length, 1, "变体名消费点唯一（其余命中 = import 绑定行）")
})
