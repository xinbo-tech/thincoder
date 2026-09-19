# 2026-09-18 · 核工具面三小缺陷（#46 + #43 + #55）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `89f205c8`；三条目 + #55 全落 · 三包 342/676/600 全绿 · H3 夹具已跑（未立））

### 1.1 批件（用户 2026-09-18 04:46「都开了吧」）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #46**：`subagent status` 在 `depth>0` **无显式门**（静默空 overview）——同族 `observe`/`send`/`escalate` 均显式拒 + 同文案（`subagent-actions.mjs:106-110` vs `:235-236`/`:287-288`/`:341`） | 与「拒翻 = fail-closed + 明示」口径相抵 |
| ② | **台账 #43**：异步面残留两则——`async-discard.mjs:69` `pruneQueue` 直读 `parent?.[queueKey]`（第四读面未吸收）+ `async-settle.mjs:70-74` 墓碑借用窄形（VSC 取消路径容器未核） | 今日零缺陷；处置 = 同式吸收 / 核验 |
| ③ | **台账 #55**：`git` 工具 `status` **false-clean**（多会话并发写仓时返回 no changes 而 porcelain 有 10M+1??） | **根因未定**——设计轮须先做**复现判定**（同步态 vs 并发态） |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。

### 1.3 边界

- **禁触**：提示词面 · 判据面引擎 · `provider/**` · 冻结批档。
- #55：**不可复现 ⇒ 登记 + 过渡口径**（父侧已用 `git status --porcelain` 过渡）——不得无证据改实现。

### 1.4 台账

- **#46** · **#43** · **#55**。

## §2 批次任务与设计修订（eng-designer）

### 2.1 设计落点（两块板 · 两节新增）

| 板档 | 新增节 | 覆盖条目 |
|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | **§6.25** 动作面 depth 门收口 + 异步面残留两则（18 表段 · 102 行 · 883 行总） | ①（#46）· ②（#43） |
| `docs/core/design/TOOLS.md` | **§6.12** git 工具读面 fail-closed（51 行 · 398 行总） | ③（#55） |

**成节模板（逐节实际形态——发现 10 收窄）**：§6.25 = 全模板（现状实核坐标 → 方案选型 → 接口契约（改前→改后逐字）→ 受影响文件清单（R24a）→ 关键决策 → 用例表 → 验收判据（逐条回指）→ 边界）；
§6.12 = **机制 + 判据节**（现状实核坐标 → 复现判定 → 假设×区分性实验 → 修法 → 调用方普查 → unborn 枚举 → 验收 A7–A13 → 测试面 → 过渡口径 → 边界）——**用例与逐档文件清单归本档 §2.4 / §2.5**（一次性材料口径 = `TOOLS.md:359-360`）。两块板变更记录各一行（同日落）。

### 2.2 条目裁定表（三则）

| # | 条目 | 现状实核 | 裁定 | 落点 |
|---|---|---|---|---|
| ① | 台账 **#46**：`subagent status` 无 depth 门 | `subagent-actions.mjs:106` `executeStatusAction` 无门；七动作对照 = `observe:235-236` / `send:287-288` / `escalate:341` / `cancel`（`subagent-async.mjs:246-248`）/ `panel` freeze（`subagent-panel.mjs:87-89`）**五处显式拒**，`spawn` depth-legal ⇒ **唯一缺口 = status** | **补同款 depth 门 + 同文案族**（锚取现行可解析节号 `AGENT-LOOP-SUBAGENT.md §6.7.2`） | §6.25 ①/接口契约① |
| ② | 台账 **#43-①**：`pruneQueue` 第四读面直读 | `async-discard.mjs:69` `parent?.[queueKey]`；三处调用点恒传完整 agent ⇒ 今日零缺陷；同族三读面（dequeue / refill / queue-refresh）已载体吸收（af 批） | **同式吸收**（`carrierField`）——理由 = 与三面同式、单点、完整 parent 零回归；否决「登记不改」= §6.10 ④ 已定口径、留白即同一机制两态 | §6.25 ② |
| ③ | 台账 **#43-②**：墓碑借用窄形 | `async-settle.mjs:70-74`；**窄形可达已实核** = VSC ⏹ 传合成 parent（`panel-messages.mjs:234-242`），`thincoder-vscode/src/agent.mjs:141-146` 只预建六款容器（不含 `_asyncTombstones`，该字段仅 `:147-153` 绑为访问器）⇒ 会话首次墓碑写经合成 parent 即丢；退化面 = `depInfo`→`unknown`（依赖者等，无假阳）+ 重复取消确认退化为 unknown-id 错 | **同式吸收（借用规则扩张）**：父无自有 Map 且载体在场 ⇒ 落载体 + **同容器别名回父字段**（保 §2.3 写回义务）；否决「核验不改」= 窄形可达；否决「仅落载体不回写」= 违写回义务 | §6.25 ③ |
| ③′ | 台账 **#55**：`git` 工具 status false-clean | **可复现（同步态 · 100% · 零并发）**——工具 cwd=会话 cwd（`dispatch.mjs:389`，子代继承 `subagent-spawn.mjs:349`）= `D:\teamcode`（非仓）；`runGitRaw`（`tools/git.mjs:15-21`）吞错（`stdio` 丢 stderr、catch 取 `e.stdout`）⇒ `""`；`status` 分支（`:114-115`）读作「无改动」 | **读面 fail-closed 单点**：`runGit`（`shared.mjs:442-455`）+ `runGitRaw` 失败 ⇒ **throw**（dispatch 渲染 `Error:` 且 ok:false，`dispatch.mjs:446-468`）；十处读动作调用点**零改** | `TOOLS.md §6.12` |

### 2.3 #55 复现判定与实验设计（设计轮实测读数）

