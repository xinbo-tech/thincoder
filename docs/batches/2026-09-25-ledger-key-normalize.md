# 2026-09-25 · ledger-key-normalize
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 04:22 问诊（VSC 端答「需求池已清空」）→ 04:26 全仓同类审计 → 04:27「修复吧」——台账库键未规范化（同项目双库）修复批。
> 台账 = #286（ENGINEERING-MODE-V2 · 归批）。前情 = docs/batches/2026-09-25-hygiene-ab.md（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 诊断与授权（父侧 · 2026-09-25 04:2x–04:3x · 台账 #286）

**来源**：用户 04:22 问「为什么 vscode 插件里他说需求池已清空」→ 父侧破案（04:2x）→ 用户 04:26「你再检查一下其他功能有没有类似的路径名没有规范化的问题」→ 04:27「修复吧」。

**病灶（实证链 · 全部本席亲读）**：
1. `thincoder-core/ledger-db.mjs:30-33`：`key = sha1(resolveProjectRoot(cwd) ?? resolve(cwd))[:16]`——**未规范化**。
2. VSC 端 cwd = `uri.fsPath`（**盘符小写** `d:\…`——`thincoder-vscode/src/agent/rules-face.mjs:74` 早已记录该坑）；CLI 端 `D:\…` ⇒ **同项目两键两库**：`02a338af07b1ba5c.db`（285 条 · 36 未决 ／ CLI 侧）· `16012aba7c054941.db`（28 条 · 全部需求已结——用户被答「已清空」的那本 · 其查询时刻 04:20 的 touch 实证）。
3. 同类**四先例均已归一**：`normalizeCwd`（`session-slots.mjs:62-64` · 盘符大写契约 · checkpoint/traces/peers 同用）· `ledger.mjs:186-188` notifyKey（09-12 批已修）· `memory/origin.mjs`（2026-09-18 同病已修——「同一棵树两份索引 71,266 + 69,748」原文在档）· `subagent-scheduler.mjs:70` fileKey。**台账 DB 键 = 唯一漏网点**。
4. 存量残骸：`~/.thincoder/ledger/` 25 库 = 2 实库 + **23 空存根**（22×09-17 11:30 + 1×09-17 12:12）。

**射程（5 项）**：① `ledgerDbPath` 键归一（接 `normalizeCwd` 契约 + case 变体试例）；② **两库合并迁移**（28 条并入归一后键库 · 逐条保全 · 先备份 · dry-run 可验 · 幂等）；③ 23 空存根审计（逐键定性 + 处置建议）；④ `git/checkpoint.mjs:40` `normalizeCwd` 重复件单源化；⑤ VSC 侧 `===` 串比较边界——判定/登记（现况 fsPath 同约定一致 · 预期零改）。

**授权**：用户 04:27「修复吧」= 全链（快车道 · 小批快走）；父侧自缚沿用（评审复出 🔴 / 测试红 / 需新范围 ⇒ 停下上报，只摆那一条）。

**边界**：产品码面（core）+ 本机用户态**一次性**迁移（只动 `~/.thincoder/ledger/` 两实库——先备份；存根只报告）；不动其他用户态面（sessions / checkpoints / memory 存量）；已收口批档零触。

### 1.2 射程 +1（`#287` · 用户 04:32「并入吧」）

**第 6 条 = `batch` 工具相对路径基底不对称 + 防嵌套**（父侧 04:3x 实读 + 本机跑核函数实证 · 台账 `#287`）：
1. 解析序差异：create 相对路径按 **`docRoot.batches` 基底**解析（`batch-lifecycle.mjs:118-122`）；append/status/close 先 **cwd 相对**、不可读再 `docRoot.batches` 复判（`batch.mjs:75-95`）。
2. 实证矩阵（四 cwd）：cwd = 项目根 ⇒ append 根相对形（`docs/batches/x.md`）✓、**create 同串静默嵌套**（`docs/batches/docs/batches/x.md`——本仓零存量损伤，149 条全形 ✓）；cwd = `teamcode` / 子目录 / 非项目目录 ⇒ append 根相对形**必 throw**（第二基底 `resolve(基底, "docs/batches/x.md")` 双重嵌套 ⇒ 该回退只对裸文件名生效）——VSC 端「换 cwd 相对路径即过」的根因。
3. 修法方向：三动作**统一解析序**（cwd → batches 基底 → 项目根）+ **防嵌套归一**（已含基底相对前缀的串不再二次拼接 / fail-closed）+ cwd 矩阵试例（4 cwd × {裸名 / 根相对 / cwd 相对 / 绝对}）。设计落点由设计轮裁定（候选 = `docs/core/design/BATCH-RECORD.md`）。

**射程合计 = 6 项**（①②③④⑤ + ⑥=#287）。

### 1.3 设计轮上抛裁定（父侧 · 2026-09-25 04:4x）

1. **需求端补齐 = 已落（本席直接执行 · 需求笔归父侧）**：`ENGINEERING-MODE-V2-SPEC-LEDGER.md` 新增 **F-LX2 库键归一与跨端一致** + **AC-M2-9..13**（含执行者批遗留 9/10 两行补记——三账链补齐）+ 变更记录；`ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` 新增 **F-BP1** + **AC-M3-5..7** + 变更记录。三账链需求端闭合。
2. **§1.1 事实 4 更正 = 采纳**（22 = 夹具残库（有行）+ 1 空库——非「23 空存根」；「不按空库一键清」成立；③ 处置随 §2.7 实况）。
3. **§1.1 事实 2 口径 = 采纳**（源库 requirement 未决 0 · tech_todo 未决 15——「已清空」为该库内真话；目标库现读 287 / 未决 38）。
4. **⑥ 四处统一（含 spawn 门）= 采纳**（同一缺陷类同批收；零回归硬约束已在设计列明——错误文案逐字 + 既有档零改）。
5. **迁移执行主体 = 父侧 ops = 采纳**（子代理不写仓外；实施轮只落代码 + 夹具用例；实跑 = 收口轮父侧执行——先备份 + dry-run + 读回）。
6. **CHANGELOG 不触 = 采纳**（发布段未开；候选条目已列 §2.8-6）。
7. **notify 旧键零动 = 采纳**（登记，不作为）。

**射程维持 6 条**（#286 + #287）· 设计轮 §2（§2.0–§2.10）父侧逐节读毕核验在档。

### 1.4 全链授权（父侧代点火 + 代批准 · 2026-09-25 05:05）

**用户原话**：「自动跑完吧。」⇒ **全链授权**——设计评审点火权 + §4 批准权（代签）+ 修正轮 / 实施轮派发 + 收口核销提交推送（双远端），均委托父侧自动执行，至本批完结。

**父侧自缚（同本仓先例）**：① 代签仅当「评审 pass（0🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 05:05 授权）+ 依据」；③ 复评若再出 🔴 ⇒ 停下回报，不循环自动修；④ 实施验证不过 / 测试红 / 需新范围或用户口径裁决 ⇒ 停下只摆那一条。

### 1.4 实施交付裁定（父侧 · 2026-09-25 05:3x）

**父侧独立复跑**：core **621/621** 绿（611 本批 + #84 批在飞新增例入收集）· cli **820/820** 绿（= 交付声称 · 含 T9 自愈）——交付声明成立 ✓。

**上抛 7 项裁定**：

1. **设计措辞收正（`BATCH-RECORD.md` §4.15 条 1 括注 / BR-30 行文）= 派设计修正轮 #87**（措辞面：读面基底腿 = 声明面语义；BR-30 条件化）。
2. **BR-32 行文收正 = 随 #87**——设计师须**实读实现 + 零改档**（`test/docroot-multiroot.test.mjs:152` 零回归约束）自行复核后定稿，不得照抄实施席推断。
3. **`--from` 键形校验 = 落码**（`/^[0-9a-f]{16}$/` fail-closed + 用例）——随即修正轮 #88（同 token · docs 先行）。
4. **审计 `statSync` 容错 = 落码**（并发删除 ⇒ 按档报告不抛）——随 #88。
5. **dry-run `rows undefined` = 落码**（不可读目标输出定形）——随 #88。
6. **「目标零变」文案精度 = 落码**（一句收正）——随 #88。
7. `ledger-db.mjs` 126 vs 预算 ≈114：**数值漂移接受**（报告项入 §6；该档 ≤300 无结构后果）。
8. 并发批假红（tui-stderr-capture / wait-status-callsites 两档单独复跑 14/14 绿）· T9 自愈（9/9 · 锁面零改 · 扫描域含核内为其设计本意）· 真实迁移未跑（= 父侧 ops · 收口轮）：**知悉** ✓。

**派发序**：#87（docs first）→ #88（dependsOn #87）→ 复验 → **真实迁移实跑（先备份）** → §6 收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-25（fix 轮 #98：#88 四残留收正（dry-run 目标不可读 / 步 3 二分支措辞 / T24 / T27 子例）+ 闭合面全表对读（§2.2 / §8 T24–T32 / §9 逐行核——余项 3 处已收，其余全表无余项）；机检本档零新增（悬空 6 / 行宽 11 = 基线，在飞他档不计入）；落地表 = §2.12–§2.16）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（eng-designer · 设计轮 · 2026-09-25）

### 2.0 条 → 落点总表（本批 6 条 · 台账 #286 + #287）

| 条 | 内容 | 设计落点 | 代码落点 |
|---|---|---|---|
| ① | 库键归一（`ledgerDbPath` 接 `normalizeCwd`） | `LEDGER.md` §2.1（键式单源）· §2 落点行 · §7.1 · §8 AC-M2-11 | `thincoder-core/ledger-db.mjs`（`ledgerKey` / `ledgerDbPath`）· `ledger.mjs`（re-export） |
| ② | 两库合并迁移（28 条并入归一后键库） | `LEDGER.md` §2.2（枚举法 / 六步 / 幂等 / 备份 / 回收 / 报告）· §8 AC-M2-12 | 新档 `thincoder-core/ledger-migrate.mjs` + `thincoder-cli/bin/thincoder.mjs`（`case "ledger"`） |
| ③ | 存量残档审计（逐键定性 + 处置建议） | `LEDGER.md` §2.2 审计面段 · §8 AC-M2-13；as-of 读数 = 本档 §2.7 | 同 ② 档（`runLedgerAudit`） |
| ④ | checkpoint `normalizeCwd` 重复件单源化 | `LEDGER.md` §2.1 归一步句（同契约消费面枚举） | `thincoder-core/git/checkpoint.mjs:40-42`（删本档副本 → import） |
| ⑤ | VSC 侧 `===` 串比较边界 | `LEDGER.md` §2.1「路径串等值比较边界」段（登记词条 + 守卫句） | **零代码改**（验证 = 静态审计在册；T22 = 间接守卫——同契约下游） |
| ⑥ | `batch` 路径解析统一 + 防嵌套（#287） | `BATCH-RECORD.md` §4.15（新）· §2 门禁表行 · §4.8 BR-27–BR-35 · §7 D-BR22 · §4.9 / §4.11 改指 | 新档 `agent-tools/batch-paths.mjs` + `batch.mjs` / `batch-lifecycle.mjs` / `subagent-spawn.mjs` |

### 2.1 本批条目（覆盖）

- 覆盖 = ①–⑥ 全六条（用户 04:27「修复吧」+ 04:32「并入吧」直令；父侧诊断 = §1.1 / §1.2）。
- **不在本批**（显式）：实现代码（eng-coder 写域）· 真实用户态迁移实跑（父侧 ops · 实施/收口轮）· 其他用户态面存量（sessions / checkpoints / memory / `ledger-notify.json`）· 已收口批档回改 · 本档 §1 触碰 · 存量残档的删除 / 回收实动（③ = 只报告零动作）。

### 2.2 机制设计（逐条裁定）

**① 键归一（裁定 = 单源键函数 + 直引 `normalizeCwd`）**

