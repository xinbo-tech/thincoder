# VSC async 子代理保真（对齐 CLI 语义——GitHub #6）· 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `2026-09-11-VSC-ASYNC-PARITY（CLI 仓）` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = dc461950488f · 源提交 = 167f48f）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 17:35 · 来源 = 用户 13:52「开批，issue都别留着，及时处理」+ GitHub #6（2026-09-06, GCZ-jpg：**修复只落在了 CLI，扩展端没同步**）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 本批条目（1 条）

| # | 条目 | 内容 |
|---|---|---|
| **A1** | **async 子代理缺保真：raw object 返回 · abort 静默杀 · `{done:true}` 误读** | GitHub #6（含 2026-09-06 真实事故：eng-coder 写一半被杀无报告、explore 零产出、主会话误读「已消费」）。四根因（issue 给出 file:line）：① async spawn 返回 raw object（`src/agent-tools/subagent.mjs:275/278`）vs CLI 对位已 `JSON.stringify`（CLI 同档 `:682`）→ 工具结果经 `src/agent/execute-tools.mjs:196` `String(raw)` 成 `[object Object]`（模型永远拿不到子代理 id）；② abort 时 `asyncMap.clear()` 静默清池无注入通知（`src/agent/agent.mjs:439-440`）；③ 回合非正常结束时池挂内存数组、下回合从盘重建 → 子代理成孤儿、报告静默丢失（`:444`）；④ 空池恒返 `{done:true}`（`src/agent-tools/subagent.mjs:365`）→ abort-discard 后被读成「结果已消费」。 |

### 修法方向（issue 建议——设计复核）
镜像 CLI 语义：async spawn 返回 `JSON.stringify({id, role, status})`；abort 注入可见通知（如 `[subagent #N aborted]`）替代静默清池；`check` 区分「无待处理」与「已丢弃」。

### 已核事实
- 已回执评论（父侧 ✓）；issue 自带 CLI/VSC 逐点对位（不对称实证）。
- 与在飞 VSC 族（批 12/18/21）**不同面**（那些是守卫/可见性/索引面）。

### 待设计裁定
1. abort 通知的注入形态（消息/结果面/块面——与既有 `⟦ev⟧` 体系同源）；
2. `{done:true}` 区分形态（新 state 值 vs 附加字段——CLI 对位为何、扩展端可自持形态）；
3. 池生命周期修复面（`:444` 非正常结束路径）与既有池语义的相容；
4. 回归用例逐条（raw object / abort 通知 / 孤儿报告 / done 语义）+ 既有异步族测试零伤。