| 读数 | 路径 | 结果 |
|---|---|---|
| 工具路径（会话 cwd） | `runGitRaw("D:/teamcode",["status","--porcelain"])` | `""` ⇒ 渲染 `(clean — no changes)` = **假洁净复现** |
| 工具路径（仓 cwd） | `runGitRaw("D:/teamcode/thincoder", …)` vs 同刻 bash `git status --porcelain` | **逐字一致**（12 行 `M`）⇒ 无并发/缓存面缺陷 |
| 非仓 cwd 底层 git | 退出码 **128** · stdout `""` · stderr `fatal: not a git repository (or any of the parent directories): .git` | 失败被吞（stderr 未入消息） |
| 工具实测（本席直调） | `git` 工具 `status`（无参）⇒ `(clean — no changes)`；同参 + `workdir:"thincoder"` ⇒ 正确列出 12 处 `M` | 双因复合确认 + 绕行验证 |
| 缓存使能面 | `core.fsmonitor` / `core.untrackedCache` / `core.preloadIndex` | **三键全空**（无陈旧缓存假设的使能面） |
| unborn 仓（`git init` 零提交 · scratch 仓直读） | 八读动作退出码 / stderr 首行（发现 6 设计轮实测） | `status` / list 族（tag·branch·stash·remote·worktree）**exit 0**；`log` / `diff` / `show` / `blame` **exit 128**（stderr 各异——非「not a git repository」）⇒ 逐动作期望形态表入 `TOOLS.md §6.12`（A11/A12） |

**假设 × 区分性实验**：H1（cwd∉仓）与 H2（吞错）**已立**（上表）；H3（并发 · index.lock / fsmonitor / racy-clean）**未立**——判别夹具 = ① scratch 仓持 `.git/index.lock` 后读 `git status --porcelain` 的退出码/stdout ② 仓内三读对账（`--porcelain` vs `--no-optional-locks` vs `git diff --name-only`）；**夹具须仓外 scratch 仓，按纪律不在设计轮执行，留实施轮**（设计档 §6.12 已载步骤与判别读数）。
**过渡口径（修复落地前）**：收口判定一律 `git status --porcelain`（bash，仓内）；工具侧临时以 `workdir` 指向仓根绕行——**已入档**（`TOOLS.md §6.12`）。

### 2.4 受影响文件表（R24a · 行数 = `wc -l` · as-of 2026-09-18）

| 文件 | 现 | Δ | 改动 | 软线处置（>300 · 发现 9） | 端 |
|---|---|---|---|---|---|
| `thincoder-core/agent-tools/subagent-actions.mjs` | 488 | +3 | ① depth 门（→ 491 **< 500 硬限**） | **在册**（`core-hygiene.test.mjs` `SOFT_LINE_REGISTRY:31`）；拆分计划 = 设计 §6.25 受影响表（候选面 = escalate 同步段 ≈157 行抽 `subagent-escalate.mjs`）——**本批只登记不执行** | 核 |
| `thincoder-core/agent-tools/async-discard.mjs` | 143 | +2/−1 | ② `pruneQueue` 读面 `carrierField` + import 补名 | 未触（→144） | 核 |
| `thincoder-core/agent-tools/async-settle.mjs` | 284 | +6/−1 | ③ 借用规则扩张（**父字段主 + 载体别名**——发现 4）+ 头注一句 | 未触（→289） | 核 |
| `thincoder-core/tools/git.mjs` | 375 | +6/−1 | ③′ `runGitRaw` fail-closed + `stdio` 改 pipe（行内改——不增行；发现 5） | **既有超软线 · 在册**（`:36`）——本批增量小 / 结构未变 ⇒ 拆分另议（消解条件 = 该档下次实质改动） | 核 |
| `thincoder-core/tools/shared.mjs` | 455 | +8/−4 | ③′ `runGit` fail-closed + `stdio` 改 pipe（行内改） | **既有 · 在册**（`:37`）——同上 | 核 |
| `thincoder-core/test/tool-seams.test.mjs` | 267 | +14/−2 | ③′ 非仓 ⇒ 抛错断言 + 仓内洁净对照（F-2 用例改判）+ A11 unborn 对照 | ≈279——未触 | 核 |
| `thincoder-core/test/async-family.test.mjs` | 225 | +18 | U5 / U6 / **U6b**（③） | ≈243——未触 | 核 |
| `thincoder-core/test/async-discard.test.mjs` | 234 | +12 | U3（②） | ≈246——未触 | 核 |
| `thincoder-cli/test/subagent-observe-send.test.mjs` | 305 | +8 | U1 / U2（①） | **既有超软线**（端侧测试档——核 hygiene 域外）；本批增量小 / 非结构改 ⇒ 拆分另议 | CLI |
| `thincoder-vscode/test/async-parity.test.mjs` | 454 | +10 | U2 对侧回归（①）+ **V2** 绑定腿（③ · 发现 12） | **既有超软线**（距 500 硬限 ≈36 行）；本批非结构改 ⇒ 拆分另议（先行候选 = 用例族切面） | VSC |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 779 | +117 | §6.25 + 变更记录 + 修正轮 1 | 文档档——行数限制不适用（用户 2026-09-16 裁定） | 档 |
| `docs/core/design/TOOLS.md` | 345 | +98 | §6.12 + 变更记录 + 修正轮 1 | 同上 | 档 |

**越限判定（发现 8 / 9 收正）**：源档无一越 500 硬限（最高 = `subagent-actions.mjs` 491，余量 9 行）；**越 300 软线档逐档处置见上表「软线处置」列**——核档在册三档（`SOFT_LINE_REGISTRY:31/36/37`）· 端侧测试档两档存量超线（本批增量小 ⇒ 拆分另议）· 文档档不受行数限制。
`subagent-actions.mjs` 拆分计划 = 设计 §6.25 受影响表（候选面 = escalate 同步段 ≈157 行抽 `subagent-escalate.mjs`）；**本批只登记不执行**（**登记项**——§6.20.8-3 仅是该批的边界声明，**不是拆分计划本体**）。

**实测收正（父侧直改 · 可 revert · 承实施轮 §5.6）**：上表 Δ 与终值 = 设计预测；**实测终值** = `subagent-actions` **493**（距 500 余 **7**）· `async-discard` **143** · `async-settle` **293** · `git.mjs` **379** · `shared.mjs` **467** · `tool-seams` **299**（软线余 **1**）· `async-family` **254** · `async-discard.test` **253** · CLI `subagent-observe-send` **330** · VSC `async-parity` **485**（距 500 余 **15**）。三条「拆分另议」的余量前提按此重列（`tool-seams` 贴软线 = 下批触档前切分）。

