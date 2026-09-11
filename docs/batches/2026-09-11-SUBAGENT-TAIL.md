# 子代理内嵌套 explore 显示统一 · 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 不是规格：需求内容按**新老划断**同档承载（TUI 板块需求层落 `../design/` 设计档——具体落点由 designer 定）；
> 整批做完本档冻结。编制：主 agent（工程模式）· 2026-09-11。

---

## §1 讨论（主 agent 记）

### 需求来源（用户原话）

> "cli端subagent调用explore时的显示方式与其他工具不同，我希望能跟别的工具一致。"
> 澄清："我是指在**子代理中 eng-coder 中再调用 explore** 的时候，不是主 agent 调用的时候。"
> 口径裁定（三选一）：**（C）**——"折叠态内容被藏：explore 的进展只露 2 行且要展开；其他工具的最近活动直接进父块 tail"。

### 需求点（2 条）

**点 1（主需求）**：**子代理内 spawn 的 explore，其活动行要直接进父块 tail**（与其他工具调用在父块 tail 中的呈现同款）——
当前它们被收进嵌套小节的独立折叠体（只露 2 行，需展开）。**「与小节并存 / 取代小节」由设计裁定**（用户未限定）。

**点 2（条件随件——用户 2026-09-11 03:06 裁定"1 做了 2 就没意义了"）**：子块「已省略 N 行」计数虚高（稳态显示 ≈ 真实 ×2）——
**设计若仍保留子块省略标记 → 计数真值必须一并修；若点 1 使该标记不再出现 → 本项随点 1 消解**（设计档声明即关闭）。

### 已核现状（供 designer 免重复勘察——行号为 as-of 2026-09-11 快照）

**嵌套路径（本批对象）**

- 头行：`src/tui/subagent-panel.mjs:50-63` `subChildHeadRow` → `❯ <role>#N · <model> · <elapsed>`（dim `❯` + 亮 `role#N` + dim model/elapsed）。
- 折叠体：`:66-88` `foldTailLines(child.blocks, 2)`——`│ ` 前缀、dim、`_skipDimFold`。
- 展开体：`renderBlockTimeline` → `renderExpandedBlock`（60% 屏高上限 + 块内滚动）。
- 递归：`walk(carrier, path)`（D-R23d——任意深度、每层独立折叠键 `sub-${rootKey}/${innerPath}`，`subChildFoldKey` D-R23e）。
- 鼠标：折叠键复用 fold-block `_foldToggle` 通道 → `mouse.mjs` 零改动（注释声明）。

**父块路径（对照）**

- 父块 tail：`subagent-panel.mjs`（`foldTailLines(sub.blocks)` tail 3）——eng-coder 自身工具调用只在此出现，**无独立头行**。

**行数额度与计数（点 2 相关）**

- 子块计入外层 500 行环（数据层，NFR）；实现在 `src/tui/subagent-children.mjs`。
- 幽灵行机制：`:28-50` `dropCarrierLines` 把省略标记（meta 块）当普通块走 FIFO 丢弃 → `:48` `unshift` 重建 + `_lineCount += 1` →
  ① 每轮 trim 有 1 单位预算耗在标记自身；② 每轮给 `dropped` 记 1 行**无对应隐藏内容**的幽灵行。
- 实测（主 agent 两轮实验）：稳态追加 50 行 → 显示 +100 / 真实 +50；混合场景 显示 139 vs 真实 79。
- `:17` `countBlockLines` 按 `split("\n")` 计数（行尾 `\n` 令每块多算 1 元素）。

### 范围边界（明确不做）

- **主 agent spawn 的显示不在本批**（用户限定"不是主 agent 调用的时候"）——运行期底部面板、冻结块、`_stopCol` ⏹ 等主 agent 面机制不动。
- **A/B 两项未采纳**：A 嵌套头行补任务摘要、B 去掉小节结构（用户选 C）。
- 若设计判定某处**必须连带改**（如折叠键 / `mouse.mjs` / 行数额度），须在设计层**显式列出并给理由**，不得静默扩面。
- VSC 端：本批为 CLI TUI；VSC 是否有对应显示面由设计勘察后裁（无则声明"无对位面"）。

### 待设计必须逐条裁定（6 问）

1. 活动行进父 tail 的**实现面**：数据流（子块 activity 追加点到父块 `blocks`）还是渲染期合并？——与 500 行环、折叠键的关系。
2. **并存 or 取代**小节（直接决定点 2 存废）。
3. **行数预算**：现状父 tail 3 + 子 tail 2；合并后上限多少（防刷屏——`tool-events.mjs:67` D1「block content, never the main stream」的设计理由必须核）。
4. 折叠键与鼠标命中是否需变（`mouse.mjs` 零改能否维持）。
5. **测试面**：TUI 渲染测试档在哪、如何断言（designer 勘察后列受影响文件 + 用例）。
6. 点 2 的**存废裁决**（保留 → 修真值 + 用例）。

### 状态

**已收口 2026-09-11**（用户"开工"）。下一步 = **设计**（spawn eng-designer；设计落 TUI 板块设计档）。

---

## §2 批次任务（eng-designer 自写）

> 落笔 2026-09-11（本批 eng-designer）。§1 预置的占位行（"待写——eng-designer"）已由本节作者清理——D6 回读确认占位残留会与正文重复。以下为 §2 正文。

### 本批覆盖的需求条目

依据：本档 §1（已收口 2026-09-11——用户"开工"）· 需求档 `docs/requirements/TUI.md` **F8 / N5 / N6** · 设计档 `docs/design/TUI.md` §6「内层活动并入外层流（SUBAGENT-TAIL——2026-09-11 批，设计与测试并档）」节（选型/契约/决策/用例/验收标准全在彼处——coder 必读）。

**归属判定（覆盖 §1 的暂拟指针）**：机制归属 = **TUI 板块**——

