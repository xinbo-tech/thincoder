# OMP Time Traveling Stream Rules (TTSR) — 完整分析 > 2026-07-29 · 基于 oh-my-pi 代码库分析 ## 核心概念 TTSR（Time Traveling Stream Rules）：规则平时休眠，只在模型输出触发匹配条件时才激活。
正则命中 → 打断流 → 注入规则提醒 → 从断点重试。零上下文开销，违规才付出代价。 ## 完整数据流 ```
Rule markdown 文件 │ (YAML frontmatter: condition, scope, astCondition, interruptMode, globs) ▼
ruleCapability 注册 (9个provider, 按优先级去重) │ ▼
bucketRules() 三分天下: ├─ TTSR 规则 (有 condition/astCondition) → TtsrManager.addRule() ├─ alwaysApply 规则 → 常驻 system prompt └─ rulebook 规则 (有 description) → agent 按需通过 tool 查询
``` --- ## 第一层：规则定义格式 Rule 就是 markdown 文件 + YAML frontmatter： ```yaml
---
description: "Never use any in TypeScript"
condition: ": any|as any" # regex，命中即触发
astCondition: # ast-grep 结构匹配（仅 edit/write 流） - "for $I := 0; $I < $N; $I++ { $$$BODY }"
scope: "tool:edit(*.ts), tool:write(*.ts)" # 限定流范围
globs: ["src/**/*.ts"] # 文件级过滤
interruptMode: never # always | never | prose-only | tool-only
---
# 正文 = 注入时的提醒内容
``` 关键设计：`condition` 支持 PCRE 内联 flag（如 `(?i)`），`scope` 用 `tool:edit(*.ts)` 语法精准限制匹配域。 --- ## 第二层：规则发现与加载 9 个 provider 按优先级扫描多种来源： | 优先级 | 来源 | 路径 |
|--------|------|------|
| 100 | OMP native | `.omp/rules/*.md`, `~/.omp/agent/rules/*` |
| 90 | 插件 | 扩展根目录 `rules/*.md` |
| 80 | Claude Code | `.claude/rules/*.md` |
| 50 | Cursor | `.cursor/rules/*.mdc` |
| 50 | Windsurf | `.windsurf/rules/*.md` |
| 40 | Cline | `.clinerules` |
| 1 | 内置 | 27 个内嵌规则 (Go/Rust/TS 惯例) | 去重策略：按 `rule.name`（文件名），优先级高的赢。 `bucketRules()` 分发逻辑：
1. `disabledRules` 列表中的 → 丢弃
2. 有 `condition` 或 `astCondition` → 注册到 `TtsrManager`
3. `alwaysApply: true` → 直接注入 system prompt
4. 有 `description` → 进 rulebook（agent 通过 tool 查询）
5. 啥都没有 → 丢弃 --- ## 第三层：TtsrManager 运行时匹配 核心引擎，约 400 行。三种匹配路径： | 方法 | 触发条件 | 机制 |
|------|---------|------|
| `checkDelta()` | 每个 text/thinking/tool delta | 追加到隔离 buffer → regex 测试 |
| `checkSnapshot()` | 工具提供 `matcherDigest` | **替换** buffer 为规范化快照 → regex 测试 |
| `checkAstSnapshot()` | 有 astCondition + edit/write 工具流 | 异步 AST 匹配（相同快照跳过） | **匹配前的五道过滤：**
1. 重复策略：`once` 只触发一次；`after-gap` 等 N 轮
2. Scope 过滤：`scope` 限定的 text/thinking/tool:edit(*.ts)
3. 文件 glob：`globs: ["src/**/*.ts"]`
4. 正则条件：`condition` 对累积 buffer 做 test
5. AST 条件：`astCondition` 对代码快照做结构匹配 **流缓冲隔离：** 每个 source + tool 组合有独立的 buffer key：
- `text` → prose 输出缓冲
- `thinking` → 思考内容缓冲
- `tool:write:call_abc123` → 特定工具调用的参数缓冲 --- ## 第四层：AgentSession 事件处理 ```
message_update: ├─ text_delta → TtsrMatchContext { source: "text" } ├─ thinking_delta → TtsrMatchContext { source: "thinking" } └─ toolcall_delta → TtsrMatchContext { source: "tool", toolName, filePaths } │ ▼ checkTtsrStream(delta, matchContext) │ ├─ 工具有 matcherEntries? → checkSnapshot(perFile) ├─ 工具有 matcherDigest? → checkSnapshot(fullDigest) └─ 否则 → checkDelta(rawDelta) │ ▼ handleTtsrMatches() — 两条路径： │ ├─ 中断路径（interruptMode: "always"）: │ 1. #ttsrAbortPending = true │ 2. agent.abort(reason) — 立刻掐断流 │ 3. 50ms 后: │ - contextMode === "discard"? → 删掉部分输出 │ - 渲染 ttsr-interrupt.md 模板 │ - 作为隐藏 custom_message 注入 │ - agent.continue() 重试 │ └─ 非中断路径（interruptMode: "never"）: 如果是 tool-source match: 路由到 perToolTtsrInjections[toolCallId] 工具执行完后，afterToolCall hook 把提醒注入 toolResult
``` --- ## 第五层：注入模板 **中断模板** (`ttsr-interrupt.md`)：
```xml
<system-interrupt reason="rule_violation" rule="{{name}}" path="{{path}}">
Your output was interrupted because it violated a user-defined rule.
You MUST comply with the following instruction:
{{content}}
</system-interrupt>
``` **工具提醒模板** (`ttsr-tool-reminder.md`)：
```xml
<system-reminder reason="rule_violation" rule="{{name}}" path="{{path}}">
A user-defined rule matched this tool call's arguments.
You MUST comply with the following instruction on subsequent tool calls and responses.
{{content}}
</system-reminder>
``` --- ## 第六层：配置体系 ```typescript
interface TtsrSettings { enabled: true, // 全局开关 contextMode: "discard", // discard = 删掉违规输出后重试；keep = 保留 interruptMode: "always", // 全局默认；规则可单独覆盖 repeatMode: "once", // once = 不重复；after-gap = 隔N轮可再触发 repeatGap: 10, // 间隔轮数 builtinRules: true, // 启用内置规则 disabledRules: [], // 按名字禁用
}
``` --- ## OMP 内置的 26 条规则 ### 一个反直觉的发现：全部规则都是"不打断"的 26 个内置规则 **100%** 使用 `interruptMode: never`。没有一条规则会中断流式输出。
全都只是注入提醒。OMP 团队的判断是：写代码时突然掐断太暴力，效果差。 ### 全部规则只在 tool call 上触发 `scope` 全是 `tool:edit(*.go)` 或 `tool:write(*.ts)`，没有靶向模型文本输出的。
因为 TTSR 规则关注代码质量——模型生成文本时说啥都行，但写入文件的那一刻必须符合规范。 ### 规则分类 **场景一：API 迁移提醒（防过时 API）— 10 条** | 规则 | 拦截的坏习惯 |
|------|------------|
| `go-ioutil` | `ioutil.ReadFile` → 已废弃，用 `os.ReadFile` |
| `go-rand-v2` | `math/rand` → 用 `math/rand/v2` |
| `go-exp-promoted` | `golang.org/x/exp/slices` → 进标准库了 |
| `go-add-cleanup` | `runtime.SetFinalizer` → Go 1.24 有 `AddCleanup` |
| `rs-lazylock` | `once_cell::sync::Lazy` → 用标准库 `LazyLock` |
| `rs-future-prelude` | `std::future::Future` → 直接写 `Future` |
| `rs-parking-lot` | `std::sync::Mutex` → OMP 约定用 `parking_lot` |
| `ts-promise-with-resolvers` | `new Promise(...)` 构造器 → `Promise.withResolvers()` |
| `go-new-expr` | `func ptr[T](v T) *T` → Go 1.26 有 `new(expr)` |
| `ts-no-deprecated-leftovers` | 重构后留下 `@deprecated` 标记的函数 | **场景二：代码风格规则（防不地道写法）— 13 条** | 规则 | 拦截的坏习惯 |
|------|------------|
| `go-bench-loop` | `for i := 0; i < b.N; i++` → 用 `for b.Loop()` |
| `go-range-int` | `for i := 0; i < n; i++` → 用 `for i := range n` |
| `go-join-hostport` | `fmt.Sprintf("%s:%d", ...)` → 用 `net.JoinHostPort` |
| `rs-match-ergonomics` | `match x { &Foo(ref v) => ... }` → Rust 2018 match ergonomics |
| `rs-result-type` | `type Result<T> = ...` → 必须带默认错误类型参数 |
| `ts-no-any` | `: any` / `as any` → 用 `unknown` 或具体类型 |
| `ts-no-return-type` | `ReturnType<typeof fn>` → 显式命名类型 |
| `ts-bare-catch` | `catch (e) { /* e unused */ }` → 用 `catch {}` |
| `ts-import-type` | `import("pkg").Type` → 用顶层 `import type` |
| `ts-no-dynamic-import` | `await import("./foo")` → 用静态 import |
| `ts-set-map` | 静态字面量用 `Set`/`Map` → 用 `Record<K,V>` |
| `ts-no-tiny-functions` | 1-2 行函数包裹表达式 → 内联 |
| `ts-no-inline-cast-access` | `(x as { y: T }).y` → 先声明类型别名 | **场景三：硬性禁止 — 3 条** | 规则 | 拦截的坏习惯 |
|------|------------|
| `rs-box-leak` | `Box::leak` → 故意泄漏内存 |
| `ts-no-test-timers` | 测试里用真实 `setTimeout` → 必须用假计时器 |
| `ts-redundant-clear-guard` | `if (timer) clearTimeout(timer)` → `clearTimeout` 对 undefined 安全 | ### 触发机制分布 - **Regex-only**: 20 条（文本模式匹配）
- **AST-only**: 5 条（`go-bench-loop`, `go-new-expr`, `go-range-int`, `ts-no-inline-cast-access`, `ts-redundant-clear-guard`）
- **Both**: 1 条（`ts-no-tiny-functions`） --- ## 与 thincoder 的差距 | 特性 | thincoder (已有) | OMP TTSR |
|------|----------|-----------|
| **流式正则匹配** | ✅ | ✅ |
| **abort + 重试** | ✅ | ✅ |
| **部分输出保留** | ✅ | ✅ |
| **规则文件扫描** | ❌ 只读 config.json | 扫描 `.omp/rules/` 等多来源 |
| **不中断模式 (warn)** | ❌ action 只有 abort | `interruptMode: "never"` |
| **AST 匹配** | ❌ | ast-grep 结构化 |
| **scope 过滤** | ❌ | text/thinking/tool:edit(*.ts) |
| **path glob 过滤** | ❌ | `globs: ["*.ts"]` |
| **重复策略** | ❌ | `once` / `after-gap` |
| **模型条件** | ❌ | `when: { family: "claude" }` |
| **持久化 / 跨轮次** | ❌ | 注入记录写入 session |
| **tool-call 流匹配** | ❌ 明确跳过 | 支持（matcherDigest） |
| **模板化注入** | ❌ 纯文本 | XML 结构化模板 | 最值得抄的、性价比最高的：
1. `warn` 模式（不中断，turn 后注入）
2. 规则文件发现（`.thincoder/rules/` 目录扫描）
3. `<system-interrupt>` 模板（比纯文本更有结构）
4. repeat gating（`once` 防死循环）
