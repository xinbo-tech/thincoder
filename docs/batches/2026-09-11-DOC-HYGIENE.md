# 文档 / 产品文案卫生（6 条）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-DOC-HYGIENE（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：对端面 1 处 = `AGENT-LOOP.md`（VSC 仓）C3 两句（as-of `:116`）——条目计数（对端份 / 本仓份）= 1 / 21（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 13:14 · 来源 = 用户 13:12「**批C开工**」（TODO 全量审计 id=28「该落地」清单之批 C）+ 审计报告（逐条一手实测）。

---

## §1 讨论（主 agent 记）

### 需求来源

- TODO 全量审计（id=28）「该落地」清单之 **批 C（文档 / 产品文案卫生）**；
- 用户 13:12「批C开工」= 开工。
- **范围裁定（父侧）**：原建议 7 条中 **C#145（设计档超宽 5 行折行）剔除**——该条已由第 14 批（SWEEP-FOLLOWUP）候选 2 承接，设计者 id=23 **在跑且已触三档**（AGENT-LOOP / SESSION / SUBAGENT-ID）——不重复派工。

### 本批条目（6 条——三方一致锚）

| # | 条目 | 分级 | 证据（审计一手，as-of 2026-09-11） |
|---|---|---|---|
| **C1** | **`read_image` 工具描述事实错误**——写「Pure text models (DeepSeek V4, GLM-5) will receive an error」；实测 `deepseek-flash`/`deepseek-v4-flash`/`-vision-exp` 均 `multimodal: true`（仅 `deepseek-v4-pro` 非视觉）；门为 spec 驱动 | **P2 · 小** | `src/tools/read_image.md:8`（描述=模型可见面）vs `src/model-specs.mjs:33/38/40`；门 `src/tools/file.mjs:168` |
| **C2** | **§24 旧锚 25 处**——全仓注释仍余 `§24 D-24*` 写法（章节已改 §11，旧锚=断链） | P3 · 小 | `src/agent.mjs:71-72` · `src/advisor/run.mjs:22/145` · `src/agent-tools/subagent.mjs:132` 等 25 处 |
| **C3** | **VSC 旧句与代码矛盾**——`AGENT-LOOP（VSC 仓）§7` 仍述 C' 态「busy 输入禁用」；现行 = INPUT-LOCK-BEHAVIOR-REVISED（输入不禁、只禁提交） | P3 · 小 | `thincoder-vscode/docs/design/AGENT-LOOP.md:288-295` |
| **C4** | **注释断链**——`wrapped-spawn` 指 `docs/design/TUI-STDERR-CAPTURE.md`；该档已归档 `_archive/` | P3 · 小 | `src/tui/wrapped-spawn.mjs:1` |
| **C5** | **需求档 4 项同步**——§1.12 段表「写入手段」列 / §1.11 B9 / §1.16 F1 口径 / §1.16 N2 措辞 | P3 · 小 | `docs/requirements/ENGINEERING-MODE.md`（grep「写入手段」零命中） |
| **C6** | **CLI 仓 `.thincoder/index/` 死产物**——mtime 2026-07-29、CLI 仓零读写点（活体索引 = `~/.thincoder/memory.db`）；**只限 CLI 仓**（VSC 仓该目录是活体索引——零碰） | P3 · 小 | `thincoder/.thincoder/index/`（PORTABILITY §9 已裁「另立项」） |

### 已核事实（供 designer 免重复勘察）

- C1 的修法方向（审计）：改「能力以 spec 为准」+ 去具体模型名；且描述文件 = 模型可见面（同第 6 批「达成 vision」后的漂移）。
- C2 为机械改锚（`§24 D-24x` → 对应 `§11` 现锚）；改前须核对每处对应的现行章节号（§11.3 等）。
- C3 为纯文档同步（INPUT-LOCK-BEHAVIOR-REVISED 为现行权威；VSC 档旧句 = C' 态残留）。
- C4 二选一：注释改指（`_archive/TUI-STDERR-CAPTURE.md` 带归档前缀）或去路径（写机制名）。
- C5 四项逐条回指：依据 = 第 4 批（C 工具）交付遗留 ②（父侧已核销 ①③）。
- C6 删除面 = CLI 仓 `.thincoder/index/`（**先 `git status` 核实未被跟踪**——未跟踪才删；被跟踪则停下报告）。