① 显示契约单一权威档 = `docs/design/TUI.md` §6（R23 机制叙述旧节号 §27/§19.5 系文档重组前的
陈旧指针，实见 TUI.md §6）；
② 需求层落 `docs/requirements/TUI.md`（该档已于 2026-09-10 拆分存在，design/TUI.md 头部明示
"本板块需求见 ../requirements/TUI.md"；§1"落 ../design/ 设计档"为暂拟、其自注"具体落点由
designer 定"）。
AGENT-LOOP 侧（relay/前缀路由）本批零改（指针照旧）。

| 条目 | 内容 | 落点 |
|---|---|---|
| **F8**（点 1 主需求） | 子代理内嵌套 spawn（eng-coder 内 explore）的活动行**直接进外层块 tail**——与其他工具调用同款；任意嵌套深度内容随外层展开可达 | 需求 `requirements/TUI.md` F8；设计 = 数据流合并 + 取代子块小节 |
| **N5** | 防刷屏与行额度：折叠态每块 头 1 + tail ≤3；展开 ≤60% 屏高；内层内容计入外层 500 行环（单环） | 需求 N5；设计 = 单环 trim 收窄 |
| **N6** | 省略计数真值：「已省略 N 行」= 实际隐藏内容行数（标记自身不占额度/不计数；无幽灵增量） | 需求 N6；设计 = D-ST5 |

**点 2 裁决（用户 2026-09-11 03:06 条件句的落位）**：子块级「已省略」标记随取代小节**消失**；**块级省略标记仍在**（合并流首 meta 行——与改前同款）→ 按用户裁定「仍保留省略标记 → 计数真值必须一并修」分支执行：dropCarrierLines 三缺陷（标记自重 / 幽灵行 / 块尾空行口径）随本批修正。
→ **父侧收口注**：TODO 两条（"子代理内 spawn explore 显示" / "子块计数虚高"）的勾销与改记由父侧执行（本 designer 未改 TODO——主 agent 指示）。

### 明确不在本批

| 项 | 说明 |
|---|---|
| 主 agent spawn 的显示面 | 运行底部面板 / 冻结块 / ⏹ / 主会话流——零动（用户限定"不是主 agent 调用的时候"） |
| 口径 A/B 候选 | 嵌套头行补任务摘要（A）/ 仅去小节结构（B）——未采纳（用户选 C；**取代** = C 的设计落法，经 §1 授权裁定） |
| 事件 token 路由（D1） | ⟦ev⟧ 只进头部——照旧（本批合并的是内容行，非事件） |
| `mouse.mjs` | 零改（核对项；折叠键通道不依赖子块键） |
| tail 扩行 / "子块先丢"优先级 | 否决备选（设计档 D-ST3 / D-ST4——理由在彼） |
| VSC 端 | **无子块小节形态**（另有子标形态——VSC 嵌套活动有对位显示；本批后两端不再同构——CLI 内层行无归属标）；镜像评估待独立批次（AGENT-LOOP 未决行已重述对齐目标） |
| 子块头元素（model/耗时/定格词）与每层独立折叠键 | 取代的既定代价（设计档 D-ST2）；任意深度**内容可达性**保留并用例钉死 |
| TUI.md §1 模块地图行 / §11 完成史 / 变更记录终稿 | 交付后回写（docs 写域 = 设计者/父侧收口项——coder 不改 docs） |
| TUI.md §6 约束节折叠键句（原 :609）/ §10 as-of R23 行（原 :761） | **修正轮已改毕**（见下方「修正轮同步」）——交付后收口核验、不得回退（行号以收口时为准） |

### 已知事实（免重复勘察——行号 as-of 2026-09-11）

- 嵌套路径四个 append 点：`src/tui/subagent-blocks.mjs` routeSubToken（:293-297 文本）/ routeSubReasoning（:310-314）/ routeSubToolCall（:336-343）/ routeSubToolOutput（:358-363）——append 目标上移为本批主改点。
- 子块数据层：`src/tui/subagent-children.mjs`（:17 countBlockLines / :28-50 dropCarrierLines / :60-73 trimSubTree / :101-107 appendSubChild / :111-141 ensure+descend / :147-176 close 族）。
- 子块渲染（删除面）：`src/tui/subagent-panel.mjs` :44-88（subChildFoldKey / subChildHeadRow / renderSubChildSections）+ :201 调用点；`src/tui/render-segments.mjs` :13 导入 + :109-110 调用 + :119-130 childSig。
- 守护族保留：`src/tui/subagent-freeze.mjs` :78-89（closeOpenSubChildren 调用）；`src/agent/spawn-child.mjs` :146-159 emitNestedChildEvent（生成侧补发射——零改）。
- D1 注释锚：`src/tui/tool-events.mjs` :64-67。
- 测试面：既有 TUI 测试范式 = `test/activity-debloat.test.mjs`（routeSubToken 直驱）+ `test/queued-stop.test.mjs`（renderSubagentPanel + mouse + layout）；**R23 子块渲染/计数无既有用例**（新档自建）；测试装配 glob `test/*.test.mjs` 自动收录。
- 行数实测：subagent-blocks 451 / subagent-children 177 / subagent-panel 205 / render-segments 183 / subagent-freeze 169 / index 450 / mouse 250。

### 受影响文件（带当前行数 + 预计增量）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/subagent-blocks.mjs` | 451 | −5 ± 10 | 四处嵌套分支 append 上移；注释与陈旧指针修订 |
| `src/tui/subagent-children.mjs` | 177 | −35 ± 15 | 单环 trim 收窄；dropCarrierLines 计数真值修复；appendSubChild / trimSubTree / carrierTreeLines 删除；守护族保留 |
| `src/tui/subagent-panel.mjs` | 205 | −40 ± 10 | 子块段渲染删除（三个导出/内部函数 + 调用点） |
| `src/tui/render-segments.mjs` | 183 | −15 ± 5 | frozenSubSeg 子块树签名与子块段调用删除 |
| `src/tui/subagent-freeze.mjs` | 169 | ±5 | 语义保留；注释随批修订 |
| `src/tui/index.mjs` | 450 | ±2 | state.subTasks 注释修订 |
| `src/tui/mouse.mjs` | 250 | 0 | 零改（核对项） |
| `test/subagent-tail-merge.test.mjs` | 0（新增） | +140 ± 40 | 用例表 1:1（新档） |

