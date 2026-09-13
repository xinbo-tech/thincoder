# 工具系统（TOOLS）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 工具实现（同路径对） | `thincoder/src/tools/{question,bash,tree,execute,linter,ops,shared,search,lsp,web,file,edit-diff,index}.mjs` | 同名（多为拆档：`shell` / `more-file` / `file-edit` / `edit-fuzzy-match` / `edit-line-params` / `wait_for` 等） |
| 工具描述（提示词面） | `src/tools/*.md`（25 档） | 同名 | 
| 注册表 | `src/agent-tools.mjs` + `src/cli/make-agent.mjs` | `src/agent-tools/index.mjs` |
| agent-tools 工具面 | `src/agent-tools/*.mjs` | 同名 / 拆分档 |
| 单端独有实现 | `tools/{bash,checklist-sync,edit-batch,glob-dialect,patch,repomap}.mjs` | `tools/{checkpoint,code,context,edit-fuzzy-match,edit-line-params,file-edit,focus,hashline-edit,more-file,read_image,shell,wait_for}.mjs` |

> 工具**描述文本**（`src/tools/*.md`）的行本体住 `docs/design/PROMPT-SYSTEM.md`（提示词面）；本档只收**实现面**与工具行为契约。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 工具描述档（原 §2.5（一）逐字节同组——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 10 | `tools/apply_patch.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/apply_patch.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 11 | `tools/checklist.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/checklist.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 12 | `tools/delete.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/delete.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 13 | `tools/edit.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/edit.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 14 | `tools/execute.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/execute.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 15 | `tools/fetch.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/fetch.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 16 | `tools/file_ops.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/file_ops.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 17 | `tools/get_current_time.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/get_current_time.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 18 | `tools/git.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/git.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 19 | `tools/glob.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/glob.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 20 | `tools/hashline_edit.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/hashline_edit.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 21 | `tools/insert_after.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/insert_after.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 22 | `tools/ls.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/ls.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 23 | `tools/lsp.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/lsp.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 24 | `tools/process.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/process.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 25 | `tools/read.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/read.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 26 | `tools/read_image.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/read_image.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 27 | `tools/tree.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/tree.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 28 | `tools/wait_for.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/wait_for.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 29 | `tools/write.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/tool-docs/write.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 工具实现与 agent-tools（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 52 | `tools/question.md` | 同路径 | 0.8667 · 异 | ② | 进核（`core/tool-docs/question.md`） | 融合：取 CLI 措辞 + 无 UI 降级径按端注入（VSC 面板卡片 / QuickPick ＝ ④ 段） | 分叉 ＝ 措辞随两端 UI 形态（CLI 无 UI 抛错 `src/tools/question.mjs:20`；VSC 面板 + 子代理注册期过滤 `src/agent/setup.mjs:196`）；前提（同持有、仅失败形态不同）仍成立 | — | S1（建核补齐） |
| 53 | `tools/bash.md` | 同路径 | 0.8485 · 异 | ② | 进核（`core/tool-docs/bash.md`） | 融合：取 CLI 文本 + `terminal` 参数段按端注入（VSC 宿主真终端 ＝ ④ 段） | 分叉 ＝ VSC 独有 visible/inject 两模式（`src/tools/shell.mjs:183,191,202`）+ CLI 有 POSIX 前置提示（`src/tools/bash.mjs:34,264-266`）；前提（宿主终端只在 VSC）仍成立 | — | S1（建核补齐） |
| 54 | `tools/grep.md` | 同路径 | 0.8125 · 异 | ③ | 进核 | 以 CLI 为准（`before`/`after` 上下文随行；错误形态归一为抛错） | 分叉 ＝ CLI 有上下文档（`src/tools/search.mjs:116-118,173-191`）、VSC 无（`src/tools/search.mjs:230-238`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 55 | `tools/lint.md` | 同路径 | 0.7778 · 异 | ② | 进核 | 融合：取 VSC 措辞（两侧代码实际同输出——CLI `src/tools/linter.mjs:81` / VSC `:85`） | 分叉 ＝ CLI 文档措辞失真（写「✓ no issues」，实为「✓ <checker>: no issues」）；前提 ＝ 无（纯文档订正） | — | S1（建核补齐） |
| 56 | `tools/tree.mjs` | 同路径 | 0.6769 · 异 | ② | 进核（`core/tools/tree.mjs`） | 融合：单实现 + cwd 归一开关按端注入（CLI realpath `src/tools/shared.mjs:282-290` / VSC join `src/tools/shared.mjs:109-112`） | 分叉 ＝ 根路径 helper 不同（跳过集 / 上限 / 文案 / 排序逐字同构）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 57 | `tools/execute.mjs` | 同路径 | 0.6117 · 异 | ② | 进核 | 融合：单实现 + 树杀能力按端注入（VSC 已有 `killProcessTree` 但本档未用——`src/tools/shared.mjs:129`） | 分叉 ＝ CLI 超时树杀（`src/tools/execute.mjs:65-72,104`）vs VSC 只杀直系子进程（`src/tools/execute.mjs:79`）；前提（两端均有树杀能力）成立 ⇒ 不构成端特有 | — | S1（建核补齐） |
| 58 | `tools/websearch.md` | 同路径 | 0.5294 · 异 | ③ | 进核 | 以 CLI 为准（RSS 端点 + `engine`/`page` 参数）〔与 `tools/web.mjs` 同一条款〕 | 分叉 ＝ 抓取实现不同（CLI RSS `src/tools/web.mjs:36-40` / VSC Bing HTML `b_algo` `src/tools/web.mjs:64,71`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 59 | `tools/git.mjs` | 同路径 | 0.5253 · 异 | ② | 进核 | 融合：取 CLI + `isReadonlyAction` 审批门按端注入（CLI 无审批面 ＝ ④ 段） | 分叉 ＝ VSC 多只读判定（`src/tools/git.mjs:81-93`）+ 两处文案 / 截断差异（VSC `src/tools/git.mjs:104,214`）；前提（同 action 集）仍成立 | — | S1（建核补齐） |
| 60 | `tools/checklist.mjs` | 同路径 | 0.4973 · 异 | ② | 进核 | 融合：取 CLI（并发门控 + ID 预留含已归档子 ID——`src/tools/checklist.mjs:106-121`） | 分叉 ＝ VSC 内联同套逻辑但 ID 不预留归档子 ID（`src/tools/checklist.mjs:133-143`）、基线判 mtime+size；前提（同职责）仍成立 | — | S1（建核补齐） |
| 61 | `tools/linter.mjs` | 同路径 | 0.4872 · 异 | ② | 进核 | 融合：取 CLI + 可中断执行按端注入（VSC `runInterruptible` ＝ ④ 段） | 分叉 ＝ 执行方式（CLI `execFileSync` `src/tools/linter.mjs:48,64` / VSC `runInterruptible` `src/tools/linter.mjs:53,64-66`）；检查器映射与文案逐字同 | — | S1（建核补齐） |
| 62 | `tools/ops.mjs` | 同路径 | 0.2851 · 异 | ② | 进核 | 融合：`wait_for` 并回单档（VSC 拆到 `wait_for.mjs`——`src/tools/ops.mjs:11-112` / `src/tools/wait_for.mjs:150-190`） | 分叉 ＝ 文件切分（能力不缺——条件字面与限额逐字同）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 63 | `tools/shared.mjs` | 同路径 | 0.2829 · 异 | ② | 进核（`core/tools/shared.mjs`） | 融合：取并集 + VS Code 侧基建（编辑器编辑 / `runInterruptible`）按端注入（④ 段） | 分叉 ＝ 两端各带本端基建（CLI EOL / glob 再导出；VSC 编辑器编辑面 `src/tools/shared.mjs:66-106`）+ cwd 归一差异；前提（同职责）仍成立 | — | S1（建核补齐） |
| 64 | `tools/question.mjs` | 同路径 | 0.1667 · 异 | ② | 进核 | 融合：取 CLI 上限校验 + 无 UI 降级径按端注入（VSC QuickPick / InputBox `src/tools/question.mjs:36-53` ＝ ④ 段） | 分叉 ＝ 无 UI 时形态（CLI 抛错 `src/tools/question.mjs:20`；VSC 降级原生 UI）；上限 100 字符 / 4 选项两端同（2026-09-06 裁定） | — | S1（建核补齐） |
| 65 | `tools/search.mjs` | 同路径 | 0.1455 · 异 | ③ | 进核 | 以 CLI 为准（grep 上下文 + `ls` 归位）+ VSC 的「路径不存在明确报错」并入（取并集） | 分叉 ＝ 导出面切分（CLI 含 `ls` `src/tools/search.mjs:195` / VSC 移 `more-file.mjs:318`）+ glob 指向文件与报错形态差异（CLI 静默 `(no matches)`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 66 | `tools/lsp.mjs` | 同路径 | 0.1429 · 异 | ③ | 进核 | 以 CLI 为准（JSON-RPC over stdio + `lsp.servers` 配置）+ VSC 宿主语言服务径按端注入（④ 段） | 分叉 ＝ 实现路线（CLI 自起服务器 `src/tools/lsp.mjs:97-168` / VSC 调宿主命令 `src/tools/lsp.mjs:76-112`）；前提（VSC 有宿主语言服务、CLI 无）仍成立 | **①③** | S1（建核补齐） |
| 67 | `tools/web.mjs` | 同路径 | 0.1184 · 异 | ③ | 进核 | 以 CLI 为准（RSS + `engine`/`page` + 跟随一次重定向 + 200K + `htmlToText`） | 分叉 ＝ 抓取 / 抓页实现分叉（CLI 跟随重定向 `src/tools/web.mjs:201-215`、上限 200K、正文转换；VSC 拒绝重定向 `src/tools/web.mjs:111-115`、上限 20K `:130`、朴素去标签）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |
| 68 | `tools/file.mjs` | 同路径 | 0.0850 · 异 | ③ | 进核 | 以 CLI 为准（read 体积门 + 截断、写入回执含 diff / 语法检查、`insert_after` 漂移护栏）+ 编辑器编辑径按端注入（④ 段） | 分叉 ＝ 能力面差异（VSC read 无 10MB 门与 200K 截断 `src/tools/file.mjs:34-70`；VSC 写入回执仅一句 `src/tools/file-edit.mjs:305`；VSC `insertAfterTool` 无护栏且未记 `touchedPaths` `src/tools/more-file.mjs:11-24`）；前提（VSC 有编辑器 API）成立 | **①** | S1（建核补齐） |
| 69 | `tools/edit-diff.mjs` | 同路径 | 0.0395 · 异 | ② | 进核 | 融合：取 CLI 执行体（diff 内核 + 三级匹配）+ VSC 拆分面按核内结构归位；回执形态按端注入（④ 段） | 分叉 ＝ 文件切分（VSC 把校验 / 模糊 / 行号拆到 `file-edit` / `edit-fuzzy-match` / `edit-line-params`）；阈值 0.9 与判定三档同构 | — | S1（建核补齐） |
| 70 | `tools/index.mjs` | 同路径 | 0.0215 · 异 | ② | 进核 | 融合：完整注册表（VSC 31 工具）+ CLI 侧消费方拼装面归位；`read_image` 注册门取 VSC（按模型能力） | 分叉 ＝ 注册位置（CLI 25 工具子集 + 消费方拼装 `src/cli/make-agent.mjs:64` / VSC 完整表 `src/index.mjs:50-64`）；前提（最终可达集合基本对齐）仍成立 | — | S1（建核补齐） |
| 83 | `agent-tools.mjs` | 同路径 | 0.0000 · 异 | ② | 进核 | 融合：取核内统一登记册（VSC 13 项含 `consult_start/stop` `src/agent-tools/index.mjs:15`；CLI 12 项 + consult 另挂 `src/agent/setup.mjs:173,271-275`） | 分叉 ＝ 登记位置与是否多一层转口（CLI 18 行显式列 / VSC 2 行转口）；最终暴露集合一致；前提 ＝ 无 | — | S1（建核补齐） |
| 84 | `agent-tools/batch-segment.mjs` | 同路径 | 0.7530 · 异 | ② | 进核 | 融合：取 CLI 主体 + VSC 的 `_touchedFiles` 记账按端注入（④ 段） | 分叉 ＝ VSC 把写过的批次档计入本轮变更（`src/agent-tools/batch-segment.mjs:184`）+ 评审实例绑定解析（CLI `:57-66`）；工具本体一致 | — | S1（建核补齐） |
| 85 | `agent-tools/plan.mjs` | 同路径 | 0.6579 · 异 | ③ | 进核 | 以 VSC 为准（未知 action 报错——CLI 现会误入 plan 模式 `src/agent-tools/plan.mjs:68-79`） | 分叉 ＝ 未知 action 处置（CLI 一律进入并返回 activated / VSC 报错 `:86`）；状态字段名与 `onPlanMode` 回调属结构面 | **①** | S1（建核补齐） |
| 86 | `agent-tools/timer.mjs` | 同路径 | 0.5833 · 异 | ③ | 进核 | 以 CLI 为准（`seconds` 必须为有限正数 `src/agent-tools/timer.mjs:34-37`） | 分叉 ＝ VSC 未同步该修复（`src/agent-tools/timer.mjs:34-35` 直取 `?? 180` ⇒ 非数字时 `expiresAt = NaN`、定时器永不触发且不报错）；前提（该修复只在 CLI 落地）⇒ **直接归一** | **①** | S1（建核补齐） |
| 88 | `agent-tools/skill.mjs` | 同路径 | 0.4746 · 异 | ② | 进核 | 融合：取一侧（异步 loader）+ VSC 的同步 loader 面按核内结构归一 | 分叉 ＝ loader 同步 / 异步与模块路径（CLI `../skills.mjs` / VSC `../extension/skills.mjs`）；发现规则（扁平 + `SKILL.md`、排序、项目层优先）两端同构 | — | S1（建核补齐） |
| 90 | `agent-tools/task.mjs` | 同路径 | 0.3592 · 异 | ③ | 进核 | 以 CLI 为准（空标题过滤 + done 留 3 + 总量 20 `src/agent-tools/task.mjs:66-77`） | 分叉 ＝ 过滤 / 截断规则缺失（VSC `src/agent-tools/task.mjs:60-66`）+ 回话形态（CLI 汇总串 / VSC 逐条列）；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 91 | `agent-tools/eng.mjs` | 同路径 | 0.2719 · 异 | ③ | 进核 | 以 CLI 为准（工程模式位只进会话）+ VSC 的持久化镜像 / 面板提示按端注入（④ 段） | 分叉 ＝ VSC 双写（会话槽 + `config.json` 的 `agent.engineering` `src/agent-tools/eng.mjs:92-104`）⇒ **跨端副作用**；前提（两端同开关语义）成立，写盘范围属端差 | **①②** | S1（建核补齐） |
| 92 | `agent-tools/digest-budget.mjs` | 同路径 | 0.2268 · 异 | ② | 进核 | 融合：取 CLI（记账键 = agent 对象 + 落盘 `configDir/tool-results` + 轮转清理） | 分叉 ＝ 落盘位置与清理（VSC 落 `<cwd>/.thincoder/tmp` 且无轮转 `src/agent-tools/digest-budget.mjs:53-59`）；预算口径与文案逐字同 | — | S1（建核补齐） |
| 96 | `agent-tools/verify.mjs` | 同路径 | 0.1150 · 异 | ② | 进核 | 融合：取 CLI（git `--stat` 明细 + 无变更仍走清单）+ VSC 的编辑器诊断段与可中断执行按端注入（④ 段） | 分叉 ＝ 信息面与执行方式（VSC 多编辑器诊断 `src/agent-tools/verify.mjs:250-275`、可 Stop 中断）；门禁判定与文案等价 | — | S1（建核补齐） |
| 97 | `agent-tools/goal.mjs` | 同路径 | 0.0992 · 异 | ③ | 进核 | 以 CLI 为准（`blocked` 动作 + `criteria` 强制 + depth-0 独立裁判 `src/agent-tools/goal.mjs:34-115`） | 分叉 ＝ VSC 缺 `blocked` 动作（schema enum 只有 set / complete / cancel `src/agent-tools/goal.mjs:18`）、`criteria` 可省、complete 无独立裁判；前提（同职责）仍成立 | **①③** | S1（建核补齐） |