### 范围边界（明确不做）

- 不改任何行为/语义（除 C1 的描述文本——其 **spec 驱动**真值面零改）；不碰他链在途档；**VSC 仓 `.thincoder/index/` 零碰**；
- **不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. C1 的替句逐字（「能力以 spec 为准」形态——含是否保留 `read_image` 工具名示例）；
2. C2 的锚映射表（25 处逐处「旧锚 → 新锚」——机械但须逐处对现章）；
3. C3/C4 的替句/处置择一；
4. C5 四项逐条落点 + 与 §1.12/§1.16 现状对照；
5. C6 的删除面清单化（路径级）+ 先决检查（git 跟踪态）+ 归属（coder 执行 vs 父侧执行）；
6. 受影响文件全清单（行数/增量）+ 用例/AC（逐条回指 C1–C6——多为静态判据）。

### 状态

**已收口 2026-09-11**（用户「批C开工」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求 + 设计 + 测试三层已落档（设计 §2.29 / AC68–AC74 / T84–T91），待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；逐字替句 / 映射表 / 用例 / AC 判据在设计档各节，本段只做任务书 + 口径锚）。

**落档位置**：需求 = `docs/requirements/ENGINEERING-MODE.md` §1.15 批块（C1–C6 逐条「无新需求」）+ C5 五点位及 §1.12 附注（**已落**）· 设计+测试 = `docs/design/ENGINEERING-MODE.md` §2.29 + §3.1 AC68–AC74 + §3.2 T84–T91（**已落**）· VSC 面 = `AGENT-LOOP（VSC 仓）§7` 两句修订（**已落**）· 台账 = `docs/TODO.md` 6 条 status 推进（**已落**）· 需求来源 = 本档 §1。

### 一、六条裁定（实施者据此执行，勿再选型）

| # | 条目 | 裁定 | 落点（设计档） | 执行 |
|---|---|---|---|---|
| C1 | `read_image` 描述事实错误 | **去具体模型名 + 能力以 spec 为准**——逐字替句整行替换 | §2.29.2 | eng-coder |
| C2 | `§24` 旧锚残留 | **`§11.x` 粒度逐行替换**（28 行 / 29 处 token / 18 文件——映射表逐行；基准域三域 A/B/C） | §2.29.3 | eng-coder |
| C3 | VSC 旧句与实现矛盾 | **两句修订（已由设计者落笔）**——coder 零接触 | §2.29.4 | eng-designer（**已落**） |
| C4 | 注释断链 | **去归档路径**（机制名保留——同族先例 `src/crash-reports.mjs:35`） | §2.29.5 | eng-coder |
| C5 | 需求档 5 点位同步 | **5 点位 + §1.12 附注 1 处（已由设计者落笔）**——coder 零接触 | §2.29.6 | eng-designer（**已落**） |
| C6 | 死产物 | **删除 `thincoder/.thincoder/index/` 整目录**（先决检查 fail-closed） | §2.29.7 | eng-coder |

### 二、目标与背景（为什么）

审计 id=28「该落地」批 C 六条同族缺陷（判据统一 = **文档/文案与现状一致**）：① 工具描述（模型可见面）写错事实——deepseek 放行 vision 后描述仍点名「纯文本模型」；② AGENT-LOOP 重排后 `§24` 旧锚成断链（注释/描述面）；③ VSC 机制正文仍述已被修订的 C' 态（输入禁用/readOnly）——与实现相反；④ 注释指已归档档（真断链）；⑤ 需求档 5 点位未同步（第 4 批 C 遗留 ②）；⑥ CLI 仓 DB 化前死产物目录（4.5 MB）滞留。不修后果：模型被描述误导、读者跟断链、文档与实现相反、遗留件永久滞留。

### 三、已知事实（免重复勘察——直接读）

