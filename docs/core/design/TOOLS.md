# 工具系统（TOOLS）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> **v2 就地更新**（2026-09-17 退役批）：M7 模块设计语义融入（checklist 废除——见 §9；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md` 已归档 `_archive/modules/`）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 工具实现（同路径对） | `thincoder-cli/src/tools/{question,bash,tree,execute,linter,ops,shared,search,lsp,web,file,edit-diff,index}.mjs` | 同名（多为拆档：`shell` / `more-file` / `file-edit` / `edit-fuzzy-match` / `edit-line-params` / `wait_for` 等） |
| 工具描述（提示词面） | `thincoder-cli/src/tools/*.md`（25 档——已随 CLI U2 删，实核档不在） | 同名（已随 W2 删——实核空）；**运行期面 = 核包 `thincoder-core/tool-docs/*.md`** |
| 注册表 | `src/agent-tools.mjs` + `src/cli/make-agent.mjs` | `thincoder-vscode/src/agent-tools/index.mjs` |
| agent-tools 工具面 | `src/agent-tools/*.mjs` | 同名 / 拆分档 |
| 单端独有实现 | `tools/{bash,checklist-sync,edit-batch,glob-dialect,patch,repomap}.mjs` | `tools/{code,context,focus,index,shared,shell}.mjs`（W12 / W14 迁核删旧——`checkpoint` 现体 = 核 `thincoder-core/git/checkpoint.mjs`） |

> 工具**描述文本**（运行期面 = 核包 `thincoder-core/tool-docs/*.md`；两产品原副本已删——CLI U2 / VSC W2）的行本体住 `docs/core/design/PROMPT-SYSTEM.md`（提示词面）；本档只收**实现面**与工具行为契约。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 工具描述档（原 §2.5（一）逐字节同组——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 10 | `tools/apply_patch.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/apply_patch.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 11 | `tools/checklist.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/checklist.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） （迁移期引文） |
| 12 | `tools/delete.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/delete.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 13 | `tools/edit.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/edit.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 14 | `tools/execute.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/execute.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 15 | `tools/fetch.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/fetch.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 16 | `tools/file_ops.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/file_ops.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 17 | `tools/get_current_time.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/get_current_time.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 18 | `tools/git.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/git.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 19 | `tools/glob.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/glob.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 20 | `tools/hashline_edit.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/hashline_edit.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 21 | `tools/insert_after.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/insert_after.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 22 | `tools/ls.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/ls.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 23 | `tools/lsp.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/lsp.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 24 | `tools/process.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/process.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 25 | `tools/read.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/read.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 26 | `tools/read_image.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/read_image.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 27 | `tools/tree.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/tree.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 28 | `tools/wait_for.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/wait_for.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 29 | `tools/write.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/tool-docs/write.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 工具实现与 agent-tools（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 52 | `tools/question.md` | 同路径 | 0.8667 · 异 | ② | 进核（`thincoder-core/tool-docs/question.md`） | 融合：取 CLI 措辞 + 无 UI 降级径按端注入（VSC 面板卡片 / QuickPick ＝ ④ 段） | 分叉 ＝ 措辞随两端 UI 形态（CLI 无 UI 抛错 `src/tools/question.mjs:20`；VSC 面板 + 子代理注册期过滤 `thincoder-vscode/src/agent/setup.mjs:196`）；前提（同持有、仅失败形态不同）仍成立（W14 已迁核——VSC 无回调降级径退场，现体 = 面板 `onQuestion` 通道） | — | S1（建核补齐） |
| 53 | `tools/bash.md` | 同路径 | 0.8485 · 异 | ② | 进核（`thincoder-core/tool-docs/bash.md`） | 融合：取 CLI 文本 + `terminal` 参数段按端注入（VSC 宿主真终端 ＝ ④ 段） | 分叉 ＝ VSC 独有 visible/inject 两模式（`src/tools/shell.mjs:183,191,202`）+ CLI 有 POSIX 前置提示（`src/tools/bash.mjs:34,264-266`）；前提（宿主终端只在 VSC）仍成立 | — | S1（建核补齐） |
| 54 | `tools/grep.md` | 同路径 | 0.8125 · 异 | ③ | 进核 | 以 CLI 为准（`before`/`after` 上下文随行；错误形态归一为抛错） | 分叉 ＝ CLI 有上下文档（`src/tools/search.mjs:116-118,173-191`）、VSC 无（`src/tools/search.mjs:230-238`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 55 | `tools/lint.md` | 同路径 | 0.7778 · 异 | ② | 进核 | 融合：取 VSC 措辞（两侧代码实际同输出——CLI `src/tools/linter.mjs:81` / VSC `:85`） | 分叉 ＝ CLI 文档措辞失真（写「✓ no issues」，实为「✓ <checker>: no issues」）；前提 ＝ 无（纯文档订正） | — | S1（建核补齐） |
| 56 | `tools/tree.mjs` | 同路径 | 0.6769 · 异 | ② | 进核（`thincoder-core/tools/tree.mjs`） | 融合：单实现 + cwd 归一开关按端注入（CLI realpath `thincoder-core/tools/shared.mjs:282-290` / VSC join `thincoder-vscode/src/tools/shared.mjs:109-112`） | 分叉 ＝ 根路径 helper 不同（跳过集 / 上限 / 文案 / 排序逐字同构）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 57 | `tools/execute.mjs` | 同路径 | 0.6117 · 异 | ② | 进核 | 融合：单实现 + 树杀能力按端注入（VSC 已有 `killProcessTree` 但本档未用——`thincoder-vscode/src/tools/shared.mjs:129`） | 分叉 ＝ CLI 超时树杀（`src/tools/execute.mjs:65-72,104`）vs VSC 只杀直系子进程（`src/tools/execute.mjs:79`）；前提（两端均有树杀能力）成立 ⇒ 不构成端特有 | — | S1（建核补齐） |
| 58 | `tools/websearch.md` | 同路径 | 0.5294 · 异 | ③ | 进核 | 以 CLI 为准（RSS 端点 + `engine`/`page` 参数）〔与 `tools/web.mjs` 同一条款〕 | 分叉 ＝ 抓取实现不同（CLI RSS `src/tools/web.mjs:36-40` / VSC Bing HTML `b_algo` `src/tools/web.mjs:64,71`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 59 | `tools/git.mjs` | 同路径 | 0.5253 · 异 | ② | 进核 | 融合：取 CLI + `isReadonlyAction` 审批门按端注入（CLI 无审批面 ＝ ④ 段） | 分叉 ＝ VSC 多只读判定（`src/tools/git.mjs:81-93`）+ 两处文案 / 截断差异（VSC `src/tools/git.mjs:104,214`）；前提（同 action 集）仍成立 | — | S1（建核补齐） |
| 60 | `tools/checklist.mjs` | 同路径 | 0.4973 · 异 | ② | 进核 | 融合：取 CLI（并发门控 + ID 预留含已归档子 ID——`src/tools/checklist.mjs:106-121`） | 分叉 ＝ VSC 内联同套逻辑但 ID 不预留归档子 ID（`src/tools/checklist.mjs:133-143`）、基线判 mtime+size；前提（同职责）仍成立 | — | S1（建核补齐） （迁移期引文） |
| 61 | `tools/linter.mjs` | 同路径 | 0.4872 · 异 | ② | 进核 | 融合：取 CLI + 可中断执行按端注入（VSC `runInterruptible` ＝ ④ 段） | 分叉 ＝ 执行方式（CLI `execFileSync` `src/tools/linter.mjs:48,64` / VSC `runInterruptible` `src/tools/linter.mjs:53,64-66`）；检查器映射与文案逐字同 | — | S1（建核补齐） |
| 62 | `tools/ops.mjs` | 同路径 | 0.2851 · 异 | ② | 进核 | 融合：`wait_for` 并回单档（VSC 拆到 `wait_for.mjs`——`src/tools/ops.mjs:11-112` / `src/tools/wait_for.mjs:150-190`）（W14 已迁核——VSC 两档已删，现体 = 核 `thincoder-core/tools/ops.mjs`） | 分叉 ＝ 文件切分（能力不缺——条件字面与限额逐字同）；前提（同职责）仍成立 | — | S1（建核补齐） （迁移期引文） |
| 63 | `thincoder-core/tools/shared.mjs` | 同路径 | 0.2829 · 异 | ② | 进核（`thincoder-core/tools/shared.mjs`） | 融合：取并集 + VS Code 侧基建（编辑器编辑 / `runInterruptible`）按端注入（④ 段） | 分叉 ＝ 两端各带本端基建（CLI EOL / glob 再导出；VSC 编辑器编辑面 `thincoder-vscode/src/tools/shared.mjs:66-106`）+ cwd 归一差异；前提（同职责）仍成立 | — | S1（建核补齐） |
| 64 | `tools/question.mjs` | 同路径 | 0.1667 · 异 | ② | 进核 | 融合：取 CLI 上限校验 + 无 UI 降级径按端注入（VSC QuickPick / InputBox `src/tools/question.mjs:36-53` ＝ ④ 段） | 分叉 ＝ 无 UI 时形态（CLI 抛错 `src/tools/question.mjs:20`；VSC 降级原生 UI）；上限 100 字符 / 4 选项两端同（2026-09-06 裁定）（W14 已迁核——自持档已删，现体 = 核 `thincoder-core/tools/question.mjs` + 端 `onQuestion` 注入；QuickPick / InputBox 降级径随 W14 退场） | — | S1（建核补齐） |
| 65 | `tools/search.mjs` | 同路径 | 0.1455 · 异 | ③ | 进核 | 以 CLI 为准（grep 上下文 + `ls` 归位）+ VSC 的「路径不存在明确报错」并入（取并集） | 分叉 ＝ 导出面切分（CLI 含 `ls` `src/tools/search.mjs:195` / VSC 移 `more-file.mjs:318`）+ glob 指向文件与报错形态差异（CLI 静默 `(no matches)`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 66 | `tools/lsp.mjs` | 同路径 | 0.1429 · 异 | ③ | 进核 | 以 CLI 为准（JSON-RPC over stdio + `lsp.servers` 配置）+ VSC 宿主语言服务径按端注入（④ 段） | 分叉 ＝ 实现路线（CLI 自起服务器 `src/tools/lsp.mjs:97-168` / VSC 调宿主命令 `src/tools/lsp.mjs:76-112`）；前提（VSC 有宿主语言服务、CLI 无）仍成立 | **①③** | S1（建核补齐） |
| 67 | `tools/web.mjs` | 同路径 | 0.1184 · 异 | ③ | 进核 | 以 CLI 为准（RSS + `engine`/`page` + 跟随一次重定向 + 200K + `htmlToText`） | 分叉 ＝ 抓取 / 抓页实现分叉（CLI 跟随重定向 `src/tools/web.mjs:201-215`、上限 200K、正文转换；VSC 拒绝重定向 `src/tools/web.mjs:111-115`、上限 20K `:130`、朴素去标签）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 68 | `tools/file.mjs` | 同路径 | 0.0850 · 异 | ③ | 进核 | 以 CLI 为准（read 体积门 + 截断、写入回执含 diff / 语法检查、`insert_after` 漂移护栏）+ 编辑器编辑径按端注入（④ 段） | 分叉 ＝ 能力面差异（VSC read 无 10MB 门与 200K 截断 `src/tools/file.mjs:34-70`；VSC 写入回执仅一句 `src/tools/file-edit.mjs:305`；VSC `insertAfterTool` 无护栏且未记 `touchedPaths` `src/tools/more-file.mjs:11-24`）（W14 已迁核——上述 VSC 自持档已删，现体 = 核 `thincoder-core/tools/file.mjs`〔护栏/截断随之生效〕）；前提（VSC 有编辑器 API）成立 | **①** | S1（建核补齐） （迁移期引文） |
| 69 | `tools/edit-diff.mjs` | 同路径 | 0.0395 · 异 | ② | 进核 | 融合：取 CLI 执行体（diff 内核 + 三级匹配）+ VSC 拆分面按核内结构归位；回执形态按端注入（④ 段） | 分叉 ＝ 文件切分（VSC 把校验 / 模糊 / 行号拆到 `file-edit` / `edit-fuzzy-match` / `edit-line-params`）；阈值 0.9 与判定三档同构 | — | S1（建核补齐） |
| 70 | `thincoder-core/tools/index.mjs` | 同路径 | 0.0215 · 异 | ② | 进核 | 融合：完整注册表（VSC 31 工具）+ CLI 侧消费方拼装面归位；`read_image` 注册门取 VSC（按模型能力） | 分叉 ＝ 注册位置（CLI 25 工具子集 + 消费方拼装 `src/cli/make-agent.mjs:64` / VSC 完整表 `src/index.mjs:50-64`）；前提（最终可达集合基本对齐）仍成立 | — | S1（建核补齐） （迁移期引文） |
| 83 | `agent-tools.mjs` | 同路径 | 0.0000 · 异 | ② | 进核 | 融合：取核内统一登记册（VSC 13 项含 `consult_start/stop` `thincoder-vscode/src/agent-tools/index.mjs:15`；CLI 12 项 + consult 另挂 `thincoder-core/agent/setup.mjs:173,271-275`） | 分叉 ＝ 登记位置与是否多一层转口（CLI 18 行显式列 / VSC 2 行转口）；最终暴露集合一致；前提 ＝ 无 | — | S1（建核补齐） |
| 84 | `agent-tools/batch-segment.mjs` | 同路径 | 0.7530 · 异 | ② | 进核 | 融合：取 CLI 主体 + VSC 的 `_touchedFiles` 记账按端注入（④ 段） | 分叉 ＝ VSC 把写过的批次档计入本轮变更（`src/agent-tools/batch-segment.mjs:184`）+ 评审实例绑定解析（CLI `:57-66`）；工具本体一致 | — | S1（建核补齐） |
| 85 | `agent-tools/plan.mjs` | 同路径 | 0.6579 · 异 | ③ | 进核 | 以 VSC 为准（未知 action 报错——CLI 现会误入 plan 模式 `src/agent-tools/plan.mjs:68-79`） | 分叉 ＝ 未知 action 处置（CLI 一律进入并返回 activated / VSC 报错 `:86`）；状态字段名与 `onPlanMode` 回调属结构面 | **①** | S1（建核补齐） |
| 86 | `agent-tools/timer.mjs` | 同路径 | 0.5833 · 异 | ③ | 进核 | 以 CLI 为准（`seconds` 必须为有限正数 `src/agent-tools/timer.mjs:34-37`） | 分叉 ＝ VSC 未同步该修复（`src/agent-tools/timer.mjs:34-35` 直取 `?? 180` ⇒ 非数字时 `expiresAt = NaN`、定时器永不触发且不报错）；前提（该修复只在 CLI 落地）⇒ **直接归一** | **①** | S1（建核补齐） |
| 88 | `agent-tools/skill.mjs` | 同路径 | 0.4746 · 异 | ② | 进核 | 融合：取一侧（异步 loader）+ VSC 的同步 loader 面按核内结构归一 | 分叉 ＝ loader 同步 / 异步与模块路径（CLI `../skills.mjs` / VSC `../extension/skills.mjs`）；发现规则（扁平 + `SKILL.md`、排序、项目层优先）两端同构 | — | S1（建核补齐） |
| 90 | `agent-tools/task.mjs` | 同路径 | 0.3592 · 异 | ③ | 进核 | 以 CLI 为准（空标题过滤 + done 留 3 + 总量 20 `src/agent-tools/task.mjs:66-77`） | 分叉 ＝ 过滤 / 截断规则缺失（VSC `src/agent-tools/task.mjs:60-66`）+ 回话形态（CLI 汇总串 / VSC 逐条列）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 91 | `agent-tools/eng.mjs` | 同路径 | 0.2719 · 异 | ③ | 进核 | 以 CLI 为准（工程模式位只进会话）+ VSC 的持久化镜像 / 面板提示按端注入（④ 段） | 分叉 ＝ VSC 双写（会话槽 + `config.json` 的 `agent.engineering` `src/agent-tools/eng.mjs:92-104`）⇒ **跨端副作用**；前提（两端同开关语义）成立，写盘范围属端差 | **①②** | S1（建核补齐） |
| 92 | `agent-tools/digest-budget.mjs` | 同路径 | 0.2268 · 异 | ② | 进核 | 融合：取 CLI（记账键 = agent 对象 + 落盘 `configDir/tool-results` + 轮转清理） | 分叉 ＝ 落盘位置与清理（VSC 落 `<cwd>/.thincoder/tmp` 且无轮转 `src/agent-tools/digest-budget.mjs:53-59`）；预算口径与文案逐字同 | — | S1（建核补齐） |
| 96 | `agent-tools/verify.mjs` | 同路径 | 0.1150 · 异 | ② | 进核 | 融合：取 CLI（git `--stat` 明细 + 无变更仍走清单）+ VSC 的编辑器诊断段与可中断执行按端注入（④ 段） | 分叉 ＝ 信息面与执行方式（VSC 多编辑器诊断 `src/agent-tools/verify.mjs:250-275`、可 Stop 中断）；门禁判定与文案等价 | — | S1（建核补齐） |
| 97 | `agent-tools/goal.mjs` | 同路径 | 0.0992 · 异 | ③ | 进核 | 以 CLI 为准（`blocked` 动作 + `criteria` 强制 + depth-0 独立裁判 `src/agent-tools/goal.mjs:34-115`） | 分叉 ＝ VSC 缺 `blocked` 动作（schema enum 只有 set / complete / cancel `src/agent-tools/goal.mjs:18`）、`criteria` 可省、complete 无独立裁判；前提（同职责）仍成立 | **①③** | S1（建核补齐） |

