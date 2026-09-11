# 项目待办（Project TODO）
> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示、在途实现）汇总于此，不散落在设计文档中。
> 本文件只承载**当前待办与在途项**；已完成/已消解项已移除或勾销（git history 完整可追溯——2026-09-08 清理）。
> 状态标注约定：`open`=待办 / `在途`=已批准实现中 / `待核销`=已实现待父侧核销 / `挂起`=用户暂缓。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。
---
## 产品可移植性缺陷登记（2026-09-10 全面勘察——**只登记，待整明白后统一处理**）

> 来源：勘察报告（src/ 全量"硬编码项目约定"扫描——按任意用户项目视角判定）。需求依据 = `requirements/ENGINEERING-MODE.md` §2（FR10-FR15）+ `requirements/PROJECT.md`。
> 分级：🔴 = 静默失效（用户不可见、不可修）· 🟡 = 降级可见或噪声 · 🔵 = 无害/仅信息。
> **未动任何代码**——用户裁定：先全整明白，再改。

### 🔴 静默失效（10 项）

| # | file:line | 硬编码 | 不符约定时的静默后果 |
|---|---|---|---|
| P1 | `src/advisor/messages.mjs:253` | 文档地图 = `docs/README.md` / `docs/design/README.md` | 探不到 → 静默跳过——"文档归属"评审维度失去对照物 |
| P2 | `src/advisor/messages.mjs:236,349` | 项目方法论 = 项目根 `METHODOLOGY.md` | 不存在 → 空 catch 静默不注入，评审仍按"方法论合规"打分 |
| P3 | `src/advisor/messages.mjs:265,267,269` | 指令文本要求"Read METHODOLOGY.md" | 与 P2 独立——即使未注入也要求读不存在文件（白耗轮次/凭空判断） |
| P4 | `src/prompts/advisor-design.md:9,18,24` | `docs/README.md` + 示例 `docs/design/AGENT-LOOP.md:180` | 任意项目工程模式下被要求读不存在的文件 |
| P5 | `src/prompts/discipline-engineering.md:32,47,61` | `docs/design/<TOPIC>.md` 树形状 | 代理会在用户项目里创建 ThinCoder 形状的 docs 树 |
| P6 | `src/prompts/discipline-engineering.md:141,142,147,151,170,171` | `docs/TODO.md` / `CHANGELOG.md` / checklist 边界 | 用户项目没有这些文件也要"先入池" |
| P7 | `src/prompts/discipline-engineering.md:182` | `docs/requirements/`+`docs/design/`+**`node scripts/check-doc-width.mjs`** | **自指脚本**——该脚本只在本仓存在，用户项目跑必失败 |
| P8 | `src/memory/code-sync.mjs:112-124` | `git rev-parse --show-toplevel` 失败 → 返回 `[]` | **非 git 项目：代码/文档索引全空**（表现为"无索引源"） |
| P9 | `src/memory/schema.mjs:18,20,23-32` | 代码/文档扩展名白名单 + SKIP_DIRS + 体积上限 | 白名单外扩展名**完全不可检索**（.fs/.clj/.dart/.lua/.cs 等代码；.org/.wiki 等文档），无提示 |
| P10 | `src/agent/dispatch.mjs:199` + `src/advisor/repos.mjs:168` | `^src[\\/]` **字符串锚定** | 嵌套布局（`packages/foo/src/x.md`）被当文档 → **静默绕过设计门禁**；非 `src/` 布局则全部文件都当产品代码 |

### 🟡 降级可见 / 噪声（18 项）

| # | file:line | 内容 | 影响 |
|---|---|---|---|
| P11 | `src/prompts/discipline-normal.md:13,32,213` | `docs/README.md` 地图（:32 有降级子句） | 13/213 无降级 |
| P12 | `src/prompts/persona-engineering.md:12` | "需求+设计文档（docs/）" | 提示层假设 |
| P13 | `src/agent-tools/advisor.mjs:104-114` | documents 校验限 `docs/` 前缀或文档扩展名 | 用 `.org/.wiki/.html/.tex` 记设计的项目被硬拒 |
| P14 | `src/tui/cmd-eng.mjs:31,35-46` | 工程模式门禁要求项目根 `METHODOLOGY.md`；"从模板创建"指向**已不存在**的 `methodology-template.md` | **自相矛盾 + 活 bug**——选项必炸；与本仓"METHODOLOGY 已退役"冲突 |
| P15 | `src/agent/dispatch.mjs:204`、`src/agent-tools/eng.mjs:59` | 提示文本写死 "in docs/" | 模型可见错误提示带本仓布局 |
| P16 | `src/advisor/messages.mjs:35-57` | 项目根判据 = 存在 `AGENTS.md`（唯一） | monorepo 子项目无 AGENTS.md → P1/P2 查错目录 |
| P17 | `src/agent/helpers.mjs:321-327` | 项目指令仅读 cwd 的 AGENTS.md / project_rules.md | 缺失时返回空、**无提示**；不向上走；不认 `.cursor/rules`/`CLAUDE.md` |
| P18 | `src/advisor/repos.mjs:22-41` 等 | 以 `.git` 判仓库根/评审范围/快照 | 非 git 项目范围采集为空 |
| P19 | `src/tui/clipboard.mjs:142` → `src/tools/file.mjs:192` | 粘贴图片落盘 `<cwd>/.thincoder-paste-<ts>.png` | 未读则该文件**留在用户仓库根**（污染） |
| P20 | `src/tools/repomap.mjs:138-145` | 只解析 JS/TS + Python 的 import/export | 其他语言静默缺依赖信息 |
| P21 | `src/tools/linter.mjs:43-46,119-128` | 语言→linter 表 | 表外语言"no linter available"（可见） |
| P22 | `src/tools/linter.mjs:61,92` | 配置只看**当前 cwd**（tsconfig.json / Cargo.toml） | monorepo 子包（配置在上级）→ 静默视为无 linter |
| P23 | `src/agent-tools/subagent-scheduler.mjs:52-54` | 父侧维护文件黑名单 = basename `todo.md`/`changelog.md`/`checklist*`（任意层级） | 用户项目恰有同名文件 → eng-coder **无法声明它**（fail-closed 可见） |
| P24 | `src/agent-tools/verify.mjs:38-58` | 项目根 = 含 package.json/.git 的最近祖先 | 无锚点 → 退化为松散全局匹配 |
| P25 | `src/advisor/repos.mjs:146` vs `src/agent-tools/advisor-async.mjs:170` | 同一条"src 是不变量"**两种正则**（组件匹配 vs 锚定） | 语义分叉 |
| P26 | `src/tools/shared.mjs:20` | `IGNORED_DIRS={node_modules,.git,dist,build,.turbo,coverage}` | 源码在 `build/`/`dist/` → 搜不到（文案有声明） |
| P27 | `src/tools/tree.mjs:13` | SKIP_DIRS 另含 `bin,obj` 等 | 源码在 `bin/`（Go/脚本项目）→ 树中消失 |
| P28 | `src/memory/code-sync.mjs:61,141,345` | 任意 `.` 开头路径段一律跳过 | 源码在 `.github/scripts/` 等 → **永不入索引** |