- **C1**：`src/tools/read_image.md`（9 行）第 8 行 = 待替换句；门 = `src/tools/file.mjs:168`（`specForModel(model).multimodal`——本批零改）；spec 行 `src/model-specs.mjs:33/38/40`（`multimodal: true`）+ `:36`（`deepseek-v4-pro` 无该字段）；测试面 `test/read-image-guide.test.mjs`（行为断言——描述文本无既有断言）。
- **C2**：逐行枚举 = 设计 §2.29.3 表（28 行 / 29 处 / 18 文件；行号 as-of——他链在飞会漂，**动手前重扫**）；同形已更新先例 = `src/config.mjs:77`；`src/prompts/**` 零命中；`test/**` 唯一 `§24` = 变更注（`advisor-description.test.mjs:18`——**不判**）。
- **C4**：`src/tui/wrapped-spawn.mjs`（39 行）第 1 行；diff 应只此 1 行。
- **C6**：`.gitignore:18` 命中（未跟踪）；`git ls-files .thincoder/` 无 `index/` 条目；`src/`+`bin/` 零引用（实测 0 命中）；目录内容 = `manifest.json`（117,135 B）+ `vectors.bin`（4,395,208 B）。VSC 仓同名目录 = 活体索引（**零碰**）。
- **C3/C5**：已落（coder 零接触）；本批文档域改动全部完成。

### 四、覆盖需求（三方一致——批次 §2 = 设计 AC 回指 = 需求档条目）

| 需求条目 | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| C1（需求档 §1.15 批块） | 描述面同步（逐字替句） | §2.29.2 | AC68（T84） |
| C2（同上） | `§24`→`§11.x` 逐行替换 | §2.29.3 | AC69（T85/T86） |
| C3（同上） | VSC 机制正文两句（已落） | §2.29.4 | AC70（T87） |
| C4（同上） | 注释去归档路径 | §2.29.5 | AC71（T88） |
| C5（同上） | 需求档 5 点位 + 附注（已落） | §2.29.6 | AC72（T89） |
| C6（同上） | 死产物删除 | §2.29.7 | AC73（T90） |
| 批级 | 机检零新增 + 快层 | §2.29.8 | AC74（T91） |

### 五、明确出批（不做——勿扩面）

- VSC 仓 `src/**` `§24` 残留（实测 39 处 / 13 文件——本批 CLI 单端）；`wrapped-spawn` 同族「约 12 处 `docs/design/` 前缀注释扫尾」；
- `subagent.mjs` 同描述其他旧编号锚（`§15/§18` 串 / `§19.x` / `§20`——建议另立勘察重锚）；`read_image.md:7` 的 API 列表（不在 C1 实证面）；
- 第 6 批遗留「deepseek-v4-pro 视觉复检」（TODO:145——触发 2026-09-14 后）；
- `src/prompts/**` 零碰；不建新档；不碰他链在途档（D5）。

### 六、受影响文件（实施域 = 3 改 + 1 删除面；行数 as-of 实测）

| # | 文件 | 现行行数 | 预计增量 | 改动 | 执行 |
|---|---|---|---|---|---|
| 1 | `src/tools/read_image.md` | 9 | 0（整行替换） | C1 替句 | eng-coder |
| 2 | `src/**`（C2——18 文件；逐档行数表见设计 §2.29.8） | 68–490 | 0（逐处替换） | `§24`→`§11.x`（28 行） | eng-coder |
| 3 | `src/tui/wrapped-spawn.mjs` | 39 | 0（串删除） | C4 去路径 | eng-coder |
| 4 | `thincoder/.thincoder/index/`（目录） | 2 文件（4.5 MB） | 删除 | C6 | eng-coder |

**文档域（设计者已落——coder 零碰）**：`docs/requirements/ENGINEERING-MODE.md`（≤+24）· `docs/design/ENGINEERING-MODE.md`（≤+240）· `AGENT-LOOP.md`（VSC 仓，≤+8）· `docs/TODO.md`（±6）。

### 七、验收标准（逐条见设计 §3.1——每条可机器验证）

跑法（coder 必须实跑并在报告中给命令 + 结果）：
- **grep**：`src/**` `§24` 零命中（AC69）；`read_image.md` 含「capability is spec-driven」且「Pure text models / Kimi K3 / DeepSeek V4」零命中（AC68）；`wrapped-spawn.mjs` 含「TUI-STDERR-CAPTURE F-1/F-3」且「docs/design/TUI-STDERR-CAPTURE.md」零命中（AC71）；
- **diff**：`src/tools/file.mjs` 空（AC68）；`wrapped-spawn.mjs` 仅 1 行（AC71）；
- **目录**：`thincoder/.thincoder/index/` 不存在 + VSC 仓同名目录未触碰（AC73）；
- **机检**：`node scripts/check-doc-width.mjs`（本批文件新增 0）+ `node test/run-fast.mjs` 全绿（AC74）。

