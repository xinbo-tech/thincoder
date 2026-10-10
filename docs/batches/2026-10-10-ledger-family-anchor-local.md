# 2026-10-10 · ledger-family-anchor-local
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 13:05 现场（另一 CLI 端 d:/test：台账为空，状态行却显示「台账 3·26」）+ 13:05/13:12 裁定「发现不是向上的！不能向上走！」+ 13:18「先把那个向上爬的事情处理干净」= 点火。
> 台账 = #1217（core · 轻通道轮）。前情 = docs/batches/2026-10-04-light-ledger-ghost-root.md §1（已收口 2026-10-04）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 笔 1 · 族发现向上爬拆除（锚本地）（2026-10-10）

- **披露**：轻通道（缺陷修复——实现与用户多轮裁定「发现不向上」∥ 需求档 F2 逐字「打开容器根（其下含项目）⇒ 显示这些项目的合计」相抵）；触及 `thincoder-core/ledger.mjs` `discoverFamily`；rollback = revertable。
- **红相**（修复前实测 · 现场复现）：`discoverFamily('D:/test')` ⇒ projects = [`D:\repos`] ⇒ `marker = 台账 3·26`（= `D:\repos` 的读数；`d:/test` 自身键 `61ca071934e3fa74` 无库）= 用户屏幕现场。根因 = `ledger.mjs:100-107` 容器回退循环——锚自身无库 ⇒ 逐级向上至盘根层、认领同盘键控兄弟。
- **落形**：回退循环 ⇒ 锚本地单行（`ledgerChildren(resolve(anchor))`）；函数 docstring 随正（删除「向上最近」句）。
- **绿相 / 走查**：见下方走查段（批内件红绿对 + 旧批件回归 + 现场复跑）。
- **冻结**：待收口轮（轻通道收口 = 设计形式化 → 独立评审 → 核销）。

### 笔 1 走查（2026-10-10 13:2x · 父侧实跑）

（待填——红绿对读数 ∥ 旧批件 T47–T54 回归读数 ∥ 现场 `discoverFamily('D:/test')` 复跑读数）

### 笔 2 · 用户授权（自动跑 · 2026-10-10 13:27）

- **用户原话**：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。
- **父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 13:27 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。
- **轮形注**：本笔 1 以轻通道形开轮；因轻通道通路对本会话机械不可达（会话锚 = 工作区；该缺陷 = 本批并件 ②「闸基面」，台账 #1218），本批以**全链形**收口（设计 §2 → 评审 §3 → 批准 §4 → 实施 §5 → 收口 §6）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-10（initial 轮条目①∥② · 修正轮 1 #1–#6 已落——逐号见 §2.10）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 1. 本批条目（覆盖）

| # | 条目 | 台账 | 需求回指 | 性质 |
|---|---|---|---|---|
| ① | 台账族发现·向上爬拆除（回退改锚本地） | #1217（在途） | `docs/core/requirements/ENGINEERING-MODE-V2.md:622`——§13.3（FR24）第 1 条 = F2「状态行极简标记」修订句 | 缺陷修复——实现向需求句对齐（F2 句不涉改） |
| ② | 轻通道代码笔闸·工作区锚可达（并件 · 父侧裁定并入） | #1218（父侧归口——行面） | `docs/core/requirements/LIGHT-CHANNEL.md:65-71`——§2.5 F-LC5 判定句 ① ∥ ② | 缺陷修复——实现向判据对齐（需求句不涉改） |

需求核检：F2 句 ∥ F-LC5 判定句皆具体、可判、覆盖本批两形；两形验收 = 下方 AC 逐腿回指（需求档笔不涉）。

### 2. 出处

- ①——用户裁定：2026-10-10 13:05 ∥ 13:12 原话「发现不是向上的！不能向上走！」；13:18「先把那个向上爬的事情处理干净」（批档 `:3` 载）。现场 = 另一 CLI 端 `d:/test`：台账为空，状态行却显「台账 3·26」。需求回指 = F2 句「打开容器根（其下含项目）⇒ 显示这些项目的合计」——`D:\repos` 不在 `d:/test` 之下，原实现与「其下」相抵。
- ②——父侧原位复现（2026-10-10 13:2x）+ 台账 #1218；用户裁定（父侧转述口径，与①同一「发现不向上」裁定的机制面延伸）：候选项目的发现须纯向下——锚自身 → 直接子目录一层（不递归、不沿祖先链上找）。

### 3. 红绿相

①（族发现锚本地）

- 红相（实测）：`discoverFamily('D:/test')` ⇒ `projects = ['D:\\repos']` ⇒ `marker = '台账 3·26'`（`D:\repos` 的数；`d:/test` 自身键 `61ca071934e3fa74` 无库）。根因 = `thincoder-core/ledger.mjs:100-107` 回退循环：锚自身无库 ⇒ 逐级向上攀至盘根层、认领同盘键控兄弟。
- 绿相（预期）：同输入 ⇒ `projects = []`（`d:/test` 下无含库子目录）⇒ `marker = null`。

