# 项目待办（Project TODO）
> 台账（FR18）——两池不混：**需求池**（用户需求点）/ **技术待办**（设计遗留 / 评审发现 / 债）。形态权威 = `docs/requirements/ENGINEERING-MODE.md` §1.13。
> 需求池条目 = 一行指针（`<需求句> → 需求 <档> §X · 任务书 batches/… §2 · status=<六态>`）；技术待办 = 指针（可指则指）+ 最小证据行（`file:line` + 症状）。**不展开任务细节**（细节住需求档 / 批次档）。
> 状态机六态：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃——**已核销 / 已废弃 → 移入 `docs/TODO-archive.md`**（活文件只留未决；组计数 = 未决数）；组计数（N 条）与组内实条目数同改（D3）。
> 维护：**记录 + 状态推进 + 物理落笔 = 主 agent**（§1.13——2026-09-11 修订）。本文件只承载**当前未决项**——已核销 / 已废弃移入 `docs/TODO-archive.md`（git history 可追溯）。

---

## 需求池（4 条）

- [ ] **台账提醒/可见面（两池·分池显示）**（2026-09-12 用户发现「从未见过任何提醒」；裁定：① 启动提示 + a 收口检查点 + b 状态行单标记，**两池分显·按项目分行·状态行极简·明细三行同源（启动/收口/变化）· VSC tooltip 增量**；否决：/todo 命令 · 触发回填+强制）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `docs/batches/2026-09-12-LEDGER-SURFACE.md` §2 · status=待设计

> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。

- [ ] **文档自审四处混乱**（2026-09-10 主 agent 自审——适用范围：文档维护也走流程）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.6 · 任务书（未派工）· status=待讨论

- [ ] **机制纪律落地提示词系统**（2026-09-11 用户裁定——测试体系 v3 三层/发布门/退役 + 旧句改写 + 待办台账维护机制）→ 需求 `docs/requirements/PROMPT-SYSTEM.md` §10 · 任务书 `docs/batches/2026-09-11-TEST-DISCIPLINE-PROMPTS.md` §2 · status=在途（coder 已发车——让位 VSC-CONTEXT-PARITY 同域串行）