### 🔵 无害 / 仅信息（7 项）

`cmd-init.mjs:12,24-58`（类型探测，双配置项目误判 Node）· `completion.mjs:81`+`verify.mjs:71,175,283`（措辞层）· `.thincoder/` 命名空间（产品自命名空间，非对用户项目的假设）· `~/.thincoder/` · `.mcp.json`（跨工具约定）· `verify.mjs:197-216`（JS node --check，advisory）· `helpers.mjs:264,271,286`（隐藏项有计数行）

### 一致性债务（"整明白"时要一起裁的）

1. **`src/` 判据有 4 种实现**：`^src/` 锚定 `dispatch.mjs:199`+`repos.mjs:168` vs 组件匹配 `repos.mjs:146`+`advisor-async.mjs:170` vs 根锚定 `verify.mjs:38-58` vs 注释里的 `isProductCode`（**该函数不存在**，仅注释概念——`repos.mjs:151`、`verify.mjs:184`）
2. **"项目根"有两个互不相干的定义**：AGENTS.md 版（`messages.mjs:35`）vs package.json+.git 版（`verify.mjs:38`）
3. **文档/临时文件判定**：扩展名白名单（`repos.mjs:100,116`），不参考任何项目自述
4. **已有"让项目自己说"的先例**（改造样板）：`.thincoder/advisor.md`（有默认回退的覆盖）· advisor `documents=[…]` 参数（显式声明，但按次不持久）· verify 的自然语言验证法（**明确拒绝硬编码测试命令**——证明本产品既有设计取向）

### 已核实"不受影响"（防重复勘察）

顶层 `README.md` 从不被读取 · **无任何代码执行用户项目的测试命令**（verify 明确不自跑）· 无构建/发布假设（`package.json` 仅读 ThinCoder 自身）· `test/` 目录假设零命中 · `.vscode/` 仅作端标识后缀 · `prepublishOnly` 用户侧零命中。

### 另立（勘察外，实施中发现）

- `.thincoder/index/`（`.thincoder/index/manifest.json` + vectors.bin）—— **DB 化前死产物**（mtime 2026-07-29，全仓零读写点；活体索引 = `~/.thincoder/memory.db`）→ 可删。
- `src/tui/wrapped-spawn.mjs:1` 注释指向已入档的 TUI-STDERR-CAPTURE.md（**真断链**）；另有约 12 处带 `docs/design/` 前缀注释（指现行档）——扫尾项。

## 代码正确性 / 边界小修（低优先加固）

- [ ] **`settings` 工具对「内置默认值为 null 的已知键」类型校验失效**（2026-09-11 改用户 config 时实证）：`settings set defaultModel "deepseek:deepseek-flash"` → 拒绝「expects object — got string」——而**应用侧形态 = 顶层字符串复合 `provider:model`**（铁证三处：`src/config.mjs:59` 默认 `null` · `:277` `typeof config.defaultModel === "string"` 否则置 null · `config-migrate.mjs:43` 同）。**根因**＝校验拿 `typeof 内置默认值` 比对，而 `typeof null === "object"` → ① 合法字符串被拒（本次实证——导致 `~/.thincoder/config.json` 的 `defaultModel` 无法经工具改值）② 反向：传对象会「通过」校验、应用侧再静默置 null（静默失效）。→ 修复方向：校验表对 `null` 默认值放过，或改按「已知键的实际消费形态」建表 · status=**已核销（第 8 批交付——2026-09-11 用户"修这个bug"（快车道单点全链）；批次档 `batches/2026-09-11-SETTINGS-NULL-DEFAULT.md`；设计已落档待评审——含 null 叶子键清单 4+1 · 选型候选③（显式形状表 + 完备性机械锁）· 历史失真两处已实证（CHANGELOG:42 声称的测试档从未落地））**（板块 配置面）
- [ ] **`parseValue` 两端不一致 + CHANGELOG 历史失真（第 8 批设计发现 D-S2.8 / 父侧项）**：① **D-S2.8** = CLI `settings` 的 `parseValue` **保留引号**、VSC 端返回**解析值**——同一 key 两端写入语义不同（第 8 批不裁定，本行留档待裁）；② **CHANGELOG.md:42** 记「测试 T-S1.1-11（CLI 11 + VS Code 6）」但**这些测试档从未落地**（`test/settings*.mjs` 零命中，设计档 §5 更正注 + CHANGELOG 同源失真）→ 第 8 批建档即补欠账，CHANGELOG 记账随批收口 · status=**在途（第 13 批条目 E——D-S2.8 待裁 + CHANGELOG 记账更正）**
- [ ] **agent 生命周期小项（剩 A2）**：A2 摘要触发条件（仅 ## 节标题）——注释段已修（批 1 2.5 seven actions）+ auto-think depth 归状态债 #3
## 工程模式 / 评审收敛（prompts + 机制）

- [ ] **跨会话同批档案并发写风险（2026-09-11 实况首演——两会话父侧同写批次档）**：批次 `VSC-GUARD-MIRROR` 被并行会话父侧写 §5 代笔块 + §6 收口（其池内无 spawn → 误判「实施归属不属本链」），本会话（签发会话）补 §6 对账澄清 + 消费令牌闭合。机制面缺口 = **批次档/`docs/TODO.md` 无会话级写权分片** → 处置方向：①「会话-批次单一所有者」纪律（批次档落盘时标 owner 会话；他会话只读）② 或写入面加会话戳守卫（他会话写入打标/告警）——设计 + 评审另批 · status=登记（两会话 §6 均已登记）
- [ ] **`docs/design/TUI.md` §1 地图行存量漂移（2026-09-11 第 7 批回写时 id=11 实测观察）**：pickers 500→107 · mouse 213→250 · key-modes +23 · tui-lifecycle +13 · wizard +20（非第 7 批触及行，本批不追改）——独立文档维护项（另注：`:40`/`:42` 两条地图行现 330/329 字符 = 表格行，第 13 批条目 C 落地后纳入豁免）· status=登记
- [ ] **第 13 批收口遗留（2026-09-11——§6 登记）**：① **T75/T76 无测试宿主**（设计写域清单缺口——后续批补宿主，或人工核验结论入档）② `test/settings.test.mjs` 480/500（+46 vs 预计——**增厚先拆**）③ AC54 注行号指针 +1 漂移（`docs/design/ENGINEERING-MODE.md`——随下次该档设计轮）④ 存量非表格超宽 13 条（8 档批记录 §3/§5/§6 长行——批 13 条目 C 后口径「非表格照报」）→ 维护项 · status=登记




