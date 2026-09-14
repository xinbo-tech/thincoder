# 批次档 · DeepSeek V4.1-Flash · qwen-plan 渠道名接入（DEEPSEEK-QWENPLAN）· 2026-09-15

> **建档 ✓：2026-09-15 04:0x（父代理 §1）。触发 = 用户快车道需求**（2026-09-15 04:00）：
> 「qwen-plan里deepseek-flash叫deepseek-v4.1-flash，这个名字不在model spec里无法使用1m上下文，帮我加进去」。
> 后续裁定（04:00 / 04:01）：只动新内核（VSC 端不动）· `deepseek-v4-flash-0731` 不加（前缀已命中退役行）·
> multimodal **给 true、对齐 `deepseek-flash`**。

## §1 批次任务（主 agent · 父代理）

**目标**：`deepseek-v4.1-flash`（qwen-plan 渠道访问 DeepSeek V4.1-Flash 的模型名）加入核内
`MODEL_SPECS` 表（`thincoder-core/model-specs.mjs`），能力位**逐字段对齐 `deepseek-flash` 行**
（1M ctx / 384K out / thinking true / prefixMode / cacheMode auto / thinkApi type /
reasoningEcho required / reasoningEffortEnum low·high·max / tempRange [0,2] / **multimodal true**
——用户 04:01 拍板）。病根：`.1` ≠ `-`，`deepseek-v4.1-flash` 不命中 `deepseek-flash` /
`deepseek-v4-flash` 任何既有前缀 → `lookupSpec` miss → 回落 128K 默认。

**范围（用户裁定 · 硬）**：
1. **只改核内** `thincoder-core/model-specs.mjs`（deepseek 段加一行）+ 核内 spec 测试（正向断言）；
2. **VSC `thincoder-vscode/src/config.mjs` 零触碰**（VSC 未迁移——用户「只加到新内核里就行了，不要动vsc端」）；
3. **`deepseek-v4-flash-0731` 不加**（用户裁定 + 代码实证：`lookupSpec` 纯前缀匹配，startsWith(deepseek-v4-flash) = true → 已命中退役行，享同参数）；
4. 不 commit、不发起评审（发起权 = 用户）。

**受影响文件（R24a · 基准）**：`thincoder-core/model-specs.mjs`（现行 180 行，表体 `:28-96`）
+ 核内测试 1 档（落点由 eng-designer 勘察）+ 设计档（落点由 eng-designer 按项目文档约定）。
delta：+1 行 spec + 断言若干。

**核验纪律**：核内 `node --test` 全绿 · 三闸（doc-anchors / check-doc-width / check-ledger）按批次惯例 ·
单笔可 revert · D6 回读核对。

## §2 批次任务（eng-designer）

（待本批写入）

**本批任务（eng-designer · DEEPSEEK-QWENPLAN）**：核内 `MODEL_SPECS` 增加 `deepseek-v4.1-flash` 行（qwen-plan 渠道访问 DeepSeek V4.1-Flash 的模型名），能力位**逐字段对齐 `deepseek-flash` 行**（含 `multimodal: true`——用户 04:01 拍板），使该渠道模型获真实能力规格（1M ctx / 384K out），不再回落 128K 默认。
**范围内（本批覆盖的需求）**：需求档 `docs/core/requirements/PROVIDER.md` §4.4 **R21** + **N10**（1M 命中）/ **N11**（零前缀回归）/ **N12**（零 VSC 触碰）。

**设计概要（批次材料形态——长寿命语义落设计档 `docs/core/design/PROVIDER.md` §6.11 / §7 D-PR25，按该档 §8.2 契约）**：

