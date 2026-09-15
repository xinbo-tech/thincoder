/**
 * agent-tools-registry.test.mjs — W9（2026-09-15）：自持工具登记面退役后的**登记册 14 名装配断言**
 * （「引核册」——以核登记册 `@thincoder/core/agent-tools.mjs` 为唯一来源；CORE-UNIFICATION §2.13.4 #83）。
 *
 * 判据（W9 专项验收第 2 项）：
 *  ① 核登记册 = 14 名（名集逐字钉死——新增/删除名在此显性失败，不得静默漂移）；
 *  ② 端侧转口面 `src/agent-tools/index.mjs` 与核登记册**同集**（`export * from` 形态——
 *     VSC 侧不再自持工具集清单）；
 *  ③ 装配消费者 `src/agent/setup.mjs`（结构机检——核 #83 同款形态）**动态**取自核登记册且
 *     恰 14 名（静态引入会经 consult/subagent 族触达 node:sqlite——W8 契约②，
 *     test/engine-floor-guard.test.mjs）。
 * 纯单元：零网络、零 vscode。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const VSC_ROOT = join(HERE, "..")

/** 登记册 14 名（核 `agent-tools.mjs`——W9 as-of，与核侧 17 行档同源）。 */
const REGISTRY_NAMES = [
  "planTool", "subagentTool", "taskTool", "skillTool", "goalTool", "verifyTool",
  "recentChangesTool", "timerTool", "advisorTool", "engTool", "readHistoryTool",
  "batchSegmentTool", "consultStartTool", "consultStopTool",
]

test("W9 ① 核登记册：14 名逐字（名集钉死——工具对象/工厂齐备）", async () => {
  const reg = await import("@thincoder/core/agent-tools.mjs")
  assert.deepEqual(Object.keys(reg).sort(), [...REGISTRY_NAMES].sort(), "核登记册名集 = 14 名（引核册）")
  for (const name of REGISTRY_NAMES) {
    // batchSegmentTool = 工厂（绑定档 → 工具对象）；余 13 名为单例工具对象
    assert.ok(["object", "function"].includes(typeof reg[name]), `${name} 必须是工具对象或工厂`)
    assert.equal(typeof reg[name].name, "string", `${name}.name 必须为字符串`)
  }
})

test("W9 ② 端侧转口面：src/agent-tools/index.mjs 与核登记册同集", async () => {
  const face = await import("../src/agent-tools/index.mjs")
  const reg = await import("@thincoder/core/agent-tools.mjs")
  assert.deepEqual(Object.keys(face).sort(), Object.keys(reg).sort(), "转口面 = 核登记册（同集——非自持清单）")
})

test("W9 ③ 装配消费者（结构机检）：setup.mjs 自核登记册动态取 14 名", () => {
  const setup = readFileSync(join(VSC_ROOT, "src", "agent", "setup.mjs"), "utf8")
  const m = setup.match(/const\s*\{([^}]*)\}\s*=\s*await import\("@thincoder\/core\/agent-tools\.mjs"\)/)
  assert.ok(m, "setup.mjs 必须以 await import() 动态载入核登记册（静态链破 W8 契约②）")
  const imported = m[1]
    .split(",")
    .map((s) => s.replace(/\/\/.*$/s, "").trim()) // 行内注释剥离（§25 R17 句）
    .filter(Boolean)
  assert.deepEqual(imported.sort(), [...REGISTRY_NAMES].sort(), "装配面恰取登记册 14 名（无缺无余）")
  // 负控：端侧不得再自持逐档 re-export 面（W9 删旧面）
  assert.ok(!/from\s+"\.\.\/agent-tools\.mjs"/.test(setup), "setup.mjs 不得再指向已退役的端侧 barrel")
})