### 八、交付报告格式（回报必含）

① 逐条透明表（C1/C2/C4/C6 → 文件:行证据）；② **C2 逐行核对**（28 行 / 29 处 旧→新计数 + 实扫结果——键控 = 文件 + 新锚串）；③ **C6 先决检查实跑输出**（`git ls-files` / `.gitignore` 命中 / 零引用三证）+ 删除结果；④ 测试实测（命令 + 结果）；⑤ 偏差披露（零静默）；⑥ §5 写入自证。

### 九、边界与纪律

- **D5 冻结窗口**：本 §2 与三层档在评审在途期间零写入；实现中发现设计缺陷 → 停下报告（回设计者/父侧），不静默偏离。
- **D1 写权**：coder 写 `src/**` + C6 删除面；文档域零碰（发现文档需改 → 回报）。
- 凭证不落档；不 commit（改动留工作区未提交）。
- **C2 替换纪律**：逐处替换（禁批量 sed/脚本一把梭——防错锚）；`subagent.mjs:132` 描述串内替换 = 零语义（锚文本）。

### 十、需父侧排程项（本轮未做——如实列出）

- 批次档 §3/§4/§6（评审 / 批准 / 收口）；`CHANGELOG.md` 记账；需求档 header 批次行（父侧同步点——第 14 批同例）；
- 他链 V1 新增项（PORTABILITY 批次档的自指 §9 · TUI-SELECTION 批次档的自指 §12.4）与宽度超宽余项——均非本批文件，归其链修；
- 同族观察落地（VSC `src/**` `§24` 39 处；`subagent.mjs` 全描述重锚）——是否立项由父侧裁。

### 十一、小结性修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 **pass**（🔴 0 · 🟡 0 · 🔵 4——发现表见 §3）。父侧裁定：小结性修正轮落 4 条 🔵——**只改文档、零实现面**；六条裁定（C1–C6）/ AC 编号 / coder 执行动作零变（AC68 判据强化为「逐字全等」——执行动作仍是整行替换）。上文「状态：任务书就绪——待设计评审」已推进：**评审 pass + 修正轮已落**；下一步 = §4 批准（主 agent）。

**发现 → 落点映射（4/4 已落——行内标记「修正轮 #N」可核）**：

| 发现 | 级别 | 落点（设计档） |
|---|---|---|
| #1 行数基准（批前 vs 现读混列） | 🔵 | §2.29.8 标题/列头改「批前基准」+ 表前口径注（收口核数按批前/批后差）——修正轮 #1 |
| #2 计数口径（6 与括注 5 不齐） | 🔵 | §2.29.8 `docs/TODO.md` 行——六行键控拉全（C1–C6；原括注缺 C5——第 6 行 = C5 对应行 `docs/TODO.md:148`）——修正轮 #2 |
| #3 行号指针（`:308` 落空） | 🔵 | §2.29.4——「中止语义（F-6）行」等内容键控 + 全节 as-of 口径（`:308` → as-of `:314-315`；模块地图 `:69`/`:70` → as-of `:72`/`:73`）——修正轮 #3 |
| #4 AC68 零命中真子集 | 🔵 | §3.1 AC68 + §3.2 T84——改「与 §2.29.2 定稿替句逐字全等」断言——修正轮 #4 |

**同口径说明**：本节「六、受影响文件」表列「现行行数」同义 = **批前基准**（设计档 §2.29.8 改后口径；本表不逐次回写）。

**边界**：本轮零实现面——coder 任务按上文本体执行（token 门不变）；文档域修正全集 = 设计档 §2.29.8 / §2.29.4 / AC68 / T84 + 变更记录一行（本档另加本修正块）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