**① 方案选型对比**：

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论（否决理由） |
|---|---|---|---|---|
| 1 | **纯加前缀行**（`deepseek-v4.1-flash` → `deepseek-flash` 同参数字段） | 零机制变更；新行 19 字符 > `deepseek-v4-flash` 17 字符 ⇒ SORTED_SPECS（`:109` 前缀长降序）排序在前、互不 shadow；全名 `startsWith` 精确命中新行（实测 19 vs 17） | 每次请求多一次前缀比较（O(n) 线性，n=38 行，代价可忽略）；表 +1 行 | **选定**——单一 prefix 表零机制变更，与 D-PR19「不引入运行期机制」同源 |
| 2 | **改查表逻辑**（namespace 剥离 / 别名表 / 归一化：`.`↔`-`） | 用户裁定隐含否决（`deepseek-v4-flash-0731` 前缀命中实证 = 纯前缀足够） | 动 `lookupSpec` / 加别名机制 = 新机制 + 新维护面 | **否决**——0731 先例实证纯前缀够用；别名机制先例被否（D-PR19 同源） |
| 3 | **不改**（维持 128K 回落） | 病根不除——1M 上下文用不上、未知模型告警持续 | —— | **否决**——正是本批要解决的缺陷 |

**② 接口契约（spec 行逐字段 · 对齐 `deepseek-flash`）**：`context: 1_000_000` · `maxOutput: 384_000` · `thinking: true` · `prefixMode: true` · `cacheMode: "auto"` · `thinkApi: "type"` · `reasoningEcho: "required"` · `reasoningEffortEnum: ["low","high","max"]` · `tempRange: [0, 2]` · `multimodal: true`。
查表语义零改（`lookupSpec :114-128` 纯前缀 + `/` namespace 剥离保持原样）；`specForModel` / `specMatch` / `providerSpec` 契约零改。

**③ 受影响文件（R24a · 行数实测 2026-09-15）**：

| # | 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|---|
| 1 | `thincoder-core/model-specs.mjs` | 180 | +2（1 注释 + 1 spec 行）→ 182 | deepseek 段 `:33` 后插新行，字段逐字对齐 `deepseek-flash` |
| 2 | `thincoder-core/test/model-specs.test.mjs` | 0（新建） | +45±5 | 行为断言（specForModel / specMatch 返回断言；**禁逐字子串散文锚**） |
| 3 | `docs/core/requirements/PROVIDER.md` | 127 | +21（已落） | §4.4 R21 / N10–N12 + 变更记录 |
| 4 | `docs/core/design/PROVIDER.md` | 293（已落） | —（本批已完成） | §6.11 行集补渠道名 · §7 D-PR25 · §9 行数 · 变更记录 |
| 5 | `docs/batches/2026-09-15-DEEPSEEK-QWENPLAN.md` | 55 | +本段 | §2 append（本段） |

**④ 关键决策**：D-PR25（已落设计档 §7——加行对齐、否决查表机制改造）。**⑤ 边界（明列批外 · 本批零写入）**：`thincoder-vscode/**` 一字不改（N12）；`deepseek-v4-flash-0731` **不加行**（前缀已命中退役行，共享同参数）；不改查表机制本体；不改其它厂商任何 spec 行；不动预设 `qwenplan`（默认模型 `qwen3.7-max` 与本批无关）；不 commit、不发起评审。**⑥ UI/交互决策**：无用户可见新面（能力表底层增量——面板下拉 / 规格显示自动跟随）；`open` 项：无。

**验收标准（逐条回指需求 · 机器可验）**：

| # | 回指 | AC |
|---|---|---|
| A-1 | R21 | 新档 `model-specs.test.mjs` 断言 `specForModel("deepseek-v4.1-flash")` 逐字段 deepEqual `specForModel("deepseek-flash")`，且显式 context = 1_000_000 · thinking true · prefixMode true · multimodal true · cacheMode "auto" |
| A-2 | R21 | `specMatch("deepseek-v4.1-flash")` 返回 `{ matched: true }`（未知模型 warn + DEFAULT_SPEC 分支不进入） |
| A-3 | N11 | `specForModel("deepseek-v4-flash")` / `specForModel("deepseek-v4-flash-0731")` 仍命中退役行（context 1_000_000 · multimodal true）——新行不 shadow；`deepseek-v4-pro` 仍保守行（无 multimodal） |
| A-4 | N10 | 核内 `node --test` 全绿（含新档断言）；`git status` 本批改动 ⊆ 声明写域（`thincoder-vscode/**` 零改动——文件级实核） |

