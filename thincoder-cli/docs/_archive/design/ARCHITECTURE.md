# ThinCoder 架构

> 本文件是架构总览（v1 定稿 + 当前态）。详细机制在各板块权威文档（AGENT-LOOP/TOOLS/SESSION/MEMORY/PROVIDER/TUI 等）——本文件保留原则 + 模块地图 + 接口速览 + 指针，不复制各板块正文。
> 文档格式债清理批 A2（2026-09-07）——超详副本降为指针，模块地图核对为当前态。

## 1. 定位与硬约束

- 依据：`docs/requirements/PROJECT.md`（项目需求——需求层）。
- 硬约束：纯 `.mjs` / 无构建步骤 / **Node.js ≥ 24** / **零 npm 依赖**（仅 Node 标准库——`node:sqlite`、`fetch`、裸 ANSI）。

## 2. 设计原则

1. **零依赖**：npm 依赖 = 技术债（质量/安全/版本）；Node 标准库能做的先用标准库。
2. **接口先行**：存储/记忆接口为团队记忆预留扩展位（v2 目标，见 `_archive/ARCHITECTURE-v2.md`）。
3. **可运行验证**：每个里程碑跑通——不交付"写了没跑过"的代码（teamcode 教训）。
4. **准比短重要**：1M 窗口常态，信息完整优先于字数。
5. **代码是问题不是答案**：诊断修复，非朝圣模仿。
6. **面向全球**：提示词英文、TUI/文本英文默认，不做中文限定。

## 3. 模块地图（当前态）

```
bin/thincoder.mjs    CLI 命令分发（repo 根 bin/）
src/
├── agent.mjs            agent 主循环（createAgent/runAgent）——见 AGENT-LOOP.md
├── agent-tools.mjs      元工具注册（task/verify/subagent/advisor 等）
├── agent-tools/         元工具实现（23 文件）
├── tools/               内置工具实现（22 文件，index.mjs 注册 25 工具）——见 TOOLS.md
├── agent/               主循环分段（dispatch/completion/record-results/run-stages/setup 等）
├── advisor.mjs          advisor 评审入口 + repos.mjs（见 ADVISOR-CONVERGENCE.md）
├── context.mjs          上下文压缩（estimateTokens/compressIfNeeded）——见 CONTEXT-COMPACTION.md
├── memory.mjs           三层记忆——见 MEMORY.md
├── session*.mjs         会话存储（session/session-slots/session-gc/rename/migrate）——见 SESSION.md
├── config.mjs           配置加载（loadConfig/saveConfig，PROVIDER_PRESETS）——见 PROVIDER.md
├── proxy.mjs            代理隧道——见 PROXY.md
├── model-specs.mjs      模型能力规格表
├── mcp.mjs              MCP 客户端——见 MCP.md
├── tui.mjs              TUI 入口（startTUI）——见 TUI.md
├── acp.mjs              ACP 协议桥——见 ACP-CLIENT.md
├── consult/…           会诊（见 CONSULTATION.md）
├── distill.mjs          轮末蒸馏
├── hooks.mjs / rules.mjs / skills.mjs / upgrade.mjs / peer-instances.mjs
├── embedding.mjs / token-ttl.mjs / markdown.mjs / escape.mjs / log.mjs
├── crash-reports.mjs / auto-think.mjs / generate-title.mjs / prompt-overlays.mjs
```

## 4. 模块接口速览

| 模块 | 关键导出 | 一句话 | 详细设计 |
|---|---|---|---|
| provider | `createProvider` / `chat()` | LLM 调用层：OpenAI 兼容协议 + reasoning_content/reasoningEcho | `PROVIDER.md` |
| tools | `builtinTools` / `toOpenAISchema` | 25 工具统一 schema + 两段式调度 | `TOOLS.md` |
| agent.mjs | `createAgent` / `runAgent` | 主循环：读→想→写→测 | `AGENT-LOOP.md` |
| context | `estimateTokens` / `compressIfNeeded` | 双结构 history/_fullHistory 压缩 | `CONTEXT-COMPACTION.md` |
| memory | `put` / `search` / `list` / `delete` / `clear` | 三层记忆（personal/project/team） | `MEMORY.md` |
| config | `loadConfig` / `saveConfig` | 配置 + PROVIDER_PRESETS | `PROVIDER.md` |
| session | 槽位模型（认领避让/cwd 归一化） | CLI↔VSC 统一会话存储 | `SESSION.md` |
| tui | `startTUI` | 裸 ANSI 终端 | `TUI.md` |
| mcp | 工具动态展开 | MCP 服务器工具并入 builtinTools | `MCP.md` |
| acp | ACP 桥 | IDE 缓冲/工具调用桥接 | `ACP-CLIENT.md` |
| crash-reports | `prepareCrashReporting` / `writeCrashRecord` / `recentCrashHint` | 崩溃捕获与取证（fatal 报告 / 记录 / stderr 捕获 / 近堆快照） | `CRASH-REPORTS.md` |
| bin/thincoder.mjs | CLI 命令表 | 命令分发入口 | — |

### provider 关键决策（reasoning 语义）

- `reasoning_content` 必须与正文流**分开回调**（不混入正文）。
- thinking 模式协议约束按规格表 `reasoningEcho`：required（DeepSeek/Kimi K3）/ optional（GLM clear_thinking）/ 未声明保守不回传。
- 估算 token 计入 reasoning 字段。

## 5. 跨模块机制（未被板块文档分走的）

- **自律工具注入范围表**（task/plan/goal/verify/subagent 各自主注入范围与 depth 限制——goal/verify 仅顶层、subagent/skill 防递归）。
- **子 agent 权限模型**：explore/plan 强制只读；coder 手动模式权限排队透传父审批 UI + `parent._permQueue` 串行化防审批覆盖。
- **子 agent 报告质量兜底**：<200 字符打回扩写一次。
- 以上机制详版在 AGENT-LOOP.md §7/§18（本文件只留速览级）。

## 6. 未决设计批

- （暂无）

## 变更记录

- 2026-09-11：R25 归宿落定——崩溃捕获与取证板块建档（`requirements/CRASH-REPORTS.md` + `design/CRASH-REPORTS.md`，TUI-OOM-FORENSICS 批）；§4 登记 crash-reports 模块行；§6 未决项清空。
- 2026-08：v1 架构定稿。
- 2026-09-07：R25 立项（异常终止捕获）；文档格式债清理（模块地图核对当前态，超详副本降指针）。