评审对象 = 批次档 §2 · 设计档 §2.29 全节 + AC68–AC74 + T84–T91 + 变更记录 · 需求档 §1.11 B9 / §1.12 / §1.15 批块 / §1.16 F1·N2 / §1.17 N3 · `AGENT-LOOP（VSC 仓）§7` 两句 + 档头注（轮次 1；只读节段域）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 受影响文件表 | 🔵 | §2.29.8 已落文档行的「现行行数」实为批前基准、与磁盘不符（设计档 1986 vs 实读 2199；需求档 786 vs 798；VSC 档 521 vs 524）——各行增量均在声明上限内（≤+240 / ≤+24 / ≤+8） | 「现行行数」改标「批前基准（as-of）」或刷新为实测值——两义混列易在收口核数时误判 |
| 2 | 计数口径 | 🔵 | §2.29.8 `docs/TODO.md` 行「6 条 status 推进（C1/C2/C3/C4/C6 对应行）」——计数 6 与括注列举 5 项不齐（TODO.md 不在本轮评审域，未能核） | 键控到具体 TODO 行（或说明第 6 行归属）——D3 计数与列表同改 |
| 3 | 行号指针 | 🔵 | §2.29.4 边界行引「`:308`（中止语义行的 C' 标签）」——实读 VSC 档该 C' 标签在 :309–310；同节内另有 `:290`/`:322` 与 `:291–294`/`:324–327` 两套口径 | 行号统一标 as-of 或改内容键控（如「中止语义（F-6」行）——防读者按指针落空 |
| 4 | 验收标准 | 🔵 | AC68 零命中名单（Pure text models / Kimi K3 / DeepSeek V4 / GLM-5.3-Flash）是两名单（另含 Qwen3.8 / MiniMax M3 / GLM-5）的真子集——整行替换下残余风险低 | 补全零命中集，或加一条「:8 与定稿替句逐字全等」断言（机判更硬） |

**重点核 ①–⑥ 结论**：① C1 名单纯已去、svg 例外保留、无新工具名示例、`file.mjs` 零改——与 spec 驱动真值面一致；② C2 映射 29 处 = 域 A 9 / 域 B 19 / 域 C 1（28 行 / 18 文件计数自洽），键控 = 文件 + 旧锚串，`D-24x` 标签保留——逐行可执行；③ C6 先决三证（`git ls-files` 零条目 / `.gitignore:18` 命中 / src+bin 零引用）+ fail-closed「任一不成立停下报告」+ AC73 两仓对照——闭合；④ AC68–AC74 与 C1–C6 逐条回指、T84–T91 全映射、判据均可机判；⑤ 批次 §2 ↔ 设计 §2.29 ↔ 需求 §1.15 批块/§1.12 附注逐条一致（C5 五点位 + 附注 1 处实测在位），落档面（需求+设计+VSC+TODO）披露齐；⑥ 无 🔴。

**计数**：🔴 0 · 🟡 0 · 🔵 4。
VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 20:25 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 **pass**（🔴0 · 🟡0 · 🔵4）→ 修正轮 4/4 落修经父侧核验（行数基准口径 / 计数键控拉全 C1–C6 / 内容键控+as-of 实读 / AC68 逐字全等断言）→ **token 已签发**（值不落档）。

**批准范围**：实施域 = 3 改 + 1 删除面（`src/tools/read_image.md` C1 替句 · `src/**` 18 文件 C2 逐处替换（28 行——逐档表见设计 §2.29.8）· `src/tui/wrapped-spawn.mjs` C4 去路径 · `.thincoder/index/` 删除面 C6——三证齐后 fail-closed 执行）。

**遗留（批准时登记）**：① 批次档 §3 :175 超宽行（评审段属主处置）；② commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**交付摘要**：第 22 批实施域全量落地——**20 文件**（C1 ×1 + C2 ×18 + C4 ×1）+ **1 目录删除面**（C6）；无新增文件、未 commit（改动留工作区）。
改动集与任务书 §2「受影响文件」逐项全等，无表外文件。红线零触碰：VSC 仓零改 · `src/prompts/**` 零改 · CLI `docs/**` 本批零改 · 他链在途档零碰 · 未发起评审。
本会话内闭环 = 实现 → 独立分歧审计（explore，1 轮 **clean**）→ 内部代码评审（advisor，1 轮 **pass**——🔴0 · 🟡2 报告型 · 🔵3）→ 收敛交付（终态 **clean**）。

**① 逐条透明表**

