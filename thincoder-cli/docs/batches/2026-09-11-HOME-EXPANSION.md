# `~` 家目录展开（config 路径字段单一规范化点）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「都可以」（Gitee #IKETT1——评估 id=48）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 本批条目（1 条）

| # | 条目 | 内容 |
|---|---|---|
| **C1** | **`~` 不展开——静默创建字面量 `~` 目录** | 成立。无任何展开逻辑（全仓 grep 零命中）；`config.mjs:282` 合并用户配置不做路径规范化；消费端 `mkdirSync(dirname(dbPath),{recursive:true})`（`src/memory/schema.mjs:54-56`）在 cwd 建字面 `~/` 目录、静默无警告。**同病 4 字段**：`memory.dbPath`（README **:138** 示例即触发）· `memory.team.dir`（`src/cli/make-agent.mjs:148-152`）· `memory.projectDir`（`make-agent.mjs:44`）· `shell`（`config.mjs:95` spawn 路径）。 |

### 已核事实（免重复）
- 无展开逻辑（grep `startsWith("~`）= 0）；默认值本身全路径（`config.mjs:91`）；消费端清单：`bin/thincoder.mjs:221/243/266`、`src/cli/make-agent.mjs:25`、`src/cli/distill-command.mjs:49`、`src/acp.mjs:424`。
- README 引用已重定位：**现 :138**（issue 引 :37 已过期）；另见 `docs/design/_archive/ARCHITECTURE-v2.md:49`（archive——不动）。