### 2.5 验收标准（逐条机判 —— 回指条目）

| # | 判据（机判形态） | 回指 |
|---|---|---|
| A1 | `executeStatusAction({}, {depth:1, agent})` ⇒ error 串**逐字相等** = `status is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP-SUBAGENT.md §6.7.2)`；七动作族源码 `only available at depth 0` 命中计数 **5 → 6**（既存五处逐字零改 + `status` 新增一处）——`grep -rn "only available at depth 0" thincoder-core/agent-tools/{subagent-actions,subagent-async,subagent-panel}.mjs` ⇒ 逐档 `4 / 1 / 1`（改前 `3 / 1 / 1`；族外 `advisor.mjs:147` 不计）；**返回形** ≡ observe/send 既存（`{status:"error", error}` 对象形） | ① / #46 + 评审发现 2 / 11 |
| A2 | `depth` 缺省 / `0` ⇒ status 返回体与今日逐字同（CLI + VSC 两侧现有 status 用例全绿） | ① 父侧零回归 |
| A3 | 部分 parent 夹具（`{_asyncSubagents, history}` + `history._asyncQueue`）+ 丢弃 queued 条目 ⇒ 队列剔除 + 存活 `position` 重编号 1..n（今日 no-op ⇒ 先红） | ② / #43-① |
| A4 | 完整 agent 形（自有 `_asyncQueue`）⇒ 剔除行为逐字同今日 | ② 回归 |
| A5 | 窄形夹具（合成 parent 无自有 Map + history 无容器 → 写；另一携同 history 的合成 parent 读）⇒ `tombstoneOf` **命中**（今日 miss ⇒ 先红） | ③ / #43-② |
| A6 | CLI 形：`carrierField(parent,"_asyncTombstones") === parent._asyncTombstones`（两条读取路径同一容器） | ③ · `AGENT-LOOP.md` §2.3 |
| A5b | 绑定腿（V2）：合成 parent 写 ⇒ 经绑定形 agent 读 ⇒ 命中（协调 VSC 侧 V2 用例） | ③ / 复核轮补 |
| A6b | 首写腿（U6b）：无自有 Map + `history` 在场 ⇒ 主容器 = 父字段、`history` 侧同一容器 | ③ / 复核轮补 |
| A7 | 非仓 cwd ⇒ `status` **抛错**（经 dispatch ⇒ `Error:`）且消息含 `not a git repository` + 该 cwd，**不含** `clean — no changes` | ③′ / #55 |
| A8 | 仓内 cwd 有改动 ⇒ 输出与同刻 `git status --porcelain` 逐条一致 | ③′ |
| A9 | 真洁净仓（`git init` 空仓）⇒ 仍 `(clean — no changes)`（零假阳） | ③′ |
| A10 | 抽样 `log`（非仓 cwd）⇒ 抛出而非 `(no commits)`（十处读动作同判据） | ③′ |
| A11 | unborn 仓（`git init` 零提交）⇒ `status` = `(clean — no changes)`；`log` / `show` / `diff` / `blame` ⇒ 抛错；list 族不变（逐条 = `TOOLS.md §6.12` unborn 表）；谓词反证：非仓消息含指引、unborn 不含 | ③′ / #55 + 评审发现 6 |
| A12 | 调用方普查（`runGit(` / `runGitRaw(` 13 处三分）· 套件级：三包全量 `npm test` 失败集合 ⊆ 批前失败集合（口径同 A-MS6） | ③′ + 评审发现 1 |
| A13 | H3 夹具 = 实施轮必跑（`.git/index.lock` 退出码 / stdout + 仓内三读对账）——读数落 §5；跳过 = 判据缺失 | ③′ / F-8 + 评审发现 7 |

**核验读数（设计轮已落）**：`runGitRaw`（仓 cwd）≡ 同刻 bash porcelain（逐字）· 非仓 cwd exit 128 / stdout 空 · 工具 `status` 无参 = clean / `workdir:"thincoder"` = 12 M · 三键缓存配置全空。

### 2.6 本批不做（边界）

- 不动提示词面（含 `tool-docs/*.md` 工具描述——内容权归主 agent）· 不动判据面引擎（`scripts/doc-check*`）· 不动 `provider/**` · 不动冻结批档 / `_archive/**` / 参照树。
- 不做 `git` 跨仓自动发现（工作区根 ⇒ 唯一子仓自动下钻 = 新语义，须用户裁定）——本批只做 fail-closed。
- 不收敛 VSC 侧同机制重复实现（`thincoder-vscode/src/agent-tools/async-discard.mjs`——D-AD7 已登记，另案）。
- 不执行 `subagent-actions.mjs` 拆分（拆分计划 = 设计 §6.25 受影响表·候选面具名——本批只登记不执行）；不动 `spawn` 的 depth 语义。

### 2.7 发现表（逐条在册——含「非阻断」项）

