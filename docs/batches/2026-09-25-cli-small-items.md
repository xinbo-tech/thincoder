# 2026-09-25 · cli-small-items
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 5/6 · CLI 小品收尾）。
> 台账 = #212 / #340 / #343 / #350（CLI 小品 · 归批）。前情 = docs/batches/2026-09-25-misc-four.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源** = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 5/6 · CLI 小品收尾）。**全链口径** = 设计 → 评审 → §4 → 实施 → §6（承今日先例 · 父侧代执行）。

**批件**（4 条 · evidence 全档 = `ledger_query`）：

| # | 条目 | 要点 |
|---|---|---|
| 台账 #212 | 「上次运行异常终止」提示（**用户裁 15:28 = B**） | 提示行增带记录内 `uptime` + `cwd`（`thincoder-cli/src/crash-reports.mjs:149` 串组装 + 记录解析面；字段本有——`:110` 写入 / `:96` 字段注）；文案原文按裁保留（A 未采纳）；测试 = `test/crash-reports.test.mjs` 旁补（uptime/cwd 在场断言）。 |
| 台账 #340 | CLI 档位登记载体缺位 | 指定载体（既有 CLI 设计档内立节 或 新册）+ 迁入孤儿登记（`bin/thincoder.mjs` 481 · `advisor-chain-guards.test.mjs` 488 · `settings.test.mjs` 480 · `acp-contract.test.mjs` 461）+ `model-picker.mjs`「不预拆」案转正（现仅存冻结批档 `2026-09-19-cli-delete-confirm` §:91/:197）。 |
| 台账 #350 | `memory sweep` 补全 / 机检尾项 | ① bash / fish 旗标补全（zsh 侧已有 `completions.mjs:60`；三套横深不齐）；② sweep 同类机检断言（先例 = `thincoder-cli/test/session-index-cli.test.mjs:96`）；③ 顶层补全词表补 `ledger`（既有漂移）。 |
| 台账 #343 | `bench/lib/client.mjs:43` 注释 | 相位枚举「gate/retry/overloaded」窄于谓词（非 `warn` ⇒ 含 `quota`）——扩枚举至谓词全相位（注释级）。 |

**边界**：不新改命令行为；#212 只动提示组装（= B 裁所示范围）；#340 载体选择 = 设计裁定（既有「不新造册 · 缺口上报」口径见 file-tier-sweep KD-26——本批 = 缺口收口:指定载体）。

**前情** = 批 `2026-09-25-misc-four` §6（#41 补全轮范围外注记 → #350；#212 = exit-release 事故链第二缺陷）。

**父侧注记（修正轮 2026-09-25 · #52）**：发现 6（需求档 F1 事实面判据句）由**父侧直接执行**落笔——`docs/cli/requirements/CRASH-REPORTS.md:28-30`（逐字句源 = #52 修正轮报告第四节；插入点 = §2 功能表后、F3 判定句块前）✓ 读回核讫。其余 10 条 = `#52` 落位（逐条 file:line 见 §2 修正块 `:182-219`）；机检读数 = 悬空 4 / 行宽 18（零净增）。§4 签口随全量核验后置。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮 2026-09-25 · 承 §3 评审轮 1 发现 11 条逐号落位（见本段修正块）· 发现 6 = 需求档笔归主 agent（父侧裁定 ①））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2 设计（initial 轮 · 2026-09-25 · eng-designer · 承 §1 四条目 #212 / #340 / #343 / #350）

**需求源与三方链**：本批条目 = §1 条目表（台账 #212 / #340 / #343 / #350）；条目细节以台账 evidence 为准（本设计不新增需求条目）。三方链 = §1 → 本 §2 → 设计档落位（`docs/cli/design/CRASH-REPORTS.md` §2.2 修订 + `docs/cli/design/CLI-DEBT.md` 新建 + `docs/README.md` 登记）；需求档（`docs/cli/requirements/**`）零改——需求面观察 = 上抛 1 / 2。

**一、条目覆盖表（逐条）**

| # | 条目 | 覆盖 | 处置 |
|---|---|---|---|
| #212 | 「上次运行异常终止」提示（用户裁 15:28 = B） | ✅ | 提示行增带记录内 `uptime` + `cwd` 两段（原文案保留；A 未采纳）——落点 `thincoder-cli/src/crash-reports.mjs:149` 串组装 + 记录解析面；测试 = `thincoder-cli/test/crash-reports.test.mjs` 旁补 + 降级新例 |
| #340 | CLI 档位登记载体缺位 | ✅ | **载体裁定 = 新册 `docs/cli/design/CLI-DEBT.md`**（KD-1）+ 迁入孤儿 4 档 +「不预拆」案转正 + 同族并入 12 档（表 A/B）；`docs/README.md` 登记同批 |
| #343 | `bench/lib/client.mjs:43` 注释 | ✅ | 注释级收正（扩枚举至谓词全相位）——码面零改（KD-6） |
| #350 | `memory sweep` 补全 / 机检尾项 | ✅ | ① bash / fish sweep 旗标补全（与 zsh `completions.mjs:60` 对齐）；② 机检形 = 新档 `thincoder-cli/test/memory-sweep-cli.test.mjs`（三例）；③ 三套顶层词补 `ledger` |

**二、设计档落点**

| 面 | 落点 | 内容（本批已落盘） |
|---|---|---|
| #212 | `docs/cli/design/CRASH-REPORTS.md` §2.2（`:40-48`）+ 变更记录 | 提示行事实面（形 · 字段源按类 · 退化 · 消费面零改） |
| #340 | `docs/cli/design/CLI-DEBT.md`（**新建 89 行**） | §1 收录口径 4 判据句 · §2 表 A ≥400 全量 15 档 + 表 B <400 裁定在册 6 档 · §3 尾项 4 项 · §4 已消解 2 行 · §5 边界 |
| #340 | `docs/README.md`（§1 计数 23→24 · §4 `cli/` 登记行 + 变更记录） | 新档地图登记（非迁移档注明） |
| #350 | 设计面**无档可落**（发现 —— 上抛 6；尾项登记入 `CLI-DEBT.md` §3-T1–T4） | 修法与机检形住本段（§2）——实施轮直用 |
| #343 | 设计档零改（注释向在档措辞对齐——权威 = `docs/core/design/MODEL-BENCH.md` §2.9-4） | 本段给逐字替换文本 |

**三、逐条设计**

**#212 · 提示行事实面（B 裁）**