**用例表（正常 / 边界 / 错误）**：

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| T-1 | 正常 | `specForModel("deepseek-v4.1-flash")` | deepEqual `deepseek-flash` 行（1M / 384K / thinking / prefixMode / cacheMode auto / multimodal true） |
| T-2 | 正常 | `specMatch("deepseek-v4.1-flash")` | `{ spec: 同 T-1, matched: true }` |
| T-3 | 边界 | `specForModel("deepseek-v4-flash")` · `("deepseek-v4-flash-0731")` | 均命中退役行（context 1M · multimodal true）——19 字符新行不 shadow 17 字符前缀 |
| T-4 | 边界 | `specForModel("deepseek-v4-pro")` | 保守行（1M / 无 multimodal） |
| T-5 | 错误 | `specMatch("deepseek-no-such-model-x")` | `{ spec: DEFAULT_SPEC（128K/32K）, matched: false }`——未知模型兜底不回归 |

**三闸读数（改后 · 实跑）**：`doc-anchors` 域一 125 档 · 悬空 4（`ESCALATE.md:151` · `MULTI-INSTANCE-COLLAB.md:75` · `SETTINGS-TOOL.md:99` · `AGENT-PARAMS.md:59`——**均非本批档**）；域二 CLI 树 99 档 · 悬空 1（`TWO-REPO-MERGE.md:404`——既有登记项，非本批）。
`check-doc-width` **本批两档 0 超宽**（402 文件全绿；本批曾自产 1 行 474 字符已当场拆行修复）；V1 1 条（`NORMAL-MODE.md` 引「PROJECT 档 §0.6」no-section——非本批档）· V3 1 条 = 本批批次档 §3 缺工具写入轮次行（**评审子代理未运行 = 预期空态**，评审运行即消——§3 属评审段，一段一作者）。`check-ledger` 0 处违规 · 基线 0。锚闸域一 4 + 域二 1 悬空均与本批无关，如实上报待父侧核销（均非本批文件）。

**发现（逐条 · 不静默）**：

- **① 任务书数字化与实测不符 2 处（一致性面 · 已当场修正并按实测落笔）**：新行 `deepseek-v4.1-flash` = **19 字符**（任务书 §1 记 20）、`deepseek-v4-flash` = **17 字符**（记 18）——node 实导入 model-specs 计算；关键性质不变（19 > 17 ⇒ sort 序在前、互不 shadow）。
- **② 需求档 §2.2 适用工作流回指表未加本批新行**：R21 系规格表增量（模型能力声明），非对外契约 / 命令面变更——F13 面不命中；回指表按既有条目保持（如实说明，不强行登记）。
- **③ 文档地图核对**：`docs/README.md` §4 登记 PROVIDER 板块 = 「模型能力表 / spec 查表」主题持有者（需求侧 / 设计侧同板块名成对）——按「更新其模型表段、**不新建专档**（一个功能点不独立成文）」落位；全仓检索无其它持有该主题的既有档；`config-presets.mjs:23` 的 `qwenplan` 预设（默认模型 `qwen3.7-max`）确认与本批无关、不动。
- **④ 任务书行数基准**（`:33`/`:36`/`:38`/`:40` deepseek 段行号 · `:109`/`:114-128`/`:133-139`/`:174-179` 查表语义）：逐处实读复现一致（下划线处见批 §1 已知事实对照——全部吻合，无漂移）。

**变更记录**：- 2026-09-15（**qwen-plan 渠道名接入批** · eng-designer）：§2 建档——本批任务（R21 / N10–N12）+ 方案选型（纯加行否决查表改造）+ 接口契约（对齐 `deepseek-flash`）+ 受影响文件（R24a 实核）+ AC A-1–A-4 + 用例 T-1–T-5 + 三闸读数 + 发现 4 条。