| # | 发现 | 类型 | 处置 |
|---|---|---|---|
| F-1 | **既有 depth 门文案的旧编号死指针**：`AGENT-LOOP.md §7.2`（observe/send `:236`/`:288`）· `§19.5 D-M6`（cancel `subagent-async.mjs:247`）· `§19.6 D-P2`（panel `subagent-panel.mjs:88`）——现行两档节号均不可解析（设计档现为 §6.x / §7 = 关键决策记录） | 一致性（死指针） | **未自改**：改既有门文案 = 改面向模型的既存字符串（语义面）；本批新增门**不照抄旧锚**（取 `AGENT-LOOP-SUBAGENT.md §6.7.2`）；旧三处归主 agent 裁定目标节号（可并 #42/#54 死指针族） |
| F-2 | **现有用例把假洁净写成期望值**：`thincoder-core/test/tool-seams.test.mjs:88-106` 在**非仓** temp 目录（`withTempDir` = `mkdtempSync(tmpdir())`，实测非仓）断言 `status` = `(clean — no changes)` | 缺陷入测（假绿） | **本批内处置**（③′ 修法含用例改判 + 对照夹具）；此处登记为证据行 |
| F-3 | VSC 侧 `async-discard.mjs:77` 仍用**禁用形** `writeTombstoneTo(parent.history ?? parent, …)`（设计 §6.20.3 明禁其用于核）——VSC 形下写 `history` ⇒ 无即时缺陷 | 已知重复登记（D-AD7） | 不处置（另案收敛） |
| F-4 | VSC 载体绑定（`thincoder-vscode/src/agent.mjs:141-146`）预建六款容器但 **不含 `_asyncTombstones`**（`CARRIER_FIELDS` 含该字段、仅 `:147-153` 绑为访问器）——`#43-②` 窄形可达的直接原因 | 端装配口径（根因面） | 本批以**核内借用规则扩张**吸收（端侧零改）；「端侧补预建」= 更彻底方案 —— 登记，另案裁定 |
| F-5 | **需求档三层链缺口**：三条目（#46 / #43 / #55）在 `docs/core/requirements/AGENT-LOOP.md` · `TOOLS.md` 内均**无判据行**（现由台账条目承载） | 需求档缺口（需求档笔归主 agent） | **上报主 agent**：建议补需求条目（判据可直接取本档 A1–A13）；批档 §2 ↔ 设计档 ↔ 需求档三方同源链待补此环 |
| F-6 | `subagent-actions.mjs` 488 → 491，贴 500 硬限（余量 9 行） | 结构债 | 登记（拆分计划 = 设计 §6.25 受影响表·候选面具名；本批不执行） |
| F-7 | 工作区根 `D:\teamcode` **非 git 仓**（`git rev-parse` fatal）、工作仓 = 子目录 `thincoder` —— 会话 cwd 与该仓根结构性错位（#55 触发条件） | 语义面（跨仓发现） | 本批只做 fail-closed；「工作区根 ⇒ 子仓发现」须用户裁定（F-7 上报） |
| F-8 | **并发假设未复现**：H3（index.lock / fsmonitor / racy-clean）本环境无使能面（三键全空）；scratch 仓夹具须**仓外写**，按纪律不在设计轮落 | 验证缺口（工具可证） | 夹具步骤 + 判别读数已入 `TOOLS.md §6.12`；**留实施轮执行**；当前结论以 H1+H2 为准 |
| F-9 | 实测期间工作树持续变动（同刻读数 10 M+9 ?? → 12 M；untracked 批档被并行会话提交）——多会话共写一仓为**环境事实**（非缺陷） | 观察 | 无处置（#55 归因证据的旁证：并发不解释 cwd 相关差异） |

**结论**：三则设计**证据齐备**（#55 = 同步态可复现，非「不可复现」路径 ⇒ 走设计修法而非仅登记）；无「无证据改实现」项；F-1 / F-4 / F-5 / F-7 为**域外 / 待裁定**项，未自改。

### 2.8 设计评审修正轮 1 落位（12 条 · 2026-09-18 · eng-designer）

**依据** = 本档 §3 轮次 1（changes-required · 🔴 2 · 🟡 8 · 🔵 2 = 12 条）；父侧裁定 = **全部接受**（含 🔵 2 条）。**逐条落位**（号 → 改动；坐标 = 落笔后实读）：

| # | 落点 | 处置 |
|---|---|---|
| 1 🔴 | `TOOLS.md` §6.12 新增「调用方普查」块——表 5 行（13 处逐落点三分：工具层读动作 11 · 已 try/catch 2）+ 计数自洽句（11 = 十处 + status 本点）+ 套件级判据（→ A13） | ✅ |
| 2 🔴 | A1 计数改判：§2.5 A1 + `AGENT-LOOP-SUBAGENT.md` §6.25 A1 两处同改——「**5 → 6**（既存五处逐字零改 + `status` 新增一处）」+ 可执行命令与搜索根（三档 ⇒ `4 / 1 / 1`，改前 `3 / 1 / 1`）+ **族外不计**（`advisor.mjs:147` 与测试档断言会额外命中 ⇒ 搜索根须为三档） | ✅ |
| 3 🟡 | §6.7.2 表后补「depth 可用性」行（`status` 与 observe/send/escalate/cancel/panel freeze 同为 depth 0 专有，`spawn` 例外）——锚指向规则本体 | ✅ |
| 4 🟡 | §6.25 接口契约 ③ 改 **父字段主 + 载体别名**（实核：CLI agent 无预建 `_asyncTombstones` ⇒ 首写即走本分支；CLI `agent.history` **非稳定载体**——`context.mjs:309/:317/:332/:483` · `explore-distill.mjs:148` · `session.mjs:301/:438` 整体替换）⇒ 主容器挂父字段（与今日落点逐字同 ⇒ 「CLI 零回归」可断言），`history` 侧写同一容器（VSC 合成 parent 仍跨调用存活）；新增 U6b 用例 + A6b 判据 + 方案选型 ③-1 行与窄形段同步 | ✅ |
| 5 🟡 | `TOOLS.md` §6.12 修法表补第 3 行（`stdio` 捕获——`["ignore","pipe","ignore"]` → `["ignore","pipe","pipe"]` 两处）+ **spawn 失败回退形态**（无 stderr ⇒ 取 `e.message` 首行，禁空尾） | ✅ |
| 6 🟡 | `TOOLS.md` §6.12 新增 unborn 枚举表（八动作 scratch 仓实测读数：`status` + list 族 exit 0；`log`/`diff`/`show`/`blame` exit 128）+ **认定谓词**（128 ∧ stderr 含 `not a git repository` ⇒ 附指引；unborn 不附）+ A11/A12；批档 §2.3 表补同读数行 | ✅ |
| 7 🟡 | `TOOLS.md` §6.12 新增「H3 夹具 = 实施轮必跑项」块（① index.lock 退出码/stdout ② 仓内三读对账 ③ 读数落 §5）+ A13（跳过 = 判据缺失） | ✅ |
| 8 🟡 | §6.25 受影响表 `subagent-actions.mjs` 行给**候选拆分面**（escalate 同步段 `executeEscalateAction` + `touchedFilesNote`，as-of `:332-488` ≈157 行抽 `subagent-escalate.mjs`——照 panel 段先例）+「本批只登记不执行」句；**五处指向 §6.20.8-3 的措辞收正**（设计档 2 = 受影响表行 + 边界段 · 批档 3 = §2.4 行 + §2.6 边界行 + F-6 行）——口径 = 「§6.20.8-3 = 该批边界声明，非拆分计划本体」 | ✅ |
| 9 🟡 | 本档 §2.4 表增设「**软线处置**」列（12 行逐档）：核三档在册（`SOFT_LINE_REGISTRY:31/36/37`）· 端侧测试两档存量超线（本批增量小 ⇒ 拆分另议）· 未触档给预估 · 文档档「行数限制不适用」；「越限判定」段同改 | ✅ |
| 10 🟡 | 本档 §2.1 成节模板句收窄——§6.25 = 全模板 / §6.12 = **机制 + 判据节**，用例与逐档文件清单归本档 §2.4 / §2.5（一次性材料口径 = `TOOLS.md` §8.2） | ✅ |
| 11 🔵 | §6.25 新增 **A1b**：拒返回形 ≡ observe / send 既存拒形态（引坐标 `subagent-actions.mjs:236` / `:288`——JSON `{status:"error", error}` 对象形；escalate `:341` 的 `Error:` 字符串形**不在同款族**） | ✅ |
| 12 🔵 | §6.25 新增 **V2 用例 + A5b 判据**：合成 parent 写 ⇒ 经**绑定形 agent** 读命中；并记明**绑定目标坐标**（`thincoder-vscode/src/agent.mjs:147-153` 访问器闭包捕获 `:140` 分支 `history` 形参；合成 parent 携同一数组 `panel-messages.mjs:234-242`） | ✅ |