（另：`docs/requirements/TUI.md` / `docs/design/TUI.md` 已由设计者改写——**不列 coder files 域**。）

### 验收标准（逐条回指需求；每条可机器验证——详表在设计档同节）

| AC | 判据 | 断言手段 | 回指 |
|---|---|---|---|
| AC1 | 内层行落外层 blocks 且顺序 = relay 顺序 | 直驱 routeSub* → blocks 文本/kind 序列 | F8 |
| AC2 | 折叠态渲染 = 头 + ≤3 行 tail（含内层最新活动）；无子块头/子块段 | 面板/冻结段渲染输出断言 | F8 / N5 |
| AC3 | 展开态 = 合并流全量（任意深度可达）+ 60% 封顶零动 | 展开渲染行数/文本断言 | F8 |
| AC4 | 渲染输出零子块折叠键与零子块头行 | `_foldToggle` 集合 + 文本断言 | F8 |
| AC5 | 折叠态每块 ≤ 4 行（头 1 + tail ≤3） | 面板行数分块断言 | N5 |
| AC6 | 单环 ≤500 显示行 + 省略标记恰 1 条 | 超限直驱断言 | N5 |
| AC7 | 计数真值：稳态追加 K → N 恰 +K；多轮 trim 无幽灵增量 | dropped 值/标记文本断言 | N6 |
| AC8 | 守护不回退：done 子块迟到丢弃 / tombstone 丢弃 / 内层非完成事件剥除 | 直驱断言 | F8 |
| AC9 | 无嵌套零回归 + `sub-${key}` 键族 toggle 不变 | 既有路径断言 | F8 |

### 任务书就绪

- **设计 = 任务书本体**：`docs/design/TUI.md` §6 并档节（含方案选型对比 / 数据流与渲染契约 / 关键决策 D-ST1..D-ST6 / 冲突点核对 / 受影响文件 / 用例表 12 条 / AC1..AC9）。
- **实现边界** = 上表文件；注释陈旧指针修订（AGENT-LOOP 旧节号 + D-R23* 指称 → 改指设计档对应节）随本批（只改所触文件，不做全库清理）。
- **交付** = eng-coder 自审闭环（内部 explore 偏差审计 → advisor 代码评审 → 收敛，AGENT-LOOP §18）+ 批次档 §5 自写；测试 = 新档全绿 + 既有 TUI 测试零回归；报告声明审计/评审轮次与终态。
- **就绪待评审**（发起权在用户）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（0🔴 · 4🟡 · 4🔵——发现表见 §3）。主 agent 裁决 **6 条采纳落档 + 1 条用例加强**（#6 = 核验通过项、无动作；#8 = 汇报口径、无文档改动）。本轮 = 修正轮（docs FIRST——实现前落定；**只改文档、不碰实现**）。

**设计档落点（`docs/design/TUI.md` §6 并档节——编号全不变）**：

| 评审 # | 落点 | 内容（详文在彼） |
|---|---|---|
| 1 | §6 契约节 | 新增「守护字段最小形状与②注」条：正读者 = `done`/`currentTool`/`children`；其余字段可留可删（防反向补实现/补断言）；② = 防御性保留、不设断言 |
| 2 | §6 约束节折叠键句（原 :609）/ §10 as-of R23 行（原 :761） | 折叠键句去退役键示例（`sub.key`/`innerPath`）改写 + 表内 supersede 注；**两处已改毕**——回写清单见上表新增行 |
| 3 | §6 冲突点核对（原 :543-544）/ `docs/design/AGENT-LOOP.md` 未决行 | VSC 表述改准（无子块小节形态 · 另有子标形态 · 两端不再同构）；镜像批对齐目标重述（现行差异 = CLI 内层行无归属标 vs VS 子标） |
| 4 | §6 AC 表后 | 新增**真机 smoke** 步骤（**选定 = 真机 smoke，非残余风险记录**）：实现落盘后新起 CLI 会话目视三查（tail 含内层行 / 无 `❯` 小节头 / 面板高度 7 → 4 下降）；依据 = 用户可见显示面变更 + 项目先例「真机手感是唯一判据」 |
| 5 | §6 契约节（路由条后） | 新增「已知失效前提」条：并发内层子块交错 = 本批不处理的未来复核项 |
| 7 | §6 用例 2 / 用例 6 | 用例 6 输入混入内层前缀行（内层计入 500 行环直接断言）；用例 2 加负断言（tail 行不含 `explore#N` 归属前缀） |

**交付定义更新（与原「交付 =」行冲突时以本行为准）**：交付 = eng-coder 自审闭环 + 新档全绿 + 既有 TUI 测试零回归 + **真机 smoke**（执行者 = 主 agent / 用户——**新起 CLI 会话**，coder 无 TTY 不承担）+ 批次档 §5 自写。

**一致性核对**：用例数不变（12 条）· AC 编号不变（AC1..AC9）· F8/N5/N6 无增删改——`docs/requirements/TUI.md` 零改（三处条目一致保持）；实现边界 / files 域照原表零动。

**写域与父侧项**：本轮只改 `docs/design/TUI.md`、`docs/design/AGENT-LOOP.md`、本档 §2（含 §2 表 VSC 行表述同步改准）。TODO.md 改记（评审 #3 建议）与 CHANGELOG 属父侧写域——本设计者未改（主 agent 指示）。

### 修正轮同步（2026-09-11——设计评审轮次 2 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 2）**pass**（0🔴 · 1🟡 · 2🔵——发现表见 §3 轮次 2）。主 agent 裁决：#1 · #2 两条文档项采纳落档；#3 = 父侧收口项（非本设计者域）。本轮 = 修正轮（docs FIRST——实现前落定；**只改文档、不碰实现**；同一 designId 链内）。

