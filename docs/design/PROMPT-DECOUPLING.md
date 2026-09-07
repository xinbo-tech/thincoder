# 提示词架构解耦：工程模式与普通模式完全独立

> 状态：**已实现**（工程模式顶层 = system.md + engineering.md + METHODOLOGY.md，不注入 main.md/discipline.md）。
> 权威源（CLI）：`src/agent/setup.mjs`（提示词组装 + 降级路径）、`src/prompts/*.md`（提示词文件）。
> 关联：`docs/design/ENGINEERING-MODE.md`（工程模式总设计）、`docs/design/METHODOLOGY.md`（项目方法论）。
> **未决/开放项**：多模态读图引导（见 §4）——2026-09-07 设计，待评审，尚未实现。

## 变更记录

- 2026-08（初）：工程模式顶层提示词与普通模式**完全独立**（setup.mjs overlay 条件 + 降级路径改造；删除 main.md 注入与 discipline fallback）。
- 2026-09-02：搜索工具优先级条款（用户 Q5）——discipline.md / engineering.md 同条款落地，T1/T4 断言锁措辞。
- 2026-09-07：重写为当前态（格式正常化、历史流水账折叠为本记录）。

---

## 1. 问题陈述（为何解耦）

工程模式与普通模式原先是**共享基础 + 补丁覆盖**架构，导致两类问题：

1. **规则互相泄漏**：
   - `main.md`（主代理 overlay）在两种模式下都注入——与工程模式"Designer, not Implementer"角色直接冲突；工程模式靠 engineering.md 里的 override 声明打补丁。
   - `discipline.md`（含 "Calling advisor is mandatory…" 强制条款）在 METHODOLOGY.md 缺失的降级路径下会 fallback 注入工程模式——诱导模型在工程模式下频繁调 advisor（实证：连续 6 次 aborted 仍重试）。
2. **改动互相牵扯**：改 discipline.md 影响普通模式；改 engineering.md 又要为 main.md 的冲突打补丁。一处改动波及两套模式，回归风险高。

## 2. 解决方案：顶层提示词完全独立

工程模式顶层提示词**只与普通模式共享纯通用基础**（system.md）：

| 模式 | 顶层提示词组装 |
|---|---|
| 普通模式 | `system.md + discipline.md + main.md + AGENTS.md` |
| 工程模式 | `system.md + engineering.md + METHODOLOGY.md + AGENTS.md`（**不注入 main.md、不注入 discipline.md**） |
| eng-coder 子代理 | `eng-coder.md + engineering-sub.md + METHODOLOGY.md + AGENTS.md` |

**setup.mjs 实现**：
- 工程模式判定：`(depth === 0 || agent._role === "eng-coder") && agent.config?.agent?.engineering` → `buildEngineeringPrompt` 拼 engineering.md / engineering-sub.md + METHODOLOGY.md。
- `mainOverlay`（main.md）仅在 `depth === 0 && !engineering` 时附加——工程模式顶层不再注入 main.md。
- 普通模式：`disciplineRules` 按 `needsDiscipline`（depth 0 / coder / eng-coder 非工程分支）注入。
- **降级路径（METHODOLOGY.md 缺失）**：`buildEngineeringPrompt` 返回工程模板本身（工程约束仍生效，仅缺项目规则），**不 fallback 到 discipline**；setup 向 history 注入警告（点名后果：三文档硬流程不被强制 + 引用悬空），并把内置模板绝对路径 + 全文随警告带入（模板对模型可达）。

**不变动**：`discipline.md`（普通模式纪律）、`main.md`（普通模式专属）、`system.md`（纯通用基础，两模式共用）、`METHODOLOGY.md`（项目方法论）。

## 3. 搜索工具优先级条款（2026-09-02 变更段——已实现）

**触发**（用户 Q5）：discipline.md 工具表已标 `websearch` = "weak for technical; MCP search tool first"、`glm-websearch_web_search_prime` = "primary when available"——但只是表格罗列、非强制规则。模型可能先跑 websearch（Bing 弱且噪音多），MCP 搜索闲置。教训案例（2026-08-31）：Bing 连续返回无关结果硬抓官方文档 URL 耗七八轮，切 glm-websearch 一发命中——需把该教训提升为正式提示词行为条款。

