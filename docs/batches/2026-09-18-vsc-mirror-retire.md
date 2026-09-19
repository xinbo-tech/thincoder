# 2026-09-18 · VSC 面收尾批（镜像树退役 + doc:check + 第三面）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `2af7c55c`；① 迁移**执行延后**——台账 #22）

### 1.1 批件（用户 2026-09-18 03:28「按你的建议吧」——授权 = 父侧四条建议面中的 ②③）

| # | 条目 | 实况 |
|---|---|---|
| ① | **v1 文档退役**（台账 #22 + #49 候选② 合并）：`thincoder-vscode/docs/**`（迁移期镜像树）——实跑 **771 悬空锚**（§2.6-7 口径行：命令 + as-of + 分解；原记 742 = 讨论时点读数、本席不可复现，已收正）⇒ `doc:check` 必红；`thincoder-cli/docs/**`（另一棵镜像树）同族面 | 退役形态由设计裁定（候选 = 迁 `_archive/`（保留参照历史 + 出机检域——`SKIP_DIRS` 已排除 `_archive`）vs 整删）；须核**引用面**（他档对 `thincoder-vscode/docs/**` 的指针——含 DOC-DISCIPLINE 机检配置的 `exclude`/`REF_DOC_TREES` 等键） |
| ② | **`doc:check` 域取向**（台账 #49）：`thincoder-vscode/package.json:125` 现为 `--domain thincoder-vscode`（指镜像树）| 退役后改指（canonical `docs/vsc` / 无域 / 移出 prepublish 三候选择一 + 判据），使 `vscode:prepublish` 链可绿 |
| ③ | **VSC 第三面**（台账 #52）：`thincoder-vscode/src/agent/setup-tooltable.mjs:216` 工程分支 enum **仍含 `plan`**（该面由 `thincoder-vscode/src/agent/setup.mjs:277` 调用；VSC 测档 `:89-94` 只用 `includes` 判据 ⇒ **假绿**）| 与 ①② 同片收正——含**测档判据收紧**（`includes` → 集合相等） |
| ④ | **`thincoder-vscode/test/files.mjs:47`/`:48` 裸节号**（与已收正的 `:43` 同族） | 一行级 |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。
镜像树「退役」的形态与影响面（引用面 / 机检配置键 / 参照历史的保留语义）须在设计里**逐条裁定**——不与「保留 ≠ 维护」政策相抵（退役 ≠ 改内容）。

### 1.3 边界

- **禁触**：冻结批档 · `_archive/**` 既有内容 · 参照历史树**内容**（本批只处置其**位置/登记**，不改其文字）· 提示词面。
- 与在途线文件重叠 ⇒ 排队 / 避让。

### 1.4 台账

- **#22**（v1 文档退役）· **#49**（doc:check 域）· **#52**（VSC 第三面）——三合一。

## §2 批次任务与设计修订（eng-designer）

### §2 批次任务与设计修订（eng-designer · 设计轮）

**段位**：设计轮（本轮只改设计档——`src/**` / `test/**` / `package.json` / `README.md` 零触碰；未 commit；未发起评审）。**设计落点（单源不重述 · D2）**：

- **①镜像树退役形态** → `docs/vsc/design/VSC-MIGRATION.md` **§2.5**（+ §2.4 降格声明邻行「退役形态定判」）
- **②doc:check 域取向** → `docs/core/design/DOC-DISCIPLINE.md` **§7**「产物包内机检脚本的域取向」
- **③第三面 enum + 判据收紧** → `docs/core/design/AGENT-LOOP-SUBAGENT.md` **§6.24**
- **④裸节号** → `docs/core/design/TESTING.md` **§10.1 追加**

#### 2.1 逐件裁定

| # | 条目 | 现状实核（本席实测） | 裁定 | 判据 |
|---|---|---|---|---|
| ① | 镜像树退役形态 | `thincoder-vscode/docs/**` 136 档活面（含 `_archive/` 153）· `thincoder-cli/docs/**` 142 / 192；活档引用行 = **247 行 / 75 档**（VSC）· **429 行 / 102 档**（CLI）；其中「原地 / 一字未改」措辞行 57 / 159；**迁后转悬空 = 38 / 73 行**（合计 111，其中 58 行落 `docs/TODO-archive.md`——台账档不入机检源域 ⇒ 闸态 53） | **形态 = 归档（迁 `_archive/`）· 整删否决**（四条判据见 §2.5）；**本批不执行**——第 1 条前提 = 本树 `VSC-PROMPTS.md` + 15 档提示词镜像的「原地保留不动」为**用户既有裁定**（VSC-MIGRATION §7.1 销项行），整树迁与之相抵 ⇒ **语义面，bounce 主 agent / 用户**（整树迁 ∥ 挖除两族后再迁 ∥ 维持原地） | §2.5 四条执行前提 + 执行窗口（触发 = 裁定完毕 ∧ 在途文档债批收口） |
| ② | `doc:check` 域取向 | 实装：`--domain <d>` ⇒ 源域 = `resolve(root,d)` 下的 `checkConfig.scanDirs`（= `docs`）；实测 `--domain thincoder-vscode` = **FAIL(锚) 771 条**（镜像树）· `--domain docs/vsc` = **OK(锚) 0 条悬空**（源域 **0 档**——空域假绿）· 无域（仓根）= 悬空 287 / 行宽 3（他批在途债） | **链位取「移出 prepublish」+ 域取「无域（仓根域）」**：`vscode:prepublish` = `lint && test`；`doc:check` = `node ../scripts/doc-check.mjs --root ..`（= CI docs 作业同命令）。**否决**：`--domain docs/vsc`（0 档假绿——比红更坏）· 保留 `--domain thincoder-vscode`（扫退役镜像树，无覆盖意义）· 整删脚本（便利入口消失，且与 CI 重复） | 落点 = DOC-DISCIPLINE §7（禁空域假绿 + 产物包走仓根域 + 发布门不挂仓级文档债） |
| ③ | 第三面（VSC 装配面） | `thincoder-vscode/src/agent/setup-tooltable.mjs:216` enum = `["explore","plan","eng-coder","eng-designer"]`（**含 `plan`**）；调用面 `setup.mjs:277`（depth-0 门 `:276`，与核 `family-tools.mjs:44` 同构）；判据面 `test/eng-designer-role.test.mjs:89-94` 仅 `includes` ⇒ **假绿** | **enum 逐字收正为 F5 集 `["explore","eng-designer","eng-coder"]`**（§6.22 F5 的集与序；不 import 核常量——核侧为函数内字面量，端侧自持 + 判据锁）+ **判据改集合相等**（工程/普通两支各 `[...enum].sort()` `deepEqual`） | 落点 = AGENT-LOOP-SUBAGENT §6.24（AC-3 / T-3） |
| ④ | 裸节号 | `§2.20.x` / `§2.22.x` 两族节号**只存于已归档 v1 档**（`docs/core/design/_archive/ENGINEERING-MODE.md` 与两树）⇒ 活体面不可解析；VSC 包内实存 **12 行 / 6 档**（含孤儿夹具档 `thincoder-vscode/test/fixtures/doc-consistency-baseline.json`——评审轮 1 发现 1 纳入） | **去裸节号、改自足表述**（面名 + 批号）；能指到可解析现行权威者优先——**范围限 VSC 包内**（`test/files.mjs:47/:48/:52` · `eng-designer-role.test.mjs:3/:96` · `batch-segment.test.mjs:2` · `prompts-mirror-anchors.test.mjs:4/:18/:44/:81` · `src/agent/setup.mjs:309`）+ **孤儿夹具档整档删除**（`:2` note 串——判据域含该档 ⇒ 不纳入即不可达）；**`§2.20.x` 族在 core / CLI 两包出界**（归台账 #42） | 落点 = TESTING §10.1 追加（修法 + 12 行范围 + 出界） |