- 落点：`thincoder-cli/src/crash-reports.mjs`——串组装 `:149`（现文 = `上次运行异常终止（记录：${best.path}）`）+ 记录解析面（模块内私有 helper；`readFileSync` 已于 `:26` 导入——零新依赖）。
- 契约（定形——测试断言依此）：提示形 = `` `上次运行异常终止（记录：${best.path}${facts}）` ``，`facts` = 按固定序拼接的段：
  - uptime 段：` · 运行 <u>s`——`<u>` = `Number(uptime).toFixed(1)`（一位小数）；仅当 `uptime` 为有限非负数。
  - cwd 段：` · cwd <c>`——`<c>` = 原样字符串；仅当非空 string。
  - 两段皆缺 ⇒ `facts` = 空串 ⇒ 基础形（原文案逐字）。
- 字段源按记录类分：`crash-*.json`（自写）⇒ 顶部 `uptime`（写入点 `:110`）/ `cwd`（`:112`）；`report.*.json`（Node fatal）⇒ `header.cwd`——**Node 报告无 uptime 字段**（实测见下），该段略去。
- 退化（尽力面 · N1）：读档 / `JSON.parse` 失败、字段缺 / 型不符 ⇒ 对应段略去；不抛、不阻断启动。
- 判定集零改：选中记录 = 既有 `best`（窗内 mtime 最新者——两类模式 / N3 不动）；facts 取自同一档。
- 消费面零改：`bin/thincoder.mjs:176`（chat stderr 行）· `:381`（TUI 启动提示载荷）仅消费返回串。
- 证据（本席实读 · 2026-09-25）：① 自写记录实例（`~/.thincoder/crash-reports/crash-1790035422053-12892.json`）顶部含 `"uptime": 36431.33…` + `"cwd": "D:\\teamcode"`；② Node 报告实例（`process.report.writeReport` 临时目录实测 · 已清理）header 键集含 `cwd`、**不含 `uptime`**（档 ≈16KB——读取代价可忽略）。
- 测试面（宿主 `thincoder-cli/test/crash-reports.test.mjs` · 现 82 行）：
  - T7 旁补：夹具记录体改真形（`JSON.stringify({ uptime: 1.5, cwd: "<tmp 路径>" })`）+ 新断言 = 提示含 `运行 1.5s` ∧ 含 `cwd <tmp 路径>`（既有 `/上次运行异常终止/` 断言保留）。
  - T7b 零改（仅快照 ⇒ `null`）。
  - 新例 T7c（降级两格）：① 记录体不可解析（如 `"not-json"`）⇒ 基础形（含 `（记录：` 且不含 `运行 `/`cwd `）；② `report.*.json` 形（`{"header":{"cwd":"<x>"}}`）⇒ 含 `cwd <x>` ∧ 不含 `运行 `。

**#340 · 载体裁定 + 登记迁入（KD-1 / KD-2）**

- 落点：**新册** `docs/cli/design/CLI-DEBT.md`（对位册 = `docs/vsc/design/VSC-DEBT.md` §12.1 ∥ `docs/core/design/CORE-UNIFICATION.md` §2.8.1）。
- 裁定理由：① CLI 既有设计档全为**专题档**（TUI 五档 + `ACP-CLIENT.md` + `CRASH-REPORTS.md`）——无任何 CLI 宽面档可挂产品树档位登记；挂进专题档 = 越权 + 不可寻；② 对位先例形态 = 档位登记住在该产品树的债务活账（VSC 树 ⇒ VSC-DEBT）；③ 承 file-tier-sweep KD-26「不新造册 · 缺口上报」（该批边界外）——本批 = 台账 #340 明示「指定载体」的**缺口收口轮** ⇒ 立册在本批边界内。
- 新册判据源 = `thincoder-cli/AGENTS.md:34`（>300 advisory / >500 blocking）+ 各批裁定（逐条注源；需求侧对位判据句缺位 = 上抛 2）。
- 迁入 / 转正（记录面 → 活面）：
  - 台账指名 4 档：`bin/thincoder.mjs` **482**（触发已到 = 前批定线 ≥480 ⇒ 命令分发表外提——表 A4）· `test/advisor-chain-guards.test.mjs` **488**（两组拆分规划在册——A2）· `test/settings.test.mjs` **480**（首登——A5）· `test/acp-contract.test.mjs` **461**（首登——A7）。
  - 「不预拆」案转正：`src/tui/model-picker.mjs` **499**（raw 500 · 余量 0~1）——表 A1；原文 = `docs/batches/2026-09-19-cli-delete-confirm.md` §:91 / §:197。
  - 同族并入（超指名 —— 完整性面 · 上抛 3）：A3 / A6 / A8–A15（≥400 普查面与在册登记项）+ B1–B6（<400 裁定在册项）——逐条注裁定源。
- 收录口径（新册 §1 四判据句）：≥400 必录（余量 ≤100 = 一次实质改动带）· ≥501 必录（现读 0 档）· 裁定在册必录（无论读数）· >300 随触碰补登（**非全量普查**——先例 VSC-DEBT §12.1）。
- 零行为：纯文档；冻结 / 历史批档零改（记录面不回溯——只做「转正」引源）。

**#350 · 三件落点与机检形**

- ① 补全横深（落点 `thincoder-cli/src/completions.mjs` · 现 118 行）：
  - bash：`:16-20` memory 分支内补一行 `sweep)  COMPREPLY=( \$(compgen -W "--origin= --dry-run --confirm" -- "\$cur") ) ;;`（与 list / put 行同形）。
  - fish：`:92-97` 段补三行（`-l origin` / `-l dry-run` / `-l confirm`，`-n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from sweep'`——与既有 memory 行同形）。
  - 旗标集与 zsh `:60` 现状**逐字对齐**（`--origin` / `--dry-run` / `--confirm`）；实装旗标源 = `src/cli/memory-command.mjs` `parseSweepArgs`（`:88-102`）。
- ③ 顶层词补 `ledger`（同档三套）：bash `:24` 词表行内补 `ledger`；zsh `:41-51` `_values 'command'` 补 `ledger[...]` 一行；fish `:74-83` 补 `complete -c thincoder -a ledger -d '...'` 一行。
- ② 机检形（新档 `thincoder-cli/test/memory-sweep-cli.test.mjs`〔拟新增 ≈90 行〕· CLI 两层 glob 自动收集 ⇒ 零登记）：
  - MS-1 源码机检（先例形态 = `test/session-index-cli.test.mjs:88-99`）：读 `bin/thincoder.mjs` + `src/cli/memory-command.mjs` 源文本，断言 `case "memory"` 分发面、`case "sweep"` 分支、`SWEEP_USAGE` 行、三旗标 token（`--origin` / `--dry-run` / `--confirm`）在解析面。
  - MS-2 三套横深一致（子进程驱动 `node bin/thincoder.mjs completion <shell>`——先例 = `test/session-gc-cli.test.mjs:16` 子进程面）：三套输出各含 sweep 三旗标 token（fish 形 = `-l origin` / `-l dry-run` / `-l confirm`）∧ 各含顶层 `ledger`。
  - MS-3 行为边界（直引导出 `memoryCommand`——memory 传 `{}`、`opts.dbPath` 注入临时值，解析错分支零触库）：`--dry-run --confirm` 互斥 / 未知参 / `--origin=` 空 ⇒ 返回 1 + usage（stderr 面断言）。