- [ ] **VSC 两处未纳登记（第 12 批 designer 披露——可一句话翻转）**：① F12 启动断言面（VSC 设计评审链路恒签发 token ⇒ 正常链不可达）② 冻结窗口 E 的 VSC dispatch 预闸面——均已登记于 VSC 设计档 §13.10；本批未实现 · status=登记


- [ ] **F16 同步面残留（2026-09-11 第 11 批 coder ⑤-1——父侧裁定转后续）**：`src/agent/record-results.mjs:114` 的 **sync 记账**无「未完成尾」判定 ⇒ 以截断尾收尾的 sync 代码评审（depth 0 + `async:false`）仍计「已覆盖」（guard 不重推）；本批实现与设计一致（§14.3 消费点 2 仅限 `settleAdvisorRun`），与**需求 F16 行文字面**有差。→ 两条路：① 改需求 F16 措辞（收窄到 async 面）② 扩展实现（record-results.mjs 消费同谓词——需设计 + 评审，独立批次）· status=**在途（第 13 批条目 A——用户 10:50 已裁「扩展实现」）**


- [ ] **VSC 写面 `agent.subagentModels` 零约束残留（第 8 批交付 ⑤-1——coder 提出，父侧裁定转后续）**：AC-S2.7 枚举 = 本端 2 键（`agent.subagentModel`/`agent.compactThreshold`）+ 跨端 3 键，**不含**同族键；VSC `_SIBLING_SHAPES` 补第 4 条 = 设计变更（需设计 + 评审）→ 与「VSC 评审链守卫镜像批」同族，**可并批** · status=**已核销（第 12 批交付 2026-09-11——`_SIBLING_SHAPES` 第 4 条 + roleMap 分支落地；T-S2.36/T-S2.37 绿；批次档 `2026-09-11-VSC-GUARD-MIRROR.md` §6）**


- [ ] **跨仓 `.md §N` 引用在 V1 恒判 unknown-doc（2026-09-11 第 10 批 §3:141 实证）**：V1 按 **basename 在本仓扫描域**（`docs/design+requirements+batches`）解析——`WEBVIEW.md §5`（VSC 仓档）→ `unknown-doc`，且**加仓前缀也无效**（basename 仍为 `WEBVIEW.md`）；基线 unknown-doc 存量 = **0**（无先例 → 新增即阻断）。**即时处置**：批内跨仓引用避免 `X.md §N` 形态（去 `.md` 后缀写「WEBVIEW（VSC 仓）§5」）。机制候选：① V1 支持 `仓前缀/docs/...` 跨仓解析（需定义他仓扫描根）② 或把形态规范写进 README 归属规则/D4 · status=**在途（第 13 批条目 B）**
- [ ] **评审发现表宽度 vs 表格结构（第 13 批条目 C——宽度规则豁免表格行）**：单行 >300 与 markdown 表格行不可折行结构性冲突（多批 §3 发现表超宽；as-of 2026-09-11 实测全仓 37 命中 = 表格行 24 + 非表格 13）。第 13 批裁定 = 双层豁免（规范 `docs/README.md` §3.7 + 检查器 `isTableRow` 跳过）· status=**在途（第 13 批条目 C——设计落档（§2.26.2）待评审）**


- [ ] **`thincoder-vscode` 评审链守卫镜像（第 11 批 VSC 对位面——designer 裁定 CLI 单端，父侧接受·可翻转）**：VSC 三处同构——`citations.mjs`（CLI 逐字副本）· `messages.mjs:62` · `run.mjs:58/166/170`；父侧接受 CLI 先行的理由 = 本批已在评审容量边界（含条目 D 本身）+ 双端独立实现纪律（CLI = 语义权威先落定）；**用户若要同批 → 一句话翻转**（成本 = 折进设计 + 重走一轮评审）· status=**已核销（第 12 批交付 2026-09-11——三处同构 + run.mjs 拆分落地；AC-VG1–AC-VG8 全过 8/8；批次档 §6）**
- [ ] **`src/advisor/messages.mjs`（413 行 >300 advisory——路径与行数 as-of 2026-09-11 修正：原记「 `src/agent-tools/messages.mjs` / 402 行」笔误）拆分债**：第 11 批设计 §14.10#4 登记；第 13 批裁定**不拆 + 拆分计划登记**（设计 §2.26.3）· status=**在途（第 13 批条目 D）**

- [ ] **评审实例作废窗口 = 到 digest 验证为止（2026-09-11 第 10 批 id=20 实证——父侧自重失误）**：评审**进程 done 后、digest 落定前**，父侧对**被审文档（含批次档 §1 本身）**的任何改动 → 宿主判「评审目标已变更——token 未签发（judged a stale state）」→ **整轮实例作废**。本次无 token 损失（该轮本就 changes-required + findings 已落 §3）；**若发生在 pass 轮 = token 直接丢失**。即时纪律（父侧已生效）：**点火后到 digest 落定前，被审文件集（含批次档记录）一律冻结、父侧零写入**——D5 冻结窗口的下界须写进机制面（现文只说「评审在途不改被审文档」，未定义「在途」的终点）· status=**已核销（第 11 批条目 E 交付——§14.14 + E-6 登记；10:53 用户验收）**——**实况首演 2026-09-11 11:23**：第 12 批评审在途期间（11:22 点火），第 13 批 designer（子代理）写入 `requirements/SETTINGS-TOOL.md`（11:23:06）→ 实例陈旧、父侧取消重发（**预闸不可达面被实锤**——登记缺口真实存在于预闸之外）


- [ ] **`test/prompts-async-guidance.test.mjs`（CLI）562 行 >500 硬限——拆分项（2026-09-11 第 9 批 coder 提出）**：批前即 512–513（存量 >500，第 9 批设计 §13.6/§370 明示不属本批范围且评审收口「无新增跨档」）；本批 +50 → 562。**建议独立拆分批次**（测试档拆分需设计/token）· status=**在途（第 13 批条目 D）**

- [ ] **设计评审 600s 超时、零输出（2026-09-11 第 10 批首轮实证）**：`advisor type=design` 报「review timeout after 600s. Partial results may be available. Try again with a narrower scope.」——**无发现表、无 verdict、无 token、无部分结果可回收**（评审成本白耗 + 链停摆）。归因（待设计）：范围过大（6 档 ~1000 行）/ 无 checkpoint 落盘 / 无超时降级路径；父侧已重发（收窄 4 档 + 时间预算纪律「先出 verdict 再补给核查」）· status=**已核销（第 11 批条目 D——硬墙/预算提示/结构化尾已交付）**

- [ ] **宿主 cite 校验对「无仓前缀路径」误报（2026-09-11 父侧两处实证——第 11 批条目 C）**：`[host-verified]` 把评审引文判 `file unreadable` 两例——第 8 批轮次 2 的 `TOOLS.md:124`（**父侧实文核验：存在且正确**）· 第 7 批轮次 2 的 `AGENT-LOOP.md:714`（同类）；评审对象声明的路径均带仓前缀（`thincoder/...`），评审员引文多为裸相对路径 → 疑校验器**未按仓前缀补全候选**（工作区含两仓）→ 修复方向：解析候选补全（按声明前缀 / 双仓试解）+ 误报-漏报取舍 · status=**已核销（第 11 批条目 C——候选链解析已交付）**