> **④ 段注入位的核内落点对照**（含本行集 #52–#70 / #84 / #91 / #96 的「核内是否已有位」与 S2 需补形态）→ `CORE-UNIFICATION.md` §2.13.4；编辑 / 可中断执行径的专项结论与**写路径缝**形态建议 → 同档 §2.13.5。本表只留端差处置（不复制）。

### 2.3 语义对位遍行（原 §2.5（四）行集——工具实现面单端档）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 178 | CLI 单端工具实现 **6 档** ↔ VSC 侧对位 | ② | 融合：逐档随其**工具面**（§2.5 #52–#70）的裁决落地 | 分叉 ＝ 实现切分；**B18 反例**：单端独有档之间最高 j 仅 0.256 ⇒ 不据相似度断言，逐档按工具面归属（映射见下表） | — | S1（建核补齐） |
| 179 | VSC 单端工具实现 **12 档** ↔ CLI 侧对位 | ② | 同上（逐档映射见下表；两档归 ④ 端特有段） | 同上 | — | S1（建核补齐） |

**工具实现面单端档逐档映射（原 §2.5（四）表 · 逐字）**

| 单端档 | 对位 / 处置 |
|---|---|
| CLI `tools/bash.mjs` | ↔ VSC `tools/shell.mjs`（同一 `bash` 工具）⇒ 随 §2.5 #53 |
| CLI `tools/checklist-sync.mjs` | 核内并发写同步机（VSC 内联于 `checklist.mjs`）⇒ 随 #60 （迁移期引文——机制已废） |
| CLI `tools/edit-batch.mjs` | 核内 edit 数组形态（VSC 住 `edit-line-params.mjs` / `file-edit.mjs`）⇒ 随 #69 |
| CLI `tools/glob-dialect.mjs` | 核内 glob 方言（VSC 住 `search.mjs` / `more-file.mjs`）⇒ 随 #54 / #65 |
| CLI `tools/patch.mjs` | 核内 `apply_patch` / `delete` 实现（VSC 住 `file-edit.mjs`）⇒ 随 #10 / #12（同路径 `.md`） |
| CLI `thincoder-core/tools/repomap.mjs` | ↔ VSC `repomap.mjs`（同一 repo 大纲；VSC 头注自述「Ported from thincoder CLI `thincoder-core/tools/repomap.mjs`」）⇒ 融合 |
| VSC `tools/checkpoint.mjs` | ↔ CLI `git/checkpoint.mjs`（行 #167）——**该端档已退役**（W14 删除集；现体 = 核 `thincoder-core/git/checkpoint.mjs`） （迁移期引文） |
| VSC `tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |
| VSC `thincoder-vscode/src/tools/context.mjs` | **④ 端特有段**（IDE 上下文 = 宿主能力；CLI 无 IDE） |
| VSC `tools/edit-fuzzy-match.mjs` · `edit-line-params.mjs` · `file-edit.mjs` · `more-file.mjs` · `hashline-edit.mjs` | 核内 edit / read / insert 实现切分 ⇒ 随 #68 / #69（W14 已迁核——上述 VSC 自持档已删，现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs, patch.mjs, search.mjs}`） （迁移期引文） |
| VSC `tools/focus.mjs` | **④ 端特有段**（驱动编辑器光标 = 宿主能力） |
| VSC `tools/read_image.mjs`（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`） | 核内 `read_image` 实现（CLI 住 `tools/file.mjs`；同路径 `read_image.md` = #26） （迁移期引文） |
| VSC `tools/shell.mjs` | ↔ CLI `tools/bash.mjs`（同首行） |
| VSC `tools/wait_for.mjs`（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/ops.mjs`） | 核内 `wait_for`（CLI 并回 `tools/ops.mjs`）⇒ 随 #62 （迁移期引文） |