2026-09-15（**评审修正轮 · 🔵2** · eng-designer）：本批评审 **pass（🔴0 🟡0 🔵2）**——🔵 #2（论证口径）与 🔵 #3（术语统一）经本段立项，修正落地于设计档 §7 D-PR25 与需求档 §4.4（:97 术语统一 · N11 论证口径——落地证据见两档变更记录）；§2 本段正文 / 选型表已被评审引用
（§3 轮次 1 #1 行核：19/17 计数 · 互不 shadow 论证均经评审核过）——按修正纪律（评审过 · 段 append-only）**正文不更新**，仅本行注记存档；T-3 / 发现① 的长度表述为既有记录，语义面由前缀不相交论证覆盖。

2026-09-15（**修正轮续 · 机检修整** · eng-designer）：批次档 §2 四条散文行超 300 字符（原 :34/:46/:79/:90）就地折行（**语义与文字零改**）；三闸读数行自引「PROJECT 档 §0.6」token 改描述式避免自触 V1（该 V1 本体 = NORMAL-MODE.md——非本批档）；§2 既有读数记「本批 0 超宽」与本次实测 4 行超宽不符（时点/口径存疑）——已按本轮实测校正落档。

## §3 设计评审

（待评审写入）

### 轮次 1（评审子代理）

前轮评审 = 429 失败（零签发条目）→ 本轮为实质首轮：核对设计 §6.11 + §7 D-PR25 + 需求 §4.4（DEEPSEEK-QWENPLAN 批）。

| # | 文件 | 严重度 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 设计 PROVIDER.md §6.11（:160-167）· §7 D-PR25（:245）· 需求 §4.4（:93-111） | — | 已核 | 跨档一致：qwen-plan 渠道名 `deepseek-v4.1-flash` 独立加行、逐字段对齐 `deepseek-flash`（设计 :165 ↔ 需求 :97-98）；19 / 17 字符计数成立；`.1`≠`-` ⇒ 与既有行前缀不相交，互不 shadow 成立；§9 实测 293 行与本档实际行数相符（设计 :276）；两档变更记录与本批内容一致（设计 :292 ／ 需求 :126）；R21 判定句字段词汇（ctx / out / thinking / prefixMode / cacheMode auto / thinkApi type / reasoningEcho required / reasoningEffortEnum / tempRange / multimodal）与设计 §6.9 字段集一致；N12 零 VSC 触碰与设计仅核侧面表述一致 |
| 2 | 设计 §7 :245 · 需求 §4.4 N11（:105-106） | 🔵 | New | 「新行 19 字符 > 退役行 17 字符 ⇒ sort 序在前」为按长度排序的论法；若按字典序 `deepseek-v4-flash` 反在前。互不 shadow 的实际根据 = 前缀不相交（第 12 位 `.` vs `-`），与排序无关 ⇒ 论证口径建议写为前缀不相交（非阻塞） |
| 3 | 需求 §4.4 :97 | 🔵 | New | 「`lookupSpec` miss」中的 `lookupSpec` 符号在本档 / 设计层（统一用语 specForModel / specMatch / 前缀查表）均无定义——术语未统一（非阻塞） |

计数：🔴 0 · 🟡 0 · 🔵 2
VERDICT: pass

## §4 裁决 / 批准

- **裁决表（评审 pass 后 · 第二轮收敛）**：2 条 🔵 → **Fixed**（修正轮落地，实读核验通过）——
  🔵#2 论证口径：设计 `docs/core/design/PROVIDER.md:245` + 需求 `docs/core/requirements/PROVIDER.md:105-106` 改「前缀不相交（第 12 位 `.` 与 `-` 互不为前缀）⇒ 互不 shadow」；
  🔵#3 术语统一：需求 `:97` `lookupSpec` →「前缀查表 miss（`specForModel` 回落）」。
- **批准（用户 · 2026-09-15 04:29 会话面）**：批准实施——核内 `model-specs.mjs` 增行 + 新建核内测试档。
- **批准范围（硬）**：只动 `thincoder-core/model-specs.mjs`（+1 行 spec + 注释）· `thincoder-core/test/model-specs.test.mjs`（新建行为面断言）；
  VSC 零触碰（N12）· `deepseek-v4-flash-0731` 不加 · 不 commit · 不发起评审。

## §5 实施（eng-coder）

（待本批写入）