- [ ] **设计评审 context 溢出（2026-09-11 第 8 批轮次 2 实证）**：`advisor type=design` 在**四文档 + 大量 file:line 核验**的评审中自报「context window limit reached (123099 tokens) — Review incomplete — too many tool calls. Try a narrower scope.」——**但宿主仍以 Approved 收尾并签发 token**（评审结论与凭证的可靠界：溢出发生在补充检查阶段，核心条目已核完）。观察：① 该批评审对象 = 4 档 ~770 行 + 逐 cite 抽查 — 体量接近评审窗口上限；② **溢出仍发 token** 的口径需要在机制面明确（是否应改为「溢出即 changes-required/需重跑」）；③ 父侧已代跑未完成补充检查（宽度/行数/cite 六处）补齐 —— 建议：机制面加「评审自报 incomplete 时 token 应缓发或标注」的守卫（由机制链裁）· status=**已核销（第 11 批条目 A——判定族 + 三消费点已交付）**

- [ ] **设计评审 approval-signal 未注入（2026-09-11 第 7 批评审实证）**：`advisor type=design` 返回 **VERDICT: pass** 但评审请求内 **`## Approval Signal` 段未随附**——token/designId 均为**未填占位符**（评审员原话：「本次请求中 `## Approval Signal` 段未随附…无法逐字回显」）→ **token 链断裂**（eng-coder 无凭证可 spawn）。同日三次设计评审均正常返回 token（第 3/6 批）→ 属偶发/宿主侧注入路径问题。**处置**：① 第 7 批 = 修正轮落地后**重发一轮评审**取 token（轮次 2 顺带复核 8 条裁决落地）；② 机制面建议排查启动器的 approval-signal 注入路径（信号串为空时是否有守卫）· status=**已核销（第 11 批条目 B——构建自愈 + 启动断言已交付）**

- [ ] **「评审后修正轮 ⇄ 用户批准」时序未定义 + `Fixed` 语义漂移**（2026-09-11 用户实况发现——第 6 批：修正轮在途时就请了批准）：**① 链路缺节点**——`docs/design/prompts/persona-engineering.md:18-19` 的链是「核验产出 → 提醒用户发起评审 → **用户批准** → spawn coder」，**无「评审后修正轮」**；锚#3（`src/prompts/discipline-engineering.md:135-138`——**只在 `src/`；中文权威镜像无「交付链收口」节**，存量双源不对称；父侧最初引镜像档路径 = 已勘误）只规定修正轮 docs FIRST（早于 coder），**未定它与批准的先后**，也未定「修正轮可改什么而不需重新批准」→ 父侧只能临场判断。**② `Fixed` 语义漂移**——评审节定义 = `Fixed`（*you edited the code*：**已改完**），实况被当「已派工/在途」填写（第 3 批 13 条 + 第 6 批 8 条均如此）。**建议规则**：链上补「修正轮**落地并核验** → 才请批准」（或允许并行但批准请求**必须显式声明**「修正轮挂起中 + 逐条内容 + 不含新语义/新范围」）；`Fixed` 要么钉死「已落地」语义、要么补 `Dispatched` 态。归属 = 提示词双源（`src/prompts/` 运行时落地 + `docs/design/prompts/` 内容权威）× 双端 → status=**已核销（第 9 批交付——2026-09-11 用户"可以改了"（快车道）；批次档 `batches/2026-09-11-PROMPT-REVIEW-ORDER.md`；**10:53 用户验收——已核销**）：改动面 = 提示词 12（CLI/VSC × 双源×3 档）+ 测试 4 + VSC 设计档 1；`Fixed` 选型 = 保「已落地」+ 新增 `Dispatched`；时序 = **严格序**（无并行条款）**
- [ ] **第 9 批后续登记面（设计 §13.9——父侧定时点）**：① `docs/design/ENGINEERING-MODE.md` §2.2/§2.5/§2.6/§2.9 新时序规则登记面 + §2.22.2 A12 字面登记（**他链在途文件——本批不碰**，待该链窗口关闭后随批）② 双源不对称（「交付链收口」节只在 `src/`）是否补镜像——存量问题，留档待裁 · status=**在途（第 13 批条目 F——窗口未关（批 8 未收口：§5/§6 空）：登记面已打回父侧；批 8 收口后随批）**
- [ ] **§18.8/§18.10 复核（AC-OA4）**：after 样本 = T（2026-09-04 05:06）后首次干净外部评审——信号密度 ≤0.70×1.86=1.30 达成——未达呈报（观察，等样本）
- [ ] **修正轮纠结密度观察**：修正轮密度 2.20/1K > 基线 1.86——AC-OA4 可能低估受益面——等样本
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度——低优先
- [ ] **setup.mjs 受限变体 schema 补 cancel 词**（描述层同步）
- [ ] **eng-designer 角色 / 行为纪律批的 VSC 镜像**（设计档：只改了 CLI——`thincoder` 仓）——**VSC 端无**版型门禁/batchDoc 门/新角色；需镜像时同步 `thincoder-vscode`
- [ ] **CLI 侧自用首验（batchDoc 门 + 新角色）**：本会话宿主 = VSC，传 `batchDoc` **不等于门禁生效**（VSC 无此门、未知参数被忽略）——需在 CLI 会话内跑一次真 spawn 验证第 1 批门禁
- [ ] **engineering-sub.md L1 "~15s" 数字漂移**（实测 18.5-19.7s）——随下个提示词批修

## VS Code 镜像/评审面差异
- [ ] **提示词「内容权」口径三条裁定互相抵牾（第 9 批评审范围外注记——父侧收口去向待定）**：`requirements/PROMPT-SYSTEM.md` §2.7 #13（「不走 eng-coder 实现链／文本迁移=架构师直接做」）vs `requirements/ENGINEERING-MODE.md` §1.5 #8（「落笔仍走正常链（设计评审 → 用户批准 → eng-coder）」，`:126-128`）与 #10（「提示词 = 主 agent 内容权 + eng-coder 落笔」，`:130`）——三条同源裁定两说。第 9 批按 #8/#10 处置（D-RO8：designer 逐字定稿 + coder 机械落笔，`ENGINEERING-MODE.md` 两档在途不碰）→ 建议父侧择机收口 §2.7 #13 文本或登记例外 · status=登记待裁
- [ ] **🔵 五项不修登记（父侧知悉）**：VS sync design 轮次不递增 / VS guard cap 读全局轮 / CLI guard 文案无 async 补注 / VS depth-undefined 缺省 async / CLI T-24b1 墙钟断言（已知不修，留档）