- 键式 = §2.1 逐字：`ledgerKey(root) = sha1(normalizeCwd(root))[:16]`；`ledgerDbPath(cwd) = join(ledgerDir, ledgerKey(resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")) + ".db")`。
- `resolve()` 既有规范化**够用半幅**（分隔符 / 点段 / 尾斜杠由它覆盖——`path.resolve` 语义实核），**缺半幅 = 盘符大小写**（唯一残差）⇒ 只补这一维；非盘符段大小写**不折叠**（POSIX 大小写敏感 + `MEMORY.md` §6.11 先例「不做」——登记 §2.1 边界）。
- 引用面裁定 = **直引 `session-slots.mjs` 的 `normalizeCwd`**（先例二处同款：`peer-domains.mjs:21` / `traces/trace-store.mjs:45`）；不抽新 util 档（现成单源在场，抽档 = 多一层）。
- 回归判据（本席实测）：`sha1("D:\teamcode\thincoder")[:16] = 02a338af07b1ba5c`（CLI 现状键——归一恒等）；`sha1("d:\teamcode\thincoder")[:16] = 16012aba7c054941`（VSC 键——收正后并入同键）⇒ 目标键 = `02a338af…`、源键 = `16012aba…`。

**② 合并迁移（裁定 = CLI 子命令 + 六步 + id 重发）**

- 形态 = `thincoder ledger migrate --dry-run | --confirm`（先例 = `session gc` 双档；核内实现、壳侧接线）。三件套 = **dry-run（零写报告）· 先备份（拷贝 + 读回同计数）· 幂等（全字段等值护栏）**。
- 变体键枚举法 = `legacyKeyVariants(root)`：**盘符大小写翻转拼写**的**原样 `sha1[:16]`**（先例 = `session-migrate.mjs` 的盘符两形试例）；`--from <key>` = **补充源**（并集去重；指名键不存在 / 不可开 ⇒ 拒——KD-LN10）。sha1 不可逆 ⇒ 不做全目录反向归因（审计面同）。
- **id 策略裁定 = 重发新 id**（目标 `INTEGER PRIMARY KEY` 自增；旧 id 空间 1..287 已占——保留必撞，「保留原 id 若空」在本例恒不可行且非确定）；映射 `源id → 新id` 记入报告（`migrate-report.json`）+ 源库留档（回收目录）⇒ 外部可回查。
- 保全 = **12 数据列逐字 + id 重发**（等值列集不含 id）；单事务 + **事务内**逐行读回核验（失败 ⇒ `ROLLBACK`，目标零变）；核验过 ⇒ `COMMIT` → 源 rename 进 `ledger-trash/<批次>/`（不 unlink）→ 写报告。
- 写门关系：迁移走**直接 SQL**（不经 `ledgerAdd/Update`）⇒ §6.1 写门不拦迁移本身；但迁入后 `在途/待核销` 行的后续更新仍受该门（dry-run 出**风险旗**提示，不拦截）。
- 执行主体裁定 = **父侧 ops**（用户在场跑 `--confirm`；repo 纪律：子代理不写仓外路径）；实施轮自动化面 = `_setLedgerDirForTest` 夹具（三件套全用例）。

**③ 残档审计（裁定 = 只读分类 + 只报告零动作）**

- 定性枚举 = `目标库 / 变体源 / 空库 / 不可归因（有行）/ 不可读（坏档）`；归因 = 候选根集合变体键匹配（不含启发式）。
- 处置政策 = 非目标 / 非源**保持原位**；空库与夹具残档**建议回收目录**（`ledger-trash`，可回退；删除 = 不可逆 ⇒ 不删口径）。本批**零动作**（§1 边界「存根只报告」）。
- as-of 实测（本席 2026-09-25 只读）：见 §2.7——**与 §1.1 事实 4 相抵**（详见 §2.8 上抛 2）。

**④ checkpoint 单源化（裁定 = 直引，不抽 util；环检查通过）**