**交付摘要**：核内 `thincoder-core/model-specs.mjs` deepseek 段 `:33` 后插入 `deepseek-v4.1-flash` 行（+1 注释 `:34` +1 spec 行 `:35`——字段逐字对齐 `deepseek-flash` 行，含 `multimodal: true` 用户 04:01 拍板）；新建 `thincoder-core/test/model-specs.test.mjs`（60 行 · 5 用例 T-1..T-5 行为面断言 · 无逐字子串散文锚）。文件 180 → 182 行（与设计预估一致）。

**决策透明表**：

- 🔵 #2（评审 · 行对齐）：**Not an issue**——deepseek 段内补位本参差（`:33` flash 4sp · `:38` v4-pro 3sp · `:40` v4-flash 1sp · `:42` vision-exp 1sp，`{` 实测落列各不同）——无统一对齐列规则；新行 1sp 与同段多数行一致。
- 🔵 #1（评审 · 受影响表行数漂移：实测 60 行 vs 预估 +45±5）：**Deferred**——内容 = AC 精确覆盖的 5 用例 + header 6 行 + silent 助手 5 行，不为预估瘦身；受影响表属 eng-designer/父侧文档面，不在本批写域，交 §6 收口勘正。
- 探索审计（subagent explore · 只读）：分歧四类 = **0**——AC A-1..A-4 逐条 ✅ · spec 行逐字对齐 ✅ · VSC 零触碰 ✅ · D-PR25 机制零改 ✅。

**验证（命令 + 结果 · 实跑）**：

- `cd thincoder && node --test thincoder-core/test/model-specs.test.mjs` → **5/5 pass · 0 fail**（114ms）。
- `cd thincoder && node --test "thincoder-core/test/*.test.mjs"`（完整核内套件）→ **178/178 pass · 0 fail**（5.4s）。注：Node 24.19.0 Windows 下目录实参 `node --test thincoder-core/test` 报 MODULE_NOT_FOUND（运行器目录扫描缺陷）——以等集 glob 实跑：test/ 下 27 档全为 `*.test.mjs`，文件集合一致。
- `git diff thincoder-core/model-specs.mjs` → 恰 **+2 行**（`:34` 注释 + `:35` spec 行）。工作树既有脏态（设计/需求档 14 档 + `thincoder-vscode/docs/COMPETITIVE_ANALYSIS.md`）为父侧/设计侧先行改动——非本批；**本批足迹 = 声明两档**（文件级实核）。
- 三闸（doc-anchors / check-doc-width / check-ledger）按批次惯例由父侧 §6 收口实跑。

**审计与代码评审轮次与终态**：探索审计 1 轮（分歧四类 = 0）· advisor code review 1 轮（VERDICT: **pass** · 🔴0 🟡0 🔵2——#1 Deferred · #2 Not an issue；无 🔴 ⇒ 无修正轮）。**终态：clean**。

**交付表（一行一条 AC）**：

| # | Status | AC |
|---|--------|-----|
| A-1 | ✅ Done | `specForModel("deepseek-v4.1-flash")` 逐字段 deepEqual `specForModel("deepseek-flash")` + 显式 context 1_000_000 · thinking true · prefixMode true · multimodal true · cacheMode "auto"（T-1 断言全绿） |
| A-2 | ✅ Done | `specMatch("deepseek-v4.1-flash")` 返回 `{ matched: true }`——未知模型 warn + DEFAULT_SPEC 分支不进入（T-2） |
| A-3 | ✅ Done | `deepseek-v4-flash` / `deepseek-v4-flash-0731` 仍命中退役行（1M · multimodal true）——新行不 shadow；`deepseek-v4-pro` 仍保守行（无 multimodal）（T-3/T-4） |
| A-4 | ✅ Done | 核内完整套件 178/178 全绿（含新档）；本批改动 ⊆ 声明写域（`thincoder-vscode/**` 零改动——文件级实核） |

**变更记录**：- 2026-09-15（**qwen-plan 渠道名接入批** · eng-coder）：§5 建档——实施摘要 + 决策透明表 + 验证（新档 5/5 · 核内 178/178）+ 审计/评审轮次与终态（clean）+ 交付表 A-1..A-4 全 ✅。

