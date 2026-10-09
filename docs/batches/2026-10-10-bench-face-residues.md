# 2026-10-10 · bench-face-residues
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令（承 03:39「归批清理」）+ 清账轮批档簇Ⅴ = #1085 ∥ #1142 ∥ #1143（bench 面小批）。
> 台账 = #1085（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅴ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」（承 03:39「归批清理」）——本批 = 清账轮簇Ⅴ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（3）**：
- `#1085`：bench 三档注释「（该档）300 行上限」引用随口径裁定（`bench/lib/prices.mjs:10` ∥ `lib/prices-judge.mjs:4` ∥ `lib/judge-fallback.mjs:4`；另 bench 设计档 §3 触发条）。
- `#1142`：toolcall 负向名单补 `main_history` 覆盖（`bench/toolcall/fixture.mjs:65-68`——consult 族三枚 + 回写 §2.7-③ ∥ `MODEL-BENCH.md` §11.10-② 族枚举）。
- `#1143`：`bench/test/toolcall.test.mjs:151` 补负向名单结构自锚（名数 ∥ 去重 ∥ 现役对读）。

**边界**：bench 面（lib 注释 + toolcall 判据档 ∥ 测试档 + 设计档族枚举）；不触核 ∥ 端面。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① 同族余量并入（T-11 · 9 档 10 处）✓——同面同法注释级零风险，不留 10 处同患；② `toolcall.test.mjs` 旧预算句随本批 §3 面收正 ✓（「>280 行 ⇒ 拆两份」与 500/800 现行口径相抵）；③「回写 §2.7-③」不可执行之处置 ✓（档已冻结——live 面 + 本批档承接，KD-4）；④ `docs/RELEASE.md:387` 归批 台账 `#1174`。

**父裁（2026-10-10 · 评审 #78 pass 回执）**：3 🟡 ∥ 5 🔵 逐条——F1（T-11 状态两面不一致：§1 父裁① ✓ vs §2 候裁）⇒ **以 §1 父裁为准：T-11 并入本轮**（照 §2:130 全量落；AC-a 射程 = bench/** 全档「300 行」零命中，含余量 10 处）∥ F2（`MODEL-BENCH.md:961` 旧预算句：§1 父裁② ✓ vs §2 候裁）⇒ **本批 §3 面收正**（改写为现行 500/800 口径族语形；`2026-09-25-tool-call-probe.md:65` 冻结副本零触）∥ F3（反例腿「三腿红」预测不可复现）⇒ 实测红集 = 名数 + consult 族 `main_history` 两支；断言逐条短路（§5 照实记）∥ 🔵 F4..F8（tool-docs 腿子串匹配 ∥ consult.mjs 声明坐标 ∥ §3 同形四行的判据 ∥ D2 字面/指针取舍 ∥ §1 双状态行）= 修轮随正或维持（F5 坐标 = 取声明坐标义；F8 双状态行 = 父侧合并一条）。**实施派工 = eng-coder #87**；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-10（initial 轮 · #1085 ∥ #1142 ∥ #1143 落地设计（含同族余量候裁））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（eng-designer · initial 轮 · 2026-10-10 · 依据 = 本档 §1 三条目 + 本席现盘逐坐标实读（读数随文注 · 行数口径 = `split("\n").length−1`）。三条 = bench 面欠账清理（#1085 ∥ #1142 ∥ #1143）——零新机制：注释口径收正 ∥ 负向名单收严 ∥ 测试自锚；判据语义与版本轴零动。）

### 2.1 本批条目（覆盖 3/3）与设计档落点

对应 §1「条目（3）」逐条（编号同 §1 · 台账核销面逐条挂钩）：

| 条目 | 病灶（本席实读 2026-10-10） | 本批动作 | 落点 |
|---|---|---|---|
| #1085 | bench 注释拆分引文 = 旧口径值「300 行」——命名 3 处（`bench/lib/prices.mjs:10` ∥ `lib/prices-judge.mjs:4` ∥ `lib/judge-fallback.mjs:4`）；另设计档 §3 一般触发句 2 处（`MODEL-BENCH.md:884` ∥ `:889`） | **换线裁定**（KD-1）+ 引文收正（T-1..T-5） | 3 档注释 + `MODEL-BENCH.md` §3 |
| #1142 | 负向名单（`bench/toolcall/fixture.mjs:64-68`）以族干名 `consult` 占格——子串兜 `consult_start` / `consult_stop`，**漏 `main_history`**（现役三枚实读 = `thincoder-core/agent-tools/consult.mjs:87`「`main_history`」∥ `:398`「`consult_start`」∥ `:450`「`consult_stop`」） | 名单**置换**收严 10 → 12 名（KD-2）+ 设计档族枚举回写（T-6 ∥ T-7） | `fixture.mjs` + `MODEL-BENCH.md` §11.10-② |
| #1143 | `bench/test/toolcall.test.mjs:151` 结构腿对名单无自锚（名数 ∥ 去重 ∥ 现役对读三向缺位——#931 类漂移静默可再发） | 结构腿补自锚断言 + §11.11 测试面对读（KD-3 ∥ T-8 ∥ T-9） | `toolcall.test.mjs` + `MODEL-BENCH.md` §11.11 |