| 条目 | 落点 | 证据（本会话实测） | 判据 |
|---|---|---|---|
| C1 | `src/tools/read_image.md:8` | 整行替句与设计 §2.29.2 定稿替句**逐字全等**（比对时去设计档行内代码反引号包裹）；两名单纯 6 名 +「Pure text models」全清 | AC68/T84 |
| C2 | `src/**` 18 文件 | 28 行 / 29 处 token 全落位（域 A 9 · 域 B 19 · 域 C 1）；`src/**` `§24` 零命中；`D-24x` 标签逐处保留 | AC69/T85/T86 |
| C4 | `src/tui/wrapped-spawn.mjs:1` | 去 `（docs/design/TUI-STDERR-CAPTURE.md）`；机制名「TUI-STDERR-CAPTURE F-1/F-3」在位；归档路径串全仓零命中；该档 diff 仅 1 行 | AC71/T88 |
| C6 | `.thincoder/index/` | 三证齐后整目录删除（manifest.json 117,135 B + vectors.bin 4,395,208 B）；目录已不存在；其余条目零碰（advisor.md · checklist.md · memory/ · skills/ · tmp/——范围不扩） | AC73/T90 |

**② C2 逐处对表（键控 = 文件 + 新锚串；行号 as-of 实测）**

- `src/advisor/messages.mjs:42` → §11.2；`src/advisor/run.mjs:22,145` → §11.2；`src/advisor.mjs:270` → §11.2
- `src/agent/completion.mjs:123` → §11.2；`src/agent/dispatch.mjs:390` → §11.2；`src/agent/record-results.mjs:103` → §11.2；`src/agent/run-stages.mjs:166` → §11.2
- `src/agent-tools/eng.mjs:37,55` → §11.2；`src/agent-tools/escalate-async.mjs:155` → §11.1；`src/agent-tools/subagent-actions.mjs:116` → §11.2
- `src/agent-tools/subagent-run.mjs:39,55,83` → §11.1；`src/agent-tools/subagent-scheduler.mjs:341,346` → §11.1
- `src/agent-tools/subagent.mjs:132`（双 token：`§15/§18/§11.1` + `per role domain（…§11.1）`）`,390` → §11.1
- `src/agent.mjs:72,73` → §11.2；`src/tui/cmd-eng.mjs:35` → §11.2；`src/tui/mouse.mjs:202` → §11.2；`src/tui/subagent-panel.mjs:59` → §11.2
- `src/tui/suspension-drive.mjs:25` → §11.3；`:30,77,133` → §11.2
- 计数：**28 行 / 29 处 / 18 文件**（域 A 9 · 域 B 19 · 域 C 1）；`src/**` `§24` 零命中（git grep 实测）；
  `test/**` 唯一命中 = `advisor-description.test.mjs:18` 变更注（T86 明示不判）；`docs/**` 记史面照留。

**③ C6 先决检查（fail-closed 三证——实跑输出）+ 删除结果**

- 证一（未跟踪）：`git ls-files .thincoder/index` → **零条目**（空输出，exit 0）。
- 证二（忽略命中）：`.gitignore:18` = `.thincoder/index/` 命中。
- 证三（零引用）：`src/` + `bin/` grep `thincoder/index|vectors\.bin|manifest\.json` → 双向零命中；全仓 `\.thincoder` 扫描——命中均为 `~/.thincoder/*`（config/logs/sessions 等）或资产面（advisor.md / skills / rules / memory / checklist / conventions），**无 `index` 面**。
- 再生面：CLI 活体索引 = DB（`~/.thincoder/memory.db`）——`/reindex` 重建三表（`src/tui/cmd-reindex.mjs`）；该目录非运行时输入。
- 删除：`rmdir /s /q .thincoder\index` → 复核 **GONE**；VSC 仓对照 = 该仓 `.thincoder/` 实测**无 `index/`**（披露于 ⑤ 第 1 条）。

**④ 测试实测（命令 + 结果；长测试先落盘再查）**

| 命令 | 批前（基线） | 批后 | 批前/批后差 |
|---|---|---|---|
| `node scripts/check-doc-width.mjs` | 8 文件 / 10 行超宽；一致性新增 4 条 | 9 文件 / 11 行超宽；一致性新增 4 条（同集合） | 本批文件 **0**；差额 2 处 = 他链在飞档（STOP-HOOK 新超宽行 + NORMAL-MODE-AUDIT 行号漂移） |
| `node test/run-fast.mjs` | tests 471 · pass 458 · fail 1 · skipped 12 | tests 471 · pass 458 · fail 1 · skipped 12 | **0**（T41 同一失败——他链档 4 条新增一致性违规所致） |