## 异步 / 挂起 / 调度残留（AGENT-LOOP 后续轮）
- [ ] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（回合 abort 无条件清池连坐杀后台）——首按=interrupt 不清池 + 3s 二按=清池
- [ ] **混合边环形等待残留**（dependsOn 边 + 文件域边混合链）——建议 §21.2 候选（停滞检测）
- [ ] **§21 普通模式偏差审计 + §18.8.1 会话上下文轮**（**2026-09-08 用户裁恢复**——评审该审计项要不要做——走设计链/勘察评估——等 §11.3/批 5/6 交付后排）

- [ ] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随——A 已落地，B 待工具集真变再动）
## 需求池 / 在途实现（状态随批推进更新）
- [ ] **批次档 = 任务书**（2026-09-10 用户裁定）→ 需求 `ENGINEERING-MODE.md` §1.12 · 任务书 `batches/2026-09-10-ENGINEERING-MODE.md` §2（**未派工**）· status=待设计
- [ ] **FR16-FR19 新机制落地**（2026-09-10 用户裁定——需求已立）→ 需求 `ENGINEERING-MODE.md` §1.3（FR16 批次记录 / FR17 交界面契约 / FR18 需求池指针台账 / FR19 设计要求）· 任务书（未派工）· status=待设计
- [ ] **文档自审四处混乱**（2026-09-10 主 agent 自审发现）→ 需求 `ENGINEERING-MODE.md` §1.6（适用范围：文档维护也走流程）· 任务书（未派工）· status=登记
- [ ] **需求池条目格式收拢**（2026-09-10 §1.13 规则定立）→ 既有条目多为多行细节（如本组前项），需按**指针格式**收拢 → 需求 `ENGINEERING-MODE.md` §1.13 · 任务书（未派工）· status=登记
- [x] **批次档段写入工具（C）**（2026-09-10 用户裁定）→ 需求 `ENGINEERING-MODE.md` §1.16/FR22 · 批次档 `batches/2026-09-10-BATCH-SEGMENT-TOOL.md`——**已交付核销（2026-09-10）**：
  设计 5 轮评审 PASS + advisory 全修 · eng-coder 交付（26 文件，内层审计 1 轮 + advisor 评审 2 轮 pass，终态 clean）· 父侧 L2 **324/324 全绿** · AC29–AC36/T43–T53 全绿。

- [x] **VSC 端镜像（FR23——第 5 批）**（2026-09-10 用户裁定）→ 需求 `ENGINEERING-MODE.md` §1.17/FR23 · 批次档 `batches/2026-09-10-VSC-MIRROR.md`——**已交付核销（2026-09-11）**：
  设计 4 轮评审 PASS + PASS 后 advisory 两轮全修 · **两面并行 eng-coder**（面① 代码面 26 文件 / 面② 提示词双源 26 文件，双终态 clean）· 父侧合流 L2：**VSC 353/352 + CLI 341/330 全绿** · AC37–AC44/T54–T66 全绿 · 档位 async 499≤499；**待用户终局自验**（重载扩展后 spawn eng-designer）交付核销（2026-09-11）**：

> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。

- [ ] **文档目录结构重组**（2026-09-10 用户裁定——设计已批准）——实施档 `docs/design/DOC-REORG.md`。
  **已全部完成**（文档面 + 批尾 T1-T5：35 档入 `_archive/`、`requirements/` 34 档、地图唯一 `docs/README.md`、
  advisor 注入改指+fallback、测试解耦 2 红归零、L2 **280/280 全绿**；批档入档冻结）。
  后续项：VSC 仓镜像、T6 扫描域（待裁）、注释扫尾——见下两条与技术分组
- [ ] **check-doc-width 扫描域缺口**（2026-09-10 DOC-REORG 实施发现）——`scripts/check-doc-width.mjs` 默认域 = `docs/design/`，不覆盖 `docs/requirements/` / `docs/README.md` / `docs/TODO.md`——宽度纪律对新目录无机械约束。DOC-REORG §10.3 提议新增批尾项 T6（域改 `docs`）。**待用户裁**。

- [ ] **评审注入路径硬编码项目约定**（2026-09-10 用户裁定——**待设计**）——`src/advisor/messages.mjs:245-254` 硬编码文档地图路径；<br>  `:236/:349` 硬编码项目根 `METHODOLOGY.md`。用户项目布局不同即**静默跳过** → 评审维度无声消失（不可见）。<br>  方向：配置项 / AGENTS.md 项目自述 / 保留探测作 fallback。**归属 = `docs/requirements/ADVISOR-CONVERGENCE.md` §5.1**。

- [ ] **既有文档超宽行清理**（2026-09-10 DOC-REORG 实施发现——非本批引入）——`node scripts/check-doc-width.mjs` 报 4 文件 / 9 行：`AGENT-LOOP.md`×3、`SESSION.md`×3、`SUBAGENT-ID-COUNTER-AGENT.md`×1、`TUI.md`×2。
- [ ] **提示词公共层扩容**（2026-09-10 用户裁定——需求已收口，**待设计**）——common.md 由 4 节扩至 10 节（+证据纪律/停下上报/任务边界/交付报告格式/工具观+路由表/系统接口语义框架）；C1/C2/C4/C5/C6/C7 上移、C3 不上移、C8 落人格层。**归属档 = `docs/design/requirements/PROMPT-SYSTEM.md` §2.5 + §4**。
- [ ] **工程模式可移植性 FR10-FR15**（2026-09-10 用户裁定——**待设计**）——工程模式是**产品功能**（面向任意项目）：
  FR10 不得假定项目约定（缺失需降级可见）/ FR11 开启前提不得依赖已退役的 METHODOLOGY.md（现为活 bug——门禁+模板缺失）/
  FR12 代码文档判据不得写死 `^src/`（嵌套布局静默绕过门禁）/ FR13 纪律层不得把本仓形状强加用户项目（含自指脚本 check-doc-width）/
  FR14 推进档位 auto-manual 入需求 / FR15 非 git 项目行为定义。**归属 = `docs/requirements/ENGINEERING-MODE.md` §2**。
  **验证方向**：非 Node、非 `src/`、无 `docs/` 树、非 git 的项目跑全流程——不得静默失效、不得被不存在文件卡住。
- [ ] **工程模式角色重定义**（2026-09-10 用户裁定——需求已收口，**待设计**）——主agent=产品经理（需求文档+全流程编排/确认/核验）/ eng-designer=设计（从需求到设计，唯一写稿人，自己做勘察，无 designToken）/ eng-coder=实现；核心定位「设计 = 对需求的检验」（需求不过 advisor 评审）。**归属档 = `docs/requirements/ENGINEERING-MODE.md` §1.2 FR9 + §1.5 裁定清单**（提示词实现面见 requirements/PROMPT-SYSTEM.md §8）。