②（笔闸工作区锚可达）

- 红相（实测 · 父侧原位复现）：`lightRoundOpen({cwd:'D:\\teamcode\\thincoder'}) = true` ∥ `lightRoundOpen({cwd:'D:\\teamcode'}) = false`（同刻两件在盘——#1217 轮实况）。根因 = `thincoder-core/agent/light-round.mjs:33` 单锚查询：工作区锚（`D:\teamcode` 下两个候选项目）⇒ `openLedger` 歧义拒（`thincoder-core/ledger-db.mjs:149-151`）⇒ 谓词兜底 `catch`（`:50-52`）⇒ `false` ⇒ 通路恒关；且拒文只教「先把轮挂上」——不辨因。
- 绿相（预期）：同态 ⇒ `lightRoundOpen = true`（放行）；两件缺席 ⇒ 仍 `false`（开路语义不变）。

### 4. 机制改法

#### ①（逐字 · `thincoder-core/ledger.mjs`）

- `:100-107` 回退循环（现文）：

```js
  let dir = resolve(anchor)
  for (;;) {
    const kids = ledgerChildren(dir)
    if (kids.length) return { current: null, projects: kids }
    const parent = dirname(dir)
    if (parent === dir) return { current: null, projects: [] }
    dir = parent
  }
```

改后（单行）：

```js
  return { current: null, projects: ledgerChildren(resolve(anchor)) }
```

- 函数 docstring（`:87-91`）：「current 缺（容器目录，K6）→ 上下文目录向上最近「含台账子目录」者取其子目录。」⇒ 锚本地表述，候选逐字：「current 缺（容器目录，K6）→ 锚本地：取锚自身含台账库的直接子目录（不沿祖先链上找）。」
- 保留面（判据照旧——本笔不涉）：`findProject` 归属形（`:52-61`，祖先链最近命中 ∥ 用户 2026-09-21 11:29 归属形裁定）；歧义根跳过支（`:94-95`）；`ledgerChildren` ∥ `MAX_SIBLING_SCAN`（`:63-85`）；`scopeMarkerOf`（`:156-170`）∥ 三端消费面。

#### ②（机制规格 · `thincoder-core/agent/light-round.mjs`）

- 候选项集（纯向下——用户裁定）：`候选 = [resolve(cwd)] ∪ { ledgerChildren(resolve(cwd)) 的各子项目根 }`。子项枚举单源 = 既有 `ledgerChildren`（`ledger.mjs:66-85`——本批升导出面）——与族发现同级枚举同一判据；父目录超限（`MAX_SIBLING_SCAN`）⇒ 空集降级（成本上界照旧）。不递归（孙层不入候选）∥ 不取同胞。
- 逐一查行：对每候选 `ledgerQuery({ cwd: cand, status: "在途" })`（动态 import 面由 `ledger-cmd.mjs` 改指 `ledger.mjs`——`ledgerQuery` ∥ `ledgerChildren` 同一 import 取得，W8 契约②照守）。歧义候选（`projectRootView(cand).state === "ambiguous"`——如工作区锚自身）⇒ 跳过该候选、照查其余（歧义锚不充当项目 = AC-M2-17 同判——既定观察态，非读错）；读错 ∥ 不可判 ⇒ 停本候选（净效果只减命中面，开路凭据仍是「两件校验全过」）。非项目锚（无 manifest ∥ 无含库子目录）⇒ 各候选查无在途行 ⇒ `false`（照拦——与今同判）。
- 指针解析（以各候选为基）：`base = resolveProjectRoot(cand) ?? resolve(cand ?? ".")`（台账写门同子表达式——`ledger-cmd.mjs` `assertTaskBookGate` 同式）；逐行判据照旧：`title` 携「收尾链待跑」∧ `task_book` 非空 ∧ `resolveDeclaredRef(base, part)` 命中 ∧ 读档 ∧ `readBatchStatusLine(src) === "open"`。
- 命中判据：任一候选上两件校验全过 ⇒ `true`；全候选无命中 ∥ 外层异常（枚举 ∥ import 失败）⇒ `false`（照拦）。
- 拒文改法（`thincoder-core/agent/dispatch.mjs:127` 末句——把查找范围说清，拒因可辨），候选逐字：

> If this is a light-channel code pen: the gate looks for the round from the session anchor and its direct subdirectories — book the round first (an in-flight batch record plus a 在途 ledger row carrying 「收尾链待跑」 pointing at the record); code pens pass once that is on disk.

- 注释随正：`thincoder-core/agent/dispatch.mjs:89-90` 补半句（查找面 = 会话锚 + 直接子目录）；`light-round.mjs:1-13` 头注「读法」段 ⇒ 候选面 ∥ 歧义跳过 ∥ 逐候选守卫表述。

### 5. 受影响文件（as-of 读数）与设计档落点

