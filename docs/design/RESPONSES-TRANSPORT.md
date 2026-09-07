# Responses API Transport — 设计

> 状态：**2026-08-31 重启实施**（用户确认：国产已大量支持 + 长会话请求体痛点）。2026-08-15 会诊"决定不做"的存档已被今天的新事实推翻——支持矩阵已过期（DeepSeek 官方已发布 responses 格式支持；百炼 7 天链为官方实证）。
>
> 本文件为扩展端预案；实施契约以 CLI 侧权威源 `thincoder/docs/design/PROVIDER.md §13` 为准（2026-08-31，同规格不复制）。

---

## 1. 背景：支持矩阵核实（一手源，**2026-08-31 更新**）

| 厂商/端点 | 输入输出格式 | 服务端状态 (`store`+`previous_response_id`) | reasoning 回传 | 内置工具 | 判定 |
|---|---|---|---|---|---|
| **OpenAI 官方** `api.openai.com/v1` | ✅ | ✅（store:true + 30 天） | ✅ encrypted_content（**明文不可回传**） | ✅ 全家桶 | **完整 → 开链** |
| **阿里 Qwen（百炼）** `/compatible-mode/v1/responses` | ✅ | ✅ previous_response_id（**7 天有效**，官方多轮示例；传顶层 response id） | ✅ summary 明文 | ✅ 全家桶（联网/网页抓取/code_interpreter/文搜图/图搜图/知识库） | **完整 → 开链** |
| **智谱 GLM** `open.bigmodel.cn/api/v1` | ✅（Coding Plan 专属，Codex 兼容驱动；quick-start 端点表实证） | ✅ **2026-08-31 真机验证：store:true 链全链路工作**（store:false → HTTP 400 not_found；事件流与官方一致含 reasoning_text.delta） | ✅ | **升级白名单**（store:true 规则与百炼并列）；**搜索/读取 = 官方 MCP 生态**（四件 MCP Server） |  |
| **DeepSeek 官方** `api.deepseek.com` | ✅（官方指南，事件流完整：response.reasoning_text.delta 等） | ❌ **不支持 previous_response_id**（官方兼容性表；不支持参数**静默忽略** = 无声丢上下文） | ✅ 明文 content 归并相邻消息 | 仅 web_search + apply_patch（Codex 专用） | **格式完整、无链 → 全量模式，链禁用** |
| Kimi/Moonshot | ❌ 平台 API 无 responses 端点 | — | — | — | **不接**（同 8-15） |
| 火山方舟（豆包） | ✅（迁移文档存在） | 未核实完整 | 未核实 | 联网插件 | **留位 → 一期不接** |

> GLM 注（承上行内置工具格）：——非 responses 内置工具，GLM 用户接入姿势为 MCP server（我们 MCP 客户端全套加固）。

**2026-08-31 重启理由**（对 8-15 会诊的修正）：

1. 矩阵过期：DeepSeek 官方已发布 responses 格式（2026-08 当月）；阿里云 help 文档明确 7 天链 + 完整事件流。
2. 用户在意的**长会话请求体体积**痛点（9.5MB 会话案例）被 `previous_response_id` 结构性解决——8-15 会诊"收益约等于零"的前提（服务端状态/内置工具/reasoning 三项都是我们不用的）已失效：**链是今天拍板的主要收益点**。
3. 8-15 会诊成本项（续跑循环 format 耦合、双仓库同步债）已确认可控：agent 层零改动（transport 返回既有 shape），turn 内链 + 每 turn 重置把正确性交给了"本地事实源不变"。

## 2. thincoder 要什么（能力映射，2026-08-31 更新）

> 实施契约见 CLI 权威源 `PROVIDER.md §13.2`——本地事实源不变、链仅发送层、store:false、单 turn 链、内置工具一期不用。

我们不需要 Responses 的全部能力——agent 循环、工具执行、历史管理都在本地。真正映射到我们的：