> 2026-09-08 批实况（17:07 终态）：**批 1/批 2/批 3** 全交付核销（L2 双端 112/105 全绿——批 3 文档
> 指针同步：CHECKPOINT/STRUCTURE-DEBT system.mjs 改指 bash.mjs/search.mjs——父侧收尾）；**env-state
> 扩展**（SESSION §11.2）已交付核销（bba68df/0bf02b0 + VSC 7e7d90a/ec1e4c4——slot+resumed 按会话
> +F3+双信号——L2 绿——consume 554b6251——**双端 system.md:24 env-state 描述未含 slot——需同步**）；
> **§7.7 顶层异步**已交付核销（c08e1b2/8763ac2——L2 绿——consume a2b10815）；agent 生命周期 + 11.7 + D6
> union 早前核销。批 4 剩 env-state/R19（未排）——designer 2026-09-09 用户裁取消（eng 主会话即 designer）。
- [ ] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌——技术待办非需求点
- [x] ~~**模型清单 provider 化 + 去候选否决权**~~（2026-09-10 用户裁定；原登记 = "models[] 候选白名单越权否决模型可用性 /
  MODEL_SPECS 职能纠偏"——范围升格为"清单权威交还 provider 运行期拉取 + `providers[].models[]` 整字段删除"）——
  **2026-09-11 核销**（用户 02:24"第三批验收通过"）：设计评审 2 轮 pass（0🔴）+ 用户批准 2 次（主体 + 范围追加）；
  双端实现全部提交（`4e59a76` / `9299661` / `cd1de8f`；主实现被第 5 批提交卷走——已记账）；L2 实跑 CLI 331 pass · VSC 358 pass · 0 fail；
  见 `batches/2026-09-10-MODEL-SELECTION.md` §6
- [ ] **子块「已省略 N 行」计数虚高**（2026-09-10 用户报告原话："cli subagent 调 explore 时行数计数不对——应该不是行数，而是 chunk 数"）——**已实证**（主 agent 两轮实验）：`src/tui/subagent-children.mjs:28-50` `dropCarrierLines` 把省略标记（meta 块）当普通块走 FIFO 丢弃 → 丢完再 `unshift` 重建标记（`:48`，`_lineCount += 1`）→ ① 每轮 trim 有 1 单位预算耗在标记自身上（树恒超限 1 → 后续每次追加都触发 trim）；② 每轮给 `dropped` 记 1 行**无对应隐藏内容**的幽灵行 —— 稳态下显示值 ≈ 真实隐藏行 ×2（实测：稳态追加 50 行 → 显示 +100 / 真实 +50；混合场景 显示 139 vs 真实 79）。另 `countBlockLines`（`:17`）按 `split("\n")` 计数，行尾 `\n` 令每块多算 1 元素。→ 板块 TUI · status=**已核销（第 7 批 N6 计数三缺陷修复交付——条件消解，用户裁："1 做了 2 就没意义了"）**——并入第 7 批：设计若**仍保留**子块省略标记（嵌套 explore 折叠 tail 里仍显示「已省略 N 行」）→ **计数真值必须一并修**；若 #1 使该标记不再出现 → 本项**随 #1 消解**（设计档声明即关闭）
- [x] ~~**DeepSeek V4.1-Flash 接入（两端 MODEL_SPECS + 预设）**~~——**2026-09-11 核销**（用户 03:10"批6验收"）：
  设计评审 pass（0🔴；8 条裁决 = 7 Fixed / 1 Deferred）+ 用户批准（严格序）；双端实现提交 `c22b3ea` / `3e771ee`；
  实跑：CLI 新档 5/5 · VSC 361/360 pass 0 fail · AC-11..AC-17 逐条过（CLI 唯一 fail = 他批 POOL-LEDGER 文档违规，非本批）；
  见 `batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §6
- [ ] **子代理内 spawn explore 的显示与其它工具不一致**（2026-09-11 用户报告 + 澄清原话："我是指在**子代理中 eng-coder 中再调用 explore** 的时候，不是主 agent 调用的时候"）→ **已核现状**（同一 `subagent-panel.mjs`，两条路径）：
  ① **嵌套 explore**（§27 R23 子块）= 头行 `❯ explore#1 · <model> · 12s`（`:50-63`：dim `❯` + 亮 `role#N` + dim `model/elapsed`；**无任务/args 摘要**）+ 折叠 tail 2 / 展开全量窗口（`:66-88`，`│ ` 前缀 dim 行）+ 孙块递归（每层独立折叠键）；
  ② **eng-coder 自身的工具调用** = 只作为**父块** tail 3 的 `│ ` dim 行（`:195-198` `foldTailLines(sub.blocks)`）——**无独立头行**。
  差异候选（**用户已钉口径 = C**——2026-09-11 03:05）：(A) 嵌套头行缺 args/任务摘要（普通工具行带 args）；(B) 结构不同——spawn 生成「小节」（头行 + 独立折叠体 + 递归），工具只是一行；
  **(C) 选定**：折叠态下嵌套 explore 的进展被收进子块（父 tail 只露 2 行，`:66-88`）——**要求：嵌套 explore 的活动行直接进父块 tail**（与其他工具的 tail 行同款；「与小节并存 / 取代小节」由设计裁）。A/B 未采纳（头行摘要与「去小节」不在范围内） · 板块 TUI · status=**在途（第 7 批——2026-09-11 用户"开工"；批次档 `batches/2026-09-11-SUBAGENT-TAIL.md`；设计落档中）**

## 其他在途/待核销（勾销即移出本节）

- [ ] **deepseek-v4-pro 视觉能力复检 + 发布注记**（第 6 批评审 #1/#7 的父侧协调项）：**复检触发** = ① **2026-09-14 12:00 路由生效后**（该名由 V4.1-Flash 服务——视觉可用，「预支视觉 = 硬失败」的防 400 理由届时消失）② V4.1 Pro 到货；**动作** = 复核该行 `multimodal` 是否翻转（含双端非视觉锚测试换锚：`read-image-guide.test.mjs:20` / `image-downgrade.test.mjs:24/59/109`）。**发布注记** = 发布流程时 CHANGELOG 记一行「退役名 `deepseek-v4-flash` 起允许图像输入」（用户可见行为变化）
- [ ] **`src/tools/read_image.md:8` 描述漂移（第 6 批达成 vision 后）**：仍写「Pure text models (**DeepSeek V4**, GLM-5) will receive an error」——`deepseek-flash` / `deepseek-v4-flash` 自本批起支持读图（R11/R12），**描述与实现矛盾**（且工具描述是发给模型看的面）；设计 §19.7 裁「无新文案」故本批未改 → 建议随下批工具描述更新，或单点快修 · status=登记