**设计档落点** = `docs/core/design/MODEL-BENCH.md`：§11.10-②（族枚举 · `:2020`）· §11.11（结构级测试面 · `:2030`）· §3（两处触发句 · `:884` ∥ `:889`）· 变更记录（一行）——随实施落字；本批为欠账清理量级，**不新建设计节**。

**回写承面说明（KD-4）**：§1 所指「回写 §2.7-③」（stale-fixes 批）因该档已收口冻结不可执行——收严名集以 live 面（§11.10-② + 变更记录）+ 本批档承接（详见 KD-4）。

### 2.2 关键决策

**KD-1 · #1085 换线裁定 = 换线（300 ⇒ 现行 500/800）· 不直换数字**：

1. **现行口径 = 软线 500 行 / 硬限 800 行**：`thincoder-cli/AGENTS.md:34`（「exceeding 500 lines → advisory (🟡)」「Exceeding 800 lines → blocking (🔴)」）∥ 工作区 `AGENTS.md`（同值）——两层在册。
2. **bench 档自身口径为准绳 ⇒ 同为 500**：设计档 §3 表头五处作「说明（拆分触发 = 超 500 行）」（`:684` ∥ `:720` ∥ `:886` ∥ `:916` ∥ `:953`）；未检出 bench 自设 300 例外条（本席两向全量实读：设计档 grep「300 行 ∥ 行上限 ∥ 拆分触发 ∥ 拆分层」；bench 注释 grep「300」）。「300」系旧口径期行文（300/500 期「300 建议 / 500 硬限」——`docs/RELEASE.md:387` as-of 2026-09-23 引）。
3. **旁证（实读）**：`bench/run.mjs` **309** 行 ∥ `bench/test/report-present.test.mjs` **304** 行在盘已越 300 未动 ⇒ 300 非现行执行线。
4. **落字形态 = 不直换 500**（该拆分实际按旧 300 发生——直换将伪造历史触发点）：命名面 5 处（三档注释 + §3 两处）落「行数超线（拆分）——现行口径：软线 500 行 / 硬限 800 行」；余量 10 处（T-11 · 候裁）落「行数超线」纯化——其句多已携「按设计档 §3」单源引用，避免口径复述（D2 数字单源）。
5. §3 表头「超 500 行」与现行口径一致 ⇒ **零改**（口径数字单源 = 设计档 §3 表头 + `AGENTS.md`；本批不复制传）。

**KD-2 · #1142 名单形 = 置换（非追加）**：`consult` ⇒ `consult_start` / `consult_stop` / `main_history`（10 → 12 名）。

- 理由：① 名面应列**现役名**（族干名非注册名）；② 子串匹配语义下 `consult ⊆ consult_start` = 冗余项（与 KD-3 子串最小性锚相抵）；③ 唯一失覆 = `main_history`（实读差分：旧名单覆 `main_history` = false ∥ `consult_start` / `consult_stop` = true；置换后三枚全覆盖）。
- 列序：前 9 名保序，三枚续尾（列序随落字 · 名集为准——沿既有判例）。

**KD-3 · #1143 自锚形态 = 结构腿内补断言（不新立用例）**：名数（12）∥ 去重（含子串最小性）∥ 现役对读（三向：载荷面不在场 ∥ tool-docs 逐名在册 ∥ consult 族现役名覆盖）。承载 = `toolcall.test.mjs`「AC-2：V1 枚举块点名工具名 ⊆ 载荷面」用例内（`:154` 后追加 + `:17` 后补导入）；用例数保持 6。规格见 2.3-b。

**KD-4 · 回写承面（stale-fixes §2.7-③ 冻结处置）**：stale-fixes 批档 §1 状态行 =「已收口 2026-10-09」（该档 `:6`）= 该档**已冻结**（append-only + close 执行毕）——「回写 §2.7-③」物理不可执行且违冻结纪律（closed records never back-edited）。

- 处置：① 收严后名集以 **live 面承接** = `MODEL-BENCH.md` §11.10-②（族枚举）+ 变更记录；② 收严**记录面** = 本批档（§2 本块 + §5/§6）；③ stale-fixes §2.7-③ 保持 as-of 冻结文（其所载 10 名集 = 当时口径之史实；**现行名集见 §11.10-②**）。
- 行使条件：父侧另有裁定 ⇒ 另派（该档不可再写）。

### 2.3 机制设计（逐条）

**（a）#1142 名单规格（`bench/toolcall/fixture.mjs:65-68` 逐字替换 · Δ0 行）**：

```js
export const OFF_PAYLOAD_TOOL_NAMES = [
  "memory", "ledger", "code_search", "doc_search", "repo_outline", "settings",
  "peer_instances", "subagent", "advisor", "consult_start", "consult_stop", "main_history",
]
```

- 同行注（`:64`）随动：`（§11.10-②：实例绑定族 + depth 绑定族）` ⇒ `（§11.10-②：实例绑定族 + depth 绑定族 + consult 族）`；
- **版本口径 = 不 bump**：`TOOL_PROBE_VERSION` 恒 1（名单不入 §11.2 版本轴六项枚举 ∥ 不入 `casesDigest` / `payloadDigest`——沿 stale-fixes 批 §6 判例）；
- 消费面：全仓仅 `bench/test/toolcall.test.mjs`（`:20` 导入 ∥ `:151` 消费）——数据常量替换，无行为面；冻结副本 `toolcall-fixtures.frozen.mjs` 不含该面（零触）。