- `git/checkpoint.mjs:40-42` 本档 `normalizeCwd` 副本删除，改 `import { normalizeCwd } from "../session-slots.mjs"`（同目录先例二处；本档注释自述「Same normalization as session storage」——收面兑现）。
- **import 环检查（实核）**：session 链（`session-slots.mjs` → `session.mjs` / `session-store.mjs` / `process-probe.mjs` / `session-slots-manifest.mjs` / `config*.mjs`）**零 import** `git/checkpoint.mjs` 或 `ledger-*`；checkpoint 的现有消费面（tools/* · cli acp/tui · vsc tools/shell）不产生新环。⇒ 无环。

**⑤ VSC `===` 边界（裁定 = 零代码改 + 登记 + 守卫用例）**

- 现盘等值比较全量（实核）：`ledger.mjs` `discoverFamily` 的 `p.root !== current.root`；核 `ledger-surface.mjs:28` 与 VSC `ledger-surface.mjs:59` 的 `s.root === family.current.root`——**两侧同源谱系**（同一 anchor 单进程派生），不跨端；跨端只经键 / `notifyKey`。
- 登记词条 = §2.1「路径串等值比较边界」段（判定 + 守卫句「新增比较点不得跨端直比裸路径串」）；守卫用例 = T22（`findProject` 两拼写同库 + `notifyKey` 同键）。

**⑥ batch 路径解析（裁定 = 统一解析序 + 锚定防嵌套；四处调用点）**

- 契约 = `BATCH-RECORD.md` §4.15 逐字（候选序 cwd → 项目根 → 基底；读面选首个可读 / create 选首个落基底内；锚定规则；fail-closed 新文案）。
- **父侧口径更正**（本席实证）：spawn 门**不**经 `resolveBatchDocPath`——`subagent-spawn.mjs:213-223` 为独立单基底（仅 cwd）实现；故解析点 = **四处**（create / append·status·close / 评审门 / spawn 门），本设计四处统一。若父侧裁「本批不动 spawn 门」⇒ 撤该行，其余零依赖（见 §2.8 上抛 4）。
- 单源形态 = 新档 `agent-tools/batch-paths.mjs`（`batchDocBases` 迁入 + `resolveBatchTarget` 统一解析 + 越基底判据）；`batch.mjs` / `batch-lifecycle.mjs` 经 re-export / 委托保既有 import 面（`batch-segment.mjs` 19 行 shim 零改）。
- 零回归硬约束（父侧点名）：spawn 门错误文案**逐字不变**（`batch-doc-gate.test.mjs` 逐字断言在册）；`resolveBatchDocPath` 错误文案逐字不变；`batch.test.mjs`（474 行 · 500 硬限逼近）**零改**——新用例全落新档 `test/batch-paths.test.mjs`。
- 行为变更登记（有意收正，四条）：见 §4.15「行为变更登记」段（对外可见面 = 工具参数解析语义收正；不改参数 schema / 判据句）。

### 2.3 受影响文件与行数预算（as-of 2026-09-25 · node 实测行数）

**核（thincoder-core）**：

| 文件 | 模块 | 现 | Δ 预算 | 后（预估） | 备注 |
|---|---|---|---|---|---|
| `agent-tools/batch-paths.mjs` | M3 | 新 | +150~190 | ≤300 | ⑥ 解析单源（新档免软线登记） |
| `agent-tools/batch.mjs` | M3 | 411 | −25±10 | ≈385-400 | 解析体迁出 + `batchDocBases` re-export；>300 登记在册不变 |
| `agent-tools/batch-lifecycle.mjs` | M3 | 302 | −13±6 | ≈289-295 | **预期回落 ≤300 ⇒ 随批移出 `SOFT_LINE_REGISTRY`**（先例 = init-block 批双向移出）；若读数仍 >300 ⇒ 保留登记（不新拆） |
| `agent-tools/subagent-spawn.mjs` | M3 | 407 | +8±4 | ≈415 | 门内解析改经单源（**机制归属 = M3**——改动 = batchDoc 门解析，非 M5 机制面；先例 = 2026-09-21 生命周期批同档记 M3）；文案零变 |
| `git/checkpoint.mjs` | — | 449 | −2±2 | ≈447 | ④ 删副本 + import（跨机制卫生修复——不落 M1–M11，不计数） |
| `ledger-db.mjs` | M2 | 107 | +7±3 | ≈114 | `ledgerKey` / `ledgerDirPath` + import |
| `ledger.mjs` | M2 | 214 | +1 | 215 | re-export 增两符号 |
| `ledger-migrate.mjs` | M2 | 新 | +220~260 | ≤300 | ②③ 命令面（dry-run / 六步 / 审计） |
| `test/core-hygiene.test.mjs` | M3 | 191 | +3/−1 | ≈193 | batch-lifecycle 登记注（若回落成立——登记面随 M3 档线） |
| `test/batch-paths.test.mjs` | M3 | 新 | +200~260 | ≤300 | ⑥ 矩阵 + 解析单测 + 门集成 |
| `test/ledger-key-normalize.test.mjs` | M2 | 新 | +70~100 | ≤300 | ①⑤ 用例（T21–T23） |
| `test/ledger-migrate.test.mjs` | M2 | 新 | +220~260 | ≤300 | ②③ 用例（T24–T32） |

**壳（thincoder-cli）**：`bin/thincoder.mjs`（M2）467 → +12±4 ≈479（**500 硬限余量紧——接线压缩：单 `case "ledger"` 分支 + USAGE 两行**）· `test/batch-doc-gate.test.mjs`（M3）196 → +20±8 ≈216（BR-33 门级用例）。

**L7 复核（判定时点②——§2 表落表后 · 评审轮 1 #5 补）**：模块列去重 = **M2 + M3 = 2 ≤2 达标**（无越界——不触发拆批上报）。口径 = 该行改动所服务的 M 族机制面（模块身份 = `ENGINEERING-MODE-V2.md` §2.2 清单；先例 = 2026-09-21 生命周期批对 `subagent-spawn.mjs` 同记 M3）；不服务者标 `—`（不计数）。

**零改面（显式）**：`test/batch.test.mjs`（474）· `test/batch-segment.test.mjs`（299）· `test/docroot-multiroot.test.mjs` · `test/batch-segment-manifest.test.mjs` · `agent-tools/batch-segment.mjs`（shim）· `agent-tools/advisor.mjs`（经 `resolveBatchDocPath` 自动获益）· VSC 仓全部文件（⑥ 经核）。

**文档面（本席本轮已落）**：`docs/core/design/LEDGER.md`（§2.1 / §2.2 + §2 落点行 / §7.1 / §8 / §9 / 变更记录）· `docs/core/design/BATCH-RECORD.md`（§4.15 + §2 / §4.8 / §4.9 / §4.11 / §7 / §8 / 变更记录）。**fix 轮（评审轮 1 修正）两档同批收正——逐条落地表 = §2.11。**

### 2.4 测试面与用例

- **①⑤**（新档 `ledger-key-normalize.test.mjs`）：T21 键归一（两拼写同路径 + 大写回归）· T22 级联守卫（`findProject` / `notifyKey` 同键——**间接守卫**；⑤ 零代码改，验证 = 静态审计在册）· T23 边界（null / undefined / 空串 cwd 不炸）。手法 = `_setProjectRootForTest` / `_setLedgerDirForTest` 缝（不碰真实用户目录）。
- **②③**（新档 `ledger-migrate.test.mjs`）：T24 dry-run 零写（含夹具根外零写）· T25 执行（12 数据列保全 + id 重发 + 回收 + 备份；夹具根外零写）· T26 幂等 · T27 fail-closed（wal 伴生 / 备份失败 / busy）· T28 审计五态 + 零删改 · **T29 列集就绪判（旧 DDL 缺 `executor` ⇒ NULL 映射；缺余列 ⇒ 拒）· T30 目标缺档态 · T31 `--from <key>` · T32 dry-run 写门风险旗**（评审轮 1 #7 补）。
- **⑥**（新档 `batch-paths.test.mjs` + CLI 门档 +2）：BR-27–BR-35（cwd 四形〔项目根 / 项目内子目录 / 项目根的上级目录 / 非项目目录〕× 四串形 + 防嵌套 fail-closed〔段边界判——BR-35〕+ 门集成）；既有 `batch.test.mjs` / `batch-doc-gate.test.mjs` 逐数零回归（文案逐字断言在册）。
- **运行**：`thincoder-core` 与 `thincoder-cli` 包内 `npm test` 全绿；VSC 面零改（如父侧全链门再跑 `thincoder-vscode/`）。

### 2.5 验收标准（AC → 回指 §2.1 条目）

- AC-M2-11（→①）：键归一（两拼写同库 + CLI 键不变 + 键式单源 grep〔射程 = 台账键生成面〕）。
- AC-M2-12（→②）：迁移三件套（dry-run 零写 / 备份读回 / 幂等重跑）+ 12 数据列逐条保全 + id 重发 + 事务内读回核验 + 源回收不删。
- AC-M2-13（→③）：审计只读五态定性 + 候选根归因 + 目录三不变。
- AC-BP-1（→⑥）：解析序单源（四处调用点经 `batch-paths.mjs`；零第二份解析实现）。
- AC-BP-2（→⑥）：cwd 矩阵（四形 × 四串形）与防嵌套用例全绿（BR-27–BR-35）。
- AC-BP-3（→⑥）：既有成功路径零回归（四个既有测试档逐数绿；spawn 门 / `resolveBatchDocPath` 错误文案逐字不变）。
- AC-BP-4（→④⑤）：checkpoint 副本删除（grep 单源）+ 无 import 环（session 链实核）；⑤ = 登记词条在档（**零代码改 ⇒ 无独立守卫用例——验证 = 静态审计在册**；T22 = 间接守卫——同契约下游回归，非两处 `===` 点直测）。

**⑥ 编号映射（AC-BP-n ↔ AC-M3-n ↔ 用例面——评审轮 1 #3 补；AC-BP-4 的 ④⑤ 需求侧无对应项的理由随行注明）**：

| AC-BP-n | 判据面 | 需求端 | 用例 / 核验面 |
|---|---|---|---|
| AC-BP-1 | 解析序单源（四处调用点经 `batch-paths.mjs`；零第二份解析实现） | AC-M3-5 | BR-27–BR-35（四调用点各有覆盖：create / 读面 / 评审门 / spawn 门）+ 调用点实核 + grep |
| AC-BP-2 | cwd 矩阵 + 防嵌套（段边界判） | AC-M3-6 | BR-27–BR-32 · BR-34 · BR-35 |
| AC-BP-3 | 零回归（四既有测试档逐数绿；门 / `resolveBatchDocPath` 文案逐字） | AC-M3-7 | BR-33 + 四档全绿 + 文案断言 |
| AC-BP-4 | ④ checkpoint 副本删除 + 无 import 环；⑤ 静态审计在册 | 无对应项——理由：④⑤ = 纪律面内修复 / 登记（不新增需求语义，需求端无条目承载；§2.9 同口径） | ④ = grep 单源 + import 环实核；⑤ = `LEDGER.md` §2.1 登记段在档（零代码改；T22 间接守卫） |

### 2.6 关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| KD-LN1 | 键归一**直引** `session-slots.normalizeCwd`（不抽新 util） | 先例二处同款（peer-domains / trace-store）；抽档 = 多一层无收益 |
| KD-LN2 | 非盘符段大小写**不折叠** | POSIX 敏感 + origin 先例「不做」；折叠 = 语义变更 |
| KD-LN3 | 迁移形态 = CLI 子命令（`session gc` 双档先例），不造一次性脚本 | 可复用（他项目同病）+ 三件套有门 + 与既有运维面同形；脚本 = 无门裸奔 |
| KD-LN4 | id **重发**（不保留 / 不并入原 id 空间） | 两库 id 空间重叠（1..287 vs 1..28）——保留必撞；映射入报告 + 源留档 |
| KD-LN5 | 幂等 = 全字段等值护栏 + 单事务 + 回收式「已迁」标记 | 崩溃窗重跑不重复；无 DDL 变更（不加迁移记账列） |
| KD-LN6 | 执行主体 = 父侧 ops（用户在场）；测试面 = `_setLedgerDirForTest` 夹具 | repo 纪律（子代理不写仓外）；先例 = 09-18 memory 数据面 |
| KD-LN7 | 残档处置 = 只报告 + 回收建议（本批零动作） | §1 边界（存根只报告）；删除不可逆 |
| KD-LN8 | ⑥ 解析单源 = 新档 `batch-paths.mjs`（不在 batch.mjs / lifecycle 二选一） | 两主档单向依赖（KD-4）——共享体必须落双方可引的叶档；顺带满足 batch-lifecycle「create 面外提」登记的消解条件 |
| KD-LN9 | ⑥ 四处调用点统一（含 spawn 门） | 同一缺陷类同批收；零回归约束（文案逐字）已列；父侧可裁撤该行 |
| KD-LN10 | ② 三裁：旧 DDL 源库（缺 `executor`）⇒ **NULL 映射照迁**（非拒）；目标键库缺档 ⇒ **视为空目标**（迁入步建库建表，非拒）；`--from <key>` ⇒ **补充源**（并集去重；指名键不存在 / 不可开 ⇒ 拒） | 旧 DDL 缺列 = ADD COLUMN 增量列的既有行**正常态**（老库迁移语义——NULL 即真值）；目标缺档 = 读面「库不在 = 空账」同口径延伸；显式指名不静默跳过（fail-closed）。否决：缺 `executor` ⇒ 拒（误伤旧库）· 目标缺档 ⇒ 拒（首迁场景被堵） |

### 2.7 存量审计 as-of 读数（2026-09-25 本席只读实测 · `~/.thincoder/ledger/`）

| 类 | 数 | 明细 | 处置建议 |
|---|---|---|---|
| 目标库 | 1 | `02a338af07b1ba5c.db`（287 行：待讨论 33 / 待设计 4 / 在途 1 / 已核销 229 / 已废弃 20；`D:\teamcode\thincoder` 键） | 保留（迁移目标） |
| 变体源 | 1 | `16012aba7c054941.db`（28 行：待讨论 7 / 待设计 8 / 已核销 12 / 已废弃 1；小写盘符键）——**requirement 类未决 = 0**（「需求池已清空」在该库内为真话）· 与目标**零重题**（28/28 逐条比对实核） | 迁移（②） |
| 夹具残库 | 22 | 09-17 11:30:03 / 11:30:28 两批建档（8192 B 各）；行文为夹具串（`- [ ] **甲** → 需求 docs/requirements/FOO.md …` / `T0..T9 → 证据 src/a.mjs:1`）——与两产品测试档的夹具文本同形（`thincoder-cli/test/ledger-surface.test.mjs:44-45` / `thincoder-vscode/test/ledger.test.mjs:49-50`；键不可归因 = tmp 项目哈希） | 建议回收（`ledger-trash`）；本批零动作 |
| 空库 | 1 | `38478126a2c420a4.db` = `D:\teamcode` 工作区根键（0 行；notify 档内同键在册） | 建议回收；本批零动作 |

**迁移面实测（供实施轮比对）**：目标 287 行（MAX id 287）· 源 28 行（MAX id 28）· 两库 schema 同形（13 列含 executor）· `journal_mode = delete`（**无 `-wal` / `-shm` 伴生档**）· 迁移后预测 = 287 + 28 = 315 行。

**附带观察（登记，非本批工作令）**：22 残档为**真实用户目录**内的夹具写入残留（09-17 时点测试 / 验收未走 `_setLedgerDirForTest` 缝）；现盘三个台账测试档均在 `beforeEach` 设缝 ⇒ 无新增同源残档预期。

### 2.8 发现与上抛项（逐条）

1. **需求档缺位（①②⑥ 三条）——已裁定落定 · 回指 §1.3 项 1**：父侧已补齐需求端（`ENGINEERING-MODE-V2-SPEC-LEDGER.md` F-LX2 + AC-M2-9..13；`ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` F-BP1 + AC-M3-5..7）——**三账链需求端闭合**；判定句面（① 两拼写同库 ∧ CLI 键不变；② 先备份 / dry-run / 幂等 / 逐条保全；⑥ 根相对串四 cwd 同解 ∧ 不嵌套）随需求档现行条目承载；本项余义 = 设计轮上抛的由来（历史承记录面）。
2. **§1.1 事实 4 相抵（诊断更正）——已裁定落定 · 回指 §1.3 项 2**：`~/.thincoder/ledger/` **非**「2 实 + 23 空存根」——实测 = 2 实库 + **22 夹具残库（有行）+ 1 空库**（§2.7 表）；③ 的处置建议随实改写（残档内容可查 ⇒ 回收而非删仍成立，但「空」的前提不成立——**不按空库一键清**）。
3. **§1.1 事实 2 口径更正——已裁定落定 · 回指 §1.3 项 3**：源库 28 行非「全部需求已结」的字面——requirement 类未决 = 0（故「需求池已清空」为该库内真话）、tech_todo 未决 15 条；误答根因 = 分叉库半可见，非数据缺失。目标库同刻读数 = 287 行 / 未决 38（父侧 285 / 36 为更早时点）。
4. **射程更正（⑥ 覆盖四处）——已裁定落定 · 回指 §1.3 项 4（四处统一含 spawn 门）**：spawn 门**不**经 `resolveBatchDocPath`（`subagent-spawn.mjs:213-223` 独立单基底实现）——四处调用点（create / append·status·close / 评审门 / spawn 门）统一为本批设计面。
5. **迁移执行主体——已裁定落定 · 回指 §1.3 项 5**：父侧 ops（用户在场）；子代理执行与「子代理不写仓外」纪律相抵（该备选已否）。
6. **CHANGELOG——已裁定落定 · 回指 §1.3 项 6**：本批不触（`thincoder-core/CHANGELOG.md` 按发布段登记，0.9.5 段未开）——发布时候选条目：台账库键归一 · batch 路径解析收正。
7. **旁支观察（非工作令）——已裁定落定 · 回指 §1.3 项 7**：`~/.thincoder/ledger-notify.json` 含 v1 期旧键（`…/docs/TODO.md` / `…/ledger.db`）与已不存在库键（`d836ba79…`）——陈旧去重态，零行为影响；本批零动（其他用户态面）。

### 2.9 三账一致声明

本 §2 条目（①–⑥）= 设计档 AC（`LEDGER.md` §8 AC-M2-11/12/13 · `BATCH-RECORD.md` §4.15 + BR-27–BR-35）= 需求档条目（`ENGINEERING-MODE-V2-SPEC-LEDGER.md` F-LX2 + AC-M2-9..13；`ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` F-BP1 + AC-M3-5..7）——**三链同源成立**（需求端补齐 = §1.3 项 1；⑥ 的 AC-BP-n ↔ AC-M3-n 映射见 §2.5）；③④⑤ 为既有条目 / 纪律面内修复（无新需求语义——AC-BP-4 需求侧无对应项的理由随 §2.5 映射表）。

### 2.10 机检读数（设计轮交付前单次 · `node scripts/doc-check.mjs` · 2026-09-25）

- **悬空锚**：汇总 4 条——**本批两设计档零新增**（`LEDGER.md` / `BATCH-RECORD.md` 均 0 条入闸）；本批唯一前向引用 `agent-tools/batch-paths.mjs` 以「（拟新增」标记列报·不入闸（先例 = 2026-09-18 批）。基线 4 条不在本批两档内（他档存量）。
- **行宽**：汇总 8 行超 300——**本批两设计档零新增**（本轮已自清 2 行：`LEDGER.md` §2.1 登记段 + `BATCH-RECORD.md` §4.9 段，均为折行零语义）。余 8 = 存量（`BATCH-RECORD.md` 变更记录 2 行 · `MODEL-BENCH.md` 6 行——均非本批产出，按先例「零新增」口径处置：报告不修）。
- **口径**：行宽扫描域 = manifest `checkConfig`（`scanDirs: docs` · `exclude: _archive / batches`）⇒ 批档 §2 自身不在扫描域；表格行结构性豁免。
- **fix 轮复跑（评审轮 1 修正后 · 2026-09-25 · `node scripts/doc-check.mjs`）**：实测 悬空 **5** / 行宽 **10**。**本轮（fix 轮）零新增，另收正 1 行**（`LEDGER.md` 设计轮变更记录行 320 字 → 折行零语义）；修正中途自查出的 2 条新悬空（`docs/batches-old/x.md` 举例被当实路径）已改 `<x>` 占位形（与 BR-27/30 同式）消解。余项 = 设计轮基线（悬空 4 = `SESSION.md:789` · `TOOLS.md:927/933`；行宽 = `BATCH-RECORD.md` 变更记录 2 行 · `MODEL-BENCH.md` 6 行）+ **需求档侧（父侧笔域——列报）**：悬空 1 = `ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md:25`（`batch-paths.mjs` 前向引用未带「拟新增」标记）；行宽 2 = 同档 `:58` · `ENGINEERING-MODE-V2-SPEC-LEDGER.md:81`（两条新增变更记录行）。

### 2.11 评审轮 1 修正块（设计评审轮 1 发现 1–13 逐条落地 · 2026-09-25 · eng-designer）

**来源**：本档 §3「轮次 1」（🔴0 / 🟡7 / 🔵6 = 13 条 · VERDICT pass）；父侧裁定 = 13/13 全收（处置执行人 = eng-designer）。**修正面 = 定位 / 状态 / 映射 / 用例面收正——机制语义零扩**（全部为精度收窄或口径补全，无新增机制）。

| # | 级别 | 落地（号 → 改动） |
|---|---|---|
| 1 | 🟡 | `BATCH-RECORD.md` §4.15 条 1 补**「项目根」取根单源**（`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`——归属 ∨ 发现 / 无 manifest 兜底 / 单值；同式 = `LEDGER.md` §6.1 口径 2）+ 契约段补**矩阵 cwd 四形**；§4.8 BR-28/29「上级目录」→「**项目根的上级目录**」消歧；本档 §2.4 ⑥ 行列四形 |
| 2 | 🟡 | 「13 列 / 字段逐字」统一为「**12 数据列逐字 + id 重发**（等值比对列集不含 id）」——`LEDGER.md` §2.2 步 3 / 语义保全 / AC-M2-12 / T25（+ 本档 §2.2 保全行 / §2.4 T25 行 / §2.5 AC-M2-12 行） |
| 3 | 🟡 | ⑥ 编号映射落 §2.5：**AC-BP-1↔AC-M3-5 · AC-BP-2↔AC-M3-6 · AC-BP-3↔AC-M3-7 · AC-BP-4 = 需求侧无对应项**（④⑤ = 纪律面内修复 / 登记之理由随行注明）+ 用例面列 |
| 4 | 🟡 | §2.8 七项标「**已裁定落定 · 回指 §1.3**」；项 1 与 §2.9 的「需求端待补 / 三账链缺环」死句删除（收正为「三链同源成立」）；§2.8 项 4 未决条件句删除（历史承记录面） |
| 5 | 🟡 | §2.3 表增**模块列**（非 M 族行标 `—`）+ **L7 复核（判定时点②）：M2 + M3 = 2 ≤2 达标**（`subagent-spawn.mjs` 记 M3 = 机制归属——先例 2026-09-21 批同档） |
| 6 | 🟡 | `LEDGER.md` §2.2 步 1 写明备份 / 回收目录 = `ledgerDirPath()` **兄弟位同派生于可覆盖基**（`_setLedgerDirForTest` 同覆盖）；T24/T25 增「**夹具根外零写**」断言 |
| 7 | 🟡 | `LEDGER.md` §2.2 步 2 增**列集就绪判**（仅缺 `executor` ⇒ NULL 映射；余缺 ⇒ 拒——裁定入 KD-LN10）+ 步 1 目标缺档态 + `--from` 语义（补充源 / 指名不存在 ⇒ 拒）；用例 +**T29–T32**（§2.4 同步） |
| 8 | 🔵 | `LEDGER.md` AC-M2-11 第三分句 + §2.1 增**单源判据射程**（grep 域限台账键生成面；他面哈希不属本判据） |
| 9 | 🔵 | T23 收窄为「**null / undefined / 空串**」（`?? "."` 只兜此三态；数值 / 对象照抛） |
| 10 | 🔵 | `LEDGER.md` §6.1 口径 2 改述「**= 库键式的同一子表达式**（键另加 `normalizeCwd`）」+ 坐标去行号 |
| 11 | 🔵 | `BATCH-RECORD.md` §4.15 行为变更登记补「**② 先于 ③**」序内边界（唯一例外面登记） |
| 12 | 🔵 | `BATCH-RECORD.md` §4.15 条 3 防嵌套改**按路径段（段边界）**匹配 + `docs/batches-old/<x>.md` 边界例（`<>` 占位形——与 BR-27/30 同式）+ **BR-35** 用例；§4.15 边界句同步 |
| 13 | 🔵 | AC-BP-4 ⑤ 行写明「**零代码改 ⇒ 无独立守卫用例——验证 = 静态审计在册**；T22 = 间接守卫」（`LEDGER.md` §2.1 比较边界段同步；本档 §2.0 ⑤ 行 / §2.4 ①⑤ 行同步） |

**机检读数**：见 §2.10「fix 轮复跑」行（悬空 5 / 行宽 10——本轮零新增，另收正 1 行）。

**需求侧遗账（列报父侧 · 需求笔域）**：① `ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md:25`——`batch-paths.mjs` 前向引用未带「拟新增」标记（机检悬空 1 条）；② 需求档 AC-M2-12 同行仍作「13 字段逐条保全」（应同步为「12 数据列 + id 重发」）；③ 需求档 AC-M3-6 方式列括注「BR-27–BR-34」在 BR-35 追加后应收 **BR-27–BR-35**；④ 需求档两条新增变更记录行超 300 字（`:58` · SPEC-LEDGER `:81`）。

**读回核验（D6）**：两设计档改动区逐段读回（`BATCH-RECORD.md` §4.15 / §4.8 / 变更记录；`LEDGER.md` §2.1 / §2.2 / §6.1 / §8 / 变更记录）+ 本档 §2 全节读回（状态行 / §2.3 表 12 行含模块列 + L7 行 / §2.5 映射表 4 行 / §2.6 KD-LN10 / §2.8 七项 / §2.9 / §2.10 fix 轮行）。

### 2.12 修正块（#87 · 实施后设计措辞收正 · 父侧 §1.4 项 1–2 · 2026-09-25 · eng-designer）

**来源**：批档 §1.4 项 1–2（父侧裁定接受——实施席 §5.3#1/#2 · §5.5 上抛 1/2 + 内部分歧审计 §5.4 双方独立复核在案）。**面 = 措辞 / 条件化——机制语义零扩**（零代码 · 需求档零触 · §4.15 条 1 + §4.8 BR-30 + BR-32 以外零改）。

**需求档实读（§1.4 项 4 停下条件的排除）**：两项问题措辞均**不住**需求档——`ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` F-BP1（`:25-28`）只落候选序 / 读面-create 分野 / 锚定 + fail-closed（与实现口径一致），无「缺省回退默认值」「声明基底为他值」二式 ⇒ 无停下条件。

**条 → 改动（号 → 改动 file:line · post-edit 坐标）**：

| # | 项 | 改前（句） | 改后（句） | 依据（实读自证） |
|---|---|---|---|---|
| 1a | `docs/core/design/BATCH-RECORD.md:238-239`（§4.15 条 1） | 「基底 = `batchDocBases(cwd)`——声明面单源，manifest `docRoot.batches`，缺省回退默认值」 | 基底**拆两段**（声明面 / 缺省回退 = 声明面为空时 `resolve(docRootBase(cwd), "docs/batches")`）+ **取面分野（基底腿）**：**create / 在飞扫描 / 锚定面**取「声明面 + 回退」合体；**读面 ③ 腿只取声明面**（无 manifest ⇒ **无基底腿**——读面零回归） | 实现：`batch-paths.mjs:96` 读面候选③ = `declaredBases(base)`（`:31-36` 无 manifest ⇒ 空集）；`:44` `batchDocBases` 回退 / `:92` 锚定取 `batchDocBases`；create = `batch.mjs:295` → `batch-lifecycle.mjs:115`；在飞扫描 = `batch.mjs:185/307`。零回归：HEAD `batch.mjs`（git diff 实核）旧读面 = `docRootPaths(manifest.docRoot.batches)` 逐基底、**零回退** |
| 1b | `BATCH-RECORD.md:154`（§4.8 BR-30） | 「cwd = 项目子目录」（无条件） | 「cwd = **基底父目录**（项目子目录形——如 `docs`）」**条件化** | `batch-paths.mjs:138`（create 取首个落基底内候选）——内联实测：cwd = `docs` ⇒ `docs/batches/a.md`（① 腿）；cwd = `src` ⇒ `docs/batches/batches/a.md`（③ 腿，非本行预期）；`test/batch-paths.test.mjs:52-56` 用例 cwd = `docs`（基底父目录） |
| 2 | `BATCH-RECORD.md:156`（§4.8 BR-32） | 「串以基底相对前缀打头、**但声明基底为他值（前缀不匹配）**」 | 「**锚定串**（以基底的项目根相对前缀打头、段边界判——条 3）解析后**不落任一基底内**（如 `docs/batches/../../<x>.md`）」⇒ fail-closed 新文案 | `batch-paths.mjs:133-136`（锚定 ∧ `!insideBases` ⇒ `anchoredEscapeError`——内联实测 `docs/batches/../../outside.md` ⇒ 新文案 ✓）；旧行「前缀不匹配」实例实为**不锚定** ⇒ 照候选序（`test/batch-paths.test.mjs:97-100`：声明基底 `batch-files` + `docs/batches/<x>.md` ⇒ 落 `batch-files/docs/batches/<x>.md`，零 fail-closed）——旧行文字面不可达 |

**自证摘要（实读 + 实跑）**：

- **四处调用点实读**：create = `batch.mjs:295` → `batch-lifecycle.mjs:115`（`resolveBatchCreatePath`）；append·status·close = `batch.mjs:183/305/308`（`resolveBatchDocPath`）+ 在飞扫描 `:185/307`（`findInFlightBatch`）；评审门 = `advisor.mjs:182`（经 `batch.mjs` re-export）；spawn 门 = `subagent-spawn.mjs:219`（`resolveBatchReadPath`——读面非抛形）。
- **零改档实跑**：`test/docroot-multiroot.test.mjs` **8/8 绿**（含 `:152`「无 manifest → v1 单基底 throw」）；本批新档 `test/batch-paths.test.mjs` **10/10 绿**（含 `:123`「无 manifest ⇒ 无基底腿」）。
- **归因实核（父侧括注「改回退默认值 ⇒ 必红」）**：`docroot-multiroot.test.mjs:152` 在两种语义下**同判绿**（内联复算该夹具回退腿候选集 = `[<dir>/r.md, <dir>/r.md, <dir>/docs/batches/r.md]`——全不可读：探测位在回退基底无档）；回退语义的**判别守 = `batch-paths.test.mjs:123`**（回退基底位 `<nonproj>/docs/batches/read2.md` 有档 ⇒ 读面将命中 ≠ null）。归因以本行为准。
- **旁支观察（本次未触——父侧口径「边界句 = 参照面」）**：§4.15 边界句 `:251`「前缀匹配只认**声明基底**的相对前缀」严格读法窄于实现（锚定面在无 manifest 时含缺省回退基底的前缀）——如需同口径收正，随下笔处置（非本笔工作令）。

**机检读数（`node scripts/doc-check.mjs` 实跑 · 改前 / 改后）**：悬空 **4 / 4** · 行宽 **8 / 8**——同组同数（BATCH-RECORD 两行宽行号 400/407 → 403/410 = 插入行漂移）；**零新增**。

**读回核验（D6）**：改动区逐段读回（§4.8 BR-30/BR-32 · §4.15 条 1 · 变更记录 `:396`）。

### 2.13 修正块续（#87 续 · 边界句收正 + 去「拟新增」标记 · 2026-09-25 · eng-designer）

**来源**：§2.12「旁支观察」（§4.15 边界句严格读法窄于实现）+ 父侧派发（fix 轮 #87 续 · 2 条定点；执行人 = 本席）。**面 = 措辞收正 + 去标——机制语义零扩**（零代码 · 需求档零触 · 仅 `BATCH-RECORD.md` §4.15 两行）。

**条 → 改动（号 → 改动 file:line · post-edit 坐标）**：

| # | 项 | 改前（句） | 改后（句） | 依据（实读 + 实跑自证） |
|---|---|---|---|---|
| 1 | `docs/core/design/BATCH-RECORD.md:252`（§4.15 边界句） | 「前缀匹配只认**声明基底的相对前缀**」（严格读法窄于实现——无 manifest 时锚定面含缺省回退基底前缀） | 「前缀匹配只认**锚定面基底**（「声明面 + 缺省回退」合体——`batchDocBases`，条 1 取面分野）的相对前缀」（括注同步改「前缀不匹配者不做启发式改写」——逐字对齐 `:238-239` 取面分野） | 锚定腿两处实读：读面 `batch-paths.mjs:92` = `basePrefixes(base, batchDocBases(base))`（合体）；create `:133` 的 `bases` = 调用方传入的 `batchDocBases` 结果（`batch.mjs:295` → `batch-lifecycle.mjs:115`）；`:44` 无 manifest ⇒ 回退 `resolve(docRootBase(cwd), "docs/batches")`，`:48-57` 前缀照产。**内联实跑（非项目目录）**：`resolveBatchCreatePath(nonproj, "docs/batches/../../outside.md", batchDocBases(nonproj))` ⇒ **anchoredEscapeError** 新文案（严格读法「只认声明基底」下不锚定 ⇒ 将落 `nonproj/docs/batches/outside.md` 嵌套）——锚定面确含回退基底前缀，收正与实现一致 |
| 2 | `BATCH-RECORD.md:236`（§4.15 契约行） | 「单源 = `agent-tools/batch-paths.mjs`（拟新增）」 | 「单源 = `agent-tools/batch-paths.mjs`」（实施在盘 ⇒ 去标记，引用转闸态） | 该档已在盘（`thincoder-core/agent-tools/batch-paths.mjs`——§5.2 交付清单行）；去标前该引用即不在悬空列（可解析——标记已属失实）；去标后机检复跑零新增（读数见下） |

**机检读数（`node scripts/doc-check.mjs` 实跑 · 改前 / 改后）**：悬空 **4 / 4**（同四行：`SESSION.md:789` · `TOOLS.md:972/978`）· 行宽 **8 / 8**（同八行：`BATCH-RECORD.md:403/410` + `MODEL-BENCH.md` 6 行）· 路径/坐标候选 8686 / 8686 · 拟新增 **11 / 11**。唯一读数漂移 = 符号·宽候选 13047 → 13048（+1 = `:252` 新引入码段名 `batchDocBases`——报告面不入闸，且该名在 codeIds 内 ⇒ 零报告行）。**闸态零新增。**

**读回核验（D6）**：改动两行逐行读回（`:236` 去标句 · `:252` 锚定面基底句）。

### 2.14 修正块续（#88 · 设计档两处滞后补句 · 2026-09-25 · eng-designer）

**来源**：批档 §5.7 上抛 1（实施席实读列报「设计档滞后 2 处」）→ 父侧派发 #88（裁定：设计笔域 ⇒ 派 eng-designer）。**面 = 补句——机制语义零扩**（零代码 · §1/§3 零触 · 需求档零触 · 仅 `LEDGER.md` §2.2 两句；两处原段折行为两行——折行零语义）。

**条 → 改动（号 → 改动 file:line · post-edit 坐标）**：

| # | 项 | 改前（句） | 改后（句） | 依据（实读 + 用例自证） |
|---|---|---|---|---|
| 1 | `docs/core/design/LEDGER.md:102-103`（§2.2 审计面；改前 `:101`） | 定性枚举 = 五态（`目标库` / `变体源` / `空库` / `不可归因（有行）` / `不可读（坏档）`） | 枚举补第 6 态 **`不可归因（读取失败）`**；续行写明该态语义 = 并发删除 / 不可 `stat` ⇒ 该档大小 / mtime / 行数记空（输出 `—` / `?` 占位）、**按档报告不抛**（整命令不中断） | 实现实读：`ledger-migrate.mjs:264-265`（`statSync` 包 try ⇒ 早退报该态；`:283` `READ_FAIL_SUGGESTION`；`:289` 计数与枚举同列；`:293` `—` / `?` 占位）；用例实读：`test/ledger-migrate.test.mjs:221-227`（悬空符号链接 ⇒ `statSync` ENOENT 同态 + Summary 收敛该态 + 输出零 `undefined` + 邻态 `:224` 不回归） |
| 2 | `docs/core/design/LEDGER.md:86-87`（§2.2 `--from` 句；改前 `:86`） | 「指名键无对应库 / 不可开 ⇒ 拒跑」（无键形条件） | 补「**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`，判在目录拼接之前 ⇒ 路径形 / 越目录形取值不落台账目录外档）」+ 拒态三合一「**非法键形 / 指名键无对应库 / 不可开 ⇒ 拒跑**」（fail-closed，零写；显式指名不静默跳过） | 实现实读：`ledger-migrate.mjs:86-88`（正则 fail-closed 判在 `:87` join 之前）；用例实读：`test/ledger-migrate.test.mjs:271-277`（路径形 / 非十六进制 / 无库三拒态各 1 + 零写断言） |

**机检读数（`node scripts/doc-check.mjs` 实跑 · 改前 / 改后）**：悬空 **6 / 6**（同集）· 行宽 **10 / 11**（+1 = `PROMPT-SYSTEM.md:222`——两跑之间由并行批写入，非本档）。**本档 `LEDGER.md` 零新增**：悬空与行宽闸态两列表均无 `LEDGER.md` 行；仅改前已存的 11 条 符号·宽 报告面行随折行位移 +2（`:140→142` / `:196→198` / `:200→202` / `:282→284` / `:339→341`——报告面，不入闸）。读数构成：悬空 6 = 父侧基线 4（`SESSION.md:789` · `TOOLS.md:972` · `TOOLS.md:978`×2）+ 在飞 2（`MODEL-SPECS.md:1368/1442`）；行宽 11 = 基线 8（`BATCH-RECORD.md:403/410` · `MODEL-BENCH.md` 6 行）+ 在飞 3（`MODEL-SPECS.md:1368/1457` · `PROMPT-SYSTEM.md:222`）。

**读回核验（D6）**：改动区逐行读回（`:86-87` 键形句 · `:102-103` 枚举 + 读取失败态句）。

**旁支观察（列报 · 零动作——派发「两句以外零改」）**：① `LEDGER.md:321`（T31 行）仍持键形守卫前形态（未含路径形 / 非键形两拒态）；② `LEDGER.md:294`（AC-M2-13 行）与需求档 `ENGINEERING-MODE-V2-SPEC-LEDGER.md:65` 同持五态缩写形（读取失败态未列）；③ `LEDGER.md:318`（T28 行）「五类」未含读取失败态（用例侧 T28 档头 `:187` 已扩该形）；④ `LEDGER.md` 变更记录未加行（按派发零改）。①②③④ 均非本笔工作令——如需同步，父侧裁。

### 2.15 修正块续（#95 · 同族枚举一致性收正 · 2026-09-25 · eng-designer）

**来源**：批档 §2.14 旁支观察（①T31 键形拒两态缺失 / ②AC-M2-13 缩写枚举未列读取失败态 / ③T28「五类」未含读取失败态 / ④变更记录未补行）→ 父侧派发 #95（裁定：1/3/4 全收；2 的设计档半收——需求档半归父侧）。**面 = 同族枚举一致性收正——机制语义零扩**（零代码 · §1/§3 零触 · 需求档零触 · 仅 `LEDGER.md` 三行 + 变更记录五行；本档 §2 修正块续 / 状态行）。

**条 → 改动（号 → 改动 file:line · post-edit 坐标）**：

| # | 项 | 改前（句） | 改后（句） | 依据（实读自证） |
|---|---|---|---|---|
| 1 | `docs/core/design/LEDGER.md:321`（T31 行） | 「指名键无对应库 / 不可开 ⇒ 拒跑（零写）」——未含键形条件与路径形 / 非键形 | 补键形守卫「**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`——路径形 / 非键形 ⇒ 拒）」+ 拒态句改「fail-closed，零写」 | 实现实读：`thincoder-core/ledger-migrate.mjs:86`（正则 fail-closed 判在 `:87` join 之前）；用例实读：`thincoder-core/test/ledger-migrate.test.mjs:271-277`（路径形 / 非十六进制形 / 无库三拒态各 1 + 零写断言） |
| 2 | `LEDGER.md:294`（AC-M2-13 行） | 「不可归因 / 不可读」缩写——未列读取失败态 | 六形全列「不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档）」——与需求档 `ENGINEERING-MODE-V2-SPEC-LEDGER.md:65`（父侧半 · 实读已在盘）及本档 `:102` 同形 | `LEDGER.md:102`（本席 #88 轮所落六态枚举 · 同源）；实现 kind 字符串 `ledger-migrate.mjs:265` / `:268-269` |
| 3 | `LEDGER.md:318`（T28 行） | 「… / 不可归因有行 / 坏档 **五类**」 | 「… / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档） **六类**」——计数与列表同改（D3） | 用例实读：`test/ledger-migrate.test.mjs:187`（档头已扩该形）；`:220-227`（悬空符号链接 ⇒ 该态定性 + Summary 计数收敛 + 输出零 undefined） |
| 4 | `LEDGER.md:359-363`（变更记录） | 末行止于「设计评审轮 1 修正」（`:358`） | 补两轮：#88（实施后设计收正——键形守卫 / 读取失败态 / dry-run 定形 / 新建目标文案四项之设计档两处补句）+ #95（本轮枚举收正） | 体例照既有条目（日期 + 批 · 轮 + 作者 + 承来源 + 分号列）；父侧派发「按本档变更记录体例记 #88 + #95 两轮」 |

**机检读数（`node scripts/doc-check.mjs` 实跑 · 改前 / 改后）**：改前悬空 **6** / 行宽 **11**；改后悬空 **8** / 行宽 **14**——增量**全部 = 并行批在飞**（`MODEL-BENCH.md` 在飞改写：+2 悬空行 `:1604` · 行宽 6→9 行且行号两跑间持续漂移）。**本档 `LEDGER.md` 改前 / 改后均在两闸态列表零行**；报告面 符号·宽 LEDGER.md 行集 = `:142 / :198 / :202 / :284 / :341` 不变（零新增）。改前基线构成：悬空 6 = `SESSION.md:789` · `TOOLS.md:972` · `TOOLS.md:978`×2 · `MODEL-SPECS.md:1368/1442`；行宽 11 = `BATCH-RECORD.md:403/410` · `MODEL-BENCH.md` 6 行 · `MODEL-SPECS.md:1368/1457` · `PROMPT-SYSTEM.md:222`。

**读回核验（D6）**：改动区逐行读回（`:294` AC 行 · `:318` T28 行 · `:321` T31 行 · `:359-363` 变更记录两轮——post-edit 读回在案）。

**旁支观察（列报 · 零动作——派发「除上述四条面零改」）**：#88 实施面尚存四处设计档滞后（同族，本轮射程外——如实列报，供父侧裁）：

1. `:93`（步 3）「任一…失败 ⇒ `ROLLBACK`（**目标零变**、源零动）」未含新建目标分支（实现两分支 = 既有目标「目标零变」/ 新建目标「目标零行变、源零动——0 行空库档残留」，`ledger-migrate.mjs:220-221`；用例 `test:182`）。
2. `:82`（dry-run 行）目标分支只列「缺档 ⇒ 拟建（0 行）」，未含「目标不可读 ⇒ confirm 面将拒跑」（`ledger-migrate.mjs:125`；用例 `test:93-99`）。
3. `:314`（T24 行）未含目标不可读输出定形子例（同 2）。
4. `:317`（T27 行）未含「新建目标迁入失败——残留措辞」子例（用例档头 `test:5` 已扩、`test:177-183`）。

如需同步，父侧裁。

### 2.16 修正块续（#98 · #88 四残留收正 + 闭合面全表对读 · 2026-09-25 · eng-designer）

**来源**：本档 §2.15 旁支观察 1–4（#88 实施面四处设计档滞后）→ 父侧派发 #98（裁定：4 项全收 + 闭合面完整性对读加做；处置执行人 = eng-designer）。**面 = 定点 4 + 闭合面对读——机制语义零扩**（零代码 · §1 / §3 零触 · 需求档零触 · 该档 §2.2 / §8 / §9 三面以外零改）。

**条 → 改动（号 → 改动 file:line · post-edit 坐标）**：

| # | 项 | 改前（句） | 改后（句） | 依据（实读 + 用例自证） |
|---|---|---|---|---|
| 1 | 【列报 1】`LEDGER.md:93-94`（步 3 失败分支） | 「任一步失败 ⇒ `ROLLBACK`（目标零变、源零动）」——单支 | 「任一步失败 ⇒ `ROLLBACK`（措辞二分支：既有目标「目标零变、源零动」/ 新建目标「目标零行变、源零动（目标档为本次新建——ROLLBACK 后 0 行空库档残留在原路径）」）」 | 实现 `ledger-migrate.mjs:221`（`targetExists` 二分支文案逐字）；用例 `test/ledger-migrate.test.mjs:182`（新建场景写明 ∧ 不再称「目标零变」）。**折行零语义**：改后单行 353 字符触发行宽闸 ⇒ 折 `:93`+`:94`（「连接设 `PRAGMA …`」移 `:94`；先例 = §2.14 折行） |
| 2 | 【列报 2】`LEDGER.md:82`（dry-run 行 · 目标分支） | 目标二分支（缺档 ⇒ 标「拟建（0 行）」/ 行数） | 补第三态「**不可读 ⇒ 标「不可读」且 confirm 面将拒跑（fail-closed）、迁移后计数以 `?` 占位**」 | 实现 `ledger-migrate.mjs:125`（三分支）+ `:128`（`?` 占位）；用例 `test/ledger-migrate.test.mjs:93-99`（显式「不可读」+ 全输出零 `undefined` + `post-migration count = ?`） |
| 3 | 【列报 3】`LEDGER.md:315`（T24 行） | 未含目标不可读输出定形子例 | 补「+ **目标不可读子例**（非 sqlite 档）⇒ 显式标「不可读」、迁移后计数 `?` 占位、全输出零 `undefined`」 | 用例 `test/ledger-migrate.test.mjs:93-99`（三断言 · 同 #2） |
| 4 | 【列报 4】`LEDGER.md:318`（T27 行） | 三子例（wal / 备份失败 / busy）；wal 项作「拒（零写）」 | 四子例齐：wal ⇒ 拒（**目标零变、源零动**）；备份失败 ⇒ 拒跑；busy ⇒ 明示拒跑（既有目标 ⇒ 措辞「目标零变、源零动」零变）；**新建目标 + 迁入失败**（源行撞目标 CHECK）⇒ ROLLBACK + 残留措辞（「目标档为本次新建——0 行空库档残留在原路径」；不再称「目标零变」） | 用例档头 `test/ledger-migrate.test.mjs:5`（四子例枚举）+ `:162/:163/:173/:182`（断言）；实现 `:221` |
| 5 | 【对读余项 A】`LEDGER.md:82`（源侧子句） | 源侧只列「逐源行数 + 状态分布 + mtime」 | 补「**源不就绪（不可读 / 无 `items` 表 / 缺列）⇒ 行内标「⚠ <拒因>（confirm 面将拒跑）」**」 | 实现 `ledger-migrate.mjs:127`（`⚠ ${refusal}（confirm 面将拒跑）`）——同 #2 同一标记概念（列报 2 的源侧同族） |
| 6 | 【对读余项 B】`LEDGER.md:82` + `:323`（写门风险旗条件） | 「`task_book` 不可解析」（单形） | 「`task_book` 不可解析 / 指向档不存在」（两形） | 实现注释 `ledger-migrate.mjs:74`（两形并列）；用例 `test/ledger-migrate.test.mjs:287-293`（断言形 =「指向的档不存在」）；§6.1 术语（「不可解析」= 缺文件部分单形） |
| 7 | 【对读余项 C】`LEDGER.md:318`（wal 项）+ `:320`（T29 行） | 「拒（零写）」 | 「拒（**目标零变、源零动**）」 | 步 1 备份先行（`:91` 步 1 → `:92` 步 2）⇒ 步 2 拒跑时备份已落盘——「零写」不齐；对齐用例伞称 `test:147`（T27 档头「（目标零变、源零动）」）与断言 `:162/:163/:245/:246` |

**闭合面对读表（行 → 判定 → 动作）**——**射程** = 委派界定（`LEDGER.md` §2.2 全段 + §8 用例表 T24–T32 + §9 全段）；**证据** = `thincoder-core/ledger-migrate.mjs` 全文 + `thincoder-core/test/ledger-migrate.test.mjs` 全文（均本轮实读）；坐标 = post-edit。T21–T23（键归一档）不属本对读射程。

| 行 | 判定 | 动作 |
|---|---|---|
| §2.2 :74-79（标题 / 问题 / 命令面引导） | 无余项 | 零动作 |
| §2.2 :82（dry-run 行） | **余项**（列报 2 + 余项 A/B） | 已收（#2 / #5 / #6） |
| §2.2 :83-84（confirm / audit 行） | 无余项 | 零动作 |
| §2.2 :86（枚举法） | 无余项（与 `flipDriveLetter` / `legacyKeyVariants` 一致） | 零动作 |
| §2.2 :87（`--from` 句） | 无余项（#88 / #95 已收；三拒态与 `fromKeyRefusal` 同源） | 零动作 |
| §2.2 :91（步 1） | 无余项（兄弟位 / 缺档态 / 读回判据与 `ledgerBackupRoot` / `backupStep` 一致） | 零动作 |
| §2.2 :92（步 2） | 无余项（列集就绪判 + wal 拒与 `describeSource` / `:180-186` 一致） | 零动作 |
| §2.2 :93-94（步 3） | **余项**（列报 1） | 已收（#1） |
| §2.2 :95（步 4 回收） | 无余项（rename 不 unlink 一致；回收失败分支无用例面 ⇒ 非族，见表末） | 零动作 |
| §2.2 :96-97（步 5 / 6 报告汇总） | 无余项（字段枚举面；`targetCreated` / `recycled` / 「库为本次新建」= 已载状态的载体细节 ⇒ 非族） | 零动作 |
| §2.2 :99（幂等护栏） | 无余项（与 `test:135-144` 一致） | 零动作 |
| §2.2 :101（语义保全） | 无余项（12 数据列 + id 与 `DATA_COLUMNS` / `verifyImported` 一致） | 零动作 |
| §2.2 :103-104（审计面 / 读取失败态） | 无余项（六态与 `:264-269` 一致；`—` / `?` 占位与 `:293` 一致；Summary 同列 = 枚举自然出口 ⇒ 非族） | 零动作 |
| §2.2 :106（边界段） | 无余项 | 零动作 |
| §8 T24 :315 | **余项**（列报 3） | 已收（#3） |
| §8 T25 :316 | 无余项（与 `test:103-132` 一致） | 零动作 |
| §8 T26 :317 | 无余项（与 `test:135-144` 一致） | 零动作 |
| §8 T27 :318 | **余项**（列报 4 + 余项 C） | 已收（#4 / #7） |
| §8 T28 :319 | 无余项（与 `test:187-228` 一致） | 零动作 |
| §8 T29 :320 | **余项**（余项 C 同式） | 已收（#7） |
| §8 T30 :321 | 无余项 | 零动作 |
| §8 T31 :322 | 无余项（#95 已收） | 零动作 |
| §8 T32 :323 | **余项**（余项 B 镜像） | 已收（#6） |
| §9 :327-334（各边界条） | 无余项（:331「不新增工具/命令/快捷键面」= 展示面不变量——§7.4 同句；本批 CLI 子命令 = `session gc` 先例的既有运维面形态，§2.2 已载 ⇒ 非冲突） | 零动作 |
| §9 :335（库键与迁移） | 无余项（五项边界与实现一致） | 零动作 |

**对读结论**：三面逐行对读完——**余项 3 处（A / B / C，共触 4 行）已一次收齐；其余全表无余项**。#88 四项（`--from` 键形 / 审计读取失败态 / dry-run 目标不可读 / ROLLBACK 二分支措辞）的设计档引用点至此**四处全闭合**：① = `:87` + `:322`（#88 轮 + #95）；② = `:103-104` + `:295` + `:319`（#88 轮 + #95）；③ = `:82` + `:315`（本轮）；④ = `:93-94` + `:318`（本轮）。

**对读表附带判定（非族 · 零动作——实现面独有 / 断言级 / 载体细节，逐条报告）**：① plan 面 `statSync` 抛点（`ledger-migrate.mjs:104`——§5.7 上抛 2 已登记 O2）；② 回收失败分支（`:230-233` `kept` ⇒ `:243-245` 报错 exit 1）与报告写失败告警（`:236` 不阻断）——两实现分支无对应用例面，非本族；③ 报告字段级断言（T25 `recycled` / T30 `targetCreated`）与 T28「Summary 收敛 / 零 `undefined`」断言级细节——语义（回收 / 新建 / 读取失败态）已载，非族；④ 目标键自过滤（`:102` `k !== targetKey`——自迁防护，无用例面）与「不可解析」伞称（用例档头 `:286` 同伞称）——非族。

**机检读数（`node scripts/doc-check.mjs` 实跑 · 改前 / 改后）**：改前（本轮基线）= 悬空 **6** / 行宽 **11**——本档 `LEDGER.md` 两闸态列表**零行**（仅报告面 符号·宽行集，不入闸）。**中途**：行宽 12（+1 = `LEDGER.md:93` 353 字符——本席折行前引入超宽）⇒ 折行消解（见 #1）。**改后**：悬空 **6** / 行宽 **11** = 回升基线——**本档零新增**；报告面 符号·宽行集位移 +1（`:142→:143` / `:198→:199` / `:202→:203` / `:284→:285` / `:341→:342`——折行所致，不入闸）。读数构成：悬空 6 = `MODEL-SPECS.md:1368/1442` · `SESSION.md:789` · `TOOLS.md:972/978×2`（在飞他档，不计入）；行宽 11 = `BATCH-RECORD.md:403/410` + `MODEL-BENCH.md` 6 行 + `MODEL-SPECS.md:1368/1457` + `PROMPT-SYSTEM.md:222`（同上）。

**读回核验（D6）**：改动区逐行读回——`:82`（命令面表 dry-run 行）· `:93-94`（步 3 折叠两行）· `:315/:318/:320/:323`（T24 / T27 / T29 / T32 行）——本轮 edit 上下文 + 定向 read 双证在案。

**列报（零动作）**：① `LEDGER.md` 变更记录未加行（本轮）——按派发「§2.2 / §8 / §9 三面以外零改」零动作；如需补行（体例同 #95 条）随他轮 / 收口轮；② 需求档零触（本对读未现需求端新遗账）；③ 该档 §2.2 / §8 / §9 三面外零改、§1 / §3 零触（逐条遵守）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：ledger-key-normalize 批设计面 = `LEDGER.md` §2.1/§2.2 · `BATCH-RECORD.md` §4.15 · 批档 §2（6 条 + 上抛 7 项裁定落定）· 对象态 = 待评审。

**已核事实（本席 spot-check，非引用）**：受影响文件行数 10/10 逐数吻合（`batch.mjs` 411 · `batch-lifecycle.mjs` 302 · `subagent-spawn.mjs` 407 · `git/checkpoint.mjs` 449 · `ledger-db.mjs` 107 · `ledger.mjs` 214 · `bin/thincoder.mjs` 467 · `test/batch.test.mjs` 474 · `test/batch-doc-gate.test.mjs` 196 · `test/core-hygiene.test.mjs` 191）；五个「新档」实不存在；`resolveBatchDocPath`/`batchDocBases` 确在 `batch.mjs:75/105` 且 `advisor.mjs:11` 消费（四处调用点口径成立）；`session-slots.mjs:62-64` `normalizeCwd` = 仅盘符大写 ⇒ ① 的「CLI 现状键零变」前提成立；`ledger-db.mjs:31` 确为未归一键式（病灶成立）；`git/checkpoint.mjs:40-42` 副本在（④ 成立）且 session 链零 import checkpoint/ledger（无环成立）；`ledger.mjs:95/186` 比较点与 `notifyKey` 在册坐标吻合。

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | Clarity | 🟡 | §4.15 候选序的 ②「项目根」腿无单源、无缺档兜底；基底可多根（§4.9「双基底」/§4.15「逐基底」）时单一「项目根」指哪一未定；AC-BP-2 的 4×4 矩阵未枚举四 cwd，BR-28/29「上级目录」歧义（= 项目根的祖先目录，或项目内上一层目录）——取值不同 ⇒ 用例不同解 | §4.15 写明取根单源（现有 `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`，可引 `LEDGER.md:168` 同式）＋无 manifest 兜底；多基底时「项目根」的取法；§2.4 与 BR-28/29 显式列出四个 cwd |
| 2 | Consistency | 🟡 | 「13 列逐字复制」与 **id 重发**相抵：DDL = 13 列（含 id），括注枚举 = 12 个非 id 列名，AC-M2-12 / T25 的「13 字段逐条保全」无法成立（id 必变） | 统一为「12 数据列逐字 + id 重发（映射入报告）」；AC/T25 等值比对列集写明不含 id |
| 3 | Traceability | 🟡 | ⑥ 设计侧编号 AC-BP-1..4 仅见于批档 §2.5/§2.8/§2.9，`BATCH-RECORD.md` 全文无 AC 面（读毕核），与需求端 AC-M3-5..7 无映射；AC-BP-4 另覆盖 ④⑤（需求侧无对应项） | §2.5 给出 ⑥ 的 1:1 映射表（AC-BP-n ↔ AC-M3-n ↔ BR-nn），或把 ⑥ 的 AC 面落到设计档并在 §2.9 改指 |
| 4 | Doc-state | 🟡 | §2.8 项 1 / §2.9 仍称「需求档缺位 · 三账链现缺需求端一环」/「①②⑥ 需求端待父侧补」，而 §1.3 项 1 已记需求端补齐（F-LX2 / F-BP1 + AC 补记）；§2.8 项 4 的「若父侧裁「本批不动 spawn 门」⇒ 撤该行」条件句已由 §1.3 项 4（采纳）落定 | §2 面把这 7 项标为「已裁定落定」并回指 §1.3，删去未决条件句（历史留记录面），免读者重开死项 |
| 5 | Methodology | 🟡 | §2.3 受影响文件表无 **L7 模块列**（`BATCH-RECORD.md:277/282`：取数面 = 该列去重、§2 落表后须复核），批档 §2 全文「模块」零命中 ⇒ L7 护栏无法复核 | §2.3 表增模块列（非 M 族行标 `—`）并记录去重计数（L7 判定时点②） |
| 6 | Coverage | 🟡 | 备份 / 回收目录写作 `~/.thincoder/ledger-backup|ledger-trash`（字面），而测试缝 `_setLedgerDirForTest` 只覆盖台账库目录变量（`LEDGER.md:197`）；二者关系未写明 ⇒ T24/T25 夹具可能写真实用户目录（与本批登记的 22 个夹具残档同类） | 写明两个目录同派生于可覆盖基（`ledgerDirPath()` 的兄弟位），并在 T24/T25 增「夹具根外零写」断言 |
| 7 | Coverage | 🟡 | ②③ 错误 / 边界用例缺口：源库旧 DDL（缺 `executor`）未列就绪判（`LEDGER.md:90` 只判「可开 ∧ 含 items 表」）；目标库不存在（六步第 1 步预设存在）；`--from <key>`（`:85`）与 dry-run 写门风险旗（`:81`）无对应用例（T24–T28） | 步 2 补列集就绪判（或旧 schema 映射 NULL）；补目标缺档态、`--from`、风险旗三条用例 |
| 8 | Note | 🔵 | AC-M2-11 第三分句「grep 无第二份哈希式」无射程，去重档 / 会话 / checkpoint 各有合法同名哈希面 ⇒ 判据可假阳 | 把 grep 射程限定在台账键生成面（并在 §2.1 注明他面哈希不属本判据） |
| 9 | Note | 🔵 | T23「非字符串 cwd 不炸」口径过宽：`resolve(cwd ?? ".")` 只兜 null/undefined；数值 / 对象入参仍由 `path.resolve` / `resolveProjectRoot` 抛 | 收窄用例口径为「null / undefined / 空串」（或按实现面定值写用例） |
| 10 | Note | 🔵 | §6.1「与台账库关联键逐字同源——`ledger-db.mjs:31` `ledgerDbPath` 同表达式」在 §2.1 加 `normalizeCwd` 后失准（现值实核 = 未归一式；行号亦将漂移） | 改述「解析基准 = 键式的同一子表达式（键另加 normalizeCwd）」并同步坐标 |
| 11 | Note | 🔵 | §4.15「读面候选序对既有命中为**追加**关系」不严谨：② 位于 ③ 之前，`<项目根>/p` 与 `<基底>/p` 并存时结果由 ③ 改为 ② | 该句加限定，或把 ②→③ 的优先级登记为行为变更 |
| 12 | Note | 🔵 | 防嵌套前缀匹配未定边界：按字面串前缀，`docs/batches-old/x.md` 也命中 `docs/batches` ⇒ 被锚定后 fail-closed | 写明按路径段（段边界）匹配，补一例边界用例 |
| 13 | Note | 🔵 | AC-BP-4「⑤ = 登记词条在档 + T22 绿」中 T22 只走核侧（`findProject` / `notifyKey`），不触所登记的两处 `===` 点；⑤ 的验证 = 一次性审计 + 登记 | 显式写「⑤ 零代码改 ⇒ 无守卫用例，验证 = 静态审计在册」，或说明 T22 的间接守卫关系 |

**计数**：🔴 0 · 🟡 7 · 🔵 6（共 13 条；另：无 🔴 ⇒ 判据面无阻塞项）

VERDICT: pass

**limitation**：本轮无 Document Map / 无项目标准档；需求档（`docs/core/requirements/*`）不在评审射程 ⇒ 三账链需求端仅按 §1.3 记录转述，未独立核验。

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 04:5x）

**依据**：用户 04:27「修复吧」+ 04:32「并入吧」= 全链授权（快车道小批 · 自缚沿用）；评审 #72 = **pass**（🔴0 · 🟡7 · 🔵6）；修正轮 #74 = **13/13 落地**（父侧核验：§2.11 在读 · 两设计档改动区实读 · 机检 = **悬空 4 / 行宽 8 = 设计轮基线**——零新增）。

**需求侧遗账 4 条 = 父侧已收正**（本次）：`SPEC-BATCH-SEGMENT.md:25` 「拟新增」标记形 · AC-M3-6 用例域改 **BR-27–BR-35** · `SPEC-LEDGER.md` AC-M2-12 改「**12 数据列逐字 + id 重发**（T24–T32）」· 两档变更记录行折行（370/427 → ≤300）。

**L7 判定（补记——§1 判定时点① 缺预估句，设计轮 §2.3 复核）**：模块族 = **M2 + M3 = 2 ≤2 ✓**（达标，不触发拆批）。

**批准**：射程 **6 条**（#286 ①–⑤ + #287 ⑥）**批准实施**。

**实施派发**：eng-coder（initial · 设计 token 消费）· files = §2.3 表 14 档（core 12 + cli 2）· **实施轮零触碰真实用户数据**（迁移实跑 = 父侧 ops · 收口轮先备份后执行）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-09-25（fix 轮 #88 四项落码（键形守卫 / stat 容错 / 目标不可读定形 / 残留措辞）· 复跑 621/820/961 全绿 · 内评 pass · 读数与上抛见 §5.7）


（eng-coder · 实施轮 · 2026-09-25）

### 5.1 交付摘要（六条逐条）

| 条 | 落点 | 状态 |
|---|---|---|
| ① 库键归一 | `ledger-db.mjs`：`ledgerKey(root)=sha1(normalizeCwd(root))[:16]`（键式单源，createHash 全档恰 1 处）+ `ledgerDirPath()` + `ledgerDbPath` 收正；`ledger.mjs` re-export 增两符号 | ✅ |
| ② 迁移命令面 | 新档 `ledger-migrate.mjs`（dry-run 零写 / 先备份（拷贝 + 读回同计数）/ 单事务迁入（12 数据列逐字 + id 重发 + 事务内读回核验）/ 回收进 `ledger-trash`（不 unlink）/ 报告 + id 映射 / 幂等全字段等值护栏 / `-wal|-shm` 拒 / busy 明示拒跑 / 目标缺档 ⇒ 拟建 / `--from` 补充源）+ CLI `case "ledger"` 接线（USAGE 两行） | ✅ |
| ③ 残档审计 | 同档 `runLedgerAudit` / `auditLedgerDir`：五态定性（目标库 / 变体源 / 空库 / 不可归因（有行）/ 不可读（坏档））+ 候选根集合（锚项目 + `--root`）+ 处置建议；**只报告零动作** | ✅ |
| ④ checkpoint 单源 | `git/checkpoint.mjs` 删私有 `normalizeCwd` 副本，改直引 `session-slots.mjs`（无环——设计轮实核沿用） | ✅ |
| ⑤ VSC `===` 边界 | 零代码改（登记 = `LEDGER.md` §2.1；验证 = 静态审计在册 + T22 间接守卫） | ✅ |
| ⑥ batch 路径统一 + 防嵌套 | 新叶档 `batch-paths.mjs` 单源（候选序 cwd → 项目根 → 基底 · 读面取首个可读 · create 取首个落基底内 · 锚定按段边界判 + fail-closed 新文案逐字）；四处调用点全经它（create / append·status·close / 评审门 `advisor.mjs` 经 re-export / spawn 门） | ✅ |

### 5.2 文件清单与实测行数（node 实测 · wc -l 口径）

**新增**：`agent-tools/batch-paths.mjs` **142** · `ledger-migrate.mjs` **300**（≤300 ✓）· `test/batch-paths.test.mjs` **146** · `test/ledger-key-normalize.test.mjs` **92** · `test/ledger-migrate.test.mjs` **268**
**改动**：`ledger-db.mjs` 107→**126** · `ledger.mjs` 214→**215** · `git/checkpoint.mjs` 449→**444** · `agent-tools/batch.mjs` 411→**366** · `agent-tools/batch-lifecycle.mjs` 302→**293**（≤300 ⇒ 移出 `SOFT_LINE_REGISTRY`，`test/core-hygiene.test.mjs` 注 +3/−1）· `agent-tools/subagent-spawn.mjs` 407→**404** · `test/core-hygiene.test.mjs` 191→**194** · `thincoder-cli/bin/thincoder.mjs` 466→**481**（≤500 硬限）· `thincoder-cli/test/batch-doc-gate.test.mjs` 196→**227**
（`ledger-db.mjs` 实测 126 vs 设计预算 ≈114（+7±3）——Δ≈+19 超预算带，报告项见 §5.5 上抛 4。）

### 5.3 决策透明表（实施轮判断，逐条披露）

| # | 判断 | 依据 / 影响 |
|---|---|---|
| 1 | **读面基底腿按声明面门控**（无 manifest ⇒ 无基底腿），create/锚定/在飞扫描用含默认回退的 `batchDocBases` | §4.15 条 1 括注「缺省回退默认值」若施加到读面，会掀掉零改档 `test/docroot-multiroot.test.mjs:152`「无 manifest → v1 单基底 throw」（AC-BP-3 硬线）⇒ 取零回归解（BR-34 用例断言落在 create 面）。设计措辞张力已上抛（§5.5 上抛 1） |
| 2 | **锚定集合 = 声明基底的项目根相对前缀**（§4.15 条 3 + 边界句），BR-32 新文案可达实例 = 锚定串经项目根形**越出**声明基底（如 `docs/batches/../../x.md`） | BR-32 表格行字面（「声明基底为他值 ⇒ fail-closed」）与条 3/边界句相抵；独立审计（§5.4）判定实施侧正确、建议设计侧收正措辞（§5.5 上抛 2） |
| 3 | **§6.1 文档引用锁收正**：dry-run 风险旗文案里的 `§6.1` 改为自然语言（「写入时门约束」） | CLI 常驻锁 `prompt-refs-zero.test.mjs` T9 命中（父侧 relay 05:xx 通报 + 本席自查）；按锁判据「实读扫描域与豁免规则后收正引用形态」，未改锁、未改扫描面 |
| 4 | **迁移实跑零触碰**：本轮零写真实 `~/.thincoder/**`（仅只读 `ledger audit` 一次作集成验证——读数 = 25 档：目标 1 / 变体源 1 / 空库 1 / 不可归因 22 / 坏档 0，与批档 §2.7 实况吻合） | 批档 §1.3 项 5（执行主体 = 父侧 ops）；用例一律夹具目录（含「夹具根外零写」断言：备份/回收根 = `ledgerDirPath()` 兄弟位 ⇒ 同随覆盖基） |
| 5 | **advisor 建议的 🟡/🔵 未落码**（`--from` 键形校验 / 审计无 items 表定性 / audit `statSync` 收 try / 目标不可读时 `rows undefined` / 「目标零变」措辞收窄） | 评审判 **pass（无 must-fix）**；改动会失效已完成的评审工件（评审对象变更 ⇒ 评审陈旧）。逐条列报父侧裁定（§5.5 上抛 3） |

### 5.4 审计与代码评审轮次与终态

1. **内部分歧审计**（explore 子代理 · 只读 · 1 轮）：**无交付级分歧**（四类偏差 0 项）——六条逐条落地无简化 · 零回归硬线守住（文案逐字对照批前镜像）· 零改面 8/8 未被触碰 · 受影响面恰 14 档无越界；两处判断（读面基底腿 / BR-32 锚定集合）经其独立判定**实施侧正确**，并建议设计侧收正措辞。
2. **内部代码评审**（advisor `type=code` · 同步 · 轮 1 全量）：**VERDICT: pass**（0 🔴 / 2 🟡 / 5 🔵，无 must-fix）。两条 🟡 = `--from` 取值未做键形校验（可指到台账目录外的 `.db` 并被回收 rename；已备份可回退，且需操作者显式传值 + `--confirm`）+ 读面基底腿与设计行文的措辞张力；五条 🔵 均为鲁棒性/文案/数值微差。
3. **终态 = `clean`**（审计 1 轮 + 评审 1 轮，无返工轮；评审后零代码改动以保工件有效）。

### 5.5 fix round 与上抛项

**实施中自查修正（3 项 · 均在审计/评审之前）**：① `verifyImported` 既有行核验误判（首跑把新插入行当既有行 ⇒ 全部 ROLLBACK）——收窄为「按迁前 id 集逐行比对」；② §6.1 引用锁命中（§5.3#3）；③ 用例断言口径 3 处（资源/夹具口径，非实现缺陷）。

**上抛（父侧裁定）**：
1. `BATCH-RECORD.md` §4.15 条 1 括注精度：读面基底腿 = 声明面（无 manifest ⇒ 无基底腿，v1 语义）；「缺省回退默认值」归 create/扫描/锚定面。另 BR-30 行文（落 `docs/batches/<x>.md`）仅当 cwd = 基底父目录成立。
2. `BATCH-RECORD.md` §4.8 BR-32 行文与 §4.15 条 3/边界句相抵（前者字面不可达）——建议按实现口径收正（锚定集合 = 声明基底前缀；新文案属「锚定 + 越出」）。
3. advisor 🟡 1「`--from` 键形校验」：建议 fail-closed 校验 `/^[0-9a-f]{16}$/`（本轮未落码——待裁；落码即须重开评审轮）。
4. `ledger-db.mjs` 实测 126 行 vs 设计预算 ≈114（上限 117）——数值漂移报告项（收口轮可入 §6 实读行数）。
5. **并发批干扰读数（透明披露）**：本工作树另有在飞批（`peer-claims.mjs` 新增 / `peer-domains.mjs` 改动 / `prompt-inflight-ask` / `question-tool-filter` / `model-specs-cleanup`）。本席 CLI 全量在己方冻结件上两次读绿（820/820），中途一次跑出 3 红（`tui-stderr-capture` ×2 / `wait-status-callsites` ×1，皆非本批档面）——两档单独复跑 14/14 绿 ⇒ 并发/负载假红；核全量 611/611 绿。

### 5.6 状态补记（D6 回读后 · 收尾核验）

- 评审后仅一处改动 = `ledger-db.mjs:36` 注释错字（「木函数」→「本函数」）——**纯注释、零语义**，评审结论不受影响；相关用例组（本批三新档 + core-hygiene）复跑 **28/28 绿**。
- 收尾读数（三包全量 · 己方冻结件）：core **611/611** · cli **820/820** · vsc **953/953**；`node scripts/doc-check.mjs` = **悬空 4 / 行宽 8**（= 父侧给定基线）；`node --check` ×14 档全过。
- 父侧 relay 的 `§6.1` 引用锁事项：**已在本轮实施窗口内收正并复验**——`prompt-refs-zero.test.mjs` T9 单跑 9/9 绿；`ledger-migrate.mjs` 现仅注释行残留 `§6.1`（锁的 `stripCodeLine` 对全行注释行豁免，与 T6 用例同判据）；未改锁、未改扫描域（域含 `thincoder-core/**` 为锁设计本意，无锁面缺陷）。

### 5.7 fix 轮 #88（内部评审轮 1 四项落码 · 2026-09-25 · eng-coder）

**来源**：批档 §1.4 项 3–6（父侧裁定全收——内评轮 1 的 🟡1 + 🔵3）。**面 = 定点四项**（非全量勘探）；改动面 = `thincoder-core/ledger-migrate.mjs`（+ `test/ledger-migrate.test.mjs`）；docs 零触（#87 设计收正已先行——开工前实读 `BATCH-RECORD.md` 相关节核毕，与四项零字面冲突）。

**号 → 改动（file:line，post-edit 坐标）**：

| # | 项 | 改动 |
|---|---|---|
| ① | `--from` 键形守卫 | `ledger-migrate.mjs:86` 增 `/^[0-9a-f]{16}$/` fail-closed（判在 `:87` join 之前 ⇒ 路径形 / 越目录形取值不拼出台账目录外档）；三种拒态各 1 用例（`test/ledger-migrate.test.mjs:271-277`：路径形 / 非十六进制 / 无库 + 零写断言），`:278-282` 原有并集去重 / 照迁面零变 |
| ② | 审计 stat 容错 | `ledger-migrate.mjs:264-265` `statSync` 包 try ⇒ 不抛；该档报新态「不可归因（读取失败）」（size / mtime / rows = null）；`:283/:289/:295` 计数与建议同列（`READ_FAIL_SUGGESTION`）、`:293` `—` / `?` 占位；用例 `test:221-227`（悬空符号链接 ⇒ `statSync` ENOENT 同态 + Summary 收敛该态 + 输出零 `undefined` + 邻态 `:224` 不回归） |
| ③ | dry-run 目标不可读定形 | `ledger-migrate.mjs:125` 显式「目标不可读（…）——confirm 面将拒跑（fail-closed）」三分支 + `:128` 迁移后计数 `?` 占位；用例 `test:93-99`（含全输出零 `undefined` 断言） |
| ④ | 「目标零变」文案收正 | `ledger-migrate.mjs:220-221` 按 `targetExists` 二分支：既有目标「目标零变、源零动。」（逐字零变）/ 新建目标「目标零行变、源零动（目标档为本次新建——ROLLBACK 后 0 行空库档残留在原路径）」；用例 `test:172-183`（新建场景写明 ∧ 不再称「目标零变」；既有目标措辞回归断言） |

**档位 / 锁面**：`ledger-migrate.mjs` = **299** 行（≤300——注释折行压缩 10 处，零语义）；`test/ledger-migrate.test.mjs` = **298** 行（≤300；用例以子面并入既有 T-block ⇒ T24–T32 枚举零漂）；两档均未触 `SOFT_LINE_REGISTRY`；`prompt-refs-zero` 锁面零命中（新增 `§` 仅全行注释行 + test/ 在锁排除域内）。

**复跑读数（本席实跑）**：core **621/621** · cli **820/820** · vsc **961/961**（均 0 fail / 0 skipped；例数不减）；`node scripts/doc-check.mjs` = **悬空 4 / 行宽 8**（= 父侧基线，零新增）；`node --check` ×2 = OK。

**内部协议轮次与终态**：内部分歧审计（explore · 只读 · 1 轮）= 四项**零分歧**（零改面点名核零触 · 无静默简化 · 无越界）；内部代码评审（advisor `type=code` · 1 轮）= **VERDICT pass**（0 🔴 / 3 🟡 · 均非 must-fix / 3 🔵）。**终态 = `clean`**（评审后零代码改动以保工件有效）。

**上抛（父侧裁定）**：

1. **设计档滞后 2 处**（docs 禁触域 ⇒ 零动作列报，建议父侧或后续 docs 轮各补一句）：`LEDGER.md` §2.2 审计面五态枚举（`:101`）未含新态「不可归因（读取失败）」；§2.2 `--from` 句（`:86`）未含键形拒条件。
2. **射程外观察（零动作 · 内评同判）**：O1 = `printPlan` 源行 `dist` 兜底（`:121` × `:62`）在「无 items 表」源下落字面 `unreadable: undefined`；O2 = plan 面 `statSync`（`:104`）同族未收（抛点 ⇒ 壳侧 `uncaughtException` 路径，非 fail-closed 文案）。
3. **评审引用校验留痕**：内评报告宿主校验 1 处引用为裸路径（`ledger-migrate.mjs:265`）未过 → 内容经本席实读为真（`:265` = 早退读取失败态行）。

## §6 验证与收口（父代理）

### 6.1 交付与验收（父侧 · 2026-09-25 06:2x）

**交付面**（六条 · 实施 #77 + 修正 #88 + 文档五轮 #87/#89/#95/#98/#100）：

| 面 | 文件（实态行数） |
|---|---|
| 核侧 | `ledger-db.mjs`（126）· `ledger.mjs`（215）· `ledger-migrate.mjs`（新 300）· `agent-tools/batch-paths.mjs`（新 142）· `batch.mjs`（366）· `batch-lifecycle.mjs`（293 · 回落 ≤300 ⇒ 移出 SOFT_LINE_REGISTRY）· `subagent-spawn.mjs`（404）· `git/checkpoint.mjs`（444）· 测试 ×5（core-hygiene 194 · batch-paths 新 146 · ledger-key-normalize 新 92 · ledger-migrate 新 268 · batch-doc-gate 227） |
| 壳侧 | `thincoder-cli/bin/thincoder.mjs`（481） |
| 文档 | `LEDGER.md`（365）· `BATCH-RECORD.md` · 需求档 SPEC-LEDGER（F-LX2 + AC-M2-9..13）· SPEC-BATCH-SEGMENT（F-BP1 + AC-M3-5..7）· 本档 |

**真实迁移实跑（父侧 ops · 本轮）**：先备份两道（手工 `ledger-backup-20260925-0605/` + 迁移自带 `ledger-backup/20260925-060441/` + `migrate-report.json`）→ dry-run（296 + 28 → 计划 324 · 风险旗 0）→ `--confirm`：**migrated 28 → 324 行** · 源回收进 `ledger-trash/20260925-060441`（不删）→ **读回验证**（dry-run 复跑 = 324 行 / 变体源 0；CLI 侧查得原第二库行 `#319` 可见 ✓）。与设计 as-of 预测（287+28=315）之差 = 目标库 05:0x–06:04 间在册增长（+9 行）——预测式「目标 + 源」成立（296+28=324 ✓）。

**验证读数**：三包复跑 core **621/621** · cli **820/820**（本批相关面；vsc 零改面）；机检各轮触碰面零新增（悬空 4 / 行宽 8 基线口径）；`ledger-db.mjs` 126 vs 预算 ≈114 = 数值漂移接受项（§1.4-7）。

**上抛 / 列报处置（全闭合）**：#88 四项（键形守卫 / `statSync` 容错 / dry-run 定形 / 文案精度）→ 设计档两处补句（#95）+ 同族枚举（#95）+ 同族滞后闭合（#98 列报 4 + #100 对读余项 3）——**结论 = §2.2 / §8 / §9 全表对读无余项**（§2.16）；变更记录补记一行（父侧直接执行 · 可 revert）。风险旗 0 · 并发假红 / T9 自愈 /「真实迁移未跑（实施时）」之项 = 知悉项全消解。

**D7 结算清单**：角色表齐（§1 / §4 / §6 父侧 · §2 designer · §3 评审 · §5 coder）✓ · 本 §6 状态行 ✅ · 计数（六条 · 19 档提交面 · 三包读数）✓ · 三链指针（SPEC-LEDGER F-LX2 / AC-M2-11..13 + SPEC-BATCH-SEGMENT F-BP1 / AC-M3-5..7 ↔ 设计档 §2.1 / §2.2 / §4.15 ↔ 本档 §2）闭 ✓ · 变更记录（LEDGER.md 六行 + BATCH-RECORD.md + 两需求档）✓ · 台账 **#286 + #287** 在途 → 待核销 → 已核销 · 前批遗留交叉核：前情 `2026-09-25-hygiene-ab.md`（已收口 2026-09-25）⇒ 无遗留 ✓ · 台账可见面 = 两行 evidence（提交 id 回填）。

**提交**：本回合 path-limited 提交（19 档）+ 双推（origin + github）。

**状态行**：✅ 已收口（2026-09-25）
