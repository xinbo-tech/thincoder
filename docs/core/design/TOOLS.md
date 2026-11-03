# 工具系统（TOOLS）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6）：机制 / 契约的实质描述 · 关键决策——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。
> **核 `agent.mjs` 主循环面已分档**：`agent/run-start.mjs` ∕ `agent/turn-loop.mjs` ∕ `agent/chat-call.mjs`；`agent.mjs` = 105 行编排面。

## 1. 归属与范围

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 工具实现（同路径对） | `thincoder-cli/src/tools/{question,bash,tree,execute,linter,ops,shared,search,lsp,web,file,edit-diff,index}.mjs` | 同名（多为拆档：`shell` / `more-file` / `file-edit` / `edit-fuzzy-match` / `edit-line-params` / `wait_for` 等） |
| 工具描述（提示词面） | — | **运行期面 = 核包 `thincoder-core/tool-docs/*.md`** |
| 注册表 | `src/agent-tools.mjs` + `src/cli/make-agent.mjs` | `thincoder-vscode/src/agent-tools/index.mjs` |
| agent-tools 工具面 | `src/agent-tools/*.mjs` | 同名 / 拆分档 |
| 单端独有实现 | `tools/{bash,checklist-sync,edit-batch,glob-dialect,patch,repomap}.mjs` | `tools/{code,ide,focus,index,shared,shell}.mjs`（`checkpoint` 现体 = 核 `thincoder-core/git/checkpoint.mjs`；`context` → **`ide`** 改名——让出 `context` 名与核新工具） |

> 工具**描述文本**（运行期面 = 核包 `thincoder-core/tool-docs/*.md`）的行本体住 `docs/core/design/PROMPT-SYSTEM.md`（提示词面）；本档只收**实现面**与工具行为契约。

## 2. 核模块裁决行

### 2.2 工具实现与 agent-tools（行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 52 | `thincoder-core/tool-docs/question.md` | 同路径 | 0.8667 · 异 | ② | 进核（`thincoder-core/tool-docs/question.md`） | 融合：取 CLI 措辞 + 无 UI 降级径按端注入（VSC 面板卡片 / QuickPick ＝ ④ 段） | 分叉 ＝ 措辞随两端 UI 形态（CLI 无 UI 抛错 `src/tools/question.mjs:20`；VSC 面板 + 子代理注册期过滤 `thincoder-vscode/src/agent/setup.mjs:196`）；前提（同持有、仅失败形态不同）仍成立（现体 = 面板 `onQuestion` 通道） | — | S1（建核补齐） |
| 53 | `thincoder-core/tool-docs/bash.md` | 同路径 | 0.8485 · 异 | ② | 进核（`thincoder-core/tool-docs/bash.md`） | 融合：取 CLI 文本 + `terminal` 参数段按端注入（VSC 宿主真终端 ＝ ④ 段） | 分叉 ＝ VSC 独有 visible/inject 两模式（`src/tools/shell.mjs:183,191,202`）+ CLI 有 POSIX 前置提示（`src/tools/bash.mjs:34,264-266`）；前提（宿主终端只在 VSC）仍成立 | — | S1（建核补齐） |
| 54 | `thincoder-core/tool-docs/grep.md` | 同路径 | 0.8125 · 异 | ③ | 进核 | 以 CLI 为准（`before`/`after` 上下文随行；错误形态归一为抛错） | 分叉 ＝ CLI 有上下文档（`src/tools/search.mjs:116-118,173-191`）、VSC 无（`src/tools/search.mjs:230-238`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 55 | `thincoder-core/tool-docs/lint.md` | 同路径 | 0.7778 · 异 | ② | 进核 | 融合：取 VSC 措辞（两侧代码实际同输出——CLI `src/tools/linter.mjs:81` / VSC `:85`） | 分叉 ＝ CLI 文档措辞失真（写「✓ no issues」，实为「✓ <checker>: no issues」）；前提 ＝ 无（纯文档订正） | — | S1（建核补齐） |
| 56 | `tools/tree.mjs` | 同路径 | 0.6769 · 异 | ② | 进核（`thincoder-core/tools/tree.mjs`） | 融合：单实现 + cwd 归一开关按端注入（CLI realpath `thincoder-core/tools/shared.mjs:282-290` / VSC join `thincoder-vscode/src/tools/shared.mjs:109-112`） | 分叉 ＝ 根路径 helper 不同（跳过集 / 上限 / 文案 / 排序逐字同构）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 57 | `tools/execute.mjs` | 同路径 | 0.6117 · 异 | ② | 进核 | 融合：单实现 + 树杀能力按端注入（VSC 已有 `killProcessTree` 但本档未用——`thincoder-vscode/src/tools/shared.mjs:129`） | 分叉 ＝ CLI 超时树杀（`src/tools/execute.mjs:65-72,104`）vs VSC 只杀直系子进程（`src/tools/execute.mjs:79`）；前提（两端均有树杀能力）成立 ⇒ 不构成端特有 | — | S1（建核补齐） |
| 58 | `thincoder-core/tool-docs/websearch.md` | 同路径 | 0.5294 · 异 | ③ | 进核 | 以 CLI 为准（RSS 端点 + `engine`/`page` 参数）〔与 `tools/web.mjs` 同一条款〕 | 分叉 ＝ 抓取实现不同（CLI RSS `src/tools/web.mjs:36-40` / VSC Bing HTML `b_algo` `src/tools/web.mjs:64,71`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 59 | `tools/git.mjs` | 同路径 | 0.5253 · 异 | ② | 进核 | 融合：取 CLI + `isReadonlyAction` 审批门按端注入（CLI 无审批面 ＝ ④ 段） | 分叉 ＝ VSC 多只读判定（`src/tools/git.mjs:81-93`）+ 两处文案 / 截断差异（VSC `src/tools/git.mjs:104,214`）；前提（同 action 集）仍成立 | — | S1（建核补齐） |
| 60 | `tools/checklist.mjs` | 同路径 | 0.4973 · 异 | ② | 进核 | 融合：取 CLI（并发门控 + ID 预留含已归档子 ID——`src/tools/checklist.mjs:106-121`） | 分叉 ＝ VSC 内联同套逻辑但 ID 不预留归档子 ID（`src/tools/checklist.mjs:133-143`）、基线判 mtime+size；前提（同职责）仍成立 | — | S1（建核补齐） |
| 61 | `tools/linter.mjs` | 同路径 | 0.4872 · 异 | ② | 进核 | 融合：取 CLI + 可中断执行按端注入（VSC `runInterruptible` ＝ ④ 段） | 分叉 ＝ 执行方式（CLI `execFileSync` `src/tools/linter.mjs:48,64` / VSC `runInterruptible` `src/tools/linter.mjs:53,64-66`）；检查器映射与文案逐字同 | — | S1（建核补齐） |
| 62 | `tools/ops.mjs` | 同路径 | 0.2851 · 异 | ② | 进核 | 融合：`wait_for` 并回单档（VSC 拆到 `wait_for.mjs`——`src/tools/ops.mjs:11-112` / `src/tools/wait_for.mjs:150-190`）（现体 = 核 `thincoder-core/tools/ops.mjs`） | 分叉 ＝ 文件切分（能力不缺——条件字面与限额逐字同）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 63 | `thincoder-core/tools/shared.mjs` | 同路径 | 0.2829 · 异 | ② | 进核（`thincoder-core/tools/shared.mjs`） | 融合：取并集 + VS Code 侧基建（编辑器编辑 / `runInterruptible`）按端注入（④ 段） | 分叉 ＝ 两端各带本端基建（CLI EOL / glob 再导出；VSC 编辑器编辑面 `thincoder-vscode/src/tools/shared.mjs:66-106`）+ cwd 归一差异；前提（同职责）仍成立 | — | S1（建核补齐） |
| 64 | `tools/question.mjs` | 同路径 | 0.1667 · 异 | ② | 进核 | 融合：取 CLI 上限校验 + 无 UI 降级径按端注入（VSC QuickPick / InputBox `src/tools/question.mjs:36-53` ＝ ④ 段） | 分叉 ＝ 无 UI 时形态（CLI 抛错 `src/tools/question.mjs:20`；VSC 降级原生 UI）；上限 100 字符 / 4 选项两端同（裁定）（现体 = 核 `thincoder-core/tools/question.mjs` + 端 `onQuestion` 注入） | — | S1（建核补齐） |
| 65 | `tools/search.mjs` | 同路径 | 0.1455 · 异 | ③ | 进核 | 以 CLI 为准（grep 上下文 + `ls` 归位）+ VSC 的「路径不存在明确报错」并入（取并集） | 分叉 ＝ 导出面切分（CLI 含 `ls` `src/tools/search.mjs:195` / VSC 移 `more-file.mjs:318`）+ glob 指向文件与报错形态差异（CLI 静默 `(no matches)`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 66 | `tools/lsp.mjs` | 同路径 | 0.1429 · 异 | ③ | 进核 | 以 CLI 为准（JSON-RPC over stdio + `lsp.servers` 配置）+ VSC 宿主语言服务径按端注入（④ 段） | 分叉 ＝ 实现路线（CLI 自起服务器 `src/tools/lsp.mjs:97-168` / VSC 调宿主命令 `src/tools/lsp.mjs:76-112`）；前提（VSC 有宿主语言服务、CLI 无）仍成立 | **①③** | S1（建核补齐） |
| 67 | `tools/web.mjs` | 同路径 | 0.1184 · 异 | ③ | 进核 | 以 CLI 为准（RSS + `engine`/`page` + 跟随一次重定向 + 200K + `htmlToText`） | 分叉 ＝ 抓取 / 抓页实现分叉（CLI 跟随重定向 `src/tools/web.mjs:201-215`、上限 200K、正文转换；VSC 拒绝重定向 `src/tools/web.mjs:111-115`、上限 20K `:130`、朴素去标签）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 68 | `tools/file.mjs` | 同路径 | 0.0850 · 异 | ③ | 进核 | 以 CLI 为准（read 体积门 + 截断、写入回执含 diff / 语法检查、`insert_after` 漂移护栏）+ 编辑器编辑径按端注入（④ 段） | 分叉 ＝ 能力面差异（VSC read 无 10MB 门与 200K 截断 `src/tools/file.mjs:34-70`；VSC 写入回执仅一句 `src/tools/file-edit.mjs:305`；VSC `insertAfterTool` 无护栏且未记 `touchedPaths` `src/tools/more-file.mjs:11-24`）（现体 = 核 `thincoder-core/tools/file.mjs`〔护栏/截断随之生效〕）；前提（VSC 有编辑器 API）成立 | **①** | S1（建核补齐） |
| 69 | `tools/edit-diff.mjs` | 同路径 | 0.0395 · 异 | ② | 进核 | 融合：取 CLI 执行体（diff 内核 + 三级匹配）+ VSC 拆分面按核内结构归位；回执形态按端注入（④ 段） | 分叉 ＝ 文件切分（VSC 把校验 / 模糊 / 行号拆到 `file-edit` / `edit-fuzzy-match` / `edit-line-params`）；阈值 0.9 与判定三档同构 | — | S1（建核补齐） |
| 70 | `thincoder-core/tools/index.mjs` | 同路径 | 0.0215 · 异 | ② | 进核 | 融合：完整注册表（VSC 31 工具）+ CLI 侧消费方拼装面归位；`read_image` 注册门取 VSC（按模型能力） | 分叉 ＝ 注册位置（CLI 25 工具子集 + 消费方拼装 `src/cli/make-agent.mjs:64` / VSC 完整表 `src/index.mjs:50-64`）；前提（最终可达集合基本对齐）仍成立 | — | S1（建核补齐） |
| 83 | `agent-tools.mjs` | 同路径 | 0.0000 · 异 | ② | 进核 | 融合：取核内统一登记册（VSC 13 项含 `consult_start/stop` `thincoder-vscode/src/agent-tools/index.mjs:15`；CLI 12 项 + consult 另挂 `thincoder-core/agent/setup.mjs:173,271-275`） | 分叉 ＝ 登记位置与是否多一层转口（CLI 18 行显式列 / VSC 2 行转口）；最终暴露集合一致；前提 ＝ 无 | — | S1（建核补齐） |
| 84 | `batch-segment.mjs` | 同路径 | 0.7530 · 异 | ② | 进核 | 融合：取 CLI 主体 + VSC 的 `_touchedFiles` 记账按端注入（④ 段） | 分叉 ＝ VSC 把写过的批次档计入本轮变更（`batch-segment.mjs`）+ 评审实例绑定解析（CLI `:57-66`）；工具本体一致 | — | S1（建核补齐） |
| 85 | `agent-tools/plan.mjs` | 同路径 | 0.6579 · 异 | ③ | 进核 | 以 VSC 为准（未知 action 报错——CLI 现会误入 plan 模式 `src/agent-tools/plan.mjs:68-79`） | 分叉 ＝ 未知 action 处置（CLI 一律进入并返回 activated / VSC 报错 `:86`）；状态字段名与 `onPlanMode` 回调属结构面 | **①** | S1（建核补齐） |
| 86 | `agent-tools/timer.mjs` | 同路径 | 0.5833 · 异 | ③ | 进核 | 以 CLI 为准（`seconds` 必须为有限正数 `src/agent-tools/timer.mjs:34-37`） | 分叉 ＝ VSC 未同步该修复（`src/agent-tools/timer.mjs:34-35` 直取 `?? 180` ⇒ 非数字时 `expiresAt = NaN`、定时器永不触发且不报错）；前提（该修复只在 CLI 落地）⇒ **直接归一** | **①** | S1（建核补齐） |
| 88 | `agent-tools/skill.mjs` | 同路径 | 0.4746 · 异 | ② | 进核 | 融合：取一侧（异步 loader）+ VSC 的同步 loader 面按核内结构归一 | 分叉 ＝ loader 同步 / 异步与模块路径（CLI `../skills.mjs` / VSC `../extension/skills.mjs`）；发现规则（扁平 + `SKILL.md`、排序、项目层优先）两端同构 | — | S1（建核补齐） |
| 90 | `agent-tools/task.mjs` | 同路径 | 0.3592 · 异 | ③ | 进核 | 以 CLI 为准（空标题过滤 + done 留 3 + 总量 20 `src/agent-tools/task.mjs:66-77`） | 分叉 ＝ 过滤 / 截断规则缺失（VSC `src/agent-tools/task.mjs:60-66`）+ 回话形态（CLI 汇总串 / VSC 逐条列）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 91 | `agent-tools/eng.mjs` | 同路径 | 0.2719 · 异 | ③ | 进核 | 以 CLI 为准（工程模式位只进会话）+ VSC 的面板提示按端注入（④ 段） | 分叉 ＝ VSC 槽写 + 结果尾提示串（`thincoder-vscode/src/agent/setup-tooltable.mjs:85-94`，注释「no config mirror」）；跨端副作用已消除；前提（两端同开关语义）成立 | **①②** | S1（建核补齐） |
| 92 | `agent-tools/digest-budget.mjs` | 同路径 | 0.2268 · 异 | ② | 进核 | 融合：取 CLI（记账键 = agent 对象 + 落盘 `configDir/tool-results` + 轮转清理） | 分叉 ＝ 落盘位置与清理（VSC 落 `<cwd>/.thincoder/tmp` 且无轮转 `src/agent-tools/digest-budget.mjs:53-59`）；预算口径与文案逐字同 | — | S1（建核补齐） |
| 96 | `agent-tools/verify.mjs` | 同路径 | 0.1150 · 异 | ② | 进核 | 融合：取 CLI（git `--stat` 明细 + 无变更仍走清单）+ VSC 的编辑器诊断段与可中断执行按端注入（④ 段） | 分叉 ＝ 信息面与执行方式（VSC 多编辑器诊断 `src/agent-tools/verify.mjs:250-275`、可 Stop 中断）；门禁判定与文案等价 | — | S1（建核补齐） |
| 97 | `agent-tools/goal.mjs` | 同路径 | 0.0992 · 异 | ③ | 进核 | 以 CLI 为准（`blocked` 动作 + `criteria` 强制 + depth-0 独立裁判 `src/agent-tools/goal.mjs:34-115`） | 分叉 ＝ VSC 缺 `blocked` 动作（schema enum 只有 set / complete / cancel `src/agent-tools/goal.mjs:18`）、`criteria` 可省、complete 无独立裁判；前提（同职责）仍成立 | **①③** | S1（建核补齐） |

> **④ 段注入位的核内落点对照**（含本行集 #52–#70 / #84 / #91 / #96 的「核内是否已有位」与 S2 需补形态）→ `CORE-UNIFICATION.md` §2.13.4；编辑 / 可中断执行径的专项结论与**写路径缝**形态建议 → 同档 §2.13.5。本表只留端差处置（不复制）。

### 2.3 语义对位遍行（工具实现面单端档）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 178 | CLI 单端工具实现 **6 档** ↔ VSC 侧对位 | ② | 融合：逐档随其**工具面**（§2.5 #52–#70）的裁决落地 | 分叉 ＝ 实现切分；**B18 反例**：单端独有档之间最高 j 仅 0.256 ⇒ 不据相似度断言，逐档按工具面归属（映射见下表） | — | S1（建核补齐） |
| 179 | VSC 单端工具实现 **12 档** ↔ CLI 侧对位 | ② | 同上（逐档映射见下表；两档归 ④ 端特有段） | 同上 | — | S1（建核补齐） |

**工具实现面单端档逐档映射**

| 单端档 | 对位 / 处置 |
|---|---|
| CLI `tools/bash.mjs` | ↔ VSC `tools/shell.mjs`（同一 `bash` 工具）⇒ 随 §2.5 #53 |
| CLI `tools/checklist-sync.mjs` | 核内并发写同步机（VSC 内联于 `checklist.mjs`）⇒ 随 #60 |
| CLI `tools/edit-batch.mjs` | 核内 edit 数组形态（VSC 住 `edit-line-params.mjs` / `file-edit.mjs`）⇒ 随 #69 |
| CLI `tools/glob-dialect.mjs` | 核内 glob 方言（VSC 住 `search.mjs` / `more-file.mjs`）⇒ 随 #54 / #65 |
| CLI `tools/patch.mjs` | 核内 `apply_patch` / `delete` 实现（VSC 住 `file-edit.mjs`）⇒ 随 #10 / #12（同路径 `.md`） |
| CLI `thincoder-core/tools/repomap.mjs` | ↔ VSC `repomap.mjs`（同一 repo 大纲；VSC 头注自述「Ported from thincoder CLI `thincoder-core/tools/repomap.mjs`」）⇒ 融合 |
| VSC `tools/checkpoint.mjs` | ↔ CLI `git/checkpoint.mjs`（现体 = 核 `thincoder-core/git/checkpoint.mjs`） |
| VSC `thincoder-vscode/src/tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |
| VSC `thincoder-vscode/src/tools/ide.mjs`（**已落**；让出 `context` 名与核新工具） | **④ 端特有段**（IDE 上下文 = 宿主能力；CLI 无 IDE） |
| VSC `tools/edit-fuzzy-match.mjs` · `edit-line-params.mjs` · `file-edit.mjs` · `more-file.mjs` · `hashline-edit.mjs` | 核内 edit / read / insert 实现切分 ⇒ 随 #68 / #69（现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs, patch.mjs, search.mjs}`） |
| VSC `tools/focus.mjs` | **④ 端特有段**（驱动编辑器光标 = 宿主能力） |
| VSC `tools/read_image.mjs`（现体 = 核 `thincoder-core/tools/file.mjs`） | 核内 `read_image` 实现（CLI 住 `tools/file.mjs`；描述文本 = `thincoder-core/tool-docs/read_image.md` = #26） |
| VSC `tools/shell.mjs` | ↔ CLI `tools/bash.mjs`（同首行） |
| VSC `tools/wait_for.mjs`（现体 = 核 `thincoder-core/tools/ops.mjs`） | 核内 `wait_for`（CLI 并回 `tools/ops.mjs`）⇒ 随 #62 |

> **归属提示**：表中 checkpoint / code 两行（VSC 侧单端档对位行）的裁决分别住 `docs/core/design/CHECKPOINT.md` / `docs/core/design/MEMORY.md`（本表 = 该映射表的权威副本，两行仅作指针）。

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A6 | `agent-tools/eng.mjs`（#91） | ①② | 工程模式位只进会话（`cmd-eng.mjs` 自述 `(session)`） | 槽写 + 结果尾提示串（`thincoder-vscode/src/agent/setup-tooltable.mjs:85-94`） | 以 CLI 为准（只进会话）+ VSC 的面板提示按端注入 | ① **跨端副作用**：在 VSC 开一次工程模式不改变 CLI 下次启动的模式 | **已裁 · 按建议** |
| A8 | `tools/web.mjs` + `thincoder-core/tool-docs/websearch.md`（#67 / #58） | ①② | RSS 端点 + `engine` / `page` 参数；fetch **跟随一次重定向**、上限 200K、正文转换 + SPA / 屏蔽提示 | Bing HTML 抓取、无翻页；fetch **拒绝跟随重定向**（`src/tools/web.mjs:111-115`）、上限 **20K**、朴素去标签 | 以 CLI 为准（RSS + 翻页 + 跟随重定向 + 200K + `htmlToText`） | ① 一大批会重定向的正常网址，VSC 现在抓不到 ⇒ 归一后可抓；② 抓回的正文长度（20K → 200K）与可读性变化；③ 工具参数面变化（VSC 侧多出 `engine` / `page`） | **已裁 · 按建议** |
| A9 | `tools/lsp.mjs`（#66） | ①③ | 自实现 JSON-RPC over stdio，按 `config.lsp.servers` **懒启动**语言服务器；未配置则回引导语 | 直接用 VS Code 语言服务命令（`:76-112`），**开箱即用**、不读配置 | 以 CLI 为准（核内实现）+ VSC 宿主语言服务径按端注入 | ① 归一后 CLI 侧仍需配置才能用（不变）；② VSC 侧是否继续用编辑器已装的语言服务（若改走核内实现，则须自行配置） | **已裁 · 按建议** |
| A10 | `tools/file.mjs`（#68） | ① | read 有 10MB 体积门 + 200K 截断；写入回执含 git diff + `Syntax: OK/FAILED` + 写入点上下文；`insert_after` 有「读取后才准插 / 行号漂移即拒」护栏 | read 无体积门与截断（`:34-70`）；写入回执只一句「Wrote / Replaced / Inserted」（`file-edit.mjs:305`）；`insert_after` 无护栏、且插入的文件不进 `touchedFiles`（`more-file.mjs:11-24`） | 以 CLI 为准（体积门 + 截断 + 回执 + 护栏）+ 编辑器编辑径按端注入 | ① VSC 读超大文件从此会被截断（并给出提示）；② VSC 写入 / 编辑后模型开始看到 diff 与语法检查结果；③ VSC 的 `insert_after` 会拒绝漂移行号 | **已裁 · 按建议** |
| A11 | `tools/grep.md` + `tools/search.mjs`（#54 / #65） | ① | grep 支持 `before` / `after` 上下文档（`search.mjs:116-118`）；含 `ls`；非法正则 / glob 抛错 | grep 无上下文档（`:230-238`）；`ls` 在 `more-file.mjs:318`；错误一律返回字符串；glob 指向文件可直配、路径不存在明确报错 | 以 CLI 为准（上下文 + `ls` 归位）+ VSC 的「路径不存在明确报错」并入 | ① VSC 的 grep 从此可带上下文（少一次额外 read 回合）；② 找不到路径时的回话形态变化（静默 `(no matches)` → 明确报错） | **已裁 · 按建议** |
| A12 | `thincoder-core/agent-tools/goal.mjs`（#97） | ①③ | 四动作（set / complete / blocked / cancel）；`criteria` 强制；complete 过「改过文件未 verify」门 + depth-0 **独立裁判**；blocked 需同一理由连续 3 次 | 三动作（**无 `blocked`**，模型调用会因 enum 直接失败 `:18`）；`criteria` 可省（缺省填 `manual verification`）；complete 只有 verify 门、无独立裁判 | 以 CLI 为准（四动作 + criteria 强制 + 独立裁判） | ① VSC 丢失「卡住要连续 3 次才认账」与「完成要过独立裁判」两道承诺 ⇒ 归一后恢复；② 模型在 VSC 可用的 `goal` 动作集变大 | **已裁 · 按建议** |
| A13 | `agent-tools/task.mjs`（#90） | ① | 空标题丢弃、done 只留最近 3 条、总量截到 20（`:66-77`） | 不过滤、不截断（`:60-66`） | 以 CLI 为准（过滤 + 截断） | ① VSC 面板里会少掉空标题行、历史 done 项与超量条目（长清单从此瘦身） | **已裁 · 按建议** |

### 3.2 乙组（方向只有一种）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| B1 | `agent-tools/timer.mjs`（#86） | ① | `seconds` 非有限正数 ⇒ **当场报错**（`:34-37`） | 直取 `?? 180`（`:34-35`）⇒ 传成 `"30s"` 时 `expiresAt = NaN`，**定时器永不触发且不报错** | 以 CLI 为准（补校验）——前提失效型（该修复只在 CLI 落地，非有意端差） | ① VSC 里传错秒数由「静默失效」变「报错」——只有一种合理做法（修 bug） | **已裁 · 按建议** |
| B2 | `agent-tools/plan.mjs`（#85） | ① | 未知 `action` 也进入 plan 模式并返回 `activated`（`:68-79`）⇒ 会话可能被误锁成只读 | 未知 `action` 返回 Error（`:86`） | 以 VSC 为准（未知 action 报错） | ① CLI 里模型传垃圾 action 时由「突然只能读不能写」变「报错」——只有一种合理做法 | **已裁 · 按建议** |

## 4. 对外契约影响

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 5 | `tools/web` fetch 上限（20K → 200K）与重定向策略 · `websearch` 参数面（+`engine` / `page`） | 输出（工具可见面） | 取 CLI | 登记 + CHANGELOG（输出上限 / 截断标记变更） | `TOOLS.md` 同步 + VSC 用例 | 已裁 · 按建议（§2.5.1 A8） |
| 6 | `tools/lsp` 是否需先配 `lsp.servers`（CLI）· VSC 宿主语言服务径 | 输出 / 命令面（工具可用性） | 取 CLI + 端差注入 | 登记（配置面文档同步——README 配置节） | LSP 面文档 + 用例 | 已裁 · 按建议（§2.5.1 A9） |
| 7 | `tools/file` 写入回执的信息面（diff / `Syntax:` / 上下文窗）· read 截断标记 | 输出（模型可见回执） | 取 CLI | 登记（信息面变更——无兼容破坏） | `EDIT.md` / `TOOLS.md` 同步 + 用例 | 已裁 · 按建议（§2.5.1 A10） |

## 6. 机制面

> **本节内容**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据。
> **坐标口径**：本节路径一律按**现状路径**落笔（`thincoder-core/tools/**` · `thincoder-core/agent-tools/**`）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 总览与统一契约

工具系统是 agent 与外部世界（文件 / 命令 / 网络 / git / MCP / 项目状态）交互的**唯一通道**：

- **能做什么**：以统一 OpenAI function-calling schema 暴露给模型（`toOpenAISchema`，住 `thincoder-core/tools/shared.mjs`）；
- **怎么安全做**：收口到工具内部——安全哲学 = **信任模型 + 审批门控 + 快照**（非文本拦截）；
- **何时做**：调度层两段式（只读并行、副作用串行）。

**工具分类**：内置工具（`builtinTools`）+ 元工具（agent-tools，纪律工具）+ MCP 展开工具（动态并入）。

**统一契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。execute 必须返回字符串（undefined 视为错误，dispatch 显式检查）。

### 6.2 注册与 schema

- **内置工具**（`thincoder-core/tools/index.mjs` `builtinTools`）：file 6（read / write / edit / insert_after / hashline_edit / read_image）· patch 2（apply_patch / delete）· system 4（bash / glob / grep / ls）· web 2（websearch / fetch）· git 2（git / question）· 
其余 lint / lsp / execute / tree / browser / ops 4（file_ops / process / get_current_time / wait_for）。
- **元工具**（`thincoder-core/agent-tools.mjs`）：task / plan / goal / verify / batch / subagent / skill / recent_changes / advisor / eng / timer / read_history / context / consult_start / consult_stop / notify_parent / manifest / doc_check——readonly 自管纪律工具；台账统一入口 `ledger`（`thincoder-core/ledger.mjs`）。
- 子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）；`context`（主动整理上下文 · 单工具三操作 · depth-0 段——形态与机制权威 = 本层 `CONTEXT-COMPACTION.md` §6.16）。
- `read_history` 语义权威 = SESSION 板（本层 `SESSION.md`）。
- **schema 生成**：`toOpenAISchema(tool)`——name / description / parameters 转 OpenAI function 格式。description 来源：两端均用 `thincoder-core/tool-docs/*.md`（`DESC()` 机制——md 文件即描述源；VSC 经核 `loadToolDoc`、`toOpenAISchema` 调用期过锚替换原语）。md 描述给模型**完整使用手册**（含参数说明 / 路由 / 反模式），非一行字符串。
- **bash 执行器身份**：bash 工具描述面含运行时执行器声明行（Executor line）——探测与声明单源 = 本层 `BASH-EXECUTOR-FACE.md`（机制 · 值面 · 三端注入）——指针不复制。

### 6.3 上下文与生命周期

- **ctx 字段**：cwd / agent / depth / signal / callbacks / onOutput / onQuestion / onPermissionRequest。
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚；快照为全量副本（检查点面权威 = 本层 `CHECKPOINT.md`）。
- **hooks**：PreToolUse / PostToolUse / PostToolUseFailure / Stop 四事件用户脚本——配置位 = `~/.thincoder/config.json` 的 `hooks` 键（`{ matcher?, command, args?, timeout?, action? }`，action = allow/block/notify）；`action: "block"` 时按**退出码**定夺（0 = 放行、非 0 = 阻断）。
  - **载荷不脱敏（已定）**：`PostToolUse` ∥ `PostToolUseFailure` 的 stdin JSON 携 `result`（原始返回值）与 `toolArgs`——载荷含工具结果全文；日志面的 `SECRET_FORM` 剥离（形态扫描常量 = `thincoder-core/log.mjs:43`；脱敏函数 `redactSecret` = 同档 `:149-180`）不覆盖该面。配置第三方 hook 前须自行确认它会怎样处理这段正文。
  - **为什么不脱敏**：hook 与用户自跑脚本同权——可执行、可读任意文件，脱敏防的是「自己配的程序偷自己」，不是威胁模型；且脱敏只能靠日志面那套形态匹配，**漏一种形态就是假安全，而假安全比没有更坏**（安全纪律⑤：自加的安全机制默认不立）。
  - **先例 ∥ 勘察**：先例 = 日志面脱敏口径（上条）∥ 本档 §6.4 hooks 行同格披露；勘察 = 查过 `thincoder-core/log.mjs` 脱敏面与 `~/.thincoder/config.json` 的 `hooks` 配置位，无既有「hook 载荷分级」面；公共源 = `PROJECT-MANIFEST.json:36` 的 `index.publicRepos` 为空，已查无相关。
- **dispatch console 回显**：工具执行期间的 console 输出回显到结果（调试价值）——调度细节权威 = AGENT-LOOP 板（本层 `AGENT-LOOP.md`）。

### 6.4 安全边界

安全哲学：**信任模型 + 审批门控 + 快照为真实防线**；文本匹配拦截被否定（「安全剧场」——恶意模型必然绕过，拦住的多是正常操作）。

| 面 | 当前机制 |
|---|---|
| 路径 | **无边界解析**：相对路径相对 cwd 解析、绝对路径原样解析、符号链接正常跟随；**无目录限制**。信任模型 + 权限门禁为唯一防线 |
| 命令 | **零文本拦截（彻底）**：破坏性命令（rm -rf 等）一律放行，走审批 + 快照。保留 `detectDanger` 危险标注（只给人看红标，不拦截）；bash 同步缺省 120s ∥ 异步缺省无超时（→ §6.19） |
| 网络 | `isPrivateHost`（localhost / 内网 / 云元数据 `169.254.169.254`）SSRF 防护；响应体 ≤ 5MB；HTML 转文本（`stripTags` / `htmlToText`） |
| 文件 | `MAX_READ_LINES = 2000` / `MAX_OUTPUT_CHARS = 200_000`（超限落盘，模型见预览）；`normalizeEOL`（CRLF 统一）；write 前 `autoSyntaxCheck`（JS 文件自动 `node --check`） |
| lint | `node --check` fast path + 语言级联（tsc / ruff / cargo / go vet）；`scripts/check-syntax.mjs` 替代 eslint 级联（零依赖） |
| lsp | 按需 spawn LSP server（`config.lsp.servers` 的 `command` 直跑，无 shell——`thincoder-core/tools/lsp.mjs:148`），语义级诊断 / 跳转兜底 |
| hooks | 用户脚本与 agent 同权（可读任意文件）：载荷含工具结果全文（`result` ∥ `toolArgs`），`SECRET_FORM` 剥离不覆盖 hook stdin（机制与披露句 = §6.3 hooks 行）；**不做载荷脱敏**（口径 = §6.3 hooks 行） |

**execute 边界**：纯净 node ESM 子进程，与 bash 同边界——顶层 await / 动态 `import()` / `require()` / `console` / `fetch` / `process` 全可用；**无 import 阻断、无 require 禁、无目录限制、无伪沙箱、无预置全局**。文件能力唯一入口 = 专用工具。超时 SIGKILL 强杀（默认 30s，上限 600s）。

子进程 = **本宿主运行时的 node 语义**——Electron 宿主补 `ELECTRON_RUN_AS_NODE`（单点与消费面 = §6.18）。

### 6.5 调度与权限（标记语义）

调度两段式详情权威 = AGENT-LOOP 板，此处只列**工具标记语义**：

- `readonly` = 无副作用、可并行；
- `parallel: true` = 显式声明可并行（grep / glob）；
- `sideEffectExempt` = 有副作用但豁免于「失效 advisor / verify」追踪（subagent）；
- **审批门控**：破坏性动作（delete / 外发 / 快照类）走 `onPermissionRequest`（autoApprove 短路 / 批量确认）。

### 6.6 编辑工具语义（地图——每工具权威档分拆）

> 定位句 + 契约要点集中在此；逐工具详细正文住各自权威档（不并入）。

| 工具 | 定位 |
|---|---|
| **edit** | 精确区域替换（主）——两种定位形态（行号 / 内容）+ 三级匹配 + 替换即删 |
| **insert_after** | 已知行后插入新行（纯插入——不必编造上下文） |
| **hashline_edit** | 按内容哈希寻址（位置无关——行号漂移免疫） |
| **apply_patch** | 统一 diff 应用到一或多文件（整块 / 新建 / 跨文件） |
| **write** | 整文件替换 / 新建（含父目录） |

**契约要点**：edit——`line: N` / `startLine–endLine` 行号形态（互斥 `old_string`）或 `old_string` 内容形态；三级匹配（逐字→空白窗口→模糊 ≥ 90%）；零重叠替换即删；空 `new_string` 显式错（防静默删除）；edits 数组批（原子）。

insert_after——`after_line` / `after_regex`（须唯一）+ read-before-insert 护栏（受影区拒绝）。hashline_edit——`old_hashes`（read hashes=true 取）+ `new_content`（空 = 删块——命名删行路径）；U+FFFD 警告。
apply_patch——无坐标 hunk 宽容 + 文件头容缺；多文件原子。write——整文件替换（read 先）；EOL 覆盖按原行尾 / 新建随目录多数派。

**路由**：edit 精确改 / insert_after 加行 / hashline 位置无关 / apply_patch 整块多文件 / write 整文件。共享 helper（EOL / 候选 / U+FFFD）权威 = 编辑辅助面；read 是读工具（非编辑）。

**行号锚**：edit 行号形与 insert_after 的 `after_line` 同一道记账面护栏（拒在受影响区；拒文带漂移量与两条下一步）——判据与批量帧权威 = `docs/core/design/EDIT-HELPERS.md` §7，本段只给定位；机面落点 = §6.26。

### 6.7 逐工具契约（要旨）

- **git**：action 集含 add / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick + clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv。破坏性动作（reset --hard / checkout 丢改动 / rm / clean / rebase 有未提交时）
**先快照再执行 + 确认**，从不拦截（`gitGuardSnapshot`）；status 用 `runGitRaw` 保行前导空格（防 porcelain 误分类）。
- **execute**：`code`（inline ESM）与 `scriptFile` 二选一必填；`nodeArgs` 禁 `--eval` / `--inspect` 类；scriptFile 可指向 workspace 外；超时默认 30s / 上限 600s。
- **glob**：`{a,b}` brace 展开；`!` 排除前缀；不支持语法（`?(x)` / `@(a|b)` / `+(x)` / 空 / 未闭合 brace）**显式报错**（不静默漏匹配）。
- **wait_for**：条件等待（非 sleep）——条件语义化（advisor settled / subagent id:N done / consult done / `bash id:N done` / `browser id:N done` / file exists / port open）；未知条件显式报错；timeout 默认 30s（config 可覆盖，cap 600s）；
interval 默认 1s 下限 100ms。**`advisor settled` 判据** = 后台评审池真实态（无 running / queued 评审）——该判据读子代理池的 advisor 条目（该池永无此类条目）⇒ **恒真 0ms 秒过**（用户实证）。机制面细则归 AGENT-LOOP 板。
- **timer**：四式 = 一次性倒计时（默认 180s · `seconds` 有限正数）∥ 绝对时刻（`at` = `YYYY-MM-DDTHH:MM[:SS]` 本地 · 过时点即时）∥ 固定间隔（`every` 秒 · 下限 60s · 首投 = 设时 + N）∥ 日历式（`daily` = `HH:MM` 本地 · 每日该刻）；
  另二动作 = `cancel`（按 id）∥ `list`（只读）；`seconds` ∥ `at` ∥ `every` ∥ `daily` 至多一（互斥违例显式拒）。在途 ≤ 8（超限显式拒——周期项占坑：1 条 1 坑、到点重排净零）；

  到期语义 = 在途跨 run 存活 + 到点自唤醒（空闲 / 挂起窗）——**支持面 = CLI / VSC / 桌面三端前台（headless 结构性不支持）**，逐格定义 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.5；四式机制 = 同档 §6.30.18（开关 `agent.timerWake` 默认开；端面接线 = §6.30.11）。
- **task**：状态别名归一（completed / finished / …）+ warning；跨会话 / 项目级用**台账**（`/ledger`——描述含路由）。
- **verify**：通用验证门禁——语言 / 框架 / 项目无关，不自动跑任何测试命令；模型经 `verification:{status:"passed"|"failed"|"skipped", command?, summary?}` 声明验证状态（passed 放行 / failed 打回 / skipped 放行但须 summary 理由）；参数面 = `workdir`。
- **read_image**：视觉模型读图；非视觉模型拒绝 / 占位（防 image_url 毒化会话）；svg 返回文本源码、bmp 拒绝并提示转 PNG。
- **websearch / fetch**：网络边界见 §6.4；后端优先级（DeepSeek → Tavily → Bing ∥ 本地直取）见 §6.23；fetch 失败错误含 proxy 提示。
- **browser**：自启系统 Edge/Chrome（独立 profile——`~/.thincoder/browser/profile`）+ CDP 直控（Node 原生 WebSocket——零第三方依赖）；十六动作 navigate/snapshot/click/type/evaluate/wait/screenshot/close + press/hover/wheel/mouse/drag/touch/insert/clipboard（CDP Input 真输入域 + 剪贴板保真读写）。
  snapshot 回执 = 可交互元素清单 + 稳定引用（`e<N>`）+ 几何（视口外 `[outside]` 标记；ref 寻址动作前自动滚动到视）；click/type 按引用寻址；过审批门 = click/evaluate + press/mouse/drag/touch 点按 + clipboard 全量（`isReadonlyAction` 动作级分类——其余免审；分类不随 `async` 变）。

  **硬预算**（每动作超时必返——错误句携卡点步名）；**会话不假定常驻**（外部关闭 ⇒ 在飞即时显式失败 + 下一次自愈重开）；**异步通道** `async:true`（ack `browser#<id>` + 结算摘要；`wait_for "browser id:N done"` ∥ `process` kill）。设计权威 = `BROWSER-TOOL.md`（本层）。
- **process / file_ops / get_current_time / tree / lsp / lint / delete / bash**：按各自描述契约。
 - **batch**：批次档生命周期（action = create ∕ append ∕ edit ∕ status ∕ close；**无路径参数**——目标档 = spawn 绑定；身份定可写段）；**段内一个写面**——作者可 `append` 加内容、可就地 `edit` 自己那一段（`edit` 段域 = 同模式 `append` 白名单——一张表两动作；行级独占只留 `**状态行**：`，`status` 是它唯一的写者）；写前剔凭证；工具盖轮次戳（仅 §3）；fail-closed 逐条 throw。权威 = 工程模式板。
- **manifest**：project-manifest 全键读写出口（三动作 `read` / `init` / `write`——点改 ∥ 全键族白名单 ∥ depth-0 两模式同挂）；机制 = `docs/core/design/MANIFEST.md` §2.10。
- **doc_check**：文档纪律机检（只读 · 报告态 · 非门禁——不阻断、不置退出码）——判据两条（锚 = 文档指针可解析 ∥ 行宽 = 单行 > 阈值）；判据参数依据 `PROJECT-MANIFEST.json` `checkConfig`；参数 = `target`（可选）。机制 = `docs/core/design/DOC-DISCIPLINE.md` §3.20。
- **notify_parent**：子代理上行通道（`kind` = ask / note；非阻塞；父侧队列 ≤20 条 ∥ 单条 ≤1,500 字符）；depth>0 段装配（consult 段除外）。
- **ledger**：台账统一入口（`action` = add / update / close 写仅主 agent ∥ query / count 只读全角色）；随核家族段装配（`thincoder-core/ledger.mjs`——全量变体 depth-0 ∥ 读二变体 depth>0）。

### 6.8 MCP（动态展开）

MCP 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 `inputSchema`、execute → `tools/call`），并入 `builtinTools` 走统一 schema；**网关式 `mcp` 工具已废弃**。机制权威 = MCP 板（本层 `MCP.md`）。

### 6.9 工具描述写作六要素

工具描述（md / 内嵌）必含六要素，缺一补一：① 一句话语义（能做什么 / 不能做什么）；② 参数关系；③ 路由 / 反模式（何时用别的工具、何时不该用本工具）；④ 副作用与权限（破坏性 / 外发 / 需确认标注）；⑤ 错误形态（失败时返回什么、如何引导）；⑥ 多端一致（CLI / VS Code 描述同语义）。

描述面机制与预算（外置单源 ∥ 基线 / 当前读数 / 目标状态 ∥ 单档帽 ∥ 机检 `scripts/tool-schema-size.mjs`）→ `PROMPT-SYSTEM.md` §6.11——**预算表唯一权威处**（本档不复制 · D2）。

### 6.10 `websearch` 配置面——`provider` 死键处置

- **选定方案 = 移除死键**（声明 + 文档 + 两端写入面）：**零行为变更**（无读取点删除；遗留值照旧被忽略）；删 1 行 + 文档同步 + VSC 面清理——不触碰搜索语义 / 兜底链；`provider` 名保留为未来干净槽位。
- **读取面（单点）**：`config.websearch.apiKey` → agent.config → `thincoder-core/tools/web.mjs` 触发 Tavily；无 key / Tavily 失败 → Bing 兜底。后端优先级（DeepSeek 自动探测插在链头）见 §6.23——本句不展开。
- **遗留值语义**：磁盘 `websearch.provider` 原样保留（零读取 / 零校验 / 零写回）；`settings` 工具类型表自动派生自 DEFAULTS——键移除即脱表（**未知键原样** = 既有通用语义，零特判）。
- **关键决策**：D-1 选型 = 移除 · D-2 不做遗留值剥离 / 迁移 / 写回（剥离需动启动路径，收益仅内存洁癖）· D-3 不加校验 / 特判 · D-4 VSC 面同批收口（CLI 删、VSC 继续播种 = 假收口）· D-5 未来衔接（DeepSeek 端点以完整信息设计选择面 ⇒ 已落 §6.23）· D-6 工具描述文本零改。**UI / 交互决策：无**（config 键处置；VSC 面板 provider 从未渲染；CLI TUI 无 websearch provider 入口）——**无 open 项**。

### 6.11 VSC 端适配增强

VS Code 端在 extension host 内运行的**端独有增强**（CLI 无对应面——端差登记，不归核）：

- **编辑器路径**：write / edit 对已打开文档经 **WorkspaceEdit** 应用（undo 集成）后立即保存（`getOpenDoc` / `applyEditorEdit`——接收档 = 拆壳薄壳 `thincoder-vscode/src/tools/shared.mjs`）；
  `getOpenDoc` win32 盘符大小写归一（防 split-brain）。**接线**：工具面写点全经核写路径缝（`configureWritePath`——`thincoder-core/tools/write-path.mjs`）执行端侧注入（脏缓冲拒写在核侧门禁）；
  现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs, patch.mjs}`；

  range 偏移（`lfOffsetToRaw`）现体 = 核全文写回，细则 = `docs/core/design/EDIT-HELPERS.md` §6。
- **lsp（VS Code 原生）**：语言服务直用（`executeDefinitionProvider` 等 + `languages.getDiagnostics`）——零自起进程（对端 CLI = 按需 spawn LSP server，§6.4）。**接线**：经 `configureLspHost` 注入（桥住 `thincoder-vscode/src/tools/index.mjs`；核内默认径 = JSON-RPC）。
- **bash**：继承宿主 shell 环境；`runInterruptible` spawn（非 execSync——不阻塞 extension host 事件循环）+ Stop / 超时经 `killProcessTree` 整树杀（`/T /F` 达孙进程）。
  **接线**：`configureExecRun`（可中断执行器——linter / verify 等核内执行面）与 `configureProcessTreeKill`（树杀）、`configureTreeResolve`（`tree` 工具 cwd 归一）均以拆壳薄壳 `thincoder-vscode/src/tools/shared.mjs` 为接收档注入。
- **权限审批面**：webview 逐工具弹窗 + 批合并询问（`permission-gate.mjs` / `batchPermissionGate`）+ 逐项 diff 预览；子代理（depth>0）审批卡（归属 `<child key> · <tool>`——`makeChildPermission`）+ Stop 释放挂起门
  （abort → resolve(false)/deny，循环不悬挂——接线 = `docs/core/design/AGENT-LOOP.md` §6.18）。**端增量**：git 工具动作级只读分类（`isReadonlyAction`）住 VSC 装配面 `thincoder-vscode/src/tools/index.mjs`（核 git 工具无此概念）；
  审批层还消费 `configureGitApproval` / `configureEditReceipt` 缝（按缺省不覆盖——端审批在工具执行前）。
- **描述装载面**：两端同源 = 核包 `tool-docs/*.md`（`DESC()` = 核 `loadToolDoc` 单一解析面；锚替换调用期应用）；50 档随包发布（`.vscodeignore` 不排除 `node_modules/@thincoder/core/**`——打包面 N6 需求侧承载）。
- **工具面接线**：① **派发面 hooks 三调用点**（核 `thincoder-core/agent/dispatch.mjs` PreToolUse〔可阻断——阻断结果逐字同核 `:337-338`〕· `thincoder-core/agent/dispatch-run.mjs` PostToolUse ∕ PostToolUseFailure；机制 = `AGENT-LOOP.md` §6.13 / §6.18）；
  ② **台账工具面随核家族段装配**（统一入口 `ledger`——读二 `action=query` / `action=count` 随核 `assembleFamilyTools` 到达 ⇒ 模型面 + 子代装配面同核口径；写三 `action=add` / `action=update` / `action=close` 随核家族段在端可达）。

### 6.12 git 工具读面 fail-closed

**修法（读面 fail-closed 单点）**：

| # | 落点 | 改后 |
|---|---|---|
| 1 | `thincoder-core/tools/shared.mjs:442-455`（`runGit`） | 非零退出 / spawn 失败 ⇒ **throw**（消息 = `git <args…> failed:` + stderr 首行 + ` (cwd: <绝对 cwd>)`）；maxBuffer 溢出保持现状（部分输出 + 提示） |
| 2 | `thincoder-core/tools/git.mjs:15-21`（`runGitRaw`） | 同款（溢出取 `e.stdout` 部分输出；其余 ⇒ throw） |
| 3 | **stderr 捕获**（`shared.mjs:444` · `git.mjs:17` 两处） | `stdio: ["ignore","pipe","ignore"]` → `["ignore","pipe","pipe"]`——不捕获则无 stderr 首行可入消息（现契约不可产出 A7 消息）。**spawn 失败回退形态**（`git` 不可执行 ⇒ `e.stderr` 空）：消息取 `e.message` 首行（如 `spawnSync git ENOENT`）——**禁空尾**（不得以 `failed:` 结尾无因由） |
| 4 | 非仓失败附加指引（**认定谓词**） | 谓词 = 退出码 128 ∧ stderr 首行含 `not a git repository` ⇒ 消息尾附 ` — pass workdir to run git inside a repository`；**其它失败不附**（unborn / bad revision / 网络——防误指，见下 unborn 表） |
| 5 | 十处读动作调用点（`git.mjs` / `git-ext.mjs`） | **零改**——`|| "(no changes)"` 类兜底只在**真·空输出成功**（exit 0）时生效 |

**为何 throw（而非返回错误串）**：① 同档同族先例 = `git-checkpoint.mjs:41`（非仓 ⇒ `throw new Error("Not a git repository — checkpoints unavailable")`）+ `git.mjs:105` / `:159`（非法 ref ⇒ throw）；
② dispatch 把 throw 渲染为 `Error: <message>` 且 `ok:false`（`thincoder-core/agent/dispatch.mjs:446-468`）⇒ 模型必见；

③ 错误串若流入 `status` 的 porcelain 解析（`^(..?)\s+(.+)$`）会被静默丢弃成空结果——**同一假洁净的第二入口**。

**调用方普查（发现 1 落点 · `runGit(` / `runGitRaw(` 全仓 grep）**：

命令与范围：`grep -rn "runGit(\|runGitRaw(" thincoder-core/ thincoder-cli/ thincoder-vscode/src/ --include=*.mjs`——命中 = 定义 2 处（`shared.mjs:442` · `git.mjs:15`）+ 调用 **13 处**（下表全列）；VSC 侧仅 1 处（端不持本地实现）。

| # | 调用方（逐处） | 分类 | 改后行为 |
|---|---|---|---|
| 1 | `git.mjs:108`（diff）· `:154`（log）· `:160`（show）· `:216`（ls-remote）· `:230`（tag list）· `:250`（branch list）· `:299`（stash list） | 工具层读动作（7 处） | **改后新增抛错** = 预期 fail-closed（throw 经 dispatch ⇒ `Error:` + ok:false，模型必见） |
| 2 | `git.mjs:114`（status——经 `runGitRaw`；修复目标点） | 工具层读动作（第 8 处） | 同上（假洁净就此消失） |
| 3 | `git-ext.mjs:97`（remote list）· `:136`（worktree list）· `:162`（blame） | 工具层读动作（3 处） | 同上 |
| 4 | `git-checkpoint.mjs:28`（`lazyClearIfCommitted`） | **已 try/catch** | **零变**（`:24-36` 全程 try/catch + 非数字提前返回） |
| 5 | `thincoder-vscode/src/tools/ide.mjs`（**已落**——自 `context.mjs` 改名）:131（`changesSection`） | **已 try/catch** | **零变**（`:128-134` 已按 throw 契约写 catch ⇒ 返回 null） |

**计数自洽**：读动作调用点合计 = **11 处**（#1 的 7 + #2 的 status + #3 的 3）——其中「十处读动作调用点」（修法表 #5 口径）= **不含 status 本点**的 10 处。「已 try/catch」= 2 处（#4 / #5）。
**无未捕获且非工具层的调用方**（VSC 唯一调用方自持 catch；CLI 侧无第二个消费面）⇒ throw 的爆炸半径 = 工具层读动作，落点正合修复目标。

**「有仓但无提交」（unborn branch）枚举**：

认定谓词：**非仓** = 退出码 128 ∧ stderr 首行含 `not a git repository`；**unborn** = 有仓、退出码 128 ∧ stderr ∈ {`does not have any commits yet` / `bad revision` / `no such ref: HEAD`}——两类**皆抛错**，但**仅非仓附指引**（修法表 #4 谓词）。

语义：unborn 下 `log` / `show` / `diff` / `blame` ⇒ **抛错**——「没有提交」必须显式（占位与「有提交但过滤后为空」不可辨）；`status` 与 list 族零变。

**H3 夹具 = 实施轮必跑项**：上「假设 × 区分性实验」H3 两夹具按纪律不在设计轮落（须仓外 scratch 仓）——实施轮**必跑**并记读数（跳过 = 判据缺失 · 静默省略面）：

① scratch 仓持 `.git/index.lock` ⇒ 跑 `git status --porcelain` 记**退出码 + stdout 原文**（期望 exit 0 ∧ 输出正确 ⇒ 并发不致假洁净；若 exit ≠ 0 ⇒ 记读数并按抛错契约判行为）；
② 仓内三读对账（`--porcelain` vs `--no-optional-locks` vs `git diff --name-only`）逐条一致 ⇒ 无缓存假洁净；
③ 读数（仓路径 / git 版本 / 两读输出）落实施记录 §5。

**验收（机判）**：A7 非仓 cwd ⇒ `status` **抛错**且消息含 `not a git repository` + 该 cwd、**不含** `clean — no changes`；A8 仓内改动 ⇒ 输出与同刻 `git status --porcelain` 逐条一致；
A9 真洁净仓（`git init` 空仓）⇒ 仍 `(clean — no changes)`（零假阳）；A10 抽样 `log`（非仓 cwd）⇒ 抛出而非 `(no commits)`（十处读动作同判据）；

A11 unborn 仓（`git init` 零提交）：`status` ⇒ `(clean — no changes)`；`log` / `show` / `diff` / `blame` ⇒ 抛错（消息含上表对应 stderr 首行）；list 族 ⇒ 占位 / 输出不变；
A12 谓词反证：非仓消息**含**指引句；unborn / bad-revision 消息**不含**（谓词 = 128 ∧ stderr 含 `not a git repository`）；

A13 调用方普查 · 集成测试级：集成层单入口 = 仓根 `node test/run.mjs`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）⇒ 失败集合 ⊆ 批前失败集合；H3 夹具读数落 §5。

**测试**：两例分列（批次本地用例——收口随批删）——A9 洁净路径（`git init` 空仓 ⇒ `(clean — no changes)`；真洁净零假阳）∥
② 非仓路径 ⇒ `status` **抛错** + 消息含 `not a git repository`（A7，测试侧用 `assert.rejects`）。两例分离后「洁净」与「非仓」不再共用同一期望值。

**对账口径**：收口判定一律以 `git status --porcelain`（bash，仓内）为准；工具侧自 **#62 起**已自带仓发现（**缺省 = 发现的项目仓根**，显式 `workdir` 优先）。

**边界（本节不做）**：跨仓自动发现不在本节（归 §6.13——工作区根 ⇒ 唯一仓自动下钻：带档优先，零档看裸仓）；本节的 fail-closed 保留为**零发现态**兜底，语义零改；不改工具描述（`thincoder-core/tool-docs/git.md` = 提示词面，内容依据 = 机制文档，落笔 = eng-coder）；

不改 `runGitStrict` 族（写面已是严格形——该族体于 §6.14 转异步薄壳，签名与写面语义不变，见 §6.14）；H3 夹具留实施轮；不改 `advisor/repos.mjs` 的独立 git 读取面（自带 `stdio` 三通，非本缺陷族）。

### 6.13 git 工具仓发现（§6.12 之上的发现层）

**裁定（用户两次定向）**：①「找仓这件事儿其实做 project-manifest 生成的时候做过一次，我觉得应该用同样一套逻辑」②「可以用同样的逻辑，**甚至共享代码**」⇒ `git` 工具的仓解析**复用 manifest 的仓发现逻辑**——**单源、禁两份实现**（D2）。

**源逻辑现址**：`thincoder-core/manifest-discovery.mjs:129`（`resolveProjectRoot`——经 `manifest.mjs` 转口）；提示词侧同源成文 = `thincoder-core/prompts/persona-engineering.md` §Project state file 的 `Project-root judgment walks DOWN`；需求侧 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.2。

**发现规则（逐条——锚判定 + 一层向下）**：

| # | 条 | 判据 |
|---|---|---|
| 1 | 锚判定 | 锚（会话 cwd 的 `resolve`）自身含 `.git` ⇒ 锚即仓根 |
| 2 | 向下深度 | **仅直接子目录一层**（不递归、**不向上**——向上遍历由 git 自身语义兜底，本层不引入） |
| 3 | 子仓判据（**两级带优先级**） | 一级 = 子目录含 `.git` **∧** 含 `PROJECT-MANIFEST.json`（**只判存在性**——不解析档内容、不问模式）；**一级非空即只看一级**；**一级为零**才看二级 = 含 `.git` 的裸仓（用户裁定——零档降级：恰一 = 建档机会 / ≥2 = 列候选） |
| 4 | 恰一 ⇒ 命中 | 该级恰好一个 ⇒ 该仓即发现结果（`matched` = `manifest` / `git` 记档位）；一级带档子目录 ≥2 ⇒ `workspace`（条 5：报明 + 指 `workdir`） |
| 5 | 零 / 多 | 两级皆零 = 无发现（⇒ §6.12 兜底）；某级 ≥2 = **`workspace`**（列该级全部候选，**不猜**） |

**单源落点与两消费者接线**：

| # | 面 | 接线 |
|---|---|---|
| 1 | 落点 | `thincoder-core/manifest-discovery.mjs` 新导出 `discoverRepos(cwd)`（经 `manifest.mjs` 转口）→ `{ kind, root, candidates }`，`kind` ∈ `self` / `unique` / `none` / `workspace`——判据与既有 `resolveProjectRoot` **同一处**（D2）；`candidates` **按名排序**（报明消息确定可判） |
| 2 | 消费者①（manifest 初始化面） | `resolveProjectRoot(cwd)` 退为 `discoverRepos(cwd).root` 的**薄包装**（**零语义**——四态输出不变）；其调用方 `manifestFilePath` / `docRootBase` / `thincoder-core/ledger-db.mjs` **零改** |
| 3 | 消费者②（git 工具解析面） | `thincoder-core/tools/git.mjs` 的 `execute()` 头部**单点**（`git.mjs:94-97` 一带：workdir 归一 `:97` 之后、审批门 `:99-102` 之前）⇒ 全 action 覆盖（`git-ext.mjs` / `git-checkpoint.mjs` 族经同一 `ctx`）——**调用点零改**（重定向改的即 `ctx` 变量本身 ⇒ 三档消费面无需改；`ctx.cwd` 消费点 = `git.mjs` **31** · `git-ext.mjs` **17** · `git-checkpoint.mjs` **7**——单源机判见 A20） |

**解析序（缺省路径的兜底——workdir 显式优先）**：

| 序 | 条件 | 结果 |
|---|---|---|
| 1 | `args.workdir` 在场（含 `"."`）——判据 = **与既有接线同源的真值判定**（`git.mjs:97` `if (args.workdir)`；空串 / null 走发现） | `resolve(cwd, workdir)`；**零发现** |
| 2 | 无 workdir ∧ `self` | `ctx.cwd` 原值（锚已是仓根）；**对象引用透传**（不 clone——#59 缝用例按引用断言） |
| 3 | 无 workdir ∧ `unique` | `ctx.cwd ← root`（重定向）+ 结果首行注记（见下）——**含裸仓级命中**（#188） |
| 4 | 无 workdir ∧ `none` | `ctx.cwd` 原值 ⇒ 落到 §6.12 fail-closed（**零态兜底 = 前置、零改**） |
| 5 | 无 workdir ∧ `workspace`（下辖 ≥2 仓） | **报明 + 下一步**（工具侧 throw = 事实呈报）：消息列该级全部下辖仓**绝对路径** + 指引传 `workdir`——**不猜**（消息按 `matched` 出两档变体——#188）；**措辞不得含「Ambiguous / 歧义」**——`path` 是仓内 pathspec（非项目指针），无路径可判 ⇒ 此处 = **报明事实 + 可执行的下一步**（2026-10-15 收正；处置表 = `MANIFEST.md` §2.5） |

**动作面例外（创建仓的两个动作）**：`init` / `clone` 以 **cwd 为落点**（`git init` 在无仓处天然合法；`clone` 的落点为 cwd 相对路径）⇒ **不做发现**（否则「在此处建仓 / 克隆」被静默搬进别的仓）；二者仍可经 `workdir` 显式指落点。其余 action 一律照发现（含 `worktree add` 等需既有仓者）。

**产出注记（重定向可见）**：重定向发生 ⇒ 结果**首行**加 `(repo: <仓根绝对路径>)`（同族先例 = `git-checkpoint.mjs` 的 `[snapshot …]` 前缀行；端拒执行串原样返回、不加注记）。

理由：① 静默重定向 ⇒ 模型不知哪一仓应答；② 重定向后 `path` 类参数**基数 = 仓根**——写错基数时 git 侧 **exit 0 + 空输出**（实测 `git diff HEAD -- no/such/path.txt` ⇒ exit 0 / stdout 空 / stderr 空）⇒ 与 §6.12 要消灭的假洁净**同形**，注记是廉价消歧面。

**退化口径（normal 模式）**：发现 = **纯 fs 判据**（不读 manifest 内容、不查模式、不依赖 `agent`）⇒ 两模式**同判**；「无 manifest 概念」的工作区——带档子仓为零 ⇒ **看裸仓级**（#188：恰一 ⇒ 重定向 + 注记；≥2 ⇒ `workspace` throw）；两级皆零 ⇒ `none` ⇒ §6.12 fail-closed（不变）。

**开销**：单次发现已在毫秒噪声级 ⇒ **不做缓存**（mtime / cwd 键缓存——`git init` / `clone` 会改盘面，缓存的失真面恰是发现本身）。

**落位（机制级）**：

| # | 文件 | 落点 |
|---|---|---|
| 1 | `thincoder-core/manifest-discovery.mjs`（经 `manifest.mjs` 转口） | 新导出 `discoverRepos` + `resolveProjectRoot` 改薄包装 + 头注一行 |
| 2 | `thincoder-core/tools/git.mjs` | `execute()` 头部：import + 解析序（workdir / 发现 / `workspace` throw）+ 注记前缀（执行体抽模块级函数——**不用 `this`**：VSC 侧 `{...coreGitTool}` 展开装饰，`this` 绑定不可依赖） |
| 3 | 单元测试档（批档伴随件——用后即删 · 零留存） | `discoverRepos` 四态 + 候选保序（T41 / T42——用例表住 `docs/core/design/MANIFEST.md` §3.2） |
| 4 | 单元测试档（批档伴随件——同零留存；git 发现面） | A14–A22 用例格（夹具 = 真实 `git init` 仓 + `PROJECT-MANIFEST.json` 档；A20 = 源码结构断言、无夹具） |

**用例表（正常 / 边界 / 错误 · 判据 = A14–A22）**：

**路径纪律**：A14–A19 一律经 **`gitTool.execute(args, ctx)` 真工具调用面**（禁绕过工具直调 `discoverRepos`）；
夹具 = 真实 `git init` 仓 + 真实 `PROJECT-MANIFEST.json` 档（**禁** mock / 占位目录手写——发现面走真判据）；A20 = 源码结构断言（无夹具）。

| # | 场景 | 夹具 / 输入 | 预期 |
|---|---|---|---|
| A14 | 正常：**唯一态**（本工作区形态） | 容器（非仓）+ 恰一个含 `.git` ∧ manifest 的子仓（仓内一文件改动）+ 一个含 `.git` 但**无** manifest 的干扰子目录（判别合取——只扫 `.git` 的第二份实现会选错）；`{action:"status"}`、cwd = 容器 | 输出 = 该子仓 porcelain（与同刻 `git status --porcelain` 逐条一致）+ 首行 `(repo: <子仓>)`（**先红**——批前：非仓失败 / 假洁净） |
| A15 | 边界：**零态** | 容器（非仓）+ 空子目录；`{action:"status"}` | `ctx.cwd` 不变 ⇒ §6.12 语义（throw·消息含 `not a git repository`）——**#55 落地后可判**（前置） |
| A16 | 错误：**工作区态（多仓）** | 容器 + **两个**含 `.git` ∧ manifest 的子仓；`{action:"status"}` | **throw**（报明 + 下一步）·消息含两下辖仓**绝对路径** + 含 `workdir` + **不含 `ambiguous` 字样**；不含 `clean`（**先红**） |
| A17 | 边界：**workdir 优先** | 同 A14 夹具 + `workdir: "other"`（另一仓、无 manifest） | git 在 `other` 执行（非发现结果）+ **无注记行**（回归守卫） |
| A18 | 边界：**仓内锚 / 仓的子目录**（回归） | cwd = 仓根；cwd = 仓内子目录（锚无 `.git`、子目录无 manifest） | 两格皆照旧（`self` / `none` ⇒ `ctx.cwd` 原值；仓子目录靠 git 自身向上搜索）+ 无注记行 |
| A19 | 边界：**创建类动作例外** | 唯一态容器 + `{action:"init"}` | `.git` 落在**容器**（不在发现的子仓）；子仓 `.git` 未被重写 |
| A20 | 错误 / 结构面：**单源机判**（禁第二份发现实现——KD-M1-22） | 读 `thincoder-core/tools/git.mjs` 源码（**无夹具**） | ① `discoverRepos` 自 `../manifest.mjs` **import 命中**（两消费者共用同一导出）② 该档 `node:fs` import **零命中**（物理上无法自写目录扫描）③ `readdirSync` / `existsSync` / `statSync` 三谓词**零命中**（**先红**——三条全不成立：该档 import 面仅 `node:child_process` / `node:path`，`.git` / `manifest` 字面亦零命中） |
| A21 | 正常：**裸仓级命中（#188 新增）** | 容器（非仓）+ 恰一个含 `.git` 的裸子仓（无 manifest）；`{action:"status"}`、cwd = 容器 | 重定向到该仓 + 首行 `(repo: <子仓>)`（**先红**——批前：`none` ⇒ §6.12 fail-closed）（AC-21 / T43④） |
| A22 | 错误：**裸仓级工作区（#188 新增）** | 容器 + **两个**裸子仓（皆无 manifest）；`{action:"status"}` | **throw**（报明 + 下一步）·消息列两下辖仓**绝对路径** + 含 `workdir` + **不含 `ambiguous` 字样**；不含 `clean`（消息 = 裸仓档变体——不书「and PROJECT-MANIFEST.json」句）（**先红**） |

**#188 面**：A14–A20 判据与夹具不变（带档级行为逐字不变）；A21 / A22 补裸仓级；A20 的单源 import 断言符号面不变（仍 `discoverRepos`——仓梯即该符号）。
**验收（机判）**：A14 输出 ≡ 仓内 porcelain + `(repo: ` 首行；A15 零态 = 非仓失败语义（#55 落地后）；A16 throw + 两候选路径 + `/workdir/` + 无 `clean`；
A17 workdir 优先 + 无注记；A18 两类 cwd 零行为变（既有用例全绿）；A19 init 落点 = 锚；

**A20** 三条结构断言全绿（源码面——`discoverRepos` import 命中 ∧ `node:fs` 零命中 ∧ 扫描谓词零命中）。
**前置（已满足）**：A15 依赖 §6.12（#55 fail-closed）——已落地
（`thincoder-core/tools/git.mjs` 的 `runGitRaw` 失败 throw · §6.12 的 A7–A12 判据）⇒ A15 可判。

**测试**：单元测试档（批档伴随件——用后即删 · 零留存；不进 `test/` 树）。

`thincoder-core/test/` 现盘 = `run.mjs` / `slow.mjs`（单测档零留存——不进 `test/` 树；2026-11-01 实读）；`_setProjectRootForTest` **须复位**（发现面走真判据）；

用例 = A14–A22（上表）∥ `discoverRepos` 四态 + 候选保序（T41 / T42——用例表 = `docs/core/design/MANIFEST.md` §3.2）∥ `resolveProjectRoot` 零语义回归面（判据 = `MANIFEST.md` §3.2 T42 行）。

**边界（本节不做）**：工具描述正文**已收口**（`thincoder-core/tool-docs/git.md:39` + `thincoder-core/tools/git.mjs:85` 内联描述——两面逐字同口径 = `Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）`）· 不改

 `runGitStrict` 族（写面——该族体于 §6.14 转异步薄壳，签名与语义不变，见 §6.14）· 不改 §6.12 的 fail-closed 语义（本节是其**发现层**，零态兜底不变）· 不做多级向下递归 / 向上遍历 · 不做发现结果缓存 · 不扩到其他工具（`bash` / `read` 等 cwd 语义不变）。

### 6.14 git 工具非交互加固

**故障族定义（四族 = 本节加固靶面）**

| 族 | 触发机制 | 等待对象（解析链） |
|---|---|---|
| 编辑器族 | git 需人写 / 确认提交信息、rebase todo | `GIT_EDITOR` → `core.editor` → `VISUAL` → `EDITOR` → 兜底 `vim`（`git var GIT_EDITOR` 实测：env > `core.editor` 与零配置兜底 `vim` 两段在案；`VISUAL` / `EDITOR` 两段未逐段实测 = **unverified**） |
| 凭据族 | 远端要求认证（`push` / `fetch` / `pull` / `clone` / `ls-remote`） | 终端提示 · `GIT_ASKPASS` / `core.askpass` · `credential.helper`（本机全局档实配 `manager` = GCM） |
| GUI 族 | 上两族的 GUI 形态 | GUI 编辑器（记事本类）· 凭据管理器弹窗 · GUI askpass |
| pager 族 | 输出分页 | `GIT_PAGER` / `PAGER` / `core.pager`（stdout 非 TTY 时 git 本不自起） |

**加固集（逐字 · 实施点 = 单点）**

```js
// thincoder-core/tools/git-run.mjs（已落）——git spawn 单点
export const GIT_ENV = {
  ...process.env,               // 继承面（PATH / HOME / 用户 proxy 等）——加固键一律置后覆盖，继承面不得反超
  GIT_EDITOR: "true",           // 编辑器族：提交信息编辑器（解析链最高优先键）
  GIT_SEQUENCE_EDITOR: "true",  // 编辑器族：rebase todo 列表编辑器
  EDITOR: "true",               // 编辑器族：兜底链 VISUAL / EDITOR
  VISUAL: "true",
  GIT_PAGER: "cat",             // pager 族（bash 工具先例同值）
  PAGER: "cat",
  GIT_TERMINAL_PROMPT: "0",     // 凭据族：禁终端提示
  GIT_ASKPASS: "",              // 凭据族：空串 ⇒ 不调 askpass 程序（同时封 core.askpass 升级路）
  TERM: "dumb",                 // 终端族（bash 工具先例同值）
}
```

- **依据（仓内先例优先）**：编辑器族 / pager 族 / 终端族 6 键 = `thincoder-core/tools/bash.mjs:47-59` `buildBashEnv()` 同款（bash 工具不冻、git 工具冻 = 本节缺陷的对照实锤）；凭据族 2 键为**新增**（bash 面亦无）。
- **env 形（非 `-c` 形）**：`git var GIT_EDITOR` 读序实测 env 优先于 `core.editor` ⇒ 宿主 env（桌面 / IDE 注入的 `GIT_EDITOR` / `EDITOR`）在场时 `-c` 形单独不足；env 形另具**零命令面改动**（成功路径输出形态零变）。
- **最小集裁定（不加的项）**：不加 `-c core.askpass=`（冗余）；不加 `GIT_SSH_COMMAND`（会覆盖用户自配 ssh / plink——登记：ssh 面 = stdin 非 TTY ⇒ 密码提示不可达，GUI askpass 由超时兜底）。
- **单点落位**：`GIT_ENV` + 两档超时 + `spawnGit` 全部住 `thincoder-core/tools/git-run.mjs`（已落）；三个形适配器（`runGit` / `runGitRaw` / `runGitStrict`）改**薄壳**——签名 / home / 消费面 import 路径全不变，仅体改异步并委托单点（禁逐调用点补加固）。

**超时语义（值 / 面 / 动作序 / 文案）**

| 项 | 定值 | 依据 |
|---|---|---|
| 本地面超时 | `GIT_TIMEOUT_MS = 120_000`（120s） | bash 工具缺省同值（`thincoder-core/tools/shared.mjs` 的 `BASH_TIMEOUT_MS`） |
| 网络面超时 | `GIT_NET_TIMEOUT_MS = 300_000`（300s） | 网络五动作（`push` / `fetch` / `pull` / `clone` / `ls-remote`）合法耗时可远超本地；依据 = 需求档 `docs/core/requirements/TOOLS.md` **§4.7 TTY-DRIVE N3**（`:141`）「档 ≤ 3 分钟」——该行自述「数值口径**待设计轮定**」⇒ 本节取其作**候选参照值**（非既有契约值） |
| 适用面 | **全量**（三适配器 · 全 32 action 同款） | 不做读 / 写分档：读面无更长正当耗时；写面网络动作已另提档 ⇒ 分档无收益 |
| 注入面 | `spawnGit(cwd, args, { timeout, maxBuffer })`（缺省按面取常量 · `??` 回落）+ **测试态缝** `_setGitTimeoutForTest(ms)` / `_resetGitTimeoutForTest()`（模块级 · `git-run.mjs` 导出——先例 `thincoder-core/manifest.mjs:48` · `thincoder-core/session-gc.mjs:136`；用例 `finally` 复位） | 使 A26（`spawnGit` **直调** + 参数覆盖）与 A24（**适配器层**——`gitTool.execute` → `runGitStrict` → `spawnGit` **缺省解析**）均可机判（小 timeout 夹具，不必等 120s / 300s）；**不进用户参数面**（边界明令不新增用户选项） |
| 超时动作序 | **win32**：直接树杀（树可寻址时）；**POSIX**：① `SIGTERM` 直接子 → ② 逾 1.5s **树杀** → ③ 逾 1.5s 未 `close` 亦 settle（kick） | ① 仅 POSIX：给 git 一次自行收尾机会（不直接 `SIGKILL`）；② 树杀 = 仓内先例 `killProcessTree`（Windows `taskkill /T /F` · POSIX 组杀）；③ 孙持管道时 `close` 永不触发（`thincoder-core/tools/bash.mjs:200-217` 同款注释）⇒ kick 是必需件 |
| killSignal | **POSIX**：`SIGTERM`，逾 1.5s 升级树杀（`SIGKILL`）；**win32**：直接 `taskkill /T /F`（见上行动作序）| 同上；上界 = `timeout + 3s` |

**平台注（win32）**：Node 对子进程 `SIGTERM` 在 win32 上实为**硬终止**（本设计轮实测：注册 `SIGTERM` 处理器的子进程仍 184ms 内被杀、处理器未执行 ⇒ ① 不构成宽限、git 侧零收尾窗口）；上界 `timeout + 3s` 与 A26① 不受影响。

**超时错误文案（逐字 · 模型可见面）**：单源 = `git-run.mjs` 的 `gitTimeoutNote(ms)`：

```text
timed out after <n>s (killed) — no interactive input is possible here (editor / credential / network); process killed, tree best-effort — retry or use the bash tool; an interrupted write keeps git state (`git status`) — git abort / continue, or checkpoint action=checkpoint checkpointAction=list
```

两帧嵌同一条：`runGit` / `runGitRaw` 抛错经 `gitFailureMessage`（`git <args…> … (cwd: <绝对 cwd>)` 框 + 本条）；`runGitStrict` 的 `err` = 本条（调用方另加 `git <action> failed: ` 前缀）。
超时可辨性：`spawnGit` 抛的 `Error` 带 `.timedOut = true` · `.code = "ETIMEDOUT"` · `.timeoutMs` · 已收集 `.stdout` / `.stderr` ⇒ 两帧各自映射，**不靠 stderr 文本猜**。

**被杀后仓态与恢复锚（按写动作类——超时文案「recoverable」所指面）**

| 类 | 动作 | 被杀后仓态不变量 | 恢复锚 |
|---|---|---|---|
| 有快照类 | `rebase` · `clean` · `tag -d` · `branch -d` · `checkout -- <path>` · `restore` · `stash pop` · `reset --hard` | 快照**先于**动作落（`snapshotBefore`）；在途 `rebase-merge` 保留 · 无 `index.lock` 残留 | `checkpoint` / `checkpointAction=list` 认档 → `rewind` 回退 |
| 无快照类 · git 自持态 | `pull`（merge 路） · `merge` | 半程合并可留 `MERGE_HEAD` + 工作树冲突标记（git 自持态——非本工具产物） | `git status` 读态 → 解冲突后提交；放弃 = bash 工具 `git merge --abort`（工具未暴露 abort 形） |
| 无快照类 · 其余写面 | `commit` · `push` · `fetch` · `stash push` · `cherry-pick` · `revert` | 提交 / 远端动作各自原子（落或不落）；`cherry-pick` / `revert` 冲突态留 `CHERRY_PICK_HEAD` / `REVERT_HEAD` | `git status` / `git log` 对账；在途序态经 git 自身 abort / continue 收束（bash 工具） |

> 格源：#12 = 实测格；其余 = git 自持语义（未逐格实测——不作行为契约）。被杀 = 进程终止，**不引入**工作树回滚（回滚仅经 `checkpoint` 显式动作或 git 自身命令）。

**同步 → 异步**：**裁定 = 转异步**（`spawn` + 树杀 + 超时 + kick）。

- 理由：① 同步 ⇒ 全进程阻塞（`thincoder-core/tools/exec-run.mjs` 头注自述「execFileSync 不可中断」）——即便 120s 有界等待，TUI / Stop / 其它工具全程不可用 = 目标症状的**同形**，只是有界；② 同步超时只杀直接子 ⇒ 编辑器孤儿实测存活（#1）且孙进程可持管道；③ 异步须自带 kick（#1 的孤儿 = `close` 不到的现成反例）。
- 代价与可控性：三适配器签名不变（仅 `async`）；**核三档**调用点全部已在 async 函数内 ⇒ 机械 `await` **46 处**（`git.mjs` 30 = `runGit` 7 · `runGitRaw` 1 · `runGitStrict` 22；`git-ext.mjs` 15 = `runGit` 3 + `runGitStrict` 12；`git-checkpoint.mjs` 1）。
- **端侧扇出（VSC）**：核 `runGit` 的端侧唯一消费方 `thincoder-vscode/src/tools/ide.mjs` 的 `changesSection`（`:133`）**非 async** ⇒ 同批转 async + `:136` 1 处 `await`（`:70` 经 async `collectSection` 扇出受控；`:48` 调用方零改）。跨端一致（VSC 直引核档，端侧零镜像实现）。
- **形保真清单（等价性契约 · 逐条 ①②）**：① stdout 的 trim / `\r` 归一逐字同；② 溢出语义同形——`runGit` / `runGitRaw` = 10MB 上限 + `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` 等价分支（返回部分输出），`runGitStrict` = 1MB（Node `execFileSync` 默认值）。
- **形保真清单（续 ③④）**：③ 失败错误字段 `.stdout` / `.stderr` / `.status` / `.message` 同构（`gitFailureMessage` 消费面零改）；④ spawn 形 = `stdio: ["ignore","pipe","pipe"]` + `windowsHide: true`（bash 先例）。

**全 action 面清算表（32 项 = action 枚举逐项 × 四族）**

值 = `—` 该族零入口（命令形态不可能触发）· `固` 有入口但加固集关闭（实测或判据）· `固·超` 加固后仍有余量（helper / 未暴露入口）由超时兜底 · `实害` 实测挂死位（修复）。

| # | action（子动作） | 编辑器 | 凭据 | GUI | pager | 处置 |
|---|---|---|---|---|---|---|
| 1 | `diff` | — | — | — | — | 零改（形壳） |
| 2 | `status` | — | — | — | — | 零改（`runGitRaw` 转 async 薄壳） |
| 3 | `log` | — | — | — | — | 零改（pager 实测不上——#9） |
| 4 | `show` | — | — | — | — | 零改 |
| 5 | `checkpoint`（list / create / rewind / cat / versions） | — | — | — | — | 表外面零改：`thincoder-core/git/checkpoint.mjs` plumbing（`rev-parse` / `diff` / `ls-files` / `checkout` / `apply`）零交互族 |
| 6 | `add` | — | — | — | — | 零改 |
| 7 | `rm`（`--cached`） | — | — | — | — | 零改 |
| 8 | `commit`（`-m` · `--only -m`） | 固 | — | 固 | — | 编辑器零入口（无 `-m` 工具即拒）；加固 = 兜底 |
| 9 | `push` | — | 固·超 | 固·超 | — | 网络：git 原生路关闭（#5）；helper 路（GCM）由超时兜底（#6） |
| 10 | `tag`（list / create / delete） | — | — | — | — | 零改（轻量 tag 无编辑器） |
| 11 | `branch`（list / create / delete / switch） | — | — | — | — | 零改 |
| 12 | `checkout`（ref / `-- path`） | — | — | — | — | 零改 |
| 13 | `restore` | — | — | — | — | 零改 |
| 14 | `stash`（list / push / pop） | — | — | — | — | 零改（`push -m` 实测不起——#10） |
| 15 | `fetch` | — | 固·超 | 固·超 | — | 同 #9 |
| 16 | `pull` | 固 | 固·超 | 固·超 | — | merge 路实测不起（#10 / #11）；rebase 路交棒 `rebase --continue`（= 修复位） |
| 17 | `reset`（soft / mixed / hard） | — | — | — | — | 零改 |
| 18 | `revert` | 固 | — | 固 | — | `--no-edit` 已防护（复核保留 ✓） |
| 19 | `merge` | 固 | — | 固 | — | `--no-edit` 已防护（复核保留 ✓）；裸形实测亦不起（非 TTY） |
| 20 | `cherry-pick` | 固 | — | 固 | — | 干净实测不起；冲突后 `--continue` 无工具入口（不暴露） |
| 21 | `ls-remote` | — | 固·超 | 固·超 | — | 同 #9（读面网络） |
| 22 | `clone` | — | 固·超 | 固·超 | — | 同 #9 + 落盘 |
| 23 | `init` | — | — | — | — | 零改 |
| 24 | `rebase`（start / abort / continue） | **实害** | — | **实害** | — | `--continue` 实测起编辑器（#1）= 修复位；`start` / `abort` 实测不起；`GIT_SEQUENCE_EDITOR` = todo 面兜底（工具未暴露 `-i`） |
| 25 | `remote`（list / add / remove / set-url） | — | — | — | — | 零改 |
| 26 | `clean` | — | — | — | — | 零改 |
| 27 | `switch` | — | — | — | — | 零改 |
| 28 | `apply` | — | — | — | — | 零改 |
| 29 | `worktree`（list / add / remove） | — | — | — | — | 零改 |
| 30 | `archive` | — | — | — | — | 零改 |
| 31 | `blame` | — | — | — | — | 零改（管道 stdout ⇒ 不上 pager） |
| 32 | `mv` | — | — | — | — | 零改 |


**表外复核（余位零改 · 逐位登记）**

| 位 | 判据 | 处置 |
|---|---|---|
| `thincoder-core/tools/shared.mjs` `gitDiffOne`（`gitDiffOne` 头起） | 非 git 工具面（file / edit 族预览）· 命令零交互族（`--no-pager` + 本地读） | **落：转 `spawnGit`（async）**——`GIT_ENV` 加固 + 超时 + 树杀 + 非阻塞；形保真 = trim / 200 行截断 / 10MB 溢出取部分 / 失败静默 `""`；调用面 5 处 `await` 化 |
| `thincoder-core/tools/patch.mjs:278`（`git ls-files --error-unmatch`） | 探针命令 · 零交互族 · 非 git 工具面 | **落：同转 `spawnGit`**（delete 分支 async 体内；失败 = 未跟踪，语义零变） |
| `thincoder-core/git/checkpoint.mjs` `git()` | 快照面 plumbing · 零交互族 · 「checkpoint / 快照语义零改」 | 零改（登记） |
| `thincoder-core/advisor/repos.mjs` 独立 git 读取面 | §6.12 既有边界（自带 stdio 三通 · 非本缺陷族） | 零改（登记） |
| `thincoder-core/tools/bash.mjs` | 边界明令零改（其加固照旧） | 零改（登记） |

**用例表（正常 / 边界 / 错误 · 判据 = A23–A29 · 夹具形态可跑）**

| # | 类 | 场景 | 夹具 / 输入 | 预期（机判） | 先红 |
|---|---|---|---|---|---|
| A23 | 正常 | 编辑器族压制（= §1 ①） | scratch 仓：冲突已解态（`rebase --continue` 待提交）+ 进程 env `GIT_EDITOR = <挂死夹具>`；`{action:"rebase", rebaseAction:"continue"}` | 返回 · HEAD = 被 pick 的提交 · rebase 目录消失 · **挂死夹具 pid 档不出现**（= 编辑器从未启动） | ✓ |
| A24 | 错误 | 凭据 helper 族 + 超时兜底（= §1 ②③） | scratch 仓 + 本地 401 服务 URL + `-c credential.helper=<挂死夹具>`；`{action:"push"}`（**适配器层**：`_setGitTimeoutForTest(<小值>)` 注入 + `finally` 复位） | 返回 ≤ 注入值 + 3s · 文本含 `timed out after` ∧ 含恢复指引串 `checkpoint action=checkpoint checkpointAction=list` ∧ 含 `best-effort`（树杀尽力而为语义——防过度声称回潮）· 夹具进程不存活 | ✓ |
| A25 | 正常 | 凭据 git 原生路（回归守卫） | 同 A24 但空 helper；夹具钉 locale（`LC_ALL=C`——注入同 `GIT_EDITOR` 式，`finally` 复位） | 快速失败（判据 = 远小于超时窗口；**< 5s = 经验界**、与机器负载相关、非契约值）· 文本含 `terminal prompts disabled`（英文句由 locale 钉死保证） | ✗（headless 无控制台——批前亦快失败 ⇒ 本格 = 回归守卫，非先红） |
| A26 | 边界 | 超时三件套（`spawnGit` 直调） | `spawnGit(cwd, args, { timeout: 800 })` + 慢子进程夹具；附「孙进程持管道」格 | ① settle ≤ `timeout + 3s`（SIGTERM→1.5s 树杀→1.5s kick 上界）② `.timedOut === true` ∧ 消息含 `timed out after` ③ 夹具进程树不存活 ④ 孙持管道格仍 settle | ✓（批前：无超时 / 无树杀能力） |
| A27 | 边界 | 形保真（成功路径零变 · = §1 边界） | 集成层 = 仓根 `node test/run.mjs`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）· VSC 面 = `cd thincoder-vscode && node test/run.mjs`（单元清单面——面差②）+ 抽样对拍（`status` / `diff` / `log` / `branch list` 输出逐字比） | 两面失败集合 ⊆ 批前失败集合 · 抽样输出逐字同 | —（回归） |
| A28 | 结构 | 单点机判（读源码 · 无夹具） | 五档源码 + `git-run.mjs` | ① 五档（`shared` / `git` / `git-ext` / `git-checkpoint` / `patch`）`execFileSync` 命中 = **零**（`gitDiffOne` / `ls-files` 探针两处转 `spawnGit`）∧ `gitDiffOne` 经 `spawnGit`（import 命中）② 加固键字面在 `tools/` 域内仅 `git-run.mjs`（+ 既有 `bash.mjs`）命中 ③ 三适配器均 `spawnGit`（import 命中） | ✓（四档命中恰一处 = 白名单成立） |
| A29 | 文档 | 清算表齐全（= §1 ④） | 本节清算表 | 行数 = **32**（= action 枚举逐项）· 四族列非空 · 值 ∈ {`—`, `固`, `固·超`, `实害`} | —（文档面） |

**验收（机判 · 回指 §1 四功能点）**

| §1 功能点 | 本节判据 |
|---|---|
| ① 编辑器族压制 | A23 · A28 · A27 |
| ② 凭据 / GUI 族压制 | A24 · A25 |
| ③ 超时兜底 + 明确报错（冻结绝不再现） | A24 · A26 |
| ④ 全 action 面清算 | A29 · A28 |

**测试**：批次本地单元测试档（收口随批删）——夹具三形态：① scratch 仓（`git init` + 本地 identity + 冲突态构造）② 挂死进程夹具（.cmd / 脚本，启动即写 pid 档——**判据 = pid 档出没**，跨平台可跑）③ 本地 401 HTTP 服务（node `http`）。
`process.env.GIT_EDITOR` 注入须在 `finally` 复位（同式纪律：A25 的 `LC_ALL`、A24 的 `_setGitTimeoutForTest` / `_resetGitTimeoutForTest`）。

**VSC 侧回归** = 批次本地单元测试档（收口随批删；夹具 = temp `git init` 仓 + 未提交改动，真 git 子进程）：
经 **`ideTool.execute({what:"changes"}, {cwd})` 真工具面**断言三格——① 未提交变更 ⇒ 输出含 `## 未提交变更 (N)` + 文件名行（**中间态红**：核 `runGit` 已 async ∧ `changesSection` 未转 ⇒ 输出变 `(error: …)`——防漏改）② 洁净 ⇒ 不出该段 ③ 非仓 cwd ⇒ 不出该段、零抛错（`catch` 路）。

回归守卫 = 本节用例表 A23–A29（判据保留在表；批次本地单测档收口随批删，无随批留下的可执行档）。

**边界（本节不做）**：不改 `bash` 工具（其加固照旧，`thincoder-core/tools/bash.mjs` 零改）· 不新增 action / 参数 / 用户选项（超时与加固均为常量，不进 schema）· 成功路径输出形态零变（加固走 env，不加命令行参数）· checkpoint / 快照语义零改 · 不接 Stop / abort（`runGit` 族无 `ctx.signal` 通路——不做）
 · 「表外复核」五位中 `gitDiffOne` / `patch.mjs` 两处落（转 `spawnGit`）；

余三位（`thincoder-core/git/checkpoint.mjs` / `advisor/repos.mjs` / `bash.mjs`）维持零改（见上表）· 不做 ssh 面 `GIT_SSH_COMMAND` 覆盖（会夺用户自配）+ 不设 `SSH_ASKPASS`（登记为超时兜底面）· 不改 README / 需求档 / 发布面。

**发布关联**：缺陷在已发布 `0.12.64`（「已知变坏不得出厂」族）⇒ 修复随**下一代 CLI** 发布；**发布动作 = 用户门**。

### 6.15 task 工程模式停用 + batch 词面协议结构化

**登记册与装配面事实基线**（行号 = 定位锚非契约）：

- taskTool 注册零模式耦合：核登记册 `thincoder-core/agent-tools.mjs:8` 显式导出——**不移除**（VSC 转口 `export *` 透传 + 端转口同集测试锚定导出集，摘名即红）。
  **唯一装配消费点 = `thincoder-core/agent/family-tools.mjs:181-183`**（两端共用家族矩阵单源——VSC `setup-tooltable.mjs:262` 同调；CLI 侧消费装配同一函数）；

  工程分支现体 = `[timerTool, …depthOnly]`（task / plan 皆不入工程段——`family-tools.mjs:184-186`；普通分支 = `[taskTool, planTool, timerTool, …depthOnly]` 逐字不变）；plan 先例 = 工程分支不入表（`family-tools.mjs:177-180` KD8）。
- **催更门连带**：`agent/completion.mjs:56-63` pending 列表催更 reminder 指向 task 工具——工程模式下列表不可再合法变更 ⇒ 死胡同提醒，须同门排除；**VSC 侧同判面 = 独立副本**（`thincoder-vscode/src/agent/run-stages.mjs:86-101` `maybeGuardPushbacks`——非核单源）⇒ 两端同步排除（双源结构事实 → §6.15「两端运行面」行）。

#### 6.15.1 F10 `task` 工程模式机械停用

**六裁定点①——拒绝点位置 = 双层门（装配面摘除 + execute 面机械拒）**：

| 层 | 处置 | 理由 |
|---|---|---|
| 装配层（主门） | `family-tools.mjs` 固定段按模式分流：工程段摘 taskTool、普通段逐字零变 | **KD8 先例（plan 不入表，`family-tools.mjs:177-183`）**——「看不见的选项不会被选」：描述不进工程模式工具表 = 模型不知有 task = 零调用零 token 税（描述 re-inject 税连根拔）；用户两个痛点（并行结构多余 + token 税）同拔 |
| execute 层（兜底门） | `task.mjs` execute 开头按 `ctx.agent.config?.agent?.engineering` 机械拒 | **escalate 先例（`subagent-actions.mjs:348-349`）**——机械防线不依赖装配正确性（装配可被 future 构造绕开——自定义装配直传 taskTool），机判门是最终真值面 |

错误句文案形态对齐 escalate 先例（`subagent-actions.mjs:349`）——单句含「engineering」+ 指引追踪权威面：

```
Error: engineering mode is ON — task is unavailable (the batch record + the ledger are the tracking authority in engineering mode). Update progress in the batch record (§5/§6) or the ledger (`/ledger`); task lists go stale in this mode's parallel structure.
```

- 前置位 = execute 开头（先于 alias 归一 / pushContextNudge / `_taskPushbacks` 归零 / `_onTaskUpdate`）⇒ **零副作用**（列表不变）；`readonly: true` 零改；零配置开关（模式判定 = `engineering` 现值单查，escalate/plan 同款）；登记册 / 描述六要素 / 普通模式行为零变。
- **催更门连带**：`completion.mjs:56` 门条件补 `!engineering` 排除（模式判定与 deny 句同源 `agent.config?.agent?.engineering`；assistant 行照常落地——不发指向被拒工具的 user 行；`_taskPushbacks` 预算语义零改）；
  **VSC 副本同位同步**——`thincoder-vscode/src/agent/run-stages.mjs:92` pending 分支补同款条件（模式判定同源；该副本 advisor 分支 `:155` 已有先例；`_tasks` 活体链 = `agent-state.mjs:121` + `thincoder-vscode/src/agent.mjs:418`/`:433` ⇒ 分支可触发）。

#### 6.15.2 F11 `batch` 词面协议结构化

**机制总则**：六段结构 / 一段一作者 / 冻结门（`assertGateOpen`）语义**零变**；单源纪律承 KD-4（skeleton ← lifecycle ← 主档）；散文纪律句**不删**（机判叠加）。变化全部 = **值的载体形态**。（段内写入纪律不在本节：段内一个写面——作者可 `append` 加内容、可就地 `edit` 自己那一段——判据单源 = `BATCH-RECORD.md` §4.19。）

**裁定点②——F11-A enum 化实现形态 = 运行时校验保持（唯一真值面）+ value 谓词收紧为「关键词锚定」+ 增独立 `note` 字段**：

- JSON schema 静态 `enum` 数组表达不了**按段词表**（词表 = `STATUS_WORDS[seg]` 运行时按身份选段）——静态写死四段并集 = 词表第二份 + 非法放行（schema enum 是 advisory，providers 不强制——`family-tools.mjs:85` 既有结论）⇒ 运行时校验（`assertStatusValue`，`batch-lifecycle.mjs:175-188`）是唯一真值面，**该地位保持不动**（不动的是「校验住运行时」这条形态；谓词字面按下条收紧）。
- **value 谓词收紧：合法值 = 恰一关键词 + 装饰白名单**。白名单 = 首尾非字母数字符号（emoji / 标点 / 空白）+ 尾部 ISO 日期（`YYYY-MM-DD`）+ 首尾空白；**剥掉白名单后余核必须逐字等于该关键词**——余核 ≠ 关键词（散文内嵌）⇒ 拒，错误句 = 词表回显（与 0 命中 / 词表外同串）。判读序不动：≥2 命中 ⇒ 混词拒（既有多词防线）在前；唯一命中 ⇒ 再判「∈ 本段词表 ∧ 余核 = 关键词」。
  逐形判读：`已收口 2026-09-21`（close 正常产物形）· `✅ 设计完成 2026-09-21` · `🔄 进行中` = 白名单装饰 ⇒ 合法；`讨论已收口 2026-09-21` 的余核 = `讨论已收口` ⇒ 非法（散文说明走 `note` 括注——value 内散文不再容忍，note 机制即其承载面）。
- **读侧（gate）零变**：`readBatchStatusLine` / `assertGateOpen` 仍子串包含——冻结门语义零变（read 侧须容忍骨架占位 `🔄 进行中（…）` 与 close 产物；收紧只在写入面 value）。
- **事故①防复发机制（「讨论已收口」误触发冻结门）**：该形在现行子串谓词下恰命中 `已收口`（∈ §1 词表）⇒ **现行接受** ⇒「讨论阶段已完成」被读成冻结；新谓词在**写入时**即拒（错误句回显词表 + 值形指引）——防复发 = 写入面机械拦，不靠人眼。
- **先红 / 先绿判读依据**：F11-A1 **先红**（现行谓词逐行推演：`hits=[已收口]` 恰一命中且 ∈ §1 词表 ⇒ 接受；新谓词 ⇒ 拒）；兼容-3（既有 C4 词表面）**先绿零改**——三格逐格判读同现行（见用例表兼容-3 行）。
- **note 落盘形态 = 状态行括注（裁定）**：`status value="进行中" note="F10/F11 进设计轮"` ⇒ 状态行 = `**状态行**：进行中（F10/F11 进设计轮）`。
  括注是真实需求（骨架占位行自带括注；散文说明无处可去时会被塞回 value = 事故复现路径）。
  note 值：单行（同 value 单行校验）+ **全词表零命中**（`Object.values(STATUS_WORDS)` 并集——括注永不误触 gate）+ 死占位判据零命中；落盘域 = 仅状态行行内（行级独占的唯一处不变，`updateSectionStatusLine` 承接）。

**裁定点③——F11-B create 参数补齐/归一化**：

- **`source` 参数**（新增 · 必填 · topic 同款 fail-closed 空拒）：落盘位置 = 骨架编制行 `来源 = <讨论来源>` 占位替换（`batch-skeleton.mjs:80`）；单行约束（同 topic）。create 时传了才可填，不传 = 死占位残留机检（F11-C）必然拒绝 append ⇒ create 即拒绝、留死占位无意义 = 死锁；topic 已立必填先例（`batch-lifecycle.mjs:123-126`），同款。
- **`prev` 剥前缀 = 幂等 strip**：`prev.replace(/^(?:前情\s*[=：:]\s*)+/g, "")`——`+` 量词 = 多重前缀一并剥净（幂等：无前缀值原样通过，单前缀剥一次，双前缀剥两次）。「strip 一次」会把双前缀剥成单前缀残留 = 半吊子归一化；归一化目的 = 值规范化，不是二次防错。默认值「无（独立批）」零变。
- **`<BATCH-ID>` 占位处置 = 删除**：① create 时台账编号尚不存在（create 不代建台账——既有红线）；② 自造序号 = 第二编号权威源（违 D2）且与台账编号冲突面；③ 需求判据允许「清除」——档头 = `# 2026-09-21 · tool-discipline`（无 ID 段），台账关联由 `> 台账 = #…` 行承载。**档名即唯一无歧义标识**（`docs/batches/<batch>-<topic>.md` 命名规约）。

**裁定点④——F11-C 占位残留机检（append/status 落笔前）**：

- **判据 = 骨架死占位枚举单源**（新常量 `TEMPLATE_PLACEHOLDERS`，住 `batch-skeleton.mjs` 与骨架模板同档单源）：`["<BATCH-ID>", "<讨论来源>", "#<编号>", "<板块>"]`（骨架产出全部死占位字面）。
- **判定域 = 档头结构行（值形）**（§6.20）：仅骨架生成的三类档头结构行参与判定（标题行 `# …` / 编制行 `> 编制` / 台账行 `> 台账`）——行内出现死占位字面 ⇒ 残留；正文（段体）对占位字面的引用 / 讨论**豁免**（引用非未填）。纯函数 `findPlaceholderResidue(src)` 住 skeleton 档（零 fs，消费 STATUS 单源同址）；返回 `[{line, text}]`，非空 ⇒ 拒，错误句逐行列残留（行号 = 档头域内 1-based 便于定位）。
- **档头两占位 `#<编号>` / `<板块>` 的填充路径与次序（消除新门与既有义务间的次序死锁）**（§6.20）：create 可选参 `ledger` / `board` **建即填**台账行
  （create 仍不代建台账条目 = 红线零变）；未给 ⇒ 占位留存——填充人 = **主 agent** · 时点 = **建档后、本档首个 append/status 之前** · 方式 = **普通文档写**
  （档头 boilerplate 不在段白名单内——改写 `> 台账 = …` 行；实态先例 = 批档档头 `> 台账 = #214/#215（TOOLS.md · 归批）`）。

  **次序句**：create（给参即填 ∥ 未给留占位 + 回执提示填法）⇒ 主 agent 填档头（`#<编号>` → 台账编号 · `<板块>` → 板块名）⇒ 本档首次 append/status 开放；未填 ⇒ 首写被 F11-C 拒（错误句逐行列残留行号 = 提示填充位置）——机检 = 次序约束的兜底，**非死锁**（填后立即放行）。
- **close 不拦**（收口是主 agent 终态动作，残留面由既有通道自查）+ **create 不拦**（骨架本身合法含占位）；gate 在写入面（append/status），挂点：append 于 gate/text 校验后 `insertIntoSection` 前（主档）；status 于 `assertStatusValue` 后写盘前（lifecycle）。

**行数与拆分评估（越 300 / 500 面——实施后预估；逐档结论 = 登记 / 拆分 / 触发）**：

- **`batch-lifecycle.mjs` ≈322——跨过 300 软线 ⇒ 须登记**。拆分候选位逐评：① **create 面**（`createBatchRecord` + `assertInsideBases` ≈55 行——自包含：参数面 + 越界判据 + 写盘）⇒ **首选拆分位**；② status 值域 + note 面（≈35 行——与 gate / 状态行落盘共享 `updateSectionStatusLine` 与词表单源消费，拆出需回指）⇒ 收益低；③ 占位机检挂点（≈10 行）⇒ 体量不足独立成档。
**结论 = 不拆**（登记 + 计划 + 触发）：改动 = 事务面共址（create / status / close + gate 单源纪律），322 距硬限余 178 行；**拆分计划** = 拆出候选位①为姊妹档 `batch-lifecycle-create.mjs`（余量预计 ≈267）；**消解条件 = 越 500 硬限 或 该档下次实质改动时**（先例：`session-lifecycle.mjs` 305 / `process-probe.mjs` 315）。
- **`batch.mjs` ≈424（>300 既有登记档）**——**维持登记不拆**（KD-4 已拆一轮：skeleton / lifecycle 外提；本次 = schema 增参 + 描述同步 + 挂点——点状）；**拆分位（后手）** = append 迁移面（`sanitizeText` / `insertIntoSection` ≈60 行）外提；消解条件 = 越 500 硬限 或 该档下次实质改动时。
两端运行面（CLI/VSC 产品代码）：**除该副本 pending 分支一处外零端改**——task/batch 实现与描述住核单源，两端装配同调核 `assembleFamilyTools`（单源即双端一致·F3/F7 语义）。
**守卫面 = 双源结构**（守卫副本非核单源——端差默认 = 消）：催更门在两端各持一份守卫——核 `agent/completion.mjs:56-63` · VSC 副本 `thincoder-vscode/src/agent/run-stages.mjs:86-101`（`maybeGuardPushbacks`）。

本节同步该副本 pending 分支 `:92`（补 `!agent.config?.agent?.engineering`——该副本 advisor 分支 `:155` 已有同款条件）；其余端面零改。

**用例表**（需求判定句逐条映射——宿主档钉死）：

| # | 判定/用例 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| F10-1 | 工程模式拒 | `taskTool.execute({items:[…]},{agent:{config:{agent:{engineering:true}},tasks:[…]}})` | 错误句含 `engineering` ∧ `agent.tasks` 零变 | core 单测档 |
| F10-2 | 普通模式零变 | 同调用无 engineering（或 false） | 成功回执 `Task list updated`（既有语义） | core 单测档 |
| F10-3 | 装配两态 | `assembleFamilyTools({depth:0,engineering:true})` | 返回不含 `task`；`{engineering:false}` 含 `task`（普通段逐字零变） | core 单测档 |
| F10-4 | 子代理面 | eng 子代理装配（depth>0 eng 角色） | 返回不含 `task` | core 单测档 |
| F10-5 | 催更门排除 | completion 门判据（pending ∧ engineering） | 工程模式不发催更（既有测试零回归） | core 单测档（门为纯分支——宿主归并） |
| F11-A1 | 非法值拒+词表回显（**先红**——现行子串谓词接受该值；新谓词余核 `讨论已收口` ≠ 关键词 ⇒ 拒） | `status value="讨论已收口 2026-09-21"`（§1） | 拒，错误句含词表 `进行中 / 已收口` | core 单测档 |
| F11-A2 | note 括注落盘 | `status value="进行中" note="F10/F11 进设计轮"` | 状态行 = `**状态行**：进行中（F10/F11 进设计轮）` | core 单测档 |
| F11-A3 | note 无 note = 纯值 | `status value="设计完成"`（§2） | 状态行 = `**状态行**：设计完成`（无括注） | core 单测档 |
| F11-A4 | note 词表/占位零命中 | `status value="进行中" note="已收口"` | 拒（note 含冻结词） | core 单测档 |
| F11-B1 | source 必填 | `create` 缺 source（其他齐） | 拒——`create requires source` | core 单测档 |
| F11-B2 | source 落盘 | `create source="用户 22:47 双提问" …` | 编制行 = `来源 = 用户 22:47 双提问` | core 单测档 |
| F11-B3 | prev 幂等剥 | `prev="前情 = 前情 = X"` / `prev="前情 = X"` / `prev="X"` | 落盘行均 = `前情 = X`（单前缀） | core 单测档 |
| F11-B4 | BATCH-ID 删除 | `create` 正例 | 档头 = `# <date> · <topic>`（无 `（<BATCH-ID>）`）；断言反转既有 C1 | core 单测档 |
| F11-C1 | append 占位拒 | 目标段内含 `#<编号>` 残留时 append | 拒，错误句逐行列残留（行号 + 文本） | core 单测档 |
| F11-C2 | status 占位拒 | 目标段内含 `<讨论来源>` 时 status | 拒，同上 | core 单测档 |
| F11-C3 | 判定域域限 | §5 含占位、写 §2 | §2 append 成功（他段占位不拦） | core 单测档 |
| F11-C4 | 模板占位合法暂存 | §4 append 含 `<§4 模板占位：…>` 行 | 成功（骨架枚举只拦死占位） | core 单测档 |
| 兼容-1 | 冻结门语义零变 | 已收口档 append/status/close（夹具 = 手写 `record("✅ 已收口 …")` / 无状态行档） | 既有 C6/C7/T10 全绿零改——夹具档头无死占位 ⇒ F11-C 零触及；gate 读侧子串谓词零变 | core 单测档 |
| 兼容-2 | 六段/一段一作者零变 | append 越段（`:266-283`）/ 骨架保护（C8 · C10） | 手写档夹具全绿零改（档头无死占位）；**例外 = 真 create→append 型两夹具（C1 `:75→:92` · AC-11 `:350-352`）⇒ 补档头填充步 Δ**（`create` 后、`append` 前以普通文档写替换 `#<编号>`/`<板块>`） | core 单测档 |
| 兼容-3 | 词表校验既有语义 | 双词/词表外/缺 value（C4 三格） | 既有 C4 全绿零改——新谓词逐格判读同现行：`✅ 设计完成 2026-09-21` = 白名单装饰 ⇒ 接受 · `随便写写` = 0 命中 ⇒ 拒 · `进行中又已收口` = 多命中先判 ⇒ 拒 | core 单测档 |
| VSC-1 | 端转口同集 | VSC 端转口登记册单测 | 全绿（登记册零改——既有零回归） | vsc 既有 |
| VSC-2 | 工程段断言同步 | VSC 工程段装配单测 | 工程段 = timer…（无 task）断言更新后全绿 | vsc 单测档 |
| VSC-3 | 端侧催更门排除（VSC 副本直驱） | 直驱 `maybeGuardPushbacks`——桩 agent：`_tasks` 含 pending ∧ `engineering=true`（advisor/verify 面不构成候选） | 零推回（返回 false · 零提醒注入） | vsc 单测档 |

**边界（本节不做）**：台账工具自身零改（六态 enum 已是对照面）· eng/plan/escalate 既有门零改 · 普通模式 task 行为零变（不移注册不加开关）· batch 六段结构 / 一段一作者 / 冻结门语义零变（段内写入纪律 = 段内一个写面，判据单源 = `BATCH-RECORD.md` §4.19） · 散文纪律句不删 · 铁律 3 提示词分支 = PROMPT-SYSTEM 板块（本节带上——条目文本 = §6.15.2「提示词面条目文本」逐字固化；落档 = eng-coder（内容依据 = 机制文档））。

VSC 副本 verify guard 分支同类缺差（`thincoder-vscode/src/agent/run-stages.mjs:105` 零 engineering 条件 vs 核 `thincoder-core/agent/completion.mjs:75` 有）= **随本节收口（hygiene-sweep 面）**。

**提示词面条目文本（逐字固化——三撞点 = 提示词面（`thincoder-core/prompts/`）的 `thincoder-core/prompts/discipline-engineering.md` §🔴 铁律 · 第 3 条 / §基本流程 · 步骤 1「需求完成判据」 · `thincoder-core/prompts/persona-engineering.md` §Dispatch & close discipline 的 `Debts go on the list`）**：

① **铁律 3**（`thincoder-core/prompts/discipline-engineering.md` §🔴 铁律 · 第 3 条）——现行（EN）：
「**Work is tracked by the batch record + the ledger**: after requirements are confirmed, build task entries one per requirement (entries land in batch record §2 + ledger rows);

 no entry = the requirement hasn't landed.

 (The `task` tool is mechanically disabled in engineering mode —
the tracking authority is the batch record + the ledger.)」

② **需求完成判据**（`thincoder-core/prompts/discipline-engineering.md` §基本流程 · 步骤 1「需求完成判据」）——现行（EN）「…build task entries one per requirement — **the batch record §2 entry table + ledger rows** are the marker that requirements were accepted.」

③ **欠账入清单**（`thincoder-core/prompts/persona-engineering.md` §Dispatch & close discipline 的 `Debts go on the list`）——现行「**欠账入清单**：未发 / 未完成的自有事项 ⇒ **立即写进任务清单**（或批次档 §6 未决）——欠账**必须看得见**，不得只活在报告文字里、靠用户催问兑现。」

   建议（EN）「**Debts go on the list**: undispatched / unfinished items of your own ⇒ **immediately written into batch record §6 unresolved (or a ledger row)** — debts **must be visible**, never living only in report prose waiting for the user to chase.」

改因（一句）：F10 机械门上线后工程模式 `task` 调用被拒——三处仍指挥 / 引指 task 的句子 = 自相矛盾态（撞点修复）；提示词 = 产品代码（`thincoder-core/prompts/`，eng-coder 笔）。

#### 6.15.3 F10 第三面——auto-turn digest 域的模式变体

**处置 = 平行导出 + 两侧按模式选串**（承父侧裁定；**变体文本内容依据 = 机制文档**）：

- **核**：`thincoder-core/agent/helpers.mjs` 新增平行导出 **`AUTO_TURN_DIGEST_DOMAIN_ENG`**（单行 · 无换行；注 = 内容依据 = 机制文档 + 出处指针 = `AGENT-LOOP-ASYNC-POOL.md` §6.8 与本条）；普通档常量逐字零变。
- **选串单点两处**（同一规则 = `agent.config.agent.engineering` 真值）：核注入点 `thincoder-core/agent/run-start.mjs:100` 三元（三拆前 `thincoder-core/agent.mjs:170`）+ VSC 组合点 `composeTurnDomain`——两级选择（轮型 → 模式）同式（核 / 端各一处 = 非构成差异）。
- **ask 唤醒轮不受模式影响**：`UPSTREAM_TURN_DOMAIN` 无 task 指针 ⇒ 该轮基座选择零变（变体只挂 digest 基座）。

**变体正文（逐字 = 父侧所出；规范落点 = 本条；下方按行宽折行展示，实现时 = 单行）**：

```text
[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only:
1) summarize each finished report's key points into this conversation for the user to read later;
2) (engineering mode: the task tool is disabled — no task-list update is expected this turn; the batch record + ledger are the tracking authority and are updated in real user turns);
3) write decision points with a suggested next step as text — do not execute it.
FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]
```

**接口契约**：

| 档 | 改点 | 形态 |
|---|---|---|
| 核 `thincoder-core/agent/helpers.mjs` | 常量面 | 平行导出 `AUTO_TURN_DIGEST_DOMAIN_ENG`（普通档 `AUTO_TURN_DIGEST_DOMAIN` 零改） |
| 核 `thincoder-core/agent.mjs:170-171` | 注入点选串 | `upstreamTurn ? UPSTREAM_TURN_DOMAIN : (engineering ? AUTO_TURN_DIGEST_DOMAIN_ENG : AUTO_TURN_DIGEST_DOMAIN)`（注入条件 / `transient` / 位置零改） |
| VSC `turn-domains.mjs` | 组合点选基座 | `composeTurnDomain(upstreamTurn, engineering = false)`——默认 `false` ⇒ 既有调用与断言零回归；端 overlay 恒在场（组合形态零改） |
| VSC `thincoder-vscode/src/agent.mjs:123` | 调用点传模式 | 恰一行内改：第二实参 = `agent.config?.agent?.engineering === true`（模式读法与核侧同键） |
| VSC `setup-reminders.mjs` | W15 转口表 | +1 名（端侧零自持基座副本——结构性守护 = VSC 上游对位单测既有「零核基座文本字面」否定检查，`[System reminder: auto-turn` 前缀为两变体共性 ⇒ 覆盖范围不变） |


**用例表（第三面）**：

| # | 判定/用例 | 输入 | 期望输出 | 宿主（建议） |
|---|---|---|---|---|
| DOM-C1 | 常量行为：普通档逐字零变 + 变体形态 | 两常量（`thincoder-core/agent/helpers.mjs`） | 普通档 = 既有文本逐字（含 clause 2）；变体 = 单行 / `]` 收尾 / 含 `disabled` 与「batch record + ledger」指引 ∧ 零「update the task list with the task tool (allowed)」 | core 单测档 |
| DOM-C2 | 核选串结构机检 | `agent.mjs` 源文本 | `AUTO_TURN_DIGEST_DOMAIN_ENG` 恰 1 处 ∧ 与 `(autoTurn \|\| upstreamTurn)` 同段（注入点三元内） | 同档 |
| DOM-V1 | VSC 组合点两模式（行为） | `composeTurnDomain(false, false)` / `composeTurnDomain(false, true)` | 前者 = 普通 digest 基座起头 + overlay；后者 = 工程变体基座起头 + overlay（两值 overlay 段逐字同） | vsc 单测档（T-VS-U7 扩格） |
| DOM-V2 | 默认参数零回归 + 唤醒轮不受模式影响 | `composeTurnDomain(false)` / `composeTurnDomain(true, true)` | 前者 = 普通 digest 基座（既有断言零改）；后者 = `UPSTREAM_TURN_DOMAIN` 起头（模式不改唤醒轮） | 同档 |
| DOM-V3 | 端侧结构 + 转口 | 源文本 | `turn-domains.mjs` 零核基座文本字面（既有否定零改）；`setup-reminders.mjs` 含新名；`thincoder-vscode/src/agent.mjs` 组合调用恰 1 处 ∧ 传模式 | 同档（T-VS-U5 / U12 同步） |

**边界（第三面不做）**：不动 `UPSTREAM_TURN_DOMAIN` 与唤醒轮基座选择 · 不动注入条件（`!autoApprove` 门）与 `transient` / 位置 · 不新增配置开关、不改机械拒绝面（装配摘除 + execute 拒零变）·
提示词面零改 · 压缩后重注入面（`context.mjs`）与 `verify.mjs` 回声（已判非指挥语）零动 · 普通模式文本与行为逐字零变。

### 6.16 子代面 `question` 过滤

**判据（单源）**：**depth>0 工具表一律不含 `question`**——交互工具要有活人在环，子代没有可问的用户；该排除与「只读过滤」同族（都是**装配层按面裁表**），判据 = 一个具名排除集 + 一个按面裁表谓词（不住各调用点各自写字面）。

| 面 | 现状 | 处置 |
|---|---|---|
| 静态注册表 | `thincoder-core/tools/index.mjs:19-27` 内置表含 `questionTool`（`:23`）——实例无关表，主会话 / 子代同源 | **零改**（静态表不动 = 主会话面零改的机械保证） |
| 子代 · spawn | `thincoder-core/agent-tools/subagent-spawn.mjs:251-258`——探 / 规走只读过滤，其余角色父表直传 | 两分支同过排除谓词 |
| 子代 · escalate（同步） | `thincoder-core/agent-tools/subagent-actions.mjs:409-416`——父表直传 | 同过排除谓词 |
| 子代 · escalate（异步） | `thincoder-core/agent-tools/escalate-async.mjs:193-201`——父表直传 | 同过排除谓词 |
| 子代 · consult | `thincoder-core/agent-tools/consult.mjs:268-273`——只读过滤 + `main_history` | 继承面同过排除谓词（`main_history` 不属继承面） |
| 主会话（两端） | CLI 经 `assembleBuiltinTools`（`thincoder-core/tools/index.mjs:57-78`）；VSC 端自持清单（`thincoder-vscode/src/tools/index.mjs`） | **零改**——`question` 在职；机械门（无 UI 抛错）保留为第二道防线 |
| VSC 端自持 depth>0 装配 | `thincoder-vscode/src/agent/setup-tooltable.mjs:296-300`——已按 `depth === 0 || t.name !== "question"` 过滤（行为正确，字面 = 第二份） | 字面改消费核单源排除集（`SUBAGENT_TOOL_EXCLUSIONS.has(t.name)`；谓词 `excludeSubagentTools(` = 核四点调用形态；**行为零变**——消第二份字面，防漂移） |

**单源落点**：`thincoder-core/agent/helpers.mjs`——与只读谓词 `readonlyToolNames` 同址新增排除集（`question` 唯一成员）与按面裁表谓词（恒返回新数组，不改父表、不别名）；`thincoder-core/agent.mjs` 的两处再导出面（`:21-32` / `:48-53`）补两名——子代装配点从 `../agent.mjs` 取用，import 面零改。

**生效面与装配序**：子代工具表 = 「**角色选择**（只读 / 全表）→ **排除谓词**」——排除恒在最后一步（两序等价性不得写成分支差异）。
生效面 = 发给 provider 的工具 schema ∧ 执行面 `toolByName`（两者同源自子代的 `tools` 绑定值——`thincoder-core/agent/setup.mjs:163-171` 的展开面 = 绑定值 + 家族段 + caller 注入）。

**传子**（受限通道：`eng-coder` / `eng-designer` 的子通道只开 `explore`——`thincoder-core/agent/family-tools.mjs:171-172`）经父绑定值继承 ⇒ 排除随绑定传递，嵌套子代同判。

**措辞面**（`question-ui-face` 锚——核内锚位 = `thincoder-core/tool-docs/question.md:11`；两取值同判据 · 各端自持，失败形态 / UI 形态按端注入（端差登记 = §6.11））：

| 端 | 取值 |
|---|---|
| CLI（`thincoder-cli/src/prompt-injections.mjs:19`） | **取值（逐字）**——「- Availability: this tool needs an interactive UI — in contexts without one (headless runs) it returns an error instead of asking; subagent children (depth>0) never get it (excluded from their tool tables); put the question in your reply text instead.」（headless 主会话面的机械门语义保持准确） |
| VSC（`thincoder-vscode/src/prompt-injections.mjs:20`） | **取值（逐字）**：「- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.」（锚定装配规则——语义 = 子代面无此工具） |

过滤后该行只对**持有者**（depth-0）渲染 ⇒ 子代面自然失效（子代不再装载该工具描述）。

**边界（本节不做）**：不动工具本体（不删 `question`、不改 `thincoder-core/tools/question.mjs` 的机械门与上限校验）· 不动静态注册表与主会话 / headless 面的**机制**（含 CLI 侧 ACP 排除面 `thincoder-cli/src/acp.mjs:67`；注入措辞面不在本句射程——取值 = 本节措辞面表）· 人格档文案零改（路由指引已在位）· 其他工具零动 · 不加配置开关、不加用户选项 · 只读过滤语义零变（`explore` / `plan` / `consult` 的只读面逐字零变）。

> 判定（用例 A30–A33）/ 验收回指 = 本节内（本档不重述）。

### 6.17 工具钩子消费单源：`touchedPaths` 守卫对齐 + 判据归一

**消费点逐点（行号 = 现盘重锚）**：

| # | 消费点 | 形态 | 守卫 |
|---|---|---|---|
| 1 | `thincoder-core/agent/dispatch-run.mjs:82` · `:136`（执行即刻记账 `noteExecutedMutation`） | `args ?? {}` + `[args?.path]` | 有（try/catch 包体） |
| 2 | `thincoder-core/agent/dispatch.mjs:97`（工程设计闸） | `touchedPaths(args)` + `[args.path]` | **无** |
| 3 | `thincoder-core/agent/dispatch.mjs:139`（D5 冻结窗） | `touchedPaths(args)` + `[args.path]` | 有（try/catch → `[]`） |
| 4 | `thincoder-core/agent/record-results.mjs:157`（`_touchedFiles` 落账 `:161` + 重建索引 `:169`） | `touchedPaths(args)` + `[args.path]`；`:156` 二次 `JSON.parse` 无守卫（现盘重锚） | **无** |
| 5 | `thincoder-core/agent/turn-loop.mjs:235`（中断分支记账——落账 `:238`） | `touchedPaths(args)` + `[args.path]` | 有（try/catch 包体） |
| 6 | `thincoder-core/peer-domains.mjs:80`（L3 写前查 + 足迹登记） | `touchedPaths(args ?? {})` | **无**（调用本体无零抛兜底） |
| 7 | `thincoder-vscode/src/agent/tool-gates.mjs:23`（`l3TouchedPaths` 定义——端侧路径提取单源） | `touchedPaths(args ?? {})` + 尾 `.filter`（裁定 5 落地后 = 整面转调单源谓词 + `toolName` 参删） | **无** |
| 8 | `thincoder-vscode/src/agent/execute-tools.mjs:351`（`_touchedFiles` 记账） | `touchedPaths(args)` + `[args?.path]` | **无** |
| 9 | `thincoder-vscode/src/agent/tool-gates.mjs:90`（工程设计闸） | `touchedPaths(args)` + `[args.path]` | **无** |
| 10 | `thincoder-vscode/src/agent/rules-face.mjs:103`（作用域规则 JIT） | `touchedPaths(args ?? {})` + `(raw ?? [])` | **无** |

**裁定（一谓词三面收敛）**：

1. **单源提取谓词 `toolTouchPaths(tool, args)`**——落 `thincoder-core/agent/helpers.mjs`（与 `FILE_MUTATORS` / 子代排除集同址：两树共引的守卫谓词面）。契约：
   - `args` 为 null 或非对象 ⇒ 一律规范化为 `{}` 再交钩子；有钩子 ⇒ **钩子裁决**；无钩子 ⇒ `[args.path]` 兜底（形态零变）；
   - **`file_ops` 动作感知**（无钩子径）：`action === "copy"` ⇒ `[args.dest]`（源仅读取，不属写域）；`move` / `rename` / 未知或缺失 `action` ⇒ `[args.source, args.dest]`（保守双算）；
     钩子在位 ⇒ 仍以钩子裁决为先（现两树 `file_ops` 零钩子——`thincoder-core/tools/ops.mjs:17-44` 无 `touchedPaths`；动作枚举 = `move` / `copy` / `rename`）；
   - 钩子 throw / 返回非数组 ⇒ `[]`；
   - **不过滤非字符串项**（「未知路径 ⇒ 保守」判据归门禁自身——T-22 用例语义零变）。
2. **十处消费点一律改调该谓词**：未守卫七处为行为变更（`args = null` 从裸抛变为成形结果）；已守卫三处为**零变对齐**（其 try/catch 外壳随之退休——谓词内部即保险）。
3. **判据归一**：ACP 桥 `edit` 路由判据由 `Array.isArray(args?.edits)` 改为**真值判**（与核 `execute` 同判据）——`edits` 真值 ⇒ 批量分支（共享容器守卫、同一错误面）；`edits` 假值 ⇒ 单形态面。分歧形态（真值非数组 + 合法单形态参数）此后两通道同拒，**「桥径单形态应用」分支消除**。
4. **前提机检**：`[]` 零触达语义以「该调用必败」为支撑——以用例固定该前提：`FILE_MUTATORS` 六成员 × 畸形入参（`args = null`；`edit` 的 `edits` 真值非数组）⇒ `execute` **必败** ∧ 目标文件零变更（形态据实施轮先跑读数定——`Error:` 串 ∥ 抛错；判据只取「必败 ∧ 零变更」，形态不参与判定）。

5. **`file_ops` 动作感知入谓词 + 端特例分支清零**（**用户裁「先修正核、再单源化」**）：核 `peer-domains.mjs` 的 `file_ops` 双算特例分支与端 `tool-gates.mjs` 的 `l3TouchedPaths` 本地分支**双删**（两侧整面走谓词；
   端 `l3TouchedPaths` 的 `toolName` 参数随删——两个调用点（`thincoder-vscode/src/agent/tool-gates.mjs` · `thincoder-vscode/src/agent/execute-tools.mjs`）同步改签名，仓内零测试消费者）。
   **十消费点语义复核**（核 6 / 端 4）：行为变仅两处——
   ① 核 #6 `thincoder-core/peer-domains.mjs`（L3 写前查 / 足迹登记）：`copy` 源不再计入写域（本裁定目标面）；

   ② 端 #10 `thincoder-vscode/src/agent/rules-face.mjs`（作用域规则 JIT）：`file_ops` 覆盖范围**由死转活**——谓词对 `file_ops` 按动作感知返写域（`[args.path]` 兜底对该工具不成立）⇒ 该工具在 `PATH_TOOLS` 内有候选；本裁定如实登记为行为面变化。

   **补一格用例位**：`file_ops` `copy` / `move` ⇒ 作用域规则候选命中——落点 = VSC 作用域规则单测档（T-B3 族续编——`file_ops` 径；用例 = T-B3b）。
   其余八点零变（核 #1–#5 与端 #8 / #9 由 `FILE_MUTATORS` 门卫隔断——`file_ops` 不达；端 #7 `l3TouchedPaths` 端侧本已 `copy ⇒ dest`）。

**已批判据零改（明示）**：`thincoder-core/tools/file.mjs:257` 的容器守卫（真值非数组 ⇒ `[]`、不虚报顶层 path）**语义零改**——裁定 3 恢复其前提（该调用必败）后，`[]` 的语义重新为真。

**接口契约（实现面）**：

| 面 | 落点 | 形态 |
|---|---|---|
| 谓词 | `thincoder-core/agent/helpers.mjs` | `export function toolTouchPaths(tool, args)` → 恒数组 · 恒零抛 |
| 核消费 | `thincoder-core/agent/dispatch.mjs` · `thincoder-core/agent/record-results.mjs` · `thincoder-core/agent/turn-loop.mjs`（三拆后——中断分支记账） · `thincoder-core/peer-domains.mjs` | 六处替换调用（#1/#3/#5 的旧 try/catch 外壳退休；**#5 现存 try/catch = `JSON.parse` 失败降级——非外壳**） |
| 端消费 | `thincoder-vscode/src/agent/tool-gates.mjs` · `thincoder-vscode/src/agent/execute-tools.mjs` · `thincoder-vscode/src/agent/rules-face.mjs` | 四处替换调用；`l3TouchedPaths` 整面转调谓词（零本地 `file_ops` 分支——动作感知随核单源） |
| 桥判据 | `thincoder-cli/src/acp/bridge.mjs` | `edit` 路由：`Boolean(args?.edits)` 单点取值，条件与分支同用 |

**登记面判定（桥路由归一 · 裁定 3）**：判 = **纯缺陷修复**（判据未变——桥向核对齐；窄形态 = 畸形入参的 fail-open 面收口）⇒ **零对外契约登记、零 CHANGELOG 行**
（§4 契约表的「登记 + CHANGELOG」管归一变更 / 模型可见**新形态**，本项不属）；**发布关联** = 修复随下一代 CLI 发布（发布动作 = 用户门——照 §6.14 先例）。

**登记面判定（`file_ops` 动作感知 · 裁定 5）**：判 = **纯缺陷修复**（写域语义收正 + 端特例分支清零；端 `conflicts` 判据向核单源对齐——判据未变、无模型可见新形态）⇒ **零对外契约登记、零 CHANGELOG 行**；**发布关联** = 修复随下一代发布（发布动作 = 用户门——照 §6.14 先例）。

**边界（本节不做）**：不改钩子本体语义（`thincoder-core/tools/file.mjs` 零改）· 不改门禁对空路径集的判据（T-22 语义保持）· 不动 `touchedPaths` 契约形状（仍是「工具自报 · 可选钩子」）· 不新增工具面标记 / 配置开关。

> 用例表 / 验收回指 = 本节内（本档不重述）。

### 6.18 node 语义子进程启动面（Electron 宿主）

**判据与单点（核件新增）**：`thincoder-core/tools/node-child.mjs`（**已落**）—— `nodeChildEnv(base = process.env, isElectron = !!process.versions.electron)`：

- `isElectron` 真 ⇒ 返回 `{ ...base, ELECTRON_RUN_AS_NODE: "1" }`（Electron 二进制以 node 语义启动；副本——不改父进程 env）；
- 假 ⇒ **原样返回 `base`**（同引用——spawn 缺省继承语义，逐字零变）。

判据语义 = 「本进程运行时是 Electron ⇒ `process.execPath` 属 Electron 族二进制」——**运行时能力探测，非端名分支**（三端同判据、同式执行；契约 5「端差以注入表达」（`docs/core/design/CORE-UNIFICATION.md` §2.2）的注入缝承载的是端差值，本项无端差值可注入）。
 已处 node 模式的 Electron 宿主（如 VS Code 扩展宿主——env 携旗标）为**同值幂等**。第二参 = 判据注入（机检用缺省参——先例 `_setGitTimeoutForTest` 族）。

**消费点（全量）**：

| # | 消费点 | 接入形 |
|---|---|---|
| 1 | `thincoder-core/tools/execute.mjs` `runNode` spawn 选项（`:85`——`env` 行 `:88`） | `env: nodeChildEnv()`——inline（`:227`）∕ scriptFile（`:219`）两径与 `nodeArgs` 直通（只进 args）均经 `runNode`（`:230`）⇒ 单点全覆盖、零旁路 |
| 2 | `thincoder-core/tools/linter.mjs` `nodeCheckResult`（`:51`，`node --check` 快路径） | `runCommand(process.execPath, ["--check", abs], { timeout, signal, env: nodeChildEnv() })` |
| 3 | `thincoder-core/tools/exec-run.mjs` `defaultRun`（`:40-45`，承载 2 号） | 补 `opts.env` 透传；注入径 `runInterruptible`（`:60`）本已读 `env` ⇒ 执行面契约收敛为 `{ cwd?, timeout?, signal?, env? }` |

**清扫（execPath 消费点 · 全仓）**：产品码消费为 node 语义者**仅核内 2 处**（= 上表 1 / 2 号——修复）；CLI 产品面 1 处（TUI 自重启 `wrapped-spawn.mjs:48`——宿主恒 node）与工程 ∕ 测试 9 档（node 直跑）前提成立、**零动作**；VSC ∕ desktop 产品面 `src/**` 实读**零** `spawn(process.execPath`（VSC 扩展宿主内跑核件 ⇒ 经 1 / 2 号修复受益）。

**邻类（非 execPath——登记，零动作）**：以 PATH 解析 `"node"` 的两处核内点（`thincoder-core/tools/shared.mjs:247` `autoSyntaxCheck` · `thincoder-core/agent-tools/verify.mjs:202` 语法提示）+ 配置驱动外部命令面（`hooks` ∕ `mcp` ∕ `lsp` 的 `command`）——桌面无 PATH-node 场景的语义退化属另立条目面（非本段）。

**边界**：旗标随 env 继承至后代（node 语义传递——同扩展宿主现状）· 不涉审批 ∕ 安全 ∕ schema ∕ 超时树杀语义 · 不覆盖 PATH 外部命令面 · **打包面**：依赖 Electron `RunAsNode` fuse 在线（现仓零 fuses 配置：`thincoder-desktop/package.json` 无 `build` 键、无 `electron-builder.*` 配置档）——打包批需登记该前提。

> 用例表 ∕ 验收回指 = 本节内（本档不重述）。

### 6.19 后台任务族：`bash` 异步 ∥ 后台执行 ＋ `browser` 后台动作（设计权威 = `BROWSER-TOOL.md` §2.11）

**机制**（池面实现 = `thincoder-core/agent-tools/bash-async.mjs`（**已落**））：

- **起跑**：`bash` 参数面 +`async: boolean`（可选；缺省 false = 现行同步径逐字零变）；形 = `bash { command, async: true }`。前置两件同保留（`gitGuardSnapshot` ∥ `posixSyntaxHint`）；审批 = 起跑即走既有权限门（同同步径）。
- **ack**：起跑即返 `bash#<id> started (running) — log: <logPath>`（取号沿两池共用 `nextSubagentId` 命名空间——`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.10；`bash#N` 前缀区分域）。
- **池**：新分域池 `_bgTasks`（模式照 `_asyncAdvisors`——独立池 + 载体字段登记；条目 = `{id, command, child, logPath, done, status, startedAt}`）；池面单点 = `thincoder-core/agent-tools/bash-async.mjs`（**已落**——起跑 ∥ 结算 ∥ 杀 ∥ 清点）。
- **输出面**：全量流式落盘 `configDir/tool-results/<ts>-bash-<id>.log`（同目录 + 轮转复用）；内存侧尾部环形缓冲（注入用）；运行中取件 = `read`。
- **送达（settle）**：进程退出/被杀 ⇒ 结算 ⇒ digest 注入单点族：状态行（命令 ∥ 退出码/被杀 ∥ 耗时 ∥ log 路径）+ 尾部（≤120 行 ∧ ≤8KB 双帽 + 截尾注记）；全量恒在 log（注入不经预算 offload）。
- **等待面**：`wait_for` 条件族 +`bash id:N done`（判据同式 `subagent id:N done`——池内 done ∥ 出池即 done）。
- **终止面**：`process` 工具 +`kill` action（靶 = `pid` ∥ `id` 二选一；id ⇒ 池条目杀树 + 出池 + 墓碑；重复 = 幂等；审批 = 破坏性同径）——`tool-docs` 两处文本（`thincoder-core/tool-docs/process.md:10` 欠面 ∥ `thincoder-core/tool-docs/wait_for.md:4-9` 条件枚举）**已落**。
- **超时语义**：async 起跑不收默认 120s（长任务 = 本形目的）；显式 `timeout` 仍生效（到点杀树 + settle 状态 `killed: timeout`）；同步径默认 120s 照旧（§6.4 同句已限定）。
- **收尾两档**：回合中断（停回合续跑）⇒ 不杀（F2 同款豁免——`docs/core/design/CONSULTATION.md`）；会话中止 ⇒ 逐条杀树 + 出池 + 墓碑（D-CO4 同规则）。
- **帽**：`BG_TASK_MAX = 4`（对齐 `ASYNC_POOL_LIMITS` 单域 4）；超限显式拒（不静默）。
- **depth 门**：`async` 参仅 depth-0——主落点 = 深度排除单点 `thincoder-core/agent/helpers.mjs`（`excludeSubagentTools`——对 `bash` 副本删 `async` 参）；第二道 = execute 面（`ctx.depth > 0 ∧ async` ⇒ 显式拒）；子代理 bash 同步照旧。
- **边界**：跨会话存活 = 不做（会话结束即清）；可见面 v1 = 不做（面板块 / 状态行段——登记边界）。

**接口契约（实现面）**：

| 面 | 落点 | 形态 |
|---|---|---|
| 参数面 | `thincoder-core/tools/bash.mjs` | +可选参 `async: boolean`（缺省 false）——async 键 + `timeout` ∥ `filter` 两描述消歧（消「async/120s」与「filter」歧义）；同步径逐字零变 |
| 池面 | `thincoder-core/agent-tools/bash-async.mjs`（**已落**） | 池 / 起跑 / 结算 / 杀 / 清点单点 |
| 等待面 | `thincoder-core/tools/ops.mjs` | `wait_for` 条件族 +`bash id:N done` |
| 终止面 | `thincoder-core/tools/ops.mjs` | `process` +`kill` action（靶 `pid` ∥ `id`） |
| depth 门 | `thincoder-core/agent/helpers.mjs` | 副本删参（单点）；execute 面第二道拒 |
| 注入面 | `thincoder-core/agent-tools/async-settle.mjs` | 域表接入 + 载体字段登记 |
| 挂起面 | `thincoder-core/agent/suspension.mjs` | `poolLive` 并集扩第三域 |
| 收尾面 | `thincoder-core/agent-tools/async-discard.mjs` | 中断豁免 ∥ 会话中止两档（逐条杀树 + 墓碑） |

**关键决策**：择任务池（口径统一硬要求）· 独立池 `_bgTasks` · async 默认无超时 · 跨会话不存活 · kill 收编 `process` · 注入恒尾截 + 全量在 log · 收尾两档。

**`browser` 后台动作**：`browser` 参数面 +`async: boolean`（depth-0 专项——删参单点 ∥ execute 面第二道，同 bash 双线）；池 = `_browserTasks`（帽 `BROWSER_TASK_MAX = 4`）；ack = `browser#<id> started (running) — <action> <subject>`；

后台动作仍走同一串行队列（单页不引入并发）；结算 = 恒停靠 + 摘要注入（`injectBrowserResult`——完成 ∥ 失败 ∥ 被杀三态；取消无摘要）+ 取号扫描 ∥ 挂起活度 ∥ 收尾档同族并入；等待面 ∥ 终止面 = `wait_for` 条件 `browser id:N done` ∥ `process` kill id 路由（先 bg 后 browser——两族皆未命中 ⇒ 合并错误句，`thincoder-core/tools/ops.mjs:109`）。

> 用例表 ∕ 验收回指 = 本节内（本档不重述）。

### 6.20 工具面首用可发现性：batch 档头可填性 + 死占位判据可辨性

**来源**：需求 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §8.2「工具面自解释」。本档面 = ②③ 两件；①（spawn 六字段入描述面）= `AGENT-LOOP-SUBAGENT.md` §6.30（D2——本档不重述）。

**② 批档档头可填性（create 增 `ledger` / `board` 可选参——建即填）**：

- 参数面（`thincoder-core/agent-tools/batch.mjs` schema；插位 = `source` 属性后）：`ledger`（台账编号——如 `#938`）· `board`（板块——如 `core`）；两参皆可选。**契约行单源（归一 ∥ 单行 ∥ 空串 ≡ 未给）= `BATCH-RECORD.md` §4.11**；本节 = 逐字文本面（schema description ∥ 回执 ∥ 拒句 ∥ 骨架行实参），不重述契约。
- 骨架面（`batch-skeleton.mjs` `batchSkeleton({ date, topic, source, prev, ledger = null, board = null })`）：给参 ⇒ 台账行占位实参化——**无死占位产出**；未给 ⇒ 保持占位字面（4 参旧调用形输出零变 = 回归）。
- 回执面（`batch-lifecycle.mjs` create 回执）：两参皆给 ⇒ 回执标注已填（`header 台账 line filled (${ledger} · ${board})`）、不提示；未给（任一）⇒ 补句（逐字）：
  `header 台账 placeholder(s) remain — fill them by file edit before the record's first append/status opens`；create 仍不代建台账条目（红线零变）。
- 骨架行逐字（`batchSkeleton` 台账行实参面）：`> 台账 = ${ledger ?? "#<编号>"}（${board ?? "<板块>"} · 归批）。前情 = ${prev}。`
- schema 两键 description 逐字（模型可见文本——实施者照抄）：

| 键 | 逐字 |
|---|---|
| `ledger` | `create only — optional: the ledger entry number for the header's 台账 line (e.g. "#938"; a leading # is added if missing). Passed together with board, it fills the header at creation; when omitted, the placeholder stays and must be filled by file edit before the record's first append/status.` |
| `board` | `create only — optional: the owning board for the header's 台账 line (e.g. "core"). See ledger — both fill the header at creation.` |

- 两条新拒句逐字（模型可见文本——实施者照抄）：

| 拒句 | 逐字 |
|---|---|
| 创建期单行拒 | `batch: create ledger / board must be single lines — a multi-line value would break the header's 台账 line. Nothing was written.` |
| 残留拒句（`placeholderResidueError`） | `batch: 骨架死占位残留 — the batch record's header still carries skeleton placeholders. Fill them before writing: create with ledger / board fills the 台账 line at creation; otherwise the main agent fills the header by file edit ⇒ the record's first append/status opens. Nothing was written. Residue:`（+ 逐行 `档头 line N: <text>` 清单） |

**③ 死占位判据可辨性（`findPlaceholderResidue` 判据——正文引用豁免）**：

- **判据**：死占位 = **档头结构行**（标题行 `# …` ∥ 编制行 `> 编制` ∥ 台账行 `> 台账`）内出现 `TEMPLATE_PLACEHOLDERS` 字面；其余一切位置（段体任意行）出现字面 = **引用 ⇒ 豁免**——**区域判据：档头 = 首个 `## §` 标题之前**（档首至首段头前；段体 = 首段头起）。域收（档头 + 目标段 ⇒ **档头结构行**）+ 形收（任意含字面行 ⇒ **结构行值形**）——既非放松（非删检查、非泛形）亦非扩展；枚举字面**零改**（门禁判据集零改口径）。
- 签名 / 返回面：`findPlaceholderResidue(src)` · 返回 `[{line, text}]`；调用点两处（`batch.mjs` append 挂点 ∥ `batch-lifecycle.mjs` status 挂点）；拒句正文（「or your target section」半句不在）。
- 判定依据：未填槽位 = **档头结构现象**（骨架只在档头产占位；段内 `<§N 模板占位：…>` 行 = 合法暂存、本不在枚举）。
- **骨架↔三结构行不变量**：`batchSkeleton` 产出中 `TEMPLATE_PLACEHOLDERS` 字面 ⊆ 三类结构行（现行 = 台账行单行承载两枚占位——标题 / 编制行已实参化零占位）；骨架改形若在结构行外产新占位字面 ⇒ 静默漏检——改形与判据同拍（同址 `batch-skeleton.mjs` 即守护面）。
- 不受影响面：`status` `note` 死占位判据（`assertStatusNote`）= 独立停车面守卫（全禁，非「未填 vs 引用」判定）——零触（边界登记）。

**决策（D-TO15）**：① 可见性 = 描述面载明（门零改）· ② 可填性 = create 可选参建即填（未给走原手工法 + 回执提示）· ③ 可辨性 = 档头结构行值形 ∥ 正文引用豁免。

**边界（本节不做）**：门禁判据集零改（六字段标记 ∥ `TEMPLATE_PLACEHOLDERS` 枚举字面 ∥ `assertStatusNote` 面）· 不新增工具 / action · 其他 description 零清扫 · 端面零改（核单源消费）；用例表 ∕ 验收回指 = 本节内（本档不重述）。

### 6.21 `delete` 空目录分支

**机制（选定 = `delete` 支持空目录——非空拒）**：`thincoder-core/tools/patch.mjs` `deleteTool.execute` 目录分支——

**拒句（模型可见文本——逐字）**：`"<path>" is a directory and is not empty — only empty directories can be deleted (nothing recursive is ever removed). Remove the contents first (delete bottom-up for nested empty directories).`

**写路径（`thincoder-core/tools/write-path.mjs`）**：缝内 op 集扩 **`rmdir`**——`rmdir` 系统调用（空目录移除）；非空 `ENOTEMPTY` 上抛（调用面译拒）；**不记 dirty**（目录无行号语义）；注入面照旧（非内容写点 ⇒ 门禁后回默认径——`tryInjectedPath` 零改）。

登记 = `docs/core/design/CORE-UNIFICATION.md` §2.13.5 补正④；机制实现面 = `thincoder-core/tools/patch.mjs`（delete 分支）∥ `thincoder-core/tools/write-path.mjs`（rmdir 分支）。

**描述档（`thincoder-core/tool-docs/delete.md`——全文改后逐字）**：

```text
Delete a file, or an empty directory. Use when the agent created a temporary or junk file or empty directory that should be cleaned up, or when the user explicitly asks to delete something.
Refuses to delete git-tracked files as a safety measure — tracked files should be edited or removed via bash with explicit user confirmation.

**Route to delete instead of bash:** `del file` / `rm file` → delete (single files); an empty directory → delete (empty directories only). Non-empty directories have no delete path — stop and report to the user instead of hand-rolling a recursive shell delete.

Parameters:
- path (required): File or empty-directory path, relative to cwd or absolute
- force: Allow deleting git-tracked files (default false)

Notes:
- Untracked or non-git files are deleted immediately
- Tracked files require force=true (user must confirm separately)
- Directories: empty ones only — a non-empty directory is refused (a natural fuse; nothing recursive is ever removed); delete nested empty trees bottom-up
- Symbolic links are removed as links — the link itself is deleted, never followed (its target is untouched)
- Returns `Deleted <path>` (or `Error: ...` on failure / tracked / non-empty refusal).
```

**边界（本节不做）**：**非空目录零通路**（有意——保险丝；不实装极窄白名单；如需 ⇒ 另批）· 不递归 ∕ 无 `recursive` 选项 · `file_ops` 枚举零改（目录操作面维持 move / copy / rename）· 审批门零改（delete 既有 `onPermissionRequest` 门继承）· `touchedPaths` ∥ 重叠谓词零改（`thincoder-core/peer-claims.mjs:72` 已按目录级语义在册）。

**快照面注（undo）**：空目录移除**不产生 undo 条目**——零内容语义：`snapshotForUndo`（`thincoder-core/undo-stack.mjs:31`）对目录目标读文本失败（`EISDIR`）即捕后跳过——**不推条**（与「文件创建态」的 `backup = null` 条目分判）；`/undo` 列表无该条目。

**范围注（不经跟踪检查——放宽面）**：前提「空目录不可能被 git 跟踪」按**常规面**声明（git 索引不记空目录）；例外面候选 = **索引条目（gitlink——如未初始化 ∕ 未检出子模块路径）对应的空目录路径**（**unverified**——未实核）：该类路径索引留条目而工作树形可为空目录 ⇒ 本分支对该面同不经跟踪检查（放宽面据此声明）；如日后实核出反例 ⇒ 另议（父侧裁）。

**口径注（逐字文本面归属）**：本节内联 = `thincoder-core/tool-docs/delete.md` **逐字文本面**（承 §6.20 先例——工具面批描述文本变更以本档 §6.x 持逐字文本面）；**`PROMPT-SYSTEM.md` 现持面** = 描述面**机制与预算**（§6.11——外置单源 ∥ 预算表唯一权威处 ∥ 写作契约 → §6.9），该描述档文本**不在该档**（零命中）；描述文本**运行期单源** = `thincoder-core/tool-docs/delete.md`（核内唯一副本）——非二次归属。

用例表 ∕ 受影响文件 ∕ 验收回指 = 本节内（本档不重述）。

### 6.22 SSH 会话工具（SSH-SESSION）

**来源**：需求 = `docs/core/requirements/TOOLS.md` §4.8（S1–S5 ∥ NS1–NS5 ∥ 边界四条 ∥ 相容性核对 5 条 ∥ 裁决三条）；保存面（S6–S9 ∥ NS6–NS7）= **用户裁定 A+B**（裁决记录 ④——本档设计面）。
本节 = 设计面权威（机制 / 落点 / 判据）。

**落点判定（邻位新节 · 非独立档）**：§4.7 TTY-DRIVE **无在册设计**（见本节「先例调查结论」）⇒ **无「独立档」先例可随**；本条性质 = 工具面机制（与 §6.12–§6.21 同类同冠形：`### 6.x <主题>（<批次> · 台账 #N）`）⇒ 落本档邻位新节，档数零增（`docs/README.md` 地图零动）。

#### 先例与公开源（设计前置两行）

**先例行**（对齐 ∥ 偏离）：

| 面 | 先例坐标 | 对齐 / 偏离 |
|---|---|---|
| 帽窗 `capWindow` | `thincoder-core/text-budget.mjs:28` `capText`（头 `keepHead` + `marker` + 尾 `keepTail`） | **对齐**：头 ∥ 标记 ∥ 尾三件与省略数口径；**偏离** = 中段不丢、回填未读缓冲（既有件无此语义）⇒ 薄包落，截断本体仍调它 |
| 有状态剥离 `createStripper` | `thincoder-core/tools/shared.mjs:182` `sanitizeOutput`（消费点 `thincoder-core/agent-tools/ssh-transport.mjs:173`） | **偏离** = 跨 chunk 状态 + 覆盖面（带中间字节的 CSI ∥ 单字符 ESC ∥ BEL ∥ 退格）；既有件**无状态**、按 chunk 各自过正则 ⇒ 序列被切开即残留，不可直接复用 |
| 四门就绪判 | 现行 `thincoder-core/agent-tools/ssh-transport.mjs:220` `waitSettled`（静默 ∥ 提示符 ∥ 硬超时） | **偏离** = 静默降为去抖 + 待答标记门 + 硬超时 60 s；既有「静默到点即判就绪」（`:236`）把回显后的长静默读成完成，正是本批要治的病 |
| 注记文案 | `thincoder-core/text-budget.mjs:16` `fillMarker`（模板首个 `N` 为省略数） | **对齐** = 同一占位约定；措辞不复用（既有说 truncated，本批语义 = 中段可取回） |

**三问答案（本批新件）**：

| 新件 | 何处住 · 名 · 谁用 | 既有件为何不用 |
|---|---|---|
| `createStripper` | 住 `thincoder-core/agent-tools/ssh-transport.mjs`（传输面单点）；名逐字 `createStripper`（仓内零同名）；谁 = `attachChild` 的 `feed`（`ssh-transport.mjs:173`） | **既有但不可用**：`sanitizeOutput` 无状态、覆盖面窄（上表）；全仓 `.mjs` 普查（`grep`）另见 `thincoder-cli/src/tui/render.mjs:239` ∥ `thincoder-vscode/src/tools/shell.mjs:24` 两份同族无状态正则——零第二份状态机 |
| `capWindow` | 住同档；名逐字 `capWindow`；谁 = `ssh-session.mjs` 的 **7 处**返回点（`:262` ∥ `:392` ∥ `:410` ∥ `:414` ∥ `:444` ∥ `:455` ∥ `:465`——实读） | 同档既有 `capText`（`ssh-transport.mjs:279`）只保尾、且与 `text-budget.mjs:28` 同名异义 ⇒ 本批由 `capWindow` 取代并**删该局部实现**（D2 单源） |
| 注记文案 | 随 `capWindow` 出；占位约定同 `text-budget.mjs:16` `fillMarker` | 措辞不复用（语义不同，见上） |
| 缓冲上界 `64 K` | `thincoder-core/agent-tools/ssh-transport.mjs:37` `BUF_KEEP_CHARS` —— **既有常量**，非本批新设 | — |

**勘察证据行**：查过 = ① 仓内既有实现正则逐条对照（`thincoder-core/tools/shared.mjs:185`：CSI `\x1b\[[0-9;?]*[0x40-0x7E]` ∥ OSC `\x1b\]…BEL|ESC\\` ∥ `\x1b[()][0-9A-B]` ∥ `\x1b[=>#][0-9]?`——缺单字符 ESC、带中间字节 CSI、BEL、退格）；② 公共源仓登记读数 = 空（`PROJECT-MANIFEST.json:35` `"publicRepos": []`）。

结论两句：**有用信息全在仓内**（既有实现 + 本机常量），无外部公共源可引；**规范面（ECMA-48 的 CSI / OSC 结构式）未取原文**——本节 ③ 类目表的边界值（参数 `0x30–0x3F` ∥ 中间 `0x20–0x2F` ∥ 终字节 `0x40–0x7E`）是**选定设计值**（与仓内既有正则的类目对齐、按该结构式写成），**不以规范原文自称**。

由此定两件事：**判据取真机读数**——B11 ∥ B17 的夹具序列形按真机输出取，不按书本值凑；**表外序列的出口**——真机出现类目表外的序列 ⇒ 按 ③「仍在吐」路如实交出，并在实施记录里点名该序列形（回填 ③ 表 = 另批）。

#### 机制选型（选定 = **零原生件路**：系统 openssh + `ssh -tt` + `SSH_ASKPASS` + 流式管道；D-TO17）

**① 本地侧无 PTY 也成立（本能力的设计支点）**：`ssh -tt` 强制**远端**分配 PTY——本地无终端（我们的 stdin/stdout = 管道）也照配（`ssh(1)` 原文：「Multiple `-t` options force tty allocation, even if ssh has no local tty」）。
⇒ 本地侧无需真 PTY（无需原生件），远端设备拿到真 PTY（`--More--` / 提示符 / 行编辑等终端行态成立）。

**父侧候选核对（如实）：`ssh -tt` + 流式管道 + `SSH_ASKPASS`（`SSH_ASKPASS_REQUIRE=force`）成立——零原生件满足 S1–S3 的机制条件（端到端 = 实施轮真机腿）**；据 = 上游源码两读（`readpass.c` / `sshconnect2.c`）。
**残余未知（实施轮实测项，不假装已核）**：本地无终端时 ssh 请求的远端 PTY 行列数（尺寸口径未核）——缓解 = 会话内 `terminal length 0` / `stty` 类命令 + `--More--` 处理路（见 ③）。

**② 密码喂入链（客户端侧 password ∥ keyboard-interactive 两径都覆盖）**：
ssh 的客户端口令提问只有一条通道 ⇒ `read_passphrase()`（`sshconnect2.c`：`userauth_passwd` 传 `flags=0` ∥ `input_userauth_info_req`（keyboard-interactive，网络设备常用）传 `echo ? RP_ECHO : 0`——**两径同源**）。

`SSH_ASKPASS_REQUIRE=force` ⇒ `use_askpass=1; allow_askpass=1`（`readpass.c`——**与 `DISPLAY` 无关**；无此变量则 Windows 无 `DISPLAY` 时口令提问退化为空串 ⇒ 必用 `force`）。
调用契约（上游）：askpass 程序经 fork ∥ `posix_spawnp`（Windows 端口 `FORK_NOT_SUPPORTED` 支）执行——**argv[1] = 提示语本体**、stdout 接管道、ssh 读回首行作口令。
**本设计落地形（三步，全零原生件）**：

| 件 | 形 | 说明 |
|---|---|---|
| 包装档 | Windows = `askpass-<pid>.cmd`（`"<node>" "<helper>" %*`）∥ POSIX = `.sh`（`#!/bin/sh` + `exec "<node>" "<helper>" "$@"`，0700） | 运行期写入本工具临时目录（内容零秘密——仅路径）；`<node>` 取 `process.execPath`（Electron 宿主另补 `ELECTRON_RUN_AS_NODE=1`——复用既有单点 `tools/node-child.mjs` `nodeChildEnv`） |
| 助手档 | `thincoder-core/tools/ssh-askpass.mjs`（非工具） | 读环境变量取秘密 → 输出到 stdout（仅此一行）；`SSH_ASKPASS_PROMPT === "confirm"` ⇒ 输出 `yes`（主机确认路，见 ⑤）；零日志 / 零落盘 |
| 秘密传递 | ssh 子进程环境变量 `TC_SSH_SECRET`（名以实施轮为准） | 取 `sshpass -e` 同族先例（服务端面：口令经环境变量、**不入 argv / ps**）；**如实记**：该值在 ssh 进程环境内存活至会话结束（同用户可读进程环境——未再做遮蔽，实施轮可另评更紧通道） |

**连接判定形 = 预探升格**（裁定 A——承实施轮；探连 = 判定步）：探连 = **全会话形**（`-tt` + 保活 + 管道，`NumberOfPasswordPrompts=0`）——成功即**升格为会话**（密钥机全程**恰 1 次连接**，零二次探连）。

**认证类失败**（password ∥ keyboard-interactive 两径——预探短路同点）⇒ 终止探连 → **先读保存件（⑪——命中 ⇒ 直接带密会话，零窗）** → 无 / 不可用 ⇒ 弹凭据窗 → **单次**带密会话（`NumberOfPasswordPrompts=1`——错口令一次即败，不静默重试）；**指纹变更 ∥ 不可达 ∥ 连接超时 ⇒ 弹窗之前硬停**（E2 / E3 语义）。
**不带 `BatchMode`**（带了会直接弃用口令面——服务端面真机 A/B 核在案）。

**③ 就绪判据（「该我发了」）**：判据 = **设备是否在等我输入**，不是「有没有新输出」。四门按序：

| 序 | 门 | 判据 | 结论 |
|---|---|---|---|
| ① | 待答标记 | **末行**（缓冲最后一个换行之后的部分，去尾空白）出现 `--More--` ∥ `(y/n)` ∥ `Password:` | **已就绪**——设备正等我发键（`--More--` 走空格、确认走 y/n）；立即返回，标记**原样呈现** |
| ② | 提示符 | `promptPattern`（agent 可设）命中 ∥ 缺省设备提示符形命中（行尾 `#` `>` `$` `%`，前接非空白词） | **已就绪**（`prompt`） |
| ③ | 仍在吐 | 收到字节但尾既非待答标记亦非提示符（`Building configuration...` 这类）∥ `send` 后**一个字节都没回** | **未就绪**——设备在忙，继续等到硬超时；**不按静默判沉降** |
| ④ | 硬超时 | 缺省 **60 s** 到点 | 返回部分输出 + 可读句，**点名哪个门没过**（**无提示符 ∥ 仍在输出 ∥ 一个字节都没回**——三枚标签与门③ 的两条子情形同文），含 `ssh#N` / host / 已等时长——不静默挂起 |

静默窗（缺省 **800 ms**）降为**去抖**，职责只有一件：判「尾部这半条标记算不算到齐」（chunk 边界可能把提示符 ∥ 待答标记切开）。**门① 门② 在每个到达的 chunk 上求值**——判断时点不因静默窗推后；静默窗不参与门的求值，也不再单独构成「已就绪」。

依据 = 9600 波特下一行 60 字符约 62 ms，800 ms 是行内最坏间隙的十余倍；快命令由门 ② 在首个到达 chunk 上即刻返回。

**门① 只看末行（为什么）**：退格只剥离、不参与擦除（远端擦除序列各家不一，逐字节擦除语义会引入环境猜测）——「被回擦掉的旧标记」只能靠位置排除：`--More--` 一旦被后续输出顶走就不在末行，门① 自然不命中。一条规则同治「陈旧标记」与「串尾噪声」。

**存量优先（`read` 的交出口）**：缓冲非空 ⇒ `read` 立即交出、结论 = `buffered`；四门只判**新到字节**（既有实现已如此：`thincoder-core/agent-tools/ssh-session.mjs:404` ∥ `:413`）。中段回填的取出路径同为此径 ⇒ 长配置按窗口连续取全时**不付硬超时**。

**适用范围（时值拆两常量）**：四门与静默窗只判 `send` / `read` / `secret_input` 的本次等待；`connect` 首屏采集沿用 **10 s**（`SSH_CONNECT_SETTLE_MS`）——既有 `connect` 不传 `timeoutMs`、吃常量缺省（`ssh-session.mjs:238`），与 `send` / `read` 的显式传值（`:388` ∥ `:407`）不同源；

两个时值拆成两个常量，慢设备才拖不动连接；常量 = `SSH_TIMEOUT_MS` **10 s → 60 s**（`thincoder-core/agent-tools/ssh-transport.mjs`），中段回填写回 `entry.buf`（`thincoder-core/agent-tools/ssh-session.mjs`）。

硬超时缺省 **10 s → 60 s**。依据 = 本工具的服务对象是网络设备的**慢操作**（`write memory` / `copy run start` / `reload` 在慢 CF 上数十秒），10 s 短于该量级 ⇒ 必被判超时。
上限侧依据 = ssh 层 2 分钟内宣告死对端（`ServerAliveInterval=30` × `ServerAliveCountMax=4`）⇒ 60 s 不越传输层寿命。**如实记**：60 s = 选定策略值，非实测读数；真机读数如不符 ⇒ 改这一个常量。

`--More--` 分页：识别 + 就绪立即返回 + 原样呈现（agent 发空格继续）；**不做自动翻页**（边界句，见文末）。

终端噪声（输出面 = 文本流；**非逐屏渲染**）：剥离 = **有状态**——转义序列可被 chunk 边界切开，状态须跨 chunk 携带（按 chunk 各自过正则 ⇒ 半截序列残留成字面）。
落点 = 传输入口 `feed`，**先剥离后遮蔽**：剥离只删字节、不插入 ⇒ 切不断秘密字面；顺序反过来则遮蔽的 `len-1` 尾缓冲会把转义残片带进返回面。

**遮蔽的比较面与剥离面同规**：秘密值先过同一归一（控制字节剥离 + CRLF 归一）再进遮蔽表——整串与**按不可见处切开的各段（长度 ≥ 4）**都进；含控制字节的口令因此按段遮蔽。长度 1–3 的残段不遮蔽（会误吞正常输出），列为残余风险（边界条目见文末）。

**`≥ 4` 为选定策略值**（与硬超时 60 s 同处置）：3 字符以下与正常输出的撞面过高（`[OK]` / `y/n` 这类正常短词即 3 字符），4 起撞面可控；真机读数如显示更短的口令段需要遮蔽 ⇒ 改这一个数，不动结构。

**半条序列的收场（flush）**：① `read` / `send` 的返回边界——状态保留，缓冲尾那半条序列不进返回面（等下一片）；② 硬超时 ∥ `close` ∥ 会话终结——尾部半条序列**丢弃并计一次**，返回注记写 `1 incomplete escape sequence dropped`（返回面 `\x1b` 仍 0 命中）；③ 丢弃只限该序列自身的字节，其前后的可见字节照常交出。

**走缝（chunk 边界可控）**：序列被切开这一幕**不靠真管道**（两次 `write` 可能被合成一片，用例会随机变绿变红）——单测直接对 `createStripper` 的 `feed` 逐段喂（单元级、边界确定）；端到端那格只判「返回面零残留」+「`--More--` 字面 1 命中」，不断言切点位置。

| 类 | 形 | 例 |
|---|---|---|
| CSI | `ESC [` + 参数 0x30–0x3F + 中间 0x20–0x2F + 终字节 0x40–0x7E | 清屏 `\x1b[2J` ∥ 光标定位 `\x1b[1;1H` ∥ 私有查询应答 `\x1b[?1;2$y` ∥ 鼠标报 `\x1b[<0;10;5M` |
| OSC | `ESC ]` … 终止于 `BEL` ∥ `ESC \\` | 设标题 `\x1b]0;R1\x07` |
| 单字符控制 | `ESC` + 单字节 ∥ 裸控制字符 | 存取光标 `\x1b7` `\x1b8` ∥ 响铃 `\x07` ∥ `--More--` 擦除序列里的退格 `\x08` |

保留 `\n` `\t` 与非控制字符；`\r\n` 与裸 `\r` 一律归为 `\n`（行结构可比）。
**日志面 = 模型面同源**（剥后文本，无原始字节旁路）：日志的消费方是模型（超帽取回全量）与 NS4 明文扫描，两者都要干净文本，两份面对立必然漂移（D2 单源）。原始字节面不保真 = 本节边界句，不是缺陷。

**④ 会话生命周期（保活 / 闲置 / 关闭）**：

| 面 | 口径 |
|---|---|
| 池 | `thincoder-core/agent-tools/ssh-session.mjs` 单点（照 `bash-async.mjs` 池先例）；条目 = `{id, host, user, port, child, state, buf, logPath, idleTimer, secretRefs}`；取号扫描域 += `_sshSessions`（`thincoder-core/agent-tools/subagent-scheduler.mjs`——不扩 ⇒ 与存活 ssh 会话 id 撞号） |
| 取号 | `ssh#N`（共用既有 id 命名空间——`bash#N` / `browser#N` 同族） |
| 保活 | 进程长命（回合之间**不杀**）；ssh 侧 `ServerAliveInterval=30` + `ServerAliveCountMax=4`（死对端约 2 分钟内退出 ⇒ 会话转 `dead`） |
| 闲置 | 缺省 **600 s** 无 send/read ⇒ 自动关闭 + digest 注记（照异步结算注入先例）；**不做配置项**（免「配置项须有配置界面」连带——数值 = 常量；日后要可调 ⇒ 另批带界面） |
| 关闭 | `close` = stdin 结束 → 1.5 s 宽限 → 杀进程树（`tools/process-tree.mjs` 单源）；返回末段输出 |
| 回合中断 | 会话**存活**（照 F2 豁免先例）；在飞 `read` 返回部分 + `(interrupted)` |
| 会话中止（agent 会话结束） | 逐条杀树 + 清池（挂点 = `agent-tools/async-discard.mjs` 收尾族） |
| 上限 | 并存活会话 ≤ 4（照 `BG_TASK_MAX` 族）；超限**显式拒**（不静默关旧） |
| depth 门 | 工具**不进子代面**（`thincoder-core/agent/helpers.mjs` `SUBAGENT_TOOL_EXCLUSIONS` += `ssh`）——凭据窗 = 用户面事件（与 `question` 同类），且会话池归主会话；边界句 |
| 测试态时间缝（B3 ∥ S2 ∥ S4 判据落形） | `thincoder-core/agent-tools/ssh-session.mjs` 模块级 `_setSshTimeoutsForTest({ idleMs, keepAliveMs })` / `_resetSshTimeoutsForTest()`——缺省 = 常量（闲置 600 s ∥ `ServerAliveInterval=30`）· 传值 `??` 回落 · 用例 `finally` 复位；**不进用户参数面**（「不做配置项」不破）；真实 60 s / 600 s 级时距读数 = 实施轮实机腿 |

**⑤ 连接建立（复用本机 ssh 配置 · 主机指纹口径）**：
`ssh -tt -o ConnectTimeout=10 -o ServerAliveInterval=30 -o ServerAliveCountMax=4 [-p <port>] [user@]host`；`port` / `user` 未给 ⇒ **不下发该选项**（让本机 `~/.ssh/config` 兜底）；**不覆盖** `-F` / `UserKnownHostsFile` / 代理 / agent（配置与证件全复用——S1）；

`-i` **仅在 `identityFile` 记录 / 参数显式给出时下发**（⑩——追加一条候选身份，不夺本机配置与 agent 的既有尝试序列）。

主机指纹：**继承本机策略**（不下发 `StrictHostKeyChecking`）——首见经确认路（askpass `confirm` 提示 ⇒ 助手答 `yes`，照交互式首见语义记入本机 `known_hosts`）；**效果说明（知情）**：本机策略为默认 `ask` 时该路**等效 accept-new**——首见指纹不经人核入档（继承策略下的确认应答，非主动下发覆盖）；**指纹变更 ⇒ 硬停**（ssh 自身拒连，不自动改写、不重试）；本机配置若为 `yes` 则一并继承其严格性。

**⑥ 超时与输出帽**：`connect` 首屏等待 **10 s**（`SSH_CONNECT_SETTLE_MS`）；`read` / `send` / `secret_input` 硬超时缺省 **60 s**（`timeoutMs` 可显式覆盖；判据见 ③）；单次返回帽缺省 **8 000 字符**（`SSH_RETURN_CAP`），形 = **保头 + 省略注记 + 保尾**。

**帽窗算术（一句口径）**：**返回总长 ≤ 帽，注记计入帽内**——先算注记长度，头尾预算 = 帽 − 注记长，再按 **头 60% ∥ 尾 40%** 分；切点按行边界取整（不切半行），取整只在头段 ⇒ **头段可少不可多**，总长恒 ≤ 帽。`maxChars` 视为本次的帽，同式。

`maxChars` 覆盖的是**本次返回窗口**，不是丢弃量：省略的中段留在会话未读缓冲里，下一次 `read` 先把它交出——长配置按窗口连续取全，不靠翻日志。

未读缓冲宽 **64 K**（`thincoder-core/agent-tools/ssh-transport.mjs:37` `BUF_KEEP_CHARS`——既有常量，非本批新设）；超出即从**最旧一端**截掉并置 `bufDropped`，返回注记如实写 `dropped`——**保住尾证据**（提示符 ∥ `[OK]` 不掉，否则门② 永不命中），丢的开头只能由 log 取。复现路径 = 假设备连吐 70 000 字符不平息 ⇒ 注记含 `in-memory buffer overflowed`。

注记形 = `[… N chars omitted (head H / tail T) — the omitted middle is kept; call read again to collect it …]`（N = 真实省略数，占位约定同 `thincoder-core/text-budget.mjs:16` `fillMarker`）。

截断本体 = `thincoder-core/text-budget.mjs:28` `capText`（`max` / `keepHead` / `keepTail` / `marker`——零新截断实现）；`ssh-transport.mjs:279` 那个只保尾的同名 `capText` 随之删除（D2 单源：同名异义两实现必漂移）。

全量流式落 `configDir/tool-results/<ts>-ssh-<N>.log`（复用既有落盘族与保留期；工具结果侧超 64K 仍走既有 offload——零新帽族）。

**⑦ 凭据零入上下文（NS4 的机制面）**：

- 值**不进**：工具入参（`secret_input` 无值参）∥ 工具结果（只回状态句）∥ 会话档 / 消息面 ∥ trace / 日志 ∥ 保存件**明文**（**明文零落盘**——「值不落盘」口径的现行形；显式保存 = ⑪，**仅密文**落用户域私档 = 有意例外）；**新增链路（加解密 / 保存 / 复用解密段）自身子进程零 argv ∥ 零 env**；复用终段喂入 = ② 在册 `TC_SSH_SECRET` 环境直喂残留面（照旧——非新增链路零 env 之违）。
- **回显遮蔽（新机制，如实写明）**：远端若把键入秘密回显进输出流（部分设备 / 程序会），写入后对**捕获面与日志面**做值遮蔽——移除输出中该秘密字面（含跨 chunk 切分：保留 `len-1` 尾缓冲）。
- **遮蔽的比较面 = ③ 的同一次归一 + 分段**（秘密值先过控制字节剥离与 CRLF 归一，再按不可见处切成 `≥ 4` 的段进同一张表）：裸字面匹配会漏掉被 chunk 切开或内部夹控制字节的回显，正是本节要治的残段落。
- 秘密内存存活至会话关闭（仅供遮蔽过滤器），关闭即弃。
- 弹窗值**零留存**：端面不写入会话状态（CLI 掩码步先例「掩码步零留存——不着状态」照搬）。

**⑧ 三端弹窗载荷（`onSecretInput` 注入缝——照 `onQuestion` 先例）**：

```text
ctx.onSecretInput({ kind:"ssh-credential" | "ssh-secret", sessionId, host, user, port,
                    fields:[{ name, masked, required, prefill, checkbox? }], keys:{ title, prompt } })
  → { <name>: <值> }（提交）| null（取消）
```
`checkbox: true`（勾选类字段——提交值 = **布尔**；`prefill` 仍缺省；仅 `ssh-credential` 的 `save` 用）——三端渲染差在册（⑪）：CLI = y/n 步（`(y/N)` 尾缀；Enter = 不勾）∥ VSC / 桌面 = 原生复选框（读 `checked`）；核侧判据 = `save === true` **严格布尔**（非布尔 ⇒ 视同不保存——fail-safe）。

载荷 = 结构化字段（值只在返回路上）；**词面 = i18n 键**（核字典 + 端投影——照 `onWait` `waitStatusOf` 先例）；值不回显、不入日志、不入结果。

落点（三端各一，形同 `onQuestion`）：CLI = `tool-events.mjs` 回调 + TUI 模态面（掩码回显复用 `ask-steps.mjs` `maskEcho` 先例；非 TUI 径 `input.askHidden` 先例）∥ VSC = `panel-callbacks.mjs` 卡片（`makeAskInPanel` 同族）∥ 桌面 = `agent-bridge.mjs` 转口（`askQuestion` 同族）。

**掩码守卫（反交错 · 裁 A）**：Ctrl+F 入场排除集 += 凭据窗 ∥ 团队问句面 ∥ 密码步（单源 = `ask-steps.mjs` `askMaskActive`——掩码面明文旁路封口）；凭据窗在场（含搜索框已开时弹出）⇒ 键路由归掩码面、明文不落搜索面（已开搜索支路 = 另批小修项）。
**无 UI 场合（ACP / headless / 无回调）⇒ 可读错误句**（不挂起、不静默——照 `question.mjs` 无 UI 抛例）。

**⑨ 非密字段预填档（裁决 ② 落地面）**：小档 `configDir/ssh-hosts.json`（私档，随 configDir 生命周期，仓库零落点）；条目 = `{host, port, user, lastUsedAt, identityFile?, auth?}`（读键 = `host[:port]`，缺省 22；身份面两字段 = ⑩）；写入 = **认证成功后**（白名单 = 非密字段——密码 ∥ 口令值零字段）；

复用 = ① `connect` 未给 `user` 时取记录值（状态行注明「user 来自本机记录」）② 凭据窗 `user` 字段预填同值（可改）；**密码零预填**（已保存者经 ⑪ 静默复用——不经预填、不落窗）。

**⑩ 密钥优先 · 身份面（A 案——能装密钥的零秘密）**：
- **身份面载体 = ⑨ 记录同档扩字段**：`identityFile`（路径——**非密**）∥ `auth`（`"key"` ∥ `"password"`——上次成功认证方式：探连成功记 `key`，带密会话成功记 `password`）。
- **`connect` 可选参 `identityFile`**：给出 ⇒ `-i <路径>` 下发（`~` 展开为家目录）＋成功后记入记录；未给而记录有 ⇒ 取记录值（照 `user` 同式）。
- **优先级铁序**：本机配置 / agent ∥ `-i` ⇒ 探连 → 探连**仅认证类失败**才读保存件（⑪）→ 仍失败才落窗。保存件**恒不先于探连**——密钥可用 ⇒ 保存件零读取（S6 判据）。
- **装公钥引导（不做自动装）**：本机 `ssh-keygen -t ed25519`（无密钥时）⇒ `ssh-copy-id user@host`（或把 `id_ed25519.pub` 追加进主机 `~/.ssh/authorized_keys`）⇒ 重连即零窗（探连自试密钥）；步骤落工具描述（英文面——内容依据 = 机制文档 / 落笔 = eng-coder）。

**⑪ 加密凭证库（B 案——必须用密码的，存密文）**：
- **档**：`configDir/ssh-credentials.json`（**私档**——用户域，仓库零落点；与 ⑨ 非密档**分档**——⑨ 档「非密白名单」性质不破）。形 = `{ version: 1, entries: { "<host[:port]>": { user, scheme, blob, savedAt, lastUsedAt? } } }`（读键 = ⑨ 同式——`hostKey()` 单源迁本档，会话面引用）；**`lastUsedAt` = 复用成功时更新**（带密会话认证成功 ⇒ 回写；写失败 = 增益面静默）。
- **加密 = 系统级（本批 = Windows DPAPI）**：经系统 PowerShell 宿主——加密 `ConvertTo-SecureString -AsPlainText -Force` → `ConvertFrom-SecureString`（**无 `-Key` ⇒ DPAPI**——Microsoft 文档逐字）⇒ hex 密文；解密 `ConvertTo-SecureString <hex>` → Marshal 取明文（坏密文 ⇒ 子进程非零退出 + stderr——fail-soft 可判）。
  **密钥来源 = 本机用户账户**（DPAPI 用户主密钥，随登录凭据保护——同机同用户可解；换机 / 换用户解不开 ⇒ 走 S7 回落）；档权限 = `0600` 尽力（Windows 上 DPAPI 为实质防线）。
- **通道纪律**：脚本 = 常量字面（**值不入命令行**）；值以 base64 封包经子进程 **stdin**、密文 ∥ 解出明文经 **stdout**（hex ∥ base64——交换面全 ASCII）；子进程 env 显式删 `TC_SSH_SECRET`（防残留）；超时有界（到点杀子进程 ⇒ 按解密失败走 fail-soft）；
  编码 = UTF-8（base64 承载）；本机实测往返（含中文 / emoji / 空格 / 引号）= 通过；PowerShell 文档另注多码点字符平台风险——如实登记（实施轮用例 B8）。
- **保存时机与交互（窗内勾选 · opt-in）**：凭据窗 `fields` += `save`（checkbox 类——⑧ 契约扩）；**缺省不勾**（保存 = 对「值不落盘」的有意例外 ⇒ 须显式选择）⇒ **认证成功后才写**（失败不写）；写失败不影响连接（增益面，照 `saveHostRecord` 先例）。
- **复用与三故障**：探连认证失败 ⇒ 按 `host[:port]` 读保存件（条目 `user` 与「本次有效 `user`」不符 ⇒ 视同无；「本次有效 `user`」判定序 = `connect` 参数 → ⑨ 记录；两者皆缺 ⇒ 视同无——零消费、零删除）⇒ 解密成功 ⇒ 带密会话（零窗；返回注记「保存凭据已用」）；**条目被服务端拒** ⇒ **删该条目** ＋ 回落窗（可读句——判据 = 服务端拒绝即值已失效，避免每次重试旧值）。
- **故障形态（fail-soft）**：**不可解密**（坏密文 / 后端缺席 / 换机复制）⇒ 回落窗、**条目保留**（可能是暂时态）；**档结构损坏**（JSON 不可解析 ⇒ 条目不可达）⇒ 回落窗、**视同无**（损坏原档**原位不动**——下次成功保存 ⇒ 整体覆盖重建）；**档缺失** ⇒ 视同无（静默——正常首连态）。

**⑫ 保存凭据管理面（清单 / 删除）**：工具动作两枚（核单点——三端同源）：`credentials`（**只读**——列 host / user / 保存时间 / 最近使用；**值零出现**；免审批 = `isReadonlyAction` 判据）∥ `forget`（**写动作**——按 `host` ＋ 可选 `port` 删条目；过既有审批门；`formatPermission` 明示目标主机——无值）。**删除 ⇒ 下次连接回落凭据窗**（S8 判据）；幂等（无该条目 ⇒ 可读句）。文件本体 = 用户域私档（用户可手删——边界句）。

**删除面范围（⑫ 补）**：只涉保存档（⑪）——⑨ 非密记录**不随删**（非密预填面，生命周期 = 随 `configDir`）。

**⑬ 传输面（`put` / `get`——单文件 · 二进制安全；需求档 §4.8 S10 ∥ S11 ∥ NS8 · 台账 #2026）**

**机制一句话**：`put` / `get` = 在**既有会话那台主机**上跑一次 `scp`，走**同一条 askpass 凭据链**；文件字节只经磁盘，工具回执 = 会话冠行 + 一行状态句。

**取法（既有件 ∥ 偏离）**：

| 面 | 既有件坐标 | 对齐 ∥ 偏离 |
|---|---|---|
| 子进程 + askpass 链 | `thincoder-core/agent-tools/ssh-transport.mjs` 的 `buildSshEnv` ∥ `writeAskpassWrapper` ∥ `unlinkAskpass` | **对齐**：同一包装档（Win `.cmd` ∥ POSIX `.sh` 0700）、同一 `TC_SSH_SECRET`、同一 `nodeChildEnv`；**偏离** = 被起的是 `scp` 而非 `ssh`，命令行另一套（`-tt` / PTY / 提示单数在 scp 上无意义），`scpArgs` 本档自持 |
| 失败分类族 | `ssh-transport.mjs` 的 `classifyFailure`（auth ∥ unreachable ∥ hostkey） | **对齐**：同一分类族、同一可读句；**偏离** = 传输面另有两类（协议 ∥ 远端路径、硬超时），由 `ssh-transfer.mjs` 的 `transferFailure` 按退出码 + stderr 尾段补标签——`classifyFailure` 本体零改 |
| 池与主机面 | `thincoder-core/agent-tools/ssh-session.mjs` | **对齐**：主机 / 用户 / 端口 / `identityFile` 全取会话记录值（S10「不另填主机 / 凭据」）；**偏离** = 传输是**新连接**（scp 自己握手，不复用会话的 PTY 进程）⇒ 重走一次 ⑤ 凭据判定 |

**先例节与先例批（三坐标的后两者）**：**先例节** = 本档 §6.22 ⑤–⑫（同一个工具的会话面：凭据链 ∥ 会话池 ∥ 失败分类族——传输面与它们同节同形，不另立节）；**先例批** = 无（传输面此前零批次，台账 `#2026` 为首批；同节各块的来源批见本节首行「来源」行）。

**三问答案（本批新件）**：

| 新件 | 何处住 · 名 · 谁用 | 既有件为何不用 |
|---|---|---|
| `ssh-transfer.mjs` | 住 `thincoder-core/agent-tools/`；名逐字 `ssh-transfer.mjs`（仓内零同名）；谁 = `thincoder-core/tools/ssh.mjs` 的 `put` / `get` 两分支 | **既有但不可用**：`ssh-transport.mjs` 职责 = PTY 会话运行面（剥离 / 四门 / 遮蔽尾缓冲），实测 556 行已越软线；传输面是**非交互**原语（无剥离、无就绪判据、无遮蔽），塞进去会把两套语义混在一档 |
| `resolveSessionSecret` | 住 `ssh-session.mjs`；谁 = `connect` 与 `put` / `get` 两处 | **既有但无出口**：该判定现在是 `connect` 的内联段（探连密钥 → 密文库 → 凭据窗）；本批**提取为导出函数**（提取，非新增逻辑）——不提取就只能复制一份，D2 违 |
| `scpBinary` ∥ `_setScpBinaryForTest` | 住 `thincoder-core/agent-tools/ssh-transfer.mjs`（模块级）；名逐字 `scpBinary` / `_setScpBinaryForTest`（仓内零同名）；谁 = 传输件起跑点 ＋ 本批单测格与两行集成格的夹具 | **既有缝换不到 scp**：仓内只有 ssh 二进制的缝——`thincoder-core/agent-tools/ssh-transport.mjs` 逐字 `export const sshBinary = () => _sshBinary ?? "ssh"`，全仓零 `scp` 缝；执行体 = 系统 `scp` 时替身无处落脚。照 `_setSshBinaryForTest` 同形补一缝（setter + `??` 缺省回落 + 用例 `finally` 复位），生产行为零变 |

**勘察证据行（查过什么 ∥ 有没有相关的）**：

- ① 传输面既有实现：`ssh-transport.mjs` 的 `buildSshEnv` ∥ `writeAskpassWrapper` ∥ `classifyFailure`。
- ② 写门接面：`thincoder-core/agent/helpers.mjs` 的 `toolTouchPaths`（逐字 `const hook = tool?.touchedPaths`）∥ `thincoder-core/agent/write-gate.mjs` 的入口集 `LEDGER_ENTRY_TOOLS` 与 `ledgerGateApplies`（实读：无 `ssh` ⇒ 钩子永不生效）。
- ③ 工具面现状：`tools/ssh.mjs` 的 `SSH_ACTIONS` 十动作（八既有 + `put` / `get`）与 `validateArgs`。
- ④ 集成面现状：`test/RTM.md` 第 22 节三行。
- ⑤ 公共源仓：`PROJECT-MANIFEST.json` 的 `"publicRepos": []` = 空 ⇒ 无仓外档可查。
- ⑥ 协议面：§1「判据现状」所记，本机 `scp` OpenSSH 9.5p1 带 `-O`（`-O` = 经典 SCP 协议）。

**① 协议面（缺省 = `scp -O`；覆盖 = `protocol:"sftp"`）**

| 面 | 口径 |
|---|---|
| 缺省 | `scp -O`（经典 SCP 协议） |
| 覆盖 | `protocol:"sftp"` ⇒ 去掉 `-O`（走 SFTP 子系统） |
| 不做 | 不自动重试、不自动回落（同笔换协议 = 第二条实现路径，失败面的判据会分裂）；协议不对 ⇒ 退出码 + stderr 尾段如实交出，提示句**按现场分叉**：未传 `protocol` ⇒ 点名 `protocol:"sftp"` 可试；已传 `sftp` ⇒ 不再点该参数，只留「检查远端路径 ∥ 该主机可能两条协议都不通」 |
| 平台面（如实记） | `-O` 需较新的本机 scp；确切版本门槛**未查证**（`unverified`——按上游发布说明回忆为 8.6，未核）。更老的客户端以 `unknown option -- O` 失败——可读、可改用 `protocol:"sftp"`。已核读数 = 本机 9.5p1 带 `-O`（§1）；版本门槛由实施轮真机腿收敛 |

**分支依据**（每个分支一行，无可填依据的分支即删）：

| 分支 | 依据 |
|---|---|
| 缺省走经典协议 | 需求档 NS8 逐字「**与只实现经典 SCP 协议的网络设备互通**」——设备侧无 `sftp` 子系统，缺省不这么走等于把主对象排除在外。**观测面：该场景在本仓尚未发生**（零台真机、零复现命令，唯一证据 = 用例 B20 的替身）——到期条件 = 实施轮真机腿接一台只跑经典协议的设备跑通一次 |
| 保留 `protocol:"sftp"` 覆盖 | 需求档 §4.8 总体目标逐字「远端主机 / **网络设备**」——主机侧存在 SFTP-only 形态（`ForceCommand internal-sftp`、无远端 `scp` 程序），经典协议在那类主机上不可用。**场景尚未发生：本仓零台 SFTP-only 真机、零复现命令，唯一证据 = B20 替身**——到期条件 = 真机腿上一台 SFTP-only 主机跑通一次；到期前该分支按替身判据成立 |

**② 参数面**

| 参数 | 面 |
|---|---|
| `id`（必） | 会话 id——主机 / 用户 / 端口 / `identityFile` 全取该会话记录值 |
| `localPath` / `remotePath`（必） | `put` = 本地 → 远端；`get` = 远端 → 本地；`localPath` 的 `~` 按 `expandHome` 展开——**单源 = `thincoder-core/expand-home.mjs`**，逐字 `export function expandHome(p, home = homedir())`（`config.mjs:18` 已 import 同一件）；传输件 import 该处、**自持副本删除**（D2） |
| `overwrite`（可选，缺省 false） | **`get` 侧判据**：本地目标在盘 ⇒ **拒**（S11「不静默覆盖」），`overwrite:true` 才覆盖（判据 = 本地 `existsSync`）。**`put` 侧本门不判**：远端同名档由 `scp` 自身语义决定（两种协议都是覆盖），判远端存在性要另起一条 exec 通道，与「零新通道」相抵，且 S10 未要求该面——审批文案已点出传输两端，覆盖可见 |
| `protocol`（可选） | `"scp"`（缺省）∥ `"sftp"` |
| `timeoutMs`（可选） | 缺省 **600 000 ms**（选定策略值，非实测；真机读数不符 ⇒ 改这一个数）——到点杀进程树 + 可读句；**`get` 侧**并删半截本地档，判据 = 落点**字节数或 mtime 相对本次起跑变过**（`overwrite:true` 覆盖旧档而 `scp` 根本没打开时，一律删会拿用户旧档偿命）；未变 ⇒ 不删、回执照实写「落点原样」。`put` 侧本地源档不动，只可能远端留半截（失败面与边界句） |
| 本地路径实参形（Windows 盘符，`unverified`） | `localPath` 先展开 `~`、解析成绝对路径，再把 `spawn` 的 `cwd` 设为该档所在目录、**命令行只传档名**——盘符的 `:` 与反斜杠都不进 scp 的参数位，`scp` 以首个 `:` 切分本地 / 远端的歧义整条消失。读数未经实机核（`unverified`，实机腿 = 仅 Windows）= 真机腿复核项 |
| `get` 的本地父目录（硬前提，非参数） | **父目录必须已在盘**：不在 ⇒ 独立可读拒句 `Error: … local directory not found: <dir>`（与 `local source not found` 分形——一处是「来源缺」、一处是「落点没准备好」）、`scp` 零执行、本地零写。**不自动建目录**：建目录本身就是项目内一笔写，绕写门；且落点要让人看得见——打错臂的 `get` 会把人看不见的新目录当落点。`put` 侧不判此面（本地源档由失败面「`put` 本地源档不存在」一行判） |

**凭据 = 既有面，零新通道**（§1 已定决定第二条）：传输是一次新 SSH 连接 ⇒ 走与 `connect` **同一段**判定（探连密钥 → 密文库 → 凭据窗），该段本批从 `connect` 内联段**提取**为导出的 `resolveSessionSecret`，两处共用。故 S10 的「密码主机走既有凭据面」与验收 ⑨ 的「不弹窗」是同一件事：**密文库有条目 ⇒ 零窗**——与 S6 / S7 同一判据，本面不另立。

**传输面的凭据窗不带保存勾选（`offerSave: false`）**：保存动作只在 `connect` 面出现（⑪ 窗内勾选 + `auth` 回写）——传输是既有会话的**补连接**，不是建链入口 ⇒ 传输窗只问 user / password。要存凭据 ⇒ 先 `connect` 一次；用户可见后果由描述档写明。凭据判定段仍是同一条（`resolveSessionSecret`），差的只是这一次调用传 `offerSave: false`。

**这条腿要写全（「不弹窗」的适用面）**：会话**不保留密码**——`ssh-session.mjs` 逐字 `spawn(entry.user, input.password)`，值只进 askpass 包装与遮蔽集，`entry` 上无密码字段（`resolveSecret` 用完即弃）。⇒ **窗口手输、未勾保存**建的会话，`put` / `get` 走新连接时**必再弹一次窗**。故验收 ⑨ 的「不弹窗」适用面 = **密文库或有密钥可用**，不覆盖这一类；账本身不欠（值不落盘 = 既有纪律），欠的只是这一句适用面。

**③ 内容零入上下文（NS8）**：文件字节只在磁盘上走；工具回执 = 一行状态句 + 失败时的 stderr 尾段（≤ 600 字符，同 `failureText` 口径）。**不回读文件内容、不进 log、不进 offload 面**——传输面没有「结果全文」这个对象。

**状态句字面（本节的字面单源——动作表 `put` / `get` 两行只指本条、不复写；两处并存即两个真值源，实施席无从判该发哪一形）**：

| 动作 | 字面（`N` = 本次传输字节数） |
|---|---|
| `put` | `put <localPath> → <remotePath> · N bytes · exit 0` |
| `get` | `get <remotePath> → <localPath> · N bytes · exit 0` |

**冠行**：传输面回执**首行带会话状态行冠形**（同节既有面逐字「状态行冠形（每返回首行，便于判读）」）；上表两行字面 = **冠行之下那一行**，字面单源不变。理由 = 多设备会话里 `put` / `get` 回执只给路径，读的人无法确认推到了哪台主机。

**④ `get` 的本地落盘走写门（S11 后半句）**

落点 = 既有写门（`thincoder-core/agent/write-gate.mjs`）。三处落地缺一不可——**只补钩子不接线，门照样看不见这笔写**（实读反证，非推演）：

- **① 钩子**（`thincoder-core/tools/ssh.mjs`）：补 `touchedPaths(args)`——`action === "get"` ∧ `localPath` 非空串 ⇒ `[expandHome(args.localPath)]`（**绝对形**；`~` 展开单源 = `thincoder-core/expand-home.mjs`），其余动作与缺参 ⇒ `[]`。钩子契约 = `thincoder-core/agent/helpers.mjs` 逐字 `const hook = tool?.touchedPaths`。
  - **形差（如实记）**：钩子契约只收 `args`、拿不到 `ctx` ⇒ 钩子不做 `resolve(ctx.cwd, …)`。等价依据 = 门对钩子回值本就 `.map((p) => resolve(cwd, p))` 归一 ⇒ 绝对形过 `resolve` 恒等，判据点与真实落点同址。
  - **为何必须绝对形**：回原样形（`[args.localPath]`）时，`get` 到 `~/.thincoder/tmp/x` 被判成 `<项目>/~/.thincoder/tmp/x` 这条虚构路径——工程模式无故要号，而 `~` 正是备份最常见的落点。
- **② 入口集**（`write-gate.mjs`）：`LEDGER_ENTRY_TOOLS` += `"ssh"`。现集逐字 `const LEDGER_ENTRY_TOOLS = new Set([ "write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit", "file_ops", "bash", "execute", "git", "manifest", "memory", ])`（十二把）——`ssh` 不在内，而门逐字 `if (!LEDGER_ENTRY_TOOLS.has(name)) return null // 入口集之外 ⇒ 本门不问` ⇒ 门在读到钩子之前就返回。集注释的计数随之改「十二把」→「十三把」（D3 计数随表）。
- **③ 要号判据**（`write-gate.mjs` 的 `ledgerGateApplies`）：加分支 `if (toolName === "ssh") return String(args?.action ?? "") === "get"`。**此分支必须带**：该函数对未列工具回落逐字 `return true`（`git` / `manifest` / `memory` 各一分支之后），只加入口集不判 action ⇒ `connect` / `send` / `read` / `list` 全部变成要号，把会话面整条打死。

判据点仍走既有链：`ledgerGateTargets` 对写盘族回落 `toolTouchPaths(tool, args)`，`ssh` 的钩子对 `get` 回 `expandHome` 绝对形（见 ①）、其余回 `[]`——空 ⇒ `null` ⇒ 「没有可判的目标」，本门不问。

- 效果：门对 `get` 与对 `write` **完全同源**（同一个门、同一判据、同一句拒文），**零新谓词**。
- 工程模式无在途号 ∥ 无项目 ⇒ 拒、本地档零写；普通模式本门不挂（与 `write` 一致）。
- 拒文由门产生，本节不写第二份文案（D2）。

**⑤ 失败面（每条一眼可判）**

| 类 | 判据 | 回执 |
|---|---|---|
| 写门拒（仅 `get`） | 门的拒句 | 门原文（`scp` 零执行、本地档零写） |
| 目标已存在（仅 `get`） | `overwrite !== true` ∧ 本地目标在盘（`existsSync`） | `Error: … target exists … pass overwrite:true`（不静默覆盖；`scp` 零执行、原档字节零改） |
| `put` 本地源档不存在 | 展开 `~` 后 `existsSync(localPath)` 假 | `Error: … local source not found: <path>`（`scp` 零执行；远端零写） |
| `get` 远端源档不存在 | 退出码非 0 ∧ stderr 尾段 | `Error: ssh transfer failed (… exit N)` + 尾段（不回读档、不伪造成功、不建空档） |
| `get` 本地父目录不在盘 | 展开 `~` 后 `dirname(localPath)` 不在盘（`existsSync` 假） | `Error: … local directory not found: <dir>`（独立拒句、不与源档那句混形；**零建目录**——该目录事后仍不在盘；`scp` 零执行、本地零写） |
| 认证 | `classifyFailure` 命中 auth | 既有 auth 句 |
| 不可达 ∥ 指纹变更 | 同上（unreachable ∥ hostkey） | 既有句（指纹变更硬停，不改写 `known_hosts`） |
| 协议 ∥ 远端路径 | 退出码非 0 ∧ stderr 尾段 | `Error: ssh transfer failed (… exit N)` + 尾段 + 提示**按现场分叉**（未传 `protocol` ⇒ 点名 `protocol:"sftp"` 可试；已传 `sftp` ⇒ 只留「检查远端路径 ∥ 该主机可能两条协议都不通」） |
| 硬超时 | 到 `timeoutMs` | 杀树 + `Error: … timed out after Ns`；**`get` 侧**落点字节数或 mtime 变过 ⇒ 删并带 `(partial local file removed)`，未变 ⇒ 一律不删、回执照实写「落点原样」；**`put` 侧本地源档不动、远端可能留半截档——本批不清理（边界句，如实交底）** |
| 会话不在池 | 池查询零命中 | 既有「`ssh#N` 不存在」句 |

**夹具缝（本批新增 · 生产零影响）**

- **缝形**：`thincoder-core/agent-tools/ssh-transfer.mjs` 模块级 `_setScpBinaryForTest(cmd, prefixArgs)` ＋ `scpBinary = () => _scpBinary ?? "scp"`。
- **所照先例**：`ssh-transport.mjs` 的 `_setSshBinaryForTest` / `sshBinary`——setter + `??` 缺省回落 + 用例 `finally` 复位。
- **谁挂它**：传输面判据句（S10 / S11 / NS8）与传输面各格（N11 / N12 / B20 / B21 / E12–E17）的替身全挂这一缝。**E17 例外**：它过真门、不起 `scp`，不挂缝。
- **会话侧不动**：仍挂既有 `_setSshBinaryForTest`——两条缝各管一个二进制，不合并。

**⑥ 受影响文件与档位结论**（行数 = 本轮实测；口径 = 每个换行计一行，故与 `wc -l` 差 1）

| 文件 | 改动 | 档位（实测行数） |
|---|---|---|
| `thincoder-core/tools/ssh.mjs` | `SSH_ACTIONS` 八 → 十（`put` / `get`）；`validateArgs` 两动作必填面 + `protocol` 枚举 + schema 补面（四参数 + **`ledger`**——写门对 `get` 的放行条件就是 `args.ledger`，其余入集工具全带）；`execute` 两分支；新增 `touchedPaths(args)` 钩子；import 叶子 `../expand-home.mjs`（钩子回绝对形，不自持归一逻辑）；`isReadonlyAction` 零改（两动作 = 写动作，照常过审批门） | 147 行，仍在软线内 |
| `thincoder-core/agent-tools/ssh-transfer.mjs` | **新档**：`scpArgs` ∥ `scpEnv`（复用 `buildSshEnv` 与包装档）∥ 起跑 ∥ 硬超时 ∥ `transferFailure` ∥ 半截档清理 ∥ 状态句 ∥ 冠行；**模块级夹具缝** `_setScpBinaryForTest` ∥ `scpBinary`（同 `_setSshBinaryForTest` 形）；`~` 展开 import 叶子 `../expand-home.mjs`（不自持副本） | 新档，210 行 |
| `thincoder-core/agent-tools/ssh-session.mjs` | 提取 `connect` 凭据判定段为导出 `resolveSessionSecret`（提取，净增应 ≈ 0）+ 导出池查询 | **496 行**（软线 500，余 4）；越线 ⇒ **另批拆**（切面 = 池查询 / 导出面出去；`resolveSessionSecret` 凭据判定**留在本档**——它与会话生命周期同源，搬进传输件会把两套语义混在一档，正是本档新建 `ssh-transfer.mjs` 的理由） |
| `thincoder-core/agent-tools/ssh-transport.mjs` | 加一行 import（`expandHome` 取自叶子 `../expand-home.mjs`）＋ 删内联 `expandHome` 副本、去 `node:os` 的 `homedir`，**行为零变**（全仓 `~` 展开单源）；`buildSshEnv` / `writeAskpassWrapper` / `unlinkAskpass` / `classifyFailure` 只被 import、零改 | 556 行，已越软线（拆分计划在册 = 台账 `#1922`，复启条件 = 下一次实质触碰该档） |
| `thincoder-core/agent/helpers.mjs` | **零改**（`toolTouchPaths` 已支持钩子） | 408 行 |
| `thincoder-core/expand-home.mjs` | **零改**（只被 import `expandHome`——`~` 展开单源：**传输面 `localPath` 与 `ssh` 钩子 `touchedPaths` 同 import 这一处**） | 17 行 |
| `thincoder-core/agent/write-gate.mjs` | 写门接面：`LEDGER_ENTRY_TOOLS` += `"ssh"`（集注释计数十二把 → 十三把）；`ledgerGateApplies` += ssh 分支（`action === "get"` 才要号）；其余判据零改 | **522 行，已在软线之上**（本批净增 ≈ +5 行、不新增职责）⇒ 本批不拆；**拆分计划 = 判据段先出去**（入口集 ∥ 要号判据 ∥ 拒文构造另立档），解析取根段次之；**承接批 = 台账 `#2020`**（与 `#1996` / `#1999` / `#2003` 同批搬） |
| `thincoder-core/permission.mjs` | `formatPermission` 的 ssh 行点出传输两端（`localPath` → `remotePath`） | 139 行 |
| `thincoder-core/tool-docs/ssh.md` | 描述面（英文）——**不持逐字文本面**（同本节既有口径注；落笔 = eng-coder，内容依据 = 本节） | 65 行 |
| `test/RTM.md` | 第 22 节两行 + 节注计数（落笔 = 实施轮） | — |
| `test/integration/ssh-file-transfer.test.mjs` | **新档**：22-4 ∥ 22-5 两格的落地 | 新档 |
| `docs/batches/2026-11-04-ssh-file-transfer.test.mjs` | 本批单元测试档（随批删——口径单源 = `docs/core/design/TESTING.md`） | 新档 |

**档位结论**：跨 500 行软线面**一档**——`write-gate.mjs`（**522 行，已在软线之上**，本批只加两处判据、不新增职责 ⇒ 本批不拆；拆分计划 = 判据段先出去，承接批 = 台账 `#2020`）。`ssh-session.mjs` 改后 **496 行**、余 4 行，**未越线**；再触碰而越线 ⇒ 另批拆（切面 = 池查询 / 导出面；凭据判定留在本档）。其余全在软线内，`ssh-transfer.mjs` 为新档（210 行）。

**⑦ 关键决策**

| # | 决策 | 理由 |
|---|---|---|
| D-TO24 | 传输执行体 = **系统 `scp`**，缺省经典协议（`-O`），`protocol:"sftp"` 覆盖 | 零第三方运行时依赖（NS1 承诺不动）∧ 与网络设备互通（NS8）∧ 二进制安全由执行体保证，不自己在流上搬字节 |
| D-TO25 | 凭据 = **提取 `resolveSessionSecret` 两处共用**，不做传输专用凭据通道 | §1 已定决定第二条（不新建凭据通道）；提取代替复制（D2） |
| D-TO26 | `get` 落盘走**既有写门**：钩子（`touchedPaths`）∥ 入口集（`"ssh"`）∥ 要号判据（`action === "get"`）三处落地，缺一不可 | 门 / 判据 / 拒文全部单源；自建判据 = 第二个写面真值源，两处必漂移。只补钩子不加入口集 = 门先返回，钩子读不到（实读）；只加入口集不判 action = 会话面全要号。 |
| D-TO27 | 不做自动换协议重试 | 被否 = 自动回落（同笔重试把「协议不对」这个可诊断事实埋在两次尝试之后，且两条协议路径都要维护）；代价在册 = 协议不对时要人工给一次 `protocol`，而失败句直接点名该参数 |

**⑧ 集成用例增量（自 `test/RTM.md` 起答）**：破行 = **0**（第 22 节既有三行断的是 `send` / `read` / 硬超时，零涉传输；其余节零涉 `ssh`）· 冗余行 = **0** · 新增 **2** 行（第 22 节续行，节注计数随之由三态改五态）。**22-4 的通过条件含回执形**：回执 = 会话冠行 + 一行状态句（与 ⑬ ③ 同源；冠行让多设备会话里的人能确认推到了哪台）：

| 行 | 所验的组件交互 | 断言的业务可观察结果 | 需求回指 | 进入口 |
|---|---|---|---|---|
| 22-4 | 工具面 `ssh` ⟷ 传输件 ⟷ askpass 凭据链 | 会话连上只实现经典 SCP 协议的替身，`put` 一个 1 MiB 二进制文件 ⇒ 远端副本 `sha256` 与本地相等；工具回执 = **会话冠行 + 一行状态句**（含 `bytes` 与 `exit 0`），对话里不出现文件内容 | §4.8 S10 ∥ NS8 | CLI 会话里让助手把固件推到交换机——用户看的是那一格工具结果回执 |
| 22-5 | 传输件 ⟷ 写门 ⟷ 会话池 | 同一会话 `get` 一份远端配置到项目内路径：无在途号 ⇒ 拒且本地档不存在；带在途号 ⇒ 落盘、`sha256` 与远端相等；目标已存在且不给 `overwrite` ⇒ 拒、原档字节零改 | §4.8 S11 ∥ NS8 | 同上，助手把 running-config 备份回仓 |

节注计数随之改：第 22 节首行 `三态（行序）= 22-1 正常 · 22-2 正常 · 22-3 边界` ⇒ `五态（行序）= 22-1 正常 · 22-2 正常 · 22-3 边界 · 22-4 正常 · 22-5 边界`；两行新格证据档 = `test/integration/ssh-file-transfer.test.mjs`（新档，常驻——与随批删的单元测试档是两个对象）。

**UI / 交互决策**：本批**零界面面新增**——`put` / `get` 只**过既有审批门**（`onPermissionRequest`），审批文案点出传输两端（`permission.mjs` 一行）；无新弹窗、无新配置项、无新设置键。**与 NS3 的一处偏离（登记）**：NS3 判据是「审批文案一般含将发送原文」，而传输面载荷 = 文件字节——文案改为**点出两端**（`localPath` → `remotePath`）、**内容不入文案**（与 NS8「内容零入上下文」同向）；把文件正文抄进审批文案等于把内容灌进对话面。**无 open 项**。

#### 接口契约（工具面 · 实现面）

| 面 | 落点 | 形 |
|---|---|---|
| 工具本体 | `thincoder-core/tools/ssh.mjs` | `ssh` 工具：动作表见下；`readonly:false` + `isReadonlyAction(args)`（`list`/`read`/`credentials` ⇒ 只读 ⇒ 免审批；写动作照常询问——钩子消费点 = `agent/dispatch-gates.mjs:130`，先例 = 端壳 git 装饰面） |
| 会话机制 | `thincoder-core/agent-tools/ssh-session.mjs` | 池 / 连接 / askpass 包装生成 / 读写 / 沉降 / 遮蔽 / 生命周期（单点） |
| 传输机制 | `thincoder-core/agent-tools/ssh-transfer.mjs`（新） | `put` / `get` 传输面单点：`scp` 参数拼装 / 起跑 / 硬超时 / 回执句 / 半截本地档清理（不碰会话池；池查询由 `ssh-session.mjs` 出口供给） |
| 写门接面 | `thincoder-core/tools/ssh.mjs`（钩子）· `thincoder-core/agent/write-gate.mjs`（入口集 + 要号判据）· `thincoder-core/agent/helpers.mjs`（零改） | `toolTouchPaths` 逐字 `const hook = tool?.touchedPaths`；`ssh` 补 `touchedPaths(args)`：`action==="get"` ∧ 非空 ⇒ `[expandHome(args.localPath)]`（绝对形——钩子拿不到 `ctx`，门侧 `.map((p) => resolve(cwd, p))` 对它恒等），其余 ⇒ `[]`；`LEDGER_ENTRY_TOOLS` += `"ssh"`；`ledgerGateApplies` 的 ssh 分支 = `action === "get"` 才要号 |
| 保存库 | `thincoder-core/agent-tools/ssh-vault.mjs`（新） | 保存件单点：后端解析（DPAPI）/ 加解密 / 存取删 / 可用性判定 / 键形（`hostKey` 单源）∥ **观测缝（A 面四格判据落形）**：模块级读次计数 + 复位导出 `_vaultReadsForTest()` / `_resetVaultReadsForTest()`（读次 = 读盘入口调用数；缺省生产行为不变；用例 `finally` 复位；同族先例 = §6.14 测试态缝） |
| 口令助手 | `thincoder-core/tools/ssh-askpass.mjs` | ssh 经包装档调用（独立进程）——非工具、不注册 |
| 注册面（F1） | `thincoder-core/tools/index.mjs` | `builtinTools` + 导出面各一行；VSC 端装配清单 `thincoder-vscode/src/tools/index.mjs` 同拍（端侧零实现副本——W14 单源律） |
| depth 门 | `thincoder-core/agent/helpers.mjs` | `SUBAGENT_TOOL_EXCLUSIONS` += `ssh`（单点） |
| 审批面 | `thincoder-core/permission.mjs` | `formatPermission` 加 `ssh` 行——**将发送的原文**（人可见；显示面提示，非拦截——零文本拦截，见 §6.4）；**携密径改掩码占位**（值不回显——见 NS3 判据） |
| 回调解 | `thincoder-core/agent/dispatch-run.mjs` | `toolCtx` +`onSecretInput: callbacks.onSecretInput` |
| 收尾面 | `thincoder-core/agent-tools/async-discard.mjs` | 会话中止 ⇒ 杀会话树 |
| 文案面 | `thincoder-core/i18n.mjs` | 弹窗 / 状态 / 失败句键 + 保存面 1 键（`ssh.field.save`——核字典单源，三端投影） |

**动作表**（`ssh { action, ... }`）：

| action | 参数 | 返回（摘要） |
|---|---|---|
| `connect` | `host`（必）· `user` / `port`（可选——缺省交本机配置）· `label`（可选）· `identityFile`（可选——⑩） | `ssh#N` + 状态行（密钥机零弹窗 / 密码机一次凭据窗（有保存件 ⇒ 零窗——⑪））+ 首屏提示符输出 |
| `send` | `id`（必）· `data`（必；不结尾换行时默认补 `\r`——设备 Enter 语义）· `settle`（可选开关/口径）· `timeoutMs` | 该轮输出（≤ 帽）+ 就绪结论（**待答标记** ∥ **提示符** ∥ **硬超时**——静默只是去抖，不出结论） |
| `read` | `id` · `timeoutMs` · `maxChars` | 上次读后新增输出：**缓冲非空 ⇒ 立即交出**（结论 = 缓冲，不付硬超时）；缓冲空 ⇒ 等到门① ∥ 门② ∥ 门④（`timeoutMs`） |
| `secret_input` | `id` · `label`（可选） | 触发凭据窗 → 掩码写入 + `\r`；返回状态句 + 输出增量（**值永不出现**） |
| `close` | `id` | 末段输出 + 关闭确认 |
| `list` | — | 在活会话清单（id / host / user / 状态 / 空闲秒）——上下文压缩后的恢复路 |
| `credentials` | — | 保存凭据清单（host / user / 保存时间 / 最近使用——**值零出现**）；只读 ⇒ 免审批 |
| `forget` | `host`（必）· `port`（可选） | 删该主机保存凭据 + 确认句（幂等）；过审批门 |
| `put` | `id`（必）· `localPath`（必）· `remotePath`（必）· `overwrite`（可选）· `protocol`（可选）· `timeoutMs`（可选） | 一行状态句（字面单源 = ⑬ ③）；文件内容零入上下文；远端同名档由 `scp` 自身语义决定（两种协议都是覆盖），**本门不判**——理据 = ② `overwrite` 行 |
| `get` | 同 `put` 的参数面（方向相反） | 一行状态句（字面单源 = ⑬ ③）；文件内容零入上下文；**目标已存在而不给 `overwrite:true` ⇒ 拒**（S11「不静默覆盖」，判据 = 本地 `existsSync`——见 ② `overwrite` 行）；本地父目录不在盘 ⇒ 拒（② 硬前提行，零建目录）；本地落盘经既有写门（工程模式无在途号 / 无项目 ⇒ 拒、档零写） |

状态行冠形（每返回首行，便于判读）：`[ssh (<id>) <host> — <state> · idle <n>s]`。


> **口径注（描述文本面）**：`thincoder-core/tool-docs/ssh.md` 保存面变更**不持逐字文本面**（有意——与 §6.21 体例差异明记）：逐字文本面落笔 = eng-coder（内容依据 = 机制文档）；本节只列内容点。

#### 验收判据（S1–S11 / NS1–NS8 逐条 → 判据句 · 机检形）

| 需求条目 | 判据句（机检形） |
|---|---|
| **S1** 建会话（密钥优先 · 密码窗） | 密钥 / agent 机：`connect` 成功且**凭据窗回调零调用**＋**保存件零读取**（同机有保存件时——观测缝读次 = 0：`_vaultReadsForTest()`）；配置复用：不给 `-p`/`user` 时生效项来自本机配置（读回 `ssh -G <host>` 同值比对面）。密码机（无保存件 / 保存不可用）：`connect` **恰触发一次**凭据窗，链路含 askpass 调用（助手留痕夹具）且连接成功 |
| **S2** 多往返 · 状态保持 | 同一 `ssh#N` 上 ≥2 轮 `send`/`read` 往返；状态判据 = 会话内设可见状态（POSIX：`cd /tmp` 后 `pwd` 回显 `/tmp`；设备：模式提示符变化），且**跨回合**仍持（缺省口径 = 间隔 > 60 s；机跑 = 时间缝压小 keep-alive 跨 ≥2 个间隔——④ 测试态时间缝） |
| **S3** 交互流程（提示符 / 确认 / 分页） | 夹具（脚本化替身 = 会输出提示符 / `--More--` 的假设备）：`read` 在 ≤ settle 上限内返回并含提示符判据；`--More--` 出现在返回文本中，随后 `send(" ")` 返回后续页；非全屏（边界） |
| **S4** 读回驱动 · 保活 | 两次调用间隔 > 60 s 会话仍活（机跑 = 时间缝压小 keep-alive 跨 ≥2 个间隔；`read` 正常）；闲置超时到点（`idleMs` 缝压小）⇒ 自动关闭 + 注记注入（可读）；单次返回 ≤ 帽（8 000 字符缺省）且全量在 log（读 log 与返回面逐字同源） |
| **S5** 用户可插话 · 实时可见 | 工具输出经既有 `onToolOutput` 流入端面（三端装配面实读：CLI/VSC/桌面 各一处接线）；插话 = 用户经对话面发消息（既有机制、零新面——**不声称新增**） |
| **NS1** 零第三方运行时依赖 | 已裁 = **⓪ 零原生件**（需求档 §4.8 裁决 1）：`package.json` 运行时依赖零新增（实施轮 diff 读数为零）+ 全链实走（`connect`/`send`/`read`/`close` 经系统 openssh）。**版本面注**：askpass 径需 OpenSSH ≥8.4（`SSH_ASKPASS_REQUIRE`）——macOS 自带 ∥ Linux 主流发行版均满足；例外 = RHEL 8 / CentOS 8 代（8.0p1）⇒ 兼容 = 占位 `DISPLAY` 走旧语义（新旧两代都通，实施轮落地） |
| **NS2** 不卡死 | 超时夹具（睡死不输出的替身）：`read`/`send` 在硬超时内返回**可读失败句**（含 id / host / 已等时长）；输出帽生效；零静默挂起 |
| **NS3** 破坏性动作先确认 | `ssh` 的写动作**每次经既有审批门**（`onPermissionRequest` 计数 ≥ 1 / 调用）；审批文案一般含**将发送原文**；**携密径（`secret_input` 及一切携带秘密值的调用）= 掩码占位**（形如「将发送：••••••（携密——值不回显）」；由 = 值入文案即入上下文 ∥ 审批记录 ⇒ 违 NS4；不豁免 = 携密动作仍属写动作，门不放松）；零新增文本拦截（见 §6.4）；`list`/`read`/`credentials` 免审批（`isReadonlyAction` 判据） |
| **NS4** 凭据零入上下文 | 夹具密码 = 唯一随机串（含回显替身）：**全量扫描**会话档 / 工具结果 / `tool-results` log / trace / **`ssh-credentials.json`** ⇒ **明文 0 命中**（保存面同判——档内仅密文 blob）；弹窗值不落端面状态（端面状态转储 0 命中） |
| **NS5** 宿主层 = 核 | 会话逻辑只住 `thincoder-core/**` **四档**（`thincoder-core/tools/ssh.mjs` ∥ `thincoder-core/tools/ssh-askpass.mjs` ∥ `thincoder-core/agent-tools/ssh-session.mjs` ∥ `thincoder-core/agent-tools/ssh-transport.mjs`——拆档 = 500 顾问线落形；端侧零实现副本——VSC 只加清单行、桌面只加回调）；探针可枚举 `ssh` 在注册面（F1） |
| **S6** 密钥优先 · 保存件隔离 | 密钥可用机：`connect` 成功 ∧ 凭据窗零调用 ∧ **保存件读次 = 0**（观测缝 = `_vaultReadsForTest()`——接口契约「观测缝」行；用例 `finally` 复位） |
| **S7** 保存与静默复用 · fail-soft | 窗内勾选保存 ⇒ 保存档增条目（明文 0 命中）；**二次 `connect` ⇒ 凭据窗回调零调用**且连接成功（返回注记含「保存凭据已用」句）；四注入（坏密文 ∥ 后端抛 ∥ 结构损坏（坏 JSON 档）∥ 条目被服务端拒）逐一 ⇒ 均为「可读句 + 凭据窗恰一次 + 连接不崩」（不可解密 / 后端抛 ⇒ 条目保留；结构损坏 ⇒ 视同无——原档原位不动；被拒 ⇒ 该条目已删——档内零条目）；**档缺失** ⇒ 视同无（静默——正常首连态） |
| **S8** 清单 · 删除 | 清单 = N7（值零出现）∥ `forget` ⇒ 条目消失；再 `connect` ⇒ 凭据窗恰一次（回落）；二次 `forget` ⇒ 可读句、零抛（幂等） |
| **S9** 身份面 · `identityFile` | `connect identityFile=…` ⇒ `-i <路径>` 生效（`~` 展开）∧ 成功后记入 ⑨ 记录；再连（不给参）⇒ 复用记录值（⑩；N8 同判） |
| **S10** `put` 单文件 · 二进制安全 | 夹具 = `_setScpBinaryForTest`（`thincoder-core/agent-tools/ssh-transfer.mjs`）换脚本化替身 `scp`（会话侧仍 `_setSshBinaryForTest`）：本地 1 MiB 随机二进制 `put` 到远端 ⇒ 远端副本 `sha256` = 本地（逐字节）；回执 = 会话冠行 + 一行状态句（含 `bytes` 与 `exit 0`），**回执内零文件内容可辨片段**（取本地前 64 字节做子串扫描 = 0 命中）；`put` 参数面没有 `host` / `user` / `port`（主机取会话记录值）；密文库有该主机条目时 `put` 成功 ∧ **传输期凭据窗回调零调用**（验收方向 ⑨ 的机检形——观测缝 = **计数的 `onSecretInput` 替身**：替身记本次传输期间凭据窗回调被调用次数，断言 = 0。**不借 `_vaultReadsForTest()`**：那个缝读的是保存件读次，而本格输入「密文库已有该主机条目」⇒ 读次必然 ≥ 1，两读数判的不是一件事） |
| **S11** `get` 单文件 · 走写门 · 不静默覆盖 | 远端 1 MiB 文件 `get` 到本地 ⇒ `sha256` 相等；工程模式 depth-0 **无在途号** ⇒ 写门拒（拒文出自门本体）、`scp` 零执行、本地档不存在；带在途号同笔 ⇒ 放行、档在盘；目标已存在且不给 `overwrite:true` ⇒ 拒且原档字节零改 |
| **NS8** 传输面 | 文件内容零入上下文（**仅回执面**扫本地文件前 64 字节 = 0 命中——传输面没有「结果全文」对象、不写 log，消息面 ∥ `tool-results` log 无从命中，不列为判据）∥ `timeoutMs` 到点 ⇒ 进程树被杀、返回可读句（不挂起）；**`get` 侧**并删半截本地档（`put` 侧本地源档完好，远端半截档残留见边界句）∥ 失败句含退出码与 stderr 尾段 ∥ 缺省 `scp -O` 使只实现经典协议的替身可通（替身判据 = 收到 `-O` 才放行，收 SFTP 子系统请求即失败） |
| **S10 / S11** 描述面 | `thincoder-core/tool-docs/ssh.md` 含 `put` / `get` 两条动作条目 ∧ 各自的参数面与一行状态句口径 ∧ 「文件内容零入上下文」一句；六要素（§6.9）在位（落笔 = eng-coder，内容依据 = 本节 ⑬；判据形 = 逐条子串命中，非人工目检） |
| **NS6** 保存面口径 | 明文 0 命中（会话档 / 结果 / log / trace / 保存档）；保存档仅密文 blob；子进程命令行零值（夹具记 argv）；仓内零落点（`git status` 读数） |
| **NS7** 多端同源 | 三端共一份保存档（同 `configDir`）；端差仅渲染（勾选控件形）；保存 / fail-soft（S7）三端各跑同判 |
| **S3 / NS2** 就绪判据（③ 本批） | 夹具（脚本化假设备，时间缝压低）：① 输出 `Building configuration...` 后停 3 s 再出 `[OK]` + 提示符 ⇒ 首次 `send` **不得**在静默窗判就绪，返回文本含 `[OK]`；② 缓冲末行为 `--More--` ⇒ 就绪原因为待答标记，且返回文本 `--More--` 恰 1 命中；③ 睡死不输出 ⇒ 硬超时返回可读句，且句内点名是哪一门没过；④ 中段回读（N9 后紧接 `read`）⇒ 结论 = `buffered`、用时 < 1 s（不付 60 s） |
| **S4** 输出帽（⑥ 本批） | 输出 20 000 字符 ⇒ **返回总长 ≤ 帽（注记计入帽内）**且注记含真实省略数，首行 ∥ 末行俱可检出；随后 `read` 取回中段，三段拼合与原文逐字一致；`maxChars: 500` ⇒ 窗口 500 生效、中段仍在缓冲；连吐 70 000 字符 ⇒ 注记含 `dropped`、尾段提示符仍在 |
| **S3 / NS4** 终端噪声（③ 本批） | 夹具把 CSI 按 chunk 边界切开（`\x1b[1;` ∥ `1H`）且会话含秘密回显 ⇒ 返回面 `\x1b` 0 命中、秘密**任何可见残段**（归一段 ≥ 4 字符）0 命中；`--More--` 字面 1 命中；半条序列收场 ⇒ 注记 `1 incomplete escape sequence dropped`、返回面仍零 `\x1b`；log 面同判（剥后文本、无原始字节） |

#### 集成测试设计（本批 · RTM 增量）

读 `test/RTM.md`（仓内 UAT 验收总表，CLI 端 21 个业务故事）后按增量答三问。

**破行 = 0**：本批不改任何既有用例所断言的业务可观察结果——既有 1–21 节无一涉 `ssh` 工具（`grep` 实读：`ssh` 只在本节相关档出现）。**冗余行 = 0**：无既有行被本批取代或作废。

**缺失行 = 新故事「22. SSH 接网络设备：读得清、拿得全、判得准」（CLI 端，三行 22-1 ∥ 22-2 ∥ 22-3）**，已在 `test/RTM.md` 定号（用例名逐字同号 = `test('22-1 …')`）。

| 行 | 所验的组件交互 | 断言的业务可观察结果 | 需求回指 | 进入口 |
|---|---|---|---|---|
| 22-1 | 工具面 `ssh` ⟷ 会话池 ⟷ 传输面剥离 / 帽窗 | 20 000 字符的 `show run`：工具结果回执零 `\x1b`、首行与末行俱在、注记点名中段可取回；随后 `read` 取回中段，三段拼合与设备原文逐字一致 | §4.8 S4 ∥ S3 | CLI 会话里让助手 `connect` 再 `send("show run")`——用户看的是对话里那一格工具结果回执 |
| 22-2 | 就绪判据 ⟷ 会话池 | `write memory` 回显后静默 3 s 再出 `[OK]`：首次 `send` 的返回含 `[OK]`，未在静默窗返回 | §4.8 S3 ∥ NS2 | 同上，`send("write memory")` |
| 22-3 | 硬超时 ⟷ 会话池 ⟷ `list` | 睡死设备：给定 `timeoutMs` 内拿到可读句并点名未过的门，会话仍在 `list` 里（不静默挂起、不崩） | §4.8 NS2 | 同上，`send` 到一台不吐字节的替身 |

**收窄（如实记）**：远端用 `_setSshBinaryForTest(cmd, prefixArgs)`（`thincoder-core/agent-tools/ssh-transport.mjs:44` 既有测试缝）换成脚本化假设备，不需真机；三行 = 集成用例（`test/RTM.md` 22-1 ∥ 22-2 ∥ 22-3；用例档尚未落地——RTM 三行结果列 = `待执行`）。真机腿 = 交付前人工一次，不进自动化集。

#### 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| N1 | 正常 | 密钥机 `connect` | 成功；凭据窗零调用；返回提示符 |
| N2 | 正常 | 密码机 `connect`（窗内提交） | 连接成功；askpass 助手留痕 1 次 |
| N3 | 正常 | `send("cd /tmp")` → `send("pwd")` | 第二轮输出含 `/tmp`（状态保持） |
| N4 | 正常 | 设备 `enable` 流程：`send("enable")` → `secret_input` | 掩码提交 + 提示符推进；返回值内含密码字面 **0 次** |
| B1 | 边界 | 单次输出 > 帽 | 返回保头 + 注记 + 保尾（注记含真实省略数）；中段留未读缓冲——再 `read` 取回；log 全量 |
| B2 | 边界 | 慢设备：无提示符、无待答标记，静默到点（硬超时） | 返回部分 + 「未检出提示符 ∥ 仍在输出」可读句（非失败）——**不在静默窗返回** |
| B3 | 边界 | 空闲超时（`idleMs` 缝压小——缺省 600 s） | 自动关闭 + 注记；此后 `send` 回「会话已结束」 |
| B4 | 边界 | 第 5 条并发会话 | 显式拒（含上限句） |
| B5 | 边界 | `--More--` 分页 | 识别 + 空格继续（第一刀不自动翻页） |
| E1 | 错误 | 口令错（1 次） | 可读失败句（认证被拒）；会话不入池；窗口不重弹 |
| E2 | 错误 | 主机不可达 / 连接超时 | 可读失败句（区分超时 ∥ 拒连，照服务端分类族） |
| E3 | 错误 | 主机指纹变更 | 硬停 + 可读句（**不自动改写** known_hosts） |
| E4 | 错误 | 用户在窗内取消 | 工具返回可读句（不挂起、不重弹；**取消 ⇒ 零后续尝试**——探连 = 判定步，不重发） |
| E5 | 错误 | 远端主动断（会话中 ssh 进程退出） | 后续调用返回「会话已结束」；池条目转终态 |
| E6 | 错误 | 平台 ssh 无 askpass（假想）∥ 无 UI 场合 | 可读失败句 + 指引（改密钥 / agent）；无 UI ⇒ 明示无输入面 |
| N5 | 正常 | 密码机首连（窗内勾选保存） | 连接成功；保存档增条目（明文 0 命中）；**再连 ⇒ 零窗**（注记含「保存凭据已用」） |
| N6 | 正常 | 密钥机 `connect`（同机有保存件） | 成功；凭据窗零调用；**保存件读次 = 0**（观测缝读数） |
| N7 | 正常 | `credentials` | 列 host / user / 时间；**值零出现**；免审批 |
| N8 | 正常 | `connect identityFile=~/.ssh/id_ed25519` | `-i` 生效；成功记入记录；再连（不给参）复用记录值 |
| B6 | 边界 | 窗内不勾选保存 | 连接成功；保存档零写（无该条目） |
| B7 | 边界 | 保存后装密钥（探连变可用） | 零窗；保存件零读取（不被消费——读次 = 0；观测缝同 S6） |
| B8 | 边界 | 非 ASCII 口令（中文）保存往返 | 二次连接静默复用成功（UTF-8 往返回环） |
| B9 | 边界 | 同主机重复保存（口令已改） | 旧条目被覆盖（last-write-wins；旧密文零残留） |
| B10 | 边界 | 记录 `identityFile` 文件已删 | ssh 自身告警 + 其余证件 / 窗路照常（不 brick） |
| E7 | 错误 | 保存条目被服务端拒（口令已改） | 条目删除 + 本次回落窗（可读句）；不再重试旧值 |
| E8 | 错误 | 不可解密（坏密文 ∥ 后端缺席 ∥ 换机复制） | 可读句 + 回落窗；**条目保留**（不崩、不挂） |
| E8b | 错误 | 档结构损坏（坏 JSON 档） | 可读句 + 回落窗；**视同无**（原档原位不动——下次成功保存整体覆盖重建）；不崩 |
| E9 | 错误 | 保存写失败（磁盘 / 权限） | 连接不受影响 + 可读注记（增益面语义） |
| E10 | 错误 | `forget` 无该条目 | 可读句（幂等——零抛） |
| E11 | 错误 | mac / Linux 平台 | 勾选不出现；连接走既有凭据窗（边界明记） |
| N9 | 正常 | 设备 `show run`（20 000 字符） | 首窗返回头 + 尾 + 注记；再 `read` 取回中段——内容零丢失 |
| N10 | 正常 | `write memory`（回显后静默 3 s 再 `[OK]` + 提示符） | 不按静默判沉降；返回含 `[OK]` 与提示符 |
| B11 | 边界 | 输出含 CSI ∥ OSC ∥ 退格，且序列被 chunk 边界切开 | 返回面零残留转义；`--More--` 字面保留；log 同源同判 |
| B12 | 边界 | 缓冲尾 = `--More--` | 门① 判就绪立即返回，标记原样呈现；随后 `send(" ")` 取得后续页 |
| B13 | 边界 | `send` 后一个字节都不回（慢 console） | 不判沉降；到硬超时才返回，可读句点名「一个字节都没回」 |
| B14 | 边界 | `maxChars: 500` + 长输出 | 返回窗口 500；中段留缓冲；下次 `read` 继续交出 |
| B15 | 边界 | N9 之后紧接着 `read`（缓冲里只有中段） | 立即交出（结论 = `buffered`），用时 < 1 s——不付 60 s 硬超时 |
| B16 | 边界 | 假设备连吐 70 000 字符不平息（过 64 K） | 注记含 `in-memory buffer overflowed`；尾段提示符仍在（丢最旧、保尾）；开场从 log 取 |
| B17 | 边界 | 收场时缓冲尾挂着半条序列（`\x1b[1;`） | 返回面 `\x1b` 0 命中 + 注记 `1 incomplete escape sequence dropped`；下一次 `read` 不受影响 |
| B18 | 边界 | `--More--` 被后续输出顶走后出提示符 | 结论 = 提示符（门① 只看末行），不误发空格 |
| B19 | 边界 | 回显的秘密值内含控制字节（`\x07`） | 归一后的秘密整串 ∥ 各归一段（≥ 4）**0 命中**；1–3 字符残段不判（边界句） |
| N11 | 正常 | `put localPath=<1 MiB 随机二进制> remotePath=/flash/img.bin`（会话 = 密码机，密文库已有该主机条目） | 回执 = **会话冠行 + 一行状态句**（状态句含 `bytes` 与 `exit 0`）；远端副本 `sha256` = 本地；回执零文件内容片段；**传输期凭据窗回调零调用**（验收 ⑨ 的机检形——观测缝 = 计数的 `onSecretInput` 替身，断言回调次数 = 0；保存件读次不在本格断言之列，输入已含密文库条目 ⇒ 读次 ≥ 1） |
| N12 | 正常 | `get remotePath=/flash/img.bin localPath=~/backup/img.bin overwrite:true`（**夹具前置 = `~/backup/` 已建**——父目录不在盘走拒句，见失败面与 E16） | 本地档 `sha256` = 远端；`~` 已展开；回执 = 冠行 + 一行状态句。**前提 = 本格直驱工具面（`sshTool.execute`），不过写门**——写门只挂在派发相位，直驱证明不了工程模式可用；「过门」那面由 E17 判 |
| B20 | 边界 | 只实现经典 SCP 协议的替身（收到 SFTP 子系统请求即拒） | 缺省 `put` 成功（替身见 `-O` 放行）；同一笔传 `protocol:\"sftp\"` ⇒ 可读失败句 + 尾段如实交出，且提示句**不点 `protocol`**（只留「检查远端路径 ∥ 该主机可能两条协议都不通」——用户已用过的参数再点一次等于让人重试同一笔） |
| B21 | 边界 | 传输 `timeoutMs: 200` 到点（替身中途停吐） | 可读句（`timed out after 0.2s` + `partial local file removed`）；进程树无残留；`get` 半截本地档不在盘；`put` 侧读数 = 本地档完好、**远端可能留半截档（本批不清理——边界句如实交底，不谎称已清）** |
| E12 | 错误 | 工程模式 depth-0 无在途号 `get`（本地目标在项目内） | 写门拒（拒文 = 门本体原文）、`scp` 零执行、本地档不存在 |
| E13 | 错误 | `put` 到远端不存在的目录 | 非 0 退出码 + stderr 尾段如实交出（不吞、不改写成成功） |
| E14 | 错误 | `put` 的本地源档不存在（`localPath` 指向空处） | `Error: … local source not found: <path>`；`scp` 零执行（替身零命中）；远端零写 |
| E15 | 错误 | `get` 的远端源档不存在（scp 报 `No such file or directory`） | 非 0 退出码 + stderr 尾段如实交出；本地零档（不改写成成功、不造空档） |
| E16 | 错误 | `get` 的 `localPath` 父目录不存在（`~/nouveau/img.bin`，`~/nouveau/` 不在盘） | `Error: … local directory not found: <dir>`（独立可读句）；`scp` 零执行（替身零命中）；**零建目录**（该目录事后仍不在盘）；本地零档 |
| E17 | 错误 | 与 N12 同落点的 `get` 走**真门**（`executeToolCalls` 派发相位：工程模式 depth-0、落点在项目外、无在途号） | 写门拒且判据点 = **真实落点**（`C:\Users\<用户>\…`，不是 `<项目>/~/…` 虚构路径）；拒因 = 「没有项目拥有这笔写」（**不**是「没带号」）；本地零档。**与 N12 合起来才成立**：N12 证明工具面可用、本格证明工程模式落项目外不可用（普通模式可用） |

#### 关键决策

- **D-TO17 机制 = 零原生件路**（系统 openssh + `-tt` + askpass + 管道）：择据 = 不破「零第三方运行时依赖」承诺 ∧ 三端同构（核内单源）；S1–S3 端到端 = 实施轮真机腿。
- **D-TO18 凭据通路面 = `ctx.onSecretInput` 注入缝 + askpass 环境变量**：弹窗值只在回调返回路 + 子进程环境内流动，零入参 / 零入结果 / **明文零落盘**（显式保存 = 密文落用户域——⑪ / D-TO19）/ 端面零状态留存 + 回显遮蔽。
- **从属决策（同节）**：主机指纹 = 继承本机策略；审批 = 工具调用级既有门 + `isReadonlyAction` 只读豁免（零文本拦截——见 §6.4）；depth>0 排除（凭据窗 = 用户面事件）；闲置 600 s 不设配置项（免配置界面连带）；`--More--` 不自动翻页（第一刀窄面）。
- **D-TO19 保存机制 = 系统级加密后端（本批 Windows DPAPI，经系统 PowerShell 宿主）**：择据 = 零第三方依赖 ∧ 密钥来源 = 用户账户（不自管密钥——不做加密戏法）∧ 通道纪律（值经 stdin）；代价在册 = PowerShell 宿主启动 ≈0.3–0.4 s/次（实测；仅保存 / 复用两时点）+ 多码点字符平台注记（⑪）。
- **D-TO20 保存交互 = 窗内 checkbox · 缺省不勾（opt-in）**：由 = 对「值不落盘」的有意例外须显式选择；单次交互（不做事后询问）——三端渲染差在册（⑪）。
- **从属决策（保存面）**：条目被服务端拒 ⇒ 删该条目（判据 = 拒绝即值失效）；删除面 = 工具动作 `credentials` / `forget`（核单点、三端同源；私档可手删）；本批平台面 = 仅 Windows 后端（mac / Linux 边界 + 候补路在册）。
- **D-TO21 就绪判据 = 「设备在等我输入」，不是「没有新输出」**：择据 = 网络设备的慢操作（闪存写 / 配置应用）在回显之后长时间静默，静默既可能是「做完了」也可能是「还在做」——以静默为判据必出半截输出。
  实读 = `thincoder-core/agent-tools/ssh-transport.mjs:236` 静默到点即 `finish("silence")`，判据里没有「设备是否在等我」这一问；改判待答标记 ∥ 提示符两门，静默降为去抖。
  - 被否 ① = 直接把 800 ms 调大：治不了「回显后长静默」这类（调多大都能被超过），且每条快命令都付这个延迟。
  - 被否 ② = 静默到点先交部分、结论写「未检出提示符，可能仍在运行，可再 read」（= 现行 B2 的形）：它把「判据缺失」转给模型再问一次，而模型据半截输出已经先判了命令成败——本批要治的正是这一层。
  - 被否 ② 的代价：未知提示符形的设备每条命令付满 60 s，接受它（慢操作本来就该等，快命令由门① ∥ 门② 即刻返回）。
  - `promptPattern` 的发现路径：缺省按行尾 `#` `>` `$` `%` 判提示符；设备形不同时 `connect` 可选参 `promptPattern` 给正则（参数面 = `thincoder-core/tools/ssh.mjs:58`），工具描述与超时注记双处提示「未检出提示符 ⇒ 给 `promptPattern`」。
- **D-TO22 输出帽 = 返回窗口，不是丢弃量**：择据 = 网络配置的关键内容在头部（接口 / ACL）、命令结束的证据在尾部（提示符 / `[OK]`）、中段仍要可取 ⇒ 保头 + 保尾 + 中段回填未读缓冲（下次 `read` 交出）。复用 `thincoder-core/text-budget.mjs:28` `capText`（头尾 + 标记已单源——零新截断实现）。
  被否 = 只保头（丢提示符 ⇒ 判不出命令是否结束）∥ 只留日志路径（模型多一次读档，且日志是配置域不是会话面）。
- **D-TO23 剥离面 = 传输入口，日志与模型面同源**：择据 = 日志的两个消费方（模型超帽取回全量、NS4 明文扫描）都要干净文本；留一份原始字节旁路 = 两份面对立、必然漂移（D2）。
  被否 = 日志保原始字节：与本节既有边界句「原始字节面不保真」相抵，且取回时把噪声再喂给模型一次。

#### 先例调查结论

| 对象 | 结论 |
|---|---|
| **§4.7 TTY-DRIVE（同族）** | **机制同族、内核不共用**：彼需**本地**真 PTY（被驱动对象任意 ⇒ `ssh -tt` 帮不上，其 U1 判据 = 被驱动进程自判真终端）；本条只需**远端** PTY（本机 ssh 客户端代配）⇒ 零原生件可行性不同。**依赖政策**：形式同题，**本设计不建议合并裁定**（可行选项集不同：本条 ⓪ 零原生已实测成立；§4.7 的零原生路不覆盖其 U1 判据）——是否一并裁 = 用户的裁量。**设计面**：§4.7 无在册设计（见本节「落点判定」）——本设计**不引用**其任何设计坐标（零悬空指针） |
| 服务端面 `thincoder-server/src/sandbox/ssh.mjs`（同仓先例 · 异面） | spawn 系统 openssh 同路；**沿用**：连接超时 10 s / 失败分类族（auth ∥ unreachable ∥ fingerprint_changed）/ 输出帽语义 / 密钥径无人值守口径（`BatchMode=yes`）。**分述**：该面 = 服务器代管主机（Linux 容器、`sshpass` 口令径、逐条命令非交互）；本条 = 本机直连（三端、askpass 口令径、多往返会话）——面分述、纪律同源（D2） |
| **同族池机制（后台服务族）** | 实现 = `thincoder-core/agent-tools/`：`bash-async.mjs` ∥ `browser-async.mjs`；设计节 = `AGENT-LOOP-ASYNC-POOL.md` §6.10 ∥ 本档 §6.19 ∥ `BROWSER-TOOL.md` §2.11（均 `docs/core/design/`） |
| 凭据零回显纪律 | 异面先例 = 服务端 webui 凭据卡（密文零回显）+ CLI 端掩码步（`ask-steps.mjs`「掩码步零留存」）/ `input.askHidden`——本条 = 第三例，纪律同源、实现各端自持 |
| 弹窗注入缝 | `onQuestion` 三端形（`dispatch-run.mjs:107` ∥ CLI `tool-events.mjs:377` ∥ VSC `panel-callbacks.mjs:259` ∥ 桌面 `agent-bridge.mjs:278`）——`onSecretInput` 逐点照形 |
| §4.2 F5（工具不与用户对话） | 相容：**凭据输入窗 = F5 所指「专门机制」的实例**（输入的是凭据，不是对 agent 的作答）；被驱动端提示（设备 `Password:` / `--More--`）≠ 与用户对话 |
| **保存面上游文档核（本批）** | Microsoft Learn `ConvertFrom-SecureString`：**无 `-Key` ⇒ DPAPI**（逐字已核——加密 / 解密往返同源）；macOS `security(1)` man page：`add-generic-password` 写入径值经 argv（`-w password`）——与本档「值不进 argv」相抵（**未定案**）；`secret-tool(1)` man page：`store` 值经 stdin / `lookup` 出 stdout（已核——候补后端） |
| **保存面库 / 记录先例** | `saveHostRecord`（非密白名单 · 认证成功后写 · 写失败不进连接语义）∥ `onSecretInput` 注入缝（⑧）∥ settings 敏感键掩码（值不回显）——保存面逐点照形 |

#### 裁决记录（四条 · 用户裁定在表）

**① PTY 依赖政策**（需求档 §4.8 裁决 1；同 §4.7 依赖政策同题——不合并裁定理由见「先例调查结论」）：

| 面 | 内容 |
|---|---|
| **选定** | **⓪ 零原生件**——系统 openssh + `-tt` + askpass + 管道（本设计选定路） |
| **选定代价在册** | 平台 askpass 支持逐平台验（版本面 = NS1 判据注）；提示符 ∥ 静默判定 = 文本启发式（无 PTY 级信号）；本地无终端时远端 PTY 尺寸未核（实施轮实测） |

**② 非密记录面 = 只记非密字段**（预填面细化 = 机制 ⑨；密码处置面 = ④）：

| 面 | 内容 |
|---|---|
| **选定** | **非密字段记 host / user（明文）**——预填面照旧；**密码默认每次弹**（保存 = ④ 的显式 opt-in 密文径） |
| **落地面** | 预填档机制 ∥ 落点 ∥ 键形 ∥ 复用范围 = 机制 ⑨；**密码零预填**（保存件 = 连接时静默复用，⑪——不经预填） |

**③ 跨平台口径**（需求档 §4.8 裁决 3）：

| 面 | 内容 |
|---|---|
| **选定** | **三平台实现面全覆盖 + 验证口径收窄** |
| **判据** | 实现面齐全 = 核内两形包装档（Win `.cmd` ∥ POSIX `.sh`）零平台分支缺口；实机腿 = 仅 Windows；mac / Linux = 按文档实现 + 用户反馈迭代（不作实机完成声称） |

**④ 保存凭证（A+B）**（用户裁定；知情面 = 「值不落盘」口径变更）：

| 面 | 内容 |
|---|---|
| **A 密钥优先** | 身份面（`identityFile` / `auth`——⑩）+ 密钥可用 ⇒ 零窗（探连自试）＋装公钥引导（文档步骤——不自动装） |
| **B 加密凭证库** | 显式勾选 ⇒ 系统级加密（Windows DPAPI——密钥来源 = 用户账户）落密文；fail-soft（三故障皆回落窗）；删除面 = `credentials` / `forget`（⑫） |
| **口径变更（知情批准）** | 现行口径 = **默认不落盘**；**显式保存 = 仅密文落用户域**（对「值不落盘」的有意例外）∥ 明文 / argv / env（新增链路）/ 日志 / 仓 = 零入（⑦）；**残余风险（如实）**：本机被攻破 / 用户登录态被夺 ⇒ 密文可解——防线 = 用户域隔离，非抵抗性保护 |
| **本批平台面** | 后端抽象（`vaultAvailable()` 单点）；本批仅 Windows（DPAPI——实机腿）；mac / Linux 保存面不可用（勾选不出现，连接照既有窗路）= 边界；候补路在册（Linux = `secret-tool`（stdin / stdout 已核）；macOS = `security` 写入径值经 argv——与本档通道纪律相抵，未定案） |

#### 边界（本节不做）

- **不做全屏终端仿真**（vim 类 TUI 不伺候）；**不做逐屏渲染 / 光标语义**——输出面 = 文本流。
- **凭据保存 = 显式 opt-in 的密文本机件**（⑪ / 裁决记录 ④）：不做通用凭据托管——仅 ssh **连接**凭据（`secret_input` 设备密文不在保存面）、仅本机（不跨机同步）、仅加密态；明文永不落盘；密钥事务仍归本机 ssh 配置 / agent。
- **不做自动装公钥**（引导 = 文档步骤——⑩）∥ **mac / Linux 保存面不用**（`vaultAvailable()` 单点；勾选不出现——连接照既有窗路）∥ **保存面依赖系统 PowerShell（Windows）——缺席 ⇒ 保存不可用（连接照常，不 brick）** ∥ **不引第三方密钥库 / 原生件**（后端抽象留位；引入 = 另裁）。
- **mac / Linux 无实机腿**（按文档实现 + 用户反馈迭代——实机腿 = 仅 Windows；裁决记录 ③ 判据）。
- **不做隧道管理**（`-L`/`-R` 的动态增删）——在册候选，非「不做」（需求档边界同句）。
- **传输面不做（需求档 §4.8 边界逐字三项）**：递归目录同步 ∥ 断点续传 ∥ 进度条。
- **传输面另定不做（设计另定，D-TO27）**：自动换协议重试 ∥ 远端目录列表；**参数面无目录参数**（`put` / `get` 只收文件路径，不收目录——不做递归）。
- **不做自动建本地父目录**：`get` 的 `localPath` 父目录必须已在盘，不在 ⇒ 拒（② 硬前提行 / 失败面 / E16）——建目录本身就是项目内一笔写，绕写门；要新落点由用户先建。
- **`put` 超时 / 中断后远端可能留半截档，本批不清理**：清远端半截档要第二条通道（同主机另起一次 exec），与本批「零新通道」相抵 ⇒ 如实交底：镜像 / 配置场景用 `overwrite:true` 重传整档，或人工删；清理判据归另批。
- **不做跨会话存活**（agent 会话结束 = 会话灭）；**不做子代面**（depth>0 排除）。
- **不做 `--More--` 自动翻页 / 不做危险命令文本拦截**（后者全交审批门——零文本拦截，见 §6.4）。
- **不引本地 PTY 包装**（`script` / `winpty` / `sshpass` 皆不入）。
- **遮蔽的 1–3 字符残段不遮蔽 = 残余风险**（③ 的 `≥ 4` 阈值）：含控制字节的口令被归一切段后，长度 1–3 的段不进遮蔽表（进则误吞正常输出），这类残段可能落在返回面。
- **原始字节面不保真**：输出面 = 剥后文本（③「日志面 = 模型面同源」），不提供未剥离的字节流；需要原始字节的用途不在本工具。
- **不改需求档**：本批的需求面同步由父侧落笔（`docs/core/requirements/TOOLS.md` §4.8 S3 判据句 = 待答标记 ∥ 提示符 ∥ 硬超时，静默只作去抖）；设计面只引不改。

> 用例表副本 ∕ 条目回指 = 本节内。

### 6.23 网络工具 DeepSeek 后端（WEB-BACKEND-DEEPSEEK · 台账 #1605）

**来源**：需求 = `docs/core/requirements/TOOLS.md` §4.9（W1–W6 ∥ NW1–NW4 ∥ 范围边界 ∥ 验收方向）；用户裁定 2026-10-17 19:11「复用 DeepSeek 预置 provider、零改动自动接入」+ 19:12「行」。本节 = 设计面权威（机制 / 落点 / 判据）。

**落点判定（邻位新节 · 非独立档）**：能力面 = 两个内置工具的后端选择（`websearch` ∥ `fetch`），与 §6.12–§6.22 同冠同邻；不新建档（`docs/README.md` 地图零动）。

#### 先例与公开源（设计前置两行）

**先例行**（对齐 ∥ 偏离）：

| 面 | 先例坐标 | 对齐 / 偏离 |
|---|---|---|
| 可选结构化后端 | Tavily（`thincoder-core/tools/web.mjs:55-77`）——key 读配置 ∥ 非 2xx / 异常返回 `null` ∥ 空结果静默回落 Bing | **对齐**：可选后端 + 静默回落 + 单读取点；**偏离 1** = key 来源改 `providers[]` 自动探测（不另设独立键——用户裁定）；**偏离 2** = 失败分级三档（熔断 / 退避一次 / 直落——需求 W4） |
| 配置面先例 | §6.10 D-5「DeepSeek 端点以完整信息设计选择面」 | **对齐**：本批即该预留槽位的落地 |
| 端面 | 核内单实现（本档 §1；描述面经 `DESC()` 取 `thincoder-core/tool-docs/*.md`） | **对齐**：核内单实现；端侧仅 VSC 装配补 `fetch` 键（`setup.mjs` 三处 + `agent-state.mjs` 一处——⑧），CLI / 桌面 / server 零改 |

**先例批次坐标**：Tavily 可选后端引入批号未在档内可考（`docs/batches/` 实扫零对应批档）；实现坐标即上表。

**公开源核查行**：查过 = ① 本仓 `docs/` 树（`docs/README.md` 地图 ∥ 本档 §6.10 ∥ `CONFIG.md` §6.2 / §6.3）；② 需求档 §4.9 所载官方文档三页（`api/search` ∥ `api/fetch` ∥ `guides/search`——请求 / 响应 / 错误码 / 计费 / 限速已实读，录在需求档「上游事实」行）；③ 登记公共源仓 = 无（`PROJECT-MANIFEST.json` `publicRepos` 实读 `[]`）。**结论** = 有相关：上述三页即唯一上游权威，仓内无第二份副本。

#### ① 资格判据（`providers[]` 自动探测——W1）

**判据**（逐条 AND；全中 = 该条合格）：

| # | 条件 | 口径（设计定义） |
|---|---|---|
| 1 | 渠道条目存在 | 读 `config.providersList`（`?? config.providers ?? []`）；按存储顺序遍历 |
| 2 | `baseURL` 可解析且为 `https:` | `new URL()`；解析失败 ⇒ 不合格 |
| 3 | `hostname` = `api.deepseek.com` | 小写比较；去尾点（`api.deepseek.com.`）；**子域不算**（`x.api.deepseek.com` 不合格） |
| 4 | 端口 ∈ {空, `443`} | `URL.port` 空串 ∥ `"443"`；其它端口不合格（防非标准端口冒名） |
| 5 | `apiKey` trim 非空 | 经 `resolveProviderSecrets`（`thincoder-core/env-ref.mjs:58-67`——`${env:VAR}` 消费侧解析，`CONFIG.md` §6.3）；解析抛错（变量未设 / 畸形）⇒ **该条不合格**（fail-soft——工具不因探测抛错；聊天径自有响错） |

- **多命中 = 取第一个合格条目**（存储顺序）；无合格条目 ⇒ 无 DeepSeek 后端（行为与今日逐字同）。
- **路径不参与判定；端点 = 固定常量** `https://api.deepseek.com/v1/tools/search` ∥ `https://api.deepseek.com/v1/tools/fetch`（不经 `baseURL` 拼接——`/v1` 尾 ∥ 前缀差异不致双 `/v1`）；key 只发官方 host。
- **两端同字段**：CLI 由 `loadConfig` 产 `providersList` 别名（`thincoder-core/config.mjs:322`）；VSC 经 `agent/config` bag 直供 `providersList`（`thincoder-vscode/src/agent/setup.mjs:155,186`）。
- **桌面 / server**：走核同一工具实现（桌面经核 `assembleAgent` ∥ `runAgent`——`thincoder-desktop/src/main/agent-assemble.mjs:18` · `agent-host.mjs:38`；server 核 `loadConfig()`——`thincoder-server/deploy/sandbox/member-shell/core-run.mjs:73`）；两端 `agent.config` 整建点未逐端实读 ⇒ `unverified`（本批零改——核装配产物带 `fetch` 键时读取点自然生效）。
- **派生渠道**（`providers[].derived`——`PROVIDER.md` §6.25）不特判——host 非 `api.deepseek.com` 者自然不合格。

#### ② 后端选择与优先级（W1 ∥ W5）

| 工具 | 链（左先右后；先成先返） | DeepSeek 尝试的条件 |
|---|---|---|
| `websearch` | **DeepSeek → Tavily → Bing** | ① 资格判据命中 ② `websearch.backend !== "local"` ③ 会话未熔断 ④ `query.length ≤ 128` |
| `fetch` | **DeepSeek → 本地直取** | ①–③ 同上（键 = `fetch.backend`）；无查询长度条件 |

- **Tavily / Bing / 本地直取三支零改**（`web.mjs:55-93` ∥ `:122-144` ∥ `:216-250`）——只在链头插入 DeepSeek 尝试。
- **键面**：`websearch.backend` ∥ `fetch.backend` ∈ {`auto`, `local`}，缺省 `auto`（`DEFAULTS` 落 `thincoder-core/config-defaults.mjs:73-78` 邻位）；`local` = 跳过 DeepSeek（**不是**「只用本地能力」）；值非 `local`（含拼写错）一律按 `auto`（fail-open）。键面详表 = `CONFIG.md` §6.5。
- **`args.engine` ∥ `args.page` 不绕过 DeepSeek**：与 Tavily 今日位置一致（`web.mjs:118` 先于 engine 分支）；`page` 对 DeepSeek 无对应参数（忽略，与 Tavily 同）。
- **`args.proxy` 照旧透传**给 DeepSeek 请求（与 Tavily 同——逐次网络决策）；目标 URL 的本地抓取语义不变。

#### ③ 请求 / 响应映射（W2 ∥ W3）

| 面 | 请求体 | 响应 → 工具输出 |
|---|---|---|
| search | `POST /v1/tools/search`：`{ query, count, need_content: false }` | `count = limit`（`limit` 取工具面夹后值——上限 20 由 `web.mjs:111` 夹定；`< 1` 按 1 发（上游 `count` 下限）；`limit` 缺省 8；上游 1–50 能力 = 余量，不在本工具暴露）；`need_content` 恒 `false`（正文按需走 `fetch`）；`query` **原样透传**（`site:` ∥ `lang:` ∥ `after:` / `before:` ∥ 引号运算符不动） |
| search 渲染 | — | 每条 = `${i + 1}. [deepseek] <title>`（带序号——与 Tavily ∥ Bing 既有两腿同形，`web.mjs:120`）⏎ `   <url>` ⏎ `   <date> · authority <n> · rerank <n>` ⏎ `   <summary>`；`summary` 空 ⇒ 用 `snippet`；`authority = -1`（未知——官方 Search API Reference「0 to 4 (-1 means unknown)」，2026-10-17 实读）⇒ 该项省略；三项全缺 ⇒ 整行省略；整段过 `truncate`（200K 帽，`tools/shared.mjs:190-193`） |
| fetch | `POST /v1/tools/fetch`：`{ url }` | `[deepseek] <title>` ⏎ 空行 ⏎ `<content>`（Markdown 原样）；整段过 `truncate`（200K 帽）；`content` 空 ⇒ 返回态 `empty` ⇒ 回落本地 |

- **鉴权头**：`Authorization: Bearer <apiKey>`（另 `Content-Type: application/json`）——形同 Tavily（`thincoder-core/tools/web.mjs:65`）；头面钉死，非 `unverified`。
- **计费口径**：$0.75 / 千次**成功请求**；失败 / 空结果不计；`count` 不影响单价。
- **隐私面**：search 只发 query（不带本机上下文）；fetch 的 URL 发给 `api.deepseek.com`（能力前提——工具描述建议文本明示，NW4）。
- **不发送 / 不渲染**：`ori_question` ∥ `localization`（不发）；`site_name` ∥ `site_icon` ∥ search 的 `content` 字段（不渲染）。

#### ④ 错误 → 行为矩阵（W4）

| 条件 | 重试 | 熔断 | 行为 | 工具结果 |
|---|---|---|---|---|
| `400` ∥ `413` ∥ 其它未列 4xx | 否 | 否 | 回落链 | 照常成功（Tavily/Bing ∥ 本地） |
| `401` ∥ `402` ∥ `403` | 否 | **是**（限时 `BREAKER_TTL_MS` = 10 分钟，到期自动解封） | 回落链 | 照常成功；熔断未到期时本会话不再发 DeepSeek |
| `404` | 否 | 否 | 本次调用回落链（fetch ⇒ 本地直取） | 照常成功；**不熔断**——404 = 目标页面不存在，不是凭据失效；后续 search 照常发 DeepSeek |
| `408` ∥ `429` ∥ `5xx` | **一次**（固定 500 ms） | 否 | 仍失败 ⇒ 回落链 | 照常成功 |
| 网络错误 ∥ 客户端超时（15 s）∥ JSON 畸形 | 否 | 否 | 回落链 | 照常成功 |
| `200` + search 空结果 | — | 否 | 回落链（与 Tavily 空结果同判） | 日志 `n:0` |
| `200` + fetch 空 `content` | — | 否 | 回落本地 | 日志 `n:0` |
| 熔断未到期 | — | — | **不发请求**，直走回落链 | 照常成功 |
| 键 = `local` | — | — | 直走回落链 | 与无渠道逐字同 |
| 私网 / 元数据 URL（fetch） | — | — | 抛现错——`isPrivateUrl` 门在**发请求之前**（`web.mjs:216-217`） | `Error: fetch blocked: …`（一字不改） |

- **返回态映射**（四态 = `ok` ∥ `empty` ∥ `failed` ∥ `unavailable`——定义见「接口契约」）：上表失败类条件（含已熔断）⇒ `failed`；两行 `200` 空结果 ⇒ `empty`；无合格渠道 ⇒ `unavailable`；成功出结果 ⇒ `ok`。
- **熔断域** = `ctx.agent` 对象身份（模块级 `WeakMap<agent, expiresAtMs>`；子代理各自独立；对象回收即清）；无 `ctx.agent`（直调 ∥ 测试）⇒ 不持久化（逐次判定）。
- **熔断时限** = `BREAKER_TTL_MS` = 600 000（10 分钟）——判活时读时钟：未到期 ⇒ 短路；已到期 ⇒ 删条目并放行（改完 key 无需重启会话）。时钟缝 `_setDeepseekClockForTest(fn)`（缺省 `Date.now`，与传输缝成对复位）。
- **退避** = 固定 500 ms、单次（不解析 `Retry-After`——5 QPS 账号级限速下 429 罕见；见 ⑨ D-WB5）。
- **回落提示（仅 search）**：资格命中而 DeepSeek 未出结果 ⇒ 结果末尾追加一行，**文案按返回态分叉**：`failed`（失败 ∥ 已熔断）⇒ `(deepseek backend unavailable — results from <tavily|bing>)`；`empty`（后端成功、零结果）⇒ `(deepseek returned no results — results from <tavily|bing>)`（`<tavily|bing>` = 实际承接腿名，小写）。
- **零提示面**：fetch 内容面两态均不加（保正文保真——D-WB6）；无渠道（`unavailable`）∥ `local` ⇒ 零提示（零回归）；search 回落腿**零结果**（`tavily` ∥ `bing` 也没搜到——无承接腿可名）⇒ 零提示。
- **404 分支依据（本批）**：需求 W3 判词（`docs/core/requirements/TOOLS.md:232`「404（无可提取内容）」——需求档实读）+ 本批来源 Gitee IKQ2KZ（一次抓取 404 停掉后续 search 的现场）；复现径 = ⑦ T7 行（`:1409`：fetch 404 ⇒ transport 1 次、同 agent 紧随 search 仍 1 次）。
  上游错误码语义已落需求档「上游事实」块（`docs/core/requirements/TOOLS.md:221`：404 = 被取页面的状态、401 / 402 / 403 才是继续发请求无意义的三类）——取证链两侧同址可追。

#### ⑤ 日志行（NW3）

- 成功调用恰一行：`logEvent("web:deepseek", { tool, n, ms, cost })`（`thincoder-core/log.mjs:114`——既有 JSON 单行事件面，无新级别）；`tool` = `"search"` ∥ `"fetch"`；`n` = 结果条数（search）∥ 内容字符数（fetch）；`cost` = `n > 0 ? 0.00075 : 0`（$0.75 / 千次，按成功请求）。
- 熔断判定时追加一行：`{ tool, status, tripped: true, ttlMs, ms }`（瞬态回落不记——免噪声）。
- key ∥ query ∥ url 零入日志（只传数字 / 短枚举；`log.mjs` 字段黑名单 + 形态扫描为兜底）。
- **不做**费用面板 / 预算闸（需求范围边界同句）。

#### 接口契约（工具面 · 实现面）

| 面 | 落点 | 形 |
|---|---|---|
| 工具面（链头） | `thincoder-core/tools/web.mjs`（`websearch.execute` ∥ `fetch.execute`） | 先 `backendMode(agent.config, "websearch" ∥ "fetch")`：`"local"` ⇒ 零调用直走既有链；否则调 `deepseekSearch` ∥ `deepseekFetch`，按返回 `status` 分派 |
| 实现面（导出） | `thincoder-core/tools/web-deepseek.mjs`（新） | `backendMode(cfg, key)` · `deepseekSearch({ cfg, query, limit, proxy, agent })` · `deepseekFetch({ cfg, url, proxy, agent })` · 测试缝 `_setDeepseekTransportForTest(fn)` / `_resetDeepseekTransportForTest()`（⑦）· 只读断言面 `_TRIP_STATUS_FOR_TEST`（冻结数组，不改行为——⑦） |
| `backendMode` | 同上 | `cfg?.[key]?.backend === "local"` ⇒ `"local"`；其余（缺键 ∥ 拼写错 ∥ 非串）⇒ `"auto"`（fail-open——键面同 `CONFIG.md` §6.5） |
| 返回形 | 同上 | 四态：`{ status: "ok", text, n }` ∥ `{ status: "empty" }`（后端成功、零结果——search 零条 ∥ fetch 空 `content`）∥ `{ status: "failed", reason }`（尝试后失败 ∥ 已熔断）∥ `{ status: "unavailable" }`（无合格渠道、零网络调用）——**纯值返回、不抛错**（工具腿永不失败，W4） |
| 跳过信号 | `web.mjs` | `unavailable` = 无合格渠道（零网络调用）⇒ 直走回落链、**零提示行**；`local` 由链头拦截，不进本模块 |
| 提示行返回路径 | `web.mjs` | `empty` ∥ `failed` ⇒ 走回落链；search 腿在回落结果串末尾追加 ④ 的提示行（文案按返回态分叉，文本见 ④）；fetch 腿两态零提示（D-WB6）；`unavailable` ⇒ 走回落链、零提示（无渠道 = 零回归） |

#### ⑥ 工具描述建议文本（提示词面——内容依据 = 机制文档，落笔 = eng-coder）

> 增量差异句；其余文字零动。文本面先例 = §6.20 / §6.21。

`thincoder-core/tool-docs/websearch.md`：

```text
Search the web (DeepSeek Search when a DeepSeek provider is configured; otherwise Tavily with a key, else Bing). Returns result titles, URLs, and snippets — DeepSeek results also carry a date · authority (0–4) · rerank (0–3) line and a long summary.
...
- Backend priority: DeepSeek (auto — a providers[] entry with baseURL host api.deepseek.com and a key) → Tavily → Bing. websearch.backend: "local" disables the DeepSeek backend.
- DeepSeek query operators: site:, lang:, after:/before:, and quoted phrases pass through as-is; limit maps to count (1–20).
```

`thincoder-core/tool-docs/fetch.md`：

```text
Fetch a URL and return its content. With a DeepSeek provider configured the URL is fetched through DeepSeek's servers and returned as Markdown ([deepseek] title + content); otherwise it is fetched locally and HTML is stripped to readable text. Private/metadata URLs are never sent.
...
- fetch.backend: "local" disables the DeepSeek backend.
```

**描述预算（F15）**：本批两档新增 ≈ +630 字符（实算：`websearch.md` +≈423 ∥ `fetch.md` +≈208）——现值 1,535 ∥ 731 字符 ⇒ 落笔后 ≈1,958 ∥ ≈939，均不越单档 8,000 字符帽（`PROMPT-SYSTEM.md:317`）；报告态机检 = `node scripts/tool-schema-size.mjs`（同档 `:320`）。

#### ⑦ 测试计划（单测 · 假 transport 替身 · 收口随批删）

**测试缝**（③ 缝，`CONFIG.md` §6.2）：`web-deepseek.mjs` 导出 `_setDeepseekTransportForTest(fn)` / `_resetDeepseekTransportForTest()`（缺省 = `proxyFetch`；**复位即清熔断 WeakMap 并复位时钟缝**——成对，无第三缝）与 `_setDeepseekClockForTest(fn)`（TTL 用例拨时钟）；用例 `finally` 复位。

另导出**只读断言面** `_TRIP_STATUS_FOR_TEST`（`thincoder-core/tools/web-deepseek.mjs:49`：`Object.freeze([...TRIP_STATUS])`）——供用例机械断言「404 零命中」（T7）；它不改行为、不参与复位，**不是缝**（断言面与缝分开登记）。

| # | 面 | 用例（输入 → 期望） |
|---|---|---|
| T1 | 资格 | 官方 host + key ⇒ 命中；大写 host ∥ 尾斜杠 ∥ `/v1` 路径 ∥ 尾点 ⇒ 命中；`http:` ∥ 子域 ∥ 端口 8443 ∥ 空 key ⇒ 不命中 |
| T2 | 资格 | `${env:VAR}` 已设 ⇒ 命中；未设 ⇒ 不命中且不抛 |
| T3 | 资格 | 多条目（首条无 key、次条有 key）⇒ 命中次条 |
| T4 | 选择 | `backend:"local"` ⇒ transport 零调用；键缺省 ⇒ auto |
| T5 | 映射 | `limit:12` ⇒ `count:12`、`need_content:false`；`limit:99` ⇒ 20；`limit:0` ⇒ 1；带运算符 query 原样 |
| T6 | 映射 | 渲染含 `[deepseek]` ∥ date ∥ authority ∥ rerank；`authority:-1` 省略；`summary` 空 ⇒ `snippet` |
| T7 | 错误 | 400/413 ⇒ transport 1 次 + 回落；401/402/403 逐码 ⇒ 1 次 + 熔断 + 回落；熔断未到期 ⇒ 0 次；**404 ⇒ 1 次 + 回落、不熔断**（同一 agent 紧随 search 仍 1 次） |
| T8 | 错误 | 408/429/500 ⇒ 2 次 + 回落；网络错误 ∥ 客户端超时（15 s）∥ JSON 畸形 ⇒ 1 次 + 回落 |
| T9 | fetch | 响应 ⇒ `[deepseek] title` + Markdown；空 content ⇒ 回落本地；>200K ⇒ 截断注 |
| T10 | SSRF | 私网 URL ⇒ 抛错且 transport 零调用 |
| T11 | 零回归 | 无渠道 fixture ⇒ `websearch`（Tavily ∥ Bing 桩）与 `fetch`（本地桩）输出与现实现快照**逐字相等** |
| T12 | 日志 | 成功 ⇒ 恰 1 行 `ev:"web:deepseek"` + `cost:0.00075`；空结果 ⇒ `cost:0`（经 `_setLogsDirForTest` 读回） |
| T13 | 隐私 | 成功腿 ∥ 失败腿：日志文件与工具结果文本 ⇒ `sk-` 字面零命中 |
| T14 | 熔断传染 | fetch 腿 401 ⇒ 熔断；同一 `ctx.agent` 的 `websearch` 腿 ⇒ transport 零调用（直回落链） |
| T15 | 端侧装配 | VSC `applySlotSessionState`：cfgBag 带 `fetch:{backend:"local"}` ⇒ `agent.config.fetch.backend === "local"`；bag 缺 `fetch` ⇒ `"auto"`（DEFAULTS 兜底） |
| T16 | 输出 | 失败形（`failed`）：search 腿 DeepSeek 失败（Tavily 承接）⇒ 结果末尾恰一行 `(deepseek backend unavailable — results from tavily)`；无渠道 ∥ `local` ⇒ 零提示；fetch 腿失败 ⇒ 零提示 |
| T17 | 输出 | 空结果形（`empty`）：search 腿 DeepSeek `200` 零条（Bing 承接）⇒ 结果末尾恰一行 `(deepseek returned no results — results from bing)` ∧ **不含** unavailable 文案；fetch 腿空 `content` ⇒ 回落本地、零提示 |
| T18 | 熔断时限 | `search` 腿 401 ⇒ 熔断；时钟 +599 999 ms ⇒ 再调 transport 0 次；再 +2 ms（越过 `BREAKER_TTL_MS`）⇒ transport 1 次 |

**收集面** = 仓根 `test/run.mjs`（集成层单层 `test/integration/*.test.mjs`）；单元测试档住 `docs/batches/`、`node --test <档>` 直达，不入收集面、不进任何门；收集面外档被启动前自检拒。

端侧 = VSC 装配补 `fetch` 键：`setup.mjs` 三处（声明 ∥ try 内赋值 ∥ cfgBag 条目）+ `agent-state.mjs` 一处；CLI / 桌面 / server 零改（核内单实现）。

#### ⑨ 关键决策记录（含被否方案）

| # | 决策 | 被否方案与理由 |
|---|---|---|
| D-WB1 | key 来源 = `providers[]` 探测（用户裁定） | 独立 `websearch.deepseek.apiKey`——用户 19:11 明令零改动；双 key 违背「复用」 |
| D-WB2 | 端点 = 固定常量，`baseURL` 只供资格判定 | 由 `baseURL` 拼端点——`/v1` 尾 ∥ 前缀差异会生双 `/v1`，且拼路径会把 key 送到非官方路径 |
| D-WB3 | 熔断 = 单域（search ∥ fetch 共享，按 agent 身份）**且限时 10 分钟**（`BREAKER_TTL_MS`）；404 不熔断 | 按工具分域——401/402 为账号级，且 W4 明言「熔断 DeepSeek 后端」；单域实现最小。404 移出熔断名单——404 是目标页面的事实，不是凭据失效（W3 已按逐 URL 条件判它），把它列入熔断会让一次抓取失败停掉 search。无期限熔断 → 改完 key 仍要重启会话，故加 TTL 到期全开；半开探测 ∥ 指数退避被否（多一层状态机、分支无人走过） |
| D-WB4 | 空结果 ⇒ 回落（不直返空）；返回态 `empty`（与 `failed` 分列——提示行换文案，见 ④） | 直返 `(no results)`——与 Tavily 今日判据不一致（`web.mjs:119`） |
| D-WB5 | 退避 = 固定 500 ms 单次 | 解析 `Retry-After`——多一层解析且等待无界（可能超工具耐心）；5 QPS 下 429 罕见 |
| D-WB6 | fetch 内容面零提示行 | 统一加提示——污染 Markdown 正文保真 |
| D-WB7 | 两键 `local` 语义 = 跳过 DeepSeek（不扩枚举） | 新增 `bing` / `tavily` 等枚举值——需求 W5 只裁两值，扩枚举 = 新语义（另批） |
| D-WB8 | 本批零 UI 入口 | 面板加后端开关——逃生口键缺省 `auto` 已满足零配置目标；UI 面改动 = 端侧笔（本批端侧 = VSC 装配补键：`setup.mjs` 三处 + `agent-state.mjs` 一处，UI 零改）。**如用户要面板入口 ⇒ 另批** |

#### 用例表（正常 / 边界 / 错误）

| 类 | 输入 | 期望输出 |
|---|---|---|
| 正常 | 配 DeepSeek 渠道；`websearch {query:"LLM", limit:5}` | 5 条 `[deepseek]` 结果，含 summary + 日期 / 权威 / rerank 标 |
| 正常 | 配渠道；`fetch {url:"https://example.com/doc"}` | `[deepseek] <title>` + Markdown 正文 |
| 正常 | 无渠道；`websearch` | 与今日逐字同（Tavily / Bing） |
| 边界 | `limit:0` / `limit:99` | `count` = 1 / 20 |
| 边界 | `query` 129 字符 | 不发 DeepSeek，直接 Tavily / Bing |
| 边界 | `websearch.backend:"local"`（渠道在册） | 不发 DeepSeek |
| 边界 | `fetch.backend:"local"`（渠道在册） | 不发 DeepSeek，本地直取 |
| 边界 | fetch 内容 > 200K | 截断 + 既有截断注 |
| 边界 | search 腿 DeepSeek `200` 零结果（Bing 承接） | 回落结果 + 末尾恰一行 `(deepseek returned no results — results from bing)` |
| 边界 | fetch 腿 DeepSeek `200` 空 `content` | 回落本地直取，零提示 |
| 错误 | `401` | 熔断 + 回落，工具成功；熔断未到期时 0 请求；越过 10 分钟 ⇒ 恢复正常请求 |
| 错误 | `404`（fetch 腿） | 本次回落本地直取，工具成功；**不熔断**——紧随的 search 仍请求 DeepSeek |
| 错误 | `429` | 2 次请求后回落，工具成功，不熔断 |
| 错误 | `400` | 1 次请求后回落 |
| 错误 | `fetch` 私网 URL | `Error: fetch blocked: …`，零外发 |
| 错误 | search 腿 DeepSeek 失败（Tavily 承接） | 回落结果 + 末尾恰一行 `(deepseek backend unavailable — results from tavily)` |

#### 验收回指（W1–W6 ∥ NW1–NW4 → 判据句）

| 条目 | 判据句（机检形） |
|---|---|
| W1 | 夹具 `providers:[{baseURL:"https://api.deepseek.com",apiKey:"sk-t"}]` ⇒ 结果前缀 `[deepseek]`；transport 计数 = 1；零新增必填配置 |
| W2 | `limit:12` ⇒ 请求体 `count===12 ∧ need_content===false`；结果含 summary 与 date / authority / rerank 标；`limit:99` ⇒ 20 |
| W3 | `fetch(public)` ⇒ 请求体 `{url}`，输出 `[deepseek] title` + Markdown；`fetch(private)` ⇒ 抛错且 transport 零调用 |
| W4 | 401 / 402 / 403 逐码 ⇒ 回落成功 + 熔断期内 0 请求 + 越过 `BREAKER_TTL_MS` 后恢复 1 次；404 ⇒ 恰 1 次并回落、同一 agent 的 search 仍 1 次；408 / 429 / 5xx ⇒ 恰 2 次后回落；400 / 413 ⇒ 恰 1 次；任何腿返回非 `Error` |
| W5 | `backend:"local"` ⇒ transport 零调用且输出与无渠道快照逐字同；键缺省 ⇒ auto；README 键面含两键两行 ∧ 两产品 CHANGELOG 有条目 |
| W6 | 两描述档含运算符面 ∥ 结果标注 ∥ 后端优先级三句；`CONFIG.md` §6.5 ∥ 本节在册；需求 §4.9 已落（父侧） |
| NW1 | 无渠道夹具 ⇒ 两工具输出与现实现快照 `===`；DeepSeek transport 零调用 |
| NW2 | 零 `package.json` 改；`web-deepseek.mjs` 仅 import `node:` / 内部模块 |
| NW3 | 成功恰 1 行日志（`ev:"web:deepseek"`、`cost:0.00075`）；无费用 UI |
| NW4 | 私网 URL ⇒ transport 零调用；日志 / 结果 `sk-` 字面零命中；`websearch.backend` ∥ `fetch.backend` 读取点 = `web.mjs`（核）+ `agent.config.fetch`（VSC 装配：`setup.mjs` 三处 + `agent-state.mjs` 一处）——N8 三面成对 |

#### 边界（本节不做）

- 不自建搜索索引；不接 DeepSeek Harness 的 server-side 工具（直连裸 JSON API）。
- 不为第三方中转 / 反代渠道猜测 `/v1/tools/*`；不做 `websearch.deepseek.baseURL` 覆盖键（留槽位，另批）。
- 不做费用面板 / 预算闸；不改 Tavily / Bing 语义；不动 MCP 搜索面（工具观：MCP 首选 ∥ `websearch` 后备不变）。
- 不跨端各写一份（核内单实现——端侧仅 VSC 装配补 `fetch` 键：`setup.mjs` 三处 + `agent-state.mjs` 一处）；本批零 UI 入口（D-WB8）。
- 不改需求档（§4.9 判据缺口如现 ⇒ 上抛主 agent）。

**UI / 交互决策**：本批无 UI 面改动（D-WB8）；**无 open 项**。

#### 报告发现（连带项——收正点逐条在册）

- `SETTINGS-TOOL.md` 的叶子计数须与本批键面同步：本批两键落 `DEFAULTS` 后按 `flatten` 本体实测回填（`SETTINGS-TOOL.md` §2.4 与本节同拍——实施轮落键后一次写入；D3 计数随表）。敏感命中面仍 = 仅 `websearch.apiKey`（两新键非敏感）。
- `thincoder-core/tool-docs/fetch.md:11`「Non-HTML responses … truncated at ~50000 chars」与 `truncate` 实帽（200K，`tools/shared.mjs:22` `MAX_OUTPUT_CHARS`）不符——**非本批面**（英文运行期面），登记不动。

#### 集成测试设计（F34 · 本批 · 收口口径）

**业务可观察点** = 用户在会话里调 `websearch` ∥ `fetch` 时看到的工具结果与提示行。本批两处业务改动 = 404 不再熔断 ∥ 熔断限时 10 分钟。集成用例：

| # | 入口（业务可观察点） | 判据（断言什么） | 指回 |
|---|---|---|---|
| I-WB1 | 配 DeepSeek 渠道的会话：`fetch` 一个上游回 404 的地址（本地 fixture 页），随即同一会话 `websearch` | 首次回执 = fixture 页正文（本地直取承接，可读、非「后端不可用」）；第二次回执以 `1. [deepseek]` 起头 ∧ DeepSeek search 替身命中 **1** 次 ⇒ 一次页面 404 没把后端停掉 | W4（`404` 行） |
| I-WB2 | 同一会话：DeepSeek fetch 替身回 401 ⇒ `fetch` 一个 fixture 页；随后再 `websearch` 一次 | 首次回执 = fixture 页正文（回落本地直取成功）；第二次 DeepSeek search 替身命中 **0** 次且调用在预算内结算（不悬挂）⇒ 熔断只停后端、不停工具 | W4（`401` / `402` / `403` 行） |
| I-WB3 | 未配 DeepSeek 渠道的会话 `websearch` 一次 | 回执与改动前逐字相等；零 `(deepseek …)` 提示行；DeepSeek 替身零命中 ⇒ 无渠道用户零变化 | W1 · W5 · NW1 |

- **端点固定常量 ⇒ 替身走既有传输缝**：① 判据只认 `api.deepseek.com`、端点 = 固定常量（D-WB2）⇒ 业务入口指不到本机假上游；门内用例用既有 `_setDeepseekTransportForTest(fn)` 作替身（⑦ 同一对缝，`finally` 复位），不放宽产品语义、不引新缝。
- **10 分钟到期解封不设门内格**：业务入口没有时钟缝，门里断言它要实等 10 分钟（N16 单用例硬超时）。该半由单测 T18 判（`_setDeepseekClockForTest` 两读数：`+599 999 ms` ⇒ 0 次 ∥ 再 `+2 ms` ⇒ 1 次）；门内只判「窗口未到期时零请求」（I-WB2）。
- **回落腿的文本面不进集成格**：`(deepseek backend unavailable — results from <腿名>)` 的文案分叉由单测 T16 / T17 判；集成格只判上游命中计数与调用结算——承接腿（Tavily ∥ Bing）是外网腿，门内零外网（N15）。
- **落点**：`test/integration/web-backend-404.test.mjs`（常驻——随集成层收集面走，不随批删；收集面 = 仓根 `test/run.mjs` 的单层 `test/integration/*.test.mjs`，别处的档被启动前反查拒收集）。本批单测档仍随批删（⑦）；集成档是长期守点，与单测档是两个对象。

### 6.24 `batch` 收口前置与重开径的文本面（链完整性门 · 带审计重开）

**契约单源 = `BATCH-RECORD.md` §4.18**（判据 / 触发条件 / 不变量在本档不重述；本节 = 模型可见文本面与拒句逐字，承 §6.20 先例）。

**① 三处 schema description 换写（`agent-tools/batch.mjs`）——逐字**：

| 键 | 换写后逐字（只列追加 / 改动分句；其余分句不动） |
|---|---|
| `status` | `… prose goes to the separate `note` field, which lands as a parenthetical). Writing §1 已收口 closes the record and runs the closeout-chain gate: every section must carry content (§5 exempt) — the `不适用` declaration is retired, so any `> 不适用：§N` line in §1 is refused outright. Reopening a frozen record = §1 → 进行中 with `note` = the reason: the tool rewrites the §1 status line and appends a 「重开记录」 line — no other existing line is touched.` |
| `note` | `… Omit for a plain value. On the reopen path (a frozen record, §1 → 进行中) `note` is REQUIRED and lands verbatim in the §1 reopen record instead of the status-line parenthetical (it may name the frozen keyword there).` |
| `close` | `close (depth-0 only — freeze the record: §1 → 「已收口 <date>」, every further write is refused except the reopen conjunction; runs the same closeout-chain gate as status — an incomplete chain is refused, naming the missing sections)` |

**② 四条拒句（逐字 · 模型可见）**：

| # | 场景 | 逐字 |
|---|---|---|
| J1 | 链门（缺段非仅 §6） | `batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. Missing: <§2 / §3 …>. Each named section must carry its own content — the `不适用` declaration is retired (every batch needs its design, its review and its approval). §6 must carry its verification. Nothing was written.` |
| J2 | §6 为唯一缺段 | **旧串逐字**（`emptySectionSixError()`——零回归）：`batch: §6 收口段为空（non-empty gate）— close refuses: the closeout section (§6) has no content, and closing would freeze the record with that section permanently empty. Write the section first (append §6: the closeout / verification summary), then call close again. Nothing was written.` |
| J3 | 声明已停用（`§1` 出现即拒） | `batch: `不适用` 声明已停用（inapplicability declaration retired）— no declaration is accepted: §2 / §3 / §4 / §6 must each carry content (§5 exempt). Offending line: <该行原文>. Nothing was written.` |
| J4 | 重开缺理由 | `batch: 重开需理由（reopen requires a reason）— reopening a frozen record reverses a recorded decision, so the reason must be stated: pass it as `note` (it lands verbatim in the §1 reopen record). Nothing was written.` |

**③ 两处行字面（逐字——工具写盘形态）**：

| 面 | 逐字 |
|---|---|
| 重开后的状态行 | `**状态行**：进行中（重开 <YYYY-MM-DD>）` |
| §1 尾部追记行 | `**重开记录**：<YYYY-MM-DD> · 原收口 <旧日期> · 理由 = <note> · 操作者 = 主 agent`（**原收口 = 改写前状态行的收口日期字面**；无日期字面 ⇒ 落「未标日期」——重开后首收口时点只在此行保留） |

**④ `edit` 动作的描述面（`thincoder-core/tool-docs/batch.md` + `batch.mjs` 的 action 枚举行）——逐字**：

| 键 | 换写后逐字（只列追加 / 改动分句；其余分句不动） |
|---|---|
| action 枚举行 | `edit — replace one anchored range inside YOUR OWN section (§1–§6 alike; your identity decides which section) …` |
| `edit` 参数说明 | `oldText must match exactly once, byte for byte (line endings included), inside the section body; newText replaces that range, and an empty newText deletes it. Refused with nothing written: a blank oldText, zero hits, two or more hits (the matching lines are named), an anchor crossing the section boundary, and any anchor or replacement that touches or introduces a `**状态行**：` line (the status line has one writer: `status`).` |

**⑤ `edit` 的拒句（逐字 · 模型可见）**：

| # | 场景 | 逐字 |
|---|---|---|
| E1 | 空锚 | `batch: edit needs a non-empty oldText — a blank anchor cannot match exactly once. Nothing was written.` |
| E2 | 零命中 | `batch: edit anchor not found — oldText must match the §<N> body exactly once, byte for byte (line endings included). Nothing was written. Re-read the section and pass its current text verbatim.` |
| E3 | ≥2 命中 | `batch: edit anchor is not unique — it matches <N> places inside §<N> (lines <n1>, <n2>, …). Extend the anchor until it matches once. Nothing was written.` |
| E4 | 锚越段界 | `batch: edit anchor crosses the §<N> section boundary — it starts outside the section body or reaches the next §N header, and rewriting across it would break section location. Nothing was written.` |
| E5 | 触及 / 引入状态行 | `batch: edit would rewrite or introduce a **状态行** line — that line has exactly one writer: status, with a value from the section's word list. Nothing was written.` |
| E6 | 已收口 / 段域 / 骨架保护 / 凭证 | 冻结串 · 骨架保护串 · 剥凭证**逐字同 append 面**；**骨架保护串的一句改写** = `…would break section location and the append-only guarantee.` → `…would break section location.`（段内一个写面下它仍成立；早先那句「and the append-only guarantee」只对证据面成立）。**段域拒文按场景分两族**。**族一·无写权身份 = `append` 与 `edit` 共用一条**（同一件事不各写一份串——`noSegmentError`）：工程面 `batch_segment: no segment is writable by this caller — the channel exists for eng-designer (§2), eng-coder (§5) and design reviews bound to a batch record (§3); the parent agent writes §1/§4/§6 through ordinary document writes.` ∥ 普通面同句，尾句作 `… ; in normal mode the parent agent writes §1/§2/§4/§5/§6 through ordinary document writes.`。**族二·段域不合 = `edit` 自成一形三式**（不复用 `append` 串：那串说的是「追加只到这几段」，而 `edit` 的调用者正是能改自己那一段的人 ⇒ 逐字复用即谎报）：depth-0 工程面 = `batch: §<N> is not yours to write — in engineering mode depth-0 edit rewrites §1/§4/§6 (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder). Nothing was written.` ∥ depth-0 普通面 = `batch: §<N> is not yours to write — in normal mode depth-0 edit rewrites §1/§2/§4/§5/§6 (一段一作者: §3 = design review only). Nothing was written.` ∥ 子代理 = `batch_segment: §<N> is not yours to write — this caller writes §<own> only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5). Nothing was written.` |

**边界（本节不做）**：本批只**新增一个 action**（`edit`）与两个 schema 属性（`oldText` / `newText`）；其余 action 与参数零改（理由走既有 `note`）· 不改 `STATUS_WORDS` 词表 · 不改冻结门对已收口档 append / status / edit 的拒（串逐字）· 不改 `close` 的 §6 单段拒串（J2 逐字）· 端面零改（VSC / desktop 消费同一 tool-docs）。用例表 ∕ 验收回指 = `BATCH-RECORD.md` §4.19（本档不重述）。

### 6.25 eng-coder spawn 的令牌必填与门报错三态（FR33 · 工具说明 ∥ schema ∥ 拒句）

**来源**：用户 2026-10-19 22:10 逐字「开批修！」；需求权威 = `ENGINEERING-MODE-V2.md` §13.11（FR33）；台账 `#1712`。提示词面落点 = `PROMPT-SYSTEM.md` §6.35（本档不重述其逐字文本）。

**机制（三处文本 + 一处分支）**：

- 工具说明与 schema 的后果句统一为「missing or mismatched = the spawn is refused」，与 `batchDoc`（"Refused when absent…"）/ `round`（"missing = refused"）同形。
- 门的同一句 `Invalid or missing design token` 拆三条判定分支：未传 / 值不等 / 值无效（第三条再按 `tokenExpired` 分过期 ∥ 格式非法两句）。**拒绝集合不变**（仍是三条件合取），只改分支与文案。
- 四条拒句都不回显令牌值；mismatch 句可带 designId（designId 不是凭证）。
- **机制本体** = `ENG-TOKEN-BINDING.md` §4（生命周期表 ∥「仅过期拒删槽」铁律）· §6.1（在位核对表）——本档不重述。

**取法（最近先例 ∥ 偏离）**：先例 = 本档 §6.24（收口门的文本面：拒句逐字 + 落点表 + 用例三分）∥ §6.32（规则携 why、就地改既有文本）。
**对齐** = 拒句逐字成文、落点表给「`file:line` 现文 → 新文」、用例按正常 / 边界 / 错误分类——同 §6.24 的面形。
**偏离** = 本节把**判定分支**与拒句写在同一页：三态拆分的每一句必须与它的触发判据并排可判，拆去别处会让「哪句在什么条件下出现」无处可查；实现仍住 `subagent-spawn.mjs`，本节只给形态。

**勘察证据行**：`ENG-TOKEN-BINDING.md` §3（`:31` 格式 / 畸形串门禁拒且不删槽）· §4（`:43` 门禁行「仅过期拒删槽」）· §6.1（`:170` 在位核对）——**结论 = 零改**：语义与本批三态拆分一致（删槽只在 `tokenExpired` 分支），本批只改出口文案；该档所引 `subagent-spawn.mjs:237` 的坐标处置见「边界」。

`DESIGN-TOKEN-SETTLEMENT.md` §9 F-SL1 清点行契约（行末恒携 `designToken=<全串>`；畸形 ⇒ `designToken=—`，`:158`）——**结论 = 零改**：本批不动清点 / 消费 / 行格式（`design-slots.mjs` 零触）。
另核 `docs/README.md:78`：两档均在册（令牌 / 参数 / 设置面）。

**① 工具说明逐字（`thincoder-core/tool-docs/subagent.md`）**：

| 坐标 | 换写后逐字（只列改动句；同段其余分句不动） |
|---|---|
| `:20` eng-coder 角色行 | `REQUIRES a valid designToken from a passed advisor(type='design') review — pass the exact value from that review, or copy it verbatim from the action:'design-slots' row (the text after designToken=): missing or mismatched = the spawn is refused, and an expired token is refused with expired named (its reply also echoes a designId — pass it: required to pick between concurrent designs, optional for one; echo it back in the delivery report).` |
| `:23` 任务书段末 | 段末追加一句：`An eng-coder spawn also carries designToken — the write credential (the exact value from the review, or copied verbatim from the action:'design-slots' row, the text after designToken=): missing or mismatched = the spawn is refused.` |

**② schema 描述逐字（`thincoder-core/agent-tools/subagent.mjs:146`）**：

现文：`Required when role='eng-coder': the token from advisor(type='design') after the review passed — without it, eng-coder cannot modify files.`

```
REQUIRED for role='eng-coder': the exact token issued by advisor(type='design') after the review passed — copy it verbatim from the design-slots row (the text after designToken=). missing or mismatched = the spawn is refused; an expired token is refused with expired named. Pass it on every eng-coder spawn, fix rounds included (they reuse the same token).
```

**③ 门三态分支的四条拒句逐字（`thincoder-core/agent-tools/subagent-spawn.mjs`）**：

| 态 | 触发判据（顺序固定） | 逐字拒句 |
|---|---|---|
| missing | `resolveDesignSlot` 无槽（`:131` 改写为同句）∥ `typeof args.designToken !== "string"` ∥ trim 后为空 | `designToken missing — the eng-coder spawn is refused: no usable token for an approved design slot came with this spawn. Pass the designToken parameter with the exact value from the subagent action:'design-slots' row (the text after designToken=), copied verbatim; if that list is empty, no design review has been approved in this session yet — run advisor with type='design' first. No token value is echoed here.` |
| mismatch | 参数在场 ∧ `args.designToken !== issuedToken` | `designToken mismatch — the eng-coder spawn is refused: the value passed does not equal the token held for this design slot. Re-read the subagent action:'design-slots' row and pass the value after designToken= verbatim, unchanged. No token value is echoed here.`；designId 给定时追加 ` (designId: <designId>)` |
| expired | 值相等 ∧ `!validateDesignToken(args.designToken)` ∧ `tokenExpired(args.designToken)` | `designToken expired — the eng-coder spawn is refused: the token matches this design slot but is past its TTL. The expired slot has been removed; run advisor with type='design' again on the current design and pass the newly issued token — an expired authorization cannot be retried. No token value is echoed here.` |
| invalid（格式非法） | 值相等 ∧ `!validateDesignToken(args.designToken)` ∧ `!tokenExpired(args.designToken)` | `designToken invalid — the eng-coder spawn is refused: the value passed equals this design slot's stored token, but that stored value is not a well-formed token, so no expiry can be judged and the slot was left in place. Run advisor with type='design' to issue a fresh token for this design; a malformed record never passes the gate. No token value is echoed here.` |

判据顺序 = `resolveDesignSlot`（既有未知 designId / 多槽缺 designId 两条诊断零改）→ 参数在场 → 值相等 → 值有效。

**第三态两句互斥且穷尽（机判）**：`validateDesignToken(given)` = `tokenExpiryMs(given) !== null ∧ expiry >= Date.now()`（`thincoder-core/agent-tools/design-token.mjs:55-58`）；`tokenExpired(given)` = `tokenExpiryMs(given) !== null ∧ now > expiry`（`thincoder-core/token-ttl.mjs:55-58`）。

⇒ `!validateDesignToken ∧ !tokenExpired` 等价于 `tokenExpiryMs(given) === null`，即格式非法。
故两句各只说谓词已证之事：TTL 与删槽只在 `tokenExpired(given)` 句出现，invalid 句不称 TTL、不称删槽。

槽删除只在 `tokenExpired(given)` 成立时发生（D-R16c ③：过期拒才清槽）；mismatch 与格式拒**不删槽**（T-R16d）。旧式 `expiredReject = !!issuedToken && args.designToken === issuedToken && tokenExpired(issuedToken)`（`subagent-spawn.mjs:253`）落在「值相等」分支内 ⇒ 与本节的 `tokenExpired(given)` 同一条件，删槽集合零改。

**畸形槽值为何可到门**：`restoreEngTokens` 只丢「字符串 ∧ 已过期」的槽值，畸形串读回内存 Map（`thincoder-core/token-ttl.mjs:133-137`）；清点行对畸形值显示 `designToken=—`（`DESIGN-TOKEN-SETTLEMENT.md:158`）——模型虽难逐字取得该值，门一旦遇到仍必须说真话：在此态沿用 TTL 措辞即假话。

**④ 提取形态（实施席照此落笔 · 语义零改）**：

```js
export function designTokenRefusal(kind, designId) {
  if (kind === "missing") return new Error(`designToken missing — …（③ missing 逐字）`)
  if (kind === "mismatch") return new Error(`designToken mismatch — …（③ mismatch 逐字）` + (designId ? ` (designId: ${designId})` : ""))
  if (kind === "expired") return new Error(`designToken expired — …（③ expired 逐字）`)
  return new Error(`designToken invalid — …（③ invalid 逐字）`)
}

export function gateDesignToken(parent, args) {
  const issuedToken = resolveDesignSlot(parent, args?.designId).token
  // 非字符串 ⇒ 空串 ⇒ missing（本意——T9 锁定）
  const given = typeof args?.designToken === "string" ? args.designToken : ""
  if (!issuedToken || !given.trim()) throw designTokenRefusal("missing")
  if (given !== issuedToken) throw designTokenRefusal("mismatch", args?.designId)
  if (!validateDesignToken(given)) {
    const expired = tokenExpired(given)
    if (expired) removeDesignTokenSlot(parent, args?.designId, given)
    throw designTokenRefusal(expired ? "expired" : "invalid")
  }
  return issuedToken
}
```

`buildSpawnChild` 的 token 门块（`:245-258`）改为 `issuedToken = gateDesignToken(parent, args)`——**返回值必须落回 `issuedToken`**：`:345-347` 的 `if (role === "eng-coder" && issuedToken) child._engDesignId = args.designId ?? null` 依赖它，丢返回值即丢 designId 回写。

`resolveDesignSlot` 的 `:131` 无槽拒句改为 `throw designTokenRefusal("missing")`（单行换单行，行数 ±0）。sync / async 两路共经 `buildSpawnChild`，一处改双路生效。

**导出与 import 面**：两枚 `export function`（`designTokenRefusal` / `gateDesignToken`）住 `thincoder-core/agent-tools/subagent-spawn.mjs`。

测试 import 面 = `import { gateDesignToken, designTokenRefusal } from "../../thincoder-core/agent-tools/subagent-spawn.mjs"`（单元测试档住 `docs/batches/`、名随批档 ⇒ 上一级是 `docs/`，故两级回仓根）。

**helper 落位**：两枚定义追加在同档模块尾（`buildSpawnChild` 之后、文件末）——函数声明提升 ⇒ 前向调用合法；副作用是 `:131` / `:237` 行号不漂移，`ENG-TOKEN-BINDING.md:43` / `:170` 所引坐标继续有效（该档本批零改）。

**⑤ 落点表（file:line + 现文 → 新文）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/tool-docs/subagent.md:20` | `REQUIRES a valid designToken from a passed advisor(type='design') review (its reply …` → ① `:20` 逐字 | 句内替换（行数 ±0） |
| L2 | `thincoder-core/tool-docs/subagent.md:23` 段末 | `… round (initial\|fix) is mandatory for eng-coder/eng-designer.` 之后 → ① `:23` 追加句 | 行内追加（行数 ±0） |
| L3 | `thincoder-core/agent-tools/subagent.mjs:146` | 现文（见 ②）→ ② 逐字 | 描述替换（行数 ±0） |
| L4 | `thincoder-core/agent-tools/subagent-spawn.mjs:131` | `throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")` → `throw designTokenRefusal("missing")` | 替换 |
| L5 | `thincoder-core/agent-tools/subagent-spawn.mjs:240-258` | 三条件合取 + 同一句 → `issuedToken = gateDesignToken(parent, args)`（④）+ ③ 四条拒句 | 提取 + 分支（约 +30 行） |
| L7 | 同档模块尾（`buildSpawnChild` 之后） | 新增 `export function designTokenRefusal` + `export function gateDesignToken` | 追加（约 +20 行；声明提升 ⇒ 前向调用合法，`:131` / `:237` 不漂移） |
| L6 | `thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `batchDoc is mandatory` 行之后 | 提示词必填行 → `PROMPT-SYSTEM.md` §6.35 逐字块 A | 追加（本档不重述） |

**⑥ 测试计划**：

- 档落点：单元测试档（住 `docs/batches/`、名随批档、用毕即删——零留存；口径单源 = `docs/core/design/TESTING.md` §10.3）。
- 跑法：`node --test <单元测试档>`（cwd = 仓根，直达不经 runner）；收口门 = 本批单元测试档已删（口径 = `docs/core/design/TESTING.md` §3.5 收口前置门）。
- 夹具：fake parent `{ _engDesignTokens: new Map([[id, token]]) }`；过期 token = `${randomUUID()}:${Date.now() - 1000}`；畸形槽值 = `"not-a-token"`（段数 ≠ 2 ⇒ `tokenExpiryMs` 返 null）。
- **分类 = 批次单测**（零留存——用毕即删；T1–T9 是本批的反馈回路）。

| # | 用例 | 输入 | 断言 |
|---|---|---|---|
| T1 | missing（参数缺） | 活槽 + args 无 `designToken` | 抛错；消息 = missing 逐字；含 `designToken` / `design-slots`；不含槽 token 值；槽未删 |
| T2 | missing（无槽） | 空 map + args 带任意 token | 抛错；消息 = missing 逐字（`:131` 并入同态） |
| T3 | mismatch | 活槽 + 错值 | 抛错；消息 = mismatch 逐字；含 `designId`（给定时）；不含两个 token 值；活槽未删 |
| T4 | expired | 过期槽 + 槽值 | 抛错；消息 = expired 逐字；含 `expired`；槽已从 map 删除 |
| T5 | 正常 | 活槽 + 槽值 | 返回槽值；槽保留 |
| T6 | 四条拒句互异 | T1 / T3 / T4 / T8 的消息 | 两两不相等 |
| T7 | 既有诊断零改 | 未知 designId；双槽缺 designId | 原两条消息逐字命中（不属三态） |
| T8 | invalid（格式非法但值相等） | 畸形槽值 `"not-a-token"` + args 传同一串 | 抛错；消息 = invalid 逐字；含 `invalid`；不含 `expired` / `TTL`；不称已删槽（`removed` 零命中）；槽仍在 map |
| T9 | 非字符串 ⇒ missing | 活槽 + `designToken: 123`（number）∥ `null` | 抛错；消息 = missing 逐字（标签 = missing 为本意：非字符串不携带任何可用值，读者的动作与缺席同——按 `design-slots` 行逐字重传）；槽未删 |

**⑦ 验收（回指 §13.11）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.11 ②：工具说明 + schema 含同形句 | `node -e` 子串计数：`subagent.md` ≥2、`subagent.mjs` ≥1 次 `missing or mismatched = the spawn is refused` |
| A2 | §13.11 ③：三态互异 + 点名 + 不回显 | 单测 T1–T9 全绿（含第三态两句互斥：T4 含 `expired`、T8 零 `expired`） |
| A3 | §13.11 ④：提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（提示词行由 §6.35 落地） |
| A4 | §13.11 ⑤：普通模式 / depth>0 零回归 | 零回归读数取核包可达面（核仓无集成测试集，口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL4）：本批单测档 `node --test` 按例全过 + `cd thincoder-core && npm run prepublishOnly` ⇒ exit 0 ∧ 输出 `check-syntax: N file(s) OK`；`agent/family-tools.mjs:90-110` 零改 |
| A5 | 门判定语义零改 | 拒绝集合 = missing ∨ mismatch ∨ invalid（旧三条件合取）；T5 + 既有用例 |

**边界（本节不做）**：自动补全（缺参 + 活槽时代取）——需用户单独裁定 · 令牌签发 / TTL / 消费零改 · depth>0 子通道 schema 裁剪零改（`agent/family-tools.mjs:90-110`）· 普通模式零改 · 评审链零改 · `resolveDesignSlot` 的未知 designId / 多槽缺 designId 两条诊断零改 · 不改 `batch` / 台账 / 批次档机制 · invalid 句不细分畸形形态（段数 ≠ 2 / uuid 不合形同句；槽值非字符串落 mismatch 或 missing，不入 invalid）。

**外部档案处置（本条不在本批写入面）**：`ENG-TOKEN-BINDING.md:43` / `:170` 所引 `subagent-spawn.mjs:237` 在 L7 落模块尾时**不漂移** ⇒ 该档两处坐标继续有效、本批零改。
若实施席改落他处致 `:237` 漂移：父侧收口按 `grep -n "validateRoundParam(args)" thincoder-core/agent-tools/subagent-spawn.mjs` 的实测行号同步该两处（到期条件 = L5 落地即触发；不得留待无人认领）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 三态 = 同一次判定的三条分支（第三态两句：过期 ∥ 格式非法），拒绝集合与旧合取全等 | 需求明令「不改门的三条件判定语义」；换的是出口文案，不是准入 |
| K2 | 抽 `gateDesignToken(parent, args)` + `designTokenRefusal(kind, designId)` | 三态可单测而不必装配子代理；sync / async 两路同源 |
| K3 | `:131` 无槽并入 missing 态 | 无槽时读者要的是取值路径与评审入口；missing 句自带 `if that list is empty, no design review has been approved in this session yet — run advisor with type='design' first`，空清单与无槽同源可解，不需另立一句 |
| K4 | 只有真过期（`tokenExpired`）删槽；mismatch 不删 | 沿用 D-R16c ③（过期拒才清槽）/ T-R16d（调用方错误不得销毁有效槽） |
| K5 | 四条拒句零令牌值；mismatch 可带 designId | 凭证不回显是既有纪律；designId 非凭证 |

**UI / 交互决策**：无界面面——本条改的是模型可见文本与错误出口。

**实施拆分（两舱 · 文件集不重叠）**：

| 舱 | 变更面 | 文件 | 验收 |
|---|---|---|---|
| 舱 A · 文本面 | 模型可见说明与提示词 | `thincoder-core/tool-docs/subagent.md` · `agent-tools/subagent.mjs:146` · `thincoder-core/prompts/persona-engineering.md` | A1 + §6.35 A1–A4 |
| 舱 B · 代码 + 测试面 | 门分支与拒句 | `agent-tools/subagent-spawn.mjs` · 核单测档 | A2 / A4 / A5 |

不合并的理由：两舱文件集不重叠 ⇒ 可并行派工、`dependsOn` 不需要——`files` 本就是调度通道（冲突检测用），不是切面依据；验收面是同一份 A1–A5，两舱各读其中一部分。

### 6.26 编辑族行号锚护栏（`edit` 行号形 ∥ `insert_after` 记账面）

**判据（定位，不重述）**：行号来自模型上一次 `read`；那之后任何一笔写都让它整体错位，而错位不报错——它改到隔壁几行上，回执仍写成一次成功。判据 = 记账面六行（含 `isDirty` ∧ 陈旧快照），权威 `docs/core/design/EDIT-HELPERS.md` §7（本档不给判定表——D2）。

**契约要点**：目标区整体在写点之前 ⇒ 放行，边界按记账类型分——`insert` 记的 `endLine <= startLine`、`edit` 记的 `endLine < startLine`。其余 ⇒ 拒，拒文带路径、漂移量 `±shift` 与两条下一步（重 `read` ∥ 位置无关寻址 `old_string` / `hashline_edit`）。`write` 全文重写后 ⇒ 任何行号拒。`isDirty` ∧ 快照在场 ⇒ 拒（快照陈旧）。

批量同档：行号条目按快照降序先应用，重叠整批拒（原子零写），内容条目随后按调用序；判定点在组循环之前、用批前快照判一次。

**机面落点**：

| 面 | 落点 |
|---|---|
| 判据 + 拒文构造 | `thincoder-core/tools/write-path.mjs` 的 `lastWrites` 容器与 `lineAnchorVerdict` / `lineAnchorRefusal` |
| edit 单形态 | `thincoder-core/tools/edit-diff.mjs`（`runSingleEdit`） |
| edit 批量帧 | `thincoder-core/tools/edit-batch.mjs` |
| ACP 桥 | `thincoder-cli/src/acp/bridge.mjs`（三入口 `write` / `editSingle` / `editBatch`——判据 + 帧 + 写后记账） |
| patch 陈旧快照出口 | `thincoder-core/tools/patch.mjs` 的批级记账循环（`markDirty` 时同 `clearLastWrite`） |
| insert_after | `thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute`（改调单源判据与构造器） |
| 描述面 | `thincoder-core/tool-docs/edit.md` · `thincoder-core/tool-docs/insert_after.md`（六要素 ⑤ 错误形态） |

**不落快照的写入口**：`thincoder-core/agent-tools/batch.mjs`（批档直写）与 `bash`（外部进程直写）——判定 = 不接，理由住 `docs/core/design/EDIT-HELPERS.md` §7.4 末表。

**受影响面闭集**：五条通道逐条判（`thincoder-core/agent-tools/` · `thincoder-core/tools/` · `thincoder-cli/src/acp/bridge.mjs` · `thincoder-vscode/src/` · `thincoder-desktop/src/`），判定与理由住 `docs/core/design/EDIT-HELPERS.md` §7.4（本段只指不述——D2）。缺席即视为漏：没提的那一档不进检查范围。

**验收**：`docs/core/design/EDIT-HELPERS.md` §7.1 的六行判据（放行两行 / 拒四行）、§7.3 的批量帧 R1–R4、§7.2 的拒文四要素各有单测；拒文含路径、漂移量、两条下一步。

**边界**：记账面 = 本进程内一张表——跨进程 / 跨实例写同一档不在护栏内（`EDIT-HELPERS.md` §7.4）。不加提示词面句子：护栏自己解释并给出下一步。不动 `write` / `apply_patch` / `hashline_edit` 的判定语义（`apply_patch` 只多落一笔清快照）。


### 6.27 `tester` 子代理的工具面（读数角色）

**面切分（本节只写这一层）**：`tester` = 第三种工具面，介于 `explore` / `plan` 的纯只读面与 `coder` 的全量面之间——它拿得到执行、拿不到写。

**判据本体不在本节**：工具面公式、过滤分支、角色 enum 两处、任务书形、池位，**单源住 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.2**（本节不复制公式与枚举，回指即可；改动只改那一处）。

**零新增工具**：本批不注册任何工具、不动任何工具 schema——`tester` 拿到的面 = 父侧工具表过一遍过滤的结果；父侧多一把只读工具，它自动跟着多一把。

**描述面**：`thincoder-core/tool-docs/subagent.md` 的角色矩阵在实施轮加 `tester` 一行，逐字依据 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.3。

### 6.28 工具输出里的过程档标记（`grep` ∥ `bash` ∥ `execute`；过程档命中不可当设计依据 · FR41 §13.19 3-补）

**需求坐标**：`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19 条 3-补。四裁 = 18:32 提问 ∥ 18:34 选「B（命中处打标）」∥ 18:37 选「甲（行首前缀）」并补强「必须用更明确的指示，告知不能作为设计依据」∥ 18:41 `execute` 一并做、判据与 `bash` 同套（主 agent 转达用户「两个都评审吧，然后自动跑完」并按建议执行）。

**机制一句话**：`grep` ∥ `bash` ∥ `execute` 输出的每一条**行**，若能判定其来源档落在索引排除集者，**行首**加逐字前缀 `[process doc: not a design basis]`（原行整体后随）；其余行一个字节不变。**不是门**——不拦、不筛、不改命中集。

三面判据分两套，但共用一份文案、一个谓词、一个 helper（见下「落点」）：`grep` 的输出是我们自己的结构形，按**这条命中的档**判；`bash` ∥ `execute` 的输出是任意文本，按**行首路径 token 反查盘上是否存在**判——这两面判据逐字同一套，只换拼装点与解析基准。

**接线点五处，不是三处**：`grep`（核）· `bash` 同步（核）· `bash` 后台摘要（核）· `execute`（核）· **VSC 的 `bash`（端侧独立实现）**。

- VSC 的 `bash` 不走核 `bashTool`：`thincoder-vscode/src/tools/index.mjs` 有 `import { bashTool } from "./shell.mjs"`；该档 `thincoder-vscode/src/tools/shell.mjs` 自带 `export const bashTool = {` 与 `function applyLineFilter(output, filter) {` ⇒ 核内打标在 VSC 端**不会自动生效**，漏接它 = 换个端就绕过本节的全部目的。
- `grep` ∥ `execute` 确是同核实现（`thincoder-vscode/src/tools/index.mjs` 取核 `grepTool` 与 `executeTool`），本批无需端侧动作。

| 分支 | 触发 | 输出 | 依据 |
|---|---|---|---|
| 标 | 所属档在排除集内 | `[process doc: not a design basis] <file>:<line>: <content>` | 需求 §13.19 3-补；用户 18:34 两例实证（整树 grep 把批档旧话当依据，其中一次重开已收口批档改正文） |
| 不标 | 所属档在排除集外 | 与今天逐字节相同 | 同上——只加可读信息，既有面零改 |
| 不标 | 出辖：祖先链无 manifest（场景 = 会话锚在无 manifest 的目录里跑检索：家目录 ∥ 临时目录 ∥ `execute` 的 `workdir` 指向树外） | 与今天逐字节相同 | `thincoder-core/declaration.mjs` 的 `declarationForTarget` 契约「null = 出辖」⇒ 无档类可判；保守方向 = 不改输出 |
| 上下文行同判 | `before` ∥ `after` > 0 | 命中行 `:` 形与上下文行 `-` 形同标 | 判据是**档**不是行——不标则同一档的上下文行读起来像普通档的内容 |
| 标（命令面：`bash` ∥ `execute`） | 行首 token 解析到盘上、且该档在排除集内 | 同行首前缀，行其余部分原样 | 用户 18:38「bash 也做」——只堵 grep 等于告诉人「用 bash 搜」；18:41 扩到 `execute`——留这一个口子，前两面白做 |
| 不标（命令面） | 行首 token 解析不到盘上 / 预筛不过 | 一个字节不动 | 误标比不标更坏（用户 18:34 同一句判据）——判不了就不动输出 |

**判据单源**：`thincoder-core/declaration.mjs` 的 `isExcludedRelPath`——面① 前缀（`index.excludePaths`）∪ 面⑥ 段序列（`docRoot.batches` 声明值 ∪ 约定段 `docs/batches`）。**零新排除名单、零新谓词、零改面⑥**。

**判法逐字**（实施照抄，勿自造）：

```js
const decl = declarationForTarget(absFile)              // 最近带 manifest 祖先；null = 出辖
const marked = decl ? isExcludedRelPath(absFile, decl, decl.root) : false
```

- `absFile` = grep 内部现成的 `h.file`（`resolveInCwd` 之后已是绝对形，`walk` 的每条命中都带它）。
- 第三参传 `decl.root` 而非缺省：`isExcludedRelPath` 内 `resolve(base, s)` 对绝对参恒等，再由 `relative(root, …)` 换成根相对面——面① 前缀才判得住（`docs/core/design/_archive` 这类只被面① 命中，面⑥ 只管 batches 段）。传 null 会让面① 对绝对路径恒不命中，是本节唯一易错点。
- 一次调用内按档记忆（`Map<file, boolean>`）：200 命中行 → 至多 200 次判定，`owningProject` 的祖先链走盘不比 grep 自己的 `stat` 更贵。
- 判定只看**档**，与命中行号、命中文本无关。

**落形（位置）**：前缀在行首，原行整体后随——无上下文形 `[mark] <file>:<line>: <content>`；有上下文形 `[mark] <file>:<l>: <content>` 与 `[mark] <file>-<l>- <content>` 两种分隔符都前置。

**为什么是行首，不是 `file:line:` 之后**：

- **消费面实读 = 零个按「行首即路径」解析的消费方**。grep 是核内单一实现（`thincoder-core/tools/search.mjs`），四处装配同一对象——`thincoder-vscode/src/tools/index.mjs` 直接 re-export、`thincoder-server/src/agent/chat-env-tools.mjs` 取 `core.grepTool`、`thincoder-core/advisor/loop.mjs` 从 `tools/index.mjs` 取。
- 唯一读输出文本的用例 `test/integration/batch-live-batch-lock.test.mjs` 用 `/visible\.txt/` 子串与 `(no matches)` 全等判，与位置无关。
- 先例不构成反对：`[outside]` 走行尾（`thincoder-core/browser/snapshot.mjs` 行文法 = `<ref> <role> "<name>"` + `[value=…]` + `[new]` + `[disabled]` + `[outside]`），因为它的行首 `<ref>` 是下一次动作的寻址键、必须原地不动；grep 的 `file:line` 不是寻址键（要读正文就再 `read`，路径可原样复制）。
- 用户 18:37 选了「甲」：指令语落在最前，正是这一批的全部目的——读的人不必知道「过程档」是什么，看到就知道这行不能当依据。
- 退路（不预置分支，留决策档）：若日后出现按行首解析的消费方，前缀移到 `<file>:<line>:` 之后、内容之前即可，判据与验收不变。

**指令语逐字**：`[process doc: not a design basis]`（33 字符 · 全 ASCII · 方括号闭合）。语言取英文的理由 = 工具输出面全英文（`(no matches)` ∥ `grep error: path not found: …` ∥ `(no entries)`），同一行混中英破坏「一词一物」。`process doc` 与需求档「过程档」对位（状态档 = state doc）；`not a design basis` 即用户要求的「不能作为设计依据」。

**既有面零改**：不新增参数、不改 schema、不改返回类型（`grep` ∥ `bash` ∥ `execute` 三者都返回 string）、`(no matches)` ∥ `(no output)` 逐字不变。前缀随行进出既有收敛点，不新增截断点（`grep` 面在 `truncate` 之前、`bash` ∥ `execute` 面在各自收尾文本之后）；前缀只落在过程档命中行（少数面），对输出帽的消耗可忽略。

**零 console 噪声**：打标 helper 内零 `console` 调用；判据只走 `declarationForTarget` → `loadProjectDeclaration`，后者按档 `_cache` 记忆、只在**声明档不可用 ∥ 读不出**时 `console.warn`（`thincoder-core/declaration.mjs` 的降级面），进程内至多一次。

验收 2 的「逐字节相同」按此口径断言：同一进程第二次起的判定零输出；首次 warn 以「声明档不合用」为前提，属既有降级面，不是本批新增的噪声点——测试夹具带合法 manifest，不进这条径。

**验收（机检，逐条）**：

1. 排除集内档命中 ⇒ 该行 **全等** `[process doc: not a design basis] ${abs}:${line}: ${text}`；
2. 排除集外档命中 ⇒ 与改动前**逐字节相同**（全等断言，不是子串断言）；
3. `_archive` 下的档（只由面① 前缀命中）⇒ 同标（专测「第三参传 root」这一点）；
4. 上下文形：`: ` 命中行与 `- ` 上下文行同标；非排除档的上下文行零变化；
5. `(no matches)` 逐字不变；参数面 schema 逐字不变（零新增键）；
6. 出辖目录（无 manifest 祖先）⇒ 不标。
7. 命令面（`bash` ∥ `execute`，同一套判据）：行首是过程档路径（相对形 ∥ 驱动绝对形 ∥ MSYS 形各一例）⇒ 该行带前缀且行其余部分逐字节不变；同一份输出里行首是状态档路径 ⇒ 零变化。
8. 命令面**负例（最要紧）**：行首是长得像路径、但盘上不存在的 token（如一行日志里的 `config/x.yml:12:`）⇒ 零打标、零汇总行。
9. 命令面汇总行：N > 0 ⇒ 末尾恰多一行且 N 等于实际标出的行数；N = 0 ⇒ 输出与今天逐字节相同（无空汇总行）。
10. `bash` ∥ `execute` 的 `filter` 参数在场时，过滤按**原始行**命中（前缀不参与过滤），标在过滤后的行上。
11. `execute` 成功径（`code`）：脚本读一份批档与一份状态档各打一行 ⇒ 前者带前缀、后者逐字节不变。
12. `execute` 失败径：脚本非 0 退出且 `[stderr]:` 段印出过程档路径行 ⇒ 该行带前缀；`(exit code N)` 尾行零变化。
13. `execute` 的 `workdir` 在场：输出里的相对形过程档路径 ⇒ 仍标（专测解析基准 = `baseDir`，不是 `ctx.cwd`）。
14. VSC 端 `bash`：`terminal` 缺省（子进程径）与 `terminal: "visible"` 各跑一次同一条命令 ⇒ 两径的过程档行都带前缀；`terminal: "inject"` ⇒ 零捕获输出、无标可加（该径不经打标）。

**本轮要跑的检查（改动面，不是全量套件）**：`node --test test/integration/grep-process-doc-mark.test.mjs`——1–14 条即该档逐条断言的落地，四面（`grep` ∥ `bash` ∥ `execute` ∥ VSC `bash`）各至少一条全等断言。全量套件是父侧收口门，不在本批跑。

**需求侧单源**：需求档 §13.19 验收 ④ 写明「3-补 的验收单源 = 设计档验收判据表」（父侧 2026-11-02 定稿）——1–14 即那张表，本节不重述需求侧条文。

**命令输出面（`bash` ∥ `execute`，判据与 grep 面不同，别混）**

`bash` ∥ `execute` 的输出都是任意文本，没有「这行属哪个档」的结构，只能用**行首路径 token** 反查；`execute` 逐字复用下表六步，不另写一份：

| 步 | 规则 |
|---|---|
| ① 取 token | 行首第一个空白分隔字段；剥两侧成对引号（`"` ∥ `'`）；空 ∥ 超 260 字符 ⇒ 该行跳过 |
| ② 剥尾 | 剥尾部 `[:\-]\d+[:\-]?$` 与尾随 `:`——让内层 `grep` ∥ `rg` ∥ `findstr` 的 `path:12: text` 形同时可判 |
| ③ 预筛 | token 须含 `/` ∥ `\` ∥ `.`，否则不做盘上解析 |
| ④ 解析 | 按序试三支：驱动绝对形 → MSYS 形 → 相对基准 `base`；取**第一个在盘上存在**者。`base` = 调用方给的 cwd（`bash` = `ctx.cwd`；`execute` = `baseDir`） |
| ⑤ 判归属 | 存在者 ⇒ `declarationForTarget` + `isExcludedRelPath(abs, decl, decl.root)`（与 grep 面同一谓词、同一判法） |
| ⑥ 打标 | 命中 ⇒ 行首前缀，行其余部分原样；未命中 ∥ 解析不到 ⇒ **一个字节不动** |

**纪律：不许按「看起来像路径」打标**——必须真解析到盘上同一处。程序自己的输出（表格、日志、代码片段）里大量 token 长得像路径，错标比不标更坏；解析不到 = 判不了 = 不动输出。这条是本面的第一判据。

**成本与界**：一次调用内按 token 记忆（`Map<token, boolean>`），③ 预筛挡掉多数行（`[stdout]:` ∥ `(exit code 0)` ∥ 纯数字 ∥ 短单词）。**不设解析上限**——本仓实测三份真实输出：

- `git ls-files`：2083 行 ∥ 2081 个不同 token，全部解析到盘上；
- `git log --stat -n 40`：630 行 ∥ 290 个不同 token；
- `git log --name-status -n 400`：7336 行 ∥ 0 个不同 token（行首是 `M` / `A` 状态字母，过不了预筛）。

2081 个不同 token 只是**一份常见输出**的量 ⇒ 任何「几百」量级的帽子都会让这类输出整段静默不标，与本节目的相反。

输入量级由工具自身的帽子兜住：`bash` 单流缓冲 `MAX_STREAM_BUF = 2_000_000`（`thincoder-core/tools/bash.mjs`）· `grep` 命中 ≤200 行 ⇒ 最坏数万次 `existsSync`，按 token 去重后通常几十到几千次。

**Windows 三形**：驱动绝对形（`D:\teamcode\…`）`isAbsolute` 为真、直接解析；MSYS 形（`/c/teamcode/…`）在 win32 上 `isAbsolute` 也为真、但会落成当前盘的 `/c/…`——必须显式把首段 `^/([A-Za-z])/` 映射为 `X:/`；相对形（`docs/batches/x.md`）按基准 `base` 解析（`bash` = `ctx.cwd`；`execute` = `baseDir`）。UNC（`\\server\share\…`）走驱动绝对形一支。三支取第一个存在者，都不存在 ⇒ 不标。

**末尾汇总行（兜底，仅命令面 `bash` ∥ `execute`）**：若本次输出有 N > 0 行被判为过程档，正文之后追加一行——

`[process doc: N of this output's lines come from process docs — not a design basis]`

理由 = 长输出里行级前缀会滑过去，汇总行是最后一道（用户 18:38 原话「再加一道兜底」）。N 由同一趟判定的计数直接得，不另数一趟。**grep 面不加汇总行**：用户 18:37 选「甲」= 行首前缀，明确不要「尾部汇总」那一形；grep 命中短（≤200 行），行级前缀已经处处在场。

**为什么不按命令行判**：按命令行判 = 换个等价命令就绕过（`cat` ∥ `sed` ∥ `rg` ∥ `Get-Content` ∥ `type`）；而「输出里哪些行来自过程档」才是读的人真正面对的东西。判据只认**输出行**。

**落点（单源，五处共用）**：新叶档 `thincoder-core/tools/process-doc-mark.mjs`，导出四件，**签名写死**（实施照抄，勿自造）：

```js
export const PROCESS_DOC_MARK = "[process doc: not a design basis]"        // 逐字文案
export const processDocSummary = (n) =>
  `[process doc: ${n} of this output's lines come from process docs — not a design basis]`
export function isProcessDocPath(absFile, cache)   // → boolean；cache = Map<string, boolean>，缺省自建（一次调用内按档记忆）
export function markProcessDocLines(text, base)    // → string；逐行打标 + N>0 时末尾追加汇总行；N=0 ⇒ 原样返回入参
```

`markProcessDocLines` 内建一份 `Map<token, boolean>`，逐行调 `isProcessDocPath`；`grep` 面不走它——grep 已有 `h.file`，直接调谓词。

五处各自怎么调（接缝写死，实施席不自己拼）——**接缝按符号 ∥ 逐字代码定位，不记行号**：行号随插入行漂，符号不漂。

| 面 | 怎么调 | 接缝（符号 ∥ 逐字代码） |
|---|---|---|
| `grep` | 一次调用一个 `const cache = new Map()`；`const mark = (f) => (isProcessDocPath(f, cache) ? `${PROCESS_DOC_MARK} ` : "")`；命中行与上下文行都在原有文案前镀 `mark(file)` | `thincoder-core/tools/search.mjs`——无上下文形拼 `` `${h.file}:${h.line}: ${h.text}` `` 那一处 ∥ 上下文形拼 `out.push(\`${file}${sep}${l}${sep} ${lines[l - 1]}\`)` 那一处；两处都在 `truncate` 之前 |
| `bash` 同步 | `const filtered = args.filter ? applyLineFilter(result, args.filter) : result` 之后一行：`const marked = markProcessDocLines(filtered, ctx.cwd)`，后续 `guard` ∥ `hint` 改用 `marked` | `thincoder-core/tools/bash.mjs`——`applyLineFilter` 调用的下一行起（`guard` ∥ `hint` 拼装之前） |
| `bash` 后台 | 打标落在 `renderTail` 内：`let text = …` 截帽完成后 `text = markProcessDocLines(text, entry.cwd)`，再 `return { text, truncated }`——两个消费点（`finalizeBgEntry` 的 `entry.report` ∥ `injectBgResult` 拼 body）同得标好的文本，`escapeXml` 仍只包 `injectBgResult` 那一处 | `thincoder-core/agent-tools/bash-async.mjs`——`renderTail` 内截帽之后 ∥ `entry.report` 赋值处 ∥ `injectBgResult` 拼 body 处 |
| `execute` | `const body = ok && args.filter ? applyFilter(text, args.filter) : text`，再 `return markProcessDocLines(body, baseDir)` | `thincoder-core/tools/execute.mjs`——`runNode` 返回后的单一出口 |
| `bash`（VSC 端） | 同一 helper，两处输出出口各镀一次：visible 径 `const final = filter ? applyLineFilter(out, filter) : out` ⇒ `markProcessDocLines(final, ctx.cwd)`；子进程径 `finish` 内同形再拼 `guard`。`inject` 径**不接线**——它返回一句固定说明、零捕获输出，没有可标的行 | `thincoder-vscode/src/tools/shell.mjs`——visible 出口（`const final = filter ? applyLineFilter(out, filter) : out` 那一处）∥ 子进程 `finish` 内的出口 ∥ `inject` 径（不接）；解析基准 = `ctx.cwd`（子进程以 `cwd: ctx.cwd` 起）；该端 `bash` 无 `workdir` 参 |

五处共用同一份文案 ∥ 同一谓词 ∥ 同一 helper；不进 `shared.mjs`——那是通用表，把「排除集判据」塞进去等于把语义放错层。

**后台径的解析基准从哪来**：`launchBgTask` 内已有 `const cwd = ctx?.cwd ?? parent.cwd`，它就是传给 `spawn` 的那个 `cwd`（`thincoder-core/agent-tools/bash-async.mjs` 的 `spawn` 选项里逐字 `cwd,`）。建 entry 处补记的必须是**这个局部值**，不另取 `ctx.cwd`：`ctx.cwd` 缺省时记进去的是 undefined，解析基准跟着 undefined。

VSC 端取同一 helper 的位置照 `thincoder-vscode/src/tools/shell.mjs` 的既有前例写——`import { … } from "@thincoder/core/tools/process-doc-mark.mjs"`（该档已从 `@thincoder/core/tools/*` 取 `shared.mjs` ∥ `process-tree.mjs`）。

**同步 ∥ 后台两面**：同步径在 `bash.mjs` 的 `applyLineFilter` 之后、`guard` ∥ `hint` 前缀之前打标——顺序写死：**过滤 → 打标 → 汇总 → 外包装**（filter 才照旧匹配原始行，前缀不吃过滤命中；`guard.notice` ∥ `hint` 包在标之外）；后台径的结算摘要同调 `markProcessDocLines`（同一实现、同一文案，零第二份），接缝坐标见上表。

**`execute` 面（与 `bash` 同一套判据，只换拼装点与解析基准）**

实读 `thincoder-core/tools/execute.mjs`（本批新读，三条事实）：

- **输出拼装点 = `runNode` 的 `child.on("close")`**：退出码 0 ⇒ `out || "(no output)"`——**裸 stdout，无 `[stdout]:` 包裹**；非 0 ⇒ `` `${out}\n\n[stderr]:\n${err}` ``（两股都在）∥ 只 `err` ∥ `` `${out}\n(exit code ${code})` ``。`bash` 则是三段包裹（`thincoder-core/tools/bash.mjs` 的 `[stdout]:` / `[stderr]:` / `(exit code N)`）——**形不同，判据不受影响**（都是按行首 token 反查），只换拼装点。
- **无后台形**：参数面六参 = `code` / `scriptFile` / `nodeArgs` / `workdir` / `filter` / `timeoutMs`（schema 定义处），无 `async`；全档无 `onOutput` ∥ `outputPanel` ∥ `launchBgTask` ⇒ **零摘要面**，不为它设接缝。
- **解析基准 = `baseDir`，不是 `ctx.cwd`**：`baseDir = resolveBaseDir(ctx.cwd, args.workdir)` 即子进程 cwd；`workdir` 在场时，输出里的相对形路径只有按 `baseDir` 解才对得上。这是本面唯一易错点。

接线：现为 `if (!ok) return text` 加成功径再过滤，改**单一出口**：

```js
const { text, ok } = await runNode(childArgs, baseDir, timeoutMs, ctx.signal)
const body = ok && args.filter ? applyFilter(text, args.filter) : text
return markProcessDocLines(body, baseDir)
```

**失败径也标**：错误文本同样是行内容（`[stderr]:` 段里照旧会印 `path:12: text`），只标成功径 = 换个失败命令就绕过。

**参数面零改**：六参逐字不变；五条早退 `Error:` 直返行是工具自己的报错、不含输出行，零改动。

**集成用例增量（自 `test/RTM.md` 起答）**：打破 **0** 行（12-6 的通过条件由 `test/integration/batch-live-batch-lock.test.mjs` 断言 `(no matches)` 全等与 `/visible\.txt/` 子串，与命中行的行首位置无关；其余节零涉 `grep` ∥ `bash` ∥ `execute` 的输出形）· 冗余 **0** 行 · 新增 **2** 行——CLI 端新节「31. 过程档内容在工具输出的命中处就标出不可作依据」，两行号先落 RTM 再写用例标题：

| 行 | 怎么造 | 怎么算通过 | 交互组件 | 服务需求 |
|---|---|---|---|---|
| 31-1 | 会话里对一个词跑 `grep`、`bash grep -rn`、`execute`（`code` 里 `fs.readFileSync` 打印同两份档），VSC 端再以 `terminal` 缺省与 `"visible"` 各跑一次 `bash`，该词同时出现在一份批档与一份状态档里 | 四面各自：过程档行以 `[process doc: not a design basis]` 开头；状态档行逐字等于 `<file>:<line>: <text>`（无前缀）；`bash` ∥ `execute` 输出末尾多一行汇总且 N = 实标行数 | `grep` ∥ `bash` ∥ `execute` 的输出渲染（含 VSC 端 `bash` 两出口）× 声明谓词 `isExcludedRelPath` | FR41 §13.19 3-补 |
| 31-2 | 同一次命令面输出里混入一行「长得像路径、盘上不存在」的日志行 | 该行零打标、不进汇总计数 | 命令面输出渲染 × 盘上解析 | 同上（误标比不标更坏的判据） |

入口 = 用户在会话里让助手查一个词；证据档 = `test/integration/grep-process-doc-mark.test.mjs`。

**RTM 行 31-1 / 31-2 是实现侧的完整断言集（含后台径结算文本、`_archive` 面、`filter` 按原始行命中）；本表列的是设计最小集，二者不矛盾，以 RTM 行为交付判据**。

第 31 节按 RTM 体例首行写节注（其余各节同形）：

```text
> 节注：回指 = docs/core/requirements/ENGINEERING-MODE-V2.md §13.19 3-补（判据 = docs/core/design/TOOLS.md §6.28 验收 1–14）；交互组件 = grep ∥ bash ∥ execute 的输出渲染 ⟷ isExcludedRelPath 声明谓词 ⟷ 盘上路径解析；进入口 = 用户在会话里让助手查一个词；两态（行序）= 31-1 正常 · 31-2 边界。
```

**节注的两态形合 RTM 体例**：`test/RTM.md` 既有节以同一形式记两态——第 19 节逐字 `两态（行序）= 19-1 正常 · 19-2 边界`、第 25 节逐字 `两态（行序）= 25-1 正常 · 25-2 边界` ⇒ 第 31 节两行即两态，不补失败态行（三行均已实读；第 31 节落盘为 `两态（行序）= 31-1 正常 · 31-2 边界`）。

**为什么 31-1 扩成四面、不新增 31-3**：四面是同一业务场景（用户让助手在一个仓里查一个词）、同一断言、同一交互（输出渲染 × 声明谓词），共用一份文案 ∥ 一个谓词 ∥ 一个 helper。差异只在拼装点（含 VSC 端的两个出口），而拼装点漏接恰好被「每处各有一次逐字全等断言」照出来——本批的风险在拼装点，不在面数。

31-2 只留命令面：它验的是判定步（解析不到就不标），命令面三处拼装点（`bash` 同步 ∥ `execute` ∥ VSC 端 `bash`）共用同一 helper，一次即覆盖。

**最近先例（三问式）**：`existing:` 坐标 `thincoder-core/browser/snapshot.mjs` 的 `[outside]`（名逐字 `[outside]`，消费者 = 读 snapshot 回执的模型）；对齐 = 「行级附注挂在输出行上」这一形；偏离 = 位置（行尾 → 行首），理由见上「为什么是行首」——它的行首是寻址键，grep 的不是。

**调研证据行**：仓外声明源 = `index.publicRepos: []`（实读 `PROJECT-MANIFEST.json`，空 ⇒ 无仓外档可查）。仓内实读九处：

- 需求 §13.19 条 3-补；
- `thincoder-core/tools/search.mjs` —— grep 的两条输出分支；
- `thincoder-core/tools/bash.mjs` —— 同步径接缝与 `[stdout]:` 三段包裹；
- `thincoder-core/tools/execute.mjs` —— 输出拼装点、参数面六参、无后台形、`baseDir` 解析基准（本批新读）；
- `thincoder-core/agent-tools/bash-async.mjs` —— `renderTail` 与 `injectBgResult` 的 body 拼接处；
- `thincoder-core/declaration.mjs` —— `isExcludedRelPath` 与 `declarationForTarget`；
- `thincoder-core/browser/snapshot.mjs` —— `[outside]` 行文法（先例）；
- `test/RTM.md` —— 现有节次；
- `test/integration/batch-live-batch-lock.test.mjs` —— 唯一读 grep 输出的断言。

**边界（本节不做）**：`glob` / `ls`（输出是路径清单、无行内容，「这行不可作依据」的指向不明）· `doc_search` / `read_history`（已在声明域内检索，过程档本就不进索引）· `execute` 的后台形（实读：不存在——无 `async` 参、零摘要面）· `bash` 后台径的 `filter` 面（后台不看 `filter`，标记照旧）· 不改命中集 / 不新增门 / 不改面⑥ 判据 · 不改提示词面（提示词面归 §13.19 条 1 的既有落地，不在本节）。


## 9. checklist 废除

**定位**：checklist 工具（`tools/checklist.mjs` + CLI `tools/checklist-sync.mjs`）**废除**——三处结构性理由：与 task 工具职责重叠（持久跨会话清单 vs 会话级清单——分工不清）、md 持久面与台账（LEDGER）职责重叠（待办总账已有 SQLite 单一权威源）、「归册三选一」退役流程与 M10「测试是开发期工具不是库存」冲突。

**废除形态**：

| 面 | 处置 |
|---|---|
| 工具本体 | `thincoder-core/tools/checklist.mjs` + CLI `tools/checklist-sync.mjs` 删除；`thincoder-core/tools/index.mjs` 注册面去掉 checklist 族 |
| 提示词面 | 提示词中「checklist 工具」指令（discipline 层「双跟踪工具并用 checklist + task」）改指「task 单工具」（经 M9 单向生成承载） |
| 语义承接 | 持久跨会话待办 → **台账**（统一入口 `ledger`，M2 六态状态机）；会话级任务清单 → **task 工具**（保留） |
| 本档 §2 裁决行 / §6 机制面 checklist 条目 | 标注「已废除」 |

**验收（回指 AC-M7）**：AC-M7-1 checklist 工具删除（文件不存在 + 注册面零命中）· AC-M7-2 提示词无 checklist 指令（经 M9 生成同步）· AC-M7-3 语义承接无缺口（task 保留 + 台账承接持久面）。

**边界（本增量不做）**：不做 task 工具本体改动（保留）；不做台账（M2 承接）；不做「归册三选一」替代流程（M10 一并砍）。