- [ ] **CLI TUI 长会话堆 OOM（静默崩溃）——次生：崩溃后鼠标序列飞出**（2026-09-11 用户同事实测；勘察完成：三处结构性无界 + 一处分乘数，全进程无堆遥测）→ 需求 `docs/requirements/CRASH-REPORTS.md` §1（F3/N1-N4——取证固化波）· `docs/requirements/SESSION.md` §14.1（根因修复波）· 任务书 `docs/batches/2026-09-11-TUI-OOM-FORENSICS.md` §2 · `docs/batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §2 · status=在途

## 技术待办（31 条）

- [ ] **`src/tui/index.mjs` `startTUI` 单函数 400 行（L72–471）**——越函数档线（≥300 行）；本批（LEDGER-SURFACE）前既有、单点增量不触拆分 → 拆分债 → 证据 `src/tui/index.mjs:72` · status=待讨论
- [ ] **需求档 FR13 行「现况」子句陈旧**（句称 `src/prompts/discipline-engineering.md:182` 教跑 `scripts/check-doc-width.mjs`——实测 `src/prompts/**` 对 `scripts/`/`check-doc-width` 零命中）→ 证据 `docs/requirements/ENGINEERING-MODE.md:723` · status=待讨论

### 长会话内存面登记（TUI-OOM-ROOTCAUSE 批——2026-09-12 父侧登记）

- [ ] `/undo` 快照栈字节无界（条数封顶 50、无尺寸守卫——库先例：read 有 10MB 守卫）→ 证据 `src/tui/cmd-undo.mjs:12`（`MAX_UNDO`）· `src/agent/dispatch.mjs:357-358`（快照读整档）· status=待讨论
- [ ] `_advisorRuns` 实例无逐实例删除（仅模式切换整体重置）→ 证据 `src/agent-tools/advisor-async.mjs:104-137` · status=待讨论
- [ ] 小容器族无上界（`_asyncTombstones`/`_turnControllers`/`_frozenSubKeys`/`expandedBlocks`；capturedConsole 拼接可突破 64K）→ 证据 `src/agent/async-settle.mjs:138-139` · `src/agent/dispatch.mjs:428-432` · status=待讨论
- [ ] `verify-redesign` T-V4 偶触 slow 门（820–1031ms vs 800ms 阈值；干净 HEAD 复现/隔离跑 ~120ms）→ 登记 `slow()` 或复核阈值 → 证据 `test/verify-redesign.test.mjs:87` · status=待讨论

### 产品可移植性缺陷登记（2026-09-10 全面勘察——**只登记，待整明白后统一处理**）

> 来源：勘察报告（src/ 全量"硬编码项目约定"扫描——按任意用户项目视角判定）。需求依据 = `requirements/ENGINEERING-MODE.md` §2（FR10-FR15）+ `requirements/PROJECT.md`。
> 分级：🔴 = 静默失效（用户不可见、不可修）· 🟡 = 降级可见或噪声 · 🔵 = 无害/仅信息。
> **未动任何代码**——用户裁定：先全整明白，再改。

#### 🔴 静默失效（10 项）

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

#### 🟡 降级可见 / 噪声（18 项）

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

#### 🔵 无害 / 仅信息（7 项）

`cmd-init.mjs:12,24-58`（类型探测，双配置项目误判 Node）· `completion.mjs:81`+`verify.mjs:71,175,283`（措辞层）· `.thincoder/` 命名空间（产品自命名空间，非对用户项目的假设）· `~/.thincoder/` · `.mcp.json`（跨工具约定）· `verify.mjs:197-216`（JS node --check，advisory）· `helpers.mjs:264,271,286`（隐藏项有计数行）

#### 一致性债务（"整明白"时要一起裁的）

1. **`src/` 判据有 4 种实现**：`^src/` 锚定 `dispatch.mjs:199`+`repos.mjs:168` vs 组件匹配 `repos.mjs:146`+`advisor-async.mjs:170` vs 根锚定 `verify.mjs:38-58` vs 注释里的 `isProductCode`（**该函数不存在**，仅注释概念——`repos.mjs:151`、`verify.mjs:184`）
2. **"项目根"有两个互不相干的定义**：AGENTS.md 版（`messages.mjs:35`）vs package.json+.git 版（`verify.mjs:38`）
3. **文档/临时文件判定**：扩展名白名单（`repos.mjs:100,116`），不参考任何项目自述
4. **已有"让项目自己说"的先例**（改造样板）：`.thincoder/advisor.md`（有默认回退的覆盖）· advisor `documents=[…]` 参数（显式声明，但按次不持久）· verify 的自然语言验证法（**明确拒绝硬编码测试命令**——证明本产品既有设计取向）

#### 已核实"不受影响"（防重复勘察）

顶层 `README.md` 从不被读取 · **无任何代码执行用户项目的测试命令**（verify 明确不自跑）· 无构建/发布假设（`package.json` 仅读 ThinCoder 自身）· `test/` 目录假设零命中 · `.vscode/` 仅作端标识后缀 · `prepublishOnly` 用户侧零命中。

#### 另立（勘察外，实施中发现）

- `.thincoder/index/`（`.thincoder/index/manifest.json` + vectors.bin）—— **DB 化前死产物**（mtime 2026-07-29，全仓零读写点；活体索引 = `~/.thincoder/memory.db`）→ 可删 · status=在途（第 22 批——C6 删除面）
- `src/tui/wrapped-spawn.mjs:1` 注释指向已入档的 TUI-STDERR-CAPTURE.md（**真断链**）；另有约 12 处带 `docs/design/` 前缀注释（指现行档）——扫尾项 · status=在途（第 22 批——C4 去路径处置；「约 12 处」不在本批）。



### 工程模式 / 评审收敛（prompts + 机制）

- [ ] **跨会话同批档案并发写风险**（2026-09-11 实况首演——两会话父侧同写 `VSC-GUARD-MIRROR` 批次档；两会话 §6 均已登记）：批次档 / `docs/TODO.md` 无会话级写权分片 → 证据 `src/agent-tools/batch-segment.mjs:130`（append 无会话所有者门）→ **用户 2026-09-11 裁定：暂不开批（维持登记）**——冲突源 pid=724 已退出；待第二真痛点再启 · status=待讨论
- [ ] **第 13 批收口遗留**（2026-09-11 §6 登记——维护项）：① T75/T76 无测试宿主（→ 任务书 `batches/2026-09-11-SWEEP-FOLLOWUP.md` §2）② `test/settings.test.mjs` 480/500（增厚先拆）③ AC54 注行号指针 +1 漂移（→ 同批）④ 存量非表格超宽（批次记录侧 9 行已折；设计档侧余 5 行 → 同批候选 2）→ 证据 `docs/design/ENGINEERING-MODE.md:1406`（AC54 注）· status=在途（第 14 批）

- [ ] **VSC 两处未纳登记**（第 12 批 designer 披露）→ 证据 `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`（§13.10 登记项 + 收口 §14）· 任务书 `batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2（用户 2026-09-11 裁定「开」——含收敛路径信号面，共三面）· status=在途（**第 18 批**——需求 §9 + 设计 §14 已落档，评审在途；**注**：VSC 设计档 3 处标题写作「第 15 批」= 会话序号笔误——第 15 = PORTABILITY——待下次该档写入订正）
- [ ] **第 9 批后续登记面（设计 §13.9——父侧定时点）**：① 设计 `docs/design/ENGINEERING-MODE.md` §2.2 / §2.5 / §2.6 / §2.9 新时序规则登记面 + §2.22.2 A12 字面登记（他链在途文件）② 双源不对称（「交付链收口」节只在 `src/`）是否补镜像——存量问题 → 证据 `src/prompts/discipline-engineering.md:135` · status=在途（第 13 批条目 F——窗口未关：登记面已打回父侧；批 8 收口后随批）
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度（低优先）→ 证据 `docs/design/AGENT-LOOP.md:655`（§13 完整轨迹存档）
- [ ] **`setup.mjs` 受限变体 schema 补 cancel 词**（描述层同步）→ 证据 `src/agent-tools/subagent.mjs:142`（action enum——cancel/panel/observe/send）· status=在途（第 20 批——设计已落档，待评审）
- [ ] **CLI 侧自用首验（batchDoc 门 + 新角色）**：本会话宿主 = VSC，传 `batchDoc` 不等于门禁生效（VSC 无此门、未知参数被忽略）——需 CLI 会话内真 spawn 一次验证 → 证据 `src/agent-tools/subagent.mjs:151`（`batchDoc` 必填门）· status=待讨论



### 异步 / 挂起 / 调度残留（AGENT-LOOP 后续轮）

- [ ] **普通模式偏差审计 + 会话上下文轮**（**评估已收口（2026-09-11 第 23 批）**：D1 = 一次性收口——F-N1.1..6 条目迁入 `requirements/NORMAL-MODE.md` §6 + 断言锁/指针修复；D2 = 会话上下文轮退役（未实现——四机制承接）；设计记录见 `docs/design/AGENT-LOOP.md` §19）→ 任务书 `batches/2026-09-11-NORMAL-MODE-AUDIT.md` §2 · status=设计已落（待评审/批准）
- [ ] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随——A 已落地，B 待工具集真变再动）→ 证据 `src/agent-tools/subagent.mjs:114`（description 装配面）

### 其他在途 / 待核销

- [ ] **既有文档超宽行清理**（DOC-REORG 实施发现——非本批引入）：**2026-09-11 状态更新**——批次记录侧 9 行已由父侧代笔折行+打标（14 → 设计档侧余 **5 行**：`docs/design/AGENT-LOOP.md` :510/:572/:574 · `SESSION.md` :524 · `SUBAGENT-ID-COUNTER-AGENT.md` :53（原 4 档/9 行 as-of 9-10——TUI 两行已随第 14 批全表回写消解）→ 已随第 14 批候选 2 翻转（任务书 `batches/2026-09-11-SWEEP-FOLLOWUP.md` §2）· status=在途（第 14 批续做轮在飞）
- [ ] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌（技术待办非需求点）→ 证据 `src/session.mjs:2`（slot-based 模型）
- [ ] **deepseek-v4-pro 视觉能力复检 + 发布注记**（第 6 批评审 #1/#7 协调项）：触发 = 2026-09-14 12:00 路由生效后 / V4.1 Pro 到货——复核 `multimodal` 翻转（含换锚）→ 证据 `test/read-image-guide.test.mjs:20`
- [ ] **`src/tools/read_image.md:8` 描述漂移**（第 6 批达成 vision 后——描述与实现矛盾，且工具描述是发给模型看的面）→ 证据 `src/tools/read_image.md:8` · status=在途（第 22 批——C1）
- [ ] **快层慢门 flake：`test/eng-designer-role.test.mjs:83` 未标 `slow`**（818.5ms 撞 D-T6——负载相关偶发）——修复口径 = `test(` → `slow(`（归册不是删除）→ 证据 `test/eng-designer-role.test.mjs:83` · status=在途（第 20 批——设计已落档，待评审）
- [ ] **需求档同步（第 4 批 C 遗留 ②——① 已销账（第 5 批 VSC-MIRROR 收口）· ③ 已作废（batch-segment.test 321 行 ≤500 无须拆））**：① VSC 端镜像（工具 + 六段机制同搬）② 需求档 4 项同步（§1.12 段表「写入手段」列 / §1.11 B9 / §1.16 F1 口径 / §1.16 N2 措辞——eng-designer 写域）③ `test/batch-segment.test.mjs` 321 行是否拆分（咨询项）→ 证据 `docs/design/ENGINEERING-MODE.md:454`（§2.16 过渡期注待清理）· status=在途（第 22 批——C5 五点位已落）
- [ ] **VSC live 块显示不可靠**（用户反馈——"实际启动了但不能可靠显示 live 块"）：根因 = ① 出生靠窗口（started 落 webview 未就绪即丢）② 快照兜底不全（advisor-only 空转 / 只重放 running）③ 终态对 never-born 块 no-op；同响应双 spawn 实证（pool 计数对、只渲染 1 块）→ 证据 `thincoder-vscode/src/extension/panel-callbacks.mjs:81`（postMessage 无队列）· status=待设计（修复方向待用户裁：修补 vs 出生队列根治）
- [ ] **advisor 池状态不可查询 + 不可取消**（用户反馈——平台机制缺陷——已实证三次）：① status 只查 subagent 池 ② `wait_for "advisor settled"` 误报 0ms ③ 无 cancel 通道（修：池状态可见 + settled 口径修正 + cancel）→ 证据 `src/tools/ops.mjs:195`（review-pool 查询恒真 0ms 秒过——用户实证）· status=待讨论（owner = 平台）
- [ ] **子代理 abort 无来源标注——死亡不可诊断**（用户反馈——平台可观测性缺陷——已实证两次）：仅报 "aborted due to timeout"——无错误栈 / 无来源层标注（~600s 死 = 已修 bug 复发/残留路径——直连）→ 证据 `src/provider/core.mjs:70`（600s 绝对墙钟废除注）· 任务书 `batches/2026-09-11-ABORT-PROVENANCE.md` §2（**用户 2026-09-11 裁定：本仓接管**）· status=在途（第 24 批——设计已落档，待评审；VSC 600s 残留已登记同批设计 §20.10）
- [ ] **TUI 开放项**（2026-09-08 用户裁两项都做）：① picker item.note 渲染 bug（无 key 提示不显示）② question/wizard/picker 三套选择 UI 统一——走设计链排批 → 证据 `src/tui/model-picker.mjs:109`（buildProviderEntries）· （承载 = `docs/design/TUI.md` §11）· status=在途（第 20 批——设计已落档，待评审）



### 等裁项立项批（2026-09-08 夜用户裁——勘察一手）

- [ ] **§24→§11 旧锚全仓清理**（POOL-CONFIG AC-7 补挂——触碰行已更新——全仓注释残留双端数十处——后续批大扫）→ 证据 `src/tui/suspension-drive.mjs:30`（§24 残留样本）· status=在途（第 22 批——CLI src 面 28 行；VSC 面另议）
- [ ] **IMAGE-DOWNGRADE 跟进项**（①已闭合）：② runVisionReader maxTurns 固定 10——大贴图可能落 F-2 fallback（建议按图数伸缩 `2+paths.length*2`）③ Stop 在降级 await 窗口内 no-op（≤60s——v1 接受）→ 证据 `thincoder-vscode/src/extension/image-handler.mjs:65`（runVisionReader）· 设计权在用户
- [ ] **VSC git 工具 commit 镜像缺口**（QUICKFIX-2 交付注——后批镜像 F-3）：commit case 仍有 granular add + 整索引 commit 双层混扫（CLI `--only` 已修）→ 证据 `thincoder-vscode/src/tools/git.mjs:200` · status=待讨论（设计权在用户）
- [ ] **RESIZE 交付建议**（advisor 可选 🟡——后批）：恢复序列字面量三源 → `CLEANUP_REST` 常量收拢（当前测试字节锁兜底）→ 证据 `src/tui/tui-lifecycle.mjs:19`（writeCleanupSequence）· status=待讨论
- [ ] **INPUT-LOCK-BEHAVIOR 交付注**（out-of-scope + 🔵）：① VSC 端 `AGENT-LOOP（VSC 仓）§7` 机制正文（:290/:322 旧句）仍 C' 态——补同步 ② key-handler busy 门禁注释措辞微瑕 + :271 tab 死条件 → 证据 `thincoder-vscode/docs/design/AGENT-LOOP.md:290` · status=待讨论（① 第 22 批 C3 已落；② 仍待）
- [ ] **digest 注入预算扩面**（BATCH-3 交付偏差——后批）：预算现覆盖 = 双端 subagent 族 + CLI advisor/escalate 族——consult 族（CLI `injectConsultResult`）+ VSC 各族注入器绕过 → 证据 `thincoder-vscode/src/agent-tools/async-settle.mjs:54`（injectPendingAsync 分发点）· status=在途（群 B 批——批次档 `docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md`；设计 = `AGENT-LOOP` 双端 §22 / §16；单源模块 + 四族全接线）

---