| 文件 | 现读 | 预期 | 面 |
|---|---|---|---|
| `thincoder-core/ledger.mjs` | 193 行 | ≈186（① −7；② 升导出 = 同行数） | ①② |
| `thincoder-core/agent/light-round.mjs` | 53 行 | ≈70 | ②判据本体 |
| `thincoder-core/agent/dispatch.mjs` | 274 行 | ±0~+1 | ②拒文 ∥ 注释 |
| `docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs` | 拟建（现盘未落——实施轮落盘） | ≈200 行级 | N1–N4 ∥ W1–W3 腿 |
| `docs/core/design/API-CONTRACT.md` | 生成区 | +1 行 | ②导出面（实施轮 `--write` 重生成） |

设计档落点（随收口落——本笔只点名）：

- ①：`docs/core/design/LEDGER.md`（现读 987 行）——§7.2「标记范围」`:310`（「向上（含锚）最近…」句 ⇒ 锚本地句；句尾同段一并随正）+ §7.1 `discoverFamily` 行 `:299` 随动 + §9 `:468`（「current 缺 → 继续向上求候选」句删除——旧围栏句）+ §9 `:472`（#882 批边界句——批属记录读，收口轮对账并核）+ 变更记录 +1 行。
- ②：`docs/core/design/LIGHT-CHANNEL.md`（现读 257 行）——§2.8 四处（信号形表①行读取点 ⇒ 候选面；闸读点句；边界块补候选面半句；闸拒文句 `:142` ⇒ 新文本）+ 实证判据块补 W 腿指针 + §7 K16 补半句（候选面规则）+ 变更记录 +1 行；`LEDGER.md` §7.1 增 `ledgerChildren` 行（导出面）。

### 6. 验收（AC——逐项回指）

①（批内件 N1–N4）

| 腿 | 内容 | 期望 | 回指 |
|---|---|---|---|
| N1 | 本案回归：无库锚 ∥ 祖先兄弟有库（`d:/test` 形夹具）⇒ 祖先兄弟不认领 | `marker = null` | F2 句「其下」∥ AC-M2-18「空范围 ⇒ null」 |
| N2 | 容器根锚（其下含项目）合计回归 | `marker` = 族内已读项目两池分列求和 | F2 句正形 ∥ AC-M2-18 |
| N3 | 自身锚负向锁：锚 = 项目根（自身带库） | `marker` = 自身两池；兄弟不掺入 | AC-M2-18「具体项目锚」腿 |
| N4 | 项目内深锚归属回归：锚 = 项目内子目录 | `marker` = 归属项目数（`findProject` 照用） | F2 句「打开具体项目」腿 |

红绿对照面（回归）：旧批件 `docs/batches/2026-10-03-ledger-family-aggregate.test.mjs` T47–T54 逐例复核——本笔静态复核结论：夹具锚形皆为「容器根（直接子 = 项目）」或「项目锚」⇒ 新语义下逐例同判（T52 旧径靠爬升判空、新径直接空集——断言对象 `null`+`false` 不变）；实施 ∥ 收口轮实跑复核，预期全绿。

②（批内件 W1–W3——循 J 件夹具法）

| 腿 | 内容 | 期望 |
|---|---|---|
| W1 | 工作区锚放行：工作区下两项目（各带 manifest）+ 轮账挂子项目 a（行在途携标记 + 指针 → a 轮档「进行中」）⇒ 会话锚 = 工作区，写 `proj-a/src/x.mjs` | 放行（无「engineering design gate」拒 ∥ 恰执行一次） |
| W2 | 两件缺席仍拒：同形工作区无账 ⇒ 同写 | 拒（reason 逐字 + 执行计数不增） |
| W3 | 缺一件仍拒：行在、轮档被撤（指针失据）⇒ 同写 | 拒 |

- 夹具法（循 `docs/batches/2026-10-09-light-channel-code-path.test.mjs`）：`executeToolCalls` 直驱（depth 0 ∥ 零活槽 ∥ auto-approve）+ `_setLedgerDirForTest` 临时库目录 + 临时项目（manifest）。
- 回归面：旧批件 J1–J5 复跑（项目锚形——本改对其判据无涉）预期逐例同判。
- 红绿相：W1 修前红（两件在盘仍拒）→ 修后绿；W2 ∥ W3 双向皆拒（负向锁）。

### 7. 关键决策（含否决）