**（b）#1143 自锚规格（`toolcall.test.mjs` · `:17` 后导入 + `:154` 后追加块；块为草案——施行可微调措辞，语义逐条为准）**：

```js
import { consultStartTool, consultStopTool, makeMainHistoryTool } from "../../thincoder-core/agent-tools/consult.mjs"
```

```js
  // 负向名单自锚（§11.11 · 收严）：名数 / 去重（含子串最小性）/ 现役对读
  assert.equal(OFF_PAYLOAD_TOOL_NAMES.length, 12, "负向名单名数锚（收严后 = 12 名）")
  assert.equal(new Set(OFF_PAYLOAD_TOOL_NAMES).size, OFF_PAYLOAD_TOOL_NAMES.length, "负向名单去重锚")
  for (const a of OFF_PAYLOAD_TOOL_NAMES)
    for (const b of OFF_PAYLOAD_TOOL_NAMES)
      if (a !== b) assert.equal(b.includes(a), false, `子串最小性：「${a}」⊆「${b}」（子串匹配语义下冗余）`)
  const toolDocNames = readdirSync(fileURLToPath(new URL("../../thincoder-core/tool-docs", import.meta.url)))
    .filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3))
  for (const off of OFF_PAYLOAD_TOOL_NAMES) {
    assert.equal(face.has(off), false, `现役对读·载荷面：名「${off}」已入载荷面（升格 ⇒ 名单须退场）`)
    assert.equal(toolDocNames.some((d) => d.includes(off)), true, `现役对读·tool-docs：名「${off}」零载体（退场 / 改名 ⇒ 名单须收正）`)
  }
  const consultFamily = [consultStartTool.name, consultStopTool.name, makeMainHistoryTool({ history: [] }).name]
  for (const n of consultFamily)
    assert.equal(OFF_PAYLOAD_TOOL_NAMES.some((off) => n.includes(off)), true, `现役对读·consult 族：「${n}」未被负向名单覆盖`)
```

- **腿义**：① 名数 = 12 钉死（D3：计数随名单同变）；② 去重 + 子串最小性（子串匹配语义下冗余即红）；③ 现役对读三向——载荷面不在场（**升格探测**）· tool-docs 逐名在册（**退场 / 改名探测**；基据 = DESC 单解析面「注册工具必有 tool-docs 档」）· consult 族现役名覆盖（**族内增改探测**；现役名来源 = `consult.mjs` 模块现读——本席已试跑属实：三枚 = `consult_start` / `consult_stop` / `main_history`，导入无网络 / 无 config 读）；
- **锚覆盖边界（认账）**：其余族的「新名未列」方向无锚（候选表口径 = §11.10-② 族枚举面，非载荷外名全集——本批不扩）；「载荷外名全集」式断言不立（无单一现役名册源）；
- **文件行数影响**：279 ⇒ **≈300**（导入 +1 ∥ 块 ≈20）——越该档旧「>280 行 ⇒ 拆两份」预算句（toolcall 批 §3）；按现行口径 500/800 **不触发拆分**（本批不拆——上抛②）。

### 2.4 逐条落地表（动作 ∥ 目标 file:line ∥ 期望结果 ∥ 机检法）

行数 = 2026-10-10 实读（口径 `split("\n").length−1`）。**主表（#1085 命名面 + #1142 + #1143）**：

