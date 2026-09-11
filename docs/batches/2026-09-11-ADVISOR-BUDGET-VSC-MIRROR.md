# 评审上下文预算 VSC 镜像（同款 120K 常量退场）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 14:10 · 来源 = 用户 13:18「120K 那个是 bug…你检查一下」的 **VSC 镜像面**（第 25 批设计的「需父侧排程」项 1–4——同款缺陷**实测确认存在**）。

---

## §1 讨论（主 agent 记）

### 需求来源

- 第 25 批（CLI 端 120K 硬编码修复）designer 实测确认：VSC 仓**同款缺陷存在**——
  `thincoder-vscode/src/advisor/compaction.mjs:18`（同款常量）+ `loop.mjs:22/116/121`（同款守卫链）；
- 第 25 批设计已列「需父侧排程」四项（VSC 源 + VSC 测试 + VSC 设计档 §15 + TODO 池行）；
- 父侧立项（VSC 镜像批——同源语义、各端独立实现、不做 byte-identical）。
- 需求面：`thincoder/docs/requirements/ADVISOR-CONVERGENCE.md` **§10**（F27/N19——第 25 批已落，本批引用不重述）。

### 本批条目（1 条——三方一致锚）

| # | 条目 | 内容 |
|---|---|---|
| **M1** | **VSC 评审上下文预算同款修复** | 常量退场 + 预算按 `providerSpec`（VSC 经 `src/specs.mjs` 现成面）派生 + 两处守卫消费——**语义同源（比例式：判死线 = floor(窗口×0.8)、压缩触发 = ×0.8）、本端文本自持**；用例 T-CB1–T-CB6 同型 + `test/files.mjs` 登记 |

### 已核事实（供 designer 免重复勘察）

- CLI 侧设计权威 = `docs/design/ADVISOR-CONVERGENCE.md` **§16**（第 25 批——选型/契约/OOM 论证/决策 D-CB1–6——**只读参照**）；
- VSC 现状锚（as-of 2026-09-11，须现场复核）：`src/advisor/compaction.mjs:18`（常量）+ `src/advisor/loop.mjs:22/116/121`（守卫链）；
- VSC 的 spec 派生面 = `src/specs.mjs`（`providerSpec` 现成——第 25 批已核）；
- VSC 设计档落点 = `docs/design/ADVISOR-CONVERGENCE.md` §15（新节）；
- 双端纪律：各端独立实现、语义同源、零跨仓 import；VSC 测试新档须登 `test/files.mjs`（显式清单）。

### 范围边界（明确不做）

- 不改判定族/尾文案/提示词/压缩本体（与第 25 批同口径）；不碰 CLI 仓；不改 VSC 仓其它档；
- **不得自行新建档**（必须新建 → 停下打回主 agent；本批预授权：VSC 设计档 §15 新节 + 1 新测试档——如判需其它新档先打回）。

### 待设计裁定

1. 派生实现面（与 CLI §16 的语义对齐声明 + VSC 特有形态——`specs.mjs` 接线式样）；
2. VSC 守卫链两处消费点逐点落法（对照 CLI §16.3）；
3. 受影响文件全清单（行数/增量）+ 用例 T-CB1–6 同型化 + AC 回指；
4. 与 CLI 语义差异点声明（若有——须逐点理由）；
5. 纪律核对（双端纪律 · 既有锁零伤——VSC `advisor-chain-guards` 等）。

### 状态