#### 2.2 受影响文件表（实施轮写域 · 现 = `wc -l` · as-of 2026-09-18）

**数字列口径（评审轮 1 发现 9；DOC-DISCIPLINE §3.7 条目 H）**：行数三件只对**源 / 测试档（`.mjs` / `.cjs`）**保留；`.md` 行与其余非源档（`.json`）两列填 `—`、**行保留**。

| # | 文件 | 现 | Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | 229 | ±0 | `:216` 工程分支 enum → F5 集（③） |
| 2 | `thincoder-vscode/test/eng-designer-role.test.mjs` | 196 | ③ +2 · ④ ±0 | `:89-94` `includes` → 集合相等（工程 + 普通两支，各一条 deepEqual）（③）· `:3` `:96` 去裸节号（④——评审轮 1 发现 7 补载） |
| 3 | `thincoder-vscode/test/files.mjs` | 82 | ±0 | `:47` `:48` `:52` 去裸节号（④） |
| 4 | `thincoder-vscode/test/batch-segment.test.mjs` | 232 | ±0 | `:2` 去裸节号（④——评审轮 1 发现 10 复测收正：231 → 232） |
| 5 | `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` | 152 | ±0 | `:4` `:18` `:44` `:81` 去裸节号（④） |
| 6 | `thincoder-vscode/src/agent/setup.mjs` | 481 | ±0 | `:309` 去裸节号（④） |
| 7 | `thincoder-vscode/package.json` | — | — | `:117` prepublish 去 `doc:check`（= `lint && test`）· `:125` `doc:check` 改仓根域命令（②） |
| 8 | `thincoder-vscode/AGENTS.md` | — | — | `:118` / `:119` / `:120` 发布门族三行收正（②连带 + 评审轮 1 发现 4）——**逐字目标形态见本节末块** |
| 9 | `README.md`（仓根） | — | — | `:10` / `:11` 门链列 + `:24` / `:25` / `:26` 命令块收正（②连带 + 评审轮 1 发现 4）——**逐字目标形态见本节末块** |
| 10 | `thincoder-vscode/CHANGELOG.md` | — | — | 追加新条目：发布门链变更（②）——历史条目**不回改** |
| 11 | `docs/core/requirements/RELEASE.md` | — | — | `:46` V-F1 链陈述——**需求档（写权 = 主 agent）**；**已收口**（父侧 2026-09-18 直接执行，见 2.6 发现 1） |
| 12 | `thincoder-vscode/test/fixtures/doc-consistency-baseline.json` | 6 | −6 | **整档删除**（孤儿夹具；`:2` note 串含 `§2.22.6` / `§2.22.7`——本批 ④ 纳入；评审轮 1 发现 1） |

**超档登记（本批只登记不执行——表内第 6 行）**：`thincoder-vscode/src/agent/setup.mjs` **481 行**（越 300 软线；距 500 硬限余量充足）。

- 本批改动面 = 注释行一处（`:309` 去裸节号——±0 行），与越线零因果。
- 候选拆分线：`hydrateRun`（`:110`–`:476`，约 367 行 ≈ 全档 76%）内「config 归一 + 槽水合」段（`:187`–`:272`）抽兄弟档
  `thincoder-vscode/src/agent/hydrate-phases.mjs`（拟新增）——`hydrateRun` 导出签名与返回对象逐字不变（先例 = `thincoder-vscode/src/agent/setup-tooltable.mjs` 已按同法自本档迁出）。
- **本批只登记不执行**（拆分 ≠ 本批范围——避免夹带）；触发 = 下次触碰该档功能面时（评审轮 1 发现 2 落修）。

**门链表述目标形态（②连带 · 评审轮 1 发现 4）——表内第 8 / 9 行逐字契约**：

- `thincoder-vscode/AGENTS.md`（三行 → 四行）：
  ① 替换现 `:118` = `- **Full suite**: `npm test` — the single entry: unit + integration + slow all run in one go (no separate fast/full/integration scripts).`
  ② 替换现 `:119` = `- **Integration set**: business-voice scenarios asserting observable results — they run inside `npm test`.`（目标档内该句一并保留集成集目录及其清单档的**包相对**路径形态——本档为避免产悬空锚从略）
  ③ 收正现 `:120` = `- **Release gate**: `vscode:prepublish` = `npm run lint && npm test` (runs automatically on `vsce package` / bare `vsce publish`).`
  ④ 新增一行 = `- **Doc check (not a gate step)**: `npm run doc:check` — repo-root domain; same command as the CI docs job.`
- `README.md`（仓根）：门链表 `:10` / `:11` 两行的链列表述均改 `gate = lint → test`（CLI 行去 `test:full` / `test:integration`；VSC 行另去 `doc:check`）；
  命令块 `:23`–`:26` 四条 → 三条：`cd thincoder-cli && npm install && npm run lint && npm test` · `cd thincoder-vscode && npm install && npm run lint && npm test` ·
  `cd thincoder-vscode && npm run doc:check`（行尾注 = 仓根域文档机检——**非发布门**，与 CI docs 作业同命令）。
- 现文定位（as-of 本次落修前）：`thincoder-vscode/AGENTS.md` 现 `:118` = `npm run test:full` 条 · `:119` = `npm run test:integration` 条 · `:120` = 四环门链句；
  `README.md` 现 `:10` = CLI 门链行 · `:11` = VSC 门链行 · `:24` = CLI 全量 / 集成命令 · `:25` = VSC lint + doc:check 命令 · `:26` = VSC 全量 / 集成命令。

**同族未入表项（批外登记——不夹带 · 评审轮 1 发现 4 的连带扫描面）**：

- `thincoder-vscode/scripts/publish-all.mjs`（`:10` 头注 / `:90` 打包标签仍写 `test:full`）——产品脚本，未入本批受影响表（另批）。
- 五处测试档注释：`thincoder-vscode/test/files.mjs:2` · `thincoder-vscode/test/git-commit-pathspec.test.mjs:7` · `thincoder-vscode/test/setup-reminders.test.mjs:21` ·
  `thincoder-vscode/test/turn-across-segments.test.mjs:11` · `thincoder-vscode/test/edit-tool-improvement.test.mjs:20`。
- `docs/cli/design/RELEASE.md`（`:77` 与 §2 环名仍写 `test:full` / `test:integration`——CLI 面活档，非本批写域）。
- `thincoder-vscode/CHANGELOG.md` 历史条目（**不回改**——档史形态保留；本批只追加新条目）。