| # | 条目 | 动作 | 目标 | 期望结果（引文逐字） | 机检法 |
|---|---|---|---|---|---|
| T-1 | #1085 | 引文收正 | `bench/lib/prices.mjs:10`（160 行） | `（本档 300 行上限）` ⇒ `（本档行数超线拆分——现行口径：软线 500 行 / 硬限 800 行）` | 旧串零命中 ∥ 新串命中 ∥ `node --check` |
| T-2 | #1085 | 引文收正 | `bench/lib/prices-judge.mjs:4`（169 行） | `（该档 300 行上限 + 级联计价增量）` ⇒ `（该档行数超线拆分 + 级联计价增量——现行口径：软线 500 行 / 硬限 800 行）` | 同上 |
| T-3 | #1085 | 引文收正 | `bench/lib/judge-fallback.mjs:4`（87 行） | `（300 行上限）` ⇒ `（行数超线拆分——现行口径：软线 500 行 / 硬限 800 行）` | 同上 |
| T-4 | #1085 | §3 触发句收正 | `docs/core/design/MODEL-BENCH.md:884`（2203 行） | `（三拆点 = 300 行上限触发）` ⇒ `（三拆点 = 行数超线触发——现行口径：软线 500 行 / 硬限 800 行）` | 实读命中 ∥ 旧串零命中 |
| T-5 | #1085 | §3 落点句收正 | `MODEL-BENCH.md:889` | ```——`judge.mjs` 300 行上限的拆分落点``` ⇒ ```——`judge.mjs` 行数超线拆分的落点（现行口径：软线 500 行 / 硬限 800 行）``` | 实读命中 |
| T-6 | #1142 | 名单置换 + 同行注随动 | `bench/toolcall/fixture.mjs:64-68`（148 行） | 名单 12 名（2.3-a 逐字）· `consult` 退场 · `:64` 注增 `+ consult 族` | 名单实读 12 名（序 ∥ 名集）∥ `"consult"` 裸串零命中 ∥ `main_history` 在位 ∥ `node --check` |
| T-7 | #1142 | 族枚举回写 | `MODEL-BENCH.md:2020`（§11.10-②） | `…与 depth 绑定族（`subagent` / `advisor` / …）` ⇒ `…、depth 绑定族（`subagent` / `advisor` / …）与 consult 族（`consult_start` / `consult_stop` / `main_history`）` | 三枚逐字在场（实读） |
| T-8 | #1143 | 结构腿补自锚 | `bench/test/toolcall.test.mjs:17` 后 ∥ `:154` 后（279 行 ⇒ ≈300） | 导入 +1 行；断言块（2.3-b 草案）——用例数保持 6 | `node --test bench/test/toolcall.test.mjs` 6/6 绿 ∥ 反例腿（2.6-#1143-c）∥ `node --check` |
| T-9 | #1143 | 测试面对读 | `MODEL-BENCH.md:2030`（§11.11 结构级） | 句尾续：`**负向名单自锚**（名数（12）/ 去重（含子串最小性）/ 现役对读——tool-docs 逐名在册 ∧ 不在载荷面 ∧ consult 族现役名覆盖）。` | 实读命中 |
| T-10 | 本批 | 变更记录一行 | `MODEL-BENCH.md` 变更记录尾 | 一行（2026-10-10 · 本批）：① 注释拆分引文随现行口径（命名 5 处 + 余量按准批面）∥ ② §11.10-② 补 consult 族三枚（名单 10 → 12）∥ ③ §11.11 补自锚；零新语义句 | 行尾实读命中 |

**余量子表（同族 · 候裁——建议并入本轮；未准前不落笔）**：

| # | 动作 | 目标（9 档 10 处 · 本席实读发现——§1 / 台账未列） | 期望结果 | 机检法 |
|---|---|---|---|---|
| T-11 | 同法收正（token = `行数超线`；不附口径句） | `bench/lib/pipeline.mjs:2` ∥ `lib/report-tables.mjs:2` ∥ `lib/report-time.mjs:2` ∥ `lib/report-review.mjs:2` ∥ `lib/report-params.mjs:3` ∥ `lib/report-speed.mjs:3` ∥ `bench/run.mjs:15` ∥ `bench/test/fixtures.mjs:2` · `:3` ∥ `bench/test/report-present.test.mjs:2` | 各处 `超 300 行` ⇒ `行数超线`（余文逐字不动；施行前逐处复核该串恰一处） | `bench/**`（`results/` 除外）「300 行」零命中 ∥ 逐档 `node --check` |

### 2.5 受影响文件与测试面（实读行数 · 口径 `split("\n").length−1`）

| 档 | 现状 | 预期 Δ | 说明 |
|---|---|---|---|
| `bench/lib/prices.mjs` | 160 | 0 | T-1 行内替换 |
| `bench/lib/prices-judge.mjs` | 169 | 0 | T-2 |
| `bench/lib/judge-fallback.mjs` | 87 | 0 | T-3 |
| `bench/toolcall/fixture.mjs` | 148 | 0 | T-6 名单块行数不变（4 行） |
| `bench/test/toolcall.test.mjs` | 279 | +21 ±3 | T-8 导入 1 + 自锚块 ≈20 ⇒ ≈300 |
| `docs/core/design/MODEL-BENCH.md` | 2203 | +1 ±1 | T-4 ∥ T-5 ∥ T-7 ∥ T-9 行内 + T-10 一行 |
| 余量 9 档（T-11 · 候裁） | pipeline 289 ∥ report-tables 288 ∥ report-time 49 ∥ report-review 164 ∥ report-params 35 ∥ report-speed 39 ∥ run.mjs 309 ∥ test/fixtures 204 ∥ test/report-present.test 304 | 各 0 | 行内替换 |

合计 = **15 档**（命名 6 + 余量 9；余量未准 ⇒ 6 档）· Δ ≈ +22 ±4 行。

**测试面**：落地件 = `bench/test/toolcall.test.mjs`（结构腿自锚 + 导入）——运行 `node --test bench/test/toolcall.test.mjs`（6 用例）；`bench/test/` 不进 CI（沿该面既有口径——手动跑）；`bench/results/**`（存档面）零触 ∥ 冻结副本零触。

### 2.6 验收对照（回指 3 条目 · 逐条可执行）

| 条目 | 验收（机检） |
|---|---|
| #1085 | a) `bench/**`（`results/` 除外）「300 行」零命中（UTF-8 工具面；余量准批则同判）；b) 命名 5 处新串逐字在位；c) 三档 `node --check` exit 0；d) `node scripts/doc-check.mjs` 涉档零新增（`MODEL-BENCH.md`）。 |
| #1142 | a) `fixture.mjs` 名单实读 = 12 名逐字（2.3-a）；b) `main_history` 在位 ∧ `"consult"` 裸串退场；c) `MODEL-BENCH.md` §11.10-② 三枚逐字在场；d) `node --test` 全绿。 |
| #1143 | a) 自锚块在位（名数 12 ∥ 去重 ∥ 子串最小性 ∥ 三向现役对读）；b) `node --test` 6/6 绿；c) **反例腿（一次性 · 不落档）**：实施序 = 先落 T-8 断言（对旧 10 名名单实跑 ⇒ 名数 ∥ 子串最小性 ∥ consult 族三腿红）→ 后落 T-6 ⇒ 绿（锚生效实证；红证读数入 §5）；d) 用例数 = 6（不新立）。 |