- [ ] **快层慢门 flake：`test/eng-designer-role.test.mjs:83` 未标 `slow`**（2026-09-10 实测 818.5ms 撞 D-T6 拦截——负载相关偶发，此前多次全绿）——修复口径框架已给出（`test(` → `slow(`，归册不是删除）；随第 5 批实现 eng-coder 顺手带（或单独快修）
- [ ] **第 4 批（C 工具）遗留三项**（2026-09-10 eng-coder 交付报告建议）：
  ① VSC 端镜像（本批工具 + 第 2 批六段机制同搬）②需求档 4 项同步（§1.12 段表「写入手段」列 / §1.11 B9 / §1.16 F1 口径 / §1.16 N2 措辞——**eng-designer 写域**，本会话不可 spawn）③`test/batch-segment.test.mjs` 321 行是否拆分（咨询项）。另：设计 §2.16 过渡期注清理（`ENGINEERING-MODE.md:458`）。
- [ ] **VSC live 块显示不可靠（2026-09-09 用户反馈——"实际启动了但不能可靠显示 live 块"）——根因已定位**
  （explore#1 勘察 2026-09-09 + 用户观察补强 21:07）：**用户实测模式 = 普遍时有时无**——第一次 advisor 没出现
  + explore（subagent 角色）也没出现 + 后来 advisor 又出现——**非 advisor-only——三重脆弱广化根因**：
  🔴① **出生靠窗口**——started 落在 webview 未就绪/加载窗口即静默丢弃（postMessage 可选链无队列——
  panel-callbacks.mjs:81/113）——无兜底则块永不显示；🔴② **快照兜底不全**——postPoolSnapshot 门控只认
  _asyncSubagents Map（panel-callbacks.mjs:165——run-stages.mjs:279 池空摘 undefined——advisor-only 会话
  空转）+ 快照只重放 running（L187）——explore/评审跑完 settle 出池后 reload/clearMessages 抹块则永不重建；
  🔴③ **终态对 never-born 块 no-op**——applySubagentStatus settled/done 分支只遍历已存在块（activity.js
  L179-201/L240-248）——advisor/family 无 consult 快照建块防御（L234-239）——块缺失一旦发生即永久；🟡④
  clearMessages（boot/loadSession 必经——chat.js:180-189）池仍活时抹全部 live 块——重建依赖后续快照
  ——修复指向：门控双池任一放行 + 快照扩 settled-in-pending（未 digest 重建驻留块）+ never-born 终态建块
  防御（consult 模式扩 advisor/family）+（根治选项）出生消息队列/webview 就绪补发——测试补 advisor-only +
  explore-only + settle-after-reload 快照用例（现 fixture 恒双 Map running——盲区）——status=根因已定位待
  设计——修复方向（修补 vs 出生队列根治）待用户裁
  ——**用户观察补强（21:30）**：**间歇性非恒定**——丢集中在 20:52（round2 评审）+21:01（explore）——21:06
  （round3）起连续正常（round3/阶段A explore/eng-coder 批1/REMOVE 评审全出现）——时段性窗口/竞态模型：
  20:30 进程重启后**头一两个 async 任务落在面板/webview 重建窗口——started 丢——面板稳定后恢复**——
  "重启后首任务丢"假设待受控复现验证（重启扩展→立即发起 async 任务看块 vs 稳定后发起）——
  **REMOVE-POOL-SNAPSHOT 撤除批先行（评审中）**——撤后观察：若窗口现象仍在→出生投递窗口问题坐实（快照非因）
  ——若撤后恢复→快照机制意外干扰
  ——**撤除后实证（22:32）**：REMOVE-POOL-SNAPSHOT 已交付（撤了快照重推）——问题依旧——**坐实快照非因**——
  新精确复现：**同响应双 spawn 两个 eng-coder——状态行 2 running（扩展侧 pool 计数对）——live block 只渲染
  1 个**——出生/显示链并发竞态（两个 started 紧邻——webview 渲染端只建一块——可能丢消息/互踩）——
  与 reload 无关（正常会话内）——真因定位新方向 = webview 渲染端并发消息处理——非扩展侧（扩展侧计数正确）
- [ ] **advisor 池状态不可查询 + 不可取消（2026-09-09 用户反馈——平台机制缺陷——已实证三次）**：
  ① subagent status 只查 subagent 池——advisor 池（_asyncAdvisors）无状态通道——评审是否在跑/卡住/完成不可知
  ——digest 是唯一信号（死等）② wait_for "advisor settled" 误报（0ms 即过但池仍拒重发——口径与实际池状态脱钩）
  ③ advisor 无 cancel 通道（同 scope 重发被拒"settle 后逐个发起"——对象漂移时旧评审杀不掉）
  ——修：advisor 池状态可见（status 支持 advisor 查询/子代理面板展示评审 live 块——与 live 块问题可能同源）+
  wait_for settled 口径修正 + cancel 通道（同 subagent cancel）——status=登记——owner = 平台（AGENT-LOOP/工具面）
- [ ] **子代理 abort 无来源标注——死亡不可诊断（2026-09-09 用户反馈——平台可观测性缺陷——已实证两次）**：
  ① eng-coder #1/#4（CLI 端 engineering.md 重排——同 designId 60ff4e55）两次 abort 仅报 "The operation was
  aborted due to timeout"——**无错误栈/无来源层标注**——不知死于 provider fetch（09-02 已拆 TTFB+idle——墙钟
  600s 已废）/body idle/工具超时/平台层——无法诊断 ② 时长巧合 ~600s 但墙钟语义已废除——推断不可靠
  ——需修：子代理 abort/失败携带来源标注（哪层 timeout + 已等待时长 + 最后一次 LLM 调用/工具活动）——
  错误消息含可诊断字段——status=登记——owner = 平台（子代理/错误通道——与 advisor 池盲区/live 块同属可观测性族）
  ——#4 重发若再死凭完整错误钉死
  ——**证据补强（22:18）**：core.mjs L70-71/L430 注释自述「600s 绝对墙钟曾腰斩长上下文子代理（eng-coder
  TTFB>10min 即死）——2026-09-01 根因修复」——现 ~600s 死 = **09-01 已修 bug 复发/残留路径**——直连
- [ ] **subagent status touched 显示不准（2026-09-09 用户实证——可观测性缺陷）**：eng-coder #1 已写完
  engineering.md 正在跑内部 advisor code review（observe 实证 currentTool=advisor）——但 status 显示
  touched "—（尚无改动）"——滞后/失真——UI（live 块）显示比 status 准——修：status touched 从真实写
  入记录实时取（与 observe/UI 同源——不滞后）——status=登记——owner = 平台（subagent status 通道——与
  advisor 池盲区/子代理 abort 无标注同属可观测性族）
- [ ] **advisor 评审状态查询假空（2026-09-10 用户判定平台 bug——池实有跑者查询返空）**：01:57 发起的三
  施工档设计评审（advisor 后台），02:29 用户问进度 → subagent status 查询返回 running/queued/done 全空
  ——但评审实际在池中运行（digest 未到，无法判死活）——查询工具与 advisor 池真实状态脱节。与既有
  「advisor 池盲区（不可查/不可取消）」同族——修：status 聚合纳入 advisor 池真实条目（含 running 评审
  的 scope/耗时）——owner = 平台（可观测性族）