### 2.3 语义对位遍行（原 §2.5（四）行集——工具实现面单端档）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 178 | CLI 单端工具实现 **6 档** ↔ VSC 侧对位 | ② | 融合：逐档随其**工具面**（§2.5 #52–#70）的裁决落地 | 分叉 ＝ 实现切分；**B18 反例**：单端独有档之间最高 j 仅 0.256 ⇒ 不据相似度断言，逐档按工具面归属（映射见下表） | — | S1（建核补齐） |
| 179 | VSC 单端工具实现 **12 档** ↔ CLI 侧对位 | ② | 同上（逐档映射见下表；两档归 ④ 端特有段） | 同上 | — | S1（建核补齐） |

**工具实现面单端档逐档映射（原 §2.5（四）表 · 逐字）**

| 单端档 | 对位 / 处置 |
|---|---|
| CLI `tools/bash.mjs` | ↔ VSC `tools/shell.mjs`（同一 `bash` 工具）⇒ 随 §2.5 #53 |
| CLI `tools/checklist-sync.mjs` | 核内并发写同步机（VSC 内联于 `checklist.mjs`）⇒ 随 #60 |
| CLI `tools/edit-batch.mjs` | 核内 edit 数组形态（VSC 住 `edit-line-params.mjs` / `file-edit.mjs`）⇒ 随 #69 |
| CLI `tools/glob-dialect.mjs` | 核内 glob 方言（VSC 住 `search.mjs` / `more-file.mjs`）⇒ 随 #54 / #65 |
| CLI `tools/patch.mjs` | 核内 `apply_patch` / `delete` 实现（VSC 住 `file-edit.mjs`）⇒ 随 #10 / #12（同路径 `.md`） |
| CLI `tools/repomap.mjs` | ↔ VSC `repomap.mjs`（同一 repo 大纲；VSC 头注自述「Ported from thincoder CLI src/tools/repomap.mjs」）⇒ 融合 |
| VSC `tools/checkpoint.mjs` | ↔ CLI `git/checkpoint.mjs`（行 #167） |
| VSC `tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |
| VSC `tools/context.mjs` | **④ 端特有段**（IDE 上下文 = 宿主能力；CLI 无 IDE） |
| VSC `tools/edit-fuzzy-match.mjs` · `edit-line-params.mjs` · `file-edit.mjs` · `more-file.mjs` · `hashline-edit.mjs` | 核内 edit / read / insert 实现切分 ⇒ 随 #68 / #69 |
| VSC `tools/focus.mjs` | **④ 端特有段**（驱动编辑器光标 = 宿主能力） |
| VSC `tools/read_image.mjs` | 核内 `read_image` 实现（CLI 住 `tools/file.mjs`；同路径 `read_image.md` = #26） |
| VSC `tools/shell.mjs` | ↔ CLI `tools/bash.mjs`（同首行） |
| VSC `tools/wait_for.mjs` | 核内 `wait_for`（CLI 并回 `tools/ops.mjs`）⇒ 随 #62 |

> **归属提示**：表中 `VSC `tools/checkpoint.mjs`` 与 `VSC `tools/code.mjs`` 两行的裁决分别住 `docs/design/CHECKPOINT.md` / `docs/design/MEMORY.md`（本表 = 该映射表的权威副本，两行仅作指针）。

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

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**核提示词面（S1 新建）· `core/tool-docs/*.md`** · **产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #10–#29 / #52–#70 / #83–#86 / #88 / #90–#92 / #96 / #97 / #178 / #179 / 映射表 · §2.5.1 A6 · A8–A13 · B1 / B2 · §2.12.2 第 5–7 行）；**语义零改**，行号沿用原编号。