**逐条落点（编号 = §3 轮次 2 发现编号）**：

| 评审 # | 落点 | 内容（详文在彼） |
|---|---|---|
| 1 | `docs/design/TUI.md` §6 契约节（原 :509-517 → 现 :512-523） | ② 写路径明示 =「保留写、无读者、不设断言」；其余字段分两类——**A 保留写路径（无读者）** = `stopped`（写点 = `closeOpenSubChildren` 冻结定格＝②、`closeSubChild` 内层定格）；**B 可留可删字面量** = `model`/`started`/`doneAt`/`blocks`/`toolArgs`/`approval` 等；载体枚举加「类目划分见下条」交叉引用。口径不变：② 无可见语义、AC8 不含② |
| 2 | `docs/design/TUI.md` §6（失效前提条 :506-511 / tombstone 引 :520-522 / VSC 条 :558-560）· `docs/design/AGENT-LOOP.md` 未决行 :14-17 | 行位实测改准（结论见下）；本批新增行号锚补符号名、行号降 as-of 附注 |

**行位实测结论（#2 ①——`:215-220` vs `:176`）**：

- 判读源码 = `src/agent-tools/subagent.mjs`（批内未动——两引用出自**同一快照**，非行号漂移/旧快照）。
- 「depth>0 spawn 恒同步」**门控本体** = 缺省门控 `wantAsync`（`args.async ?? ((ctx.depth ?? 0) === 0)`——:220，
  注释 :215-219）；**强制面** = `subagent-run.mjs` `executeAsyncSpawn`（depth>0 抛
  "async spawn only available at the top level"——:47-49）+ 工程子代通道 `spawn-child.mjs`
  `gateEngCoderSpawn`（role≠explore 拒、`async===true` 拒 "internal spawns are sync-only"——:48-56）。
- `:176` = 受限动作门（spawn-only）的**报错文案**（含 "sync explore children" 字样）——**非同步强制点**；§3 轮 1 记录（batch:191）为欠精确引用（同快照异位）。设计档保留 `:215-220` 为缺省门控锚并补下游两处强制面（符号锚）；§3 照原样只读、不修订。

**符号锚补齐（#2 ②——行号降 as-of 附注；存量行号引用不动）**：

- TUI.md:508-510（sync 门）：`subagent.mjs` `wantAsync` / `subagent-run.mjs` `executeAsyncSpawn` / `spawn-child.mjs` `gateEngCoderSpawn`。
- TUI.md:520-522（tombstone 丢弃路径）：`subagent-blocks.mjs` `ensureSubTaskKey`（守卫本体）+ `routeSubReasoning` / `routeSubToolCall` / `routeSubToolOutput` 的 tombstone 分支。
- TUI.md:558-560（VSC 子标两处）：`thincoder-vscode/src/agent-tools/subagent-run.mjs` `runChild`·`forward`（子标挂载）+ `webview/ui.js` `appendAdvisorChunk`（`.advisor-sub` 子标）。
- `AGENT-LOOP.md`:14-17（同批 VSC 两处）：同上。

**机检**：`node scripts/check-doc-width.mjs`——本轮新增行全 ≤300 字符（新增超宽 0；TUI.md / AGENT-LOOP.md 文案侧最长 97 字符）；存量超宽 14 行 / 5 文件（均非本轮引入——TUI §1/§11、AGENT-LOOP 变更记录、SESSION、其他专题档、本档 §3 评审行）；一致性新增违规 0（V1/V2/V3）。

**一致性核对**：12 用例 / AC1..AC9 / F8·N5·N6 / D-ST1..6 编号集合零变；`docs/requirements/TUI.md` 零改；实现边界 / files 域零动。行号位移（本轮 TUI.md 净增 7 行——:506-508 段 3→6、:509-517 段 9→12、:552-553 段 2→3）——§6 后续行号整体下移，引用以 as-of 为准。

### 交付同步（eng-designer · 2026-09-11——设计档与交付实测态对齐；本追加与上文本冲突时以本追加为准）

**背景**：实现已交付并验收（用户 2026-09-11 12:00 真机 smoke 过；父侧实跑新档 12/12 · 全量 363/352/0）。本追加 = `docs/design/TUI.md` 与交付实测态对齐的落档（§5 遗留文档回写面——本批文档链最后一步），**只改文档、实现零触碰**（append 机制——§1/§3–§6 零碰，冲突处以本块为准）。

**同步项（5 项——逐项落点）**：

| # | 项 | 设计档落点 | 结果摘要 |
|---|---|---|---|
| 1 | §1 地图行：本批所触六文件职责与行数按交付实测回写 | §1 表头注 + blocks / freeze / children / render-segments / panel 五行 | 净删的渲染面函数自职责描述移除；subagent-children 职责改守护载体 + 单环 trim；行数 blocks 454 · freeze 170 · children 163 · render-segments 169 · panel 150（index 复核 450 零变） |
| 2 | §11 完成史行 | §11 表末（新增 2026-09-11 行） | SUBAGENT-TAIL = 数据流合并 / 守护元数据 / 渲染面净删 / 单环 trim / 计数真值；现状 = 已实现（12 用例 + 真机 smoke 过） |
| 3 | 变更记录本批行 | 变更记录 2026-09-11 行 | 改写为交付态要点（已交付并验收——6 源 + 新测试档 12 用例全绿 / 全量 fail 0 / smoke 过 + §1/§11 回写） |
| 4 | 偏差同步：D-ST6 注释口径 | §6 D-ST6 条（追加「交付实测口径」段） | 改动区域改指本文件 §6 并档节；未改动区域旧节号（§19.5 / §19.6 / §20 / §24 / §27）= 存量全库性文档债、不随批迁移——防后续误读 |
| 5 | §6 面两处改准 | §6 数据层指针行 + AC 表后 | 指针行「N2 环、R23 子块载体」→「N2 单环 500 显示行、SUBAGENT-TAIL 守护载体」；AC 表后补「交付核验」行（12/12 + smoke 三查过 + 终态 clean） |