## §6 验证与收口（父代理）

**交付核验（父侧独立复验 · 2026-09-15）**：
- 源码实读：`thincoder-core/model-specs.mjs:34-35` —— +1 注释 +1 spec 行（`deepseek-v4.1-flash` 逐字段对齐 `deepseek-flash`，含 `multimodal: true`）；`git diff` 恰 +2 行 ✅
- 测试档实读：`thincoder-core/test/model-specs.test.mjs`（60 行）—— T-1..T-5 行为面断言，无散文锚 ✅
- 独立复跑：新档 `node --test .../model-specs.test.mjs` = **5/5 · 0 fail**；核内完整套件 = **178/178 · 0 fail**（记录 `.thincoder/tmp/DSQP-full.log`）✅
- 三闸（父侧实跑 · 落盘日志）：`doc-anchors` = `OK(V5): 0 条悬空锚`（域一）· `check-doc-width` = `OK(宽度): 402 文件无 >300 字符单行` · `check-ledger` = 两档 `OK` · 0 违规 ✅（记录 `DSQP-{anchors,width,ledger}.log`）
- 写域自证（git status）：本批足迹 = 声明写域（`model-specs.mjs` M · `model-specs.test.mjs` U · 两 PROVIDER 档 M · 批次档 U）——**`thincoder-vscode/**` 零触碰（N12）** ✅；工作树其余改动 = 并行线/他批，非本批

**验收逐条勾销（回指 §2 AC）**：

| # | 回指 | 验收 | 结果 |
|---|---|---|---|
| A-1 | R21 | specForModel("deepseek-v4.1-flash") 逐字段 deepEqual deepseek-flash 行 + 显式 1M/thinking/prefixMode/multimodal/cacheMode auto | ✅（测试 T-1 · 实读 :35） |
| A-2 | R21 | specMatch 返回 matched:true（DEFAULT_SPEC 兜底分支不进入） | ✅（T-2） |
| A-3 | N11 | deepseek-v4-flash / -0731 仍命中退役行；v4-pro 仍保守行（不 shadow） | ✅（T-3/T-4） |
| A-4 | N10 | 核内 node --test 全绿；git status ⊆ 声明写域 | ✅（178/178 · VSC 零触碰） |

**核销同步清单（D7）**：角色表（§1 父 · §2 designer · §3 评审 · §4 父 · §5 coder · §6 父——段界完整、无越段）✅ · 批次 §2/§4/§5 变更记录各行在位 ✅ · 台账：本批为**快车道**（用户「帮我加进去」= 单点不入池）——无池条目需勾销；checklist **T200 勾销** ✅ · 变更记录：台账无本批登记（不落池）· **测试层处置**：新测试档 = 行为面常驻断言（对应 AC A-1..A-4，系本批验收资产）——不入退役面 ✅

**批外注记（不静默 · 已登记/待办）**：
- **① 设计档行数声明漂移（登记，待文档维护轮）**：`docs/core/design/PROVIDER.md:276` §9 实测行数记「293 行」，评审修正轮变更记录 +1 行后现为 **294**——as-of 声明滞后；归入台账技术待办「文档↔实装漂移（类）」条目，触发 = 条件（该面下次触碰时）。**不重开本批**（非本批代码/测试面）。
- **② 受影响表预估漂移（§5 🔵#1 Deferred 确认）**：§2 预估新测试档 +45±5，实测 60 行——差值 = 头注 6 行 + silent 助手 5 行；AC 精确覆盖不减；已登记 §5，本批不追。
- **③ 三闸报告面提示（不入闸）**：doc-anchors 报告 V5 符号宽若干条（DESIGN-TOKEN-SETTLEMENT / ENG-TOKEN-BINDING / TESTING / E2E-HARNESS 档）——报告面非闸态，与本批无关。

**收口**：本批闭环 ✅ —— 病根（`.1`≠`-` 前缀 miss → 128K 回落）已除，`deepseek-v4.1-flash` 现查得 1M/384K 真规格；VSC 零触碰；不 commit（按批准范围）；任务书/设计/评审/批准/实施/验证六段齐全。