### 2.7 边界（不做）∥ 零触确认

**边界**：不改 bench 判据语义（三轴 ∥ 分母 ∥ 报告 / 重算面零动）；不扩负向名单面（§11.10-② 族枚举之外的角色 / 深度名不入表）；不动 §3 其余数字族（`>280` ∥ `299-300` ∥ `≥320` ∥ `≤300` 预算 / 引脚句 = 各批自有快照——非「一般拆线」表述；除 toolcall 档一句候裁 = 上抛②）；不重跑 / 不重出 `bench/results/**`；不触 stale-fixes 已收口档。

**零触确认**：核 `thincoder-core/**` 零写（新测试仅 import 只读面）；四端面（vscode / desktop / render-core / server）零触；他簇条目（Ⅰ–Ⅳ）零触；版本轴零动（`TOOL_PROBE_VERSION` 恒 1 ∥ `SUITE_VERSION` 恒 7 ∥ `PROBE_VERSION` / `judge.json` 零触）；`bench/toolcall` 判据件（`grade.mjs` / `report.mjs` / `cases.mjs`）零触；prompts / tool-docs 零触。

### 2.8 上抛项

① **[上抛·待裁] 同族余量并入**（T-11 · 9 档 10 处「超 300 行」引文——本席实读发现，§1 / 台账未列）：建议并入本轮（同面同法 · 注释级零风险 · 与本裁定同向收口）；未准前不落笔。
② **[上抛·待裁]** `bench/test/toolcall.test.mjs` 旧「>280 行 ⇒ 拆两份」预算句（toolcall 批 §3）与本批增行（279 ⇒ ≈300）相抵——本批裁定**不拆**（现行口径 500/800 不触发）；该句本身是否随本批 §3 面收正 = 候裁。
③ **[上抛·知会]** `stale-fixes` §2.7-③ 已收口冻结（§1 状态行 = 已收口）⇒「回写 §2.7-③」不可执行；承面处置见 KD-4；若父侧另有裁定 ⇒ 另派。
④ **[上抛·知会]** 面外提示：工作区旧口径（300/500）残文可能散落他面（例：`docs/RELEASE.md:387` 引旧对值）——不属本批射程（bench 面外），供父侧归批。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 本档 §2（eng-designer · initial 轮）；范围 = 本档 + §2 引用的坐标实读（逐坐标复核 · 只读）。实读复核结论（供父侧采信）：T-1..T-5 五处旧串坐标逐字命中；T-6（fixture.mjs:64-68）十条名集与 `consult` 占格属实；T-11 清单 = bench/**「300 行」全量 13 处中的余量 10 处（9 档）——与实读逐一相符；T-8/T-9 落点（:17 / :154 / :2030）与草案可行性（`face` 在作用域、`readdirSync`/`fileURLToPath` 已导入、12 名全在 tool-docs 在册且全在载荷外、`makeMainHistoryTool({history:[]}).name` 可解析）均成立；版本轴零动（名单不入 digest 面）与冻结副本零触属实。

| # | 类别 | Severity | 发现 | 改法 |
|---|------|----------|------|------|
| 1 | Requirements/Scope | 🟡 | T-11 状态两面对读不一致：§1 `:22`「同族余量并入（T-11 · 9 档 10 处）✓」已判并入，§2 `:164` 仍作「**[上抛·待裁]**」、`:126`「候裁——建议并入本轮；未准前不落笔」、`:144`「余量未准 ⇒ 6 档」。且 §2 `:152` 的验收「`bench/**`（`results/` 除外）「300 行」零命中」只有在 T-11 施行后才成立——实读 bench/**「300 行」共 13 处 = 命名面 3 处（prices.mjs:10 ∥ prices-judge.mjs:4 ∥ judge-fallback.mjs:4）+ 余量 10 处 | 把 §2 的 T-11 状态与 §1 裁定对齐（或显式记明以裁定为准），并把 AC-a 射程写清（命名面 only ∥ bench 全档） |
| 2 | Requirements/Scope | 🟡 | 旧预算句处置同样两面对读不一致：§1 `:22`「旧预算句随本批 §3 面收正 ✓」，§2 `:165` 仍作「该句本身是否随本批 §3 面收正 = 候裁」、`:158` 边界并列「除 toolcall 档一句候裁 = 上抛②」。该句实体 = `docs/core/design/MODEL-BENCH.md:961`（活档 · 本批已在其上落 T-4/T-5/T-9/T-10），且本批自身增行使该行相抵（§2 `:107`「越该档旧「>280 行 ⇒ 拆两份」预算句（toolcall 批 §3）」）；同句冻结副本见 `docs/batches/2026-09-25-tool-call-probe.md:65`（该档 §1 状态行 = 已收口 2026-09-25） | 为该句补一条 T 项（或记明缓办的判据 + 出处），使 §5 不必二次裁决 |
| 3 | Acceptance | 🟡 | §2 `:154` 反例腿预测「对旧 10 名名单实跑 ⇒ 名数 ∥ 子串最小性 ∥ consult 族三腿红」不可复现：旧 10 名（fixture.mjs:66-67）两两无子串包含关系 ⇒ 子串最小性腿实为绿；且断言按序短路（名数断言在其前）⇒ 单次实跑只见首红，consult 族红仅由 `main_history` 一支产生 | 把预测红集改为实际可复现者（名数 + consult 族 `main_history`），或注明断言逐条短路（单次实跑只报首个失败） |
| 4 | Clarity | 🔵 | 现役对读·tool-docs 腿用子串匹配（§2 `:98`「toolDocNames.some((d) => d.includes(off))」），与 §2 `:105` 自称的「退场 / 改名探测」强度不匹配（改名为仍含旧名的档名即通过） | 改为精确名比对（去 `.md` 后 basename 全等） |
| 5 | Clarity | 🔵 | §2 `:37` 坐标「现役三枚实读 = `thincoder-core/agent-tools/consult.mjs:87`「`main_history`」」等三处为声明坐标，名面字面在其下一行（consult.mjs:89 / :399 / :451） | 标注为声明坐标或改引 :89 / :399 / :451，保实读引文逐字 |
| 6 | Scope/Boundary | 🔵 | §2 `:158` 把 §3 其余 `>280` 引脚归为「各批自有快照——非「一般拆线」表述」，但 MODEL-BENCH.md:920 ∥ :925 ∥ :958 与所点 :961 同为「`>280 行 ⇒ 拆…`」拆线触发形，判据未写明区分线 | 把「不动」的判据写清（例：射程 = 本批所触档），使同形四行不致再被重提 |
| 7 | Consistency | 🔵 | 同一口径两种处置：命名面 5 处写入口径字面（§2 `:115`「（本档行数超线拆分——现行口径：软线 500 行 / 硬限 800 行）」等），余量 10 处按 D2 单源纯化（其句 `多` 已携设计档 §3 指针——实读 6 处直携、2 处经「体例同」间接，前提成立）；命名面即新增 5 份数字副本，口径再变即再漂 | 命名面保留字面 ∥ 以「现行口径见设计档 §3」指针收口，二者择一落字为决策 |
| 8 | Doc hygiene | 🔵 | 同档 §1 面两条状态行并存（`:6`「**状态行**：🔄 进行中（…）」未填注与 `:9`「**状态行**：🔄 进行中（设计轮已发）」），状态归属歧义 | 合并为一条（或删去未填的 `（…）` 行） |

计数：🔴 0 · 🟡 3 · 🔵 5 = 8 条（无 🔴 ⇒ 不阻过）。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-10-10（initial 轮 · T-1..T-11 全量落地 · 15 档 · 审计轮 1 fix 毕 · 代码评审轮 1 pass · 终态 clean）

**交付摘要**（承 §2 · 逐条 T-1..T-11 全量落地，零缩水；设计评审 F1–F8 处置随 §1 父裁）：

- T-1..T-5（#1085）：命名 5 处引文收正逐字落盘——`bench/lib/prices.mjs:10` ∥ `bench/lib/prices-judge.mjs:4` ∥ `bench/lib/judge-fallback.mjs:4` ∥ `docs/core/design/MODEL-BENCH.md:884` ∥ `:889`；旧串（「300 行上限」族）全幅零命中。
- T-11（余量并入 · §1 父裁①）：9 档 10 处「超 300 行」⇒「行数超线」（余文逐字不动）；`bench/**`「300 行」零命中（含 `results/`——强于 AC-a 射程）。
- T-6（#1142）：`bench/toolcall/fixture.mjs:64-68` 名单置换 10 ⇒ 12（`consult` 占格退场；`consult_start` / `consult_stop` / `main_history` 续尾）；`:64` 同行注补「+ consult 族」；Δ0 行（148 恒定）；`TOOL_PROBE_VERSION` 恒 1（名单不入 `casesDigest` / `payloadDigest`）。
- T-7：`MODEL-BENCH.md:2020` §11.10-② 族枚举补 consult 族三枚逐字（「、depth 绑定族…与 consult 族…」）。
- T-8（#1143）：`bench/test/toolcall.test.mjs:18` 导入 + `:156-171` 自锚块（名数 12 ∥ 去重 ∥ 子串最小性 ∥ 现役对读三向）；用例数保持 6；Δ **+16** 行（279 ⇒ 295——设计估 +21 ±3 ⇒ 实落 +16，差 −5 行，仍远在 500 软线内，功能零差）。
- T-9：`MODEL-BENCH.md:2030` §11.11 句尾续自锚句逐字（名数（12）/ 去重（含子串最小性）/ 现役对读）。
- T-10：`MODEL-BENCH.md:2204-2206` 变更记录一行（① 引文收正 ∥ ② §11.10-② consult 族 ∥ ③ §11.11 自锚 ∥ ④ §3 旧预算句收正——④ 为本批实改补记，判据见决策表 #5）。
- F2（§1 父裁②）：`MODEL-BENCH.md:961` 旧「>280 行 ⇒ 拆两份」预算句收正为「行数超线（拆分）——现行口径：软线 500 行 / 硬限 800 行」（现档 ≈295 行 ⇒ 不触发拆分）；`docs/batches/2026-09-25-tool-call-probe.md:65` 冻结副本零触。

**反例腿红证读数（一次性实跑 · 照实记 · AC-c）**：

- 实施序照 §2.6-#1143-c：先落 T-8（新断言 × 旧 10 名名单）⇒ 实跑红：`node --test bench/test/toolcall.test.mjs` = **5 pass / 1 fail**；首红（断言逐条短路）= 名数锚 `10 !== 12`（断言坐标 `bench/test/toolcall.test.mjs:157`）。
- 全腿红集（逐腿不短路复核 · 实测）= **3 支**：① 名数 10 ≠ 12 ∥ ② tool-docs·`consult` 零载体 ∥ ③ consult 族·`main_history` 未覆盖；「去重 / 子串最小性 / 载荷面不在场」对旧名单为绿（旧 10 名两两无子串包含——评审 F3 更正成立）。
- 措辞对齐（审计轮 1 备注随正）：§1 F3 句载「两支」，实测 **3 支**——差支 = ② tool-docs·`consult` 零载体；成因 = F4 随正（子串 ⇒ 精确名比对）后该腿顺带捕获族干名占格本体（无 `consult.md` 档；子串语义下 `consult` 可借 `consult_start.md` 混过）——收严方向，锚更强。§5 以三项实测为准。
- 绿证：落 T-6（12 名）后同命令 **6/6 全绿**（红/绿两轮读数 = 5/1 · 6/0）。

**机检读数（终态）**：

- `bench/**`「300 行」= **0 命中**（全树含 `results/`）；余量 10 处「行数超线」逐处在位（9 档）。
- `node --check` × 14 档 bench `.mjs` = 全 exit 0。
- `node --test bench/test/toolcall.test.mjs` = **6/6 pass**（用例数 6——不新立）。
- `node scripts/doc-check.mjs` = **悬空 0**（全仓）；本批涉档零新增悬空。
- 旧串零命中复核：`bench/toolcall/fixture.mjs` 内 `"consult"` 裸串 0 ∥ `main_history` 在位；`MODEL-BENCH.md`「三拆点 = 300」0 ∥「300 行上限的拆分落点」0。

**决策透明表**：

| # | 决策点 | 落法 | 依据 |
|---|---|---|---|
| 1 | 评审 F4（tool-docs 腿：子串 ⇒ 精确名） | **随正** = `toolDocNames.includes(off)` | 评审建议原案；「逐名在册」语义 = 精确名（12 名逐名有档——已实核）；子串语义有改名漏检，且漏掉族干名占格本体（本轮红证新增捕获支） |
| 2 | 评审 F5（`consult.mjs` 声明坐标） | **维持**（取声明坐标义） | §1 父裁随入句「F5 坐标 = 取声明坐标义」；三枚现役名实核 = `consult.mjs:89` / `:399` / `:451` |
| 3 | 评审 F6（§3 其余 `>280` 三行 `:920` ∥ `:925` ∥ `:958`） | **维持**（不动） | §1 父裁② 只点 toolcall 档一句（:961）；§2.7 边界「不动 §3 其余数字族（各批自有快照）」；三行分属他批档（probe/driver · probe.test · toolcall/variants）之快照 |
| 4 | `:961` 收正措辞形 | 「行数超线（拆分）——现行口径：软线 500 行 / 硬限 800 行」 | 族语形取 KD-1.4 汇总式（「行数超线」token + 500/800 口径字面）；不直换数字（KD-1.4.4 同理）；现档 ≈295 行 ⇒ 不触发拆分 |
| 5 | 变更记录行含 F2 项（设计 T-10 文本只列 ①②③） | 加 ④ 项 | §1 父裁② 令本批收正该句；D7 变更留痕——该 doc 实际改动须入变更记录 |

**零触确认**：bench 判据语义（三轴 / 分母 / 报告 / 重算面）零动；`bench/results/**` 零触（不重跑 / 不重出）∥ 冻结副本（`toolcall-fixtures.frozen.mjs`）零触 ∥ `stale-fixes` 已收口档与 `2026-09-25-*` 冻结档零触 ∥ 他批档零触 ∥ 核 `thincoder-core/**` 零写 ∥ 四端面零触 ∥ 版本轴零动（`TOOL_PROBE_VERSION` 恒 1 ∥ `SUITE_VERSION` 恒 7 ∥ `PROBE_VERSION` / `judge.json` 零触）。

**审计与代码评审轮次（终态见本段末）**：

- 内部偏差审计（explore 子代理 · 只读）**轮 1**：DEVIATIONS 1 条（🟡 PARTIAL——§5 未写入，AC-c 反例读数未落档面）+ 逐条核验全通过（T-1..T-11 + F2/F6 + out-of-list 0 + 文档漂移 0）；备注 1（红集措辞两面——已按三项实测随正，见上）。**修复 = 本段落盘**（fix 轮 1）。
- 代码评审（advisor · code）：见下一追加块。

**代码评审轮次（advisor · code · 轮 1 = 终轮）**：VERDICT = **pass**（🔴 0；🟡 2 = 报告项 · 非 must-fix；🔵 4 = 建议）；无 must-fix ⇒ 无修复/验证次轮。顾问侧未能独立复跑机检三项（无执行工具 ⇒ 采 §5 自述并标 unverified——三项本席均已实跑，读数在案）；静态面全幅复核成立。

**响应表（逐条处置）**：

| # | 严重度 | 发现摘要（顾问） | 处置 | 理由 |
|---|---|---|---|---|
| 1 | 🟡 报告项 · 非 must-fix | `MODEL-BENCH.md:1801`/`:2034` 仍「单档 >280 行即拆」，与 `:961` 新口径相抵；`bench/test/toolcall.test.mjs` 现 295 行字面触发之 | **接受为记录项 · 不落笔 · 转父侧** | 超 §2.7 边界（本批不动「>280」族；F6 维持先例）；文档层归父侧 §6 二择一（扩 F6 注记 ∥ 按 #1085 同法收正） |
| 2 | 🟡 报告项 · 非 must-fix | 冻结档 `2026-10-09-stale-fixes.md:406` 旧 10 名集跨档滞后 | **接受为记录项 · 零改** | 已裁事项（KD-4 + §1 父裁③：record face as-of，live 面承接）；前向指针若需 = §6 收口句内落 |
| 3 | 🔵 | §11.10-② 实例族枚举「台账查询」非字面名 `ledger`（与 §11.11 机检 12 名面不可 1:1 对读） | **维持 · 转设计/父侧** | T-7 替换串 = 设计精确文本（只落 consult 族三枚）；扩改实例族枚举超本批落字面 |
| 4 | 🔵 | `:961`「行数超线（拆分）」可被读作已成拆分（列头已定触发义，可消歧） | **维持 · 备用措辞在案** | 改动将波及 §5/变更记录引文（记录面引文已锁）；父侧若采「⇒ 拆分」形可 §6 点名 |
| 5 | 🔵 | §11.11 自锚句未钉「精确名」语义（实现 = basename 全等，随评审 F4） | **维持 · 转设计侧** | T-9 期望串 = 设计精确文本；代码侧无需改（断言文案自明，语义防漂建议归设计档） |
| 6 | 🔵 | §2.5 Δ 声明 +21 ±3 vs 实落 +16（越带） | **接受（已披露）· 无动作** | §5 已照实记（见上）；295 ≪ 500 软线，接受面无影响 |

**终态 = clean**：审计轮 1（1 🟡）→ fix 轮 1（§5 落盘，读回确认）→ 代码评审轮 1 = pass；无 must-fix 未决；2 🟡 报告项 + 4 🔵 建议随本段转父侧（§6 处置面）。附注：宿主引文核 0/3（`report-review.mjs:2` ∥ `fixtures.mjs:3` ∥ `report-present.test.mjs:2` 标 "file unreadable"）——三行本席已实读在位（本会话 read 实读，同文在 §5 上段），判为宿主跨根解析假阴性，无待办。

## §6 验证与收口（父代理）

**交付物**：bench 面 15 档（注释引文 5 处 + 余量 10 处「行数超线」∥ 负向名单 10⇒12 ∥ 自锚块 ∥ `MODEL-BENCH.md:961` 收正 ∥ §11.10-② / §11.11 随正）+ 批内件（`bench/test/toolcall.test.mjs`）——§5 全 8 条 ✅（eng-coder #87）。

**父侧验证读数**：`node --test bench/test/toolcall.test.mjs` = **6/6 绿**（父侧实跑 · 1076ms）∥ 红证轮 5/1（coder 读数——首红 = 名数 `10 !== 12`）∥ `git grep "300 行" -- bench` = **0** ∥ `node scripts/doc-check.mjs` = 悬空 0。

**父裁落笔（父侧同法收正 · 可 revert）**：① `MODEL-BENCH.md:1801` ∥ `:2034` 两处例数预算句「单档 >280 行即拆」⇒「单档行数超线即拆」（与 ④ 同口径）；② 变更记录补一行；③ §3 各批拆分计划快照族（`:920` ∥ `:925` ∥ `:958`）按序不动（各批自有快照——F6 判据句已落）。

**上抛处置**：① T-11 余量并入 ✓（9 档 10 处落讫）∥ ② `:961` 随本批收正 ✓ ∥ ③ stale-fixes 冻结档不可回写——维持（另派：无）∥ ④ 面外旧口径残文——归属簇 ⅩⅢ（out-of-scope-residues 轮已处置 `RELEASE.md:387` 等）。

**评审终态**：设计评审 §3 轮 1 = **pass**（0🔴 · 3🟡 · 5🔵——F1..F8 随 §1 父裁落）+ 顾问代码评审 = **pass**（残留见 §5 响应表；🟡② 收口句：现行 12 名集 = §11.10-② + 本批 §5）；评审后零代码变更。

**结算**：#1085 ∥ #1142 ∥ #1143 ⇒ 核销（evidence = 本档 + 6/6 读数）。**待办**：波尾 scoped commit；无未决项。