- [ ] **子代理 id 复用（2026-09-09 用户观察——平台 bug——§27.1 F4 修复洞）**：设计应跨 runAgent/
  resume 单调递增（subagent.mjs L293-295——F4 2026-09-07 消复用洞）——实际从 1 重新开始——
  nextSubagentId（subagent-scheduler.mjs L433-446）双保险：history._subIdCounter expando（期望跨 run
  持久）+ poolMax 池内兜底——**洞**：池空时 poolMax=0（L437）只靠 counter——reload/进程重启后 history
  从槽文件恢复（新数组不带 expando）→ counter 丢 → 池空 + counter 丢 = id 从 1 复用——实证：批1
  #1/#2→重发#4-#6（池有活条目 poolMax 生效）→22:10 reload 后批2 回 #1/#2→ACTIVITY 又 #1——
  **坐实块 key（sub:role#id）跨批/reload 复用风险**（挂起池活跨 reload 时撞冻结块）——修：counter
  持久化到槽文件（随 history 存）或恢复时从历史频道标签续号——status=登记——owner = 平台
  ——**归因修正（23:16 用户纠正）**：**非 reload 特有——每轮 runAgent 都从 1**（L293 注释自述
  "agent._subIdCounter per-run 重建"）——20:30 重启后同进程 20:37 explore #1 与 21:01 explore 又 #1
  （中间无 reload）——只有同轮内连续 spawn 递增（批1 #1/#2）——跨轮 = 上轮池空 + counter 归零 →
  poolMax=0 兜底失效 → 每轮首 spawn 都 #1——reload 仅加剧非根因——修方向不变（counter 跨轮持久
  或从历史频道标签续号）
  ——**根因再修正（23:18 复查——用户要求）**：非 per-run 重建主因——真因 = **压缩（compaction）替换
  history 数组时 _subIdCounter expando 随旧数组被抹**（agent.mjs L88 注释警告的 "history replace wipes
  it" 模式——distill 处防了（L88-91 await 先消化）——counter 没防）——长会话高频压缩（本会话开头即
  compacted）→ counter 反复归零 → 池空时 spawn 回 #1——修：counter 不挂 history expando（压缩不丢）
  ——**已落地（09-10 00:00——SUBAGENT-ID-COUNTER-AGENT——用户纠正：内存变量不需持久化——id 作用域=
  进程内——撤槽持久化方案——载体改 agent 本体 ±4 行/端——VSC 交付 clean（subagent-id-counter.test
  4/4 绿）——CLI 端在途）**——遗留：subagent.mjs L293-294 注释仍述旧载体前提（留下批触碰该文件时修）
- [ ] **advisor 进行中评审不可取消（2026-09-09 用户反馈——平台 bug）**：设计评审发起后对象漂移（文档中途编辑）
  → 需杀旧重发——但**无 cancel 通道**（advisor 无 cancel action——同 scope 重发被拒"settle 后逐个发起"——
  wait_for "advisor settled" 误报 0ms 即过但池仍拒——只能死等自然 settle）——对象漂移 = 旧评审对最终版打折
  = 部分意义（用户裁杀）——建议：① advisor 加 cancel（同 subagent cancel）或 ② 发起后禁改对象纪律 +
  ③ wait_for settled 口径修正（查 advisor 池真实态非 digest）——平台侧待修——status=登记——owner = 平台
- [ ] **QUICKFIX-BATCH-3 评审待重发（2026-09-09——对象漂移杀旧后卡死）**：旧 review #1（漂移对象版）在跑杀不掉
  ——重发被拒——等旧 digest 自然到后重发覆盖最终版（87 行 F-1~F-4 实证版）——status=等旧 settle——设计权在用户
- [ ] **TUI 开放项**（**2026-09-08 用户裁两项都做**）：① picker item.note 渲染 bug 修（buildProviderEntries baseURL/无 key 提示 + cmd-advisor 主菜单 Provider 注记不显示——疑似 bug）② question/wizard/picker 三套选择 UI 统一——走设计链排批（TUI.md §11 承载）
## 文档地图整体清扫（2026-09-08 批 2 报告发现）
- [ ] **AGENTS.md 文档地图陈旧**：:17 仍列 VERIFY-DOCONLY.md（归档后悬空）+ 整体含早已归档档（ENGINEERING-WORKLOOP 等——批 A 前即如此）——父侧立项整体清扫（非批 2 2b-6 范围——批 2 只做 README/SETTINGS-TOOL）
## 等裁项立项批（2026-09-08 夜用户裁——勘察一手）
- [ ] **§24→§11 旧锚全仓清理**（2026-09-09 POOL-CONFIG AC-7 补挂——触碰行已更新——全仓注释残留双端数十处——后续批大扫）
- [ ] **IMAGE-DOWNGRADE 跟进项（2026-09-09 交付注——①已闭合）**：
  ① ~~susp 等待态贴图不降级~~（已闭合——实现为显式边界——父侧确认接受）② runVisionReader maxTurns 固定 10
  ——大贴图（>6-8 张）可能落 F-2 fallback——按图数伸缩建议（2+paths.length*2——后批）③ Stop 点击在降级 await
  窗口内 no-op（≤60s——v1 接受）——status=登记——设计权在用户

- [ ] **VSC git 工具 commit 镜像缺口（2026-09-09 QUICKFIX-2 交付注——后批镜像 F-3）**：
  thincoder-vscode/src/tools/git.mjs:200-220 commit case 仍有同款"granular add + 整索引 commit"双层混扫
  缺陷——CLI F-3 commit --only 已修——VSC 镜像待补——owning board = git 工具面（双端对齐）——
  status=登记——设计权在用户

- [ ] **RESIZE 交付建议（2026-09-09——advisor 可选 🟡——后批）**：恢复序列字面量三源（writeCleanupSequence vs
  cleanup 余部 + 测试第三份）→ CLEANUP_REST 常量收拢——当前测试字节锁兜底——status=登记——设计权在用户

- [ ] **INPUT-LOCK-BEHAVIOR 交付注（2026-09-09——out-of-scope + 🔵 级）**：
  ① VSC docs/design/AGENT-LOOP.md §7 机制正文（L290/L322——"readOnly 锁 + 中断模态豁免锁"旧句）仍 C' 态
  ——设计受影响表只列 CLI doc 行——补 VSC doc 同步（下批——doc 面）② key-handler busy 门禁注释"Tab/↑↓ 仍禁"
  措辞微瑕 + L271 tab 死条件（🔵 级——下批）——status=登记——设计权在用户

- [ ] **digest 注入预算扩面（2026-09-09 BATCH-3 交付偏差——后批）**：预算现覆盖 = 双端 subagent 族 + CLI
  advisor/escalate 族——consult 族（CLI injectConsultResult）+ VSC advisor/escalate/consult 各族注入器绕过
  ——扩面 = VSC 分发点 injectPendingAsync + consult 注入器逐点落预算——需新设计评审——status=登记