- 机检形纪律：全部为**源码 token / 输出 token 结构机检**——不读散文（禁散文锚）；「不新改命令行为」= `bin/**` 零 diff。

**#343 · 注释收正（注释级 · 码面零改）**

- 落点：`thincoder/bench/lib/client.mjs:43`（行内注释；该档现 201 行）。
- 现文（尾注）：`// 实际暂停（gate/retry/overloaded）才记；“warn” 相位不等待 ⇒ 不记（§2.9-4）`。
- 收正为（逐字 · 扩枚举至谓词全相位）：`// 记 = 非 “warn” 相位（gate / quota / retry / overloaded）——谓词口径；“warn” 相位不等待 ⇒ 不记（§2.9-4）`。
- 依据：谓词 = `w?.phase && w.phase !== "warn"`（同档 `:43` 码面）；核现产相位集 = `warn`（`thincoder-core/provider/rate.mjs:96` / `:110`）· `gate`（`:144`）· `quota`（`thincoder-core/provider/retry.mjs:60`）· `retry`（`retry.mjs:68` / `provider/core.mjs:469`）· `overloaded`（`provider/core.mjs:250`）——枚举缺 `quota` 即失真；设计档权威措辞 = `docs/core/design/MODEL-BENCH.md` §2.9-4（`:450`「`onWait` 非 `warn` 相位」）。
- 零改面：码面逻辑 / 相位集 / 记录形状 / 夹具零改；设计档零改（注释向在档措辞对齐——无内容增量）。

**四、受影响文件与测试面全列（行数口径 = `wc -l` · 现读数 as-of 2026-09-25 设计轮实读）**

| # | 文件 | 现 → 预计 | 面 |
|---|---|---|---|
| 1 | `thincoder-cli/src/crash-reports.mjs` | **150 → ~163**（+13±5：解析 helper + 段拼接 + 头注） | #212 |
| 2 | `thincoder-cli/test/crash-reports.test.mjs` | **82 → ~100**（+18±6：T7 旁补 + T7c 新例） | #212 |
| 3 | `thincoder-cli/src/completions.mjs` | **118 → ~124**（+6±1：bash sweep 行 + fish 三行 + zsh / fish 顶层各一行；bash 顶层行内改） | #350①②③ |
| 4 | `thincoder-cli/test/memory-sweep-cli.test.mjs` | 新建 **≈90** | #350② |
| 5 | `thincoder/bench/lib/client.mjs` | **201 → 201**（±0 行——注释行内改） | #343 |
| 6 | `docs/cli/design/CRASH-REPORTS.md` | 184 → **194**（+10 · **已落盘**） | #212 |
| 7 | `docs/cli/design/CLI-DEBT.md` | 新建 **89**（**已落盘**） | #340 |
| 8 | `docs/README.md` | 121 → **123**（+2 改行 · **已落盘**） | #340 |
| 9 | 本批档 | §5 实施读数（实施轮）+ §2 本段 | 记录 |

**测试面**：新增测试档 1（行 4——三例 MS-1/2/3）+ 既有档旁补 1（行 2——T7 旁补 + T7c）；`bin/**` 零 diff（不新改命令行为）；三树复跑 = CLI / core / VSC（本批码面隔离于 CLI + bench）。

**五、验收对照（逐条可机检）**

