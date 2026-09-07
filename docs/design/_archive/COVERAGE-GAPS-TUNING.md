# 覆盖率缺口修复 — 设计（VS Code 扩展） > 状态：**已实现**（2026-08-25 评审修订后实施；commit acce3e4）
> 需求：`docs/design/COVERAGE-GAPS-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）
> 说明：与 CLI 端 `COVERAGE-GAPS-TUNING.md` 同源（两端语义一致，各自文件清单独立——文档地图惯例） ## 1. 问题陈述（Problem Statement） | # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | `onToolResult` 实时显示截断（`const text = (r || "").slice(0, 64 * 1024)`）**无单元测试**——`buildCallbacks` 是 `runPanelChat` 内未导出闭包，`test/chat-panel.test.mjs` 未覆盖此截断点 | `src/extension/panel-chat.mjs:183-187` | 该截断点一旦回归（如改回 20K），测试全绿也抓不到（代码评审遗留 1，TOOL-OUTPUT-LIMITS AC5 缺口） | ## 2. 解决方案（Solution Approach） ### 2.1 全路径测试补覆盖（N1：零结构改动） 利用 `test/chat-panel.test.mjs` 已有的全路径基建（`makePanel` 真实 ChatPanel + `scriptedLLMServer` + `posted` 消息数组），新增用例： ```js
it("AC5 — onToolResult truncates the live tool result at 64K (old 20K cap lifted)", async () => { // read 方式（评审 #6，2026-08-25）：mkFiles 建 70_000 字符 big.txt，第一轮发 read 调用——零额外工具注入 writeFileSync(join(tmp, "big.txt"), "x".repeat(70_000)) const { server, port } = await scriptedLLMServer(async (i, body) => { if (i === 1) return sseTools([{ index: 0, id: "c0", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "big.txt" }) } }]) return sseTurn("done") }) try { const posted = [] const panel = await makePanel(port, posted) await panel._chat("first message", undefined, undefined, "t") const toolMsg = posted.find((m) => m.type === "toolResult" && m.name === "read" && m.text.length > 20_000) assert.ok(toolMsg, "toolResult message posted (read)") assert.equal(toolMsg.text.length, 64 * 1024, "live tool result capped at exactly 64K (评审 #7 精确断言)") } finally { server.close() }
})
``` - **注入方式（已定）**：read 方式——`mkFiles()` 基础上额外写 70_000 字符 `big.txt`，第一轮 `read big.txt`；断言 `toolResult.name === "read"` 且文本为纯 `"x"` 时长度**恰为** 65536（评审 #7：精确断言，排除中间层 30K 等截断的假通过）。
- 实现时核实 read 工具不截断 70_000 字符文件内容（read 工具自身上限若 <70K 则改用 write 的 70K 内容或调整输入到 read 上限以上、64K 以下区间内的可测值——eng-coder 按实际核实调整，报告说明）。 ### 2.2 范围说明 - 本仓库不涉及 CLI 的 MAX_RESULT_CHARS 导出与残留断言（见 CLI 端设计）；vscode 端 `MAX_RESULT_CHARS` 已导出（TOOL-OUTPUT-LIMITS 批），无需再动。
- vscode 端旧阈值残留（AC9）已由 TOOL-OUTPUT-LIMITS 批的 grep 验证 + 本批 CLI 端自动化断言模式覆盖（两端同源）；如需 vscode 端同样自动化，可在后续批补齐——本批不做（避免重复立项）。 ## 3. 受影响文件（Affected Files） | 文件 | 动作 | 内容 |
|---|---|---|
| `test/chat-panel.test.mjs` | MODIFY | 新增 AC5 全路径用例（read 方式或注入工具方式，按现有基建选） |
| `src/extension/panel-chat.mjs` | 不动 | 零结构改动（N1） | ## 4. 验收标准（Acceptance Criteria） | # | AC | 验证方式 |
|---|---|---|
| AC1 | 70_000 字符工具结果经 `onToolResult` 后**恰为** 65536（评审 #7 精确断言，排除中间层截断假通过） | 新用例通过 |
| AC2 | 同结果 > 20000（旧 20K 已破，新 64K 生效） | 新用例断言 |
| AC3 | `panel-chat.mjs` 无结构改动（无新增导出/无闭包重构） | git diff 验证 |
| AC4 | `npm test` 全套通过 | 命令 |