**随单同步**：两设计档变更记录各一行（修正轮 1）；本档 §2.4 Δ 列同步（`async-settle` +6/−1 · `async-family` +18 · `tool-seams` +14/−2 · `async-parity` +10 · 两文档档 +117 / +98）；§2.5 判据编号延至 **A1–A13**（F-5 行回指同改）。

**修正轮的形态说明（透明登记）**：发现 4 的处置为**形态修正**（v1「落载体 + 别名回父」→ 「父字段主 + 载体别名」）——依据 = 实核发现「CLI `history` 非稳定载体」使 v1 的「CLI 零回归」在首写分支不可断言；修正后 §2.3 写回义务（写侧以父对象字段为入口）与 ③ 修复目标（VSC 合成 parent 跨调用存活）同时满足，CLI 路径与今日逐字同。该形态变更已入设计档接口契约（含改前→改后与理由段），无新语义夹带。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 完整性 / 可行性 | 🔴 | **#55 对共享 helper 的 fail-closed 未做调用方普查**：`runGit`（`thincoder-core/tools/shared.mjs:442-455`）是核共享 helper（VSC `context.mjs` 亦引核），其失败语义由「返回空串」改「throw」后，凡未捕获的调用方在失败输入下由静默转抛错；设计只列两个零回归核验点（`TOOLS.md:313`），而**默认会话 cwd 本身就是该失败输入**（工作区根 `D:\teamcode` 非仓——`TOOLS.md:285` · 批档 `:114` F-7）⇒ 属环境常态而非边角；是否已穷举调用方未被证明。 | 在 §6.12 补调用方普查表（按 `runGit(` / `runGitRaw(` 全仓 grep 列出，逐调用方分类：已 try/catch ｜ 容错兜底 ｜ 改后新增抛错），第三类逐条给处置；验收侧补一条套件级判据（三包 `npm test` 失败集合 ⊆ 批前失败集合——同族先例 `AGENT-LOOP-SUBAGENT.md:713` A-MS6）。 |
| 2 | 验收判据 | 🔴 | **A1 的 grep 计数与修法自相矛盾**：`批档:84` 与 `AGENT-LOOP-SUBAGENT.md:832` 均写「七动作源码 grep `only available at depth 0` = **5 处**（`spawn` / `status` 除外）」，但本批正是给 `status` 增门、且其文案逐字含该串（`:779`）⇒ 修后命中数 = **6**：按字面该判据**必红**（若本意是「改前基线」则须改述）；另未给 grep 命令与搜索根，不可机判。 | 改判据为「= 6 处（`spawn` 除外）」或改述为「既存五处文案逐字零改 + `status` 新增一处」，并给出可执行命令与搜索根（例：`grep -rn "only available at depth 0" thincoder-core/agent-tools/`）。 |
| 3 | 文档归属 / 清晰 | 🟡 | 新 `status` 文案的锚 = `AGENT-LOOP-SUBAGENT.md §6.7.2`（`:779`），但该节（`:32-70`）只列七动作的参数/返回/阻塞，**不含任何 depth 可用性规则**（该规则唯一住所 = 新 §6.25）⇒ 模型可见锚可解析但指不到内容。 | 在 §6.7.2 的动作表补一行可用性（`status` 与 observe/send/escalate/cancel/panel 同为 depth 0 专有，`spawn` 例外），使锚指向规则本体（该面归属节）。 |
| 4 | 清晰 / 完整性 | 🟡 | **③「借用规则扩张」对 CLI 形首写路径无覆盖**：新 else-if（`:794-796`）在「父无自有 Map + `history` 在场」时把容器建在 `history`，CLI 形同样满足该前置（除非 CLI 恒预建自有 Map）；而 U6 夹具（`:826`）**预设**「CLI 形（agent 自有 Map）」⇒ ③-1 所称「CLI 零回归」（`:769`）在该分支无任何用例。 | 显式写出前提（CLI agent 恒有自有 Map / `history` 为稳定载体），或补一例「无自有 Map + `history` 在场 ⇒ 首写落 `history`、`agent._asyncTombstones` 与 `carrierField(parent,…)` 同一容器、`tombstoneOf` 命中」。 |
| 5 | 清晰 / 可行性 | 🟡 | #55 的消息契约要求「+ stderr 首行」（`TOOLS.md:304`）、A7 要求消息含 `not a git repository`（`:315`），而根因②自述现行 `stdio: ["ignore","pipe","ignore"]` **丢弃 stderr**（`:289`）——接口契约未写 stdio 改动 ⇒ 按现契约无法产出该消息。 | 在 §6.12 修法表补一行：捕获 stderr（如 `stdio: ["ignore","pipe","pipe"]`，`runGit` / `runGitRaw` 两处），并给出 spawn 失败（无 stderr）时的消息回退形态。 |
| 6 | 完整性 / 边界 | 🟡 | **「有仓但无提交」（unborn branch）未枚举**：A9 夹具恰为 `git init` 空仓（`TOOLS.md:316`）——同仓内 `log` 一类读动作原渲染 `(no commits)` 占位、现因非零退出（`fatal: … does not have any commits yet`）改抛错；A9「零假阳」只覆盖 `status`；且「非仓失败附加指引」（`:306`）的判定谓词（如何认定「非仓」）未写。 | 补该行（unborn-branch 各读动作的期望形态：抛错 or 保留占位）+ 认定谓词（退出码 128 ∧ stderr 含 `not a git repository`，或全失败统一附指引），并纳入 A 判据。 |
| 7 | 验收判据 / 可追溯 | 🟡 | **H3 判别夹具承诺「留实施轮」但无对应判据**：F-8（`批档:115`）与实验表（`TOOLS.md:292-298`）已载步骤，A7–A10（`:315-316`）无一行覆盖 ⇒ 实施轮若跳过无判据变红（静默省略面）。 | 补一行实施轮判据（scratch 仓持 `index.lock` ⇒ 记退出码/stdout；仓内三读对账一致），或写明「§6.12 实验表 = 实施轮必跑项」的验收口径。 |
| 8 | 受影响文件 / 结构 | 🟡 | **`subagent-actions.mjs` 的拆分计划指针悬空**：`批档:65`/`:78`/`:113` 与 `AGENT-LOOP-SUBAGENT.md:807`/`:840` 均称「拆分计划承 §6.20.8-3 登记」，但 §6.20.8 第 3 条（`:505`）与 §6.20.4 未触碰行（`:449`）只写「不触碰（488 行）」，**无候选拆分面** ⇒ 本批修改的越软线档实际无拆分计划（判据 #8 要求此类档在设计中带拆分计划；正例对照 = `subagent.mjs`，`:680-682`）。 | 在 §6.25 受影响文件表内给出候选拆分面（如七动作分派段 / panel 段抽档）+「本批只登记不执行」句，并收正指向 §6.20.8-3 的三处措辞。 |
| 9 | 受影响文件 / 结构 | 🟡 | 其余越 300 软线的被改档在本批表中无软线处置：`thincoder-core/tools/git.mjs` 375→381（`:68`）、`thincoder-core/tools/shared.mjs` 455→459（`:69`）、`thincoder-vscode/test/async-parity.test.mjs` 454→460（`:74`）、`thincoder-cli/test/subagent-observe-send.test.mjs` 305→313（`:73`）；批档只判「无一越 500 硬限」（`:78`）。 | 在 §2.4 表增设「软线处置」列（拆分计划 或「他档已登记 + 指针」），区分「本批新增越线」与「既有挂债」——避免 455 行级档被读作未评估。 |
| 10 | 方法论 / 完整性 | 🟡 | **批档 §2.1 声明的成节模板与 §6.12 实际内容不符**：§2.1（`批档:37`）称两节「均含…关键决策 → 用例表 → 验收判据（逐条回指）→ 受影响文件清单（R24a 行数）→ 接口契约（改前→改后逐字）」；§6.12（`TOOLS.md:274-323`）无关键决策块、无用例表、无本档 R24a 表、验收为散文条目（无回指列）、修法为散文式（非改前→改后逐字）。 | 二者取一对齐：或按 `TOOLS.md:359-360`（一次性材料归批次档）把 §2.1 模板句收窄为「§6.25 全模板 / §6.12 机制 + 判据，用例与文件清单见 §2.4 / §2.5」；或补齐 §6.12 缺块。 |
| 11 | 清晰 | 🔵 | 「同款门」只锁消息串、未锁返回形态：五处既存拒的返回形（JSON `status:"error"` 对象 vs throw）在本评审范围内无引文（`:750-752` 仅给文案骨架），U1/A1（`:821`/`:832`）只断消息逐字 ⇒「同款」依赖未证前提。 | 在 §6.25 接口契约内引一处兄弟动作的既存返回形，或补断言「`status` 拒的返回形 ≡ 兄弟动作形态」，使「同款」可机判。 |
| 12 | 验证缺口 | 🔵 | ③ 的窄形可达性以 VSC 合成 parent 为据（`:754-756`），但用例只覆盖「合成 parent → 合成 parent」（U5，`:825`）；「合成 parent 写 → **绑定 agent** 读」（`agent.mjs:147-153` 访问器腿）无用例，且 `parent.history` 与访问器所绑载体是否同一对象在范围内**未核实（unverified）**。 | 补该腿用例或判据（经合成 parent 写墓碑 ⇒ 经绑定 agent 读命中）；若不可直测，在 §6.25 记明访问器绑定目标坐标。 |

