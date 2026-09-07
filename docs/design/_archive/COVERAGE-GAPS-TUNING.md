# 覆盖率缺口修复 — 设计（CLI）

> 状态：**历史已取代——建议归档**（原状态 2026-08-25 已实现，commit a966af0）。
> 取代说明（2026-09-07）：见 REQUIREMENTS.md 头部——本专题的回归断言用例已被测试清零政策 +
> TESTING.md §1 D-T5 Phase-3 清理删除，专题退役。保留为历史记录。
> 原需求：`COVERAGE-GAPS-REQUIREMENTS.md`。

## 1. 问题陈述（Problem Statement，历史）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | `MAX_RESULT_CHARS` 未导出，测试用"读源码 + 正则断言"——只锁声明行，不锁截断点确实消费该常量；与 vscode 端风格不一致 | `src/advisor/run.mjs`、`test/advisor.test.mjs` | 若未来有人把截断点硬编码回 12_000，测试仍绿（代码评审遗留 2） |
| P2 | "旧阈值（16000/2000/12000）无残留"靠一次性人工 grep，无自动化锁定 | `src/agent/helpers.mjs`（阈值定义处） | 下次改阈值时旧常量可能被重新引入而无测试兜底（代码评审遗留 3） |

## 2. 解决方案（Solution Approach，历史）

### 2.1 MAX_RESULT_CHARS 导出 + import 断言（P1）

- `src/advisor/run.mjs`：`const MAX_RESULT_CHARS` → `export const MAX_RESULT_CHARS`
  （与 vscode 端对齐）。
- `test/advisor.test.mjs`：删除读源码正则用例，改为 import 断言：

```js
import { MAX_RESULT_CHARS } from "../src/advisor/run.mjs"

test("advisor: MAX_RESULT_CHARS = 64 * 1024（65536，与主链路落盘阈值一致）", () => {
  assert.equal(MAX_RESULT_CHARS, 64 * 1024, "advisor 工具结果截断上限 = 64K（旧 12K，line-aware 截断逻辑不变）")
})
```

- import 断言锁住导出值本身；截断点消费由代码审查 + 现有行为测试兜底——**保证范围 = 值锁定**
  （评审 #2，2026-08-25）：不额外 mock advisor 长工具结果做行为断言（成本高、收益低）。

### 2.2 旧阈值残留自动化断言（P2）

`test/agent.test.mjs` 新增用例（复用读源码断言先例；**ESM 顶层 import，不用 require**——评审 #4）：

```js
import { readFileSync } from "node:fs"

test("helpers.mjs: 工具输出旧阈值（16_000/2_000）无残留", () => {
  const src = readFileSync(new URL("../src/agent/helpers.mjs", import.meta.url), "utf8")
  // 边界匹配（评审 #5）：\b 防误伤 32_000 / 2_000_000（下划线是单词字符）
  assert.ok(!/\b16_000\b/.test(src), "落盘阈值无 16K 残留")
  assert.ok(!/\b2_000\b/.test(src), "preview 无 2K 残留")
  assert.ok(src.includes("64 * 1024"), "新阈值在位")
})

test("advisor/run.mjs: 无 12_000 边界残留（评审 #3）", () => {
  const src = readFileSync(new URL("../src/advisor/run.mjs", import.meta.url), "utf8")
  assert.ok(!/\b12_000\b/.test(src), "advisor 截断无 12K 残留")
})
```

- 限定工具输出管线专属文件（`helpers.mjs` + `advisor/run.mjs`）——不误伤其他业务常量（如
  `MAX_INSTRUCTION_CHARS = 32_000`、`MAX_STREAM_BUF = 2_000_000`，`\b` 边界匹配天然排除）。

## 3. 受影响文件（Affected Files，历史）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/advisor/run.mjs` | MODIFY | `MAX_RESULT_CHARS` 加 `export`（存活至今——归 TOOL-OUTPUT-LIMITS 管辖） |
| `test/advisor.test.mjs` | MODIFY | 删读源码正则用例，改 import 断言（**用例已随测试清零删除**） |
| `test/agent.test.mjs` | MODIFY | 新增残留自动化断言用例（**用例已随测试清零删除**） |

## 4. 验收标准（Acceptance Criteria，历史）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `MAX_RESULT_CHARS` 可导入且 = 65536 | import 断言测试通过 |
| AC2 | 读源码正则断言已删除（无 `assert.match(src, /const MAX_RESULT_CHARS/`） | grep 验证 |
| AC3 | helpers.mjs 无 `16_000`/`2_000` 残留（`\b` 边界匹配），含 `64 * 1024`；advisor/run.mjs 无 `12_000` 残留 | 新增自动化断言用例通过 |
| AC4 | `node --test test/*.test.mjs` 全套通过 | 命令 |

## 变更记录

- 2026-08-25：实施（commit a966af0；vscode 端 acce3e4）。
- 2026-09-07：判定退役——测试清零政策删除了本专题的全部回归断言，改为历史记录并建议归档。