| Responses 能力 | thincoder 用法 | 价值 |
|---|---|---|
| **input/output item 格式** | messages → input items 的双向转换（transport 职责） | 协议接入的基础 |
| **reasoning items 回传** | 思考链跨工具轮保留（DeepSeek 思考模型的 reasoning_content 必须回传同款问题） | 多轮工具调用思考连贯；**我们全量历史回传，天然兼容** |
| **流式事件** | `response.output_text.delta` / `response.reasoning_text.delta` / `response.function_call_arguments.delta` → 现有 onToken/onReasoning | UI 流式不变 |
| **服务端状态** | **不用**——我们本地双行历史（压缩/落档/跨端共享）是核心资产，服务端状态 7 天过期且锁定厂商 | 明确放弃 |
| **内置工具** | 一期不用——我们的工具集（权限门/审计/活动流）是产品本体 | 二期再议（web_search 可选透传） |
| **instructions 字段** | system prompt → instructions（一次性的 system 消息，不进 input） | 与 chat completions 的 system 消息等价映射 |

## 3. 设计

### 3.1 transport 层：`src/provider/transports/responses.mjs`（插件与 CLI 同名同构）

```js
export function normalizeTools(tools) // OpenAI function schema → {type:"function", name, ...} 扁平形态
export function buildRequest(provider, messages, tools) // messages → input items：
  // system 消息 → 不进 input，抽为顶层 instructions
  // user/assistant text → {type:"message", role, content:[{type:"input_text"|"output_text", text}]}
  // assistant tool_calls → {type:"function_call", call_id, name, arguments}
  // tool 结果 → {type:"function_call_output", call_id, output}
  // reasoning_content（历史回传）→ {type:"reasoning", content}（Qwen/GLM 支持；OpenAI 官方端点不回传明文）
  // 顶层：{ model, instructions, input, tools, stream:true, reasoning:{effort}, max_output_tokens, temperature }
export function normalizeUsageCache(u) // usage.input_tokens_details.cached_tokens → 现有 cache 字段
export async function parseStream(response, { onToken, onReasoning, signal }) // SSE 事件流 → 现有回调：
  // response.output_text.delta → onToken(delta)
  // response.reasoning_text.delta → onReasoning(delta)
  // response.function_call_arguments.delta → 聚合（arguments 累积）
  // response.completed → 组装最终 { content, toolCalls, usage }
  // response.incomplete / response.failed → 错误/截断信号
```

**toolCalls 组装**：`output_item.added`（function_call item 开始）建立 call_id → {id, name, args} 槽位，`function_call_arguments.delta` 累积，`output_item.done` 定稿。最终形态与 openai transport 输出一致（`{ id, name, arguments }`），agent 循环零改动。

### 3.2 注册与格式选择

- `TRANSPORTS.responses = responsesTransport`（两仓库 provider.mjs / core.mjs 的 getTransport）
- provider 配置 `format: "responses"`（现有 format 字段的新值，面板 Add provider 表单的下拉加一项）
- **preset 不改**：Qwen/GLM 现有 preset 仍走 chat completions（默认稳态）；想用 responses 的用户显式配 format（高级用法，CLI parity）

### 3.3 续跑/压缩兼容

- agent 循环发给 transport 的是**统一的 messages 数组**，transport 负责 item 化——本地历史（压缩、落档、会话恢复）完全不知道 Responses 存在，零耦合
- ContinueError 续跑：transport 无状态（见 §2 明确放弃服务端状态），每次请求全量 input——与 chat completions 行为一致

### 3.4 GLM coding-plan 的能力探测

GLM 的 responses 端点（`open.bigmodel.cn/api/v1`）格式完整但 store/内置工具未文档化。策略：

- preset `zhipu-plan-responses` 不做；用户自定义 provider 配 `format: "responses"` + coding-plan baseURL 即可用
- transport 不探测不降级——**探测是隐藏决策**，违背显式配置原则；用户配了 responses 就按 responses 走，端点不支持会得到明确的服务端错误