| # | 决策 | 理由 ∥ 否决 |
|---|---|---|
| KD-1 | 归属 ∥ 发现两形分立：`findProject` 归属形照用（祖先链最近命中）；回退发现 = 锚本地（锚自身含库子目录） | d:/test 形之误 = 发现面借了归属面的向上语义；两形使命不同（找项目 vs 找族面）；否决「把 `findProject` 一并改锚本地」（违背 2026-09-21 归属形裁定——项目树内路径须归属命中） |
| KD-2 | 候选枚举单源 = `ledgerChildren`（升导出） | 与族发现同级枚举同一判据——防「同级项目」判据两处分叉；蹭既有成本上界（`MAX_SIBLING_SCAN`）；否决「light-round 内自写枚举」（判据双源）∥「逐子目录无过滤查询」（无界） |
| KD-3 | 谓词契约维持 boolean；拒因可见性经拒文「查找范围」句承载 | 改动面最小；否决「返回 {ok, reason} 结构化结果」（接口翻面 + 消费点外溢——超出本条缺陷面） |
| KD-4 | 歧义候选 ⇒ 跳过、照查其余（辨因）；读错 ⇒ 停本候选 | 歧义 = 既定观察态（AC-M2-17 同判）；跳过净效果只减命中面；否决「歧义 ⇒ 整体 fail-closed」（即原缺陷本体）∥「歧义 ⇒ 静默回退」（违反 AC-M2-17） |

### 8. 边界（本批不做）

- ①：只涉回退分支（`current` 缺席）；归属形 ∥ 歧义根跳过 ∥ `scopeMarkerOf` ∥ 三端消费面照旧。语义面 = 用户裁定「发现不向上」；台账六态 ∥ 写门 ∥ 库键 ∥ DDL 不涉。
- ②：候选面 = 锚 + 直接子目录一层（不递归 ∥ 不沿祖先链上找 ∥ 不取同胞）；`resolveProjectRoot` 归属形照用；开路语义（两件双在盘）不变；照旧面 = eng-coder 门 ∥ spawn 门 ∥ D5 冻结窗 ∥ 批档写门 ∥ 分类器 ∥ 辖域（`LIGHT-CHANNEL.md` §2.8 边界同守）。
- 需求档：F2 句 ∥ F-LC5 判定句已覆盖两形——本批为对实现面的补齐，需求档笔不涉。
- 提示词面：轻通道代码笔句未载候选面 ⇒ 不随动（评审若判需补，另走提示词面）。

### 9. 观察 ∥ 上抛

- 批内件 `docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs`：现盘未落（glob 实核）——按「实施轮落盘」点名；N1–N4 + W1–W3 腿面以本 §2 为准。
- §9 `:472`（#882 批边界句）：批属记录读——收口轮对账并核（若判为现行面语 ⇒ 同按锚本地改述）。
- `#1218` 行 `task_book` 为空——父侧归口时补挂本批指针（台账写 = 主 agent）。

### 10. 评审修正轮 1 收正（发现 #1–#6——逐号处置 · 2026-10-10）

承 §3 轮次 1（VERDICT pass · 🔴0 ∥ 🟡2 ∥ 🔵5——六条受理；#7 读数 ±1 级差判 Not an issue——父侧裁定，不在本轮）。落笔 = 逐号收正（零新语义）；本块 = 各号收正态（上方涉改行以此为准）。

- **#1 · 最近先例逐件成行（🟡）**：
  - **① 族发现锚本地**——坐标三件：实现 = `thincoder-core/ledger.mjs:94-95`（歧义根跳过支——10-04 轮落）∥ 设计档 = `LEDGER.md` §7.2「标记范围」歧义根子例 `:311` ∥ 先例批 = `docs/batches/2026-10-04-light-ledger-ghost-root.md`。
    对齐 = 同面同函数（`discoverFamily`）∥ 同枚举单源（`ledgerChildren`）∥ 同级上限照旧（`MAX_SIBLING_SCAN`）∥ 歧义根跳过支保留 ∥ 归属形照 2026-09-21 裁定（KD-1）。
    偏离 = 10-04 形保留回退、只排歧义命中；本轮 = 回退本体改锚本地——偏离理由：d:/test 形无歧义命中可排（锚自身无库），回退本体即误因（用户裁定「发现不是向上的」；§9 `:472` 承句随本轮补指针——见 #2）。
  - **② 轻通道闸候选面**——坐标三件：实现 = `thincoder-core/agent/light-round.mjs`（谓词·单锚查询 `:33`）+ `thincoder-core/agent/dispatch.mjs`（门合取项）∥ 设计档 = `LIGHT-CHANNEL.md` §2.8 ∥ 先例批 = `docs/batches/2026-10-09-light-channel-code-path.md` + 其批内件 `2026-10-09-light-channel-code-path.test.mjs`（J 件夹具法）。
    对齐 = 两件双在盘判据 ∥ fail-closed ∥ 夹具法逐形承用 ∥ J1–J5 回归面。
    偏离 = 单锚查询 ⇒ 锚 + 直接子目录候选集——偏离理由：工作区锚恰落歧义拒（谓词恒 false = 缺陷本体），单锚形不适用；用户裁定候选面纯向下（§2.2）。