### 范围边界（明确不做）
- 不发明新语义（对齐 CLI 语义为锚；差异须逐点理由）；不改 CLI 仓；不改守卫/可见性面（他批）；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准开批）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求+设计+测试三层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/AGENT-LOOP` **§9**（F-G1~F-G7 / N-G1~N-G4——CLI 仓，**已落**）·
设计+测试 = VSC 仓 `docs/design/AGENT-LOOP` **§12**（§12.3 契约 C-1~C-9 / §12.4 受影响文件表 / §12.5 用例表 / §12.6 AC / §12.8 差异登记）·
需求池 = VSC 仓 `docs/TODO.md`（2 条 → **3 条**——已落）。

### 覆盖条目（本批 = §1 条目 A1，逐条回指）

| 条目 | 需求 | 设计 | 用例 | 验收 |
|---|---|---|---|---|
| A1 async 子代理保真 | `requirements/AGENT-LOOP`（CLI 仓）§9 F-G1~F-G7 | VSC `design/AGENT-LOOP` §12.3 契约 C-1~C-9 | T-D1~T-D10（§12.5） | AC-G1~AC-G7 + AC-N1~N4（§12.6） |

**三方条目一致**：本表 = 设计档 AC 回指的条目 = 需求档条目（F-G 编号逐条对应）。

### 一、§1 四问裁定（实施者据此执行——论据见设计档对应节）

| # | 待裁 | 裁定 | 落点 |
|---|---|---|---|
| 1 | abort 通知注入形态 | **消息面**：`escapeXml` 后 user-role reminder 注入 history——与既有 cancel 提醒（`subagent-actions.mjs:161-174`）同形态；块面（⟦ev⟧）不达模型、结果面无在飞工具可附着 → 两候选否决 | 契约 C-4（§12.2a 候选表） |
| 2 | `{done:true}` 区分形态 | **既有终态记录扩展**：墓碑新增值 `discarded` + `status` 单查回显四终态；**不给池条目状态机新增 state 值**（旁路记录 Map 与池内新 state 两候选否决） | 契约 C-3/C-5（§12.2b） |
| 3 | 池生命周期修复面 | **只清已死**（清池 ⟺ 该条目已死且其报告不可达）：存活条目（会话 signal 持有者）与 done-in-pool 条目留池；advisor 池同构缺口**登记不改** | 契约 C-1/C-2（§12.2c + §12.8 #1） |
| 4 | 回归用例 + 既有异步族零伤 | T-D1~T-D10 逐条（§12.5）+ AC-N1 快层全绿（既有异步族零伤） | §12.5/§12.6 |

### 二、目标与背景（为什么）

GitHub #6（GCZ-jpg 2026-09-06）报告：VSC 端 async 子代理在主会话被中止时**静默消失**——子代理被杀无报告、主会话把「丢弃」读成「结果已消费」；
2026-09-06 真实事故 = eng-coder 写一半被杀（无终报）+ explore 零产出。**设计勘验结论（修前必读）**：issue 四根因中
①（spawn 返回 raw object）与 ④（`check` 空池恒返 `{done:true}`）的**机制面在现行树已不成立**（spawn ack 早已 JSON 字符串且被契约测试锁定；
`check` 动作已随 §19.8 删除）——修 ① 或 ④ 会改错东西；**真实残留 = ②③**（中止静默清池 + 会话内 digest 轮被 Stop 时「子代存活 ∧ 池被 clear」→ 孤儿报告静默丢失）
及其语义面（终态误读）。不修的后果：后台工作在无人知情的情况下丢失，模型对「报告到没到」永远只能猜。

### 三、已知事实（免重复勘察——直接读）

- 设计与测试权威 = VSC 仓 `docs/design/AGENT-LOOP` §12（契约 C-1~C-9 为**逐字实现对象**）。
- 现状锚点（as-of 2026-09-11）：`src/agent/run-stages.mjs:255-264`（中止分支 `asyncMap.clear()`）·
  `src/agent-tools/async-settle.mjs:76-80`（`parentAborted` 单点守卫——**复用不新造**）/`:86-88`（buildChildSignal）·
  `src/agent-tools/subagent-scheduler.mjs:69-88`（墓碑读写）/`:165-178`（depInfo）·
  `src/agent-tools/subagent-actions.mjs:108-151`（status；`:116` unknown 分支）/`:161-174`（cancel 提醒同款形态）·
  `src/agent/execute-tools.mjs:335`（`String(raw)`——守卫插点）·
  `src/extension/suspension.mjs:261-288`（digest 块；`:274-276` 上抛）/`:235`（会话循环）/`:299-308`（会话中止清池）·
  `src/extension/panel-chat.mjs:411`（sessionSignal）/`src/extension/panel-messages.mjs:218-221`（Stop 只停当前轮）。
- CLI 对位（**只读，不碰**）：`src/agent-tools/subagent-run.mjs:193/201`（ack JSON）· `src/agent/run-stages.mjs:147-161`（中止清池）·
  `src/agent/dispatch.mjs:413`（undefined guard）· `src/tui/key-handler.mjs:60-75`（CLI Stop=全停）。
- 行数锚（口径 = `wc -l` 内容行，实测）：run-stages 297 · execute-tools 479 · subagent-actions 383 ·
  subagent-scheduler 490（**贴线 500——越线停下报告**）· suspension 358 · files.mjs 58 · subagent-async 498（**本批零改动**）。
- 测试范式：新档必须登记 `test/files.mjs`（不登记不跑）；快层 `npm test`；桩驱动同款 = `test/digest-visibility.test.mjs`（桩面板 + `suspensionSession`）/
  `test/batch-doc-gate.test.mjs`（`subagentTool.execute` ack）/`test/advisor-guard-completion.test.mjs`（`executeToolBatches`）/`test/subagent-observe-send.test.mjs`（status 直驱）。

### 四、实施顺序与红线

1. 新模块 `src/agent-tools/async-discard.mjs`（只导出 `discardAbortedPool`——契约 C-1~C-4：判定/出池/墓碑/提醒；零新谓词——复用 `parentAborted`）。
2. `run-stages.mjs` 中止分支接线（`clear()` → `discardAbortedPool` + `ev:discarded`；`advMap.clear()` **原样保留**并留登记注释）。
3. `subagent-scheduler.mjs`：导出 `tombstoneOf` + depInfo 映射 `discarded → cancelled 分支`（C-6）。
4. `subagent-actions.mjs`：status 单查终态回显（C-5；无 id 概览形态零变）。
5. `execute-tools.mjs`：类型守卫（C-7；**该档他批在写——见 §七 排程**）。
6. `suspension.mjs`：digest 轮 AbortError 容忍（C-8；非 AbortError 照旧上抛）。
7. 新档 `test/async-parity.test.mjs`（T-D1~T-D10）+ `test/files.mjs` 登记。

**红线**：不改 CLI 仓任何文件（代码/测试/文档——`git status` 自证）；不改 webview/⟦ev⟧ 事件族；不改 settle/注入/墓碑既有语义；
不改 `subagent-async.mjs`；不顺手修 advisor 池（§12.8 #1 登记）；文案/判据以 §12.3 为准（不得自行改写）；撞 500 行停下报告，不带代偿。

### 五、明确出批（不做——勿扩面）

- 不改 CLI 仓（只读对位）；不修 advisor 池同构缺口；不改 `_pendingAsyncResults` 既有中止语义。
- 不重开 F-6 / INPUT-LOCK / D-S9 裁定；不做跨会话丢弃追溯；不新建文档档；不写 CHANGELOG/README/TODO（父侧核销面）。

### 六、交付与验收

- 交付报告 = 逐文件改动 + 用例实跑输出（T-D1~T-D10 全绿）+ 快层 `npm test` 全绿 + 行数实测表（对照 §12.4）+ 偏差说明（无 = 明写「无」）。
- 审计口径 = §12.6 AC-G1~AC-G7 逐条（每条绑用例号）+ AC-N1~N4；反例（修前红）能复现的用例请在报告中给出修前输出。
- 机检：两仓 `node scripts/check-doc-width.mjs`（本批触碰档新增违规 0；CLI 仓现有 4 条新增违规属他批——不在本批范围，报告里点名即可）。

### 七、父侧排程与记录项（非 coder 面）

- **排程**：`src/agent/execute-tools.mjs` 在 VSC 工作树**未提交**（他批在写）——本批 spawn 须与他批串行（`files` 已声明）。
- **记录**：GitHub #6 回执/关闭（父侧）；VSC `docs/TODO.md` 需求池行已落（designer 本次）；需求池 → 核销的推进随交付收口。
- **残留登记（父侧排程后续批）**：① advisor 池同构缺口（同一中止分支）② CLI 面无丢弃提醒/丢弃终态记录（§12.8 #1/#2）。
- **未确认面**：需求层落 CLI 仓 `docs/requirements/AGENT-LOOP` §9（VSC 仓无 requirements 树——惯例同 §3/§4 同口径；batch 18 曾把「不改 CLI 仓」写为 docs 含——本批按惯例取「CLI 仓代码/测试零改，需求层落位为设计者写域」；若父侧另有裁定，改落位即可，内容不变）。

**行数口径更正（append-only 补记——只改口径不改事实）**：上面「三、已知事实」的**行数锚**按内容行（`split−1`）计；本批统一口径 = 读档 `N lines total`（= split，同 `VSC-GUARD-COMPLETION` §2 同口径）——各值 +1：

- run-stages **298** · execute-tools **480** · subagent-actions **384** · subagent-scheduler **491**（贴线 500——越线停下报告）· suspension **359** · files.mjs **59** · subagent-async **499**（本批零改动）。
- 设计档 §12.4 受影响文件表已按本口径落档（两处一致）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 VERDICT = changes-required（🔴 1 · 🟡 3 · 🔵 3——发现表见 §3 轮次 1）。父侧裁定：7 条全部落修；#1 的「纳入 / 登记出批」二选一由本轮读档复核后取 **②登记出批**（理由：F-6 后该站仅面板销毁路径驱动 · 清池时条目已全死 · 无活消费方 · 属需求 §9.4 跨会话排除面——全量见设计档 §12.8 #6 带注）。本轮 = 修正轮（**只改文档、不碰实现**；未新建档；`src/**` 零改动、未 commit、未发起评审——待父侧核验）。

**7 条落点（逐条——设计档 `AGENT-LOOP（VSC 仓）§12`；line as-of 落修后）**：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🔴 | §12.8 增行 **#6**（L725）+ 6 注（L727-730——会话收尾站 `suspension.mjs:299-308`：登记不修）；§12.1 ② 修订（L549-552——「同款→修」改为非修复面 + 指向 #6）；§12.7 两行（L712-713——pending 口径统一 + 会话收尾边界）；变更记录计数同步（L39——差异登记五项 → 六项，D3） |
| 2 | 🟡 | §12.4 表后补「行数拆分口径」段（L668——run-stages 仅接线不拆；scheduler 贴线声明重申） |
| 3 | 🟡 | 本 §2 下方「红线措辞定稿」段（取代 :98 旧句与 :117「未确认面」——默认解释升定稿） |
| 4 | 🟡 | 设计档跨仓引用改「名称（仓别）§N」形态（§12 头 L538-539 + §12.4 文档段 L670-671）；本 §2 旧形态引用（评审点名 :43/:73）随本追加形态读 |
| 5 | 🔵 | §12.4 文档段本档行数改 as-of 实测（L671——529 → **731**） |
| 6 | 🔵 | §12.3 C-2 补签名与返回结构 `{discarded, kept}`（L612-613）；§12.5 T-D3 断言同步（L680——`discarded.length === 2`） |
| 7 | 🔵 | §12.6 补覆盖注记（L703——T-D10 ← AC-N1/N2） |

**红线措辞定稿（评审轮次 1 #3——父侧确认）**：

- CLI 仓 = **代码/测试零改动**（`git status` 自证）；CLI 仓需求档 §9 落位与批次档记录 = **设计者写域**（同口径：`requirements/AGENT-LOOP` 已有 VSC 侧 §3/§4/§5/§6/§8 节）——不与「VSC 单端」相抵（:98 旧句、:117「未确认面」均以本段为准）。
- 跨仓引用统一形态（评审 #4）：`AGENT-LOOP（CLI 仓）§9` / `AGENT-LOOP（VSC 仓）§12`——去 `.md`、去路径前缀（`docs/README` §3.7）。
- 实施面不变：`suspension.mjs` 改动仅 C-8（digest 轮 AbortError 容忍）；299-308 清池面零改动（§12.8 #6 登记）。
- 口径归属（#1）：需求档文本零改动——「会话收尾」的面映射（会话内 = F-G3~F-G5；面板销毁 = §9.4 排除面）落设计档 §12.1/§12.7/§12.8。

**核验（D6 回读 + 机检）**：两仓 `node scripts/check-doc-width.mjs`——VSC 仓：宽度全绿 + 一致性新增违规 0；CLI 仓：新增违规 5 条 + 宽度超限 18 行（11 档）**均属他批**（本档零新增——含本追加）。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 | 🔴 | 需求 §9.1（`docs/requirements/AGENT-LOOP.md:261`（CLI 仓））承诺「主会话被中止（Stop）**或会话收尾**时」有据可查、有终可判；设计 §12.1 ②（`thincoder-vscode/docs/design/AGENT-LOOP.md:549-551`）把「会话收尾 = `suspension.mjs:299-308`」列为同款静默清池缺陷并箭头「修：F-G3」，但修复面只接线 run-stages 中止分支（批次档 §2 步骤 2/6：`docs/batches/2026-09-11-VSC-ASYNC-PARITY.md:91,95`（CLI 仓））；该站点（会话级 abort → `history._asyncSubagents/_asyncAdvisors.clear()` + pending 清空——读档 `suspension.mjs:299-308` 实证）在 §12.3/§12.4/§12.5/§12.6 无契约/用例/AC，§12.7/§12.8 未登记——既未修也未裁出批量；被清条目无墓碑 → `status` 回 unknown，正落需求禁止的「读成已消费」。附带：§12.7（`:705`）「中止路径不清 pending」与 299-308 现状（清 pending）相抵，口径需一并裁定 | 实施前二选一落档：①纳入修复面（该站点接线 discard helper + 用例/AC 回指）；②显式登记出批（§12.8 增行、§12.7 与需求 §9.1 措辞对齐），并修正「中止路径不清 pending」口径句 |
| 2 | 受影响表 / 结构档位 | 🟡 | run-stages 行 298 → ~+8（≤306）（设计 `:656`）将跨 300 行咨询线，设计无拆分评估/说明（§12.4 仅对 scheduler 491→~498 贴 500 硬限有「越线停下」声明）。8 档格式齐整；抽查对中：run-stages 298 / subagent-actions 384 / subagent-scheduler 491 / suspension 359 / subagent-async 499 与读档 `N lines total` 逐一对中（execute-tools 480 属他批未提交工作树、test/files.mjs 59 未抽验） | 在 §12.4/§12.7 补一句 run-stages 拆分口径（如「仅接线、不拆；挂结构债候选」）；300 线为咨询级，不阻断 |
| 3 | 清晰度 / 协调 | 🟡 | 红线措辞与落位/验收口径不一：批次档 `:98`「不改 CLI 仓任何文件（代码/测试/文档——`git status` 自证）」按字面被本批自身落位（CLI 仓需求 §9 + 批档）触反；`:117` 自标「未确认面」给默认解释；设计 AC-N3（`:696`）取「CLI 仓代码/测试零改动」口径。落位在案成立（`requirements/AGENT-LOOP` 已有 VSC 侧 §3/§4/§5/§6/§8） | 父侧确认后统一措辞（CLI 仓 = 代码/测试零改；需求/批档落位为设计者写域），把 `:117` 默认解释升为定稿；协调项，不阻断 |
| 4 | 文档归属 / 跨仓引用形态 | 🟡 | 跨仓引用未按 `docs/README` §3.7「名称（仓别）§N（去 .md、去路径前缀）」：设计档 `:538`「CLI 仓 `docs/requirements/AGENT-LOOP` §9」、`:539`、`:664`；批次档 `:43`「VSC 仓 `docs/design/AGENT-LOOP` §12」、`:73` 同形。两仓 basename 同名（AGENT-LOOP.md）——按 README 所述 V1 解析有 `no-section` 误报/以错档通过风险（VSC 档自身 §9 存在，误配亦「通过」） | 统一为 `AGENT-LOOP（CLI 仓）§9` / `AGENT-LOOP（VSC 仓）§12` 形态；格式债级别，随文档收口处理 |
| 5 | 文档卫生 / 数字 | 🔵 | §12.4（`:664`）称本档 529 → 716；本次读档工具报 717 lines total（差 1）。5 个源档现值抽查均严格对上同口径，唯本档 .md 自称差 1（.md 豁免注解，登记级） | 随收口复核口径或标 as-of 时点；不阻断 |
| 6 | 清晰度 / 契约完备 | 🔵 | T-D3 断言 `kept === 2`（`:674`）依赖 `discardAbortedPool` 返回形态，C-2/C-9（`:609`/`:647-649`）未定签名/返回结构——用例与实现易各自发明 | 契约补返回结构（如 `{discarded, kept}`）或注明由实现与用例共同定稿；不阻断 |
| 7 | 验收追溯 | 🔵 | T-D10 现状锁（`:681`）无 AC 行显式回指（AC-G1~G7 覆 T-D1~T-D9，`:687-693`；仅 AC-N1/N2「新档被跑全绿」间接覆盖） | AC-N1/N2 注记 T-D10 覆盖关系或补 AC 行；不阻断 |

VERDICT: changes-required

计数：🔴 1 · 🟡 3 · 🔵 3

### 轮次 2（评审子代理）

**轮次 2 单轮校验（7 条落点复核——映射见 §2 修正块 L124-147）**：计数 🔴 0 · 🟡 0 · 🔵 0

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| — | 修正轮 7 条落点 | — | 0 发现——无残遗 / 无未落 / 无新增矛盾 | — |

逐点核验（读档 as-of 2026-09-11——行号全部命中声明锚点）：
① #1 🔴 取②：§12.8 行 #6 L725 + 6 注 L727-730 ✓ · §12.1② L549-552（非本批修复面 + 指向 #6，「同款→修」零残遗）✓ · §12.7 两行 L712-713（pending 口径统一 + 会话收尾边界）✓ · L39 变更记录「差异登记六项」✓；
② #2 🟡 §12.4 口径段 L668 ✓（与受影响表 L660/L663 数字一致：298→≤306 不拆 / 491→≤498 贴线）；
③ #3 🟡 批次档红线定稿段 L140-145 ✓（:98/:117 取代声明在位，四小点齐）；
④ #4 🟡 跨仓引用 L538-539 + L670-671 均「名称（仓别）§N」形态（去 .md / 去路径前缀）✓；
⑤ #5 🔵 L671「529 → 731」与读档实测 731 行 total 相符 ✓ + L39 计数同步 ✓；
⑥ #6 🔵 C-2 签名/返回 L612-613 + T-D3 断言 L680（discarded.length===2 / kept===2 同步）✓；
⑦ #7 🔵 §12.6 覆盖注 L703（T-D10 ← AC-N1/N2；AC 表 L693-699 无 T-D10 单行——一致）✓。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 04:00 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 changes-required（🔴1 · 🟡3 · 🔵3）→ 修正轮 🔴取②（显式登记——读档复核扎实）+ 6/6 → **轮次 2 = pass**（7/7 核销 · 0 发现）→ **token 已签发**（值不落档）。

**批准范围**：8 档（VSC 仓）：新 `src/agent-tools/async-discard.mjs`（~75）· `src/agent/run-stages.mjs`（≤+8）· `src/agent-tools/subagent-scheduler.mjs`（≤+7）· `src/agent-tools/subagent-actions.mjs`（≤+18）· `src/agent/execute-tools.mjs`（≤+5）· `src/extension/suspension.mjs`（≤+7）·
  新测档 `test/async-parity.test.mjs`（T-D1–T-D10）+ `test/files.mjs`（+1）。

**遗留（批准时登记）**：① VSC 发行面（webview 不含本批）；② commit 待父侧。

## §5 实施记录（eng-coder 自写）


**状态：交付完成 · 终态 = clean**（2026-09-11；8 档 = 批准集全量；审计 1 轮 CLEAN · 代码评审 1 轮 pass · 修正轮 0——零必须修复项）。

**一、交付摘要（8 档，仅 VSC 仓；行数口径 = 读档 `N lines total`；括号 = 设计 §12.4 预算）**

| # | 档 | 实测 | 预算 | 改动 |
|---|---|---|---|---|
| 1 | `src/agent-tools/async-discard.mjs` | 64（新） | ~75 | C-1~C-4 单点（只导出 `discardAbortedPool`） |
| 2 | `src/agent/run-stages.mjs` | 304 | ≤306 | 中止分支 `clear()` → `discardAbortedPool`；advisor 池原样 + §12.8 #1 注释 |
| 3 | `src/agent/execute-tools.mjs` | 483 | ≤485 | C-7 工具结果类型守卫 |
| 4 | `src/agent-tools/subagent-actions.mjs` | 400 | ≤402 | C-5 终态回显四值 |
| 5 | `src/agent-tools/subagent-scheduler.mjs` | 498 | ≤498（贴线） | `tombstoneOf` 导出 + depInfo `discarded → cancelled` |
| 6 | `src/extension/suspension.mjs` | 363 | ≤366 | C-8 digest 轮 AbortError 容忍 |
| 7 | `test/async-parity.test.mjs` | 397（新） | ~200 | T-D1~T-D10 + AC-N2 自检（行数偏差见三） |
| 8 | `test/files.mjs` | 62 | 59+1 | 登记行在 `:60`（锚陈旧见三） |

**二、验收与测试实测**

- AC-G1~G7：T-D1~T-D9 全绿（`node --test test/async-parity.test.mjs` = 11/11 pass，含 AC-N2 自检）·
  快层 `npm test` = tests 477 / pass 470 / fail 0 / skipped 7（slow 门控）· 全量 `node test/run-full.mjs` = 477 / 477 / fail 0。
- `node scripts/check-syntax.mjs` = 250 JS files OK · VSC 仓 `check-doc-width` = 宽度全绿 + 一致性新增违规 0。
- AC-N3：CLI 仓代码/测试/文档零改动——写操作全落 VSC 仓；CLI 仓 `git status` 无本批痕迹（窗口内 CLI 动线主题均属他批）。
- 修前红取证（反例复现，取证后随擦恢复、零残留）：T-D2 回退 `result = String(raw)` → 红（实到 `[object Object]`）；
  T-D5 回退 `asyncMap.clear()` → 红（池被整清并摘除——`history._asyncSubagents` 变 undefined，即孤儿化本体）。

**三、偏差披露（3 条——均 report-only，不动代码）**

1. `test/files.mjs`：设计锚 59 → 改前实测 61（+2——他批 18/26/21/19/28 批登记行在锚测量后并入；`git diff` 证本批恰 +1 行于 `:60`）→ 改后 62。
2. 新测档 397 行 vs §12.4 预估 ~200（≈2×）：三缝真跑（真 spawn / 真 `finalizeAgentTurn` / 真挂起驱动）与夹具密度所致；无硬限违规（<500）；
   拆档建议留后续批（同款：同族档 427 行已满独立成档）。
3. `ev:discarded` 落点：实现按 C-2 单点放在 `async-discard.mjs`（有丢弃才记）；§12.4 run-stages 行与任务书步骤 2 的「+ ev:discarded」属同一动作的文件级概述
   ——行为一致（T-D5 锁「恰一条」），父侧文档层可择一注明。

**四、决策透明（实现自选点 5 条）**

| # | 决策 | 理由 |
|---|---|---|
| 1 | `ev:discarded` 有丢弃才记（`n>0`） | C-4「零丢弃 → 零注入（零噪音）」同旨——零丢弃不产生无意义日志 |
| 2 | 新档 import `../log.mjs` | C-2 要求一条丢弃日志；C-9 枚举未列该 import（代码评审 🟡#1 登记） |
| 3 | `tombstoneOf` 复用既有 `idNum` 归一 | 与墓碑写口同键空间（数字/数字串同判） |
| 4 | C-5 四终态 note 为英文要点句 | 设计表给「要点」非逐字；与既有 done note 同风格 |
| 5 | `wasStatus` 归一：`queued` 保原值，其余 `running` | C-4 括号词数据源（丢弃条目必为 running/queued——done/cancelled 先排除） |

**五、审计与评审轮次（只读，零代码改动）**

- 审计（explore 子代理，§18 D-E2 ③）：1 轮，**CLEAN**——四类偏差 0；逐项对位 C-1~C-9 + 红线（webview/⟦ev⟧ 族 / `subagent-async.mjs` / 会话收尾站）。
- 代码评审（advisor `type=code`，同步 1 轮）：**pass**——🔴 0 · 🟡 2 · 🔵 2；2 🟡 均 report-only（本档三.2 / 三.3 已承载）。
- 修正轮：**0**（无必须修复项；裁决表随交付报告）。

## §6 验证与收口（父代理自写）

**2026-09-12 06:45 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 快层 **477/470/0/7** · 全量 **477/477/0**；**反例双证**（String 回退→T-D2 红；clear 回退→T-D5 红——孤儿化本体实证）；
- **父侧抽核**：`async-discard.mjs` 63 行 ✓ · 接线（`discardAbortedPool`+`ev:discarded`）✓ · `tombstoneOf`/depInfo ✓ · C-7 守卫（:337）+ 注释禁用句（:336）✓；
- 内部：审计 CLEAN + 评审 pass（🔴0）——**零修正轮**。

### 逐条验收结论

- **AC-G1–G7 / AC-N1–N4 全绿**（含终态回显四值 + status 单查 + depInfo 映射）；**Simplified 零 · Not done 零**；偏差 3 条如实（files 锚陈旧/测档 397/落点口径——均 report-only）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：8 档实测对表 ✓ · 指针：设计 §12.6 ↔ 用例 ✓ · 待办：四项（下）✓

### 遗留项

1. **测档 397 行**（>300——本批不拆登记；拆档属后续批）；`ev:discarded` 落点口径（§12.4 行注/C-9 import 清单——设计者域）；
2. **G2 状态栏 VSC 镜像**（父侧排程另批）；
3. §12.8 #1 advisor 池同构缺口（登记不改——既定）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