> **归属提示**：表中 `VSC `tools/checkpoint.mjs`` 与 `VSC `tools/code.mjs`` 两行的裁决分别住 `docs/core/design/CHECKPOINT.md` / `docs/core/design/MEMORY.md`（本表 = 该映射表的权威副本，两行仅作指针）。

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A6 | `agent-tools/eng.mjs`（#91） | ①② | 工程模式位只进会话（`cmd-eng.mjs` 自述 `(session)`） | **双写**：会话槽 + `config.json` 的 `agent.engineering`（`src/agent-tools/eng.mjs:92-104`） | 以 CLI 为准（只进会话）+ VSC 的面板提示按端注入 | ① **跨端副作用**（现状：在 VSC 开一次工程模式，会改变 CLI 下次启动的模式） | **已裁（2026-09-13）· 按建议** |
| A8 | `tools/web.mjs` + `tools/websearch.md`（#67 / #58） | ①② | RSS 端点 + `engine` / `page` 参数；fetch **跟随一次重定向**、上限 200K、正文转换 + SPA / 屏蔽提示 | Bing HTML 抓取、无翻页；fetch **拒绝跟随重定向**（`src/tools/web.mjs:111-115`）、上限 **20K**、朴素去标签 | 以 CLI 为准（RSS + 翻页 + 跟随重定向 + 200K + `htmlToText`） | ① 一大批会重定向的正常网址，VSC 现在抓不到 ⇒ 归一后可抓；② 抓回的正文长度（20K → 200K）与可读性变化；③ 工具参数面变化（VSC 侧多出 `engine` / `page`） | **已裁（2026-09-13）· 按建议** |
| A9 | `tools/lsp.mjs`（#66） | ①③ | 自实现 JSON-RPC over stdio，按 `config.lsp.servers` **懒启动**语言服务器；未配置则回引导语 | 直接用 VS Code 语言服务命令（`:76-112`），**开箱即用**、不读配置 | 以 CLI 为准（核内实现）+ VSC 宿主语言服务径按端注入 | ① 归一后 CLI 侧仍需配置才能用（不变）；② VSC 侧是否继续用编辑器已装的语言服务（若改走核内实现，则须自行配置） | **已裁（2026-09-13）· 按建议** |
| A10 | `tools/file.mjs`（#68） | ① | read 有 10MB 体积门 + 200K 截断；写入回执含 git diff + `Syntax: OK/FAILED` + 写入点上下文；`insert_after` 有「读取后才准插 / 行号漂移即拒」护栏 | read 无体积门与截断（`:34-70`）；写入回执只一句「Wrote / Replaced / Inserted」（`file-edit.mjs:305`）；`insert_after` 无护栏、且插入的文件不进 `touchedFiles`（`more-file.mjs:11-24`） | 以 CLI 为准（体积门 + 截断 + 回执 + 护栏）+ 编辑器编辑径按端注入 | ① VSC 读超大文件从此会被截断（并给出提示）；② VSC 写入 / 编辑后模型开始看到 diff 与语法检查结果；③ VSC 的 `insert_after` 会拒绝漂移行号 | **已裁（2026-09-13）· 按建议** |
| A11 | `tools/grep.md` + `tools/search.mjs`（#54 / #65） | ① | grep 支持 `before` / `after` 上下文档（`search.mjs:116-118`）；含 `ls`；非法正则 / glob 抛错 | grep 无上下文档（`:230-238`）；`ls` 在 `more-file.mjs:318`；错误一律返回字符串；glob 指向文件可直配、路径不存在明确报错 | 以 CLI 为准（上下文 + `ls` 归位）+ VSC 的「路径不存在明确报错」并入 | ① VSC 的 grep 从此可带上下文（少一次额外 read 回合）；② 找不到路径时的回话形态变化（静默 `(no matches)` → 明确报错） | **已裁（2026-09-13）· 按建议** |
| A12 | `agent-tools/goal.mjs`（#97） | ①③ | 四动作（set / complete / blocked / cancel）；`criteria` 强制；complete 过「改过文件未 verify」门 + depth-0 **独立裁判**；blocked 需同一理由连续 3 次 | 三动作（**无 `blocked`**，模型调用会因 enum 直接失败 `:18`）；`criteria` 可省（缺省填 `manual verification`）；complete 只有 verify 门、无独立裁判 | 以 CLI 为准（四动作 + criteria 强制 + 独立裁判） | ① VSC 丢失「卡住要连续 3 次才认账」与「完成要过独立裁判」两道承诺 ⇒ 归一后恢复；② 模型在 VSC 可用的 `goal` 动作集变大 | **已裁（2026-09-13）· 按建议** |
| A13 | `agent-tools/task.mjs`（#90） | ① | 空标题丢弃、done 只留最近 3 条、总量截到 20（`:66-77`） | 不过滤、不截断（`:60-66`） | 以 CLI 为准（过滤 + 截断） | ① VSC 面板里会少掉空标题行、历史 done 项与超量条目（长清单从此瘦身） | **已裁（2026-09-13）· 按建议** |