**存量观察（未改——非本批触及行）**：§1 地图其余行存在独立漂移（split 口径实测：pickers 500→107 · mouse 213→250 · key-modes +23 · tui-lifecycle +13 · wizard +20）——按「量级参考（会漂）」不随批重测；全表重测属独立文档维护项（未登记）。

**历史快照沿革**：§5 偏差①②③的原裁定不变（测试档实测行数超设计估计 = 接受 / D-ST6 注释口径 = 接受 / 两文件 >300 行 = 存量先例）；§6 并档节「受影响文件清单」的「预计增量」列保留为设计估（不追改），交付实测以本块与 §5/§6 为准。

**与实测零冲突声明**：除上述 5 项外，设计档与交付实测未发现其他冲突；需求档 `docs/requirements/TUI.md` 零改（F8 / N5 / N6 三处条目一致保持）。

**纪律**：只改 `docs/design/TUI.md` + 本批次档 §2（本追加）；实现 / 测试 / 提示词 / 其他批次档零触碰；未 commit；未发起评审；未新建档。`node scripts/check-doc-width.mjs`（本次落笔后复跑）：本批改动面新增超宽 0 / 新增一致性违规 0（存量同前——TUI.md 无超宽行）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

**设计评审（advisor-design 独立评审）** — 评审对象：`docs/design/TUI.md` §6「内层活动并入外层流（SUBAGENT-TAIL）」节（TUI.md:471-589）· 需求档 `docs/requirements/TUI.md` F8/N5/N6 · 批次档 §2（任务书）。核验基线：源码实测（subagent-blocks/-children/-panel、render-segments、subagent-freeze、mouse、fold-block）＋ `thincoder-vscode` 对位面抽查。事实面全部 file:line 落地。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Contract | 🟡 | 契约把「外层冻结时未收尾子块不悬空（closeOpenSubChildren 定格 stopped）」列为守护职责②（TUI.md:506-508），但删光子块渲染面后②无读者：冻结后迟到 relay 由 tombstone 独立丢弃（subagent-blocks.mjs:96-97、307-308/326-327/356-357），child.stopped 的唯一读者 subChildHeadRow 被删（subagent-panel.mjs:54）；leaf 的 model/started/doneAt/stopped/blocks/toolArgs/approval 同为写而不读；AC8（TUI.md:588）不含② | 契约显式标注②=防御性保留（无可见语义，不必设断言），并写明守护字段最小形状（正读者只有 done/currentTool/children），其余字段标为可留可删字面量——避免 coder 反向补实现 |
| 2 | Doc-state（本档） | 🟡 | 退役面残余不在回写清单：《TUI.md》§6 约束节 :609 仍写「子块/区块键天然身份化（sub.key / innerPath）」，与 :511/:539「折叠键只剩 sub-${key}」不一致；§10 as-of 行 :761 仍以「工具式头 + 独立折叠键」为决策（:744-745 有总括 supersede 注，但该行对前身 D-M8 有成例的表内注）。设计文档写域（TUI.md:558）与批次档回写清单（batch:107——只列 §1 地图行/§11/变更记录）均不含这两处 | 收口时 :609 随批改写、:761 行内补 supersede 注，并把两处加入交付后回写清单（不阻塞——正文已可判读现行态） |
| 3 | Doc-state（跨档承接） | 🟡 | VSC 推迟承接点引向「AGENT-LOOP 未决行」（TUI.md:543-544），该行为 AGENT-LOOP.md:14「R23 VS Code 镜像批评估（嵌套子代理子块形态 vs VS 子标）」——本批后 CLI 子块形态消失、其前提作废且不在任何回写清单；VSC 实况=嵌套活动有对位显示（chunk.sub 行首 dim 子标——thincoder-vscode/src/agent-tools/subagent-run.mjs:19-30、thincoder-vscode/webview/ui.js:48），「无对位面」准确表述应为「无子块小节形态（另有子标形态）」；本批后两端不再同构（CLI 内层行无归属标） | 父侧收口时改写 AGENT-LOOP.md:14（重述镜像批对齐目标）；并把 TODO.md:146 status「设计落档中」与 :142-145 现状核对一并改记（后者随批成历史快照） |
| 4 | Acceptance | 🟡 | 交付动作（batch:152）与 AC1..AC9（TUI.md:579-589）全为单测直驱/渲染断言，无真机（真实终端）目视步骤、无残余风险声明；本批为用户可见显示面变更，项目自身先例=「真机手感是唯一判据」（TUI.md:781）、折叠阈值曾两轮死于真机（TUI.md:755）。另：本批两档中未找到「未真机实跑 TUI」自报文字（grep 真机/实跑/未验 零命中）——该面是沉默而非声明 | 交付/验收加一步真机 smoke（spawn eng-coder 触发嵌套 explore → 目视 tail 含内层行、无 ❯ 小节头、面板高度下降），或显式记录「单测即验收口径」的残余风险 |
| 5 | Clarity（残留前提） | 🔵 | 合并后 fresh 判别按 leaf.currentTool（TUI.md:503）：同一外层块若出现两个并发内层子块交错，内层输出会并入末块的他人工具头块（pushBlock 仅按 kind 合并——subagent-children.mjs:79）；当前不可达（depth>0 仅 sync spawn——agent-tools/subagent.mjs:176），仅未来扩展的复核前提 | 契约或 D-ST 留一句「并发内层子块 = 已知失效前提」，供放开并行嵌套时复核（本批不需处理） |
| 6 | 受影响文件/行数（核验通过） | 🔵 | 受影响表（TUI.md:546-557）逐项与实测相符：subagent-blocks 451 / children 177 / panel 205 / render-segments 183 / freeze 169 / index 450 / mouse 250（尾随空行记法一致）；净 −95±40 行、无文件跨 500 硬帽（subagent-blocks ≈446 仍 >300 = 存量先例，本批净减不新增）。「mouse.mjs 零改」成立：命中链只读通用 `_foldToggle`/`_stopCol`（mouse.mjs:161-185），toggleFoldBlock 与键族无关（fold-block.mjs:37），全库无 sub-*/innerPath 键其它读者 | 无需动作（记录用） |
| 7 | Test coverage（可加强） | 🔵 | N5「内层内容计入外层 500 行环」未以含内层前缀的追加路径直接断言（用例 6 只写「追加超限」——内层计数属结构性推断）；用例 2 未断言「内层行无归属标」的可见后果（由「无子块头行」间接覆盖） | 可选：用例 6 序列混入内层前缀行；用例 2 加一条「tail 行文本不含 explore#N 归类前缀」负断言 |
| 8 | Scope/授权（记录用） | 🔵 | N6 授权读法：用户条件句针对「子块省略标记」（batch:23-24，取代后消失），设计按「块级省略标记仍在 → 计数真值一并修」分支执行（D-ST5 TUI.md:527-529 + batch:93 已显式记录）——属对齐读法而非静默扩面 | 收口向用户汇报时一句点明「块级省略标记保留且计数修真值」，闭环授权链（不阻塞） |