**设计**：
- **D-P1** 同条款落 **discipline.md（普通模式）与 engineering.md（工程模式）两处**（评审 #5 定死注入面）——规则是工具行为引导，两模式都用工具；eng-coder 子代理走 eng-coder.md + engineering-sub.md，搜索条款随子代理提示词由其上游纪律覆盖，不重复。
- **D-P2** system.md 判定：无 web 搜索指引（仅本地代码探索顺序）——按设计不加行，条款只落 discipline.md / engineering.md。

**落地措辞（英文，两文件逐字一致——T1/T4 断言锁定）**：

> **Check the tool table before any search**: MCP search tools (`*_web_search*` / `*_search_prime` etc.) are PRIMARY for technical verification and general search — `websearch` (Bing) is ONLY the fallback (unavailable: not configured, or its call failed).
>
> **`websearch` returns junk/unrelated results twice in a row → switch immediately** to an MCP search tool or another path — do not fight it. Do not repeat the same query.
>
> **Blocked/unreachable site (docs.claude.com / ai.google.dev etc.) → take a mirror path** (e.g. gh-proxy.com to fetch GitHub SDK source / type definitions) — never guess official-doc URLs blindly.
>
> **Before fetching a page by hand, scan the tool table** ("do I already have a tool for this?") — `fetch` / MCP search before `curl`-style scraping.

**跨端一致性**：两端 prompts 的一致性由既有纪律与测试保障（当前态 = 设计锚 + 评审/审计；早期 byte-identical 硬约束已由 ENGINEERING-MODE.md 取消——本文不承诺字节一致）。

## 4. 未决项：多模态读图引导（2026-09-07 设计——待评审）

> 状态：**设计，待评审**——尚未实现。此节为开放项，非历史。

**问题**：主模型不支持多模态（`specForModel(m).multimodal === false`）时，`provider/normalize.mjs` 的 `stripImagesForTextModel` 把 `image_url` part 替换成 `[image omitted — this model does not support image input]` 占位符。模型看不到图内容，也**无提示告诉它可 spawn 多模态顾问子代理读图**。

读图能力全齐（`subagent spawn` 的 `model` 参数 + `agent.consultModels` 顾问池 + `specForModel().multimodal` 能力字段），但模型无引导——应把该路径变成**确定性行为引导**。

**设计**：
- **D-P1** discipline.md（普通模式）+ engineering.md（工程模式，同搜索条款先例——读图是工具行为引导，两模式都用工具）新增引导。
- **D-P2 引导措辞（英文，两文件逐字一致防漂移）**：

  > When image parts are omitted because the current model does not support multimodal input, spawn a subagent on a multimodal model from the consultant pool to read the image and return a text description.
  > If no multimodal model is available in the consultant pool, state plainly that the image cannot be read.
- **关键决策**：① 只加提示词引导、**不新增工具**（`read_image` 已存在于 discipline.md，是 vision 模型直接读图用——本引导解决 text-only 模型借多模态顾问读图，两路径不重叠）；② **不改 `stripImagesForTextModel`**（省略逻辑本身正确，缺省略后的引导）；③ **不筛/不新增 config**（复用 `consultModels` + `specForModel().multimodal`，模型运行时自行判断）；④ 含降级句（池内无多模态模型时如实说明图读不了）。
- **受影响文件**：`src/prompts/discipline.md`、`src/prompts/engineering.md`、`test/agent.test.mjs`（断言锁措辞）、本文档 §4、CHANGELOG.md。
- **测试（预期）**：T1 discipline.md 含读图引导句；T2 engineering.md 含逐字一致同句；T3 跨端 prompts 一致；T4 既有 prompt 断言回归。

## 5. 受影响文件（实现时点）

| 文件 | 动作 |
|---|---|
| `src/agent/setup.mjs` | 修改（overlay 条件、降级路径、buildEngineeringPrompt） |
| `src/prompts/engineering.md` | 修改（删 override 段、补响应表纪律与评审时机；搜索条款落地） |
| `src/prompts/discipline.md` | 修改（搜索条款落地） |
| `test/agent.test.mjs` | 修改（工程模式 prompt 断言 + 搜索条款 T1/T4 断言） |
| `docs/design/ENGINEERING-MODE.md` | 修改（提示词组装表同步） |
| `docs/design/PROMPT-DECOUPLING.md` | 新建（本文档） |