| # | 判据 | 机检命令 / 口径 |
|---|---|---|
| AC-1 | #212：提示行两段在场 + 降级两格 + 判定集零改 | `cd thincoder-cli && node --test test/crash-reports.test.mjs` ⇒ exit 0（T7 / T7b / T7c 全绿；串形逐字 = `上次运行异常终止（记录：… · 运行 <u>s · cwd <c>）`） |
| AC-2 | #340：新册在盘 + 登记迁入在册 + 地图登记 | grep 点名：`docs/cli/design/CLI-DEBT.md` 内 `bin/thincoder.mjs` **482** · `advisor-chain-guards.test.mjs` **488** · `settings.test.mjs` **480** · `acp-contract.test.mjs` **461** · `model-picker.mjs`「不预拆」转正句 · 表 A 15 行 + 表 B 6 行 ∧ `docs/README.md` 含 `CLI-DEBT` 行 + `24 档` |
| AC-3 | #350：三套补全横深一致 + 顶层 `ledger` + 命令行为零改 | `cd thincoder-cli && node bin/thincoder.mjs completion bash`（zsh / fish 同）⇒ 输出含 sweep 三旗标（fish 形 `-l origin` / `-l dry-run` / `-l confirm`）∧ 含 `ledger`；`node --test test/memory-sweep-cli.test.mjs` ⇒ exit 0；`git diff --stat -- thincoder-cli/bin` ⇒ 空 |
| AC-4 | #343：注释级收正 + 码面零改 | `git diff -- thincoder/bench/lib/client.mjs` ⇒ 仅注释行（`gate / quota / retry / overloaded` 在盘）；`cd thincoder && node --test bench/test/timing.test.mjs` ⇒ exit 0 |
| AC-5 | 全局：三树全绿 + 文档机检本批面零新增 | `cd thincoder-cli && npm test` ∧ `cd thincoder-core && npm test` ∧ `cd thincoder-vscode && npm test` 三绿；`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 4 / 行宽 18（= 本批前基线；CLI-DEBT 拟新增标记 1 条为列报·不入闸） |
| AC-6 | 台账：#212 / #340 / #343 / #350 结算 | §6 收口（主 agent）——本设计不自行推进 |

**六、关键决策**

| # | 决策 | 被否备选 / 理由 |
|---|---|---|
| KD-1 | #340 载体 = **新册** `docs/cli/design/CLI-DEBT.md` | 被否「既有 CLI 设计档内立节」——CLI 既有设计档全为专题档（TUI 五档 / ACP-CLIENT / CRASH-REPORTS），无 CLI 宽面档；挂专题档 = 越权 + 不可寻。以 VSC-DEBT §12.1（产品树档位登记住该树债务活账）为形态先例 |
| KD-2 | 收录口径 = ≥400 必录 + 裁定在册必录 + 随触碰补登；**非全量普查** | 被否「>300 全量普查」——维护重、无先例（VSC 侧明文「逐项登记，非全量普查」）；≥400 = 余量 ≤100「一次实质改动带」（历史批净增实测 +9…+95） |
| KD-3 | #212 提示形 = 同括号内追加段（原文案前缀逐字保留） | 被否「括号外尾缀」（读感散 · 两括号并列）；「A 文案弱化」= 用户 15:28 未采纳（原文案保留） |
| KD-4 | #212 字段源按记录类分 + 尽力面降级（段级略去 ⇒ 退基础形） | 被否「仅 `crash-*.json` 类展示」——`report.*.json` 同属提示判定集（N3），其 `header.cwd` 可得即展示；被否「字段缺即不提示」——改变既有提示语义 |
| KD-5 | #350 机检形 = 源码 token 机检（先例形态）+ 子进程补全输出 token 机检 | 被否「只做行为测」（补全 / 分发漂移不锁）；被否「读散文断言」（禁散文锚——测试纪律） |
| KD-6 | #343 = 注释级收正（扩枚举至谓词全相位），码面零改 | 台账已裁（非实现偏差——设计 spec 与实现逐字相符）；被否「改谓词 / 改码」（超裁定范围） |

**七、上抛项（父侧 / 主 agent 定夺）**

1. 【需求面 · 主 agent 笔】`docs/cli/requirements/CRASH-REPORTS.md` **F1 无提示行事实面的判据句**——建议补一句「提示行须带记录内 `uptime` + `cwd`（可得时；退化 = 段略去）」，机检锚 = `test/crash-reports.test.mjs` T7。本批不阻塞（F1 语义未变：仍为 24h 窗存在性提示）。
2. 【需求面 · 主 agent 笔】**CLI 档位判据句缺位**：VSC 侧有 `PROJECT.md` §6 N-P3、核侧有 N8 作档位判据源；CLI 需求档无对位句（本册判据源 = `thincoder-cli/AGENTS.md:34` + 各批裁定）——请立句或裁「以 AGENTS.md 为判据源」。
3. 【范围披露 · 请裁】**同族并入超台账指名**：#340 指名「4 档 + 不预拆案」；本册另并入 12 档（表 A 其余 9 + 表 B 6——皆冻结 / 历史批档在册登记项，逐条注源、零新语义）。属同一收口动作（记录面 → 活面）的完整性面；如判超范围 ⇒ 删行零风险。
4. 【发现 · 读数漂移】台账 #340 记 `bin/thincoder.mjs` **481**、本席现读 **482**（+1）——以现读入册（来源未逐笔归因；他批在飞面）。
5. 【发现 · 尾项登记】补全 / 命令清单**全量**机检锁缺位（本批落窄射程锁 = sweep 三旗标 + 顶层 `ledger` 词）；`session gc` / `session index` 旗标、`ledger` 子命令补全 = 三套皆缺（登记 = `CLI-DEBT.md` §3-T1/T2/T3）。需求侧 N9 现行文「无机检门」在窄射程锁落地后**仍成立**（锁 = 码面 / 输出 token，不读对外文本面）——如需口径收正请裁。
6. 【发现 · 文档面】**CLI 命令入口面（`bin` 分发 / `USAGE` / shell 补全发射）无设计档归属**——本批修法与机检形落 §2（记录面）+ 尾项登记（`CLI-DEBT.md` §3-T4）；立档与否请裁。

**边界（本次不做）**：不新改命令行为（#350 = 补全脚本 / 测试档 / 词表——零命令语义）；#212 只动提示串与解析面（判定集 N3 / purge / 记录写入面零改）；**不拆任何档**（CLI-DEBT 只登记不执行）；不动需求档（主 agent 笔）· 提示词面 · VSC 面 · 冻结批档（零回溯）；设计评审不点火（由父侧按链推进）。

**八、补述：用例表（正常 / 边界 / 错误）+ UI 决策落点 + 三方一致表**

**用例全表（逐例：输入 → 期望输出 → 宿主）**

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T7（旁补） | 正常 | 24h 窗内 `crash-*.json`（体 = `{"uptime":1.5,"cwd":"<tmp>"}`） | 提示含 `上次运行异常终止` ∧ `运行 1.5s` ∧ `cwd <tmp>` | `thincoder-cli/test/crash-reports.test.mjs` |
| T7c-① | 错误（降级） | 记录体不可解析（`not-json`） | 基础形（含 `（记录：`、不含 `运行 `/`cwd `）∧ 不抛 | 同上 |
| T7c-② | 边界（记录类换形） | `report.*.json`（`{"header":{"cwd":"<x>"}}`） | 含 `cwd <x>` ∧ 不含 `运行 `（Node 报告无 uptime） | 同上 |
| T7b（零改） | 边界（负例） | 仅新 `Heap.*.heapsnapshot` | `recentCrashHint` ⇒ `null`（判定集不动） | 同上 |
| MS-1 | 结构机检 | `bin/thincoder.mjs` + `src/cli/memory-command.mjs` 源文本 | `case "memory"` / `case "sweep"` / `SWEEP_USAGE` / 三旗标 token 命中 | `thincoder-cli/test/memory-sweep-cli.test.mjs` |
| MS-2 | 结构机检（横深） | `completion bash` / `completion zsh` / `completion fish` 三套输出 | 各含 sweep 三旗标 token ∧ `ledger` | 同上 |
| MS-3 | 错误（解析面） | `memoryCommand({}, ["sweep","--dry-run","--confirm"], {dbPath:<tmp>})`（并未知参 / `--origin=` 空两格） | 返回 1 ∧ stderr 含 `SWEEP_USAGE` 逐字 | 同上 |

**UI / 交互决策落点**：#212 唯一用户可见面 = 提示串（逐字住 §2 三 · `CRASH-REPORTS.md` §2.2）；其余条目零 UI / 交互面（#350 补全脚本 = 终端补全面 / #340 纯文档 / #343 注释）——**open 项 = 0**。

**三方一致表（§1 条目 ↔ 本 §2 覆盖表 ↔ 设计档落点）**

| §1 条 | 本 §2 覆盖 | 设计档落点 | 一致 |
|---|---|---|---|
| #212 | 覆盖表行 1 | `docs/cli/design/CRASH-REPORTS.md` §2.2（`:40-48`） | ✓ |
| #340 | 覆盖表行 2 | `docs/cli/design/CLI-DEBT.md`（新建）+ `docs/README.md` | ✓ |
| #343 | 覆盖表行 4 | 设计档零改（权威 = `MODEL-BENCH.md` §2.9-4）；逐字替换文本住本 §2 三 | ✓ |
| #350 | 覆盖表行 3 | 设计档缺位（上抛 6）；修法 + 机检形住本 §2 三 / 尾项入 `CLI-DEBT.md` §3 | ✓（缺位已披露） |

**无增项、无缺项**（§1 四条 = 本 §2 四条 = 行 9 台账四条）。

**九、收笔勘误（1 条 · 本席读回自纠）**：#212 落点句（§2 三 · 第 1 条）原写「`readFileSync` 已于 `:26` 导入——零新依赖」——**实核为误**：该档 `node:fs` 导入列表（`thincoder-cli/src/crash-reports.mjs:26`）现为 `chmodSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync`——**不含 `readFileSync`**。
更正：记录解析面须在 `:26` 导入面**补加 `readFileSync`**（仍零新依赖——同模块导入；预计增量不变，+13±5 含该行内改动）。其余坐标与读数经本席逐条读回核对，未见第二处勘误。

### §2 修正块（fix 轮 · 2026-09-25 · 承 §3 评审轮 1 发现 11 条，逐号落位 · 本块为准）

**修正 1**（发现 1）：`docs/cli/design/CLI-DEBT.md` §3-T2 现状列 —「**顶层词已补**（2026-09-25 本批）」⇒「**顶层词**（`ledger`）= 本批补（cli-small-items 批档 §2 #350③；实施 = 该档 §5）」（实施前不写「已补」；实施后态由收口轮收正）。

**修正 2**（发现 2）：bash 补行按**源档形**（与同族 7 行 `:14`/`:17-19`/`:21-22`/`:24` 一致——模板字面量内**两反斜杠**）。
逐字源文本 = `sweep)  COMPREPLY=( \\$(compgen -W "--origin= --dry-run --confirm" -- "\\$cur") ) ;;`。
发射形（本席沙箱实跑取证 2026-09-25：`node bin/thincoder.mjs completion bash` 族行逐字命中）= 单反斜杠 `\$(compgen -W "…" -- "\$cur"`。
**锁发射面判定 = 补**：MS-2 增**字节断言**——bash 套输出含 `\$(compgen -W "--origin= --dry-run --confirm" -- "\$cur"` 段（JS 断言串以 `"\\$("` / `"\\$cur"` 转义形书写；发射形 = 单反斜杠）。

**修正 3**（发现 3）：MS-2 规格补**沙箱句**——子进程 env：`USERPROFILE` / `HOME` → 临时目录（先例 = `thincoder-cli/test/session-gc-cli.test.mjs` 沙箱段）；**禁触真实 `~/.thincoder`**（`bin/thincoder.mjs` 入口无条件 `prepareCrashReporting()` ⇒ 无沙箱会真建目录 + 30 天 purge）。

**修正 4**（发现 4）：`docs/cli/design/CLI-DEBT.md` §2.1 A4 增**耦合注**——外提执行批（触发已到）须同批改 MS-1 源码读取面；MS-1 规格同句：读取面 = `bin/thincoder.mjs` 源文本的 `case "memory"` 分发面，命令分发表外提执行批**须同批**改本读取面（锁点随分发落点走）。

**修正 5**（发现 5 · 旧活登记两处指针化）：
① `docs/cli/design/TUI.md` §6.8.3.4（`:486`）——去读数 `（437 → ~460）`，登记句改**指针**：档位登记（读数 / 触发）= `docs/cli/design/CLI-DEBT.md` §2.1 A9 行（数据单一活面；本档不复读读数）；
② `docs/core/design/DOC-DISCIPLINE.md` §3.10（`:646`）——同式指针化 ⇒ CLI-DEBT §2.2 B4 行；
③ CLI-DEBT 配套：A9 裁定源改引批档（`docs/batches/2026-09-17-subagent-zero-block.md` §:292 · `docs/batches/2026-09-17-async-face-fixes.md` §:358）；B4 裁定源去已指针化的 `DOC-DISCIPLINE.md` §3.10 引（防活面互引成环）；
④ 两档变更记录各 +1 行（留痕）。

**修正 6**（发现 6 · Requirements）：需求档笔 = 主 agent；父侧裁定 = ①（本席不落需求档）。逐字句 + 插入点随交付报告呈报（落位由主 agent 执行，本批 §6 前闭合；回执待收）。

**修正 7**（发现 7 · AC-5 改述）：AC-5 机检腿期望报告行 = **悬空 4 · 行宽 18**（均与本批前基线一致——**不变**）+ **「拟新增 1」列报行**（= `CLI-DEBT.md` 侧 1 条；列报 · 不入闸族义）。口径 = 本批面零新增（悬空 / 行宽对本批档逐一 0 新增；绝对读数随并行链漂移，只作相对判据）。**AC-2 地图腿计数随载体登记收正**：`docs/README.md` 读 `25 档`（非 `24 档`）——`cli/` 14 = design 9 + requirements 5。

**修正 8**（发现 8 · 路径根统一）：受影响表行 5 与 #343 落点统一为**仓根形**（仓根 = `thincoder/`，同 `docs/cli/design/CRASH-REPORTS.md` 档头口径）——行 5 = `bench/lib/client.mjs`（本席实测 201 行 ✓）；#343 落点 = `bench/lib/client.mjs`（`:43` 行内注释）。「`thincoder/bench/lib/client.mjs`」= 工作区根形态，作废。

**修正 9**（发现 9 · 退化两态 + T7c 增格）：
① 设计档 `docs/cli/design/CRASH-REPORTS.md` §2.2 退化句补「**型不符**」——读档 / 解析失败、记录类不明、字段缺 / **型不符**（`uptime` 非有限非负数 · `cwd` 非非空字符串）⇒ 对应段略去；
② T7c 增第三格 **T7c-③**：记录体 `{"uptime":"abc","cwd":"<tmp>"}`（型不符）⇒ 不含 `运行 ` ∧ 含 `cwd <tmp>`（段级降级 · 另一段照出）。

**修正 10**（发现 10 · 行号锚改符号形）：`docs/cli/design/CRASH-REPORTS.md` 本批修订面（§2.1 / §2.2）四处行号锚改符号形——`:33` · `:38` · `:40`（「`crash-reports.mjs` 导出」形）· `:48`（「`bin/thincoder.mjs` 内 `recentCrashHint` 调用：chat 分支 stderr 行 · `startTUI` 载荷 `crashNotice` 字段」形）；判据 = `thincoder-cli/AGENTS.md:33`（符号而非行号）。**批档 §2 落点行号保留**（as-of 精度——不动）；§2.3 等未触碰行号锚保留（历史快照）。

**修正 11**（发现 11 · 载体裁定 + T4 随收）：
① **载体 = 新建 `docs/cli/design/CLI-ENTRY.md`**（命令入口面设计档）——实勘 CLI 设计档族后择定：既有八档全为专题档（TUI 五 + ACP-CLIENT + CRASH-REPORTS + CLI-DEBT），无 argv 命令面档；
② #350 契约**迁入**该档——子命令旗标全集 = §2 命令树表（as-of 实读 · 词表基准）；机检形 MS-1 / MS-2 / MS-3 = §4（含修正 2/3/4 三处规格收正）；
③ `docs/README.md` 登记：§1 部分档计数 24 → 25 · §4 `cli/` 行（design 9）· 变更记录一行；
④ CLI-DEBT §3-T4 **消解移档** ⇒ §4-D3（载体指定 + 契约迁入 = 归属缺位消解）+ 变更记录一行。

**本轮未落 / 待收**：发现 6 = 需求档由主 agent 落笔（逐字句 + 插入点见交付报告；落位回执待收——本批 §6 前闭合）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**范围与口径**：评审对象 = CRASH-REPORTS.md §2.2（#212）· CLI-DEBT.md（#340 新建）· 本批档 §2（#343/#350 逐字落点）。无文档地图声明 ⇒ 归属判据按 Project Guide + `docs/README.md` 实登记面判；无项目标准档声明 ⇒ 方法学按 AGENTS.md / `thincoder-cli/AGENTS.md` 判。为满足受影响档行数注解抽检（判据 8），仅读设计自身引用的档（行数 / 坐标核对），未扩展评审判域。

**已实核通过项（证据）**：受影响表行数按声明口径（`wc -l`）全对——`crash-reports.mjs` 150 ✓（`:26` 导入面确无 `readFileSync`、`:149` 串组装、`:110`/`:112` 字段 ✓，收笔勘误成立）· `crash-reports.test.mjs` 82 ✓ · `completions.mjs` 118 ✓ · `bench/lib/client.mjs` 201 ✓（`:43` 注释与谓词逐字 ✓）· 无档越 300/500 档位。登记读数抽检全对：`bin/thincoder.mjs` 482 ✓（证 上抛 4 之 +1）· `model-picker.mjs` 499（raw 500）✓ · `advisor-chain-guards.test.mjs` 488 ✓ · `settings.test.mjs` 480 ✓ · `acp-contract.test.mjs` 461 ✓ · `subagent-blocks.mjs` 453 ✓。#343 枚举完整性 ✓：核 `onWait` 相位集 = {warn（rate.mjs:96/:110）· gate（:144）· quota（retry.mjs:60）· retry（retry.mjs:68 · provider/core.mjs:469）· overloaded（provider/core.mjs:250）}——收正后枚举恰为全相位（非 warn），且与 `MODEL-BENCH.md:450` 权威措辞一致；`memory-sweep-cli.test.mjs` 落 `test/` 两层 glob 自动收集 ✓（`test/run.mjs:44` + 反向 fail-closed 判据）；既有档无旧提示串逐字断言（仅 `crash-reports.test.mjs:73` 正则）⇒ #212 无静默回归；MS-3 契约可行 ✓（`memory-command.mjs:62-68` 返 1 + 打印 SWEEP_USAGE，解析错分支不触库）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state | 🟡 | `CLI-DEBT.md:68`（§3-T2）现状列写「**顶层词已补**（2026-09-25 本批）」——与本批设计（`:88` ③ 待补 `ledger`）与盘面均不符：`completions.mjs` 全文无 `ledger`（`:24` bash 词表 · `:41-51` zsh `_values` · `:74-83` fish 段），实施（§5）未启。活登记面预declare 完成，可能使该项静默掉账 | 把 T2 现状列的该句改为「本批补（设计 §2 #350③；实施见 §5）」——或按实施后态收正（勿在本批实施前写「已补」） |
| 2 | Clarity | 🟡 | ① 的 bash 逐字行与本档同类行**不同形**：设计写 `\$(compgen … "\$cur"`（单反斜杠），而 `completions.mjs` 同族 7 行（`:14` / `:17` / `:18` / `:19` / `:21` / `:22` / `:24`）均为 `\\$(compgen … "\\$cur"`。逐字照抄 ⇒ 发射字节与同族行不一致（`$(compgen` vs `\$(compgen`），而仓内无任何测试锁该字节面（无 test 引用 `COMPREPLY` / 补全输出），MS-2 只查旗标 token ⇒ 该分歧静默 | 逐字面按**源文本**给足反斜杠（`\\$(compgen … "\\$cur"`）；或明写期望的**发射**字节并在 MS-2 加一条字节断言 |
| 3 | Test hygiene | 🟡 | MS-2 以子进程直驱 `node bin/thincoder.mjs completion <shell>`，但未带其自引先例的沙箱纪律：`bin/thincoder.mjs:53` 无条件 `prepareCrashReporting()` → mkdir + 30 天 purge（`crash-reports.mjs:80-93` / `:54-64`）⇒ 无假 HOME 时该用例会在**真实** `~/.thincoder/crash-reports/` 建目录并删 >30 天取证档（先例 `session-gc-cli.test.mjs:5-6`/`:27-30` 明写「禁触真实 `~/.thincoder`」） | MS-2 规格里钉死沙箱 env（`HOME`/`USERPROFILE` → temp），与先例同式 |
| 4 | Coordination | 🟡 | MS-1 以**源码文本**锁 `bin/thincoder.mjs` 的 `case "memory"` 分发面，而同批新册 `CLI-DEBT.md:35`（A4）登记该档 482 · **触发已到**、方案 = 命令分发表（`switch (command)` case 族）外提——该抽取一旦执行即打断 MS-1，设计未写该耦合 | 在 A4 行（或 MS-1 规格）注明「分发表外提批须同批改 MS-1 读取面」；或把 MS-1 断言改挂不随外提漂移的面（分发行为 / `--help` 输出） |
| 5 | Document ownership | 🟡 | 新册自称「唯一活登记面」（`CLI-DEBT.md:12`），但同文件已存两处**并行活登记**未收：A9（`:40`）重复 `TUI.md:486` 的存量债登记句（该处读数 437 → 现读 453，行内已注「漂移」）；B4（`:55`）重复 `DOC-DISCIPLINE.md:646` §3.10 登记行（该处 370 → CLI-DEBT 现读 371）——同一档两处活读、数不一致 | 旧两处改为指针行（指向 CLI-DEBT 单源）或就地撤登记，保持唯一活面 |
| 6 | Requirements | 🟡 | #212 改的是用户可见提示串，但需求侧无对应判据句（设计 自陈 上抛 1）；「F1 语义未变」为该设计自述，需求档不在本次评审域（unverified）。协调项，非本设计缺陷 | 需求侧补一句事实面判据（锚 = T7），或明裁「以设计 §2.2 为准」——落定后本批 §6 可闭合 |
| 7 | Acceptance | 🔵 | AC-5 行名「文档机检本批面**零新增**」与其口径括注「拟新增标记 1 条为列报·不入闸」并置，读者无法判定期望输出（悬空 4/行宽 18 原样，抑或另加 1 列报行）；另「悬空 4 / 行宽 18 = 本批前基线」本席**未复跑**（unverified） | 直书期望报告行：悬空 4 · 行宽 18（不变）+ 「拟新增 1」列报行（`doc-check.mjs:26`/`:32` 族义：列报不入闸） |
| 8 | Clarity | 🔵 | 受影响表行 5 与 #343 落点写 `thincoder/bench/lib/client.mjs`（工作区根形），同表其余行用仓根形 `thincoder-cli/…`，而 CRASH-REPORTS.md:8 明定「仓根 = `thincoder/`」——仓根形下该行应为 `bench/lib/client.mjs` | 同表统一路径根口径（或在表头声明基准根） |
| 9 | Clarity | 🔵 | 退化规则两态措辞不齐：批次 §2 写「字段缺 / **型不符**」与「仅当 `uptime` 为**有限非负数**」，设计档 `CRASH-REPORTS.md:46` 只写「字段缺」；且 T7c 只覆盖两格（不可解析 / 记录类换形），型不符与非有限数分支无断言 | 设计档退化的字句补齐（型不符）；T7c 增一格（如 `{"uptime":"abc"}`） |
| 10 | Methodology | 🔵 | 被修订的设计面继续用行号锚码（`CRASH-REPORTS.md:48` 的 `bin/thincoder.mjs:176`/`:381`；本批 §2 的 `:16-20`/`:92-97`/`:88-102`/`client.mjs:43` 等），而 `thincoder-cli/AGENTS.md:33` 明令设计档「anchor code references to symbol/export names …, never line numbers」。今日坐标实核全对，但同批 上抛 4 已现读数漂移 | 本批新写/触碰的行号锚改为符号名（`recentCrashHint` / `writeCrashRecord`），保留历史快照处不动 |
| 11 | Document ownership | 🔵 | CLI 命令入口面（bin 分发 / USAGE / 补全发射）无设计档归属（设计 自陈 上抛 6）：本批 #350 的契约（旗标集 + 窄射程锁）只住批档 §2 + 尾项 `CLI-DEBT.md:70`（T4）——记录面承载机制、耐久性留待裁定 | 按 T4 建议立档（或并入 `CLI-DEBT.md` 尾项面）后，把 #350 修法与机检形迁入该面 |

**计数**：🔴 0 · 🟡 6 · 🔵 5。

VERDICT: pass

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 15:29「整体处理」全链授权）：设计（§2 + 修正块 `:182-219`）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡6 / 🔵5——父侧逐条裁定**全数接受**）→ 修正轮 11 条落位（10 条 `#52` + 发现 6 父侧直笔 `docs/cli/requirements/CRASH-REPORTS.md:28-30` ✓ 读回）→ **父侧抽验通过**（新建 `CLI-ENTRY.md` 在盘 · 归表/账目收正逐项实读）⇒ **批准进入实施**。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮，`round=initial`。

## §5 实施记录（eng-coder）

**状态行**：实施完成（initial 轮 · 五档落位 + 修复轮 + explore 审计与 advisor 代码评审两轮 pass）

**一、交付摘要（逐条 ↔ §2 覆盖表 · 行数 = `wc -l` 口径 · 行号 = as-of 实施终态）**

| 条目 | 落点 | 实测读数 |
|---|---|---|
| #212 提示行事实段（B 裁） | `thincoder-cli/src/crash-reports.mjs`：`recordClassOf` 记录类单源 `:47-51` · `recordFacts` 段组装 `:141` 起 · 串组装 `recentCrashHint` 尾 `:178` · `readFileSync` 导入 `:26`；`thincoder-cli/test/crash-reports.test.mjs`：T7 旁补 `:66-78` · T7c 三格 `:88-110` | `node --test test/crash-reports.test.mjs` ⇒ **8/8 绿**；行为五格实跑（注入临时目录）逐格形确：真形 ⇒ ` · 运行 1.5s · cwd …`（段序 = uptime 前 / cwd 后）· 不可解析 ⇒ 基础形 · `report` 类 ⇒ 仅 `cwd` 段 · 型不符 ⇒ 段级降级 · 空对象 ⇒ 基础形 |
| #343 注释收正 | `bench/lib/client.mjs:43`（行内注释；码面零改） | 逐字 = §2 收正文本（含 `quota`）；`node --test bench/test/timing.test.mjs` ⇒ **3/3 绿** |
| #350① 补全横深 | `thincoder-cli/src/completions.mjs:20`（bash sweep 行 · 源文本两反斜杠）· `:112-114`（fish 三旗标行） | 三套实跑（沙箱 HOME——零触真实 `~/.thincoder`）：bash 发射字节段逐字命中 `\$(compgen -W "--origin= --dry-run --confirm" -- "\$cur"`（单反斜杠 · 与同族行同形）· zsh/fish sweep 旗标在场 |
| #350② 机检形（MS-1/2/3） | `thincoder-cli/test/memory-sweep-cli.test.mjs`（**新建** 77 行） | `node --test test/memory-sweep-cli.test.mjs` ⇒ **3/3 绿**（MS-2 假 HOME 沙箱 + bash 字节断言；MS-3 零触库） |
| #350③ 顶层词 | 同档 `:25`（bash 词表）· `:53`（zsh `_values`）· `:85`（fish 子命令） | 三套输出各含顶层 `ledger` 入口形（` session ledger -v --version` / `'ledger[Ledger variants: migrate / audit]'` / `-a ledger`） |

**二、验收对照（AC-1–AC-5 · 实跑）**

| AC | 结论 | 读数 |
|---|---|---|
| AC-1 #212 | ✅ | 8/8（T7 两段在场 / T7b 零改 / T7c 三格）；判定集 N3 零改（`best` 选中逻辑逐字未动）；需求判据句锚 `docs/cli/requirements/CRASH-REPORTS.md:30` 的 T7/T7c 双锚在场 |
| AC-2 #340（设计轮面——本席抽验 · 零触） | ✅ | `CLI-DEBT.md` 表 A 15 行 / 表 B 6 行 / 尾项 T1–T3 在册（T4 已按修正 11 消解移 §4-D3）；点名读数在册：`bin/thincoder.mjs` **482** · `model-picker.mjs` 499「不预拆」转正 · `advisor-chain-guards` 488 · `settings.test` 480 · `acp-contract` 461；`docs/README.md` 含 `CLI-DEBT.md` / `CLI-ENTRY.md` 登记 · `cli/` **14 档** · `24 → 25` 记录行 |
| AC-3 #350 | ✅ | 三套补全实跑（读上行）· 3/3 绿 · `git diff -- thincoder-cli/bin` ⇒ 空（bin 零 diff） |
| AC-4 #343 | ✅ | `git diff -- bench/lib/client.mjs` ⇒ 仅 :43 注释行；3/3 绿 |
| AC-5 全局 | ✅（相对判据） | CLI 全量 **861/861 绿**（含新档）+ core **674/674 绿**；doc-check ⇒ **本批面零新增**（悬空 / 行宽对本批档逐一 0；T7c 用例号锚随落位消解——用例号悬空 0）；**绝对读数漂移 = 并行批所致**（悬空 4 → 28：`docs/desktop/design/PROJECT.md` 24 条〔desktop 新批在飞、`thincoder-desktop/**` 未落〕+ 存量 4 条；行宽 18 不变）；`CLI-DEBT.md:32` 拟新增列报 1 条（列报 · 不入闸）；vsc 树门 = 被并行批未注册档 fail-closed 挡住（`test/effort-select-views.test.mjs`——非本批面） |

**三、受影响文件实数 vs 预计（`wc -l`）**

| 文件 | §2 预计 | 实数 | 差由 |
|---|---|---|---|
| `thincoder-cli/src/crash-reports.mjs` | 150 → ~163（+13±5） | **179**（+29） | helper 注释块 + 记录类单源抽取（修复轮）——超预计带（如实记录；≤300 档免审视） |
| `thincoder-cli/test/crash-reports.test.mjs` | 82 → ~100（+18±6） | **110**（+28） | T7c 三格 + 头注收正——超预计带 |
| `thincoder-cli/src/completions.mjs` | 118 → ~124（+6±1） | **126**（+8） | sweep 行 + fish 三行 + 三套顶层词——超上界 1 行 |
| `thincoder-cli/test/memory-sweep-cli.test.mjs` | 新建 ≈90 | **77** | 低于预计 |
| `bench/lib/client.mjs` | 201 → 201（±0） | **201** | ✓ |

**四、决策透明表（实施轮自决项）**

| # | 自决 | 理由 |
|---|---|---|
| D1 | `recordFacts` uptime 判定用严格型判（`typeof === "number"` + 有限非负） | 设计逐字「`uptime` 非有限非负数 ⇒ 型不符」；自写面写入点恒为 number——严格判不损失真实信息，防字符串混入 |
| D2 | `report.*.json` 的 uptime 段实现为「不取源」（非「有源但实测缺」） | 设计「字段源按记录类分」——Node 报告无该字段（实测）；不读其顶部同名键（防误入） |
| D3 | 记录类判定抽 `recordClassOf` 单源（修复轮 · 评审 🔵 正则双份） | 判定面 `isCrashRecordName` 与事实面 `recordFacts` 共用同一正则源——防漂移；行为等价（8/8 复验） |
| D4 | MS-2 顶层词锁改「发射入口形」逐套锁（修复轮 · 评审 🔵 裸子串锁） | 锁强与同档旗标断言一致；防「任意位置同名串」假绿 |
| D5 | 档头文档引用收正到「现行路径 + 节/符号」粒度（修复轮 · 评审 🔵 档头路径悬空） | 承 `thincoder-cli/AGENTS.md:33`（符号而非行号）；历史 as-of 快照不动 |

**五、审计与代码评审轮次与终态**

| 轮 | 类型 | 结果 | 处置 |
|---|---|---|---|
| 1 | explore 背离审计（只读） | 静态面全相符；背离 1 条 = §5 缺位（时序） | 本段落位（自消） |
| 2 | advisor 代码评审 round 1 | **VERDICT pass**（🔴 0 · 🟡 1〔§5 缺位 · 报告项 · 非 must-fix〕· 🔵 4：行数漂移 / 档头路径悬空 / 记录类正则双份 / MS-2 裸子串锁） | 🔵3 条修复落位（D3 / D4 / D5）；🔵 行数漂移 → 本段「三」收正；🟡 → 本段落位 |
| 3 | advisor 代码评审 round 2（fix 验证） | **VERDICT pass**——三条 fix 声明逐条落核（`recordClassOf` 单源 / 档头引用收正〔目标档 §2.2 / §3 实存〕/ MS-2 锁改发射形〔与发射源逐串对照〕）；无新问题 | 收敛 |

**六、fix round 记录**：修复 3 项（记录类单源抽取 · 档头路径收正 · 测试锁强收紧）——全部经复跑：定向 11/11 绿 + CLI 全量 861/861 绿（终态读数）。发现处置 = 3 修复 + 1 记录收正（行数）+ 1 本段落位（§5）；终态 = **clean**（两轮 advisor 均 pass · 无 🔴 · 无遗留 must-fix）。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#57`（内部审计 1 轮 + 代码评审 2 轮〔轮 1：🟡1 报告项 → 修复 3 项（`recordClassOf` 单源化 / 档头引用收正 / MS-2 发射字节锁）；轮 2 = pass〕· 终态 clean）。
- **本席复核（读盘抽验 + 实跑）**：#212 = `crash-reports.mjs:141-154` `recordFacts`（类判单源 `recordClassOf` · `uptime` 有限非负校验 · native ⇒ `header.cwd`）+ `:178` 串组装（**原文案保留** + 事实段）✓；#350 = `test/memory-sweep-cli.test.mjs`（77 行 · MS-1/2/3 · **沙箱 env 钉死** ✓）+ `completions.mjs` 三套横深 ✓；#343 = `bench/lib/client.mjs:43` 注释收正 ✓。
- 读数：CLI **861/861** · core **674/674** · bench timing **3/3** ——全绿（E-3 已随批 2 修复；vsc 门受阻 = 并行批未注册档 fail-closed——非本批面，转批 2 核验跟踪）。
- 披露（认可）：行数超预计带（179 / 110 / 126——均远低 300 档）；doc-check 绝对读数漂移归并行批（相对基线 = 零新增）；`.thincoder/tmp/cli-pkg` 旧副本 = 打包临时面（非活面）。

**收口**：§1 置「已收口」· 记录冻结；台账 #212 / #340 / #343 / #350 → 待核销 → 已核销；designToken 消费（链终止）。