**核验要点（正面结论）**：四条路由改动（append 目标上移）在合并语义下可实施——done 守卫（leaf.done）与 fresh 判别（leaf.currentTool）均保住既有 F2/续接语义，内层事件剥除与 tombstone 守卫零改即可；渲染层净删（子块段/子块折叠键/树级 trim/独立计数）与「取代小节」裁定一致（requirements/TUI.md:26/43）；12 用例 / 9 AC 全部机器可验证，覆盖 F8/N5/N6 的三段承诺（含任意深度可达性）；既有测试面零冲突（test/ 无 R23 子块用例、无省略计数断言——与 batch:116 口径一致）。

**计数**：🔴 0 · 🟡 4 · 🔵 4。无阻塞项。

VERDICT: pass

（注：本次评审请求中 `## Approval Signal` 段未随附——token/designId 占位符未填值，无法逐字回显；请父侧以原始信号串补回显或按流程重放。）

### 轮次 2（评审子代理）

**复核轮（轮次 2——修正轮落地后）** — 核验对象：轮 1 七项修正的文本落地（TUI.md:506-517 / :552-555 / :576 / :580 / :602-608 / :628-629 / :781 · AGENT-LOOP.md:14-16 · 批次档 §2「修正轮同步」）+ 冻结面（12 用例 / AC1..AC9 / F8·N5·N6）+ 修正新面。范围声明：不含源码（实现未开始）；本轮只核「修复是否真实落地 / 是否引入新矛盾 / 凭证可签发性」。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（修正 #1 新面） | 🔵 | 守护字段最小形状注（TUI.md:512-517）与 :509 载体枚举、:514「可留可删」清单、:510-511/:565 的职责②保留存在域重叠——`model`/`stopped` 同列两侧，而 ②「closeOpenSubChildren 定格 stopped」声明保留：若照 :514 字面删 `stopped` 写路径，② 描述落空（有「②=防御性保留、不设断言」兜底，无验收后果） | 收口或实现时一句消歧（② 的写路径保留、其字段无正读者无断言——措辞由设计者定）；不阻塞 |
| 2 | 引用核验（修正 #5 新面） | 🔵 | TUI.md:508 现引 `src/agent-tools/subagent.mjs:215-220`；轮 1 §3 记录同事实引 `agent-tools/subagent.mjs:176`（batch:191）——两值必有一陈旧；本次评议范围不含源码，无法复核。另：本批新增文案的行号锚（TUI.md:508/:516-517/:553、AGENT-LOOP.md:15-16）与 AGENTS.md「设计档代码引用锚符号、不用行号」约定不一致（行号随编辑腐烂） | 实现时按 fail-when-mismatch 核对 `:215-220`（或改符号锚）；收口回写时顺带清理；不阻塞 |
| 3 | Coordination（父侧待办——R5） | 🟡 | 父侧待办未闭环（均已在批次档记录、非设计缺陷）：TODO.md 两条改记（batch:175——主 agent 指示未执行）· CHANGELOG · 交付后回写核验（TUI.md §1 地图行 / §11 完成史 / 变更记录终稿——batch:107；两处「不得回退」核验——batch:108）· 真机 smoke 执行（主 agent/用户——batch:171） | 收口时逐项闭环；不阻塞凭证签发 |

**核验要点（正面结论）**：七项修正逐条文本落地（非纸面）——①契约②注 + 守护最小形状（TUI.md:512-517）；②折叠键句（:628-629）+ §10 行内 supersede 注（:781）+ 批次档核验行（batch:108）；③VSC 表述改准（:552-555）+ AGENT-LOOP.md:14-16（+batch:105）；④真机 smoke（:602-608 + batch:171）；⑤并发内层子块失效前提（:506-508）；⑥用例 2 负断言（:576）；⑦用例 6 混入内层前缀行（:580）。冻结面不变：12 用例（TUI.md:575-586）· AC1..AC9（:592-600）· F8/N5/N6（requirements/TUI.md:26/36/37）；实现边界 / files 域照原表零动（batch:173）。修正未引入机制级矛盾：内层行并入 / 守护元数据 / 单环 500 / 计数真值 / VSC「无子块小节形态 · 另有子标形态」五组表述在受审四档内一致——无 Document ownership 🔴；受影响文件表与 AC 可验证性沿用轮 1 源码核验（照原表零动），无新增跨尺寸线项。修正新面（smoke 步骤 / AGENT-LOOP 未决行预写 / 失效前提注 / 两条断言加强）逐条量小且均已在批次档披露（batch:164-171）——未见未披露扩面。