VERDICT: changes-required

计数：🔴 2 · 🟡 8 · 🔵 2 · 合计 12

### 轮次 2（评审子代理）

上轮 12 条（🔴 2 · 🟡 8 · 🔵 2）逐条回读复核 = **全部落位**（0 条未修，逐条证据见报告）；本轮仅余连带 / 新增 5 条（下表）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档状态（上轮 4 的连带残留） | 🟡 | **批档 §2.2 裁定表 row ③ 仍是 v1 形态**：`thincoder/docs/batches/2026-09-18-toolface-fixes.md:46` 逐字「**同式吸收（借用规则扩张）**：父无自有 Map 且载体在场 ⇒ 落载体 + **同容器别名回父字段**（保 §2.3 写回义务）」——落位后的权威描述 = `thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md:774`「③-1 | 借用规则扩张（父无自有 Map 且载体在场 ⇒ **主容器落父字段（今日落点）+ 载体侧写同一容器**）」+ 接口契约 `thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md:799-801`；`thincoder/docs/batches/2026-09-18-toolface-fixes.md:147` 已把旧形标为 v1「v1「落载体 + 别名回父」→「父字段主 + 载体别名」」⇒ 记录层残留（设计层一致、更正已登记 ⇒ 非机制级冲突，不阻断）。 | 把 §2.2 row ③ 的括注同步为「主容器落父字段 + 载体侧写同一容器」，或该行加「v1 形，修正见 §2.8」脚注。 |
| 2 | 判据镜像完整性 | 🟡 | **设计新增 A5b / A6b 在批档 §2.5 无对应行**：`thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md:850`「A5b | 绑定腿（V2）：合成 parent 写 ⇒ 经绑定形 agent 读 ⇒ 命中…」· `thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md:852`「A6b | 首写腿（U6b）：无自有 Map + `history` 在场 ⇒ 主容器 = 父字段、`history` 侧同一容器」；批档 §2.5（`thincoder/docs/batches/2026-09-18-toolface-fixes.md:87-99`，A1–A13）无此两行（A5 `:91` / A6 `:92` = U5 / U6 旧形），而同档 `:145` 自称「§2.5 判据编号延至 **A1–A13**」⇒ 若收口只按 §2.5 判会漏「绑定腿 / 首写腿」两判据（设计层仍为约束 ⇒ 非阻断）。 | §2.5 补 A5b / A6b 两行（或并入 A5 / A6 行文），与设计表逐条对齐。 |
| 3 | 文档卫生（行号指针） | 🔵 | **两处行号指针因本轮增量失效**：① `thincoder/docs/core/design/TOOLS.md:354`「A13 调用方普查 · 套件级：三包全量 `npm test` 失败集合 ⊆ 批前失败集合（口径同 A-MS6 · `AGENT-LOOP-SUBAGENT.md:713`）；H3 夹具读数已落 §5（实施轮必跑项）。」——A-MS6 现于 `thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md:716`（`:713` = 「| A-MS3 | ② | `cd thincoder-core && node --test test/spawn-gates.test.mjs` ⇒ exit 0…」）；② `thincoder/docs/batches/2026-09-18-toolface-fixes.md:38`「（一次性材料口径 = `TOOLS.md:359-360`）」——该两行现为 §6.12 的过渡口径 / 边界行（`thincoder/docs/core/design/TOOLS.md:359-360`），目标两行（§8.2「**一次性批次材料**」）现于 `thincoder/docs/core/design/TOOLS.md:398-399`；同批 §2.8 `:141` 用节级引用「`TOOLS.md` §8.2」（正确）。 | 收口时改指现行行号，或统一改节号引用。 |
| 4 | 文档卫生（数字对齐） | 🔵 | **§2.1 文档总量未随修正轮对齐**：`thincoder/docs/batches/2026-09-18-toolface-fixes.md:34` 记「§6.25 …（18 表段 · 102 行 · **883 行总**）」、`:35` 记「§6.12 …（51 行 · **398 行总**）」，而 `:77-78` / `:145` 记两文档档 **+117 / +98**（⇒ 896 / 443）——同一批内两套总量并存、未标时点。 | 更新 §2.1 括号数字，或标注「设计轮快照（修正轮后见 §2.4）」。 |
| 5 | 文档卫生（计数口径） | 🔵 | **unborn 实测计数与表列不一致**：`thincoder/docs/batches/2026-09-18-toolface-fixes.md:58` 记「**八读动作**退出码 / stderr 首行」，同格枚举 + 设计表（`thincoder/docs/core/design/TOOLS.md:333-340`：status · log · diff · show · blame · tag/branch/stash/remote/worktree list）实为 **10 个动作名**——计数口径未对齐（判据 A11/A12 按设计表逐条判 ⇒ 不影响落位）。 | 对齐「八 / 10」计数（补一句口径，或按表列动作数改数）。 |