**设计轮本笔已落（写域 = 设计档）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md`（779）· `docs/core/design/DOC-DISCIPLINE.md`（886 → 888）· `docs/core/design/TESTING.md`（364 → 370）· `docs/vsc/design/VSC-MIGRATION.md`（175 → 178）。

#### 2.3 验收标准（逐条可机判 · 回指 §1.1）

| AC | 回指 | 判据（命令 ⇒ 期望） |
|---|---|---|
| AC-1 | ③ | `cd thincoder-vscode && node --test test/eng-designer-role.test.mjs` ⇒ exit 0；且**工程分支判据行**不再以 `includes` 断枚举（改 `[...enum].sort()` 集合相等）；**普通分支负断言（`:92` `!…includes("eng-designer")`）保留**——T-2 边界例，非本 AC 射程；「整档 `includes` 零命中」**不作判据**（评审轮 1 发现 8） |
| AC-2 | ③ | 反证（实施轮留红证据）：`setup-tooltable.mjs:216` 未改时该例必红（actual 含 `plan`）；改后绿 |
| AC-3 | ③ | `grep -n 'explore", "plan", "eng-coder' thincoder-vscode/src/agent/setup-tooltable.mjs` ⇒ 零命中；工程分支 enum 逐字 = F5 集 |
| AC-4 | ④ | VSC 包内 `§2.20.x` / `§2.22.x` 裸节号零残留：`grep -rn '§2\.2[02]' thincoder-vscode/src thincoder-vscode/test` ⇒ 零命中（**设计轮复测**：域内 **1 处** = 夹具档 `:2`，本批 ④ 删除对象 ⇒ 实施后零命中可达——发现 1 的可满足性实测） |
| AC-5 | ② | `cd thincoder-vscode && npm run doc:check` ⇒ 与仓根 `node scripts/doc-check.mjs` 同读数（同域同判据；非 0 档、非空域）；`node -e` 读 `package.json` ⇒ `vscode:prepublish` 不含 `doc:check` |
| AC-6 | ①②③④ | `cd thincoder-vscode && npm run lint && npm test` ⇒ exit 0（新 prepublish 链 = 绿）；`node scripts/doc-check.mjs`（仓根）复跑 ⇒ **本批 authored 零新增**（逐行对表：新写行不产生悬空锚 / 不产生 >300 字符行） |
| AC-7 | ② | 文档面同步：受影响文件表 **7–11 行 + 第 12 行**逐条落位（第 12 行 = ④ 夹具档删除）；`thincoder-vscode/AGENTS.md:120` 不再声称 prepublish 含文档机检 |

#### 2.4 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望输出 |
|---|---|---|---|
| T-1 | 正常 | `modeRoleField(true).role.enum` 与 `["eng-coder","eng-designer","explore"]`（排序后）比对 | 相等（AC-1） |
| T-2 | 边界 | `modeRoleField(false).role.enum` | `["coder","explore","plan"]`（正常模式零回归——F5 明文「normal 不删」） |
| T-3 | 错误 | 反证：enum 内注入 `plan` | T-1 红（判据收紧生效——旧 `includes` 判据下不红） |
| T-4 | 正常 | `cd thincoder-vscode && npm run doc:check` | 与仓根命令读数逐字同（域 = 仓根域；档数 ≠ 0） |
| T-5 | 边界 | `--domain docs/vsc`（反例封样） | 报 `0 档` 空域假绿 ⇒ 判为**禁用形态**（DOC-DISCIPLINE §7 已写死） |
| T-6 | 错误 | 包内再出现 `--domain thincoder-vscode` 于任一脚本 | 判违规（扫退役镜像树；脚本读数 771 条悬空） |
| T-7 | 正常 | VSC 包内 `grep -rn '§2\.2[02]'`（夹具档删除后） | 零命中（④——删除前域内读数 = 1 处） |
| T-8 | 边界 | 本批新写行逐行过 `doc-check` | 悬空 0 / 行宽 0（AC-6 的逐行面） |

#### 2.5 边界（本批不做）

- **不执行镜像树迁移**（①的形态已定判，执行 = 独立 ops 批，前提四条 + 窗口见 VSC-MIGRATION §2.5）；
- 不改参照历史树**正文**（只读红线）；不碰 `_archive/**` 既有内容；不碰冻结批档；不碰提示词面（`thincoder-core/prompts/**`）；
- 不动 `ROLES` 白名单 / 门文案 / 核侧两处已收正（③边界，§6.24）；
- 不扩到「v1 文档全量退役」（①的射程 = 形态裁定 + 影响面实核；两树执行另议）；不扩到 `§2.20.x` 族在 core / CLI 两包的注文（归 #42）；
- 不改 `vscode:prepublish` 的 `lint` / `test` 两项语义；不新增独立预跑步。

#### 2.6 发现 / bounce（逐条 · 本席不自行处置者已标明归属）

1. **需求档同步（已收口——父侧 2026-09-18 直接执行）**：`docs/core/requirements/RELEASE.md:46`（V-F1）现文 = 链 `lint && npm test` + 明记 `doc:check` **移出发布门**（仓级文档机检走仓根域命令）——与本批 ② 裁定一致 ⇒ **无需二次改写**（评审轮 1 发现 11；该档写权 = 主 agent，本席零触碰）。同族非需求面入受影响文件表 8–10 行（端壳登记档 / 仓根 README / CHANGELOG）。
2. **① 为语义面 bounce**：整树迁 `_archive/` 与用户既有裁定「原地保留不动」（`VSC-MIGRATION.md` §7.1 销项行：`VSC-PROMPTS.md` + 15 档提示词镜像）相抵 ⇒ 执行前须主 agent / 用户裁（三选一）；本席只定形态与影响面，**未执行迁移**。
3. **既有文档漂移（本批顺带收正）**：多档活文档仍写「四环 = lint → doc:check → test:full → test:integration」，而实装（M8 测试纪律批起）已是三环 ⇒ 随 ② 同批收正（受影响文件表 8–10 行）。参考历史树内的同句（`thincoder-vscode/docs/**`）按只读红线不动（D2——其为参照历史，权威在活档）。
4. **① 执行的前提之一（测试族失效面）**：`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:39` 读本包 `docs/design/prompts/**`、`:44-53` 全树走 `join(VSC, "docs")` ⇒ 树迁后该档 ③/⑤ 两面须重定宿主（canonical `docs/core/design/prompts` ∥ 退役）；同时暴露一处**既有覆盖缺口**（canonical 提示词设计档的小节引用面无判据宿主）——登记，另批。
5. **③ 的第四/五面排查结论（非缺口）**：端侧装配面 = 全仓唯一经 `modeRoleField` 出 enum 的面（`setup.mjs:277`，depth-0 门 `:276`）；核侧两处已由 M-FAMILY-SWEEP 收正 ⇒ 本批收正后三面同集。
6. **机检读数（设计轮复跑 · cwd = 仓根）**：`node scripts/doc-check.mjs` ⇒ 悬空 **287** · 行宽 **3 行**（轮内两次读数 285 → 289 → 287——差额全落他批在途档，判据 = 「他批在途档的读数波动 = 活动量，不作缺陷」）；**本笔 authored 零新增**（本笔四档逐行核：命中行均非本笔所写；首版两处自产悬空已当场收正——`AGENT-LOOP-SUBAGENT.md` 变更记录行的裸 `setup.mjs:277`、`VSC-MIGRATION.md` §2.5 的 `design/VSC-PROMPTS.md` 形态）。
7. **同域读数对账（评审轮 1 发现 5 落修）**：§1.1 ① 的 **742** = §1 讨论时点父侧读数（命令未载，本席**不可复现**）；§2.1 ② 的 **771** = 本席复测口径——
   `node scripts/doc-check.mjs --domain thincoder-vscode`（cwd = 仓根；引擎 = 仓根单引擎）⇒ `FAIL(锚): 771 条悬空`（分解 = 用例号 **47** · 路径/坐标 **724** · 符号类 0；as-of 2026-09-18 设计轮复测，两次读数一致）。
   **裁定口径 = 以本席复测命令 + 读数（771）为单一读数**；差额 29 的成因未核（登记，不作缺陷）——与 §2.6-6「读数波动 = 活动量」同向。**§1.1 ① 的行文收正 = 主 agent 笔**（§1 非本节写域）⇒ 本节只落口径行。
8. **同族漂移登记（批外项——不夹带）**：见 §2.2 表下「同族未入表项」块（`thincoder-vscode/scripts/publish-all.mjs` 两处 · 五处测试档注释 · `docs/cli/design/RELEASE.md` 环名 · CHANGELOG 史条）。
9. **行数读数复测（评审轮 1 发现 10 + 全表复测）**：`thincoder-vscode/test/batch-segment.test.mjs` = **232**（表内旧记 231 ⇒ 已就地收正）· `README.md`（仓根）= **65**（旧记 64——随发现 9 的 `—` 形态消解）· 其余表内源 / 测试档读数**逐条相符**（`thincoder-vscode/src/agent/setup.mjs` 481 · `thincoder-vscode/src/agent/setup-tooltable.mjs` 229 · `thincoder-vscode/test/eng-designer-role.test.mjs` 196 · `thincoder-vscode/test/files.mjs` 82 · `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` 152 · `thincoder-vscode/package.json` 134 · `thincoder-vscode/AGENTS.md` 122 · `thincoder-vscode/CHANGELOG.md` 868 · `docs/core/requirements/RELEASE.md` 79）。
10. **④ 删除对象的后续机检面（实施轮须知）**：夹具档删除后，本设计档 / 本批档内对该档的**回指行可能转悬空**（路径锚）⇒ 实施轮 AC-6 逐行面须复跑并按需加 `（迁移期引文` 标记或改述（本席落笔时该档在位 ⇒ 当下零悬空）。

### 设计评审修正轮 1（eng-designer · fix 轮 · 11 条逐条落位）

**段位**：fix 轮（评审轮 1 = changes-required：🔴 1 · 🟡 5 · 🔵 5 = **11 条**；父侧裁决**全部接受**）。本轮只改**文档文字**——设计档 3 档（`docs/vsc/design/VSC-MIGRATION.md` · `docs/core/design/DOC-DISCIPLINE.md` · `docs/core/design/TESTING.md`）+ 本档 §2（就地收正）；`thincoder-vscode/src/**` · `thincoder-vscode/test/**` · `thincoder-vscode/package.json` · 需求档（`docs/core/requirements/**`）**零触碰**；未 commit；未发起评审；未执行镜像树迁移。**本追加与上文冲突处，以本追加为准。**

**落点表（发现号 → 改动 file:line；行号 = 本轮回读 as-of 2026-09-18）**：

| # | 严重度 | 落修 |
|---|---|---|
| 1 | 🔴 | **取备选 (a)**：孤儿夹具档并入 ④ 范围、处置 = **整档删除**。落点 = `docs/core/design/TESTING.md:348-352`（范围行改 **12 行 / 6 档** + 新增「夹具档纳入理由」段）· 本档 §2.1 ④ 行 `:48` · §2.2 新增第 12 行 `:67` · AC-4 `:106`（原 grep 保留 + 记复测读数）· T-7 `:121` · AC-7 `:109`（第 12 行入验收）。备选 (b)（收窄 grep 域 + 批外登记）= **未取**。 |
| 2 | 🟡 | 超档登记落 §2.2 表下块（本档 `:69-74`）：越线事实（481 行 / 越 300 软线）· 本批改动面（注释行 · ±0）· 候选拆分线（`hydrateRun` 内「config 归一 + 槽水合」段 `:187`–`:272` → `thincoder-vscode/src/agent/hydrate-phases.mjs`（拟新增））· 「本批只登记不执行」。 |
| 3 | 🟡 | `docs/vsc/design/VSC-MIGRATION.md:97` 新增 as-of 注（§2.5 前提 1 之下）——用户 2026-09-18 03:28 裁定取代销项口径 ⇒ 该条**不再是执行前提**；原措辞 `:96` 保留为历史；同档变更记录 `:154` +1 行。 |
| 4 | 🟡 | **扩两行改动列**（本档 `:63` / `:64`）：`thincoder-vscode/AGENTS.md` 行 → `:118` / `:119` / `:120` 三行；`README.md` 行 → `:10` / `:11` / `:24` / `:25` / `:26`。逐字目标形态 = 「门链表述目标形态」块（`:76-87`）；同族未入表项（`publish-all.mjs` 两处 · 五处测试档注释 · `docs/cli/design/RELEASE.md` · CHANGELOG 史条）= 批外登记块（`:89-95`）。 |
| 5 | 🟡 | §2.6 新增第 7 条（本档 `:140-142`）：口径行 = 命令（`node scripts/doc-check.mjs --domain thincoder-vscode` · cwd = 仓根）+ as-of + 分解（用例号 47 · 路径/坐标 724 · 符号类 0）+ 裁定「**以复测读数 771 为单一读数**」；§1.1 ① 的 742 行文收正 = **主 agent 笔**（§1 非本节写域）。 |
| 6 | 🟡 | `docs/core/design/DOC-DISCIPLINE.md:793` 括注改「只引在效面（§1.20 层 0-2）+ §4.2.8 族已随 v2 单引擎收敛撤除」；同档变更记录 `:825` +1 行。 |
| 7 | 🔵 | 本档 §2.2 第 2 行 `:57`：改动列补 ④（`:3` / `:96` 去裸节号）；Δ 分列「③ +2 · ④ ±0」。 |
| 8 | 🔵 | 本档 AC-1 `:103` 改「**工程分支判据行**不再以 `includes` 断枚举」+ 明文「普通分支负断言（`:92`）保留——T-2 边界例，非本 AC 射程」；「整档 `includes` 零命中」不作判据。 |
| 9 | 🔵 | 本档 §2.2 第 7–11 行 `:62-66` 两列改 `—`（**行保留**）；口径行落表头下 `:52`。**行 7 实为 `.json`**（发现表述作「`.md` 档」在行 7 上不成立）⇒ 按同判据处置（非源 / 测试档不记行数），结论相同。 |
| 10 | 🔵 | 复测收正：本档 §2.2 第 4 行 `:59` **231 → 232**（`wc -l` 口径 · 本席复测）；全表复测结论 = §2.6 第 9 条（`:144`）。 |
| 11 | 🔵 | 本档 §2.6 第 1 条 `:134` 改「**已收口**」口径（`docs/core/requirements/RELEASE.md:46` 现文 = `lint && npm test` + doc:check 移出发布门，父侧 2026-09-18 直接执行）⇒ 免去对需求档的二次改写。 |

**机检读数（修正轮复跑 · cwd = 仓根）**：

- `node scripts/doc-check.mjs` ⇒ 悬空 **287**（与设计轮同值）· 行宽 **2 行**（= `docs/core/design/prompts/persona-engineering.md:137` / `:139`——他批档，本批零触碰；设计轮记 3 行）· 拟新增 **2**（列报 · 不入闸）。
- **本笔 authored 零新增**：本笔四档（三设计档 + 本档）新写行逐行过闸——零新增悬空锚 / 零新增超宽行（本档全文零命中；三设计档命中行均为本笔前存量）。
- **AC-4 可满足性实测**：`grep -rn '§2\.2[02]' thincoder-vscode/src thincoder-vscode/test` ⇒ **1 处**（= 夹具档 `:2`）⇒ ④ 删除后归 **0**（可选性 = 实测，非推断）。

**本轮不做（与父侧派单一致）**：① 的执行动作（迁移 = 独立 ops 批）· 实施面代码（`thincoder-vscode/src/**` · `test/**` · `package.json`）· 需求档 · 存量悬空 / 行宽 · #42 族 · 机检卫生（自查折行 / 自产悬空除外）。

**待父侧（本轮不自行处置）**：

- **§1.1 ① 的 742 行文收正**（写权 = 主 agent）：本节 `:140-142` 已备口径行与单一读数裁定，§1 收正时可直接引用。
- **`docs/cli/design/RELEASE.md`**（`:77` 与 §2 环名同族漂移）：CLI 面活档，非本批写域 ⇒ 登记，另批。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|------|--------|------|------|
| 1 | 验收标准 / 需求覆盖 | 🔴 | AC-4（批档 `:75`）声明「VSC 包内 `§2.20.x` / `§2.22.x` 裸节号零残留：`grep -rn '§2\.2[02]' thincoder-vscode/src thincoder-vscode/test` ⇒ 零命中」，但实存第 12 处落在该 grep 域内、且不在 ④ 枚举内：`thincoder-vscode/test/fixtures/doc-consistency-baseline.json:2`（note 串含 `§2.22.6` / `§2.22.7`）。④ 的枚举（批档 `:48` = 11 行 / 5 档；`TESTING.md:348` 范围行同集；受影响表 `:56-59`）不含该档 ⇒ AC-4 在声明写域内不可达：coder 只能红，或私自扩写域（R2 类偏离） | 二选一收口：① 把该档并入 ④ 范围（计数收正为 12 行 / 6 档 + 受影响表增行）——该档 = 孤儿夹具（消费档 `test/doc-consistency.test.mjs` 已随 M8 机检重写批删除，见 `TESTING.md:312-313` / `files.mjs:49-50`；全包 `.mjs` / `.json` 内容 grep 无引用）⇒ 删除或改写为自足注文；② 收窄 AC-4 的 grep 域 / 模式（如排除 `test/fixtures/**`）并把该残留登记为批外项（逐条给理由） |
| 2 | 方法（受影响文件档位） | 🟡 | 受影响表第 6 行 `thincoder-vscode/src/agent/setup.mjs` = **481 行**（越 300 软线），本批触碰（④ `:309`），表内只有「现 / Δ」两列，无越线登记 / 拆分计划——与同仓先例 `AGENT-LOOP-SUBAGENT.md` §6.23.4「拆分计划（超档项）」及 §3.7「源 / 测试档三件（当前行数 + 预计增量 + 拆分计划）」不齐 | 随表补一行超档登记（越线事实 + 本批改动面（注释行）+ 候选拆分线 + 「本批只登记不执行」），或注明实测口径下未越线 |
| 3 | 一致性（同档两处） | 🟡 | `VSC-MIGRATION.md:96`（§2.5 前提 1）仍把提示词镜像两族「原地保留不动」当**待裁**（三选一），而同档 `:121`（§7 新注）已记「该销项口径已被用户 2026-09-18 03:28 的裁定取代——用户批准…一并退役（归档形）」⇒ 同档对「前提是否已满足」表述不一；ops 批只读 §2.5 会误判仍在等裁 | §2.5 前提 1 加 as-of 注（superseded 指针 → §7 注 / 用户裁定），原措辞保留为历史（不改字） |
| 4 | 一致性（② 连带扫描面） | 🟡 | 受影响表第 8 / 9 行只命名 `thincoder-vscode/AGENTS.md:120` 与 `README.md:11` / `:25`，同族漂移仍在未命名行：`AGENTS.md:118-119` 与 `README.md:24` / `:26` 仍把 `npm run test:full` / `npm run test:integration` 当现存命令——实核 `thincoder-vscode/package.json:116-126` scripts 无该两键（M10 已收敛为单条 `test`）；§2.6-3 自称本批「顺带收正」该漂移族 | 扩该两行改动列，或把未命名行显式登记为批外项 + 理由——否则同一文件内新改句与邻行旧句并存 |
| 5 | 一致性（读数） | 🟡 | 同一面两个读数未对账：批档 `:11`（§1.1 ①）「`thincoder-vscode/docs/**`…实跑 **742 悬空锚**」vs 批档 `:46`（§2.1 ②）「实测 `--domain thincoder-vscode` = **FAIL(锚) 771 条**（镜像树）」——同一源域（`thincoder-vscode/docs`）两个红读数差 29，无口径 / as-of 说明（成因未核） | 补口径行（引擎版本 / as-of / 同域核实）或收正为单一读数；与 §2.6-6 已立的「读数波动 = 活动量」口径对齐 |
| 6 | 一致性（指针） | 🟡 | `DOC-DISCIPLINE.md:793`（§7 新段）写「保留为参照历史、只读红线（**§4.2.8 族**与 §1.20 层 0-2 不变）」，而同档 `:458` 已把 §4.2.8 标「**本条已失效**（v2 单引擎收敛已删族…族零射程）」⇒ 新段把已撤的豁免族当「不变」引用 | §7 该括注改为只引在效面（§1.20 层 0-2 只读红线）+ 明记「族已随 v2 收敛撤除」 |
| 7 | 清晰度（受影响表） | 🔵 | 受影响表第 2 行（批档 `:55`）改动列只载 ③（`:89-94` includes → 集合相等），未载 ④ 的同档改动（`:3` / `:96` 去裸节号），而 ④ 范围行（`:48`）明列该档 | 该行改动列补 ④ 项（写域表 = coder 契约），Δ 分列 ③ / ④ |
| 8 | 验收标准 | 🔵 | AC-1 第二句「该档内 `includes("eng-designer")` 零命中」= 整档文本 grep；同档 `:92` 现有普通分支反断言 `!modeRoleField(false).role.enum.includes("eng-designer")`——若以「集合相等 + 保留负断言」落笔（设计未明文禁止），该 AC 假红 | 该句限定到工程分支判据行（如「工程分支不再以 `includes` 断枚举」），或明文写「普通分支负断言同删」 |
| 9 | 方法（表形态） | 🔵 | 受影响表 7–11 行为 `.md` 档却填数值「现 / Δ」，而 `DOC-DISCIPLINE.md:242`（§3.7 条目 2 判据）定「含受影响文件表内 `.md` 行——形态 = 该两列填 `—`，行保留」 | 两列改 `—`（行保留）；同表源 / 测试档三件照留 |
| 10 | 数值抽样 | 🔵 | 抽样实核：`test/batch-segment.test.mjs` 读取器读数 232–233 vs 表内 **231**（其余抽样相符：VSC 镜像树 136 活面 / 153 含 `_archive`、CLI 镜像树 142 / 192、`files.mjs` 82、`eng-designer-role.test.mjs` 196、`package.json` 134、`prompts-mirror-anchors.test.mjs` 152、`setup.mjs` 481） | 落笔前复测该档（差 1–2 行，成因未核：口径差 / 并行在途改动——`files.mjs:81` 记有并行批新档） |
| 11 | 文档卫生 | 🔵 | 批档 `:103`（§2.6-1）仍以未决口吻记「`RELEASE.md:46`…需主 agent 同批收正」，而该行已载 2026-09-18 收正（需求档现文 = 门链 `lint && npm test` + doc:check 移出，与 §7 / ② 裁定一致） | 父侧在 §4 / §6 记为已收口即可，避免按 §2.6-1 二次改写需求档 |

计数：🔴 1 · 🟡 5 · 🔵 5 = **11 条**。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 核验（fix 轮 · 11/11 落位复核 + 新增项）**

**核验基准（本轮 fresh）**：六份在卷文档全文重读 + 受影响面坐标实核（`thincoder-vscode` 源/测试档 8 档 + `package.json` + `AGENTS.md` + 仓根 `README.md` + 夹具档）+ AC-4 判据域复跑 + 全包 `doc-consistency` 引用面检索。未复测面：镜像树体量/引用面读数（136/153 · 142/192 · 247/429 · 111/38/73——轮 1 抽样相符，本轮未重跑）。

**逐条落位复核（轮 1 的 11 条）**：

| # | 轮1 | 状态 | 本轮证据（fresh 行） |
|---|---|---|---|
| 1 | 🔴 | 已修 | `TESTING.md:348`「**范围（本批 · 12 行 / 6 档）**：…」+ `:350`「…· `thincoder-vscode/test/fixtures/doc-consistency-baseline.json`（`:2` note 串——**整档删除**）。」+ 批档 `:48`「VSC 包内实存 **12 行 / 6 档**（含孤儿夹具档…）」+ 批档 `:67` 第 12 行（Δ −6）。判据域 fresh 复跑 = **12 处 / 6 档**（src：`setup.mjs:309`；test：`batch-segment.test.mjs:2` · `eng-designer-role.test.mjs:3`/`:96` · `files.mjs:47`/`:48`/`:52` · 夹具 `:2` · `prompts-mirror-anchors.test.mjs:4`/`:18`/`:44`/`:81`）⇒ 12 处全入 ④ 范围，实施后零命中可达 ✓ · 孤儿性 fresh 复核：全包 `.mjs`/`.json` 内容检索 `doc-consistency` 仅命中 `files.mjs:49`/`:50`（退役注），零消费方 ✓ |
| 2 | 🟡 | 已修 | 批档 `:69`「**超档登记（本批只登记不执行——表内第 6 行）**：`thincoder-vscode/src/agent/setup.mjs` **481 行**（越 300 软线；距 500 硬限余量充足）。」+ `:72`-`:73` 候选拆分线（`hydrateRun`（`:110`–`:476`…）→ 拟新增 `hydrate-phases.mjs`）；fresh 实核 `setup.mjs:110` = `export async function hydrateRun(agent, { provider, cwd, input, opts, depth, role, getAuto, restore = false }) {`、档 482 元素 ⇒ `wc -l` **481** ✓ |
| 3 | 🟡 | 已修 | `VSC-MIGRATION.md:97`「**2026-09-18 as-of 注（本前提状态已变——原措辞保留为历史）**：本条「待裁」**已解除**——…**取代**该销项口径…本条**不再是执行前提**…ops 批开工以本注为准，勿按本条等待裁定。」✓ 与 `:122` §7 注同向 |
| 4 | 🟡 | 已修 | 批档 `:63`/`:64` 扩为 `:118`/`:119`/`:120` 与 `:10`/`:11`/`:24`/`:25`/`:26` + `:76-87` 逐字目标形态 + `:89-95` 同族未入表项；fresh 五行坐标全中（`AGENTS.md:118` = `- **Full suite**: `npm run test:full` — the same list with slow-registered tests released (`slow()` gate).` · `:120` = `- **Release gate**: `vscode:prepublish` = `npm run lint && npm run doc:check && npm run test:full && npm run test:integration` (runs automatically on `vsce package` / bare `vsce publish`).` · `README.md:11` = `| \`thincoder-vscode/\` | … | Marketplace / Open VSX — gate = lint + doc:check → test:full → test:integration |` · `:25` = `cd thincoder-vscode && npm install && npm run lint && npm run doc:check`）✓ |
| 5 | 🟡 | 已修 | 批档 `:11`「实跑 **771 悬空锚**（§2.6-7 口径行：命令 + as-of + 分解；原记 742 = 讨论时点读数、本席不可复现，已收正）」+ `:140`-`:142` 口径行（命令/as-of/分解 47+724+0 + 「以复测读数 771 为单一读数」裁定）+ `:120` T-6 同步 771 ✓ |
| 6 | 🟡 | 已修 | `DOC-DISCIPLINE.md:793`「…保留为参照历史、只读红线（**§1.20 层 0-2 不变**）；**§4.2.8 族已随 v2 单引擎收敛撤除**（本档 §4.2.8 已标失效——族零射程 · 已无机检豁免面可言）…」✓ + `:825` 变更记录同批 |
| 7 | 🔵 | 已修 | 批档 `:57`（第 2 行改动列）= 「`:89-94` `includes` → 集合相等（工程 + 普通两支，各一条 deepEqual）（③）· `:3` `:96` 去裸节号（④——评审轮 1 发现 7 补载）」+ Δ 分列「③ +2 · ④ ±0」✓ |
| 8 | 🔵 | 已修 | 批档 `:103`（AC-1）= 「…且**工程分支判据行**不再以 `includes` 断枚举（改 `[...enum].sort()` 集合相等）；**普通分支负断言（`:92` `!…includes("eng-designer")`）保留**——T-2 边界例，非本 AC 射程；「整档 `includes` 零命中」**不作判据**（评审轮 1 发现 8）」✓（余 1 处跨档措辞张力 → 新增 3） |
| 9 | 🔵 | 已修 | 批档 `:52` 口径行 = 「行数三件只对**源 / 测试档（`.mjs` / `.cjs`）**保留；`.md` 行与其余非源档（`.json`）两列填 `—`、**行保留**」+ `:62-66` 五行两列均 `—` ✓（余第 12 行 → 新增 1） |
| 10 | 🔵 | 已修 | 批档 `:59` 第 4 行 = **232**；fresh 实核 `batch-segment.test.mjs`（223-233 窗口）233 元素 ⇒ `wc -l` **232** ✓；同表其余读数复核相符（setup-tooltable 229 · eng-designer-role 196 · files 82 · prompts-mirror 152 · package.json 134 · setup.mjs 481 · README 65）✓ |
| 11 | 🔵 | 已修 | 批档 `:134`（§2.6-1）= 「**需求档同步（已收口——父侧 2026-09-18 直接执行）**：`docs/core/requirements/RELEASE.md:46`（V-F1）现文 = 链 `lint && npm test` + 明记 `doc:check` **移出发布门**…⇒ **无需二次改写**」+ `RELEASE.md:46` 现文含「**2026-09-18 收正（VSC 收尾批 · 父侧直接执行）**…」✓ |

**新增发现（fix 轮引入 / 本轮新见）**：

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 方法（表形态自违） | 🔵 | 批档 `:52` 口径行定「其余非源档（`.json`）两列填 `—`」，但第 12 行 `:67` = `| 12 | \`thincoder-vscode/test/fixtures/doc-consistency-baseline.json\` | 6 | −6 | **整档删除**…|` 为 `.json` 却填数值（第 7 行 `package.json` 已按口径改 `—`）⇒ 同表内口径自违 | 二选一：第 12 行两列改 `—`（删除面读数移入改动列），或口径行补「整档删除行例外：记 `现`/`−现`」 |
| 2 | 数值（读数陈述） | 🔵 | 批档 `:106`（AC-4）「**设计轮复测**：域内 **1 处** = 夹具档 `:2`…」与 `:171`「`grep -rn '§2\.2[02]' thincoder-vscode/src thincoder-vscode/test` ⇒ **1 处**（= 夹具档 `:2`）」按字面不可复现——fresh 同命令 = **12 处**（11 处 = 本批 ④ 面 + 夹具 1 处）；「1 处」只在「④ 面外残余」口径下成立 | 改为「**④ 面外**域内残 1 处（= 夹具档）」或给命令加排除式，免实施轮按字面误读 |
| 3 | 一致性（同题两档措辞） | 🔵 | 批档 `:103`「**普通分支负断言（`:92`）保留**」vs `AGENT-LOOP-SUBAGENT.md:736`（§6.24）「…普通分支**同法**对 `["coder", "explore", "plan"]`」+ 批档 `:57`「工程 + 普通两支，**各一条 deepEqual**」——`:92` 落法（保留负断言 ∥ 换集合相等）两档措辞不一（两种落法皆绿；`:92` 现文 = `assert.ok(!modeRoleField(false).role.enum.includes("eng-designer"), "普通模式 enum 不含（模式互斥）")`） | §6.24 补一从句与 AC-1 对齐（如「普通分支：加集合相等；`:92` 负断言照留——冗余无害」） |
| 4 | 协调项（未来悬空） | 🟡 | 批档 `:145`（§2.6-10）自陈「夹具档删除后，本设计档 / 本批档内对该档的**回指行可能转悬空**（路径锚）…按需加 `（迁移期引文` 标记或改述（本席落笔时该档在位 ⇒ 当下零悬空）」——但域内回指**必转悬空**（非「可能」）：`TESTING.md:350` 与 `:357` 两行各含一处 `thincoder-vscode/test/fixtures/doc-consistency-baseline.json` 路径 token（在效面 `docs/**` 内；删除后档根解析失败 ∧ basename 计数 0 ⇒ 无救回支）；且「加标记」支与本批 §2.5 判据 1 自陈的 §4.2.10 族到期条件（标记数回 0）相抵 | 设计轮先定修法：优先**改述**（去可解析路径 token 形态，如「`test/fixtures/` 下孤儿夹具（本批删除）」）；若确保留路径形态则登记「永久标记 + 理由」，免实施轮临场择支 |

计数：🔴 0 · 🟡 1 · 🔵 3 = **4 条**（轮 1 的 11 条 = 11/11 已落位）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-18 03:28 用户「按你的建议吧」= 本批授权**（父侧四条建议之②③：镜像树退役 + `doc:check` 域取向 + 第三面 + 裸节号）；**① 的执行延后**（四条前提 + 窗口在档——定判已审）。设计评审：轮 1 = changes-required（🔴1 · 🟡5 · 🔵5）→ fix 轮（id=76 · 11/11）→ 轮 2 = **PASS** ⇒ 实施轮派发（eng-coder · initial · 2026-09-18 03:5x）。**父侧随轮直改**：`TESTING.md` 两处路径 token 改述（防夹具删除后自伤悬空——评审轮 2 新增 🟡 的裁定处置）；`RELEASE.md:46` 已收口（V-F1 域链收正）。

## §5 实施记录（eng-coder）

**段位**：实施轮（initial · eng-coder）。改动面 = §2.2 受影响表 12 行（11 档 + 第 12 行夹具整档删除）；`docs/**` 零触碰；未 commit；① 镜像树迁移零执行（批档 §4 明文）。

**交付摘要（逐件 · 回指 §2.1 裁定）**

| 件 | 落位 | 形态 |
|---|---|---|
| ③ enum | `thincoder-vscode/src/agent/setup-tooltable.mjs:216` | `enum: ["explore", "eng-designer", "eng-coder"],`——F5 集与序（§6.22 F5）；**不 import 核常量**（端侧自持字面量）；与核 `thincoder-core/agent/family-tools.mjs:46` 逐字同集 |
| ③ 判据 | `thincoder-vscode/test/eng-designer-role.test.mjs:90-95` | 工程 / 普通两支各 `[...enum].sort()` + `deepEqual`（`:92` / `:93`）；`:94` 普通分支负断言**保留**（AC-1 边界例）；`:3` / `:98` 去裸节号（Δ ③ +2 · ④ ±0） |
| ④ 12 行 | `test/files.mjs:47/:48/:52` · `test/eng-designer-role.test.mjs:3/:98` · `test/batch-segment.test.mjs:2` · `test/prompts-mirror-anchors.test.mjs:4/:18/:44/:81` · `src/agent/setup.mjs:309` | 去裸节号 → 自足表述（面名 + 批号）；能指到活档者加「现行权威 = <doc> §N」（`BATCH-RECORD.md` §4 / §4.2 · `AGENT-LOOP-SUBAGENT.md` §6.24 · `PROMPT-SYSTEM.md` §6——三档活档节号已核） |
| ④ 夹具 | `thincoder-vscode/test/fixtures/doc-consistency-baseline.json` | **整档删除**（删前复核：全仓 `.mjs`/`.js`/`.json` 零消费方） |
| ② 门链 | `thincoder-vscode/package.json:117` / `:125` | `vscode:prepublish` = `npm run lint && npm test`；`doc:check` = `node ../scripts/doc-check.mjs --root ..`（**无 `--domain`**） |
| ② 连带 | `thincoder-vscode/AGENTS.md:118-121`（三行 → 四行）· 仓根 `README.md:10/:11/:23-:25`（四条命令 → 三条） | 按 §2.2 末块逐字目标形态落位；`:120` 不再声称 prepublish 含文档机检 |

**读数（命令 ⇒ 结果 · 可复跑）**

- **先红（AC-2）**：判据收紧后、enum 未改 ⇒ `cd thincoder-vscode && node --test test/eng-designer-role.test.mjs` ⇒ **exit 1 · fail 1**——`✖ T57 边界：角色 enum…` AssertionError：actual `[ 'eng-coder', 'eng-designer', 'explore', 'plan' ]` / expected `[ 'eng-coder', 'eng-designer', 'explore' ]`（actual 含 `plan`）。enum 改后同命令 ⇒ **exit 0 · 11 pass / 0 fail**。
- **AC-3**：`grep -n 'explore", "plan", "eng-coder' thincoder-vscode/src/agent/setup-tooltable.mjs` ⇒ 零命中；`:216` 逐字 = F5 集。
- **AC-4**：`grep -rn '§2\.2[02]' thincoder-vscode/src thincoder-vscode/test` ⇒ **12 → 0**。
- **AC-5**：`cd thincoder-vscode && npm run doc:check` ⇒ 与仓根 `node scripts/doc-check.mjs` 同读数：`FAIL(锚): 287 条悬空` · `FAIL(行宽): 2 行`（非 0 档 / 非空域 ⇒ 域语义成立；287 / 2 = 他批在途债，非本批面）；`node -e` 读 `package.json` ⇒ prepublish 不含 `doc:check`。
- **AC-6**：`cd thincoder-vscode && npm run lint && npm test` ⇒ **exit 0**（`check-syntax: 192 JS files OK`；`tests 599 / pass 599 / fail 0`）；仓根 `node scripts/doc-check.mjs` **改前 / 改后对表**：闸态悬空行 **291 / 291（新增 0 · 消失 0）** · 计数 287 / 2 同值 ⇒ 本批 authored 零新增悬空锚、零新增超宽行（报告面 1 增 / 10 减 = 他线代码 token 集活动，不入闸）。
- **行数对表（§2.2）**：setup-tooltable 229 ±0 · eng-designer-role 196 → 198（③ +2 · ④ ±0）· files 82 ±0 · batch-segment 232 ±0 · prompts-mirror 152 ±0 · setup.mjs 481 ±0 · package.json 134 ±0 · AGENTS.md 122 → 123 · README 65 → 64 · 夹具 −6。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| D-1 | ④ 替换形态 = 「面名 + 批号（VSC 端镜像批（2026-09-11 · 第 5 批））」；能指到活档者加「现行权威 = <doc> §N」 | TESTING §10.1 修法（自足表述 / 现行权威优先）；所引三档均为活档已核节号 |
| D-2 | 去 `V1` 族名（`prompts-mirror-anchors.test.mjs:18/:44/:81`） | V1 族随 v2 单引擎收敛撤除（DOC-DISCIPLINE：文本纪律面无对应机检器）——留族名 = 引死名 |
| D-3 | 同档**非本族**节号（`§2.15 D` @ `eng-designer-role.test.mjs:2` · `§2.30` @ `files.mjs:74`）**未动** | 不在 ④ 族枚举 / AC-4 判据域（`§2\.2[02]`）；TESTING §10.1「出界」句归台账 #42——不静默扩域 |
| D-4 | 仓根 README 行尾注用 §2.2 逐字契约的中文原句（该档余文为英文） | 契约块 = 逐字；语言一致性让位于契约（父侧如判英文更佳：单行可换） |
| D-5 | 夹具删除走 force（git 跟踪档） | §2.2 第 12 行明文「整档删除」；删前复核零消费方 |

**提请父侧裁决（本席未处置 · 不越设计笔）**

1. `thincoder-vscode/AGENTS.md:117`（`**Unit tests** (`npm test`, fast layer)` + 2026-09-15 快层基线「553 例…35 skip」）与改后 `:118`（`npm test` = the single entry）**块内张力**：`:117` 不在 §2.2 逐字目标形态（`:118`/`:119`/`:120` + 新增一行）内 ⇒ 本席未动。父侧择一：随同族收正 ∥ 登记为批外项（advisor 评审 🟡 · 非 must-fix）。
2. `src/agent/setup.mjs` 越 300 软线（481 行）= §2.2 已登记超档项 ⇒ 按 R3 不重开、不动本批。
3. `§2.15 D` / `§2.30` 同物种死指针（归档 v1 档）= TESTING §10.1「出界」句所辖 #42 面——只登记、不夹带。

**审计与代码评审轮次与终态**

- **内层收敛审计**（explore · 只读 · 阻塞 · 1 轮）：四类偏差（未实现 / 静默简化 / 批外改 / 文档漂移）**0 · 0 · 0 · 0**；AC-1–AC-7 逐条 met（AC-2 / AC-6 的实跑面由该席标「coder 自报 · 未复跑」——审计无执行通道；AC-3 / AC-4 由其独立 grep 复现）。
- **内层代码评审**（advisor · code · 1 轮）：**VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 2）；两条 🟡 均判**非 must-fix**（= 上「提请父侧裁决」1 / 2）；两条 🔵 = 上「提请父侧裁决」3 + 「`doc:check` 非门入口当下红读数属既有仓级债」提示。
- **fix round = 0**（无 must-fix 项）；**终态 = clean**（审计 0 偏差 + 评审 pass）。
- 评审宿主引用校验两条失配（`test/run.mjs:2`「file unreadable」· `AGENTS.md:117` content mismatch）：本席已各自复核原文成立（`test/run.mjs:2` = 「统一测试入口（M10 测试纪律：单一 `npm test` 全绿门禁——2026-09-17）」；`AGENTS.md:117` 含「Unit tests (`npm test`, fast layer)」）——失配面 = 评审侧引用形态 / 路径基数，实质断言成立。

**他线夹带说明（非本批改动 · 如实披露）**

- `thincoder-vscode/src/extension/panel-index.mjs` 与 `thincoder-core/memory/**`（含新增 `memory/origin.mjs`）在他线在途（未提交）；其间一次 `npm test` 见 2 失败（`test/memory-index-face.test.mjs` A-K12/A-K13「built = 核库有行」）——独立探针实证 = core 写入 `origin` 归一字形（`C:/…`）而端侧读点比较原样 cwd（`C:\…`）；该线随后把读点改经 `normalizeOrigin` ⇒ 复跑 7/7 绿、包内全量 599/599 绿。**非本批面**（该两档不在本批文件域）。

**拟增 CHANGELOG 行（`thincoder-vscode/CHANGELOG.md` = 父侧维护面 · 本席零触碰）**

```
## [Unreleased]

### Changed

- **发布门链收正**：`vscode:prepublish` = `npm run lint && npm test`——`doc:check` 移出发布门（发布门不挂仓级文档债）；`npm run doc:check` 改走仓根域（`node ../scripts/doc-check.mjs --root ..`；非发布门，与 CI docs 作业同命令）。
```

**零改面**：`docs/**`（含 `docs/core/requirements/**`）· `thincoder-core/**` · `thincoder-vscode/docs/**`（镜像树 · ① 零执行）· `_archive/**` · 提示词面 · `thincoder-vscode/CHANGELOG.md` · §2.2「同族未入表项」块全体（`publish-all.mjs` 两处 · 五处测试档注释 · `docs/cli/design/RELEASE.md` 环名）——全部零触碰；未 commit。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：AC-1–AC-7 逐条落位；**AC-4 前后对照 = 12 → 0**（`grep -rn &apos;§2\.2[02]&apos; thincoder-vscode/src thincoder-vscode/test`）；包内 `npm run lint &amp;&amp; npm test` = **599/599 exit 0**；仓根 `doc-check` 悬空 287 / 行宽 2 · 闸态行 291/291（**本批 authored 零新增**）；先红证据在册（enum 未改 ⇒ fail 1 · actual 含 `plan`）。
- **提交**：`2af7c55c`（10 档 · +27/−31 · 含夹具整档删除）。
- **父侧随轮（标记：父侧直接执行）**：`CHANGELOG.md` 增 `[Unreleased] → Changed` 两条（父侧维护面）；`AGENTS.md:117`「fast layer」措辞与 `:118` 单入口句的块内张力收正；仓根 `README.md:25` 行尾注改英文（与全档语言一致）。
- **① 执行延后**（四条前提 + 窗口在档——`VSC-MIGRATION.md` §2.5；**台账 #22 保持未决**）。
- **残留（已归位）**：CLI 侧同形孤儿夹具 + `§2.15 D` / `§2.30` 归档档死指针族 ⇒ `#42` 面（`TESTING.md` §10.1「出界」句所辖）；`setup.mjs` 481 越 300 软线 = 本批已登记（拆分线在档）。
- **三账**：台账 **#22 / #49 / #52** 的可执行面完成（#22 的迁移执行留待窗口）；批档冻结；收口日期 2026-09-18。