**计数**：🔴 0 · 🟡 1 · 🔵 2。无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 03:50 用户批准**（原话："第7批批准"）——**两轮评审 + 两轮修正 + 父侧逐条核验后的正式签字**（严格序——本会话第二次实践）。

- 设计评审**轮次 1** pass（0🔴 · 4🟡 · 4🔵——发现表见 §3 轮次 1）→ 父侧裁决 **7 条采纳**（6 落档 + 1 用例加强）；
- 修正轮 #1 落地（id=5）经父侧逐条实文核验（11/11 关键串命中）；
- **轮次 2** 评审 pass（0🔴 · 1🟡 · 2🔵——§3 轮次 2）→ 裁决 **2 条文档项采纳** + **1 条父侧项**（已排入收口清单）；
- 修正轮 #2 落地（id=9）经父侧核验：**#1** 守护字段类目 A/B 消歧（② 写路径 = 保留写 / 无读者 / 不设断言；A=保留写路径 · B=可留可删字面量）· **#2** 引用核验结论：`:215-220` vs `:176` = **同快照异位**（后者 = 受限动作门文案，前者 = 门控本体 `wantAsync`——两者均真，非行号漂移）+ **符号锚 10 处**（TUI 7 + AGENT-LOOP 3，实测 10/10 命中）· 编号不变（12 用例 / AC1..AC9 / D-ST1..6 / F8·N5·N6）· 本批新行零超宽；
- **token 已签发**（轮次 2 评审返回；值不落档——运行时凭证）。

**批准范围**：F8 / N5 / N6 实现——**8 文件**（7 实改 + 1 新测试；`mouse.mjs` 零改）；净 −95±40 行。
**交付定义**（= 批次档 §2 修正轮同步块口径）：eng-coder 自审闭环 + 新档全绿 + 既有 TUI 测试零回归 +
**真机 smoke**（执行者 = 主 agent / 用户——新起 CLI 会话目视三查：tail 含内层行 / 无 `❯` 小节头 / 面板高度下降；
coder 无 TTY 不承担）+ 批次档 §5 自写。
**不含**：主 agent spawn 显示面 · VSC 对位面（无子块小节形态——另有子标形态，见 `AGENT-LOOP.md:14-17` 未决行）· CHANGELOG（发布面/父侧收口）。

**下一节点**：eng-coder（7 文件写域）→ 交付 → 父侧实跑验收（含真机 smoke）→ 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### SUBAGENT-TAIL 实施记录（eng-coder 自写——2026-09-11）

**交付摘要**：F8/N5/N6 落地——4 个 `routeSub*`（token / reasoning / toolCall / toolOutput）嵌套分支的 append 目标上移外层 `sub.blocks`（D-ST1 数据流合并）；子块载体降为守护元数据（done 守卫 / currentTool fresh 判别 / children 收尾遍历）；渲染面净删（`subChildHeadRow` / `subChildFoldKey` / `renderSubChildSections` / 递归 walk / 子块树签名 / 两处调用点）；trim 收窄为单载体最旧先行（D-ST4）；省略计数三缺陷修复（标记自重 / 幽灵行 / 块尾空行口径——N6）。写域 = **6 源 + 1 新测试档**；`mouse.mjs` 零改（核对通过——只读通用 `_foldToggle` / `_stopCol` / `_foldScroll`）；`docs/**` 零改。

**改动清单（file:line，as-of 交付）**

- `src/tui/subagent-blocks.mjs`：:19-21 import 面（去死绑定）；:46-47 · :205-208 · :215-216 · :283-284 注释改指 `docs/design/TUI.md §6`；:296-303 `routeSubToken` 内层文本并入外层；:306-319 `routeSubReasoning`；:321-346 `routeSubToolCall`（leaf 只存 fresh 判别元数据）；:348-371 `routeSubToolOutput`（fresh 判别照旧在守护载体层）。
- `src/tui/subagent-children.mjs`：:21-25 `countBlockLines` 显示行口径；:27-28 `isTrimMarker`；:30-58 `dropCarrierLines` 三缺陷修复（标记不占额度/不被丢/不计 N）；:60-65 `trimSubCarrier` 单环最旧先行；:67-95 `pushBlock`/`appendSubBlock`；:144-162 `closeOpenSubChildren`（② 写路径保留）。
- `src/tui/subagent-panel.mjs`：:15-18 模块头改指 SUBAGENT-TAIL；:33- 子块段三函数与调用点删除（净 −55 行）。
- `src/tui/render-segments.mjs`：:13 import 删；:112-122 `frozenSubSeg` 去子块树签名；:70-74 · :109 子块段调用删。
- `src/tui/subagent-freeze.mjs`：:74-75 · :81（② 语义保留——注释随批）。
- `src/tui/index.mjs`：:114 `state.subTasks` 注释随批。
- `test/subagent-tail-merge.test.mjs`（**新增**）：用例表 12 条 1:1（正常 4 / 边界 5 / 错误 3）。

**测试结果（先落盘再读）**

- `node --test test/subagent-tail-merge.test.mjs` → tests 12 / pass 12 / fail 0。
- `npm test > _t-subagent-tail.log 2>&1` → tests 363 / pass 352 / fail 0 / skipped 11（exit 0；slow-gate 零拦截）——既有 TUI 测试（`F-2 CLI ⏹ 门控` / `F-1 preview 删` 等）零回归。日志路径：`thincoder/_t-subagent-tail.log`。
- 口径注：末次跑的时点仓库存在**并行批次**改动（`src/prompts/*` · `test/prompts-async-guidance.test.mjs` · `test/eng-designer-role.test.mjs`——非本批写域），全量计数随其波动（359→311→363）；本批自身 diff 面恒为 6 源 + 1 新档，两次全量跑均 fail 0。

**自审闭环（AGENT-LOOP §18）**