- **#2 · `LEDGER.md:472` 处置判定前置（🟡）**：§2.5 ①行（`:107`）∥ §2.9 第二条（`:154`）所载 `:472` 处置 = 定形（不留开放条件）——收口轮按 10-04 先例补后续轮指针括注（同句已载 10-04 轮同类指针——同形延用；指向本轮锚本地改述 §7.2；候选逐字「**族发现锚本地** = 2026-10-10 批改述——§7.2」），随 §7.2 改述同拍落笔。
- **#3 · LIGHT-CHANNEL.md 更新清单补 §2.8 ②行（🔵）**：§2.5 ②行（`:108`）清单「§2.8 四处」⇒「**五处**」——补项 = ②行解析基 ⇒ 以各候选为基（`LIGHT-CHANNEL.md:115`）。
- **#4 · 引指收正 AC-M2-17 ⇒ AC-M2-19（🔵）**：「歧义锚不充当项目」两处引指——§2.4② 逐一查行括注（`:86`）∥ KD-4 行（`:142`）：AC-M2-17 ⇒ **AC-M2-19**（`LEDGER.md:392` 题名逐字）；`openLedger` 歧义拒面涉处并引 AC-M2-17（`LEDGER.md:390`——`:86`「工作区锚自身」处新增 ∥ KD-4 否决句处保留）。
- **#5 · §2.6 补错误径腿（🔵）**：② 表 W1–W3 ⇒ **W1–W4**（W4 = 坏档候选与命中候选并存：坏档候选停本候选 ∥ 命中候选照放行——总判不因他候选读错而失）；① 表 N1–N4 ⇒ **N1–N5**（N5 = 锚下目录项数 > `MAX_SIBLING_SCAN`（=100）⇒ 该层判空 ⇒ `marker = null`——锚本地形下空即终态）；§2.5 表腿面读数（N1–N4 ∥ W1–W3）随正。
- **#6 · 『（拟新增）』标记同拍收正（🔵）**：§2.5 ②行清单补注——闸读点句（`LIGHT-CHANNEL.md:117`）∥ §7 K16 句（`:220`）两句改述时同拍收正『（拟新增）』标记为在盘态（`light-round.mjs` 现盘 53 行）。

- **#1 ① 补记 · 设计档坐标补全**：`LEDGER.md` §7.2 歧义根子例 `:311` ∥ §7.1 `discoverFamily` 行 `:299`（歧义命中括注——10-04 轮落）——两处同为先例落点。

### 11. 腿面终态读数收正（2026-10-10 · 收口轮 · eng-designer）

承 §5 代码评审 🟡②（§2.6 两表腿面未随 §2.10 #5 扩 N5 ∥ W4——§2 段 = eng-designer 权属，归口本段）。

**§2.5 `:102` ∥ §2.6 `:112`/`:123` 表行腿面读数以 §2.10 #5 为准 = N1–N5 ∥ W1–W4**（append-only 形态下物理行留存，本块载终态）：

- §2.5 `:102`（批内件行·腿面列）⇒ **N1–N5 ∥ W1–W4**（原载 N1–N4 ∥ W1–W3）。
- §2.6 `:112`（①表题）⇒ **N1–N5**（原载 N1–N4）；§2.6 `:123`（②表题）⇒ **W1–W4**（原载 W1–W3）。
- 腿面定义 = §2.10 #5；实施终态读数 = §5（批内件 9/9——N1–N5 ∥ W1–W4 逐腿全绿 ∥ 现场复跑 `discoverFamily('D:/test')` ⇒ `projects=[]` ∥ `marker=null`）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · #1217 轮 §2 双件设计（族发现锚本地 ∥ 轻通道闸工作区锚可达；并件 #1218）· 评审范围 = 批档 §2 ∥ `docs/core/design/LEDGER.md` ∥ `docs/core/design/LIGHT-CHANNEL.md`**