### 3.2 乙组（方向只有一种）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| B1 | `agent-tools/timer.mjs`（#86） | ① | `seconds` 非有限正数 ⇒ **当场报错**（`:34-37`） | 直取 `?? 180`（`:34-35`）⇒ 传成 `"30s"` 时 `expiresAt = NaN`，**定时器永不触发且不报错** | 以 CLI 为准（补校验）——前提失效型（该修复只在 CLI 落地，非有意端差） | ① VSC 里传错秒数由「静默失效」变「报错」——只有一种合理做法（修 bug） | **已裁（2026-09-13）· 按建议** |
| B2 | `agent-tools/plan.mjs`（#85） | ① | 未知 `action` 也进入 plan 模式并返回 `activated`（`:68-79`）⇒ 会话可能被误锁成只读 | 未知 `action` 返回 Error（`:86`） | 以 VSC 为准（未知 action 报错） | ① CLI 里模型传垃圾 action 时由「突然只能读不能写」变「报错」——只有一种合理做法 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 5 | `tools/web` fetch 上限（20K → 200K）与重定向策略 · `websearch` 参数面（+`engine` / `page`） | 输出（工具可见面） | 取 CLI | 登记 + CHANGELOG（输出上限 / 截断标记变更） | `TOOLS.md` 同步 + VSC 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A8） |
| 6 | `tools/lsp` 是否需先配 `lsp.servers`（CLI）· VSC 宿主语言服务径 | 输出 / 命令面（工具可用性） | 取 CLI + 端差注入 | 登记（配置面文档同步——README 配置节） | LSP 面文档 + 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A9） |
| 7 | `tools/file` 写入回执的信息面（diff / `Syntax:` / 上下文窗）· read 截断标记 | 输出（模型可见回执） | 取 CLI | 登记（信息面变更——无兼容破坏） | `EDIT.md` / `TOOLS.md` 同步 + 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A10） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**核提示词面（S1 新建）· `thincoder-core/tool-docs/*.md`** · **产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/TOOLS.md`（247 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料（选型对比表 / 受影响文件表 / 用例表 / AC 表 / 变更流水账）· 编辑工具逐工具正文（已拆到各工具权威档，本档只留地图与契约要点）。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧工具实现住 `src/tools/**`）——本节一律按**现状路径**落笔（`thincoder-core/tools/**` · `thincoder-core/agent-tools/**`）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 总览与统一契约

工具系统是 agent 与外部世界（文件 / 命令 / 网络 / git / MCP / 项目状态）交互的**唯一通道**：

- **能做什么**：以统一 OpenAI function-calling schema 暴露给模型（`toOpenAISchema`，住 `thincoder-core/tools/shared.mjs`）；
- **怎么安全做**：收口到工具内部——安全哲学 = **信任模型 + 审批门控 + 快照**（非文本拦截）；
- **何时做**：调度层两段式（只读并行、副作用串行）。

**工具分类**：内置工具（`builtinTools`）+ 元工具（agent-tools，纪律工具）+ MCP 展开工具（动态并入）。

**统一契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。execute 必须返回字符串（undefined 视为错误，dispatch 显式检查）。

### 6.2 注册与 schema

- **内置工具**（`thincoder-core/tools/index.mjs` `builtinTools`）：file 6（read / write / edit / insert_after / hashline_edit / read_image）· patch 2（apply_patch / delete）· system 4（bash / glob / grep / ls）· web 2（websearch / fetch）· git 2（git / question）· 
其余 lint / lsp / execute / tree / ops 4（file_ops / process / get_current_time / wait_for）。（read_pdf 已移除；sleep 已删——见 wait_for。）
- **元工具**（`thincoder-core/agent-tools.mjs`）：task / plan / goal / verify / batch_segment / subagent / skill / recent_changes / advisor / eng / timer / read_history / consult_start / consult_stop——readonly 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）
。read_history 语义权威 = SESSION 板（本层 `SESSION.md`）。
- **schema 生成**：`toOpenAISchema(tool)`——name / description / parameters 转 OpenAI function 格式。description 来源：两端均用 `thincoder-core/tool-docs/*.md`（`DESC()` 机制——md 文件即描述源；VSC 经核 `loadToolDoc`、`toOpenAISchema` 调用期过锚替换原语——W2 落）。md 描述给模型**完整使用手册**（含参数说明 / 路由 / 反模式），非一行字符串。

### 6.3 上下文与生命周期

- **ctx 字段**：cwd / agent / depth / signal / callbacks / onOutput / onQuestion / onPermissionRequest。
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚；快照为全量副本（检查点面权威 = 本层 `CHECKPOINT.md`）。
- **hooks**：PreToolUse / PostToolUse / PostToolUseFailure / Stop 四事件用户脚本——配置位 = `~/.thincoder/config.json` 的 `hooks` 键（`{ matcher?, command, args?, timeout?, action? }`，action = allow/block/notify）；`action: "block"` 时按**退出码**定夺（0 = 放行、非 0 = 阻断）。
- **dispatch console 回显**：工具执行期间的 console 输出回显到结果（调试价值）——调度细节权威 = AGENT-LOOP 板（本层 `AGENT-LOOP.md`）。

### 6.4 安全边界

安全哲学：**信任模型 + 审批门控 + 快照为真实防线**；文本匹配拦截被否定（「安全剧场」——恶意模型必然绕过，拦住的多是正常操作）。

| 面 | 当前机制 |
|---|---|
| 路径 | **无边界解析**（取代 resolveInCwd 双重断言）：相对路径相对 cwd 解析、绝对路径原样解析、符号链接正常跟随；**无目录限制**。信任模型 + 权限门禁为唯一防线 |
| 命令 | **零文本拦截（彻底）**：破坏性命令（rm -rf 等）一律放行，走审批 + 快照。保留 `detectDanger` 危险标注（只给人看红标，不拦截）；bash 超时 120s |
| 网络 | `isPrivateHost`（localhost / 内网 / 云元数据 `169.254.169.254`）SSRF 防护；响应体 ≤ 5MB；HTML 转文本（`stripTags` / `htmlToText`） |
| 文件 | `MAX_READ_LINES = 2000` / `MAX_OUTPUT_CHARS = 200_000`（超限落盘，模型见预览）；`normalizeEOL`（CRLF 统一）；write 前 `autoSyntaxCheck`（JS 文件自动 `node --check`） |
| lint | `node --check` fast path + 语言级联（tsc / ruff / cargo / go vet）；eslint 级联已删（零依赖）——`scripts/check-syntax.mjs` 替代 |
| lsp | 按需 spawn LSP server（`process.execPath` 直跑，无 shell），语义级诊断 / 跳转兜底 |

**execute 边界**：纯净 node ESM 子进程，与 bash 同边界——顶层 await / 动态 `import()` / `require()` / `console` / `fetch` / `process` 全可用；**无 import 阻断、无 require 禁、无目录限制、无伪沙箱、无预置全局**（exec-prelude 已退役）。文件能力唯一入口 = 专用工具。超时 SIGKILL 强杀（默认 30s，上限 600s）。

### 6.5 调度与权限（标记语义）

调度两段式详情权威 = AGENT-LOOP 板，此处只列**工具标记语义**：

- `readonly` = 无副作用、可并行；
- `parallel: true` = 显式声明可并行（grep / glob）；
- `sideEffectExempt` = 有副作用但豁免于「失效 advisor / verify」追踪（subagent）；
- **审批门控**：破坏性动作（delete / 外发 / 快照类）走 `onPermissionRequest`（autoApprove 短路 / 批量确认）。

### 6.6 编辑工具语义（地图——每工具权威档分拆）

> 定位句 + 契约要点集中在此；逐工具详细正文住各自权威档（本批不并入）。

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

### 6.7 逐工具契约（要旨）

- **git**：action 集含 add / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick + clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv。破坏性动作（reset --hard / checkout 丢改动 / rm / clean / rebase 有未提交时）
**先快照再执行 + 确认**，从不拦截（`gitGuardSnapshot`）；status 用 `runGitRaw` 保行前导空格（防 porcelain 误分类）。
- **execute**：`code`（inline ESM）与 `scriptFile` 二选一必填；`nodeArgs` 禁 `--eval` / `--inspect` 类；scriptFile 可指向 workspace 外；超时默认 30s / 上限 600s。
- **glob**：`{a,b}` brace 展开；`!` 排除前缀；不支持语法（`?(x)` / `@(a|b)` / `+(x)` / 空 / 未闭合 brace）**显式报错**（不静默漏匹配）。
- **wait_for**：条件等待（非 sleep）——条件语义化（advisor settled / subagent id:N done / consult done / file exists / port open）；未知条件显式报错；timeout 默认 30s（config 可覆盖，cap 600s）；interval 默认 1s 下限 100ms。**`advisor settled` 判据** = 后台评审池真实态（无 running / queued 评审）——修前读子代理池的 advisor 条目（该池永无此类条目）⇒ **恒真 0ms 秒过**（用户实证）
。机制面细则归 AGENT-LOOP 板。
- **timer**：默认 180s；`seconds` 必须为有限正数。
- **task**：状态别名归一（completed / finished / …）+ warning；跨会话 / 项目级用**台账**（`/ledger`——描述含路由）。
- **verify**：通用验证门禁——语言 / 框架 / 项目无关，不自动跑任何测试命令；模型经 `verification:{status:"passed"|"failed"|"skipped", command?, summary?}` 声明验证状态（passed 放行 / failed 打回 / skipped 放行但须 summary 理由）；参数已删 `full` / `testNamePattern` / `filter`，保留 `workdir`。
- **read_image**：视觉模型读图；非视觉模型拒绝 / 占位（防 image_url 毒化会话）；svg 返回文本源码、bmp 拒绝并提示转 PNG。
- **websearch / fetch**：网络边界见 §6.4；fetch 失败错误含 proxy 提示。
- **process / file_ops / get_current_time / tree / lsp / lint / delete / bash**：按各自描述契约。
- **batch_segment**：批次档段写入（**无路径参数**——目标档 = spawn 绑定；身份定可写段）；append-only；写前剔凭证；工具盖轮次戳（仅 §3）；fail-closed 逐条 throw。权威 = 工程模式板。

### 6.8 MCP（动态展开）

MCP 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 `inputSchema`、execute → `tools/call`），并入 `builtinTools` 走统一 schema；**网关式 `mcp` 工具已废弃**。机制权威 = MCP 板（本层 `MCP.md`）。

### 6.9 工具描述写作六要素

工具描述（md / 内嵌）必含六要素，缺一补一：① 一句话语义（能做什么 / 不能做什么）；② 参数关系；③ 路由 / 反模式（何时用别的工具、何时不该用本工具）；④ 副作用与权限（破坏性 / 外发 / 需确认标注）；⑤ 错误形态（失败时返回什么、如何引导）；⑥ 多端一致（CLI / VS Code 描述同语义）。

### 6.10 `websearch` 配置面——`provider` 死键处置

- **问题**：`DEFAULTS.websearch` 曾申报 `provider: "tavily"` 但**全仓零读取点**（死键）；VSC 面板保存 key 时还把该键**写回用户 config.json**（死键被产品主动播种）。
- **选定方案 = 移除死键**（声明 + 文档 + 两端写入面）：**零行为变更**（无读取点删除；遗留值照旧被忽略）；删 1 行 + 文档同步 + VSC 面清理——不触碰搜索语义 / 兜底链；`provider` 名保留为未来干净槽位。**否决**接线为后端选择（形状靠猜、行为变更面、双端漂移面最大）· 保留现状（配置面继续说谎）。
- **读取面（单点不变）**：`config.websearch.apiKey` → agent.config → `thincoder-core/tools/web.mjs` 触发 Tavily；无 key / Tavily 失败 → Bing 兜底（**web.mjs 零改**）。
- **遗留值语义**：磁盘 `websearch.provider` 原样保留（零读取 / 零校验 / 零写回）；`settings` 工具类型表自动派生自 DEFAULTS——键移除即脱表（**未知键原样** = 既有通用语义，零特判）。
- **关键决策**：D-1 选型 = 移除 · D-2 不做遗留值剥离 / 迁移 / 写回（剥离需动启动路径，收益仅内存洁癖）· D-3 不加校验 / 特判 · D-4 VSC 面同批收口（CLI 删、VSC 继续播种 = 假收口）· D-5 未来衔接（DeepSeek 端点批以完整信息设计选择面）· D-6 工具描述文本零改。**UI / 交互决策：无**（config 键处置；VSC 面板 provider 从未渲染；CLI TUI 无 websearch provider 入口）——**无 open 项**。

### 6.11 VSC 端适配增强（并入 · 2026-09-15 批 8 · 自 `thincoder-vscode/docs/design/TOOLS.md` §3 / §8）

VS Code 端在 extension host 内运行的**端独有增强**（CLI 无对应面——端差登记，不归核）：

- **编辑器路径**：write / edit 对已打开文档经 **WorkspaceEdit** 应用（undo 集成）后立即保存（`getOpenDoc` / `applyEditorEdit`——接收档 = 拆壳薄壳 `thincoder-vscode/src/tools/shared.mjs`）；
  `getOpenDoc` win32 盘符大小写归一（防 split-brain）。**W14 接线（2026-09-15）**：工具面写点全经核写路径缝（`configureWritePath`——`thincoder-core/tools/write-path.mjs`）执行端侧注入（脏缓冲拒写在核侧门禁）；
  VSC 原自持编辑工具面（`file-edit.mjs` / `more-file.mjs` / `hashline-edit.mjs` / `edit-line-params.mjs` / `edit-fuzzy-match.mjs`）已删——现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs, patch.mjs}`；
  `lfOffsetToRaw`（range 偏移）随自持 range 编辑面退场（现体 = 核全文写回），细则 = `docs/core/design/EDIT-HELPERS.md` §6。
- **lsp（VS Code 原生）**：语言服务直用（`executeDefinitionProvider` 等 + `languages.getDiagnostics`）——零自起进程（对端 CLI = 按需 spawn LSP server，§6.4）。**W14 接线（2026-09-15）**：经 `configureLspHost` 注入（桥住 `thincoder-vscode/src/tools/index.mjs`；核内默认径 = JSON-RPC）。
- **bash**：继承宿主 shell 环境；`runInterruptible` spawn（非 execSync——不阻塞 extension host 事件循环）+ Stop / 超时经 `killProcessTree` 整树杀（`/T /F` 达孙进程）。
  **W14 接线（2026-09-15）**：`configureExecRun`（可中断执行器——linter / verify 等核内执行面）与 `configureProcessTreeKill`（树杀）、`configureTreeResolve`（`tree` 工具 cwd 归一）均以拆壳薄壳 `thincoder-vscode/src/tools/shared.mjs` 为接收档注入。
- **权限审批面**：webview 逐工具弹窗 + 批合并询问（`permission-gate.mjs` / `batchPermissionGate`）+ 逐项 diff 预览；子代理（depth>0）审批卡（归属 `<child key> · <tool>`——`makeChildPermission`）+ Stop 释放挂起门
  （abort → resolve(false)/deny，循环不悬挂——接线 = `docs/core/design/AGENT-LOOP.md` §6.18）。**W14 端增量（2026-09-15）**：git 工具动作级只读分类（`isReadonlyAction`）迁入 VSC 装配面 `thincoder-vscode/src/tools/index.mjs`（核 git 工具无此概念）；
  审批层还消费 `configureGitApproval` / `configureEditReceipt` 缝（本批按缺省不覆盖——端审批在工具执行前）。
- **描述装载面**：两端同源 = 核包 `tool-docs/*.md`（`DESC()` = 核 `loadToolDoc` 单一解析面；CLI 随 U2 / VSC 随 W2 落——VSC 原 `.mjs` 内嵌面已退场；锚替换调用期应用）；24 档随包发布（`.vscodeignore` 不排除 `node_modules/@thincoder/core/**`——打包面 N6 需求侧承载）。
- **工具面接线（2026-09-20 · 机制层端差批）**：① **派发面 hooks 三调用点**（`thincoder-vscode/src/agent/execute-tools.mjs:176` PreToolUse〔可阻断——阻断结果逐字同核 `thincoder-core/agent/dispatch.mjs:337-338`〕· `:268` PostToolUse · `:288` PostToolUseFailure；机制 = `AGENT-LOOP.md` §6.13 / §6.18）；
  ② **台账查询两工具入基础集**（`ledger_query` / `ledger_count`——`thincoder-vscode/src/agent/setup.mjs:142-144` 经动态 import 核 `ledger.mjs` 追加、`:165-168` 入 `baseTools` ⇒ 模型面 + 子代装配面同核口径；写命令族本已随核 `assembleFamilyTools` 在端可达）。

### 6.12 git 工具读面 fail-closed（2026-09-18 · 批 TOOLFACE-FIXES · 条目 ③ · 台账 #55）

**问题（实测）**：`git` 工具 `action:"status"` 在多会话工作区返回 `(clean — no changes)`，而同刻 `git status --porcelain`（bash）列出工作树的 `M` 行。

**复现判定（设计轮实测 · 2026-09-18）**：

| 读数 | 命令 / 路径 | 结果 |
|---|---|---|
| 工具路径（会话 cwd） | `runGitRaw("D:/teamcode", ["status","--porcelain"])` ⇒ `""` ⇒ 渲染 `(clean — no changes)` | **假洁净（复现）** |
| 工具路径（仓 cwd） | `runGitRaw("D:/teamcode/thincoder", …)` ≡ 同刻 bash `git status --porcelain` | **逐字一致**（无并发 / 缓存面缺陷） |
| 非仓 cwd 的底层 git | 退出码 **128** · stdout `""` · stderr `fatal: not a git repository (or any of the parent directories): .git` | 失败被吞 |
| cwd 归属 | 工具 cwd = 会话 cwd（`thincoder-core/agent/dispatch.mjs:389` `cwd: agent.cwd`；子代继承 `subagent-spawn.mjs:349`）＝ `D:\teamcode`（**非仓**）；工作仓 = 其子目录 `D:\teamcode\thincoder` | 双因复合的触发条件 |
| 绕行验证 | `gitTool.execute({action:"status", workdir:"thincoder"})` | 正确列出 12 处 `M` |

**结论 = 可复现（同步态 · 100% · 零并发）**。根因 = ① 工具 cwd 非仓（工作区根 ≠ 仓根）+ ② `runGitRaw`（`thincoder-core/tools/git.mjs:15-21`）把 git 失败吞成 `""`
（`stdio: ["ignore","pipe","ignore"]` 丢 stderr、catch 只取 `e.stdout`），`status` 分支（`:114-115`）再把 `""` 读作「无改动」。
**并发假设（台账原记「多会话共写一仓」）= 非必需**：两读数唯一变量 = cwd（同一 git 二进制、同一仓、同一刻）；本仓 `core.fsmonitor` / `core.untrackedCache` / `core.preloadIndex` **三键实测全空** ⇒ 无陈旧缓存使能面。

**假设 × 区分性实验**（H3 夹具须仓外 scratch 仓——按纪律不在设计轮落，留实施轮）：

| 假设 | 区分性实验 | 判别读数 |
|---|---|---|
| H1 cwd∉仓 | 同刻双读（工具 cwd vs bash 仓内） | 工具 clean / bash 有 `M` ⇒ 立 |
| H2 吞错（任意 git 失败 ⇒ 假洁净） | 非仓 cwd 的退出码 + stdout 直读；仓内强制失败（坏 index / 非法参数） | exit ≠ 0 ∧ stdout `""` ⇒ 立 |
| H3 并发 / 缓存（index.lock · fsmonitor · racy-clean） | ① 三键 config 实读 ② scratch 仓持 `.git/index.lock` 后跑 `git status --porcelain` 记退出码 / stdout ③ 仓内三读对账（`--porcelain` vs `--no-optional-locks` vs `git diff --name-only`） | ② exit 0 ∧ 输出正确 ⇒ 并发不致假洁净；③ 三读一致 ⇒ 无缓存假洁净 |

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

**调用方普查（发现 1 落点 · `runGit(` / `runGitRaw(` 全仓 grep · as-of 2026-09-18）**：

命令与范围：`grep -rn "runGit(\|runGitRaw(" thincoder-core/ thincoder-cli/ thincoder-vscode/src/ --include=*.mjs`——命中 = 定义 2 处（`shared.mjs:442` · `git.mjs:15`）+ 调用 **13 处**（下表全列）；VSC 侧仅 1 处（端不持本地实现）。

| # | 调用方（逐处） | 分类 | 改后行为 |
|---|---|---|---|
| 1 | `git.mjs:108`（diff）· `:154`（log）· `:160`（show）· `:216`（ls-remote）· `:230`（tag list）· `:250`（branch list）· `:299`（stash list） | 工具层读动作（7 处） | **改后新增抛错** = 预期 fail-closed（throw 经 dispatch ⇒ `Error:` + ok:false，模型必见） |
| 2 | `git.mjs:114`（status——经 `runGitRaw`；本批修复目标点） | 工具层读动作（第 8 处） | 同上（假洁净就此消失） |
| 3 | `git-ext.mjs:97`（remote list）· `:136`（worktree list）· `:162`（blame） | 工具层读动作（3 处） | 同上 |
| 4 | `git-checkpoint.mjs:28`（`lazyClearIfCommitted`） | **已 try/catch** | **零变**（`:24-36` 全程 try/catch + 非数字提前返回） |
| 5 | `thincoder-vscode/src/tools/context.mjs:131`（`changesSection`） | **已 try/catch** | **零变**（`:128-134` 已按 throw 契约写 catch ⇒ 返回 null） |

**计数自洽**：读动作调用点合计 = **11 处**（#1 的 7 + #2 的 status + #3 的 3）——其中「十处读动作调用点」（修法表 #5 口径）= **不含 status 本点**的 10 处。「已 try/catch」= 2 处（#4 / #5）。
**无未捕获且非工具层的调用方**（VSC 唯一调用方自持 catch；CLI 侧无第二个消费面）⇒ throw 的爆炸半径 = 工具层读动作，落点正合本批目标。

**「有仓但无提交」（unborn branch）枚举（发现 6 落点 · 设计轮 scratch 仓实测——`git init` 零提交 · as-of 2026-09-18）**：

认定谓词：**非仓** = 退出码 128 ∧ stderr 首行含 `not a git repository`；**unborn** = 有仓、退出码 128 ∧ stderr ∈ {`does not have any commits yet` / `bad revision` / `no such ref: HEAD`}——两类**皆抛错**，但**仅非仓附指引**（修法表 #4 谓词）。

| 读动作 | unborn 底层读数（实测） | 今日 | 改后 |
|---|---|---|---|
| `status` | exit 0 · 空输出（加文件后 `?? f.txt`） | `(clean — no changes)` | **不变**（空仓 = 真洁净——A9 同判） |
| `log` | exit 128 · `fatal: your current branch 'main' does not have any commits yet` | `(no commits)` | **抛错**（占位退场） |
| `diff`（缺省 ref = HEAD） | exit 128 · `fatal: bad revision 'HEAD'` | `(no changes)` | **抛错** |
| `show`（缺省 ref = HEAD） | exit 128 · `fatal: ambiguous argument 'HEAD'` | `(no such commit)` | **抛错** |
| `blame` | exit 128 · `fatal: no such ref: HEAD` | `(no blame output for …)` | **抛错** |
| `tag list` · `branch list` · `stash list` · `remote list` · `worktree list` | **exit 0** | 占位 / 正常输出 | **不变** |

语义：unborn 下 `log` / `show` / `diff` / `blame` 由「占位文案」改判「抛错」——「没有提交」必须显式（占位与「有提交但过滤后为空」不可辨）；`status` 与 list 族零变。

**H3 夹具 = 实施轮必跑项（发现 7 落点）**：上「假设 × 区分性实验」H3 两夹具按纪律不在设计轮落（须仓外 scratch 仓）——实施轮**必跑**并记读数（跳过 = 判据缺失 · 静默省略面）：

① scratch 仓持 `.git/index.lock` ⇒ 跑 `git status --porcelain` 记**退出码 + stdout 原文**（期望 exit 0 ∧ 输出正确 ⇒ 并发不致假洁净；若 exit ≠ 0 ⇒ 记读数并按抛错契约判行为）；
② 仓内三读对账（`--porcelain` vs `--no-optional-locks` vs `git diff --name-only`）逐条一致 ⇒ 无缓存假洁净；
③ 读数（仓路径 / git 版本 / 两读输出）落实施记录 §5。

**验收（机判）**：A7 非仓 cwd ⇒ `status` **抛错**且消息含 `not a git repository` + 该 cwd、**不含** `clean — no changes`；A8 仓内改动 ⇒ 输出与同刻 `git status --porcelain` 逐条一致；
A9 真洁净仓（`git init` 空仓）⇒ 仍 `(clean — no changes)`（零假阳）；A10 抽样 `log`（非仓 cwd）⇒ 抛出而非 `(no commits)`（十处读动作同判据）；
A11 unborn 仓（`git init` 零提交）：`status` ⇒ `(clean — no changes)`；`log` / `show` / `diff` / `blame` ⇒ 抛错（消息含上表对应 stderr 首行）；list 族 ⇒ 占位 / 输出不变；
A12 谓词反证：非仓消息**含**指引句；unborn / bad-revision 消息**不含**（谓词 = 128 ∧ stderr 含 `not a git repository`）；
A13 调用方普查 · 套件级：三包全量 `npm test` 失败集合 ⊆ 批前失败集合（口径同 A-MS6 · `AGENT-LOOP-SUBAGENT.md:713`）；H3 夹具读数已落 §5（实施轮必跑项）。

**测试面**：`thincoder-core/test/tool-seams.test.mjs:88-106`（#59 审批门用例）现于**非仓 temp 目录**（`withTempDir` = `mkdtempSync(tmpdir())`，实测非仓）断言 `status` = `(clean — no changes)`（`:101` / `:104` 两处）⇒ **现有用例把假洁净写成期望值**；
本批改法（逐处）：① 该用例 ctx.cwd 改挂 `git init` 洁净仓（`execFileSync("git", ["init","-q"], { cwd: dir })`）⇒ 两处断言原样成立（= A9 真洁净路径）；
② 非仓路径另立断言（同档）⇒ `status` **抛错** + 消息含 `not a git repository`（A7，测试面用 `assert.rejects`）。两例分离后「洁净」与「非仓」不再共用同一期望值。

**对账口径（#55 已落地 · 2026-09-19 实核）**：收口判定一律以 `git status --porcelain`（bash，仓内）为准；工具侧自 **#62 批起**已自带仓发现（**缺省 = 发现的项目仓根**，显式 `workdir` 优先）——原「修复落地前…可临时以 `workdir` 绕行」句**已退役**（#55 落地 + #62 发现面落地）。

**边界（本节不做）**：~~不做跨仓自动发现~~ **已由 §6.13 落定**（2026-09-18 #62 批——工作区根 ⇒ 唯一带 manifest 子仓自动下钻；本节的 fail-closed 保留为**零发现态**兜底，语义零改）；不改工具描述（`thincoder-core/tool-docs/git.md` = 提示词面，内容权归主 agent）；不改 `runGitStrict` 族（写面已是严格形）；H3 夹具留实施轮；不改 `advisor/repos.mjs` 的独立 git 读取面（自带 `stdio` 三通，非本缺陷族）。

### 6.13 git 工具仓发现（2026-09-18 · 批 REPO-DISCOVERY · 台账 #62——§6.12 之上的发现层）

**问题**：会话锚 = 工作区根（非 git 仓）+ 工作仓 = 其子目录 ⇒ §6.12 的 fail-closed 把「非仓 cwd」如实暴露为错误，但工具**仍不可用**（每次都得手传 `workdir`）。

**裁定（用户 2026-09-18 05:16 / 05:34 两次定向）**：①「找仓这件事儿其实做 project-manifest 生成的时候做过一次，我觉得应该用同样一套逻辑」②「可以用同样的逻辑，**甚至共享代码**」⇒ `git` 工具的仓解析**复用 manifest 的仓发现逻辑**——**单源、禁两份实现**（D2）。

**源逻辑现址（本批实核——已成实装，非「仅提示词成文」）**：`thincoder-core/manifest.mjs:44-56`（`resolveProjectRoot`）；提示词侧同源成文 = `thincoder-core/prompts/persona-engineering.md:45`；需求侧 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.2。

**发现规则（逐条——锚判定 + 一层向下）**：

| # | 条 | 判据 |
|---|---|---|
| 1 | 锚判定 | 锚（会话 cwd 的 `resolve`）自身含 `.git` ⇒ 锚即仓根 |
| 2 | 向下深度 | **仅直接子目录一层**（不递归、**不向上**——向上遍历由 git 自身语义兜底，本层不引入） |
| 3 | 子仓判据 | 子目录含 `.git` **∧** 含 `PROJECT-MANIFEST.json`（**只判存在性**——不解析档内容、不问模式） |
| 4 | 恰一 ⇒ 命中 | 恰好一个 ⇒ 该子仓即发现结果（本工作区 = 此类：13 个直接子目录含 `.git`，其中带 manifest 者**恰 1** = `thincoder`） |
| 5 | 零 / 多 | 零个 = 无发现（⇒ §6.12 兜底）；≥2 = **歧义**（列全部候选，**不猜**） |

**单源落点与两消费者接线**：

| # | 面 | 接线 |
|---|---|---|
| 1 | 落点 | `thincoder-core/manifest.mjs` 新导出 `discoverRepos(cwd)` → `{ kind, root, candidates }`，`kind` ∈ `self` / `unique` / `none` / `ambiguous`——判据与既有 `resolveProjectRoot` **同一处**（D2）；`candidates` **按名排序**（歧义消息确定可判） |
| 2 | 消费者①（manifest 初始化面） | `resolveProjectRoot(cwd)` 退为 `discoverRepos(cwd).root` 的**薄包装**（**零语义**——四态输出与批前逐字同）；其调用方 `manifestFilePath` / `docRootBase` / `thincoder-core/ledger-db.mjs` **零改** |
| 3 | 消费者②（git 工具解析面） | `thincoder-core/tools/git.mjs` 的 `execute()` 头部**单点**（`git.mjs:94-97` 一带：workdir 归一 `:97` 之后、审批门 `:99-102` 之前）⇒ 全 action 覆盖（`git-ext.mjs` / `git-checkpoint.mjs` 族经同一 `ctx`）——**调用点零改**（重定向改的即 `ctx` 变量本身 ⇒ 三档消费面无需改；as-of 2026-09-19 **实施前**实读：`ctx.cwd` 消费点 = `git.mjs` **31** · `git-ext.mjs` **17** · `git-checkpoint.mjs` **7**。原记「13 处读 / 写调用点」系**误借** §6.12 调用方普查（`runGit(` / `runGitRaw(` 口径）之数——已收正；单源机判见 A20） |

**解析序（缺省路径的兜底——workdir 显式优先）**：

| 序 | 条件 | 结果 |
|---|---|---|
| 1 | `args.workdir` 在场（含 `"."`）——判据 = **与既有接线同源的真值判定**（`git.mjs:97` `if (args.workdir)`；空串 / null 走发现） | `resolve(cwd, workdir)`；**零发现** |
| 2 | 无 workdir ∧ `self` | `ctx.cwd` 原值（锚已是仓根）；**对象引用透传**（不 clone——#59 缝用例按引用断言） |
| 3 | 无 workdir ∧ `unique` | `ctx.cwd ← root`（重定向）+ 结果首行注记（见下） |
| 4 | 无 workdir ∧ `none` | `ctx.cwd` 原值 ⇒ 落到 §6.12 fail-closed（**零态兜底 = 本批前置、零改**） |
| 5 | 无 workdir ∧ `ambiguous` | **throw**（fail-closed）：消息列全部候选**绝对路径** + 指引传 `workdir`——**不猜** |

**动作面例外（创建仓的两个动作）**：`init` / `clone` 以 **cwd 为落点**（`git init` 在无仓处天然合法；`clone` 的落点为 cwd 相对路径）⇒ **不做发现**（否则「在此处建仓 / 克隆」被静默搬进别的仓）；二者仍可经 `workdir` 显式指落点。其余 action 一律照发现（含 `worktree add` 等需既有仓者）。

**产出注记（重定向可见）**：重定向发生 ⇒ 结果**首行**加 `(repo: <仓根绝对路径>)`（同族先例 = `git-checkpoint.mjs` 的 `[snapshot …]` 前缀行；端拒执行串原样返回、不加注记）。
理由：① 静默重定向 ⇒ 模型不知哪一仓应答；② 重定向后 `path` 类参数**基数 = 仓根**——写错基数时 git 侧 **exit 0 + 空输出**（实测 `git diff HEAD -- no/such/path.txt` ⇒ exit 0 / stdout 空 / stderr 空）⇒ 与 §6.12 要消灭的假洁净**同形**，注记是廉价消歧面。被拒备选：**静默重定向**（①② 皆不可观测）。

**退化口径（normal 模式）**：发现 = **纯 fs 判据**（不读 manifest 内容、不查模式、不依赖 `agent`）⇒ 两模式**同判**；「无 manifest 概念」的项目（子仓皆无 manifest）⇒ `none` ⇒ **现状 fail-closed**（零行为变）。

**开销（实测）**：`D:/teamcode`（45 目录 / 13 子仓）单次发现 = **1.35 ms**（20 次均值）；仓锚路径（含 `.git`）= 0.09 ms ⇒ **不做缓存**（被拒备选：mtime / cwd 键缓存——`git init` / `clone` 会改盘面，缓存的失真面恰是发现本身；开销已在噪声级）。

**落位（机制级——行数 / 增量 as-of 表归批档 §2）**：

| # | 文件 | 落点 |
|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 新导出 `discoverRepos` + `resolveProjectRoot` 改薄包装 + 头注一行 |
| 2 | `thincoder-core/tools/git.mjs` | `execute()` 头部：import + 解析序（workdir / 发现 / 歧义 throw）+ 注记前缀（执行体抽模块级函数——**不用 `this`**：VSC 侧 `{...coreGitTool}` 展开装饰，`this` 绑定不可依赖） |
| 3 | `thincoder-core/test/manifest.test.mjs` | `discoverRepos` 四态 + 候选保序（T41 / T42——用例表住 `docs/core/design/MANIFEST.md` §3.2） |
| 4 | `thincoder-core/test/git-repo-discovery.test.mjs`（拟新增） | A14–A20 七格（夹具 = 真实 `git init` 仓 + `PROJECT-MANIFEST.json` 档；A20 = 源码结构断言、无夹具） |

**用例表（正常 / 边界 / 错误 · 判据 = A14–A20）**：

**路径纪律（派单设计要点②）**：A14–A19 一律经 **`gitTool.execute(args, ctx)` 真工具调用面**（禁绕过工具直调 `discoverRepos`）；
夹具 = 真实 `git init` 仓 + 真实 `PROJECT-MANIFEST.json` 档（**禁** mock / 占位目录手写——发现面走真判据）；A20 = 源码结构断言（无夹具）。

| # | 场景 | 夹具 / 输入 | 预期 |
|---|---|---|---|
| A14 | 正常：**唯一态**（本工作区形态） | 容器（非仓）+ 恰一个含 `.git` ∧ manifest 的子仓（仓内一文件改动）+ 一个含 `.git` 但**无** manifest 的干扰子目录（判别合取——只扫 `.git` 的第二份实现会选错）；`{action:"status"}`、cwd = 容器 | 输出 = 该子仓 porcelain（与同刻 `git status --porcelain` 逐条一致）+ 首行 `(repo: <子仓>)`（**先红**——批前：非仓失败 / 假洁净） |
| A15 | 边界：**零态** | 容器（非仓）+ 空子目录；`{action:"status"}` | `ctx.cwd` 不变 ⇒ §6.12 语义（throw·消息含 `not a git repository`）——**#55 落地后可判**（本批前置） |
| A16 | 错误：**多态** | 容器 + **两个**含 `.git` ∧ manifest 的子仓；`{action:"status"}` | **throw**·消息含两候选**绝对路径** + 含 `workdir`；不含 `clean`（**先红**） |
| A17 | 边界：**workdir 优先** | 同 A14 夹具 + `workdir: "other"`（另一仓、无 manifest） | git 在 `other` 执行（非发现结果）+ **无注记行**（回归守卫——批前批后同） |
| A18 | 边界：**仓内锚 / 仓的子目录**（回归） | cwd = 仓根；cwd = 仓内子目录（锚无 `.git`、子目录无 manifest） | 两格皆照旧（`self` / `none` ⇒ `ctx.cwd` 原值；仓子目录靠 git 自身向上搜索）+ 无注记行 |
| A19 | 边界：**创建类动作例外** | 唯一态容器 + `{action:"init"}` | `.git` 落在**容器**（不在发现的子仓）；子仓 `.git` 未被重写 |
| A20 | 错误 / 结构面：**单源机判**（禁第二份发现实现——KD-M1-22） | 读 `thincoder-core/tools/git.mjs` 源码（**无夹具**） | ① `discoverRepos` 自 `../manifest.mjs` **import 命中**（两消费者共用同一导出）② 该档 `node:fs` import **零命中**（物理上无法自写目录扫描）③ `readdirSync` / `existsSync` / `statSync` 三谓词**零命中**（**先红**——as-of 2026-09-19 三条全不成立：该档 import 面仅 `node:child_process` / `node:path`，`.git` / `manifest` 字面亦零命中） |

**验收（机判）**：A14 输出 ≡ 仓内 porcelain + `(repo: ` 首行；A15 零态 = 非仓失败语义（#55 落地后）；A16 throw + 两候选路径 + `/workdir/` + 无 `clean`；
A17 workdir 优先 + 无注记；A18 两类 cwd 零行为变（既有用例全绿）；A19 init 落点 = 锚；
**A20** 三条结构断言全绿（源码面——`discoverRepos` import 命中 ∧ `node:fs` 零命中 ∧ 扫描谓词零命中）。
**前置（已满足）**：A15 依赖 §6.12（#55 fail-closed）——**2026-09-19 实核已落地**
（`thincoder-core/tools/git.mjs:16-25` `runGitRaw` 失败 throw · `thincoder-core/test/tool-seams.test.mjs:110-118` A7–A12 用例在档；台账 #55 = 已核销）⇒ A15 可判（「前置未满足」记法撤销）。

**测试面**：新档 `thincoder-core/test/git-repo-discovery.test.mjs`（拟新增，`_setProjectRootForTest` **须复位**——发现面走真判据）；
`thincoder-core/test/manifest.test.mjs` 增 T41 / T42；既有 T-F9（同档）作 `resolveProjectRoot` 的零语义回归守卫（**零改**）。
#59 审批门用例（`thincoder-core/test/tool-seams.test.mjs:88-106`）的夹具改造归 #55 批，本批**零改**
（**#55 已落地**——该用例已改真洁净仓，见 `thincoder-core/test/tool-seams.test.mjs:91`）。
**A20 落同档**（读 `thincoder-core/tools/git.mjs` 源码的结构断言——先例 = `thincoder-core/test/write-path.test.mjs:289` 同式读源码）。

**边界（本节不做）**：工具描述正文**本批已收口**（`thincoder-core/tool-docs/git.md:39` + `thincoder-core/tools/git.mjs:85` 内联描述——两面逐字同口径 = `Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）`；2026-09-19 实现+点修轮落地）· 不改
 `runGitStrict` 族（写面）· 不改 §6.12 的 fail-closed 语义（本批是其**发现层**，零态兜底不变）· 不做多级向下递归 / 向上遍历 · 不做发现结果缓存 · 不扩到其他工具（`bash` / `read` 等 cwd 语义不变）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-TO1 | **md 文件即 description**（CLI 用外部 `tool-docs/*.md`） | 长描述模型才理解边界；代码 / 描述分离便于迭代不触发 schema 变更 |
| D-TO2 | **bash 命令零文本拦截** = 安全剧场论证 | 文本匹配拦不住恶意模型（空白 / heredoc / node -e 绕过），只误伤正常操作；真实防线 = 审批层 + 快照；`detectDanger` 只给人看不构成边界 |
| D-TO3 | **超限落盘而非截断**（模型可再 read 全量，预览够决策） | 截断丢信息；落盘 + 指针让模型自主取全量 |
| D-TO4 | 工具**全部字符串返回** | schema 简单、dispatch 统一、流式展示统一；undefined 视为错误（显式检查） |
| D-TO5 | 编辑工具「**一个工具一权威档**」（本档只留地图 + 契约要点） | 多工具正文塞一档会超限且难维护；共享 helper 单源 |
| D-TO6 | 无 UI 时降级形态按**端注入**（question / bash terminal 参数 / lsp 径） | 无 UI 抛错（CLI）与降级原生 UI（VSC）是结构性端差——以注入承载，不排除出核 |
| D-TO7 | 逐工具动作集 / 校验取**并集或一侧**（见裁决行与须裁条目） | 各工具差异逐条裁决（如 timer 补校验、plan 未知 action 报错、task 过滤 + 截断）——行为变更须逐条登记 |
| D-TO8 | `websearch.provider` 死键 = **移除** | 死键无消费方、零行为变更、单一权威源负担最小；否决接线为后端选择 · 保留现状（见 §6.10） |
| D-TO9 | VSC 适配增强 = **端差登记入 §6.11**（编辑器 / 语言服务 / 审批面 / 描述装载） | 机制归核 + 端特有面注入（D-TO6 同族）——零归核、零复制（D2）；CLI 面已并 §6.1–§6.10 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TOOLS.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 文末「变更记录」（逐批修正轮） | 逐批变更流水账 | 历史叙述——本档自有变更记录 |
| §6 开头的「文档重组」叙述（编辑工具自本节拆出历史） | 旧结构（拆前单节）的叙述 | 现行形态（一工具一权威档）已入 §6.6 |
| §11 内「历史沙箱只出不进 / exec-prelude 退役」括注 | 已退役机制的历史 | 现行边界已入 §6.4（execute 与 bash 同边界） |
| §2 「read_pdf 已移除 / sleep 已删」等括注 | 旧工具名 | 时点变更标记——现行工具集已入 §6.2 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §6 编辑工具逐工具正文（edit / insert_after / hashline_edit / apply_patch / write） | 每工具详细约束 | 已拆到**各工具权威档**（旧档自述「不再复制正文」）——本档只留地图与契约要点（§6.6） |
| §7 逐工具的完整动作枚举 / 参数细节 | 逐工具契约全文 | 工具描述（`tool-docs/*.md`）为**提示词面**（产品代码，内容权归主 agent）；机制要点已入 §6.7 |
| §11.2 方案选型对比表 | 三候选逐项评估 | 结论已提炼入 §6.10 / §7（D-TO8） |
| §11.4 受影响文件清单 | 逐档行数 | **一次性批次材料**——批次档承载 |
| §11.6 验收标准 AC-1–AC-7 · §11.7 用例表 T1–T8 + 「扫描枚举」注 | 验收与用例（含扫描器形态枚举） | **一次性批次材料**——测试资产归测试层 |
| §11.8 边界（本批不做） | 单批边界声明 | 批次语境——现行边界已入 §6.10 |
| §3 hooks / undo 快照的执行细节 | 实现面细节 | 机制要点已入 §6.3；检查点 / hooks 权威归各自板块 |
| VSC 档（`thincoder-vscode/docs/design/TOOLS.md`）各批次节（§11 / §12 选型 · 契约 · 用例表 · AC 表） | git `--only` 镜像 / 描述外部装载的批次材料与验收表 | **一次性批次材料**——结论已入 §6.7（git 路径面）/ §6.11（描述装载面）；批次档承载 |
| VSC 档「状态行 / 变更记录」 | 时点状态 + 逐批流水 | 时点材料 / 历史叙述——归台账 / 本档变更记录 |

### 8.3 需求侧（已并入本层需求档）

§1 总体需求 / §2 F1–F7 / §3 N1–N9 / §4 范围边界（旧档自身即需求层）已并入本层需求档 `docs/core/requirements/TOOLS.md`（**与本档同名成对**）——本档不重复。

## 9. checklist 废除（v2——M7 增量）

**定位**：checklist 工具（`tools/checklist.mjs` + `tool-docs/checklist.md` + CLI `tools/checklist-sync.mjs`）**废除**——三处结构性理由：与 task 工具职责重叠（持久跨会话清单 vs 会话级清单——分工不清）、md 持久面与台账（LEDGER）职责重叠（待办总账已有 SQLite 单一权威源）、「归册三选一」退役流程与 M10「测试是开发期工具不是库存」冲突。 （迁移期引文）

**废除形态**：

| 面 | 处置 |
|---|---|
| 工具本体 | `thincoder-core/tools/checklist.mjs` + `tool-docs/checklist.md` + CLI `tools/checklist-sync.mjs` 删除；`thincoder-core/tools/index.mjs` 注册面去掉 checklist 族 （迁移期引文——机制已废） |
| 提示词面 | 提示词中「checklist 工具」指令（discipline 层「双跟踪工具并用 checklist + task」）改指「task 单工具」（经 M9 单向生成承载） |
| 语义承接 | 持久跨会话待办 → **台账**（`ledger_*` 命令族，M2 六态状态机）；会话级任务清单 → **task 工具**（保留） |
| 本档 §2 裁决行 / §6 机制面 checklist 条目 | 标注「已废除（v2 M7）」——历史裁决行保留为参照 |

**验收（回指 AC-M7）**：AC-M7-1 checklist 工具删除（文件不存在 + 注册面零命中）· AC-M7-2 提示词无 checklist 指令（经 M9 生成同步）· AC-M7-3 语义承接无缺口（task 保留 + 台账承接持久面）。

**边界（本增量不做）**：不做 task 工具本体改动（保留）；不做台账（M2 承接）；不做「归册三选一」替代流程（M10 一并砍）。

## 变更记录

- 2026-09-19（**批 REPO-DISCOVERY · 复核与补投轮 · eng-designer**——承 `docs/batches/2026-09-18-repo-discovery.md` §2.9）：
  ① **§6.13 新增 A20**（单源机判——读 `thincoder-core/tools/git.mjs` 源码：`discoverRepos` import 命中 ∧ `node:fs` 零命中 ∧ 扫描谓词零命中；补派单设计要点①「可机判的复用语判据」）；
  ② **接线表行 3 计数口径收正**——原「13 处读 / 写调用点」系误借 §6.12 调用方普查（`runGit(` / `runGitRaw(`）之数，改可复核形（`ctx.cwd` 消费点：`git.mjs` 31 · `git-ext.mjs` 17 · `git-checkpoint.mjs` 7，as-of 2026-09-19 实施前）——**零改结论不变**；
  ③ **A14 夹具加干扰子目录**（含 `.git` 无 manifest ⇒ 判别合取）；
  ④ 接线点坐标 `git.mjs:90-98` → **`:94-97`**；⑤ **A15 前置已满足**（#55 已落地——`git.mjs:16-25` + `test/tool-seams.test.mjs:110-118`）。
  **零新语义**：无机制面改动——① 是既立决策 KD-M1-22 的可判化，②–⑤ 为计数 / 口径 / 坐标收正。

- 2026-09-18（**批 REPO-DISCOVERY · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-repo-discovery.md` §1 · 用户 2026-09-18 05:16 / 05:34 两次定向）：
  新增 §6.13——git 工具仓发现（复用 `thincoder-core/manifest.mjs` 的仓发现逻辑，单源导出 `discoverRepos`；解析序 = workdir 优先 → `self` / `unique`（重定向 + `(repo: …)` 注记）→ `none` 落 §6.12 fail-closed → `ambiguous` throw 列候选 + 指 workdir；`init` / `clone` 例外不做发现；normal 模式同判、零态 = 现状）。
  §6.12 边界行「不做跨仓自动发现」改为已落定（零发现态兜底保留）；判据 A14–A19。对应台账 #62。

- 2026-09-18（**批 TOOLFACE-FIXES · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-18-toolface-fixes.md` §3 轮次 1）：§6.12 逐条落位——调用方普查表 13 处三分（发现 1）· 修法表补 stdio 捕获 + spawn 失败回退形态（发现 5）· unborn 枚举表 + 非仓认定谓词（发现 6）· H3 夹具 = 实施轮必跑项（发现 7）· 验收补 A11–A13；测试面逐处改法明确（非仓 ⇒ 抛错 / 仓内洁净 ⇒ 对照）。

- 2026-09-18（**批 TOOLFACE-FIXES · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-toolface-fixes.md` §1）：新增 §6.12——git 工具读面 fail-closed（`runGit` / `runGitRaw` 失败 ⇒ throw，十处读动作调用点零改）；复现判定 = 同步态可复现（cwd∉仓 + 吞错双因），并发假设非必需；判据 A7–A10；过渡口径入档。对应台账 #55。

- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M7 模块设计语义融合——新增 §9 checklist 废除（工具本体删除 + 提示词面改指 task + 语义台账承接；AC-M7 验收）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md` 归档 `_archive/modules/`。

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #10–#29 / #52–#70 / #83–#86 / #88 / #90–#92 / #96 / #97 / #178 / #179 / 映射表 · §2.5.1 A6 · A8–A13 · B1 / B2 · §2.12.2 第 5–7 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（注入点清单化轮 · eng-designer）：§2.2 表后加**指针**一行——④ 段注入位的核内落点对照与「写路径缝」形态建议住 `CORE-UNIFICATION.md` §2.13.4 / §2.13.5（本节不复制行文；端差处置原文仍以本表为准）。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §6 **机制面**（总览与统一契约 / 注册与 schema / 上下文与生命周期 / 安全边界 / 调度与权限 / 编辑工具地图 / 逐工具契约 / MCP / 描述六要素 / websearch 死键处置）· §7 **关键决策记录（D-TO1–8）** · §8 **不并项与历史沿革** · 来源 = `thincoder-cli/docs/design/TOOLS.md`（**旧档一字未改**——原地作参照历史）；
需求侧已并入本层 `docs/core/requirements/TOOLS.md`；首部加机制面指针一行。
- 2026-09-15（**S2 W2 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W2）：VSC 描述装载面收正——§1 表「工具描述」行（两产品副本已删〔CLI U2 / VSC W2 实核〕，运行期面 = 核包 `tool-docs/*.md`）· §6.2 schema 生成行 + §6.11「描述装载面」行（VSC 原 `.mjs` 内嵌面退场，两端同指核 `loadToolDoc`；锚替换调用期应用）。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：VSC 自持工具实现面迁核收正——§2.2 单端档映射表三行（edit 族 / `read_image` / `wait_for`）+ §2.5 裁决行 #62 / #68 + §6.11 五条端差行按 W14 接线补正（写路径缝 / lsp 缝 / 执行面三缝 / git 只读分类端装饰 / 描述装载面不变）；机制条文（§6.1–§6.10）零改。
- 2026-09-20（**P2 机制层端差批 · 车道 3 设计档落笔轮 · eng-designer**——承 `docs/batches/2026-09-20-mechanism-parity-batch.md` §2.17 / §2.19「设计档落点」）：§6.11 增「工具面接线」条——派发面 hooks 三调用点
  （`thincoder-vscode/src/agent/execute-tools.mjs:176/268/288`）+ 台账查询两工具入基础集（`thincoder-vscode/src/agent/setup.mjs:142-144` / `:165-168`）。机制条文（§6.1–§6.10）零改。