- 本批改动域 = `src/**` + 删除面——**不在**宽度/一致性扫描域（`docs/{design,requirements,batches}`）内 → 结构性不可能新增该类命中；
- T41 失败面 = 他链在飞档（PORTABILITY 自指 §9 ×2 · TUI-SELECTION 自指 §12.4 ×1 · TUI-SELECTION 计数 ×1——设计 AC74 归属注同体例）；
- 两次运行均 `> 日志文件 2>&1` 落盘后从日志读（防管道截断）；自建临时日志 4 个读毕已删（工作区零污染）。

**⑤ 偏差披露（零静默）**

1. **AC73 ② 前提与磁盘不符**：`thincoder-vscode/.thincoder/` 实测无 `index/` 目录（磁盘真值）——AC73（T90、批次档 §2 C6 行）「存在且零触碰（对照）」的「存在」不成立；「零触碰」成立（本批零改 VSC 仓）。fail-closed 记录为文档层收口项（不代改设计档）；C6 删除面（CLI 侧）不受影响、已达成。
2. **快层 T41 批前既有**：批前/批后同集合（471/458/1/12）——源自他链在飞档 4 条新增一致性违规；按 AC74 归属注体例归他链修（D5 零碰），本批不引入、不代修。
3. **映射表行号漂移 2 处**：设计表 as-of `advisor/messages.mjs:133` → 实测 `:42`；`agent.mjs:71/72` → `:72/73`——按设计声明「实现时以 grep 重扫为准」以「文件 + 旧锚串」键控落位，计数守恒（28/29/18）。
4. **首轮 10 行 whitespace-variant 误匹配**（替换工具容错匹配扰动前导空白；含 `eng.mjs:37/55` 缩进）：同轮逐行回正——28 行前导空白对照 HEAD **零差异**（`git diff` 面复核）；其余字面逐字未动。
5. **宽度差额 2 处**（批前/批后窗口内他链档变动：STOP-HOOK 新超宽行 · NORMAL-MODE-AUDIT 行号漂移）——非本批文件，不计入本批。
6. **只读审计限制**：explore 审计无 exec/git——diff 形判据（`file.mjs` 零 diff · `wrapped-spawn` 仅 1 行 · C6 git 面）由本会话实测承载（`git diff` / `git ls-files` 直跑）。
7. 本批 §5 行宽自检：无 >300 字符行；临时日志 4 个已删。

**⑥ §5 写入自证**：本段经 `batch_segment` 工具写入（身份 = eng-coder → §5 段；无 path 参数）；写入若拒/失败会在交付报告明说「§5 未写入」——本段落档即成功自证。

**⑦ 内部评审处置（1 轮 pass）**：0🔴；2🟡（AC73 前提 · AC74 快层「全绿」字面）均为报告型——归文档层/父侧收口，实现面零动作；3🔵（agent.mjs 行数漂移 401→412 · diff 形判据只读不可复核 · >300 五档存量）同为零动作面。

## §6 验证与收口（父代理自写）

**2026-09-11 22:40 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- **C1**：`read_image.md:8` 替句在位（两名单纯 + 「Pure text models」零命中 ✓）；**C2**：`src/` 内 `§24` 零命中 ✓（18 文件/28 行/29 处全落）；**C4** 去路径 ✓；**C6** `.thincoder/index/` **三证齐后已删（GONE）✓**；
- `run-fast` 批前=批后同集合 **471/458/1/12**（T41 他链）；19 档 `node --check` 零 fail；新增超宽 0。

### 逐条验收结论

- C1–C6 全过；**Simplified 零 · Not done 零**；偏差 6 条如实披露（含自建日志已清）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：28 行/29 处/18 文件对表 ✓ · 指针：设计 §2.29.8 ↔ 批次 §2 ↔ 用例 ✓ · 待办：删除面临时目录已清 ✓

### 遗留项

1. **两条 Deferred 归文档层**（父侧）：① AC73 ② VSC 侧「存在」前提与磁盘不符（VSC 仓无 `index/`——零触碰成立，前提句需修）；② AC74 「全绿」字面 ↔ T41 存量红——收口裁定已给出（批前既有、他链归因、不代修）；
2. 批次档 §3 :175 超宽行（评审段属主）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