核对范围与限制：标准档未声明（方法学合规按 AGENTS.md + 评审标准判）；无文档地图（归属面按在册档结构判）；需求档（`ENGINEERING-MODE-V2.md:622` ∥ `docs/core/requirements/LIGHT-CHANNEL.md:65-71`）与源码坐标不在评审范围 ⇒ 相关断言 unverified（F2「其下」措辞 ∥ `ledger.mjs:100-107` 现文 ∥ `light-round.mjs:33` 单锚查询 ∥ `dispatch.mjs:127` 拒文现文）。档内自查通过项：①/② 同级枚举单源（`ledgerChildren`）∥ ② 指针基式与 LEDGER.md §6.1 口径 2 同式（`LEDGER.md:254`）∥ T47–T54 夹具锚形与 `LEDGER.md:447-454` 用例表相符 ∥ 两件分别落其归属档（LEDGER.md ∥ LIGHT-CHANNEL.md §2.8）∥ 两份设计档标注行数逐行核讫（987 ∥ 257）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 最近先例（评审标准 9） | 🟡 | 批档 §2 无「最近先例」行：先例材料仅散见（前情指针 `2026-10-04-light-ledger-ghost-root.md`（批档 `:4`）∥ KD-1 引 2026-09-21 归属形裁定（批档 `:139`）∥ ②夹具法循 2026-10-09 旧批件（批档 `:131`）∥ 回归面点名 T47–T54 ∥ J1–J5（批档 `:121`）），未按「先例坐标三件（实现 ∥ 设计档节 ∥ 先例批）+ 对齐 ∥ 偏离理由」成行——两件均属对既有机制面的改动，该行不得静默缺省。 | 逐件补一行最近先例：坐标三件 + 对齐/偏离及理由；偏离处点名声明的既有形并说明为何不适用。 |
| 2 | 文档归属 ∥ 档态（R7a） | 🟡 | `LEDGER.md:472` 的处置留成开放条件：设计只点名 + 「批属记录读——收口轮对账并核（若判为现行面语 ⇒ 同按锚本地改述）」（批档 `:154` ∥ `:107`）；该句含 `枚举算法 ∥ 同级上限零改`（`LEDGER.md:472`），本批恰改族发现语义（§7.2 将改述锚本地，批档 `:107`）——同句括注已载 10-04 轮的同类后续指针（先例处置 = 补指针）；「若判为…」一旦落「非现行面语」则该句原样存续，与改述后的 §7.2 成同档两述。 | 判定规则前置：按 10-04 先例在该句补后续轮指针括注（或就地改述），不留开放条件。 |
| 3 | 清晰 ∥ 档面清单完整性 | 🔵 | LIGHT-CHANNEL.md 更新清单标「§2.8 四处」（批档 `:108`），未含 §2.8 ②行——该行现文 `①行 task_book 按台账写门同式解析`（`LIGHT-CHANNEL.md:115`）；新机制下解析基为「以各候选为基」（批档 `:87`），②行原样留存时，改后 §2.8 可被读成单锚解析。 | 清单补 ②行（候选基），或明记「②行零改」及理由（同式已含逐候选基）。 |
| 4 | 引用精度 | 🔵 | 「歧义锚不充当项目」两处引指 AC-M2-17（批档 `:86` ∥ `:142`）；同判据的档内 AC 行实为 **AC-M2-19**（`LEDGER.md:392`，题名逐字「歧义锚不充当项目」）；`LEDGER.md:390` AC-M2-17 管 `openLedger` 歧义拒。 | 引指改用 AC-M2-19（涉 `openLedger` 拒面处并引 AC-M2-17）。 |
| 5 | 验收（错误径覆盖） | 🔵 | ② 的两枚错误径无对应腿：读错/不可判 ⇒ 停本候选 ∥ 外层异常（枚举 ∥ import 失败）⇒ false（批档 `:86` ∥ `:88`）——W1–W3（批档 `:127`-`:129`）只覆盖正常 + 两负向；① 的 `MAX_SIBLING_SCAN` 超限降级（超限 ⇒ 空集，批档 `:85`）在新语义下不再经祖先回退，无腿。 | 各补一腿（②：坏档候选与命中候选并存；①：超限锚夹具），或明记不立腿的判据。 |
| 6 | 档面卫生（R7c） | 🔵 | `light-round.mjs` 的「（拟新增）」标记已陈旧（设计时点实读在盘 53 行——批档 `:100`）：`LIGHT-CHANNEL.md:117` ∥ `:220` 两处仍作在册标记，而本批计划恰要触碰这两句（批档 `:108`：闸读点句 ∥ K16 补半句）。 | 两句改述时同拍收正标记（在盘态）。 |
| 7 | 读数核对（标准 8 抽查） | 🔵 | `ledger.mjs` 标「193 行」（批档 `:99`）∥ 档内在册最近读数 194（`LEDGER.md:863`·as-of 2026-10-07）；10-07→10-10 在档未见该档改动记录——±1 级差来源不明；其余标注与档内旁证一致（`light-round.mjs` 53 ∥ `dispatch.mjs` 274 ∥ 设计档 987 ∥ 257 逐行核讫）。 | 实施轮以实读为准复核该数字（±1 级差——不阻塞）。 |

发现计数：🔴 0 · 🟡 2 · 🔵 5

VERDICT: pass

## §4 用户批准（主 agent）

### 批准（代签 · 2026-10-10 13:4x · 自动跑授权内）

**父侧代签（用户 13:27「自动跑」授权）+ 依据 = 三条件齐备**：① 设计评审轮次 1 = pass（🔴 0——七条逐条裁定：#1–#6 受理并落修正轮 ∥ #7 判 Not an issue（`thincoder-core/ledger.mjs` 父侧实读 **193 行**））；② 修正轮 1 已落地并**逐条核验**（§2.10 `:157-174`——六号逐号对读在盘）；③ token 已签发（凭据不落档）。**实施轮已派**（eng-coder：`thincoder-core/ledger.mjs` ∥ `agent/light-round.mjs` ∥ `agent/dispatch.mjs` ∥ 批内件 ∥ `API-CONTRACT.md` 生成区重生成）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-10（两件落码 ∥ 批内件 9/9 ∥ 回归 T47–T54 8/8 · J1–J5 5/5 ∥ 审计 CLEAN ∥ 评审 pass）