- **内部 explore 偏差审计**（只读，对照设计档 §6 + 批次档 §2）：**VERDICT clean**——部分实现 / 静默简化 / 文档漂移 / 清单外改动四类均未发现（残项 O1-O3 均属父侧回写项或时点观察）。
- **内部 advisor 代码评审**：**pass**（🔴 0 · 🟡 0 · 🔵 5）→ 处置：**Fixed ×2**（死 import 移除；用例 1 补 `routeSubReasoning` 直驱 + kind 序列断言）· **Deferred ×3**（测试档行数超设计估计 → 父侧回写；D-ST6 注释口径残留 → 父侧裁决；两文件 >300 行 → 存量先例，拆分需独立批次）。
- **终态：clean**（审计 clean → 修正 → 评审 pass → `verify` passed）。

**逐需求透明表（Done / Simplified / Not done）**

| 条目 | 状态 | 证据（机器判据） |
|---|---|---|
| F8 | **Done** | 四处嵌套分支 append 上移（blocks:296-303 / :306-319 / :321-346 / :348-371）；面板/冻结只读 `sub.blocks`（panel:139-145 · render-segments:119-122）；用例 1/2/3/4/9 全绿 |
| N5 | **Done** | 折叠态每块 ≤4 行（头 1 + tail 3——用例 2/5）；展开 60% 封顶零动（用例 3）；内层行同环计数、单环 ≤500 显示行（用例 6） |
| N6 | **Done** | 三缺陷修复（children:21-58）；用例 6（N=100 真值）· 7（稳态 +K 恰 +K）· 8（标记恰 1 条、N 只随内容移除增长） |
| 守护保全（AC8） | **Done** | done 后迟到五路丢弃（用例 10）· tombstone 不复活（用例 11）· 内层非完成事件剥除（用例 12） |
| AC9 真机 smoke | **Not done**（执行者 = 主 agent / 用户） | 设计档明示 coder 无 TTY 不承担；待父侧新起 CLI 会话目视三查（tail 含内层行 / 无 `❯` 小节头 / 面板高度下降） |

**与设计的偏差**

1. 新测试档实测 **291 行**（设计估计 `+140 ± 40` → 上限 180）——内容为用例表 1:1 + 必要注释，无功能含义；建议父侧收口按实测回写或裁决接受。
2. D-ST6 注释修订按「**改动区域 + 显示契约指针**」落地（模块头 / 改动函数 / 删除面 → `docs/design/TUI.md §6`）；未改动区域的 `§19.5` / `§20` / `§24` 旧节号（存量全库性文档债）未随批迁移——与受影响表 ±10 行预算自洽，口径待父侧裁决。
3. 其余逐条（四处 append 上移 / 渲染净删 / 单环 trim / 计数真值 / 守护保全 / `mouse.mjs` 零改 / 文件清单）与设计一致，无偏差。

**未完成 / 存疑**：真机 smoke（父侧/用户）+ docs 回写（TUI.md §1 地图行 / §11 / 变更记录 + TODO / CHANGELOG——父侧收口）——均非本 eng-coder 域；无其它存疑。

**交付终态**：**clean**（12/12 新档全绿 · 全量 fail 0 · 审计 clean · 评审 pass · 真机 smoke 待父侧）。

## §6 验证与收口（父代理自写）

**2026-09-11 12:00 用户真机 smoke 过**（原话「7已经ok了，现在explore显示符合预期了」）——**AC9 完成**：三查（tail 含内层行 / 无 `❯ explore#N` 小节头 / 折叠态 ≤4 行）在当日实机运行中目视通过（触发面 = id=7 designer 的三个 explore 子代理 + id=9 coder 嵌套 spawn——10:50 重启后的进程加载本批代码，模块缓存面成立）。

- **交付面**：6 源 + 1 新测试档（12 用例）——四处 `routeSub*` 嵌套分支 append 上移（数据流合并）· 渲染面净删（−55 行）· 单环 trim 收窄 · 省略计数三缺陷修复 · `mouse.mjs` / `docs/**` 零改。
- **父侧实跑（验收时态）**：新档 12/12 · 全量 363/352/0（既有 TUI 用例零回归；同窗并行批次计数波动已登记）。
- **偏差裁定**：① 测试档实测 291 行 > 设计估计上限 180——**接受**（用例表 1:1 + 注释，无功能含义）② D-ST6 注释口径（改动区域 + 显示契约指针；未改动区域旧节号 = 存量库性文档债）——**接受**（存量不随批迁移）③ 两文件 >300 行——存量先例，拆分需独立批次（登记）。
- **内部闭环**：explore 偏差审计 clean · advisor 代码评审 pass（🔴0/🟡0/🔵5 → Fixed×2 + Deferred×3）· 终态 clean。
- **文档回写**（§5 遗留）：`docs/design/TUI.md` §1 地图行 / §11 / §6 / 变更记录 → designer 同步轮（id=11）**已落地核验**（`:22` 表头注 · `:40`/`:42`/`:47` 地图行 · `:391` 指针 · `:548` 偏差注 · `:621` 交付核验行 · `:821`/`:831` 完成史与变更记录 · 本档 §2 交付同步块 `:208`+）；TODO / CHANGELOG → 父侧随收口。
- **回写核验注（超宽口径——父侧实测钉口径）**：TUI.md 现 4 行 >300 **全为表格行**——`:30`(358)/`:820`(301) = 存量（HEAD 基线 2 行，仅位移）；`:40`(330)/`:42`(329) = 本轮回写的地图行（HEAD 侧无对应超宽行）。**表格行口径**：第 13 批条目 C（表格行豁免——in-flight）落地后整类不计；若按现行检查器读数，此 2 行会显示 +2。id=11 报告「全文零超宽」措辞不实——**非表格面新增超宽 0 成立**（其实质结论不变）。
- **§1 地图其余行漂移（id=11 存量观察——父侧域）**：pickers 500→107 · mouse 213→250 · key-modes +23 · tui-lifecycle +13 · wizard +20（非本批触及行）→ 已登记 `docs/TODO.md`（独立文档维护项）。
- **令牌链**：设计评审 token **已消费**（`consume-design`——链终）。

---