**已收口 2026-09-11**（父侧立项——用户 bug 报告的第 25 批镜像面）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求（CLI 侧 §10，第 25 批已落）+ VSC 设计 / 测试三层（VSC 设计档 §15）已落档，待设计评审；**零待裁定项**）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/ADVISOR-CONVERGENCE.md` §10（F27 / N19——**第 25 批已落，本批引用不重述**）；设计 + 测试三层 = `thincoder-vscode` 仓设计档 `ADVISOR-CONVERGENCE（VSC 仓）§15`（本设计者已落）。

**本批条目（1 条——三方一致锚）**：

| # | 条目 | 覆盖需求 |
|---|---|---|
| M1 | VSC 评审上下文预算同款修复（120K 常量退场 + `providerSpec` 派生 + 两处守卫消费） | F27 / N19（需求档 §10） |

**五问裁定（结论——详 VSC 设计档 §15.0）**：

1. 派生实现面：`providerSpec` 经 `src/specs.mjs` 现成面（re-export）；`advisorContextBudget(provider)` 单参数、两档命名 `{limit, compactAt}` 照 CLI；OOM 论证 = 本端一句 + `ADVISOR-CONVERGENCE（CLI 仓）§16.4` 指针（不重述）。
2. 两处消费点：循环体外一次性派生 `const budget = advisorContextBudget(provider)`；`loop.mjs:116` 触发 → `budget.compactAt`；`:121` 判死 → `budget.limit`（分支结构与尾文案零改）。
3. 受影响文件：实施域 4 项（2 改 + 1 新测档 + 1 登记）；用例 T-CB1–T-CB6 同型；AC-CB1–AC-CB5 回指 F27 / N19。
4. 与 CLI 语义差异：**零**（逐面核对 VSC §15.7）；形态差异 3 处如实登记（导入面 / `providerSpec` 实现形 / 文本自持）。
5. 纪律：双端语义同源 · 本端原文自持 · 零跨仓依赖；VSC 既有锁零伤（常量消费面仅 `loop.mjs`）；`test/files.mjs` 登记。

**实施域（eng-coder 写域——4 项）**：

| # | 文件（VSC 仓） | 变更 |
|---|---|---|
| 1 | `src/advisor/compaction.mjs` | `MAX_CONTEXT_TOKENS` 退场 + `CONTEXT_LIMIT_RATIO` / `COMPACT_TRIGGER_RATIO` + `advisorContextBudget` 纯函数 + `providerSpec` 导入（自 `../specs.mjs`） |
| 2 | `src/advisor/loop.mjs` | 导入换名 + 预算一次性派生（循环体外）+ 两处消费（`:116` / `:121`） |
| 3 | `test/advisor-context-budget.test.mjs` | 新增（T-CB1–T-CB6；逐条判据 = VSC 设计档 §15.11 用例表 + §15.4–§15.5 契约） |
| 4 | `test/files.mjs` | 新测档登记（+1——显式清单，不登记不跑） |

**验收标准（逐条可机判——详 VSC 设计档 §15.12）**：AC-CB1 派生与两档 · AC-CB2 核心缺陷闭合
（1M 不判死 / 128K 与未知仍截断）· AC-CB3 接线面双向（provider 级 `context` 覆盖翻转）· AC-CB4 零回归
（`npm test` 快层全绿 + 既有 `advisor-chain-guards` / `advisor-guard-completion` 两族测档零回归 + CLI 仓零改动）·
AC-CB5 旧帽退场（`src/` 零残留）+ VSC 仓 `check-doc-width` 新增违规 0。验收命令：`cd thincoder-vscode && npm test`；
新档单跑调试 = `node --test test/advisor-context-budget.test.mjs`。

**明确不做**：不改判定族 / 六条尾文案 / 压缩本体 / 结算·凭证·超时语义；不改 `estimateTokens`；不新增 advisor 配置项；不碰 CLI 仓（实施面与文档面）；不碰 VSC 设计档 §13 / §14 已交付契约；零 UI 面。

**措辞纪律**：单参数 / 两档命名照 CLI（`advisorContextBudget` / `limit` / `compactAt`）；尾文案与压缩提示零新造。**打回口**：实施中发现同源设计缺陷 → 停下报告，不静默偏离。

**登记 / 父侧项**（VSC §15.13 已列——coder 不动）：需求 §10.4「VSC 镜像随批」登记行收口 · CLI 设计档 §16.8 #1 收口 · `docs/TODO.md` 池行推进——均父侧排程。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

第 26 批（VSC 镜像 · 评审上下文预算）设计评审·轮次 1——审查对象 = VSC 设计 §15 全节（13 小节）+ §2 载体表 :37 + 变更记录尾行（对照 = CLI 设计 §16）；发现表如下：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 一致性对照（跨档数值） | 🟡 | T-CB2 同型用例的上下文量级标签跨档不一致：VSC :936 / :1124 记「~19.7 万 tokens」（复算 12×64K÷4 = 196_608 ✓）；CLI :1200 / :1211 记「~175K tokens」——同夹具（12 × 64K 字符工具结果）下后者与算术不符（差 ~12%） | 报告项（父侧修正落后侧标签；VSC 侧复算自洽，可先行不动） |
| 2 | Clarity / 完备性（差异声明） | 🔵 | §15.7 逐面表（:1049–:1056）未列「量纲」「系数导出形态」两面——§15.4（:1014–:1016）已声明同形 | 可选补两行，使零差异审计面与 CLI §16.3 契约条目全对齐 |
| 3 | Evidence（读域限制） | 🔵 | 代码级锚（§15.2 file:line、§15.8 行数 160/278/55、§15.7 #2「实测等价」）在本评审读域外——unverified（非否定） | host 侧交付审计抽查；本批无阻塞 |

**计数**：🔴 0 · 🟡 1 · 🔵 2；重点核①–⑥：①✅ ②✅ ③✅ ④✅ ⑤✅（除 #1）⑥ 无 🔴。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 16:10 父侧代签**——用户 12:48 授权（**13:38 延展至队列排空**）；三条件**齐备**：

- **轮次 1**：**pass**（🔴 0 · 🟡 1 · 🔵 2——§3 轮次 1）；**无需修正轮**（🟡 = CLI 侧 T-CB2 标签跨档不一致——**由第 25 批修正轮 id=59 覆盖**；🔵2 = 可选/宿主核验面）；
- **token 已签发**（值不落档）。

**批准范围**：VSC 实施域 4 项（`src/advisor/compaction.mjs` · `src/advisor/loop.mjs` · `test/advisor-context-budget.test.mjs` 新 · `test/files.mjs` 登记）。

**遗留（批准时登记）**：① §15.13 父侧排程面（CLI 需求 §10.4 / CLI 设计 §16.8 #1 两处 1 行收口——登记待 CLI 侧文档任务）；② estimateTokens CJK 低估（另批登记）。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成**（2026-09-11——4 项落笔 + 6 用例全绿 + 快层全绿 + 内部审计 clean + 内部代码评审 pass/2×🔵 已逐条裁决）。

### 落笔（4 项——逐字照设计 §15.4/§15.5）

| # | 文件（VSC 仓） | 变更 | 实测行数（口径 `N lines total`） |
|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | `MAX_CONTEXT_TOKENS` 退场 + `CONTEXT_LIMIT_RATIO`（导出）/`COMPACT_TRIGGER_RATIO`（私有）+ `advisorContextBudget(provider)` 纯函数 + `providerSpec` 自 `../specs.mjs` 导入 | 160 → **171**（设计预计 ~176） |
| 2 | `src/advisor/loop.mjs` | 导入换名（`advisorContextBudget` 入列）+ 循环体外一次性 `const budget = advisorContextBudget(provider)`（`startTime` 同区带）+ 两处消费（触发 → `budget.compactAt`；判死 → `budget.limit`） | 278 → **280**（设计预计 ~280） |
| 3 | `test/advisor-context-budget.test.mjs` | 新增 T-CB1–T-CB6（6 例——设计 §15.11 同型） | 新 → **155**（设计预计 ~130–140） |
| 4 | `test/files.mjs` | 新测档登记（+1——显式清单） | 55 → **56**（设计预计 56） |

### 测试实测值（快层 `npm test` 终态——先落盘再查）

- 汇总：tests **421** · pass **420** · fail **0** · skipped **1**（= `test/slow.mjs:27`——slow 归册用例在快层按设计 skip，与本次改动无关）· 无 slow-gate 拦截 · 退出码 0；
- T-CB1–T-CB6 **6/6 绿**（定向 `node --test test/advisor-context-budget.test.mjs` 同绿）；既有 `advisor-chain-guards`（T-VG1–15）+ `advisor-guard-completion`（T-VG16–21）合跑 **21/21 绿**；
- 数值锚实测：1M → `{800_000, 640_000}` · 128K/未知 → `{102_400, 81_920}` · `context:64` → `{52_428, 41_942}`（与设计 §15.4 表逐值吻合）；夹具量级 12×64K ≈ 19.7 万 tokens（19 条）/ 45×64K ≈ 73.8 万 tokens（69 条）；
- `node scripts/check-doc-width.mjs`：新增违规 **0**（宽度 + V1/V2/V3 一致性）。

### AC-CB1–AC-CB5 透明表

| AC | 结论 | 机判证据 |
|---|---|---|
| AC-CB1 | ✅ | T-CB1 绿：五组输入 × `{limit, compactAt}` 逐断言 + `CONTEXT_LIMIT_RATIO === 0.8` + 纯函数面锚（确定性 + 导入面唯一 `providerSpec` + 无 I/O/全局状态静态扫描） |
| AC-CB2 | ✅ | T-CB2 绿（1M ~19.7 万 tokens 不以截断尾收尾 + 终稿在位 + `advisorIncompleteMarker → null`）+ T-CB3 绿（128K 与未知模型同量上下文 → 族前缀逐字 `Advisor: context window limit reached (` + `context_limit`） |
| AC-CB3 | ✅ | T-CB4 绿（`context:64` 收紧判死 / `context:1024` 放宽不判死——同量上下文双向翻转，证 `providerSpec` 接线面） |
| AC-CB4 | ✅ | T-CB5 绿（`[Context compacted:` 在位 + 压缩后 ≤22 条 + 无截断尾 + 正常收尾）+ 两族守卫 21/21 + 快层 421/fail 0 + CLI 仓零改动（scoped `git status --porcelain -- src/advisor/compaction.mjs src/advisor/loop.mjs` 空） |
| AC-CB5 | ✅ | T-CB6 绿（`Reserve headroom to avoid OOM` 零残留 + `MAX_CONTEXT_TOKENS` 在 `src/` 递归扫描零命中 + 循环消费 `advisorContextBudget(provider)`）+ `check-doc-width` 新增 0 |

### 红线逐条守

尾文案 / 判定族六 kind / `compactMessages` 本体 / `estimateTokens` / `timeoutMs` 语义零改（git diff 仅 4 处 hunk：导入面 + 派生行 + 两处比较值；`[Context compacted:` 提示与 `compactMessages(messages, pinned)` 调用点原位零改）；CLI 仓零写入；未 commit；未发起评审。

### 审计与评审轮次（AGENT-LOOP §18）

- **内部 explore 分歧审计**：1 轮 → `AUDIT: clean`（4 条信息性观察，非偏差；含 CLI 侧实现尚在途的事实注记）；
- **内部代码评审（advisor）**：1 轮 → `VERDICT: pass`，🔴0 · 🟡0 · 🔵2——裁决：① T-CB5 就地断言不足以锁定「真裁剪」→ **Fixed**（就地补 `messages.length <= 22` 硬断言，`test/advisor-context-budget.test.mjs:136`；复跑 6/6 + 快层 421/fail 0）；② 设计档 §15.8 新测档行数注记（~130–140）与实测（155）漂移 → **Deferred**（文档域非 coder 写权——父侧 / 设计者收口时校准）。

### 偏差披露

1. 新测档实测 **155 行** > 设计预计 ~130–140（预计区间偏窄；≤500 档位无虞，如实披露）；compaction 实测 171 < 预计 ~176；
2. T-CB1 附纯函数静态锚、T-CB5 附真裁剪断言 = 评审 / AC 判据强化，非语义新增（不触判定族 / 尾 / 压缩本体）；
3. 无其它偏差；4 项写域 = 批准范围（无文件外改动）。

## §6 验证与收口（父代理自写）

**2026-09-11 18:05 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **6/6 绿**（T-CB1–T-CB6）· 既有两族锁 **21/21 绿** · 快层 **421/420/0**（1 skip = slow 归册，无关）· 退出码 0；
- **父侧抽核**：`MAX_CONTEXT_TOKENS` 零残留 ✓ · `advisorContextBudget` 导出 ✓ · `loop.mjs` 两处消费（`compactAt`/`limit`）✓ · 新测档 154 行/6 例 ✓ · `files.mjs` 登记 ✓；
- `check-doc-width` 新增 0；CLI 仓零改动 ✓。

### 逐条验收结论

- **AC-CB1–AC-CB5 全过**（透明表 + 机判证据——含 T-CB5 真裁剪硬断言 `≤22 条`）；**Simplified 零 · Not done 零**；
- 语义零差异（与 CLI §16 对照——差异仅 §15.7 登记的 3 处形态）；判定族/尾文案/`compactMessages`/`timeoutMs` 零改。

### 需求池核销

- 需求 §10.4「VSC 镜像随批」登记 → **交付落地**（镜像实现 + 测试）；**登记行收口（1 行）待 CLI 侧文档任务**（遗留 ①）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：VSC 设计档 §15 + 变更记录 ✓ · 计数：新测档行数注记（~130–140 → 实测 155——遗留 ②）✓ · 指针：§15 ↔ 需求 §10 ↔ 用例 ✓ · 变更记录：两档 ✓ · 待办：无池行（本批为镜像面）✓

### 遗留项

1. **登记行收口 ×2（父侧排程）**：CLI 需求 §10.4「VSC 镜像随批」行 + CLI 设计 §16.8 #1 同款——各 1 行注记（待 CLI 侧文档任务）；
2. VSC 设计档 §15.8 新测档行数注记校准（~130–140 → 实测 155——文档域，随遗留 ① 同批）；
3. `estimateTokens` CJK 低估修正——另批登记（不清）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