### 待设计裁定
1. 展开点选型（**≥2 候选**：`loadConfig` 读出后统一规范化 vs 各消费点展开——判据 = 单一权威/零漏点）+ helper 形态（`expandHome` 归属模块）；
2. 支持形态裁定（建议仅 `~`/`~/`/`~\`；`~user` 不做——理由）+ Windows 分隔符；
3. 4 字段逐一落法 + README 修正 + 用例/AC（含「cwd 下不再生成字面量 `~` 目录」机验判据）；
4. **VSC 镜像勘察**（VSC 共享 config——同病否；若同病 → 报告列镜像面，父侧排程）；
5. 既有测试锁零伤 + 与 §1.13 纪律核对。

### 范围边界（明确不做）
- 不做路径规范化以外的事（不改默认值、不动 archive 档）；不碰他链在途档；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求 + 设计 + 测试三层已落档（需求 §5 / 设计 §9 / AC-H1–AC-H9 + T-H1–T-H16），待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字 / 点位表 / 用例 / AC 判据全文在设计档 §9.3 / §9.6 / §9.7，本段只做任务书 + 口径锚）。

**落档位置**：需求 = `docs/requirements/MEMORY.md` §5（F10–F14 / N7–N9——**已落**）· 设计+测试 = `docs/design/MEMORY.md` §9 + AC-H1–AC-H9 + T-H1–T-H16（**已落**）· 需求来源 = 本档 §1；台账 = `docs/TODO.md` 需求池条目（**未落**——记录归属主 agent，见「十、需父侧排程项」）。

### 一、裁定表（实施者据此执行，勿再选型）

| # | 条目 | 裁定 | 落点（设计档） | 执行 |
|---|---|---|---|---|
| C1a | 展开点 | **`loadConfig()` 合并后统一展开（单一规范化点）**——消费点零散展开禁止 | §9.3(b) | eng-coder |
| C1b | 展开器 | **新模块 `src/expand-home.mjs`**：`expandHome(p, home = homedir())`（纯函数、home 可注入） | §9.3(a) | eng-coder |
| C1c | 形态面 | **`~` / `~/` / `~\\`（余段 `\\`→`/` 归一）；`~user` / 串中 `~` / 非字符串 → 原样** | §9.3(a) | eng-coder |
| C1d | 四字段落法 | dbPath / team.dir / shell = loadConfig 展开即毕；**projectDir 另加消费侧七点位基准解析**：`join(cwd, p)` → `isAbsolute(p) ? p : join(cwd, p)` | §9.3(b)(c) | eng-coder |
| C1e | README | 展开说明句 + 三字段注释（dbPath / projectDir / shell） | §9.4 行 9 | eng-coder |
| C1f | 运行时写面当次展开 | **不做**（登记项——§9.1 ①） | §9.8 | — |

### 二、目标与背景（为什么）

用户照抄 README 配置示例（`README.md:138` 的 `~/.thincoder/memory.db`）即触发：`~` 无展开 → `createMemory` 在 **cwd**
建字面量 `~` 目录树并开新库（存量记忆"消失"、cwd 被污染），全程静默。同病四字段 = `memory.dbPath` / `memory.projectDir` /
`memory.team.dir` / `shell`。不修后果：README 示例持续是陷阱、用户数据静默分裂、`shell` 填 `~` 者 spawn 失败。

### 三、已知事实（免重复勘察——直接读）

- 病灶链与四字段证据 = 设计 §9.1（file:line 逐条）；本批无需再勘察。
- 七点位行号 as-of 2026-09-11（**动手前重扫**——他链在飞行号会漂）：`src/cli/make-agent.mjs:44` ·
  `src/cli/memory-command.mjs:70` · `src/memory/docs.mjs:240` · `src/cli/distill-command.mjs:67` · `bin/thincoder.mjs:227/272/326`。
- 测试缝与同款：`test/config-merge.test.mjs`（`_setConfigPathForTest` + tmp config）；伪 HOME 子进程 = `test/tui-stderr-capture.test.mjs:59`
  （`USERPROFILE` / `HOME` 覆盖 + 另置 cwd）；memory 工具夹具式 = `test/memory-tool.test.mjs:26`。
- 既有锁零伤清单 = 设计 §9.10（既有夹具无 `~` 值——零伤）。
- 零改面：`DEFAULTS` 四字段默认值（`src/config.mjs:91-95`）· `teamConfig()` 缺省（`src/cli/make-agent.mjs:152`）· `dbPath` / `team.dir` / `shell` 消费端。

### 四、覆盖需求（三方一致——批次 §2 = 设计 AC 回指 = 需求档条目）

| 需求条目（需求档 §5） | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| F10 单一规范化点 | loadConfig 四字段归一 | §9.3(b) | AC-H1（T-H7 / T-H16） |
| F11 支持形态 | `~` / `~/` / `~\\`；`~user` 不做 | §9.3(a) | AC-H2（T-H1–T-H6） |
| F12 projectDir 消费语义 | 七点位基准解析 | §9.3(c) | AC-H3（T-H11 / T-H12） |
| F13 无字面量 `~` 目录 | 端到端机验 | §9.6 T-H14 | AC-H4 |
| F14 README 对齐 | 说明句 + 三字段注释 | §9.4 行 9 | AC-H5（T-H15） |
| N7 零回归 | 相对形态逐字 + 既有零伤 | §9.10 | AC-H6 |
| N8 零依赖 / 可测 | 纯函数 + home 注入 | §9.3(a) | AC-H7 |
| N9 磁盘原文 | 只读归一（零写回） | §9.3(b) | AC-H8（T-H10） |
| 批级 | 机检 + 语法 | §9.7 | AC-H9 |

### 五、明确出批（不做——勿扩面）

- 运行时写面当次展开（TUI `/shell` 热应用 / settings set / VSC 面板）· ACP 硬编码分叉（`src/acp.mjs:424`）· 历史受害数据搬移——设计 §9.1 三条登记；
- 其它字段路径处理 · `~user` / 环境变量 / 通配 / 转义 · 路径存在性校验（形状层止步）；
- VSC 仓镜像（仅 `shell` 字段同病——父侧排程，本批单端）；
- 不改 `DEFAULTS`；不动 `_archive/` 旧档；不建新档；不碰他链在途档（D5）。

### 六、受影响文件（实施域；行数 = 批前基准 as-of 2026-09-11 实测）

| # | 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|---|
| 1 | `src/expand-home.mjs`（新） | — | ~+30 | 展开器（§9.3a） |
| 2 | `src/config.mjs` | 487 | ≤+10 | import + 四字段归一（§9.3b） |
| 3 | `src/cli/make-agent.mjs` | 163 | ≤+2 | :44 基准解析 + import 增补 |
| 4 | `src/cli/memory-command.mjs` | 86 | ≤+2 | :70 同式 |
| 5 | `src/memory/docs.mjs` | 418 | ≤+2 | :240 同式 |
| 6 | `src/cli/distill-command.mjs` | 92 | ≤+2 | :67 同式 |
| 7 | `bin/thincoder.mjs` | 406 | ≤+3 | :227 / :272 / :326 同式 |
| 8 | `test/home-expansion.test.mjs`（新） | — | ~+110 | T-H1–T-H16（快层 + 1 条 slow） |
| 9 | `README.md` | 472 | ≤+4 | 说明句 + 三字段注释 |

**文档域（设计者已落——coder 零碰）**：`docs/requirements/MEMORY.md` §5（全文 73 → 113 行）· `docs/design/MEMORY.md` §9（全文 239 → 467 行；修正轮落笔实测）。

### 七、验收标准（逐条见设计 §9.7——每条可机器验证）

跑法（coder 必须实跑并在报告中给命令 + 结果）：

- **单测**：`node --test test/home-expansion.test.mjs`（单档）· `npm test`（快层全量）· `npm run test:full`（含 T-H14 slow）；
- **grep**：`grep -rn 'startsWith("~")' src bin` == 1 命中（`src/expand-home.mjs`）——AC-H1；
- **静态**：`node --check` 全部改动 `.mjs`；`node scripts/check-doc-width.mjs`（本批文件新增 0）——AC-H9；
- **磁盘 / 目录**：T-H10（字节相等）· T-H14（`HOME/data/memory.db` 存在 ∧ `<cwd>/~` 不存在）——AC-H4 / AC-H8。

### 八、交付报告格式（回报必含）

① 逐条透明表（C1a–C1e → 文件:行证据）；② 七点位逐点 diff 自证（`join(cwd, p)` → 三分支式，逐点列出）；
③ 测试实测（命令 + 结果：新档 / 快层 / 全量）；④ 机检输出（doc-width + grep 计数）；⑤ 偏差披露（零静默）；⑥ §5 写入自证。

### 九、边界与纪律

- **D5 冻结窗口**：本 §2 与三层档在评审在途期间零写入；实现中发现设计缺陷 → 停下报告（回设计者 / 父侧），不静默偏离；
- **D1 写权**：coder 写 `src/**` + `test/home-expansion.test.mjs` + `README.md`（本批唯一仓根文档面——**若与写权惯例冲突，停下回报父侧裁定**）；设计/需求档零碰（发现需改 → 回报）；
- 凭证不落档；不 commit（改动留工作区未提交）；
- 逐点替换（禁批量脚本一把梭——防错点）；`expandHome` 第二参（home 注入）仅测试用——生产调用不带第二参。

### 十、需父侧排程项（本席未做——如实列出）

- **需求池登记**（§1.13——记录归属 = 主 agent，本席未写入）：拟录条目
  `- [ ] **config 路径字段 ~ 家目录展开（单一规范化点）**（用户 13:36「都可以」——Gitee #IKETT1）→ 需求 docs/requirements/MEMORY.md §5 · 任务书 batches/2026-09-11-HOME-EXPANSION.md §2 · status=在途（第 29 批）`；
- **VSC 镜像面**（仅 `shell` 字段同病：`thincoder-vscode/src/agent/setup.mjs:232` → `src/tools/shell.mjs:233/242`）= 另批排程（VSC 仓 + 其设计档）；
- **运行时写面当次展开缺口**（§9.1 登记 ①）——是否立项由父侧裁；
- **历史受害数据**：是否随发布说明提示用户手工迁移（本批不做迁移）；
- 批次档 §3 / §4 / §6（评审 / 批准 / 收口）· `CHANGELOG.md` 记账。

### 修正轮留痕（2026-09-11——设计评审轮次 1 后 6 条；本节作者补录；本追加与上文本冲突时以本追加为准）

> 评审轮次 1 = **pass**（🔴0 / 🟡2 / 🔵4——发现表见 §3）。按 §3 表逐条处置（docs FIRST，同一设计链内；**只改文档、零实现面、零新语义**）。设计侧对应改动见 `docs/design/MEMORY.md` 变更记录（:465 同日条目）；需求侧 = `docs/requirements/MEMORY.md` §5。行号 = 落笔时 as-of。

**§2 行级修订**

| 行 | 改前 | 改后 |
|---|---|---|
| :104 | `需求 73 → 114 行 / 设计 239 → 448 行` | `需求 73 → 113 行 / 设计 239 → 467 行`（全文实测；评审实测时点 = 113 / 455） |

**发现 → 落点映射（6/6 逐条）**

| # | 级别 | 发现（§3 轮次 1） | 落点（file:line as-of 本次落笔） |
|---|---|---|---|
| 1 | 🟡 | N7 口径与 D-H4 / §9.3(c) 冲突（非 `~` 绝对 projectDir 会变） | `docs/requirements/MEMORY.md:100`（N7 括号收窄「默认值 / 相对」）+ `:111`（判定句注明：非 `~` 绝对 projectDir 为有意 delta，其余字段非 `~` 绝对形态仍逐字） |
| 2 | 🟡 | AC-H5 / T-H15 无字面 oracle | `docs/design/MEMORY.md:367-376`（§9.4 字面定稿块——L1–L4 逐字 + 示例值 oracle）+ `:363`（行 9 引用）+ `:410`（T-H15 断言）+ `:420`（AC-H5 判据） |
| 3 | 🔵 | §9.2 内联否决行理由不区分两案 | `docs/design/MEMORY.md:282`（改述——区分点 = 纯函数单测面 / 模块边界 / 拆分口径，非行数）+ `:383`（D-H2 同步） |
| 4 | 🔵 | D-H3「可见失败」口径（dbPath / team.dir 不成立） | `docs/design/MEMORY.md:384`（口径限定 shell 面 + dbPath / projectDir / team.dir 登记残余静默面）+ `:430`（§9.8 同步登记） |
| 5 | 🔵 | 数字漂移（113 / 455 / +216） | 本档 `:104` 刷新（113 / 467）+ `docs/design/MEMORY.md:365`（实测 +228——修正轮落笔值，评审时点 +216） |
| 6 | 🔵 | 重点核抽验（备查） | 无需动作（§3 表已注「记录备查」——留档） |

**处置备注**：#6 为评审核抽验记录（无落地动作）；其余 5 条全落（见上表）。零实现面——`src/**` / `test/**` / `README.md` 零碰；不发起评审（发起权 = 父侧 / 用户）。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | 口径冲突：需求 N7（docs/requirements/MEMORY.md:100「不含 `~` 的既有形态（默认值 / 绝对 / 相对）行为逐字不变」）vs 设计 D-H4（docs/design/MEMORY.md:374）/§9.3(c)（docs/design/MEMORY.md:333-336）：非 `~` 的绝对 projectDir 行为会变（`join(cwd,p)` → `p` 原样）；F12 边界（docs/requirements/MEMORY.md:92）仅承诺相对侧逐字——属文档口径冲突（非机制双述），不阻断 | 父侧文档层收窄 N7「绝对」口径，或把「绝对 projectDir 归一」登记为有意 delta（评审只报不改） |
| 2 | Acceptance criteria | 🟡 | AC-H5/T-H15（docs/design/MEMORY.md:409/:399）断「逐字命中」，但 §9 未锚定 README 说明句 / 三字段注释的字面（§9.4 行 9＝docs/design/MEMORY.md:363 只写「说明句 + 三字段注释」，无字面 oracle）；F14 判定句第三分句「示例值展开后可用」（docs/requirements/MEMORY.md:110）无显式断言 | 设计定稿 README 字面（或将判据降为「注释在场 + 三字段名」并写明）；补示例值可用性断言 |
| 3 | Clarity | 🔵 | §9.2 内联否决行（docs/design/MEMORY.md:282「+8–12 行 → ~497/500 无余量」）与选定案自述（docs/design/MEMORY.md:272、:356：config ≤+10，487→~497）落同一末态——「无余量」不区分两案（真区分点＝纯函数单测面 / 模块边界 / 拆分口径，docs/design/MEMORY.md:281/:372） | 修正该格数字或改述理由；新模块结论不受影响 |
| 4 | Requirements | 🔵 | D-H3 尾句（docs/design/MEMORY.md:373「不做 = 原样透传（可见失败优于猜）」）对 dbPath / team.dir 不成立：`~user/x` 透传仍静默创建字面 `~user` 目录（同病灶、出契约形态，docs/design/MEMORY.md:310/:297）；仅 shell 面响亮失败 | 措辞限定到 shell 面，或登记 `~user` 形态残余静默面 |
| 5 | Doc hygiene | 🔵 | 数字漂移（本评审实测）：批 §2（docs/batches/2026-09-11-HOME-EXPANSION.md:104）记「需求 73→114 行 / 设计 239→448 行」，实测 requirements/MEMORY.md 全文 113 行、design/MEMORY.md 全文 455 行；docs/design/MEMORY.md:365 预算 ≤+210，实际增量 +216。纯 .md 注释豁免尺寸判据，仅卫生级 | 解冻时刷新数字（非阻断） |
| 6 | Verification record | 🔵 | 重点核抽验（备查）：config.mjs 实测 487 行（读工具报「487 lines total」）；合并块 :274-285 逐字符、providers 归一自 :287 起、迁移写回 :265-272 在前（§9.3(b) 落点可行——docs/design/MEMORY.md:314/:331）；src/memory/schema.mjs mkdirSync=:67（∈ 引用 :66-68；§1 :54-56 为旧记录）；src/acp.mjs 不读 config dbPath（:419/:424 硬编码属实）；`src`+`bin` 现零命中 `startsWith("~`（AC-H1/T-H16 基线成立）；src/cli/make-agent.mjs:44 逐字符（七点位 #1 抽点）；isAbsolute 同款属实（src/tui/cmd-undo.mjs:24 逐字 / src/agent-tools/read-history.mjs:172 变体）。未复测：其余六点位行号 / README:138 / §9.10 锁清单逐档 / `_setConfigPathForTest` 缝 / VSC 勘察（预扫要求在档，非缺陷） | 无需动作——记录备查 |

**计数：🔴 0 · 🟡 2 · 🔵 4**

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 00:20 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 **pass**（🔴0 · 🟡2 · 🔵4）→ 修正轮 6/6 落地经父侧实文核验（N7 收窄 + 有意 delta 注 · README 字面定稿块 + T-H15/AC-H5 同步 · 行数刷新 113/467）→ **token 已签发**（值不落档）。

**批准范围**：新档 `src/expand-home.mjs`（~30）· `src/config.mjs`（487）· 七点位（make-agent / memory-command / memory-docs / distill-command / bin ×3，各 ≤+2~3）· 新测档 `test/home-expansion.test.mjs`（~110）· `README.md`（≤+4）。

**遗留（批准时登记）**：① 两测试档 >300 建议档（D-2 不拆口径——登记）；② VSC `shell` 镜像面（父侧排程）；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）


**（2026-09-11 实施完成——本段为上记占位行的交付记录，占位行以本段为准；实施者 = eng-coder，设计 token 门）**

**① 交付透明表（任务书裁定 C1a–C1f → 落点证据；行号 as-of 本段落笔）**

| # | 裁定 | 状态 | 证据 |
|---|---|---|---|
| C1a | loadConfig 合并后单点展开 | 已落 | `src/config.mjs:288-295`（合并块 `:275-286` 之后、providers 归一 `:297` 之前） |
| C1b | 新模块 expand-home.mjs | 已落 | `src/expand-home.mjs:11-16`（纯函数 / home 注入缝；全档 17 行） |
| C1c | 形态面（`~` / `~/` / `~\`；`~user` 等原样） | 已落 | `src/expand-home.mjs:12-15`；T-H1–T-H6 绿 |
| C1d | 四字段落法 + projectDir 七点位基准解析 | 已落 | `src/config.mjs:289-295` + ② 表七点位 |
| C1e | README 字面定稿 | 已落 | `README.md:124`（L4 追加）/ `:138`（L1）/ `:139`（L2）/ `:140`（L3） |
| C1f | 运行时写面当次展开不做 | 遵守 | 零改动（登记项） |

**② 七点位逐点自证（`join(cwd, p)` → `isAbsolute(p) ? p : join(cwd, p)`；相对分支逐字同修前）**

| # | 点位 | 落地 |
|---|---|---|
| 1 | `src/cli/make-agent.mjs:44` | 三分支 + import `:2` |
| 2 | `src/cli/memory-command.mjs:70` | 同式 + import `:1` |
| 3 | `src/memory/docs.mjs:240` | 同式 + import `:6` |
| 4 | `src/cli/distill-command.mjs:67` | 同式 + import `:1` |
| 5 | `bin/thincoder.mjs:227` | 同式 + import `:17` |
| 6 | `bin/thincoder.mjs:272` | 同式 |
| 7 | `bin/thincoder.mjs:326` | 同式（三态保形） |

**③ 测试实测（先落盘再查——日志落系统 tmp）**

| 命令 | 结果 |
|---|---|
| `node --test test/home-expansion.test.mjs` | 16 用例 = 15 pass / 1 skip（T-H14 slow 门）/ 0 fail |
| THINCODER_TEST_FULL=1 同单档 | 16 pass / 0 fail（含 T-H14 端到端） |
| `node test/run-fast.mjs`（快层） | tests 511 · pass 496 · fail 1 · skipped 14（fail = 他批预存 T41） |
| `node test/run-full.mjs`（全量） | tests 511 · pass 509 · fail 2（T41 + tui-stderr-capture——均实现前基线即红） |
| red 侧自证（反空转） | 裸 `~` 路径直喂 `createMemory` → `<cwd>/~` 字面目录生成（修前机制复现）——T-H14 断言非空转 |

**④ 机检**

- `grep -rn 'startsWith("~")' src bin` == 1 命中（`src/expand-home.mjs:12`）——AC-H1；
- `node --check`：改动 `.mjs` 全过（`check-syntax: 283 file(s) OK` 含新档；`bin/thincoder.mjs` 单跑亦过）；
- `node scripts/check-doc-width.mjs`：本批文件新增 0 违规（清单所列全属他批档）；V1/V2 新增 0 条属本批。

**⑤ 偏差披露（零静默）**

- 预存 2 失败（T41 他批文档 V1/V2；tui-stderr-capture slow）为基线态，非本批引入（实现前 release-check 实跑同证）；
- `src/config.mjs` / `src/memory/docs.mjs` 内含他批未提交 hunk，非本批改动（本批 hunk 见 ①②）；
- 行数：`src/config.mjs` 487 → 497（+10 = 批准预算上限）；新测档实测 225 行 vs 设计预计 ~+110（数值漂移上报父侧，测试档不改）。

**⑥ 审计与评审轮次 + 终态**

- 内部背离审计（explore 只读，轮次 1）：clean（0 发现；1 条非偏差观察 = 测档行数预算，见 ⑤）；
- 内部代码评审（advisor code，轮次 1）：pass（🔴0 / 🟡2 / 🔵3；2 个 🟡 均非 must-fix——config 尺寸既有债 + 需求池登记父侧项）；
- fix round = 0 轮；终态 = **clean**。

**⑦ 写入自证**：本段经 batch_segment 工具写入 §5（工具回执见交付报告）。

## §6 验证与收口（父代理自写）

**2026-09-12 02:50 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **15/1skip** · 全量 **16/16**（含 T-H14 端到端）· 快层 511/496/1（他链）· 全量 511/509/2（基线同 2 = 他批）；
- **父侧抽核**：`expand-home.mjs` 16 行纯函数（三形态 + `~user` 原样 + 注入缝）✓ · `config.mjs:289-295` 展开块 ✓ · README L1–L4 定稿字面在位 ✓ · `startsWith` 恰 1（:12）✓；
- 内部：背离审计 clean + 代码评审 pass（🔴0）；**零修正轮**。

### 逐条验收结论

- **AC-H1–AC-H9 全绿**（含 red 侧自证——反空转）；**Simplified 零 · Not done 零**；偏差如实（含测档 225 行漂移、`config.mjs` 497 貼硬限 3 行）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：9 档/七点位 ✓ · 指针：设计 §9 ↔ 用例 16 ✓ · 待办：四项父侧项（下）✓

### 遗留项

1. 需求池登记（TODO——拟录文本见批 §2 §10）；
2. `config.mjs` 497 行拆分立项（>300 建议档、距 500 硬限 3 行——父侧排程）；
3. 文档层数字刷新（测档 225 / 设计 468）；VSC `shell` 镜像面（另批）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