### 实施轮（eng-coder · 2026-10-10）

**交付摘要（两件 + 批内件 + 生成区）**

- ① `thincoder-core/ledger.mjs`（as-built 187 行）：`discoverFamily` current-缺席回退（原八行向上循环）⇒ 单行 `:101 return { current: null, projects: ledgerChildren(resolve(anchor)) }`；函数 docstring `:89` 改述锚本地（§2.4① :80 逐字）；`ledgerChildren` 升导出（`:68`，docstring 加导出面一句 = +1 行）。
- ② `thincoder-core/agent/light-round.mjs`（as-built 66 行）：查找面 = 会话锚 + 直接子目录一层（候选枚举单源 = `ledgerChildren`；动态 import 面改指 `../ledger.mjs`——W8 契约②照守）；歧义候选跳过（引指 AC-M2-19 ∥ AC-M2-17 = §2.10 #4 收正形）；候选读错停本候选；指针基逐候选（台账写门同式）；命中判据 = 任一候选两件全过。头注「读法」段随正（候选面 ∥ 歧义跳过 ∥ 逐候选守卫）。
- ② `thincoder-core/agent/dispatch.mjs`（as-built 275 行）：拒文末句 = §2.4② :91 逐字（session anchor ∥ direct subdirectories 半句）；`:91` 注释补半句（查找面）。
- 批内件 `docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs`（新建 279 行）：N1–N5 ∥ W1–W4（§2.6 + §2.10 #5 腿面）。
- `docs/core/design/API-CONTRACT.md`：生成区按 `node scripts/api-contract.mjs --root D:\teamcode\thincoder --write` 重生成（`ledgerChildren` 行 + ledger.mjs 行号随正）。

**实跑读数（红绿对照 · 命令自 `D:\teamcode\thincoder`）**

- 批内件 `node --test docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs`：
  - 修前 = N1 ✖（`台账 2·3`——祖先兄弟顶替，现场 `d:/test` 形）∥ N5 ✖（`台账 2·3`——回退认领父层）∥ W1 ✖ ∥ W4 ✖（工作区锚两件在盘仍拒）；N2 ∥ N3 ∥ N4 ∥ W2 ∥ W3 ✔ = 5/9。
  - 修后 = 9/9 全绿（N1 marker=null ∥ N2 `台账 3·4` ∥ N3 `台账 1·1` ∥ N4 `台账 1·1` ∥ N5 null ∥ W1 放行恰一次 ∥ W2 ∥ W3 拒 ∥ W4 放行）。
- 回归复跑：`2026-10-03-ledger-family-aggregate.test.mjs` = 8/8 ✔（T47–T54 逐例同判）；`2026-10-09-light-channel-code-path.test.mjs` = 5/5 ✔（J1–J5）。
- 旁证（同链消费面）：`2026-10-03-read-data-interface.test.mjs` = 12/12 ✔（RDI-5 `--family` 对拍 ∥ RDI-6 空容器空集）；`2026-09-29-residuals-round2.test.mjs` = 12/12 ✔（导出面探针 ∥ W8 静态闭包）。
- 现场复跑：`discoverFamily('D:/test')` 修前 = `projects=["D:\\repos"]` ∥ `marker="台账 3·26"`；修后 = `projects=[]` ∥ `marker=null`（`runLedgerScan` 同值）。
- 仓套件未跑（收口轮父侧执行——任务书所定）。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| KD-a | `ledgerChildren` docstring 加「导出面」一句（+1 行；设计预期 ≈186 ⇒ 实读 187） | 导出面既开，读者需知消费点（族发现 ∥ 轻通道闸候选枚举）；纯注释行。 |
| KD-b | 未采纳评审 🔵（把 `projectRootView` 歧义判据移入候选 try） | §2.4② 候选级错误枚举 = 「读错」（查行）；`projectRootView` 抛错属外层异常面（设计 = false 照拦）。移入 try 会放宽外层异常面——照设计保留；评审意见记录在案。 |
| KD-c | API-CONTRACT 生成区在他批存量漂移在场时仍整区 `--write` | 生成区契约 = 生成器唯一笔（档面标记「勿手改；重跑 = --write」，整区替换）；局部手改违档契约；漂移源 = 已提交他批源码，重生成即真值归位（下文披露）。 |

**独立审计 ∥ 代码评审轮次与终态**