计数：🔴 0 · 🟡 2 · 🔵 3 · 合计 5

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-09-18 04:46「都开了吧」= 全批授权；评审轮 pass + 复核轮 PASS（14 条 · 余 2🟡+3🔵 非阻断）。

## §5 实现（eng-coder）

**轮次**：initial（设计已过评审 + 修正轮 12 条 + 复核轮 PASS）。**终态**：`clean`（内部偏差审计 1 轮 + advisor 代码评审 1 轮 → 修正轮 1 已落；遗留 0 🔴 / 0 must-fix）。口径 = 按设计实施、禁自创。

### 5.1 交付摘要（三条目 · 落点实读）

| 条目 | 落点（file:line · 实读） | 改后形态 |
|---|---|---|
| ① #46 | `thincoder-core/agent-tools/subagent-actions.mjs:107-112` | `executeStatusAction` 首部 depth 门（同款门 + 同文案族 + JSON `{status:"error",error}` 对象形）；族锚 = `(AGENT-LOOP-SUBAGENT.md §6.7.2)` |
| ② #43-① | `thincoder-core/agent-tools/async-discard.mjs:35`（import）· `:69` | `pruneQueue` 读面改 `carrierField(parent, queueKey)`——第四读面与三读面同式；调用点零改 |
| ③ #43-② | `thincoder-core/agent-tools/async-settle.mjs:69-83` | `writeTombstone`：父无自有 Map 且载体在场 ⇒ **主容器落父字段 + `history` 侧写同一容器**（`:78-79`）；借用 / 其余分支零变 |
| ③′ #55 | `thincoder-core/tools/shared.mjs:439-467` · `thincoder-core/tools/git.mjs:13-25` | 读面 fail-closed 单点：非零退出 / spawn 失败 ⇒ throw；`stdio` 双改 `["ignore","pipe","pipe"]`；maxBuffer 溢出保留部分输出；非仓谓词（128 ∧ stderr 首行含 `not a git repository`）附 workdir 指引；spawn 失败取 `e.message` 首行（禁空尾）；十处读动作调用点零改 |

**消息形态实测**（真实触发面 = 会话 cwd `D:\teamcode` 非仓）：`git status --porcelain failed: fatal: not a git repository (or any of the parent directories): .git (cwd: D:\teamcode) — pass workdir to run git inside a repository`

### 5.2 决策透明表

| # | 事项 | 处置 | 理由 |
|---|---|---|---|
| D1 | ③′ 消息构造落 `shared.mjs` 单点 `gitFailureMessage` | 单点导出 + `git.mjs` import（语义逐字同设计） | 两处逐字抄 = 分叉隐患（D2 单源） |
| D2 | #55 三组断言合并为一个 test（`tool-seams.test.mjs:112-138`） | 合并样板，**断言零删** | `core-hygiene.test.mjs:97-104` 覆盖 `test/` 子树 ⇒ 该档预算 31 行 |
| D3 | `resolve(cwd ?? ".")` | 采纳（审计备注） | `resolve(undefined)` 在失败路径抛 TypeError |
| D4 | `??` → `\|\|`（消息回退链） | 采纳（advisor 🔵#7） | 使设计「禁空尾」成代码保证 |
| D5 | `git.mjs:221` 死文案 | 不采纳（上报） | 设计修法表 #5「十处调用点零改」 |

