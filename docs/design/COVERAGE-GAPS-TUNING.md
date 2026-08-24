# 覆盖率缺口修复 — 设计（CLI）

> 状态：待评审（2026-08-25）
> 需求：`docs/design/COVERAGE-GAPS-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）

## 1. 问题陈述（Problem Statement）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | `MAX_RESULT_CHARS` 未导出，测试用"读源码 + 正则断言"（`assert.match(src, /const MAX_RESULT_CHARS = 64 \* 1024/)`）——只锁**声明行**，不锁 `:284` 截断点确实消费该常量；且与 vscode 端（已 `export` + import 断言）风格不一致 | `src/advisor/run.mjs:33`、`test/advisor.test.mjs:1093-1096` | 若未来有人把截断点硬编码回 12_000，测试仍绿（代码评审遗留 2） |
| P2 | "旧阈值（16000/2000/12000）无残留"（TOOL-OUTPUT-LIMITS AC7）靠一次性人工 grep 验证，无自动化测试锁定 | `src/agent/helpers.mjs`（阈值定义处） | 下次改阈值时旧常量可能被重新引入而无测试兜底（代码评审遗留 3） |

## 2. 解决方案（Solution Approach）

### 2.1 MAX_RESULT_CHARS 导出 + import 断言（P1）

- `src/advisor/run.mjs:33`：`const MAX_RESULT_CHARS` → `export const MAX_RESULT_CHARS`（与 vscode 端 `run.mjs:34` 对齐）。
- `test/advisor.test.mjs:1093-1096`：删除读源码正则用例，改为：

```js
import { MAX_RESULT_CHARS } from "../src/advisor/run.mjs"  // 或现有 import 行追加
test("advisor: MAX_RESULT_CHARS = 64 * 1024（65536，与主链路落盘阈值一致）", () => {
  assert.equal(MAX_RESULT_CHARS, 64 * 1024, "advisor 工具结果截断上限 = 64K（旧 12K，line-aware 截断逻辑不变）")
})
```

- import 断言锁住导出值本身；截断点消费由代码审查 + 现有行为测试兜底（`run.mjs:284/292` 引用同一常量）——**保证范围 = 值锁定**（评审 #2，2026-08-25）：不额外 mock advisor 长工具结果做行为断言（成本高、收益低）。

### 2.2 旧阈值残留自动化断言（P2）

`test/agent.test.mjs` 新增用例（复用读源码断言先例；**ESM 顶层 import，不用 require**——评审 #4）：

```js
import { readFileSync } from "node:fs"

test("helpers.mjs: 工具输出旧阈值（16_000/2_000）无残留", () => {
  const src = readFileSync(new URL("../src/agent/helpers.mjs", import.meta.url), "utf8")
  // 边界匹配（评审 #5）：\b 防误伤 32_000 / 2_000_000（下划线是单词字符，\b2_000\b 不匹配 2_000_000）
  assert.ok(!/\b16_000\b/.test(src), "落盘阈值无 16K 残留")
  assert.ok(!/\b2_000\b/.test(src), "preview 无 2K 残留")
  assert.ok(src.includes("64 * 1024"), "新阈值在位")
})

test("advisor/run.mjs: 无 12_000 边界残留（评审 #3）", () => {
  const src = readFileSync(new URL("../src/advisor/run.mjs", import.meta.url), "utf8")
  assert.ok(!/\b12_000\b/.test(src), "advisor 截断无 12K 残留")
})
```

- 限定工具输出管线专属文件（`helpers.mjs` + `advisor/run.mjs`）——不误伤其他业务常量（如 `MAX_INSTRUCTION_CHARS = 32_000`、`MAX_STREAM_BUF = 2_000_000`，`\b` 边界匹配天然排除）。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/advisor/run.mjs` | MODIFY | `:33` 常量加 `export` |
| `test/advisor.test.mjs` | MODIFY | 删读源码正则用例（`:1093-1096`），改 import 断言 |
| `test/agent.test.mjs` | MODIFY | 新增残留自动化断言用例（helpers.mjs） |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `MAX_RESULT_CHARS` 可导入且 = 65536 | `import` 断言测试通过 |
| AC2 | 读源码正则断言已删除（无 `assert.match(src, /const MAX_RESULT_CHARS/`） | grep 验证 |
| AC3 | helpers.mjs 无 `16_000`/`2_000` 残留（`\b` 边界匹配，不误伤 32_000/2_000_000），含 `64 * 1024`；advisor/run.mjs 无 `12_000` 残留 | 新增自动化断言用例通过 |
| AC4 | `node --test test/*.test.mjs` 全套通过 | 命令 |