- 内部审计（只读 · 对照设计）：轮次 1 = CLEAN——部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动，四类均未发现。
- 代码评审（独立评审 · type=code）：轮次 1 = pass（🔴 0 ∥ 🟡 2 ∥ 🔵 3；无必须修复项）。🟡 = ① §5/§6 空（本段落笔即补——§6 归收口轮）+ ② §2.6 表腿面未随 §2.10 #5 扩 N5 ∥ W4（§2 段非本笔权属，上报父侧）；🔵 = 候选级守卫结构（KD-b 记录在案）∥ 跨项目放行边界（建议收口轮 §2.8 边界句登记）∥ §2.5 as-built 行数回填（本段读数即回填）。
- fix round = 0（无必须修复项；§5 落笔 = 记录面补全）。
- 终态 = **clean**（审计 CLEAN ∥ 评审 pass ∥ 无静默转项）。

**披露 ∥ 上报面（父侧裁）**

- [上抛·知会] `API-CONTRACT.md` 生成区在批前已 stale（他批已提交源码未回填——team ∥ config ∥ desktop ∥ vscode ∥ server 等行）；本轮 `--write` 同拍带入他批漂移行。收口轮 diff 面会看到。
- [上抛·知会] 批档 §2.6 两表腿面（`:112` ∥ `:123`）与 §2.5 `:102` 读数仍为 N1–N4 ∥ W1–W3（§2.10 #5 的「随正」未落；§2 段 = eng-designer 权属）——请父侧归口。
- 设计档（`LEDGER.md` §7.1/§7.2/§9 ∥ `LIGHT-CHANNEL.md` §2.8）改述 = 收口轮（本笔未落，照设计）——含评审 🔵 建议的「跨项目放行边界」半句。

**行数口径补注（读后核）**：`wc -l`（内容行）= `ledger.mjs` 186 ∥ `light-round.mjs` 66 ∥ `dispatch.mjs` 275 ∥ 批内件 279；上列摘要中 `ledger.mjs 187` 为 `read` 显示口径（含末空行）——收口轮按 `wc -l` 对账请取 186 ∥ 66 ∥ 275 ∥ 279。

## §6 验证与收口（父代理）

### 验证与收口（父代理 · 2026-10-10 14:1x）

**收口态**：已收口（2026-10-10——父侧代行全程，授权 = §1 笔 2）。

#### 验证读数（父侧实跑）

| 面 | 命令 | 读数 |
|---|---|---|
| 批内件 | `node --test docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs` | **9/9 全绿**（N1–N5 ∥ W1–W4） |
| 回归面 | `node --test docs/batches/2026-10-03-ledger-family-aggregate.test.mjs` | **8/8**（T47–T54 逐例同判） |
| 回归面 | `node --test docs/batches/2026-10-09-light-channel-code-path.test.mjs` | **5/5**（J1–J5） |
| 现场复跑 | `discoverFamily('D:/test')` | `projects=[]` · `marker=null`（修前 = `D:\repos` · `台账 3·26`） |
| 容器回归 | `discoverFamily('D:\teamcode')` | 两子项目照常（向下枚举） |
| 仓套件 | `thincoder-core` ∥ `thincoder-cli`：`npm test` | 双跑 exit 0（manifest 空 = 2026-09-28 重置后既定空绿） |
| doc-check | `node scripts/doc-check.mjs` | 悬空 2 · 行宽 1——**全在 `docs/server/**`（非本批写域）**；本批 authored 行零新增违规 |

**收口测试线**：① 本批批内件 = `docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs`（随档留存——无处置面）；② 集成场景 = 不涉（本批 = 核内部机制 ∥ 闸谓词；端面集成面不受影响）。

#### 结算清单

- **角色表**：§1 父侧（讨论 ∥ 授权）∥ §2 eng-designer（设计 ∥ 修正轮 ∥ §2.11）∥ §3 评审子代理（轮次 1 = pass）∥ §4 父侧代签 ∥ §5 eng-coder（实施完成）∥ §6 父侧（本段）。
- **计数**：评审发现 🔴0 · 🟡2 · 🔵5（七条全裁定；#7 = Not an issue——`ledger.mjs` 实读 193 行）；腿面终态 = N1–N5 ∥ W1–W4。
- **指针**：台账 #1217 ∥ #1218 → 本档（核销随本段清单落）。
- **changelog**：`LEDGER.md:543` ∥ `LIGHT-CHANNEL.md:263` 两行在盘。
- **待办勾稽**：#1217 ∥ #1218 核销；新挂件 #1227（『（拟新增）』跨档陈旧标记清扫）∥ #1228（docs/server doc-check 存量红）——非本批面。
- **父侧直接执行（机械收正 · revertable）**：三处陈旧『（拟新增）』标记收正在盘态——`LIGHT-CHANNEL.md:138` ∥ `:233` ∥ `LEDGER.md:291`（三目标文件俱实核在盘）。
- **暂缓批复核**：无。
- **提交**：path-limited（本批 8 档；不含他会话在途档 `docs/batches/2026-10-10-server-exec-sandbox.md`）。
- **API-CONTRACT.md 生成区口径**：整区重生成，diff 含他批存量漂移行（生成器 = 生成区唯一写手——既定契约）。