### 3.5 受影响文件（两仓库对称）

| 文件 | 动作 |
|---|---|
| `src/provider/transports/responses.mjs`（插件）/ `src/provider/responses.mjs`（CLI，对齐现有文件布局） | 新增：transport 四函数 |
| `src/provider.mjs`（插件）/ `src/provider/core.mjs`（CLI） | TRANSPORTS 注册 |
| `webview/settings.js` + `locales/*` | Add provider 表单 format 下拉加 "responses" |
| `test/responses-transport.test.mjs` | 新增（见 §5） |

CLI 的 webview 无面板改动（CLI 配置走 config.json 手编，无表单）。

### 3.6 会诊结论与触发信号（2026-08-15，三家一致 → **2026-08-31 触发重启**）

**2026-08-15 不做的理由**（存档）：

- 收益侧空：设计 §2 映射表自己写死了三项差异化能力全被放弃/已有；"Codex 生态接入"是伪需求（thincoder 不是 Codex CLI，不消费 wire_api）；对自管状态和工具的客户端，chat completions 才是跨厂商最大公约数
- 成本侧实：续跑循环的 format 耦合（isOpenAI 分支会向 responses transport 发 partial/prefix 消息，Qwen partialMode 模型必踩）、CLI 端内联分派、双仓库同步债

**2026-08-31 触发信号命中**（§3.6 原信号的等价物）：

- 信号 1（主力厂商 responses-only 能力）：未命中（无厂商弃 chat）
- **信号 3（真实需求）**：用户明确"长会话请求体体积"是真实痛点 + "国产已大量支持"——两项合并为实施决策；DeepSeek/百炼官方文档 2026-08 已更新（8-15 矩阵过期）
- 信号 4（内置工具）：**未命中**——一期仍不用内置工具（工具集是产品本体）

**实施契约**：见 CLI 权威源 `PROVIDER.md §13`（2026-08-31，同规格）。

## 4. 关键决策记录

- **只接完整支持者**（用户拍板）：OpenAI 官方 + Qwen 百炼；DeepSeek（无状态残缺）/ Kimi（无端点）明确不接，理由记录在 §1 矩阵
- **不做（2026-08-15 会诊后用户终裁）**：收益为零成本为实的预案存档 → **2026-08-31 推翻**（矩阵过期 + 长会话体积痛点 + 用户拍板），现按 CLI PROVIDER.md §13 契约实施
- **放弃服务端状态 → 保留为"双轨"**：本地双行历史是核心资产不变；`previous_response_id` 链仅作 turn 内发送层优化（store:false 不托管），跨 turn 重置——8-15 的担忧（依赖服务端 7 天过期）以"链非正确性依赖 + 404 自动回退全量"消解
- **不放弃 reasoning 回传**：明文 reasoning content 进 input（Qwen/GLM 支持），与 DeepSeek chat completions 的 reasoning_content 回传同款语义
- **preset 不动**：默认稳态 chat completions；responses 是显式 opt-in（format 字段）
- **不探测不降级**：显式配置显式失败，隐藏降级违背产品原则

## 5. 测试

| 用例 | 断言 |
|---|---|
| buildRequest 消息转换 | system→instructions；user/assistant→message items；tool_calls→function_call items；tool 结果→function_call_output；reasoning_content→reasoning item |
| buildRequest 工具转换 | OpenAI function schema → 扁平 tools |
| parseStream 文本流 | output_text.delta 序列 → onToken 聚合 |
| parseStream 思考流 | reasoning_text.delta → onReasoning |
| parseStream 工具调用 | added/delta/done 三段事件 → 完整 toolCalls（多工具并行） |
| parseStream 完成/失败 | completed 带 usage；failed 抛错；incomplete 标记截断 |
| 续跑往返 | 上一轮的 function_call item + output 回传后模型能继续（fixture 回放） |
| 注册 | format:"responses" 命中新 transport；未配 format 仍走 openai |