### 5.3 先红 / 后绿读数

| 用例 | 先红（实施前实跑） | 后绿 |
|---|---|---|
| #55 A7/A10 | ✖ Missing expected rejection（假洁净路径） | ✅ |
| #55 A11/A12 | ✖ Missing expected rejection: log（unborn） | ✅ |
| #55 A8/A9 · #59（F-2 改判） | ✅ 回归面 | ✅ |
| U3（②） | ✖ actual `['71','72','73']` / expected `['72','73']` | ✅ |
| U5 / U6 / U6b（③） | ✖ 跨调用 miss（actual null） | ✅ |
| U1/U2（① CLI） | ✖ depth 1 实返 overview | ✅ |
| V2/U2（③+① VSC） | ✖ 访问器腿 miss（actual null） | ✅ |

### 5.4 H3 夹具读数（A13 必跑）

仓路径 `C:\Users\liwei\AppData\Local\Temp\tc-h3-7Mz45V` · git `2.55.0.windows.3`；① `.git/index.lock` 在位 ⇒ `git status --porcelain` **exit 0** · stdout `" M a.txt\n?? b.txt\n"`（与移除后逐字同）⇒ 并发不致假洁净（H3 未立）；② 三读对账：scratch 仓 `--porcelain` ≡ `--no-optional-locks`；工作仓 169 行逐字同、未暂存 ` M` 31 项 ≡ `diff --name-only` 31 项双向零差 ⇒ 无缓存假洁净；③ 结论 = 归因维持 H1+H2。

### 5.5 三包全量 `npm test`（A12 · 批前集合先录）

| 包 | 批前 | 批后 | 对照 |
|---|---|---|---|
| core | 330 · fail 0 | 342 · fail 0 | ∅ ⊆ ∅ ✅ |
| cli | 675 · fail 0 | 676 · fail 0 | ∅ ⊆ ∅ ✅ |
| vsc | 599 · fail 0 | 600 · fail 0 | ∅ ⊆ ∅ ✅ |

### 5.6 机检读数

A1：`only available at depth 0` 三档 = 4 / 1 / 1 = **6**（改前 3 / 1 / 1 = 5）。doc-check：锚 悬空 172 · 拟新增 4 · 迁移期引文 103 · 行宽 6 条——全存量 ⇒ 归属零新增。行数实测（预测→实测）：`subagent-actions` 491→493 · `async-settle` 289→293 · `git.mjs` 381→379 · `shared.mjs` ≈459→467 · `async-discard` 144→143 · `tool-seams` ≈279→299 · `async-family` ≈243→254 · `async-discard.test` ≈246→253 · CLI 测试档 ≈313→330 · `async-parity` ≈460→485。

### 5.7 审计与代码评审

- 内部偏差审计（explore 只读 1 轮）：DEVIATIONS ×2（均记录层）；「部分实现 / 静默简化 / 超清单」= 空；8 项逐条符合。
- advisor 代码评审（1 轮）：VERDICT **pass** · 🔴 0 · 🟡 3 · 🔵 4；采纳 D3/D4（修正轮 1，复跑被触档 24 pass / 0 fail），其余按 doc-face / 设计零改口径上报。
- 终态：`clean`。

### 5.8 域外 / 待父侧处置

1. 批档 §2.4 / 设计 §6.25 数值与余量按 5.6 实测回填。
2. 批档 §2.5 缺 A5b / A6b 两行（本席按设计实现）。
3. 测试档计数口径：批档实列五档（任务书「六档」无对应）。
4. F-1 / F-3 / F-4 / F-7 与 `git.mjs:221` 死文案：原样在册。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：三条目 + #55 全落——① `status` depth 门（先红：depth 1 实返 `overview` ⇒ 后绿）② `pruneQueue` 第四读面同式吸收（先红：actual `['71','72','73']` / expected `['72','73']`）③ 墓碑借用规则扩张（**父字段主 + 载体侧写同一容器**；先红：跨调用 miss）③′ `git` 读面 fail-closed 单点（throw + stdio 双改 pipe + 非仓谓词 + spawn 回退禁空尾）。
- **H3 夹具（A13 必跑）= 已执行**：`.git/index.lock` 在位 ⇒ `status --porcelain` **exit 0 且输出与移除 lock 后逐字同** ⇒ **并发不致假洁净（H3 未立）**；仓内三读对账双向零差（169 行逐字同 · 31 ≡ 31）⇒ 归因维持 **H1（cwd∉仓）+ H2（吞错）**。
- **修后实态**：`D:\teamcode` 下 `git status` ⇒ throw（`… fatal: not a git repository … (cwd: D:\teamcode) — pass workdir to run git inside a repository`）· 仓内正常。
- **读数**：三包全量绿（core **342** · cli **676** · vsc **600** · fail 0；套件级判据 = 失败集合 **∅ ⊆ ∅**）· A1 计数 **5 → 6**（逐档 4/1/1）· 机检本批零新增 · 尺寸三处上限未越。
- **提交**：`89f205c8`（10 档 · +182/−15）。
- **终态**：审计 1 轮零发散 · 代码评审 1 轮 pass（🔴 0；D3/D4 采纳 · D5 不采纳上报）· **clean** · §5 已写入（3561 字符）。
- **残留（登记/路由）**：① Δ/余量按实测回填（**父侧直改落位** · 可 revert）② §2.5 补 A5b / A6b 镜像行（**父侧直改落位**）③ `git.mjs:221` 死文案（设计明文「调用点零改」⇒ 不采纳，原样在册）④ `tool-seams` 贴软线（299/300）⇒ 下批触档前切分 ⑤ F-1 / F-3 / F-4 / F-7 原样在册。
- **三账**：台账 **#46 / #43 / #55** 已核销；批档冻结；收口日期 2026-09-18。

